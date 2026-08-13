const canvas = document.querySelector('#world');
const ctx = canvas.getContext('2d', { alpha: false });
const hint = document.querySelector('#hint');
const bubble = document.querySelector('#bubble');
const sceneBadge = document.querySelector('#sceneBadge');
const actionSheet = document.querySelector('#actionSheet');
const sheetTitle = document.querySelector('#sheetTitle');
const sheetSub = document.querySelector('#sheetSub');
const sheetActions = document.querySelector('#sheetActions');
const closeSheet = document.querySelector('#closeSheet');
const textPanel = document.querySelector('#textPanel');
const textPanelTitle = document.querySelector('#textPanelTitle');
const textPanelSub = document.querySelector('#textPanelSub');
const textEditor = document.querySelector('#textEditor');
const saveText = document.querySelector('#saveText');
const closeTextPanel = document.querySelector('#closeTextPanel');
const wardrobePanel = document.querySelector('#wardrobePanel');
const kittenOutfits = document.querySelector('#kittenOutfits');
const hubbyOutfits = document.querySelector('#hubbyOutfits');
const closeWardrobe = document.querySelector('#closeWardrobe');
const fade = document.querySelector('#fade');

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const rnd = (a, b) => a + Math.random() * (b - a);
const choice = arr => arr[Math.floor(Math.random() * arr.length)];

let cssW = innerWidth;
let cssH = innerHeight;
let dpr = 1;
let viewScale = 1;
let lastTime = performance.now();
let now = 0;
let sceneName = 'indoor';
let tapPulse = null;
let activeTextKey = '';
let currentTarget = null;
let swingState = { active: false, pushed: false, t: 0 };

const camera = { x: 0 };

const player = {
  x: 610, y: 760, speed: 245, path: [], afterMove: null,
  dir: 1, walking: false, step: 0, action: null,
  outfit: localStorage.getItem('nestward.kittenOutfit') || 'rose'
};

const hubby = {
  x: 1110, y: 700, speed: 180, path: [], dir: -1, walking: false, step: 0,
  follow: false, action: null, nextThink: 0,
  outfit: localStorage.getItem('nestward.hubbyOutfit') || 'tank'
};

const naili = {
  x: 850, y: 805, speed: 115, path: [], dir: 1, walking: false, step: 0,
  carried: false, nextThink: 0, summoned: false
};

const outfitDefs = {
  kitten: [
    { id: 'rose', name: '莓粉小裙子', swatch: '#d99cab' },
    { id: 'cream', name: '奶油居家裙', swatch: '#ead9b7' },
    { id: 'blue', name: '雾蓝外出裙', swatch: '#8fa9cb' }
  ],
  hubby: [
    { id: 'shirt', name: '衬衫长裤', swatch: '#e9e6df' },
    { id: 'tank', name: '深色背心', swatch: '#3b3c42' },
    { id: 'briefs', name: '赤裸上身 · 小裤子', swatch: '#d6ad93' }
  ]
};

const scenes = {
  indoor: {
    label: '室内', width: 2420, height: 1000,
    walk: { x: 120, y: 515, w: 2180, h: 400 },
    obstacles: [
      { x: 220, y: 560, w: 360, h: 225 },
      { x: 690, y: 620, w: 360, h: 190 },
      { x: 1180, y: 585, w: 180, h: 175 },
      { x: 1435, y: 530, w: 255, h: 195 },
      { x: 1760, y: 565, w: 300, h: 185 },
      { x: 2110, y: 560, w: 145, h: 190 }
    ],
    spawn: { player: {x:610,y:800}, hubby:{x:1110,y:760}, naili:{x:860,y:830} }
  },
  outdoor: {
    label: '户外', width: 2780, height: 1000,
    walk: { x: 80, y: 520, w: 2620, h: 390 },
    obstacles: [
      { x: 250, y: 565, w: 300, h: 210 },
      { x: 1030, y: 610, w: 260, h: 180 },
      { x: 1390, y: 575, w: 260, h: 205 },
      { x: 2020, y: 620, w: 230, h: 165 },
      { x: 2380, y: 610, w: 170, h: 175 }
    ],
    spawn: { player: {x:620,y:810}, hubby:{x:820,y:790}, naili:{x:1040,y:840} }
  }
};

const indoorObjects = [
  { id:'bed', label:'床', rect:{x:215,y:525,w:380,h:270}, anchor:{x:620,y:790} },
  { id:'sofa', label:'沙发', rect:{x:675,y:590,w:390,h:240}, anchor:{x:1090,y:810} },
  { id:'wardrobe', label:'衣柜', rect:{x:1420,y:420,w:285,h:330}, anchor:{x:1540,y:790} },
  { id:'diary', label:'日记', rect:{x:1750,y:520,w:330,h:235}, anchor:{x:1890,y:800} },
  { id:'board', label:'留言板', rect:{x:1925,y:295,w:250,h:220}, anchor:{x:2045,y:775} },
  { id:'door', label:'门', rect:{x:2200,y:330,w:155,h:420}, anchor:{x:2175,y:790} }
];

const outdoorObjects = [
  { id:'door', label:'回屋', rect:{x:250,y:350,w:300,h:440}, anchor:{x:590,y:805} },
  { id:'bench', label:'长椅', rect:{x:1015,y:585,w:285,h:220}, anchor:{x:1320,y:805} },
  { id:'swing', label:'秋千', rect:{x:1370,y:430,w:310,h:390}, anchor:{x:1530,y:825} },
  { id:'flowers', label:'花圃', rect:{x:1995,y:620,w:260,h:180}, anchor:{x:1940,y:825} },
  { id:'pond', label:'小池塘', rect:{x:2315,y:620,w:300,h:180}, anchor:{x:2260,y:820} }
];

