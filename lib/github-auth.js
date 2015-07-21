
import request from 'superagent';
import { json } from 'body-parser';

const auth_url = 'https://github.com/login/oauth/access_token';

export default function auth(setup, {scope, scopename}, { code, state }, fn){

  let data = {
    client_id: setup.client_id,
    client_secret: setup.client_secret,
    code,
    state: setup.client_state
  };

  request
  .post(auth_url)
  .type('form')
  .send(data)
  .end(function(err, res){
    if (err) return fn(err);
    if (200 != res.status) {
      fn(new Error(`Invalid response ${res.status}.`));
      return;
    }

    if (scope == undefined) scope = "";
    if (scopename == undefined) scopename = "Public";

    if (!res.body.access_token) {
      fn(new Error('No access token returned.'));
      return;
    }

    // check for modified scopes
    if (res.body.scope == undefined){
      fn(new Error('No Scope value. Invalid response.'), res.body.access_token, res.body.token_type);
      return;
    }

    // check for modified scopes
    if (res.body.scope == "" && scope != "") {
      fn(new Error('No access scope. Modified redirect URL?!'), res.body.access_token, res.body.token_type);
      return;
    } else if (res.body.scope != "" && scope == "" &&
      setup.access_token != res.body.access_token // case when admin joins the team
    ) {
      fn(new Error('Modified redirect URL! Access scope defined!'), res.body.access_token, res.body.token_type);
      return;
    }

    let scopes = res.body.scope.split(',');
    if (scopes.length != 1) {
      fn(new Error(`Invalid scopes quantity (${scopes.length}).`), res.body.access_token, res.body.token_type);
      return;
    }

    if (scopes[0] != scope && setup.access_token != res.body.access_token) { // case when admin joins the team
      fn(new Error(`No ${scopename} scope ${scope != "" ? "("+scope+")" : ""}.`), res.body.access_token, res.body.token_type);
      return;
    }

    fn(null, res.body.access_token, res.body.token_type);
  });
}
