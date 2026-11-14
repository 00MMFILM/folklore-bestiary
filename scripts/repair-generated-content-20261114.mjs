import fs from 'node:fs';
const dry=process.argv.includes('--dry');
const file='lib/folklore-data.ts', source=fs.readFileSync(file,'utf8');
const marker='export const FOLKLORE_DATA: CountryData[] = ';
const start=source.indexOf(marker)+marker.length,end=source.indexOf('\n',start);
const data=JSON.parse(source.slice(start,end).replace(/;$/,''));
const from=data.find(c=>c.i==='NG'),to=data.find(c=>c.i==='HT');
const oldId='ng-nago-lwa',newId='ht-nago-lwa';
const entry=from.b.find(b=>b.id===oldId);
const changes=[];
if(entry){
  if(to.b.some(b=>b.id===newId))throw new Error('Target already exists');
  const before=structuredClone(entry);
  entry.id=newId;
  entry.d='The Nago lwa are a group of spirits in Haitian Vodou, rooted in Yoruba religious traditions brought to Haiti. They are associated with powerful warrior figures, including many forms of Ogou.';
  entry.sh='아이티의 나고 로아 전승을 바탕으로 전사의 의무와 공동체의 기억을 다루는 이야기.';
  entry.src='https://en.wikipedia.org/wiki/Nago_lwa';
  from.b=from.b.filter(b=>b!==entry);to.b.push(entry);
  changes.push({id:newId,before,after:entry,reason:'Source identifies Haitian Vodou; Yoruba category inheritance incorrectly assigned Nigeria.'});
}
if(from.b.some(b=>b.id===newId)&&to.b.some(b=>b.id===newId)){
  from.b=from.b.filter(b=>b.id!==newId);
  changes.push({id:newId,reason:'Remove the unpublished duplicate left in the original country during reassignment.'});
}
const articleFile='content/articles/iq-ninisina.json',article=JSON.parse(fs.readFileSync(articleFile,'utf8'));
const original=JSON.stringify(article);
article.locales.en.origin=article.locales.en.origin.replace('Adad-apla-idi,','Adad-apla-iddina,');
article.locales.en.legend=article.locales.en.legend.replace('Damua','Damu').replace('Ninhursag','Ninhinuna');
article.locales.zh.origin=article.locales.zh.origin.replace('Adad-apla-idiya','Adad-apla-iddina');
article.locales.zh.legend=article.locales.zh.legend.replace('Shumash','Shumah').replace('尼纳拉利（Ninlil）','尼纳拉利（Ninarali）');
if(original!==JSON.stringify(article))changes.push({id:'iq-ninisina',reason:'Correct mistranscribed proper names against the source; Ninhinuna must not become Ninhursag.'});
console.log(JSON.stringify({dry,changes},null,2));
if(!dry&&changes.length){
  fs.writeFileSync(file,source.slice(0,start)+JSON.stringify(data)+';'+source.slice(end));
  const addedFile='scripts/.last-added.json';
  if(fs.existsSync(addedFile))fs.writeFileSync(addedFile,JSON.stringify(JSON.parse(fs.readFileSync(addedFile,'utf8')).map(id=>id===oldId?newId:id)));
  fs.writeFileSync(articleFile,JSON.stringify(article,null,2)+'\n');
  fs.mkdirSync('scripts/runlogs',{recursive:true});
  fs.appendFileSync('scripts/runlogs/automation-repair-20261114.jsonl',changes.map(change=>JSON.stringify({at:new Date().toISOString(),...change})).join('\n')+'\n');
}
