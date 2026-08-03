export type TaxonomyLevel = 'Nhận biết' | 'Thông hiểu' | 'Vận dụng' | 'Vận dụng cao';
export type DifficultyLevel = 'Dễ' | 'Trung bình' | 'Khó' | 'Rất khó';
export type AbilityTier = 'cần_bổ_trợ' | 'trung_bình' | 'khá' | 'giỏi' | 'tất_cả';
export type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer';
export type SchoolLevel = 'THCS' | 'THPT';

export interface TrueFalseStatement {
  id: string;
  statement: string;
  isCorrect: boolean; // true = Đúng, false = Sai
}

export interface Question {
  id: string;
  question: string;
  questionType?: QuestionType; // 'multiple_choice' | 'true_false' | 'short_answer'
  
  // For multiple_choice
  options?: [string, string, string, string] | string[];
  correctOption?: number; // 0..3

  // For true_false (Đúng/Sai - 4 phát biểu a, b, c, d)
  tfStatements?: TrueFalseStatement[];

  // For short_answer (Trả lời ngắn - Toán học / Tự nhiên / Xã hội)
  shortAnswer?: string; // e.g. "3.14", "12", "-0.5"
  acceptableAnswers?: string[]; // e.g. ["3.14", "3,14", "3.1416"]
  mathRoundingNote?: string; // e.g. "Làm tròn đến 2 chữ số thập phân. Lấy π = 3,14"
  roundingDecimals?: number; // e.g. 2

  explanation: string;
  taxonomyLevel: TaxonomyLevel;
  difficulty: DifficultyLevel;
  topic?: string;
}

export interface QuizMatrix {
  nhanBiet: number; // %
  thongHieu: number;
  vanDung: number;
  vanDungCao: number;
}

export type ExamType = 'standard' | 'test_15m' | 'test_45m' | 'midterm' | 'final' | 'thpt_national';

export interface ExamModeConfig {
  enabled: boolean;
  examType: ExamType;
  examTitle?: string;
  durationMinutes?: number;
  examCode?: string;
  schoolName?: string;
  departmentName?: string;
}

export interface LessonUnit {
  id: string;
  title: string;
  subject: string;
  grade: string;
  schoolLevel?: SchoolLevel;
  rawText: string;
  summaryPoints: string[];
  mindmapMermaid: string;
  questions: Question[];
  matrix: QuizMatrix;
  examModeConfig?: ExamModeConfig;
  createdAt: string;
}

export interface HistoryItem {
  id: string;
  title: string;
  schoolLevel: SchoolLevel;
  subject: string;
  grade: string;
  questionCount: number;
  createdAt: string;
  lesson: LessonUnit;
}

export type UserType = 'Giáo viên' | 'Học sinh';
export type EducationLevel = 'Cấp 1 (Tiểu học)' | 'Cấp 2 (THCS)' | 'Cấp 3 (THPT)' | 'Đại học / Chuyên nghiệp';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  provider: 'app' | 'google' | 'facebook';
  userType: UserType; // 'Giáo viên' | 'Học sinh'
  educationLevel: EducationLevel; // 'Cấp 1 (Tiểu học)' | 'Cấp 2 (THCS)' | 'Cấp 3 (THPT)' | 'Đại học / Chuyên nghiệp'
  role: string; // e.g. 'Giáo viên Cấp 2 (THCS)'
  schoolName?: string;
  avatarUrl?: string;
}

export interface GameScore {
  studentName: string;
  gameMode: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  streak: number;
  date: string;
}

export type ActiveTab = 'input' | 'question_bank' | 'gamification' | 'mindmap' | 'analytics' | 'history';
export type ActiveGameMode = 'wheel' | 'target' | 'flashcard' | 'quiz_challenge';

