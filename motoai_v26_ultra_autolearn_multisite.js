/* motoai_v26_ultra_autolearn_multisite.js
   MOTOAI v26 (Gộp v22c + v26)
   - UI: Messenger-style v22c (Giao diện ổn định, tag trượt, auto-hide, an toàn iOS)
   - Engine: AutoLearn MultiSite v26 (sitemap.xml, fallback crawl)
   - Tính năng: SmartCalc, polite AI, cache domain 24h, watchdog
   - Tác giả: Motoopen (Tuấn Tú)
*/
(function(){
  if (window.MotoAI_v26_ULTRA_LOADED) return;
  window.MotoAI_v26_ULTRA_LOADED = true;

  // ===== Config (Gộp từ v22c và v26)
  const DEF = {
    brand: "Motoopen",
    phone: "0857255868",
    zalo:  "https://zalo.me/0857255868",
    whatsapp: null,
    map: "https://maps.app.goo.gl/2icTBTxAToyvKTE78",
    minSentenceLen: 24, // (từ v22c)
    // (từ v26)
    autolearn: true,
    extraSites: ["https://motoopen.github.io/chothuexemayhanoi/"],
    crawlDepth: 1, // (không dùng trực tiếp trong logic learnSite mới, nhưng giữ lại)
    refreshHours: 24
  };
  const ORG = (window.MotoAI_CONFIG||{});
  if(!ORG.zalo && (ORG.phone||DEF.phone)) ORG.zalo = 'https://zalo.me/' + String(ORG.phone||DEF.phone).replace(/\s+/g,'');
  if(!ORG.whatsapp && (ORG.phone||DEF.phone)){ // (logic từ v22c)
    const digits = String(ORG.phone||DEF.phone).replace(/\D+/g,'').replace(/^0/,'84');
    ORG.whatsapp = 'https://wa.me/' + digits;
  }
  const CFG = Object.assign({}, DEF, ORG);

  // ===== Utils (Gộp từ v22c và v26)
  const $  = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const safe = s => { try{return JSON.parse(s)}catch(e){return null} };
  const sleep = ms => new Promise(r=>setTimeout(r,ms));
  const pick = a => a[Math.floor(Math.random()*a.length)];
  const nfVND = n => (n||0).toLocaleString('vi-VN');
  const nowSec = () => Math.floor(Date.now()/1000); // (từ v26)
  const toURL = u => { try{return new URL(u);}catch(_){return null;} }; // (từ v26)
  const sameHost = (u,o)=>{ try{return new URL(u).host===new URL(o).host;}catch(_){return false;} }; // (từ v26)

  // ===== UI — Lấy 100% của v22c (yêu cầu của bạn)
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

  // ===== CSS — Lấy 100% của v22c (yêu cầu của bạn)
  const css = `
  :root{--mta-z:2147483647;--m-blue:#0084FF;--m-blue2:#00B2FF;--m-bg:#fff;--m-text:#0b1220}
  #mta-root{position:fixed;right:16px;left:auto;bottom:calc(18px + env(safe-area-inset-bottom,0));z-index:var(--mta-z);font-family:-apple-system,system-ui,Segoe UI,Roboto,"Helvetica Neue",Arial;transition:bottom .25s ease,right .25s ease}
  #mta-bubble{width:60px;height:60px;border:none;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 10px 26px rgba(0,0,0,.2);outline:3px solid #fff}
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
  .m-msg.user{background:#0084FF;color:#fff;margin-left:auto;border:1px solid rgba(0,0,0,.05)}
  #mta-typing{display:inline-flex;gap:6px;align-items:center}
  #mta-typing-dots{display:inline-block;min-width:14px}

  /* Scrollable Tags (từ v22c) */
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

  // ===== Inject/Ready (từ v22c)
  function injectUI(){
    if ($('#mta-root')) return;
    const wrap = document.createElement('div'); wrap.innerHTML = ui; document.body.appendChild(wrap.firstElementChild);
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  }
  function ready(fn){
    if(document.readyState==="complete"||document.readyState==="interactive"){ fn(); }
    else document.addEventListener("DOMContentLoaded", fn);
  }

  // ===== State (Gộp, dùng key của v26)
  let isOpen=false, sending=false;
  const K = {
    sess:'MotoAI_v26_ultra_session', // (từ v26)
    learn:'MotoAI_v26_ultra_learn'   // (từ v26)
  };

  // ===== Messaging (từ v22c, dùng key v26)
  function addMsg(role,text){
    if(!text) return;
    const el = document.createElement('div'); el.className = 'm-msg '+(role==='user'?'user':'bot'); el.textContent = text;
    $('#mta-body').appendChild(el); $('#mta-body').scrollTop = $('#mta-body').scrollHeight;
    try{ const arr=safe(localStorage.getItem(K.sess))||[]; arr.push({role,text,t:Date.now()}); localStorage.setItem(K.sess, JSON.stringify(arr.slice(-200))); }catch(e){}
  }
  function renderSess(){
    const body = $('#mta-body'); if(body) body.innerHTML='';
    const arr = safe(localStorage.getItem(K.sess))||[];
    if(arr.length){ arr.forEach(m=> addMsg(m.role,m.text)); }
    else addMsg('bot', `Xin chào 👋, em là nhân viên hỗ trợ của ${CFG.brand}. Anh/chị muốn xem 🏍️ Xe số, 🛵 Xe ga, ⚡ Xe điện hay 📄 Thủ tục thuê xe ạ?`);
  }

  // ===== Typing dots (từ v22c)
  let typingBlinkTimer=null;
  function showTyping(){
    const d=document.createElement('div'); d.id='mta-typing'; d.className='m-msg bot'; d.textContent='Đang nhập ';
    const dot=document.createElement('span'); dot.id='mta-typing-dots'; dot.textContent='…';
    d.appendChild(dot); $('#mta-body').appendChild(d); $('#mta-body').scrollTop=$('#mta-body').scrollHeight;
    let i=0; typingBlinkTimer=setInterval(()=>{ dot.textContent='.'.repeat((i++%3)+1); }, 400);
  }
  function hideTyping(){ const d=$('#mta-typing'); if(d) d.remove(); if(typingBlinkTimer){ clearInterval(typingBlinkTimer); typingBlinkTimer=null; } }

  // ===== AUTOLEARN ENGINE (Lấy 100% từ v26) =====
  async function fetchText(u){try{const r=await fetch(u);if(!r.ok)return null;return await r.text();}catch(_){return null;}}
  function parseXML(t){try{return new DOMParser().parseFromString(t,'text/xml');}catch(_){return null;}}
  async function readSitemap(u){const x=await fetchText(u);if(!x)return[];const d=parseXML(x);if(!d)return[];const idx=[...d.getElementsByTagName('sitemap')].map(s=>s.querySelector('loc')?.textContent).filter(Boolean);if(idx.length){let all=[];for(const l of idx){all.push(...await readSitemap(l));}return all;}return[...d.getElementsByTagName('url')].map(u=>u.querySelector('loc')?.textContent).filter(Boolean);}
  async function fallbackCrawl(origin){const h=await fetchText(origin);if(!h)return[origin];const div=document.createElement('div');div.innerHTML=h;const links=[...div.querySelectorAll('a[href]')].map(e=>new URL(e.getAttribute('href'),origin).toString()).filter(u=>sameHost(u,origin));return [origin,...[...new Set(links)]].slice(0,40);}
  async function learnSite(origin){const maps=[origin+'/sitemap.xml',origin+'/sitemap_index.xml'];let urls=[];for(const u of maps){const got=await readSitemap(u);if(got?.length){urls=got;break;}}if(!urls.length)urls=await fallbackCrawl(origin);const pages=[];for(const u of urls.slice(0,40)){const t=await fetchText(u);if(!t)continue;const title=(t.match(/<title[^>]*>([^<]+)<\/title>/i)||[])[1]||u;pages.push({url:u,title});}return pages;}
  async function doAutoLearn(){
    if(!CFG.autolearn) return;
    // Kiểm tra cache (từ v26)
    const cache=safe(localStorage.getItem(K.learn))||{};
    const host = (toURL(location.origin)||{}).origin;
    const expiry = (cache[host]?.ts || 0) + (CFG.refreshHours * 3600);
    if (nowSec() < expiry && (cache[host]?.pages?.length || 0) > 0) {
      console.log(`%cMotoAI v26: Dùng cache AutoLearn (còn ${Math.round((expiry-nowSec())/60)} phút)`, 'color:#0084FF');
      return;
    }
    console.log('%cMotoAI v26: Bắt đầu AutoLearn (làm mới cache)...', 'color:#0084FF;font-weight:bold;');
    // (logic v26)
    const bases=[location.origin,...CFG.extraSites];
    const newCache={};
    for(const o of bases){
      const siteHost=(toURL(o)||{}).origin;
      if(!siteHost)continue;
      newCache[siteHost]={ts:nowSec(),pages:await learnSite(siteHost)};
    }
    localStorage.setItem(K.learn,JSON.stringify(newCache));
    console.log('%cMotoAI v26: AutoLearn hoàn tất!', 'color:#0084FF;font-weight:bold;');
  }
  function searchKnowledge(q){const c=safe(localStorage.getItem(K.learn))||{};const low=q.toLowerCase();const hits=[];for(const host in c){for(const p of c[host].pages||[]){if(p.title.toLowerCase().includes(low))hits.push(p);if(hits.length>5)break;}}return hits;}

  // ===== AI ENGINE (Gộp logic v22c + v26) =====
  
  // Polite (từ v22c)
  const PREFIX = ["Chào anh/chị,","Xin chào 👋,","Em chào anh/chị nhé,","Rất vui được hỗ trợ anh/chị,"];
  const SUFFIX = [" ạ."," nhé ạ."," nha anh/chị."," ạ, cảm ơn anh/chị."];
  function polite(t){ t=(t||"").trim(); if(!t) return "Em chưa nhận được câu hỏi, anh/chị thử nhập lại giúp em nhé."; return /[.!?…]$/.test(t)? `${pick(PREFIX)} ${t}${pick(SUFFIX)}` : `${pick(PREFIX)} ${t}${pick(SUFFIX)}`; }
  
  // Rules (từ v22c)
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

  // SmartCalc (từ v22c)
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
    if(/xe ga/.test(low)) return 'vision'; // Mặc định xe ga là vision
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

  // Compose (GỘP): Ưu tiên Rule -> SmartCalc -> AutoLearn -> Fallback
  function compose(q){
    const m=(q||'').trim(); 
    if(!m) return polite("anh/chị thử bấm tag: 🏍️ Xe số, 🛵 Xe ga, ⚡ Xe điện hoặc 📄 Thủ tục nhé");
    
    // 1. Ưu tiên Rule (từ v22c)
    const r1=rule(m); if(r1) return r1;
    
    // 2. Ưu tiên SmartCalc (từ v22c)
    if(/(giá|bao nhiêu|tính tiền|bao nhieu|bao nhiều|cost|price|thuê|thue)/i.test(m) || CHEAP_KWS.test(m)) {
      return polite(estimatePrice(m));
    }
    
    // 3. Thử AutoLearn (từ v26)
    const hits=searchKnowledge(m);
    if(hits.length) {
      return polite("Em có tìm thấy vài nội dung liên quan trên website:\n"+hits.map(h=>`• ${h.title}`).join("\n") + `\n\nAnh/chị xem có đúng nội dung mình cần không, hoặc liên hệ Zalo ${CFG.phone} để em tư vấn nhanh nhé.`);
    }

    // 4. Fallback (từ v22c)
    return polite("em chưa tìm được thông tin trùng khớp. Anh/chị nói rõ loại xe hoặc thời gian thuê giúp em với ạ, hoặc liên hệ Zalo ${CFG.phone} để em hỗ trợ trực tiếp nhé.");
  }

  // ===== Open/Close/Clear (từ v22c, dùng key v26)
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
      localStorage.removeItem(K.learn); // Xóa cả cache learn
    }catch(e){}; 
    $('#mta-body').innerHTML=''; 
    addMsg('bot', polite('đã xóa hội thoại và cache. Cache sẽ được học lại.')); 
    doAutoLearn(); // Học lại sau khi xóa
  }

  // ===== Scroll Tags (Lấy 100% từ v22c)
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

  // ===== Send (Lấy 100% từ v22c - vì có typing)
  async function sendUser(text){
    if(sending) return; sending=true;
    addMsg('user', text);
    showTyping(); const typingDelay = 2500 + Math.random()*2500; await sleep(typingDelay);
    let ans; try{ ans = compose(text); }catch(e){ ans = null; }
    hideTyping(); addMsg('bot', ans || polite(`xin lỗi, có lỗi khi trả lời. Anh/chị liên hệ Zalo ${CFG.phone} giúp em nhé.`));
    sending=false;
  }

  // ===== Auto-avoid obstacles (Lấy 100% từ v22c)
  function checkObstacles(){
    const root = $('#mta-root'); if(!root) return;
    // Phát hiện thanh điều hướng, nút gọi nhanh...
    const blockers = document.querySelector('.bottom-appbar, .quick-call, #quick-call, .footer-map, #ft-coccoc-invitation-bar');
    let bottom = 'calc(18px + env(safe-area-inset-bottom, 0))';
    if(blockers){
      const r = blockers.getBoundingClientRect();
      const space = window.innerHeight - r.top; // không gian từ đỉnh của blocker xuống đáy màn hình
      if(space > 0 && space < 120) { // Nếu blocker ở đáy và cao dưới 120px
        bottom = `calc(${space}px + 12px + env(safe-area-inset-bottom, 0))`;
      }
    }
    // Phát hiện bàn phím ảo iOS/Android (từ v22c)
    if(window.visualViewport){
      const vv = window.visualViewport;
      // Khi bàn phím hiện, visualViewport.height < window.innerHeight
      if(vv.height < window.innerHeight - 80) { // 80px là ngưỡng an toàn
         // Tính toán độ lùi của bàn phím
        const keyboardHeight = window.innerHeight - vv.height;
        // Dịch chuyển khung chat lên trên bàn phím
        // vv.offsetTop là khoảng cách từ đỉnh viewport đến đỉnh visualViewport (thường là 0 trừ khi zoom)
        // vv.height là chiều cao nhìn thấy
        // window.innerHeight - vv.height = chiều cao bàn phím (ước tính)
        // Ta muốn đáy của root cách visual viewport 1 ít
        
        // Tính toán an toàn cho iOS
        const newBottom = (window.innerHeight - vv.offsetTop - vv.height) + 10;
        bottom = `${newBottom}px`;
        
        // Điều chỉnh vị trí card thay vì bubble (nếu chat đang mở)
        if(isOpen && $('#mta-card')) {
            const card = $('#mta-card');
            // Dịch chuyển cả card lên
            card.style.bottom = `${newBottom}px`;
            // Dịch chuyển bubble (nếu nó đang hiện)
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

  // ===== Boot (Gộp v22c + v26)
  ready(async ()=>{
    const hour=new Date().getHours(); if(hour>19||hour<6) document.body.classList.add('ai-night');

    injectUI(); 
    bindScrollTags(); // (từ v22c)

    // Bind (từ v22c)
    $('#mta-bubble').addEventListener('click', ()=>{ openChat(); });
    $('#mta-backdrop').addEventListener('click', closeChat);
    $('#mta-close').addEventListener('click', closeChat);
    $('#mta-clear').addEventListener('click', clearChat);
    $('#mta-send').addEventListener('click', ()=>{ const v=($('#mta-in').value||'').trim(); if(!v) return; $('#mta-in').value=''; sendUser(v); });
    $('#mta-in').addEventListener('keydown',(e)=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); const v=($('#mta-in').value||'').trim(); if(!v) return; $('#mta-in').value=''; sendUser(v); }});

    // Auto-avoid (từ v22c)
    checkObstacles();
    window.addEventListener('resize', checkObstacles, {passive:true});
    window.addEventListener('scroll', checkObstacles, {passive:true});
    if(window.visualViewport) window.visualViewport.addEventListener('resize', checkObstacles, {passive:true});

    // Watchdog (từ v22c)
    setTimeout(()=>{ if(!$('#mta-bubble')) injectUI(); }, 2500);

    // Chạy AutoLearn (từ v26)
    await doAutoLearn();

    console.log('%cMotoAI v26 Ultra AutoLearn MultiSite — Active (UI v22c)','color:#0084FF;font-weight:bold;');
  });

  // ===== Expose (API từ v22c, đổi tên)
  window.MotoAI_v26_ultra = {
    open: ()=>{ try{openChat()}catch(e){} },
    close: ()=>{ try{closeChat()}catch(e){} }
  };
})();

