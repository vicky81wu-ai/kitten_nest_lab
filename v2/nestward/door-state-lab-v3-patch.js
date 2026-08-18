(()=>{
  const SPEED_KEY='nw.doorStateLab.v3.moveSpeed';
  const DRAFT_KEY='nw.doorStateLab.v3.draft1';
  let labMoveSpeed=Math.max(.2,Math.min(1.2,Number(localStorage.getItem(SPEED_KEY))||.40));
  let copyCount=0;

  const top=document.querySelector('.top');
  const footRange=[...top.querySelectorAll('.range')].find(el=>el.textContent.includes('脚底圆点大小'));
  if(footRange){
    const row=document.createElement('div');
    row.className='range';
    row.innerHTML='<span>移动速度</span><input id="v3MoveSpeed" type="range" min="0.20" max="1.20" step="0.05"><b id="v3MoveSpeedOut"></b>';
    footRange.after(row);
    const slider=row.querySelector('input'),out=row.querySelector('b');
    slider.value=labMoveSpeed;out.textContent=labMoveSpeed.toFixed(2)+'×';
    slider.oninput=()=>{labMoveSpeed=Number(slider.value);out.textContent=labMoveSpeed.toFixed(2)+'×';localStorage.setItem(SPEED_KEY,String(labMoveSpeed));};
  }

  const previewSection=[...document.querySelectorAll('.section')].find(el=>el.querySelector('.sectionTitle')?.textContent.includes('最后预览'));
  const previewTiny=previewSection?.querySelector('.tiny');
  if(previewTiny)previewTiny.textContent='循环播放直到你按停止：正常无遮 → B-only → 点1→点2 → 门外活动态 → Hubby 只沿最终墨绿活动区连续走动 → 连续回点2 → B-only → 点2→点1 → 正常无遮 → 下一轮。';

  const editSection=[...document.querySelectorAll('.section')].find(el=>el.querySelector('.sectionTitle')?.textContent.includes('编辑/导出'));
  if(editSection){
    const details=document.createElement('details');
    details.style.marginTop='8px';
    details.innerHTML='<summary style="font-weight:800;font-size:12px;cursor:pointer">参数导入 / draft-1 快照</summary><textarea id="v3ImportBox" placeholder="把复制出来的 JSON 粘贴到这里" style="width:100%;min-height:110px;margin-top:8px;border-radius:10px;padding:8px;background:#120f0e;color:#fff7ef;border:1px solid rgba(255,255,255,.18);font:10px/1.35 ui-monospace,SFMono-Regular,Menlo,monospace"></textarea><div class="bar"><button id="v3ImportDraft">导入并锁为 draft-1</button><button id="v3ImportOnly">只导入</button><button id="v3RestoreDraft">恢复 draft-1</button></div><div class="tiny">draft-1 单独存，不会被后续 A/B/活动区微调覆盖。</div>';
    editSection.appendChild(details);
  }

  function actorDistance(a,b){return Math.hypot((b.x-a.x),groundY(b.z)-groundY(a.z));}
  function moveMs(a,b){return Math.max(850,Math.min(7000,actorDistance(a,b)/(92*Math.max(.2,labMoveSpeed))*1000));}

  function finalWalkGrid(step=6){
    const m=maskCanvas('walk'),c=m.getContext('2d',{willReadFrequently:true}),d=c.getImageData(0,0,W,H).data;
    const cols=Math.floor(W/step)+1,rows=Math.floor(H/step)+1,valid=new Uint8Array(cols*rows),nodes=[];
    for(let gy=0;gy<rows;gy++){
      const y=Math.min(H-1,gy*step);
      if(y<scene.wallBottom-42)continue;
      for(let gx=0;gx<cols;gx++){
        const x=Math.min(W-1,gx*step),idx=gy*cols+gx;
        if(d[(y*W+x)*4+3]>35){valid[idx]=1;nodes.push(idx);}
      }
    }
    return{step,cols,rows,valid,nodes};
  }
  function idxPoint(g,i){const gx=i%g.cols,gy=(i/g.cols)|0;return{x:gx*g.step,z:toZ(gy*g.step)};}
  function nearestNode(g,p,subset=g.nodes){let best=-1,bd=Infinity;for(const i of subset){const q=idxPoint(g,i),dd=actorDistance(p,q);if(dd<bd){bd=dd;best=i;}}return best;}
  const DIR8=[[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]];
  function componentFrom(g,start){
    if(start<0)return[];const seen=new Uint8Array(g.valid.length),q=[start],out=[];seen[start]=1;
    for(let h=0;h<q.length;h++){
      const u=q[h];out.push(u);const x=u%g.cols,y=(u/g.cols)|0;
      for(const [dx,dy] of DIR8){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=g.cols||ny>=g.rows)continue;const v=ny*g.cols+nx;if(g.valid[v]&&!seen[v]){seen[v]=1;q.push(v);}}
    }
    return out;
  }
  function gridPath(g,start,goal){
    if(start<0||goal<0)return[];if(start===goal)return[start];
    const prev=new Int32Array(g.valid.length);prev.fill(-2);const q=[start];prev[start]=-1;
    for(let h=0;h<q.length;h++){
      const u=q[h];if(u===goal)break;const x=u%g.cols,y=(u/g.cols)|0;
      for(const [dx,dy] of DIR8){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=g.cols||ny>=g.rows)continue;const v=ny*g.cols+nx;if(g.valid[v]&&prev[v]===-2){prev[v]=u;q.push(v);}}
    }
    if(prev[goal]===-2)return[];const path=[];for(let u=goal;u>=0;u=prev[u])path.push(u);path.reverse();return path;
  }
  async function movePolyline(points){
    if(points.length<2)return running;
    const seg=[],cum=[0];let total=0;
    for(let i=1;i<points.length;i++){const d=actorDistance(points[i-1],points[i]);seg.push(d);total+=d;cum.push(total);}
    if(total<1){hubbyPos={...points.at(-1)};renderHubby();return running;}
    const ms=Math.max(500,total/(92*Math.max(.2,labMoveSpeed))*1000),start=performance.now();
    return await new Promise(resolve=>{
      function frame(now){
        if(!running)return resolve(false);const dist=Math.min(total,(now-start)/ms*total);let k=0;while(k<seg.length-1&&cum[k+1]<dist)k++;
        const local=seg[k]?Math.max(0,Math.min(1,(dist-cum[k])/seg[k])):1,a=points[k],b=points[k+1];
        hubbyPos={x:a.x+(b.x-a.x)*local,z:a.z+(b.z-a.z)*local};renderHubby();
        if(dist<total)requestAnimationFrame(frame);else resolve(true);
      }
      requestAnimationFrame(frame);
    });
  }
  function thinnedPoints(g,path){
    if(!path.length)return[];const pts=[];for(let i=0;i<path.length;i+=3)pts.push(idxPoint(g,path[i]));const last=idxPoint(g,path.at(-1));if(!pts.length||pts.at(-1).x!==last.x||pts.at(-1).z!==last.z)pts.push(last);return pts;
  }
  async function wanderOnPaintedFloor(){
    const g=finalWalkGrid();if(!g.nodes.length){await wait(900);return running;}
    const start=nearestNode(g,point2),comp=componentFrom(g,start);if(!comp.length){await wait(900);return running;}
    let cur=start,curPoint=idxPoint(g,cur);
    if(actorDistance(point2,curPoint)>2&&!await tween(point2,curPoint,moveMs(point2,curPoint)))return false;
    const hops=Math.max(4,Math.min(7,Math.round(comp.length/90)));
    for(let n=0;n<hops&&running;n++){
      const candidates=[];
      for(let tries=0;tries<90;tries++){
        const v=comp[(Math.random()*comp.length)|0],d=actorDistance(idxPoint(g,cur),idxPoint(g,v));if(d>45&&d<220)candidates.push(v);
      }
      const goal=candidates.length?candidates[(Math.random()*candidates.length)|0]:comp[(Math.random()*comp.length)|0];
      const path=gridPath(g,cur,goal),pts=thinnedPoints(g,path);if(pts.length>1&&!await movePolyline(pts))return false;cur=goal;await wait(180);
    }
    if(!running)return false;curPoint=idxPoint(g,cur);if(actorDistance(curPoint,point2)>2&&!await tween(curPoint,point2,moveMs(curPoint,point2)))return false;
    hubbyPos={...point2};renderHubby();return true;
  }
  async function oneCycle(){
    hubbyPos={...point1};renderHubby();setPreview('normal');await wait(450);if(!running)return false;
    setPreview('B');if(!await tween(point1,point2,moveMs(point1,point2)))return false;
    setPreview('outside');await wait(300);if(!running)return false;if(!await wanderOnPaintedFloor())return false;
    await wait(300);if(!running)return false;setPreview('B');if(!await tween(point2,point1,moveMs(point2,point1)))return false;
    setPreview('normal');await wait(550);return running;
  }

  const runBtn=document.querySelector('#run'),stopBtn=document.querySelector('#stop');
  runBtn.onclick=async()=>{
    if(running||!baseReady)return;running=true;editVisible=false;rebuildAll();badge.textContent='循环预览 · 按停止结束';
    while(running){if(!await oneCycle())break;}
    running=false;setPreview('normal');editVisible=true;rebuildAll();badge.textContent='预览已停止';
  };
  stopBtn.onclick=()=>{running=false;badge.textContent='正在停止…';};

  function payload(){return{canvas:[W,H],maskBase:'pixel-livewire-v1',guideA,guideB,adjust,point1,point2,walkZone:adjust.walk,moveSpeed:labMoveSpeed,semantics:{idle:'no occlusion',start:'enable B; point1 -> point2',outside:'all image occludes Hubby except A interior; temporary walkZone active; Hubby pathfinds only inside final painted walk mask',end:'continuous return to point2; B-only; point2 -> point1; remove B/walkZone; idle; loop until Stop'}};}
  function exportText(){return JSON.stringify(payload(),null,2);}
  function legacyCopy(text){
    const ta=document.createElement('textarea');ta.value=text;ta.readOnly=true;ta.style.cssText='position:fixed;left:-9999px;top:0;opacity:.01';document.body.appendChild(ta);ta.focus();ta.select();ta.setSelectionRange(0,text.length);
    let ok=false;try{ok=document.execCommand('copy')}catch{}ta.remove();return ok;
  }
  const copyBtn=document.querySelector('#copyAll');
  copyBtn.onclick=async()=>{
    const text=exportText();let ok=legacyCopy(text);
    if(!ok&&navigator.clipboard?.writeText){try{await navigator.clipboard.writeText(text);ok=true}catch{}}
    if(ok){copyCount++;copyBtn.textContent='已复制 · '+copyCount;clearTimeout(copyBtn._v3reset);copyBtn._v3reset=setTimeout(()=>copyBtn.textContent='复制全部参数',850);}
    else{copyBtn.textContent='复制失败 · 再点';clearTimeout(copyBtn._v3reset);copyBtn._v3reset=setTimeout(()=>copyBtn.textContent='复制全部参数',1100);prompt('复制参数',text);}
  };

  function applyPayload(p){
    if(!p||typeof p!=='object')throw new Error('不是有效参数对象');
    if(p.adjust){adjust={maskA:Array.isArray(p.adjust.maskA)?p.adjust.maskA:[],maskB:Array.isArray(p.adjust.maskB)?p.adjust.maskB:[],walk:Array.isArray(p.adjust.walk)?p.adjust.walk:[]};}
    if(p.point1)point1={x:Number(p.point1.x),z:Number(p.point1.z)};
    if(p.point2)point2={x:Number(p.point2.x),z:Number(p.point2.z)};
    if(Number.isFinite(Number(p.moveSpeed))){labMoveSpeed=Math.max(.2,Math.min(1.2,Number(p.moveSpeed)));localStorage.setItem(SPEED_KEY,String(labMoveSpeed));const sl=document.querySelector('#v3MoveSpeed'),out=document.querySelector('#v3MoveSpeedOut');if(sl)sl.value=labMoveSpeed;if(out)out.textContent=labMoveSpeed.toFixed(2)+'×';}
    hubbyPos={...point1};save();rebuildAll();renderHubby();renderMarkers();
  }
  const box=document.querySelector('#v3ImportBox');
  document.querySelector('#v3ImportDraft').onclick=()=>{try{const p=JSON.parse(box.value);localStorage.setItem(DRAFT_KEY,JSON.stringify(p));applyPayload(p);badge.textContent='draft-1 已锁定并载入';}catch(e){alert('导入失败：'+e.message);}};
  document.querySelector('#v3ImportOnly').onclick=()=>{try{applyPayload(JSON.parse(box.value));badge.textContent='参数已载入 · draft-1 未改';}catch(e){alert('导入失败：'+e.message);}};
  document.querySelector('#v3RestoreDraft').onclick=()=>{try{const raw=localStorage.getItem(DRAFT_KEY);if(!raw)throw new Error('本机还没有 draft-1');applyPayload(JSON.parse(raw));badge.textContent='已恢复 draft-1';}catch(e){alert(e.message);}};
})();
