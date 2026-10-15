import https from "node:https";
import dns from "node:dns/promises";
import net from "node:net";
import * as cheerio from "cheerio";
export const config = { maxDuration: 30 };
const short = (x, n = 260) => String(x || "").replace(/\s+/g," ").trim().slice(0,n);
function publicIP(ip) {
  const kind = net.isIP(ip);
  if (kind === 4) {
    const [a,b] = ip.split(".").map(Number);
    return !(a===0 || a===10 || a===127 || a>=224 || a===169&&b===254 || a===172&&b>=16&&b<=31 || a===192&&(b===168||b===0) || a===100&&b>=64&&b<=127 || a===198&&(b===18||b===19||b===51) || a===203&&b===0);
  }
  return kind===6 && /^[23][0-9a-f]{3}:/i.test(ip) && !/^2001:db8:/i.test(ip);
}
function safeURL(input) {
  if (typeof input!=="string" || input.length>2048) throw Error("URL invalide.");
  const u=new URL(input);
  if(u.protocol!=="https:" || u.username || u.password || u.port && u.port!=="443" || net.isIP(u.hostname) || !u.hostname.includes(".") || /\.(local|internal|localhost|test|invalid)$/i.test(u.hostname)) throw Error("Seules les URLs HTTPS publiques sont acceptées.");
  u.hash=""; return u;
}
async function loadHtml(href, hops=0) {
  const u=safeURL(href);
  const addresses=await dns.lookup(u.hostname,{all:true,verbatim:true});
  if(!addresses.length || addresses.some(a=>!publicIP(a.address))) throw Error("Destination réseau interdite.");
  const chosen=addresses[0];
  return await new Promise((resolve,reject)=>{
    const req=https.request(u,{timeout:8500,lookup:(_h,_o,cb)=>cb(null,chosen.address,chosen.family),headers:{"User-Agent":"AIME-METAMORPHOSE/0.1 (read-only site audit)","Accept":"text/html","Accept-Encoding":"identity"}},res=>{
      const code=res.statusCode||0;
      if(code>=300 && code<400 && res.headers.location) {
        res.resume(); if(hops>=2) return reject(Error("Trop de redirections."));
        const next=new URL(res.headers.location,u);
        if(next.origin!==u.origin) return reject(Error("Redirection externe refusée."));
        return resolve(loadHtml(next.href,hops+1));
      }
      if(code<200 || code>=300){res.resume();return reject(Error("HTTP "+code));}
      if(!String(res.headers["content-type"]||"").toLowerCase().includes("text/html")){res.resume();return reject(Error("Contenu non HTML."));}
      let bytes=0;const chunks=[];
      res.on("data",b=>{bytes+=b.length;if(bytes>1500000){req.destroy(Error("Page supérieure à 1,5 Mo."));return;}chunks.push(b);});
      res.on("end",()=>resolve({url:u.href,html:Buffer.concat(chunks).toString("utf8")}));
    });
    req.on("timeout",()=>req.destroy(Error("Délai de réponse dépassé.")));
    req.on("error",reject);req.end();
  });
}
const asset=(p,url)=>{try{const u=new URL(p,url);return u.protocol==="https:"?u.href:"";}catch{return "";}};
function parse({url,html},i) {
  const $=cheerio.load(html);
  $("script,style,svg,noscript,template").remove();
  const links=$("a[href]").toArray().map(a=>({url:asset($(a).attr("href"),url),text:short($(a).text(),90)})).filter(x=>x.url);
  const title=short($("title").first().text()||$("h1").first().text(),100)||new URL(url).hostname;
  const description=short($('meta[name="description"]').attr("content"),320);
  const cover=asset($('meta[property="og:image"]').attr("content")||$("main img").first().attr("src")||$("img").first().attr("src"),url);
  const page={id:"page_"+i,url,title,description,cover,documentLang:short($("html").attr("lang"),20),linksCount:links.length,headingsCount:$("h1").length,imagesCount:$("img").length};
  const fragments=[];
  const push=(label,body,kind,image)=>{
    if(fragments.length>=16)return;
    const text=short(body,400);
    if(!text&&!image)return;
    if(fragments.some(f=>f.title===label&&f.description.slice(0,80)===text.slice(0,80)))return;
    fragments.push({id:"frag_"+i+"_"+fragments.length,pageId:page.id,sourceUrl:url,title:short(label,65),description:text,kind,image:asset(image,url),span:fragments.length===0?2:1,locked:false,crop:{x:50,y:50,zoom:100},notes:""});
  };
  push(title,description||$("main").text()||$("body").text(),"overview",cover);
  $("header,main > section,section,article,footer,main > div").each((_i,el)=>{
    if($(el).parents("section,article").length)return;
    const label=short($(el).find("h1,h2,h3").first().text(),65)||({header:"En-tête",footer:"Pied de page"}[el.tagName]||"Section "+(fragments.length+1));
    const kind=el.tagName==="footer"||el.tagName==="header"?"structure":"section";
    push(label,$(el).text(),kind,$(el).find("img").first().attr("src"));
  });
  if(fragments.length<2)$("h2,h3").slice(0,8).each((_i,e)=>push(short($(e).text(),65),$(e).parent().text(),"section",""));
  const findings=[];
  const add=(title,category,evidence,priority)=>findings.push({id:"finding_"+i+"_"+findings.length,pageId:page.id,fragmentId:fragments[0]?.id||null,title,category,evidence,priority,status:"review_required",automated:true,sourceUrl:url});
  if(!$("html").attr("lang"))add("Langue du document non déclarée","accessibilite","Attribut lang absent du HTML initial.","P2");
  if(!$("h1").length)add("Titre principal non détecté","accessibilite","Aucun h1 détecté dans le HTML initial. Contrôler la version rendue.","P2");
  const missingAlt=$("img").toArray().filter(e=>$(e).attr("alt")===undefined).length;
  if(missingAlt)add(missingAlt+" image(s) sans attribut alt","accessibilite","Les images décoratives doivent aussi être évaluées.","P2");
  for(const [pattern,label,category] of [[/mentions.l.gales|legal.notice|impressum/i,"Mentions légales","commerce"],[/confidentialit|privacy|rgpd/i,"Confidentialité","donnees"],[/conditions.g.n.rales|cgv|terms.and.conditions/i,"CGV","commerce"]]){
    if(!links.some(l=>pattern.test(l.text+" "+l.url)))add(label+" : lien à vérifier",category,"Lien non identifié dans le HTML statique ; cela ne prouve pas son absence sur le site final.","P1");
  }
  if(/cookie|consent|didomi|onetrust|cookiebot/i.test(html))add("Gestion des cookies : revue requise","donnees","Marqueur de consentement trouvé ; les comportements accepter/refuser ne sont pas vérifiés.","P2");
  return {page,fragments,findings,links};
}
export default async function handler(req,res) {
  res.setHeader("Cache-Control","no-store");
  if(req.method!=="POST")return res.status(405).json({error:"Méthode non autorisée."});
  try{
    if(Number(req.headers["content-length"]||0)>4096)return res.status(413).json({error:"Requête trop volumineuse."});
    const url=safeURL(req.body?.url);
    const count=Math.max(1,Math.min(5,Number(req.body?.maxPages||3)));
    const first=parse(await loadHtml(url.href),1);
    const candidates=first.links.map(x=>x.url).filter(x=>{try{const u=new URL(x);return u.origin===url.origin && !u.search && !/\.(pdf|jpg|png|svg|zip|webp)$/i.test(u.pathname)}catch{return false}});
    const priority=candidates.filter(x=>/legal|cgv|privacy|contact|product|produit|boutique|shop|panier/i.test(x));
    const targets=[...new Set([...priority,...candidates])].filter(x=>x!==url.href).slice(0,count-1);
    const results=await Promise.all(targets.map(async(x,n)=>{try{return parse(await loadHtml(x),n+2)}catch(err){return {error:short(err.message),url:x}}}));
    const ok=[first,...results.filter(x=>!x.error)];
    return res.status(200).json({mode:"real-html-analysis",inspectedAt:new Date().toISOString(),site:url.origin,pages:ok.map(x=>x.page),fragments:ok.flatMap(x=>x.fragments).slice(0,45),findings:ok.flatMap(x=>x.findings),failed:results.filter(x=>x.error),limitations:["HTML statique uniquement ; rendu JavaScript, cookies, sécurité serveur et conformité juridique non vérifiés.","Les visuels sont des images extraites du site et non des captures complètes.","L'absence de détection ne signifie pas conformité."]});
  }catch(err){return res.status(400).json({error:short(err.message||"Analyse impossible.")});}
}