export const difficulties=[8,12,16,18,20,30,40,50]
const common=['Los tres cerditos','El patito feo','El gato con botas','Caperucita Roja','Ricitos de Oro','Hansel y Gretel','Pinocho','La liebre y la tortuga','Granja feliz','Aventura en la selva','Fondo marino','Dinosaurios','Viaje espacial','Castillo mágico','Piratas del tesoro']
const icons=['🐷','🦆','🐱','🧺','🐻','🍭','🤥','🐢','🐮','🦁','🐠','🦖','🚀','🏰','🏴‍☠️']
export const puzzleList=(gender='nino')=>common.map((name,i)=>({id:`${gender}-${i+1}`,name,icon:icons[i],index:i}))
export const difficultiesByAge={4:[8,12,16],5:[8,12,16,18,20],6:difficulties}
export const gridFor={8:[4,2],12:[4,3],16:[4,4],18:[6,3],20:[5,4],30:[6,5],40:[8,5],50:[10,5]}
const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;')
export function puzzleSvgData(puzzle,gender='nino'){
 const themes=[
  ['#8ed8ff','#7ed67c','#ffd45f','🐷','🏠','🌳','🌻','☁️','🪵'],['#9ce3ff','#7bd18a','#ffe37b','🦆','🌊','🌾','🌸','☁️','🐸'],
  ['#91dcff','#75cd78','#ffd05d','🐱','👢','🏰','🌹','☁️','🦋'],['#8fdcff','#74cf75','#ffd166','🧺','🌲','🌼','🍄','☁️','🐿️'],
  ['#a7e3ff','#78cf76','#ffd96a','🐻','🏡','🌲','🍯','☁️','🌷'],['#a3e2ff','#7bd079','#ffcf70','🍭','🏠','🍬','🌳','☁️','🧁'],
  ['#91dfff','#76cf77','#ffd36a','🤥','🪵','⭐','🌳','☁️','🦗'],['#9ce3ff','#78d079','#ffd76c','🐢','🐇','🌳','🌼','☁️','🏁'],
  ['#91dcff','#76ce76','#ffd36a','🐮','🚜','🌾','🌻','☁️','🐔'],['#8fdcff','#71cc76','#ffd263','🦁','🌴','🌺','🦜','☁️','🐒'],
  ['#72d8ee','#42bda8','#ffd56a','🐠','🐙','🪸','🐚','🫧','🐢'],['#91dfff','#72c970','#ffd16b','🦖','🌋','🌴','🥚','☁️','🦕'],
  ['#5f78d8','#7767d8','#ffd75e','🚀','🪐','⭐','🌎','🌙','👽'],['#9edfff','#78cd78','#ffd16b','🏰','🌈','🌷','🦄','☁️','⭐'],
  ['#7edcff','#4dbb83','#ffd263','🏴‍☠️','⛵','🏝️','💰','☁️','🦜']
 ][puzzle.index%15]
 const [sky,grass,sun,...things]=themes
 const labels=things
 const deco=Array.from({length:30},(_,i)=>{const x=45+(i%6)*180+(i%2)*35,y=55+Math.floor(i/6)*135;const icon=labels[i%labels.length];return `<text x="${x}" y="${y}" font-size="${44+(i%3)*10}">${icon}</text>`}).join('')
 const dots=Array.from({length:42},(_,i)=>{const x=25+(i%7)*150,y=25+Math.floor(i/7)*115;return `<circle cx="${x}" cy="${y}" r="${10+(i%4)*4}" fill="${i%2?sun:'#fff'}" opacity=".25"/>`}).join('')
 const title=esc(puzzle.name)
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="700" viewBox="0 0 1000 700"><defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${sky}"/><stop offset="1" stop-color="#eaf9ff"/></linearGradient><pattern id="pat" width="90" height="90" patternUnits="userSpaceOnUse"><path d="M0 45 Q22 15 45 45 T90 45" fill="none" stroke="#fff" stroke-width="8" opacity=".25"/></pattern></defs><rect width="1000" height="700" fill="url(#sky)"/><rect width="1000" height="700" fill="url(#pat)"/>${dots}<circle cx="100" cy="105" r="62" fill="${sun}"/><path d="M0 500 Q130 410 260 505 T520 490 T760 510 T1000 455 V700 H0Z" fill="${grass}"/><path d="M0 585 Q120 515 250 580 T520 570 T770 590 T1000 545 V700 H0Z" fill="#4faf64" opacity=".9"/><g font-family="Segoe UI Emoji,Apple Color Emoji,Noto Color Emoji">${deco}<text x="500" y="405" text-anchor="middle" font-size="215">${puzzle.icon}</text></g><rect x="300" y="565" width="400" height="76" rx="38" fill="#fff" opacity=".78"/><text x="500" y="617" text-anchor="middle" font-size="42" font-weight="900" font-family="Trebuchet MS,Arial" fill="#263B5E">${title}</text></svg>`
 return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}
