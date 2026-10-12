function endpointURL(raw) {
 const url=new URL(raw);
 if(url.username||url.password||url.search||url.hash)throw Error('Use uma URL sem credenciais, parâmetros ou fragmentos.');
 if(url.protocol!=='https:' && !(url.protocol==='http:' && ['localhost','127.0.0.1'].includes(url.hostname)))throw Error('A API deve usar HTTPS; HTTP somente em localhost.');
 return url;
}
chrome.runtime.onMessage.addListener((msg,sender,reply)=>{
 if(sender.id!==chrome.runtime.id || sender.tab || msg.type!=='align-request')return;
 (async()=>{
  const {apiURL,apiKey,apiModel}=await chrome.storage.local.get(['apiURL','apiKey','apiModel']);
  const url=endpointURL(apiURL);
  if(!apiModel?.trim())throw Error('Informe o modelo de IA nas configurações.');
  if(!await chrome.permissions.contains({origins:[url.origin+'/*']}))throw Error('Autorize a conexão com a API nas configurações.');
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),45000);
  try{
   const response=await fetch(url.href,{method:'POST',redirect:'error',credentials:'omit',signal:controller.signal,
    headers:{'Content-Type':'application/json',...(apiKey?{Authorization:'Bearer '+apiKey}:{})},
    body:JSON.stringify({model:apiModel,temperature:0,messages:[{role:'user',content:msg.prompt}],response_format:{type:'json_object'}})});
   if(!response.ok)throw Error('A API retornou HTTP '+response.status);
   const data=await response.json(),answer=data.choices?.[0]?.message?.content;
   if(typeof answer!=='string')throw Error('Resposta incompatível com Chat Completions.');
   return {answer};
  }finally{clearTimeout(timer);}
 })().then(reply).catch(e=>reply({error:e.name==='AbortError'?'Tempo limite da API excedido.':e.message}));
 return true;
});
