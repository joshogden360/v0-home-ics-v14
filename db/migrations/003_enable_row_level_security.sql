-- Up
-- Enable RLS for all user-specific tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_relations ENABLE ROW LEVEL SECURITY;

-- Create function to get current user's database ID from Auth0 ID
CREATE OR REPLACE FUNCTION get_current_user_id() 
RETURNS INTEGER AS $$
DECLARE
    user_id INTEGER;
BEGIN
    -- Get the Auth0 user ID from the JWT token
    -- This assumes Auth0 user ID is passed in the session or context
    SELECT u.user_id INTO user_id 
    FROM users u 
    WHERE u.auth0_id = current_setting('app.current_user_auth0_id', true);
    
    RETURN user_id;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Users table policies
CREATE POLICY "Users can view their own profile" ON users FOR SELECT
TO authenticated
USING (user_id = get_current_user_id());

CREATE POLICY "Users can update their own profile" ON users FOR UPDATE
TO authenticated
USING (user_id = get_current_user_id())
WITH CHECK (user_id = get_current_user_id());

-- Rooms table policies
CREATE POLICY "Users can create rooms" ON rooms FOR INSERT
TO authenticated
WITH CHECK (user_id = get_current_user_id());

CREATE POLICY "Users can view their own rooms" ON rooms FOR SELECT
TO authenticated
USING (user_id = get_current_user_id());

CREATE POLICY "Users can update their own rooms" ON rooms FOR UPDATE
TO authenticated
USING (user_id = get_current_user_id())
WITH CHECK (user_id = get_current_user_id());

CREATE POLICY "Users can delete their own rooms" ON rooms FOR DELETE
TO authenticated
USING (user_id = get_current_user_id());

-- Tags table policies
CREATE POLICY "Users can create tags" ON tags FOR INSERT
TO authenticated
WITH CHECK (user_id = get_current_user_id());

CREATE POLICY "Users can view their own tags" ON tags FOR SELECT
TO authenticated
USING (user_id = get_current_user_id());

CREATE POLICY "Users can update their own tags" ON tags FOR UPDATE
TO authenticated
USING (user_id = get_current_user_id())
WITH CHECK (user_id = get_current_user_id());

CREATE POLICY "Users can delete their own tags" ON tags FOR DELETE
TO authenticated
USING (user_id = get_current_user_id());

-- Items table policies
CREATE POLICY "Users can create items" ON items FOR INSERT
TO authenticated
WITH CHECK (user_id = get_current_user_id());

CREATE POLICY "Users can view their own items" ON items FOR SELECT
TO authenticated
USING (user_id = get_current_user_id());

CREATE POLICY "Users can update their own items" ON items FOR UPDATE
TO authenticated
USING (user_id = get_current_user_id())
WITH CHECK (user_id = get_current_user_id());

CREATE POLICY "Users can delete their own items" ON items FOR DELETE
TO authenticated
USING (user_id = get_current_user_id());

-- Item_tags table policies (inherits security from items and tags)
CREATE POLICY "Users can manage their item tags" ON item_tags FOR ALL
TO authenticated
USING (
    EXISTS (SELECT 1 FROM items i WHERE i.item_id = item_tags.item_id AND i.user_id = get_current_user_id())
    AND
    EXISTS (SELECT 1 FROM tags t WHERE t.tag_id = item_tags.tag_id AND t.user_id = get_current_user_id())
);

-- Media table policies (inherits security from items)
CREATE POLICY "Users can manage media for their items" ON media FOR ALL
TO authenticated
USING (
    EXISTS (SELECT 1 FROM items i WHERE i.item_id = media.item_id AND i.user_id = get_current_user_id())
);

-- Maintenance table policies (inherits security from items)
CREATE POLICY "Users can manage maintenance for their items" ON maintenance FOR ALL
TO authenticated
USING (
    EXISTS (SELECT 1 FROM items i WHERE i.item_id = maintenance.item_id AND i.user_id = get_current_user_id())
);

