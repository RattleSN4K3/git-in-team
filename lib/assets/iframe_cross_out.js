
// send new path to opener window (in this case the page where gitinteam.js is embedded)
// and close this window
var subpath = window.location.toString().replace(/\/cross\//, '/');
window.opener.postMessage('gitinteam-cross:'+subpath, window.location);
window.close();
