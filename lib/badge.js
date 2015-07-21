
import svg from 'vd';

const title = 'members';
const color = '#000000';
const pad = 8; // left / right padding
const sep = 4; // middle separation

export default function badge({ total, priv }, customtitle = "", special = false ){
  let t = customtitle || title;
  let value = priv ? `${priv}|${total}` : ('' + total || '–');
  let lw = pad + width(t) + sep; // left side width
  let rw = sep + width(value) + pad; // right side width
  let tw = lw + rw; // total width

  return svg(`svg xmlns="http://www.w3.org/2000/svg" width=${tw} height=20`,
    svg(`rect rx=3 width=${tw} height=20 fill=#555`),
    svg(`rect rx=3 x=${lw} width=${rw} height=20 fill=${special?'#555':color}`),
    special && svg(`rect rx=2 x=${lw} y=1 width=${rw-1} height=18 fill=#FFF`),
    svg(`path d="M${special?lw-1:lw} 0h${sep}v20h-${sep}z" fill=${special?'#555':color}`),
    svg(`rect rx=3 width=${tw} height=20 fill=url(#g)`),
    svg('g text-anchor=middle font-family=Verdana font-size=11',
      text({ special: false, str: t, x: Math.round(lw / 2), y: 14 }),
      text({ special, str: value, x: lw + Math.round(rw / 2), y: 14 })
    )
  );
}

// generate text with 1px shadow
function text({str, x, y, special}){
  return [
    svg(`text fill=#010101 fill-opacity=.3 x=${x} y=${y + 0.5}`, str),
    svg(`text fill=${special?'#555':'#fff'} x=${x} y=${y}`, str)
  ];
}

// π=3
function width(str){
  return 7 * str.length;
}
