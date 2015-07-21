
var body = document.body;

// elements
var select = body.querySelector('select');
var button = body.querySelector('button');
var button = body.querySelector('button');

// capture submit
body.addEventListener('submit', function(ev){
  ev.preventDefault();

  // add loading state
  addClass(button, "loading");

  button.disabled = true;
  button.innerHTML = 'Please wait...';

  var data = {};
  var inputs = body.querySelectorAll('form input');
  for (var inp of inputs) {
    data[inp.name] = inp.value;
  }

  var form = body.querySelector('#postdata_form');

  postData(form.getAttribute('action'), data, function(err, msg = ""){
    removeClass(button, "btn-marketing");
    if (err) {
      button.removeAttribute('disabled');
      addClass(button, "btn-danger")
      addClass(button, "selected")
      button.innerHTML = err.message;
    } else {
      addClass(button, "btn-primary")
      if (msg && msg != "") button.innerHTML = msg;
    }
  });
});

function postData(path, data, fn){
  if (path === null){
    return fn(new Error('No URL to post data to'));
  }

  $.ajax({
    type: 'post',
    url: path,
    contentType: 'application/json',
    data: JSON.stringify(data),
    dataType: 'json',
    async: false,
    error: function(e) {
      if (e.responseJSON && e.responseJSON.msg){
        var err = new Error(e.responseJSON.msg || 'Server error');
        return fn(err);
      } else {
        return fn(new Error('Unknown error'));
      }
    },
    success: function(data){
      fn(null, data.msg);

      // redirect on wish and valid location
      if (data.type == "redirect" && data.location)
      {
        window.location = data.location;
      }
      else if (data.type == "cross" && data.location)
      {
        window.open(data.location, '_blank');
      }
    }
  });
}

function hasClass(elem, cls) {
    return elem != null && elem.className.match(new RegExp('(\\s|^)' + cls + '(\\s|$)'));
}
function addClass(elem, cls) {
    if (!hasClass(elem, cls)) elem.className += " " + cls;
}
function removeClass(elem, cls) {
    if (hasClass(elem, cls)) {
        var reg = new RegExp('(\\s|^)' + cls + '(\\s|$)');
        elem.className = elem.className.replace(reg, ' ');
    }
}
