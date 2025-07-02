import { neon } from '@neondatabase/serverless';

export async function GET(request: Request) {
    try {
        // For testing purposes, we'll simulate a user context
        // In production, this would come from your Auth0 session
        const testAuth0UserId = 'auth0|test_user_123';

        // For initial testing, use the regular DATABASE_URL without authentication
        // We'll test RLS functionality at the database level
        const sql = neon(process.env.DATABASE_URL!);

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
                step1: 'Run your database migrations: npm run db:migrate',
                step2: 'This test uses regular DATABASE_URL (not authenticated)',
                step3: 'For full Auth0 + RLS: set up DATABASE_AUTHENTICATED_URL with valid JWT',
                step4: 'Create a test user in your database to see RLS in action'
            },
            nextSteps: {
                migrations: 'If migrations not run, RLS policies may not exist',
                authentication: 'Currently testing basic RLS without Auth0 JWT',
                fullSetup: 'Once working, switch to DATABASE_AUTHENTICATED_URL with Auth0 tokens'
            }
        });

    } catch (error) {
        console.error('Error in RLS test:', error);
        return Response.json({ 
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            suggestions: [
                'Make sure your DATABASE_URL is set in .env.local',
                'Run database migrations: npm run db:migrate',
                'Check that your Neon database is accessible',
                'Verify your database connection string is correct'
            ]
        }, { status: 500 });
    }
} 