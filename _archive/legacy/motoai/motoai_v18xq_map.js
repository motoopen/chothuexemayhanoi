/* motoai_v18xq_map.js
 * UI98 Responsive + Messenger bubble + QuickConnect (Zalo/WA/Call/Map) + polite reply
 * Đã loại bỏ hoàn toàn hiệu ứng trượt/transition (No Slide)
 */
(function(){
  if (window.MotoAI_v18xq) return;
  const HOSTKEY=(location.host||'site').replace(/[^a-z0-9.-]/gi,'_');

  const CFG={
    minSentenceLen:24, maxItems:1000,
    corpusKey:`MotoAI_v18xq_${HOSTKEY}_corpus`,
    sessionKey:`MotoAI_v18xq_${HOSTKEY}_session`,
    // QuickConnect links
    phone:"0857255868",
    zalo:"https://zalo.me/0857255868",
    whatsapp:"https://wa.me/0857255868",
    map:"https://maps.app.goo.gl/wnKn2LH4JohhRHHX7"
  };

  const $=s=>document.querySelector(s);
  const $$=s=>Array.from(document.querySelectorAll(s));
  const uniq=a=>Array.from(new Set(a));
  const safeParse=s=>{try{return JSON.parse(s)}catch(e){return null}};
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const tok=t=>(t||'').toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu,' ').split(/\s+/).filter(Boolean);

  // ===== UI (Messenger-like bubble) & HTML Structure =====
  const MESSENGER_SVG = `
    <svg viewBox="0 0 36 36" width="26" height="26" aria-hidden="true">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#00C6FF"/><stop offset="100%" stop-color="#0078FF"/>
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="36" height="36" rx="10" fill="url(#g)"/>
      <path d="M18 8c-5.6 0-10 3.8-10 8.6 0 2.6 1.4 5 3.7 6.6v3.8l3.4-1.9c.9.2 1.8.3 2.8.3 5.6 0 10-3.8 10-8.6S23.6 8 18 8zm4.9 6.9l-3.1 3.3-2.4-2.2-4.3 3.9 3.1-3.3 2.4 2.2 4.3-3.9z" fill="#fff"/>
    </svg>`;

  const uiHtml=`
  <div id="motoai-root" aria-live="polite">
    <button id="motoai-bubble" aria-label="Mở chat" title="Chat">
      ${MESSENGER_SVG}
    </button>
    <div id="motoai-card" aria-hidden="true" role="dialog" aria-label="AI Assistant">
      <div id="motoai-header">
        <div class="brand">@ By MotoAI</div>
        <div class="quick">
          <a class="q-btn q-zalo"   href="${CFG.zalo}"      target="_blank" rel="noopener" aria-label="Zalo"></a>
          <a class="q-btn q-wa"     href="${CFG.whatsapp}"  target="_blank" rel="noopener" aria-label="WhatsApp"></a>
          <a class="q-btn q-call"   href="tel:${CFG.phone}"                       aria-label="Gọi điện"></a>
          <a class="q-btn q-map"    href="${CFG.map}"       target="_blank" rel="noopener" aria-label="Bản đồ"></a>
        </div>
        <button id="motoai-close" aria-label="Đóng">✕</button>
      </div>
      <div id="motoai-body"></div>
      <div id="motoai-suggest"></div>
      <div id="motoai-input">
        <input id="motoai-input-el" placeholder="Nhập câu hỏi..." autocomplete="off"/>
        <button id="motoai-send">Gửi</button>
      </div>
    </div>
  </div>`;

  // Tinh chỉnh CSS: Loại bỏ transitions và áp dụng Quickbar styles
  const uiCss=`
  :root{--m-blue:#007aff;--m-blue2:#00b6ff;--m-bg:#ffffff;--m-bg-dark:#1c1c20;--m-fg:#0b1220;--m-fg-dark:#eee}
  #motoai-root{position:fixed;left:16px;bottom:18px;z-index:99997;font-family:-apple-system,system-ui,Segoe UI,Roboto,"Helvetica Neue",Arial}

  /* Bubble: Loại bỏ transition transform */
  #motoai-bubble{width:56px;height:56px;border:0;border-radius:16px;display:flex;align-items:center;justify-content:center;background:transparent;box-shadow:0 8px 24px rgba(0,0,0,.25);cursor:pointer}
  #motoai-bubble:hover{transform:scale(1.04)}

  /* Card: Loại bỏ opacity, transform, và transition. Dùng display:none/flex để show/hide tức thì */
  #motoai-card{
    position:fixed;left:12px;bottom:88px;
    width:min(720px,calc(100vw - 24px));
    height:clamp(420px, 64vh, 640px); /* Dùng clamp để cố định chiều cao hợp lý */
    max-height:640px;
    background:rgba(255,255,255,.9);
    backdrop-filter:blur(12px) saturate(140%);
    color:var(--m-fg);border-radius:20px;
    box-shadow:0 18px 40px rgba(0,0,0,.2);
    display:none; /* Mặc định ẩn */
    flex-direction:column;
    overflow:hidden;
    z-index:99999;
  }
  #motoai-card.open{display:flex} /* Hiển thị tức thì */

  #motoai-header{display:flex;align-items:center;gap:10px;padding:8px 12px;border-bottom:1px solid rgba(0,0,0,.06)}
  #motoai-header .brand{font-weight:700;color:var(--m-blue)}
  #motoai-close{margin-left:auto;background:transparent;border:0;font-size:20px;cursor:pointer;color:var(--m-blue)}

  /* Quick Connect Bar - Tinh chỉnh style Quickbar */
  #motoai-header .quick{
    display:flex; gap:8px; align-items:center;
    padding:6px 10px; border-radius:14px;
    background:linear-gradient(180deg,rgba(255,255,255,.98),rgba(245,248,255,.98));
    border:1px solid rgba(13,45,80,.06);
    box-shadow:0 4px 16px rgba(14,30,64,.08), inset 0 1px 0 rgba(255,255,255,.7);
    backdrop-filter:saturate(140%) blur(6px);
  }
  .q-btn{
    width:36px; height:36px;
    border-radius:10px;display:flex; align-items:center; justify-content:center;
    background:#fff; box-shadow:inset 0 1px 0 rgba(255,255,255,.8);
    position:relative
  }
  .q-btn:after{content:"";position:absolute;inset:0;margin:auto;width:20px;height:20px}
  /* Icon styles */
  .q-zalo:after{background:url('data:image/svg+xml;utf8,<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="%23007aff" d="M19 3H5a2 2 0 0 0-2 2v10l4 4h12a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2Zm-8.1 10.4H7.6l3.7-5.8H7.2V6.9h5.5l-3.8 6.5Zm8.2-1.8c-.4 0-.7.3-.7.7s.3.7.7.7.7-.3.7-.7-.3-.7-.7-.7Zm-2.2 0c-.4 0-.7.3-.7.7s.3.7.7.7.7-.3.7-.7-.3-.7-.7-.7Zm-2.2 0c-.4 0-.7.3-.7.7s.3.7.7.7.7-.3.7-.7-.3-.7-.7-.7Z"/></svg>') center/contain no-repeat}
  .q-wa:after{background:url('data:image/svg+xml;utf8,<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="%2300a884" d="M12 2a9.9 9.9 0 0 0-8.48 15.1L2 22l4.99-1.46A10 10 0 1 0 12 2Zm5.48 14.53c-.23.64-1.36 1.23-1.88 1.28-.48.05-1.08.07-1.74-.11a9.4 9.4 0 0 1-3.92-2.23 11 11 0 0 1-2.61-3.3c-.27-.48-.62-1.34-.62-2.03 0-.97.51-1.45.69-1.65.18-.2.4-.25.53-.25h.38c.12 0 .29-.04.45.34.17.41.56 1.4.61 1.5.05.1.08.22 0 .35-.08.13-.12.21-.25.33-.12.12-.26.27-.37.36-.12.1-.24.21-.1.42.13.2.57.93 1.23 1.51.85.76 1.57 1 1.78 1.12.2.13.32.11.44-.07.12-.18.51-.59.64-.79.13-.2.27-.17.45-.1.18.06 1.17.55 1.37.65.2.1.33.15.38.23.06.08.06.64-.17 1.28Z"/></svg>') center/contain no-repeat}
  .q-call:after{background:url('data:image/svg+xml;utf8,<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="%23007aff" d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.8-.4 1.2-.2 1.3.5 2.8.8 4.4.8.7 0 1.2.5 1.2 1.2V21c0 .7-.5 1.2-1.2 1.2C10.7 22.2 1.8 13.3 1.8 2.4 1.8 1.7 2.3 1.2 3 1.2h2.9c.7 0 1.2.5 1.2 1.2 0 1.6.3 3.1.8 4.4.1.4 0 .8-.2 1.2l-2.1 2.8z"/></svg>') center/contain no-repeat}
  .q-map:after{background:url('data:image/svg+xml;utf8,<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="%23ff4d4f" d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5Z"/></svg>') center/contain no-repeat}

  #motoai-body{flex:1;overflow:auto;padding:10px 12px;font-size:15px}
  .m-msg{margin:8px 0;padding:12px 14px;border-radius:18px;max-width:84%;line-height:1.45;box-shadow:0 2px 8px rgba(0,0,0,.06)}
  .m-msg.user{background:linear-gradient(180deg,var(--m-blue),var(--m-blue2));color:#fff;margin-left:auto}
  .m-msg.bot{background:rgba(255,255,255,.9);color:#111}
  #motoai-suggest{display:flex;gap:6px;justify-content:center;flex-wrap:wrap;padding:6px;border-top:1px solid rgba(0,0,0,.05);background:rgba(255,255,255,.6)}
  #motoai-suggest button{border:0;background:rgba(0,122,255,.08);color:var(--m-blue);padding:8px 12px;border-radius:12px;cursor:pointer}
  #motoai-input{display:flex;gap:8px;padding:10px;border-top:1px solid rgba(0,0,0,.06);background:rgba(255,255,255,.75)}
  #motoai-input input{flex:1;padding:10px;border-radius:12px;border:1px solid rgba(0,0,0,.1)}
  #motoai-input button{background:var(--m-blue);color:#fff;border:0;border-radius:10px;padding:10px 14px;cursor:pointer}

  @media (prefers-color-scheme:dark){
    #motoai-card{background:rgba(20,20,22,.92);color:var(--m-fg-dark)}
    .m-msg.bot{background:rgba(30,30,32,.88);color:var(--m-fg-dark)}
    #motoai-suggest{background:rgba(25,25,30,.85)}
    #motoai-input{background:rgba(25,25,30,.9)}
    #motoai-input input{background:rgba(40,40,50,.86);color:var(--m-fg-dark);border:1px solid rgba(255,255,255,.12)}
    #motoai-header{background:rgba(30,30,32,.7);border-bottom-color:rgba(255,255,255,.08)}
    #motoai-header .quick{
      background:rgba(30,30,32,.7);
      border:1px solid rgba(255,255,255,.1);
      box-shadow:0 4px 16px rgba(0,0,0,.3), inset 0 1px 0 rgba(255,255,255,.1);
    }
  }
  @media (max-width:480px){
    /* Điều chỉnh cho mobile */
    #motoai-card{
      left:10px;bottom:82px;width:calc(100vw - 20px);
      height:clamp(360px, 60vh, 620px); /* Điều chỉnh chiều cao cho phù hợp mobile */
    }
    #motoai-header .brand{font-size:13px}
    .q-btn{width:32px;height:32px}
    /* Đảm bảo padding bottom cho iPhone notch/safe area */
    #motoai-input{ padding-bottom: max(10px, env(safe-area-inset-bottom)) !important; }
  }`;

  // Hàm inject UI
  (function injectUI(){
    if ($('#motoai-root')) return;
    const wrap=document.createElement('div'); wrap.innerHTML=uiHtml;
    document.body.appendChild(wrap.firstElementChild);
    const st=document.createElement('style'); st.textContent=uiCss; document.head.appendChild(st);
  })();

  const bubble=$('#motoai-bubble'), card=$('#motoai-card'), closeBtn=$('#motoai-close');
  const bodyEl=$('#motoai-body'), suggestEl=$('#motoai-suggest');
  const inputEl=$('#motoai-input-el'), sendBtn=$('#motoai-send');

  // ===== State & Storage =====
  let isOpen=false, sending=false, corpus=[];
  function loadCorpus(){ corpus=safeParse(localStorage.getItem(CFG.corpusKey))||[] }
  function saveCorpus(){ try{localStorage.setItem(CFG.corpusKey,JSON.stringify(corpus))}catch(e){} }
  loadCorpus();

  function addMsg(role,text){
    if(!text) return;
    const d=document.createElement('div');
    d.className='m-msg '+(role==='user'?'user':'bot');
    d.textContent=text;
    bodyEl.appendChild(d);
    bodyEl.scrollTop=bodyEl.scrollHeight;
    // session
    const raw=safeParse(localStorage.getItem(CFG.sessionKey)||'[]')||[];
    raw.push({role,text,t:Date.now()});
    try{localStorage.setItem(CFG.sessionKey,JSON.stringify(raw.slice(-150)))}catch(e){}
  }
  function renderSession(){
    bodyEl.innerHTML='';
    const arr=safeParse(localStorage.getItem(CFG.sessionKey)||'[]')||[];
    if(arr.length){arr.forEach(m=>addMsg(m.role,m.text))}
    else addMsg('bot','Chào bạn, mình là AI Assistant. Mình có thể giúp tra giá, dịch vụ hoặc chỉ đường nhanh.');
  }

  // ===== Build corpus (DOM) =====
  function buildCorpusFromDOM(){
    try{
      let nodes=$$('#main,main,article,section');
      if(!nodes.length) nodes=[document.body];
      let texts=[];
      nodes.forEach(n=>{
        n.querySelectorAll('h1,h2,h3').forEach(h=>{
          const t=h.innerText?.trim(); if(t && t.length>12) texts.push(t);
        });
        n.querySelectorAll('p,li').forEach(p=>{
          const t=p.innerText?.trim(); if(t && t.length>=CFG.minSentenceLen) texts.push(t);
        });
      });
      const meta=document.querySelector('meta[name="description"]');
      if(texts.length<10 && meta?.content) texts.push(meta.content);
      texts=uniq(texts).slice(0,CFG.maxItems);
      corpus=texts.map((t,i)=>({id:i,text:t,tokens:tok(t)}));
      saveCorpus();
    }catch(e){}
  }
  if(!corpus.length) buildCorpusFromDOM();

  // ===== Retrieval + polite rules =====
  const RULES=[
    {re:/(chào|xin chào|hello|hi|alo)/i, ans:"Mình ở đây để hỗ trợ thông tin, bạn đang quan tâm điều gì?"},
    {re:/(bảng giá|giá|bao nhiêu|bang gia)/i, ans:"Bạn muốn xem giá theo ngày/tuần/tháng hay theo gói cụ thể?"},
    {re:/(dịch vụ|dich vu|service)/i, ans:"Bạn mô tả nhu cầu để mình gợi ý gói dịch vụ phù hợp nhé."},
    {re:/(liên hệ|lien he|zalo|hotline|sđt|sdt|gọi|gọi điện)/i, ans:`Bạn có thể liên hệ nhanh: Zalo, WhatsApp, gọi điện hoặc mở bản đồ ở thanh icon phía trên.`}
  ];
  function ruleAns(q){ for(const r of RULES){ if(r.re.test(q)) return r.ans } return null }
  function retrieve(q){
    const qtok=tok(q).filter(w=>w.length>1);
    if(!qtok.length) return null;
    let best={score:0,text:null};
    for(const it of corpus){
      const line=it.text||''; const low=line.toLowerCase();
      let s=0; for(const w of qtok){ if(low.includes(w)) s++ }
      if(s>best.score) best={score:s,text:line};
    }
    return best.score>0? best.text : null;
  }
  function answer(q){
    const msg=q.trim();
    if(!msg) return "Bạn thử hỏi: giá thuê, dịch vụ, sản phẩm, chỉ đường…";
    const r=ruleAns(msg); if(r) return r;
    const t=retrieve(msg); if(t) return t;
    return "Mình chưa tìm thấy đúng ý, bạn nói cụ thể hơn giúp mình nhé.";
  }

  // ===== Suggestions =====
  (function buildSuggest(){
    const items=[
      {q:'Bảng giá', label:'💰 Bảng giá'},
      {q:'Dịch vụ', label:'⚙️ Dịch vụ'},
      {q:'Sản phẩm', label:'🏍️ Sản phẩm'},
      {q:'Chỉ đường', label:'📍 Chỉ đường'}
    ];
    suggestEl.innerHTML='';
    items.forEach(it=>{
      const b=document.createElement('button');
      b.textContent=it.label;
      b.addEventListener('click',()=>{ if(!isOpen) open(); send(it.q) });
      suggestEl.appendChild(b);
    });
  })();

  // ===== Open/Close (Instant No Slide) =====
  function open(){
    if(isOpen) return;
    renderSession();
    card.style.display='flex'; // Hiện tức thì
    card.classList.add('open');
    isOpen=true;
    // Vẫn giữ timeout nhỏ để đảm bảo card đã render rồi mới focus
    setTimeout(()=>{ try{inputEl.focus()}catch(e){} },50);
  }
  function close(){
    if(!isOpen) return;
    card.classList.remove('open');
    card.style.display='none'; // Ẩn tức thì
    isOpen=false;
  }

  // ===== Send flow (Không thay đổi) =====
  async function send(text){
    if(sending) return;
    text=(text||'').trim();
    if(!text) return;
    sending=true;
    inputEl.value=''; // Clear input ngay lập tức
    addMsg('user',text);
    // Độ trễ trả lời mô phỏng đánh máy
    await sleep(140+Math.min(380,text.length*4));
    const out=answer(text);
    addMsg('bot',out);
    sending=false;
  }

  // ===== Bind =====
  bubble.addEventListener('click',()=>{ if(!corpus.length) buildCorpusFromDOM(); open(); });
  closeBtn.addEventListener('click',close);
  sendBtn.addEventListener('click',()=>{ const v=inputEl.value.trim(); if(!v) return; send(v) });
  inputEl.addEventListener('keydown',e=>{ if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); const v=inputEl.value.trim(); if(!v) return; send(v) }});

  // ===== Expose =====
  window.MotoAI_v18xq={
    open,close,send,rebuild:buildCorpusFromDOM, version:'v18xq-map-noslide'
  };
})();

