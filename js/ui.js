/* Speedcubing Assistant - page chrome: full/compact layout choice, theme, print, menus. */

/* ---- layout: full view only if the timer and all open columns fit on screen, else compact ---- */
function layout(){
 const r=document.documentElement,grid=document.getElementById("grid"),side=document.getElementById("timer"),list=document.getElementById("tList");
 const y=scrollY;r.classList.remove("compact");list.style.maxHeight="";
 // widest case header: name + Mirror + Reset on one line
 const probe=document.createElement("div");probe.className="row1";
 probe.style.cssText="position:absolute;visibility:hidden;width:max-content;flex-wrap:nowrap";
 probe.innerHTML='<span class="name"></span><button type="button">Mirror</button><button type="button">Reset</button>';
 grid.appendChild(probe);let need=0;
 document.querySelectorAll(".col:not([hidden]) .case .name").forEach(n=>{probe.firstChild.textContent=n.textContent;need=Math.max(need,probe.offsetWidth)});
 probe.remove();
 const n=Math.max(1,document.querySelectorAll(".col:not([hidden])").length);
 const col=(grid.clientWidth-(n-1)*parseFloat(getComputedStyle(grid).columnGap))/n;
 const room=col-26-74-2*8-4-6; // minus strip, picture, gaps and case padding
 // sticky timer must fit the window height; its times list shrinks to the space left, but needs ~5 rows
 const shut=side.classList.contains("shut"),listRoom=innerHeight-16-(side.offsetHeight-list.offsetHeight);
 const fits=room>=need&&(shut||listRoom>=100)&&r.scrollWidth<=r.clientWidth;
 r.classList.toggle("compact",!fits);
 if(fits&&!shut)list.style.maxHeight=Math.min(210,listRoom)+"px";
 document.querySelectorAll(".alg").forEach(fit);
 if(scrollY!==y)scrollTo(0,y)}
// the on-screen keyboard resizes the window: don't switch layouts mid-edit, re-check afterwards
let layoutLater=false;
window.addEventListener("resize",()=>{const a=document.activeElement;
 if(a&&(a.tagName==="TEXTAREA"||a.tagName==="INPUT"))layoutLater=true;else layout()});
document.addEventListener("focusout",()=>{if(layoutLater){layoutLater=false;setTimeout(layout,300)}});

/* ---- theme ---- */
const THKEY="twolook-theme";
function applyTheme(){let t="auto";try{t=localStorage.getItem(THKEY)||"auto"}catch(e){}
 const r=document.documentElement;if(t==="auto")r.removeAttribute("data-theme");else r.setAttribute("data-theme",t);
 const b=document.getElementById("theme");if(b)b.textContent="Theme: "+t}

function initUI(){
 document.getElementById("theme").onclick=()=>{let cur="auto";try{cur=localStorage.getItem(THKEY)||"auto"}catch(e){}
  const next={auto:"light",light:"dark",dark:"auto"}[cur];
  try{localStorage.setItem(THKEY,next)}catch(e){}applyTheme()};
 applyTheme();
 document.getElementById("print").onclick=()=>window.print();
 /* ---- compact menus ---- */
 const mb=document.getElementById("menuBtn"),tl=document.getElementById("tools");
 const close=()=>{tl.classList.remove("open");mb.setAttribute("aria-expanded","false");mb.textContent="Menu ▾"};
 mb.onclick=e=>{e.stopPropagation();const o=tl.classList.toggle("open");
  mb.setAttribute("aria-expanded",o?"true":"false");mb.textContent=o?"Menu ▴":"Menu ▾"};
 document.addEventListener("click",e=>{if(tl.classList.contains("open")&&!tl.contains(e.target)&&e.target!==mb)close()});
 // picking an action closes the menu; Theme and the View ticks keep it open so you can click again
 tl.addEventListener("click",e=>{const b=e.target.closest("button,label");if(b&&b.id!=="theme"&&!b.closest(".views"))close()});
 const hb=document.getElementById("tHist"),lst=document.getElementById("tList");
 hb.onclick=()=>{const o=lst.classList.toggle("open");hb.textContent=o?"Times ▴":"Times ▾"}}
