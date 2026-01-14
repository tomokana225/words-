
import React from 'react';

interface WelcomeViewProps {
  onLogin: () => void;
  onGuest: () => void;
}

const WelcomeView: React.FC<WelcomeViewProps> = ({ onLogin, onGuest }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white overflow-hidden">
      <div className="w-full max-w-md space-y-16 animate-subtle text-center">
        {/* Logo Section */}
        <div className="space-y-6">
          <div className="mx-auto w-20 h-20 gradient-primary text-white rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-200">
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900">
              EikenMaster <span className="text-indigo-600">AI</span>
            </h1>
            <p className="text-slate-500 font-medium text-base">
              科学的な学習サイクルで、<br/>
              あなたの英語力を最短で引き上げる。
            </p>
          </div>
        </div>

        {/* Action Section */}
        <div className="space-y-4">
          <button 
            onClick={onLogin}
            className="w-full py-4 bg-slate-900 text-white rounded-xl font-semibold text-base shadow-lg hover:bg-black transition bounce-on-click flex items-center justify-center gap-3"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.908 3.152-1.928 4.176-1.224 1.224-3.136 2.52-6.656 2.52-5.392 0-9.712-4.384-9.712-9.712s4.32-9.712 9.712-9.712c3.12 0 5.4 1.232 7.176 2.928l2.32-2.32c-2.392-2.288-5.504-3.608-9.496-3.608-7.72 0-14 6.28-14 14s6.28 14 14 14c4.176 0 7.328-1.376 9.8-3.952 2.544-2.544 3.344-6.104 3.344-9.04 0-.872-.072-1.712-.2-2.52h-12.944z"/></svg>
            Googleでログイン
          </button>
          
          <button 
            onClick={onGuest}
            className="w-full py-4 bg-white border border-slate-200 text-slate-600 rounded-xl font-semibold text-base hover:bg-slate-50 transition bounce-on-click"
          >
            ゲストとして始める
          </button>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-3 gap-8 pt-8 border-t border-slate-100">
          {[
            { label: '忘却曲線', icon: '🧠' },
            { label: 'AI解析', icon: '✨' },
            { label: '英検対応', icon: '🎓' },
          ].map((f, i) => (
            <div key={i} className="space-y-1">
              <span className="text-2xl block">{f.icon}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{f.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WelcomeView;
