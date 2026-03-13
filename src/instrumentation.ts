import { eq } from 'drizzle-orm';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Import nodejs-only modules dynamically
    const { migrate } = await import('drizzle-orm/better-sqlite3/migrator');
    const { join } = await import('path');
    const { randomBytes } = await import('crypto');
    const { count } = await import('drizzle-orm');
    const db = (await import('@/lib/db')).default;
    const { user } = await import('@/lib/model/auth-schema');

    try {
      console.log('Running database migrations...');

      const migrationsFolder = join(process.cwd(), 'drizzle');
      
      // Use Drizzle's built-in migrate function
      migrate(db, { migrationsFolder });

      console.log('✓ Database migrations completed successfully');

      // Check if any admin exists
      const adminCount = await db.select({ count: count() }).from(user).where(eq(user.admin, true));
      const hasAdmin = adminCount.length > 0 && adminCount[0].count > 0;

      // If no admin exists, generate a one-time token
      if (!hasAdmin) {
        const token = randomBytes(32).toString('hex');
        process.env.ADMIN_SIGNUP_TOKEN = token;
        console.log('\n╔════════════════════════════════════════════════════════════════╗');
        console.log('║                   ADMIN TOKEN GENERATED                        ║');
        console.log('╠════════════════════════════════════════════════════════════════╣');
        console.log(`║ Token: ${token}                               ║`);
        console.log('║                                                                ║');
        console.log('║ This token can be used ONCE to upgrade a user to admin.        ║');
        console.log('║ After the first use, it will become invalid.                   ║');
        console.log('║                                                                ║');
        console.log('║ 1. Sign in with your account                                   ║');
        console.log('║ 2. Try to access /admin                                        ║');
        console.log('║ 3. Enter this token when prompted                              ║');
        console.log('╚════════════════════════════════════════════════════════════════╝\n');
      }
    } catch (error) {
      console.error('Failed to initialize app:', error);
      process.exit(1);
    }
  }
}

