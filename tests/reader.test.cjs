const assert=require('node:assert/strict');
const R=require('../reader-model.js');
const original='the red car',translation='o carro vermelho';
const pairs=[{sources:[{start:0,end:3}],targets:[{start:0,end:1}],color:0},{sources:[{start:4,end:7}],targets:[{start:8,end:16}],color:1},{sources:[{start:8,end:11}],targets:[{start:2,end:7}],color:2}];
const cards=R.semanticCards(original,translation,pairs);
assert.deepEqual(cards.map(c=>[c.original,c.translation]),[['the','o'],['red','vermelho'],['car','carro']]);
const sparse=R.semanticCards(original,translation,[pairs[2]]);
assert.equal(sparse[0].translation,'—');assert.equal(sparse[0].color,null);
assert.equal(sparse[1].original,'car');
assert.deepEqual(R.semanticCards('abc','xyz',[]),[{original:'abc',translation:'—',color:null}]);
const multiple=R.semanticCards('give up','desistir',[{sources:[{start:0,end:7}],targets:[{start:0,end:8}],color:0}]);assert.equal(multiple[0].original,'give up');
for(const [text,language] of [['Hello, world!','en'],['Olá, café!','pt'],['中文测试','zh']]){
 const tokens=R.tokens(text,language);assert.equal(tokens.map(t=>t.text).join(''),text.replace(/\s/g,''));
 assert.ok(tokens.some(t=>t.translate));
}
assert.equal(R.tokens('?!','en').filter(t=>t.translate).length,0);
console.log('PASS: reordered corresponding columns, neutral unmatched text, phrase grouping, punctuation and multilingual tokenization.');
