
// es6 runtime requirements
require('babel/polyfill');

// their code
import express from 'express';
import cookieParser  from 'cookie-parser';
import { json, urlencoded } from 'body-parser';
import { Server as http } from 'http';
import dom from 'vd';
import fs from 'fs';
import url from 'url';
import URI from 'URIjs';
import querystring from 'querystring';

// our code
import GitHub from './github-team';
import ghauth from './github-auth';
import ghclear from './github-clear';

import { splash as splash_page } from './pages';
import { auth as auth_page } from './pages';
import { join as join_page } from './pages';
import { cross as cross_page } from './pages';
import { error as error_page } from './pages';
import { cleared as cleared_page } from './pages';
import { disabled as disabled_page } from './pages';
import iframe_page from './iframe';

import badge from './badge';

import { setup as log_setup } from './log';
import { log as log_simple } from './log';
import { log_github } from './log';
import { note, warn, error, info } from './log';

const STRINGS = {

  _data: {
    '' : 'Unknown error.',

    'NO_JOIN_PROCESS' : 'No join process happened.',
    'INVALID_SESSION_MAIN' : 'Invalid or no session. Goto the main page and try again.',
    'INVALID_SESSION_RELOAD' : 'Invalid or no session. Reload the page.',
    'INVALID_SESSION' : 'Invalid or no session.',
    'NO_TOKEN' : 'No token provided',

    'SUCCESS_INIT' : 'WOOT. Wait for Initialization!',
    'NO_CLIENT_ID' : 'No Client ID provided',
    'INVALID_CLIENT_ID' : 'Invalid Client ID provided',
    'NO_CLIENT_SECRET' : 'No Client Secret provided',
    'INVALID_CLIENT_SECRET' : 'Invalid Client Secret provided',
    'CLIENT_SECRET_MATCH' : 'Same value for Client ID and Secret provided',
    'JOIN_NO_STATE' : 'No state. Invalid response',
    'JOIN_STATE_MISMATCH' : 'State differs from stored value. Invalid response',

    'SUCCESS_AUTH' : 'WOOT. Wait for Authorization!',
    'AUTH_NO_CODE' : 'No code. Invalid response',
    'AUTH_NO_STATE' : 'No state. Invalid response',
    'AUTH_STATE_MISMATCH' : 'State differs from stored value. Invalid response',
    'ERROR_AUTH' : 'Error during authorization: {0}',

    'SUCCESS_JOIN' : 'WOOT. Wait for Authorization!',
    'ERROR_JOIN' : 'No code. Invalid response received from GitHub.',
    'ERROR_ADD' : 'Unable to add user to team. Retry!',

    'SUCCESS_CLEAR' : 'WOOT. Wait for De-Authorization',
    'ERROR_CLEAR' : 'Unable to clear authorization. Manually remove it on your GitHub profile settings.',
  },

  has(key){
    for(var id in this._data){
      if (id.toLowerCase() == key.toLowerCase()) return true;
    }
    return false;
  },
  get(key){
    for(var id in this._data){
      if (id.toLowerCase() == key.toLowerCase()) return this._data[id];
    }
    return key;
  }
};

