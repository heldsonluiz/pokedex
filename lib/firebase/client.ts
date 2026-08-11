"use client"

import { getApp, getApps, initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"

import { env } from "@/env"

const firebaseClientApp =
  getApps().length > 0
    ? getApp()
    : initializeApp({
        apiKey: env.NEXT_PUBLIC_FB_API_KEY,
        authDomain: env.NEXT_PUBLIC_FB_AUTH_DOMAIN,
        projectId: env.NEXT_PUBLIC_FB_PROJECT_ID,
        storageBucket: env.NEXT_PUBLIC_FB_STORAGE_BUCKET,
        messagingSenderId: env.NEXT_PUBLIC_FB_MESSAGING_SENDER_ID,
        appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
      })

export const clientFirestore = getFirestore(firebaseClientApp)
