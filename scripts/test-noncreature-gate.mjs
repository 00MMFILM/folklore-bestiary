#!/usr/bin/env node
// ============================================================
// 크롤 게이트 재현 테스트 — isCreatureArticle이
//   (A) 비생물(서적·장소·풍습·의례·실존인물·사물)을 reject
//   (B) 진짜 생물(특히 lake monster·forest spirit·mountain god,
//       그리고 2번째 문장에 "is the word for"가 있는 ro-langs 함정)을 pass
// 하는지 검증. 문장은 실제 Wikipedia intro에서 가져옴.
// 사용법: node scripts/test-noncreature-gate.mjs
// ============================================================

import { isCreatureArticle } from './crawl-wikipedia-folklore.mjs';

// ── (A) reject 되어야 하는 비생물 (2026-08 삭제분 실제 문장) ──
const MUST_REJECT = [
  ['Kiringul', "Kiringul (Korean: 기린굴; lit. 'Kirin's Grotto') is a cave in North Korea said to have been the home of the kirin ridden by King Dongmyeong of Goguryeo."],
  ["Devil's Sword Dance", "The Devil's Sword Dance (鬼剣舞, onikenbai) is a sword dance usually performed by a group of eight dancers in Iwate Prefecture, Japan."],
  ['Inau', "In Ainu culture, inau or inaw is a ritual wood-shaving stick used in prayers to the divine spirits."],
  ['Chinese spirit possession', "Chinese spirit possession is a practice performed by specialists across China and Taiwan, and encompasses a range of phenomena."],
  ['Miscellaneous Morsels from Youyang', "The Miscellaneous Morsels from Youyang is a book written by Duan Chengshi in the 9th century during the Tang dynasty."],
  ['Durga Puja in West Bengal', "Durga Puja in West Bengal is an annual festival celebrated magnificently marking the victory of goddess Durga."],
  ['Ayodhya', "Ayodhya is a city mentioned in the ancient Sanskrit-language texts, including the Ramayana and the Mahabharata."],
  ['Devakkoothu', "Devakkoothu, also spelled as Devakoothu, is a ritualistic dance performed in Kerala, India."],
  ['Bullaun', "A bullaun is the term used for the depression in a stone that is often water-filled."],
  ['Járnviðr', "In Norse mythology, Járnviðr (Old Norse 'Iron-wood') is a forest located east of Midgard, inhabited by troll-women who bore giant wolves."],
  ['Mount Zas', "Mount Zas, also known as Mount Zeus, is a mountain on the Greek island of Naxos."],
  ['Šventaragis Valley', "Šventaragis Valley is a valley at the confluence of the Neris and Vilnia Rivers in Vilnius, Lithuania."],
  ['Ofinran', "Ofinran was a 16th-century king of the Oyo Empire in West Africa who succeeded Onigbogi as Alaafin of Oyo."],
  ['Baetyl', "A baetyl, literally 'house of god', is a sacred stone that was venerated and thought to house a god."],
  ['Alatyr', "The Alatyr is a sacred stone in Russian folklore, the 'father to all stones', the navel of the earth."],
  ['Sakanoue no Tamuramaro', "Sakanoue no Tamuramaro was a general and shogun of the early Heian period of Japan."],
  ['Jamaica Anansi Stories', "Jamaica Anansi Stories is a book by Martha Warren Beckwith published in 1924, a collection of folklore."],
  ['Ayvu Rapyta', "Ayvu Rapyta is a book written in the Mbya Guarani language with a Spanish translation of mythical texts."],
  ['Bluenose Ghosts', "Bluenose Ghosts is a book which presents a series of Nova Scotia ghost stories collected over forty years."],
  ['Iron John', "Iron John: A Book About Men is a book by American poet Robert Bly, an exegesis of the fairy tale Iron John."],
  ['Arthurian Literature', "Arthurian Literature is a book series published annually since 1982 by Boydell & Brewer."],
];

// ── (B) pass 되어야 하는 진짜 생물 (기존 데이터 실존 존재) ──
const MUST_PASS = [
  ['Manipogo', "In Canadian folklore, the Manipogo is a lake monster said to live in Lake Manitoba, Manitoba, Canada."],
  ['Memphré', "In Canadian folklore, Memphré is a lake monster said to live in Lake Memphremagog, a freshwater glacial lake."],
  ['Lariosauro', "In Italian folklore, Lariosauro is a lake monster said to live in Lake Como in Italy."],
  ['Afanc', "The Afanc is a lake monster from Welsh folklore that devoured anyone who entered its waters."],
  ['Caipora', "Caipora is a forest spirit or humanoid creature in Tupi-Guarani mythology that protects the animals of the forest."],
  ['Menk', "In Khanty and Mansi folklore, the Menk is a forest spirit of these peoples' mythology, a giant humanoid."],
  ['Bergmönch', "The Bergmönch is a mountain spirit from German folklore who appears as a gigantic monk."],
  ['Muc-sheilche', "In Scottish folklore, Muc-sheilche is a lake monster said to inhabit a loch in Wester Ross."],
  ['Ro-langs', "A ro-langs is a zombie-like creature from Tibetan folklore. Ro is the word for corpse and langs means to rise."],
  ['Gumiho', "The Gumiho is a nine-tailed fox that can freely transform into a beautiful woman in Korean folklore."],
  ['Kraken', "The Kraken is a legendary sea monster of enormous size said to appear off the coasts of Norway."],
  ['Zao Gongen', "Zaō Gongen is a mountain god worshipped in the Shugendō tradition of Japanese mountain asceticism."],
  ['Vodyanoy', "In Slavic mythology, the Vodyanoy is a water spirit who lives in rivers and drowns those who anger him."],
  ['Leshy', "The Leshy is a forest-dwelling spirit who protects wild animals and forests in Slavic mythology."],
  ['Nyami Nyami', "The Nyami Nyami is a river god of the Tonga people, depicted as a serpent-like dragon of the Zambezi."],
];

let failN = 0;
console.log('── (A) 비생물 → reject 되어야 함 ──');
for (const [name, extract] of MUST_REJECT) {
  const passed = isCreatureArticle({ title: name, extract });
  if (passed) { console.log(`  ✗ FAIL (통과됨): ${name}`); failN++; }
}
console.log(`  reject 성공: ${MUST_REJECT.length - failN}/${MUST_REJECT.length}`);

let failP = 0;
console.log('\n── (B) 진짜 생물 → pass 되어야 함 ──');
for (const [name, extract] of MUST_PASS) {
  const passed = isCreatureArticle({ title: name, extract });
  if (!passed) { console.log(`  ✗ FAIL (막힘): ${name}`); failP++; }
}
console.log(`  pass 성공: ${MUST_PASS.length - failP}/${MUST_PASS.length}`);

const total = failN + failP;
console.log(`\n${total === 0 ? '✅ 전건 통과' : `❌ 실패 ${total}건 (reject누락 ${failN} · 오차단 ${failP})`}`);
process.exit(total === 0 ? 0 : 1);