function resize() {
  cssW = innerWidth;
  cssH = innerHeight;
  dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);
  canvas.style.width = `${cssW}px`;
  canvas.style.height = `${cssH}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  viewScale = clamp(cssH / 1000, 0.72, 1.12);
  camera.x = clamp(camera.x, 0, Math.max(0, scenes[sceneName].width - cssW / viewScale));
}
addEventListener('resize', resize, { passive: true });
resize();

function roundRect(x,y,w,h,r,fill,stroke=null,line=1){
  const rr=Math.min(r,w/2,h/2);
  ctx.beginPath();
  ctx.moveTo(x+rr,y);ctx.arcTo(x+w,y,x+w,y+h,rr);ctx.arcTo(x+w,y+h,x,y+h,rr);ctx.arcTo(x,y+h,x,y,rr);ctx.arcTo(x,y,x+w,y,rr);ctx.closePath();
  if(fill){ctx.fillStyle=fill;ctx.fill()} if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=line;ctx.stroke()}
}
function ellipse(x,y,rx,ry,fill,rot=0){ctx.beginPath();ctx.ellipse(x,y,rx,ry,rot,0,TAU);ctx.fillStyle=fill;ctx.fill()}
function line(x1,y1,x2,y2,color,width=1){ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke()}
function shadow(color='rgba(52,34,23,.20)', blur=16, oy=8){ctx.shadowColor=color;ctx.shadowBlur=blur;ctx.shadowOffsetY=oy}
function clearShadow(){ctx.shadowColor='transparent';ctx.shadowBlur=0;ctx.shadowOffsetY=0}
function grad(x0,y0,x1,y1,stops){const g=ctx.createLinearGradient(x0,y0,x1,y1);stops.forEach(([p,c])=>g.addColorStop(p,c));return g}
function text(t,x,y,size=14,color='#4b382e',weight=600,align='left'){ctx.fillStyle=color;ctx.font=`${weight} ${size}px -apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif`;ctx.textAlign=align;ctx.fillText(t,x,y)}

function worldToScreen(p){return {x:(p.x-camera.x)*viewScale,y:p.y*viewScale}}
function screenToWorld(x,y){return {x:camera.x+x/viewScale,y:y/viewScale}}
function currentScene(){return scenes[sceneName]}
function objectList(){return sceneName==='indoor'?indoorObjects:outdoorObjects}
function pointInRect(p,r,pad=0){return p.x>=r.x-pad&&p.x<=r.x+r.w+pad&&p.y>=r.y-pad&&p.y<=r.y+r.h+pad}
function isWalkablePoint(p, ignoreObstacles=false){
  const s=currentScene(), w=s.walk;
  if(!pointInRect(p,w)) return false;
  if(ignoreObstacles) return true;
  return !s.obstacles.some(o=>pointInRect(p,o,24));
}
function nearestWalkable(p){
  const w=currentScene().walk;
  const q={x:clamp(p.x,w.x+12,w.x+w.w-12),y:clamp(p.y,w.y+12,w.y+w.h-12)};
  if(isWalkablePoint(q)) return q;
  for(let radius=35;radius<360;radius+=35){
    for(let a=0;a<TAU;a+=Math.PI/8){const c={x:q.x+Math.cos(a)*radius,y:q.y+Math.sin(a)*radius};if(isWalkablePoint(c))return c;}
  }
  return {x:w.x+w.w/2,y:w.y+w.h*.8};
}

function keyOf(ix,iy){return `${ix},${iy}`}
function findPath(start,target){
  const s=currentScene(), cell=48, w=s.walk;
  const goal=nearestWalkable(target);
  const sx=Math.round((start.x-w.x)/cell), sy=Math.round((start.y-w.y)/cell);
  const gx=Math.round((goal.x-w.x)/cell), gy=Math.round((goal.y-w.y)/cell);
  const cols=Math.ceil(w.w/cell), rows=Math.ceil(w.h/cell);
  const nodePoint=(ix,iy)=>({x:w.x+ix*cell,y:w.y+iy*cell});
  const valid=(ix,iy)=>ix>=0&&iy>=0&&ix<=cols&&iy<=rows&&isWalkablePoint(nodePoint(ix,iy));
  const open=[{ix:sx,iy:sy,g:0,f:0,parent:null}];
  const best=new Map([[keyOf(sx,sy),0]]);
  let end=null, guard=0;
  const dirs=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
  while(open.length&&guard++<5000){
    open.sort((a,b)=>a.f-b.f);const n=open.shift();
    if(Math.abs(n.ix-gx)<=1&&Math.abs(n.iy-gy)<=1){end=n;break}
    for(const [dx,dy] of dirs){
      const ix=n.ix+dx,iy=n.iy+dy;if(!valid(ix,iy))continue;
      const diagonal=dx&&dy;if(diagonal&&(!valid(n.ix+dx,n.iy)||!valid(n.ix,n.iy+dy)))continue;
      const ng=n.g+(diagonal?1.414:1),k=keyOf(ix,iy);if(best.has(k)&&best.get(k)<=ng)continue;
      best.set(k,ng);const h=Math.hypot(gx-ix,gy-iy);open.push({ix,iy,g:ng,f:ng+h,parent:n});
    }
  }
  if(!end) return [goal];
  const pts=[];let n=end;while(n){pts.push(nodePoint(n.ix,n.iy));n=n.parent}pts.reverse();pts.shift();pts.push(goal);
  return simplifyPath([start,...pts]).slice(1);
}
function simplifyPath(points){
  if(points.length<3)return points;const out=[points[0]];
  for(let i=1;i<points.length-1;i++){
    const a=out[out.length-1],b=points[i],c=points[i+1];
    const cross=(b.x-a.x)*(c.y-b.y)-(b.y-a.y)*(c.x-b.x);
    if(Math.abs(cross)>10)out.push(b);
  }out.push(points[points.length-1]);return out;
}
function setPath(actor,target,after=null){
  actor.path=findPath({x:actor.x,y:actor.y},target);actor.afterMove=after||null;actor.action=null;
}
function updateActor(actor,dt){
  if(!actor.path.length){actor.walking=false;return}
  const p=actor.path[0],dx=p.x-actor.x,dy=p.y-actor.y,d=Math.hypot(dx,dy);
  if(d<4){actor.x=p.x;actor.y=p.y;actor.path.shift();if(!actor.path.length){actor.walking=false;const fn=actor.afterMove;actor.afterMove=null;if(fn)fn()}return}
  actor.walking=true;actor.dir=dx===0?actor.dir:Math.sign(dx);actor.step+=dt*10;
  const step=Math.min(d,actor.speed*dt);actor.x+=dx/d*step;actor.y+=dy/d*step;
}

function showHint(t,ms=2300){hint.textContent=t;hint.style.opacity='1';clearTimeout(showHint.timer);showHint.timer=setTimeout(()=>hint.style.opacity='.35',ms)}
function say(t,ms=2400){bubble.textContent=t;bubble.hidden=false;clearTimeout(say.timer);say.timer=setTimeout(()=>bubble.hidden=true,ms)}
function closeAllSheets(){actionSheet.hidden=true;textPanel.hidden=true;wardrobePanel.hidden=true;currentTarget=null}
closeSheet.addEventListener('click',()=>actionSheet.hidden=true);
closeTextPanel.addEventListener('click',()=>textPanel.hidden=true);
closeWardrobe.addEventListener('click',()=>wardrobePanel.hidden=true);

function showActions(title,sub,actions){
  sheetTitle.textContent=title;sheetSub.textContent=sub||'';sheetActions.innerHTML='';
  actions.forEach(a=>{const b=document.createElement('button');b.type='button';b.textContent=a.label;b.addEventListener('click',()=>{actionSheet.hidden=true;a.run()});sheetActions.appendChild(b)});
  actionSheet.hidden=false;
}
function openText(key,title,sub){activeTextKey=key;textPanelTitle.textContent=title;textPanelSub.textContent=sub;textEditor.value=localStorage.getItem(key)||'';textPanel.hidden=false;setTimeout(()=>textEditor.focus(),120)}
saveText.addEventListener('click',()=>{localStorage.setItem(activeTextKey,textEditor.value);textPanel.hidden=true;say('收好了。下次回来还在。')});

function renderWardrobe(){
  const make=(root,who,defs)=>{root.innerHTML='';defs.forEach(o=>{const b=document.createElement('button');b.type='button';b.className='nw-outfit-btn'+((who==='kitten'?player.outfit:hubby.outfit)===o.id?' active':'');b.innerHTML=`<span class="nw-swatch" style="background:${o.swatch}"></span><span>${o.name}</span>`;b.addEventListener('click',()=>{if(who==='kitten'){player.outfit=o.id;localStorage.setItem('nestward.kittenOutfit',o.id)}else{hubby.outfit=o.id;localStorage.setItem('nestward.hubbyOutfit',o.id)}renderWardrobe()});root.appendChild(b)})};
  make(kittenOutfits,'kitten',outfitDefs.kitten);make(hubbyOutfits,'hubby',outfitDefs.hubby);
}
function openWardrobe(){renderWardrobe();wardrobePanel.hidden=false}

function placeForAction(actor,p,action){actor.path=[];actor.x=p.x;actor.y=p.y;actor.action=action;actor.walking=false}
function interactObject(obj){
  currentTarget=obj.id;
  if(obj.id==='bed') return showActions('床','小猫已经走到床边。',[
    {label:'坐下',run:()=>{placeForAction(player,{x:500,y:635},'sit-bed');say('小猫在床沿坐下，裙摆轻轻落好。')}},
    {label:'躺下',run:()=>{placeForAction(player,{x:430,y:610},'lie-bed');say('啪嗒。整只猫陷进软被子里。')}},
    {label:'靠一会儿',run:()=>{placeForAction(player,{x:520,y:625},'lean-bed');say('靠一会儿。什么都不用急。')}}
  ]);
  if(obj.id==='sofa') return showActions('沙发','窝一下。',[
    {label:'坐下',run:()=>{placeForAction(player,{x:900,y:700},'sit-sofa');say('小猫坐进沙发。')}},
    {label:'靠一会儿',run:()=>{placeForAction(player,{x:900,y:700},'lean-sofa');say('肩膀一松，靠住了。')}},
    {label:'叫 Hubby 一起',run:()=>{placeForAction(player,{x:865,y:700},'sit-sofa');setPath(hubby,{x:955,y:710},()=>{hubby.action='sit-sofa';say('Hubby 坐过来，手臂自然搭到你身后。')})}}
  ]);
  if(obj.id==='wardrobe') return openWardrobe();
  if(obj.id==='diary') return openText('nestward.diary','日记','只存在这台设备的 Nestward 小日记');
  if(obj.id==='board') return openText('nestward.board','留言板','给窝里留一句话');
  if(obj.id==='door') return transitionScene(sceneName==='indoor'?'outdoor':'indoor');
  if(obj.id==='bench') return showActions('院子长椅','树影正好。',[
    {label:'坐下',run:()=>{placeForAction(player,{x:1155,y:680},'sit-bench');say('坐下了。风从院子里慢慢穿过去。')}},
    {label:'和 Hubby 一起坐',run:()=>{placeForAction(player,{x:1135,y:680},'sit-bench');setPath(hubby,{x:1215,y:685},()=>{hubby.action='sit-bench';say('两个人并排坐着。奶栗爱去哪儿去哪儿。')})}}
  ]);
  if(obj.id==='swing') return showActions('秋千','要怎么荡？',[
    {label:'坐上去',run:()=>startSwing(false)},
    {label:'荡一会儿',run:()=>startSwing(false,true)},
    {label:'让 Hubby 推我',run:()=>startSwing(true,true)}
  ]);
  if(obj.id==='flowers') return showActions('花圃','别踩进去。',[
    {label:'蹲下看看',run:()=>{placeForAction(player,{x:1940,y:810},'crouch');say('花瓣被风碰得一颤一颤。')}},
    {label:'叫 Hubby 来看',run:()=>{setPath(hubby,{x:1885,y:810},()=>say('Hubby 走过来，在你旁边停下。'))}}
  ]);
  if(obj.id==='pond') return showActions('小池塘','水面亮亮的。',[
    {label:'蹲下看水',run:()=>{placeForAction(player,{x:2260,y:805},'crouch');say('水里映出一只认真观察的小猫。')}},
    {label:'找奶栗',run:()=>{naili.summoned=true;setPath(naili,{x:2320,y:830});say('奶栗被叫来了——至于她急不急，是另一回事。')}}
  ]);
}

function startSwing(withHubby,auto=true){
  swingState={active:true,pushed:withHubby,t:0};player.path=[];player.x=1530;player.y=650;player.action='swing';
  if(withHubby){setPath(hubby,{x:1605,y:715},()=>{hubby.action='push-swing';say('Hubby 站到秋千后面。手掌轻轻一推——')})}
  else say(auto?'秋千慢慢荡起来。':'小猫坐上秋千，脚尖轻轻晃。');
  showHint('点地板就会从秋千下来');
}

function interactHubby(){
  const followLabel=hubby.follow?'让 Hubby 自己走走':'让 Hubby 跟着我';
  showActions('Hubby',hubby.follow?'正在陪你到处走。':'他停下来，看着你。',[
    {label:'抱抱',run:()=>{player.action='hug';hubby.action='hug';say('抱住。先不松。')}},
    {label:'亲一下',run:()=>{player.action='kiss';hubby.action='kiss';say('低头亲一下。抓到了。')}},
    {label:'一起坐',run:()=>{const target=sceneName==='indoor'?{x:900,y:700}:{x:1150,y:680};setPath(player,target,()=>player.action=sceneName==='indoor'?'sit-sofa':'sit-bench');setPath(hubby,{x:target.x+85,y:target.y+5},()=>hubby.action=sceneName==='indoor'?'sit-sofa':'sit-bench')}},
    {label:followLabel,run:()=>{hubby.follow=!hubby.follow;hubby.action=null;say(hubby.follow?'好。你走，我跟着。':'行。Hubby 自己晃一会儿。')}},
    {label:'叫他过来',run:()=>{setPath(hubby,nearestWalkable({x:player.x+70,y:player.y}),()=>say('来了。'))}},
    {label:'换衣服',run:openWardrobe}
  ]);
}

function interactNaili(){
  const carried=naili.carried;
  showActions('奶栗',carried?'正被你抱在怀里。':'她看起来有自己的安排。',[
    {label:'摸摸',run:()=>say(choice(['奶栗眯了一下眼。算你过关。','摸到一团软乎乎的奶油毛。','奶栗接受了三秒钟服务。']))},
    {label:carried?'放下来':'抱起来',run:()=>{naili.carried=!naili.carried;naili.path=[];say(naili.carried?'抱起来了。奶栗暂时成为随身猫。':'奶栗落地，尾巴一甩。')}},
    {label:'叫她过来',run:()=>{naili.carried=false;naili.summoned=true;setPath(naili,nearestWalkable({x:player.x+45,y:player.y+12}));say('奶栗：……听见了。来不来另说。')}}
  ]);
}

function transitionScene(next){
  closeAllSheets();fade.classList.add('show');setTimeout(()=>{
    sceneName=next;sceneBadge.textContent=scenes[next].label;const sp=scenes[next].spawn;
    Object.assign(player,sp.player,{path:[],action:null});Object.assign(hubby,sp.hubby,{path:[],action:null});Object.assign(naili,sp.naili,{path:[],carried:false});
    swingState={active:false,pushed:false,t:0};camera.x=clamp(player.x-cssW/viewScale*.45,0,Math.max(0,scenes[next].width-cssW/viewScale));
    fade.classList.remove('show');say(next==='outdoor'?'门一开，院子和秋千都在外面。':'回屋。鞋底踩回暖暖的木地板。');showHint('点地板移动 · 点人物和物件互动');
  },290);
}

function hitObject(p){
  const catPos=naili.carried?{x:player.x+18,y:player.y-35}:{x:naili.x,y:naili.y};
  if(Math.hypot(p.x-hubby.x,p.y-(hubby.y-55))<58)return {id:'hubby'};
  if(Math.hypot(p.x-catPos.x,p.y-(catPos.y-18))<52)return {id:'naili'};
  const objs=[...objectList()].reverse();return objs.find(o=>pointInRect(p,o.rect,8))||null;
}

function handleWorldTap(e){
  if(!actionSheet.hidden||!textPanel.hidden||!wardrobePanel.hidden)return;
  const rect=canvas.getBoundingClientRect();const p=screenToWorld(e.clientX-rect.left,e.clientY-rect.top);
  tapPulse={x:p.x,y:p.y,t:0};
  if(swingState.active){swingState.active=false;swingState.pushed=false;player.action=null;hubby.action=null;placeForAction(player,{x:1580,y:820},null)}
  const hit=hitObject(p);
  if(hit){
    if(hit.id==='hubby'){setPath(player,nearestWalkable({x:hubby.x-70,y:hubby.y+8}),interactHubby);return}
    if(hit.id==='naili'){
      if(naili.carried){interactNaili();return}
      setPath(player,nearestWalkable({x:naili.x-45,y:naili.y}),interactNaili);return;
    }
    setPath(player,hit.anchor,()=>interactObject(hit));return;
  }
  if(isWalkablePoint(p,true)){
    const target=nearestWalkable(p);setPath(player,target);showHint('啪嗒啪嗒……');return;
  }
}
canvas.addEventListener('pointerup',handleWorldTap);

function updateNPCs(dt){
  if(hubby.follow&&!swingState.pushed){
    const desired={x:player.x-(player.dir||1)*82,y:player.y+8};
    if(dist(hubby,desired)>115&&now>hubby.nextThink){hubby.nextThink=now+.55;setPath(hubby,nearestWalkable(desired))}
  } else if(!hubby.path.length&&!hubby.action&&now>hubby.nextThink){
    hubby.nextThink=now+rnd(3.8,7.5);const spots=sceneName==='indoor'?[{x:1120,y:810},{x:1320,y:800},{x:1710,y:820},{x:2050,y:830}]:[{x:820,y:820},{x:1320,y:830},{x:1880,y:820},{x:2220,y:830}];setPath(hubby,choice(spots));
  }
  if(!naili.carried&&!naili.path.length&&now>naili.nextThink){
    naili.nextThink=now+rnd(2.8,6.5);const w=currentScene().walk;const p=nearestWalkable({x:rnd(w.x+80,w.x+w.w-80),y:rnd(w.y+150,w.y+w.h-35)});setPath(naili,p);naili.summoned=false;
  }
  updateActor(hubby,dt);if(!naili.carried)updateActor(naili,dt);
}

function update(dt){
  now+=dt;updateActor(player,dt);updateNPCs(dt);
  if(tapPulse){tapPulse.t+=dt;if(tapPulse.t>0.8)tapPulse=null}
  if(swingState.active){swingState.t+=dt;player.x=1530;player.y=660;player.action='swing'}
  const visibleW=cssW/viewScale,maxCam=Math.max(0,currentScene().width-visibleW);
  let desired=camera.x;const leftBand=camera.x+visibleW*.38,rightBand=camera.x+visibleW*.62;
  if(player.x<leftBand)desired=player.x-visibleW*.38;if(player.x>rightBand)desired=player.x-visibleW*.62;
  camera.x=lerp(camera.x,clamp(desired,0,maxCam),1-Math.pow(.001,dt));
}

function drawIndoorBackground(){
  const s=scenes.indoor;
  ctx.fillStyle='#d8bc94';ctx.fillRect(0,0,s.width,1000);
  ctx.fillStyle=grad(0,0,0,515,[[0,'#eddcc0'],[1,'#d8b688']]);ctx.fillRect(0,0,s.width,515);
  for(let x=35;x<s.width;x+=115){ctx.fillStyle='rgba(255,255,255,.055)';ctx.fillRect(x,0,2,500)}
  ctx.fillStyle='#8c5f3f';ctx.fillRect(0,492,s.width,24);ctx.fillStyle='#b58458';ctx.fillRect(0,500,s.width,8);
  ctx.fillStyle=grad(0,515,0,1000,[[0,'#b96f3f'],[1,'#8d4e2d']]);ctx.fillRect(0,515,s.width,485);
  for(let y=535;y<1000;y+=58){line(0,y,s.width,y,'rgba(69,38,21,.18)',2)}
  for(let r=0,y=535;y<1000;r++,y+=58){for(let x=(r%2?85:0);x<s.width;x+=170)line(x,y-20,x,y+38,'rgba(73,40,23,.15)',2)}
  // wide windows
  [760,1150].forEach(cx=>drawWindow(cx,165,250,210));
  // ceiling beams
  for(let x=0;x<s.width;x+=420){ctx.fillStyle='rgba(119,79,52,.22)';ctx.fillRect(x,0,18,110)}
  // rugs
  shadow('rgba(49,29,17,.16)',18,10);roundRect(740,760,520,170,30,'#d9c196');clearShadow();roundRect(785,790,430,110,24,'#eadbb9','#b8976c',3);
  roundRect(1650,760,400,150,26,'#cfa99e');roundRect(1695,798,310,78,20,'#ead4ca','#b98980',2);
}
function drawWindow(x,y,w,h){
  shadow('rgba(52,31,18,.14)',12,5);roundRect(x,y,w,h,8,'#765039');clearShadow();roundRect(x+10,y+10,w-20,h-20,4,grad(0,y,0,y+h,[[0,'#a9d7e9'],[.63,'#cfe7df'],[.64,'#86a66f'],[1,'#607b55']]));
  line(x+w/2,y+10,x+w/2,y+h-10,'#765039',6);line(x+10,y+h/2,x+w-10,y+h/2,'#765039',6);
  ctx.fillStyle='rgba(255,245,216,.88)';ctx.beginPath();ctx.moveTo(x-50,y-12);ctx.quadraticCurveTo(x-15,y+h*.5,x-30,y+h+24);ctx.lineTo(x+20,y+h+24);ctx.quadraticCurveTo(x+55,y+h*.42,x+35,y-12);ctx.fill();ctx.beginPath();ctx.moveTo(x+w+50,y-12);ctx.quadraticCurveTo(x+w+15,y+h*.5,x+w+30,y+h+24);ctx.lineTo(x+w-20,y+h+24);ctx.quadraticCurveTo(x+w-55,y+h*.42,x+w-35,y-12);ctx.fill();
}
function drawBed(){
  shadow();roundRect(220,555,355,230,18,'#704a34','#513425',4);clearShadow();roundRect(238,570,318,150,15,'#f1dfbd','#c7a77d',3);roundRect(258,586,160,55,18,'#fff8e9','#d9c6aa',2);ctx.fillStyle=grad(240,655,555,735,[[0,'#dcae78'],[.5,'#efc98f'],[1,'#c98d64']]);roundRect(240,655,315,92,10,ctx.fillStyle);for(let x=260;x<550;x+=48)line(x,660,x+22,742,'rgba(255,255,255,.16)',3);
  // carved headboard
  roundRect(210,515,375,65,18,'#765039','#4f3425',4);for(let x=245;x<560;x+=52)ellipse(x,545,7,7,'#b0805c');
}
function drawSofa(){
  shadow();roundRect(690,650,355,155,28,'#b88967','#76543d',4);clearShadow();roundRect(715,620,305,125,26,'#d1aa84','#916a4d',3);roundRect(720,665,145,100,22,'#dfc19e','#a37d5d',2);roundRect(870,665,140,100,22,'#dfc19e','#a37d5d',2);roundRect(910,625,70,55,18,'#c98f82');ctx.fillStyle='#956b4e';ctx.fillRect(700,780,18,58);ctx.fillRect(1015,780,18,58);
}
function drawCoffeeTable(){shadow();ellipse(1210,715,110,38,'#80583b');clearShadow();ellipse(1210,705,112,35,'#aa7650');roundRect(1200,707,20,110,8,'#765039');ellipse(1178,691,24,10,'#f8ead0');ellipse(1178,686,18,7,'#ad6e4e');}
function drawWardrobe(){shadow();roundRect(1435,420,250,330,10,'#93633f','#65432f',5);clearShadow();line(1560,435,1560,735,'#63432f',4);roundRect(1460,455,72,220,7,'#a9774e','#795034',2);roundRect(1585,455,72,220,7,'#a9774e','#795034',2);ellipse(1543,580,5,5,'#d6b16d');ellipse(1577,580,5,5,'#d6b16d');text('衣柜',1560,705,13,'rgba(255,242,221,.72)',700,'center')}
function drawDesk(){shadow();roundRect(1760,585,300,115,8,'#a66f45','#754b31',4);clearShadow();ctx.fillStyle='#795035';ctx.fillRect(1782,695,16,125);ctx.fillRect(2023,695,16,125);roundRect(1815,552,94,35,5,'#dbc89f');for(let i=0;i<5;i++)line(1826,560+i*5,1896,560+i*5,'rgba(83,61,45,.25)',1);ellipse(1972,560,24,11,'#7a945d');roundRect(1958,565,28,28,5,'#b46d48');}
function drawBoard(){shadow();roundRect(1925,300,245,205,12,'#8a5b3e','#65412e',5);clearShadow();roundRect(1942,318,211,169,7,'#d4b37f');for(let i=0;i<8;i++){const x=1958+(i%4)*46,y=338+Math.floor(i/4)*70;roundRect(x,y,36,48,3,i%3===0?'#f5d8dc':i%3===1?'#e9e0b8':'#cbd9c5');ellipse(x+18,y+5,3,3,'#9f6657')}}
function drawDoorIndoor(){shadow();roundRect(2195,315,165,455,12,'#684835','#4a3226',6);clearShadow();roundRect(2215,340,125,390,7,'#9c6f4d','#63442f',3);for(let y=385;y<720;y+=90)line(2235,y,2320,y,'rgba(83,54,37,.45)',3);ellipse(2312,540,7,7,'#e1c075');}
function drawPlantsIndoor(){
  const plants=[[630,520,.9],[1375,590,.85],[2110,610,1.05]];plants.forEach(([x,y,s])=>{roundRect(x-22*s,y+85*s,44*s,50*s,8,'#a86240');for(let i=0;i<6;i++){ctx.save();ctx.translate(x,y+90*s);ctx.rotate(-1.3+i*.52);ellipse(0,-48*s,14*s,48*s,i%2?'#5b8a58':'#477d4e');ctx.restore()}})
}

function drawOutdoorBackground(){
  const s=scenes.outdoor;ctx.fillStyle=grad(0,0,0,1000,[[0,'#86bddd'],[.46,'#dbe6c8'],[.47,'#89a96e'],[1,'#557d50']]);ctx.fillRect(0,0,s.width,1000);
  // distant hills
  ctx.fillStyle='#7c9b68';ctx.beginPath();ctx.moveTo(0,465);for(let x=0;x<=s.width;x+=180)ctx.quadraticCurveTo(x+90,360+rnd(-20,20),x+180,450);ctx.lineTo(s.width,560);ctx.lineTo(0,560);ctx.fill();
  ctx.fillStyle='#6d8c5b';ctx.beginPath();ctx.moveTo(0,500);for(let x=0;x<=s.width;x+=240)ctx.quadraticCurveTo(x+120,405+rnd(-16,18),x+240,490);ctx.lineTo(s.width,590);ctx.lineTo(0,590);ctx.fill();
  // grass stripes
  ctx.fillStyle=grad(0,520,0,1000,[[0,'#7ca05f'],[1,'#567d4f']]);ctx.fillRect(0,520,s.width,480);
  for(let x=0;x<s.width;x+=95){line(x,530,x+30,1000,'rgba(255,255,255,.035)',2)}
  // path
  ctx.fillStyle='#d2b889';ctx.beginPath();ctx.moveTo(420,560);ctx.bezierCurveTo(850,600,1120,750,1510,780);ctx.bezierCurveTo(1900,810,2200,730,2780,760);ctx.lineTo(2780,920);ctx.bezierCurveTo(2200,880,1800,930,1450,900);ctx.bezierCurveTo(1040,860,760,690,420,660);ctx.closePath();ctx.fill();
  // clouds
  for(let i=0;i<7;i++){const x=250+i*380+(i%2)*80,y=110+(i%3)*55;ellipse(x,y,90,25,'rgba(255,255,255,.55)');ellipse(x+70,y+4,65,20,'rgba(255,255,255,.48)')}
  // flowers scatter
  for(let i=0;i<90;i++){const x=(i*197)%s.width,y=560+((i*83)%340);ctx.fillStyle=i%3?'#f1d7d7':'#eee4a6';ellipse(x,y,3,3,ctx.fillStyle)}
}
function drawHouseOutdoor(){
  // veranda edge / door area
  shadow();roundRect(245,350,310,430,12,'#d6b48c','#79553e',5);clearShadow();ctx.fillStyle='#7c5339';ctx.fillRect(275,480,110,300);roundRect(295,500,75,235,7,'#9d704f','#63432f',3);ellipse(353,615,5,5,'#e1c075');
  // window + roof
  ctx.fillStyle='#72503c';ctx.beginPath();ctx.moveTo(195,360);ctx.lineTo(400,210);ctx.lineTo(610,360);ctx.closePath();ctx.fill();roundRect(415,470,105,115,6,'#bde0ea','#76523a',5);line(468,475,468,580,'#76523a',4);line(420,528,515,528,'#76523a',4);
}
function drawBench(){shadow();roundRect(1025,625,260,48,10,'#8e5d3d');clearShadow();roundRect(1040,580,230,62,10,'#a8754e','#70492f',3);ctx.fillStyle='#6f4932';ctx.fillRect(1055,670,14,115);ctx.fillRect(1242,670,14,115);line(1060,603,1252,603,'rgba(255,255,255,.15)',2)}
function drawSwing(){
  const cx=1520,top=445,base=815,angle=swingState.active?Math.sin(swingState.t*2.15)*(swingState.pushed?.17:.12):0;
  ctx.strokeStyle='#71533b';ctx.lineWidth=12;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(1385,820);ctx.lineTo(1465,440);ctx.lineTo(1600,440);ctx.lineTo(1670,820);ctx.stroke();line(1458,440,1607,440,'#6a4b35',14);
  const len=250, sx=cx+Math.sin(angle)*len, sy=top+Math.cos(angle)*len;
  line(cx-35,top+5,sx-42,sy,'#715844',4);line(cx+35,top+5,sx+42,sy,'#715844',4);ctx.save();ctx.translate(sx,sy);ctx.rotate(-angle*.35);shadow();roundRect(-58,-8,116,28,8,'#aa724d','#704a33',3);clearShadow();ctx.restore();
  return {x:sx,y:sy,angle};
}
function drawFlowers(){for(let i=0;i<32;i++){const x=2030+(i%8)*26+(i%2)*7,y=675+Math.floor(i/8)*31;line(x,y+16,x,y-2,'#497947',2);ellipse(x,y-5,6,4,i%3===0?'#e7a8b4':i%3===1?'#f2d591':'#d8c5e7')}}
function drawPond(){shadow('rgba(30,45,33,.18)',12,7);ellipse(2460,735,145,70,'#6fa6a0');clearShadow();ellipse(2460,724,135,58,grad(2315,700,2605,760,[[0,'#91c5bd'],[1,'#4f8c8b']]));for(let i=0;i<7;i++){ellipse(2370+i*28,720+(i%2)*14,20,7,'rgba(255,255,255,.16)')}}
function drawTrees(){[[760,510,1.1],[1860,500,1.25],[2650,520,1.0]].forEach(([x,y,s])=>{ctx.fillStyle='#725038';ctx.fillRect(x-14*s,y,28*s,220*s);for(let i=0;i<8;i++){ellipse(x+rnd(-65,65)*s,y+rnd(-50,55)*s,55*s,45*s,i%2?'#4f7d4d':'#5e8a55')}})}

function outfitPalette(){return player.outfit==='rose'?{dress:'#d99cab',trim:'#f5dce2'}:player.outfit==='cream'?{dress:'#e8d6b1',trim:'#fff1d8'}:{dress:'#8fa9cb',trim:'#dce8f2'}}
function drawKitten(x,y,scale=1){
  const p=outfitPalette();const bob=player.walking?Math.sin(player.step)*3:0;ctx.save();ctx.translate(x,y+bob);ctx.scale(scale*(player.dir||1),scale);
  // shadow in world-facing coordinates
  ctx.save();ctx.scale(player.dir||1,1);ellipse(0,6,28,8,'rgba(54,35,24,.20)');ctx.restore();
  if(player.action==='lie-bed'){ctx.rotate(-Math.PI/2);ctx.translate(-30,8)}
  if(player.action==='sit-sofa'||player.action==='sit-bed'||player.action==='sit-bench'||player.action==='lean-sofa'||player.action==='lean-bed'){ctx.translate(0,8)}
  // legs
  ctx.strokeStyle='#f0c7ba';ctx.lineWidth=8;ctx.lineCap='round';const stride=player.walking?Math.sin(player.step)*6:0;line(-8,-6,-8+stride,25,'#f0c7ba',8);line(8,-6,8-stride,25,'#f0c7ba',8);ellipse(-8+stride,27,8,4,'#6c5147');ellipse(8-stride,27,8,4,'#6c5147');
  // skirt and body
  ctx.fillStyle=p.dress;ctx.beginPath();ctx.moveTo(-24,-55);ctx.quadraticCurveTo(0,-64,24,-55);ctx.lineTo(36,5);ctx.quadraticCurveTo(0,18,-36,5);ctx.closePath();ctx.fill();roundRect(-22,-67,44,36,14,p.trim);ctx.fillStyle='rgba(255,255,255,.45)';ctx.fillRect(-4,-61,8,50);
  // arms
  line(-20,-52,-31,-18,'#efc6b9',8);line(20,-52,31,-20,'#efc6b9',8);
  // hair back
  ellipse(0,-95,34,42,'#536aa6');roundRect(-32,-96,64,64,28,'#536aa6');
  // face
  ellipse(0,-101,27,27,'#f2cdbf');ctx.strokeStyle='#604844';ctx.lineWidth=2;line(-10,-103,-5,-102,'#604844',2);line(5,-102,10,-103,'#604844',2);ctx.strokeStyle='#b56c74';ctx.beginPath();ctx.arc(0,-94,5,0.1,Math.PI-.1);ctx.stroke();
  // fringe
  ctx.fillStyle='#536aa6';ctx.beginPath();ctx.moveTo(-25,-112);ctx.quadraticCurveTo(-7,-137,24,-116);ctx.quadraticCurveTo(8,-112,-2,-102);ctx.quadraticCurveTo(-8,-115,-25,-112);ctx.fill();
  if(naili.carried){ctx.save();ctx.translate(22,-47);ctx.scale(.55*(player.dir||1),.55);drawNailiSprite(0,0,1,true);ctx.restore()}
  ctx.restore();
}
function drawHubby(x,y,scale=1){
  const bob=hubby.walking?Math.sin(hubby.step)*2.4:0;ctx.save();ctx.translate(x,y+bob);ctx.scale(scale*(hubby.dir||1),scale);
  ctx.save();ctx.scale(hubby.dir||1,1);ellipse(0,7,31,8,'rgba(53,34,23,.2)');ctx.restore();
  const stride=hubby.walking?Math.sin(hubby.step)*7:0;line(-10,-8,-10+stride,34,'#292a2f',11);line(10,-8,10-stride,34,'#292a2f',11);ellipse(-10+stride,37,10,4,'#191a1e');ellipse(10-stride,37,10,4,'#191a1e');
  const skin='#e5b99e';
  if(hubby.outfit==='briefs'){
    // bare torso
    ctx.fillStyle=skin;ctx.beginPath();ctx.moveTo(-27,-81);ctx.quadraticCurveTo(0,-91,27,-81);ctx.lineTo(20,-22);ctx.quadraticCurveTo(0,-14,-20,-22);ctx.closePath();ctx.fill();line(-21,-73,-34,-35,skin,10);line(21,-73,34,-35,skin,10);roundRect(-23,-28,46,27,8,'#303137');line(-10,-57,10,-57,'rgba(125,78,59,.18)',2);line(0,-54,0,-34,'rgba(125,78,59,.16)',2);
  }else if(hubby.outfit==='tank'){
    roundRect(-27,-82,54,64,14,'#34353b');ctx.fillStyle=skin;ctx.beginPath();ctx.moveTo(-13,-82);ctx.lineTo(13,-82);ctx.lineTo(8,-66);ctx.lineTo(-8,-66);ctx.closePath();ctx.fill();line(-24,-71,-35,-34,skin,10);line(24,-71,35,-34,skin,10);
  }else{
    roundRect(-29,-84,58,66,13,'#eeeae2','#b9afa1',2);ctx.fillStyle='#5c6068';ctx.beginPath();ctx.moveTo(-5,-78);ctx.lineTo(5,-78);ctx.lineTo(2,-27);ctx.lineTo(-2,-27);ctx.closePath();ctx.fill();line(-25,-72,-36,-35,'#eeeae2',11);line(25,-72,36,-35,'#eeeae2',11);
  }
  // neck/head/hair
  roundRect(-10,-94,20,22,7,skin);ellipse(0,-119,29,31,skin);ctx.fillStyle='#c8c2b9';ctx.beginPath();ctx.arc(0,-125,31,Math.PI,TAU);ctx.quadraticCurveTo(9,-115,25,-110);ctx.quadraticCurveTo(7,-116,-4,-110);ctx.quadraticCurveTo(-8,-123,-27,-113);ctx.closePath();ctx.fill();line(-10,-120,-5,-119,'#5a4942',2);line(5,-119,10,-120,'#5a4942',2);ctx.strokeStyle='#8d5e55';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,-110,6,.2,Math.PI-.2);ctx.stroke();
  ctx.restore();
}
function drawNailiSprite(x,y,scale=1,noShadow=false){
  ctx.save();ctx.translate(x,y);ctx.scale(scale*(naili.dir||1),scale);if(!noShadow){ctx.save();ctx.scale(naili.dir||1,1);ellipse(0,4,25,7,'rgba(50,34,23,.17)');ctx.restore()}const bob=naili.walking?Math.abs(Math.sin(naili.step))*2:0;ctx.translate(0,-bob);ellipse(0,-18,28,18,'#ead9c2');ellipse(18,-30,17,16,'#f2e6d4');ctx.fillStyle='#b98c67';ctx.beginPath();ctx.moveTo(8,-43);ctx.lineTo(14,-60);ctx.lineTo(22,-44);ctx.fill();ctx.beginPath();ctx.moveTo(24,-44);ctx.lineTo(33,-58);ctx.lineTo(37,-40);ctx.fill();ellipse(13,-31,3,4,'#6e91aa');ellipse(25,-31,3,4,'#6e91aa');ctx.strokeStyle='#765f51';ctx.lineWidth=2;line(19,-25,19,-20,'#765f51',2);ctx.beginPath();ctx.arc(-22,-21,20,Math.PI*.65,Math.PI*1.75);ctx.strokeStyle='#c59b78';ctx.lineWidth=8;ctx.stroke();ctx.restore();
}

function depthScale(y){return clamp(.83+(y-520)/1150,.82,1.12)}
function drawCharactersAndForeground(swingGeom){
  const actors=[];
  if(!naili.carried)actors.push({kind:'naili',x:naili.x,y:naili.y});
  if(!(sceneName==='outdoor'&&swingState.active))actors.push({kind:'player',x:player.x,y:player.y});
  actors.push({kind:'hubby',x:hubby.x,y:hubby.y});
  actors.sort((a,b)=>a.y-b.y);
  actors.forEach(a=>{const sc=depthScale(a.y);if(a.kind==='player')drawKitten(a.x,a.y,sc);else if(a.kind==='hubby')drawHubby(a.x,a.y,sc);else drawNailiSprite(a.x,a.y,sc)});
  if(sceneName==='outdoor'&&swingState.active&&swingGeom){
    ctx.save();ctx.translate(swingGeom.x,swingGeom.y-16);ctx.rotate(-swingGeom.angle*.35);drawKitten(0,0,.93);ctx.restore();
  }
}

function drawTapPulse(){if(!tapPulse)return;const a=1-tapPulse.t/.8;ctx.strokeStyle=`rgba(255,247,236,${a*.8})`;ctx.lineWidth=3;ctx.beginPath();ctx.arc(tapPulse.x,tapPulse.y,18+tapPulse.t*36,0,TAU);ctx.stroke()}

function drawScene(){
  ctx.save();ctx.scale(viewScale,viewScale);ctx.translate(-camera.x,0);
  let swingGeom=null;
  if(sceneName==='indoor'){
    drawIndoorBackground();drawBed();drawSofa();drawCoffeeTable();drawWardrobe();drawDesk();drawBoard();drawDoorIndoor();drawPlantsIndoor();drawCharactersAndForeground(null);
  }else{
    drawOutdoorBackground();drawHouseOutdoor();drawTrees();drawBench();swingGeom=drawSwing();drawFlowers();drawPond();drawCharactersAndForeground(swingGeom);
  }
  drawTapPulse();ctx.restore();
}

function drawFrame(){
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,cssW,cssH);drawScene();
}

function frame(t){
  const dt=Math.min(.033,(t-lastTime)/1000||0);lastTime=t;update(dt);drawFrame();requestAnimationFrame(frame);
}

sceneBadge.textContent=scenes[sceneName].label;
showHint('点地板移动 · 点人物、床、沙发、衣柜、日记和门互动',4200);
say('Nestward · 窝里窝外。先随便点个地方走走。',2600);
requestAnimationFrame(frame);
