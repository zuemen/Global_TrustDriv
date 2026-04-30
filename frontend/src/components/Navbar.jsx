import { useI18n } from '../hooks/useI18n'

const LANGS = [
  { code: 'en', label: 'EN' },
  { code: 'zh', label: '中文' },
  { code: 'ko', label: '한국어' },
]

export default function Navbar() {
  const { lang, setLang, t } = useI18n()

  return (
    <nav className="border-b border-slate-800/50 bg-vault-900/80 backdrop-blur-xl px-6 md:px-10 py-5 flex justify-between items-center sticky top-0 z-50">
      {/* Brand */}
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-vault-accent to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-vault-accent/30 shrink-0">
          <svg className="w-5 h-5 md:w-7 md:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <div className="hidden sm:block">
          <h1 className="text-xl md:text-2xl font-black text-white tracking-tighter">
            {t('brandName').split(' ').slice(0,1)[0]}{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-vault-accent to-indigo-400">
              {t('brandName').split(' ').slice(1).join(' ')}
            </span>
          </h1>
          <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.25em]">{t('brandSub')}</p>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        <div className="hidden md:flex px-5 py-2 bg-slate-800/50 border border-vault-accent/20 rounded-full items-center gap-2">
          <span className="w-2 h-2 bg-vault-accent rounded-full animate-pulse shadow-[0_0_8px_#38bdf8]" />
          <span className="text-[9px] font-black text-vault-accent uppercase tracking-widest">{t('navStatus')}</span>
        </div>

        {/* Language toggle */}
        <div className="flex gap-1 p-1 bg-slate-800/60 rounded-xl border border-slate-700/40">
          {LANGS.map(l => (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-all ${
                lang === l.code
                  ? 'bg-vault-accent text-slate-900'
                  : 'text-slate-500 hover:text-white'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  )
}
