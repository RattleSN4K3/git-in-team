
import dom from 'vd';
import { readFileSync as read } from 'fs';

const title = 'Members';
const logo = read(__dirname + '/assets/github-octocat.svg').toString('base64');
const js = read(__dirname + '/assets/iframe.js').toString();
const css = read(__dirname + '/assets/iframe-button.css').toString();

export default function button({ active, total, large }){
  let str = '';
  if (active) str = `${active}|`;
  if (total) str += total;
  if (!str.length) str = '–';

  let opts = { 'class': large ? 'github-btn-large' : '' };
  let div = dom('span.github-button', opts,
    dom('a.github-btn href=./ target=_blank',
      dom('span.github-ico'),
      dom('span.github-text', title)
    ),
    dom('a.github-count href=./ target=_blank', str),
    dom('style', css),
    dom.style().add('.github-ico', {
      'background-image': `url(data:image/svg+xml;base64,${logo})`
    }),
    dom('script', js)
  );

  return div;
}

function gradient(css, sel, params){
  ['-webkit-', '-moz-', ''].forEach(p => {
    css.add(sel, {
      'background-image': `${p}linear-gradient(${params})`
    });
  });
}
