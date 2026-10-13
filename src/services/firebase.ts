import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey;
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId;
const appId = import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfig.appId;
const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfig.authDomain;
const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket;
const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig.messagingSenderId;
const firestoreDatabaseId = import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || firebaseConfig.firestoreDatabaseId;

if (!apiKey) throw new Error("Variável VITE_FIREBASE_API_KEY ausente ou vazia.");
if (!projectId) throw new Error("Variável VITE_FIREBASE_PROJECT_ID ausente ou vazia.");
if (!appId) throw new Error("Variável VITE_FIREBASE_APP_ID ausente ou vazia.");
if (!authDomain) throw new Error("Variável VITE_FIREBASE_AUTH_DOMAIN ausente ou vazia.");
if (!storageBucket) throw new Error("Variável VITE_FIREBASE_STORAGE_BUCKET ausente ou vazia.");
if (!messagingSenderId) throw new Error("Variável VITE_FIREBASE_MESSAGING_SENDER_ID ausente ou vazia.");

const config = {
  apiKey,
  projectId,
  appId,
  authDomain,
  storageBucket,
  messagingSenderId,
};

const app = initializeApp(config);
export const db = getFirestore(app, firestoreDatabaseId);
export const auth = getAuth();

export const loginWithGoogle = () => signInWithPopup(auth, new GoogleAuthProvider());
export const logout = () => signOut(auth);
export const subscribeToAuth = (callback: (user: User | null) => void) => onAuthStateChanged(auth, callback);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  console.error(`Firestore Error [${operationType}] at ${path}:`, error);
  throw error;
}
