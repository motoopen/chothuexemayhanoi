(function(){
  if(window.MotoAI_v23c_MESSENGER_LOADED) return;
  window.MotoAI_v23c_MESSENGER_LOADED = true;

  const DEF = {
    brand: "Motoopen",
    phone: "0857255868",
    zalo: "https://zalo.me/0857255868",
    map: "https://maps.app.goo.gl/2icTBTxAToyvKTE78"
  };
  const ORG = window.MotoAI_CONFIG||{};
  if(!ORG.zalo && (ORG.phone||DEF.phone)) ORG.zalo='https://zalo.me/'+String(ORG.phone||DEF.phone).replace(/\s+/g,'');
  const CFG = Object.assign({}, DEF, ORG);

  const $ = s=>document.querySelector(s);
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const nfVND=n=>(n||0).toLocaleString('vi-VN');

  const ui=`
  <div id="mta-root" aria-live="polite">
    <button id="mta-bubble" title="Chat với ${CFG.brand}">💬</button>
    <div id="mta-backdrop"></div>
    <section id="mta-card" aria-label="Chat MotoAI" aria-hidden="true">
      <header id="mta-header">
        <div class="brand">
          <span class="avatar">💬</span>
          <div class="info">
            <div class="name">${CFG.brand}</div>
            <div class="sub">Đang hoạt động 🟢</div>
          </div>
          <nav class="quick">
            <a href="tel:${CFG.phone}" title="Gọi">📞</a>
            <a href="${CFG.zalo}" target="_blank" title="Zalo">Z</a>
            <a href="${CFG.map}" target="_blank" title="Bản đồ">📍</a>
          </nav>
          <button id="mta-close" title="Đóng">✕</button>
        </div>
      </header>
      <main id="mta-body"></main>
      <div id="mta-tags">
        <div id="tagTrack">
          <button data-q="Xe số">🏍️ Xe số</button>
          <button data-q="Xe ga">🛵 Xe ga</button>
          <button data-q="Xe điện">⚡ Xe điện</button>
          <button data-q="50cc">🚲 50cc</button>
          <button data-q="Thủ tục">📄 Thủ tục</button>
          <button data-q="Bảng giá">💰 Bảng giá</button>
          <button data-q="Liên hệ">☎️ Liên hệ</button>
        </div>
      </div>
      <footer id="mta-input">
        <input id="mta-in" placeholder="Nhắn tin..." autocomplete="off">
        <button id="mta-send">➤</button>
      </footer>
    </section>
  </div>`;

  const css=`
  :root{--m-blue:#0084FF;--m-blue2:#00B2FF;--m-bg:#fff;--m-text:#111}
  #mta-root{position:fixed;left:16px;bottom:calc(20px + env(safe-area-inset-bottom));z-index:2147483647;font-family:-apple-system,system-ui,Roboto;}
  #mta-bubble{width:58px;height:58px;border:none;border-radius:50%;background:linear-gradient(90deg,var(--m-blue),var(--m-blue2));color:#fff;font-size:28px;cursor:pointer;box-shadow:0 8px 20px rgba(0,0,0,.25)}
  #mta-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.3);opacity:0;pointer-events:none;transition:.25s}
  #mta-backdrop.show{opacity:1;pointer-events:auto}
  #mta-card{position:fixed;left:16px;bottom:16px;width:min(400px,calc(100% - 24px));height:70vh;max-height:720px;background:var(--m-bg);color:var(--m-text);border-radius:16px;box-shadow:0 14px 36px rgba(0,0,0,.25);transform:translateY(110%);transition:transform .25s cubic-bezier(.22,1,.36,1);display:flex;flex-direction:column;overflow:hidden}
  #mta-card.open{transform:translateY(0)}
  #mta-header{background:linear-gradient(90deg,var(--m-blue),var(--m-blue2));color:#fff;padding:10px;display:flex;align-items:center;justify-content:space-between}
  .avatar{background:rgba(255,255,255,.2);padding:6px;border-radius:50%;margin-right:6px}
  .quick a{margin:0 4px;text-decoration:none;color:#fff}
  #mta-body{flex:1;overflow:auto;padding:12px;background:#F0F3F7}
  .m-msg{max-width:80%;margin:8px 0;padding:9px 13px;border-radius:18px;box-shadow:0 1px 2px rgba(0,0,0,.08)}
  .m-msg.bot{background:#fff}
  .m-msg.user{background:var(--m-blue);color:#fff;margin-left:auto}
  #mta-tags{background:#f9fafc;border-top:1px solid rgba(0,0,0,.05);overflow-x:auto;white-space:nowrap;padding:8px}
  #mta-tags button{display:inline-block;margin:0 6px;padding:8px 14px;border:none;border-radius:999px;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.08);cursor:pointer}
  #mta-input{display:flex;gap:6px;padding:10px;background:#fff;border-top:1px solid #ddd}
  #mta-in{flex:1;padding:10px 14px;border-radius:20px;border:1px solid #ddd}
  #mta-send{width:44px;height:44px;border:none;border-radius:50%;background:linear-gradient(90deg,var(--m-blue),var(--m-blue2));color:#fff;cursor:pointer}
  @media(max-width:520px){#mta-card{width:calc(100% - 16px);left:8px;height:72vh}}
  `;

  function injectUI(){
    if($('#mta-root')) return;
    const d=document.createElement('div');
    d.innerHTML=ui;document.body.appendChild(d.firstElementChild);
    const s=document.createElement('style');s.textContent=css;document.head.appendChild(s);
  }

  let sending=false;
  function addMsg(role,text){
    const e=document.createElement('div');e.className='m-msg '+(role==='user'?'user':'bot');e.textContent=text;
    $('#mta-body').appendChild(e);
    $('#mta-body').scrollTop=$('#mta-body').scrollHeight;
  }

  function reply(q){
    q=q.toLowerCase();
    if(q.includes('giá')||q.includes('bao nhiêu')) return 'Giá thuê xe từ 150k–200k/ngày, tùy dòng xe. Liên hệ Zalo để xem hình thật và giá chính xác nhé!';
    if(q.includes('địa')||q.includes('ở đâu')) return 'Bên em ở 112 Nguyễn Văn Cừ, Long Biên, Hà Nội.';
    if(q.includes('zalo')) return 'Liên hệ Zalo: '+CFG.zalo;
    return 'Cảm ơn anh/chị! Anh/chị cần thuê xe số, xe ga hay xe điện ạ?';
  }

  async function sendUser(text){
    if(!text||sending)return;
    sending=true;
    addMsg('user',text);
    $('#mta-in').value='';
    await sleep(500);
    addMsg('bot',reply(text));
    sending=false;
  }

  function bind(){
    $('#mta-bubble').onclick=openChat;
    $('#mta-close').onclick=closeChat;
    $('#mta-backdrop').onclick=closeChat;
    $('#mta-send').onclick=()=>{const v=$('#mta-in').value.trim();if(v)sendUser(v)};
    $('#mta-in').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();const v=$('#mta-in').value.trim();if(v)sendUser(v)}});
    $('#tagTrack').querySelectorAll('button').forEach(b=>b.onclick=()=>sendUser(b.dataset.q));
  }

  function openChat(){
    injectUI();
    $('#mta-card').classList.add('open');
    $('#mta-backdrop').classList.add('show');
    $('#mta-bubble').style.display='none';
    $('#mta-body').innerHTML='';
    addMsg('bot',`Xin chào 👋 em là nhân viên hỗ trợ ${CFG.brand}. Anh/chị cần thuê xe gì ạ?`);
  }

  function closeChat(){
    $('#mta-card').classList.remove('open');
    $('#mta-backdrop').classList.remove('show');
    $('#mta-bubble').style.display='flex';
  }

  document.addEventListener('DOMContentLoaded',()=>{
    injectUI();bind();
    console.log('%cMotoAI v23c UltraReal Safe (LEFT) — Active','color:#0084FF;font-weight:bold;');
  });

  // Watchdog — tự phục hồi nếu phần tử bị mất
  setInterval(()=>{
    if(!$('#mta-bubble')||!$('#mta-card')){
      console.warn('MotoAI Watchdog: reinjecting...');
      injectUI();bind();
    }
  },5000);

  window.MotoAI_v23c_messenger={open:openChat,close:closeChat};
})();
