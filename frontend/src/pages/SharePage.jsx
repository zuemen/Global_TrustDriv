import { useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'

function ChatMessage({ msg }) {
  if (msg.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="bg-vault-accent text-slate-900 font-medium text-sm p-3 rounded-2xl rounded-tr-sm max-w-[80%]">
          {msg.text}
        </div>
      </div>
    )
  }
  if (msg.role === 'error') {
    return (
      <div className="bg-red-900/40 text-red-400 text-sm p-3 rounded-2xl border border-red-500/20">
        {msg.text}
      </div>
    )
  }
  return (
    <div className="bg-slate-700/60 text-slate-200 text-sm p-3 rounded-2xl rounded-tl-sm max-w-[90%] whitespace-pre-wrap">
      {msg.text}
    </div>
  )
}

export default function SharePage() {
  const { docId }                  = useParams()
  const [docData,  setDocData]     = useState(null)
  const [notFound, setNotFound]    = useState(false)
  const [messages, setMessages]    = useState([
    { role: 'ai', text: "Hello! I'm the VaultSage AI assistant for this SmartDrop. I've analyzed the uploaded credentials — ask me anything about compliance, next steps, or document details." }
  ])
  const [input,    setInput]       = useState('')
  const [chatBusy, setChatBusy]    = useState(false)
  const [timeLeft, setTimeLeft]    = useState('')
  const chatBoxRef                 = useRef()

  useEffect(() => {
    fetch(`/api/share-data/${docId}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) setDocData(d.data)
        else           setNotFound(true)
      })
      .catch(() => setNotFound(true))
  }, [docId])

  // Expiry countdown
  useEffect(() => {
    if (!docData?.created_at) return
    const tick = () => {
      const expiry = (docData.created_at + 7 * 24 * 3600) * 1000
      const rem    = expiry - Date.now()
      if (rem <= 0) { setTimeLeft('Expired'); return }
      const d = Math.floor(rem / 86400000)
      const h = Math.floor((rem % 86400000) / 3600000)
      setTimeLeft(`Expires in ${d}d ${h}h`)
    }
    tick()
    const id = setInterval(tick, 60000)
    return () => clearInterval(id)
  }, [docData])

  useEffect(() => {
    chatBoxRef.current?.scrollTo({ top: chatBoxRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const sendChat = async (e) => {
    e.preventDefault()
    const msg = input.trim()
    if (!msg || chatBusy) return
    setMessages(prev => [...prev, { role: 'user', text: msg }])
    setInput('')
    setChatBusy(true)
    setMessages(prev => [...prev, { role: 'ai', text: '…' }])

    try {
      const res  = await fetch('/api/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ doc_id: docId, message: msg }),
      })
      const data = await res.json()
      setMessages(prev => {
        const next = [...prev]
        next[next.length - 1] = data.success
          ? { role: 'ai',    text: data.response }
          : { role: 'error', text: data.detail || data.error || 'Error' }
        return next
      })
    } catch (err) {
      setMessages(prev => {
        const next = [...prev]
        next[next.length - 1] = { role: 'error', text: 'Network error: ' + err.message }
        return next
      })
    } finally {
      setChatBusy(false)
    }
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass rounded-3xl p-12 text-center max-w-md mx-4">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-xl font-black text-white mb-3">Document Not Found</h2>
          <p className="text-slate-400 text-sm">This SmartDrop link may be invalid or expired (TTL: 7 days).</p>
        </div>
      </div>
    )
  }

  if (!docData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-vault-accent">
          <div className="w-6 h-6 border-2 border-vault-accent border-t-transparent rounded-full animate-spin" />
          <span className="font-black text-sm uppercase tracking-widest">Loading SmartDrop…</span>
        </div>
      </div>
    )
  }

  const analysis  = docData.analysis   ?? {}
  const trust     = docData.trust_info  ?? {}
  const adv       = trust.advantage     ?? {}
  const metrics   = analysis.converted_metrics ?? {}
  const stdInfo   = analysis.standard_info     ?? {}
  const redacted  = (analysis.redacted_credentials ?? []).map(c => `[FILE: ${c.name}]\n${c.content}`).join('\n\n---\n\n')
  const score     = trust.score ?? '--'
  const stars     = adv.stars  ?? 0

  return (
    <div className="min-h-screen flex flex-col">
      {/* Background */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-vault-accent/8 blur-[100px] rounded-full" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-indigo-500/8 blur-[100px] rounded-full" />
      </div>

      {/* Nav */}
      <nav className="border-b border-slate-800/50 bg-vault-900/80 backdrop-blur-xl px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-vault-accent to-indigo-600 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <span className="font-black text-white text-sm">SmartDrop <span className="text-vault-accent">Viewer</span></span>
            <p className="text-[9px] text-slate-500 uppercase tracking-widest">Powered by VaultSage AI</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {timeLeft && (
            <span className="text-[10px] font-black text-slate-500 border border-slate-700 rounded-full px-4 py-1.5">{timeLeft}</span>
          )}
          <span className="text-[9px] font-mono text-slate-600 hidden sm:block">{analysis.doc_id}</span>
        </div>
      </nav>

      <main className="flex-1 flex overflow-hidden flex-col md:flex-row">
        {/* Left: Document analysis */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {/* Header */}
          <div className="glass rounded-2xl p-6 shadow-xl">
            <h2 className="text-xl font-black text-white mb-4">SmartDrop: {analysis.doc_id}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-slate-400 mb-1">Target Country</p>
                <p className="font-bold text-white">{docData.target_country}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Goal</p>
                <p className="font-bold text-white">{docData.goal}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Trust Score</p>
                <p className="text-3xl font-black text-vault-safe">{score}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">IAL Level</p>
                <p className="text-sm font-black text-vault-accent">{trust.ial}</p>
              </div>
            </div>
          </div>

          {/* Stars + verdict */}
          <div className="glass rounded-2xl p-6 shadow-xl">
            <p className="text-xs text-slate-400 mb-2 uppercase tracking-widest font-black">Approval Probability</p>
            <div className="text-3xl text-vault-gold mb-2">{'★'.repeat(stars)}{'☆'.repeat(5-stars)}</div>
            <p className="text-sm text-slate-300 italic">{adv.analysis}</p>
          </div>

          {/* Metrics */}
          <div className="glass rounded-2xl p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">AI Standardized Report</h3>
              <span className="text-[9px] font-mono text-vault-accent border border-vault-accent/30 px-2 py-1 rounded-lg">{stdInfo.code}</span>
            </div>
            <p className="text-4xl font-black text-white mb-1">{metrics.val}</p>
            <p className="text-xs text-vault-accent font-black uppercase tracking-widest mb-3">{metrics.system}</p>
            <p className="text-xs text-slate-500 font-mono italic">{metrics.detail}</p>
          </div>

          {/* AI report */}
          <div className="glass rounded-2xl p-6 shadow-xl">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">VaultSage AI Analysis (PII Redacted)</h3>
            <pre className="text-sm font-mono text-slate-400 whitespace-pre-wrap leading-relaxed max-h-[40vh] overflow-y-auto">
              {redacted || 'No content available.'}
            </pre>
          </div>

          {/* QR Code */}
          <div className="glass rounded-2xl p-6 shadow-xl flex items-center gap-6 flex-wrap">
            <QRCodeSVG
              value={window.location.href}
              size={100}
              fgColor="#38bdf8"
              bgColor="#020617"
              level="M"
            />
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Scan to Verify</p>
              <p className="text-sm text-vault-accent font-mono break-all">{window.location.href}</p>
              <button
                onClick={() => navigator.clipboard.writeText(window.location.href)}
                className="mt-2 text-[10px] text-slate-500 hover:text-white border border-slate-700 hover:border-vault-accent rounded-lg px-3 py-1 transition-all"
              >
                Copy Link
              </button>
            </div>
          </div>
        </div>

        {/* Right: Chat */}
        <div className="w-full md:w-96 border-t md:border-t-0 md:border-l border-slate-700/50 flex flex-col bg-vault-800/40">
          <div className="p-4 border-b border-slate-700/50 bg-slate-800/30">
            <h3 className="text-vault-accent font-black flex items-center gap-2 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              VaultSage AI Assistant
            </h3>
            <p className="text-xs text-slate-400 mt-1">Ask anything about this credential document.</p>
          </div>

          <div ref={chatBoxRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px] max-h-[60vh] md:max-h-none">
            {messages.map((m, i) => <ChatMessage key={i} msg={m} />)}
          </div>

          <form onSubmit={sendChat} className="p-4 border-t border-slate-700/50 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={chatBusy}
              placeholder="Ask about this document…"
              className="flex-1 bg-slate-900 border border-slate-600 focus:border-vault-accent rounded-xl px-4 py-2 text-sm text-white outline-none placeholder:text-slate-600 transition-colors"
            />
            <button
              type="submit"
              disabled={chatBusy || !input.trim()}
              className="bg-vault-accent hover:bg-sky-400 text-slate-900 font-black px-4 py-2 rounded-xl transition-colors disabled:opacity-50 text-sm"
            >
              {chatBusy ? '…' : 'Send'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
