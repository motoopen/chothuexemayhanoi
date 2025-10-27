/* motoai_v22_messenger_ultrasafe.js
   MotoAI v22 — Messenger-style UI • SmartCalc • UltraSafe
   - UI 80% kiểu Messenger: header gradient, bong bóng tròn, bubble tròn xanh
   - Giữ toàn bộ logic v21 (SmartCalc, xe giá rẻ, delay 2.5–5s, auto-avoid, adaptive night)
*/
(function(){
  if (window.MotoAI_v22_MESSENGER_ULTRASAFE_LOADED) return;
  window.MotoAI_v22_MESSENGER_ULTRASAFE_LOADED = true;

  // ======= CONFIG (override bằng window.MotoAI_CONFIG nếu cần) =======
  const DEF = {
    brand: "Motoopen",
    phone: "0857255868",
    zalo:  "https://zalo.me/0857255868",
    whatsapp: null, // auto tạo từ phone nếu null
    map: "https://maps.app.goo.gl/2icTBTxAToyvKTE78",
    sitemapCandidates: ["/moto_sitemap.json","/ai_sitemap.json","/sitemap.json"],
    minSentenceLen: 24,
    maxItems: 1400,
    maxInternalPages: 20,
    refreshHours: 24
  };
  const ORG = (window.MotoAI_CONFIG||{});
  if(!ORG.zalo && (ORG.phone||DEF.phone)) ORG.zalo = 'https://zalo.me/' + String(ORG.phone||DEF.phone).replace(/\s+/g,'');
  if(!ORG.whatsapp && (ORG.phone||DEF.phone)){
    const digits = String(ORG.phone||DEF.phone).replace(/\D+/g,'').replace(/^0/,'84');
    ORG.whatsapp = 'https://wa.me/' + digits;
  }
  const CFG = Object.assign({}, DEF, ORG);

  const HOSTKEY = (location.host||"site").replace(/[^a-z0-9.-]/gi,"_");
  const K = {
    corpus: `MotoAI_v22_${HOSTKEY}_corpus`,
    ext:    `MotoAI_v22_${HOSTKEY}_corpus_ext`,
    last:   `MotoAI_v22_${HOSTKEY}_lastLearn`,
    mapH:   `MotoAI_v22_${HOSTKEY}_lastMapHash`,
    sess:   `MotoAI_v22_${HOSTKEY}_session`,
    ctx:    `MotoAI_v22_${HOSTKEY}_ctxV2`
  };

  // ======= Utils =======
  const $  = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const uniq = a => Array.from(new Set(a));
  const safe = s => { try{return JSON.parse(s)}catch(e){return null} };
  const sleep = ms => new Promise(r=>setTimeout(r,ms));
  const tokenize = t => (t||"").toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu," ").split(/\s+/).filter(Boolean);
  const hashText = (str)=>{ try{return btoa(unescape(encodeURIComponent(str))).slice(0,60);}catch(e){let h=0;for(let i=0;i<str.length;i++){h=(h*31+str.charCodeAt(i))|0}return String(h)} };
  const pick = a => a[Math.floor(Math.random()*a.length)];
  const nfVND = n => (n||0).toLocaleString('vi-VN');

  // ======= UI — Messenger-like (80%)
  const ui = `
  <div id="mta-root" aria-live="polite">
    <button id="mta-bubble" aria-label="Mở chat" title="Chat">
      <svg viewBox="0 0 64 64" width="28" height="28" aria-hidden="true">
        <defs>
          <linearGradient id="mtaG" x1="0" x2="1">
            <stop offset="0%" stop-color="#0084FF"/><stop offset="100%" stop-color="#00B2FF"/>
          </linearGradient>
        </defs>
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
      <div id="mta-sugs" role="toolbar" aria-label="Gợi ý nhanh"></div>
      <footer id="mta-input">
        <input id="mta-in" placeholder="Nhắn tin cho ${CFG.brand}..." autocomplete="off" />
        <button id="mta-send" aria-label="Gửi">➤</button>
      </footer>
      <button id="mta-clear" title="Xóa hội thoại" aria-label="Xóa hội thoại">🗑</button>
    </section>
  </div>`;

  const css = `
  :root{--mta-z:2147483647;--m-blue:#0084FF;--m-blue2:#00B2FF;--m-bg:#fff;--m-text:#0b1220;--m-bot:#F1F3F6;--m-user:#0084FF}
  #mta-root{position:fixed;right:16px;left:auto;bottom:calc(18px + env(safe-area-inset-bottom,0));z-index:var(--mta-z);font-family:-apple-system,system-ui,Segoe UI,Roboto,"Helvetica Neue",Arial}
  #mta-bubble{width:60px;height:60px;border:none;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 10px 26px rgba(0,0,0,.2);outline:3px solid #fff}
  #mta-bubble svg{display:block}
  #mta-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.2);opacity:0;pointer-events:none;transition:opacity .18s ease}
  #mta-backdrop.show{opacity:1;pointer-events:auto}
  #mta-card{position:fixed;right:16px;bottom:16px;width:min(420px,calc(100% - 24px));height:70vh;max-height:740px;background:var(--mta-bg);color:var(--mta-text);border-radius:18px;box-shadow:0 14px 40px rgba(0,0,0,.25);transform:translateY(110%);opacity:.99;display:flex;flex-direction:column;overflow:hidden;transition:transform .20s cubic-bezier(.22,1,.36,1)}
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
  .m-msg.user{background:var(--m-user);color:#fff;margin-left:auto;border:1px solid rgba(0,0,0,.05)}
  #mta-typing{display:inline-flex;gap:6px;align-items:center}
  #mta-typing-dots{display:inline-block;min-width:14px}
  #mta-sugs{display:flex;gap:6px;flex-wrap:wrap;padding:8px 10px;background:#f7f9fc;border-top:1px solid rgba(0,0,0,.06)}
  #mta-sugs button{border:1px solid rgba(0,0,0,.08);background:#fff;color:#0b1220;padding:7px 10px;border-radius:14px;cursor:pointer;font-weight:600}
  #mta-input{display:flex;gap:8px;padding:10px;background:#fff;border-top:1px solid rgba(0,0,0,.06)}
  #mta-in{flex:1;padding:11px 12px;border-radius:20px;border:1px solid rgba(0,0,0,.12);font-size:15px;background:#F6F8FB}
  #mta-send{width:42px;height:42px;border:none;border-radius:50%;background:linear-gradient(90deg,var(--m-blue),var(--m-blue2));color:#fff;font-weight:800;cursor:pointer;box-shadow:0 6px 18px rgba(0,132,255,.35)}
  #mta-clear{position:absolute;top:10px;right:48px;background:none;border:none;font-size:16px;color:#fff;opacity:.9;cursor:pointer}
  @media(max-width:520px){
    #mta-card{width:calc(100% - 16px);right:8px;left:8px;height:72vh}
    #mta-bubble{width:56px;height:56px}
  }
  @media(prefers-color-scheme:dark){
    :root{--m-bg:#1b1c1f;--m-text:#eaeef3;--m-bot:#2a2d34}
    #mta-body{background:#1f2127}
    .m-msg.bot{background:#2a2d34;color:#eaeef3;border:1px solid rgba(255,255,255,.06)}
    .m-msg.user{filter:saturate(1.05)}
    #mta-in{background:#16181c;color:#f0f3f7;border:1px solid rgba(255,255,255,.12)}
    #mta-sugs{background:#1f2127;border-top:1px solid rgba(255,255,255,.08)}
  }
  .ai-night #mta-bubble{box-shadow:0 0 18px rgba(0,132,255,.35)!important;}
  `;

  // ======= Inject
  function injectUI(){
    if ($('#mta-root')) return;
    const wrap = document.createElement('div'); wrap.innerHTML = ui; document.body.appendChild(wrap.firstElementChild);
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  }
  function ready(fn){
    if(document.readyState==="complete"||document.readyState==="interactive"){ fn(); }
    else document.addEventListener("DOMContentLoaded", fn);
  }

  // ======= State & Storage
  let isOpen=false, sending=false;
  let corpus=[], ext=[]; let typingBlinkTimer=null;
  function load(){ try{ corpus=safe(localStorage.getItem(K.corpus))||[] }catch(e){}; try{ ext=safe(localStorage.getItem(K.ext))||[] }catch(e){} }
  function save(){ try{ localStorage.setItem(K.corpus, JSON.stringify(corpus)) }catch(e){}; try{ localStorage.setItem(K.ext, JSON.stringify(ext)) }catch(e){} }

  // ======= UI helpers
  function addMsg(role,text){
    if(!text) return;
    const el = document.createElement('div'); el.className = 'm-msg '+(role==='user'?'user':'bot'); el.textContent = text;
    $('#mta-body').appendChild(el); $('#mta-body').scrollTop = $('#mta-body').scrollHeight;
    try{ const arr=safe(localStorage.getItem(K.sess))||[]; arr.push({role,text,t:Date.now()}); localStorage.setItem(K.sess, JSON.stringify(arr.slice(-200))); }catch(e){}
  }
  function renderSess(){
    const body = $('#mta-body'); body.innerHTML='';
    const arr = safe(localStorage.getItem(K.sess))||[];
    if(arr.length){ arr.forEach(m=> addMsg(m.role,m.text)); }
    else addMsg('bot', `Xin chào 👋, em là nhân viên hỗ trợ của ${CFG.brand}. Anh/chị muốn xem 🏍️ Xe số, 🛵 Xe ga, ⚡ Xe điện hay 📄 Thủ tục thuê xe ạ?`);
  }
  function showTyping(){
    const d=document.createElement('div'); d.id='mta-typing'; d.className='m-msg bot'; d.textContent='Đang nhập ';
    const dot=document.createElement('span'); dot.id='mta-typing-dots'; dot.textContent='…';
    d.appendChild(dot); $('#mta-body').appendChild(d); $('#mta-body').scrollTop=$('#mta-body').scrollHeight;
    let i=0; typingBlinkTimer=setInterval(()=>{ dot.textContent='.'.repeat((i++%3)+1); }, 400);
  }
  function hideTyping(){ const d=$('#mta-typing'); if(d) d.remove(); if(typingBlinkTimer){ clearInterval(typingBlinkTimer); typingBlinkTimer=null; } }

  // ======= Learn (DOM + sitemap + internal)
  async function fetchTextOrHtml(url){
    try{
      const r=await fetch(url,{cache:'no-store'}); if(!r.ok) return '';
      const ct=(r.headers.get('content-type')||'').toLowerCase();
      if(ct.includes('text/plain')) return await r.text();
      const html=await r.text(); const tmp=document.createElement('div'); tmp.innerHTML=html;
      const nodes=tmp.querySelectorAll('p,h1,h2,h3,li');
      return Array.from(nodes).map(n=>(n.textContent||'').trim()).filter(t=>t.length>=CFG.minSentenceLen).join('\n');
    }catch(e){ return ''; }
  }
  function buildFromDOM(){
    try{
      let nodes = $$('#main, main, article, section'); if(!nodes.length) nodes=[document.body];
      let texts=[];
      nodes.forEach(n=>{
        n.querySelectorAll('h1,h2,h3').forEach(h=>{ const t=h.innerText?.trim(); if(t && t.length>12) texts.push(t); });
        n.querySelectorAll('p,li').forEach(p=>{ const t=p.innerText?.trim(); if(t && t.length>=CFG.minSentenceLen) texts.push(t); });
      });
      if(!texts.length){ const m=document.querySelector('meta[name="description"]'); if(m?.content) texts.push(m.content); }
      texts=uniq(texts).slice(0,CFG.maxItems);
      corpus = texts.map((t,i)=>({id:i,text:t,tokens:tokenize(t)}));
      save();
    }catch(e){}
  }
  async function discoverSitemaps(){
    const urls = uniq(CFG.sitemapCandidates.map(u=> u.startsWith('http')?u:(location.origin+u)));
    const found=[];
    for(const u of urls){
      try{
        const r=await fetch(u,{cache:'no-store'}); if(!r.ok) continue;
        const ct=(r.headers.get('content-type')||'').toLowerCase();
        if(ct.includes('json') || u.endsWith('.json')) found.push(u);
        else { const t=await r.text(); try{ JSON.parse(t); found.push(u);}catch(e){} }
      }catch(e){}
    }
    return found;
  }
  async function learnFromSitemaps(maps){
    let list=[];
    for(const s of maps){
      try{
        const r=await fetch(s,{cache:'no-store'}); if(!r.ok) continue; const data=await r.json(); if(Array.isArray(data.pages)) list=list.concat(data.pages);
      }catch(e){}
    }
    list=uniq(list).slice(0,CFG.maxItems*2);
    let added=0;
    for(const p of list){
      const txt = await fetchTextOrHtml(p); if(!txt) continue;
      const lines = txt.split(/\n+/).map(x=>x.trim()).filter(x=>x.length>=CFG.minSentenceLen);
      for(const l of lines){ if(!ext.includes(l)){ ext.push(l); added++; } if(ext.length>=CFG.maxItems) break; }
      if(ext.length>=CFG.maxItems) break;
      await sleep(60);
    }
    if(added){ save(); }
  }
  function internalLinks(){
    const list = $$('a[href]').map(a=>a.getAttribute('href')).filter(Boolean)
      .map(h=>{ try{ return new URL(h,location.href).href }catch(e){ return null }})
      .filter(Boolean).filter(u=>u.startsWith(location.origin))
      .filter(u=>!/\.(png|jpe?g|gif|webp|svg|pdf|zip|rar|7z|mp4|mp3|ico)(\?|$)/i.test(u))
      .filter(u=>!u.includes('#')).filter(u=>u!==location.href);
    return uniq(list).slice(0,CFG.maxInternalPages);
  }
  async function learnInternal(){
    const pages = internalLinks(); if(!pages.length) return;
    let added=0;
    for(const url of pages){
      const txt = await fetchTextOrHtml(url); if(!txt) continue;
      const lines = txt.split(/\n+/).map(x=>x.trim()).filter(x=>x.length>=CFG.minSentenceLen);
      for(const l of lines){ if(!ext.includes(l)){ ext.push(l); added++; } if(ext.length>=CFG.maxItems) break; }
      if(ext.length>=CFG.maxItems) break;
      await sleep(180);
    }
    if(added){ save(); }
  }
  async function checkAndLearn(){
    const maps = await discoverSitemaps();
    if(!maps.length){ await learnInternal(); return; }
    let combined='';
    for(const s of maps){ try{ const r=await fetch(s,{cache:'no-store'}); if(!r.ok) continue; combined+=await r.text(); }catch(e){} }
    const h = hashText(combined);
    const old = localStorage.getItem(K.mapH)||'';
    if(h!==old){ localStorage.setItem(K.mapH,h); await learnFromSitemaps(maps); }
    else { await learnInternal(); }
  }
  async function schedule(force=false){
    const now=Date.now(); const last=parseInt(localStorage.getItem(K.last)||'0',10)||0;
    const need = force || !last || (now-last) > CFG.refreshHours*3600*1000;
    if(!need) return; await checkAndLearn(); localStorage.setItem(K.last,String(Date.now()));
  }

  // ======= Smart Context v2 + polite
  const TOPIC_LEX = [
    {key:'xe_so',    kws:['xe số','wave','blade','sirius','jupiter']},
    {key:'xe_ga',    kws:['xe ga','vision','lead','air blade','airblade','ab']},
    {key:'xe_50cc',  kws:['50cc','cub 50','xe 50','xe 50cc']},
    {key:'xe_dien',  kws:['xe điện','vinfast','yadea','dibao','gogo']},
    {key:'thu_tuc',  kws:['thủ tục','giấy tờ','đặt cọc','cọc','cccd','cmnd','passport','bằng lái']},
    {key:'gia',      kws:['giá','bảng giá','bao nhiêu','thuê ngày','thuê tuần','thuê tháng']},
    {key:'giao',     kws:['giao tận nơi','giao xe','ship xe','nhận xe','trả xe']},
  ];
  function detectTopics(text){ const low=(text||'').toLowerCase(); const found=[]; for(const t of TOPIC_LEX){ if(t.kws.some(k=> low.includes(k))) found.push(t.key); } return uniq(found); }
  function getCtx(){ let c=safe(localStorage.getItem(K.ctx))||{topics:[]}; if(!Array.isArray(c.topics)) c.topics=[]; return c; }
  function setCtx(c){ try{ localStorage.setItem(K.ctx, JSON.stringify({topics:(c.topics||[]).slice(-3)})) }catch(e){} }
  function updateCtxWithUser(utext){ const c=getCtx(); const found=detectTopics(utext); if(found.length){ c.topics=uniq((c.topics||[]).concat(found)).slice(-3); setCtx(c); } }

  const PREFIX = ["Chào anh/chị,","Xin chào 👋,","Em chào anh/chị nhé,","Rất vui được hỗ trợ anh/chị,"];
  const SUFFIX = [" ạ."," nhé ạ."," nha anh/chị."," ạ, cảm ơn anh/chị."];

  function polite(t){ t=(t||"").trim(); if(!t) return "Em chưa nhận được câu hỏi, anh/chị thử nhập lại giúp em nhé."; return /[.!?…]$/.test(t)? `${pick(PREFIX)} ${t}${pick(SUFFIX)}` : `${pick(PREFIX)} ${t}${pick(SUFFIX)}`; }

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
    ]},
    {re:/(tốt|hay|cảm ơn|thanks|tuyệt|ok|oke)/i, ans:["Rất vui vì anh/chị hài lòng 😄","Cảm ơn anh/chị nhiều ạ! ❤️"]},
    {re:/(tệ|chán|dở|buồn|khó chịu|không ổn)/i, ans:["Em xin lỗi nếu trải nghiệm chưa tốt 😔","Bọn em sẽ cải thiện để phục vụ anh/chị tốt hơn ạ."]}
  ];
  function rule(q){ for(const r of RULES){ if(r.re.test(q)) return polite(pick(r.ans)); } return null; }

  // ======= PRICE TABLE + SmartCalc
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
  function detectSpan(t){
    const low=t.toLowerCase();
    if(/tuần|tuan|week/i.test(low)) return 'week';
    if(/tháng|thang|month/i.test(low)) return 'month';
    return 'day';
  }
  function detectQty(t){
    const m = t.match(/(\d+)\s*(ngày|day|tuần|tuan|week|tháng|thang|month)?/i);
    if(!m) return null;
    const n = parseInt(m[1],10); if(!n || n<=0) return null;
    let unit = 'day'; if(m[2]) unit = detectSpan(m[2]); return {n,unit};
  }
  function formatRange(arr){ if(!arr||!arr.length) return null; return arr.length===1 ? nfVND(arr[0])+'đ' : nfVND(arr[0])+'–'+nfVND(arr[1])+'đ'; }
  function baseFor(type, unit){ const it=PRICE_TABLE[type]; if(!it) return null; const arr=it[unit]; if(!arr) return null; return arr[0]; }
  function summariseType(type){
    const it=PRICE_TABLE[type]; if(!it) return '';
    const d=formatRange(it.day), w=formatRange(it.week), m=formatRange(it.month);
    const bits=[]; if(d) bits.push(d+'/ngày'); if(w) bits.push(w+'/tuần'); if(m) bits.push(m+'/tháng'); return bits.join(', ');
  }
  function estimatePrice(text){
    let type = detectType(text) || 'xe số';
    const qty  = detectQty(text);
    if(!qty){
      return `Giá ${type} khoảng ${summariseType(type)}. Anh/chị có thể liên hệ Zalo ${CFG.phone} để xem xe và nhận giá chính xác nhất ạ.`;
    }
    const unit = qty.unit; const n = qty.n;
    const base = baseFor(type, unit);
    if(!base){
      return `Giá theo ${unit} của ${type} hiện chưa có trong bảng. Anh/chị liên hệ Zalo ${CFG.phone} để báo giá chính xác giúp em nhé.`;
    }
    const total = base * n;
    const label = unit==='day' ? `${n} ngày` : unit==='week' ? `${n} tuần` : `${n} tháng`;
    return `Giá dự kiến thuê ${type} ${label} khoảng ${nfVND(total)}đ ạ (ước tính). Anh/chị có thể liên hệ Zalo ${CFG.phone} để xem xe và nhận giá chính xác nhất ạ.`;
  }

  // ======= Retrieve + Context bias
  function retrieve(q){
    const qt = tokenize(q).filter(t=>t.length>1);
    const ctx = getCtx(); const ctxTokens = [];
    const biasMap = {
      xe_so:['xe số','wave','blade','sirius'],
      xe_ga:['xe ga','vision','lead','air blade','airblade'],
      xe_50cc:['50cc','xe 50'],
      xe_dien:['xe điện','vinfast','yadea','dibao'],
      thu_tuc:['thủ tục','giấy tờ','cọc','đặt cọc','cccd','passport','bằng lái'],
      gia:['giá','bảng giá','thuê ngày','thuê tuần','thuê tháng'],
      giao:['giao xe','giao tận nơi','ship xe']
    };
    (ctx.topics||[]).forEach(tp=>{ if(biasMap[tp]) ctxTokens.push(...biasMap[tp]); });
    const pool = (corpus||[]).concat(ext||[]); if(!pool.length) return null;
    let best={s:-1,t:null};
    for(const it of pool){
      const line = typeof it==='string'? it : it.text; const low=(line||'').toLowerCase(); let s=0;
      for(const w of qt){ if(low.includes(w)) s+=1; } for(const w of ctxTokens){ if(low.includes(w)) s+=1.2; }
      if(s>best.s) best={s,t:line};
    }
    return best.s>0 ? polite(best.t + ` Anh/chị có thể liên hệ Zalo ${CFG.phone} để xem xe và nhận giá chính xác nhất ạ.`) : null;
  }

  function compose(q){
    const m=(q||'').trim(); if(!m) return polite("anh/chị thử bấm gợi ý: 🏍️ Xe số, 🛵 Xe ga, ⚡ Xe điện hoặc 📄 Thủ tục nhé");
    const r1=rule(m); if(r1) return r1;
    if(/(giá|bao nhiêu|tính tiền|bao nhieu|bao nhiều|cost|price|thuê|thue)/i.test(m) || CHEAP_KWS.test(m)){
      return polite(estimatePrice(m));
    }
    const r2=retrieve(m); if(r2) return r2;
    return polite("em chưa tìm được thông tin trùng khớp. Anh/chị nói rõ loại xe hoặc thời gian thuê giúp em với ạ.");
  }

  // ======= Open/Close/Clear
  function openChat(){ if(isOpen) return; $('#mta-card').classList.add('open'); $('#mta-backdrop').classList.add('show'); $('#mta-bubble').style.display='none'; isOpen=true; renderSess(); setTimeout(()=>{ try{$('#mta-in').focus()}catch(e){} },120); }
  function closeChat(){ if(!isOpen) return; $('#mta-card').classList.remove('open'); $('#mta-backdrop').classList.remove('show'); $('#mta-bubble').style.display='flex'; isOpen=false; hideTyping(); }
  function clearChat(){ try{ localStorage.removeItem(K.sess); localStorage.removeItem(K.ctx);}catch(e){}; $('#mta-body').innerHTML=''; addMsg('bot', polite('đã xóa hội thoại')); }

  // ======= Quick-Sense + SUGS
  const SUGS = [
    {q:'Xe số',      label:'🏍️ Xe số',     inject:'Giá thuê xe số theo ngày/tuần/tháng'},
    {q:'Xe ga',      label:'🛵 Xe ga',     inject:'Giá thuê xe ga (Vision/AB)'},
    {q:'Xe 50cc',    label:'🚲 Xe 50cc',   inject:'Giá thuê xe 50cc và điều kiện'},
    {q:'Xe điện',    label:'⚡ Xe điện',   inject:'Giá thuê xe điện và thời hạn'},
    {q:'Thủ tục',    label:'📄 Thủ tục',   inject:'Thủ tục thuê xe + đặt cọc'},
    {q:'Liên hệ',    label:'☎️ Liên hệ',   inject:`SĐT ${CFG.phone} / Zalo`}
  ];
  function quickSense(){
    const p = location.pathname.toLowerCase();
    if(p.includes('banggia')) SUGS.unshift({q:'Bảng giá',label:'💰 Báo giá',inject:'Giá thuê từng loại xe'});
    if(p.includes('thu')) SUGS.unshift({q:'Thủ tục',label:'📄 Thủ tục',inject:'Thủ tục thuê và đặt cọc'});
    if(p.includes('loaixe')) SUGS.unshift({q:'Loại xe',label:'🚘 Loại xe',inject:'Phân loại: xe số, xe ga, xe điện'});
  }
  function buildSugs(){
    const box=$('#mta-sugs'); if(!box) return; box.innerHTML='';
    SUGS.forEach(s=>{ const b=document.createElement('button'); b.type='button'; b.textContent=s.label; b.addEventListener('click',()=>{ if(!isOpen) openChat(); setTimeout(()=> sendUser(s.inject||s.q),80); }); box.appendChild(b); });
  }

  // ======= Send + typing delay (2.5–5s)
  async function sendUser(text){
    if(sending) return; sending=true;
    addMsg('user', text); try{ updateCtxWithUser(text); }catch(e){}
    showTyping(); const typingDelay = 2500 + Math.random()*2500; await sleep(typingDelay);
    let ans; try{ ans = compose(text); }catch(e){ ans = null; }
    hideTyping(); addMsg('bot', ans || polite(`xin lỗi, có lỗi khi trả lời. Anh/chị liên hệ Zalo ${CFG.phone} giúp em nhé.`));
    sending=false;
  }

  // ======= Auto-avoid obstacles
  function checkObstacles(){
    const root = $('#mta-root'); if(!root) return;
    const blockers = document.querySelector('.bottom-appbar, .quick-call, #quick-call');
    let bottom = 'calc(18px + env(safe-area-inset-bottom, 0))';
    if(blockers){
      const r = blockers.getBoundingClientRect();
      const space = window.innerHeight - r.top;
      if(space < 120) bottom = (space + 70) + 'px';
    }
    if(window.visualViewport){ const vv = window.visualViewport; if(vv.height < window.innerHeight - 120) bottom = '110px'; }
    root.style.bottom = bottom; root.style.right = '16px'; root.style.left = 'auto';
  }

  // ======= Boot
  ready(async ()=>{
    const hour=new Date().getHours(); if(hour>19||hour<6) document.body.classList.add('ai-night');

    injectUI(); load(); if(!corpus.length) buildFromDOM(); quickSense(); buildSugs();

    // Bind
    $('#mta-bubble').addEventListener('click', ()=>{ buildFromDOM(); openChat(); });
    $('#mta-backdrop').addEventListener('click', closeChat);
    $('#mta-close').addEventListener('click', closeChat);
    $('#mta-clear').addEventListener('click', clearChat);
    $('#mta-send').addEventListener('click', ()=>{ const v=($('#mta-in').value||'').trim(); if(!v) return; $('#mta-in').value=''; sendUser(v); });
    $('#mta-in').addEventListener('keydown',(e)=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); const v=($('#mta-in').value||'').trim(); if(!v) return; $('#mta-in').value=''; sendUser(v); }});

    schedule(false); setInterval(()=> schedule(false), 6*60*60*1000);

    checkObstacles();
    window.addEventListener('resize', checkObstacles, {passive:true});
    window.addEventListener('scroll', checkObstacles, {passive:true});
    if(window.visualViewport) window.visualViewport.addEventListener('resize', checkObstacles, {passive:true});
    setInterval(checkObstacles, 1200);

    setTimeout(()=>{ if(!$('#mta-bubble')) injectUI(); }, 2500);
  });

  // ======= Expose
  window.MotoAI_v22_messenger = {
    open: ()=>{ try{openChat()}catch(e){} },
    close: ()=>{ try{closeChat()}catch(e){} },
    learnNow: ()=>schedule(true),
    getCorpus: ()=>({dom:(corpus||[]).slice(0,200), ext:(ext||[]).slice(0,200)}),
    clearCorpus: ()=>{ corpus=[]; ext=[]; try{localStorage.removeItem(K.ctx)}catch(e){}; save(); }
  };
})();
