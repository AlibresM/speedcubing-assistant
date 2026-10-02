/* Speedcubing Assistant - timer: scramble, hold-to-start clock, inspection, WCA stats.
   tInit() is called from app.js once the page markup exists. */
const TKEY="twolook-times-v1";let times=[],tShut=false,tInsp=false;
try{const o=JSON.parse(localStorage.getItem(TKEY)||"{}")||{};times=o.times||[];tShut=!!o.shut;tInsp=!!o.insp}catch(e){}
function tSave(){try{localStorage.setItem(TKEY,JSON.stringify({times:times.slice(-300),shut:tShut,insp:tInsp}))}catch(e){}}
const FACES=["U","D","L","R","F","B"],SUF=["","'","2"],AX={U:0,D:0,L:1,R:1,F:2,B:2};
function scramble(n){const out=[];let last=-1,prev=-1;
 while(out.length<(n||20)){const f=FACES[Math.floor(Math.random()*6)],a=AX[f];
  if(a===last||(a===prev&&out.length>1&&f===out[out.length-2][0]))continue;
  prev=last;last=a;out.push(f+SUF[Math.floor(Math.random()*3)])}
 return out.join(" ")}
function fmtT(ms){if(ms==null)return "DNF";const t=Math.floor(ms/10)/100;
 if(t<60)return t.toFixed(2);const m=Math.floor(t/60);return m+":"+(t-m*60).toFixed(2).padStart(5,"0")}
const eff=r=>r.dnf?null:r.ms+(r.plus2?2000:0);
function avg(list,k){if(list.length<k)return "-";const w=list.slice(-k).map(eff);
 if(w.filter(x=>x==null).length>1)return "DNF";
 const vals=w.map(x=>x==null?Infinity:x).slice().sort((a,b)=>a-b);
 const mid=vals.slice(1,vals.length-1);if(mid.some(x=>x===Infinity))return "DNF";
 return fmtT(mid.reduce((a,b)=>a+b,0)/mid.length)}
function best(){const v=times.map(eff).filter(x=>x!=null);return v.length?fmtT(Math.min(...v)):"-"}
function mean(){const v=times.map(eff).filter(x=>x!=null);return v.length?fmtT(v.reduce((a,b)=>a+b,0)/v.length):"-"}
function renderTimes(){
 const st=document.getElementById("tStats");
 st.innerHTML=`<span>solves</span><b>${times.length}</b><span>best</span><b>${best()}</b>`+
  `<span>ao5</span><b>${avg(times,5)}</b><span>ao12</span><b>${avg(times,12)}</b><span>mean</span><b>${mean()}</b>`;
 const ul=document.getElementById("tList");ul.innerHTML="";
 times.slice().reverse().forEach((r,i)=>{const idx=times.length-i;const li=document.createElement("li");
  li.innerHTML=`<span class="n">${idx}.</span><span class="v${r.dnf?" dnf":""}">${r.dnf?"DNF":fmtT(eff(r))+(r.plus2?"+":"")}</span>`+
   `<button type="button" data-a="p2" title="+2">+2</button><button type="button" data-a="dnf" title="DNF">DNF</button><button type="button" data-a="del" title="Delete">&times;</button>`;
  li.querySelectorAll("button").forEach(b=>b.onclick=()=>{const a=b.dataset.a,k=times.length-1-i;
   if(a==="del")times.splice(k,1);else if(a==="p2")times[k].plus2=!times[k].plus2;else times[k].dnf=!times[k].dnf;
   tSave();renderTimes()});
  ul.appendChild(li)})}
let tState="idle",tStart=0,tRaf=0,holdT=0,inspEnd=0,curScr="";
const clock=()=>document.getElementById("tClock");
function setScr(){curScr=scramble(20);const m=curScr.split(" ");let h="";
 for(let i=0;i<m.length;i+=5)h+=`<span class="srow">${m.slice(i,i+5).join(" ")}</span>`;
 document.getElementById("tScr").innerHTML=h}
