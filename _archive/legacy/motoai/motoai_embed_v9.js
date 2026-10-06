// MotoAI Embed v9.0 — Mini Floating + Smooth UI + Typing + Name-aware
(function(){
  if(window.MotoAI_EMBED_V9) return;
  window.MotoAI_EMBED_V9 = true;
  console.log("✅ MotoAI Embed v9.0 loaded");

  const CORE_URL = "https://cdn.jsdelivr.net/gh/motoopen/chothuexemayhanoi@main/motoai_core_v9.js";

  // HTML
  const html = `
  <div id="motoai-v9-root" aria-hidden="false">
    <div id="motoai-v9-bubble" role="button" aria-label="Mở MotoAI">🤖</div>

    <div id="motoai-v9-overlay" class="hidden" aria-hidden="true">
      <div id="motoai-v9-card" role="dialog" aria-modal="true">
        <div id="motoai-v9-handle" aria-hidden="true"></div>
        <header id="motoai-v9-header">
          <div class="title">MotoAI Assistant</div>
          <div class="right">
            <button id="motoai-v9-clear" title="Xóa">🗑</button>
            <button id="motoai-v9-close" title="Đóng">✕</button>
          </div>
        </header>

        <main id="motoai-v9-body">
          <div class="m-msg bot">👋 Xin chào! Mình là MotoAI — hỏi thử "Xe ga", "Xe số", "Thủ tục" nhé.</div>
        </main>

        <div id="motoai-v9-suggestions">
          <button data-q="Xe số">🏍 Xe số</button>
          <button data-q="Xe ga">🛵 Xe ga</button>
          <button data-q="Thủ tục">📄 Thủ tục</button>
        </div>

        <footer id="motoai-v9-footer">
          <input id="motoai-v9-input" placeholder="Nhập câu hỏi..." autocomplete="off" />
          <button id="motoai-v9-send">Gửi</button>
        </footer>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', html);

  // CSS
  const style = document.createElement('style');
  style.textContent = `
  :root{--m9-accent:#007aff;--m9-bg:#ffffff;--m9-dark:#1b1c1f}
  #motoai-v9-root{position:fixed;left:18px;bottom:18px;z-index:1100;pointer-events:none}
  #motoai-v9-bubble{pointer-events:auto;width:56px;height:56px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:26px;background:var(--m9-accent);color:#fff;box-shadow:0 10px 30px rgba(2,6,23,0.2);cursor:pointer;transition:transform .18s}
  #motoai-v9-bubble:hover{transform:scale(1.06)}
  /* Overlay + Card (centered horizontally, slides up) */
  #motoai-v9-overlay{position:fixed;inset:0;display:flex;align-items:flex-end;justify-content:center;padding:16px;pointer-events:none;transition:background .28s}
  #motoai-v9-overlay.visible{background:rgba(0,0,0,0.18);pointer-events:auto}
  #motoai-v9-card{width:min(920px,calc(100% - 34px));max-width:920px;height:64vh;max-height:720px;border-radius:16px 16px 8px 8px;background:var(--m9-bg);box-shadow:0 -18px 60px rgba(0,0,0,0.24);transform:translateY(20px) scale(.995);opacity:0;transition:transform .36s cubic-bezier(.2,.9,.2,1),opacity .28s}
  #motoai-v9-overlay.visible #motoai-v9-card{transform:translateY(0) scale(1);opacity:1;pointer-events:auto}
  #motoai-v9-handle{width:64px;height:6px;background:#d0d6dc;border-radius:6px;margin:10px auto}
  #motoai-v9-header{display:flex;align-items:center;justify-content:space-between;padding:6px 14px;border-bottom:1px solid rgba(0,0,0,0.06);font-weight:700;color:var(--m9-accent)}
  #motoai-v9-body{flex:1;overflow:auto;padding:12px 16px;font-size:15px;background:linear-gradient(180deg,rgba(255,255,255,0.6),rgba(255,255,255,0.8))}
  .m-msg{margin:10px 0;padding:10px 14px;border-radius:12px;max-width:84%;line-height:1.4}
  .m-msg.user{margin-left:auto;background:linear-gradient(180deg,var(--m9-accent),#00b6ff);color:#fff}
  .m-msg.bot{background:rgba(245,245,250,0.98);color:#111}
  .m-msg.typing{font-style:italic;opacity:.8}
  #motoai-v9-suggestions{display:flex;gap:8px;padding:10px 12px;border-top:1px solid rgba(0,0,0,0.04);justify-content:center}
  #motoai-v9-suggestions button{border:none;background:rgba(0,122,255,0.08);color:var(--m9-accent);padding:8px 12px;border-radius:10px;cursor:pointer}
  #motoai-v9-footer{display:flex;gap:8px;padding:10px;border-top:1px solid rgba(0,0,0,0.06)}
  #motoai-v9-input{flex:1;padding:12px;border-radius:12px;border:1px solid #d6dde6;font-size:15px}
  #motoai-v9-send{background:var(--m9-accent);color:#fff;border:none;border-radius:10px;padding:10px 14px;font-weight:700;cursor:pointer}
  #motoai-v9-clear,#motoai-v9-close{background:none;border:none;font-size:18px;cursor:pointer;padding:6px 8px}
  @media(prefers-color-scheme:dark){
    :root{--m9-bg:#151518;--m9-dark:#0f0f10}
    #motoai-v9-card{background:var(--m9-dark)}
    .m-msg.bot{background:rgba(40,40,46,0.9);color:#eee}
    #motoai-v9-suggestions button{background:rgba(10,132,255,0.08)}
    #motoai-v9-input{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);color:#eee}
  }`;
  document.head.appendChild(style);

  // DOM helpers
  const $ = s => document.querySelector(s);
  const root = $("#motoai-v9-root");
  const bubble = $("#motoai-v9-bubble");
  const overlay = $("#motoai-v9-overlay");
  const card = $("#motoai-v9-card");
  const body = $("#motoai-v9-body");
  const input = $("#motoai-v9-input");
  const send = $("#motoai-v9-send");
  const clearBtn = $("#motoai-v9-clear");
  const closeBtn = $("#motoai-v9-close");

  // Load core script dynamically
  const coreScript = document.createElement("script");
  coreScript.src = CORE_URL + "?v=" + Date.now();
  coreScript.defer = true;
  document.head.appendChild(coreScript);

  // small util
  function addMsg(role, text){
    const d = document.createElement("div");
    d.className = "m-msg " + role;
    d.textContent = text;
    body.appendChild(d);
    body.scrollTop = body.scrollHeight;
    return d;
  }

  function showTyping(){
    const t = document.createElement("div");
    t.className = "m-msg bot typing";
    t.textContent = "…";
    body.appendChild(t);
    body.scrollTop = body.scrollHeight;
    return t;
  }

  function open(){
    overlay.classList.add("visible");
    overlay.setAttribute("aria-hidden","false");
    // gesture: focus input after small delay
    setTimeout(()=>input.focus(), 300);
  }
  function close(){
    overlay.classList.remove("visible");
    overlay.setAttribute("aria-hidden","true");
    bubble.focus();
  }

  // keep bubble accessible to pointer and not blocked by quick-call area — anchored left-bottom
  bubble.addEventListener("click", ()=>{
    // toggle
    if(overlay.classList.contains("visible")) close();
    else open();
  });

  closeBtn.onclick = close;
  overlay.addEventListener("click", (e)=>{
    if(e.target === overlay) close();
  });

  clearBtn.onclick = ()=>{
    try{ if(window.MotoAI && MotoAI.clearMemory) MotoAI.clearMemory(); }catch(e){}
    body.innerHTML = '<div class="m-msg bot">🗑 Đã xóa lịch sử hội thoại.</div>';
  };

  // suggestions
  document.querySelectorAll("#motoai-v9-suggestions button").forEach(btn=>{
    btn.addEventListener("click", ()=> {
      const q = btn.dataset.q;
      input.value = q;
      send.click();
    });
  });

  // send handler
  function sendQuery(text){
    if(!text || !text.trim()) return;
    addMsg("user", text);
    input.value = "";
    const tnode = showTyping();

    // wait for core to load and expose MotoAI.ask
    const tryAsk = () => {
      if(window.MotoAI && typeof window.MotoAI.ask === "function"){
        window.MotoAI.ask(text, (answer)=>{
          tnode.remove();
          addMsg("bot", answer);
        });
      } else {
        // fallback: wait max 2s
        setTimeout(()=>{
          if(window.MotoAI && typeof window.MotoAI.ask === "function") tryAsk();
          else {
            tnode.remove();
            addMsg("bot", "🤖 Đang khởi động AI, vui lòng thử lại sau vài giây.");
          }
        }, 300);
      }
    };
    tryAsk();
  }

  send.addEventListener("click", ()=> sendQuery(input.value));
  input.addEventListener("keydown", e=>{
    if(e.key === "Enter" && !e.shiftKey){ e.preventDefault(); sendQuery(input.value); }
  });

  // when core provides username, greet
  function greetIfName(){
    try{
      if(window.MotoAI && typeof window.MotoAI.getUserName === "function"){
        const nm = MotoAI.getUserName();
        if(nm){
          const el = document.createElement("div");
          el.className = "m-msg bot";
          el.textContent = `Chào ${nm}! Mình nhớ bạn rồi.`;
          body.insertBefore(el, body.firstChild);
        }
      }
    }catch(e){}
  }

  // on core loaded
  coreScript.onload = () => {
    setTimeout(greetIfName, 500);
  };

  // small accessibility: prevent body scroll when overlay visible
  const observer = new MutationObserver(()=> {
    if(overlay.classList.contains("visible")) document.documentElement.style.overflow = "hidden";
    else document.documentElement.style.overflow = "";
  });
  observer.observe(overlay, { attributes: true, attributeFilter: ["class"] });

  // ensure bubble not covered by site quick-call: nudge left if overlap (attempt)
  function avoidQuickCall(){
    try{
      const q = document.querySelector('.quick-call-game, .quick-call, .quick-main, .quick-btn');
      if(!q) return;
      const qb = q.getBoundingClientRect();
      const winW = window.innerWidth;
      // if quick call is near left bottom and overlaps bubble area, nudge bubble up
      const bubbleEl = bubble;
      const bRect = bubbleEl.getBoundingClientRect();
      if(Math.abs(qb.left - bRect.left) < 80 || Math.abs((winW - qb.right) - (winW - bRect.right)) < 80){
        // move bubble upward safely
        root.style.bottom = (qb.height + 28) + "px";
      }
    }catch(e){}
  }
  setTimeout(avoidQuickCall, 400);
  window.addEventListener('resize', avoidQuickCall);

})();
