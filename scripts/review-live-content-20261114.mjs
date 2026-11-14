import fs from 'node:fs';
const dry=process.argv.includes('--dry'),file='lib/folklore-data.ts',src=fs.readFileSync(file,'utf8');
const marker='export const FOLKLORE_DATA: CountryData[] = ',start=src.indexOf(marker)+marker.length,end=src.indexOf('\n',start);
const data=JSON.parse(src.slice(start,end).replace(/;$/,'')),all=data.flatMap(c=>c.b),changes=[];
const reviewed={
 'fr-galtxagorriak':{
   d:'Galtxagorriak are tiny household spirits in Basque folklore, known for their red trousers. They perform chores with extraordinary speed and may become angry when left without work.',
   sh:'일거리를 순식간에 끝내는 바스크의 작은 정령들과, 끝없이 새 일을 찾아야 하는 주인의 이야기.',
   src:'https://en.wikipedia.org/wiki/Galtxagorriak',
   translations:{
    ko:{d:'갈차고리아크는 바스크 민속에 등장하는 작은 집안 정령들로, 붉은 바지가 특징이다. 집안일을 놀라운 속도로 해내지만 맡길 일이 없어지면 화를 내기도 한다.'},
    ja:{d:'ガルチャゴリアクはバスク民間伝承に登場する小さな家の精霊たちで、赤いズボンが特徴である。家事を驚くほど速く片付けるが、仕事がなくなると怒ることもある。',sh:['家事を瞬時に終えるバスクの小さな精霊たちと、絶えず新たな仕事を探す主人の物語。']},
    zh:{d:'Galtxagorriak是巴斯克民间传说中的小型家宅精灵，以红色裤子为特征。它们能极快地完成家务，但没有工作可做时也可能发怒。',sh:['巴斯克的小精灵们瞬间做完家务，主人只好不断为它们寻找新任务的故事。']}
   }
 },
 'iq-ninisina':{
   t:'Deity',d:'Ninisina was the patron goddess of Isin in ancient Mesopotamia and a deity of healing.',
   sh:'고대 이신의 치유 여신 전승을 바탕으로 돌봄과 공동체의 회복을 다루는 이야기.',
   translations:{
    ko:{d:'니니시나는 고대 메소포타미아 도시 이신의 수호 여신이자 치유의 신이다.'},
    ja:{d:'ニニシナは古代メソポタミアの都市イシンの守護女神であり、治癒の神である。',sh:['古代イシンの治癒の女神の伝承を基に、ケアと共同体の回復を描く物語。']},
    zh:{d:'尼尼西纳是古代美索不达米亚城市伊辛的守护女神，也是治疗之神。',sh:['以古代伊辛的治疗女神传说为基础，讲述照护与共同体复原的故事。']}
   }
 }
};
const localeData=Object.fromEntries(['ko','ja','zh'].map(l=>[l,JSON.parse(fs.readFileSync(`public/i18n/creatures-${l}.json`,'utf8'))]));
for(const [id,{translations,...patch}]of Object.entries(reviewed)){
 const entry=all.find(c=>c.id===id);if(!entry)throw new Error(`Missing ${id}`);
 changes.push({id,before:structuredClone(entry),patch,reason:'Review of newly published content: complete truncated introduction and align goddess classification with cited source.'});Object.assign(entry,patch);
 for(const l of ['ko','ja','zh'])Object.assign(localeData[l][id],translations[l]);
}
console.log(JSON.stringify({dry,changes:changes.map(c=>({id:c.id,patch:c.patch}))},null,2));
if(!dry){
 fs.writeFileSync(file,src.slice(0,start)+JSON.stringify(data)+';'+src.slice(end));
 for(const l of ['ko','ja','zh'])fs.writeFileSync(`public/i18n/creatures-${l}.json`,JSON.stringify(localeData[l]));
 fs.appendFileSync('scripts/runlogs/automation-repair-20261114.jsonl',changes.map(c=>JSON.stringify({at:new Date().toISOString(),...c})).join('\n')+'\n');
}
