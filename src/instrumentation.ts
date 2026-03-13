import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import db from '@/lib/db';
import { join } from 'path';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      console.log('Running database migrations...');

      const migrationsFolder = join(process.cwd(), 'drizzle');
      
      // Use Drizzle's built-in migrate function
      migrate(db, { migrationsFolder });

      console.log('✓ Database migrations completed successfully');
    } catch (error) {
      console.error('Failed to run database migrations:', error);
      process.exit(1);
    }
  }
}

