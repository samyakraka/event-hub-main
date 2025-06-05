"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/AuthContext"
import { collection, addDoc, query, where, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Event, LiveChat } from "@/types"
import { Send, Users, Video, Smile, Trash2, Shield } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { format } from "date-fns"

interface LiveStreamViewerProps {
  event: Event
  hasAccess: boolean
}

const EMOJI_LIST = ["👍", "❤️", "😂", "😮", "😢", "🔥", "👏", "🎉"]

export function LiveStreamViewer({ event, hasAccess }: LiveStreamViewerProps) {
  const { user } = useAuth()
  const [chatMessages, setChatMessages] = useState<LiveChat[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [isOrganizer, setIsOrganizer] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (user && event.organizerUid === user.uid) {
      setIsOrganizer(true)
    }
  }, [user, event.organizerUid])

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
    // Auto-scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatMessages])

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
        reactions: {},
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

  const addReaction = async (messageId: string, emoji: string) => {
    if (!user) return

    try {
      const message = chatMessages.find((m) => m.id === messageId)
      if (!message) return

      const reactions = message.reactions || {}
      const emojiReactions = reactions[emoji] || []

      // Toggle reaction
      const userIndex = emojiReactions.indexOf(user.uid)
      if (userIndex > -1) {
        emojiReactions.splice(userIndex, 1)
      } else {
        emojiReactions.push(user.uid)
      }

      reactions[emoji] = emojiReactions

      await updateDoc(doc(db, "liveChats", messageId), {
        reactions: reactions,
      })
    } catch (error) {
      console.error("Error adding reaction:", error)
    }
  }

  const deleteMessage = async (messageId: string) => {
    if (!isOrganizer) return

    try {
      await deleteDoc(doc(db, "liveChats", messageId))
      toast({
        title: "Message Deleted",
        description: "Message has been removed from the chat.",
      })
    } catch (error) {
      console.error("Error deleting message:", error)
      toast({
        title: "Error",
        description: "Failed to delete message.",
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
                event.virtualType === "meeting" ? (
                  <div className="text-white text-center">
                    <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="mb-4">Join the meeting using the link below:</p>
                    <Button
                      onClick={() => window.open(event.virtualLink, "_blank")}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Join Meeting
                    </Button>
                  </div>
                ) : (
                  <iframe
                    src={event.virtualLink}
                    className="w-full h-full rounded-lg"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                )
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

      {/* Enhanced Live Chat */}
      <div className="lg:col-span-1">
        <Card className="h-[600px] flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Live Chat ({chatMessages.length})
              </div>
              {isOrganizer && (
                <Badge variant="secondary" className="text-xs">
                  <Shield className="w-3 h-3 mr-1" />
                  Moderator
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0">
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {chatMessages.map((message) => (
                  <div key={message.id} className="text-sm group">
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`font-medium ${
                            message.userId === event.organizerUid ? "text-purple-600" : "text-blue-600"
                          }`}
                        >
                          {message.userName}
                          {message.userId === event.organizerUid && (
                            <Badge variant="outline" className="ml-1 text-xs">
                              Host
                            </Badge>
                          )}
                        </span>
                        <span className="text-xs text-gray-500">{message.timestamp.toLocaleTimeString()}</span>
                      </div>
                      {isOrganizer && message.userId !== user?.uid && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                          onClick={() => deleteMessage(message.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                    <p className="text-gray-800 mb-2">{message.message}</p>

                    {/* Reactions */}
                    <div className="flex items-center space-x-1 mb-2">
                      {Object.entries(message.reactions || {}).map(([emoji, userIds]) =>
                        userIds.length > 0 ? (
                          <button
                            key={emoji}
                            onClick={() => addReaction(message.id, emoji)}
                            className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                              userIds.includes(user?.uid || "")
                                ? "bg-blue-100 border-blue-300"
                                : "bg-gray-100 border-gray-300 hover:bg-gray-200"
                            }`}
                          >
                            {emoji} {userIds.length}
                          </button>
                        ) : null,
                      )}
                      <div className="relative">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                          onClick={() => setShowEmojiPicker(showEmojiPicker === message.id ? false : message.id)}
                        >
                          <Smile className="w-3 h-3" />
                        </Button>
                        {showEmojiPicker === message.id && (
                          <div className="absolute bottom-full left-0 mb-1 bg-white border rounded-lg shadow-lg p-2 z-10">
                            <div className="grid grid-cols-4 gap-1">
                              {EMOJI_LIST.map((emoji) => (
                                <button
                                  key={emoji}
                                  onClick={() => {
                                    addReaction(message.id, emoji)
                                    setShowEmojiPicker(false)
                                  }}
                                  className="text-lg hover:bg-gray-100 rounded p-1"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
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
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            <div className="p-4 border-t">
              <div className="flex space-x-2">
                <Input
                  placeholder={event.status === "live" ? "Type a message..." : "Chat available when event starts..."}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  maxLength={500}
                  disabled={event.status !== "live"}
                />
                <Button onClick={sendMessage} disabled={!newMessage.trim() || event.status !== "live"}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              {isOrganizer && (
                <p className="text-xs text-gray-500 mt-2">As the host, you can moderate messages and reactions</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
