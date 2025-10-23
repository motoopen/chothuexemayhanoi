// MotoAI v9.9 — Web Corpus Learning Edition 😎
// Tự đọc nội dung website, trả lời dựa theo văn bản thực tế.
window.addEventListener('DOMContentLoaded', () => {
  if (window.MotoAI_99_LOADED) return;
  window.MotoAI_99_LOADED = true;

  // ==== Inject HTML ====
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
        <div class="m-msg bot">👋 Xin chào! Mình là MotoAI v9.9 — mình đang đọc nội dung trang này để giúp bạn nhé!</div>
      </div>
      <div id="motoai-suggestions">
        <button data-q="Xe số">🏍 Xe số</button>
        <button data-q="Xe ga">🛵 Xe ga</button>
        <button data-q="Thủ tục">📄 Thủ tục</button>
        <button data-q="Xe 50cc">🚲 Xe 50cc</button>
      </div>
      <div id="motoai-input">
        <input id="motoai-input-el" placeholder="Nhập câu hỏi..." autocomplete="off"/>
        <button id="motoai-send">Gửi</button>
      </div>
      <button id="motoai-clear" title="Xóa hội thoại">🗑</button>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', html);

  // ==== CSS (giữ Apple Glass v9.8) ====
  const style = document.createElement('style');
  style.textContent = `
  :root { --accent:#007aff; --blur-bg:blur(14px) saturate(160%); }
  #motoai-root{position:fixed;left:16px;bottom:100px;z-index:99997}
  #motoai-bubble{width:58px;height:58px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:28px;background:var(--accent);color:#fff;cursor:pointer;box-shadow:0 8px 22px rgba(0,0,0,0.25);transition:transform .25s}
  #motoai-bubble:hover{transform:scale(1.05)}
  #motoai-backdrop{position:fixed;inset:0;background:rgba(0,0,0,0.25);opacity:0;pointer-events:none;transition:opacity .3s;z-index:99998}
  #motoai-backdrop.show{opacity:1;pointer-events:auto}
  #motoai-card{position:fixed;left:0;right:0;bottom:0;width:min(900px,calc(100% - 30px));margin:auto;height:70vh;max-height:720px;border-radius:22px 22px 0 0;background:rgba(255,255,255,0.85);backdrop-filter:var(--blur-bg);box-shadow:0 -12px 40px rgba(0,0,0,.18);transform:translateY(110%);opacity:0;display:flex;flex-direction:column;overflow:hidden;z-index:99999;transition:transform .45s cubic-bezier(.2,.9,.2,1),opacity .3s ease}
  #motoai-card.open{transform:translateY(0);opacity:1}
  #motoai-header{display:flex;align-items:center;justify-content:space-between;padding:6px 14px;font-weight:700;color:var(--accent);border-bottom:1px solid rgba(0,0,0,.06)}
  #motoai-body{flex:1;overflow-y:auto;padding:10px 14px;font-size:15px}
  .m-msg{margin:8px 0;padding:12px 14px;border-radius:18px;max-width:84%;line-height:1.4;word-break:break-word;box-shadow:0 3px 8px rgba(0,0,0,0.08)}
  .m-msg.user{background:linear-gradient(180deg,var(--accent),#00b6ff);color:#fff;margin-left:auto}
  .m-msg.bot{background:rgba(255,255,255,0.8);backdrop-filter:blur(6px);color:#111}
  #motoai-suggestions{display:flex;gap:6px;justify-content:center;flex-wrap:wrap;padding:6px 10px;border-top:1px solid rgba(0,0,0,.05);background:rgba(255,255,255,0.5);backdrop-filter:blur(10px)}
  #motoai-input{display:flex;gap:8px;padding:10px;border-top:1px solid rgba(0,0,0,.06);background:rgba(255,255,255,0.7);backdrop-filter:blur(10px)}
  #motoai-input input{flex:1;padding:10px;border-radius:12px;border:1px solid rgba(0,0,0,0.1);font-size:16px;background:rgba(255,255,255,0.6)}
  #motoai-input button{background:var(--accent);color:#fff;border:none;border-radius:10px;padding:10px 14px;font-weight:600;transition:opacity .25s}
  #motoai-input button:hover{opacity:.9}
  #motoai-clear{position:absolute;top:10px;right:40px;background:none;border:none;font-size:18px;cursor:pointer;opacity:.8}`;
  document.head.appendChild(style);

  // ==== JS Logic ====
  const $ = s => document.querySelector(s);
  const card = $('#motoai-card');
  const bubble = $('#motoai-bubble');
  const backdrop = $('#motoai-backdrop');
  const input = $('#motoai-input-el');
  const sendBtn = $('#motoai-send');
  const clearBtn = $('#motoai-clear');
  const bodyEl = $('#motoai-body');

  const state = { msgs: [], corpus: [] };

  // 📚 Học nội dung trang
  function learnCorpus() {
    const text = document.body.innerText || '';
    const parts = text.split(/[.!?]/).map(t => t.trim()).filter(t => t.length > 20);
    state.corpus = parts.slice(0, 300); // Giới hạn để tránh nặng
    console.log(`📖 MotoAI học ${state.corpus.length} câu từ trang.`);
  }

  // 🧠 Tìm câu trả lời gần nhất
  function findBestAnswer(q) {
    const words = q.toLowerCase().split(/\s+/);
    let best = ''; let max = 0;
    for (const s of state.corpus) {
      const score = words.reduce((a,w)=>a+(s.toLowerCase().includes(w)?1:0),0);
      if (score > max) { max = score; best = s; }
    }
    return best || '🤔 Xin lỗi, mình chưa thấy thông tin đó trên trang.';
  }

  function render() {
    bodyEl.innerHTML = state.msgs.map(m => `<div class="m-msg ${m.role}">${m.text}</div>`).join('');
    bodyEl.scrollTop = bodyEl.scrollHeight;
  }

  function send(qText) {
    const text = (qText || input.value).trim();
    if (!text) return;
    state.msgs.push({ role: 'user', text });
    render();
    input.value = '';
    setTimeout(()=>{
      const ans = findBestAnswer(text);
      state.msgs.push({ role: 'bot', text: ans });
      render();
    }, 300);
  }

  // ==== Events ====
  bubble.onclick = ()=>{ card.classList.add('open'); backdrop.classList.add('show'); bubble.style.display='none'; };
  backdrop.onclick = ()=>{ card.classList.remove('open'); backdrop.classList.remove('show'); bubble.style.display='flex'; };
  $('#motoai-close').onclick = backdrop.onclick;
  sendBtn.onclick = ()=>send();
  input.onkeydown = e=>{ if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();} };
  clearBtn.onclick = ()=>{ state.msgs=[{role:'bot',text:'🗑 Đã xóa hội thoại.'}]; render(); };
  document.querySelectorAll('#motoai-suggestions button').forEach(b=>b.onclick=()=>send(b.dataset.q));

  // Học khi load
  learnCorpus();
  console.log('✅ MotoAI v9.9 Web Corpus Learning loaded');
});
