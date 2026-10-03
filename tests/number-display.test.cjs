const {test}=require('node:test');const assert=require('node:assert/strict');const N=require('../number-display.js');
test('positions are counted within each operand, including zero and grouped thousands',()=>{
 const s=N.html('1 204 + 56',{...N.defaults,labels:true});
 assert.match(s,/1<\/span><small>M/);assert.match(s,/2<\/span><small>C/);assert.match(s,/0<\/span><small>D/);assert.match(s,/4<\/span><small>U/);assert.match(s,/5<\/span><small>D/);assert.match(s,/6<\/span><small>U/);
 assert.match(N.html('0'),/>0<\/span>/);assert.match(N.html('12 345',{...N.defaults,labels:true}),/1<\/span><small>DM/);
});
test('decimal values keep integer place values and their punctuation; operators are unchanged',()=>{
 const s=N.html('(12,05 − 3.2) × ?', {...N.defaults,labels:true});assert.match(s,/2<\/span><small>U/);assert.match(s,/0<\/span><small>d/);assert.match(s,/5<\/span><small>c/);assert.match(s,/decimal-separator">,/);assert.match(s,/decimal-separator">\./);assert(s.includes(' − '));assert(s.includes(') × ?'));
 assert.match(s,/sr-only">12,05/);
});
test('invalid preferences and markup are rejected, and disabled display returns escaped plain text',()=>{
 const p=N.clean({units:'<script>',labels:'yes',enabled:false});assert.equal(p.units,'blue');assert.equal(p.labels,false);assert.equal(N.html('<img>12',{enabled:false}),'&lt;img&gt;12');assert(!N.html('<script>12</script>').includes('<script>'));
});
test('all palette colors contrast at least 4.5:1 on the white digit background',()=>{
 const luminance=hex=>{const channels=hex.match(/[a-f0-9]{2}/gi).map(c=>parseInt(c,16)/255).map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4);return channels[0]*.2126+channels[1]*.7152+channels[2]*.0722;};
 for(const [name,[,color]]of Object.entries(N.palette))assert(1.05/(luminance(color)+.05)>=4.5,name);
});
