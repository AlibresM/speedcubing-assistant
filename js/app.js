/* Speedcubing Assistant - boot, import/export, single-file offline copy, PWA. Loaded last. */

// The page's untouched markup, captured before anything renders, so a standalone copy can be rebuilt.
const SKELETON=document.getElementById("app").innerHTML;
const HEADBITS=`<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Speedcubing Assistant</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Barlow+Semi+Condensed:wght@500;600;700&family=Barlow:wght@400;500&display=swap" rel="stylesheet">
`;

// Inline <script id="config"> in a single-file build, config.json otherwise.
async function loadConfig(){const el=document.getElementById("config");
 if(el)return JSON.parse(el.textContent);
 const r=await fetch("config.json");if(!r.ok)throw new Error("HTTP "+r.status);return r.json()}

/* ---- single-file page: the same CSS and scripts this page runs, inlined, plus a config ---- */
async function buildPage(cfg){
 const text=e=>{const url=e.tagName==="LINK"?e.href:e.src;
  return url?fetch(url).then(r=>{if(!r.ok)throw new Error(url);return r.text()}):Promise.resolve(e.textContent)};
 const css=await Promise.all([...document.querySelectorAll("[data-app-css]")].map(text));
 const js=await Promise.all([...document.querySelectorAll("script[data-app]")].map(text));
 return "<!DOCTYPE html>\n<html lang=\"en\"><head>"+HEADBITS+"<style data-app-css>\n"+css.join("\n")+"</style></head><body><div id=\"app\">"+SKELETON+"</div>\n"+
  "<script type=\"application/json\" id=\"config\">"+JSON.stringify(cfg).replace(/</g,"\\u003c")+"<\/script>\n"+
  js.map(s=>"<script data-app>\n"+s.replace(/<\/script/gi,"<\\/script")+"<\/script>\n").join("")+"</body></html>\n"}

async function offerFile(filename,data,mime){
 const dl=window.claude&&window.claude.use?await claude.use("downloads"):null;
 if(dl){try{await dl.save({filename,data})}catch(e){if(e&&e.code!=="declined")setSync("Could not save the file here")}return}
 const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([data],{type:mime}));a.download=filename;document.body.appendChild(a);a.click();
 setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1000)}

function initData(){
 document.getElementById("dlHtml").onclick=async()=>{let html;
  try{html=await buildPage(bakedConfig())}catch(e){setSync("Could not build the offline copy here");return}
  offerFile("speedcubing-assistant.html",html,"text/html")};
 document.getElementById("exJson").onclick=()=>offerFile("2look-algs.json",JSON.stringify({type:"2look-algs",algs:current(),status,shut,pick,open:openPick},null,2),"application/json");
 document.getElementById("imJson").onchange=async e=>{const f=e.target.files[0];e.target.value="";if(!f)return;
  try{const o=JSON.parse(await f.text());const a=o.algs||o;let n=0;
   for(const id in defaults)if(typeof a[id]==="string"){if(a[id].trim()===defaults[id])delete saved[id];else saved[id]=a[id];n++}
   if(o.status&&typeof o.status==="object")status={...o.status};
   if(o.shut&&typeof o.shut==="object")shut={...o.shut};
   if(Array.isArray(o.open))openPick=o.open;
   if(o.pick&&typeof o.pick==="object")pick={...o.pick};
   if(!n&&!o.status)throw 0;persist();loadAll();showSets();layout()}catch(err){setSync("That file has no formulas for this page")}};
 document.getElementById("resetAll").onclick=()=>{saved={};persist();loadAll()}}

/* ---- Claude artifact: owner can save the current formulas into the published page ---- */
async function initBake(){if(!window.claude||!window.claude.use)return;
 const [art,user]=await Promise.all([claude.use("artifact"),claude.use("user")]);
 if(!art||!user||!(await user.canEdit()))return;
 const btn=document.getElementById("bake");btn.hidden=false;
 btn.onclick=async()=>{btn.disabled=true;btn.textContent="Saving…";
  try{const html=await buildPage(bakedConfig());saved={};openPick=null;persist();await art.publish(html)}
  catch(e){btn.disabled=false;btn.textContent="Save edits into the page";
   setSync(e&&e.code==="conflict"?"The page changed meanwhile \u2014 try again":"Could not update the page")}}}

/* ---- PWA (self-hosted only) ---- */
function initPWA(){if(!("serviceWorker"in navigator)||document.getElementById("config"))return;
 window.addEventListener("load",()=>{
  navigator.serviceWorker.register("sw.js").then(reg=>{
   reg.addEventListener("updatefound",()=>{const w=reg.installing;if(!w)return;
    w.addEventListener("statechange",()=>{if(w.state==="installed"&&navigator.serviceWorker.controller)
     setSync("New version ready \u2014 reload to update")})});
  }).catch(()=>{})})}

/* ---- boot ---- */
(async()=>{
 tInit();initUI();initPWA();
 try{CFG=await loadConfig()}
 catch(e){setSync("Could not load config.json. Open the page from a web server (e.g. GitHub Pages) or use the single-file build.");layout();return}
 initStore(CFG);renderSets();renderPickers();loadAll();showSets();initData();
 layout();if(document.fonts)document.fonts.ready.then(layout);
 initCloud();initBake();
})();
