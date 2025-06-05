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
import { EventRecommendations } from '@/components/ai/EventRecommendations'

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
      const q = query(collection(db, "events"), where("organizerUid", "==", user.uid))
      const querySnapshot = await getDocs(q)
      const eventsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate(),
        createdAt: doc.data().createdAt.toDate(),
      })) as Event[]

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
      const eventsQuery = query(collection(db, "events"), where("organizerUid", "==", user.uid))
      const eventsSnapshot = await getDocs(eventsQuery)
      const eventIds = eventsSnapshot.docs.map((doc) => doc.id)

      if (eventIds.length === 0) {
        setTotalRevenue(0)
        setTotalTickets(0)
        return
      }

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
      await deleteDoc(doc(db, "events", eventId))
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
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
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-semibold text-gray-800">Welcome back, {user?.displayName} 👋</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button onClick={() => setShowCreateEvent(true)} className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all">
                <Plus className="w-4 h-4 mr-2" />
                Create Event
              </Button>
              <Button 
                onClick={logout} 
                className="bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 rounded-md px-4 py-2 font-medium transition"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white shadow-sm rounded-xl p-5 flex flex-col gap-2">
            <Calendar className="text-blue-500 w-6 h-6" />
            <p className="text-sm text-gray-500">Total Events</p>
            <h2 className="text-2xl font-bold text-gray-800">{events.length}</h2>
          </div>

          <div className="bg-white shadow-sm rounded-xl p-5 flex flex-col gap-2">
            <Users className="text-green-500 w-6 h-6" />
            <p className="text-sm text-gray-500">Active Events</p>
            <h2 className="text-2xl font-bold text-gray-800">
              {events.filter((e) => e.status === "upcoming" || e.status === "live").length}
            </h2>
          </div>

          <div className="bg-white shadow-sm rounded-xl p-5 flex flex-col gap-2">
            <DollarSign className="text-yellow-500 w-6 h-6" />
            <p className="text-sm text-gray-500">Total Revenue</p>
            <h2 className="text-2xl font-bold text-gray-800">${totalRevenue.toFixed(2)}</h2>
          </div>

          <div className="bg-white shadow-sm rounded-xl p-5 flex flex-col gap-2">
            <BarChart3 className="text-purple-500 w-6 h-6" />
            <p className="text-sm text-gray-500">Total Attendees</p>
            <h2 className="text-2xl font-bold text-gray-800">{totalTickets}</h2>
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="mt-8">
          <EventRecommendations events={events} />
        </div>

        {/* Events List */}
        <div className="bg-slate-100 border border-slate-200 rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Your Events</h2>
              <p className="text-sm text-gray-500">Manage and monitor your events</p>
            </div>
          </div>

          {events.length === 0 ? (
            <div className="text-center py-12 bg-white shadow rounded-lg">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">No events yet</h3>
              <p className="text-gray-500 mb-4">Get started by creating your first event</p>
              <Button onClick={() => setShowCreateEvent(true)} className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Event
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <div key={event.id} className="bg-white shadow rounded-lg p-4 flex justify-between items-center">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-medium text-gray-800">{event.title}</h3>
                      <span className={`${getStatusColor(event.status)} text-xs font-semibold px-2.5 py-0.5 rounded`}>
                        {event.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-2">{event.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>{format(event.date, "MMM d, yyyy")}</span>
                      <span>•</span>
                      <span>{event.location}</span>
                      <span>•</span>
                      <span>{event.ticketPrice ? `$${event.ticketPrice}` : "Free"}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => {
                        setSelectedEvent(event)
                        setShowEditEvent(true)
                      }}
                      className="bg-sky-100 text-sky-800 font-medium px-4 py-2 rounded-md hover:bg-sky-200 transition"
                    >
                      Edit
                    </Button>
                    <Button
                      onClick={() => deleteEvent(event.id, event.title)}
                      className="bg-red-100 text-red-800 font-medium px-4 py-2 rounded-md hover:bg-red-200 transition"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showCreateEvent && (
        <CreateEventDialog
          open={showCreateEvent}
          onOpenChange={setShowCreateEvent}
          onEventCreated={() => {
            setShowCreateEvent(false)
            fetchEvents()
          }}
        />
      )}

      {showEditEvent && selectedEvent && (
        <EditEventDialog
          open={showEditEvent}
          onOpenChange={setShowEditEvent}
          event={selectedEvent}
          onEventUpdated={() => {
            setShowEditEvent(false)
            fetchEvents()
          }}
        />
      )}
    </div>
  )
}
