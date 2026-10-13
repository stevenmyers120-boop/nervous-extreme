import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
import {initializeTestEnvironment,assertFails,assertSucceeds} from '@firebase/rules-unit-testing';
import * as engine from '../engine.js';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const deck=JSON.parse(fs.readFileSync(new URL('../challenge-library.json',import.meta.url))).challenges;
const source=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8').replace(/^import .*$/m,'const {base,normalize,transition,unlocked,LABELS}=window.testEngine;');
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,label){for(let i=0;i<350;i++){if(fn())return;await delay(15);}throw Error('Timeout: '+label);}
function browser(db,uid,saved){
  const dom=new JSDOM(html,{url:'https://test.example/upgrade/',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;
  w.testEngine=engine;w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};
  if(saved)w.sessionStorage.setItem('nervous-upgrade-room',saved);
  w.fetch=async path=>({ok:true,json:async()=>path==='challenge-library.json'?{challenges:deck}:{enabled:true,config:{projectId:'demo-nervous-upgrade'}}});
  w.firebase={apps:[],initializeApp:()=>{},auth:Object.assign(()=>({currentUser:{uid},setPersistence:async()=>{}}),{Auth:{Persistence:{SESSION:'session'}}}),database:Object.assign(()=>db,{ServerValue:{TIMESTAMP:{'.sv':'timestamp'}}})};
  const append=w.document.head.append.bind(w.document.head);w.document.head.append=node=>{if(node.tagName==='SCRIPT')queueMicrotask(()=>node.onload());else append(node);};
  w.eval(source+'\nwindow.gameTest={read:x=>eval(x),action,stop:()=>{generation++;stops.splice(0).forEach(f=>f());if(db){db.ref(".info/connected").off();db.ref(".info/serverTimeOffset").off();}clearTimeout(expiryTimer);}};');return dom;
}
const get=(w,id)=>w.document.getElementById(id),read=(w,x)=>w.gameTest.read(x),state=w=>read(w,'s'),rev=w=>read(w,'revision');
async function click(w,id){const before=rev(w);get(w,id).click();await until(()=>rev(w)>before,id+' state');await until(()=>!read(w,'pending'),id+' ack');}
test('single phone actual controls: consent, play, reveal, both Nervous buttons, score and end cleanup',async()=>{
  const env=await initializeTestEnvironment({projectId:'demo-nervous-upgrade',database:{host:'127.0.0.1',port:9001,rules:fs.readFileSync(new URL('../staging.rules.json',import.meta.url),'utf8')}});
  const db=env.authenticatedContext('solo').database(),dom=browser(db,'solo'),w=dom.window;
  try{get(w,'single').click();await until(()=>state(w),'solo setup');assert.equal(get(w,'startGame').disabled,true);get(w,'readyCheck').click();get(w,'surprises').value='off';await click(w,'startGame');assert.equal(state(w).phase,'playing');for(let i=0;i<4;i++)await click(w,'complete');assert.ok(get(w,'complete').classList.contains('hidden'));await click(w,'revealFinal');await click(w,'complete');assert.deepEqual(Array.from(state(w).wins),[0,1]);await click(w,'callNervous');await click(w,'otherNervous');assert.deepEqual(Array.from(state(w).wins),[0,4]);get(w,'endGame').click();assert.equal(state(w),null);assert.equal(w.sessionStorage.getItem('nervous-upgrade-room'),null);assert.equal(get(w,'answerBox').value,'');}finally{w.gameTest.stop();w.close();db.goOffline();await env.cleanup();}
});
for(const mode of ['in_person','remote'])test('two independent Firebase clients and controls: '+mode,async()=>{
  const env=await initializeTestEnvironment({projectId:'demo-nervous-upgrade',database:{host:'127.0.0.1',port:9001,rules:fs.readFileSync(new URL('../staging.rules.json',import.meta.url),'utf8')}});
  const hdb=env.authenticatedContext('host-'+mode).database(),gdb=env.authenticatedContext('guest-'+mode).database(),xdb=env.authenticatedContext('intruder').database();
  let host=browser(hdb,'host-'+mode),guest=browser(gdb,'guest-'+mode),h=host.window,g=guest.window;
  const sync=async()=>{await until(()=>rev(h)===rev(g),'synchronisation');await delay(20);};let root;
  const force=async patch=>{await hdb.ref(root+'/game').set({revision:rev(h)+1,state:{...state(h),...patch},updatedAt:{'.sv':'timestamp'}});await sync();};
  const bad=(id,db=gdb,text='')=>db.ref(root+'/actions').push().set({id,uid:db===hdb?'host-'+mode:'guest-'+mode,revision:rev(h),at:{'.sv':'timestamp'},text,media:'photo'});
  try{
    get(h,'multi').click();get(h,mode==='remote'?'apart':'together').click();get(h,'createRoom').click();try{await until(()=>read(h,'room')&&state(h),'room creation');}catch(e){throw Error(e.message+' · '+get(h,'connectStatus').textContent+' · '+get(h,'lobbyError').textContent);}const code=read(h,'room');root='upgradeRooms/'+code;
    await assertFails(xdb.ref(root).once('value'));await assertFails(env.unauthenticatedContext().database().ref(root).once('value'));
    get(g,'multi').click();get(g,mode==='remote'?'together':'apart').click();get(g,'joinChoice').click();get(g,'roomCode').value=code;get(g,'joinRoom').click();await until(()=>state(g),'joining');await until(()=>read(h,'peer')&&read(g,'peer'),'presence');assert.equal(state(g).playingMode,mode);
    await assertFails(xdb.ref(root+'/guestUid').set('intruder'));await assertFails(xdb.ref(root).remove());
    await assertFails(gdb.ref(root+'/game').set({revision:rev(g)+1,state:state(g),updatedAt:{'.sv':'timestamp'}}));
    get(h,'readyCheck').click();get(g,'readyCheck').click();await until(()=>!get(h,'startGame').disabled,'both ready');get(h,'player0').value='Alex';get(h,'player1').value='Sam';get(h,'surprises').value='off';get(h,'timerSetting').value='15';await click(h,'startGame');await sync();assert.equal(state(g).phase,'playing');if(mode==='remote'){const textCard=deck.find(t=>t.mode==='remote'&&t.stage==='warm_up'&&t.steps.every(v=>v.type==='text'));await force({task:textCard.id,used:[textCard.conceptId],responseType:'text'});}
    await assertFails(bad('complete'));await assertFails(bad('submitAnswer',hdb,'wrong actor'));await assertFails(gdb.ref(root+'/guestUid').set(''));assert.equal(get(g,'complete').classList.contains('hidden'),true);
    for(let i=0;i<5;i++){
      if(i===4){await assertFails(bad('complete',hdb));await click(h,'revealFinal');await sync();}
      if(mode==='remote'){get(g,'answerBox').value=i===0?'Private draft':'Answer '+i;assert.equal(state(h).answer,'');await click(g,'sendAnswer');await sync();assert.equal(state(h).timerUntil,0);if(i===0){assert.equal(state(h).answer,'Private draft');await click(h,'retry');await sync();assert.equal(state(g).answer,'');get(g,'answerBox').value='<img src=x onerror=alert(1)>';await click(g,'sendAnswer');await sync();assert.equal(get(h,'answerRead').querySelector('img'),null);}}
      await click(h,'complete');await sync();assert.equal(state(g).answer,'');
    }
    assert.equal(state(h).wins[1],1);assert.equal(state(h).turn,1);
    // Guest is now conductor; host remains engine authority.
    await assertFails(bad('complete',hdb));
    if(mode==='remote'){
      const photo=deck.find(t=>t.mode==='remote'&&t.stage==='warm_up'&&t.steps[0].type==='photo');assert.ok(photo);await force({task:photo.id,responseType:'photo',level:0,mode:'classic',submitted:false,revealed:false});await assertFails(bad('evidenceSent',gdb));await click(h,'evidenceSent');await sync();await click(g,'complete');await sync();
      for(const customMode of ['truth','dare']){
        await force({mode:customMode,custom:'',level:0,submitted:false,answer:'',revealed:false,responseType:customMode==='truth'?'text':'photo'});
        const cw=state(h).turn===0?h:g,aw=cw===h?g:h;get(cw,'customText').value=customMode==='truth'?'What film do you secretly like?':'Show a drawing you made.';get(cw,'customMedia').value='video';await click(cw,'setCustom');await sync();assert.equal(state(h).responseType,customMode==='truth'?'text':'video');
        if(customMode==='truth'){get(aw,'answerBox').value='A film answer';await click(aw,'sendAnswer');}else await click(aw,'evidenceSent');await sync();await click(cw,'complete');await sync();
      }
    }else{await click(g,'complete');await sync();assert.equal(state(h).level,1);}
    // Session resumes from server state without sending drafts.
    const saved=g.sessionStorage.getItem('nervous-upgrade-room');g.gameTest.stop();g.close();guest=browser(gdb,'guest-'+mode,saved);g=guest.window;await until(()=>state(g),'guest resume');await sync();assert.equal(state(g).playingMode,mode);
    await force({phase:'playing',round:1,turn:0,wins:[0,0],level:0,mode:'classic',responseType:mode==='remote'?'text':'live',submitted:false,custom:'',revealed:false});await click(g,'callNervous');await sync();assert.equal(state(h).wins[0],1);await click(g,'callNervous');await sync();assert.equal(state(h).wins[0],3);const scores=[...state(h).wins];await click(g,'skip');await sync();assert.deepEqual([...state(h).wins],scores);
    for(let i=0;i<6;i++){await click(h,'skip');await sync();assert.equal(state(h).classics,0);}const used=[...state(h).used];assert.equal(new Set(used).size,used.length);
    for(let m=1;m<=3;m++){await force({phase:'playing',match:m,round:1,turn:0,wins:[14,0],target:15,level:0,mode:'classic',submitted:false,answer:'',custom:'',responseType:mode==='remote'?'text':'live'});await click(g,'callNervous');await sync();assert.equal(state(h).phase,m===3?'finished':'winner');if(m<3){await click(g,'nextMatch');await sync();assert.equal(state(h).match,m+1);}}
    assert.equal(state(h).results.length,3);assert.deepEqual([...state(h).used],[]);assert.match(get(g,'overallWinner').textContent,/Alex WINS/);
    if(mode==='remote'){gdb.goOffline();await until(()=>!read(g,'online'),'offline');get(g,'endGame').click();assert.equal(state(g),null);assert.match(get(g,'connectStatus').textContent,/stopped on this device/);assert.ok(JSON.parse(g.sessionStorage.getItem('nervous-upgrade-room')).endRequested);assert.ok(read(g,'closeFlight'),'offline deletion is queued before reconnect');gdb.goOnline();}else {await force({phase:'playing',round:2,turn:1,mode:'classic',level:0,responseType:'live',submitted:false});get(g,'skip').click();get(g,'endGame').click();assert.equal(state(g),null);assert.ok(read(g,'closeFlight'));}await until(()=>!read(h,'room')&&!read(g,'room'),'room deletion');await until(()=>g.sessionStorage.getItem('nervous-upgrade-room')===null,'pending closure cleared');await delay(150);assert.doesNotMatch(get(h,'connectStatus').textContent,/rules are not installed/);assert.doesNotMatch(get(g,'connectStatus').textContent,/rules are not installed/);await env.withSecurityRulesDisabled(async ctx=>assert.equal((await ctx.database().ref(root).once('value')).exists(),false));
  }finally{for(const dom of [host,guest]){try{dom.window.gameTest.stop();}catch{}dom.window.close();}hdb.goOffline();gdb.goOffline();xdb.goOffline();await env.cleanup();}
});
