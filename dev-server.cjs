// Local preview only. Production serves the static public files directly.
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const allowed=new Set(['index.html','style.css','script.js','engine.js','diagnostics.js','logs.html','logs.js','favicon.svg']);
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml'};
const port=Number(process.env.PORT||4318);
http.createServer((req,res)=>{const file=new URL(req.url,'http://localhost').pathname.slice(1)||'index.html';if(!allowed.has(file)){res.writeHead(404);res.end('Not found');return;}fs.readFile(path.join(__dirname,file),(err,data)=>{if(err){res.writeHead(500);res.end('Read error');return;}res.writeHead(200,{'Content-Type':types[path.extname(file)],'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(data);});}).listen(port,'127.0.0.1',()=>console.log(`Mathélio : http://127.0.0.1:${port}`));
