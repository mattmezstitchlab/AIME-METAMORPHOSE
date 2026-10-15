(()=>{
"use strict";
const $=id=>document.getElementById(id);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number(n)||0));
const safe=u=>{try{const x=new URL(u);return x.protocol==="https:"?x.href:""}catch{return ""}};
const colors=[["#e1e6e9","#4c5d6c"],["#ecdce2","#795964"],["#dfe9e2","#486352"],["#ede2d5","#705d4f"],["#e1e1ed","#55566f"],["#e9d9d2","#755c55"]];
const demo=[
["RIPPLECIRCLE","Cadran vivant : moments, relations et causalité.","https://ripplecircle.vercel.app/","temps",2],
["POINTZERO","La grille comme outil de création, de composition et de broderie.","https://pointzero-zeta.vercel.app/","création",1],
["AIME COMPOSER","Carte universelle, design system et composants.","https://aime-composer.vercel.app/","système",1],
["AIME STUDIO","Atelier de direction artistique, expérimentation et design.","https://aime-studio-mu.vercel.app/","studio",2],
["PASSEPORT AIME","Identité et relations entre personnes.","https://aime-passport.vercel.app/","identité",1],
["CABINET DE CURIOSITÉS","Un même fragment peut servir à plusieurs compositions.","","composition",1]];
const seed=()=>demo.map((d,i)=>({id:"demo_"+i,pageId:"demo",title:d[0],description:d[1],sourceUrl:d[2],kind:d[3],span:d[4],image:"",locked:i===0,crop:{x:50,y:50,zoom:100},notes:""}));
const init={mode:"explore",layout:"editorial",theme:"aime",selectedId:null,scan:null,fragments:seed(),findings:[],demo:true,boardTitle:"Cabinet de curiosités",subTitle:"Des fragments d'interfaces, à contempler et recomposer."};
let state=structuredClone(init);
try{const old=JSON.parse(localStorage.getItem("aime-metamorphose-v1")||"null");if(old&&Array.isArray(old.fragments)&&old.fragments.length<=100)state={...init,...old,mode:"explore",selectedId:null}}catch{}
function save(){try{localStorage.setItem("aime-metamorphose-v1",JSON.stringify(state));$("saveStatus").textContent="ENREGISTRÉ LOCALEMENT"}catch{$("saveStatus").textContent="NON ENREGISTRÉ"}}
let timeout;
function toast(msg){$("toast").textContent=msg;$("toast").hidden=false;clearTimeout(timeout);timeout=setTimeout(()=>$("toast").hidden=true,4000)}
const current=()=>state.fragments.find(f=>f.id===state.selectedId);
function top(){
$("boardTitle").textContent=state.boardTitle;$("boardSubtitle").textContent=state.subTitle;
$("boardEyebrow").textContent=state.demo?"COLLECTION / DÉMONSTRATION":"PROJET / ANALYSE DOCUMENTÉE";
$("fragmentCount").textContent=state.fragments.length+" FRAGMENTS";$("findingCount").textContent=state.findings.length||"";
$("sourceStatus").textContent=state.demo?"Démonstration · données locales":state.scan?.site||"Projet local";
$("layoutMode").value=state.layout;document.body.dataset.theme=state.theme;
document.querySelectorAll(".theme-choice").forEach(el=>{el.classList.toggle("selected",el.dataset.theme===state.theme);el.lastElementChild.textContent=el.dataset.theme===state.theme?"✓":""});
document.querySelectorAll("[data-mode]").forEach(el=>{el.classList.toggle("current",el.dataset.mode===state.mode);el.setAttribute("aria-selected",String(el.dataset.mode===state.mode))});
$("board").hidden=state.mode==="prove";$("proofs").hidden=state.mode!=="prove";
$("infoBanner").hidden=state.demo&&state.mode!=="prove";
$("infoBanner").textContent=state.demo?"Démonstration : ces fragments ne constituent pas des audits.":"Analyse du HTML public seulement. Aucun contrôle juridique complet ni capture pixel à pixel n'a été effectué.";
}
function board(){
const host=$("board");host.innerHTML="";
if(!state.fragments.length){host.innerHTML='<div class="board-empty"><div><strong>La grille attend sa première matière.</strong><span>Collez une URL ou ajoutez un fragment.</span></div></div>';return}
state.fragments.forEach((f,i)=>{
const span=state.layout==="regular"?1:state.layout==="immersive"&&i===0?3:clamp(f.span,1,4);
const crop=f.crop||{x:50,y:50,zoom:100};
const pair=colors[i%colors.length];
const el=document.createElement("article");
el.className="fragment span-"+span+(span>1?" frag-large":"")+(state.layout==="immersive"&&i===0?" row-2":"")+(f.id===state.selectedId?" selected":"")+(f.locked?" locked":"");
el.setAttribute("tabindex","0");el.setAttribute("role","button");el.setAttribute("aria-label","Inspecter "+f.title);el.draggable=!f.locked;el.dataset.id=f.id;
el.style.setProperty("--card-bg",pair[0]);el.style.setProperty("--card-ink",pair[1]);
el.style.setProperty("--zoom",clamp(crop.zoom,100,230)/100);el.style.setProperty("--px",clamp(crop.x,0,100)+"%");el.style.setProperty("--py",clamp(crop.y,0,100)+"%");
const image=safe(f.image);if(image)el.classList.add("has-image");
const count=state.findings.filter(x=>x.fragmentId===f.id).length;
el.innerHTML=(image?'<figure><img loading="lazy" alt="" referrerpolicy="no-referrer" src="'+esc(image)+'"></figure>':"")+
'<div class="frag-top"><span>'+esc(f.kind||"FRAGMENT").toUpperCase()+'</span><span class="frag-number">'+String(i+1).padStart(2,"0")+'</span></div>'+
'<div class="frag-middle">'+esc(f.title)+'</div><div class="frag-bottom">'+esc(f.description)+'</div>'+
(count?'<span class="finding-pin">'+count+' !</span>':"");
const pick=()=>{state.selectedId=f.id;save();board();inspector()};
el.addEventListener("click",pick);el.addEventListener("dblclick",()=>viewer(f.id));
el.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();pick()}});
el.addEventListener("dragstart",e=>{e.dataTransfer.setData("text/plain",f.id)});
el.addEventListener("dragover",e=>{e.preventDefault();el.classList.add("drag-over")});
el.addEventListener("dragleave",()=>el.classList.remove("drag-over"));
el.addEventListener("drop",e=>{e.preventDefault();el.classList.remove("drag-over");const from=e.dataTransfer.getData("text/plain");const a=state.fragments.findIndex(x=>x.id===from),b=state.fragments.findIndex(x=>x.id===f.id);if(a<0||b<0||a===b||state.fragments[a].locked)return;const moved=state.fragments.splice(a,1)[0];state.fragments.splice(b,0,moved);save();board()});
host.append(el);
});
}
function controls(key,label,value,min,max){return '<div class="control"><label for="crop_'+key+'">'+label+' <span id="num_'+key+'">'+value+(key==="zoom"?"%":"")+'</span></label><input type="range" id="crop_'+key+'" min="'+min+'" max="'+max+'" value="'+clamp(value,min,max)+'"></div>'}
function modify(id,fn,all=true){const f=state.fragments.find(x=>x.id===id);if(!f)return;fn(f);save();board();if(all)inspector()}
function inspector(){
const host=$("inspectorBody"),f=current();
if(!f){host.innerHTML='<div class="inspect-hero"><span class="inspect-symbol">✳</span><strong>Tout est fragment.</strong><p>Sélectionnez une case pour modifier son cadrage, sa dimension et ses relations.</p></div><div class="inspect-eyebrow">L’INTENTION</div><p class="inspect-description">Décomposez pour comprendre. Composez pour révéler. Documentez pour prouver.</p>';return}
const c=f.crop||{x:50,y:50,zoom:100},url=safe(f.sourceUrl),issues=state.findings.filter(p=>p.fragmentId===f.id);
host.innerHTML='<div class="inspect-eyebrow">FRAGMENT / '+esc(f.id)+'</div><h3 class="inspect-title">'+esc(f.title)+'</h3><p class="inspect-description">'+esc(f.description)+'</p>'+
'<div class="inspect-source">SOURCE<br>'+(url?'<a href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">'+esc(url)+'</a>':"Fragment libre")+'</div><div class="inspect-divider"></div><div class="inspect-eyebrow">COMPOSITION</div>'+
'<div class="inspect-row"><span>Largeur</span><strong>'+clamp(f.span,1,4)+' colonnes</strong></div><div class="inspect-actions"><button class="minor-btn" id="shrink" '+(f.locked||f.span<=1?"disabled":"")+'>− Réduire</button><button class="minor-btn" id="grow" '+(f.locked||f.span>=4?"disabled":"")+'>＋ Agrandir</button></div>'+
'<button class="button full" id="toggleLock">'+(f.locked?"⌑ Déverrouiller":"◇ Verrouiller")+'</button><div class="inspect-divider"></div><div class="inspect-eyebrow">RECADRAGE</div>'+
controls("zoom","Zoom",c.zoom,100,230)+controls("x","Horizontal",c.x,0,100)+controls("y","Vertical",c.y,0,100)+
'<div class="inspect-divider"></div><div class="control"><label for="fragmentNotes">Notes de recherche</label><textarea id="fragmentNotes" rows="3" placeholder="Intention, correction, idée…">'+esc(f.notes||"")+'</textarea></div>'+
(issues.length?'<div class="inspect-divider"></div><div class="inspect-eyebrow">OBSERVATIONS LIÉES</div>'+issues.map(p=>'<div class="tag '+(p.priority==="P1"?"urgent":"")+'">'+esc(p.priority+" · "+p.title)+'</div>').join(""):"")+
'<div class="inspect-divider"></div><div class="inspect-actions"><button id="previewFragment" class="minor-btn">↗ Explorer</button><button id="removeFragment" class="minor-btn">Retirer</button></div>';
$("grow").onclick=()=>modify(f.id,x=>x.span=clamp(x.span+1,1,4));
$("shrink").onclick=()=>modify(f.id,x=>x.span=clamp(x.span-1,1,4));
$("toggleLock").onclick=()=>modify(f.id,x=>x.locked=!x.locked);
for(const key of ["zoom","x","y"]){const el=$("crop_"+key);el.oninput=()=>{modify(f.id,x=>x.crop={...x.crop,[key]:Number(el.value)},false);$("num_"+key).textContent=el.value+(key==="zoom"?"%":"")};el.onchange=inspector}
$("fragmentNotes").oninput=e=>{f.notes=e.target.value;save()};
$("previewFragment").onclick=()=>viewer(f.id);
$("removeFragment").onclick=()=>{state.fragments=state.fragments.filter(x=>x.id!==f.id);state.selectedId=null;save();render()};
}
function proofs(){
const host=$("proofs");
if(!state.findings.length){host.innerHTML='<div class="proof-summary"><h3>Aucune observation enregistrée.</h3><p>Le mode démonstration ne constitue pas un audit. Lancez une analyse pour obtenir les premiers constats.</p></div>';return}
host.innerHTML='<div class="proof-summary"><h3>'+state.findings.length+' observations à examiner.</h3><p>HTML statique seulement : aucune certification juridique ni test du comportement dynamique. Vérifiez chaque constat avant toute décision.</p></div><div class="findings-list">'+state.findings.map(f=>
'<button type="button" class="finding" data-id="'+esc(f.id)+'"><div class="finding-head"><strong>'+esc(f.title)+'</strong><span class="priority">'+esc(f.priority)+'</span></div><p>'+esc(f.evidence)+'</p><small>'+esc(f.category)+' · '+esc(f.sourceUrl)+'</small><small>VÉRIFICATION HUMAINE REQUISE</small></button>').join("")+'</div>';
host.querySelectorAll(".finding").forEach(el=>el.onclick=()=>{const f=state.findings.find(x=>x.id===el.dataset.id);if(!f)return;state.mode="explore";state.selectedId=f.fragmentId;render();toast("Observation sélectionnée. Contrôle humain nécessaire.")});
}
function render(){top();board();proofs();inspector()}
document.querySelectorAll("[data-mode]").forEach(el=>el.onclick=()=>{state.mode=el.dataset.mode;save();render()});
document.querySelectorAll(".theme-choice").forEach(el=>el.onclick=()=>{state.theme=el.dataset.theme;save();top()});
$("layoutMode").onchange=e=>{state.layout=e.target.value;save();board()};
$("resetLayout").onclick=()=>{state.layout="editorial";state.fragments.forEach((f,i)=>{if(!f.locked)f.span=i%5===0?2:1});save();render();toast("Grille recomposée. Les verrous restent actifs.")};
$("addFragment").onclick=()=>{const id="custom_"+Date.now();state.fragments.unshift({id,pageId:"custom",title:"Nouveau fragment",description:"Une nouvelle matière à transformer.",sourceUrl:"",kind:"libre",image:"",span:1,locked:false,crop:{x:50,y:50,zoom:100},notes:""});state.selectedId=id;state.mode="compose";save();render()};
$("demoBtn").onclick=()=>{state=structuredClone(init);save();render();toast("Collection de démonstration rechargée.")};
$("exportBtn").onclick=()=>{const data={schema:"aime-metamorphose/0.1",exportedAt:new Date().toISOString(),demo:state.demo,scan:state.scan,fragments:state.fragments,findings:state.findings,layout:state.layout,designSystem:state.theme};const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="aime-metamorphose-"+new Date().toISOString().slice(0,10)+".json";a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);toast("Dossier JSON exporté.")};
$("scanForm").onsubmit=async e=>{
e.preventDefault();const address=$("siteUrl").value.trim();
if(!address.startsWith("https://")){toast("Entrez une URL publique commençant par https://");return}
const btn=$("scanBtn");btn.disabled=true;btn.classList.add("loading");btn.querySelector(".scan-label").textContent="Absorption en cours";
try{const r=await fetch("/api/scan",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({url:address,maxPages:3})});const data=await r.json().catch(()=>({}));if(!r.ok)throw Error(data.error||"Analyse indisponible.");
state.scan=data;state.fragments=data.fragments||[];state.findings=data.findings||[];state.demo=false;state.mode="explore";state.selectedId=null;state.layout="editorial";state.boardTitle=new URL(address).hostname;state.subTitle=(data.pages?.length||0)+" pages · "+state.fragments.length+" fragments · "+state.findings.length+" observations à examiner";save();render();toast("Propagation terminée. Contrôles techniques à examiner.");
}catch(err){toast("Analyse non terminée : "+(err.message||"Réseau indisponible."))}
finally{btn.disabled=false;btn.classList.remove("loading");btn.querySelector(".scan-label").textContent="Propager l'URL";}
};
function viewer(id){const f=state.fragments.find(x=>x.id===id),url=safe(f?.sourceUrl);if(!url){toast("Aucune URL associée à ce fragment.");return}$("viewerTitle").textContent=f.title;$("viewerUrl").textContent=url;$("viewerFrame").src=url;$("viewer").hidden=false;document.body.style.overflow="hidden";$("viewerExternal").onclick=()=>window.open(url,"_blank","noopener,noreferrer")}
function close(){$("viewer").hidden=true;$("viewerFrame").src="about:blank";document.body.style.overflow=""}
$("viewerClose").onclick=close;document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!$("viewer").hidden)close()});
render();
})();
