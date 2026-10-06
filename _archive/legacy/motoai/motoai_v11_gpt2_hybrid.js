/* ============================================================
 * MotoAI v11 — GPT-2 Hybrid (Single-file: UI + AutoLearn + Brain)
 * - Single JS file (P1 UI) + (P2 AutoLearn/Corpus) + (P3 GPT2-hybrid Brain)
 * - Safe: stopPropagation on input, version-based sitemap refresh
 * - Drop-in: include via <script src="..."></script>
 * ============================================================ */
(function(){
  if(window.MotoAI_v11_LOADED) return;
  window.MotoAI_v11_LOADED = true;
  console.log('%cMotoAI v11 GPT2 Hybrid booting...','color:#0a84ff;font-weight:bold;');

  /* ---------------- CONFIG ---------------- */
  const CFG = {
    ui: {
      accent: '#007aff',
      corpusKey: 'MotoAI_v11_corpus',          // corpus from DOM + txt
      extendedKey: 'MotoAI_v11_corpus_ext',    // corpus extended from sitemap + domains
      sessionKey: 'MotoAI_v11_session',
      memoryKey: 'MotoAI_v11_user_name'
    },
    sitemap: 'https://motoopen.github.io/chothuexemayhanoi/moto_sitemap.json',
    extraDomains: [
      'https://thuexemaynguyentu.com',
      'https://athanoi.github.io/moto/'
    ],
    maxCorpusItems: 1200,
    refreshHours: 72, // default refresh window (can be overridden by sitemap.meta)
    memoryWindow: 5,  // short-term dialog memory
    minSentenceLength: 20
  };

  /* ---------------- P1: UI inject (Apple style) ---------------- */
  const html = `
  <div id="motoai-v11-root" aria-hidden="false">
    <div id="motoai-v11-bubble" role="button" aria-label="Mở MotoAI">🤖</div>
    <div id="motoai-v11-overlay" aria-hidden="true">
      <div id="motoai-v11-card" role="dialog" aria-modal="true" aria-hidden="true">
        <div id="motoai-v11-handle" aria-hidden="true"></div>
        <header id="motoai-v11-header">
          <div class="title">MotoAI Assistant (v11 GPT2)</div>
          <div class="tools">
            <button id="motoai-v11-clear" title="Xóa cuộc trò chuyện">🗑</button>
            <button id="motoai-v11-close" title="Đóng">✕</button>
          </div>
        </header>
        <main id="motoai-v11-body" tabindex="0" role="log" aria-live="polite"></main>
        <div id="motoai-v11-suggestions" role="toolbar" aria-label="Gợi ý nhanh"></div>
        <footer id="motoai-v11-footer">
          <div id="motoai-v11-typing" aria-hidden="true"></div>
          <input id="motoai-v11-input" placeholder="Nhập câu hỏi..." autocomplete="off" aria-label="Nhập câu hỏi"/>
          <button id="motoai-v11-send" aria-label="Gửi">Gửi</button>
        </footer>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', html);

  const css = `
  :root{--m11-accent:${CFG.ui.accent};--m11-radius:16px}
  #motoai-v11-root{position:fixed;left:16px;bottom:18px;z-index:2147484000;pointer-events:none}
  #motoai-v11-bubble{pointer-events:auto;width:56px;height:56px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:26px;background:var(--m11-accent);color:#fff;cursor:pointer;box-shadow:0 10px 28px rgba(2,6,23,0.18)}
  #motoai-v11-overlay{position:fixed;inset:0;display:flex;align-items:flex-end;justify-content:center;padding:12px;pointer-events:none;transition:background .24s}
  #motoai-v11-overlay.visible{background:rgba(0,0,0,0.18);pointer-events:auto}
  #motoai-v11-card{width:min(920px,calc(100% - 36px));max-width:920px;border-radius:var(--m11-radius) var(--m11-radius) 10px 10px;height:72vh;max-height:760px;min-height:320px;background:rgba(255,255,255,0.92);backdrop-filter:blur(10px);box-shadow:0 -18px 60px rgba(0,0,0,.22);display:flex;flex-direction:column;overflow:hidden;transform:translateY(110%);opacity:0;transition:transform .36s,opacity .28s}
  #motoai-v11-overlay.visible #motoai-v11-card{transform:translateY(0);opacity:1}
  #motoai-v11-header{display:flex;align-items:center;justify-content:space-between;padding:8px 14px;font-weight:700;color:var(--m11-accent);border-bottom:1px solid rgba(0,0,0,0.06)}
  #motoai-v11-body{flex:1;overflow:auto;padding:12px 16px;font-size:15px}
  .m-msg{margin:8px 0;padding:12px 14px;border-radius:14px;max-width:86%;word-break:break-word}
  .m-msg.bot{background:#f5f7fb}
  .m-msg.user{background:linear-gradient(180deg,var(--m11-accent),#00b6ff);color:#fff;margin-left:auto}
  #motoai-v11-suggestions{display:flex;gap:8px;justify-content:center;padding:8px 12px;border-top:1px solid rgba(0,0,0,0.04);flex-wrap:wrap;background:rgba(255,255,255,0.6)}
  #motoai-v11-suggestions button{border:none;background:rgba(0,122,255,0.08);color:var(--m11-accent);padding:8px 12px;border-radius:12px;cursor:pointer}
  #motoai-v11-footer{display:flex;align-items:center;gap:8px;padding:10px;border-top:1px solid rgba(0,0,0,0.06);background:rgba(255,255,255,0.9)}
  #motoai-v11-input{flex:1;padding:10px;border-radius:12px;border:1px solid rgba(0,0,0,0.08);font-size:15px}
  #motoai-v11-send{background:var(--m11-accent);color:#fff;border:none;border-radius:10px;padding:10px 14px;cursor:pointer}
  @media (max-width:520px){#motoai-v11-card{width:calc(100% - 24px);height:78vh}}`;
  const styleEl = document.createElement('style'); styleEl.textContent = css; document.head.appendChild(styleEl);

  /* ---------------- Elements & state ---------------- */
  const $ = sel => document.querySelector(sel);
  const root = $('#motoai-v11-root'), bubble = $('#motoai-v11-bubble'), overlay = $('#motoai-v11-overlay');
  const card = $('#motoai-v11-card'), bodyEl = $('#motoai-v11-body'), inputEl = $('#motoai-v11-input'), sendBtn = $('#motoai-v11-send');
  const closeBtn = $('#motoai-v11-close'), clearBtn = $('#motoai-v11-clear'), suggestionsWrap = $('#motoai-v11-suggestions');
  const typingEl = $('#motoai-v11-typing');

  let isOpen = false, sendLock = false;
  let corpus = [];        // P2: DOM/text corpus
  let extendedCorpus = []; // P2 ext: sitemap + domains
  let sessionMsgs = [];

  /* ---------------- Helpers ---------------- */
  function tokenize(s){
    if(!s) return [];
    return s.toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu,' ').split(/\s+/).filter(Boolean);
  }
  function uniq(arr){ return Array.from(new Set(arr)); }
  function addMessage(role, text){
    const el = document.createElement('div');
    el.className = 'm-msg ' + (role === 'user' ? 'user' : 'bot');
    el.textContent = text;
    bodyEl.appendChild(el);
    bodyEl.scrollTop = bodyEl.scrollHeight;
    sessionMsgs.push({role, text, t: Date.now()});
    try{ sessionStorage.setItem(CFG.ui.sessionKey, JSON.stringify(sessionMsgs)); }catch(e){}
    return el;
  }
  function showTyping(){ typingEl.innerHTML = `<span class="dot">.</span><span class="dot">.</span><span class="dot">.</span>`; typingEl.style.opacity='1'; }
  function hideTyping(){ typingEl.innerHTML=''; typingEl.style.opacity='0'; }

  /* ---------------- Session restore ---------------- */
  (function restoreSession(){
    try{
      const raw = sessionStorage.getItem(CFG.ui.sessionKey);
      if(raw) sessionMsgs = JSON.parse(raw);
    }catch(e){ sessionMsgs = []; }
  })();

  /* ---------------- P2: Corpus builder (DOM) ---------------- */
  function buildCorpusFromDOM(){
    try{
      let nodes = Array.from(document.querySelectorAll('main, article, section'));
      if(!nodes.length) nodes = [document.body];
      let texts = [];
      nodes.forEach(n=>{
        Array.from(n.querySelectorAll('h1,h2,h3,h4')).forEach(h=>{ if(h.innerText && h.innerText.trim().length>10) texts.push(h.innerText.trim()); });
        Array.from(n.querySelectorAll('p, li')).forEach(p=>{ const t = p.innerText.trim(); if(t.length>=CFG.minSentenceLength) texts.push(t); });
      });
      if(!texts.length){
        const meta = document.querySelector('meta[name="description"]');
        if(meta && meta.content) texts.push(meta.content);
        document.body.innerText.split(/[.!?]\s+/).forEach(s=>{ if(s.trim().length>CFG.minSentenceLength) texts.push(s.trim()); });
      }
      const u = uniq(texts).slice(0, CFG.maxCorpusItems);
      corpus = u.map((t,i)=>({id:i, text:t, tokens: tokenize(t)}));
      try{ localStorage.setItem(CFG.ui.corpusKey, JSON.stringify(corpus)); }catch(e){}
      console.log(`📚 MotoAI v11 built DOM corpus: ${corpus.length} items`);
    }catch(e){ console.error(e); corpus = []; }
  }
  (function restoreDOMCorpus(){
    try{
      const raw = localStorage.getItem(CFG.ui.corpusKey);
      if(raw){ const p = JSON.parse(raw); if(Array.isArray(p) && p.length) corpus = p; }
    }catch(e){ corpus = []; }
  })();

  /* ---------------- P2-ext: sitemap + external domains ---------------- */
  async function fetchTextOrHtml(url){
    try{
      const res = await fetch(url, {cache:'no-store', mode:'cors'});
      if(!res.ok) return '';
      const ct = res.headers.get('content-type') || '';
      if(ct.includes('text/plain')) return await res.text();
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html,'text/html');
      const arr = [];
      doc.querySelectorAll('p, h1, h2, h3, li').forEach(el=>{
        const t = (el.innerText||'').trim();
        if(t.length > CFG.minSentenceLength && t.length < 800) arr.push(t);
      });
      return arr.join('\n');
    }catch(e){ console.warn('fetch fail', url, e); return ''; }
  }

  async function loadFromSitemapVersioned(){
    try{
      const res = await fetch(CFG.sitemap, {cache:'no-store', mode:'cors'});
      if(!res.ok){ console.warn('sitemap not found'); return; }
      const data = await res.json();
      if(!data || typeof data !== 'object') { console.warn('bad sitemap'); return; }

      // refresh hours override by sitemap.meta if provided
      if(data.meta && data.meta.refreshHours) CFG.refreshHours = data.meta.refreshHours;

      // version based learning: only reload if version changed
      const metaVersion = (data.meta && data.meta.version) ? String(data.meta.version) : null;
      const lastVersion = localStorage.getItem('MotoAI_lastSitemapVersion') || null;
      if(metaVersion && metaVersion === lastVersion){
        console.log('📘 sitemap version unchanged:', metaVersion);
      } else {
        // fetch all pages from sitemap
        const pages = Array.isArray(data.pages) ? data.pages : [];
        const list = [...pages, ...CFG.extraDomains];
        console.log('🌐 MotoAI loading pages:', list.length);
        const all = [];
        for(const u of list){
          const t = await fetchTextOrHtml(u);
          if(t) all.push(t);
        }
        const lines = all.join('\n').split(/\n+/).map(s=>s.trim()).filter(Boolean);
        const unique = uniq(lines).slice(0, CFG.maxCorpusItems);
        extendedCorpus = unique;
        try{ localStorage.setItem(CFG.ui.extendedKey, JSON.stringify(extendedCorpus)); }catch(e){}
        if(metaVersion) localStorage.setItem('MotoAI_lastSitemapVersion', metaVersion);
        console.log(`📚 MotoAI v11 Extended corpus built: ${extendedCorpus.length} items (version ${metaVersion||'n/a'})`);
      }
    }catch(e){ console.error('sitemap load fail', e); }
  }

  (function restoreExtended(){
    try{
      const raw = localStorage.getItem(CFG.ui.extendedKey);
      if(raw){ const p = JSON.parse(raw); if(Array.isArray(p) && p.length) extendedCorpus = p; }
    }catch(e){}
  })();

  /* ---------------- P3: SmartEngine rules (rule-based quick hits) ---------------- */
  const rules = [
    { pattern: /(chào|xin chào|hello|hi|alo)/i, answer: "Chào bạn 👋! Mình là MotoAI, cần tư vấn gì về thuê xe máy?" },
    { pattern: /(xe số|wave|sirius|blade|future)/i, answer: "Xe số tiết kiệm xăng, phù hợp đi xa và giá thuê hợp lý." },
    { pattern: /(xe ga|vision|lead|air blade|vespa)/i, answer: "Xe ga tiện đường phố, cốp rộng và êm. Liên hệ để biết giá cụ thể." },
    { pattern: /(50cc|không cần bằng|hoc sinh|sinh viên)/i, answer: "Xe 50cc không cần bằng lái, phù hợp học sinh - sinh viên." },
    { pattern: /(thủ tục|giấy tờ|cọc|đặt cọc)/i, answer: "Thủ tục đơn giản: CCCD + bằng lái (nếu xe >50cc). Cọc nhẹ tuỳ xe." },
    { pattern: /(liên hệ|zalo|sđt|hotline)/i, answer: "Gọi/Zalo: 0857 255 868 để đặt xe nhanh nhất." }
  ];
  function smartAnswer(q){
    for(const r of rules){ if(r.pattern.test(q)) return r.answer; }
    return null;
  }

  /* ---------------- P3: Retrieval (DOM corpus then extended) ---------------- */
  function retrieveFromCorpus(q){
    if(!q) return null;
    const tokens = tokenize(q).filter(t=>t.length>1);
    if(!tokens.length) return null;

    // search DOM corpus with basic overlap scoring
    let best = {score:0, text:null};
    for(const c of corpus){
      let s=0; tokens.forEach(t=>{ if(c.tokens.includes(t)) s++; });
      if(c.text.toLowerCase().includes(q.toLowerCase())) s += 0.6;
      if(s>best.score){ best={score:s, text:c.text}; }
    }
    if(best.score>0) return best.text;

    // search extended corpus lines
    let bestExt = {score:0, text:null};
    for(const line of extendedCorpus){
      const ll = line.toLowerCase();
      let s=0; tokens.forEach(t=>{ if(ll.includes(t)) s++; });
      if(s>bestExt.score){ bestExt={score:s, text: line}; }
    }
    if(bestExt.score>0) return bestExt.text;

    return null;
  }

  /* ---------------- P3: GPT-2 style local generator (lightweight) ---------------- */
  // This is a tiny pseudo-GPT generator using templates + context heuristics.
  const baseTemplates = [
    "Chiếc xe này chạy êm, tiết kiệm xăng và rất phù hợp cho {use}. Nếu bạn muốn, mình có thể gửi bảng giá cụ thể.",
    "Bên mình hỗ trợ giao nhận, cọc nhẹ, thủ tục nhanh gọn. Gọi/Zalo 0857 255 868 để đặt ngay.",
    "Nếu bạn thuê dài ngày sẽ có ưu đãi. Bạn cần thuê bao lâu?"
  ];
  function generateFromTemplates(q, memory){
    const ql = q.toLowerCase();
    if(/vision|air blade|vision/i.test(ql)) return "Vision hoặc Air Blade là lựa chọn phổ biến — ổn cho đi lại nội thành, giá dao động theo ngày/tuần/tháng.";
    if(/giá|bao nhiêu|bảng giá/i.test(ql)) return "Giá thay đổi theo loại xe: xe số rẻ hơn xe ga; thuê nhiều ngày giá sẽ rẻ hơn theo ngày. Gọi 0857 255 868 để nhận báo giá nhanh.";
    // fallback template with context if available
    const lastUser = [...memory].reverse().find(m=>m.role==='user');
    const use = lastUser ? (lastUser.text.length>30 ? 'hành trình của bạn' : 'đi lại hàng ngày') : 'đi lại hàng ngày';
    return baseTemplates[Math.floor(Math.random()*baseTemplates.length)].replace('{use}', use);
  }

  /* ---------------- Context memory ---------------- */
  const memoryBuffer = [];
  function addToMemory(role, text){
    memoryBuffer.push({role, text});
    if(memoryBuffer.length > CFG.memoryWindow) memoryBuffer.shift();
  }

  /* ---------------- sendQuery orchestration ---------------- */
  async function sendQuery(q){
    if(!q || !q.trim()) return;
    if(sendLock) return;
    sendLock = true; sendBtn.disabled = true;
    addMessage('user', q);
    addToMemory('user', q);

    const fixed = q; // could apply spellfix if want
    // 1. Smart rules
    let ans = smartAnswer(fixed);
    if(ans){
      showTyping();
      setTimeout(()=>{ hideTyping(); addMessage('bot', ans); sendLock=false; sendBtn.disabled=false; addToMemory('bot', ans); }, 220);
      return;
    }

    // 2. Retrieval
    showTyping();
    setTimeout(()=>{
      try{
        let ret = retrieveFromCorpus(fixed);
        if(ret){
          hideTyping();
          addMessage('bot', ret);
          addToMemory('bot', ret);
        } else {
          // 3. GPT2-style generate
          const gen = generateFromTemplates(fixed, memoryBuffer);
          hideTyping();
          addMessage('bot', gen);
          addToMemory('bot', gen);
        }
      }catch(e){
        hideTyping();
        addMessage('bot', 'Xin lỗi, có lỗi khi xử lý câu trả lời.');
        console.error(e);
      } finally {
        sendLock=false; sendBtn.disabled=false;
      }
    }, 300);
  }

  /* ---------------- UI behavior, events ---------------- */
  function buildSuggestions(){
    const tags = [
      {q:'Xe số', label:'🏍 Xe số'},
      {q:'Xe ga', label:'🛵 Xe ga'},
      {q:'Thủ tục', label:'📄 Thủ tục'},
      {q:'Xe 50cc', label:'🚲 Xe 50cc'},
      {q:'Gọi/Zalo 0857 255 868', label:'📞 Gọi/Zalo'}
    ];
    suggestionsWrap.innerHTML = '';
    tags.forEach(t=>{
      const b = document.createElement('button');
      b.type='button'; b.textContent = t.label; b.dataset.q = t.q;
      b.addEventListener('click', ()=>{ if(!isOpen) openChat(); setTimeout(()=> sendQuery(t.q), 120); });
      suggestionsWrap.appendChild(b);
    });
  }

  function openChat(){
    if(isOpen) return;
    overlay.classList.add('visible'); card.setAttribute('aria-hidden','false'); overlay.setAttribute('aria-hidden','false');
    isOpen = true;
    const nm = localStorage.getItem(CFG.ui.memoryKey);
    if(nm) setTimeout(()=> addMessage('bot', `Chào ${nm}! Mình nhớ bạn rồi 👋`), 320);
    renderSession();
    setTimeout(()=> { try{ inputEl.focus(); }catch(e){} }, 300);
    // isolate clicks from page
    card.addEventListener('click', e => e.stopPropagation());
    document.documentElement.style.overflow = 'hidden';
  }
  function closeChat(){
    if(!isOpen) return;
    overlay.classList.remove('visible'); card.setAttribute('aria-hidden','true'); overlay.setAttribute('aria-hidden','true');
    isOpen=false; document.documentElement.style.overflow = '';
  }

  function renderSession(){
    bodyEl.innerHTML = '';
    if(sessionMsgs && sessionMsgs.length){
      sessionMsgs.forEach(m=>{
        const el = document.createElement('div');
        el.className = 'm-msg ' + (m.role==='user'?'user':'bot');
        el.textContent = m.text;
        bodyEl.appendChild(el);
      });
      bodyEl.scrollTop = bodyEl.scrollHeight;
    } else {
      addMessage('bot','👋 Xin chào! Mình là MotoAI v11 — hỏi thử “Xe ga”, “Xe số”, “Xe 50cc” hoặc “Thủ tục” nhé!');
    }
  }

  /* ---------------- Input safety: stopPropagation to avoid TOC conflict ---------------- */
  inputEl.addEventListener('keydown', (e)=>{
    e.stopPropagation(); // <--- critical: prevents TOC or global shortcuts from firing while typing
    if(e.key === 'Enter' && !e.shiftKey){
      e.preventDefault();
      const v = (inputEl.value||'').trim();
      inputEl.value='';
      sendQuery(v);
    }
  });

  sendBtn.addEventListener('click', ()=>{ const v = (inputEl.value||'').trim(); inputEl.value=''; sendQuery(v); });
  bubble.addEventListener('click', ()=>{ if(!isOpen) openChat(); else closeChat(); });
  overlay.addEventListener('click', (e)=>{ if(e.target === overlay) closeChat(); });
  closeBtn.addEventListener('click', closeChat);
  clearBtn.addEventListener('click', ()=>{ sessionMsgs=[]; try{ sessionStorage.removeItem(CFG.ui.sessionKey);}catch{}; bodyEl.innerHTML=''; addMessage('bot','🗑 Đã xóa hội thoại.'); });

  /* ---------------- Boot / AutoLearn scheduling ---------------- */
  async function ensureCorpora(){
    // DOM corpus
    const now = Date.now();
    const lastDom = parseInt(localStorage.getItem('MotoAI_lastDomBuild')||'0',10) || 0;
    const domNeed = !lastDom || (now - lastDom) > (CFG.refreshHours*60*60*1000);
    if(corpus.length === 0 || domNeed){
      buildCorpusFromDOM();
      localStorage.setItem('MotoAI_lastDomBuild', Date.now());
    }
    // Extended corpus (version-aware)
    // If you want forced rebuild for dev, uncomment the next line:
    // localStorage.removeItem('MotoAI_lastSitemapVersion');
    await loadFromSitemapVersioned();
  }

  function adaptCardHeight(){
    try{
      const vw = Math.max(document.documentElement.clientWidth, window.innerWidth||0);
      const vh = Math.max(document.documentElement.clientHeight, window.innerHeight||0);
      let h = Math.round(vh * (vw >= 900 ? 0.6 : vw >= 700 ? 0.68 : 0.78));
      h = Math.max(320, Math.min(760, h));
      card.style.height = h + 'px';
    }catch(e){}
  }

  function init(){
    buildSuggestions();
    renderSession();
    ensureCorpora();
    adaptCardHeight();
    window.addEventListener('resize', ()=>{ adaptCardHeight(); });
    setInterval(()=>{ try{ avoidOverlap(); }catch(e){} }, 1200);
    console.log('%c✅ MotoAI v11 Base UI Ready','color:#0a84ff;font-weight:bold;');
  }

  /* minor helper used earlier */
  function avoidOverlap(){
    try{
      const rootEl = root;
      const selectors = ['.quick-call-game','.quick-call','#toc','.toc','.table-of-contents'];
      let found=[];
      selectors.forEach(s=>{ const el=document.querySelector(s); if(el) found.push(el); });
      if(!found.length){ rootEl.style.left='16px'; rootEl.style.bottom='18px'; return; }
      let maxH=0, leftNear=false;
      found.forEach(el=>{
        const r=el.getBoundingClientRect();
        if(r.left < 150 && (window.innerHeight - r.bottom) < 240) leftNear=true;
        if(r.height>maxH) maxH = r.height;
      });
      if(leftNear){ rootEl.style.left = Math.min(160, 16 + Math.round(Math.max(40, maxH*0.6))) + 'px'; rootEl.style.bottom = (18 + Math.round(maxH*0.5)) + 'px'; }
      else { rootEl.style.left='16px'; rootEl.style.bottom='18px'; }
    }catch(e){}
  }

  setTimeout(init, 160);

  // final ready
  console.log('%c🧠 MotoAI v11 GPT2 Hybrid loaded — ready ✅','color:#0a84ff;font-weight:bold;');
})();
