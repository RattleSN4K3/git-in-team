import request from 'superagent';
import { EventEmitter } from 'events';
import fs from 'fs';
import li from 'li'; // parse-links

import {note} from './log';
import {warn} from './log';

const DEFAULT_AUTH_TYPE = "Bearer";
const cachefile = __dirname + '/github_cache.json';

export default class GitHubTeamData extends EventEmitter {


  constructor({ token, token_type, org: host, interval }){
    this.host = host;
    this.interval = interval;

    // data from github
    this.data = {};
    this.data.org = {};
    this.data.members = {};
    this.data.teams = {};
    this.data.teamsByName = {};
    this.data.team_id = 0;

    this.reInit(token, token_type || DEFAULT_AUTH_TYPE);
  }

  reInit(token, type, updatefetch = true){
    this.initial = false;
    this.ready = false;
    this.aborted = false;

    this.token = token;
    this.token_type = type;
    this.has_valid_token = (token != undefined && token != 0 && token != "0");

    this.fetching = [];
    this.fetch = ["public", "members", "teams"];
    if (updatefetch) this.fetchall();

    if (this.timerupdate) clearTimeout(this.timerupdate);
    if (this.interval > 0){
      note(`Update GitHub Team data every ${this.interval}ms`);
      this.update();
    }
  }

  IsValid(){
    return this.has_valid_token;
  }

  IsAborted(){
    return this.aborted;
  }

  update(){
    note("Update");
    this.timerupdate = setTimeout(this.update.bind(this), this.interval);
    if (this.fetch.length == 0) {
      this.fetching = [];
      this.fetch = ["public", "members", "team"];
      this.fetchall();
    }
  }

  fetchall(){
    note("Fetch all");

    if (this.shouldFetch("public") && !this.isFetching("public")) this.fetch_public();
    if (this.shouldFetch("members") && !this.isFetching("members")) this.fetch_members();
    if (this.shouldFetch("teams") && !this.isFetching("teams")) this.fetch_teams();
    if (this.shouldFetch("team") && !this.isFetching("team")) this.fetch_team();

    if (this.fetch.length == 0) {
      clearTimeout(this.timerfetch);

      this.can_read = this.token != null && this.token != 0;
      if (!this.data.members.total || this.data.members.total == 0) this.data.members.total = this.data.members.public;
      this.data.members.private = this.data.members.total - this.data.members.public;

      if (!this.initial) {
        if (!this.aborted){
          this._writeCache();
        } else {
          warn("Using cached data")
          this._loadCache();
        }
        this.emit('data');
        this.initial = true;

        this.ready = true;
        this.emit('ready');
      } else {
        this.emit('update');
      }
    }
    else {
      this.timerfetch = setTimeout(this.fetchall.bind(this), 1000);
    }
  }

  fetch_public(){
    note("Fetch public");
    this.setFetching("public");

    request
    .get(`https://api.github.com/orgs/${this.host}`)
    // using auth token if valid to bypass rate-limit
    .set(this.has_valid_token ? {'Authorization': `${this.token_type} ${this.token}`} : {})
    .end((err, res) => {
      this.onDataReceived_Public(err, res);
    });
    this.emit('fetch', 'public');
  }

  fetch_members(){
    note("Fetch members");
    this.setFetching("members");

    request
    .get(`https://api.github.com/orgs/${this.host}/public_members?per_page=1`)
    // using auth token if valid to bypass rate-limit
    .set(this.has_valid_token ? {'Authorization': `${this.token_type} ${this.token}`} : {})
    .end((err, res) => {
      this.onDataReceived_Members(err, res);
    });
    this.emit('fetch', 'members');
  }

  fetch_teams(){
    note("Fetch teams");
    this.setFetching("teams");

    request
    .get(`https://api.github.com/orgs/${this.host}/teams`)
    .set('Authorization', `${this.token_type} ${this.token}`)
    .end((err, res) => {
      this.onDataReceived_Teams(err, res);
    });
    this.emit('fetch', 'teams');
  }

  fetch_team(){
    note("Fetch specific team");
    this.setFetching("team");

    request
    .get(`https://api.github.com/teams/${this.data.team_id}`)
    .set('Authorization', `${this.token_type} ${this.token}`)
    .end((err, res) => {
      this.onDataReceived_Team(err, res);
    });
    this.emit('fetch', 'team');
  }

  getTeamId(name){
    let team = this.teamsByName[name];
    return team ? team.id: null;
  }

  addToTeam(token, type, fn) {
    note("Add to team");

    // first fetch user info
    note(`Using ${type} ${token}`);
    request
    .get(`https://api.github.com/user`)
    .set('Authorization', `${type || DEFAULT_AUTH_TYPE} ${token}`)
    .end((err, res) => {
      this.onResponse_AddToTeam(err, res, fn);
    });
  }

  emitError(msg){
    this.aborted = true;

    this.clearFetch();
    let err = new Error(msg);
    this.emit('error', err);
  }
  emitWarning(msg, abort = false){
    if (abort){
      this.aborted = true;
      this.clearFetch();
    }
    let err = new Error(msg);
    this.emit('warning', err);
  }

  onDataReceived_Public(err, res){
    note("Data public");

    var file = __dirname + '/github_public.json';
    var data = JSON.stringify(res.body);
    fs.writeFile(file, data, function (err) {
      if (err) throw err;
    });

    if (err) {
      this.emitError(`Fetching public data - ${err.message}`);
      return;
    }

    if (!res.body){
      this.emitError(`Fetching public data - invalid GitHub response: ${res.status}`);
      return;
    }

    if (res.status == 403){
      this.emitWarning(`Fetching public data - Forbidden: ${res.body.message ? res.body.message : res.status}`, true);
      return;
    }

    let team = res.body;
    this.data.org.name = team.login;
    this.data.org.title = team.name;
    this.data.org.desc = team.description;
    this.data.org.blog = team.blog;

    this.data.org.logo = team.avatar_url;

    this.clearFetching("public");
    this.setFetched("public");
  }

