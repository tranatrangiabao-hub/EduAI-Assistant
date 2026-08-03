export type Language = 'vi' | 'en';

export interface Translations {
  appName: string;
  appSubTitle: string;
  gdtnTag: string;
  navInput: string;
  navQuestions: string;
  navGamification: string;
  navMindmap: string;
  navAnalytics: string;
  navHistory: string;
  login: string;
  logout: string;
  settings: string;
  language: string;
  vietnamese: string;
  english: string;
  settingsTitle: string;
  accountInfo: string;
  selectLanguage: string;
  logoutButton: string;
  export: string;
  proposal: string;
  calculationExplanationTitle: string;
  stepByStepSolution: string;
  wrongAnswerNotification: string;
  correctAnswerNotification: string;
  checkAnswer: string;
  mathRoundingNote: string;
  acceptableAnswers: string;
  standardAnswer: string;
  yourAnswer: string;
  detailedExplanation: string;
  wheelTitle: string;
  spinButton: string;
  targetTitle: string;
  flashcardTitle: string;
  quizTitle: string;
  footerCopyright: string;
  footerStandard: string;
}

export const translations: Record<Language, Translations> = {
  vi: {
    appName: "EduAI Assistant",
    appSubTitle: "Hệ thống Tự động hóa Học liệu & Trò chơi hóa Ôn thi",
    gdtnTag: "GD&ĐT 2026",
    
    // Header & Navigation
    navInput: "1. Nhập Bài Giảng",
    navQuestions: "2. Ngân Hàng Câu Hỏi",
    navGamification: "3. Đấu Trí Trò Chơi",
    navMindmap: "4. Sơ Đồ Tư Duy & Tóm Tắt",
    navAnalytics: "5. Ma Trận GD&ĐT",
    navHistory: "6. Lịch Sử Học Liệu",
    
    // Auth & Settings
    login: "Đăng Nhập",
    logout: "Đăng Xuất",
    settings: "Cài Đặt",
    language: "Ngôn Ngữ",
    vietnamese: "Tiếng Việt 🇻🇳",
    english: "English 🇬🇧",
    settingsTitle: "Cài Đặt Ứng Dụng",
    accountInfo: "Thông Tin Tài Khoản",
    selectLanguage: "Tùy Chọn Ngôn Ngữ / Language",
    logoutButton: "Đăng Xuất Tài Khoản",
    export: "Xuất",
    proposal: "Hồ Sơ Đề Tài",
    
    // Question Bank & Calculation Explanation
    calculationExplanationTitle: "📐 Hướng Dẫn Giải & Cách Làm Bài Tập Tính Toán:",
    stepByStepSolution: "Các bước giải chi tiết từng bước:",
    wrongAnswerNotification: "❌ Kết quả của bạn chưa đúng. Xem hướng dẫn giải chi tiết dưới đây:",
    correctAnswerNotification: "✅ Chính xác! Bạn đã làm đúng bài tập.",
    checkAnswer: "Kiểm Tra",
    mathRoundingNote: "Ghi chú quy ước tính toán:",
    acceptableAnswers: "Biến thể chấp nhận:",
    standardAnswer: "Đáp án chuẩn:",
    yourAnswer: "Câu trả lời của bạn:",
    detailedExplanation: "Lời giải chi tiết:",
    
    // Gamification
    wheelTitle: "Vòng Quay May Mắn",
    spinButton: "QUAY VÒNG MAY MẮN!",
    targetTitle: "Bắn Mục Tiêu (Target Pop)",
    flashcardTitle: "Anki Flashcard (Thẻ Ghi Nhớ)",
    quizTitle: "Đấu Trí Thi Thử (Đếm Ngược)",
    
    // Footer
    footerCopyright: "EduAI Assistant - Powered by Google AI Studio & Gemini API",
    footerStandard: "Chuẩn GD&ĐT THCS & THPT",
  },
  en: {
    appName: "EduAI Assistant",
    appSubTitle: "Automated Pedagogical Core & Gamification System",
    gdtnTag: "Edu Standard 2026",
    
    // Header & Navigation
    navInput: "1. Input Lesson",
    navQuestions: "2. Question Bank",
    navGamification: "3. Gamification Hub",
    navMindmap: "4. Mindmap & Summary",
    navAnalytics: "5. Matrix Analytics",
    navHistory: "6. Usage History",
    
    // Auth & Settings
    login: "Login",
    logout: "Logout",
    settings: "Settings",
    language: "Language",
    vietnamese: "Tiếng Việt 🇻🇳",
    english: "English 🇬🇧",
    settingsTitle: "Application Settings",
    accountInfo: "Account Information",
    selectLanguage: "Language Preference / Language",
    logoutButton: "Log Out Account",
    export: "Export",
    proposal: "Project Dossier",
    
    // Question Bank & Calculation Explanation
    calculationExplanationTitle: "📐 Step-by-Step Solution & Calculation Guide:",
    stepByStepSolution: "Detailed step-by-step resolution:",
    wrongAnswerNotification: "❌ Incorrect answer. Please refer to the detailed calculation guide below:",
    correctAnswerNotification: "✅ Correct! Excellent work on this calculation.",
    checkAnswer: "Check Answer",
    mathRoundingNote: "Math / Rounding Note:",
    acceptableAnswers: "Acceptable variants:",
    standardAnswer: "Standard Answer:",
    yourAnswer: "Your Answer:",
    detailedExplanation: "Detailed Explanation:",
    
    // Gamification
    wheelTitle: "Wheel of Fortune",
    spinButton: "SPIN THE WHEEL!",
    targetTitle: "Target Pop Quiz",
    flashcardTitle: "Anki Flashcards",
    quizTitle: "Timed Exam Simulation",
    
    // Footer
    footerCopyright: "EduAI Assistant - Powered by Google AI Studio & Gemini API",
    footerStandard: "Vietnam K-12 Curriculum Standard",
  }
};
