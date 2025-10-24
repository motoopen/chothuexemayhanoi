/* ==== 🧠 Nâng cấp MotoAI lên bản 11.4 Quick+ (Tích hợp Quick Button) ====
   ✅ Đã giữ nguyên toàn bộ code MotoAI v10.2 và áp dụng tính năng mới:
      1️⃣ Thêm nút "🤖 Quick AI" nổi (position: fixed, right: 16px, bottom: 90px)
      2️⃣ Nút có hiệu ứng sáng (glow pulse) báo sẵn sàng.
      3️⃣ Bấm vào mở ngay MotoAI (window.MotoAI_v10.open()).
      4️⃣ Đã thay thế alert() bằng cơ chế phản hồi visual (icon ⚠️) trên nút.
*/

(function addMotoAIQuickButton(){
  // Tạo phần tử nút quick
  const quick = document.createElement('div');
  quick.id = 'motoai-quick';
  quick.innerHTML = '🤖';
  document.body.appendChild(quick);

  // CSS cho quick button + hiệu ứng sáng
  const css = document.createElement('style');
  css.textContent = `
    #motoai-quick {
      position: fixed;
      right: 16px;
      bottom: 90px; /* Vị trí nổi, phía trên bubble chính */
      width: 52px;
      height: 52px;
      background: var(--m10-accent,#007aff);
      color: #fff;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 26px;
      cursor: pointer;
      box-shadow: 0 10px 25px rgba(0,0,0,.25);
      transition: all .25s ease, background-color .25s; /* Thêm transition cho background */
      z-index: 2147483646;
    }
    #motoai-quick:hover {
      transform: scale(1.08);
      box-shadow: 0 14px 35px rgba(0,0,0,.3);
    }
    @keyframes pulseGlow {
      0% { box-shadow: 0 0 0 rgba(0,122,255,0.6); }
      70% { box-shadow: 0 0 20px rgba(0,122,255,0.4); }
      100% { box-shadow: 0 0 0 rgba(0,122,255,0); }
    }
    #motoai-quick.glow {
      animation: pulseGlow 2.4s infinite;
    }
    @keyframes quickShake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-2px); }
        75% { transform: translateX(2px); }
    }
    #motoai-quick.shake {
        animation: quickShake 0.15s linear 2;
    }
  `;
  document.head.appendChild(css);

  // Sự kiện click mở MotoAI - Đã loại bỏ alert()
  quick.addEventListener('click', ()=>{
    if(window.MotoAI_v10) {
      quick.classList.remove('shake');
      window.MotoAI_v10.open();
    } else {
      // Phản hồi visual thay cho alert()
      quick.classList.remove('glow');
      quick.classList.add('shake');
      quick.innerHTML = '⚠️';
      quick.style.backgroundColor = '#d9534f'; // Màu đỏ cảnh báo
      
      console.error('⚠️ MotoAI chưa sẵn sàng!');
      
      setTimeout(() => {
          quick.innerHTML = '🤖';
          quick.style.backgroundColor = 'var(--m10-accent,#007aff)';
          quick.classList.add('glow');
          quick.classList.remove('shake');
      }, 1500);
    }
  });

  // Hiệu ứng sáng sau khi load xong
  setTimeout(()=>{
    const q=document.getElementById('motoai-quick');
    if(q) q.classList.add('glow');
  }, 2500);
})();

