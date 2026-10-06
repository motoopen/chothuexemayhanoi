// MotoAI Core v9.0 — Local Learning + Cross-page Crawl + Name Memory
(function(){
  if(window.MotoAI_CORE_V9) return;
  window.MotoAI_CORE_V9 = true;
  console.log("⚙️ MotoAI Core v9.0 loaded");

  const STORAGE_KEY = "motoai_v9_memory";
  const NAME_KEY = "motoai_v9_username";
  const CRAWL_KEY = "motoai_v9_corpus_vsn";

  let corpus = [];
  let memory = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  let userName = localStorage.getItem(NAME_KEY) || null;
  let crawled = localStorage.getItem(CRAWL_KEY) === "1";

  // UTIL
  function safeText(s){
    return (s||"").replace(/\s+/g," ").trim();
  }

  function ngramEmbed(s, n=3){
    const m = new Map();
    s = s.toLowerCase();
    for(let i=0;i<=s.length-n;i++){
      const g = s.slice(i,i+n);
      m.set(g,(m.get(g)||0)+1);
    }
    return m;
  }
  function sim(a,b){
    const ks = new Set([...a.keys(),...b.keys()]);
    let dot=0,na=0,nb=0;
    ks.forEach(k=>{
      const va=a.get(k)||0, vb=b.get(k)||0;
      dot += va*vb; na += va*va; nb += vb*vb;
    });
    return dot/(Math.sqrt(na)*Math.sqrt(nb)+1e-12);
  }

  // Build corpus from current document (and optionally other pages)
  function buildLocalCorpus(){
    const txt = safeText(document.body.innerText || "");
    const parts = txt.split(/(?<=[.?!])\s+/).map(s=>safeText(s)).filter(s=>s.length>30);
    // dedupe but keep order
    const seen = new Set();
    const out = [];
    for(const p of parts){
      if(!seen.has(p)){ seen.add(p); out.push(p); }
    }
    return out;
  }

  // try fetch other pages on same origin (simple crawl)
  async function crawlSameOriginPages(limit=8, timeoutMs=3500){
    if(crawled) return []; // only once per site load (persisted)
    const anchors = Array.from(document.querySelectorAll('a[href]'));
    const urls = [];
    const origin = location.origin;
    for(const a of anchors){
      try{
        const href = a.getAttribute('href').trim();
        if(!href) continue;
        // only relative or same-origin HTML pages
        if(href.startsWith('http')){
          if(!href.startsWith(origin)) continue;
        }
        // ignore anchors, mailto, tel, js
        if(href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) continue;
        const full = new URL(href, location.href).href;
        if(urls.indexOf(full)===-1) urls.push(full);
        if(urls.length>=limit) break;
      }catch(e){}
    }
    const results = [];
    const fetchWithTimeout = (u, t) => Promise.race([
      fetch(u, {credentials: 'same-origin'}).then(r=>r.ok? r.text() : "").catch(()=>""),
      new Promise(res=>setTimeout(()=>res(""), t))
    ]);
    for(const u of urls.slice(0, limit)){
      try{
        const txt = await fetchWithTimeout(u, timeoutMs);
        if(txt && txt.length>200){
          // extract body text roughly
          const m = txt.replace(/<script[\s\S]*?<\/script>/gi,"")
                       .replace(/<style[\s\S]*?<\/style>/gi,"")
                       .replace(/<\/?[^>]+(>|$)/g," ");
          const clean = safeText(m);
          if(clean.length>200) results.push(clean);
        }
      }catch(e){}
    }
    // mark crawled (so we don't repeat heavy fetches)
    if(results.length>0){
      crawled = true;
      localStorage.setItem(CRAWL_KEY, "1");
    }
    return results;
  }

  // initialize corpus (may be async if crawl)
  async function initCorpus(){
    try{
      let base = buildLocalCorpus();
      // try to crawl other pages when site is same-origin and not too heavy
      const extra = await crawlSameOriginPages(8, 2500);
      if(extra && extra.length){
        for(const e of extra){
          const parts = e.split(/(?<=[.?!])\s+/).map(s=>safeText(s)).filter(s=>s.length>30);
          base = base.concat(parts);
        }
      }
      // dedupe
      const seen = new Set();
      corpus = [];
      for(const p of base){
        if(!seen.has(p)){ seen.add(p); corpus.push(p); }
      }
      console.log("MotoAI: corpus built, items =", corpus.length);
    }catch(e){
      console.warn("MotoAI corpus init failed", e);
      corpus = buildLocalCorpus();
    }
  }

  // name extractor (Vietnamese patterns)
  function detectNameFromText(q){
    // patterns like "tôi tên là X", "mình tên là X", "tên tôi là X", "tôi là X" (but avoid false positives)
    const patterns = [
      /\b(?:tôi tên là|mình tên là|tên tôi là)\s+([A-ZÀ-Ỵa-zà-ỹ][\w\s\-]{1,40})/i,
      /\b(?:tôi là|mình là)\s+([A-ZÀ-Ỵa-zà-ỹ][\w\s\-]{1,30})/i
    ];
    for(const r of patterns){
      const m = q.match(r);
      if(m && m[1]){
        return m[1].trim();
      }
    }
    return null;
  }

  // retrieve best matches
  function retrieve(q, top=3){
    const qv = ngramEmbed(q);
    const scored = corpus.map(s => ({text:s, score: sim(qv, ngramEmbed(s))}));
    scored.sort((a,b)=>b.score - a.score);
    return scored.slice(0, top);
  }

  // ask interface
  async function ask(q, cb){
    if(!q || !q.trim()) return cb && cb("");
    // try to detect name statement
    const nm = detectNameFromText(q);
    if(nm){
      userName = nm;
      localStorage.setItem(NAME_KEY, userName);
      const reply = `Chào ${userName}! Mình đã nhớ tên bạn nhé 😊. Bạn muốn hỏi gì tiếp?`;
      memoryPush(q, reply);
      return cb && cb(reply);
    }

    // ensure corpus is ready (init once)
    if(!corpus || corpus.length<1){
      await initCorpus();
    }

    // find matches
    const results = retrieve(q, 3);
    let best = results[0];
    let answer = "";
    if(best && best.score > 0.06){
      // try to combine up to 2 top sentences for context
      answer = results.map(r=>r.text).filter(Boolean).slice(0,2).join(" ");
    } else {
      answer = "Xin lỗi, mình chưa tìm thấy thông tin chính xác trên trang này. Bạn thử hỏi khác hoặc hỏi cụ thể hơn nhé.";
    }

    // personalize if we have userName
    if(userName){
      answer = answer.replace(/^/,"").trim();
      answer = ` ${answer} `; // keep spacing
      answer = `Chào ${userName}, ${answer}`.replace(/\s+/g," ").trim();
    }

    memoryPush(q, answer);
    cb && cb(answer);
  }

  function memoryPush(q,a){
    memory.push({q, a, t:Date.now()});
    if(memory.length>6) memory.shift();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
  }

  function clearMemory(){
    memory = [];
    localStorage.removeItem(STORAGE_KEY);
  }

  function getUserName(){ return userName; }

  // init in background but non-blocking
  setTimeout(()=>initCorpus(), 200);

  // expose API
  window.MotoAI_CORE_V9 = {
    ask,
    clearMemory,
    getUserName,
    memory
  };

  // also support old global name
  window.MotoAI = window.MotoAI_CORE_V9;
})();
