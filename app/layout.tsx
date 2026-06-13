import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AURA — The most powerful AI in the world",
  description: "AURA is a premium AI-powered creative studio, study tool, and productivity app. Generate images, music, code, and more with the most advanced AI.",
  keywords: ["AI", "creative studio", "productivity", "image generation", "music generation", "study tools"],
  openGraph: {
    title: "AURA — The most powerful AI in the world",
    description: "Premium AI creative studio, study tool & productivity app",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
      </head>
      <body className={`${inter.className} bg-[#0a0a0a] text-white antialiased`}>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#111',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              fontSize: '14px',
            },
          }}
        />
      </body>
    </html>
  );
}
