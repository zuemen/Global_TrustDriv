import { useState } from 'react'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import DocumentViewer from '../components/DocumentViewer'
import AnalysisPanel from '../components/AnalysisPanel'
import GapAdvisor from '../components/GapAdvisor'
import ShareBanner from '../components/ShareBanner'

const FALLBACK_IMG = 'https://cdn.pixabay.com/photo/2013/07/12/15/20/document-149692_1280.png'

const DEMO_DATA = {
  Study: {
    goal: 'University Study', country: 'Germany',
    docs: [
      { name: 'Academic_Transcript.pdf',  img: 'https://cdn.pixabay.com/photo/2013/07/12/15/20/document-149692_1280.png',
        content: 'Student: Michael Chen. GPA: 3.8/4.0. 128 credits in Computer Science. Issuer: National University of Technology.' },
      { name: 'Degree_Certificate.pdf',   img: 'https://cdn.pixabay.com/photo/2012/04/18/22/07/certificate-38036_1280.png',
        content: 'Degree: Bachelor of Science in Computer Science. Issued: 2024-06. Conferred by: National University of Technology.' },
      { name: 'Bank_Statement.pdf',       img: 'https://cdn.pixabay.com/photo/2016/09/01/16/07/cash-1636540_1280.png',
        content: 'Account holder: Chen Family. Balance sufficient for tuition and living costs. Verified by Global Trust Bank.' },
    ],
  },
  Career: {
    goal: 'Employment', country: 'Singapore',
    docs: [
      { name: 'Employment_Letter.pdf',    img: FALLBACK_IMG,
        content: 'Position: Senior Software Architect at GlobalTech Ltd. Tenure: 2018–2024. HR-verified letter of good standing.' },
      { name: 'Tax_Document.pdf',         img: 'https://cdn.pixabay.com/photo/2014/12/21/23/34/check-575778_1280.png',
        content: 'Annual Tax Return 2023. Filed and accepted. Income declared per local jurisdiction. Verified by tax authority.' },
    ],
  },
  Taiwan: {
    goal: 'University Study', country: 'Germany',
    docs: [
      { name: '成績單_NCCU_Transcript.pdf', img: FALLBACK_IMG,
        content: 'Student: 陳明志. GPA: 3.7/4.0. National Chengchi University (NCCU), Dept. of International Affairs. 128 credits.' },
      { name: 'Degree_Certificate_NCCU.pdf', img: 'https://cdn.pixabay.com/photo/2012/04/18/22/07/certificate-38036_1280.png',
        content: 'Bachelor of Arts in International Affairs. Issued: 2024-06. National Chengchi University (國立政治大學).' },
      { name: 'CTBC_Bank_Statement.pdf',     img: 'https://cdn.pixabay.com/photo/2016/09/01/16/07/cash-1636540_1280.png',
        content: 'Account holder: 陳明志. CTBC Bank (中國信託). Balance: TWD 820,000. Certified for overseas study application.' },
    ],
  },
  Korea: {
    goal: 'Talent Pass', country: 'Singapore',
    docs: [
      { name: '재직증명서_Kakao_Employment.pdf', img: FALLBACK_IMG,
        content: 'Certificate of Employment. Company: Kakao Corp (카카오). Position: Senior Software Engineer. Period: 2020–2024.' },
      { name: '소득금액증명_Tax_Certificate.pdf', img: 'https://cdn.pixabay.com/photo/2014/12/21/23/34/check-575778_1280.png',
        content: 'Korean National Tax Service (국세청) — Income Verification. 2023 Income: KRW 58,000,000. Verified stamp.' },
    ],
  },
}

const STEPS = ['upload', 'process', 'analyze', 'report']

