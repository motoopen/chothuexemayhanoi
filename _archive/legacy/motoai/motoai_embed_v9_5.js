// MotoAI v9.5 Stable UX 😎
// Fix: không auto mở, đóng/mở mượt, iOS không tụt khung, responsive iPad/Desktop

window.addEventListener('DOMContentLoaded', () => {
  if (window.MotoAI_9_5_LOADED) return;
  window.MotoAI_9_5_LOADED = true;

  // ====== Inject HTML ======
  const html = `
  <div id="motoai-root">
    <div id="motoai-bubble" role="button" aria-label="Mở chat">🤖</div>
    <div id="motoai-backdrop"></div>
    <div id="motoai-card" aria-hidden="true">
      <div id="motoai-handle"></div>
      <div id="motoai-header">
        <span>MotoAI Assistant</span>
        <button id="motoai-close" title="Đóng">✕</button>
      </div>
      <div id="motoai-body">
        <div class="m-msg bot">👋 Xin chào! Mình là MotoAI — hỏi thử “Xe ga”, “Xe số” hoặc “Thủ tục thuê xe” nhé!</div>
      </div>
      <div id="motoai-suggestions">
        <button data-q="Xe số">🏍 Xe số</button>
        <button data-q="Xe ga">🛵 Xe ga</button>
        <button data-q="Thủ tục">📄 Thủ tục</button>
      </div>
      <div id="motoai-input">
        <input id="motoai-input-el" placeholder="Nhập câu hỏi..." autocomplete="off" />
        <button id="motoai-send">Gửi</button>
      </div>
      <button id="motoai-clear" title="Xóa hội thoại">🗑</button>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', html);

  // ====== CSS ======
  const style = document.createElement('style');
  style.textContent = `
  :root { --accent:#007aff; --bg-light:#fff; --bg-dark:#1b1c1f; }
  #motoai-root{position:fixed;left:16px;bottom:100px;z-index:99997;}
  #motoai-bubble{width:58px;height:58px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:28px;background:var(--accent);color:#fff;cursor:pointer;box-shadow:0 8px 20px rgba(0,0,0,0.25);transition:transform .25s}
  #motoai-bubble:hover{transform:scale(1.05)}
  #motoai-backdrop{position:fixed;inset:0;background:rgba(0,0,0,0.25);opacity:0;pointer-events:none;transition:opacity .3s;z-index:99998;}
  #motoai-backdrop.show{opacity:1;pointer-events:auto;}
  #motoai-card{position:fixed;left:0;right:0;bottom:0;width:min(900px,calc(100% - 30px));margin:auto;height:70vh;max-height:720px;border-radius:18px 18px 0 0;background:var(--bg-light);box-shadow:0 -12px 40px rgba(0,0,0,.18);transform:translateY(110%);opacity:0;display:flex;flex-direction:column;overflow:hidden;z-index:99999;transition:transform .4s cubic-bezier(.2,.9,.2,1),opacity .3s;}
  #motoai-card.open{transform:translateY(0);opacity:1;}
  #motoai-handle{width:60px;height:6px;background:#d0d6dc;border-radius:6px;margin:10px auto;}
  #motoai-header{display:flex;align-items:center;justify-content:space-between;padding:6px 14px;font-weight:700;color:var(--accent);border-bottom:1px solid rgba(0,0,0,.08);}
  #motoai-close{background:none;border:none;font-size:22px;cursor:pointer;color:var(--accent);opacity:.85;}
  #motoai-body{flex:1;overflow-y:auto;padding:10px 14px;font-size:15px;background:rgba(250,250,250,.6);}
  .m-msg{margin:8px 0;padding:10px 12px;border-radius:12px;max-width:84%;line-height:1.4;word-break:break-word;}
  .m-msg.user{background:linear-gradient(180deg,var(--accent),#00b6ff);color:#fff;margin-left:auto;}
  .m-msg.bot{background:rgba(240,240,246,.95);color:#111;}
  #motoai-input{display:flex;gap:8px;padding:10px;border-top:1px solid rgba(0,0,0,.06);background:rgba(255,255,255,.9);}
  #motoai-input input{flex:1;padding:10px;border-radius:12px;border:1px solid #ccc;font-size:16px;}
  #motoai-input button{background:var(--accent);color:#fff;border:none;border-radius:10px;padding:10px 14px;font-weight:600;}
  #motoai-suggestions{display:flex;gap:6px;justify-content:center;flex-wrap:wrap;padding:6px 10px;border-top:1px solid rgba(0,0,0,.05);background:rgba(255,255,255,.85);}
  #motoai-suggestions button{border:none;background:rgba(0,122,255,.08);color:var(--accent);padding:8px 12px;border-radius:10px;cursor:pointer;font-weight:500;}
  #motoai-clear{position:absolute;top:10px;right:40px;background:none;border:none;font-size:18px;cursor:pointer;opacity:.8;}
  @media(prefers-color-scheme:dark){
    #motoai-card{background:var(--bg-dark);}
    .m-msg.bot{background:rgba(40,40,50,.9);color:#eee;}
    #motoai-input{background:rgba(25,25,30,.9);}
    #motoai-suggestions{background:rgba(25,25,30,.95);}
  }`;
  document.head.appendChild(style);

  // ====== JS ======
  const $ = s => document.querySelector(s);
  const bubble = $('#motoai-bubble');
  const card = $('#motoai-card');
  const backdrop = $('#motoai-backdrop');
  const closeBtn = $('#motoai-close');
  const sendBtn = $('#motoai-send');
  const input = $('#motoai-input-el');
  const clear = $('#motoai-clear');
  const bodyEl = $('#motoai-body');
  const suggestions = document.querySelectorAll('#motoai-suggestions button');
  let chatOpen = false;

  function openChat(){
    card.classList.add('open');
    backdrop.classList.add('show');
    bubble.style.display='none';
    chatOpen = true;
    setTimeout(()=>input.focus(),400);
  }
  function closeChat(){
    card.classList.remove('open');
    backdrop.classList.remove('show');
    bubble.style.display='flex';
    chatOpen = false;
  }

  function clearChat(){
    bodyEl.innerHTML='<div class="m-msg bot">🗑 Đã xóa cuộc trò chuyện.</div>';
  }

  function sendMessage(textOverride){
    const text=textOverride||input.value.trim();
    if(!text) return;
    const user=document.createElement('div');
    user.className='m-msg user';
    user.textContent=text;
    bodyEl.appendChild(user);
    bodyEl.scrollTop=bodyEl.scrollHeight;
    input.value='';
    const bot=document.createElement('div');
    bot.className='m-msg bot';
    bot.textContent='🤖 Cảm ơn, mình đang học thêm từ nội dung trang này...';
    bodyEl.appendChild(bot);
    bodyEl.scrollTop=bodyEl.scrollHeight;
  }

  // Event bindings
  bubble.onclick=openChat;
  backdrop.onclick=closeChat;
  closeBtn.onclick=closeChat;
  clear.onclick=clearChat;
  sendBtn.onclick=()=>sendMessage();
  input.addEventListener('keydown',e=>{
    if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage();}
  });
  suggestions.forEach(btn=>btn.onclick=()=>sendMessage(btn.dataset.q));

  // iOS VisualViewport Fix
  if (window.visualViewport) {
    visualViewport.addEventListener('resize', () => {
      const offset = window.innerHeight - visualViewport.height;
      card.style.bottom = offset > 0 ? offset + 'px' : '0';
    });
  }

  // Responsive height on rotate
  window.addEventListener('resize', ()=>{
    if(chatOpen){
      const h = Math.min(window.innerHeight * 0.7, 720);
      card.style.height = h + 'px';
    }
  });

  console.log('✅ MotoAI v9.5 Stable UX loaded.');
});
