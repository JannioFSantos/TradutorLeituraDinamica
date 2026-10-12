(function(scope){
 function tokens(text,language){
  if(typeof Intl.Segmenter==='function')return [...new Intl.Segmenter(language,{granularity:'word'}).segment(text)].filter(s=>s.segment.trim()).map(s=>({text:s.segment,translate:!!s.isWordLike}));
  return [...text.matchAll(/\S+/gu)].map(m=>({text:m[0],translate:/\p{L}/u.test(m[0])}));
 }
 function semanticCards(original,translation,pairs){
  const cards=[],segments=pairs.flatMap(p=>p.sources.map(s=>({source:s,pair:p}))).sort((a,b)=>a.source.start-b.source.start);
  let cursor=0;
  for(const {source,pair} of segments){
   const gap=original.slice(cursor,source.start);if(gap.trim())cards.push({original:gap,translation:'—',color:null});
   cards.push({original:original.slice(source.start,source.end),translation:pair.targets.map(t=>translation.slice(t.start,t.end)).join(' … '),color:pair.color});
   cursor=source.end;
  }
  if(original.slice(cursor).trim())cards.push({original:original.slice(cursor),translation:'—',color:null});
  return cards;
 }
 scope.BilingualReader={tokens,semanticCards};
 if(typeof module!=='undefined')module.exports=scope.BilingualReader;
})(globalThis);
