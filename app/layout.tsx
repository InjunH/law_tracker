import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Law Firm Movement Tracker',
  description: '대한민국 주요 13개 로펌의 변호사 이동을 실시간으로 추적하는 지능형 대시보드',
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
