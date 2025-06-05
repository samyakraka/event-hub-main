"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/AuthContext"
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Event, LiveChat } from "@/types"
import { Send, Trash2, ExternalLink, MessageCircle, Users, Play, Pause } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface LiveStreamViewerProps {
  event: Event
  hasAccess: boolean
}

// YouTube URL utilities
const getYouTubeVideoId = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  const match = url.match(regExp)
  return match && match[2].length === 11 ? match[2] : null
}

const isYouTubeUrl = (url: string): boolean => {
  return url.includes("youtube.com") || url.includes("youtu.be")
}

// Emoji options for reactions
const EMOJI_OPTIONS = ["👍", "❤️", "😂", "😮", "😢", "🔥", "👏", "🎉"]

export function LiveStreamViewer({ event, hasAccess }: LiveStreamViewerProps) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<LiveChat[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"stream" | "chat">("stream")
  const [isPlaying, setIsPlaying] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const isOrganizer = user?.uid === event.organizerUid
  const isYouTube = event.virtualLink && isYouTubeUrl(event.virtualLink)
  const youtubeVideoId = isYouTube ? getYouTubeVideoId(event.virtualLink!) : null

  // Real-time chat listener
  useEffect(() => {
    if (!hasAccess || event.status !== "live") return

    const chatQuery = query(collection(db, "liveChats"), orderBy("timestamp", "asc"))

    const unsubscribe = onSnapshot(chatQuery, (snapshot) => {
      const chatMessages: LiveChat[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        if (data.eventId === event.id) {
          chatMessages.push({
            id: doc.id,
            ...data,
            timestamp: data.timestamp?.toDate() || new Date(),
          } as LiveChat)
        }
      })
      setMessages(chatMessages)
    })

    return () => unsubscribe()
  }, [event.id, hasAccess, event.status])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !hasAccess) return

    setLoading(true)
    try {
      await addDoc(collection(db, "liveChats"), {
        eventId: event.id,
        userId: user.uid,
        userName: user.displayName || "Anonymous",
        message: newMessage.trim(),
        timestamp: serverTimestamp(),
        reactions: {},
      })
      setNewMessage("")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const deleteMessage = async (messageId: string) => {
    if (!isOrganizer) return

    try {
      await deleteDoc(doc(db, "liveChats", messageId))
      toast({
        title: "Message deleted",
        description: "The message has been removed",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete message",
        variant: "destructive",
      })
    }
  }

  const addReaction = async (messageId: string, emoji: string) => {
    if (!user || !hasAccess) return

    const message = messages.find((m) => m.id === messageId)
    if (!message) return

    const reactions = message.reactions || {}
    const emojiReactions = reactions[emoji] || []

    let updatedReactions
    if (emojiReactions.includes(user.uid)) {
      // Remove reaction
      updatedReactions = {
        ...reactions,
        [emoji]: emojiReactions.filter((uid) => uid !== user.uid),
      }
    } else {
      // Add reaction
      updatedReactions = {
        ...reactions,
        [emoji]: [...emojiReactions, user.uid],
      }
    }

    try {
      await updateDoc(doc(db, "liveChats", messageId), {
        reactions: updatedReactions,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add reaction",
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

  const toggleYouTubePlayback = () => {
    if (iframeRef.current && youtubeVideoId) {
      const iframe = iframeRef.current
      const command = isPlaying ? "pauseVideo" : "playVideo"
      iframe.contentWindow?.postMessage(`{"event":"command","func":"${command}","args":""}`, "*")
      setIsPlaying(!isPlaying)
    }
  }

  const renderYouTubeEmbed = () => {
    if (!youtubeVideoId) return null

    return (
      <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
        <iframe
          ref={iframeRef}
          className="absolute top-0 left-0 w-full h-full rounded-lg"
          src={`https://www.youtube.com/embed/${youtubeVideoId}?enablejsapi=1&autoplay=1&mute=0&controls=1&rel=0`}
          title="YouTube Live Stream"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />

        {/* Custom controls overlay */}
        <div className="absolute bottom-4 left-4 flex space-x-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={toggleYouTubePlayback}
            className="bg-black/50 text-white hover:bg-black/70"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => window.open(event.virtualLink, "_blank")}
            className="bg-black/50 text-white hover:bg-black/70"
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      </div>
    )
  }

  const renderGenericEmbed = () => {
    if (!event.virtualLink || isYouTube) return null

    return (
      <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
        <iframe
          className="absolute top-0 left-0 w-full h-full rounded-lg"
          src={event.virtualLink}
          title="Live Stream"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    )
  }

  if (!hasAccess) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Access Required</h3>
          <p className="text-gray-600 mb-4">You need to register for this event to access the live stream and chat.</p>
        </CardContent>
      </Card>
    )
  }

  if (event.status !== "live") {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">
            {event.status === "upcoming" ? "Event Not Started" : "Event Ended"}
          </h3>
          <p className="text-gray-600">
            {event.status === "upcoming"
              ? "The live stream will begin when the organizer starts the event."
              : "This event has concluded. Thank you for participating!"}
          </p>
        </CardContent>
      </Card>
    )
  }

  // For meeting type events, show join button
  if (event.virtualType === "meeting") {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ExternalLink className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Join Virtual Meeting</h3>
            <p className="text-gray-600 mb-6">Click the button below to join the live meeting session.</p>
          </div>
          <Button
            size="lg"
            onClick={() => window.open(event.virtualLink, "_blank")}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <ExternalLink className="w-5 h-5 mr-2" />
            Join Meeting
          </Button>
        </CardContent>
      </Card>
    )
  }

  // For broadcast type events, show stream with chat
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Stream Section */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Live Stream</span>
              {isYouTube && (
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                  YouTube Live
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>{isYouTube ? renderYouTubeEmbed() : renderGenericEmbed()}</CardContent>
        </Card>
      </div>

      {/* Chat Section */}
      <div className="lg:col-span-1">
        <Card className="h-[600px] flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-lg">
              <div className="flex items-center space-x-2">
                <MessageCircle className="w-5 h-5" />
                <span>Live Chat</span>
              </div>
              <Badge variant="outline">{messages.length}</Badge>
            </CardTitle>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0">
            {/* Messages */}
            <ScrollArea className="flex-1 px-4">
              <div className="space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className="group relative p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-sm">{message.userName}</span>
                          {message.userId === event.organizerUid && (
                            <Badge variant="secondary" className="text-xs">
                              Host
                            </Badge>
                          )}
                          <span className="text-xs text-gray-500">
                            {message.timestamp.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{message.message}</p>

                        {/* Reactions */}
                        {message.reactions && Object.keys(message.reactions).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {Object.entries(message.reactions).map(([emoji, userIds]) =>
                              userIds.length > 0 ? (
                                <button
                                  key={emoji}
                                  onClick={() => addReaction(message.id, emoji)}
                                  className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs transition-colors ${
                                    userIds.includes(user?.uid || "")
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-gray-100 hover:bg-gray-200"
                                  }`}
                                >
                                  <span>{emoji}</span>
                                  <span>{userIds.length}</span>
                                </button>
                              ) : null,
                            )}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1">
                        {/* Emoji Picker */}
                        <div className="relative">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setShowEmojiPicker(showEmojiPicker === message.id ? null : message.id)}
                            className="h-6 w-6 p-0"
                          >
                            😊
                          </Button>

                          {showEmojiPicker === message.id && (
                            <div className="absolute right-0 top-8 z-10 bg-white border rounded-lg shadow-lg p-2 flex space-x-1">
                              {EMOJI_OPTIONS.map((emoji) => (
                                <button
                                  key={emoji}
                                  onClick={() => {
                                    addReaction(message.id, emoji)
                                    setShowEmojiPicker(null)
                                  }}
                                  className="hover:bg-gray-100 p-1 rounded text-lg"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Delete (Host only) */}
                        {isOrganizer && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteMessage(message.id)}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t">
              <div className="flex space-x-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  maxLength={500}
                  className="flex-1"
                  disabled={loading}
                />
                <Button onClick={sendMessage} disabled={loading || !newMessage.trim()} size="sm">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">{newMessage.length}/500 characters</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
