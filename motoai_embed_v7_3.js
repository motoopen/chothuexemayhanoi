// MotoAI v7.3 — iOS Stable: fix auto-close on typing + safe area + no overlap 😎
window.addEventListener('DOMContentLoaded', function() {
  if (window.MotoAI_v7_3_LOADED) return;
  window.MotoAI_v7_3_LOADED = true;

  const CORE_URL = "https://cdn.jsdelivr.net/gh/motoopen/chothuexemayhanoi@main/motoai_core_v7.js";

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
        <div class="m-msg bot">👋 Xin chào! Mình là MotoAI — hỏi thử “Xe ga” hay “Thủ tục thuê xe” nhé!</div>
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
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', html);

  // CSS
  const style = document.createElement('style');
  style.textContent = `
  :root { --accent:#007aff; --bg-light:#fff; --bg-dark:#1b1c1f; }
  #motoai-root{
    position:fixed;
    left:16px;
    bottom:calc(env(safe-area-inset-bottom,0px) + 90px);
    z-index:950;
    pointer-events:none;
  }
  #motoai-bubble{
    width:58px;height:58px;border-radius:14px;
    display:flex;align-items:center;justify-content:center;
    font-size:28px;background:var(--accent);color:#fff;
    cursor:pointer;box-shadow:0 8px 20px rgba(0,0,0,0.25);
    transition:transform .25s;
    pointer-events:auto;
  }
  #motoai-backdrop{
    position:fixed;inset:0;background:rgba(0,0,0,0.25);
    opacity:0;pointer-events:none;transition:opacity .3s;z-index:949;
  }
  #motoai-backdrop.show{opacity:1;pointer-events:auto}

  #motoai-card{
    position:fixed;left:0;right:0;bottom:0;
    width:min(900px,calc(100% - 30px));margin:auto;
    height:70vh;max-height:720px;
    border-radius:18px 18px 0 0;
    background:var(--bg-light);
    box-shadow:0 -12px 40px rgba(0,0,0,.18);
    transform:translateY(110%);opacity:0;
    display:flex;flex-direction:column;
    overflow:hidden;
    z-index:960;
    transition:transform .4s cubic-bezier(.2,.9,.2,1),opacity .3s;
    will-change:transform;
  }
  #motoai-card.open{transform:translateY(-70px);opacity:1;} /* tránh quick call */

  #motoai-header{display:flex;align-items:center;justify-content:space-between;
    padding:6px 14px;font-weight:700;color:var(--accent);
    border-bottom:1px solid rgba(0,0,0,.08)}
  #motoai-close{background:none;border:none;font-size:22px;cursor:pointer;color:var(--accent);opacity:.85}
  #motoai-body{flex:1;overflow-y:auto;padding:10px 14px;font-size:15px;background:rgba(250,250,250,.6)}
  .m-msg{margin:8px 0;padding:10px 12px;border-radius:12px;max-width:84%;line-height:1.4;word-break:break-word}
  .m-msg.user{background:linear-gradient(180deg,var(--accent),#00b6ff);color:#fff;margin-left:auto}
  .m-msg.bot{background:rgba(240,240,246,.95);color:#111}
  #motoai-input{display:flex;gap:8px;padding:10px;border-top:1px solid rgba(0,0,0,.06);background:rgba(255,255,255,.9)}
  #motoai-input input{flex:1;padding:10px;border-radius:12px;border:1px solid #ccc;font-size:16px}
  #motoai-input button{background:var(--accent);color:#fff;border:none;border-radius:10px;padding:10px 14px;font-weight:600}
  #motoai-suggestions{display:flex;gap:6px;justify-content:center;flex-wrap:wrap;padding:6px 10px;border-top:1px solid rgba(0,0,0,.05);background:rgba(255,255,255,.85)}
  #motoai-suggestions button{border:none;background:rgba(0,122,255,.08);color:var(--accent);padding:8px 12px;border-radius:10px;cursor:pointer;font-weight:500}
  @media(prefers-color-scheme:dark){
    #motoai-card{background:var(--bg-dark)}
    .m-msg.bot{background:rgba(40,40,50,.9);color:#eee}
    #motoai-input{background:rgba(25,25,30,.9)}
    #motoai-suggestions{background:rgba(25,25,30,.95)}
  }`;
  document.head.appendChild(style);

  const $ = s => document.querySelector(s);
  const bubble = $('#motoai-bubble');
  const card = $('#motoai-card');
  const backdrop = $('#motoai-backdrop');
  const closeBtn = $('#motoai-close');
  const sendBtn = $('#motoai-send');
  const input = $('#motoai-input-el');
  const bodyEl = $('#motoai-body');

  // === Behavior ===
  function openChat(){
    card.classList.add('open');
    backdrop.classList.add('show');
    bubble.style.display='none';
    document.body.style.overflow='hidden'; // ngăn scroll nền
  }
  function closeChat(){
    card.classList.remove('open');
    backdrop.classList.remove('show');
    bubble.style.display='flex';
    document.body.style.overflow='';
  }

  function sendMessage(textOverride){
    const text=textOverride||input.value.trim();
    if(!text)return;
    const user=document.createElement('div');
    user.className='m-msg user';
    user.textContent=text;
    bodyEl.appendChild(user);
    bodyEl.scrollTop=bodyEl.scrollHeight;
    input.value='';
    const bot=document.createElement('div');
    bot.className='m-msg bot';
    bot.textContent='🤖 Đang tìm câu trả lời...';
    bodyEl.appendChild(bot);
    bodyEl.scrollTop=bodyEl.scrollHeight;

    window.dispatchEvent(new CustomEvent("MotoAI_Ask",{detail:text}));
    window.addEventListener("MotoAI_Answer",e=>{
      bot.textContent=e.detail;
      bodyEl.scrollTop=bodyEl.scrollHeight;
    },{once:true});
  }

  // === iOS focus fix ===
  input.addEventListener('focus', () => {
    setTimeout(() => {
      card.style.transform = 'translateY(-120px)'; // đẩy khung lên khi bàn phím mở
    }, 200);
  });
  input.addEventListener('blur', () => {
    setTimeout(() => {
      card.style.transform = 'translateY(-70px)'; // trả về vị trí gốc
    }, 200);
  });

  bubble.onclick=openChat;
  backdrop.onclick=closeChat;
  closeBtn.onclick=closeChat;
  sendBtn.onclick=()=>sendMessage();
  input.addEventListener('keydown',e=>{
    if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage();}
  });
  document.querySelectorAll('#motoai-suggestions button').forEach(btn=>{
    btn.onclick=()=>sendMessage(btn.dataset.q);
  });

  const core=document.createElement('script');
  core.src=CORE_URL+'?v='+Date.now();
  core.defer=true;
  document.head.appendChild(core);

  console.log('✅ MotoAI v7.3 iOS Stable loaded.');
});
