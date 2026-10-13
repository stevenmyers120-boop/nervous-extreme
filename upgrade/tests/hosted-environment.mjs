// Actual anonymous accounts and RTDB SDK connections in the isolated staging project.
import fs from 'node:fs';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/database';
const config=JSON.parse(fs.readFileSync(new URL('../firebase-config.json',import.meta.url))).config;
if(config.projectId!=='nervous-extreme-upgrade-test')throw Error('Hosted tests require the isolated project');
let serial=0;
export async function initializeHostedEnvironment(){
  const clients=new Map();
  for(const name of ['solo','host-in_person','guest-in_person','host-remote','guest-remote','intruder','unauth']){
    const app=firebase.initializeApp(config,'qa-'+(++serial));
    if(name!=='unauth')await app.auth().signInAnonymously();
    clients.set(name,app);
  }
  return {authenticatedContext:name=>({database:()=>clients.get(name).database()}),unauthenticatedContext:()=>({database:()=>clients.get('unauth').database()}),cleanup:async()=>{for(const app of clients.values()){app.database().goOffline();if(app.auth().currentUser)await app.auth().currentUser.delete();await app.delete();}}};
}
