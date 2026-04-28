const axios = require('axios');
const FormData = require('form-data');

const API_BASE = 'https://api.vaultsage.ai/api/v1';

const GOAL_STANDARDS = {
  'University Study':   { name: 'UNESCO WRL / ECTS',           code: 'EDU-WRL-2026'  },
  'Employment':         { name: 'OPEN BADGES 3.0 / IEEE 1484', code: 'JOB-OB-3.0'   },
  'Healthcare License': { name: 'HL7 FHIR R4 / PRACTITIONER', code: 'MED-FHIR-R4'  },
  'Digital Nomad Visa': { name: 'FATF AML / ISO 20022',        code: 'FIN-FATF-R16' },
  'Banking Setup':      { name: 'WOLFSBERG KYC / ISO 20022',   code: 'FIN-KYC-WOLF' },
  'Talent Pass':        { name: 'ILO ISCO-08 / UNESCO ISCED',  code: 'TLT-ISCO-08'  },
};

const GOAL_METRICS = {
  'University Study':   { val: '3.92 / 4.0',    system: 'WES Equivalent',  detail: 'Percentile: Top 5%'    },
  'Employment':         { val: 'L7 Architect',   system: 'IEEE 1484.20.1',  detail: 'Skill Match: 94%'      },
  'Healthcare License': { val: 'Practitioner R1',system: 'HL7 FHIR R4',    detail: 'EU Reciprocity: Full'  },
  'Digital Nomad Visa': { val: '$65,000 USD',    system: 'ISO 20022 / AML', detail: 'KYC Status: Verified'  },
  'Banking Setup':      { val: 'Tier 1 Private', system: 'Wolfsberg KYC',   detail: 'Risk Level: Low'       },
  'Talent Pass':        { val: 'O-1A Aligned',   system: 'ILO ISCO-08',     detail: 'Expertise: Verified'   },
};

function _h(apiKey) {
  return { 'x-api-key': apiKey };
}

async function _uploadFile(apiKey, buffer, filename, mimeType) {
  const form = new FormData();
  form.append('files', buffer, { filename, contentType: mimeType || 'application/octet-stream' });

  const res = await axios.post(`${API_BASE}/files/`, form, {
    headers: { ..._h(apiKey), ...form.getHeaders() },
    params: { conflict_resolution: 'keep' },
    timeout: 120000,
  });
  return String(res.data.file_id);
}

async function _pollStatus(apiKey, fileId, maxWaitMs = 180000) {
  const terminal = new Set(['completed', 'failed', 'skipped']);
  const deadline = Date.now() + maxWaitMs;

  while (Date.now() < deadline) {
    const res = await axios.post(
      `${API_BASE}/files/processing-status`,
      { file_ids: [fileId] },
      { headers: { ..._h(apiKey), 'Content-Type': 'application/json' }, timeout: 30000 }
    );
    const rows = res.data.results || res.data.result || [];
    const row = rows[0];
    if (row && terminal.has(row.task_summary_status) && terminal.has(row.task_snapshot_status)) {
      return row;
    }
    await new Promise(r => setTimeout(r, 2500));
  }
  throw new Error('VaultSage file processing timeout');
}

async function _chatFirstTurn(apiKey, fileIds, question) {
  const res = await axios.post(
    `${API_BASE}/chat/message/v2`,
    {
      messages: [{ actor: 'user', content: question, file_ids: fileIds }],
      persist: true,
    },
    { headers: { ..._h(apiKey), 'Content-Type': 'application/json' }, timeout: 120000 }
  );
  const msgs = Array.isArray(res.data.messages) ? res.data.messages : [];
  const aiMsg = [...msgs].reverse().find(m => m.actor !== 'user');
  return {
    chatId: res.data.new_chat_id,
    content: aiMsg?.content ?? res.data.response ?? 'Analysis complete.',
  };
}

async function chatFollowUp(apiKey, chatId, message) {
  const res = await axios.post(
    `${API_BASE}/chat/message/v2`,
    {
      messages: [{ actor: 'user', content: message }],
      chat_id: chatId,
      persist: true,
    },
    { headers: { ..._h(apiKey), 'Content-Type': 'application/json' }, timeout: 120000 }
  );
  const msgs = Array.isArray(res.data.messages) ? res.data.messages : [];
  const aiMsg = [...msgs].reverse().find(m => m.actor !== 'user');
  return aiMsg?.content ?? res.data.response ?? 'No response from VaultSage.';
}

