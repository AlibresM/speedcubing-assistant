/* Speedcubing Assistant - cube engine and diagrams. Pure functions, no DOM. */

/* ---- cube model: stickers with position + normal ---- */
const COL={U:"#f0cd2a",D:"#f6f4ef",F:"#1f9e5a",B:"#1a55b3",R:"#e8701f",L:"#c0362c"};
const GRAY="#98a0ab";
const NORM={U:[0,1,0],D:[0,-1,0],R:[1,0,0],L:[-1,0,0],F:[0,0,1],B:[0,0,-1]};
function solved(){const s=[];for(const f in NORM){const n=NORM[f];
 for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++){let p;
  if(n[0])p=[n[0],a,b];else if(n[1])p=[a,n[1],b];else p=[a,b,n[2]];
  s.push({p,n:[...n],f,h:[...p]});}}return s}
// rotate vector 90° steps about axis (0=x,1=y,2=z), q quarter-turns (+ = CCW by right-hand rule)
function rot(v,ax,q){q=((q%4)+4)%4;let [x,y,z]=v;
 for(let i=0;i<q;i++){ if(ax===0)[y,z]=[-z,y]; else if(ax===1)[z,x]=[-x,z]; else [x,y]=[-y,x]; }
 return [x,y,z]}
// move table: axis, layer test, base quarter-turns (+1 = CCW about +axis)
const MV={
 R:[0,c=>c===1,-1], L:[0,c=>c===-1,1], M:[0,c=>c===0,1],
 r:[0,c=>c>=0,-1], l:[0,c=>c<=0,1], x:[0,()=>true,-1],
 U:[1,c=>c===1,-1], D:[1,c=>c===-1,1], E:[1,c=>c===0,1],
 u:[1,c=>c>=0,-1], d:[1,c=>c<=0,1], y:[1,()=>true,-1],
 F:[2,c=>c===1,-1], B:[2,c=>c===-1,1], S:[2,c=>c===0,-1],
 f:[2,c=>c>=0,-1], b:[2,c=>c<=0,1], z:[2,()=>true,-1]};
