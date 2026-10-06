/* Speedcubing Assistant - algorithm sets from config.json, shown in two columns. Each column's
   header is a dropdown of all sets; every set is rendered once and moved into the column showing it. */
let CFG=null;const defaults={};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[c]);
/* A case has one formula ("alg") or several alternatives ("algs": [{id,label,alg}]), e.g. Ua with M / without M.
   Storage key of each formula: the case id for the first one (so edits from before variants existed survive),
   caseId.variantId for the others. pick[caseId] = id of the variant shown; default is the first. */
const VARS={};   // caseId -> [{vid,label,key}]
const varKey=(c,v,i)=>i?c.id+"."+v.id:c.id;
function activeVar(id){const vs=VARS[id];return vs.find(v=>v.vid===pick[id])||vs[0]}
const activeKey=id=>activeVar(id).key;
const CASE={},NAMES={};   // caseId -> {set,mask}; setId -> {normalised case name: caseId}
const norm=s=>s.toLowerCase().replace(/[^a-z0-9]/g,"");
function renderSets(){
 let all="";
 for(const set of CFG.sets){NAMES[set.id]={};
  for(const g of set.groups)for(const c of g.cases){CASE[c.id]={set:set.id,mask:g.mask};
   NAMES[set.id][norm(c.name)]=c.id;NAMES[set.id][norm(c.name.split(" (")[0])]??=c.id}
  all+=`<div class="setbody" id="set-${esc(set.id)}" data-set="${esc(set.id)}">`;
  for(const g of set.groups){
   all+=`<div class="step" data-step="${esc(set.id)}${g.n}"><h3><span class="stepn">${g.n}</span>${esc(g.label)}<span class="chev">▾</span></h3><ul class="cases">`;
   for(const c of g.cases){
    const vs=c.algs||[{id:"",label:"",alg:c.alg}];
    VARS[c.id]=vs.map((v,i)=>{const key=varKey(c,v,i);defaults[key]=v.alg;return {vid:v.id,label:v.label||v.id,key}});
    all+=`<li class="case" data-id="${esc(c.id)}" data-mask="${esc(g.mask)}">
    <div class="strip"><button type="button" class="fold" title="Collapse">▾</button><button type="button" class="st"></button></div>
    <div class="pic"></div><div class="txt">
    <div class="row1"><span class="name">${esc(c.name)}</span><span class="prob" title="How often this case comes up">${esc(c.prob||"")}</span><button type="button" class="mir">Mirror</button><button type="button" class="rst">Reset</button></div>
    <div class="algline"><textarea class="alg" rows="1" spellcheck="false" autocapitalize="off" autocomplete="off" aria-label="${esc(c.name)} formula"></textarea>${vs.length>1?`<span class="varwrap"><select class="var" aria-label="${esc(c.name)}: choose a formula" title="Other formulas"></select></span>`:""}</div></div></li>`}
   all+=`</ul></div>`}
  all+=`</div>`}
 document.getElementById("stash").innerHTML=all;
 document.querySelectorAll(".step").forEach(d=>{d.querySelector("h3").onclick=()=>{
  const k=d.dataset.step;if(shut[k])delete shut[k];else shut[k]=1;persist();paintStep(d);d.querySelectorAll(".alg").forEach(fit)}});
 document.querySelectorAll(".case").forEach(li=>{const id=li.dataset.id,mask=li.dataset.mask,ta=li.querySelector(".alg");
  const go=()=>{update(li,id,mask);   // formulas that use this case by name follow it
   li.closest(".setbody").querySelectorAll(".case").forEach(o=>{if(o!==li&&ROUTE.test(o.querySelector(".alg").value))update(o,o.dataset.id,o.dataset.mask)})};
  li.querySelector(".st").onclick=()=>{const n=CYCLE[(CYCLE.indexOf(status[id]||"")+1)%3];
   if(n)status[id]=n;else delete status[id];persist();paint(li)};
  li.querySelector(".fold").onclick=()=>{if(shut[id])delete shut[id];else shut[id]=1;persist();paint(li);fit(ta)};
  ta.addEventListener("input",()=>{const k=activeKey(id),v=ta.value.trim();if(v===defaults[k])delete saved[k];else saved[k]=ta.value;persist();fillVar(li);go()});
  ta.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();ta.blur()}});
  li.querySelector(".rst").onclick=()=>{const k=activeKey(id);ta.value=defaults[k];delete saved[k];persist();fillVar(li);go()};
  li.querySelector(".mir").onclick=()=>{try{ta.value=mirror(ta.value);ta.dispatchEvent(new Event("input"))}catch(e){go()}};
  const vs=li.querySelector(".var");
  if(vs)vs.onchange=()=>{if(vs.value===VARS[id][0].vid)delete pick[id];else pick[id]=vs.value;persist();showVar(li);go()}})}
