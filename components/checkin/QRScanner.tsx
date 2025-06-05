"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { doc, updateDoc, query, collection, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Ticket } from "@/types"
import { QrCode, Camera, CheckCircle, User } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface QRScannerProps {
  eventId: string
}

export function QRScanner({ eventId }: QRScannerProps) {
  const [manualCode, setManualCode] = useState("")
  const [scannedTickets, setScannedTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(false)
  const [scannerActive, setScannerActive] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    fetchScannedTickets()
  }, [eventId])

  const fetchScannedTickets = async () => {
    try {
      // Simplified query without composite index
      const q = query(collection(db, "tickets"), where("eventId", "==", eventId), where("checkedIn", "==", true))
      const querySnapshot = await getDocs(q)
      const tickets = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
      })) as Ticket[]

      // Sort in memory by creation date
      tickets.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      setScannedTickets(tickets)
    } catch (error) {
      console.error("Error fetching scanned tickets:", error)
    }
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setScannerActive(true)
      }
    } catch (error) {
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please use manual entry.",
        variant: "destructive",
      })
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setScannerActive(false)
  }

  const checkInTicket = async (qrCode: string) => {
    setLoading(true)
    try {
      // Simplified query to find ticket by QR code
      const q = query(collection(db, "tickets"), where("eventId", "==", eventId), where("qrCode", "==", qrCode))
      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        toast({
          title: "Invalid Ticket",
          description: "No ticket found with this QR code.",
          variant: "destructive",
        })
        return
      }

      const ticketDoc = querySnapshot.docs[0]
      const ticketData = ticketDoc.data() as Ticket

      if (ticketData.checkedIn) {
        toast({
          title: "Already Checked In",
          description: "This ticket has already been used for check-in.",
          variant: "destructive",
        })
        return
      }

      // Update ticket to checked in
      await updateDoc(doc(db, "tickets", ticketDoc.id), {
        checkedIn: true,
        checkInTime: new Date(),
      })

      toast({
        title: "Check-in Successful!",
        description: `Ticket ${ticketDoc.id.slice(0, 8)}... checked in successfully.`,
      })

      fetchScannedTickets()
      setManualCode("")
    } catch (error: any) {
      toast({
        title: "Check-in Failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleManualEntry = () => {
    if (manualCode.trim()) {
      checkInTicket(manualCode.trim())
    }
  }

  return (
    <div className="space-y-6">
      {/* Scanner Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <QrCode className="w-5 h-5 mr-2" />
            QR Code Scanner
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Camera Scanner */}
          <div className="space-y-4">
            <div className="flex space-x-2">
              <Button onClick={scannerActive ? stopCamera : startCamera} variant="outline">
                <Camera className="w-4 h-4 mr-2" />
                {scannerActive ? "Stop Camera" : "Start Camera"}
              </Button>
            </div>

            {scannerActive && (
              <div className="relative">
                <video ref={videoRef} autoPlay playsInline className="w-full max-w-md mx-auto rounded-lg border" />
                <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none">
                  <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-blue-500"></div>
                  <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-blue-500"></div>
                  <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-blue-500"></div>
                  <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-blue-500"></div>
                </div>
              </div>
            )}
          </div>

          {/* Manual Entry */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Manual QR Code Entry</label>
            <div className="flex space-x-2">
              <Input
                placeholder="Enter QR code manually..."
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleManualEntry()}
              />
              <Button onClick={handleManualEntry} disabled={loading || !manualCode.trim()}>
                {loading ? "Checking..." : "Check In"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Check-in Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            Check-in Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{scannedTickets.length}</div>
              <div className="text-sm text-green-700">Checked In</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">0</div>
              <div className="text-sm text-blue-700">Total Registered</div>
            </div>
          </div>

          {/* Recent Check-ins */}
          <div className="space-y-2">
            <h4 className="font-medium">Recent Check-ins</h4>
            {scannedTickets
              .slice(-5)
              .reverse()
              .map((ticket) => (
                <div key={ticket.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">
                      {ticket.registrationData?.firstName} {ticket.registrationData?.lastName}
                    </span>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Checked In
                  </Badge>
                </div>
              ))}
            {scannedTickets.length === 0 && <p className="text-gray-500 text-sm text-center py-4">No check-ins yet</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
