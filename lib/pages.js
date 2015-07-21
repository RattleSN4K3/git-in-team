
import dom from 'vd';

const REPO_URL = "http://github.com/RattleSN4K3/git-in-team";
const REPO_NAME = "git-in-team";

const BASED_ON_URL = "http://rauchg.com/slackin";
const BASED_ON_NAME = "slackin";

export function splash(session, { name, title, desc, logo, private_count, total_count, iframe }, postpath = ''){
  let div = dom('.page',
    !iframe && dom('.logos',
      logo && dom('.logo.org'),
      dom('.logo.github')
    ),
    dom('p',
      'Join ', dom('b', dom(`a href=https://github.com/orgs/${name}`, title)),

      // append team description if available
      desc && desc.length > 0 && dom('br', dom('sub', desc))

    ),
    dom('p.status',
      private_count && private_count != total_count
        ? [
          dom('b.active', private_count), ` ${private_count == 1 ? 'user' : 'users'} with private membership of `,
          dom('b.total', total_count), (total_count == 1 ? ' member.' : ' members in total.')
        ]
        : [dom('b.total', total_count), ` ${total_count == 1 ? 'member' : 'members'} so far.`]
    ),
    dom(`form action=${postpath}join method=post id=postdata_form`,
      dom(`input type=hidden name=token value=${session}`),
      iframe && dom('input type=hidden name=cross value=1'),
      dom('button.btn.btn-marketing.btn-block.btn-note', 'Join the team'),
      dom('sub.text-muted', 'By clicking "Join the team" you will be prompted to allow this app to read the user name from your account on ',
        dom('a href="https://github.com/"', 'GitHub.com'),
        '. You will be automatically added as member of ', dom('strong', name), ' afterwards on redirection.'
      )
    ),
    !iframe && dom('footer',
      'powered by ',
      dom(`a href=${REPO_URL} target=_blank`, REPO_NAME),
      ' (based on ',
      dom(`a href=${BASED_ON_URL} target=_blank`, BASED_ON_NAME),
      ')'
    ),

    dom('link rel=stylesheet media="all" href="https://assets-cdn.github.com/assets/github/index-507b4f74c65565efec0273ea4338465df92b14c967ae71c2bda03dd97946b558.css"'),
    dom('link rel=stylesheet media="all" href="https://assets-cdn.github.com/assets/github2/index-2fbdf789628902fbbde900bfd0bfac0a84ff4cb621212947ebd095670a064df1.css"'),

    // need to be called after css is added to override some css properties
    style({ logo, iframe }),

    dom('script src="//code.jquery.com/jquery-1.11.3.min.js"'),
    dom('script src=/assets/client.js'),
    iframe && dom('script src=/assets/iframe_cross_in.js')
  );
  return div;
}

export function join(session, state, { name, title, desc, logo, iframe }, config){
  let div = dom('.page',
    !iframe && dom('.logos',
      logo && dom('.logo.org'),
      dom('.logo.github')
    ),
    (state == "pending") ?
    [
    dom('p', dom('strong', 'You have been invited to ', dom('strong', dom(`a href=https://github.com/orgs/${name}`, title)), '.')),
    dom('p', 'Please, check your ', dom('strong', 'emails') ,' or ', dom('strong', 'visit the team page'), ' directly in order to continue joining the team.')
    ]
    :
    [
      dom('p', dom(`a href=https://github.com/orgs/${name}`, title), dom('br'), dom('strong', "You already have been invited."))
    ],

    dom('p', "The permission to read your account name isn't required anymore. ",
      "If you want to, you can revoke the permission by visiting ",
      dom(`a href=https://github.com/settings/connections/applications/${config.client_id} target=_blank`, 'the application'),
      ' and click on ', dom('span.btn.btn-sm.btn-danger.disabled', 'Revoke access'), '.'
    ),

    dom('form action=../clear method=post id=postdata_form',
      dom(`input type=hidden name=token value=${session}`),
      iframe && dom('input type=hidden name=cross value=1'),
      dom('p', "Or simply use the automated revoke process:",
        dom('button.btn.btn-block.btn-note', 'Revoke access'),
        dom('sub.text-muted', 'By clicking on "Revoke access", another access is authorized and afterwards automatically revoked and removed from ',
          dom('a href="https://github.com/"', 'GitHub.com'), '.'
        )
      )
    ),

    !iframe && dom('footer', 'powered by ', dom(`a href=${REPO_URL} target=_blank`, REPO_NAME), ' (based on ', dom(`a href=${BASED_ON_URL} target=_blank`, BASED_ON_NAME), ')'),

    dom('link rel=stylesheet media="all" href="https://assets-cdn.github.com/assets/github/index-507b4f74c65565efec0273ea4338465df92b14c967ae71c2bda03dd97946b558.css"'),
    dom('link rel=stylesheet media="all" href="https://assets-cdn.github.com/assets/github2/index-2fbdf789628902fbbde900bfd0bfac0a84ff4cb621212947ebd095670a064df1.css"'),

    // need to be called after css is added to override some css properties
    style({logo, iframe}),

    dom('script src="//code.jquery.com/jquery-1.11.3.min.js"'),
    dom('script src=/assets/client.js'),
    iframe && dom('script src=/assets/iframe_cross_in.js')
  );
  return div;
}

