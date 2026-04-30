import { useI18n } from '../hooks/useI18n'

export default function ShareBanner({ shareLink, vaultShareLink, result }) {
  const { t } = useI18n()

  const copyAndOpen = () => {
    navigator.clipboard.writeText(shareLink).catch(() => {})
    window.open(shareLink, '_blank')
  }

  const printPassport = () => {
    if (!result) return
    const { trust_info: trust, analysis } = result
    const adv = trust?.advantage ?? {}
    const w = window.open('', '_blank')
    w.document.write(`<!DOCTYPE html><html>
<head>
  <title>Trust Passport — Global TrustDrive</title>
  <style>
    body{font-family:'Helvetica Neue',sans-serif;max-width:794px;margin:40px auto;padding:0 48px;color:#0f172a}
    .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #0369a1;padding-bottom:20px;margin-bottom:28px}
    h1{color:#0369a1;margin:0;font-size:26px;font-weight:900;letter-spacing:-0.02em}
    .sub{color:#64748b;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;margin-top:4px}
    .score{font-size:72px;font-weight:900;color:#0369a1;line-height:1;text-align:right}
    .level{font-size:12px;font-weight:700;background:#0c4a6e;color:white;padding:3px 12px;border-radius:100px;display:inline-block;margin-top:6px}
    h2{color:#0369a1;font-size:12px;text-transform:uppercase;letter-spacing:0.15em;border-bottom:1px solid #e2e8f0;padding-bottom:8px;margin:24px 0 12px}
    pre{white-space:pre-wrap;font-family:inherit;line-height:1.7;font-size:13px;color:#334155}
    .stars{font-size:20px;color:#d97706;margin:4px 0}
    .footer{margin-top:40px;font-size:10px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:12px}
    @media print{button{display:none}}
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>GLOBAL TRUSTDRIVE</h1>
      <div class="sub">Trust Passport · AI-Native Credential Certificate</div>
    </div>
    <div>
      <div class="score">${trust?.score ?? '--'}</div>
      <div class="level">${trust?.level ?? ''}</div>
    </div>
  </div>
  <h2>Identity Assurance Level</h2>
  <p>IAL: ${trust?.ial ?? '--'} &nbsp;·&nbsp; ${analysis?.standard_info?.name ?? ''} (${analysis?.standard_info?.code ?? ''})</p>
  <div class="stars">${'★'.repeat(adv.stars ?? 0)}${'☆'.repeat(5 - (adv.stars ?? 0))}</div>
  <p>${adv.analysis ?? ''}</p>
  <h2>VaultSage AI Deep Analysis</h2>
  <pre>${analysis?.advantage_analysis ?? ''}</pre>
  <h2>Standardized Metrics</h2>
  <p><strong>${analysis?.converted_metrics?.val ?? ''}</strong> &nbsp;·&nbsp; ${analysis?.converted_metrics?.system ?? ''}</p>
  <p>${analysis?.converted_metrics?.detail ?? ''}</p>
  <div class="footer">
    Generated: ${new Date().toISOString()} &nbsp;·&nbsp; Document ID: ${analysis?.doc_id ?? ''}<br>
    Global TrustDrive v7.0 · Powered by VaultSage AI · #vaultsage<br>
    AI-generated for reference only. Official verification required for legal use.
  </div>
  <script>setTimeout(()=>window.print(),400)</script>
</body></html>`)
    w.document.close()
  }

  return (
    <div className="glass rounded-[2rem] p-8 border-l-[6px] border-l-vault-accent bg-gradient-to-r from-vault-accent/10 to-transparent shadow-2xl space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 bg-vault-accent/20 rounded-[1.25rem] flex items-center justify-center text-vault-accent shadow-inner shrink-0">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-black text-white uppercase tracking-widest mb-1">{t('smartdrop')}</p>
            <p className="text-[11px] text-vault-accent font-mono opacity-80 truncate max-w-[280px]">{shareLink}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={printPassport}
            className="px-6 py-3 bg-vault-gold/20 border border-vault-gold/40 text-vault-gold font-black rounded-2xl text-[11px] uppercase tracking-[0.15em] hover:bg-vault-gold/30 transition-all"
          >
            {t('trustPassport')}
          </button>
          <button
            onClick={copyAndOpen}
            className="px-6 py-3 bg-vault-accent text-vault-900 font-black rounded-2xl text-[11px] uppercase tracking-[0.15em] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-vault-accent/30"
          >
            {t('openViewer')}
          </button>
        </div>
      </div>

      {vaultShareLink && (
        <div className="flex items-center gap-3 pt-3 border-t border-white/5">
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">VaultSage Native Share:</span>
          <a href={vaultShareLink} target="_blank" rel="noopener noreferrer"
            className="text-[10px] text-vault-accent font-mono hover:underline truncate">
            {vaultShareLink}
          </a>
        </div>
      )}
    </div>
  )
}
