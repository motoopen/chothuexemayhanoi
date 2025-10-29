/* motoai_v32_messenger_smart.js
   MotoAI v32 — Messenger UI (v22c -> messenger look) + Smart Local Composer
   Safe: does NOT modify clearChat / trash button. Optionally disables quick map.
   Paste as a standalone file and include after window.MotoAI_CONFIG if you set it.
*/
(function(){
  if(window.MotoAI_v32_LOADED) return;
  window.MotoAI_v32_LOADED = true;

  // ====== Default config (override with window.MotoAI_CONFIG before loading)
  const DEF = {
    brand: "Motoopen",
    phone: "0857255868",
    zalo:  "https://zalo.me/0857255868",
    map:   "https://maps.app.goo.gl/2icTBTxAToyvKTE78",
    autolearn: true,
    extraSites: [
      "https://motoopen.github.io/chothuexemayhanoi/",
      "https://thuexemaynguyentu.com",
      "https://rentbikehanoi.com"
    ],
    crawlDepth: 1,
    refreshHours: 24,
    minSentenceLen: 24,
    maxPagesPerDomain: 80,
    maxTotalPages: 300,
    fetchTimeoutMs: 10000,
    fetchPauseMs: 200,
    disableQuickMap: false, // set true to force hide map quick link
    forceVietnamese: true, // prefer VN content (we assume sites are VN)
    debugSmart: false
  };
  const ORG = (window.MotoAI_CONFIG||{});
  const CFG = Object.assign({}, DEF, ORG);
  if(!ORG.zalo && (ORG.phone||DEF.phone)) ORG.zalo = 'https://zalo.me/' + String(ORG.phone||DEF.phone).replace(/\s+/g,'');

  // ====== Small utility
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const safe = s => { try{ return JSON.parse(s); }catch(e){ return null; } };
  const sleep = ms => new Promise(r=>setTimeout(r, ms));
  const pick = a => a[Math.floor(Math.random()*a.length)];
  const nfVND = n => (n||0).toLocaleString('vi-VN');
  const nowSec = ()=> Math.floor(Date.now()/1000);

  // ====== Storage keys
  const K = { sess: 'MotoAI_v32_session', ctx:'MotoAI_v32_ctx', learn:'MotoAI_v32_learn' };

  // ====== UI markup (Messenger-like)
  const ui = `
  <div id="mta32-root" aria-live="polite">
    <button id="mta32-bubble" aria-label="Mở chat" title="Chat">
      <svg viewBox="0 0 64 64" width="28" height="28" aria-hidden="true">
        <defs><linearGradient id="mta32G" x1="0" x2="1"><stop offset="0%" stop-color="#0084FF"/><stop offset="100%" stop-color="#00B2FF"/></linearGradient></defs>
        <circle cx="32" cy="32" r="28" fill="url(#mta32G)"></circle>
        <path d="M20 36l9-11 6 6 9-9-9 14-6-6-9 6z" fill="#fff"></path>
      </svg>
    </button>
    <div id="mta32-backdrop"></div>
    <section id="mta32-card" role="dialog" aria-label="Chat MotoAI" aria-hidden="true">
      <header id="mta32-header">
        <div class="brand">
          <div class="left">
            <div class="avatar">🤖</div>
            <div class="info">
              <div class="name">Nhân viên ${CFG.brand}</div>
              <div class="sub">Hỗ trợ trực tuyến</div>
            </div>
          </div>
          <nav class="quick">
            <a class="q q-phone" href="tel:${CFG.phone}" title="Gọi">📞</a>
            <a class="q q-zalo"  href="${CFG.zalo}" target="_blank" rel="noopener" title="Zalo">Z</a>
            <a class="q q-map"   href="${CFG.map}" target="_blank" rel="noopener" title="Bản đồ">📍</a>
          </nav>
          <button id="mta32-close" title="Đóng" aria-label="Đóng">✕</button>
        </div>
      </header>

      <main id="mta32-body" role="log" aria-live="polite"></main>

      <div id="mta32-tags" role="toolbar" aria-label="Gợi ý nhanh">
        <div class="tag-track" id="mta32-tagTrack">
          <button data-q="Xe số">🏍️ Xe số</button>
          <button data-q="Xe ga">🛵 Xe ga</button>
          <button data-q="Xe điện">⚡ Xe điện</button>
          <button data-q="50cc">🚲 50cc</button>
          <button data-q="Thủ tục">📄 Thủ tục</button>
          <button data-q="Bảng giá">💰 Bảng giá</button>
          <button data-q="Liên hệ">☎️ Liên hệ</button>
        </div>
      </div>

      <footer id="mta32-input">
        <input id="mta32-in" placeholder="Nhắn tin cho ${CFG.brand}..." autocomplete="off" />
        <button id="mta32-send" aria-label="Gửi">➤</button>
      </footer>
      <button id="mta32-clear" title="Xóa hội thoại" aria-label="Xóa hội thoại">🗑</button>
    </section>
  </div>`;

  // ====== CSS (messenger-like)
  const css = `:root{--mta32-z:2147483647;--m-blue:#0084FF;--m-blue2:#00B2FF;--m-bg:#fff;--m-text:#0b1220}
  #mta32-root{position:fixed;right:16px;bottom:calc(18px + env(safe-area-inset-bottom,0));z-index:var(--mta32-z);font-family:-apple-system,system-ui,Segoe UI,Roboto,"Helvetica Neue",Arial;transition:bottom .25s ease,right .25s ease}
  #mta32-bubble{width:60px;height:60px;border:none;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 10px 26px rgba(0,0,0,.2);outline:3px solid #fff}
  #mta32-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.18);opacity:0;pointer-events:none;transition:opacity .18s ease}
  #mta32-backdrop.show{opacity:1;pointer-events:auto}
  #mta32-card{position:fixed;right:16px;bottom:16px;width:min(420px,calc(100% - 24px));height:70vh;max-height:740px;background:var(--m-bg);color:var(--m-text);border-radius:18px;box-shadow:0 14px 40px rgba(0,0,0,.25);transform:translateY(110%);opacity:.99;display:flex;flex-direction:column;overflow:hidden;transition:transform .20s cubic-bezier(.22,1,.36,1)}
  #mta32-card.open{transform:translateY(0)}
  #mta32-header{background:linear-gradient(90deg,var(--m-blue),var(--m-blue2));color:#fff}
  #mta32-header .brand{display:flex;align-items:center;justify-content:space-between;padding:10px 12px}
  #mta32-header .left{display:flex;align-items:center;gap:10px}
  .avatar{width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,.18);display:flex;align-items:center;justify-content:center;font-size:18px}
  .info .name{font-weight:800;line-height:1}
  .info .sub{font-size:12px;opacity:.95}
  .quick{display:flex;gap:6px;margin-left:auto;margin-right:6px}
  .q{width:34px;height:34px;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;text-decoration:none;font-size:12px;font-weight:700;background:rgba(255,255,255,.15);color:#fff;border:1px solid rgba(255,255,255,.18)}
  #mta32-close{background:none;border:none;font-size:20px;color:#fff;cursor:pointer;opacity:.95}
  #mta32-body{flex:1;overflow:auto;padding:14px 12px;background:#F0F2F5}
  .m32-msg{max-width:80%;margin:8px 0;padding:10px 12px;border-radius:16px;line-height:1.45;box-shadow:0 1px 2px rgba(0,0,0,.04);word-break:break-word}
  .m32-msg.bot{background:#fff;color:#111;border:1px solid rgba(0,0,0,.04)}
  .m32-msg.user{background:linear-gradient(90deg,var(--m-blue),var(--m-blue2));color:#fff;margin-left:auto;border:1px solid rgba(0,0,0,.03)}
  #mta32-tags{position:relative;background:transparent;border-top:1px solid rgba(0,0,0,0);padding:6px 10px}
  .tag-track{display:block;overflow-x:auto;white-space:nowrap;padding:4px 0;scroll-behavior:smooth}
  #mta32-tags button{display:inline-block;margin-right:8px;padding:8px 12px;border:none;border-radius:999px;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.06);border:1px solid rgba(0,0,0,.06);font-weight:700;cursor:pointer}
  #mta32-input{display:flex;gap:8px;padding:10px;background:#fff;border-top:1px solid rgba(0,0,0,.06)}
  #mta32-in{flex:1;padding:11px 12px;border-radius:20px;border:1px solid rgba(0,0,0,.12);font-size:15px;background:#F6F8FB}
  #mta32-send{width:44px;height:44px;border:none;border-radius:50%;background:linear-gradient(90deg,#0084FF,#00B2FF);color:#fff;font-weight:800;cursor:pointer;box-shadow:0 6px 18px rgba(0,132,255,.28)}
  #mta32-clear{position:absolute;top:12px;right:56px;background:none;border:none;font-size:16px;color:#fff;opacity:.92;cursor:pointer}
  @media(max-width:520px){ #mta32-card{width:calc(100% - 16px);right:8px;left:8px;height:74vh} #mta32-bubble{width:56px;height:56px} }
  @media(prefers-color-scheme:dark){
    :root{--m-bg:#111;--m-text:#eaeef3}
    #mta32-body{background:#0f1113}
    .m32-msg.bot{background:#18191b;color:#eaeef3}
    #mta32-in{background:#101214;color:#eaeef3;border:1px solid rgba(255,255,255,.06)}
    #mta32-tags button{background:#1f2124;color:#eaeef3;border:1px solid rgba(255,255,255,.06)}
  }`;

  // ====== Inject UI
  function injectUI(){
    if($('#mta32-root')) return;
    const wrap = document.createElement('div'); wrap.innerHTML = ui; document.body.appendChild(wrap.firstElementChild);
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  }

  // ====== Basic bot session
  function addMsg(role, text){
    if(!text) return;
    const body = $('#mta32-body'); if(!body) return;
    const el = document.createElement('div'); el.className = 'm32-msg ' + (role==='user'?'user':'bot'); el.textContent = text;
    body.appendChild(el); body.scrollTop = body.scrollHeight;
    try{ const arr = safe(localStorage.getItem(K.sess)) || []; arr.push({role,text,t:Date.now()}); localStorage.setItem(K.sess, JSON.stringify(arr.slice(-200))); }catch(e){}
  }
  function renderSess(){
    const body = $('#mta32-body'); if(!body) return;
    body.innerHTML = '';
    const arr = safe(localStorage.getItem(K.sess))||[];
    if(arr.length) arr.forEach(m=> addMsg(m.role,m.text));
    else addMsg('bot', `Xin chào 👋, em là nhân viên hỗ trợ của ${CFG.brand}. Anh/chị cần xem Xe số/ Xe ga/ Xe điện/ Thủ tục hay Bảng giá ạ?`);
  }

  // ====== Typing
  let typingTimer = null;
  function showTyping(){
    const body = $('#mta32-body'); if(!body) return;
    const d = document.createElement('div'); d.id='mta32-typing'; d.className='m32-msg bot'; d.textContent='Đang nhập…';
    body.appendChild(d); body.scrollTop = body.scrollHeight;
    typingTimer = setInterval(()=>{ try{ const el = document.getElementById('mta32-typing'); if(!el) return; el.textContent = 'Đang nhập' + '.'.repeat(((Date.now()/400|0)%3)+1); }catch(e){} }, 450);
  }
  function hideTyping(){ if(typingTimer) clearInterval(typingTimer); const el = document.getElementById('mta32-typing'); if(el) el.remove(); typingTimer = null; }

  // ====== Simple price table and helpers (kept)
  const PRICE_TABLE = {
    'xe số':      { day:[130000,150000], week:[600000], month:[1000000,1200000] },
    'air blade':  { day:[200000], week:[800000], month:[1400000] },
    'vision':     { day:[200000], week:[900000], month:[2000000] },
    'xe điện':    { day:[200000], week:[800000], month:[1500000] },
    '50cc':       { day:[200000], week:[800000], month:[1800000] },
    'xe côn tay': { day:[350000], week:[1200000], month:[2500000] },
    'xe giá rẻ':  { day:[100000], week:[500000], month:[900000] }
  };
  const CHEAP_KWS = /(rẻ|giá rẻ|rẻ nhất|bình dân|sinh viên|hssv|xe rẻ)/i;
  function detectType(t){
    const low = t.toLowerCase();
    if(CHEAP_KWS.test(low)) return 'xe giá rẻ';
    if(/air\s*blade|airblade|ab\b/.test(low)) return 'air blade';
    if(/\bvision\b/.test(low)) return 'vision';
    if(/côn tay|tay côn/.test(low)) return 'xe côn tay';
    if(/xe điện|vinfast|yadea|dibao|gogo/.test(low)) return 'xe điện';
    if(/50cc|xe 50/.test(low)) return '50cc';
    if(/xe ga/.test(low)) return 'vision';
    if(/xe số|wave|blade|sirius|jupiter/.test(low)) return 'xe số';
    return null;
  }
  function detectSpan(t){ const low=t.toLowerCase(); if(/tuần|tuan|week/.test(low)) return 'week'; if(/tháng|thang|month/.test(low)) return 'month'; return 'day'; }
  function detectQty(t){ const m=t.match(/(\d+)\s*(ngày|day|tuần|tuan|week|tháng|thang|month)?/i); if(!m) return null; const n=parseInt(m[1],10); if(!n||n<=0) return null; let unit='day'; if(m[2]) unit=detectSpan(m[2]); return {n,unit}; }
  function formatRange(arr){ if(!arr||!arr.length) return null; return arr.length===1? nfVND(arr[0])+'đ' : nfVND(arr[0])+'–'+nfVND(arr[1])+'đ'; }
  function baseFor(type,unit){ const it=PRICE_TABLE[type]; if(!it) return null; const arr=it[unit]; if(!arr) return null; return arr[0]; }
  function summariseType(type){ const it=PRICE_TABLE[type]; if(!it) return ''; const d=formatRange(it.day), w=formatRange(it.week), m=formatRange(it.month); const bits=[]; if(d) bits.push(d+'/ngày'); if(w) bits.push(w+'/tuần'); if(m) bits.push(m+'/tháng'); return bits.join(', '); }
  function estimatePrice(text){
    let type = detectType(text) || 'xe số';
    const qty = detectQty(text);
    if(!qty) return `Giá ${type} khoảng ${summariseType(type)}. Anh/chị có thể liên hệ Zalo ${CFG.phone} để xem xe và nhận giá chính xác nhất ạ.`;
    const unit=qty.unit, n=qty.n, base=baseFor(type,unit);
    if(!base) return `Giá theo ${unit} của ${type} hiện chưa có trong bảng. Anh/chị liên hệ Zalo ${CFG.phone} để báo giá chính xác giúp em nhé.`;
    const total=base*n, label=unit==='day'?`${n} ngày`:unit==='week'?`${n} tuần`:`${n} tháng`;
    return `Giá dự kiến thuê ${type} ${label} khoảng ${nfVND(total)}đ ạ (ước tính). Anh/chị có thể liên hệ Zalo ${CFG.phone} để xem xe và nhận giá chính xác nhất ạ.`;
  }

  // ====== Compose helpers (normalize + synonyms)
  const SYNONYMS = {
    'xe ga': ['vision','lead','scooter','xe ga','xe-ga'],
    'xe số': ['wave','sirius','blade','xe số'],
    '50cc': ['50cc','xe 50','50 cc'],
    'thủ tục': ['thu tuc','giấy tờ','giay to','giấy tờ'],
    'bảng giá': ['bảng giá','bang gia','giá','gia']
  };
  function normalizeQuery(q){
    if(!q) return '';
    let s = String(q).toLowerCase().trim();
    s = s.replace(/[“”"'\-\—\_\(\)\[\]\{\};:,!?]/g,' ');
    Object.keys(SYNONYMS).forEach(c=>{
      SYNONYMS[c].forEach(alias=>{
        const re = new RegExp('\\b' + alias.replace(/[-\/\\^$*+?.()|[\]{}]/g,'\\$&') + '\\b','gi');
        s = s.replace(re, c);
      });
    });
    s = s.replace(/\s+/g,' ').trim();
    return s;
  }

  // polite formatting reuse
  const PREFIX = ["Chào anh/chị,","Xin chào 👋,","Em chào anh/chị nhé,","Rất vui được hỗ trợ anh/chị,"];
  const SUFFIX = [" ạ."," nhé ạ."," nha anh/chị."," ạ, cảm ơn anh/chị."];
  function polite(t){ t=(t||"").trim(); if(!t) return "Em chưa nhận được câu hỏi, anh/chị thử nhập lại giúp em nhé."; return `${pick(PREFIX)} ${t}${pick(SUFFIX)}`; }

  // Rule-based small rules
  const RULES = [
    {re:/(^|\s)(chào|xin chào|hello|hi|alo)(\s|$)/i, ans:[
      `em là nhân viên hỗ trợ của ${CFG.brand}. Anh/chị muốn xem 🏍️ Xe số, 🛵 Xe ga, ⚡ Xe điện hay 📄 Thủ tục thuê xe ạ?`,
      "em có thể báo giá nhanh hoặc hướng dẫn thủ tục. Anh/chị đang quan tâm loại xe nào ạ?"
    ]},
    {re:/(thủ tục|thu tuc|giay to|giấy tờ|cọc|đặt cọc)/i, ans:[
      "thủ tục gọn: CCCD/hộ chiếu + cọc tuỳ xe. Có phương án giảm cọc khi đủ giấy tờ.",
      "em có thể gửi danh sách giấy tờ cần và cách nhận/trả xe nhé."
    ]},
    {re:/(liên hệ|lien he|zalo|hotline|sđt|sdt|gọi|goi|dien thoai)/i, ans:[
      `anh/chị liên hệ nhanh qua Zalo ${CFG.phone} để được tư vấn trực tiếp nhé.`,
      `nếu cần gấp, anh/chị gọi ${CFG.phone} — bọn em phản hồi ngay ạ.`
    ]}
  ];
  function rule(q){ for(const r of RULES){ if(r.re.test(q)) return polite(pick(r.ans)); } return null; }

  // ====== Index search (smart, no english heuristics) — TF-lite scoring
  function getIndex(){
    try{
      const cache = safe(localStorage.getItem(K.learn)) || {};
      const out = [];
      Object.keys(cache).forEach(domain=>{
        const p = cache[domain] && cache[domain].pages || [];
        p.forEach(pg => out.push(Object.assign({domain}, pg)));
      });
      return out;
    }catch(e){ return []; }
  }
  function searchIndexEnhanced(q, topN=3){
    try{
      if(!q) return [];
      const nq = normalizeQuery(q);
      const tokens = nq.split(/\s+/).filter(Boolean);
      if(!tokens.length) return [];
      const idx = getIndex();
      const scored = idx.map(it=>{
        const txt = ((it.title||'') + ' ' + (it.text||'')).toLowerCase();
        let score = 0;
        for(const t of tokens){
          const re = new RegExp('\\b' + t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&') + '\\b','gi');
          const m = txt.match(re);
          if(m) score += (1 + Math.min(m.length,3)*0.5);
          if((it.title||'').toLowerCase().includes(t)) score += 1.2;
        }
        // length boost for longer pages
        if((it.text||'').length > 300) score += 0.3;
        return Object.assign({score}, it);
      }).filter(x=> x.score>0).sort((a,b)=> b.score - a.score).slice(0, topN);
      return scored;
    }catch(e){ if(CFG.debugSmart) console.warn('searchIndexEnhanced', e); return []; }
  }

  // Compose enhanced: rules -> index snippet -> estimate price -> polite fallback
  function compose_enhanced(q){
    try{
      const nq = normalizeQuery(q);
      const r = rule(nq); if(r) return r;
      const hits = searchIndexEnhanced(nq, 3);
      if(hits && hits.length){
        const top = hits[0];
        const title = top.title ? top.title.replace(/\s+/g,' ').trim() : '';
        const text = (top.text||'').replace(/\s+/g,' ').trim();
        const snippet = (title ? (title + ' — ') : '') + text.slice(0, 180);
        return polite(`${snippet} ... Xem chi tiết: ${top.url}`);
      }
      if(/(giá|bao nhiêu|tính tiền|bao nhieu|thuê|thue|price|cost)/i.test(q)) return polite(estimatePrice(q));
      return polite("em chưa tìm được thông tin trùng khớp. Anh/chị nói rõ loại xe hoặc thời gian thuê giúp em với ạ.");
    }catch(e){ if(CFG.debugSmart) console.warn('compose_enhanced err', e); return polite('') }
  }

  // ====== sendUser (safe patch — does not remove old handlers if any)
  let sending = false;
  async function sendUser_v32(text){
    if(!text) return;
    if(sending) return;
    sending = true;
    addMsg('user', text);
    try{ updateCtxWithUser && updateCtxWithUser(text); }catch(e){}
    showTyping();
    const typingDelay = 1000 + Math.random()*1800;
    await sleep(typingDelay);
    let ans = null;
    try{ ans = compose_enhanced(text); }catch(e){ ans = null; }
    hideTyping();
    addMsg('bot', ans || polite(''));
    sending = false;
  }

  // ====== Simple ctx updater (store top matches)
  function updateCtxWithUser(q){
    try{
      const hits = searchIndexEnhanced(q, 3) || [];
      const out = hits.map(h=>({url:h.url, title:h.title, text:h.text, score:h.score}));
      try{ localStorage.setItem(K.ctx, JSON.stringify(out)); }catch(e){}
    }catch(e){}
  }

  // ====== Fetch helpers and AutoLearn (same approach as v26, lighter)
  async function fetchText(url, opts={}){
    const controller = new AbortController();
    const id = setTimeout(()=>controller.abort(), CFG.fetchTimeoutMs);
    try{
      const res = await fetch(url, Object.assign({mode:'cors', credentials:'omit', signal: controller.signal}, opts));
      clearTimeout(id);
      if(!res.ok) throw new Error('status:'+res.status);
      return await res.text();
    }catch(e){ clearTimeout(id); return null; }
  }
  function parseXML(text){ try{ return (new window.DOMParser()).parseFromString(text,'text/xml'); }catch(e){ return null; } }
  function parseHTML(text){ try{ return (new DOMParser()).parseFromString(text, 'text/html'); }catch(e){ return null; } }

  async function readSitemap(url){
    const xmlTxt = await fetchText(url); if(!xmlTxt) return [];
    const doc = parseXML(xmlTxt); if(!doc) return [];
    const sitemaps = Array.from(doc.getElementsByTagName('sitemap')).map(x=> x.getElementsByTagName('loc')?.[0]?.textContent?.trim()).filter(Boolean);
    if(sitemaps.length){
      const all = [];
      for(const loc of sitemaps){ try{ const child = await readSitemap(loc); if(child && child.length) all.push(...child); }catch(e){} }
      return Array.from(new Set(all));
    }
    const urls = Array.from(doc.getElementsByTagName('url')).map(u=> u.getElementsByTagName('loc')?.[0]?.textContent?.trim()).filter(Boolean);
    return urls;
  }

  async function fallbackCrawl(origin){
    const start = origin.endsWith('/')? origin : origin + '/';
    const html = await fetchText(start); if(!html) return [start];
    const doc = parseHTML(html); if(!doc) return [start];
    const anchors = Array.from(doc.querySelectorAll('a[href]')).map(a=> a.getAttribute('href')).filter(Boolean);
    const canon = new Set();
    for(const href of anchors){
      let u;
      try{ u = new URL(href, start).toString(); }catch(e){ continue; }
      if((new URL(u)).host === (new URL(start)).host) canon.add(u.split('#')[0]);
      if(canon.size >= 40) break;
    }
    return [start, ...Array.from(canon)].slice(0, CFG.maxPagesPerDomain);
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
        desc = bodyTxt.slice(0, 800);
      }
      pages.push({url, title, text: desc});
      if(pages.length >= CFG.maxPagesPerDomain) break;
      await sleep(CFG.fetchPauseMs);
    }
    return pages;
  }

  async function learnOneSite(origin){
    try{
      const base = origin.endsWith('/')? origin.replace(/\/+$/,'') : origin.replace(/\/+$/,'');
      const candidates = [ base + '/sitemap.xml', base + '/sitemap_index.xml' ];
      let urls = [];
      for(const c of candidates){
        try{ const got = await readSitemap(c); if(got && got.length){ urls = got; if(CFG.debugSmart) console.log('sitemap found', c); break; } }catch(e){}
      }
      if(!urls.length){
        urls = await fallbackCrawl(base);
        if(CFG.debugSmart) console.log('fallback crawl', base, urls.length);
      }
      const hostOrigin = (new URL(base)).origin;
      const uniq = Array.from(new Set(urls.map(u=>{ try{ return new URL(u).toString().split('#')[0]; }catch(e){ return null; } }).filter(Boolean).filter(u=> (new URL(u)).origin === hostOrigin )));
      const pages = await pullPages(uniq.slice(0, CFG.maxPagesPerDomain));
      return {domain: hostOrigin, ts: nowSec(), pages};
    }catch(e){
      if(CFG.debugSmart) console.warn('learnOneSite fail', e);
      return null;
    }
  }

  // cache helpers
  function loadLearnCache(){ return safe(localStorage.getItem(K.learn)) || {}; }
  function saveLearnCache(obj){ try{ localStorage.setItem(K.learn, JSON.stringify(obj)); }catch(e){} }
  function isExpired(ts, hours){ if(!ts) return true; const ageHr = (nowSec() - ts)/3600; return ageHr >= (hours||CFG.refreshHours); }

  async function learnSites(listOrigins, force=false){
    if(!Array.isArray(listOrigins)) listOrigins = [];
    const cache = loadLearnCache();
    const results = {};
    let totalPages = 0;
    const origins = listOrigins.slice(0, 12);
    for(const origin of origins){
      try{
        const u = new URL(origin);
        const originKey = u.origin;
        const cached = cache[originKey];
        if(!force && cached && !isExpired(cached.ts, CFG.refreshHours) && Array.isArray(cached.pages) && cached.pages.length){
          if(CFG.debugSmart) console.log('using cached', originKey);
          results[originKey] = cached; totalPages += cached.pages.length;
          if(totalPages >= CFG.maxTotalPages) break;
          continue;
        }
        if(CFG.debugSmart) console.log('learning', originKey);
        const data = await learnOneSite(originKey);
        if(data && Array.isArray(data.pages) && data.pages.length){
          cache[originKey] = data; saveLearnCache(cache); results[originKey] = data; totalPages += data.pages.length;
        }
        if(totalPages >= CFG.maxTotalPages) break;
      }catch(e){ if(CFG.debugSmart) console.warn('learnSites error', e); }
    }
    saveLearnCache(cache);
    return results;
  }

  // ====== UI interactions & helpers
  function bindInteractions(){
    const track = document.getElementById('mta32-tagTrack'); const tagsBox = document.getElementById('mta32-tags');
    if(track) track.querySelectorAll('button').forEach(b=> b.addEventListener('click', ()=> { const q = b.dataset.q; if(q) { $('#mta32-in').value = q; sendUser_v32(q); $('#mta32-in').value=''; } }));
    // input focus hide tags
    const input = document.getElementById('mta32-in');
    if(input){
      input.addEventListener('focus', ()=> { if(tagsBox) tagsBox.style.display='none'; });
      input.addEventListener('blur',  ()=> { if(tagsBox && !input.value.trim()) tagsBox.style.display='block'; });
      input.addEventListener('input', ()=> { if(tagsBox) tagsBox.style.display = input.value.trim()? 'none':'block'; });
    }
    $('#mta32-bubble') && $('#mta32-bubble').addEventListener('click', openChat);
    $('#mta32-backdrop') && $('#mta32-backdrop').addEventListener('click', closeChat);
    $('#mta32-close') && $('#mta32-close').addEventListener('click', closeChat);
    $('#mta32-clear') && $('#mta32-clear').addEventListener('click', ()=>{ try{ localStorage.removeItem(K.sess); localStorage.removeItem(K.ctx); }catch(e){}; $('#mta32-body').innerHTML=''; addMsg('bot', polite('đã xóa hội thoại')); });
    $('#mta32-send') && $('#mta32-send').addEventListener('click', ()=>{ const v=($('#mta32-in').value||'').trim(); if(!v) return; $('#mta32-in').value=''; sendUser_v32(v); });
    if(document.getElementById('mta32-in')){
      document.getElementById('mta32-in').addEventListener('keydown',(e)=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); const v=($('#mta32-in').value||'').trim(); if(!v) return; $('#mta32-in').value=''; sendUser_v32(v); }});
    }
  }

  // auto-avoid obstacles (quick-call etc.)
  function checkObstacles(){
    const root = $('#mta32-root'); if(!root) return;
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

  // open / close
  let isOpen = false;
  function openChat(){ if(isOpen) return; $('#mta32-card').classList.add('open'); $('#mta32-backdrop').classList.add('show'); $('#mta32-bubble').style.display='none'; isOpen=true; renderSess(); setTimeout(()=>{ try{ $('#mta32-in').focus(); }catch(e){} }, 120); }
  function closeChat(){ if(!isOpen) return; $('#mta32-card').classList.remove('open'); $('#mta32-backdrop').classList.remove('show'); $('#mta32-bubble').style.display='flex'; isOpen=false; hideTyping(); }

  // disable quick map if requested or local link
  function disableQuickMap(){
    try{
      const sel = document.querySelector('#mta32-header .q-map, .q-map, a.q-map');
      if(!sel) return;
      const href = sel.getAttribute && sel.getAttribute('href') || '';
      const isLocal = !/^https?:\/\//i.test(href) || (href && href.indexOf(location.hostname) >= 0);
      if(CFG.disableQuickMap || isLocal){
        sel.removeAttribute('href'); sel.setAttribute('aria-disabled','true'); sel.style.opacity='0.45'; sel.style.pointerEvents='none'; sel.title = (sel.title||'') + ' (map disabled)';
        if(CFG.debugSmart) console.log('MotoAI v32: quick map disabled');
      }
    }catch(e){ if(CFG.debugSmart) console.warn('disableQuickMap err', e); }
  }

  // ====== Boot
  function ready(fn){ if(document.readyState==='complete' || document.readyState==='interactive') fn(); else document.addEventListener('DOMContentLoaded', fn); }

  ready(async ()=>{
    if(new Date().getHours() > 19 || new Date().getHours() < 6) document.body.classList.add('ai-night');
    injectUI(); bindInteractions(); checkObstacles();
    window.addEventListener('resize', checkObstacles, {passive:true}); window.addEventListener('scroll', checkObstacles, {passive:true});
    if(window.visualViewport) window.visualViewport.addEventListener('resize', checkObstacles, {passive:true});
    // monitor DOM to re-disable map after dynamic injection
    const mo = new MutationObserver(()=>{ disableQuickMap(); });
    mo.observe(document.body, {childList:true, subtree:true});
    setTimeout(disableQuickMap, 500);
    console.log('%cMotoAI v32 — Messenger Smart UI ready','color:#0084FF;font-weight:bold;');

    // autolearn (non-blocking)
    if(CFG.autolearn){
      const sites = Array.from(new Set([location.origin, ...(CFG.extraSites||[])]));
      (async()=>{
        try{
          await learnSites(sites, false);
          console.log('MotoAI v32 autolearn done (localStorage key)', K.learn);
        }catch(e){ console.warn('autolearn err', e); }
      })();
    }
  });

  // ====== API exposure
  window.MotoAI_v32 = {
    open: openChat,
    close: closeChat,
    learnNow: async (sites, force)=> {
      try{
        const list = Array.isArray(sites) && sites.length ? sites : (CFG.extraSites||[]);
        const combined = Array.from(new Set([location.origin, ...list]));
        return await learnSites(combined, !!force);
      }catch(e){ console.warn('learnNow err', e); return null; }
    },
    getIndex: function(){ return getIndex(); },
    clearLearnCache: function(){ try{ localStorage.removeItem(K.learn); console.log('MotoAI learn cache cleared'); }catch(e){} }
  };

})();
