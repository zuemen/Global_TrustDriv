import { useI18n } from '../hooks/useI18n'

export default function AnalysisPanel({ result }) {
  const { t } = useI18n()

  const trust   = result?.trust_info   ?? {}
  const analysis = result?.analysis    ?? {}
  const adv      = trust.advantage     ?? {}

  const score   = trust.score   ?? '--'
  const level   = trust.level   ?? t('evalPending')
  const ial     = trust.ial     ?? 'IAL: LEVEL 0'
  const stars   = adv.stars     ?? 0
  const advText = adv.analysis  ?? 'Cognitive engine awaiting document stream…'
  const metrics = analysis.converted_metrics ?? { val: '--', system: 'Cross-System Mapping…', detail: 'Detailed metrics will appear here after analysis.' }
  const stdInfo = analysis.standard_info     ?? { code: 'N/A' }
  const redacted = (analysis.redacted_credentials ?? []).map(c => `[FILE: ${c.name}]\n${c.content}`).join('\n\n---\n\n')
  const aiReport = analysis.advantage_analysis ?? 'Awaiting data input…'

  const progressW = typeof score === 'number' ? `${score}%` : '0%'

  return (
    <div className="lg:col-span-5 space-y-6">
      {/* Trust score */}
      <div className="glass rounded-[2rem] p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 bg-vault-accent/20 px-4 py-1.5 text-[9px] font-black text-vault-accent rounded-bl-2xl uppercase border-b border-l border-white/5">
          IAL: {ial}
        </div>
        <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] mb-8">{t('trustIndex')}</h3>
        <div className="flex items-end gap-5">
          <span className="text-7xl font-black text-white tracking-tighter tabular-nums leading-none">{score}</span>
          <div className="pb-2 flex-1">
            <span className="block text-vault-safe font-black text-sm uppercase tracking-[0.2em] mb-2">{level}</span>
            <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden shadow-inner border border-white/5">
              <div
                className="h-full bg-gradient-to-r from-vault-accent to-vault-safe transition-all duration-1000"
                style={{ width: progressW }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stars */}
      <div className="glass rounded-[2rem] p-8 bg-gradient-to-br from-vault-gold/10 to-transparent border border-vault-gold/20 shadow-2xl">
        <h3 className="text-vault-gold text-[10px] font-black uppercase tracking-[0.4em] mb-5">{t('approvalProb')}</h3>
        <div className="text-4xl text-vault-gold mb-4 tracking-[0.2em] drop-shadow-[0_0_20px_rgba(251,191,36,0.5)]">
          {'★'.repeat(stars)}{'☆'.repeat(5 - stars)}
        </div>
        <p className="text-xs text-slate-400 font-medium italic leading-relaxed">{advText}</p>
      </div>

      {/* Report */}
      <div className="glass rounded-[2rem] overflow-hidden border-t-[5px] border-vault-accent shadow-2xl">
        <div className="bg-slate-800/60 px-6 py-5 border-b border-slate-700/50 flex justify-between items-center">
          <h3 className="text-white font-black text-[11px] uppercase tracking-[0.3em]">{t('aiReport')}</h3>
          <span className="px-3 py-1 bg-vault-accent/10 text-vault-accent rounded-lg text-[9px] font-mono font-black border border-vault-accent/20">
            STD: {stdInfo.code}
          </span>
        </div>
        <div className="p-8 space-y-6">
          <div className="bg-slate-900/90 rounded-[1.5rem] p-6 border border-white/5 shadow-inner">
            <p className="text-4xl font-black text-white mb-2 tabular-nums">{metrics.val}</p>
            <p className="text-[11px] text-vault-accent font-black uppercase tracking-[0.2em]">{metrics.system}</p>
            <div className="h-px bg-slate-800 my-4" />
            <p className="text-xs text-slate-500 font-mono leading-relaxed italic">{metrics.detail}</p>
          </div>
          <div className="bg-slate-950/50 rounded-[1.5rem] p-6 border border-white/5">
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] mb-4">VaultSage AI Analysis + PII Redaction Layer</p>
            <pre className="text-[11px] font-mono text-slate-500 max-h-[150px] overflow-y-auto leading-loose whitespace-pre-wrap">
              {redacted || '--'}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}
