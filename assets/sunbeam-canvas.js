(function(){
  var canvas;
  var ctx;
  var raf;
  var particles = [];
  var startTime = Date.now();

  function activeRoom(){
    var room = document.getElementById('gameRoom');
    return room && room.classList.contains('active') ? room : null;
  }

  function ensureCanvas(){
    var room = activeRoom();
    if(!room) return null;
    if(canvas && canvas.parentNode === room) return canvas;

    canvas = document.createElement('canvas');
    canvas.className = 'sunbeamCanvas';
    canvas.setAttribute('aria-hidden','true');
    canvas.style.position = 'absolute';
    canvas.style.inset = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '9';
    canvas.style.mixBlendMode = 'screen';
    canvas.style.opacity = '.42';
    room.appendChild(canvas);
    ctx = canvas.getContext('2d');
    particles = [];
    return canvas;
  }

  function resize(){
    var c = ensureCanvas();
    if(!c) return;
    var rect = c.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = Math.max(1, Math.round(rect.width * dpr));
    var h = Math.max(1, Math.round(rect.height * dpr));
    if(c.width !== w || c.height !== h){
      c.width = w;
      c.height = h;
      ctx = c.getContext('2d');
      ctx.setTransform(dpr,0,0,dpr,0,0);
      seedParticles(rect.width, rect.height);
    }
  }

  function seedParticles(w,h){
    particles = [];
    for(var i=0;i<26;i++){
      particles.push({
        x: w*(0.64 + Math.random()*0.32),
        y: h*(0.08 + Math.random()*0.46),
        r: .45 + Math.random()*1.1,
        a: .06 + Math.random()*.13,
        drift: .18 + Math.random()*.38,
        phase: Math.random()*Math.PI*2
      });
    }
  }

  function drawBeam(w,h,t){
    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    var pulse = 0.82 + Math.sin(t*0.00045)*0.10;

    var g1 = ctx.createLinearGradient(w*.94, h*.08, w*.34, h*.55);
    g1.addColorStop(0, 'rgba(255,226,170,' + (0.115*pulse) + ')');
    g1.addColorStop(.34, 'rgba(255,214,152,' + (0.060*pulse) + ')');
    g1.addColorStop(.72, 'rgba(255,214,152,' + (0.018*pulse) + ')');
    g1.addColorStop(1, 'rgba(255,214,152,0)');

    ctx.beginPath();
    ctx.moveTo(w*.90, h*.03);
    ctx.bezierCurveTo(w*.78, h*.15, w*.66, h*.25, w*.48, h*.43);
    ctx.bezierCurveTo(w*.40, h*.50, w*.35, h*.58, w*.30, h*.66);
    ctx.lineTo(w*.46, h*.69);
    ctx.bezierCurveTo(w*.58, h*.52, w*.73, h*.34, w*.98, h*.16);
    ctx.closePath();
    ctx.fillStyle = g1;
    ctx.filter = 'blur(18px)';
    ctx.fill();

    var g2 = ctx.createLinearGradient(w*.99, h*.12, w*.58, h*.36);
    g2.addColorStop(0, 'rgba(255,245,202,' + (0.070*pulse) + ')');
    g2.addColorStop(.5, 'rgba(255,225,165,' + (0.028*pulse) + ')');
    g2.addColorStop(1, 'rgba(255,225,165,0)');
    ctx.beginPath();
    ctx.moveTo(w*.93, h*.10);
    ctx.lineTo(w*.97, h*.18);
    ctx.lineTo(w*.56, h*.42);
    ctx.lineTo(w*.51, h*.36);
    ctx.closePath();
    ctx.fillStyle = g2;
    ctx.filter = 'blur(11px)';
    ctx.fill();

    ctx.restore();
  }

  function drawDust(w,h,t){
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.filter = 'blur(.25px)';
    particles.forEach(function(p){
      var x = p.x + Math.sin(t*.00025 + p.phase)*4 + (t*.000012*p.drift*w)%18;
      var y = p.y + Math.cos(t*.00032 + p.phase)*5;
      var a = p.a * (0.65 + Math.sin(t*.001 + p.phase)*0.35);
      ctx.beginPath();
      ctx.arc(x, y, p.r, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(255,232,176,' + a + ')';
      ctx.fill();
    });
    ctx.restore();
  }

  function frame(){
    var room = activeRoom();
    if(!room){
      raf = requestAnimationFrame(frame);
      return;
    }
    resize();
    if(!canvas || !ctx){ raf = requestAnimationFrame(frame); return; }
    var rect = canvas.getBoundingClientRect();
    ctx.clearRect(0,0,rect.width,rect.height);
    var t = Date.now() - startTime;
    drawBeam(rect.width, rect.height, t);
    drawDust(rect.width, rect.height, t);
    raf = requestAnimationFrame(frame);
  }

  function start(){
    ensureCanvas();
    resize();
    if(!raf) frame();
  }

  window.KittenNestSunbeamCanvas = { version:'sunbeam-canvas-20260613-1', start:start, resize:resize };
  window.addEventListener('load', start);
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', resize);
  window.addEventListener('pageshow', start);
  document.addEventListener('visibilitychange', function(){ if(!document.hidden) start(); });
  setTimeout(start, 300);
  setTimeout(start, 1200);
})();
