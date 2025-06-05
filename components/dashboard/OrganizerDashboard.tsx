"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/AuthContext"
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Event } from "@/types"
import { Plus, Calendar, Users, DollarSign, BarChart3 } from "lucide-react"
import { CreateEventDialog } from "./CreateEventDialog"
import { format } from "date-fns"
import { EventDetailsPage } from "../events/EventDetailsPage"
import { EditEventDialog } from "./EditEventDialog"
import { toast } from "@/components/ui/use-toast"

export function OrganizerDashboard() {
  const { user, logout } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateEvent, setShowCreateEvent] = useState(false)
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [totalTickets, setTotalTickets] = useState(0)
  const [showEditEvent, setShowEditEvent] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)

  useEffect(() => {
    fetchEvents()
    fetchRevenueData()
  }, [user])

  const fetchEvents = async () => {
    if (!user) return

    try {
      // Use a simpler query that doesn't require a composite index
      const q = query(collection(db, "events"), where("organizerUid", "==", user.uid))
      const querySnapshot = await getDocs(q)
      const eventsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate(),
        createdAt: doc.data().createdAt.toDate(),
      })) as Event[]

      // Sort in memory instead of using Firestore orderBy
      eventsData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      setEvents(eventsData)
    } catch (error) {
      console.error("Error fetching events:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRevenueData = async () => {
    if (!user) return

    try {
      // Get all events for this organizer
      const eventsQuery = query(collection(db, "events"), where("organizerUid", "==", user.uid))
      const eventsSnapshot = await getDocs(eventsQuery)
      const eventIds = eventsSnapshot.docs.map((doc) => doc.id)

      if (eventIds.length === 0) {
        setTotalRevenue(0)
        setTotalTickets(0)
        return
      }

      // Get all tickets for these events
      let revenue = 0
      let ticketCount = 0

      for (const eventId of eventIds) {
        const ticketsQuery = query(collection(db, "tickets"), where("eventId", "==", eventId))
        const ticketsSnapshot = await getDocs(ticketsQuery)

        ticketsSnapshot.docs.forEach((doc) => {
          const ticket = doc.data()
          revenue += ticket.finalPrice || ticket.originalPrice || 0
          ticketCount++
        })
      }

      setTotalRevenue(revenue)
      setTotalTickets(ticketCount)
    } catch (error) {
      console.error("Error fetching revenue data:", error)
    }
  }

  const deleteEvent = async (eventId: string, eventTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${eventTitle}"? This action cannot be undone.`)) {
      return
    }

    try {
      // Delete the event
      await deleteDoc(doc(db, "events", eventId))

      // Note: In a production app, you might want to also delete related tickets, donations, etc.
      // For now, we'll just delete the event document

      toast({
        title: "Event Deleted",
        description: `"${eventTitle}" has been deleted successfully.`,
      })

      fetchEvents()
      fetchRevenueData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "upcoming":
        return "bg-blue-100 text-blue-800"
      case "live":
        return "bg-green-100 text-green-800"
      case "completed":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (selectedEventId) {
    return <EventDetailsPage eventId={selectedEventId} onBack={() => setSelectedEventId(null)} />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">EventHub</h1>
              <p className="text-gray-600">Welcome back, {user?.displayName}</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button onClick={() => setShowCreateEvent(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Event
              </Button>
              <Button variant="outline" onClick={logout}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Events</p>
                  <p className="text-2xl font-bold text-gray-900">{events.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Events</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {events.filter((e) => e.status === "upcoming" || e.status === "live").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="w-8 h-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">${totalRevenue.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BarChart3 className="w-8 h-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Attendees</p>
                  <p className="text-2xl font-bold text-gray-900">{totalTickets}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Events List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Events</CardTitle>
            <CardDescription>Manage and monitor your events</CardDescription>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No events yet</h3>
                <p className="text-gray-600 mb-4">Get started by creating your first event</p>
                <Button onClick={() => setShowCreateEvent(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Event
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {events.map((event) => (
                  <div key={event.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold">{event.title}</h3>
                          <Badge className={getStatusColor(event.status)}>{event.status}</Badge>
                          <Badge variant="outline">{event.type}</Badge>
                        </div>
                        <p className="text-gray-600 mb-2">{event.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>{format(event.date, "MMM dd, yyyy")}</span>
                          <span>{event.time}</span>
                          <span>{event.isVirtual ? "Virtual" : event.location}</span>
                          <span>${event.ticketPrice === 0 ? "Free" : event.ticketPrice}</span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => setSelectedEventId(event.id)}>
                          Manage
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedEvent(event)
                            setShowEditEvent(true)
                          }}
                        >
                          Edit
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => deleteEvent(event.id, event.title)}>
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <CreateEventDialog
        open={showCreateEvent}
        onOpenChange={setShowCreateEvent}
        onEventCreated={() => {
          fetchEvents()
          fetchRevenueData()
        }}
      />
      <EditEventDialog
        event={selectedEvent}
        open={showEditEvent}
        onOpenChange={setShowEditEvent}
        onEventUpdated={() => {
          fetchEvents()
          fetchRevenueData()
          setSelectedEvent(null)
        }}
      />
    </div>
  )
}
