import type { Event } from '@/types'

interface UserPreferences {
  priceRange: [number, number]
  categories: string[]
  location: string
  dateRange: [number, number]
}

export class RecommendationEngine {
  private eventEmbeddings: Map<string, number[]> = new Map()

  // Generate event embeddings based on features
  private generateEventEmbedding(event: Event): number[] {
    const features = [
      event.ticketPrice || 0,
      event.maxAttendees || 0,
      event.type ? this.getCategoryValue(event.type) : 0,
      event.location ? this.getLocationValue(event.location) : 0,
      this.getDateValue(event.date)
    ]
    return features
  }

  // Get numerical value for category
  private getCategoryValue(category: string): number {
    const categories = {
      'gala': 1,
      'concert': 2,
      'marathon': 3,
      'webinar': 4,
      'conference': 5,
      'workshop': 6
    }
    return categories[category as keyof typeof categories] || 0
  }

  // Get numerical value for location
  private getLocationValue(location: string): number {
    return location.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 100
  }

  // Get numerical value for date
  private getDateValue(date: Date): number {
    return date.getTime() / (1000 * 60 * 60 * 24) // Convert to days
  }

  // Get personalized recommendations based on user preferences
  getRecommendations(userPreferences: UserPreferences, events: Event[], limit: number = 3): Event[] {
    if (events.length === 0) return []

    // Calculate similarity scores for each event
    const scoredEvents = events.map(event => ({
      event,
      score: this.calculateSimilarityScore(event, userPreferences)
    }))

    // Sort by score and return top recommendations
    return scoredEvents
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.event)
  }

  // Get trending events based on various factors
  getTrendingEvents(events: Event[], limit: number = 3): Event[] {
    if (events.length === 0) return []

    // Calculate trending scores for each event
    const scoredEvents = events.map(event => ({
      event,
      score: this.calculateTrendingScore(event)
    }))

    // Sort by score and return top trending events
    return scoredEvents
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.event)
  }

  // Calculate similarity score between event and user preferences
  private calculateSimilarityScore(event: Event, preferences: UserPreferences): number {
    let score = 0

    // Price range matching
    if (event.ticketPrice >= preferences.priceRange[0] && event.ticketPrice <= preferences.priceRange[1]) {
      score += 2
    }

    // Category matching
    if (preferences.categories.includes(event.type)) {
      score += 3
    }

    // Location matching
    if (event.location && event.location.toLowerCase().includes(preferences.location.toLowerCase())) {
      score += 2
    }

    // Date range matching
    const eventDate = event.date.getTime()
    if (eventDate >= preferences.dateRange[0] && eventDate <= preferences.dateRange[1]) {
      score += 2
    }

    return score
  }

  // Calculate trending score based on various factors
  private calculateTrendingScore(event: Event): number {
    let score = 0

    // Recent events get higher scores
    const daysUntilEvent = (event.date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    if (daysUntilEvent > 0 && daysUntilEvent <= 7) {
      score += 3
    } else if (daysUntilEvent > 7 && daysUntilEvent <= 30) {
      score += 2
    }

    // Events with higher capacity get higher scores
    if (event.maxAttendees) {
      if (event.maxAttendees > 100) {
        score += 3
      } else if (event.maxAttendees > 50) {
        score += 2
      } else if (event.maxAttendees > 20) {
        score += 1
      }
    }

    // Events with higher ticket prices get higher scores (assuming premium events are more trending)
    if (event.ticketPrice > 100) {
      score += 2
    } else if (event.ticketPrice > 50) {
      score += 1
    }

    return score
  }
} 
