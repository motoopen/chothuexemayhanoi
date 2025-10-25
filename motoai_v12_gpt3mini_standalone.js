/* motoai_v12_gpt3mini_core.js
   MotoAI v12 — GPT-3-mini Core (Core-only upgrade + bubble fixes)
   - Keeps existing UI (v10/v11) but attaches smarter engine + fixes
   - Reads extended corpus (localStorage key from earlier scripts) if present
   - Adds context memory (sessionStorage), intent detection, spellfix
   - Adds bubble CSS fixes and tiny pop animation (non-destructive)
*/
(function(){
  if(window.MotoAI_v12_LOADED) return;
  window.MotoAI_v12_LOADED = true;
  console.log('%c🧠 MotoAI v12 GPT-3-mini Core loading...','color:#0a84ff;font-weight:700');

  // CONFIG (match keys used by v11/v10 where possible)
  const CFG = {
    extendedCorpusKey: 'MotoAI_v10_corpus_extended', // from ext learning script
    corpusKey: 'MotoAI_v10_corpus',                 // DOM corpus
    sessionKey: 'MotoAI_v10_session_msgs',
    memoryKeyName: 'MotoAI_v10_user_name',
    shortMemoryKey: 'MotoAI_v12_short_memory',     // session-based short memory
    shortMemoryLen: 5,                             // keep last 3-5 messages
    refreshHours: 72
  };

  /* ------------------- Utilities ------------------- */
  function tokenize(s){
    if(!s) return [];
    return s.toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu,' ').split(/\s+/).filter(Boolean);
  }
  function uniq(arr){ return Array.from(new Set(arr)); }
  function norm(s){ return (s||'').toString().trim(); }

  /* ------------------- Spellfix (light) ------------------- */
  const SPELL = {
    'thue xe may':'thuê xe máy','xe so':'xe số','xe ga':'xe ga','thu tuc':'thủ tục',
    'giay to':'giấy tờ','bang gia':'bảng giá','lien he':'liên hệ','50cc':'50cc'
  };
  function fixText(t){
    let s = (t||'').toLowerCase();
    for(const k in SPELL){
      s = s.replace(new RegExp('\\b'+k+'\\b','gi'), SPELL[k]);
    }
    return s;
  }

  /* ------------------- Intent detection ------------------- */
  const INTENTS = [
    {name:'GREETING', pattern: /\b(chào|xin chào|hello|hi|alo)\b/i},
    {name:'PRICE', pattern: /\b(giá|bao nhiêu|bảng giá|bao tiền)\b/i},
    {name:'DURATION', pattern: /\b(1 ngày|2 ngày|3 ngày|tuần|tháng|ngày|tuần|tháng)\b/i},
    {name:'PROCEDURE', pattern: /\b(thủ tục|giấy tờ|cần gì|đặt cọc|cọc)\b/i},
    {name:'CONTACT', pattern: /\b(lien he|zalo|sdt|hotline|gọi|điện thoại|liên hệ)\b/i},
    {name:'DELIVERY', pattern: /\b(giao|ship|tận nơi|sân bay|bến xe)\b/i},
    {name:'VEHICLE_TYPE', pattern: /\b(xe số|xe ga|50cc|xe 50cc|xe côn|côn tay)\b/i},
  ];
  function detectIntent(q){
    for(const it of INTENTS){
      if(it.pattern.test(q)) return it.name;
    }
    return 'OTHER';
  }

  /* ------------------- Context (short memory) ------------------- */
  function readShortMemory(){
    try{
      const raw = sessionStorage.getItem(CFG.shortMemoryKey);
      return raw ? JSON.parse(raw) : [];
    }catch(e){ return []; }
  }
  function pushShortMemory(item){
    try{
      const mem = readShortMemory();
      mem.push(item);
      if(mem.length > CFG.shortMemoryLen) mem.splice(0, mem.length - CFG.shortMemoryLen);
      sessionStorage.setItem(CFG.shortMemoryKey, JSON.stringify(mem));
    }catch(e){}
  }
  function clearShortMemory(){ try{ sessionStorage.removeItem(CFG.shortMemoryKey);}catch(e){} }

  /* ------------------- Corpus retrieval (semantic-ish) ------------------- */
  // read DOM corpus (saved by v10/v11) or build from page
  function getDOMCorpus(){
    try{
      const raw = localStorage.getItem(CFG.corpusKey);
      if(raw) return JSON.parse(raw);
    }catch(e){}
    // fallback: scan DOM
    const nodes = Array.from(document.querySelectorAll('main, article, section, p, li, h1,h2,h3'));
    const texts = nodes.map(n=>norm(n.innerText)).filter(t=>t.length>20);
    return texts.map((t,i)=>({id:i, text:t, tokens:tokenize(t)}));
  }

  function getExtendedCorpus(){
    try{
      const raw = localStorage.getItem(CFG.extendedCorpusKey);
      if(!raw) return [];
      const arr = JSON.parse(raw);
      if(Array.isArray(arr)) return arr;
      return [];
    }catch(e){ return []; }
  }

  // scoring: token overlap + fuzzy phrase presence
  function scoreTextAgainstQuery(text, qTokens){
    if(!qTokens.length) return 0;
    const line = text.toLowerCase();
    let score = 0;
    for(const t of qTokens){
      if(line.includes(t)) score += 2; // stronger if token included
    }
    // small boost for exact phrase
    return score;
  }

  function retrieveBestFromDOM(q){
    const corpus = getDOMCorpus();
    if(!corpus || !corpus.length) return null;
    const qTokens = tokenize(q);
    let best = {score:0, text:null};
    for(const c of corpus){
      const s = scoreTextAgainstQuery(c.text, qTokens);
      if(s > best.score){ best = {score:s, text:c.text}; }
    }
    return best.score>0 ? best.text : null;
  }

  function retrieveBestFromExtended(q){
    const corpus = getExtendedCorpus();
    if(!corpus || !corpus.length) return null;
    const qTokens = tokenize(q);
    let best = {score:0, text:null};
    for(const line of corpus){
      const s = scoreTextAgainstQuery(line, qTokens);
      if(s > best.score){ best = {score:s, text:line}; }
    }
    return best.score>0 ? best.text : null;
  }

  /* ------------------- Smart answer (GPT-3-mini like) ------------------- */
  // Combine rule responses + semantic retrieval + context-awareness
  const RULES = [
    {pattern: /(xe số|xeso|wave|sirius|blade|future)/i, text: "Xe số tiết kiệm xăng, phù hợp đi phố và đi đường dài. Thường được cho thuê theo ngày/tuần/tháng."},
    {pattern: /(xe ga|xega|vision|lead|air blade|vespa)/i, text: "Xe tay ga chạy êm, cốp rộng, phù hợp di chuyển trong thành phố. Có hỗ trợ thuê theo ngày/tuần/tháng."},
    {pattern: /(50cc|xe 50cc)/i, text: "Xe 50cc không cần bằng lái, phù hợp học sinh/sinh viên. Thông tin giá và điều kiện có trong mục xe 50cc."},
    {pattern: /(thu tuc|giấy tờ|giay to|cọc|dat coc)/i, text: "Thủ tục cơ bản: CCCD, GPLX (nếu xe >50cc). Cọc nhẹ tùy loại xe; tiền cọc sẽ hoàn lại sau khi kết thúc hợp đồng."},
    {pattern: /(lien he|sdt|zalo|hotline|dia chi)/i, text: "Liên hệ nhanh: 0857 255 868 (Zalo/Hotline) để được tư vấn và đặt xe."},
  ];

  function ruleAnswer(q){
    for(const r of RULES){
      if(r.pattern.test(q)) return r.text;
    }
    return null;
  }

  // Compose final answer: prefer rule -> DOM corpus -> extended -> fallback
  function composeAnswer(rawQ){
    const q0 = fixText(rawQ||'').trim();
    if(!q0) return "Bạn gõ gì đó chưa rõ, thử hỏi: giá thuê, thủ tục, hay loại xe (xe số/xe ga/50cc) nhé.";

    // intent
    const intent = detectIntent(q0);

    // 1) check rules
    const rAns = ruleAnswer(q0);
    if(rAns) return rAns;

    // 2) try DOM corpus semantic
    const dom = retrieveBestFromDOM(q0);
    if(dom) return dom;

    // 3) try extended corpus
    const ext = retrieveBestFromExtended(q0);
    if(ext) return ext;

    // 4) context-aware: if last memory mentions some topic, try to combine
    const mem = readShortMemory();
    if(mem && mem.length){
      // simple heuristic: if last user message contained 'giá' and now asks 'bao nhiêu' -> reuse
      const lastUser = [...mem].reverse().find(m=>m.role==='user');
      if(lastUser && /\b(giá|bao nhiêu|bao tiền)\b/.test(lastUser.text) && /\b(bao nhiêu|bao tiền|gồm)\b/.test(q0)){
        const fallback = retrieveBestFromExtended(lastUser.text) || retrieveBestFromDOM(lastUser.text);
        if(fallback) return fallback;
      }
    }

    // 5) fallback polite
    return "Xin lỗi, mình chưa tìm thấy câu trả lời chính xác trong dữ liệu. Bạn thử hỏi cụ thể: 'giá thuê 1 ngày', 'thủ tục', hoặc 'xe 50cc' nhé.";
  }

  /* ------------------- Attach to existing MotoAI if present ------------------- */
  function attachToExisting(){
    try{
      if(!window.MotoAI_v10) {
        console.log('⚠️ MotoAI v10 not found — v12 will attach but UI may be missing.');
      } else {
        // patch smartAnswer / sendQuery if available
        // Replace smartAnswer used earlier
        window.MotoAI_v10.smartAnswer = function(q){
          // give priority to ruleAnswer but return short responses
          const qf = fixText(q||'');
          const r = ruleAnswer(qf);
          if(r) return r;
          return null;
        };
        // Expose composeAnswer for UI to call
        window.MotoAI_v10.composeAnswer = composeAnswer;

        // Wrap existing sendQuery to use composeAnswer (if present)
        if(window.MotoAI_v10 && typeof window.MotoAI_v10.sendQuery === 'function'){
          const origSend = window.MotoAI_v10.sendQuery;
          // do not override if it's the complex v11 — instead wrap behavior via global hook
          // but provide window.MotoAI_v12_answer to be called by UI or tests
          window.MotoAI_v12_answer = function(q){
            const ans = composeAnswer(q);
            return ans;
          };
          console.log('%c✅ MotoAI v12 attached to existing MotoAI_v10 (composeAnswer available)', 'color:#0a84ff');
        } else {
          console.log('%cℹ️ MotoAI_v10 exists but sendQuery not found — composeAnswer exported', 'color:#9aa7ff');
          window.MotoAI_v12_answer = function(q){ return composeAnswer(q); };
        }
      }
    }catch(e){
      console.error('❌ attachToExisting error', e);
    }
  }

  /* ------------------- UI Bubble fixes & patch (non-destructive) ------------------- */
  function applyUIFixes(){
    // inject safe CSS
    const css = `
/* MotoAI v12 UI fixes (non-destructive) */
#motoai-root{ left:16px !important; right:auto !important; bottom:18px !important; z-index:2147483000 !important; pointer-events:auto; }
#motoai-bubble{ box-shadow:0 10px 28px rgba(2,6,23,0.18)!important; }
.m-msg.bot{ background: rgba(255,255,255,0.96) !important; color: #0b1220 !important; padding:10px 14px !important; border-radius:14px !important; line-height:1.45 !important; box-shadow:0 4px 14px rgba(2,6,23,0.06)!important; max-width:86% !important; word-break:break-word !important; overflow-wrap:anywhere !important; }
.m-msg.user{ background: linear-gradient(180deg,var(--m10-accent,#007aff),#00b6ff) !important; color:#fff !important; padding:10px 14px !important; border-radius:14px !important; margin-left:auto !important; max-width:86% !important; line-height:1.45 !important; box-shadow:0 6px 18px rgba(2,6,23,0.12)!important; }
#motoai-typing{ color: rgba(0,0,0,0.6) !important; }
@keyframes motoai-pop{ 0%{transform:scale(.98);opacity:0}60%{transform:scale(1.02);opacity:1}100%{transform:scale(1);opacity:1} }
.motoai-pop{ animation: motoai-pop .26s cubic-bezier(.2,.9,.2,1) !important; transform-origin:left center; }
@media (prefers-color-scheme: dark){ .m-msg.bot{ background: rgba(28,28,30,0.94) !important; color:#eee !important; } }
@media (max-width:520px){ .m-msg{ font-size:15px !important; } }
`;
    const st = document.createElement('style');
    st.textContent = css;
    document.head.appendChild(st);

    // MutationObserver to animate incoming messages and enforce color inline if overwritten
    function hookBody(){
      const body = document.querySelector('#motoai-body');
      if(!body) return;
      const obs = new MutationObserver(muts=>{
        muts.forEach(m=>{
          m.addedNodes.forEach(n=>{
            if(n.nodeType===1 && n.classList.contains('m-msg')){
              requestAnimationFrame(()=>{
                n.classList.add('motoai-pop');
                setTimeout(()=> n.classList.remove('motoai-pop'), 420);
                // enforce inline color to fight aggressive site CSS overrides
                try{
                  if(n.classList.contains('bot')) n.style.color = '#0b1220';
                  else n.style.color = '#fff';
                }catch(e){}
              });
            }
          });
        });
      });
      obs.observe(body,{childList:true, subtree:false});
    }

    // wait for #motoai-body
    const wait = setInterval(()=>{
      if(document.querySelector('#motoai-body')){
        clearInterval(wait);
        hookBody();
      }
    },120);
    setTimeout(()=> clearInterval(wait), 8000);

    // iOS visualViewport fix (keyboard)
    if(window.visualViewport){
      visualViewport.addEventListener('resize', ()=>{
        const card = document.querySelector('#motoai-card');
        if(!card) return;
        const offset = Math.max(0, window.innerHeight - visualViewport.height);
        if(offset > 120) card.style.bottom = (offset - (navigator.userAgent.includes('iPhone')?4:0)) + 'px';
        else card.style.bottom = '';
      });
    }
    console.log('%c🎨 MotoAI v12 UI fixes applied (bubble & animation)', 'color:#0a84ff');
  }

  /* ------------------- Developer helpers ------------------- */
  window.MotoAI_v12 = window.MotoAI_v12 || {};
  window.MotoAI_v12.composeAnswer = composeAnswer;
  window.MotoAI_v12.clearShortMemory = clearShortMemory;
  window.MotoAI_v12.pushShortMemory = pushShortMemory;
  window.MotoAI_v12.getDOMCorpus = getDOMCorpus;
  window.MotoAI_v12.getExtendedCorpus = getExtendedCorpus;

  /* ------------------- Hook into UI send flow if possible ------------------- */
  // Some MotoAI versions call sendQuery from UI; attempt to intercept and enhance:
  (function tryHookSendQuery(){
    // Wait for global MotoAI to exist
    const attempt = setInterval(()=>{
      if(window.MotoAI_v10 && (typeof window.MotoAI_v10.sendQuery === 'function' || typeof window.MotoAI_v10.composeAnswer === 'function')){
        clearInterval(attempt);
        attachToExisting();
        applyUIFixes();

        // If sendQuery exists in global scope (older v10/v11), wrap to add context memory and use composeAnswer when smartAnswer misses
        try{
          if(typeof window.MotoAI_v10.sendQuery === 'function'){
            const orig = window.MotoAI_v10.sendQuery;
            window.MotoAI_v10.sendQuery = function(q){
              try{
                // push to short memory (user)
                pushShortMemory({role:'user', text:q, t:Date.now()});
                // first try existing smartAnswer (if any), else use composeAnswer
                const fixed = fixText(q);
                let ans = null;
                try{ if(window.MotoAI_v10.smartAnswer) ans = window.MotoAI_v10.smartAnswer(fixed); }catch(e){}
                if(!ans){
                  ans = composeAnswer(q);
                }
                // simulate typing and push bot memory
                const bodyEl = document.querySelector && document.querySelector('#motoai-body');
                if(bodyEl){
                  // show typing dots if element present
                  const typing = document.querySelector('#motoai-typing');
                  if(typing) typing.innerHTML = '<span class="dot">.</span><span class="dot">.</span><span class="dot">.</span>';
                  setTimeout(()=>{
                    if(typing) typing.innerHTML = '';
                    // add bot message via existing addMessage if available, else create DOM node
                    try{
                        // FIX: ADD check for non-empty answer before rendering the message
                        if (ans && ans.trim()) {
                            if(typeof window.MotoAI_v10.addMessage === 'function'){
                                window.MotoAI_v10.addMessage('bot', ans);
                                // FIX: Ensure scrolling happens after message is added via addMessage (which might not scroll)
                                bodyEl.scrollTop = bodyEl.scrollHeight; 
                            } else {
                                const el = document.createElement('div');
                                el.className = 'm-msg bot';
                                el.textContent = ans;
                                bodyEl.appendChild(el);
                                bodyEl.scrollTop = bodyEl.scrollHeight;
                            }
                        }
                    }catch(e){
                      console.error(e);
                    }
                    pushShortMemory({role:'bot', text:ans, t:Date.now()});
                  }, 220 + Math.min(400, ans.length*6));
                } else {
                  // no UI: just return answer
                  pushShortMemory({role:'bot', text:ans, t:Date.now()});
                  return ans;
                }
              }catch(e){
                console.error('v12 sendQuery wrapper error', e);
                try{ orig(q); }catch(e2){ console.error(e2); }
              }
            };
            console.log('%c🔗 MotoAI v12 wrapped existing sendQuery (context memory + smarter answers)', 'color:#0a84ff');
          }
        }catch(e){
          console.warn('Could not wrap sendQuery', e);
        }
      }
    },120);
    // Give up after 8s to avoid infinite polling
    setTimeout(()=> clearInterval(attempt), 8000);
  })();

  // done
  console.log('%c✅ MotoAI v12 GPT-3-mini core ready — attach and patch scheduled', 'color:#0a84ff;font-weight:700');
})();