// put the active formula of a case into its textarea, and list all its formulas in the ▾ dropdown
function showVar(li){const v=activeVar(li.dataset.id);
 li.querySelector(".alg").value=saved[v.key]??defaults[v.key];fillVar(li)}
// the dropdown lists the formulas themselves (with edits); the config's names are only tooltips
function fillVar(li){const s=li.querySelector(".var");if(!s)return;const id=li.dataset.id;
 s.innerHTML=VARS[id].map(v=>`<option value="${esc(v.vid)}" title="${esc(v.label)}">${esc((saved[v.key]??defaults[v.key]).trim())}</option>`).join("");
 s.value=activeVar(id).vid}
/* Routes: a formula may use a case name of its own set as a move ("Sune" = that case's formula) and end in
   "-> [Case]": do the moves, and you have that case. The diagram includes solving it, with the U turn in
   between that makes the route start from this case (compared with its first formula). */
const ROUTE=/->|[A-Za-z]{2,}/;
const fullTurn=m=>m.concat(orientFix(m));
function formulaOf(id){const k=activeKey(id),f=saved[k]??defaults[k];if(!f.includes("->"))return f;
 const v=VARS[id].find(v=>!(saved[v.key]??defaults[v.key]).includes("->"));return v?saved[v.key]??defaults[v.key]:f}
function solvedFor(t,mask){
 if(mask==="oll"||mask==="edges")return t.every(s=>s.f!=="U"||eq(s.n,NORM.U)||(mask==="edges"&&isCorner(s.p)));
 if(mask==="f2l"||mask==="f2l-slot")return t.every(s=>s.h[1]===1||(eq(s.p,s.h)&&eq(s.n,NORM[s.f])));
 for(let c=0;c<4;c++){const u=t.map(s=>({...s}));if(c)apply(u,[["U",c]]);
  if(mask==="corners"?checkF2L(u)&&u.every(s=>s.p[1]<1||!isCorner(s.p)||(eq(s.p,s.h)&&eq(s.n,NORM[s.f]))):isSolvedLL(u))return true}
 return false}
// does formula `ref` solve the position that `moves` solves (any U turn first)?
function sameCase(moves,ref,mask){for(let a=0;a<4;a++){const t=solved();apply(t,invert(fullTurn(moves)));
 if(a)apply(t,[["U",a]]);apply(t,fullTurn(ref));if(solvedFor(t,mask))return true}return false}
function expand(id,text,depth=0){
 if(depth>5)throw new Error("Case names refer to each other in a loop");
 const parts=text.split("->");if(parts.length>2)throw new Error("Only one -> per formula");
 const names=NAMES[CASE[id].set],moves=[];
 for(const t of parts[0].replace(/[()\[\]]/g," ").trim().split(/\s+/).filter(Boolean)){
  try{moves.push(...parse(t))}catch(e){const c=names[norm(t)];if(!c)throw e;moves.push(...expand(c,formulaOf(c),depth+1))}}
 if(parts.length<2)return moves;
 const m=parts[1].match(/^\s*\[(.+)\]\s*$/);if(!m)throw new Error("Write the case after -> in [ ]");
 const to=names[norm(m[1])];if(!to)throw new Error("Unknown case: "+m[1].trim());
 const head=fullTurn(moves),tail=expand(to,formulaOf(to),depth+1),mask=CASE[id].mask;
 const own=VARS[id].map(v=>saved[v.key]??defaults[v.key]).find(f=>!f.includes("->"));
 let ref=null;try{if(own)ref=expand(id,own,depth+1)}catch(e){}
 for(let b=0;b<4;b++){const r=head.concat(b?[["U",b]]:[],tail);if(!ref||sameCase(r,ref,mask))return r}
 const r=head.concat(tail);r.off="Doesn't lead to "+m[1].trim()+" from this case";return r}