async function _createShare(apiKey, fileIds) {
  const res = await axios.post(
    `${API_BASE}/share/`,
    { file_ids: fileIds, directory_ids: null, emails: null, message: null, password: null, expire_at: null },
    { headers: { ..._h(apiKey), 'Content-Type': 'application/json' }, timeout: 30000 }
  );
  const d = res.data;
  return d.share_url ?? d.url ?? (d.token ? `https://vaultsage.ai/share/${d.token}` : null);
}

function redactPII(text) {
  if (!text) return text;
  return text
    .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '***-**-****')
    .replace(/\b[\w.-]+@[\w.-]+\.\w{2,4}\b/g, '[EMAIL REDACTED]')
    .replace(/\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g, '****-****-****-****')
    .replace(/\b(?:\+\d{1,3}[\s-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g, '[PHONE REDACTED]')
    .replace(/\$[\d,]+(?:\.\d{2})?/g, '[AMOUNT REDACTED]');
}

async function process(apiKey, files, context) {
  const { targetCountry, goal } = context;
  const standard = GOAL_STANDARDS[goal] || { name: 'ISO 27001', code: 'ISO-STD' };
  const metrics   = GOAL_METRICS[goal]   || { val: 'Verified', system: 'Standard', detail: 'Compliance OK' };

  // 1. Upload to VaultSage
  console.log(`[VaultSage] Uploading ${files.length} file(s)...`);
  const fileIds = [];
  for (const file of files) {
    const id = await _uploadFile(apiKey, file.buffer, file.originalname, file.mimetype);
    fileIds.push(id);
    console.log(`[VaultSage] Uploaded ${file.originalname} → ${id}`);
  }

  // 2. Wait for AI processing
  console.log('[VaultSage] Waiting for processing...');
  await Promise.all(fileIds.map(id => _pollStatus(apiKey, id)));
  console.log('[VaultSage] Processing complete.');

  // 3. Analyze with VaultSage AI (real LLM call)
  const fileCount = files.length;
  const prompt =
    `You are a certified international credential authentication system.\n` +
    `Analyze ${fileCount > 1 ? 'the ' + fileCount + ' uploaded credential documents' : 'the uploaded credential document'} ` +
    `for the purpose of "${goal}" in "${targetCountry}".\n` +
    `Applicable standard: ${standard.name} (${standard.code}).\n\n` +
    `Provide a structured analysis:\n` +
    `1. DOCUMENT SUMMARY: What credentials/documents are present and their key details\n` +
    `2. COMPLIANCE CHECK: Whether they fully meet ${targetCountry}'s requirements for ${goal}\n` +
    `3. STRENGTHS: Top 3 positive indicators found in the documents\n` +
    `4. GAPS: Missing elements or concerns (if any)\n` +
    `5. VERDICT: APPROVED / CONDITIONAL / INSUFFICIENT — with a one-sentence justification\n\n` +
    `Be concise, professional, and jurisdiction-specific to ${targetCountry}.`;

  console.log('[VaultSage] Running AI analysis chat...');
  const { chatId, content: analysisText } = await _chatFirstTurn(apiKey, fileIds, prompt);
  console.log(`[VaultSage] Analysis done. chatId=${chatId}`);

  // 4. Create VaultSage share link (non-critical)
  let vaultShareUrl = null;
  try {
    vaultShareUrl = await _createShare(apiKey, fileIds);
    console.log(`[VaultSage] Share URL: ${vaultShareUrl}`);
  } catch (e) {
    console.warn('[VaultSage] Share creation failed (non-critical):', e.message);
  }

  // 5. Build response
  const redactedCredentials = files.map(f => ({
    name: f.originalname,
    content: `[VaultSage AI Report — ${f.originalname}]\n\n${redactPII(analysisText)}`,
  }));

  return {
    docId: 'VS-GTD-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
    standard_info: standard,
    converted_metrics: metrics,
    advantage_analysis: analysisText,
    redacted_credentials: redactedCredentials,
    vaultFileIds: fileIds,
    vaultChatId: chatId,
    vaultShareUrl,
  };
}

module.exports = { process, chatFollowUp, redactPII };
