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
test('adult-v2 content scope: substantial contact pool, agreed vocabulary and no performance filler',()=>{
  assert.equal(data.libraryVersion,'adult-v2');
  const local=cards.filter(c=>c.mode==='in_person');
  assert.ok(local.filter(c=>c.contact).length>=100);
  assert.ok(local.every(c=>c.id.includes('adult-v2-')));
  assert.ok(local.every(c=>!['performance','creativity','personality','music','nightlife'].includes(c.category)));
  const text=local.map(c=>c.title+' '+c.steps.map(s=>s.prompt).join(' ')).join(' ');
  for(const word of ['sex','fuck','cock','dick','penis','pussy','vagina','tits','boobs','breasts','nipples','arse','bum','balls','underwear','thong','naked','strip','horny','turned on','masturbation','wank','oral sex','blowjob','anal sex','orgasm','pubic hair','kink','fetish','dirty talk'])assert.ok(text.toLowerCase().includes(word),'Missing adult term: '+word);
  assert.doesNotMatch(text,/charades|weather report|press conference|soap opera|radio jingle|silly acting/i);
});
