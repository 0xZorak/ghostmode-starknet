import type { Metadata } from 'next'
import { IBM_Plex_Sans, Tomorrow } from 'next/font/google'
import './globals.css'

const plex = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-plex',
  display: 'swap',
})
const tomorrow = Tomorrow({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-tomorrow',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'GhostMode · Private payment adapters for AI agents',
  description: 'Inspect an x402 payment, compile its STRK20 adapter, and execute the safer route through the user’s Starknet wallet.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${plex.variable} ${tomorrow.variable}`}
      suppressHydrationWarning
    >
      <body>{children}</body>
    </html>
  )
}
