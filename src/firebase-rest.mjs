import {config} from "./config.mjs";
import {localDb} from "./database.mjs";
const identity="https://identitytoolkit.googleapis.com/v1";
const firestore=()=>`https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents`;
async function request(url,options={}){
 const r=await fetch(url,{...options,headers:{"Content-Type":"application/json",...(options.headers||{})}});
 const data=await r.json().catch(()=>({}));if(!r.ok)throw Error(data.error?.message||"Firebase pogreška");return data
}
const authCall=(method,body)=>request(identity+"/accounts:"+method+"?key="+config.apiKey,{method:"POST",body:JSON.stringify({...body,returnSecureToken:true})});
export const firebaseAuth={
 async register(email,password){return saveAuth(await authCall("signUp",{email,password}))},
 async login(email,password){return saveAuth(await authCall("signInWithPassword",{email,password}))},
 async guest(){return saveAuth(await authCall("signUp",{}))},
 logout(){localDb.session(null)},
 current(){const s=localDb.session();return s&&s.localId?s:null}
};
function saveAuth(data){const s={localId:data.localId,email:data.email||null,idToken:data.idToken,refreshToken:data.refreshToken,expiresAt:Date.now()+Number(data.expiresIn||3600)*1000};localDb.session(s);return s}
async function validSession(){
 let s=firebaseAuth.current();if(!s)throw Error("Niste prijavljeni.");
 if(Date.now()<s.expiresAt-60000)return s;
 const body=new URLSearchParams({grant_type:"refresh_token",refresh_token:s.refreshToken});
 const r=await fetch("https://securetoken.googleapis.com/v1/token?key="+config.apiKey,{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body});
 const d=await r.json();if(!r.ok)throw Error(d.error?.message||"Sesija je istekla.");
 s={...s,localId:d.user_id,idToken:d.id_token,refreshToken:d.refresh_token,expiresAt:Date.now()+Number(d.expires_in)*1000};localDb.session(s);return s
}
function fields(row){const skip=new Set(["id","user_id","synced","updated_at"]);const out={};for(const[k,v]of Object.entries(row)){if(skip.has(k)||v===undefined)continue;if(typeof v==="number")out[k]={doubleValue:v};else if(typeof v==="boolean")out[k]={booleanValue:v};else out[k]={stringValue:String(v)}}return out}
function decode(doc){const row={id:doc.name.split("/").pop(),synced:1};for(const[k,v]of Object.entries(doc.fields||{})){if(v.stringValue!==undefined)row[k]=v.stringValue;else if(v.integerValue!==undefined)row[k]=Number(v.integerValue);else if(v.doubleValue!==undefined)row[k]=Number(v.doubleValue);else if(v.booleanValue!==undefined)row[k]=v.booleanValue}return row}
export const cloud={
 async push(name,row){const s=await validSession();await request(firestore()+"/users/"+s.localId+"/"+name+"/"+row.id,{method:"PATCH",headers:{Authorization:"Bearer "+s.idToken},body:JSON.stringify({fields:fields(row)})});localDb.markSynced(name,row.id)},
 async pull(name){const s=await validSession();const d=await request(firestore()+"/users/"+s.localId+"/"+name,{headers:{Authorization:"Bearer "+s.idToken}});return(d.documents||[]).map(decode)},
 async remove(name,id){const s=await validSession();const r=await fetch(firestore()+"/users/"+s.localId+"/"+name+"/"+id,{method:"DELETE",headers:{Authorization:"Bearer "+s.idToken}});if(!r.ok&&r.status!==404)throw Error("Brisanje iz oblaka nije uspjelo.")},
 async sync(name){const s=await validSession();for(const row of localDb.unsynced(name,s.localId))await this.push(name,row);for(const row of await this.pull(name))localDb.put(name,s.localId,row,1)}
};
