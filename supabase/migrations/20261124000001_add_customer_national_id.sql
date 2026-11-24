ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS national_id VARCHAR(25);

CREATE UNIQUE INDEX IF NOT EXISTS uq_customer_national_id
ON public.customers (organization_id, national_id)
WHERE national_id IS NOT NULL AND btrim(national_id) <> '';
