/* Speedcubing Assistant - user data: edited formulas, marks, collapse state, chosen view.
   Always kept in localStorage; also synced to the Claude account when the page runs as a Claude artifact. */
const KEY="twolook-algs-v1";
// openPick: the two sets the user picked for the columns, or null to follow config.open
// pick: caseId -> id of the formula variant shown (absent = the first)
let saved={},status={},shut={},pick={},openPick=null,savedAt=0;
function initStore(cfg){
 // defaults from the config: "status"/"shut"/"pick" on a case line, "shut" on a group
 status={};shut={};pick={};
 for(const s of cfg.sets)for(const g of s.groups){if(g.shut)shut[s.id+g.n]=1;
  for(const c of g.cases){if(c.status)status[c.id]=c.status;if(c.shut)shut[c.id]=1;if(c.pick)pick[c.id]=c.pick}}
 try{const o=JSON.parse(localStorage.getItem(KEY)||"{}")||{};
  if(o.algs){saved=o.algs;status=o.status||{};shut=o.shut||{};if(o.pick)pick=o.pick;openPick=Array.isArray(o.open)?o.open:null;savedAt=o.at||0}else saved=o}catch(e){}}
const payload=()=>({algs:saved,status,shut,pick,open:openPick,at:savedAt});
let cloud=null,cloudBusy=false,cloudDirty=false,cloudTimer=null;
const syncEl=()=>document.getElementById("sync");
function setSync(t){const e=syncEl();if(e)e.textContent=t}
function persist(){savedAt=Date.now();try{localStorage.setItem(KEY,JSON.stringify(payload()))}catch(e){}
 if(cloud){cloudDirty=true;clearTimeout(cloudTimer);cloudTimer=setTimeout(pushCloud,800)}}
async function pushCloud(){if(!cloud||cloudBusy)return;cloudBusy=true;
 while(cloudDirty){cloudDirty=false;setSync("Saving to your Claude account…");
  try{await cloud.set(payload());setSync("Synced to your Claude account")}
  catch(e){setSync("Saved in this browser only");if(e&&e.code==="invalid_argument"){cloud=null;break}}}
 cloudBusy=false}
async function initCloud(){
 if(!window.claude||!window.claude.use){setSync(document.getElementById("config")?"Offline copy. Edits saved in this browser.":"Saved in this browser only");return}
 try{const [db,user]=await Promise.all([claude.use("db"),claude.use("user")]);
  if(!db||!user){setSync("Saved in this browser only");return}
  const id=await user.id();if(!id){setSync("Saved in this browser only");return}
  const ref=db.doc("data/users/"+id+"/algs");const snap=await ref.get();cloud=ref;
  const d=snap.exists?snap.data():null;
  if(d&&d.algs&&(d.at||0)>=savedAt){saved={...d.algs};status={...(d.status||{})};shut={...(d.shut||{})};
   if(d.pick)pick={...d.pick};openPick=Array.isArray(d.open)?d.open:null;savedAt=d.at||0;
   try{localStorage.setItem(KEY,JSON.stringify(payload()))}catch(e){}
   loadAll();showSets();setSync("Synced to your Claude account")}
  else if(Object.keys(saved).length||Object.keys(status).length||Object.keys(shut).length||openPick){cloudDirty=true;pushCloud()}
  else setSync("Synced to your Claude account")}
 catch(e){setSync("Saved in this browser only")}}
