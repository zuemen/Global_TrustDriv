import { useState } from 'react'
import { useI18n } from '../hooks/useI18n'

function GapText({ text }) {
  const sections = []
  let currentTitle = ''
  let currentLines = []

  text.split('\n').forEach((line, i) => {
    if (line.startsWith('## ')) {
      if (currentTitle || currentLines.length) {
        sections.push({ title: currentTitle, lines: [...currentLines], id: i })
      }
      currentTitle = line.replace('## ', '')
      currentLines = []
    } else {
      if (line.trim()) currentLines.push(line)
    }
  })
  if (currentTitle || currentLines.length) {
    sections.push({ title: currentTitle, lines: currentLines, id: 9999 })
  }

  const isGapSection     = t => /gap|miss|incomplete/i.test(t)
  const isPrioritySection = t => /priority|action|urgent/i.test(t)
  const isDetectedSection = t => /detect|found|present/i.test(t)

  return (
    <div className="space-y-5">
      {sections.map(s => (
        <div key={s.id}>
          <h4 className={`text-[11px] font-black uppercase tracking-[0.2em] mb-3 ${
            isGapSection(s.title)     ? 'text-amber-400' :
            isPrioritySection(s.title) ? 'text-red-400'   :
            isDetectedSection(s.title) ? 'text-vault-safe' :
            'text-vault-accent'
          }`}>
            {s.title}
          </h4>
          <div className="space-y-1.5 pl-2">
            {s.lines.map((line, i) => (
              <p key={i} className={`text-xs leading-relaxed ${
                isGapSection(s.title)      ? 'text-amber-300/80' :
                isPrioritySection(s.title) ? 'text-red-300/80'   :
                isDetectedSection(s.title) ? 'text-slate-300'    :
                'text-slate-400'
              }`}>
                {line}
              </p>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function GapAdvisor({ docId }) {
  const { t } = useI18n()
  const [loading, setLoading]   = useState(false)
  const [gapText, setGapText]   = useState('')
  const [error, setError]       = useState('')

  const run = async () => {
    setLoading(true)
    setError('')
    setGapText('')
    try {
      const res  = await fetch('/api/gap-advisor', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ doc_id: docId }),
      })
      const data = await res.json()
      if (data.success) {
        setGapText(data.gaps)
      } else {
        setError(data.detail || data.error || 'Unknown error')
      }
    } catch (e) {
      setError('Network error: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass rounded-[3rem] p-10 border border-amber-500/20 shadow-2xl fade-up">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-amber-500/20 rounded-[1.25rem] flex items-center justify-center text-amber-400 shrink-0">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <h3 className="text-white font-black text-base uppercase tracking-[0.3em]">{t('gapTitle')}</h3>
        </div>
        <button
          onClick={run}
          disabled={loading}
          className="px-8 py-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-900 font-black rounded-2xl text-[11px] uppercase tracking-[0.2em] transition-all active:scale-95 shadow-xl shadow-amber-500/20"
        >
          {loading ? t('gapRunning') : t('gapBtn')}
        </button>
      </div>

      {loading && (
        <div className="flex items-center gap-3 text-amber-400 text-sm py-4">
          <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <span>{t('gapRunning')}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-900/30 border border-red-500/30 rounded-2xl p-4 text-red-400 text-sm">{error}</div>
      )}

      {gapText && !loading && (
        <div className="bg-slate-900/70 rounded-[1.5rem] p-8 border border-white/5">
          <GapText text={gapText} />
        </div>
      )}
    </div>
  )
}
