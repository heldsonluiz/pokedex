import "server-only"

import { cert, getApps, initializeApp } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"

import { env } from "@/env"

const firebaseAdminApp =
  getApps()[0] ??
  initializeApp({
    credential: cert({
      projectId: env.FB_ADMIN_PROJECT_ID,
      clientEmail: env.FB_ADMIN_CLIENT_EMAIL,
      privateKey: env.FB_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  })

export const firestore = getFirestore(firebaseAdminApp)
