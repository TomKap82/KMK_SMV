import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js';
import { getAuth, onAuthStateChanged, signInAnonymously, signInWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js';
import { getFirestore, collection, doc, addDoc, setDoc, deleteDoc, onSnapshot, getDoc, query, orderBy, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';

const $ = id => document.getElementById(id);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
let user = null;
let isAdmin = false;
let ideas = [];
let actions = [];
const votes = new Map();
const helpers = new Map();
const subscriptions = new Map();
let filter = 'all';
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const short = (value, len) => String(value ?? '').trim().slice(0, len);
const errorMessage = e => ({'permission-denied':'Zugriff verweigert. Bitte Berechtigungen prüfen.','unavailable':'Firebase ist gerade nicht erreichbar.','auth/invalid-credential':'Anmeldedaten ungültig.'}[e.code] || e.message || String(e));
function status(message, bad=false){ const el=$('status'); el.textContent=message; el.className=`text-xs ${bad?'text-rose-400':'text-slate-400'}`; }
function iconRefresh(){ if(window.lucide) window.lucide.createIcons(); }
function modal(id,visible){ $(id).classList.toggle('hidden',!visible); }
window.openModal=id=>modal(id,true);
window.closeModal=id=>modal(id,false);
window.switchTab=id=>{
  document.querySelectorAll('.tab-content').forEach(el=>el.classList.add('hidden'));
  $('tab-'+id).classList.remove('hidden');
  document.querySelectorAll('.nav-btn,.mob-btn').forEach(el=>el.classList.remove('text-white','bg-accent','text-accent'));
  $('nav-'+id)?.classList.add('text-white','bg-accent'); $('mob-'+id)?.classList.add('text-accent');
};
window.filterIdeas=(category,button)=>{
  filter=category;
  document.querySelectorAll('.filter-btn-idea').forEach(b=>b.classList.remove('bg-accent','text-white'));
  button.classList.add('bg-accent','text-white');
  renderIdeas();
};
function monitorChildren(kind, items, map, parentDoc, childCollection){
  const active=new Set(items.map(i=>i.id));
  for(const [id,unsubscribe] of [...subscriptions]){
    if(id.startsWith(kind+':') && !active.has(id.slice(kind.length+1))){unsubscribe(); subscriptions.delete(id); map.delete(id.slice(kind.length+1));}
  }
  for(const item of items){
    const key=kind+':'+item.id;
    if(subscriptions.has(key)) continue;
    const ref=collection(db,parentDoc,item.id,childCollection);
    subscriptions.set(key,onSnapshot(ref,snap=>{
      map.set(item.id,snap.docs.map(d=>({id:d.id,...d.data()})));
      kind==='vote'?renderIdeas():renderActions();
    },e=>status(errorMessage(e),true)));
  }
}
function renderIdeas(){
  const shown=filter==='all'?ideas:ideas.filter(i=>i.category===filter);
  $('ideasGrid').innerHTML=shown.length?shown.map(i=>{
    const v=votes.get(i.id)||[];
    const yes=v.filter(x=>x.choice==='yes').length;
    const no=v.filter(x=>x.choice==='no').length;
    const pct=yes+no?Math.round(yes*100/(yes+no)):0;
    const mine=v.find(x=>x.id===user?.uid)?.choice;
    return `<article class="bg-cardbg border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
      <div><div class="flex justify-between mb-3"><span class="text-indigo-400 text-xs">${escapeHtml(i.category)}</span><span class="text-slate-500 text-xs">${escapeHtml(i.id.slice(0,8))}</span></div>
      <h3 class="font-bold text-base mb-2">${escapeHtml(i.title)}</h3><p class="text-slate-400 text-sm mb-4 whitespace-pre-wrap">${escapeHtml(i.desc)}</p></div>
      <div class="pt-3 border-t border-slate-800"><div class="flex justify-between text-xs text-slate-400 mb-2"><span>Zustimmung ${pct}%</span><span>${yes} von ${yes+no}</span></div>
      <div class="w-full bg-slate-900 h-2 rounded-full flex overflow-hidden mb-3"><div class="bg-emerald-500" style="width:${pct}%"></div><div class="bg-rose-500" style="width:${100-pct}%"></div></div>
      <div class="flex gap-2"><button data-vote="yes" data-id="${i.id}" class="vote-btn flex-1 rounded-xl px-3 py-2 text-xs ${mine==='yes'?'bg-emerald-700':'bg-slate-800 hover:bg-slate-700'}">Dafür (${yes})</button>
      <button data-vote="no" data-id="${i.id}" class="vote-btn flex-1 rounded-xl px-3 py-2 text-xs ${mine==='no'?'bg-rose-700':'bg-slate-800 hover:bg-slate-700'}">Dagegen (${no})</button></div></div></article>`;
  }).join(''):'<p class="text-slate-400 col-span-full p-10 text-center">Noch keine Ideen vorhanden.</p>';
}
function renderActions(){
  $('actionsContainer').innerHTML=actions.length?actions.map(a=>{
    const registered=helpers.get(a.id)||[];
    const slotHtml=(a.slots||[]).map((slot,index)=>{
      const members=registered.filter(h=>h.slot===index);
      const mine=members.some(h=>h.id===user?.uid);
      const max=Number(slot.max)||1;
      return `<div class="bg-slate-900/60 rounded-xl border border-slate-800 p-4 mb-3"><div class="flex justify-between text-sm mb-2"><strong>${escapeHtml(slot.name)}</strong><span class="text-slate-400">${members.length}/${max} Plätze</span></div>
      <p class="text-xs text-slate-300 mb-3">${members.length?members.map(h=>escapeHtml(h.name)).join(' · '):'Noch keine Helfer eingetragen'}</p>
      ${mine?`<button data-helper="remove" data-action="${a.id}" data-slot="${index}" class="helper-btn text-xs text-rose-400">Meinen Eintrag entfernen</button>`:`<div class="flex gap-2"><input data-helper-input="${a.id}:${index}" maxlength="50" placeholder="Name / Kürzel (keine Pflicht zu Klarnamen)" class="flex-1 min-w-0 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs"><button ${members.length>=max?'disabled':''} data-helper="add" data-action="${a.id}" data-slot="${index}" class="helper-btn bg-accent disabled:opacity-40 rounded-lg px-3 text-xs">Eintragen</button></div>`}
      </div>`;
    }).join('');
    return `<article class="bg-cardbg border border-slate-800 rounded-2xl p-6 shadow-lg"><h3 class="font-bold text-lg">${escapeHtml(a.title)}</h3><p class="text-xs text-indigo-400 my-2">${escapeHtml(a.date)} · ${escapeHtml(a.location)}</p><p class="text-slate-400 text-sm mb-4 whitespace-pre-wrap">${escapeHtml(a.desc)}</p><h4 class="text-xs font-bold uppercase text-slate-400 mb-3">Aufgabenbereiche & Helfer</h4>${slotHtml}</article>`;
  }).join(''):'<p class="text-slate-400 p-10 text-center">Aktuell sind keine Aktionen geplant.</p>';
}
async function run(fn){try{await fn();status('Verbunden · Änderungen werden automatisch synchronisiert.');}catch(e){console.error(e);status(errorMessage(e),true);alert('Speichern fehlgeschlagen: '+errorMessage(e));}}
$('ideasGrid').addEventListener('click',e=>{
  const b=e.target.closest('.vote-btn'); if(!b||!user)return;
  run(async()=>{
    const ref=doc(db,'ideas',b.dataset.id,'votes',user.uid);
    const current=(votes.get(b.dataset.id)||[]).find(v=>v.id===user.uid)?.choice;
    if(current===b.dataset.vote)await deleteDoc(ref);
    else await setDoc(ref,{choice:b.dataset.vote,uid:user.uid,updatedAt:serverTimestamp()});
  });
});
$('actionsContainer').addEventListener('click',e=>{
  const b=e.target.closest('.helper-btn');if(!b||!user)return;
  run(async()=>{
    const ref=doc(db,'actions',b.dataset.action,'helpers',user.uid);
    if(b.dataset.helper==='remove')return deleteDoc(ref);
    const input=document.querySelector(`[data-helper-input="${b.dataset.action}:${b.dataset.slot}"]`);
    const name=short(input?.value,50);
    if(!name)throw Error('Bitte ein Kürzel oder einen Namen eingeben.');
    const all=helpers.get(b.dataset.action)||[];
    if(all.some(x=>x.id===user.uid))throw Error('Du bist bereits bei dieser Aktion eingetragen.');
    await setDoc(ref,{uid:user.uid,slot:Number(b.dataset.slot),name,createdAt:serverTimestamp()});
  });
});
$('ideaForm').addEventListener('submit',e=>{e.preventDefault();run(async()=>{
  await addDoc(collection(db,'ideas'),{
    title:short($('newIdeaTitle').value,100),category:$('newIdeaCategory').value,desc:short($('newIdeaDesc').value,1000),
    owner:user.uid,createdAt:serverTimestamp()
  });
  e.target.reset();modal('ideaModal',false);
});});
$('actionForm').addEventListener('submit',e=>{e.preventDefault();run(async()=>{
  if(!isAdmin)throw Error('Nur Admins dürfen Aktionen erstellen.');
  const slots=short($('newActionSlots').value,500).split(',').map(part=>{
    const m=part.trim().match(/^(.*?)\s*\((\d+)\)$/);
    return {name:short(m?m[1]:part,60),max:m?Math.min(100,Math.max(1,+m[2])):3};
  }).filter(s=>s.name).slice(0,10);
  if(!slots.length)throw Error('Mindestens ein Aufgabenbereich ist erforderlich.');
  await addDoc(collection(db,'actions'),{
    title:short($('newActionTitle').value,100),date:$('newActionDate').value,location:short($('newActionLocation').value,100),
    desc:short($('newActionDesc').value,1000),slots,owner:user.uid,createdAt:serverTimestamp()
  });
  e.target.reset();modal('actionModal',false);
});});
$('adminForm').addEventListener('submit',e=>{e.preventDefault();run(async()=>{
  await signInWithEmailAndPassword(auth,$('adminEmail').value,$('adminPassword').value);
  $('adminPassword').value='';modal('adminModal',false);
});});
$('adminLogout').addEventListener('click',()=>run(async()=>{await signOut(auth);await signInAnonymously(auth);}));
let offIdeas,offActions;
onAuthStateChanged(auth,async u=>{
  user=u;isAdmin=false;
  if(!u){await run(()=>signInAnonymously(auth));return;}
  try{isAdmin=!(u.isAnonymous)&&((await getDoc(doc(db,'admins',u.uid))).exists());}catch(e){console.error(e);}
  $('createAction').classList.toggle('hidden',!isAdmin);
  $('adminLogout').classList.toggle('hidden',!isAdmin);
  $('adminLogin').classList.toggle('hidden',isAdmin);
  if(offIdeas)offIdeas();if(offActions)offActions();
  for(const unsub of subscriptions.values())unsub();subscriptions.clear();votes.clear();helpers.clear();
  offIdeas=onSnapshot(query(collection(db,'ideas'),orderBy('createdAt','desc')),snap=>{
    ideas=snap.docs.map(d=>({id:d.id,...d.data()})); monitorChildren('vote',ideas,votes,'ideas','votes');renderIdeas();
    status('Verbunden · Live-Synchronisation aktiv.');
  },e=>status(errorMessage(e),true));
  offActions=onSnapshot(query(collection(db,'actions'),orderBy('createdAt','desc')),snap=>{
    actions=snap.docs.map(d=>({id:d.id,...d.data()}));monitorChildren('helper',actions,helpers,'actions','helpers');renderActions();
  },e=>status(errorMessage(e),true));
});
iconRefresh();
if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(console.warn);
