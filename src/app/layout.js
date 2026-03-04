import "./globals.css";

export const metadata = {
  title: "Free-Flixer",
  description: "Your ultimate streaming destination with premium content",
  manifest: "/manifest.json",
  themeColor: "#000000",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
  },
  keywords: ["streaming", "movies", "tv shows", "entertainment"],
  authors: [{ name: "ChainIT™" }],
  creator: "ChainIT™",
  publisher: "ChainIT™",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#000000",
};

import Navigation from "@components/Navigation";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />

        <link rel="apple-touch-icon-precomposed" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      {/* gradient is now applied to html and body via globals.css */}
      {/* <body className="text-white bg-gradient-to-b from-black via-blue-900 to-black"> */}
      <body className="text-white bg-black">
        {/* Common Navigation for all pages */}
        <Navigation className="fixed top-0 left-0 right-0 z-50" />

        {/* Main content area with proper padding to account for fixed navigation */}
        <main className="min-h-screen pt-16">{children}</main>
      </body>
    </html>
  );
}
