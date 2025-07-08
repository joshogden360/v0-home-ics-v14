-- Up
-- Create locations table for item-room relationships
CREATE TABLE locations (
  location_id SERIAL PRIMARY KEY,
  item_id INTEGER NOT NULL REFERENCES items(item_id) ON DELETE CASCADE,
  room_id INTEGER NOT NULL REFERENCES rooms(room_id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(item_id, room_id)
);

-- Create indexes for better performance
CREATE INDEX idx_locations_item_id ON locations(item_id);
CREATE INDEX idx_locations_room_id ON locations(room_id);

-- Create updated_at trigger
CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Down
DROP TRIGGER IF EXISTS update_locations_updated_at ON locations;
DROP TABLE IF EXISTS locations; 