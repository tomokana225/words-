
export enum EikenLevel {
  GRADE_3 = '3級',
  GRADE_PRE_2 = '準2級',
  GRADE_2 = '2級',
  GRADE_PRE_1 = '準1級',
  GRADE_1 = '1級'
}

export enum MasteryStatus {
  UNLEARNED = '未学習',
  WEAK = '苦手',
  UNSTABLE = 'うろ覚え',
  MASTERED = '暗記完了'
}

export type QuizType = 'wordToMeaning' | 'meaningToWord' | 'sentenceFillIn';

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
  relatedWords?: { term: string; meaning: string }[];
  synonyms?: string[];
  exampleSentence?: string;
  exampleSentenceJapanese?: string;
  
  // 学習管理用
  isMastered?: boolean;
  masteryCount?: number; // 正解回数 (0-4)
  difficultyScore?: number;
  nextReviewDate?: number;
  lastReviewedDate?: number;
  streak?: number;
  lastWasCorrect?: boolean; // 直近の回答が正解だったか
  rewardClaimed?: boolean;
}

export interface QuizQuestion {
  word: Word;
  type: QuizType;
  questionText: string;
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
