import fs from 'node:fs';
const data=JSON.parse(fs.readFileSync(new URL('../challenge-library.json',import.meta.url))),cards=data.challenges;
const expected={warm_up:40,getting_personal:160,extreme:300},errors=[],counts={},ids=new Set(),byConcept=new Map(),seen=new Map(),near=[];
const words=s=>new Set(s.toLowerCase().replace(/[^a-z ]/g,' ').split(/\s+/).filter(w=>w.length>2));
for(const card of cards){
  if(ids.has(card.id))errors.push('Duplicate id: '+card.id);ids.add(card.id);
  if(!card.conceptId||!card.title||!card.category||!['in_person','remote'].includes(card.mode)||!Object.hasOwn(expected,card.stage))errors.push('Missing metadata: '+card.id);
  if(card.steps.length!==5)errors.push('Not five steps: '+card.id);
  for(const step of card.steps){if(!step.prompt||!['live','text','photo','video'].includes(step.type))errors.push('Invalid step: '+card.id);if(card.mode==='remote'&&step.type==='live')errors.push('Remote live completion: '+card.id);}
  counts[card.mode]??={warm_up:0,getting_personal:0,extreme:0};counts[card.mode][card.stage]++;
  byConcept.set(card.conceptId,[...(byConcept.get(card.conceptId)||[]),card]);
  const fingerprint=card.steps.map(s=>s.prompt.toLowerCase().replace(/[^a-z0-9]/g,'')).join('|'),key=card.mode+':'+fingerprint;
  if(seen.has(key))errors.push('Identical steps: '+card.id+' and '+seen.get(key));seen.set(key,card.id);
}
for(const mode of ['in_person','remote'])for(const [stage,count] of Object.entries(expected))if(counts[mode]?.[stage]!==count)errors.push(`${mode} ${stage}: ${counts[mode]?.[stage]||0}/${count}`);
for(const [id,variants] of byConcept)if(variants.length!==2||new Set(variants.map(v=>v.mode)).size!==2)errors.push('Concept variants incomplete: '+id);
for(const mode of ['in_person','remote']){
  const items=cards.filter(c=>c.mode===mode).map(c=>({c,tokens:words(c.title+' '+c.steps.map(s=>s.prompt).join(' '))}));
  for(let i=0;i<items.length;i++)for(let j=i+1;j<items.length;j++){
    const a=items[i],b=items[j],intersection=[...a.tokens].filter(t=>b.tokens.has(t)).length,similarity=intersection/(a.tokens.size+b.tokens.size-intersection);
    if(similarity>=.65)near.push({mode,a:a.c.id,b:b.c.id,similarity:+similarity.toFixed(3)});
  }
}
const report={status:errors.length?'INCOMPLETE':'STRUCTURE PASSED',variants:cards.length,concepts:byConcept.size,steps:cards.reduce((n,c)=>n+c.steps.length,0),counts,errors,nearDuplicateCandidates:near,limitations:['Token similarity is a screening aid, not a semantic diversity or escalation review.','Escalation, practicality and content review are required before a completed-library claim.']};
console.log(JSON.stringify(report,null,2));if(errors.length)process.exitCode=1;
