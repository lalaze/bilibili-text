import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Bilibili 字幕同步',
  description: 'Bilibili 视频字幕同步工具 - 播放视频并高亮显示当前字幕',
  keywords: ['bilibili', '字幕', '视频', '同步'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <main className="min-h-screen bg-gray-50">{children}</main>
      </body>
    </html>
  )
}

