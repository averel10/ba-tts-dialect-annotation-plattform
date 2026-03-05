import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/lib/model/*",
  dialect: "sqlite",
  dbCredentials: {
    url: "./sqlite_data.db"
  }
});
