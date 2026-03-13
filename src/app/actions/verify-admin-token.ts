'use server';

export async function verifyAdminToken(token: string): Promise<{ valid: boolean }> {
  const storedToken = process.env.ADMIN_SIGNUP_TOKEN;
  
  // Token is invalid if:
  // 1. No token exists (already used or no token was generated)
  // 2. Provided token doesn't match
  if (!storedToken || token !== storedToken) {
    return { valid: false };
  }

  return { valid: true };
}
