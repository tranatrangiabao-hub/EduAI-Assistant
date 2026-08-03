import { Question, TrueFalseStatement, TaxonomyLevel, DifficultyLevel } from '../types';

/**
 * Normalizes string for short answer comparison.
 * Replaces commas with dots, converts to lowercase, and trims spaces.
 */
export function normalizeAnswerString(str: string = ''): string {
  return str
    .trim()
    .toLowerCase()
    .replace(/,/g, '.')
    .replace(/\s+/g, '');
}

/**
 * Evaluates whether a user's input matches the correct short answer.
 * Handles math rounding, pi = 3.14 rules, comma/dot variations, and numerical tolerance.
 */
export function evaluateShortAnswer(
  userInput: string,
  correctAnswer: string = '',
  acceptableAnswers: string[] = [],
  decimals: number = 2
): boolean {
  if (!userInput || !userInput.trim()) return false;

  const normUser = normalizeAnswerString(userInput);
  const normCorrect = normalizeAnswerString(correctAnswer);

  // Direct normalized match
  if (normUser === normCorrect) return true;

  // Match against acceptable answers list
  for (const acc of acceptableAnswers) {
    if (normUser === normalizeAnswerString(acc)) return true;
  }

  // Numerical evaluation with tolerance
  const numUser = parseFloat(normUser);
  const numCorrect = parseFloat(normCorrect);

  if (!isNaN(numUser) && !isNaN(numCorrect)) {
    // Dynamic tolerance based on requested rounding decimals or default 0.01
    const tolerance = Math.pow(10, -Math.max(1, decimals)) + 0.005;
    if (Math.abs(numUser - numCorrect) <= tolerance) {
      return true;
    }
  }

  return false;
}

/**
 * Evaluates True/False statements for GD&ĐT Part II format.
 * Returns correct count, total count, and GD&ĐT 2025 partial credit score fraction:
 * - 4/4 correct = 1.0 (100% full question weight)
 * - 3/4 correct = 0.5 (50% question weight)
 * - 2/4 correct = 0.25 (25% question weight)
 * - 1/4 correct = 0.10 (10% question weight)
 * - 0/4 correct = 0.0
 */
export function evaluateTrueFalseQuestion(
  statements: TrueFalseStatement[] = [],
  userChoices: Record<string, boolean> = {}
): {
  correctCount: number;
  totalCount: number;
  isFullyAnswered: boolean;
  gddtPointsFraction: number;
} {
  if (!statements || statements.length === 0) {
    return { correctCount: 0, totalCount: 0, isFullyAnswered: false, gddtPointsFraction: 0 };
  }

  let correctCount = 0;
  let answeredCount = 0;

  statements.forEach((st) => {
    if (userChoices[st.id] !== undefined) {
      answeredCount++;
      if (userChoices[st.id] === st.isCorrect) {
        correctCount++;
      }
    }
  });

  const totalCount = statements.length;
  const isFullyAnswered = answeredCount === totalCount;

  let gddtPointsFraction = 0;
  if (correctCount === 4) gddtPointsFraction = 1.0;
  else if (correctCount === 3) gddtPointsFraction = 0.5;
  else if (correctCount === 2) gddtPointsFraction = 0.25;
  else if (correctCount === 1) gddtPointsFraction = 0.1;

  return {
    correctCount,
    totalCount,
    isFullyAnswered,
    gddtPointsFraction,
  };
}

/**
 * Calculates score earned for any given Question and student answers.
 */
export function calculateQuestionEarnedScore(
  q: Question,
  unitWeight: number,
  userAnswers: Record<string, number>,
  userTfAnswers: Record<string, Record<string, boolean>>,
  userShortAnswers: Record<string, string>
): { earned: number; isAnswered: boolean; isFullyCorrect: boolean } {
  const qType = q.questionType || 'multiple_choice';

  if (qType === 'multiple_choice') {
    const sel = userAnswers[q.id];
    const isAnswered = sel !== undefined;
    const isFullyCorrect = isAnswered && sel === q.correctOption;
    return {
      earned: isFullyCorrect ? unitWeight : 0,
      isAnswered,
      isFullyCorrect,
    };
  }

  if (qType === 'true_false') {
    const tfChoiceMap = userTfAnswers[q.id] || {};
    const evalResult = evaluateTrueFalseQuestion(q.tfStatements || [], tfChoiceMap);
    return {
      earned: evalResult.gddtPointsFraction * unitWeight,
      isAnswered: evalResult.isFullyAnswered,
      isFullyCorrect: evalResult.correctCount === evalResult.totalCount && evalResult.totalCount > 0,
    };
  }

  if (qType === 'short_answer') {
    const userVal = userShortAnswers[q.id] || '';
    const isAnswered = userVal.trim().length > 0;
    const isFullyCorrect = evaluateShortAnswer(userVal, q.shortAnswer, q.acceptableAnswers, q.roundingDecimals);
    return {
      earned: isFullyCorrect ? unitWeight : 0,
      isAnswered,
      isFullyCorrect,
    };
  }

  return { earned: 0, isAnswered: false, isFullyCorrect: false };
}

