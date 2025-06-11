"use client"

import { useState } from "react"
import { LoginForm } from "./LoginForm"
import { SignUpForm } from "./SignUpForm"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sparkles } from "lucide-react"

interface AuthPageProps {
  onSuccess?: () => void
}

export function AuthPage({ onSuccess }: AuthPageProps) {
  const [activeTab, setActiveTab] = useState("login")

  return (
    <div className="w-full max-w-md mx-auto p-4 sm:p-6">
      <div className="text-center mb-6">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            EventHub
          </h2>
        </div>
        <p className="text-gray-600 text-sm sm:text-base">Join thousands creating amazing events</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6 h-12">
          <TabsTrigger
            value="login"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white text-sm sm:text-base"
          >
            Sign In
          </TabsTrigger>
          <TabsTrigger
            value="signup"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white text-sm sm:text-base"
          >
            Sign Up
          </TabsTrigger>
        </TabsList>

        <TabsContent value="login">
          <LoginForm onSuccess={onSuccess} />
        </TabsContent>

        <TabsContent value="signup">
          <SignUpForm onSuccess={onSuccess} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
