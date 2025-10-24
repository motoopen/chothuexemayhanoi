/* motoai_v14_combo_standalone.js  — PART 1/3
   MotoAI v14 Combo Standalone — Part 1: BOOT + UI CORE + SAFE INJECT
   NOTE: This file is intended to be assembled from Part1 + Part2 + Part3 into one final file.
   Copy Part1, then append Part2, then Part3 to produce motoai_v14_combo_standalone.js
*/
(function(){
  // guard: avoid double-load
  if(window.MotoAI_v14_COMBO_LOADED){
    console.log('MotoAI v14 Combo already loaded.');
    return;
  }
  window.MotoAI_v14_COMBO_LOADED = true;
  console.log('%c✅ MotoAI v14 Combo — initializing (PART 1/3)...', 'color:#0a84ff;font-weight:bold;');

  /* ---------- CONFIG ---------- */
  const CFG = {
    maxCorpusSentences: 900,
    minSentenceLength: 18,
    suggestionTags: [
      {q:'Xe số', label:'🏍 Xe số'},
      {q:'Xe ga', label:'🛵 Xe ga'},
      {q:'Thủ tục', label:'📄 Thủ tục'},
      {q:'Xe 50cc', label:'🚲 Xe 50cc'},
      {q:'Liên hệ 0857255868', label:'☎️ Liên hệ'}
    ],
    memoryKeyName: 'MotoAI_v14_combo_user_name',
    corpusKey: 'MotoAI_v14_combo_corpus',
    sessionKey: 'MotoAI_v14_combo_session_msgs',
    sitemapPath: '/moto_sitemap.json',
    uiZIndex: 9999999
  };

  /* ---------- SAFE INJECT: HTML + CSS ---------- */
  const uiHtml = `
  <div id="motoai-root" aria-hidden="false" data-motoai="v14" style="display:none">
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

  const uiCss = `
  :root{
    --m14-accent:#0a84ff;
    --m14-card-bg: #f5f7fa;
    --m14-card-bg-dark:#0b0c0e;
    --m14-blur: blur(10px) saturate(125%);
    --m14-radius:16px;
    --m14-glass-border: rgba(0,0,0,0.06);
    --m14-footer-bg: rgba(255,255,255,0.78);
    --m14-text: #111;
    --m14-bg: #fff;
  }

  #motoai-root { position: fixed; left: 18px; bottom: 22px; z-index: ${CFG.uiZIndex}; pointer-events: none; font-family: -apple-system, Inter, system-ui, Roboto, "Helvetica Neue", Arial; }
  #motoai-bubble {
    pointer-events: auto; width:56px; height:56px; border-radius:14px;
    display:flex;align-items:center;justify-content:center;font-size:26px;
    background:var(--m14-accent); color:#fff; box-shadow:0 8px 28px rgba(2,6,23,0.35); cursor:pointer; transition:transform .14s ease;
  }
  #motoai-bubble:hover{ transform: scale(1.06); }

  #motoai-overlay{
    position:fixed; inset:0; display:flex; align-items:flex-end; justify-content:center;
    padding:12px; pointer-events:none; transition:background .22s ease; z-index:${CFG.uiZIndex-1};
  }
  #motoai-overlay.visible{ background: rgba(0,0,0,0.36); pointer-events:auto; }

  #motoai-card{
    width:min(920px,calc(100% - 40px)); max-width:920px; border-radius: var(--m14-radius) var(--m14-radius) 10px 10px;
    height:70vh; max-height:740px; min-height:300px; background:var(--m14-card-bg);
    backdrop-filter: var(--m14-blur); box-shadow: 0 -18px 60px rgba(0,0,0,0.28);
    display:flex; flex-direction:column; overflow:hidden; transform: translateY(110%); opacity:0; pointer-events:auto;
    transition: transform .36s cubic-bezier(.2,.9,.2,1), opacity .28s;
    color:var(--m14-text);
  }
  #motoai-overlay.visible #motoai-card { transform: translateY(0); opacity:1; }

  #motoai-handle { width:64px; height:6px; background: rgba(160,160,160,0.6); border-radius:6px; margin:10px auto; }
  #motoai-header{ display:flex; align-items:center; justify-content:space-between; padding:8px 14px; font-weight:700; color:var(--m14-accent); border-bottom:1px solid rgba(0,0,0,0.06); }
  #motoai-header .tools button { background:none; border:none; font-size:18px; cursor:pointer; padding:6px 8px; color:var(--m14-text); }
  #motoai-body{ flex:1; overflow:auto; padding:12px 16px; font-size:15px; background:transparent; -webkit-overflow-scrolling:touch; }
  #motoai-suggestions{ display:flex; gap:8px; justify-content:center; padding:8px 12px; border-top:1px solid rgba(0,0,0,0.04); flex-wrap:wrap; background: rgba(255,255,255,0.62); backdrop-filter: blur(8px); }
  #motoai-suggestions button { border:none; background: rgba(0,122,255,0.08); color:var(--m14-accent); padding:8px 12px; border-radius:12px; cursor:pointer; font-weight:600; }

  #motoai-footer{ display:flex; align-items:center; gap:8px; padding:10px; border-top:1px solid var(--m14-glass-border); background:var(--m14-footer-bg); }
  #motoai-input{ flex:1; padding:10px 12px; border-radius:12px; border:1px solid var(--m14-glass-border); font-size:15px; background:var(--m14-bg); color:var(--m14-text); }
  #motoai-send{ background:var(--m14-accent); color:#fff; border:none; border-radius:12px; padding:10px 16px; cursor:pointer; flex-shrink:0; transition:transform .18s; }
  #motoai-send:hover{ transform: scale(1.06); }

  .m-msg{ margin:8px 0; padding:12px 14px; border-radius:14px; max-width:86%; line-height:1.4; word-break:break-word; box-shadow:0 6px 18px rgba(2,6,23,0.08); }
  .m-msg.bot{ background: rgba(255,255,255,0.92); color:#111; }
  .m-msg.user{ background: linear-gradient(180deg,var(--m14-accent),#0066d9); color:#fff; margin-left:auto; box-shadow:0 8px 22px rgba(10,132,255,0.15); }

  @media (prefers-color-scheme:dark){
    :root{ --m14-card-bg:var(--m14-card-bg-dark); --m14-footer-bg: rgba(16,16,18,0.9); --m14-text:#f2f2f7; }
    .m-msg.bot{ background: rgba(30,31,33,0.9); color:#f2f2f7; }
    .m-msg.user{ background: linear-gradient(180deg,#0a84ff,#0071e3); }
    #motoai-suggestions{ background: rgba(20,20,22,0.9); }
    #motoai-header .tools button{ color:#f2f2f7; }
  }

  @media (max-width:520px){
    #motoai-card{ width: calc(100% - 24px); height:78vh; min-height:260px; }
    #motoai-bubble{ width:50px; height:50px; font-size:24px; border-radius:12px; }
  }

  /* Force visible helpers (in case host site tries to hide) */
  #motoai-root, #motoai-bubble, #motoai-overlay, #motoai-card { visibility: visible !important; }
  `;

  // safely append HTML+CSS when DOM ready (avoids insert issues if script runs early)
  function safeInjectUI(){
    if(document.getElementById('motoai-root')) return;
    try {
      // inject HTML at end of body
      if(document.body){
        document.body.insertAdjacentHTML('beforeend', uiHtml);
        // create style element
        const styleEl = document.createElement('style');
        styleEl.setAttribute('data-motoai','v14-style');
        styleEl.textContent = uiCss;
        document.head.appendChild(styleEl);
        // ensure element visible
        const root = document.getElementById('motoai-root');
        if(root) root.style.display = '';
      } else {
        console.warn('MotoAI v14: document.body not available yet.');
      }
    } catch (e){
      console.error('MotoAI v14 — safeInjectUI error:', e);
    }
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', safeInjectUI);
  } else {
    safeInjectUI();
  }

  /* ---------- Basic refs (may be undefined until injected) ---------- */
  // We'll re-query in later parts once UI exists
  // Expose a helper to get elements safely
  function $safe(sel){ return document.getElementById(sel.replace(/^#/,'')) || document.querySelector(sel); }

  // Minimal initial state placeholders (will be populated by later parts)
  window.MotoAI_v14_state = {
    isOpen: false,
    sendLock: false,
    corpus: [],
    sessionMsgs: []
  };

  // Provide light API so loader/other scripts can check readiness
  window.MotoAI_v14 = window.MotoAI_v14 || {};
  Object.assign(window.MotoAI_v14, {
    cfg: CFG,
    injectUI: safeInjectUI,
    isReady: function(){ return !!document.getElementById('motoai-root'); },
    uiZIndex: CFG.uiZIndex
  });

  console.log('%cℹ️ MotoAI v14 PART 1 injected UI shell (waiting for PART 2/3)...', 'color:#0a84ff');

  /* ---------- Small utility helpers used by later parts ---------- */
  // Robust tokenize with unicode fallback (safe for older browsers)
  function tokenizeSafe(s){
    try {
      return String(s || '').toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu,' ').split(/\s+/).filter(Boolean);
    } catch(e) {
      // fallback for browsers without \p support
      return String(s || '').toLowerCase().replace(/[^a-z0-9\u00C0-\u024F\s]+/gi,' ').split(/\s+/).filter(Boolean);
    }
  }
  window.MotoAI_v14.tokenizeSafe = tokenizeSafe;

  // Lightweight normalize function for Vietnamese
  function normalizeTextLite(text){
    if(!text) return '';
    return String(text).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').trim();
  }
  window.MotoAI_v14.normalizeTextLite = normalizeTextLite;

  /* ---------- End of PART 1/3: UI core injected, helpers exposed ----------
     Next: Part 2/3 will include retrieval, corpus, session persistence, UI wiring, and sendQuery core.
     Then Part 3/3 will include Smart Engine rules, SpellFix, theme sync, learnFromRepo, and final bootstrap.
  */
/* motoai_v14_combo_standalone.js — PART 2/3
   MotoAI v14 Combo — Core Logic, Corpus, Session, UI Wiring
   (Append directly after Part 1, inside same IIFE)
*/

  console.log('%c⚙️ MotoAI v14 PART 2 — Core Logic loaded', 'color:#0a84ff');

  const CFG = window.MotoAI_v14.cfg;
  const ST = window.MotoAI_v14_state;
  const $ = sel => document.querySelector(sel);

  /* ---------- Corpus builder ---------- */
  function buildCorpusFromDOM(){
    try{
      let nodes = Array.from(document.querySelectorAll('main, article, section'));
      if(!nodes.length) nodes = [document.body];
      let texts = [];
      nodes.forEach(n=>{
        Array.from(n.querySelectorAll('h1,h2,h3')).forEach(h=>{
          if(h.innerText && h.innerText.trim().length>10) texts.push(h.innerText.trim());
        });
        Array.from(n.querySelectorAll('p, li')).forEach(p=>{
          const t = p.innerText.trim();
          if(t.length >= CFG.minSentenceLength) texts.push(t);
        });
      });
      if(!texts.length){
        const meta = document.querySelector('meta[name="description"]');
        if(meta && meta.content) texts.push(meta.content);
      }
      const uniqTexts = Array.from(new Set(texts)).slice(0, CFG.maxCorpusSentences);
      const currentTexts = new Set(ST.corpus.map(c=>c.text));
      uniqTexts.forEach(t=>{
        if(!currentTexts.has(t)){
          ST.corpus.push({id:ST.corpus.length, text:t, tokens:window.MotoAI_v14.tokenizeSafe(t)});
        }
      });
      localStorage.setItem(CFG.corpusKey, JSON.stringify(ST.corpus));
      console.log(`📚 MotoAI v14 built corpus: ${ST.corpus.length} items`);
    }catch(e){
      console.error('MotoAI v14 buildCorpusFromDOM error:', e);
    }
  }

  /* ---------- Corpus restore ---------- */
  (function restoreCorpus(){
    try{
      const raw = localStorage.getItem(CFG.corpusKey);
      if(raw){
        const parsed = JSON.parse(raw);
        if(Array.isArray(parsed) && parsed.length) ST.corpus = parsed;
      }
    }catch(e){}
  })();

  /* ---------- Session persistence ---------- */
  function loadSession(){
    try{
      const raw = sessionStorage.getItem(CFG.sessionKey);
      if(raw){
        ST.sessionMsgs = JSON.parse(raw);
      }
    }catch(e){ ST.sessionMsgs=[]; }
    if(!Array.isArray(ST.sessionMsgs)) ST.sessionMsgs=[];
  }

  function saveSession(){
    try{
      sessionStorage.setItem(CFG.sessionKey, JSON.stringify(ST.sessionMsgs));
    }catch(e){}
  }

  /* ---------- Memory: name ---------- */
  function saveUserName(name){
    try{ localStorage.setItem(CFG.memoryKeyName,name);}catch(e){}
  }
  function getUserName(){
    try{ return localStorage.getItem(CFG.memoryKeyName);}catch(e){return null;}
  }
  function detectNameFromText(txt){
    if(!txt) return null;
    const s = txt.replace(/\s+/g,' ').trim();
    const patterns = [
      /(?:tôi tên là|tên tôi là|mình tên là)\s+([A-Za-zÀ-ỹ\u00C0-\u024F0-9_\- ]{2,40})/i,
      /(?:tôi là|mình là)\s+([A-Za-zÀ-ỹ\u00C0-\u024F0-9_\- ]{2,40})/i
    ];
    for(const p of patterns){
      const m = s.match(p);
      if(m && m[1]){ const nm=m[1].trim(); saveUserName(nm); return nm; }
    }
    return null;
  }

  /* ---------- Retrieval basic ---------- */
  function retrieveBestAnswer(query){
    if(!query) return null;
    const qTokens = window.MotoAI_v14.tokenizeSafe(query);
    if(!qTokens.length || !ST.corpus.length) return null;
    let best={score:0,text:null};
    for(const c of ST.corpus){
      let sc=0;
      for(const qt of qTokens){
        if(c.tokens.includes(qt)) sc+=1;
      }
      if(c.text.toLowerCase().includes(query.toLowerCase())) sc+=0.6;
      if(sc>best.score) best={score:sc,text:c.text};
    }
    return best.score>0?best.text:null;
  }

  /* ---------- UI helpers ---------- */
  function addMessage(role, text){
    const bodyEl = $('#motoai-body');
    if(!bodyEl) return;
    const el = document.createElement('div');
    el.className = 'm-msg '+(role==='user'?'user':'bot');
    el.textContent = text;
    bodyEl.appendChild(el);
    bodyEl.scrollTop = bodyEl.scrollHeight;
    ST.sessionMsgs.push({role,text,t:Date.now()});
    saveSession();
    return el;
  }

  function buildSuggestions(){
    const wrap = $('#motoai-suggestions');
    if(!wrap) return;
    wrap.innerHTML='';
    CFG.suggestionTags.forEach(s=>{
      const b=document.createElement('button');
      b.textContent=s.label;
      b.dataset.q=s.q;
      b.onclick=()=>{ if(!ST.isOpen) openChat(); setTimeout(()=> sendQuery(s.q), 100); };
      wrap.appendChild(b);
    });
  }

  function showTypingDots(){
    const t=$('#motoai-typing');
    if(t) t.innerHTML='<span class="dot">.</span><span class="dot">.</span><span class="dot">.</span>';
  }
  function hideTypingDots(){
    const t=$('#motoai-typing');
    if(t) t.innerHTML='';
  }

  /* ---------- Chat open/close ---------- */
  function openChat(){
    const overlay=$('#motoai-overlay'),card=$('#motoai-card');
    if(ST.isOpen||!overlay||!card)return;
    overlay.classList.add('visible');
    card.setAttribute('aria-hidden','false');
    ST.isOpen=true;
    const name=getUserName();
    if(name) setTimeout(()=>addMessage('bot',`Chào ${name}! Mình nhớ bạn rồi 👋`),400);
    renderSession();
    setTimeout(()=>{ try{$('#motoai-input').focus();}catch(e){} },320);
    document.documentElement.style.overflow='hidden';
  }

  function closeChat(){
    const overlay=$('#motoai-overlay'),card=$('#motoai-card');
    if(!ST.isOpen||!overlay||!card)return;
    overlay.classList.remove('visible');
    card.setAttribute('aria-hidden','true');
    ST.isOpen=false;
    document.documentElement.style.overflow='';
    hideTypingDots();
  }

  function renderSession(){
    const bodyEl=$('#motoai-body');
    if(!bodyEl)return;
    bodyEl.innerHTML='';
    if(ST.sessionMsgs.length){
      ST.sessionMsgs.forEach(m=>{
        const el=document.createElement('div');
        el.className='m-msg '+(m.role==='user'?'user':'bot');
        el.textContent=m.text;
        bodyEl.appendChild(el);
      });
      bodyEl.scrollTop=bodyEl.scrollHeight;
    }else{
      addMessage('bot','👋 Xin chào! Mình là MotoAI v14 — hỏi thử “Xe ga”, “Xe số”, “Thủ tục”, hoặc “Xe 50cc” nhé!');
    }
  }

  /* ---------- SendQuery basic (will be enhanced by Smart Engine in Part 3) ---------- */
  function sendQuery(text){
    if(!text||!text.trim())return;
    const inputEl=$('#motoai-input');
    const sendBtn=$('#motoai-send');
    if(ST.sendLock)return;
    ST.sendLock=true;
    if(sendBtn) sendBtn.disabled=true;

    addMessage('user',text);
    const name=detectNameFromText(text);
    if(name){
      addMessage('bot',`Đã nhớ tên: ${name} ✨`);
      ST.sendLock=false;
      if(sendBtn) sendBtn.disabled=false;
      return;
    }

    showTypingDots();
    setTimeout(()=>{
      try{
        const ans=retrieveBestAnswer(text);
        hideTypingDots();
        if(ans){
          addMessage('bot',ans);
        }else{
          addMessage('bot','Xin lỗi, mình chưa tìm thấy nội dung cụ thể trên trang này. Bạn thử hỏi khác nhé!');
        }
      }catch(e){
        console.error(e);
        addMessage('bot','Lỗi khi xử lý câu trả lời.');
      }finally{
        ST.sendLock=false;
        if(sendBtn) sendBtn.disabled=false;
      }
    },320);
  }

  /* ---------- Event wiring ---------- */
  function bindUIEvents(){
    const bubble=$('#motoai-bubble'),overlay=$('#motoai-overlay');
    const closeBtn=$('#motoai-close'),clearBtn=$('#motoai-clear');
    const sendBtn=$('#motoai-send'),inputEl=$('#motoai-input');

    if(bubble) bubble.onclick=()=>{ if(!ST.isOpen){ buildCorpusFromDOM(); openChat(); } else closeChat(); };
    if(overlay) overlay.onclick=(e)=>{ if(e.target===overlay) closeChat(); };
    if(closeBtn) closeBtn.onclick=closeChat;
    if(clearBtn) clearBtn.onclick=()=>{ ST.sessionMsgs=[]; saveSession(); $('#motoai-body').innerHTML=''; addMessage('bot','🗑 Đã xóa hội thoại.'); };
    if(sendBtn) sendBtn.onclick=()=>{ const v=inputEl.value.trim(); if(v){ inputEl.value=''; sendQuery(v);} };
    if(inputEl) inputEl.addEventListener('keydown',(e)=>{ if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); const v=inputEl.value.trim(); if(v){ inputEl.value=''; sendQuery(v);} }});
    document.addEventListener('keydown',(e)=>{ if(e.key==='Escape'&&ST.isOpen) closeChat(); });
  }

  /* ---------- Init core ---------- */
  function initCore(){
    buildSuggestions();
    loadSession();
    buildCorpusFromDOM();
    bindUIEvents();
    console.log('%c✅ MotoAI v14 Core ready (Part2/3 complete)', 'color:#0a84ff');
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',initCore);
  }else initCore();

  // Expose basic API for next part
  Object.assign(window.MotoAI_v14,{
    buildCorpusFromDOM,
    sendQuery,
    openChat,
    closeChat,
    addMessage,
    getUserName,
    detectNameFromText,
    renderSession
  });

/* ---------- End of PART 2/3 ----------
   Next: Part 3/3 will include Smart Engine, SpellFix, Theme Sync, Auto Learn, and final bootstrap.
*/

 /* motoai_v14_combo_standalone.js — PART 3/3
   MotoAI v14 Combo — Smart Engine, SpellFix, Theme Sync, Auto Learn, Final Bootstrap
   (Append directly after Part 2)
*/

  console.log('%c🤖 MotoAI v14 PART 3 — Smart Engine + Learn system loaded', 'color:#0a84ff');

  const CFG = window.MotoAI_v14.cfg;
  const ST = window.MotoAI_v14_state;
  const normalize = window.MotoAI_v14.normalizeTextLite;

  /* ---------- Smart Engine Rules (v14, base from v13 but improved weight) ---------- */
  const rules = [
    { pattern: /^(chào|hi|hello|alo|xin chào|hỗ trợ|giúp|cứu|hỏi)$/i,
      answer: [
        "Chào bạn! Mình là MotoAI 🤖. Mình có thể giúp gì về thuê xe máy nhỉ?",
        "Xin chào! Bạn muốn hỏi về xe số, xe ga, thủ tục hay bảng giá thuê xe?",
        "MotoAI nghe! Bạn cần hỗ trợ thông tin gì ạ?"
      ]
    },
    { pattern: /(xe số|wave|sirius|blade|future|exciter|winner|ex150|150cc)/i,
      keywords: ['xe số','wave','sirius','future','exciter','winner'],
      answer: [
        "Xe số 🏍 tiết kiệm xăng, giá rẻ, phù hợp đi lại hàng ngày. Giá thuê chỉ từ 100k/ngày.",
        "Dòng xe số rất bền và dễ đi — bạn muốn thuê loại nào để mình báo giá cụ thể?"
      ]
    },
    { pattern: /(xe ga|tay ga|vision|lead|air blade|sh|vespa)/i,
      keywords: ['xe ga','tay ga','vision','lead','airblade','vespa'],
      answer: [
        "Xe ga 🛵 êm ái, cốp rộng, phù hợp đi trong phố. Vision, Lead chỉ từ 120k/ngày.",
        "Xe ga rất được ưa chuộng — bạn muốn xem bảng giá chi tiết không?"
      ]
    },
    { pattern: /(50cc|không cần bằng|chưa có bằng|học sinh|sinh viên)/i,
      keywords: ['50cc','không cần bằng','chưa có bằng'],
      answer: [
        "Xe 50cc không cần GPLX, chỉ cần CCCD 📋. Rất phù hợp cho học sinh, sinh viên!",
        "Nếu bạn chưa có bằng, xe 50cc là lựa chọn hoàn hảo. Bạn muốn xem giá xe 50cc không?"
      ]
    },
    { pattern: /(thủ tục|giấy tờ|cần gì|điều kiện|cọc|đặt cọc)/i,
      answer: [
        "Thủ tục thuê xe rất đơn giản! 📄 Chỉ cần CCCD và GPLX. Xe 50cc thì chỉ cần CCCD.",
        "Về thủ tục, bạn chuẩn bị CCCD + bằng lái, không cần đặt cọc tiền mặt nhé."
      ]
    },
    { pattern: /(giá|bảng giá|bao nhiêu|thuê bao nhiêu)/i,
      answer: [
        "Bảng giá thuê xe 💰:\n- Xe số: 100k–120k/ngày\n- Xe ga: 120k–150k/ngày\n- Xe côn: 200k–250k/ngày",
        "Giá thuê xe dao động từ 100k đến 150k/ngày tùy loại. Thuê dài hạn giảm giá thêm nhé!"
      ]
    },
    { pattern: /(liên hệ|hotline|zalo|sđt|địa chỉ|cửa hàng|ở đâu)/i,
      answer: [
        "Bạn liên hệ ☎️ 085.725.5868 (có Zalo) nhé!\nCửa hàng tại Nguyễn Văn Cừ — có giao xe tận nơi.",
        "Liên hệ nhanh qua Zalo/Hotline: 0857255868. Hỗ trợ giao xe tận nơi 24/7!"
      ]
    },
    { pattern: /(giao xe|ship|vận chuyển|sân bay|bến xe|tận nơi)/i,
      answer: [
        "Có ạ! 🚀 Giao xe tận nơi miễn phí trong nội thành Hà Nội, bến xe và sân bay.",
        "Dịch vụ giao xe tận nơi hoàn toàn miễn phí — bạn gửi địa chỉ là có xe ngay!"
      ]
    },
    { pattern: /^(cảm ơn|thanks|ok|oke|tốt quá|hay quá|tuyệt vời)$/i,
      answer: [
        "Không có gì ạ! 😊",
        "Rất vui được hỗ trợ bạn!",
        "Cảm ơn bạn, chúc bạn có chuyến đi an toàn 🚗✨"
      ]
    },
    { pattern: /.+/i, isFallback:true,
      answer: [
        "Xin lỗi, mình chưa hiểu rõ câu hỏi này. Bạn thử hỏi 'Giá thuê xe', 'Xe ga', hoặc 'Thủ tục' nhé.",
        "Mình chưa có dữ liệu câu hỏi này. Bạn có thể hỏi về bảng giá, loại xe, hoặc gọi 085.725.5868 nha."
      ]
    }
  ];

  /* ---------- SmartAnswer logic ---------- */
  function smartAnswer(query){
    const qn = normalize(query);
    let best = null, bestScore = 0;
    for(const rule of rules){
      if(rule.isFallback) continue;
      let score = 0;
      if(rule.pattern.test(query) || rule.pattern.test(qn)) score += 2;
      if(rule.keywords){
        for(const kw of rule.keywords){
          if(qn.includes(normalize(kw))) score += 1;
        }
      }
      if(score > bestScore){ best = rule; bestScore = score; }
    }
    if(best && bestScore>0.5){
      const a = best.answer[Math.floor(Math.random()*best.answer.length)];
      return a;
    }
    // fallback
    const fb = rules.find(r=>r.isFallback);
    return fb? fb.answer[Math.floor(Math.random()*fb.answer.length)] : "Xin lỗi, mình chưa hiểu câu hỏi.";
  }

  /* ---------- SpellFix system ---------- */
  const spellFixMap = {
    'thue xe may':'thuê xe máy','xe so':'xe số','xe ga':'xe ga','thu tuc':'thủ tục',
    'giay to':'giấy tờ','bang gia':'bảng giá','lien he':'liên hệ','thue xe ha noi':'thuê xe Hà Nội'
  };
  function autoFix(text){
    let t = text.toLowerCase();
    for(const [wrong,right] of Object.entries(spellFixMap)){
      const re = new RegExp(`\\b${wrong}\\b`,'gi');
      t = t.replace(re,right);
    }
    return t;
  }

  /* ---------- Theme sync (auto detect + body class) ---------- */
  (function(){
    function applyTheme(){
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const dark = prefersDark || document.body.classList.contains('dark');
      document.body.dataset.theme = dark?'dark':'light';
    }
    applyTheme();
    try{ window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change',applyTheme); }catch(e){}
    const obs = new MutationObserver(applyTheme);
    obs.observe(document.body,{attributes:true,attributeFilter:['class']});
  })();

  /* ---------- Learn (optional fetch from sitemap) ---------- */
  async function learnFromRepo(){
    try{
      const sitemap = CFG.sitemapPath;
      const res = await fetch(sitemap,{cache:'no-store'});
      if(!res.ok) return;
      const data = await res.json();
      if(!data.pages) return;
      const current = new Set(ST.corpus.map(c=>c.text));
      let added=0;
      for(const path of data.pages){
        const r = await fetch(path,{cache:'no-store'});
        if(!r.ok) continue;
        const txt = await r.text();
        const lines = txt.split(/[\r\n]+/).map(l=>l.trim()).filter(l=>l.length>CFG.minSentenceLength);
        for(const t of lines){
          if(!current.has(t)){
            ST.corpus.push({id:ST.corpus.length,text:t,tokens:window.MotoAI_v14.tokenizeSafe(t)});
            current.add(t); added++;
          }
        }
      }
      if(added>0) localStorage.setItem(CFG.corpusKey,JSON.stringify(ST.corpus));
      console.log(`📘 MotoAI learned ${added} new texts.`);
    }catch(e){ console.warn('MotoAI learnFromRepo error:',e); }
  }

  /* ---------- Enhanced sendQuery (uses smartAnswer + spellfix + retrieval fallback) ---------- */
  function smartSendQuery(text){
    if(!text||!text.trim())return;
    const inputEl=$('#motoai-input');
    const sendBtn=$('#motoai-send');
    if(ST.sendLock)return;
    ST.sendLock=true;
    if(sendBtn) sendBtn.disabled=true;
    const fixed = autoFix(text);
    window.MotoAI_v14.addMessage('user',fixed);

    const name = window.MotoAI_v14.detectNameFromText(fixed);
    if(name){
      window.MotoAI_v14.addMessage('bot',`Đã nhớ tên: ${name} ✨`);
      ST.sendLock=false;
      if(sendBtn) sendBtn.disabled=false;
      return;
    }

    showTypingDots();
    setTimeout(()=>{
      try{
        let ans = smartAnswer(fixed);
        if(!ans) ans = retrieveBestAnswer(fixed);
        hideTypingDots();
        window.MotoAI_v14.addMessage('bot', ans || 'Mình chưa có câu trả lời cho câu này.');
      }catch(e){
        hideTypingDots();
        window.MotoAI_v14.addMessage('bot','Lỗi khi xử lý câu hỏi.');
        console.error(e);
      }finally{
        ST.sendLock=false;
        if(sendBtn) sendBtn.disabled=false;
      }
    }, 250);
  }

  // override main send
  window.MotoAI_v14.sendQuery = smartSendQuery;

  /* ---------- Final bootstrap ---------- */
  window.addEventListener('load', ()=>{
    setTimeout(()=>{ learnFromRepo(); }, 1500);
    console.log('%c🚀 MotoAI v14 Combo Standalone fully loaded — Ready!', 'color:#0a84ff;font-weight:bold;');
  });

})(); // END of entire MotoAI v14 Combo Standalone