export function cross(state, { name, title, desc, logo, iframe }){
  let div = dom('.page',
    dom('.logos',
      logo && dom('.logo.org'),
      dom('.logo.github')
    ),
    dom('p', 'Join ', dom('b', dom(`a href=https://github.com/orgs/${name}`, title)),
      // append team description if available
      desc && desc.length > 0 && dom('br', dom('sub', desc))
    ),
    dom('p.status', dom('strong', 'Redirecting to main page...')),
    !iframe && dom('footer', 'powered by ', dom(`a href=${REPO_URL} target=_blank`, REPO_NAME), ' (based on ', dom(`a href=${BASED_ON_URL} target=_blank`, BASED_ON_NAME), ')'),

    dom('link rel=stylesheet media="all" href="https://assets-cdn.github.com/assets/github/index-507b4f74c65565efec0273ea4338465df92b14c967ae71c2bda03dd97946b558.css"'),
    dom('link rel=stylesheet media="all" href="https://assets-cdn.github.com/assets/github2/index-2fbdf789628902fbbde900bfd0bfac0a84ff4cb621212947ebd095670a064df1.css"'),
    style({logo}),

    dom('script src="//code.jquery.com/jquery-1.11.3.min.js"'),
    dom('script src=/assets/iframe_cross_out.js')
  );return div;
}

export function cleared({ name, title, desc, logo, iframe }){
  let div = dom('.page',
    !iframe && dom('.logos',
      logo && dom('.logo.org'),
      dom('.logo.github')
    ),
    dom('p', 'Join ', dom('b', dom(`a href=https://github.com/orgs/${name}`, title)),
      // append team description if available
      desc && desc.length > 0 && dom('br', dom('sub', desc))
    ),
    dom('p.status', dom('strong', 'Authorization cleared.')),
    !iframe && dom('p', dom('a href=/', 'Return')),

    !iframe && dom('footer', 'powered by ', dom(`a href=${REPO_URL} target=_blank`, REPO_NAME), ' (based on ', dom(`a href=${BASED_ON_URL} target=_blank`, BASED_ON_NAME), ')'),

    dom('link rel=stylesheet media="all" href="https://assets-cdn.github.com/assets/github/index-507b4f74c65565efec0273ea4338465df92b14c967ae71c2bda03dd97946b558.css"'),
    dom('link rel=stylesheet media="all" href="https://assets-cdn.github.com/assets/github2/index-2fbdf789628902fbbde900bfd0bfac0a84ff4cb621212947ebd095670a064df1.css"'),
    style({logo, iframe}),

    dom('script src="//code.jquery.com/jquery-1.11.3.min.js"'),
    iframe && dom('script src=/assets/iframe_cross_in.js')
  );return div;
}

