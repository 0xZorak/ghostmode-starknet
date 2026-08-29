import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'

const geist = localFont({
  src: '../../node_modules/next/dist/next-devtools/server/font/geist-latin.woff2',
  variable: '--font-geist',
  display: 'swap',
})
const geistMono = localFont({
  src: '../../node_modules/next/dist/next-devtools/server/font/geist-mono-latin.woff2',
  variable: '--font-geist-mono',
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
      className={`${geist.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body>{children}</body>
    </html>
  )
}
