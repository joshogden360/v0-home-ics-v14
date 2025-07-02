import { neon } from '@neondatabase/serverless';

export async function GET(request: Request) {
    try {
        // For testing purposes, we'll simulate a user context
        // In production, this would come from your Auth0 session
        const testAuth0UserId = 'auth0|test_user_123';

        const sql = neon(process.env.DATABASE_AUTHENTICATED_URL!, {
            authToken: async () => {
                // For now, return a dummy token for testing
                // In production, this would be your actual Auth0 access token
                return 'test-token';
            },
        });

        // Test 1: Set user context for RLS
        await sql`SELECT set_config('app.current_user_auth0_id', ${testAuth0UserId}, true)`;

        // Test 2: Verify the context was set
        const contextResult = await sql`SELECT current_setting('app.current_user_auth0_id', true) as current_user`;
        
        // Test 3: Check if we have any users in the database
        const userCount = await sql`SELECT COUNT(*) as count FROM users`;
        
        // Test 4: Try to query items (this will work with RLS if user exists)
        let itemsResult;
        try {
            itemsResult = await sql`SELECT COUNT(*) as count FROM items`;
        } catch (error) {
            itemsResult = { error: error instanceof Error ? error.message : 'Unknown error' };
        }

        // Test 5: Check RLS function
        let rlsFunctionTest;
        try {
            rlsFunctionTest = await sql`SELECT get_current_user_id() as current_user_id`;
        } catch (error) {
            rlsFunctionTest = { error: error instanceof Error ? error.message : 'Unknown error' };
        }

        return Response.json({
            success: true,
            message: 'RLS Test Complete',
            results: {
                userContext: contextResult[0],
                userCount: userCount[0],
                itemsQuery: itemsResult,
                rlsFunction: rlsFunctionTest,
            },
            instructions: {
                step1: 'Run your database migrations first',
                step2: 'Create a test user in your database',
                step3: 'Then this endpoint will work properly with RLS'
            }
        });

    } catch (error) {
        console.error('Error in RLS test:', error);
        return Response.json({ 
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            suggestion: 'Make sure your DATABASE_AUTHENTICATED_URL is set and migrations are run'
        }, { status: 500 });
    }
} 