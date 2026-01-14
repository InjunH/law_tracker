import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Law Firm Movement Tracker',
  description: '대한민국 주요 13개 로펌의 변호사 이동을 실시간으로 추적하는 지능형 대시보드',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-96x96.png', type: 'image/png', sizes: '96x96' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  openGraph: {
    title: 'LAW TRACK - Intelligence Platform',
    description: '대한민국 주요 13개 로펌의 변호사 이동을 실시간으로 추적하는 지능형 대시보드',
    images: [
      {
        url: '/og-image.jpeg',
        width: 1200,
        height: 630,
        alt: 'LAW TRACK Intelligence Platform',
      },
    ],
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LAW TRACK - Intelligence Platform',
    description: '대한민국 주요 13개 로펨의 변호사 이동을 실시간으로 추적하는 지능형 대시보드',
    images: ['/og-image.jpeg'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.8/dist/web/variable/pretendardvariable.css"
        />
      </head>
      <body className="font-pretendard antialiased">
        {children}
      </body>
    </html>
  )
}
