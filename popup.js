const $ = id => document.getElementById(id);
const languages = {en:'Inglês',pt:'Português',es:'Espanhol',fr:'Francês',de:'Alemão',it:'Italiano',ja:'Japonês',ko:'Coreano',zh:'Chinês'};
for (const id of ['source','target']) for (const [value,label] of Object.entries(languages)) $(id).add(new Option(label,value));
$('source').value='en'; $('target').value='pt';
chrome.storage.local.get(['source','target']).then(s => {for(const id of ['source','target']) if(languages[s[id]]) $(id).value=s[id];});
chrome.storage.local.get(['apiURL','apiModel','apiKey']).then(s=>{for(const id of ['apiURL','apiModel','apiKey'])$(id).value=s[id]||'';});
$('saveAPI').addEventListener('click',async()=>{
 try{
  const apiURL=$('apiURL').value.trim(),apiModel=$('apiModel').value.trim(),apiKey=$('apiKey').value.trim();
  const url=new URL(apiURL);
  if(!apiModel)throw Error('Informe o modelo.');
  if(url.username||url.password||url.search||url.hash)throw Error('URL inválida.');
  if(url.protocol!=='https:' && !(url.protocol==='http:' && ['localhost','127.0.0.1'].includes(url.hostname)))throw Error('Use HTTPS ou HTTP em localhost.');
  if(!await chrome.permissions.request({origins:[url.origin+'/*']}))throw Error('A conexão não foi autorizada.');
  await chrome.storage.local.set({apiURL,apiModel,apiKey});status('API salva. A chave fica no armazenamento local do navegador.');
 }catch(e){status(e.message);}
});
let busy=false;
const status = text => $('status').textContent=text;
async function tabReady() {
 const [tab] = await chrome.tabs.query({active:true,currentWindow:true});
 if (!tab?.id || !/^https?:/.test(tab.url || '')) throw new Error('Abra uma página HTTP ou HTTPS. Páginas internas e PDFs não são suportados.');
 await chrome.scripting.executeScript({target:{tabId:tab.id},files:['alignment.js','reading.js','content.js']});
 return tab.id;
}
$('translate').addEventListener('click', async () => {
 if(busy)return;
 const sourceLanguage=$('source').value,targetLanguage=$('target').value;
 const colors=$('colors').checked;
 let translator;
 try {
  if(sourceLanguage===targetLanguage)throw new Error('Escolha dois idiomas diferentes.');
  if(!('Translator' in self))throw new Error('O tradutor integrado não está disponível. Use Chrome atualizado no computador com suporte à API Translator.');
  busy=true; $('translate').disabled=true; $('remove').disabled=true;$('saveAPI').disabled=true;
  status('Preparando idiomas… mantenha este painel aberto.');
  // Called directly from the click to preserve the user activation required for download.
  translator=await Translator.create({sourceLanguage,targetLanguage,monitor(m){m.addEventListener('downloadprogress',e=>status(`Baixando idiomas: ${Math.round(e.loaded*100)}%`));}});
  await chrome.storage.local.set({source:sourceLanguage,target:targetLanguage});
  if(colors){
   const settings=await chrome.storage.local.get(['apiURL','apiModel']);
   if(!settings.apiURL||!settings.apiModel)throw new Error('Configure a IA para o alinhamento contextual ou desative as cores para traduzir sem alinhamento.');
  }
  const tabId=await tabReady(),session=crypto.randomUUID();
  const {blocks}=await chrome.tabs.sendMessage(tabId,{type:'collect',session,language:sourceLanguage,maximum:Number($('readingSize').value)});
  const readingDocument={title:document.title,sourceLanguage,targetLanguage,blocks:[]};
  await chrome.storage.session.remove("readingDocument");
  let count=0,skipped=0,unaligned=0,lastAlignmentError='';
  const alignmentCache=new Map();let alignmentDisabled=false;
  const cache=new Map();
  for(const block of blocks){
   const translations=[], alignments=[];
   for(const text of block.texts){
    if(!cache.has(text)) cache.set(text,await translator.translate(text));
    translations.push(cache.get(text));
    let pairs=[];
    const wasDisabled=alignmentDisabled;
    if(colors && !alignmentDisabled){
     try{
      if(!alignmentCache.has(text)){
       status('Analisando unidades de sentido…');
       alignmentCache.set(text,await BilingualAlignment.align(text,cache.get(text),async prompt=>{
        const result=await chrome.runtime.sendMessage({type:'align-request',prompt});
        if(result?.error){alignmentDisabled=true;throw Error(result.error);}
        if(!result?.answer)throw Error('A IA não retornou alinhamento.');
        return result.answer;
       },sourceLanguage,targetLanguage));
      }
      pairs=alignmentCache.get(text);
      if(!pairs.length)unaligned++;
     }catch(e){unaligned++;lastAlignmentError=e.message;}
    }
    if(colors && wasDisabled)unaligned++;
    alignments.push(pairs);
   }
   readingDocument.blocks.push({originals:block.texts,translations,alignments});
   await chrome.storage.session.set({readingDocument});
   const result=await chrome.tabs.sendMessage(tabId,{type:'insert',session,id:block.id,translations,alignments,language:targetLanguage,source:sourceLanguage});
   if(result?.inserted)count++;else skipped++;
   status(`${count} de ${blocks.length} trechos traduzidos…`);
  }
  status(blocks.length?`Concluído: ${count} trechos. ${skipped ? skipped+' alterados na página e ignorados. ' : ''}${blocks.length===500?'Limite de 500 trechos atingido. ':''}${unaligned?'Alinhamento indisponível em '+unaligned+' linhas; ficaram neutras. '+lastAlignmentError+' ':''}Para conteúdo novo, traduza novamente.`:'Nenhum trecho compatível encontrado.');
 }catch(e){status('Não foi possível concluir: '+e.message);}
 finally{translator?.destroy();busy=false;$('translate').disabled=false;$('remove').disabled=false;$('saveAPI').disabled=false;}
});
$('remove').addEventListener('click',async()=>{try{const tabId=await tabReady();await chrome.tabs.sendMessage(tabId,{type:'clear'});status('Traduções removidas.');}catch(e){status(e.message);}});

$('reader').addEventListener('click',async()=>{
 try{
  const {readingDocument}=await chrome.storage.session.get('readingDocument');
  if(!readingDocument?.blocks?.length)throw Error('Traduza a página primeiro. Depois abra a janela de leitura.');
  await chrome.windows.create({url:chrome.runtime.getURL('reader.html'),type:'popup',width:1000,height:760});
 }catch(e){status(e.message);}
});
