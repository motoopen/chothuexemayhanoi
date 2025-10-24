/* ==== 🧠 Nâng cấp MotoAI lên bản 12.0 Local Smart+ (OFFLINE) ====
   ⚙️ Mục tiêu:
   - KHÔNG tạo thêm AI mới hoặc nhân bản giao diện.
   - Giữ nguyên toàn bộ code MotoAI hiện tại (v11 / motoai11.js).
   - Chỉ nâng cấp khả năng hiểu và trả lời thông minh hơn.
   - Không gọi API ngoài, không cần API key.
   - Giữ nguyên UI, dark mode, rung, glow, và bộ nhớ hội thoại.
   
   ✅ Nâng cấp đã thực hiện:
   1. Thêm module thông minh nhẹ Local Smart Engine.
   2. Thay thế logic retrieval cũ trong sendQuery bằng smartAnswer mới.
   
   *LƯU Ý: Toàn bộ code v10.2 nằm trong hàm IIFE chính,
   phần Local Smart Engine được thêm vào đầu và gắn vào window.MotoAI_v10.
*/

// =================================================================
// ⭐️ START OF LOCAL SMART ENGINE (motoai_smart_v12.js) ⭐️
// =================================================================
(function enhanceMotoAI_LocalSmart(){
  if(!window.MotoAI_v10) {
    // Nếu v10 chưa load, sẽ chờ đến khi v10 được định nghĩa (ở cuối file)
    console.warn("⚠️ MotoAI v10 chưa sẵn sàng để nâng cấp. Sẽ chờ.");
    window.addEventListener('MotoAI_v10_READY', enhanceMotoAI_LocalSmart);
    return;
  }

  /* ==== 1️⃣ Bộ từ đồng nghĩa cơ bản ==== */
  const synonyms = {
    "xe ga": ["tay ga","xe tay ga","xe scooter"],
    "xe số": ["xe côn","xe số tay"],
    "thủ tục": ["giấy tờ","hồ sơ","làm giấy tờ","quy trình"],
    "liên hệ": ["gọi điện","số điện thoại","contact","sdt"]
  };

  /* ==== 2️⃣ TF-IDF scoring (so khớp thông minh hơn) ==== */
  // corpusRaw là mảng [{id, text, tokens[]}]
  function scoreTFIDF(qTokens, corpus){
    const docCount = corpus.length;
    const df = {}; // Document Frequency

    // Tính Document Frequency (DF) cho các token trong câu hỏi
    corpus.forEach(c=>{
      const uniqueTokens = new Set(c.tokens);
      qTokens.forEach(t=>{
        if(uniqueTokens.has(t)) df[t] = (df[t]||0)+1;
      });
    });

    // Tính điểm TF-IDF cho mỗi tài liệu trong corpus
    const scores = corpus.map(c=>{
      let s=0;
      qTokens.forEach(t=>{
        const tf = c.tokens.filter(x=>x===t).length; // Term Frequency
        // Inverse Document Frequency, sử dụng smoothing: log((N+1)/(df+1))
        const idf = Math.log((docCount+1)/((df[t]||0)+1)); 
        s += tf*idf;
      });
      return s;
    });
    return scores;
  }
  
  // Hàm bổ sung để lấy token (đã phải được định nghĩa trong v10)
  const tokenize = window.MotoAI_v10.tokenize || (s => s.toLowerCase().split(/\s+/).filter(Boolean));

  /* ==== 3️⃣ Tìm câu trả lời thông minh hơn (TF-IDF) ==== */
  window.MotoAI_v10.retrieveSmart = function(query){
    try{
      const corpusRaw = JSON.parse(localStorage.getItem('MotoAI_v10_corpus')||"[]");
      if(!corpusRaw.length) return null;
      
      const q = query.toLowerCase().trim();
      let qTokens = tokenize(q);

      // Mở rộng câu hỏi theo từ đồng nghĩa
      Object.keys(synonyms).forEach(base=>{
        if(q.includes(base) && !qTokens.includes(base)) qTokens.push(base);
        synonyms[base].forEach(syn=>{
          if(q.includes(syn) && !qTokens.includes(base)) qTokens.push(base);
        });
      });

      // Lọc bỏ stop-words (tokens quá ngắn)
      qTokens = qTokens.filter(t => t.length > 1);

      if(!qTokens.length) return null;

      const scores = scoreTFIDF(qTokens, corpusRaw);
      const bestScore = Math.max(...scores);
      const bestIdx = scores.indexOf(bestScore);
      
      // Ngưỡng điểm tối thiểu (tuỳ chỉnh để tránh trả lời ngẫu nhiên)
      if(bestIdx < 0 || bestScore < 0.1) return null; 
      
      return corpusRaw[bestIdx].text;
    }catch(e){
      console.warn("⚠️ retrieveSmart lỗi:", e);
      return null;
    }
  };

  /* ==== 4️⃣ Tự học từ người dùng (User Learning) ==== */
  const storeKey = 'MotoAI_user_learn_v12'; // Key mới để tránh xung đột
  
  // Lưu câu hỏi-trả lời vào bộ nhớ học
  function learnFromUser(q, a){
    if(!q || !a || q.length < 5 || a.length < 10) return;
    const learned = JSON.parse(localStorage.getItem(storeKey)||"[]");
    
    // Đảm bảo không lưu câu hỏi quá giống nhau
    if(learned.some(x => q.toLowerCase().includes(x.q.toLowerCase()) || x.q.toLowerCase().includes(q.toLowerCase()))) return;

    learned.push({q: q.trim(), a: a.trim(), t: Date.now()});
    // Giới hạn 200 câu hỏi học được
    localStorage.setItem(storeKey, JSON.stringify(learned.slice(-200))); 
  }

  // Hàm trả lời thông minh tổng hợp (TF-IDF + Tự học)
  window.MotoAI_v10.smartAnswer = function(q){
    let ans = window.MotoAI_v10.retrieveSmart(q); // 1. TF-IDF
    
    if(!ans){
      // 2. Tự học: So khớp câu hỏi đã học (match hoàn toàn hoặc chứa nhau)
      const learned = JSON.parse(localStorage.getItem(storeKey)||"[]");
      // Sắp xếp để ưu tiên câu hỏi mới hơn
      learned.sort((a,b) => b.t - a.t); 
      
      const qLower = q.toLowerCase().trim();
      const found = learned.find(x => 
        qLower === x.q.toLowerCase() || 
        qLower.includes(x.q.toLowerCase()) ||
        x.q.toLowerCase().includes(qLower)
      );
      
      ans = found ? found.a : null;
      
      // Nếu tìm được từ Tự học, vẫn gọi hàm learn để "đẩy" câu này lên đầu (freshness)
      if(ans) learnFromUser(q, ans); 
    }
    
    // Nếu tìm được câu trả lời từ TF-IDF, ta lưu lại (giả định đây là câu trả lời tốt)
    if(ans && window.MotoAI_v10.retrieveSmart(q) === ans) {
        // Ta chỉ học nếu câu trả lời đến từ corpus (TF-IDF)
        learnFromUser(q, ans); 
    }
    
    return ans;
  };

  console.log("✨ MotoAI v12 Local Smart+ Engine activated!");
  
  // Kích hoạt lại nếu cần (dành cho trường hợp lần chạy đầu chưa load v10)
  if(window.MotoAI_v10_LOADED) window.MotoAI_v10.isSmart = true;
})();

