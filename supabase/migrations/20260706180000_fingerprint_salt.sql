-- P2-6: per-site salt for the device fingerprint. The fingerprint hash moves from a
-- 32-bit non-crypto hash to SHA-256 (in visitor-identification); salting per site
-- prevents cross-site correlation and rainbow-table regeneration. A UUID gives 122
-- bits of randomness — ample as a salt.

ALTER TABLE public.sites ADD COLUMN IF NOT EXISTS fingerprint_salt text;

UPDATE public.sites SET fingerprint_salt = gen_random_uuid()::text WHERE fingerprint_salt IS NULL;

ALTER TABLE public.sites ALTER COLUMN fingerprint_salt SET DEFAULT gen_random_uuid()::text;
