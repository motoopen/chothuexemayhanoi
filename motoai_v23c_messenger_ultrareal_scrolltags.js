/* motoai_v23c_messenger_ultrareal_scrolltags.js
   Messenger-style ~95% • Scrollable Tag Bar • SmartCalc • UltraSafe • iOS Fixes
   Brand: Motoopen | Zalo/Phone: 0857255868 | Map: https://maps.app.goo.gl/2icTBTxAToyvKTE78
   
   --- PHIÊN BẢN ĐÃ FIX UX (ĐÓNG/MỞ MƯỢT + TAG BAR ỔN ĐỊNH) ---
*/
(function(){
  if(window.MotoAI_v23c_MESSENGER_LOADED) return;
  window.MotoAI_v23c_MESSENGER_LOADED = true;

  // ===== Config (có thể override bằng window.MotoAI_CONFIG trước khi nhúng)
  const DEF = {
    brand: "Motoopen",
    phone: "0857255868",
    zalo:  "https://zalo.me/0857255868",
    map:   "https://maps.app.goo.gl/2icTBTxAToyvKTE78",
    minSentenceLen: 24
  };
  const ORG = (window.MotoAI_CONFIG||{});
  if(!ORG.zalo && (ORG.phone||DEF.phone)) ORG.zalo = 'https://zalo.me/' + String(ORG.phone||DEF.phone).replace(/\s+/g,'');
  const CFG = Object.assign({}, DEF, ORG);

  // ===== Utils
  const $  = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const safe = s => { try{return JSON.parse(s)}catch(e){return null} };
  const sleep = ms => new Promise(r=>setTimeout(r,ms));
  const pick  = a => a[Math.floor(Math.random()*a.length)];
  const nfVND = n => (n||0).toLocaleString('vi-VN');
  const IS_IOS = /iP(ad|hone|od)/.test(navigator.userAgent) || (navigator.platform==='MacIntel' && navigator.maxTouchPoints>1);

  // ===== UI — Messenger 95% + Tag bar kéo ngang
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
              <div class="sub">Đang hoạt động 🟢</div>
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
        </div>
        <div class="fade fade-left"></div>
        <div class="fade fade-right"></div>
      </div>

      <footer id="mta-input">
        <input id="mta-in" placeholder="Nhắn tin cho ${CFG.brand}..." autocomplete="off" />
        <button id="mta-send" aria-label="Gửi" title="Gửi">
          <span class="plane">➤</span>
        </button>
      </footer>
      <button id="mta-clear" title="Xóa hội thoại" aria-label="Xóa hội thoại">🗑</button>
    </section>
  </div>`;

  const css = `
  :root{--mta-z:2147483647;--m-blue:#0084FF;--m-blue2:#00B2FF;--m-bg:#fff;--m-text:#0b1220}
  #mta-root{position:fixed;right:16px;left:auto;bottom:calc(18px + env(safe-area-inset-bottom,0));z-index:var(--mta-z);font-family:-apple-system,system-ui,Segoe UI,Roboto,"Helvetica Neue",Arial;transition:bottom .25s ease,right .25s ease;transform:translateZ(0)}
  #mta-bubble{width:60px;height:60px;border:none;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 10px 26px rgba(0,0,0,.2);outline:3px solid #fff;will-change:transform}
  #mta-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.2);opacity:0;pointer-events:none;transition:opacity .18s ease}
  #mta-backdrop.show{opacity:1;pointer-events:auto}
  
  /* === FIX UX 1 (CSS) === */
  #mta-card{
    position:fixed;right:16px;bottom:16px;width:min(420px,calc(100% - 24px));height:70vh;max-height:740px;background:var(--mta-bg);color:var(--mta-text);border-radius:18px;box-shadow:0 14px 40px rgba(0,0,0,.25);transform:translateY(110%);/* opacity:1 để tránh xung đột transform+opacity trên iOS */opacity:1;display:flex;flex-direction:column;overflow:hidden;
    /* Đây là transition cho LÚC ĐÓNG (dùng 'ease-in' - nhanh dần) */
    transition: transform .22s cubic-bezier(0.64, 0, 0.78, 0); 
    will-change:transform
  }
  #mta-card.open{
    transform:translateY(0);
    /* Đây là transition cho LÚC MỞ (dùng 'ease-out' - chậm dần) */
    transition: transform .25s cubic-bezier(0.22, 1, 0.36, 1);
  }
  /* === HẾT FIX UX 1 === */

  #mta-header{background:linear-gradient(90deg,var(--m-blue),var(--m-blue2));color:#fff}
  #mta-header .brand{display:flex;align-items:center;justify-content:space-between;padding:10px 12px}
  #mta-header .left{display:flex;align-items:center;gap:10px}
  .avatar{width:28px;height:28px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify:content:center}
  .info .name{font-weight:800;line-height:1}
  .info .sub{font-size:12px;opacity:.95}
  .quick{display:flex;gap:6px;margin-left:auto;margin-right:6px}
  .q{width:28px;height:28px;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;text-decoration:none;font-size:12px;font-weight:700;background:rgba(255,255,255,.15);color:#fff;border:1px solid rgba(255,255,255,.25)}
  #mta-close{background:none;border:none;font-size:20px;color:#fff;cursor:pointer;opacity:.95}

  #mta-body{flex:1;overflow:auto;padding:14px 12px;background:#E9EEF5;-webkit-overflow-scrolling:touch}
  .m-msg{max-width:80%;margin:8px 0;padding:10px 13px;border-radius:20px;line-height:1.45;box-shadow:0 1px 2px rgba(0,0,0,.05)}
  .m-msg.bot{background:#fff;color:#111;border:1px solid rgba(0,0,0,.04)}
  .m-msg.user{background:#0084FF;color:#fff;margin-left:auto;border:1px solid rgba(0,0,0,.05)}
  #mta-typing{display:inline-flex;gap:6px;align-items:center}
  #mta-typing .dot{width:6px;height:6px;border-radius:50%;background:#555;opacity:.5;animation:blink 1s infinite}
  #mta-typing .dot:nth-child(2){animation-delay:.15s}
  #mta-typing .dot:nth-child(3){animation-delay:.3s}
  @keyframes blink{0%,80%,100%{opacity:.2}40%{opacity:.9}}

  /* Tag bar scrollable */
  #mta-tags{position:relative;background:#f7f9fc;border-top:1px solid rgba(0,0,0,.06)}
  #mta-tags .tag-track{display:block;overflow-x:auto;white-space:nowrap;padding:8px 10px 10px 10px;scroll-behavior:smooth;-webkit-overflow-scrolling:touch}
  #mta-tags button{display:inline-block;margin-right:8px;padding:8px 12px;border:none;border-radius:999px;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.06);border:1px solid rgba(0,0,0,.08);font-weight:600;cursor:pointer}
  #mta-tags button:active{transform:scale(.98)}
  #mta-tags .fade{position:absolute;top:0;bottom:0;width:22px;pointer-events:none;transition:opacity .18s ease}
  #mta-tags .fade-left{left:0;background:linear-gradient(90deg,#f7f9fc,rgba(247,249,252,0));opacity:0}
  #mta-tags .fade-right{right:0;background:linear-gradient(270deg,#f7f9fc,rgba(247,249,252,0));opacity:0}

  #mta-input{display:flex;gap:8px;padding:10px;background:#fff;border-top:1px solid rgba(0,0,0,.06)}
  #mta-in{flex:1;padding:11px 14px;border-radius:22px;border:1px solid rgba(0,0,0,.12);font-size:15px;background:#F6F8FB}
  #mta-send{width:42px;height:42px;border:none;border-radius:50%;background:linear-gradient(90deg,#0084FF,#00B2FF);color:#fff;font-weight:800;cursor:pointer;box-shadow:0 6px 18px rgba(0,132,255,.35)}
  #mta-clear{position:absolute;top:10px;right:48px;background:none;border:none;font-size:16px;color:#fff;opacity:.9;cursor:pointer}

  @media(max-width:520px){
    #mta-card{width:calc(100% - 16px);right:8px;left:8px;height:72vh}
    #mta-bubble{width:56px;height:56px}
  }
  @media(prefers-color-scheme:dark){
    :root{--m-bg:#1b1c1f;--m-text:#eaeef3}
    #mta-body{background:#1f2127}
    .m-msg.bot{background:#2a2d34;color:#eaeef3;border:1px solid rgba(255,255,255,.06)}
    #mta-tags{background:#1f2127;border-top:1px solid rgba(255,255,255,.08)}
    #mta-tags button{background:#2a2d34;color:#eaeef3;border:1px solid rgba(255,255,255,.10)}
    #mta-input{background:#202226;border-top:1px solid rgba(255,255,255,.08)}
    #mta-in{background:#16181c;color:#f0f3f7;border:1px solid rgba(255,255,255,.12)}
  }
  .ai-night #mta-bubble{box-shadow:0 0 18px rgba(0,132,255,.35)!important;}

  @media (prefers-reduced-motion: reduce){
    #mta-backdrop{transition:none}
    #mta-card{transition:none}
  }
  `;

  // ===== Inject
  function injectUI(){
    if($('#mta-root')) return;
    const wrap = document.createElement('div'); wrap.innerHTML = ui; document.body.appendChild(wrap.firstElementChild);
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  }
  function ready(fn){ if(document.readyState==="complete"||document.readyState==="interactive"){ fn(); } else document.addEventListener("DOMContentLoaded", fn); }

  // ===== State + Session
  let isOpen=false, sending=false, animating=false;
  const K = {sess:'MotoAI_v23c_session'};

  function addMsg(role,text){
    if(!text) return;
    const el = document.createElement('div'); el.className = 'm-msg '+(role==='user'?'user':'bot'); el.textContent = text;
    $('#mta-body').appendChild(el); $('#mta-body').scrollTop = $('#mta-body').scrollHeight;
    try{ const arr=safe(localStorage.getItem(K.sess))||[]; arr.push({role,text,t:Date.now()}); localStorage.setItem(K.sess, JSON.stringify(arr.slice(-200))); }catch(e){}
  }
  function renderSess(){
    const body=$('#mta-body'); body.innerHTML='';
    const arr=safe(localStorage.getItem(K.sess))||[];
    if(arr.length){ arr.forEach(m=> addMsg(m.role,m.text)); }
    else addMsg('bot', `Xin chào 👋, em là nhân viên hỗ trợ của ${CFG.brand}. Anh/chị muốn xem 🏍️ Xe số, 🛵 Xe ga, ⚡ Xe điện hay 📄 Thủ tục thuê xe ạ?`);
  }

  // ===== Typing (3 dots)
  function showTyping(){
    const d=document.createElement('div'); d.id='mta-typing'; d.className='m-msg bot';
    d.innerHTML=`<span class="dot"></span><span class="dot"></span><span class="dot"></span>`;
    $('#mta-body').appendChild(d); $('#mta-body').scrollTop=$('#mta-body').scrollHeight;
  }
  function hideTyping(){ const d=$('#mta-typing'); if(d) d.remove(); }

  // ===== Polite & Rules
  const PREFIX = ["Chào anh/chị,","Xin chào 👋,","Em chào anh/chị nhé,","Rất vui được hỗ trợ anh/chị,"];
  const SUFFIX = [" ạ."," nhé ạ."," nha anh/chị."," ạ, cảm ơn anh/chị."];
  const pickText = t => (/[\.\!\?…]$/.test(t)?t:t+'.');
  function polite(t){ t=(t||"").trim(); if(!t) return "Em chưa nhận được câu hỏi, anh/chị thử nhập lại giúp em nhé."; return `${pick(PREFIX)} ${pickText(t)}${pick(SUFFIX)}`; }
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
  const CHEAP_KWS = /(rẻ|giá rẻ|rẻ nhất|bình dân|sinh viên|hssv|xe rẻ)/i;
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
  function compose(q){
    const m=(q||'').trim(); if(!m) return polite("anh/chị thử chọn tag phía dưới hoặc nhập câu hỏi giúp em nhé");
    const r1=rule(m); if(r1) return r1;
    if(/(giá|bao nhiêu|tính tiền|bao nhieu|bao nhiều|cost|price|thuê|thue)/i.test(m) || CHEAP_KWS.test(m)) return polite(estimatePrice(m));
    return polite("em chưa tìm được thông tin trùng khớp. Anh/chị nói rõ loại xe hoặc thời gian thuê giúp em với ạ.");
  }

  // ===== Open/Close/Clear + iOS/Safari ultra-safe
  function forceReflow(el){ try{ void el.offsetHeight; }catch(e){} }

  // === TỐI ƯU THÊM 1/3: Tag Fades ===
  // Đưa hàm này ra ngoài scope của bindTags để dùng chung
  function updateTagFades(){
    const track = $('#tagTrack'); if(!track) return;
    try { // Thêm try/catch để siêu an toàn
      const left = track.scrollLeft > 2;
      // Dùng > 3 để xử lý sai số sub-pixel tốt hơn
      const right = (track.scrollWidth - track.clientWidth - track.scrollLeft) > 3; 
      const fl=$('.fade-left'), fr=$('.fade-right');
      if(fl) fl.style.opacity = left ? 1 : 0;
      if(fr) fr.style.opacity = right ? 1 : 0;
    } catch(e) {/*bỏ qua lỗi nếu DOM chưa sẵn sàng*/}
  }

  function openChat(){
    if(isOpen || animating) return;
    animating = true;

    const card = $('#mta-card');
    const backdrop = $('#mta-backdrop');
    const bubble = $('#mta-bubble');

    // chuẩn bị lớp nền an toàn để tránh “đơ”
    backdrop.style.opacity = '0';
    backdrop.style.pointerEvents = 'auto';
    forceReflow(backdrop); // đảm bảo frame tách bạch

    // Ẩn bubble bằng visibility để tránh layout giật
    bubble.style.visibility = 'hidden';
    bubble.style.pointerEvents = 'none';

    // Hiển thị card/backdrop theo 2 frame để iOS không kẹt GPU
    requestAnimationFrame(()=>{
      backdrop.classList.add('show');
      requestAnimationFrame(()=>{
        card.classList.add('open');
        document.body.style.overflow='hidden';
        isOpen = true;
        animating = false;
        renderSess();
        
        // === TỐI ƯU THÊM 2/3: Tag Fades ===
        // Gọi update mỗi khi mở chat, vì clientWidth có thể đã thay đổi
        setTimeout(updateTagFades, 50); 
        
        // Không tự focus trên iOS để tránh keyboard lock
        if(!IS_IOS){
          setTimeout(()=>{ try{$('#mta-in').focus()}catch(e){} }, 140);
        }
      });
    });
  }

  function closeChat(){
    if(!isOpen || animating) return;
    animating = true;

    const card = $('#mta-card');
    const backdrop = $('#mta-backdrop');
    const bubble = $('#mta-bubble');

    try{$('#mta-in').blur();}catch(e){}

    // === FIX UX 2 (ĐỒNG BỘ) ===
    // Kích hoạt cả hai animation CÙNG LÚC
    card.classList.remove('open');
    backdrop.classList.remove('show'); 
    // =========================

    const onDone = ()=>{
      // backdrop.classList.remove('show'); // <-- ĐÃ CHUYỂN LÊN TRÊN
      backdrop.style.pointerEvents = 'none';
      bubble.style.visibility = 'visible';
      bubble.style.pointerEvents = 'auto';
      document.body.style.overflow='';
      isOpen=false; animating=false; hideTyping();
      card.removeEventListener('transitionend', onDone);
      // fallback timeout nếu transitionend không bắn (Safari lỗi)
      clearTimeout(fallback);
    };

    // khi card xong mới ẩn backdrop — tránh “mất click” lớp vô hình
    card.addEventListener('transitionend', onDone);
    const fallback = setTimeout(onDone, 260); // phòng khi Safari không fire event
  }

  function clearChat(){
    try{ localStorage.removeItem(K.sess);}catch(e){}
    $('#mta-body').innerHTML=''; addMsg('bot', polite('đã xóa hội thoại'));
  }

  // ===== Tag bar events
  function bindTags(){
    const track = $('#tagTrack'); if(!track) return;
    track.querySelectorAll('button').forEach(b=>{
      b.addEventListener('click', ()=> sendUser(b.dataset.q));
    });
    
    // Hàm updateFade gốc đã được chuyển ra ngoài
    
    // Gọi hàm update mới
    track.addEventListener('scroll', updateTagFades, {passive:true});
    
    // === TỐI ƯU THÊM 3/3: Tag Fades ===
    setTimeout(updateTagFades, 50); // Giữ lại cho lần tải đầu
    // Thêm listener cho resize (quan trọng khi xoay màn hình)
    window.addEventListener('resize', updateTagFades, {passive:true});
  }

  // ===== Send + typing delay (2.5–5s)
  async function sendUser(text){
    if(sending) return; sending=true;
    addMsg('user', text);
    showTyping(); const typingDelay = 2500 + Math.random()*2500; await sleep(typingDelay);
    let ans; try{ ans = compose(text); }catch(e){ ans = null; }
    hideTyping(); addMsg('bot', ans || polite(`xin lỗi, có lỗi khi trả lời. Anh/chị liên hệ Zalo ${CFG.phone} giúp em nhé.`));
    sending=false;
  }

  // ===== Auto-avoid obstacles (footer/quick-call/keyboard)
  function checkObstacles(){
    const root=$('#mta-root'); if(!root) return;
    const blockers = document.querySelector('.bottom-appbar, .quick-call, #quick-call');
    let bottom='calc(18px + env(safe-area-inset-bottom, 0))';
    if(blockers){
      const r=blockers.getBoundingClientRect(); const space = window.innerHeight - r.top;
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

  // ===== Boot
  ready(()=>{
    const hour=new Date().getHours(); if(hour>19||hour<6) document.body.classList.add('ai-night');
    injectUI();
    bindTags(); // <-- bindTags bây giờ đã được tối ưu

    // Bind
    $('#mta-bubble').addEventListener('click', openChat, {passive:true});
    $('#mta-backdrop').addEventListener('click', closeChat, {passive:true});
    $('#mta-close').addEventListener('click', closeChat, {passive:true});
    $('#mta-clear').addEventListener('click', clearChat, {passive:true});
    $('#mta-send').addEventListener('click', ()=>{ const v=($('#mta-in').value||'').trim(); if(!v) return; $('#mta-in').value=''; sendUser(v); });
    $('#mta-in').addEventListener('keydown',(e)=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); const v=($('#mta-in').value||'').trim(); if(!v) return; $('#mta-in').value=''; sendUser(v); }});

    // Auto-avoid & iOS
    checkObstacles();
    window.addEventListener('resize', checkObstacles, {passive:true});
    window.addEventListener('scroll', checkObstacles, {passive:true});
    if(window.visualViewport) window.visualViewport.addEventListener('resize', checkObstacles, {passive:true});
    fixSafariKeyboard();

    // Watchdog (nếu vì lý do gì đó bubble biến mất, chèn lại UI)
    setTimeout(()=>{ if(!$('#mta-bubble')) injectUI(); }, 2500);

    console.log('%cMotoAI v23c Messenger UltraReal — Active (UX Fix v2)','color:#0084FF;font-weight:bold;');
  });

  // ===== Expose (mini API)
  window.MotoAI_v23c_messenger = {
    open: ()=>{ try{openChat()}catch(e){} },
    close: ()=>{ try{closeChat()}catch(e){} }
  };
})();