function parse(str){
 const toks=str.replace(/[()\[\]]/g," ").trim().split(/\s+/).filter(Boolean);const out=[];
 for(const t of toks){const m=t.match(/^([RLUDFBMESxyzrludfb])(w?)(2|3)?('?)(2?)$/);
  if(!m)throw new Error("Unknown move: "+t);
  let face=m[1];if(m[2]){if(!"RLUDFB".includes(face))throw new Error("Unknown move: "+t);face=face.toLowerCase();}
  let n=parseInt(m[3]||m[5]||"1");if(m[4])n=-n;out.push([face,n]);}
 return out}
function apply(st,moves){for(const [f,n] of moves){const [ax,test,q]=MV[f];
 for(const s of st)if(test(s.p[ax])){s.p=rot(s.p,ax,q*n);s.n=rot(s.n,ax,q*n);}}}
function orientFix(moves){
 const st=solved();apply(st,moves);
 const A=[[],[[0,1]],[[0,2]],[[0,3]],[[2,1]],[[2,3]]];
 for(const a of A)for(let q=0;q<4;q++){const seq=a.concat(q?[[1,q]]:[]);
  const c=f=>{let p=st.find(s=>s.f===f&&Math.abs(s.p[0])+Math.abs(s.p[1])+Math.abs(s.p[2])===1).p;for(const [ax,k] of seq)p=rot(p,ax,k);return p};
  if(eq(c("U"),[0,1,0])&&eq(c("F"),[0,0,1]))return seq.map(([ax,k])=>["xyz"[ax],-k])}
 return []}
function invert(moves){return moves.slice().reverse().map(([f,n])=>[f,-n])}
function fmt(moves){return moves.map(([f,n])=>{const a=Math.abs(n)%4;
 return f+(a===2?"2":"")+((n<0&&a!==2)?"'":"")}).join(" ")}
function mirror(str){const sw={R:"L",L:"R",r:"l",l:"r"};
 return fmt(parse(str).map(([f,n])=>{if("RLrl".includes(f))return[sw[f],-n];if("Mx".includes(f))return[f,n];return[f,-n]}))}
const eq=(a,b)=>a[0]===b[0]&&a[1]===b[1]&&a[2]===b[2];

/* ---- diagram ---- */
function isCorner(p){return Math.abs(p[0])+Math.abs(p[2])===2}
function isEdge(p){return Math.abs(p[0])+Math.abs(p[2])===1}
// F2L target: the front-left slot (left-hand inserts)
const inPair=s=>(s.h[0]===-1&&s.h[2]===1&&(s.h[1]===-1||s.h[1]===0));
function colour(s,mask){
 const c=COL[s.f];
 if(mask==="f2l")return inPair(s)?c:GRAY;
 if(mask==="oll"||mask==="edges"){ if(mask==="edges"&&isCorner(s.p))return GRAY; return s.f==="U"?c:GRAY; }
 if(mask==="corners"&&isEdge(s.p))return GRAY;
 return c}
function draw(st,mask){
 const T=12,C=25,O=0.5;let out=`<svg viewBox="0 0 100 100" role="img" aria-label="Last layer diagram">`;
 const r=(x,y,w,h,f)=>`<rect x="${x+O}" y="${y+O}" width="${w-1}" height="${h-1}" rx="2" fill="${f}" stroke="#2a2f3a" stroke-width="1"/>`;
 for(const s of st){if(s.p[1]!==1)continue;const [px,,pz]=s.p;const [nx,ny,nz]=s.n;const col=colour(s,mask);
  const cx=T+(px+1)*C, cz=T+(pz+1)*C;
  if(ny===1)out+=r(cx,cz,C,C,col);
  else if(nz===1)out+=r(cx,T+3*C,C,T,col);
  else if(nz===-1)out+=r(cx,0,C,T,col);
  else if(nx===1)out+=r(T+3*C,cz,T,C,col);
  else if(nx===-1)out+=r(0,cz,T,C,col);}
 if(mask==="corners"||mask==="full")out+=arrows(st,mask);
 return out+"</svg>"}
function arrows(st,mask){
 const T=12,C=25,cen=p=>[T+(p[0]+1)*C+C/2,T+(p[2]+1)*C+C/2];
 const mainCorner=mask==="corners";
 const moves=new Map();
 for(const s of st){if(s.p[1]!==1||s.h[1]!==1||eq(s.p,s.h))continue;moves.set(s.p.join(),[s.p,s.h]);}
 const head=(x,y,ux,uy,w,l)=>`M${x} ${y}L${x-ux*l-uy*w} ${y-uy*l+ux*w}L${x-ux*l+uy*w} ${y-uy*l-ux*w}Z`;
 const done=new Set();let main="",sec="";
 for(const [k,[a,b]] of moves){if(done.has(k))continue;done.add(k);
  const back=moves.get(b.join());const swap=back&&eq(back[1],a);if(swap)done.add(b.join());
  const primary=isCorner(a)===mainCorner;
  const w=primary?4.4:3.2,l=primary?7.6:5.6,sw=primary?2.6:1.7,g=primary?5:2;
  const [x1,y1]=cen(a),[x2,y2]=cen(b);const dx=x2-x1,dy=y2-y1,L=Math.hypot(dx,dy),ux=dx/L,uy=dy/L;
  let d,h;
  const mx=(x1+x2)/2-50,my=(y1+y2)/2-50,mL=Math.hypot(mx,my);
  if(false){ // bend inward, towards the centre
   const bx=-mx/mL*9,by=-my/mL*9,cx=(x1+x2)/2+bx,cy=(y1+y2)/2+by;
   const u1=[cx-x1,cy-y1],n1=Math.hypot(...u1),u2=[x2-cx,y2-cy],n2=Math.hypot(...u2);
   const a1=[u1[0]/n1,u1[1]/n1],a2=[u2[0]/n2,u2[1]/n2];
   const sx=x1+a1[0]*g,sy=y1+a1[1]*g,ex=x2-a2[0]*g,ey=y2-a2[1]*g;
   d=`M${sx} ${sy}Q${cx} ${cy} ${ex} ${ey}`;h=head(ex,ey,a2[0],a2[1],w,l);if(swap)h+=head(sx,sy,-a1[0],-a1[1],w,l);
  }else{
   const sx=x1+ux*g,sy=y1+uy*g,ex=x2-ux*g,ey=y2-uy*g;
   d=`M${sx} ${sy}L${ex} ${ey}`;h=head(ex,ey,ux,uy,w,l);if(swap)h+=head(sx,sy,-ux,-uy,w,l);}
  const path=`<path d="${d}" fill="none" stroke="#1d2330" stroke-width="${sw}" stroke-linecap="round"${primary?"":' stroke-dasharray="3 2.5"'}/><path d="${h}" fill="#1d2330"/>`;
  if(primary)main+=path;else sec+=path}
 return (sec?`<g opacity=".55">${sec}</g>`:"")+main}
function checkF2L(st){
 for(const s of st){if(s.p[1]===1&&s.p[0]===0&&s.p[2]===0&&s.f!=="U")return false;
  if(s.p[1]<1){const faceNow=Object.keys(NORM).find(k=>eq(NORM[k],s.n));if(faceNow!==s.f)return false;}}
 return true}
function isSolvedLL(st){return st.every(s=>{const k=Object.keys(NORM).find(k=>eq(NORM[k],s.n));return k===s.f})}
