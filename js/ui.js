/* Speedcubing Assistant - page chrome: full/compact sizing, theme, print, menu. */

/* ---- layout: both views have the same structure; compact is the same page at smaller sizes,
   used when the two columns don't fit at full size ---- */
let lastW=0;
function layout(){
 const r=document.documentElement,grid=document.getElementById("grid");
 const y=scrollY;r.classList.remove("compact");lastW=innerWidth;
 // widest case header: name + % + Mirror + Reset on one line
 const probe=document.createElement("div");probe.className="row1";
 probe.style.cssText="position:absolute;visibility:hidden;width:max-content;flex-wrap:nowrap";
 probe.innerHTML='<span class="name"></span><span class="prob">67%</span><button type="button" class="mir">Mirror</button><button type="button" class="rst">Reset</button>';
 grid.appendChild(probe);let need=0;
 document.querySelectorAll(".col .case .name").forEach(n=>{probe.firstChild.textContent=n.textContent;need=Math.max(need,probe.offsetWidth)});
 probe.remove();
 const col=(grid.clientWidth-parseFloat(getComputedStyle(grid).columnGap))/2;
 const strip=document.querySelector(".col .strip"),pic=document.querySelector(".col .case:not(.shut) .pic"),gap=6,pad=4+6;
 const room=col-(strip?strip.offsetWidth:40)-(pic?pic.offsetWidth:42)-2*gap-pad; // minus icons, cube, gaps and case padding
 r.classList.toggle("compact",room<need||r.scrollWidth>r.clientWidth);
 document.querySelectorAll(".alg").forEach(fit);
 if(scrollY!==y)scrollTo(0,y)}
// only width decides; ignore height-only resizes (on-screen keyboard, mobile address bar)
window.addEventListener("resize",()=>{if(innerWidth!==lastW)layout()});

/* ---- theme ---- */
const THKEY="twolook-theme";
function applyTheme(){let t="auto";try{t=localStorage.getItem(THKEY)||"auto"}catch(e){}
 const r=document.documentElement;if(t==="auto")r.removeAttribute("data-theme");else r.setAttribute("data-theme",t);
 const b=document.getElementById("theme");if(b)b.textContent="Theme: "+t}

/* ---- text size: root font size in px, this browser only, never in the config or exports ---- */
const TXKEY="twolook-text",TXMIN=12,TXMAX=22,TXDEF=16;
function textPx(){let v=TXDEF;try{v=parseInt(localStorage.getItem(TXKEY))||TXDEF}catch(e){}return Math.min(TXMAX,Math.max(TXMIN,v))}
function applyText(){const v=textPx();
 document.documentElement.style.fontSize=v+"px";   // everything is sized in rem, so this scales all text and the cubes
 document.getElementById("txtVal").textContent=v;
 document.getElementById("txtMinus").disabled=v<=TXMIN;document.getElementById("txtPlus").disabled=v>=TXMAX}
function stepText(d){try{localStorage.setItem(TXKEY,String(textPx()+d))}catch(e){}applyText();layout()}

function initUI(){
 document.getElementById("theme").onclick=()=>{let cur="auto";try{cur=localStorage.getItem(THKEY)||"auto"}catch(e){}
  const next={auto:"light",light:"dark",dark:"auto"}[cur];
  try{localStorage.setItem(THKEY,next)}catch(e){}applyTheme()};
 applyTheme();
 document.getElementById("txtMinus").onclick=()=>stepText(-1);
 document.getElementById("txtPlus").onclick=()=>stepText(1);
 applyText();
 document.getElementById("print").onclick=()=>window.print();
 /* ---- compact menus ---- */
 const mb=document.getElementById("menuBtn"),tl=document.getElementById("tools");
 const close=()=>{tl.classList.remove("open");mb.setAttribute("aria-expanded","false");mb.textContent="Menu ▾"};
 mb.onclick=e=>{e.stopPropagation();const o=tl.classList.toggle("open");
  mb.setAttribute("aria-expanded",o?"true":"false");mb.textContent=o?"Menu ▴":"Menu ▾"};
 document.addEventListener("click",e=>{if(tl.classList.contains("open")&&!tl.contains(e.target)&&e.target!==mb)close()});
 // picking an action closes the menu; Theme and the text size buttons keep it open so you can click again
 tl.addEventListener("click",e=>{const b=e.target.closest("button,label");if(b&&b.id!=="theme"&&!b.closest(".textsize"))close()});
 const hb=document.getElementById("tHist"),lst=document.getElementById("tList");
 hb.onclick=()=>{const o=lst.classList.toggle("open");hb.textContent=o?"Times ▴":"Times ▾"}}
