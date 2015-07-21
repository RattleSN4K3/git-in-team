(function(){

  // give up and resort to `target=_blank`
  // if we're not modern enough
  if (!document.body.getBoundingClientRect
   || !document.body.querySelectorAll
   || !window.postMessage) {
    return;
  }

  if (top != window){
    refresh();
  }

  window.addEventListener('message', function (ev) {
    if (/^gitinteam-cross:/.test(ev.data)) {
      result = ev.data.replace(/^gitinteam-cross:/, '');
      window.location = result;
    }
  });


  var lastHeight;
  function refresh(){
    var height = Math.ceil(document.body.getBoundingClientRect().height);
    if (lastHeight != height) {
      lastHeight = height;
      parent.postMessage('gitinteam-height:' + height, '*');
    }
  }

})();
