"use client"

import { Sparkles, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { AuthPage } from "@/components/auth/AuthPage"
import Link from 'next/link'
import { useAuth } from "@/contexts/AuthContext"
import { useState } from "react"

export function Navbar() {
  const { user } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 shadow-lg dark:bg-gray-900/80 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4 gap-6">
          <div className="flex items-center space-x-3">
            <Link href="/" className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center hover:scale-105 transition-all">
              <Sparkles className="w-6 h-6 text-white" />
            </Link>
            <div>
              <Link href="/" className="block">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  EventHub
                </h1>
              </Link>
              <p className="text-sm text-gray-600 dark:text-gray-400">Discover Amazing Events</p>
            </div>
          </div>
          <nav className="hidden md:flex items-center space-x-6 text-gray-600 text-sm font-medium dark:text-gray-300">
            <Link href="/" className="hover:text-gray-900 transition-colors dark:hover:text-white">Discover Events</Link>
            <Link href="/about" className="hover:text-gray-900 transition-colors dark:hover:text-white">About</Link>
            <Link href="/contact" className="hover:text-gray-900 transition-colors dark:hover:text-white">Contact</Link>
            <Link href="/dashboard" className="hover:text-gray-900 transition-colors dark:hover:text-white">Dashboard</Link>
          </nav>
          <div className="flex items-center space-x-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="hidden sm:flex text-blue-600 hover:text-blue-700 border-blue-600 hover:border-blue-700 transition-colors dark:text-blue-400 dark:hover:text-blue-300 dark:border-blue-400 dark:hover:border-blue-300 dark:bg-gray-800 dark:hover:bg-gray-700">
                  Log in
                </Button>
              </DialogTrigger>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all rounded-md px-4 py-2">
                  Sign up
                </Button>
              </DialogTrigger>
              <DialogContent>
                <AuthPage onSuccess={() => {}} />
              </DialogContent>
            </Dialog>
            {user ? (
              <Link href="/dashboard">
                <Button className="ml-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
                  Create Event
                </Button>
              </Link>
            ) : (
              <Link href="/signup">
                <Button className="ml-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
                  Create Event
                </Button>
              </Link>
            )}
            {/* Mobile menu button */}
            <button
              className="md:hidden flex items-center justify-center w-10 h-10 rounded-full border border-gray-300 dark:border-gray-700 ml-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Open menu"
            >
              <span className="sr-only">Open menu</span>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>
        </div>
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <nav className="md:hidden flex flex-col space-y-2 py-4 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-900 rounded-lg shadow-lg mt-2">
            <Link href="/" className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors" onClick={() => setMobileMenuOpen(false)}>Discover Events</Link>
            <Link href="/about" className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors" onClick={() => setMobileMenuOpen(false)}>About</Link>
            <Link href="/contact" className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors" onClick={() => setMobileMenuOpen(false)}>Contact</Link>
            <Link href="/dashboard" className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
            {user ? (
              <Link href="/dashboard" className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors" onClick={() => setMobileMenuOpen(false)}>Create Event</Link>
            ) : (
              <Link href="/signup" className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors" onClick={() => setMobileMenuOpen(false)}>Create Event</Link>
            )}
          </nav>
        )}
      </div>
    </header>
  )
} 
