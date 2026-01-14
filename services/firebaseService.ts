
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

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

// 診断用：どの環境変数が注入されているか確認
console.log("🔍 Checking Environment Variables...");
const checkVars = {
  FIREBASE_API_KEY: !!process.env.FIREBASE_API_KEY,
  FIREBASE_PROJECT_ID: !!process.env.FIREBASE_PROJECT_ID,
  GEMINI_API_KEY: !!process.env.API_KEY
};
console.table(checkVars);

const requiredEnvMapping: Record<string, string> = {
  apiKey: "FIREBASE_API_KEY",
  authDomain: "FIREBASE_AUTH_DOMAIN",
  projectId: "FIREBASE_PROJECT_ID",
  appId: "FIREBASE_APP_ID",
};

const missingEnvVars = Object.entries(requiredEnvMapping)
  .filter(([configKey]) => !firebaseConfig[configKey as keyof typeof firebaseConfig])
  .map(([_, envName]) => envName);

export const isFirebaseEnabled = missingEnvVars.length === 0;

let db: any = null;
let auth: any = null;
let provider: any = null;

if (isFirebaseEnabled) {
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    provider = new GoogleAuthProvider();
    console.log("✅ Firebase successfuly initialized with Cloudflare variables.");
  } catch (e) {
    console.error("❌ Firebase Initialization Failed:", e);
  }
} else {
  console.warn("⚠️ Firebase config incomplete. MOCK MODE active.");
  console.warn("Missing variables:", missingEnvVars.join(", "));
  console.info("Hint: Make sure these are set in Cloudflare 'Environment variables' (not only Secrets).");
}

const MOCK_USER: any = {
  uid: "guest-id",
  displayName: "Guest Learner (Mock)",
  email: "guest@example.com",
  photoURL: "https://api.dicebear.com/7.x/pixel-art/svg?seed=learn"
};

export const loginWithGoogle = async () => {
  if (isFirebaseEnabled && auth && provider) {
    try {
      const result = await signInWithPopup(auth, provider);
      return result.user;
    } catch (error: any) {
      console.error("Google Auth Error:", error);
      if (error.code === 'auth/popup-blocked') {
        alert("ポップアップがブロックされました。");
      } else {
        alert("ログインエラー: " + (error.message || "不明なエラー"));
      }
      return null;
    }
  } else {
    localStorage.setItem('eiken_mock_user', JSON.stringify(MOCK_USER));
    window.location.reload();
    return MOCK_USER;
  }
};

export const logout = async () => {
  if (isFirebaseEnabled && auth) {
    return signOut(auth).then(() => {
      localStorage.removeItem('eiken_mock_user');
      window.location.reload();
    });
  } else {
    localStorage.removeItem('eiken_mock_user');
    window.location.reload();
  }
};

export const onAuthChange = (callback: (user: User | null) => void) => {
  if (isFirebaseEnabled && auth) {
    return onAuthStateChanged(auth, callback);
  } else {
    const saved = localStorage.getItem('eiken_mock_user');
    callback(saved ? JSON.parse(saved) : null);
    return () => {};
  }
};

export const fetchWordFromDB = async (term: string): Promise<Partial<Word> | null> => {
  if (!db) return null;
  try {
    const docRef = doc(db, "global_vocabulary", term.toLowerCase());
    const snap = await getDoc(docRef);
    return snap.exists() ? (snap.data() as Word) : null;
  } catch { return null; }
};

export const saveWordToDB = async (word: Word) => {
  if (!db) return;
  try {
    await setDoc(doc(db, "global_vocabulary", word.term.toLowerCase()), word, { merge: true });
  } catch (error) {
    console.error("Global DB Save Error:", error);
  }
};

export const saveUserWordProgress = async (userId: string, word: Word) => {
  if (!db) return;
  try {
    const ref = doc(db, "users", userId, "progress", word.term.toLowerCase());
    await setDoc(ref, { ...word, lastUpdated: Date.now() }, { merge: true });
  } catch (error) {
    console.error("User Progress Save Error:", error);
  }
};

export const fetchUserWords = async (userId: string): Promise<Word[]> => {
  if (!db) return [];
  try {
    const colRef = collection(db, "users", userId, "progress");
    const snap = await getDocs(colRef);
    return snap.docs.map(d => d.data() as Word);
  } catch (error) {
    console.error("User Words Fetch Error:", error);
    return [];
  }
};
