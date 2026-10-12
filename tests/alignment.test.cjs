const assert=require('node:assert/strict');
const A=require('../alignment.js');
const seg=(text,group)=>({text,group});
const cases=[
 {name:'unequal word counts',s:'She gave up.',t:'Ela desistiu.',data:{source:[seg('She',0),seg(' ',null),seg('gave up',1),seg('.',null)],target:[seg('Ela',0),seg(' ',null),seg('desistiu',1),seg('.',null)]}},
 {name:'reordered noun phrase',s:'the red car',t:'o carro vermelho',data:{source:[seg('the',0),seg(' ',null),seg('red',1),seg(' ',null),seg('car',2)],target:[seg('o',0),seg(' ',null),seg('carro',2),seg(' ',null),seg('vermelho',1)]}},
 {name:'discontinuous negation',s:'I do not know.',t:'Eu não sei.',data:{source:[seg('I',0),seg(' ',null),seg('do',1),seg(' ',null),seg('not',2),seg(' ',null),seg('know',1),seg('.',null)],target:[seg('Eu',0),seg(' ',null),seg('não',2),seg(' ',null),seg('sei',1),seg('.',null)]}},
 {name:'repetitions are separate',s:'Go, go!',t:'Vá, vá!',data:{source:[seg('Go',0),seg(', ',null),seg('go',1),seg('!',null)],target:[seg('Vá',0),seg(', ',null),seg('vá',1),seg('!',null)]}},
 {name:'uncertain neutral',s:'bank',t:'banco',data:{source:[seg('bank',null)],target:[seg('banco',null)]}},
 {name:'unicode and emoji',s:'😀 café',t:'😀 coffee',data:{source:[seg('😀 ',null),seg('café',0)],target:[seg('😀 ',null),seg('coffee',0)]}}
];
(async()=>{
 for(const c of cases){
  const result=await A.align(c.s,c.t,async prompt=>{assert.ok(prompt.includes(JSON.stringify(c.s)));return JSON.stringify(c.data);},'en','pt');
  assert.equal(new Set(result.map(p=>p.color)).size,result.length);
  for(const p of result){assert.ok(p.sources.length);assert.ok(p.targets.length);}
 }
 assert.equal(A.validate('😀 café','😀 coffee',cases[5].data)[0].sources[0].start,3);
 for(const data of [null,{}, {source:[],target:[]},
  {source:[seg('wrong',0)],target:[seg('banco',0)]},
  {source:[seg('bank',0)],target:[seg('banco',null)]},
  {source:[seg('bank',12)],target:[seg('banco',12)]},
  {source:[seg('bank',-1)],target:[seg('banco',-1)]},
  {source:[seg('bank','0')],target:[seg('banco','0')]},
  {source:[seg('bank',0),seg('',null)],target:[seg('banco',0)]}
 ])assert.throws(()=>A.validate('bank','banco',data));
 await assert.rejects(()=>A.align('bank','banco',async()=>'{bad JSON}'));
 await assert.rejects(()=>A.align('bank','banco',async()=>{throw Error('API unavailable')}));
 console.log('PASS: 6 varied alignment fixtures; malformed JSON, unavailable provider, missing text, unmatched groups, invalid IDs, empty segments rejected.');
})().catch(e=>{console.error(e);process.exit(1)});
