// MotoAI Embed v9.4 — Stable iOS + Safari fix (no auto-open, smooth input, full close)
(function(){
  if(window.MotoAI_V94_LOADED) return;
  window.MotoAI_V94_LOADED = true;
  console.log("✅ MotoAI v9.4 Stable Loaded");

  const html = `
  <div id="motoai-root">
    <div id="motoai-bubble" role="button" aria-label="Mở chat">🤖</div>

    <div id="motoai-overlay" aria-hidden="true">
      <div id="motoai-card" role="dialog" aria-modal="true">
        <div id="motoai-handle"></div>
        <header id="motoai-header">
          <span>MotoAI Assistant</span>
          <div class="tools">
            <button id="motoai-clear" title="Xóa">🗑</button>
            <button id="motoai-close" title="Đóng">✕</button>
          </div>
        </header>

        <main id="motoai-body">
          <div class="m-msg bot">👋 Xin chào! Mình là MotoAI — hỏi “Xe số”, “Xe ga” hay “Thủ tục”.</div>
        </main>

        <div id="motoai-suggestions">
          <button data-q="Xe số">🏍 Xe số</button>
          <button data-q="Xe ga">🛵 Xe ga</button>
          <button data-q="Thủ tục">📄 Thủ tục</button>
        </div>

        <footer id="motoai-input-wrap">
          <input id="motoai-input" placeholder="Nhập câu hỏi..." autocomplete="off"/>
          <button id="motoai-send">Gửi</button>
        </footer>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML("beforeend", html);

  /* --- CSS --- */
  const style = document.createElement("style");
  style.textContent = `
  :root{--accent:#007aff;--bg:#fff;--dark:#1b1c1e}
  #motoai-root{position:fixed;left:18px;bottom:20px;z-index:2147483000}
  #motoai-bubble{width:56px;height:56px;background:var(--accent);color:#fff;border-radius:14px;font-size:26px;display:flex;align-items:center;justify-content:center;box-shadow:0 10px 25px rgba(0,0,0,.2);cursor:pointer;transition:transform .2s}
  #motoai-bubble:hover{transform:scale(1.07)}
  #motoai-overlay{position:fixed;inset:0;background:rgba(0,0,0,0);display:flex;align-items:flex-end;justify-content:center;pointer-events:none;transition:background .3s;z-index:2147482999}
  #motoai-overlay.show{background:rgba(0,0,0,0.2);pointer-events:auto}
  #motoai-card{width:min(900px,calc(100% - 28px));background:var(--bg);border-radius:16px 16px 0 0;box-shadow:0 -16px 40px rgba(0,0,0,.2);display:flex;flex-direction:column;overflow:hidden;transform:translateY(110%);transition:transform .35s cubic-bezier(.2,.9,.2,1);max-height:80vh}
  #motoai-overlay.show #motoai-card{transform:translateY(0)}
  #motoai-handle{width:60px;height:6px;background:#ccc;border-radius:6px;margin:8px auto}
  #motoai-header{display:flex;align-items:center;justify-content:space-between;padding:8px 14px;color:var(--accent);font-weight:700;border-bottom:1px solid rgba(0,0,0,0.08)}
  #motoai-body{flex:1;overflow:auto;padding:10px 14px;background:#fafafa}
  .m-msg{margin:8px 0;padding:10px 12px;border-radius:12px;max-width:84%;word-break:break-word}
  .m-msg.user{background:linear-gradient(180deg,var(--accent),#00b6ff);color:#fff;margin-left:auto}
  .m-msg.bot{background:rgba(240,240,246,0.96);color:#111}
  #motoai-suggestions{display:flex;gap:6px;justify-content:center;flex-wrap:wrap;padding:8px;border-top:1px solid rgba(0,0,0,0.05)}
  #motoai-suggestions button{border:none;background:rgba(0,122,255,0.1);color:var(--accent);padding:8px 12px;border-radius:10px;cursor:pointer}
  #motoai-input-wrap{display:flex;gap:8px;padding:10px;border-top:1px solid rgba(0,0,0,0.08)}
  #motoai-input{flex:1;padding:10px;border-radius:10px;border:1px solid #ccc;font-size:15px}
  #motoai-send{background:var(--accent);color:#fff;border:none;border-radius:10px;padding:10px 14px;font-weight:700;cursor:pointer}
  @media(prefers-color-scheme:dark){
    #motoai-card{background:var(--dark)}
    .m-msg.bot{background:rgba(40,40,46,0.92);color:#eee}
  }`;
  document.head.appendChild(style);

  /* --- JS Logic --- */
  const $ = s=>document.querySelector(s);
  const bubble = $("#motoai-bubble");
  const overlay = $("#motoai-overlay");
  const card = $("#motoai-card");
  const input = $("#motoai-input");
  const send = $("#motoai-send");
  const body = $("#motoai-body");
  const close = $("#motoai-close");
  const clear = $("#motoai-clear");

  let chatOpen = false;

  function openChat(){
    overlay.classList.add("show");
    chatOpen = true;
    setTimeout(()=>{ input.focus(); }, 300);
  }

  function closeChat(){
    overlay.classList.remove("show");
    chatOpen = false;
  }

  bubble.addEventListener("click", openChat);
  $("#motoai-close").addEventListener("click", closeChat);
  overlay.addEventListener("click", e=>{
    if(e.target===overlay) closeChat();
  });

  clear.addEventListener("click",()=>{
    body.innerHTML='<div class="m-msg bot">🗑 Đã xóa hội thoại.</div>';
  });

  function addMsg(role,text){
    const d=document.createElement("div");
    d.className="m-msg "+role;
    d.textContent=text;
    body.appendChild(d);
    body.scrollTop=body.scrollHeight;
  }

  function sendMsg(t){
    if(!t.trim()) return;
    addMsg("user",t);
    input.value="";
    setTimeout(()=>addMsg("bot","🤖 Mình đang học nội dung này..."),400);
  }

  send.addEventListener("click",()=>sendMsg(input.value));
  input.addEventListener("keydown",e=>{
    if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMsg(input.value);}
  });

  // iOS keyboard fix
  if(window.visualViewport){
    visualViewport.addEventListener("resize",()=>{
      const off = window.innerHeight - visualViewport.height;
      card.style.transform = off>100 ? "translateY(-"+off/2+"px)" : "translateY(0)";
    });
  }
})();