// MotoAI v11.4 — Hybrid Pro Quick+ (Web-Corpus Learning + Memory + Apple UI + Refine+)
// Standalone file. Paste as motoai_embed_v11.4_quick_plus.js
(function(){
  if(window.MotoAI_v10_LOADED) return;
  window.MotoAI_v10_LOADED = true;
  console.log('✅ MotoAI v11.4 Hybrid Pro Quick+ loaded (Quick Button & Refine+ applied)');

  /* -------- CONFIG -------- */
  const CFG = {
    maxCorpusSentences: 600,    // cap sentences stored
    minSentenceLength: 20,
    suggestionTags: [
      {q:'Xe số', label:'🏍 Xe số'},
      {q:'Xe ga', label:'🛵 Xe ga'},
      {q:'Thủ tục', label:'📄 Thủ tục'},
      {q:'Xe 50cc', label:'🚲 Xe 50cc'},
      {q:'Liên hệ 0857255868', label:'☎️ Liên hệ'} // Thêm gợi ý Liên hệ
    ],
    memoryKeyName: 'MotoAI_v10_user_name',
    corpusKey: 'MotoAI_v10_corpus',
    sessionKey: 'MotoAI_v10_session_msgs',
    sitemapPath: '/moto_sitemap.json'
  };

  /* --------- HTML inject ---------- */
  const html = `
  <div id="motoai-root" aria-hidden="false">
    <div id="motoai-bubble" role="button" aria-label="Mở MotoAI">🤖</div>
    <div id="motoai-overlay" aria-hidden="true">
      <div id="motoai-card" role="dialog" aria-modal="true" aria-hidden="true">
        <div id="motoai-handle" aria-hidden="true"></div>
        <header id="motoai-header">
          <div class="title">MotoAI Assistant</div>
          <div class="tools">
            <button id="motoai-clear" title="Xóa cuộc trò chuyện">🗑</button>
            <button id="motoai-close" title="Đóng">✕</button>
          </div>
        </header>
        <main id="motoai-body" tabindex="0" role="log" aria-live="polite"></main>
        <div id="motoai-suggestions" role="toolbar" aria-label="Gợi ý nhanh"></div>
        <footer id="motoai-footer">
          <div id="motoai-typing" aria-hidden="true"></div>
          <input id="motoai-input" placeholder="Nhập câu hỏi..." autocomplete="off" aria-label="Nhập câu hỏi"/>
          <button id="motoai-send" aria-label="Gửi">Gửi</button>
        </footer>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', html);

  /* ---------- CSS (Đã hợp nhất CSS cơ bản và Refine+) ---------- */
  const css = `
  :root{
    --m10-accent:#007aff;
    --m10-card-bg: rgba(255,255,255,0.86);
    --m10-card-bg-dark: rgba(22,22,24,0.92);
    --m10-blur: blur(12px) saturate(140%);
    --m10-radius:18px;
    --glass-border:rgba(0,0,0,0.08);
    --footer-bg:rgba(255,255,255,0.7);
    --bg:#fff;
    --text:#000;
  }
  #motoai-root{position:fixed;left:16px;bottom:18px;z-index:2147483000;pointer-events:none}
  #motoai-bubble{
    pointer-events:auto;width:56px;height:56px;border-radius:14px;display:flex;align-items:center;justify-content:center;
    font-size:26px;background:var(--m10-accent);color:#fff;box-shadow:0 10px 28px rgba(2,6,23,0.18);cursor:pointer;transition:transform .16s;
  }
  #motoai-bubble:hover{transform:scale(1.06)}
  #motoai-overlay{position:fixed;inset:0;display:flex;align-items:flex-end;justify-content:center;padding:12px;pointer-events:none;transition:background .24s ease;z-index:2147482999}
  #motoai-overlay.visible{background:rgba(0,0,0,0.18);pointer-events:auto}
  #motoai-card{
    width:min(920px,calc(100% - 36px));max-width:920px;border-radius:var(--m10-radius) var(--m10-radius) 10px 10px;
    height:72vh;max-height:760px;min-height:320px;background:var(--m10-card-bg);backdrop-filter:var(--m10-blur);
    box-shadow:0 -18px 60px rgba(0,0,0,.22);display:flex;flex-direction:column;overflow:hidden;
    transform:translateY(110%);opacity:0;pointer-events:auto;transition:transform .36s cubic-bezier(.2,.9,.2,1),opacity .28s;
  }
  #motoai-overlay.visible #motoai-card{transform:translateY(0);opacity:1}
  #motoai-handle{width:64px;height:6px;background:rgba(160,160,160,0.6);border-radius:6px;margin:10px auto}
  #motoai-header{display:flex;align-items:center;justify-content:space-between;padding:8px 14px;font-weight:700;color:var(--m10-accent);border-bottom:1px solid rgba(0,0,0,0.06)}
  #motoai-header .tools button{background:none;border:none;font-size:18px;cursor:pointer;padding:6px 8px}
  #motoai-body{flex:1;overflow:auto;padding:12px 16px;font-size:15px;background:transparent}
  .m-msg{margin:8px 0;padding:12px 14px;border-radius:16px;max-width:86%;line-height:1.4;word-break:break-word;box-shadow:0 3px 10px rgba(0,0,0,0.06)}
  .m-msg.bot{background:rgba(255,255,255,0.9);color:#111}
  .m-msg.user{background:linear-gradient(180deg,var(--m10-accent),#00b6ff);color:#fff;margin-left:auto}
  #motoai-suggestions{display:flex;gap:8px;justify-content:center;padding:8px 12px;border-top:1px solid rgba(0,0,0,0.04);flex-wrap:wrap;background:rgba(255,255,255,0.6);backdrop-filter:blur(8px)}
  #motoai-suggestions button{border:none;background:rgba(0,122,255,0.08);color:var(--m10-accent);padding:8px 12px;border-radius:12px;cursor:pointer}

  /* Refine+ Footer and Input Styles (Căn giữa input) */
  #motoai-footer{
    display:flex;
    align-items:center;
    justify-content:center; /* Căn giữa */
    gap:8px;
    padding:10px;
    border-top:1px solid var(--glass-border,rgba(0,0,0,0.06));
    background:var(--footer-bg,rgba(255,255,255,0.7));
    backdrop-filter:blur(8px);
  }
  #motoai-input{
    flex:1;
    padding:10px 12px;
    border-radius:12px;
    border:1px solid var(--glass-border,rgba(0,0,0,0.08));
    font-size:15px;
    margin-right:4px;
    background:var(--bg,#fff);
    color:var(--text,#000);
  }
  #motoai-send{
    background:var(--m10-accent);
    color:#fff;
    border:none;
    border-radius:12px;
    padding:10px 16px;
    cursor:pointer;
    flex-shrink:0;
    transition:all .25s;
  }
  #motoai-send:hover{transform:scale(1.08);}
  /* Hiệu ứng glow cho bot */
  .m-msg.bot.glow{
    box-shadow:0 0 14px rgba(0,122,255,0.2),
               0 0 28px rgba(0,122,255,0.1);
    transition:box-shadow 0.8s ease;
  }
  /* Rung nhẹ khi gửi */
  @keyframes chatShake {
    0%,100%{transform:translateX(0);}
    25%{transform:translateX(2px);}
    50%{transform:translateX(-2px);}
    75%{transform:translateX(1px);}
  }
  .shake{animation:chatShake .25s linear;}

  /* Dark Mode Overrides for Card */
  body.dark #motoai-card{
    background:var(--m10-card-bg-dark);
    color:var(--text,#F2F2F7);
    box-shadow:0 12px 36px rgba(0,0,0,0.4);
  }
  @media (prefers-color-scheme:dark){
    :root{
      --m10-card-bg:var(--m10-card-bg-dark);
      --glass-border:rgba(255,255,255,0.08);
      --footer-bg:rgba(25,25,30,0.9);
      --bg:#1C1C1E;
      --text:#F2F2F7;
    }
    .m-msg.bot{background:rgba(40,40,50,0.9);color:#eee}
    .m-msg.user{background:linear-gradient(180deg,var(--m10-accent),#00b6ff);color:#fff;}
    #motoai-suggestions{background:rgba(25,25,30,0.9)}
  }
  @media (max-width:520px){
    #motoai-card{width:calc(100% - 24px);height:78vh}
  }
  `;
  const sN = document.createElement('style'); sN.textContent = css; document.head.appendChild(sN);

  /* ---------- Helpers & state ---------- */
  const $ = sel => document.querySelector(sel);
  const root = $('#motoai-root'), bubble = $('#motoai-bubble'), overlay = $('#motoai-overlay');
  const card = $('#motoai-card'), bodyEl = $('#motoai-body'), inputEl = $('#motoai-input'), sendBtn = $('#motoai-send');
  const closeBtn = $('#motoai-close'), clearBtn = $('#motoai-clear'), typingEl = $('#motoai-typing');
  const suggestionsWrap = $('#motoai-suggestions');

  let isOpen = false, sendLock = false;
  let corpus = []; // [{id, text, tokens[]}]
  let sessionMsgs = []; // persisted in sessionStorage

  /* --------- Utility: tokenize, normalize --------- */
  function tokenize(s){
    return s.toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu,' ').split(/\s+/).filter(Boolean);
  }
  function uniq(arr){ return Array.from(new Set(arr)); }

  /* -------- Corpus build: prefer <main>, <article>, <section>, headings, lists -------- */
  function buildCorpusFromDOM(){
    try{
      let nodes = Array.from(document.querySelectorAll('main, article, section'));
      if(!nodes.length) nodes = [document.body];
      let texts = [];
      nodes.forEach(n=>{
        // headings
        Array.from(n.querySelectorAll('h1,h2,h3')).forEach(h=>{ if(h.innerText && h.innerText.trim().length>10) texts.push(h.innerText.trim()); });
        // paragraphs and list items
        Array.from(n.querySelectorAll('p, li')).forEach(p=>{ const t = p.innerText.trim(); if(t.length>=CFG.minSentenceLength) texts.push(t); });
      });
      // fallback: meta description or body
      if(!texts.length){
        const meta = document.querySelector('meta[name="description"]');
        if(meta && meta.content) texts.push(meta.content);
        const bodyTxt = document.body.innerText || '';
        bodyTxt.split(/[.!?]\s+/).forEach(s=>{ if(s.trim().length>CFG.minSentenceLength) texts.push(s.trim()); });
      }
      // dedupe and cap
      const uniqTexts = uniq(texts).slice(0, CFG.maxCorpusSentences);
      corpus = uniqTexts.map((t,i)=>({id:i, text:t, tokens:tokenize(t)}));
      try{ localStorage.setItem(CFG.corpusKey, JSON.stringify(corpus)); }catch(e){}
      console.log(`📚 MotoAI v11.4 built corpus: ${corpus.length} items`);
    }catch(e){ corpus=[]; }
  }

  // Restore corpus from localStorage if present (speed)
  (function restoreCorpus(){
    try{
      const raw = localStorage.getItem(CFG.corpusKey);
      if(raw){
        const parsed = JSON.parse(raw);
        if(Array.isArray(parsed) && parsed.length) { corpus = parsed; }
      }
    }catch(e){}
  })();

  /* -------- Retrieval: TF-style overlap score (fast) -------- */
  function retrieveBestAnswer(query){
    if(!query) return null;
    const qTokens = tokenize(query).filter(t=>t.length>1);
    if(!qTokens.length || !corpus.length) return null;
    let best = {score:0, text:null, id:null};
    for(const c of corpus){
      // quick filter by tokens overlap
      let score=0;
      for(const qt of qTokens){
        if(c.tokens.includes(qt)) score += 1;
      }
      // small boost if exact phrase
      if(c.text.toLowerCase().includes(query.toLowerCase())) score += 0.6;
      if(score>best.score){ best={score, text:c.text, id:c.id}; }
    }
    return best.score>0 ? best.text : null;
  }

  /* -------- Session persistence (keep across pages) -------- */
  function loadSession(){
    try{
      const raw = sessionStorage.getItem(CFG.sessionKey);
      if(raw) sessionMsgs = JSON.parse(raw);
    }catch(e){ sessionMsgs = []; }
    if(!sessionMsgs || !Array.isArray(sessionMsgs)) sessionMsgs = [];
  }
  function saveSession(){ try{ sessionStorage.setItem(CFG.sessionKey, JSON.stringify(sessionMsgs)); }catch(e){} }

  /* -------- Memory: user name -------- */
  function saveUserName(name){ try{ localStorage.setItem(CFG.memoryKeyName, name); }catch(e){} }
  function getUserName(){ try{ return localStorage.getItem(CFG.memoryKeyName); }catch(e){return null;} }
  function detectNameFromText(txt){
    if(!txt) return null;
    const s = txt.replace(/\s+/g,' ').trim();
    const patterns = [
      /(?:tôi tên là|tên tôi là|mình tên là)\s+([A-Za-z\u00C0-\u024F0-9_\- ]{2,40})/i,
      /(?:tôi là|mình là)\s+([A-Za-z\u00C0-\u024F0-9_\- ]{2,40})/i
    ];
    for(const p of patterns){
      const m = s.match(p);
      if(m && m[1]){ const nm=m[1].trim(); saveUserName(nm); return nm; }
    }
    return null;
  }

  /* -------- UI helpers -------- */
  function addMessage(role, text, opts){
    const el = document.createElement('div');
    el.className = 'm-msg '+(role==='user'?'user':'bot');
    el.textContent = text;
    bodyEl.appendChild(el);
    bodyEl.scrollTop = bodyEl.scrollHeight;
    // push to session
    sessionMsgs.push({role, text, t:Date.now()});
    saveSession();
    return el;
  }

  function showTypingDots(){
    typingEl.innerHTML = `<span class="dot">.</span><span class="dot">.</span><span class="dot">.</span>`;
    typingEl.style.opacity = '1';
  }
  function hideTypingDots(){ typingEl.innerHTML=''; typingEl.style.opacity='0'; }

  /* ---------- Build suggestion buttons ---------- */
  function buildSuggestions(){
    suggestionsWrap.innerHTML = '';
    CFG.suggestionTags.forEach(s=>{
      const b = document.createElement('button');
      b.type='button'; b.textContent = s.label; b.dataset.q = s.q;
      b.addEventListener('click', (ev)=>{
        if(!isOpen) openChat();
        setTimeout(()=> sendQuery(s.q), 100);
      });
      suggestionsWrap.appendChild(b);
    });
  }

  /* ---------- Open/close logic ---------- */
  function openChat(){
    if(isOpen) return;
    overlay.classList.add('visible');
    card.setAttribute('aria-hidden','false'); overlay.setAttribute('aria-hidden','false');
    isOpen = true;
    const name = getUserName();
    if(name) setTimeout(()=> addMessage('bot', `Chào ${name}! Mình nhớ bạn rồi 👋`), 400);
    // render session messages
    renderSession();
    setTimeout(()=> { try{ inputEl.focus(); }catch(e){} }, 320);
    document.documentElement.style.overflow = 'hidden';
    adaptCardHeight();
  }
  function closeChat(){
    if(!isOpen) return;
    overlay.classList.remove('visible');
    card.setAttribute('aria-hidden','true'); overlay.setAttribute('aria-hidden','true');
    isOpen = false;
    document.documentElement.style.overflow = '';
    // clear typing
    hideTypingDots();
  }

  /* ---------- Render saved session to UI ---------- */
  function renderSession(){
    bodyEl.innerHTML = '';
    if(sessionMsgs && sessionMsgs.length){
      sessionMsgs.forEach(m=>{
        const el = document.createElement('div');
        el.className = 'm-msg '+(m.role==='user'?'user':'bot');
        el.textContent = m.text;
        bodyEl.appendChild(el);
      });
      bodyEl.scrollTop = bodyEl.scrollHeight;
    } else {
      addMessage('bot','👋 Xin chào! Mình là MotoAI — hỏi thử “Xe ga”, “Xe số”, “Xe 50cc” hoặc “Thủ tục” nhé!');
    }
  }

  /* ---------- sendQuery: detect name, retrieve from corpus, fallback ---------- */
  async function sendQuery(text){
    if(!text || !text.trim()) return;
    if(sendLock) return;
    sendLock = true; sendBtn.disabled = true;
    hideTypingDots();

    // add user msg
    addMessage('user', text);

    // detect name
    const name = detectNameFromText(text);
    if(name){
      addMessage('bot', `Đã nhớ tên: ${name} ✨`);
      sendLock=false; sendBtn.disabled=false;
      setTimeout(()=> inputEl.focus(), 120);
      return;
    }

    // show typing
    showTypingDots();

    // retrieval (small delay to simulate thinking)
    setTimeout(()=>{
      try{
        let ans = retrieveBestAnswer(text);
        if(!ans){
          // cross-page learning: try to merge stored local corpus if exists (already merged in build)
          ans = null;
        }
        hideTypingDots();
        if(ans){
          addMessage('bot', ans);
        } else {
          addMessage('bot', 'Xin lỗi, mình chưa tìm thấy nội dung cụ thể trên trang này. Bạn thử hỏi khác nha.');
        }
      }catch(e){
        hideTypingDots();
        addMessage('bot','Lỗi khi xử lý câu trả lời.');
        console.error(e);
      } finally {
        sendLock=false; sendBtn.disabled=false;
        setTimeout(()=> inputEl.focus(),120);
      }
    }, 300);
  }

  /* ---------- Quick analytic: avoid overlap with quickcall/toc ---------- */
  function avoidOverlap(){
    try{
      const rootEl = root;
      const selectors = ['.quick-call-game','.quick-call','#toc','.toc','.table-of-contents'];
      let found = [];
      selectors.forEach(s=>{
        const el = document.querySelector(s); if(el) found.push(el);
      });
      if(!found.length){
        rootEl.style.left = '16px'; rootEl.style.bottom = '18px'; return;
      }
      let maxH = 0; let leftNear = false;
      found.forEach(el=>{
        const r = el.getBoundingClientRect();
        if(r.left < 150 && (window.innerHeight - r.bottom) < 240) leftNear = true;
        if(r.height>maxH) maxH = r.height;
      });
      if(leftNear){
        rootEl.style.left = Math.min(160, 16 + Math.round(Math.max(40, maxH*0.6))) + 'px';
        rootEl.style.bottom = (18 + Math.round(maxH*0.5)) + 'px';
      } else {
        rootEl.style.left = '16px'; rootEl.style.bottom = '18px';
      }
    }catch(e){}
  }

  /* ---------- iOS VisualViewport keyboard fix ---------- */
  function attachViewportHandler(){
    if(window.visualViewport){
      let last = 0;
      visualViewport.addEventListener('resize', ()=>{
        try{
          const offset = Math.max(0, window.innerHeight - visualViewport.height);
          if(Math.abs(offset-last) < 6) return;
          last = offset;
          if(offset > 120){
            card.style.bottom = (offset - (navigator.userAgent.includes('iPhone')?4:0)) + 'px';
          } else {
            card.style.bottom = '';
          }
        }catch(e){}
      });
    } else {
      window.addEventListener('resize', ()=>{ card.style.bottom = ''; });
    }
  }

  /* ---------- initialization & bindings ---------- */
  function init(){
    // build UI suggestions
    buildSuggestions();
    // load session and corpus
    loadSession();
    // if corpus empty or older than X, rebuild from DOM
    buildCorpusFromDOM();
    attachViewportHandler();
    adaptCardHeight();

    /* --- Refine+ Patch Logic --- */
    // 3. Auto dark sync
    const darkSyncObserver = new MutationObserver(() => {
      const dark = document.body.classList.contains('dark');
      if(card) card.classList.toggle('dark', dark);
    });
    darkSyncObserver.observe(document.body, {attributes:true, attributeFilter:['class']});

    // 4. Glow for bot when replying
    const chatObserver = new MutationObserver((mut)=>{
      mut.forEach(m=>{
        m.addedNodes.forEach(node=>{
          // Check if node is an element and has the right classes
          if(node.nodeType === 1 && node.classList.contains('m-msg') && node.classList.contains('bot')){
            node.classList.add('glow');
            setTimeout(()=> node.classList.remove('glow'), 1200);
          }
        });
      });
    });
    if(bodyEl) chatObserver.observe(bodyEl, {childList:true});
    /* ----------------------------- */

    // bind events
    bubble.addEventListener('click', ()=>{ if(!isOpen){ buildCorpusFromDOM(); openChat(); } else closeChat(); });
    overlay.addEventListener('click', (e)=>{ if(e.target===overlay) closeChat(); });
    closeBtn.addEventListener('click', closeChat);
    clearBtn.addEventListener('click', ()=>{ sessionMsgs=[]; saveSession(); bodyEl.innerHTML=''; addMessage('bot','🗑 Đã xóa hội thoại.'); });

    // Handle Send Click (Merged with Shake effect)
    sendBtn.addEventListener('click', ()=>{
      const v = (inputEl.value||'').trim();
      if(v){
        // Shake effect: find the last user message to apply the animation
        const msgEls = bodyEl.querySelectorAll('.m-msg.user');
        const last = msgEls[msgEls.length-1];
        // The message is added *before* sendQuery is called, so shake should apply to the new message.
        // We simulate the shake after the message is added in sendQuery
        setTimeout(() => {
            const newMsgEls = bodyEl.querySelectorAll('.m-msg.user');
            const newLast = newMsgEls[newMsgEls.length-1];
            if(newLast){
              newLast.classList.add('shake');
              setTimeout(()=> newLast.classList.remove('shake'), 280);
            }
        }, 10);
        
        inputEl.value='';
        sendQuery(v);
      }
    });
    
    // Handle Enter Key
    inputEl.addEventListener('keydown', (e)=>{ 
        if(e.key==='Enter' && !e.shiftKey){ 
            e.preventDefault(); 
            const v = (inputEl.value||'').trim(); 
            if(v){
                // Shake effect logic for Enter key
                setTimeout(() => {
                    const newMsgEls = bodyEl.querySelectorAll('.m-msg.user');
                    const newLast = newMsgEls[newMsgEls.length-1];
                    if(newLast){
                      newLast.classList.add('shake');
                      setTimeout(()=> newLast.classList.remove('shake'), 280);
                    }
                }, 10);

                inputEl.value=''; 
                sendQuery(v); 
            }
        } 
    });

    // typing indicator style small (already in v10.0 init)
    const styleTyping = document.createElement('style'); styleTyping.textContent = `
      #motoai-typing .dot{display:inline-block;margin:0 2px;opacity:.6;font-weight:700;animation:motoai-dot .9s linear infinite}
      #motoai-typing .dot:nth-child(2){animation-delay:.12s}#motoai-typing .dot:nth-child(3){animation-delay:.24s}
      @keyframes motoai-dot{0%{opacity:.2;transform:translateY(0)}50%{opacity:1;transform:translateY(-4px)}100%{opacity:.2;transform:translateY(0)} }`;
    document.head.appendChild(styleTyping);

    // periodic avoidOverlap
    setInterval(avoidOverlap, 1200);
    window.addEventListener('resize', ()=>{ adaptCardHeight(); setTimeout(avoidOverlap,260); });
  }

  /* ---------- adapt card height responsive ---------- */
  function adaptCardHeight(){
    try{
      const vw = Math.max(document.documentElement.clientWidth, window.innerWidth||0);
      const vh = Math.max(document.documentElement.clientHeight, window.innerHeight||0);
      let h = Math.round(vh * (vw >= 900 ? 0.6 : vw >= 700 ? 0.68 : 0.78));
      h = Math.max(320, Math.min(760, h));
      card.style.height = h + 'px';
    }catch(e){}
  }

  /* ---------- expose small API ---------- */
  window.MotoAI_v10 = {
    open: openChat,
    close: closeChat,
    rebuildCorpus: buildCorpusFromDOM,
    getName: getUserName,
    clearMemory: ()=>{ try{ localStorage.removeItem(CFG.memoryKeyName); }catch(e){} }
  };

  /* ---------- bootstrap ---------- */
  setTimeout(init, 160);

  /* ---------- Học toàn repo (Self-learn all pages) ---------- */
async function learnFromRepo(){
  try{
    // Thêm đoạn kiểm tra localStorage ở đây
    const lastLearn = localStorage.getItem('MotoAI_lastLearn');
    const threeDays = 3 * 24 * 60 * 60 * 1000;
    if (lastLearn && (Date.now() - lastLearn) < threeDays) {
      console.log('⏳ Bỏ qua học toàn repo: Chưa đủ 3 ngày kể từ lần học cuối.');
      return;
    }
    // Kết thúc đoạn kiểm tra

    const sitemap = CFG.sitemapPath || '/moto_sitemap.json';
    const res = await fetch(sitemap, { cache: 'no-store' });
    if (!res.ok) {
      console.log('⚠️ Không tìm thấy file sitemap:', sitemap);
      return;
    }

    const data = await res.json();
    if (!data.pages || !Array.isArray(data.pages)) {
      console.log('⚠️ Định dạng moto_sitemap.json không hợp lệ');
      return;
    }

    console.log(`📖 AIPro1 đang đọc ${data.pages.length} trang trong repo...`);
    let totalNew = 0;

    for (const path of data.pages) {
      try {
        const r = await fetch(path, { cache: 'no-store' });
        if (!r.ok) continue;

        const txt = await r.text();
        const lines = txt
          .split(/[\r\n]+/)
          .map(l => l.trim())
          .filter(l => l.length > CFG.minSentenceLength);

        lines.forEach(t => {
          if (!corpus.find(c => c.text === t)) {
            corpus.push({ id: corpus.length, text: t, tokens: tokenize(t) });
            totalNew++;
          }
        });

        console.log(`📚 Học từ ${path}: +${lines.length} câu`);
      } catch (e) {
        console.log('⚠️ Lỗi đọc trang', path, e);
      }
    }

    // ✅ Log hoàn thành học repo — đặt ở đây
    console.log('✅ Học xong toàn repo:', corpus.length, 'mẫu, mới thêm', totalNew);

    try {
      localStorage.setItem(CFG.corpusKey, JSON.stringify(corpus));
      // Cập nhật thời điểm học cuối cùng
      localStorage.setItem('MotoAI_lastLearn', Date.now()); 
    } catch (e) {
      console.warn('⚠️ Không thể lưu corpus vào localStorage:', e);
    }

  } catch (e) {
    console.error('❌ Lỗi learnFromRepo:', e);
  }
}

/* ---------- Gọi tự động sau khi khởi động AI ---------- */
window.addEventListener('load', () => {
  setTimeout(() => {
    console.log('⏳ Bắt đầu học toàn repo sau khi trang load...');
    learnFromRepo();
  }, 2500);
});

})();

