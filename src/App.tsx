/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { QuizData, UserAnswers } from './types/quiz';
import { SAMPLE_QUIZZES } from './data/sampleQuizzes';
import { Header } from './components/Header';
import { QuizPlayer } from './components/QuizPlayer';
import { QuizResultView } from './components/QuizResultView';
import { PrintA4View } from './components/PrintA4View';
import { QuizCreatorModal } from './components/QuizCreatorModal';
import { sound } from './utils/sound';
import { UploadCloud, BookOpen, Printer, Sparkles, CheckCircle2, FileText } from 'lucide-react';

export default function App() {
  const [currentQuiz, setCurrentQuiz] = useState<QuizData>(SAMPLE_QUIZZES[0]);
  const [quizState, setQuizState] = useState<'taking' | 'result' | 'print'>('taking');
  const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
  const [timeSpentSeconds, setTimeSpentSeconds] = useState<number>(0);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const handleToggleSound = () => {
    const nextState = !soundEnabled;
    setSoundEnabled(nextState);
    sound.enabled = nextState;
  };

  const handleQuizGenerated = (newQuiz: QuizData) => {
    setCurrentQuiz(newQuiz);
    setUserAnswers({});
    setTimeSpentSeconds(0);
    setQuizState('taking');
  };

  const handleFinishQuiz = (answers: UserAnswers, timeSpent: number) => {
    setUserAnswers(answers);
    setTimeSpentSeconds(timeSpent);
    setQuizState('result');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRetry = () => {
    setUserAnswers({});
    setTimeSpentSeconds(0);
    setQuizState('taking');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenPrint = () => {
    setQuizState('print');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-amber-50/40 text-slate-800">
      {/* Top Navigation */}
      <Header
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        onOpenPrintView={handleOpenPrint}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        currentGrade={currentQuiz.grade}
      />

      {/* Main Body */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6">
        {/* Banner Bar for Quick Grade switch or Upload (shown when taking or beginning) */}
        {quizState !== 'print' && (
          <div className="mb-6 p-4 rounded-3xl bg-gradient-to-r from-amber-400/20 via-orange-300/20 to-amber-200/30 border border-amber-200 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-xl shadow-sm shadow-amber-300">
                ⭐
              </span>
              <div>
                <div className="text-xs font-black text-amber-900 uppercase tracking-wider">
                  Chương trình {currentQuiz.grade} • Môn {currentQuiz.subject}
                </div>
                <div className="text-sm font-bold text-slate-800">
                  {currentQuiz.title}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 font-extrabold text-xs shadow-2xs transition-all cursor-pointer"
              >
                <UploadCloud className="w-4 h-4 text-amber-600" />
                <span>Tải File Tạo Đề Tự Động</span>
              </button>

              {/* Quick sample switches */}
              <div className="hidden lg:flex items-center gap-1.5 bg-white/70 p-1 rounded-xl border border-amber-200 text-xs">
                {SAMPLE_QUIZZES.map((sample) => (
                  <button
                    key={sample.id}
                    onClick={() => handleQuizGenerated(sample)}
                    type="button"
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      currentQuiz.id === sample.id
                        ? 'bg-amber-500 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-amber-900 hover:bg-amber-100/50'
                    }`}
                  >
                    {sample.subject} 5
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* View Switch */}
        {quizState === 'taking' && (
          <QuizPlayer
            quiz={currentQuiz}
            onFinishQuiz={handleFinishQuiz}
            onOpenPrint={handleOpenPrint}
            onNewQuiz={() => setIsCreateModalOpen(true)}
          />
        )}

        {quizState === 'result' && (
          <QuizResultView
            quiz={currentQuiz}
            userAnswers={userAnswers}
            timeSpentSeconds={timeSpentSeconds}
            onRetry={handleRetry}
            onNewQuiz={() => setIsCreateModalOpen(true)}
            onOpenPrint={handleOpenPrint}
          />
        )}

        {quizState === 'print' && (
          <PrintA4View
            quiz={currentQuiz}
            onBack={() => setQuizState('taking')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto py-6 border-t border-amber-200/60 bg-white/60 text-center text-xs text-slate-500 print:hidden">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-bold text-amber-900">
            <span>🎒 Trắc Nghiệm Tiểu Học Thông Minh</span>
            <span className="text-slate-400">•</span>
            <span className="font-medium text-slate-600">Chuẩn GDPT 2018 (Lớp 1 đến Lớp 5)</span>
          </div>
          <div className="flex items-center gap-4 text-slate-500">
            <span>Hỗ trợ file: PDF, Word (.docx), Ảnh sách bài tập</span>
            <span>Xuất trang in A4 tiêu chuẩn</span>
          </div>
        </div>
      </footer>

      {/* Quiz Creation Modal */}
      <QuizCreatorModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onQuizGenerated={handleQuizGenerated}
      />
    </div>
  );
}
