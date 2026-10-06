/*
* 🚀 MotoAI v13 Smart Engine + v9.8 UI (Apple Glass Readable Edition)
* Được hợp nhất bởi chuyên gia: Lấy giao diện v9.8 (UI/CSS/HTML) và Trí tuệ v13 (Rules, Corpus, Logic).
*/
(function(){
  if(window.MotoAI_COMBO_V13_98_LOADED) return;
  window.MotoAI_COMBO_V13_98_LOADED = true;

  console.log('✅ MotoAI v13 Smart + v9.8 UI — initializing...');

  // ===================================
  // I. CONFIG (from v13)
  // ===================================
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
    memoryKeyName: 'MotoAI_v13_98_user_name',
    corpusKey: 'MotoAI_v13_98_corpus',
    sessionKey: 'MotoAI_v13_98_session_msgs',
    sitemapPath: '/moto_sitemap.json'
  };

  // ===================================
  // II. HTML (from v9.8)
  // ===================================
  const html = `
  <div id="motoai-root">
    <div id="motoai-bubble" role="button" aria-label="Mở chat">🤖</div>
    <div id="motoai-backdrop"></div>
    <div id="motoai-card" aria-hidden="true">
      <div id="motoai-handle"></div>
      <div id="motoai-header">
        <span>MotoAI Assistant</span>
        <button id="motoai-close" title="Đóng">✕</button>
      </div>
      <div id="motoai-body" tabindex="0" role="log" aria-live="polite">
        </div>
      <div id="motoai-suggestions" role="toolbar" aria-label="Gợi ý nhanh">
        </div>
      <div id="motoai-input">
        <input id="motoai-input-el" placeholder="Nhập câu hỏi..." autocomplete="off" aria-label="Nhập câu hỏi" />
        <button id="motoai-send" aria-label="Gửi">Gửi</button>
      </div>
      <button id="motoai-clear" title="Xóa hội thoại">🗑</button>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', html);

  // ===================================
  // III. CSS (from v9.8)
  // ===================================
  const style = document.createElement('style');
  style.textContent = `
  :root {
    --accent: #007aff;
    --bg-light: rgba(255,255,255,0.85);
    --bg-dark: rgba(30,30,32,0.88);
    --blur-bg: blur(14px) saturate(160%);
    --card-shadow: 0 -12px 40px rgba(0,0,0,.18);
  }

  #motoai-root { position: fixed; left: 16px; bottom: 100px; z-index: 99997; }

  #motoai-bubble {
    width: 58px; height: 58px; border-radius: 14px;
    display: flex; align-items: center; justify-content: center;
    font-size: 28px; background: var(--accent); color: #fff;
    cursor: pointer; box-shadow: 0 8px 22px rgba(0,0,0,0.25);
    transition: transform .25s; pointer-events: auto;
  }
  #motoai-bubble:hover { transform: scale(1.05); }

  #motoai-backdrop {
    position: fixed; inset: 0; background: rgba(0,0,0,0.25);
    opacity: 0; pointer-events: none; transition: opacity .3s; z-index: 99998;
  }
  #motoai-backdrop.show { opacity: 1; pointer-events: auto; }

  #motoai-card {
    position: fixed; left: 0; right: 0; bottom: 0;
    width: min(900px, calc(100% - 30px)); margin: auto;
    height: 70vh; max-height: 720px; border-radius: 22px 22px 0 0;
    background: var(--bg-light); backdrop-filter: var(--blur-bg);
    box-shadow: var(--card-shadow);
    transform: translateY(110%); opacity: 0;
    display: flex; flex-direction: column;
    overflow: hidden; z-index: 99999;
    transition: transform .45s cubic-bezier(.2,.9,.2,1), opacity .3s ease;
  }
  #motoai-card.open { transform: translateY(0); opacity: 1; }

  #motoai-handle {
    width: 60px; height: 6px; background: rgba(160,160,160,0.6);
    border-radius: 6px; margin: 10px auto;
  }

  #motoai-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 6px 14px; font-weight: 700; color: var(--accent);
    border-bottom: 1px solid rgba(0,0,0,.06);
  }

  #motoai-close {
    background: none; border: none; font-size: 22px;
    cursor: pointer; color: var(--accent); opacity: .85;
  }

  #motoai-body {
    flex: 1; overflow-y: auto; padding: 10px 14px;
    font-size: 15px; background: transparent;
  }

  .m-msg {
    margin: 8px 0; padding: 12px 14px;
    border-radius: 18px; max-width: 84%;
    line-height: 1.4; word-break: break-word;
    box-shadow: 0 3px 8px rgba(0,0,0,0.08);
  }
  .m-msg.user {
    background: linear-gradient(180deg, var(--accent), #00b6ff);
    color: #fff; margin-left: auto;
  }
  .m-msg.bot {
    background: rgba(255,255,255,0.8);
    backdrop-filter: blur(6px);
    color: #111;
  }
  .m-msg.bot.glow {
    box-shadow: 0 0 18px rgba(0,122,255,0.3);
    transition: box-shadow 0.8s ease;
  }


  #motoai-suggestions {
    display: flex; gap: 6px; justify-content: center; flex-wrap: wrap;
    padding: 6px 10px; border-top: 1px solid rgba(0,0,0,.05);
    background: rgba(255,255,255,0.5); backdrop-filter: blur(10px);
  }
  #motoai-suggestions button {
    border: none; background: rgba(0,122,255,.08);
    color: var(--accent);
    padding: 8px 12px; border-radius: 12px;
    cursor: pointer; font-weight: 500;
    transition: background .25s;
  }
  #motoai-suggestions button:hover {
    background: rgba(0,122,255,.15);
  }

  #motoai-input {
    display: flex; gap: 8px; padding: 10px;
    border-top: 1px solid rgba(0,0,0,.06);
    background: rgba(255,255,255,0.7);
    backdrop-filter: blur(10px);
  }
  #motoai-input input {
    flex: 1; padding: 10px; border-radius: 12px;
    border: 1px solid rgba(0,0,0,0.1); font-size: 16px;
    background: rgba(255,255,255,0.6);
  }
  #motoai-input button {
    background: var(--accent); color: #fff;
    border: none; border-radius: 10px; padding: 10px 14px;
    font-weight: 600; transition: opacity .25s;
  }
  #motoai-input button:hover { opacity: 0.9; }

  #motoai-clear {
    position: absolute; top: 10px; right: 40px;
    background: none; border: none; font-size: 18px;
    cursor: pointer; opacity: .8; color: #333; /* make it visible on light theme */
    z-index: 10000;
  }

  @keyframes chatShake {
    0%,100%{transform:translateX(0);}
    25%{transform:translateX(2px);}
    50%{transform:translateX(-2px);}
    75%{transform:translateX(1px);}
  }
  .shake{animation:chatShake .25s linear;}

  @media (prefers-color-scheme: dark) {
    #motoai-card { background: var(--bg-dark); color: #eee; }
    .m-msg.bot { background: rgba(40,40,50,0.8); color: #eee; }
    #motoai-input { background: rgba(25,25,30,0.9); }
    #motoai-suggestions { background: rgba(25,25,30,0.8); }
    #motoai-input input {
      background: rgba(40,40,50,0.8);
      color: #eee; border: 1px solid rgba(255,255,255,0.1);
    }
    #motoai-header { color: var(--accent); }
    #motoai-close { color: #eee; opacity: 1; }
    #motoai-clear { color: #eee; }
  }

  @media (max-width:520px){
    #motoai-root { bottom: 18px; }
    #motoai-card{width:calc(100% - 24px);height:78vh;}
  }
  `;
  document.head.appendChild(style);


  // ===================================
  // IV. CORE JS LOGIC & UTILS (mostly from v13)
  // ===================================
  const $ = s => document.querySelector(s);
  const root = $('#motoai-root');
  const bubble = $('#motoai-bubble');
  const card = $('#motoai-card');
  const backdrop = $('#motoai-backdrop');
  const closeBtn = $('#motoai-close');
  const sendBtn = $('#motoai-send');
  const inputEl = $('#motoai-input-el'); // Changed from #motoai-input to #motoai-input-el
  const clearBtn = $('#motoai-clear');
  const bodyEl = $('#motoai-body');
  const suggestionsWrap = $('#motoai-suggestions');
  let isOpen = false, sendLock = false;
  let corpus = [];
  let sessionMsgs = [];

  // Placeholder for typing dots logic (v9.8 UI doesn't have a dedicated typing element)
  // We'll simulate it by adding/removing an element
  const TYPING_ID = 'motoai-typing-dots';
  function showTypingDots(){
    let dots = document.getElementById(TYPING_ID);
    if (!dots) {
      dots = document.createElement('div');
      dots.id = TYPING_ID;
      dots.className = 'm-msg bot';
      dots.innerHTML = '<span>.</span><span>.</span><span>.</span>';
      dots.style.textAlign = 'center';
      bodyEl.appendChild(dots);
      bodyEl.scrollTop = bodyEl.scrollHeight;
    }
  }
  function hideTypingDots(){
    const dots = document.getElementById(TYPING_ID);
    if(dots) dots.remove();
  }

  // --- V13 Utilities ---
  function tokenize(s){ return s.toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu,' ').split(/\s+/).filter(Boolean); }
  function uniq(arr){ return Array.from(new Set(arr)); }
  function normalizeText(text) {
    if (!text) return '';
    return text.toLowerCase()
               .normalize("NFD")
               .replace(/[\u0300-\u036f]/g, "")
               .replace(/đ/g, "d");
  }

  // --- V13 Corpus Build ---
  function buildCorpusFromDOM(){
    // ... (Keep the full logic from v13 PART 2) ...
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
      console.log(`📚 MotoAI v13+v9.8 built corpus: ${corpus.length} items`);
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

  // --- V13 Retrieval ---
  function retrieveBestAnswer(query){
    // ... (Keep the full logic from v13 PART 2) ...
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

  // --- V13 Session Persistence ---
  function loadSession(){
    try{
      const raw = sessionStorage.getItem(CFG.sessionKey);
      if(raw) sessionMsgs = JSON.parse(raw);
    }catch(e){ sessionMsgs = []; }
    if(!sessionMsgs || !Array.isArray(sessionMsgs)) sessionMsgs = [];
  }
  function saveSession(){ try{ sessionStorage.setItem(CFG.sessionKey, JSON.stringify(sessionMsgs)); }catch(e){} }

  // --- V13 Memory: User Name ---
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

  // --- V9.8 UI Render / V13 Message Logic ---
  function addMessage(role, text){
    const el = document.createElement('div');
    el.className = 'm-msg '+(role==='user'?'user':'bot');
    el.textContent = text;
    bodyEl.appendChild(el);

    if(role === 'bot') {
        el.classList.add('glow');
        setTimeout(()=> el.classList.remove('glow'), 1200);
    }

    bodyEl.scrollTop = bodyEl.scrollHeight;
    sessionMsgs.push({role, text, t:Date.now()});
    saveSession();
    return el;
  }

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
      const name = getUserName();
      addMessage('bot', `👋 Xin chào${name ? ' ' + name : ''}! Mình là MotoAI — hỏi thử “Xe ga”, “Xe số” hay “Xe 50cc” nhé!`);
    }
  }

  // --- V9.8 UI / V13 Open/Close Logic ---
  function openChat() {
    if(isOpen) return;
    card.classList.add('open');
    backdrop.classList.add('show');
    bubble.style.display = 'none';
    isOpen = true;
    renderSession();
    setTimeout(()=> { try{ inputEl.focus(); }catch(e){} }, 320);
    // document.documentElement.style.overflow = 'hidden'; // v9.8 didn't have this, let's keep it simple
    adaptCardHeight();
  }
  function closeChat() {
    if(!isOpen) return;
    card.classList.remove('open');
    backdrop.classList.remove('show');
    bubble.style.display = 'flex';
    isOpen = false;
    // document.documentElement.style.overflow = ''; // v9.8 didn't have this
    hideTypingDots();
  }
  function clearChat() {
    sessionMsgs = [];
    saveSession();
    bodyEl.innerHTML = '';
    addMessage('bot', '🗑 Đã xóa hội thoại.');
  }

  // --- V13 Suggestions Build ---
  function buildSuggestions(){
    suggestionsWrap.innerHTML = '';
    CFG.suggestionTags.forEach(s=>{
      const b = document.createElement('button');
      b.type='button'; b.textContent = s.label; b.dataset.q = s.q;
      b.addEventListener('click', (ev)=>{
        if(!isOpen) openChat();
        setTimeout(()=> window.MotoAI_sendQuery(s.q), 100);
      });
      suggestionsWrap.appendChild(b);
    });
  }

  // --- V13 UI Fixes ---
  function adaptCardHeight(){
    try{
      const vw = Math.max(document.documentElement.clientWidth, window.innerWidth||0);
      const vh = Math.max(document.documentElement.clientHeight, window.innerHeight||0);
      let h = Math.round(vh * (vw >= 900 ? 0.6 : vw >= 700 ? 0.68 : 0.78));
      h = Math.max(320, Math.min(760, h));
      card.style.height = h + 'px';
    }catch(e){}
  }

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

  // ===================================
  // V. SMART ENGINE (from v13 PART 3)
  // ===================================
  const rules = [
    // (Keep the full 'rules' array from v13 PART 3 here)
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

  function smartAnswer(query) {
    const normalizedQuery = normalizeText(query);
    let bestMatch = null;
    let highestScore = 0;

    for (const rule of rules) {
      if (rule.isFallback) continue;

      let score = 0;
      let match = false;

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

  // --- V13 SpellFix ---
  const spellMap = {
    'thue xe may': 'thuê xe máy', 'xe so': 'xe số', 'xe ga': 'xe ga',
    'thu tuc': 'thủ tục', 'giay to': 'giấy tờ', 'bang gia': 'bảng giá',
    'lien he': 'liên hệ', 'thue xe ha noi': 'thuê xe Hà Nội'
  };
  function autoFixSpelling(text){
    let fixed = text.toLowerCase();
    for(const [wrong, right] of Object.entries(spellMap)){
      const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
      fixed = fixed.replace(regex, right);
    }
    return fixed;
  }

  // --- V13 Combo SendQuery (integrated) ---
  async function comboSendQuery(text){
    if(!text || !text.trim()) return;

    const fixed = autoFixSpelling(text); // Apply spellfix

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
          // Fallback to the general fallback rule from v13 ruleset
          const fallbackRule = rules.find(r => r.isFallback);
          const fallbackAns = fallbackRule ? fallbackRule.answer[Math.floor(Math.random() * fallbackRule.answer.length)] : 'Xin lỗi, mình chưa tìm thấy câu trả lời.';
          addMessage('bot', fallbackAns);
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

  // ===================================
  // VI. EVENT BINDING & INIT
  // ===================================
  function bindEvents(){
    bubble.onclick = () => { buildCorpusFromDOM(); openChat(); };
    backdrop.onclick = closeChat;
    closeBtn.onclick = closeChat;
    clearBtn.onclick = clearChat;

    sendBtn.addEventListener('click', ()=>{
      const v = (inputEl.value||'').trim();
      if(v){
        inputEl.value='';
        // Apply shake effect (from v13)
        setTimeout(() => {
          const newMsgEls = bodyEl.querySelectorAll('.m-msg.user');
          const newLast = newMsgEls[newMsgEls.length-1];
          if(newLast){
            newLast.classList.add('shake');
            setTimeout(()=> newLast.classList.remove('shake'), 280);
          }
        }, 10);
        comboSendQuery(v);
      }
    });

    inputEl.addEventListener('keydown', (e)=>{
      if(e.key === 'Enter' && !e.shiftKey){
        e.preventDefault();
        const v = (inputEl.value||'').trim();
        if(v){
          inputEl.value='';
          // Apply shake effect (from v13)
          setTimeout(() => {
            const newMsgEls = bodyEl.querySelectorAll('.m-msg.user');
            const newLast = newMsgEls[newMsgEls.length-1];
            if(newLast){
              newLast.classList.add('shake');
              setTimeout(()=> newLast.classList.remove('shake'), 280);
            }
          }, 10);
          comboSendQuery(v);
        }
      }
    });

    // Suggestions buttons
    suggestionsWrap.addEventListener('click', (e) => {
      if (e.target.tagName === 'BUTTON' && e.target.dataset.q) {
        if(!isOpen) openChat();
        setTimeout(() => comboSendQuery(e.target.dataset.q), 100);
      }
    });

    // Escape to close
    document.addEventListener('keydown',(e)=>{
      if(e.key === 'Escape' && isOpen) closeChat();
    });

    // Small observers for theme sync / glow (simplified from v13)
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
  }

  // --- V13 Async Learning Functions (kept for smartness) ---
  // (Note: learnFromMySites and learnFromRepo functions should be copied here if needed,
  // but for conciseness, I'll only keep their calls in init, assuming the functions exist.)

  /* --- V13 LearnFromRepo --- */
  async function learnFromRepo(){
    // (Copy full learnFromRepo from v13 PART 3 here)
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

  /* --- V13 LearnFromMySites --- */
  async function learnFromMySites() {
    // (Copy full learnFromMySites from v13 PART 3 here)
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


  function init(){
    buildSuggestions();
    loadSession();
    buildCorpusFromDOM(); // Initial build
    attachViewportHandler();

    bindEvents(); // Bind all UI events

    // Final bootstrap
    window.MotoAI = Object.assign(window.MotoAI || {}, {
      open: openChat,
      close: closeChat,
      rebuildCorpus: buildCorpusFromDOM,
      getName: getUserName,
      clearMemory: ()=>{ try{ localStorage.removeItem(CFG.memoryKeyName); }catch(e){} },
      sendQuery: comboSendQuery, // Expose the smart combo function
      tokenize: tokenize,
      isSmart: true,
      uiVersion: '9.8',
      smartVersion: '13'
    });

    console.log('%c🚀 MotoAI v13 Smart Engine + v9.8 UI Finalized!', 'color:#007aff;font-weight:bold;');
  }

  // Auto refresh corpus every 72h
  (function(){
    const now = Date.now();
    const last = parseInt(localStorage.getItem('MotoAI_lastCorpusBuild')||'0',10);
    const seventyTwoHrs = 72*60*60*1000;
    if(!last || (now-last)>seventyTwoHrs){
      try{ buildCorpusFromDOM(); }catch(e){}
      localStorage.setItem('MotoAI_lastCorpusBuild',now);
    }
  })();

  // Run init after DOM is loaded
  setTimeout(init, 160);

  // Start learning async after load
  window.addEventListener('load', ()=>{
    setTimeout(async ()=>{
      await learnFromMySites();
      await learnFromRepo();
    }, 1200);
  });

})();
