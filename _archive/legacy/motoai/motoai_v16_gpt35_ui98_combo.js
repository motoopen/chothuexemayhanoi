/* motoai_v16_gpt35_ui98_combo.js
   MotoAI v16 — GPT-3.5-like Combo + UI v9.8 (Auto-sitemap & Corpus)
   Self-contained; reads moto_sitemap.json and any *_sitemap.json in same repo.
*/
(function(){
  if(window.MotoAI_v16_LOADED) return;
  window.MotoAI_v16_LOADED = true;
  console.log('%cMotoAI v16 GPT-3.5 UI98 Combo loading...','color:#0a84ff;font-weight:700');

  // ========== CONFIG ==========
  const CFG = {
    sitemapPath: '/moto_sitemap.json',
    sitemapAutoGlob: true, // tìm các *_sitemap.json trong cùng repo danh sách nếu có (try fetch)
    corpusKey: 'MotoAI_v16_corpus',
    extCorpusKey: 'MotoAI_v16_corpus_ext',
    lastLearnKey: 'MotoAI_v16_lastLearn',
    lastSitemapHash: 'MotoAI_v16_lastSitemapHash',
    refreshHours: 72,
    minSentenceLen: 20,
    maxItems: 1200
  };

  // ========== Helpers ==========
  const $ = s => document.querySelector(s);
  function tokenize(t){ return (t||'').toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu,' ').split(/\s+/).filter(Boolean); }
  function uniq(arr){ return Array.from(new Set(arr)); }
  function norm(t){ return (t||'').toString().trim(); }
  function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }
  function safeJSONParse(s){ try{return JSON.parse(s);}catch(e){return null;} }

  // ========== UI inject (v9.8-like) ==========
  const uiHtml = `<div id="motoai-root">
    <div id="motoai-bubble" role="button" aria-label="Mở chat">🤖</div>
    <div id="motoai-backdrop"></div>
    <div id="motoai-card" aria-hidden="true">
      <div id="motoai-handle"></div>
      <div id="motoai-header"><span>MotoAI Assistant</span><button id="motoai-close" title="Đóng">✕</button></div>
      <div id="motoai-body" tabindex="0" role="log" aria-live="polite"></div>
      <div id="motoai-suggestions"></div>
      <div id="motoai-input"><input id="motoai-input-el" placeholder="Nhập câu hỏi..." autocomplete="off"/><button id="motoai-send">Gửi</button></div>
      <button id="motoai-clear" title="Xóa hội thoại">🗑</button>
    </div>
  </div>`;
  const uiCss = `
  :root{--m-ai-accent:#007aff}
  #motoai-root{position:fixed;left:16px;bottom:100px;z-index:99999;font-family:-apple-system,system-ui,Segoe UI,Roboto,"Helvetica Neue",Arial}
  #motoai-bubble{width:58px;height:58px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:28px;background:var(--m-ai-accent);color:#fff;cursor:pointer;box-shadow:0 8px 22px rgba(0,0,0,0.25)}
  #motoai-backdrop{position:fixed;inset:0;background:rgba(0,0,0,0.25);opacity:0;pointer-events:none;transition:opacity .28s}
  #motoai-backdrop.show{opacity:1;pointer-events:auto}
  #motoai-card{position:fixed;left:0;right:0;bottom:0;width:min(900px,calc(100% - 30px));margin:auto;height:70vh;max-height:720px;border-radius:22px 22px 0 0;background:rgba(255,255,255,0.9);backdrop-filter:blur(14px) saturate(150%);box-shadow:0 -12px 40px rgba(0,0,0,.18);transform:translateY(110%);opacity:0;display:flex;flex-direction:column;overflow:hidden;transition:transform .45s,opacity .3s}
  #motoai-card.open{transform:translateY(0);opacity:1}
  #motoai-handle{width:60px;height:6px;background:rgba(160,160,160,0.6);border-radius:6px;margin:10px auto}
  #motoai-header{display:flex;align-items:center;justify-content:space-between;padding:6px 14px;font-weight:700;color:var(--m-ai-accent);border-bottom:1px solid rgba(0,0,0,.06)}
  #motoai-header button{background:none;border:none;font-size:22px;cursor:pointer;color:var(--m-ai-accent)}
  #motoai-body{flex:1;overflow:auto;padding:10px 14px;font-size:15px}
  .m-msg{margin:8px 0;padding:12px 14px;border-radius:18px;max-width:84%;line-height:1.4;word-break:break-word;box-shadow:0 3px 8px rgba(0,0,0,0.08)}
  .m-msg.user{background:linear-gradient(180deg,var(--m-ai-accent),#00b6ff);color:#fff;margin-left:auto}
  .m-msg.bot{background:rgba(255,255,255,0.85);color:#111}
  #motoai-suggestions{display:flex;gap:6px;justify-content:center;flex-wrap:wrap;padding:6px 10px;border-top:1px solid rgba(0,0,0,.05);background:rgba(255,255,255,0.6)}
  #motoai-suggestions button{border:none;background:rgba(0,122,255,.08);color:var(--m-ai-accent);padding:8px 12px;border-radius:12px;cursor:pointer;font-weight:500}
  #motoai-input{display:flex;gap:8px;padding:10px;border-top:1px solid rgba(0,0,0,.06);background:rgba(255,255,255,0.7)}
  #motoai-input input{flex:1;padding:10px;border-radius:12px;border:1px solid rgba(0,0,0,0.1);font-size:15px}
  #motoai-input button{background:var(--m-ai-accent);color:#fff;border:none;border-radius:10px;padding:10px 14px;cursor:pointer}
  #motoai-clear{position:absolute;top:10px;right:40px;background:none;border:none;font-size:18px;cursor:pointer;opacity:.8;color:#333}
  @media (prefers-color-scheme:dark){ #motoai-card{background:rgba(20,20,22,0.94);color:#eee} .m-msg.bot{background:rgba(30,30,32,0.86);color:#eee} #motoai-input{background:rgba(25,25,30,0.9)} #motoai-suggestions{background:rgba(25,25,30,0.8)} }
  @media (max-width:520px){ #motoai-root{bottom:18px} #motoai-card{width:calc(100% - 24px);height:78vh} }
  `;

  // inject UI only once
  (function injectUI(){
    try{
      if($('#motoai-root')) return;
      const div = document.createElement('div');
      div.innerHTML = uiHtml;
      document.body.appendChild(div.firstElementChild);
      const st = document.createElement('style'); st.textContent = uiCss; document.head.appendChild(st);
    }catch(e){ console.error('Inject UI error', e); }
  })();

  // DOM refs
  const rootEl = $('#motoai-root'), bubble = $('#motoai-bubble'), backdrop = $('#motoai-backdrop'),
        card = $('#motoai-card'), closeBtn = $('#motoai-close'), bodyEl = $('#motoai-body'),
        suggestionsWrap = $('#motoai-suggestions'), inputEl = $('#motoai-input-el'),
        sendBtn = $('#motoai-send'), clearBtn = $('#motoai-clear');

  // ========== State ==========
  let isOpen = false, sendLock=false, corpus = [], extCorpus = [];

  // ========== Small Smart Rules (GPT-3.5-like heuristics) ==========
  const RULES = [
    {pattern:/(chào|xin chào|hello|hi|alo)/i, answers:["Chào bạn 👋! Mình là MotoAI, hỗ trợ thuê xe máy ở Hà Nội — bạn cần hỏi gì?","Xin chào! Bạn muốn xem giá, thủ tục hay loại xe?"]},
    {pattern:/(xe số|wave|sirius|blade|future|winner)/i, answers:["Xe số tiết kiệm xăng, phù hợp đường dài và đi tỉnh. Giá thuê bắt đầu từ ~150k/ngày."]},
    {pattern:/(xe ga|vision|lead|air blade|pcx|nvx|vespa)/i, answers:["Xe tay ga chạy êm, cốp rộng. Giá thuê theo ngày/tuần/tháng, Vision/AirBlade thuộc phân khúc phổ biến."]},
    {pattern:/(50cc|không cần bằng|khong can bang|học sinh|sinh viên)/i, answers:["Xe 50cc không cần bằng lái, chỉ cần CCCD. Thích hợp cho học sinh/sinh viên."]},
    {pattern:/(thủ tục|thutuc|giấy tờ|giay to|cọc|dat coc)/i, answers:["Thủ tục: CCCD + Bằng lái (nếu xe >50cc). Cọc nhẹ tùy xe; giấy tờ sẽ được hoàn trả khi trả xe."]},
    {pattern:/(giá|bao nhiêu|bảng giá|bang gia)/i, answers:["Giá thường: Xe số ~150k/ngày; Xe ga ~130-200k/ngày; Thuê tuần/tháng có ưu đãi. Bạn muốn giá cụ thể cho mẫu xe nào?"]},
    {pattern:/(liên hệ|lien he|zalo|hotline|sđt|sdt)/i, answers:["Liên hệ: 0857 255 868 (Zalo/Hotline) để đặt xe nhanh."]},
    {pattern:/(giao|ship|tận nơi|san bay|bến xe|bến)/i, answers:["Có giao xe tận nơi trong nội thành; một số khu vực tính phí giao nhẹ tùy khoảng cách."]},
  ];

  function ruleAnswer(q){
    for(const r of RULES){
      if(r.pattern.test(q)) return r.answers[Math.floor(Math.random()*r.answers.length)];
    }
    return null;
  }

  // ========== Corpus building & retrieval ==========
  function saveCorpus(){
    try{ localStorage.setItem(CFG.corpusKey, JSON.stringify(corpus)); }catch(e){}
    try{ localStorage.setItem(CFG.extCorpusKey, JSON.stringify(extCorpus)); }catch(e){}
  }
  function loadCorpus(){
    try{ const raw = localStorage.getItem(CFG.corpusKey); if(raw) corpus = safeJSONParse(raw) || []; }catch(e){}
    try{ const r2 = localStorage.getItem(CFG.extCorpusKey); if(r2) extCorpus = safeJSONParse(r2) || []; }catch(e){}
  }
  loadCorpus();

  function buildCorpusFromDOM(){
    try{
      let nodes = Array.from(document.querySelectorAll('main, article, section'));
      if(!nodes.length) nodes = [document.body];
      let texts = [];
      nodes.forEach(n=>{
        Array.from(n.querySelectorAll('h1,h2,h3')).forEach(h=>{ if(h.innerText && h.innerText.trim().length>10) texts.push(h.innerText.trim()); });
        Array.from(n.querySelectorAll('p, li')).forEach(p=>{ const t=p.innerText.trim(); if(t.length>=CFG.minSentenceLen) texts.push(t); });
      });
      if(!texts.length){
        const meta = document.querySelector('meta[name="description"]');
        if(meta && meta.content) texts.push(meta.content);
        const bodyTxt = document.body.innerText || '';
        bodyTxt.split(/[.!?]\s+/).forEach(s=>{ if(s.trim().length>CFG.minSentenceLen) texts.push(s.trim()); });
      }
      texts = uniq(texts).slice(0, CFG.maxItems);
      corpus = texts.map((t,i)=>({id:i,text:t,tokens:tokenize(t)}));
      saveCorpus();
      console.log('📚 Corpus (DOM) built:', corpus.length);
    }catch(e){ console.error('Build corpus DOM error', e); }
  }

  async function fetchTextOrHtml(url){
    try{
      const res = await fetch(url, {cache:'no-store'}); if(!res.ok) return '';
      const ct = (res.headers.get('content-type')||'').toLowerCase();
      if(ct.includes('text/plain')) return await res.text();
      const html = await res.text();
      // parse and extract paragraphs
      const tmp = document.createElement('div'); tmp.innerHTML = html;
      const nodes = tmp.querySelectorAll('p,h1,h2,h3,li');
      const arr = Array.from(nodes).map(n=>n.textContent.trim()).filter(t=>t.length>CFG.minSentenceLen);
      return arr.join('\n');
    }catch(e){ console.warn('fetch fail',url,e); return ''; }
  }

  async function learnFromSitemaps(sitemapUrls){
    try{
      let combined = [];
      for(const s of sitemapUrls){
        try{
          const res = await fetch(s, {cache:'no-store'});
          if(!res.ok) { console.warn('sitemap not found', s); continue; }
          const data = await res.json();
          if(data && Array.isArray(data.pages)) combined = combined.concat(data.pages);
        }catch(e){ console.warn('sitemap parse fail', s, e); }
      }
      combined = uniq(combined).slice(0, CFG.maxItems*2);
      let added = 0;
      for(const p of combined){
        try{
          const text = await fetchTextOrHtml(p);
          if(!text) continue;
          const lines = text.split(/\n+/).map(l=>l.trim()).filter(l=>l.length>CFG.minSentenceLen);
          for(const l of lines){
            if(!extCorpus.includes(l)){
              extCorpus.push(l); added++;
            }
            if(extCorpus.length >= CFG.maxItems) break;
          }
        }catch(e){}
        if(extCorpus.length >= CFG.maxItems) break;
      }
      if(added>0){
        saveCorpus();
        console.log(`📖 Learned from sitemaps: +${added} lines, total extCorpus=${extCorpus.length}`);
      } else {
        console.log('📖 No new data found from sitemaps');
      }
      localStorage.setItem(CFG.lastLearnKey, Date.now());
    }catch(e){ console.error('learnFromSitemaps error', e); }
  }

  // auto discover sitemaps: try base + wildcard; safe attempts
  async function discoverSitemaps(){
    const base = (location.origin + location.pathname).replace(/\/[^/]*$/,'/');
    const tries = [CFG.sitemapPath, '/moto_sitemap.json', '/sitemap.json', '/sitemap.xml', '/ai_sitemap.json'];
    // also check root-repo pattern
    const urls = uniq(tries.map(u=> (u.startsWith('http')?u: (location.origin + u)) ));
    // Keep only those that respond ok as json
    const found = [];
    for(const u of urls){
      try{
        const r = await fetch(u, {method:'GET',cache:'no-store'});
        if(r.ok){
          // if xml, ignore; if json parse
          const ct = (r.headers.get('content-type')||'').toLowerCase();
          if(ct.includes('application/json') || ct.includes('text/json') || u.endsWith('.json')){
            found.push(u);
          } else {
            // try parse as json
            const txt = await r.text();
            try{ JSON.parse(txt); found.push(u); }catch(e){}
          }
        }
      }catch(e){}
    }
    return uniq(found);
  }

  // read sitemap content and compute hash
  async function checkSitemapChangesAndLearn(){
    try{
      const sitemaps = await discoverSitemaps();
      if(!sitemaps.length){
        console.log('ℹ️ No sitemap discovered.');
        return;
      }
      // build combined textual representation
      let combinedText = '';
      for(const s of sitemaps){
        try{ const r = await fetch(s, {cache:'no-store'}); if(!r.ok) continue; combinedText += await r.text(); }catch(e){}
      }
      const hash = btoa(unescape(encodeURIComponent(combinedText))).slice(0,60);
      const old = localStorage.getItem(CFG.lastSitemapHash)||'';
      if(old !== hash){
        console.log('🆕 Sitemap changed (or first time) — learning...');
        localStorage.setItem(CFG.lastSitemapHash, hash);
        // learn
        await learnFromSitemaps(sitemaps);
      } else {
        console.log('🕒 Sitemap unchanged — skip learning');
      }
    }catch(e){ console.error('checkSitemapChangesAndLearn', e); }
  }

  // ========== Retrieval ==========
  function retrieveBestFromCorpus(q){
    if(!q) return null;
    const qt = tokenize(q).filter(t=>t.length>1);
    if(!qt.length) return null;
    let best={score:0,text:null};
    const pool = (corpus||[]).concat(extCorpus||[]);
    for(const item of pool){
      const line = typeof item === 'string' ? item : item.text;
      let sc=0;
      const lower = line.toLowerCase();
      qt.forEach(w=>{ if(lower.includes(w)) sc += 1; });
      if(sc > best.score){ best={score:sc,text:line}; }
    }
    return best.score>0 ? best.text : null;
  }

  // ========== UI helpers ==========
  function addMessage(role, text){
    if(!text) return;
    const el = document.createElement('div');
    el.className = 'm-msg ' + (role==='user'?'user':'bot');
    el.textContent = text;
    bodyEl.appendChild(el);
    bodyEl.scrollTop = bodyEl.scrollHeight;
    // persist session minimally (in sessionStorage)
    try{
      const sessRaw = sessionStorage.getItem('MotoAI_v16_session')||'[]';
      const arr = safeJSONParse(sessRaw) || [];
      arr.push({role,text,t:Date.now()});
      sessionStorage.setItem('MotoAI_v16_session', JSON.stringify(arr.slice(-200)));
    }catch(e){}
  }

  function showTyping(){
    const dots = document.createElement('div'); dots.className='m-msg bot'; dots.id='motoai-typing-dots'; dots.textContent='...';
    bodyEl.appendChild(dots); bodyEl.scrollTop = bodyEl.scrollHeight;
  }
  function hideTyping(){
    const d = $('#motoai-typing-dots'); if(d) d.remove();
  }

  // ========== Compose answer (rule -> retrieval -> fallback) ==========
  function composeAnswer(q){
    if(!q || !q.trim()) return "Bạn chưa nhập câu hỏi. Thử: 'giá thuê 1 ngày', 'thủ tục', 'xe 50cc'...";
    const fixed = q.replace(/\s+/g,' ').trim();
    // 1. rules
    const r = ruleAnswer(fixed);
    if(r) return r;
    // 2. retrieval
    const r2 = retrieveBestFromCorpus(fixed);
    if(r2) return r2;
    // 3. fallback polite
    return "Xin lỗi, mình chưa tìm được thông tin chính xác trong dữ liệu. Bạn thử hỏi cụ thể hơn: 'giá thuê 1 ngày', 'thủ tục cần gì' hoặc tên mẫu xe nhé.";
  }

  // ========== Open/Close UI ==========
  function openChat(){
    if(isOpen) return;
    card.classList.add('open'); backdrop.classList.add('show'); bubble.style.display='none';
    isOpen = true; renderSession();
    setTimeout(()=>{ try{ inputEl.focus(); }catch(e){} }, 320);
  }
  function closeChat(){
    if(!isOpen) return;
    card.classList.remove('open'); backdrop.classList.remove('show'); bubble.style.display='flex';
    isOpen=false; hideTyping();
  }
  function clearChat(){
    sessionStorage.removeItem('MotoAI_v16_session'); bodyEl.innerHTML=''; addMessage('bot','🗑 Đã xóa hội thoại.');
  }
  function renderSession(){
    bodyEl.innerHTML = '';
    const raw = sessionStorage.getItem('MotoAI_v16_session')||'[]';
    const arr = safeJSONParse(raw) || [];
    if(arr.length){
      arr.forEach(m=>{ const el=document.createElement('div'); el.className='m-msg '+(m.role==='user'?'user':'bot'); el.textContent = m.text; bodyEl.appendChild(el); });
      bodyEl.scrollTop = bodyEl.scrollHeight;
    } else {
      addMessage('bot','👋 Xin chào! Mình là MotoAI — hỏi thử “Xe số”, “Xe ga”, “Thủ tục” nhé!');
    }
  }

  // ========== Bind events ==========
  bubble.addEventListener('click', ()=>{ buildCorpusFromDOM(); openChat(); });
  backdrop.addEventListener('click', closeChat);
  closeBtn.addEventListener('click', closeChat);
  clearBtn.addEventListener('click', clearChat);
  suggestionsWrap.addEventListener('click', (e)=>{ if(e.target.tagName==='BUTTON' && e.target.dataset.q){ if(!isOpen) openChat(); setTimeout(()=> userSend(e.target.dataset.q),100); }});
  sendBtn.addEventListener('click', ()=>{ const v=(inputEl.value||'').trim(); if(!v) return; inputEl.value=''; userSend(v); });
  inputEl.addEventListener('keydown', (e)=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); const v=(inputEl.value||'').trim(); if(!v) return; inputEl.value=''; userSend(v); }});

  // Suggestions
  const suggestions = [
    {q:'Giá thuê 1 ngày', label:'💵 Giá 1 ngày'},
    {q:'Thủ tục thuê xe', label:'📄 Thủ tục'},
    {q:'Xe 50cc', label:'🚲 Xe 50cc'},
    {q:'Xe ga', label:'🛵 Xe ga'},
    {q:'Liên hệ', label:'☎️ Liên hệ'}
  ];
  (function buildSuggestions(){ suggestionsWrap.innerHTML=''; suggestions.forEach(s=>{ const b=document.createElement('button'); b.type='button'; b.textContent=s.label; b.dataset.q=s.q; suggestionsWrap.appendChild(b); }); })();

  // ========== send flow (UI) ==========
  async function userSend(text){
    if(sendLock) return;
    sendLock=true;
    addMessage('user', text);
    showTyping();
    // try rules + retrieval; simulate thinking
    await sleep(200 + Math.min(400, text.length*6));
    let ans = null;
    try{ ans = composeAnswer(text); }catch(e){ ans = null; }
    hideTyping();
    if(ans) addMessage('bot', ans);
    else addMessage('bot', 'Xin lỗi, xảy ra lỗi khi trả lời. Thử lại nhé.');
    sendLock=false;
    // push short memory
    try{
      const mem = safeJSONParse(sessionStorage.getItem('MotoAI_v16_shortmem')||'[]')||[];
      mem.push({role:'user', text, t:Date.now()});
      if(mem.length>8) mem.splice(0, mem.length-8);
      sessionStorage.setItem('MotoAI_v16_shortmem', JSON.stringify(mem));
    }catch(e){}
  }

  // ========== Auto-learn scheduler & sitemap watcher ==========
  let lastAutoLearn = parseInt(localStorage.getItem(CFG.lastLearnKey)||'0',10) || 0;
  async function scheduleAutoLearn(force=false){
    try{
      const now = Date.now();
      const need = force || !lastAutoLearn || (now - lastAutoLearn) > (CFG.refreshHours*3600*1000);
      if(need){
        console.log('🔁 Auto-learn triggered...');
        await checkSitemapChangesAndLearn();
        lastAutoLearn = Date.now(); localStorage.setItem(CFG.lastLearnKey, lastAutoLearn);
      }
    }catch(e){ console.error('scheduleAutoLearn', e); }
  }

  // run initial builds
  (async function bootstrap(){
    try{
      // small theme fix
      const theme = document.createElement('style');
      theme.textContent = "@media(prefers-color-scheme:light){.m-msg.bot{background:#fff!important;color:#0b1220!important}}@media(prefers-color-scheme:dark){.m-msg.bot{background:#1c1c20!important;color:#eee!important}}";
      document.head.appendChild(theme);
      // build DOM corpus if missing
      if(!corpus || !corpus.length) buildCorpusFromDOM();
      // try learn from sitemap (non-blocking)
      scheduleAutoLearn(false);
      // watch sitemap changes occasionally
      setInterval(()=> scheduleAutoLearn(false), 6*60*60*1000); // every 6h
      console.log('%cMotoAI v16 bootstrap done','color:#0a84ff');
    }catch(e){ console.error(e); }
  })();

  // ========== Expose API ==========
  window.MotoAI_v16 = {
    open: openChat,
    close: closeChat,
    rebuildCorpus: buildCorpusFromDOM,
    learnNow: async ()=>{ await scheduleAutoLearn(true); },
    getCorpus: ()=> ({dom: corpus.slice(0,200), ext: extCorpus.slice(0,200)}),
    clearCorpus: ()=>{ corpus=[]; extCorpus=[]; saveCorpus(); },
    composeAnswer,
    version: 'v16-gpt3.5-ui98'
  };

  // ========== Self-heal watchdog ==========
  setTimeout(()=>{
    if(!$('#motoai-bubble')) {
      console.warn('⚠️ MotoAI UI not present; attempting reinject...');
      try{ injectUI(); }catch(e){}
    }
  }, 2500);

  console.log('%c✅ MotoAI v16 ready — use window.MotoAI_v16','color:#0a84ff;font-weight:700');
})();
