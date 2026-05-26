-- Krisna Media - Database Schema
-- Jalankan SQL ini di Supabase SQL Editor

-- 1. Products table (jasa & produk)
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  category VARCHAR(50) NOT NULL CHECK (category IN ('sound', 'lighting', 'studio', 'senar-gitar')),
  description TEXT,
  price DECIMAL(12, 0) NOT NULL DEFAULT 0,
  price_unit VARCHAR(50) DEFAULT 'paket',
  image_url TEXT,
  stock INT DEFAULT NULL,
  is_active BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Bookings table (pemesanan)
CREATE TABLE bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50) NOT NULL,
  customer_email VARCHAR(255),
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name VARCHAR(255), -- denormalized for history
  booking_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  payment_method VARCHAR(50),
  payment_proof TEXT,
  total_price DECIMAL(12, 0),
  notes TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Testimonials table
CREATE TABLE testimonials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  rating INT DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Profiles table (admin users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name VARCHAR(255),
  avatar_url TEXT,
  role VARCHAR(20) DEFAULT 'admin' CHECK (role IN ('admin', 'superadmin')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Site settings
CREATE TABLE site_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key VARCHAR(100) NOT NULL UNIQUE,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default settings
INSERT INTO site_settings (key, value) VALUES
('site_name', '"Krisna Media"'),
('tagline', '"Sound | Lighting | Studio | Gear"'),
('whatsapp', '"+628115191097"'),
('email', '"krisna.media.bdj@gmail.com"'),
('address', '"Banjarmasin, Kalimantan Selatan"'),
('social_media', '{"instagram": "", "facebook": "", "youtube": ""}');

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Public read, admin write
CREATE POLICY "Public read products" ON products FOR SELECT USING (true);
CREATE POLICY "Admin insert products" ON products FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admin update products" ON products FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Admin delete products" ON products FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Public insert bookings" ON bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read own bookings" ON bookings FOR SELECT USING (true);
CREATE POLICY "Admin all bookings" ON bookings FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Public read testimonials" ON testimonials FOR SELECT USING (true);
CREATE POLICY "Admin all testimonials" ON testimonials FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Public read site_settings" ON site_settings FOR SELECT USING (true);
CREATE POLICY "Admin update site_settings" ON site_settings FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Users read own profile" ON profiles FOR SELECT USING (auth.uid() = id OR auth.role() = 'authenticated');
CREATE POLICY "Admin update profiles" ON profiles FOR UPDATE USING (auth.role() = 'authenticated');

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'avatar_url',
    'admin'
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Seed data: services
INSERT INTO products (name, slug, category, description, price, price_unit, featured, sort_order) VALUES
('Sound System Basic', 'sound-system-basic', 'sound', 'Paket sound system untuk acara indoor kecil. Cocok untuk kafe, seminar, acara keluarga. Includes: 2 speaker aktif, mixer 8ch, 2 wireless mic, stand mic.', 1500000, 'paket', true, 1),
('Sound System Medium', 'sound-system-medium', 'sound', 'Paket sound system untuk acara medium. Cocok untuk pesta pernikahan indoor, acara sekolah. Includes: 4 speaker aktif, mixer 16ch, 4 wireless mic, 2 stand mic, monitor.', 3000000, 'paket', true, 2),
('Sound System Large', 'sound-system-large', 'sound', 'Paket sound system untuk acara besar. Cocok untuk konser indoor, acara gedung. Includes: 6 speaker aktif, mixer 24ch, 6 wireless mic, 4 stand mic, monitor, subwoofer.', 5000000, 'paket', false, 3),
('Lighting Basic', 'lighting-basic', 'lighting', 'Paket lighting untuk acara indoor kecil. Includes: 4 PAR LED, 1 controller, stand lighting, efek asap (smoke machine).', 1000000, 'paket', true, 4),
('Lighting Medium', 'lighting-medium', 'lighting', 'Paket lighting untuk panggung medium. Includes: 8 PAR LED, 2 moving head, 1 controller, stand lighting, smoke machine, efek strobo.', 2500000, 'paket', true, 5),
('Lighting Large', 'lighting-large', 'lighting', 'Paket lighting lengkap untuk panggung besar. Includes: 16 PAR LED, 4 moving head, 2 controller, truss system, smoke machine, strobo, efek laser.', 4500000, 'paket', false, 6),
('Rental Studio Musik (Per Jam)', 'rental-studio-per-jam', 'studio', 'Sewa studio musik untuk latihan band atau rekaman. Dilengkapi dengan drum set, amplifier gitar & bass, keyboard, dan sound system studio.', 75000, 'jam', true, 7),
('Rental Studio Musik (Paket 5 Jam)', 'rental-studio-paket-5', 'studio', 'Paket hemat sewa studio musik 5 jam. Cocok untuk sesi latihan atau rekaman.', 300000, 'paket', false, 8),
('Senar Gitar Akustik', 'senar-gitar-akustik', 'senar-gitar', 'Senar gitar akustik berkualitas. Merk ternama, suara jernih dan tahan lama.', 50000, 'set', true, 9),
('Senar Gitar Elektrik', 'senar-gitar-elektrik', 'senar-gitar', 'Senar gitar elektrik. Cocok untuk berbagai genre musik.', 65000, 'set', false, 10),
('Senar Gitar Bass', 'senar-gitar-bass', 'senar-gitar', 'Senar gitar bass 4 string. Kualitas profesional.', 120000, 'set', false, 11);

-- Seed testimonials
INSERT INTO testimonials (customer_name, content, rating) VALUES
('Budi Santoso', 'Sound system untuk acara pernikahan anak saya sangat memuaskan. Suara jernih, tim datang tepat waktu. Recommended!', 5),
('Sari Dewi', 'Sewa lighting untuk acara ulang tahun cafe, hasilnya keren banget! Suasana jadi hidup. Makasih Krisna Media!', 5),
('Andi Pratama', 'Studio musiknya nyaman untuk latihan band. Peralatannya lengkap dan terawat. Harga terjangkau.', 4),
('Rina Wijaya', 'Beli senar gitar disini, original dan harganya bersahabat. Pelayanannya ramah.', 5);
