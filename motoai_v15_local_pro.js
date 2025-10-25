/* motoai_v15_local_pro.js
   MotoAI v15 — Local Pro (phi-2 ready)
   - Tries to init WebLLM phi-2 if available (WebGPU capable)
   - Graceful fallback to rule-based + corpus retrieval
   - Auto-learn from sitemap (/moto_sitemap.json) into localStorage
   - Lightweight UI bubble (non-destructive)
*/
(function(){
  if(window.MotoAI_v15_LOADED) return;
  window.MotoAI_v15_LOADED = true;
  console.log('%c🚀 MotoAI v15 Local Pro (phi-2 ready) loading...', 'color:#0a84ff;font-weight:bold');

  /* ---------- CONFIG ---------- */
  const CFG = {
    sitemap: '/moto_sitemap.json',
    extendedCorpusKey: 'MotoAI_v15_corpus_ext',
    corpusKey: 'MotoAI_v15_corpus_dom',
    lastLearnKey: 'MotoAI_v15_lastLearn',
    sitemapVersionKey: 'MotoAI_lastSitemapVersion',
    refreshHours: 72,
    uiZIndex: 2147483000
  };

  /* ---------- Minimal UI inject (non-destructive) ---------- */
  const html = `
  <div id="motoai-v15-root" aria-hidden="false">
    <div id="motoai-v15-bubble" role="button" aria-label="Open MotoAI">🤖</div>
    <div id="motoai-v15-overlay" aria-hidden="true">
      <div id="motoai-v15-card" role="dialog" aria-modal="true" aria-hidden="true">
        <div id="motoai-v15-handle"></div>
        <header id="motoai-v15-header">
          <div class="m-title">MotoAI Local Pro</div>
          <div class="m-tools">
            <button id="motoai-v15-clear" title="Clear">🗑</button>
            <button id="motoai-v15-close" title="Close">✕</button>
          </div>
        </header>
        <main id="motoai-v15-body" tabindex="0" role="log" aria-live="polite"></main>
        <div id="motoai-v15-suggestions" role="toolbar" aria-label="Quick suggestions"></div>
        <footer id="motoai-v15-footer">
          <div id="motoai-v15-typing" aria-hidden="true"></div>
          <input id="motoai-v15-input" placeholder="Nhập câu hỏi..." autocomplete="off" aria-label="Nhập câu hỏi"/>
          <button id="motoai-v15-send">Gửi</button>
        </footer>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', html);

  const css = `
  #motoai-v15-root{position:fixed;left:16px;bottom:18px;z-index:${CFG.uiZIndex};pointer-events:none}
  #motoai-v15-bubble{pointer-events:auto;width:56px;height:56px;border-radius:14px;display:flex;align-items:center;justify-content:center;
    font-size:26px;background:#007aff;color:#fff;box-shadow:0 10px 28px rgba(2,6,23,0.18);cursor:pointer;transition:transform .16s}
  #motoai-v15-bubble:hover{transform:scale(1.06)}
  #motoai-v15-overlay{position:fixed;inset:0;display:flex;align-items:flex-end;justify-content:center;padding:12px;pointer-events:none;transition:background .24s ease}
  #motoai-v15-overlay.visible{background:rgba(0,0,0,0.18);pointer-events:auto}
  #motoai-v15-card{width:min(920px,calc(100% - 36px));max-width:920px;border-radius:18px;height:64vh;max-height:720px;min-height:320px;background:rgba(255,255,255,0.9);backdrop-filter:blur(10px);box-shadow:0 -18px 60px rgba(0,0,0,.22);display:flex;flex-direction:column;overflow:hidden;transform:translateY(110%);opacity:0;pointer-events:auto;transition:transform .36s cubic-bezier(.2,.9,.2,1),opacity .28s}
  #motoai-v15-overlay.visible #motoai-v15-card{transform:translateY(0);opacity:1}
  #motoai-v15-handle{width:64px;height:6px;background:rgba(160,160,160,0.6);border-radius:6px;margin:10px auto}
  #motoai-v15-header{display:flex;align-items:center;justify-content:space-between;padding:8px 14px;font-weight:700;color:#007aff;border-bottom:1px solid rgba(0,0,0,0.06)}
  #motoai-v15-body{flex:1;overflow:auto;padding:12px 16px;font-size:15px}
  .m-msg{margin:8px 0;padding:12px 14px;border-radius:16px;max-width:86%;line-height:1.4;word-break:break-word}
  .m-msg.bot{background:rgba(255,255,255,0.92);color:#111}
  .m-msg.user{background:linear-gradient(180deg,#007aff,#00b6ff);color:#fff;margin-left:auto}
  #motoai-v15-suggestions{display:flex;gap:8px;justify-content:center;padding:8px 12px;border-top:1px solid rgba(0,0,0,0.04);flex-wrap:wrap;background:rgba(255,255,255,0.6);backdrop-filter:blur(8px)}
  #motoai-v15-suggestions button{border:none;background:rgba(0,122,255,0.08);color:#007aff;padding:8px 12px;border-radius:12px;cursor:pointer}
  #motoai-v15-footer{display:flex;align-items:center;gap:8px;padding:10px;border-top:1px solid rgba(0,0,0,0.06);background:rgba(255,255,255,0.7);backdrop-filter:blur(8px)}
  #motoai-v15-input{flex:1;padding:10px;border-radius:12px;border:1px solid rgba(0,0,0,0.08);font-size:15px}
  #motoai-v15-send{background:#007aff;color:#fff;border:none;border-radius:10px;padding:10px 14px;cursor:pointer}
  @media (max-width:520px){#motoai-v15-card{width:calc(100% - 24px);height:78vh}}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  /* ---------- State & DOM refs ---------- */
  const $ = sel => document.querySelector(sel);
  const root = $('#motoai-v15-root'), bubble = $('#motoai-v15-bubble'), overlay = $('#motoai-v15-overlay');
  const card = $('#motoai-v15-card'), bodyEl = $('#motoai-v15-body'), inputEl = $('#motoai-v15-input');
  const sendBtn = $('#motoai-v15-send'), closeBtn = $('#motoai-v15-close'), clearBtn = $('#motoai-v15-clear');
  const suggestionsWrap = $('#motoai-v15-suggestions'), typingEl = $('#motoai-v15-typing');

  let isOpen = false, sendLock = false;
  let domCorpus = []; // from DOM / localStorage
  let extCorpus = []; // extended corpus (sitemap / txt)
  let webllmModel = null;
  let webllmReady = false;

  /* ---------- Helpers ---------- */
  function tokenize(s){ return (s||'').toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu,' ').split(/\s+/).filter(Boolean); }
  function uniqArr(a){ return Array.from(new Set(a)); }
  function norm(s){ return (s||'').toString().trim(); }
  function showTyping(){ typingEl.innerHTML = '<span>...</span>'; typingEl.style.opacity='1'; }
  function hideTyping(){ typingEl.innerHTML=''; typingEl.style.opacity='0'; }

  /* ---------- Basic rule set (fallback) ---------- */
  const RULES = [
    { pattern: /(xe số|xeso|wave|sirius|blade|future|winner)/i, answer: "Xe số tiết kiệm xăng, phù hợp đi phố và đi đường dài. Giá thuê tham khảo: theo ngày/tuần/tháng — hỏi cụ thể để mình báo giá." },
    { pattern: /(xe ga|xega|vision|air blade|lead|pcx)/i, answer: "Xe tay ga chạy êm, cốp rộng, thích hợp đi phố. Có hỗ trợ thuê theo ngày/tuần/tháng." },
    { pattern: /(50cc|xe 50cc|không cần bằng|khong can bang)/i, answer: "Xe 50cc thường không yêu cầu GPLX, chỉ cần CCCD. Phù hợp học sinh/sinh viên." },
    { pattern: /(thủ tục|thu tuc|giấy tờ|giay to|cọc|dat coc)/i, answer: "Thủ tục cơ bản: CCCD và (nếu có) GPLX. Cọc nhẹ tùy loại xe; cọc hoàn trả khi trả xe." },
    { pattern: /(giá|bảng giá|bao nhiêu|giathue)/i, answer: "Giá tham khảo: xe số ~150k/ngày, xe ga ~120-200k/ngày, thuê tuần/tháng có ưu đãi. Hỏi mẫu xe để báo chính xác." },
    { pattern: /(liên hệ|lien he|zalo|sdt|hotline)/i, answer: "Liên hệ: 0857 255 868 (Zalo/Hotline) để đặt xe hoặc hỏi thêm." }
  ];

  function ruleAnswer(q){
    for(const r of RULES){
      if(r.pattern.test(q)) return r.answer;
    }
    return null;
  }

  /* ---------- UI message helpers ---------- */
  function addMessage(role, text){
    if(!text && text!==0) return;
    const el = document.createElement('div');
    el.className = 'm-msg ' + (role === 'user' ? 'user' : 'bot');
    el.textContent = text;
    bodyEl.appendChild(el);
    bodyEl.scrollTop = bodyEl.scrollHeight;
    return el;
  }

  /* ---------- Corpus build & restore ---------- */
  function buildDomCorpus(){
    try{
      const raw = localStorage.getItem(CFG.corpusKey);
      if(raw){
        domCorpus = JSON.parse(raw);
        if(Array.isArray(domCorpus) && domCorpus.length) return;
      }
    }catch(e){ domCorpus = []; }

    try{
      const nodes = Array.from(document.querySelectorAll('main, article, section, p, li, h1,h2,h3'));
      const texts = nodes.map(n => (n.innerText||'').trim()).filter(t => t.length > 20);
      const uniqTexts = uniqArr(texts).slice(0, 600);
      domCorpus = uniqTexts;
      try{ localStorage.setItem(CFG.corpusKey, JSON.stringify(domCorpus)); }catch(e){}
    }catch(e){ domCorpus = []; }
  }

  async function loadSitemapAndBuildExtended(){
    try{
      const now = Date.now();
      const last = parseInt(localStorage.getItem(CFG.lastLearnKey)||'0',10);
      if(last && (now - last) < CFG.refreshHours*3600*1000){
        // try to restore existing
        const raw = localStorage.getItem(CFG.extendedCorpusKey);
        if(raw) { extCorpus = JSON.parse(raw); return; }
      }

      const res = await fetch(CFG.sitemap, {cache:'no-store'});
      if(!res.ok) { console.warn('MotoAI v15: sitemap not found'); return; }
      const data = await res.json();
      if(!data.pages || !Array.isArray(data.pages)) return;
      const pages = data.pages.slice(0, 400); // limit
      const allTexts = [];

      for(const p of pages){
        try{
          const r = await fetch(p, {cache:'no-store'});
          if(!r.ok) continue;
          const txt = await r.text();
          // simple extraction
          const tmp = document.createElement('div');
          tmp.innerHTML = txt;
          const segs = Array.from(tmp.querySelectorAll('p,h1,h2,h3,li')).map(n => (n.textContent||'').trim()).filter(t=>t.length>40);
          segs.forEach(s=> allTexts.push(s));
        }catch(e){ /* ignore per URL */ }
      }
      extCorpus = uniqArr(allTexts).slice(0, 1200);
      try{ localStorage.setItem(CFG.extendedCorpusKey, JSON.stringify(extCorpus)); localStorage.setItem(CFG.lastLearnKey, Date.now()); }catch(e){}
      console.log('📚 MotoAI v15: extended corpus built:', extCorpus.length);
    }catch(e){ console.error('MotoAI v15 sitemap load error', e); }
  }

  /* ---------- Retrieval from corpora ---------- */
  function retrieveFromArray(q, arr){
    if(!q || !arr || !arr.length) return null;
    const tokens = tokenize(q).filter(t=>t.length>1);
    if(!tokens.length) return null;
    let best = {score:0, text:null};
    for(const line of arr){
      const lower = line.toLowerCase();
      let s=0;
      for(const t of tokens) if(lower.includes(t)) s++;
      if(s>best.score){ best={score:s, text:line}; }
    }
    return best.score>0 ? best.text : null;
  }

  /* ---------- WebLLM (phi-2) init attempt ---------- */
  async function tryInitWebLLM(){
    try{
      // Many WebLLM runtimes expose a global createModel / WebLLM API.
      // This block is best-effort — actual init depends on runtime you use.
      if(window.WebLLM && typeof window.WebLLM.createModel === 'function'){
        console.log('MotoAI v15: WebLLM runtime detected, attempting to load phi-2...');
        // Example usage — adapt per your WebLLM runtime API
        webllmModel = await window.WebLLM.createModel({
          model: 'phi-2', // runtime must support this identifier
          quantization: 'q4f16' // optional
        });
        webllmReady = true;
        console.log('✅ MotoAI v15: WebLLM model ready (phi-2)');
        return;
      }
      // Ollama in-browser (example) or other providers might expose different globals.
      if(window.Ollama && typeof window.Ollama.fetch === 'function'){
        webllmReady = true; // we will use fetch to call local Ollama if needed
        console.log('ℹ️ MotoAI v15: Ollama client detected (will use remote/local Ollama).');
        return;
      }
      // If no runtime, skip — we'll fallback to local retrieval + rules
      console.log('ℹ️ MotoAI v15: No WebLLM runtime detected, fallback mode.');
    }catch(e){
      console.warn('MotoAI v15: WebLLM init failed', e);
    }
  }

  /* ---------- Compose answer (tries WebLLM -> rules -> retrieval) ---------- */
  async function composeAnswer(q){
    const qnorm = norm(q);
    if(!qnorm) return '';

    // 1) Quick rule
    const r = ruleAnswer(qnorm);
    if(r) return r;

    // 2) Try DOM corpus
    const domAns = retrieveFromArray(qnorm, domCorpus);
    if(domAns) return domAns;

    // 3) Try extended corpus
    const extAns = retrieveFromArray(qnorm, extCorpus);
    if(extAns) return extAns;

    // 4) Try WebLLM if available: best-effort usage
    if(webllmReady && webllmModel){
      try{
        // Example simple call - adapt to actual API of your runtime.
        const prompt = `Bạn là trợ lý về thuê xe máy tại Hà Nội. Trả lời ngắn gọn cho câu hỏi: "${qnorm}"`;
        const out = await webllmModel.generate({prompt, maxTokens: 256});
        if(out && out.text) return out.text.trim();
      }catch(e){
        console.warn('MotoAI v15: webllmModel.generate failed', e);
      }
    } else if (webllmReady && window.Ollama && typeof window.Ollama.fetch === 'function'){
      try{
        // Example for Ollama local/remote (requires Ollama server accessible)
        const resp = await fetch('/ollama', { // <-- replace with your ollama endpoint if configured
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify({model:'phi-2', prompt: `Trợ lý thuê xe: ${qnorm}`})
        });
        if(resp.ok){
          const j = await resp.json();
          if(j && j.output) return j.output;
        }
      }catch(e){ /* ignore */ }
    }

    // 5) Fallback polite message
    return "Xin lỗi, mình chưa tìm thấy câu trả lời chính xác. Bạn thử hỏi: 'giá thuê 1 ngày', 'thủ tục', hoặc 'xe 50cc' nhé.";
  }

  /* ---------- sendQuery (UI hook) ---------- */
  async function sendQuery(q){
    if(!q || !q.trim()) return;
    if(sendLock) return;
    sendLock = true;
    sendBtn.disabled = true;
    hideTyping();
    addMessage('user', q.trim());
    showTyping();

    try{
      const fixed = q.trim();
      // small local spellfix
      const fixed2 = fixed.replace(/thue xe may/gi, 'thuê xe máy');
      // compose
      const ans = await composeAnswer(fixed2);
      hideTyping();
      if(ans && ans.trim()) addMessage('bot', ans);
      else addMessage('bot', 'Xin lỗi, mình không trả lời được câu này.');
    }catch(e){
      hideTyping();
      console.error('MotoAI v15 sendQuery error', e);
      addMessage('bot', 'Lỗi khi xử lý. Thử lại nhé.');
    }finally{
      sendLock = false;
      sendBtn.disabled = false;
      setTimeout(()=> { try{ inputEl.focus(); }catch(e){} }, 120);
    }
  }

  /* ---------- Build suggestions ---------- */
  function buildSuggestions(){
    const tags = [
      {q:'Xe số', label:'🏍 Xe số'},
      {q:'Xe ga', label:'🛵 Xe ga'},
      {q:'Thuê 1 ngày', label:'📅 Thuê 1 ngày'},
      {q:'Thủ tục', label:'📄 Thủ tục'},
      {q:'Xe 50cc', label:'🚲 Xe 50cc'}
    ];
    suggestionsWrap.innerHTML = '';
    tags.forEach(t=>{
      const b = document.createElement('button'); b.type='button'; b.textContent = t.label; b.dataset.q = t.q;
      b.addEventListener('click', ()=> { if(!isOpen) openChat(); setTimeout(()=> sendQuery(t.q), 150); });
      suggestionsWrap.appendChild(b);
    });
  }

  /* ---------- Open/Close ---------- */
  function openChat(){
    if(isOpen) return;
    overlay.classList.add('visible'); card.setAttribute('aria-hidden','false'); overlay.setAttribute('aria-hidden','false');
    isOpen = true; renderSession();
    setTimeout(()=> { try{ inputEl.focus(); }catch(e){} }, 300);
  }
  function closeChat(){
    if(!isOpen) return;
    overlay.classList.remove('visible'); card.setAttribute('aria-hidden','true'); overlay.setAttribute('aria-hidden','true');
    isOpen = false;
    hideTyping();
  }

  /* ---------- Session persistence ---------- */
  function loadSession(){
    try{
      const raw = sessionStorage.getItem('MotoAI_v15_session') || '[]';
      const arr = JSON.parse(raw);
      bodyEl.innerHTML = '';
      if(Array.isArray(arr) && arr.length){
        arr.forEach(m => {
          const el = document.createElement('div'); el.className='m-msg '+(m.role==='user'?'user':'bot'); el.textContent = m.text;
          bodyEl.appendChild(el);
        });
        bodyEl.scrollTop = bodyEl.scrollHeight;
      } else {
        addMessage('bot', '👋 Xin chào! Mình là MotoAI — hỏi thử "Xe số", "Xe ga" hoặc "Thủ tục" nhé!');
      }
    }catch(e){
      bodyEl.innerHTML = '';
      addMessage('bot', '👋 Xin chào! Mình là MotoAI — hỏi thử "Xe số", "Xe ga" hoặc "Thủ tục" nhé!');
    }
  }
  function saveSession(){
    try{
      const msgs = Array.from(bodyEl.querySelectorAll('.m-msg')).map(n => ({ role: n.classList.contains('user') ? 'user' : 'bot', text: n.textContent }));
      sessionStorage.setItem('MotoAI_v15_session', JSON.stringify(msgs));
    }catch(e){}
  }
  function renderSession(){ loadSession(); }

  /* ---------- Event binding ---------- */
  function bindEvents(){
    bubble.addEventListener('click', ()=> isOpen ? closeChat() : openChat());
    overlay.addEventListener('click', (e)=> { if(e.target === overlay) closeChat(); });
    closeBtn.addEventListener('click', closeChat);
    clearBtn.addEventListener('click', ()=> { bodyEl.innerHTML=''; addMessage('bot','🗑 Đã xóa hội thoại.'); saveSession(); });
    sendBtn.addEventListener('click', ()=> { const v=(inputEl.value||'').trim(); if(!v) return; inputEl.value=''; sendQuery(v); saveSession(); });
    inputEl.addEventListener('keydown', (e)=> { if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); const v=(inputEl.value||'').trim(); if(!v) return; inputEl.value=''; sendQuery(v); saveSession(); } });
    // save session on unload
    window.addEventListener('beforeunload', saveSession);
  }

  /* ---------- Init sequence ---------- */
  async function init(){
    buildDomCorpus();
    await loadSitemapAndBuildExtended();
    buildSuggestions();
    bindEvents();
    loadSession();
    // try init WebLLM without blocking UI
    tryInitWebLLM().catch(()=>{});
    console.log('%c✅ MotoAI v15 UI ready (fallback + webllm init scheduled)', 'color:#0a84ff');
  }

  // Auto-check sitemap change: if changed, clear learning so next load rebuilds
  (function checkSitemapChange(){
    fetch(CFG.sitemap).then(r => {
      if(!r.ok) return;
      return r.text();
    }).then(t => {
      if(!t) return;
      try{
        const hash = btoa(t);
        const old = localStorage.getItem(CFG.sitemapVersionKey);
        if(old !== hash){
          console.log('🆕 MotoAI v15 detected sitemap change — clearing learned corpus for rebuild.');
          localStorage.removeItem(CFG.extendedCorpusKey);
          localStorage.setItem(CFG.sitemapVersionKey, hash);
          // mark lastLearn to 0 so next load will rebuild; do not force reload here automatically.
          localStorage.removeItem(CFG.lastLearnKey);
        }
      }catch(e){}
    }).catch(()=>{ /* ignore */ });
  })();

  // Expose simple API
  window.MotoAI_v15 = {
    sendQuery,
    rebuildDomCorpus: buildDomCorpus,
    rebuildExtendedCorpus: loadSitemapAndBuildExtended,
    isWebLLMReady: () => webllmReady,
    getExtendedCorpus: () => extCorpus.slice(0,500),
    getDomCorpus: () => domCorpus.slice(0,500)
  };

  // bootstrap
  setTimeout(init, 160);
})();
