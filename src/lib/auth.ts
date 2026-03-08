import { betterAuth, Session } from "better-auth";
import { localization } from "better-auth-localization";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { headers } from "next/headers";
import db from "./db";
import * as schema from "./model/auth-schema";


export const auth = betterAuth({
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema: schema
    }),
    user:{
      additionalFields: {
        admin: {
          type: "boolean",
          default: false,
        }
      }
    },
    emailAndPassword: {
        enabled: true,
    },
    plugins: [

    localization({
      defaultLocale: "de-DE", // Default to German
      fallbackLocale: "default" // Fallback to English
    })
  ]
});

export async function requireAdmin() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    return { authenticated: false, admin: false };
  }

  return { authenticated: true, admin: session.user.admin, session };
}