-- Add new fields to franchises table
ALTER TABLE public.franchises 
ADD COLUMN IF NOT EXISTS manager_name TEXT,
ADD COLUMN IF NOT EXISTS manager_email TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add unit_cost to products table
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS unit_cost DECIMAL(10,2) DEFAULT 0;

-- Add franchise_id and total_cost to inventory_items table
ALTER TABLE public.inventory_items
ADD COLUMN IF NOT EXISTS franchise_id UUID REFERENCES public.franchises(id),
ADD COLUMN IF NOT EXISTS total_cost DECIMAL(10,2);

-- Create index for better performance on franchise_id lookups
CREATE INDEX IF NOT EXISTS idx_inventory_items_franchise_id ON public.inventory_items(franchise_id);

-- Update existing inventory_items to set franchise_id based on their store
UPDATE public.inventory_items 
SET franchise_id = stores.franchise_id
FROM public.stores
WHERE inventory_items.store_id = stores.id
AND inventory_items.franchise_id IS NULL;
