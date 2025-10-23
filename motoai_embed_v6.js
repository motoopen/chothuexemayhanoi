// motoai_embed_v6.js
// Loader + UI for MotoAI v6.0 — will dynamically use MotoAICore_v6
(function(){
  if (window.MotoAIEmbed_v6_LOADED) return;
  window.MotoAIEmbed_v6_LOADED = true;

  // --- config: adjust these URLs to your repo files ---
  const CORE_URL = 'https://cdn.jsdelivr.net/gh/motoopen/chothuexemayhanoi@main/motoai_core_v6.js';
  // If you host core within same repo, change path accordingly

  // load core script dynamically, with callback
  function loadCore(cb){
    if(window.MotoAICore_v6){ cb && cb(); return; }
    const s = document.createElement('script');
    s.src = CORE_URL + '?v=' + Date.now();
    s.defer = true;
    s.crossOrigin = 'anonymous';
    s.onload = () => {
      console.log('MotoAICore_v6 loaded by embed');
      cb && cb();
    };
    s.onerror = () => {
      console.warn('Could not load core from', CORE_URL);
      cb && cb(); // still call cb to avoid blocking UI (fallback)
    };
    document.head.appendChild(s);
  }

  // --- UI HTML & CSS (similar style to v5.1) ---
  const html = `
  <div id="motoai-root" aria-hidden="false">
    <div id="motoai-bubble" role="button" aria-label="Mở chat">🤖</div>
    <div id="motoai-backdrop" tabindex="-1"></div>

    <div id="motoai-card" role="dialog" aria-modal="true" aria-hidden="true">
      <div id="motoai-topbar">
        <div id="motoai-handle"></div>
        <div id="motoai-header">MotoAI v6.0</div>
        <div id="motoai-controls">
          <button id="motoai-export" title="Xuất cuộc trò chuyện">⤓</button>
          <button id="motoai-clear" title="Xóa cuộc trò chuyện">🗑</button>
          <button id="motoai-min" title="Thu nhỏ">▢</button>
        </div>
      </div>

      <div id="motoai-body" aria-live="polite"></div>

      <div id="motoai-suggest">
        <div id="motoai-suggest-inner"></div>
      </div>

      <div id="motoai-input">
        <input id="motoai-input-el" autocomplete="off" placeholder="Nhập câu hỏi..." />
        <button id="motoai-send" type="button">Gửi</button>
      </div>
    </div>
  </div>
  `;
  document.body.insertAdjacentHTML('beforeend', html);

  const css = `
  :root{--accent:#007aff;--card-bg:#fff;--card-bg-dark:rgba(18,18,20,0.92);--text:#111}
  @media(prefers-color-scheme:dark){:root{--card-bg:var(--card-bg-dark);--text:#eee}}
  #motoai-root{position:fixed;left:16px;bottom:120px;z-index:2147483650;pointer-events:none;transition:bottom .28s ease}
  #motoai-bubble{pointer-events:auto;width:56px;height:56px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:24px;background:linear-gradient(145deg,var(--accent),#3fc0ff);color:#fff;box-shadow:0 12px 32px rgba(0,0,0,0.22);cursor:pointer}
  #motoai-backdrop{position:fixed;inset:0;background:rgba(0,0,0,0.28);backdrop-filter:blur(6px);opacity:0;pointer-events:none;transition:opacity .28s}
  #motoai-backdrop.show{opacity:1;pointer-events:auto}
  #motoai-card{position:fixed;left:0;right:0;bottom:0;margin:auto;width:min(920px,calc(100% - 28px));height:68vh;border-radius:18px 18px 0 0;background:var(--card-bg);box-shadow:0 -12px 40px rgba(0,0,0,0.18);transform:translateY(110%);opacity:0;transition:transform .36s cubic-bezier(.2,.9,.2,1),opacity .28s;display:flex;flex-direction:column;overflow:hidden;pointer-events:none}
  #motoai-card.open{transform:translateY(0);opacity:1;pointer-events:auto}
  #motoai-topbar{display:flex;align-items:center;gap:8px;padding:8px 12px}
  #motoai-handle{width:56px;height:6px;background:#d0d6dc;border-radius:6px}
  #motoai-header{flex:1;text-align:center;font-weight:700;color:var(--accent)}
  #motoai-controls{display:flex;gap:6px}
  #motoai-controls button{background:transparent;border:0;font-size:16px;cursor:pointer;padding:6px;border-radius:8px;pointer-events:auto}
  #motoai-body{flex:1;overflow:auto;padding:12px 16px;font-size:15px;color:var(--text)}
  .m-msg{margin:8px 0;padding:10px 12px;border-radius:12px;max-width:84%;line-height:1.4;word-break:break-word}
  .m-msg.bot{background:rgba(245,245,248,0.95);color:#111}
  .m-msg.user{background:linear-gradient(180deg,var(--accent),#00b6ff);color:#fff;margin-left:auto}
  @media(prefers-color-scheme:dark){.m-msg.bot{background:rgba(40,40,50,0.9);color:#f2f2f2}}
  #motoai-suggest{display:flex;gap:8px;padding:8px 12px;border-top:1px solid rgba(0,0,0,0.06);background:linear-gradient(180deg,rgba(255,255,255,0.88),rgba(255,255,255,0.94));justify-content:center}
  #motoai-suggest-inner{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}
  .m-sug-btn{pointer-events:auto;border:0;background:#f0f3f8;padding:8px 12px;border-radius:10px;cursor:pointer;color:var(--accent);font-weight:600}
  .m-sug-btn:hover{background:var(--accent);color:#fff}
  #motoai-input{display:flex;gap:8px;padding:10px 12px;border-top:1px solid rgba(0,0,0,0.06);background:linear-gradient(180deg,rgba(255,255,255,0.9),rgba(255,255,255,0.95))}
  #motoai-input input{flex:1;padding:12px 14px;border-radius:12px;border:1px solid #d6dde6;font-size:16px;outline:none}
  #motoai-input button{pointer-events:auto;background:var(--accent);border:0;color:#fff;padding:10px 14px;border-radius:10px;font-weight:700;cursor:pointer}
  .m-typing{display:inline-block;width:48px;height:24px;border-radius:12px;background:rgba(0,0,0,0.06);padding:6px 8px}
  .m-dot{display:inline-block;width:6px;height:6px;background:rgba(0,0,0,0.4);border-radius:50%;margin:0 3px;opacity:0.2;animation:m-dot 1s infinite}
  .m-dot:nth-child(2){animation-delay:.15s}.m-dot:nth-child(3){animation-delay:.3s}
  @keyframes m-dot{0%{opacity:.15;transform:translateY(0)}50%{opacity:1;transform:translateY(-3px)}100%{opacity:.15;transform:translateY(0)}}
  @media(prefers-color-scheme:dark){.m-dot{background:rgba(255,255,255,0.7)}}
  `;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  // DOM refs
  const $ = sel => document.querySelector(sel);
  const root = $('#motoai-root'), bubble = $('#motoai-bubble'), backdrop = $('#motoai-backdrop'), card = $('#motoai-card');
  const bodyEl = $('#motoai-body'), inputEl = $('#motoai-input-el'), sendBtn = $('#motoai-send');
  const suggestInner = document.getElementById('motoai-suggest-inner');
  const exportBtn = $('#motoai-export'), clearBtn = $('#motoai-clear'), minBtn = $('#motoai-min');

  // local helpers for embed
  function renderMessagesFromCore(){
    const core = window.MotoAICore_v6;
    if(!core) return;
    const mem = core.memory || [];
    bodyEl.innerHTML = '';
    mem.forEach(m=>{
      const d = document.createElement('div');
      d.className = 'm-msg ' + (m.role === 'user' ? 'user' : 'bot');
      d.textContent = m.text;
      bodyEl.appendChild(d);
    });
    bodyEl.scrollTop = bodyEl.scrollHeight;
  }

  function showTyping(){
    const wrap = document.createElement('div');
    wrap.className = 'm-msg bot';
    wrap.innerHTML = '<span class="m-typing"><span class="m-dot"></span><span class="m-dot"></span><span class="m-dot"></span></span>';
    bodyEl.appendChild(wrap);
    bodyEl.scrollTop = bodyEl.scrollHeight;
    return wrap;
  }

  function ensureCoreThen(cb){
    if(window.MotoAICore_v6) return cb && cb();
    loadCore(cb);
  }

  // ask flow uses core.answer, core.pushMemory, core.smartReplies
  async function ask(q){
    if(!q || !q.trim()) return;
    ensureCoreThen(async function(){
      const core = window.MotoAICore_v6;
      // store user message in core memory and render
      core.pushMemory({role:'user', text:q.trim()});
      renderMessagesFromCore();
      inputEl.value = '';
      sendBtn.disabled = true;
      // show typing according to length
      const typingNode = showTyping();
      const base = 700 + Math.random()*800;
      const factor = Math.min(1200, q.length * 40);
      const delay = Math.round(base + factor * 0.5);
      await new Promise(r => setTimeout(r, delay));
      // remove typing
      if(typingNode && typingNode.parentNode) typingNode.parentNode.removeChild(typingNode);
      // compute answer
      const raw = core.answer(q);
      // stylize by detected tone
      const tone = core.detectTone(q);
      const answer = core.stylizeReply ? core.stylizeReply(raw, tone) : raw;
      core.pushMemory({role:'bot', text: answer});
      renderMessagesFromCore();
      // suggestions
      const sug = core.smartReplies(answer) || [];
      renderSuggestions(sug);
      sendBtn.disabled = false;
    });
  }

  function renderSuggestions(arr){
    suggestInner.innerHTML = '';
    if(!arr || !arr.length) return;
    arr.slice(0,5).forEach(t=>{
      const b = document.createElement('button');
      b.className = 'm-sug-btn';
      b.textContent = t;
      b.addEventListener('click', ()=> ask(t));
      suggestInner.appendChild(b);
    });
  }

  // controls: clear, export, min
  function clearConversation(){
    if(!window.MotoAICore_v6) return;
    if(!confirm('Xóa toàn bộ cuộc trò chuyện?')) return;
    window.MotoAICore_v6.clearMemory();
    renderMessagesFromCore();
    renderSuggestions(['Xe số','Xe ga','Thủ tục']);
  }
  function exportConversation(){
    if(!window.MotoAICore_v6) return;
    const data = window.MotoAICore_v6.exportMemory();
    const blob = new Blob([data], {type:'application/json;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'motoai_v6_memory.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // open/close
  function openCard(){
    card.classList.add('open');
    backdrop.classList.add('show');
    root.style.pointerEvents = 'auto';
    card.setAttribute('aria-hidden','false');
    bubble.style.display = 'none';
    ensureCoreThen(()=>{
      // add current page to corpus automatically (site learning)
      try{ window.MotoAICore_v6.addCurrentPage(); }catch(e){}
      renderMessagesFromCore();
      renderSuggestions(['Xe số','Xe ga','Thủ tục']);
      setTimeout(()=> inputEl.focus(), 250);
    });
  }
  function closeCard(){
    card.classList.remove('open');
    backdrop.classList.remove('show');
    root.style.pointerEvents = 'none';
    card.setAttribute('aria-hidden','true');
    bubble.style.display = 'flex';
    bubble.focus();
  }

  // attach events
  bubble.addEventListener('click', openCard);
  backdrop.addEventListener('click', closeCard);
  sendBtn.addEventListener('click', ()=> ask(inputEl.value));
  inputEl.addEventListener('keydown', e => { if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); ask(inputEl.value); } if(e.key==='Escape') closeCard(); });

  exportBtn && exportBtn.addEventListener('click', exportConversation);
  clearBtn && clearBtn.addEventListener('click', clearConversation);
  minBtn && minBtn.addEventListener('click', ()=> {
    // toggle minified mode: hide card but keep bubble
    closeCard();
    // additional min behavior could be implemented here
  });

  // smart position for floating widgets
  function adjustPosition(){
    let bottom = 120;
    if(document.querySelector('.quick-call-game, .quick-call, .quick-sub')) bottom = 180;
    if(document.querySelector('.back-top')) bottom = Math.max(bottom, 200);
    if(window.innerWidth < 520) bottom = Math.max(bottom, 140);
    root.style.bottom = bottom + 'px';
  }
  adjustPosition();
  window.addEventListener('resize', adjustPosition);
  window.addEventListener('orientationchange', ()=> setTimeout(adjustPosition, 300));

  // initial: load core so corpus and memory are inited
  loadCore(() => {
    try{
      if(window.MotoAICore_v6){
        // render initial memory
        renderMessagesFromCore();
        renderSuggestions(['Xe số','Xe ga','Thủ tục']);
      }
    }catch(e){}
  });

  // expose debug API
  window.MotoAI_v6 = {
    ask: (q)=> ask(q),
    open: openCard,
    close: closeCard,
    clear: clearConversation,
    export: exportConversation,
    coreLoaded: ()=> !!window.MotoAICore_v6,
    debug: ()=> window.MotoAICore_v6 ? window.MotoAICore_v6.debug() : {loaded:false}
  };

  console.log('MotoAIEmbed_v6 loaded (embed).');
})();
