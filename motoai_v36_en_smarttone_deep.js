/* motoai_v36_en_smarttone_deep.js
   Messenger UI + SmartContext-Deep (EN) + Auto-avoid
   - Pure English edition for https://rentbikehanoi.com
   - NO Vietnamese fillers, NO link suggestions
   - Typing delay: 3–6s
*/
(function(){
  if (window.MotoAI_v36_EN_LOADED) return;
  window.MotoAI_v36_EN_LOADED = true;

  // ===== Config (EN)
  const DEF = {
    brand: "RentBikeHanoi",
    phone: "+84334699969", // +84 33 469 9969
    zalo:  "",
    map:   "https://maps.app.goo.gl/Rs4BtcK16kju7WeC7?g_st=ipc",
    avatar: "🧑🏻‍💼",
    themeColor: "#0084FF",
    autolearn: true,
    deepContext: true,
    maxContextTurns: 5,
    viOnly: false,           // EN version: allow everything
    extraSites: [location.origin],
    // crawl / cache
    crawlDepth: 1,
    refreshHours: 24,
    maxPagesPerDomain: 60,
    maxTotalPages: 220,
    fetchTimeoutMs: 9000,
    fetchPauseMs: 160,
    // utilities
    disableQuickMap: false
  };
  const ORG = (window.MotoAI_CONFIG||{});
  if(!ORG.zalo && (ORG.phone||DEF.phone)) {
    // make Zalo from phone
    const raw = String(ORG.phone||DEF.phone).replace(/[^\d]/g,'');
    ORG.zalo = 'https://zalo.me/' + raw;
  }
  const CFG = Object.assign({}, DEF, ORG);

  // ===== Utils
  const $ = s => document.querySelector(s);
  const safe = s => { try{ return JSON.parse(s); }catch{ return null; } };
  const sleep = ms => new Promise(r=>setTimeout(r,ms));
  const nowSec = ()=> Math.floor(Date.now()/1000);
  const nfVND = n => (n||0).toLocaleString('vi-VN');
  const clamp = (n,min,max)=> Math.max(min, Math.min(max,n));

  // English naturalizer
  function naturalize(t){
    if(!t) return t;
    let s = ' ' + t + ' ';
    s = s.replace(/\s{2,}/g, ' ').trim();
    if(/[a-zA-Z0-9)]$/.test(s)) s += '.';
    return s.replace(/\.\./g,'.');
  }

  // ===== Storage keys
  const K = {
    sess: 'MotoAI_v36_EN_session',
    ctx:  'MotoAI_v36_EN_ctx',
    learn:'MotoAI_v36_EN_learn'
  };

  // ===== UI (Messenger)
  const css = `
  :root{--mta-z:2147483647;--m-bg:#fff;--m-text:#0b1220;--m-blue:${CFG.themeColor}}
  #mta-root{position:fixed;right:16px;bottom:calc(18px + env(safe-area-inset-bottom,0));
    z-index:var(--mta-z);font-family:-apple-system,system-ui,Segoe UI,Roboto,"Helvetica Neue",Arial}
  #mta-bubble{width:60px;height:60px;border:none;border-radius:50%;background:#fff;display:flex;
    align-items:center;justify-content:center;cursor:pointer;box-shadow:0 10px 26px rgba(0,0,0,.2);outline:3px solid #fff}
  #mta-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.2);opacity:0;pointer-events:none;
    transition:opacity .18s ease}
  #mta-backdrop.show{opacity:1;pointer-events:auto}
  #mta-card{position:fixed;right:16px;bottom:16px;width:min(420px,calc(100% - 24px));height:70vh;max-height:740px;
    background:var(--m-bg);color:var(--m-text);border-radius:18px;box-shadow:0 14px 40px rgba(0,0,0,.25);
    transform:translateY(110%);opacity:.99;display:flex;flex-direction:column;overflow:hidden;
    transition:transform .20s cubic-bezier(.22,1,.36,1)}
  #mta-card.open{transform:translateY(0)}
  #mta-header{background:linear-gradient(90deg,var(--m-blue),#00B2FF);color:#fff}
  #mta-header .brand{display:flex;align-items:center;justify-content:space-between;padding:10px 12px}
  #mta-header .left{display:flex;align-items:center;gap:10px}
  .avatar{width:28px;height:28px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center}
  .info .name{font-weight:800;line-height:1}
  .info .sub{font-size:12px;opacity:.9}
  .quick{display:flex;gap:6px;margin-left:auto;margin-right:6px}
  .q{width:28px;height:28px;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;
    text-decoration:none;font-size:12px;font-weight:700;background:rgba(255,255,255,.15);color:#fff;
    border:1px solid rgba(255,255,255,.25)}
  #mta-close{background:none;border:none;font-size:20px;color:#fff;cursor:pointer;opacity:.95}
  #mta-body{flex:1;overflow:auto;padding:14px 12px;background:#E9EEF5}
  .m-msg{max-width:80%;margin:8px 0;padding:9px 12px;border-radius:18px;line-height:1.45;box-shadow:0 1px 2px rgba(0,0,0,.05);word-break:break-word}
  .m-msg.bot{background:#fff;color:#111;border:1px solid rgba(0,0,0,.04)}
  .m-msg.user{background:#0084FF;color:#fff;margin-left:auto;border:1px solid rgba(0,0,0,.05)}
  #mta-typing{display:inline-flex;gap:6px;align-items:center}
  #mta-typing-dots{display:inline-block;min-width:14px}
  #mta-tags{position:relative;background:#f7f9fc;border-top:1px solid rgba(0,0,0,.06);
    transition:max-height .22s ease, opacity .18s ease}
  #mta-tags.hidden{max-height:0; opacity:0; overflow:hidden;}
  #mta-tags .tag-track{display:block;overflow-x:auto;white-space:nowrap;padding:8px 10px 10px 10px;
    scroll-behavior:smooth}
  #mta-tags button{display:inline-block;margin-right:8px;padding:8px 12px;border:none;border-radius:999px;
    background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.06);border:1px solid rgba(0,0,0,.08);font-weight:700;cursor:pointer}
  #mta-tags button:active{transform:scale(.98)}
  #mta-input{display:flex;gap:8px;padding:10px;background:#fff;border-top:1px solid rgba(0,0,0,.06)}
  #mta-in{flex:1;padding:11px 12px;border-radius:20px;border:1px solid rgba(0,0,0,.12);font-size:15px;background:#F6F8FB}
  #mta-send{width:42px;height:42px;border:none;border-radius:50%;background:linear-gradient(90deg,#0084FF,#00B2FF);
    color:#fff;font-weight:800;cursor:pointer;box-shadow:0 6px 18px rgba(0,132,255,.35)}
  #mta-clear{position:absolute;top:10px;right:48px;background:none;border:none;font-size:16px;color:#fff;opacity:.9;cursor:pointer}
  @media(max-width:520px){
    #mta-card{width:calc(100% - 16px);right:8px;left:8px;height:72vh}
    #mta-bubble{width:56px;height:56px}
  }
  @media(prefers-color-scheme:dark){
    :root{--m-bg:#1b1c1f;--m-text:#eaeef3}
    #mta-body{background:#1f2127}
    .m-msg.bot{background:#2a2d34;color:#eaeef3;border:1px solid rgba(255,255,255,.06)}
    #mta-in{background:#16181c;color:#f0f3f7;border:1px solid rgba(255,255,255,.12)}
    #mta-tags{background:#1f2127;border-top:1px solid rgba(255,255,255,.08)}
    #mta-tags button{background:#2a2d34;color:#eaeef3;border:1px solid rgba(255,255,255,.10)}
  }
  .ai-night #mta-bubble{box-shadow:0 0 18px rgba(0,132,255,.35)!important;}
  `;
  const ui = `
  <div id="mta-root" aria-live="polite">
    <button id="mta-bubble" aria-label="Open chat" title="Chat">
      <svg viewBox="0 0 64 64" width="28" height="28" aria-hidden="true">
        <defs><linearGradient id="mtaG" x1="0" x2="1">
          <stop offset="0%" stop-color="${CFG.themeColor}"/><stop offset="100%" stop-color="#00B2FF"/>
        </linearGradient></defs>
        <circle cx="32" cy="32" r="28" fill="url(#mtaG)"></circle>
        <path d="M20 36l9-11 6 6 9-9-9 14-6-6-9 6z" fill="#fff"></path>
      </svg>
    </button>
    <div id="mta-backdrop"></div>
    <section id="mta-card" role="dialog" aria-label="MotoAI Chat" aria-hidden="true">
      <header id="mta-header">
        <div class="brand">
          <div class="left">
            <span class="avatar">${CFG.avatar||"🧑🏻‍💼"}</span>
            <div class="info">
              <div class="name">${CFG.brand} assistant</div>
              <div class="sub">Online support</div>
            </div>
          </div>
          <nav class="quick">
            ${CFG.phone?`<a class="q q-phone" href="tel:${CFG.phone}" title="Call us">📞</a>`:''}
            ${CFG.zalo?`<a class="q q-zalo"  href="${CFG.zalo}" target="_blank" rel="noopener" title="Zalo">Z</a>`:''}
            ${CFG.map?`<a class="q q-map"   href="${CFG.map}" target="_blank" rel="noopener" title="Map">📍</a>`:''}
          </nav>
          <button id="mta-close" title="Close" aria-label="Close">✕</button>
        </div>
      </header>
      <main id="mta-body" role="log"></main>
      <div id="mta-tags" role="toolbar" aria-label="Quick suggestions">
        <div class="tag-track" id="tagTrack">
          <button data-q="Motorbike rental in Hanoi">🏍️ Motorbike rental</button>
          <button data-q="Scooter rental">🛵 Scooter rental</button>
          <button data-q="Electric bike">⚡ Electric bike</button>
          <button data-q="50cc bike">🚲 50cc</button>
          <button data-q="Manual / clutch bike">🏍️ Manual bike</button>
          <button data-q="Rental requirements">📄 Requirements</button>
          <button data-q="Price list">💰 Price list</button>
          <button data-q="Contact">☎️ Contact</button>
        </div>
      </div>
      <footer id="mta-input">
        <input id="mta-in" placeholder="Type your message..." autocomplete="off" />
        <button id="mta-send" aria-label="Send">➤</button>
      </footer>
      <button id="mta-clear" title="Clear chat" aria-label="Clear chat">🗑</button>
    </section>
  </div>`;

  function injectUI(){
    if ($('#mta-root')) return;
    const wrap = document.createElement('div');
    wrap.innerHTML = ui;
    document.body.appendChild(wrap.firstElementChild);
    const st = document.createElement('style');
    st.textContent = css;
    document.head.appendChild(st);
  }
  function ready(fn){
    if(document.readyState==="complete"||document.readyState==="interactive"){ fn(); }
    else document.addEventListener("DOMContentLoaded", fn);
  }

  // ===== Session & Deep Context
  function addMsg(role,text){
    if(!text) return;
    const el = document.createElement('div');
    el.className = 'm-msg '+(role==='user'?'user':'bot');
    el.textContent = text;
    const body = $('#mta-body');
    if(!body) return;
    body.appendChild(el);
    body.scrollTop = body.scrollHeight;
    try{
      const arr = safe(localStorage.getItem(K.sess)) || [];
      arr.push({role,text,t:Date.now()});
      localStorage.setItem(K.sess, JSON.stringify(arr.slice(-200)));
    }catch{}
  }
  function renderSess(){
    const body = $('#mta-body'); if(!body) return;
    body.innerHTML = '';
    const arr = safe(localStorage.getItem(K.sess))||[];
    if(arr.length){
      arr.forEach(m=> addMsg(m.role,m.text));
    } else {
      addMsg('bot', naturalize(`Hi 👋 I'm the assistant from ${CFG.brand}. Do you want a manual bike, a scooter, or an electric bike?`));
    }
  }
  function pushContext(delta){
    try{
      const ctx = safe(localStorage.getItem(K.ctx)) || { turns:[] };
      ctx.turns.push(Object.assign({t:Date.now()}, delta||{}));
      ctx.turns = ctx.turns.slice(-clamp(CFG.maxContextTurns,3,8));
      localStorage.setItem(K.ctx, JSON.stringify(ctx));
    }catch{}
  }
  function readContext(){
    return safe(localStorage.getItem(K.ctx)) || { turns:[] };
  }

  // ===== Entity extractors (EN)
  const TYPE_MAP = [
    {k:'manual bike',   re:/manual bike|semi auto|wave|blade|sirius|manual/i, canon:'manual bike'},
    {k:'scooter',       re:/scooter|vision|air\s*blade|honda lead|attila|scoopy/i, canon:'scooter'},
    {k:'electric bike', re:/electric bike|e-bike|vinfast|yadea|dibao|escooter/i, canon:'electric bike'},
    {k:'50cc',          re:/50\s*cc|50cc\b/i, canon:'50cc'},
    {k:'clutch bike',   re:/clutch|côn tay|manual clutch/i, canon:'clutch bike'}
  ];
  function detectType(t){
    for(const it of TYPE_MAP){ if(it.re.test(t)) return it.canon; }
    return null;
  }
  function detectQty(raw){
    const m = raw.match(/(\d+)\s*(day|days|week|weeks|month|months)/i);
    if(!m) return null;
    const n = parseInt(m[1],10); if(!n||n<=0) return null;
    let unit='day';
    if(/week/i.test(m[2])) unit='week';
    else if(/month/i.test(m[2])) unit='month';
    return {n,unit};
  }
  function detectIntent(t){
    return {
      needPrice: /(price|cost|how much|rent|rental)/i.test(t),
      needDocs: /(requirement|document|deposit|id card|passport)/i.test(t),
      needContact: /(contact|call|whatsapp|zalo|phone|hotline)/i.test(t)
    };
  }

  // ===== SmartCalc (same logic, English wording)
  const PRICE_TABLE = {
    'manual bike': { day:[130000,150000], week:[600000], month:[1000000,1200000] },
    'scooter':     { day:[200000], week:[900000], month:[2000000] },
    'electric bike':{ day:[200000], week:[800000], month:[1500000] },
    '50cc':        { day:[180000], week:[800000], month:[1800000] },
    'clutch bike': { day:[350000], week:[1200000], month:[2500000] }
  };
  function formatRange(arr){
    if(!arr||!arr.length) return null;
    return arr.length===1 ? nfVND(arr[0])+'₫' : nfVND(arr[0])+'₫–'+nfVND(arr[1])+'₫';
  }
  function summariseType(type){
    const it=PRICE_TABLE[type]; if(!it) return '';
    const d=formatRange(it.day), w=formatRange(it.week), m=formatRange(it.month);
    const bits=[]; if(d) bits.push(d+'/day'); if(w) bits.push(w+'/week'); if(m) bits.push(m+'/month');
    return bits.join(', ');
  }
  function baseFor(type,unit){
    const it=PRICE_TABLE[type]; if(!it) return null;
    const key = unit==='week'?'week':(unit==='month'?'month':'day');
    const arr=it[key]; if(!arr) return null; return arr[0];
  }

  // ===== English answer composer
  const PREFIX = [
    "Hi there,",
    "Hello 👋,",
    "Nice to meet you,",
    "Thanks for reaching out,"
  ];
  const SUFFIX = [
    ".",
    ". Let me know if you need delivery.",
    ". I can also help you choose the right model."
  ];
  const pick = a => a[Math.floor(Math.random()*a.length)];
  function polite(s){
    s=(s||"").trim();
    if(!s) s="I didn't catch that, could you ask again?";
    return naturalize(`${pick(PREFIX)} ${s}${pick(SUFFIX)}`);
  }

  function composePrice(type, qty){
    if(!type) type = 'manual bike';
    if(!qty){
      return polite(`the price for ${type} is around ${summariseType(type)}. How many days do you plan to rent?`);
    }
    const base = baseFor(type, qty.unit);
    if(!base){
      return polite(`the price for ${type} with ${qty.unit} rental is not fixed. Please contact us via ${CFG.phone} for an exact quote.`);
    }
    const total = base * qty.n;
    const label = qty.unit==='day'?(qty.n===1?'1 day':`${qty.n} days`):qty.unit==='week'?`${qty.n} week(s)`:`${qty.n} month(s)`;
    return polite(`renting a ${type} for ${label} is about ${nfVND(total)}₫. Do you want to book or see delivery options?`);
  }

  function deepAnswer(userText){
    const q = (userText||'').trim();
    const lower = q.toLowerCase();

    const it = detectIntent(lower);
    let type = detectType(lower);
    const qty  = detectQty(lower);

    // reuse context
    if(CFG.deepContext){
      const ctx = readContext();
      for(let i=ctx.turns.length-1; i>=0; i--){
        const t = ctx.turns[i];
        if(!type && t.type) type = t.type;
        if(!qty && t.qty)   return composePrice(type||t.type, t.qty);
        if(type && qty) break;
      }
    }

    if(it.needContact){
      return polite(`you can call us at ${CFG.phone} or chat via Zalo ${CFG.zalo}. We reply fast.`);
    }
    if(it.needDocs){
      return polite(`to rent a bike, we usually need your passport or ID card and a small deposit. Delivery in Hanoi is possible.`);
    }
    if(it.needPrice){
      return composePrice(type, qty);
    }

    if(/(hi|hello|hey|good morning|good afternoon)/i.test(lower)){
      return polite(`I'm ${CFG.brand} assistant. Are you looking for manual bike, scooter, or electric bike?`);
    }

    return polite(`tell me the bike type (manual, scooter, electric, 50cc) and how many days you want to rent, so I can estimate the price.`);
  }

  // ===== AutoLearn (same as VN, just no vi-only filter)
  async function fetchText(url){
    const controller = new AbortController();
    const id = setTimeout(()=>controller.abort(), CFG.fetchTimeoutMs);
    try{
      const res = await fetch(url, {mode:'cors', credentials:'omit', signal: controller.signal});
      clearTimeout(id);
      if(!res.ok) throw new Error('status:'+res.status);
      return await res.text();
    }catch(e){ clearTimeout(id); return null; }
  }
  function parseXML(text){ try{ return (new DOMParser()).parseFromString(text,'text/xml'); }catch{ return null; } }
  function parseHTML(text){ try{ return (new DOMParser()).parseFromString(text,'text/html'); }catch{ return null; } }

  async function readSitemap(url){
    const xmlTxt = await fetchText(url); if(!xmlTxt) return [];
    const doc = parseXML(xmlTxt); if(!doc) return [];
    // RSS?
    const items = Array.from(doc.getElementsByTagName('item'));
    if(items.length){
      return items.map(it=> (it.getElementsByTagName('link')[0]?.textContent||'').trim()).filter(Boolean);
    }
    // sitemap index
    const sitemaps = Array.from(doc.getElementsByTagName('sitemap'))
      .map(x=> x.getElementsByTagName('loc')?.[0]?.textContent?.trim()).filter(Boolean);
    if(sitemaps.length){
      const all = [];
      for(const loc of sitemaps){
        try{ const child = await readSitemap(loc); if(child && child.length) all.push(...child); }catch{}
      }
      return Array.from(new Set(all));
    }
    // normal sitemap
    const urls = Array.from(doc.getElementsByTagName('url'))
      .map(u=> u.getElementsByTagName('loc')?.[0]?.textContent?.trim()).filter(Boolean);
    return urls;
  }
  function sameHost(u, origin){ try{ return new URL(u, origin).host === new URL(origin).host; }catch{ return false; } }
  async function fallbackCrawl(origin){
    const start = origin.endsWith('/')? origin : origin + '/';
    const html = await fetchText(start); if(!html) return [start];
    const doc = parseHTML(html); if(!doc) return [start];
    const anchors = Array.from(doc.querySelectorAll('a[href]')).map(a=> a.getAttribute('href')).filter(Boolean);
    const canon = new Set();
    for(const href of anchors){
      let u; try{ u = new URL(href, start).toString(); }catch{ continue; }
      if(sameHost(u, start)) canon.add(u.split('#')[0]);
      if(canon.size >= 40) break;
    }
    return [start, ...Array.from(canon)];
  }
  async function pullPages(list){
    const pages = [];
    for(const url of list.slice(0, CFG.maxPagesPerDomain)){
      const txt = await fetchText(url); if(!txt) continue;
      let title = (txt.match(/<title[^>]*>([^<]+)<\/title>/i) || [])[1] || '';
      title = title.replace(/\s+/g,' ').trim();
      let desc = (txt.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"]+)["']/i) || [])[1] || '';
      if(!desc){
        const bodyTxt = txt.replace(/<script[\s\S]*?<\/script>/gi,' ')
                           .replace(/<style[\s\S]*?<\/style>/gi,' ')
                           .replace(/<[^>]+>/g,' ')
                           .replace(/\s+/g,' ')
                           .trim();
        desc = bodyTxt.slice(0, 600);
      }
      pages.push({url, title, text: desc});
      if(pages.length >= CFG.maxPagesPerDomain) break;
      await sleep(CFG.fetchPauseMs);
    }
    return pages;
  }
  async function learnOne(input){
    try{
      const isFeed = /\.xml($|\?)/i.test(input) || /\/feeds?\//i.test(input);
      if(isFeed){
        const urls = await readSitemap(input);
        const pages = await pullPages(urls);
        return {domain: input, ts: nowSec(), pages};
      }
      const origin = input.endsWith('/')? input : input + '/';
      const candidates = [origin + 'sitemap.xml', origin + 'sitemap_index.xml'];
      let urls = [];
      for(const c of candidates){
        try{
          const got = await readSitemap(c);
          if(got && got.length){ urls = got; break; }
        }catch{}
      }
      if(!urls.length) urls = await fallbackCrawl(origin);
      const uniq = Array.from(new Set(urls.map(u=>{ try{ return new URL(u).toString().split('#')[0]; }catch{ return null; } }).filter(Boolean)));
      const pages = await pullPages(uniq);
      return {domain: input, ts: nowSec(), pages};
    }catch(e){ return null; }
  }
  function loadLearn(){ return safe(localStorage.getItem(K.learn)) || {}; }
  function saveLearn(obj){ try{ localStorage.setItem(K.learn, JSON.stringify(obj)); }catch{} }
  function expired(ts, hrs){ if(!ts) return true; return ((nowSec()-ts)/3600) >= (hrs||CFG.refreshHours); }

  async function learnSites(listInputs, force=false){
    if(!Array.isArray(listInputs)) listInputs = [];
    const cache = loadLearn(); const results = {}; let total = 0;
    const inputs = Array.from(new Set(listInputs)).slice(0, 10);
    for(const inp of inputs){
      try{
        const key = inp;
        const cached = cache[key];
        if(!force && cached && !expired(cached.ts, CFG.refreshHours) && Array.isArray(cached.pages) && cached.pages.length){
          results[key] = cached; total += cached.pages.length; if(total>=CFG.maxTotalPages) break; continue;
        }
        const data = await learnOne(key);
        if(data && data.pages?.length){
          cache[key]=data; saveLearn(cache); results[key]=data; total+=data.pages.length;
        }
        if(total>=CFG.maxTotalPages) break;
      }catch{}
    }
    saveLearn(cache); return results;
  }

  // ===== Send & Typing
  let isOpen=false, sending=false, typingBlinkTimer=null;
  function showTyping(){
    const d=document.createElement('div'); d.id='mta-typing'; d.className='m-msg bot'; d.textContent='Typing ';
    const dot=document.createElement('span'); dot.id='mta-typing-dots'; dot.textContent='...';
    d.appendChild(dot);
    const body=$('#mta-body'); if(!body) return;
    body.appendChild(d); body.scrollTop = body.scrollHeight;
    let i=0;
    typingBlinkTimer=setInterval(()=>{ dot.textContent='.'.repeat((i++%3)+1); }, 420);
  }
  function hideTyping(){
    const d=$('#mta-typing'); if(d) d.remove();
    if(typingBlinkTimer){ clearInterval(typingBlinkTimer); typingBlinkTimer=null; }
  }

  function openChat(){
    if(isOpen) return;
    $('#mta-card').classList.add('open');
    $('#mta-backdrop').classList.add('show');
    $('#mta-bubble').style.display='none';
    isOpen=true;
    renderSess();
    setTimeout(()=>{ try{$('#mta-in').focus();}catch{} }, 140);
  }
  function closeChat(){
    if(!isOpen) return;
    $('#mta-card').classList.remove('open');
    $('#mta-backdrop').classList.remove('show');
    $('#mta-bubble').style.display='flex';
    isOpen=false;
    hideTyping();
  }
  function clearChat(){
    try{ localStorage.removeItem(K.sess); localStorage.removeItem(K.ctx); }catch{};
    $('#mta-body').innerHTML='';
    addMsg('bot', naturalize('Chat cleared. I am ready to help you again.'));
  }

  async function sendUser(text){
    if(sending) return; sending=true;
    const userText = (text||'').trim(); if(!userText) { sending=false; return; }
    addMsg('user', userText);
    pushContext({from:'user', raw:userText, type: detectType(userText), qty: detectQty(userText)});
    showTyping();
    const typingDelay = 3000 + Math.random()*3000;
    await sleep(typingDelay);
    let ans = deepAnswer(userText);
    hideTyping();
    addMsg('bot', naturalize(ans));
    pushContext({from:'bot', raw:ans});
    sending=false;
  }

  // ===== Auto-avoid
  function checkObstacles(){
    const root = $('#mta-root'); if(!root) return;
    const blockers = document.querySelector('.bottom-appbar, .quick-call, #quick-call');
    let bottom = 'calc(18px + env(safe-area-inset-bottom, 0))';
    if(blockers){
      const r = blockers.getBoundingClientRect();
      const space = window.innerHeight - r.top;
      if(space < 120) bottom = (space + 70) + 'px';
    }
    if(window.visualViewport){
      const vv = window.visualViewport;
      if(vv.height < window.innerHeight - 120) bottom = '110px';
    }
    root.style.bottom = bottom; root.style.right = '16px'; root.style.left = 'auto';
  }

  function bindTags(){
    const track = document.getElementById('tagTrack');
    const box = document.getElementById('mta-tags');
    if(!track||!box) return;
    track.querySelectorAll('button').forEach(b=>{
      b.addEventListener('click', ()=> sendUser(b.dataset.q));
    });
    const input = document.getElementById('mta-in');
    if(input){
      input.addEventListener('focus', ()=> box.classList.add('hidden'));
      input.addEventListener('blur',  ()=> { if(!input.value.trim()) box.classList.remove('hidden'); });
      input.addEventListener('input', ()=> { if(input.value.trim().length>0) box.classList.add('hidden'); else box.classList.remove('hidden'); });
    }
  }

  function maybeDisableQuickMap(){
    try{
      const sel = document.querySelector('#mta-header .q-map, .q-map, a.q-map');
      if(!sel) return;
      const href = sel.getAttribute && sel.getAttribute('href') || '';
      const isLocal = !/^https?:\/\//i.test(href) || (href && href.indexOf(location.hostname) >= 0);
      if(CFG.disableQuickMap || isLocal){
        sel.removeAttribute('href');
        sel.setAttribute('aria-disabled','true');
        sel.style.opacity='0.45';
        sel.style.pointerEvents='none';
        sel.title = (sel.title||'') + ' (map disabled)';
      }
    }catch(e){}
  }

  ready(async ()=>{
    const hour=new Date().getHours();
    if(hour>19||hour<6) document.body.classList.add('ai-night');
    injectUI(); bindTags(); checkObstacles();

    // events
    $('#mta-bubble').addEventListener('click', openChat);
    $('#mta-backdrop').addEventListener('click', closeChat);
    $('#mta-close').addEventListener('click', closeChat);
    $('#mta-clear').addEventListener('click', clearChat);
    $('#mta-send').addEventListener('click', ()=>{
      const v=($('#mta-in').value||'').trim(); if(!v) return;
      $('#mta-in').value=''; sendUser(v);
    });
    $('#mta-in').addEventListener('keydown',(e)=>{
      if(e.key==='Enter' && !e.shiftKey){
        e.preventDefault();
        const v=($('#mta-in').value||'').trim(); if(!v) return;
        $('#mta-in').value=''; sendUser(v);
      }
    });
    window.addEventListener('resize', checkObstacles, {passive:true});
    window.addEventListener('scroll', checkObstacles, {passive:true});
    if(window.visualViewport) window.visualViewport.addEventListener('resize', checkObstacles, {passive:true});

    // watch new elements
    const mo = new MutationObserver(()=>{ maybeDisableQuickMap(); });
    mo.observe(document.body, {childList:true, subtree:true});
    setTimeout(maybeDisableQuickMap, 400);

    console.log('%cMotoAI v36 EN SmartTone-Deep — Ready','color:'+CFG.themeColor+';font-weight:bold;');

    if(CFG.autolearn){
      const inputs = Array.from(new Set([...(CFG.extraSites||[])]));
      try{
        (async()=>{
          await learnSites(inputs, false);
          console.log('MotoAI v36 EN autolearn: done');
        })();
      }catch(e){
        console.warn('MotoAI v36 EN autolearn err', e);
      }
    }
  });

  // ===== Public API
  window.MotoAI_v36_EN = {
    open: ()=>{ try{ openChat(); }catch{} },
    close: ()=>{ try{ closeChat(); }catch{} },
    learnNow: async (sites, force)=>{ 
      try{ 
        const list = Array.isArray(sites)&&sites.length?sites:(CFG.extraSites||[]); 
        return await learnSites(Array.from(new Set(list)), !!force); 
      }catch(e){ return null; } 
    },
    getIndex: ()=> {
      const cache = safe(localStorage.getItem(K.learn)) || {};
      const out=[];
      Object.keys(cache).forEach(key=>{
        (cache[key]?.pages||[]).forEach(pg=> out.push(Object.assign({source:key}, pg)));
      });
      return out;
    },
    clearLearnCache: ()=> { try{ localStorage.removeItem(K.learn); }catch{} }
  };
})();
