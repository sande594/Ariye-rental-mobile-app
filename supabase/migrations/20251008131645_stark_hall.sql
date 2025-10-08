/*
  # Fix Database Schema for Aryeh Rentals

  1. Tables
    - Create profiles table for user management
    - Create vehicles table with all required columns
    - Create bookings table with proper relationships
    - Create favorites table for user preferences
    
  2. Security
    - Enable RLS on all tables
    - Add comprehensive policies for data access
    
  3. Sample Data
    - Insert sample vehicles
    - Set up admin user
*/

-- Drop existing tables if they exist to recreate with proper schema
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS favorites CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Create profiles table
CREATE TABLE profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  phone text,
  date_of_birth date,
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create vehicles table with all required columns
CREATE TABLE vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL,
  brand text NOT NULL,
  model text NOT NULL,
  year integer NOT NULL,
  price_per_day numeric NOT NULL,
  passenger_capacity integer NOT NULL DEFAULT 4,
  fuel_type text NOT NULL DEFAULT 'Gasoline',
  transmission text NOT NULL DEFAULT 'Automatic',
  image_url text,
  description text,
  features text[] DEFAULT '{}',
  location text NOT NULL,
  latitude numeric,
  longitude numeric,
  available boolean DEFAULT true,
  rating numeric DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  total_reviews integer DEFAULT 0,
  mileage integer DEFAULT 0,
  license_plate text,
  vin text,
  insurance_policy text,
  last_maintenance date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create bookings table
CREATE TABLE bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE CASCADE NOT NULL,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  pickup_location text NOT NULL,
  dropoff_location text,
  total_price numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'active', 'completed', 'cancelled')),
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_method text,
  payment_intent_id text,
  special_requests text,
  driver_license text,
  insurance_verified boolean DEFAULT false,
  pickup_time time,
  dropoff_time time,
  actual_pickup_time timestamptz,
  actual_dropoff_time timestamptz,
  damage_report text,
  fuel_level_pickup integer CHECK (fuel_level_pickup >= 0 AND fuel_level_pickup <= 100),
  fuel_level_dropoff integer CHECK (fuel_level_dropoff >= 0 AND fuel_level_dropoff <= 100),
  mileage_start integer,
  mileage_end integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_dates CHECK (end_date > start_date)
);

-- Create favorites table
CREATE TABLE favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, vehicle_id)
);

-- Create reviews table
CREATE TABLE reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE CASCADE NOT NULL,
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, booking_id)
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can read all profiles" ON profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- Vehicles policies
CREATE POLICY "Anyone can read available vehicles" ON vehicles
  FOR SELECT TO authenticated
  USING (available = true);

CREATE POLICY "Admins can read all vehicles" ON vehicles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can manage vehicles" ON vehicles
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- Bookings policies
CREATE POLICY "Users can read own bookings" ON bookings
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create bookings" ON bookings
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookings" ON bookings
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all bookings" ON bookings
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can update all bookings" ON bookings
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- Favorites policies
CREATE POLICY "Users can manage own favorites" ON favorites
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Reviews policies
CREATE POLICY "Anyone can read reviews" ON reviews
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can create reviews for their bookings" ON reviews
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_id
      AND bookings.user_id = auth.uid()
      AND bookings.status = 'completed'
    )
  );

CREATE POLICY "Users can update own reviews" ON reviews
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Insert sample vehicles
INSERT INTO vehicles (name, type, brand, model, year, price_per_day, passenger_capacity, fuel_type, transmission, image_url, description, features, location, available, rating, total_reviews) VALUES
('Toyota Camry 2024', 'Sedan', 'Toyota', 'Camry', 2024, 45.00, 5, 'Gasoline', 'Automatic', 'https://images.pexels.com/photos/116675/pexels-photo-116675.jpeg', 'Comfortable and reliable sedan perfect for city driving and business trips', ARRAY['Air Conditioning', 'Bluetooth', 'Backup Camera', 'USB Ports', 'Cruise Control'], 'Downtown', true, 4.5, 23),

('Honda CR-V 2023', 'SUV', 'Honda', 'CR-V', 2023, 65.00, 5, 'Gasoline', 'Automatic', 'https://images.pexels.com/photos/1007410/pexels-photo-1007410.jpeg', 'Spacious SUV ideal for family trips and outdoor adventures', ARRAY['All-Wheel Drive', 'Sunroof', 'Apple CarPlay', 'Safety Features', 'Roof Rails'], 'Airport', true, 4.7, 31),

('BMW 3 Series 2024', 'Luxury', 'BMW', '3 Series', 2024, 85.00, 5, 'Gasoline', 'Automatic', 'https://images.pexels.com/photos/244206/pexels-photo-244206.jpeg', 'Premium luxury sedan with exceptional performance and comfort', ARRAY['Leather Seats', 'Premium Sound', 'Navigation', 'Heated Seats', 'Wireless Charging'], 'City Center', true, 4.8, 18),

('Ford F-150 2023', 'Truck', 'Ford', 'F-150', 2023, 75.00, 5, 'Gasoline', 'Automatic', 'https://images.pexels.com/photos/1335077/pexels-photo-1335077.jpeg', 'Powerful pickup truck perfect for heavy-duty tasks and hauling', ARRAY['4WD', 'Towing Package', 'Bed Liner', 'Work Lights', 'Trailer Assist'], 'Industrial District', true, 4.6, 27),

('Tesla Model 3 2024', 'Electric', 'Tesla', 'Model 3', 2024, 95.00, 5, 'Electric', 'Automatic', 'https://images.pexels.com/photos/1592384/pexels-photo-1592384.jpeg', 'Cutting-edge electric sedan with autopilot and premium features', ARRAY['Autopilot', 'Supercharging', 'Premium Interior', 'Glass Roof', 'Mobile Connector'], 'Tech District', true, 4.9, 42),

('Jeep Wrangler 2023', 'SUV', 'Jeep', 'Wrangler', 2023, 70.00, 4, 'Gasoline', 'Manual', 'https://images.pexels.com/photos/1638459/pexels-photo-1638459.jpeg', 'Rugged off-road SUV perfect for adventure seekers', ARRAY['4WD', 'Removable Doors', 'Fold-Down Windshield', 'Rock Rails', 'Skid Plates'], 'Adventure Center', true, 4.4, 19);

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, is_admin)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    CASE WHEN NEW.email = 'sandewilliam594@gmail.com' THEN true ELSE false END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update vehicle ratings
CREATE OR REPLACE FUNCTION update_vehicle_rating()
RETURNS trigger AS $$
BEGIN
  UPDATE vehicles
  SET 
    rating = (
      SELECT COALESCE(AVG(rating::numeric), 0)
      FROM reviews
      WHERE vehicle_id = COALESCE(NEW.vehicle_id, OLD.vehicle_id)
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM reviews
      WHERE vehicle_id = COALESCE(NEW.vehicle_id, OLD.vehicle_id)
    )
  WHERE id = COALESCE(NEW.vehicle_id, OLD.vehicle_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update vehicle ratings when reviews change
DROP TRIGGER IF EXISTS update_vehicle_rating_trigger ON reviews;
CREATE TRIGGER update_vehicle_rating_trigger
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_vehicle_rating();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vehicles_available ON vehicles(available);
CREATE INDEX IF NOT EXISTS idx_vehicles_type ON vehicles(type);
CREATE INDEX IF NOT EXISTS idx_vehicles_location ON vehicles(location);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_vehicle_id ON bookings(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_favorites_user_vehicle ON favorites(user_id, vehicle_id);
CREATE INDEX IF NOT EXISTS idx_reviews_vehicle_id ON reviews(vehicle_id);