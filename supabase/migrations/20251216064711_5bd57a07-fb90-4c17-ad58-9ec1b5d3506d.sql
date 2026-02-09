-- Create organization role enum
CREATE TYPE public.org_role AS ENUM ('owner', 'admin', 'member', 'viewer');

-- Create organizations table
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  billing_email TEXT,
  plan TEXT DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create organization_members table
CREATE TABLE public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role org_role NOT NULL DEFAULT 'member',
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- Add organization_id to sites table
ALTER TABLE public.sites 
ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Create function to check organization membership
CREATE OR REPLACE FUNCTION public.is_org_member(org_id UUID, min_role org_role DEFAULT 'viewer')
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = org_id
    AND user_id = auth.uid()
    AND role >= min_role
  )
$$;

-- Create function to check if user is org admin or owner
CREATE OR REPLACE FUNCTION public.is_org_admin(org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = org_id
    AND user_id = auth.uid()
    AND role IN ('owner', 'admin')
  )
$$;

-- RLS Policies for organizations
CREATE POLICY "Members can view their organizations"
ON public.organizations FOR SELECT
USING (public.is_org_member(id));

CREATE POLICY "Owners and admins can update organization"
ON public.organizations FOR UPDATE
USING (public.is_org_admin(id));

CREATE POLICY "Authenticated users can create organizations"
ON public.organizations FOR INSERT
TO authenticated
WITH CHECK (true);

-- RLS Policies for organization_members
CREATE POLICY "Members can view org members"
ON public.organization_members FOR SELECT
USING (public.is_org_member(organization_id));

CREATE POLICY "Admins can add members"
ON public.organization_members FOR INSERT
WITH CHECK (public.is_org_admin(organization_id) OR 
  (user_id = auth.uid() AND role = 'owner'));

CREATE POLICY "Admins can update members"
ON public.organization_members FOR UPDATE
USING (public.is_org_admin(organization_id));

CREATE POLICY "Admins can remove members"
ON public.organization_members FOR DELETE
USING (public.is_org_admin(organization_id) OR user_id = auth.uid());

-- Update sites RLS to use organization
DROP POLICY IF EXISTS "Users can view their own sites" ON public.sites;
DROP POLICY IF EXISTS "Users can create their own sites" ON public.sites;
DROP POLICY IF EXISTS "Users can update their own sites" ON public.sites;
DROP POLICY IF EXISTS "Users can delete their own sites" ON public.sites;

CREATE POLICY "Org members can view sites"
ON public.sites FOR SELECT
USING (
  public.is_org_member(organization_id) OR 
  (organization_id IS NULL AND user_id = auth.uid())
);

CREATE POLICY "Org members can create sites"
ON public.sites FOR INSERT
WITH CHECK (
  public.is_org_member(organization_id, 'member') OR
  (organization_id IS NULL AND user_id = auth.uid())
);

CREATE POLICY "Org admins can update sites"
ON public.sites FOR UPDATE
USING (
  public.is_org_admin(organization_id) OR
  (organization_id IS NULL AND user_id = auth.uid())
);

CREATE POLICY "Org admins can delete sites"
ON public.sites FOR DELETE
USING (
  public.is_org_admin(organization_id) OR
  (organization_id IS NULL AND user_id = auth.uid())
);

-- Update agent_registry to support organization level
ALTER TABLE public.agent_registry
ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX idx_org_members_user ON public.organization_members(user_id);
CREATE INDEX idx_org_members_org ON public.organization_members(organization_id);
CREATE INDEX idx_sites_org ON public.sites(organization_id);
CREATE INDEX idx_agent_registry_org ON public.agent_registry(organization_id);

-- Trigger to auto-create organization when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user_organization()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  new_org_id UUID;
  user_email TEXT;
  org_slug TEXT;
BEGIN
  user_email := NEW.email;
  org_slug := LOWER(REPLACE(SPLIT_PART(user_email, '@', 1), '.', '-')) || '-' || SUBSTRING(NEW.id::TEXT, 1, 8);
  
  -- Create personal organization
  INSERT INTO public.organizations (name, slug, billing_email)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(user_email, '@', 1)) || '''s Organization',
    org_slug,
    user_email
  )
  RETURNING id INTO new_org_id;
  
  -- Add user as owner
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (new_org_id, NEW.id, 'owner');
  
  RETURN NEW;
END;
$$;

-- Create trigger for new users
CREATE TRIGGER on_auth_user_created_org
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_organization();