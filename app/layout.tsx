import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './styles/globals.css'
import { OpenAIProvider } from './providers/openai-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Content Editor',
  description: 'AI-powered content creation and editing platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons"
          rel="stylesheet"
        />
      </head>
      <body className={inter.className}>
        <OpenAIProvider>{children}</OpenAIProvider>
      </body>
    </html>
  )
} 