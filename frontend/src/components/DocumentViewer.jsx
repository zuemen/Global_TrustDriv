import { useI18n } from '../hooks/useI18n'

const FALLBACK_IMG = 'https://cdn.pixabay.com/photo/2013/07/12/15/20/document-149692_1280.png'

export default function DocumentViewer({ previews = [], isScanning = false, filename = '' }) {
  const { t } = useI18n()

  return (
    <div className="glass rounded-[2.5rem] overflow-hidden relative min-h-[500px] shadow-2xl flex flex-col border border-white/5">
      {/* Title bar */}
      <div className="bg-slate-800/80 px-8 py-5 border-b border-slate-700/50 flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <span className="w-3.5 h-3.5 bg-red-500/80 rounded-full shadow-lg shadow-red-500/20" />
          <span className="w-3.5 h-3.5 bg-yellow-500/80 rounded-full shadow-lg shadow-yellow-500/20" />
          <span className="w-3.5 h-3.5 bg-green-500/80 rounded-full shadow-lg shadow-green-500/20" />
        </div>
        <span className="text-[10px] font-mono text-slate-500 font-black uppercase tracking-[0.2em] truncate max-w-[60%]">
          {filename || t('noAssets')}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 relative flex items-center justify-center p-8 bg-slate-950/50">
        {/* Scan overlay */}
        {isScanning && (
          <div className="absolute inset-0 z-20 pointer-events-none">
            <div className="absolute w-full h-1 bg-vault-accent shadow-[0_0_20px_#38bdf8,0_0_40px_#38bdf8] scanning-line" />
            <div className="absolute inset-0 bg-vault-accent/10 backdrop-blur-[1px]" />
          </div>
        )}

        {previews.length === 0 ? (
          <div className="text-slate-800 flex flex-col items-center justify-center gap-6 py-16">
            <svg className="w-28 h-28 opacity-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-[11px] font-black uppercase tracking-[0.5em] opacity-20">{t('noAssets')}</p>
          </div>
        ) : (
          <div className="w-full h-full flex flex-wrap gap-6 overflow-y-auto content-start justify-center py-2">
            {previews.map((p, i) => (
              <div
                key={i}
                className="w-[220px] h-[300px] bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-300 relative group cursor-pointer hover:scale-105 transition-all duration-500"
              >
                <img
                  src={p.img || FALLBACK_IMG}
                  alt={p.name}
                  className="w-full h-full object-cover"
                  onError={e => { e.target.src = FALLBACK_IMG }}
                />
                <div className="absolute inset-0 bg-vault-900/75 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity p-4">
                  <p className="text-[10px] text-vault-accent font-black uppercase tracking-widest mb-2">Authenticated Asset</p>
                  <p className="text-[10px] text-white font-mono text-center break-all">{p.name}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