export function auth(session, { org, token, token_type, client_id, client_secret }){
  let div = dom('.page',
    dom('.logos',
      dom('.logo.github')
    ),
    dom('p',
      'Authorization of git-in-team for ', dom('b', dom(`a href=https://github.com/orgs/${org}`, org))
    ),
    dom('form.left action=auth method=post id=postdata_form',

      token ?
      [
        dom('p', "GitHub access token acquired. You can enter that token in your configuration manually or choose to save it locally to a file."),
        dom(`input type=hidden name=token value=${session}`),
        dom(`input type=hidden name=method value=accept`),
        dom(`input.form-item.textfield name=access_token value="${token}" readonly`),
        dom(`input.form-item.textfield name=token_type value="${token_type || 'Bearer'}" readonly`),

        dom('button.btn.btn-marketing.btn-block', 'Accept and store token')
      ]
      :
      [
        dom('p', "You need to generate an access token for this application to be able to read/write organization members.",
          dom("br"), 'You can create ', dom(`a href=https://github.com/organizations/${org}/settings/applications/new target=_blank`, ' a new application'),
          ' and enter the specific client id and secret in the fields below.'
        ),
        dom(`input type=hidden name=token value=${session}`),
        dom(`input.form-item.textfield name=client_id placeholder="Client ID" value="${client_id}"`),
        dom(`input.form-item.textfield name=client_secret placeholder="Client Secret"  value="${client_secret}"`),

        dom('button.btn.btn-marketing.btn-block', 'Authorize')

      ]
    ),
    dom('footer',
      'powered by ',
      dom(`a href=${REPO_URL} target=_blank`, REPO_NAME),
      ' (based on ',
      dom(`a href=${BASED_ON_URL} target=_blank`, BASED_ON_NAME),
      ')'
    ),

    dom('link rel=stylesheet media="all" href="https://assets-cdn.github.com/assets/github/index-507b4f74c65565efec0273ea4338465df92b14c967ae71c2bda03dd97946b558.css"'),
    dom('link rel=stylesheet media="all" href="https://assets-cdn.github.com/assets/github2/index-2fbdf789628902fbbde900bfd0bfac0a84ff4cb621212947ebd095670a064df1.css"'),

    // need to be called after css is added to override some css properties
    style({width: "500px"}),

    dom('script src="//code.jquery.com/jquery-1.11.3.min.js"'),
    dom('script src=/assets/client.js')
  );
  return div;
}

export function error(msg, { name, logo }){
  let div = dom('.page',
    dom('.logos',
      logo && dom('.logo.org'),
      dom('.logo.github')
    ),
    dom('p', dom('strong', 'Error occurred:'), dom('br')),
    dom('p', msg),
    dom('p', dom('a href=/', 'Return')),

    dom('footer', 'powered by ', dom(`a href=${REPO_URL} target=_blank`, REPO_NAME), ' (based on ', dom(`a href=${BASED_ON_URL} target=_blank`, BASED_ON_NAME), ')'),

    dom('link rel=stylesheet media="all" href="https://assets-cdn.github.com/assets/github/index-507b4f74c65565efec0273ea4338465df92b14c967ae71c2bda03dd97946b558.css"'),
    dom('link rel=stylesheet media="all" href="https://assets-cdn.github.com/assets/github2/index-2fbdf789628902fbbde900bfd0bfac0a84ff4cb621212947ebd095670a064df1.css"'),

    // need to be called after css is added to override some css properties
    style({logo}),

    dom('script src="//code.jquery.com/jquery-1.11.3.min.js"'),
    dom('script src=/assets/client.js')
  );
  return div;
}

export function disabled({ org, iframe }){
  let div = dom('.page',
    dom('.logos', dom('.logo.github')),
    dom('p', 'Join ', dom('b', dom(`a href=https://github.com/orgs/${org}`, org))),
    dom('p.status', dom('strong', 'Joining disabled. Please, contact the server admin.')),
    !iframe && dom('footer', 'powered by ', dom(`a href=${REPO_URL} target=_blank`, REPO_NAME), ' (based on ', dom(`a href=${BASED_ON_URL} target=_blank`, BASED_ON_NAME), ')'),

    dom('link rel=stylesheet media="all" href="https://assets-cdn.github.com/assets/github/index-507b4f74c65565efec0273ea4338465df92b14c967ae71c2bda03dd97946b558.css"'),
    dom('link rel=stylesheet media="all" href="https://assets-cdn.github.com/assets/github2/index-2fbdf789628902fbbde900bfd0bfac0a84ff4cb621212947ebd095670a064df1.css"'),
    style(),

    dom('script src="//code.jquery.com/jquery-1.11.3.min.js"')
  );return div;
}

const themecolor = '#569E3D';
const pagewidth = '400px';

