import { config } from "dotenv";
import { z } from "zod";

config();

export function isTest() {
  return process.env.NODE_ENV === "test";
}

enum NATIVE {
  "a",
  "b",
}

const envSchema = z
  .object({
    APP_PORT: z.coerce.number().default(3002),
    DB_HOST: z.string().default("localhost"),
    MONGODB_DB: z.string().readonly(),
    // test: z.nativeEnum(NATIVE),
    // test: z.enum(["a", "b"]).default("a"),
  })
  .strip();

export const envConfig = envSchema.parse({
  APP_PORT: process.env.APP_PORT,
  DB_HOST: process.env.DB_HOST,
  MONGODB_DB: process.env.MONGODB_DB,
  test: "c",
});

console.log(envConfig);

export type EnvConfig = z.infer<typeof envSchema>;
