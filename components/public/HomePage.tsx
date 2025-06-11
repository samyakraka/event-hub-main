"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { collection, query, where, getDocs, limit } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Event } from "@/types"
import {
  Search,
  Calendar,
  MapPin,
  Clock,
  Users,
  Star,
  Sparkles,
  Menu,
  X,
  Filter,
  ArrowRight,
  Play,
  Globe,
  Zap,
  Heart,
  TrendingUp,
  ChevronDown,
  Share2,
} from "lucide-react"
import { format } from "date-fns"
import { AuthPage } from "../auth/AuthPage"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"

interface HomePageProps {
  onAuthSuccess: () => void
}

export function HomePage({ onAuthSuccess }: HomePageProps) {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [dateFilter, setDateFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [locationFilter, setLocationFilter] = useState("all")
  const [showAuth, setShowAuth] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const router = useRouter()

  useEffect(() => {
    fetchPublicEvents()
  }, [])

  const fetchPublicEvents = async () => {
    try {
      const q = query(collection(db, "events"), where("status", "==", "upcoming"), limit(12))
      const querySnapshot = await getDocs(q)
      const eventsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate(),
        createdAt: doc.data().createdAt.toDate(),
      })) as Event[]

      eventsData.sort((a, b) => a.date.getTime() - b.date.getTime())
      setEvents(eventsData)
    } catch (error) {
      console.error("Error fetching events:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === "all" || event.type === typeFilter
    const matchesLocation =
      locationFilter === "all" ||
      (locationFilter === "virtual" && event.isVirtual) ||
      (locationFilter === "physical" && !event.isVirtual)

    return matchesSearch && matchesType && matchesLocation
  })

  const featuredEvents = filteredEvents.slice(0, 3)
  const regularEvents = filteredEvents.slice(3)

  const shareEvent = async (event: Event, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click
    const shareData = {
      title: event.title,
      text: `Check out this amazing event: ${event.title}`,
      url: `${window.location.origin}/events/${event.id}`,
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (error) {
        copyEventLink(event.id)
      }
    } else {
      copyEventLink(event.id)
    }
  }

  const copyEventLink = (eventId: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/events/${eventId}`).then(() => {
      toast({
        title: "Link Copied!",
        description: "Event link copied to clipboard",
      })
    })
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Modern Header */}
      <header className="bg-white/95 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                  EventHub
                </h1>
                <p className="text-sm text-gray-500 hidden md:block">Where memories begin</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              <nav className="flex items-center space-x-6">
                <a href="#events" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">
                  Events
                </a>
                <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">
                  Features
                </a>
                <button
                  onClick={() => router.push("/about")}
                  className="text-gray-600 hover:text-gray-900 transition-colors font-medium"
                >
                  About
                </button>
              </nav>
              <div className="flex items-center space-x-3">
                <Dialog open={showAuth} onOpenChange={setShowAuth}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" className="text-gray-700 hover:text-blue-600 hover:bg-blue-50 font-medium">
                      Sign In
                    </Button>
                  </DialogTrigger>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 hover:from-blue-700 hover:via-purple-700 hover:to-pink-600 shadow-lg hover:shadow-xl transition-all duration-300 font-medium">
                      Get Started
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <AuthPage
                      onSuccess={() => {
                        setShowAuth(false)
                        onAuthSuccess()
                      }}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <Button variant="ghost" size="sm" onClick={() => setShowMobileMenu(!showMobileMenu)} className="p-2">
                {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {showMobileMenu && (
            <div className="md:hidden border-t border-gray-100 py-4 space-y-4">
              <nav className="space-y-3">
                <a href="#events" className="block text-gray-600 hover:text-gray-900 font-medium">
                  Events
                </a>
                <a href="#features" className="block text-gray-600 hover:text-gray-900 font-medium">
                  Features
                </a>
                <a href="#about" className="block text-gray-600 hover:text-gray-900 font-medium">
                  About
                </a>
              </nav>
              <div className="space-y-3 pt-3 border-t border-gray-100">
                <Dialog open={showAuth} onOpenChange={setShowAuth}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" className="w-full justify-start text-gray-700">
                      Sign In
                    </Button>
                  </DialogTrigger>
                  <DialogTrigger asChild>
                    <Button className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 hover:from-blue-700 hover:via-purple-700 hover:to-pink-600">
                      Get Started
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <AuthPage
                      onSuccess={() => {
                        setShowAuth(false)
                        setShowMobileMenu(false)
                        onAuthSuccess()
                      }}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Modern Hero Section */}
      <section className="relative py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-purple-50/30 to-pink-50/50"></div>
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"></div>

        <div className="relative max-w-7xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full text-sm font-medium text-blue-800 mb-8">
            <Zap className="w-4 h-4 mr-2" />
            Join 10,000+ event creators worldwide
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            Create
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 bg-clip-text text-transparent block mt-2">
              Unforgettable
            </span>
            Experiences
          </h1>

          <p className="text-xl sm:text-2xl text-gray-600 mb-10 max-w-4xl mx-auto leading-relaxed">
            From intimate gatherings to grand celebrations, EventHub makes it effortless to create, manage, and
            experience amazing events.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button
              onClick={() => setShowAuth(true)}
              size="lg"
              className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 hover:from-blue-700 hover:via-purple-700 hover:to-pink-600 text-white px-8 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              Start Creating Events
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-2 border-gray-300 hover:border-gray-400 px-8 py-4 text-lg font-semibold"
            >
              <Play className="w-5 h-5 mr-2" />
              Watch Demo
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">50K+</div>
              <div className="text-gray-600 font-medium">Events Created</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">2M+</div>
              <div className="text-gray-600 font-medium">Attendees</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">150+</div>
              <div className="text-gray-600 font-medium">Countries</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">99%</div>
              <div className="text-gray-600 font-medium">Satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything you need to create
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {" "}
                amazing events
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Powerful tools designed to make event management effortless and engaging
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Calendar className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Smart Event Creation</h3>
                <p className="text-gray-600 leading-relaxed">
                  Create stunning events in minutes with our intuitive builder. Add images, set pricing, and customize
                  everything.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Globe className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Virtual & Hybrid Events</h3>
                <p className="text-gray-600 leading-relaxed">
                  Host virtual events with live streaming, interactive chat, and seamless attendee management.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Real-time Analytics</h3>
                <p className="text-gray-600 leading-relaxed">
                  Track registrations, revenue, and engagement with comprehensive analytics and insights.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Enhanced Search and Filters */}
      <section id="events" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Discover Amazing Events</h2>
            <p className="text-xl text-gray-600">Find your next unforgettable experience</p>
          </div>

          {/* Modern Search Bar */}
          <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 max-w-5xl mx-auto mb-16">
            {/* Mobile Filter Toggle */}
            <div className="flex items-center justify-between mb-6 lg:hidden">
              <h3 className="font-semibold text-gray-900 text-lg">Find Events</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 rounded-full"
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
              </Button>
            </div>

            {/* Search Bar - Always Visible */}
            <div className="relative mb-6 lg:mb-0">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search for concerts, galas, workshops..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-14 border-gray-200 focus:border-blue-500 text-base rounded-2xl shadow-sm"
              />
            </div>

            {/* Filters - Desktop Always Visible, Mobile Collapsible */}
            <div
              className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${showFilters || window.innerWidth >= 1024 ? "block" : "hidden lg:grid"}`}
            >
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-12 border-gray-200 rounded-xl">
                  <SelectValue placeholder="Event Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="gala">Gala</SelectItem>
                  <SelectItem value="concert">Concert</SelectItem>
                  <SelectItem value="marathon">Marathon</SelectItem>
                  <SelectItem value="webinar">Webinar</SelectItem>
                  <SelectItem value="conference">Conference</SelectItem>
                  <SelectItem value="workshop">Workshop</SelectItem>
                </SelectContent>
              </Select>
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger className="h-12 border-gray-200 rounded-xl">
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  <SelectItem value="virtual">Virtual</SelectItem>
                  <SelectItem value="physical">In-Person</SelectItem>
                </SelectContent>
              </Select>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="h-12 border-gray-200 rounded-xl">
                  <SelectValue placeholder="Date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Date</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
              <Button className="h-12 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 hover:from-blue-700 hover:via-purple-700 hover:to-pink-600 rounded-xl font-semibold">
                <Search className="w-4 h-4 mr-2" />
                Search Events
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Featured Events */}
      {featuredEvents.length > 0 && (
        <section className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-50/50 to-purple-50/50">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8 sm:mb-12">
              <div>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 flex items-center">
                  <Star className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500 mr-3" />
                  Featured Events
                </h3>
                <p className="text-gray-600 hidden sm:block">Handpicked amazing experiences you won't want to miss</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {featuredEvents.map((event) => (
                <Card
                  key={event.id}
                  className="group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg overflow-hidden bg-white transform hover:-translate-y-2 cursor-pointer"
                  onClick={() => router.push(`/events/${event.id}`)}
                >
                  <div className="relative">
                    {event.bannerBase64 ? (
                      <img
                        src={event.bannerBase64 || "/placeholder.svg"}
                        alt={event.title}
                        className="w-full h-48 sm:h-56 object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-48 sm:h-56 bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 flex items-center justify-center">
                        <Calendar className="w-16 h-16 sm:w-20 sm:h-20 text-blue-500" />
                      </div>
                    )}
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 text-sm font-semibold shadow-lg">
                        <Star className="w-3 h-3 mr-1" />
                        Featured
                      </Badge>
                    </div>
                    <div className="absolute top-4 right-4">
                      <Badge variant="outline" className="bg-white/95 backdrop-blur-sm text-sm font-medium">
                        {event.type}
                      </Badge>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                  <CardContent className="p-6 sm:p-8">
                    <h4 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {event.title}
                    </h4>
                    <p className="text-gray-600 text-sm sm:text-base mb-6 line-clamp-2 leading-relaxed">
                      {event.description}
                    </p>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-center text-sm sm:text-base text-gray-500">
                        <Calendar className="w-4 h-4 mr-3 flex-shrink-0 text-blue-500" />
                        <span className="truncate font-medium">{format(event.date, "MMM dd, yyyy")}</span>
                      </div>
                      <div className="flex items-center text-sm sm:text-base text-gray-500">
                        <Clock className="w-4 h-4 mr-3 flex-shrink-0 text-purple-500" />
                        <span className="truncate font-medium">{event.time}</span>
                      </div>
                      <div className="flex items-center text-sm sm:text-base text-gray-500">
                        <MapPin className="w-4 h-4 mr-3 flex-shrink-0 text-pink-500" />
                        <span className="truncate font-medium">
                          {event.isVirtual ? "Virtual Event" : event.location}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <Badge
                        className={`text-sm font-semibold px-3 py-1 ${
                          event.ticketPrice === 0 ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {event.ticketPrice === 0 ? "Free Event" : `$${event.ticketPrice}`}
                      </Badge>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => shareEvent(event, e)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Share2 className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            setShowAuth(true)
                          }}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                          size="sm"
                        >
                          Register Now
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Enhanced All Events */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 sm:mb-12 space-y-4 sm:space-y-0">
            <div>
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">All Events</h3>
              <p className="text-gray-600 hidden sm:block">Explore all upcoming experiences</p>
            </div>
            <div className="flex items-center text-sm text-gray-500 bg-gray-100 px-4 py-2 rounded-full">
              <Users className="w-4 h-4 mr-2" />
              {filteredEvents.length} events available
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="overflow-hidden border-0 shadow-lg">
                  <div className="w-full h-48 sm:h-56 bg-gray-200 animate-pulse" />
                  <CardContent className="p-6 sm:p-8">
                    <div className="h-6 bg-gray-200 rounded animate-pulse mb-3" />
                    <div className="h-4 bg-gray-200 rounded animate-pulse mb-6" />
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : regularEvents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {regularEvents.map((event) => (
                <Card
                  key={event.id}
                  className="group hover:shadow-xl transition-all duration-300 border-0 shadow-md overflow-hidden bg-white hover:-translate-y-1 cursor-pointer"
                  onClick={() => router.push(`/events/${event.id}`)}
                >
                  <div className="relative">
                    {event.bannerBase64 ? (
                      <img
                        src={event.bannerBase64 || "/placeholder.svg"}
                        alt={event.title}
                        className="w-full h-48 sm:h-56 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-48 sm:h-56 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <Calendar className="w-16 h-16 sm:w-20 sm:h-20 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute top-4 right-4">
                      <Badge variant="outline" className="bg-white/95 backdrop-blur-sm text-sm font-medium">
                        {event.type}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-6 sm:p-8">
                    <h4 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {event.title}
                    </h4>
                    <p className="text-gray-600 text-sm sm:text-base mb-6 line-clamp-2 leading-relaxed">
                      {event.description}
                    </p>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-center text-sm sm:text-base text-gray-500">
                        <Calendar className="w-4 h-4 mr-3 flex-shrink-0 text-blue-500" />
                        <span className="truncate font-medium">{format(event.date, "MMM dd, yyyy")}</span>
                      </div>
                      <div className="flex items-center text-sm sm:text-base text-gray-500">
                        <Clock className="w-4 h-4 mr-3 flex-shrink-0 text-purple-500" />
                        <span className="truncate font-medium">{event.time}</span>
                      </div>
                      <div className="flex items-center text-sm sm:text-base text-gray-500">
                        <MapPin className="w-4 h-4 mr-3 flex-shrink-0 text-pink-500" />
                        <span className="truncate font-medium">
                          {event.isVirtual ? "Virtual Event" : event.location}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <Badge
                        className={`text-sm font-semibold px-3 py-1 ${
                          event.ticketPrice === 0 ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {event.ticketPrice === 0 ? "Free Event" : `$${event.ticketPrice}`}
                      </Badge>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => shareEvent(event, e)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Share2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            setShowAuth(true)
                          }}
                          className="hover:bg-blue-50 hover:border-blue-300 text-sm font-semibold border-2 transition-all duration-300"
                          size="sm"
                        >
                          Register
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 sm:py-20">
              <div className="w-24 h-24 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">No events found</h3>
              <p className="text-gray-600 text-lg mb-8">Try adjusting your search criteria or check back later</p>
              <Button
                onClick={() => setShowAuth(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Create Your Own Event
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 text-white py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold">EventHub</h3>
            </div>
            <p className="text-gray-300 mb-8 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
              Connecting people through amazing experiences. Start your journey today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button
                onClick={() => setShowAuth(true)}
                size="lg"
                className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 hover:from-blue-700 hover:via-purple-700 hover:to-pink-600 shadow-xl hover:shadow-2xl transition-all duration-300 font-semibold"
              >
                <Heart className="w-5 h-5 mr-2" />
                Join EventHub Today
              </Button>
            </div>
            <div className="text-gray-400 text-sm">© 2024 EventHub. Made with ❤️ for event creators worldwide.</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
