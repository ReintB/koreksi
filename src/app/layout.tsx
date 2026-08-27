import type { Metadata } from "next"
import { Inter } from "next/font/google"

import "./globals.css"

import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: "Koreksi Tugas",
    template: "%s · Koreksi Tugas",
  },
  description:
    "Sistem koreksi otomatis tugas video praktikum Teknologi Rekayasa Otomasi.",
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id" className={inter.variable} suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}

          <Toaster position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  )
}
