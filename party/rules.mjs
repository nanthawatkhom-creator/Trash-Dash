export const TYPES = [
 {name:'ทั่วไป',color:'#4799e5',icon:'▤',items:[{name:'ซองขนม',emoji:'🍬',shape:'wrapper',points:10},{name:'ทิชชู่ใช้แล้ว',emoji:'🧻',shape:'paper',points:10},{name:'กล่องโฟม',emoji:'🥡',shape:'box',points:10}]},
 {name:'อันตราย',color:'#e66a68',icon:'ϟ',items:[{name:'ถ่านไฟฉาย',emoji:'🔋',shape:'battery',points:30},{name:'มือถือเก่า',emoji:'📱',shape:'phone',points:50}]},
 {name:'รีไซเคิล',color:'#edbd42',icon:'♻',items:[{name:'ขวดพลาสติก',emoji:'🧴',shape:'bottle',points:20},{name:'กระป๋อง',emoji:'🥫',shape:'can',points:15},{name:'กระดาษสะอาด',emoji:'📰',shape:'paper',points:20}]},
 {name:'ขยะเปียก',color:'#78ad59',icon:'❧',items:[{name:'เปลือกกล้วย',emoji:'🍌',shape:'banana',points:15},{name:'แกนแอปเปิล',emoji:'🍎',shape:'apple',points:10},{name:'เศษอาหาร',emoji:'🥦',shape:'food',points:15}]}
];
export const CAST=[
 {name:'เหมียวสายซิ่ง',animal:'cat',emoji:'🐱',color:'#4799e5',keys:['KeyW','KeyS','KeyA','KeyD','KeyE','ShiftLeft']},
 {name:'กระต่ายตัวตึง',animal:'rabbit',emoji:'🐰',color:'#e88299',keys:['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Enter','Slash']},
 {name:'หมีจอมป่วน',animal:'bear',emoji:'🐻',color:'#dba347',keys:['KeyI','KeyK','KeyJ','KeyL','KeyO','KeyU']},
 {name:'กบจอมเด้ง',animal:'frog',emoji:'🐸',color:'#78ad59',keys:['Numpad8','Numpad5','Numpad4','Numpad6','Numpad0','NumpadAdd']}
];
export function itemTier(points){return points>=50?{name:'LEGENDARY',color:'#f6bf42',rank:3}:points>=30?{name:'RARE',color:'#c38aff',rank:2}:points>=20?{name:'SPECIAL',color:'#64c9e9',rank:1}:{name:'COMMON',color:'#a5bba4',rank:0}}
export function sortValue(item,combo,remaining){return ((item.spec?.points??10)+Math.min(10,Math.max(0,combo-1)*2))*(remaining<=15?2:1)}
export function scoreSort(p,type,remaining){if(!p.carry)return{ok:false,points:0};if(p.carry.type!==type){p.combo=0;p.score=Math.max(0,p.score-5);return{ok:false,points:-5}}p.combo++;const points=sortValue(p.carry,p.combo,remaining);p.score+=points;p.sorted++;p.carry=null;return{ok:true,points}}
export const WAVES=[
 {name:'อุ่นเครื่อง',count:8,interval:1.6,maxPoints:20},
 {name:'เริ่มคึกคัก',count:10,interval:1.4,maxPoints:30},
 {name:'ของหายากมาแล้ว!',count:12,interval:1.2,maxPoints:50},
 {name:'แย่งกันให้ไว!',count:14,interval:1.05,maxPoints:50},
 {name:'ปาร์ตี้ส่งท้าย',count:16,interval:.9,maxPoints:50}
];
export function waveAt(seconds){return Math.min(WAVES.length-1,Math.max(0,Math.floor(seconds/18)))}
export function pickWaveItem(wave,ordinal,random=Math.random){const plan=WAVES[wave],last=ordinal===plan.count-1;const pool=TYPES.flatMap((t,type)=>t.items.map(spec=>({type,spec}))).filter(i=>last?i.spec.points===plan.maxPoints:i.spec.points<=Math.min(plan.maxPoints,wave===0?15:30));return pool[Math.min(pool.length-1,Math.floor(Math.max(0,random())*pool.length))]}
export function rankPlayers(players){return [...players].sort((a,b)=>b.score-a.score||b.sorted-a.sorted)}
export const BIN_REACH=2.65;
export function canUseBin(p,b){return b.owner===p.id&&Math.hypot(p.x-b.x,p.z-b.z)<=BIN_REACH}
// Aim at the column the player stands in, on either side of their base.
// Never use the carried item's type to choose a bin: sorting is the player's choice.
export function selectBin(p,bins){return bins.filter(b=>canUseBin(p,b)).sort((a,b)=>Math.abs(p.x-a.x)-Math.abs(p.x-b.x)||Math.abs(p.z-a.z)-Math.abs(p.z-b.z))[0]||null}
export function formatTime(seconds){const s=Math.max(0,Math.ceil(seconds));return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`}
