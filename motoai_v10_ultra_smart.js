/* ============================================================
 * 🧠 MotoAI v10 Ultra Smart — Core (Hybrid Pro Base)
 * ============================================================ */
(function(){
  if(window.MotoAI_v10_LOADED) return;
  window.MotoAI_v10_LOADED = true;
  console.log('%cMotoAI v10 Ultra Smart — Core loaded','color:#0a84ff;font-weight:bold;');

  const CFG = {
    corpusKey:'MotoAI_v10_corpus',
    sessionKey:'MotoAI_v10_session_msgs',
    sitemapPath:'/moto_sitemap.json'
  };

  // === HTML + CSS inject giữ nguyên giao diện Apple ===
  const html = `<div id="motoai-root">
      <div id="motoai-bubble">🤖</div>
      <div id="motoai-overlay"><div id="motoai-card">
        <header id="motoai-header"><span>MotoAI Assistant</span><button id="motoai-close">✕</button></header>
        <main id="motoai-body"></main>
        <footer id="motoai-footer"><input id="motoai-input" placeholder="Nhập câu hỏi..."/><button id="motoai-send">Gửi</button></footer>
      </div></div></div>`;
  const css = `#motoai-root{position:fixed;bottom:20px;left:16px;z-index:2147483000;font-family:-apple-system,BlinkMacSystemFont,"Helvetica Neue",sans-serif;}
  #motoai-bubble{width:54px;height:54px;border-radius:14px;background:#0a84ff;color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 8px 20px rgba(0,0,0,.2);}
  #motoai-overlay{position:fixed;inset:0;display:none;align-items:flex-end;justify-content:center;background:rgba(0,0,0,.4);}
  #motoai-overlay.visible{display:flex;}
  #motoai-card{width:92%;max-width:900px;height:70vh;background:#fff;border-radius:18px 18px 10px 10px;display:flex;flex-direction:column;overflow:hidden;}
  #motoai-header{padding:8px 14px;font-weight:700;color:#0a84ff;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid rgba(0,0,0,.1);}
  #motoai-body{flex:1;overflow:auto;padding:12px;font-size:15px;}
  #motoai-footer{padding:10px;display:flex;gap:8px;border-top:1px solid rgba(0,0,0,.1);}
  #motoai-input{flex:1;padding:10px;border-radius:10px;border:1px solid rgba(0,0,0,.15);}
  #motoai-send{background:#0a84ff;color:#fff;border:none;border-radius:10px;padding:10px 16px;cursor:pointer;}
  .m-msg{margin:6px 0;padding:10px 12px;border-radius:14px;max-width:86%;word-break:break-word;}
  .m-msg.bot{background:#f1f3f5;}
  .m-msg.user{background:#0a84ff;color:#fff;margin-left:auto;}
  `;
  document.head.insertAdjacentHTML('beforeend', `<style>${css}</style>`);
  document.body.insertAdjacentHTML('beforeend', html);

  // === Core logic ===
  const root = document.getElementById('motoai-root');
  const overlay = document.getElementById('motoai-overlay');
  const card = document.getElementById('motoai-card');
  const bubble = document.getElementById('motoai-bubble');
  const bodyEl = document.getElementById('motoai-body');
  const inputEl = document.getElementById('motoai-input');
  const sendBtn = document.getElementById('motoai-send');
  const closeBtn = document.getElementById('motoai-close');

  let sessionMsgs = JSON.parse(sessionStorage.getItem(CFG.sessionKey)||'[]');
  let corpus = [];

  function addMsg(role,text){
    const el=document.createElement('div');
    el.className='m-msg '+(role==='user'?'user':'bot');
    el.textContent=text;
    bodyEl.appendChild(el); bodyEl.scrollTop=bodyEl.scrollHeight;
    sessionMsgs.push({role,text}); sessionStorage.setItem(CFG.sessionKey,JSON.stringify(sessionMsgs));
  }

  function sendQuery(q){
    if(!q.trim())return;
    addMsg('user',q); inputEl.value='';
    let ans=null;
    try{ if(window.MotoAI_v10.smartAnswer) ans=window.MotoAI_v10.smartAnswer(q); }catch{}
    if(!ans){ ans=retrieveBest(q)||'Xin lỗi, mình chưa có dữ liệu cho câu hỏi này.'; }
    addMsg('bot',ans);
  }

  function tokenize(t){return t.toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu,' ').split(/\s+/).filter(Boolean);}
  function buildCorpus(){
    const txts=Array.from(document.querySelectorAll('p,h1,h2,h3,li')).map(e=>e.innerText.trim()).filter(t=>t.length>20);
    corpus=txts.map((t,i)=>({id:i,text:t,tokens:tokenize(t)}));
    localStorage.setItem(CFG.corpusKey,JSON.stringify(corpus));
  }
  function retrieveBest(q){
    const qs=tokenize(q); if(!qs.length)return null;
    let best={score:0,text:null};
    corpus.forEach(c=>{
      let sc=0; qs.forEach(w=>{if(c.tokens.includes(w))sc++;});
      if(sc>best.score)best={score:sc,text:c.text};
    });
    return best.text;
  }

  bubble.onclick=()=>overlay.classList.add('visible');
  closeBtn.onclick=()=>overlay.classList.remove('visible');
  sendBtn.onclick=()=>sendQuery(inputEl.value);
  inputEl.onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendQuery(inputEl.value);}};

  try{const raw=localStorage.getItem(CFG.corpusKey);if(raw)corpus=JSON.parse(raw);else buildCorpus();}catch{buildCorpus();}
  console.log('✅ MotoAI v10 Ultra Smart Core ready');
})();

