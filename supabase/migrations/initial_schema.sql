-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- Create profiles table for user management
create table profiles (
  id uuid references auth.users primary key,
  full_name text,
  email text,
  phone_number text,
  address text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create animals table
create table animals (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  image_url text,
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create sizes table
create table sizes (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  description text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create animal_size_options table (junction table with additional fields)
create table animal_size_options (
  id uuid primary key default uuid_generate_v4(),
  animal_id uuid references animals(id) not null,
  size_id uuid references sizes(id) not null,
  description text,
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(animal_id, size_id)
);

-- Create price_options table
create table price_options (
  id uuid primary key default uuid_generate_v4(),
  animal_size_id uuid references animal_size_options(id) not null,
  name text not null,
  price decimal(10,2) not null check (price >= 0),
  description text,
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create cutting_styles table
create table cutting_styles (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create delivery_dates table
create table delivery_dates (
  id uuid primary key default uuid_generate_v4(),
  date date not null unique,
  available_slots integer not null default 20 check (available_slots >= 0),
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create orders table
create table orders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users,
  guest_email text,
  guest_phone text,
  customer_name text not null,
  phone_number text not null,
  address text not null,
  animal_size_id uuid references animal_size_options(id) not null,
  price_option_id uuid references price_options(id) not null,
  cutting_style_id uuid references cutting_styles(id),
  divided boolean default false,
  total decimal(10,2) not null check (total >= 0),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'processing', 'ready', 'delivered', 'cancelled')),
  delivery_date_id uuid references delivery_dates(id),
  payment_intent_id text,
  payment_status text default 'unpaid' check (payment_status in ('unpaid', 'processing', 'paid', 'failed', 'refunded')),
  special_instructions text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  -- Ensure either user_id or guest details are provided
  constraint user_or_guest check (
    (user_id is not null) or 
    (guest_email is not null and guest_phone is not null)
  )
);

-- Create admins table
create table admins (
  user_id uuid references auth.users primary key,
  created_at timestamp with time zone default now()
);

-- Set up Row Level Security (RLS)
alter table profiles enable row level security;
alter table animals enable row level security;
alter table sizes enable row level security;
alter table animal_size_options enable row level security;
alter table price_options enable row level security;
alter table cutting_styles enable row level security;
alter table delivery_dates enable row level security;
alter table orders enable row level security;
alter table admins enable row level security;

-- Create RLS Policies

-- Profiles policies
create policy "Users can view their own profile" 
  on profiles for select using (auth.uid() = id);
create policy "Users can update their own profile" 
  on profiles for update using (auth.uid() = id);

-- Animals policies
create policy "Anyone can view active animals" 
  on animals for select using (is_active = true);
create policy "Admins can manage animals" 
  on animals for all using (auth.uid() in (select user_id from admins));

-- Sizes policies
create policy "Anyone can view sizes" 
  on sizes for select using (true);
create policy "Admins can manage sizes" 
  on sizes for all using (auth.uid() in (select user_id from admins));

-- Animal size options policies
create policy "Anyone can view active animal size options" 
  on animal_size_options for select using (is_active = true);
create policy "Admins can manage animal size options" 
  on animal_size_options for all using (auth.uid() in (select user_id from admins));

-- Price options policies
create policy "Anyone can view active price options" 
  on price_options for select using (is_active = true);
create policy "Admins can manage price options" 
  on price_options for all using (auth.uid() in (select user_id from admins));

-- Cutting styles policies
create policy "Anyone can view active cutting styles" 
  on cutting_styles for select using (is_active = true);
create policy "Admins can manage cutting styles" 
  on cutting_styles for all using (auth.uid() in (select user_id from admins));

-- Delivery dates policies
create policy "Anyone can view active delivery dates" 
  on delivery_dates for select using (is_active = true);
create policy "Admins can manage delivery dates" 
  on delivery_dates for all using (auth.uid() in (select user_id from admins));

-- Orders policies
create policy "Users can view their own orders" 
  on orders for select using (
    auth.uid() = user_id or 
    (guest_phone is not null and guest_phone = current_setting('app.guest_phone', true))
  );
create policy "Users can create orders" 
  on orders for insert with check (true);
create policy "Users can update their own orders" 
  on orders for update using (
    auth.uid() = user_id or 
    (guest_phone is not null and guest_phone = current_setting('app.guest_phone', true))
  );
create policy "Admins can manage all orders" 
  on orders for all using (auth.uid() in (select user_id from admins));

-- Admins policies
create policy "Super admins can manage admins" 
  on admins for all using (auth.uid() in (select user_id from admins));

-- Create functions

-- Function to update delivery slots
create or replace function update_delivery_slots()
returns trigger as $$
begin
  if (TG_OP = 'INSERT') then
    update delivery_dates
    set available_slots = available_slots - 1
    where id = NEW.delivery_date_id;
  elsif (TG_OP = 'DELETE') then
    update delivery_dates
    set available_slots = available_slots + 1
    where id = OLD.delivery_date_id;
  end if;
  return NEW;
end;
$$ language plpgsql;

-- Create triggers

-- Trigger for updating delivery slots
create trigger update_delivery_slots_trigger
after insert or delete on orders
for each row
execute function update_delivery_slots();

-- Function to update timestamps
create or replace function update_updated_at_column()
returns trigger as $$
begin
  NEW.updated_at = now();
  return NEW;
end;
$$ language plpgsql;

-- Create updated_at triggers for all tables
create trigger update_profiles_updated_at
  before update on profiles
  for each row
  execute function update_updated_at_column();

create trigger update_animals_updated_at
  before update on animals
  for each row
  execute function update_updated_at_column();

create trigger update_sizes_updated_at
  before update on sizes
  for each row
  execute function update_updated_at_column();

create trigger update_animal_size_options_updated_at
  before update on animal_size_options
  for each row
  execute function update_updated_at_column();

create trigger update_price_options_updated_at
  before update on price_options
  for each row
  execute function update_updated_at_column();

create trigger update_cutting_styles_updated_at
  before update on cutting_styles
  for each row
  execute function update_updated_at_column();

create trigger update_delivery_dates_updated_at
  before update on delivery_dates
  for each row
  execute function update_updated_at_column();

create trigger update_orders_updated_at
  before update on orders
  for each row
  execute function update_updated_at_column(); 