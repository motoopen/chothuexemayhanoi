/*
 * 🤖 MotoAI v18x — UI98 Responsive Pro (Messenger Icon) - FIXED by Senior Dev
 * - Hiệu ứng: Fade-in/out + Scale nhẹ (loại bỏ slide để tránh lỗi bàn phím mobile)
 * - Icon Messenger (SVG chuẩn), cố định góc trái dưới, tự tránh va chạm
 * - Card dùng backdrop-filter (blur 15px) + overlay nền 20% (không blur toàn trang)
 * - Tông lịch sự tự nhiên: “bạn / mình” (không dùng dạ/vâng/ạ)
 */
(function(){
  if (window.MotoAI_v18x_LOADED) return;
  window.MotoAI_v18x_LOADED = true;
  console.log('%cMotoAI v18x Messenger Responsive Pro loading…','color:#0a84ff;font-weight:700');

  /* ===== Config & Keys (Logic untouched) ===== */
  const HOSTKEY = (location.host||'site').replace(/[^a-z0-9.-]/gi,'_');
  const CFG = {
    sitemapCandidates: ['/moto_sitemap.json','/ai_sitemap.json','/sitemap.json'],
    minSentenceLen: 24,
    maxItems: 1400,
    maxInternalPages: 20,
    refreshHours: 24,
    corpusKey: `MotoAI_v18x_${HOSTKEY}_corpus`,
    extCorpusKey: `MotoAI_v18x_${HOSTKEY}_corpus_ext`,
    lastLearnKey: `MotoAI_v18x_${HOSTKEY}_lastLearn`,
    lastSitemapHashKey: `MotoAI_v18x_${HOSTKEY}_lastSitemapHash`,
    sessionKey: `MotoAI_v18x_${HOSTKEY}_session`
  };

  /* ===== Helpers (Logic untouched) ===== */
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const uniq = arr => Array.from(new Set(arr));
  const safeParse = s => { try{return JSON.parse(s);}catch(e){return null;} };
  const sleep = ms => new Promise(r=>setTimeout(r,ms));
  function tokenize(t){ return (t||'').toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu,' ').split(/\s+/).filter(Boolean); }
  function hashText(str){
    try{ return btoa(unescape(encodeURIComponent(str))).slice(0,60); }
    catch(e){ let h=0; for(let i=0;i<str.length;i++) h=(h*31+str.charCodeAt(i))|0; return String(h); }
  }
  const pick = a => a[Math.floor(Math.random()*a.length)];

  /* ===== UI (Messenger icon + responsive) - FIXED: Removed slide & handle, simplified transitions ===== */
  const messengerSVG = `
    <svg viewBox="0 0 36 36" aria-hidden="true">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0084FF"/><stop offset="100%" stop-color="#00C6FF"/>
        </linearGradient>
      </defs>
      <g fill="url(#g)">
        <path d="M18 2C9.178 2 2 8.395 2 16.27c0 4.409 2.254 8.342 5.78 10.89V34l5.283-2.9c1.63.45 3.36.7 5.154.7 8.822 0 16-6.395 16-14.27C34 8.395 26.822 2 18 2z"></path>
      </g>
      <path d="M15.1 20.4l-3.6 3.8 7-4.5 4.4 4.5 3.6-3.8-7-4.5z" fill="#fff"/>
    </svg>`;
  const uiHtml = `
  <div id="motoai-root" aria-live="polite">
    <button id="motoai-bubble" aria-label="Mở chat" title="Chat">
      ${messengerSVG}
    </button>
    <div id="motoai-overlay" aria-hidden="true"></div>
    <div id="motoai-card" aria-hidden="true" role="dialog" aria-label="MotoAI chat">
      <!-- Đã bỏ #motoai-handle để gọn hơn -->
      <div id="motoai-header">
        <span>@ AI Assistant</span>
        <a id="motoai-phone" href="tel:0857255868" aria-label="Gọi 0857 255 868">📞 0857 255 868</a>
        <button id="motoai-close" title="Đóng">✕</button>
      </div>
      <div id="motoai-body" tabindex="0" role="log"></div>
      <div id="motoai-suggestions" role="toolbar" aria-label="Gợi ý nhanh"></div>
      <div id="motoai-input">
        <input id="motoai-input-el" placeholder="Nhập câu hỏi..." autocomplete="off"/>
        <button id="motoai-send" title="Gửi">Gửi</button>
      </div>
      <button id="motoai-clear" title="Xóa hội thoại" aria-label="Xóa hội thoại">🗑</button>
    </div>
  </div>`;
  const uiCss = `
  :root { --accent:#007aff; --overlay:rgba(0,0,0,.20); --blur:15px; }
  /* Vị trí cố định (góc trái dưới) */
  #motoai-root{ position:fixed; left:16px; bottom:16px; z-index:99997; font-family:-apple-system,system-ui,Segoe UI,Roboto,"Helvetica Neue",Arial }
  /* Bubble (Messenger) */
  #motoai-bubble{ position:fixed; left:16px; bottom:16px; width:56px; height:56px; border-radius:16px; border:none; padding:10px; cursor:pointer; box-shadow:0 10px 24px rgba(0,0,0,.28); background:transparent; display:flex; align-items:center; justify-content:center; transition:transform .18s ease }
  #motoai-bubble svg{ width:100%; height:100%; display:block }
  #motoai-bubble:active{ transform:scale(.96) }

  /* Overlay (tối nhẹ 20%) */
  #motoai-overlay{ position:fixed; inset:0; background:var(--overlay); opacity:0; pointer-events:none; transition:opacity .18s ease; z-index:99998 }

  /* Card (Fade-in/out + Scale nhẹ - Đã bỏ slide) */
  #motoai-card{ position:fixed; left:16px; bottom:16px; width:min(92vw,420px); height:min(74vh,640px);
    background:rgba(255,255,255,.85); backdrop-filter:blur(var(--blur)) saturate(160%);
    border-radius:18px; box-shadow:0 18px 44px rgba(0,0,0,.22); overflow:hidden; opacity:0; 
    transform:scale(.95); /* Hiệu ứng scale nhẹ thay cho translateY */
    transition:transform .22s cubic-bezier(.4, .1, .3, 1.4), opacity .22s ease-out; 
    z-index:99999; display:flex; flex-direction:column; pointer-events:none }
  
  #motoai-card.open{ opacity:1; transform:scale(1); pointer-events:auto }

  /* Đã loại bỏ #motoai-handle CSS */

  #motoai-header{ display:flex; align-items:center; gap:10px; justify-content:space-between; padding:6px 12px 6px 14px; font-weight:700; color:var(--accent); border-bottom:1px solid rgba(0,0,0,.06) }
  #motoai-header #motoai-phone{ font-weight:600; text-decoration:none; color:#0b1220; opacity:.9 }
  #motoai-header button{ background:none; border:none; font-size:20px; cursor:pointer; color:var(--accent); opacity:.9 }

  #motoai-body{ flex:1; overflow:auto; padding:10px 14px; font-size:15px; }
  .m-msg{ margin:8px 0; padding:11px 13px; border-radius:16px; max-width:84%; line-height:1.45; word-break:break-word; box-shadow:0 2px 6px rgba(0,0,0,0.07) }
  .m-msg.user{ margin-left:auto; background:linear-gradient(180deg,var(--accent),#00b6ff); color:#fff }
  .m-msg.bot{ background:rgba(255,255,255,.92); color:#0b1220 }

  #motoai-suggestions{ display:flex; gap:6px; justify-content:center; flex-wrap:wrap; padding:6px 10px; border-top:1px solid rgba(0,0,0,.05); background:rgba(255,255,255,.70) }
  #motoai-suggestions button{ border:none; background:rgba(0,122,255,.08); color:var(--accent); padding:7px 11px; border-radius:12px; cursor:pointer; font-weight:500; font-size:14px }

  #motoai-input{ display:flex; gap:8px; padding:10px; border-top:1px solid rgba(0,0,0,.06); background:rgba(255,255,255,.75) }
  #motoai-input input{ flex:1; padding:10px; border-radius:12px; border:1px solid rgba(0,0,0,.1); font-size:15px; background:rgba(255,255,255,.75) }
  #motoai-input button{ background:var(--accent); color:#fff; border:none; border-radius:10px; padding:9px 13px; font-weight:600; cursor:pointer }

  #motoai-clear{ position:absolute; top:10px; right:46px; background:none; border:none; font-size:18px; cursor:pointer; opacity:.85; color:#333; z-index:10000 }

  /* Dark Mode */
  @media (prefers-color-scheme: dark){
    #motoai-card{ background:rgba(20,20,22,.92); color:#eee }
    .m-msg.bot{ background:rgba(35,35,38,.92); color:#eee }
    #motoai-input{ background:rgba(25,25,28,.88) }
    #motoai-suggestions{ background:rgba(25,25,30,.85) }
    #motoai-input input{ background:rgba(40,40,50,.86); color:#eee; border:1px solid rgba(255,255,255,.1) }
    #motoai-clear{ color:#eee }
    #motoai-header #motoai-phone{ color:#eee }
  }

  /* Tablet/Desktop — Nới khung tối đa 420px */
  @media (min-width: 768px){
    #motoai-card{ width:420px; height:600px }
  }
  /* Mobile nhỏ — Tối ưu vị trí */
  @media (max-width: 420px){
    /* Tối ưu sử dụng chiều cao màn hình trên mobile */
    #motoai-card{ height:min(85vh, 640px); left:12px; bottom:12px }
    #motoai-bubble{ left:12px; bottom:12px; width:52px; height:52px }
    #motoai-suggestions button{ font-size:13px; padding:6px 10px }
  }`;
  function injectUI(){
    if ($('#motoai-root')) return;
    const wrap = document.createElement('div'); wrap.innerHTML = uiHtml;
    document.body.appendChild(wrap.firstElementChild);
    const st = document.createElement('style'); st.textContent = uiCss; document.head.appendChild(st);
  }
  injectUI();

  // refs
  const bubble = $('#motoai-bubble'), overlay = $('#motoai-overlay'), card = $('#motoai-card');
  const bodyEl = $('#motoai-body'), closeBtn = $('#motoai-close'), suggestionsWrap = $('#motoai-suggestions');
  const inputEl = $('#motoai-input-el'), sendBtn = $('#motoai-send'), clearBtn = $('#motoai-clear');

  /* ===== Self-avoid overlap (nudge lên nếu đè) - Logic untouched ===== */
  function avoidOverlap(){
    try{
      const bubbleRect = bubble.getBoundingClientRect();
      const fixeds = $$('body *').filter(el=>{
        const cs = getComputedStyle(el);
        if(cs.position!=='fixed') return false;
        const r = el.getBoundingClientRect();
        // các thứ ở góc trái dưới
        return r.left < bubbleRect.right && r.bottom > bubbleRect.top && r.left < 120 && (window.innerHeight - r.bottom) < 120 && el!==bubble;
      });
      if(fixeds.length){
        bubble.style.bottom = '84px';
        card.style.bottom = '84px';
      }
    }catch(e){}
  }
  setTimeout(avoidOverlap, 600);

  /* ===== State / Storage - Logic untouched ===== */
  let isOpen=false, sendLock=false;
  let corpus=[], extCorpus=[];
  function loadCorpus(){ try{ corpus=safeParse(localStorage.getItem(CFG.corpusKey))||[]; }catch(e){} try{ extCorpus=safeParse(localStorage.getItem(CFG.extCorpusKey))||[]; }catch(e){} }
  function saveCorpus(){ try{ localStorage.setItem(CFG.corpusKey, JSON.stringify(corpus)); }catch(e){} try{ localStorage.setItem(CFG.extCorpusKey, JSON.stringify(extCorpus)); }catch(e){} }
  loadCorpus();

  function addMessage(role, text){
    if(!text) return;
    const el = document.createElement('div');
    el.className = 'm-msg ' + (role==='user'?'user':'bot');
    el.textContent = text;
    bodyEl.appendChild(el);
    bodyEl.scrollTop = bodyEl.scrollHeight;
    try{
      const raw = localStorage.getItem(CFG.sessionKey)||'[]';
      const arr = safeParse(raw)||[];
      arr.push({role,text,t:Date.now()});
      localStorage.setItem(CFG.sessionKey, JSON.stringify(arr.slice(-200)));
    }catch(e){}
  }
  function renderSession(){
    bodyEl.innerHTML='';
    const arr = safeParse(localStorage.getItem(CFG.sessionKey)||'[]')||[];
    if(arr.length){
      arr.forEach(m=>{ const el=document.createElement('div'); el.className='m-msg '+(m.role==='user'?'user':'bot'); el.textContent=m.text; bodyEl.appendChild(el); });
      bodyEl.scrollTop = bodyEl.scrollHeight;
    } else {
      addMessage('bot','Chào bạn, mình là AI Assistant. Bạn muốn xem 💰 Bảng giá, ⚙️ Dịch vụ, 🏍️ Sản phẩm hay ☎️ Liên hệ?');
    }
  }
  function showTyping(){ const d=document.createElement('div'); d.id='motoai-typing'; d.className='m-msg bot'; d.textContent='...'; bodyEl.appendChild(d); bodyEl.scrollTop=bodyEl.scrollHeight; }
  function hideTyping(){ const d=$('#motoai-typing'); if(d) d.remove(); }

  /* ===== Build Corpus (DOM) - Logic untouched ===== */
  function tokenizeCorpus(texts){ return texts.map((t,i)=>({id:i,text:t,tokens:tokenize(t)})); }
  function buildCorpusFromDOM(){
    try{
      let nodes = $$('#main, main, article, section'); if(!nodes.length) nodes = [document.body];
      let texts = [];
      nodes.forEach(n=>{
        n.querySelectorAll('h1,h2,h3').forEach(h=>{ const t=h.innerText?.trim(); if(t && t.length>12) texts.push(t); });
        n.querySelectorAll('p,li').forEach(p=>{ const t=p.innerText?.trim(); if(t && t.length>=CFG.minSentenceLen) texts.push(t); });
      });
      if(!texts.length){
        const meta = document.querySelector('meta[name="description"]');
        if(meta?.content) texts.push(meta.content);
      }
      texts = uniq(texts).slice(0, CFG.maxItems);
      corpus = tokenizeCorpus(texts);
      saveCorpus();
      console.log('📚 v18x: Built DOM corpus:', corpus.length);
    }catch(e){ console.error('Build corpus DOM error', e); }
  }
  if(!corpus.length) buildCorpusFromDOM();

  /* ===== Learn: Sitemaps & Internal - Logic untouched ===== */
  async function discoverSitemaps(){
    const urls = uniq(CFG.sitemapCandidates.map(u => (u.startsWith('http') ? u : location.origin + u)));
    const found = [];
    for(const u of urls){
      try{
        const r = await fetch(u,{cache:'no-store'});
        if(!r.ok) continue;
        const ct=(r.headers.get('content-type')||'').toLowerCase();
        if(ct.includes('json') || u.endsWith('.json')){
          found.push(u);
        }else{
          const txt = await r.text(); try{ JSON.parse(txt); found.push(u); }catch(e){}
        }
      }catch(e){}
    }
    return found;
  }
  async function fetchTextOrHtml(url){
    try{
      const res = await fetch(url,{cache:'no-store'});
      if(!res.ok) return '';
      const ct = (res.headers.get('content-type')||'').toLowerCase();
      if(ct.includes('text/plain')) return await res.text();
      const html = await res.text();
      const tmp = document.createElement('div'); tmp.innerHTML = html;
      const nodes = tmp.querySelectorAll('p,h1,h2,h3,li');
      const lines = Array.from(nodes).map(n=> (n.textContent||'').trim()).filter(t=>t.length>=CFG.minSentenceLen);
      return lines.join('\n');
    }catch(e){ return ''; }
  }
  async function learnFromSitemaps(sitemaps){
    let combined=[];
    for(const s of sitemaps){
      try{ const r=await fetch(s,{cache:'no-store'}); if(!r.ok) continue; const data=await r.json(); if(data?.pages) combined=combined.concat(data.pages); }catch(e){}
    }
    combined = uniq(combined).slice(0, CFG.maxItems*2);
    let added=0;
    for(const p of combined){
      const txt = await fetchTextOrHtml(p);
      if(!txt) continue;
      const lines = txt.split(/\n+/).map(x=>x.trim()).filter(x=>x.length>=CFG.minSentenceLen);
      for(const l of lines){
        if(!extCorpus.includes(l)){
          extCorpus.push(l); added++;
        }
        if(extCorpus.length>=CFG.maxItems) break;
      }
      if(extCorpus.length>=CFG.maxItems) break;
      await sleep(60);
    }
    if(added>0) { saveCorpus(); console.log(`🧠 Learned from sitemap: +${added} lines (ext=${extCorpus.length})`); }
  }
  function collectInternalLinks(){
    const list = $$('a[href]')
      .map(el=>el.getAttribute('href')).filter(Boolean)
      .map(h=>{ try{ return new URL(h, location.href).href; }catch(e){ return null; }})
      .filter(Boolean).filter(u=> u.startsWith(location.origin))
      .filter(u=> !/\.(png|jpe?g|gif|webp|svg|pdf|zip|rar|7z|mp4|mp3|ico)(\?|$)/i.test(u))
      .filter(u=> !u.includes('#')).filter(u=> u !== location.href);
    return uniq(list).slice(0, CFG.maxInternalPages);
  }
  async function learnFromInternal(){
    const pages = collectInternalLinks();
    if(!pages.length){ console.log('ℹ️ No internal pages to learn.'); return; }
    console.log('🌐 Learning internal pages:', pages.length);
    let added=0;
    for(const url of pages){
      const txt = await fetchTextOrHtml(url);
      if(!txt) continue;
      const lines = txt.split(/\n+/).map(x=>x.trim()).filter(x=>x.length>=CFG.minSentenceLen);
      for(const l of lines){
        if(!extCorpus.includes(l)){
          extCorpus.push(l); added++;
        }
        if(extCorpus.length>=CFG.maxItems) break;
      }
      if(extCorpus.length>=CFG.maxItems) break;
      await sleep(180);
    }
    if(added>0){ saveCorpus(); console.log(`✅ Internal learn: +${added} lines (ext=${extCorpus.length})`); }
  }
  async function checkSitemapChangeAndLearn(){
    try{
      const maps = await discoverSitemaps();
      if(!maps.length){ await learnFromInternal(); return; }
      let combined = '';
      for(const s of maps){
        try{ const r=await fetch(s,{cache:'no-store'}); if(!r.ok) continue; combined += await r.text(); }catch(e){}
      }
      const hash = hashText(combined);
      const old = localStorage.getItem(CFG.lastSitemapHashKey)||'';
      if(old !== hash){
        console.log('🆕 Sitemap changed — re-learn…');
        localStorage.setItem(CFG.lastSitemapHashKey, hash);
        await learnFromSitemaps(maps);
      } else {
        console.log('🕒 Sitemap unchanged — learn internal.');
        await learnFromInternal();
      }
    }catch(e){ console.warn('Sitemap check error', e); }
  }
  async function scheduleAutoLearn(force=false){
    const now = Date.now();
    const last = parseInt(localStorage.getItem(CFG.lastLearnKey)||'0',10) || 0;
    const need = force || !last || (now - last) > (CFG.refreshHours*3600*1000);
    if(!need){ console.log('⏳ Skip auto-learn (fresh).'); return; }
    console.log('🔁 Auto-learn triggered…');
    await checkSitemapChangeAndLearn();
    localStorage.setItem(CFG.lastLearnKey, String(Date.now()));
  }
  scheduleAutoLearn(false);
  setInterval(()=> scheduleAutoLearn(false), 6*60*60*1000);

  /* ===== Tone (polite, “bạn/mình”) - Logic untouched ===== */
  const PREFIX = ["Chào bạn,","Mình ở đây để hỗ trợ,","Mình sẵn sàng giúp,"];
  const SUFFIX = [" bạn nhé."," cảm ơn bạn."," nếu cần thêm thông tin cứ nói nhé."];
  function makePolite(text){
    const t = (text||'').trim();
    const p = pick(PREFIX), s = pick(SUFFIX);
    if(!t) return "Mình chưa nhận được câu hỏi, bạn thử nhập lại nhé.";
    return /[.!?…]$/.test(t) ? `${p} ${t} ${s}` : `${p} ${t}${s}`;
  }

  /* ===== Rules & Retrieval - Logic untouched ===== */
  const RULES = [
    {pattern:/(chào|xin chào|hello|hi|alo)/i, answers:[
      "mình là AI Assistant. Bạn muốn xem 💰 Bảng giá, ⚙️ Dịch vụ, 🏍️ Sản phẩm hay ☎️ Liên hệ?",
      "mình có thể giúp tra giá, giới thiệu dịch vụ và sản phẩm. Bạn đang quan tâm điều gì?"
    ]},
    {pattern:/(bảng giá|gia|giá|bao nhiêu|bang gia)/i, answers:[
      "đây là mục Bảng giá. Bạn cho mình biết dòng sản phẩm/dịch vụ cụ thể để mình báo chi tiết.",
      "bạn cần mức giá theo ngày/tuần/tháng hay theo gói dịch vụ?"
    ]},
    {pattern:/(dịch vụ|dich vu|service)/i, answers:[
      "bọn mình có nhiều gói dịch vụ. Bạn mô tả nhu cầu để mình gợi ý gói phù hợp.",
      "bạn muốn hỗ trợ giao nhận, bảo dưỡng, hay tư vấn lựa chọn sản phẩm?"
    ]},
    {pattern:/(sản phẩm|san pham|xe ga|xe số|xe so|50cc|vision|lead|air blade|vespa|winner|exciter)/i, answers:[
      "bạn cho mình biết nhu cầu sử dụng (đi phố, đi xa, tiết kiệm xăng…) để mình tư vấn phù hợp.",
      "mình có thể tóm tắt ưu nhược điểm từng mẫu để bạn so sánh nhanh."
    ]},
    {pattern:/(liên hệ|lien he|zalo|hotline|sđt|sdt|gọi|dien thoai)/i, answers:[
      "bạn liên hệ nhanh qua ☎️ 0857 255 868 (Zalo/Hotline) để được tư vấn trực tiếp.",
      "nếu cần gấp, bạn gọi 0857 255 868 — mình phản hồi ngay."
    ]}
  ];
  function ruleAnswer(q){
    for(const r of RULES){
      if(r.pattern.test(q)) return makePolite(pick(r.answers));
    }
    return null;
  }
  function retrieveBest(q){
    const qt = tokenize(q).filter(t=>t.length>1);
    if(!qt.length) return null;
    let best={score:0,text:null};
    const pool = (corpus||[]).concat(extCorpus||[]);
    for(const item of pool){
      const line = typeof item==='string' ? item : item.text;
      const low = (line||'').toLowerCase();
      let s=0; for(const t of qt){ if(low.includes(t)) s+=1; }
      if(s>best.score) best={score:s,text:line};
    }
    return best.score>0? makePolite(best.text): null;
  }
  function composeAnswer(q){
    const msg = (q||'').trim();
    if(!msg) return makePolite("bạn thử bấm gợi ý: 💰 Bảng giá, ⚙️ Dịch vụ, 🏍️ Sản phẩm hoặc ☎️ Liên hệ");
    const r1 = ruleAnswer(msg); if(r1) return r1;
    const r2 = retrieveBest(msg); if(r2) return r2;
    return makePolite("mình chưa tìm được thông tin trùng khớp. Bạn mô tả cụ thể hơn giúp mình với");
  }

  /* ===== Open/Close - Logic untouched ===== */
  function openChat(){
    if(isOpen) return;
    card.classList.add('open');
    overlay.style.opacity='1'; overlay.style.pointerEvents='auto';
    bubble.style.visibility='hidden';
    isOpen=true; renderSession();
    setTimeout(()=>{ try{ inputEl.focus(); }catch(e){} }, 200);
  }
  function closeChat(){
    if(!isOpen) return;
    card.classList.remove('open');
    overlay.style.opacity='0'; overlay.style.pointerEvents='none';
    bubble.style.visibility='visible';
    isOpen=false; hideTyping();
  }
  function clearChat(){
    try{ localStorage.removeItem(CFG.sessionKey);}catch(e){}
    bodyEl.innerHTML=''; addMessage('bot', makePolite('đã xóa hội thoại'));
  }

  const suggestions = [
    {q:'Bảng giá', label:'💰 Bảng giá'},
    {q:'Dịch vụ', label:'⚙️ Dịch vụ'},
    {q:'Sản phẩm', label:'🏍️ Sản phẩm'},
    {q:'Liên hệ', label:'☎️ Liên hệ'}
  ];
  function buildSuggestions(){
    suggestionsWrap.innerHTML = '';
    suggestions.forEach(s=>{
      const b=document.createElement('button'); b.type='button';
      b.textContent=s.label; b.dataset.q=s.q;
      b.addEventListener('click',()=>{ if(!isOpen) openChat(); setTimeout(()=> userSend(s.q),100); });
      suggestionsWrap.appendChild(b);
    });
  }
  buildSuggestions();

  async function userSend(text){
    if(sendLock) return;
    sendLock=true; addMessage('user', text); showTyping();
    // Thêm thời gian chờ theo độ dài text cho tự nhiên
    await sleep(200 + Math.min(480, text.length*6));
    let ans=null; try{ ans = composeAnswer(text); }catch(e){ ans=null; }
    hideTyping();
    addMessage('bot', ans || makePolite('xin lỗi, có lỗi khi trả lời. Bạn thử lại giúp mình'));
    sendLock=false;
  }

  bubble.addEventListener('click', ()=>{ buildCorpusFromDOM(); openChat(); });
  overlay.addEventListener('click', closeChat);
  closeBtn.addEventListener('click', closeChat);
  clearBtn.addEventListener('click', clearChat);
  sendBtn.addEventListener('click', ()=>{ const v=(inputEl.value||'').trim(); if(!v) return; inputEl.value=''; userSend(v); });
  inputEl.addEventListener('keydown',(e)=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); const v=(inputEl.value||'').trim(); if(!v) return; inputEl.value=''; userSend(v); }});

  /* ===== Watchdog - Logic untouched ===== */
  setTimeout(()=>{ if(!$('#motoai-bubble')){ console.warn('⚠️ MotoAI bubble missing — reinject UI'); injectUI(); }}, 2000);

  /* ===== Expose API - Logic untouched ===== */
  window.MotoAI_v18x = {
    open: openChat,
    close: closeChat,
    composeAnswer,
    learnNow: ()=> scheduleAutoLearn(true),
    getCorpus: ()=>({dom: (corpus||[]).slice(0,200), ext: (extCorpus||[]).slice(0,200)}),
    clearCorpus: ()=>{ corpus=[]; extCorpus=[]; saveCorpus(); console.log('🧹 Cleared corpus'); },
    version: 'v18x-ui98-messenger-fixed'
  };

})();

