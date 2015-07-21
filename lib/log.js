
import dbg from 'debug';
const debug = dbg('gitinteam');

let disabled = true;

export function setup({silent}){
  if (silent) disabled = disabled || silent;
}

export function log(msg, force = false){
  if (disabled && !force) return;
  out(msg);
}

export function note(msg){
  if (disabled) return;
  out("\u001b[92m"+msg+"\u001b[39m");
}

export function warn(msg){
  if (disabled) return;
  out("\u001b[93m"+msg+"\u001b[39m");
}

export function error(msg){
  if (disabled) return;
  out("\u001b[91m"+msg+"\u001b[39m");
}

export function info(msg){
  if (disabled) return;
  out("\u001b[94m"+msg+"\u001b[39m");
}

export function log_github(github, silent){
  // keep track of elapsed time
  let last = "";

  log('Fetching data from GitHub...');

  // attach events
  github.on('ready', () => out('ready'));
  github.on('retry', () => out('retrying'));
  github.on('fetch', (message) => {
    if (!disabled) out('fetch: '+message);
  });
  github.on('data', dataReceived_Initial);
  github.on('update', dataReceived_Update);

  // log initial data
  function dataReceived_Initial(){
    out('Data from GitHub received.');
    out('-------------------');
    out('Name: %s', github.data.org.name);
    out('Title: %s', github.data.org.title);
    out('Description: %s', github.data.org.desc);
    out('Blog: %s', github.data.org.blog);
    out('');

    out('Team ID: %s', github.data.team_id);

    out('');
    out('Update every %s ms', github.interval);

    dataReceived_Update();
    out('===================');
  }

  // log members
  function dataReceived_Update(){
    out('Member count: private %d, public %d, total %d %s',
      github.data.members.private,
      github.data.members.public,
      github.data.members.total,
      last ? `(+${new Date - last}ms)` : '');

    last = new Date;
  }

  // print out warnings
  github.on('warning', (err) => {
    console.log('%s - \u001b[93m%s\u001b[39m', timestamp(), err.message);
  });

  // print out errors
  if (!silent) {
    github.on('error', (err) => {
      console.error('%s - ' + err.stack, timestamp());
    });
    github.on('ready', () => {
      if (!github.data.org.logo && !silent) {
        console.warn('\u001b[92mWARN: no logo configured\u001b[39m');
      }
    });
  }

  function log(...args){
    if (silent) return debug(...args);
    out(...args);
  }
}

function out(...args){
  args[0] = `${timestamp()} - ${args[0]}`;
  console.log(...args);
}

function timestamp(){
  return new Date().toISOString();
}
