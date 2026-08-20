import React, { useState } from 'react';
import { 
  ActiveTab, 
  QuizBankData, 
  MindmapData, 
  FlashcardDeck, 
  WordwallData, 
  SubjectType, 
  GradeLevel 
} from './types';
import { SAMPLE_PRESETS } from './data/sampleData';
import { Header } from './components/Header';
import { DocumentInput } from './components/DocumentInput';
import { QuizBankView } from './components/QuizBankView';
import { MindmapView } from './components/MindmapView';
import { FlashcardView } from './components/FlashcardView';
import { WordwallGamificationView } from './components/WordwallGamificationView';

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('input');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Data States
  const [quizData, setQuizData] = useState<QuizBankData | null>(SAMPLE_PRESETS[0].quiz);
  const [mindmapData, setMindmapData] = useState<MindmapData | null>(SAMPLE_PRESETS[0].mindmap);
  const [flashcardDeck, setFlashcardDeck] = useState<FlashcardDeck | null>(SAMPLE_PRESETS[0].flashcards);
  const [wordwallData, setWordwallData] = useState<WordwallData | null>(SAMPLE_PRESETS[0].wordwall);

  const handleSelectSample = (sampleId: string) => {
    const found = SAMPLE_PRESETS.find((p) => p.id === sampleId);
    if (found) {
      setQuizData(found.quiz);
      setMindmapData(found.mindmap);
      setFlashcardDeck(found.flashcards);
      setWordwallData(found.wordwall);
      setActiveTab('quiz');
    }
  };

  const handleGenerate = async (params: {
    text: string;
    subject: SubjectType;
    grade: GradeLevel;
    numQuestions: number;
    generateType: 'all' | 'quiz' | 'mindmap' | 'flashcards' | 'wordwall';
    customPrompt?: string;
  }) => {
    setIsLoading(true);

    try {
      const generateQuiz = params.generateType === 'all' || params.generateType === 'quiz';
      const generateMindmap = params.generateType === 'all' || params.generateType === 'mindmap';
      const generateFlashcards = params.generateType === 'all' || params.generateType === 'flashcards';
      const generateWordwall = params.generateType === 'all' || params.generateType === 'wordwall';

      const promises: Promise<any>[] = [];

      if (generateQuiz) {
        promises.push(
          fetch('/api/generate-quiz', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: params.text,
              subject: params.subject,
              grade: params.grade,
              numQuestions: params.numQuestions,
              customPrompt: params.customPrompt,
            }),
          }).then((r) => r.json())
        );
      } else {
        promises.push(Promise.resolve(null));
      }

      if (generateMindmap) {
        promises.push(
          fetch('/api/generate-mindmap', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: params.text,
              subject: params.subject,
            }),
          }).then((r) => r.json())
        );
      } else {
        promises.push(Promise.resolve(null));
      }

      if (generateFlashcards) {
        promises.push(
          fetch('/api/generate-flashcards', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: params.text,
              subject: params.subject,
              count: 10,
            }),
          }).then((r) => r.json())
        );
      } else {
        promises.push(Promise.resolve(null));
      }

      if (generateWordwall) {
        promises.push(
          fetch('/api/generate-wordwall', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: params.text,
              subject: params.subject,
            }),
          }).then((r) => r.json())
        );
      } else {
        promises.push(Promise.resolve(null));
      }

      const [quizRes, mindmapRes, flashcardRes, wordwallRes] = await Promise.all(promises);

      if (quizRes && quizRes.success && quizRes.data) {
        setQuizData(quizRes.data);
      }
      if (mindmapRes && mindmapRes.success && mindmapRes.data) {
        setMindmapData(mindmapRes.data);
      }
      if (flashcardRes && flashcardRes.success && flashcardRes.data) {
        setFlashcardDeck(flashcardRes.data);
      }
      if (wordwallRes && wordwallRes.success && wordwallRes.data) {
        setWordwallData(wordwallRes.data);
      }

      // Switch tab to generated result
      if (generateQuiz) setActiveTab('quiz');
      else if (generateMindmap) setActiveTab('mindmap');
      else if (generateFlashcards) setActiveTab('flashcards');
      else if (generateWordwall) setActiveTab('wordwall');

    } catch (err: any) {
      console.error('Failed to generate learning material:', err);
      alert('Có lỗi xảy ra khi tạo học liệu AI. Vui lòng kiểm tra kết nối và thử lại!');
    } finally {
      setIsLoading(false);
    }
  };

  const hasData = Boolean(quizData || mindmapData || flashcardDeck || wordwallData);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hasData={hasData}
        onSelectSample={handleSelectSample}
        onPrintQuiz={() => window.print()}
      />

      {/* Main Content Body */}
      <main className="flex-1 pb-16">
        {activeTab === 'input' && (
          <DocumentInput
            onGenerate={handleGenerate}
            isLoading={isLoading}
            onSelectSample={handleSelectSample}
          />
        )}

        {activeTab === 'quiz' && (
          <QuizBankView
            quizData={quizData}
            onPrint={() => window.print()}
          />
        )}

        {activeTab === 'mindmap' && (
          <MindmapView mindmapData={mindmapData} />
        )}

        {activeTab === 'flashcards' && (
          <FlashcardView flashcardDeck={flashcardDeck} />
        )}

        {activeTab === 'wordwall' && (
          <WordwallGamificationView wordwallData={wordwallData} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>EduAI Assistant © 2026 - Tự Động Hóa Soạn Đề & Học Liệu Tương Tác Chuẩn GD&ĐT</span>
          <span className="font-semibold text-slate-600">Powered by Gemini 3.7 Flash AI</span>
        </div>
      </footer>
    </div>
  );
}
