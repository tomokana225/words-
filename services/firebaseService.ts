
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

// 必須の環境変数が揃っているかチェック
const requiredKeys = ["apiKey", "authDomain", "projectId", "appId"];
const missingKeys = requiredKeys.filter(key => !firebaseConfig[key as keyof typeof firebaseConfig]);

export const isFirebaseEnabled = missingKeys.length === 0;

let db: any = null;
let auth: any = null;
let provider: any = null;

if (isFirebaseEnabled) {
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    provider = new GoogleAuthProvider();
    console.log("✅ Firebase initialized successfully.");
  } catch (e) {
    console.error("❌ Firebase Initialization Failed:", e);
  }
} else {
  console.warn("⚠️ Firebase configuration is incomplete. Running in MOCK MODE.");
  console.warn("Missing environment variables in Cloudflare:", missingKeys.map(k => `FIREBASE_${k.toUpperCase()}`).join(", "));
}

const MOCK_USER: any = {
  uid: "guest-id",
  displayName: "Guest Learner (Mock)",
  email: "guest@example.com",
  photoURL: "https://api.dicebear.com/7.x/pixel-art/svg?seed=learn"
};

export const loginWithGoogle = async () => {
  // Firebaseが有効な場合のみポップアップを表示
  if (isFirebaseEnabled && auth && provider) {
    try {
      console.log("Opening Google Auth Popup...");
      const result = await signInWithPopup(auth, provider);
      return result.user;
    } catch (error: any) {
      console.error("Google Auth Error:", error);
      // ポップアップブロックなどの一般的なエラーに対応
      if (error.code === 'auth/popup-blocked') {
        alert("ポップアップがブロックされました。ブラウザの設定で許可してください。");
      } else {
        alert("ログインに失敗しました: " + (error.message || "不明なエラー"));
      }
      return null;
    }
  } else {
    // Firebaseの設定がない場合はモックログイン
    console.log("Using Mock Login because Firebase is disabled.");
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
    console.log(`Word "${word.term}" saved to global DB.`);
  } catch (error) {
    console.error("Global DB Save Error:", error);
  }
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
    console.error("User Progress Cloud Save Error:", error);
  }
};

export const fetchUserWords = async (userId: string): Promise<Word[]> => {
  if (!db) return [];
  try {
    const colRef = collection(db, "users", userId, "progress");
    const snap = await getDocs(colRef);
    const result = snap.docs.map(d => d.data() as Word);
    return result;
  } catch (error) {
    console.error("User Words Cloud Fetch Error:", error);
    return [];
  }
};
