import { useRef } from 'react'
import { useI18n } from '../hooks/useI18n'

const JURISDICTIONS = [
  { value: 'USA',         label: 'United States (Standard)' },
  { value: 'Germany',     label: 'Germany (EU GDPR)' },
  { value: 'Singapore',   label: 'Singapore (MAS)' },
  { value: 'UK',          label: 'United Kingdom (FCA)' },
  { value: 'Taiwan',      label: 'Taiwan (FSC)' },
  { value: 'South Korea', label: 'South Korea (FSS)' },
  { value: 'Japan',       label: 'Japan (FSA)' },
  { value: 'Canada',      label: 'Canada (IRCC)' },
  { value: 'Australia',   label: 'Australia (DIBP)' },
]

const GOALS = [
  { value: 'University Study',       label: '🎓 Academic Admission' },
  { value: 'Employment',             label: '💼 Professional Work Pass' },
  { value: 'Healthcare License',     label: '🩺 Medical Practice' },
  { value: 'Digital Nomad Visa',     label: '🌐 Global Mobility' },
  { value: 'Talent Pass',            label: '⭐ Talent Pass' },
  { value: 'Skilled Migration Visa', label: '✈️ Skilled Migration' },
  { value: 'Exchange Program',       label: '🔄 Exchange Program' },
  { value: 'Banking Setup',          label: '🏦 Banking Setup' },
]

const STEPS = [
  { id: 'upload',  label: 'stepUpload'  },
  { id: 'process', label: 'stepProcess' },
  { id: 'analyze', label: 'stepAnalyze' },
  { id: 'report',  label: 'stepReport'  },
]

const DEMOS = [
  { key: 'Study',  emoji: '🎓', labelKey: 'demoStudy',  subKey: '3 ASSETS · MULTI-DOC AI'  },
  { key: 'Career', emoji: '💼', labelKey: 'demoCareer', subKey: '2 ASSETS · PII REDACTION' },
  { key: 'Taiwan', emoji: '🇹🇼', labelKey: 'demoTaiwan', subKey: '3 ASSETS · NCCU · CTBC'   },
  { key: 'Korea',  emoji: '🇰🇷', labelKey: 'demoKorea',  subKey: '2 ASSETS · KAKAO · NTS'   },
]

export default function Sidebar({
  jurisdiction, setJurisdiction,
  goal, setGoal,
  fileLabel, onFilesChange, onDrop,
  onSubmit, onDemo,
  loading, activeStep,
}) {
  const { t } = useI18n()
  const inputRef = useRef()

  const stepState = (id) => {
    if (!activeStep) return 'idle'
    const order = ['upload', 'process', 'analyze', 'report']
    const active = order.indexOf(activeStep)
    const idx    = order.indexOf(id)
    if (idx < active)  return 'done'
    if (idx === active) return 'active'
    return 'pending'
  }

  return (
    <div className="xl:col-span-3 space-y-6">
      {/* Settings */}
      <div className="glass rounded-[2rem] p-8 shadow-2xl">
        <h2 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] mb-8 flex items-center gap-3">
          <span className="w-1.5 h-5 bg-vault-accent rounded-full" />
          {t('scenarioSetup')}
        </h2>
        <div className="space-y-6">
          <div>
            <label className="block text-[10px] text-slate-400 font-black mb-3 uppercase tracking-widest">
              {t('jurisdiction')}
            </label>
            <select
              value={jurisdiction}
              onChange={e => setJurisdiction(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl px-4 py-4 text-sm text-white focus:ring-2 focus:ring-vault-accent outline-none cursor-pointer hover:bg-slate-900 transition-all"
            >
              {JURISDICTIONS.map(j => (
                <option key={j.value} value={j.value}>{j.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-slate-400 font-black mb-3 uppercase tracking-widest">
              {t('objective')}
            </label>
            <select
              value={goal}
              onChange={e => setGoal(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl px-4 py-4 text-sm text-white focus:ring-2 focus:ring-vault-accent outline-none cursor-pointer hover:bg-slate-900 transition-all"
            >
              {GOALS.map(g => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Upload */}
      <div className="glass rounded-[2rem] p-8 shadow-2xl">
        <h2 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
          <span className="w-1.5 h-5 bg-vault-safe rounded-full" />
          {t('secureIntake')}
        </h2>
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={onDrop}
          className="border-2 border-dashed border-slate-700/50 hover:border-vault-accent hover:bg-vault-accent/5 rounded-[1.5rem] p-8 text-center cursor-pointer transition-all duration-500 group"
        >
          <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all shadow-xl">
            <svg className="w-7 h-7 text-slate-400 group-hover:text-vault-accent transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <p className="text-sm text-slate-300 font-bold mb-1">{fileLabel || t('uploadDocs')}</p>
          <p className="text-[9px] text-slate-500 uppercase tracking-tighter">{t('uploadHint')}</p>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.docx,.txt"
            onChange={onFilesChange}
          />
        </div>

        <button
          onClick={onSubmit}
          disabled={loading}
          className="w-full mt-6 bg-gradient-to-r from-vault-accent to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-black py-5 rounded-2xl shadow-2xl shadow-vault-accent/30 transition-all duration-500 active:scale-95 uppercase tracking-[0.2em] text-xs disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? t('executingBtn') : t('executeBtn')}
        </button>

        {/* Progress */}
        {loading && (
          <div className="mt-6 space-y-3">
            {STEPS.map(s => {
              const state = stepState(s.id)
              return (
                <div key={s.id} className={`flex items-center gap-3 text-xs transition-colors ${
                  state === 'active' ? 'text-vault-accent' :
                  state === 'done'   ? 'text-vault-safe' : 'text-slate-600'
                }`}>
                  <span className={`w-5 h-5 rounded-full border flex items-center justify-center text-[9px] transition-all ${
                    state === 'active' ? 'border-vault-accent bg-vault-accent/20' :
                    state === 'done'   ? 'border-vault-safe bg-vault-safe/20 text-vault-safe' :
                    'border-slate-700'
                  }`}>
                    {state === 'done' ? '✓' : STEPS.indexOf(s) + 1}
                  </span>
                  {t(s.label)}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Demos */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] px-4">
          {t('instantDemos')}
        </h3>
        <div className="grid grid-cols-1 gap-3">
          {DEMOS.map(d => (
            <button
              key={d.key}
              onClick={() => onDemo(d.key)}
              className="flex items-center gap-4 px-6 py-4 bg-slate-800/30 hover:bg-slate-800/60 border border-slate-700/30 hover:border-vault-accent/30 rounded-[1.5rem] transition-all group"
            >
              <span className="text-2xl group-hover:scale-125 group-hover:rotate-12 transition-transform">{d.emoji}</span>
              <div className="text-left">
                <p className="text-xs font-black text-white uppercase tracking-wider">{t(d.labelKey)}</p>
                <p className="text-[9px] text-slate-500 uppercase font-bold">{d.subKey}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
