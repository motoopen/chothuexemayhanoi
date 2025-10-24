/* motoai_v13_combo_standalone.js
   MotoAI v13 Combo Standalone — Full UI (v10) + Smart Engine (v13)
   NOTE: Paste Part 1, then Part 2, then Part 3 into a single file.
*/

/* ===========================
   PART 1/3 — UI + CORE (from v10)
   =========================== */
(function(){
  if(window.MotoAI_v13_COMBO_LOADED) {
    console.log('MotoAI v13 Combo already loaded.');
    return;
  }
  window.MotoAI_v13_COMBO_LOADED = true;

  console.log('✅ MotoAI v13 Combo — initializing UI core...');

  /* -------- CONFIG -------- */
  const CFG = {
    maxCorpusSentences: 600,
    minSentenceLength: 20,
    suggestionTags: [
      {q:'Xe số', label:'🏍 Xe số'},
      {q:'Xe ga', label:'🛵 Xe ga'},
      {q:'Thủ tục', label:'📄 Thủ tục'},
      {q:'Xe 50cc', label:'🚲 Xe 50cc'},
      {q:'Liên hệ 0857255868', label:'☎️ Liên hệ'}
    ],
    memoryKeyName: 'MotoAI_v13_combo_user_name',
    corpusKey: 'MotoAI_v13_combo_corpus',
    sessionKey: 'MotoAI_v13_combo_session_msgs',
    sitemapPath: '/moto_sitemap.json'
  };

  /* --------- HTML inject (UI) ---------- */
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

  /* ---------- CSS (UI styles) ---------- */
  const css = `
    :root{
      --m10-accent:#0a84ff;
      --m10-card-bg:#f5f7fa;
      --m10-card-bg-dark:#0b0c0e;
      --m10-blur:blur(10px) saturate(130%);
      --m10-radius:18px;
      --glass-border:rgba(0,0,0,0.08);
      --footer-bg:rgba(255,255,255,0.7);
      --bg:#ffffff;
      --text:#000000;
      --muted:#9aa4b2;
    }

    #motoai-root{position:fixed;left:16px;bottom:18px;z-index:9999;pointer-events:none}
    #motoai-bubble{
      pointer-events:auto;width:56px;height:56px;border-radius:14px;
      display:flex;align-items:center;justify-content:center;
      font-size:26px;background:var(--m10-accent);color:#fff;
      box-shadow:0 10px 28px rgba(2,6,23,0.5);cursor:pointer;
      transition:transform .16s;
    }
    #motoai-bubble:hover{transform:scale(1.06)}
    #motoai-overlay{
      position:fixed;inset:0;display:flex;align-items:flex-end;justify-content:center;
      padding:12px;pointer-events:none;transition:background .24s ease;
      z-index:9998;
    }
    #motoai-overlay.visible{background:rgba(0,0,0,0.4);pointer-events:auto}
    #motoai-card{
      width:min(920px,calc(100% - 36px));max-width:920px;
      border-radius:var(--m10-radius) var(--m10-radius) 10px 10px;
      height:72vh;max-height:760px;min-height:320px;
      background:var(--m10-card-bg);
      backdrop-filter:var(--m10-blur);
      box-shadow:0 -18px 60px rgba(0,0,0,0.25);
      display:flex;flex-direction:column;overflow:hidden;
      transform:translateY(110%);opacity:0;pointer-events:auto;
      transition:transform .36s cubic-bezier(.2,.9,.2,1),opacity .28s;
      color:var(--text);
    }
    #motoai-overlay.visible #motoai-card{transform:translateY(0);opacity:1}
    #motoai-handle{width:64px;height:6px;background:rgba(160,160,160,0.6);border-radius:6px;margin:10px auto}
    #motoai-body{flex:1;overflow:auto;padding:12px 16px;font-size:15px;background:transparent}

    #motoai-header{
      display:flex;align-items:center;justify-content:space-between;
      padding:8px 14px;font-weight:700;color:var(--m10-accent);
      border-bottom:1px solid rgba(0,0,0,0.06);
    }
    #motoai-header .tools button{background:none;border:none;font-size:18px;cursor:pointer;padding:6px 8px; color:var(--text);}

    .m-msg{margin:8px 0;padding:12px 14px;border-radius:16px;max-width:86%;line-height:1.4;word-break:break-word;box-shadow:0 6px 18px rgba(2,6,23,0.1);}
    .m-msg.bot{background:rgba(255,255,255,0.9);color:#111;}
    .m-msg.user{background:linear-gradient(180deg,var(--m10-accent),#0066d9);color:#fff;margin-left:auto;box-shadow:0 8px 26px rgba(10,132,255,0.2);}

    #motoai-suggestions{
      display:flex;gap:8px;justify-content:center;
      padding:8px 12px;border-top:1px solid rgba(0,0,0,0.04);
      flex-wrap:wrap;background:rgba(255,255,255,0.6);
      backdrop-filter:blur(8px);
    }
    #motoai-suggestions button{
      border:none;background:rgba(0,122,255,0.1);
      color:var(--m10-accent);padding:8px 12px;border-radius:12px;
      cursor:pointer;font-weight:600;
    }

    #motoai-footer{
      display:flex;align-items:center;justify-content:center;
      gap:8px;padding:10px;border-top:1px solid var(--glass-border);
      background:var(--footer-bg);backdrop-filter:blur(8px);
    }
    #motoai-input{
      flex:1;padding:10px 12px;border-radius:12px;
      border:1px solid var(--glass-border);
      font-size:15px;background:var(--bg);color:var(--text);
    }
    #motoai-send{
      background:var(--m10-accent);color:#fff;border:none;
      border-radius:12px;padding:10px 16px;cursor:pointer;
      flex-shrink:0;transition:all .25s;
    }
    #motoai-send:hover{transform:scale(1.08);}
    .m-msg.bot.glow{
      box-shadow:0 0 18px rgba(0,122,255,0.3);
      transition:box-shadow 0.8s ease;
    }

    @keyframes chatShake {
      0%,100%{transform:translateX(0);}
      25%{transform:translateX(2px);}
      50%{transform:translateX(-2px);}
      75%{transform:translateX(1px);}
    }
    .shake{animation:chatShake .25s linear;}

    body.dark #motoai-card{
      background:linear-gradient(180deg,#0b0c0e,#060607);
      color:#f2f2f7;
      box-shadow:0 12px 36px rgba(0,0,0,0.4);
    }
    body.dark #motoai-header .tools button{color:#f2f2f7;}

    @media (prefers-color-scheme:dark){
      :root{
        --m10-card-bg:var(--m10-card-bg-dark);
        --glass-border:rgba(255,255,255,0.08);
        --footer-bg:rgba(25,25,30,0.9);
        --bg:#0f1113;
        --text:#f2f2f7;
      }
      .m-msg.bot{background:rgba(35,37,39,0.9);color:#f2f2f7;}
      .m-msg.user{background:linear-gradient(180deg,#0a84ff,#0071e3);}
      #motoai-suggestions{background:rgba(25,25,30,0.9);}
      #motoai-header .tools button{color:#f2f2f7;}
    }
    @media (max-width:520px){
      #motoai-card{width:calc(100% - 24px);height:78vh;}
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
  let corpus = [];
  let sessionMsgs = [];

  function tokenize(s){ return s.toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu,' ').split(/\s+/).filter(Boolean); }
  function uniq(arr){ return Array.from(new Set(arr)); }

  /* ---------- End of PART 1 (UI core) ----------
     Continue to PART 2 for core logic, retrieval, persistence, and smart engine.
*/

 
/* ===========================
   PART 2/3 — Core logic, corpus, retrieval, session, init
   =========================== */

  /* -------- Corpus build: prefer <main>, <article>, <section>, headings, lists -------- */
  function buildCorpusFromDOM(){
    try{
      let nodes = Array.from(document.querySelectorAll('main, article, section'));
      if(!nodes.length) nodes = [document.body];
      let texts = [];
      nodes.forEach(n=>{
        Array.from(n.querySelectorAll('h1,h2,h3')).forEach(h=>{ if(h.innerText && h.innerText.trim().length>10) texts.push(h.innerText.trim()); });
        Array.from(n.querySelectorAll('p, li')).forEach(p=>{ const t = p.innerText.trim(); if(t.length>=CFG.minSentenceLength) texts.push(t); });
      });
      if(!texts.length){
        const meta = document.querySelector('meta[name="description"]');
        if(meta && meta.content) texts.push(meta.content);
        const bodyTxt = document.body.innerText || '';
        bodyTxt.split(/[.!?]\s+/).forEach(s=>{ if(s.trim().length>CFG.minSentenceLength) texts.push(s.trim()); });
      }
      const uniqTexts = uniq(texts).slice(0, CFG.maxCorpusSentences);
      const currentCorpusTexts = new Set(corpus.map(c => c.text));
      uniqTexts.forEach(t => {
          if (!currentCorpusTexts.has(t)) {
              corpus.push({id: corpus.length, text: t, tokens: tokenize(t)});
          }
      });
      if (corpus.length < uniqTexts.length) {
        corpus = uniqTexts.map((t,i)=>({id:i, text:t, tokens:tokenize(t)}));
      }
      try{ localStorage.setItem(CFG.corpusKey, JSON.stringify(corpus)); }catch(e){}
      console.log(`📚 MotoAI v13 Combo built corpus: ${corpus.length} items`);
    }catch(e){ corpus=[]; }
  }

  // Restore corpus from localStorage if present
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
      let score=0;
      for(const qt of qTokens){
        if(c.tokens.includes(qt)) score += 1;
      }
      if(c.text.toLowerCase().includes(query.toLowerCase())) score += 0.6;
      if(score>best.score){ best={score, text:c.text, id:c.id}; }
    }
    return best.score>0 ? best.text : null;
  }

  /* -------- Session persistence -------- */
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

  /* ---------- sendQuery placeholder (will be replaced by smart engine below) ---------- */
  async function sendQuery(text){
    if(!text || !text.trim()) return;
    if(sendLock) return;
    sendLock = true; sendBtn.disabled = true;
    hideTypingDots();

    addMessage('user', text);

    const name = detectNameFromText(text);
    if(name){
      addMessage('bot', `Đã nhớ tên: ${name} ✨`);
      sendLock=false; sendBtn.disabled=false;
      setTimeout(()=> inputEl.focus(), 120);
      return;
    }

    showTypingDots();

    setTimeout(()=>{
      try{
        let ans = retrieveBestAnswer(text);
        hideTypingDots();
        if(ans){
          addMessage('bot', ans);
        } else {
          addMessage('bot', 'Xin lỗi, mình chưa tìm thấy nội dung cụ thể trên trang này hoặc bộ nhớ học. Bạn thử hỏi khác nha.');
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

  /* ===========================
   PART 3/3 — Smart Engine (v13), SpellFix, Theme Sync, LearnFromRepo, final bootstrap
   =========================== */

/* ---------- Smart Engine Rules (from your v13 ruleset) ---------- */
const rules = [
  { pattern: /^(chào|hi|hello|alo|xin chào|hỗ trợ|giúp|cứu|hỏi)$/i,
    answer: [
      "Chào bạn! Mình là MotoAI 🤖. Mình có thể giúp gì về thuê xe máy nhỉ?",
      "Xin chào! Bạn muốn hỏi về xe số, xe ga, thủ tục hay bảng giá thuê xe?",
      "MotoAI nghe! Bạn cần hỗ trợ thông tin gì ạ?"
    ]
  },
  { pattern: /(xe số|xe wave|xe sirius|xe blade|vision|wave rsx|future|ex150|exciter 150|winner x|winner 150)/i,
    keywords: ['xe số', 'wave', 'sirius', 'blade', 'future', 'exciter', 'winner', 'ex150'],
    answer: [
      "Bạn tham khảo xe số nhé! 🏍️ Xe số thường tiết kiệm xăng, giá thuê rẻ, phù hợp đi lại hàng ngày hoặc đi phượt nhẹ nhàng. Bạn muốn xem bảng giá xe số không?",
      "Xe số (như Wave, Sirius) có giá thuê rất tốt, chỉ từ 100k/ngày. Xe chạy bền bỉ và dễ điều khiển. Bạn muốn biết thủ tục thuê xe số?"
    ]
  },
  { pattern: /(xe ga|xe tay ga|vision|lead|air blade|sh|grande|nvx|liberty|vespa)/i,
    keywords: ['xe ga', 'tay ga', 'vision', 'lead', 'air blade', 'sh', 'grande', 'nvx', 'liberty', 'vespa'],
    answer: [
      "Xe ga 🛵 chạy êm, cốp rộng, kiểu dáng đẹp, rất hợp đi trong thành phố. Giá thuê xe ga như Vision, Lead thường từ 120k-150k/ngày. Bạn muốn xem xe cụ thể nào?",
      "Dòng xe ga rất được ưa chuộng! Xe Vision và Lead là 2 lựa chọn phổ biến nhất. Bạn có muốn mình tư vấn thêm về ưu điểm của xe ga không?"
    ]
  },
  { pattern: /(50cc|xe 50|không cần bằng|chưa có bằng|học sinh|sinh viên|bằng lái|giấy phép lái xe|gplx)/i,
    keywords: ['50cc', 'không cần bằng', 'chưa có bằng', 'học sinh', 'sinh viên', 'bằng lái', 'gplx'],
    exclude: ['cần gì', 'thủ tục', 'giấy tờ'],
    answer: [
      "Nếu bạn chưa có bằng lái, xe 50cc là lựa chọn tuyệt vời! 🚲 Xe 50cc không yêu cầu GPLX, chỉ cần CCCD. Xe nhỏ gọn, tiết kiệm xăng, giá thuê cũng rất rẻ. Bạn muốn xem giá xe 50cc?",
      "Bên mình có dòng xe 50cc (như Giorno, Cub 50) không cần bằng lái, rất hợp cho các bạn học sinh, sinh viên. Thủ tục chỉ cần CCCD thôi ạ."
    ]
  },
  { pattern: /(thủ tục|giấy tờ|cần gì|thuê xe cần|điều kiện|cọc|đặt cọc)/i,
    keywords: ['thủ tục', 'giấy tờ', 'cần gì', 'điều kiện', 'cọc', 'đặt cọc'],
    answer: [
      "Thủ tục thuê xe rất đơn giản! 📄 Bạn chỉ cần chuẩn bị 1 trong 2 loại giấy tờ sau:\n1. Căn cước công dân (CCCD) + Giấy phép lái xe (GPLX).\n2. Hoặc Passport (Hộ chiếu) (Nếu là khách nước ngoài).\nBạn không cần đặt cọc tiền mặt, chỉ cần để lại giấy tờ gốc khi nhận xe ạ.",
      "Về thủ tục, bạn cần CCCD và Bằng lái xe (GPLX) nhé. Nếu là xe 50cc thì chỉ cần CCCD. Bên mình giữ giấy tờ gốc và sẽ hoàn trả ngay khi bạn trả xe."
    ]
  },
  { pattern: /(giá|bảng giá|bao nhiêu tiền|nhiu tiền|giá cả|giá thuê|thuê bao nhiêu)/i,
    keywords: ['giá', 'bao nhiêu tiền', 'giá cả', 'giá thuê'],
    answer: [
      "Bảng giá thuê xe rất linh hoạt 💰:\n- Xe số (Wave, Sirius): 100k - 120k/ngày.\n- Xe ga (Vision, Lead): 120k - 150k/ngày.\n- Xe côn (Exciter, Winner): 200k - 250k/ngày.\nThuê càng nhiều ngày giá càng rẻ. Bạn muốn hỏi giá xe cụ thể nào?",
      "Giá thuê xe dao động từ 100k (xe số) đến 150k (xe ga). Thuê theo tuần hoặc tháng sẽ có giá ưu đãi hơn nữa. Bạn muốn thuê xe nào để mình báo giá chi tiết?"
    ]
  },
  { pattern: /(liên hệ|sđt|số điện thoại|zalo|hotline|địa chỉ|ở đâu|đến đâu|cửa hàng)/i,
    keywords: ['liên hệ', 'sđt', 'số điện thoại', 'zalo', 'hotline', 'địa chỉ', 'ở đâu', 'cửa hàng'],
    answer: [
      "Bạn liên hệ Hotline/Zalo ☎️ 085.725.5868 để đặt xe nhanh nhất nhé!\nĐịa chỉ cửa hàng: [Nhập địa chỉ của bạn ở đây].\nBên mình có hỗ trợ giao xe tận nơi miễn phí trong nội thành Hà Nội ạ.",
      "Để đặt xe, bạn gọi ngay 085.725.5868 (có Zalo) ạ. Cửa hàng ở [Nhập địa chỉ của bạn]. Bạn muốn giao xe đến tận nơi hay qua cửa hàng lấy xe?"
    ]
  },
  { pattern: /(giao xe|ship xe|vận chuyển|nhận xe|lấy xe|sân bay|bến xe|tận nơi)/i,
    keywords: ['giao xe', 'ship xe', 'vận chuyển', 'nhận xe', 'lấy xe', 'sân bay', 'bến xe', 'tận nơi'],
    answer: [
      "Có ạ! 🚀 Bên mình MIỄN PHÍ giao nhận xe tận nơi tại các quận nội thành Hà Nội, bến xe (Giáp Bát, Mỹ Đình, Nước Ngầm...) và khu vực Phố Cổ.\nChỉ cần gọi 085.725.5868 là có xe ngay!",
      "Dịch vụ giao xe tận nơi (khách sạn, nhà riêng, bến xe...) là miễn phí 100% trong nội thành. Bạn chỉ cần chốt xe và gửi địa chỉ, bên mình sẽ mang xe qua."
    ]
  },
  { pattern: /^(cảm ơn|thanks|ok|oke|tuyệt vời|tốt quá|hay quá)$/i,
    answer: [
      "Không có gì ạ! Bạn cần hỗ trợ gì thêm cứ hỏi mình nhé. 😊",
      "Rất vui được hỗ trợ bạn!",
      "Cảm ơn bạn đã quan tâm. Liên hệ 085.725.5868 để đặt xe nha!"
    ]
  },
  { pattern: /.+/i,
    answer: [
      "Xin lỗi, mình chưa hiểu rõ câu hỏi này. Bạn có thể hỏi về: 'Giá thuê xe', 'Thủ tục cần gì', 'Xe ga' hoặc 'Địa chỉ' không?",
      "Mình chưa được lập trình để trả lời câu này. Bạn thử hỏi về 'Xe số', 'Xe 50cc' hoặc gọi 085.725.5868 để được tư vấn trực tiếp nhé."
    ],
    isFallback: true
  }
];

/* ---------- Utility: normalize text ---------- */
function normalizeText(text) {
  if (!text) return '';
  return text.toLowerCase()
             .normalize("NFD")
             .replace(/[\u0300-\u036f]/g, "")
             .replace(/đ/g, "d");
}

/* ---------- SmartAnswer function (v13 logic) ---------- */
function smartAnswer(query) {
  const normalizedQuery = normalizeText(query);
  let bestMatch = null;
  let highestScore = 0;

  for (const rule of rules) {
    if (rule.isFallback) continue;

    let score = 0;
    let match = false;
    let keywordBonus = false;

    if (rule.pattern.test(query) || rule.pattern.test(normalizedQuery)) {
      match = true;
      score = 2.0;
    }

    if (rule.keywords && rule.keywords.length > 0) {
      const queryWords = normalizedQuery.split(/\s+/);
      for (const kw of rule.keywords) {
        const normalizedKw = normalizeText(kw);
        if (normalizedQuery.includes(normalizedKw)) {
          if (queryWords.length === 1 && queryWords[0] === normalizedKw) {
            score += 1.5;
          } else {
            score += 1.0;
          }
        }
      }
    }

    if (rule.exclude && rule.exclude.length > 0) {
        let excluded = false;
        for (const ex of rule.exclude) {
            if (normalizedQuery.includes(normalizeText(ex))) {
                excluded = true;
                break;
            }
        }
        if (excluded) {
            score = 0;
            continue;
        }
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = rule;
    }
  }

  if (bestMatch && highestScore > 0.5) {
    // choose random answer
    return bestMatch.answer[Math.floor(Math.random() * bestMatch.answer.length)];
  }

  return null;
}

/* ---------- SpellFix (auto-fix common typos) ---------- */
(function(){
  const spellMap = {
    'thue xe may': 'thuê xe máy',
    'xe so': 'xe số',
    'xe ga': 'xe ga',
    'thu tuc': 'thủ tục',
    'giay to': 'giấy tờ',
    'bang gia': 'bảng giá',
    'lien he': 'liên hệ',
    'thue xe ha noi': 'thuê xe Hà Nội'
  };
  function autoFixSpelling(text){
    let fixed = text.toLowerCase();
    for(const [wrong, right] of Object.entries(spellMap)){
      const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
      fixed = fixed.replace(regex, right);
    }
    return fixed;
  }
  // Wrap the sendQuery later: we will override the exposed sendQuery with a wrapper after smart engine ready
  window.__MotoAI_spellFix = autoFixSpelling;
})();

/* ---------- Theme sync (auto dark/light) ---------- */
(function(){
  const setTheme = ()=>{
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const hasBodyDark = document.body.classList.contains('dark');
    const isDark = prefersDark || hasBodyDark;
    const r = document.documentElement;
    if(isDark){
      r.style.setProperty('--m10-card-bg','#0b0c0e');
      r.style.setProperty('--bg','#0f1113');
      r.style.setProperty('--text','#f2f2f7');
      r.style.setProperty('--footer-bg','rgba(25,25,30,0.9)');
      r.style.setProperty('--glass-border','rgba(255,255,255,0.08)');
      document.body.dataset.theme='dark';
    }else{
      r.style.setProperty('--m10-card-bg','#ffffff');
      r.style.setProperty('--bg','#ffffff');
      r.style.setProperty('--text','#000000');
      r.style.setProperty('--footer-bg','rgba(255,255,255,0.8)');
      r.style.setProperty('--glass-border','rgba(0,0,0,0.08)');
      document.body.dataset.theme='light';
    }
  };
  setTheme();
  try{ window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', setTheme); }catch(e){}
  const mo = new MutationObserver(setTheme);
  mo.observe(document.body,{attributes:true,attributeFilter:['class']});
})();

/* ---------- Auto refresh corpus every 72h ---------- */
(function(){
  const now = Date.now();
  const last = parseInt(localStorage.getItem('MotoAI_lastCorpusBuild')||'0',10);
  const seventyTwoHrs = 72*60*60*1000;
  if(!last || (now-last)>seventyTwoHrs){
    try{ buildCorpusFromDOM(); }catch(e){}
    localStorage.setItem('MotoAI_lastCorpusBuild',now);
  }
})();

/* ---------- Learn from configured sites (async) ---------- */
async function learnFromMySites() {
  const relatedSites = [
    "https://motoopen.github.io/chothuexemayhanoi/",
    "https://motoopen.github.io/",
    // add more if you want
  ];

  try {
    console.log("🌐 MotoAI: learning from configured sites...");
    let totalNew = 0;
    const currentCorpusTexts = new Set(corpus.map(c => c.text));
    for (const site of relatedSites) {
      try {
        const res = await fetch(site, { cache: "no-store", mode: "cors" });
        if (!res.ok) continue;
        const html = await res.text();
        const tmp = document.createElement("div");
        tmp.innerHTML = html;
        const texts = Array.from(tmp.querySelectorAll("p,h1,h2,h3,li,section,article"))
          .map(e => e.textContent.trim())
          .filter(t => t.length > 40 && !t.includes("{") && !t.includes("}"));
        texts.forEach(t => {
          if (!currentCorpusTexts.has(t)) {
            corpus.push({ id: corpus.length, text: t, tokens: tokenize(t), source: site });
            currentCorpusTexts.add(t);
            totalNew++;
          }
        });
        console.log(`✅ Học từ ${site}: +${texts.length} đoạn.`);
      } catch (e) {
        // ignore CORS or fetch errors
      }
    }
    if (totalNew > 0) localStorage.setItem(CFG.corpusKey, JSON.stringify(corpus));
  } catch (e) {
    console.error("❌ Lỗi learnFromMySites:", e);
  }
}

/* ---------- Learn from repo sitemap (async) ---------- */
async function learnFromRepo(){
  try{
    const lastLearn = localStorage.getItem('MotoAI_lastLearn');
    const threeDays = 3 * 24 * 60 * 60 * 1000;
    if (lastLearn && (Date.now() - lastLearn) < threeDays) {
      console.log('⏳ Bỏ qua learnFromRepo: Chưa đủ 3 ngày.');
      return;
    }
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
    console.log(`📖 MotoAI is reading ${data.pages.length} pages...`);
    let totalNew = 0;
    let currentCorpusTexts = new Set(corpus.map(c => c.text));
    for (const path of data.pages) {
      try {
        const r = await fetch(path, { cache: 'no-store' });
        if (!r.ok) continue;
        const txt = await r.text();
        const lines = txt.split(/[\r\n]+/).map(l => l.trim()).filter(l => l.length > CFG.minSentenceLength);
        lines.forEach(t => {
          if (!currentCorpusTexts.has(t)) {
            corpus.push({ id: corpus.length, text: t, tokens: tokenize(t) });
            currentCorpusTexts.add(t);
            totalNew++;
          }
        });
      } catch (e) {
        // ignore
      }
    }
    console.log('✅ Học xong toàn repo:', corpus.length, 'mẫu, mới thêm', totalNew);
    try {
      localStorage.setItem(CFG.corpusKey, JSON.stringify(corpus));
      localStorage.setItem('MotoAI_lastLearn', Date.now());
    } catch (e) { }
  } catch (e) {
    console.error('❌ Lỗi learnFromRepo:', e);
  }
}

/* ---------- Light Mode / Menu overlay global fix (applied automatically) ---------- */
(function(){
  const cssFix = `
    #motoai-root,
    #motoai-overlay,
    #motoai-card {
      z-index: 9999 !important;
    }
    header, nav, .site-header {
      position: relative;
      z-index: 10000 !important;
    }
    body[data-theme="light"] #motoai-overlay.visible {
      background: rgba(0,0,0,0.25) !important;
    }
  `;
  const style = document.createElement('style');
  style.textContent = cssFix;
  document.head.appendChild(style);
  console.log('%c✅ MotoAI Global Light Mode Fix Applied (Menu Safe)', 'color:#0a84ff;font-weight:bold;');
})();

/* ---------- Expose API & integrate smart engine with UI ---------- */

// Wrap and replace sendQuery to use smartAnswer first, fallback retrieval, then previous fallback
(function integrateSmartEngine(){
  // keep reference to old sendQuery (from part2)
  const origSend = window.__MotoAI_orig_sendQuery || sendQuery;

  async function comboSendQuery(text){
    if(!text || !text.trim()) return;
    // apply spellfix
    const fixed = (window.__MotoAI_spellFix && typeof window.__MotoAI_spellFix === 'function') ? window.__MotoAI_spellFix(text) : text;
    // basic guard
    if(sendLock) return;
    sendLock = true; sendBtn.disabled = true;
    hideTypingDots();

    // add user msg
    addMessage('user', fixed);

    // name detection
    const name = detectNameFromText(fixed);
    if(name){
      addMessage('bot', `Đã nhớ tên: ${name} ✨`);
      sendLock=false; sendBtn.disabled=false;
      setTimeout(()=> inputEl.focus(), 120);
      return;
    }

    showTypingDots();

    setTimeout(()=>{
      try{
        // smart engine first
        let ans = null;
        try{ ans = smartAnswer(fixed); }catch(e){ ans = null; }
        // fallback to retrieval if needed
        if(!ans) ans = retrieveBestAnswer(fixed);
        hideTypingDots();
        if(ans){
          addMessage('bot', ans);
        } else {
          addMessage('bot', 'Xin lỗi, mình chưa tìm thấy nội dung cụ thể trên trang này hoặc bộ nhớ học. Bạn thử hỏi khác nha.');
        }
      }catch(e){
        hideTypingDots();
        addMessage('bot','Lỗi khi xử lý câu trả lời.');
        console.error(e);
      } finally {
        sendLock=false; sendBtn.disabled=false;
        setTimeout(()=> inputEl.focus(),120);
      }
    }, 250);
  }

  // override sendQuery used by UI to call comboSendQuery
  window.MotoAI_sendQuery = comboSendQuery;
  // Also keep original pointer (for backwards compatibility)
  window.__MotoAI_orig_sendQuery = origSend;
})();

/* ---------- Bind UI events (wiring send button to combo send) ---------- */
(function bindEvents(){
  // bubble toggle
  bubble.addEventListener('click', ()=>{ if(!isOpen){ buildCorpusFromDOM(); openChat(); } else closeChat(); });
  overlay.addEventListener('click', (e)=>{ if(e.target===overlay) closeChat(); });
  closeBtn.addEventListener('click', closeChat);
  clearBtn.addEventListener('click', ()=>{ sessionMsgs=[]; saveSession(); bodyEl.innerHTML=''; addMessage('bot','🗑 Đã xóa hội thoại.'); });

  sendBtn.addEventListener('click', ()=>{
    const v = (inputEl.value||'').trim();
    if(v){
      inputEl.value='';
      // apply a small shake
      setTimeout(() => {
        const newMsgEls = bodyEl.querySelectorAll('.m-msg.user');
        const newLast = newMsgEls[newMsgEls.length-1];
        if(newLast){
          newLast.classList.add('shake');
          setTimeout(()=> newLast.classList.remove('shake'), 280);
        }
      }, 10);
      // call unified send
      if(window.MotoAI_sendQuery) window.MotoAI_sendQuery(v);
    }
  });

  inputEl.addEventListener('keydown', (e)=>{ 
    if(e.key==='Enter' && !e.shiftKey){ 
      e.preventDefault(); 
      const v = (inputEl.value||'').trim(); 
      if(v){
        inputEl.value=''; 
        setTimeout(() => {
          const newMsgEls = bodyEl.querySelectorAll('.m-msg.user');
          const newLast = newMsgEls[newMsgEls.length-1];
          if(newLast){
            newLast.classList.add('shake');
            setTimeout(()=> newLast.classList.remove('shake'), 280);
          }
        }, 10);
        if(window.MotoAI_sendQuery) window.MotoAI_sendQuery(v);
      }
    } 
  });

  // accessible focus
  document.addEventListener('keydown',(e)=>{
    if(e.key === 'Escape' && isOpen) closeChat();
  });
})();

/* ---------- init function (bootstrap) ---------- */
function init(){
  buildSuggestions();
  loadSession();
  buildCorpusFromDOM();
  attachViewportHandler();
  adaptCardHeight();

  // small observers
  const darkSyncObserver = new MutationObserver(() => {
    const dark = document.body.classList.contains('dark');
    if (dark) { card.style.opacity = getComputedStyle(card).opacity; }
  });
  darkSyncObserver.observe(document.body, {attributes:true, attributeFilter:['class']});

  const chatObserver = new MutationObserver((mut)=>{
    mut.forEach(m=>{
      m.addedNodes.forEach(node=>{
        if(node.nodeType === 1 && node.classList.contains('m-msg') && node.classList.contains('bot')){
          node.classList.add('glow');
          setTimeout(()=> node.classList.remove('glow'), 1200);
        }
      });
    });
  });
  if(bodyEl) chatObserver.observe(bodyEl, {childList:true});

  setInterval(avoidOverlap, 1200);
  window.addEventListener('resize', ()=>{ adaptCardHeight(); setTimeout(avoidOverlap,260); });

  console.log('%c⚙️ MotoAI v13 Combo — UI & Core initialized', 'color:#0a84ff');
}

/* ---------- helper adapt card height ---------- */
function adaptCardHeight(){
  try{
    const vw = Math.max(document.documentElement.clientWidth, window.innerWidth||0);
    const vh = Math.max(document.documentElement.clientHeight, window.innerHeight||0);
    let h = Math.round(vh * (vw >= 900 ? 0.6 : vw >= 700 ? 0.68 : 0.78));
    h = Math.max(320, Math.min(760, h));
    card.style.height = h + 'px';
  }catch(e){}
}

/* ---------- expose API to window (single global) ---------- */
window.MotoAI = Object.assign(window.MotoAI || {}, {
  open: openChat,
  close: closeChat,
  rebuildCorpus: buildCorpusFromDOM,
  getName: getUserName,
  clearMemory: ()=>{ try{ localStorage.removeItem(CFG.memoryKeyName); }catch(e){} },
  sendQuery: (text)=>{ if(window.MotoAI_sendQuery) window.MotoAI_sendQuery(text); else sendQuery(text); },
  tokenize: tokenize,
  isSmart: true
});

/* ---------- bootstrap ---------- */
setTimeout(init, 160);

// start learning async after load
window.addEventListener('load', ()=>{
  setTimeout(async ()=>{
    await learnFromMySites();
    await learnFromRepo();
  }, 1200);
});

// final log
console.log('%c🚀 MotoAI v13 Combo Standalone — Full Smart + Adaptive + UI', 'color:#0a84ff;font-weight:bold;');

})(); // end of whole combo IIFE
