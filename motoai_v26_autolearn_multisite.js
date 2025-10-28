/* motoai_v26_scrollsafe.js
   UI Messenger ổn định (từ v22c) • AutoLearn MultiSite • SmartCalc • UltraSafe
   - Giao diện (HTML/CSS) và xử lý thanh tag (ẩn/hiện khi focus) lấy từ v22c ổn định.
   - Giữ toàn bộ "bộ não" thông minh của v26:
     • Học nhiều website: sitemap.xml + sitemap_index.xml (+ fallback quét link nội bộ)
     • Cache localStorage theo domain, tự refresh mỗi 24 giờ
   - Giữ: SmartCalc v26, auto-avoid footer/quick-call, iOS keyboard fix, dark/light, session
   - Delay trả lời: 2.5–5s, văn phong lịch sự, nhân viên hỗ trợ
*/
(function(){
  if (window.MotoAI_v26_SCROLLSAFE_LOADED) return;
  window.MotoAI_v26_SCROLLSAFE_LOADED = true;

  /* =========================
     1) CONFIG (từ v26 - có thể override)
  ==========================*/
  const DEF = {
    brand: "Motoopen",
    phone: "0857255868",
    zalo:  "https://zalo.me/0857255868",
    map:   "https://maps.app.goo.gl/2icTBTxAToyvKTE78",
    autolearn: true,
    extraSites: ["https://motoopen.github.io/chothuexemayhanoi/"], // nhiều domain
    crawlDepth: 1,              // fallback khi không có sitemap
    refreshHours: 24,           // tự làm mới sau X giờ
    minSentenceLen: 24
  };
  const ORG = (window.MotoAI_CONFIG||{});
  if(!ORG.zalo && (ORG.phone||DEF.phone)) ORG.zalo = 'https://zalo.me/' + String(ORG.phone||DEF.phone).replace(/\s+/g,'');
  const CFG = Object.assign({}, DEF, ORG);

  /* =========================
     2) UTILS (từ v26)
  ==========================*/
  const $  = s => document.querySelector(s);
  const safe = s => { try{return JSON.parse(s)}catch(_){return null} };
  const sleep = ms => new Promise(r=>setTimeout(r,ms));
  const pick  = a => a[Math.floor(Math.random()*a.length)];
  const nfVND = n => (n||0).toLocaleString('vi-VN');
  const nowSec = ()=> Math.floor(Date.now()/1000);
  const toURL  = (u)=> { try{ return new URL(u); }catch(_){ return null; } };
  const sameHost = (u, origin)=> { try{ return new URL(u).host === new URL(origin).host; }catch(_){ return false; } };

  /* =========================
     3) UI (HTML/CSS từ v22c - Ổn định)
  ==========================*/
  const ui = `
  <div id="mta-root" aria-live="polite">
    <button id="mta-bubble" aria-label="Mở chat" title="Chat">
      <svg viewBox="0 0 64 64" width="28" height="28" aria-hidden="true">
        <defs><linearGradient id="mtaG" x1="0" x2="1"><stop offset="0%" stop-color="#0084FF"/><stop offset="100%" stop-color="#00B2FF"/></linearGradient></defs>
        <circle cx="32" cy="32" r="28" fill="url(#mtaG)"></circle>
        <path d="M20 36l9-11 6 6 9-9-9 14-6-6-9 6z" fill="#fff"></path>
      </svg>
    </button>
    <div id="mta-backdrop"></div>
    <section id="mta-card" role="dialog" aria-label="Chat MotoAI" aria-hidden="true">
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

      <!-- Scrollable tags (từ v22c) -->
      <div id="mta-tags" role="toolbar" aria-label="Gợi ý nhanh (kéo ngang)">
        <div class="tag-track" id="tagTrack">
          <button data-q="Xe số">🏍️ Xe số</button>
          <button data-q="Xe ga">🛵 Xe ga</button>
          <button data-q="Xe điện">⚡ Xe điện</button>
          <button data-q="50cc">🚲 50cc</button>
          <button data-q="Xe côn tay">🏍️ Côn tay</button>
          <button data-q="Thủ tục">📄 Thủ tục</button>
          <button data-q="Bảng giá">💰 Bảng giá</button>
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

  const css = `
  :root{--mta-z:2147483647;--m-blue:#0084FF;--m-blue2:#00B2FF;--m-bg:#fff;--m-text:#0b1220}
  #mta-root{position:fixed;right:16px;left:auto;bottom:calc(18px + env(safe-area-inset-bottom,0));z-index:var(--mta-z);font-family:-apple-system,system-ui,Segoe UI,Roboto,"Helvetica Neue",Arial;transition:bottom .25s ease,right .25s ease}
  #mta-bubble{width:60px;height:60px;border:none;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 10px 26px rgba(0,0,0,.2);outline:3px solid #fff}
  #mta-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.2);opacity:0;pointer-events:none;transition:opacity .18s ease}
  #mta-backdrop.show{opacity:1;pointer-events:auto}
  #mta-card{position:fixed;right:16px;bottom:16px;width:min(420px,calc(100% - 24px));height:70vh;max-height:740px;background:var(--m-bg);color:var(--m-text);border-radius:18px;box-shadow:0 14px 40px rgba(0,0,0,.25);transform:translateY(110%);opacity:.99;display:flex;flex-direction:column;overflow:hidden;transition:transform .20s cubic-bezier(.22,1,.36,1)}
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
  .m-msg{max-width:80%;margin:8px 0;padding:9px 12px;border-radius:18px;line-height:1.45;box-shadow:0 1px 2px rgba(0,0,0,.05)}
  .m-msg.bot{background:#fff;color:#111;border:1px solid rgba(0,0,0,.04)}
  .m-msg.user{background:#0084FF;color:#fff;margin-left:auto;border:1px solid rgba(0,0,0,.05)}
  #mta-typing{display:inline-flex;gap:6px;align-items:center}
  #mta-typing-dots{display:inline-block;min-width:14px} /* CSS cho typing dots v22c */

  /* Scrollable Tags (từ v22c) */
  #mta-tags{position:relative;background:#f7f9fc;border-top:1px solid rgba(0,0,0,.06);transition:max-height .22s ease, opacity .18s ease}
  /* Đây là class quan trọng bị thiếu ở v26 */
  #mta-tags.hidden{max-height:0; opacity:0; overflow:hidden;}
  #mta-tags .tag-track{display:block;overflow-x:auto;white-space:nowrap;padding:8px 10px 10px 10px;scroll-behavior:smooth}
  #mta-tags button{display:inline-block;margin-right:8px;padding:8px 12px;border:none;border-radius:999px;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.06);border:1px solid rgba(0,0,0,.08);font-weight:700;cursor:pointer}
  #mta-tags button:active{transform:scale(.98)}
  #mta-tags .fade{position:absolute;top:0;bottom:0;width:22px;pointer-events:none}
  #mta-tags .fade-left{left:0;background:linear-gradient(90deg,#f7f9fc,rgba(247,249,252,0))}
  #mta-tags .fade-right{right:0;background:linear-gradient(270deg,#f7f9fc,rgba(247,249,252,0))}

  #mta-input{display:flex;gap:8px;padding:10px;background:#fff;border-top:1px solid rgba(0,0,0,.06)}
  #mta-in{flex:1;padding:11px 12px;border-radius:20px;border:1px solid rgba(0,0,0,.12);font-size:15px;background:#F6F8FB}
  #mta-send{width:42px;height:42px;border:none;border-radius:50%;background:linear-gradient(90deg,#0084FF,#00B2FF);color:#fff;font-weight:800;cursor:pointer;box-shadow:0 6px 18px rgba(0,132,255,.35)}
  #mta-clear{position:absolute;top:10px;right:48px;background:none;border:none;font-size:16px;color:#fff;opacity:.9;cursor:pointer}

  @media(max-width:520px){ #mta-card{width:calc(100% - 16px);right:8px;left:8px;height:72vh} #mta-bubble{width:56px;height:56px} }
  @media(prefers-color-scheme:dark){
    :root{--m-bg:#1b1c1f;--m-text:#eaeef3}
    #mta-body{background:#1f2127}
    .m-msg.bot{background:#2a2d34;color:#eaeef3;border:1px solid rgba(255,255,255,.06)}
    #mta-in{background:#16181c;color:#f0f3f7;border:1px solid rgba(255,255,255,.12)}
    #mta-tags{background:#1f2127;border-top:1px solid rgba(255,255,255,.08)}
    #mta-tags button{background:#2a2d34;color:#eaeef3;border:1px solid rgba(255,255,255,.10)}
    #mta-input{background:#202226;border-top:1px solid rgba(255,255,255,.08)} /* Thêm input dark */
  }
  .ai-night #mta-bubble{box-shadow:0 0 18px rgba(0,132,255,.35)!important;}
  `;

  function injectUI(){
    if($('#mta-root')) return;
    const wrap = document.createElement('div'); wrap.innerHTML = ui; document.body.appendChild(wrap.firstElementChild);
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  }

  /* =========================
     4) STATE + SESSION (từ v26)
  ==========================*/
  let isOpen=false, sending=false;
  const K = {
    sess: 'MotoAI_v26_session',
    learn: 'MotoAI_v26_learn',
    ts: 'MotoAI_v26_learn_ts'  // timestamp lưu lần học gần nhất
  };

  function addMsg(role,text){
    if(!text) return;
    const el = document.createElement('div'); el.className = 'm-msg '+(role==='user'?'user':'bot'); el.textContent = text;
    $('#mta-body').appendChild(el); $('#mta-body').scrollTop = $('#mta-body').scrollHeight;
    try{
      const arr=safe(localStorage.getItem(K.sess))||[];
      arr.push({role,text,t:Date.now()});
      localStorage.setItem(K.sess, JSON.stringify(arr.slice(-200)));
    }catch(_){}
  }
  function renderSess(){
    const body=$('#mta-body'); if(!body) return;
    body.innerHTML='';
    const arr=safe(localStorage.getItem(K.sess))||[];
    if(arr.length){ arr.forEach(m=> addMsg(m.role,m.text)); }
    else addMsg('bot', `Xin chào 👋, em là nhân viên hỗ trợ của ${CFG.brand}. Anh/chị muốn xem 🏍️ Xe số, 🛵 Xe ga, ⚡ Xe điện hay 📄 Thủ tục thuê xe ạ?`);
  }

  /* =========================
     5) TYPING DOTS (từ v22c) + POLITE (từ v26)
  ==========================*/
  // ===== Typing dots (từ v22c)
  let typingBlinkTimer=null;
  function showTyping(){
    const d=document.createElement('div'); d.id='mta-typing'; d.className='m-msg bot'; d.textContent='Đang nhập ';
    const dot=document.createElement('span'); dot.id='mta-typing-dots'; dot.textContent='…';
    d.appendChild(dot); $('#mta-body').appendChild(d); $('#mta-body').scrollTop=$('#mta-body').scrollHeight;
    let i=0; typingBlinkTimer=setInterval(()=>{ dot.textContent='.'.repeat((i++%3)+1); }, 400);
  }
  function hideTyping(){ const d=$('#mta-typing'); if(d) d.remove(); if(typingBlinkTimer){ clearInterval(typingBlinkTimer); typingBlinkTimer=null; } }

  // ===== Polite Engine (từ v26)
  const PREFIX = ["Chào anh/chị,","Xin chào 👋,","Em chào anh/chị nhé,","Rất vui được hỗ trợ anh/chị,"];
  const SUFFIX = [" ạ."," nhé ạ."," nha anh/chị."," ạ, cảm ơn anh/chị."];
  const CHEAP_KWS = /(rẻ|giá rẻ|rẻ nhất|bình dân|sinh viên|hssv|xe rẻ)/i;

  function polite(t){
    t=(t||"").trim(); if(!t) return "Em chưa nhận được câu hỏi, anh/chị thử nhập lại giúp em nhé.";
    const withDot = /[.!?…]$/.test(t)? t : (t+'.');
    return `${pick(PREFIX)} ${withDot}${pick(SUFFIX)}`;
  }

  /* =========================
     6) SMARTCALC (từ v26)
  ==========================*/
  const PRICE_TABLE = {
    'xe số':      { day:[130000,150000], week:[600000], month:[1000000,1200000] },
    'air blade':  { day:[200000], week:[800000], month:[1400000] },
    'vision':     { day:[200000], week:[900000], month:[2000000] },
    'xe điện':    { day:[200000], week:[800000], month:[1500000] },
    '50cc':       { day:[200000], week:[800000], month:[1800000] },
    'xe côn tay': { day:[350000], week:[1200000], month:[2500000] },
    'xe giá rẻ':  { day:[100000], week:[500000], month:[900000] }
  };
  function detectType(t){
    const low=t.toLowerCase();
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
  const formatRange = (arr)=> arr?.length ? (arr.length===1? nfVND(arr[0])+'đ' : nfVND(arr[0])+'–'+nfVND(arr[1])+'đ') : null;
  const baseFor = (type,unit)=> { const it=PRICE_TABLE[type]; if(!it) return null; const arr=it[unit]; return arr?arr[0]:null; };
  const summariseType = (type)=>{ const it=PRICE_TABLE[type]; if(!it) return ''; const d=formatRange(it.day), w=formatRange(it.week), m=formatRange(it.month); return [d&&d+'/ngày', w&&w+'/tuần', m&&m+'/tháng'].filter(Boolean).join(', '); };
  function estimatePrice(text){
    let type = detectType(text) || 'xe số';
    const qty = detectQty(text);
    if(!qty) return `Giá ${type} khoảng ${summariseType(type)}. Anh/chị có thể liên hệ Zalo ${CFG.phone} để xem xe và nhận giá chính xác nhất ạ.`;
    const unit=qty.unit, n=qty.n, base=baseFor(type,unit);
    if(!base) return `Giá theo ${unit} của ${type} hiện chưa có trong bảng. Anh/chị liên hệ Zalo ${CFG.phone} để báo giá chính xác giúp em nhé.`;
    const total=base*n, label=unit==='day'?`${n} ngày`:unit==='week'?`${n} tuần`:`${n} tháng`;
    return `Giá dự kiến thuê ${type} ${label} khoảng ${nfVND(total)}đ ạ (ước tính). Anh/chị có thể liên hệ Zalo ${CFG.phone} để xem xe và nhận giá chính xác nhất ạ.`;
  }

  /* =========================
     7) AUTOLEARN – MULTISITE (từ v26)
  ==========================*/
  async function fetchText(url, opts={}){
    try{
      const res = await fetch(url, {mode:'cors', credentials:'omit', ...opts});
      if(!res.ok) throw new Error(res.status);
      return await res.text();
    }catch(_){ return null; }
  }
  function parseXML(text){
    try{ return (new window.DOMParser()).parseFromString(text,'text/xml'); }catch(_){ return null; }
  }
  function getDomainKey(u){ try{ return new URL(u).origin; }catch(_){ return null; } }

  async function readSitemap(url){
    const xmlTxt = await fetchText(url);
    if(!xmlTxt) return [];
    const doc = parseXML(xmlTxt); if(!doc) return [];
    // sitemapindex
    const idx = Array.from(doc.getElementsByTagName('sitemap')).map(x=> x.getElementsByTagName('loc')?.[0]?.textContent?.trim()).filter(Boolean);
    if(idx.length){
      const all=[]; for(const loc of idx){ all.push(...await readSitemap(loc)); } return all;
    }
    // urlset
    const urls = Array.from(doc.getElementsByTagName('url')).map(u=> u.getElementsByTagName('loc')?.[0]?.textContent?.trim()).filter(Boolean);
    return urls;
  }

  async function fallbackCrawl(origin, depth=1){
    const start = origin.endsWith('/')? origin : origin+'/';
    const html = await fetchText(start); if(!html) return [start];
    const a = document.createElement('div'); a.innerHTML = html;
    const links = Array.from(a.querySelectorAll('a[href]')).map(e=> e.getAttribute('href')).filter(Boolean);
    const canon = new Set();
    for(const href of links){
      let u;
      try{ u = new URL(href, start).toString(); }catch(_){ continue; }
      if(sameHost(u, start)) canon.add(u.split('#')[0]);
      if(canon.size>40) break;
    }
    return [start, ...Array.from(canon)].slice(0, 40);
  }

  async function pullPages(list){
    const pages=[];
    for(const url of list){
      const txt = await fetchText(url);
      if(!txt) continue;
      let title = (txt.match(/<title[^>]*>([^<]+)<\/title>/i)||[])[1]||'';
      title = title.replace(/\s+/g,' ').trim();
      let desc  = (txt.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"]+)["']/i)||[])[1]||'';
      if(!desc){
        const bodyTxt = (txt.replace(/<script[\s\S]*?<\/script>/gi,'')
                            .replace(/<style[\s\S]*?<\/style>/gi,'')
                            .replace(/<[^>]+>/g,' ')
                            .replace(/\s+/g,' ')
                            .trim()||'');
        desc = bodyTxt.slice(0, 600);
      }
      pages.push({url, title, text: desc});
      if(pages.length>80) break;
    }
    return pages;
  }

  async function learnOneSite(origin){
    const candidates = [
      origin.replace(/\/$/,'') + '/sitemap.xml',
      origin.replace(/\/$/,'') + '/sitemap_index.xml'
    ];
    let urls=[];
    for(const link of candidates){
      const got = await readSitemap(link);
      if(got?.length){ urls = got; break; }
    }
    if(!urls.length){
      urls = await fallbackCrawl(origin, CFG.crawlDepth);
    }
    const host = getDomainKey(origin); if(!host) return null;
    const uniq = Array.from(new Set(urls.filter(u=> sameHost(u, host)).map(u=> u.split('#')[0])));
    const pages = await pullPages(uniq);
    return {domain: host, ts: nowSec(), pages};
  }

  function loadCache(){
    const raw = localStorage.getItem(K.learn);
    return raw ? safe(raw) || {} : {};
  }
  function saveCache(obj){
    try{ localStorage.setItem(K.learn, JSON.stringify(obj)); }catch(_){}
  }
  function isExpired(ts, hours){
    if(!ts) return true;
    const ageHr = (nowSec() - ts)/3600;
    return ageHr >= (hours||24);
  }

  async function doAutoLearn(){
    if(!CFG.autolearn) return;
    const bases = [location.origin, ...CFG.extraSites].map(u=> {
      const U = toURL(u.endsWith('/')? u : (u+'/'));
      return U ? U.origin+'/' : null;
    }).filter(Boolean);

    const cache = loadCache();
    let changed = false;

    for(const origin of bases){
      const key = origin;
      const current = cache[key];
      if(!current || isExpired(current.ts, CFG.refreshHours)){
        const learned = await learnOneSite(origin);
        if(learned && learned.pages?.length){
          cache[key] = learned;
          changed = true;
        }
      }
    }
    if(changed) saveCache(cache);
  }

  function searchKnowledge(q){
    const cache = loadCache();
    const qlow = (q||'').toLowerCase();
    const hits = [];
    for(const key of Object.keys(cache||{})){
      const site = cache[key];
      for(const p of (site.pages||[])){
        const hay = (p.title+' '+p.text).toLowerCase();
        if(hay.includes(qlow)) hits.push({domain: site.domain, url:p.url, title:p.title});
        if(hits.length>6) break;
      }
      if(hits.length>6) break;
    }
    return hits;
  }

  /* =========================
     8) COMPOSE ANSWER (từ v26)
  ==========================*/
  const RULES = [
    {re:/(chào|xin chào|hello|hi|alo)/i, ans:[
      `em là nhân viên hỗ trợ của ${CFG.brand}. Anh/chị muốn xem 🏍️ Xe số, 🛵 Xe ga, ⚡ Xe điện hay 📄 Thủ tục thuê xe ạ?`,
      "em có thể báo giá nhanh hoặc hướng dẫn thủ tục. Anh/chị đang quan tâm loại xe nào ạ?"
    ]},
    {re:/(thủ tục|thu tuc|giay to|giấy tờ|cọc|đặt cọc)/i, ans:[
      "thủ tục gọn: CCCD/hộ chiếu + cọc tuỳ xe. Có phương án giảm cọc khi đủ giấy tờ.",
      `cần hỗ trợ nhanh anh/chị liên hệ Zalo ${CFG.phone} giúp em nhé.`
    ]},
    {re:/(liên hệ|lien he|zalo|hotline|sđt|sdt|gọi|dien thoai)/i, ans:[
      `anh/chị liên hệ nhanh qua Zalo ${CFG.phone} để được tư vấn trực tiếp nhé.`,
      `nếu cần gấp, anh/chị gọi ${CFG.phone} — bọn em phản hồi ngay ạ.`
    ]}
  ];

  function rule(q){ for(const r of RULES){ if(r.re.test(q)) return polite(pick(r.ans)); } return null; }

  function compose(q){
    const m=(q||'').trim(); if(!m) return polite("anh/chị thử chọn tag phía dưới hoặc nhập câu hỏi giúp em nhé");
    const r1=rule(m); if(r1) return r1;

    if(/(giá|bao nhiêu|tính tiền|bao nhieu|bao nhiều|cost|price|thuê|thue)/i.test(m) || CHEAP_KWS.test(m)) {
      return polite(estimatePrice(m) + ` Liên hệ Zalo ${CFG.phone} để xem xe và nhận giá chính xác ạ.`);
    }

    // Nếu không có rule/price: tra knowledge đa-site
    const hits = searchKnowledge(m);
    if(hits.length){
      const lines = hits.slice(0,4).map(h=>`• ${h.title? h.title+' – ' : ''}${h.url}`);
      return polite(`em có tìm được vài nội dung phù hợp:\n${lines.join('\n')}\nAnh/chị cần em tóm tắt mục nào không ạ?`);
    }

    return polite("em chưa tìm được thông tin trùng khớp. Anh/chị nói rõ loại xe hoặc thời gian thuê giúp em với ạ.");
  }

  /* =========================
     9) OPEN/CLOSE/CLEAR + EVENTS (Gộp v26 + v22c)
  ==========================*/
  function openChat(){
    if(isOpen) return;
    $('#mta-card').classList.add('open');
    $('#mta-backdrop').classList.add('show');
    $('#mta-bubble').style.display='none';
    isOpen=true; renderSess();
    setTimeout(()=>{ try{$('#mta-in').focus()}catch(_){ } },120);
  }
  function closeChat(){
    if(!isOpen) return;
    try{$('#mta-in').blur();}catch(_){}
    $('#mta-card').classList.remove('open');
    $('#mta-backdrop').classList.remove('show');
    $('#mta-bubble').style.display='flex';
    isOpen=false; hideTyping();
  }
  function clearChat(){
    try{ localStorage.removeItem(K.sess);}catch(_){}
    $('#mta-body').innerHTML=''; addMsg('bot', polite('đã xóa hội thoại'));
  }

  // ===== bindTags (từ v22c - quan trọng)
  function bindTags(){
    const track = $('#tagTrack'); const box = $('#mta-tags'); if(!track||!box) return;
    // click tag -> gửi
    track.querySelectorAll('button').forEach(b=>{
      b.addEventListener('click', ()=> sendUser(b.dataset.q));
    });
    // fade trái/phải
    const updateFade = ()=>{
      const left = track.scrollLeft > 2;
      const right = (track.scrollWidth - track.clientWidth - track.scrollLeft) > 2;
      const fl = box.querySelector('.fade-left'); const fr = box.querySelector('.fade-right');
      if(fl) fl.style.opacity = left ? '1' : '0';
      if(fr) fr.style.opacity = right ? '1' : '0';
    };
    track.addEventListener('scroll', updateFade, {passive:true});
    setTimeout(updateFade, 80);

    // input focus -> ẩn; blur -> hiện (nếu input trống)
    // Đây là logic chính sửa lỗi UI của v26
    const input = $('#mta-in');
    if(input){
      input.addEventListener('focus', ()=> box.classList.add('hidden'));
      input.addEventListener('blur',  ()=> { if(!input.value.trim()) box.classList.remove('hidden'); });
      input.addEventListener('input', ()=> { if(input.value.trim().length>0) box.classList.add('hidden'); else box.classList.remove('hidden'); });
    }
  }

  // ===== sendUser (từ v26 - gọi hàm compose thông minh)
  async function sendUser(text){
    if(sending) return; sending=true;
    addMsg('user', text);
    showTyping();
    const typingDelay = 2500 + Math.random()*2500; await sleep(typingDelay);
    let ans; try{ ans = compose(text); }catch(_){ ans = null; }
    hideTyping(); addMsg('bot', ans || polite(`xin lỗi, có lỗi khi trả lời. Anh/chị liên hệ Zalo ${CFG.phone} giúp em nhé.`));
    sending=false;
  }

  // ===== Obstacles & Keyboard (từ v26)
  function checkObstacles(){
    const root=$('#mta-root'); if(!root) return;
    const blockers = document.querySelector('.bottom-appbar, .quick-call, #quick-call');
    let bottom='calc(18px + env(safe-area-inset-bottom, 0))';
    if(blockers){
      const r=blockers.getBoundingClientRect();
      const space = window.innerHeight - r.top;
      if(space < 120) bottom = (space + 70) + 'px';
    }
    if(window.visualViewport){
      const vv = window.visualViewport;
      if(vv.height < window.innerHeight - 120) bottom = '110px';
    }
    root.style.bottom = bottom; root.style.right='16px'; root.style.left='auto';
  }
  function fixSafariKeyboard(){
    const card = $('#mta-card');
    if(!card || !window.visualViewport) return;
    window.visualViewport.addEventListener('resize', ()=>{
      const vv = window.visualViewport;
      if(vv.height < window.innerHeight - 100){ card.style.transform='translateY(0)'; }
      else { card.style.transform = $('#mta-card').classList.contains('open') ? 'translateY(0)' : 'translateY(110%)'; }
    }, {passive:true});
  }

  /* =========================
     10) BOOT (từ v26)
  ==========================*/
  function ready(fn){
    if(document.readyState==="complete"||document.readyState==="interactive"){ fn(); }
    else document.addEventListener("DOMContentLoaded", fn);
  }

  ready(async ()=>{
    const hour=new Date().getHours(); if(hour>19||hour<6) document.body.classList.add('ai-night');

    injectUI();
    bindTags(); // <- Đã thay bằng hàm của v22c

    // Bind chat events
    $('#mta-bubble').addEventListener('click', openChat);
    $('#mta-backdrop').addEventListener('click', closeChat);
    $('#mta-close').addEventListener('click', closeChat);
    $('#mta-clear').addEventListener('click', clearChat);
    $('#mta-send').addEventListener('click', ()=>{ const v=($('#mta-in').value||'').trim(); if(!v) return; $('#mta-in').value=''; sendUser(v); });
    $('#mta-in').addEventListener('keydown',(e)=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); const v=($('#mta-in').value||'').trim(); if(!v) return; $('#mta-in').value=''; sendUser(v); }});

    // Auto-avoid & iOS (từ v26)
    checkObstacles();
    window.addEventListener('resize', checkObstacles, {passive:true});
    window.addEventListener('scroll', checkObstacles, {passive:true});
    if(window.visualViewport) window.visualViewport.addEventListener('resize', checkObstacles, {passive:true});
    fixSafariKeyboard();

    // AutoLearn (đa site) (từ v26)
    try{ await doAutoLearn(); }catch(_){}

    // Watchdog
    setTimeout(()=>{ if(!$('#mta-bubble')) injectUI(); }, 2500);

    console.log('%cMotoAI v26 ScrollSafe (Merged v22c UI) — Active','color:#0084FF;font-weight:bold;');
  });

  // Mini API (từ v26)
  window.MotoAI_v26 = { open: ()=>{ try{openChat()}catch(_){ } }, close: ()=>{ try{closeChat()}catch(_){ } } };
})();

