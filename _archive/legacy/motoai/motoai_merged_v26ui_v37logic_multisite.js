/* motoai_merged_v26ui_v37logic_multisite.js
   Version: 1.0 (2025-11-05)
   Author: merged for Nguyen Tu
   Description:
   - UI: v26 (Messenger-style, scrollable tags, auto-avoid, clear chat)
   - Logic: v37 (Smart Pricing by duration, intent/NLP, context, naturalize Vietnamese)
   - AutoLearn: Priority moto_sitemap.json (origin); fallback sitemap.xml/sitemap_index.xml/crawl;
                + MultiSite learn from CFG.extraSites (like v26)
   - Input size: small like Messenger (default 34px), override via window.MotoAI_CONFIG.inputSize
   - Public API: window.MotoAI_MERGED_API { open, close, send, learnNow, getIndex, clearLearnCache, VERSION }
*/
(function(){
  'use strict';
  if (window.MotoAI_MERGED_v1_LOADED) return;
  window.MotoAI_MERGED_v1_LOADED = true;

  /* ===== Config ===== */
  const DEF = {
    brand: "Nguyen Tu",
    phone: "0942467674",
    zalo: "https://zalo.me/0942467674",
    map: "https://maps.app.goo.gl/SR1hcwnCQjPkAvDh7",
    avatar: "👩‍💼",
    themeColor: "#0084FF",
    autolearn: true,
    deepContext: true,
    maxContextTurns: 5,
    viOnly: true,
    extraSites: [location.origin], // MultiSite supported
    crawlDepth: 1,
    refreshHours: 24,
    maxPagesPerDomain: 50,
    maxTotalPages: 180,
    fetchTimeoutMs: 9000,
    fetchPauseMs: 170,
    disableQuickMap: false,
    inputSize: 34 // Messenger-like; set 30 for smaller
  };
  const ORG = (window.MotoAI_CONFIG || {});
  if(!ORG.zalo && (ORG.phone||DEF.phone)) ORG.zalo = 'https://zalo.me/' + String(ORG.phone||DEF.phone).replace(/\s+/g,'');
  const CFG = Object.assign({}, DEF, ORG);
  const MAX_MSG = 10;

  /* ===== Utils ===== */
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const safeJSON = s => { try{return JSON.parse(s);}catch(e){return null;} };
  const sleep = ms => new Promise(r=>setTimeout(r,ms));
  const pick = a => a[Math.floor(Math.random()*a.length)];
  const nowSec = ()=>Math.floor(Date.now()/1000);
  const toURL = u => { try { return new URL(u); } catch(e) { return null; } };
  const sameHost = (u, origin)=> { try{ return new URL(u).host === new URL(origin).host; }catch(e){ return false; } };

  function naturalize(t){
    if(!t) return t;
    let s = " " + t + " ";
    s = s.replace(/\s+ạ([.!?,\s]|$)/gi, "$1");
    s = s.replace(/\s+nhé([.!?,\s]|$)/gi, "$1");
    s = s.replace(/\s+nha([.!?,\s]|$)/gi, "$1");
    s = s.replace(/\s{2,}/g, " ").trim();
    if(!/[.!?]$/.test(s)) s += ".";
    return s.replace(/\.\./g,".");
  }

  /* ===== Storage keys ===== */
  const K = {
    sess:  "MotoAI_MERGED_session",
    ctx:   "MotoAI_MERGED_ctx",
    learn: "MotoAI_MERGED_learn",
    clean: "MotoAI_MERGED_lastClean",
    stamp: "MotoAI_MERGED_learnStamp"
  };

  /* ===== UI (v26) ===== */
  const ui = `
  <div id="mta-root" aria-live="polite">
    <button id="mta-bubble" aria-label="Mở chat" title="Chat">
      <svg viewBox="0 0 64 64" width="28" height="28" aria-hidden="true">
        <defs><linearGradient id="mtaG" x1="0" x2="1"><stop offset="0%" stop-color="${CFG.themeColor}"/><stop offset="100%" stop-color="#00B2FF"/></linearGradient></defs>
        <circle cx="32" cy="32" r="28" fill="url(#mtaG)"></circle>
        <path d="M20 36l9-11 6 6 9-9-9 14-6-6-9 6z" fill="#fff"></path>
      </svg>
    </button>
    <div id="mta-backdrop"></div>
    <section id="mta-card" role="dialog" aria-label="Chat ${CFG.brand}" aria-hidden="true">
      <header id="mta-header">
        <div class="brand">
          <div class="left">
            <span class="avatar">💬</span>
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
          <button id="mta-close" title="Đóng" aria-label="Đóng">✕</button>
        </div>
      </header>

      <main id="mta-body"></main>

      <div id="mta-tags" role="toolbar" aria-label="Gợi ý nhanh (kéo ngang)">
        <div class="tag-track" id="tagTrack">
          <button data-q="Giá thuê xe máy">💰 Bảng giá</button>
          <button data-q="Xe số">🏍️ Xe số</button>
          <button data-q="Xe ga">🛵 Xe ga</button>
          <button data-q="Xe điện">⚡ Xe điện</button>
          <button data-q="50cc">🚲 50cc</button>
          <button data-q="Xe côn tay">🏍️ Côn tay</button>
          <button data-q="Thủ tục">📄 Thủ tục</button>
          <button data-q="Liên hệ">☎️ Liên hệ</button>
        </div>
        <div class="fade fade-left"></div>
        <div class="fade fade-right"></div>
      </div>

      <footer id="mta-input">
        <input id="mta-in" placeholder="Nhắn tin cho ${CFG.brand}..." autocomplete="off" />
        <button id="mta-send" aria-label="Gửi">➤</button>
      </footer>
      <button id="mta-clear" title="Xóa hội thoại" aria-label="Xóa hội thoại">🗑</button>
    </section>
  </div>`;

  const css = `:root{--mta-z:2147483647;--m-blue:${CFG.themeColor};--m-blue2:#00B2FF;--m-bg:#fff;--m-text:#0b1220}
  #mta-root{position:fixed;right:16px;left:auto;bottom:calc(18px + env(safe-area-inset-bottom,0));z-index:var(--mta-z);font-family:-apple-system,system-ui,Segoe UI,Roboto,"Helvetica Neue",Arial;transition:bottom .25s ease,right .25s ease}
  #mta-bubble{width:60px;height:60px;border:none;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 10px 26px rgba(0,0,0,.2);outline:3px solid #fff}
  #mta-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.2);opacity:0;pointer-events:none;transition:opacity .18s ease}
  #mta-backdrop.show{opacity:1;pointer-events:auto}
  #mta-card{position:fixed;right:16px;bottom:16px;width:min(420px,calc(100% - 24px));height:70vh;max-height:740px;background:var(--m-bg);color:var(--m-text);border-radius:18px;box-shadow:0 14px 40px rgba(0,0,0,.25);transform:translateY(110%);display:flex;flex-direction:column;overflow:hidden;transition:transform .20s cubic-bezier(.22,1,.36,1)}
  #mta-card.open{transform:translateY(0)}
  #mta-header{background:linear-gradient(90deg,var(--m-blue),var(--m-blue2));color:#fff}
  #mta-header .brand{display:flex;align-items:center;justify-content:space-between;padding:10px 12px}
  #mta-header .left{display:flex;align-items:center;gap:10px}
  .avatar{width:28px;height:28px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center}
  .info .name{font-weight:800;line-height:1}
  .info .sub{font-size:12px;opacity:.9}
  .quick{display:flex;gap:6px;margin-left:auto;margin-right:6px}
  .q{width:28px;height:28px;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;text-decoration:none;font-size:12px;font-weight:700;background:rgba(255,255,255,.15);color:#fff;border:1px solid rgba(255,255,255,.25)}
  #mta-close{background:none;border:none;font-size:20px;color:#fff;cursor:pointer;opacity:.95}
  #mta-body{flex:1;overflow:auto;padding:14px 12px;background:#E9EEF5}
  .m-msg{max-width:80%;margin:8px 0;padding:9px 12px;border-radius:18px;line-height:1.45;box-shadow:0 1px 2px rgba(0,0,0,.05);word-break:break-word}
  .m-msg.bot{background:#fff;color:#111;border:1px solid rgba(0,0,0,.04)}
  .m-msg.user{background:${CFG.themeColor};color:#fff;margin-left:auto;border:1px solid rgba(0,0,0,.05)}
  #mta-typing{display:inline-flex;gap:6px;align-items:center}
  #mta-typing-dots{display:inline-block;min-width:14px}
  #mta-tags{position:relative;background:#f7f9fc;border-top:1px solid rgba(0,0,0,.06);transition:max-height .22s ease, opacity .18s ease}
  #mta-tags.hidden{max-height:0;opacity:0;overflow:hidden}
  #mta-tags .tag-track{display:block;overflow-x:auto;white-space:nowrap;padding:8px 10px 10px;scroll-behavior:smooth}
  #mta-tags button{display:inline-block;margin-right:8px;padding:8px 12px;border:none;border-radius:999px;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.06);border:1px solid rgba(0,0,0,.08);font-weight:700;cursor:pointer}
  #mta-tags button:active{transform:scale(.98)}
  #mta-tags .fade{position:absolute;top:0;bottom:0;width:22px;pointer-events:none}
  #mta-tags .fade-left{left:0;background:linear-gradient(90deg,#f7f9fc,rgba(247,249,252,0))}
  #mta-tags .fade-right{right:0;background:linear-gradient(270deg,#f7f9fc,rgba(247,249,252,0))}
  #mta-input{display:flex;gap:8px;padding:10px;background:#fff;border-top:1px solid rgba(0,0,0,.06)}
  #mta-in{flex:1;padding:11px 12px;border-radius:20px;border:1px solid rgba(0,0,0,.12);font-size:15px;background:#F6F8FB}
  #mta-send{width:42px;height:42px;border:none;border-radius:50%;background:linear-gradient(90deg,var(--m-blue),var(--m-blue2));color:#fff;font-weight:800;cursor:pointer;box-shadow:0 6px 18px rgba(0,132,255,.35)}
  #mta-clear{position:absolute;top:10px;right:48px;background:none;border:none;font-size:16px;color:#fff;opacity:.9;cursor:pointer}
  @media(max-width:520px){ #mta-card{width:calc(100% - 16px);right:8px;left:8px;height:72vh} #mta-bubble{width:56px;height:56px} }
  @media(prefers-color-scheme:dark){
    :root{--m-bg:#1b1c1f;--m-text:#eaeef3}
    #mta-body{background:#1f2127}
    .m-msg.bot{background:#2a2d34;color:#eaeef3;border:1px solid rgba(255,255,255,.06)}
    #mta-in{background:#16181c;color:#f0f3f7;border:1px solid rgba(255,255,255,.12)}
    #mta-tags{background:#1f2127;border-top:1px solid rgba(255,255,255,.08)}
    #mta-tags button{background:#2a2d34;color:#eaeef3;border:1px solid rgba(255,255,255,.10)}
  }
  .ai-night #mta-bubble{box-shadow:0 0 18px rgba(0,132,255,.35)!important}`;

  function injectUI(){
    if ($('#mta-root')) return;
    const wrap = document.createElement('div'); wrap.innerHTML = ui; document.body.appendChild(wrap.firstElementChild);
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    // Force small input (Messenger-like), late-injected for priority
    const SIZE = Number(CFG.inputSize||34);
    const st2 = document.createElement('style');
    st2.textContent = `
      #mta-input{padding:6px 8px !important; gap:8px !important;}
      #mta-in{
        height:${SIZE}px !important; line-height:${SIZE}px !important;
        padding:0 12px !important; border-radius:${Math.round(SIZE/2)}px !important;
        background:#F2F3F5 !important; border:1px solid rgba(0,0,0,.08) !important;
        font-size:14px !important; box-sizing:border-box !important;
        -webkit-appearance:none !important; appearance:none !important;
      }
      #mta-send{
        width:${SIZE}px !important; height:${SIZE}px !important;
        border-radius:50% !important; font-size:14px !important;
      }`;
    document.head.appendChild(st2);
  }
  function ready(fn){
    if(document.readyState==="complete"||document.readyState==="interactive"){ fn(); }
    else document.addEventListener("DOMContentLoaded", fn);
  }

  /* ===== Session (no double-save fix) ===== */
  function getSess(){
    const arr = safeJSON(localStorage.getItem(K.sess)) || [];
    return Array.isArray(arr) ? arr : [];
  }
  function saveSess(arr){
    try{ localStorage.setItem(K.sess, JSON.stringify(arr.slice(-MAX_MSG))); }catch{}
  }
  function addMsg(role, text, persist = true){
    if(!text) return;
    const body = $("#mta-body"); if(!body) return;
    const el = document.createElement("div");
    el.className = "m-msg " + (role === "user" ? "user" : "bot");
    el.textContent = text;
    body.appendChild(el);
    body.scrollTop = body.scrollHeight;
    if(persist){
      const arr = getSess();
      arr.push({role, text, t: Date.now()});
      saveSess(arr);
    }
  }
  function renderSess(){
    const body = $("#mta-body"); body.innerHTML = "";
    const arr = getSess();
    if (arr.length) {
      arr.forEach(m => addMsg(m.role, m.text, /*persist*/false));
    } else {
      addMsg("bot", naturalize(`Xin chào 👋, em là nhân viên hỗ trợ của ${CFG.brand}. Anh/chị cần xem Xe số/ Xe ga/ Xe điện/ Thủ tục hay Bảng giá ạ?`));
    }
  }

  /* ===== Context (v37) ===== */
  function getCtx(){ return safeJSON(localStorage.getItem(K.ctx)) || {turns:[]}; }
  function pushCtx(delta){
    try{
      const ctx = getCtx();
      ctx.turns.push(Object.assign({t:Date.now()}, delta||{}));
      ctx.turns = ctx.turns.slice(-(CFG.maxContextTurns||5));
      localStorage.setItem(K.ctx, JSON.stringify(ctx));
    }catch{}
  }

  /* ===== Typing (v26 style) ===== */
  let typingBlinkTimer=null;
  function showTyping(){
    const d=document.createElement('div'); d.id='mta-typing'; d.className='m-msg bot'; d.textContent='Đang nhập ';
    const dot=document.createElement('span'); dot.id='mta-typing-dots'; dot.textContent='…';
    d.appendChild(dot); const body=$('#mta-body'); if(!body) return; body.appendChild(d); body.scrollTop = body.scrollHeight;
    let i=0; typingBlinkTimer=setInterval(()=>{ dot.textContent='.'.repeat((i++%3)+1); }, 400);
  }
  function hideTyping(){ const d=$('#mta-typing'); if(d) d.remove(); if(typingBlinkTimer){ clearInterval(typingBlinkTimer); typingBlinkTimer=null; } }

  /* ===== NLP/Intent (v37) ===== */
  const TYPE_MAP = [
    {k:'xe số',     re:/xe số|wave|blade|sirius|jupiter|future|dream/i, canon:'xe số'},
    {k:'xe ga',     re:/xe ga|vision|air\s*blade|lead|liberty|vespa|grande|janus|sh\b/i, canon:'xe ga'},
    {k:'air blade', re:/air\s*blade|airblade|ab\b/i, canon:'air blade'},
    {k:'vision',    re:/vision/i, canon:'vision'},
    {k:'xe điện',   re:/xe điện|vinfast|yadea|dibao|klara|evo/i, canon:'xe điện'},
    {k:'50cc',      re:/50\s*cc|xe 50/i, canon:'50cc'},
    {k:'xe côn tay',re:/côn tay|tay côn|exciter|winner|raider|cb150|cbf190|w175|msx/i, canon:'xe côn tay'}
  ];
  function detectType(t){ for(const it of TYPE_MAP){ if(it.re.test(t)) return it.canon; } return null; }
  function detectQty(t){
    const m = (t||"").match(/(\d+)\s*(ngày|day|tuần|tuan|week|tháng|thang|month)?/i);
    if(!m) return null;
    const n = parseInt(m[1],10); if(!n) return null;
    let unit = "ngày";
    if(m[2]){
      if(/tuần|tuan|week/i.test(m[2])) unit="tuần";
      else if(/tháng|thang|month/i.test(m[2])) unit="tháng";
    }
    return {n, unit};
  }
  function detectIntent(t){
    return {
      needPrice:   /(giá|bao nhiêu|thuê|tính tiền|cost|price)/i.test(t),
      needDocs:    /(thủ tục|giấy tờ|cccd|passport|hộ chiếu)/i.test(t),
      needContact: /(liên hệ|zalo|gọi|hotline|sđt|sdt|phone)/i.test(t),
      needDelivery:/(giao|ship|tận nơi|đưa xe|mang xe)/i.test(t),
      needReturn:  /(trả xe|gia hạn|đổi xe|kết thúc thuê)/i.test(t),
      needPolicy:  /(điều kiện|chính sách|bảo hiểm|hư hỏng|sự cố|đặt cọc|cọc)/i.test(t)
    };
  }

  /* ===== Pricing (v37) ===== */
  const PRICE_TABLE = {
    'xe số':      { day:[150000],          week:[600000,700000], month:[850000,1200000] },
    'xe ga':      { day:[150000,200000],   week:[600000,1000000], month:[1100000,2000000] },
    'air blade':  { day:[200000],          week:[800000], month:[1600000,1800000] },
    'vision':     { day:[200000],          week:[700000,850000], month:[1400000,1900000] },
    'xe điện':    { day:[170000],          week:[800000], month:[1600000] },
    '50cc':       { day:[200000],          week:[800000], month:[1700000] },
    'xe côn tay': { day:[300000],          week:[1200000], month:null }
  };
  function nf(n){ return (n||0).toLocaleString("vi-VN"); }
  function baseFor(type,unit){
    const it=PRICE_TABLE[type]; if(!it) return null;
    const key=unit==="tuần"?"week":(unit==="tháng"?"month":"day");
    const arr=it[key]; if(!arr) return null;
    return Array.isArray(arr)?arr[0]:arr;
  }

  /* ===== Retrieval index (v37) ===== */
  function tk(s){ return (s||"").toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu,' ').split(/\s+/).filter(Boolean); }
  function loadLearn(){ return safeJSON(localStorage.getItem(K.learn)) || {}; }
  function saveLearn(o){ try{ localStorage.setItem(K.learn, JSON.stringify(o)); }catch{} }
  function getIndexFlat(){
    const cache = loadLearn();
    const out = [];
    Object.keys(cache).forEach(key=>{
      (cache[key].pages||[]).forEach(pg=>{
        out.push(Object.assign({source:key}, pg));
      });
    });
    return out;
  }
  function searchIndex(query, k=3){
    const qtok = tk(query);
    if(!qtok.length) return [];
    const idx = getIndexFlat();
    return idx.map(it=>{
      const txt = ((it.title||"")+" "+(it.text||"")+" "+(it.url||"")).toLowerCase();
      let score=0; qtok.forEach(t=>{ if(txt.includes(t)) score++; });
      return Object.assign({score}, it);
    }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,k);
  }
  function mkSnippet(text,q,max=200){
    if(!text) return "";
    const t = text.replace(/\s+/g," ").trim();
    if(t.length<=max) return t;
    const tokens = tk(q);
    for(const tok of tokens){
      const p = t.toLowerCase().indexOf(tok);
      if(p>=0){
        const start = Math.max(0, p-50);
        return (start>0?"...":"")+t.slice(start,start+max)+"...";
      }
    }
    return t.slice(0,max)+"...";
  }

  /* ===== Fetch/Crawl ===== */
  async function fetchText(url){
    const ctl = new AbortController();
    const id = setTimeout(()=>ctl.abort(), CFG.fetchTimeoutMs);
    try{
      const res = await fetch(url, {signal:ctl.signal, mode:'cors', credentials:'omit'});
      clearTimeout(id);
      if(!res.ok) return null;
      return await res.text();
    }catch(e){ clearTimeout(id); return null; }
  }
  function parseXML(t){ try{return (new DOMParser()).parseFromString(t,"text/xml");}catch{return null;} }
  function parseHTML(t){ try{return (new DOMParser()).parseFromString(t,"text/html");}catch{return null;} }
  async function readSitemap(url){
    const xml = await fetchText(url); if(!xml) return [];
    const doc = parseXML(xml); if(!doc) return [];
    const items = Array.from(doc.getElementsByTagName("item"));
    if(items.length){
      return items.map(it=>it.getElementsByTagName("link")[0]?.textContent?.trim()).filter(Boolean);
    }
    const sm = Array.from(doc.getElementsByTagName("sitemap")).map(x=>x.getElementsByTagName("loc")[0]?.textContent?.trim()).filter(Boolean);
    if(sm.length){
      const all=[]; for(const loc of sm){ try{ const child = await readSitemap(loc); all.push(...child); }catch{} }
      return all;
    }
    const urls = Array.from(doc.getElementsByTagName("url")).map(u=>u.getElementsByTagName("loc")[0]?.textContent?.trim()).filter(Boolean);
    return urls;
  }
  async function fallbackCrawl(root){
    const start = root.endsWith("/")?root:root+"/";
    const html = await fetchText(start); if(!html) return [start];
    const doc = parseHTML(html); if(!doc) return [start];
    const links = Array.from(doc.querySelectorAll("a[href]"));
    const set = new Set([start]);
    links.forEach(a=>{
      try{
        const u = new URL(a.getAttribute("href"), start).toString().split("#")[0];
        if(u.startsWith(start)) set.add(u);
      }catch{}
    });
    return Array.from(set).slice(0,CFG.maxPagesPerDomain);
  }
  function looksVN(s){
    if(/[ăâêôơưđà-ỹ]/i.test(s)) return true;
    const hits = (s.match(/\b(xe|thuê|giá|cọc|liên hệ|hà nội)\b/gi)||[]).length;
    return hits>=2;
  }
  async function pullPages(urls){
    const out=[];
    for(const u of urls.slice(0,CFG.maxPagesPerDomain)){
      const txt = await fetchText(u); if(!txt) continue;
      let title = (txt.match(/<title[^>]*>([^<]+)<\/title>/i)||[])[1]||"";
      title = title.replace(/\s+/g," ").trim();
      let desc = (txt.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"]+)["']/i)||[])[1]||"";
      if(!desc){
        desc = txt.replace(/<script[\s\S]*?<\/script>/gi," ")
                  .replace(/<style[\s\S]*?<\/style>/gi," ")
                  .replace(/<[^>]+>/g," ")
                  .replace(/\s+/g," ")
                  .trim()
                  .slice(0,600);
      }
      const sample = (title+" "+desc).toLowerCase();
      if(CFG.viOnly && !looksVN(sample)) { await sleep(CFG.fetchPauseMs); continue; }
      out.push({url:u,title,text:desc});
      await sleep(CFG.fetchPauseMs);
      if(out.length >= CFG.maxPagesPerDomain) break;
    }
    return out;
  }

  /* ===== AutoLearn (origin priority + multisite) ===== */
  async function learnFromSitemapOrSite(){
    const last = parseInt(localStorage.getItem(K.stamp)||0);
    if (last && (Date.now()-last) < CFG.refreshHours*3600*1000) {
      return loadLearn();
    }

    const cache = loadLearn();
    let total=0;

    // 1) Try moto_sitemap.json on origin
    const sitemapUrl = location.origin + "/moto_sitemap.json";
    try{
      const r = await fetch(sitemapUrl, {mode:'cors', credentials:'omit'});
      if (r && r.ok) {
        const json = await r.json();
        const ds = [
          ...(json.categories?.datasets?.list || []),
          ...(json.categories?.pages?.list || [])
        ];
        const grouped = {"sitemap-json": {pages:[]}};
        for (const u of ds) {
          const txt = await fetchText(u);
          if(!txt) continue;
          if (/\.txt($|\?)/i.test(u)) {
            const title = u.split("/").slice(-1)[0];
            const text = txt.replace(/\s+/g," ").trim().slice(0,2000);
            grouped["sitemap-json"].pages.push({url:u,title,text});
          } else {
            let title = (txt.match(/<title[^>]*>([^<]+)<\/title>/i)||[])[1]||"";
            title = title.replace(/\s+/g," ").trim();
            let desc = (txt.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"]+)["']/i)||[])[1]||"";
            if(!desc){
              desc = txt.replace(/<script[\s\S]*?<\/script>/gi," ")
                        .replace(/<style[\s\S]*?<\/style>/gi," ")
                        .replace(/<[^>]+>/g," ")
                        .replace(/\s+/g," ").trim().slice(0,600);
            }
            const sample = (title+" "+desc).toLowerCase();
            if(CFG.viOnly && !looksVN(sample)) continue;
            grouped["sitemap-json"].pages.push({url:u,title,text:desc});
          }
          total++;
          if (total>=CFG.maxTotalPages) break;
          await sleep(CFG.fetchPauseMs);
        }
        if (grouped["sitemap-json"].pages.length){
          cache["sitemap-json"] = {domain:sitemapUrl, ts:nowSec(), pages: grouped["sitemap-json"].pages};
          saveLearn(cache);
          localStorage.setItem(K.stamp, Date.now());
          console.log('MotoAI Merged: learned from moto_sitemap.json');
        }
      }
    }catch(e){
      console.warn("MotoAI Merged: sitemap.json fetch error", e);
    }

    // 2) Fallback for origin (sitemap.xml / crawl)
    try{
      const origin = location.origin;
      const old=cache[origin];
      const fresh = old && old.pages?.length && ((nowSec()-old.ts)/3600 < CFG.refreshHours);
      if(!fresh){
        let urls=[];
        const candidates = [origin+"/sitemap.xml", origin+"/sitemap_index.xml"];
        for(const c of candidates){
          try{
            const u = await readSitemap(c);
            if(u && u.length){ urls=u; break; }
          }catch{}
        }
        if(!urls.length) urls = await fallbackCrawl(origin);
        const pages = await pullPages(urls);
        if(pages?.length){
          cache[origin] = {domain:origin, ts:nowSec(), pages};
          saveLearn(cache);
        }
      }
      localStorage.setItem(K.stamp, Date.now());
    }catch(e){ console.warn("MotoAI Merged: fallback crawl error", e); }

    return cache;
  }

  // Learn extra sites (MultiSite like v26)
  async function learnExtraSites(){
    const list = (CFG.extraSites||[]).map(s=>{ try{ return new URL(s).origin; }catch(e){ return null; } }).filter(Boolean);
    const here = location.origin;
    const uniq = Array.from(new Set(list)).filter(o=> o!==here);
    if (!uniq.length) return loadLearn();
    const cache = loadLearn();
    for (const origin of uniq){
      try{
        let urls=[];
        const candidates = [origin+"/moto_sitemap.json", origin+"/sitemap.xml", origin+"/sitemap_index.xml"];
        // try moto_sitemap.json first on extra site (if CORS allows)
        try{
          const r = await fetch(candidates[0], {mode:'cors', credentials:'omit'});
          if(r && r.ok){
            const json = await r.json();
            const ds = [
              ...(json.categories?.datasets?.list || []),
              ...(json.categories?.pages?.list || [])
            ];
            const pages = [];
            for (const u of ds){
              const txt = await fetchText(u); if(!txt) continue;
              if (/\.txt($|\?)/i.test(u)) {
                const title = u.split("/").slice(-1)[0];
                const text = txt.replace(/\s+/g," ").trim().slice(0,2000);
                pages.push({url:u,title,text});
              } else {
                let title = (txt.match(/<title[^>]*>([^<]+)<\/title>/i)||[])[1]||"";
                title = title.replace(/\s+/g," ").trim();
                let desc = (txt.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"]+)["']/i)||[])[1]||"";
                if(!desc){
                  desc = txt.replace(/<script[\s\S]*?<\/script>/gi," ")
                            .replace(/<style[\s\S]*?<\/style>/gi," ")
                            .replace(/<[^>]+>/g," ")
                            .replace(/\s+/g," ").trim().slice(0,600);
                }
                const sample = (title+" "+desc).toLowerCase();
                if(CFG.viOnly && !looksVN(sample)) { /* skip */ } else {
                  pages.push({url:u,title,text:desc});
                }
              }
              if(pages.length >= CFG.maxPagesPerDomain) break;
              await sleep(CFG.fetchPauseMs);
            }
            if(pages.length){
              cache[origin] = {domain:origin, ts:nowSec(), pages};
              saveLearn(cache);
              continue; // done this origin
            }
          }
        }catch{ /* ignore */ }

        // If no moto_sitemap.json or blocked by CORS, try XML
        for(const c of candidates.slice(1)){
          try{ const got = await readSitemap(c); if(got && got.length){ urls = got; break; } }catch{}
        }
        if(!urls.length) urls = await fallbackCrawl(origin);
        const pages2 = await pullPages(urls);
        if(pages2 && pages2.length){
          cache[origin] = {domain:origin, ts:nowSec(), pages:pages2};
          saveLearn(cache);
        }
        await sleep(CFG.fetchPauseMs);
      }catch(e){ console.warn('MotoAI Merged: learn extra site fail', origin, e); }
    }
    return cache;
  }

  /* ===== Answer engine (v37) ===== */
  const PREFIX = ["Chào anh/chị,","Xin chào 👋,","Em chào anh/chị,","Em ở đây,"];
  function polite(s){ s = s || "em chưa nhận được câu hỏi, anh/chị nhập lại giúp em."; return naturalize(`${pick(PREFIX)} ${s}`); }

  function composePrice(type, qty){
    if(!type) type="xe số";
    if(!qty){
      return naturalize(`Anh/chị thuê ${type} theo ngày, tuần hay tháng để em báo đúng giá nhé.`);
    }
    const base = baseFor(type, qty.unit);
    if(!base){
      return naturalize(`Giá thuê ${type} theo ${qty.unit} cần kiểm tra. Anh/chị nhắn Zalo ${CFG.phone} để em chốt theo mẫu xe ạ.`);
    }
    const total = base * qty.n;
    const unitLabel = qty.unit==="ngày"?"ngày":qty.unit==="tuần"?"tuần":"tháng";
    const text = qty.n===1
      ? `Giá thuê ${type} 1 ${unitLabel} khoảng ${nf(base)}đ`
      : `Giá thuê ${type} ${qty.n} ${unitLabel} khoảng ${nf(total)}đ`;
    let hint = "";
    if (qty.unit==="ngày" && qty.n>=3) hint = " Nếu thuê theo tuần sẽ tiết kiệm hơn.";
    return naturalize(`${text}. Anh/chị cần em giữ xe và gửi ảnh xe qua Zalo ${CFG.phone} không?${hint}`);
  }

  async function deepAnswer(userText){
    const q = (userText||"").trim();
    if(!q) return polite("anh/chị thử bấm tag: 🏍️ Xe số, 🛵 Xe ga, hoặc 📄 Thủ tục nhé");
    const intents = detectIntent(q);
    let type = detectType(q);
    const qty = detectQty(q);

    if(CFG.deepContext){
      const ctx = getCtx();
      for(let i=ctx.turns.length-1;i>=0;i--){
        const t = ctx.turns[i];
        if(!type && t.type) type=t.type;
        if(!qty && t.qty) return composePrice(type||t.type, t.qty);
        if(type && qty) break;
      }
    }

    if(intents.needContact)
      return polite(`anh/chị gọi ${CFG.phone} hoặc Zalo ${CFG.zalo||CFG.phone} là có người nhận ngay.`);
    if(intents.needDocs)
      return polite(`thủ tục gọn: CCCD/hộ chiếu + cọc theo xe. Không để giấy tờ có thể thêm 500k thay giấy tờ.`);
    if(intents.needPolicy)
      return polite(`đặt cọc tham khảo: xe số 2–3 triệu; xe ga 2–5 triệu; 50cc cọc 4 triệu. Liên hệ Zalo ${CFG.phone} để chốt theo mẫu xe.`);
    if(intents.needDelivery)
      return polite(`thuê 1–4 ngày vui lòng đến cửa hàng để chọn xe; thuê tuần/tháng em giao tận nơi. Phí nội thành 20–100k tuỳ quận. Nhắn Zalo ${CFG.phone} để em set lịch.`);
    if(intents.needReturn)
      return polite(`trả xe tại cửa hàng hoặc hẹn trả tận nơi (thoả thuận). Báo trước 30 phút để em sắp xếp, hoàn cọc nhanh.`);

    if(intents.needPrice) return composePrice(type, qty);

    try{
      const top = searchIndex(q, 3);
      if(top && top.length){
        const lines = top.map(t=>{
          const sn = mkSnippet(t.title||t.text||"", q, 140);
          let dom = t.source || "nguồn";
          try{ if(t.url) dom = new URL(t.url).hostname.replace(/^www\./,""); }catch{}
          return `• ${sn} (${dom})`;
        });
        return naturalize(`em tìm được vài nội dung liên quan:\n${lines.join("\n")}\nAnh/chị muốn em tóm tắt mục nào không?`);
      }
    }catch(e){}

    return polite(`anh/chị muốn thuê loại nào (xe số, xe ga, xe điện, 50cc) và thuê mấy ngày để em báo đúng giá?`);
  }

  /* ===== Bindings & control (v26 UI + v37 logic) ===== */
  let isOpen=false, sending=false;

  function openChat(){ if(isOpen) return; $('#mta-card').classList.add('open'); $('#mta-backdrop').classList.add('show'); $('#mta-bubble').style.display='none'; isOpen=true; renderSess(); setTimeout(()=>{ try{ $('#mta-in').focus(); }catch(e){} }, 120); }
  function closeChat(){ if(!isOpen) return; $('#mta-card').classList.remove('open'); $('#mta-backdrop').classList.remove('show'); $('#mta-bubble').style.display='flex'; isOpen=false; hideTyping(); }
  function clearChat(){ try{ localStorage.removeItem(K.sess); localStorage.removeItem(K.ctx); }catch(e){}; $('#mta-body').innerHTML=''; addMsg('bot', polite('đã xóa hội thoại')); }

  async function sendUser(text){
    if(sending) return;
    const v = (text||"").trim();
    if(!v) return;
    sending = true;
    addMsg("user", v);
    pushCtx({from:"user",raw:v,type:detectType(v),qty:detectQty(v)});

    const isMobile = window.innerWidth < 480;
    const wait = (isMobile ? 1800 + Math.random()*1200 : 2500 + Math.random()*2000);
    showTyping();
    await sleep(wait);

    const ans = await deepAnswer(v);
    hideTyping();
    addMsg("bot", ans);
    pushCtx({from:"bot",raw:ans});
    sending = false;
  }

  function bindScrollTags(){
    const track = document.getElementById('tagTrack'); const box = document.getElementById('mta-tags'); if(!track||!box) return;
    track.querySelectorAll('button').forEach(b=>{ b.addEventListener('click', ()=> sendUser(b.dataset.q || b.textContent)); });
    const updateFade = ()=>{
      const left = track.scrollLeft > 2;
      const right = (track.scrollWidth - track.clientWidth - track.scrollLeft) > 2;
      const fl = box.querySelector('.fade-left'); const fr = box.querySelector('.fade-right');
      if(fl) fl.style.opacity = left ? '1' : '0';
      if(fr) fr.style.opacity = right ? '1' : '0';
    };
    track.addEventListener('scroll', updateFade, {passive:true});
    setTimeout(updateFade, 80);
    const input = document.getElementById('mta-in');
    if(input){
      input.addEventListener('focus', ()=> box.classList.add('hidden'));
      input.addEventListener('blur',  ()=> { if(!input.value.trim()) box.classList.remove('hidden'); });
      input.addEventListener('input', ()=> { if(input.value.trim().length>0) box.classList.add('hidden'); else box.classList.remove('hidden'); });
    }
  }

  function checkObstacles(){
    const root = $('#mta-root'); if(!root) return;
    const blockers = document.querySelector('.bottom-appbar, .quick-call, #quick-call, .qca, #quickcall');
    let bottom = 'calc(18px + env(safe-area-inset-bottom, 0))';
    if(blockers){
      const r = blockers.getBoundingClientRect();
      const space = window.innerHeight - r.top;
      if(space < 120 && space > 0) bottom = (space + 60) + 'px';
    }
    if(window.visualViewport){
      const vv = window.visualViewport;
      if(vv.height < window.innerHeight - 120) bottom = '110px';
    }
    root.style.bottom = bottom; root.style.right = '16px'; root.style.left = 'auto';
  }

  function maybeDisableQuickMap(){
    if(!CFG.disableQuickMap) return;
    const m = document.querySelector("a.q-map");
    if(m){
      m.removeAttribute("href");
      m.style.opacity=".4";
      m.style.pointerEvents="none";
    }
  }

  /* ===== Boot ===== */
  ready(async ()=>{
    const lastClean = parseInt(localStorage.getItem(K.clean)||0);
    if (!lastClean || (Date.now()-lastClean) > 7*24*3600*1000){
      localStorage.removeItem(K.learn);
      localStorage.removeItem(K.ctx);
      localStorage.setItem(K.clean, Date.now());
      console.log("MotoAI Merged: cache cleaned");
    }
    const hour=new Date().getHours(); if(hour>19||hour<6) document.body.classList.add('ai-night');

    injectUI();
    bindScrollTags();
    checkObstacles();
    maybeDisableQuickMap();

    $('#mta-bubble').addEventListener('click', openChat);
    $('#mta-backdrop').addEventListener('click', closeChat);
    $('#mta-close').addEventListener('click', closeChat);
    $('#mta-clear').addEventListener('click', clearChat);
    $('#mta-send').addEventListener('click', ()=>{ const v=($('#mta-in').value||'').trim(); if(!v) return; $('#mta-in').value=''; sendUser(v); });
    $('#mta-in').addEventListener('keydown',(e)=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); const v=($('#mta-in').value||'').trim(); if(!v) return; $('#mta-in').value=''; sendUser(v); }});
    window.addEventListener('resize', checkObstacles, {passive:true});
    window.addEventListener('scroll', checkObstacles, {passive:true});
    if(window.visualViewport) window.visualViewport.addEventListener('resize', checkObstacles, {passive:true});
    setTimeout(()=>{ if(!$('#mta-bubble')) injectUI(); }, 2500);
    console.log('%cMotoAI Merged (v26 UI + v37 Logic + MultiSite) — UI ready','color:'+CFG.themeColor+';font-weight:bold;');

    if(CFG.autolearn){
      try{
        console.log('MotoAI Merged: autolearn origin...');
        await learnFromSitemapOrSite();
        console.log('MotoAI Merged: autolearn extraSites...');
        await learnExtraSites();
        console.log('MotoAI Merged: autolearn done (localStorage key)', K.learn);
      }catch(e){ console.warn('MotoAI Merged: autolearn err', e); }
    }
  });

  /* ===== Public API ===== */
  function clearLearnCache(){
    try{ 
      localStorage.removeItem(K.learn); 
      localStorage.removeItem(K.stamp);
      console.log('MotoAI Merged: learn cache cleared'); 
    }catch(e){}
  }

  window.MotoAI_MERGED_API = {
    VERSION: "1.0-2025-11-05",
    open: openChat,
    close: closeChat,
    send: sendUser,
    learnNow: async function(){ const a=await learnFromSitemapOrSite(); const b=await learnExtraSites(); return Object.assign({},a,b); },
    getIndex: getIndexFlat,
    clearLearnCache: clearLearnCache
  };

})();
