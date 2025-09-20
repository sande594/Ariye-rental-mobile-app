/*
  # Fix Database Schema

  1. Tables
    - Fix vehicles table to include missing columns
    - Fix bookings table and relationships
    - Add admin users functionality
    
  2. Security
    - Enable RLS on all tables
    - Add proper policies
    
  3. Relationships
    - Fix foreign key relationships between tables
*/

-- Drop existing tables if they exist to recreate with proper schema
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS favorites CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create vehicles table with all required columns
CREATE TABLE IF NOT EXISTS vehicles (
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
  rating numeric DEFAULT 0,
  total_reviews integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE CASCADE NOT NULL,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  pickup_location text NOT NULL,
  dropoff_location text,
  total_price numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  payment_status text NOT NULL DEFAULT 'pending',
  payment_method text,
  special_requests text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create favorites table
CREATE TABLE IF NOT EXISTS favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, vehicle_id)
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Vehicles policies
CREATE POLICY "Anyone can read vehicles"
  ON vehicles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage vehicles"
  ON vehicles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Bookings policies
CREATE POLICY "Users can read own bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create bookings"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Favorites policies
CREATE POLICY "Users can manage own favorites"
  ON favorites FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Insert sample vehicles
INSERT INTO vehicles (name, type, brand, model, year, price_per_day, passenger_capacity, fuel_type, transmission, image_url, description, features, location, available) VALUES
('Toyota Camry 2023', 'Sedan', 'Toyota', 'Camry', 2023, 45.00, 5, 'Gasoline', 'Automatic', 'https://images.pexels.com/photos/116675/pexels-photo-116675.jpeg', 'Comfortable and reliable sedan perfect for city driving', ARRAY['Air Conditioning', 'Bluetooth', 'Backup Camera', 'USB Ports'], 'Downtown', true),
('Honda CR-V 2022', 'SUV', 'Honda', 'CR-V', 2022, 65.00, 5, 'Gasoline', 'Automatic', 'https://images.pexels.com/photos/1007410/pexels-photo-1007410.jpeg', 'Spacious SUV ideal for family trips and adventures', ARRAY['All-Wheel Drive', 'Sunroof', 'Apple CarPlay', 'Safety Features'], 'Airport', true),
('BMW 3 Series 2023', 'Luxury', 'BMW', '3 Series', 2023, 85.00, 5, 'Gasoline', 'Automatic', 'https://images.pexels.com/photos/244206/pexels-photo-244206.jpeg', 'Premium luxury sedan with exceptional performance', ARRAY['Leather Seats', 'Premium Sound', 'Navigation', 'Heated Seats'], 'City Center', true),
('Ford F-150 2022', 'Truck', 'Ford', 'F-150', 2022, 75.00, 5, 'Gasoline', 'Automatic', 'https://images.pexels.com/photos/1335077/pexels-photo-1335077.jpeg', 'Powerful pickup truck for heavy-duty tasks', ARRAY['4WD', 'Towing Package', 'Bed Liner', 'Work Lights'], 'Industrial District', true);

-- Create admin user profile for the specified email
INSERT INTO profiles (id, email, full_name, is_admin) 
VALUES (
  gen_random_uuid(),
  'sandewilliam594@gmail.com',
  'Admin User',
  true
) ON CONFLICT (email) DO UPDATE SET is_admin = true;

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