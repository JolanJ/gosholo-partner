"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, MapPin, Users, Plus, Edit } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { createClient } from "@/lib/supabase/client"
import EventCreationFlow from "@/components/event-creation-flow"

interface Event {
  id: string
  commerce_id: string
  title: string
  short_description: string
  image_url: string
  location: string
  conditions: string
  max_participants: number
  participants_count: number
  status: "active" | "inactive" | "brouillon" | "draft" | "actif" | "inactif"
  start_date: string
  end_date: string
  created_at: string
  updated_at: string
}

export default function EvenementsPage() {
  const supabase = createClient()
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingEvents, setIsLoadingEvents] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  // Load events from database on component mount
  useEffect(() => {
    const loadEvents = async () => {
      try {
        console.log('Loading events...')
        
        // Check authentication first
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError) {
          console.error('Authentication error:', userError)
          setIsLoadingEvents(false)
          return
        }

        if (!user) {
          console.log('No user found')
          setIsLoadingEvents(false)
          return
        }

        console.log('User authenticated:', user.id)

        // First get user's commerces
        const { data: commercesData, error: commercesError } = await supabase
          .from('commerces')
          .select('id')
          .eq('profile_id', user.id)

        if (commercesError) {
          console.error('Error loading commerces:', commercesError)
          setIsLoadingEvents(false)
          return
        }

        if (!commercesData || commercesData.length === 0) {
          console.log('No commerces found for user')
          setEvents([])
          setIsLoadingEvents(false)
          return
        }

        const commerceIds = commercesData.map(c => c.id)

        // Query events for user's commerces
        const { data: eventsData, error } = await supabase
          .from('events')
          .select('*')
          .in('commerce_id', commerceIds)

        if (error) {
          console.error('Database error:', error)
          setIsLoadingEvents(false)
          return
        }

        console.log('Events loaded:', eventsData)
        setEvents(eventsData || [])
      } catch (error) {
        console.error('Unexpected error:', error)
      } finally {
        setIsLoadingEvents(false)
      }
    }

    loadEvents()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
      case "actif":
        return "bg-green-100 text-green-800"
      case "inactive":
      case "inactif":
        return "bg-red-100 text-red-800"
      case "draft":
      case "brouillon":
        return "bg-gray-100 text-gray-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event)
    setIsEditDialogOpen(true)
  }

  const handleEventUpdated = () => {
    setIsEditDialogOpen(false)
    setEditingEvent(null)
    // Reload events to show updated data
    window.location.reload()
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-primary">Événements</h1>
            <p className="text-primary/70 text-sm lg:text-base">Gérez vos événements et ateliers</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-accent hover:bg-accent/80 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Créer un événement
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Créer un nouvel événement</DialogTitle>
                <DialogDescription>
                  Remplissez les informations pour créer un nouvel événement.
                </DialogDescription>
              </DialogHeader>
              <EventCreationFlow onCancel={() => setIsDialogOpen(false)} />
            </DialogContent>
          </Dialog>

          {/* Edit Event Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Modifier l'événement</DialogTitle>
                <DialogDescription>
                  Modifiez les informations de votre événement.
                </DialogDescription>
              </DialogHeader>
              {editingEvent && (
                <EventCreationFlow 
                  onCancel={() => setIsEditDialogOpen(false)}
                />
              )}
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-6">
          {isLoadingEvents ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-secondary">Chargement des événements...</p>
              </div>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-secondary mx-auto mb-4" />
              <h3 className="text-lg font-medium text-primary mb-2">Aucun événement</h3>
              <p className="text-secondary mb-4">Vous n'avez pas encore créé d'événements pour vos commerces.</p>
              <Button 
                onClick={() => setIsDialogOpen(true)}
                className="bg-accent hover:bg-accent/80 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Créer votre premier événement
              </Button>
            </div>
          ) : (
            events.map((event) => (
              <Card key={event.id} className="bg-white border border-primary/20">
                <CardHeader className="pb-3 flex flex-row items-center gap-4">
                  <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                    <img
                      src={event.image_url || "/placeholder-logo.png"}
                      alt={event.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/placeholder-logo.png";
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg text-primary">{event.title}</CardTitle>
                    <div className="flex items-center gap-2 text-secondary text-sm">
                      <MapPin className="h-4 w-4" />
                      <span>{event.location}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {event.status === "active" || event.status === "actif" ? "Active" : 
                         event.status === "inactive" || event.status === "inactif" ? "Inactive" : 
                         event.status === "draft" || event.status === "brouillon" ? "Brouillon" : event.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditEvent(event)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Modifier
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-secondary text-sm">{event.short_description}</p>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">{formatDate(event.start_date)}</div>
                        <div className="text-xs text-secondary">Date début</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">{formatDate(event.end_date)}</div>
                        <div className="text-xs text-secondary">Date fin</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">{event.participants_count}</div>
                        <div className="text-xs text-secondary">Participants</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">{event.max_participants}</div>
                        <div className="text-xs text-secondary">Max participants</div>
                      </div>
                    </div>
                    {event.conditions && (
                      <div className="text-sm text-secondary pt-2 border-t border-primary/10">
                        <strong>Conditions:</strong> {event.conditions}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
