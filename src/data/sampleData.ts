import { QuizBankData, MindmapData, FlashcardDeck, WordwallData } from '../types';

export interface SamplePreset {
  id: string;
  title: string;
  subject: 'Hóa học' | 'Vật lý' | 'Toán học' | 'Lịch sử' | 'Sinh học';
  grade: 'Lớp 12' | 'Ôn Thi Tốt Nghiệp THPT';
  text: string;
  quiz: QuizBankData;
  mindmap: MindmapData;
  flashcards: FlashcardDeck;
  wordwall: WordwallData;
}

export const SAMPLE_PRESETS: SamplePreset[] = [
  {
    id: 'ester-lipit',
    title: 'Hóa Học 12: Ester & Lipit - Cấu Trúc, Tính Chất & Ước Lượng GD&ĐT',
    subject: 'Hóa học',
    grade: 'Lớp 12',
    text: `BÀI BÀI GIẢNG HÓA HỌC 12: ESTER VÀ LIPIT
1. Khái niệm Ester:
Khi thay thế nhóm -OH ở nhóm carboxyl (-COOH) của axit carboxylic bằng nhóm -OR' thì thu được ester.
Công thức tổng quát ester no, đơn chức, mạch hở: CnH2nO2 (n ≥ 2). Ví dụ: HCOOCH3 (methyl formate), CH3COOC2H5 (ethyl acetate).

2. Tính chất hóa học của Ester:
- Phản ứng thủy phân trong môi trường axit (phản ứng thuận nghịch):
RCOOR' + H2O <==H+, t°==> RCOOH + R'OH
- Phản ứng thủy phân trong môi trường kiềm (phản ứng xà phòng hóa - một chiều):
RCOOR' + NaOH --t°--> RCOONa + R'OH

3. Khái niệm Lipit và Chất béo (Triglyceride):
Lipit là những hợp chất hữu cơ phức tạp có trong tế bào sống. Chất béo là triester của glycerol với các axit béo (axit monocarboxylic có số C chẵn, mạch C dài không phân nhánh).
Công thức chung chất béo: (RCOO)3C3H5.
Các axit béo thường gặp:
- Axit palmitic: C15H31COOH (no) -> Tripalmitin: (C15H31COO)3C3H5 (chất rắn)
- Axit stearic: C17H35COOH (no) -> Tristearin: (C17H35COO)3C3H5 (chất rắn)
- Axit oleic: C17H33COOH (không no, 1 liên kết đôi C=C) -> Triolein: (C17H33COO)3C3H5 (chất lỏng)
- Axit linoleic: C17H31COOH (không no, 2 liên kết đôi C=C) -> Trilinolein: (C17H31COO)3C3H5 (chất lỏng).

4. Phản ứng hiđro hóa chất béo lỏng:
Chuyển chất béo lỏng (triolein) thành chất béo rắn (tristearin) bằng hiđro hóa có xúc tác Ni, t°. Ứng dụng trong công nghiệp sản xuất bơ nhân tạo (margarine).`,
    quiz: {
      title: 'Đề Ôn Tập Phân Hóa Chương Ester - Lipit (Cấu Trúc GD&ĐT Mới)',
      subject: 'Hóa học',
      grade: 'Lớp 12',
      matrixSummary: {
        nhanBiet: 2,
        thongHieu: 2,
        vanDung: 1,
        vanDungCao: 1,
      },
      questions: [
        {
          id: 'q1',
          type: 'multiple_choice',
          level: 'Nhận biết',
          question: 'Công thức phân tử tổng quát của ester no, đơn chức, mạch hở là gì?',
          options: ['CnH2nO2 (n ≥ 2)', 'CnH2n-2O2 (n ≥ 3)', 'CnH2n+2O2 (n ≥ 1)', 'CnH2nO4 (n ≥ 4)'],
          correctOptionIndex: 0,
          explanation: 'Ester no, đơn chức, mạch hở chứa 1 nhóm COO (1 liên kết pi C=O), có công thức tổng quát là CnH2nO2 với điều kiện n ≥ 2.',
        },
        {
          id: 'q2',
          type: 'multiple_choice',
          level: 'Thông hiểu',
          question: 'Xà phòng hóa hoàn toàn ethyl acetate (CH3COOC2H5) bằng dung dịch NaOH thu được sản phẩm gồm:',
          options: ['CH3COOH và C2H5OH', 'CH3COONa và C2H5OH', 'HCOONa và C2H5OH', 'CH3COONa và CH3OH'],
          correctOptionIndex: 1,
          explanation: 'Phản ứng xà phòng hóa CH3COOC2H5 + NaOH --t°--> CH3COONa (sodium acetate) + C2H5OH (ethanol).',
        },
        {
          id: 'q3',
          type: 'true_false',
          level: 'Thông hiểu',
          question: 'Cho các phát biểu sau về chất béo và lipit:',
          subItems: [
            { statement: 'Chất béo là triester của glycerol với các axit béo.', isCorrect: true, explanation: 'Đúng theo định nghĩa chất béo (Triglyceride).' },
            { statement: 'Triolein có công thức (C17H35COO)3C3H5 và ở trạng thái rắn ở nhiệt độ thường.', isCorrect: false, explanation: 'Sai. Triolein là chất béo không no (C17H33COO)3C3H5, ở trạng thái lỏng.' },
            { statement: 'Hiđro hóa chất béo lỏng xúc tác Ni, t° thu được chất béo rắn.', isCorrect: true, explanation: 'Đúng. Phản ứng biến liên kết đôi C=C không no thành liên kết đơn no.' },
            { statement: 'Chất béo nhẹ hơn nước và tan tốt trong nước.', isCorrect: false, explanation: 'Sai. Chất béo nhẹ hơn nước và KHÔNG tan trong nước, nhưng tan tốt trong dung môi hữu cơ.' },
          ],
          explanation: 'Đánh giá các phát biểu dựa trên tính chất vật lý và hóa học của Triglyceride.',
        },
        {
          id: 'q4',
          type: 'short_answer',
          level: 'Vận dụng',
          question: 'Xà phòng hóa hoàn toàn 8,8 gam ethyl acetate (CH3COOC2H5, M = 88 g/mol) bằng 100 ml dung dịch NaOH 1,5M. Tính khối lượng muối CH3COONa (M = 82 g/mol) thu được sau khi cô cạn dung dịch (tính theo gam).',
          shortAnswer: '8.2',
          explanation: 'Số mol CH3COOC2H5 = 8.8 / 88 = 0.1 mol. Số mol NaOH = 0.1 * 1.5 = 0.15 mol -> NaOH dư. Muối tính theo ester = 0.1 mol CH3COONa. m_muối = 0.1 * 82 = 8.2 gam.',
        },
        {
          id: 'q5',
          type: 'multiple_choice',
          level: 'Vận dụng cao',
          question: 'Thủy phân hoàn toàn 0,1 mol triglyceride X bằng dung dịch NaOH vừa đủ, thu được glycerol và hỗn hợp gồm 0,1 mol sodium palmitate và 0,2 mol sodium oleate. Số liên kết pi (π) trong 1 molecule X là:',
          options: ['3', '5', '4', '6'],
          correctOptionIndex: 1,
          explanation: 'X tạo từ 1 gốc palmitate (C15H31COO - 1 pi ở nhóm COO) và 2 gốc oleate (C17H33COO - mỗi gốc có 1 pi C=O và 1 pi C=C). Tổng liên kết pi = 3 (ở 3 nhóm COO) + 2 (ở 2 gốc oleate) = 5 liên kết pi.',
        },
      ],
    },
    mindmap: {
      topic: 'ESTER VÀ LIPIT - HÓA HỌC 12',
      description: 'Sơ đồ tư duy hệ thống toàn bộ lý thuyết trọng tâm Ester, Lipit & Bài tập ôn thi THPT',
      color: '#6366f1',
      icon: '🧪',
      branches: [
        {
          id: 'b1',
          title: 'I. ESTER',
          color: '#3b82f6',
          icon: '💧',
          summary: 'Cấu tạo, tên gọi và phản ứng đặc trưng',
          subBranches: [
            { id: 'sb1', title: 'Công thức & Danh pháp', details: ['CnH2nO2 (no, đơn, hở)', 'RCOOR\' -> Tên gốc R\' + Tên gốc axit RCOO-ate', 'HCOOCH3: Methyl formate', 'CH3COOC2H5: Ethyl acetate'] },
            { id: 'sb2', title: 'Tính chất hóa học', details: ['Thủy phân axit (H+, t°): Thuận nghịch', 'Thủy phân kiềm (NaOH, t°): Xà phòng hóa, 1 chiều', 'Ester của phenol / vinyl acetate: Tính chất đặc biệt'] },
          ],
        },
        {
          id: 'b2',
          title: 'II. LIPIT & CHẤT BÉO',
          color: '#ec4899',
          icon: '🧈',
          summary: 'Triglyceride, Axit béo & Bơ nhân tạo',
          subBranches: [
            { id: 'sb3', title: 'Axit Béo Thường Gặp', details: ['Axit Palmitic: C15H31COOH (no)', 'Axit Stearic: C17H35COOH (no)', 'Axit Oleic: C17H33COOH (1 đôi C=C)', 'Axit Linoleic: C17H31COOH (2 đôi C=C)'] },
            { id: 'sb4', title: 'Tính chất & Ứng dụng', details: ['Chất béo no -> Rắn (Tristearin, Tripalmitin)', 'Chất béo không no -> Lỏng (Triolein)', 'Hiđro hóa chất béo lỏng (Ni, t°) -> Sản xuất bơ Margarine'] },
          ],
        },
      ],
    },
    flashcards: {
      deckTitle: 'Flashcard Ghi Nhớ Nhanh Ester - Lipit (Anki Ready)',
      subject: 'Hóa học 12',
      cards: [
        { id: 'fc1', front: 'Công thức tổng quát ester no, đơn chức, mạch hở?', back: 'CnH2nO2 (với n ≥ 2)', mnemonicHint: 'Nhớ n ≥ 2 vì tối thiểu chứa HCOOCH3 (2 C).', category: 'Lý thuyết', tags: ['HoaHoc12', 'Ester'] },
        { id: 'fc2', front: 'Axit Palmitic có công thức và khối lượng mol (M) là bao nhiêu?', back: 'C15H31COOH, M = 256 g/mol', mnemonicHint: 'Palmitic = 16 Carbon (15 C trong gốc + 1 C trong COOH).', category: 'Axit béo', tags: ['HoaHoc12', 'AxitBeo'] },
        { id: 'fc3', front: 'Triolein có thể cộng tối đa bao nhiêu mol H2 vào 1 mol chất béo?', back: '3 mol H2 (vì Triolein chứa 3 gốc oleate, mỗi gốc chứa 1 liên kết C=C)', mnemonicHint: '(C17H33COO)3C3H5 + 3H2 --Ni,t°--> (C17H35COO)3C3H5.', category: 'Phản ứng', tags: ['HoaHoc12', 'PhanUng'] },
        { id: 'fc4', front: 'Sự khác biệt giữa thủy phân ester trong môi trường axit vs môi trường kiềm?', back: 'Môi trường axit: Thuận nghịch (2 chiều). Môi trường kiềm: Một chiều (xà phòng hóa).', mnemonicHint: 'Axit = 2 chiều. Kiềm = 1 chiều tạo muối.', category: 'Lý thuyết', tags: ['Ester'] },
      ],
    },
    wordwall: {
      gameTitle: 'Đấu Trường Tri Thức: Ester & Lipit Wordwall Edition',
      wheelQuestions: [
        { segmentLabel: 'HCOOCH3', question: 'Tên gọi của ester HCOOCH3 là gì?', answer: 'Methyl formate', points: 100 },
        { segmentLabel: 'Chất Béo Lỏng', question: 'Tên một loại chất béo lỏng chứa liên kết đôi?', answer: 'Triolein', points: 200 },
        { segmentLabel: 'Xà Phòng Hóa', question: 'Thủy phân chất béo trong môi trường kiềm gọi là gì?', answer: 'Phản ứng xà phòng hóa', points: 150 },
        { segmentLabel: 'Bơ Margarine', question: 'Ứng dụng chính của phản ứng hiđro hóa chất béo lỏng?', answer: 'Sản xuất bơ nhân tạo', points: 300 },
      ],
      millionaireQuestions: [
        { level: 1, question: 'Ester có mùi thơm dễ chịu của quả chuối chín là:', options: ['Isoamyl acetate', 'Ethyl formate', 'Benzyl acetate', 'Methyl methacrylate'], correctIndex: 0, explanation: 'Isoamyl acetate có mùi thơm đặc trưng của chuối chín.' },
        { level: 2, question: 'Chất nào sau đây KHÔNG PHẢI là chất béo?', options: ['Tristearin', 'Triolein', 'Glycerol', 'Tripalmitin'], correctIndex: 2, explanation: 'Glycerol là ancol đa chức (C3H5(OH)3), không phải là chất béo.' },
        { level: 3, question: 'Chất béo rắn thường là chất béo chứa chủ yếu gốc axit béo nào?', options: ['Không no', 'No', 'Axit fomic', 'Axit axetic'], correctIndex: 1, explanation: 'Chất béo chứa chủ yếu các gốc axit béo no (như palmitic, stearic) ở trạng thái rắn ở nhiệt độ thường.' },
      ],
      memoryMatchingPairs: [
        { term: 'Triolein', definition: '(C17H33COO)3C3H5 - Chất béo lỏng' },
        { term: 'Tristearin', definition: '(C17H35COO)3C3H5 - Chất béo rắn' },
        { term: 'Xà phòng hóa', definition: 'Thủy phân ester trong dung dịch kiềm (NaOH/KOH)' },
        { term: 'Ester no đơn hở', definition: 'CnH2nO2 (n ≥ 2)' },
      ],
    },
  },
  {
    id: 'vatly-daodong',
    title: 'Vật Lý 12: Con Lắc Đơn & Dao Động Điều Hòa - Công Thức & Dạng Bài GD&ĐT',
    subject: 'Vật lý',
    grade: 'Lớp 12',
    text: `VẬT LÝ 12 - CHƯƠNG I: DAO ĐỘNG CƠ
1. Phương trình dao động điều hòa:
x = A*cos(ωt + φ)
Trong đó:
- x: li độ dao động (cm hoặc m)
- A: biên độ dao động (A > 0)
- ω: tần số góc (rad/s), ω = 2π/T = 2πf
- (ωt + φ): pha dao động tại thời điểm t
- φ: pha ban đầu tại t = 0.

2. Vận tốc và Gia tốc:
- Vận tốc: v = x' = -ωA*sin(ωt + φ) = ωA*cos(ωt + φ + π/2). Vận tốc sớm pha π/2 so với li độ.
  v_max = ωA (tại VTCB x = 0). v = 0 (tại 2 biên x = ±A).
- Gia tốc: a = v' = -ω^2*A*cos(ωt + φ) = -ω^2*x. Gia tốc ngược pha với li độ, luôn hướng về VTCB.
  a_max = ω^2*A (tại 2 biên). a = 0 (tại VTCB).

3. Công thức độc lập thời gian:
A^2 = x^2 + (v/ω)^2
a = -ω^2*x => (v / (ωA))^2 + (a / (ω^2 A))^2 = 1

4. Con lắc đơn:
- Tần số góc: ω = sqrt(g / l)
- Chu kỳ: T = 2π * sqrt(l / g)
- Tần số: f = 1 / (2π) * sqrt(g / l)
Chú ý: Chu kỳ con lắc đơn KHÔNG phụ thuộc vào khối lượng m của vật nặng, chỉ phụ thuộc chiều dài dây l và gia tốc trọng trường g.`,
    quiz: {
      title: 'Đề Trắc Nghiệm Phân Hóa Dao Động Cơ Chuẩn GD&ĐT',
      subject: 'Vật lý',
      grade: 'Lớp 12',
      matrixSummary: { nhanBiet: 2, thongHieu: 1, vanDung: 1, vanDungCao: 1 },
      questions: [
        {
          id: 'vq1',
          type: 'multiple_choice',
          level: 'Nhận biết',
          question: 'Chu kỳ dao động điều hòa của con lắc đơn chiều dài l ở nơi có gia tốc trọng trường g được tính bằng công thức:',
          options: ['T = 2π * sqrt(l / g)', 'T = 2π * sqrt(g / l)', 'T = 1/(2π) * sqrt(l / g)', 'T = sqrt(l / g)'],
          correctOptionIndex: 0,
          explanation: 'Công thức chu kỳ con lắc đơn T = 2π * sqrt(l / g).',
        },
        {
          id: 'vq2',
          type: 'multiple_choice',
          level: 'Thông hiểu',
          question: 'Một vật dao động điều hòa với phương trình x = 5*cos(10πt + π/3) (cm). Vận tốc cực đại của vật là:',
          options: ['50 cm/s', '50π cm/s', '10π cm/s', '5 cm/s'],
          correctOptionIndex: 1,
          explanation: 'v_max = ω*A = 10π * 5 = 50π cm/s.',
        },
        {
          id: 'vq3',
          type: 'short_answer',
          level: 'Vận dụng',
          question: 'Một con lắc đơn có chiều dài l = 1 m dao động điều hòa tại nơi có g = π^2 = 10 m/s^2. Tính chu kỳ dao động T của con lắc đơn (tính theo giây).',
          shortAnswer: '2',
          explanation: 'T = 2π * sqrt(1 / π^2) = 2π / π = 2 giây.',
        },
      ],
    },
    mindmap: {
      topic: 'DAO ĐỘNG ĐIỀU HÒA & CON LẮC ĐƠN',
      description: 'Sơ đồ tư duy toàn bộ phương trình, công thức độc lập thời gian & đặc tính con lắc đơn',
      color: '#10b981',
      icon: '📐',
      branches: [
        {
          id: 'mb1',
          title: 'I. Đại Lượng Dao Động',
          color: '#059669',
          icon: '⚡',
          subBranches: [
            { id: 'msb1', title: 'Li độ & Vận tốc', details: ['x = A cos(ωt + φ)', 'v = -ωA sin(ωt + φ)', 'v sớm pha π/2 so với x', 'v_max = ωA (tại VTCB)'] },
            { id: 'msb2', title: 'Gia tốc', details: ['a = -ω^2 x', 'a ngược pha với x', 'a luôn hướng về VTCB', 'a_max = ω^2 A (tại biên)'] },
          ],
        },
      ],
    },
    flashcards: {
      deckTitle: 'Flashcard Công Thức Dao Động Cơ Vật Lý 12',
      subject: 'Vật lý 12',
      cards: [
        { id: 'vfc1', front: 'Công thức độc lập thời gian giữa x, v và A?', back: 'A^2 = x^2 + (v / ω)^2', mnemonicHint: 'Vuông pha nên sin^2 + cos^2 = 1', category: 'Công thức', tags: ['VatLy12', 'DaoDong'] },
        { id: 'vfc2', front: 'Chu kỳ con lắc đơn có phụ thuộc khối lượng m không?', back: 'KHÔNG phụ thuộc khối lượng m. T = 2π sqrt(l/g)', mnemonicHint: 'Con lắc đơn chỉ nhìn chiều dài l và gia tốc g.', category: 'Con lắc đơn', tags: ['VatLy12'] },
      ],
    },
    wordwall: {
      gameTitle: 'Bứt Phá Vật Lý: Dao Động Cơ Game Show',
      wheelQuestions: [
        { segmentLabel: 'v_max', question: 'Vận tốc cực đại tại vị trí nào?', answer: 'Vị trí cân bằng (x=0)', points: 100 },
        { segmentLabel: 'a_max', question: 'Gia tốc cực đại đạt giá trị ở đâu?', answer: 'Tại hai vị trí biên (x = ±A)', points: 200 },
      ],
      millionaireQuestions: [
        { level: 1, question: 'Gia tốc trong dao động điều hòa biến thiên:', options: ['Ngược pha với li độ', 'Cùng pha với li độ', 'Sớm pha π/2 so với vận tốc', 'Trễ pha π/2 so với li độ'], correctIndex: 0, explanation: 'Phương trình a = -ω^2 x cho thấy gia tốc ngược pha với li độ.' },
      ],
      memoryMatchingPairs: [
        { term: 'x = 0', definition: 'VTCB -> v_max = ωA, a = 0' },
        { term: 'x = ±A', definition: 'Biên -> v = 0, a_max = ω^2 A' },
      ],
    },
  },
];
