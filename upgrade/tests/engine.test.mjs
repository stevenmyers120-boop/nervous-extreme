import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {base,transition,STAGES,stageFor} from '../engine.js';
const deck=JSON.parse(fs.readFileSync(new URL('../challenge-library.json',import.meta.url))).challenges;
const start=(mode='in_person',cards=deck)=>transition(base(mode),{id:'start',text:JSON.stringify({names:['Alex','Sam'],target:15,surprise:'off',timerSeconds:15})},0,cards,1000,()=>0);
test('original working files and production Firebase rules remain byte-for-byte preserved',()=>{
  for(const file of ['index.html','distance.html','distance.js','distance-deck.json','database.rules.json','firebase.json']){
    const original=execFileSync('git',['show','7dec9af9363bec84d79db27226469adbbff5e245:'+file],{cwd:new URL('../../',import.meta.url)});
    assert.deepEqual(fs.readFileSync(new URL('../../'+file,import.meta.url)),original);
  }
  const original=JSON.parse(fs.readFileSync(new URL('../../database.rules.json',import.meta.url))).rules;
  const staged=JSON.parse(fs.readFileSync(new URL('../staging.rules.json',import.meta.url))).rules;
  assert.deepEqual(staged.rooms,original.rooms);assert.deepEqual(staged.distanceRooms,original.distanceRooms);
});
test('single phone: five steps, final reveal, scoring, both Nervous directions, decline and fresh pool',()=>{
  let s=start();assert.equal(s.phase,'playing');assert.equal(s.responseType,'live');assert.equal(s.timerUntil,16000);
  assert.equal(transition(s,{id:'complete'},1,deck),null);
  for(let i=0;i<4;i++){s=transition(s,{id:'complete'},0,deck,2000,()=>0);assert.equal(s.level,i+1);}
  assert.equal(transition(s,{id:'complete'},0,deck),null);s=transition(s,{id:'reveal'},0,deck,3000);s=transition(s,{id:'complete'},0,deck,3000,()=>0);
  assert.deepEqual(s.wins,[0,1]);assert.equal(s.turn,1);assert.equal(s.used.length,2);
  s=transition(s,{id:'nervous'},0,deck,4000,()=>0);assert.deepEqual(s.wins,[0,2]);
  s=transition(s,{id:'nervous'},0,deck,4000,()=>0);assert.deepEqual(s.wins,[0,4]);
  const before=[...s.wins];s=transition(s,{id:'skip'},0,deck,4000,()=>0);assert.deepEqual(s.wins,before);
  assert.ok(new Set(s.used).size===s.used.length);assert.deepEqual(base().used,[]);
});
test('remote text: drafts absent, only challenger submits, review, final step and clearing',()=>{
  let s=start('remote');assert.equal(s.responseType,'text');assert.equal(transition(s,{id:'complete'},0,deck),null);assert.equal(transition(s,{id:'submitAnswer',text:'wrong actor'},0,deck),null);
  s=transition(s,{id:'submitAnswer',text:'A candid answer'},1,deck,2000);assert.equal(s.answer,'A candid answer');assert.equal(s.timerUntil,0);
  assert.equal(transition(s,{id:'complete'},1,deck),null);s=transition(s,{id:'retry'},0,deck,3000);assert.equal(s.answer,'');assert.equal(s.submitted,false);
  s=transition(s,{id:'submitAnswer',text:'Fuller answer'},1,deck);s=transition(s,{id:'complete'},0,deck,3000);assert.equal(s.level,1);assert.equal(s.answer,'');assert.equal(s.submitted,false);
});
test('remote custom truth uses text; photo/video custom dares require Snapchat marker',()=>{
  for(const mode of ['truth','dare'])for(const media of ['photo','video']){
    let s={...start('remote'),mode,custom:'',submitted:false};assert.equal(transition(s,{id:'setCustom',text:'Question'},1,deck),null);
    s=transition(s,{id:'setCustom',text:'Any subject in our boundaries',media},0,deck);assert.equal(s.responseType,mode==='truth'?'text':media);
    assert.equal(transition(s,{id:'complete'},0,deck),null);
    s=transition(s,{id:mode==='truth'?'submitAnswer':'evidenceSent',text:'Response'},1,deck);assert.equal(s.submitted,true);
    s=transition(s,{id:'complete'},0,deck,1000,()=>0);assert.equal(s.wins[1],1);assert.equal(s.custom,'');assert.equal(s.answer,'');
  }
});
test('stage-only selection, no repeat on exhaustion, three matches and cleanup',()=>{
  const small=deck.filter(t=>t.mode==='in_person').filter((t,i,a)=>a.findIndex(v=>v.stage===t.stage)===i);
  let s=start('in_person',small);s=transition(s,{id:'skip'},1,small,1000,()=>0);assert.equal(s.phase,'exhausted');assert.equal(s.used.length,1);assert.equal(s.task,'');
  s=transition(s,{id:'nextMatch'},1,small,1000,()=>0);assert.equal(s.match,2);assert.equal(s.used.length,2);assert.equal(small.find(t=>t.id===s.task).stage,STAGES[1]);
  s=transition(s,{id:'skip'},1,small,1000,()=>0);s=transition(s,{id:'nextMatch'},0,small,1000,()=>0);assert.equal(s.match,3);assert.equal(s.used.length,3);
  let full=start();for(let m=1;m<=3;m++){full={...full,match:m,wins:[14,0],round:1,turn:0};full=transition(full,{id:'nervous'},1,deck,1000,()=>0);assert.equal(full.phase,m===3?'finished':'winner');assert.equal(full.answer,'');if(m<3)full=transition(full,{id:'nextMatch'},1,deck,1000,()=>0);}
  assert.equal(full.results.length,3);assert.deepEqual(full.used,[]);assert.equal(full.custom,'');assert.equal(full.task,'');
});
test('reject malformed settings and unsupported actions',()=>{
  for(const text of ['invalid','null','{}',JSON.stringify({names:['x','y'],target:150,surprise:'off',timerSeconds:15})])assert.equal(transition(base(),{id:'start',text},0,deck),null);
  assert.equal(transition(start(),{id:'nervous'},2,deck),null);assert.equal(transition(start(),{id:'missing'},0,deck),null);
});
test('entire stage pools can be exhausted without repeats or an invalid custom-round counter',()=>{
  let s=start();
  for(let m=1;m<=3;m++){
    const expected=[40,160,300][m-1],before=s.used.length-1;
    for(let i=0;i<expected;i++){
      assert.equal(s.phase,'playing');assert.equal(deck.find(c=>c.id===s.task).stage,STAGES[m-1]);
      s=transition(s,{id:'skip'},1-s.turn,deck,1000,()=>0);assert.equal(s.classics,0);
    }
    assert.equal(s.phase,'exhausted');assert.equal(s.used.length,before+expected);assert.equal(new Set(s.used).size,s.used.length);
    if(m<3)s=transition(s,{id:'nextMatch'},0,deck,1000,()=>0);
  }
});

