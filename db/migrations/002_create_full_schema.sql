-- Up
-- Update users table for Auth0 integration
ALTER TABLE users 
  DROP COLUMN password_hash,
  ADD COLUMN auth0_id VARCHAR(255) UNIQUE,
  ADD COLUMN avatar_url VARCHAR(500),
  ADD COLUMN last_login TIMESTAMP WITH TIME ZONE;

-- Create rooms table
CREATE TABLE rooms (
  room_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  floor_number INTEGER NOT NULL DEFAULT 1,
  area_sqft DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create tags table
CREATE TABLE tags (
  tag_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(7) DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, name)
);

-- Create items table
CREATE TABLE items (
  item_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  room_id INTEGER REFERENCES rooms(room_id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  purchase_date DATE,
  purchase_price DECIMAL(12,2),
  purchased_from VARCHAR(255),
  serial_number VARCHAR(255),
  warranty_provider VARCHAR(255),
  warranty_expiration DATE,
  storage_location VARCHAR(255),
  current_value DECIMAL(12,2),
  depreciation_rate DECIMAL(5,2),
  condition VARCHAR(50) DEFAULT 'good',
  has_insurance BOOLEAN DEFAULT false,
  insurance_provider VARCHAR(255),
  insurance_policy VARCHAR(255),
  insurance_coverage DECIMAL(12,2),
  insurance_category VARCHAR(100),
  needs_maintenance BOOLEAN DEFAULT false,
  maintenance_interval INTEGER, -- days
  maintenance_instructions TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create item_tags junction table
CREATE TABLE item_tags (
  item_id INTEGER NOT NULL REFERENCES items(item_id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES tags(tag_id) ON DELETE CASCADE,
  PRIMARY KEY (item_id, tag_id)
);

-- Create media table
CREATE TABLE media (
  media_id SERIAL PRIMARY KEY,
  item_id INTEGER NOT NULL REFERENCES items(item_id) ON DELETE CASCADE,
  media_type VARCHAR(50) NOT NULL, -- 'image', 'video', 'document', etc.
  file_path VARCHAR(500) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size BIGINT,
  mime_type VARCHAR(100),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create maintenance table
CREATE TABLE maintenance (
  maintenance_id SERIAL PRIMARY KEY,
  item_id INTEGER NOT NULL REFERENCES items(item_id) ON DELETE CASCADE,
  maintenance_type VARCHAR(100) NOT NULL,
  frequency_days INTEGER,
  last_performed DATE,
  next_due DATE,
  instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create maintenance_logs table
CREATE TABLE maintenance_logs (
  log_id SERIAL PRIMARY KEY,
  maintenance_id INTEGER NOT NULL REFERENCES maintenance(maintenance_id) ON DELETE CASCADE,
  performed_date DATE NOT NULL,
  performed_by VARCHAR(255),
  notes TEXT,
  cost DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create documents table
CREATE TABLE documents (
  document_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  content TEXT,
  category VARCHAR(100),
  status VARCHAR(50) DEFAULT 'draft',
  created_by VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create document_versions table
CREATE TABLE document_versions (
  version_id SERIAL PRIMARY KEY,
  document_id INTEGER NOT NULL REFERENCES documents(document_id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  content TEXT,
  change_notes TEXT,
  created_by VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create document_files table
CREATE TABLE document_files (
  file_id SERIAL PRIMARY KEY,
  document_id INTEGER NOT NULL REFERENCES documents(document_id) ON DELETE CASCADE,
  version_id INTEGER REFERENCES document_versions(version_id) ON DELETE SET NULL,
  file_path VARCHAR(500) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size BIGINT,
  mime_type VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create document_relations table
CREATE TABLE document_relations (
  relation_id SERIAL PRIMARY KEY,
  document_id INTEGER NOT NULL REFERENCES documents(document_id) ON DELETE CASCADE,
  relation_type VARCHAR(50) NOT NULL, -- 'item', 'room', 'maintenance'
  related_id INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_items_user_id ON items(user_id);
CREATE INDEX idx_items_room_id ON items(room_id);
CREATE INDEX idx_items_category ON items(category);
CREATE INDEX idx_items_needs_maintenance ON items(needs_maintenance);
CREATE INDEX idx_rooms_user_id ON rooms(user_id);
CREATE INDEX idx_tags_user_id ON tags(user_id);
CREATE INDEX idx_maintenance_item_id ON maintenance(item_id);
CREATE INDEX idx_maintenance_next_due ON maintenance(next_due);
CREATE INDEX idx_media_item_id ON media(item_id);
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_document_versions_document_id ON document_versions(document_id);
CREATE INDEX idx_users_auth0_id ON users(auth0_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_maintenance_updated_at BEFORE UPDATE ON maintenance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Down
DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
DROP TRIGGER IF EXISTS update_maintenance_updated_at ON maintenance;
DROP TRIGGER IF EXISTS update_items_updated_at ON items;
DROP FUNCTION IF EXISTS update_updated_at_column();

DROP TABLE IF EXISTS document_relations;
DROP TABLE IF EXISTS document_files;
DROP TABLE IF EXISTS document_versions;
DROP TABLE IF EXISTS documents;
DROP TABLE IF EXISTS maintenance_logs;
DROP TABLE IF EXISTS maintenance;
DROP TABLE IF EXISTS media;
DROP TABLE IF EXISTS item_tags;
DROP TABLE IF EXISTS items;
DROP TABLE IF EXISTS tags;
DROP TABLE IF EXISTS rooms;

-- Revert users table changes
ALTER TABLE users 
  ADD COLUMN password_hash VARCHAR(255),
  DROP COLUMN auth0_id,
  DROP COLUMN avatar_url,
  DROP COLUMN last_login; 