// MotoAI v9.8 Final UI — Apple Glass Readable Edition 😎
// Giao diện iPhone Messages, mượt, dễ đọc, tương thích mọi thiết bị.
window.addEventListener('DOMContentLoaded', () => {
  if (window.MotoAI_LOADED) return;
  window.MotoAI_LOADED = true;

  // ==== HTML ====
  const html = `
  <div id="motoai-root">
    <div id="motoai-bubble" role="button" aria-label="Mở chat">🤖</div>
    <div id="motoai-backdrop"></div>
    <div id="motoai-card" aria-hidden="true">
      <div id="motoai-handle"></div>
      <div id="motoai-header">
        <span>MotoAI Assistant</span>
        <button id="motoai-close" title="Đóng">✕</button>
      </div>
      <div id="motoai-body">
        <div class="m-msg bot">👋 Xin chào! Mình là MotoAI — hỏi thử “Xe ga”, “Xe số” hay “Xe 50cc” nhé!</div>
      </div>
      <div id="motoai-suggestions">
        <button data-q="Xe số">🏍 Xe số</button>
        <button data-q="Xe ga">🛵 Xe ga</button>
        <button data-q="Thủ tục">📄 Thủ tục</button>
        <button data-q="Xe 50cc">🚲 Xe 50cc</button>
      </div>
      <div id="motoai-input">
        <input id="motoai-input-el" placeholder="Nhập câu hỏi..." autocomplete="off" />
        <button id="motoai-send">Gửi</button>
      </div>
      <button id="motoai-clear" title="Xóa hội thoại">🗑</button>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', html);

  // ==== CSS ====
  const style = document.createElement('style');
  style.textContent = `
  :root {
    --accent: #007aff;
    --bg-light: rgba(255,255,255,0.85);
    --bg-dark: rgba(30,30,32,0.88);
    --blur-bg: blur(14px) saturate(160%);
  }

  #motoai-root { position: fixed; left: 16px; bottom: 100px; z-index: 99997; }

  #motoai-bubble {
    width: 58px; height: 58px; border-radius: 14px;
    display: flex; align-items: center; justify-content: center;
    font-size: 28px; background: var(--accent); color: #fff;
    cursor: pointer; box-shadow: 0 8px 22px rgba(0,0,0,0.25);
    transition: transform .25s;
  }
  #motoai-bubble:hover { transform: scale(1.05); }

  #motoai-backdrop {
    position: fixed; inset: 0; background: rgba(0,0,0,0.25);
    opacity: 0; pointer-events: none; transition: opacity .3s; z-index: 99998;
  }
  #motoai-backdrop.show { opacity: 1; pointer-events: auto; }

  #motoai-card {
    position: fixed; left: 0; right: 0; bottom: 0;
    width: min(900px, calc(100% - 30px)); margin: auto;
    height: 70vh; max-height: 720px; border-radius: 22px 22px 0 0;
    background: var(--bg-light); backdrop-filter: var(--blur-bg);
    box-shadow: 0 -12px 40px rgba(0,0,0,.18);
    transform: translateY(110%); opacity: 0;
    display: flex; flex-direction: column;
    overflow: hidden; z-index: 99999;
    transition: transform .45s cubic-bezier(.2,.9,.2,1), opacity .3s ease;
  }
  #motoai-card.open { transform: translateY(0); opacity: 1; }

  #motoai-handle {
    width: 60px; height: 6px; background: rgba(160,160,160,0.6);
    border-radius: 6px; margin: 10px auto;
  }

  #motoai-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 6px 14px; font-weight: 700; color: var(--accent);
    border-bottom: 1px solid rgba(0,0,0,.06);
  }

  #motoai-close {
    background: none; border: none; font-size: 22px;
    cursor: pointer; color: var(--accent); opacity: .85;
  }

  #motoai-body {
    flex: 1; overflow-y: auto; padding: 10px 14px;
    font-size: 15px; background: transparent;
  }

  .m-msg {
    margin: 8px 0; padding: 12px 14px;
    border-radius: 18px; max-width: 84%;
    line-height: 1.4; word-break: break-word;
    box-shadow: 0 3px 8px rgba(0,0,0,0.08);
  }
  .m-msg.user {
    background: linear-gradient(180deg, var(--accent), #00b6ff);
    color: #fff; margin-left: auto;
  }
  .m-msg.bot {
    background: rgba(255,255,255,0.8);
    backdrop-filter: blur(6px);
    color: #111;
  }

  #motoai-suggestions {
    display: flex; gap: 6px; justify-content: center; flex-wrap: wrap;
    padding: 6px 10px; border-top: 1px solid rgba(0,0,0,.05);
    background: rgba(255,255,255,0.5); backdrop-filter: blur(10px);
  }
  #motoai-suggestions button {
    border: none; background: rgba(0,122,255,.08);
    color: var(--accent);
    padding: 8px 12px; border-radius: 12px;
    cursor: pointer; font-weight: 500;
    transition: background .25s;
  }
  #motoai-suggestions button:hover {
    background: rgba(0,122,255,.15);
  }

  #motoai-input {
    display: flex; gap: 8px; padding: 10px;
    border-top: 1px solid rgba(0,0,0,.06);
    background: rgba(255,255,255,0.7);
    backdrop-filter: blur(10px);
  }
  #motoai-input input {
    flex: 1; padding: 10px; border-radius: 12px;
    border: 1px solid rgba(0,0,0,0.1); font-size: 16px;
    background: rgba(255,255,255,0.6);
  }
  #motoai-input button {
    background: var(--accent); color: #fff;
    border: none; border-radius: 10px; padding: 10px 14px;
    font-weight: 600; transition: opacity .25s;
  }
  #motoai-input button:hover { opacity: 0.9; }

  #motoai-clear {
    position: absolute; top: 10px; right: 40px;
    background: none; border: none; font-size: 18px;
    cursor: pointer; opacity: .8;
  }

  @media (prefers-color-scheme: dark) {
    #motoai-card { background: var(--bg-dark); color: #eee; }
    .m-msg.bot { background: rgba(40,40,50,0.8); color: #eee; }
    #motoai-input { background: rgba(25,25,30,0.9); }
    #motoai-suggestions { background: rgba(25,25,30,0.8); }
  }`;
  document.head.appendChild(style);

  // ==== JS Logic ====
  const $ = s => document.querySelector(s);
  const bubble = $('#motoai-bubble');
  const card = $('#motoai-card');
  const backdrop = $('#motoai-backdrop');
  const closeBtn = $('#motoai-close');
  const sendBtn = $('#motoai-send');
  const input = $('#motoai-input-el');
  const clear = $('#motoai-clear');
  const bodyEl = $('#motoai-body');
  const state = { msgs: [] };

  function renderMsgs() {
    bodyEl.innerHTML = state.msgs.map(m => `<div class="m-msg ${m.role}">${m.text}</div>`).join('');
    bodyEl.scrollTop = bodyEl.scrollHeight;
  }

  function dummyRetrieve(q) {
    if (q.includes('50cc')) return '🚲 Xe 50cc rất phù hợp cho người chưa có bằng lái nhé!';
    if (q.includes('ga')) return '🛵 Xe ga chạy êm, phù hợp đường phố.';
    if (q.includes('số')) return '🏍 Xe số tiết kiệm, bền bỉ cho di chuyển xa.';
    if (q.includes('thủ tục')) return '📄 Thủ tục thuê xe rất đơn giản: chỉ cần CCCD + cọc nhỏ.';
    return '🤖 Cảm ơn, mình đang học thêm từ nội dung trang này...';
  }

  function sendMessage(qTxt) {
    const text = (qTxt || input.value).trim();
    if (!text) return;
    state.msgs.push({ role: 'user', text });
    renderMsgs();
    input.value = '';
    const reply = dummyRetrieve(text);
    setTimeout(() => {
      state.msgs.push({ role: 'bot', text: reply });
      renderMsgs();
    }, 300);
  }

  function openChat() { card.classList.add('open'); backdrop.classList.add('show'); bubble.style.display = 'none'; }
  function closeChat() { card.classList.remove('open'); backdrop.classList.remove('show'); bubble.style.display = 'flex'; }
  function clearChat() { state.msgs = [{ role: 'bot', text: '🗑 Đã xóa hội thoại.' }]; renderMsgs(); }

  bubble.onclick = openChat;
  backdrop.onclick = closeChat;
  closeBtn.onclick = closeChat;
  clear.onclick = clearChat;
  sendBtn.onclick = () => sendMessage();
  input.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } });
  document.querySelectorAll('#motoai-suggestions button').forEach(btn => btn.onclick = () => sendMessage(btn.dataset.q));

  console.log('✅ MotoAI v9.8 Final UI loaded (Readable Glass Edition)');
});
