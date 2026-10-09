import React, { useState, useEffect } from 'react';
import { QuizData, UserAnswers } from '../types/quiz';
import { QuestionCard } from './QuestionCard';
import { 
  ArrowLeft, 
  ArrowRight, 
  Flag, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  RotateCcw,
  Printer,
  Sparkles
} from 'lucide-react';
import { sound } from '../utils/sound';

interface QuizPlayerProps {
  quiz: QuizData;
  onFinishQuiz: (answers: UserAnswers, timeSpentSeconds: number) => void;
  onOpenPrint: () => void;
  onNewQuiz: () => void;
}

export const QuizPlayer: React.FC<QuizPlayerProps> = ({
  quiz,
  onFinishQuiz,
  onOpenPrint,
  onNewQuiz,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());
  const [timeSpent, setTimeSpent] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState<boolean>(false);

  // Timer interval
  useEffect(() => {
    let interval: any;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimeSpent((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const currentQuestion = quiz.questions[currentIndex];
  const totalQuestions = quiz.questions.length;

  const handleAnswerChange = (answer: any) => {
    setUserAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: answer,
    }));
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      sound.playClick();
      setCurrentIndex((prev) => prev + 1);
    } else {
      setShowSubmitConfirm(true);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      sound.playClick();
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleToggleFlag = () => {
    sound.playClick();
    setFlaggedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(currentQuestion.id)) {
        next.delete(currentQuestion.id);
      } else {
        next.add(currentQuestion.id);
      }
      return next;
    });
  };

  const isQuestionAnswered = (qId: string) => {
    const ans = userAnswers[qId];
    if (ans === undefined || ans === null || ans === '') return false;
    if (typeof ans === 'object') {
      return Object.keys(ans).length > 0;
    }
    return true;
  };

  const answeredCount = quiz.questions.filter((q) => isQuestionAnswered(q.id)).length;

  const confirmSubmit = () => {
    sound.playSuccess();
    setShowSubmitConfirm(false);
    onFinishQuiz(userAnswers, timeSpent);
  };

  // Format time
  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Quiz Top Status Bar */}
      <div className="bg-white rounded-3xl p-4 md:p-5 shadow-sm border border-amber-200/80 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-300">
              {quiz.grade}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-orange-100 text-orange-800 border border-orange-300">
              {quiz.subject}
            </span>
          </div>
          <h2 className="text-base md:text-lg font-extrabold text-slate-800 line-clamp-1">
            {quiz.title}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          {/* Timer */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 font-extrabold text-sm">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>{formatTimer(timeSpent)}</span>
          </div>

          {/* Quick Print Button */}
          <button
            onClick={onOpenPrint}
            type="button"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
            title="In đề ra giấy A4"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span className="hidden sm:inline">In A4</span>
          </button>

          {/* Submit button */}
          <button
            onClick={() => setShowSubmitConfirm(true)}
            type="button"
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs md:text-sm shadow-md shadow-emerald-200 transition-all cursor-pointer"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Nộp Bài</span>
          </button>
        </div>
      </div>

      {/* Question Number Stepper Palette */}
      <div className="bg-white rounded-3xl p-4 md:p-5 shadow-sm border border-amber-200/80">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          <span>Danh sách câu hỏi ({answeredCount}/{totalQuestions} đã làm)</span>
          <div className="flex items-center gap-3 text-xs normal-case font-semibold">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Đã làm
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span> Cần xem lại
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {quiz.questions.map((q, idx) => {
            const isCurrent = idx === currentIndex;
            const answered = isQuestionAnswered(q.id);
            const isFlagged = flaggedQuestions.has(q.id);

            let btnStyle = 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-amber-50';

            if (isCurrent) {
              btnStyle = 'border-amber-500 bg-amber-500 text-white font-black ring-4 ring-amber-200 shadow-sm';
            } else if (isFlagged) {
              btnStyle = 'border-amber-400 bg-amber-100 text-amber-900 font-bold';
            } else if (answered) {
              btnStyle = 'border-emerald-300 bg-emerald-50 text-emerald-800 font-bold';
            }

            return (
              <button
                key={q.id}
                onClick={() => {
                  sound.playClick();
                  setCurrentIndex(idx);
                }}
                type="button"
                className={`relative w-9 h-9 md:w-10 md:h-10 rounded-xl border-2 text-xs md:text-sm transition-all flex items-center justify-center cursor-pointer ${btnStyle}`}
              >
                {idx + 1}
                {isFlagged && !isCurrent && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-500 border-2 border-white"></span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Question Card */}
      {currentQuestion && (
        <QuestionCard
          question={currentQuestion}
          index={currentIndex}
          totalQuestions={totalQuestions}
          userAnswer={userAnswers[currentQuestion.id]}
          onAnswerChange={handleAnswerChange}
        />
      )}

      {/* Bottom Navigation Buttons */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          type="button"
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white hover:bg-amber-50 text-slate-700 border-2 border-slate-200 font-extrabold text-sm transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Câu Trước</span>
        </button>

        <button
          onClick={handleToggleFlag}
          type="button"
          className={`flex items-center gap-1.5 px-4 py-3 rounded-2xl border-2 font-bold text-xs md:text-sm transition-all cursor-pointer ${
            flaggedQuestions.has(currentQuestion.id)
              ? 'bg-amber-100 border-amber-400 text-amber-900'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-amber-50'
          }`}
        >
          <Flag className={`w-4 h-4 ${flaggedQuestions.has(currentQuestion.id) ? 'fill-amber-500 text-amber-600' : ''}`} />
          <span className="hidden sm:inline">
            {flaggedQuestions.has(currentQuestion.id) ? 'Đã Đánh Dấu' : 'Đánh Dấu Xem Lại'}
          </span>
        </button>

        {currentIndex === totalQuestions - 1 ? (
          <button
            onClick={() => setShowSubmitConfirm(true)}
            type="button"
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-sm shadow-md shadow-emerald-200 transition-all cursor-pointer"
          >
            <span>Hoàn Thành & Nộp Bài</span>
            <CheckCircle className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleNext}
            type="button"
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-sm shadow-md shadow-amber-300 transition-all cursor-pointer"
          >
            <span>Câu Tiếp Theo</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border-2 border-amber-300 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 mx-auto flex items-center justify-center text-3xl">
              🎯
            </div>

            <h3 className="text-xl font-black text-slate-800">
              Em có chắc muốn nộp bài?
            </h3>

            <div className="bg-amber-50 rounded-2xl p-4 text-sm text-slate-700 space-y-1">
              <div>Đã hoàn thành: <strong className="text-emerald-700">{answeredCount}/{totalQuestions}</strong> câu</div>
              {totalQuestions - answeredCount > 0 && (
                <div className="text-amber-800 font-bold flex items-center justify-center gap-1.5 mt-1">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Còn {totalQuestions - answeredCount} câu chưa làm xong!
                </div>
              )}
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Sau khi nộp bài, hệ thống sẽ tự động chấm điểm và hiển thị lời giải chi tiết từng câu cho em.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSubmitConfirm(false)}
                className="flex-1 py-3 rounded-2xl font-bold text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors text-sm cursor-pointer"
              >
                Tiếp tục làm bài
              </button>
              <button
                type="button"
                onClick={confirmSubmit}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-sm shadow-md shadow-emerald-200 transition-all cursor-pointer"
              >
                Đồng ý nộp bài
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
