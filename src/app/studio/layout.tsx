// The Studio must render without the storefront shell (Navbar, Footer, CartProvider).
// This layout intentionally overrides the root layout for all /studio/* routes.
export const metadata = { title: 'Maison du Prestige — Studio' }

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return children
}
