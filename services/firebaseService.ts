
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

// --- 開発デモ用モックデータ ---
const MOCK_VOCABULARY: Word[] = [
  {
    id: "m1",
    term: "adventure",
    meaning: "冒険",
    level: EikenLevel.GRADE_3,
    phonetic: "/ədˈventʃər/",
    etymology: "接頭辞 ad- (〜へ) + vent (来る) + -ure (名詞語尾)。「何かがやってくること」から「予期せぬ出来事、冒険」へ。",
    exampleSentence: "Life is a great adventure.",
    exampleSentenceJapanese: "人生は素晴らしい冒険だ。",
    isMastered: false,
    difficultyScore: 0,
    streak: 0
  },
  {
    id: "m2",
    term: "environment",
    meaning: "環境",
    level: EikenLevel.GRADE_PRE_2,
    phonetic: "/ɪnˈvaɪrənmənt/",
    etymology: "en- (囲む) + viron (輪) + -ment (名詞語尾)。「周囲を囲むもの」を意味する。",
    exampleSentence: "We must protect the natural environment.",
    exampleSentenceJapanese: "私たちは自然環境を守らなければならない。",
    isMastered: false,
    difficultyScore: 0,
    streak: 0
  },
  {
    id: "m3",
    term: "sustainable",
    meaning: "持続可能な",
    level: EikenLevel.GRADE_2,
    phonetic: "/səˈsteɪnəbl/",
    etymology: "sus- (下から) + tain (保つ) + -able (〜できる)。「下から支え続けることができる」状態を表す。",
    exampleSentence: "Sustainable development is crucial for our future.",
    exampleSentenceJapanese: "持続可能な開発は私たちの未来にとって極めて重要だ。",
    isMastered: false,
    difficultyScore: 0,
    streak: 0
  },
  {
    id: "m4",
    term: "scrutinize",
    meaning: "綿密に調べる",
    level: EikenLevel.GRADE_PRE_1,
    phonetic: "/ˈskruːtənaɪz/",
    etymology: "ラテン語 scruta (ガラクタ) に由来。ガラクタの中から価値のあるものを探し出すように、細部まで精査することを指す。",
    exampleSentence: "The committee will scrutinize the details of the plan.",
    exampleSentenceJapanese: "委員会はその計画の細部を綿密に調査するだろう。",
    isMastered: false,
    difficultyScore: 0,
    streak: 0
  },
  {
    id: "m5",
    term: "ubiquitous",
    meaning: "至る所にある、偏在する",
    level: EikenLevel.GRADE_1,
    phonetic: "/juːˈbɪkwɪtəs/",
    etymology: "ubi- (どこにでも) + -ous (形容詞語尾)。神がどこにでも存在することを表す宗教的用語から、現在ではスマホなどが普及している様子にも使われる。",
    exampleSentence: "Smartphones have become ubiquitous in our daily lives.",
    exampleSentenceJapanese: "スマートフォンは私たちの日常生活において至る所で見られるようになった。",
    isMastered: false,
    difficultyScore: 0,
    streak: 0
  }
];

// SecurityError防止のためのlocalStorageラッパー
const safeStorage = {
  getItem: (key: string) => {
    try { return localStorage.getItem(key); } catch { return null; }
  },
  setItem: (key: string, value: string) => {
    try { localStorage.setItem(key, value); } catch { /* ignore */ }
  },
  removeItem: (key: string) => {
    try { localStorage.removeItem(key); } catch { /* ignore */ }
  }
};

export const isFirebaseReady = () => !!app;

export const initializeFirebase = async () => {
  try {
    const response = await fetch('/api/config').catch(() => null);
    if (!response || !response.ok) {
      console.warn("⚠️ Firebase configuration endpoint unavailable. Falling back to Mock Mode.");
      return false;
    }
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
    console.warn("⚠️ Firebase keys are empty in config. Using Mock Mode.");
    return false;
  } catch (error) {
    console.error("❌ Firebase Initialization Error (Catastrophic):", error);
    return false;
  }
};

const MOCK_USER: any = {
  uid: "guest-id",
  displayName: "Guest Learner (Mock)",
  email: "guest@example.com",
  photoURL: "https://api.dicebear.com/7.x/pixel-art/svg?seed=learn"
};

export const getAdminEmail = () => adminEmail || (app ? "" : "guest@example.com");

export const loginWithGoogle = async () => {
  if (auth && provider) {
    try {
      const result = await signInWithPopup(auth, provider);
      return result.user;
    } catch (error: any) {
      console.error("Firebase Auth Error:", error);
      return null;
    }
  } else {
    safeStorage.setItem('eiken_mock_user', JSON.stringify(MOCK_USER));
    window.location.reload();
    return MOCK_USER;
  }
};

export const logout = async () => {
  if (auth) {
    await signOut(auth);
  }
  safeStorage.removeItem('eiken_mock_user');
  window.location.reload();
};

export const onAuthChange = (callback: (user: User | null) => void) => {
  if (auth) {
    return onAuthStateChanged(auth, callback);
  } else {
    const saved = safeStorage.getItem('eiken_mock_user');
    callback(saved ? JSON.parse(saved) : null);
    return () => {};
  }
};

// 全ユーザー共有の単語リストを取得
export const fetchGlobalWords = async (): Promise<Word[]> => {
  if (!db) return MOCK_VOCABULARY;
  try {
    const colRef = collection(db, "global_vocabulary");
    const q = query(colRef, limit(1000));
    const snap = await getDocs(q);
    const words = snap.docs.map(d => d.data() as Word);
    return words.length > 0 ? words : MOCK_VOCABULARY;
  } catch (error) {
    console.error("Global Words Fetch Error:", error);
    return MOCK_VOCABULARY;
  }
};

export const fetchWordFromDB = async (term: string): Promise<Partial<Word> | null> => {
  if (!db) return MOCK_VOCABULARY.find(w => w.term.toLowerCase() === term.toLowerCase()) || null;
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
    const { term, meaning, level, streak, difficultyScore, isMastered, nextReviewDate, rewardClaimed } = word;
    await setDoc(ref, { term, meaning, level, streak, difficultyScore, isMastered, nextReviewDate, rewardClaimed, lastUpdated: Date.now() }, { merge: true });
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
