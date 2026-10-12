(() => {
  if (globalThis.__bilingualInstalled) return;
  globalThis.__bilingualInstalled = true;
  const entries = new Map();
  let session = '', nextId = 0;
  const names = BilingualAlignment.palette.map((_,i)=>'jfs-bilingual-'+i);
  const colorRanges = names.map(()=>[]);
  let colorStyle;
  function sourceMap(el) {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
      acceptNode(n) {
        if(n.nodeType===1 && n.matches('[data-bilingual-host],script,style')) return NodeFilter.FILTER_REJECT;
        if(n.nodeType===3 || n.nodeName==='BR')return NodeFilter.FILTER_ACCEPT;
        return NodeFilter.FILTER_SKIP;
      }
    });
    let raw='',n; const pieces=[];
    while((n=walker.nextNode())){
      const text=n.nodeType===3?n.data:'\n';
      if(n.nodeType===3)pieces.push({node:n,start:raw.length,end:raw.length+text.length});
      raw+=text;
    }
    let normalized='',offsets=[];
    for(let i=0;i<raw.length;i++) {
      if(raw[i]==='\n'){normalized+='\n';offsets.push(i);continue;}
      if(/\s/u.test(raw[i])) {if(!normalized || normalized.endsWith(' '))continue; normalized+=' ';}
      else normalized+=raw[i];
      offsets.push(i);
    }
    return {normalized,offsets,pieces};
  }
  function addSourceColor(map,start,end,color) {
    if(!CSS.highlights || typeof Highlight==='undefined')return;
    const rawStart=map.offsets[start],rawEnd=map.offsets[end-1]+1;
    for(const piece of map.pieces){
      const a=Math.max(rawStart,piece.start),b=Math.min(rawEnd,piece.end);
      if(a>=b)continue;
      const range=document.createRange();range.setStart(piece.node,a-piece.start);range.setEnd(piece.node,b-piece.start);
      colorRanges[color].push(range);
    }
  }
  function refreshColors() {
    if(!CSS.highlights || typeof Highlight==='undefined')return;
    if(!colorStyle){
      colorStyle=document.createElement('style');
      colorStyle.textContent=BilingualAlignment.palette.map((p,i)=>`::highlight(${names[i]}){color:${p.fg};background-color:${p.bg};}`).join('\n');
      document.documentElement.append(colorStyle);
    }
    names.forEach((name,i)=>CSS.highlights.set(name,new Highlight(...colorRanges[i])));
  }
  const selector = 'p,h1,h2,h3,h4,h5,h6,li,blockquote,figcaption,td,th,div,article,section';
  const excluded = 'script,style,noscript,textarea,input,select,button,pre,code,svg,nav,header,footer,[contenteditable]:not([contenteditable="false"]),[translate="no"],[data-bilingual-host]';
  function clear() {
    for (const item of entries.values()) item.hosts?.forEach(h => h.remove());
    names.forEach((name,i)=>{CSS.highlights?.delete(name);colorRanges[i]=[];});
    colorStyle?.remove();colorStyle=null;
    entries.clear(); session = ''; 
  }
  chrome.runtime.onMessage.addListener((msg, sender, reply) => {
    if (msg.type === 'collect') {
      clear(); session = msg.session;
      const blocks = [];
      for (const el of document.querySelectorAll(selector)) {
        if (el.closest(excluded) || el.querySelector(selector) || !el.getClientRects().length || getComputedStyle(el).visibility === 'hidden') continue;
        const map=sourceMap(el);
        const units=BilingualReading.units(map.normalized,msg.language,msg.maximum);
        const texts=units.map(u=>u.text);
        if (!texts.length) continue;
        const id = String(++nextId);
        entries.set(id, {el,texts,units,sourceText:map.normalized}); blocks.push({id, texts});
        if (blocks.length >= 500) break;
      }
      reply({blocks});
    } else if (msg.type === 'insert' && msg.session === session) {
      const item = entries.get(msg.id);
      if (!item || !item.el.isConnected || sourceMap(item.el).normalized !== item.sourceText) { reply({inserted:false}); return; }
      item.hosts?.forEach(h => h.remove());
      item.hosts = [];
      const map=sourceMap(item.el);
      const insertions=[];
      msg.translations.forEach((translation,i) => {
        const host = document.createElement('span');
        host.dataset.bilingualHost = 'true'; host.lang = msg.language;
        const root = host.attachShadow({mode:'closed'});
        const style = document.createElement('style');
        style.textContent = ':host{display:block!important;margin:6px 0!important}div{border-left:3px solid #159c80;padding:5px 10px;color:inherit;background:rgba(21,156,128,.10);font:inherit;line-height:1.6;white-space:pre-wrap}';
        const row = document.createElement('div');
        const originalStart=item.units[i].start;
        const pairs=CSS.highlights && originalStart>=0 ? (msg.alignments?.[i] || []) : [];
        if(originalStart>=0) for(const pair of pairs) for(const source of pair.sources) addSourceColor(map,originalStart+source.start,originalStart+source.end,pair.color);
        let cursor=0;
        for(const pair of pairs.flatMap(p=>p.targets.map(target=>({target,color:p.color,sources:p.sources}))).sort((a,b)=>a.target.start-b.target.start)){
          row.append(document.createTextNode(translation.slice(cursor,pair.target.start)));
          const span=document.createElement('span');span.textContent=translation.slice(pair.target.start,pair.target.end);
          const color=BilingualAlignment.palette[pair.color];
          span.style.cssText=`color:${color.fg};background:${color.bg};border-radius:3px;`;
          span.title=pair.sources.map(r=>item.texts[i].slice(r.start,r.end)).join(' … ');
          row.append(span);cursor=pair.target.end;
        }
        row.append(document.createTextNode(translation.slice(cursor)));
        root.append(style,row);
        const rawEnd=map.offsets[item.units[i].end-1]+1;
        const piece=map.pieces.find(p=>rawEnd>p.start && rawEnd<=p.end);
        if(piece)insertions.push({host,node:piece.node,offset:rawEnd-piece.start});

      });
      // Insert from the end so splitting a text node cannot invalidate earlier offsets.
      for(const insertion of insertions.reverse()){
        const range=document.createRange();range.setStart(insertion.node,insertion.offset);range.collapse(true);
        range.insertNode(insertion.host);item.hosts.push(insertion.host);
      }
      refreshColors(); reply({inserted:true});
    } else if (msg.type === 'clear') { clear(); reply({ok:true}); }
  });
})();