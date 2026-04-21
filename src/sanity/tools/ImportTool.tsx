'use client'

import { useState, useCallback, useMemo } from 'react'
import { useClient } from 'sanity'
import { IntentLink } from 'sanity/router'
import {
  Box, Button, Card, Flex, Grid,
  Label, Select, Spinner, Stack,
  Text, TextArea, TextInput,
} from '@sanity/ui'
import { DownloadIcon, RefreshIcon, CheckmarkIcon } from '@sanity/icons'

// ── types ─────────────────────────────────────────────────────────────────────

interface Extracted {
  type:           'product' | 'collection'
  name:           string
  description:    string
  longDescription: string
  price?:         number
  originalPrice?: number
  brand?:         string
  slug:           string
  images:         string[]
  sourceUrl:      string
  productUrls?:   string[]
  pagesScanned?:  number
}

interface ProductDraft {
  sourceUrl:      string
  fetching:       boolean
  error?:         string
  excluded:       boolean
  name:           string
  description:    string
  longDescription: string
  price:          string
  originalPrice:  string
  brand:          string
  category:       string
  slug:           string
  images:         string[]
  selectedImgs:   string[]
}

type SanityImageEntry = {
  _key:  string
  _type: 'image'
  asset: { _type: 'reference'; _ref: string }
}

// ── constants ─────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: 'luxury',     label: 'Luxe' },
  { value: 'classic',    label: 'Classique' },
  { value: 'sport',      label: 'Sport' },
  { value: 'minimalist', label: 'Minimaliste' },
]

// ── helpers ───────────────────────────────────────────────────────────────────

function toSlug(s: string): string {
  return s.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    .slice(0, 96)
}

function imgKey(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 12)
}

function blankProduct(sourceUrl: string): ProductDraft {
  return {
    sourceUrl, fetching: true, excluded: false,
    name: '', description: '', longDescription: '',
    price: '', originalPrice: '', brand: '',
    category: 'luxury', slug: '', images: [], selectedImgs: [],
  }
}

// ── component ─────────────────────────────────────────────────────────────────

