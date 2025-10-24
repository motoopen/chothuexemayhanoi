/* =========================================================================
  fix13-1-new.js
  - Gộp UI sửa lỗi + Engine tự học (sitemap/repo/3 domains) + Smart rules
  - Chạy nội bộ (no external API needed), tương thích GitHub Pages
  - Idempotent, nhẹ, không xung đột CSS site chính
  - Author: sửa bởi trợ lý của bạn (dựa trên fix13-1.js gốc)
  ========================================================================= */

(function(window, document){
  'use strict';

  // ========== Avoid duplicate loads ==========
  if(window.MotoAI && window.MotoAI._FIX13NEW_LOADED){
    console.info('MotoAI fix13-1-new already loaded. Skipping.');
    return;
  }

  // ========== Core object ==========
  const MotoAI = window.MotoAI = window.MotoAI || {};
  MotoAI._FIX13NEW_LOADED = true;
  MotoAI.version = MotoAI.version || 'fix13-1-new@1.0';
  MotoAI.cfg = MotoAI.cfg || {};
  MotoAI.cfg.accent = MotoAI.cfg.accent || '#0a84ff';
  MotoAI.cfg.zIndex = MotoAI.cfg.zIndex || 2147483000;
  MotoAI.memory = MotoAI.memory || []; // corpus
  MotoAI.session = MotoAI.session || { msgs: [] };
  MotoAI.busy = false;

  // ========== Helper functions ==========
  const $ = sel => document.querySelector(sel);
  const create = (tag, attrs={}, parent=null) => {
    const e = document.createElement(tag);
    for(const k in attrs){
      if(k === 'text') e.textContent = attrs[k];
      else if(k === 'html') e.innerHTML = attrs[k];
      else e.setAttribute(k, attrs[k]);
    }
    if(parent) parent.appendChild(e);
    return e;
  };
  const safeJSON = (k, v) => { try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} };
  const safeReadJSON = (k) => { try{ const r = localStorage.getItem(k); return r?JSON.parse(r):null;}catch(e){return null;} };

  // ========== THEME MANAGEMENT (robust) ==========
  function applyThemeImmediate(){
    try{
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const bodyDark = document.body.classList && document.body.classList.contains('dark');
      const isDark = prefersDark || bodyDark;
      const r = document.documentElement;
      if(isDark){
        r.style.setProperty('--moto-card-bg','#0b0c0e');
        r.style.setProperty('--moto-bg','#0f1113');
        r.style.setProperty('--moto-text','#f2f2f7');
        r.style.setProperty('--moto-footer','rgba(25,25,30,0.9)');
        document.body.dataset.motoaiTheme = 'dark';
      }else{
        r.style.setProperty('--moto-card-bg','#ffffff');
        r.style.setProperty('--moto-bg','#ffffff');
        r.style.setProperty('--moto-text','#000000');
        r.style.setProperty('--moto-footer','rgba(255,255,255,0.85)');
        document.body.dataset.motoaiTheme = 'light';
      }
    }catch(e){ console.warn('MotoAI.applyThemeImmediate',e); }
  }
  function initThemeWatchers(){
    try{
      if(window.matchMedia){
        const m = window.matchMedia('(prefers-color-scheme: dark)');
        if(typeof m.addEventListener === 'function'){
          m.addEventListener('change', applyThemeImmediate);
        } else if(typeof m.addListener === 'function'){
          m.addListener(applyThemeImmediate);
        }
      }
      const mo = new MutationObserver(applyThemeImmediate);
      mo.observe(document.body, { attributes:true, attributeFilter:['class'] });
    }catch(e){ console.warn('MotoAI.initThemeWatchers', e); }
  }

  // ========== UI INJECTION (isolated scope) ==========
  function injectUI(){
    if(document.getElementById('motoai-root')) return; // idempotent

    // root container
    const root = create('div', { id:'motoai-root' }, document.body);
    root.style.cssText = `position:fixed;left:16px;bottom:18px;z-index:${MotoAI.cfg.zIndex};pointer-events:none;`;

    // bubble
    const bubble = create('button', { id:'motoai-bubble', title:'Mở MotoAI' }, root);
    bubble.textContent = '🤖';
    bubble.style.cssText = `
      pointer-events:auto;width:56px;height:56px;border-radius:14px;
      display:flex;align-items:center;justify-content:center;
      font-size:26px;background:${MotoAI.cfg.accent};color:#fff;
      box-shadow:0 10px 28px rgba(2,6,23,0.5);cursor:pointer;border:none;outline:none;transition:transform .16s;
    `;
    bubble.addEventListener('mouseenter', ()=> bubble.style.transform='scale(1.04)');
    bubble.addEventListener('mouseleave', ()=> bubble.style.transform='scale(1)');

    // overlay
    const overlay = create('div', { id:'motoai-overlay', 'aria-hidden':'true' }, document.body);
    overlay.style.cssText = `
      position:fixed;inset:0;display:flex;align-items:flex-end;justify-content:center;
      padding:12px;pointer-events:none;transition:background .24s ease;z-index:${MotoAI.cfg.zIndex-1};
    `;

    // card
    const card = create('div', { id:'motoai-card', role:'dialog', 'aria-modal':'true','aria-hidden':'true' }, overlay);
    card.style.cssText = `
      width:min(920px,calc(100% - 36px));max-width:920px;
      border-radius:18px 18px 10px 10px;height:72vh;max-height:760px;min-height:320px;
      background:var(--moto-card-bg,#ffffff);
      backdrop-filter:blur(10px) saturate(130%);
      box-shadow:0 -18px 60px rgba(0,0,0,0.25);
      display:flex;flex-direction:column;overflow:hidden;pointer-events:auto;
      transform:translateY(110%);opacity:0;transition:transform .36s cubic-bezier(.2,.9,.2,1),opacity .28s;
      color:var(--moto-text,#000);
    `;

    // header
    const header = create('div', { id:'motoai-header' }, card);
    header.style.cssText = `display:flex;align-items:center;justify-content:space-between;padding:8px 14px;font-weight:700;color:var(--moto-accent, ${MotoAI.cfg.accent});border-bottom:1px solid rgba(0,0,0,0.06);`;
    const title = create('div', { text:'MotoAI Assistant' }, header);
    const tools = create('div', {}, header);
    const clearBtn = create('button', { title:'Xóa hội thoại', type:'button', text:'🗑' }, tools);
    clearBtn.style.cssText = 'background:none;border:none;font-size:18px;cursor:pointer;padding:6px;';
    const closeBtn = create('button', { title:'Đóng', type:'button', text:'✕' }, tools);
    closeBtn.style.cssText = 'background:none;border:none;font-size:18px;cursor:pointer;padding:6px;';

    // body
    const bodyEl = create('main', { id:'motoai-body', tabindex:'0', role:'log','aria-live':'polite' }, card);
    bodyEl.style.cssText = 'flex:1;overflow:auto;padding:12px 16px;font-size:15px;background:transparent;';

    // suggestions
    const suggestions = create('div', { id:'motoai-suggestions' }, card);
    suggestions.style.cssText = 'display:flex;gap:8px;justify-content:center;padding:8px 12px;border-top:1px solid rgba(0,0,0,0.04);flex-wrap:wrap;background:var(--moto-footer, rgba(255,255,255,0.6));';
    const defaultSug = [
      {q:'Xe số', label:'🏍 Xe số'},
      {q:'Xe ga', label:'🛵 Xe ga'},
      {q:'Thủ tục', label:'📄 Thủ tục'},
      {q:'Liên hệ 0942467674', label:'☎️ Liên hệ'}
    ];
    defaultSug.forEach(s=>{
      const b = create('button', { type:'button', text:s.label }, suggestions);
      b.style.cssText = 'border:none;background:rgba(0,122,255,0.08);color:var(--moto-accent,'+MotoAI.cfg.accent+');padding:8px 12px;border-radius:12px;cursor:pointer;font-weight:600;';
      b.addEventListener('click', ()=> { if(card.getAttribute('aria-hidden')==='true') open(); setTimeout(()=> { inputEl.value = s.q; inputEl.focus(); }, 80); });
    });

    // footer
    const footer = create('div', { id:'motoai-footer' }, card);
    footer.style.cssText = 'display:flex;align-items:center;justify-content:center;gap:8px;padding:10px;border-top:1px solid rgba(0,0,0,0.06);background:var(--moto-footer, rgba(255,255,255,0.85));';
    const typingEl = create('div', { id:'motoai-typing' }, footer);
    typingEl.style.cssText = 'min-width:24px;opacity:0;transition:opacity .2s;';
    const inputEl = create('textarea', { id:'motoai-input', placeholder:'Nhập câu hỏi...', autocomplete:'off' }, footer);
    inputEl.style.cssText = 'flex:1;padding:10px 12px;border-radius:12px;border:1px solid rgba(0,0,0,0.08);font-size:15px;background:var(--moto-card-bg);color:var(--moto-text);height:44px;resize:none;';
    const sendBtn = create('button', { id:'motoai-send', type:'button', text:'Gửi' }, footer);
    sendBtn.style.cssText = 'background:'+MotoAI.cfg.accent+';color:#fff;border:none;border-radius:12px;padding:10px 16px;cursor:pointer;';

    // store elements
    MotoAI.ui = { root, bubble, overlay, card, header, title, tools, clearBtn, closeBtn, bodyEl, suggestions, typingEl, inputEl, sendBtn };

    // basic helpers
    function addMessage(role, text){
      const d = document.createElement('div');
      d.className = 'm-msg '+role;
      d.textContent = text;
      d.style.margin = '8px 0';
      d.style.padding = '12px 14px';
      d.style.borderRadius = '16px';
      d.style.maxWidth = '86%';
      d.style.lineHeight = '1.4';
      d.style.wordBreak = 'break-word';
      if(role === 'user'){
        d.style.background = 'linear-gradient(180deg,'+MotoAI.cfg.accent+',#0066d9)';
        d.style.color = '#fff';
        d.style.marginLeft = 'auto';
        d.style.boxShadow = '0 8px 26px rgba(10,132,255,0.12)';
      } else {
        d.style.background = 'rgba(255,255,255,0.92)';
        d.style.color = 'var(--moto-text,#111)';
        d.style.boxShadow = '0 6px 18px rgba(2,6,23,0.08)';
      }
      bodyEl.appendChild(d);
      bodyEl.scrollTop = bodyEl.scrollHeight;
      MotoAI.session.msgs.push({role, text, t:Date.now()});
      try{ sessionStorage.setItem('MotoAI_session_msgs', JSON.stringify(MotoAI.session.msgs)); }catch(e){}
    }

    function showTyping(){ typingEl.innerHTML = '<span class="dot">.</span><span class="dot">.</span><span class="dot">.</span>'; typingEl.style.opacity='1'; bodyEl.scrollTop = bodyEl.scrollHeight; }
    function hideTyping(){ typingEl.innerHTML=''; typingEl.style.opacity='0'; }

    // event bindings
    bubble.addEventListener('click', (e)=>{ e.stopPropagation(); if(card.getAttribute('aria-hidden')==='true') open(); else close(); });
    closeBtn.addEventListener('click', close);
    clearBtn.addEventListener('click', ()=>{ MotoAI.session.msgs = []; bodyEl.innerHTML=''; addMessage('bot','🗑 Đã xóa hội thoại.'); try{ sessionStorage.removeItem('MotoAI_session_msgs'); }catch(e){} });
    overlay.addEventListener('click', (ev)=>{ if(ev.target === overlay) close(); });

    // keyboard enter send
    inputEl.addEventListener('keydown', (ev)=>{
      if(ev.key === 'Enter' && !ev.shiftKey){ ev.preventDefault(); const v = (inputEl.value||'').trim(); if(!v) return; addMessage('user', v); inputEl.value=''; send(v); }
    });
    sendBtn.addEventListener('click', ()=>{ const v=(inputEl.value||'').trim(); if(!v) return; addMessage('user', v); inputEl.value=''; send(v); });

    // methods open/close
    function open(){
      overlay.style.pointerEvents='auto';
      overlay.style.background='rgba(0,0,0,0.4)';
      card.style.transform='translateY(0)';
      card.style.opacity='1';
      card.setAttribute('aria-hidden','false');
      setTimeout(()=> inputEl.focus(), 260);
    }
    function close(){
      overlay.style.background='rgba(0,0,0,0)';
      overlay.style.pointerEvents='none';
      card.style.transform='translateY(110%)';
      card.style.opacity='0';
      card.setAttribute('aria-hidden','true');
    }

    // restore session if exists
    try{
      const raw = sessionStorage.getItem('MotoAI_session_msgs');
      if(raw){ MotoAI.session.msgs = JSON.parse(raw); MotoAI.session.msgs.forEach(m => addMessage(m.role, m.text)); }
      else addMessage('bot', '👋 Xin chào! Mình là MotoAI — hỏi thử “Xe ga”, “Xe số”, “Thủ tục” nhé!');
    }catch(e){ addMessage('bot','👋 Xin chào! Mình là MotoAI — hỏi thử “Xe ga”, “Xe số”, “Thủ tục” nhé!'); }

    // expose helper for engine to use
    MotoAI._uiHelpers = { addMessage, showTyping, hideTyping, open, close };
  } // end injectUI

  // ========== SMART & LEARN ENGINE ==========
  // Defaults - YOUR DOMAINS (kept from original)
  const DOMAINS = MotoAI.domains || [
    "https://thuexemaynguyentu.com",
    "https://thuexemaynguyentu.github.io/vn-index.html/",
    "https://webhanoi.github.io/motorbikerental.index.html/"
  ];

  // Corpus persistence keys
  const CORPUS_KEY = 'MotoAI_v13_corpus_v2';
  const LAST_BUILD_KEY = 'MotoAI_v13_lastbuild';

  // tokenize helper
  function tokenize(s){
    try{ return (s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^\p{L}\p{N}\s]+/gu,' ').split(/\s+/).filter(Boolean); }
    catch(e){ return (s||'').toLowerCase().split(/\s+/).filter(Boolean); }
  }

  // restore corpus
  (function restoreCorpus(){
    try{
      const raw = localStorage.getItem(CORPUS_KEY);
      if(raw){ const parsed = JSON.parse(raw); if(Array.isArray(parsed) && parsed.length) MotoAI.memory = parsed; }
    }catch(e){}
  })();

  // build corpus from DOM
  function buildCorpusFromDOM(){
    try{
      let nodes = Array.from(document.querySelectorAll('main, article, section, p, h1, h2, h3, li'));
      if(!nodes.length) nodes = [document.body];
      const texts = [];
      nodes.forEach(n=>{
        const t = (n.innerText || n.textContent || '').trim();
        if(t && t.length > 30 && !t.includes('{') && !t.includes('}')) texts.push(t);
      });
      // dedupe
      const uniq = Array.from(new Set(texts)).slice(0, 600);
      const newCorpus = uniq.map((t,i)=>({ id: i, text: t, tokens: tokenize(t) }));
      // merge with existing while avoiding duplicates
      const existingTexts = new Set(MotoAI.memory.map(m => m.text));
      uniq.forEach(t => { if(!existingTexts.has(t)) MotoAI.memory.push({ id: MotoAI.memory.length, text: t, tokens: tokenize(t) }); });
      // persist
      try{ localStorage.setItem(CORPUS_KEY, JSON.stringify(MotoAI.memory)); }catch(e){}
      console.log('MotoAI: corpus built/updated. size=', MotoAI.memory.length);
    }catch(e){ console.warn('buildCorpusFromDOM', e); }
  }

  // retrieve best from corpus (simple overlap scoring)
  function retrieveBestAnswer(query){
    if(!query || !MotoAI.memory.length) return null;
    const qTok = tokenize(query).filter(t=>t.length>1);
    if(!qTok.length) return null;
    let best = {score:0, text:null};
    for(const c of MotoAI.memory){
      let score=0;
      for(const qt of qTok) if(c.tokens.includes(qt)) score++;
      if(c.text.toLowerCase().includes(query.toLowerCase())) score += 0.6;
      if(score > best.score){ best = {score, text: c.text}; }
    }
    return best.score > 0 ? best.text : null;
  }

  // smart rule answers (fast)
  const RULES = [
    { pattern: /(chào|xin chào|hello|hi|alo)/i, answers: ['Chào bạn! Mình là MotoAI 🤖. Mình có thể giúp gì?','Xin chào! Bạn muốn hỏi về xe, thủ tục hay giá?'] },
    { pattern: /(xe số|wave|sirius|blade|future)/i, answers: ['Xe số tiết kiệm xăng, giá thuê từ 100k/ngày. Bạn muốn xem giá chi tiết?','Xe số rất phù hợp đi phố và phượt nhẹ.'] },
    { pattern: /(xe ga|vision|lead|air blade|sh|vespa)/i, answers: ['Xe ga chạy êm, cốp rộng — giá thường 120k-150k/ngày.','Xe ga phù hợp di chuyển trong TP. Bạn muốn loại xe nào?'] },
    { pattern: /(thủ tục|giấy tờ|có cần|cọc|đặt cọc)/i, answers: ['Thủ tục: CCCD + GPLX. Xe 50cc chỉ cần CCCD.','Bạn chỉ cần để lại giấy tờ gốc, thủ tục nhanh.'] },
    { pattern: /(giá|bao nhiêu|bảng giá|thuê bao nhiêu)/i, answers: ['Giá thuê: Xe số 100-120k/ngày, Xe ga 120-150k/ngày, Xe côn 200-250k/ngày.','Thuê theo tuần/tháng có ưu đãi.'] },
    { pattern: /(liên hệ|địa chỉ|sdt|zalo|hotline)/i, answers: ['Địa chỉ: 112 Nguyễn Văn Cừ, Long Biên, Hà Nội. Zalo/Hotline: 0942467674.','Bạn gọi Zalo 0942467674 để đặt xe nhé.'] },
    { pattern: /(giao xe|ship|tận nơi|sân bay|bến xe)/i, answers: ['Giao xe tận nơi miễn phí trong nội thành Hà Nội.','Bạn chỉ cần chốt địa chỉ, bên mình giao tận nơi.'] }
  ];

  function smartAnswerRules(q){
    try{
      for(const r of RULES){
        if(r.pattern.test(q)) return r.answers[Math.floor(Math.random()*r.answers.length)];
      }
    }catch(e){}
    return null;
  }

  // ========== Fetch helpers: learn from domains & sitemap ==========
  async function fetchText(url){
    try{
      const res = await fetch(url, { cache: 'no-store', mode:'cors' });
      if(!res.ok) throw new Error('not ok');
      return await res.text();
    }catch(e){ throw e; }
  }

  // Learn HTML content (parse safe)
  async function learnHTML(url){
    try{
      const html = await fetchText(url);
      const tmp = document.createElement('div');
      tmp.innerHTML = html;
      const nodes = tmp.querySelectorAll('h1,h2,h3,p,li,section,article');
      let added = 0;
      nodes.forEach(n=>{
        const t = (n.textContent||'').trim();
        if(t.length>40 && !t.includes('{') && !t.includes('}')){
          const exists = MotoAI.memory.some(m => m.text === t);
          if(!exists){
            MotoAI.memory.push({ id: MotoAI.memory.length, text: t, tokens: tokenize(t), source: url });
            added++;
          }
        }
      });
      if(added) try{ localStorage.setItem(CORPUS_KEY, JSON.stringify(MotoAI.memory)); }catch(e){}
      console.log('MotoAI learned from', url, '+', added);
      return added;
    }catch(e){ console.warn('learnHTML failed',url,e); return 0; }
  }

  // Learn from sitemap.xml if present
  async function learnFromSitemap(domain){
    try{
      let sitemap = domain.replace(/\/$/,'') + '/sitemap.xml';
      const res = await fetch(sitemap, { cache:'no-store', mode:'cors' });
      if(!res.ok) throw new Error('no sitemap');
      const txt = await res.text();
      const links = Array.from(txt.matchAll(/<loc>(.*?)<\/loc>/g)).map(m=>m[1]).filter(Boolean);
      // Limit to first 20 links to avoid overload
      const subset = links.slice(0, 20);
      for(const l of subset){
        await learnHTML(l);
      }
      return subset.length;
    }catch(e){ console.warn('learnFromSitemap failed for',domain,e); return 0; }
  }

  // Learn from list of related sites (includes domain root)
  async function learnFromMySites(){
    const sites = MotoAI.sitesToLearn || DOMAINS;
    console.log('MotoAI: start learning from sites...', sites);
    let totalNew = 0;
    for(const s of sites){
      try{
        // try sitemap first
        const n = await learnFromSitemap(s);
        totalNew += n;
        // then learn from root page
        const n2 = await learnHTML(s);
        totalNew += n2;
      }catch(e){ console.warn('learnFromMySites error', e); }
    }
    try{ localStorage.setItem(LAST_BUILD_KEY, Date.now()); }catch(e){}
    console.log('MotoAI: learning complete. new items=', totalNew, 'total corpus=', MotoAI.memory.length);
  }

  // Learn from repo sitemap.json if exists (like original)
  async function learnFromRepoSitemap(sitemapPath='/moto_sitemap.json'){
    try{
      const res = await fetch(sitemapPath, {cache:'no-store'});
      if(!res.ok) return 0;
      const data = await res.json();
      if(!Array.isArray(data.pages)) return 0;
      let added = 0;
      const pages = data.pages.slice(0, 60);
      for(const p of pages){
        try{
          await learnHTML(p);
        }catch(e){}
      }
      console.log('MotoAI learned repo sitemap:', pages.length);
      return pages.length;
    }catch(e){ return 0; }
  }

  // Auto rebuild logic: refresh after 72h
  (function autoRefreshCorpus(){
    try{
      const last = parseInt(localStorage.getItem(LAST_BUILD_KEY)||'0',10);
      const now = Date.now();
      const seventyTwo = 72*60*60*1000;
      if(!last || (now - last) > seventyTwo){
        // schedule lightweight rebuild: build from DOM asap, and then background learn
        setTimeout(()=> {
          buildCorpusFromDOM();
          setTimeout(()=> { learnFromMySites().catch(()=>{}); learnFromRepoSitemap().catch(()=>{}); }, 800);
        }, 160);
      }
    }catch(e){ console.warn('autoRefreshCorpus', e); }
  })();

  // Expose manual rebuild
  MotoAI.rebuildCorpus = function(){ buildCorpusFromDOM(); learnFromMySites(); learnFromRepoSitemap(); };

  // ========== SEND / RECEIVE logic ==========
  function chooseAnswer(query){
    // 1) direct smart rules
    const ruleAns = smartAnswerRules(query);
    if(ruleAns) return ruleAns;
    // 2) corpus retrieval
    const corpusAns = retrieveBestAnswer(query);
    if(corpusAns) return corpusAns;
    // 3) fallback
    return null;
  }

  async function sendQuery(text){
    if(!text || !text.trim()) return;
    try{
      MotoAI._uiHelpers && MotoAI._uiHelpers.showTyping();
      // small throttle
      await new Promise(res => setTimeout(res, 280));

      // try smart rule first
      const q = (text||'').toLowerCase();
      let ans = chooseAnswer(q);

      if(!ans){
        // If nothing, and we have sparse memory, try a second pass with token overlap
        ans = retrieveBestAnswer(q);
      }

      if(!ans){
        // Optionally attempt to fetch live from our learned sites (cheap)
        // Try findRelevant across memory already done by retrieveBestAnswer
        ans = "Xin lỗi, mình chưa có thông tin chính xác cho câu này. Bạn thử hỏi: 'Giá thuê xe', 'Xe ga', 'Liên hệ' nhé!";
      }

      MotoAI._uiHelpers && MotoAI._uiHelpers.hideTyping();
      MotoAI._uiHelpers && MotoAI._uiHelpers.addMessage('bot', ans);
    }catch(e){
      MotoAI._uiHelpers && MotoAI._uiHelpers.hideTyping();
      MotoAI._uiHelpers && MotoAI._uiHelpers.addMessage('bot', 'Lỗi khi xử lý. Thử lại nhé.');
      console.error('MotoAI.sendQuery error', e);
    }
  }

  // allow external registration if desired (compat)
  window.MotoAI_sendQuery = window.MotoAI_sendQuery || sendQuery;

  // ========== SPELLFIX & small patches (like original) ==========
  // small map to auto-fix common user typos (lightweight)
  const spellMap = {
    'thue xe may':'thuê xe máy', 'thuexemay':'thuê xe máy', 'xe so':'xe số','xe ga':'xe ga',
    'bang gia':'bảng giá','lien he':'liên hệ','thu tuc':'thủ tục'
  };
  function fixSpelling(t){
    let s = (t||'').toLowerCase();
    for(const k in spellMap){
      const re = new RegExp('\\b'+k+'\\b','gi');
      s = s.replace(re, spellMap[k]);
    }
    return s;
  }

  // ========== BOOTSTRAP: init everything safely ==========
  function bootstrap(){
    try{
      // theme
      applyThemeImmediate();
      initThemeWatchers();

      // ui
      injectUI();

      // build immediate corpus from DOM (fast)
      buildCorpusFromDOM();

      // attach send handler to UI if not present
      if(MotoAI.ui && MotoAI.ui.sendBtn && !MotoAI._sendHookAttached){
        MotoAI._sendHookAttached = true;
        MotoAI.ui.sendBtn.addEventListener('click', ()=>{
          const v = (MotoAI.ui.inputEl.value||'').trim();
          if(!v) return;
          // normalize small typos
          const fixed = fixSpelling(v);
          // display already done by UI, but ensure a message shows if external call
          // call core engine
          sendQuery(fixed);
        });
      }

      // also wire Enter key if not previously handled
      if(MotoAI.ui && MotoAI.ui.inputEl){
        MotoAI.ui.inputEl.addEventListener('keydown', (e)=>{
          if(e.key === 'Enter' && !e.shiftKey){
            e.preventDefault();
            const v = (MotoAI.ui.inputEl.value||'').trim();
            if(!v) return;
            const fixed = fixSpelling(v);
            // UI already pushes user message before this handler (in our UI logic),
            // but ensure call to sendQuery
            sendQuery(fixed);
            MotoAI.ui.inputEl.value = '';
          }
        });
      }

      // schedule background learning (non-blocking)
      setTimeout(()=> {
        // Learn from site list and repo sitemap
        learnFromMySites().catch(()=>{});
        learnFromRepoSitemap().catch(()=>{});
      }, 1200);

      // small log
      console.log('MotoAI fix13-1-new bootstrapped. Version:', MotoAI.version);
    }catch(e){ console.error('MotoAI.bootstrap error', e); }
  }

  // Wait for DOM ready
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', bootstrap);
    window.addEventListener('load', ()=> setTimeout(()=> bootstrap(), 300));
  } else {
    setTimeout(bootstrap, 80);
  }

  // ========== Public API ==========
  MotoAI.rebuildCorpus = MotoAI.rebuildCorpus || function(){ buildCorpusFromDOM(); learnFromMySites(); learnFromRepoSitemap(); };
  MotoAI.sendQuery = MotoAI.sendQuery || sendQuery;
  MotoAI.getCorpus = () => MotoAI.memory;
  MotoAI.addToCorpus = (text, source='manual') => { if(!text || text.length<20) return false; MotoAI.memory.push({ id: MotoAI.memory.length, text, tokens: tokenize(text), source }); try{ localStorage.setItem(CORPUS_KEY, JSON.stringify(MotoAI.memory)); }catch(e){}; return true; };

  // Export for debugging convenience
  window.MotoAI = MotoAI;

})(window, document);
