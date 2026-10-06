// MotoAI v7.4 — True iOS Fix (no auto-close, no event loss, full safe input)
window.addEventListener('DOMContentLoaded', function() {
  if (window.MotoAI_v7_4_LOADED) return;
  window.MotoAI_v7_4_LOADED = true;

  const CORE_URL = "https://cdn.jsdelivr.net/gh/motoopen/chothuexemayhanoi@main/motoai_core_v7.js";

  const html = `
  <div id="motoai-container">
    <div id="motoai-bubble" role="button" aria-label="Mở chat">🤖</div>
    <div id="motoai-overlay">
      <div id="motoai-card">
        <header>
          <span>MotoAI Assistant</span>
          <button id="motoai-close">✕</button>
        </header>
        <main id="motoai-body">
          <div class="m-msg bot">👋 Xin chào! Mình là MotoAI — hỏi thử “Xe ga” hay “Thủ tục thuê xe” nhé!</div>
        </main>
        <div id="motoai-suggestions">
          <button data-q="Xe số">🏍 Xe số</button>
          <button data-q="Xe ga">🛵 Xe ga</button>
          <button data-q="Thủ tục">📄 Thủ tục</button>
        </div>
        <footer>
          <input id="motoai-input" placeholder="Nhập câu hỏi..." />
          <button id="motoai-send">Gửi</button>
        </footer>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', html);

  const style = document.createElement('style');
  style.textContent = `
  :root { --accent:#007aff; --bg:#fff; --darkbg:#1b1c1f; }
  #motoai-container{position:fixed;left:16px;bottom:calc(env(safe-area-inset-bottom,0px) + 100px);z-index:9998;}
  #motoai-bubble{
    width:58px;height:58px;border-radius:14px;display:flex;align-items:center;justify-content:center;
    font-size:28px;background:var(--accent);color:#fff;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.25);transition:transform .2s;
  }
  #motoai-bubble:hover{transform:scale(1.05);}
  #motoai-overlay{
    position:fixed;inset:0;background:rgba(0,0,0,.25);
    opacity:0;pointer-events:none;transition:opacity .3s ease;z-index:9999;
  }
  #motoai-overlay.show{opacity:1;pointer-events:auto;}
  #motoai-card{
    position:absolute;left:50%;bottom:0;transform:translate(-50%,110%);
    width:min(900px,calc(100% - 30px));height:70vh;max-height:720px;
    border-radius:18px 18px 0 0;background:var(--bg);
    display:flex;flex-direction:column;overflow:hidden;
    box-shadow:0 -12px 40px rgba(0,0,0,.2);
    transition:transform .4s cubic-bezier(.2,.9,.2,1);
    will-change:transform;
  }
  #motoai-overlay.show #motoai-card{transform:translate(-50%,0);}
  #motoai-card header{
    display:flex;justify-content:space-between;align-items:center;
    padding:10px 14px;font-weight:700;color:var(--accent);border-bottom:1px solid rgba(0,0,0,.1);
  }
  #motoai-card header button{border:none;background:none;color:var(--accent);font-size:22px;cursor:pointer;}
  #motoai-body{flex:1;overflow-y:auto;padding:10px 14px;font-size:15px;background:rgba(250,250,250,.6);}
  .m-msg{margin:8px 0;padding:10px 12px;border-radius:12px;max-width:84%;line-height:1.4;word-break:break-word;}
  .m-msg.user{background:linear-gradient(180deg,var(--accent),#00b6ff);color:#fff;margin-left:auto;}
  .m-msg.bot{background:rgba(240,240,246,.95);color:#111;}
  #motoai-suggestions{display:flex;gap:6px;justify-content:center;flex-wrap:wrap;padding:6px 10px;border-top:1px solid rgba(0,0,0,.05);}
  #motoai-suggestions button{border:none;background:rgba(0,122,255,.08);color:var(--accent);padding:8px 12px;border-radius:10px;cursor:pointer;font-weight:500;}
  footer{display:flex;gap:8px;padding:10px;border-top:1px solid rgba(0,0,0,.06);background:rgba(255,255,255,.9);}
  footer input{flex:1;padding:10px;border-radius:12px;border:1px solid #ccc;font-size:16px;}
  footer button{background:var(--accent);color:#fff;border:none;border-radius:10px;padding:10px 14px;font-weight:600;}
  @media(prefers-color-scheme:dark){
    #motoai-card{background:var(--darkbg);}
    .m-msg.bot{background:rgba(40,40,50,.9);color:#eee;}
    footer{background:rgba(25,25,30,.9);}
  }`;
  document.head.appendChild(style);

  // JS interaction
  const $ = s => document.querySelector(s);
  const bubble = $('#motoai-bubble');
  const overlay = $('#motoai-overlay');
  const card = $('#motoai-card');
  const close = $('#motoai-close');
  const input = $('#motoai-input');
  const send = $('#motoai-send');
  const body = $('#motoai-body');

  function openChat(){
    overlay.classList.add('show');
    document.body.style.overflow='hidden';
  }
  function closeChat(){
    overlay.classList.remove('show');
    document.body.style.overflow='';
  }

  function sendMessage(textOverride){
    const text=textOverride||input.value.trim();
    if(!text)return;
    const user=document.createElement('div');
    user.className='m-msg user';
    user.textContent=text;
    body.appendChild(user);
    input.value='';
    const bot=document.createElement('div');
    bot.className='m-msg bot';
    bot.textContent='🤖 Đang tìm câu trả lời...';
    body.appendChild(bot);
    body.scrollTop=body.scrollHeight;

    window.dispatchEvent(new CustomEvent("MotoAI_Ask",{detail:text}));
    window.addEventListener("MotoAI_Answer",e=>{
      bot.textContent=e.detail;
      body.scrollTop=body.scrollHeight;
    },{once:true});
  }

  bubble.onclick=openChat;
  close.onclick=closeChat;
  overlay.addEventListener('click',e=>{if(e.target===overlay)closeChat();});
  send.onclick=()=>sendMessage();
  input.addEventListener('keydown',e=>{
    if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage();}
  });
  document.querySelectorAll('#motoai-suggestions button').forEach(btn=>{
    btn.onclick=()=>sendMessage(btn.dataset.q);
  });

  // iOS focus safe
  input.addEventListener('focus',()=>{setTimeout(()=>window.scrollTo(0,document.body.scrollHeight),250);});

  const core=document.createElement('script');
  core.src=CORE_URL+'?v='+Date.now();
  core.defer=true;
  document.head.appendChild(core);

  console.log('✅ MotoAI v7.4 loaded successfully.');
});
