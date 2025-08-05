import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Calendar, MapPin, DollarSign, Filter, X } from 'lucide-react';

interface FilterState {
  search: string;
  category: string;
  location: string;
  priceRange: [number, number];
  dateFrom: string;
  dateTo: string;
}

interface EventFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onClearFilters: () => void;
  isVisible: boolean;
  onToggleVisibility: () => void;
}

const categories = [
  'Todos',
  'Música',
  'Teatro',
  'Cinema',
  'Arte',
  'Dança',
  'Literatura',
  'Gastronomia',
  'Exposição',
  'Festival',
  'Workshop',
  'Esporte'
];

const EventFilters: React.FC<EventFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
  isVisible,
  onToggleVisibility,
}) => {
  const updateFilter = (key: keyof FilterState, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const hasActiveFilters = 
    filters.search ||
    filters.category !== 'Todos' ||
    filters.location ||
    filters.priceRange[0] > 0 ||
    filters.priceRange[1] < 500 ||
    filters.dateFrom ||
    filters.dateTo;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={onToggleVisibility}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          Filtros Avançados
          {hasActiveFilters && (
            <span className="bg-primary text-primary-foreground rounded-full px-2 py-1 text-xs">
              !
            </span>
          )}
        </Button>
        
        {hasActiveFilters && (
          <Button variant="ghost" onClick={onClearFilters} size="sm">
            <X className="h-4 w-4 mr-1" />
            Limpar
          </Button>
        )}
      </div>

      {isVisible && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filtros de Eventos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Busca por texto */}
            <div className="space-y-2">
              <Label htmlFor="search">Buscar eventos</Label>
              <Input
                id="search"
                placeholder="Nome do evento, artista..."
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
              />
            </div>

            {/* Categoria */}
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={filters.category} onValueChange={(value) => updateFilter('category', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Localização */}
            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Localização
              </Label>
              <Input
                id="location"
                placeholder="Bairro, região..."
                value={filters.location}
                onChange={(e) => updateFilter('location', e.target.value)}
              />
            </div>

            {/* Faixa de preço */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Faixa de Preço
              </Label>
              <div className="px-2">
                <Slider
                  value={filters.priceRange}
                  onValueChange={(value) => updateFilter('priceRange', value)}
                  max={500}
                  step={10}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground mt-1">
                  <span>R$ {filters.priceRange[0]}</span>
                  <span>R$ {filters.priceRange[1]}</span>
                </div>
              </div>
            </div>

            {/* Data */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateFrom" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Data inicial
                </Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => updateFilter('dateFrom', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dateTo">Data final</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => updateFilter('dateTo', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EventFilters;