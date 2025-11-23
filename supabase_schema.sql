-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Stores Table
create table if not exists stores (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Products Base Catalog
create table if not exists products (
  id uuid default uuid_generate_v4() primary key,
  code text unique not null,
  description text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. User Profiles (Linked to Auth)
create table if not exists user_profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  role text check (role in ('admin', 'store_user')) default 'store_user',
  store_id uuid references stores(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Inventory Items
create table if not exists inventory_items (
  id uuid default uuid_generate_v4() primary key,
  store_id uuid references stores(id) not null,
  product_code text references products(code),
  product_description text, -- Cache description or allow custom
  quantity integer not null,
  expiry_date date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies
alter table stores enable row level security;
alter table user_profiles enable row level security;
alter table products enable row level security;
alter table inventory_items enable row level security;

-- Simple Policies (Adjust for production)
create policy "Public stores are viewable" on stores for select using (true);
create policy "Users can view their own profile" on user_profiles for select using (auth.uid() = id);
create policy "Admins can view all profiles" on user_profiles for select using (exists (select 1 from user_profiles where id = auth.uid() and role = 'admin'));
create policy "Users can update their own profile" on user_profiles for update using (auth.uid() = id);

create policy "Authenticated users can view products" on products for select using (auth.role() = 'authenticated');
create policy "Authenticated users can insert products" on products for insert with check (auth.role() = 'authenticated');

-- Inventory Policies
-- Store users see their store's items
create policy "Store users view own store inventory" on inventory_items for select using (
  store_id in (select store_id from user_profiles where id = auth.uid())
  or 
  exists (select 1 from user_profiles where id = auth.uid() and role = 'admin')
);

create policy "Store users insert own store inventory" on inventory_items for insert with check (
  store_id in (select store_id from user_profiles where id = auth.uid())
);

create policy "Store users update own store inventory" on inventory_items for update using (
  store_id in (select store_id from user_profiles where id = auth.uid())
);

create policy "Store users delete own store inventory" on inventory_items for delete using (
  store_id in (select store_id from user_profiles where id = auth.uid())
);

-- Trigger to create profile on signup
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.user_profiles (id, email, role)
  values (new.id, new.email, 'store_user');
  return new;
end;
$$ language plpgsql security definer;

-- Drop if exists to avoid error on re-run
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Seed Data (Only if empty)
insert into stores (name) select 'Loja 01 - Centro' where not exists (select 1 from stores where name = 'Loja 01 - Centro');
insert into stores (name) select 'Loja 02 - Shopping' where not exists (select 1 from stores where name = 'Loja 02 - Shopping');
insert into stores (name) select 'Loja 03 - Aeroporto' where not exists (select 1 from stores where name = 'Loja 03 - Aeroporto');
