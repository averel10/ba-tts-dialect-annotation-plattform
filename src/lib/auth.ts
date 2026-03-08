import { betterAuth } from "better-auth";
import { localization } from "better-auth-localization";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import db from "./db";


export const auth = betterAuth({
    database: drizzleAdapter(db, {
      provider: "sqlite",
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