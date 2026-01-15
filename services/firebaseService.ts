
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
import { Word, EikenLevel, UserStats } from "../types";

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let provider: GoogleAuthProvider | null = null;
let adminEmail: string = "";

// --- SecurityError & Permission フォールバック ---
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
    const response = await fetch('/api/config').catch(() => null);
    if (!response || !response.ok) return false;
    
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
    console.error("Firebase Init Suppressed:", error);
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
  safeStorage.removeItem('eiken_local_stats');
  window.location.reload();
};

export const onAuthChange = (callback: (user: User | null) => void) => {
  if (auth) return onAuthStateChanged(auth, callback);
  const saved = safeStorage.getItem('eiken_mock_user');
  callback(saved ? JSON.parse(saved) : null);
  return () => {};
};

// --- User Stats persistence ---

export const fetchUserStats = async (userId: string): Promise<UserStats | null> => {
  // ゲストの場合やDB未初期化の場合は即フォールバック
  if (!db || !userId || userId === "guest-id") {
    const local = safeStorage.getItem('eiken_local_stats');
    return local ? JSON.parse(local) : null;
  }
  try {
    const snap = await getDoc(doc(db, "users", userId));
    if (snap.exists()) {
      const data = snap.data() as UserStats;
      // クラウド版をローカルにもバックアップ
      safeStorage.setItem('eiken_local_stats', JSON.stringify(data));
      return data;
    }
    return null;
  } catch (e) {
    console.warn("Cloud stats fetch failed (permission or network). Using local backup.");
    const local = safeStorage.getItem('eiken_local_stats');
    return local ? JSON.parse(local) : null;
  }
};

export const saveUserStats = async (userId: string, stats: UserStats) => {
  // 常にローカルには即時保存
  safeStorage.setItem('eiken_local_stats', JSON.stringify(stats));
  
  if (!db || !userId || userId === "guest-id") return;
  
  try {
    await setDoc(doc(db, "users", userId), stats, { merge: true });
  } catch (e) {
    // 権限エラーなどはログに留め、アプリの動作（ローカル保存）は継続させる
    console.warn("Cloud stats save failed. Progress kept locally.", e);
  }
};

// --- Word Data persistence ---

export const fetchGlobalWords = async (): Promise<Word[]> => {
  if (!db) return MOCK_VOCABULARY;
  try {
    const colRef = collection(db, "global_vocabulary");
    const snap = await getDocs(query(colRef, limit(1000)));
    const words = snap.docs.map(d => d.data() as Word);
    return words.length > 0 ? words : MOCK_VOCABULARY;
  } catch { return MOCK_VOCABULARY; }
};

export const fetchUserWords = async (userId: string): Promise<Word[]> => {
  if (!db || !userId || userId === "guest-id") return [];
  try {
    const snap = await getDocs(collection(db, "users", userId, "progress"));
    return snap.docs.map(d => d.data() as Word);
  } catch { return []; }
};

export const saveUserWordProgress = async (userId: string, word: Word) => {
  if (!db || !userId || userId === "guest-id") return;
  try {
    const ref = doc(db, "users", userId, "progress", word.term.toLowerCase());
    const { id, ...data } = word;
    await setDoc(ref, { ...data, lastUpdated: Date.now() }, { merge: true });
  } catch (e) { console.warn("Cloud word progress save failed.", e); }
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
