
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

// Check if config exists, otherwise use mock (development fallback)
const isConfigAvailable = !!(firebaseConfig.apiKey && firebaseConfig.projectId);

let db: any = null;
let auth: any = null;
const provider = new GoogleAuthProvider();

if (isConfigAvailable) {
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
  } catch (e) {
    console.error("Firebase Initialization Error", e);
  }
}

const MOCK_USER: any = {
  uid: "guest-id",
  displayName: "Guest Learner",
  photoURL: "https://api.dicebear.com/7.x/pixel-art/svg?seed=learn"
};

export const loginWithGoogle = async () => {
  if (!auth) {
    localStorage.setItem('eiken_mock_user', JSON.stringify(MOCK_USER));
    window.location.reload();
    return MOCK_USER;
  }
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Auth Error", error);
    return null;
  }
};

export const logout = async () => {
  if (!auth) {
    localStorage.removeItem('eiken_mock_user');
    window.location.reload();
    return;
  }
  return signOut(auth);
};

export const onAuthChange = (callback: (user: User | null) => void) => {
  if (!auth) {
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
    await setDoc(ref, {
      term: word.term,
      isMastered: word.isMastered || false,
      streak: word.streak || 0,
      nextReviewDate: word.nextReviewDate || Date.now(),
      difficultyScore: word.difficultyScore || 0,
      lastUpdated: Date.now()
    }, { merge: true });
  } catch {}
};

export const fetchUserWords = async (userId: string): Promise<Partial<Word>[]> => {
  if (!db) return [];
  try {
    const colRef = collection(db, "users", userId, "progress");
    const snap = await getDocs(colRef);
    return snap.docs.map(d => d.data() as Partial<Word>);
  } catch { return []; }
};
