import { createEnv } from "@t3-oss/env-nextjs"
import * as z from "zod"

export const env = createEnv({
  server: {
    AUTH_URL: z.url(),
    AUTH_TRUST_HOST: z.stringbool(),

    AUTH_SECRET: z.string().min(32),
    AUTH_GOOGLE_ID: z.string().min(1),
    AUTH_GOOGLE_SECRET: z.string().min(1),
    EVENT_ID: z.string().trim().min(1),
    QR_SIGNING_SECRET: z.string().min(32),
    DEVMODE: z.stringbool().optional().default(false),

    FB_ADMIN_PROJECT_ID: z.string().min(1),
    FB_ADMIN_CLIENT_EMAIL: z.string().email(),
    FB_ADMIN_PRIVATE_KEY: z.string().min(1),
  },

  client: {
    NEXT_PUBLIC_APP_URL: z.string().url(),
    NEXT_PUBLIC_FB_API_KEY: z.string().min(1),
    NEXT_PUBLIC_FB_AUTH_DOMAIN: z.string().min(1),
    NEXT_PUBLIC_FB_PROJECT_ID: z.string().min(1),
    NEXT_PUBLIC_FB_STORAGE_BUCKET: z.string().min(1),
    NEXT_PUBLIC_FB_MESSAGING_SENDER_ID: z.string().min(1),
    NEXT_PUBLIC_FIREBASE_APP_ID: z.string().min(1),
  },

  runtimeEnv: {
    AUTH_URL: process.env.AUTH_URL,
    AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST,

    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID,
    AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET,
    EVENT_ID: process.env.EVENT_ID,
    QR_SIGNING_SECRET: process.env.QR_SIGNING_SECRET,
    DEVMODE: process.env.DEVMODE,

    FB_ADMIN_PROJECT_ID: process.env.FB_ADMIN_PROJECT_ID,
    FB_ADMIN_CLIENT_EMAIL: process.env.FB_ADMIN_CLIENT_EMAIL,
    FB_ADMIN_PRIVATE_KEY: process.env.FB_ADMIN_PRIVATE_KEY,

    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_FB_API_KEY: process.env.NEXT_PUBLIC_FB_API_KEY,
    NEXT_PUBLIC_FB_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FB_AUTH_DOMAIN,
    NEXT_PUBLIC_FB_PROJECT_ID: process.env.NEXT_PUBLIC_FB_PROJECT_ID,
    NEXT_PUBLIC_FB_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FB_STORAGE_BUCKET,
    NEXT_PUBLIC_FB_MESSAGING_SENDER_ID:
      process.env.NEXT_PUBLIC_FB_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  },

  emptyStringAsUndefined: true,
})