// =================================================================
// ⭐️ END OF LOCAL SMART ENGINE / START OF MOTOAI V10.2 CORE ⭐️
// =================================================================

// MotoAI v10.2 — Hybrid Pro (Web-Corpus Learning + Memory + Apple UI + Refine+)
// Standalone file. Paste as motoai_embed_v10_hybrid_pro.js
(function(){
  if(window.MotoAI_v10_LOADED) return;
  window.MotoAI_v10_LOADED = true;
  console.log('✅ MotoAI v10.2 Hybrid Pro loaded (Refine+ patch applied)');

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
    // Hỗ trợ cả ký tự Unicode (Tiếng Việt)
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
      
      // Hợp nhất với corpus hiện tại (nếu đã học từ repo)
      const currentCorpusTexts = new Set(corpus.map(c => c.text));
      uniqTexts.forEach(t => {
          if (!currentCorpusTexts.has(t)) {
              corpus.push({id: corpus.length, text: t, tokens: tokenize(t)});
          }
      });
      
      // Chỉ giữ lại bản cũ nếu bản cũ lớn hơn
      if (corpus.length < uniqTexts.length) {
        corpus = uniqTexts.map((t,i)=>({id:i, text:t, tokens:tokenize(t)}));
      }

      try{ localStorage.setItem(CFG.corpusKey, JSON.stringify(corpus)); }catch(e){}
      console.log(`📚 MotoAI v10 built corpus: ${corpus.length} items`);
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

  /* -------- Retrieval: TF-style overlap score (fast) - Dùng làm FALLBACK -------- */
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

  /* ---------- sendQuery: Dùng Local Smart Engine, nếu không có mới fallback về Retrieval cũ ---------- */
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
        let ans = null;
        
        // ⭐️ Thay thế logic cũ bằng smartAnswer v12 ⭐️
        if(window.MotoAI_v10.smartAnswer){
           ans = window.MotoAI_v10.smartAnswer(text);
        }
        
        // Fallback về retrieval cũ nếu smartAnswer không có
        if(!ans){
            ans = retrieveBestAnswer(text);
        }

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
  window.MotoAI_v10 = Object.assign(window.MotoAI_v10 || {}, { // Sử dụng Object.assign để hợp nhất
    open: openChat,
    close: closeChat,
    rebuildCorpus: buildCorpusFromDOM,
    getName: getUserName,
    clearMemory: ()=>{ try{ localStorage.removeItem(CFG.memoryKeyName); }catch(e){} },
    sendQuery: sendQuery, // Expose sendQuery (quan trọng cho người dùng nâng cao)
    tokenize: tokenize, // Expose tokenize cho Local Smart Engine
    isSmart: false // Dùng để kiểm tra trạng thái
  });

  /* ---------- bootstrap ---------- */
  setTimeout(init, 160);
  
  // Gửi sự kiện cho Smart Engine biết v10 đã load
  window.dispatchEvent(new Event('MotoAI_v10_READY'));

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
    let currentCorpusTexts = new Set(corpus.map(c => c.text));

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
          if (!currentCorpusTexts.has(t)) {
            corpus.push({ id: corpus.length, text: t, tokens: tokenize(t) });
            currentCorpusTexts.add(t);
            totalNew++;
          }
        });

        // console.log(`📚 Học từ ${path}: +${lines.length} câu`); // Bỏ log chi tiết để tránh spam
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
