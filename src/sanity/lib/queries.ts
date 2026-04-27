const PRODUCT_FIELDS = /* groq */ `
  "id":          _id,
  "slug":        slug.current,
  name,
  brand,
  price,
  originalPrice,
  description,
  longDescription,
  "richDescription": richDescription[] {
    ...,
    _type == "imageBlock" => {
      ...,
      "asset": asset->{ _id, url }
    }
  },
  features,
  "images": images[]{ _key, _type, "asset": asset->{ _id, _ref, url }, hotspot, crop },
  category,
  "collectionSlug": collection->slug.current,
  badge,
  inStock,
  rating,
  reviews,
  "seo": seo {
    title,
    description,
    keywords,
    "ogImage": ogImage.asset->url,
  }
`

const PRODUCT_CARD_FIELDS = /* groq */ `
  "id":          _id,
  "slug":        slug.current,
  name,
  brand,
  price,
  originalPrice,
  description,
  "images":      images[]{ _key, _type, "asset": asset->{ _id, _ref, url }, hotspot, crop },
  category,
  "collectionSlug": collection->slug.current,
  badge,
  inStock,
  rating,
  reviews,
`

export const ALL_PRODUCTS_QUERY = /* groq */ `
  *[_type == "product"] | order(position asc, _createdAt desc) { ${PRODUCT_CARD_FIELDS} }
`

export const PRODUCT_BY_SLUG_QUERY = /* groq */ `
  *[_type == "product" && slug.current == $slug][0] { ${PRODUCT_FIELDS} }
`

export const PRODUCT_SLUGS_QUERY = /* groq */ `
  *[_type == "product" && defined(slug.current)][].slug.current
`

export const RELATED_PRODUCTS_QUERY = /* groq */ `
  *[_type == "product" && category == $category && _id != $id] | order(position asc, _createdAt desc) [0...4] {
    ${PRODUCT_CARD_FIELDS}
  }
`

export const ALL_COLLECTIONS_QUERY = /* groq */ `
  *[_type == "collection"] | order(order asc) {
    "value": slug.current,
    label,
    subLabel,
    "image": image.asset->url,
    description,
  }
`

export const SITE_SETTINGS_QUERY = /* groq */ `
  *[_type == "siteSettings"][0] {
    siteName,
    "logo": logo.asset->url,
    siteDescription,
    announcementBar,
    navLinks[] { label, href },
    whatsappNumber,
    phone,
    instagramUrl,
    facebookUrl,
    tiktokUrl,
    trustBadges[] { icon, title, subtitle },
    footerNavLinks[] { label, href },
    footerCommitments,
    footerCopyright,
    footerTagline,
    footerCtaSubtitle,
    metaPixelId,
    tiktokPixelId,
    googleAnalyticsId,
    googleAdsId,
    googleSheetsWebhookUrl,
  }
`

export const HOME_PAGE_QUERY = /* groq */ `
  *[_type == "homePage"][0] {
    heroTitle,
    heroTitleAccent,
    heroSubtitle,
    "heroImage": heroImage.asset->url,
    "heroVideo": heroVideo.asset->url,
    heroCtaPrimary,
    heroCtaSecondary,
    heroTrustSignals,
    trustItems[] { icon, title, subtitle },
    featuredSectionSubtitle,
    featuredSectionTitle,
    "featuredProducts": featuredProducts[]-> { ${PRODUCT_CARD_FIELDS} },
    categoriesSubtitle,
    categoriesTitle,
    "featuredCollections": featuredCollections[]-> {
      "value": slug.current,
      label,
      subLabel,
      "image": image.asset->url,
    },
    brandSubtitle,
    brandTitle,
    brandTitleAccent,
    brandText1,
    brandText2,
    "brandImage": brandImage.asset->url,
    brandYear,
    brandFoundedLabel,
    brandStats[] { value, label },
    testimonialsSubtitle,
    testimonialsTitle,
    ctaLabel,
    ctaTitle,
    ctaDiscount,
    ctaSubtitle,
    ctaButton,
    "ctaImage": ctaImage.asset->url,
    newsletterSubtitle,
    newsletterTitle,
    newsletterText,
    "seo": seo { title, description, keywords, "ogImage": ogImage.asset->url },
  }
`

export const PAGE_BY_SLUG_QUERY = /* groq */ `
  *[_type == "page" && slug.current == $slug][0] {
    title,
    "slug": slug.current,
    content,
    "seo": seo { title, description, "ogImage": ogImage.asset->url },
  }
`

export const PAGE_SLUGS_QUERY = /* groq */ `
  *[_type == "page" && defined(slug.current)][].slug.current
`

export const REVIEWS_BY_PRODUCT_QUERY = /* groq */ `
  *[_type == "review" && product._ref == $productId && approved == true]
  | order(_createdAt desc) {
    _id,
    name,
    rating,
    comment,
    _createdAt,
  }
`

export const ALL_POSTS_QUERY = /* groq */ `
  *[_type == "post" && defined(slug.current) && defined(publishedAt)]
  | order(publishedAt desc) {
    _id,
    title,
    "slug": slug.current,
    publishedAt,
    excerpt,
    "mainImage": mainImage { asset, hotspot, crop, alt },
  }
`

export const POST_BY_SLUG_QUERY = /* groq */ `
  *[_type == "post" && slug.current == $slug && defined(publishedAt)][0] {
    _id,
    title,
    "slug": slug.current,
    publishedAt,
    excerpt,
    "mainImage": mainImage { asset, hotspot, crop, alt },
    content,
  }
`

export const POST_SLUGS_QUERY = /* groq */ `
  *[_type == "post" && defined(slug.current) && defined(publishedAt)][].slug.current
`

export const HOMEPAGE_TESTIMONIALS_QUERY = /* groq */ `
  *[_type == "homepageTestimonial"] | order(order asc, _createdAt desc) [0...3] {
    _id,
    name,
    city,
    productName,
    rating,
    review,
    verified,
    "avatar": avatar.asset->url,
  }
`

export const ORDERS_QUERY = /* groq */ `
  *[_type == "order"] | order(createdAt desc) [0...500] {
    _id,
    orderRef,
    status,
    createdAt,
    firstName,
    lastName,
    phone,
    city,
    address,
    notes,
    items[]{ _key, productName, quantity, unitPrice, totalPrice },
    subtotal,
    shipping,
    total,
  }
`