function show(txt){clock().textContent=txt}
function loop(){if(tState==="run"){show(fmtT(performance.now()-tStart));tRaf=requestAnimationFrame(loop)}
 else if(tState==="insp"){const left=Math.ceil((inspEnd-performance.now())/1000);
  show(left>0?String(left):(left>-2?"+2":"DNF"));tRaf=requestAnimationFrame(loop)}}
function beginHold(){
 if(tState==="run"){stopTimer();return}
 if(tState==="idle"&&tInsp){tState="insp";inspEnd=performance.now()+15000;clock().className="clock";loop();return}
 if(tState==="idle"||tState==="insp"){holdT=performance.now();clock().classList.add("hold");
  if(tState!=="insp")show("0.00");
  setTimeout(()=>{if(holdT&&performance.now()-holdT>=300){clock().classList.remove("hold");clock().classList.add("ready")}},310)}}
function endHold(){
 if(!holdT)return;const long=performance.now()-holdT>=300;holdT=0;
 clock().classList.remove("hold","ready");
 if(!long){if(tState==="insp")return;return}
 let pen=null;
 if(tState==="insp"){const over=(performance.now()-inspEnd)/1000;pen=over>2?"dnf":over>0?"p2":null}
 cancelAnimationFrame(tRaf);tState="run";tStart=performance.now();clock().classList.add("run");
 clock().dataset.pen=pen||"";loop()}
function stopTimer(){cancelAnimationFrame(tRaf);const ms=performance.now()-tStart;tState="idle";
 clock().classList.remove("run");const pen=clock().dataset.pen;clock().dataset.pen="";
 times.push({ms,scr:curScr,plus2:pen==="p2",dnf:pen==="dnf",at:Date.now()});tSave();
 show(fmtT(ms));renderTimes();setScr()}
function tInit(){
 const side=document.getElementById("timer");
 const paintSide=()=>{side.classList.toggle("shut",tShut);
  // g-side: arrow for the sidebar (full view), g-top: arrow for the top bar (compact); CSS shows one
  const b=document.getElementById("tFold");
  b.innerHTML=tShut?'<span class="g-side">\u25b8</span><span class="g-top">\u25be</span>':'<span class="g-side">\u25c2</span><span class="g-top">\u25b4</span>';
  b.title=tShut?"Show full timer":"Shrink timer"};
 document.getElementById("tFold").onclick=()=>{tShut=!tShut;tSave();paintSide();layout()};paintSide();
 const ins=document.getElementById("tInsp");ins.checked=tInsp;
 ins.onchange=()=>{tInsp=ins.checked;tSave();clock().title=tInsp?"Hold space \u2014 release to start inspection":"Hold space (or touch) \u2014 release to start"};
 ins.onchange();
 document.getElementById("tNew").onclick=setScr;
 const cl=document.getElementById("tClear");let armed=0;
 cl.onclick=()=>{if(!times.length)return;
  if(!armed){armed=1;cl.textContent="Delete all times?";setTimeout(()=>{if(armed){armed=0;cl.textContent="Clear session"}},4000);return}
  armed=0;cl.textContent="Clear session";times=[];tSave();renderTimes()};
 const c=clock();
 c.addEventListener("touchstart",e=>{e.preventDefault();beginHold()},{passive:false});
 c.addEventListener("touchend",e=>{e.preventDefault();endHold()},{passive:false});
 c.addEventListener("mousedown",beginHold);c.addEventListener("mouseup",endHold);
 window.addEventListener("keydown",e=>{if(e.code!=="Space"||e.repeat)return;
  const t=e.target;if(t&&(t.tagName==="TEXTAREA"||t.tagName==="INPUT"||t.isContentEditable))return;
  e.preventDefault();beginHold()});
 window.addEventListener("keyup",e=>{if(e.code!=="Space")return;
  const t=e.target;if(t&&(t.tagName==="TEXTAREA"||t.tagName==="INPUT"||t.isContentEditable))return;
  e.preventDefault();endHold()});
 setScr();renderTimes()}