/**
 * Clean topic text by removing hallucinated conversational filler phrases and capping length.
 */
export function cleanTopicText(topic: string = ''): string {
  if (!topic) return '';
  let cleaned = topic.trim();
  cleaned = cleaned.replace(/^Chủ đề:\s*/i, '');
  cleaned = cleaned
    .replace(/(nhé|ok|chuẩn|luôn|bạn nhé|tuyệt đối|đúng nhất|mạch lạc nhất|nhanh gọn|bài bản|hoàn toàn|tốt nhất|phát biểu|đúng chuẩn|tỉ mỉ|chuẩn mực|tối ưu cao nhất|chuẩn bộ giáo dục|chuẩn hóa hoàn toàn tự động|chính xác tuyệt đối)\s*/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (cleaned.length > 50) {
    cleaned = cleaned.substring(0, 47) + '...';
  }
  return cleaned;
}

/**
 * Clean question text from repetitive conversational filler or embedded "Chủ đề:" headers if present.
 */
export function cleanQuestionText(question: string = ''): string {
  if (!question) return '';
  let cleaned = question.trim();

  // Strip hallucinated "Chủ đề: [topic text]" prefix if mistakenly placed inside question body
  cleaned = cleaned.replace(/^Chủ đề:\s*[^:]+?(?=(Cho|Tính|Tìm|Trong|Xác định|Phát biểu|Giải|Biết|Khái niệm|Công thức|Hàm số|Có bao nhiêu|Mệnh đề|Hãy|Giá trị|Tập|Phương trình|Điểm|Mạch|Thiết bị|Đặc điểm|Tổ chức|Thách thức|Một trong|Choose|Select|Which|What|How))/i, '');

  // Strip hallucinated repeating filler chains and adverbs
  cleaned = cleaned
    .replace(/(nhé|bạn nhé|ok|chuẩn nhé|luôn nhé|chuẩn tuyệt đối|đúng nhất|mạch lạc nhất|nhanh gọn|bài bản|tỉ mỉ|chuẩn mực|tối ưu cao nhất|chuẩn bộ giáo dục|chuẩn hóa hoàn toàn tự động|chính xác tuyệt đối)+/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Strip embedded choices A. ... B. ... C. ... D. ... or A) ... B) ... C) ... D) ...
  const hasABCD = /\bA[\.\:\)]\s+/i.test(cleaned) && /\bB[\.\:\)]\s+/i.test(cleaned) && /\bC[\.\:\)]\s+/i.test(cleaned) && /\bD[\.\:\)]\s+/i.test(cleaned);
  if (hasABCD) {
    const embeddedRegex = /[\s:\.\,]*\bA[\.\:\)]\s+(.+?)\s+\bB[\.\:\)]\s+(.+?)\s+\bC[\.\:\)]\s+(.+?)\s+\bD[\.\:\)]\s+(.+)$/i;
    const match = cleaned.match(embeddedRegex);
    if (match) {
      cleaned = cleaned.substring(0, match.index).trim();
    } else {
      const cutIdx = cleaned.search(/[\s:]*\bA[\.\:\)]\s+/i);
      if (cutIdx !== -1) {
        cleaned = cleaned.substring(0, cutIdx).trim();
      }
    }
  }

  return cleaned;
}

export function normalizeTaxonomyLevel(level: any): TaxonomyLevel {
  if (!level) return 'Nhận biết';
  const str = String(level).trim().toUpperCase();
  if (
    str.includes('REMEMBER') ||
    str.includes('KNOW') ||
    str.includes('NHẬN BIẾT') ||
    str.includes('NHAN BIET')
  ) {
    return 'Nhận biết';
  }
  if (
    str.includes('UNDERSTAND') ||
    str.includes('COMPREHEN') ||
    str.includes('THÔNG HIỂU') ||
    str.includes('THONG HIEU')
  ) {
    return 'Thông hiểu';
  }
  if (
    str.includes('APPLY') ||
    str.includes('VẬN DỤNG') ||
    str.includes('VAN DUNG')
  ) {
    if (str.includes('HIGH') || str.includes('CAO') || str.includes('ADVANCED')) {
      return 'Vận dụng cao';
    }
    return 'Vận dụng';
  }
  if (
    str.includes('ANALYZ') ||
    str.includes('EVALUAT') ||
    str.includes('CREAT') ||
    str.includes('CAO')
  ) {
    return 'Vận dụng cao';
  }
  return 'Nhận biết';
}

