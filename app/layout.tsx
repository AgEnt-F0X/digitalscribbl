import type { Metadata, Viewport } from 'next'
import { Caveat, Inter, Patrick_Hand, Permanent_Marker, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import ReportIssueButton from '@/components/support/ReportIssueButton'
import { ToastProvider } from '@/components/ui/ToastProvider'

const caveat = Caveat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
})

const patrickHand = Patrick_Hand({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-hand',
  display: 'swap',
})

const permanentMarker = Permanent_Marker({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-marker',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
})

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  title: 'Scribbl — Sign your shirt. Sign theirs.',
  description: 'A one-month digital farewell. Sign your batchmates\' virtual shirts. Keep the memories forever.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Scribbl',
  },
  openGraph: {
    title: 'Scribbl — Sign your shirt. Sign theirs.',
    description: 'A one-month digital farewell. Sign your batchmates\' virtual shirts.',
    type: 'website',
    images: ['/og-image.svg'],
  },
  icons: {
    icon: '/favicon.svg',
  },
}

export const viewport: Viewport = {
  themeColor: '#FFF6D9',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${caveat.variable} ${patrickHand.variable} ${permanentMarker.variable} ${inter.variable} ${jetbrains.variable}`}
    >
      <body suppressHydrationWarning className="font-body">
        {children}
        <ToastProvider />
        <ReportIssueButton />
      </body>
    </html>
  )
}
