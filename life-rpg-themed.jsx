import { useState, useEffect, useRef, useCallback, useMemo, memo } from "react";

const FONT=`@import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700&family=Cinzel:wght@400;600;700&family=Rajdhani:wght@400;500;600;700&display=swap');`;

/* ══ THEMES ══════════════════════════════════════════════ */
const DARK={
  bg:"#080810",bgImg:"radial-gradient(ellipse at 20% 0%,rgba(120,60,200,.12) 0%,transparent 50%),radial-gradient(ellipse at 80% 100%,rgba(200,100,20,.08) 0%,transparent 50%)",
  header:"linear-gradient(180deg,#12101e,#0d0b18)",headerBd:"rgba(212,170,80,.3)",headerSh:"0 4px 30px rgba(0,0,0,.5)",
  nav:"#0d0b18",navBd:"rgba(212,170,80,.1)",
  card:"linear-gradient(135deg,#14111f,#100e1a)",cardBd:"rgba(212,170,80,.14)",cardSh:undefined,
  inp:"#0a0816",inpBd:"rgba(212,170,80,.25)",inpFc:"#d4aa50",
  text:"#f0e8d0",text2:"#b09070",text3:"#706050",
  gold:"#d4aa50",goldBri:"#fde68a",
  xpTk:"#1a1630",xpTkBd:"rgba(212,170,80,.2)",xpFill:"linear-gradient(90deg,#d4aa50,#fde68a,#d4aa50)",xpSh:"0 0 8px rgba(212,170,80,.6)",
  dot0:"#1a1630",overlay:"rgba(0,0,0,.85)",modal:"#12101e",modalBd:"rgba(212,170,80,.4)",
  notif:"#12101e",scroll:"#2a2218",scrollTk:"#0d0b18",
  btnGBg:"linear-gradient(135deg,rgba(212,170,80,.18),rgba(212,170,80,.06))",btnGBd:"#d4aa50",btnGTx:"#fde68a",
  btnSBg:"rgba(212,170,80,.08)",btnSBd:"rgba(212,170,80,.22)",btnSTx:"#a08060",
  btnDTx:"rgba(239,68,68,.6)",btnDHTx:"#ef4444",
  navBtnTx:"#a08060",navActBg:"linear-gradient(135deg,rgba(212,170,80,.15),rgba(212,170,80,.05))",navActBd:"#d4aa50",navActTx:"#fde68a",navActSh:"0 0 12px rgba(212,170,80,.2)",
  drag:"#0a0816",dragBd:"rgba(212,170,80,.35)",dragTx:"#3a3028",
  rowBg:"#0d0b18",divider:"rgba(212,170,80,.1)",shimmer:true,
};
const LIGHT={
  bg:"#F4EFE6",bgImg:"radial-gradient(ellipse at 20% 0%,rgba(180,140,80,.10) 0%,transparent 50%),radial-gradient(ellipse at 80% 100%,rgba(120,80,40,.06) 0%,transparent 50%)",
  header:"linear-gradient(180deg,#FFFDF8,#F4EDE0)",headerBd:"rgba(160,104,0,.25)",headerSh:"0 2px 12px rgba(60,40,20,.10)",
  nav:"#EDE6DC",navBd:"rgba(160,104,0,.2)",
  card:"linear-gradient(135deg,#FFFFFF,#FAFAF7)",cardBd:"rgba(160,104,0,.18)",cardSh:"2px 3px 10px rgba(60,40,20,.07)",
  inp:"#F0E8DC",inpBd:"rgba(120,80,20,.3)",inpFc:"#9A6800",
  text:"#2C1A0E",text2:"#6B4E32",text3:"#9A8070",
  gold:"#9A6800",goldBri:"#7A5000",
  xpTk:"#E0D8CC",xpTkBd:"rgba(160,104,0,.25)",xpFill:"linear-gradient(90deg,#9A6800,#C89010,#9A6800)",xpSh:"none",
  dot0:"#D8D0C0",overlay:"rgba(60,40,20,.55)",modal:"#FFFFFF",modalBd:"rgba(160,104,0,.35)",
  notif:"#FFFFFF",scroll:"#BEB8B0",scrollTk:"#EDE6DC",
  btnGBg:"linear-gradient(135deg,rgba(154,104,0,.15),rgba(154,104,0,.05))",btnGBd:"#9A6800",btnGTx:"#7A5000",
  btnSBg:"rgba(154,104,0,.07)",btnSBd:"rgba(154,104,0,.25)",btnSTx:"#6B4E32",
  btnDTx:"#C0A898",btnDHTx:"#ef4444",
  navBtnTx:"#6B4E32",navActBg:"linear-gradient(135deg,rgba(154,104,0,.14),rgba(154,104,0,.05))",navActBd:"#9A6800",navActTx:"#7A5000",navActSh:"0 0 10px rgba(154,104,0,.15)",
  drag:"#F0E8DC",dragBd:"rgba(154,104,0,.3)",dragTx:"#A89878",
  rowBg:"#F4EFE6",divider:"rgba(154,104,0,.12)",shimmer:false,
};

/* ══ SOUNDS (very low volume) ════════════════════════════ */
let _ac=null;
function getAC(){if(!_ac){try{_ac=new(window.AudioContext||window.webkitAudioContext)();}catch{}}return _ac;}
function tone(f=440,t="sine",d=0.1,v=0.025,dl=0){
  const ac=getAC();if(!ac)return;
  try{const g=ac.createGain();g.connect(ac.destination);const o=ac.createOscillator();o.type=t;o.frequency.value=f;o.connect(g);const ts=ac.currentTime+dl;g.gain.setValueAtTime(0,ts);g.gain.linearRampToValueAtTime(v,ts+0.02);g.gain.exponentialRampToValueAtTime(0.001,ts+d);o.start(ts);o.stop(ts+d+0.01);}catch{}
}

/* ══ BACKGROUND MUSIC ════════════════════════════════════ */
let _bgInterval=null;let _bgMasterGain=null;let _bgDrones=[];let _bgNoteIdx=0;
// A minor pentatonic – two octaves
const BG_NOTES=[110,130.81,146.83,164.81,196,220,196,164.81,146.83,130.81,110,130.81];
function startBgMusic(){
  const ac=getAC();if(!ac||_bgInterval)return;
  try{
    _bgMasterGain=ac.createGain();_bgMasterGain.gain.value=0;_bgMasterGain.connect(ac.destination);
    _bgMasterGain.gain.linearRampToValueAtTime(0.055,ac.currentTime+3);
    // Drone pads
    [[110,.22,"sine"],[220,.1,"sine"],[165,.09,"sine"],[137.5,.05,"triangle"]].forEach(([f,v,tp])=>{
      const o=ac.createOscillator();o.type=tp;o.frequency.value=f;
      const g=ac.createGain();g.gain.value=v;o.connect(g);g.connect(_bgMasterGain);o.start();_bgDrones.push(o);
    });
    // Slow arpeggio
    function arp(){
      const ac2=getAC();if(!ac2)return;
      const note=BG_NOTES[_bgNoteIdx%BG_NOTES.length];
      // High melody note (2 octaves up)
      const o1=ac2.createOscillator();o1.type="triangle";o1.frequency.value=note*4;
      const g1=ac2.createGain();g1.gain.setValueAtTime(0,ac2.currentTime);g1.gain.linearRampToValueAtTime(0.18,ac2.currentTime+0.06);g1.gain.exponentialRampToValueAtTime(0.001,ac2.currentTime+1.4);
      o1.connect(g1);g1.connect(_bgMasterGain);o1.start(ac2.currentTime);o1.stop(ac2.currentTime+1.5);
      // Soft sub note (1 octave up)
      const o2=ac2.createOscillator();o2.type="sine";o2.frequency.value=note*2;
      const g2=ac2.createGain();g2.gain.setValueAtTime(0,ac2.currentTime);g2.gain.linearRampToValueAtTime(0.08,ac2.currentTime+0.08);g2.gain.exponentialRampToValueAtTime(0.001,ac2.currentTime+2.0);
      o2.connect(g2);g2.connect(_bgMasterGain);o2.start(ac2.currentTime);o2.stop(ac2.currentTime+2.1);
      _bgNoteIdx++;
    }
    arp();_bgInterval=setInterval(arp,1100);
  }catch{}
}
function stopBgMusic(){
  if(_bgInterval){clearInterval(_bgInterval);_bgInterval=null;}
  const ac=getAC();
  if(_bgMasterGain&&ac){
    try{_bgMasterGain.gain.setValueAtTime(_bgMasterGain.gain.value,ac.currentTime);_bgMasterGain.gain.linearRampToValueAtTime(0,ac.currentTime+1.2);}catch{}
    setTimeout(()=>{_bgDrones.forEach(d=>{try{d.stop();}catch{}});_bgDrones=[];_bgMasterGain=null;},1300);
  }
}
const CAT_SFX={
  forza:()=>{tone(200,"sawtooth",.08,.025);tone(300,"sawtooth",.08,.02,.04);},
  mente:()=>{tone(528,"sine",.15,.025);tone(660,"sine",.12,.02,.08);},
  creativita:()=>{[440,554,659].forEach((f,i)=>tone(f,"sine",.1,.025,i*.05));},
  salute:()=>{tone(396,"sine",.15,.025);tone(528,"sine",.12,.02,.09);},
  finanze:()=>{[880,1108].forEach((f,i)=>tone(f,"triangle",.07,.025,i*.04));},
  social:()=>{tone(660,"sine",.1,.025);tone(784,"sine",.08,.02,.06);},
  tecnica:()=>{[220,440].forEach((f,i)=>tone(f,"square",.06,.025,i*.04));},
  leadership:()=>{tone(196,"sawtooth",.1,.025);tone(294,"sawtooth",.08,.02,.08);},
};
const SFX_LVL=()=>{[523,659,784,1047].forEach((f,i)=>tone(f,"sine",.15,.04,i*.08));};
const SFX_CLK=()=>tone(660,"sine",.06,.025);
const SFX_OPN=()=>tone(440,"sine",.08,.025);

/* ══ UTILITIES ════════════════════════════════════════════ */
const ld=(k,def)=>{try{const v=localStorage.getItem(k);return v!=null?JSON.parse(v):def;}catch{return def;}};
const sv=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch{}};
const uid=()=>Math.random().toString(36).slice(2)+Date.now().toString(36);
const fmtD=ts=>{if(!ts)return"";const d=new Date(ts);return`${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`};
const daysSince=ts=>{if(!ts)return 0;return Math.floor((Date.now()-ts)/(1000*60*60*24));};
const GENDERS=["Maschio","Femmina","Non specificato"];
const EMOJIS=["⚔️","🧠","🎨","❤️","💰","🤝","🏋️","💻","📹","🥗","📈","🌐","📚","🎯","🚀","🎵","🏃","🧘","🌟","⚡","🔥","💪","🎮","✍️","🎬","📊","🏆","💎","🎓","🌍","⭐","🦋","🏊","🚴","🥊","🛠️","🌱","🧪","🎤","🤸","🚶","📋","📖","💡","🏛️","🌺","🔑","🎸"];

/* ══ LEVEL / XP SYSTEM ════════════════════════════════════ */

/* ══ STREAK FLAME COLORS ══════════════════════════════════ */
const getFlameColors=days=>{
  if(days<=3)   return{c1:"#fffde4",c2:"#fff9c4",c3:"#fff59d",glow:"#fffde499",label:`${days} ${days===1?"giorno":"giorni"}`};
  if(days<=6)   return{c1:"#ffd600",c2:"#ffab00",c3:"#ff8f00",glow:"#ffd60099",label:`${days} giorni`};
  if(days<=13)  return{c1:"#ff9800",c2:"#f57c00",c3:"#e65100",glow:"#ff980099",label:`${days} giorni`};
  if(days<=20)  return{c1:"#ff5722",c2:"#e64a19",c3:"#bf360c",glow:"#ff572299",label:`${days} giorni`};
  if(days<=29)  return{c1:"#f44336",c2:"#c62828",c3:"#b71c1c",glow:"#f4433699",label:`${days} giorni`};
  return          {c1:"#9c27b0",c2:"#6a1b9a",c3:"#4a148c",glow:"#9c27b099",label:`${days} giorni`};
};

/* ══ AURA SYSTEM ══════════════════════════════════════════ */
const CAT_DIRS={forza:{x:1,y:-1},mente:{x:-1,y:1},creativita:{x:-1,y:-1},salute:{x:0,y:1},finanze:{x:1,y:0},social:{x:1,y:1},tecnica:{x:-1,y:0},leadership:{x:0,y:-1}};
const computePull=catXP=>{let px=0,py=0,total=0;Object.entries(catXP).forEach(([id,xp])=>{const d=CAT_DIRS[id]||{x:0,y:0};px+=d.x*xp;py+=d.y*xp;total+=xp;});const imbalance=total>0?Math.min(1,Math.sqrt(px*px+py*py)/total):0;return{px,py,imbalance};};
const def=(x,y)=>({x,y});
const buildSpherePath=(cx,cy,r,pullX,pullY,strength)=>{const T=def(cx,cy-r),R=def(cx+r,cy),B=def(cx,cy+r),L=def(cx-r,cy);const s=strength;const dx=pullX*s,dy=pullY*s;const pts=[{p:{x:T.x+dx*.3,y:T.y+dy},cp1:{x:T.x-r*.6+dx*.2,y:T.y+dy*.5},cp2:{x:L.x+dx*.2,y:L.y-r*.6}},{p:{x:B.x-dx*.3,y:B.y+dy*.5},cp1:{x:L.x-dx*.2,y:L.y+r*.6},cp2:{x:B.x-r*.6-dx*.2,y:B.y-dy*.3}},{p:{x:R.x+dx*.4,y:R.y+dy*.2},cp1:{x:B.x+r*.6+dx*.3,y:B.y+dy*.2},cp2:{x:R.x-dx*.1,y:R.y+r*.6}},{p:{x:T.x+dx*.3,y:T.y+dy},cp1:{x:R.x+dx*.2,y:R.y-r*.6},cp2:{x:T.x+r*.6+dx*.4,y:T.y+dy*.5}}];return`M ${pts[0].p.x} ${pts[0].p.y} C ${pts[0].cp1.x} ${pts[0].cp1.y} ${pts[3].cp2.x} ${pts[3].cp2.y} ${pts[3].p.x} ${pts[3].p.y} C ${pts[3].cp1.x} ${pts[3].cp1.y} ${pts[2].cp2.x} ${pts[2].cp2.y} ${pts[2].p.x} ${pts[2].p.y} C ${pts[2].cp1.x} ${pts[2].cp1.y} ${pts[1].cp2.x} ${pts[1].cp2.y} ${pts[1].p.x} ${pts[1].p.y} C ${pts[1].cp1.x} ${pts[1].cp1.y} ${pts[0].cp2.x} ${pts[0].cp2.y} ${pts[0].p.x} ${pts[0].p.y} Z`;};

/* ══ XP SURVEY ════════════════════════════════════════════ */
const mkSurvey=catId=>{const BASE=[{q:"Quanto tempo richiede ogni sessione?",opts:[{l:"<5 min",p:1},{l:"5-15 min",p:2},{l:"15-45 min",p:3},{l:">45 min",p:4}]},{q:"Quanto sforzo fisico richiede?",opts:[{l:"Nessuno",p:0},{l:"Lieve",p:1},{l:"Moderato",p:2},{l:"Intenso",p:4}]},{q:"Quanto sforzo mentale richiede?",opts:[{l:"Minimo",p:0},{l:"Leggero",p:1},{l:"Significativo",p:2},{l:"Elevato",p:4}]},{q:"Quanto è difficile mantenerla costante?",opts:[{l:"Semplice",p:1},{l:"Moderato",p:2},{l:"Difficile",p:3},{l:"Molto difficile",p:5}]},{q:"Quanto impatta sulla tua vita?",opts:[{l:"Poco",p:1},{l:"Abbastanza",p:2},{l:"Molto",p:4},{l:"Trasformativo",p:6}]},{q:"Con che frequenza la farai?",opts:[{l:"Raramente",p:1},{l:"Settimanale",p:2},{l:"Ogni 2 giorni",p:3},{l:"Ogni giorno",p:4}]},{q:"Richiede preparazione o materiali?",opts:[{l:"No",p:0},{l:"Minima",p:1},{l:"Moderata",p:2},{l:"Significativa",p:3}]},{q:"Quanto è noioso o scomodo?",opts:[{l:"Per niente",p:0},{l:"Un po'",p:1},{l:"Abbastanza",p:2},{l:"Molto",p:3}]},{q:"Quanto è urgente/importante per i tuoi obiettivi?",opts:[{l:"Poco",p:1},{l:"Utile",p:2},{l:"Importante",p:3},{l:"Fondamentale",p:5}]},{q:"Vedrai i risultati in quanto tempo?",opts:[{l:"Subito",p:1},{l:"Settimane",p:2},{l:"Mesi",p:3},{l:"Anni",p:4}]}];return BASE.map(q=>({...q,opts:q.opts.sort(()=>Math.random()-.5)}));};
const calcXP=(ans,catId,taskType)=>{const raw=ans.reduce((a,b)=>a+b,0);const mult=taskType==="daily"?1:taskType==="weekly"?5:20;const base=Math.max(5,Math.min(200,Math.round(raw*mult*0.8)));return base;};

/* ══ PUSH NOTIFICATIONS ═══════════════════════════════════ */
const scheduleNotifications=(streakDays,decayingCats)=>{if(!("Notification"in window)||Notification.permission!=="granted")return;};
function needsDaily(lr){if(!lr)return true;return new Date().toDateString()!==new Date(lr).toDateString();}
function needsWeekly(lr){if(!lr)return true;return Date.now()-lr>7*86400000;}
function needsMonthly(lr){if(!lr)return true;const n=new Date(),l=new Date(lr);return n.getMonth()!==l.getMonth()||n.getFullYear()!==l.getFullYear();}
const CAT_MULT={forza:1.10,salute:0.90,mente:1.50,creativita:1.30,finanze:1.20,social:0.85,tecnica:1.35,leadership:1.25};
const FREQ_RNG={daily:[5,30],weekly:[20,80],monthly:[50,200]};
const Q_UNI=[{id:"u1",q:"Quanto tempo richiede?",opts:[{l:"<5 min",p:1},{l:"5-15 min",p:2},{l:"15-45 min",p:3},{l:">45 min",p:4}]},{id:"u2",q:"Quanto è difficile mantenerla?",opts:[{l:"Semplice",p:1},{l:"Moderata",p:2},{l:"Difficile",p:3},{l:"Molto difficile",p:5}]},{id:"u3",q:"Quanto impatta sulla tua vita?",opts:[{l:"Poco",p:1},{l:"Abbastanza",p:2},{l:"Molto",p:4},{l:"Trasformativo",p:6}]},{id:"u4",q:"Richiede preparazione?",opts:[{l:"No",p:0},{l:"Minima",p:1},{l:"Moderata",p:2},{l:"Significativa",p:3}]},{id:"u5",q:"Vedrai i risultati quando?",opts:[{l:"Subito",p:1},{l:"Settimane",p:2},{l:"Mesi",p:3},{l:"Anni",p:4}]}];
const Q_CAT={forza:Q_UNI,mente:Q_UNI,creativita:Q_UNI,salute:Q_UNI,finanze:Q_UNI,social:Q_UNI,tecnica:Q_UNI,leadership:Q_UNI};

