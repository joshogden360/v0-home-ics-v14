const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

async function runMigration(sql, migrationFile) {
  console.log(`Running migration: ${migrationFile}`);
  
  try {
    const migrationPath = path.join(__dirname, '../migrations', migrationFile);
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split the SQL by "-- Up" and "-- Down" sections
    const upSection = migrationSQL.split('-- Up')[1]?.split('-- Down')[0];
    
    if (!upSection) {
      throw new Error(`No "-- Up" section found in ${migrationFile}`);
    }
    
    // Split into individual statements, handling function definitions
    const statements = [];
    const lines = upSection.split('\n');
    let currentStatement = '';
    let inFunction = false;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip empty lines and comments
      if (!trimmedLine || trimmedLine.startsWith('--')) {
        continue;
      }
      
      // Track if we're inside a function definition
      if (trimmedLine.includes('CREATE OR REPLACE FUNCTION') || trimmedLine.includes('CREATE FUNCTION')) {
        inFunction = true;
      }
      
      currentStatement += line + '\n';
      
      // End of statement detection
      if (trimmedLine.endsWith(';')) {
        if (inFunction && (trimmedLine.includes('$$ LANGUAGE') || trimmedLine.includes('$$ language'))) {
          // End of function definition
          inFunction = false;
          statements.push(currentStatement.trim());
          currentStatement = '';
        } else if (!inFunction) {
          // Regular statement
          statements.push(currentStatement.trim());
          currentStatement = '';
        }
        // If we're still in function, continue building the statement
      }
    }
    
    // Add any remaining statement
    if (currentStatement.trim()) {
      statements.push(currentStatement.trim());
    }
    
    // Filter out empty statements
    const cleanStatements = statements.filter(stmt => stmt.length > 0);
    
    // Execute each statement individually using template literals
    for (const statement of cleanStatements) {
      console.log(`Executing: ${statement.substring(0, 50)}...`);
      // Use sql.query for raw SQL strings
      await sql.query(statement);
    }
    
    console.log(`✅ Successfully applied: ${migrationFile}`);
  } catch (error) {
    console.error(`❌ Failed to apply: ${migrationFile}`);
    throw error;
  }
}

async function main() {
  const sql = neon(process.env.DATABASE_URL);
  
  console.log('🚀 Starting database migrations...');
  
  try {
    // Run migrations in order
    await runMigration(sql, '001_create_users_table.sql');
    await runMigration(sql, '002_create_full_schema.sql');
    await runMigration(sql, '003_enable_row_level_security.sql');
    
    console.log('🎉 All migrations applied successfully!');
  } catch (error) {
    console.error('💥 Migration failed:', error.message);
    process.exit(1);
  }
}

main(); 