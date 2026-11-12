import React from 'react';

export const StageFooter: React.FC = () => {
  return (
    <footer className="w-full bg-white/80 border-t border-amber-200/60 px-4 py-2.5 text-xs text-slate-500 z-20 text-center">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
        <span className="font-semibold text-slate-700">
          2026 수원시장애인종합복지관 평생교육 어울림 축제 ‘이어가는 마음, 어우러지는 하루’
        </span>
      </div>
    </footer>
  );
};
