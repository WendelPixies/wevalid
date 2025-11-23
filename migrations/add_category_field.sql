-- Add category field to products table
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS category TEXT;

-- Create index for better performance on category lookups
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);

-- Add some default categories (optional)
-- UPDATE public.products SET category = 'Perfumaria' WHERE category IS NULL;
