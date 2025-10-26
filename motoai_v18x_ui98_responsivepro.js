/*
 * 🤖 MotoAI v18x — UI98 Responsive Pro (PoliteClean + AutoLearn)
 * - UI 9.8, bong bóng góc trái, blur nhẹ, dark/light auto
 * - Header: "@ AI Assistant  ☎️ 0857 255 868"
 * - Gợi ý: 💰 Bảng giá | ⚙️ Dịch vụ | 🏍️ Sản phẩm | ☎️ Liên hệ (thanh trượt ngang, co chữ theo màn hình)
 * - Responsive chuẩn desktop/tablet/mobile + landscape; safe-area iPhone
 * - PoliteClean: chỉ “bạn / mình” (không dùng dạ/vâng/ạ)
 * - AutoLearn: DOM hiện tại + *_sitemap.json (moto_sitemap.json, ai_sitemap.json, sitemap.json) + link nội bộ (giới hạn)
 * - Lưu corpus theo domain, tự refresh ~24h; API: window.MotoAI_v18x
 */
(function(){
  if (window.MotoAI_v18x_LOADED) return;
  window.MotoAI_v18x_LOADED = true;
  console.log('%cMotoAI v18x UI98 Responsive Pro loading…','color:#0a84ff;font-weight:700');

  /* ============ CONFIG ============ */
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

  /* ============ Helpers ============ */
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

  /* ============ UI98 Responsive ============ */
  const uiHtml = `
  <div id="motoai-root">
    <div id="motoai-bubble" role="button" aria-label="Mở chat" title="Chat cùng AI">🤖</div>
    <div id="motoai-backdrop"></div>
    <div id="motoai-card" aria-hidden="true">
      <div id="motoai-handle"></div>
      <div id="motoai-header">
        <span class="m-title">@ AI Assistant  <span class="m-sep">•</span>  <span class="m-phone" role="link" tabindex="0">☎️ 0857 255 868</span></span>
        <button id="motoai-close" title="Đóng">✕</button>
      </div>
      <div id="motoai-body" tabindex="0" role="log" aria-live="polite"></div>
      <div id="motoai-suggestions" role="toolbar" aria-label="Gợi ý nhanh"></div>
      <div id="motoai-input">
        <input id="motoai-input-el" placeholder="Nhập câu hỏi..." autocomplete="off" />
        <button id="motoai-send" title="Gửi">Gửi</button>
      </div>
      <button id="motoai-clear" title="Xóa hội thoại">🗑</button>
    </div>
  </div>`;

  const uiCss = `
  :root { --accent:#007aff; --bgGlassLight:rgba(255,255,255,.9); --bgGlassDark:rgba(20,20,22,.94); }
  #motoai-root{ position:fixed; left:16px; bottom:calc(88px + env(safe-area-inset-bottom, 0)); z-index:99997; font-family:-apple-system,system-ui,Segoe UI,Roboto,"Helvetica Neue",Arial }
  /* Bubble */
  #motoai-bubble{ width: clamp(48px, 7vw, 58px); height: clamp(48px, 7vw, 58px); border-radius:14px; display:flex; align-items:center; justify-content:center; font-size:clamp(22px, 3.5vw, 28px); background:var(--accent); color:#fff; cursor:pointer; box-shadow:0 8px 22px rgba(0,0,0,.25); transition:transform .25s }
  #motoai-bubble:hover{ transform:scale(1.05) }
  /* Backdrop */
  #motoai-backdrop{ position:fixed; inset:0; background:rgba(0,0,0,.25); opacity:0; pointer-events:none; transition:opacity .3s; z-index:99998 }
  #motoai-backdrop.show{ opacity:1; pointer-events:auto; }
  /* Card */
  #motoai-card{
    position:fixed; left:0; right:0; bottom:0; width:min(900px, calc(100% - 24px));
    margin:auto; height:min(70vh, 600px); max-height:78vh;
    border-radius:22px 22px 0 0; background:var(--bgGlassLight);
    backdrop-filter: blur(14px) saturate(160%); box-shadow:0 -12px 40px rgba(0,0,0,.18);
    transform:translateY(110%); opacity:0; display:flex; flex-direction:column; overflow:hidden; z-index:99999;
    transition:transform .45s cubic-bezier(.2,.9,.2,1), opacity .3s ease; padding-bottom:env(safe-area-inset-bottom, 0);
  }
  #motoai-card.open{ transform:translateY(0); opacity:1 }
  #motoai-handle{ width:60px; height:6px; background:rgba(160,160,160,.6); border-radius:6px; margin:10px auto; }
  #motoai-header{ display:flex; align-items:center; justify-content:space-between; padding:6px 12px; font-weight:700; color:var(--accent); border-bottom:1px solid rgba(0,0,0,.06); gap:8px }
  #motoai-header .m-title{ font-size: clamp(13px, 2.6vw, 15px); display:flex; align-items:center; gap:.5em; white-space:nowrap; overflow:hidden; text-overflow:ellipsis }
  #motoai-header .m-sep{ opacity:.5 }
  #motoai-header .m-phone{ cursor:pointer; text-decoration:underline; text-underline-offset:2px }
  #motoai-header button{ background:none; border:none; font-size:20px; cursor:pointer; color:var(--accent); opacity:.9 }
  #motoai-body{ flex:1; overflow:auto; padding:10px 12px; font-size:clamp(14px, 2.5vw, 15px); background:transparent }
  .m-msg{ margin:8px 0; padding:10px 12px; border-radius:16px; max-width:84%; line-height:1.45; word-break:break-word; box-shadow:0 3px 8px rgba(0,0,0,0.08) }
  .m-msg.user{ background:linear-gradient(180deg,var(--accent),#00b6ff); color:#fff; margin-left:auto }
  .m-msg.bot{ background:rgba(255,255,255,.86); color:#0b1220 }
  /* Suggestions: horizontal scroll, snap */
  #motoai-suggestions{
    display:flex; gap:8px; align-items:center; padding:6px 10px; border-top:1px solid rgba(0,0,0,.06);
    background:rgba(255,255,255,.6); backdrop-filter:blur(10px);
    overflow-x:auto; white-space:nowrap; scroll-snap-type:x mandatory; -webkit-overflow-scrolling:touch
  }
  #motoai-suggestions::-webkit-scrollbar{ height:6px }
  #motoai-suggestions button{
    scroll-snap-align:center; flex:0 0 auto; min-width:100px;
    border:none; background:rgba(0,122,255,.08); color:var(--accent);
    padding:6px 10px; border-radius:12px; cursor:pointer; font-weight:500;
    font-size: clamp(13px, 2.5vw, 15px)
  }
  /* Input */
  #motoai-input{ display:flex; gap:8px; padding:8px; border-top:1px solid rgba(0,0,0,.06); background:rgba(255,255,255,.72); backdrop-filter:blur(10px) }
  #motoai-input input{ flex:1; padding:10px; border-radius:12px; border:1px solid rgba(0,0,0,.1); font-size:clamp(14px, 2.5vw, 15px); background:rgba(255,255,255,.7) }
  #motoai-input button{ background:var(--accent); color:#fff; border:none; border-radius:10px; padding:10px 14px; font-weight:600; cursor:pointer; transition:opacity .25s; font-size:clamp(14px, 2.5vw, 15px) }
  #motoai-input button:hover{ opacity:.9 }
  #motoai-clear{ position:absolute; top:10px; right:42px; background:none; border:none; font-size:18px; cursor:pointer; opacity:.85; color:#333; z-index:10000 }
  /* Dark mode */
  @media (prefers-color-scheme: dark){
    #motoai-card{ background:var(--bgGlassDark); color:#eee }
    .m-msg.bot{ background:rgba(30,30,32,.9); color:#eee }
    #motoai-input{ background:rgba(25,25,30,.9) }
    #motoai-suggestions{ background:rgba(25,25,30,.85) }
    #motoai-input input{ background:rgba(40,40,50,.86); color:#eee; border:1px solid rgba(255,255,255,.1) }
    #motoai-clear{ color:#eee }
  }
  /* Tablet: thu nhỏ nhẹ */
  @media (min-width: 768px) and (max-width: 1024px){
    #motoai-card{ height:min(68vh, 560px) }
  }
  /* Landscape mobile: thu nhỏ tổng thể để không che nội dung */
  @media (max-height: 500px){
    #motoai-card{ height:80vh; width:min(720px, 90vw); font-size: 0.95em }
    #motoai-header .m-title{ font-size: clamp(12px, 2vw, 14px) }
  }`;

  function injectUI(){
    if ($('#motoai-root')) return;
    const shell = document.createElement('div'); shell.innerHTML = uiHtml;
    document.body.appendChild(shell.firstElementChild);
    const st = document.createElement('style'); st.textContent = uiCss; document.head.appendChild(st);
    const fix = document.createElement('style');
    fix.textContent = `
      @media(prefers-color-scheme:light){ .m-msg.bot{background:rgba(255,255,255,.96)!important;color:#0b1220!important} }
      @media(prefers-color-scheme:dark){ .m-msg.bot{background:rgba(28,28,30,.94)!important;color:#eee!important} }`;
    document.head.appendChild(fix);
  }
  injectUI();

  // refs
  const bubble = $('#motoai-bubble'), backdrop = $('#motoai-backdrop'), card = $('#motoai-card');
  const bodyEl = $('#motoai-body'), closeBtn = $('#motoai-close'), suggestionsWrap = $('#motoai-suggestions');
  const inputEl = $('#motoai-input-el'), sendBtn = $('#motoai-send'), clearBtn = $('#motoai-clear');
  const phoneLink = $('.m-phone');

  /* ============ State / Storage ============ */
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

  /* ============ Build Corpus (DOM) ============ */
  function tokenizeCorpus(texts){ return texts.map((t,i)=>({id:i,text:t,tokens:tokenize(t)})); }
  function buildCorpusFromDOM(){
    try{
      let nodes = $$('#main, main, article, section');
      if(!nodes.length) nodes = [document.body];
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

  /* ============ Learn: Sitemaps & Internal ============ */
  async function discoverSitemaps(){
    const urls = uniq(CFG.sitemapCandidates.map(u => (u.startsWith('http') ? u : location.origin + u)));
    const found = [];
    for(const u of urls){
      try{
        const r = await fetch(u,{cache:'no-store'});
        if(!r.ok) continue;
        const ct=(r.headers.get('content-type')||'').toLowerCase();
        if(ct.includes('json') || u.endsWith('.json')) found.push(u);
        else { const txt = await r.text(); try{ JSON.parse(txt); found.push(u); }catch(e){} }
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
        if(!extCorpus.includes(l)){ extCorpus.push(l); added++; }
        if(extCorpus.length>=CFG.maxItems) break;
      }
      if(extCorpus.length>=CFG.maxItems) break;
      await sleep(60);
    }
    if(added>0) { saveCorpus(); console.log(`🧠 Learned from sitemap: +${added} lines (ext=${extCorpus.length})`); }
  }
  function collectInternalLinks(){
    const list = $$('a[href]').map(el=>el.getAttribute('href')).filter(Boolean)
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
        if(!extCorpus.includes(l)){ extCorpus.push(l); added++; }
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

  /* ============ Tone (PoliteClean) ============ */
  const PREFIX = ["Chào bạn,","Mình ở đây để hỗ trợ,","Mình sẵn sàng giúp,"];
  const SUFFIX = [" bạn nhé."," cảm ơn bạn."," nếu cần thêm thông tin cứ nói nhé."];
  function makePolite(text){
    const t = (text||'').trim();
    const p = pick(PREFIX), s = pick(SUFFIX);
    if(!t) return "Mình chưa nhận được câu hỏi, bạn thử nhập lại nhé.";
    return /[.!?…]$/.test(t) ? `${p} ${t} ${s}` : `${p} ${t}${s}`;
  }

  /* ============ Rules & Retrieval ============ */
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
    for(const r of RULES){ if(r.pattern.test(q)) return makePolite(pick(r.answers)); }
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

  /* ============ UI behavior & Responsive tweaks ============ */
  function openChat(){
    if(isOpen) return;
    card.classList.add('open'); backdrop.classList.add('show'); $('#motoai-bubble').style.display='none';
    isOpen=true; renderSession(); adjustForViewport();
    setTimeout(()=>{ try{ inputEl.focus(); }catch(e){} }, 240);
  }
  function closeChat(){
    if(!isOpen) return;
    card.classList.remove('open'); backdrop.classList.remove('show'); $('#motoai-bubble').style.display='flex';
    isOpen=false; hideTyping();
  }
  function clearChat(){
    try{ localStorage.removeItem(CFG.sessionKey);}catch(e){}
    bodyEl.innerHTML=''; addMessage('bot', makePolite('đã xóa hội thoại'));
  }

  // suggestions
  const suggestions = [
    {q:'Bảng giá', label:'💰 Bảng giá'},
    {q:'Dịch vụ', label:'⚙️ Dịch vụ'},
    {q:'Sản phẩm', label:'🏍️ Sản phẩm'},
    {q:'Liên hệ', label:'☎️ Liên hệ'}
  ];
  function buildSuggestions(){
    suggestionsWrap.innerHTML = '';
    suggestions.forEach(s=>{
      const b=document.createElement('button'); b.type='button'; b.textContent=s.label; b.dataset.q=s.q;
      b.addEventListener('click',()=>{ if(!isOpen) openChat(); setTimeout(()=> userSend(s.q),100); });
      suggestionsWrap.appendChild(b);
    });
  }
  buildSuggestions();

  // send flow
  async function userSend(text){
    if(sendLock) return;
    sendLock=true; addMessage('user', text); showTyping();
    await sleep(220 + Math.min(500, text.length*6));
    let ans=null; try{ ans = composeAnswer(text); }catch(e){ ans=null; }
    hideTyping();
    addMessage('bot', ans || makePolite('xin lỗi, có lỗi khi trả lời. Bạn thử lại giúp mình'));
    sendLock=false;
  }

  // events
  bubble.addEventListener('click', ()=>{ buildCorpusFromDOM(); openChat(); });
  backdrop.addEventListener('click', closeChat);
  closeBtn.addEventListener('click', closeChat);
  clearBtn.addEventListener('click', clearChat);
  sendBtn.addEventListener('click', ()=>{ const v=(inputEl.value||'').trim(); if(!v) return; inputEl.value=''; userSend(v); });
  inputEl.addEventListener('keydown',(e)=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); const v=(inputEl.value||'').trim(); if(!v) return; inputEl.value=''; userSend(v); }});
  phoneLink?.addEventListener('click', ()=>{ location.href='tel:0857255868'; });

  // responsive/keyboard handling
  function adjustForViewport(){
    try{
      const isLandscape = window.innerWidth > window.innerHeight;
      if(isLandscape){
        card.style.width = 'min(720px, 90vw)';
        card.style.height = '80vh';
      }else{
        card.style.width = 'min(900px, calc(100% - 24px))';
        card.style.height = 'min(70vh, 600px)';
      }
    }catch(e){}
  }
  window.addEventListener('resize', adjustForViewport);
  window.addEventListener('orientationchange', adjustForViewport);

  /* ============ Watchdog ============ */
  setTimeout(()=>{ if(!$('#motoai-bubble')){ console.warn('⚠️ MotoAI bubble missing — reinject UI'); injectUI(); }}, 2000);

  /* ============ Expose API ============ */
  window.MotoAI_v18x = {
    open: openChat,
    close: closeChat,
    composeAnswer,
    learnNow: ()=> scheduleAutoLearn(true),
    getCorpus: ()=>({dom: (corpus||[]).slice(0,200), ext: (extCorpus||[]).slice(0,200)}),
    clearCorpus: ()=>{ corpus=[]; extCorpus=[]; saveCorpus(); console.log('🧹 Cleared corpus'); },
    version: 'v18x-ui98-responsivepro'
  };

  console.log('%c✅ MotoAI v18x ready — window.MotoAI_v18x','color:#0a84ff;font-weight:700');
})();