// No text under the formula: a problem only colours the box (err red, warn orange) and explains itself on hover.
function update(li,id,mask){
 const ta=li.querySelector(".alg"),pic=li.querySelector(".pic");
 const note=(kind,text)=>{ta.classList.toggle("err",kind==="err");ta.classList.toggle("warn",kind==="warn");ta.title=text||""};
 fit(ta);
 ta.classList.toggle("changed",ta.value.trim()!==defaults[activeKey(id)]);
 let moves;try{moves=expand(id,ta.value)}catch(e){note("err",e.message);return}
 let st,best=1e9;
 const pll=mask==='corners'||mask==='full';const fix=orientFix(moves);
 for(let k=0;k<(pll?4:1);k++){const t=solved();apply(t,invert(moves.concat(fix,k?[["U",k]]:[])));
  const moved=t.filter(q=>q.p[1]===1&&!eq(q.p,q.h)).length;if(moved<best){best=moved;st=t}}
 pic.innerHTML=draw(st,mask);
 if(!moves.length)note("warn","Empty formula");
 else if(mask==="f2l"||mask==="f2l-slot"){const bad=st.filter(q=>!inPair(q)&&q.h[1]<1&&!(eq(q.p,q.h)&&eq(q.n,NORM[q.f])));
  const moved=st.filter(q=>inPair(q)&&!(eq(q.p,q.h)&&eq(q.n,NORM[q.f]))).length;   // twisted/flipped in place counts too
  if(bad.length)note("warn","Breaks the other slots or the cross");
  else if(!moved)note("warn","Does nothing to the pair");
  else note()}
 else if(!checkF2L(st))note("warn","Breaks the first two layers");
 else if(isSolvedLL(st))note("warn","Does nothing to the last layer");
 else if(moves.off)note("warn",moves.off);
 else note()}
function fit(t){if(!t.offsetParent){t.style.height="";return}t.style.height="auto";t.style.height=t.scrollHeight+"px"}
const CYCLE=["","learning","learned"];   // drawn by CSS as an empty, half and full circle
function paint(li){const id=li.dataset.id,st=status[id]||"";
 const b=li.querySelector(".st");b.dataset.s=st;
 b.title=st==="learned"?"Learned":st==="learning"?"Learning":"Not learned yet";
 b.setAttribute("aria-label",b.title);
 li.classList.toggle("learning",st==="learning");li.classList.toggle("learned",st==="learned");
 const open=!shut[id];li.classList.toggle("shut",!open);
 li.querySelector(".fold").textContent=open?"▾":"▸";
 li.querySelector(".fold").title=open?"Collapse":"Expand"}
function paintStep(d){const open=!shut[d.dataset.step];d.classList.toggle("shut",!open);
 d.querySelector(".chev").textContent=open?"▾":"▸"}
function loadAll(){document.querySelectorAll(".case").forEach(li=>{const id=li.dataset.id;showVar(li);
 paint(li);update(li,id,li.dataset.mask)});
 document.querySelectorAll(".step").forEach(paintStep)}
// every formula by storage key: the shown one from its textarea, the others from saved/defaults
function current(){const o={};document.querySelectorAll(".case").forEach(li=>{const id=li.dataset.id,a=activeKey(id);
 for(const v of VARS[id])o[v.key]=(v.key===a?li.querySelector(".alg").value:(saved[v.key]??defaults[v.key])).trim()});return o}

/* ---- which set each of the two columns shows ---- */
function openSets(){const ids=CFG.sets.map(s=>s.id),o=[];
 for(const id of (openPick||CFG.open||[]))if(ids.includes(id)&&!o.includes(id)&&o.length<2)o.push(id);
 for(const id of ids)if(o.length<2&&!o.includes(id))o.push(id);   // fill up if the config names fewer than two
 return o}
function renderPickers(){
 document.querySelectorAll(".setpick").forEach((sel,i)=>{
  sel.innerHTML=CFG.sets.map(s=>`<option value="${esc(s.id)}">${esc(s.title)}</option>`).join("");
  sel.onchange=()=>{const o=openSets(),j=1-i;
   if(o[j]===sel.value)o[j]=o[i];   // picking the other column's set swaps the two
   o[i]=sel.value;openPick=o.join()===(CFG.open||[]).join()?null:o;persist();showSets();layout()}})}
function showSets(){if(!CFG)return;const o=openSets(),stash=document.getElementById("stash");
 document.querySelectorAll(".setbody").forEach(b=>stash.appendChild(b));
 document.querySelectorAll(".col").forEach((col,i)=>{const b=document.getElementById("set-"+o[i]);
  col.querySelector(".setpick").value=o[i]||"";if(b)col.querySelector(".colbody").appendChild(b)});
 document.querySelectorAll(".col .alg").forEach(fit)}
// config with the current formulas, marks and columns baked in as the new defaults
function bakedConfig(){const cur=current();
 return {...CFG,open:openSets(),sets:CFG.sets.map(s=>({...s,groups:s.groups.map(g=>{const {shut:_g,cases,...grp}=g;
  return {...grp,...(shut[s.id+g.n]?{shut:true}:{}),cases:cases.map(c=>{const {status:_s,shut:_c,pick:_p,...cs}=c;
   const formulas=c.algs?{algs:c.algs.map((v,i)=>({...v,alg:cur[varKey(c,v,i)]||v.alg}))}:{alg:cur[c.id]||c.alg};
   return {...cs,...formulas,...(pick[c.id]?{pick:pick[c.id]}:{}),...(status[c.id]?{status:status[c.id]}:{}),...(shut[c.id]?{shut:true}:{})}})}})}))}}
