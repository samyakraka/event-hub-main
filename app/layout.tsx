import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/AuthContext"
import { Toaster } from "@/components/ui/toaster"
import { ScrollToTop } from "@/components/ui/scroll-to-top"
import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"
import { ChatBot } from "@/components/ai/ChatBot"
import { ThemeProvider } from "next-themes";
import { cn } from "@/lib/utils"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "EventHub - End-to-End Events Platform",
  description: "Create, manage, and participate in amazing events",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <AuthProvider>
            <Navbar />
            <main>{children}</main>
            <Footer />
            <Toaster />
            <ScrollToTop />
            <ChatBot />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
