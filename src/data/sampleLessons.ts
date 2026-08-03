import { LessonUnit } from '../types';

export const SAMPLE_LESSONS: LessonUnit[] = [
  {
    id: 'sample_khtn_7',
    title: 'KHTN 7 - Bài 12: Mạch điện và tác dụng của dòng điện',
    subject: 'Khoa học tự nhiên',
    grade: 'Lớp 7',
    schoolLevel: 'THCS',
    createdAt: new Date().toISOString(),
    matrix: { nhanBiet: 50, thongHieu: 30, vanDung: 15, vanDungCao: 5 },
    rawText: `
Bài 12: Mạch điện và Tác dụng của Dòng điện - Khoa học Tự nhiên Lớp 7 (THCS)
1. Dòng điện và Mạch điện kín:
- Dòng điện là dòng chuyển dời có hướng của các hạt mang điện (trong kim loại là các electron tự do).
- Mạch điện đơn giản gồm: Nguồn điện (pin, ắc quy), thiết bị tiêu thụ điện (bóng đèn, quạt), dây dẫn và công tắc (cầu khóa).
- Dòng điện chỉ chạy trong mạch điện kín khi công tắc đóng.

2. Tác dụng của Dòng điện:
- Tác dụng nhiệt: Dòng điện chạy qua mọi vật dẫn thông thường đều làm vật dẫn nóng lên (ví dụ: bàn ôt, bếp điện, bóng đèn dây tóc).
- Tác dụng phát sáng: Dòng điện làm sáng bóng đèn LED, đèn huỳnh quang mà không cần nóng lên đến nhiệt độ cao.
- Tác dụng từ: Dòng điện chạy qua cuộn dây dẫn quấn quanh lõi sắt mềm có khả năng hút các vật bằng sắt, thép (nam châm điện).
- Tác dụng hóa học: Ứng dụng trong mạ điện (mạ vàng, mạ bạc), luyện kim.
- Tác dụng sinh lý: Dòng điện có thể gây giật điện, tác động lên cơ thể người và động vật. Ứng dụng trong y học (châm cứu điện, tim nhân tạo).
`,
    summaryPoints: [
      'Dòng điện là dòng chuyển dời có hướng của các hạt mang điện.',
      'Mạch điện kín bao gồm: Nguồn điện, dây dẫn, thiết bị tiêu thụ và công tắc đóng.',
      '5 Tác dụng của dòng điện: Nhiệt, Phát sáng, Từ, Hóa học và Sinh lý.',
      'Đèn LED sáng nhờ tác dụng phát sáng; Bàn là, bếp điện hoạt động nhờ tác dụng nhiệt.',
      'Nam châm điện hoạt động dựa trên tác dụng từ của dòng điện.'
    ],
    mindmapMermaid: `mindmap
  root((KHTN 7 - Dòng điện))
    Khái niệm
      Dòng hạt mang điện chuyển dời
      Mạch kín: Nguồn + Dây + Đèn + Công tắc
    Các tác dụng
      Tác dụng nhiệt: Bàn là, bếp điện
      Tác dụng phát sáng: Đèn LED, huỳnh quang
      Tác dụng từ: Nam châm điện
      Tác dụng hóa học: Mạ điện
      Tác dụng sinh lý: Cấp cứu y học`,
    questions: [
      {
        id: 'q_khtn7_1',
        questionType: 'multiple_choice',
        question: 'Thiết bị nào sau đây hoạt động dựa trên tác dụng nhiệt của dòng điện?',
        options: ['Quạt máy', 'Bàn là điện', 'Đèn pin LED', 'Bút thử điện'],
        correctOption: 1,
        explanation: 'Bàn là điện chuyển hóa điện năng thành nhiệt năng nhờ tác dụng nhiệt của dòng điện.',
        taxonomyLevel: 'Nhận biết',
        difficulty: 'Dễ',
        topic: 'Tác dụng dòng điện'
      },
      {
        id: 'q_khtn7_2',
        questionType: 'multiple_choice',
        question: 'Hạt mang điện tự do chuyển dời có hướng trong dây dẫn kim loại để tạo thành dòng điện là hạt nào?',
        options: ['Các proton', 'Các nguyên tử trung hòa', 'Các electron tự do', 'Các ion dương'],
        correctOption: 2,
        explanation: 'Trong dây dẫn kim loại, các electron tự do chuyển dời có hướng tạo nên dòng điện.',
        taxonomyLevel: 'Thông hiểu',
        difficulty: 'Trung bình',
        topic: 'Dòng điện kim loại'
      },
      {
        id: 'q_khtn7_3',
        questionType: 'short_answer',
        question: 'Hãy điền tên thiết bị dùng để cung cấp năng lượng điện cho mạch điện (ví dụ pin hoặc ắc quy):',
        shortAnswer: 'nguồn điện',
        acceptableAnswers: ['nguồn điện', 'pin', 'ắc quy', 'Nguồn điện'],
        explanation: 'Nguồn điện có khả năng cung cấp và duy trì dòng điện trong mạch.',
        taxonomyLevel: 'Nhận biết',
        difficulty: 'Dễ',
        topic: 'Mạch điện'
      }
    ]
  },
  {
    id: 'sample_tinhoc_12',
    title: 'Tin học 12 - Bài 1: Khái niệm về hệ cơ sở dữ liệu (CSDL)',
    subject: 'Tin học',
    grade: 'Lớp 12',
    schoolLevel: 'THPT',
    createdAt: new Date().toISOString(),
    matrix: { nhanBiet: 40, thongHieu: 30, vanDung: 20, vanDungCao: 10 },
    rawText: `
Bài 1: Khái niệm về Hệ Cơ sở Dữ liệu (CSDL) - Tin học 12
1. Khái niệm CSDL và Hệ QTCSDL:
- Dữ liệu (Data): Là các thông tin được ghi lại dưới dạng ký hiệu, con số, hình ảnh, âm thanh...
- Cơ sở dữ liệu (Database - CSDL): Là một tập hợp các dữ liệu có liên quan với nhau, chứa thông tin của một tổ chức nào đó (như trường học, ngân hàng, bệnh viện), được lưu trữ trên các thiết bị nhớ để đáp ứng nhu cầu khai thác thông tin của nhiều người dùng với nhiều mục đích khác nhau.
- Hệ quản trị CSDL (DBMS): Là phần mềm cung cấp môi trường cho phép tạo lập, lưu trữ và khai thác thông tin của CSDL (ví dụ: MS Access, MySQL, SQL Server, Oracle).
- Hệ CSDL: Bao gồm CSDL + Hệ QTCSDL + Các phần mềm ứng dụng + Con người.

2. Các yêu cầu cơ bản đối với hệ CSDL:
- Tính cấu trúc: Dữ liệu trong CSDL được lưu trữ theo một cấu trúc xác định.
- Tính độc lập: Dữ liệu không phụ thuộc vào ứng dụng hay thiết bị lưu trữ.
- Tính không dư thừa: Tránh trùng lặp dữ liệu gây lãng phí bộ nhớ và bất đồng bộ.
- Tính an toàn và bảo mật thông tin: Đảm bảo chỉ người có thẩm quyền mới được truy cập, ngăn ngừa mất mát dữ liệu.
- Tính toàn vẹn: Dữ liệu lưu trữ phải luôn chính xác, phản ánh đúng thực tế.
- Tính nhất quán: Khi có cập nhật, dữ liệu ở mọi vị trí phải đồng bộ.

3. Các chức năng của Hệ QTCSDL:
- Cung cấp ngôn ngữ định nghĩa dữ liệu (DDL) để tạo lập cấu trúc CSDL.
- Cung cấp ngôn ngữ thao tác dữ liệu (DML) để tìm kiếm, cập nhật, thêm, xóa dữ liệu.
- Cung cấp các công cụ kiểm soát và điều khiển truy cập.
`,
    summaryPoints: [
      'Cơ sở dữ liệu (CSDL) là tập hợp dữ liệu có liên quan được lưu trữ trên thiết bị nhớ.',
      'Hệ quản trị CSDL (DBMS) là phần mềm giúp tạo lập, lưu trữ và khai thác CSDL (như Access, MySQL).',
      'Hệ CSDL bao gồm 4 thành phần: CSDL + Hệ QTCSDL + Phần mềm ứng dụng + Con người.',
      '6 yêu cầu cốt lõi: Tính cấu trúc, độc lập, không dư thừa, an toàn bảo mật, toàn vẹn, nhất quán.',
      'Hệ QTCSDL cung cấp ngôn ngữ DDL (định nghĩa dữ liệu) và DML (thao tác dữ liệu).'
    ],
    mindmapMermaid: `mindmap
  root((Hệ CSDL Tin 12))
    Khái niệm
      CSDL: Tập hợp dữ liệu lưu giữ
      Hệ QTCSDL: Phần mềm quản lý
      Hệ CSDL: CSDL + DBMS + Ứng dụng + Con người
    Yêu cầu cơ bản
      Tính cấu trúc & độc lập
      Tính không dư thừa
      Tính an toàn & bảo mật
      Tính toàn vẹn & nhất quán
    Chức năng DBMS
      Ngôn ngữ DDL: Tạo cấu trúc
      Ngôn ngữ DML: Thao tác dữ liệu
      Đảm bảo an toàn truy cập`,
    questions: [
      {
        id: 'q_th12_1',
        question: 'Phần mềm nào sau đây là ví dụ điển hình của một Hệ Quản trị Cơ sở Dữ liệu (DBMS)?',
        options: ['Microsoft Word', 'Microsoft Access / MySQL', 'Adobe Photoshop', 'Google Chrome'],
        correctOption: 1,
        explanation: 'MS Access, MySQL, SQL Server, Oracle là các Hệ quản trị CSDL (DBMS) cung cấp môi trường quản lý CSDL.',
        taxonomyLevel: 'Nhận biết',
        difficulty: 'Dễ',
        topic: 'Hệ QTCSDL'
      },
      {
        id: 'q_th12_2',
        question: 'Thành phần "Hệ CSDL" bao gồm những yếu tố nào sau đây?',
        options: [
          'Chỉ bao gồm phần cứng máy tính và dây cáp mạng',
          'Chỉ bao gồm tập hợp file văn bản Word',
          'CSDL + Hệ QTCSDL + Các phần mềm ứng dụng + Con người',
          'Hệ điều hành Windows + Mạng Internet'
        ],
        correctOption: 2,
        explanation: 'Hệ CSDL là khái niệm toàn diện gồm CSDL, Hệ QTCSDL, phần mềm ứng dụng khai thác và con người vận hành.',
        taxonomyLevel: 'Nhận biết',
        difficulty: 'Dễ',
        topic: 'Khái niệm Hệ CSDL'
      },
      {
        id: 'q_th12_3',
        question: 'Tính chất nào đảm bảo rằng dữ liệu trong CSDL không bị lặp đi lặp lại vô ích gây lãng phí dung lượng?',
        options: ['Tính độc lập', 'Tính cấu trúc', 'Tính bảo mật', 'Tính không dư thừa'],
        correctOption: 3,
        explanation: 'Tính không dư thừa giúp tối ưu bộ nhớ lưu trữ và tránh tình trạng thông tin mâu thuẫn khi cập nhật.',
        taxonomyLevel: 'Thông hiểu',
        difficulty: 'Trung bình',
        topic: 'Yêu cầu CSDL'
      },
      {
        id: 'q_th12_4',
        question: 'Ngôn ngữ thao tác dữ liệu (DML - Data Manipulation Language) trong Hệ QTCSDL cho phép người dùng thực hiện công việc gì?',
        options: [
          'Khai báo kiểu dữ liệu và độ dài trường dữ liệu',
          'Thực hiện các thao tác tìm kiếm, cập nhật, thêm, xóa dữ liệu',
          'Cài đặt driver card màn hình cho máy tính',
          'Thiết kế giao diện vật lý của phần cứng máy chủ'
        ],
        correctOption: 1,
        explanation: 'DML (Data Manipulation Language) phục vụ cho việc truy vấn, thêm, sửa, xóa dữ liệu trong bảng.',
        taxonomyLevel: 'Thông hiểu',
        difficulty: 'Trung bình',
        topic: 'Ngôn ngữ DML'
      },
      {
        id: 'q_th12_5',
        question: 'Trong kỳ thi THPT, nếu điểm số của một học sinh sau khi phúc khảo được cập nhật ở bảng Điểm thì kết quả hiển thị trên Giấy chứng nhận tốt nghiệp cũng tự động cập nhật chính xác. Điều này thể hiện tính chất nào của CSDL?',
        options: ['Tính độc lập phần cứng', 'Tính dư thừa dữ liệu', 'Tính nhất quán và tính toàn vẹn', 'Tính vô hình'],
        correctOption: 2,
        explanation: 'Tính nhất quán và toàn vẹn đảm bảo dữ liệu phản ánh đúng thực tế và đồng bộ trên mọi báo cáo khai thác.',
        taxonomyLevel: 'Vận dụng',
        difficulty: 'Khó',
        topic: 'Ứng dụng thực tế'
      },
      {
        id: 'q_th12_6',
        question: 'Giả sử nhà trường cần xây dựng hệ thống quản lý thư viện trực tuyến. Việc sử dụng Hệ CSDL mang lại ưu điểm vượt trội nào so với quản lý bằng sổ sách truyền thống?',
        options: [
          'Cho phép nhiều học sinh tra cứu sách cùng lúc, tìm kiếm tức thì và kiểm soát mượn trả chính xác',
          'Không cần dùng máy tính hay điện tính',
          'Tự động in sách giấy mới khi học sinh cần',
          'Tăng dung lượng lưu trữ giấy tờ trong kho'
        ],
        correctOption: 0,
        explanation: 'Hệ CSDL cho phép truy cập đồng thời, tra cứu siêu tốc và quản lý chính xác không phụ thuộc giấy tờ.',
        taxonomyLevel: 'Vận dụng',
        difficulty: 'Khó',
        topic: 'Phân tích ưu điểm'
      },
      {
        id: 'q_th12_tf_1',
        questionType: 'true_false',
        question: 'Xét tính Đúng/Sai của các phát biểu sau đây về CSDL và Hệ QTCSDL:',
        tfStatements: [
          { id: 'tf1', statement: 'a) Microsoft Access và MySQL là ví dụ về các Hệ QTCSDL.', isCorrect: true },
          { id: 'tf2', statement: 'b) Ngôn ngữ DDL dùng để cập nhật, thêm, xóa dữ liệu trong bảng.', isCorrect: false },
          { id: 'tf3', statement: 'c) Tính không dư thừa giúp tiết kiệm bộ nhớ và tránh bất đồng bộ dữ liệu.', isCorrect: true },
          { id: 'tf4', statement: 'd) Hệ CSDL chỉ bao gồm CSDL và phần cứng máy tính.', isCorrect: false }
        ],
        explanation: 'a) Đúng - Access và MySQL là DBMS phổ biến. b) Sai - DDL dùng định nghĩa cấu trúc, DML mới dùng để cập nhật/thêm/xóa. c) Đúng - Tránh lãng phí bộ nhớ. d) Sai - Hệ CSDL gồm CSDL + DBMS + Phần mềm ứng dụng + Con người.',
        taxonomyLevel: 'Thông hiểu',
        difficulty: 'Trung bình',
        topic: 'Tổng quan CSDL'
      },
      {
        id: 'q_th12_sa_1',
        questionType: 'short_answer',
        question: 'Một CSDL lưu trữ danh sách gồm 1000 học sinh. Nếu mỗi hồ sơ chiếm 250 Bytes, hãy tính tổng dung lượng CSDL này theo đơn vị Kilobytes (KB)? (Biết 1 KB = 1024 Bytes, làm tròn đến 2 chữ số thập phân).',
        shortAnswer: '244.14',
        acceptableAnswers: ['244.14', '244,14'],
        mathRoundingNote: 'Làm tròn đến 2 chữ số thập phân (250.000 / 1024 ≈ 244.14 KB)',
        roundingDecimals: 2,
        explanation: 'Tổng dung lượng = 1000 * 250 = 250,000 Bytes. Đổi ra KB = 250,000 / 1024 ≈ 244.14 KB.',
        taxonomyLevel: 'Vận dụng',
        difficulty: 'Khó',
        topic: 'Tính toán dung lượng'
      },
      {
        id: 'q_th12_7',
        question: 'Trong trường hợp một giao dịch ngân hàng chuyển tiền bị gián đoạn giữa chừng do sự cố mất điện, Hệ QTCSDL sẽ xử lý như thế nào để đảm bảo tính an toàn dữ liệu?',
        options: [
          'Cộng tiền cho tài khoản nhận nhưng không trừ tài khoản gửi',
          'Thực hiện cơ chế Rollback (Khôi phục) về trạng thái ban đầu trước giao dịch',
          'Xóa toàn bộ dữ liệu ngân hàng',
          'Để mặc dữ liệu bị sai lệch'
        ],
        correctOption: 1,
        explanation: 'Các Hệ QTCSDL hiện đại sử dụng cơ chế Transaction và Rollback để đảm bảo tính toàn vẹn khi có sự cố.',
        taxonomyLevel: 'Vận dụng cao',
        difficulty: 'Rất khó',
        topic: 'Xử lý sự cố CSDL'
      }
    ]
  },
  {
    id: 'sample_toanhoc_12',
    title: 'Toán 12 - Ôn tập Hình học & Giải tích THPT (Quy chuẩn GD&ĐT 2025)',
    subject: 'Toán học',
    grade: 'Lớp 12',
    createdAt: new Date().toISOString(),
    matrix: { nhanBiet: 30, thongHieu: 30, vanDung: 30, vanDungCao: 10 },
    rawText: `
Bài ôn tập Toán 12: Hình học không gian (Hình tròn, Hình trụ) và Ứng dụng đạo hàm.
Cho hình trụ tròn xoay có bán kính đáy r = 5 cm và chiều cao h = 10 cm.
Công thức chu vi đáy: C = 2 * pi * r
Công thức diện tích xung quanh: S_xq = 2 * pi * r * h
Công thức diện tích toàn phần: S_tp = 2 * pi * r * (r + h)
Công thức thể tích hình trụ: V = pi * r^2 * h
Quy ước làm tròn toán học: Sử dụng pi = 3.14 khi tính toán số liệu và làm tròn đến 1 hoặc 2 chữ số thập phân theo từng câu hỏi.
`,
    summaryPoints: [
      'Công thức thể tích khối trụ: V = π * r² * h.',
      'Công thức diện tích xung quanh hình trụ: S_xq = 2 * π * r * h.',
      'Quy ước lấy số π = 3.14 trong các bài toán làm tròn số liệu thi THPT.',
      'Dạng câu hỏi GD&ĐT 2025 gồm: Trắc nghiệm 4 lựa chọn, Trắc nghiệm Đúng/Sai (4 ý a,b,c,d) và Trả lời ngắn.'
    ],
    mindmapMermaid: `mindmap
  root((Toán 12 - Hình Trụ))
    Công thức cốt lõi
      S_xq = 2*pi*r*h
      S_tp = 2*pi*r*(r+h)
      V_trụ = pi*r^2*h
    Quy tắc tính toán
      Lấy pi = 3.14
      Làm tròn 2 chữ số thập phân
    Dạng bài thi GD&ĐT
      Trắc nghiệm 4 lựa chọn
      Trắc nghiệm Đúng/Sai (4 ý)
      Trả lời ngắn (Nhập số/Toán)`,
    questions: [
      {
        id: 'q_math12_mc_1',
        question: 'Công thức tính thể tích V của khối trụ có bán kính đáy r và chiều cao h là:',
        options: ['V = 1/3 * π * r² * h', 'V = π * r² * h', 'V = 2 * π * r * h', 'V = 4/3 * π * r³'],
        correctOption: 1,
        explanation: 'Thể tích khối trụ bằng diện tích đáy nhân chiều cao: V = B * h = π * r² * h.',
        taxonomyLevel: 'Nhận biết',
        difficulty: 'Dễ',
        topic: 'Công thức khối trụ'
      },
      {
        id: 'q_math12_tf_1',
        questionType: 'true_false',
        question: 'Cho hình trụ có bán kính đáy r = 5 cm và chiều cao h = 10 cm. Lấy π = 3.14. Xét tính Đúng/Sai của các mệnh đề sau:',
        tfStatements: [
          { id: 'tf_m1', statement: 'a) Chu vi đường tròn đáy bằng 31.4 cm.', isCorrect: true },
          { id: 'tf_m2', statement: 'b) Diện tích xung quanh hình trụ bằng 314 cm².', isCorrect: true },
          { id: 'tf_m3', statement: 'c) Thể tích khối trụ bằng 785 cm³.', isCorrect: true },
          { id: 'tf_m4', statement: 'd) Thể tích khối nón có cùng bán kính r và chiều cao h bằng 300 cm³.', isCorrect: false }
        ],
        explanation: 'a) C = 2*π*r = 2*3.14*5 = 31.4 cm (ĐÚNG). b) S_xq = 2*3.14*5*10 = 314 cm² (ĐÚNG). c) V = 3.14*5²*10 = 785 cm³ (ĐÚNG). d) V_nón = 1/3*V_trụ = 785/3 ≈ 261.67 cm³ ≠ 300 cm³ (SAI).',
        taxonomyLevel: 'Thông hiểu',
        difficulty: 'Trung bình',
        topic: 'Tính toán Hình trụ'
      },
      {
        id: 'q_math12_sa_1',
        questionType: 'short_answer',
        question: 'Tính diện tích toàn phần S_tp (cm²) của hình trụ tròn xoay có bán kính đáy r = 3 cm và chiều cao h = 7 cm. (Lấy π = 3.14 và làm tròn đến 2 chữ số thập phân).',
        shortAnswer: '188.4',
        acceptableAnswers: ['188.4', '188,4', '188.40', '188,40'],
        mathRoundingNote: 'Lấy π = 3.14 | S_tp = 2*π*r*(r + h) = 2*3.14*3*(3+7) = 188.4 cm²',
        roundingDecimals: 2,
        explanation: 'S_tp = 2 * π * r * (r + h) = 2 * 3.14 * 3 * (3 + 7) = 188.4 cm².',
        taxonomyLevel: 'Vận dụng',
        difficulty: 'Khó',
        topic: 'Tính diện tích toàn phần'
      },
      {
        id: 'q_math12_sa_2',
        questionType: 'short_answer',
        question: 'Tìm hoành độ điểm cực đại của hàm số y = -x³ + 3x + 2.',
        shortAnswer: '1',
        acceptableAnswers: ['1', 'x = 1', 'x=1'],
        mathRoundingNote: 'Nhập giá trị x nguyên',
        roundingDecimals: 0,
        explanation: 'y\' = -3x² + 3. y\' = 0 <=> x = 1 hoặc x = -1. Qua x = 1 thì y\' đổi dấu từ dương sang âm nên x = 1 là điểm cực đại.',
        taxonomyLevel: 'Vận dụng cao',
        difficulty: 'Rất khó',
        topic: 'Cực trị hàm số'
      }
    ]
  },
  {
    id: 'sample_lichsu_12',
    title: 'Lịch sử 12 - Cách mạng Khoa học - Công nghệ & Xu thế Toàn cầu hóa',
    subject: 'Lịch sử',
    grade: 'Lớp 12',
    createdAt: new Date().toISOString(),
    matrix: { nhanBiet: 40, thongHieu: 30, vanDung: 20, vanDungCao: 10 },
    rawText: `
Bài 10: Cách mạng Khoa học - Công nghệ và Xu thế Toàn cầu hóa nửa sau thế kỷ XX - Lịch sử 12
1. Cách mạng Khoa học - Công nghệ:
- Nguồn gốc: Do nhu cầu đòi hỏi ngày càng cao của cuộc sống và sản xuất nhằm giải quyết bùng nổ dân số, vơi cạn tài nguyên thiên nhiên.
- Đặc điểm lớn nhất: Khoa học trở thành lực lượng sản xuất trực tiếp. Mọi phát minh kỹ thuật đều bắt nguồn từ nghiên cứu khoa học.
- Thành tựu chính: Máy tính điện tử, Internet, năng lượng mới (nguyên tử, mặt trời), vật liệu mới (polyme, bán dẫn), Công nghệ sinh học (AĐN, nhân bản vô tính), chinh phục vũ trụ.

2. Xu thế Toàn cầu hóa:
- Khái niệm: Là quá trình gia tăng mạnh mẽ những mối liên hệ, sự phụ thuộc lẫn nhau giữa các quốc gia, dân tộc trên thế giới.
- Biểu hiện: Phát triển nhanh chóng của thương mại quốc tế; sự phát triển của các công ty xuyên quốc gia; sự sáp nhập và hợp nhất các công ty; sự ra đời của các tổ chức liên kết kinh tế - tài chính quốc tế (IMF, WB, WTO).
- Cơ hội & Thách thức đối với Việt Nam:
  + Cơ hội: Mở rộng thị trường, thu hút vốn đầu tư, chuyển giao công nghệ.
  + Thách thức: Nguy cơ tụt hậu về kinh tế, cạnh tranh gay gắt, nguy cơ đánh mất bản sắc văn hóa dân tộc.
`,
    summaryPoints: [
      'Nguồn gốc cách mạng KH-CN: Nhu cầu cuộc sống, bùng nổ dân số, cạn kiệt tài nguyên.',
      'Đặc điểm cốt lõi: Khoa học trở thành lực lượng sản xuất trực tiếp.',
      'Toàn cầu hóa là xu thế tất yếu từ đầu những năm 80 của thế kỷ XX.',
      'Biểu hiện toàn cầu hóa: Thương mại phát triển, công ty xuyên quốc gia, tổ chức tài chính (WTO, IMF).',
      'Việt Nam đối mặt cả cơ hội (vốn, công nghệ) và thách thức (tụt hậu, nguy cơ xói mòn văn hóa).'
    ],
    mindmapMermaid: `mindmap
  root((KH-CN & Toàn Cầu Hóa))
    Cách mạng KH-CN
      Nguồn gốc: Nhu cầu & tài nguyên
      Đặc điểm: Khoa học thành lực lượng sản xuất trực tiếp
      Thành tựu: Máy tính, Internet, ADN, Vũ trụ
    Toàn cầu hóa
      Biểu hiện: Thương mại, Công ty đa quốc gia, WTO
      Cơ hội VN: Thu hút vốn, chuyển giao công nghệ
      Thách thức VN: Tụt hậu kinh tế, bảo vệ văn hóa`,
    questions: [
      {
        id: 'q_ls12_1',
        question: 'Đặc điểm lớn nhất của cuộc cách mạng khoa học - công nghệ nửa sau thế kỷ XX là gì?',
        options: [
          'Kỹ thuật đi trước mở đường cho khoa học phát triển',
          'Khoa học trở thành lực lượng sản xuất trực tiếp',
          'Chỉ tập trung vào công nghệ thông tin',
          'Phát minh chủ yếu từ các thợ thủ công lành nghề'
        ],
        correctOption: 1,
        explanation: 'Đặc điểm cốt lõi nhất của cuộc cách mạng KH-CN hiện đại là khoa học trở thành lực lượng sản xuất trực tiếp, nghiên cứu khoa học đi trước mở đường cho kỹ thuật.',
        taxonomyLevel: 'Nhận biết',
        difficulty: 'Dễ',
        topic: 'Đặc điểm KH-CN'
      },
      {
        id: 'q_ls12_2',
        question: 'Tổ chức thương mại thế giới WTO ra đời là biểu hiện của xu thế nào trong quan hệ quốc tế?',
        options: ['Xu thế Chiến tranh lạnh', 'Xu thế Đa cực độc lập', 'Xu thế Toàn cầu hóa', 'Xu thế Bế quan tỏa cảng'],
        correctOption: 2,
        explanation: 'Sự xuất hiện của các tổ chức tài chính - thương mại toàn cầu như WTO, IMF, WB phản ánh rõ nét xu thế Toàn cầu hóa.',
        taxonomyLevel: 'Nhận biết',
        difficulty: 'Dễ',
        topic: 'Toàn cầu hóa'
      },
      {
        id: 'q_ls12_3',
        question: 'Thách thức lớn nhất đối với các nước đang phát triển (trong đó có Việt Nam) trước xu thế toàn cầu hóa là gì?',
        options: [
          'Thiếu hụt nguồn nhân lực lao động phổ thông',
          'Nguy cơ tụt hậu xa hơn về kinh tế và nguy cơ xói mòn bản sắc văn hóa',
          'Không thể tiếp cận được nguồn vốn từ nước ngoài',
          'Bị cô lập hoàn toàn về mặt ngoại giao'
        ],
        correctOption: 1,
        explanation: 'Cạnh tranh gay gắt dễ dẫn tới nguy cơ tụt hậu về kinh tế và sự xâm nhập của văn hóa ngoại lai làm xói mòn bản sắc dân tộc.',
        taxonomyLevel: 'Thông hiểu',
        difficulty: 'Trung bình',
        topic: 'Thách thức Việt Nam'
      },
      {
        id: 'q_ls12_4',
        question: 'Một trong những cơ hội vàng mà xu thế toàn cầu hóa mang lại cho Việt Nam khi thực hiện đường lối Đổi mới là gì?',
        options: [
          'Tranh thủ nguồn vốn đầu tư, công nghệ hiện đại và mở rộng thị trường xuất khẩu',
          'Được viện trợ hoàn toàn không hoàn lại nguồn lương thực',
          'Không cần duy trì hệ thống phòng thủ quốc phòng',
          'Tự động giải quyết triệt để biến đổi khí hậu'
        ],
        correctOption: 0,
        explanation: 'Toàn cầu hóa mở ra cơ hội hội nhập, thu hút FDI, nhận chuyển giao công nghệ tiên tiến từ các nước phát triển.',
        taxonomyLevel: 'Vận dụng',
        difficulty: 'Khó',
        topic: 'Cơ hội phát triển'
      }
    ]
  }
];
