// motoai_core_v6.js
// MotoAI Core v6.0 — site-wide corpus, memory, query, tone, debug
(function(){
  if (window.MotoAICore_v6) return;
  const Core = {
    version: '6.0',
    STORAGE_MEMORY_KEY: 'motoai_v6_memory_v1',
    STORAGE_CORPUS_KEY: 'motoai_v6_corpus_v1', // object: {url: text}
    MAX_MEMORY: 200,
    MAX_CORPUS_PAGES: 300,
    init() {
      this.memory = this._loadMemory();
      this.corpus = this._loadCorpus(); // {url: text}
      // ensure at least greeting
      if (!this.memory.length) {
        this.memory.push({role:'bot', text:'Chào bạn 👋! Đây là MotoAI v6.0 — mình đã sẵn sàng.'});
        this._saveMemory();
      }
    },
    // --- Memory management ---
    _loadMemory(){
      try{
        const raw = localStorage.getItem(this.STORAGE_MEMORY_KEY);
        return raw ? JSON.parse(raw) : [];
      }catch(e){ return []; }
    },
    _saveMemory(){
      try{ localStorage.setItem(this.STORAGE_MEMORY_KEY, JSON.stringify(this.memory.slice(-this.MAX_MEMORY))); }catch(e){}
    },
    clearMemory(){
      this.memory = [];
      this._saveMemory();
    },
    exportMemory(){
      try{ return JSON.stringify(this.memory); }catch(e){ return '[]'; }
    },
    importMemory(json){
      try{
        const arr = JSON.parse(json);
        if(Array.isArray(arr)) { this.memory = arr.slice(-this.MAX_MEMORY); this._saveMemory(); return true; }
      }catch(e){}
      return false;
    },
    pushMemory(obj){
      this.memory.push(obj);
      if(this.memory.length > this.MAX_MEMORY) this.memory = this.memory.slice(-this.MAX_MEMORY);
      this._saveMemory();
    },
    // --- Corpus (site pages) ---
    _loadCorpus(){
      try{
        const raw = localStorage.getItem(this.STORAGE_CORPUS_KEY);
        return raw ? JSON.parse(raw) : {};
      }catch(e){ return {}; }
    },
    _saveCorpus(){
      try{ localStorage.setItem(this.STORAGE_CORPUS_KEY, JSON.stringify(this.corpus)); }catch(e){}
    },
    // add current page text to corpus under its URL key
    addPageCorpus(url, text){
      try{
        if(!url || !text) return;
        this.corpus[url] = text;
        // limit pages
        const keys = Object.keys(this.corpus);
        if(keys.length > this.MAX_CORPUS_PAGES){
          // remove oldest key (not guaranteed in all browsers but acceptable)
          delete this.corpus[keys[0]];
        }
        this._saveCorpus();
      }catch(e){}
    },
    // quick build from current document body
    addCurrentPage(){
      try{
        const url = location.pathname || location.href;
        const txt = (document.body && document.body.innerText) ? document.body.innerText.trim() : '';
        if(txt && txt.length > 50) this.addPageCorpus(url, txt);
      }catch(e){}
    },
    // gather combined corpus text (optionally limit)
    getAllCorpusText(){
      return Object.values(this.corpus).join('. ');
    },
    // --- Query & retrieval ---
    // Very small local retriever: find best sentence matching words
    retrieveFromCorpus(query){
      const q = (query || '').toLowerCase().trim();
      if(!q) return null;
      // search current page first
      const localText = (document.body && document.body.innerText) ? document.body.innerText : '';
      const allText = (localText + '. ' + this.getAllCorpusText()).toLowerCase();
      // split into candidate segments
      const segs = allText.split(/[.?!\n]/).map(s=>s.trim()).filter(s=>s.length>30);
      if(!segs.length) return null;
      // score by simple token overlap
      const qtoks = q.split(/\s+/).filter(Boolean);
      let best = {seg:null,score:0};
      for(const s of segs){
        let score = 0;
        const sl = s.toLowerCase();
        for(const t of qtoks){
          if(t.length < 2) continue;
          if(sl.includes(t)) score += 1;
          // bonus for adjacency of tokens
          if(qtoks.length>1 && sl.includes(qtoks.slice(0,2).join(' '))) score += 0.5;
        }
        if(score > best.score){ best = {seg:s, score}; }
      }
      return best.seg || null;
    },
    // tone detection: casual | formal | neutral
    detectTone(q){
      const s = (q||'').toLowerCase();
      if(/[😂🤣😅😍🤔🤷‍♀️🤷‍♂️]|(^hey|^hi|^ok|^kk|ㅎㅎ|haha|hihi)/i.test(q) ||
         /(^cho mình|^mình muốn|bạn ơi)/i.test(q)) return 'casual';
      if(/\bxin chào\b|^kính gửi|trân trọng|xin phép/i.test(s)) return 'formal';
      return 'neutral';
    },
    // style reply by tone (prefix/suffix)
    stylizeReply(reply, tone){
      if(!reply) return reply;
      if(tone === 'casual') return reply + ' 😄';
      if(tone === 'formal') return 'Kính gửi, ' + reply;
      return reply;
    },
    // core answer function: prefer memory pairs, then retrieval, then canned
    answer(query){
      const ql = (query||'').trim();
      if(!ql) return "Bạn có thể hỏi điều gì đó nhé!";
      // check learned exact pairs in memory
      for(let i=this.memory.length-1;i>=1;i--){
        const prev = this.memory[i-1];
        const next = this.memory[i];
        if(prev.role === 'user' && prev.text.trim().toLowerCase() === ql.toLowerCase() && next.role==='bot'){
          return next.text;
        }
      }
      // canned keywords
      if(/\bxe\s*số\b/i.test(ql)) return 'Xe số: tiết kiệm xăng, bền và phù hợp đi xa 🏍️.';
      if(/\bxe\s*ga\b/i.test(ql)) return 'Xe ga: tiện lợi trong phố, ví dụ Honda Vision, Air Blade 🛵.';
      if(/\bthủ\s*tục\b/i.test(ql)) return 'Thủ tục thuê xe: CCCD, đặt cọc nhẹ và ký hợp đồng đơn giản 📄.';
      // retrieval
      const seg = this.retrieveFromCorpus(ql);
      if(seg) return seg;
      // fallback
      return "Mình chưa rõ lắm 🤔, bạn thử hỏi cụ thể hơn nhé!";
    },
    // smart replies generation (few suggestions based on latest answer)
    smartReplies(latestAnswer){
      // naive mapping: if answer mentions 'xe' propose types, else generic
      const s = (latestAnswer||'').toLowerCase();
      if(/\bxe\b/.test(s)) return ['Xe số','Xe ga','Bảng giá'];
      if(/\bthủ tục\b/.test(s)) return ['Thủ tục thuê','Cần giấy tờ gì','Liên hệ đặt xe'];
      return ['Bạn có thể hỏi thêm','Gợi ý: Xe số','Gợi ý: Thủ tục'];
    },
    // theme setter (exposed)
    theme: { accent: '#007aff' },
    setTheme(opts){
      if(!opts) return;
      if(opts.accent) this.theme.accent = opts.accent;
      // store if needed: not implemented yet
    },
    // debug info
    debug(){
      return {
        version: this.version,
        memoryCount: this.memory.length,
        corpusPages: Object.keys(this.corpus).length,
        keys: Object.keys(this.corpus).slice(0,10)
      };
    }
  };

  Core.init();
  // auto-add current page corpus
  try{ Core.addCurrentPage(); }catch(e){}
  window.MotoAICore_v6 = Core;
  console.log('MotoAICore_v6 loaded', Core.debug());
})();
