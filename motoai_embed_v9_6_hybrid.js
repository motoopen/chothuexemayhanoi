// MotoAI v9.6 — Hybrid Stable (keep bubble left) 
// - Stable engine (keyword match like v8)
// - Lightweight local corpus (from <main> & <section> only)
// - Memory: remembers user name (localStorage)
// - Auto-avoid Quick Call / TOC near bubble (adjust bottom/left)
// - iOS visualViewport keyboard fix using bottom offset (not transform)
// - No auto-open on load; open only on bubble click
// - Send-lock to prevent duplicate sends
(function () {
  if (window.MotoAI_9_6_HYBRID_LOADED) return;
  window.MotoAI_9_6_HYBRID_LOADED = true;
  console.log("✅ MotoAI v9.6 Hybrid Stable (left bubble) loaded");

  /* -------------------------
     Inject HTML
     -------------------------*/
  const html = `
  <div id="motoai-root" aria-hidden="false">
    <div id="motoai-bubble" role="button" aria-label="Mở MotoAI">🤖</div>

    <div id="motoai-overlay" aria-hidden="true">
      <div id="motoai-card" role="dialog" aria-modal="true" aria-hidden="true">
        <div id="motoai-handle" aria-hidden="true"></div>

        <header id="motoai-header">
          <div class="title">MotoAI Assistant</div>
          <div class="tools">
            <button id="motoai-clear" title="Xóa hội thoại">🗑</button>
            <button id="motoai-close" title="Đóng">✕</button>
          </div>
        </header>

        <main id="motoai-body" tabindex="0" role="log" aria-live="polite">
          <div class="m-msg bot">👋 Xin chào! Mình là MotoAI — thử hỏi "Xe ga", "Xe số" hoặc "Thủ tục".</div>
        </main>

        <div id="motoai-suggestions" role="toolbar" aria-label="Gợi ý nhanh">
          <button data-q="Xe số">🏍 Xe số</button>
          <button data-q="Xe ga">🛵 Xe ga</button>
          <button data-q="Thủ tục">📄 Thủ tục</button>
        </div>

        <footer id="motoai-footer">
          <input id="motoai-input" placeholder="Nhập câu hỏi..." autocomplete="off" aria-label="Nhập câu hỏi"/>
          <button id="motoai-send" aria-label="Gửi">Gửi</button>
        </footer>
      </div>
    </div>
  </div>
  `;
  document.body.insertAdjacentHTML("beforeend", html);

  /* -------------------------
     Inject CSS
     -------------------------*/
  const css = `
  :root{
    --m96-accent: #007aff;
    --m96-card-bg: #ffffff;
    --m96-card-bg-dark: #151518;
  }
  /* Root / bubble (left) */
  #motoai-root { position: fixed; left: 18px; bottom: 18px; z-index: 2147483000; pointer-events: none; }
  #motoai-bubble {
    pointer-events: auto;
    width: 56px; height: 56px; border-radius: 14px;
    display:flex; align-items:center; justify-content:center;
    font-size:26px; background:var(--m96-accent); color:#fff;
    box-shadow: 0 10px 28px rgba(2,6,23,0.18); cursor:pointer; transition: transform .16s;
  }
  #motoai-bubble:hover { transform: scale(1.06); }

  /* overlay */
  #motoai-overlay {
    position: fixed; inset: 0; display:flex; align-items:flex-end; justify-content:center;
    padding: 12px; pointer-events: none; transition: background .24s ease; z-index: 2147482999;
  }
  #motoai-overlay.visible { background: rgba(0,0,0,0.18); pointer-events: auto; }

  /* card */
  #motoai-card {
    width: min(920px, calc(100% - 36px));
    max-width: 920px;
    border-radius: 16px 16px 8px 8px;
    background: var(--m96-card-bg);
    box-shadow: 0 -18px 60px rgba(0,0,0,0.22);
    display:flex; flex-direction:column; overflow:hidden;
    position: relative;
    height: 72vh; max-height: 760px; min-height: 320px;
    pointer-events: auto;
    transform: translateY(110%); opacity: 0;
    transition: transform .36s cubic-bezier(.2,.9,.2,1), opacity .28s ease, bottom .18s;
    bottom: 0;
  }
  #motoai-overlay.visible #motoai-card { transform: translateY(0); opacity: 1; }

  #motoai-handle { width: 64px; height:6px; background:#d0d6dc; border-radius:6px; margin:10px auto; }

  #motoai-header { display:flex; align-items:center; justify-content:space-between; padding:8px 14px; font-weight:700; color:var(--m96-accent); border-bottom:1px solid rgba(0,0,0,0.06); }
  #motoai-header .tools button { background:none; border:none; font-size:18px; cursor:pointer; padding:6px 8px; }

  #motoai-body { flex:1; overflow:auto; padding:12px 16px; font-size:15px; background: linear-gradient(180deg, rgba(255,255,255,0.7), rgba(255,255,255,0.9)); }
  .m-msg { margin: 8px 0; padding: 10px 12px; border-radius: 12px; max-width:86%; line-height:1.4; word-break:break-word; }
  .m-msg.bot { background: rgba(245,245,250,0.98); color:#111; }
  .m-msg.user { margin-left:auto; background: linear-gradient(180deg,var(--m96-accent), #00b6ff); color:#fff; }

  #motoai-suggestions { display:flex; gap:8px; padding:10px 12px; border-top:1px solid rgba(0,0,0,0.04); justify-content:center; flex-wrap:wrap; }
  #motoai-suggestions button { border:none; background: rgba(0,122,255,0.08); color:var(--m96-accent); padding:8px 12px; border-radius:10px; cursor:pointer; }

  #motoai-footer { display:flex; gap:8px; padding:10px; border-top:1px solid rgba(0,0,0,0.06); }
  #motoai-input { flex:1; padding:12px; border-radius:12px; border:1px solid #d6dde6; font-size:15px; }
  #motoai-send { background:var(--m96-accent); color:#fff; border:none; border-radius:10px; padding:10px 14px; cursor:pointer; font-weight:700; }

  @media (max-width:520px) {
    #motoai-card { width: calc(100% - 20px); height: 78vh; border-radius: 14px 14px 8px 8px; }
    #motoai-body { padding: 10px; }
  }

  @media (prefers-color-scheme:dark) {
    :root { --m96-card-bg: var(--m96-card-bg-dark); }
    .m-msg.bot { background: rgba(40,40,50,0.9); color: #eee; }
    #motoai-input { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); color: #eee; }
  }
  `;
  const styleNode = document.createElement("style");
  styleNode.textContent = css;
  document.head.appendChild(styleNode);

  /* -------------------------
     DOM refs & state
     -------------------------*/
  const $ = s => document.querySelector(s);
  const root = $("#motoai-root");
  const bubble = $("#motoai-bubble");
  const overlay = $("#motoai-overlay");
  const card = $("#motoai-card");
  const bodyEl = $("#motoai-body");
  const inputEl = $("#motoai-input");
  const sendBtn = $("#motoai-send");
  const closeBtn = $("#motoai-close");
  const clearBtn = $("#motoai-clear");
  const suggestionBtns = document.querySelectorAll("#motoai-suggestions button");

  let isOpen = false;
  let sendLock = false;
  let corpus = []; // array of {text, id}

  /* -------------------------
     Lightweight corpus builder
     - only from <main> and <section> to limit size and avoid heavy pages
     -------------------------*/
  function buildCorpus() {
    try {
      let nodes = Array.from(document.querySelectorAll("main, section, article"));
      if (!nodes.length) nodes = [document.body];
      const texts = nodes.map(n => n.innerText || n.textContent || "").join("\n");
      const chunks = texts
        .replace(/\r/g, " ")
        .split(/[\n\.!\?]+/)
        .map(s => s.trim())
        .filter(s => s.length >= 24);
      corpus = chunks.map((t, i) => ({ id: i, text: t }));
      // keep a cap to avoid heavy compute
      if (corpus.length > 200) corpus = corpus.slice(0, 200);
    } catch (e) {
      corpus = [];
    }
  }

  /* -------------------------
     Simple retrieval: word-overlap scoring (fast & light)
     -------------------------*/
  function retrieveAnswer(query) {
    if (!query || !corpus.length) return null;
    const qWords = query.toLowerCase().split(/\s+/).filter(Boolean);
    let best = { score: 0, text: null };
    for (const c of corpus) {
      const cw = c.text.toLowerCase();
      let score = 0;
      for (const w of qWords) {
        if (w.length < 3) continue;
        if (cw.includes(w)) score += 1;
      }
      // small boost for exact substring
      if (cw.includes(query.toLowerCase())) score += 0.8;
      if (score > best.score) best = { score, text: c.text };
    }
    return best.score > 0 ? best.text : null;
  }

  /* -------------------------
     Memory: remember user name (localStorage)
     - Detect Vietnamese patterns: "tôi tên là X", "tên tôi là X", "mình tên X"
     -------------------------*/
  const MEM_KEY = "motoai_user_v9_name";
  function setUserName(name) {
    try { localStorage.setItem(MEM_KEY, name); } catch (e) {}
  }
  function getUserName() {
    try { return localStorage.getItem(MEM_KEY); } catch (e) { return null; }
  }
  function detectAndSaveName(text) {
    if (!text) return null;
    const s = text.replace(/\s+/g, " ").trim();
    // simple patterns
    const patterns = [
      /(?:tôi tên là|tên tôi là|mình tên là)\s+([A-Za-z\u00C0-\u017F\u0100-\u024F0-9_\- ]{2,40})/i,
      /(?:tôi là|mình là)\s+([A-Za-z\u00C0-\u017F\u0100-\u024F0-9_\- ]{2,40})/i
    ];
    for (const p of patterns) {
      const m = s.match(p);
      if (m && m[1]) {
        const name = m[1].trim();
        setUserName(name);
        return name;
      }
    }
    return null;
  }

  /* -------------------------
     UI helpers
     -------------------------*/
  function addMsg(role, text) {
    if (text === null || text === undefined) return null;
    const d = document.createElement("div");
    d.className = "m-msg " + role;
    d.textContent = String(text);
    bodyEl.appendChild(d);
    bodyEl.scrollTop = bodyEl.scrollHeight;
    return d;
  }

  function showTyping() {
    const t = document.createElement("div");
    t.className = "m-msg bot typing";
    t.textContent = "…";
    bodyEl.appendChild(t);
    bodyEl.scrollTop = bodyEl.scrollHeight;
    return t;
  }

  /* -------------------------
     Open / Close logic
     -------------------------*/
  function openChat() {
    if (isOpen) return;
    overlay.classList.add("visible");
    card.setAttribute("aria-hidden", "false");
    overlay.setAttribute("aria-hidden", "false");
    isOpen = true;
    // greet if name stored
    const nm = getUserName();
    if (nm) {
      setTimeout(() => addMsg("bot", `Chào ${nm}! Mình nhớ bạn rồi 😊`), 450);
    }
    adaptCardHeight();
    // focus after animation
    setTimeout(() => {
      try { inputEl.focus(); } catch (e) {}
    }, 300);
    // lock body scroll
    document.documentElement.style.overflow = "hidden";
  }

  function closeChat() {
    if (!isOpen) return;
    overlay.classList.remove("visible");
    card.setAttribute("aria-hidden", "true");
    overlay.setAttribute("aria-hidden", "true");
    isOpen = false;
    card.style.bottom = "";
    // restore body scroll
    document.documentElement.style.overflow = "";
  }

  /* -------------------------
     Send logic (single-source, no duplicates)
     -------------------------*/
  async function sendQuery(text) {
    if (!text || !text.trim()) return;
    if (sendLock) return;
    sendLock = true;
    sendBtn.disabled = true;

    // user message
    addMsg("user", text);
    // detect name
    const name = detectAndSaveName(text);
    if (name) {
      // immediate feedback
      addMsg("bot", `Đã nhớ tên: ${name} ✨`);
      sendLock = false;
      sendBtn.disabled = false;
      setTimeout(() => { try { inputEl.focus(); } catch (e) {} }, 120);
      return;
    }

    // show typing
    const typingNode = showTyping();

    // retrieval from local corpus (lightweight)
    // small delay to simulate thinking
    setTimeout(() => {
      try {
        const ans = retrieveAnswer(text);
        typingNode.remove();
        if (ans) {
          addMsg("bot", ans);
        } else {
          // fallback polite answer
          addMsg("bot", "Xin lỗi, mình chưa tìm thấy nội dung phù hợp trên trang này. Hỏi thử câu khác nhé.");
        }
      } catch (e) {
        try { typingNode.remove(); } catch (e2) {}
        addMsg("bot", "Lỗi khi xử lý câu trả lời.");
        console.error(e);
      } finally {
        sendLock = false;
        sendBtn.disabled = false;
        setTimeout(() => { try { inputEl.focus(); } catch (e) {} }, 150);
      }
    }, 360); // small latency
  }

  /* -------------------------
     Suggestion buttons -> direct send
     -------------------------*/
  suggestionBtns.forEach(b => {
    b.addEventListener("click", (ev) => {
      ev.preventDefault();
      const q = b.dataset.q;
      // ensure chat is open
      if (!isOpen) openChat();
      // send directly
      sendQuery(q);
    });
  });

  /* -------------------------
     Bind UI events
     -------------------------*/
  bubble.addEventListener("click", () => {
    // if Quick Call overlapped and we nudged bubble, clicking should still open chat
    if (!isOpen) {
      buildCorpus(); // refresh corpus when opening to capture current page
      openChat();
    } else {
      // toggle close if already open
      closeChat();
    }
  });

  closeBtn.addEventListener("click", closeChat);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) closeChat(); });

  clearBtn.addEventListener("click", () => {
    bodyEl.innerHTML = '<div class="m-msg bot">🗑 Đã xóa cuộc trò chuyện.</div>';
    try { localStorage.removeItem(MEM_KEY); } catch (e) {}
  });

  sendBtn.addEventListener("click", () => {
    const v = inputEl.value || "";
    inputEl.value = "";
    sendQuery(v);
  });
  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const v = inputEl.value || "";
      inputEl.value = "";
      sendQuery(v);
    }
  });

  /* -------------------------
     Adaptive sizing & iOS keyboard fix
     -------------------------*/
  function adaptCardHeight() {
    try {
      const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
      const vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
      let h;
      if (vw >= 900) { // desktop
        h = Math.min(720, Math.max(420, Math.round(vh * 0.6)));
      } else if (vw >= 700) { // tablet
        h = Math.min(760, Math.max(420, Math.round(vh * 0.68)));
      } else { // phone
        h = Math.min(760, Math.max(320, Math.round(vh * 0.78)));
      }
      card.style.height = h + "px";
    } catch (e) { /* ignore */ }
  }

  function attachVisualViewportHandler() {
    if (window.visualViewport) {
      let last = 0;
      visualViewport.addEventListener("resize", () => {
        try {
          const offset = Math.max(0, window.innerHeight - visualViewport.height);
          // threshold
          if (Math.abs(offset - last) < 6) return;
          last = offset;
          if (offset > 120) {
            // keyboard open: shift card up by bottom offset (keeps card visible)
            card.style.bottom = (offset - (navigator.userAgent.includes("iPhone") ? 4 : 0)) + "px";
          } else {
            card.style.bottom = "";
          }
        } catch (e) {}
      });
    } else {
      window.addEventListener("resize", () => { card.style.bottom = ""; });
    }
  }

  window.addEventListener("orientationchange", () => { setTimeout(adaptCardHeight, 220); });
  window.addEventListener("resize", () => { clearTimeout(window._m96_r); window._m96_r = setTimeout(() => { adaptCardHeight(); }, 160); });

  /* -------------------------
     Auto-avoid Quick Call / TOC (bubble left)
     - detect typical selectors and nudge root bottom/left
     -------------------------*/
  function avoidOverlapWithSite() {
    try {
      // selectors to check (common quick-call / toc classes/ids)
      const selectors = [".quick-call-game", ".quick-call", ".quick-main", "#toc", ".toc", ".table-of-contents"];
      const found = selectors.map(s => document.querySelector(s)).filter(Boolean);
      if (!found.length) {
        root.style.left = "18px";
        root.style.bottom = "18px";
        return;
      }
      // If any element sits near bottom-left area (within 120px from left and 160px from bottom), nudge bubble right/up
      let needRight = false;
      let maxHeight = 0;
      found.forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.left < 140 && (window.innerHeight - r.bottom) < 200) {
          needRight = true;
        }
        maxHeight = Math.max(maxHeight, r.height || 0);
      });
      if (needRight) {
        // move bubble to avoid overlap: shift left position and bottom
        root.style.left = (Math.min(140, Math.max(60, 18 + Math.round(maxHeight * 0.6)))) + "px";
        root.style.bottom = (18 + Math.round(maxHeight * 0.5)) + "px";
      } else {
        root.style.left = "18px";
        root.style.bottom = "18px";
      }
    } catch (e) { /* ignore */ }
  }

  // run periodically while page active
  setInterval(avoidOverlapWithSite, 1400);
  // also run on load/resize
  setTimeout(avoidOverlapWithSite, 220);
  window.addEventListener("resize", () => { setTimeout(avoidOverlapWithSite, 260); });

  /* -------------------------
     Init
     -------------------------*/
  function init() {
    buildCorpus();          // lightweight corpus
    adaptCardHeight();      // set initial size
    attachVisualViewportHandler();
    // greet with memory only when user opens (not auto)
    // don't auto-open
  }

  // Kick off
  setTimeout(init, 160);

  /* -------------------------
     Expose small API for debug if needed
     -------------------------*/
  window.MotoAI_9_6 = {
    open: openChat,
    close: closeChat,
    getName: getUserName,
    rebuildCorpus: buildCorpus
  };

})();
