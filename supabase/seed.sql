-- Insert sizes
INSERT INTO sizes (name, description) VALUES
  ('Small', 'Suitable for small families (2-3 people)'),
  ('Medium', 'Perfect for medium families (4-6 people)'),
  ('Large', 'Ideal for large families or events (7+ people)');

-- Insert animals
INSERT INTO animals (title, description, is_active) VALUES
  ('Lamb', 'Young sheep, tender meat with a mild flavor.', true),
  ('Sheep', 'Adult sheep with richer flavor and firmer texture.', true);

-- Insert animal size options
WITH 
  lamb AS (SELECT id FROM animals WHERE title = 'Lamb'),
  sheep AS (SELECT id FROM animals WHERE title = 'Sheep'),
  small AS (SELECT id FROM sizes WHERE name = 'Small'),
  medium AS (SELECT id FROM sizes WHERE name = 'Medium'),
  large AS (SELECT id FROM sizes WHERE name = 'Large')
INSERT INTO animal_size_options (animal_id, size_id, description, is_active)
SELECT lamb.id, small.id, 'Small lamb, perfect for small families', true
FROM lamb, small
UNION ALL
SELECT lamb.id, medium.id, 'Medium lamb, great for family gatherings', true
FROM lamb, medium
UNION ALL
SELECT lamb.id, large.id, 'Large lamb, ideal for events', true
FROM lamb, large
UNION ALL
SELECT sheep.id, medium.id, 'Medium sheep, perfect for family meals', true
FROM sheep, medium
UNION ALL
SELECT sheep.id, large.id, 'Large sheep, great for large gatherings', true
FROM sheep, large;

-- Insert cutting styles
INSERT INTO cutting_styles (title, description, is_active) VALUES
  ('Standard Cut', 'Traditional butcher cuts', true),
  ('Premium Cut', 'Special cuts for premium presentation', true),
  ('Custom Cut', 'Customized cutting based on preferences', true);

-- Insert price options for each animal-size combination
WITH aso AS (SELECT * FROM animal_size_options)
INSERT INTO price_options (animal_size_id, name, price, description, is_active)
SELECT 
  aso.id,
  'Premium Package',
  CASE 
    WHEN EXISTS (SELECT 1 FROM sizes WHERE id = aso.size_id AND name = 'Small') THEN 320
    WHEN EXISTS (SELECT 1 FROM sizes WHERE id = aso.size_id AND name = 'Medium') THEN 480
    ELSE 550
  END,
  'Premium cuts with extra care',
  true
FROM aso
UNION ALL
SELECT 
  aso.id,
  'Standard Package',
  CASE 
    WHEN EXISTS (SELECT 1 FROM sizes WHERE id = aso.size_id AND name = 'Small') THEN 280
    WHEN EXISTS (SELECT 1 FROM sizes WHERE id = aso.size_id AND name = 'Medium') THEN 420
    ELSE 500
  END,
  'Regular cuts, great value',
  true
FROM aso;

-- Insert some delivery dates
INSERT INTO delivery_dates (date, available_slots, is_active)
SELECT 
  CURRENT_DATE + (n || ' days')::interval,
  20,
  true
FROM generate_series(1, 14) n
WHERE EXTRACT(DOW FROM CURRENT_DATE + (n || ' days')::interval) NOT IN (0, 6); -- Exclude weekends 