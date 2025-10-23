// MotoAI Embed v9.3 — Adaptive fix (no auto-open, stable close behavior)
(function(){
  if(window.MotoAI_EMBED_V9_3) return;
  window.MotoAI_EMBED_V9_3 = true;
  console.log("✅ MotoAI Embed v9.3 loaded (Adaptive, fixed auto-open)");

  const CORE_URL = "https://cdn.jsdelivr.net/gh/motoopen/chothuexemayhanoi@main/motoai_core_v9.js";

  const html = `
  <div id="motoai-v9-root">
    <div id="motoai-v9-bubble" aria-label="Mở MotoAI" role="button">🤖</div>
    <div id="motoai-v9-overlay" aria-hidden="true">
      <div id="motoai-v9-card" role="dialog" aria-modal="true">
        <div id="motoai-v9-handle"></div>
        <header id="motoai-v9-header">
          <div class="title">MotoAI Assistant</div>
          <div class="right">
            <button id="motoai-v9-clear" title="Xóa">🗑</button>
            <button id="motoai-v9-close" title="Đóng">✕</button>
          </div>
        </header>
        <main id="motoai-v9-body">
          <div class="m-msg bot">👋 Xin chào! Mình là MotoAI — hỏi "Xe ga", "Xe số" hoặc "Thủ tục".</div>
        </main>
        <div id="motoai-v9-suggestions">
          <button data-q="Xe số">🏍 Xe số</button>
          <button data-q="Xe ga">🛵 Xe ga</button>
          <button data-q="Thủ tục">📄 Thủ tục</button>
        </div>
        <footer id="motoai-v9-footer">
          <input id="motoai-v9-input" placeholder="Nhập câu hỏi..." autocomplete="off"/>
          <button id="motoai-v9-send">Gửi</button>
        </footer>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', html);

  const style = document.createElement('style');
  style.textContent = `
  #motoai-v9-root{position:fixed;left:18px;bottom:18px;z-index:2147483000;pointer-events:none}
  #motoai-v9-bubble{pointer-events:auto;width:56px;height:56px;border-radius:14px;background:#007aff;color:#fff;font-size:26px;display:flex;align-items:center;justify-content:center;box-shadow:0 10px 25px rgba(0,0,0,.2);cursor:pointer;transition:transform .2s}
  #motoai-v9-bubble:hover{transform:scale(1.08)}
  #motoai-v9-overlay{position:fixed;inset:0;display:flex;align-items:flex-end;justify-content:center;background:rgba(0,0,0,0);pointer-events:none;transition:background .3s ease;z-index:2147482999}
  #motoai-v9-overlay.visible{background:rgba(0,0,0,0.2);pointer-events:auto}
  #motoai-v9-card{width:min(920px,calc(100% - 32px));max-width:900px;border-radius:16px 16px 0 0;background:#fff;box-shadow:0 -18px 50px rgba(0,0,0,.2);overflow:hidden;display:flex;flex-direction:column;position:relative;bottom:0;transition:bottom .25s,height .25s}
  #motoai-v9-handle{width:60px;height:6px;background:#ccc;border-radius:6px;margin:8px auto}
  #motoai-v9-header{display:flex;align-items:center;justify-content:space-between;padding:8px 14px;border-bottom:1px solid rgba(0,0,0,0.08);color:#007aff;font-weight:700}
  #motoai-v9-body{flex:1;overflow:auto;padding:10px 14px;background:#fafafa}
  .m-msg{margin:8px 0;padding:10px 12px;border-radius:12px;max-width:84%;line-height:1.4;word-wrap:break-word}
  .m-msg.user{background:linear-gradient(180deg,#007aff,#00b6ff);color:#fff;margin-left:auto}
  .m-msg.bot{background:rgba(240,240,245,0.95);color:#111}
  #motoai-v9-suggestions{display:flex;gap:6px;justify-content:center;padding:8px;border-top:1px solid rgba(0,0,0,0.05)}
  #motoai-v9-suggestions button{border:none;background:rgba(0,122,255,0.1);color:#007aff;padding:8px 12px;border-radius:10px;cursor:pointer}
  #motoai-v9-footer{display:flex;gap:8px;padding:10px;border-top:1px solid rgba(0,0,0,0.06)}
  #motoai-v9-input{flex:1;padding:10px;border-radius:10px;border:1px solid #ccc;font-size:15px}
  #motoai-v9-send{background:#007aff;color:#fff;border:none;border-radius:10px;padding:10px 14px;font-weight:700;cursor:pointer}
  @media(prefers-color-scheme:dark){
    #motoai-v9-card{background:#1b1c1e}
    .m-msg.bot{background:rgba(40,40,46,0.9);color:#eee}
  }`;
  document.head.appendChild(style);

  const $ = s=>document.querySelector(s);
  const bubble = $("#motoai-v9-bubble");
  const overlay = $("#motoai-v9-overlay");
  const card = $("#motoai-v9-card");
  const input = $("#motoai-v9-input");
  const send = $("#motoai-v9-send");
  const body = $("#motoai-v9-body");
  const close = $("#motoai-v9-close");
  const clear = $("#motoai-v9-clear");

  let isOpen = false;

  function openChat(){
    if(isOpen) return;
    overlay.classList.add("visible");
    isOpen = true;
    setTimeout(()=>input.focus(),250);
    document.documentElement.style.overflow="hidden";
  }

  function closeChat(){
    overlay.classList.remove("visible");
    isOpen = false;
    document.documentElement.style.overflow="";
    card.style.bottom = "0";
  }

  bubble.addEventListener("click", openChat);
  $("#motoai-v9-close").addEventListener("click", closeChat);
  overlay.addEventListener("click", e=>{
    if(e.target === overlay) closeChat();
  });

  clear.addEventListener("click",()=>{
    body.innerHTML = '<div class="m-msg bot">🗑 Đã xóa cuộc trò chuyện.</div>';
  });

  function addMsg(role,text){
    const d=document.createElement('div');
    d.className='m-msg '+role;
    d.textContent=text;
    body.appendChild(d);
    body.scrollTop=body.scrollHeight;
  }

  send.addEventListener("click",()=>{
    const val=input.value.trim();
    if(!val) return;
    addMsg("user",val);
    input.value="";
    setTimeout(()=>addMsg("bot","🤖 Mình đang học từ nội dung trang này..."),400);
  });

  // keyboard & rotate fix
  if(window.visualViewport){
    visualViewport.addEventListener("resize",()=>{
      const offset = window.innerHeight - visualViewport.height;
      card.style.bottom = offset>80 ? offset+"px":"0";
    });
  }

  window.addEventListener("resize",()=>{
    card.style.bottom="0";
  });
})();
