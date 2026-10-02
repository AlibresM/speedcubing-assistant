/* Speedcubing Assistant - algorithm sets from config.json: one column per open set,
   one row per case with its formula, generated diagram and validation message. */
let CFG=null;const defaults={};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[c]);
function renderSets(){
 let all="";
 for(const set of CFG.sets){
  all+=`<section class="col" id="set-${esc(set.id)}" data-set="${esc(set.id)}"><header class="colhead"><h2>${esc(set.title)}</h2><p>${esc(set.sub||"")}</p></header>`;
  for(const g of set.groups){
   all+=`<div class="step" data-step="${esc(set.id)}${g.n}"><h3><span class="stepn">${g.n}</span>${esc(g.label)}<span class="chev">▾</span></h3><ul class="cases">`;
   for(const c of g.cases){defaults[c.id]=c.alg;
    all+=`<li class="case" data-id="${esc(c.id)}" data-mask="${esc(g.mask)}">
    <div class="strip"><button type="button" class="fold" title="Collapse">▾</button><button type="button" class="st"></button><span class="prob" title="How often this case comes up">${esc(c.prob||"")}</span></div>
    <div class="pic"></div><div class="txt">
    <div class="row1"><span class="name">${esc(c.name)}</span><button type="button" class="mir">Mirror</button><button type="button" class="rst">Reset</button></div>
    <textarea class="alg" rows="1" spellcheck="false" autocapitalize="off" autocomplete="off" aria-label="${esc(c.name)} formula"></textarea>
    <div class="msg"></div></div></li>`}
   all+=`</ul></div>`}
  all+=`</section>`}
 document.getElementById("grid").innerHTML=all;
 document.querySelectorAll(".step").forEach(d=>{d.querySelector("h3").onclick=()=>{
  const k=d.dataset.step;if(shut[k])delete shut[k];else shut[k]=1;persist();paintStep(d);d.querySelectorAll(".alg").forEach(fit)}});
 document.querySelectorAll(".case").forEach(li=>{const id=li.dataset.id,mask=li.dataset.mask,ta=li.querySelector(".alg");
  const go=()=>update(li,id,mask);
  li.querySelector(".st").onclick=()=>{const n=CYCLE[(CYCLE.indexOf(status[id]||"")+1)%3];
   if(n)status[id]=n;else delete status[id];persist();paint(li)};
  li.querySelector(".fold").onclick=()=>{if(shut[id])delete shut[id];else shut[id]=1;persist();paint(li);fit(ta)};
  ta.addEventListener("input",()=>{const v=ta.value.trim();if(v===defaults[id])delete saved[id];else saved[id]=ta.value;persist();go()});
  ta.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();ta.blur()}});
  li.querySelector(".rst").onclick=()=>{ta.value=defaults[id];delete saved[id];persist();go()};
  li.querySelector(".mir").onclick=()=>{try{ta.value=mirror(ta.value);ta.dispatchEvent(new Event("input"))}catch(e){go()}}})}
