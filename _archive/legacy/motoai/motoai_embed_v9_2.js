// MotoAI Embed v9.2 — Adaptive (iPhone/iPad/Desktop) + iOS keyboard & rotate fixes
(function(){
  if(window.MotoAI_EMBED_V9_2) return;
  window.MotoAI_EMBED_V9_2 = true;
  console.log("✅ MotoAI Embed v9.2 loaded");

  const CORE_URL = "https://cdn.jsdelivr.net/gh/motoopen/chothuexemayhanoi@main/motoai_core_v9.js";

  /* =========================
     HTML (injected)
     ========================= */
  const html = `
  <div id="motoai-v9-root" aria-hidden="false">
    <div id="motoai-v9-bubble" role="button" aria-label="Mở MotoAI">🤖</div>

    <div id="motoai-v9-overlay" aria-hidden="true">
      <div id="motoai-v9-card" role="dialog" aria-modal="true">
        <div id="motoai-v9-handle" aria-hidden="true"></div>
        <header id="motoai-v9-header">
          <div class="title">MotoAI Assistant</div>
          <div class="right">
            <button id="motoai-v9-clear" title="Xóa">🗑</button>
            <button id="motoai-v9-close" title="Đóng">✕</button>
          </div>
        </header>

        <main id="motoai-v9-body" tabindex="0">
          <div class="m-msg bot">👋 Xin chào! Mình là MotoAI — thử hỏi "Xe ga", "Xe số" hoặc "Thủ tục".</div>
        </main>

        <div id="motoai-v9-suggestions" role="toolbar" aria-label="Gợi ý">
          <button data-q="Xe số">🏍 Xe số</button>
          <button data-q="Xe ga">🛵 Xe ga</button>
          <button data-q="Thủ tục">📄 Thủ tục</button>
        </div>

        <footer id="motoai-v9-footer">
          <input id="motoai-v9-input" placeholder="Nhập câu hỏi..." autocomplete="off" aria-label="Nhập câu hỏi"/>
          <button id="motoai-v9-send" aria-label="Gửi">Gửi</button>
        </footer>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', html);

  /* =========================
     CSS (injected)
     - uses bottom adjustments (not transform) for keyboard
     - responsive card sizing for phone/tablet/desktop
     ========================= */
  const style = document.createElement('style');
  style.textContent = `
  :root{
    --m9-accent:#007aff;
    --m9-bg:#ffffff;
    --m9-dark:#151518;
    --m9-card-max-h:720px;
    --m9-card-min-h:320px;
  }
  #motoai-v9-root{position:fixed;left:18px;bottom:18px;z-index:2147483000;pointer-events:none}
  #motoai-v9-bubble{pointer-events:auto;width:56px;height:56px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:26px;background:var(--m9-accent);color:#fff;box-shadow:0 10px 30px rgba(2,6,23,0.18);cursor:pointer;transition:transform .16s}
  #motoai-v9-bubble:hover{transform:scale(1.06)}
  /* overlay */
  #motoai-v9-overlay{position:fixed;inset:0;display:flex;align-items:flex-end;justify-content:center;padding:12px;pointer-events:none;transition:background .24s}
  #motoai-v9-overlay.visible{background:rgba(0,0,0,0.18);pointer-events:auto}
  /* card uses bottom offset via style (JS) for keyboard adjustments */
  #motoai-v9-card{
    width: min(920px, calc(100% - 40px));
    max-width: 920px;
    border-radius: 16px 16px 10px 10px;
    background: var(--m9-bg);
    box-shadow: 0 -18px 60px rgba(0,0,0,0.22);
    display:flex; flex-direction:column; overflow:hidden;
    position: relative;
    /* height controlled by JS on resize for predictable results */
    height: calc(min(80vh, var(--m9-card-max-h)));
    max-height: var(--m9-card-max-h);
    min-height: var(--m9-card-min-h);
    pointer-events:auto;
    transition: bottom .24s ease, height .22s ease, opacity .24s ease;
    bottom: 0; /* will be overridden by JS when keyboard opens */
  }
  #motoai-v9-overlay.visible #motoai-v9-card{opacity:1}
  #motoai-v9-handle{width:64px;height:6px;background:#d0d6dc;border-radius:6px;margin:8px auto}
  #motoai-v9-header{display:flex;align-items:center;justify-content:space-between;padding:8px 14px;border-bottom:1px solid rgba(0,0,0,0.06);font-weight:700;color:var(--m9-accent)}
  #motoai-v9-body{flex:1;overflow:auto;padding:12px 16px;font-size:15px;background:linear-gradient(180deg,rgba(255,255,255,0.7),rgba(255,255,255,0.9))}
  .m-msg{margin:10px 0;padding:10px 14px;border-radius:12px;max-width:86%;line-height:1.4;word-break:break-word}
  .m-msg.user{margin-left:auto;background:linear-gradient(180deg,var(--m9-accent),#00b6ff);color:#fff}
  .m-msg.bot{background:rgba(245,245,250,0.98);color:#111}
  .m-msg.typing{font-style:italic;opacity:.85}
  #motoai-v9-suggestions{display:flex;gap:8px;padding:10px 12px;border-top:1px solid rgba(0,0,0,0.04);justify-content:center;flex-wrap:wrap}
  #motoai-v9-suggestions button{border:none;background:rgba(0,122,255,0.08);color:var(--m9-accent);padding:8px 12px;border-radius:10px;cursor:pointer}
  #motoai-v9-footer{display:flex;gap:8px;padding:10px;border-top:1px solid rgba(0,0,0,0.06)}
  #motoai-v9-input{flex:1;padding:12px;border-radius:12px;border:1px solid #d6dde6;font-size:15px}
  #motoai-v9-send{background:var(--m9-accent);color:#fff;border:none;border-radius:10px;padding:10px 14px;font-weight:700;cursor:pointer}
  #motoai-v9-clear,#motoai-v9-close{background:none;border:none;font-size:18px;cursor:pointer;padding:6px 8px}
  @media (max-width:520px){
    #motoai-v9-card { width: calc(100% - 20px); border-radius:14px 14px 8px 8px; }
    #motoai-v9-body { padding:10px; }
  }
  @media (prefers-color-scheme:dark){
    :root{--m9-bg:var(--m9-dark)}
    .m-msg.bot{background:rgba(40,40,46,0.92);color:#eee}
    #motoai-v9-input{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);color:#eee}
  }`;
  document.head.appendChild(style);

  /* =========================
     DOM refs & state
     ========================= */
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
  let chatOpen = false;
  let sendLock = false;

  /* =========================
     Load core script (once)
     ========================= */
  const coreScript = document.createElement("script");
  coreScript.src = CORE_URL + "?v=" + Date.now();
  coreScript.defer = true;
  document.head.appendChild(coreScript);

  // Promise that resolves when core is ready (or after 3s fallback)
  let coreResolve;
  const coreReady = new Promise((res) => { coreResolve = res; });
  coreScript.addEventListener('load', ()=> coreResolve(true));
  setTimeout(()=> coreResolve(true), 3000);

  /* =========================
     Utilities
     ========================= */
  function addMsg(role, text){
    if(text === null || text === undefined) return null;
    const d = document.createElement("div");
    d.className = "m-msg " + role;
    d.textContent = String(text);
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

  /* =========================
     Open / Close behavior
     - ensure overlay visible state and accessibility
     ========================= */
  function openChat(){
    chatOpen = true;
    overlay.classList.add("visible");
    overlay.setAttribute("aria-hidden","false");
    // ensure card height fits current viewport
    adaptCardHeight();
    // focus input (after animation)
    setTimeout(()=> { try{ input.focus(); } catch(e){} }, 250);
    // prevent background scroll on mobile
    document.documentElement.style.overflow = "hidden";
  }

  function closeChat(force=false){
    // only close when forced (click close) or clicking overlay background
    chatOpen = false;
    overlay.classList.remove("visible");
    overlay.setAttribute("aria-hidden","true");
    document.documentElement.style.overflow = "";
    // reset bottom offset
    card.style.bottom = "";
  }

  bubble.addEventListener("click", ()=>{
    if(overlay.classList.contains("visible")) closeChat(true);
    else openChat();
  });
  closeBtn.addEventListener("click", ()=> closeChat(true));
  overlay.addEventListener("click", (e)=> { if(e.target === overlay) closeChat(true); });

  clearBtn.addEventListener("click", ()=>{
    try{ if(window.MotoAI && MotoAI.clearMemory) MotoAI.clearMemory(); }catch(e){}
    body.innerHTML = '<div class="m-msg bot">🗑 Đã xóa lịch sử hội thoại.</div>';
  });

  // suggestion buttons (call direct)
  document.querySelectorAll("#motoai-v9-suggestions button").forEach(btn=>{
    btn.addEventListener("click", (ev)=>{
      ev.preventDefault();
      const q = btn.dataset.q;
      sendQueryDirect(q);
    });
  });

  // send from input
  send.addEventListener("click", ()=> sendQueryDirect(input.value) );
  input.addEventListener("keydown", e=>{
    if(e.key === "Enter" && !e.shiftKey){ e.preventDefault(); sendQueryDirect(input.value); }
  });

  /* =========================
     Core interaction: safe single-call, queue
     ========================= */
  async function sendQueryDirect(text){
    text = (text||"").toString().trim();
    if(!text) return;
    if(sendLock) return; // prevent duplicates
    sendLock = true;
    send.disabled = true;

    addMsg("user", text);
    input.value = "";
    const typingNode = showTyping();

    await coreReady;

    // call core.ask if available
    try {
      if(window.MotoAI && typeof window.MotoAI.ask === "function"){
        // ensure only one callback per call
        let invoked = false;
        window.MotoAI.ask(text, (answer)=>{
          if(invoked) return;
          invoked = true;
          try { typingNode.remove(); } catch(e){}
          addMsg("bot", answer || "Xin lỗi, mình chưa có câu trả lời.");
          sendLock = false;
          send.disabled = false;
          // keep chat open and focus input for next message
          setTimeout(()=>{ try{ input.focus(); }catch(e){} }, 150);
        });
        // safety: if core.ask never calls back in 6s, release lock
        setTimeout(()=>{
          if(sendLock){
            try{ typingNode.remove(); }catch(e){}
            addMsg("bot", "🤖 AI chưa phản hồi — thử lại sau vài giây.");
            sendLock = false;
            send.disabled = false;
            setTimeout(()=>{ try{ input.focus(); }catch(e){} }, 150);
          }
        }, 6000);
      } else {
        // fallback
        try{ typingNode.remove(); }catch(e){}
        addMsg("bot", "🤖 AI chưa sẵn sàng — thử lại sau vài giây.");
        sendLock = false; send.disabled = false;
      }
    } catch(err){
      try{ typingNode.remove(); }catch(e){}
      addMsg("bot", "Lỗi khi gọi AI.");
      console.error(err);
      sendLock = false; send.disabled = false;
    }
  }

  /* =========================
     Responsive handling:
     - adaptCardHeight() updates card height per viewport & device
     - handle visualViewport to adjust bottom offset (keyboard)
     - orientation & resize events
     ========================= */
  function adaptCardHeight(){
    try {
      const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
      const vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
      // On desktop/tablet we want a shorter card relative to width
      let height;
      if(vw >= 900){ // desktop
        height = Math.min(720, Math.max(400, vh * 0.6));
      } else if(vw >= 700){ // tablet
        height = Math.min(760, Math.max(420, vh * 0.68));
      } else { // phone
        // phone: prefer 70-78vh but cap to max height variable
        height = Math.min(parseInt(getComputedStyle(document.documentElement).getPropertyValue('--m9-card-max-h')) || 720, Math.max(320, Math.round(vh * 0.78)));
      }
      card.style.height = height + "px";
      card.style.maxHeight = (Math.min(height, 900)) + "px";
    } catch(e){ console.warn("adaptCardHeight error", e); }
  }

  // visual viewport handler (keyboard appearance) — use bottom offset, not transform
  function attachVisualViewportHandler(){
    if(window.visualViewport){
      let lastOffset = 0;
      visualViewport.addEventListener('resize', ()=>{
        try{
          const offset = Math.max(0, window.innerHeight - visualViewport.height);
          // threshold to avoid jitter
          if(Math.abs(offset - lastOffset) < 6) return;
          lastOffset = offset;
          if(offset > 120){
            // keyboard open -> lift card up by setting bottom style
            card.style.bottom = (offset - (window.navigator.userAgent.includes('iPhone') ? 4 : 0)) + "px";
          } else {
            // keyboard closed
            card.style.bottom = "";
          }
        } catch(e){ /* ignore */ }
      });
    } else {
      // fallback for browsers without visualViewport
      window.addEventListener('resize', ()=> {
        card.style.bottom = "";
      });
    }
  }

  // orientation change & resize: recalc card height and reset bottom
  function attachResizeHandlers(){
    window.addEventListener('orientationchange', ()=> {
      setTimeout(()=>{ adaptCardHeight(); card.style.bottom = ""; }, 260);
    });
    window.addEventListener('resize', ()=> {
      // small debounce
      clearTimeout(window._m9_resize_timer);
      window._m9_resize_timer = setTimeout(()=>{ adaptCardHeight(); card.style.bottom = ""; }, 160);
    });
  }

  // avoid overlapping with site quick call elements by nudging bubble left/right/up
  function avoidQuickCallOverlap(){
    try{
      const quick = document.querySelector('.quick-call-game, .quick-call, .quick-main, .quick-btn');
      if(!quick) return;
      const qRect = quick.getBoundingClientRect();
      const bRect = bubble.getBoundingClientRect();
      const winW = window.innerWidth;
      // if quick overlaps bubble area, nudge bubble horizontally or vertically
      if(Math.abs(qRect.left - bRect.left) < 70 || Math.abs(qRect.right - bRect.right) < 70){
        // move bubble to a safe vertical offset
        const extra = qRect.height + 24;
        root.style.bottom = extra + "px";
      } else {
        root.style.bottom = "18px";
      }
    }catch(e){}
  }

  /* =========================
     Init sequence
     ========================= */
  function init(){
    adaptCardHeight();
    attachVisualViewportHandler();
    attachResizeHandlers();
    avoidQuickCallOverlap();
    // try greet if core already loaded
    coreScript.onload = ()=> {
      setTimeout(()=>{
        try{
          if(window.MotoAI && typeof MotoAI.getUserName === "function"){
            const nm = MotoAI.getUserName();
            if(nm) addMsg("bot", `Chào ${nm}! Mình nhớ bạn rồi 😊`);
          }
        }catch(e){}
      }, 500);
    };
    // ensure periodic quick-call avoidance
    setInterval(avoidQuickCallOverlap, 1400);
  }

  // run init after short delay so DOM stabilizes
  setTimeout(init, 180);

  // expose a small debug API
  window.MotoAI_EMBED_V9_2 = {
    open: openChat,
    close: ()=> closeChat(true),
    adapt: adaptCardHeight
  };

})();
