/* ==================================================================
 * 🌐 MotoAI v10 — Extended Auto-Learn (Repo + External Domains)
 * Học từ sitemap + domain ngoài, tự refresh mỗi 72h
 * (Đây là phần logic được thêm vào)
 * ================================================================== */
(function(){
  // Tách biệt logic học mở rộng để tránh xung đột
  // Logic này sẽ chạy song song và lưu vào localStorage
  // Hệ thống trả lời chính (bên dưới) sẽ đọc từ đây
  
  const EXT_CFG = {
    sitemap: 'https://motoopen.github.io/chothuexemayhanoi/moto_sitemap.json',
    extraDomains: [
      'https://thuexemaynguyentu.com',
      'https://athanoi.github.io/moto/',
      'https://thuexemaynguyentu.github.io/vn-index.html/'
    ],
    maxItems: 1200, // Yêu cầu 6
    corpusKey: 'MotoAI_v10_corpus_extended', // Yêu cầu 4
    refreshHours: 72 // Yêu cầu 7
  };

  async function fetchText(url){
    try{
      const res = await fetch(url, {mode:'cors'});
      if(!res.ok) return '';
      const ct = res.headers.get('content-type') || '';
      
      // Yêu cầu 3: Quét file .txt
      if(ct.includes('text/plain')) return await res.text();
      
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const txts = [];
      
      // Yêu cầu 3: Quét thẻ <p>, <h1>, <h2>, <li>
      doc.querySelectorAll('p, h1, h2, li').forEach(el=>{
        const t = (el.innerText||'').trim();
        if(t.length>20 && t.length<400) txts.push(t);
      });
      return txts.join('\n');
    }catch(e){
      console.warn('❌ Fetch fail:', url);
      return '';
    }
  }

  async function loadFromSitemap(){
    try{
      const res = await fetch(EXT_CFG.sitemap, {mode:'cors'});
      let sitemapPages = [];
      if(res.ok){
         const data = await res.json();
         // --- START EDIT: Thêm 2 dòng kiểm tra an toàn ---
         if(!data || typeof data !== 'object'){ console.warn('⚠️ Dữ liệu sitemap không hợp lệ, bỏ qua.'); return; }
         // --- END EDIT ---
         if(data.pages && Array.isArray(data.pages)){
             sitemapPages = data.pages;
         }
      } else {
          // --- START EDIT: Cập nhật cảnh báo ---
          console.warn('⚠️ moto_sitemap.json not found, chỉ học từ domain ngoài.');
          // --- END EDIT ---
      }

      // Yêu cầu 2: Gộp sitemap và domain bổ sung
      const list = [...sitemapPages, ...EXT_CFG.extraDomains];
      
      console.log('🌐 MotoAI fetching', list.length, 'pages...');
      let allTxt = [];
      for(const u of list){
        const t = await fetchText(u);
        if(t) allTxt.push(t);
      }
      
      const joined = allTxt.join('\n').split(/\n+/)
        .map(s=>s.trim()).filter(Boolean)
        .filter((v,i,a)=>a.indexOf(v)===i) // Yêu cầu 6: Tránh trùng lặp
        .slice(0, EXT_CFG.maxItems); // Yêu cầu 6: Giới hạn 1200
        
      localStorage.setItem(EXT_CFG.corpusKey, JSON.stringify(joined)); // Yêu cầu 4
      console.log(`📚 MotoAI Extended Corpus built: ${joined.length} items`);
      
    }catch(e){ console.error('❌ Extended learn failed', e); }
  }

  (async function autoRefresh(){
    const now = Date.now();
    const last = parseInt(localStorage.getItem('MotoAI_ext_lastBuild')||'0',10);
    const need = !last || (now - last) > (EXT_CFG.refreshHours*60*60*1000); // Yêu cầu 7
    
    if(need){
      await loadFromSitemap();
      localStorage.setItem('MotoAI_ext_lastBuild', now);
    } else {
      console.log('🕒 MotoAI Extended corpus still fresh');
    }
    
    // Yêu cầu 8: Giữ log
    console.log('%c📚 MotoAI Extended Learning Active (Repo + Domains)','color:#0a84ff;font-weight:bold;');
  })();

})();
// Hết phần logic học mở rộng. Phần logic v10 gốc bắt đầu.
// Yêu cầu 1: Giữ nguyên logic v10.


