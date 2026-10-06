/*
 * MotoAI v18xq_map_v2 — Responsive Quick + Map (UI98 Stable)
 * - Bubble trái dưới (chat-bubble + “⚡” giả lập Messenger)
 * - Card trượt lên nhẹ, overlay mờ ~20% khu vực đáy
 * - Quickbar trắng bóng: Zalo / WhatsApp / Phone / Map (đổi bằng data-* trên <script>)
 * - Tự tránh trùng layer (z-index rất cao), responsive chuẩn mobile/tablet/laptop
 * - Trả lời: nếu có MotoAI_v18p/v17 composeAnswer thì dùng, không có thì fallback rule lịch sự (bạn/mình)
 */
(function(){
  "use strict";
  if (window.MotoAI_v18xq) return;
  window.MotoAI_v18xq = {version:"v18xq_map_v2"};

  // ===== Config từ data-* =====
  var TAG = document.currentScript || (function(){
    var s=document.querySelectorAll('script'); return s[s.length-1];
  })();
  var CFG = {
    phone   : (TAG && TAG.dataset.phone)    || "0857255868",
    zalo    : (TAG && TAG.dataset.zalo)     || "https://zalo.me/0857255868",
    whatsapp: (TAG && TAG.dataset.whatsapp) || "https://wa.me/84857255868",
    map     : (TAG && TAG.dataset.map)      || "https://maps.app.goo.gl/wnKn2LH4JohhRHHX7"
  };

  // ===== UI HTML =====
  var uiHtml =
  '<div id="motoai-root" aria-live="polite">' +
    '<div id="motoai-bubble" role="button" aria-label="Mở chat">' +
      // Bubble + pseudo lightning
      '<svg viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#009dff"/><stop offset="1" stop-color="#0063ff"/></linearGradient></defs><path d="M52 10H12c-5.5 0-10 4.5-10 10v14c0 5.5 4.5 10 10 10h10v9c0 1.4 1.6 2.2 2.7 1.3L37 44h15c5.5 0 10-4.5 10-10V20c0-5.5-4.5-10-10-10Z" fill="url(#g)"/><path d="M36 16l-5 10h7l-8 12 5-10h-7l8-12Z" fill="#fff"/></svg>' +
    '</div>' +
    '<div id="motoai-backdrop" aria-hidden="true"></div>' +
    '<div id="motoai-card" aria-hidden="true">' +
      '<div id="motoai-header">' +
        '<div class="brand">@ AI Assistant — <span class="ph">&#128222;</span> <span class="num"></span></div>' +
        '<button id="motoai-close" title="Đóng" aria-label="Đóng">✕</button>' +
      '</div>' +
      '<div id="motoai-qbar" aria-label="Liên lạc nhanh">' +
        '<a class="qbtn qzalo"     target="_blank" rel="nofollow noopener" aria-label="Zalo"></a>' +
        '<a class="qbtn qwhatsapp" target="_blank" rel="nofollow noopener" aria-label="WhatsApp"></a>' +
        '<a class="qbtn qphone"    aria-label="Gọi điện"></a>' +
        '<a class="qbtn qmap"      target="_blank" rel="nofollow noopener" aria-label="Bản đồ"></a>' +
      '</div>' +
      '<div id="motoai-body" tabindex="0" role="log"></div>' +
      '<div id="motoai-suggestions"></div>' +
      '<div id="motoai-input">' +
        '<input id="motoai-input-el" placeholder="Nhập câu hỏi..." autocomplete="off"/>' +
        '<button id="motoai-send" aria-label="Gửi">Gửi</button>' +
      '</div>' +
      '<button id="motoai-clear" title="Xóa hội thoại" aria-label="Xóa hội thoại">🗑</button>' +
    '</div>' +
  '</div>';

  // ===== CSS — nhẹ, responsive, overlay 20% vùng đáy =====
  var css =
  ':root{--ai-acc:#007aff;--ai-dim:rgba(0,0,0,.2)}' +
  '#motoai-root{position:fixed;left:16px;bottom:100px;z-index:2147483647;font-family:-apple-system,system-ui,Segoe UI,Roboto,Arial}' +
  '#motoai-bubble{width:56px;height:56px;border-radius:16px;display:flex;align-items:center;justify-content:center;background:#fff;box-shadow:0 8px 22px rgba(0,0,0,.25);cursor:pointer;transition:transform .18s ease-out}' +
  '#motoai-bubble:hover{transform:translateY(-2px)}' +
  '#motoai-bubble svg{width:36px;height:36px;display:block}' +
  '#motoai-backdrop{position:fixed;inset:0;pointer-events:none;opacity:0;transition:opacity .18s ease;}' +
  '#motoai-backdrop.show{opacity:1;pointer-events:auto;background:linear-gradient(to top, var(--ai-dim), transparent 60%)}' +
  '#motoai-card{position:fixed;left:0;right:0;bottom:0;margin:auto;width:min(880px, calc(100% - 28px));height:64vh;max-height:680px;border-radius:20px 20px 0 0;background:rgba(255,255,255,.9);backdrop-filter:blur(12px) saturate(160%);box-shadow:0 -10px 34px rgba(0,0,0,.16);transform:translateY(110%);opacity:0;display:flex;flex-direction:column;overflow:hidden;transition:transform .22s cubic-bezier(.2,.9,.2,1),opacity .18s}' +
  '#motoai-card.open{transform:translateY(0);opacity:1}' +
  '#motoai-header{display:flex;align-items:center;justify-content:space-between;padding:8px 12px;border-bottom:1px solid rgba(0,0,0,.06);font-weight:700;color:var(--ai-acc)}' +
  '#motoai-header .brand .ph{margin-right:4px}' +
  '#motoai-header button{background:none;border:none;font-size:20px;cursor:pointer;color:var(--ai-acc)}' +
  '#motoai-qbar{display:flex;gap:10px;justify-content:center;padding:8px 10px;background:transparent}' +
  '.qbtn{width:38px;height:38px;border-radius:12px;background:linear-gradient(180deg,#fff,#f0f1f6);box-shadow:inset 0 1px 0 rgba(255,255,255,.7),0 1px 2px rgba(0,0,0,.08);display:flex;align-items:center;justify-content:center;border:1px solid rgba(0,0,0,.06);cursor:pointer}' +
  '.qbtn:active{transform:translateY(1px)}' +
  '.qbtn::before{content:"";display:block;width:18px;height:18px;mask-size:contain;mask-repeat:no-repeat;background:#1e1e1e}' +
  '.qzalo::before{mask-image:url("data:image/svg+xml;utf8,<svg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27><path d=%27M4 3h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H9l-5 4v-4H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z%27 fill=%27%23000%27/></svg>")}' +
  '.qwhatsapp::before{mask-image:url("data:image/svg+xml;utf8,<svg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27><path d=%27M12 2a9 9 0 0 0-7.8 13.5L3 22l6.7-1.8A9 9 0 1 0 12 2zm4.7 13.2c-.2.6-1.2 1.1-1.7 1.2-.4.1-.9.1-1.5 0-2.7-.6-4.8-2.8-5.5-5.5-.1-.6-.1-1.1 0-1.5.1-.5.6-1.5 1.2-1.7.3-.1.7 0 .9.2l1.2 1.7c.1.2.1.5 0 .7l-.5.9c.5 1.1 1.4 2 2.5 2.5l.9-.5c.2-.1.5-.1.7 0l1.7 1.2c.3.2.3.6.2.9z%27 fill=%27%23000%27/></svg>")}' +
  '.qphone::before{mask-image:url("data:image/svg+xml;utf8,<svg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27><path d=%27M6.6 10.8c1.7 3.3 3.9 5.5 7.2 7.2l2.4-2.4c.3-.3.8-.4 1.2-.3 1 .3 2.1.5 3.2.5.7 0 1.2.5 1.2 1.2V22c0 .7-.5 1.2-1.2 1.2C9.7 23.2.8 14.3.8 3.2.8 2.5 1.3 2 2 2h4.8c.7 0 1.2.5 1.2 1.2 0 1.1.2 2.2.5 3.2.1.4 0 .9-.3 1.2l-1.6 1.6z%27 fill=%27%23000%27/></svg>")}' +
  '.qmap::before{mask-image:url("data:image/svg+xml;utf8,<svg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27><path d=%27M12 2C7.6 2 4 5.6 4 10c0 5.3 8 12 8 12s8-6.7 8-12c0-4.4-3.6-8-8-8zm0 10.5c-1.4 0-2.5-1.1-2.5-2.5S10.6 7.5 12 7.5s2.5 1.1 2.5 2.5S13.4 12.5 12 12.5z%27 fill=%27%23000%27/></svg>")}' +
  '#motoai-body{flex:1;overflow:auto;padding:10px 14px;font-size:15px;background:transparent}' +
  '.m-msg{margin:8px 0;padding:12px 14px;border-radius:18px;max-width:84%;line-height:1.45;word-break:break-word;box-shadow:0 3px 8px rgba(0,0,0,.08)}' +
  '.m-msg.user{background:linear-gradient(180deg,var(--ai-acc),#00b6ff);color:#fff;margin-left:auto}' +
  '.m-msg.bot{background:rgba(255,255,255,.86);color:#0b1220}' +
  '#motoai-suggestions{display:flex;gap:6px;justify-content:center;flex-wrap:wrap;padding:6px 10px;border-top:1px solid rgba(0,0,0,.05);background:rgba(255,255,255,.6)}' +
  '#motoai-suggestions button{border:none;background:rgba(0,122,255,.08);color:var(--ai-acc);padding:8px 12px;border-radius:12px;cursor:pointer;font-weight:500}' +
  '#motoai-input{display:flex;gap:8px;padding:10px;border-top:1px solid rgba(0,0,0,.06);background:rgba(255,255,255,.72)}' +
  '#motoai-input input{flex:1;padding:10px;border-radius:12px;border:1px solid rgba(0,0,0,.1);font-size:15px;background:rgba(255,255,255,.7)}' +
  '#motoai-input button{background:var(--ai-acc);color:#fff;border:none;border-radius:10px;padding:10px 14px;cursor:pointer;font-weight:600}' +
  '#motoai-clear{position:absolute;top:10px;right:44px;background:none;border:none;font-size:18px;cursor:pointer;opacity:.85;color:#333}' +
  '@media (prefers-color-scheme:dark){#motoai-card{background:rgba(20,20,22,.94);color:#eee}.m-msg.bot{background:rgba(30,30,32,.9);color:#eee}#motoai-input{background:rgba(25,25,30,.9)}#motoai-suggestions{background:rgba(25,25,30,.85)}#motoai-input input{background:rgba(40,40,50,.86);color:#eee;border:1px solid rgba(255,255,255,.1)}.qbtn::before{background:#eee}#motoai-clear{color:#eee}}' +
  '@media (max-width:1024px){#motoai-card{height:66vh}}' +
  '@media (max-width:520px){#motoai-root{bottom:18px}#motoai-card{width:calc(100% - 24px);height:64vh}}';

  // ===== Inject UI =====
  function inject(){
    if (document.getElementById('motoai-root')) return;
    var wrap = document.createElement('div');
    wrap.innerHTML = uiHtml;
    document.body.appendChild(wrap.firstElementChild);
    var st = document.createElement('style');
    st.textContent = css;
    document.head.appendChild(st);
  }
  inject();

  // ===== Refs =====
  var root = document.getElementById('motoai-root');
  var bubble = document.getElementById('motoai-bubble');
  var backdrop = document.getElementById('motoai-backdrop');
  var card = document.getElementById('motoai-card');
  var headerNum = card.querySelector('.num');
  var closeBtn = document.getElementById('motoai-close');
  var bodyEl = document.getElementById('motoai-body');
  var suggWrap = document.getElementById('motoai-suggestions');
  var inputEl = document.getElementById('motoai-input-el');
  var sendBtn = document.getElementById('motoai-send');
  var clearBtn = document.getElementById('motoai-clear');
  var qbZ = card.querySelector('.qzalo');
  var qbW = card.querySelector('.qwhatsapp');
  var qbP = card.querySelector('.qphone');
  var qbM = card.querySelector('.qmap');

  headerNum.textContent = CFG.phone.replace(/^(\+?84)?0?/, '0');
  qbZ.href = CFG.zalo;
  qbW.href = CFG.whatsapp;
  qbM.href = CFG.map;
  qbP.addEventListener('click', function(){ location.href = 'tel:+84' + CFG.phone.replace(/^0/,''); });

  // ===== Session & helpers =====
  function addMsg(role, text){
    var el = document.createElement('div');
    el.className = 'm-msg ' + (role==='user'?'user':'bot');
    el.textContent = text;
    bodyEl.appendChild(el);
    bodyEl.scrollTop = bodyEl.scrollHeight;
  }
  function showTyping(){
    var d=document.createElement('div'); d.id='motoai-typing'; d.className='m-msg bot'; d.textContent='...';
    bodyEl.appendChild(d); bodyEl.scrollTop=bodyEl.scrollHeight;
  }
  function hideTyping(){ var d=document.getElementById('motoai-typing'); if(d) d.remove(); }

  // ===== Open/Close (slide-up nhẹ) =====
  var isOpen=false;
  function openChat(){
    if(isOpen) return;
    card.classList.add('open'); backdrop.classList.add('show'); bubble.style.display='none';
    isOpen=true;
    if(!bodyEl.querySelector('.m-msg')) addMsg('bot','Chào bạn, mình là AI Assistant. Bạn muốn xem Bảng giá, Dịch vụ, Sản phẩm hay Liên hệ?');
    setTimeout(function(){ try{ inputEl.focus(); }catch(e){} }, 220);
  }
  function closeChat(){
    if(!isOpen) return;
    card.classList.remove('open'); backdrop.classList.remove('show'); bubble.style.display='flex';
    isOpen=false; hideTyping();
  }

  // ===== Suggestions =====
  var sugg = [
    {q:'Bảng giá', label:'💰 Bảng giá'},
    {q:'Dịch vụ', label:'⚙️ Dịch vụ'},
    {q:'Sản phẩm', label:'🏍️ Sản phẩm'},
    {q:'Liên hệ', label:'☎️ Liên hệ'}
  ];
  function buildSugg(){
    suggWrap.innerHTML='';
    sugg.forEach(function(s){
      var b=document.createElement('button'); b.type='button'; b.textContent=s.label;
      b.addEventListener('click', function(){ if(!isOpen) openChat(); setTimeout(function(){ userSend(s.q); }, 60); });
      suggWrap.appendChild(b);
    });
  }
  buildSugg();

  // ===== Answer pipeline (ưu tiên AI đã có) =====
  function ruleAnswer(q){
    var t=q.toLowerCase();
    if(/(chào|xin chào|hello|hi|alo)/.test(t)) return "Mình sẵn sàng hỗ trợ. Bạn cần xem Bảng giá, Dịch vụ, Sản phẩm hay Liên hệ?";
    if(/(bảng giá|giá|bao nhiêu|bang gia)/.test(t)) return "Đây là mục Bảng giá. Bạn cho mình biết sản phẩm/dịch vụ cụ thể để báo chi tiết nhé.";
    if(/(dịch vụ|dich vu|service)/.test(t)) return "Bọn mình có nhiều gói dịch vụ. Bạn mô tả nhu cầu để mình gợi ý gói phù hợp.";
    if(/(sản phẩm|san pham|xe ga|xe số|xe so|50cc|vision|lead|air blade|vespa|winner|exciter)/.test(t)) return "Bạn cho mình biết nhu cầu sử dụng (đi phố, đi xa, tiết kiệm xăng…) để mình tư vấn phù hợp.";
    if(/(liên hệ|lien he|zalo|hotline|sđt|sdt|gọi|dien thoai|call|phone)/.test(t)) return "Bạn liên hệ nhanh qua ☎️ " + headerNum.textContent + " (Zalo/Hotline) nhé.";
    return null;
  }
  function composeAnswer(q){
    try{
      if (window.MotoAI_v18p && typeof window.MotoAI_v18p.composeAnswer==='function') {
        return window.MotoAI_v18p.composeAnswer(q);
      }
      if (window.MotoAI_v17 && typeof window.MotoAI_v17.composeAnswer==='function') {
        return window.MotoAI_v17.composeAnswer(q);
      }
    }catch(e){}
    return ruleAnswer(q) || "Mình đang lắng nghe, bạn mô tả cụ thể hơn nhé.";
  }

  // ===== Send flow =====
  var sending=false;
  function userSend(text){
    if(sending) return;
    text = (text||'').trim(); if(!text) return;
    sending=true; addMsg('user', text); showTyping();
    setTimeout(function(){
      var ans = composeAnswer(text);
      hideTyping(); addMsg('bot', ans);
      sending=false;
    }, 220 + Math.min(500, text.length*6));
  }

  // ===== Events =====
  bubble.addEventListener('click', openChat);
  backdrop.addEventListener('click', closeChat);
  closeBtn.addEventListener('click', closeChat);
  clearBtn.addEventListener('click', function(){ bodyEl.innerHTML=''; addMsg('bot','Đã xóa hội thoại.'); });
  sendBtn.addEventListener('click', function(){ var v=inputEl.value.trim(); if(!v) return; inputEl.value=''; userSend(v); });
  inputEl.addEventListener('keydown', function(e){ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); var v=inputEl.value.trim(); if(!v) return; inputEl.value=''; userSend(v);} });

  // ===== iOS keyboard tweak (giữ card ổn định) =====
  inputEl.addEventListener('focus', function(){ card.style.height='60vh'; });
  inputEl.addEventListener('blur', function(){ card.style.height='64vh'; });

  // ===== Watchdog =====
  setTimeout(function(){
    if(!document.getElementById('motoai-bubble')){
      console.warn('MotoAI: bubble missing, reinject UI'); inject();
    }
  }, 1600);
})();
