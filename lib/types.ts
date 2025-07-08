// Existing types
export interface Item {
  item_id: number
  name: string
  description: string | null
  category: string | null
  purchase_date: string | null
  purchase_price: number | null
  condition: string | null
  notes: string | null
  created_at: string
  updated_at: string
  // Additional fields from the database
  purchased_from: string | null
  serial_number: string | null
  warranty_provider: string | null
  warranty_expiration: string | null
  storage_location: string | null
  current_value: number | null
  depreciation_rate: number | null
  has_insurance: boolean
  insurance_provider: string | null
  insurance_policy: string | null
  insurance_coverage: number | null
  insurance_category: string | null
  needs_maintenance: boolean
  maintenance_interval: number | null
  maintenance_instructions: string | null
  // Relations
  room?: {
    room_id: number
    name: string
    floor_number: number
  }
  media?: Media[]
  tags?: Tag[]
  maintenance?: Maintenance[]
}

export interface Room {
  room_id: number
  user_id: number
  name: string
  description: string | null
  floor_number: number
  area_sqft: number | null
  room_type?: string | null
  has_closet?: boolean
  wall_color?: string | null
  wall_color_hex?: string | null
  flooring_type?: string | null
  window_count?: number
  window_width?: number | null
  window_height?: number | null
  ceiling_lights?: string | null
  wall_lights?: string | null
  identifying_features?: string | null
  last_cleaned?: string | null
  cleaning_frequency?: number | null
  painting_needed?: string | null
  air_filter_location?: string | null
  maintenance_notes?: string | null
  created_at: string
}

export interface Maintenance {
  maintenance_id: number
  item_id: number
  item_name?: string
  maintenance_type: string
  frequency_days: number | null
  last_performed: string | null
  next_due: string | null
  instructions: string | null
  created_at: string
  updated_at: string
}

// New types for documentation system
export interface Document {
  document_id: number
  title: string
  description: string | null
  content: string | null
  category: string | null
  status: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface DocumentVersion {
  version_id: number
  document_id: number
  version_number: number
  content: string | null
  change_notes: string | null
  created_by: string | null
  created_at: string
}

export interface DocumentFile {
  file_id: number
  document_id: number
  version_id: number | null
  file_path: string
  file_name: string
  file_size: number | null
  mime_type: string | null
  created_at: string
}

export interface DocumentRelation {
  relation_id: number
  document_id: number
  relation_type: string
  related_id: number
  related_name?: string
  created_at: string
}

export interface Media {
  media_id: number
  item_id: number
  media_type: string
  file_path: string
  file_name: string
  file_size: number | null
  mime_type: string | null
  metadata: any
  created_at: string
}

export interface Tag {
  tag_id: number
  name: string
  color: string | null
  item_count?: number
}

export interface MaintenanceLog {
  log_id: number
  maintenance_id: number
  performed_date: string
  performed_by: string | null
  notes: string | null
  cost: number | null
  created_at: string
}

export type RoomFormData = {
  name: string
  description: string | null
  floor_number: string
  area_sqft: string | null
}

export interface User {
  user_id: number
  email: string
  full_name: string | null
  created_at: string
  updated_at: string
}
