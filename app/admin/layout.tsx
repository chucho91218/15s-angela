import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'Panel · Los 15 de Ángela',
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#f5efe3',
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-admin-root
      className="min-h-dvh bg-[#f5efe3] text-[#14110f] [color-scheme:light]"
    >
      {children}
    </div>
  )
}
