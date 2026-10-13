import fs from 'node:fs';
const root=new URL('../',import.meta.url),challenges=[];
const stages=[['warm_up',40],['getting_personal',160],['extreme',300]];
for(const [stage,expected] of stages){
  const rows=fs.readFileSync(new URL('library-source/'+stage+'.txt',root),'utf8').split('\n').map(s=>s.trim()).filter(s=>s&&!s.startsWith('#'));
  if(rows.length!==expected)throw Error(`${stage}: ${rows.length} source concepts; expected ${expected}`);
  rows.forEach((line,i)=>{
    const [title,category,evidence,...prompts]=line.split('|');
    if(prompts.length!==5||prompts.some(p=>!p.trim()))throw Error('Malformed source concept: '+title);
    if(!['text','photo','video'].includes(evidence))throw Error('Unknown evidence: '+title);
    const conceptId=stage+'-'+String(i+1).padStart(3,'0');
    for(const mode of ['in_person','remote']){
      const steps=prompts.map((pair,index)=>{
        const options=pair.split('~');if(options.length>2)throw Error('Bad mode pair: '+title);
        let prompt=options[mode==='remote'?options.length-1:0].trim();
        if(!/[.!?]$/.test(prompt))prompt+='.';
        if(mode==='remote'&&evidence!=='text')prompt+=' Share '+(evidence==='video'?'a video of your fully clothed performance or the finished object':'a photo of the object, garment alone or fully clothed result')+' via Snapchat.';
        return {prompt,type:mode==='remote'?evidence:'live',intensity:index+1};
      });
      challenges.push({id:mode+'-'+conceptId,conceptId,title,stage,category,mode,steps,completion:mode==='in_person'?'live':evidence,evidenceInstruction:mode==='in_person'?'The conductor reviews directly.':evidence==='text'?'Submit a text answer in the shared game box.':'Share evidence via Snapchat; mark EVIDENCE SENT here. Never send intimate imagery.',escalation:'Five authored steps increase disclosure, commitment or performance difficulty.'});
    }
  });
}
fs.writeFileSync(new URL('challenge-library.json',root),JSON.stringify({schemaVersion:1,contentScope:'Provocative non-graphic adult questions and dares; 18+.',concepts:500,variants:1000,steps:5000,notes:['No intimate photos or videos, public exposure, dangerous acts or third-party contact.','Set boundaries first. Nervous, Decline and Stop remain available.','The source files contain individually authored concepts; mode adaptations are paired with a tilde.'],challenges},null,2)+'\n');
console.log('Built 500 concepts / 1,000 variants / 5,000 steps.');
