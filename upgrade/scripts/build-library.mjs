import fs from 'node:fs';
// Imported wording is authoritative: never regenerate it from the earlier packed source.
if(fs.existsSync(new URL('../manual-import-validation.json',import.meta.url))){
  const bytes=fs.readFileSync(new URL('../challenge-library.json',import.meta.url));
  const library=JSON.parse(bytes);
  if(library.challenges.length!==1000||new Set(library.challenges.map(c=>c.id)).size!==1000||library.challenges.some(c=>c.steps.length!==5))throw Error('Invalid manually edited library structure');
  console.log('Manual library is canonical. Validated 1,000 variants; preserved every byte without regeneration.');
  process.exit(0);
}
const root=new URL('../',import.meta.url),challenges=[];
const stages=[['warm_up',40],['getting_personal',160],['extreme',300]];
for(const [stage,expected] of stages){
  const rows=fs.readFileSync(new URL('library-source/'+stage+'.txt',root),'utf8').split('\n').map(s=>s.trim()).filter(s=>s&&!s.startsWith('#'));
  if(rows.length!==expected)throw Error(`${stage}: ${rows.length} source concepts; expected ${expected}`);
  rows.forEach((line,i)=>{
    const [title,category,evidence,...prompts]=line.split('|');
    if(prompts.length!==5||prompts.some(p=>!p.trim()))throw Error('Malformed source concept: '+title);
    if(!['text','photo','video'].includes(evidence))throw Error('Unknown evidence: '+title);
    const conceptId='adult-v2-'+stage+'-'+String(i+1).padStart(3,'0');
    for(const mode of ['in_person','remote']){
      const steps=prompts.map((pair,index)=>{
        const options=pair.split('~');if(options.length>2)throw Error('Bad mode pair: '+title);
        let prompt=options[mode==='remote'?options.length-1:0].trim();
        if(!/[.!?]$/.test(prompt))prompt+='.';
        if(mode==='remote'&&evidence!=='text')prompt+=' Share '+(evidence==='video'?'a short video showing only the paper, objects or garments alone':'a photo showing only the paper, objects, garments alone or non-intimate forearm art')+' via Snapchat.';
        return {prompt,type:mode==='remote'?evidence:'live',intensity:index+1};
      });
      const contact=mode==='in_person'&&prompts.some(p=>p.includes('~'))&&['contact','kissing','affection','closeness','guided touch','massage'].includes(category);
      challenges.push({id:mode+'-'+conceptId,conceptId,title,stage,category,mode,kind:mode==='remote'?(evidence==='text'?'truth':'dare'):(contact||evidence!=='text'?'dare':'truth'),contact,steps,completion:mode==='in_person'?'live':evidence,evidenceInstruction:mode==='in_person'?'The conductor reviews directly.':evidence==='text'?'Submit a text answer in the shared game box.':'Share evidence via Snapchat; mark EVIDENCE SENT here. Never send intimate imagery.',escalation:'Five authored steps increase personal disclosure, directness or consensual non-intimate affection.'});
    }
  });
}
fs.writeFileSync(new URL('challenge-library.json',root),JSON.stringify({schemaVersion:1,libraryVersion:'adult-v2',contentScope:'Sexually candid non-graphic adult discussion, body confidence and consensual non-intimate affection; 18+.',concepts:500,variants:1000,steps:5000,notes:['All participants and past intimate experiences are adults. Avoid identifying other people.','No sexual-act instructions, intimate photos or videos, public exposure, dangerous acts or third-party contact.','Set boundaries first. Nervous, Decline and Stop remain available. Use skin-safe pens for forearm art.','The source files contain authored concepts; mode adaptations are paired with a tilde.'],challenges},null,2)+'\n');
console.log('Built 500 concepts / 1,000 variants / 5,000 steps.');
