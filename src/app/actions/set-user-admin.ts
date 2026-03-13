'use server';

import { auth } from '@/lib/auth';
import db from '@/lib/db';
import { user } from '@/lib/model/auth-schema';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { verifyAdminToken } from './verify-admin-token';

export async function setUserAsAdmin(email: string, adminToken: string): Promise<{ success: boolean; error?: string }> {
  // Verify the token is valid
  const tokenResult = await verifyAdminToken(adminToken);
  
  if (!tokenResult.valid) {
    return { success: false, error: 'Invalid or expired admin token' };
  }

  try {
    // Update user admin flag
    await db.update(user).set({ admin: true }).where(eq(user.email, email));
    
    // Clear the token so it can't be used again
    delete process.env.ADMIN_SIGNUP_TOKEN;
    
    return { success: true };
  } catch (error) {
    console.error('Error setting admin:', error);
    return { success: false, error: 'Failed to set admin status' };
  }
}
