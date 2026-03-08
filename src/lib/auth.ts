import { betterAuth } from "better-auth";
import { localization } from "better-auth-localization";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import db from "./db";
import { user, session, account, verification } from "./model";


export const auth = betterAuth({
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema: {
        user,
        session,
        account,
        verification,
      },
    }),
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