// MotoAI Core v8.0 — Smart Local Learning + Memory + Typing Effect
(function(){
  if (window.MotoAI_CORE_V8) return;
  window.MotoAI_CORE_V8 = true;

  console.log("⚙️ MotoAI Core v8 loaded");

  const STORAGE_KEY = "motoai_v8_memory";
  const corpus = buildCorpus();
  const memory = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

  function buildCorpus(){
    const txt = document.body.innerText || "";
    const clean = txt.replace(/\s+/g," ").trim();
    const split = clean.split(/(?<=[.?!])\s+/);
    return split.filter(s => s.length > 25);
  }

  function embed(t){
    const m = new Map(), s = t.toLowerCase();
    for(let i=0;i<s.length-3;i++){
      const g=s.slice(i,i+3);
      m.set(g,(m.get(g)||0)+1);
    }
    return m;
  }

  function sim(a,b){
    const ks = new Set([...a.keys(), ...b.keys()]);
    let dot=0,na=0,nb=0;
    ks.forEach(k=>{
      const va=a.get(k)||0, vb=b.get(k)||0;
      dot+=va*vb; na+=va*va; nb+=vb*vb;
    });
    return dot/(Math.sqrt(na)*Math.sqrt(nb)+1e-12);
  }

  function retrieve(q){
    const qv=embed(q);
    return corpus.map(s=>({text:s,score:sim(qv,embed(s))}))
                 .sort((a,b)=>b.score-a.score)
                 .slice(0,3);
  }

  window.MotoAI = {
    ask: function(q,cb){
      const results = retrieve(q);
      const best = results[0];
      const answer = best && best.score>0.08 ? best.text :
        "🤖 Xin lỗi, mình chưa chắc lắm... nhưng đang học thêm từ trang này.";
      memory.push({q, a:answer});
      if(memory.length>5) memory.shift();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
      cb(answer);
    },
    clear: function(){
      localStorage.removeItem(STORAGE_KEY);
    },
    memory
  };
})();
