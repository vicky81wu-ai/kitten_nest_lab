(function(){
  var VERSION = 'scene-text-port-clean-controller-20260617-test-2';

  function cleanList(value){
    return Array.isArray(value)
      ? value.map(function(x){ return String(x || '').trim(); }).filter(Boolean)
      : [];
  }

  function qs(root, selector){
    return (root || document).querySelector(selector);
  }

  function coverBox(image){
    if(!image) return null;
    var r = image.getBoundingClientRect();
    var nw = image.naturalWidth || r.width;
    var nh = image.naturalHeight || r.height;
    if(!r.width || !r.height || !nw || !nh) return null;
    var br = r.width / r.height;
    var ir = nw / nh;
    var w = r.width;
    var h = r.height;
    var x = 0;
    var y = 0;
    if(br > ir){ h = r.width / ir; y = (r.height - h) / 2; }
    else{ w = r.height * ir; x = (r.width - w) / 2; }
    return { left:r.left + x, top:r.top + y, width:w, height:h };
  }

  function readTextPortState(state, config){
    var fields = config.stateFields || {};
    var fallback = config.fallbackStateFields || {};
    var queue = cleanList(state && state[fields.queue]);
    if(queue.length) return { source:fields.queue, items:queue, index:Number(state && state[fields.index] || 0) || 0 };
    var single = state && state[fields.single];
    if(single) return { source:fields.single, items:[String(single).trim()].filter(Boolean), index:Number(state && state[fields.index] || 0) || 0 };
    var fallbackQueue = cleanList(state && state[fallback.queue]);
    if(fallbackQueue.length) return { source:fallback.queue + ' fallback', items:fallbackQueue, index:Number(state && state[fallback.index] || 0) || 0 };
    var fallbackSingle = state && state[fallback.single];
    if(fallbackSingle) return { source:fallback.single + ' fallback', items:[String(fallbackSingle).trim()].filter(Boolean), index:Number(state && state[fallback.index] || 0) || 0 };
    return { source:'initialQueue', items:cleanList(config.initialQueue), index:0 };
  }

  function create(config){
    if(!config || !config.textPort || !config.textPort.selector) throw new Error('textPort.selector is required');
    var root = config.rootSelector ? qs(document, config.rootSelector) : document;
    var textEl = qs(root, config.textPort.selector);
    var imageEl = qs(root, config.imageSelector || '#gameBg');
    var containerEl = qs(root, config.containerSelector || '#gameRoom') || root;
    var triggerEl = config.trigger && config.trigger.selector ? qs(root, config.trigger.selector) : null;
    var queue = cleanList(config.initialQueue);
    var index = 0;
    var visible = config.initialVisible !== false;
    var state = null;
    var events = [];
    var lastPointerAt = 0;
    var pointerGuardMs = Number(config.pointerGuardMs || 260);
    var onRender = typeof config.onRender === 'function' ? config.onRender : null;

    function log(name){
      events.unshift(new Date().toLocaleTimeString() + ' ' + name);
      events = events.slice(0, Number(config.eventLimit || 8));
      if(onRender) onRender(api);
    }

    function current(){
      if(!queue.length) return '';
      return queue[((index % queue.length) + queue.length) % queue.length] || '';
    }

    function prepareAttrs(){
      textEl = textEl || qs(root, config.textPort.selector);
      if(!textEl) return false;
      textEl.setAttribute('data-owner', config.owner || 'sceneTextPortCleanController');
      textEl.setAttribute('data-text-port-id', config.id || 'textPort.clean');
      if(config.canonicalTag) textEl.setAttribute('data-canonical-tag', config.canonicalTag);
      return true;
    }

    function placeText(){
      textEl = textEl || qs(root, config.textPort.selector);
      imageEl = imageEl || qs(root, config.imageSelector || '#gameBg');
      containerEl = containerEl || qs(root, config.containerSelector || '#gameRoom') || root;
      if(!textEl || !imageEl || !containerEl) return false;
      var box = coverBox(imageEl);
      if(!box) return false;
      var parent = containerEl.getBoundingClientRect();
      var c = config.textPort.coordinate || {};
      var w = box.width * Number(c.width || 0.42);
      textEl.style.width = w + 'px';
      textEl.style.maxWidth = w + 'px';
      textEl.style.height = 'auto';
      var anchor = c.anchor || 'bottomRight';
      var h = textEl.offsetHeight || textEl.getBoundingClientRect().height || 0;
      if(anchor === 'bottomFromBaseline'){
        var baseText = c.baselineText || current();
        var oldText = textEl.textContent;
        textEl.textContent = String(baseText || '');
        textEl.style.visibility = 'hidden';
        var baselineHeight = textEl.offsetHeight || textEl.getBoundingClientRect().height || 0;
        textEl.textContent = oldText;
        textEl.style.visibility = '';
        var bottom = box.top + box.height * Number(c.y || 0) + baselineHeight;
        textEl.style.left = (box.left + box.width * Number(c.x || 0) - parent.left) + 'px';
        textEl.style.top = (bottom - h - parent.top) + 'px';
        return true;
      }
      if(anchor === 'bottomRight'){
        var right = box.left + box.width * Number(c.x || 0);
        var bottomRight = box.top + box.height * Number(c.y || 0);
        textEl.style.left = (right - w - parent.left) + 'px';
        textEl.style.top = (bottomRight - h - parent.top) + 'px';
        return true;
      }
      textEl.style.left = (box.left + box.width * Number(c.x || 0) - parent.left) + 'px';
      textEl.style.top = (box.top + box.height * Number(c.y || 0) - parent.top) + 'px';
      return true;
    }

    function placeTrigger(){
      if(!triggerEl || !config.trigger || !config.trigger.coordinate) return false;
      imageEl = imageEl || qs(root, config.imageSelector || '#gameBg');
      containerEl = containerEl || qs(root, config.containerSelector || '#gameRoom') || root;
      var box = coverBox(imageEl);
      if(!box) return false;
      var parent = containerEl.getBoundingClientRect();
      var c = config.trigger.coordinate;
      var w = box.width * Number(c.width || 0.1);
      var h = box.height * Number(c.height || 0.1);
      var cx = box.left + box.width * Number(c.x || 0);
      var cy = box.top + box.height * Number(c.y || 0);
      triggerEl.style.left = (cx - w / 2 - parent.left) + 'px';
      triggerEl.style.top = (cy - h / 2 - parent.top) + 'px';
      triggerEl.style.width = w + 'px';
      triggerEl.style.height = h + 'px';
      return true;
    }

    function render(){
      textEl = textEl || qs(root, config.textPort.selector);
      if(!textEl) return false;
      prepareAttrs();
      textEl.textContent = current();
      textEl.classList.toggle(config.hiddenClass || 'hidden', !visible);
      placeText();
      placeTrigger();
      if(onRender) onRender(api);
      return true;
    }

    function setQueue(items, nextIndex, sourceState){
      queue = cleanList(items);
      index = Number(nextIndex || 0) || 0;
      if(sourceState) state = sourceState;
      render();
      return api;
    }

    function sync(nextState){
      var parsed = readTextPortState(nextState, config);
      state = nextState || null;
      queue = parsed.items.length ? parsed.items : queue;
      index = parsed.index || 0;
      if(config.showOnStateLoad !== false) visible = true;
      render();
      log('state.' + parsed.source);
      return parsed;
    }

    async function loadState(){
      if(config.stateUrl === false) return null;
      try{
        var url = config.stateUrl || '/api/state';
        var res = await fetch(url + (url.indexOf('?') === -1 ? '?' : '&') + 't=' + Date.now(), { cache:'no-store' });
        if(!res.ok) throw new Error('state http ' + res.status);
        var data = await res.json();
        return sync(data);
      }catch(e){
        log('state.fallback');
        render();
        return null;
      }
    }

    function hide(){ visible = false; render(); log('hide'); return api; }
    function show(){ visible = true; render(); log('show'); return api; }
    function showNext(){ if(queue.length > 1) index = (index + 1) % queue.length; visible = true; render(); log('showNext'); return api; }
    function toggleNext(){ return visible ? hide() : showNext(); }
    function guard(e, action){
      if(e){
        e.preventDefault();
        e.stopPropagation();
        if(e.stopImmediatePropagation) e.stopImmediatePropagation();
      }
      var now = Date.now();
      if(now - lastPointerAt < pointerGuardMs) return api;
      lastPointerAt = now;
      return action();
    }

    function bind(){
      if(textEl && !textEl.__sceneTextPortCleanBound){
        textEl.__sceneTextPortCleanBound = true;
        textEl.addEventListener('pointerup', function(e){ guard(e, hide); }, true);
      }
      if(triggerEl && !triggerEl.__sceneTextPortCleanBound){
        triggerEl.__sceneTextPortCleanBound = true;
        triggerEl.addEventListener('pointerup', function(e){ guard(e, toggleNext); }, true);
      }
      window.addEventListener('resize', render);
      window.addEventListener('orientationchange', function(){ setTimeout(render, 120); });
      if(imageEl) imageEl.addEventListener('load', render);
      return api;
    }

    var api = {
      version:VERSION,
      id:config.id,
      config:config,
      get state(){ return state; },
      get queue(){ return queue.slice(); },
      get index(){ return index; },
      get visible(){ return visible; },
      get events(){ return events.slice(); },
      current:current,
      render:render,
      loadState:loadState,
      sync:sync,
      setQueue:setQueue,
      hide:hide,
      show:show,
      showNext:showNext,
      toggleNext:toggleNext,
      bind:bind,
      placeText:placeText,
      placeTrigger:placeTrigger
    };

    bind();
    prepareAttrs();
    if(config.deferInitialRenderUntilState && config.autoLoadState !== false){
      if(textEl){
        textEl.textContent = '';
        textEl.classList.add(config.hiddenClass || 'hidden');
      }
      placeTrigger();
      if(onRender) onRender(api);
      loadState();
    }else{
      render();
      if(config.autoLoadState !== false) loadState();
    }
    return api;
  }

  window.KittenNestSceneTextPortClean = {
    version:VERSION,
    create:create,
    readTextPortState:readTextPortState,
    coverBox:coverBox
  };
})();