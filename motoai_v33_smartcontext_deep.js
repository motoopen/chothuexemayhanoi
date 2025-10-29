/* motoai_v33_smartcontext_deep.js
   Messenger UI (giữ nguyên v32) + SmartContext-Deep + VN-only + Auto-avoid quick-call
   - Nhớ ngữ cảnh 5 lượt, trích entity (loại xe, thời lượng, giá, liên hệ)
   - Trả lời lịch sự, chỉ tiếng Việt (nếu viOnly=true)
   - AutoLearn: đọc sitemap/fallback links nhưng lọc text Việt cơ bản
   - Né Quick-Call / appbar / keyboard (visualViewport)
*/
(function(){
  if (window.MotoAI_v33_LOADED) return; window.MotoAI_v33_LOADED = true;

  // ===== Config
  const DEF = {
    brand: "Motoopen",
    phone: "0857255868",
    zalo:  "",
    map:   "",
    avatar: "👩‍💼",
    themeColor: "#0084FF",
    autolearn: true,
    deepContext: true,
    maxContextTurns: 5,
    viOnly: true,
    extraSites: [location.origin],
    crawlDepth: 1,
    refreshHours: 24,
    maxPagesPerDomain: 60,
    maxTotalPages: 220,
    fetchTimeoutMs: 9000,
    fetchPauseMs: 180
  };
  const ORG = (window.MotoAI_CONFIG||{});
  if(!ORG.zalo && (ORG.phone||DEF.phone)) ORG.zalo = 'https://zalo.me/' + String(ORG.phone||DEF.phone).replace(/\s+/g,'');
  const CFG = Object.assign({}, DEF, ORG);

  // ===== Utils
  const $ = s => document.querySelector(s);
  const safe = s => { try{ return JSON.parse(s); }catch{ return null; } };
  const sleep = ms => new Promise(r=>setTimeout(r,ms));
  const nowSec = ()=> Math.floor(Date.now()/1000);
  const nfVND = n => (n||0).toLocaleString('vi-VN');
  const clamp = (n,min,max)=> Math.max(min, Math.min(max,n));

  // VN-only heuristic: nếu viOnly=true, loại bớt câu quá "Tây"
  function enforceVietnamese(text){
    if(!CFG.viOnly) return text;
    // Nếu phát hiện nhiều token a-z dài + không dấu -> vẫn cho qua, nhưng ưu tiên giữ câu bó gọn và thêm hạt Việt.
    // Ở bản rule-based, ta luôn sinh output thuần Việt nên chỉ cần trả về text.
    return text;
  }

  // ===== Storage keys
  const K = {
    sess: 'MotoAI_v33_session',
    ctx:  'MotoAI_v33_ctx',       // ngữ cảnh sâu (entities)
    learn:'MotoAI_v33_learn'      // { origin: { ts, pages:[{url,title,text}] } }
  };

  // ===== UI (Messenger giữ nguyên, thêm avatar & theme)
  const css = `
  :root{--mta-z:2147483647;--m-bg:#fff;--m-text:#0b1220;--m-blue:${CFG.themeColor}}
  #mta-root{position:fixed;right:16px;bottom:calc(18px + env(safe-area-inset-bottom,0));z-index:var(--mta-z);font-family:-apple-system,system-ui,Segoe UI,Roboto,"Helvetica Neue",Arial}
  #mta-bubble{width:60px;height:60px;border:none;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 10px 26px rgba(0,0,0,.2);outline:3px solid #fff}
  #mta-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.2);opacity:0;pointer-events:none;transition:opacity .18s ease}
  #mta-backdrop.show{opacity:1;pointer-events:auto}
  #mta-card{position:fixed;right:16px;bottom:16px;width:min(420px,calc(100% - 24px));height:70vh;max-height:740px;background:var(--m-bg);color:var(--m-text);border-radius:18px;box-shadow:0 14px 40px rgba(0,0,0,.25);transform:translateY(110%);opacity:.99;display:flex;flex-direction:column;overflow:hidden;transition:transform .20s cubic-bezier(.22,1,.36,1)}
  #mta-card.open{transform:translateY(0)}
  #mta-header{background:linear-gradient(90deg,var(--m-blue),#00B2FF);color:#fff}
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
    <section id="mta-card" role="dialog" aria-label="Chat MotoAI" aria-hidden="true">
      <header id="mta-header">
        <div class="brand">
          <div class="left">
            <span class="avatar">${CFG.avatar||"👩‍💼"}</span>
            <div class="info">
              <div class="name">Nhân viên ${CFG.brand}</div>
              <div class="sub">Hỗ trợ trực tuyến</div>
            </div>
          </div>
          <nav class="quick">
            ${CFG.phone?`<a class="q q-phone" href="tel:${CFG.phone}" title="Gọi">📞</a>`:''}
            ${CFG.zalo?`<a class="q q-zalo"  href="${CFG.zalo}" target="_blank" rel="noopener" title="Zalo">Z</a>`:''}
            ${CFG.map?`<a class="q q-map"   href="${CFG.map}" target="_blank" rel="noopener" title="Bản đồ">📍</a>`:''}
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

  function injectUI(){
    if ($('#mta-root')) return;
    const wrap = document.createElement('div'); wrap.innerHTML = ui; document.body.appendChild(wrap.firstElementChild);
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  }
  function ready(fn){
    if(document.readyState==="complete"||document.readyState==="interactive"){ fn(); }
    else document.addEventListener("DOMContentLoaded", fn);
  }

  // ===== Session & Deep Context
  function addMsg(role,text){
    if(!text) return;
    const el = document.createElement('div'); el.className = 'm-msg '+(role==='user'?'user':'bot'); el.textContent = text;
    const body = $('#mta-body'); if(!body) return;
    body.appendChild(el); body.scrollTop = body.scrollHeight;
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
    if(arr.length) arr.forEach(m=> addMsg(m.role,m.text));
    // [YÊU CẦU THAY ĐỔI] Xóa 'ạ?'
    else addMsg('bot', enforceVietnamese(`Xin chào 👋, em là nhân viên hỗ trợ của ${CFG.brand}. Anh/chị cần xem Xe số/ Xe ga/ Xe điện/ Thủ tục hay Bảng giá?`));
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

  // ===== Entity extractors
  const TYPE_MAP = [
    {k:'air blade', re:/\bair\s*blade|airblade|ab\b/i, canon:'air blade'},
    {k:'vision',    re:/\bvision\b/i, canon:'vision'},
    {k:'xe côn tay',re:/côn tay|tay côn/i, canon:'xe côn tay'},
    {k:'xe điện',   re:/xe điện|vinfast|yadea|dibao|gogo/i, canon:'xe điện'},
    {k:'50cc',      re:/50\s*cc|xe 50\b/i, canon:'50cc'},
    {k:'xe số',     re:/xe số|wave|blade|sirius|jupiter/i, canon:'xe số'},
    {k:'xe ga',     re:/xe ga/i, canon:'xe ga'}
  ];
  function detectType(t){
    for(const it of TYPE_MAP){ if(it.re.test(t)) return it.canon; }
    return null;
  }
  function detectQty(raw){
    const m = raw.match(/(\d+)\s*(ngày|day|tuần|tuan|week|tháng|thang|month)?/i);
    if(!m) return null;
    const n = parseInt(m[1],10); if(!n||n<=0) return null;
    let unit='ngày';
    if(m[2]) unit = /tuần|tuan|week/i.test(m[2])?'tuần' : /tháng|thang|month/i.test(m[2])?'tháng':'ngày';
    return {n,unit};
  }
  function detectIntent(t){
    return {
      needPrice: /(giá|bao nhiêu|tính tiền|cost|price|thuê|thue)/i.test(t),
      needDocs: /(thủ tục|thu tuc|giấy tờ|giay to|cọc|đặt cọc)/i.test(t),
      needContact: /(liên hệ|lien he|zalo|hotline|sđt|sdt|gọi|dien thoai)/i.test(t)
    };
  }

  // ===== SmartCalc
  const PRICE_TABLE = {
    'xe số':      { day:[130000,150000], week:[600000], month:[1000000,1200000] },
    'air blade':  { day:[200000], week:[800000], month:[1400000] },
    'vision':     { day:[200000], week:[900000], month:[2000000] },
    'xe điện':    { day:[200000], week:[800000], month:[1500000] },
    '50cc':       { day:[200000], week:[800000], month:[1800000] },
    'xe côn tay': { day:[350000], week:[1200000], month:[2500000] },
    'xe giá rẻ':  { day:[100000], week:[500000], month:[900000] }
  };
  function formatRange(arr){ if(!arr||!arr.length) return null; return arr.length===1? nfVND(arr[0])+'đ' : nfVND(arr[0])+'–'+nfVND(arr[1])+'đ'; }
  function summariseType(type){
    const it=PRICE_TABLE[type]; if(!it) return '';
    const d=formatRange(it.day), w=formatRange(it.week), m=formatRange(it.month);
    const bits=[]; if(d) bits.push(d+'/ngày'); if(w) bits.push(w+'/tuần'); if(m) bits.push(m+'/tháng'); return bits.join(', ');
  }
  function baseFor(type,unit){
    const it=PRICE_TABLE[type]; if(!it) return null;
    const key = unit==='tuần'?'week':(unit==='tháng'?'month':'day');
    const arr=it[key]; if(!arr) return null; return arr[0];
  }

  // ===== Deep Compose
  // [YÊU CẦU THAY ĐỔI] Giữ nguyên PREFIX
  const PREFIX = ["Chào anh/chị,","Xin chào 👋,","Em chào anh/chị nhé,","Rất vui được hỗ trợ anh/chị,"];
  // [YÊU CẦU THAY ĐỔI] Làm sạch SUFFIX, bỏ 'ạ', 'nhé ạ', giữ 'nhé.', 'nha.', '. Cảm ơn...'
  const SUFFIX = [".", " nhé.", " nha.", ". Cảm ơn anh/chị."];
  const pick = a => a[Math.floor(Math.random()*a.length)];

  // [YÊU CẦU THAY ĐỔI] Sửa câu fallback (dù câu gốc đã ổn, kiểm tra lại)
  function polite(s){ s=(s||"").trim(); if(!s) s="em chưa nhận được câu hỏi, anh/chị thử nhập lại giúp em nhé."; return `${pick(PREFIX)} ${s}${pick(SUFFIX)}`; }

  function deepAnswer(userText){
    const q = (userText||'').trim();
    const lower = q.toLowerCase();

    // 1) Detect intent + entities
    const it = detectIntent(lower);
    let type = detectType(lower);
    const qty  = detectQty(lower);

    // 2) Context backfill: nếu chưa có type/qty thì lấy từ turns gần nhất
    if(CFG.deepContext){
      const ctx = readContext();
      for(let i=ctx.turns.length-1; i>=0; i--){
        const t = ctx.turns[i];
        if(!type && t.type) type = t.type;
        if(!qty && t.qty)   return composePrice(type, t.qty); // nếu trước đó đã có qty, khách hỏi "bao nhiêu" -> tính luôn
        if(type && qty) break;
      }
    }

    // 3) Rule blocks
    if(it.needContact) return polite(`anh/chị liên hệ nhanh qua Zalo ${CFG.phone} hoặc gọi ${CFG.phone} để được tư vấn trực tiếp nhé.`);
    if(it.needDocs) return polite(`thủ tục gọn: CCCD/hộ chiếu + cọc tuỳ xe. Có phương án giảm cọc khi đủ giấy tờ. Em có thể hướng dẫn nhận/trả xe nếu anh/chị cần.`);
    if(it.needPrice) return composePrice(type, qty);

    // 4) Câu chung
    if(/(chào|xin chào|hello|hi|alo)/i.test(lower)){
      // [YÊU CẦU THAY ĐỔI] Xóa 'ạ?'
      return polite(`em là nhân viên hỗ trợ của ${CFG.brand}. Anh/chị muốn xem 🏍️ Xe số, 🛵 Xe ga, ⚡ Xe điện hay 📄 Thủ tục thuê xe?`);
    }

    // 5) Gợi mở tự nhiên
    // [YÊU CẦU THAY ĐỔI] Xóa 'ạ.'
    return polite(`anh/chị quan tâm loại xe nào (xe số, Vision, Air Blade, 50cc, côn tay…) và thuê mấy ngày để em báo giá phù hợp.`);
  }

  function composePrice(type, qty){
    if(!type) type = 'xe số';
    // [YÊU CẦU THAY ĐỔI] Xóa 'ạ?'
    if(!qty)  return polite(`Giá ${type} khoảng ${summariseType(type)}. Anh/chị thuê mấy ngày để em tính ước tính tổng giúp?`);
    const base = baseFor(type, qty.unit);
    if(!base)  return polite(`Giá theo ${qty.unit} của ${type} hiện chưa có trong bảng. Anh/chị liên hệ Zalo ${CFG.phone} để báo giá chính xác giúp em nhé.`);
    const total = base * qty.n;
    const label = qty.unit==='ngày'?`${qty.n} ngày`:qty.unit==='tuần'?`${qty.n} tuần`:`${qty.n} tháng`;
    // [YÊU CẦU THAY ĐỔI] Xóa 'ạ.'
    return polite(`Giá dự kiến thuê ${type} ${label} khoảng ${nfVND(total)}đ (ước tính). Anh/chị có thể liên hệ Zalo ${CFG.phone} để xem xe và nhận giá chính xác nhất.`);
  }

  // ===== AutoLearn (lọc nội dung Việt cơ bản)
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
    const sitemaps = Array.from(doc.getElementsByTagName('sitemap'))
      .map(x=> x.getElementsByTagName('loc')?.[0]?.textContent?.trim()).filter(Boolean);
    if(sitemaps.length){
      const all = [];
      for(const loc of sitemaps){ try{ const child = await readSitemap(loc); if(child && child.length) all.push(...child); }catch{} }
      return Array.from(new Set(all));
    }
    const urls = Array.from(doc.getElementsByTagName('url'))
      .map(u=> u.getElementsByTagName('loc')?.[0]?.textContent?.trim()).filter(Boolean);
    return urls;
  }
  function sameHost(u, origin){ try{ return new URL(u).host === new URL(origin).host; }catch{ return false; } }
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
  function looksVietnamese(s){
    // rất đơn giản: có dấu tiếng Việt hoặc nhiều từ khoá VN
    if(/[ăâêôơưđà-ỹ]/i.test(s)) return true;
    const hits = (s.match(/\b(xe|thuê|giá|liên hệ|hà nội|cọc|giấy tờ)\b/gi)||[]).length;
    return hits >= 2;
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
      // lọc VN
      const sample = (title+' '+desc).toLowerCase();
      if(CFG.viOnly && !looksVietnamese(sample)) { await sleep(CFG.fetchPauseMs); continue; }
      pages.push({url, title, text: desc});
      if(pages.length >= CFG.maxPagesPerDomain) break;
      await sleep(CFG.fetchPauseMs);
    }
    return pages;
  }
  async function learnOneSite(origin){
    try{
      const originKey = new URL(origin).origin;
      const candidates = [originKey + '/sitemap.xml', originKey + '/sitemap_index.xml'];
      let urls = [];
      for(const c of candidates){ try{ const got = await readSitemap(c); if(got && got.length){ urls = got; break; } }catch{} }
      if(!urls.length) urls = await fallbackCrawl(originKey);
      const uniq = Array.from(new Set(urls.map(u=>{ try{ return new URL(u).toString().split('#')[0]; }catch{ return null; } }).filter(Boolean).filter(u=> sameHost(u, originKey))));
      const pages = await pullPages(uniq);
      return {domain: originKey, ts: nowSec(), pages};
    }catch(e){ return null; }
  }
  function loadLearn(){ return safe(localStorage.getItem(K.learn)) || {}; }
  function saveLearn(obj){ try{ localStorage.setItem(K.learn, JSON.stringify(obj)); }catch{} }
  function expired(ts, hrs){ if(!ts) return true; return ((nowSec()-ts)/3600) >= (hrs||CFG.refreshHours); }

  async function learnSites(listOrigins, force=false){
    if(!Array.isArray(listOrigins)) listOrigins = [];
    const cache = loadLearn(); const results = {}; let total = 0;
    const origins = Array.from(new Set(listOrigins)).slice(0, 10);
    for(const origin of origins){
      try{
        const key = new URL(origin).origin;
        const cached = cache[key];
        if(!force && cached && !expired(cached.ts, CFG.refreshHours) && Array.isArray(cached.pages) && cached.pages.length){
          results[key] = cached; total += cached.pages.length; if(total>=CFG.maxTotalPages) break; continue;
        }
        const data = await learnOneSite(key);
        if(data && data.pages?.length){ cache[key]=data; saveLearn(cache); results[key]=data; total+=data.pages.length; }
        if(total>=CFG.maxTotalPages) break;
      }catch{}
    }
    saveLearn(cache); return results;
  }
  function getIndex(){
    const cache = loadLearn(); const out=[];
    Object.keys(cache).forEach(domain=>{ (cache[domain]?.pages||[]).forEach(pg=> out.push(Object.assign({domain}, pg))); });
    return out;
  }

  // Khi user hỏi mơ hồ, gợi ý thêm link trang liên quan từ index
  function suggestFromIndex(q){
    try{
      const idx = getIndex(); if(!idx.length) return null;
      const low = q.toLowerCase(); const score = it=>{
        const text = ((it.title||'')+' '+(it.text||'')).toLowerCase();
        let s = 0; if(text.includes('giá')) s++; if(text.includes('thuê')) s++; if(text.includes('xe')) s++;
        if(text.includes('hà nội')) s++;
        if(low.includes('giá') && text.includes('giá')) s+=2;
        return s;
      };
      const cand = idx.map(x=>Object.assign({score:score(x)}, x)).filter(x=>x.score>0).sort((a,b)=> b.score-a.score)[0];
      if(!cand) return null;
      const snippet = (cand.title?`${cand.title} — `:'') + (cand.text||'').slice(0,160);
      return `${snippet} ... Anh/chị xem thêm: ${cand.url}`;
    }catch{ return null; }
  }

  // ===== Send & Typing
  let isOpen=false, sending=false, typingBlinkTimer=null;
  function showTyping(){
    const d=document.createElement('div'); d.id='mta-typing'; d.className='m-msg bot'; d.textContent='Đang nhập ';
    const dot=document.createElement('span'); dot.id='mta-typing-dots'; dot.textContent='…';
    d.appendChild(dot); const body=$('#mta-body'); if(!body) return; body.appendChild(d); body.scrollTop = body.scrollHeight;
    let i=0; typingBlinkTimer=setInterval(()=>{ dot.textContent='.'.repeat((i++%3)+1); }, 420);
  }
  function hideTyping(){ const d=$('#mta-typing'); if(d) d.remove(); if(typingBlinkTimer){ clearInterval(typingBlinkTimer); typingBlinkTimer=null; } }

  function openChat(){ if(isOpen) return; $('#mta-card').classList.add('open'); $('#mta-backdrop').classList.add('show'); $('#mta-bubble').style.display='none'; isOpen=true; renderSess(); setTimeout(()=>{ try{$('#mta-in').focus();}catch{} }, 140); }
  function closeChat(){ if(!isOpen) return; $('#mta-card').classList.remove('open'); $('#mta-backdrop').classList.remove('show'); $('#mta-bubble').style.display='flex'; isOpen=false; hideTyping(); }
  function clearChat(){ try{ localStorage.removeItem(K.sess); localStorage.removeItem(K.ctx); }catch{}; $('#mta-body').innerHTML=''; 
    // [YÊU CẦU THAY ĐỔI] Xóa 'ạ.'
    addMsg('bot', enforceVietnamese('Đã xóa hội thoại, em sẵn sàng hỗ trợ lại.')); 
  }

  async function sendUser(text){
    if(sending) return; sending=true;
    const userText = (text||'').trim(); if(!userText) { sending=false; return; }
    addMsg('user', userText);
    // cập nhật context
    pushContext({from:'user', raw:userText, type: detectType(userText), qty: detectQty(userText)});
    showTyping(); const typingDelay = 3000 + Math.random()*2500; await sleep(typingDelay);
    let ans = deepAnswer(userText);

    // nếu câu chung -> thử gợi ý từ index
    if(/chưa tìm được thông tin|quan tâm loại xe nào/i.test(ans||'')){
      const sug = suggestFromIndex(userText);
      if(sug) ans = polite(sug);
    }
    hideTyping(); addMsg('bot', enforceVietnamese(ans));
    // lưu context bot
    pushContext({from:'bot', raw:ans});
    sending=false;
  }

  // ===== Auto-avoid obstacles (Quick-Call, appbar, keyboard)
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

  // ===== Boot
  function bindScrollTags(){
    const track = document.getElementById('tagTrack'); const box = document.getElementById('mta-tags'); if(!track||!box) return;
    track.querySelectorAll('button').forEach(b=> b.addEventListener('click', ()=> sendUser(b.dataset.q)));
    const input = document.getElementById('mta-in');
    if(input){
      input.addEventListener('focus', ()=> box.classList.add('hidden'));
      input.addEventListener('blur',  ()=> { if(!input.value.trim()) box.classList.remove('hidden'); });
      input.addEventListener('input', ()=> { if(input.value.trim().length>0) box.classList.add('hidden'); else box.classList.remove('hidden'); });
    }
  }

  ready(async ()=>{
    const hour=new Date().getHours(); if(hour>19||hour<6) document.body.classList.add('ai-night');
    injectUI(); bindScrollTags(); checkObstacles();

    // events
    $('#mta-bubble').addEventListener('click', ()=>{ openChat(); });
    $('#mta-backdrop').addEventListener('click', closeChat);
    $('#mta-close').addEventListener('click', closeChat);
    $('#mta-clear').addEventListener('click', clearChat);
    $('#mta-send').addEventListener('click', ()=>{ const v=($('#mta-in').value||'').trim(); if(!v) return; $('#mta-in').value=''; sendUser(v); });
    $('#mta-in').addEventListener('keydown',(e)=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); const v=($('#mta-in').value||'').trim(); if(!v) return; $('#mta-in').value=''; sendUser(v); }});
    window.addEventListener('resize', checkObstacles, {passive:true});
    window.addEventListener('scroll', checkObstacles, {passive:true});
    if(window.visualViewport) window.visualViewport.addEventListener('resize', checkObstacles, {passive:true});

    console.log('%cMotoAI v33 SmartContext-Deep — UI ready','color:'+CFG.themeColor+';font-weight:bold;');

    if(CFG.autolearn){
      const sites = Array.from(new Set([location.origin, ...(CFG.extraSites||[])]));
      try{
        (async()=>{ await learnSites(sites, false); console.log('MotoAI v33 autolearn: done'); })();
      }catch(e){ console.warn('MotoAI v33 autolearn err', e); }
    }
  });

  // ===== Public API
  window.MotoAI_v33 = {
    open: ()=>{ try{ openChat(); }catch{} },
    close: ()=>{ try{ closeChat(); }catch{} },
    learnNow: async (sites, force)=>{ try{ const list = Array.isArray(sites)&&sites.length?sites:(CFG.extraSites||[]); const combined = Array.from(new Set([location.origin, ...list])); return await learnSites(combined, !!force); }catch(e){ return null; } },
    getIndex: ()=> getIndex(),
    clearLearnCache: ()=> { try{ localStorage.removeItem(K.learn); }catch{} }
  };
})();