test('score thresholds select the next stage in all three rounds and both modes',()=>{
  for(const mode of ['in_person','remote']){
    let s=start(mode);
    for(const [match,wins,expected] of [[1,[3,3],'warm_up'],[1,[3,4],'getting_personal'],[1,[11,0],'getting_personal'],[1,[12,0],'extreme'],[2,[9,0],'getting_personal'],[2,[0,10],'extreme'],[3,[0,0],'extreme']]){
      const state={...s,match,wins};assert.equal(stageFor(state),expected);
      const next=transition(state,{id:'skip'},state.turn,deck,1000,()=>0);assert.equal(deck.find(c=>c.id===next.task).stage,expected);
    }
    s={...s,wins:[3,3],submitted:true};const original=s.task;
    s=transition(s,{id:'complete'},s.turn,deck,1000,()=>0);assert.equal(s.task,original);
    s=transition(s,{id:'nervous'},1-s.turn,deck,1000,()=>0);assert.equal(deck.find(c=>c.id===s.task).stage,'getting_personal');
    s={...s,wins:[0,11],turn:0};s=transition(s,{id:'nervous'},s.turn,deck,1000,()=>0);assert.deepEqual(s.wins,[0,13]);assert.equal(deck.find(c=>c.id===s.task).stage,'extreme');
    s={...s,wins:[14,0]};s=transition(s,{id:'nervous'},1-s.turn,deck,1000,()=>0);assert.equal(s.phase,'winner');
    s=transition(s,{id:'nextMatch'},0,deck,1000,()=>0);assert.deepEqual(s.wins,[0,0]);assert.equal(deck.find(c=>c.id===s.task).stage,'getting_personal');
  }
});
test('fixed fifteen-point target cannot be overridden',()=>{
  for(const target of [10,20,100])assert.equal(transition(base(),{id:'start',text:JSON.stringify({names:['A','B'],target,surprise:'off',timerSeconds:0})},0,deck),null);
  const s=transition(base(),{id:'start',text:JSON.stringify({names:['A','B'],surprise:'off',timerSeconds:0})},0,deck);assert.equal(s.target,15);
});
