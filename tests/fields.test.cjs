const {test}=require('node:test');const assert=require('node:assert/strict');const E=require('../fields-engine.js');
test('fields attach by an edge to their farm or territory, never obstacles or the other player',()=>{
 const g=E.create();assert.equal(E.valid(g,{x:3,y:0,w:2,h:3}),true);
 for(const r of [{x:3,y:3,w:2,h:2},{x:0,y:0,w:2,h:2},{x:10,y:6,w:2,h:2},{x:23,y:0,w:1,h:1},{x:18,y:12,w:2,h:3}])assert.equal(E.valid(g,r),false);
 g.dice=[2,3];E.place(g,{x:3,y:0,w:2,h:3},6);g.turn=0;
 assert.equal(E.valid(g,{x:5,y:1,w:1,h:2}),true);assert.equal(E.valid(g,{x:4,y:1,w:2,h:2}),false);
});
test('dice cannot be rerolled; dimensions and area must match before changing turn',()=>{
 const g=E.create();E.roll(g,()=>.2);assert.deepEqual(g.dice,[2,2]);assert.throws(()=>E.roll(g));
 assert.throws(()=>E.place(g,{x:3,y:0,w:2,h:3},6));assert.throws(()=>E.place(g,{x:3,y:0,w:2,h:2},5));assert.equal(g.turn,0);assert.equal(g.rectangles.length,0);
 E.place(g,{x:3,y:0,w:2,h:2},4);assert.equal(g.turn,1);assert.equal(g.dice,null);
});
test('rotation is allowed and enumerated, and passing is forbidden if a move remains',()=>{
 const g=E.create();g.dice=[2,3];assert(E.moves(g).some(r=>r.w===3&&r.h===2));assert.throws(()=>E.pass(g));E.place(g,{x:3,y:0,w:3,h:2},6);
});
test('two consecutive blocked rolls end the game; successful placement resets the counter',()=>{
 const g=E.create();g.rectangles=[{x:0,y:0,w:E.WIDTH,h:E.HEIGHT,player:0,area:345,perimeter:76}];g.dice=[1,1];E.pass(g);assert.equal(g.finished,false);g.dice=[1,1];E.pass(g);assert.equal(g.finished,true);assert.throws(()=>E.roll(g));
 const other=E.create();other.passes=1;other.dice=[1,1];E.place(other,{x:3,y:0,w:1,h:1},1);assert.equal(other.passes,0);
});
test('scores sum individual perimeters and award both players one point on ties',()=>{
 const g=E.create();g.rectangles=[{player:0,area:6,perimeter:10},{player:0,area:4,perimeter:8},{player:1,area:10,perimeter:14}];const s=E.scores(g);assert.deepEqual(s.points,[2,2]);assert.deepEqual(s.criteria.area,[1,1]);assert.equal(s.totals[0].perimeter,18);assert.equal(s.totals[0].largest,6);
 assert.deepEqual(E.scores(E.create()).points,[3,3]);
});
test('computer plays legal rectangles through complete games',()=>{
 let seed=7;const random=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
 for(let n=0;n<8;n++){const g=E.create();let turns=0;while(!g.finished&&turns++<400){E.roll(g,random);const r=E.computerMove(g);if(r){assert(E.valid(g,r));E.place(g,r,r.w*r.h);}else E.pass(g);}assert.equal(g.finished,true);assert(g.rectangles.length>0);}
});