export default function gitinteam({
  org,
  token,
  token_type = "Bearer1",  // jshint ignore:line
  client_id,
  client_secret,
  css,
  silent = false, // jshint ignore:line
  interval = 30000 // jshint ignore:line
}){

  log_setup({silent});
  log_simple("");
  log_simple("Parameters");
  log_simple("-------------------");
  log_simple(`: org: ${org}`);
  log_simple(`: token: ${token}`);
  log_simple(`: client_id: ${client_id}`);
  log_simple(`: client_secret: ${client_secret}`);
  log_simple(`: token_type: ${token_type}`);
  log_simple(`: `);
  log_simple(`: silent: ${silent}`);
  log_simple(`: css: ${css}`);
  log_simple("===================");
  log_simple("");

  // must haves
  if (!org) throw new Error('Must provide an `org`.');
  let setup = {};

  // read config
  let configfile = __dirname + '/config.json';
  let config = loadConfig();

  // override token with stored one
  setup.access_token = config.access_token || token || '';
  setup.client_id = config.client_id || client_id || '';
  setup.client_secret = config.client_secret || client_secret || '';
  setup.token_type = config.token_type || token_type || 'Bearer';

  // setup app
  let app = express();
  let index = express();
  let main = express();
  let admin = express();
  let srv = http(app);
  let assets = __dirname + '/assets';
  app.locals.title = 'Git-in-Team';

  log_simple("");
  log_simple("Git-in-Team");
  log_simple("-------------------");
  log_simple(`: Team ID: ${org}`);
  log_simple(`: `);
  log_simple(`: App ID: ${setup.client_id}`);
  log_simple(`: App Secret: ${setup.client_secret}`);
  log_simple(`: `);
  log_simple(`: Auth Token: ${setup.access_token}`);
  log_simple(`: Auth type: ${setup.token_type}`);
  log_simple("===================");
  log_simple("");

  // initialize session manager
  // as the visit is probably only temporarily, we don't need to persist sessions
  app.use(cookieParser(randomString(16)));

  // parsing application/x-www-form-urlencoded for non-ajax-post responses
  app.use(urlencoded({ extended: true }));

  // github backend
  let github = new GitHub({ token: setup.access_token, org, interval });
  // capture stats
  log_github(github, silent);
  // fetch data
  github.fetchall();

  if (!github.IsValid()){
    app.all('/auth', admin);
    app.all('/callback/auth', admin);
    admin.all('*', json(), (req, res, next) => {
      info(req.method+" "+req.originalUrl);
      next();
    });
  }

  // middleware for waiting for GitHub
  app.use((req, res, next) => {
    if (github.ready) return next();
    github.once('ready', next);
  });

  app.all('*', (req, res, next) => {
    info(req.method+" "+req.originalUrl);
    next();
  });
  main.all('*', json(), (req, res, next) => {
    info(req.method+" "+req.originalUrl);
    next();
  });

  // static files
  app.use('/assets', express.static(assets));

  // badge js
  app.use('/gitinteam.js', express.static(assets + '/badge.js'));

  // routing
  app.all('/join', main);
  app.all('/callback/join', main);
  app.all('/clear', main);
  app.all('/callback/clear', main);
  app.all('/iframe', main);
  app.all('/iframe/dialog', main);
  app.all('/badge.svg', main);


  app.get('/error/:error', (req, res) => {
    let error = STRINGS.get(req.params.error);
    if (!STRINGS.has(req.params.error)){
      warn("Unknown error");
      error = STRINGS.get('');
    }

    if (req.query.errorparm){
      let errorparms = querystring.parse(req.query.errorparm);
      for(var parm in errorparms) {
        error = error.replace(`{${parm}}`, errorparms[parm])
      }
    }
    let innerpage = error_page(error, { css, name: github.data.name, logo: github.data.logo });
    mainPage(req, res, innerpage);
  });

  app.get('/cross/*', (req, res) => {
    if (!verifySession(req, {key: "gitinteam_temp", session: "!", sign: true})){
      ErrorRedirect(req, res, 'NO_JOIN_PROCESS');
      return;
    }

    let { name, title, desc, blog, logo} = github.data.org;
    let { private: count_private, total: count_total } = github.data.members;

    let innerpage = cross_page(req.params.state, { css, name, title, desc, logo });
    mainPage(req, res, innerpage);
  });

  app.get('/join/:state', (req, res) => {
    if (!verifySession(req, {key: "gitinteam_temp", session: "!", sign: true})){
      ErrorRedirect(req, res, 'NO_JOIN_PROCESS');
      return;
    }

    let sessionid = verifySession(req, {only_return: true});
    if (!sessionid){
      ErrorRedirect(req, res, 'INVALID_SESSION');
      return;
    }

    let iframe = 'cross' in req.query;
    let { name, title, desc, blog, logo} = github.data.org;
    let { private: count_private, total: count_total } = github.data.members;

    // clear temp session key
    clearSession(res, {key: "gitinteam_temp"});

    let innerpage = join_page(sessionid, req.params.state, { css, name, title, desc, logo, iframe}, config);
    mainPage(req, res, innerpage);
  });

  app.get('/cleared', (req, res) => {
    if (!verifySession(req, {key: "gitinteam_temp", session: "!", sign: true})){
      ErrorRedirect(req, res, 'NO_JOIN_PROCESS');
      return;
    }

    let iframe = 'cross' in req.query;
    note("Has crss: "+iframe);
    let { name, title, desc, blog, logo} = github.data.org;
    let { private: count_private, total: count_total } = github.data.members;

    // clear temp session key
    clearSession(res, {key: "gitinteam_temp"});

    let innerpage = cleared_page({ css, name, title, desc, logo, iframe});
    mainPage(req, res, innerpage);
  });

  // redirecting to index
  app.get('/', index);
  app.get('/*', (req, res) => {
    res.redirect(URI(getURL(req)).path("").query("").toString());
  });

  // index
  index.use((req, res) => {

    let sessionid;
    let { name, title, desc, blog, logo} = github.data.org;
    let { private: count_private, total: count_total } = github.data.members;

    let innerpage;
    if (!name && !github.IsAborted()) {
      innerpage = disabled_page({ css, org });
    } else {

      // creating new session id
      sessionid = verifySession(res, {create: true, sign: true});

      if (!github.IsValid()) {
        // github oAuth if token is invalid
        innerpage = auth_page(sessionid, { css, org: name, client_id: setup.client_id, client_secret: setup.client_secret });
      } else {
        innerpage = splash_page(sessionid, { css, name, title, desc, logo, private_count: count_private, total_count: count_total });
      }
    }

    mainPage(req, res, innerpage);
  });

  function mainPage(req, res, innerpage){
    let page = dom('html',
      dom('head',
        dom('title',
          'Join ', org, ' on GitHub!'
        ),
        dom('meta name=viewport content="width=device-width,initial-scale=1.0,minimum-scale=1.0,user-scalable=no"'),
        dom('link rel="shortcut icon" href=https://assets-cdn.github.com/favicon.ico'),
        css && dom('link rel=stylesheet', { href: css })
      ),
      innerpage
    );

    res.type('html');
    res.send(page.toHTML());
  }

  admin.get('/auth', (req, res) => {

    let { name, title, desc, blog, logo} = github.data.org;
    let { private: count_private, total: count_total } = github.data.members;

    let innerpage;
    if (!name && !github.IsAborted()) {
      innerpage = disabled_page({ css, org });
    } else {

      // get temp token from config
      let temp_token = config.temp_access_token;
      let temp_type = config.temp_token_type;
      let temp_session = config.temp_session;

      // as the initial session from the auth process is stored in
      // the config file temporarily, we need to verify auth against that session
      // (in order to have a clean URL)
      if (!verifySession(req, {session: temp_session})){
        ErrorRedirect(req, res, 'INVALID_SESSION_MAIN');
        return;
      }

      innerpage = auth_page(temp_session, { css, org: name, token: temp_token, token_type: temp_type, client_id: config.client_id, client_secret: config.client_secret });
    }

    mainPage(req, res, innerpage);
  });

  // auth endpoint
  admin.post('/auth', json(), (req, res, next) => {

    let sessionid = req.body.token;
    if (!verifySession(req)){
      return ErrorRedirect(req, res, 'INVALID_SESSION_RELOAD');
    }

    let method = req.body.method;
    if (method == "accept") {
      note("Accepting access token...");

      let authtoken = req.body.access_token;
      let authtype = req.body.token_type;

      if (!authtoken) {
        return ErrorRedirect(req, res, 'NO_TOKEN');
      }

      delete config.temp_access_token;
      delete config.temp_token_type;
      delete config.temp_session;
      delete config.client_state;
      config['access_token'] = authtoken;
      config['token_type'] = authtype;
      writeConfig();

      setup.access_token = authtoken;
      setup.token_type = authtype;

      github.reInit(authtoken, authtype);

      var currurl = req.protocol + '://' + req.get('host') + req.originalUrl;
      let redirecturl = url.resolve(currurl, '/');

      return ReturnRedirect(req, res, redirecturl, 'SUCCESS_INIT');
    }

    let clientid = req.body.client_id;
    if (!clientid) {
      return ErrorRedirect(req, res, 'NO_CLIENT_ID');
    }
    if (!isHex(clientid)) {
      return ErrorRedirect(req, res, 'INVALID_CLIENT_ID');
    }

    let clientsec = req.body.client_secret;
    if (!clientsec) {
      return ErrorRedirect(req, res, 'NO_CLIENT_SECRET');
    }
    if (!isHex(clientsec)) {
      return ErrorRedirect(req, res, 'INVALID_CLIENT_SECRET');
    }

    if (clientid == clientsec) {
      return ErrorRedirect(req, res, 'CLIENT_SECRET_MATCH');
    }

    // store in config
    config['client_id'] = clientid;
    config['client_secret'] = clientsec;
    config['client_state'] = randomString(8);
    writeConfig();

    setup.client_id = clientid;
    setup.client_secret = clientsec;

    // build callback url
    let callbackurl = URI(getURL(req))
    .path('/callback/auth')
    .addQuery("token", sessionid)
    toString();

    // build redirect url for client
    let redurl = URI("https://github.com/login/oauth/authorize")
    .addQuery("client_id", config.client_id)
    .addQuery("state", config.client_state)
    .addQuery("redirect_uri", callbackurl)
    .addQuery("scope", "admin:org")
    .toString();

    return ReturnRedirect(req, res, redurl, "SUCCESS_AUTH");
  });

  // callback auth request
  admin.get('/callback/auth', (req, res) => {

      let code = req.query.code;
      let state = req.query.state;

      let sessionid = req.query.token;
      if (!verifySession(req)){
        ErrorRedirect(req, res, 'INVALID_SESSION_MAIN');
        return;
      }

      if (!code) {
        ErrorRedirect(req, res, 'AUTH_NO_CODE');
        return;
      }
      if (!state) {
        ErrorRedirect(req, res, 'AUTH_NO_STATE');
        return;
      }

      if (state !== config.client_state) {
        ErrorRedirect(req, res, 'AUTH_STATE_MISMATCH');
        return;
      }

      ghauth(config, {scope: "admin:org", scopename: "Organization-Administration"}, { code, state }, function(err, authtoken, type){
        if (err) {
          // clear failed auth
          if (authtoken){
            ghclear(config, authtoken, (nullerr) => {});
          }

          ErrorRedirect(req, res, 'ERROR_AUTH', [err.message]);
          return;
        }

        config['temp_access_token'] = authtoken;
        config['temp_token_type'] = type;
        config['temp_session'] = sessionid;
        writeConfig();

        // redirect to /auth
        res.redirect(URI(getURL(req)).path("auth").query("").toString());

      });
  });

  // join endpoint
  main.post('/join', json(), (req, res, next) => {
    let sessionid = req.body.token;
    let hascross = 'cross' in req.body;
    note("Session Token: "+sessionid);
    if (!verifySession(req)){
      return ErrorRedirect(req, res, 'INVALID_SESSION_RELOAD');
    }

    // build callback url
    let callbackuri = URI(getURL(req))
    .path('/callback/join')
    .addQuery("token", sessionid);
    if (hascross) callbackurl = callbackuri.addQuery("cross");
    let callbackurl = callbackuri.toString();

    // build redirect url for client
    let redurl = URI("https://github.com/login/oauth/authorize")
    .addQuery("client_id", setup.client_id)
    .addQuery("redirect_uri", callbackurl)
    .toString();

    return ReturnRedirect(req, res, redurl, 'SUCCESS_JOIN', hascross ? 'cross' : '');
  });

  // callback join request
  main.get('/callback/join', (req, res) => {

    let code = req.query.code;
    let state = req.query.state;
    let hascross = 'cross' in req.query;
    warn("Come from cross site: "+hascross);

    if (!verifySession(req)){
      ErrorRedirect(req, res, 'INVALID_SESSION_MAIN');
      return;
    }

    if (!code) {
      ErrorRedirect(req, res, 'ERROR_JOIN');
      return;
    }

    // if (!state) {
    //   ErrorRedirect(req, res, 'JOIN_NO_STATE');
    //   return;
    // }
    // if (state !== setup.client_state) {
    //   ErrorRedirect(req, res, 'JOIN_STATE_MISMATCH');
    //   return;
    // }

    ghauth(setup, {}, { code, state }, (err, jointoken, jointype) => {

      if (err) {
        // clear failed auth
        if (jointoken){
          ghclear(setup, jointoken, (nullerr) => {});
        }

        ErrorRedirect(req, res, 'ERROR_AUTH', [err.message]);
        return;
      }

      github.addToTeam(jointoken, jointype, (success) => {

        if (!success) {
          ErrorRedirect(req, res, 'ERROR_ADD');
          return;
        }

        // store hashed token for verifying if user opens the SUCCESS-page from a valid session
        let session = "!";
        verifySession(res, {key: "gitinteam_temp", session, create: true, sign: true});

        if (hascross){
          // redirect to /cross/PATH
          res.redirect(URI(getURL(req))
          .segment(["cross", "join", success]) // concatenate sub-path
          .query("").query("cross") // clear query and add 'cross' parameter
          .toString());
        } else {
          // redirect to /join/SUCCESS
          res.redirect(URI(getURL(req))
          .segment(["join", success])
          .query("")
          .toString());
        }
      });
    });
  });

  // clear endpoint
  main.post('/clear', json(), (req, res, next) => {
    let sessionid = verifySession(req, {only_return: true});
    let hascross = 'cross' in req.body;
    note("Session Token: "+sessionid);
    if (!verifySession(req)){
      return ErrorRedirect(req, res, 'INVALID_SESSION');
    }

    // build callback url
    let callbackuri = URI(getURL(req))
    .path('/callback/clear')
    .addQuery("token", sessionid);
    if (hascross) callbackurl = callbackuri.addQuery("cross");
    let callbackurl = callbackuri.toString();

    // build redirect url for client
    let redurl = URI("https://github.com/login/oauth/authorize")
    .addQuery("client_id", setup.client_id)
    .addQuery("redirect_uri", callbackurl)
    .toString();

    return ReturnRedirect(req, res, redurl, 'SUCCESS_CLEAR', hascross ? 'cross' : '');
  });

  // callback clear request
  main.get('/callback/clear', (req, res) => {

    let code = req.query.code;
    let state = req.query.state;
    let hascross = 'cross' in req.query;
    warn("Come from cross site: "+hascross);

    if (!verifySession(req)){
      ErrorRedirect(req, res, 'INVALID_SESSION_MAIN');
      return;
    }

    if (!code) {
      ErrorRedirect(req, res, 'ERROR_CLEAR');
      return;
    }

    // if (!state) {
    //   ErrorRedirect(req, res, 'JOIN_NO_STATE');
    //   return;
    // }
    // if (state !== setup.client_state) {
    //   ErrorRedirect(req, res, 'JOIN_STATE_MISMATCH');
    //   return;
    // }

    ghauth(setup, {}, { code, state }, (err, cleartoken, cleartype) => {

      if (err) {
        ErrorRedirect(req, res, 'ERROR_AUTH', [err.message]);
        return;
      }

      ghclear(setup, cleartoken, (err) => {

        if (err) {
          ErrorRedirect(req, res, 'ERROR_CLEAR');
          return;
        }

        // store hashed token for verifying if user opens the SUCCESS-page from a valid session
        let session = "!";
        verifySession(res, {key: "gitinteam_temp", session, create: true, sign: true});

        if (hascross){
          // redirect to /cross/PATH
          res.redirect(URI(getURL(req))
          .path("") // back to root
          .segment(["cross", "cleared"]) // concatenate sub-path
          .query("").query("cross") // clear query and add 'cross' parameter
          .toString());
        } else {
          // redirect to /join/SUCCESS
          res.redirect(URI(getURL(req))
          .path("cleared")
          .query("")
          .toString());
        }
      });
    });
  });

  // iframe
  main.get('/iframe', (req, res) => {
    let large = 'large' in req.query;
    let { private: count_private, total: count_total } = github.data.members;
    res.type('html');
    res.send(iframe_page({ active: count_private, total: count_total, large }).toHTML());
  });

  main.get('/iframe/dialog', (req, res) => {
    let { name, title, desc, blog, logo} = github.data.org;
    let { private: count_private, total: count_total } = github.data.members;

    let page;
    if (!name) {
      page = disabled_page({ css, org, iframe: true });
    } else {
      // creating new session id
      let sessionid = verifySession(res, {create: true, sign: true});

      page = splash_page(sessionid, { css, name, title, desc, logo, private_count: count_private, total_count: count_total, iframe: true }, "../");
    }
    res.type('html');
    res.send(page.toHTML());
  });

  // badge rendering
  main.get('/badge.svg', (req, res) => {
    let text = req.query.t;
    let special = 's' in req.query;
    let {total, private: priv} = github.data.members;

    res.type('svg');
    res.set('Cache-Control', 'max-age=0, no-cache');
    res.set('Pragma', 'no-cache');
    res.send(badge({total, priv}, text, special).toHTML());
  });


  // /////////////////////////////////////////////////////////////
  // Utils
  // /////////////////////////////////////////////////////////////

  function getURL(req){
    return req.protocol + '://' + req.get('host') + req.originalUrl;
  }

  function clearSession(obj, {sign, key} = {sign: true}){
    let checkkey = key || 'gitinteam_session';
    obj.clearCookie(checkkey);
  }

  // create or verify a stored session in the given request object
  function verifySession(obj, {create, session, sign, key, only_return} = {create: false, session: null, sign: true}){
    let checkkey = key || 'gitinteam_session';

    if (create){
      if (obj){
        note("Creating new session token...");
        let newtoken = session || randomString(8);
        obj.cookie(checkkey, newtoken, {signed: sign});
        note(`New Session: ${newtoken}  (signed: ${sign || "no"})`);
        return newtoken;
      }
    } else if (obj) {
      note("Verifying session...");
      let token;
      if (session) // override
        token = session;
      else if (obj.query && obj.query.token) // get
        token = obj.query.token;
      else if (obj.body && obj.body.token) // post
        token = obj.body.token;

      note("Current session:"+token);

      let cookie = undefined;
      let signed = false;
      if (!sign && obj.cookies && obj.cookies[checkkey])
        cookie = obj.cookies[checkkey];
      else if (obj.signedCookies && obj.signedCookies[checkkey]){
        cookie = obj.signedCookies[checkkey];
        signed = true;
      }

      if (only_return){
        return cookie;
      }

      note(`Cookie session: ${cookie} (signed: ${signed || "no"})`);
      if (token && cookie) {
        return token === cookie;
      }
    }

    return false;
  }

  function ReturnRedirect(req, res, redirecturl, msg_id, overridetype = ''){
    let type = req.get('Content-Type');
    if (!type || req.is('application/x-www-form-urlencoded')){
      return res.redirect(redirecturl);
    } else {
      return res
      .status(200)
      .json({ type: (overridetype != '' ? overridetype : 'redirect'), location: redirecturl, msg: STRINGS.get(msg_id)});
    }
  }

  function ErrorRedirect(req, res, strings_id, errorparms = []) {
    let type = req.get('Content-Type');
    if (!type || req.is('application/x-www-form-urlencoded')){
      // generate query string from error parms and pass it to the url
      let errorquery = encodeURIComponent(querystring.stringify(errorparms));
      if (errorquery) errorquery = `?errorparm=${errorquery}`;
      return res.redirect(`/error/${strings_id.toLowerCase()}${errorquery}`);
    } else {
      return res
      .status(400)
      .json({ msg: STRINGS.get(strings_id, errorparms)});
    }
  }

  function isHex(s){
    return (s.length % 2 == 0) && (s.match(new RegExp('^[0-9A-Fa-f]*$')));
  }

  function randomInt(low, high) {
    return Math.random() * (high - low) + low;
  }

  function randomString(n) {
    var s = "";
    for (var i = 0; i < n; i++) {
      var r = randomInt(65, 91);
      s += String.fromCharCode(r);
    }
    return s;
  }

  // Load config defaults from JSON file.
  // Environment variables override defaults.
  function loadConfig() {
    if (fs.existsSync(configfile)) {
      var config = JSON.parse(fs.readFileSync(configfile, 'utf-8'));
      for (var i in config) {
        config[i] = process.env[i.toUpperCase()] || config[i];
      }
      return config;
    };
    return {};
  }

  function writeConfig() {
    var data = JSON.stringify(config);
    fs.writeFile(configfile, data, function (err) {
      if (err) throw err;
    });
  }

  return srv;
}
