// MotoAI v4.0 by Motoopen 😎
// Bản nâng cấp: thêm gợi ý nhanh + tự học từ trang + fix toàn bộ lỗi iOS/Safari
window.addEventListener("DOMContentLoaded", () => {

  // ==== 1️⃣ Inject HTML ====
  const html = `
  <div id="motoai-root">
    <div id="motoai-bubble" role="button" aria-label="Mở chat">👩‍💻</div>
    <div id="motoai-backdrop"></div>
    <div id="motoai-card" role="dialog" aria-modal="true">
      <div id="motoai-handle"></div>
      <div id="motoai-header">MotoAI 4.0</div>
      <div id="motoai-body"></div>

      <div id="motoai-suggestions">
        <button class="suggest" data-text="Xe số">🏍 Xe số</button>
        <button class="suggest" data-text="Xe ga">🛵 Xe ga</button>
        <button class="suggest" data-text="Thủ tục">📄 Thủ tục</button>
      </div>

      <div id="motoai-input">
        <input id="motoai-input-el" type="text" placeholder="Nhập câu hỏi..." />
        <button id="motoai-send" type="button">Gửi</button>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML("beforeend", html);

  // ==== 2️⃣ CSS ====
  const css = `
  :root {
    --accent:#007aff;
    --bg-light:#fff;
    --bg-dark:rgba(25,25,28,0.94);
    --text-light:#111;
    --text-dark:#eee;
  }

  #motoai-root {
    position:fixed; left:16px; bottom:100px;
    z-index:2147483647 !important; pointer-events:none;
  }

  #motoai-bubble {
    pointer-events:auto; width:58px; height:58px; border-radius:16px;
    display:flex; align-items:center; justify-content:center;
    font-size:28px; background:var(--accent); color:#fff;
    box-shadow:0 10px 28px rgba(0,0,0,0.24);
    cursor:pointer; transition:transform .25s;
  }
  #motoai-bubble:hover { transform:scale(1.06); }

  #motoai-backdrop {
    position:fixed; inset:0; background:rgba(0,0,0,0.25);
    backdrop-filter:blur(6px); opacity:0; pointer-events:none;
    transition:opacity .3s ease;
  }
  #motoai-backdrop.show { opacity:1; pointer-events:auto; }

  #motoai-card {
    position:fixed; left:0; right:0; bottom:0;
    width:min(900px,calc(100% - 28px)); height:70vh;
    margin:auto; border-radius:18px 18px 0 0;
    background:var(--bg-light); color:var(--text-light);
    box-shadow:0 -12px 40px rgba(0,0,0,0.18);
    transform:translateY(110%); opacity:0;
    transition:transform .4s cubic-bezier(.2,.9,.2,1), opacity .3s;
    display:flex; flex-direction:column; overflow:hidden; pointer-events:none;
  }
  #motoai-card.open { transform:translateY(0); opacity:1; pointer-events:auto; }

  @media (prefers-color-scheme:dark) {
    #motoai-card { background:var(--bg-dark); color:var(--text-dark); }
  }

  #motoai-handle {
    width:54px; height:6px; background:#ccc;
    border-radius:4px; margin:10px auto;
  }
  #motoai-header {
    text-align:center; font-weight:700;
    color:var(--accent); padding:6px;
  }
  #motoai-body {
    flex:1; overflow:auto; padding:10px 14px; font-size:15px;
  }

  .m-msg { margin:6px 0; padding:10px 12px; border-radius:12px;
    max-width:85%; word-wrap:break-word; line-height:1.4; }
  .m-msg.user { background:linear-gradient(180deg,var(--accent),#00b6ff); color:#fff; margin-left:auto; }
  .m-msg.bot { background:rgba(240,240,246,0.9); color:inherit; }

  #motoai-suggestions {
    display:flex; gap:8px; padding:10px 14px; border-top:1px solid rgba(0,0,0,0.08);
    background:rgba(255,255,255,0.85); flex-wrap:wrap; justify-content:center;
  }
  #motoai-suggestions button {
    border:none; border-radius:12px; background:rgba(0,122,255,0.1);
    color:var(--accent); padding:8px 14px; cursor:pointer; transition:.2s;
  }
  #motoai-suggestions button:hover { background:var(--accent); color:#fff; }

  #motoai-input {
    display:flex; gap:8px; padding:10px; border-top:1px solid rgba(0,0,0,0.08);
    background:rgba(255,255,255,0.9);
  }
  #motoai-input input {
    flex:1; padding:12px; border-radius:12px;
    border:1px solid #d6dde6; font-size:16px;
  }
  #motoai-input button {
    background:var(--accent); color:#fff; font-weight:600;
    border:none; border-radius:10px; padding:0 16px; cursor:pointer;
  }`;
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  // ==== 3️⃣ Logic ====
  const $ = s => document.querySelector(s);
  const bubble = $('#motoai-bubble'),
        card = $('#motoai-card'),
        backdrop = $('#motoai-backdrop'),
        bodyEl = $('#motoai-body'),
        inputEl = $('#motoai-input-el'),
        sendBtn = $('#motoai-send');

  const state = { msgs: [{ role:'bot', text:'Xin chào 👋! Mình là MotoAI 4.0 — hỏi hoặc chọn một gợi ý bên dưới nhé.' }] };

  function render() {
    bodyEl.innerHTML = '';
    state.msgs.forEach(m => {
      const div = document.createElement('div');
      div.className = `m-msg ${m.role}`;
      div.textContent = m.text;
      bodyEl.appendChild(div);
    });
    bodyEl.scrollTop = bodyEl.scrollHeight;
  }

  // Mở / đóng chat
  function openCard() {
    card.classList.add('open');
    backdrop.classList.add('show');
    bubble.style.display = 'none';
    render();
    setTimeout(() => inputEl.focus(), 300);
  }
  function closeCard() {
    card.classList.remove('open');
    backdrop.classList.remove('show');
    bubble.style.display = 'flex';
  }

  // Ngăn click lan ra ngoài
  $('#motoai-card').addEventListener('click', e => e.stopPropagation());
  $('#motoai-input').addEventListener('click', e => e.stopPropagation());

  backdrop.addEventListener('click', closeCard);
  bubble.addEventListener('click', openCard);

  // Trả lời tự học từ trang
  function findAnswer(q) {
    const bodyText = document.body.innerText.toLowerCase();
    const qWords = q.toLowerCase().split(' ');
    for (const word of qWords) {
      const found = bodyText.split(/[.?!]/).find(s => s.includes(word));
      if (found && found.length > 20) return found.trim();
    }
    // Gợi ý cứng
    if (/xe số/i.test(q)) return "Xe số 🏍️: tiết kiệm xăng, dễ sửa, phù hợp đi xa và phượt.";
    if (/xe ga/i.test(q)) return "Xe ga 🛵: tiện lợi, sang trọng, phù hợp đi phố – phổ biến như Vision, Air Blade.";
    if (/thủ tục/i.test(q)) return "Thủ tục thuê xe 📄: chỉ cần CCCD + cọc nhẹ từ 1–3 triệu, làm hợp đồng nhanh.";
    return "Mình chưa rõ lắm 🤔, bạn thử hỏi cách khác nhé!";
  }

  async function ask(q) {
    if (!q.trim()) return;
    state.msgs.push({ role:'user', text:q });
    render();
    inputEl.value = '';
    sendBtn.disabled = true;

    await new Promise(r => setTimeout(r, 400));
    const ans = findAnswer(q);
    state.msgs.push({ role:'bot', text: ans });
    render();
    sendBtn.disabled = false;
  }

  // Gợi ý nhanh
  document.querySelectorAll('.suggest').forEach(btn => {
    btn.addEventListener('click', () => ask(btn.dataset.text));
  });

  // Gửi
  sendBtn.onclick = () => ask(inputEl.value);
  inputEl.onkeydown = e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(inputEl.value); }
    if (e.key === 'Escape') closeCard();
  };

  render();
  console.log("✅ MotoAI 4.0 Loaded – Smart suggestions + auto learn from HTML");
});
