"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/AuthContext"
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Event, Ticket } from "@/types"
import { QrCode, Calendar, MapPin, Clock, Copy, CheckCircle } from "lucide-react"
import { format } from "date-fns"
import { toast } from "@/hooks/use-toast"

interface MyTicketsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MyTicketsDialog({ open, onOpenChange }: MyTicketsDialogProps) {
  const { user } = useAuth()
  const [tickets, setTickets] = useState<(Ticket & { event?: Event })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (open && user) {
      fetchMyTickets()
    }
  }, [open, user])

  const fetchMyTickets = async () => {
    if (!user) return

    try {
      // Fetch user's tickets
      const q = query(collection(db, "tickets"), where("attendeeUid", "==", user.uid))
      const querySnapshot = await getDocs(q)
      const ticketsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
      })) as Ticket[]

      // Fetch event details for each ticket
      const ticketsWithEvents = await Promise.all(
        ticketsData.map(async (ticket) => {
          try {
            const eventDoc = await getDoc(doc(db, "events", ticket.eventId))
            if (eventDoc.exists()) {
              const eventData = {
                id: eventDoc.id,
                ...eventDoc.data(),
                date: eventDoc.data().date.toDate(),
                createdAt: eventDoc.data().createdAt.toDate(),
              } as Event
              return { ...ticket, event: eventData }
            }
            return ticket
          } catch (error) {
            console.error("Error fetching event for ticket:", error)
            return ticket
          }
        }),
      )

      // Sort by creation date (newest first)
      ticketsWithEvents.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      setTickets(ticketsWithEvents)
    } catch (error) {
      console.error("Error fetching tickets:", error)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
      })
    })
  }

  const generateQRCodeDataURL = (qrCode: string) => {
    // In a real app, you'd use a QR code library like qrcode
    // For now, we'll return a placeholder or the QR code text
    return `data:image/svg+xml;base64,${btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
        <rect width="200" height="200" fill="white"/>
        <rect x="20" y="20" width="160" height="160" fill="black"/>
        <rect x="30" y="30" width="140" height="140" fill="white"/>
        <text x="100" y="100" textAnchor="middle" fontFamily="monospace" fontSize="8" fill="black">
          ${qrCode.slice(0, 20)}...
        </text>
      </svg>
    `)}`
  }

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>My Tickets</DialogTitle>
            <DialogDescription>Your event tickets and QR codes</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>My Tickets ({tickets.length})</DialogTitle>
          <DialogDescription>Your event tickets and QR codes for check-in</DialogDescription>
        </DialogHeader>

        {tickets.length === 0 ? (
          <div className="text-center py-8">
            <QrCode className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets yet</h3>
            <p className="text-gray-600">Register for events to see your tickets here</p>
          </div>
        ) : (
          <div className="space-y-6">
            {tickets.map((ticket) => (
              <Card key={ticket.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{ticket.event?.title || "Event Details Loading..."}</CardTitle>
                    <div className="flex space-x-2">
                      {ticket.checkedIn && (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Checked In
                        </Badge>
                      )}
                      <Badge variant="outline">{ticket.event?.type}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Event Details */}
                    <div className="lg:col-span-2 space-y-4">
                      {ticket.event && (
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                            {format(ticket.event.date, "MMM dd, yyyy")}
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-2 text-gray-500" />
                            {ticket.event.time}
                          </div>
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                            {ticket.event.isVirtual ? "Virtual Event" : ticket.event.location}
                          </div>
                          <div className="flex items-center">
                            <span className="text-gray-500 mr-2">Price:</span>
                            {ticket.finalPrice === 0 ? (
                              "Free"
                            ) : (
                              <span>
                                ${ticket.finalPrice.toFixed(2)}
                                {ticket.discountAmount && ticket.discountAmount > 0 && (
                                  <span className="text-green-600 ml-1">(${ticket.discountAmount.toFixed(2)} off)</span>
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <div>
                          <span className="text-sm font-medium text-gray-600">Ticket ID:</span>
                          <div className="flex items-center space-x-2 mt-1">
                            <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">{ticket.id}</code>
                            <Button size="sm" variant="outline" onClick={() => copyToClipboard(ticket.id, "Ticket ID")}>
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>

                        <div>
                          <span className="text-sm font-medium text-gray-600">QR Code Data:</span>
                          <div className="flex items-center space-x-2 mt-1">
                            <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono break-all">
                              {ticket.qrCode}
                            </code>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(ticket.qrCode, "QR Code")}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>

                        <div className="text-xs text-gray-500">
                          Registered on {format(ticket.createdAt, "MMM dd, yyyy 'at' HH:mm")}
                        </div>
                      </div>
                    </div>

                    {/* QR Code */}
                    <div className="flex flex-col items-center space-y-2">
                      <div className="text-sm font-medium text-gray-600">QR Code for Check-in</div>
                      <div className="border-2 border-gray-200 rounded-lg p-4 bg-white">
                        <img
                          src={generateQRCodeDataURL(ticket.qrCode) || "/placeholder.svg"}
                          alt="QR Code"
                          className="w-32 h-32"
                        />
                      </div>
                      <div className="text-xs text-gray-500 text-center">
                        Show this QR code at the event for check-in
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
