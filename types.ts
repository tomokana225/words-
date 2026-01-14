
export enum EikenLevel {
  GRADE_3 = '3級',
  GRADE_PRE_2 = '準2級',
  GRADE_2 = '2級',
  GRADE_PRE_1 = '準1級',
  GRADE_1 = '1級'
}

export interface Word {
  id: string;
  term: string;
  meaning: string;
  level: EikenLevel;
  phonetic?: string;
  etymology?: string;
  synonyms?: string[];
  exampleSentence?: string;
  exampleSentenceJapanese?: string;
  imageUrl?: string;
  isMastered?: boolean;
  difficultyScore?: number;
  nextReviewDate?: number; // 次回復習日 (Timestamp)
  lastReviewedDate?: number;
  reviewInterval?: number; // 復習間隔（日）
  streak?: number; // 連続正解数
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
