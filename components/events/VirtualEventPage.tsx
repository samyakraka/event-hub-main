"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/AuthContext"
import { doc, getDoc, collection, query, where, getDocs, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Event } from "@/types"
import { ArrowLeft, Calendar, Clock, MapPin } from "lucide-react"
import { format } from "date-fns"
import { LiveStreamViewer } from "../virtual/LiveStreamViewer"

interface VirtualEventPageProps {
  eventId: string
  onBack: () => void
}

export function VirtualEventPage({ eventId, onBack }: VirtualEventPageProps) {
  const { user } = useAuth()
  const [event, setEvent] = useState<Event | null>(null)
  const [hasAccess, setHasAccess] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEventAndAccess()
  }, [eventId, user])

  const fetchEventAndAccess = async () => {
    try {
      // Fetch event
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

      // Check if user has access (registered for event) - simplified query
      if (user) {
        const ticketsQuery = query(
          collection(db, "tickets"),
          where("eventId", "==", eventId),
          where("attendeeUid", "==", user.uid),
        )
        const ticketsSnapshot = await getDocs(ticketsQuery)
        setHasAccess(!ticketsSnapshot.empty)
      }
    } catch (error) {
      console.error("Error fetching event:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!eventId) return

    // Real-time listener for event updates
    const unsubscribe = onSnapshot(
      doc(db, "events", eventId),
      (doc) => {
        if (doc.exists()) {
          const eventData = {
            id: doc.id,
            ...doc.data(),
            date: doc.data().date.toDate(),
            createdAt: doc.data().createdAt.toDate(),
          } as Event
          setEvent(eventData)
        }
      },
      (error) => {
        console.error("Error listening to event updates:", error)
      },
    )

    return () => unsubscribe()
  }, [eventId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading virtual event...</p>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Event not found</h2>
          <Button onClick={onBack}>Go Back</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={onBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Events
              </Button>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-2xl font-bold text-gray-900">{event.title}</h1>
                  {event.status === "live" && (
                    <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full flex items-center">
                      <div className="w-2 h-2 bg-red-500 rounded-full mr-1 animate-pulse"></div>
                      LIVE
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {format(event.date, "MMM dd, yyyy")}
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {event.time} - {event.endTime}
                  </div>
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    {event.virtualType === "meeting" ? "Virtual Meeting" : "Live Broadcast"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Event Description */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>About This Event</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">{event.description}</p>
            {event.isVirtual && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-800">
                  {event.virtualType === "meeting"
                    ? "🎥 This is a virtual meeting event - you'll join via video call"
                    : "📺 This is a live broadcast event with interactive chat"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Event Status Message */}
        {event.status !== "live" && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50">
            <CardContent className="p-4">
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-yellow-600 mr-2" />
                <div>
                  <p className="font-medium text-yellow-800">
                    {event.status === "upcoming" ? "Event Starting Soon" : "Event Completed"}
                  </p>
                  <p className="text-sm text-yellow-700">
                    {event.status === "upcoming"
                      ? `This virtual event will begin at ${event.time} on ${format(event.date, "MMM dd, yyyy")}`
                      : "This event has ended. Thank you for participating!"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Live Stream */}
        <LiveStreamViewer event={event} hasAccess={hasAccess} />
      </div>
    </div>
  )
}
