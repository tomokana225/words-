
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

// 個別の環境変数を元に設定オブジェクトを構築
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

// apiKeyが存在しない、またはプレースホルダの場合はDevモードと判定
const isDevMode = !firebaseConfig.apiKey || firebaseConfig.apiKey.includes('YOUR_');

let db: any = null;
let auth: any = null;
const provider = new GoogleAuthProvider();

if (!isDevMode) {
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
  } catch (e) {
    console.error("Firebase Initialization Failed", e);
  }
}

/**
 * 開発用モックユーザー
 */
const MOCK_USER: any = {
  uid: "dev-user-123",
  displayName: "開発者 (テスト中)",
  email: "dev@example.com",
  photoURL: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
};

/**
 * Googleログインを実行
 */
export const loginWithGoogle = async () => {
  if (isDevMode) {
    console.log("Dev Mode: Simulating Google Login");
    localStorage.setItem('mock_auth_user', JSON.stringify(MOCK_USER));
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

/**
 * ログアウトを実行
 */
export const logout = async () => {
  if (isDevMode) {
    localStorage.removeItem('mock_auth_user');
    window.location.reload();
    return;
  }
  return signOut(auth);
};

/**
 * 認証状態を監視
 */
export const onAuthChange = (callback: (user: User | null) => void) => {
  if (isDevMode) {
    const savedUser = localStorage.getItem('mock_auth_user');
    callback(savedUser ? JSON.parse(savedUser) : null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
};

/**
 * グローバルな単語辞書キャッシュから単語を取得
 */
export const fetchWordFromDB = async (term: string): Promise<Partial<Word> | null> => {
  const termKey = term.toLowerCase();
  
  if (isDevMode) {
    const localDict = JSON.parse(localStorage.getItem('mock_global_dict') || '{}');
    return localDict[termKey] || null;
  }

  try {
    const docRef = doc(db, "global_dictionary", termKey);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? (docSnap.data() as Word) : null;
  } catch (error) {
    console.warn("DB Fetch Error:", error);
    return null;
  }
};

/**
 * AIで生成した詳細データをDBに保存（キャッシュ化）
 */
export const saveWordToDB = async (word: Word): Promise<void> => {
  const termKey = word.term.toLowerCase();

  if (isDevMode) {
    const localDict = JSON.parse(localStorage.getItem('mock_global_dict') || '{}');
    localDict[termKey] = word;
    localStorage.setItem('mock_global_dict', JSON.stringify(localDict));
    return;
  }

  try {
    const docRef = doc(db, "global_dictionary", termKey);
    await setDoc(docRef, word, { merge: true });
  } catch (error) {
    console.warn("DB Save Error:", error);
  }
};

/**
 * ユーザーごとの学習データを保存
 */
export const saveUserWordProgress = async (userId: string, word: Word): Promise<void> => {
  const termKey = word.term.toLowerCase();

  if (isDevMode) {
    const userWords = JSON.parse(localStorage.getItem(`mock_user_words_${userId}`) || '{}');
    userWords[termKey] = {
      term: word.term,
      isMastered: word.isMastered || false,
      difficultyScore: word.difficultyScore || 0,
      nextReviewDate: word.nextReviewDate || Date.now(),
      updatedAt: Date.now()
    };
    localStorage.setItem(`mock_user_words_${userId}`, JSON.stringify(userWords));
    return;
  }

  try {
    const userWordRef = doc(db, "users", userId, "my_vocabulary", termKey);
    await setDoc(userWordRef, {
      term: word.term,
      isMastered: word.isMastered || false,
      difficultyScore: word.difficultyScore || 0,
      nextReviewDate: word.nextReviewDate || Date.now(),
      updatedAt: Date.now()
    }, { merge: true });
  } catch (error) {
    console.error("User Progress Save Error:", error);
  }
};

/**
 * ユーザーの全単語データを取得
 */
export const fetchUserWords = async (userId: string): Promise<Partial<Word>[]> => {
  if (isDevMode) {
    const userWords = JSON.parse(localStorage.getItem(`mock_user_words_${userId}`) || '{}');
    return Object.values(userWords);
  }

  try {
    const q = collection(db, "users", userId, "my_vocabulary");
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as Partial<Word>);
  } catch (error) {
    console.error("User Words Fetch Error:", error);
    return [];
  }
};
