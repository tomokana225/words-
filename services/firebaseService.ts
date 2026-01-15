
import { initializeApp, FirebaseApp } from "firebase/app";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  getDocs,
  query,
  limit,
  Firestore
} from "firebase/firestore";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  onAuthStateChanged,
  User,
  Auth
} from "firebase/auth";
import { Word, EikenLevel } from "../types";

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let provider: GoogleAuthProvider | null = null;
let adminEmail: string = "";

// --- SecurityError対策: localStorageの完全な代替 ---
const memoryStorage: Record<string, string> = {};
const safeStorage = {
  getItem: (key: string) => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return memoryStorage[key] || null;
    }
  },
  setItem: (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      memoryStorage[key] = value;
    }
  },
  removeItem: (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      delete memoryStorage[key];
    }
  }
};

export const isFirebaseReady = () => !!app;

export const initializeFirebase = async () => {
  try {
    // キャッシュやブラウザ設定により fetch が SecurityError を投げる場合も考慮
    const response = await fetch('/api/config').catch(() => null);
    
    if (!response || !response.ok) {
      console.warn("⚠️ Firebase config endpoint failed. Running in Local Mock Mode.");
      return false;
    }
    
    const config = await response.json();
    if (config.apiKey && config.projectId) {
      app = initializeApp(config);
      db = getFirestore(app);
      auth = getAuth(app);
      provider = new GoogleAuthProvider();
      adminEmail = config.adminEmail || "";
      return true;
    }
    return false;
  } catch (error) {
    console.error("❌ Firebase Initialization Suppressed:", error);
    return false;
  }
};

const MOCK_VOCABULARY: Word[] = [
  { id: "m1", term: "adventure", meaning: "冒険", level: EikenLevel.GRADE_3, phonetic: "/ədˈventʃər/", etymology: "ad- (〜へ) + vent (来る) + -ure。何かがやってくること。", exampleSentence: "Life is a great adventure.", exampleSentenceJapanese: "人生は素晴らしい冒険だ。" },
  { id: "m2", term: "environment", meaning: "環境", level: EikenLevel.GRADE_PRE_2, phonetic: "/ɪnˈvaɪrənmənt/", etymology: "en- (囲む) + viron (輪)。周囲を囲むもの。", exampleSentence: "We must protect the environment.", exampleSentenceJapanese: "環境を守らなければならない。" }
];

const MOCK_USER: any = {
  uid: "guest-id",
  displayName: "ゲストユーザー",
  email: "guest@example.com",
  photoURL: "https://api.dicebear.com/7.x/pixel-art/svg?seed=learn"
};

export const getAdminEmail = () => adminEmail || (app ? "" : "guest@example.com");

export const loginWithGoogle = async () => {
  if (auth && provider) {
    try {
      const result = await signInWithPopup(auth, provider);
      return result.user;
    } catch (error) {
      console.error("Login Error:", error);
      return null;
    }
  } else {
    safeStorage.setItem('eiken_mock_user', JSON.stringify(MOCK_USER));
    window.location.reload();
    return MOCK_USER;
  }
};

export const logout = async () => {
  if (auth) await signOut(auth);
  safeStorage.removeItem('eiken_mock_user');
  window.location.reload();
};

export const onAuthChange = (callback: (user: User | null) => void) => {
  if (auth) return onAuthStateChanged(auth, callback);
  const saved = safeStorage.getItem('eiken_mock_user');
  callback(saved ? JSON.parse(saved) : null);
  return () => {};
};

export const fetchGlobalWords = async (): Promise<Word[]> => {
  if (!db) return MOCK_VOCABULARY;
  try {
    const colRef = collection(db, "global_vocabulary");
    const snap = await getDocs(query(colRef, limit(500)));
    const words = snap.docs.map(d => d.data() as Word);
    return words.length > 0 ? words : MOCK_VOCABULARY;
  } catch { return MOCK_VOCABULARY; }
};

export const fetchUserWords = async (userId: string): Promise<Word[]> => {
  if (!db) return [];
  try {
    const snap = await getDocs(collection(db, "users", userId, "progress"));
    return snap.docs.map(d => d.data() as Word);
  } catch { return []; }
};

export const saveUserWordProgress = async (userId: string, word: Word) => {
  if (!db) return;
  try {
    const ref = doc(db, "users", userId, "progress", word.term.toLowerCase());
    await setDoc(ref, { ...word, lastUpdated: Date.now() }, { merge: true });
  } catch (e) { console.error(e); }
};

export const fetchWordFromDB = async (term: string) => {
  if (!db) return null;
  try {
    const snap = await getDoc(doc(db, "global_vocabulary", term.toLowerCase()));
    return snap.exists() ? (snap.data() as Word) : null;
  } catch { return null; }
};

export const saveWordToDB = async (word: Word) => {
  if (!db) return;
  try {
    await setDoc(doc(db, "global_vocabulary", word.term.toLowerCase()), word, { merge: true });
  } catch (e) { console.error(e); }
};
