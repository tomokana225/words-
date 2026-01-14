
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
import { Word } from "../types";

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let provider: GoogleAuthProvider | null = null;
let adminEmail: string = "";

export const isFirebaseReady = () => !!app;

export const initializeFirebase = async () => {
  try {
    const response = await fetch('/api/config');
    if (!response.ok) throw new Error("Config endpoint failed");
    const config = await response.json();
    
    if (config.apiKey && config.projectId) {
      app = initializeApp(config);
      db = getFirestore(app);
      auth = getAuth(app);
      provider = new GoogleAuthProvider();
      adminEmail = config.adminEmail || "";
      console.log("✅ Firebase connected via Cloudflare Secrets.");
      return true;
    }
    console.warn("⚠️ Firebase configuration keys are empty. Falling back to Mock Mode.");
    return false;
  } catch (error) {
    console.error("❌ Firebase Initialization Error:", error);
    return false;
  }
};

const MOCK_USER: any = {
  uid: "guest-id",
  displayName: "Guest Learner (Mock)",
  email: "guest@example.com",
  photoURL: "https://api.dicebear.com/7.x/pixel-art/svg?seed=learn"
};

export const getAdminEmail = () => adminEmail;

export const loginWithGoogle = async () => {
  if (auth && provider) {
    try {
      const result = await signInWithPopup(auth, provider);
      return result.user;
    } catch (error: any) {
      console.error("Firebase Auth Error:", error);
      if (error.code === 'auth/unauthorized-domain') {
        const domain = window.location.hostname;
        alert(`ドメイン未承認: Firebaseコンソールで ${domain} を許可してください。`);
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
  if (auth) {
    await signOut(auth);
  }
  localStorage.removeItem('eiken_mock_user');
  window.location.reload();
};

export const onAuthChange = (callback: (user: User | null) => void) => {
  if (auth) {
    return onAuthStateChanged(auth, callback);
  } else {
    const saved = localStorage.getItem('eiken_mock_user');
    callback(saved ? JSON.parse(saved) : null);
    return () => {};
  }
};

// 全ユーザー共有の単語リストを取得
export const fetchGlobalWords = async (): Promise<Word[]> => {
  if (!db) return [];
  try {
    const colRef = collection(db, "global_vocabulary");
    // パフォーマンスのため一旦100件制限（必要に応じて調整）
    const q = query(colRef, limit(200));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as Word);
  } catch (error) {
    console.error("Global Words Fetch Error:", error);
    return [];
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
