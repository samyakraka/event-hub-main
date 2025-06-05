export interface Event {
  id: string
  title: string
  description: string
  date: string
  location: string
  price: number
  category: string
  attendees?: string[]
  rating?: number
  organizerId: string
  createdAt: string
  updatedAt: string
  imageUrl?: string
  tags?: string[]
  maxAttendees?: number
  status: 'draft' | 'published' | 'cancelled'
} 
