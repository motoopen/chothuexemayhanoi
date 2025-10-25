/* motoai_v14_gpt35_combo.js
   MotoAI v14 — v13_98 UI + GPT-3.5-like core (standalone)
   - UI (v9.8 Apple style)
   - Smart engine: rules + retrieval (DOM + extended corpus) + short context
   - TOC/key 'M' conflict fix: while chat open or input focused, block global 'm' hotkey events
   - Exposes window.MotoAI_v14 API
*/
(function(){
  if(window.MotoAI_v14_LOADED) return;
  window.MotoAI_v14_LOADED = true;
  console.log('%c🚀 MotoAI v14 (v13_98 UI + GPT-3.5-like core) loading...', 'color:#0a84ff;font-weight:700');

  /* ---------------- CONFIG ---------------- */
  const CFG = {
    corpusKey: 'MotoAI_v14_corpus',                 // local DOM corpus
    extendedCorpusKey: 'MotoAI_v10_corpus_extended',// extended corpus built by other scripts (if any)
    sessionKey: 'MotoAI_v14_session_msgs',
    memoryKey: 'MotoAI_v14_user_name',
    minSentenceLength: 20,
    maxCorpusSentences: 800,
    extRefreshHours: 72,
    suggestionTags: [
      {q:'Xe số', label:'🏍 Xe số'},
      {q:'Xe ga', label:'🛵 Xe ga'},
      {q:'Xe 50cc', label:'🚲 Xe 50cc'},
      {q:'Thủ tục', label:'📄 Thủ tục'},
      {q:'Liên hệ 0857 255 868', label:'📞 Gọi/Zalo'}
    ]
  };

  /* --------------- HTML inject (v9.8 style) --------------- */
  const html = `
  <div id="motoai-root" aria-hidden="false">
    <div id="motoai-bubble" role="button" aria-label="Mở chat" title="MotoAI">🤖</div>
    <div id="motoai-backdrop" aria-hidden="true"></div>
    <div id="motoai-card" aria-hidden="true">
      <div id="motoai-handle"></div>
      <div id="motoai-header">
        <span>MotoAI Assistant</span>
        <button id="motoai-close" title="Đóng">✕</button>
      </div>
      <div id="motoai-body" tabindex="0" role="log" aria-live="polite"></div>
      <div id="motoai-suggestions" role="toolbar" aria-label="Gợi ý nhanh"></div>
      <div id="motoai-input">
        <input id="motoai-input-el" placeholder="Nhập câu hỏi..." autocomplete="off" aria-label="Nhập câu hỏi" />
        <button id="motoai-send" aria-label="Gửi">Gửi</button>
      </div>
      <button id="motoai-clear" title="Xóa hội thoại">🗑</button>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', html);

  /* --------------- CSS inject --------------- */
  const css = `
  :root{--accent:#007aff;--bg-light:rgba(255,255,255,0.88);--bg-dark:rgba(28,28,30,0.92);--blur:blur(12px) saturate(140%);}
  #motoai-root{position:fixed;left:16px;bottom:18px;z-index:2147483000;pointer-events:none}
  #motoai-bubble{pointer-events:auto;width:58px;height:58px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:28px;background:var(--accent);color:#fff;cursor:pointer;box-shadow:0 10px 28px rgba(2,6,23,0.18);transition:transform .18s}
  #motoai-bubble:hover{transform:scale(1.06)}
  #motoai-backdrop{position:fixed;inset:0;background:rgba(0,0,0,0.25);opacity:0;pointer-events:none;transition:opacity .28s}
  #motoai-backdrop.show{opacity:1;pointer-events:auto}
  #motoai-card{position:fixed;left:0;right:0;margin:auto;bottom:0;width:min(920px,calc(100% - 36px));max-width:920px;height:72vh;max-height:760px;border-radius:18px 18px 10px 10px;background:var(--bg-light);backdrop-filter:var(--blur);box-shadow:0 -18px 60px rgba(0,0,0,.22);display:flex;flex-direction:column;overflow:hidden;transform:translateY(110%);opacity:0;pointer-events:auto;transition:transform .36s cubic-bezier(.2,.9,.2,1),opacity .28s}
  #motoai-card.open{transform:translateY(0);opacity:1}
  #motoai-handle{width:64px;height:6px;background:rgba(160,160,160,0.6);border-radius:6px;margin:10px auto}
  #motoai-header{display:flex;align-items:center;justify-content:space-between;padding:8px 14px;font-weight:700;color:var(--accent);border-bottom:1px solid rgba(0,0,0,0.06)}
  #motoai-body{flex:1;overflow:auto;padding:12px 16px;font-size:15px;background:transparent}
  .m-msg{margin:8px 0;padding:10px 14px;border-radius:16px;max-width:86%;line-height:1.4;word-break:break-word;box-shadow:0 3px 10px rgba(0,0,0,0.06)}
  .m-msg.bot{background:rgba(255,255,255,0.92);color:#111}
  .m-msg.user{background:linear-gradient(180deg,var(--accent),#00b6ff);color:#fff;margin-left:auto}
  #motoai-suggestions{display:flex;gap:8px;justify-content:center;padding:8px 12px;border-top:1px solid rgba(0,0,0,0.04);flex-wrap:wrap;background:rgba(255,255,255,0.6);backdrop-filter:blur(8px)}
  #motoai-suggestions button{border:none;background:rgba(0,122,255,0.08);color:var(--accent);padding:8px 12px;border-radius:12px;cursor:pointer}
  #motoai-input{display:flex;gap:8px;padding:10px;border-top:1px solid rgba(0,0,0,0.06);background:rgba(255,255,255,0.78);backdrop-filter:blur(8px)}
  #motoai-input input{flex:1;padding:10px;border-radius:12px;border:1px solid rgba(0,0,0,0.08);font-size:15px}
  #motoai-input button{background:var(--accent);color:#fff;border:none;border-radius:10px;padding:10px 14px;cursor:pointer}
  #motoai-clear{position:absolute;top:10px;right:44px;background:none;border:none;font-size:18px;cursor:pointer}
  @media (prefers-color-scheme:dark){
    #motoai-card{background:var(--bg-dark);color:#eee}
    .m-msg.bot{background:rgba(40,40,50,0.92);color:#eee}
    #motoai-suggestions{background:rgba(25,25,30,0.92)}
    #motoai-input{background:rgba(25,25,30,0.9)}
    #motoai-input input{background:rgba(40,40,50,0.9);color:#eee;border:1px solid rgba(255,255,255,0.06)}
  }
  `;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  /* --------------- Helpers & state --------------- */
  const $ = s => document.querySelector(s);
  const root = $('#motoai-root'), bubble = $('#motoai-bubble'), backdrop = $('#motoai-backdrop');
  const card = $('#motoai-card'), bodyEl = $('#motoai-body'), inputEl = $('#motoai-input-el'), sendBtn = $('#motoai-send');
  const closeBtn = $('#motoai-close'), clearBtn = $('#motoai-clear'), suggestionsWrap = $('#motoai-suggestions');

  let isOpen = false, sendLock = false;
  let corpus = []; // {id,text,tokens}
  let sessionMsgs = [];

  function tokenize(s){ return (s||'').toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu,' ').split(/\s+/).filter(Boolean); }
  function uniqArr(a){ return Array.from(new Set(a)); }
  function norm(s){ return (s||'').toString().trim(); }

  /* --------------- Corpus: build & restore --------------- */
  function buildCorpusFromDOM(){
    try{
      let nodes = Array.from(document.querySelectorAll('main, article, section'));
      if(!nodes.length) nodes = [document.body];
      let texts = [];
      nodes.forEach(n=>{
        Array.from(n.querySelectorAll('h1,h2,h3')).forEach(h=>{ const t=h.innerText.trim(); if(t.length>10) texts.push(t); });
        Array.from(n.querySelectorAll('p, li')).forEach(p=>{ const t=p.innerText.trim(); if(t.length>=CFG.minSentenceLength) texts.push(t); });
      });
      if(!texts.length){
        const meta = document.querySelector('meta[name="description"]');
        if(meta && meta.content) texts.push(meta.content);
        const bodyTxt = document.body.innerText || '';
        bodyTxt.split(/[.!?]\s+/).forEach(s=>{ if(s.trim().length>CFG.minSentenceLength) texts.push(s.trim()); });
      }
      const uniqTexts = uniqArr(texts).slice(0, CFG.maxCorpusSentences);
      corpus = uniqTexts.map((t,i)=>({id:i, text:t, tokens:tokenize(t)}));
      try{ localStorage.setItem(CFG.corpusKey, JSON.stringify(corpus)); }catch(e){}
      console.log('📚 MotoAI v14 built DOM corpus:', corpus.length);
    }catch(e){ corpus=[]; }
  }
  (function restoreCorpus(){
    try{
      const raw = localStorage.getItem(CFG.corpusKey);
      if(raw){ const p = JSON.parse(raw); if(Array.isArray(p) && p.length) corpus = p; }
    }catch(e){}
  })();

  /* --------------- Extended corpus (if present) --------------- */
  function getExtendedCorpus(){
    try{
      const raw = localStorage.getItem(CFG.extendedCorpusKey);
      if(!raw) return [];
      const arr = JSON.parse(raw);
      if(Array.isArray(arr)) return arr;
      return [];
    }catch(e){ return []; }
  }

  /* --------------- Session & memory --------------- */
  function loadSession(){ try{ const raw=sessionStorage.getItem(CFG.sessionKey); if(raw) sessionMsgs=JSON.parse(raw); }catch(e){ sessionMsgs=[];} if(!Array.isArray(sessionMsgs)) sessionMsgs=[]; }
  function saveSession(){ try{ sessionStorage.setItem(CFG.sessionKey, JSON.stringify(sessionMsgs)); }catch(e){} }
  function saveUserName(n){ try{ localStorage.setItem(CFG.memoryKey, n); }catch(e){} }
  function getUserName(){ try{ return localStorage.getItem(CFG.memoryKey); }catch(e){return null;} }
  function detectNameFromText(txt){
    if(!txt) return null;
    const s = txt.replace(/\s+/g,' ').trim();
    const patterns = [/tôi tên là\s+([\w\s\-\.]{2,40})/i, /tên tôi là\s+([\w\s\-\.]{2,40})/i, /mình tên là\s+([\w\s\-\.]{2,40})/i];
    for(const p of patterns){ const m = s.match(p); if(m && m[1]){ const nm=m[1].trim(); saveUserName(nm); return nm; } }
    return null;
  }

  /* --------------- UI helpers --------------- */
  function addMessage(role, text){
    if(!text || !String(text).trim()) return;
    const el = document.createElement('div');
    el.className = 'm-msg ' + (role==='user' ? 'user' : 'bot');
    el.textContent = text;
    bodyEl.appendChild(el);
    bodyEl.scrollTop = bodyEl.scrollHeight;
    sessionMsgs.push({role, text, t:Date.now()});
    saveSession();
    return el;
  }
  function showTyping(){ 
    const id = 'motoai-typing';
    if(!document.getElementById(id)){
      const d = document.createElement('div'); d.id=id; d.className='m-msg bot'; d.textContent='...'; d.style.textAlign='center';
      bodyEl.appendChild(d); bodyEl.scrollTop = bodyEl.scrollHeight;
    }
  }
  function hideTyping(){ const el = document.getElementById('motoai-typing'); if(el) el.remove(); }

  /* --------------- Suggestion buttons --------------- */
  function buildSuggestions(){
    suggestionsWrap.innerHTML = '';
    CFG.suggestionTags.forEach(s=>{
      const b = document.createElement('button'); b.type='button'; b.textContent=s.label; b.dataset.q=s.q;
      b.addEventListener('click', ()=>{ if(!isOpen) openChat(); setTimeout(()=> sendQuery(s.q),120); });
      suggestionsWrap.appendChild(b);
    });
  }

  /* --------------- Retrieval (DOM + extended) --------------- */
  function scoreLine(line, qTokens){
    if(!qTokens.length) return 0;
    const lineL = line.toLowerCase();
    let sc = 0;
    for(const t of qTokens){ if(lineL.includes(t)) sc += 2; }
    return sc;
  }
  function retrieveFromDOM(q){
    if(!corpus || !corpus.length) return null;
    const qTokens = tokenize(q);
    let best = {score:0,text:null};
    for(const c of corpus){
      const s = scoreLine(c.text, qTokens);
      if(s > best.score){ best = {score:s, text:c.text}; }
    }
    return best.score>0 ? best.text : null;
  }
  function retrieveFromExtended(q){
    const ext = getExtendedCorpus();
    if(!ext || !ext.length) return null;
    const qTokens = tokenize(q);
    let best = {score:0,text:null};
    for(const line of ext){
      const s = scoreLine(line, qTokens);
      if(s > best.score){ best = {score:s, text:line}; }
    }
    return best.score>0 ? best.text : null;
  }

  /* --------------- Spellfix & normalize --------------- */
  const SPELL_MAP = {
    'thue xe may':'thuê xe máy','xe so':'xe số','xe ga':'xe ga','thu tuc':'thủ tục',
    'giay to':'giấy tờ','bang gia':'bảng giá','lien he':'liên hệ'
  };
  function fixText(t){
    let s = (t||'').toLowerCase();
    for(const k in SPELL_MAP){ s = s.replace(new RegExp('\\b'+k+'\\b','gi'), SPELL_MAP[k]); }
    return s;
  }
  function normalizeText(s){ return (s||'').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d'); }

  /* --------------- Rules (smart engine) --------------- */
  const RULES = [
    {pattern:/(xe số|xeso|wave|sirius|blade|future)/i, text:"Xe số: tiết kiệm xăng, phù hợp đi phố và đi đường dài. Giá thuê theo ngày/tuần/tháng."},
    {pattern:/(xe ga|xega|vision|lead|air blade|vespa)/i, text:"Xe tay ga: chạy êm, cốp rộng. Thuê theo ngày/tuần/tháng, giao trong nội thành."},
    {pattern:/(50cc|xe 50cc|khong can bang|không cần bằng)/i, text:"Xe 50cc: thường không cần GPLX, phù hợp học sinh/sinh viên. Thủ tục: CCCD hoặc Passport."},
    {pattern:/(thủ tục|giấy tờ|giay to|thu tuc|cọc|dat coc)/i, text:"Thủ tục cơ bản: CCCD + GPLX (xe >50cc). Cọc nhẹ tuỳ xe; tiền cọc được hoàn khi trả xe."},
    {pattern:/(giá|bao nhiêu|bảng giá|gia thue)/i, text:"Bảng giá tham khảo: Xe số ~150k/ngày; Xe ga ~120-200k/ngày; Thuê tuần, tháng có ưu đãi. Liên hệ để biết chính xác."},
    {pattern:/(liên hệ|lien he|zalo|sđt|hotline)/i, text:"Liên hệ nhanh: 0857 255 868 (Zalo/Hotline). Gọi/Zalo để đặt xe hoặc hỏi giao nhận."}
  ];

  function ruleAnswer(q){
    for(const r of RULES){
      if(r.pattern.test(q)) return r.text;
    }
    return null;
  }

  /* --------------- Compose answer (GPT-3.5-like hybrid) --------------- */
  function composeAnswer(rawQ){
    const q = fixText(norm(rawQ));
    if(!q) return "Bạn chưa nhập nội dung. Hãy hỏi về 'giá', 'thủ tục' hoặc 'xe 50cc' nhé.";
    // 1) Rules first
    const r = ruleAnswer(q);
    if(r) return r;
    // 2) Retrieval DOM
    const dom = retrieveFromDOM(q);
    if(dom) return dom;
    // 3) Extended
    const ext = retrieveFromExtended(q);
    if(ext) return ext;
    // 4) Short heuristics: if question contains 'bao nhiêu' try find numbers in corpus lines
    if(/\b(bao nhiêu|giá|bao tiền)\b/.test(q)){
      const maybe = retrieveFromExtended(q) || retrieveFromDOM(q);
      if(maybe) return maybe;
    }
    // 5) Fallback polite
    return "Xin lỗi, mình chưa tìm thấy câu trả lời cụ thể trong dữ liệu. Bạn thử hỏi: 'giá thuê 1 ngày', 'thủ tục', hoặc 'xe 50cc' nhé.";
  }

  /* --------------- sendQuery + response flow --------------- */
  function sendQuery(text){
    if(!text || !text.trim()) return;
    if(sendLock) return;
    sendLock = true; sendBtn.disabled = true;
    const fixed = fixText(text);
    addMessage('user', fixed);
    // detect name
    const name = detectNameFromText(text);
    if(name){
      addMessage('bot', `Đã nhớ tên: ${name} ✨`);
      sendLock=false; sendBtn.disabled=false;
      setTimeout(()=> inputEl.focus(), 120);
      return;
    }
    showTyping();
    // prefer rules then retrieval (composeAnswer handles)
    setTimeout(()=>{
      try{
        const ans = composeAnswer(text);
        hideTyping();
        if(ans && ans.trim()){
          addMessage('bot', ans);
        }
      }catch(e){
        hideTyping();
        addMessage('bot', 'Đã có lỗi khi xử lý. Thử lại nhé.');
        console.error(e);
      } finally {
        sendLock=false; sendBtn.disabled=false;
        setTimeout(()=> inputEl.focus(), 120);
      }
    }, 220);
  }

  /* --------------- UI open/close/render --------------- */
  function renderSession(){
    bodyEl.innerHTML = '';
    if(sessionMsgs && sessionMsgs.length){
      sessionMsgs.forEach(m=>{
        const el = document.createElement('div'); el.className='m-msg '+(m.role==='user'?'user':'bot'); el.textContent=m.text; bodyEl.appendChild(el);
      });
      bodyEl.scrollTop = bodyEl.scrollHeight;
    } else {
      const name = getUserName();
      addMessage('bot', `👋 Xin chào${name ? ' ' + name : ''}! Mình là MotoAI — hỏi thử "Xe ga", "Xe số", "Xe 50cc" hoặc "Thủ tục" nhé!`);
    }
  }
  function openChat(){
    if(isOpen) return;
    card.classList.add('open'); backdrop.classList.add('show'); bubble.style.display='none'; isOpen=true;
    renderSession(); setTimeout(()=> inputEl.focus(), 240);
    // set flag to prevent TOC keys
    document.documentElement.dataset.motoaiOpen = '1';
  }
  function closeChat(){
    if(!isOpen) return;
    card.classList.remove('open'); backdrop.classList.remove('show'); bubble.style.display='flex'; isOpen=false;
    hideTyping();
    delete document.documentElement.dataset.motoaiOpen;
  }

  /* --------------- Fix TOC / Hotkey 'M' conflict --------------- */
  // many sites listen for global keydown e.g. 'm' to open TOC — when chat input or chat open, block such propagation
  (function installTOCFix(){
    function shouldBlockKey(evt){
      // block if chat open OR input focused OR focus inside chat
      if(document.documentElement.dataset.motoaiOpen === '1') return true;
      const active = document.activeElement;
      if(!active) return false;
      if(active === inputEl) return true;
      if(active && (active.tagName==='INPUT' || active.tagName==='TEXTAREA' || active.isContentEditable)) return true;
      return false;
    }
    document.addEventListener('keydown', function(e){
      try{
        // block only for 'm' or 'M' or when any single-letter shortcut that collides
        if(!e.key) return;
        const key = e.key.toLowerCase();
        if(['m'].includes(key) && shouldBlockKey(e)){
          // prevent site-level TOC from firing
          e.stopImmediatePropagation();
          // also prevent default to avoid any browser shortcut conflict
          e.preventDefault();
          // small debug
          // console.log('MotoAI: blocked key', key);
        }
      }catch(err){}
    }, true); // capture to intercept before site listeners
  })();

  /* --------------- Bind events --------------- */
  function bindUI(){
    bubble.addEventListener('click', ()=>{
      if(!isOpen) openChat();
      else closeChat();
    });
    backdrop.addEventListener('click', closeChat);
    closeBtn.addEventListener('click', closeChat);
    clearBtn.addEventListener('click', ()=>{ sessionMsgs=[]; saveSession(); bodyEl.innerHTML=''; addMessage('bot','🗑 Đã xóa hội thoại.'); });
    sendBtn.addEventListener('click', ()=>{ const v=(inputEl.value||'').trim(); inputEl.value=''; sendQuery(v); });
    inputEl.addEventListener('keydown', (e)=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); const v=(inputEl.value||'').trim(); inputEl.value=''; sendQuery(v); }});
    // accessibility: focus styles
    inputEl.addEventListener('focus', ()=> document.documentElement.dataset.motoaiFocus='1');
    inputEl.addEventListener('blur', ()=> delete document.documentElement.dataset.motoaiFocus);
  }

  /* --------------- API exposure --------------- */
  window.MotoAI_v14 = {
    open: openChat,
    close: closeChat,
    sendQuery,
    rebuildCorpus: buildCorpusFromDOM,
    getName: getUserName,
    clearMemory: ()=>{ try{ localStorage.removeItem(CFG.memoryKey); sessionStorage.removeItem(CFG.sessionKey); }catch(e){} }
  };

  /* --------------- Init bootstrap --------------- */
  function init(){
    buildSuggestions();
    loadSession();
    if(!corpus || !corpus.length) buildCorpusFromDOM();
    bindUI();
    // soft refresh extended corpus info log
    try{
      const ext = getExtendedCorpus();
      if(ext && ext.length) console.log('📦 MotoAI v14 found extended corpus items:', ext.length);
    }catch(e){}
    console.log('%c✅ MotoAI v14 ready — UI + Smart engine active', 'color:#0a84ff;font-weight:700');
  }

  // auto-refresh DOM corpus every 72h (light)
  (function autoRefresh(){
    try{
      const last = parseInt(localStorage.getItem('MotoAI_v14_lastBuild')||'0',10);
      const now = Date.now();
      const hrs = CFG.extRefreshHours * 60*60*1000;
      if(!last || (now - last) > hrs){
        buildCorpusFromDOM();
        localStorage.setItem('MotoAI_v14_lastBuild', now);
      }
    }catch(e){}
  })();

  // start
  setTimeout(init, 120);

})();
