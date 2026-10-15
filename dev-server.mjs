import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import scan from "./api/scan.mjs";
const root=path.join(path.dirname(fileURLToPath(import.meta.url)),"public");
const types={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8",".svg":"image/svg+xml"};
http.createServer(async(req,res)=>{
  if(req.url==="/api/scan"){
    let body="";
    try{
      for await(const chunk of req){body+=chunk;if(body.length>4096)throw Error("Requête trop grande.");}
      req.body=JSON.parse(body||"{}");
      res.status=code=>{res.statusCode=code;return res};
      res.json=content=>{res.setHeader("Content-Type","application/json; charset=utf-8");res.end(JSON.stringify(content))};
      await scan(req,res);
    }catch(error){res.statusCode=400;res.setHeader("Content-Type","application/json");res.end(JSON.stringify({error:error.message}))}
    return;
  }
  const pathname=decodeURIComponent(new URL(req.url,"http://localhost").pathname);
  const candidate=path.resolve(root,"."+pathname);
  if(!candidate.startsWith(root+path.sep)&&candidate!==root){res.writeHead(403).end();return}
  let name=candidate;try{if((await fs.stat(name)).isDirectory())name=path.join(name,"index.html")}catch{}
  try{const content=await fs.readFile(name);res.setHeader("Content-Type",types[path.extname(name)]||"application/octet-stream");res.end(content)}
  catch{res.writeHead(404,{"Content-Type":"text/plain"}).end("Page introuvable.")}
}).listen(5173,"127.0.0.1",()=>console.log("AIME MÉTAMORPHOSE : http://127.0.0.1:5173"));
