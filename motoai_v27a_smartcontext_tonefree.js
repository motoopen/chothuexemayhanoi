/* motoai_v27a_smartcontext_tonefree.js
   MotoAI v27a — SmartContext + NaturalTone Free
   UI kế thừa v22c/v26 (Messenger-style, scroll tags, auto-avoid).
   Học nội dung từ sitemap.xml / sitemap_index.xml và fallback quét link nội bộ (depth=1), cache localStorage.
   Hoàn toàn không cần API key. Giọng tự nhiên, KHÔNG dùng “ạ/nhé/nha/anh/chị”.

   Expose:
     window.MotoAI_v27a = { open(), close() }
     window.MotoAI_v27a_learn = { learnNow(sites, force), getIndex(), clearLearnCache() }

   Cấu hình (tùy chọn) qua window.MotoAI_CONFIG trước khi tải file:
     {
       brand, phone, zalo, map,
       autolearn: true/false,
       extraSites: [ ... ],
       refreshHours: 24
     }
*/
(function(){
  if (window.MotoAI_v27a_LOADED) return;
  window.MotoAI_v27a_LOADED = true;

  // ===== Config (có thể override bằng window.MotoAI_CONFIG) =====
  const DEF = {
    brand: "Motoopen",
    phone: "0942467674",
    zalo:  "https://zalo.me/0942467674",
    map:   "https://maps.app.goo.gl/d37dxtjcYi3aQSR3A",
    autolearn: true,
    extraSites: [
      "https://motoopen.github.io/chothuexemayhanoi/",
      "https://thuexemaynguyentu.com",
      "https://rentbikehanoi.com"
    ],
    crawlDepth: 1,
    refreshHours: 24,
    minSentenceLen: 24,
    // giới hạn & an toàn
    maxPagesPerDomain: 80,
    maxTotalPages: 300,
    fetchTimeoutMs: 10000,
    fetchPauseMs: 180
  };
  const CFG = Object.assign({}, DEF, (window.MotoAI_CONFIG||{}));
  if(!CFG.zalo && CFG.phone) CFG.zalo = 'https://zalo.me/' + String(CFG.phone).replace(/\s+/g,'');

  // ===== Utils =====
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const safe = s => { try{ return JSON.parse(s); }catch(e){ return null; } };
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const pick = a => a[Math.floor(Math.random()*a.length)];
  const nowSec = ()=> Math.floor(Date.now()/1000);
  const toURL = u => { try { return new URL(u); } catch(e) { return null; } };
  const sameHost = (u, origin)=> { try{ return new URL(u).host === new URL(origin).host; }catch(e){ return false; } };
  const clamp = (n,min,max)=> Math.max(min, Math.min(max, n));

  // ===== Storage keys =====
  const K = {
    sess:  'MotoAI_v27a_session',   // hội thoại [{role:'user'|'bot',text,t}]
    ctx:   'MotoAI_v27a_ctx',       // tham chiếu top trang từ index
    learn: 'MotoAI_v27a_learn'      // { origin: { ts, pages:[{url,title,text}] } }
  };

  // ===== UI (Messenger-style, giữ nguyên tinh thần v26) =====
  const ui = `
  <div id="mta27-root" aria-live="polite">
    <button id="mta27-bubble" aria-label="Mở chat" title="Chat">
      <svg viewBox="0 0 64 64" width="28" height="28" aria-hidden="true">
        <defs><linearGradient id="mta27G" x1="0" x2="1"><stop offset="0%" stop-color="#0084FF"/><stop offset="100%" stop-color="#00B2FF"/></linearGradient></defs>
        <circle cx="32" cy="32" r="28" fill="url(#mta27G)"></circle>
        <path d="M20 36l9-11 6 6 9-9-9 14-6-6-9 6z" fill="#fff"></path>
      </svg>
    </button>
    <div id="mta27-backdrop"></div>
    <section id="mta27-card" role="dialog" aria-label="Chat MotoAI" aria-hidden="true">
      <header id="mta27-header">
        <div class="brand">
          <div class="left">
            <span class="avatar">💬</span>
            <div class="info">
              <div class="name">${CFG.brand}</div>
              <div class="sub">Hỗ trợ trực tuyến</div>
            </div>
          </div>
          <nav class="quick">
            <a class="q q-phone" href="tel:${CFG.phone}" title="Gọi">📞</a>
            <a class="q q-zalo"  href="${CFG.zalo}" target="_blank" rel="noopener" title="Zalo">Z</a>
            <a class="q q-map"   href="${CFG.map}" target="_blank" rel="noopener" title="Bản đồ">📍</a>
          </nav>
          <button id="mta27-close" title="Đóng" aria-label="Đóng">✕</button>
        </div>
      </header>

      <main id="mta27-body"></main>

      <!-- Tags gợi ý (scroll ngang) -->
      <div id="mta27-tags" role="toolbar" aria-label="Gợi ý nhanh (kéo ngang)">
        <div class="tag-track" id="mta27-tagTrack">
          <button data-q="Giá thuê xe số">🏍️ Xe số</button>
          <button data-q="Giá thuê xe ga">🛵 Xe ga</button>
          <button data-q="Giá thuê xe điện">⚡ Xe điện</button>
          <button data-q="Giá thuê theo tháng">📆 Thuê tháng</button>
          <button data-q="Thủ tục thuê xe cần gì">📄 Thủ tục</button>
          <button data-q="Có giao tận nơi không">🚚 Giao xe</button>
          <button data-q="Liên hệ">☎️ Liên hệ</button>
        </div>
        <div class="fade fade-left"></div>
        <div class="fade fade-right"></div>
      </div>

      <footer id="mta27-input">
        <input id="mta27-in" placeholder="Nhắn tin cho ${CFG.brand}..." autocomplete="off" />
        <button id="mta27-send" aria-label="Gửi">➤</button>
      </footer>
      <button id="mta27-clear" title="Xóa hội thoại" aria-label="Xóa hội thoại">🗑</button>
    </section>
  </div>`;

  const css = `:root{--m27-z:2147483647;--m-blue:#0084FF;--m-blue2:#00B2FF;--m-bg:#fff;--m-text:#0b1220}
  #mta27-root{position:fixed;right:16px;left:auto;bottom:calc(18px + env(safe-area-inset-bottom,0));z-index:var(--m27-z);font-family:-apple-system,system-ui,Segoe UI,Roboto,"Helvetica Neue",Arial;transition:bottom .25s ease,right .25s ease}
  #mta27-bubble{width:60px;height:60px;border:none;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 10px 26px rgba(0,0,0,.2);outline:3px solid #fff}
  #mta27-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.2);opacity:0;pointer-events:none;transition:opacity .18s ease}
  #mta27-backdrop.show{opacity:1;pointer-events:auto}
  #mta27-card{position:fixed;right:16px;bottom:16px;width:min(420px,calc(100% - 24px));height:70vh;max-height:740px;background:var(--m-bg);color:var(--m-text);border-radius:18px;box-shadow:0 14px 40px rgba(0,0,0,.25);transform:translateY(110%);opacity:.99;display:flex;flex-direction:column;overflow:hidden;transition:transform .20s cubic-bezier(.22,1,.36,1)}
  #mta27-card.open{transform:translateY(0)}
  #mta27-header{background:linear-gradient(90deg,var(--m-blue),var(--m-blue2));color:#fff}
  #mta27-header .brand{display:flex;align-items:center;justify-content:space-between;padding:10px 12px}
  #mta27-header .left{display:flex;align-items:center;gap:10px}
  .avatar{width:28px;height:28px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center}
  .info .name{font-weight:800;line-height:1}
  .info .sub{font-size:12px;opacity:.9}
  .quick{display:flex;gap:6px;margin-left:auto;margin-right:6px}
  .q{width:28px;height:28px;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;text-decoration:none;font-size:12px;font-weight:700;background:rgba(255,255,255,.15);color:#fff;border:1px solid rgba(255,255,255,.25)}
  #mta27-close{background:none;border:none;font-size:20px;color:#fff;cursor:pointer;opacity:.95}
  #mta27-body{flex:1;overflow:auto;padding:14px 12px;background:#E9EEF5}
  .m27-msg{max-width:80%;margin:8px 0;padding:9px 12px;border-radius:18px;line-height:1.45;box-shadow:0 1px 2px rgba(0,0,0,.05)}
  .m27-msg.bot{background:#fff;color:#111;border:1px solid rgba(0,0,0,.04)}
  .m27-msg.user{background:#0084FF;color:#fff;margin-left:auto;border:1px solid rgba(0,0,0,.05)}
  #mta27-typing{display:inline-flex;gap:6px;align-items:center}
  #mta27-typing-dots{display:inline-block;min-width:14px}
  #mta27-tags{position:relative;background:#f7f9fc;border-top:1px solid rgba(0,0,0,.06);transition:max-height .22s ease, opacity .18s ease}
  #mta27-tags.hidden{max-height:0; opacity:0; overflow:hidden;}
  #mta27-tags .tag-track{display:block;overflow-x:auto;white-space:nowrap;padding:8px 10px 10px 10px;scroll-behavior:smooth}
  #mta27-tags button{display:inline-block;margin-right:8px;padding:8px 12px;border:none;border-radius:999px;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.06);border:1px solid rgba(0,0,0,.08);font-weight:700;cursor:pointer}
  #mta27-tags button:active{transform:scale(.98)}
  #mta27-tags .fade{position:absolute;top:0;bottom:0;width:22px;pointer-events:none}
  #mta27-tags .fade-left{left:0;background:linear-gradient(90deg,#f7f9fc,rgba(247,249,252,0))}
  #mta27-tags .fade-right{right:0;background:linear-gradient(270deg,#f7f9fc,rgba(247,249,252,0))}
  #mta27-input{display:flex;gap:8px;padding:10px;background:#fff;border-top:1px solid rgba(0,0,0,.06)}
  #mta27-in{flex:1;padding:11px 12px;border-radius:20px;border:1px solid rgba(0,0,0,.12);font-size:15px;background:#F6F8FB}
  #mta27-send{width:42px;height:42px;border:none;border-radius:50%;background:linear-gradient(90deg,#0084FF,#00B2FF);color:#fff;font-weight:800;cursor:pointer;box-shadow:0 6px 18px rgba(0,132,255,.35)}
  #mta27-clear{position:absolute;top:10px;right:48px;background:none;border:none;font-size:16px;color:#fff;opacity:.9;cursor:pointer}
  @media(max-width:520px){ #mta27-card{width:calc(100% - 16px);right:8px;left:8px;height:72vh} #mta27-bubble{width:56px;height:56px} }
  @media(prefers-color-scheme:dark){
    :root{--m-bg:#1b1c1f;--m-text:#eaeef3}
    #mta27-body{background:#1f2127}
    .m27-msg.bot{background:#2a2d34;color:#eaeef3;border:1px solid rgba(255,255,255,.06)}
    #mta27-in{background:#16181c;color:#f0f3f7;border:1px solid rgba(255,255,255,.12)}
    #mta27-tags{background:#1f2127;border-top:1px solid rgba(255,255,255,.08)}
    #mta27-tags button{background:#2a2d34;color:#eaeef3;border:1px solid rgba(255,255,255,.10)}
  }
  .ai-night #mta27-bubble{box-shadow:0 0 18px rgba(0,132,255,.35)!important;}`;

  // ===== Inject UI =====
  function injectUI(){
    if ($('#mta27-root')) return;
    const wrap = document.createElement('div'); wrap.innerHTML = ui; document.body.appendChild(wrap.firstElementChild);
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  }
  function ready(fn){
    if(document.readyState==="complete"||document.readyState==="interactive"){ fn(); }
    else document.addEventListener("DOMContentLoaded", fn);
  }

  // ===== Session helpers =====
  function addMsg(role,text){
    if(!text) return;
    const el = document.createElement('div'); el.className = 'm27-msg '+(role==='user'?'user':'bot'); el.textContent = text;
    const body = $('#mta27-body'); if(!body) return;
    body.appendChild(el); body.scrollTop = body.scrollHeight;
    try{
      const arr = safe(localStorage.getItem(K.sess)) || [];
      arr.push({role,text,t:Date.now()});
      localStorage.setItem(K.sess, JSON.stringify(arr.slice(-220)));
    }catch(e){}
  }
  function renderSess(){
    const body = $('#mta27-body'); if(!body) return;
    body.innerHTML = '';
    const arr = safe(localStorage.getItem(K.sess))||[];
    if(arr.length){
      arr.forEach(m=> addMsg(m.role,m.text));
    } else {
      const hello = `Xin chào, mình hỗ trợ ${CFG.brand}. Muốn xem xe số, xe ga, xe điện hay hỏi thủ tục cứ nhắn.`;
      addMsg('bot', hello);
    }
  }

  // ===== Typing bubble =====
  let typingBlinkTimer=null;
  function showTyping(){
    const d=document.createElement('div'); d.id='mta27-typing'; d.className='m27-msg bot'; d.textContent='Đang nhập ';
    const dot=document.createElement('span'); dot.id='mta27-typing-dots'; dot.textContent='…';
    d.appendChild(dot); const body=$('#mta27-body'); if(!body) return; body.appendChild(d); body.scrollTop = body.scrollHeight;
    let i=0; typingBlinkTimer=setInterval(()=>{ dot.textContent='.'.repeat((i++%3)+1); }, 380);
  }
  function hideTyping(){ const d=$('#mta27-typing'); if(d) d.remove(); if(typingBlinkTimer){ clearInterval(typingBlinkTimer); typingBlinkTimer=null; } }

  // ===== SmartCalc (giá tham khảo) =====
  const PRICE_TABLE = {
    'xe số':      { day:[130000,150000], week:[600000], month:[1000000,1200000] },
    'air blade':  { day:[200000], week:[800000], month:[1400000] },
    'vision':     { day:[200000], week:[900000], month:[2000000] },
    'xe điện':    { day:[200000], week:[800000], month:[1500000] },
    '50cc':       { day:[200000], week:[800000], month:[1800000] },
    'xe côn tay': { day:[350000], week:[1200000], month:[2500000] },
    'xe giá rẻ':  { day:[100000], week:[500000], month:[900000] }
  };
  const CHEAP_KWS = /(rẻ|giá rẻ|bình dân|sinh viên|hssv)/i;
  function nfVND(n){ return (n||0).toLocaleString('vi-VN'); }
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
    if(!qty) return `Giá ${type}: ${summariseType(type)}. Cần giá chính xác thì gọi ${CFG.phone} hoặc Zalo.`;
    const unit=qty.unit, n=qty.n, base=baseFor(type,unit);
    if(!base) return `Giá theo ${unit} của ${type} chưa có sẵn. Nhắn Zalo ${CFG.phone} để báo giá nhanh.`;
    const total=base*n, label=unit==='day'?`${n} ngày`:unit==='week'?`${n} tuần`:`${n} tháng`;
    return `Ước tính ${type} ${label} khoảng ${nfVND(total)}đ. Muốn chốt lịch thì để lại khung giờ nhận xe.`;
  }

  // ===== NaturalTone: bỏ “ạ/nhé/nha/anh/chị”, giữ giọng tự nhiên =====
  const Tone = {
    clean(s){
      if(!s) return s;
      let out = String(s);
      // loại các hạt từ lịch sự không mong muốn
      out = out.replace(/\b(anh\/chị|anh|chị|quý khách|qk|quy khach)\b/gi, 'bạn');
      out = out.replace(/\b(ạ|nhé|nha|nhá|ạ\.|ạ,|nhé\.|nhé,|nha\.|nha,)\b/gi, '');
      // dọn dấu cách thừa
      out = out.replace(/\s{2,}/g,' ').replace(/\s+([,.!?])/g,'$1').trim();
      return out;
    },
    soften(s){
      if(!s) return s;
      // tách câu dài -> 2 câu, gửi theo nhịp (thực hiện ở hàm sendBot)
      return s;
    }
  };

  // ===== SmartContext: lấy vài tin nhắn gần nhất để suy diễn =====
  function getLastUserTopic(n=5){
    const arr = safe(localStorage.getItem(K.sess))||[];
    const last = arr.filter(x=>x.role==='user').slice(-n).map(x=>x.text.toLowerCase());
    // gom vài từ khóa
    const joined = last.join(' | ');
    // ưu tiên tên xe / thời lượng
    const mType = detectType(joined);
    const mQty  = detectQty(joined);
    return {mType, mQty, trail: last};
  }

  // ====== FETCH helpers (timeout) ======
  async function fetchText(url, opts={}){
    const controller = new AbortController();
    const id = setTimeout(()=>controller.abort(), CFG.fetchTimeoutMs);
    try{
      const res = await fetch(url, Object.assign({mode:'cors', credentials:'omit', signal: controller.signal}, opts));
      clearTimeout(id);
      if(!res.ok) throw new Error('status:'+res.status);
      return await res.text();
    }catch(e){
      clearTimeout(id);
      return null;
    }
  }
  function parseXML(text){ try{ return (new DOMParser()).parseFromString(text,'text/xml'); }catch(e){ return null; } }
  function parseHTML(text){ try{ return (new DOMParser()).parseFromString(text,'text/html'); }catch(e){ return null; } }

  // ====== AutoLearn: sitemap reader, fallback crawl, page pull (giữ nguyên tinh thần v26) ======
  async function readSitemap(url){
    const xmlTxt = await fetchText(url);
    if(!xmlTxt) return [];
    const doc = parseXML(xmlTxt); if(!doc) return [];
    // sitemapindex?
    const sitemaps = Array.from(doc.getElementsByTagName('sitemap')).map(x=> x.getElementsByTagName('loc')?.[0]?.textContent?.trim()).filter(Boolean);
    if(sitemaps.length){
      const all = [];
      for(const loc of sitemaps){
        try{ const child = await readSitemap(loc); if(child && child.length) all.push(...child); }catch(e){}
      }
      return Array.from(new Set(all));
    }
    // urlset
    const urls = Array.from(doc.getElementsByTagName('url')).map(u=> u.getElementsByTagName('loc')?.[0]?.textContent?.trim()).filter(Boolean);
    return urls;
  }
  async function fallbackCrawl(origin){
    const start = origin.endsWith('/')? origin : origin + '/';
    const html = await fetchText(start);
    if(!html) return [start];
    const doc = parseHTML(html); if(!doc) return [start];
    const anchors = Array.from(doc.querySelectorAll('a[href]')).map(a=> a.getAttribute('href')).filter(Boolean);
    const canon = new Set();
    for(const href of anchors){
      let u; try{ u = new URL(href, start).toString(); }catch(e){ continue; }
      if(sameHost(u, start)) canon.add(u.split('#')[0]);
      if(canon.size >= 40) break;
    }
    return [start, ...Array.from(canon)].slice(0, CFG.maxPagesPerDomain);
  }
  async function pullPages(list){
    const pages = [];
    for(const url of list.slice(0, CFG.maxPagesPerDomain)){
      const txt = await fetchText(url);
      if(!txt) continue;
      let title = (txt.match(/<title[^>]*>([^<]+)<\/title>/i) || [])[1] || '';
      title = title.replace(/\s+/g,' ').trim();
      let desc = (txt.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"]+)["']/i) || [])[1] || '';
      if(!desc){
        const bodyTxt = txt.replace(/<script[\s\S]*?<\/script>/gi,' ')
                           .replace(/<style[\s\S]*?<\/style>/gi,' ')
                           .replace(/<[^>]+>/g,' ')
                           .replace(/\s+/g,' ')
                           .trim();
        desc = bodyTxt.slice(0, 700);
      }
      pages.push({url, title, text: desc});
      if(pages.length >= CFG.maxPagesPerDomain) break;
      await sleep(CFG.fetchPauseMs);
    }
    return pages;
  }
  async function learnOneSite(origin){
    try{
      const originKey = (new URL(origin)).origin;
      const candidates = [
        originKey + '/sitemap.xml',
        originKey + '/sitemap_index.xml',
        originKey + '/sitemap.xml.gz'
      ];
      let urls = [];
      for(const c of candidates){
        try{
          const got = await readSitemap(c);
          if(got && got.length){ urls = got; break; }
        }catch(e){}
      }
      if(!urls.length){
        urls = await fallbackCrawl(originKey);
      }
      const uniq = Array.from(new Set(urls.map(u=> { try{ return new URL(u).toString().split('#')[0]; }catch(e){ return null; }})
        .filter(Boolean).filter(u=> sameHost(u, originKey))));
      const pages = await pullPages(uniq.slice(0, CFG.maxPagesPerDomain));
      return {domain: originKey, ts: nowSec(), pages};
    }catch(e){ return null; }
  }
  function loadLearnCache(){ return safe(localStorage.getItem(K.learn)) || {}; }
  function saveLearnCache(obj){ try{ localStorage.setItem(K.learn, JSON.stringify(obj)); }catch(e){} }
  function isExpired(ts,h){ if(!ts) return true; const ageHr=(nowSec()-ts)/3600; return ageHr >= (h||CFG.refreshHours); }

  async function learnSites(listOrigins, force=false){
    if(!Array.isArray(listOrigins)) listOrigins = [];
    const cache = loadLearnCache();
    const results = {};
    let totalPages = 0;
    const origins = listOrigins.slice(0, 12);
    for(const origin of origins){
      try{
        const u = toURL(origin); if(!u) continue;
        const key = u.origin;
        const cached = cache[key];
        if(!force && cached && !isExpired(cached.ts, CFG.refreshHours) && Array.isArray(cached.pages) && cached.pages.length){
          results[key] = cached;
          totalPages += cached.pages.length;
          if(totalPages >= CFG.maxTotalPages) break;
          continue;
        }
        const data = await learnOneSite(key);
        if(data && data.pages && data.pages.length){
          cache[key] = data;
          saveLearnCache(cache);
          results[key] = data;
          totalPages += data.pages.length;
        }
        if(totalPages >= CFG.maxTotalPages) break;
      }catch(e){}
    }
    saveLearnCache(cache);
    return results;
  }

  function getIndex(){
    const cache = loadLearnCache();
    const out = [];
    Object.keys(cache).forEach(domain=>{
      const p = cache[domain] && cache[domain].pages || [];
      p.forEach(pg => out.push(Object.assign({domain}, pg)));
    });
    return out;
  }
  function clearLearnCache(){ try{ localStorage.removeItem(K.learn); }catch(e){} }

  // ===== Context search trong index =====
  function scoreIndex(q){
    const idx = getIndex();
    if(!idx.length) return [];
    const tokens = q.toLowerCase().split(/\s+/).filter(Boolean);
    if(!tokens.length) return [];
    const scored = idx.map(it=>{
      const text = ((it.title||'') + ' ' + (it.text||'')).toLowerCase();
      let score=0;
      for(const t of tokens) if(text.includes(t)) score++;
      return Object.assign({score}, it);
    }).filter(x=> x.score>0).sort((a,b)=> b.score - a.score).slice(0,5);
    try{ localStorage.setItem(K.ctx, JSON.stringify(scored)); }catch(e){}
    return scored;
  }

  // ===== Rule base trả lời nhanh (NaturalTone) =====
  const QUICK = {
    contact: () => `Liên hệ nhanh: ${CFG.phone} • Zalo: ${CFG.zalo} • Bản đồ: ${CFG.map}`,
    hours:   () => `Mở cửa 09:00–21:00 mỗi ngày.`,
    docs:    () => `Thủ tục gọn: CCCD hoặc hộ chiếu. Cọc tùy xe. Có phương án giảm cọc khi đủ giấy tờ.`,
    delivery:() => `Có giao tận nơi trong Hà Nội. Phí tùy khu vực, thường 50k–150k. Gọi ${CFG.phone} để chốt nhanh.`,
    month:   () => `Thuê theo tháng tiết kiệm hơn, khoảng 1.2–2 triệu tùy dòng xe và tình trạng xe.`,
  };

  function ruleBased(q, ctxHint){
    const m = q.toLowerCase();

    if(/(liên hệ|lien he|zalo|hotline|gọi|call|sđt|sdt)/i.test(m)) return QUICK.contact();
    if(/(giờ|gio|mở cửa|open|closing)/i.test(m)) return QUICK.hours();
    if(/(thủ tục|thu tuc|giấy tờ|giay to|cọc|đặt cọc)/i.test(m)) return QUICK.docs();
    if(/(giao|ship|deliver|tận nơi|giao xe)/i.test(m)) return QUICK.delivery();
    if(/(tháng|month|thuê tháng)/i.test(m)) return QUICK.month();

    // Giá
    if(/(giá|bao nhiêu|tính tiền|cost|price|thuê|thue)/i.test(m) || CHEAP_KWS.test(m)) return estimatePrice(q);

    // Tên xe cụ thể
    const type = detectType(m) || (ctxHint && ctxHint.mType);
    if(type){
      const sum = summariseType(type);
      if(sum) return `Giá ${type}: ${sum}. Muốn xem xe nào thì nhắn tên model.`;
    }

    // Địa chỉ / map
    if(/(địa chỉ|dia chi|ở đâu|o dau|address|map|bản đồ)/i.test(m)) return `Địa chỉ: 112 Nguyễn Văn Cừ, Bồ Đề, Long Biên. Bản đồ: ${CFG.map}`;

    return null;
  }

  // ===== Composer: kết hợp SmartContext + Index + Rule =====
  function compose(q){
    const ctx = getLastUserTopic(6);
    // Ưu tiên rule nhanh
    const r = ruleBased(q, ctx);
    if(r) return Tone.clean(r);

    // Thử bắn vào index
    const scored = scoreIndex(q);
    if(scored && scored.length){
      const top = scored[0];
      const snippet = (top.title?`${top.title} — `:'') + (top.text||'').slice(0, 220);
      return Tone.clean(`${snippet} ... Xem chi tiết: ${top.url}`);
    }

    // Nếu người dùng hỏi tiếp nhưng mơ hồ -> nối tiếp theo mType/mQty
    if(!r && (ctx.mType || ctx.mQty)){
      let follow = '';
      if(ctx.mType) follow += `Quan tâm ${ctx.mType}. `;
      if(ctx.mQty){ const {n,unit}=ctx.mQty; const label=unit==='day'?`${n} ngày`:unit==='week'?`${n} tuần`:`${n} tháng`; follow += `Thời gian ${label}. `; }
      const tail = estimatePrice(q);
      return Tone.clean(`${follow}${tail}`);
    }

    return Tone.clean(`Chưa rõ yêu cầu. Bạn nói rõ loại xe và thời gian thuê để mình báo nhanh.`);
  }

  // ===== Gửi bot kiểu mềm: tách câu dài thành 2 đoạn =====
  async function sendBot(text){
    if(!text) return;
    const trimmed = text.trim();
    if(trimmed.length <= 180){ addMsg('bot', trimmed); return; }
    // tách theo dấu chấm/câu
    const parts = trimmed.split(/(?<=[.!?])\s+/).filter(Boolean);
    if(parts.length===1){ addMsg('bot', trimmed); return; }
    const first = parts[0];
    const rest  = parts.slice(1).join(' ');
    addMsg('bot', first);
    await sleep( clamp(400 + first.length*4, 600, 1400) );
    addMsg('bot', rest);
  }

  // ===== Bind tags & input =====
  function bindScrollTags(){
    const track = $('#mta27-tagTrack'); const box = $('#mta27-tags'); if(!track||!box) return;
    track.querySelectorAll('button').forEach(b=>{
      b.addEventListener('click', ()=> sendUser(b.dataset.q));
    });
    const updateFade = ()=>{
      const left = track.scrollLeft > 2;
      const right = (track.scrollWidth - track.clientWidth - track.scrollLeft) > 2;
      const fl = box.querySelector('.fade-left'); const fr = box.querySelector('.fade-right');
      if(fl) fl.style.opacity = left ? '1' : '0';
      if(fr) fr.style.opacity = right ? '1' : '0';
    };
    track.addEventListener('scroll', updateFade, {passive:true});
    setTimeout(updateFade, 80);

    const input = $('#mta27-in');
    if(input){
      input.addEventListener('focus', ()=> box.classList.add('hidden'));
      input.addEventListener('blur',  ()=> { if(!input.value.trim()) box.classList.remove('hidden'); });
      input.addEventListener('input', ()=> { if(input.value.trim().length>0) box.classList.add('hidden'); else box.classList.remove('hidden'); });
    }
  }

  // ===== Open/Close/Clear =====
  let isOpen=false, sending=false;
  function openChat(){
    if(isOpen) return;
    $('#mta27-card').classList.add('open');
    $('#mta27-backdrop').classList.add('show');
    $('#mta27-bubble').style.display='none';
    isOpen=true; renderSess();
    // Tránh focus auto trên iOS (đỡ bật keyboard ngay)
    // setTimeout(()=>{ try{ $('#mta27-in').focus({preventScroll:true}); }catch(e){} }, 180);
  }
  function closeChat(){
    if(!isOpen) return;
    $('#mta27-card').classList.remove('open');
    $('#mta27-backdrop').classList.remove('show');
    $('#mta27-bubble').style.display='flex';
    isOpen=false; hideTyping();
  }
  function clearChat(){
    try{ localStorage.removeItem(K.sess); localStorage.removeItem(K.ctx); }catch(e){}
    $('#mta27-body').innerHTML='';
    addMsg('bot', 'Đã xóa cuộc trò chuyện. Bắt đầu lại nhé.');
  }

  async function sendUser(text){
    if(sending) return; sending=true;
    const v = (text||'').trim(); if(!v){ sending=false; return; }
    addMsg('user', v);
    showTyping();
    // chấm điểm index trước để tận dụng cache
    try{ scoreIndex(v); }catch(e){}
    const typingDelay = clamp(700 + v.length*8, 1500, 3200);
    await sleep(typingDelay);
    let ans;
    try{ ans = compose(v); }catch(e){ ans = 'Xin lỗi, có lỗi xử lý. Bạn gọi giúp số '+CFG.phone+' để mình hỗ trợ nhanh.'; }
    hideTyping();
    await sendBot(ans);
    sending=false;
  }

  // ===== Auto-avoid chồng chéo footer/keyboard =====
  function checkObstacles(){
    const root = $('#mta27-root'); if(!root) return;
    let bottom = 'calc(18px + env(safe-area-inset-bottom, 0))';
    const blockers = document.querySelector('.bottom-appbar, .quick-call, #quick-call, .app-bottom-nav');
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

  // ===== Boot =====
  ready(async ()=>{
    const hour=new Date().getHours(); if(hour>19||hour<6) document.body.classList.add('ai-night');
    injectUI(); bindScrollTags(); checkObstacles();
    // Bind UI handlers
    $('#mta27-bubble').addEventListener('click', ()=>{ openChat(); });
    $('#mta27-backdrop').addEventListener('click', closeChat);
    $('#mta27-close').addEventListener('click', closeChat);
    $('#mta27-clear').addEventListener('click', clearChat);
    $('#mta27-send').addEventListener('click', ()=>{ const v=($('#mta27-in').value||'').trim(); if(!v) return; $('#mta27-in').value=''; sendUser(v); });
    $('#mta27-in').addEventListener('keydown',(e)=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); const v=($('#mta27-in').value||'').trim(); if(!v) return; $('#mta27-in').value=''; sendUser(v); }});
    window.addEventListener('resize', checkObstacles, {passive:true});
    window.addEventListener('scroll', checkObstacles, {passive:true});
    if(window.visualViewport) window.visualViewport.addEventListener('resize', checkObstacles, {passive:true});
    setTimeout(()=>{ if(!$('#mta27-bubble')) injectUI(); }, 2200);

    console.log('%cMotoAI v27a — SmartContext + NaturalTone (No-API)', 'color:#0084FF;font-weight:700;');

    // AutoLearn (không chặn UI)
    if(CFG.autolearn){
      const sites = Array.from(new Set([location.origin, ...(CFG.extraSites||[])]));
      (async()=>{
        try{
          await learnSites(sites, false);
          console.log('MotoAI v27a: Learn done. Index size:', getIndex().length);
        }catch(e){ console.warn('MotoAI v27a learn error', e); }
      })();
    }
  });

  // ===== Expose API =====
  window.MotoAI_v27a = {
    open: ()=>{ try{ openChat(); }catch(e){} },
    close: ()=>{ try{ closeChat(); }catch(e){} }
  };
  window.MotoAI_v27a_learn = {
    learnNow: async function(sites, force){
      try{
        const list = Array.isArray(sites) && sites.length ? sites : (CFG.extraSites||[]);
        const combined = Array.from(new Set([location.origin, ...list]));
        const res = await learnSites(combined, !!force);
        return res;
      }catch(e){ return null; }
    },
    getIndex: function(){ return getIndex(); },
    clearLearnCache: function(){ clearLearnCache(); }
  };
})();