/* ══ DATA */
const CATS=[
  {id:"forza",     name:"Forza",      icon:"forza",     color:"#ef4444"},
  {id:"mente",     name:"Mente",      icon:"mente",     color:"#3b82f6"},
  {id:"creativita",name:"Creatività", icon:"creativita",color:"#a855f7"},
  {id:"salute",    name:"Salute",     icon:"salute",    color:"#22c55e"},
  {id:"finanze",   name:"Finanze",    icon:"finanze",   color:"#f59e0b"},
  {id:"social",    name:"Social",     icon:"social",    color:"#ec4899"},
  {id:"tecnica",   name:"Tecnica",    icon:"tecnica",   color:"#0ea5e9"},
  {id:"leadership",name:"Leadership", icon:"leadership",color:"#fb923c"},
];
// SVG icon paths for each category — all use 24x24 viewBox
const CAT_ICONS={
  forza:     <><path d="M6.5 6.5L3 3M17.5 6.5L21 3M12 2v4M6 13H2M22 13h-4M12 22v-4"/><circle cx="12" cy="13" r="4"/><line x1="8.5" y1="9.5" x2="15.5" y2="9.5"/></>,
  mente:     <><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.44-4.24A2.5 2.5 0 0 1 9.5 2M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.44-4.24A2.5 2.5 0 0 0 14.5 2"/></>,
  creativita:<><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z"/></>,
  salute:    <><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></>,
  finanze:   <><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></>,
  social:    <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
  tecnica:   <><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></>,
  leadership:<><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></>,
};
// Render a category icon as inline SVG
const CatIcon=({id,size=16,color,style={}})=>{
  const paths=CAT_ICONS[id];
  const col=color||CATS.find(c=>c.id===id)?.color||"#888";
  return(
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={col}
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      style={{flexShrink:0,...style}}>
      {paths}
    </svg>
  );
};
const CAT_INFO={
  forza:{title:"Forza Fisica",desc:"Misura capacità atletica, forza muscolare e resistenza. La base di ogni performance corporea.",tips:["Allenati 3-5 volte a settimana con carichi progressivi","I muscoli crescono a riposo: il recupero è parte del training","Mescola forza, cardio e mobilità","La costanza batte l'intensità sporadica"],time:"Risultati visibili in 6–8 settimane costanti",decay:"Dopo 3 giorni senza allenamento perdi il 5% dell'XP del tuo livello attuale ogni giorno. A livelli alti questo può essere anche 25+ XP al giorno — non fermarti.",decayRate:"5% XP/giorno oltre il 3° giorno di inattività"},
  mente:{title:"Intelligenza & Sapere",desc:"Misura capacità cognitiva e apprendimento profondo. Richiede sforzo deliberato e continuità.",tips:["Deep work: studia senza distrazioni per 90+ min","Applica subito ciò che impari — il learning by doing cementa","Insegna ad altri per consolidare le conoscenze","Leggi libri difficili, non solo contenuti veloci"],time:"Competenze solide emergono in 3–6 mesi di pratica deliberata",decay:"La mente è la categoria che decade più rapidamente: 3 giorni di tolleranza poi −5% XP/giorno. Studia ogni giorno, anche solo 20 minuti.",decayRate:"5% XP/giorno oltre il 3° giorno di inattività"},
  creativita:{title:"Creatività & Arte",desc:"Misura l'espressione originale e la padronanza tecnica creativa.",tips:["Crea ogni giorno, anche solo 15 minuti","Studia i maestri del tuo campo","Il fallimento è parte del processo — non fermarlo","Esci dalla comfort zone stilistica ogni settimana"],time:"Una voce creativa originale emerge dopo anni di pratica",decay:"Senza creazione attiva per più di 3 giorni, perdi il 5% dell'XP del livello ogni giorno. La creatività si arrugginisce velocemente senza esercizio.",decayRate:"5% XP/giorno oltre il 3° giorno di inattività"},
  salute:{title:"Salute & Benessere",desc:"Misura le abitudini preventive e il benessere fisico quotidiano.",tips:["Sonno: 7–9 ore, non negoziabile","Idratazione: 2L+ al giorno ogni giorno","Alimentazione anti-infiammatoria come base","Gestisci lo stress con meditazione o breathing"],time:"Le abitudini salutari mostrano effetti in 2–4 settimane",decay:"Salute è la categoria più stabile: dopo 3 giorni senza attività il decay è −5% XP/giorno del livello. Le abitudini si rompono prima di quanto pensi.",decayRate:"5% XP/giorno oltre il 3° giorno di inattività"},
  finanze:{title:"Intelligenza Finanziaria",desc:"Misura disciplina finanziaria, risparmio e investimento consapevole.",tips:["Paga prima te stesso: risparmia prima di spendere","Investi con regolarità indipendentemente dal mercato","Studia almeno un libro di finanza personale l'anno","Tieni un budget mensile e guardalo davvero"],time:"La ricchezza si costruisce in decenni, non mesi",decay:"Dopo 3 giorni di inattività: −5% XP/giorno. Le cattive abitudini di spesa tornano rapidamente senza vigilanza continua.",decayRate:"5% XP/giorno oltre il 3° giorno di inattività"},
  social:{title:"Intelligenza Sociale",desc:"Misura empatia, qualità delle relazioni e influenza positiva.",tips:["Ascolta per capire, non per rispondere","Fai domande genuine e mostra interesse reale","Mantieni i contatti proattivamente — non aspettare","Esponiti a situazioni sociali nuove ogni settimana"],time:"Reti sociali solide si costruiscono in anni",decay:"Senza interazioni significative per più di 3 giorni: −5% XP/giorno. Le relazioni si raffreddano senza nutrimento regolare.",decayRate:"5% XP/giorno oltre il 3° giorno di inattività"},
  tecnica:{title:"Competenza Tecnica",desc:"Misura la padronanza di strumenti e tecnologie del settore.",tips:["Costruisci progetti reali, non solo tutorial","Contribuisci a progetti collaborativi o open source","Studia i fondamentali, non solo i trend del momento","Cerca feedback spietato e code review"],time:"Competenza professionale solida richiede 1–3 anni",decay:"Dopo 3 giorni senza pratica tecnica: −5% XP/giorno. Le skill tecniche si deteriorano rapidamente senza uso — specialmente nelle tecnologie in evoluzione.",decayRate:"5% XP/giorno oltre il 3° giorno di inattività"},
  leadership:{title:"Leadership & Visione",desc:"Misura la capacità di ispirare, guidare e influenzare gli altri.",tips:["Sii responsabile: mai incolpare, sempre soluzione","Comunica con chiarezza e visione a lungo termine","Sviluppa gli altri, non solo te stesso","Prendi decisioni difficili senza procrastinare"],time:"La leadership autentica si costruisce in anni di esperienza",decay:"Oltre 3 giorni di inattività: −5% XP/giorno. L'autorevolezza si perde rapidamente senza presenza costante e risultati continui.",decayRate:"5% XP/giorno oltre il 3° giorno di inattività"},
};

/* ══ XP STAIRCASE SYSTEM ══════════════════════════════════
   getNextLevelXpThreshold(lvl) → XP needed to reach lvl+1
   getLevelData(totalXp)        → {currentLevel,xpInCurrentLevel,
                                    xpRequiredForNext,progressPercentage}
═══════════════════════════════════════════════════════════ */
function getNextLevelXpThreshold(lvl){
  if(lvl<1)  return 25;
  if(lvl<10) return 25;                          // Lv 1-9  → 25 XP each
  if(lvl<15) return 250;                         // Lv 10-14 → 250 XP each
  if(lvl<19) return 300;                         // Lv 15-18 → 300 XP each
  if(lvl<29) return 400;                         // Lv 19-28 → 400 XP each
  // Lv 29+ → +100 every 10 levels (29-38=500, 39-48=600 …)
  return 500+Math.floor((lvl-29)/10)*100;
}
function getLevelData(totalXp){
  let lv=1,accumulated=0;
  while(true){
    const needed=getNextLevelXpThreshold(lv);
    if(accumulated+needed>totalXp)break;
    accumulated+=needed;lv++;
  }
  const needed=getNextLevelXpThreshold(lv);
  const xpInCurrentLevel=totalXp-accumulated;
  return{
    currentLevel:lv,
    xpInCurrentLevel,
    xpRequiredForNext:needed,
    progressPercentage:Math.min(100,(xpInCurrentLevel/needed)*100),
  };
}
// Skill-level threshold (separate from player level — kept simple)
function getSkillXpThreshold(skillLv){
  if(skillLv<10) return 25*skillLv;
  if(skillLv<15) return 250;
  if(skillLv<19) return 300;
  if(skillLv<29) return 400;
  return 500+Math.floor((skillLv-29)/10)*100;
}
// Decay: 5% of current-level XP per day of inactivity beyond day 3
// Never de-levels — floor is 0 XP within current level
function applyDecay(skills,daysSinceLastActivity){
  if(daysSinceLastActivity<=3)return skills;
  const extraDays=daysSinceLastActivity-3;
  return skills.map(sk=>{
    if(!sk.lastActivity)return sk;
    const ia=Math.floor((Date.now()-sk.lastActivity)/86400000);
    if(ia<=3)return sk;
    const overdueDays=Math.min(ia,daysSinceLastActivity)-3;
    if(overdueDays<=0)return sk;
    const threshold=getSkillXpThreshold(sk.level);
    const penalty=Math.floor(threshold*0.05*overdueDays);
    const newXp=Math.max(0,sk.xp-penalty);
    return{...sk,xp:newXp}; // never de-levels
  });
}

// ⚠️ All defaults start at 0 XP / level 1 / 0 done
const DEF_SKILLS=[
  {id:"s1",name:"Fitness",     level:1,xp:0,catId:"forza",     icon:"🏋️",lastActivity:null,catWeights:[{catId:"forza",pct:100}]},
  {id:"s2",name:"Coding",      level:1,xp:0,catId:"mente",     icon:"💻",lastActivity:null,catWeights:[{catId:"mente",pct:100}]},
  {id:"s3",name:"YouTube",     level:1,xp:0,catId:"creativita",icon:"📹",lastActivity:null,catWeights:[{catId:"creativita",pct:100}]},
  {id:"s4",name:"Nutrizione",  level:1,xp:0,catId:"salute",    icon:"🥗",lastActivity:null,catWeights:[{catId:"salute",pct:100}]},
  {id:"s5",name:"Investimenti",level:1,xp:0,catId:"finanze",   icon:"📈",lastActivity:null,catWeights:[{catId:"finanze",pct:100}]},
  {id:"s6",name:"Networking",  level:1,xp:0,catId:"social",    icon:"🌐",lastActivity:null,catWeights:[{catId:"social",pct:100}]},
];

// Tutorial starter quests — shown during tutorial
const TUT_QUESTS=[
  {id:"tq1",name:"La tua prima quest",          xp:10,catId:"mente",  skillId:null,icon:"⭐",type:"daily", done:false,doneAt:null,tutorial:true},
  {id:"tq2",name:"Completa il tutorial",         xp:15,catId:"mente",  skillId:null,icon:"🗺️",type:"daily", done:false,doneAt:null,tutorial:true},
  {id:"tq3",name:"Crea il tuo primo piano",      xp:20,catId:"mente",  skillId:null,icon:"📋",type:"daily", done:false,doneAt:null,tutorial:true},
];
const DEF_TASKS={
  daily: TUT_QUESTS,
  weekly:[
    {id:"w1",name:"Sessione creativa",   xp:60,catId:"creativita",skillId:"s3",icon:"🎨",type:"weekly",done:false,doneAt:null},
    {id:"w2",name:"Analizza le spese",   xp:40,catId:"finanze",   skillId:"s5",icon:"📊",type:"weekly",done:false,doneAt:null},
    {id:"w3",name:"Connettiti con qualcuno",xp:35,catId:"social", skillId:"s6",icon:"🤝",type:"weekly",done:false,doneAt:null},
  ],
  monthly:[
    {id:"m1",name:"Sfida fisica mensile",   xp:180,catId:"forza",  skillId:"s1",icon:"🏆",type:"monthly",done:false,doneAt:null},
    {id:"m2",name:"Finisci un corso/libro", xp:200,catId:"mente",  skillId:"s2",icon:"🎓",type:"monthly",done:false,doneAt:null},
    {id:"m3",name:"Risparmia il 10%+ stipendio",xp:150,catId:"finanze",skillId:"s5",icon:"💎",type:"monthly",done:false,doneAt:null},
  ],
};
const DEF_PROFILE={name:"",avatar:"violet",photo:null,photoCropX:50,photoCropY:50,lastNameChange:null,weights:[],height:"",bodyType:"",age:"",gender:"",weightReminderEnabled:true,lastWeightUpdate:null};

const PRESET=[
  // DAILY — top habits from productivity/wellness research
  {name:"Allenamento forza",        xp:25,catId:"forza",      skillId:null,icon:"🏋️",taskType:"daily",  desc:"30+ min di pesi o cardio intenso"},
  {name:"Camminata 30 min",         xp:10,catId:"forza",      skillId:null,icon:"🚶",taskType:"daily",  desc:"Habit #1 per salute cardiovascolare"},
  {name:"Bevi 2L d'acqua",          xp:12,catId:"salute",     skillId:null,icon:"💧",taskType:"daily",  desc:"Solo il 22% lo fa costantemente — più difficile di quanto sembra"},
  {name:"Sonno 7-9h",               xp:15,catId:"salute",     skillId:null,icon:"😴",taskType:"daily",  desc:"La base di ogni performance"},
  {name:"Meditazione 10 min",       xp:12,catId:"salute",     skillId:null,icon:"🧘",taskType:"daily",  desc:"Riduce cortisolo, migliora focus"},
  {name:"Lettura 20 pagine",        xp:15,catId:"mente",      skillId:null,icon:"📖",taskType:"daily",  desc:"Top habit dei CEO globali"},
  {name:"Deep work 90 min",         xp:22,catId:"mente",      skillId:null,icon:"🎯",taskType:"daily",  desc:"Focus senza distrazioni"},
  {name:"Nessun social al mattino", xp:8, catId:"mente",      skillId:null,icon:"📵",taskType:"daily",  desc:"Proteggi le prime 2h della giornata"},
  {name:"Crea qualcosa",            xp:20,catId:"creativita", skillId:null,icon:"🎨",taskType:"daily",  desc:"Arte, scrittura, musica, video"},
  {name:"Journaling 5 min",         xp:10,catId:"mente",      skillId:null,icon:"✍️",taskType:"daily",  desc:"Chiarezza mentale e gratitudine"},
  {name:"Risparmia oggi",           xp:8, catId:"finanze",    skillId:null,icon:"💰",taskType:"daily",  desc:"Nessuna spesa non necessaria"},
  {name:"Connettiti con qualcuno",  xp:10,catId:"social",     skillId:null,icon:"🤝",taskType:"daily",  desc:"Messaggio, chiamata, incontro"},
  // WEEKLY
  {name:"Sessione HIIT 45 min",     xp:65,catId:"forza",      skillId:null,icon:"🔥",taskType:"weekly", desc:"Alta intensità × 3 volte a settimana"},
  {name:"Review settimana",         xp:40,catId:"mente",      skillId:null,icon:"📋",taskType:"weekly", desc:"Analisi progressi e piani futuri"},
  {name:"Rivedi budget",            xp:45,catId:"finanze",    skillId:null,icon:"📊",taskType:"weekly", desc:"Traccia entrate/uscite reali"},
  {name:"Skill building 2h",        xp:55,catId:"tecnica",    skillId:null,icon:"💡",taskType:"weekly", desc:"Studia una competenza specifica"},
  {name:"Socializza attivamente",   xp:45,catId:"social",     skillId:null,icon:"🌟",taskType:"weekly", desc:"Evento, cena, networking reale"},
  // MONTHLY
  {name:"Obiettivo fitness mese",   xp:180,catId:"forza",     skillId:null,icon:"🏆",taskType:"monthly",desc:"Sfida fisica mensile misurabile"},
  {name:"Finisci un libro",         xp:150,catId:"mente",     skillId:null,icon:"🎓",taskType:"monthly",desc:"Non-fiction o formativo"},
  {name:"Investi quota mensile",    xp:140,catId:"finanze",   skillId:null,icon:"💎",taskType:"monthly",desc:"ETF, crypto, risparmio — qualcosa"},
  {name:"Nuovo contatto di valore", xp:120,catId:"leadership",skillId:null,icon:"🤝",taskType:"monthly",desc:"Una relazione nuova e significativa"},
];

const BODY_INFO=[
  {name:"Ectomorfo",icon:"🦒",color:"#3b82f6",desc:"Fisico magro e longilineo. Metabolismo veloce. Difficoltà ad aumentare massa muscolare.",how:"Per te: più calorie e proteine, carichi pesanti, meno cardio."},
  {name:"Mesomorfo",icon:"🦸",color:"#22c55e",desc:"Fisico atletico e muscoloso. Rispondi bene all'allenamento. Facile guadagnare/perdere peso.",how:"Per te: mix forza+cardio, alimentazione precisa."},
  {name:"Endomorfo",icon:"🐻",color:"#f59e0b",desc:"Fisico robusto. Tendenza ad accumulare grasso. Metabolismo più lento.",how:"Per te: priorità cardio, deficit calorico, costanza."},
];
// Profile color backgrounds — replaces emoji avatars
const PROFILE_COLORS=[
  {id:"violet",  bg:"linear-gradient(135deg,#4c1d95,#7c3aed)", label:"Viola"},
  {id:"blue",    bg:"linear-gradient(135deg,#1e3a8a,#2563eb)", label:"Blu"},
  {id:"emerald", bg:"linear-gradient(135deg,#064e3b,#059669)", label:"Smeraldo"},
  {id:"crimson", bg:"linear-gradient(135deg,#7f1d1d,#dc2626)", label:"Cremisi"},
  {id:"amber",   bg:"linear-gradient(135deg,#78350f,#d97706)", label:"Ambra"},
  {id:"rose",    bg:"linear-gradient(135deg,#881337,#e11d48)", label:"Rosa"},
  {id:"cyan",    bg:"linear-gradient(135deg,#0c4a6e,#0284c7)", label:"Ciano"},
  {id:"slate",   bg:"linear-gradient(135deg,#1e293b,#475569)", label:"Ardesia"},
];
const getProfileBg=(id)=>PROFILE_COLORS.find(c=>c.id===id)?.bg||PROFILE_COLORS[0].bg;
// Render a profile circle (color bg + initials)
const ProfileCircle=({name,colorId,photo,cropX=50,cropY=50,size=42,style={}})=>{
  const bg=getProfileBg(colorId);
  const initials=(name||"?").slice(0,2).toUpperCase();
  return(
    <div style={{width:size,height:size,borderRadius:"50%",background:bg,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",flexShrink:0,...style}}>
      {photo
        ?<img src={photo} style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:`${cropX}% ${cropY}%`}} alt=""/>
        :<span style={{fontFamily:"Cinzel,serif",fontSize:Math.round(size*.32),fontWeight:700,color:"rgba(255,255,255,.9)",letterSpacing:1,userSelect:"none"}}>{initials}</span>}
    </div>
  );
};
/* ══ COMPONENTS ══════════════════════════════════════════ */

// Drag-to-confirm slider
/* ══ XP BAR ════════════════════════════════════════════════ */
const XPBar=memo(({pct,color,track,h=6})=>(
  <div style={{background:track,borderRadius:h/2,height:h,overflow:"hidden",width:"100%"}}>
    <div style={{height:"100%",width:`${Math.min(100,Math.max(0,pct))}%`,background:color,borderRadius:h/2,transition:"width .5s ease"}}/>
  </div>
));

const DragSlider=memo(({label,subLabel,icon,accent,confirmLabel,onConfirm,onCancel,T,mini=false})=>{
  const[pos,setPos]=useState(0);const[drg,setDrg]=useState(false);const[ok,setOk]=useState(false);
  const sr=useRef(0);const pr=useRef(0);const MAX=mini?160:210;
  const start=x=>{setDrg(true);sr.current=x-pr.current;};
  const move=useCallback(x=>{if(!drg||ok)return;const np=Math.max(0,Math.min(MAX,x-sr.current));pr.current=np;setPos(np);if(np>=MAX*.9){setOk(true);setDrg(false);setTimeout(onConfirm,350);}},[drg,ok,onConfirm]);
  const end=()=>{if(!ok){pr.current=0;setPos(0);}setDrg(false);};
  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",touchAction:"none"}}
      onMouseMove={e=>move(e.clientX)} onMouseUp={end}
      onTouchMove={e=>{e.preventDefault();move(e.touches[0].clientX);}} onTouchEnd={end}>
      {!mini&&icon&&<div style={{fontSize:44,marginBottom:8}}>{icon}</div>}
      {!mini&&label&&<div style={{fontFamily:"Cinzel,serif",fontSize:16,color:T.gold,marginBottom:subLabel?4:16}}>{label}</div>}
      {!mini&&subLabel&&<div style={{fontSize:13,color:accent,marginBottom:14}}>{subLabel}</div>}
      <div style={{position:"relative",height:mini?40:50,width:mini?220:280,background:T.drag,borderRadius:25,border:`1px solid ${T.dragBd}`,userSelect:"none",touchAction:"none",marginBottom:mini?0:20}}>
        <div style={{position:"absolute",left:0,top:0,bottom:0,width:pos+(mini?36:44),background:`${accent}18`,borderRadius:25,pointerEvents:"none",transition:drg?"none":"width .25s"}}/>
        <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:T.dragTx,letterSpacing:2,pointerEvents:"none"}}>{ok?"✓  CONFERMATO":"→  TRASCINA  →"}</div>
        <div onMouseDown={e=>{e.stopPropagation();start(e.clientX);}} onTouchStart={e=>{e.stopPropagation();e.preventDefault();start(e.touches[0].clientX);}}
          style={{position:"absolute",top:mini?4:3,left:(mini?3:4)+pos,width:mini?32:44,height:mini?32:44,borderRadius:"50%",background:`linear-gradient(135deg,${accent},${accent}bb)`,cursor:ok?"default":"grab",display:"flex",alignItems:"center",justifyContent:"center",fontSize:mini?16:22,color:"#fff",transition:drg?"none":"left .25s",zIndex:2,touchAction:"none",userSelect:"none"}}>
          {ok?"✓":"›"}
        </div>
      </div>
      {!mini&&onCancel&&<button onClick={onCancel} style={{background:"none",border:"none",color:T.text3,cursor:"pointer",fontSize:12,fontFamily:"Rajdhani,sans-serif",letterSpacing:1}}>Annulla</button>}
    </div>
  );
});

