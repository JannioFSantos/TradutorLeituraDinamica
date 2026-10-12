(function(scope){
 function units(text,language='en',maximum=100){
  const max=Math.max(40,Math.min(240,Number(maximum)||100));
  const output=[];
  const sentences=typeof Intl.Segmenter==='function' ? [...new Intl.Segmenter(language,{granularity:'sentence'}).segment(text)].map(s=>({text:s.segment,start:s.index})) : [{text,start:0}];
  for(const sentence of sentences){
   let cursor=0;
   while(cursor<sentence.text.length){
    while(/\s/u.test(sentence.text[cursor]||'') && cursor<sentence.text.length)cursor++;
    if(cursor>=sentence.text.length)break;
    let end=Math.min(cursor+max,sentence.text.length);
    const newline=sentence.text.indexOf('\n',cursor);
    if(newline>=0 && newline<end)end=newline;
    if(end<sentence.text.length && end!==newline){
     const window=sentence.text.slice(cursor,end);
     const punctuation=[...window.matchAll(/[,;:，；：]\s*/gu)].filter(m=>m.index>=max*.4).pop();
     if(punctuation)end=cursor+punctuation.index+punctuation[0].length;
     else {
      const words=typeof Intl.Segmenter==='function' ? [...new Intl.Segmenter(language,{granularity:'word'}).segment(window)] : [...window.matchAll(/\S+\s*/gu)].map(m=>({index:m.index,segment:m[0]}));
      const boundary=words.filter(w=>w.index>0).pop();
      if(boundary)end=cursor+boundary.index;
      else {
       // A long unbroken token must still progress without cutting a surrogate pair.
       if(end>cursor && /[\uD800-\uDBFF]/.test(sentence.text[end-1]))end--;
      }
     }
    }
    const raw=sentence.text.slice(cursor,end),trimmed=raw.trim();
    if(trimmed && /\p{L}/u.test(trimmed)){
     const start=sentence.start+cursor+raw.indexOf(trimmed);
     output.push({text:trimmed,start,end:start+trimmed.length});
    }
    cursor=Math.max(end,cursor+1);
   }
  }
  return output;
 }
 scope.BilingualReading={units};
 if(typeof module!=='undefined')module.exports=scope.BilingualReading;
})(globalThis);
