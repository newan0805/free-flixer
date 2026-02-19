import './globals.css'

export const metadata = {
  title: 'Free Flixer - Netflix Clone',
  description: 'A Netflix-like streaming platform using TMDB API',
  manifest: '/manifest.json',
  themeColor: '#000000',
  icons: [
    { rel: 'icon', url: '/favicon.ico' },
    { rel: 'apple-touch-icon', url: '/icon-192x192.png' },
    { rel: 'mask-icon', url: '/icon-512x512.png', color: '#000000' }
  ]
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#000000" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="bg-black text-white">
        {children}
      </body>
    </html>
  )
}