export function normalizeDifficultyLevel(diff: any): DifficultyLevel {
  if (!diff) return 'Dễ';
  const str = String(diff).trim().toUpperCase();
  if (str.includes('DỄ') || str.includes('DE') || str === 'EASY') return 'Dễ';
  if (str.includes('TRUNG BÌNH') || str.includes('TRUNG BINH') || str === 'MEDIUM' || str === 'AVERAGE') return 'Trung bình';
  if (str.includes('RẤT KHÓ') || str.includes('RAT KHO') || str === 'VERY HARD') return 'Rất khó';
  if (str.includes('KHÓ') || str.includes('KHO') || str === 'HARD') return 'Khó';
  return 'Trung bình';
}

/**
 * Clean options text by stripping leading prefixes like "A. ", "B. ", "C. ", "D. ", "A) ", "1. ", etc.
 */
export function cleanOptionText(text: string = ''): string {
  if (!text) return '';
  return text
    .trim()
    .replace(/^(?:Phương án|Option|Đáp án)?\s*(?:[A-Da-d]\s*[\.\:\)\-]\s*|[1-4]\s*[\:\)\-]\s*|[1-4]\.\s+)/i, '')
    .trim();
}

export function cleanTrueFalseStatementText(text: string = ''): string {
  if (!text) return '';
  let cleaned = String(text).trim();

  // Strip leading prefix like a), b), c), d), A., 1. etc. (without stripping decimal numbers like 1.59)
  cleaned = cleaned.replace(/^(?:[a-dA-D]\s*[\.\:\)\-]\s*|[1-4]\s*[\:\)\-]\s*|[1-4]\.\s+)/, '').trim();

  // Strip trailing answer reveals/hints like:
  // (Đúng/Sai)? - Đúng
  // (Đúng/Sai)? - Sai
  // (Đúng/Sai)
  // - Đúng / - Sai / : Đúng / : Sai / (Đúng) / (Sai)
  cleaned = cleaned
    .replace(/\s*[\(\[\{]?\s*đúng\s*\/\s*sai\s*[\)\]\}]?\s*\??(?:\s*[:\-]\s*(?:đúng|sai|đ|s))?\s*$/i, '')
    .replace(/\s*[:\-]\s*(?:đúng|sai)\s*$/i, '')
    .replace(/\s*[\(\[\{]\s*(?:đúng|sai)\s*[\)\]\}]\s*$/i, '')
    .trim();

  return cleaned;
}

/**
 * Ensures a true_false question is guaranteed to have 4 valid, non-empty True/False statements.
 */
