
export enum EikenLevel {
  GRADE_3 = '3級',
  GRADE_PRE_2 = '準2級',
  GRADE_2 = '2級',
  GRADE_PRE_1 = '準1級',
  GRADE_1 = '1級'
}

export interface UserStats {
  xp: number;
  coins: number;
  level: number;
  totalStudyTime: number; // 秒単位
  unlockedItems: string[];
  activeAvatar: string;
  lastLoginDate?: number;
}

export interface Word {
  id: string;
  term: string;
  meaning: string;
  level: EikenLevel;
  phonetic?: string;
  etymology?: string;
  relatedWords?: { term: string; meaning: string }[]; // 同じ語源を持つ単語
  coreImageDescription?: string;
  synonyms?: string[];
  exampleSentence?: string;
  exampleSentenceJapanese?: string;
  imageUrl?: string;
  isMastered?: boolean;
  difficultyScore?: number;
  nextReviewDate?: number;
  lastReviewedDate?: number;
  reviewInterval?: number;
  streak?: number;
  rewardClaimed?: boolean;
}

export interface QuizQuestion {
  word: Word;
  options: string[];
  correctIndex: number;
}

export interface QuizResult {
  questions: QuizQuestion[];
  userAnswers: number[];
  score: number;
  timestamp: number;
}

export interface ShopItem {
  id: string;
  name: string;
  price: number;
  type: 'avatar' | 'accessory' | 'theme';
  preview: string;
}
