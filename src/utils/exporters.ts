import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Question } from '../types';
import { sanitizeTrueFalseStatements, cleanQuestionText } from './questionEvaluator';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  AlignmentType,
  WidthType,
  BorderStyle,
  PageBreak
} from 'docx';

/**
 * Export questions formatted for Wordwall import
 * Wordwall Standard CSV: Question, Correct Answer, Incorrect Answer 1, Incorrect Answer 2, Incorrect Answer 3
 * Or Question, Answer 1, Answer 2, Answer 3, Answer 4, Correct Answer Number
 */
export function exportWordwallCSV(questions: Question[], filename = 'Wordwall_Quiz_EduAI.csv') {
  const rows = questions.map((q) => {
    const correctAnswerText = q.options[q.correctOption];
    const incorrectOptions = q.options.filter((_, idx) => idx !== q.correctOption);

    return {
      'Question': cleanQuestionText(q.question),
      'Correct Answer': correctAnswerText,
      'Option 2': incorrectOptions[0] || '',
      'Option 3': incorrectOptions[1] || '',
      'Option 4': incorrectOptions[2] || '',
    };
  });

  const csvContent = Papa.unparse(rows);
  downloadBlob(csvContent, filename, 'text/csv;charset=utf-8;');
}

/**
 * Export questions formatted for Quizizz Excel import (.xlsx)
 */
