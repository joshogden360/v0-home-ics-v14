# Neon + Auth0 Integration with Row Level Security

This document outlines the implementation of Auth0 authentication with Neon PostgreSQL database using Row Level Security (RLS) for secure multi-tenant data access.

## Overview

This integration provides:
- **Auth0 Authentication**: Secure user authentication and authorization
- **Neon PostgreSQL**: Serverless PostgreSQL database
- **Row Level Security**: Database-level security ensuring users can only access their own data
- **User Context Management**: Automatic setting of user context for RLS policies

## Database Schema

### Key Changes Made

1. **Updated Users Table**: Modified to store Auth0 user IDs instead of passwords
2. **Added user_id Foreign Keys**: All user-specific tables now reference the users table
3. **Enabled RLS**: Row Level Security enabled on all user-specific tables
4. **Security Policies**: Comprehensive policies ensuring data isolation between users

### Migration Files

- `002_create_full_schema.sql`: Creates all tables with Auth0 integration
- `003_enable_row_level_security.sql`: Enables RLS and creates security policies

## Implementation Guide

### 1. Run Database Migrations

```bash
# Apply the migrations to your Neon database
psql $DATABASE_URL -f db/migrations/002_create_full_schema.sql
psql $DATABASE_URL -f db/migrations/003_enable_row_level_security.sql
```

### 2. Environment Variables

Add these to your `.env.local`:

```env
# Neon Database
DATABASE_URL=postgresql://username:password@your-neon-hostname/database

# Auth0 Configuration
AUTH0_SECRET=your-auth0-secret
AUTH0_BASE_URL=http://localhost:3000
AUTH0_ISSUER_BASE_URL=https://your-tenant.auth0.com
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret
```

### 3. Install Auth0 SDK

```bash
npm install @auth0/nextjs-auth0
```

### 4. Auth0 Configuration

Create `app/api/auth/[...auth0]/route.ts`:

```typescript
import { handleAuth, handleLogin, handleCallback } from '@auth0/nextjs-auth0';
import { upsertUserFromAuth0 } from '@/lib/auth0-rls';

export const GET = handleAuth({
  login: handleLogin(),
  callback: handleCallback({
    afterCallback: async (req, session) => {
      // Create or update user in database
      if (session.user) {
        await upsertUserFromAuth0({
          sub: session.user.sub,
          email: session.user.email,
          name: session.user.name,
          picture: session.user.picture
        });
      }
      return session;
    }
  })
});
```

### 5. User Context in API Routes

For API routes that need database access:

```typescript
import { getSession } from '@auth0/nextjs-auth0';
import { withUserContext } from '@/lib/auth0-rls';

export async function GET(request: Request) {
  const session = await getSession();
  
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const items = await withUserContext(session.user.sub, async () => {
      // Database operations here will automatically respect RLS policies
      return await sql`SELECT * FROM items`;
    });

    return Response.json(items);
  } catch (error) {
    return new Response('Internal Server Error', { status: 500 });
  }
}
```

### 6. Server Actions with Auth0

Update your server actions to include Auth0 user context:

```typescript
// Before (old way)
export async function createItem(formData: FormData) {
  // ...
}

// After (with Auth0 + RLS)
import { getSession } from '@auth0/nextjs-auth0';
import { createItem } from '@/lib/actions/items-auth0';

export async function createItemAction(formData: FormData) {
  const session = await getSession();
  
  if (!session?.user?.sub) {
    return { success: false, error: 'Authentication required' };
  }

  return await createItem(formData, session.user.sub);
}
```

### 7. Frontend Components

Update your components to use the new Auth0-integrated actions:

```typescript
import { useUser } from '@auth0/nextjs-auth0/client';
import { createItemAction } from '@/lib/actions/items-auth0';

export function ItemForm() {
  const { user, isLoading } = useUser();

  if (isLoading) return <div>Loading...</div>;
  if (!user) return <div>Please log in</div>;

  async function handleSubmit(formData: FormData) {
    const result = await createItemAction(formData);
    // Handle result...
  }

  return (
    <form action={handleSubmit}>
      {/* Your form fields */}
    </form>
  );
}
```

## Row Level Security Policies

### How RLS Works

1. **User Context**: Before each database operation, we set the Auth0 user ID in a PostgreSQL session variable
2. **Policy Enforcement**: RLS policies automatically filter queries based on the current user context
3. **Automatic Security**: Users can only see/modify data they own, enforced at the database level

### Example Policies

```sql
-- Items table policy
CREATE POLICY "Users can view their own items" ON items FOR SELECT
TO authenticated
USING (user_id = get_current_user_id());

-- The get_current_user_id() function retrieves the current user's database ID
-- based on their Auth0 ID stored in the session variable
```

### Benefits

- **Security**: Impossible to accidentally expose other users' data
- **Performance**: Database-level filtering is more efficient than application-level filtering
- **Simplicity**: No need to add WHERE clauses to every query
- **Compliance**: Meets strict data isolation requirements

## Testing the Integration

### 1. Create Test Users

Create test users in your Auth0 dashboard with different email addresses.

### 2. Verify Data Isolation

1. Log in as User A and create some items
2. Log out and log in as User B
3. Verify that User B cannot see User A's items
4. Create items as User B
5. Log back in as User A and verify they still only see their own items

### 3. Database Verification

You can also test directly in the database:

```sql
-- Set user context manually
SELECT set_config('app.current_user_auth0_id', 'auth0|user1_id', true);

-- This should only return user1's items
SELECT * FROM items;

-- Change context
SELECT set_config('app.current_user_auth0_id', 'auth0|user2_id', true);

-- This should only return user2's items
SELECT * FROM items;
```

## Troubleshooting

### Common Issues

1. **RLS Blocking All Access**: Ensure the user context is properly set before database queries
2. **Auth0 User Not Found**: Make sure the `upsertUserFromAuth0` function is called in the Auth0 callback
3. **Permission Denied**: Check that the RLS policies are correctly configured

### Debugging

```typescript
// Add logging to see the current user context
console.log('Auth0 User:', session.user.sub);

// Check database user context
await sql`SELECT current_setting('app.current_user_auth0_id', true)`;
```

## Security Considerations

1. **Always Use withUserContext**: Never make database queries without setting user context first
2. **Validate Auth0 Tokens**: Always verify Auth0 sessions before processing requests
3. **Audit Trails**: Consider adding audit logging for sensitive operations
4. **Regular Security Reviews**: Periodically review RLS policies and access patterns

## Next Steps

1. **Implement Auth0 in Frontend**: Add Auth0 UserProvider to your app layout
2. **Update All Actions**: Migrate all existing server actions to use the Auth0-integrated versions
3. **Add Role-Based Access**: Extend RLS policies to support different user roles if needed
4. **Monitor Performance**: Keep an eye on database performance with RLS enabled 