// Unified upgrade of distance.js: retain anonymous membership, host-processed
// revision-tagged actions, ready/presence checks, reconnect and server clocks.
import {base,normalize,transition,unlocked,LABELS} from './engine.js';
const $=id=>document.getElementById(id),show=(id,on)=>$(id).classList.toggle('hidden',!on),txt=(id,t)=>$(id).textContent=t;
const KEY='nervous-upgrade-room';
let DECK=[],db,auth,uid,ref,room='',role=0,other='',offset=0,online=false,peer=false,ready={},s=null,revision=0,pending=false,queue=Promise.resolve(),draftKey='',stops=[],generation=0,connecting=false,local=false,selected='in_person',boot=null,expiryTimer,pendingClose=null,closeFlight=null,multiplayerEnabled=null;
const now=()=>Date.now()+offset;
const actor=()=>local?s.turn:role;
const c=()=>s&&s.turn===actor();
const libraryReady=fetch('challenge-library.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Challenge library could not load.');return r.json();}).then(d=>{if(d.libraryVersion!=='adult-v2'||!Array.isArray(d.challenges))throw Error('The adult library update has not loaded. Reload the page and start a fresh room.');DECK=d.challenges;return DECK;});
libraryReady.catch(e=>txt('connectStatus',e.message));
const settingsReady=fetch('firebase-config.json').then(r=>{if(!r.ok)throw Error('Staging configuration could not load.');return r.json();}).then(settings=>{multiplayerEnabled=!!(settings.enabled&&settings.config);if(!multiplayerEnabled)txt('connectStatus',settings.notice||'Multiplayer staging setup pending. Single Phone is ready.');busy(connecting);return settings;});
settingsReady.catch(e=>{multiplayerEnabled=false;busy(false);txt('connectStatus',e.message);});
function err(e){pending=false;const m=e.message||String(e);txt(s&&s.phase!=='setup'?'gameError':room||local?'lobbyError':'connectStatus',m.includes('permission')||m.includes('PERMISSION')?'This room is unavailable or the staging Firebase rules are not installed.':m);render();}
function watch(r,event,fn){const gen=generation;const wrapped=v=>{if(gen===generation)fn(v);};r.on(event,wrapped,e=>{if(gen!==generation)return;if(room&&(e.code==='PERMISSION_DENIED'||now()>=expiresAt)){cleanup();txt('connectStatus','Room ended, expired, or access was revoked.');show('home',false);show('connect',true);}else err(e);});stops.push(()=>r.off(event,wrapped));}
let expiresAt=0;
function cleanup(){
  generation++;stops.splice(0).forEach(f=>f());clearTimeout(expiryTimer);ref=null;s=null;room='';other='';ready={};peer=false;pending=false;revision=0;local=false;draftKey='';sessionStorage.removeItem(KEY);document.body.classList.remove('playing');
  for(const id of ['lobby','connect','game','deviceChoice'])show(id,false);show('home',true);show('privacyFoot',true);
  for(const id of ['answerBox','customText','player0','player1','roomCode'])$(id).value='';$('readyCheck').checked=false;
  for(const id of ['gameError','lobbyError','connectStatus'])txt(id,'');for(const id of ['roomDialog','rulesDialog'])if($(id).open)$(id).close();
}
async function firebaseBoot(){
  if(boot)return boot;
  boot=(async()=>{
    await libraryReady;const settings=await settingsReady;
    if(!settings.enabled||!settings.config)throw Error(settings.notice||'Multiplayer staging is not configured. Single Phone is available.');
    if(settings.config.projectId==='nervous-extreme')throw Error('Upgrade tests must use a separate staging Firebase project.');
    // SDK loading is lazy: single-phone play remains independent of Firebase.
    for(const part of ['app','auth','database'])await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://www.gstatic.com/firebasejs/10.14.1/firebase-'+part+'-compat.js';script.onload=resolve;script.onerror=()=>reject(Error('Firebase SDK could not load. Check your connection.'));document.head.append(script);});
    firebase.initializeApp(settings.config);auth=firebase.auth();db=firebase.database();await auth.setPersistence(firebase.auth.Auth.Persistence.SESSION);if(!auth.currentUser)await auth.signInAnonymously();uid=auth.currentUser.uid;
    db.ref('.info/serverTimeOffset').on('value',v=>offset=v.val()||0);db.ref('.info/connected').on('value',v=>{online=!!v.val();if(pendingClose&&online)flushClose();else if(ref&&online)presence();render();});
  })();
  try{return await boot;}catch(e){boot=null;throw e;}
}
async function presence(){if(!ref||!uid)return;const p=ref.child('presence/'+uid),gen=generation;try{await p.onDisconnect().set(false);if(gen===generation)await p.set(true);}catch(e){if(gen===generation)err(e);}}
function lobby(){show('home',false);show('connect',false);show('lobby',true);show('roomInfo',!local);show('hostSetup',local||role===0);show('guestNote',!local&&role===1);show('startGame',local||role===0);txt('readyLabel',local?'We are both 18+, agree to play, and know either of us can decline or stop.':'I am 18+, agree to play, and know I can decline or stop.');txt('lobbyMode',local?'SINGLE PHONE · IN PERSON':s?.playingMode==='remote'?'MULTIPLE DEVICES · REMOTE':'MULTIPLE DEVICES · IN PERSON');}
async function attach(code,r){
  const candidate=db.ref('upgradeRooms/'+code),meta=(await candidate.once('value')).val();if(!meta||meta.expiresAt<=now())throw Error('This room has ended or expired.');if(meta.hostUid!==uid&&meta.guestUid!==uid)throw Error('This room belongs to another session.');
  if(meta.game&&meta.game.state.schema!==1)throw Error('Room uses a different game version.');
  room=code;role=r;local=false;ref=candidate;expiresAt=meta.expiresAt;other=role===0?meta.guestUid:meta.hostUid;
  sessionStorage.setItem(KEY,JSON.stringify({room,role,uid}));txt('lobbyCode',room);
  expiryTimer=setTimeout(()=>{cleanup();show('home',false);show('connect',true);txt('connectStatus','Room expired. Start a fresh game.');},Math.max(0,expiresAt-now()));
  watch(ref.child('guestUid'),'value',v=>{if(role===0)other=v.val()||'';render();});
  let present={};watch(ref.child('presence'),'value',v=>{present=v.val()||{};peer=!!present[other];render();});
  // Guest membership changes must also recompute presence.
  watch(ref.child('guestUid'),'value',()=>{peer=!!present[other];render();});
  watch(ref.child('ready'),'value',v=>{ready=v.val()||{};$('readyCheck').checked=!!ready[uid];render();});
  watch(ref.child('game'),'value',v=>{const g=v.val();if(g){s=normalize(g.state);revision=g.revision;lobby();render();}else if(s){cleanup();show('home',false);show('connect',true);txt('connectStatus','Room ended and its gameplay data was deleted.');}});
  if(role===0){if(!meta.game)await ref.child('game').set({revision:1,state:base(selected),updatedAt:firebase.database.ServerValue.TIMESTAMP});watch(ref.child('actions'),'child_added',v=>{const gen=generation;queue=queue.then(()=>gen===generation?process(v):undefined).catch(e=>{if(gen===generation)err(e);});});}
  lobby();await presence();render();
}
function busy(b){connecting=b;for(const id of ['createRoom','joinRoom'])$(id).disabled=b||multiplayerEnabled===false;for(const id of ['single','together','apart'])$(id).disabled=b;}
async function create(){if(connecting||room)return;busy(true);try{await firebaseBoot();let code;for(let i=0;i<5;i++){const a=new Uint8Array(6);crypto.getRandomValues(a);code=Array.from(a,n=>'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[n%32]).join('');try{await db.ref('upgradeRooms/'+code).set({hostUid:uid,guestUid:'',createdAt:firebase.database.ServerValue.TIMESTAMP,expiresAt:now()+14340000});break;}catch(e){if(i===4||!String(e.code).includes('PERMISSION'))throw e;}}await attach(code,0);}catch(e){err(e);}finally{busy(false);}}
async function join(){if(connecting||room)return;busy(true);try{const code=$('roomCode').value.trim().toUpperCase();if(!/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/.test(code))throw Error('Enter a valid six-character room code.');await firebaseBoot();await db.ref('upgradeRooms/'+code+'/guestUid').set(uid);await attach(code,1);}catch(e){err(e);}finally{busy(false);}}
async function process(snapshot){
  if(!ref||!s)return;const sessionRef=ref,a=snapshot.val(),who=a.uid===uid?0:a.uid===other?1:-1;
  if(who>=0&&a.revision===revision&&peer&&online){const next=a.id==='start'&&(!other||!ready[uid]||!ready[other])?null:transition(s,a,who,DECK,now());if(next)await sessionRef.child('game').set({revision:revision+1,state:next,updatedAt:firebase.database.ServerValue.TIMESTAMP});}
  await snapshot.ref.remove();
}
async function action(id,text='',media='photo',who=actor()){
  if(pending||!s)return;
  if(s.mode==='classic'&&s.task&&!DECK.some(t=>t.id===s.task&&t.mode===s.playingMode)){txt('gameError','This room uses an earlier challenge library. STOP, reload both devices and create a fresh room.');return;}
  if(local){const n=transition(s,{id,text,media},who,DECK,now());if(n){s=n;revision++;render();}return;}
  if(!ref||!online||!peer){txt('gameError','Waiting for both devices to reconnect. STOP remains available.');return;}
  const gen=generation;pending=true;render();try{
    const r=ref.child('actions').push();
    await r.set({id,uid,at:firebase.database.ServerValue.TIMESTAMP,revision,text,media});
    // Only this action's acknowledgement releases its pending latch. A game
    // snapshot from a different action cannot allow a stale duplicate click.
    const fn=v=>{if(gen!==generation){r.off('value',fn);return;}if(!v.exists()){r.off('value',fn);pending=false;render();}};r.on('value',fn,e=>{r.off('value',fn);if(gen===generation)err(e);});stops.push(()=>r.off('value',fn));
  }catch(e){if(gen===generation)err(e);}
}
function render(){
  if(!s)return;const playing=s.phase!=='setup';document.body.classList.toggle('playing',playing);show('home',false);show('connect',false);show('lobby',!playing);show('game',playing);show('privacyFoot',!playing);
  if(!playing){lobby();txt('pairInfo',other?(peer?'Both players are connected.':'Other player is reconnecting…'):'Waiting for your partner.');txt('lobbyMode',local?'SINGLE PHONE · IN PERSON':'MULTIPLE DEVICES · '+(s.playingMode==='remote'?'REMOTE':'IN PERSON'));$('startGame').disabled=local?!$('readyCheck').checked:!online||!peer||!ready[uid]||!ready[other]||pending;return;}
  const conductor=c(),challenger=1-s.turn,locked=!unlocked(s),winner=['winner','finished','exhausted'].includes(s.phase);
  txt('connectionLabel',local?'ONE PHONE · IN PERSON':(online&&peer?'CONNECTED':'RECONNECTING')+' · '+room+' · '+(s.playingMode==='remote'?'REMOTE':'IN PERSON'));show('roomMenu',!local);txt('youAre',local?'SHARED PHONE':s.names[role]);
  for(let i=0;i<2;i++){txt('name'+i,s.names[i]);txt('scoreValue'+i,s.wins[i]);txt('role'+i,i===s.turn?'CONDUCTOR':'CHALLENGER');$('score'+i).classList.toggle('active',i===s.turn);}
  $('championship').replaceChildren(...LABELS.map((label,i)=>{const e=document.createElement('div');e.className=i+1===s.match?'current':'';const r=s.results.find(t=>t.match===i+1);e.textContent=label+(r?' · '+(r.winner===-1?'DRAW':s.names[r.winner]):'');return e;}));
  txt('status',s.status);show('challengeCard',!winner);show('winnerScreen',winner);
  if(winner){const r=s.results.at(-1);txt('winnerTitle',s.phase==='exhausted'?'STAGE POOL COMPLETE':s.names[r.winner]+' wins match '+s.match);txt('winnerScores',s.names[0]+' '+s.wins[0]+' · '+s.names[1]+' '+s.wins[1]);$('matchHistory').replaceChildren(...s.results.map(r=>{const p=document.createElement('p');p.textContent=LABELS[r.match-1]+' · '+(r.winner===-1?'Draw':s.names[r.winner])+' · '+r.scores.join(' – ');return p;}));show('nextMatch',s.match<3&&s.phase!=='finished');$('nextMatch').disabled=!local&&(!online||!peer||pending);show('playAgain',s.phase==='finished');show('overallWinner',s.phase==='finished');if(s.phase==='finished'){const totals=[0,0];s.results.forEach(r=>{if(r.winner>=0)totals[r.winner]++;});txt('overallWinner',totals[0]===totals[1]?'CHAMPIONSHIP DRAW':s.names[totals[0]>totals[1]?0:1]+' WINS THE CHAMPIONSHIP · '+totals.join(' – '));}return;}
  const card=DECK.find(t=>t.id===s.task),key=s.match+':'+s.round+':'+s.level+':'+s.submitted+':'+s.custom;
  const libraryMismatch=s.mode==='classic'&&!card;
  if(draftKey!==key){$('answerBox').value='';$('customText').value='';draftKey=key;}
  txt('category',s.mode==='classic'?card?.category.toUpperCase()||'LIBRARY ERROR':'CUSTOM '+s.mode.toUpperCase());txt('roundLabel','ROUND '+s.round);txt('intensity',LABELS[s.match-1]+' · FIRST TO '+s.target);txt('challengeTitle',s.mode==='classic'?card?.title||'Challenge unavailable':'YOUR CUSTOM '+s.mode.toUpperCase());txt('levelLabel',s.mode==='classic'?'STEP '+(s.level+1)+' / 5':'SURPRISE ROUND');txt('playerDirection',s.names[s.turn]+' → '+s.names[challenger]);
  $('steps').replaceChildren(...[0,1,2,3,4].map(i=>{const e=document.createElement('i');e.className=i<=s.level?'on':'';return e;}));show('steps',s.mode==='classic');
  txt('taskPrompt',locked?(s.mode==='classic'?'The final step is locked. The conductor reveals it.':'The conductor writes your challenge.'):s.mode==='classic'?card?.steps[s.level].prompt||'Unable to read challenge. Decline or stop.':s.custom);
  show('revealFinal',conductor&&s.mode==='classic'&&s.level===4&&!s.revealed);show('customEditor',conductor&&s.mode!=='classic'&&!s.custom);txt('customLabel',s.mode==='truth'?'Set your own truth':'Set your own dare');show('customMedia',s.mode==='dare'&&s.playingMode==='remote');
  const text=s.responseType==='text',evidence=['photo','video'].includes(s.responseType);
  show('responsePanel',!locked&&(text||evidence));show('answerEditor',!conductor&&!s.submitted&&text&&!locked);txt('answerRead',s.answer);show('submittedBadge',s.submitted);txt('submittedBadge',text?'ANSWER SENT · CONDUCTOR REVIEWS':'EVIDENCE MARKED SENT · REVIEW IN SNAPCHAT');
  txt('responseNotice',text?(conductor?'Your partner’s submitted answer appears here.':'Write your answer and press SEND ANSWER.'):(conductor?'Review the '+s.responseType+' in Snapchat before Complete.':'Share a '+s.responseType+' through Snapchat, then return and mark EVIDENCE SENT. Fully clothed, objects or garments alone; no intimate images.'));
  show('sendAnswer',!conductor&&!s.submitted&&!locked&&text);show('evidenceSent',!conductor&&!s.submitted&&!locked&&evidence);show('complete',conductor&&!locked&&(s.submitted||s.responseType==='live'));show('retry',conductor&&!locked&&s.submitted);txt('complete',s.mode!=='classic'||s.level===4?'COMPLETE · CHALLENGER +1':'COMPLETE · NEXT STEP');
  txt('callNervous',local?s.names[challenger]+' · NERVOUS · +1':s.names[role]+' · NERVOUS · '+(conductor?'+2':'+1'));show('otherNervous',local);txt('otherNervous',s.names[s.turn]+' · NERVOUS · +2');
  for(const id of ['sendAnswer','evidenceSent','complete','retry','callNervous','otherNervous','skip','revealFinal','setCustom'])$(id).disabled=pending||(!local&&(!online||!peer));timer();
  show('actionButtons',!libraryMismatch);if(libraryMismatch){show('responsePanel',false);show('revealFinal',false);show('timerDisplay',false);txt('taskPrompt','This room uses an earlier challenge library. STOP, reload both devices and create a fresh room.');}
}
function timer(){if(!s)return;show('timerDisplay',s.timerSeconds>0&&s.phase==='playing'&&unlocked(s));if(s.timerSeconds){const secs=Math.max(0,Math.ceil((s.timerUntil-now())/1000));txt('timerDisplay',s.submitted?'TIMER PAUSED FOR REVIEW':secs?'OPTIONAL TIMER · '+secs+'s':'TAKE YOUR TIME · NO SCORING PENALTY');}}
async function end(){
  if(local){cleanup();return;}
  const ending=ref;if(!ending){cleanup();return;}
  const saved={room,role,uid,endRequested:true};pendingClose=ending;cleanup();sessionStorage.setItem(KEY,JSON.stringify(saved));show('home',false);show('connect',true);txt('connectStatus','Game stopped on this device. Room deletion is queued; reconnect to finish ending it for both players.');void flushClose();
}
function flushClose(){
  if(closeFlight)return closeFlight;const ending=pendingClose;if(!ending)return Promise.resolve();
  // Queue the write even while offline. Waiting for .info/connected before
  // writing can leave a client with no active room listeners idle on reconnect.
  closeFlight=(async()=>{try{await ending.remove();if(pendingClose===ending)pendingClose=null;const saved=JSON.parse(sessionStorage.getItem(KEY)||'null');if(saved?.endRequested&&saved.room===ending.key)sessionStorage.removeItem(KEY);txt('connectStatus','Room ended and its gameplay data was deleted.');}catch(e){txt('connectStatus','Stopped locally. Room deletion still needs a connection and valid staging access.');}finally{closeFlight=null;}})();return closeFlight;
}
async function leave(){if(local)return cleanup();if(role===0||s&&s.phase!=='setup')return end();try{await ref.child('presence/'+uid).set(false);await ref.child('ready/'+uid).set(false);await ref.child('guestUid').set('');cleanup();}catch(e){err(e);}}
function connect(mode){selected=mode;show('home',false);show('connect',true);txt('selectedMode',mode==='remote'?'MULTIPLE DEVICES · REMOTE':'MULTIPLE DEVICES · IN PERSON');}
$('single').onclick=async()=>{try{await libraryReady;local=true;role=0;s=base('in_person');lobby();render();}catch(e){show('home',false);show('connect',true);err(e);}};
$('multi').onclick=()=>show('deviceChoice',true);$('together').onclick=()=>connect('in_person');$('apart').onclick=()=>connect('remote');$('showJoin').onclick=()=>{connect('in_person');show('joinPanel',true);};$('backHome').onclick=cleanup;$('joinChoice').onclick=()=>show('joinPanel',true);$('createRoom').onclick=create;$('joinRoom').onclick=join;
$('readyCheck').onchange=async()=>{if(local){render();return;}const gen=generation;try{await ref.child('ready/'+uid).set($('readyCheck').checked);}catch(e){if(gen===generation)err(e);}};
$('startGame').onclick=()=>{if(local&&!$('readyCheck').checked)return;action('start',JSON.stringify({names:[$('player0').value.trim()||'Player 1',$('player1').value.trim()||'Player 2'],target:+$('target').value,surprise:$('surprises').value,timerSeconds:+$('timerSetting').value}));};
$('sendAnswer').onclick=()=>{if(!$('answerBox').value.trim()){txt('gameError','Write an answer first.');return;}action('submitAnswer',$('answerBox').value);};
for(const [button,id] of Object.entries({evidenceSent:'evidenceSent',complete:'complete',retry:'retry',revealFinal:'reveal',nextMatch:'nextMatch',skip:'skip'}))$(button).onclick=()=>action(id);
$('callNervous').onclick=()=>action('nervous','','photo',local?1-s.turn:role);$('otherNervous').onclick=()=>action('nervous','','photo',s.turn);$('setCustom').onclick=()=>{if(!$('customText').value.trim()){txt('gameError','Write a challenge first.');return;}action('setCustom',$('customText').value,$('customMedia').value);};
$('endGame').onclick=end;$('lobbyLeave').onclick=leave;$('playAgain').onclick=end;
for(const b of document.querySelectorAll('.rulesOpen'))b.onclick=()=>$('rulesDialog').showModal();$('closeRules').onclick=()=>$('rulesDialog').close();$('roomMenu').onclick=()=>{txt('dialogCode',room);txt('roomNotice','Both devices use '+(s.playingMode==='remote'?'Remote':'In Person')+'. The host phone must stay connected to process turns.');$('roomDialog').showModal();};$('closeRoomMenu').onclick=()=>$('roomDialog').close();
$('copyCode').onclick=async()=>{try{await navigator.clipboard.writeText(room);txt('lobbyError','Room code copied.');}catch{txt('lobbyError','Room code: '+room);}};
$('shareCode').onclick=async()=>{const url=location.origin+location.pathname+'?room='+room;try{if(navigator.share)await navigator.share({title:'Nervous Extreme',text:'Join room '+room,url});else{await navigator.clipboard.writeText(url);txt('lobbyError','Invitation copied.');}}catch(e){if(e.name!=='AbortError')txt('lobbyError',url);}};
setInterval(timer,500);
// Resume uses SESSION auth; no persistent challenge history or answers.
try{const saved=JSON.parse(sessionStorage.getItem(KEY)||'null'),code=new URLSearchParams(location.search).get('room');if(saved){connect('in_person');firebaseBoot().then(()=>{if(saved.uid!==uid)throw Error('Session ended. Create a new room.');if(saved.endRequested){pendingClose=db.ref('upgradeRooms/'+saved.room);return flushClose();}return attach(saved.room,saved.role);}).catch(e=>{cleanup();show('home',false);show('connect',true);err(e);});}else if(code){connect('in_person');show('joinPanel',true);$('roomCode').value=code.toUpperCase().replace(/[^A-Z2-9]/g,'').slice(0,6);}}catch{sessionStorage.removeItem(KEY);}
