(function(){
  var VERSION='scene-overlay-lifecycle-clean-20260617-promoted-1';
  var runId=0;
  var cards={
    'home.clockHandsOverlay':{scene:'home',selector:'#home .clock',image:'#homeOn',fallbackImage:'#homeOff',coord:{x:.2108,y:.3353,width:.312,aspectRatio:1}},
    'coffeeCorner.steamOverlay':{scene:'coffeeCorner',selector:'#gameRoom .steam',image:'#gameBg',coord:{x:.503,y:.313,width:.086,height:.132}},
    'coffeeCorner.photoGlowOverlay':{scene:'coffeeCorner',selector:'#gameRoom .photoGlow',image:'#gameBg',coord:{x:.280,y:.225,width:.440,height:.250}}
  };
  function $(id){return document.getElementById(id)}
  function scene(){
    var h=$('home'),g=$('gameRoom');
    if(document.body.classList.contains('sceneRouterCleanLap')) return 'lapClose';
    if(document.body.classList.contains('scene-atlas')) return 'nestAtlas';
    if(g&&g.classList.contains('active')) return 'coffeeCorner';
    if(h&&h.classList.contains('active')) return 'home';
    return 'unknown';
  }
  function image(card){
    var img=document.querySelector(card.image||'');
    if(img&&img.naturalWidth) return img;
    return img || (card.fallbackImage?document.querySelector(card.fallbackImage):null);
  }
  function ready(img){return !!(img&&img.complete&&img.naturalWidth&&img.naturalHeight)}
  function waitImg(img){
    if(!img) return Promise.resolve(false);
    if(ready(img)) return img.decode?img.decode().then(function(){return true}).catch(function(){return true}):Promise.resolve(true);
    return new Promise(function(resolve){
      var done=false;
      function finish(v){if(done)return;done=true;resolve(v)}
      img.addEventListener('load',function(){finish(true)},{once:true});
      img.addEventListener('error',function(){finish(false)},{once:true});
      setTimeout(function(){finish(ready(img))},1200);
    });
  }
  function box(img){
    if(!ready(img)) return null;
    var r=img.getBoundingClientRect(),nw=img.naturalWidth,nh=img.naturalHeight;
    if(!r.width||!r.height||!nw||!nh) return null;
    var br=r.width/r.height,ir=nw/nh,w=r.width,h=r.height,x=0,y=0;
    if(br>ir){h=r.width/ir;y=(r.height-h)/2}else{w=r.height*ir;x=(r.width-w)/2}
    return{left:r.left+x,top:r.top+y,width:w,height:h};
  }
  function imp(el,n,v){el.style.setProperty(n,v,'important')}
  function hide(el,id){if(!el)return;imp(el,'opacity','0');imp(el,'pointer-events','none');el.removeAttribute('data-positioner-applied');el.setAttribute('data-scene-overlay-hidden',id||'inactive')}
  function show(el,id){if(!el)return;el.style.removeProperty('opacity');el.style.removeProperty('pointer-events');el.removeAttribute('data-scene-overlay-hidden');el.setAttribute('data-positioner-applied','1');el.setAttribute('data-scene-overlay-owner',VERSION);el.setAttribute('data-scene-overlay-id',id)}
  function hideStale(current){Object.keys(cards).forEach(function(id){var c=cards[id],el=document.querySelector(c.selector);if(c.scene!==current)hide(el,id)})}
  function place(id,current){
    var c=cards[id]; if(!c||c.scene!==current)return true;
    var el=document.querySelector(c.selector),img=image(c),b=box(img); if(!el||!b){hide(el,id);return false}
    var pr=(el.offsetParent||document.body).getBoundingClientRect(),p=c.coord;
    var w=b.width*p.width,h=p.height!=null?b.height*p.height:w/(p.aspectRatio||1);
    var cx=b.left+b.width*p.x,cy=b.top+b.height*p.y;
    imp(el,'left',(cx-pr.left-w/2)+'px');imp(el,'top',(cy-pr.top-h/2)+'px');imp(el,'right','auto');imp(el,'bottom','auto');imp(el,'width',w+'px');imp(el,'height',h+'px');
    show(el,id);return true;
  }
  function idsFor(s){return Object.keys(cards).filter(function(id){return cards[id].scene===s})}
  function raf(){return new Promise(function(r){requestAnimationFrame(function(){requestAnimationFrame(r)})})}
  async function reconcile(reason){
    var token=++runId,s=scene(),ids=idsFor(s);
    document.body.setAttribute('data-scene-overlay-lifecycle-clean',VERSION);
    document.body.setAttribute('data-scene-overlay-lifecycle-clean-scene',s);
    document.body.removeAttribute('data-scene-overlay-lifecycle-clean-ready');
    hideStale(s);
    for(var i=0;i<ids.length;i++){await waitImg(image(cards[ids[i]]));if(token!==runId)return}
    await raf(); if(token!==runId)return;
    var ok=true; ids.forEach(function(id){ok=place(id,s)&&ok});
    if(ok)document.body.setAttribute('data-scene-overlay-lifecycle-clean-ready',s);
    else if(ids.length)setTimeout(function(){if(token===runId)reconcile('retry:'+(reason||'request'))},160);
  }
  function request(reason){reconcile(reason||'request')}
  function bindImg(img){if(!img||img.dataset.sceneOverlayLifecycleCleanBound==='1')return;img.dataset.sceneOverlayLifecycleCleanBound='1';img.addEventListener('load',function(){request('image-load')});img.addEventListener('error',function(){request('image-error')})}
  function boot(){
    bindImg($('homeOn'));bindImg($('homeOff'));bindImg($('gameBg'));request('boot');
    ['pageshow','focus','resize','orientationchange'].forEach(function(n){window.addEventListener(n,function(){request(n)})});
    document.addEventListener('visibilitychange',function(){if(!document.hidden)request('visibility')});
    if(window.MutationObserver){[$('home'),$('gameRoom'),document.body].forEach(function(el){if(el)new MutationObserver(function(){request('class-change')}).observe(el,{attributes:true,attributeFilter:['class']})})}
  }
  window.KittenNestSceneOverlayLifecycleClean={version:VERSION,cards:cards,request:request,currentScene:scene,coverBox:box};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
