"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { collection, query, where, getDocs, limit } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Event } from "@/types"
import { Search, Calendar, MapPin, Clock, Users, Star, Sparkles, Sun } from "lucide-react"
import { format } from "date-fns"
import { AuthPage } from "../auth/AuthPage"
import Link from "next/link"

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

  const allEventsRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 overflow-hidden relative">
      {/* Subtle background effect - Adjusted for dark theme */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-600 rounded-full mix-blend-screen filter blur-xl opacity-50 animate-blob"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600 rounded-full mix-blend-screen filter blur-xl opacity-50 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-600 rounded-full mix-blend-screen filter blur-xl opacity-50 animate-blob animation-delay-4000"></div>
      </div>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative z-10 bg-cover bg-center" style={{ backgroundImage: `url('https://images.pexels.com/photos/2608517/pexels-photo-2608517.jpeg')` }}>
        <div className="absolute inset-0 bg-black opacity-60 z-0"></div>
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <h2 className="text-5xl md:text-7xl font-extrabold text-gray-900 mb-6 leading-tight drop-shadow-lg dark:text-white">
            Create Unforgettable
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent block leading-tight dark:from-blue-400 dark:to-teal-400">
              Events That Connect
            </span>
            People
          </h2>
          <p className="text-xl text-gray-700 mb-12 max-w-4xl mx-auto leading-relaxed drop-shadow dark:text-gray-300">
            The complete platform for event organizers to create, manage, and host both
            physical and virtual events.
          </p>

          {/* Search and Filters - Updated for dark theme, less prominent */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-8 max-w-5xl mx-auto mb-16 border border-gray-700/50 dark:bg-gray-800/50 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-14 rounded-xl border-gray-700 bg-gray-800/50 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-14 rounded-xl border-gray-700 bg-gray-800/50 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm">
                  <SelectValue placeholder="Event Type" />
                </SelectTrigger>
                <SelectContent className="rounded-xl shadow-lg bg-gray-800 text-white border-gray-700">
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
                <SelectTrigger className="h-14 rounded-xl border-gray-700 bg-gray-800/50 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm">
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent className="rounded-xl shadow-lg bg-gray-800 text-white border-gray-700">
                  <SelectItem value="all">All Locations</SelectItem>
                  <SelectItem value="virtual">Virtual</SelectItem>
                  <SelectItem value="physical">In-Person</SelectItem>
                </SelectContent>
              </Select>
              <Button className="h-14 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all">
                <Search className="w-5 h-5 mr-2" />
                Search
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Events */}
      {featuredEvents.length > 0 && (
        <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-800 relative z-10">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h3 className="text-4xl font-bold text-gray-900 mb-3 dark:text-white">Featured Events</h3>
                <p className="text-gray-600 text-lg dark:text-gray-300">Don't miss these amazing upcoming events</p>
              </div>
              <Star className="w-10 h-10 text-yellow-400" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredEvents.map((event) => (
                <Card
                  key={event.id}
                  className="group hover:shadow-2xl transition-all duration-300 border border-gray-200 rounded-2xl shadow-xl overflow-hidden transform hover:-translate-y-2 relative dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                >
                  <div className="relative">
                    {event.bannerBase64 ? (
                      <img
                        src={event.bannerBase64 || "/placeholder.svg"}
                        alt={event.title}
                        className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300 ease-in-out"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center group-hover:scale-105 transition-transform duration-300 ease-in-out dark:from-blue-800 dark:to-purple-800">
                        <Calendar className="w-16 h-16 text-blue-500 opacity-70 dark:text-blue-400" />
                      </div>
                    )}
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0">
                        <Star className="w-3 h-3 mr-1" />
                        Featured
                      </Badge>
                    </div>
                    <div className="absolute top-4 right-4">
                      <Badge variant="outline" className="bg-gray-700 text-white">
                        {event.type}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-6 space-y-4">
                    <h4 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors leading-tight dark:text-white dark:group-hover:text-blue-400">
                      {event.title}
                    </h4>
                    <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed dark:text-gray-400">
                      {event.description}
                    </p>

                    <div className="space-y-3 text-gray-700 dark:text-gray-300">
                      <div className="flex items-center text-sm">
                        <Calendar className="w-4 h-4 mr-2 text-blue-500 dark:text-blue-400" />
                        {format(event.date, "MMM dd, yyyy")}
                      </div>
                      <div className="flex items-center text-sm">
                        <Clock className="w-4 h-4 mr-2 text-purple-500 dark:text-purple-400" />
                        {event.time}
                      </div>
                      <div className="flex items-center text-sm">
                        <MapPin className="w-4 h-4 mr-2 text-green-500 dark:text-green-400" />
                        {event.isVirtual ? "Virtual Event" : event.location}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                      <div className="flex items-center space-x-2">
                        <Badge
                          className={
                            event.ticketPrice === 0 ? "bg-green-100 text-green-800 dark:bg-green-700 dark:text-white" : "bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-white"
                          }
                        >
                          {event.ticketPrice === 0 ? "Free" : `$${event.ticketPrice}`}
                        </Badge>
                      </div>
                      <Button
                        onClick={() => setShowAuth(true)}
                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all"
                      >
                        Register
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Events */}
      <section ref={allEventsRef} className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-900 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-3xl font-bold text-white mb-2">All Events</h3>
              <p className="text-gray-400">Explore all upcoming events</p>
            </div>
            <div className="flex items-center text-sm text-gray-400">
              <Users className="w-4 h-4 mr-1" />
              {filteredEvents.length} events found
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="overflow-hidden bg-gray-800 border border-gray-700">
                  <div className="w-full h-48 bg-gray-700 animate-pulse" />
                  <CardContent className="p-6">
                    <div className="h-6 bg-gray-700 rounded animate-pulse mb-2" />
                    <div className="h-4 bg-gray-700 rounded animate-pulse mb-4" />
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-700 rounded animate-pulse" />
                      <div className="h-4 bg-gray-700 rounded animate-pulse" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : regularEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {regularEvents.map((event) => (
                <Card
                  key={event.id}
                  className="group hover:shadow-xl transition-all duration-300 border border-gray-700 rounded-2xl shadow-lg overflow-hidden transform hover:-translate-y-1 relative bg-gray-800 text-gray-100"
                >
                  <div className="relative">
                    {event.bannerBase64 ? (
                      <img
                        src={event.bannerBase64 || "/placeholder.svg"}
                        alt={event.title}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300 ease-in-out"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center group-hover:scale-105 transition-transform duration-300 ease-in-out">
                        <Calendar className="w-16 h-16 text-gray-500 opacity-70" />
                      </div>
                    )}
                    <div className="absolute top-4 right-4">
                      <Badge variant="outline" className="bg-gray-700 text-white">
                        {event.type}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-6 space-y-4">
                    <h4 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors leading-tight">
                      {event.title}
                    </h4>
                    <p className="text-gray-400 text-sm line-clamp-2 leading-relaxed">
                      {event.description}
                    </p>

                    <div className="space-y-3 text-gray-300">
                      <div className="flex items-center text-sm">
                        <Calendar className="w-4 h-4 mr-2 text-blue-400" />
                        {format(event.date, "MMM dd, yyyy")}
                      </div>
                      <div className="flex items-center text-sm">
                        <Clock className="w-4 h-4 mr-2 text-purple-400" />
                        {event.time}
                      </div>
                      <div className="flex items-center text-sm">
                        <MapPin className="w-4 h-4 mr-2 text-green-400" />
                        {event.isVirtual ? "Virtual Event" : event.location}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                      <Badge
                        className={
                          event.ticketPrice === 0 ? "bg-green-700 text-white" : "bg-blue-700 text-white"
                        }
                      >
                        {event.ticketPrice === 0 ? "Free" : `$${event.ticketPrice}`}
                      </Badge>
                      <Button
                        onClick={() => setShowAuth(true)}
                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all"
                      >
                        Register
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-300">
              <Calendar className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No events found</h3>
              <p className="text-gray-400">Try adjusting your search criteria</p>
            </div>
          )}
        </div>
      </section>

      {/* Everything You Need Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900 text-gray-100 relative z-10">
        <div className="max-w-7xl mx-auto text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Everything You Need for Successful Events</h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">Our platform provides all the tools you need to create, manage, and host events of any size or format.</p>
        </div>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Feature Card 1: Event Creation */}
          <Card className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-6 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center mb-4">
              <Calendar className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Event Creation</h3>
            <p className="text-gray-400 text-sm">Create beautiful event pages for any type of event with customizable details, branding, and ticketing options.</p>
          </Card>

          {/* Feature Card 2: Ticketing System */}
          <Card className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-6 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-green-600/20 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><path d="M21 16V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2Z"/><path d="M17 14v-4"/><path d="M13 14v-4"/><path d="M9 14v-4"/></svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Ticketing System</h3>
            <p className="text-gray-400 text-sm">Manage free and paid tickets with custom prices, discount codes, and unique QR codes for each attendee.</p>
          </Card>

          {/* Feature Card 3: Check-in Management */}
          <Card className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-6 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-orange-600/20 rounded-full flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-orange-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Check-in Management</h3>
            <p className="text-gray-400 text-sm">Easily check in attendees on-site using QR code scanning or manual lookup and track attendance in real-time.</p>
          </Card>

          {/* Feature Card 4: Live Broadcasting */}
          <Card className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-6 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-purple-600/20 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="15" x="2" y="7" rx="2" ry="2"/><path d="m17 7 5 4-5 4"/><path d="M7 7l-5 4 5 4"/></svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Live Broadcasting</h3>
            <p className="text-gray-400 text-sm">Stream your events to virtual attendees with integrated chat and recording capabilities for post-event access.</p>
          </Card>
        </div>
      </section>

      {/* Host Any Type of Event Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-800 text-gray-100 relative z-10">
        <div className="max-w-7xl mx-auto text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Host Any Type of Event</h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">From intimate gatherings to massive conferences, our platform scales to fit your needs.</p>
        </div>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Event Type Card 1: Conferences & Seminars */}
          <Card className="bg-gray-900 border border-gray-700 rounded-xl shadow-lg overflow-hidden relative group">
            <img src="https://images.pexels.com/photos/2774556/pexels-photo-2774556.jpeg" alt="Conferences & Seminars" className="w-full h-64 object-cover opacity-60 group-hover:scale-105 transition-transform duration-300" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white z-10">
              <h3 className="text-xl font-semibold mb-2">Conferences & Seminars</h3>
              <p className="text-gray-300 text-sm">Professional gatherings with speakers, sessions, and networking opportunities.</p>
            </div>
          </Card>

          {/* Event Type Card 2: Concerts & Performances */}
          <Card className="bg-gray-900 border border-gray-700 rounded-xl shadow-lg overflow-hidden relative group">
            <img src="https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg" alt="Concerts & Performances" className="w-full h-64 object-cover opacity-60 group-hover:scale-105 transition-transform duration-300" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white z-10">
              <h3 className="text-xl font-semibold mb-2">Concerts & Performances</h3>
              <p className="text-gray-300 text-sm">Music events, theater shows, and live performances of all genres.</p>
            </div>
          </Card>

          {/* Event Type Card 3: Marathons & Sports */}
          <Card className="bg-gray-900 border border-gray-700 rounded-xl shadow-lg overflow-hidden relative group">
            <img src="https://images.pexels.com/photos/2827392/pexels-photo-2827392.jpeg" alt="Marathons & Sports" className="w-full h-64 object-cover opacity-60 group-hover:scale-105 transition-transform duration-300" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white z-10">
              <h3 className="text-xl font-semibold mb-2">Marathons & Sports</h3>
              <p className="text-gray-300 text-sm">Running events, races, tournaments, and other sporting activities.</p>
            </div>
          </Card>

          {/* Event Type Card 4: Virtual Experiences */}
          <Card className="bg-gray-900 border border-gray-700 rounded-xl shadow-lg overflow-hidden relative group">
            <img src="https://images.pexels.com/photos/6937870/pexels-photo-6937870.jpeg" alt="Virtual Experiences" className="w-full h-64 object-cover opacity-60 group-hover:scale-105 transition-transform duration-300" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white z-10">
              <h3 className="text-xl font-semibold mb-2">Virtual Experiences</h3>
              <p className="text-gray-300 text-sm">Online webinars, workshops, and digital events accessible from anywhere.</p>
            </div>
          </Card>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900 text-gray-100 relative z-10">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">What Our Users Say</h2>
          <p className="text-xl text-gray-400">Join thousands of event organizers who trust our platform</p>
        </div>
        <div className="max-w-3xl mx-auto relative">
          {/* Left Arrow */}
          <button className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-gray-800/50 hover:bg-gray-800 rounded-full p-2 z-10 shadow-lg transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-6 h-6 text-white">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>

          {/* Testimonial Card */}
          <Card className="bg-gray-800 border border-gray-700 rounded-2xl shadow-xl p-8 relative">
            {/* Quote Icon */}
            <div className="absolute top-6 left-6 opacity-20">
              <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-purple-500">
                <path d="M3 21c0-2.7-.4-5.5-1.5-8C3.3 9.4 6.2 7.5 9 7c1.6-.3 3.1-.5 4-.2 1.1.4 2.1 1.5 3 2.8.8 1.1 1.4 2.3 1.8 3.6-.3 1.1-.7 2.2-1.2 3.3-1.4 2.6-3.2 4.5-5 6-.9.7-1.8 1.1-2.4 1.3-2.5 1-4.4 1-5.2.7-.8-.2-1.4-1.2-1.8-3zm10-1c0-2.7-.4-5.5-1.5-8C13.3 9.4 16.2 7.5 19 7c1.6-.3 3.1-.5 4-.2 1.1.4 2.1 1.5 3 2.8.8 1.1 1.4 2.3 1.8 3.6-.3 1.1-.7 2.2-1.2 3.3-1.4 2.6-3.2 4.5-5 6-.9.7-1.8 1.1-2.4 1.3-2.5 1-4.4 1-5.2.7-.8-.2-1.4-1.2-1.8-3z"/>
              </svg>
            </div>
            <p className="text-xl italic text-gray-300 mb-6 relative z-10">
              "EventsHub transformed how we run our annual conference. The
              platform is intuitive, powerful, and our attendees love the
              experience."
            </p>
            <div className="flex items-center space-x-4 relative z-10">
              {/* Placeholder for user image */}
              <div className="w-12 h-12 rounded-full bg-gray-700 flex-shrink-0"></div>
              <div>
                <p className="font-semibold text-white">Sarah Johnson</p>
                <p className="text-sm text-gray-400">Event Director, TechCorp</p>
              </div>
            </div>
          </Card>

          {/* Right Arrow */}
          <button className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-gray-800/50 hover:bg-gray-800 rounded-full p-2 z-10 shadow-lg transition-colors">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-6 h-6 text-white">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5 15.75 12l-7.5 7.5" />
            </svg>
          </button>
        </div>

        {/* Pagination Dots */}
        <div className="flex justify-center mt-8 space-x-2">
          <div className="w-3 h-3 rounded-full bg-purple-500"></div>
          <div className="w-3 h-3 rounded-full bg-gray-700"></div>
          <div className="w-3 h-3 rounded-full bg-gray-700"></div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-purple-600 via-blue-600 to-purple-700 text-white text-center relative z-10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Host Your Next Amazing Event?</h2>
          <p className="text-xl opacity-90 mb-12">Join thousands of event organizers who trust our platform for everything from small meetups to global conferences.</p>
          <div className="flex justify-center space-x-6">
            <Link href="/signup">
              <Button className="h-14 rounded-xl bg-white text-purple-600 hover:bg-gray-100 transition-colors shadow-lg hover:shadow-xl px-8 text-lg">
                Get Started Free
              </Button>
            </Link>
            <a href="mailto:support@eventshub.com">
              <Button variant="outline" className="h-14 rounded-xl border-2 border-white text-white hover:bg-white/10 transition-colors shadow-lg hover:shadow-xl px-8 text-lg">
                Contact Sales
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900 text-white relative z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          <div>
            <h3 className="text-5xl font-bold text-blue-500 mb-2">5,000+</h3>
            <p className="text-gray-400 text-lg">Events Hosted</p>
          </div>
          <div>
            <h3 className="text-5xl font-bold text-purple-500 mb-2">1M+</h3>
            <p className="text-gray-400 text-lg">Attendees Served</p>
          </div>
          <div>
            <h3 className="text-5xl font-bold text-green-500 mb-2">98%</h3>
            <p className="text-gray-400 text-lg">Satisfaction Rate</p>
          </div>
        </div>
      </section>
    </div>
  )
}
