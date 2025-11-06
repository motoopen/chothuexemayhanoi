/* motoai_v27_autolearn_semantic.js
   Messenger-style (UI v22c) • AutoLearn MultiSite • SmartCalc • UltraSafe • Semantic BM25 • Extractive QA • Auto-Price Learn
   - Học nhiều website: sitemap.xml + sitemap_index.xml (+ fallback BFS depth=CFG.crawlDepth)
   - Cache localStorage theo domain, tự refresh mỗi refreshHours (có chốt quota)
   - UI v22c + A11y: aria-modal, focus trap, ESC để đóng, trả focus về nút mở
   - Thông minh hơn: Tìm kiếm ngữ nghĩa (BM25 mini), trích xuất câu trả lời, tự học bảng giá từ trang
   - Expose API (giữ tương thích): window.MotoAI_v26_autolearn / window.MotoAI_v27_autolearn
*/
(function(){
  if (window.MotoAI_v27_MULTI_LOADED) return;
  window.MotoAI_v27_MULTI_LOADED = true;

  // ====== Config (override via window.MotoAI_CONFIG before loading)
  const DEF = {
    brand: "Motoopen",
    phone: "0857255868",
    zalo:  "https://zalo.me/0857255868",
    map:   "https://maps.app.goo.gl/2icTBTxAToyvKTE78",
    autolearn: true,
    // default sites to learn
    extraSites: [
      "https://motoopen.github.io/chothuexemayhanoi/",
      "https://thuexemaynguyentu.com",
      "https://rentbikehanoi.com"
    ],
    crawlDepth: 2,            // BFS depth cho fallback crawl
    refreshHours: 24,
    minSentenceLen: 24,
    // limits & safety
    maxPagesPerDomain: 80,
    maxTotalPages: 300,
    fetchTimeoutMs: 10000,
    fetchPauseMs: 200, // base pause (sẽ cộng thêm jitter)
    // Smart flags
    smart: {
      semanticSearch: true,    // BM25 mini
      extractiveQA:   true,    // chọn câu “đinh” để trả lời
      autoPriceLearn: true     // tự trích xuất giá từ trang
    }
  };
  const ORG = (window.MotoAI_CONFIG||{});
  if(!ORG.zalo && (ORG.phone||DEF.phone)) ORG.zalo = 'https://zalo.me/' + String(ORG.phone||DEF.phone).replace(/\s+/g,'');
  const CFG = Object.assign({}, DEF, ORG);
  CFG.smart = Object.assign({}, DEF.smart, (ORG.smart||{}));

  // ====== Utils
  const $  = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const safe = s => { try{ return JSON.parse(s); }catch(e){ return null; } };
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const pick  = a => a[Math.floor(Math.random()*a.length)];
  const nfVND = n => (n||0).toLocaleString('vi-VN');
  const nowSec = ()=> Math.floor(Date.now()/1000);
  const toURL = u => { try { return new URL(u); } catch(e) { return null; } };
  const normHost = h => String(h||'').replace(/^www\./,'');
  const sameHost = (u, origin)=> { try{ return normHost(new URL(u).host) === normHost(new URL(origin).host); }catch(e){ return false; } };
  const esc = s => String(s ?? '')
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');

  // Tokenizer tiếng Việt tối giản (dùng cho BM25/extractiveQA)
  function tokenizeVN(s){
    return String(s||'')
      .toLowerCase()
      .normalize('NFC')
      .replace(/[^\p{L}\p{N}\s]/gu,' ')
      .split(/\s+/).filter(Boolean);
  }

  // BM25 mini (xây tạm thời khi cần, vì số trang đã giới hạn)
  function buildBM25(docs){ // docs: [{id, text}]
    const k1=1.5, b=0.75;
    const df = new Map(), tf = new Map();
    let totalLen=0;
    docs.forEach(d=>{
      const toks = tokenizeVN(d.text);
      totalLen += toks.length;
      const map = new Map();
      for(const t of toks) map.set(t, (map.get(t)||0)+1);
      tf.set(d.id, map);
      for(const t of new Set(toks)) df.set(t, (df.get(t)||0)+1);
    });
    const N = docs.length||1, avgdl = totalLen/Math.max(1, N);
    const idf = new Map();
    for(const [t, c] of df.entries()){
      idf.set(t, Math.log(1 + (N - c + 0.5)/(c + 0.5)));
    }
    function score(query, docId, docLen){
      const qToks = new Set(tokenizeVN(query));
      let s=0;
      const map = tf.get(docId)||new Map();
      for(const t of qToks){
        const f = map.get(t)||0;
        if(!f) continue;
        const idfv = idf.get(t)||0;
        s += idfv * (f*(k1+1)) / (f + k1*(1 - b + b*(docLen/avgdl)));
      }
      return s;
    }
    return { score, tf, idf, avgdl };
  }

  // Chọn câu “đinh” xung quanh từ khoá (extractive QA mini)
  function bestSentences(text, query, k=2){
    const sents = String(text||'').replace(/\s+/g,' ')
      .split(/(?<=[\.\!\?])\s+/).slice(0,80); // limit
    const qToks = new Set(tokenizeVN(query));
    const scored = sents.map(s=>{
      const toks = tokenizeVN(s);
      let hit=0;
      for(const t of qToks) if(toks.includes(t)) hit++;
      // ưu tiên câu ngắn vừa phải
      const lenp = Math.max(0.5, 12/Math.max(12, toks.length));
      return {s, score: hit*lenp};
    }).filter(x=> x.score>0);
    scored.sort((a,b)=> b.score - a.score);
    return scored.slice(0,k).map(x=> x.s);
  }

  // ====== Storage keys
  const K = {
    sess: 'MotoAI_v26_session',
    ctx:  'MotoAI_v26_ctx',
    learn:'MotoAI_v26_learn', // { origin: { ts, pages:[{url,title,text}] } }
    autoprices: 'MotoAI_v26_auto_prices'
  };

  // ====== UI (escape + ARIA)
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
    <section id="mta-card" role="dialog" aria-modal="true" aria-label="Chat ${esc(CFG.brand)}" aria-hidden="true">
      <header id="mta-header">
        <div class="brand">
          <div class="left">
            <span class="avatar">💬</span>
            <div class="info">
              <div class="name">Nhân viên ${esc(CFG.brand)}</div>
              <div class="sub">Hỗ trợ trực tuyến</div>
            </div>
          </div>
          <nav class="quick">
            <a class="q q-phone" href="tel:${esc(CFG.phone)}" title="Gọi">📞</a>
            <a class="q q-zalo"  href="${esc(CFG.zalo)}" target="_blank" rel="noopener" title="Zalo">Z</a>
            <a class="q q-map"   href="${esc(CFG.map)}"  target="_blank" rel="noopener" title="Bản đồ">📍</a>
          </nav>
          <button id="mta-close" title="Đóng" aria-label="Đóng">✕</button>
        </div>
      </header>

      <main id="mta-body"></main>

      <!-- Scrollable tags -->
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
        <input id="mta-in" placeholder="Nhắn tin cho ${esc(CFG.brand)}..." autocomplete="off" />
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
  .ai-night #mta-bubble{box-shadow:0 0 18px rgba(0,132,255,.35)!important;}`;

  // ===== Inject UI
  function injectUI(){
    if ($('#mta-root')) return;
    const wrap = document.createElement('div'); wrap.innerHTML = ui; document.body.appendChild(wrap.firstElementChild);
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  }
  function ready(fn){
    if(document.readyState==="complete"||document.readyState==="interactive"){ fn(); }
    else document.addEventListener("DOMContentLoaded", fn);
  }

  // ===== Session helpers
  function addMsg(role,text){
    if(!text) return;
    const el = document.createElement('div'); el.className = 'm-msg '+(role==='user'?'user':'bot'); el.textContent = text;
    const body = $('#mta-body'); if(!body) return;
    body.appendChild(el); body.scrollTop = body.scrollHeight;
    try{
      const arr = safe(localStorage.getItem(K.sess)) || [];
      arr.push({role,text,t:Date.now()});
      localStorage.setItem(K.sess, JSON.stringify(arr.slice(-200)));
    }catch(e){}
  }
  function renderSess(){
    const body = $('#mta-body'); if(!body) return;
    body.innerHTML = '';
    const arr = safe(localStorage.getItem(K.sess))||[];
    if(arr.length) arr.forEach(m=> addMsg(m.role,m.text));
    else addMsg('bot', `Xin chào 👋, em là nhân viên hỗ trợ của ${CFG.brand}. Anh/chị cần xem Xe số/ Xe ga/ Xe điện/ Thủ tục hay Bảng giá ạ?`);
  }

  // ===== Typing
  let typingBlinkTimer=null;
  function showTyping(){
    const d=document.createElement('div'); d.id='mta-typing'; d.className='m-msg bot'; d.textContent='Đang nhập ';
    const dot=document.createElement('span'); dot.id='mta-typing-dots'; dot.textContent='…';
    d.appendChild(dot); const body=$('#mta-body'); if(!body) return; body.appendChild(d); body.scrollTop = body.scrollHeight;
    let i=0; typingBlinkTimer=setInterval(()=>{ dot.textContent='.'.repeat((i++%3)+1); }, 400);
  }
  function hideTyping(){ const d=$('#mta-typing'); if(d) d.remove(); if(typingBlinkTimer){ clearInterval(typingBlinkTimer); typingBlinkTimer=null; } }

  // ===== SmartCalc (giữ nguyên + có thể tự học giá)
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

  // ===== Polite compose helpers
  const PREFIX = ["Chào anh/chị,","Xin chào 👋,","Em chào anh/chị nhé,","Rất vui được hỗ trợ anh/chị,"];
  const SUFFIX = [" ạ."," nhé ."," nha anh/chị."," cảm ơn anh/chị."];
  function polite(t){ t=(t||"").trim(); if(!t) return "Em chưa nhận được câu hỏi, anh/chị thử nhập lại giúp em nhé."; return `${pick(PREFIX)} ${t}${pick(SUFFIX)}`; }
  const RULES = [
    {re:/(chào|xin chào|hello|hi|alo)/i, ans:[
      `em là nhân viên hỗ trợ của ${CFG.brand}. Anh/chị muốn xem 🏍️ Xe số, 🛵 Xe ga, ⚡ Xe điện hay 📄 Thủ tục thuê xe ạ?`,
      "em có thể báo giá nhanh hoặc hướng dẫn thủ tục. Anh/chị đang quan tâm loại xe nào ạ?"
    ]},
    {re:/(thủ tục|thu tuc|giay to|giấy tờ|cọc|đặt cọc)/i, ans:[
      "thủ tục gọn: CCCD/hộ chiếu + cọc tuỳ xe. Có phương án giảm cọc khi đủ giấy tờ.",
      "em có thể gửi danh sách giấy tờ cần và cách nhận/trả xe nhé."
    ]},
    {re:/(liên hệ|lien he|zalo|hotline|sđt|sdt|gọi|dien thoai)/i, ans:[
      `anh/chị liên hệ nhanh qua Zalo ${CFG.phone} để được tư vấn trực tiếp nhé.`,
      `nếu cần gấp, anh/chị gọi ${CFG.phone} — bọn em phản hồi ngay ạ.`
    ]}
  ];
  function rule(q){ for(const r of RULES){ if(r.re.test(q)) return polite(pick(r.ans)); } return null; }

  // ====== FETCH helpers (with timeout)
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

  function parseXML(text){
    try{ return (new window.DOMParser()).parseFromString(text,'text/xml'); }catch(e){ return null; }
  }
  function parseHTML(text){
    try{ return (new DOMParser()).parseFromString(text, 'text/html'); }catch(e){ return null; }
  }

  // ====== AutoLearn: sitemap reader, fallback crawl (BFS), page pull
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
    // BFS đến depth = CFG.crawlDepth (mặc định 1)
    const start = origin.endsWith('/') ? origin : origin + '/';
    const q = [[start, 0]];
    const seen = new Set([start]);
    const out = [];

    while (q.length && out.length < CFG.maxPagesPerDomain) {
      const [url, depth] = q.shift();
      out.push(url);

      if (depth >= (CFG.crawlDepth || 1)) continue;

      const html = await fetchText(url);
      if (!html) continue;
      const doc = parseHTML(html);
      if (!doc) continue;

      const anchors = Array.from(doc.querySelectorAll('a[href]'))
        .map(a => a.getAttribute('href'))
        .filter(Boolean);

      for (const href of anchors) {
        try{
          const u = new URL(href, url).toString().split('#')[0];
          if (sameHost(u, origin) && !seen.has(u)) {
            seen.add(u);
            q.push([u, depth + 1]);
            if (seen.size >= CFG.maxPagesPerDomain) break;
          }
        }catch(e){}
      }
      await sleep(CFG.fetchPauseMs + Math.random()*150); // jitter
    }
    return out.slice(0, CFG.maxPagesPerDomain);
  }

  // Trích xuất giá từ text HTML (cho auto-price learn)
  function extractPricesFromText(txt){
    const clean = String(txt||'');
    const lines = clean.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').split(/[\n\.•\-–]|<br\s*\/?>/i);
    const out = [];
    const reNum = /(\d{2,3}(?:[\.\,]\d{3})+|\d{5,})(?:\s*(?:vnđ|vnd|đ|d|k))?/i;
    const models = [
      {key:/\bvision\b/i,                 type:'vision'},
      {key:/air\s*blade|airblade|\bab\b/i, type:'air blade'},
      {key:/xe\s*điện|vinfast|yadea|dibao|gogo/i, type:'xe điện'},
      {key:/\b50cc\b|\bxe\s*50\b/i,       type:'50cc'},
      {key:/côn\s*tay|tay\s*côn/i,        type:'xe côn tay'},
      {key:/wave|sirius|blade|jupiter|xe\s*số/i, type:'xe số'}
    ];
    for(const raw of lines){
      const line = String(raw||'');
      const found = models.find(m=> m.key.test(line));
      if(!found) continue;
      const m = line.match(reNum);
      if(!m) continue;
      let val = m[1].replace(/[^\d]/g,'');
      if(/k\b/i.test(line) && parseInt(val,10)<10000) val = String(parseInt(val,10)*1000);
      const price = parseInt(val,10);
      if(price && price<5000000){
        out.push({type:found.type, unit:'day', price});
      }
    }
    return out;
  }

  async function pullPages(list){
    const pages = [];
    for(const url of list.slice(0, CFG.maxPagesPerDomain)){
      const txt = await fetchText(url);
      if(!txt) continue;

      // tôn trọng meta robots noindex (thô sơ)
      if (/\bname=(?:"|')robots(?:"|')[^>]*content=(?:"|')[^"']*noindex/i.test(txt)) {
        continue;
      }

      // extract title
      let title = (txt.match(/<title[^>]*>([^<]+)<\/title>/i) || [])[1] || '';
      title = title.replace(/\s+/g,' ').trim();

      // meta description: hỗ trợ ngoặc đơn & kép
      let desc = '';
      const metaMatch = txt.match(/<meta[^>]+name=(?:"|')description(?:"|')[^>]+content=(?:"|')([\s\S]*?)(?:"|')/i);
      if (metaMatch) {
        desc = metaMatch[1].trim();
      }
      if(!desc){
        // strip tags, scripts
        const bodyTxt = txt.replace(/<script[\s\S]*?<\/script>/gi,' ')
                           .replace(/<style[\s\S]*?<\/style>/gi,' ')
                           .replace(/<[^>]+>/g,' ')
                           .replace(/\s+/g,' ')
                           .trim();
        desc = bodyTxt.slice(0, 600);
      }

      // auto-price learn (ghi stash)
      if (CFG.smart.autoPriceLearn){
        const auto = extractPricesFromText(txt);
        if(auto && auto.length){
          try{
            const stash = safe(localStorage.getItem(K.autoprices))||[];
            stash.push(...auto.map(a=> Object.assign({url}, a)));
            localStorage.setItem(K.autoprices, JSON.stringify(stash.slice(-500)));
          }catch(e){}
        }
      }

      pages.push({url, title, text: desc});
      if(pages.length >= CFG.maxPagesPerDomain) break;
      // pause lịch sự + jitter
      await sleep(CFG.fetchPauseMs + Math.random()*150);
    }
    return pages;
  }

  async function learnOneSite(origin){
    try{
      const canonicalOrigin = origin.replace(/\/+$/,'');
      const candidates = [
        canonicalOrigin + '/sitemap.xml',
        canonicalOrigin + '/sitemap_index.xml',
        canonicalOrigin + '/sitemap.xml.gz'
      ];
      let urls = [];
      for(const c of candidates){
        try{
          const got = await readSitemap(c);
          if(got && got.length){
            urls = got;
            console.log('MotoAI v27 learn: found sitemap at', c, '->', got.length, 'urls');
            break;
          }
        }catch(e){ /* ignore */ }
      }
      if(!urls.length){
        urls = await fallbackCrawl(canonicalOrigin);
        console.log('MotoAI v27 learn: fallback crawl for', canonicalOrigin, '->', urls.length, 'urls');
      }
      const hostOrigin = (new URL(canonicalOrigin)).origin;
      const uniq = Array.from(new Set(urls.map(u=> {
        try{ return new URL(u).toString().split('#')[0]; }catch(e){ return null; }
      }).filter(Boolean).filter(u=> sameHost(u, hostOrigin))));
      const pages = await pullPages(uniq.slice(0, CFG.maxPagesPerDomain));
      return {domain: hostOrigin, ts: nowSec(), pages};
    }catch(e){
      console.warn('MotoAI v27 learnOneSite fail', origin, e);
      return null;
    }
  }

  // ====== Cache helpers
  function loadLearnCache(){ return safe(localStorage.getItem(K.learn)) || {}; }
  function saveLearnCache(obj){ try{ localStorage.setItem(K.learn, JSON.stringify(obj)); }catch(e){ throw e; } }
  function isExpired(ts, hours){ if(!ts) return true; const ageHr = (nowSec() - ts)/3600; return ageHr >= (hours||CFG.refreshHours); }

  // ====== Orchestrator
  async function learnSites(listOrigins, force=false){
    if(!Array.isArray(listOrigins)) listOrigins = [];
    const cache = loadLearnCache();
    const results = {};
    let totalPages = 0;

    const origins = listOrigins.slice(0, 12);
    for(const origin of origins){
      try{
        const u = toURL(origin);
        if(!u) continue;
        const originKey = u.origin;
        const cached = cache[originKey];
        if(!force && cached && !isExpired(cached.ts, CFG.refreshHours) && Array.isArray(cached.pages) && cached.pages.length){
          console.log('MotoAI v27 learn: using cached', originKey, cached.pages.length, 'pages');
          results[originKey] = cached;
          totalPages += cached.pages.length;
          if(totalPages >= CFG.maxTotalPages) break;
          continue;
        }
        console.log('MotoAI v27 learn: pulling', originKey);
        const data = await learnOneSite(originKey);
        if(data && Array.isArray(data.pages) && data.pages.length){
          cache[originKey] = data;

          // save with quota-guard
          try {
            saveLearnCache(cache);
          } catch(e){
            console.warn('MotoAI v27 learn: storage full, trimming...');
            const keys = Object.keys(cache);
            if (keys.length) {
              delete cache[keys[0]];
              try{ saveLearnCache(cache); }catch(e2){}
            }
          }

          results[originKey] = data;
          totalPages += data.pages.length;
          console.log('MotoAI v27 learn: saved', originKey, '->', data.pages.length, 'pages');
        } else {
          console.warn('MotoAI v27 learn: no pages for', originKey);
        }
        if(totalPages >= CFG.maxTotalPages) break;
      }catch(e){ console.warn('MotoAI v27 learnSites error', e); }
    }
    try{ saveLearnCache(cache); }catch(e){}
    return results;
  }

  // ====== Public quick helpers to query index
  function getIndex(){
    const cache = loadLearnCache();
    const out = [];
    Object.keys(cache).forEach(domain=>{
      const p = cache[domain] && cache[domain].pages || [];
      p.forEach(pg => { out.push(Object.assign({domain}, pg)); });
    });
    return out;
  }
  function clearLearnCache(){
    try{ localStorage.removeItem(K.learn); console.log('MotoAI learn cache cleared'); }catch(e){}
  }

  // ====== updateCtxWithUser (BM25 semantic)
  function updateCtxWithUser(q){
    try{
      const cache = loadLearnCache();
      const docs = [];
      Object.keys(cache).forEach(domain=>{
        (cache[domain]?.pages||[]).forEach((pg, i)=>{
          const id = `${domain}|${i}`;
          docs.push({ id, text: ((pg.title||'')+' '+(pg.text||'')), meta:{domain, i, url:pg.url, title:pg.title, text:pg.text}});
        });
      });
      if(!docs.length){ localStorage.removeItem(K.ctx); return; }
      const bm = CFG.smart.semanticSearch ? buildBM25(docs) : null;
      const scored = [];
      docs.forEach(d=>{
        const len = tokenizeVN(d.text).length||1;
        const s = bm ? bm.score(q, d.id, len) : 0;
        if(s>0 || !bm){ // nếu tắt BM25, giữ tất cả và lọc theo includes
          // fallback: simple includes score
          const fallback = bm ? 0 : tokenizeVN(q).filter(t=> tokenizeVN(d.text).includes(t)).length;
          const score = bm ? s : fallback;
          if(score>0) scored.push({score, domain:d.meta.domain, url:d.meta.url, title:d.meta.title, text:d.meta.text});
        }
      });
      scored.sort((a,b)=> b.score - a.score);
      try{ localStorage.setItem(K.ctx, JSON.stringify(scored.slice(0,5))); }catch(e){}
    }catch(e){}
  }

  // ====== compose (duy nhất)
  function composeReply(q){
    const m=(q||'').trim(); if(!m) return polite("anh/chị thử bấm tag: 🏍️ Xe số, 🛵 Xe ga, ⚡ Xe điện hoặc 📄 Thủ tục nhé");
    const r1 = rule(m); if(r1) return r1;
    if(/(giá|bao nhiêu|tính tiền|bao nhieu|bao nhiều|cost|price|thuê|thue)/i.test(m) || CHEAP_KWS.test(m)) return polite(estimatePrice(m));

    // Ngữ cảnh: BM25 + extractive QA
    try{
      const ctx = safe(localStorage.getItem(K.ctx)) || [];
      if(ctx.length){
        const top = ctx[0];
        if(top){
          if(CFG.smart.extractiveQA){
            const picks = bestSentences((top.title?`${top.title}. `:'') + (top.text||''), m, 2);
            if(picks && picks.length){
              return polite(picks.join(' ') + ` — Xem thêm: ${top.url}`);
            }
          }
          const snippet = (top.title?`${top.title} — `:'') + (top.text || '').slice(0,200);
          return polite(`${snippet} ... Anh/chị xem chi tiết trang: ${top.url}`);
        }
      }
    }catch(e){}

    return polite("em chưa tìm được thông tin trùng khớp. Anh/chị nói rõ loại xe hoặc thời gian thuê giúp em với ạ.");
  }

  // ====== Open/Close/Send & A11y
  let isOpen=false, sending=false, lastFocus=null;

  function openChat(){
    if(isOpen) return;
    lastFocus = document.activeElement;
    const card = $('#mta-card');
    const backdrop = $('#mta-backdrop');
    if(!card || !backdrop) return;
    card.classList.add('open');
    backdrop.classList.add('show');
    card.setAttribute('aria-hidden','false');
    $('#mta-bubble').style.display='none';
    isOpen=true; renderSess();
    setTimeout(()=>{ try{ $('#mta-in').focus(); }catch(e){} }, 120);
  }
  function closeChat(){
    if(!isOpen) return;
    const card = $('#mta-card');
    const backdrop = $('#mta-backdrop');
    if(card) card.classList.remove('open');
    if(backdrop) backdrop.classList.remove('show');
    if(card) card.setAttribute('aria-hidden','true');
    $('#mta-bubble').style.display='flex';
    isOpen=false; hideTyping();
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
  }
  function clearChat(){ try{ localStorage.removeItem(K.sess); localStorage.removeItem(K.ctx); }catch(e){}; const b=$('#mta-body'); if(b) b.innerHTML=''; addMsg('bot', polite('đã xóa hội thoại')); }

  async function sendUser(text){
    if(sending) return; sending=true;
    addMsg('user', text);
    try{ updateCtxWithUser(text); }catch(e){}
    showTyping(); const typingDelay = 2500 + Math.random()*2500; await sleep(typingDelay);
    let ans;
    try{ ans = composeReply(text); }catch(e){ ans = null; }
    hideTyping(); addMsg('bot', ans || polite(`xin lỗi, có lỗi khi trả lời. Anh/chị liên hệ Zalo ${CFG.phone} giúp em nhé.`));
    sending=false;
  }

  // Auto-avoid obstacles
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

  // Focus trap + ESC
  document.addEventListener('keydown', (e)=>{
    if(!isOpen) return;
    if(e.key === 'Escape'){ e.preventDefault(); closeChat(); return; }
    if(e.key === 'Tab'){
      const card = $('#mta-card');
      if(!card) return;
      const focusables = card.querySelectorAll('button,[href],input,textarea,select,[tabindex]:not([tabindex="-1"])');
      const list = Array.from(focusables).filter(el => !el.disabled && el.offsetParent !== null);
      if(!list.length) return;
      const first = list[0], last = list[list.length-1];
      if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
      else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
    }
  }, {capture:true});

  // ===== Bind UI events
  function bindScrollTags(){
    const track = document.getElementById('tagTrack'); const box = document.getElementById('mta-tags'); if(!track||!box) return;
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

    const input = document.getElementById('mta-in');
    if(input){
      input.addEventListener('focus', ()=> box.classList.add('hidden'));
      input.addEventListener('blur',  ()=> { if(!input.value.trim()) box.classList.remove('hidden'); });
      input.addEventListener('input', ()=> { if(input.value.trim().length>0) box.classList.add('hidden'); else box.classList.remove('hidden'); });
    }
  }

  // ===== Boot
  ready(async ()=>{
    const hour=new Date().getHours(); if(hour>19||hour<6) document.body.classList.add('ai-night');
    injectUI(); bindScrollTags(); checkObstacles();

    // Bind UI handlers
    $('#mta-bubble') && $('#mta-bubble').addEventListener('click', openChat);
    $('#mta-backdrop') && $('#mta-backdrop').addEventListener('click', closeChat);
    $('#mta-close') && $('#mta-close').addEventListener('click', closeChat);
    $('#mta-clear') && $('#mta-clear').addEventListener('click', clearChat);
    $('#mta-send') && $('#mta-send').addEventListener('click', ()=>{ const v=($('#mta-in').value||'').trim(); if(!v) return; $('#mta-in').value=''; sendUser(v); });
    $('#mta-in') && $('#mta-in').addEventListener('keydown',(e)=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); const v=($('#mta-in').value||'').trim(); if(!v) return; $('#mta-in').value=''; sendUser(v); }});
    window.addEventListener('resize', checkObstacles, {passive:true});
    window.addEventListener('scroll', checkObstacles, {passive:true});
    if(window.visualViewport) window.visualViewport.addEventListener('resize', checkObstacles, {passive:true});
    setTimeout(()=>{ if(!$('#mta-bubble')) injectUI(); }, 2500);

    console.log('%cMotoAI v27 AutoLearn MultiSite — UI ready (Semantic + QA + AutoPrice)','color:#0084FF;font-weight:bold;');

    // Tự hợp nhất auto-prices vào PRICE_TABLE (percentile)
    if (CFG.smart.autoPriceLearn){
      try{
        const autos = safe(localStorage.getItem(K.autoprices))||[];
        if(autos.length){
          const byType = autos.reduce((m,a)=>{ (m[a.type]||(m[a.type]=[])).push(a.price); return m; }, {});
          for(const t of Object.keys(byType)){
            const arr = byType[t].sort((a,b)=>a-b);
            const p25 = arr[Math.floor(arr.length*0.25)];
            const p50 = arr[Math.floor(arr.length*0.50)];
            if(PRICE_TABLE[t]){
              const dayRange = [p25, p50].filter(Boolean);
              if(dayRange.length) PRICE_TABLE[t].day = dayRange;
            }
          }
        }
      }catch(e){}
    }

    // AutoLearn
    if(CFG.autolearn){
      const sites = Array.from(new Set([location.origin, ...(CFG.extraSites||[])]));
      try{
        (async()=>{
          await learnSites(sites, false);
          console.log('MotoAI v27 autolearn: finished initial learn (localStorage key)', K.learn);
        })();
      }catch(e){ console.warn('MotoAI v27 autolearn err', e); }
    }
  });

  // ===== Expose API (giữ tương thích)
  const api = {
    learnNow: async function(sites, force){
      try{
        const list = Array.isArray(sites) && sites.length ? sites : (CFG.extraSites||[]);
        const combined = Array.from(new Set([location.origin, ...list]));
        console.log('MotoAI v27 learnNow:', combined, 'force', !!force);
        const res = await learnSites(combined, !!force);
        return res;
      }catch(e){ console.warn('MotoAI v27 learnNow error', e); return null; }
    },
    getIndex: function(){ return getIndex(); },
    clearLearnCache: function(){ clearLearnCache(); }
  };

  window.MotoAI_v27_autolearn = api;
  // Alias để drop-in thay v26 (tương thích)
  window.MotoAI_v26_autolearn = window.MotoAI_v26_autolearn || api;

  window.MotoAI_v27 = {
    open: ()=>{ try{ openChat(); }catch(e){} },
    close: ()=>{ try{ closeChat(); }catch(e){} }
  };
  // Alias cho v26
  window.MotoAI_v26 = window.MotoAI_v26 || window.MotoAI_v27;

})();