export function ImportTool() {
  const client = useClient({ apiVersion: '2024-01-01' })

  // ── URL / fetch state ───────────────────────────────────────────────────────
  const [url,      setUrl]      = useState('')
  const [fetching, setFetching] = useState(false)
  const [fetchErr, setFetchErr] = useState<string | null>(null)
  const [data,     setData]     = useState<Extracted | null>(null)

  // ── main-document editable fields ───────────────────────────────────────────
  const [docType,          setDocType]          = useState<'product' | 'collection'>('product')
  const [name,             setName]             = useState('')
  const [description,      setDescription]      = useState('')
  const [longDescription,  setLongDescription]  = useState('')
  const [price,            setPrice]            = useState('')
  const [originalPrice,    setOriginalPrice]    = useState('')
  const [brand,            setBrand]            = useState('')
  const [category,         setCategory]         = useState('luxury')
  const [slug,             setSlug]             = useState('')
  const [selectedImgs,     setSelectedImgs]     = useState<string[]>([])

  // ── collection products ─────────────────────────────────────────────────────
  const [products,         setProducts]         = useState<ProductDraft[]>([])
  const [productsFetching, setProductsFetching] = useState(false)
  const [pagesScanned,     setPagesScanned]     = useState(0)

  // ── import state ────────────────────────────────────────────────────────────
  const [importing,         setImporting]         = useState(false)
  const [importErr,         setImportErr]         = useState<string | null>(null)
  const [status,            setStatus]            = useState('')
  const [createdId,         setCreatedId]         = useState<string | null>(null)
  const [createdProducts,   setCreatedProducts]   = useState<{ id: string; name: string }[]>([])

  // ── image upload ────────────────────────────────────────────────────────────

  async function uploadImages(urls: string[], label: string): Promise<SanityImageEntry[]> {
    const out: SanityImageEntry[] = []
    for (let i = 0; i < urls.length; i++) {
      setStatus(`${label} — image ${i + 1}/${urls.length}…`)
      try {
        const proxy = await fetch(`/api/import-image?url=${encodeURIComponent(urls[i])}`)
        if (!proxy.ok) { console.warn(`Image skip (${proxy.status}):`, urls[i]); continue }
        const blob = await proxy.blob()
        if (blob.size < 1024) { console.warn('Image too small, skip:', urls[i]); continue }
        const ext   = (blob.type.split('/')[1] ?? 'jpg').split(';')[0]
        const asset = await client.assets.upload('image', blob, {
          filename: `import-${Date.now()}-${i}.${ext}`,
        })
        out.push({ _key: imgKey(), _type: 'image', asset: { _type: 'reference', _ref: asset._id } })
      } catch (e) { console.warn('Image upload failed:', e) }
    }
    return out
  }

  // ── duplicate check ─────────────────────────────────────────────────────────

  /**
   * Returns the base document ID (no "drafts." prefix) for an existing doc
   * with this slug, or a fresh UUID. Always query published docs so the ID
   * is stable and usable as a reference target.
   */
  async function resolveBaseId(type: string, slugVal: string): Promise<string> {
    const existingId = await client.fetch<string | null>(
      `*[_type == $type && slug.current == $slug && !(_id in path("drafts.**"))][0]._id`,
      { type, slug: slugVal },
    )
    return existingId ?? crypto.randomUUID()
  }

  // ── fetch one product URL ───────────────────────────────────────────────────

  const fetchProduct = useCallback(async (pUrl: string): Promise<Partial<ProductDraft>> => {
    const res  = await fetch(`/api/import-url?url=${encodeURIComponent(pUrl)}`)
    const json = await res.json() as Extracted
    if (!res.ok) throw new Error((json as unknown as { error: string }).error ?? `HTTP ${res.status}`)
    return {
      fetching:       false,
      name:           json.name           ?? '',
      description:    json.description    ?? '',
      longDescription: json.longDescription ?? '',
      price:          json.price  != null  ? String(json.price)         : '',
      originalPrice:  json.originalPrice != null ? String(json.originalPrice) : '',
      brand:          json.brand          ?? '',
      slug:           json.slug           ?? '',
      images:         json.images         ?? [],
      selectedImgs:   json.images         ?? [],
    }
  }, [])

  // ── fetch all products for a collection ─────────────────────────────────────

  const fetchAllProducts = useCallback(async (productUrls: string[]) => {
    setProductsFetching(true)
    setProducts(productUrls.map(u => blankProduct(u)))

    await Promise.all(productUrls.map(async (pUrl, idx) => {
      try {
        const patch = await fetchProduct(pUrl)
        setProducts(prev => prev.map((p, i) => i === idx ? { ...p, ...patch } : p))
      } catch (e) {
        setProducts(prev => prev.map((p, i) =>
          i === idx ? { ...p, fetching: false, error: String(e) } : p,
        ))
      }
    }))

    setProductsFetching(false)
  }, [fetchProduct])

  // ── retry a single failed product ───────────────────────────────────────────

  async function retryProduct(idx: number) {
    const pUrl = products[idx]?.sourceUrl
    if (!pUrl) return
    setProducts(prev => prev.map((p, i) => i === idx ? { ...p, fetching: true, error: undefined } : p))
    try {
      const patch = await fetchProduct(pUrl)
      setProducts(prev => prev.map((p, i) => i === idx ? { ...p, ...patch } : p))
    } catch (e) {
      setProducts(prev => prev.map((p, i) =>
        i === idx ? { ...p, fetching: false, error: String(e) } : p,
      ))
    }
  }

  // ── fetch & parse the pasted URL ────────────────────────────────────────────

  async function handleFetch() {
    const trimmed = url.trim()
    if (!trimmed) return
    setFetching(true)
    setFetchErr(null)
    setData(null)
    setCreatedId(null)
    setCreatedProducts([])
    setImportErr(null)
    setProducts([])
    setPagesScanned(0)

    try {
      const res  = await fetch(`/api/import-url?url=${encodeURIComponent(trimmed)}`)
      const json = await res.json() as Extracted
      if (!res.ok) throw new Error((json as unknown as { error: string }).error ?? `HTTP ${res.status}`)

      setData(json)
      setDocType(json.type)
      setName(json.name             ?? '')
      setDescription(json.description      ?? '')
      setLongDescription(json.longDescription  ?? '')
      setPrice(json.price  != null ? String(json.price)         : '')
      setOriginalPrice(json.originalPrice != null ? String(json.originalPrice) : '')
      setBrand(json.brand ?? '')
      setCategory('luxury')
      setSlug(json.slug ?? '')
      setSelectedImgs(json.images ?? [])
      setPagesScanned(json.pagesScanned ?? 1)

      if (json.type === 'collection' && (json.productUrls?.length ?? 0) > 0) {
        fetchAllProducts(json.productUrls!)
      }
    } catch (e: unknown) {
      setFetchErr(e instanceof Error ? e.message : String(e))
    } finally {
      setFetching(false)
    }
  }

  // ── import ──────────────────────────────────────────────────────────────────

  async function handleImport() {
    const trimmedName = name.trim()
    if (!trimmedName || !data) return
    setImporting(true)
    setImportErr(null)
    setStatus('')

    try {
      const slugVal = slug.trim() || toSlug(trimmedName)

      if (docType === 'product') {
        // ── single product ──────────────────────────────────────────────────
        const uploaded  = await uploadImages(selectedImgs, trimmedName)
        const baseId    = await resolveBaseId('product', slugVal)
        const draftId   = `drafts.${baseId}`

        await client.createOrReplace({
          _id:             draftId,
          _type:           'product',
          name:            trimmedName,
          slug:            { _type: 'slug', current: slugVal },
          brand:           brand.trim() || 'Maison du Prestige',
          description:     description.trim(),
          longDescription: longDescription.trim(),
          price:           parseFloat(price) || 0,
          ...(originalPrice && parseFloat(originalPrice) > 0 && {
            originalPrice: parseFloat(originalPrice),
            badge:         'Sale',
          }),
          category,
          inStock: true,
          rating:  4.9,
          reviews: 0,
          ...(uploaded.length > 0 && { images: uploaded }),
        })

        setCreatedId(draftId)

        // Fire-and-forget: seed fake reviews for the newly created product.
        void fetch('/api/reviews/seed', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ productId: draftId }),
        })

      } else {
        // ── collection + products ───────────────────────────────────────────
        //
        // Reference problem:
        //   • product.collection is a STRONG reference — Sanity rejects
        //     mutations that reference a non-existent document.
        //   • A draft ("drafts.xxx") is invisible to reference validation;
        //     only a published doc ("xxx") satisfies a strong ref.
        //
        // Strategy:
        //   1. Upload all images first (cannot be inside a transaction).
        //   2. Resolve every document ID up front.
        //   3. Build all document shapes in memory.
        //   4. Commit in ONE transaction:
        //        a. Published collection ("xxx")   ← reference anchor
        //        b. Draft collection ("drafts.xxx") ← editable in Studio
        //        c. All product drafts             ← reference "xxx" ✓
        //      If any step fails the transaction rolls back entirely.

        // ── Phase 1: upload images ─────────────────────────────────────────

        setStatus('Upload image collection…')
        const colImgs = await uploadImages(selectedImgs.slice(0, 1), trimmedName)

        const readyProducts = products.filter(
          p => !p.fetching && !p.error && !p.excluded && p.name.trim(),
        )

        const productImages: SanityImageEntry[][] = []
        for (let i = 0; i < readyProducts.length; i++) {
          const p = readyProducts[i]
          setStatus(`Upload images ${i + 1}/${readyProducts.length} — ${p.name.trim()}…`)
          productImages.push(await uploadImages(p.selectedImgs, p.name.trim()))
        }

        // ── Phase 2: resolve IDs ───────────────────────────────────────────

        setStatus('Vérification des doublons…')
        const colSlug   = slugVal
        const colBaseId = await resolveBaseId('collection', colSlug)
        const colDraftId = `drafts.${colBaseId}`

        const productBaseIds: string[] = []
        for (const p of readyProducts) {
          const pSlug = p.slug.trim() || toSlug(p.name.trim())
          productBaseIds.push(await resolveBaseId('product', pSlug))
        }

        // ── Phase 3: build document shapes ────────────────────────────────

        const colFields = {
          _type:       'collection' as const,
          label:       trimmedName,
          slug:        { _type: 'slug' as const, current: colSlug },
          description: description.trim(),
          order:       99,
          ...(colImgs[0] && { image: { _type: 'image' as const, asset: colImgs[0].asset } }),
        }

        const productDocs = readyProducts.map((p, i) => {
          const pName  = p.name.trim()
          const pSlug  = p.slug.trim() || toSlug(pName)
          const pImgs  = productImages[i]
          const pBaseId = productBaseIds[i]
          return {
            _id:             `drafts.${pBaseId}`,
            _type:           'product' as const,
            name:            pName,
            slug:            { _type: 'slug' as const, current: pSlug },
            brand:           p.brand.trim() || 'Maison du Prestige',
            description:     p.description.trim(),
            longDescription: p.longDescription.trim(),
            price:           parseFloat(p.price) || 0,
            ...(p.originalPrice && parseFloat(p.originalPrice) > 0 && {
              originalPrice: parseFloat(p.originalPrice),
              badge:         'Sale' as const,
            }),
            category:   p.category,
            inStock:    true,
            rating:     4.9,
            reviews:    0,
            // Strong reference to the PUBLISHED collection ("colBaseId").
            // The published doc is written in the same transaction so it
            // exists by the time Sanity validates the reference.
            collection: { _type: 'reference' as const, _ref: colBaseId },
            ...(pImgs.length > 0 && { images: pImgs }),
          }
        })

        // ── Phase 4: atomic transaction ────────────────────────────────────

        setStatus('Création des documents…')
        const tx = client.transaction()

        // Published collection — must come first so strong refs resolve.
        tx.createOrReplace({ _id: colBaseId, ...colFields })
        // Draft collection — what the editor sees and edits in Studio.
        tx.createOrReplace({ _id: colDraftId, ...colFields })
        // Product drafts.
        for (const doc of productDocs) tx.createOrReplace(doc)

        await tx.commit()

        setCreatedId(colDraftId)
        setCreatedProducts(
          productDocs.map((doc, i) => ({ id: doc._id, name: readyProducts[i].name.trim() })),
        )

        // Fire-and-forget: seed fake reviews for every imported product.
        void Promise.allSettled(
          productDocs.map(doc =>
            fetch('/api/reviews/seed', {
              method:  'POST',
              headers: { 'Content-Type': 'application/json' },
              body:    JSON.stringify({ productId: doc._id }),
            }),
          ),
        )
      }
    } catch (e: unknown) {
      setImportErr(e instanceof Error ? e.message : String(e))
    } finally {
      setImporting(false)
      setStatus('')
    }
  }

  // ── product helpers ──────────────────────────────────────────────────────────

  function updateProduct(idx: number, patch: Partial<ProductDraft>) {
    setProducts(prev => prev.map((p, i) => i === idx ? { ...p, ...patch } : p))
  }

  function toggleProductImg(idx: number, src: string) {
    setProducts(prev => prev.map((p, i) => {
      if (i !== idx) return p
      const next = p.selectedImgs.includes(src)
        ? p.selectedImgs.filter(u => u !== src)
        : [...p.selectedImgs, src]
      return { ...p, selectedImgs: next }
    }))
  }

  function toggleAllProductImgs(idx: number) {
    setProducts(prev => prev.map((p, i) => {
      if (i !== idx) return p
      const allSel = p.selectedImgs.length === p.images.length
      return { ...p, selectedImgs: allSel ? [] : [...p.images] }
    }))
  }

  // O(1) lookup for the main image grid — recomputed only when selectedImgs changes
  const selectedImgsSet = useMemo(() => new Set(selectedImgs), [selectedImgs])

  // ── derived counts ───────────────────────────────────────────────────────────

  const readyCount  = products.filter(p => !p.fetching && !p.error && !p.excluded && p.name.trim()).length
  const errorCount  = products.filter(p => !p.fetching && !!p.error).length
  const canImport   = !importing && name.trim().length > 0 && (docType === 'product' || !productsFetching)

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <Box padding={5} style={{ maxWidth: 820, margin: '0 auto' }}>
      <Stack space={5}>

        {/* Header */}
        <Stack space={2}>
          <Text size={3} weight="bold">Importer depuis une URL</Text>
          <Text size={1} muted>
            Collez l'URL d'une page produit ou d'une collection. Les données sont extraites
            automatiquement et créées comme brouillons éditables dans Sanity.
          </Text>
        </Stack>

        {/* URL input */}
        <Card padding={4} radius={2} shadow={1}>
          <Stack space={3}>
            <Label size={1}>URL à importer</Label>
            <Flex gap={2}>
              <Box flex={1}>
                <TextInput
                  placeholder="https://…"
                  value={url}
                  onChange={e => setUrl(e.currentTarget.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleFetch() }}
                  disabled={fetching}
                />
              </Box>
              <Button
                text="Analyser"
                tone="primary"
                icon={DownloadIcon}
                loading={fetching}
                disabled={fetching || !url.trim()}
                onClick={handleFetch}
              />
            </Flex>
            {fetchErr && (
              <Card padding={3} tone="critical" radius={2}>
                <Text size={1}>{fetchErr}</Text>
              </Card>
            )}
          </Stack>
        </Card>

        {/* Extracted form */}
        {data && (
          <Card padding={4} radius={2} shadow={1}>
            <Stack space={4}>
              <Text size={2} weight="semibold">Données extraites</Text>

              {/* Type selector */}
              <Stack space={2}>
                <Label size={1}>Type de document</Label>
                <Select value={docType} onChange={e => setDocType(e.currentTarget.value as 'product' | 'collection')}>
                  <option value="product">Produit</option>
                  <option value="collection">Collection</option>
                </Select>
              </Stack>

              {/* Name */}
              <Stack space={2}>
                <Label size={1}>{docType === 'product' ? 'Nom du produit' : 'Libellé de la collection'}</Label>
                <TextInput value={name} onChange={e => setName(e.currentTarget.value)} />
              </Stack>

              {/* Slug */}
              <Stack space={2}>
                <Label size={1}>Slug (URL)</Label>
                <TextInput
                  value={slug}
                  placeholder={toSlug(name) || 'auto-généré depuis le nom'}
                  onChange={e => setSlug(e.currentTarget.value)}
                />
              </Stack>

              {/* Short description */}
              <Stack space={2}>
                <Label size={1}>Description courte (carte produit)</Label>
                <TextArea rows={2} value={description} onChange={e => setDescription(e.currentTarget.value)} />
              </Stack>

              {/* Long description — product only */}
              {docType === 'product' && (
                <Stack space={2}>
                  <Label size={1}>Description longue (page produit)</Label>
                  <TextArea rows={5} value={longDescription} onChange={e => setLongDescription(e.currentTarget.value)} />
                </Stack>
              )}

              {/* Price / original price / brand / category — product only */}
              {docType === 'product' && (
                <Grid columns={[1, 1, 4]} gap={3}>
                  <Stack space={2}>
                    <Label size={1}>Prix (MAD)</Label>
                    <TextInput type="number" min={0} value={price} placeholder="0"
                      onChange={e => setPrice(e.currentTarget.value)} />
                  </Stack>
                  <Stack space={2}>
                    <Label size={1}>Prix barré (MAD)</Label>
                    <TextInput type="number" min={0} value={originalPrice} placeholder="—"
                      onChange={e => setOriginalPrice(e.currentTarget.value)} />
                  </Stack>
                  <Stack space={2}>
                    <Label size={1}>Marque</Label>
                    <TextInput value={brand} onChange={e => setBrand(e.currentTarget.value)} />
                  </Stack>
                  <Stack space={2}>
                    <Label size={1}>Catégorie</Label>
                    <Select value={category} onChange={e => setCategory(e.currentTarget.value)}>
                      {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </Select>
                  </Stack>
                </Grid>
              )}

              {/* Main images */}
              {data.images.length > 0 && (
                <Stack space={2}>
                  <Flex align="center" justify="space-between" gap={3}>
                    <Label size={1}>
                      {docType === 'product'
                        ? `Images — ${selectedImgs.length} / ${data.images.length} sélectionnée(s)`
                        : `Image de la collection — sélectionnez-en une`}
                    </Label>
                    {docType === 'product' && (
                      <Button
                        mode="ghost"
                        fontSize={1}
                        padding={2}
                        text={selectedImgs.length === data.images.length
                          ? 'Tout désélectionner'
                          : 'Tout sélectionner'}
                        onClick={() => setSelectedImgs(
                          selectedImgs.length === data.images.length ? [] : [...data.images],
                        )}
                      />
                    )}
                  </Flex>
                  <Flex gap={2} style={{ flexWrap: 'wrap' }}>
                    {data.images.map(src => {
                      const sel = selectedImgsSet.has(src)
                      return (
                        <Box
                          key={src}
                          title={src}
                          onClick={() => setSelectedImgs(prev =>
                            sel ? prev.filter(u => u !== src) : [...prev, src],
                          )}
                          style={{
                            width: 88, height: 88, cursor: 'pointer',
                            borderRadius: 4, overflow: 'hidden', flexShrink: 0,
                            outline: sel ? '3px solid var(--card-focus-ring-color)' : '2px solid transparent',
                            opacity: sel ? 1 : 0.3,
                            transition: 'opacity .15s, outline .15s',
                          }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`/api/import-image?url=${encodeURIComponent(src)}`}
                            alt=""
                            loading="lazy"
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                          />
                        </Box>
                      )
                    })}
                  </Flex>
                  <Text size={0} muted>
                    {selectedImgs.length === 0
                      ? 'Aucune image sélectionnée — elles ne seront pas importées.'
                      : `${selectedImgs.length} image(s) seront téléchargées dans Sanity.`}
                  </Text>
                </Stack>
              )}

              {/* ── Products section (collection mode) ───────────────────── */}
              {docType === 'collection' && (
                <Stack space={3}>
                  <Flex align="center" gap={3} wrap="wrap">
                    <Text size={2} weight="semibold">
                      Produits : {products.length} trouvé(s)
                      {pagesScanned > 1 && ` — ${pagesScanned} pages scannées`}
                    </Text>
                    {productsFetching && (
                      <Flex gap={2} align="center">
                        <Spinner muted />
                        <Text size={1} muted>Récupération en cours…</Text>
                      </Flex>
                    )}
                    {errorCount > 0 && (
                      <Text size={1} style={{ color: 'var(--card-badge-critical-dot-color)' }}>
                        {errorCount} erreur(s)
                      </Text>
                    )}
                    {readyCount > 0 && !productsFetching && (
                      <Text size={1} muted>{readyCount} prêt(s) à importer</Text>
                    )}
                  </Flex>

                  {products.length === 0 && !productsFetching && (
                    <Card padding={3} tone="caution" radius={2}>
                      <Text size={1}>Aucun produit détecté automatiquement.</Text>
                    </Card>
                  )}

                  {products.map((p, idx) => (
                    <Card
                      key={p.sourceUrl}
                      padding={3} radius={2} shadow={1}
                      tone={p.excluded ? 'transparent' : p.error ? 'critical' : 'default'}
                      style={{ opacity: p.excluded ? 0.45 : 1 }}
                    >
                      {p.fetching ? (
                        <Flex gap={2} align="center">
                          <Spinner muted />
                          <Text size={1} muted style={{ wordBreak: 'break-all' }}>{p.sourceUrl}</Text>
                        </Flex>
                      ) : p.error ? (
                        <Stack space={2}>
                          <Text size={1} muted style={{ wordBreak: 'break-all' }}>{p.sourceUrl}</Text>
                          <Text size={1} style={{ color: 'var(--card-badge-critical-dot-color)' }}>
                            {p.error}
                          </Text>
                          <Button
                            text="Réessayer"
                            tone="default"
                            mode="ghost"
                            icon={RefreshIcon}
                            onClick={() => retryProduct(idx)}
                            style={{ alignSelf: 'flex-start' }}
                          />
                        </Stack>
                      ) : (
                        <Stack space={3}>
                          {/* Header row: name + exclude toggle */}
                          <Flex justify="space-between" align="center" gap={2}>
                            <Box flex={1}>
                              <TextInput
                                value={p.name}
                                placeholder="Nom du produit"
                                onChange={e => updateProduct(idx, { name: e.currentTarget.value })}
                              />
                            </Box>
                            <Button
                              text={p.excluded ? 'Inclure' : 'Exclure'}
                              mode="ghost"
                              tone={p.excluded ? 'positive' : 'critical'}
                              icon={p.excluded ? CheckmarkIcon : undefined}
                              onClick={() => updateProduct(idx, { excluded: !p.excluded })}
                            />
                          </Flex>

                          {!p.excluded && (
                            <>
                              {/* Slug */}
                              <Stack space={1}>
                                <Label size={0}>Slug</Label>
                                <TextInput
                                  value={p.slug}
                                  placeholder={toSlug(p.name) || 'auto-généré'}
                                  onChange={e => updateProduct(idx, { slug: e.currentTarget.value })}
                                />
                              </Stack>

                              {/* Price / original price / brand / category */}
                              <Grid columns={4} gap={2}>
                                <Stack space={1}>
                                  <Label size={0}>Prix (MAD)</Label>
                                  <TextInput
                                    type="number" min={0} value={p.price} placeholder="0"
                                    onChange={e => updateProduct(idx, { price: e.currentTarget.value })}
                                  />
                                </Stack>
                                <Stack space={1}>
                                  <Label size={0}>Prix barré</Label>
                                  <TextInput
                                    type="number" min={0} value={p.originalPrice} placeholder="—"
                                    onChange={e => updateProduct(idx, { originalPrice: e.currentTarget.value })}
                                  />
                                </Stack>
                                <Stack space={1}>
                                  <Label size={0}>Marque</Label>
                                  <TextInput
                                    value={p.brand}
                                    onChange={e => updateProduct(idx, { brand: e.currentTarget.value })}
                                  />
                                </Stack>
                                <Stack space={1}>
                                  <Label size={0}>Catégorie</Label>
                                  <Select
                                    value={p.category}
                                    onChange={e => updateProduct(idx, { category: e.currentTarget.value })}
                                  >
                                    {CATEGORIES.map(c =>
                                      <option key={c.value} value={c.value}>{c.label}</option>,
                                    )}
                                  </Select>
                                </Stack>
                              </Grid>

                              {/* Short description */}
                              <Stack space={1}>
                                <Label size={0}>Description courte</Label>
                                <TextArea
                                  rows={2}
                                  value={p.description}
                                  onChange={e => updateProduct(idx, { description: e.currentTarget.value })}
                                />
                              </Stack>

                              {/* Long description */}
                              {p.longDescription && (
                                <Stack space={1}>
                                  <Label size={0}>Description longue</Label>
                                  <TextArea
                                    rows={4}
                                    value={p.longDescription}
                                    onChange={e => updateProduct(idx, { longDescription: e.currentTarget.value })}
                                  />
                                </Stack>
                              )}

                              {/* Product images */}
                              {p.images.length > 0 && (() => {
                                const pSelSet = new Set(p.selectedImgs)
                                const allSel  = p.selectedImgs.length === p.images.length
                                return (
                                  <Stack space={1}>
                                    <Flex align="center" justify="space-between" gap={2}>
                                      <Label size={0}>
                                        Images — {p.selectedImgs.length} / {p.images.length} sélectionnée(s)
                                      </Label>
                                      <Button
                                        mode="ghost"
                                        fontSize={0}
                                        padding={2}
                                        text={allSel ? 'Tout désélectionner' : 'Tout sélectionner'}
                                        onClick={() => toggleAllProductImgs(idx)}
                                      />
                                    </Flex>
                                    <Flex gap={1} style={{ flexWrap: 'wrap' }}>
                                      {p.images.map(src => {
                                        const sel = pSelSet.has(src)
                                        return (
                                          <Box
                                            key={src}
                                            title={src}
                                            onClick={() => toggleProductImg(idx, src)}
                                            style={{
                                              width: 64, height: 64, cursor: 'pointer',
                                              borderRadius: 3, overflow: 'hidden', flexShrink: 0,
                                              outline: sel ? '2px solid var(--card-focus-ring-color)' : '1px solid transparent',
                                              opacity: sel ? 1 : 0.3,
                                              transition: 'opacity .15s',
                                            }}
                                          >
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                              src={`/api/import-image?url=${encodeURIComponent(src)}`}
                                              alt=""
                                              loading="lazy"
                                              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                            />
                                          </Box>
                                        )
                                      })}
                                    </Flex>
                                  </Stack>
                                )
                              })()}
                            </>
                          )}
                        </Stack>
                      )}
                    </Card>
                  ))}
                </Stack>
              )}

              {/* ── Import action / result ─────────────────────────────────── */}
              {!createdId ? (
                <Stack space={2}>
                  <Flex gap={3} align="center" wrap="wrap">
                    <Button
                      text={
                        docType === 'collection'
                          ? `Importer collection + ${readyCount} produit(s)`
                          : 'Importer comme brouillon'
                      }
                      tone="positive"
                      loading={importing}
                      disabled={!canImport}
                      onClick={handleImport}
                    />
                    {importing && status && (
                      <Flex gap={2} align="center">
                        <Spinner muted />
                        <Text size={1} muted>{status}</Text>
                      </Flex>
                    )}
                  </Flex>
                  {importErr && (
                    <Card padding={3} tone="critical" radius={2}>
                      <Text size={1}>{importErr}</Text>
                    </Card>
                  )}
                </Stack>
              ) : (
                <Card padding={4} tone="positive" radius={2}>
                  <Stack space={3}>
                    <Text size={1} weight="semibold">
                      ✓ {docType === 'collection'
                        ? `Collection + ${createdProducts.length} produit(s) importés`
                        : 'Brouillon créé avec succès'}
                    </Text>

                    <IntentLink intent="edit" params={{ id: createdId, type: docType }} style={{ color: 'inherit' }}>
                      <Text size={1}>
                        Ouvrir {docType === 'collection' ? 'la collection' : 'le produit'} →
                      </Text>
                    </IntentLink>

                    {createdProducts.length > 0 && (
                      <Stack space={1}>
                        <Text size={1} muted>Produits créés :</Text>
                        {createdProducts.map(({ id, name: n }) => (
                          <IntentLink key={id} intent="edit" params={{ id, type: 'product' }} style={{ color: 'inherit' }}>
                            <Text size={1}>{n} →</Text>
                          </IntentLink>
                        ))}
                      </Stack>
                    )}

                    <Button
                      text="Importer une autre URL"
                      mode="ghost"
                      onClick={() => {
                        setData(null); setCreatedId(null); setCreatedProducts([])
                        setUrl(''); setProducts([])
                      }}
                    />
                  </Stack>
                </Card>
              )}

            </Stack>
          </Card>
        )}

      </Stack>
    </Box>
  )
}
