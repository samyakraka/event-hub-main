"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/contexts/AuthContext"
import { Users, Calendar, Sparkles, CheckCircle } from "lucide-react"
import { toast } from "@/hooks/use-toast"

export function RoleSelection() {
  const [loading, setLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState<"organizer" | "attendee" | null>(null)
  const { updateUserRole } = useAuth()

  const handleRoleSelect = async (role: "organizer" | "attendee") => {
    setLoading(true)
    try {
      await updateUserRole(role)
      toast({
        title: "Welcome to EventHub!",
        description: `You're all set up as an ${role}. Let's get started!`,
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              EventHub
            </h1>
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Journey</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Tell us how you'd like to use EventHub so we can personalize your experience
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <Card
            className={`cursor-pointer transition-all duration-300 border-2 hover:shadow-2xl ${
              selectedRole === "organizer"
                ? "border-blue-500 shadow-xl bg-blue-50"
                : "border-gray-200 hover:border-blue-300"
            }`}
            onClick={() => setSelectedRole("organizer")}
          >
            <CardContent className="p-8 text-center relative">
              {selectedRole === "organizer" && (
                <div className="absolute top-4 right-4">
                  <CheckCircle className="w-6 h-6 text-blue-600" />
                </div>
              )}
              <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Calendar className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Event Organizer</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Create and manage amazing events, handle ticketing, track attendance, and engage with your audience
                through live streaming and chat.
              </p>
              <div className="space-y-2 text-sm text-gray-500">
                <div className="flex items-center justify-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Create unlimited events</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>QR code check-in system</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Live streaming & chat</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Donation management</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all duration-300 border-2 hover:shadow-2xl ${
              selectedRole === "attendee"
                ? "border-purple-500 shadow-xl bg-purple-50"
                : "border-gray-200 hover:border-purple-300"
            }`}
            onClick={() => setSelectedRole("attendee")}
          >
            <CardContent className="p-8 text-center relative">
              {selectedRole === "attendee" && (
                <div className="absolute top-4 right-4">
                  <CheckCircle className="w-6 h-6 text-purple-600" />
                </div>
              )}
              <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Users className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Event Attendee</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Discover amazing events, register for tickets, participate in virtual experiences, and connect with
                like-minded people.
              </p>
              <div className="space-y-2 text-sm text-gray-500">
                <div className="flex items-center justify-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Discover events near you</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Digital ticket management</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Join virtual events</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Support causes you love</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Button
            onClick={() => selectedRole && handleRoleSelect(selectedRole)}
            disabled={!selectedRole || loading}
            className="px-12 py-4 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Setting up your account...</span>
              </div>
            ) : (
              `Continue as ${selectedRole ? selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1) : "..."}`
            )}
          </Button>
          <p className="text-sm text-gray-500 mt-4">Don't worry, you can change this later in your profile settings</p>
        </div>
      </div>
    </div>
  )
}
