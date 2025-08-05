import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { Search, MapPin, User, Heart, LogOut, Calendar } from 'lucide-react';
import EventCard from '@/components/EventCard';
import EventFilters from '@/components/EventFilters';

interface Event {
  id: string;
  title: string;
  description?: string;
  date_start?: string;
  location?: string;
  price_min?: number;
  price_max?: number;
  category?: string;
  image_url?: string;
  organizer?: string;
  is_sponsored?: boolean;
}

interface FilterState {
  search: string;
  category: string;
  location: string;
  priceRange: [number, number];
  dateFrom: string;
  dateTo: string;
}

const Index = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    category: 'Todos',
    location: '',
    priceRange: [0, 500],
    dateFrom: '',
    dateTo: '',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadEvents();
      loadFavorites();
    }
  }, [user]);

  const loadEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date_start', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Erro ao carregar eventos:', error);
      toast({
        title: "Erro ao carregar eventos",
        description: "Tente novamente em alguns instantes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadFavorites = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('event_id')
        .eq('user_id', user.id);

      if (error) throw error;
      setFavorites(data?.map(f => f.event_id) || []);
    } catch (error) {
      console.error('Erro ao carregar favoritos:', error);
    }
  };

  const toggleFavorite = async (eventId: string) => {
    if (!user) return;

    const isFavorite = favorites.includes(eventId);

    try {
      if (isFavorite) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('event_id', eventId);

        if (error) throw error;
        setFavorites(prev => prev.filter(id => id !== eventId));
        toast({
          title: "Removido dos favoritos",
        });
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert({ user_id: user.id, event_id: eventId });

        if (error) throw error;
        setFavorites(prev => [...prev, eventId]);
        toast({
          title: "Adicionado aos favoritos",
        });
      }
    } catch (error) {
      console.error('Erro ao atualizar favoritos:', error);
      toast({
        title: "Erro ao atualizar favoritos",
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category: 'Todos',
      location: '',
      priceRange: [0, 500],
      dateFrom: '',
      dateTo: '',
    });
    setSearchTerm('');
  };

  const filteredEvents = events.filter(event => {
    // Busca por texto
    const searchMatch = !filters.search || 
      event.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      event.description?.toLowerCase().includes(filters.search.toLowerCase()) ||
      event.organizer?.toLowerCase().includes(filters.search.toLowerCase());

    // Filtro de categoria
    const categoryMatch = filters.category === 'Todos' || 
      event.category === filters.category;

    // Filtro de localização
    const locationMatch = !filters.location || 
      event.location?.toLowerCase().includes(filters.location.toLowerCase());

    // Filtro de preço
    const priceMatch = (!event.price_min || event.price_min >= filters.priceRange[0]) &&
      (!event.price_max || event.price_max <= filters.priceRange[1]);

    // Filtro de data
    const dateMatch = (!filters.dateFrom || !event.date_start || 
      new Date(event.date_start) >= new Date(filters.dateFrom)) &&
      (!filters.dateTo || !event.date_start || 
      new Date(event.date_start) <= new Date(filters.dateTo));

    return searchMatch && categoryMatch && locationMatch && priceMatch && dateMatch;
  });

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">SP Event Finder</h1>
              <p className="text-sm text-muted-foreground">
                Eventos culturais em São Paulo
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="hidden md:flex">
                <User className="h-3 w-3 mr-1" />
                {user.email}
              </Badge>
              
              <Button variant="ghost" onClick={handleSignOut} size="sm">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Busca rápida */}
          <div className="mt-4 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar eventos..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setFilters(prev => ({ ...prev, search: e.target.value }));
                }}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Filtros */}
        <EventFilters
          filters={filters}
          onFiltersChange={setFilters}
          onClearFilters={clearFilters}
          isVisible={filtersVisible}
          onToggleVisibility={() => setFiltersVisible(!filtersVisible)}
        />

        {/* Resultados */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              {filteredEvents.length} eventos encontrados
            </h2>
          </div>

          {filteredEvents.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Nenhum evento encontrado</h3>
                <p className="text-muted-foreground mb-4">
                  Tente ajustar os filtros ou verifique novamente mais tarde
                </p>
                <Button variant="outline" onClick={clearFilters}>
                  Limpar Filtros
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  isFavorite={favorites.includes(event.id)}
                  onToggleFavorite={toggleFavorite}
                  onViewDetails={(event) => {
                    // Futuramente implementar página de detalhes
                    toast({
                      title: event.title,
                      description: "Página de detalhes em breve!",
                    });
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
