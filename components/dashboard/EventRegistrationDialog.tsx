"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAuth } from "@/contexts/AuthContext"
import { collection, addDoc, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Event } from "@/types"
import { toast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { Calendar, Clock, MapPin, DollarSign } from "lucide-react"
import { v4 as uuidv4 } from "uuid"

interface EventRegistrationDialogProps {
  event: Event
  open: boolean
  onOpenChange: (open: boolean) => void
  onRegistrationComplete: () => void
}

export function EventRegistrationDialog({
  event,
  open,
  onOpenChange,
  onRegistrationComplete,
}: EventRegistrationDialogProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [discountCode, setDiscountCode] = useState("")
  const [calculatedPrice, setCalculatedPrice] = useState(event.ticketPrice)
  const [discountAmount, setDiscountAmount] = useState(0)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: user?.email || "",
    phone: "",
    specialRequests: "",
    discountCode: "",
  })
  const [donationAmount, setDonationAmount] = useState(0)

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const generateQRCode = () => {
    // In a real app, you'd generate a proper QR code
    // For now, we'll use a UUID as the QR code data
    return uuidv4()
  }

  const validateDiscountCode = async () => {
    if (!discountCode.trim() || !event.discountEnabled) {
      setDiscountAmount(0)
      setCalculatedPrice(event.ticketPrice)
      return
    }

    try {
      // Check if discount code exists and is valid
      const q = query(
        collection(db, "discountCodes"),
        where("eventId", "==", event.id),
        where("code", "==", discountCode.trim().toUpperCase()),
        where("isActive", "==", true),
      )
      const querySnapshot = await getDocs(q)

      if (!querySnapshot.empty) {
        const discountDoc = querySnapshot.docs[0]
        const discountData = discountDoc.data()

        if (discountData.usedCount < discountData.usageLimit) {
          const discount = (event.ticketPrice * discountData.discount) / 100
          setDiscountAmount(discount)
          setCalculatedPrice(event.ticketPrice - discount)
          toast({
            title: "Discount Applied!",
            description: `${discountData.discount}% discount applied`,
          })
        } else {
          setDiscountAmount(0)
          setCalculatedPrice(event.ticketPrice)
          toast({
            title: "Discount Code Expired",
            description: "This discount code has reached its usage limit",
            variant: "destructive",
          })
        }
      } else {
        setDiscountAmount(0)
        setCalculatedPrice(event.ticketPrice)
        toast({
          title: "Invalid Discount Code",
          description: "The discount code you entered is not valid",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error validating discount code:", error)
      setDiscountAmount(0)
      setCalculatedPrice(event.ticketPrice)
    }
  }

  useEffect(() => {
    if (discountCode.trim()) {
      const timeoutId = setTimeout(validateDiscountCode, 500)
      return () => clearTimeout(timeoutId)
    } else {
      setDiscountAmount(0)
      setCalculatedPrice(event.ticketPrice)
    }
  }, [discountCode, event.ticketPrice, event.discountEnabled])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    try {
      // Create ticket
      const ticketData = {
        eventId: event.id,
        attendeeUid: user.uid,
        qrCode: generateQRCode(),
        checkedIn: false,
        registrationData: formData,
        discountCode: discountCode.trim() || null,
        originalPrice: event.ticketPrice,
        finalPrice: calculatedPrice,
        discountAmount: discountAmount,
        createdAt: new Date(),
      }

      await addDoc(collection(db, "tickets"), ticketData)

      // Create donation if amount > 0
      if (donationAmount > 0) {
        const donationData = {
          eventId: event.id,
          userId: user.uid,
          amount: donationAmount,
          message: `Donation for ${event.title}`,
          createdAt: new Date(),
        }
        await addDoc(collection(db, "donations"), donationData)
      }

      toast({
        title: "Registration Successful!",
        description: "You've been registered for the event. Check your email for confirmation.",
      })

      onRegistrationComplete()
      onOpenChange(false)
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Register for {event.title}</DialogTitle>
          <DialogDescription>Complete your registration for this event</DialogDescription>
        </DialogHeader>

        {/* Event Details */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-2 text-gray-500" />
              {format(event.date, "MMM dd, yyyy")}
            </div>
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-2 text-gray-500" />
              {event.time}
            </div>
            <div className="flex items-center">
              <MapPin className="w-4 h-4 mr-2 text-gray-500" />
              {event.isVirtual ? "Virtual Event" : event.location}
            </div>
            <div className="flex items-center">
              <DollarSign className="w-4 h-4 mr-2 text-gray-500" />
              {event.ticketPrice === 0 ? "Free" : `$${event.ticketPrice}`}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
            />
          </div>

          {event.discountEnabled && (
            <div className="space-y-2">
              <Label htmlFor="discountCode">Discount Code (optional)</Label>
              <Input
                id="discountCode"
                value={discountCode}
                onChange={(e) => {
                  setDiscountCode(e.target.value)
                  setFormData((prev) => ({ ...prev, discountCode: e.target.value }))
                }}
                placeholder="Enter discount code"
              />
              {discountAmount > 0 && (
                <p className="text-sm text-green-600">Discount applied: -${discountAmount.toFixed(2)}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="specialRequests">Special Requests</Label>
            <Textarea
              id="specialRequests"
              value={formData.specialRequests}
              onChange={(e) => handleInputChange("specialRequests", e.target.value)}
              placeholder="Any dietary restrictions, accessibility needs, etc."
              rows={3}
            />
          </div>

          {/* Donation Section */}
          <div className="border-t pt-4">
            <Label htmlFor="donation">Optional Donation ($)</Label>
            <Input
              id="donation"
              type="number"
              min="0"
              step="0.01"
              value={donationAmount}
              onChange={(e) => setDonationAmount(Number(e.target.value))}
              placeholder="0.00"
            />
            <p className="text-sm text-gray-600 mt-1">Support this event with an optional donation</p>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? "Registering..."
                : `Register ${calculatedPrice > 0 ? `($${calculatedPrice.toFixed(2)})` : "(Free)"}`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
