// MotoAI v2 — Apple Style (Embed-ready)
// Place this file as /motoai_v2.js in your repo and use the jsDelivr embed line below.

(function(){
  // Safety: run when DOM ready
  function ready(fn){
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  ready(() => {

    // --- guard: don't init twice ---
    if(window.__motoai_v2_inited) return;
    window.__motoai_v2_inited = true;

    // --- inject HTML (left-bottom position, apple-style) ---
    const html = `
      <div id="motoai-v2-root" aria-hidden="false">
        <div id="motoai-v2-backdrop" tabindex="-1" aria-hidden="true"></div>

        <div id="motoai-v2-card" role="dialog" aria-modal="true" aria-hidden="true">
          <div id="motoai-v2-handle" aria-hidden="true"></div>
          <div id="motoai-v2-header">
            <div id="motoai-v2-title">Motoopen AI</div>
            <button id="motoai-v2-close" aria-label="Đóng chat">✕</button>
          </div>
          <div id="motoai-v2-body" aria-live="polite"></div>
          <div id="motoai-v2-input">
            <input id="motoai-v2-input-el" type="text" placeholder="Nhập câu hỏi..." autocomplete="off" aria-label="Nhập câu hỏi"/>
            <button id="motoai-v2-send" aria-label="Gửi">Gửi</button>
          </div>
        </div>

        <button id="motoai-v2-bubble" aria-label="Mở chat" title="Mở chat">
          <span id="motoai-v2-bubble-emoji">👩‍💻</span>
        </button>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);

    // --- inject CSS (Apple-like, does NOT override body) ---
    const css = `
    :root{
      --m2-accent: #007aff;
      --m2-glass: rgba(255,255,255,0.7);
      --m2-glass-dark: rgba(20,20,22,0.6);
      --m2-text: #111;
      --m2-radius: 14px;
      --m2-shadow: 0 10px 30px rgba(2,6,23,0.12);
      --m2-blur: 10px;
      --m2-z: 2147483000;
      --m2-bubble-size: 62px;
    }

    /* Root container (does not change body) */
    #motoai-v2-root{ position: fixed; left: 18px; bottom: 90px; z-index:var(--m2-z); pointer-events: none; font-family: -apple-system, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }

    /* Backdrop: full-screen, hidden by default */
    #motoai-v2-backdrop{ position: fixed; inset: 0; background: rgba(0,0,0,0.18); backdrop-filter: blur(6px); opacity: 0; pointer-events: none; transition: opacity .28s ease; z-index: calc(var(--m2-z) - 1); }
    #motoai-v2-backdrop.show{ opacity: 1; pointer-events: auto; }

    /* Card: hidden by default (translates up) */
    #motoai-v2-card{
      position: fixed;
      left: 50%;
      transform: translateX(-50%) translateY(110%);
      bottom: 8vh;
      width: min(920px, calc(100% - 56px));
      max-width: 920px;
      height: 64vh;
      max-height: 760px;
      border-radius: 16px;
      box-shadow: var(--m2-shadow);
      overflow: hidden;
      opacity: 0;
      transition: transform .45s cubic-bezier(.2,.9,.2,1), opacity .28s ease;
      display: flex;
      flex-direction: column;
      pointer-events: none;
      z-index: var(--m2-z);
      background: linear-gradient(180deg, rgba(255,255,255,0.9), rgba(255,255,255,0.85));
      -webkit-backdrop-filter: blur(var(--m2-blur));
      backdrop-filter: blur(var(--m2-blur));
    }
    /* card open state */
    #motoai-v2-card.open{ transform: translateX(-50%) translateY(0); opacity: 1; pointer-events: auto; }

    /* Header inside card */
    #motoai-v2-header{
      display:flex; align-items:center; justify-content:space-between;
      padding:10px 14px; border-bottom: 1px solid rgba(0,0,0,0.04);
      background: transparent;
    }
    #motoai-v2-title{ font-weight:700; color: var(--m2-accent); font-size:15px; }
    #motoai-v2-close{ background: transparent; border: none; font-size:16px; opacity:0.7; cursor:pointer; padding:6px; border-radius:8px; }
    #motoai-v2-close:hover{ background: rgba(0,0,0,0.04); opacity:1; }

    /* Body messages area */
    #motoai-v2-body{ padding: 12px 14px; overflow:auto; flex:1; font-size:15px; color: var(--m2-text); -webkit-overflow-scrolling: touch; }
    .m2-msg{ margin: 8px 0; padding:10px 12px; border-radius:12px; max-width:84%; line-height:1.35; word-wrap:break-word; display:inline-block; }
    .m2-msg.bot{ background: rgba(245,245,250,0.95); color:var(--m2-text); }
    .m2-msg.user{ background: linear-gradient(180deg,var(--m2-accent), #00b6ff); color:#fff; margin-left:auto; }

    /* Input area (iMessage-like) */
    #motoai-v2-input{ display:flex; gap:8px; padding:10px; border-top:1px solid rgba(0,0,0,0.04); background: transparent; }
    #motoai-v2-input input{ flex:1; padding:12px 14px; border-radius:999px; border:1px solid rgba(0,0,0,0.06); font-size:15px; outline:none; background: rgba(255,255,255,0.8); }
    #motoai-v2-input button{ padding:10px 14px; border-radius:999px; border:none; background:var(--m2-accent); color:#fff; font-weight:700; cursor:pointer; }

    /* Bubble (left-bottom) */
    #motoai-v2-bubble{
      position: absolute;
      left: 0; bottom: 0;
      pointer-events: auto;
      width: var(--m2-bubble-size); height: var(--m2-bubble-size);
      border-radius: 14px;
      display:flex; align-items:center; justify-content:center;
      background: linear-gradient(135deg,#0a84ff, #00b6ff);
      color:#fff; font-size:26px; box-shadow: 0 6px 24px rgba(10,132,255,0.28);
      border:1px solid rgba(255,255,255,0.08);
      cursor:pointer;
    }
    #motoai-v2-bubble:active{ transform: scale(.98); }

    /* small bubble emoji padding */
    #motoai-v2-bubble-emoji{ display:block; transform: translateY(-1px); }

    /* Responsiveness: mobile specific tweaks */
    @media (max-width: 520px){
      #motoai-v2-card{
        left: 12px;
        transform: translateX(0) translateY(110%);
        width: calc(100% - 24px);
        border-radius: 14px;
        bottom: 16px;
        height: 62vh;
      }
      #motoai-v2-card.open{ transform: translateX(0) translateY(0); }
      #motoai-v2-root{ left: 12px; bottom: 80px; }
      #motoai-v2-bubble{ width:56px; height:56px; border-radius:12px; }
    }

    /* prefers-reduced-motion: disable heavy animation */
    @media (prefers-reduced-motion: reduce){
      #motoai-v2-card, #motoai-v2-backdrop, #motoai-v2-bubble{ transition:none !important; }
    }
    `;

    const style = document.createElement('style');
    style.id = 'motoai-v2-style';
    style.textContent = css;
    document.head.appendChild(style);

    // --- behavior references ---
    const root = document.getElementById('motoai-v2-root');
    const bubble = document.getElementById('motoai-v2-bubble');
    const card = document.getElementById('motoai-v2-card');
    const backdrop = document.getElementById('motoai-v2-backdrop');
    const bodyEl = document.getElementById('motoai-v2-body');
    const inputEl = document.getElementById('motoai-v2-input-el');
    const sendBtn = document.getElementById('motoai-v2-send');
    const closeBtn = document.getElementById('motoai-v2-close');

    // initial messages state (very small)
    const state = { msgs: [{ role: 'bot', text: 'Chào! Mình là MotoAI — hỏi gì mình nhé.' }] };

    function renderMsgs(){
      if(!bodyEl) return;
      bodyEl.innerHTML = '';
      state.msgs.forEach(m => {
        const d = document.createElement('div');
        d.className = 'm2-msg ' + (m.role === 'user' ? 'user' : 'bot');
        d.textContent = m.text;
        bodyEl.appendChild(d);
      });
      bodyEl.scrollTop = bodyEl.scrollHeight;
    }

    // simple corpus built from page content
    function buildCorpus(){
      const txt = document.body.innerText || '';
      const withSep = txt.replace(/([.?!])(\s)*(?=[A-ZÀ-Ỵ0-9"'])/g, '$1|');
      return withSep.split('|').map(s => s.trim()).filter(s => s.length > 20);
    }
    const CORPUS = buildCorpus();

    function dummyRetrieve(q){
      for(const s of CORPUS){
        if(q.split(' ').some(w => s.toLowerCase().includes(w.toLowerCase()))) return s;
      }
      return 'Xin lỗi, mình chưa tìm thấy thông tin đó 🤔.';
    }

    async function ask(q){
      if(!q || !q.trim()) return;
      state.msgs.push({ role: 'user', text: q });
      renderMsgs();
      inputEl.value = '';
      sendBtn.disabled = true;
      await new Promise(r => setTimeout(r, 240));
      const ans = dummyRetrieve(q);
      state.msgs.push({ role: 'bot', text: ans });
      renderMsgs();
      sendBtn.disabled = false;
      setTimeout(()=> inputEl.focus(), 200);
    }

    // Open/close logic with safety for iOS & SPA navigation
    function openCard(){
      card.classList.add('open');
      backdrop.classList.add('show');
      card.setAttribute('aria-hidden','false');
      backdrop.setAttribute('aria-hidden','false');
      // allow interactions inside root
      root.style.pointerEvents = 'auto';
      // hide bubble visually (we keep it in DOM for layout)
      bubble.style.display = 'none';
      renderMsgs();
      // focus input after animation
      setTimeout(()=> { try{ inputEl.focus(); } catch(e){} }, 260);
    }
    function closeCard(){
      card.classList.remove('open');
      backdrop.classList.remove('show');
      card.setAttribute('aria-hidden','true');
      backdrop.setAttribute('aria-hidden','true');
      root.style.pointerEvents = 'none';
      bubble.style.display = 'block';
    }

    // Add events
    bubble.addEventListener('click', openCard);
    backdrop.addEventListener('click', closeCard);
    closeBtn.addEventListener('click', closeCard);

    sendBtn.addEventListener('click', ()=> ask(inputEl.value));
    inputEl.addEventListener('keydown', e => {
      if(e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); ask(inputEl.value); }
      if(e.key === 'Escape') closeCard();
    });

    document.addEventListener('keydown', e => {
      if(e.key === 'Escape' && card.classList.contains('open')) closeCard();
    });

    // When pageshow occurs (SPA back/forward or iOS caching), ensure backdrop is cleared
    window.addEventListener('pageshow', () => {
      try {
        if (backdrop && backdrop.classList.contains('show')) backdrop.classList.remove('show');
        if (card && card.classList.contains('open')) card.classList.remove('open');
        root.style.pointerEvents = 'none';
        bubble.style.display = 'block';
      } catch(e){}
    });

    // Also clear backdrop beforeunload to prevent persistent overlay
    window.addEventListener('beforeunload', () => {
      try {
        if (backdrop) backdrop.classList.remove('show');
      } catch(e){}
    });

    // initial render
    renderMsgs();

    // Accessibility: ensure bubble reachable by keyboard
    bubble.setAttribute('tabindex','0');
    bubble.addEventListener('keydown', e => { if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openCard(); } });

    // Expose a tiny API for page scripts (optional)
    window.MotoAIv2 = {
      open: openCard,
      close: closeCard,
      ask: (q) => ask(q),
      isOpen: () => card.classList.contains('open')
    };

  }); // ready
})();
