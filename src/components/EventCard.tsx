import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, MapPin, Calendar, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

interface EventCardProps {
  event: Event;
  isFavorite?: boolean;
  onToggleFavorite?: (eventId: string) => void;
  onViewDetails?: (event: Event) => void;
}

const EventCard: React.FC<EventCardProps> = ({
  event,
  isFavorite = false,
  onToggleFavorite,
  onViewDetails,
}) => {
  const formatPrice = (min?: number, max?: number) => {
    if (!min && !max) return 'Gratuito';
    if (min === 0) return 'Gratuito';
    if (min === max) return `R$ ${min}`;
    return `R$ ${min} - R$ ${max}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      return format(new Date(dateString), "d 'de' MMMM 'às' HH:mm", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  return (
    <Card className="h-full flex flex-col">
      {event.image_url && (
        <div className="relative h-48 overflow-hidden rounded-t-lg">
          <img
            src={event.image_url}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          {event.is_sponsored && (
            <Badge className="absolute top-2 left-2" variant="secondary">
              Patrocinado
            </Badge>
          )}
          {onToggleFavorite && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 h-8 w-8 p-0 bg-white/80 hover:bg-white"
              onClick={() => onToggleFavorite(event.id)}
            >
              <Heart
                className={`h-4 w-4 ${
                  isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'
                }`}
              />
            </Button>
          )}
        </div>
      )}
      
      <CardHeader className="flex-1">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg leading-tight">{event.title}</CardTitle>
        </div>
        
        {event.description && (
          <CardDescription className="line-clamp-2">
            {event.description}
          </CardDescription>
        )}
        
        <div className="space-y-2 text-sm text-muted-foreground">
          {event.date_start && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(event.date_start)}</span>
            </div>
          )}
          
          {event.location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span className="line-clamp-1">{event.location}</span>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            <span>{formatPrice(event.price_min, event.price_max)}</span>
          </div>
        </div>
        
        {event.category && (
          <Badge variant="outline" className="self-start">
            {event.category}
          </Badge>
        )}
      </CardHeader>
      
      <CardContent className="pt-0">
        {onViewDetails && (
          <Button onClick={() => onViewDetails(event)} className="w-full">
            Ver Detalhes
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default EventCard;