function style({ logo, iframe, width } = {}){
  var css = dom.style();

  if (width == undefined || width == null || width == "") width = pagewidth;

  if (iframe) {
    css.add('.page', {
      'text-align': 'center',
      'font-family': '"Helvetica Neue", Helvetica, Arial'
    });
  } else {
    css.add('.page', {
      'width': width,
      'margin': '200px auto 0px',
      'text-align': 'center',
      'font-family': '"Helvetica Neue", Helvetica, Arial'
    });
  }

  // optional left align (in auth for instance)
  css.add('.left p, .left label', {
    'text-align': 'left',
  });

  // override lineheight value from GitHub css
  css.add('sub, sup', {
    'line-height': '1',
  });

  // override bottom margin value from GitHub css
  css.add('button.btn-note', {
    'margin-bottom': '0px',
  });

  // override github button padding/size
  if (iframe) {
    css.add('button.btn-marketing', {
      'padding': '0',
    });
  }

  if (iframe) {
    css.add('body, html', {
      'margin': '0',
      'padding': '0',
      'background': '#FAFAFA',
      'overflow': 'hidden' // ff
    });

    css.add('.page', {
      'box-sizing': 'border-box',
      'padding': '10px'
    });
  }

  if (!iframe) {
    css
    .media('(max-width: 500px)')
    .add('.page', {
      'margin-top': '100px'
    });
  }

  css.add('.head', {
    'margin-bottom': '40px'
  });

  css.add('.logos', {
    'position': 'relative',
    'margin-bottom': '40px'
  });

  if (!iframe) {
    css.add('.logo', {
      'width': '48px',
      'height': '48px',
      'display': 'inline-block',
      'background-size': 'cover'
    });

    css.add('.logo.github', {
      'background-image': 'url(/assets/github-octocat.svg)'
    });

    if (logo) {
      let pw = 10; // '+' width
      let lp = 30; // logos separation

      css.add('.logo.org::after', {
        'position': 'absolute',
        'display': 'block',
        'content': '"+"',
        'top': '15px',
        'left': '0',
        'width': width,
        'text-align': 'center',
        'color': '#D6D6D6',
        'font': '15px Helvetica Neue'
      });

      css.add('.logo.org', {
        'background-image': `url(${logo})`,
        'margin-right': `${lp + pw + lp}px`
      });
    }
  }

  css.add('p', {
    'font-size': iframe ? '12px' : '15px',
    'margin': iframe ? '0 0 5px' : '5px 0'
  });

  if (iframe) {
    css.add('p.status', {
      'font-size': '11px'
    });
  }

  css.add('select', {
    'background': 'none'
  });

  css.add('button, .form-item', {
    'font-size': '12px',
    'line-height': '32px',
    'margin-top': iframe ? '5px' : '10px',
    'vertical-align': 'middle',
    'display': 'block',
    'text-align': 'center',
    'box-sizing': 'border-box',
    'width': '100%'
  });

  css.add('button', {
    'color': '#fff',
    'font-weight': 'bold',
    'border-width': 0,
    'background': themecolor,
    'text-transform': 'uppercase',
    'cursor': 'pointer',
    'appearence': 'none',
    '-webkit-appearence': 'none',
    'padding': '0',
    'outline': '0',
    'transition': 'background-color 150ms ease-in, color 150ms ease-in'
  });

  css.add('button.loading', {
    'pointer-events': 'none'
  });

  css.add('button:disabled', {
    'color': '#9B9B9B',
    'background-color': '#D6D6D6',
    'cursor': 'default',
    'pointer-events': 'none'
  });

  css.add('button.error', {
    'background-color': '#F4001E'
  });

  css.add('button.success:disabled', {
    'color': '#fff',
    'background-color': '#68C200'
  });

  css.add('b', {
    'transition': 'transform 150ms ease-in'
  });

  css.add('b.grow', {
    'transform': 'scale(1.3)'
  });

  css.add('form', {
    'width': '100%',
    'margin-top': iframe ? '10px' : '20px',
    'margin-bottom': '0'
  });

  css.add('input', {
    'color': '#9B9B9B',
    'border': '1px solid #D6D6D6'
  });

  if (iframe) {
    css.add('input, button', {
      'font-size': '11px',
      'height': '28px',
      'line-height': '28px'
    });
  }

  css.add('input:focus', {
    'color': '#666',
    'border-color': '#999',
    'outline': '0'
  });

  css.add('.number', {
    'color': themecolor
  });

  if (!iframe) {
    css.add('footer', {
      'color': '#D6D6D6',
      'font-size': '11px',
      'margin': '200px auto 0',
      'width': '300px',
      'text-align': 'center',
    });

    css.add('footer a', {
      'color': '#9B9B9B',
      'text-decoration': 'none',
      'border-bottom': '1px solid #9B9B9B'
    });

    css.add('footer a:hover', {
      'color': '#fff',
      'background-color': '#9B9B9B'
    });
  }

  return css;
}
