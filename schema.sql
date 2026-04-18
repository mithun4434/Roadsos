-- Run this in your Supabase SQL Editor

-- Users Table
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    name TEXT,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    role TEXT CHECK (role IN ('USER', 'DRIVER')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Services Table
CREATE TABLE public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    icon TEXT,
    base_price NUMERIC NOT NULL
);

-- Providers Table
CREATE TABLE public.providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    service_id UUID REFERENCES public.services(id) ON DELETE CASCADE,
    latitude NUMERIC,
    longitude NUMERIC,
    rating NUMERIC DEFAULT 5.0,
    availability BOOLEAN DEFAULT false,
    UNIQUE(user_id)
);

-- Requests Table
CREATE TABLE public.requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    provider_id UUID REFERENCES public.providers(id) ON DELETE SET NULL,
    service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
    status TEXT CHECK (status IN ('requested', 'accepted', 'on_the_way', 'completed', 'cancelled')) DEFAULT 'requested',
    user_location JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;

-- Create Policies (Simplified for demo)
CREATE POLICY "Users can read their own data" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own data" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own data" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Anyone can read services" ON public.services FOR SELECT USING (true);

CREATE POLICY "Anyone can read providers" ON public.providers FOR SELECT USING (true);
CREATE POLICY "Providers can update their own profile" ON public.providers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Providers can insert their own profile" ON public.providers FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users and Providers can read requests" ON public.requests FOR SELECT USING (auth.uid() = user_id OR auth.uid() IN (SELECT u.id FROM public.users u JOIN public.providers p ON u.id = p.user_id WHERE p.id = requests.provider_id));
CREATE POLICY "Users can create requests" ON public.requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users and Providers can update requests" ON public.requests FOR UPDATE USING (true);

-- Insert dummy services
INSERT INTO public.services (name, icon, base_price) VALUES 
('Towing', 'truck', 150),
('Fuel Delivery', 'fuel', 25),
('Flat Tire Repair', 'circle-dot', 50),
('Battery Jumpstart', 'zap', 40),
('Mechanic Help', 'wrench', 100);
