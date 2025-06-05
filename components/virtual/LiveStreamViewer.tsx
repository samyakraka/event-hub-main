"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAuth } from "@/contexts/AuthContext"
import { collection, addDoc, query, where, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Event, LiveChat } from "@/types"
import { Send, Users, Video } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { format } from "date-fns"

interface LiveStreamViewerProps {
  event: Event
  hasAccess: boolean
}

export function LiveStreamViewer({ event, hasAccess }: LiveStreamViewerProps) {
  const { user } = useAuth()
  const [chatMessages, setChatMessages] = useState<LiveChat[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)

  useEffect(() => {
    if (!hasAccess || !event.id) return

    // Real-time listener for chat messages
    const q = query(collection(db, "liveChats"), where("eventId", "==", event.id))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const messages = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp.toDate(),
        })) as LiveChat[]

        // Sort messages in memory by timestamp
        messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
        setChatMessages(messages)
      },
      (error) => {
        console.error("Error listening to chat messages:", error)
      },
    )

    return () => unsubscribe()
  }, [event.id, hasAccess])

  useEffect(() => {
    // Simulate streaming status based on event status
    setIsStreaming(event.status === "live")
  }, [event.status])

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return

    try {
      await addDoc(collection(db, "liveChats"), {
        eventId: event.id,
        userId: user.uid,
        userName: user.displayName || "Anonymous",
        message: newMessage.trim(),
        timestamp: new Date(),
      })
      setNewMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (!hasAccess) {
    return (
      <Card className="w-full">
        <CardContent className="p-8 text-center">
          <Video className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">Access Restricted</h3>
          <p className="text-gray-600">You need to register for this event to access the live stream.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Video Stream */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Video className="w-5 h-5 mr-2" />
              {event.status === "live"
                ? "Live Stream"
                : event.status === "upcoming"
                  ? "Stream Preview"
                  : "Event Recording"}
              {isStreaming && <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">LIVE</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
              {event.virtualLink && event.status === "live" ? (
                <iframe
                  src={event.virtualLink}
                  className="w-full h-full rounded-lg"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="text-white text-center">
                  <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  {event.status === "upcoming" && (
                    <div>
                      <p className="mb-2">Stream will begin at {event.time}</p>
                      <p className="text-sm opacity-75">on {format(event.date, "MMM dd, yyyy")}</p>
                    </div>
                  )}
                  {event.status === "live" && !event.virtualLink && <p>Setting up the stream...</p>}
                  {event.status === "completed" && <p>Event has ended</p>}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Chat */}
      <div className="lg:col-span-1">
        <Card className="h-[600px] flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              {event.status === "live" ? "Live Chat" : "Event Chat"} ({chatMessages.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0">
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {chatMessages.map((message) => (
                  <div key={message.id} className="text-sm">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-blue-600">{message.userName}</span>
                      <span className="text-xs text-gray-500">{message.timestamp.toLocaleTimeString()}</span>
                    </div>
                    <p className="text-gray-800">{message.message}</p>
                  </div>
                ))}
                {chatMessages.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>
                      {event.status === "upcoming"
                        ? "Chat will be available when the event starts"
                        : "No messages yet. Start the conversation!"}
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
            <div className="p-4 border-t">
              <div className="flex space-x-2">
                <Input
                  placeholder={
                    event.status === "upcoming" ? "Chat available when event starts..." : "Type a message..."
                  }
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  maxLength={500}
                  disabled={event.status === "upcoming"}
                />
                <Button onClick={sendMessage} disabled={!newMessage.trim() || event.status === "upcoming"}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