export default function MainPage() {
  const [jurisdiction, setJurisdiction] = useState('USA')
  const [goal,         setGoal]         = useState('University Study')
  const [files,        setFiles]        = useState([])
  const [previews,     setPreviews]     = useState([])
  const [fileLabel,    setFileLabel]    = useState('')
  const [loading,      setLoading]      = useState(false)
  const [activeStep,   setActiveStep]   = useState(null)
  const [result,       setResult]       = useState(null)
  const [docId,        setDocId]        = useState(null)

  const handleFilesChange = (e) => {
    const selected = Array.from(e.target.files)
    setFiles(selected)
    setPreviews(selected.map(f => ({ name: f.name, img: FALLBACK_IMG })))
    setFileLabel(`${selected.length} FILE(S) READY`)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const dropped = Array.from(e.dataTransfer.files)
    setFiles(dropped)
    setPreviews(dropped.map(f => ({ name: f.name, img: FALLBACK_IMG })))
    setFileLabel(`${dropped.length} FILE(S) READY`)
  }

  const handleDemo = (type) => {
    const d = DEMO_DATA[type]
    if (!d) return
    setJurisdiction(d.country)
    setGoal(d.goal)
    setFiles(d.docs.map(doc => new File([doc.content], doc.name, { type: 'text/plain' })))
    setPreviews(d.docs)
    setFileLabel(`SCENARIO: ${d.goal.toUpperCase()} LOADED`)
    setResult(null)
    setDocId(null)
  }

  const handleSubmit = async () => {
    if (!files.length) {
      alert('System requires document injection. Load a demo or upload files.')
      return
    }

    setLoading(true)
    setResult(null)
    setDocId(null)
    setActiveStep('upload')

    const formData = new FormData()
    files.forEach(f => formData.append('documents', f))
    formData.append('targetCountry', jurisdiction)
    formData.append('goal', goal)

    try {
      const res = await fetch('/api/trust-notary', { method: 'POST', body: formData })

      setActiveStep('process')
      await new Promise(r => setTimeout(r, 400))
      setActiveStep('analyze')

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || err.error || `HTTP ${res.status}`)
      }

      const data = await res.json()
      setActiveStep('report')
      await new Promise(r => setTimeout(r, 600))

      setResult(data)
      setDocId(data.analysis?.doc_id ?? null)
    } catch (err) {
      alert('VaultSage Error: ' + err.message)
      console.error(err)
    } finally {
      setLoading(false)
      setActiveStep(null)
    }
  }

  const previewFilename = previews.map(p => p.name).join(' · ')

  return (
    <div className="min-h-screen">
      {/* Background blobs */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-vault-accent/10 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[120px] rounded-full" />
      </div>

      <Navbar />

      <main className="max-w-[1700px] mx-auto mt-10 px-4 md:px-8 xl:px-10 grid grid-cols-1 xl:grid-cols-12 gap-8 pb-24">
        <Sidebar
          jurisdiction={jurisdiction} setJurisdiction={setJurisdiction}
          goal={goal}                 setGoal={setGoal}
          fileLabel={fileLabel}
          onFilesChange={handleFilesChange}
          onDrop={handleDrop}
          onSubmit={handleSubmit}
          onDemo={handleDemo}
          loading={loading}
          activeStep={activeStep}
        />

        <div className="xl:col-span-9 space-y-8">
          <div className={`grid grid-cols-1 lg:grid-cols-12 gap-8 transition-all duration-1000 ${!result && !loading ? 'opacity-40 grayscale' : ''}`}>
            {/* Document viewer (left) */}
            <div className="lg:col-span-7 space-y-6">
              <DocumentViewer
                previews={previews}
                isScanning={loading}
                filename={previewFilename}
              />
              {result?.share_link && (
                <ShareBanner
                  shareLink={result.share_link}
                  vaultShareLink={result.vault_share_link}
                  result={result}
                />
              )}
            </div>

            {/* Analysis panel (right) */}
            <AnalysisPanel result={result} />
          </div>

          {/* Deep analysis */}
          {result && (
            <div className="glass rounded-[3rem] p-10 md:p-12 border border-indigo-500/20 shadow-2xl fade-up">
              <div className="flex items-start gap-8">
                <div className="w-16 h-16 bg-indigo-500/20 rounded-[1.5rem] flex items-center justify-center text-indigo-400 shrink-0 shadow-2xl shadow-indigo-500/10">
                  <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-black text-sm md:text-base uppercase tracking-[0.3em] mb-5">
                    VaultSage AI Deep Analysis Verdict
                  </h3>
                  <p className="text-slate-400 text-sm md:text-base font-serif italic leading-relaxed whitespace-pre-wrap">
                    {result.analysis?.advantage_analysis ?? 'Awaiting data input…'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Gap Advisor */}
          {docId && <GapAdvisor docId={docId} />}
        </div>
      </main>
    </div>
  )
}
