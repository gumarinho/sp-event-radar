-- Criar tabela de usuários/perfis
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de eventos (cache local + eventos customizados)
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  external_id TEXT, -- ID da API da Sympla
  title TEXT NOT NULL,
  description TEXT,
  date_start TIMESTAMP WITH TIME ZONE,
  date_end TIMESTAMP WITH TIME ZONE,
  location TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  price_min DECIMAL(10,2),
  price_max DECIMAL(10,2),
  category TEXT,
  image_url TEXT,
  organizer TEXT,
  is_sponsored BOOLEAN DEFAULT false,
  source TEXT DEFAULT 'sympla', -- sympla, custom, etc
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de favoritos
CREATE TABLE public.favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, event_id)
);

-- Criar tabela de avaliações
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, event_id)
);

-- Criar tabela de notificações
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'event_reminder', 'event_update', etc
  title TEXT NOT NULL,
  message TEXT,
  is_read BOOLEAN DEFAULT false,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para profiles
CREATE POLICY "Users can view all profiles" 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas RLS para events (públicos)
CREATE POLICY "Anyone can view events" 
ON public.events FOR SELECT USING (true);

-- Políticas RLS para favorites
CREATE POLICY "Users can view own favorites" 
ON public.favorites FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own favorites" 
ON public.favorites FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites" 
ON public.favorites FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para reviews
CREATE POLICY "Anyone can view reviews" 
ON public.reviews FOR SELECT USING (true);

CREATE POLICY "Users can create own reviews" 
ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews" 
ON public.reviews FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews" 
ON public.reviews FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para notifications
CREATE POLICY "Users can view own notifications" 
ON public.notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" 
ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- Função para atualizar timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar timestamps
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para criar perfil automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (new.id, new.raw_user_meta_data ->> 'display_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Índices para performance
CREATE INDEX idx_events_date_start ON public.events(date_start);
CREATE INDEX idx_events_category ON public.events(category);
CREATE INDEX idx_events_location ON public.events(location);
CREATE INDEX idx_events_sponsored ON public.events(is_sponsored);
CREATE INDEX idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX idx_reviews_event_id ON public.reviews(event_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_scheduled ON public.notifications(scheduled_for);