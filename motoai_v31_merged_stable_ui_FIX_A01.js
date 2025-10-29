/* motoai_v31_merged_stable_ui_FIX_A01.js
   MOTOAI v31 (Gộp theo yêu cầu - Sửa lỗi UX + HOTFIX A01)
   - UI Engine: Lấy 100% của v26/v22c (Giao diện Messenger ổn định, né vật cản, an toàn iOS)
   - AI Engine:  Lấy 100% của v31 (SmartPolite, SmartPricing, Bilingual, Memory, AutoLearn sâu)
   - Hotfix A01: Đảm bảo bong bóng né vật cản (quick call) ngay khi load trang.
   - Tác giả: Motoopen (Tuấn Tú) - Gộp và Sửa lỗi bởi AI
*/
(function(){
  // ===== Guard (Lấy từ v31)
  if (window.MotoAI_v31_MULTI_LOADED) return;
  window.MotoAI_v31_MULTI_LOADED = true;

  /* ====== 1) CONFIG (Lấy từ v31, BỎ các tùy chọn vị trí) ====== */
  const DEF = {
    brand: "Thuê Xe Máy Hà Nội",
    phone: "0857255868",
    zalo:  "https://zalo.me/0857255868",
    map:   "https://maps.app.goo.gl/ABCxyz",
    autolearn: true,
    extraSites: [
      "https://motoopen.github.io/chothuexemayhanoi/",
      "https://thuexemaynguyentu.com",
    ],
    crawlDepth: 1, // (giữ từ v26, dù v31 engine ko dùng)
    refreshHours: 24,
    // Thêm config của v31 engine
    maxPagesPerDomain: 80,
    maxTotalPages: 300,
    fetchTimeoutMs: 10000,
    fetchPauseMs: 180
  };
  const ORG = (window.MotoAI_CONFIG||{});
  if(!ORG.zalo && (ORG.phone||DEF.phone)) ORG.zalo = 'https://zalo.me/' + String(ORG.phone||DEF.phone).replace(/\s+/g,'');
  const CFG = Object.assign({}, DEF, ORG);

  /* ====== 2) UTILS & STORAGE (Gộp v26 + v31) ====== */
  const $  = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const safe = s => { try{return JSON.parse(s)}catch(e){return null} };
  const sleep = ms => new Promise(r=>setTimeout(r,ms));
  const pick = a => a[Math.floor(Math.random()*a.length)]; // (từ v26)
  const nfVND = n => (n||0).toLocaleString('vi-VN'); // (từ v26)
  const nowSec = () => Math.floor(Date.now()/1000); // (chung)
  const toURL = u => { try{return new URL(u);}catch(_){return null;} }; // (chung)
  const sameHost = (u,o)=>{ try{return new URL(u).host===new URL(o).host;}catch(_){return false;} }; // (chung)


  /* ====== 3) UI v22c (HTML và CSS giữ nguyên) ====== */
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
          <button data-q="Xe số">🏍️ Xe số</button>
          <button data-q="Xe ga">🛵 Xe ga</button>
          <button data-q="Xe điện">⚡ Xe điện</button>
          <button data-q="50cc">🚲 50cc</button>
          <button data-q="Xe côn tay">🏍️ Côn tay</button>
          <button data-q="Thủ tục">📄 Thủ tục</button>
          <button data-q="Bảng giá">💰 Bảng giá</button>
          <button data-q="Liên hệ">☎️ Liên hệ</button>
          <button data-q="Xe giá rẻ">💸 Xe giá rẻ</button>
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

  const css = `:root{--mta-z:2147483647;--m-blue:#0084FF;--m-blue2:#00B2FF;--m-bg:#fff;--m-text:#0b1220}
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
  #mta-typing-dots{display:inline-block;min-width:14px}
  #mta-tags{position:relative;background:#f7f9fc;border-top:1px solid rgba(0,0,0,.06);transition:max-height .22s ease, opacity .18s ease}
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
  }
  .ai-night #mta-bubble{box-shadow:0 0 18px rgba(0,132,255,.35)!important;}
  `;

  // ===== Inject/Ready (Lấy từ v26)
  function injectUI(){
    if ($('#mta-root')) return;
    const wrap = document.createElement('div'); wrap.innerHTML = ui; document.body.appendChild(wrap.firstElementChild);
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  }
  function ready(fn){
    if(document.readyState==="complete"||document.readyState==="interactive"){ fn(); }
    else document.addEventListener("DOMContentLoaded", fn);
  }

  // ===== State (Lấy từ v26, nhưng dùng keys v31)
  let isOpen=false, sending=false;
  const K = {
    sess: 'MotoAI_v31_session', // (key v31)
    learn:'MotoAI_v31_learn'    // (key v31)
  };

  // ===== Messaging (Lấy từ v26, dùng key v31)
  function addMsg(role,text){
    if(!text) return;
    const el = document.createElement('div'); el.className = 'm-msg '+(role==='user'?'user':'bot'); el.textContent = text;
    const body = $('#mta-body'); if(!body) return; // Thêm check
    body.appendChild(el); body.scrollTop = body.scrollHeight;
    try{ const arr=safe(localStorage.getItem(K.sess))||[]; arr.push({role,text,t:Date.now()}); localStorage.setItem(K.sess, JSON.stringify(arr.slice(-200))); }catch(e){}
  }
  function renderSess(){
    const body = $('#mta-body'); if(body) body.innerHTML='';
    const arr = safe(localStorage.getItem(K.sess))||[];
    if(arr.length){ arr.forEach(m=> addMsg(m.role,m.text)); }
    // Thay đổi câu chào v26 bằng câu chào v31
    else addMsg('bot', `Chào bạn 👋, mình là trợ lý của ${CFG.brand}. Bạn muốn xem 🏍️ Xe số, 🛵 Xe ga, ⚡ Xe điện hay 📄 Thủ tục?`);
  }

  // ===== Typing dots (Lấy từ v26)
  let typingBlinkTimer=null;
  function showTyping(){
    const d=document.createElement('div'); d.id='mta-typing'; d.className='m-msg bot'; d.textContent='Đang nhập ';
    const dot=document.createElement('span'); dot.id='mta-typing-dots'; dot.textContent='…';
    const body=$('#mta-body'); if(!body) return; // Thêm check
    body.appendChild(d); body.scrollTop=$('#mta-body').scrollHeight;
    let i=0; typingBlinkTimer=setInterval(()=>{ dot.textContent='.'.repeat((i++%3)+1); }, 400);
  }
  function hideTyping(){ const d=$('#mta-typing'); if(d) d.remove(); if(typingBlinkTimer){ clearInterval(typingBlinkTimer); typingBlinkTimer=null; } }

  // ===== THAY THẾ: AUT0LEARN (Lấy 100% của v31) ======
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
    const xmlTxt = await fetchText(url);
    if(!xmlTxt) return [];
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
        desc = bodyTxt.slice(0, 600);
      }
      pages.push({url, title, text: desc});
      await sleep(CFG.fetchPauseMs);
    }
    return pages;
  }
  function loadLearnCache(){ return safe(localStorage.getItem(K.learn)) || {}; }
  function saveLearnCache(obj){ try{ localStorage.setItem(K.learn, JSON.stringify(obj)); }catch(e){} }
  function isExpired(ts, hours){ if(!ts) return true; const ageHr = (nowSec() - ts)/3600; return ageHr >= (hours||CFG.refreshHours); }

  async function learnOneSite(origin){
    try{
      const canonical = origin.replace(/\/+$/,'');
      const candidates = [canonical+'/sitemap.xml', canonical+'/sitemap_index.xml', canonical+'/sitemap.xml.gz'];
      let urls = [];
      for(const c of candidates){
        try{
          const got = await readSitemap(c);
          if(got && got.length){ urls = got; break; }
        }catch(e){}
      }
      if(!urls.length){ urls = await fallbackCrawl(canonical); }
      const hostOrigin = (new URL(canonical)).origin;
      const uniq = Array.from(new Set(urls.map(u=>{ try{ return new URL(u).toString().split('#')[0]; }catch(e){ return null; } }).filter(Boolean).filter(u=> sameHost(u, hostOrigin))));
      const pages = await pullPages(uniq);
      return {origin: hostOrigin, ts: nowSec(), pages};
    }catch(e){ return null; }
  }
  async function learnSites(listOrigins, force=false){
    if(!Array.isArray(listOrigins)) listOrigins = [];
    const cache = loadLearnCache();
    let totalPages = 0; const results = {};
    const origins = listOrigins.slice(0, 12);
    for(const origin of origins){
      try{
        const u = toURL(origin); if(!u) continue;
        const key = u.origin;
        const cached = cache[key];
        if(!force && cached && !isExpired(cached.ts, CFG.refreshHours) && Array.isArray(cached.pages) && cached.pages.length){
          results[key] = cached; totalPages += cached.pages.length;
          if(totalPages >= CFG.maxTotalPages) break;
          continue;
        }
        console.log(`%cMotoAI v31: Bắt đầu AutoLearn cho ${key} (làm mới cache)...`, 'color:#0084FF;font-weight:bold;');
        const data = await learnOneSite(key);
        if(data && Array.isArray(data.pages) && data.pages.length){
          cache[key] = data; results[key] = data; totalPages += data.pages.length; saveLearnCache(cache);
          console.log(`%cMotoAI v31: AutoLearn ${key} hoàn tất!`, 'color:#0084FF;font-weight:bold;');
          if(totalPages >= CFG.maxTotalPages) break;
        }
      }catch(e){}
    }
    saveLearnCache(cache);
    return results;
  }
  // ===== HẾT PHẦN THAY THẾ AUT0LEARN ======

  // ===== THAY THẾ: SMART ENGINE (Lấy 100% của v31) ======
  const Engine = {
    phone: CFG.phone, map: CFG.map, brand: CFG.brand,
    memory: [], maxMemory: 5,

    detectLang(input){
      const viMarks = input.match(/[à-ỹÀ-Ỵ]/g)?.length || 0;
      const ascii = input.match(/[a-zA-Z]/g)?.length || 0;
      if(ascii && !viMarks) return "en";
      if(viMarks > 0) return "vi";
      const t = input.toLowerCase();
      if(/\b(how much|price|rent|delivery|hotel|contact|scooter|manual|day|week|month|days|weeks|months)\b/.test(t)) return "en";
      return "vi";
    },
    analyzeIntent(input, lang){
      const t = input.toLowerCase();
      const vi = {
        pricing: /(giá|bao nhiêu|thuê|tính tiền|bao nhieu|bao nhiu)/,
        procedure: /(thủ tục|giấy tờ|giay to|đặt cọc|dat coc)/,
        delivery: /(giao|tận nơi|khách sạn|hotel|ship|giao tận)/,
        contact:  /(liên hệ|điện thoại|sdt|zalo|whatsapp|call|phone|map|địa chỉ|dia chi)/,
        vehicle:  /(xe ga|xe số|vision|lead|wave|sirius|airblade)/
      };
      const en = {
        pricing: /(price|how much|rent|cost|rate)/,
        procedure: /(procedure|document|id card|deposit)/,
        delivery: /(deliver|delivery|hotel|drop off|pick up)/,
        contact:  /(contact|call|phone|zalo|whatsapp|map|address|location)/,
        vehicle:  /(scooter|manual|semi-auto|vision|lead|wave|sirius|airblade)/
      };
      const rule = (lang === "en") ? en : vi;
      if(rule.pricing.test(t))  return "pricing";
      if(rule.procedure.test(t))return "procedure";
      if(rule.delivery.test(t)) return "delivery";
      if(rule.contact.test(t))  return "contact";
      if(rule.vehicle.test(t))  return "vehicle";
      return "chat";
    },
    parseTime(input){
      const t = input.toLowerCase();
      if(/\b(\d+)\s*ngày\b/.test(t)) return {mode:"days", days: parseInt(t.match(/\b(\d+)\s*ngày\b/)[1],10)};
      if(/\bngày\b/.test(t)) return {mode:"days", days:1};
      if(/\btuần\b/.test(t)) return {mode:"week", days:7};
      if(/\btháng\b/.test(t)) return {mode:"month", days:30};
      if(/\b(\d+)\s*day(s)?\b/.test(t)) return {mode:"days", days: parseInt(t.match(/\b(\d+)\s*day(s)?\b/)[1],10)};
      if(/\bday\b/.test(t)) return {mode:"days", days:1};
      if(/\bweek(s)?\b/.test(t)) return {mode:"week", days:7};
      if(/\bmonth(s)?\b/.test(t)) return {mode:"month", days:30};
      if(/(\d+)/.test(t)) return {mode:"days", days: parseInt(t.match(/(\d+)/)[1],10)};
      return {mode:"days", days:1};
    },
    naturalVI(text){
      const tails = ["bạn nhé.","nha.","đó.","ha.","bạn ơi."];
      const tail = tails[Math.floor(Math.random()*tails.length)];
      return text.trim().replace(/[.!?]?$/," ")+tail;
    },
    naturalEN(text){
      const tails = ["please.","if that works for you.","alright.","okay.","thanks."];
      const tail = tails[Math.floor(Math.random()*tails.length)];
      const s = text.trim().replace(/[.!?]?$/," ");
      return s.charAt(0).toUpperCase()+s.slice(1)+tail;
    },

    kbIndex(){ const cache = safe(localStorage.getItem(K.learn)) || {}; const out=[]; Object.keys(cache).forEach(origin=>{ (cache[origin].pages||[]).forEach(pg=> out.push(Object.assign({origin}, pg))); }); return out; },
    kbSnippet(query, lang){
      const idx = this.kbIndex();
      if(!idx.length) return null;
      const q = query.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu," ").split(/\s+/).filter(x=>x.length>2);
      let best=null, score=0;
      for(const doc of idx){
        const text = ((doc.title||'') + ' ' + (doc.text||'')).toLowerCase();
        let s=0; for(const w of q){ if(text.includes(w)) s++; }
        if(s>score){ score=s; best=doc; }
      }
      if(best && score>=2){
        const sn = (best.title?`${best.title} — `:'') + (best.text||'').trim().slice(0,200).replace(/\s+/g,' ');
        return (lang==="en") ? `From our site (${best.url}): ${sn}...` : `Theo nội dung từ web (${best.url}): ${sn}...`;
      }
      return null;
    },

    replyVI(intent, tinfo){
      const {mode, days} = tinfo;
      const dailyManual=150_000,dailyScooter=200_000;
      if(intent==="pricing"){
        if(mode==="month") return "Thuê tháng khoảng 1,5–2 triệu/tháng, tuỳ dòng xe bạn chọn.";
        if(mode==="week")  return "Thuê 1 tuần bên mình giảm còn khoảng 130k/ngày; tính ra cỡ 900k/tuần.";
        if(days===1)       return "Giá thuê xe bên mình là 150k/ngày cho xe số, 200k/ngày cho xe ga.";
        if(days>=2 && days<7){
          const m=(dailyManual*days)/1000, s=(dailyScooter*days)/1000;
          return `Thuê ${days} ngày thì khoảng ${m}k cho xe số hoặc ${s}k cho xe ga.`;
        }
        if(days>=7 && days<30) return "Thuê 1 tuần giảm còn ~130k/ngày; mình có thể tính chi tiết theo mẫu xe bạn thích.";
        if(days>=30)           return "Thuê tháng thường 1,5–2 triệu/tháng; mình tư vấn theo nhu cầu của bạn.";
      }
      if(intent==="procedure") return "Thủ tục gọn, chỉ cần căn cước gốc; không cần đặt cọc. Bên mình có thể giao tận nơi.";
      if(intent==="delivery")  return "Bên mình giao xe trong nội thành Hà Nội; miễn phí với đơn từ 2 ngày trở lên.";
      if(intent==="contact"){
        const mapPart = this.map ? ` Bản đồ: ${this.map}.` : "";
        return `Bạn có thể gọi số ${this.phone} hoặc nhắn Zalo cùng số đó để được hỗ trợ nhanh nhất.${mapPart}`;
      }
      if(intent==="vehicle")   return "Bên mình có xe số (Wave, Sirius) và xe ga (Vision, Lead), xe sạch đẹp, bảo dưỡng kỹ.";
      // Fallback v31
      const kbMsg = this.kbSnippet(this.memory[this.memory.length-1]?.q || "", "vi");
      if(kbMsg) return `Em tìm thấy thông tin này: ${kbMsg}. Hoặc bạn gọi Zalo ${this.phone} để em hỗ trợ nhanh nhé.`;
      return "Bạn mô tả rõ hơn một chút để mình hỗ trợ chính xác hơn được không?";
    },
    replyEN(intent, tinfo){
      const {mode, days} = tinfo;
      const dailyManual=150_000,dailyScooter=200_000;
      if(intent==="pricing"){
        if(mode==="month") return "Monthly rentals are around 1.5–2.0 million VND/month depending on the bike model.";
        if(mode==="week")  return "For a week, the rate is ~130k VND/day; roughly ~900k VND/week.";
        if(days===1)       return "The rental price is about 150,000 VND/day for manual bikes and 200,000 VND/day for scooters.";
        if(days>=2 && days<7){
          const m=(dailyManual*days), s=(dailyScooter*days);
          return `For ${days} days, it's about ${m.toLocaleString("en-US")} VND (manual) or ${s.toLocaleString("en-US")} VND (scooter).`;
        }
        if(days>=7 && days<30) return "Weekly rentals are about 130k VND/day; I can quote precisely by model.";
        if(days>=30)           return "Monthly rentals are typically 1.5–2.0 million VND; happy to advise based on your needs.";
      }
      if(intent==="procedure") return "You only need your original ID card; no deposit required. We can deliver to your place.";
      if(intent==="delivery")  return "We deliver within Hanoi; free for rentals of 2 days or more.";
      if(intent==="contact"){
        const mapPart = this.map ? ` Map: ${this.map}.` : "";
        return `You can call or message Zalo/WhatsApp at ${this.phone} for the quickest support.${mapPart}`;
      }
      if(intent==="vehicle")   return "We have manual (Wave, Sirius) and scooters (Vision, Lead), clean and well-maintained.";
      // Fallback v31
      const kbMsg = this.kbSnippet(this.memory[this.memory.length-1]?.q || "", "en");
      if(kbMsg) return `I found this info: ${kbMsg}. Or please call Zalo/WhatsApp ${this.phone} for quick support.`;
      return "Could you share a bit more detail so I can help you better?";
    },

    async answer(input){
      const lang = this.detectLang(input);
      let intent = this.analyzeIntent(input, lang);
      
      const tinfo = this.parseTime(input);
      
      // Memory logic v31
      if(intent === "chat" && this.memory.length > 0){
        const lastIntent = this.memory[this.memory.length-1].intent;
        if(lastIntent && lastIntent !== "chat") intent = lastIntent;
      }
      
      let base = (lang==="en") ? this.replyEN(intent, tinfo) : this.replyVI(intent, tinfo);
      
      // KB Snippet logic v31 (chỉ thêm nếu intent ko phải là chat hoặc contact)
      if(intent !== "chat" && intent !== "contact") {
         const kbMsg = this.kbSnippet(input, lang);
         if(kbMsg){
            base += (lang==="en" ? " More info: " : " Tham khảo thêm: ") + kbMsg;
         }
      }

      const final = (lang==="en") ? this.naturalEN(base) : this.naturalVI(base);
      this.memory.push({q:input,a:final,intent,lang});
      if(this.memory.length > this.maxMemory) this.memory.shift();
      return final;
    }
  };
  // ===== HẾT PHẦN THAY THẾ SMART ENGINE ======

  // ===== Open/Close/Clear (Lấy từ v26, sửa clearChat)
  function openChat(){ if(isOpen) return;
    $('#mta-card').classList.add('open'); $('#mta-backdrop').classList.add('show'); $('#mta-bubble').style.display='none'; isOpen=true; renderSess();
    setTimeout(()=>{ try{$('#mta-in').focus()}catch(e){} },120);
  }
  function closeChat(){ if(!isOpen) return;
    $('#mta-card').classList.remove('open'); $('#mta-backdrop').classList.remove('show'); $('#mta-bubble').style.display='flex'; isOpen=false; hideTyping();
  }
  function clearChat(){ 
    try{ 
      localStorage.removeItem(K.sess); 
      localStorage.removeItem(K.learn); // (Sửa) Xóa cả cache learn v31
    }catch(e){}; 
    $('#mta-body').innerHTML=''; 
    addMsg('bot', 'Đã xóa hội thoại và cache. Cache sẽ được học lại.'); // (Sửa) Dùng câu của v31
    
    // (Sửa) Học lại sau khi xóa (dùng logic v31)
    if(CFG.autolearn){
      const sites = Array.from(new Set([location.origin, ...(CFG.extraSites||[])]));
      (async()=>{ try{ await learnSites(sites, true); }catch(e){} })();
    }
  }

  // ===== Scroll Tags (Lấy 100% từ v26)
  function bindScrollTags(){
    const track = $('#tagTrack'); const box = $('#mta-tags'); if(!track||!box) return;
    // click tag -> gửi
    track.querySelectorAll('button').forEach(b=>{
      b.addEventListener('click', ()=> sendUser(b.dataset.q));
    });
    // fade trái/phải
    const updateFade = ()=>{
      if(!track || !box) return; // Thêm kiểm tra
      const left = track.scrollLeft > 2;
      const right = (track.scrollWidth - track.clientWidth - track.scrollLeft) > 2;
      const fl = box.querySelector('.fade-left'); const fr = box.querySelector('.fade-right');
      if(fl) fl.style.opacity = left ? '1' : '0';
      if(fr) fr.style.opacity = right ? '1' : '0';
    };
    track.addEventListener('scroll', updateFade, {passive:true});
    setTimeout(updateFade, 80); // Chạy lần đầu

    // input focus -> ẩn; blur -> hiện (nếu input trống)
    const input = $('#mta-in');
    if(input){
      input.addEventListener('focus', ()=> box.classList.add('hidden'));
      input.addEventListener('blur',  ()=> { if(!input.value.trim()) box.classList.remove('hidden'); });
      input.addEventListener('input', ()=> { if(input.value.trim().length>0) box.classList.add('hidden'); else box.classList.remove('hidden'); });
    }
  }

  // ===== Send (Lấy từ v26, SỬA để gọi Engine v31)
  async function sendUser(text){
    if(sending) return; sending=true;
    addMsg('user', text);
    showTyping(); 
    // (Sửa) Dùng delay của v31
    const typingDelay = 3000 + Math.random()*3000; await sleep(typingDelay);
    let ans; 
    try{ 
      ans = await Engine.answer(text); // (Sửa) Gọi Engine v31
    }catch(e){ 
      ans = null; 
      console.error("MotoAI Engine Error:", e); // Thêm log lỗi
    }
    hideTyping(); 
    // (Sửa) Dùng fallback của v31
    addMsg('bot', ans || `Xin lỗi, mình gặp trục trặc nhỏ. Bạn thử lại giúp mình nhé, hoặc gọi Zalo ${CFG.phone} ạ.`);
    sending=false;
  }

  // ===== SỬA LỖI: Auto-avoid obstacles (Lấy 100% logic v26/v22c GỐC)
  function checkObstacles(){
    const root = $('#mta-root'); if(!root) return;
    // Phát hiện thanh điều hướng, nút gọi nhanh...
    const blockers = document.querySelector('.bottom-appbar, .quick-call, #quick-call, .footer-map, #ft-coccoc-invitation-bar');
    let bottom = 'calc(18px + env(safe-area-inset-bottom, 0))';
    if(blockers){
      const r = blockers.getBoundingClientRect();
      const space = window.innerHeight - r.top; // không gian từ đỉnh của blocker xuống đáy màn hình
      
      // ===== SỬA THEO YÊU CẦU: Tăng ngưỡng phát hiện (120->200) và tăng khoảng cách (12->18) =====
      if(space > 0 && space < 200) { // (Sửa) Tăng ngưỡng phát hiện vật cản lên 200px
        bottom = `calc(${space}px + 18px + env(safe-area-inset-bottom, 0))`; // (Sửa) Tăng khoảng cách né lên 18px
      }
      // ===== HẾT PHẦN SỬA =====

    }
    // Phát hiện bàn phím ảo iOS/Android (từ v22c)
    if(window.visualViewport){
      const vv = window.visualViewport;
      // Khi bàn phím hiện, visualViewport.height < window.innerHeight
      if(vv.height < window.innerHeight - 80) { // 80px là ngưỡng an toàn
         // Tính toán an toàn cho iOS
        const newBottom = (window.innerHeight - vv.offsetTop - vv.height) + 10;
        bottom = `${newBottom}px`;
        
        // Điều chỉnh vị trí card thay vì bubble (nếu chat đang mở)
        if(isOpen && $('#mta-card')) {
            const card = $('#mta-card');
            // Dịch chuyển cả card lên
            card.style.bottom = `${newBottom}px`;
            // SỬA LỖI: Dịch chuyển cả root (chứa bubble) lên
            root.style.bottom = `${newBottom}px`; 
        } else {
             root.style.bottom = bottom;
             if($('#mta-card')) $('#mta-card').style.bottom = '16px'; // Reset card về vị trí gốc nếu ko mở
        }
      } else {
         // Bàn phím đóng
         root.style.bottom = bottom; // Về vị trí blocker (nếu có)
         if($('#mta-card')) $('#mta-card').style.bottom = '16px'; // Reset card
      }
    } else {
       root.style.bottom = bottom; // Fallback cho browser cũ
    }
  }

  // ===== Boot (Gộp v26 + v31)
  ready(async ()=>{
    const hour=new Date().getHours(); if(hour>19||hour<6) document.body.classList.add('ai-night');

    injectUI(); 
    
    // 🔥 HOTFIX A01: Gọi checkObstacles ngay sau khi injectUI để né vật cản Quick Call khi vừa load trang
    checkObstacles(); 

    bindScrollTags(); // (từ v26)

    // Bind (từ v26)
    $('#mta-bubble').addEventListener('click', ()=>{ openChat(); });
    $('#mta-backdrop').addEventListener('click', closeChat);
    $('#mta-close').addEventListener('click', closeChat);
    $('#mta-clear').addEventListener('click', clearChat);
    $('#mta-send').addEventListener('click', ()=>{ const v=($('#mta-in').value||'').trim(); if(!v) return; $('#mta-in').value=''; sendUser(v); });
    $('#mta-in').addEventListener('keydown',(e)=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); const v=($('#mta-in').value||'').trim(); if(!v) return; $('#mta-in').value=''; sendUser(v); }});

    // Auto-avoid (từ v26) - Listeners
    window.addEventListener('resize', checkObstacles, {passive:true});
    window.addEventListener('scroll', checkObstacles, {passive:true});
    if(window.visualViewport) window.visualViewport.addEventListener('resize', checkObstacles, {passive:true});

    // Watchdog (từ v26)
    setTimeout(()=>{ if(!$('#mta-bubble')) injectUI(); }, 2500);

    // (Sửa) Chạy AutoLearn của v31
    if(CFG.autolearn){
      const sites = Array.from(new Set([location.origin, ...(CFG.extraSites||[])]));
      (async()=>{ 
        try{ 
          // Check cache v31
          const cache=loadLearnCache();
          const host = (toURL(location.origin)||{}).origin;
          const expiry = (cache[host]?.ts || 0) + (CFG.refreshHours * 3600);
          if (nowSec() < expiry && (cache[host]?.pages?.length || 0) > 0) {
             console.log(`%cMotoAI v31: Dùng cache AutoLearn (còn ${Math.round((expiry-nowSec())/60)} phút)`, 'color:#0084FF');
          } else {
             await learnSites(sites, false); 
          }
        }catch(e){} 
      })();
    }

    console.log('%cMotoAI v31 (Engine) + v26 (UI) Merge FIX A01 — Active','color:#0084FF;font-weight:bold;');
  });

  // ===== Expose (API từ v31)
  window.MotoAI_v31 = {
    open: ()=>{ try{ openChat(); }catch(e){} },
    close: ()=>{ try{ closeChat(); }catch(e){} }
  };
  window.MotoAI_v31_autolearn = {
    learnNow: async function(sites, force){ try{ const list = Array.isArray(sites)&&sites.length? sites : (CFG.extraSites||[]); const combined = Array.from(new Set([location.origin, ...list])); return await learnSites(combined, !!force); }catch(e){ return null; } },
    getIndex: function(){ return Engine.kbIndex(); },
    clearLearnCache: function(){ try{ localStorage.removeItem(K.learn); console.log('MotoAI v31 learn cache cleared'); }catch(e){} }
  };
/* 🩹 MotoAI v31 — Safe bottom fix for Quick Call bar */
(function(){
  const adjustBottom = ()=>{
    const root = document.querySelector('#mta-root');
    if(!root) return;
    const blockers = document.querySelector('.bottom-appbar, .quick-call, #quick-call');
    let offset = 16;
    if(blockers){
      const r = blockers.getBoundingClientRect();
      const space = window.innerHeight - r.top;
      if(space > 0 && space < 120){
        offset = space + 12; // nhấc bong bóng lên
      }
    }
    root.style.bottom = `calc(${offset}px + env(safe-area-inset-bottom,0px))`;
  };
  window.addEventListener('resize', adjustBottom, {passive:true});
  window.addEventListener('scroll', adjustBottom, {passive:true});
  window.addEventListener('load', adjustBottom);
  setTimeout(adjustBottom, 800);
})();
