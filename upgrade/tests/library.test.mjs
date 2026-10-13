import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const data=JSON.parse(fs.readFileSync(new URL('../challenge-library.json',import.meta.url))),cards=data.challenges;
test('full authored library: counts, unique variants, complete metadata, five escalating steps and remote evidence',()=>{
  assert.equal(cards.length,1000);assert.equal(new Set(cards.map(c=>c.id)).size,1000);assert.equal(new Set(cards.map(c=>c.conceptId)).size,500);
  for(const mode of ['in_person','remote'])for(const [stage,count] of Object.entries({warm_up:40,getting_personal:160,extreme:300}))assert.equal(cards.filter(c=>c.mode===mode&&c.stage===stage).length,count);
  const fingerprints=new Set();
  for(const card of cards){assert.ok(card.title&&card.category&&card.evidenceInstruction);assert.equal(card.steps.length,5);assert.deepEqual(card.steps.map(s=>s.intensity),[1,2,3,4,5]);
    const key=card.mode+':'+card.steps.map(s=>s.prompt.toLowerCase()).join('|');assert.ok(!fingerprints.has(key),'Identical card: '+card.id);fingerprints.add(key);
    for(const step of card.steps){assert.ok(step.prompt.length>=15);assert.equal(step.type,card.completion);if(card.mode==='remote'&&step.type!=='text')assert.match(step.prompt,/via Snapchat/);if(card.mode==='in_person')assert.equal(step.type,'live');}
    if(card.mode==='remote')assert.ok(['text','photo','video'].includes(card.completion));
    assert.ok(cards.some(c=>c.conceptId===card.conceptId&&c.mode!==card.mode));
  }
});
