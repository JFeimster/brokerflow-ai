-- Synthetic, minimal platform-core contract for PR #26 PostgreSQL integration tests.
-- This does not contain or import records from the shared platform-core project.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN CREATE ROLE anon NOLOGIN; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE ROLE authenticated NOLOGIN; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE ROLE service_role NOLOGIN BYPASSRLS; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER ROLE service_role BYPASSRLS;

CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS app_private;
GRANT USAGE ON SCHEMA public, auth TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA app_private TO authenticated, service_role;

CREATE TABLE auth.users (
  id uuid PRIMARY KEY,
  email varchar,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'active',
  is_system boolean NOT NULL DEFAULT false,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  key text NOT NULL,
  name text NOT NULL,
  description text,
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, key)
);

CREATE TABLE public.memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES public.roles(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'active',
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id)
);

CREATE TABLE public.permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, role_id, permission_id)
);

CREATE FUNCTION auth.uid() RETURNS uuid
LANGUAGE sql STABLE
AS $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;

CREATE FUNCTION app_private.is_org_member(p_organization_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, public, auth
AS $$ SELECT EXISTS (
  SELECT 1 FROM public.memberships m
  WHERE m.organization_id = p_organization_id AND m.user_id = auth.uid() AND m.status = 'active'
) $$;

CREATE FUNCTION app_private.has_permission(p_organization_id uuid, p_permission text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, public, auth
AS $$ SELECT EXISTS (
  SELECT 1
  FROM public.memberships m
  JOIN public.role_permissions rp ON rp.organization_id = m.organization_id AND rp.role_id = m.role_id
  JOIN public.permissions p ON p.id = rp.permission_id
  WHERE m.organization_id = p_organization_id AND m.user_id = auth.uid() AND m.status = 'active' AND p.key = p_permission
) $$;
REVOKE ALL ON FUNCTION app_private.is_org_member(uuid), app_private.has_permission(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION app_private.is_org_member(uuid), app_private.has_permission(uuid, text) TO authenticated;

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY organizations_select_member ON public.organizations FOR SELECT TO authenticated USING ((SELECT app_private.is_org_member(id)));
CREATE POLICY memberships_select_member ON public.memberships FOR SELECT TO authenticated USING ((SELECT app_private.is_org_member(organization_id)));
CREATE POLICY roles_select_member_or_system ON public.roles FOR SELECT TO authenticated USING (organization_id IS NULL OR (SELECT app_private.is_org_member(organization_id)));
CREATE POLICY permissions_select_authenticated ON public.permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY role_permissions_select_member_or_system ON public.role_permissions FOR SELECT TO authenticated USING (organization_id IS NULL OR (SELECT app_private.is_org_member(organization_id)));
GRANT SELECT ON public.organizations, public.roles, public.memberships, public.permissions, public.role_permissions TO authenticated, service_role;

-- Synthetic identities and organization memberships only.
INSERT INTO auth.users (id, email) VALUES
  ('10000000-0000-4000-8000-000000000001', 'broker-a@example.test'),
  ('10000000-0000-4000-8000-000000000002', 'viewer-a@example.test'),
  ('10000000-0000-4000-8000-000000000003', 'partner-a@example.test'),
  ('10000000-0000-4000-8000-000000000004', 'broker-b@example.test');

INSERT INTO public.organizations (id, name, slug, created_by) VALUES
  ('20000000-0000-4000-8000-000000000001', 'Synthetic Organization A', 'synthetic-org-a', '10000000-0000-4000-8000-000000000001'),
  ('20000000-0000-4000-8000-000000000002', 'Synthetic Organization B', 'synthetic-org-b', '10000000-0000-4000-8000-000000000004');

INSERT INTO public.roles (id, organization_id, key, name) VALUES
  ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'broker', 'Broker'),
  ('30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', 'viewer', 'Read-only member'),
  ('30000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000001', 'partner', 'Partner'),
  ('30000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000002', 'broker', 'Broker');

INSERT INTO public.permissions (id, key, description) VALUES
  ('40000000-0000-4000-8000-000000000001', 'memberships.manage', 'Manage organization membership'),
  ('40000000-0000-4000-8000-000000000002', 'partners.read', 'Read partner directory');
INSERT INTO public.role_permissions (organization_id, role_id, permission_id) VALUES
  ('20000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001'),
  ('20000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000003', '40000000-0000-4000-8000-000000000002');
INSERT INTO public.memberships (organization_id, user_id, role_id) VALUES
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001'),
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000002'),
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000003'),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000004', '30000000-0000-4000-8000-000000000004');