-- Maintenance_logs table policies (inherits security from maintenance)
CREATE POLICY "Users can manage maintenance logs for their items" ON maintenance_logs FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM maintenance m 
        JOIN items i ON i.item_id = m.item_id 
        WHERE m.maintenance_id = maintenance_logs.maintenance_id 
        AND i.user_id = get_current_user_id()
    )
);

-- Documents table policies
CREATE POLICY "Users can create documents" ON documents FOR INSERT
TO authenticated
WITH CHECK (user_id = get_current_user_id());

CREATE POLICY "Users can view their own documents" ON documents FOR SELECT
TO authenticated
USING (user_id = get_current_user_id());

CREATE POLICY "Users can update their own documents" ON documents FOR UPDATE
TO authenticated
USING (user_id = get_current_user_id())
WITH CHECK (user_id = get_current_user_id());

CREATE POLICY "Users can delete their own documents" ON documents FOR DELETE
TO authenticated
USING (user_id = get_current_user_id());

-- Document_versions table policies (inherits security from documents)
CREATE POLICY "Users can manage document versions" ON document_versions FOR ALL
TO authenticated
USING (
    EXISTS (SELECT 1 FROM documents d WHERE d.document_id = document_versions.document_id AND d.user_id = get_current_user_id())
);

-- Document_files table policies (inherits security from documents)
CREATE POLICY "Users can manage document files" ON document_files FOR ALL
TO authenticated
USING (
    EXISTS (SELECT 1 FROM documents d WHERE d.document_id = document_files.document_id AND d.user_id = get_current_user_id())
);

-- Document_relations table policies (inherits security from documents)
CREATE POLICY "Users can manage document relations" ON document_relations FOR ALL
TO authenticated
USING (
    EXISTS (SELECT 1 FROM documents d WHERE d.document_id = document_relations.document_id AND d.user_id = get_current_user_id())
);

-- Down
-- Drop all policies
DROP POLICY IF EXISTS "Users can manage document relations" ON document_relations;
DROP POLICY IF EXISTS "Users can manage document files" ON document_files;
DROP POLICY IF EXISTS "Users can manage document versions" ON document_versions;
DROP POLICY IF EXISTS "Users can delete their own documents" ON documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON documents;
DROP POLICY IF EXISTS "Users can view their own documents" ON documents;
DROP POLICY IF EXISTS "Users can create documents" ON documents;
DROP POLICY IF EXISTS "Users can manage maintenance logs for their items" ON maintenance_logs;
DROP POLICY IF EXISTS "Users can manage maintenance for their items" ON maintenance;
DROP POLICY IF EXISTS "Users can manage media for their items" ON media;
DROP POLICY IF EXISTS "Users can manage their item tags" ON item_tags;
DROP POLICY IF EXISTS "Users can delete their own items" ON items;
DROP POLICY IF EXISTS "Users can update their own items" ON items;
DROP POLICY IF EXISTS "Users can view their own items" ON items;
DROP POLICY IF EXISTS "Users can create items" ON items;
DROP POLICY IF EXISTS "Users can delete their own tags" ON tags;
DROP POLICY IF EXISTS "Users can update their own tags" ON tags;
DROP POLICY IF EXISTS "Users can view their own tags" ON tags;
DROP POLICY IF EXISTS "Users can create tags" ON tags;
DROP POLICY IF EXISTS "Users can delete their own rooms" ON rooms;
DROP POLICY IF EXISTS "Users can update their own rooms" ON rooms;
DROP POLICY IF EXISTS "Users can view their own rooms" ON rooms;
DROP POLICY IF EXISTS "Users can create rooms" ON rooms;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can view their own profile" ON users;

-- Drop function
DROP FUNCTION IF EXISTS get_current_user_id();

-- Disable RLS
ALTER TABLE document_relations DISABLE ROW LEVEL SECURITY;
ALTER TABLE document_files DISABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions DISABLE ROW LEVEL SECURITY;
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE media DISABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance DISABLE ROW LEVEL SECURITY;
ALTER TABLE items DISABLE ROW LEVEL SECURITY;
ALTER TABLE tags DISABLE ROW LEVEL SECURITY;
ALTER TABLE rooms DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY; 