export function sanitizeTrueFalseStatements(q: Question): TrueFalseStatement[] {
  let rawStatements: any[] = [];
  if (Array.isArray(q.tfStatements) && q.tfStatements.length > 0) {
    rawStatements = q.tfStatements;
  } else if (Array.isArray(q.options) && q.options.length > 0) {
    rawStatements = q.options;
  }

  const prefixes = ['a)', 'b)', 'c)', 'd)'];
  const sanitized: TrueFalseStatement[] = [];

  for (let i = 0; i < 4; i++) {
    const item = rawStatements[i];
    let stmtText = '';
    let isCorrect = i % 2 === 0;

    if (item && typeof item === 'object' && ('statement' in item || 'text' in item)) {
      stmtText = String(item.statement || item.text || '').trim();
      if (typeof item.isCorrect === 'boolean') {
        isCorrect = item.isCorrect;
      }
    } else if (typeof item === 'string') {
      stmtText = item.trim();
    }

    // Check if string contains explicit answer suffix before stripping
    if (/\bđúng\s*\/\s*sai\b.*-\s*đúng$/i.test(stmtText) || /[:\-]\s*đúng$/i.test(stmtText)) {
      isCorrect = true;
    } else if (/\bđúng\s*\/\s*sai\b.*-\s*sai$/i.test(stmtText) || /[:\-]\s*sai$/i.test(stmtText)) {
      isCorrect = false;
    }

    // Clean statement text of any leading prefix or trailing answer text
    stmtText = cleanTrueFalseStatementText(stmtText);

    if (!stmtText || stmtText.length < 3) {
      const topicName = cleanTopicText(q.topic || '') || 'nội dung bài học';
      if (i === 0) stmtText = `Dữ kiện và công thức liên quan đến ${topicName} được áp dụng chính xác.`;
      else if (i === 1) stmtText = `Giá trị tính toán hoặc kết luận đưa ra chưa phù hợp với điều kiện thực tế.`;
      else if (i === 2) stmtText = `Đơn vị đo hoặc phạm vi biến số của bài toán được xác định đầy đủ.`;
      else stmtText = `Kết quả tổng hợp đạt giá trị tối ưu theo đúng lý thuyết đã học.`;
      isCorrect = i % 2 === 0;
    }

    if (!/^[a-d]\)/i.test(stmtText)) {
      stmtText = `${prefixes[i]} ${stmtText}`;
    }

    sanitized.push({
      id: item?.id || `tf_${q.id || Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
      statement: stmtText,
      isCorrect: isCorrect,
    });
  }

  return sanitized;
}

/**
 * Sanitizes options for multiple choice questions to ensure 4 valid, non-placeholder options,
 * and sanitizes true_false and short_answer questions.
 */
export function sanitizeQuestionOptions(q: Question): Question {
  const sanitizedTopic = cleanTopicText(q.topic || '');
  const sanitizedQuestionText = cleanQuestionText(q.question || '');
  const normalizedTaxonomy = normalizeTaxonomyLevel(q.taxonomyLevel);
  const normalizedDifficulty = normalizeDifficultyLevel(q.difficulty);

  const qType = q.questionType || (q.tfStatements && q.tfStatements.length > 0 ? 'true_false' : q.shortAnswer ? 'short_answer' : 'multiple_choice');

  if (qType === 'true_false') {
    return {
      ...q,
      question: sanitizedQuestionText,
      topic: sanitizedTopic,
      taxonomyLevel: normalizedTaxonomy,
      difficulty: normalizedDifficulty,
      questionType: 'true_false',
      tfStatements: sanitizeTrueFalseStatements(q),
    };
  }

  if (qType === 'short_answer') {
    let cleanAnswer = String(q.shortAnswer || q.acceptableAnswers?.[0] || '').trim();
    if (!cleanAnswer) {
      if (q.explanation) {
        cleanAnswer = q.explanation.split('.')[0].trim();
      } else {
        cleanAnswer = 'Đáp số đúng';
      }
    }
    return {
      ...q,
      question: sanitizedQuestionText,
      topic: sanitizedTopic,
      taxonomyLevel: normalizedTaxonomy,
      difficulty: normalizedDifficulty,
      questionType: 'short_answer',
      shortAnswer: cleanAnswer,
      acceptableAnswers: q.acceptableAnswers || [cleanAnswer],
    };
  }

  let rawOptions: string[] = Array.isArray(q.options)
    ? q.options.map((o) => cleanOptionText(String(o || '')))
    : [];

  // Check if original question had embedded choices A. ... B. ... C. ... D. ...
  const rawQStr = String(q.question || '');
  const hasABCD = /\bA[\.\:\)]\s+/i.test(rawQStr) && /\bB[\.\:\)]\s+/i.test(rawQStr) && /\bC[\.\:\)]\s+/i.test(rawQStr) && /\bD[\.\:\)]\s+/i.test(rawQStr);
  if (hasABCD) {
    const embeddedRegex = /[\s:\.\,]*\bA[\.\:\)]\s+(.+?)\s+\bB[\.\:\)]\s+(.+?)\s+\bC[\.\:\)]\s+(.+?)\s+\bD[\.\:\)]\s+(.+)$/i;
    const match = rawQStr.match(embeddedRegex);
    if (match) {
      const extracted = [match[1].trim(), match[2].trim(), match[3].trim(), match[4].trim()].map(cleanOptionText);
      if (rawOptions.length < 4 || rawOptions.some(o => !o || /^(option|phương án)\s*[a-d1-4]?$/i.test(o))) {
        rawOptions = extracted;
      }
    }
  }

  const isPlaceholder = (opt: string) => {
    if (!opt || typeof opt !== 'string') return true;
    const lower = opt.toLowerCase().trim();
    if (lower.length === 0) return true;
    if (/^[a-d1-4][\.\:\)\-]?$/i.test(lower)) return true;
    if (/^(option|phương án|đáp án)\s*[a-d1-4]?[\.\:\)\-]?$/i.test(lower)) return true;
    if (
      lower.includes('phương án không chính xác') ||
      lower.includes('ý nhiễu') ||
      lower.includes('đặc điểm tùy chỉnh') ||
      lower.includes('thao tác ngược lại') ||
      lower.includes('nội dung mở rộng không thuộc') ||
      lower.includes('không áp dụng đối với') ||
      lower.includes('bài đọc tham khảo không bắt buộc') ||
      lower.includes('yêu cầu thiết lập bổ sung') ||
      lower.includes('hoàn toàn phủ nhận nội dung') ||
      lower.includes('phương án không phù hợp') ||
      lower.includes('lựa chọn bổ sung') ||
      lower.includes('trường hợp ngoại lệ')
    ) {
      return true;
    }
    return false;
  };

  const qText = sanitizedQuestionText.toLowerCase();

  // 1. Math domain fixes for tanx / cotx
  if (
    qText.includes('y = tanx') ||
    qText.includes('y = tan(x)') ||
    (qText.includes('tanx') && qText.includes('tập xác định'))
  ) {
    return {
      ...q,
      question: sanitizedQuestionText,
      topic: sanitizedTopic || 'Hàm số lượng giác cơ bản',
      questionType: 'multiple_choice',
      options: [
        'D = ℝ \\ {π/2 + kπ, k ∈ ℤ}',
        'D = ℝ \\ {kπ, k ∈ ℤ}',
        'D = ℝ',
        'D = [-1; 1]',
      ],
      correctOption:
        typeof q.correctOption === 'number' && q.correctOption >= 0 && q.correctOption <= 3
          ? q.correctOption
          : 0,
    };
  }

  if (
    qText.includes('y = cotx') ||
    qText.includes('y = cot(x)') ||
    (qText.includes('cotx') && qText.includes('tập xác định'))
  ) {
    return {
      ...q,
      question: sanitizedQuestionText,
      topic: sanitizedTopic || 'Hàm số lượng giác cơ bản',
      questionType: 'multiple_choice',
      options: [
        'D = ℝ \\ {kπ, k ∈ ℤ}',
        'D = ℝ \\ {π/2 + kπ, k ∈ ℤ}',
        'D = ℝ',
        'D = [-1; 1]',
      ],
      correctOption:
        typeof q.correctOption === 'number' && q.correctOption >= 0 && q.correctOption <= 3
          ? q.correctOption
          : 0,
    };
  }

  // 2. Format single letter outputs for code/python questions
  if (
    rawOptions.length === 4 &&
    rawOptions.filter((o) => o.length === 1 && /^[A-Za-z0-9]$/.test(o)).length >= 2
  ) {
    rawOptions = rawOptions.map((opt) => {
      if (opt.length === 1 && /^[A-Za-z0-9]$/.test(opt)) {
        return `'${opt}'`;
      }
      return opt;
    });
  }

  // Preserve valid AI generated options, pad or construct fallbacks if missing
  let validOptions = rawOptions.filter((o) => !isPlaceholder(o));

  const qContextStr = (sanitizedQuestionText + ' ' + (sanitizedTopic || '')).toLowerCase();
  const isMath = /toán|hàm số|tập xác định|tiệm cận|đồ thị|đạo hàm|tích phân|nguyên hàm|phương trình|bất phương trình|cực trị|logarit|thể tích|diện tích|khối|tọa độ|vectơ/i.test(qContextStr);
  const isTech = /công nghệ|bản vẽ|nét vẽ|hình chiếu|động cơ|van|xupap|gia công|cắt gọt|tiện|phay|mạch điện|linh kiện|tụ điện/i.test(qContextStr);
  const isChem = /hóa|phản ứng|dung dịch|kết tủa|axit|bazơ/i.test(qContextStr);
  const isBio = /sinh|tế bào|adn|arn|gen|quang hợp/i.test(qContextStr);

  if (validOptions.length === 4) {
    rawOptions = validOptions;
  } else if (validOptions.length > 0) {
    let padList: string[] = [];
    if (isMath) {
      padList = ['Giá trị bằng 0', 'Giá trị bằng 1', 'Không tồn tại giá trị thỏa mãn', 'Tập nghiệm S = ℝ', 'D = ℝ'];
    } else if (isTech) {
      if (qContextStr.includes('nét vẽ') || qContextStr.includes('đường tâm')) {
        padList = ['Nét gạch chấm mảnh', 'Nét liền đậm', 'Nét liền mảnh', 'Nét đứt mảnh'];
      } else if (qContextStr.includes('hình chiếu') || qContextStr.includes('hướng chiếu')) {
        padList = ['Từ trước tới (Hình chiếu đứng)', 'Từ trên xuống (Hình chiếu bằng)', 'Từ trái sang (Hình chiếu cạnh)', 'Từ phải sang'];
      } else if (qContextStr.includes('gia công') || qContextStr.includes('cắt gọt')) {
        padList = ['Gia công tiện, phay, bào, khoan', 'Gia công đúc kim loại trong khuôn', 'Gia công rèn và dập nóng', 'Gia công hàn điện'];
      } else {
        padList = ['Kỳ nén và kỳ cháy-dãn nở', 'Kỳ nạp và kỳ thải', 'Chỉ ở kỳ nạp', 'Chỉ ở kỳ thải'];
      }
    } else if (isChem) {
      padList = ['Xuất hiện kết tủa màu trắng', 'Có sủi bọt khí không màu thoát ra', 'Dung dịch chuyển sang màu xanh lam', 'Không xảy ra phản ứng'];
    } else if (isBio) {
      padList = ['Xảy ra trong nhân tế bào', 'Đột biến gen điểm', 'Tăng tính đa dạng di truyền', 'Quá trình phiên mã mARN'];
    } else {
      padList = [
        'Quy trình thực hiện theo thứ tự ưu tiên chuẩn',
        'Tiêu chí đánh giá dựa trên thang đo kỹ thuật',
        'Phương án có tính chất kết hợp đa mục tiêu',
        'Đặc điểm nhận biết qua phân tích mô hình'
      ];
    }

    while (validOptions.length < 4) {
      const nextPad = padList.find((d) => !validOptions.includes(d)) || `Phương án phân tích ${validOptions.length + 1}`;
      validOptions.push(nextPad);
    }
    rawOptions = validOptions.slice(0, 4);
  } else {
    const explanation = q.explanation || '';
    const mainAns = explanation.length > 5 ? explanation.split('.')[0].trim() : '';
    const topicStr = sanitizedTopic || 'kiến thức bài học';
    if (isMath) {
      rawOptions = [
        mainAns.length > 0 ? mainAns : `Kết quả chính xác về ${topicStr}`,
        'Giá trị bằng 0',
        'Không tồn tại giá trị thỏa mãn',
        'Tập nghiệm S = Ø',
      ];
    } else if (isTech) {
      rawOptions = [
        mainAns.length > 0 ? mainAns : `Nội dung chính xác về ${topicStr}`,
        'Thực hiện theo quy chuẩn kỹ thuật ban đầu',
        'Phân tích dựa trên các thông số định mức',
        'Điều kiện vận hành trong phạm vi tiêu chuẩn'
      ];
    } else {
      rawOptions = [
        mainAns.length > 0 ? mainAns : `Đáp án chính xác về ${topicStr}`,
        'Thực hiện theo quy trình phân tích chuẩn',
        'Đặc điểm nhận biết qua thực nghiệm thực tế',
        'Yếu tố tác động trong điều kiện tiêu chuẩn'
      ];
    }
  }

  const initialCorrectIdx =
    typeof q.correctOption === 'number' && q.correctOption >= 0 && q.correctOption <= 3
      ? q.correctOption
      : 0;

  const candidateQ = {
    ...q,
    question: sanitizedQuestionText,
    topic: sanitizedTopic,
    taxonomyLevel: normalizedTaxonomy,
    difficulty: normalizedDifficulty,
    questionType: 'multiple_choice' as const,
    options: rawOptions as [string, string, string, string],
    correctOption: initialCorrectIdx,
  };

  candidateQ.correctOption = alignCorrectOptionWithExplanation(candidateQ);
  return candidateQ;
}

/**
 * Helper to normalize string by stripping accents and special characters.
 */
function normalizeText(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[.,?!:;'"\(\)\[\]\{\}\\/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Helper to extract explicit answer letter (A, B, C, D) from explanation text.
 */
function extractExplicitLetter(exp: string, normExp: string): number | null {
  if (!exp && !normExp) return null;
  const mapIdx: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };

  // 1. Try matching on normalized unaccented string
  const mNorm = normExp.match(/(?:dap an|chon|phuong an|cau|ket qua)\s*(?:dung|chinh xac)?\s*(?:la)?\s*:?\s*([a-d])\b/i);
  if (mNorm && mapIdx[mNorm[1].toUpperCase()] !== undefined) {
    return mapIdx[mNorm[1].toUpperCase()];
  }

  // 2. Try matching with diacritics on original string
  const mOrig = exp.match(/(?:dap an|đáp án|dáp án|chon|chọn|phuong an|phương án|cau|câu|ket qua|kết quả)\s*(?:dung|đúng|chinh xac|chính xác)?\s*(?:la|là)?\s*:?\s*([A-Da-d])\b/i);
  if (mOrig && mapIdx[mOrig[1].toUpperCase()] !== undefined) {
    return mapIdx[mOrig[1].toUpperCase()];
  }

  // 3. Match standalone letter at beginning of explanation e.g. "C. ...", "C: ...", "C - ..."
  const mStart = exp.match(/^\s*([A-D])\s*[\.\:\-\)\s]/i);
  if (mStart && mapIdx[mStart[1].toUpperCase()] !== undefined) {
    return mapIdx[mStart[1].toUpperCase()];
  }

  return null;
}

/**
 * Ensures that the correctOption index strictly matches the answer stated in explanation or correctOptionText.
 */
export function alignCorrectOptionWithExplanation(q: any): number {
  if (!q || q.questionType !== 'multiple_choice' || !Array.isArray(q.options) || q.options.length !== 4) {
    return typeof q?.correctOption === 'number' && q.correctOption >= 0 && q.correctOption <= 3 ? q.correctOption : 0;
  }

  const origIdx = typeof q.correctOption === 'number' && q.correctOption >= 0 && q.correctOption <= 3 ? q.correctOption : 0;
  const explanation = String(q.explanation || '').trim();
  const correctText = String(q.correctOptionText || '').trim();

  const cleanOpts = q.options.map((o: any) =>
    String(o || '')
      .replace(/^(?:Phương án|Option|Đáp án)?\s*(?:[A-Da-d]\s*[\.\:\)\-]\s*|[1-4]\s*[\:\)\-]\s*|[1-4]\.\s+)/i, '')
      .replace(/^['"]+|['"]+$/g, '')
      .trim()
  );

  q.options = cleanOpts;

  const norm = (str: string) =>
    str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[.,?!:;'"\(\)\[\]\{\}\\/]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const normExp = norm(explanation);
  const normCorrText = norm(correctText.replace(/^['"]+|['"]+$/g, ''));

  // Priority 1: Explicit letter declaration in explanation (e.g. "Đáp án đúng là A", "Đáp án C", "Chọn C", "Phương án C")
  const explicitIdx = extractExplicitLetter(explanation, normExp);
  if (explicitIdx !== null) {
    q.correctOption = explicitIdx;
    if (cleanOpts[explicitIdx]) {
      q.correctOptionText = cleanOpts[explicitIdx];
    }
    return explicitIdx;
  }

  // Priority 2: Match options against explanation text (Check which option is mentioned / confirmed in explanation)
  if (normExp.length > 0) {
    const scores = cleanOpts.map((opt, idx) => {
      const normOpt = norm(opt);
      if (!normOpt) return -1000;

      let score = 0;

      // Negation check
      const isNegated =
        new RegExp(`${normOpt}\\s*(?:bang|=)?\\s*(?:0|zero|triet tieu|null|khong|sai|khong phai)`, 'i').test(normExp) ||
        new RegExp(`(?:khong phai|khong phu thuoc|loai|tru|ngoai)\\s*${normOpt}`, 'i').test(normExp);

      // Confirmation check
      const isConfirmed = new RegExp(`${normOpt}\\s*(?:dat|cuc dai|lon nhat|chinh xac|bang [^0]|va|la)`, 'i').test(normExp);

      if (isNegated) {
        score -= 300;
      }

      if (isConfirmed) {
        score += 200;
      }

      const rawOpt = String(opt).trim();
      const isNumericOrShort = /^[0-9.,\-+]+$/.test(rawOpt) || rawOpt.length <= 2;

      if (isNumericOrShort) {
        // Standalone number matching (prevents '1' matching inside '0,01' or '10^-2' or '12')
        const escaped = rawOpt.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const standaloneRegex = new RegExp(`(?:^|\\b|=|:\\s*|la\\s*|ph\\s*=\\s*|ra\\s*|phuong an\\s*|dap an\\s*)\\s*${escaped}(?:$|\\b|\\s|\\.|,)`, 'i');
        if (standaloneRegex.test(explanation) || standaloneRegex.test(normExp)) {
          if (!isNegated) {
            score += 180 + rawOpt.length * 3;
          }
        }
      } else {
        // String match in explanation
        if (normExp.includes(normOpt) && normOpt.length >= 3) {
          if (!isNegated) {
            score += 100 + normOpt.length * 2;
          }
        }

        // Exact raw formula match in raw explanation (e.g., H2SO4, NaOH, [-1, 1], D = R \ {kpi}, tanx)
        if (rawOpt.length >= 3 && explanation.includes(rawOpt)) {
          if (!isNegated) {
            score += 150 + rawOpt.length * 3;
          }
        }
      }

      // Word/Token overlap
      const words = normOpt.split(' ').filter(w => w.length > 1 && !['la', 'trong', 'cua', 'va', 'duoc', 'co', 'cho', 'voi', 'khi', 'theo', 'nhu', 'bang'].includes(w));
      if (words.length > 0 && !isNegated) {
        let matchedCount = 0;
        for (const w of words) {
          if (normExp.includes(w)) matchedCount++;
        }
        score += (matchedCount / words.length) * 60;
      }

      return score;
    });

    let maxScore = -9999;
    let bestIdx = origIdx;

    for (let i = 0; i < scores.length; i++) {
      if (scores[i] > maxScore) {
        maxScore = scores[i];
        bestIdx = i;
      }
    }

    if (maxScore > 20 && bestIdx !== origIdx) {
      q.correctOption = bestIdx;
      if (cleanOpts[bestIdx]) q.correctOptionText = cleanOpts[bestIdx];
      return bestIdx;
    }
  }

  // Priority 3: Direct match with correctOptionText if valid
  if (normCorrText.length > 0) {
    const directIdx = cleanOpts.findIndex((opt) => norm(opt) === normCorrText);
    if (directIdx !== -1) {
      q.correctOption = directIdx;
      q.correctOptionText = cleanOpts[directIdx];
      return directIdx;
    }
  }

  // Priority 4: Fallback to original index
  q.correctOption = origIdx;
  if (cleanOpts[origIdx]) q.correctOptionText = cleanOpts[origIdx];
  return origIdx;
}

/**
 * Validates whether a generated question has complete, non-contradictory, scientifically consistent options and explanation.
 * If explanation contradicts the selected option or contains dummy placeholders, returns isValid: false so the question can be discarded and replaced.
 */
export function validateQuestionConsistency(q: any): { isValid: boolean; reason?: string } {
  if (!q || typeof q !== 'object') {
    return { isValid: false, reason: 'Dữ liệu câu hỏi không hợp lệ' };
  }

  const qText = String(q.question || '').trim();
  if (qText.length < 5) {
    return { isValid: false, reason: 'Nội dung câu hỏi quá ngắn' };
  }

  if (q.questionType === 'multiple_choice' || !q.questionType) {
    if (!Array.isArray(q.options) || q.options.length !== 4) {
      return { isValid: false, reason: 'Số lượng phương án không đúng 4' };
    }

    const cleanOpts = q.options.map((o: any) =>
      String(o || '')
        .replace(/^(?:Phương án|Option|Đáp án)?\s*(?:[A-Da-d]\s*[\.\:\)\-]\s*|[1-4]\s*[\:\)\-]\s*|[1-4]\.\s+)/i, '')
        .replace(/^['"]+|['"]+$/g, '')
        .trim()
    );

    q.options = cleanOpts;

    // Placeholder check
    const dummyPattern = /^(?:Phương án|Option|Đáp án|Chưa có|Lựa chọn)\s*[A-D1-4]?$/i;
    for (const opt of cleanOpts) {
      if (!opt || dummyPattern.test(opt)) {
        return { isValid: false, reason: 'Chứa phương án giữ chỗ hoặc rỗng' };
      }
    }

    // Option uniqueness check
    const normOpts = cleanOpts.map((o) => o.toLowerCase());
    if (new Set(normOpts).size < 4) {
      return { isValid: false, reason: 'Các phương án lựa chọn bị trùng lặp' };
    }

    // Ensure correct option is aligned first
    const alignedIdx = alignCorrectOptionWithExplanation(q);
    q.correctOption = alignedIdx;
    q.correctOptionText = cleanOpts[alignedIdx];

    const exp = String(q.explanation || '').trim();
    const chosenOptText = cleanOpts[alignedIdx];

    // Contradiction Check 1: Explicit letter in explanation (e.g., "Đáp án đúng là A")
    const normExpVal = normalizeText(exp);
    const explicitIdxVal = extractExplicitLetter(exp, normExpVal);
    if (explicitIdxVal !== null && explicitIdxVal !== alignedIdx) {
      const letter = String.fromCharCode(65 + explicitIdxVal);
      return {
        isValid: false,
        reason: `Lời giải ghi chọn đáp án ${letter} (${cleanOpts[explicitIdxVal] || ''}) nhưng đáp án gán vào ${String.fromCharCode(65 + alignedIdx)} (${chosenOptText})`
      };
    }

    // Contradiction Check 2: pH Science Calculation Verification
    const normQ = qText.toLowerCase();
    const normChosen = chosenOptText.toLowerCase().trim();

    if (normQ.includes('ph') && (normQ.includes('hcl 0,01') || normQ.includes('hcl 0.01') || normQ.includes('hcl 10^-2'))) {
      if (normChosen !== '2' && normChosen !== '2,0' && normChosen !== '2.0' && !normChosen.includes('ph = 2')) {
        return { isValid: false, reason: `Tính pH sai: HCl 0.01M có pH = 2 nhưng phương án gán là "${chosenOptText}"` };
      }
    }

    if (normQ.includes('ph') && (normQ.includes('hcl 0,1') || normQ.includes('hcl 0.1') || normQ.includes('hcl 10^-1'))) {
      if (normChosen !== '1' && normChosen !== '1,0' && normChosen !== '1.0' && !normChosen.includes('ph = 1')) {
        return { isValid: false, reason: `Tính pH sai: HCl 0.1M có pH = 1 nhưng phương án gán là "${chosenOptText}"` };
      }
    }

    if (normQ.includes('ph') && (normQ.includes('naoh 0,1') || normQ.includes('naoh 0.1') || normQ.includes('naoh 10^-1'))) {
      if (normChosen !== '13' && !normChosen.includes('ph = 13')) {
        return { isValid: false, reason: `Tính pH sai: NaOH 0.1M có pH = 13 nhưng phương án gán là "${chosenOptText}"` };
      }
    }

    // Contradiction Check 3: Semantic acid/base or domain contradiction
    const normExp = exp.toLowerCase();

    if ((normExp.includes('quy tim hoa do') || normExp.includes('dung dich acid')) && (normChosen.includes('naoh') || normChosen.includes('nh3') || normChosen.includes('base'))) {
      return { isValid: false, reason: 'Lời giải khẳng định acid làm quỳ tím hóa đỏ nhưng đáp án gán vào dung dịch base' };
    }

    if ((normExp.includes('nh3 nhan proton') || normExp.includes('tinh base')) && normChosen.includes('acid')) {
      return { isValid: false, reason: 'Lời giải khẳng định NH3 có tính base nhưng đáp án lại gán NH3 là acid' };
    }
  }

  if (q.questionType === 'true_false') {
    if (!Array.isArray(q.tfStatements) || q.tfStatements.length !== 4) {
      return { isValid: false, reason: 'Số lượng phát biểu Đúng/Sai không đúng 4' };
    }
  }

  if (q.questionType === 'short_answer') {
    if (!q.shortAnswer || String(q.shortAnswer).trim().length === 0) {
      return { isValid: false, reason: 'Đáp án câu hỏi ngắn không được để rỗng' };
    }
  }

  return { isValid: true };
}