  onDataReceived_Members(err, res){
    note("Data members");

    if (err) {
      this.emitError(`Fetching public member count - ${err.message}`);
      return;
    }

    // default public count to 0
    this.data.members.public = 0;

    if (res.status == 403 || res.status == 401){
      this.emitWarning(`Fetching public member count - Forbidden: ${res.body.message ? res.body.message : res.status}`, true);
      return;
    }

    var file = __dirname + '/github_members_body.json';
    var data = JSON.stringify(res.body);
    fs.writeFile(file, data, function (err) {
      if (err) throw err;
    });

    file = __dirname + '/github_members_res.json';
    data = JSON.stringify(res);
    fs.writeFile(file, data, function (err) {
      if (err) throw err;
    });

    if (res.header.link){
      let links = li.parse(res.header.link);

      if (links && links.last){
        let count = links.last.match(/page=(\d+)$/)[1];
        note("Count: "+count);

        this.data.members.public = parseInt(count);
      }

    } else if (res.body) {

      // count the number of members for this response
      (res.body || []).forEach(member => {
        this.data.members.public += 1;
      });
    }

    this.clearFetching("members");
    this.setFetched("members");
  }

  onDataReceived_Teams(err, res){
    note("Data teams");

    if (err) {
      this.emitError(`Fetching teams - ${err.message}`);
      return;
    }

    if (res.status == 403){
      this.emitWarning(`Fetching teams - Forbidden: ${res.body.message ? res.body.message : res.status}`, true);
      return;
    }

    if (res.status == 200) {
      var file = __dirname + '/github_teams.json';
      var data = JSON.stringify(res.body);
      fs.writeFile(file, data, function (err) {
        if (err) throw err;
      });

      // reset the list of teams
      this.data.teams = {};
      (res.body || []).forEach(team => {
        // note(team.name);
        if (team.slug == "people") {
          note("main team found: "+team.id);
          this.data.team_id = team.id;
          this.addFetch("team");
        }

        this.data.teamsByName[team.slug] = team;
      });
    }

    this.clearFetching("teams");
    this.setFetched("teams");
  }

  onDataReceived_Team(err, res){
    note("Data specific team");
    if (err) {
      this.emitError(`Fetching team - ${err.message}`);
      return;
    }

    var file = __dirname + '/github_team.json';
    var data = JSON.stringify(res.body);
    fs.writeFile(file, data, function (err) {
      if (err) throw err;
    });

    this.data.members.total = res.body.members_count;
    note("Total Member count: "+this.data.members.total);

    this.clearFetching("team");
    this.setFetched("team");
  }

  onResponse_AddToTeam(err, res, fn){
    note("Data AddToTeam");
    if (err) {
      this.emit('error', err);
      return;
    }

    var file = __dirname + '/github_user.json';
    var data = JSON.stringify(res.body);
    fs.writeFile(file, data, function (err) {
      if (err) throw err;
    });

    let username = res.body.login;
    if (!username) {
      let err = new Error(`Invalid GitHub response: No username`);
      this.emit('error', err);
      return;
    }

    let posturl = `https://api.github.com/teams/${this.data.team_id}/memberships/${username}`;
    note(`posting to: ${posturl}`);
    note(`Using ${this.token_type} ${this.token}`);

    // send put to add to team
    request
    .put(posturl)
    .set('Authorization', `${this.token_type} ${this.token}`)
    .end((err, res) => {
      this.onResponse_AddedToTeam(err, res, fn);
    });
  }

  onResponse_AddedToTeam(err, res, fn){
    note("Data AddedToTeam");
    if (err) {
      this.emit('error', err);
      return;
    }

    var file = __dirname + '/github_user_response.json';
    var data = JSON.stringify(res.body);
    fs.writeFile(file, data, function (err) {
      if (err) throw err;
    });

    note("State: "+res.body.state);
    fn(res.body.state);
  }

  setFetching(s){
    var i = this.fetching.indexOf(s);
    if (i < 0) {
      this.fetching.push(s);
    }
  }
  clearFetching(s){
    var i = this.fetching.indexOf(s);
    if (i >= 0) {
      this.fetching.splice(i, 1);
    }
  }

  setFetched(s){
    var i = this.fetch.indexOf(s);
    if (i > -1) {
      this.fetch.splice(i, 1);
    }
  }

  shouldFetch(s) {
    return this.fetch.indexOf(s) >= 0;
  }
  isFetching(s) {
    return this.fetching.indexOf(s) >= 0;
  }
  addFetch(s) {
    var i = this.fetch.indexOf(s);
    if (i < 0) {
      this.fetch.push(s);
    }
  }
  clearFetch(s){
    this.fetch.length = 0;
  }


  _loadCache() {
    if (fs.existsSync(cachefile)) {
      let cachedata = JSON.parse(fs.readFileSync(cachefile, 'utf-8'));
      if (cachedata && cachedata.org) this.data.org = cachedata.org;
      if (cachedata && cachedata.members) this.data.members = cachedata.members;
    };
  }

  _writeCache() {
    let cachedata = {};
    cachedata.org = this.data.org;
    cachedata.members = this.data.members;
    let data = JSON.stringify(cachedata);
    fs.writeFile(cachefile, data);
  }
}