/* ============================================================
 * 🧠 MotoAI v10 Ultra Smart — SmartEngine + SpellFix
 * ============================================================ */
(function(){
  if(!window.MotoAI_v10) window.MotoAI_v10 = {};
  console.log('%cMotoAI Ultra SmartEngine active','color:#0a84ff;font-weight:bold;');

  // ======= Smart rules (tương tự v13 nhưng tinh gọn) =======
  const rules = [
    { pattern: /(chào|xin chào|hello|hi|alo)/i,
      answer: [
        "Chào bạn 👋! Mình là MotoAI Ultra Smart, có thể giúp gì về thuê xe máy ạ?",
        "Xin chào! Bạn muốn hỏi về giá, xe số, xe ga hay thủ tục thuê xe?"
      ]},
    { pattern: /(xe số|wave|sirius|future|blade|winner)/i,
      answer: [
        "Xe số 🏍 tiết kiệm xăng, dễ đi, giá thuê chỉ khoảng 100k–120k/ngày.",
        "Bạn chọn xe số như Wave, Sirius, Winner nhé — rẻ, bền và phù hợp di chuyển quanh Hà Nội."
      ]},
    { pattern: /(xe ga|lead|vision|air blade|sh|grande|vespa)/i,
      answer: [
        "Xe ga 🛵 chạy êm, cốp rộng, kiểu dáng đẹp. Giá thuê khoảng 120k–150k/ngày.",
        "Vision, Lead, Air Blade là những xe ga phổ biến — bạn muốn xem bảng giá cụ thể không?"
      ]},
    { pattern: /(50cc|không cần bằng|chưa có bằng|học sinh|sinh viên)/i,
      answer: [
        "Xe 50cc 🚲 không cần bằng lái, rất hợp cho học sinh – sinh viên. Giá thuê chỉ từ 100k/ngày.",
        "Nếu bạn chưa có GPLX, thuê xe 50cc là lựa chọn hợp lý nhất."
      ]},
    { pattern: /(thủ tục|giấy tờ|cần gì|đặt cọc)/i,
      answer: [
        "Thủ tục đơn giản 📄: chỉ cần CCCD + Bằng lái (hoặc Passport). Không cần cọc tiền mặt!",
        "Bạn chỉ cần CCCD và GPLX là nhận xe ngay. Với xe 50cc, chỉ cần CCCD thôi nhé!"
      ]},
    { pattern: /(giá|bao nhiêu|bảng giá|giá thuê)/i,
      answer: [
        "Giá thuê linh hoạt 💰:\n- Xe số: 100k–120k/ngày\n- Xe ga: 120k–150k/ngày\n- Xe côn: 200k–250k/ngày.",
        "Tùy loại xe và số ngày thuê, giá chỉ từ 100k. Thuê dài hạn giảm thêm nữa!"
      ]},
    { pattern: /(liên hệ|zalo|sđt|hotline|ở đâu|địa chỉ)/i,
      answer: [
        "Liên hệ nhanh qua Zalo/Hotline ☎️ 085.725.5868 — bên mình giao xe tận nơi miễn phí Hà Nội!",
        "Bạn gọi ngay 085.725.5868 (có Zalo) để đặt xe hoặc nhận tư vấn trực tiếp nhé!"
      ]},
    { pattern: /(giao xe|ship|vận chuyển|tận nơi|sân bay|bến xe)/i,
      answer: [
        "Có ạ 🚚! Bên mình giao xe tận nơi miễn phí trong nội thành, bến xe, sân bay, khách sạn.",
        "Bạn chỉ cần gửi địa chỉ qua Zalo, bên mình giao xe tận nơi trong 15–30 phút!"
      ]},
    { pattern: /(cảm ơn|thanks|ok|oke|hay quá|tốt quá)/i,
      answer: [
        "Cảm ơn bạn! Rất vui được hỗ trợ 😊",
        "Không có gì ạ, chúc bạn một ngày vui vẻ!"
      ]},
    { pattern: /.+/i, answer:[
        "Mình chưa rõ câu hỏi. Bạn có thể hỏi: giá thuê xe, thủ tục, xe ga, xe số,...",
        "Xin lỗi, mình chưa có thông tin câu hỏi này. Thử hỏi về giá hoặc thủ tục nhé!"
      ], isFallback:true }
  ];

  function random(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

  // ======= Smart Answer =======
  function smartAnswer(query){
    let best = null;
    for(const r of rules){
      if(r.pattern.test(query)){
        best = r;
        if(!r.isFallback) break;
      }
    }
    return best ? random(best.answer) : null;
  }

  // ======= SpellFix =======
  const spellMap = {
    'thue xe may':'thuê xe máy','xe so':'xe số','xe ga':'xe ga',
    'thu tuc':'thủ tục','giay to':'giấy tờ','bang gia':'bảng giá',
    'lien he':'liên hệ','xe ha noi':'xe Hà Nội'
  };
  function autoFix(text){
    let t=text.toLowerCase();
    for(const [wrong, right] of Object.entries(spellMap)){
      const re=new RegExp(`\\b${wrong}\\b`,'gi'); t=t.replace(re,right);
    }
    return t;
  }

  // ======= Patch sendQuery để gắn SpellFix =======
  if(window.MotoAI_v10 && window.MotoAI_v10.sendQuery){
    const orig=window.MotoAI_v10.sendQuery;
    window.MotoAI_v10.sendQuery=function(q){
      const fixed=autoFix(q);
      if(fixed!==q) console.log(`📝 SpellFix: "${q}" → "${fixed}"`);
      return orig(fixed);
    };
  }

  // Gắn vào core
  window.MotoAI_v10.smartAnswer = smartAnswer;
  console.log('✅ SmartEngine + SpellFix attached to MotoAI v10');
})();

/* ============================================================
 * 🌐 MotoAI v10 Ultra Smart — Auto Learn from Repo
 * ============================================================ */
(function(){
  if(!window.MotoAI_v10) return;
  console.log('%cMotoAI Ultra Smart — AutoLearn System Online','color:#0a84ff;font-weight:bold;');

  const CFG = {
    corpusKey:'MotoAI_v10_corpus',
    sitemapPath:'/moto_sitemap.json'
  };

  let corpus = [];
  try{
    const raw = localStorage.getItem(CFG.corpusKey);
    if(raw) corpus = JSON.parse(raw);
  }catch(e){ corpus=[]; }

  function tokenize(t){
    return t.toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu,' ').split(/\s+/).filter(Boolean);
  }

  // 🚀 Học dữ liệu từ repo GitHub (moto_sitemap.json)
  async function learnFromRepo(){
    try{
      const lastLearn = localStorage.getItem('MotoAI_lastLearn');
      const now = Date.now();
      const threeDays = 3*24*60*60*1000;
      if(lastLearn && (now - parseInt(lastLearn,10)) < threeDays){
        console.log('⏳ Bỏ qua học repo (chưa đủ 3 ngày)');
        return;
      }

      const sitemap = CFG.sitemapPath;
      const res = await fetch(sitemap, {cache:'no-store'});
      if(!res.ok) { console.log('⚠️ Không tìm thấy sitemap:', sitemap); return; }
      const data = await res.json();
      if(!data.pages || !Array.isArray(data.pages)){
        console.log('⚠️ Định dạng sitemap không hợp lệ');
        return;
      }

      console.log(`📖 Học ${data.pages.length} trang trong repo...`);
      let totalNew = 0;
      const currentSet = new Set(corpus.map(c=>c.text));

      for(const path of data.pages){
        try{
          const r = await fetch(path,{cache:'no-store'});
          if(!r.ok) continue;
          const html = await r.text();
          const div = document.createElement('div');
          div.innerHTML = html;
          const texts = Array.from(div.querySelectorAll('p,h1,h2,h3,li'))
            .map(e=>e.textContent.trim())
            .filter(t=>t.length > 40 && !t.includes('{') && !t.includes('}'));
          for(const t of texts){
            if(!currentSet.has(t)){
              corpus.push({id: corpus.length, text: t, tokens: tokenize(t)});
              currentSet.add(t);
              totalNew++;
            }
          }
        }catch(e){ console.log('⚠️ Lỗi đọc', path); }
      }

      if(totalNew>0){
        localStorage.setItem(CFG.corpusKey, JSON.stringify(corpus));
        console.log(`✅ Học xong repo: +${totalNew} mẫu`);
      }
      localStorage.setItem('MotoAI_lastLearn', now);
    }catch(e){
      console.error('❌ Lỗi learnFromRepo:', e);
    }
  }

  // 💾 Tự refresh corpus sau 72h (chỉ rebuild local corpus)
  (function(){
    const now = Date.now();
    const last = parseInt(localStorage.getItem('MotoAI_lastCorpusBuild')||'0',10);
    const seventyTwoHrs = 72*60*60*1000;
    if(!last || (now-last)>seventyTwoHrs){
      console.log('🔁 Refresh corpus (72h)...');
      try{
        if(window.MotoAI_v10 && window.MotoAI_v10.rebuildCorpus)
          window.MotoAI_v10.rebuildCorpus();
      }catch(e){ console.warn('Lỗi refresh corpus:',e); }
      localStorage.setItem('MotoAI_lastCorpusBuild', now);
    }
  })();

  // 🔄 Khởi chạy học repo sau khi trang load
  window.addEventListener('load', ()=>{
    setTimeout(()=> learnFromRepo(), 2500);
  });

  console.log('%c✅ MotoAI Ultra Smart AutoLearn attached','color:#0a84ff;font-weight:bold;');
})();
/* ============================================================
 * 🍎 MotoAI v10 Ultra Smart — Final Stable Build Log
 * ============================================================ */
(function(){
  const style = 'color:#0a84ff;font-weight:bold;font-size:14px;';
  console.log('%c🚀 MotoAI v10 Ultra Smart — Final Stable Build (Core + Smart + Repo)', style);
  console.log('%c🧠 Core: v10 Hybrid Pro (Apple UI)', style);
  console.log('%c🤖 SmartEngine + SpellFix: Active', style);
  console.log('%c🌐 Repo AutoLearn + Corpus Refresh: Enabled', style);
  console.log('%c✅ MotoAI Ready — Adaptive AI without CSS Conflict', style);
})();
