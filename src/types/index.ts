export type SanityImageRef = {
  asset?: { _ref?: string; _id?: string; url?: string }
}
export type ImageSource = string | SanityImageRef

export interface RichDescriptionTextBlock {
  _type: 'block'
  _key: string
  style?: 'normal' | 'h2' | 'h3'
  children: { _key: string; _type: 'span'; text: string; marks?: string[] }[]
  markDefs?: { _key: string; _type: string }[]
}

export interface RichDescriptionImageBlock {
  _type: 'imageBlock'
  _key: string
  asset?: { _id: string; url: string }
  alt?: string
  size?: 'small' | 'medium' | 'large' | 'full'
  alignment?: 'left' | 'center' | 'right'
}

export type RichDescriptionBlock = RichDescriptionTextBlock | RichDescriptionImageBlock

export interface Product {
  id: string
  slug: string
  name: string
  brand: string
  price: number
  originalPrice?: number
  description: string
  longDescription: string
  richDescription?: RichDescriptionBlock[]
  features: string[]
  images: ImageSource[]
  category: 'classic' | 'sport' | 'luxury' | 'minimalist'
  collectionSlug?: string
  badge?: 'New' | 'Sale' | 'Limited' | 'Bestseller'
  inStock: boolean
  rating: number
  reviews: number
  seo?: ProductSeo
}

export interface ProductSeo {
  title?: string
  description?: string
  keywords?: string[]
  ogImage?: string
}

export interface CartItem {
  product: Product
  quantity: number
}

export interface CartContextType {
  items: CartItem[]
  addItem: (product: Product) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  total: number
  itemCount: number
}

export interface CheckoutForm {
  firstName: string
  lastName: string
  phone: string
  city: string
  address: string
  notes: string
  whatsappConfirm: boolean
}

// ── Sanity CMS types ────────────────────────────────────────────────────────

export interface SiteSettings {
  siteName?: string
  logo?: string
  siteDescription?: string
  announcementBar?: string
  navLinks?: NavLink[]
  whatsappNumber?: string
  phone?: string
  instagramUrl?: string
  facebookUrl?: string
  tiktokUrl?: string
  trustBadges?: TrustItem[]
  footerNavLinks?: NavLink[]
  footerCommitments?: string[]
  footerCopyright?: string
  footerTagline?: string
  footerCtaSubtitle?: string
  metaPixelId?: string
  tiktokPixelId?: string
  googleAnalyticsId?: string
  googleAdsId?: string
  googleSheetsWebhookUrl?: string
  ogImage?: string
}

// ── Order ───────────────────────────────────────────────────────────────────

export type OrderStatus = 'new' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'

export interface OrderItem {
  productName: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export interface Order {
  _id:       string
  orderRef:  string
  status:    OrderStatus
  createdAt: string
  firstName: string
  lastName:  string
  phone:     string
  city:      string
  address:   string
  notes?:    string
  items:     OrderItem[]
  subtotal:  number
  shipping:  number
  total:     number
}

export interface NavLink {
  label: string
  href: string
}

export interface CmsPage {
  title: string
  slug: string
}

export interface TrustItem {
  icon: string
  title: string
  subtitle: string
}

export interface CollectionData {
  value: string
  label: string
  subLabel?: string
  image?: string
  description?: string
}

export interface HomePageData {
  heroTitle?: string
  heroTitleAccent?: string
  heroSubtitle?: string
  heroImage?: string
  heroVideo?: {
    asset?: {
      url: string
      mimeType?: string
    }
  }
  heroCtaPrimary?: string
  heroCtaSecondary?: string
  heroTrustSignals?: string[]
  trustItems?: TrustItem[]
  featuredSectionSubtitle?: string
  featuredSectionTitle?: string
  featuredProducts?: Product[]
  categoriesSubtitle?: string
  categoriesTitle?: string
  featuredCollections?: CollectionData[]
  brandSubtitle?: string
  brandTitle?: string
  brandTitleAccent?: string
  brandText1?: string
  brandText2?: string
  brandImage?: string
  brandYear?: string
  brandFoundedLabel?: string
  brandStats?: { value: string; label: string }[]
  testimonialsSubtitle?: string
  testimonialsTitle?: string
  ctaLabel?: string
  ctaTitle?: string
  ctaDiscount?: string
  ctaSubtitle?: string
  ctaButton?: string
  ctaImage?: string
  newsletterSubtitle?: string
  newsletterTitle?: string
  newsletterText?: string
  seoText?: string
  seo?: ProductSeo
}

export interface PostCard {
  _id:         string
  title:       string
  slug:        string
  publishedAt: string
  excerpt?:    string
  mainImage?:  { asset?: { _ref?: string; _id?: string; url?: string }; hotspot?: unknown; crop?: unknown; alt?: string }
}

export interface Post extends PostCard {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content?: any[]
  author?: string
  _updatedAt?: string
}

export interface Review {
  _id:        string
  name:       string
  rating:     number
  comment:    string
  _createdAt: string
}

export interface HomepageTestimonial {
  _id:          string
  name:         string
  city?:        string
  productName?: string
  rating:       number
  review:       string
  verified?:    boolean
  avatar?:      string
}

