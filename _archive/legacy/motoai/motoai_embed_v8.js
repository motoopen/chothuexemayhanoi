// MotoAI Embed v8.0 — iOS-style Chat + Typing + Memory + Suggestions
window.addEventListener("DOMContentLoaded", ()=>{
  if (window.MotoAI_EMBED_V8) return;
  window.MotoAI_EMBED_V8 = true;

  const CORE_URL = "https://cdn.jsdelivr.net/gh/motoopen/chothuexemayhanoi@main/motoai_core_v8.js";

  const html = `
  <div id="motoai-root">
    <div id="motoai-bubble" role="button" aria-label="Mở chat">🤖</div>
    <div id="motoai-backdrop"></div>
    <div id="motoai-card">
      <div id="motoai-header">
        <span>MotoAI Assistant</span>
        <button id="motoai-close">✕</button>
      </div>
      <div id="motoai-body">
        <div class="m-msg bot">👋 Xin chào! Mình là MotoAI — hỏi thử “Xe ga”, “Xe số” hay “Thủ tục thuê xe” nhé!</div>
      </div>
      <div id="motoai-suggestions">
        <button data-q="Xe số">🏍 Xe số</button>
        <button data-q="Xe ga">🛵 Xe ga</button>
        <button data-q="Thủ tục">📄 Thủ tục</button>
      </div>
      <div id="motoai-input">
        <input id="motoai-input-el" placeholder="Nhập câu hỏi..." autocomplete="off"/>
        <button id="motoai-send">Gửi</button>
      </div>
      <button id="motoai-clear" title="Xóa hội thoại">🗑</button>
    </div>
  </div>`;
  document.body.insertAdjacentHTML("beforeend", html);

  const style = document.createElement("style");
  style.textContent = `
  :root{--accent:#007aff;--card-bg:#fff;--dark-bg:#1b1c1f;}
  #motoai-root{position:fixed;left:18px;bottom:92px;z-index:2147483000;}
  #motoai-bubble{width:58px;height:58px;border-radius:14px;background:var(--accent);color:#fff;font-size:28px;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 8px 20px rgba(0,0,0,.3);}
  #motoai-backdrop{position:fixed;inset:0;background:rgba(0,0,0,0.25);opacity:0;pointer-events:none;transition:opacity .3s;}
  #motoai-backdrop.show{opacity:1;pointer-events:auto;}
  #motoai-card{position:fixed;left:0;right:0;bottom:0;width:min(900px,calc(100% - 30px));margin:auto;height:72vh;max-height:720px;border-radius:18px 18px 0 0;background:var(--card-bg);box-shadow:0 -12px 40px rgba(0,0,0,.18);transform:translateY(110%);opacity:0;transition:transform .4s,opacity .3s;display:flex;flex-direction:column;overflow:hidden;}
  #motoai-card.open{transform:translateY(0);opacity:1;}
  #motoai-header{display:flex;justify-content:space-between;align-items:center;padding:10px 14px;font-weight:700;color:var(--accent);}
  #motoai-close{background:none;border:none;font-size:20px;color:var(--accent);cursor:pointer;}
  #motoai-body{flex:1;overflow:auto;padding:10px 14px;background:rgba(250,250,250,.6);}
  .m-msg{margin:8px 0;padding:10px 12px;border-radius:12px;max-width:85%;line-height:1.35;word-break:break-word;}
  .m-msg.user{background:linear-gradient(180deg,var(--accent),#00b6ff);color:#fff;margin-left:auto;}
  .m-msg.bot{background:rgba(240,240,246,.95);color:#111;}
  .typing{font-style:italic;opacity:.7;animation:blink 1s infinite;}
  @keyframes blink{50%{opacity:.3}}
  #motoai-suggestions{display:flex;gap:6px;justify-content:center;padding:6px;background:rgba(255,255,255,.9);}
  #motoai-suggestions button{border:none;background:rgba(0,122,255,.1);color:var(--accent);padding:8px 12px;border-radius:10px;cursor:pointer;}
  #motoai-input{display:flex;gap:8px;padding:10px;border-top:1px solid rgba(0,0,0,.06);}
  #motoai-input input{flex:1;padding:10px;border-radius:10px;border:1px solid #ccc;font-size:16px;}
  #motoai-input button{background:var(--accent);color:#fff;border:none;border-radius:10px;padding:10px 14px;font-weight:600;}
  #motoai-clear{position:absolute;top:12px;right:40px;background:none;border:none;font-size:18px;cursor:pointer;}
  @media(prefers-color-scheme:dark){
    #motoai-card{background:var(--dark-bg);}
    .m-msg.bot{background:rgba(40,40,50,.9);color:#eee;}
    #motoai-suggestions{background:rgba(25,25,30,.9);}
    #motoai-input{background:rgba(25,25,30,.9);}
  }`;
  document.head.appendChild(style);

  const $ = s => document.querySelector(s);
  const bubble = $("#motoai-bubble"), card=$("#motoai-card"), backdrop=$("#motoai-backdrop"),
        send=$("#motoai-send"), input=$("#motoai-input-el"), body=$("#motoai-body"),
        clear=$("#motoai-clear"), close=$("#motoai-close");

  function open(){card.classList.add("open");backdrop.classList.add("show");bubble.style.display="none";}
  function closeChat(){card.classList.remove("open");backdrop.classList.remove("show");bubble.style.display="flex";}
  function clearChat(){MotoAI.clear();body.innerHTML='<div class="m-msg bot">🗑 Đã xóa cuộc trò chuyện.</div>';}

  function addMsg(role, text){
    const d=document.createElement("div");
    d.className="m-msg "+role;
    d.textContent=text;
    body.appendChild(d);
    body.scrollTop=body.scrollHeight;
  }

  function typingEffect(){
    const t=document.createElement("div");
    t.className="m-msg bot typing";
    t.textContent="...";
    body.appendChild(t);
    body.scrollTop=body.scrollHeight;
    return t;
  }

  function sendMsg(txt){
    if(!txt.trim()) return;
    addMsg("user", txt);
    input.value="";
    const t=typingEffect();
    MotoAI.ask(txt,ans=>{
      t.remove();
      addMsg("bot", ans);
    });
  }

  bubble.onclick=open;
  backdrop.onclick=closeChat;
  close.onclick=closeChat;
  clear.onclick=clearChat;
  send.onclick=()=>sendMsg(input.value);
  input.addEventListener("keydown",e=>{
    if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMsg(input.value);}
  });
  document.querySelectorAll("#motoai-suggestions button").forEach(b=>b.onclick=()=>sendMsg(b.dataset.q));

  const core=document.createElement("script");
  core.src=CORE_URL+"?v="+Date.now();
  core.defer=true;
  document.head.appendChild(core);
});
