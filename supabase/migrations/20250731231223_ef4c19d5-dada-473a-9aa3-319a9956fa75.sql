-- Add missing referrer column to page_views table
ALTER TABLE public.page_views 
ADD COLUMN IF NOT EXISTS referrer TEXT;