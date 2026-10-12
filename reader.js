const $=id=>document.getElementById(id);
let reading,working=false;
const wordCache=new Map();
const status=text=>$('status').textContent=text;
function element(tag,text,className){const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(className)node.className=className;return node;}
function entries(){return reading.blocks.flatMap(b=>b.originals.map((original,i)=>({original,translation:b.translations[i],pairs:b.alignments[i]||[]})));}
function card(data){
 const node=element('div',undefined,'word'+(data.color===null?' neutral':''));
 if(data.color!==null){const color=BilingualAlignment.palette[data.color];node.style.color=color.fg;node.style.background=color.bg;}
 node.append(element('span',data.original,'top'),element('span',data.translation,'bottom'));return node;
}
function context(entry){const n=element('div',undefined,'context');n.append(element('span','Tradução no contexto','label'),element('span',entry.translation));return n;}
function render(mode){
 $('content').replaceChildren();
 for(const entry of entries()){
  const section=element('section',undefined,'pair');
  if(mode==='semantic' && entry.pairs.length){
   const grid=element('div',undefined,'grid');
   for(const data of BilingualReader.semanticCards(entry.original,entry.translation,entry.pairs))grid.append(card(data));
   section.append(grid,context(entry));
  }else section.append(element('div',entry.original,'original'),element('div',entry.translation,'translation'));
  $('content').append(section);
 }
 status(mode==='semantic'?'Correspondências de sentido ficam na mesma coluna. Trechos sem alinhamento permanecem em pares de texto; “—” indica trecho sem correspondente.':'Pares curtos de original e tradução. Para colocar palavras em colunas, escolha um dos modos acima.');
}
$('pairs').onclick=()=>{if(!working&&reading)render('pairs');};
$('semantic').onclick=()=>{if(!working&&reading)render('semantic');};
$('size').oninput=()=>document.documentElement.style.fontSize=$('size').value+'px';
$('words').onclick=async()=>{
 if(working||!reading)return;
 let translator;
 try{
  if(!('Translator' in self))throw Error('Tradutor local indisponível neste navegador.');
  working=true;for(const id of ['words','pairs','semantic'])$(id).disabled=true;
  status('Preparando tradução de palavras…');
  translator=await Translator.create({sourceLanguage:reading.sourceLanguage,targetLanguage:reading.targetLanguage});
  $('content').replaceChildren();let count=0;
  for(const entry of entries()){
   const section=element('section',undefined,'pair'),grid=element('div',undefined,'grid');
   section.append(grid,context(entry));$('content').append(section);
   for(const token of BilingualReader.tokens(entry.original,reading.sourceLanguage)){
    const key=token.text;
    let translation='';
    if(token.translate){
     if(!wordCache.has(key))wordCache.set(key,await translator.translate(key));
     translation=wordCache.get(key);
    }
    grid.append(card({original:token.text,translation,color:null}));count++;
    status(`${count} palavras e sinais organizados. Traduções isoladas podem diferir do sentido da frase; consulte a tradução no contexto.`);
   }
  }
  status('Palavras sobre suas traduções locais. Este modo traduz palavras isoladas; expressões e palavras ambíguas podem mudar de sentido. Para correspondências no contexto, use a IA.');
 }catch(e){status('Não foi possível concluir: '+e.message);}
 finally{translator?.destroy();working=false;for(const id of ['words','pairs','semantic'])$(id).disabled=false;}
};
chrome.storage.session.get('readingDocument').then(({readingDocument})=>{
 reading=readingDocument;
 if(!reading?.blocks?.length){status('Traduza uma página na extensão para abrir a leitura.');return;}
 render(entries().some(e=>e.pairs.length)?'semantic':'pairs');
}).catch(e=>status(e.message));
