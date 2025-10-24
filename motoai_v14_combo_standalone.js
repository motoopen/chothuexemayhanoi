/* ============================================================
  MotoAI v14 Combo Standalone — FULL (Part 1/3)
  Phần 1: BOOT + SAFE UI INJECTION + HELPERS
  LƯU Ý: KHÔNG đóng IIFE ở cuối phần này. Part 2 & Part 3 nối tiếp.
============================================================ */
(function(){

  // guard: tránh load 2 lần
  if (window.MotoAI_v14_COMBO_LOADED) {
    console.log('MotoAI v14 Combo already loaded.');
    return;
  }
  window.MotoAI_v14_COMBO_LOADED = true;
  console.log('%c🚀 MotoAI v14 Combo — PART 1/3 initializing...', 'color:#0a84ff;font-weight:bold;');

  /* ---------- CONFIG ---------- */
  const CFG = {
    uiZIndex: 9999999,
    maxCorpusSentences: 1200,
    minSentenceLength: 18,
    memoryKeyName: 'MotoAI_v14_user_name',
    corpusKey: 'MotoAI_v14_corpus',
    sessionKey: 'MotoAI_v14_session_msgs',
    sitemapPath: '/moto_sitemap.json',
    learnIntervalMs: 72 * 60 * 60 * 1000, // 72 hours
    relatedSites: [
      "https://motoopen.github.io/chothuexemayhanoi/",
      "https://motoopen.github.io/",
      "https://motoai.motoopen.vn/"
    ],
    suggestionTags: [
      { q: 'Xe số', label: '🏍 Xe số' },
      { q: 'Xe ga', label: '🛵 Xe ga' },
      { q: 'Thủ tục', label: '📄 Thủ tục' },
      { q: 'Xe 50cc', label: '🚲 Xe 50cc' },
      { q: 'Liên hệ 0857255868', label: '☎️ Liên hệ' }
    ]
  };

  /* ---------- GLOBAL STATE & API ---------- */
  window.MotoAI_v14 = window.MotoAI_v14 || {};
  window.MotoAI_v14_state = {
    isOpen: false,
    sendLock: false,
    corpus: [],
    sessionMsgs: []
  };

  // expose config
  window.MotoAI_v14.cfg = CFG;

  /* ---------- SAFE UI HTML ---------- */
  const UI_HTML = `
  <div id="motoai-root" aria-hidden="false" style="display:none" data-motoai="v14">
    <div id="motoai-bubble" role="button" aria-label="Mở MotoAI">🤖</div>
    <div id="motoai-overlay" aria-hidden="true">
      <div id="motoai-card" role="dialog" aria-modal="true" aria-hidden="true">
        <div id="motoai-handle" aria-hidden="true"></div>
        <header id="motoai-header">
          <div class="title">MotoAI Assistant</div>
          <div class="tools">
            <button id="motoai-clear" title="Xóa cuộc trò chuyện">🗑</button>
            <button id="motoai-close" title="Đóng">✕</button>
          </div>
        </header>
        <main id="motoai-body" tabindex="0" role="log" aria-live="polite"></main>
        <div id="motoai-suggestions" role="toolbar" aria-label="Gợi ý nhanh"></div>
        <footer id="motoai-footer">
          <div id="motoai-typing" aria-hidden="true"></div>
          <input id="motoai-input" placeholder="Nhập câu hỏi..." autocomplete="off" aria-label="Nhập câu hỏi" />
          <button id="motoai-send" aria-label="Gửi">Gửi</button>
        </footer>
      </div>
    </div>
  </div>`;

  /* ---------- SAFE UI CSS ---------- */
  const UI_CSS = `
  :root{
    --m14-accent:#0a84ff;
    --m14-card-bg:#f5f7fa;
    --m14-card-bg-dark:#0b0c0e;
    --m14-radius:16px;
    --m14-blur: blur(10px) saturate(125%);
    --m14-footer-bg: rgba(255,255,255,0.82);
    --m14-text:#111;
    --m14-bg:#ffffff;
  }
  #motoai-root{position:fixed;left:18px;bottom:22px;z-index:${CFG.uiZIndex};pointer-events:none;font-family:-apple-system,Inter,system-ui,Roboto,"Helvetica Neue",Arial}
  #motoai-bubble{pointer-events:auto;width:56px;height:56px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:26px;background:var(--m14-accent);color:#fff;box-shadow:0 8px 28px rgba(2,6,23,0.35);cursor:pointer;transition:transform .14s}
  #motoai-bubble:hover{transform:scale(1.06)}
  #motoai-overlay{position:fixed;inset:0;display:flex;align-items:flex-end;justify-content:center;padding:12px;pointer-events:none;transition:background .22s ease;z-index:${CFG.uiZIndex-1}}
  #motoai-overlay.visible{background:rgba(0,0,0,0.36);pointer-events:auto}
  #motoai-card{width:min(920px,calc(100% - 40px));max-width:920px;border-radius:var(--m14-radius) var(--m14-radius) 10px 10px;height:72vh;max-height:760px;min-height:300px;background:var(--m14-card-bg);backdrop-filter:var(--m14-blur);box-shadow:0 -18px 60px rgba(0,0,0,0.28);display:flex;flex-direction:column;overflow:hidden;transform:translateY(110%);opacity:0;pointer-events:auto;transition:transform .36s cubic-bezier(.2,.9,.2,1),opacity .28s;color:var(--m14-text)}
  #motoai-overlay.visible #motoai-card{transform:translateY(0);opacity:1}
  #motoai-handle{width:64px;height:6px;background:rgba(160,160,160,0.6);border-radius:6px;margin:10px auto}
  #motoai-header{display:flex;align-items:center;justify-content:space-between;padding:8px 14px;font-weight:700;color:var(--m14-accent);border-bottom:1px solid rgba(0,0,0,0.06)}
  #motoai-header .tools button{background:none;border:none;font-size:18px;cursor:pointer;padding:6px 8px;color:var(--m14-text)}
  #motoai-body{flex:1;overflow:auto;padding:12px 16px;font-size:15px;background:transparent}
  .m-msg{margin:8px 0;padding:12px 14px;border-radius:16px;max-width:86%;line-height:1.4;word-break:break-word;box-shadow:0 6px 18px rgba(2,6,23,0.08)}
  .m-msg.bot{background:rgba(255,255,255,0.92);color:#111}
  .m-msg.user{background:linear-gradient(180deg,var(--m14-accent),#0066d9);color:#fff;margin-left:auto;box-shadow:0 8px 26px rgba(10,132,255,0.15)}
  #motoai-suggestions{display:flex;gap:8px;justify-content:center;padding:8px 12px;border-top:1px solid rgba(0,0,0,0.04);flex-wrap:wrap;background:rgba(255,255,255,0.62);backdrop-filter:blur(8px)}
  #motoai-suggestions button{border:none;background:rgba(0,122,255,0.08);color:var(--m14-accent);padding:8px 12px;border-radius:12px;cursor:pointer;font-weight:600}
  #motoai-footer{display:flex;align-items:center;justify-content:center;gap:8px;padding:10px;border-top:1px solid rgba(0,0,0,0.06);background:var(--m14-footer-bg);backdrop-filter:blur(8px)}
  #motoai-input{flex:1;padding:10px 12px;border-radius:12px;border:1px solid rgba(0,0,0,0.08);font-size:15px;background:var(--m14-bg);color:var(--m14-text)}
  #motoai-send{background:var(--m14-accent);color:#fff;border:none;border-radius:12px;padding:10px 16px;cursor:pointer;flex-shrink:0;transition:transform .18s}
  #motoai-send:hover{transform:scale(1.06)}
  @media (prefers-color-scheme:dark){
    :root{--m14-card-bg:var(--m14-card-bg-dark);--m14-footer-bg:rgba(16,16,18,0.9);--m14-text:#f2f2f7}
    .m-msg.bot{background:rgba(35,37,39,0.9);color:var(--m14-text)}
    .m-msg.user{background:linear-gradient(180deg,#0a84ff,#0071e3)}
    #motoai-suggestions{background:rgba(20,20,22,0.9)}
    #motoai-header .tools button{color:var(--m14-text)}
  }
  @media (max-width:520px){
    #motoai-card{width:calc(100% - 24px);height:78vh;min-height:260px}
    #motoai-bubble{width:50px;height:50px;font-size:24px;border-radius:12px}
  }
  /* Force visible helpers (in case host site hides things) */
  #motoai-root,#motoai-bubble,#motoai-overlay,#motoai-card{visibility:visible!important}
  `;

  /* ---------- Safe inject (DOM ready) ---------- */
  function safeInjectUI(){
    try{
      if(document.getElementById('motoai-root')) return; // already injected
      if(!document.body || !document.head){
        console.warn('MotoAI v14: DOM not ready for UI injection.');
        return;
      }
      document.body.insertAdjacentHTML('beforeend', UI_HTML);
      const styleEl = document.createElement('style');
      styleEl.setAttribute('data-motoai','v14-style');
      styleEl.textContent = UI_CSS;
      document.head.appendChild(styleEl);
      // ensure visible
      const root = document.getElementById('motoai-root');
      if(root) root.style.display = '';
      console.log('%c✅ MotoAI v14 UI injected (PART 1)', 'color:#0a84ff');
    }catch(e){
      console.error('MotoAI v14 safeInjectUI error:', e);
    }
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', safeInjectUI);
  } else {
    try { safeInjectUI(); } catch(e){ /* ignore */ }
  }

  /* ---------- Helpers (tokenize, normalize) ---------- */
  function tokenizeSafe(str){
    if(!str) return [];
    try{
      return String(str).toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu,' ').split(/\s+/).filter(Boolean);
    }catch(e){
      return String(str).toLowerCase().replace(/[^a-z0-9\u00C0-\u024F\s]+/gi,' ').split(/\s+/).filter(Boolean);
    }
  }

  function normalizeLite(s){
    if(!s) return '';
    return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').trim();
  }

  // Expose helpers & minimal API for Part2/3
  window.MotoAI_v14.tokenizeSafe = tokenizeSafe;
  window.MotoAI_v14.normalizeLite = normalizeLite;
  window.MotoAI_v14.safeInjectUI = safeInjectUI;
  window.MotoAI_v14.isReady = function(){ return !!document.getElementById('motoai-root'); };

  /* ---------- Small debug helper: ensure root exists by timeout (robust) ---------- */
  (function ensureRootRetry(){
    let tries = 0;
    function tryIt(){
      tries++;
      if(window.MotoAI_v14.isReady()){
        console.log('%cℹ️ MotoAI v14 root ready.', 'color:#0a84ff');
        return;
      }
      if(tries > 8) {
        // try one last time but don't spam
        if(document.body) safeInjectUI();
        return;
      }
      setTimeout(()=>{ safeInjectUI(); tryIt(); }, 250);
    }
    tryIt();
  })();

  /* ---------- placeholders for DOM refs (will be populated in Part2) ---------- */
  // IDs used: #motoai-root, #motoai-bubble, #motoai-overlay, #motoai-card,
  // #motoai-body, #motoai-input, #motoai-send, #motoai-close, #motoai-clear, #motoai-typing, #motoai-suggestions

  /* ---------- End of PART 1/3 ----------
     Next: Part 2/3 (corpus, session, UI wiring, open/close, sendQuery basic)
     (DO NOT close the IIFE here; Part 2/3 will continue inside.)
  */

 
/* ============================================================
  MotoAI v14 Combo Standalone — FULL (Part 2/3)
  Phần 2: SESSION + UI + BASIC ENGINE + GỢI Ý
============================================================ */

  const STATE = window.MotoAI_v14_state;
  const CFG = window.MotoAI_v14.cfg;

  /* ---------- DOM GETTERS ---------- */
  function getEls() {
    return {
      root: document.getElementById("motoai-root"),
      bubble: document.getElementById("motoai-bubble"),
      overlay: document.getElementById("motoai-overlay"),
      card: document.getElementById("motoai-card"),
      body: document.getElementById("motoai-body"),
      input: document.getElementById("motoai-input"),
      send: document.getElementById("motoai-send"),
      close: document.getElementById("motoai-close"),
      clear: document.getElementById("motoai-clear"),
      typing: document.getElementById("motoai-typing"),
      sugWrap: document.getElementById("motoai-suggestions")
    };
  }

  /* ---------- STORAGE ---------- */
  function saveSession() {
    try {
      sessionStorage.setItem(CFG.sessionKey, JSON.stringify(STATE.sessionMsgs));
    } catch {}
  }
  function loadSession() {
    try {
      const d = sessionStorage.getItem(CFG.sessionKey);
      STATE.sessionMsgs = d ? JSON.parse(d) : [];
    } catch { STATE.sessionMsgs = []; }
  }

  function saveCorpus() {
    try {
      localStorage.setItem(CFG.corpusKey, JSON.stringify(STATE.corpus));
    } catch {}
  }
  function loadCorpus() {
    try {
      const d = localStorage.getItem(CFG.corpusKey);
      STATE.corpus = d ? JSON.parse(d) : [];
    } catch { STATE.corpus = []; }
  }

  /* ---------- CỘNG DỒN DỮ LIỆU HỌC TRÊN TRANG ---------- */
  function buildCorpusFromDOM() {
    try {
      loadCorpus();
      let texts = [];
      const nodes = Array.from(document.querySelectorAll("main,article,section"));
      nodes.forEach((n) => {
        Array.from(n.querySelectorAll("p,li,h1,h2,h3")).forEach((el) => {
          const t = (el.innerText || "").trim();
          if (t.length > CFG.minSentenceLength) texts.push(t);
        });
      });
      if (!texts.length) {
        const all = document.body.innerText.split(/[.!?]\s+/);
        texts = all.filter((t) => t.length > CFG.minSentenceLength);
      }
      const unique = Array.from(new Set(texts));
      const current = new Set(STATE.corpus.map((c) => c.text));
      unique.forEach((t) => {
        if (!current.has(t)) {
          STATE.corpus.push({ id: STATE.corpus.length, text: t, tokens: MotoAI_v14.tokenizeSafe(t) });
        }
      });
      saveCorpus();
      console.log(`📚 MotoAI: Corpus ${STATE.corpus.length} sentences.`);
    } catch (e) {
      console.error("MotoAI buildCorpusFromDOM error", e);
    }
  }

  /* ---------- RETRIEVAL ---------- */
  function retrieveBest(q) {
    if (!q || !STATE.corpus.length) return null;
    const qTokens = MotoAI_v14.tokenizeSafe(q);
    let best = { score: 0, text: null };
    for (const c of STATE.corpus) {
      let sc = 0;
      for (const t of qTokens) if (c.tokens && c.tokens.includes(t)) sc++;
      if (c.text.toLowerCase().includes(q.toLowerCase())) sc += 0.5;
      if (sc > best.score) best = { score: sc, text: c.text };
    }
    return best.score ? best.text : null;
  }

  /* ---------- UI MESSAGE ---------- */
  function addMsg(role, text) {
    const el = getEls();
    const div = document.createElement("div");
    div.className = "m-msg " + (role === "user" ? "user" : "bot");
    div.textContent = text;
    el.body.appendChild(div);
    el.body.scrollTop = el.body.scrollHeight;
    STATE.sessionMsgs.push({ role, text, t: Date.now() });
    saveSession();
  }

  function showTyping() {
    const t = getEls().typing;
    if (t) t.innerHTML = "<span>...</span>";
  }
  function hideTyping() {
    const t = getEls().typing;
    if (t) t.innerHTML = "";
  }

  /* ---------- GỢI Ý NHANH ---------- */
  function buildSuggestions() {
    const wrap = getEls().sugWrap;
    if (!wrap) return;
    wrap.innerHTML = "";
    CFG.suggestionTags.forEach((s) => {
      const b = document.createElement("button");
      b.textContent = s.label;
      b.addEventListener("click", () => {
        openChat();
        setTimeout(() => sendBasic(s.q), 200);
      });
      wrap.appendChild(b);
    });
  }

  /* ---------- PHÁT HIỆN TÊN ---------- */
  function detectName(text) {
    const n = (text || "").trim();
    const p = /(tên tôi là|mình tên là|tôi là)\s+([A-Za-zÀ-ỹ0-9 ]+)/i;
    const m = n.match(p);
    if (m && m[2]) {
      const nm = m[2].trim();
      localStorage.setItem(CFG.memoryKeyName, nm);
      return nm;
    }
    return null;
  }

  /* ---------- MỞ / ĐÓNG GIAO DIỆN ---------- */
  function openChat() {
    const el = getEls();
    if (STATE.isOpen) return;
    el.overlay.classList.add("visible");
    el.card.setAttribute("aria-hidden", "false");
    STATE.isOpen = true;
    if (!STATE.sessionMsgs.length) addMsg("bot", "👋 Xin chào! Mình là MotoAI — hỏi thử “Xe ga”, “Xe số”, hoặc “Thủ tục” nhé!");
    el.input.focus();
  }

  function closeChat() {
    const el = getEls();
    el.overlay.classList.remove("visible");
    el.card.setAttribute("aria-hidden", "true");
    STATE.isOpen = false;
    hideTyping();
  }

  /* ---------- BASIC TRẢ LỜI ---------- */
  function sendBasic(text) {
    if (!text.trim()) return;
    const el = getEls();
    if (STATE.sendLock) return;
    STATE.sendLock = true;
    addMsg("user", text);
    showTyping();
    setTimeout(() => {
      try {
        const nm = detectName(text);
        if (nm) {
          addMsg("bot", `Đã nhớ tên bạn là ${nm} ✨`);
        } else {
          const ans = retrieveBest(text) || "Mình chưa tìm thấy câu trả lời. Bạn thử hỏi khác nha!";
          addMsg("bot", ans);
        }
      } catch (e) {
        addMsg("bot", "Lỗi xử lý câu hỏi.");
      }
      hideTyping();
      STATE.sendLock = false;
    }, 300);
  }

  /* ---------- GẮN SỰ KIỆN UI ---------- */
  function bindUI() {
    const el = getEls();
    if (!el.bubble) return;

    el.bubble.onclick = () => {
      if (!STATE.isOpen) {
        buildCorpusFromDOM();
        openChat();
      } else closeChat();
    };
    el.close.onclick = closeChat;
    el.overlay.addEventListener("click", (e) => { if (e.target === el.overlay) closeChat(); });
    el.clear.onclick = () => {
      STATE.sessionMsgs = [];
      el.body.innerHTML = "";
      addMsg("bot", "🧹 Đã xóa hội thoại!");
    };
    el.send.onclick = () => {
      const v = el.input.value.trim();
      el.input.value = "";
      sendBasic(v);
    };
    el.input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        const v = el.input.value.trim();
        el.input.value = "";
        sendBasic(v);
      }
    });

    buildSuggestions();
    console.log("%c✅ MotoAI v14 UI bound (Part 2)", "color:#0a84ff");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindUI);
  } else bindUI();

  /* ---------- GẮN API RA NGOÀI ---------- */
  window.MotoAI_v14.open = openChat;
  window.MotoAI_v14.close = closeChat;
  window.MotoAI_v14.addMsg = addMsg;
  window.MotoAI_v14.sendBasic = sendBasic;
  window.MotoAI_v14.rebuildCorpus = buildCorpusFromDOM;

  console.log("%c⚙️ MotoAI v14 Combo — Part 2/3 ready.", "color:#0a84ff");

  /* ---------- End of PART 2/3 ----------
     (Next: Part 3/3 — Smart Engine, LearnFromRepo, LearnFromSites, Auto Theme)
  */

  /* ============================================================
  MotoAI v14 Combo Standalone — FULL (Part 3/3)
  Phần 3: SMART ENGINE + LEARN + THEME SYNC + FINAL BOOTSTRAP
  (Paste trực tiếp sau Part 2, file kết thúc ở cuối phần này)
============================================================ */

  // safe refs
  const TOKENIZE = window.MotoAI_v14.tokenizeSafe;
  const NORMALIZE = window.MotoAI_v14.normalizeLite || window.MotoAI_v14.normalizeText || (s=>String(s||'').toLowerCase());

  /* ---------- SpellFix map (extendable) ---------- */
  const SPELL_FIX = {
    'thue xe may': 'thuê xe máy',
    'thue xe ha noi': 'thuê xe hà nội',
    'xe so': 'xe số',
    'xe ga': 'xe ga',
    'thu tuc': 'thủ tục',
    'giay to': 'giấy tờ',
    'bang gia': 'bảng giá',
    'lien he': 'liên hệ'
  };
  function applySpellFix(text){
    if(!text) return text;
    let t = String(text);
    Object.keys(SPELL_FIX).forEach(k=>{
      const re = new RegExp('\\b'+k+'\\b','gi');
      t = t.replace(re, SPELL_FIX[k]);
    });
    return t;
  }

  /* ---------- Smart Engine rules (v14 improved) ---------- */
  const RULES = [
    { pattern: /^(chào|hi|hello|alo|xin chào|hỗ trợ|giúp|hãy giúp|support)$/i,
      answers: ["Chào bạn! Mình là MotoAI 🤖. Mình có thể giúp gì về thuê xe máy?", "Xin chào! Bạn cần hỏi về xe hay thủ tục?"] },
    { pattern: /(xe số|wave|sirius|blade|future|exciter|winner|ex150)/i,
      answers: ["Xe số tiết kiệm xăng, phù hợp đi phố và phượt nhẹ. Giá thuê từ ~100k/ngày.", "Bạn muốn xem bảng giá xe số hay thủ tục thuê?"] },
    { pattern: /(xe ga|vision|lead|air blade|sh|vespa|grande)/i,
      answers: ["Xe ga êm, cốp rộng; giá thuê thường 120k–150k/ngày.", "Bạn muốn mình gợi ý mẫu xe ga phù hợp không?"] },
    { pattern: /(50cc|xe 50|không cần bằng|khong can bang|chua co bang)/i,
      answers: ["Xe 50cc không cần GPLX (chỉ CCCD). Rất phù hợp học sinh/sinh viên.", "Bạn muốn xem giá hoặc mẫu 50cc?"] },
    { pattern: /(thủ tục|thu tuc|giấy tờ|giay to|cần gì|can gi|điều kiện)/i,
      answers: ["Thủ tục: CCCD + GPLX. Xe 50cc chỉ cần CCCD. Chúng tôi giữ giấy tờ gốc khi nhận xe.", "Bạn muốn mình gửi checklist thủ tục chi tiết?"] },
    { pattern: /(giá|bảng giá|bao nhiêu|gia thue|bang gia)/i,
      answers: ["Bảng giá: Xe số 100k–120k/ngày; Xe ga 120k–150k/ngày; Xe côn 200k–250k/ngày.", "Bạn cần báo giá theo ngày/tuần/tháng?"] },
    { pattern: /(liên hệ|lien he|hotline|zalo|sđt|sdt|số điện thoại)/i,
      answers: ["Liên hệ Hotline/Zalo: 085.725.5868. Gọi hoặc nhắn Zalo để đặt xe nhanh.", "Bạn muốn mình gọi giúp đặt xe (mô phỏng)?" ] },
    { pattern: /(giao xe|ship|vận chuyển|van chuyen|sân bay|ben xe|tận nơi)/i,
      answers: ["Chúng tôi giao xe tận nơi trong nội thành Hà Nội — miễn phí theo chính sách.", "Giao nhận tận nơi có hỗ trợ sân bay và bến xe. Bạn cần giao đến đâu?"] },
    { pattern: /^(cảm ơn|cam on|thanks|ok|oke|tuyệt vời)$/i,
      answers: ["Không có gì ạ! Rất vui được hỗ trợ bạn 😊", "Cảm ơn bạn — liên hệ 085.725.5868 khi cần nhé!"] }
  ];
  const FALLBACK = [
    "Xin lỗi, mình chưa hiểu rõ. Bạn thử hỏi 'Giá thuê xe', 'Xe ga', 'Thủ tục' hoặc 'Liên hệ' nhé.",
    "Mình chưa có dữ liệu cho câu hỏi này. Bạn thử đặt câu ngắn hơn hoặc hỏi về loại xe cụ thể."
  ];

  /* ---------- Smart answer function ---------- */
  function smartAnswer(query){
    if(!query) return null;
    const qNorm = NORMALIZE(query);
    let best = null; let bestScore = 0;
    for(const r of RULES){
      try{
        if(r.pattern.test(query) || r.pattern.test(qNorm)) {
          bestScore = 100; best = r; break;
        }
      }catch(e){}
    }
    if(best){
      const arr = best.answers || [];
      if(arr.length) return arr[Math.floor(Math.random()*arr.length)];
    }
    // fallback to retrieval
    const ret = retrieveBest(query);
    if(ret) return ret;
    // final fallback
    return FALLBACK[Math.floor(Math.random()*FALLBACK.length)];
  }

  /* ---------- Learn from relatedSites (external domains) ---------- */
  async function learnFromMySites(){
    try{
      console.log('%c🌐 MotoAI: learnFromMySites start', 'color:#0a84ff');
      let added = 0;
      const seen = new Set(STATE.corpus.map(c=>c.text));
      for(const site of (CFG.relatedSites || [])){
        try{
          const res = await fetch(site, { cache: 'no-store', mode: 'cors' });
          if(!res.ok){ console.warn('MotoAI: fetch failed', site, res.status); continue; }
          const html = await res.text();
          const tmp = document.createElement('div');
          tmp.innerHTML = html;
          const nodes = Array.from(tmp.querySelectorAll('p,h1,h2,h3,li,section,article'));
          const texts = nodes.map(n => (n.textContent||'').trim()).filter(t => t.length > 40);
          for(const t of texts){
            if(!seen.has(t)){
              STATE.corpus.push({ id: STATE.corpus.length, text: t, tokens: TOKENIZE(t), source: site });
              seen.add(t);
              added++;
            }
          }
          console.log(`✅ MotoAI: learned ${texts.length} from ${site} (new +${added})`);
        }catch(e){
          // ignore CORS errors
          console.warn('MotoAI: learnFromMySites error', site);
        }
      }
      if(added>0) saveCorpus();
      console.log('%c📘 MotoAI: learnFromMySites complete, new:', 'color:#0a84ff', added);
    }catch(e){
      console.error('MotoAI learnFromMySites error', e);
    }
  }

  /* ---------- Learn from repo sitemap ---------- */
  async function learnFromRepo(){
    try{
      const last = parseInt(localStorage.getItem(CFG.lastLearnKey) || '0', 10);
      if(last && (Date.now() - last) < CFG.learnIntervalMs){
        console.log('MotoAI: skip learnFromRepo (recent)');
        return;
      }
      const sitemap = CFG.sitemapPath;
      console.log('%c📖 MotoAI: learnFromRepo reading', sitemap, '...', 'color:#0a84ff');
      const res = await fetch(sitemap, { cache: 'no-store' });
      if(!res.ok){ console.warn('MotoAI: sitemap fetch failed', sitemap); return; }
      const data = await res.json();
      if(!data || !Array.isArray(data.pages)){ console.warn('MotoAI: sitemap format invalid'); return; }
      let added = 0;
      const seen = new Set(STATE.corpus.map(c=>c.text));
      for(const p of data.pages){
        try{
          const r = await fetch(p, { cache:'no-store' });
          if(!r.ok) continue;
          const txt = await r.text();
          const tmp = document.createElement('div');
          tmp.innerHTML = txt;
          const nodes = Array.from(tmp.querySelectorAll('p,h1,h2,h3,li,section,article'));
          const lines = nodes.map(n => (n.textContent||'').trim()).filter(t => t.length > CFG.minSentenceLength);
          for(const t of lines){
            if(!seen.has(t)){
              STATE.corpus.push({ id: STATE.corpus.length, text: t, tokens: TOKENIZE(t), source: p });
              seen.add(t);
              added++;
            }
          }
        }catch(e){}
      }
      if(added>0) saveCorpus();
      localStorage.setItem(CFG.lastLearnKey, Date.now());
      console.log('%c✅ MotoAI: learnFromRepo complete, new items:', 'color:#0a84ff', added);
    }catch(e){
      console.error('MotoAI learnFromRepo error', e);
    }
  }

  /* ---------- Enhanced sendQuery (smart) ---------- */
  function smartSendQuery(origText){
    if(!origText || !origText.trim()) return;
    const text = applySpellFix(origText);
    const els = getEls();
    if(STATE.sendLock) return;
    STATE.sendLock = true;
    if(els.send) els.send.disabled = true;

    addMsg('user', text);

    const name = detectName(text);
    if(name){
      addMsg('bot', `Đã nhớ tên: ${name} ✨`);
      STATE.sendLock = false;
      if(els.send) els.send.disabled = false;
      return;
    }

    showTyping();
    setTimeout(()=>{
      try{
        const reply = smartAnswer(text);
        hideTyping();
        if(reply) addMsg('bot', reply);
        else addMsg('bot', 'Mình chưa tìm được câu trả lời, thử hỏi khác nhé.');
      }catch(e){
        hideTyping();
        addMsg('bot', 'Lỗi khi xử lý câu trả lời.');
        console.error(e);
      }finally{
        STATE.sendLock = false;
        if(els.send) els.send.disabled = false;
      }
    }, 200);
  }

  // override basic send with smart
  window.MotoAI_v14.sendQuery = smartSendQuery;

  /* ---------- Bootstrap final actions ---------- */
  function finalBoot(){
    try{
      // bind UI if not yet
      try{ if(typeof bindUI === 'function') bindUI(); }catch(e){}
      // load session & corpus, build corpus from DOM
      try{ loadSession(); loadCorpus(); buildCorpusFromDOM(); }catch(e){}
      // build suggestions UI
      try{ buildSuggestions(); }catch(e){}
      // bind smart send (already assigned)
      // schedule learns
      setTimeout(()=>{ learnFromMySites(); }, 900);
      setTimeout(()=>{ learnFromRepo(); }, 1600);
      // periodic rebuild guard
      setInterval(()=>{ try{ buildCorpusFromDOM(); }catch(e){} }, 1000 * 60 * 60 * 6); // every 6h rebuild small
      // small log
      console.log('%c🚀 MotoAI v14 — Final bootstrap complete. AI ready!', 'color:#0a84ff;font-weight:bold;');
    }catch(e){
      console.error('MotoAI finalBoot error', e);
    }
  }

  // run final boot when DOM fully loaded
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', finalBoot);
  } else {
    setTimeout(finalBoot, 80);
  }

  // expose some API utilities
  Object.assign(window.MotoAI_v14, {
    smartAnswer,
    learnFromMySites,
    learnFromRepo,
    applySpellFix,
    getCorpus: ()=>STATE.corpus,
    getSession: ()=>STATE.sessionMsgs,
    rebuildCorpus: buildCorpusFromDOM
  });

  // final end of IIFE (Part 3 closes the whole file)
})(); // END MotoAI v14 Combo Standalone — FULL (Parts 1+2+3)


