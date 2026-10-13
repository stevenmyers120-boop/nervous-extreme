export const STAGES=['warm_up','getting_personal','extreme'];
export const LABELS=['WARM-UP','GETTING PERSONAL','EXTREME'];
export function randomIndex(size){
  if(!Number.isInteger(size)||size<1)throw Error('Empty random pool');
  const a=new Uint32Array(1),limit=Math.floor(4294967296/size)*size;
  do{crypto.getRandomValues(a)}while(a[0]>=limit);
  return a[0]%size;
}
export function base(playingMode='in_person'){
  return {schema:1,playingMode,phase:'setup',names:['Player 1','Player 2'],genders:['male','female'],target:15,match:1,round:1,turn:0,level:0,wins:[0,0],results:[],used:[],task:'',mode:'classic',custom:'',responseType:'live',answer:'',submitted:false,revealed:false,surprise:'random',classics:0,nextSurprise:3,timerSeconds:0,timerUntil:0,status:''};
}
export function normalize(v){return {...base(),...v,used:v.used||[],results:v.results||[]};}
export function unlocked(s){return s.mode==='classic'?(s.level!==4||s.revealed):!!s.custom;}
export function transition(state,a,actor,deck,now=Date.now(),pick=randomIndex){
  if(![0,1].includes(actor)||!a||typeof a.id!=='string')return null;
  const n=normalize(structuredClone(state)),c=n.turn===actor;
  const text=typeof a.text==='string'?a.text.trim():'';
  const card=()=>deck.find(t=>t.id===n.task&&t.mode===n.playingMode);
  const reset=()=>{n.answer='';n.submitted=false;n.revealed=false;n.timerUntil=n.timerSeconds&&!(n.mode==='classic'&&n.level===4)?now+n.timerSeconds*1000:0;};
  const choose=()=>{
    const pool=deck.filter(t=>t.mode===n.playingMode&&t.stage===STAGES[n.match-1]&&!n.used.includes(t.conceptId));
    if(!pool.length){n.phase='exhausted';n.task='';n.answer='';n.custom='';n.submitted=false;n.timerUntil=0;n.status='All challenges in this stage have been played. Continue to the next stage or end the game.';return;}
    const t=pool[pick(pool.length)];n.task=t.id;n.used.push(t.conceptId);n.responseType=t.steps[0].type;
  };
  const finish=(winner,points)=>{
    n.wins[winner]+=points;reset();n.timerUntil=0;
    if(n.wins[winner]>=n.target){n.results.push({match:n.match,winner,scores:[...n.wins]});n.phase=n.match===3?'finished':'winner';n.custom='';n.task='';if(n.phase==='finished')n.used=[];return;}
    if(n.surprise==='off')n.classics=0;
    else if(n.mode==='classic')n.classics++;
    n.round++;n.turn=(n.round-1)%2;n.level=0;n.custom='';
    if(n.surprise!=='off'&&n.classics>=n.nextSurprise){n.mode=n.surprise==='random'?(pick(2)?'dare':'truth'):n.surprise;n.classics=0;n.nextSurprise=3+pick(2);n.responseType=n.playingMode==='remote'?(n.mode==='truth'?'text':'photo'):'live';}
    else{n.mode='classic';choose();}
    if(n.phase==='playing')reset();
  };
  if(a.id==='start'){
    if(actor!==0||n.phase!=='setup')return null;
    let opt;try{opt=JSON.parse(text);}catch{return null;}
    if(!opt||!Array.isArray(opt.names)||opt.names.length!==2||!opt.names.every(t=>typeof t==='string'&&t.trim().length>0&&t.length<=30)||![10,15,20].includes(opt.target)||!['random','truth','dare','off'].includes(opt.surprise)||![0,15,30].includes(opt.timerSeconds))return null;
    n.names=opt.names.map(t=>t.trim());n.target=opt.target;n.surprise=opt.surprise;n.timerSeconds=opt.timerSeconds;n.phase='playing';choose();if(n.phase==='playing')reset();return n;
  }
  if(a.id==='nextMatch'){
    if(!['winner','exhausted'].includes(n.phase)||n.match>=3)return null;
    if(n.phase==='exhausted')n.results.push({match:n.match,winner:n.wins[0]===n.wins[1]?-1:n.wins[0]>n.wins[1]?0:1,scores:[...n.wins]});
    n.match++;n.round=1;n.turn=0;n.level=0;n.wins=[0,0];n.mode='classic';n.custom='';n.classics=0;n.nextSurprise=3+pick(2);n.phase='playing';n.status='';choose();if(n.phase==='playing')reset();return n;
  }
  if(n.phase!=='playing')return null;
  if(a.id==='nervous'){n.status=n.names[actor]+' called NERVOUS.';finish(c?1-actor:n.turn,c?2:1);return n;}
  if(a.id==='skip'){n.status='Challenge declined. No points awarded.';finish(n.turn,0);return n;}
  if(a.id==='reveal'&&c&&n.mode==='classic'&&n.level===4&&!n.revealed){n.revealed=true;n.timerUntil=n.timerSeconds?now+n.timerSeconds*1000:0;return n;}
  if(a.id==='setCustom'&&c&&n.mode!=='classic'&&!n.custom&&text&&text.length<=1000){n.custom=text;n.responseType=n.playingMode==='remote'?(n.mode==='truth'?'text':a.media==='video'?'video':'photo'):'live';reset();return n;}
  if(!unlocked(n))return null;
  if(a.id==='submitAnswer'&&!c&&!n.submitted&&n.responseType==='text'&&text&&text.length<=2000){n.answer=text;n.submitted=true;n.timerUntil=0;return n;}
  if(a.id==='evidenceSent'&&!c&&!n.submitted&&['photo','video'].includes(n.responseType)){n.submitted=true;n.timerUntil=0;return n;}
  if(a.id==='retry'&&c&&n.submitted){reset();n.status='Response returned for review. You may decline instead.';return n;}
  if(a.id==='complete'&&c&&(n.submitted||n.responseType==='live')){
    n.status='';
    if(n.mode==='classic'&&n.level<4){const t=card();if(!t)return null;n.level++;n.responseType=t.steps[n.level].type;reset();}
    else finish(1-n.turn,1);
    return n;
  }
  return null;
}
