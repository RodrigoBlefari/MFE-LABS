const fs = require('fs');
const path = require('path');
const pkgFile = process.argv[2] || process.argv[1];
const dir = process.argv[3] || (pkgFile ? path.dirname(pkgFile) : '.');

function out(v){
  if(!v) v='--';
  console.log(String(v));
}

try{
  const pkg = JSON.parse(fs.readFileSync(pkgFile,'utf8'));
  const deps = Object.assign({}, pkg.dependencies || {}, pkg.devDependencies || {});
  if(deps['@angular/core'] || deps['@angular/elements'] || deps['@angular/platform-browser']){
    const v = deps['@angular/core'] || deps['@angular/elements'] || deps['@angular/platform-browser'];
    return out('Angular ' + String(v).replace(/^[^0-9]*/,''));
  }
  if(deps['react']){ return out('React ' + String(deps['react']).replace(/^[^0-9]*/,'')); }
  if(deps['vue']){ return out('Vue ' + String(deps['vue']).replace(/^[^0-9]*/,'')); }
  if(deps['single-spa']){ return out('Single-SPA ' + String(deps['single-spa']).replace(/^[^0-9]*/,'')); }
}catch(e){/* ignore */}

// fallback: inspect JS files
try{
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
  for(const f of files){
    const txt = fs.readFileSync(path.join(dir,f),'utf8');
    let m;
    m = txt.match(/react@([0-9]+\.[0-9]+(?:\.[0-9]+)?)/i);
    if(m){ return out('React ' + m[1]); }
    m = txt.match(/React\s+([0-9]+\.[0-9]+(?:\.[0-9]+)?)/i);
    if(m){ return out('React ' + m[1]); }
    m = txt.match(/https?:\/\/cdn\.jsdelivr\.net\/npm\/react@([0-9]+\.[0-9]+(?:\.[0-9]+)?)/i);
    if(m){ return out('React ' + m[1]); }
    m = txt.match(/vue@([0-9]+\.[0-9]+(?:\.[0-9]+)?)/i) || txt.match(/Vue\s+([0-9]+\.[0-9]+(?:\.[0-9]+)?)/i);
    if(m){ return out('Vue ' + m[1]); }
    m = txt.match(/@angular\/(?:core|elements)["']?\s*[:=]?\s*["']?\^?([0-9]+\.[0-9]+(?:\.[0-9]+)?)/i) || txt.match(/Angular\s+([0-9]+\.[0-9]+(?:\.[0-9]+)?)/i);
    if(m){ return out('Angular ' + m[1]); }
    if(/Module Federation/i.test(txt)){
      const r = txt.match(/React\s*([0-9]+\.[0-9]+)/i);
      if(r){ return out('React ' + r[1] + ' (Module Federation)'); }
      return out('Module Federation (webpack)');
    }
    // detect single-spa adapter mentions
    if(/single-spa/i.test(txt)){
      const m = txt.match(/single-spa\s*([0-9]+\.[0-9]+)?/i);
      return out('Single-SPA ' + (m && m[1] ? m[1] : '')); 
    }
    // detect native-federation style (CustomEvent, createOutlet, native federation)
    if(/Native Federation|native federation|CustomEvent|createOutlet|createOutlet\(/i.test(txt)){
      return out('Native Federation (vanilla)');
    }
  }
}catch(e){/* ignore */}

out('--');
