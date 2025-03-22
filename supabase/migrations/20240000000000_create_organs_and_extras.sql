-- Create organs table
create table if not exists organs (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    is_active boolean default true,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create extras table
create table if not exists extras (
    id uuid default gen_random_uuid() primary key,
    title text not null,
    description text,
    price decimal(10,2) not null,
    is_active boolean default true,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create RLS policies for organs
alter table organs enable row level security;

create policy "Enable read access for all users" on organs
    for select using (true);

create policy "Enable insert for authenticated users only" on organs
    for insert with check (auth.role() = 'authenticated');

create policy "Enable update for authenticated users only" on organs
    for update using (auth.role() = 'authenticated');

-- Create RLS policies for extras
alter table extras enable row level security;

create policy "Enable read access for all users" on extras
    for select using (true);

create policy "Enable insert for authenticated users only" on extras
    for insert with check (auth.role() = 'authenticated');

create policy "Enable update for authenticated users only" on extras
    for update using (auth.role() = 'authenticated');

-- Insert some initial data for organs
insert into organs (name, is_active) values
    ('Liver', true),
    ('Heart', true),
    ('Kidney', true),
    ('Tongue', true),
    ('Brain', true)
on conflict do nothing;

-- Insert some initial data for extras
insert into extras (title, description, price, is_active) values
    ('Leather', 'Premium leather packaging for better preservation', 15.99, true),
    ('Express Processing', 'Priority processing of your order', 25.00, true),
on conflict do nothing; 