const assert=require('node:assert/strict');
const {units}=require('../reading.js');
const paragraph="A quiet conversation at parents' evening, a challenging mock exam, or just a feeling your child needs a little more support with English. We understand. It's often hard to know where to begin. That's why we make it simple: tell us about your child, and we'll match them with an expert online English tutor.";
const inputs=[paragraph,'Same sentence. Same sentence. Same sentence.','First line.\nSecond line.','É importante aprender todos os dias. '.repeat(12),'这是一个很长的句子没有空格但是应该在合适的位置拆开。'.repeat(15),'word '.repeat(120),'x'.repeat(400),'😀 café '.repeat(45)];
for(const input of inputs){
 const parts=units(input,'en',100);
 assert.ok(parts.length);
 let previous=-1;
 for(const p of parts){assert.ok(p.text.length<=100);assert.equal(input.slice(p.start,p.end),p.text);assert.ok(p.start>previous);previous=p.end-1;assert.ok(!/[\uD800-\uDBFF]$/.test(p.text));}
 assert.equal(parts.map(p=>p.text).join('').replace(/\s/g,''),input.replace(/\s/g,''));
}
const parts=units(paragraph,'en',100);assert.ok(parts.length>=5);
assert.deepEqual(units('We understand.','en',100).map(p=>p.text),['We understand.']);
assert.deepEqual(units(' \n 12345 !','en',100),[]);
console.log('PASS: long real paragraph, repeated sentences, breaks, Portuguese, CJK, long token, Unicode, exact offsets and coverage.');
console.log(parts.map(p=>p.text).join('\n[tradução abaixo]\n'));
