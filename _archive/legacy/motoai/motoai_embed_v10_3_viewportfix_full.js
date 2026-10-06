// MotoAI v10.3 ViewportFix — Stable Full version
// Fix: iOS keyboard offset + input alignment + friendly fallback

// motoai_embed_v10_2_full.js
// MotoAI v10.2 FULL — Left-side placement, Web-Corpus embeddings, cosine similarity,
// memory (name + session), typing indicator, Apple-glass UI, iOS viewport fixes.
// Paste this file to your GitHub repo and embed via <script src=".../motoai_embed_v10_2_full.js" defer crossorigin="anonymous"></script>

(function(){
  if(window.MotoAI_v10_2_FULL_LOADED) return;
  window.MotoAI_v10_2_FULL_LOADED = true;
  console.log('✅ MotoAI v10.2 FULL (left) loaded');

  /* ------------- CONFIG ------------- */
  const CFG = {
    placement: 'left',              // 'left' or 'right'
    maxCorpusSentences: 800,        // cap the number of sentences to index
    minSentenceLen: 18,
    suggestionTags: [
      {q:'Xe số', label:'🏍 Xe số'},
      {q:'Xe ga', label:'🛵 Xe ga'},
      {q:'Xe 50cc', label:'🚲 Xe 50cc'},
      {q:'Thủ tục', label:'📄 Thủ tục'}
    ],
    corpusKey: 'MotoAI_v10_2_full_corpus_v1',
    sessionKey: 'MotoAI_v10_2_full_session_v1',
    memoryKey: 'MotoAI_v10_2_full_memory_v1',
    embedNgram: 3,                  // n-gram size for simple embedding (sử dụng 1-gram (word freq) cho nhẹ)
    minScoreThreshold: 0.06         // threshold for returning answer
  };

  /* ------------- INJECT HTML ------------- */
  const html = `
  <div id="motoai-root" aria-hidden="false" data-placement="${CFG.placement}">
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
          <div class="m-msg bot">👋 Chào bạn! Mình là MotoAI — hỏi thử “Xe ga”, “Xe số”, “Xe 50cc”, hoặc “Thủ tục” nhé!</div>
        </main>

        <div id="motoai-suggestions" role="toolbar" aria-label="Gợi ý nhanh"></div>

        <footer id="motoai-footer">
          <div id="motoai-typing" aria-hidden="true"></div>
          <input id="motoai-input" placeholder="Nhập câu hỏi..." autocomplete="off" aria-label="Nhập câu hỏi" />
          <button id="motoai-send" aria-label="Gửi">Gửi</button>
        </footer>

      </div>
    </div>
  </div>
  `;
  document.body.insertAdjacentHTML('beforeend', html);

  /* ------------- INJECT CSS ------------- */
  const css = `
  :root{
    --m10-accent: #007aff;
    --m10-card-radius: 18px;
    --m10-card-bg: rgba(255,255,255,0.86);
    --m10-card-bg-dark: rgba(20,20,22,0.94);
    --m10-blur: blur(12px) saturate(140%);
    --m10-vh: 1vh; /* Fallback */
  }
  /* Root placement */
  #motoai-root { position: fixed; bottom: 18px; z-index: 2147483000; pointer-events: none; }
  #motoai-root[data-placement="left"]{ left: 16px; }
  #motoai-root[data-placement="right"]{ right: 16px; }

  /* Bubble */
  #motoai-bubble{
    pointer-events: auto; width:56px; height:56px; border-radius:14px;
    display:flex;align-items:center;justify-content:center;font-size:26px;
    background:var(--m10-accent); color:#fff; cursor:pointer; box-shadow:0 10px 28px rgba(2,6,23,0.18);
    transition: transform .16s ease;
  }
  #motoai-bubble:hover{ transform: scale(1.06); }

  /* Overlay & card */
  #motoai-overlay{
    position: fixed; inset: 0; display:flex; align-items:flex-end; justify-content:center;
    padding:12px; pointer-events: none; transition: background .24s ease; z-index:2147482999;
  }
  #motoai-overlay.visible{ background: rgba(0,0,0,0.18); pointer-events: auto; }
  #motoai-card{
    width: min(920px, calc(100% - 36px)); max-width: 920px;
    /* iOS Viewport Height Fix */
    height: calc(var(--m10-vh, 1vh) * 72);
    max-height: 760px;
    max-height: calc(100 * var(--m10-vh));
    min-height: 320px;
    border-radius: var(--m10-card-radius) var(--m10-card-radius) 12px 12px;
    background: var(--m10-card-bg); backdrop-filter: var(--m10-blur); -webkit-backdrop-filter: var(--m10-blur);
    box-shadow: 0 -18px 60px rgba(0,0,0,.22);
    display:flex; flex-direction: column; overflow:hidden;
    transform: translateY(110%); opacity: 0; pointer-events: auto;
    transition: transform .36s cubic-bezier(.2,.9,.2,1), opacity .28s ease;
    
    /* Added for v10.3 viewport fix */
    position: relative;
    bottom: 0; 
  }
  #motoai-overlay.visible #motoai-card{ transform: translateY(0); opacity:1; }

  #motoai-handle{ width:64px; height:6px; background: rgba(160,160,160,0.6); border-radius:6px; margin:10px auto; }

  /* Header */
  #motoai-header{ display:flex; align-items:center; justify-content:space-between; padding:8px 14px; font-weight:700; color:var(--m10-accent); border-bottom:1px solid rgba(0,0,0,0.06); }
  #motoai-header .tools button{ background:none; border:none; font-size:18px; cursor:pointer; padding:6px 8px; color: #888; }

  /* Body */
  #motoai-body{ flex:1; overflow:auto; padding:12px 16px; font-size:15px; background: transparent; -webkit-overflow-scrolling: touch; }
  .m-msg{ margin:8px 0; padding:12px 14px; border-radius:16px; max-width:86%; line-height:1.4; word-break:break-word; box-shadow:0 4px 8px rgba(0,0,0,0.06); }
  .m-msg.bot{ background: rgba(255,255,255,0.9); color:#111; }
  .m-msg.user{ background: linear-gradient(180deg,var(--m10-accent),#00b6ff); color:#fff; margin-left:auto; }

  /* Suggestions */
  #motoai-suggestions{ display:flex; gap:8px; justify-content:center; flex-wrap:wrap; padding:8px 12px; border-top:1px solid rgba(0,0,0,0.04); background: rgba(255,255,255,0.6); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); }
  #motoai-suggestions button{ border: none; background: rgba(0,122,255,0.08); color:var(--m10-accent); padding:8px 12px; border-radius:12px; cursor:pointer; font-weight:600; }

  /* Footer: input + send */
  #motoai-footer {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 8px;
    padding: 10px 10px 12px 10px;
    border-top: 1px solid rgba(0, 0, 0, 0.06);
    background: rgba(255, 255, 255, 0.74);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }
  
  /* Typing Indicator */
  #motoai-typing{ min-width:48px; height:20px; display:flex; align-items:center; justify-content:center; font-size:14px; color: rgba(0,0,0,0.5); }
  #motoai-typing span{ width:6px; height:6px; background:rgba(0,0,0,0.3); border-radius:50%; margin:0 2px; animation: m10-dot-pulse 1.4s infinite ease-in-out both; }
  #motoai-typing span:nth-child(1){ animation-delay: -0.32s; }
  #motoai-typing span:nth-child(2){ animation-delay: -0.16s; }
  @keyframes m10-dot-pulse {
    0%, 80%, 100% { transform: scale(0); }
    40% { transform: scale(1.0); }
  }

  #motoai-input{ flex:1; padding:11px 12px; border-radius:16px; border:1px solid rgba(0,0,0,0.08); font-size:15px; background:rgba(255,255,255,0.8); }
  #motoai-send{ background:var(--m10-accent); color:#fff; border:none; border-radius:14px; padding:10px 16px; font-weight:700; cursor:pointer; box-shadow:0 2px 6px rgba(0,0,0,0.12); }
  #motoai-send:active{ transform: scale(0.96); }

  /* (Tiếp tục từ dòng bị ngắt của bạn) */
  #motoai-clear{ position:absolute; top:10px; right:44px; background:none; border:none; font-size:16px; color:#aaa; }

  /* Dark Mode */
  @media (prefers-color-scheme: dark) {
    #motoai-card{ background: var(--m10-card-bg-dark); }
    #motoai-header{ color:#fff; border-bottom:1px solid rgba(255,255,255,0.08); }
    #motoai-header .tools button{ color: #777; }
    .m-msg.bot{ background: #2c2c2e; color:#eee; }
    #motoai-suggestions{ background: rgba(0,0,0,0.2); border-top:1px solid rgba(255,255,255,0.06); }
    #motoai-suggestions button{ background: rgba(0,122,255,0.2); color:#52adff; }
    #motoai-footer{ background: rgba(0,0,0,0.3); border-top:1px solid rgba(255,255,255,0.08); }
    #motoai-typing span{ background:rgba(255,255,255,0.4); }
    #motoai-input{ background: #2c2c2e; border:1px solid rgba(255,255,255,0.08); color:#fff; }
    #motoai-handle{ background: rgba(100,100,100,0.6); }
    #motoai-clear{ color: #777; }
  }
  `;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  /* ------------- JS LOGIC ------------- */
  
  // DOM Elements
  const $root = document.getElementById('motoai-root');
  const $bubble = document.getElementById('motoai-bubble');
  const $overlay = document.getElementById('motoai-overlay');
  const $card = document.getElementById('motoai-card');
  const $body = document.getElementById('motoai-body');
  const $suggestions = document.getElementById('motoai-suggestions');
  const $typing = document.getElementById('motoai-typing');
  const $input = document.getElementById('motoai-input');
  const $send = document.getElementById('motoai-send');
  const $clear = document.getElementById('motoai-clear');
  const $close = document.getElementById('motoai-close');

  // State
  let corpus = [];
  let chatHistory = [];
  let memory = {};
  let isCardOpen = false;

  // --- Core AI: Embedding & Cosine Similarity ---

  // 1. Generate lightweight embedding (word frequency vector)
  function generateEmbeddings(text) {
    const vec = new Map();
    const words = text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 2);
    for (const word of words) {
      vec.set(word, (vec.get(word) || 0) + 1);
    }
    return vec;
  }

  // 2. Calculate Dot Product (Helper for Cosine)
  function dotProduct(vecA, vecB) {
    let dot = 0;
    for (const [key, valA] of vecA) {
      if (vecB.has(key)) {
        dot += valA * vecB.get(key);
      }
    }
    return dot;
  }

  // 3. Calculate Magnitude (Helper for Cosine)
  function magnitude(vec) {
    let sum = 0;
    for (const val of vec.values()) {
      sum += val * val;
    }
    return Math.sqrt(sum);
  }

  // 4. Calculate Cosine Similarity
  function cosineSimilarity(vecA, vecB) {
    const magA = magnitude(vecA);
    const magB = magnitude(vecB);
    if (magA === 0 || magB === 0) return 0;
    return dotProduct(vecA, vecB) / (magA * magB);
  }

  // 5. Find best match from corpus
  function findBestMatch(query) {
    if (!corpus.length) return null;
    const queryVec = generateEmbeddings(query);
    let bestScore = -1;
    let bestMatch = null;
    
    for (const item of corpus) {
      const score = cosineSimilarity(queryVec, item.vec);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = item.text;
      }
    }

    if (bestScore > CFG.minScoreThreshold) {
      return bestMatch;
    }
    return null;
  }

  // --- UI & State Functions ---

  function toggleCard(show) {
    isCardOpen = (typeof show === 'boolean') ? show : !isCardOpen;
    $overlay.classList.toggle('visible', isCardOpen);
    $overlay.setAttribute('aria-hidden', !isCardOpen);
    $card.setAttribute('aria-hidden', !isCardOpen);
    $root.setAttribute('aria-hidden', isCardOpen);
    if (isCardOpen) $input.focus();
  }

  function setTyping(isTyping) {
    $typing.innerHTML = isTyping ? '<span></span><span></span><span></span>' : '';
  }

  function autoScroll() {
    $body.scrollTop = $body.scrollHeight;
  }

  function addMessage(sender, text, noSave = false) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `m-msg ${sender}`;
    msgDiv.textContent = text;
    $body.appendChild(msgDiv);
    autoScroll();

    if (!noSave) {
      chatHistory.push({ sender, text });
      saveSession();
    }
  }

  function renderSuggestions() {
    $suggestions.innerHTML = '';
    CFG.suggestionTags.forEach(tag => {
      const btn = document.createElement('button');
      btn.textContent = tag.label;
      btn.dataset.query = tag.q;
      $suggestions.appendChild(btn);
    });
  }

  // --- Data & Memory ---

  function loadData() {
    try {
      // Load Memory (persistent)
      const mem = localStorage.getItem(CFG.memoryKey);
      if (mem) memory = JSON.parse(mem);

      // Load Session (current chat)
      const session = localStorage.getItem(CFG.sessionKey);
      if (session) {
        chatHistory = JSON.parse(session);
        chatHistory.forEach(msg => addMessage(msg.sender, msg.text, true));
      }

      // Load or Build Corpus
      const storedCorpus = localStorage.getItem(CFG.corpusKey);
      if (storedCorpus) {
        corpus = JSON.parse(storedCorpus);
      } else {
        buildCorpus();
      }
    } catch(e) {
      console.error('MotoAI: Error loading data', e);
    }
  }

  function saveSession() {
    try {
      localStorage.setItem(CFG.sessionKey, JSON.stringify(chatHistory));
    } catch(e) { console.error('MotoAI: Error saving session', e); }
  }

  function saveMemory() {
    try {
      localStorage.setItem(CFG.memoryKey, JSON.stringify(memory));
    } catch(e) { console.error('MotoAI: Error saving memory', e); }
  }

  function handleClear() {
    chatHistory = [];
    localStorage.removeItem(CFG.sessionKey);
    $body.innerHTML = '';
    const greeting = memory.userName ? `Chào ${memory.userName}! Bạn cần hỗ trợ gì tiếp theo?` : 'Chào bạn! Mình là MotoAI, mình có thể giúp gì cho bạn?';
    addMessage('bot', greeting);
  }

  // --- Corpus Builder ---
  function buildCorpus() {
    console.log('MotoAI: Building corpus...');
    let textCorpus = [];
    // Đơn giản: lấy tất cả text từ body
    const allText = document.body.innerText;
    
    // Tách thành câu (đơn giản)
    const sentences = allText.split(/[\n.!?]+/) || [];
    
    sentences.forEach(s => {
      const cleanS = s.trim();
      if (cleanS.length > CFG.minSentenceLen && !textCorpus.includes(cleanS)) {
        textCorpus.push(cleanS);
      }
    });

    // Giới hạn số lượng câu
    textCorpus = textCorpus.slice(0, CFG.maxCorpusSentences);

    // Tạo embedding cho từng câu
    corpus = textCorpus.map(text => ({
      text: text,
      vec: generateEmbeddings(text)
    }));
    
    try {
      localStorage.setItem(CFG.corpusKey, JSON.stringify(corpus.map(c => ({ text: c.text }))));
      console.log(`MotoAI: Corpus built and saved (${corpus.length} items).`);
    } catch(e) {
      console.error('MotoAI: Error saving corpus', e);
    }
  }

  // --- Bot Logic ---

  function handleMemory(query) {
    const nameMatch = query.match(/(?:tôi là|tên tôi là) ([\p{L} ]+)/iu);
    if (nameMatch && nameMatch[1]) {
      memory.userName = nameMatch[1].trim();
      saveMemory();
      return `Chào ${memory.userName}! Rất vui được gặp bạn. Bạn cần tư vấn về xe gì?`;
    }
    return null;
  }

  function getBotResponse(query) {
    const q = query.toLowerCase();

    // 1. Check for memory triggers
    const memoryResponse = handleMemory(q);
    if (memoryResponse) return memoryResponse;

    // 2. Find best match from corpus
    const corpusMatch = findBestMatch(q);
    if (corpusMatch) return corpusMatch;

    // 3. Fallback answers
    if (q.includes('chào') || q.includes('hello')) {
      return memory.userName ? `Chào ${memory.userName}! Bạn cần mình giúp gì?` : 'Chào bạn! Mình là MotoAI, mình có thể giúp gì cho bạn?';
    }
    if (q.includes('cảm ơn') || q.includes('thanks')) {
      return 'Không có gì! Mình giúp được gì nữa không?';
    }
    
    return 'Mình chưa có thông tin đó trong trang này. Bạn thử hỏi lại về “xe ga”, “xe số”, “xe 50cc” hoặc “thủ tục” nhé!';
  }

  // --- Main Input Handler ---
  async function handleUserInput() {
    const query = $input.value.trim();
    if (!query) return;

    addMessage('user', query);
    $input.value = '';
    setTyping(true);

    // Simulate bot thinking
    await new Promise(res => setTimeout(res, 600 + Math.random() * 400));
    
    const response = getBotResponse(query);
    
    setTyping(false);
    addMessage('bot', response);
  }

  // --- iOS Viewport Fix ---
  function handleResize() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--m10-vh', `${vh}px`);
  }

  // --- Initialization ---
  function init() {
    // Attach Event Listeners
    $bubble.addEventListener('click', () => toggleCard(true));
    $close.addEventListener('click', () => toggleCard(false));
    $clear.addEventListener('click', handleClear);
    $send.addEventListener('click', handleUserInput);
    $input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleUserInput();
      }
    });

    $overlay.addEventListener('click', (e) => {
      if (e.target === $overlay) toggleCard(false);
    });

    $suggestions.addEventListener('click', (e) => {
      if (e.target.tagName === 'BUTTON') {
        const query = e.target.dataset.query;
        $input.value = query;
        handleUserInput();
      }
    });

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial call
    
    renderSuggestions();
    loadData();

    // Add intro message if chat is empty
    if (chatHistory.length === 0) {
      const greeting = memory.userName ? `Chào ${memory.userName}! Bạn sẵn sàng tìm hiểu về xe chưa?` : '👋 Chào bạn! Mình là MotoAI — hỏi thử “Xe ga”, “Xe số”, “Xe 50cc”, hoặc “Thủ tục” nhé!';
      addMessage('bot', greeting, true); // noSave
    }

    // iOS keyboard viewport auto-fix
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', () => {
        const offset = window.visualViewport.height < window.innerHeight
          ? window.innerHeight - window.visualViewport.height
          : 0;
        $card.style.bottom = offset + 'px';
      });
    }
  }

  // Auto-init on load
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