function update(li,id,mask){
 const ta=li.querySelector(".alg"),pic=li.querySelector(".pic"),msg=li.querySelector(".msg");
 fit(ta);
 ta.classList.toggle("changed",ta.value.trim()!==defaults[id]);
 let moves;try{moves=parse(ta.value)}catch(e){msg.textContent=e.message;msg.className="msg err";return}
 let st,auf=0,best=1e9;
 const pll=mask==='corners'||mask==='full';const fix=orientFix(moves);
 for(let k=0;k<(pll?4:1);k++){const t=solved();apply(t,invert(moves.concat(fix,k?[["U",k]]:[])));
  const moved=t.filter(q=>q.p[1]===1&&!eq(q.p,q.h)).length;if(moved<best){best=moved;st=t;auf=k}}
 pic.innerHTML=draw(st,mask);
 const aufTxt=["",", then U",", then U2",", then U'"][auf];
 if(!moves.length){msg.textContent="Empty formula";msg.className="msg warn"}
 else if(mask==="f2l"){const bad=st.filter(q=>!inPair(q)&&q.h[1]<1&&!(eq(q.p,q.h)&&eq(q.n,NORM[q.f])));
  const moved=st.filter(q=>inPair(q)&&!eq(q.p,q.h)).length;
  if(bad.length){msg.textContent="Breaks the other slots or the cross";msg.className="msg warn"}
  else if(!moved){msg.textContent="Does nothing to the pair";msg.className="msg warn"}
  else{msg.textContent="";msg.className="msg"}}
 else if(!checkF2L(st)){msg.textContent="Breaks the first two layers";msg.className="msg warn"}
 else if(isSolvedLL(st)){msg.textContent="Does nothing to the last layer";msg.className="msg warn"}
 else{msg.textContent=aufTxt?"Finish with "+aufTxt.replace(", then ",""):"";msg.className="msg ok"}}
function fit(t){if(!t.offsetParent){t.style.height="";return}t.style.height="auto";t.style.height=t.scrollHeight+"px"}
const CYCLE=["","learning","learned"],ICON={"":"○",learning:"◐",learned:"✓"};
function paint(li){const id=li.dataset.id,st=status[id]||"";
 const b=li.querySelector(".st");b.dataset.s=st;b.textContent=ICON[st];
 b.title=st==="learned"?"Learned":st==="learning"?"Learning":"Not learned yet";
 b.setAttribute("aria-label",b.title);
 li.classList.toggle("learning",st==="learning");li.classList.toggle("learned",st==="learned");
 const open=!shut[id];li.classList.toggle("shut",!open);
 li.querySelector(".fold").textContent=open?"▾":"▸";
 li.querySelector(".fold").title=open?"Collapse":"Expand"}
function paintStep(d){const open=!shut[d.dataset.step];d.classList.toggle("shut",!open);
 d.querySelector(".chev").textContent=open?"▾":"▸"}
function loadAll(){document.querySelectorAll(".case").forEach(li=>{const id=li.dataset.id;li.querySelector(".alg").value=saved[id]??defaults[id];
 paint(li);update(li,id,li.dataset.mask)});
 document.querySelectorAll(".step").forEach(paintStep)}
function current(){const o={};document.querySelectorAll(".case").forEach(li=>{o[li.dataset.id]=li.querySelector(".alg").value.trim()});return o}

/* ---- which sets are open ---- */
const openSets=()=>(openPick||CFG.open||[]).filter(id=>CFG.sets.some(s=>s.id===id));
function renderViews(){const v=document.getElementById("views");
 v.innerHTML=CFG.sets.map(s=>`<label><input type="checkbox" value="${esc(s.id)}"> ${esc(s.title)}</label>`).join("");
 v.onchange=e=>{const id=e.target.value,o=openSets().filter(x=>x!==id);if(e.target.checked)o.push(id);
  openPick=o.join()===(CFG.open||[]).join()?null:o;persist();showSets();layout()}}
function showSets(){if(!CFG)return;const o=openSets();
 document.querySelectorAll(".col").forEach(s=>{const i=o.indexOf(s.dataset.set);s.hidden=i<0;s.style.order=i});
 const n=Math.max(1,o.length),r=document.documentElement.style;
 r.setProperty("--cols",n);r.setProperty("--ccols",Math.min(n,2));
 document.querySelectorAll("#views input").forEach(i=>i.checked=o.includes(i.value));
 document.querySelectorAll(".col:not([hidden]) .alg").forEach(fit)}
// config with the current formulas, marks and view baked in as the new defaults
function bakedConfig(){const cur=current();
 return {...CFG,open:openSets(),status,shut,
  sets:CFG.sets.map(s=>({...s,groups:s.groups.map(g=>({...g,cases:g.cases.map(c=>({...c,alg:cur[c.id]||c.alg}))}))}))}}
