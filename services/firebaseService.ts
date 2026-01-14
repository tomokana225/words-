import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  getDocs
} from "firebase/firestore";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  onAuthStateChanged,
  User
} from "firebase/auth";
import { Word } from "../types";

// Cloudflare のシークレットから直接読み込む
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

// 全ての必須項目が揃っているかチェック
const isConfigComplete = !!(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);

let db: any = null;
let auth: any = null;
const provider = new GoogleAuthProvider();

if (isConfigComplete) {
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
  } catch (e) {
    console.error("Firebase Initialization Failed", e);
  }
} else {
  console.warn("Firebase configuration is incomplete. Some features may not work.");
}

/**
 * 開発用モックユーザー (Configが不完全な場合に使用)
 */
const MOCK_USER: any = {
  uid: "dev-user-123",
  displayName: "Guest User",
  email: "guest@example.com",
  photoURL: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
};

export const loginWithGoogle = async () => {
  if (!auth) {
    console.log("Using Mock Login (Firebase not configured)");
    localStorage.setItem('mock_user', JSON.stringify(MOCK_USER));
    window.location.reload();
    return MOCK_USER;
  }
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Login Error:", error);
    return null;
  }
};

export const logout = async () => {
  if (!auth) {
    localStorage.removeItem('mock_user');
    window.location.reload();
    return;
  }
  return signOut(auth);
};

export const onAuthChange = (callback: (user: User | null) => void) => {
  if (!auth) {
    const saved = localStorage.getItem('mock_user');
    callback(saved ? JSON.parse(saved) : null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
};

export const fetchWordFromDB = async (term: string): Promise<Partial<Word> | null> => {
  if (!db) return null;
  try {
    const docRef = doc(db, "global_dictionary", term.toLowerCase());
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? (docSnap.data() as Word) : null;
  } catch (error) {
    return null;
  }
};

export const saveWordToDB = async (word: Word): Promise<void> => {
  if (!db) return;
  try {
    const docRef = doc(db, "global_dictionary", word.term.toLowerCase());
    await setDoc(docRef, word, { merge: true });
  } catch (error) {}
};

export const saveUserWordProgress = async (userId: string, word: Word): Promise<void> => {
  if (!db) return;
  try {
    const userWordRef = doc(db, "users", userId, "my_vocabulary", word.term.toLowerCase());
    await setDoc(userWordRef, {
      term: word.term,
      isMastered: word.isMastered || false,
      difficultyScore: word.difficultyScore || 0,
      nextReviewDate: word.nextReviewDate || Date.now(),
      updatedAt: Date.now()
    }, { merge: true });
  } catch (error) {}
};

export const fetchUserWords = async (userId: string): Promise<Partial<Word>[]> => {
  if (!db) return [];
  try {
    const q = collection(db, "users", userId, "my_vocabulary");
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as Partial<Word>);
  } catch (error) {
    return [];
  }
};