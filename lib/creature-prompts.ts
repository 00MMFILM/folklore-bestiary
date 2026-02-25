// ============================================================
// 📁 lib/creature-prompts.ts
// GFS 문화권 대표 크리처 프롬프트 데이터베이스
// 6개 문화권 × 5개 = 30개 프리셋 크리처
// ============================================================

export interface CreaturePrompt {
  id: string;
  name: string;
  nameEn: string;
  country: string;
  countryCode: string;
  region: string;
  fearLevel: number;
  description: string;
  abilities: string[];
  prompt: string;        // DALL-E 3 기본 프롬프트
  negativeHints: string; // 피해야 할 요소
}

export const CREATURE_PROMPTS: CreaturePrompt[] = [
  // ═══════════════════════════════════════
  // 🏯 동아시아 (East Asia)
  // ═══════════════════════════════════════
  {
    id: 'dokkaebi',
    name: '도깨비',
    nameEn: 'Dokkaebi',
    country: '한국',
    countryCode: 'KR',
    region: 'east-asia',
    fearLevel: 6,
    description: '방망이를 든 장난꾸러기 귀신. 오래된 물건에서 태어나며 일본 오니와는 완전히 다른 존재.',
    abilities: ['변신', '투명화', '씨름'],
    prompt: `Korean Dokkaebi goblin spirit, muscular humanoid figure with a SINGLE horn on forehead, 
holding a magical iron club (bangmangi), mischievous knowing grin with sharp teeth, 
surrounded by floating blue ghost flames (dokkaebi-bul), wearing rugged traditional Korean 
armor with tiger-pelt shoulders, standing in a moonlit Korean mountain path with ancient 
pine trees, ethereal blue and teal color palette`,
    negativeHints: 'NOT Japanese oni, NOT red-skinned, NOT two horns, NOT club-wielding brute'
  },
  {
    id: 'gumiho',
    name: '구미호',
    nameEn: 'Gumiho',
    country: '한국',
    countryCode: 'KR',
    region: 'east-asia',
    fearLevel: 8,
    description: '아홉 개의 꼬리를 가진 여우 요괴. 인간의 간을 먹어 인간이 되려 한다.',
    abilities: ['변신', '유혹', '환술'],
    prompt: `Korean nine-tailed fox spirit Gumiho in semi-human form, elegant woman
with subtle vulpine features (slightly pointed ears, amber fox eyes with slit pupils),
nine luminous white fox tails spreading elegantly behind her, wearing a flowing white
hanbok with crimson inner lining, holding a glowing blue fox bead (yeowoo-guseul)
between slender fingers, standing in a moonlit bamboo forest, ethereal and mysterious,
silver moonlight casting long shadows, semi-realistic webtoon concept art`,
    negativeHints: 'NOT cute or cartoonish, NOT Japanese kitsune style'
  },
  {
    id: 'tengu',
    name: '텐구',
    nameEn: 'Tengu',
    country: '일본',
    countryCode: 'JP',
    region: 'east-asia',
    fearLevel: 7,
    description: '긴 코와 붉은 얼굴의 산신. 무술의 달인이자 바람을 다스린다.',
    abilities: ['비행', '검술', '바람 조종'],
    prompt: `Japanese Tengu mountain demon, tall imposing figure with long red nose (daitengu form) 
and fierce crimson face, massive black crow wings spread wide, wearing traditional 
yamabushi mountain priest robes with pom-pom sash, wielding a hauchiwa feather fan 
that commands wind, perched on a twisted ancient pine branch on a misty Japanese 
mountain peak, torii gate visible in fog below, dramatic wind effects swirling leaves`,
    negativeHints: 'NOT small or comical, NOT green'
  },
  {
    id: 'jiangshi',
    name: '강시',
    nameEn: 'Jiangshi',
    country: '중국',
    countryCode: 'CN',
    region: 'east-asia',
    fearLevel: 7,
    description: '뻣뻣한 몸으로 깡충깡충 뛰어다니는 중국의 좀비. 부적으로만 제어할 수 있다.',
    abilities: ['불사', '흡기', '도약'],
    prompt: `Chinese hopping vampire Jiangshi, stiff reanimated corpse in ornate dark blue Qing dynasty 
Mandarin official court robes with embroidered rank badges, arms rigidly outstretched 
forward, yellow paper talisman with red Chinese calligraphy pasted on forehead, 
pale greenish-grey skin with visible dark veins, long sharp fingernails, glowing 
sickly green eyes, standing in a foggy Chinese graveyard with traditional spirit walls 
and ancient tombstones, eerie green phosphorescent mist swirling at feet`,
    negativeHints: 'NOT Western zombie style, NOT decayed flesh'
  },
  {
    id: 'olgoi-khorkhoi',
    name: '올고이코르코이',
    nameEn: 'Mongolian Death Worm',
    country: '몽골',
    countryCode: 'MN',
    region: 'east-asia',
    fearLevel: 9,
    description: '고비 사막의 거대 벌레. 전기를 방출하고 맹독을 뿜는다.',
    abilities: ['전기 방출', '독액', '지중 이동'],
    prompt: `Mongolian Olgoi-Khorkhoi, massive crimson segmented worm creature (3 meters long)
emerging from Gobi desert sand, eyeless head with circular mouth, electrical arcs and
lightning crackling around its body, enormous sand explosion around emergence point,
barren Gobi desert landscape stretching to horizon, dramatic dust clouds billowing,
harsh desert sunlight, sense of massive scale, fantasy creature illustration style`,
    negativeHints: 'NOT cute worm, NOT earthworm-like, NOT small'
  },

  // ═══════════════════════════════════════
  // 🏰 유럽 (Europe)
  // ═══════════════════════════════════════
  {
    id: 'banshee',
    name: '밴시',
    nameEn: 'Banshee',
    country: '아일랜드',
    countryCode: 'IE',
    region: 'europe',
    fearLevel: 8,
    description: '죽음을 예고하는 울부짖는 여인. 그녀의 비명은 가문의 죽음을 알린다.',
    abilities: ['예지', '비명', '투명화'],
    prompt: `Irish Banshee (Bean Sídhe), spectral wailing woman floating above ground, impossibly 
long flowing white hair whipping in supernatural wind, hollow black eye sockets streaming 
ghostly luminous tears, mouth open in an otherworldly piercing scream with visible sonic 
waves distorting the air, wearing a tattered ancient grey burial shroud and hooded cloak, 
translucent ghostly body, hovering over a Celtic graveyard with weathered stone crosses 
and round tower in background, thick Irish mist, monochromatic silver palette with pale 
blue spectral glow`,
    negativeHints: 'NOT beautiful, NOT sexy ghost, NOT colorful'
  },
  {
    id: 'kraken',
    name: '크라켄',
    nameEn: 'Kraken',
    country: '노르웨이',
    countryCode: 'NO',
    region: 'europe',
    fearLevel: 10,
    description: '배를 삼키는 거대한 바다 괴물. 바다 전체를 뒤흔든다.',
    abilities: ['촉수 공격', '해류 조종', '위장'],
    prompt: `Norse Kraken, colossal ancient octopus-like sea monster rising from dark stormy North Sea,
massive barnacle-encrusted tentacles (each thicker than a ship mast) wrapping around a
wooden Viking longship, one enormous ancient intelligent eye (size of a wagon wheel)
glowing beneath the waves, lightning illuminating the beast against stormy clouds,
mountainous waves, sense of incomprehensible scale with tiny ship versus enormous creature,
deep ocean blue-black and storm grey palette, epic fantasy illustration`,
    negativeHints: 'NOT cartoon octopus, NOT small scale'
  },
  {
    id: 'baba-yaga',
    name: '바바야가',
    nameEn: 'Baba Yaga',
    country: '러시아',
    countryCode: 'RU',
    region: 'europe',
    fearLevel: 7,
    description: '닭 다리 오두막의 마녀. 선한 자에겐 지혜를, 악한 자에겐 죽음을.',
    abilities: ['마법', '변신', '예언'],
    prompt: `Slavic witch Baba Yaga, ancient fearsome crone with wild matted grey hair, iron teeth 
gleaming, long hooked nose with warts, piercing knowing eyes, flying through a dark 
Russian birch forest in a giant weathered wooden mortar using an enormous pestle as 
rudder, her iconic hut (izbushka) on two enormous chicken legs visible in the background 
among the trees, fence of human skulls on posts with glowing eye sockets lighting the 
path, sweeping away her trail with a silver birch broom, deep dark forest atmosphere 
with shafts of moonlight through birch canopy`,
    negativeHints: 'NOT cute witch, NOT Western witch hat style, NOT broomstick flying'
  },
  {
    id: 'strigoi',
    name: '스트리고이',
    nameEn: 'Strigoi',
    country: '루마니아',
    countryCode: 'RO',
    region: 'europe',
    fearLevel: 9,
    description: '무덤에서 돌아온 루마니아의 뱀파이어. 드라큘라의 원형.',
    abilities: ['흡혈', '변신', '초인적 힘'],
    prompt: `Romanian Strigoi vampire (original Dracula folklore), gaunt aristocratic figure with 
deathly pale translucent skin showing dark branching veins underneath, blood-red eyes 
with vertical slit pupils, elongated canine fangs stained with fresh blood, wearing 
decayed ornate medieval Wallachian nobleman clothing (dark velvet with tarnished gold 
embroidery), long claw-like fingernails, emerging from a cracked stone sarcophagus in 
a Gothic Transylvanian crypt with dripping candles and cobwebs, bats swirling in 
background, deep crimson and shadow color palette`,
    negativeHints: 'NOT Hollywood handsome vampire, NOT modern clothing'
  },
  {
    id: 'draugr',
    name: '드라우그',
    nameEn: 'Draugr',
    country: '아이슬란드',
    countryCode: 'IS',
    region: 'europe',
    fearLevel: 8,
    description: '무덤을 지키는 북유럽의 언데드 전사. 초자연적인 힘을 가졌다.',
    abilities: ['초인적 힘', '크기 변화', '저주'],
    prompt: `Norse Draugr ancient Viking spirit warrior, massive spectral figure twice normal human size
with pale frost-blue skin and glowing ice-blue eyes, wearing corroded Viking chainmail
armor with ancient runes, iron helmet, wielding an ancient broadsword, guarding a
treasure-filled Viking burial mound filled with gold and weapons, frost emanating from
body, northern lights (aurora borealis) shimmering in the Arctic sky above, cold icy
blue and dark iron palette, dark fantasy illustration`,
    negativeHints: 'NOT skeleton, NOT clean armor, NOT Skyrim game style'
  },

  // ═══════════════════════════════════════
  // 🗿 아메리카 (Americas)
  // ═══════════════════════════════════════
  {
    id: 'wendigo',
    name: '웬디고',
    nameEn: 'Wendigo',
    country: '캐나다',
    countryCode: 'CA',
    region: 'americas',
    fearLevel: 10,
    description: '식인 욕구에 사로잡힌 자가 변하는 괴물. 끝없는 허기에 시달린다.',
    abilities: ['초인적 속도', '정신 조종', '극한 내성'],
    prompt: `Algonquian Wendigo, towering spectral humanoid creature (over 4 meters tall) with
enormous elk antler crown growing from its head, hollow dark eye sockets with tiny
pinpoint yellow lights deep within, elongated shadowy limbs with unnaturally long
fingers, grey translucent skin, standing in a dark frozen Canadian boreal forest at
night, visible icy breath, snow around feet, dead trees, overwhelming sense of cold
and isolation, desaturated 
cold blue-grey palette with bone white accents`,
    negativeHints: 'NOT werewolf, NOT deer-headed (Hollywood style), NOT muscular'
  },
  {
    id: 'quetzalcoatl',
    name: '케찰코아틀',
    nameEn: 'Quetzalcoatl',
    country: '멕시코',
    countryCode: 'MX',
    region: 'americas',
    fearLevel: 6,
    description: '깃털 달린 뱀의 신. 아즈텍 문명의 중심 신화.',
    abilities: ['비행', '바람 조종', '지혜 부여'],
    prompt: `Aztec Feathered Serpent god Quetzalcoatl, massive sinuous serpentine dragon body covered 
in iridescent emerald green and brilliant gold quetzal feathers, elaborate carved stone 
Aztec headdress with jade and turquoise inlays, feathered wings spread magnificently, 
coiling majestically around an ancient Mesoamerican stepped pyramid (Teotihuacan style), 
golden divine light radiating from body, turquoise jade ornaments and golden rings along 
body, jungle canopy below, dramatic sunset sky with clouds parting, rich saturated gold 
emerald and turquoise color palette`,
    negativeHints: 'NOT European dragon, NOT Chinese dragon, NOT simple snake'
  },
  {
    id: 'chupacabra',
    name: '추파카브라',
    nameEn: 'Chupacabra',
    country: '푸에르토리코',
    countryCode: 'PR',
    region: 'americas',
    fearLevel: 7,
    description: '가축의 피를 빨아먹는 괴생물. 현대 도시전설의 대표.',
    abilities: ['흡혈', '야간 시력', '도약'],
    prompt: `Chupacabra cryptid creature, hairless reptilian-canine hybrid with grey-blue scaly skin,
row of sharp bony spines running down its hunched back, large oval reflective red eyes
catching moonlight, elongated snout with sharp fangs, powerful kangaroo-like hind legs
for leaping, crouching in dusty rural Caribbean farmland at night, wooden fence and
tropical vegetation, single harsh moonlight beam illuminating the creature, eerie
unsettling atmosphere, muted grey-blue palette, cryptid illustration style`,
    negativeHints: 'NOT cute, NOT alien grey, NOT dog with mange'
  },
  {
    id: 'mapinguari',
    name: '마핑구아리',
    nameEn: 'Mapinguari',
    country: '브라질',
    countryCode: 'BR',
    region: 'americas',
    fearLevel: 8,
    description: '아마존 열대우림의 거대 괴물. 악취로 적을 무력화한다.',
    abilities: ['악취 공격', '불사', '괴력'],
    prompt: `Brazilian Mapinguari, massive prehistoric ground-sloth-like beast standing upright (over 
3 meters), covered in thick matted dark reddish-brown fur, single large cyclops eye 
with intelligent malice, enormous gaping secondary mouth on its belly with sharp teeth, 
huge curved claws on powerful arms, towering over dense Amazon rainforest understory, 
visible green stench waves radiating from body with insects fleeing, broken trees and 
trampled vegetation in its wake, oppressive humid tropical atmosphere, lush green jungle 
with earthy brown and warning red accents`,
    negativeHints: 'NOT Bigfoot/Sasquatch, NOT cute sloth'
  },
  {
    id: 'pishtaco',
    name: '피시타코',
    nameEn: 'Pishtaco',
    country: '페루',
    countryCode: 'PE',
    region: 'americas',
    fearLevel: 8,
    description: '인간의 지방을 빼앗는 안데스의 괴물. 식민지 공포의 상징.',
    abilities: ['변장', '지방 추출', '최면'],
    prompt: `Andean Pishtaco, tall gaunt unnervingly pale figure in tattered colonial-era Spanish 
conquistador clothing (moth-eaten doublet, worn leather boots), impossibly wide unnatural 
smile with too-white too-many teeth, sunken dark eyes with hypnotic stare, carrying 
a weathered leather satchel and gleaming sharp curved knife, long bony fingers, walking 
through a misty high-altitude Peruvian Andes mountain village at dusk, colonial architecture 
mixed with Incan stone ruins in background, llamas fleeing, uncanny valley unsettling 
atmosphere, muted earth tones with sickly pale skin contrast`,
    negativeHints: 'NOT obviously monstrous, NOT zombie, the horror is in the almost-human quality'
  },

  // ═══════════════════════════════════════
  // 🌍 아프리카 (Africa)
  // ═══════════════════════════════════════
  {
    id: 'adze',
    name: '아제',
    nameEn: 'Adze',
    country: '가나',
    countryCode: 'GH',
    region: 'africa',
    fearLevel: 7,
    description: '반딧불이로 변해 잠든 사람의 피를 빠는 뱀파이어.',
    abilities: ['변신', '흡혈', '빙의'],
    prompt: `West African Adze vampire spirit from Ewe mythology, dual-form transformation scene: 
large supernatural firefly with sinister pulsing amber-red glow transitioning into a 
hunched dark humanoid figure with glowing amber eyes and sharp teeth emerging from the 
light, West African village with traditional round thatched-roof huts at deep night, 
palm trees silhouetted against starry sky, trail of bioluminescent light between forms, 
sleeping villager visible through doorway, warm threatening amber glow against deep 
midnight blue atmosphere`,
    negativeHints: 'NOT Western vampire, NOT bat transformation, NOT European setting'
  },
  {
    id: 'tokoloshe',
    name: '토콜로셰',
    nameEn: 'Tokoloshe',
    country: '남아프리카',
    countryCode: 'ZA',
    region: 'africa',
    fearLevel: 6,
    description: '악의적인 물의 난쟁이. 주술사가 소환하여 적에게 보낸다.',
    abilities: ['투명화', '저주', '물 조종'],
    prompt: `South African Tokoloshe from Zulu mythology, small malevolent water dwarf (about 1 meter 
tall) with wizened dark leathery skin, oversized bald head with hollow dark eye sockets 
and a mouth full of sharp crooked teeth in a malicious grin, carrying bone charms and 
fetish pouches, dripping with river water, emerging from murky river water at night near 
a traditional South African homestead, bed raised on bricks visible through window 
(traditional protection against Tokoloshe), murky water green and midnight blue atmosphere 
with unsettling stillness`,
    negativeHints: 'NOT cute goblin, NOT European gnome, NOT friendly'
  },
  {
    id: 'ninki-nanka',
    name: '닌키난카',
    nameEn: 'Ninki Nanka',
    country: '감비아',
    countryCode: 'GM',
    region: 'africa',
    fearLevel: 9,
    description: '늪지에 사는 거대 용. 목격하면 반드시 죽는다.',
    abilities: ['독기', '최면 시선', '수중 이동'],
    prompt: `Gambian Ninki Nanka, massive dragon-serpent hybrid in dark mangrove swamp,
extremely long sinuous neck rising from murky water, horse-like head with three curved
horns and a crest of fins, large glowing yellow-green eyes with vertical slit pupils,
iridescent dark green-black scales reflecting dim moonlight, body partially submerged
showing enormous coils in dark water, dense West African coastal wetland with twisted
mangrove roots, mysterious humid atmosphere, swamp green and dark water palette,
fantasy creature concept art`,
    negativeHints: 'NOT Loch Ness Monster, NOT European dragon, NOT friendly'
  },
  {
    id: 'popobawa',
    name: '포포바와',
    nameEn: 'Popobawa',
    country: '탄자니아',
    countryCode: 'TZ',
    region: 'africa',
    fearLevel: 9,
    description: '박쥐 날개의 악령. 잔지바르 섬의 밤을 공포로 물들인다.',
    abilities: ['비행', '공포 유발', '변신'],
    prompt: `Tanzanian Popobawa, terrifying shadow entity with enormous leathery bat wings spread 
wide (spanning entire width of image), single large cyclopean glowing crimson eye in 
center of dark amorphous head, body made of living shadow and dark smoke with barely 
visible clawed hands reaching out, hovering menacingly above Zanzibar Stone Town 
rooftops at deep night, ornate Swahili carved wooden doors and white coral-stone 
architecture below, citizens' oil lanterns flickering with fear, pure black and deep 
blood-red color palette with minimal detail in shadows`,
    negativeHints: 'NOT solid physical body, NOT cute bat, NOT well-defined features'
  },
  {
    id: 'impundulu',
    name: '임푼둘루',
    nameEn: 'Impundulu',
    country: '남아프리카',
    countryCode: 'ZA',
    region: 'africa',
    fearLevel: 8,
    description: '번개를 부르는 거대한 새. 흑마술사의 하수인.',
    abilities: ['번개 소환', '흡혈', '폭풍 생성'],
    prompt: `South African Lightning Bird Impundulu from Xhosa/Zulu mythology, massive supernatural 
raptor-like bird with jet-black and electric-white plumage, crackling with visible 
electricity and lightning arcs along its wingspan, brilliant lightning bolts striking 
from its extended wingtips down to the ground, sharp blood-stained talons, fierce 
glowing white eyes with inner lightning, silhouetted against a dramatic violet-black 
thunderstorm over South African grassland savanna, rain falling in sheets, 
electric white and stormy deep purple palette with lightning flash illumination`,
    negativeHints: 'NOT phoenix, NOT thunderbird (Native American), NOT friendly bird'
  },

  // ═══════════════════════════════════════
  // 🕉️ 남아시아 (South Asia)
  // ═══════════════════════════════════════
  {
    id: 'rakshasa',
    name: '락샤사',
    nameEn: 'Rakshasa',
    country: '인도',
    countryCode: 'IN',
    region: 'south-asia',
    fearLevel: 8,
    description: '변신하는 악마 종족. 인간을 잡아먹으며 환술에 능하다.',
    abilities: ['변신', '환술', '마법'],
    prompt: `Indian Rakshasa from Hindu mythology, powerful multi-armed (four arms) humanoid
with dark blue-tinged skin, tiger-like fangs, vertical third eye on forehead glowing
red, wearing ornate dark Indian royal jewelry (heavy gold with dark gems), elaborate
crown, curved talons on each hand holding different items (curved sword, sacred cup,
orb of power, magical flame), seated on an ancient dark throne in an underground palace
with carved Dravidian pillars, deep royal purple and tarnished gold palette,
mythological illustration style`,
    negativeHints: 'NOT D&D rakshasa (tiger-headed), NOT friendly deity'
  },
  {
    id: 'vetala',
    name: '베탈라',
    nameEn: 'Vetala',
    country: '인도',
    countryCode: 'IN',
    region: 'south-asia',
    fearLevel: 7,
    description: '시체에 빙의하는 영혼. 과거와 미래를 꿰뚫어 본다.',
    abilities: ['빙의', '예지', '정신 조종'],
    prompt: `Mystical Indian forest spirit inspired by Baital folklore, a luminous ethereal figure
sitting on a giant ancient banyan tree branch at dusk, glowing white eyes full of
ancient wisdom, flowing grey robes and long dark hair moving in supernatural wind,
surrounded by floating spirit orbs, ancient Indian stone ruins overgrown with vines
in background, magical twilight atmosphere with warm amber and cool silver tones,
Indian mythology inspired fantasy concept art, painterly style`,
    negativeHints: 'NOT Western vampire, NOT bat, NOT standing upright initially'
  },
  {
    id: 'yaksha',
    name: '야차',
    nameEn: 'Yaksha',
    country: '스리랑카',
    countryCode: 'LK',
    region: 'south-asia',
    fearLevel: 5,
    description: '자연과 보물의 수호신. 선하지만 분노하면 치명적.',
    abilities: ['자연 조종', '보물 수호', '치유'],
    prompt: `Sri Lankan Yaksha nature guardian spirit, powerful muscular humanoid figure with 
green-tinged skin adorned with living vines, flowers, and moss growing from body, 
ornate ancient Sinhalese golden crown with lotus motifs, heavy gold jewelry (armlets, 
necklace, anklets) in traditional Sri Lankan style, benevolent but stern powerful 
expression, guarding the entrance to a treasure-filled cave in a lush tropical forest 
with exotic orchids and glowing bioluminescent plants, surrounded by reverent wild 
animals (elephants, peacocks), warm emerald green and rich gold palette`,
    negativeHints: 'NOT evil demon, NOT Japanese yakuza, NOT small creature'
  },
  {
    id: 'bhoot',
    name: '부트',
    nameEn: 'Bhoot',
    country: '방글라데시',
    countryCode: 'BD',
    region: 'south-asia',
    fearLevel: 6,
    description: '비정상적 죽음을 맞은 영혼. 발이 뒤로 돌아가 있다.',
    abilities: ['빙의', '투명화', '공포 유발'],
    prompt: `South Asian Bhoot ghost, translucent pale female figure floating slightly above 
ground, feet distinctly turned BACKWARDS (key identifying feature), long unkempt dark 
hair partially covering face revealing one hollow dark eye and gaunt cheekbone, 
wearing a white funeral sari billowing in supernatural wind that affects nothing else, 
faint ghostly white glow emanating from body, hovering near an ancient massive banyan 
tree at a rural Bengali village crossroads at midnight, oil lamp flickering nearby, 
rice paddies reflecting moonlight in background, pale ghostly white against deep 
shadow contrast`,
    negativeHints: 'NOT Japanese yurei (different cultural tradition), NOT skeleton, NOT bloody'
  },
  {
    id: 'mahakala',
    name: '마하칼라',
    nameEn: 'Mahakala',
    country: '네팔',
    countryCode: 'NP',
    region: 'south-asia',
    fearLevel: 9,
    description: '시간과 죽음의 수호신. 분노한 형상으로 악을 멸한다.',
    abilities: ['시간 조종', '파괴', '수호'],
    prompt: `Nepali Mahakala wrathful protector deity, powerful dark blue-black skinned figure with
intense wrathful eyes (three eyes, third on forehead), crown of ancient ornaments,
wild flaming orange hair standing upright, fanged expression, six arms holding ritual
implements (trident, sacred cup, damaru drum, sword, ritual blade, lasso), wearing a
garland of sacred beads, tiger skin loincloth, wreathed in sacred flames and smoke,
Himalayan Buddhist monastery (gompa) on mountain cliff in background, colorful Tibetan
prayer flags fluttering, intense dark blue-black body with flame orange and white,
Buddhist thangka painting inspired fantasy art`,
    negativeHints: 'NOT serene Buddha, NOT Hindu Shiva (different tradition), NOT cute'
  },

  // ═══════════════════════════════════════
  // 🌊 오세아니아 (Oceania)
  // ═══════════════════════════════════════
  {
    id: 'taniwha',
    name: '타니화',
    nameEn: 'Taniwha',
    country: '뉴질랜드',
    countryCode: 'NZ',
    region: 'oceania',
    fearLevel: 7,
    description: '마오리족의 수호 용. 강과 바다를 지키는 신성한 존재.',
    abilities: ['수중 이동', '지형 변화', '수호'],
    prompt: `Maori Taniwha water guardian, massive serpentine dragon-like creature with dark green 
scales covered in intricate Maori ta moko (tattoo) spiral patterns (koru designs), 
carved pounamu (greenstone/jade) horns, powerful coiled body emerging from a sacred 
New Zealand river surrounded by towering native silver ferns and ancient podocarp trees, 
glowing spiritual green energy (mauri) pulsing through tattoo patterns, water swirling 
around body in supernatural patterns, lush native bush (Aotearoa forest), deep ocean 
teal and jade green palette with bioluminescent accents`,
    negativeHints: 'NOT European dragon, NOT Chinese dragon, tattoos should be Maori style specifically'
  },
  {
    id: 'bunyip',
    name: '버닙',
    nameEn: 'Bunyip',
    country: '호주',
    countryCode: 'AU',
    region: 'oceania',
    fearLevel: 7,
    description: '호주 늪지의 수수께끼 괴물. 원주민들이 가장 두려워하는 존재.',
    abilities: ['수중 이동', '포효', '위장'],
    prompt: `Australian Bunyip from Aboriginal Dreamtime mythology, bizarre amalgamation creature 
with dark matted fur on a seal-like body, horse-like head with walrus tusks, webbed 
clawed feet, and a long thick tail, emerging from the murky waters of an Australian 
billabong (waterhole) at dusk, jaws open in a terrifying bellow, red Australian outback 
landscape reflected in still dark water, gum trees (eucalyptus) and reeds surrounding 
the waterhole, brilliant southern hemisphere stars appearing overhead, dusty ochre red 
and murky brown-green water palette`,
    negativeHints: 'NOT cute platypus, NOT any single real animal, keep it chimeric and unsettling'
  },
  {
    id: 'adaro',
    name: '아다로',
    nameEn: 'Adaro',
    country: '솔로몬제도',
    countryCode: 'SB',
    region: 'oceania',
    fearLevel: 6,
    description: '악의적인 바다 정령. 무지개를 타고 이동하며 날아다니는 물고기로 공격.',
    abilities: ['수중 이동', '독 공격', '날씨 조종'],
    prompt: `Solomon Islands Adaro malevolent sea spirit from Melanesian mythology, humanoid upper 
body merging into powerful fish tail below, shark-like dorsal fin growing from top of 
head, gills visible on neck, grey-blue skin with bioluminescent markings, holding 
poisonous flying fish as throwing weapons in each hand, riding along a rainbow arc over 
turquoise tropical Pacific ocean, volcanic tropical island with palm trees in background, 
threatening dark storm clouds gathering on one side contrasting with rainbow on other, 
tropical ocean blues with threatening storm grey and rainbow prismatic accents`,
    negativeHints: 'NOT Little Mermaid style, NOT friendly merman, NOT European mermaid'
  },
  {
    id: 'tipua',
    name: '티푸아',
    nameEn: 'Tipua',
    country: '뉴질랜드',
    countryCode: 'NZ',
    region: 'oceania',
    fearLevel: 5,
    description: '자연물에 깃든 마오리의 정령. 나무, 바위 등이 살아 움직인다.',
    abilities: ['자연 조종', '변신', '예언'],
    prompt: `Maori Tipua nature spirit, ancient massive kauri tree coming alive with a face emerging 
from the trunk bark showing traditional Maori carving (whakairo) style features — 
spiraling koru patterns forming eyes, tiki-like mouth in the grain, root-like arms 
reaching outward from the trunk with finger-like branches, glowing green spiritual 
energy (wairua) pulsing through every ring and branch, sacred New Zealand old-growth 
forest clearing with native ferns, mosses, and epiphytes, misty ethereal atmosphere, 
shafts of golden-green light through canopy, ancient forest green and warm 
living-wood brown palette`,
    negativeHints: 'NOT Ent from Lord of the Rings, NOT cartoon tree, carving style should be distinctly Maori'
  },
  {
    id: 'yowie',
    name: '요위',
    nameEn: 'Yowie',
    country: '호주',
    countryCode: 'AU',
    region: 'oceania',
    fearLevel: 6,
    description: '호주의 빅풋. 덤불 속을 배회하는 거대한 유인원형 존재.',
    abilities: ['은신', '괴력', '야간 시력'],
    prompt: `Australian Yowie cryptid from Aboriginal accounts, massive ape-like humanoid (over 2.5 
meters tall) covered in dark reddish-brown coarse fur, powerful muscular build with 
disproportionately long arms, flat broad face with deep-set intelligent amber eyes 
reflecting a distant campfire's light, heavy brow ridge, lurking at the very edge of 
dense Australian bush at twilight — half hidden behind eucalyptus trunk, body partially 
obscured by undergrowth suggesting something seen from corner of eye, Blue Mountains 
terrain with sandstone cliffs and rugged bushland, deep twilight purple and bushland 
green palette with warm amber eye reflection as focal point`,
    negativeHints: 'NOT gorilla, NOT Bigfoot/Sasquatch specifically, NOT fully visible (mystery is key)'
  },
];

// ─── 유틸리티 함수 ───
export function getCreaturesByRegion(region: string): CreaturePrompt[] {
  return CREATURE_PROMPTS.filter(c => c.region === region);
}

export function getCreatureById(id: string): CreaturePrompt | undefined {
  return CREATURE_PROMPTS.find(c => c.id === id);
}

export function getAllRegions(): string[] {
  return [...new Set(CREATURE_PROMPTS.map(c => c.region))];
}

export const REGION_META: Record<string, { label: string; emoji: string; color: string }> = {
  'east-asia': { label: '동아시아', emoji: '🏯', color: '#DC2626' },
  'europe': { label: '유럽', emoji: '🏰', color: '#2563EB' },
  'americas': { label: '아메리카', emoji: '🗿', color: '#059669' },
  'africa': { label: '아프리카', emoji: '🌍', color: '#D97706' },
  'south-asia': { label: '남아시아', emoji: '🕉️', color: '#7C3AED' },
  'oceania': { label: '오세아니아', emoji: '🌊', color: '#0891B2' },
};
