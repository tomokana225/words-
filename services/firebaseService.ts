
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

// 詳細な初期化チェック
const missingKeys = Object.entries(firebaseConfig)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

export const isFirebaseEnabled = missingKeys.length === 0;

if (!isFirebaseEnabled) {
  console.warn("⚠️ Firebase configuration is incomplete. App is running in MOCK MODE.");
  console.warn("Missing keys:", missingKeys);
}

let db: any = null;
let auth: any = null;
let provider: any = null;

if (isFirebaseEnabled) {
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    provider = new GoogleAuthProvider();
  } catch (e) {
    console.error("Firebase Initialization Failed:", e);
  }
}

const MOCK_USER: any = {
  uid: "guest-id",
  displayName: "Guest Learner (Mock)",
  email: "guest@example.com",
  photoURL: "https://api.dicebear.com/7.x/pixel-art/svg?seed=learn"
};

export const loginWithGoogle = async () => {
  if (!isFirebaseEnabled || !auth) {
    console.log("Mock Login triggered");
    localStorage.setItem('eiken_mock_user', JSON.stringify(MOCK_USER));
    window.location.reload(); // モック時はリロードで状態反映
    return MOCK_USER;
  }
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Google Auth Error:", error);
    alert("ログインに失敗しました。ポップアップがブロックされていないか確認してください。");
    return null;
  }
};

export const logout = async () => {
  if (!isFirebaseEnabled || !auth) {
    localStorage.removeItem('eiken_mock_user');
    window.location.reload();
    return;
  }
  return signOut(auth);
};

export const onAuthChange = (callback: (user: User | null) => void) => {
  if (!isFirebaseEnabled || !auth) {
    const saved = localStorage.getItem('eiken_mock_user');
    callback(saved ? JSON.parse(saved) : null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
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
  } catch {}
};

export const saveUserWordProgress = async (userId: string, word: Word) => {
  if (!db) return;
  try {
    const ref = doc(db, "users", userId, "progress", word.term.toLowerCase());
    const dataToSave = {
      ...word,
      lastUpdated: Date.now()
    };
    await setDoc(ref, dataToSave, { merge: true });
  } catch (error) {
    console.error("Cloud Save Error:", error);
  }
};

export const fetchUserWords = async (userId: string): Promise<Word[]> => {
  if (!db) return [];
  try {
    const colRef = collection(db, "users", userId, "progress");
    const snap = await getDocs(colRef);
    const result = snap.docs.map(d => d.data() as Word);
    console.log(`Fetched ${result.length} words from cloud for user ${userId}`);
    return result;
  } catch (error) {
    console.error("Cloud Fetch Error:", error);
    return [];
  }
};
