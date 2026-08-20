export type SubjectType = 'Hóa học' | 'Vật lý' | 'Toán học' | 'Sinh học' | 'Lịch sử' | 'Địa lý' | 'Tiếng Anh' | 'Ngữ văn' | 'Tổng hợp';
export type GradeLevel = 'Lớp 10' | 'Lớp 11' | 'Lớp 12' | 'Ôn Thi Tốt Nghiệp THPT' | 'Đại học / Khác';

export type CognitiveLevel = 'Nhận biết' | 'Thông hiểu' | 'Vận dụng' | 'Vận dụng cao';
export type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer';

export interface TrueFalseSubItem {
  statement: string;
  isCorrect: boolean;
  explanation?: string;
}

export interface QuestionItem {
  id: string;
  type: QuestionType;
  level: CognitiveLevel;
  question: string;
  options?: string[]; // for multiple_choice
  correctOptionIndex?: number; // 0-3
  subItems?: TrueFalseSubItem[]; // for true_false
  shortAnswer?: string; // for short_answer
  explanation: string;
}

export interface QuizBankData {
  title: string;
  subject: SubjectType;
  grade: GradeLevel;
  matrixSummary: {
    nhanBiet: number;
    thongHieu: number;
    vanDung: number;
    vanDungCao: number;
  };
  questions: QuestionItem[];
}

export interface MindmapSubBranch {
  id: string;
  title: string;
  details: string[];
}

export interface MindmapBranch {
  id: string;
  title: string;
  color?: string;
  icon?: string;
  summary?: string;
  subBranches: MindmapSubBranch[];
}

export interface MindmapData {
  topic: string;
  description?: string;
  color?: string;
  icon?: string;
  branches: MindmapBranch[];
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  mnemonicHint?: string;
  category?: string;
  tags?: string[];
}

export interface FlashcardDeck {
  deckTitle: string;
  subject: string;
  cards: Flashcard[];
}

export interface WheelQuestion {
  segmentLabel: string;
  question: string;
  answer: string;
  points: number;
}

export interface MillionaireQuestion {
  level: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface MemoryPair {
  term: string;
  definition: string;
}

export interface WordwallData {
  gameTitle: string;
  wheelQuestions: WheelQuestion[];
  millionaireQuestions: MillionaireQuestion[];
  memoryMatchingPairs: MemoryPair[];
}

export type ActiveTab = 'input' | 'quiz' | 'mindmap' | 'flashcards' | 'wordwall';
