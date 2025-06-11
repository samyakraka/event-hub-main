"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/AuthContext"
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Event, Ticket } from "@/types"
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  Users,
  Share2,
  Heart,
  Star,
  CheckCircle,
  Globe,
  Video,
  TicketIcon,
} from "lucide-react"
import { format } from "date-fns"
import { toast } from "@/hooks/use-toast"
import { EventRegistrationDialog } from "@/components/dashboard/EventRegistrationDialog"

export default function EventPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [userTicket, setUserTicket] = useState<Ticket | null>(null)
  const [showRegistration, setShowRegistration] = useState(false)
  const [totalAttendees, setTotalAttendees] = useState(0)

  const eventId = params.eventId as string

  useEffect(() => {
    if (eventId) {
      fetchEventDetails()
      fetchUserTicket()
      fetchAttendeeCount()
    }
  }, [eventId, user])

  const fetchEventDetails = async () => {
    try {
      const eventDoc = await getDoc(doc(db, "events", eventId))
      if (eventDoc.exists()) {
        const eventData = {
          id: eventDoc.id,
          ...eventDoc.data(),
          date: eventDoc.data().date.toDate(),
          createdAt: eventDoc.data().createdAt.toDate(),
        } as Event
        setEvent(eventData)
      }
    } catch (error) {
      console.error("Error fetching event:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserTicket = async () => {
    if (!user) return

    try {
      const q = query(collection(db, "tickets"), where("eventId", "==", eventId), where("attendeeUid", "==", user.uid))
      const querySnapshot = await getDocs(q)
      if (!querySnapshot.empty) {
        const ticketData = {
          id: querySnapshot.docs[0].id,
          ...querySnapshot.docs[0].data(),
          createdAt: querySnapshot.docs[0].data().createdAt.toDate(),
        } as Ticket
        setUserTicket(ticketData)
      }
    } catch (error) {
      console.error("Error fetching user ticket:", error)
    }
  }

  const fetchAttendeeCount = async () => {
    try {
      const q = query(collection(db, "tickets"), where("eventId", "==", eventId))
      const querySnapshot = await getDocs(q)
      setTotalAttendees(querySnapshot.size)
    } catch (error) {
      console.error("Error fetching attendee count:", error)
    }
  }

  const shareEvent = async () => {
    if (!event) return

    const shareData = {
      title: event.title,
      text: `Check out this amazing event: ${event.title}`,
      url: window.location.href,
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (error) {
        copyEventLink()
      }
    } else {
      copyEventLink()
    }
  }

  const copyEventLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      toast({
        title: "Link Copied!",
        description: "Event link copied to clipboard",
      })
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading event details...</p>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Event not found</h2>
          <p className="text-gray-600 mb-6">The event you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => router.push("/")} className="bg-gradient-to-r from-blue-600 to-purple-600">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Events
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <Button variant="ghost" onClick={() => router.push("/")} className="flex items-center space-x-2">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Events</span>
            </Button>
            <Button variant="outline" onClick={shareEvent} className="flex items-center space-x-2">
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Share Event</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="relative mb-8">
          {event.bannerBase64 ? (
            <div className="relative h-64 sm:h-80 lg:h-96 rounded-2xl overflow-hidden">
              <img
                src={event.bannerBase64 || "/placeholder.svg"}
                alt={event.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
              <div className="absolute bottom-6 left-6 right-6">
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge
                    className={`${
                      event.status === "live"
                        ? "bg-red-500"
                        : event.status === "upcoming"
                          ? "bg-green-500"
                          : "bg-gray-500"
                    } text-white`}
                  >
                    {event.status === "live" && <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse" />}
                    {event.status.toUpperCase()}
                  </Badge>
                  <Badge variant="outline" className="bg-white/90 text-gray-900">
                    {event.type}
                  </Badge>
                  {event.isVirtual && (
                    <Badge variant="outline" className="bg-white/90 text-purple-700">
                      <Globe className="w-3 h-3 mr-1" />
                      Virtual
                    </Badge>
                  )}
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2">{event.title}</h1>
              </div>
            </div>
          ) : (
            <div className="h-64 sm:h-80 lg:h-96 bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 rounded-2xl flex items-center justify-center">
              <div className="text-center">
                <Calendar className="w-16 h-16 sm:w-20 sm:h-20 text-blue-500 mx-auto mb-4" />
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">{event.title}</h1>
                <div className="flex flex-wrap gap-2 justify-center">
                  <Badge
                    className={`${
                      event.status === "live"
                        ? "bg-red-500"
                        : event.status === "upcoming"
                          ? "bg-green-500"
                          : "bg-gray-500"
                    } text-white`}
                  >
                    {event.status === "live" && <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse" />}
                    {event.status.toUpperCase()}
                  </Badge>
                  <Badge variant="outline">{event.type}</Badge>
                  {event.isVirtual && (
                    <Badge variant="outline" className="text-purple-700">
                      <Globe className="w-3 h-3 mr-1" />
                      Virtual
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Event Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Event Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-700 leading-relaxed">{event.description}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Date</p>
                      <p className="font-semibold">{format(event.date, "EEEE, MMMM dd, yyyy")}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Clock className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Time</p>
                      <p className="font-semibold">
                        {event.time} - {event.endTime}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                      {event.isVirtual ? (
                        <Globe className="w-5 h-5 text-pink-600" />
                      ) : (
                        <MapPin className="w-5 h-5 text-pink-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Location</p>
                      <p className="font-semibold">{event.isVirtual ? "Virtual Event" : event.location}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Price</p>
                      <p className="font-semibold">{event.ticketPrice === 0 ? "Free" : `$${event.ticketPrice}`}</p>
                    </div>
                  </div>
                </div>

                {event.isVirtual && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <Video className="w-5 h-5 text-purple-600 mr-2" />
                      <h4 className="font-semibold text-purple-900">Virtual Event Information</h4>
                    </div>
                    <p className="text-purple-800 text-sm">
                      This is a virtual event. After registration, you'll receive access details to join online.
                      {event.virtualType === "meeting"
                        ? " You'll be able to interact with other attendees and the host."
                        : " Enjoy the live broadcast with interactive chat features."}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Organizer Info */}
            <Card>
              <CardHeader>
                <CardTitle>About the Organizer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Event Organizer</p>
                    <p className="text-gray-600">Professional event management</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Registration Card */}
            <Card className="sticky top-24">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {event.ticketPrice === 0 ? "Free" : `$${event.ticketPrice}`}
                  </div>
                  {event.ticketPrice > 0 && <p className="text-gray-600">per ticket</p>}
                </div>

                {userTicket ? (
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                      <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <p className="font-semibold text-green-900">You're registered!</p>
                      <p className="text-green-700 text-sm">Ticket ID: {userTicket.id.slice(0, 8)}...</p>
                    </div>
                    <Button
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      onClick={() => router.push("/dashboard")}
                    >
                      <TicketIcon className="w-4 h-4 mr-2" />
                      View My Ticket
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Button
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      onClick={() => (user ? setShowRegistration(true) : router.push("/"))}
                      disabled={event.status === "completed"}
                    >
                      {event.status === "completed" ? "Event Ended" : "Register Now"}
                    </Button>
                    {!user && <p className="text-xs text-gray-500 text-center">Sign in required to register</p>}
                  </div>
                )}

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span>Attendees</span>
                    <span className="font-semibold">{totalAttendees}</span>
                  </div>
                  {event.maxAttendees && (
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>Capacity</span>
                      <span className="font-semibold">{event.maxAttendees}</span>
                    </div>
                  )}
                </div>

                <Button variant="outline" className="w-full mt-4" onClick={shareEvent}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Event
                </Button>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Event Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Registered</span>
                  </div>
                  <span className="font-semibold">{totalAttendees}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Star className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Event Type</span>
                  </div>
                  <Badge variant="outline">{event.type}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Heart className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Status</span>
                  </div>
                  <Badge
                    className={`${
                      event.status === "live"
                        ? "bg-red-100 text-red-800"
                        : event.status === "upcoming"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {event.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {event && (
        <EventRegistrationDialog
          event={event}
          open={showRegistration}
          onOpenChange={setShowRegistration}
          onRegistrationComplete={() => {
            fetchUserTicket()
            fetchAttendeeCount()
          }}
        />
      )}
    </div>
  )
}
