// MotoAI v6.0 Embed (Fixed for Safari & Mobile) 😎
window.addEventListener('DOMContentLoaded', function() {
  if (window.MotoAIEmbed_v6_LOADED) return;
  window.MotoAIEmbed_v6_LOADED = true;

  const CORE_URL = "https://cdn.jsdelivr.net/gh/motoopen/chothuexemayhanoi@main/motoai_core_v6.js";

  // === Inject HTML ===
  const html = `
  <div id="motoai-root">
    <div id="motoai-bubble" role="button" aria-label="Mở chat">🤖</div>
    <div id="motoai-backdrop"></div>
    <div id="motoai-card" aria-hidden="true">
      <div id="motoai-handle"></div>
      <div id="motoai-header">MotoAI Assistant</div>
      <div id="motoai-body"></div>
      <div id="motoai-suggestions">
        <button data-q="Xe số">🏍 Xe số</button>
        <button data-q="Xe ga">🛵 Xe ga</button>
        <button data-q="Thủ tục">📄 Thủ tục</button>
      </div>
      <div id="motoai-input">
        <input id="motoai-input-el" placeholder="Nhập câu hỏi..." autocomplete="off" />
        <button id="motoai-send">Gửi</button>
      </div>
      <button id="motoai-clear" title="Xóa cuộc trò chuyện">🗑</button>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', html);

  // === Inject CSS ===
  const style = document.createElement('style');
  style.textContent = `
  :root {
    --accent: #007aff;
    --bg-light: rgba(255,255,255,0.96);
    --bg-dark: rgba(20,20,22,0.94);
  }
  #motoai-root {
    position: fixed;
    left: 16px;
    bottom: 100px;
    z-index: 99997;
    pointer-events: none;
  }
  #motoai-bubble {
    pointer-events: auto;
    width: 58px; height: 58px;
    border-radius: 14px;
    display: flex; align-items: center; justify-content: center;
    font-size: 28px; cursor: pointer;
    background: var(--accent); color: #fff;
    box-shadow: 0 6px 18px rgba(0,0,0,0.25);
    transition: transform .2s;
  }
  #motoai-bubble:hover { transform: scale(1.05); }
  #motoai-backdrop {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.25);
    opacity: 0;
    pointer-events: none;
    transition: opacity .28s;
    z-index: 99998;
  }
  #motoai-backdrop.show { opacity: 1; pointer-events: auto; }
  #motoai-card {
    position: fixed; left: 0; right: 0; bottom: 0;
    width: min(900px, calc(100% - 30px));
    margin: auto;
    height: 70vh; max-height: 720px;
    border-radius: 18px 18px 0 0;
    background: var(--bg-light);
    box-shadow: 0 -12px 40px rgba(0,0,0,0.18);
    transform: translateY(110%);
    opacity: 0;
    transition: transform .4s cubic-bezier(.2,.9,.2,1), opacity .3s;
    display: flex; flex-direction: column;
    overflow: hidden;
    z-index: 99999;
    pointer-events: auto;
  }
  #motoai-card.open { transform: translateY(0); opacity: 1; }
  #motoai-header {
    padding: 8px; text-align: center;
    color: var(--accent);
    font-weight: 700;
    border-bottom: 1px solid rgba(0,0,0,0.08);
  }
  #motoai-handle {
    width: 50px; height: 5px; background: #ccc;
    border-radius: 6px; margin: 10px auto;
  }
  #motoai-body {
    flex: 1; overflow-y: auto;
    padding: 10px 14px; font-size: 15px;
  }
  .m-msg {
    margin: 8px 0; padding: 10px 12px;
    border-radius: 12px; max-width: 84%;
    line-height: 1.4; word-break: break-word;
  }
  .m-msg.user {
    background: linear-gradient(180deg, var(--accent), #00b6ff);
    color: #fff; margin-left: auto;
  }
  .m-msg.bot {
    background: rgba(245,245,245,0.95);
    color: #111;
  }
  #motoai-input {
    display: flex; gap: 8px; padding: 10px;
    border-top: 1px solid rgba(0,0,0,0.06);
    background: rgba(255,255,255,0.9);
  }
  #motoai-input input {
    flex: 1; padding: 10px;
    border-radius: 12px;
    border: 1px solid #ccc;
    font-size: 16px;
  }
  #motoai-input button {
    background: var(--accent);
    color: #fff;
    border: none;
    border-radius: 10px;
    padding: 10px 14px;
    font-weight: bold;
  }
  #motoai-clear {
    position: absolute;
    top: 8px; right: 10px;
    background: transparent;
    border: none; cursor: pointer;
    font-size: 18px;
    opacity: .8;
  }
  #motoai-suggestions {
    display: flex; justify-content: center; gap: 6px; padding: 6px;
  }
  #motoai-suggestions button {
    background: rgba(0,122,255,0.1);
    border: 1px solid rgba(0,122,255,0.3);
    border-radius: 10px;
    padding: 6px 10px;
    font-size: 14px; cursor: pointer;
  }
  @media(prefers-color-scheme:dark){
    #motoai-card{background:var(--bg-dark);}
    .m-msg.bot{background:rgba(40,40,50,0.9);color:#eee;}
    #motoai-input{background:rgba(25,25,30,0.9);}
    #motoai-input input{background:rgba(255,255,255,0.1);color:#fff;border-color:rgba(255,255,255,0.15);}
  }`;
  document.head.appendChild(style);

  // === Elements ===
  const $ = s => document.querySelector(s);
  const root = $('#motoai-root');
  const bubble = $('#motoai-bubble');
  const card = $('#motoai-card');
  const backdrop = $('#motoai-backdrop');
  const input = $('#motoai-input-el');
  const send = $('#motoai-send');
  const clear = $('#motoai-clear');
  const bodyEl = $('#motoai-body');

  // === Behavior ===
  function openChat() {
    card.classList.add('open');
    backdrop.classList.add('show');
    bubble.style.display = 'none';
    card.setAttribute('aria-hidden','false');
  }
  function closeChat() {
    card.classList.remove('open');
    backdrop.classList.remove('show');
    bubble.style.display = 'flex';
    card.setAttribute('aria-hidden','true');
  }
  function clearChat() {
    localStorage.removeItem('motoai_memory');
    bodyEl.innerHTML = '<div class="m-msg bot">Đã xóa toàn bộ cuộc trò chuyện 🗑</div>';
  }

  bubble.onclick = openChat;
  backdrop.onclick = closeChat;
  clear.onclick = clearChat;

  // === Dynamic Loading of Core ===
  const core = document.createElement('script');
  core.src = CORE_URL + '?v=' + Date.now();
  core.defer = true;
  document.head.appendChild(core);

  // === Hide AI when menu open ===
  const observer = new MutationObserver(() => {
    const open = document.body.classList.contains('nav-open') || document.body.classList.contains('offcanvas-show');
    root.style.display = open ? 'none' : 'block';
  });
  observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

  console.log('✅ MotoAIEmbed_v6 loaded (fixed).');
});
