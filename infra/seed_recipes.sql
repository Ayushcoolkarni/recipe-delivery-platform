-- ============================================================
-- RasoiKit — Recipe Seed Data
-- Run this against your recipe-service PostgreSQL DB
-- ============================================================

-- Recipes
INSERT INTO recipes (id, name, description, cuisine, difficulty, prep_time_minutes, cook_time_minutes, servings, price, image_url)
VALUES
  (1,  'Butter Chicken',      'Tender chicken in a rich, creamy tomato-butter gravy — the quintessential Indian comfort dish.',           'Indian',    'EASY',   15, 35, 4, 349, 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=800&q=85'),
  (2,  'Biryani',             'Fragrant basmati rice layered with spiced meat and saffron — slow-cooked the dum way.',                    'Indian',    'MEDIUM', 30, 60, 4, 399, 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&q=85'),
  (3,  'Paneer Tikka Masala', 'Charred paneer cubes simmered in a vibrant, spiced onion-tomato masala.',                                 'Indian',    'MEDIUM', 20, 30, 4, 299, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=85'),
  (4,  'Dal Makhani',         'Slow-cooked whole black lentils enriched with butter and cream — a Punjabi classic.',                      'Indian',    'EASY',   10, 90, 4, 249, 'https://images.unsplash.com/photo-1546833998-877b37c2e5c6?w=800&q=85'),
  (5,  'Pasta Arrabiata',     'Al-dente penne tossed in a fiery, garlicky tomato sauce with fresh basil.',                               'Italian',   'EASY',   10, 20, 4, 279, 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&q=85'),
  (6,  'Masala Dosa',         'Crispy fermented-rice crepe filled with spiced potato bhaji, served with sambar and chutneys.',            'South Indian','HARD', 480, 15, 4, 199, 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&q=85'),
  (7,  'Grilled Salmon',      'Herb-marinated salmon fillet grilled to perfection with a lemon-caper butter sauce.',                      'Continental','EASY',  10, 15, 2, 549, 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&q=85'),
  (8,  'Pad Thai',            'Stir-fried rice noodles with egg, tofu, bean sprouts, peanuts and a tangy tamarind sauce.',               'Thai',      'MEDIUM', 20, 15, 4, 319, 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=800&q=85'),
  (9,  'Chicken Curry',       'Home-style chicken curry with a golden onion-tomato base, slow-simmered with whole spices.',              'Indian',    'EASY',   15, 40, 4, 299, 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&q=85'),
  (10, 'Masala Chai',         'The classic Indian spiced tea — ginger, cardamom, cinnamon and cloves in strong milk tea.',               'Indian',    'EASY',    5, 10, 2,  99, 'https://images.unsplash.com/photo-1561336313-0bd5e0b27ec8?w=800&q=85')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Ingredients  (quantity = per base_servings on recipe row)
-- ============================================================

-- 1 · Butter Chicken (serves 4)
INSERT INTO recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  (1, 'Chicken breast',    600,  'g'),
  (1, 'Butter',             60,  'g'),
  (1, 'Fresh cream',       100,  'ml'),
  (1, 'Tomato purée',      200,  'ml'),
  (1, 'Onion',             150,  'g'),
  (1, 'Ginger-garlic paste', 30, 'g'),
  (1, 'Kashmiri chilli powder', 2, 'tsp'),
  (1, 'Garam masala',        1,  'tsp'),
  (1, 'Salt',                1,  'tsp'),
  (1, 'Oil',                 2,  'tbsp');

-- 2 · Biryani (serves 4)
INSERT INTO recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  (2, 'Basmati rice',      400,  'g'),
  (2, 'Chicken',           600,  'g'),
  (2, 'Onion',             200,  'g'),
  (2, 'Yoghurt',           150,  'ml'),
  (2, 'Saffron',             1,  'pinch'),
  (2, 'Warm milk',          30,  'ml'),
  (2, 'Ghee',               40,  'g'),
  (2, 'Biryani masala',      2,  'tbsp'),
  (2, 'Ginger-garlic paste', 30, 'g'),
  (2, 'Mint leaves',         20, 'g'),
  (2, 'Salt',                2,  'tsp');

-- 3 · Paneer Tikka Masala (serves 4)
INSERT INTO recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  (3, 'Paneer',            400,  'g'),
  (3, 'Onion',             200,  'g'),
  (3, 'Tomato',            300,  'g'),
  (3, 'Yoghurt',            80,  'ml'),
  (3, 'Fresh cream',        60,  'ml'),
  (3, 'Tikka masala',        2,  'tbsp'),
  (3, 'Kasuri methi',        1,  'tsp'),
  (3, 'Oil',                 3,  'tbsp'),
  (3, 'Salt',                1,  'tsp');

-- 4 · Dal Makhani (serves 4)
INSERT INTO recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  (4, 'Whole black lentils (urad dal)', 200, 'g'),
  (4, 'Rajma (kidney beans)',           50,  'g'),
  (4, 'Butter',                         50,  'g'),
  (4, 'Fresh cream',                    60,  'ml'),
  (4, 'Onion',                         120,  'g'),
  (4, 'Tomato purée',                  150,  'ml'),
  (4, 'Ginger-garlic paste',            20,  'g'),
  (4, 'Cumin seeds',                     1,  'tsp'),
  (4, 'Coriander powder',                1,  'tsp'),
  (4, 'Salt',                            1,  'tsp');

-- 5 · Pasta Arrabiata (serves 4)
INSERT INTO recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  (5, 'Penne pasta',       400,  'g'),
  (5, 'Canned tomatoes',   400,  'g'),
  (5, 'Garlic',              6,  null),
  (5, 'Red chilli flakes',   2,  'tsp'),
  (5, 'Olive oil',          60,  'ml'),
  (5, 'Fresh basil',        10,  'g'),
  (5, 'Parmesan',           40,  'g'),
  (5, 'Salt',                1,  'tsp');

-- 6 · Masala Dosa (serves 4)
INSERT INTO recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  (6, 'Dosa batter',       500,  'ml'),
  (6, 'Potato',            400,  'g'),
  (6, 'Onion',             150,  'g'),
  (6, 'Mustard seeds',       1,  'tsp'),
  (6, 'Curry leaves',        1,  'tbsp'),
  (6, 'Turmeric',          0.5,  'tsp'),
  (6, 'Oil',                 3,  'tbsp'),
  (6, 'Salt',                1,  'tsp');

-- 7 · Grilled Salmon (serves 2)
INSERT INTO recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  (7, 'Salmon fillet',     400,  'g'),
  (7, 'Butter',             30,  'g'),
  (7, 'Lemon',               1,  null),
  (7, 'Capers',             20,  'g'),
  (7, 'Garlic',              3,  null),
  (7, 'Fresh dill',          5,  'g'),
  (7, 'Olive oil',          20,  'ml'),
  (7, 'Salt & pepper',       1,  'tsp');

-- 8 · Pad Thai (serves 4)
INSERT INTO recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  (8, 'Rice noodles',      300,  'g'),
  (8, 'Tofu',              200,  'g'),
  (8, 'Eggs',                3,  null),
  (8, 'Bean sprouts',      100,  'g'),
  (8, 'Spring onion',       50,  'g'),
  (8, 'Roasted peanuts',    60,  'g'),
  (8, 'Tamarind paste',     40,  'ml'),
  (8, 'Fish sauce',         30,  'ml'),
  (8, 'Palm sugar',         20,  'g'),
  (8, 'Oil',                30,  'ml');

-- 9 · Chicken Curry (serves 4)
INSERT INTO recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  (9, 'Chicken',           600,  'g'),
  (9, 'Onion',             200,  'g'),
  (9, 'Tomato',            200,  'g'),
  (9, 'Ginger-garlic paste', 30, 'g'),
  (9, 'Coriander powder',    2,  'tsp'),
  (9, 'Cumin powder',        1,  'tsp'),
  (9, 'Turmeric',          0.5,  'tsp'),
  (9, 'Garam masala',        1,  'tsp'),
  (9, 'Oil',                 3,  'tbsp'),
  (9, 'Salt',                1,  'tsp');

-- 10 · Masala Chai (serves 2)
INSERT INTO recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES
  (10, 'Milk',               200, 'ml'),
  (10, 'Water',              100, 'ml'),
  (10, 'Loose tea powder',     2, 'tsp'),
  (10, 'Sugar',                2, 'tsp'),
  (10, 'Fresh ginger',         5, 'g'),
  (10, 'Cardamom pods',        3, null),
  (10, 'Cinnamon stick',       1, null),
  (10, 'Cloves',               2, null);
