import * as THREE from './vendor/three.module.js';
import {TYPES,CAST,scoreSort,rankPlayers,selectBin,formatTime,WAVES,waveAt,pickWaveItem,itemTier,sortValue} from './rules.mjs';

const $=id=>document.getElementById(id), clamp=(v,a,b)=>Math.max(a,Math.min(b,v)), rand=(a,b)=>a+Math.random()*(b-a);
const show=(id,on=true)=>$(id).classList.toggle('hidden',!on);
let stage={x:0,y:0,width:innerWidth,height:innerHeight};
let renderer;
try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});}catch(e){show('load-error');throw e;}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;renderer.setClearColor('#e5edd7');$('world').appendChild(renderer.domElement);
const scene=new THREE.Scene();scene.fog=new THREE.Fog('#e5edd7',45,95);
const camera=new THREE.OrthographicCamera(-18,18,12,-12,.1,150);camera.position.set(0,30,23);camera.lookAt(0,0,0);
scene.add(new THREE.HemisphereLight('#fff8ec','#8ca879',1.9));
const sun=new THREE.DirectionalLight('#fff4e0',2.2);sun.position.set(-12,25,9);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-22,right:22,top:22,bottom:-22,near:1,far:65});sun.shadow.bias=-.0007;sun.shadow.normalBias=.025;scene.add(sun);
const materials=new Map();function mat(color){if(!materials.has(color))materials.set(color,new THREE.MeshStandardMaterial({color,roughness:.77}));return materials.get(color)}
const ballGeo=new THREE.SphereGeometry(1,20,14),boxGeo=new THREE.BoxGeometry(1,1,1);
function mesh(geo,color,x,y,z,parent=scene){const m=new THREE.Mesh(geo,mat(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;m.userData.dynamicGeo=geo!==ballGeo&&geo!==boxGeo;parent.add(m);return m;}
function box(x,y,z,w,h,d,c,parent=scene){const m=mesh(boxGeo,c,x,y,z,parent);m.scale.set(w,h,d);return m;}
function ball(x,y,z,rx,ry,rz,c,parent=scene){const m=mesh(ballGeo,c,x,y,z,parent);m.scale.set(rx,ry,rz);return m;}
function cyl(x,y,z,r,h,c,parent=scene,r2=r){return mesh(new THREE.CylinderGeometry(r2,r,h,24),c,x,y,z,parent)}
function group(x=0,y=0,z=0,parent=scene){const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);return g;}
function label(text,{size=1.3,color='#ffffff',bg=null,width=256,height=96,font=40}={}){const c=document.createElement('canvas');c.width=width;c.height=height;const ctx=c.getContext('2d');if(bg){ctx.fillStyle=bg;ctx.beginPath();ctx.roundRect(2,2,width-4,height-4,24);ctx.fill();}ctx.font=`800 ${font}px "Noto Sans Thai", sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=color;ctx.fillText(text,width/2,height/2+3);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,depthWrite:false}));s.scale.set(size,size*height/width,1);s.userData.owned=true;return s;}
function disposeObject(root){const ownedMaterials=new Set();root.traverse(o=>{if(o.isSprite&&o.userData.owned){o.material.map?.dispose();ownedMaterials.add(o.material);}if(o.userData.dynamicGeo){o.geometry?.dispose();if(o.material&&!materials.has(o.material.color?.getStyle())){if(o.material.isMeshBasicMaterial)ownedMaterials.add(o.material);}}});ownedMaterials.forEach(m=>m.dispose());root.removeFromParent();}

// A hand-built miniature park. All game geometry is local and works offline.
box(0,-.6,0,32,1,23,'#c2d2a0');box(0,-.12,0,28,.4,19,'#dbd5b9');
const paving=new THREE.InstancedMesh(boxGeo,mat('#e7dfc8'),28*19);let pi=0;const matrix=new THREE.Matrix4();
for(let z=-9;z<=9;z++)for(let x=-13.5;x<=13.5;x++){matrix.makeScale(.95,.07,.95);matrix.setPosition(x,.12,z);paving.setMatrixAt(pi++,matrix);}paving.receiveShadow=true;scene.add(paving);
for(const z of [-9.7,9.7])box(0,.18,z,28.8,.35,.3,'#f7efdb');for(const x of [-14.2,14.2])box(x,.18,0,.3,.35,19.8,'#f7efdb');
function tree(x,z,s=1){const g=group(x,0,z);cyl(0,1.5,0,.19,2.8,'#a17e52',g);ball(0,3.15,0,1.2,1.4,1.15,'#75a85d',g);ball(-.65,2.8,.3,.9,.9,.9,'#8cb96c',g);ball(.65,3,.15,.85,1,.85,'#96bd73',g);g.scale.setScalar(s);}
function planter(x,z,w=2){box(x,.3,z,w,.6,1.1,'#f0e7cd');for(let k=0;k<5;k++){ball(x+rand(-w*.4,w*.4),.8,z+rand(-.3,.3),.4,.45,.4,'#8bb56e');}for(let k=0;k<6;k++){const xx=x+rand(-w*.4,w*.4),zz=z+rand(-.3,.3);ball(xx,1.1,zz,.13,.13,.13,k%2?'#f5c26e':'#e8a1a6');}}
for(let i=0;i<9;i++){const x=-15+i*3.8;tree(x,-11.3,rand(.8,1.2));if(i%2===0)tree(x,11.5,rand(.7,1));}
for(let i=0;i<4;i++){tree(-16,-6+i*4,rand(.85,1.15));tree(16,-6+i*4,rand(.8,1.1));}
for(const x of [-12,12])for(const z of [-3,3])planter(x,z,1.6);
function bench(x,z,rotation=0){const g=group(x,0,z);g.rotation.y=rotation;for(const xx of [-.8,.8])box(xx,.36,0,.12,.7,.6,'#466b55',g);for(let i=0;i<3;i++)box(0,.77,-.27+i*.23,2.3,.12,.19,'#bb9061',g);for(let i=0;i<2;i++)box(0,1.1+i*.23,-.48,2.3,.18,.12,'#bb9061',g);}
bench(-5,-9.7);bench(5,-9.7);bench(-5,9.7,Math.PI);bench(5,9.7,Math.PI);
for(const x of [-13.6,13.6])for(const z of [-8.8,8.8]){cyl(x,1.55,z,.075,3,'#446650');box(x,3.2,z,.45,.65,.45,'#fff0c2');box(x,3.58,z,.63,.12,.63,'#446650');}
const fountain=group(0,0,-10.6);cyl(0,.35,0,1.6,.5,'#d2ded2',fountain);cyl(0,.62,0,1.35,.08,'#84c7cb',fountain);cyl(0,1.2,0,.28,1.2,'#dae7d9',fountain);cyl(0,1.7,0,.8,.17,'#e7eedc',fountain);ball(0,2,0,.4,.35,.4,'#f1ce62',fountain);ball(.22,2.05,.3,.15,.1,.18,'#eaa14f',fountain);
const parkSign=label('GREEN PARK',{color:'#678262',bg:'#fff9e7',size:3.5,font:34});parkSign.position.set(0,1.2,10.2);scene.add(parkSign);
const recycle=label('♻',{size:4,color:'#cecbb0',font:75});recycle.position.set(0,.23,0);recycle.material.rotation=0;scene.add(recycle);recycle.visible=false;

const bins=[],bases=[[-9,-6.4],[9,-6.4],[-9,6.4],[9,6.4]];
const binOverlay=document.createElement('div');binOverlay.className='bin-overlays';$('world').appendChild(binOverlay);
for(let id=0;id<4;id++){
 const [bx,bz]=bases[id];box(bx,.26,bz,7.35,.28,2.8,'#f8efd7');box(bx,.42,bz,7.1,.05,2.55,id%2?'#e6dfc3':'#e4e4c8');
 const sign=label(`P${id+1}`,{bg:CAST[id].color,size:1.8,font:47});sign.position.set(bx,.55,bz+(bz<0?3.1:-2.7));scene.add(sign);
 for(let type=0;type<4;type++){
  const x=bx-2.475+type*1.65,z=bz,g=group(x,.46,z);const c=TYPES[type].color;
  const zone=mesh(new THREE.PlaneGeometry(1.58,2.35),c,x,.24,z+(z<0?1.8:-1.8));zone.rotation.x=-Math.PI/2;zone.material=new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:.13,depthWrite:false});zone.castShadow=false;
  box(0,.64,0,1.04,1.25,.95,c,g);box(0,1.3,0,1.17,.16,1.08,c,g);box(0,1.4,.02,.48,.035,.42,'#385747',g);
  box(0,.24,.53,.83,.07,.05,'#e0eadb',g);
  for(const xx of [-.35,.35]){const wheel=cyl(xx,.05,-.4,.13,.12,'#47584c',g);wheel.rotation.z=Math.PI/2;}
  const icon=label(TYPES[type].icon,{size:.91,font:64,width:96,height:96});icon.position.set(0,.76,.56);g.add(icon);
  g.scale.set(1.2,1.2,1.15);
  const tag=document.createElement('div');tag.className='bin-name';tag.style.setProperty('--bin-color',c);tag.textContent=TYPES[type].name;tag.dataset.icon=TYPES[type].icon;tag.dataset.short=['ทั่ว\nไป','อัน\nตราย','รีไซ\nเคิล','ขยะ\nเปียก'][type];binOverlay.appendChild(tag);
  bins.push({owner:id,type,x,z,mesh:g,icon,tag,zone,flash:0});
 }
}
const aimHint=document.createElement('div');aimHint.className='aim-hint';$('world').appendChild(aimHint);
const projectPoint=new THREE.Vector3();
function updateBinGuides(){
 binOverlay.classList.toggle('during-game',state!=='lobby');
 for(const b of bins){const selected=state==='playing'&&players.some(p=>!p.bot&&p.carry&&selectBin(p,bins)===b);b.zone.material.opacity=selected?.6:.13;b.tag.classList.toggle('selected',selected);projectPoint.set(b.x,2.55,b.z).project(camera);b.tag.style.left=`${(projectPoint.x*.5+.5)*stage.width}px`;b.tag.style.top=`${(-projectPoint.y*.5+.5)*stage.height+(stage.width>600&&stage.width<=850?(b.type%2?9:-9):0)}px`;}
 const p=players[0],b=state==='playing'&&p?.carry?selectBin(p,bins):null;
 aimHint.hidden=!b;
 if(b){projectPoint.set(p.x,.2,p.z).project(camera);aimHint.style.left=`${clamp((projectPoint.x*.5+.5)*innerWidth,135,innerWidth-135)}px`;aimHint.style.top=`${(-projectPoint.y*.5+.5)*innerHeight+32}px`;aimHint.style.setProperty('--bin-color',TYPES[b.type].color);aimHint.textContent=`${TYPES[b.type].icon} ${TYPES[b.type].name} · กด E / เก็บ–ทิ้ง`;}
}

function makeCharacter(id){
 const c=CAST[id],root=group(),body=group(0,0,0,root),skin='#ffdbb7',dark='#334a3c';
 const ring=mesh(new THREE.RingGeometry(.48,.59,32),c.color,0,.22,0,root);ring.rotation.x=-Math.PI/2;ring.castShadow=false;
 ball(0,.94,0,.38,.47,.27,c.color,body);box(0,.71,0,.55,.16,.35,'#496076',body);box(0,1.07,.277,.045,.46,.04,'#fff1d3',body);
 const pack=ball(0,1,-.29,.3,.34,.16,c.color,body);box(0,.99,-.455,.19,.16,.025,'#fff0ca',body);
 const legs=[],arms=[];
 for(const side of [-1,1]){
  const leg=group(side*.19,.67,0,body);ball(0,-.18,0,.12,.22,.13,skin,leg);ball(0,-.4,.09,.16,.13,.24,'#fff9e4',leg);box(0,-.38,.2,.21,.06,.14,c.color,leg);legs.push(leg);
  const arm=group(side*.39,1.21,0,body);ball(side*.03,-.18,0,.13,.23,.13,c.color,arm);ball(side*.04,-.38,.03,.14,.14,.14,'#fff9e9',arm);arms.push(arm);
 }
 const head=group(0,1.69,0,body);ball(0,0,0,.53,.49,.46,skin,head);ball(0,.22,-.06,.55,.38,.47,id===1?'#d990a1':id===2?'#bb884d':'#6a4c38',head);
 for(const side of [-1,1]){ball(side*.45,-.02,0,.13,.15,.12,skin,head);ball(side*.18,-.02,.416,.06,.085,.035,dark,head);ball(side*.19,.01,.445,.018,.025,.012,'#ffffff',head);ball(side*.32,-.14,.39,.09,.045,.016,'#efaa9a',head);ball(side*.12,.23,.37,.19,.16,.1,id===1?'#d990a1':id===2?'#bb884d':'#6a4c38',head);}
 ball(0,-.19,.445,.065,.045,.025,'#ad6553',head);
 const hat=group(0,.34,-.03,head);ball(0,0,0,.58,.29,.49,id===1?'#fff6e4':c.color,hat);
 if(c.animal==='cat')for(const s of [-1,1]){const ear=mesh(new THREE.ConeGeometry(.19,.43,3),c.color,s*.38,.32,0,hat);ear.rotation.y=Math.PI/2;ball(s*.38,.3,.08,.08,.12,.035,'#edb2ba',hat);}
 if(c.animal==='rabbit')for(const s of [-1,1]){const ear=ball(s*.3,.53,-.02,.14,.55,.14,'#fff6e4',hat);ear.rotation.z=s*-.15;ball(s*.3,.56,.1,.065,.37,.025,'#efa7b3',hat);}
 if(c.animal==='bear')for(const s of [-1,1]){ball(s*.43,.23,0,.22,.23,.16,c.color,hat);ball(s*.43,.24,.14,.12,.13,.03,'#f2c98c',hat);}
 if(c.animal==='frog')for(const s of [-1,1]){ball(s*.33,.23,.07,.22,.23,.2,c.color,hat);ball(s*.33,.28,.24,.13,.14,.045,'#fff8e4',hat);ball(s*.33,.29,.285,.06,.08,.025,dark,hat);}
 if(c.animal==='bear')for(const s of [-1,1]){const glasses=mesh(new THREE.TorusGeometry(.145,.017,8,24),dark,s*.19,-.035,.46,head);}
 for(const s of [-1,1])if(c.animal!=='frog')ball(s*.11,.04,.453,.027,.035,.018,dark,hat);
 const badge=label(`P${id+1}`,{size:.78,font:38,bg:c.color});badge.position.set(0,3.05,0);root.add(badge);
 const hold=group(0,2.65,.05,body);return{root,body,head,legs,arms,hold,badge,ring,pack};
}
const avatars=CAST.map((_,id)=>{const a=makeCharacter(id);a.root.scale.setScalar(1.16);return a;});
let players=[],trash=[],particles=[],state='lobby',humans=1,remaining=90,elapsed=0,waveIndex=-1,waveSpawned=0,nextWaveItem=0,count=0,eventTime=0,muted=true,audio,roundTotal=0;
const sidePanel=document.createElement('aside');sidePanel.id='player-panel';sidePanel.className='player-panel hidden';sidePanel.innerHTML='<section class="wave-card"><div class="wave-kicker">PARK CLEANUP</div><div class="wave-title"><strong id="wave-number">WAVE 01</strong><span>/ 05</span></div><b id="wave-name">อุ่นเครื่อง</b><div class="wave-track"><i id="wave-fill"></i></div><div class="wave-meta"><span id="wave-spawned"></span><span id="wave-next"></span></div></section>';$('carry-hud').before(sidePanel);sidePanel.appendChild($('carry-hud'));
const waveMarkers=document.createElement('div');waveMarkers.className='wave-markers';WAVES.forEach((w,i)=>{const s=document.createElement('span');s.textContent=String(i+1).padStart(2,'0');waveMarkers.appendChild(s);});sidePanel.firstElementChild.appendChild(waveMarkers);
// Status messages belong to the HUD, never over the playable arena.
sidePanel.firstElementChild.append($('countdown'),$('event'));
const keys=new Set(),pressed=new Set(),padPrev=[],touchMove={x:0,z:0};let touchAction=false,touchDash=false;
function beep(freq=500,duration=.09,type='sine',volume=.045){if(muted)return;try{audio??=new AudioContext();audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.type=type;o.frequency.setValueAtTime(freq,audio.currentTime);o.frequency.exponentialRampToValueAtTime(freq*1.4,audio.currentTime+duration);g.gain.setValueAtTime(volume,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+duration);}catch{}}
function spawnTrash(type=Math.floor(rand(0,4)),x=rand(-7.3,7.3),z=rand(-4.1,4.1),chosenSpec=null){
 if(trash.length>=48)return;const spec=chosenSpec||TYPES[type].items[Math.floor(rand(0,TYPES[type].items.length))],g=group(x,.35,z),tier=itemTier(spec.points),col=type===1?'#5b6170':type===2?'#8bc8d6':type===3?'#e6c55f':'#e5d8bd';
 if(spec.shape==='bottle'){cyl(0,.25,0,.16,.52,col,g,.12);cyl(0,.59,0,.08,.2,'#73a0ca',g);box(0,.23,.15,.23,.16,.02,'#e8f6ed',g);}
 else if(spec.shape==='can'||spec.shape==='battery'){cyl(0,.18,0,.19,.43,col,g);cyl(0,.41,0,.17,.025,'#e2e2d5',g);box(0,.17,.19,.25,.21,.02,spec.shape==='battery'?'#e6b54d':'#e7846a',g);}
 else if(spec.shape==='phone'){box(0,.08,0,.32,.12,.57,col,g);box(0,.15,0,.25,.015,.44,'#8baca2',g);}
 else if(spec.shape==='banana'){for(let i=0;i<3;i++){const b=ball((i-1)*.17,.12,(i-1)**2*.11,.09,.09,.3,'#eac753',g);b.rotation.y=(i-1)*.7;}}
 else if(spec.shape==='apple'){cyl(0,.2,0,.13,.37,'#f7e6b8',g);ball(0,.4,0,.25,.08,.22,'#d87662',g);ball(0,.02,0,.24,.08,.22,'#d87662',g);}
 else if(spec.shape==='food'){for(let i=0;i<4;i++)ball(rand(-.2,.2),.12,rand(-.2,.2),.17,.15,.17,'#8fad61',g);}
 else {const b=box(0,.08,0,.5,.16,.38,col,g);b.rotation.y=rand(-.7,.7);if(spec.shape==='wrapper')box(0,.18,0,.23,.05,.25,'#d98b82',g);}
 const emoji=label(spec.emoji,{size:.7,width:96,height:96,font:62});emoji.position.set(0,.91,0);g.add(emoji);
 const effects=group(0,0,0,g),sparks=[];
 if(tier.rank>0){
  const ring=mesh(new THREE.TorusGeometry(.42+tier.rank*.05,.025+tier.rank*.008,8,40),tier.color,0,.03,0,effects);ring.rotation.x=Math.PI/2;ring.material=new THREE.MeshBasicMaterial({color:tier.color});
  const glow=mesh(new THREE.CircleGeometry(.4+tier.rank*.06,32),tier.color,0,.025,0,effects);glow.rotation.x=-Math.PI/2;glow.material=new THREE.MeshBasicMaterial({color:tier.color,transparent:true,opacity:.22,depthWrite:false});
  for(let i=0;i<tier.rank*3;i++){const spark=mesh(new THREE.OctahedronGeometry(.045+tier.rank*.008),tier.color,0,0,0,effects);spark.material=ring.material;sparks.push(spark);}
  if(tier.rank===3){const beam=mesh(new THREE.CylinderGeometry(.08,.3,1.8,20,1,true),tier.color,0,.9,0,effects);beam.material=new THREE.MeshBasicMaterial({color:tier.color,transparent:true,opacity:.13,side:THREE.DoubleSide,depthWrite:false});}
 }
 g.scale.setScalar(1+tier.rank*.12);
 const value=label(`+${spec.points}${tier.rank===3?' ★':''}`,{size:tier.rank>=2?1.35:1.05,width:128,height:64,color:tier.rank===2?'#fffdf2':'#36543e',bg:tier.rank?tier.color:'#fffbed',font:42});value.position.set(0,1.5+tier.rank*.09,0);g.add(value);
 const t={type,spec,x,z,mesh:g,effects,sparks,tier,phase:rand(0,6),born:elapsed};trash.push(t);if(state==='playing')burst(x,z,tier.color,tier.rank?12:4);return t;
}
function beginWave(index){waveIndex=index;waveSpawned=0;nextWaveItem=0;beep(350,.12,'triangle');}
function tickWaves(dt){const index=waveAt(elapsed);if(index!==waveIndex)beginWave(index);const plan=WAVES[index];nextWaveItem-=dt;if(waveSpawned<plan.count&&nextWaveItem<=0){const item=pickWaveItem(index,waveSpawned);const t=spawnTrash(item.type,rand(-7.3,7.3),rand(-4.1,4.1),item.spec);if(t){waveSpawned++;nextWaveItem=plan.interval;if(t.tier.rank===3)announce('★ LEGENDARY! มือถือเก่า 50 คะแนน');}}for(let i=trash.length-1;i>=0;i--){const t=trash[i];if(elapsed-t.born>34){disposeObject(t.mesh);trash.splice(i,1);}}}
function resetPlayers(active=4){players=[];avatars.forEach((a,id)=>{a.root.visible=id<active;while(a.hold.children.length)disposeObject(a.hold.children[0]);a.root.rotation.y=0;if(id<active){const [x,z]=bases[id];players.push({id,x,z:z+(z<0?2:-2),score:0,combo:0,sorted:0,carry:null,bot:id>=humans,cooldown:0,dash:0,stun:0,slip:0,actionTime:0,move:0,phase:rand(0,6),celebrate:0,avatar:a});}});}
function clearRound(){for(const t of trash)disposeObject(t.mesh);trash=[];for(const p of particles)p.mesh.removeFromParent();particles=[];$('feedback').replaceChildren();}
function startGame(){for(const d of document.querySelectorAll('dialog[open]'))d.close();clearRound();resetPlayers($('bots').checked?4:humans);remaining=90;elapsed=0;waveIndex=-1;waveSpawned=0;nextWaveItem=0;roundTotal=0;state='countdown';count=3.4;keys.clear();pressed.clear();document.body.classList.add('playing');for(const id of ['lobby','scene-caption'])show(id,false);for(const id of ['hud','pause','play-controls','countdown'])show(id);show('touch',matchMedia('(pointer:coarse)').matches||innerWidth<700);show('carry-hud',false);show('event',false);$('scoreboards').innerHTML=players.map(p=>`<div class="score-card" style="--player:${CAST[p.id].color}"><span class="avatar">${CAST[p.id].emoji}</span><div><b>P${p.id+1}</b><small>${p.bot?'BOT':'PLAYER'}</small></div><strong id="score-${p.id}">0</strong></div>`).join('');show('player-panel');resize();updateHud();}
function backToLobby(){for(const d of document.querySelectorAll('dialog[open]'))d.close();state='lobby';clearRound();resetPlayers();document.body.classList.remove('playing');for(const id of ['lobby','scene-caption'])show(id);for(const id of ['hud','pause','play-controls','countdown','event','touch','carry-hud'])show(id,false);show('player-panel',false);for(let i=0;i<8;i++)spawnTrash(i%4);spawnTrash(1,1,0,TYPES[1].items[1]);resize();keys.clear();}
function updateHud(){
 for(const p of players){const el=$(`score-${p.id}`);if(el)el.textContent=p.score;}
 $('time').textContent=formatTime(remaining);$('round-progress').style.width=`${remaining/90*100}%`;document.querySelector('.timer').classList.toggle('urgent',remaining<=15);$('phase').textContent=remaining<=15?'🔥 คะแนน ×2':'แยกให้ไว!';
 const wi=Math.max(0,waveIndex),plan=WAVES[wi];$('wave-number').textContent=`WAVE ${String(wi+1).padStart(2,'0')}`;$('wave-name').textContent=plan.name;$('wave-fill').style.width=`${waveSpawned/plan.count*100}%`;$('wave-spawned').textContent=`ปรากฏแล้ว ${waveSpawned}/${plan.count} ชิ้น`;$('wave-next').textContent=wi===4?'เวฟสุดท้าย':`เวฟถัดไป ${Math.max(0,Math.ceil((wi+1)*18-elapsed))} วิ`;
 [...waveMarkers.children].forEach((m,i)=>{m.classList.toggle('active',i===wi);m.classList.toggle('done',i<wi);});
 const p=players[0];show('carry-hud',state!=='lobby'&&state!=='results');
 const contentKey=p?.carry?`${p.carry.spec.name}:${p.combo}:${remaining<=15}`:'empty';if($('carry-hud').dataset.contentKey===contentKey)return;$('carry-hud').dataset.contentKey=contentKey;
 if(p?.carry){const t=p.carry,category=TYPES[t.type],value=sortValue(t,p.combo+1,remaining);$('carry-hud').style.setProperty('--item-color',t.tier.color);$('carry-hud').style.setProperty('--type-color',category.color);$('carry-hud').innerHTML=`<div class="carry-kicker">กำลังถือ / YOUR ITEM</div><div class="carry-art tier-${t.tier.rank}"><span>${t.spec.emoji}</span><i>✦</i></div><div class="carry-tier">${t.tier.name}</div><h2>${t.spec.name}</h2><div class="carry-value"><strong>+${t.spec.points}</strong><span>คะแนนพื้นฐาน</span></div><div class="carry-category"><i>${category.icon}</i><div><small>นำไปทิ้งถัง</small><b>${category.name}</b></div></div><div class="carry-instruction"><kbd>E</kbd><span>กลับฐาน P1 แล้วกดทิ้ง</span></div><div class="carry-total">ทิ้งถูกครั้งนี้ <b>+${value}</b> คะแนน${remaining<=15?' · ×2':''}</div>`;
 }else{$('carry-hud').style.setProperty('--item-color','#a5bba4');$('carry-hud').innerHTML='<div class="carry-kicker">มือว่าง / READY TO PICK UP</div><div class="carry-art empty"><span>✋</span></div><h2>ไปเก็บขยะกัน!</h2><p class="carry-empty-copy">เข้าใกล้ขยะแล้วกด <kbd>E</kbd><br>มองหาวงแสง ของคะแนนสูงกำลังมา</p><div class="rarity-key"><span>● 10–15</span><span>✦ 20</span><span>✦ 30</span><span>★ 50</span></div>';}
}
function animateTrash(t,dt,held=false){
 if(!held){t.mesh.position.y=.35+Math.sin(clock*(2+t.tier.rank*.5)+t.phase)*(.065+t.tier.rank*.035);t.mesh.rotation.y+=dt*(.22+t.tier.rank*.12);}
 t.effects.rotation.y+=dt*(.5+t.tier.rank*.2);t.effects.scale.setScalar(1+Math.sin(clock*3+t.phase)*.06);
 t.sparks.forEach((s,i)=>{const a=clock*(1+t.tier.rank*.3)+i*Math.PI*2/t.sparks.length;s.position.set(Math.cos(a)*(.4+t.tier.rank*.08),.35+Math.sin(a*2)*.18+i*.07,Math.sin(a)*(.4+t.tier.rank*.08));s.rotation.y+=dt*2;});
}
function announce(text){$('event').textContent=text;show('event');eventTime=3.3;beep(350,.2,'triangle');}
function feedback(p,text){if(p.bot)return;if(!text.startsWith('+')){announce(text);return;}const el=document.createElement('div');el.className='float-feedback';el.textContent=text;el.style.fontSize=stage.width<500?'14px':'20px';const v=new THREE.Vector3(p.x,3.1,p.z).project(camera);el.style.left=`${clamp(stage.x+(v.x*.5+.5)*stage.width,stage.x+36,stage.x+stage.width-36)}px`;el.style.top=`${clamp(stage.y+(-v.y*.5+.5)*stage.height,stage.y+80,stage.y+stage.height-10)}px`;$('feedback').appendChild(el);el.addEventListener('animationend',()=>el.remove(),{once:true});}
const particleGeo=new THREE.SphereGeometry(1,6,4);
function burst(x,z,color,n=12){for(let i=0;i<n;i++){const m=mesh(particleGeo,color,x,1,z);m.scale.setScalar(rand(.04,.12));m.castShadow=false;particles.push({mesh:m,vx:rand(-2,2),vy:rand(2,5),vz:rand(-2,2),life:rand(.4,.85)});}}
function act(p){if(state!=='playing'||p.stun>0||p.actionTime>0)return;p.actionTime=.28;
 if(p.carry){const b=selectBin(p,bins);if(!b){if(!p.bot)feedback(p,`เข้าแถบสีหน้าถังฐาน P${p.id+1}`);return;}const old=p.carry,result=scoreSort(p,b.type,remaining);if(result.ok){disposeObject(old.mesh);b.flash=.65;p.celebrate=.5;roundTotal++;burst(b.x,b.z,TYPES[b.type].color,20);feedback(p,`+${result.points}${p.combo>1?' COMBO ×'+p.combo:''}`);beep(600+Math.min(p.combo,6)*90,.15);if(p.id===0&&p.sorted===1)announce('เยี่ยม! เก็บต่อให้ไว แล้วทำคอมโบ ✦');}else{p.avatar.body.rotation.z=.2;feedback(p,'ผิดถัง! −5');beep(150,.16,'sawtooth',.025);}}
 else{const near=trash.filter(t=>Math.hypot(t.x-p.x,t.z-p.z)<1.25).sort((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z))[0];if(near){trash.splice(trash.indexOf(near),1);p.carry=near;p.avatar.hold.add(near.mesh);near.mesh.position.set(0,0,0);near.mesh.rotation.set(0,0,0);near.mesh.scale.setScalar(.8);beep(410+near.tier.rank*170,.055);burst(p.x,p.z,'#fff5cb',5);}else if(!p.bot)feedback(p,'เข้าใกล้ขยะแล้วกดเก็บ');}updateHud();}
function dash(p){if(state!=='playing'||p.cooldown>0||p.stun>0)return;p.dash=.24;p.cooldown=2.1;beep(200,.08,'triangle');burst(p.x,p.z,'#fff8d9',6);}
function finish(){state='results';show('touch',false);show('event',false);show('carry-hud',false);const ranking=rankPlayers(players),top=ranking[0];const tied=ranking.filter(p=>p.score===top.score&&p.sorted===top.sorted);$('winner').textContent=tied.length>1?'เสมอกัน! เก่งทั้งแก๊ง 🎉':`${CAST[top.id].emoji} P${top.id+1} จอมแยกแห่งปาร์ตี้!`;$('result-subtitle').textContent=`ช่วยกันแยกขยะสำเร็จ ${roundTotal} ชิ้น · โลกสะอาดขึ้นเพราะพวกเรา`;$('ranking').innerHTML=ranking.map((p,i)=>`<div class="rank-row"><b>${i+1}</b><span>${CAST[p.id].emoji} P${p.id+1} ${p.bot?'· BOT':''}<br><small>แยกถูก ${p.sorted} ชิ้น</small></span><strong>${p.score}</strong></div>`).join('');$('results').showModal();beep(850,.4);for(let i=0;i<4;i++)burst(players[i]?.x||0,players[i]?.z||0,CAST[i].color,28);}
function pauseGame(){if(state!=='playing')return;state='paused';keys.clear();pressed.clear();touchMove.x=touchMove.z=0;$('pause-dialog').showModal();}
function resume(){if(state!=='paused')return;$('pause-dialog').close();state='playing';}
function controller(p,pads){let x=0,z=0;const c=CAST[p.id].keys;if(keys.has(c[0]))z--;if(keys.has(c[1]))z++;if(keys.has(c[2]))x--;if(keys.has(c[3]))x++;if(pressed.has(c[4]))act(p);if(pressed.has(c[5])||(p.id===0&&pressed.has('ShiftRight')))dash(p);const pad=pads[p.id];if(pad){if(Math.abs(pad.axes[0])>.18)x+=pad.axes[0];if(Math.abs(pad.axes[1])>.18)z+=pad.axes[1];if(pad.buttons[12]?.pressed)z--;if(pad.buttons[13]?.pressed)z++;if(pad.buttons[14]?.pressed)x--;if(pad.buttons[15]?.pressed)x++;if(pad.buttons[0]?.pressed&&!padPrev[p.id]?.a)act(p);if(pad.buttons[1]?.pressed&&!padPrev[p.id]?.b)dash(p);padPrev[p.id]={a:pad.buttons[0]?.pressed,b:pad.buttons[1]?.pressed};}if(p.id===0){x+=touchMove.x;z+=touchMove.z;if(touchAction)act(p);if(touchDash)dash(p);}return{x,z};}
function botMove(p){let target;if(p.carry){const b=bins.find(b=>b.owner===p.id&&b.type===p.carry.type);target={x:b.x,z:b.z+(b.z<0?1:-1)};if(Math.hypot(p.x-target.x,p.z-target.z)<.4)act(p);}else{target=trash.reduce((best,t)=>!best||Math.hypot(t.x-p.x,t.z-p.z)<Math.hypot(best.x-p.x,best.z-p.z)?t:best,null);if(target&&Math.hypot(target.x-p.x,target.z-p.z)<.85)act(p);}if(!target)return{x:0,z:0};const dx=target.x-p.x,dz=target.z-p.z,dist=Math.hypot(dx,dz);if(dist<.18)return{x:0,z:0};return{x:dx/dist,z:dz/dist};}
function movePlayer(p,input,dt){let {x,z}=input;const len=Math.hypot(x,z);p.move=len>.05?1:0;if(len>1){x/=len;z/=len;}if(p.stun>0){x*=.15;z*=.15;}const speed=(p.bot?3.15:4.5)*(p.carry?.94:1)*(p.dash>0?2.45:1);p.x=clamp(p.x+x*dt*speed,-12.6,12.6);p.z=clamp(p.z+z*dt*speed,-8.3,8.3);
 // Push characters out of the solid bins and side planters.
 for(const b of bins){const dx=p.x-b.x,dz=p.z-b.z,ox=.94-Math.abs(dx),oz=.86-Math.abs(dz);if(ox>0&&oz>0){if(ox<oz)p.x+=Math.sign(dx||1)*ox;else p.z+=Math.sign(dz||1)*oz;}}
 if(len>.05){const angle=Math.atan2(x,z),a=p.avatar.root.rotation.y;p.avatar.root.rotation.y=a+Math.atan2(Math.sin(angle-a),Math.cos(angle-a))*Math.min(1,dt*16);}
 p.cooldown=Math.max(0,p.cooldown-dt);p.dash=Math.max(0,p.dash-dt);p.stun=Math.max(0,p.stun-dt);p.actionTime=Math.max(0,p.actionTime-dt);p.celebrate=Math.max(0,p.celebrate-dt);
}
let clock=0,last=performance.now(),hudTick=0;
function animate(now){requestAnimationFrame(animate);const dt=Math.min((now-last)/1000,.04);last=now;clock+=dt;
 const isPlay=state==='playing',isLobby=state==='lobby',frozen=state==='paused';
 if(state==='countdown'){const before=Math.ceil(count);count-=dt;$('countdown').textContent=count>.4?Math.ceil(count-.4):'GO!';if(Math.ceil(count)!==before)beep(400,.1);if(count<=0){state='playing';resize();show('countdown',false);announce('เริ่มเลย! เก็บขยะ แล้วกลับถังฐานตัวเอง');}}
 if(isPlay){remaining=Math.max(0,remaining-dt);elapsed+=dt;tickWaves(dt);if(remaining<=15&&remaining+dt>15)announce('🔥 15 วินาทีสุดท้าย! คะแนน ×2');
 const pads=Array.from(navigator.getGamepads?.()||[]).filter(Boolean);
 for(const p of players)movePlayer(p,p.bot?botMove(p):controller(p,pads),dt);
 for(let i=0;i<players.length;i++)for(let j=i+1;j<players.length;j++){const a=players[i],b=players[j],dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz);if(d<.73){const nx=dx/(d||1),nz=dz/(d||1),push=(.73-d)*.5;a.x-=nx*push;a.z-=nz*push;b.x+=nx*push;b.z+=nz*push;if(a.dash>0&&b.stun<=0){b.stun=.55;b.x=clamp(b.x+nx*.7,-12.6,12.6);b.z=clamp(b.z+nz*.7,-8.3,8.3);feedback(b,'ว้าย!');burst(b.x,b.z,'#fff2c5',7);}if(b.dash>0&&a.stun<=0){a.stun=.55;a.x=clamp(a.x-nx*.7,-12.6,12.6);a.z=clamp(a.z-nz*.7,-8.3,8.3);}}}
 if(remaining<=0)finish();}
 if(!frozen){for(const p of players){const a=p.avatar,t=clock*11+p.phase,m=isLobby?.25:p.move;a.root.position.set(p.x,.14,p.z);a.body.position.y=(isLobby?Math.sin(clock*2+p.phase)*.04:Math.abs(Math.sin(t))*m*.11)+(p.celebrate>0?Math.sin(p.celebrate/.5*Math.PI)*.4:0);a.body.rotation.z=p.stun>0?Math.sin(clock*30)*.2:Math.sin(t)*m*.035;a.body.rotation.x=p.dash>0?.22:0;for(let i=0;i<2;i++){a.legs[i].rotation.x=Math.sin(t+i*Math.PI)*m*.72;a.arms[i].rotation.x=p.carry?-2.5:Math.sin(t+i*Math.PI)*m*.65;}a.head.rotation.z=Math.sin(clock*2+p.phase)*.035;a.head.scale.y=Math.sin(clock*1.1+p.phase)> .995?.9:1;a.hold.rotation.y=Math.sin(clock*2)*.15;a.ring.material.opacity=p.cooldown>0?.45:1;}
 for(const t of trash){animateTrash(t,dt);}for(const p of players)if(p.carry)animateTrash(p.carry,dt,true);
 for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.life-=dt;p.vy-=dt*9;p.mesh.position.x+=p.vx*dt;p.mesh.position.y+=p.vy*dt;p.mesh.position.z+=p.vz*dt;p.mesh.scale.multiplyScalar(1-dt*.8);if(p.life<=0){p.mesh.removeFromParent();particles.splice(i,1);}}
 for(const b of bins){b.flash=Math.max(0,b.flash-dt);b.mesh.scale.y=1.2+Math.sin(b.flash*15)*b.flash*.15;}
 if(eventTime>0){eventTime-=dt;if(eventTime<=0)show('event',false);}}
 if(isLobby){camera.setViewOffset(stage.width,stage.height,innerWidth>700?-stage.width*.29:0,innerWidth<=700?stage.height*.19:0,stage.width,stage.height);}else camera.clearViewOffset();
 updateBinGuides();renderer.render(scene,camera);hudTick+=dt;if(hudTick>.15){if(state!=='lobby')updateHud();hudTick=0;}pressed.clear();touchAction=false;touchDash=false;
}
function resize(){const touch=matchMedia('(pointer:coarse)').matches||innerWidth<700;document.body.classList.toggle('touch-enabled',touch);const rect=$('world').getBoundingClientRect();stage={x:rect.x,y:rect.y,width:Math.max(1,rect.width),height:Math.max(1,rect.height)};$('world').classList.toggle('symbol-labels',state!=='lobby'&&stage.width<600);$('world').classList.toggle('tiny-labels',state!=='lobby'&&stage.width<320);renderer.setSize(stage.width,stage.height);const aspect=stage.width/stage.height,half=Math.max(11.5,16.5/aspect);camera.left=-half*aspect;camera.right=half*aspect;camera.top=half;camera.bottom=-half;camera.updateProjectionMatrix();show('touch',state==='playing'&&touch);}
addEventListener('resize',resize);resize();
document.querySelectorAll('[data-count]').forEach(b=>b.onclick=()=>{humans=+b.dataset.count;document.querySelectorAll('[data-count]').forEach(el=>{el.classList.toggle('selected',el===b);el.setAttribute('aria-pressed',String(el===b));});$('bots').disabled=humans===4;});
$('start').onclick=startGame;$('again').onclick=startGame;$('menu').onclick=backToLobby;$('quit').onclick=backToLobby;$('pause').onclick=pauseGame;$('resume').onclick=resume;
$('sound').onclick=()=>{muted=!muted;$('sound').textContent=muted?'♪':'♫';$('sound').setAttribute('aria-label',muted?'เปิดเสียง':'ปิดเสียง');$('sound').setAttribute('aria-pressed',String(!muted));beep();};
let helpPaused=false;$('help').onclick=()=>{helpPaused=state==='playing';if(helpPaused){state='paused';keys.clear();}$('help-dialog').showModal();};function closeHelp(){$('help-dialog').close();if(helpPaused){state='playing';helpPaused=false;}}
document.querySelector('.close-dialog').onclick=closeHelp;document.querySelector('.close-help').onclick=closeHelp;$('help-dialog').addEventListener('cancel',e=>{e.preventDefault();closeHelp();});$('pause-dialog').addEventListener('cancel',e=>{e.preventDefault();resume();});$('results').addEventListener('cancel',e=>e.preventDefault());
addEventListener('keydown',e=>{if(e.code==='Escape'){if(!$('help-dialog').open){if(state==='playing')pauseGame();else if(state==='paused')resume();}return;}if(state!=='playing')return;if(CAST.some(c=>c.keys.includes(e.code))||e.code==='ShiftRight'){e.preventDefault();if(!keys.has(e.code))pressed.add(e.code);keys.add(e.code);}});addEventListener('keyup',e=>keys.delete(e.code));addEventListener('blur',()=>{keys.clear();pressed.clear();if(state==='playing')pauseGame();});document.addEventListener('visibilitychange',()=>{if(document.hidden&&state==='playing')pauseGame();});
const joy=$('joystick');let joyPointer=null;function joyReset(){joyPointer=null;touchMove.x=touchMove.z=0;joy.firstElementChild.style.transform='';}joy.onpointerdown=e=>{joyPointer=e.pointerId;joy.setPointerCapture(e.pointerId);joy.onpointermove(e);};joy.onpointermove=e=>{if(e.pointerId!==joyPointer)return;const r=joy.getBoundingClientRect(),x=e.clientX-r.left-r.width/2,z=e.clientY-r.top-r.height/2,l=Math.hypot(x,z),s=Math.min(1,38/(l||1));touchMove.x=x*s/38;touchMove.z=z*s/38;joy.firstElementChild.style.transform=`translate(${x*s}px,${z*s}px)`;};joy.onpointerup=joyReset;joy.onpointercancel=joyReset;joy.onlostpointercapture=joyReset;$('touch-action').onpointerdown=e=>{e.preventDefault();touchAction=true;};$('touch-dash').onpointerdown=e=>{e.preventDefault();touchDash=true;};
renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();pauseGame();show('load-error');});
backToLobby();requestAnimationFrame(animate);
// Small read-only diagnostics for QA, without exposing mutation controls to players.
window.trashDash={snapshot:()=>({state,remaining,trash:trash.length,wave:waveIndex+1,waveSpawned,items:trash.map(t=>({name:t.spec.name,points:t.spec.points,tier:t.tier.name,x:t.x,z:t.z})),binCount:bins.length,players:players.map(p=>({id:p.id,bot:p.bot,x:p.x,z:p.z,score:p.score,sorted:p.sorted,carry:p.carry?.spec.name||null}))})};

