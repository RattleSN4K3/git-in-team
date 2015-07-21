
import request from 'superagent';
import { json } from 'body-parser';
import URITemplate from 'URIjs/src/URITemplate';

const clear_url = 'https://api.github.com/applications/{client_id}/tokens/{access_token}';

export default function clear(setup, token, fn){

  let data = {
    client_id: setup.client_id,
    access_token: token,
  };

  let access_token;
  let token_type;

  let url = URITemplate(clear_url).expand(data);

  request
  .del(url)
  .auth(setup.client_id, setup.client_secret)
  .type('form')
  .end((err, res) => {
    if (err) return fn(err);

    // GitHub sends 204: No content
    if (204 != res.status) {
      if (res.body && res.body.message){
        fn(new Error(`Invalid response: ${res.body.message}`));
      } else {
        fn(new Error(`Invalid response ${res.status}.`));
      }
      return;
    }

    fn(null);
  });
}
