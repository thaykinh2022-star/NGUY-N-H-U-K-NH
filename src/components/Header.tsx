import React from 'react';
import { Sparkles, Printer, Volume2, VolumeX, PlusCircle, BookOpen } from 'lucide-react';
import { sound } from '../utils/sound';

interface HeaderProps {
  onOpenCreateModal: () => void;
  onOpenPrintView: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  currentGrade: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenCreateModal,
  onOpenPrintView,
  soundEnabled,
  onToggleSound,
  currentGrade,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-amber-200/80 shadow-xs print:hidden">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 md:w-11 md:h-11 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-400 to-amber-500 flex items-center justify-center text-2xl shadow-sm shadow-amber-300">
            🎒
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base md:text-lg font-black tracking-tight text-slate-800 leading-tight">
                Trắc Nghiệm Tiểu Học
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300 hidden sm:inline-block">
                {currentGrade}
              </span>
            </div>
            <p className="text-[11px] font-semibold text-slate-500 hidden md:block">
              Tạo đề từ PDF, Word, Ảnh • Đa dạng bài tập • In chuẩn trang A4
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Sound Toggle */}
          <button
            onClick={() => {
              sound.playClick();
              onToggleSound();
            }}
            type="button"
            className="w-9 h-9 rounded-xl border border-slate-200 hover:border-amber-300 hover:bg-amber-50 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
            title={soundEnabled ? 'Tắt âm thanh hiệu ứng' : 'Bật âm thanh hiệu ứng'}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-amber-600" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {/* Quick Print A4 */}
          <button
            onClick={onOpenPrintView}
            type="button"
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 hover:border-amber-300 hover:bg-amber-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>In Trang A4</span>
          </button>

          {/* Create New Quiz Button */}
          <button
            onClick={onOpenCreateModal}
            type="button"
            className="flex items-center gap-1.5 px-3.5 md:px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs md:text-sm shadow-md shadow-amber-300/50 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 fill-white/20" />
            <span>Tạo Đề Mới</span>
          </button>
        </div>
      </div>
    </header>
  );
};
