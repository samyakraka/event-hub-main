"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/contexts/AuthContext"
import { collection, query, where, getDocs, limit } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Event, Ticket } from "@/types"
import { Search, Calendar, MapPin, Clock, TicketIcon } from "lucide-react"
import { format } from "date-fns"
import { EventRegistrationDialog } from "./EventRegistrationDialog"
import { VirtualEventPage } from "../events/VirtualEventPage"
import { MyTicketsDialog } from "./MyTicketsDialog"

export function AttendeeDashboard() {
  const { user, logout } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [myTickets, setMyTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [selectedVirtualEventId, setSelectedVirtualEventId] = useState<string | null>(null)
  const [showMyTickets, setShowMyTickets] = useState(false)

  useEffect(() => {
    fetchEvents()
    fetchMyTickets()
  }, [user])

  const fetchEvents = async () => {
    try {
      // Use a simpler query without orderBy to avoid composite index requirement
      const q = query(collection(db, "events"), where("status", "==", "upcoming"), limit(20))
      const querySnapshot = await getDocs(q)
      const eventsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate(),
        createdAt: doc.data().createdAt.toDate(),
      })) as Event[]

      // Sort in memory by date
      eventsData.sort((a, b) => a.date.getTime() - b.date.getTime())
      setEvents(eventsData)
    } catch (error) {
      console.error("Error fetching events:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMyTickets = async () => {
    if (!user) return

    try {
      // Simplified query without orderBy
      const q = query(collection(db, "tickets"), where("attendeeUid", "==", user.uid))
      const querySnapshot = await getDocs(q)
      const ticketsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
      })) as Ticket[]

      // Sort in memory by creation date (newest first)
      ticketsData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      setMyTickets(ticketsData)
    } catch (error) {
      console.error("Error fetching tickets:", error)
    }
  }

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === "all" || event.type === filterType
    return matchesSearch && matchesType
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading events...</p>
        </div>
      </div>
    )
  }

  if (selectedVirtualEventId) {
    return <VirtualEventPage eventId={selectedVirtualEventId} onBack={() => setSelectedVirtualEventId(null)} />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">EventHub</h1>
              <p className="text-gray-600">Discover amazing events, {user?.displayName}</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={() => setShowMyTickets(true)}>
                <TicketIcon className="w-4 h-4 mr-2" />
                My Tickets ({myTickets.length})
              </Button>
              <Button variant="outline" onClick={logout}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Live Events Section */}
        {events.filter((e) => e.status === "live" && e.isVirtual).length > 0 && (
          <Card className="mb-8 border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center text-red-800">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2 animate-pulse"></div>
                Live Events Now
              </CardTitle>
              <CardDescription className="text-red-700">Join these events happening right now</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {events
                  .filter((e) => e.status === "live" && e.isVirtual)
                  .map((event) => (
                    <div key={event.id} className="border rounded-lg p-4 bg-white">
                      <h4 className="font-semibold text-red-800 mb-2">{event.title}</h4>
                      <p className="text-sm text-gray-600 mb-3">{event.description.slice(0, 100)}...</p>
                      <Button
                        onClick={() => setSelectedVirtualEventId(event.id)}
                        className="w-full bg-red-600 hover:bg-red-700"
                      >
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                          Join Now
                        </div>
                      </Button>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* My Tickets Section */}
        {myTickets.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <TicketIcon className="w-5 h-5 mr-2" />
                My Tickets ({myTickets.length})
              </CardTitle>
              <CardDescription>Your registered events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myTickets.slice(0, 6).map((ticket) => {
                  // Find the corresponding event
                  const ticketEvent = events.find((e) => e.id === ticket.eventId)

                  return (
                    <div key={ticket.id} className="border rounded-lg p-4 bg-blue-50">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="secondary">Registered</Badge>
                        {ticket.checkedIn && <Badge className="bg-green-100 text-green-800">Checked In</Badge>}
                      </div>
                      <p className="font-medium">Ticket ID: {ticket.id.slice(0, 8)}...</p>
                      <p className="text-sm text-gray-600 mb-2">QR: {ticket.qrCode.slice(0, 12)}...</p>

                      {ticketEvent && ticketEvent.isVirtual && (
                        <Button
                          size="sm"
                          className="w-full mt-2"
                          onClick={() => setSelectedVirtualEventId(ticket.eventId)}
                          variant={ticketEvent.status === "live" ? "default" : "outline"}
                        >
                          {ticketEvent.status === "live" ? (
                            <div className="flex items-center">
                              <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                              Join Live
                            </div>
                          ) : (
                            "Access Event"
                          )}
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
              {myTickets.length > 6 && (
                <div className="mt-4 text-center">
                  <Button variant="outline" onClick={() => setShowMyTickets(true)}>
                    View All Tickets
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Search and Filter */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  <SelectItem value="gala">Gala</SelectItem>
                  <SelectItem value="concert">Concert</SelectItem>
                  <SelectItem value="marathon">Marathon</SelectItem>
                  <SelectItem value="webinar">Webinar</SelectItem>
                  <SelectItem value="conference">Conference</SelectItem>
                  <SelectItem value="workshop">Workshop</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <Card key={event.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-0">
                {event.bannerBase64 && (
                  <img
                    src={event.bannerBase64 || "/placeholder.svg"}
                    alt={event.title}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                )}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline">{event.type}</Badge>
                    <Badge
                      className={event.ticketPrice === 0 ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}
                    >
                      {event.ticketPrice === 0 ? "Free" : `$${event.ticketPrice}`}
                    </Badge>
                  </div>

                  <h3 className="text-lg font-semibold mb-2">{event.title}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{event.description}</p>

                  <div className="space-y-2 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      {format(event.date, "MMM dd, yyyy")}
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      {event.time}
                    </div>
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      {event.isVirtual ? "Virtual Event" : event.location}
                    </div>
                  </div>

                  <Button
                    className="w-full mt-4"
                    onClick={() => {
                      // Check if user is registered for this event
                      const userTicket = myTickets.find((ticket) => ticket.eventId === event.id)

                      if (event.isVirtual && userTicket) {
                        // If it's a virtual event and user is registered, go to virtual event page
                        setSelectedVirtualEventId(event.id)
                      } else {
                        // Otherwise show registration dialog
                        setSelectedEvent(event)
                      }
                    }}
                    variant={event.status === "live" && event.isVirtual ? "default" : "outline"}
                  >
                    {event.isVirtual && myTickets.find((ticket) => ticket.eventId === event.id) ? (
                      event.status === "live" ? (
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                          Join Live Event
                        </div>
                      ) : (
                        "Join Virtual Event"
                      )
                    ) : (
                      "Register Now"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredEvents.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>

      {selectedEvent && (
        <EventRegistrationDialog
          event={selectedEvent}
          open={!!selectedEvent}
          onOpenChange={() => setSelectedEvent(null)}
          onRegistrationComplete={fetchMyTickets}
        />
      )}

      <MyTicketsDialog open={showMyTickets} onOpenChange={setShowMyTickets} />
    </div>
  )
}
