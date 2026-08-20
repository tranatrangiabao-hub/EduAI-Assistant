import { SchoolLevel } from '../types';

export interface SubjectOption {
  value: string;
  label: string;
  isGraded: boolean; // true = Đánh giá bằng Điểm số + Nhận xét
  category?: string;
}

export const THCS_SUBJECTS: SubjectOption[] = [
  { value: 'Toán học', label: 'Toán học', isGraded: true, category: 'Môn học đánh giá bằng điểm số' },
  { value: 'Ngữ văn', label: 'Ngữ văn', isGraded: true, category: 'Môn học đánh giá bằng điểm số' },
  { value: 'Tiếng Anh', label: 'Tiếng Anh', isGraded: true, category: 'Môn học đánh giá bằng điểm số' },
  { value: 'Khoa học tự nhiên', label: 'Khoa học tự nhiên (Lý / Hóa / Sinh)', isGraded: true, category: 'Môn học đánh giá bằng điểm số' },
  { value: 'Lịch sử & Địa lý', label: 'Lịch sử & Địa lý', isGraded: true, category: 'Môn học đánh giá bằng điểm số' },
  { value: 'Tin học', label: 'Tin học', isGraded: true, category: 'Môn học đánh giá bằng điểm số' },
  { value: 'Công nghệ', label: 'Công nghệ', isGraded: true, category: 'Môn học đánh giá bằng điểm số' },
  { value: 'Giáo dục công dân', label: 'Giáo dục công dân (GDCD)', isGraded: true, category: 'Môn học đánh giá bằng điểm số' },
];

export const THPT_SUBJECTS: SubjectOption[] = [
  { value: 'Toán học', label: 'Toán học', isGraded: true, category: 'Môn học đánh giá bằng điểm số' },
  { value: 'Ngữ văn', label: 'Ngữ văn', isGraded: true, category: 'Môn học đánh giá bằng điểm số' },
  { value: 'Tiếng Anh', label: 'Tiếng Anh', isGraded: true, category: 'Môn học đánh giá bằng điểm số' },
  { value: 'Vật lý', label: 'Vật lý', isGraded: true, category: 'Môn học đánh giá bằng điểm số' },
  { value: 'Hóa học', label: 'Hóa học', isGraded: true, category: 'Môn học đánh giá bằng điểm số' },
  { value: 'Sinh học', label: 'Sinh học', isGraded: true, category: 'Môn học đánh giá bằng điểm số' },
  { value: 'Lịch sử', label: 'Lịch sử', isGraded: true, category: 'Môn học đánh giá bằng điểm số' },
  { value: 'Địa lý', label: 'Địa lý', isGraded: true, category: 'Môn học đánh giá bằng điểm số' },
  { value: 'GDCD - Kinh tế & Pháp luật', label: 'GDCD / Kinh tế & Pháp luật', isGraded: true, category: 'Môn học đánh giá bằng điểm số' },
  { value: 'Tin học', label: 'Tin học', isGraded: true, category: 'Môn học đánh giá bằng điểm số' },
  { value: 'Công nghệ', label: 'Công nghệ', isGraded: true, category: 'Môn học đánh giá bằng điểm số' },
  { value: 'Giáo dục quốc phòng & an ninh', label: 'Giáo dục quốc phòng & an ninh (GDQP&AN)', isGraded: true, category: 'Môn học đánh giá bằng điểm số' },
];

export interface AssessmentInfo {
  isGraded: boolean;
  statusTitle: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  regulationInfo: string;
  testingOptions: string[];
  pedagogicalGuidance: string;
}

export function getSubjectAssessmentInfo(subject: string, schoolLevel: SchoolLevel): AssessmentInfo {
  const sj = (subject || '').toLowerCase().trim();

  // GDQP&AN (Cấp 3)
  if (sj.includes('quốc phòng') || sj.includes('an ninh') || sj.includes('gdqp')) {
    return {
      isGraded: true,
      statusTitle: 'ĐÁNH GIÁ BẰNG ĐIỂM SỐ KẾT HỢP NHẬN XÉT (LÝ THUYẾT & THỰC HÀNH)',
      badgeBg: 'bg-emerald-100',
      badgeText: 'text-emerald-900',
      badgeBorder: 'border-emerald-300',
      regulationInfo: 'Môn học kiểm tra kết hợp lý thuyết quy định và thao tác kỹ năng thực hành theo đợt học phần GDQP&AN.',
      testingOptions: [
        'Kiểm tra thường xuyên 15 phút (Lý thuyết & Thao tác)',
        'Kiểm tra định kỳ 1 tiết / 45 phút học phần',
        'Bài kiểm tra Giữa kỳ & Cuối kỳ GDQP&AN',
        'Thang điểm 10 kết hợp nhận xét tiến bộ kỹ năng'
      ],
      pedagogicalGuidance: 'Hệ thống hỗ trợ xuất ma trận trắc nghiệm lý thuyết GDQP&AN và bảng kiểm thao tác điều lệnh, băng bó, kỹ thuật bắn súng.',
    };
  }

  // Standard Graded subjects (Toán, Văn, Anh, KHTN, Lý, Hóa, Sinh, Sử, Địa, Tin, Công nghệ, GDCD/GDKT&PL)
  return {
    isGraded: true,
    statusTitle: 'ĐÁNH GIÁ BẰNG ĐIỂM SỐ KẾT HỢP NHẬN XÉT (ĐẦY ĐỦ BÀI KIỂM TRA ĐỊNH KỲ)',
    badgeBg: 'bg-indigo-100',
    badgeText: 'text-indigo-900',
    badgeBorder: 'border-indigo-300',
    regulationInfo: 'Theo quy định Bộ GD&ĐT, môn học bắt buộc có đầy đủ bài kiểm tra đánh giá thường xuyên & định kỳ theo ma trận chuẩn.',
    testingOptions: [
      'Kiểm tra thường xuyên (15 phút)',
      'Kiểm tra định kỳ 1 tiết (45 phút)',
      'Bài kiểm tra Giữa học kỳ I / Giữa học kỳ II (60 phút)',
      'Bài kiểm tra Cuối học kỳ I / Cuối học kỳ II (90 phút)',
      ...(schoolLevel === 'THPT' ? ['Đề thi thử Tốt nghiệp THPT Quốc gia (50 - 90 phút)'] : ['Đề thi vào 10 THCS (Lớp 9)'])
    ],
    pedagogicalGuidance: 'Hệ thống hỗ trợ xuất đề thi chuẩn cấu trúc Bộ GD&ĐT 2025: Trắc nghiệm 4 lựa chọn, Trắc nghiệm Đúng/Sai 4 ý (a,b,c,d) và Trả lời ngắn.',
  };
}