// Full-screen confirm overlay for completing a task
const TaskConfirm=memo(({task,cat,skill,onConfirm,onCancel,T})=>(
  <div style={{position:"fixed",inset:0,background:T.overlay,zIndex:600,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={e=>{if(e.target===e.currentTarget)onCancel();}}>
    <div style={{background:T.modal,border:`2px solid ${cat.color}80`,borderRadius:16,padding:32,width:"100%",maxWidth:320,textAlign:"center",boxShadow:`0 0 40px ${cat.color}22`,animation:"fadeIn .2s ease"}}>
      <DragSlider label={task.name} subLabel={skill?`→ ${skill.icon} ${skill.name}`:null} icon={task.icon} accent={cat.color} confirmLabel={`+${task.xp} XP`} onConfirm={onConfirm} onCancel={onCancel} T={T}/>
      <div style={{fontFamily:"Cinzel Decorative,cursive",fontSize:20,color:cat.color,marginTop:8,marginBottom:4}}>+{task.xp} XP</div>
    </div>
  </div>
));

// Quest card — click to confirm, X to delete
const QuestCard=memo(({task,cat,sk,isNew,isTut,onComplete,onDelete,T,bonus=0})=>(
  <div style={{background:T.card,border:`1px solid ${T.cardBd}`,borderRadius:12,padding:"13px 16px",display:"flex",alignItems:"center",gap:14,cursor:task.done?"default":"pointer",opacity:task.done?.45:1,transition:"all .2s",borderLeft:`3px solid ${task.done?"transparent":cat.color}`,animation:isNew?"glowPulse 1s ease infinite":undefined,boxShadow:T.cardSh}}
    onClick={()=>{if(!task.done)onComplete();}}
    onMouseEnter={e=>{if(!task.done){e.currentTarget.style.transform="translateX(3px)";}}}
    onMouseLeave={e=>{e.currentTarget.style.transform="";}}>
    <div style={{fontSize:22,flexShrink:0}}>{task.icon}</div>
    <div style={{flex:1,minWidth:0}}>
      <div style={{fontSize:15,fontWeight:600,color:task.done?T.text3:T.text,textDecoration:task.done?"line-through":"none",marginBottom:4}}>
        {task.name}{isNew&&<span style={{fontSize:10,color:T.gold,marginLeft:8,letterSpacing:1}}>NUOVA</span>}
      </div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        <span style={{display:"inline-flex",alignItems:"center",gap:5,fontSize:11,letterSpacing:1,textTransform:"uppercase",padding:"2px 8px",borderRadius:4,fontWeight:600,background:`${cat.color}22`,color:cat.color}}><CatIcon id={cat.id} size={11} color={cat.color}/>{cat.name}</span>
        {sk&&<span style={{fontSize:11,padding:"2px 8px",borderRadius:4,background:`${T.gold}18`,color:T.gold}}>→ {sk.icon} {sk.name}</span>}
      </div>
    </div>
    {task.done
      ?<span style={{fontSize:11,color:"#22c55e",letterSpacing:2,fontWeight:700,flexShrink:0}}>✓</span>
      :<div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",flexShrink:0}}>
        <span style={{fontFamily:"Cinzel,serif",fontSize:15,color:T.gold,fontWeight:700}}>+{task.xp}</span>
        {bonus>0&&<span style={{fontSize:9,color:"#fb923c",letterSpacing:.5}}>+{bonus}%🔥</span>}
      </div>}
    {!isTut&&!task.done&&(
      <button className="btn-del" onClick={e=>{e.stopPropagation();onDelete();}} style={{marginLeft:4,flexShrink:0,opacity:.55,fontSize:13}}>✕</button>
    )}
  </div>
));

// Streak Flame component
const StreakFlame=memo(({streak,T,inline=false})=>{
  const[open,setOpen]=useState(false);
  const days=streak?.days||0;
  const active=streak?.lastDate===new Date().toDateString();
  const fc=getFlameColors(days);
  const sz=inline?36:48;
  const id=`sf_${days}_${active?1:0}`;
  const tongues=active?[
    {l:"44%",w:8,h:sz*.7,del:"0s",dur:"1.3s"},
    {l:"34%",w:6,h:sz*.5,del:".3s",dur:"1.0s"},
    {l:"56%",w:7,h:sz*.55,del:".5s",dur:"1.5s"},
  ]:[];
  const QUOTES=["La costanza batte il talento.","Un giorno alla volta.","Chi si ferma è perduto.","Non rompere la catena!","Ogni giorno conta."];
  const quote=QUOTES[days%QUOTES.length];
  return(
    <>
      {open&&(
        <div style={{position:"fixed",inset:0,background:T.overlay,zIndex:800,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={()=>setOpen(false)}>
          <div style={{background:T.modal,border:`2px solid ${fc.c1}44`,borderRadius:16,padding:28,width:"100%",maxWidth:320,textAlign:"center",animation:"fadeIn .2s ease"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontFamily:"Cinzel Decorative,cursive",fontSize:14,color:fc.c1,marginBottom:12,letterSpacing:2}}>FIAMMA DI COSTANZA</div>
            <div style={{fontSize:48,marginBottom:4,filter:`drop-shadow(0 0 12px ${fc.c1})`}}>🔥</div>
            <div style={{fontFamily:"Cinzel Decorative,cursive",fontSize:18,color:fc.c1,marginBottom:4,textShadow:`0 0 20px ${fc.c1}88`}}>{days} {days===1?"giorno":"giorni"}</div>
            <div style={{fontSize:11,color:T.text3,letterSpacing:2,marginBottom:16}}>DI COSTANZA</div>
            <div style={{fontSize:14,color:T.text,lineHeight:1.7,fontStyle:"italic",marginBottom:20,padding:"12px 16px",background:T.inp,borderRadius:10}}>"{quote}"</div>
            <div style={{fontSize:11,color:T.text3,marginBottom:16}}>{active?"🟢 Completata oggi":"⚠️ Nessuna quest oggi — la fiamma rischia di spegnersi"}</div>
            <button onClick={()=>setOpen(false)} style={{background:`${fc.c1}18`,border:`1px solid ${fc.c1}`,borderRadius:8,color:fc.c1,fontFamily:"Cinzel,serif",fontSize:13,padding:"10px 28px",cursor:"pointer",width:"100%"}}>Continua →</button>
          </div>
        </div>
      )}
      <div onClick={()=>setOpen(true)} style={{position:"relative",display:"flex",flexDirection:"column",alignItems:"center",gap:2,cursor:"pointer",userSelect:"none"}}>
        <div style={{position:"relative",width:sz+24,height:sz+sz*.7,display:"flex",alignItems:"flex-end",justifyContent:"center",paddingBottom:2}}>
          <div style={{position:"absolute",bottom:0,left:"50%",transform:"translateX(-50%)",width:sz*.75,height:8,borderRadius:"50%",background:`radial-gradient(ellipse,${fc.glow} 0%,transparent 70%)`,animation:"flameShadow 1.8s ease-in-out infinite"}}/>
          {active&&tongues.map((f,i)=>(
            <div key={i} style={{position:"absolute",bottom:`${sz*.45}px`,left:f.l,width:f.w,height:f.h,borderRadius:"50% 50% 30% 30%",background:`linear-gradient(to top,${fc.c2}ee,${fc.c1}77,transparent)`,transform:"translateX(-50%)",animation:`flameTongue ${f.dur} ease-in-out ${f.del} infinite`,filter:`blur(${f.w*.28}px)`,transformOrigin:"bottom center",opacity:.85}}/>
          ))}
          <svg width={sz} height={sz} viewBox="0 0 100 100" style={{position:"relative",zIndex:2,animation:active?"flameBody 1.6s ease-in-out infinite":undefined,filter:active?`drop-shadow(0 0 ${sz*.28}px ${fc.c1}) drop-shadow(0 0 ${sz*.14}px ${fc.c2})`:"drop-shadow(0 0 4px #555)"}}>
            <defs>
              <radialGradient id={`sfg${id}`} cx="38%" cy="42%" r="62%">
                <stop offset="0%" stopColor="white" stopOpacity={active?".9":".15"}/>
                <stop offset="22%" stopColor={fc.c1} stopOpacity=".98"/>
                <stop offset="58%" stopColor={fc.c2} stopOpacity=".90"/>
                <stop offset="100%" stopColor={fc.c3} stopOpacity=".75"/>
              </radialGradient>
            </defs>
            <ellipse cx="50" cy="52" rx="44" ry="45" fill={`url(#sfg${id})`}/>
            {active&&<ellipse cx="37" cy="34" rx="14" ry="9" fill="white" opacity=".5" transform="rotate(-15,37,34)"/>}
            {active&&<ellipse cx="40" cy="30" rx="5" ry="3" fill="white" opacity=".8" transform="rotate(-15,40,30)"/>}
          </svg>
        </div>
      </div>
    </>
  );
});

// AuraSphere — animated flame ball
const AuraSphere=memo(({skills,size=160,T,playerLevel=1})=>{
  const catXP=useMemo(()=>{const out={};CATS.forEach(c=>{out[c.id]=skills.filter(s=>s.catId===c.id).reduce((a,s)=>a+s.xp+(s.level-1)*100,0);});return out;},[skills]);
  const dominant=useMemo(()=>CATS.reduce((a,b)=>catXP[a.id]>=catXP[b.id]?a:b),[catXP]);
  const totalXP=useMemo(()=>Object.values(catXP).reduce((a,b)=>a+b,0),[catXP]);
  const power=Math.min(1,0.4+totalXP/8000*0.6);
  const sorted=[...CATS].sort((a,b)=>catXP[b.id]-catXP[a.id]);
  const c1=sorted[0].color,c2=sorted[1]?.color||c1,c3=sorted[2]?.color||c2;
  const col=dominant.color;const id=`aura_${dominant.id}`;const S=size*power;
  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
      <div style={{position:"relative",width:size+40,height:size+60,display:"flex",alignItems:"flex-end",justifyContent:"center",paddingBottom:6}}>
        <div style={{position:"absolute",bottom:0,left:"50%",transform:"translateX(-50%)",width:S*.8,height:10,borderRadius:"50%",background:`radial-gradient(ellipse,${col}55 0%,transparent 70%)`,animation:"flameShadow 1.8s ease-in-out infinite"}}/>
        {[{l:"46%",w:10,h:44,del:"0s",dur:"1.4s"},{l:"38%",w:7,h:32,del:".3s",dur:"1.1s"},{l:"54%",w:8,h:36,del:".5s",dur:"1.6s"},{l:"30%",w:6,h:22,del:".15s",dur:"1.3s"},{l:"62%",w:6,h:26,del:".7s",dur:"1.2s"}].map((f,i)=>(
          <div key={i} style={{position:"absolute",bottom:`${S*.5+6}px`,left:f.l,width:f.w,height:f.h,borderRadius:"50% 50% 30% 30%",background:`linear-gradient(to top,${i%2?c2:c1}dd,${i%2?c1:c2}44,transparent)`,transform:"translateX(-50%)",animation:`flameTongue ${f.dur} ease-in-out ${f.del} infinite`,filter:`blur(${f.w*.3}px)`,transformOrigin:"bottom center",opacity:.75}}/>
        ))}
        <svg width={S} height={S} viewBox="0 0 100 100" style={{position:"relative",zIndex:2,animation:"flameBody 1.6s ease-in-out infinite",filter:`drop-shadow(0 0 ${14*power}px ${col}) drop-shadow(0 0 ${6*power}px ${c2}) drop-shadow(0 0 ${24*power}px ${col}88)`}}>
          <defs>
            <radialGradient id={`fg${id}`} cx="42%" cy="55%" r="58%">
              <stop offset="0%" stopColor="white" stopOpacity=".95"/><stop offset="20%" stopColor={c1} stopOpacity=".98"/>
              <stop offset="55%" stopColor={c2} stopOpacity=".92"/><stop offset="85%" stopColor={c3} stopOpacity=".75"/><stop offset="100%" stopColor={c3} stopOpacity="0"/>
            </radialGradient>
          </defs>
          <ellipse cx="50" cy="52" rx="44" ry="46" fill={`url(#fg${id})`}/>
          <ellipse cx="48" cy="54" rx="22" ry="20" fill="white" opacity=".14"/>
          <ellipse cx="40" cy="34" rx="13" ry="9" fill="white" opacity=".55" transform="rotate(-18,40,34)"/>
          <ellipse cx="43" cy="30" rx="5" ry="3" fill="white" opacity=".82" transform="rotate(-18,43,30)"/>
        </svg>
        {sorted.slice(0,5).map((cat,i)=>{
          const pct=totalXP>0?(catXP[cat.id]/totalXP):0.1;const ps=Math.max(4,pct*14);
          const offX=(((i*73)%100)-50)*0.65;
          return(<div key={cat.id} style={{position:"absolute",width:ps,height:ps,borderRadius:"50%",background:cat.color,boxShadow:`0 0 ${ps*2}px ${cat.color}`,left:"50%",bottom:`${S*.45+4}px`,transform:`translateX(calc(-50% + ${offX}px))`,animation:`spark ${1.1+i*0.3}s ease-out ${(i*0.22).toFixed(2)}s infinite`,opacity:.9}}/>);
        })}
      </div>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:11,color:T.text2}}>Dominante: <span style={{color:col,fontWeight:600}}>{dominant.name}</span></div>
        <div style={{fontSize:10,color:T.text3,marginTop:1}}>XP: {totalXP.toLocaleString()}</div>
      </div>
    </div>
  );
});

// Level Up Modal
const LevelUpModal=memo(({fromLevel,toLevel,dominantColor,skills,onClose,T})=>{
  const isEvolution=toLevel%10===0;const c=dominantColor||"#d4aa50";
  const catXP=CATS.reduce((acc,cat)=>{acc[cat.id]=skills.filter(s=>s.catId===cat.id).reduce((a,s)=>a+s.xp+(s.level-1)*100,0);return acc;},{});
  const sorted=[...CATS].sort((a,b)=>catXP[b.id]-catXP[a.id]);
  const c1=sorted[0].color,c2=sorted[1]?.color||c1,c3=sorted[2]?.color||c2;
  const id=`lvlup_${toLevel}`;const power=Math.min(1,0.5+toLevel/80*0.5);const S=Math.round(100*power);
  const rank=toLevel<=2?"Novizio":toLevel<=5?"Apprendista":toLevel<=10?"Avventuriero":toLevel<=20?"Veterano":toLevel<=30?"Esperto":"Maestro";
  return(
    <div style={{position:"fixed",inset:0,zIndex:900,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,.88)"}} onClick={onClose}>
      <div style={{position:"relative",textAlign:"center",padding:"32px 28px",maxWidth:320,width:"100%",animation:"lvlFlash .6s ease forwards"}} onClick={e=>e.stopPropagation()}>
        <div style={{fontFamily:"Cinzel Decorative,cursive",fontSize:isEvolution?13:11,color:c,letterSpacing:isEvolution?6:4,marginBottom:8,animation:"lvlTextIn .8s ease .3s both",opacity:0}}>{isEvolution?"✦ EVOLUZIONE ✦":"LEVEL UP"}</div>
        <div style={{position:"relative",width:S+60,height:S+80,margin:"0 auto",display:"flex",alignItems:"flex-end",justifyContent:"center",paddingBottom:6}}>
          {[{l:"44%",w:10,h:44,del:"0s",dur:"1.1s"},{l:"36%",w:7,h:32,del:".25s",dur:".9s"},{l:"54%",w:8,h:36,del:".45s",dur:"1.2s"}].map((f,i)=>(
            <div key={i} style={{position:"absolute",bottom:`${S*.5}px`,left:f.l,width:f.w,height:f.h,borderRadius:"50% 50% 30% 30%",background:`linear-gradient(to top,${i%2?c2:c1}dd,transparent)`,transform:"translateX(-50%)",animation:`flameTongue ${f.dur} ease-in-out ${f.del} infinite`,filter:`blur(${f.w*.3}px)`,transformOrigin:"bottom center",opacity:.75}}/>
          ))}
          <svg width={S} height={S} viewBox="0 0 100 100" style={{position:"relative",zIndex:2,animation:"flameBody 1.4s ease-in-out infinite, lvlFlash .6s ease forwards",filter:`drop-shadow(0 0 20px ${c}) drop-shadow(0 0 8px ${c2})`}}>
            <defs><radialGradient id={`lfg${id}`} cx="42%" cy="55%" r="58%"><stop offset="0%" stopColor="white" stopOpacity=".95"/><stop offset="20%" stopColor={c1} stopOpacity=".98"/><stop offset="55%" stopColor={c2} stopOpacity=".92"/><stop offset="100%" stopColor={c3} stopOpacity="0"/></radialGradient></defs>
            <ellipse cx="50" cy="52" rx="44" ry="46" fill={`url(#lfg${id})`}/>
            <ellipse cx="40" cy="34" rx="13" ry="9" fill="white" opacity=".55" transform="rotate(-18,40,34)"/>
          </svg>
        </div>
        <div style={{marginTop:8,marginBottom:4,display:"flex",alignItems:"center",justifyContent:"center",gap:12}}>
          <div style={{fontFamily:"Cinzel Decorative,cursive",fontSize:18,color:c,opacity:.4,lineHeight:1}}>{fromLevel}</div>
          <div style={{fontSize:16,color:c,opacity:.6}}>→</div>
          <div style={{fontFamily:"Cinzel Decorative,cursive",fontSize:isEvolution?48:40,color:c,lineHeight:1,textShadow:`0 0 30px ${c}`,animation:"lvlNumber .7s cubic-bezier(.34,1.56,.64,1) .2s both",opacity:0}}>{toLevel}</div>
        </div>
        <div style={{fontFamily:"Cinzel,serif",fontSize:13,color:c,letterSpacing:2,marginBottom:20,animation:"lvlTextIn .8s ease .5s both",opacity:0}}>{rank}</div>
        <button onClick={onClose} style={{background:`${c}22`,border:`1px solid ${c}`,borderRadius:7,color:c,fontFamily:"Cinzel,serif",fontSize:13,letterSpacing:1,padding:"11px 32px",cursor:"pointer",animation:"lvlTextIn .8s ease .8s both",opacity:0,width:"100%"}}>
          {isEvolution?"✦ Continua ✦":"Continua →"}
        </button>
      </div>
    </div>
  );
});


/* ══ TUTORIAL STEPS ══════════════════════════════════════ */
const TUT_STEPS=[
  {id:"welcome",title:"Benvenuto in Life RPG!",
   body:"Gamifica la tua vita reale. Ogni abitudine diventa XP reali. Seguimi — 60 secondi.",
   cardPos:"center",arrowPos:null,allowZone:null,cta:"Iniziamo →"},
  {id:"do_quest",title:"Completa una quest",
   body:"Tocca una quest qui sotto per aprire la conferma.",
   bodyPending:"Trascina il cerchio fino in fondo → per confermare.",
   cardPos:"top",arrowPos:{top:220,left:"50%",transform:"translateX(-50%)"},allowZone:"questlist",cta:null},
  {id:"xp_gained",title:"XP guadagnati!",
   body:"La barra in alto è salita. Ogni quest completata fa crescere il tuo personaggio.",
   cardPos:"bottom",arrowPos:null,allowZone:null,cta:"Capito →"},
  {id:"add_quest",title:"Aggiungi una quest",
   body:"Tocca il pulsante ＋ Quest in alto a destra.",
   cardPos:"bottom",arrowPos:{top:300,right:24,transform:"none"},allowZone:"addtask",cta:null},
  {id:"preset_shown",title:"Quest pronte all'uso",
   body:"Tocca una quest suggerita per aggiungerla subito.",
   cardPos:"top",arrowPos:null,allowZone:"modal",cta:null},
  {id:"skills_nav",title:"Sezione Skill",
   body:"Tocca Skill nella barra qui sotto.",
   cardPos:"top",arrowPos:{bottom:56,left:"17%",transform:"translateX(-50%)"},allowZone:"nav_skills",cta:null},
  {id:"skills_info",title:"Le tue Skill",
   body:"Ogni quest potenzia una skill. Livelli infiniti. Dopo 3 giorni inattivo perdi il 5% XP — sii costante.",
   cardPos:"center",arrowPos:null,allowZone:null,cta:"Avanti →"},
  {id:"stats_nav",title:"Sezione Stats",
   body:"Tocca Stats nella barra qui sotto.",
   cardPos:"top",arrowPos:{bottom:56,left:"83%",transform:"translateX(-50%)"},allowZone:"nav_stats",cta:null},
  {id:"history_tip",title:"La tua Streak",
   body:"La fiamma cresce ogni giorno che completi una quest e ti dà +0.5% XP al giorno. Se salti un giorno si spegne e perdi il bonus.",
   cardPos:"center",arrowPos:null,allowZone:null,cta:"Capito →"},
  {id:"stats_info",title:"Storico",
   body:"In questa sezione trovi tutte le quest completate. Premi ✕ su una voce per rimuoverla — gli XP vengono sottratti automaticamente.",
   cardPos:"center",arrowPos:null,allowZone:null,cta:"🚀 Inizia il gioco!"},
];

export default function LifeRPG(){
  // ⚠️ All initial values are 0 — never load stale demo data for new installs
  const[skills, setSkills] =useState(()=>ld("lrpg_skills",DEF_SKILLS).map(s=>({...s,lastActivity:s.lastActivity||null,level:s.level||1,xp:typeof s.xp==="number"?s.xp:0,catWeights:s.catWeights||[{catId:s.catId,pct:100}]})));
  const[tasks,  setTasks]  =useState(()=>{
    const t=ld("lrpg_tasks",DEF_TASKS);
    const fix=arr=>(arr||[]).map(x=>({...x,doneAt:x.doneAt||null,type:x.type||"daily"}));
    return{daily:fix(t.daily),weekly:fix(t.weekly),monthly:fix(t.monthly)};
  });
  const[history,setHistory]=useState(()=>ld("lrpg_hist",[]));
  const[totalXP,setTotalXP]=useState(()=>Math.max(0,ld("lrpg_xp",0)));
  const[doneN,  setDoneN]  =useState(()=>Math.max(0,ld("lrpg_done",0)));
  const[profile,setProfile]=useState(()=>ld("lrpg_profile",DEF_PROFILE));
  const dark=true; // Always dark mode
  const T=DARK;
  const[soundOn,setSoundOn]=useState(()=>ld("lrpg_sound",true));
  const[musicOn,setMusicOn]=useState(()=>ld("lrpg_music",true));
  const[onboarded,setOnboarded]=useState(()=>ld("lrpg_onboarded",false));
  const[tutStep,setTutStep]=useState(()=>ld("lrpg_tut",false)?-1:0);
  const[resetConfirmShow,setResetConfirmShow]=useState(false);
  const[resetConfirmText,setResetConfirmText]=useState("");
  const[levelUpData,setLevelUpData]=useState(null);
  const[skillPending,setSkillPending]=useState(null);
  const[flameIntro,setFlameIntro]=useState(false);
  const[showSettings,setShowSettings]=useState(false); // settings modal
  const[musicVol,setMusicVol]=useState(()=>ld("lrpg_mvol",70)); // 0-100
  const[soundVol,setSoundVol]=useState(()=>ld("lrpg_svol",70));
  const[streak,setStreak]=useState(()=>ld("lrpg_streak",{days:0,lastDate:null}));
  const[showStreakIntro,setShowStreakIntro]=useState(false); // brief popup on first streak
    /* Streak XP bonus: +0.5% per day active */
  const streakBonus=Math.round(streak.days*0.5*10)/10;

  const toggleTheme=()=>{}; // no-op, kept for compatibility
  const toggleSound=useCallback(()=>setSoundOn(s=>{sv("lrpg_sound",!s);return!s;}),[]);
  const toggleMusic=useCallback(()=>setMusicOn(m=>{const next=!m;sv("lrpg_music",next);if(next)startBgMusic();else stopBgMusic();return next;}),[]);
  const sfx=useCallback((catId)=>{if(!soundOn)return;SFX_CLK();if(catId&&CAT_SFX[catId])CAT_SFX[catId]();},[soundOn]);

  const[section,setSection]=useState("quests");
  const[tab,    setTab]    =useState("daily");
  const[notif,  setNotif]  =useState(null);
  const[floats, setFloats] =useState([]);
  const[modal,  setModal]  =useState(null);
  const[histCat,setHistCat]=useState(null);
  const[statCat,setStatCat]=useState(null);
  const[pending,setPending]=useState(null);
  const[histPending,setHistPending]=useState(null); // history entry pending drag-delete
  const[newId,  setNewId]  =useState(null);

  // add form
  const[addType,    setAddType]    =useState("task");
  const[addName,    setAddName]    =useState("");
  const[addCatId,   setAddCatId]   =useState(CATS[0].id);
  const[addSkillId, setAddSkillId] =useState("none");
  const[skillCatWeights,setSkillCatWeights]=useState([]); // [{catId,pct}] for multi-cat skill
  const[skillCatStep,setSkillCatStep]=useState(0); // 0=pick cats, 1=quiz, 2=done
  const[skillCatQuiz,setSkillCatQuiz]=useState([]); // quiz Q&A for pct
  const[skillCatAns,setSkillCatAns]=useState([]);
  const[addTaskType,setAddTaskType]=useState("daily");
  const[addIcon,    setAddIcon]    =useState("⭐");
  const[addTab,     setAddTab]     =useState("preset");
  const[survey,     setSurvey]     =useState([]);
  const[survStep,   setSurvStep]   =useState(0);
  const[survAns,    setSurvAns]    =useState([]);
  const[survXP,     setSurvXP]     =useState(null);

  // profile form
  const[profName,    setProfName]    =useState("");
  const[profAvatar,  setProfAvatar]  =useState(()=>profile.avatar||"violet");
  const[profPhoto,   setProfPhoto]   =useState(profile.photo||null);
  const[photoCropY,  setPhotoCropY]  =useState(()=>profile.photoCropY||50);
  const[photoCropX,  setPhotoCropX]  =useState(()=>profile.photoCropX||50);
  const[obPhotoCropX,setObPhotoCropX]=useState(50);
  const[obPhotoCropY,setObPhotoCropY]=useState(50);
  const[profAge,     setProfAge]     =useState("");
  const[profGender,  setProfGender]  =useState("");
  const[profHeight,  setProfHeight]  =useState("");
  const[profBodyType,setProfBodyType]=useState("");
  const[profReminder,setProfReminder]=useState(true);
  const[wInput,      setWInput]      =useState("");
  const[showNutri,   setShowNutri]   =useState(false);
  const[nutriP,      setNutriP]      =useState("");
  const[profBodyPopup,setProfBodyPopup]=useState(false);

  // onboarding
  const[obStep,  setObStep]  =useState(0);
  const[obName,  setObName]  =useState("");
  const[obAge,   setObAge]   =useState("");
  const[obGender,setObGender]=useState("");
  const[obAvatar,setObAvatar]=useState("violet");
  const[obPhoto, setObPhoto] =useState(null);
  const[obHeight,setObHeight]=useState("");
  const[obBody,  setObBody]  =useState("");
  const[obBodyPopup,setObBodyPopup]=useState(false);
  const[notifEnabled,setNotifEnabled]=useState(false);

  const notifTimer=useRef(null);
  const photoInput=useRef(null);
  const obPhotoInput=useRef(null);

  const lvData =useMemo(()=>getLevelData(totalXP),[totalXP]);
  const level  =lvData.currentLevel;
  const xpInLvl=lvData.xpInCurrentLevel;
  const xpPct  =lvData.progressPercentage;
  const rank   =useMemo(()=>level<=2?"Novizio":level<=5?"Apprendista":level<=10?"Avventuriero":level<=15?"Veterano":level<=20?"Esperto":level<=28?"Maestro":level<=39?"Gran Maestro":"Leggenda",[level]);
  const getCat =useCallback((id)=>CATS.find(c=>c.id===id)||{name:id,icon:"⭐",color:"#888"},[]);
  const getSk  =useCallback((id)=>skills.find(s=>s.id===id)||null,[skills]);
  const noEnter=useCallback((e)=>{if(e.key==="Enter")e.preventDefault();},[]);
  const catSkills=useMemo(()=>skills.filter(s=>{
    const w=s.catWeights||[{catId:s.catId,pct:100}];
    return w.some(x=>x.catId===addCatId&&x.pct>0);
  }),[skills,addCatId]);

  useEffect(()=>{sv("lrpg_skills",skills);},[skills]);
  useEffect(()=>{sv("lrpg_tasks", tasks); },[tasks]);
  useEffect(()=>{sv("lrpg_hist",  history);},[history]);
  useEffect(()=>{sv("lrpg_xp",   totalXP);},[totalXP]);
  useEffect(()=>{sv("lrpg_done", doneN);  },[doneN]);
  useEffect(()=>{sv("lrpg_profile",profile);},[profile]);

  /* AUTO-RESET — only resets done flag, NEVER touches XP */
  useEffect(()=>{
    function check(){
      const dlr=ld("lrpg_rd",null),wlr=ld("lrpg_rw",null),mlr=ld("lrpg_rm",null);
      const now=Date.now();
      setTasks(prev=>{
        let next={...prev};let ch=false;
        if(needsDaily(dlr)){
          setHistory(h=>h.filter(e=>(now-e.completedAt)<86400000));
          next={...next,daily:prev.daily.map(t=>({...t,done:false,doneAt:null}))};
          sv("lrpg_rd",now);ch=true;
        }
        if(needsWeekly(wlr)){next={...next,weekly:prev.weekly.map(t=>({...t,done:false,doneAt:null}))};sv("lrpg_rw",now);ch=true;}
        if(needsMonthly(mlr)){next={...next,monthly:prev.monthly.map(t=>({...t,done:false,doneAt:null}))};sv("lrpg_rm",now);ch=true;}
        return ch?next:prev;
      });
    }
    check();const iv=setInterval(check,60000);return()=>clearInterval(iv);
  },[]);

  /* DECAY — 5% of current-level XP per day beyond day 3, no de-level */
  useEffect(()=>{
    const last=ld("lrpg_dt",0);
    const daysSinceLast=Math.floor((Date.now()-last)/86400000);
    if(daysSinceLast<1)return;
    setSkills(prev=>applyDecay(prev,daysSinceLast));
    sv("lrpg_dt",Date.now());
  },[]);

  useEffect(()=>{sv("lrpg_streak",streak);},[streak]);

  /* SERVICE WORKER + NOTIFICATIONS */
  useEffect(()=>{
    if(!("serviceWorker" in navigator))return;
    navigator.serviceWorker.register("/sw.js").catch(()=>{});
    // Request notification permission
    if("Notification" in window&&Notification.permission==="default"){
      Notification.requestPermission();
    }
  },[]);

  /* Schedule evening notification via SW */
  const scheduleNotifications=useCallback((streakDays,decayingCats)=>{
    if(!("serviceWorker" in navigator)||!("Notification" in window)||Notification.permission!=="granted")return;
    navigator.serviceWorker.ready.then(reg=>{
      const now=new Date();
      const evening=new Date(now);
      evening.setHours(20,30,0,0);
      if(evening<=now)evening.setDate(evening.getDate()+1);
      const msUntil=evening.getTime()-now.getTime();
      const todayKey=now.toDateString();
      const completedToday=streak.lastDate===todayKey;
      const sw=reg.active;if(!sw)return;
      // Flame extinction warning (only if not yet completed today)
      if(!completedToday){
        sw.postMessage({type:"SCHEDULE_NOTIFICATION",delay:msUntil,tag:"flame-warning",
          title:"🔥 La tua fiamma sta per spegnersi!",
          body:"Non hai ancora completato nessuna quest oggi. Entra e mantieni viva la tua costanza.",
          vibrate:[200,100,200],icon:"/icon-192.png"});
      }
      // Decay warning for affected categories
      if(decayingCats.length>0){
        const names=decayingCats.map(c=>c.name).join(", ");
        sw.postMessage({type:"SCHEDULE_NOTIFICATION",delay:msUntil+60000,tag:"decay-warning",
          title:`📉 ${decayingCats[0].icon} ${decayingCats[0].name} sta decadendo`,
          body:`Le skill di ${names} perdono XP ogni giorno. Completa una quest per fermare il decadimento.`,
          vibrate:[100,50,100],icon:"/icon-192.png"});
      }
      // Weight reminder (30 days)
      if(profile.weightReminderEnabled&&daysSince(profile.lastWeightUpdate)>=30){
        sw.postMessage({type:"SCHEDULE_NOTIFICATION",delay:msUntil+120000,tag:"weight-reminder",
          title:"⚖️ Aggiorna il tuo peso",
          body:"Sono passati 30 giorni dall'ultima misurazione. Controlla i tuoi progressi fisici.",
          icon:"/icon-192.png"});
      }
    }).catch(()=>{});
  },[streak,profile]);
  // Start background music after first user interaction
  useEffect(()=>{
    if(!musicOn)return;
    const handler=()=>{startBgMusic();document.removeEventListener("click",handler);document.removeEventListener("touchstart",handler);};
    document.addEventListener("click",handler);
    document.addEventListener("touchstart",handler);
    return()=>{document.removeEventListener("click",handler);document.removeEventListener("touchstart",handler);};
  },[musicOn]);

  /* Tutorial quest injection — when tutorial reaches step 1 (do_quest),
     ensure there are quests to interact with */
  useEffect(()=>{
    if(tutStep===1&&tasks.daily.length===0){
      const freshQuests=TUT_QUESTS.map(q=>({...q,done:false,doneAt:null}));
      setTasks(p=>({...p,daily:freshQuests}));
    }
  },[tutStep]);

  /* Schedule push notifications on mount */
  useEffect(()=>{
    const decayingCats=CATS.filter(cat=>
      skills.filter(s=>s.catId===cat.id).some(s=>s.lastActivity&&daysSince(s.lastActivity)>3)
    );
    scheduleNotifications(streak.days,decayingCats);
  },[]);

  /* Flame intro — slide up from bottom on every app open */
  useEffect(()=>{
    if(streak.days<1)return; // only show if there's a streak
    const t=setTimeout(()=>{setFlameIntro(true);},800);
    const t2=setTimeout(()=>{setFlameIntro(false);},4000);
    return()=>{clearTimeout(t);clearTimeout(t2);};
  },[]);

  const showNotif=useCallback((msg,color)=>{setNotif({msg,color:color||T.gold});clearTimeout(notifTimer.current);notifTimer.current=setTimeout(()=>setNotif(null),3000);},[T.gold]);
  const spawnFloat=useCallback((txt,color)=>{const id=uid();setFloats(f=>[...f,{id,txt,color,x:25+Math.random()*50,y:30+Math.random()*40}]);setTimeout(()=>setFloats(f=>f.filter(x=>x.id!==id)),1500);},[]);

  const openAdd=useCallback((type="task",def={})=>{
    if(soundOn)SFX_OPN();
    setAddType(type);setAddName(def.name||"");setAddCatId(def.catId||CATS[0].id);setAddSkillId("none");setAddTaskType(def.taskType||"daily");setAddIcon(def.icon||"⭐");setAddTab(type==="task"?"preset":"custom");setSurvStep(0);setSurvAns([]);setSurvXP(null);setSurvey([]);setSkillCatWeights([]);setSkillCatStep(0);setSkillCatAns([]);setModal("add");
    if(tutStep===3)setTimeout(()=>setTutStep(4),200); // + button clicked → show modal step
  },[soundOn,tutStep]);
  const openProfile=useCallback(()=>{if(soundOn)SFX_OPN();setProfName(profile.name);setProfAvatar(profile.avatar||"violet");setProfPhoto(profile.photo||null);setPhotoCropY(profile.photoCropY||50);setPhotoCropX(profile.photoCropX||50);setProfAge(profile.age||"");setProfGender(profile.gender||"");setProfHeight(profile.height||"");setProfBodyType(profile.bodyType||"");setProfReminder(profile.weightReminderEnabled);setWInput("");setShowNutri(false);setNutriP("");setProfBodyPopup(false);setModal("profile");},[profile,soundOn]);
  const closeModal=useCallback(()=>{setModal(null);setProfBodyPopup(false);},[]);

  /* CONFIRM TASK */
  const confirmTask=useCallback(()=>{
    if(!pending)return;const{task,type}=pending;setPending(null);
    setTasks(p=>({...p,[type]:p[type].map(t=>t.id===task.id?{...t,done:true,doneAt:Date.now()}:t)}));
    const bonusXP=Math.round(task.xp*(1+streakBonus/100));
    setTotalXP(p=>{
      const before=getLevelData(p).currentLevel;
      const next=p+bonusXP;
      const after=getLevelData(next).currentLevel;
      if(after>before){
        const cat=CATS.find(c=>c.id===task.catId)||CATS[0];
        setTimeout(()=>setLevelUpData({fromLevel:before,toLevel:after,dominantColor:cat.color}),600);
        if(soundOn)setTimeout(()=>SFX_LVL(),700);
      }
      return next;
    });
    setDoneN(p=>p+1);
    setHistory(p=>[{id:uid(),name:task.name,xp:bonusXP,xpBase:task.xp,streakBonus,catId:task.catId,skillId:task.skillId||null,icon:task.icon,type,completedAt:Date.now()},...p]);
    setSkills(prev=>prev.map(sk=>{
      const hit=task.skillId?sk.id===task.skillId:sk.catId===task.catId;if(!hit)return sk;
      // Distribute XP by catWeights if available
      const weights=sk.catWeights||[{catId:sk.catId,pct:100}];
      const matchWeight=weights.find(w=>w.catId===task.catId);
      const xpRatio=matchWeight?(matchWeight.pct/100):1;
      let{xp,level:lv}=sk,g=Math.max(1,Math.round(task.xp*xpRatio)),ups=0;
      while(g>0){const n=getSkillXpThreshold(lv),r=n-xp;if(g>=r){g-=r;lv++;xp=0;ups++;}else{xp+=g;g=0;}}
      if(ups>0)setTimeout(()=>{showNotif(`🎊 ${sk.name} → Lv.${lv}!`,getCat(task.catId).color);},700);
      return{...sk,xp:Math.min(xp,getSkillXpThreshold(lv)-1),level:lv,lastActivity:Date.now()};
    }));
    spawnFloat(`+${bonusXP} XP`,getCat(task.catId).color);
    showNotif(`✅ ${task.name}! +${bonusXP} XP${streakBonus>0?" 🔥":""}`,getCat(task.catId).color);
    sfx(task.catId);
    // Update streak + show intro on first activation
    const today=new Date().toDateString();
    setStreak(prev=>{
      if(prev.lastDate===today)return prev;
      const yesterday=new Date(Date.now()-86400000).toDateString();
      const newDays=prev.lastDate===yesterday?prev.days+1:1;
      if(newDays===1)setTimeout(()=>{setShowStreakIntro(true);},1200);
      return{days:newDays,lastDate:today};
    });
    if(tutStep===1)setTimeout(()=>setTutStep(2),700); // quest completed → show xp_gained
  },[pending,getCat,showNotif,spawnFloat,sfx,soundOn,tutStep,streakBonus]);

  const resetTab=useCallback(type=>{setTasks(p=>({...p,[type]:p[type].map(t=>({...t,done:false,doneAt:null}))}));showNotif("♻️ Reset!",T.text2);},[T.text2,showNotif]);
  const tabDone=useCallback(type=>tasks[type].filter(t=>t.done).length,[tasks]);
  const currTasks=useMemo(()=>tasks[tab]||[],[tasks,tab]);

  /* SURVEY */
  const startSurvey=useCallback(()=>{setSurvey(mkSurvey(addCatId));setSurvStep(1);setSurvAns([]);setSurvXP(null);},[addCatId]);
  const answerQ=useCallback(p=>{const na=[...survAns,p];setSurvAns(na);if(survStep<10)setSurvStep(s=>s+1);else{setSurvXP(calcXP(na,addCatId,addTaskType));setSurvStep(11);}},[survAns,survStep,addCatId,addTaskType]);
  const resetSurvey=useCallback(()=>{setSurvStep(0);setSurvAns([]);setSurvXP(null);setSurvey([]);},[]);

  /* ADD */
  const submitAdd=useCallback(()=>{
    if(!addName.trim())return;const fXP=survXP||15;
    if(addType==="skill"){
      if(!addName.trim())return;
      const weights=skillCatWeights.length>0?skillCatWeights:[{catId:addCatId,pct:100}];
      const primaryCat=weights.reduce((a,b)=>b.pct>a.pct?b:a).catId;
      setSkills(p=>[...p,{id:uid(),name:addName.trim(),level:1,xp:0,catId:primaryCat,catWeights:weights,icon:addIcon,lastActivity:null}]);
      showNotif(`🔮 "${addName}" aggiunta!`,getCat(primaryCat).color);
      setSkillCatWeights([]);setSkillCatStep(0);setSkillCatAns([]);
      closeModal();return;
    }
    else{const skId=addSkillId==="none"?null:addSkillId;const nid=uid();setTasks(p=>({...p,[addTaskType]:[{id:nid,name:addName.trim(),xp:fXP,catId:addCatId,skillId:skId,icon:addIcon,type:addTaskType,done:false,doneAt:null},...p[addTaskType]]}));setNewId(nid);setTimeout(()=>setNewId(null),3500);setTab(addTaskType);setSection("quests");showNotif(`⚔️ "${addName}" aggiunta!`,getCat(addCatId).color);}
    closeModal();
  },[addType,addName,addIcon,addCatId,addSkillId,addTaskType,survXP,getCat,showNotif,closeModal]);

  const addPreset=useCallback(p=>{
    const nid=uid();
    setTasks(prev=>({...prev,[p.taskType]:[{id:nid,...p,done:false,doneAt:null},...prev[p.taskType]]}));
    setNewId(nid);setTimeout(()=>setNewId(null),3500);setTab(p.taskType);setSection("quests");
    showNotif(`✅ "${p.name}" aggiunta!`,getCat(p.catId).color);closeModal();
    if(tutStep===4)setTimeout(()=>setTutStep(5),300); // preset added → go to skills nav
  },[getCat,showNotif,closeModal,tutStep]);

  /* PROFILE */
  const handlePhoto=e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=ev=>setProfPhoto(ev.target.result);r.readAsDataURL(f);};
  const saveProfile=useCallback(()=>{
    if(profName.trim()!==profile.name&&daysSince(profile.lastNameChange)<30){showNotif(`❌ Puoi cambiare nome tra ${30-daysSince(profile.lastNameChange)} giorni`,"#ef4444");return;}
    setProfile(p=>({...p,name:profName.trim()||p.name||"Adventurer",avatar:profAvatar,photo:profPhoto,photoCropY,photoCropX,age:profAge,gender:profGender,height:profHeight,bodyType:profBodyType,weightReminderEnabled:profReminder,lastNameChange:profName.trim()!==profile.name?Date.now():p.lastNameChange}));
    showNotif("✅ Profilo salvato!","#22c55e");closeModal();
  },[profName,profAvatar,profPhoto,profAge,profGender,profHeight,profBodyType,profReminder,profile,showNotif,closeModal]);
  const addWeight=useCallback(()=>{const v=parseFloat(wInput);if(!v||v<20||v>300){showNotif("Peso non valido","#ef4444");return;}setProfile(p=>({...p,weights:[{date:Date.now(),val:v},...p.weights].slice(0,24),lastWeightUpdate:Date.now()}));setWInput("");showNotif(`⚖️ ${v}kg!`,"#22c55e");},[wInput,showNotif]);
  const removeWeight=useCallback(i=>setProfile(p=>({...p,weights:p.weights.filter((_,idx)=>idx!==i)})),[]);

  /* HISTORY DELETE via drag → removes XP */
  const confirmHistDelete=useCallback(()=>{
    if(!histPending)return;const e=histPending;setHistPending(null);
    setHistory(p=>p.filter(h=>h.id!==e.id));
    setTotalXP(p=>Math.max(0,p-e.xp));
    setDoneN(p=>Math.max(0,p-1));
    showNotif(`↩ Rimossi −${e.xp} XP`,T.text2);
  },[histPending,T.text2,showNotif]);

  const buildNutri=()=>{const w=profile.weights[0]?.val;setNutriP([`Crea un piano nutrizionale personalizzato per me.`,profile.age?`Età: ${profile.age} anni.`:"",profile.gender?`Sesso: ${profile.gender}.`:"",profile.height?`Altezza: ${profile.height} cm.`:"",w?`Peso attuale: ${w} kg.`:"",profile.bodyType?`Corporatura: ${profile.bodyType}.`:"","","Obiettivo: salute e performance fisiche.","Includi: calorie, macronutrienti, piano settimanale 3 pasti+2 spuntini, alimenti consigliati e da evitare.","Rispondi in italiano, chiaramente."].filter(Boolean).join("\n"));setShowNutri(true);};

  const resetAccount=useCallback(()=>{
    ["lrpg_skills","lrpg_tasks","lrpg_hist","lrpg_xp","lrpg_done","lrpg_profile","lrpg_dark","lrpg_dt","lrpg_rd","lrpg_rw","lrpg_rm","lrpg_onboarded","lrpg_tut","lrpg_sound","lrpg_music","lrpg_streak","lrpg_mvol","lrpg_svol"].forEach(k=>localStorage.removeItem(k));
    // Reset all state in place — no reload needed
    setSkills(DEF_SKILLS.map(s=>({...s,catWeights:s.catWeights||[{catId:s.catId,pct:100}]})));
    setTasks(DEF_TASKS);
    setHistory([]);
    setTotalXP(0);
    setDoneN(0);
    setProfile(DEF_PROFILE);
    setStreak({days:0,lastDate:null});
    setSection("quests");
    setTab("daily");
    setModal(null);
    setOnboarded(false);
    setTutStep(-1);
    setResetConfirmShow(false);
    setResetConfirmText("");
    setShowSettings(false);
  },[]);
  const shareStats=()=>{const lines=[`🎮 Life RPG — ${profile.name||"Adventurer"} [${rank}]`,`Lv.${level} — ${totalXP.toLocaleString()} XP — ${doneN} completate`];CATS.forEach(cat=>{const cs=skills.filter(s=>s.catId===cat.id);if(!cs.length)return;lines.push(`${cat.icon} ${cat.name} Lv.${(cs.reduce((a,s)=>a+s.level,0)/cs.length).toFixed(1)}`);});navigator.clipboard?.writeText(lines.join("\n")).then(()=>showNotif("📋 Copiato!","#22c55e"));};
  const histEntries=useMemo(()=>histCat?history.filter(h=>h.catId===histCat):history,[history,histCat]);

  /* ONBOARDING FINISH */
  const finishOb=()=>{
    setProfile(p=>({...p,name:obName.trim()||"Adventurer",avatar:obAvatar,photo:obPhoto||null,photoCropY:obPhotoCropY,photoCropX:obPhotoCropX,age:obAge,gender:obGender,height:obHeight,bodyType:obBody}));
    setOnboarded(true);sv("lrpg_onboarded",true);
    if(musicOn)startBgMusic();
    setTutStep(0);
  };

  /* TUTORIAL state — declared early so callbacks can use them */
  const isTut=tutStep>=0&&tutStep<TUT_STEPS.length;
  const tutInfo=isTut?TUT_STEPS[tutStep]:null;

  /* TUTORIAL advance */
  const advanceTut=useCallback(()=>{
    const next=tutStep+1;
    if(next>=TUT_STEPS.length){
      // Tutorial complete — keep daily quests, add milestone weekly/monthly
      const weeklyMilestone={id:"wm1",name:"Raggiungi il livello 10",xp:80,catId:"mente",skillId:null,icon:"🏆",type:"weekly",done:false,doneAt:null};
      const monthlyMilestone={id:"mm1",name:"Completa 30 quest in un mese",xp:200,catId:"mente",skillId:null,icon:"🌟",type:"monthly",done:false,doneAt:null};
      setTasks(prev=>({
        daily:prev.daily.map(t=>({...t,done:false,doneAt:null})),
        weekly:[weeklyMilestone],
        monthly:[monthlyMilestone],
      }));
      setStreak({days:0,lastDate:null});
      sv("lrpg_streak",{days:0,lastDate:null});
      setTutStep(-1);
      sv("lrpg_tut",true);
    }
    else setTutStep(next);
  },[tutStep]);

  // Called when user navigates to a section during tutorial
  const tutNavCheck=useCallback((targetSection)=>{
    if(!isTut)return;
    const step=TUT_STEPS[tutStep];
    if(step?.allowZone===`nav_${targetSection}`)advanceTut();
  },[isTut,tutStep,advanceTut]);

  /* ══ CSS ═══════════════════════════════════════════════ */
  const css=`
    ${FONT}
    *{box-sizing:border-box;margin:0;padding:0;}html,body{background:${T.bg};}
    ::-webkit-scrollbar{width:5px;}::-webkit-scrollbar-track{background:${T.scrollTk};}::-webkit-scrollbar-thumb{background:${T.scroll};border-radius:4px;}
    .inp{background:${T.inp};border:1px solid ${T.inpBd};border-radius:6px;color:${T.text};font-family:Rajdhani,sans-serif;font-size:15px;padding:8px 12px;width:100%;outline:none;transition:border-color .2s;}
    .inp:focus{border-color:${T.inpFc};}
    .btn-gold{background:${T.btnGBg};border:1px solid ${T.btnGBd};border-radius:7px;color:${T.btnGTx};cursor:pointer;font-family:Cinzel,serif;font-size:13px;letter-spacing:1px;padding:11px 24px;transition:all .2s;width:100%;margin-top:6px;}
    .btn-sm{background:${T.btnSBg};border:1px solid ${T.btnSBd};border-radius:5px;color:${T.btnSTx};cursor:pointer;font-family:Rajdhani,sans-serif;font-size:12px;font-weight:600;padding:6px 14px;transition:all .2s;white-space:nowrap;}
    .btn-sm:hover{border-color:${T.inpFc};color:${T.gold};}
    .btn-del{background:transparent;border:none;color:${T.btnDTx};cursor:pointer;font-size:14px;padding:4px 9px;transition:all .2s;}
    .btn-del:hover{color:${T.btnDHTx};}
    .nav-btn{padding:8px 16px;border:1px solid ${T.inpBd};background:transparent;color:${T.navBtnTx};font-family:Cinzel,serif;font-size:12px;cursor:pointer;border-radius:5px;white-space:nowrap;transition:all .2s;font-feature-settings:"ss01","calt" 0,"liga" 0;}
    .nav-btn:hover{border-color:${T.inpFc};color:${T.gold};}
    .nav-btn.active{background:${T.navActBg};border-color:${T.navActBd};color:${T.navActTx};box-shadow:${T.navActSh};}
    .h-card{transition:transform .18s,box-shadow .18s;cursor:pointer;}
    .h-card:hover{transform:translateY(-2px);}
    .q-opt{background:${T.btnSBg};border:1px solid ${T.inpBd};border-radius:7px;color:${T.text};cursor:pointer;font-family:Rajdhani,sans-serif;font-size:13px;padding:10px 14px;text-align:left;transition:all .15s;width:100%;}
    .q-opt:hover{border-color:${T.inpFc};color:${T.gold};}
    .tut-highlight{outline:3px solid #d4aa50;outline-offset:4px;border-radius:10px;box-shadow:0 0 0 9999px rgba(0,0,0,0) !important;position:relative;z-index:450;background:inherit;}
    @keyframes sectionSlideIn{from{opacity:0;transform:translateX(var(--slide-from,30px))}to{opacity:1;transform:translateX(0)}}
    .bottom-nav-btn{display:flex;flex-direction:column;align-items:center;gap:3px;background:transparent;border:none;cursor:pointer;padding:8px 0;flex:1;transition:all .2s;-webkit-tap-highlight-color:transparent;}
    .bottom-nav-btn svg{transition:all .2s;}
    .bottom-nav-btn span{font-family:Cinzel,serif;font-size:9px;letter-spacing:.5px;transition:color .2s;}
    @keyframes floatUp{0%{transform:translateY(0) scale(1);opacity:1}100%{transform:translateY(-80px) scale(.6);opacity:0}}
    @keyframes slideIn{from{transform:translateX(110%);opacity:0}to{transform:translateX(0);opacity:1}}
    @keyframes fadeIn{from{opacity:0;transform:scale(.97)}to{opacity:1;transform:scale(1)}}
    @keyframes popIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
    @keyframes glowPulse{0%,100%{box-shadow:0 0 0 2px ${T.gold}}50%{box-shadow:0 0 14px ${T.gold}88,0 0 0 2px ${T.goldBri}}}
    @keyframes tutBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
    @keyframes flameBody{0%,100%{transform:scaleX(1) scaleY(1) translateY(0)}25%{transform:scaleX(.93) scaleY(1.04) translateY(-3px)}50%{transform:scaleX(1.05) scaleY(.97) translateY(-1px)}75%{transform:scaleX(.96) scaleY(1.02) translateY(-4px)}}
    @keyframes flameTongue{0%,100%{transform:translateX(-50%) scaleX(1) scaleY(1);opacity:.7}30%{transform:translateX(calc(-50% - 4px)) scaleX(.7) scaleY(1.2);opacity:.9}60%{transform:translateX(calc(-50% + 3px)) scaleX(.85) scaleY(.9);opacity:.6}80%{transform:translateX(calc(-50% - 2px)) scaleX(1.1) scaleY(1.1);opacity:.8}}
    @keyframes spark{0%{transform:translateX(calc(-50% + var(--sx,0px))) translateY(0);opacity:.9}60%{opacity:.6}100%{transform:translateX(calc(-50% + var(--sx,0px))) translateY(-80px);opacity:0}}
    @keyframes flameShadow{0%,100%{transform:translateX(-50%) scaleX(1);opacity:.6}50%{transform:translateX(-50%) scaleX(.8);opacity:.3}}
    @keyframes flameHaze{0%,100%{transform:translateX(-50%) scale(1);opacity:.8}50%{transform:translateX(-50%) scale(1.08);opacity:.4}}
    @keyframes flameIntroUp{0%{transform:translateY(120px);opacity:0}20%{opacity:1}70%{transform:translateY(0);opacity:1}85%{transform:translateY(0);opacity:1}100%{transform:translateY(120px);opacity:0}}
    @keyframes flameIntroGlow{0%,100%{opacity:0}20%,80%{opacity:1}}
    @keyframes auraRing1{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
    @keyframes charFloat{0%,100%{transform:translateY(0px)}50%{transform:translateY(-4px)}}
    @keyframes particleRise{0%{transform:translateY(0) scale(1);opacity:.9}100%{transform:translateY(-44px) scale(.2);opacity:0}}
    @keyframes lvlFlash{0%{opacity:0;transform:scale(.5)}20%{opacity:1;transform:scale(1.15)}40%{transform:scale(.95)}60%{transform:scale(1.05)}80%,100%{transform:scale(1);opacity:1}}
    @keyframes lvlNumber{0%{transform:scale(.3) translateY(20px);opacity:0}50%{transform:scale(1.3) translateY(-6px);opacity:1}70%{transform:scale(.95) translateY(2px)}100%{transform:scale(1) translateY(0);opacity:1}}
    @keyframes lvlBurst{0%{transform:scale(0);opacity:1}60%{opacity:.8}100%{transform:scale(2.8);opacity:0}}
    @keyframes lvlRing{0%{transform:scale(.6);opacity:.9}100%{transform:scale(2.2);opacity:0}}
    @keyframes lvlShake{0%,100%{transform:translateX(0)}10%{transform:translateX(-8px)}20%{transform:translateX(8px)}30%{transform:translateX(-6px)}40%{transform:translateX(6px)}50%{transform:translateX(-4px)}60%{transform:translateX(4px)}70%{transform:translateX(-2px)}80%{transform:translateX(2px)}}
    @keyframes lvlOverlay{0%{background:rgba(255,255,255,.35)}100%{background:transparent}}
    @keyframes lvlStarSpin{0%{transform:rotate(0deg) scale(0);opacity:1}50%{transform:rotate(180deg) scale(1.2);opacity:.9}100%{transform:rotate(360deg) scale(0);opacity:0}}
    @keyframes lvlFlamePulse{0%,100%{transform:scaleX(1) scaleY(1)}30%{transform:scaleX(.85) scaleY(1.2)}60%{transform:scaleX(1.1) scaleY(.9)}}
    @keyframes lvlEvolveRing{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
    @keyframes lvlTextIn{0%{letter-spacing:8px;opacity:0}100%{letter-spacing:2px;opacity:1}}
  `;

  const pnl=(ex={})=>({background:T.card,border:`1px solid ${T.cardBd}`,borderRadius:9,padding:16,boxShadow:T.cardSh,...ex});
  const ov={position:"fixed",inset:0,background:T.overlay,zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:16};
  const mB=(ex={})=>({background:T.modal,border:`1px solid ${T.modalBd}`,borderRadius:12,padding:26,width:"100%",maxHeight:"90vh",overflowY:"auto",boxShadow:"0 20px 50px rgba(0,0,0,.3)",animation:"fadeIn .25s ease",...ex});
  const FL=({ch})=>(<div style={{fontFamily:"Cinzel,serif",fontSize:11,color:T.text2,letterSpacing:1,textTransform:"uppercase",marginBottom:7,fontFeatureSettings:'"ss01","calt" 0,"liga" 0'}}>{ch}</div>);
  const Qbtn=({onClick})=>(<span onClick={e=>{e.stopPropagation();onClick();}} style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:18,height:18,borderRadius:"50%",background:`${T.gold}22`,border:`1px solid ${T.gold}55`,color:T.gold,fontSize:11,fontWeight:700,cursor:"pointer",marginLeft:7,verticalAlign:"middle",userSelect:"none",fontFamily:"Arial,sans-serif",flexShrink:0}}>?</span>);

  // Body info popup
  const BodyPopup=({onClose})=>(
    <div style={{position:"fixed",inset:0,background:T.overlay,zIndex:700,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={onClose}>
      <div style={{...mB({maxWidth:420}),animation:"fadeIn .2s ease"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
          <span style={{fontFamily:"Cinzel,serif",fontSize:14,color:T.gold}}>Tipi di Corporatura</span>
          <button onClick={onClose} style={{background:"none",border:"none",color:T.text2,cursor:"pointer",fontSize:20}}>✕</button>
        </div>
        {BODY_INFO.map(b=>(
          <div key={b.name} style={{...pnl(),marginBottom:10,borderLeft:`3px solid ${b.color}`}}>
            <div style={{fontFamily:"Cinzel,serif",fontSize:13,color:b.color,marginBottom:4}}>{b.icon} {b.name}</div>
            <div style={{fontSize:13,color:T.text2,lineHeight:1.5,marginBottom:3}}>{b.desc}</div>
            <div style={{fontSize:12,color:b.color,fontStyle:"italic"}}>{b.how}</div>
          </div>
        ))}
      </div>
    </div>
  );

  /* ══ TUTORIAL OVERLAY ══════════════════════════════════ */
  /* ══ ONBOARDING ═══════════════════════════════════════ */
  if(!onboarded){
    const prog=((obStep)/8)*100;
    return(<><style>{css}</style>
      {obBodyPopup&&<BodyPopup onClose={()=>setObBodyPopup(false)}/>}
      <div style={{minHeight:"100vh",background:T.bg,backgroundImage:T.bgImg,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
        <div style={{...mB({maxWidth:480,padding:32,textAlign:"center"})}}>
          <div style={{background:T.xpTk,borderRadius:4,height:4,marginBottom:28,overflow:"hidden"}}>
            <div style={{width:`${prog}%`,height:"100%",background:T.xpFill,borderRadius:4,transition:"width .4s"}}/>
          </div>

          {obStep===0&&<>
            <div style={{marginBottom:16,display:"flex",justifyContent:"center"}}>
              <div style={{position:"relative"}}>
                <ProfileCircle name="Life" colorId="violet" size={80}/>
                <div style={{position:"absolute",inset:-4,borderRadius:"50%",border:"2px solid #d4aa5044",animation:"auraRing1 4s linear infinite"}}/>
              </div>
            </div>
            <div style={{fontFamily:"Cinzel Decorative,cursive",fontSize:22,color:T.gold,marginBottom:8}}>Life RPG</div>
            <div style={{fontSize:13,color:T.text2,letterSpacing:3,textTransform:"uppercase",marginBottom:16}}>Non è produttività. È progressione.</div>
            <div style={{fontSize:14,color:T.text2,lineHeight:1.7,marginBottom:28}}>Gamifica la tua vita reale. Costruisci abitudini, guadagna XP, scala i livelli. Configuriamo il tuo personaggio.</div>
            <button className="btn-gold" style={{marginTop:0}} onClick={()=>setObStep(1)}>🚀 Inizia l'avventura</button>
          </>}

          {/* QUIZ STEP 1 — Nome */}
          {obStep===1&&<>
            <div style={{fontFamily:"Cinzel Decorative,cursive",fontSize:15,color:T.gold,marginBottom:6}}>Come vuoi chiamarti?</div>
            <div style={{fontSize:13,color:T.text2,marginBottom:20}}>Sarà il nome del tuo personaggio.</div>
            <input className="inp" value={obName} autoFocus onChange={e=>setObName(e.target.value)} onKeyDown={noEnter} placeholder="Il tuo nome..." maxLength={25} style={{marginBottom:20,fontSize:20,textAlign:"center",letterSpacing:1}}/>
            <button className="btn-gold" style={{marginTop:0,opacity:obName.trim()?1:.35,transition:"opacity .2s"}} onClick={()=>obName.trim()&&setObStep(2)}>Avanti →</button>
          </>}

          {/* QUIZ STEP 2 — Età + Genere via tap */}
          {obStep===2&&<>
            <div style={{fontFamily:"Cinzel Decorative,cursive",fontSize:15,color:T.gold,marginBottom:6}}>Un po' su di te</div>
            <div style={{fontSize:13,color:T.text2,marginBottom:18}}>Opzionale — aiuta a personalizzare l'esperienza.</div>
            <div style={{textAlign:"left",marginBottom:14}}>
              <div style={{fontFamily:"Cinzel,serif",fontSize:11,color:T.text2,letterSpacing:1,marginBottom:8,textTransform:"uppercase"}}>Età</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
                {[["<18","<18"],["18–25","18"],["26–35","26"],["36–45","36"],["46–55","46"],["55+","55"]].map(([lbl,val])=>(
                  <button key={val} onClick={()=>setObAge(val)} className="btn-sm" style={{padding:"10px 0",background:obAge===val?`${T.gold}22`:"transparent",border:`1px solid ${obAge===val?T.gold:T.cardBd}`,color:obAge===val?T.gold:T.text2,fontFamily:"Cinzel,serif",fontSize:12}}>{lbl}</button>
                ))}
              </div>
            </div>
            <div style={{textAlign:"left",marginBottom:20}}>
              <div style={{fontFamily:"Cinzel,serif",fontSize:11,color:T.text2,letterSpacing:1,marginBottom:8,textTransform:"uppercase"}}>Genere</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
                {[["Maschio","Maschio"],["Femmina","Femmina"],["Altro","Non specificato"]].map(([lbl,val])=>(
                  <button key={val} onClick={()=>setObGender(val)} className="btn-sm" style={{padding:"10px 0",background:obGender===val?`${T.gold}22`:"transparent",border:`1px solid ${obGender===val?T.gold:T.cardBd}`,color:obGender===val?T.gold:T.text2,fontFamily:"Cinzel,serif",fontSize:11}}>{lbl}</button>
                ))}
              </div>
            </div>
            <div style={{display:"flex",gap:8}}>
              <button className="btn-sm" onClick={()=>setObStep(1)}>← Indietro</button>
              <button className="btn-gold" style={{flex:1,marginTop:0}} onClick={()=>setObStep(3)}>Avanti →</button>
            </div>
          </>}

          {obStep===3&&<>
            <div style={{fontFamily:"Cinzel,serif",fontSize:16,color:T.gold,marginBottom:6}}>Foto o colore profilo</div>
            <div style={{fontSize:13,color:T.text2,marginBottom:16}}>Scegli un colore o carica la tua foto.</div>
            {/* Preview */}
            <div style={{display:"flex",justifyContent:"center",marginBottom:16}}>
              <ProfileCircle name={obName} colorId={obAvatar} photo={obPhoto} cropX={obPhotoCropX} cropY={obPhotoCropY} size={72}/>
            </div>
            {/* Color picker — only when no photo */}
            {!obPhoto&&<>
              <div style={{fontSize:11,color:T.text2,marginBottom:8,fontFamily:"Cinzel,serif",letterSpacing:1,textTransform:"uppercase"}}>Colore sfondo</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:16}}>
                {PROFILE_COLORS.map(c=>(
                  <div key={c.id} onClick={()=>setObAvatar(c.id)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,cursor:"pointer"}}>
                    <div style={{width:44,height:44,borderRadius:"50%",background:c.bg,border:`2.5px solid ${obAvatar===c.id?T.gold:"transparent"}`,transition:"border .15s",boxShadow:obAvatar===c.id?`0 0 12px #d4aa5066`:undefined}}/>
                    <div style={{fontSize:9,color:obAvatar===c.id?T.gold:T.text3,fontFamily:"Cinzel,serif"}}>{c.label}</div>
                  </div>
                ))}
              </div>
            </>}
            {/* Photo upload */}
            <div style={{background:T.inp,borderRadius:10,border:`1px solid ${T.inpBd}`,padding:"12px 14px",marginBottom:obPhoto?10:16}}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{flex:1}}>
                  <input ref={obPhotoInput} type="file" accept="image/*" style={{display:"none"}} onChange={e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=ev=>{setObPhoto(ev.target.result);setObPhotoCropY(50);setObPhotoCropX(50);};r.readAsDataURL(f);}}/>
                  <button className="btn-sm" style={{width:"100%",marginBottom:obPhoto?6:0}} onClick={()=>obPhotoInput.current?.click()}>📷 {obPhoto?"Cambia foto":"Aggiungi foto"}</button>
                  {obPhoto&&<button className="btn-del" style={{fontSize:11,color:"#ef4444"}} onClick={()=>setObPhoto(null)}>Rimuovi</button>}
                </div>
              </div>
            </div>
            {/* Crop sliders — only visible while photo is loaded and NOT yet saved */}
            {obPhoto&&<>
              <div style={{fontSize:11,color:T.text2,marginBottom:6}}>Posizione verticale</div>
              <input type="range" min={0} max={100} value={obPhotoCropY} onChange={e=>setObPhotoCropY(+e.target.value)} style={{width:"100%",accentColor:T.gold,cursor:"pointer",marginBottom:10}}/>
              <div style={{fontSize:11,color:T.text2,marginBottom:6}}>Posizione orizzontale</div>
              <input type="range" min={0} max={100} value={obPhotoCropX} onChange={e=>setObPhotoCropX(+e.target.value)} style={{width:"100%",accentColor:T.gold,cursor:"pointer",marginBottom:14}}/>
            </>}
            <div style={{display:"flex",gap:8}}>
              <button className="btn-sm" onClick={()=>setObStep(2)}>← Indietro</button>
              <button className="btn-gold" style={{flex:1,marginTop:0}} onClick={()=>setObStep(4)}>Avanti →</button>
            </div>
          </>}

          {obStep===4&&<>
            <div style={{fontFamily:"Cinzel,serif",fontSize:16,color:T.gold,marginBottom:8}}>🏋️ Dati fisici</div>
            <div style={{fontSize:13,color:T.text2,marginBottom:18}}>Opzionali. Ti permettono di tracciare il tuo progresso fisico.</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20,textAlign:"left"}}>
              <div><FL ch="Altezza (cm)"/><input className="inp" type="number" min={100} max={250} value={obHeight} onChange={e=>setObHeight(e.target.value)} onKeyDown={noEnter} placeholder="es. 175"/></div>
              <div>
                <div style={{display:"flex",alignItems:"center",marginBottom:7}}>
                  <span style={{fontFamily:"Cinzel,serif",fontSize:11,color:T.text2,letterSpacing:1,textTransform:"uppercase",fontFeatureSettings:'"ss01","calt" 0,"liga" 0'}}>Corporatura</span>
                  <Qbtn onClick={()=>setObBodyPopup(true)}/>
                </div>
                <select className="inp" value={obBody} onChange={e=>setObBody(e.target.value)}>
                  <option value="">Seleziona</option>
                  {BODY_INFO.map(b=><option key={b.name} value={b.name}>{b.icon} {b.name}</option>)}
                </select>
              </div>
            </div>
            <div style={{display:"flex",gap:8}}>
              <button className="btn-sm" onClick={()=>setObStep(3)}>← Indietro</button>
              <button className="btn-gold" style={{flex:1,marginTop:0}} onClick={()=>setObStep(5)}>Avanti →</button>
            </div>
          </>}

          {obStep===5&&<>
            <div style={{fontFamily:"Cinzel,serif",fontSize:16,color:T.gold,marginBottom:8}}>🎯 Le tue prime quest</div>
            <div style={{fontSize:13,color:T.text2,marginBottom:16}}>Appena entri troverai queste 3 quest starter. Semplici. Fatte per iniziare subito.</div>
            <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:20,textAlign:"left"}}>
              {TUT_QUESTS.map(q=>{const cat=getCat(q.catId);return(
                <div key={q.id} style={{...pnl(),display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderLeft:`3px solid ${cat.color}`}}>
                  <span style={{fontSize:24}}>{q.icon}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:14,fontWeight:600,color:T.text}}>{q.name}</div>
                    <span style={{fontSize:11,padding:"2px 7px",borderRadius:3,background:`${cat.color}20`,color:cat.color}}>{cat.name}</span>
                  </div>
                  <span style={{fontFamily:"Cinzel,serif",fontSize:14,color:T.gold,fontWeight:700}}>+{q.xp} XP</span>
                </div>
              );})}
            </div>
            <div style={{display:"flex",gap:8}}>
              <button className="btn-sm" onClick={()=>setObStep(4)}>← Indietro</button>
              <button className="btn-gold" style={{flex:1,marginTop:0}} onClick={()=>setObStep(6)}>Avanti →</button>
            </div>
          </>}

          {obStep===6&&<>
            <div style={{fontFamily:"Cinzel Decorative,cursive",fontSize:15,color:T.gold,marginBottom:14}}>Ultime impostazioni</div>
            {/* Sound toggle */}
            <div style={{...pnl(),display:"flex",alignItems:"center",gap:14,marginBottom:10,cursor:"pointer",border:`1px solid ${soundOn?T.navActBd:T.cardBd}`}} onClick={toggleSound}>
              <div style={{fontSize:24}}>{soundOn?"🔊":"🔇"}</div>
              <div style={{flex:1,textAlign:"left"}}><div style={{fontSize:14,fontWeight:600,color:T.text}}>Sound Effects</div><div style={{fontSize:11,color:T.text2}}>Suono diverso per ogni categoria</div></div>
              <div style={{width:44,height:24,borderRadius:12,background:soundOn?"#22c55e":T.dot0,position:"relative",transition:"background .2s",flexShrink:0}}><div style={{width:18,height:18,borderRadius:"50%",background:"#fff",position:"absolute",top:2,left:soundOn?22:3,transition:"left .2s"}}/></div>
            </div>
            {/* Notification request */}
            <div style={{...pnl(),display:"flex",alignItems:"center",gap:14,marginBottom:20,cursor:"pointer",border:`1px solid ${notifEnabled?"#22c55e":T.cardBd}`}} onClick={async()=>{
              if(!("Notification"in window)){setNotifEnabled(false);return;}
              const perm=await Notification.requestPermission();
              setNotifEnabled(perm==="granted");
            }}>
              <div style={{fontSize:24}}>🔔</div>
              <div style={{flex:1,textAlign:"left"}}>
                <div style={{fontSize:14,fontWeight:600,color:T.text}}>Notifiche</div>
                <div style={{fontSize:11,color:T.text2}}>{notifEnabled?"Attive — ti ricordiamo ogni giorno":"Ricordati di completare le tue quest"}</div>
              </div>
              <div style={{width:44,height:24,borderRadius:12,background:notifEnabled?"#22c55e":T.dot0,position:"relative",transition:"background .2s",flexShrink:0}}><div style={{width:18,height:18,borderRadius:"50%",background:"#fff",position:"absolute",top:2,left:notifEnabled?22:3,transition:"left .2s"}}/></div>
            </div>
            <div style={{display:"flex",gap:8}}>
              <button className="btn-sm" onClick={()=>setObStep(5)}>← Indietro</button>
              <button className="btn-gold" style={{flex:1,marginTop:0}} onClick={finishOb}>⚔️ Inizia l'avventura!</button>
            </div>
          </>}
        </div>
      </div>
    </>);
  }

  /* ══════════════════════════════════════════════════════
     MAIN APP
  ══════════════════════════════════════════════════════ */
  const tutHighlight=isTut?(tutInfo?.allowZone||"none"):"none";
  const tutAllowZone=isTut?tutInfo?.allowZone:null;

  return(<>
    <style>{css}</style>
    {profBodyPopup&&<BodyPopup onClose={()=>setProfBodyPopup(false)}/>}
    {levelUpData&&(
      <LevelUpModal
        fromLevel={levelUpData.fromLevel}
        toLevel={levelUpData.toLevel}
        dominantColor={levelUpData.dominantColor}
        skills={skills}
        onClose={()=>setLevelUpData(null)}
        T={T}
      />
    )}

    {/* ══ TUTORIAL ══
       1. Card on opposite side from target — never covers action zone
       2. SVG arrow positioned precisely at target element
       3. Hard freeze — only allowZone is interactive
    */}
    {isTut&&tutInfo&&(()=>{
      const step=tutInfo;
      const isTop=step.cardPos==="top";
      const isCenter=step.cardPos==="center";
      const hasCta=!!step.cta;
      // If TaskConfirm open and step has bodyPending, show drag hint
      const bodyText=(pending&&step.bodyPending)?step.bodyPending:step.body;

      // Double-chevron SVG arrow, position from step.arrowPos
      const TutArrow=()=>{
        if(!step.arrowPos)return null;
        const {left,right,bottom,top,transform:tr}=step.arrowPos;
        return(
          <div style={{
            position:"fixed",zIndex:512,pointerEvents:"none",
            display:"flex",flexDirection:"column",alignItems:"center",
            ...(top!==undefined&&{top}),
            ...(bottom!==undefined&&{bottom}),
            ...(left!==undefined&&{left}),
            ...(right!==undefined&&{right}),
            transform:tr!==undefined?tr:"translateX(-50%)",
          }}>
            {[0,1].map(i=>(
              <svg key={i} width={30} height={17} viewBox="0 0 30 17" fill="none"
                style={{
                  marginTop:i===0?0:-9,
                  opacity:i===0?1:0.5,
                  animation:`tutBounce ${.55+i*.1}s ease-in-out ${i*.07}s infinite`,
                  filter:"drop-shadow(0 0 8px #d4aa50bb)",
                }}>
                <polyline points="4,3 15,13 26,3" stroke="#d4aa50" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              </svg>
            ))}
          </div>
        );
      };

      return(
        <>
          {/* Hard freeze */}
          <div style={{position:"fixed",inset:0,zIndex:500,pointerEvents:"all",touchAction:"none",userSelect:"none",overscrollBehavior:"none"}}
            onClick={e=>e.stopPropagation()}
            onTouchStart={e=>{e.stopPropagation();e.preventDefault();}}
            onTouchMove={e=>{e.stopPropagation();e.preventDefault();}}
            onMouseDown={e=>e.stopPropagation()}
            onWheel={e=>{e.stopPropagation();e.preventDefault();}}
          />
          {/* Overlay */}
          <div style={{position:"fixed",inset:0,zIndex:499,background:"rgba(0,0,0,.58)",pointerEvents:"none"}}/>
          {/* Arrow */}
          <TutArrow/>
          {/* Card */}
          <div style={{position:"fixed",zIndex:511,left:0,right:0,
            ...(isCenter
              ?{top:"50%",transform:"translateY(-50%)",padding:"0 14px"}
              :isTop?{top:68,padding:"0 14px"}:{bottom:70,padding:"0 14px"}),
            display:"flex",justifyContent:"center",pointerEvents:"all"}}>
            <div style={{background:"#0f0d1a",border:"1.5px solid #d4aa50",borderRadius:14,padding:"14px 16px",maxWidth:400,width:"100%",boxShadow:`0 0 40px rgba(212,170,80,.12),0 ${isTop?8:-8}px 32px rgba(0,0,0,.9)`,animation:"popIn .3s ease"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                <div style={{fontFamily:"Cinzel,serif",fontSize:14,fontWeight:700,color:"#fde68a",lineHeight:1.3,flex:1,paddingRight:8}}>{step.title}</div>
                <span style={{fontSize:9,color:"#504840",letterSpacing:1,whiteSpace:"nowrap",paddingTop:2}}>{tutStep+1}/{TUT_STEPS.length}</span>
              </div>
              <div style={{fontSize:12,color:"#b09878",lineHeight:1.65,marginBottom:12}}>{bodyText}</div>
              <div style={{display:"flex",gap:3,marginBottom:hasCta?10:8}}>
                {TUT_STEPS.map((_,i)=><div key={i} style={{flex:i===tutStep?2:1,height:2,borderRadius:1,background:i===tutStep?"#d4aa50":i<tutStep?"#3a3028":"#1a1630",transition:"all .3s"}}/>)}
              </div>
              {hasCta
                ?<button onClick={advanceTut} style={{width:"100%",padding:"10px 0",background:"linear-gradient(135deg,rgba(212,170,80,.2),rgba(212,170,80,.05))",border:"1px solid #d4aa50",borderRadius:8,color:"#fde68a",fontFamily:"Cinzel,serif",fontSize:12,letterSpacing:1,cursor:"pointer"}}>{step.cta}</button>
                :!pending&&<div style={{textAlign:"center",fontSize:10,color:"#d4aa5066",letterSpacing:1,fontFamily:"Cinzel,serif"}}>↓ TOCCA L'ELEMENTO</div>
              }
            </div>
          </div>
        </>
      );
    })()}

    {/* FLAME INTRO — slides up from bottom on app open */}
    {flameIntro&&(()=>{
      const fc=getFlameColors(streak.days);
      const sz=56;
      const id="fi_intro";
      const tongues=[
        {l:"44%",w:11,h:sz*.75,del:"0s",  dur:"1.3s"},
        {l:"34%",w:8, h:sz*.55,del:".3s", dur:"1.0s"},
        {l:"56%",w:9, h:sz*.6, del:".5s", dur:"1.5s"},
        {l:"26%",w:7, h:sz*.38,del:".15s",dur:"1.2s"},
        {l:"66%",w:7, h:sz*.42,del:".7s", dur:"1.1s"},
      ];
      return(
        <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:350,display:"flex",flexDirection:"column",alignItems:"center",paddingBottom:12,pointerEvents:"none",animation:"flameIntroUp 3.4s cubic-bezier(.34,1.2,.64,1) forwards"}}>
          <div style={{background:`linear-gradient(to top,${fc.c3}28,transparent)`,border:`1px solid ${fc.c1}33`,borderRadius:"20px 20px 0 0",padding:"14px 36px 10px",textAlign:"center",boxShadow:`0 -10px 50px ${fc.glow}`}}>
            {/* Real animated flame */}
            <div style={{position:"relative",width:sz+32,height:sz+sz*.8,display:"flex",alignItems:"flex-end",justifyContent:"center",paddingBottom:4,margin:"0 auto"}}>
              <div style={{position:"absolute",bottom:0,left:"50%",transform:"translateX(-50%)",width:sz*.75,height:8,borderRadius:"50%",background:`radial-gradient(ellipse,${fc.glow} 0%,transparent 70%)`,animation:"flameShadow 1.8s ease-in-out infinite"}}/>
              {tongues.map((f,i)=>(
                <div key={i} style={{position:"absolute",bottom:`${sz*.5}px`,left:f.l,width:f.w,height:f.h,borderRadius:"50% 50% 30% 30%",background:`linear-gradient(to top,${fc.c2}ee,${fc.c1}77,transparent)`,transform:"translateX(-50%)",animation:`flameTongue ${f.dur} ease-in-out ${f.del} infinite`,filter:`blur(${f.w*.28}px)`,transformOrigin:"bottom center",opacity:.85}}/>
              ))}
              <svg width={sz} height={sz} viewBox="0 0 100 100" style={{position:"relative",zIndex:2,animation:"flameBody 1.6s ease-in-out infinite",filter:`drop-shadow(0 0 ${sz*.28}px ${fc.c1}) drop-shadow(0 0 ${sz*.14}px ${fc.c2}) drop-shadow(0 0 ${sz*.5}px ${fc.glow})`}}>
                <defs>
                  <radialGradient id={`fi${id}`} cx="38%" cy="42%" r="62%">
                    <stop offset="0%" stopColor="white" stopOpacity=".9"/>
                    <stop offset="22%" stopColor={fc.c1} stopOpacity=".98"/>
                    <stop offset="58%" stopColor={fc.c2} stopOpacity=".90"/>
                    <stop offset="100%" stopColor={fc.c3} stopOpacity=".75"/>
                  </radialGradient>
                </defs>
                <ellipse cx="50" cy="52" rx="44" ry="45" fill={`url(#fi${id})`}/>
                <ellipse cx="37" cy="34" rx="14" ry="9" fill="white" opacity=".5" transform="rotate(-15,37,34)"/>
                <ellipse cx="40" cy="30" rx="5" ry="3" fill="white" opacity=".8" transform="rotate(-15,40,30)"/>
              </svg>
            </div>
            <div style={{fontFamily:"Cinzel Decorative,cursive",fontSize:20,color:fc.c1,textShadow:`0 0 20px ${fc.c1}`,marginBottom:2}}>{streak.days}</div>
            <div style={{fontFamily:"Cinzel,serif",fontSize:10,color:fc.c2,letterSpacing:2,marginBottom:3}}>{streak.days===1?"GIORNO":"GIORNI"} DI COSTANZA</div>
            <div style={{fontSize:10,color:fc.c1,opacity:.75}}>{streak.days>=30?"LEGGENDARIO":streak.days>=21?"FUOCO SACRO":streak.days>=14?"INTENSO":streak.days>=7?"CRESCENTE":"CONTINUA COSÌ"}</div>
          </div>
        </div>
      );
    })()}

    <div style={{minHeight:"100vh",width:"100%",boxSizing:"border-box",background:T.bg,backgroundImage:T.bgImg,color:T.text,fontFamily:"Rajdhani,sans-serif",paddingBottom:60}}>

      {/* STREAK INTRO — freeze + brief explanation on first streak */}
      {showStreakIntro&&(()=>{
        const fc=getFlameColors(1);
        return(
          <>
            <div style={{position:"fixed",inset:0,zIndex:699,background:"rgba(0,0,0,.80)",pointerEvents:"all",touchAction:"none"}}/>
            <div style={{position:"fixed",inset:0,zIndex:701,display:"flex",alignItems:"center",justifyContent:"center",padding:24,pointerEvents:"all"}}>
              <div style={{background:"#0f0d1a",border:`1.5px solid ${fc.c1}`,borderRadius:18,padding:"28px 24px",maxWidth:340,width:"100%",textAlign:"center",animation:"popIn .4s ease",boxShadow:`0 0 60px ${fc.glow}`}}>
                <div style={{fontFamily:"Cinzel,serif",fontSize:11,color:fc.c2,letterSpacing:3,marginBottom:10}}>LA TUA COSTANZA È INIZIATA</div>
                <StreakFlame streak={{days:1,lastDate:new Date().toDateString()}} T={T} inline={false}/>
                <div style={{fontFamily:"Cinzel Decorative,cursive",fontSize:18,color:fc.c1,marginTop:10,marginBottom:6,textShadow:`0 0 20px ${fc.c1}`}}>Giorno 1</div>
                <div style={{fontSize:13,color:"#b09878",lineHeight:1.6,marginBottom:10}}>Hai completato la tua prima quest oggi. La fiamma si accende.</div>
                <div style={{fontSize:12,color:fc.c1,lineHeight:1.5,padding:"10px 14px",background:`${fc.c1}15`,borderRadius:8,marginBottom:18}}>
                  Ogni giorno che completi almeno una quest la fiamma cresce e guadagni <strong style={{color:fc.c1}}>+0.5% XP bonus</strong> su ogni quest.<br/>Se salti un giorno si spegne e perdi il bonus accumulato.
                </div>
                <button onClick={()=>setShowStreakIntro(false)} style={{width:"100%",padding:"12px 0",background:`linear-gradient(135deg,${fc.c1}33,${fc.c1}11)`,border:`1px solid ${fc.c1}`,borderRadius:10,color:fc.c1,fontFamily:"Cinzel,serif",fontSize:13,letterSpacing:1,cursor:"pointer"}}>
                  Continua →
                </button>
              </div>
            </div>
          </>
        );
      })()}

      {floats.map(f=><div key={f.id} style={{position:"fixed",left:`${f.x}%`,top:`${f.y}%`,color:f.color,fontFamily:"Cinzel,serif",fontSize:20,fontWeight:700,pointerEvents:"none",zIndex:999,animation:"floatUp 1.5s ease-out forwards",textShadow:`0 0 12px ${f.color}`}}>{f.txt}</div>)}
      {notif&&<div style={{position:"fixed",top:86,right:20,padding:"12px 20px",borderRadius:8,borderLeft:`4px solid ${notif.color}`,background:T.notif,fontFamily:"Cinzel,serif",fontSize:13,color:notif.color,boxShadow:"0 8px 30px rgba(0,0,0,.2)",zIndex:998,animation:"slideIn .3s ease",maxWidth:340}}>{notif.msg}</div>}

      {pending&&<div style={{position:"fixed",inset:0,zIndex:isTut?503:600}}><TaskConfirm task={pending.task} cat={getCat(pending.task.catId)} skill={pending.task.skillId?getSk(pending.task.skillId):null} onConfirm={confirmTask} onCancel={()=>setPending(null)} T={T}/></div>}

      {/* Hist delete drag confirm */}
      {histPending&&(
        <div style={{position:"fixed",inset:0,background:T.overlay,zIndex:600,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={e=>{if(e.target===e.currentTarget)setHistPending(null);}}>
          <div style={{background:T.modal,border:`2px solid #ef444480`,borderRadius:16,padding:32,width:"100%",maxWidth:320,textAlign:"center",boxShadow:"0 0 40px #ef444422",animation:"fadeIn .2s ease"}}>
            <div style={{fontSize:36,marginBottom:10}}>⚠️</div>
            <div style={{fontFamily:"Cinzel,serif",fontSize:15,color:"#ef4444",marginBottom:4}}>{histPending.name}</div>
            <div style={{fontSize:13,color:T.text2,marginBottom:20}}>Rimuovere questa voce toglierà <strong style={{color:"#ef4444"}}>−{histPending.xp} XP</strong> dal totale.</div>
            <DragSlider label="" accent="#ef4444" confirmLabel="Rimuovi" onConfirm={confirmHistDelete} onCancel={()=>setHistPending(null)} T={T}/>
            <div style={{fontSize:11,color:T.text3,marginTop:12,cursor:"pointer"}} onClick={()=>setHistPending(null)}>Annulla</div>
          </div>
        </div>
      )}

      {/* Skill delete confirm */}
      {skillPending&&(
        <div style={{position:"fixed",inset:0,background:T.overlay,zIndex:600,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={e=>{if(e.target===e.currentTarget)setSkillPending(null);}}>
          <div style={{background:T.modal,border:`2px solid #ef444480`,borderRadius:16,padding:32,width:"100%",maxWidth:320,textAlign:"center",animation:"fadeIn .2s ease"}}>
            <div style={{fontSize:40,marginBottom:8}}>{skillPending.icon}</div>
            <div style={{fontFamily:"Cinzel,serif",fontSize:16,color:"#ef4444",marginBottom:4}}>Elimina {skillPending.name}?</div>
            <div style={{fontSize:13,color:T.text2,marginBottom:20}}>Perderai tutto l'XP accumulato in questa skill. L'azione è irreversibile.</div>
            <DragSlider label="" accent="#ef4444" onConfirm={()=>{setSkills(p=>p.filter(s=>s.id!==skillPending.id));setSkillPending(null);}} onCancel={()=>setSkillPending(null)} T={T}/>
          </div>
        </div>
      )}

      {/* SETTINGS MODAL */}
      {showSettings&&(
        <div style={{position:"fixed",inset:0,background:T.overlay,zIndex:600,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={e=>{if(e.target===e.currentTarget)setShowSettings(false);}}>
          <div style={{...mB({maxWidth:380})}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <span style={{fontFamily:"Cinzel,serif",fontSize:14,color:T.gold,letterSpacing:1}}>⚙ IMPOSTAZIONI</span>
              <button onClick={()=>setShowSettings(false)} style={{background:"none",border:"none",color:T.text2,cursor:"pointer",fontSize:20}}>✕</button>
            </div>
            <div style={{marginBottom:18}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <span style={{fontFamily:"Cinzel,serif",fontSize:11,color:T.text2,letterSpacing:1}}>🎵 MUSICA</span>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:11,color:T.text3}}>{musicVol}%</span>
                  <div onClick={toggleMusic} style={{width:38,height:20,borderRadius:10,background:musicOn?"#22c55e":T.dot0,position:"relative",cursor:"pointer",transition:"background .2s",flexShrink:0}}>
                    <div style={{width:14,height:14,borderRadius:"50%",background:"#fff",position:"absolute",top:3,left:musicOn?21:3,transition:"left .2s"}}/>
                  </div>
                </div>
              </div>
              <input type="range" min={0} max={100} value={musicVol} onChange={e=>{const v=+e.target.value;setMusicVol(v);sv("lrpg_mvol",v);if(!musicOn&&v>0)toggleMusic();}} style={{width:"100%",accentColor:T.gold,cursor:"pointer"}}/>
            </div>
            <div style={{marginBottom:22}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <span style={{fontFamily:"Cinzel,serif",fontSize:11,color:T.text2,letterSpacing:1}}>🔊 SOUND FX</span>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:11,color:T.text3}}>{soundVol}%</span>
                  <div onClick={toggleSound} style={{width:38,height:20,borderRadius:10,background:soundOn?"#22c55e":T.dot0,position:"relative",cursor:"pointer",transition:"background .2s",flexShrink:0}}>
                    <div style={{width:14,height:14,borderRadius:"50%",background:"#fff",position:"absolute",top:3,left:soundOn?21:3,transition:"left .2s"}}/>
                  </div>
                </div>
              </div>
              <input type="range" min={0} max={100} value={soundVol} onChange={e=>{const v=+e.target.value;setSoundVol(v);sv("lrpg_svol",v);if(!soundOn&&v>0)toggleSound();}} style={{width:"100%",accentColor:T.gold,cursor:"pointer"}}/>
            </div>
            <div style={{height:1,background:T.divider,marginBottom:16}}/>
            <button className="btn-sm" style={{width:"100%",padding:"11px 0",marginBottom:10,fontSize:12}} onClick={()=>{setShowSettings(false);setSection("quests");setTutStep(0);sv("lrpg_tut",false);}}>🗺️ Ripeti Tutorial</button>
            {!resetConfirmShow
              ?<button className="btn-sm" style={{width:"100%",padding:"11px 0",fontSize:12,color:"#ef4444",borderColor:"rgba(239,68,68,.3)"}} onClick={()=>setResetConfirmShow(true)}>⚠️ Resetta Profilo</button>
              :<div style={{background:"rgba(239,68,68,.06)",border:"1px solid rgba(239,68,68,.25)",borderRadius:8,padding:14}}>
                <div style={{fontSize:12,color:"#ef4444",marginBottom:8,textAlign:"center"}}>Scrivi "RESET" per confermare</div>
                <input className="inp" value={resetConfirmText} onChange={e=>setResetConfirmText(e.target.value)} placeholder="RESET" style={{marginBottom:8}}/>
                <div style={{display:"flex",gap:8}}>
                  <button className="btn-sm" style={{flex:1}} onClick={()=>{setResetConfirmShow(false);setResetConfirmText("");}}>Annulla</button>
                  <button style={{flex:1,padding:"8px 0",background:"rgba(239,68,68,.15)",border:"1px solid #ef4444",borderRadius:5,color:"#ef4444",cursor:"pointer",fontSize:12,fontFamily:"Cinzel,serif"}} onClick={()=>{
                    if(resetConfirmText!=="RESET")return;
                    resetAccount();
                  }}>Resetta tutto</button>
                </div>
              </div>}
          </div>
        </div>
      )}

      {/* HEADER — always visible, sticky top */}
      <div style={{background:T.header,borderBottom:`1px solid ${T.headerBd}`,padding:"12px 16px",display:"flex",alignItems:"center",gap:12,position:"sticky",top:0,zIndex:90,boxShadow:T.headerSh}}>
        <div onClick={()=>{if(!isTut)openProfile();}} style={{width:42,height:42,borderRadius:"50%",border:`2px solid ${T.gold}`,flexShrink:0,cursor:"pointer",overflow:"hidden"}}>
          <ProfileCircle name={profile.name} colorId={profile.avatar} photo={profile.photo} cropX={profile.photoCropX||50} cropY={profile.photoCropY||50} size={42}/>
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontFamily:"Cinzel,serif",fontSize:14,fontWeight:700,color:T.gold,lineHeight:1.1}}>{profile.name||"Adventurer"}</div>
          <div style={{fontSize:9,color:T.text3,letterSpacing:2,marginBottom:3}}>• {rank} •</div>
          <div style={{background:T.xpTk,borderRadius:3,height:5,overflow:"hidden",maxWidth:220}}>
            <div style={{height:"100%",width:`${xpPct}%`,background:T.xpFill,backgroundSize:"200% 100%",animation:T.shimmer?"shimmer 2s linear infinite":undefined,borderRadius:3,transition:"width .6s"}}/>
          </div>
          <div style={{fontSize:9,color:T.text3,marginTop:2}}>{xpInLvl}/{lvData.xpRequiredForNext} XP</div>
        </div>
        <div style={{textAlign:"right",flexShrink:0}}>
          <div style={{fontFamily:"Cinzel,serif",fontSize:8,color:T.text3,letterSpacing:1}}>LVL</div>
          <div style={{fontFamily:"Cinzel,serif",fontSize:24,fontWeight:700,color:T.goldBri,lineHeight:1}}>{level}</div>
          <div style={{fontSize:9,color:T.text3}}>⚡{totalXP.toLocaleString()}</div>
        </div>
        <button onClick={()=>setShowSettings(true)} style={{background:"none",border:"none",cursor:"pointer",padding:4,flexShrink:0,opacity:.8}} title="Impostazioni">
          <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#b09070" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
          </svg>
        </button>
      </div>

      {/* MAIN CONTENT — three swipeable sections */}
      <div style={{flex:1,overflowY:"auto",padding:"16px 16px 90px",maxWidth:860,margin:"0 auto",width:"100%",animation:"sectionSlideIn .22s ease"}}>

        {/* ═══ SKILLS (left) ═══ */}
        {section==="skills"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div style={{fontFamily:"Cinzel,serif",fontSize:12,color:T.gold,letterSpacing:2}}>LE TUE SKILL</div>
              {!isTut&&<button className="btn-sm" onClick={()=>openAdd("skill")}>＋ Nuova</button>}
            </div>
            {skills.length===0
              ?<div style={{textAlign:"center",padding:48,color:T.text3,fontFamily:"Cinzel,serif",fontSize:13}}>Nessuna skill. Creane una!</div>
              :<div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10}}>
                {skills.map(sk=>{
                  const weights=sk.catWeights||[{catId:sk.catId,pct:100}];
                  const primaryCat=getCat(weights.reduce((a,b)=>b.pct>a.pct?b:a).catId);
                  const decaying=sk.lastActivity&&daysSince(sk.lastActivity)>3;
                  const xpPct2=Math.round((sk.xp/getSkillXpThreshold(sk.level))*100);
                  return(
                    <div key={sk.id} style={{background:T.card,border:`1px solid ${primaryCat.color}28`,borderRadius:13,padding:"13px 11px",textAlign:"center",position:"relative",overflow:"hidden"}}>
                      <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:primaryCat.color}}/>
                      {decaying&&<div style={{position:"absolute",top:7,right:7}}>
                        <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth={2.5} strokeLinecap="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>
                      </div>}
                      <div style={{fontSize:22,marginBottom:4}}>{sk.icon}</div>
                      <div style={{fontFamily:"Cinzel,serif",fontSize:10,color:primaryCat.color,fontWeight:600,lineHeight:1.3,marginBottom:6}}>{sk.name}</div>
                      <div style={{fontFamily:"Cinzel Decorative,cursive",fontSize:28,color:T.goldBri,lineHeight:1}}>{sk.level}</div>
                      <div style={{fontSize:8,color:T.text3,letterSpacing:1,marginBottom:6}}>LV</div>
                      <div style={{background:T.xpTk,borderRadius:2,height:3,overflow:"hidden",marginBottom:3}}>
                        <div style={{width:`${xpPct2}%`,height:"100%",background:primaryCat.color,borderRadius:2,transition:"width .4s"}}/>
                      </div>
                      <div style={{fontSize:8,color:T.text3,marginBottom:weights.length>1?5:0}}>{xpPct2}%</div>
                      {weights.length>1&&(
                        <div style={{display:"flex",flexWrap:"wrap",gap:2,justifyContent:"center",marginTop:4}}>
                          {weights.filter(w=>w.pct>0).map(w=>{
                            const c2=getCat(w.catId);
                            return(
                              <span key={w.catId} style={{display:"inline-flex",alignItems:"center",gap:2,fontSize:7,padding:"1px 5px",borderRadius:3,background:`${c2.color}20`,color:c2.color}}>
                                <CatIcon id={w.catId} size={8} color={c2.color}/>{w.pct}%
                              </span>
                            );
                          })}
                        </div>
                      )}
                      {!isTut&&<button className="btn-del" onClick={()=>setSkillPending(sk)} style={{position:"absolute",top:4,left:4,fontSize:9,padding:"2px 4px"}}>✕</button>}
                    </div>
                  );
                })}
              </div>}
          </div>
        )}

        {/* ═══ QUESTS (center) ═══ */}
        {section==="quests"&&<>
          {isTut&&tutAllowZone==="questlist"&&(
            <div style={{background:`${T.gold}14`,border:`1px solid ${T.gold}44`,borderRadius:10,padding:"10px 14px",marginBottom:12,animation:"popIn .3s ease",position:"relative",zIndex:502,pointerEvents:"all"}}>
              <div style={{fontSize:11,color:T.gold,letterSpacing:1,marginBottom:2}}>👆 TOCCA UNA QUEST</div>
              <div style={{fontSize:12,color:T.text2}}>Clicca su una quest per completarla.</div>
            </div>
          )}
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:14}}>
            {["daily","weekly","monthly"].map(t=>(
              <div key={t} style={{background:T.card,border:`1px solid ${T.cardBd}`,borderRadius:10,padding:"10px 6px",textAlign:"center"}}>
                <div style={{fontFamily:"Cinzel Decorative,cursive",fontSize:20,color:T.gold,lineHeight:1}}>{tabDone(t)}<span style={{fontSize:12,color:T.text3}}>/{tasks[t].length}</span></div>
                <div style={{fontSize:9,color:T.text2,letterSpacing:1,textTransform:"uppercase",marginTop:2}}>{t==="daily"?"Daily":t==="weekly"?"Weekly":"Monthly"}</div>
              </div>
            ))}
          </div>
          <div style={{display:"flex",gap:5,marginBottom:12,flexWrap:"wrap",alignItems:"center"}}>
            {["daily","weekly","monthly"].map(t=>(
              <button key={t} onClick={()=>setTab(t)} style={{padding:"5px 12px",border:`1px solid ${tab===t?T.gold:T.inpBd}`,background:tab===t?`${T.gold}18`:"transparent",color:tab===t?T.goldBri:T.text2,fontFamily:"Rajdhani,sans-serif",fontWeight:600,fontSize:12,cursor:"pointer",borderRadius:5,transition:"all .2s"}}>
                {t==="daily"?"🌅 Daily":t==="weekly"?"📅 Weekly":"🗓️ Monthly"}
              </button>
            ))}
            <div style={{marginLeft:"auto",display:"flex",gap:5}}>
              <button className="btn-sm" onClick={()=>resetTab(tab)}>♻️</button>
              <button className="btn-sm"
                style={{zIndex:tutAllowZone==="addtask"?502:undefined,position:tutAllowZone==="addtask"?"relative":undefined,pointerEvents:tutAllowZone==="addtask"?"all":undefined,boxShadow:tutAllowZone==="addtask"?"0 0 0 2px #d4aa50,0 0 16px #d4aa5066":undefined}}
                onClick={()=>(!isTut||tutAllowZone==="addtask")?openAdd("task"):undefined}>＋ Quest</button>
            </div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:8,position:"relative",zIndex:tutAllowZone==="questlist"?502:undefined,pointerEvents:tutAllowZone==="questlist"?"all":undefined}}>
            {currTasks.length===0&&<div style={{textAlign:"center",padding:40,color:T.text3,fontFamily:"Cinzel,serif",fontSize:13}}>Nessuna quest. Aggiungine una!</div>}
            {currTasks.map(task=>{
              const cat=getCat(task.catId);const sk=task.skillId?getSk(task.skillId):null;const isNew=task.id===newId;
              return(<QuestCard key={task.id} task={task} cat={cat} sk={sk} isNew={isNew} isTut={isTut} T={T} bonus={streakBonus}
                onComplete={()=>setPending({task,type:tab})}
                onDelete={()=>setTasks(p=>({...p,[tab]:p[tab].filter(t=>t.id!==task.id)}))}/>);
            })}
          </div>
        </>}

        {/* ═══ STATS + AURA (right) ═══ */}
        {section==="stats"&&(()=>{
          const catXP={};CATS.forEach(c=>{catXP[c.id]=skills.filter(s=>s.catId===c.id).reduce((a,s)=>a+s.xp+(s.level-1)*100,0);});
          const sorted=[...CATS].sort((a,b)=>catXP[b.id]-catXP[a.id]);
          const dominant=sorted[0];const second=sorted[1];
          const {imbalance}=computePull(catXP);
          const fc=getFlameColors(streak.days);
          return(
            <div>
              {/* Aura + Streak side by side */}
              <div style={{display:"flex",gap:12,marginBottom:16}}>
                {/* Aura panel */}
                <div style={{flex:1,background:T.card,border:`1px solid ${T.cardBd}`,borderRadius:14,padding:"12px",display:"flex",flexDirection:"column",alignItems:"center"}}>
                  <div style={{fontFamily:"Cinzel,serif",fontSize:9,color:T.gold,letterSpacing:2,marginBottom:8,textTransform:"uppercase"}}>Aura</div>
                  <AuraSphere skills={skills} size={90} T={T} playerLevel={level}/>
                  <div style={{marginTop:8,textAlign:"center"}}>
                    {imbalance<0.08
                      ?<div style={{fontSize:10,color:T.gold,fontFamily:"Cinzel,serif"}}>✦ Bilanciata</div>
                      :<div style={{fontSize:10,color:T.text2}}><span style={{color:dominant.color,fontWeight:600}}>{dominant.name}</span></div>}
                    <div style={{fontSize:9,color:T.text3,marginTop:2}}>Deform {Math.round(imbalance*100)}%</div>
                  </div>
                </div>
                {/* Streak panel */}
                <div style={{width:110,background:T.card,border:`1px solid ${streak.days>0?fc.c1+"44":T.cardBd}`,borderRadius:14,padding:"12px 8px",display:"flex",flexDirection:"column",alignItems:"center",boxShadow:streak.days>0?`0 0 16px ${fc.glow}22`:undefined}}>
                  <div style={{fontFamily:"Cinzel,serif",fontSize:9,color:streak.days>0?fc.c2:T.text3,letterSpacing:2,marginBottom:6,textTransform:"uppercase"}}>Streak</div>
                  <StreakFlame streak={streak} T={T} inline={false}/>
                  <div style={{fontFamily:"Cinzel Decorative,cursive",fontSize:22,color:streak.days>0?fc.c1:T.text3,lineHeight:1,marginTop:4}}>{streak.days}</div>
                  <div style={{fontSize:8,color:T.text3,letterSpacing:1,marginBottom:4}}>{streak.days===1?"giorno":"giorni"}</div>
                  <div style={{fontSize:10,color:streakBonus>0?"#fb923c":T.text3,fontWeight:700}}>+{streakBonus.toFixed(1)}%</div>
                  <div style={{fontSize:8,color:T.text3,textAlign:"center",lineHeight:1.3,marginTop:1,marginBottom:10}}>bonus XP</div>
                  {/* Storico button — inside streak panel */}
                  <button onClick={()=>{setHistCat(null);setModal("history");}} style={{width:"100%",padding:"7px 4px",background:`${T.gold}10`,border:`1px solid ${T.gold}33`,borderRadius:7,color:T.gold,fontFamily:"Cinzel,serif",fontSize:8,letterSpacing:1,cursor:"pointer",textAlign:"center"}}>
                    📜 Storico
                  </button>
                </div>
              </div>

              {/* XP/Level/Quest summary */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:16}}>
                {[[level,"👑","Livello"],[totalXP.toLocaleString(),"⚡","XP"],[doneN,"✅","Quest"]].map(([v,ic,l])=>(
                  <div key={l} style={{background:T.card,border:`1px solid ${T.cardBd}`,borderRadius:12,padding:"10px 8px",textAlign:"center"}}>
                    <div style={{fontSize:16,marginBottom:3}}>{ic}</div>
                    <div style={{fontFamily:"Cinzel Decorative,cursive",fontSize:20,color:T.gold,lineHeight:1}}>{v}</div>
                    <div style={{fontSize:9,color:T.text2,letterSpacing:1,marginTop:2,textTransform:"uppercase"}}>{l}</div>
                  </div>
                ))}
              </div>

              {/* Category grid */}
              <div style={{fontSize:10,color:T.text2,letterSpacing:2,marginBottom:10,fontFamily:"Cinzel,serif",textTransform:"uppercase"}}>Per Categoria</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(145px,1fr))",gap:9,marginBottom:20}}>
                {CATS.map(cat=>{
                  const cs=skills.filter(s=>s.catId===cat.id);const ch=history.filter(h=>h.catId===cat.id);
                  const avg=cs.length?(cs.reduce((a,s)=>a+s.level,0)/cs.length):0;
                  const decaying=cs.some(s=>s.lastActivity&&daysSince(s.lastActivity)>3);
                  return(
                    <div key={cat.id} className="h-card" onClick={()=>{setStatCat(cat.id);setModal("statinfo");}} style={{background:T.card,border:`1px solid ${cat.color}28`,borderRadius:12,padding:"14px 10px",textAlign:"center",position:"relative",overflow:"hidden"}}>
                      <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:cat.color}}/>
                      {decaying&&<div style={{position:"absolute",top:6,right:6,fontSize:9,color:"#ef4444"}}>📉</div>}
                      <div style={{marginBottom:6,display:"flex",justifyContent:"center"}}><CatIcon id={cat.id} size={22} color={cat.color}/></div>
                      <div style={{fontFamily:"Cinzel,serif",fontSize:9,color:cat.color,letterSpacing:1,marginBottom:5}}>{cat.name}</div>
                      <div style={{fontFamily:"Cinzel Decorative,cursive",fontSize:24,color:T.goldBri,lineHeight:1,marginBottom:2}}>{avg>0?avg.toFixed(1):"—"}</div>
                      <div style={{fontSize:8,color:T.text3,letterSpacing:1}}>LV MEDIO</div>
                      <div style={{marginTop:4,fontSize:8,color:T.text3}}>{cs.length} skill · {ch.length} quest</div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

      </div>

      {/* BOTTOM NAV — Clash Royale style, 3 sections */}
      <div style={{
        position:"fixed",bottom:0,left:0,right:0,
        zIndex:(isTut&&tutAllowZone?.startsWith("nav_"))?502:90,
        background:"linear-gradient(180deg,#0c0a1a 0%,#080810 100%)",
        borderTop:"1px solid rgba(212,170,80,.18)",
        display:"flex",alignItems:"stretch",
        paddingBottom:"env(safe-area-inset-bottom,0px)",
        boxShadow:"0 -4px 20px rgba(0,0,0,.5)",
      }}>
        {[
          {id:"skills",label:"Skill",
           svg:<><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></>,
           color:"#a855f7"},
          {id:"quests",label:"Quest",
           svg:<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>,
           color:"#d4aa50"},
          {id:"stats",label:"Stats",
           svg:<><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></>,
           color:"#3b82f6"},
        ].map(({id,label,svg,color})=>{
          const active=section===id;
          const isAllowed=isTut&&tutAllowZone===`nav_${id}`;
          const iconColor=active?color:isAllowed?"#d4aa50":"#3a3050";
          return(
            <button key={id} className="bottom-nav-btn"
              style={{zIndex:isAllowed?503:undefined,position:isAllowed?"relative":undefined,pointerEvents:isAllowed?"all":undefined}}
              onClick={()=>{setSection(id);if(isAllowed)advanceTut();}}>
              <div style={{position:"relative",width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center"}}>
                {isAllowed&&<div style={{position:"absolute",inset:-6,borderRadius:"50%",background:"rgba(212,170,80,.12)",animation:"glowPulse 1.5s ease infinite"}}/>}
                {active&&<div style={{position:"absolute",inset:-4,borderRadius:"50%",background:`${color}18`}}/>}
                <svg width={active?26:22} height={active?26:22} viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth={active?2.2:1.6} strokeLinecap="round" strokeLinejoin="round" style={{filter:active?`drop-shadow(0 0 6px ${color}88)`:undefined,transition:"all .2s"}}>
                  {svg}
                </svg>
              </div>
              <span style={{color:active?color:iconColor,fontWeight:active?700:400,fontSize:active?10:9,letterSpacing:.5}}>{label}</span>
              {active&&<div style={{width:20,height:2,borderRadius:1,background:color,marginTop:1}}/>}
            </button>
          );
        })}
      </div>
      {modal==="add"&&(
        <div style={{...ov,zIndex:tutAllowZone==="modal"?502:600}} onClick={tutAllowZone==="modal"?undefined:closeModal}>
          <div style={{...mB({maxWidth:480}),zIndex:tutAllowZone==="modal"?503:undefined,pointerEvents:"all"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <span style={{fontFamily:"Cinzel Decorative,cursive",fontSize:15,color:T.gold}}>{addType==="skill"?"🔮 Nuova Skill":"⚔️ Crea una nuova quest"}</span>
              <button onClick={closeModal} style={{background:"none",border:"none",color:T.text2,cursor:"pointer",fontSize:20,lineHeight:1}}>✕</button>
            </div>
            {addType==="task"&&(
              <div style={{display:"flex",gap:6,marginBottom:18}}>
                {[["preset","✨ Suggeriti"],["custom","✏️ Personalizzata"]].map(([v,l])=>(
                  <button key={v} onClick={()=>setAddTab(v)} style={{flex:1,padding:"8px 0",border:`1px solid ${addTab===v?T.gold:T.inpBd}`,background:addTab===v?`${T.gold}18`:"transparent",color:addTab===v?T.goldBri:T.text2,fontFamily:"Rajdhani,sans-serif",fontWeight:600,fontSize:13,cursor:"pointer",borderRadius:6,transition:"all .2s"}}>{l}</button>
                ))}
              </div>
            )}
            {addType==="task"&&addTab==="preset"&&(
              <div style={{display:"flex",flexDirection:"column",gap:7}}>
                {PRESET.map(p=>{const cat=getCat(p.catId);const already=tasks[p.taskType].some(t=>t.name===p.name);return(
                  <div key={p.name} style={{background:T.rowBg,border:`1px solid ${cat.color}22`,borderRadius:8,padding:"10px 14px",display:"flex",alignItems:"center",gap:12,cursor:already?"default":"pointer",opacity:already?.45:1,transition:"all .2s"}} onClick={()=>!already&&addPreset(p)} onMouseEnter={e=>{if(!already)e.currentTarget.style.borderColor=`${cat.color}55`;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=`${cat.color}22`;}}>
                    <span style={{fontSize:22,flexShrink:0}}>{p.icon}</span>
                    <div style={{flex:1}}><div style={{fontSize:14,fontWeight:600,color:T.text}}>{p.name}</div><div style={{display:"flex",gap:6,marginTop:2}}><span style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:11,padding:"1px 7px",borderRadius:3,background:`${cat.color}20`,color:cat.color}}><CatIcon id={cat.id} size={10} color={cat.color}/>{cat.name}</span><span style={{fontSize:11,color:T.text2}}>{p.desc}</span></div></div>
                    {already?<span style={{fontSize:10,color:T.text3}}>aggiunta</span>:<span style={{fontFamily:"Cinzel,serif",fontSize:13,color:T.gold,fontWeight:700,flexShrink:0}}>+{p.xp}</span>}
                  </div>
                );})}
              </div>
            )}
            {(addType==="skill"||(addType==="task"&&addTab==="custom"))&&<>
              <div style={{marginBottom:14}}><FL ch="Nome"/><input className="inp" value={addName} autoFocus onChange={e=>setAddName(e.target.value)} onKeyDown={noEnter} placeholder={addType==="skill"?"es. Calcio, Yoga, Coding…":"es. Vai in palestra"} maxLength={40}/></div>
              {addType==="skill"&&(()=>{
                // Multi-category skill setup
                const selectedCats=skillCatWeights.map(w=>w.catId);
                // Quiz: 5 domande per stimare le percentuali relative tra le categorie selezionate
                const SKILL_Q=[
                  {q:"Quanto questa skill migliora le capacità fisiche?",cat:"forza"},
                  {q:"Quanto questa skill sviluppa abilità mentali e cognitive?",cat:"mente"},
                  {q:"Quanto questa skill esprime creatività?",cat:"creativita"},
                  {q:"Quanto questa skill migliora la salute e il benessere?",cat:"salute"},
                  {q:"Quanto questa skill sviluppa intelligenza finanziaria?",cat:"finanze"},
                  {q:"Quanto questa skill migliora le relazioni sociali?",cat:"social"},
                  {q:"Quanto questa skill richiede competenze tecniche?",cat:"tecnica"},
                  {q:"Quanto questa skill sviluppa leadership e visione?",cat:"leadership"},
                ];
                const opts=[{l:"Per niente",p:0},{l:"Poco",p:1},{l:"Abbastanza",p:2},{l:"Molto",p:3},{l:"Moltissimo",p:4}];
                if(skillCatStep===0){
                  return(
                    <div style={{marginBottom:14}}>
                      <FL ch="Categorie coinvolte (seleziona una o più)"/>
                      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:6,marginBottom:12}}>
                        {CATS.map(cat=>{
                          const sel=selectedCats.includes(cat.id);
                          return(
                            <div key={cat.id} onClick={()=>{
                              if(sel)setSkillCatWeights(p=>p.filter(w=>w.catId!==cat.id));
                              else setSkillCatWeights(p=>[...p,{catId:cat.id,pct:0}]);
                            }} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:8,border:`1px solid ${sel?cat.color:T.inpBd}`,background:sel?`${cat.color}15`:T.inp,cursor:"pointer",transition:"all .15s"}}>
                              <CatIcon id={cat.id} size={18} color={cat.color}/>
                              <span style={{fontSize:12,color:sel?cat.color:T.text2,fontFamily:"Cinzel,serif"}}>{cat.name}</span>
                              {sel&&<span style={{marginLeft:"auto",color:cat.color,fontSize:14}}>✓</span>}
                            </div>
                          );
                        })}
                      </div>
                      {skillCatWeights.length===0&&<div style={{fontSize:11,color:T.text3,marginBottom:8,textAlign:"center"}}>Seleziona almeno una categoria</div>}
                      {skillCatWeights.length===1&&(
                        <div style={{fontSize:11,color:T.text3,marginBottom:8,textAlign:"center"}}>Una sola categoria = 100% a quella skill</div>
                      )}
                      {skillCatWeights.length>1&&(
                        <button className="btn-sm" style={{width:"100%",padding:"9px 0",marginBottom:4}} onClick={()=>{setSkillCatAns([]);setSkillCatStep(1);}}>
                          🎲 Quiz: calcola le percentuali →
                        </button>
                      )}
                    </div>
                  );
                }
                if(skillCatStep===1){
                  const qIdx=skillCatAns.length;
                  const relevantQs=SKILL_Q.filter(q=>selectedCats.includes(q.cat));
                  if(qIdx>=relevantQs.length){
                    // Calculate percentages from answers
                    const scores={};relevantQs.forEach((q,i)=>{scores[q.cat]=(skillCatAns[i]||0);});
                    const total=Object.values(scores).reduce((a,b)=>a+b,0)||1;
                    const weights=Object.entries(scores).map(([catId,s])=>({catId,pct:Math.round(s/total*100)}));
                    // Fix rounding
                    const sum=weights.reduce((a,w)=>a+w.pct,0);
                    if(weights.length>0)weights[0].pct+=100-sum;
                    setSkillCatWeights(weights.filter(w=>w.pct>0));
                    setSkillCatStep(2);
                    return null;
                  }
                  const q=relevantQs[qIdx];
                  const cat=getCat(q.cat);
                  return(
                    <div style={{background:T.inp,border:`1px solid ${cat.color}44`,borderRadius:10,padding:14,marginBottom:14,animation:"popIn .2s ease"}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                        <span style={{fontSize:10,color:T.text3,letterSpacing:1}}>{qIdx+1}/{relevantQs.length}</span>
                        <div style={{display:"flex",gap:3}}>{relevantQs.map((_,i)=><div key={i} style={{width:14,height:3,borderRadius:2,background:i<qIdx?cat.color:T.dot0,transition:"background .2s"}}/>)}</div>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}><CatIcon id={cat.id} size={13} color={cat.color}/><span style={{fontSize:12,color:cat.color,fontFamily:"Cinzel,serif"}}>{cat.name}</span></div>
                      <div style={{fontSize:13,fontWeight:600,color:T.text,marginBottom:10,lineHeight:1.4}}>{q.q}</div>
                      <div style={{display:"flex",flexDirection:"column",gap:5}}>
                        {opts.map(o=>(
                          <button key={o.l} className="q-opt" onClick={()=>setSkillCatAns(p=>[...p,o.p])}>{o.l}</button>
                        ))}
                      </div>
                      <button className="btn-del" style={{marginTop:8,fontSize:11}} onClick={()=>{if(skillCatAns.length>0)setSkillCatAns(p=>p.slice(0,-1));else setSkillCatStep(0);}}>← Indietro</button>
                    </div>
                  );
                }
                if(skillCatStep===2){
                  return(
                    <div style={{marginBottom:14}}>
                      <FL ch="Distribuzione XP calcolata"/>
                      <div style={{background:T.inp,borderRadius:10,padding:"12px 14px",marginBottom:8}}>
                        {skillCatWeights.map(w=>{const cat=getCat(w.catId);return(
                          <div key={w.catId} style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
                            <CatIcon id={cat.id} size={18} color={cat.color}/>
                            <span style={{flex:1,fontSize:12,color:cat.color,fontFamily:"Cinzel,serif"}}>{cat.name}</span>
                            <div style={{width:80,background:T.xpTk,borderRadius:3,height:6,overflow:"hidden"}}>
                              <div style={{width:`${w.pct}%`,height:"100%",background:cat.color,borderRadius:3}}/>
                            </div>
                            <span style={{fontSize:12,color:cat.color,fontWeight:700,minWidth:32,textAlign:"right"}}>{w.pct}%</span>
                          </div>
                        );})}
                      </div>
                      <button className="btn-del" style={{fontSize:11}} onClick={()=>setSkillCatStep(0)}>↩ Rifai</button>
                    </div>
                  );
                }
              })()}
              {addType!=="skill"&&<div style={{marginBottom:14}}><FL ch="Categoria"/><select className="inp" value={addCatId} onChange={e=>setAddCatId(e.target.value)}>{CATS.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>}
              {addType==="task"&&<>
                <div style={{marginBottom:14}}>
                  <FL ch="Skill da potenziare"/>
                  {catSkills.length===0
                    ?<div style={{background:T.inp,border:`1px solid ${T.inpBd}`,borderRadius:6,padding:"10px 12px",fontSize:12,color:T.text3}}>Nessuna skill in questa categoria. <span onClick={()=>{closeModal();setTimeout(()=>openAdd("skill",{catId:addCatId}),80);}} style={{color:T.gold,cursor:"pointer",textDecoration:"underline"}}>Aggiungine una</span>.</div>
                    :<select className="inp" value={addSkillId} onChange={e=>setAddSkillId(e.target.value)}><option value="none">— Nessuna skill specifica —</option>{catSkills.map(sk=><option key={sk.id} value={sk.id}>{sk.icon} {sk.name} (Lv.{sk.level})</option>)}</select>
                  }
                </div>
                <div style={{marginBottom:14}}><FL ch="Frequenza"/><select className="inp" value={addTaskType} onChange={e=>setAddTaskType(e.target.value)}><option value="daily">🌅 Giornaliera</option><option value="weekly">📅 Settimanale</option><option value="monthly">🗓️ Mensile</option></select></div>
                <div style={{marginBottom:16}}>
                  <FL ch={`Valutazione XP — ${getCat(addCatId).name} · ${addTaskType}`}/>
                  {survStep===0&&<div style={{background:T.inp,border:`1px solid ${T.inpBd}`,borderRadius:8,padding:14}}>
                    <div style={{fontSize:12,color:T.text2,marginBottom:10}}>10 domande per calcolare un XP realistico in base alla categoria e frequenza.</div>
                    <button className="btn-sm" style={{width:"100%",padding:"9px 0"}} onClick={startSurvey}>🎲 Avvia valutazione XP</button>
                  </div>}
                  {survStep>=1&&survStep<=10&&survey[survStep-1]&&(()=>{const q=survey[survStep-1];const cat=getCat(addCatId);return(
                    <div style={{background:T.inp,border:`1px solid ${cat.color}40`,borderRadius:8,padding:14,animation:"popIn .2s ease"}}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                        <span style={{fontSize:11,color:T.text2,letterSpacing:1}}>{survStep}/10</span>
                        <div style={{display:"flex",gap:3}}>{Array.from({length:10},(_,i)=><div key={i} style={{width:16,height:4,borderRadius:2,background:i<survStep?cat.color:T.dot0,transition:"background .2s"}}/>)}</div>
                      </div>
                      <div style={{fontSize:14,fontWeight:600,color:T.text,marginBottom:12,lineHeight:1.4}}>{q.q}</div>
                      <div style={{display:"flex",flexDirection:"column",gap:6}}>{q.opts.map((opt,oi)=><button key={oi} className="q-opt" onClick={()=>answerQ(opt.p)}>{opt.l}</button>)}</div>
                    </div>
                  );})()}
                  {survStep===11&&survXP!==null&&(()=>{const cat=getCat(addCatId);return(
                    <div style={{background:`${cat.color}10`,border:`1px solid ${cat.color}50`,borderRadius:8,padding:16,textAlign:"center",animation:"popIn .2s ease"}}>
                      <div style={{fontSize:12,color:T.text2,marginBottom:4,letterSpacing:1}}>XP CALCOLATO</div>
                      <div style={{fontFamily:"Cinzel Decorative,cursive",fontSize:40,color:cat.color,lineHeight:1}}>{survXP}</div>
                      <div style={{fontSize:11,color:T.text2,marginTop:6}}>{cat.name} × {addTaskType}</div>
                      <button className="btn-sm" style={{marginTop:12,fontSize:11}} onClick={resetSurvey}>↩ Rifai</button>
                    </div>
                  );})()}
                </div>
              </>}
              <div style={{marginBottom:14}}><FL ch={`Emoji: ${addIcon}`}/><div style={{display:"flex",flexWrap:"wrap",gap:5}}>{EMOJIS.map(e=><span key={e} onClick={()=>setAddIcon(e)} style={{fontSize:18,cursor:"pointer",padding:"4px 5px",borderRadius:6,background:addIcon===e?`${T.gold}22`:"transparent",border:addIcon===e?`1px solid ${T.gold}`:"1px solid transparent",transition:"all .12s"}}>{e}</span>)}</div></div>
              <button className="btn-gold" onClick={submitAdd} disabled={addType==="task"&&survStep>0&&survStep<11} style={{opacity:addType==="task"&&survStep>0&&survStep<11?.4:1}}>
                {addType==="task"&&survStep>0&&survStep<11?`Rispondi (${survStep}/10)…`:addType==="skill"?"Aggiungi Skill":`Crea quest${survXP?` · ${survXP} XP`:""}`}
              </button>
            </>}
          </div>
        </div>
      )}

      {/* ══ MODAL STAT INFO ══ */}
      {modal==="statinfo"&&statCat&&(()=>{
        const cat=getCat(statCat);const info=CAT_INFO[statCat];
        const cs=skills.filter(s=>s.catId===statCat);const avg=cs.length?(cs.reduce((a,s)=>a+s.level,0)/cs.length):0;
        return(
          <div style={ov} onClick={closeModal}>
            <div style={{...mB({maxWidth:480,borderLeft:`4px solid ${cat.color}`})}} onClick={e=>e.stopPropagation()}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18}}>
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2}}><CatIcon id={cat.id} size={16} color={cat.color}/><div style={{fontFamily:"Cinzel Decorative,cursive",fontSize:14,color:cat.color}}>{info?.title}</div></div>
                  <div style={{fontSize:11,color:T.text2,marginTop:3}}>Media Lv.{avg.toFixed(1)} · {cs.length} skill</div>
                </div>
                <button onClick={closeModal} style={{background:"none",border:"none",color:T.text2,cursor:"pointer",fontSize:20,lineHeight:1}}>✕</button>
              </div>
              <div style={{textAlign:"center",padding:"14px 0",borderTop:`1px solid ${T.divider}`,borderBottom:`1px solid ${T.divider}`,marginBottom:18}}>
                <div style={{fontFamily:"Cinzel Decorative,cursive",fontSize:48,color:cat.color,lineHeight:1}}>{avg.toFixed(1)}</div>
                <div style={{fontSize:11,color:T.text2,marginTop:4,letterSpacing:2}}>LIVELLO MEDIO</div>
                <div style={{marginTop:8}}><XPBar pct={Math.min(avg*10,100)} color={cat.color} track={T.xpTk} h={8}/></div>
              </div>
              {info&&<>
                <div style={{fontSize:13,color:T.text2,lineHeight:1.6,marginBottom:16}}>{info.desc}</div>
                <FL ch="Come migliorarla"/>
                <div style={{marginBottom:14}}>{info.tips.map((t,i)=><div key={i} style={{display:"flex",gap:10,padding:"6px 0",borderBottom:`1px solid ${T.divider}`,fontSize:13,color:T.text2}}><span style={{color:cat.color,flexShrink:0}}>→</span><span>{t}</span></div>)}</div>
                <div style={{background:`${cat.color}10`,border:`1px solid ${cat.color}25`,borderRadius:8,padding:"10px 14px",marginBottom:10}}>
                  <div style={{fontSize:11,color:cat.color,letterSpacing:1,marginBottom:4}}>⏱️ TEMPI</div>
                  <div style={{fontSize:13,color:T.text2}}>{info.time}</div>
                </div>
                <div style={{background:"rgba(239,68,68,.06)",border:"1px solid rgba(239,68,68,.2)",borderRadius:8,padding:"10px 14px",marginBottom:16}}>
                  <div style={{fontSize:11,color:"#ef4444",letterSpacing:1,marginBottom:6}}>📉 DECADIMENTO</div>
                  <div style={{fontSize:13,color:T.text2,marginBottom:8}}>{info.decay}</div>
                  <div style={{fontSize:12,color:"#ef4444",fontWeight:600,marginBottom:4}}>Meccanica precisa:</div>
                  <div style={{fontSize:12,color:T.text2,lineHeight:1.6}}>
                    • Tolleranza: <span style={{color:"#ef4444"}}>3 giorni</span> senza attività — nessuna penalità{"\n"}
                    • Dal 4° giorno: <span style={{color:"#ef4444"}}>−5% dell'XP del livello</span> per ogni giorno{"\n"}
                    • Il livello non scende mai — solo l'XP accumulato dentro il livello{"\n"}
                    • Il decay riparte a 0 ogni volta che completi una quest
                  </div>
                </div>
              </>}
              {cs.length>0&&<div style={{marginBottom:14}}>
                <FL ch="Le tue skill"/>
                {cs.map(sk=><div key={sk.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:`1px solid ${T.divider}`}}>
                  <span style={{fontSize:20}}>{sk.icon}</span>
                  <span style={{flex:1,fontSize:13,color:T.text}}>{sk.name}</span>
                  <div style={{width:80}}><XPBar pct={(sk.xp/getSkillXpThreshold(sk.level))*100} color={cat.color} track={T.xpTk} h={4}/></div>
                  <span style={{fontFamily:"Cinzel,serif",fontSize:14,color:cat.color,minWidth:30,textAlign:"right"}}>Lv.{sk.level}</span>
                </div>)}
              </div>}
              <div style={{display:"flex",gap:8}}>
                <button className="btn-sm" style={{flex:1}} onClick={()=>{setHistCat(statCat);setModal("history");}}>📜 Storico</button>
                <button className="btn-sm" style={{flex:1}} onClick={()=>openAdd("skill",{catId:statCat})}>＋ Nuova Skill</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ══ MODAL PROFILE ══ */}
      {modal==="profile"&&(
        <div style={ov} onClick={closeModal}>
          <div style={{...mB({maxWidth:520})}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
              <div>
                <div style={{fontFamily:"Cinzel Decorative,cursive",fontSize:15,color:T.gold}}>👤 Questo sei tu nel gioco</div>
                <div style={{fontSize:12,color:T.text2,marginTop:3}}>Ogni azione cambia il tuo personaggio.</div>
              </div>
              <button onClick={closeModal} style={{background:"none",border:"none",color:T.text2,cursor:"pointer",fontSize:20,lineHeight:1}}>✕</button>
            </div>
            <div style={{marginBottom:18}}>
              <FL ch="Foto o colore profilo"/>
              {/* Live preview */}
              <div style={{display:"flex",justifyContent:"center",marginBottom:14}}>
                <ProfileCircle name={profName||profile.name} colorId={profAvatar} photo={profPhoto} cropX={photoCropX} cropY={photoCropY} size={72}/>
              </div>
              {/* Color picker — only when no photo */}
              {!profPhoto&&<>
                <div style={{fontSize:11,color:T.text2,marginBottom:8,fontFamily:"Cinzel,serif",letterSpacing:1,textTransform:"uppercase"}}>Colore sfondo</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:14}}>
                  {PROFILE_COLORS.map(c=>(
                    <div key={c.id} onClick={()=>setProfAvatar(c.id)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,cursor:"pointer"}}>
                      <div style={{width:40,height:40,borderRadius:"50%",background:c.bg,border:`2.5px solid ${profAvatar===c.id?T.gold:"transparent"}`,transition:"border .15s",boxShadow:profAvatar===c.id?`0 0 12px #d4aa5066`:undefined}}/>
                      <div style={{fontSize:9,color:profAvatar===c.id?T.gold:T.text3,fontFamily:"Cinzel,serif"}}>{c.label}</div>
                    </div>
                  ))}
                </div>
              </>}
              {/* Photo upload */}
              <div style={{background:T.inp,borderRadius:8,border:`1px solid ${T.inpBd}`,padding:"10px 12px",marginBottom:profPhoto?10:0}}>
                <input ref={photoInput} type="file" accept="image/*" style={{display:"none"}} onChange={e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=ev=>{setProfPhoto(ev.target.result);setPhotoCropY(50);setPhotoCropX(50);};r.readAsDataURL(f);}}/>
                <div style={{display:"flex",gap:8}}>
                  <button className="btn-sm" style={{flex:1}} onClick={()=>photoInput.current?.click()}>📷 {profPhoto?"Cambia foto":"Aggiungi foto"}</button>
                  {profPhoto&&<button className="btn-del" style={{fontSize:11,color:"#ef4444"}} onClick={()=>setProfPhoto(null)}>Rimuovi</button>}
                </div>
              </div>
              {/* Crop sliders — only shown when photo is loaded, hidden after save */}
              {profPhoto&&<>
                <div style={{fontSize:11,color:T.text2,marginTop:10,marginBottom:5}}>Posizione verticale</div>
                <input type="range" min={0} max={100} value={photoCropY} onChange={e=>setPhotoCropY(+e.target.value)} style={{width:"100%",accentColor:T.gold,cursor:"pointer",marginBottom:8}}/>
                <div style={{fontSize:11,color:T.text2,marginBottom:5}}>Posizione orizzontale</div>
                <input type="range" min={0} max={100} value={photoCropX} onChange={e=>setPhotoCropX(+e.target.value)} style={{width:"100%",accentColor:T.gold,cursor:"pointer",marginBottom:4}}/>
              </>}
            </div>
            <div style={{marginBottom:14}}>
              <FL ch={daysSince(profile.lastNameChange)>=30?"Nome":"Nome (mod. tra "+Math.max(0,30-daysSince(profile.lastNameChange))+" giorni)"}/>
              <input className="inp" value={profName} disabled={daysSince(profile.lastNameChange)<30} onChange={e=>setProfName(e.target.value)} onKeyDown={noEnter} style={{opacity:daysSince(profile.lastNameChange)<30?.5:1}} placeholder="Il tuo nome" maxLength={25}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:4}}>
              <div><FL ch="Età"/><input className="inp" type="number" min={10} max={120} value={profAge} onChange={e=>setProfAge(e.target.value)} onKeyDown={noEnter} placeholder="es. 25"/></div>
              <div><FL ch="Genere"/><select className="inp" value={profGender} onChange={e=>setProfGender(e.target.value)}><option value="">Seleziona</option>{GENDERS.map(g=><option key={g} value={g}>{g}</option>)}</select></div>
              <div><FL ch="Altezza (cm)"/><input className="inp" type="number" min={100} max={250} value={profHeight} onChange={e=>setProfHeight(e.target.value)} onKeyDown={noEnter} placeholder="es. 175"/></div>
              <div>
                <div style={{display:"flex",alignItems:"center",marginBottom:7}}>
                  <span style={{fontFamily:"Cinzel,serif",fontSize:11,color:T.text2,letterSpacing:1,textTransform:"uppercase",fontFeatureSettings:'"ss01","calt" 0,"liga" 0'}}>Corporatura</span>
                  <Qbtn onClick={()=>setProfBodyPopup(true)}/>
                </div>
                <select className="inp" value={profBodyType} onChange={e=>setProfBodyType(e.target.value)}><option value="">Seleziona</option>{BODY_INFO.map(b=><option key={b.name} value={b.name}>{b.icon} {b.name}</option>)}</select>
              </div>
            </div>
            <div style={{marginTop:16,marginBottom:4}}>
              <FL ch={`Peso (kg) — ultimo: ${fmtD(profile.lastWeightUpdate)}`}/>
              <div style={{display:"flex",gap:8}}>
                <input className="inp" type="number" min={20} max={300} step={0.1} value={wInput} onChange={e=>setWInput(e.target.value)} onKeyDown={noEnter} placeholder="es. 75.5" style={{flex:1}}/>
                <button className="btn-sm" onClick={addWeight} style={{flexShrink:0}}>Registra</button>
              </div>
              {profile.weights.length>0&&<div style={{marginTop:8,maxHeight:110,overflowY:"auto",display:"flex",flexDirection:"column",gap:4}}>
                {profile.weights.map((w,i)=>(
                  <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:T.inp,borderRadius:6,padding:"6px 10px"}}>
                    <span style={{fontSize:13,color:T.text}}>⚖️ {w.val} kg</span>
                    <span style={{fontSize:11,color:T.text2}}>{fmtD(w.date)}</span>
                    <button className="btn-del" onClick={()=>removeWeight(i)} style={{fontSize:12,padding:"2px 7px"}}>✕</button>
                  </div>
                ))}
              </div>}
            </div>
            <div style={{marginTop:16,marginBottom:4}}>
              <FL ch="Promemoria peso mensile"/>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <div onClick={()=>setProfReminder(v=>!v)} style={{width:44,height:24,borderRadius:12,background:profReminder?"#22c55e":T.dot0,border:`1px solid ${T.inpBd}`,position:"relative",cursor:"pointer",transition:"background .2s",flexShrink:0}}><div style={{width:18,height:18,borderRadius:"50%",background:"#fff",position:"absolute",top:2,left:profReminder?22:3,transition:"left .2s"}}/></div>
                <span style={{fontSize:13,color:profReminder?"#22c55e":T.text2}}>{profReminder?"Attivo — avviso ogni 30 giorni":"Disattivato"}</span>
              </div>
            </div>
            <button className="btn-gold" onClick={saveProfile} style={{marginTop:18}}>💾 Salva Profilo</button>
          </div>
        </div>
      )}

      {/* ══ MODAL HISTORY ══ */}
      {modal==="history"&&(()=>{
        const cat=histCat?getCat(histCat):null;
        return(
          <div style={ov} onClick={closeModal}>
            <div style={{...mB({maxWidth:580})}} onClick={e=>e.stopPropagation()}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <span style={{fontFamily:"Cinzel Decorative,cursive",fontSize:15,color:T.gold}}>{cat?`📜 ${cat.name}`:"📜 Storico Completo"}</span>
                <button onClick={closeModal} style={{background:"none",border:"none",color:T.text2,cursor:"pointer",fontSize:20,lineHeight:1}}>✕</button>
              </div>
              <div style={{fontSize:12,color:T.text3,marginBottom:14,padding:"8px 12px",background:T.inp,borderRadius:6}}>Trascina ✕ per rimuovere una voce — vengono rimossi anche gli XP guadagnati.</div>
              {!histEntries.length&&<div style={{textAlign:"center",padding:40,color:T.text3,fontFamily:"Cinzel,serif",fontSize:14}}>Nessuna quest completata ancora.</div>}
              <div style={{display:"flex",flexDirection:"column",gap:7}}>
                {histEntries.map(e=>{
                  const c=getCat(e.catId);const sk=e.skillId?getSk(e.skillId):null;
                  return(
                    <div key={e.id} style={{background:T.rowBg,border:`1px solid ${c.color}20`,borderRadius:8,padding:"10px 14px",display:"flex",alignItems:"center",gap:12}}>
                      <span style={{fontSize:20,flexShrink:0}}>{e.icon}</span>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:14,fontWeight:600,color:T.text}}>{e.name}</div>
                        <div style={{display:"flex",gap:7,marginTop:3,flexWrap:"wrap"}}>
                          <span style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:11,padding:"1px 7px",borderRadius:3,background:`${c.color}20`,color:c.color}}><CatIcon id={c.id} size={10} color={c.color}/>{c.name}</span>
                          {sk&&<span style={{fontSize:11,padding:"1px 7px",borderRadius:3,background:`${T.gold}18`,color:T.gold}}>{sk.icon} {sk.name}</span>}
                          <span style={{fontSize:11,color:T.text2}}>{fmtD(e.completedAt)}</span>
                        </div>
                      </div>
                      <span style={{fontFamily:"Cinzel,serif",fontSize:14,color:T.gold,fontWeight:700,flexShrink:0}}>+{e.xp} XP</span>
                      {/* Drag-to-delete button */}
                      <button className="btn-del" onClick={()=>setHistPending(e)} style={{flexShrink:0,fontSize:13}}>✕</button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  </>);
}