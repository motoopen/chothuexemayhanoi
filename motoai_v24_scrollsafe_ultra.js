/* motoai_v24_scrollsafe_ultra.js
   UI: Messenger-style (giữ từ v22c) + Tag trượt + Ẩn khi gõ
   Engine: SmartCalc nâng cấp (hiểu "2 xe 3 ngày", nhiều loại cùng lúc, "xe giá rẻ")
   UX: Delay 2.5–5s, session, auto-avoid footer/quick-call/keyboard, dark/light, iOS/Safari safe
*/
(function(){
  if (window.MotoAI_v24_SCROLLSAFE_ULTRA_LOADED) return;
  window.MotoAI_v24_SCROLLSAFE_ULTRA_LOADED = true;

  // ===== Config =====
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

  // ===== Utils =====
  const $  = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const safe = s => { try{return JSON.parse(s)}catch(e){return null} };
  const sleep = ms => new Promise(r=>setTimeout(r,ms));
  const nfVND = n => (n||0).toLocaleString('vi-VN');
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

  // ===== UI =====
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

      <!-- Tag trượt -->
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
  /* Tag trượt */
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

  // ===== Inject =====
  function injectUI(){
    if ($('#mta-root')) return;
    const wrap = document.createElement('div'); wrap.innerHTML = ui; document.body.appendChild(wrap.firstElementChild);
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  }
  function ready(fn){
    if(document.readyState==="complete"||document.readyState==="interactive"){ fn(); }
    else document.addEventListener("DOMContentLoaded", fn);
  }

  // ===== State + Session =====
  let isOpen=false, sending=false;
  const K = {sess:'MotoAI_v24_session'};
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

  // ===== Typing =====
  function showTyping(){
    const d=document.createElement('div'); d.id='mta-typing'; d.className='m-msg bot'; d.textContent='Đang nhập ';
    const dot=document.createElement('span'); dot.id='mta-typing-dots'; dot.textContent='…';
    d.appendChild(dot); $('#mta-body').appendChild(d); $('#mta-body').scrollTop=$('#mta-body').scrollHeight;
    let i=0; d._timer=setInterval(()=>{ dot.textContent='.'.repeat((i++%3)+1); }, 400);
  }
  function hideTyping(){ const d=$('#mta-typing'); if(d){ clearInterval(d._timer); d.remove(); } }

  // ===== NLU & SmartCalc =====
  const PRICE_TABLE = {
    'xe số':      { day:[130000,150000], week:[600000], month:[1000000,1200000] },
    'air blade':  { day:[200000], week:[800000], month:[1400000] },
    'vision':     { day:[200000], week:[900000], month:[2000000] },
    'xe điện':    { day:[200000], week:[800000], month:[1500000] },
    '50cc':       { day:[200000], week:[800000], month:[1800000] },
    'xe côn tay': { day:[350000], week:[1200000], month:[2500000] },
    'xe giá rẻ':  { day:[100000], week:[500000], month:[900000] }
  };
  const TYPE_PATTERNS = [
    {key:'xe giá rẻ', re:/(giá rẻ|bình dân|rẻ nhất|sinh viên|xe rẻ)/i},
    {key:'air blade', re:/\bair\s*blade|airblade|\bab\b/i},
    {key:'vision',    re:/\bvision\b/i},
    {key:'xe côn tay',re:/(côn tay|tay côn)/i},
    {key:'xe điện',   re:/(xe điện|vinfast|yadea|dibao|gogo)/i},
    {key:'50cc',      re:/(50cc|xe 50)\b/i},
    {key:'xe số',     re:/(xe số|wave|blade|sirius|jupiter)/i},
    {key:'vision',    re:/xe ga/i} // fallback ga -> vision
  ];
  const UNIT_RE = /(ngày|day|tuần|tuan|week|tháng|thang|month)/i;

  function pickTypes(text){
    const t = text.toLowerCase();
    const found = [];
    for(const p of TYPE_PATTERNS){ if(p.re.test(t) && !found.includes(p.key)) found.push(p.key); }
    if(!found.length) found.push('xe số');
    return found.slice(0,3); // tránh quá dài
  }
  function pickQty(text){
    // bắt các mẫu: "2 xe 3 ngày", "3 ngày 2 xe", "thuê 2 vision 1 tuần", "2 tuần"
    const t = text.toLowerCase();
    let qty = 1, n=1, unit='day';
    // số xe
    const mQty = t.match(/(\d+)\s*(xe|chiếc)/i);
    if(mQty) qty = clamp(parseInt(mQty[1],10)||1, 1, 20);
    // thời lượng + đơn vị (lấy cái đầu tiên hợp lệ)
    const mDur = t.match(/(\d+)\s*(ngày|day|tuần|tuan|week|tháng|thang|month)/i);
    if(mDur){ n = clamp(parseInt(mDur[1],10)||1, 1, 90); unit = toUnit(mDur[2]); }
    else { // nếu chỉ có đơn vị
      const mU = t.match(UNIT_RE); if(mU){ unit = toUnit(mU[1]); }
    }
    return {qty, n, unit};
  }
  function toUnit(u){
    const s = (u||'').toLowerCase();
    if(/tuần|tuan|week/.test(s)) return 'week';
    if(/tháng|thang|month/.test(s)) return 'month';
    return 'day';
  }
  function summarizeType(type){
    const it = PRICE_TABLE[type]; if(!it) return '';
    const r = (arr)=>!arr?null:arr.length===1? nfVND(arr[0])+'đ' : nfVND(arr[0])+'–'+nfVND(arr[1])+'đ';
    const d=r(it.day), w=r(it.week), m=r(it.month);
    return [d&&d+'/ngày', w&&w+'/tuần', m&&m+'/tháng'].filter(Boolean).join(', ');
  }
  function baseFor(type, unit){
    const it = PRICE_TABLE[type]; if(!it||!it[unit]) return null;
    return it[unit][0]; // lấy giá thấp nhất để ước tính an toàn
    // (vẫn nhắc liên hệ Zalo để chốt giá chính xác)
  }
  function estimate(text){
    const types = pickTypes(text);
    const {qty, n, unit} = pickQty(text);
    // nếu không có thời lượng -> tóm tắt bảng giá
    if(!n || !unit){
      const lines = types.map(tp => `• ${tp}: ${summarizeType(tp)}`).join('\n');
      return `Bảng giá tham khảo:\n${lines}\nAnh/chị liên hệ Zalo ${CFG.phone} để xem xe và nhận giá chính xác ạ.`;
    }
    const parts = [];
    let sum = 0;
    for(const tp of types){
      const base = baseFor(tp, unit);
      if(!base){ parts.push(`• ${tp}: chưa có giá ${unit}`); continue; }
      const subtotal = base * n * qty;
      sum += base * n; // gộp theo từng loại (giả định cùng số lượng), đủ để ước tính
      const labelUnit = unit==='day'?'ngày':unit==='week'?'tuần':'tháng';
      parts.push(`• ${tp}: ~${nfVND(base*n)}đ/${qty} xe · ${n} ${labelUnit}`);
    }
    const totalText = parts.length>1 ? `Tổng ước tính ~${nfVND(sum)}đ/${qty} xe` : '';
    return `${parts.join('\n')}\n${totalText}\nAnh/chị có thể liên hệ Zalo ${CFG.phone} để xem xe và nhận giá chính xác nhất ạ.`;
  }

  // ===== Rules & Compose =====
  const PREFIX = ["Chào anh/chị,","Xin chào 👋,","Em chào anh/chị nhé,","Rất vui được hỗ trợ anh/chị,"];
  const SUFFIX = [" ạ."," nhé ạ."," nha anh/chị."," ạ, cảm ơn anh/chị."];
  const CHEAP = /(rẻ|giá rẻ|rẻ nhất|bình dân|sinh viên|hssv|xe rẻ)/i;
  function polite(t){ t=(t||"").trim(); return `${PREFIX[Math.floor(Math.random()*PREFIX.length)]} ${t.replace(/[ ]+$/,'')}${SUFFIX[Math.floor(Math.random()*SUFFIX.length)]}`; }
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
    {re:/bảng giá|bang gia|price list/i, ans:[
      "em có thể báo giá nhanh theo loại xe/ngày/tuần/tháng. Anh/chị chọn loại xe giúp em ạ.",
      "anh/chị xem nhanh tag 💰 Bảng giá ở dưới khung chat nhé."
    ]}
  ];
  function rule(q){ for(const r of RULES){ if(r.re.test(q)) return polite(r.ans[Math.floor(Math.random()*r.ans.length)]); } return null; }
  function isPriceIntent(t){ return /(giá|bao nhiêu|tính tiền|bao nhieu|cost|price|thuê|thue)/i.test(t) || CHEAP.test(t); }

  function compose(q){
    const m=(q||'').trim(); if(!m) return polite("anh/chị thử bấm tag: 🏍️ Xe số, 🛵 Xe ga, ⚡ Xe điện hoặc 📄 Thủ tục nhé");
    const r1=rule(m); if(r1) return r1;
    if(isPriceIntent(m)) return polite(estimate(m));
    return polite("em chưa tìm được thông tin trùng khớp. Anh/chị nói rõ loại xe hoặc thời gian thuê giúp em với ạ.");
  }

  // ===== Open/Close/Clear =====
  function openChat(){ if(isOpen) return;
    $('#mta-card').classList.add('open'); $('#mta-backdrop').classList.add('show'); $('#mta-bubble').style.display='none';
    isOpen=true; renderSess(); setTimeout(()=>{ try{$('#mta-in').focus()}catch(e){} },120);
  }
  function closeChat(){ if(!isOpen) return;
    try{$('#mta-in').blur();}catch(e){}
    $('#mta-card').classList.remove('open'); $('#mta-backdrop').classList.remove('show'); $('#mta-bubble').style.display='flex'; isOpen=false; hideTyping();
  }
  function clearChat(){ try{ localStorage.removeItem(K.sess);}catch(e){}; $('#mta-body').innerHTML=''; addMsg('bot', polite('đã xóa hội thoại')); }

  // ===== Tag events + Ẩn/hiện khi gõ =====
  function bindTags(){
    const track = $('#tagTrack'), box = $('#mta-tags'); if(!track||!box) return;
    track.querySelectorAll('button').forEach(b=>{
      b.addEventListener('click', ()=> sendUser(b.dataset.q));
    });
    const updateFade=()=>{
      const left = track.scrollLeft > 2;
      const right = (track.scrollWidth - track.clientWidth - track.scrollLeft) > 2;
      const fl = box.querySelector('.fade-left'), fr = box.querySelector('.fade-right');
      if(fl) fl.style.opacity = left ? '1' : '0';
      if(fr) fr.style.opacity = right ? '1' : '0';
    };
    track.addEventListener('scroll', updateFade, {passive:true});
    setTimeout(updateFade, 80);

    const input = $('#mta-in');
    if(input){
      input.addEventListener('focus', ()=> box.classList.add('hidden'));
      input.addEventListener('blur',  ()=> { if(!input.value.trim()) box.classList.remove('hidden'); });
      input.addEventListener('input', ()=> { if(input.value.trim()) box.classList.add('hidden'); else box.classList.remove('hidden'); });
    }
  }

  // ===== Send (delay 2.5–5s) =====
  async function sendUser(text){
    if(sending) return; sending=true;
    addMsg('user', text);
    showTyping(); const typingDelay = 2500 + Math.random()*2500; await sleep(typingDelay);
    let ans; try{ ans = compose(text); }catch(e){ ans = null; }
    hideTyping(); addMsg('bot', ans || polite(`xin lỗi, có lỗi khi trả lời. Anh/chị liên hệ Zalo ${CFG.phone} giúp em nhé.`));
    sending=false;
  }

  // ===== Auto-avoid (footer/quick-call/keyboard) =====
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

  // ===== Boot =====
  function bindCore(){
    $('#mta-bubble').addEventListener('click', openChat);
    $('#mta-backdrop').addEventListener('click', closeChat);
    $('#mta-close').addEventListener('click', closeChat);
    $('#mta-clear').addEventListener('click', clearChat);
    $('#mta-send').addEventListener('click', ()=>{ const v=($('#mta-in').value||'').trim(); if(!v) return; $('#mta-in').value=''; sendUser(v); });
    $('#mta-in').addEventListener('keydown',(e)=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); const v=($('#mta-in').value||'').trim(); if(!v) return; $('#mta-in').value=''; sendUser(v); }});
  }

  ready(()=>{
    const hour=new Date().getHours(); if(hour>19||hour<6) document.body.classList.add('ai-night');
    injectUI(); bindCore(); bindTags();
    checkObstacles();
    window.addEventListener('resize', checkObstacles, {passive:true});
    window.addEventListener('scroll', checkObstacles, {passive:true});
    if(window.visualViewport) window.visualViewport.addEventListener('resize', checkObstacles, {passive:true});
    setTimeout(()=>{ if(!$('#mta-bubble')) injectUI(); }, 2500);
    console.log('%cMotoAI v24 ScrollSafe Ultra — Active','color:#0084FF;font-weight:bold;');
  });

  // ===== Expose =====
  window.MotoAI_v24 = { open: ()=>{try{openChat()}catch(e){}}, close: ()=>{try{closeChat()}catch(e){}} };
})();
