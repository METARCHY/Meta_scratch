import type { Metadata } from 'next'
import { Inter, Rajdhani } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const rajdhani = Rajdhani({
    subsets: ['latin'],
    weight: ['300', '400', '500', '600', '700'],
    variable: '--font-rajdhani'
})

export const metadata: Metadata = {
    title: 'Metarchy | Win-to-Earn',
    description: 'Strategy NFT Game on Base',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body className={`${inter.variable} ${rajdhani.variable} font-sans`}>
                <div className="min-h-screen">
                    <Providers>
                        {children}
                    </Providers>
                </div>
            </body>
        </html>
    )
}