// MotoAI v10.0 — Smart Hybrid Pro (v10 Core + v13 Brain + Extended Learn)
// Standalone file.
(function(){
  if(window.MotoAI_v10_LOADED) return;
  window.MotoAI_v10_LOADED = true;
  console.log('✅ MotoAI v10.0 Smart Hybrid Pro loaded (with Extended Learn)');

  /* -------- CONFIG -------- */
  const CFG = {
    maxCorpusSentences: 600,
    minSentenceLength: 20,
    suggestionTags: [
  {q:'Xe số', label:'🏍 Xe số'},
  {q:'Xe ga', label:'🛵 Xe ga'},
  {q:'Thủ tục', label:'📄 Thủ tục'},
  {q:'Xe 50cc', label:'🚲 Xe 50cc'},
  {q:'Liên hệ 0857 255 868', label:'📞 Gọi/Zalo 0857 255 868'}
],
    memoryKeyName: 'MotoAI_v10_user_name',
    corpusKey: 'MotoAI_v10_corpus', // Corpus gốc (từ DOM)
    sessionKey: 'MotoAI_v10_session_msgs',
    lastCorpusBuildKey: 'MotoAI_lastCorpusBuild',
    // Key của corpus mở rộng (được định nghĩa ở script trên)
    extendedCorpusKey: 'MotoAI_v10_corpus_extended' 
  };

  /* --------- HTML inject ---------- */
  // (Giữ nguyên theo Yêu cầu 1)
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

  /* ---------- CSS ---------- */
  // (Giữ nguyên theo Yêu cầu 1)
  const css = `
  :root{
    --m10-accent:#007aff;
    --m10-card-bg: rgba(255,255,255,0.86);
    --m10-card-bg-dark: rgba(22,22,24,0.92);
    --m10-blur: blur(12px) saturate(140%);
    --m10-radius:18px;
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
  #motoai-footer{display:flex;align-items:center;gap:8px;padding:10px;border-top:1px solid rgba(0,0,0,0.06);background:rgba(255,255,255,0.7);backdrop-filter:blur(8px)}
  #motoai-typing{min-width:48px}
  #motoai-input{flex:1;padding:10px;border-radius:12px;border:1px solid rgba(0,0,0,0.08);font-size:15px}
  #motoai-send{background:var(--m10-accent);color:#fff;border:none;border-radius:10px;padding:10px 14px;cursor:pointer}
  #motoai-clear{position:absolute;top:10px;right:44px;background:none;border:none;font-size:18px;cursor:pointer}
  @media (max-width:520px){
    #motoai-card{width:calc(100% - 24px);height:78vh}
  }
  @media (prefers-color-scheme:dark){
    :root{--m10-card-bg:var(--m10-card-bg-dark)}
    .m-msg.bot{background:rgba(40,40,50,0.9);color:#eee}
    #motoai-suggestions{background:rgba(25,25,30,0.9)}
    #motoai-footer{background:rgba(25,25,30,0.9)}
  }`;
  const sN = document.createElement('style'); sN.textContent = css; document.head.appendChild(sN);

  /* ---------- Helpers & state ---------- */
  // (Giữ nguyên theo Yêu cầu 1)
  const $ = sel => document.querySelector(sel);
  const root = $('#motoai-root'), bubble = $('#motoai-bubble'), overlay = $('#motoai-overlay');
  const card = $('#motoai-card'), bodyEl = $('#motoai-body'), inputEl = $('#motoai-input'), sendBtn = $('#motoai-send');
  const closeBtn = $('#motoai-close'), clearBtn = $('#motoai-clear'), typingEl = $('#motoai-typing');
  const suggestionsWrap = $('#motoai-suggestions');

  let isOpen = false, sendLock = false;
  let corpus = []; // Corpus gốc (P2)
  let sessionMsgs = [];

  /* --------- Utility: tokenize, normalize --------- */
  // (Giữ nguyên theo Yêu cầu 1)
  function tokenize(s){
    return s.toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu,' ').split(/\s+/).filter(Boolean);
  }
  function uniq(arr){ return Array.from(new Set(arr)); }

  /* -------- Corpus build: (P2 - Corpus Gốc từ DOM) -------- */
  // (Giữ nguyên theo Yêu cầu 1)
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
      corpus = uniqTexts.map((t,i)=>({id:i, text:t, tokens:tokenize(t)}));
      try{ localStorage.setItem(CFG.corpusKey, JSON.stringify(corpus)); }catch(e){}
      console.log(`📚 MotoAI v10 (Gốc) built corpus: ${corpus.length} items`);
    }catch(e){ corpus=[]; }
  }

  // Restore corpus (P2)
  (function restoreCorpus(){
    try{
      const raw = localStorage.getItem(CFG.corpusKey);
      if(raw){
        const parsed = JSON.parse(raw);
        if(Array.isArray(parsed) && parsed.length) { corpus = parsed; }
      }
    }catch(e){}
  })();

  /* -------- Retrieval (P2): Corpus Gốc (từ DOM) -------- */
  // (Giữ nguyên theo Yêu cầu 1)
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
  
  /* -------- Retrieval (P3): Corpus Mở Rộng (từ localStorage) -------- */
  // (Logic mới - Yêu cầu 5)
  function retrieveFromExtendedCorpus(q){
      try{
          const raw = localStorage.getItem(CFG.extendedCorpusKey); // Đọc từ key đã lưu
          if(!raw) return null;
          const extendedCorpus = JSON.parse(raw);
          if(!Array.isArray(extendedCorpus) || !extendedCorpus.length) return null;
          
          const tokens = tokenize(q).filter(t=>t.length>1);
          if(!tokens.length) return null;

          let best=null, score=0;
          for(const line of extendedCorpus){
              let s=0; 
              const lineLower = line.toLowerCase();
              tokens.forEach(t=>{ if(lineLower.includes(t)) s++; });
              if(s>score){score=s;best=line;}
          }
          return score > 0 ? best : null;
      }catch(e){
          console.error('❌ Extended corpus retrieval failed', e);
          return null;
      }
  }

  /* -------- Session persistence -------- */
  // (Giữ nguyên theo Yêu cầu 1)
  function loadSession(){
    try{
      const raw = sessionStorage.getItem(CFG.sessionKey);
      if(raw) sessionMsgs = JSON.parse(raw);
    }catch(e){ sessionMsgs = []; }
    if(!sessionMsgs || !Array.isArray(sessionMsgs)) sessionMsgs = [];
  }
  function saveSession(){ try{ sessionStorage.setItem(CFG.sessionKey, JSON.stringify(sessionMsgs)); }catch(e){} }

  /* -------- Memory: user name -------- */
  // (Giữ nguyên theo Yêu cầu 1)
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
  // (Giữ nguyên theo Yêu cầu 1)
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
  // (Giữ nguyên theo Yêu cầu 1)
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
  // (Giữ nguyên theo Yêu cầu 1)
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
  // (Giữ nguyên theo Yêu cầu 1)
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

  // --- 🧠 START: MotoAI v13 Brain Patch (P1 - SmartEngine) ---
  // (Giữ nguyên theo Yêu cầu 1)
  const rules = [
    { pattern: /(xe so|wave|sirius|blade|future)/i, answer: "Xe số tiết kiệm xăng, giá thuê rẻ, bền bỉ và dễ đi. 🚀" },
    { pattern: /(xe ga|vision|lead|air blade|vespa)/i, answer: "Xe ga chạy êm, cốp rộng, hợp đi phố. Giá từ 120k/ngày. 🛵" },
    { pattern: /(50cc|khong can bang|hoc sinh|sinh vien)/i, answer: "Xe 50cc không cần bằng lái, phù hợp học sinh – sinh viên. 📘" },
    { pattern: /(thu tuc|giay to|can gi|dat coc)/i, answer: "Thủ tục thuê xe: CCCD + GPLX (hoặc Passport nếu là khách nước ngoài). 📄" },
    { pattern: /(gia|bao nhieu|bang gia)/i, answer: "Xe số ~100k/ngày, xe ga ~130k/ngày, xe côn ~200k/ngày. 💰" },
    // --- START EDIT: Cập nhật rule liên hệ ---
    { pattern: /(lien he|sdt|zalo|hotline|dia chi)/i, answer: "Liên hệ ☎️ 0857 255 868 (Zalo cùng số) để thuê xe nhanh nhất nhé! 🛵" },
    // --- END EDIT ---
  ];
  function smartAnswer(q){
    for (const rule of rules){
      if(rule.pattern.test(q)) return rule.answer;
    }
    return null;
  }
  const spellMap = {
    'thue xe may':'thuê xe máy','xe so':'xe số','xe ga':'xe ga',
    'thu tuc':'thủ tục','giay to':'giấy tờ','bang gia':'bảng giá',
    'lien he':'liên hệ'
  };
  function fixText(txt){
    let t = txt.toLowerCase();
    for (const [k,v] of Object.entries(spellMap)){
      t = t.replace(new RegExp(`\\b${k}\\b`,'g'),v);
    }
    return t;
  }
  // --- 🧠 END: MotoAI v13 Brain Patch ---

  
  /* -------- Fallback: v10/v10.5 Corpus Retrieval (P2 + P3) -------- */
  // (Đã được NÂNG CẤP để hỗ trợ Yêu cầu 5)
  async function retrieveFromCorpus(text){
    // 'text' đã được fix lỗi chính tả
    showTypingDots();

    setTimeout(()=>{
      try{
        // Yêu cầu 5: Ưu tiên P2 (Corpus Gốc)
        let ans = retrieveBestAnswer(text); // v10 logic (P2)
        
        if(!ans){
          // Yêu cầu 5: Nếu P2 không có, thử P3 (Corpus Mở Rộng)
          ans = retrieveFromExtendedCorpus(text); // (P3)
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

  /* ---------- NEW sendQuery: v13(P1) + v10(P2) + v10.5(P3) ---------- */
  // (Giữ nguyên logic điều phối, chỉ gọi đến retrieveFromCorpus đã được nâng cấp)
  async function sendQuery(text){
    if(!text || !text.trim()) return;
    if(sendLock) return;
    sendLock = true; sendBtn.disabled = true;
    hideTypingDots();

    addMessage('user', text);
    const fixed = fixText(text);
    const name = detectNameFromText(text);
    
    if(name){
      addMessage('bot', `Đã nhớ tên: ${name} ✨`);
      sendLock=false; sendBtn.disabled=false;
      setTimeout(()=> inputEl.focus(), 120);
      return;
    }

    // Yêu cầu 5: Ưu tiên P1 (SmartEngine)
    let ans = smartAnswer(fixed);
    
    if(ans){
      // HIT (P1): Trả lời ngay
      showTypingDots();
      setTimeout(()=>{
        hideTypingDots();
        addMessage('bot', ans);
        sendLock=false; sendBtn.disabled=false;
        setTimeout(()=> inputEl.focus(),120);
      }, 200);
    } else {
      // MISS (P1): Fallback về P2 và P3
      // hàm retrieveFromCorpus (đã được nâng cấp) sẽ tự xử lý P2 và P3
      retrieveFromCorpus(fixed);
    }
  }


  /* ---------- Quick analytic: avoid overlap ---------- */
  // (Giữ nguyên theo Yêu cầu 1)
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
  // (Giữ nguyên theo Yêu cầu 1)
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
    buildSuggestions();
    loadSession();

    // Logic refresh corpus GỐC (P2)
    // (Giỳ nguyên theo Yêu cầu 1)
    const now = Date.now();
    const last = parseInt(localStorage.getItem(CFG.lastCorpusBuildKey)||'0',10);
    const seventyTwoHrs = 72*60*60*1000;
    
    if(corpus.length === 0 || !last || (now - last) > seventyTwoHrs){
      if (corpus.length > 0) {
        console.log('🔁 Refreshing corpus (Gốc) after 72h...');
      }
      buildCorpusFromDOM(); // Xây dựng P2
      localStorage.setItem(CFG.lastCorpusBuildKey, now.toString());
    }
    // (Logic học mở rộng P3 đã tự chạy ở script bên trên)
    
    attachViewportHandler();
    adaptCardHeight();
    // bind events (Giữ nguyên)
    bubble.addEventListener('click', ()=>{ if(!isOpen){ openChat(); } else closeChat(); });
    overlay.addEventListener('click', (e)=>{ if(e.target===overlay) closeChat(); });
    closeBtn.addEventListener('click', closeChat);
    clearBtn.addEventListener('click', ()=>{ sessionMsgs=[]; saveSession(); bodyEl.innerHTML=''; addMessage('bot','🗑 Đã xóa hội thoại.'); });
    sendBtn.addEventListener('click', ()=>{ const v = (inputEl.value||'').trim(); inputEl.value=''; sendQuery(v); });
    inputEl.addEventListener('keydown', (e)=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); const v = (inputEl.value||'').trim(); inputEl.value=''; sendQuery(v); } });
    
    const styleTyping = document.createElement('style'); styleTyping.textContent = `
      #motoai-typing .dot{display:inline-block;margin:0 2px;opacity:.6;font-weight:700;animation:motoai-dot .9s linear infinite}
      #motoai-typing .dot:nth-child(2){animation-delay:.12s}#motoai-typing .dot:nth-child(3){animation-delay:.24s}
      @keyframes motoai-dot{0%{opacity:.2;transform:translateY(0)}50%{opacity:1;transform:translateY(-4px)}100%{opacity:.2;transform:translateY(0)} }`;
    document.head.appendChild(styleTyping);

    setInterval(avoidOverlap, 1200);
    window.addEventListener('resize', ()=>{ adaptCardHeight(); setTimeout(avoidOverlap,260); });
  }

  /* ---------- adapt card height responsive ---------- */
  // (Giữ nguyên theo Yêu cầu 1)
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
  // (Giữ nguyên theo Yêu cầu 1)
  window.MotoAI_v10 = {
    open: openChat,
    close: closeChat,
    rebuildCorpus: buildCorpusFromDOM,
    getName: getUserName,
    clearMemory: ()=>{ try{ localStorage.removeItem(CFG.memoryKeyName); }catch(e){} }
    // Lưu ý: hàm retrieveBestAnswer gốc (P2) không còn được expose
    // vì logic trả lời đã được gộp trong sendQuery/retrieveFromCorpus
  };

  /* ---------- bootstrap ---------- */
  setTimeout(init, 160);

})();
// === 🧩 Global Light Mode Fix (Giữ nguyên) ===
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
  console.log('%c✅ MotoAI v10 Light Mode Fix Applied (Menu Safe)', 'color:#0a84ff;font-weight:bold;');
})();

// === 🚀 Final Ready Log (Đã cập nhật) ===
console.log('%c🧠 MotoAI v10 Smart Hybrid Pro (Ext) Ready ✅','color:#0a84ff;font-weight:bold;');

