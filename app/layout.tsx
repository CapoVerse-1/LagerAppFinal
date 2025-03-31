import type { Metadata } from 'next'
import '../styles/app.css'
import Providers from '@/components/Providers'

export const metadata: Metadata = {
  title: 'JTI 1-2-1 Inventory Management',
  description: 'Inventory management system for JTI 1-2-1 project',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
