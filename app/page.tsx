"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Store, Plus, MapPin, Calendar, Tag, Star, Users, Eye, Edit, Flame, Clock } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface Commerce {
  id: string
  name: string
  address: string
  logo_url: string
  type: string
  offers: any[]
  events: any[]
}

export default function DashboardPage() {
  const supabase = createClient()
  const [commerces, setCommerces] = useState<Commerce[]>([])
  const [isLoadingCommerces, setIsLoadingCommerces] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState({
    totalOffres: 0,
    totalEvenements: 0,
    totalBoosts: 15
  })

  // Load commerces from database on component mount
  useEffect(() => {
    const loadCommerces = async () => {
      try {
        console.log('Loading commerces for dashboard...')
        
        // Check authentication first
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError) {
          console.error('Authentication error:', userError)
          setIsLoadingCommerces(false)
          return
        }

        if (!user) {
          console.log('No user found')
          setIsLoadingCommerces(false)
          return
        }

        setUser(user)
        console.log('User authenticated:', user.id)

        // Fetch user profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileError) {
          console.error('Profile error:', profileError)
        } else {
          setProfile(profileData)
          console.log('Profile loaded:', profileData)
        }

        // Query commerces
        const { data: commercesData, error } = await supabase
          .from('commerces')
          .select('*')
          .eq('profile_id', user.id)

        if (error) {
          console.error('Database error:', error)
          setIsLoadingCommerces(false)
          return
        }

        console.log('Commerces loaded:', commercesData)

        // Transform database data to display format
        let transformedCommerces: Commerce[] = (commercesData || []).map(commerce => ({
          id: commerce.id,
          name: commerce.name,
          address: commerce.address || "",
          logo_url: commerce.logo_url || "/placeholder-logo.png",
          type: commerce.type || "restaurant",
          offers: [],
          events: [],
        }))

        // Fetch offers and events counts for each commerce
        const offerCounts: Record<string, number> = {}
        const eventCounts: Record<string, number> = {}
        if (transformedCommerces.length > 0) {
          const commerceIds = transformedCommerces.map(c => c.id)
          // Fetch offers
          const { data: offersData } = await supabase
            .from('offers')
            .select('id, commerce_id')
            .in('commerce_id', commerceIds)
          // Fetch events
          const { data: eventsData } = await supabase
            .from('events')
            .select('id, commerce_id')
            .in('commerce_id', commerceIds)
          // Count offers
          if (offersData) {
            offersData.forEach((offer: any) => {
              offerCounts[offer.commerce_id] = (offerCounts[offer.commerce_id] || 0) + 1
            })
          }
          // Count events
          if (eventsData) {
            eventsData.forEach((event: any) => {
              eventCounts[event.commerce_id] = (eventCounts[event.commerce_id] || 0) + 1
            })
          }
          // Attach counts to commerces
          transformedCommerces = transformedCommerces.map(commerce => ({
            ...commerce,
            offers: Array(offerCounts[commerce.id] || 0).fill(null),
            events: Array(eventCounts[commerce.id] || 0).fill(null),
          }))
        }

        setCommerces(transformedCommerces)

        // Calculate total stats
        const totalOffres = transformedCommerces.reduce((sum, commerce) => sum + commerce.offers.length, 0)
        const totalEvenements = transformedCommerces.reduce((sum, commerce) => sum + commerce.events.length, 0)

        setStats({
          totalOffres,
          totalEvenements,
          totalBoosts: 15
        })

      } catch (error) {
        console.error('Unexpected error:', error)
      } finally {
        setIsLoadingCommerces(false)
      }
    }

    loadCommerces()
  }, [])

  if (isLoadingCommerces) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          {/* Loading skeleton for welcome section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
            
            {/* Loading skeleton for stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-5">
                    <Skeleton className="h-6 w-16 mb-2" />
                    <Skeleton className="h-4 w-24" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Loading skeleton for commerces */}
          <div className="space-y-4">
            <Skeleton className="h-6 w-32" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <Skeleton className="h-6 w-16" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[1, 2, 3, 4].map((j) => (
                      <Skeleton key={j} className="h-4 w-full" />
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Message d'accueil */}
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src="/placeholder-user.jpg" alt="Utilisateur" />
              <AvatarFallback>{user?.email?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
            </Avatar>
                          <div>
                <h1 className="text-xl font-bold text-primary">Bienvenue {profile?.display_name || profile?.first_name || user?.email?.split('@')[0] || 'Utilisateur'} !</h1>
                <p className="text-secondary">Voici un aperçu de l'activité de vos commerces.</p>
              </div>
          </div>

          {/* Statistiques globales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
            <Card>
              <CardContent className="p-5">
                <div>
                  <p className="text-lg font-bold text-primary">{stats.totalOffres}</p>
                  <p className="text-sm text-secondary">Offres actives</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div>
                  <p className="text-lg font-bold text-primary">{stats.totalEvenements}</p>
                  <p className="text-sm text-secondary">Événements à venir</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div>
                  <p className="text-lg font-bold text-primary">{stats.totalBoosts}</p>
                  <p className="text-sm text-secondary">Boosts disponibles</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Module visibilité locale (Test A/B) */}
        <div className="my-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-primary text-base font-semibold">Gagnez aussi en visibilité dans votre quartier</CardTitle>
                  <CardDescription className="text-secondary text-sm">
                    <strong>J'aime mon quartier</strong> — notre support papier distribué localement dans votre secteur
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="text-xs">Nouveau</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-secondary text-sm">
              <p>• Touchez vos voisins en ligne et directement dans leur boîte aux lettres</p>
              <p>• Vous êtes intéressé ? On vous contacte sans pression pour vous expliquer.</p>
              <Button className="bg-accent hover:bg-accent/80 text-white text-sm px-4 py-2 mt-2">
                Je veux en savoir plus
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Module offres exclusives */}
        <div className="my-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-primary text-base font-semibold">Envie de publier une offre exclusive à Gosholo ?</CardTitle>
                  <CardDescription className="text-secondary text-sm">
                    📣 Attirez l'attention avec une offre que les clients ne trouveront nulle part ailleurs
                  </CardDescription>
                </div>
                <Badge className="bg-secondary text-primary text-xs">Exclusivité</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-primary text-sm">
              <p className="font-medium">💡 En échange, on vous offre :</p>
              <ul className="list-disc list-inside ml-4">
                <li>Un boost gratuit</li>
                <li>Une mise en avant spéciale dans l'app</li>
                <li>Le badge "Exclusivité Gosholo" sur l'offre</li>
                <li>Un coup de projecteur sur nos réseaux</li>
              </ul>
              <p className="text-xs">👉 Intéressé ? Contactez notre équipe pour en discuter</p>
              <Button className="bg-accent hover:bg-accent/80 text-white text-sm px-4 py-2 mt-2">
                Proposer une offre exclusive
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Grille des commerces */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-primary">Vos commerces</h2>

          {commerces.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-64 text-center space-y-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                  <Store className="h-8 w-8 text-gray-400" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium text-gray-900">Aucun commerce trouvé</h3>
                  <p className="text-sm text-gray-600">
                    Commencez par ajouter votre premier commerce pour créer des offres et événements
                  </p>
                </div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un commerce
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                             {commerces.map((commerce) => (
                 <Card key={commerce.id} className="transition-shadow border border-gray-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div>
                          <CardTitle className="text-lg">{commerce.name}</CardTitle>
                          <p className="text-sm text-secondary">{commerce.address}</p>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-800">
                        Actif
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Section Offres */}
                    <div className="space-y-2">
                      {commerce.offers.length > 0 ? (
                        <div className="flex items-center text-sm">
                          <Tag className="h-4 w-4 text-primary mr-2" />
                          <span>{commerce.offers.length} offre{commerce.offers.length > 1 ? 's' : ''} active{commerce.offers.length > 1 ? 's' : ''}</span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center text-sm text-gray-500">
                            <Tag className="h-4 w-4 mr-2" />
                            <span>Aucune offre active</span>
                          </div>
                          <Button variant="outline" size="sm" className="w-full bg-transparent">
                            <Plus className="h-3 w-3 mr-1" />
                            Créer votre première offre
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Section Événements */}
                    <div className="space-y-2">
                      {commerce.events.length > 0 ? (
                        <div className="flex items-center text-sm">
                          <Calendar className="h-4 w-4 text-primary mr-2" />
                          <span>{commerce.events.length} événement{commerce.events.length > 1 ? 's' : ''} à venir</span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="h-4 w-4 mr-2" />
                            <span>Aucun événement programmé</span>
                          </div>
                          <Button variant="outline" size="sm" className="w-full bg-transparent">
                            <Plus className="h-3 w-3 mr-1" />
                            Créer votre premier événement
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Indicateurs rapides */}
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center">
                        <Flame className="h-4 w-4 text-orange-500 mr-1" />
                        <span>5 boosts</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>Il y a 2 jours</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-2 pt-2">
                      <Button className="w-full">Gérer ce commerce</Button>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                          <Edit className="h-3 w-3 mr-1" />
                          Éditer
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                          <Star className="h-3 w-3 mr-1" />
                          Stats
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                          <Eye className="h-3 w-3 mr-1" />
                          Config
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Carte d'ajout */}
              <Card className="border-2 border-dashed border-gray-300 hover:border-primary transition-colors cursor-pointer">
                <CardContent className="flex flex-col items-center justify-center h-full min-h-[300px] text-center space-y-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                    <Plus className="h-8 w-8 text-gray-400" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-medium text-gray-900">Ajouter un commerce</h3>
                    <p className="text-sm text-gray-600">
                      Ajoutez un nouveau commerce à votre compte pour commencer à créer des offres et événements
                    </p>
                  </div>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter un commerce
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
