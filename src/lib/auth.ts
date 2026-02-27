import { betterAuth } from "better-auth";
import Database from "better-sqlite3";
import { localization } from "better-auth-localization";


export const auth = betterAuth({
    database: new Database("./sqlite_users.db"),
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