export function exportQuizizzXLSX(questions: Question[], filename = 'Quizizz_EduAI.xlsx') {
  const rows = questions.map((q, index) => {
    return {
      'Question Text': cleanQuestionText(q.question),
      'Question Type': 'Multiple Choice',
      'Option 1': q.options[0],
      'Option 2': q.options[1],
      'Option 3': q.options[2],
      'Option 4': q.options[3],
      'Correct Answer': q.correctOption + 1, // 1, 2, 3, 4
      'Time in seconds': 30,
      'Explanation': q.explanation,
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Quizizz Import');

  XLSX.writeFile(workbook, filename);
}

/**
 * Export Anki Flashcards TSV file for Spaced Repetition import
 * Format: Front \t Back \t Tags
 */
export function exportAnkiTSV(questions: Question[], topicName = 'THPT_Exam', filename = 'Anki_Flashcards_EduAI.txt') {
  let content = `#separator:tab\n#html:true\n#tags column:3\n`;

  questions.forEach((q) => {
    const optionsHtml = q.options
      .map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`)
      .join('<br>');

    const front = `<b>${cleanQuestionText(q.question)}</b><br><br><div style="text-align:left; color:#334155;">${optionsHtml}</div>`;
    const back = `<div style="color:#059669; font-weight:bold; font-size:1.1em;">Đáp án đúng: ${String.fromCharCode(65 + q.correctOption)}. ${q.options[q.correctOption]}</div><hr><div style="font-size:0.9em; color:#475569;"><b>Giải thích:</b> ${q.explanation}</div><br><span style="background:#e0f2fe; color:#0369a1; padding:2px 6px; border-radius:4px; font-size:0.8em;">[${q.taxonomyLevel}]</span>`;
    const tag = `EduAI_${topicName.replace(/\s+/g, '_')}_${q.taxonomyLevel.replace(/\s+/g, '_')}`;

    content += `${front.replace(/\t/g, ' ')}\t${back.replace(/\t/g, ' ')}\t${tag}\n`;
  });

  downloadBlob(content, filename, 'text/plain;charset=utf-8;');
}

/**
 * Generates standalone printable A4 HTML for paper exam
 */
export function generateExamPaperHTML(
  title: string,
  questions: Question[],
  subject = 'Môn học',
  examModeConfig?: any,
  autoPrintOnLoad = true
): string {
  const dept = examModeConfig?.departmentName || 'SỞ GIÁO DỤC VÀ ĐÀO TẠO';
  const school = examModeConfig?.schoolName || 'TRƯỜNG THPT CHUYÊN';
  const examTitleText = examModeConfig?.examTitle || title.toUpperCase();
  const duration = examModeConfig?.durationMinutes || 45;
  const examCode = examModeConfig?.examCode || '101';

  const questionsHtml = questions
    .map((q, idx) => {
      const qType = q.questionType || 'multiple_choice';

      if (qType === 'true_false') {
        const stmts = sanitizeTrueFalseStatements(q);
        return `
    <div class="question-block">
      <div class="question-title">
        <strong>Câu ${idx + 1} (${q.taxonomyLevel} - Đúng/Sai):</strong> ${cleanQuestionText(q.question)}
      </div>
      <div class="tf-container">
        ${stmts
          .map(
            (stmt) => `
          <div class="tf-item">
            <span class="tf-label">${stmt.statement}</span>
            <span class="tf-box">[ Đúng ] / [ Sai ]</span>
          </div>
        `
          )
          .join('')}
      </div>
    </div>
        `;
      }

      if (qType === 'short_answer') {
        return `
    <div class="question-block">
      <div class="question-title">
        <strong>Câu ${idx + 1} (${q.taxonomyLevel} - Trả lời ngắn):</strong> ${cleanQuestionText(q.question)}
      </div>
      <div class="short-answer-box">
        Đáp số / Kết quả: .............................................................................................................
        ${q.mathRoundingNote ? `<br><small style="color:#64748b;">(${q.mathRoundingNote})</small>` : ''}
      </div>
    </div>
        `;
      }

      // Default: multiple_choice
      return `
    <div class="question-block">
      <div class="question-title">
        <strong>Câu ${idx + 1} (${q.taxonomyLevel}):</strong> ${cleanQuestionText(q.question)}
      </div>
      <div class="options-grid">
        ${q.options
          .map(
            (opt, i) => `
          <div class="option-item">
            <span class="option-prefix">${String.fromCharCode(65 + i)}.</span> ${opt}
          </div>
        `
          )
          .join('')}
      </div>
    </div>
      `;
    })
    .join('');

  const answerKeyHtml = questions
    .map((q, idx) => {
      const qType = q.questionType || 'multiple_choice';
      let answerText = '';

      if (qType === 'true_false') {
        const stmts = sanitizeTrueFalseStatements(q);
        answerText = stmts
          .map((st) => `${st.statement.substring(0, 2)}: ${st.isCorrect ? 'Đ' : 'S'}`)
          .join(' | ');
      } else if (qType === 'short_answer') {
        answerText = q.shortAnswer || (q.acceptableAnswers ? q.acceptableAnswers.join(' / ') : '');
      } else {
        answerText = String.fromCharCode(65 + q.correctOption);
      }

      return `
    <tr>
      <td>${idx + 1}</td>
      <td style="font-weight:bold; color:#059669;">${answerText}</td>
      <td>${q.taxonomyLevel}</td>
      <td style="font-size: 11px;">${q.explanation}</td>
    </tr>
  `;
    })
    .join('');

  return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <title>ĐỀ THI GIẤY KHỔ A4 CHUẨN GD&ĐT - ${examTitleText}</title>
      <style>
        @page { size: A4 portrait; margin: 15mm; }
        @media print {
          @page { size: A4 portrait; margin: 15mm; }
          .no-print { display: none !important; }
          body { padding: 0 !important; margin: 0 !important; width: 100% !important; max-width: none !important; box-shadow: none !important; }
        }
        * { box-sizing: border-box; }
        body { font-family: 'Times New Roman', serif; padding: 20px; color: #1e293b; line-height: 1.5; background: #fff; max-width: 210mm; margin: 0 auto; }
        .no-print { display: flex; gap: 10px; margin-bottom: 20px; padding: 12px 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; font-family: system-ui, -apple-system, sans-serif; font-size: 13px; justify-content: space-between; align-items: center; }
        .btn-print { background: #2563eb; color: #fff; font-weight: bold; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; }
        .btn-print:hover { background: #1d4ed8; }
        .header-table { width: 100%; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
        .header-left { text-align: center; width: 45%; font-weight: bold; font-size: 13px; text-transform: uppercase; }
        .header-right { text-align: center; width: 55%; font-weight: bold; font-size: 13px; }
        .title { text-align: center; font-size: 18px; font-weight: bold; margin: 15px 0 5px 0; text-transform: uppercase; }
        .subtitle { text-align: center; font-size: 13px; font-style: italic; margin-bottom: 20px; }
        .student-info { margin-bottom: 20px; font-style: italic; border: 1px solid #94a3b8; padding: 10px; border-radius: 4px; display: flex; justify-content: space-between; font-size: 13px; }
        .question-block { margin-bottom: 16px; page-break-inside: avoid; }
        .question-title { font-size: 14px; margin-bottom: 6px; text-align: justify; }
        .options-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-left: 15px; font-size: 13.5px; }
        .tf-container { margin-left: 15px; font-size: 13.5px; }
        .tf-item { display: flex; justify-content: space-between; padding: 3px 0; border-bottom: 1px dotted #e2e8f0; }
        .tf-box { font-weight: bold; font-size: 12px; color: #475569; }
        .short-answer-box { margin-left: 15px; font-size: 13.5px; padding: 6px 0; }
        .page-break { page-break-before: always; }
        table.answer-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        table.answer-table th, table.answer-table td { border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 12px; text-align: left; }
        table.answer-table th { background-color: #f1f5f9; }
      </style>
    </head>
    <body>
      <div class="no-print">
        <span>📄 <strong>Đề thi giấy A4 chuẩn GD&ĐT</strong> - Sẵn sàng in ấn hoặc Lưu dạng PDF Khổ A4</span>
        <button onclick="window.print()" class="btn-print">🖨️ In / Lưu PDF Khổ A4 Ngay</button>
      </div>

      <table class="header-table">
        <tr>
          <td class="header-left">
            ${dept.toUpperCase()}<br>
            ${school.toUpperCase()}<br>
            --------------------
          </td>
          <td class="header-right">
            MÔN: ${subject.toUpperCase()}<br>
            MÃ ĐỀ THI: ${examCode}<br>
            Thời gian làm bài: ${duration} phút
          </td>
        </tr>
      </table>

      <div class="title">${examTitleText}</div>
      <div class="subtitle">(Đề thi gồm ${questions.length} câu hỏi. Thí sinh làm bài trực tiếp vào đề thi)</div>

      <div class="student-info">
        <span>Họ và tên thí sinh: ................................................................................</span>
        <span>Lớp: ...............</span>
        <span>SBD: .................</span>
      </div>

      <div class="questions-container">
        ${questionsHtml}
      </div>

      <div class="page-break"></div>

      <div class="title" style="color: #059669;">ĐÁP ÁN VÀ HƯỚNG DẪN GIẢI CHI TIẾT (HƯỚNG DẪN CHẤM)</div>
      <table class="answer-table">
        <thead>
          <tr>
            <th style="width: 40px;">Câu</th>
            <th style="width: 140px;">Đáp án / Kết quả</th>
            <th style="width: 110px;">Mức độ GD&ĐT</th>
            <th>Hướng dẫn giải chi tiết</th>
          </tr>
        </thead>
        <tbody>
          ${answerKeyHtml}
        </tbody>
      </table>

      ${autoPrintOnLoad ? `<script>window.onload = function() { window.print(); }</script>` : ''}
    </body>
    </html>
  `;
}

/**
 * Triggers browser print view for printable paper test sheet
 */
export function printExamPaper(
  title: string,
  questions: Question[],
  subject = 'Môn học',
  examModeConfig?: any
) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const htmlContent = generateExamPaperHTML(title, questions, subject, examModeConfig, true);
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}

/**
 * Downloads the paper exam directly in Microsoft Word (.docx) format formatted for A4 paper
 */
export async function downloadExamPaperDOCX(
  title: string,
  questions: Question[],
  subject = 'Môn học',
  examModeConfig?: any
) {
  const dept = examModeConfig?.departmentName || 'SỞ GIÁO DỤC VÀ ĐÀO TẠO';
  const school = examModeConfig?.schoolName || 'TRƯỜNG THPT CHUYÊN';
  const examTitleText = examModeConfig?.examTitle || title.toUpperCase();
  const duration = examModeConfig?.durationMinutes || 45;
  const examCode = examModeConfig?.examCode || '101';

  const children: (Paragraph | Table)[] = [];

  // Header Table (2 columns)
  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.SINGLE, size: 12, color: "000000" },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.NONE },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: dept.toUpperCase(), bold: true, size: 22, font: 'Times New Roman' })],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: school.toUpperCase(), bold: true, size: 22, font: 'Times New Roman' })],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: '--------------------', size: 20, font: 'Times New Roman' })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: `MÔN: ${subject.toUpperCase()}`, bold: true, size: 22, font: 'Times New Roman' })],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: `MÃ ĐỀ THI: ${examCode}`, bold: true, size: 22, font: 'Times New Roman' })],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: `Thời gian làm bài: ${duration} phút`, italics: true, size: 22, font: 'Times New Roman' })],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  children.push(headerTable);

  // Title
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 100 },
      children: [new TextRun({ text: examTitleText, bold: true, size: 28, font: 'Times New Roman' })],
    })
  );

  // Subtitle
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 150 },
      children: [
        new TextRun({
          text: `(Đề thi gồm ${questions.length} câu hỏi. Thí sinh làm bài trực tiếp vào đề thi)`,
          italics: true,
          size: 22,
          font: 'Times New Roman',
        }),
      ],
    })
  );

  // Student Info Box
  const studentInfoTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: "94A3B8" },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: "94A3B8" },
      left: { style: BorderStyle.SINGLE, size: 4, color: "94A3B8" },
      right: { style: BorderStyle.SINGLE, size: 4, color: "94A3B8" },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                spacing: { before: 80, after: 80 },
                children: [
                  new TextRun({
                    text: '  Họ và tên thí sinh: ................................................................   Lớp: .........   SBD: .........',
                    italics: true,
                    size: 22,
                    font: 'Times New Roman',
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  children.push(studentInfoTable);
  children.push(new Paragraph({ spacing: { after: 150 } }));

  // Questions
  questions.forEach((q, idx) => {
    const qType = q.questionType || 'multiple_choice';

    children.push(
      new Paragraph({
        spacing: { before: 140, after: 60 },
        children: [
          new TextRun({
            text: `Câu ${idx + 1} (${q.taxonomyLevel}${qType === 'true_false' ? ' - Đúng/Sai' : qType === 'short_answer' ? ' - Trả lời ngắn' : ''}): `,
            bold: true,
            size: 24,
            font: 'Times New Roman',
          }),
          new TextRun({
            text: cleanQuestionText(q.question),
            size: 24,
            font: 'Times New Roman',
          }),
        ],
      })
    );

    if (qType === 'true_false') {
      const stmts = sanitizeTrueFalseStatements(q);
      const tfRows = [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 80, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [new TextRun({ text: 'Phát biểu', bold: true, size: 22, font: 'Times New Roman' })] })],
            }),
            new TableCell({
              width: { size: 20, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Lựa chọn', bold: true, size: 22, font: 'Times New Roman' })] })],
            }),
          ],
        }),
        ...stmts.map(
          (stmt) =>
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: stmt.statement, size: 22, font: 'Times New Roman' })] })],
                }),
                new TableCell({
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '[ Đúng ] / [ Sai ]', size: 22, font: 'Times New Roman' })] })],
                }),
              ],
            })
        ),
      ];

      children.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: tfRows,
        })
      );
    } else if (qType === 'short_answer') {
      children.push(
        new Paragraph({
          spacing: { before: 60, after: 100 },
          children: [
            new TextRun({
              text: '   Đáp số / Kết quả: .............................................................................................................',
              size: 24,
              font: 'Times New Roman',
            }),
            ...(q.mathRoundingNote
              ? [
                  new TextRun({
                    text: `\n   (${q.mathRoundingNote})`,
                    italics: true,
                    size: 20,
                    font: 'Times New Roman',
                  }),
                ]
              : []),
          ],
        })
      );
    } else {
      q.options.forEach((opt, i) => {
        children.push(
          new Paragraph({
            spacing: { before: 30, after: 30 },
            indent: { left: 360 },
            children: [
              new TextRun({
                text: `${String.fromCharCode(65 + i)}. `,
                bold: true,
                size: 23,
                font: 'Times New Roman',
              }),
              new TextRun({
                text: opt,
                size: 23,
                font: 'Times New Roman',
              }),
            ],
          })
        );
      });
    }
  });

  // Page Break for Answer Key & Detailed Solution
  children.push(new Paragraph({ children: [new PageBreak()] }));

  // Answer Key Section
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 180, after: 180 },
      children: [
        new TextRun({
          text: 'ĐÁP ÁN VÀ HƯỚNG DẪN GIẢI CHI TIẾT (HƯỚNG DẪN CHẤM)',
          bold: true,
          size: 26,
          color: '059669',
          font: 'Times New Roman',
        }),
      ],
    })
  );

  const answerRows = [
    new TableRow({
      children: [
        new TableCell({
          width: { size: 10, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ children: [new TextRun({ text: 'Câu', bold: true, size: 22, font: 'Times New Roman' })] })],
        }),
        new TableCell({
          width: { size: 25, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ children: [new TextRun({ text: 'Đáp án / Kết quả', bold: true, size: 22, font: 'Times New Roman' })] })],
        }),
        new TableCell({
          width: { size: 20, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ children: [new TextRun({ text: 'Mức độ', bold: true, size: 22, font: 'Times New Roman' })] })],
        }),
        new TableCell({
          width: { size: 45, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ children: [new TextRun({ text: 'Hướng dẫn giải chi tiết', bold: true, size: 22, font: 'Times New Roman' })] })],
        }),
      ],
    }),
    ...questions.map((q, idx) => {
      const qType = q.questionType || 'multiple_choice';
      let answerText = '';

      if (qType === 'true_false') {
        const stmts = sanitizeTrueFalseStatements(q);
        answerText = stmts
          .map((st) => `${st.statement.substring(0, 2)}: ${st.isCorrect ? 'Đ' : 'S'}`)
          .join(' | ');
      } else if (qType === 'short_answer') {
        answerText = q.shortAnswer || (q.acceptableAnswers ? q.acceptableAnswers.join(' / ') : '');
      } else {
        answerText = String.fromCharCode(65 + q.correctOption);
      }

      return new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: `${idx + 1}`, size: 22, font: 'Times New Roman' })] })],
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: answerText, bold: true, color: '059669', size: 22, font: 'Times New Roman' })] })],
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: q.taxonomyLevel, size: 20, font: 'Times New Roman' })] })],
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: q.explanation, size: 20, font: 'Times New Roman' })] })],
          }),
        ],
      });
    }),
  ];

  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: answerRows,
    })
  );

  // Document Configuration for A4 Portrait with 15mm margins
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 850,
              bottom: 850,
              left: 850,
              right: 850,
            },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const safeSubject = subject.replace(/[^a-zA-Z0-9_]/g, '_');
  const filename = `De_Thi_Giay_Kho_A4_${safeSubject}_${Date.now()}.docx`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function downloadBlob(content: string, filename: string, mimeType: string) {
  const blob = new Blob(['\uFEFF' + content], { type: mimeType }); // Add UTF-8 BOM
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
