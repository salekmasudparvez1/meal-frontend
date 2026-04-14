import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { z } from "zod";

const firebaseConfigSchema = z.object({
  VITE_apiKey: z.string().min(1),
  VITE_authDomain: z.string().min(1),
  VITE_projectId: z.string().min(1),
  VITE_storageBucket: z.string().min(1),
  VITE_messagingSenderId: z.string().min(1),
  VITE_appId: z.string().min(1),
});

const firebaseConfig = firebaseConfigSchema.parse(import.meta.env);

export const firebaseApp = initializeApp({
  apiKey: firebaseConfig.VITE_apiKey,
  authDomain: firebaseConfig.VITE_authDomain,
  projectId: firebaseConfig.VITE_projectId,
  storageBucket: firebaseConfig.VITE_storageBucket,
  messagingSenderId: firebaseConfig.VITE_messagingSenderId,
  appId: firebaseConfig.VITE_appId,
  measurementId: import.meta.env.VITE_measurementId,
});

export const firebaseAuth = getAuth(firebaseApp);
