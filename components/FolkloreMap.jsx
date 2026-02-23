"use client"
import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend } from "recharts";

const FOLKLORE_DATA = 
[{"c":"Korea","r":"East Asia","i":"KR","b":[{"n":"Gumiho (구미호)","t":"Shapeshifter","f":9,"d":"Nine-tailed fox that seduces humans to consume their liver or heart. Recorded in Samguk Yusa, transforms into beautiful woman. Must consume 100 livers to become fully human","ln":"구미호","id":"kr-gumiho","src":["Samguk Yusa"],"ab":["변신","유혹","재생","환술","간/심장 흡수"],"wk":["개의 피","정체 노출","인간의 진심"],"vk":["아홉 꼬리","여성형 인간","여우 눈","은빛 여우","매혹적 미모"],"gf":["호러","다크 판타지","로맨스"],"sh":["100개의 간 수집","인간이 되고 싶은 욕망","사랑에 빠진 요괴","정체 발각의 위기"],"ip":true},{"n":"Dokkaebi (도깨비)","t":"Trickster Spirit","f":5,"d":"Korean goblins born from old discarded objects imbued with human energy. Unlike Japanese oni, they have no horns — love wrestling, riddles, and rewarding the good-hearted","ln":"도깨비","id":"kr-dokkaebi","ab":["변신","씨름","불 소환","감투(투명 모자)","방망이 마법"],"wk":["말피(馬血)","인간의 배신","붉은 팥"],"vk":["뿔 없음(일본 오니와 구별)","방망이","청색 불꽃","익살스러운 표정","한복 차림"],"gf":["다크 판타지","로맨스","미스터리"],"sh":["버려진 물건에서 탄생","인간과의 씨름 대결","은혜 갚은 도깨비","도깨비 방망이의 행방"],"ip":true},{"n":"Cheonyeo Gwishin (처녀귀신)","t":"Vengeful Ghost","f":8,"d":"Ghost of unmarried woman in white hanbok with long black hair, bound by deep han (unresolved sorrow). Unable to pass on until her unfulfilled wishes are resolved","ln":"처녀귀신","id":"kr-cheonyeo-gwishin","ab":["공포 유발","한(恨) 에너지","물리 세계 간섭","대상 특정 저주"],"wk":["한 풀어주기","소원 해결","굿/무당의 천도"],"vk":["하얀 한복","검은 긴 머리","창백한 얼굴","맨발","피 눈물"],"gf":["호러","다크 판타지"],"sh":["이루지 못한 소원","복수","생전의 사랑 이야기","현대에 나타난 조선시대 귀신"],"ip":true},{"n":"Haetae (해태)","t":"Guardian Beast","f":4,"d":"Lion-like mythical beast that judges right from wrong and devours fire. Stone haetae guard Gyeongbokgung Palace gates. Symbol of justice and disaster prevention","ln":"해태","id":"kr-haetae","ab":["선악 판별","화재 진압","재난 방지","사악한 기운 퇴치"],"wk":["없음(수호수 계열)"],"vk":["사자형","비늘","단독 뿔","벽사 조각상","근엄한 표정"],"gf":["동화/판타지"],"sh":["경복궁 수호자의 각성","현대 도시의 정의 심판","해태가 움직이는 날"],"ip":true},{"n":"Imugi (이무기)","t":"Serpent Dragon","f":8,"d":"Massive serpent that must endure 1000 years to ascend as a true dragon (yong). Dwells in deep rivers and caves. Failed imugi become corrupted monsters","ln":"이무기","id":"kr-imugi","ab":["수중 지배","독기","거대화","폭풍 유발"],"wk":["여의주 미획득","천년 수행 실패","용의 심판"],"vk":["거대한 뱀","용의 미완성체","깊은 동굴","강/호수","비늘 갑옷"],"gf":["호러","다크 판타지"],"sh":["천년의 수행","승천 실패의 비극","이무기와 용의 차이","여의주 탈환전"],"ip":true},{"n":"Bulgasari (불가사리)","t":"Iron-Eating Beast","f":8,"d":"Bear-like monster that devours iron and metal. Created from rice by a monk during Goryeo dynasty, grows unstoppable as it feeds on weapons and armor","ln":"불가사리","id":"kr-bulgasari","ab":["철/금속 포식","무한 성장","물리 무적"],"wk":["불명(통제 불능이 핵심)"],"vk":["곰 형상","금속 비늘","거대화 진행형","무기를 먹는 입"],"gf":["호러","다크 판타지","액션"],"sh":["무기를 먹어 커지는 괴수","고려시대 몽골 침입과 연결","현대 군사시설에 나타난다면"],"ip":true},{"n":"Jeoseung Saja (저승사자)","t":"Death Reaper","f":9,"d":"Grim reapers in black hanbok and tall gat hats who escort souls to the underworld judge King Yeomra. Cannot be bribed or deceived, always fulfill their duty","ln":"저승사자","id":"kr-jeoseung-saja","ab":["영혼 인도","시공간 이동","죽음의 기운","불가피한 운명 집행"],"wk":["없음(절대적 존재)","염라대왕의 명령만 따름"],"vk":["검은 한복","높은 갓","창백한 얼굴","쌍으로 등장","서류/두루마리"],"gf":["호러","다크 판타지"],"sh":["저승사자가 감정을 갖게 된다면","잘못된 영혼을 데려간 실수","저승사자의 휴가"],"ip":true},{"n":"Mul Gwishin (물귀신)","t":"Water Ghost","f":7,"d":"Ghost of drowned person that pulls swimmers underwater. Can only be freed when a replacement victim drowns in its place — an endless cycle of tragedy","ln":"물귀신","id":"kr-mul-gwishin","ab":["익사 유발","수중 끌어당김","대리자 필요 저주"],"wk":["대리자를 찾으면 해방"],"vk":["물에 젖은 모습","창백한 피부","수중 출몰","손만 보임"],"gf":["호러","다크 판타지"],"sh":["끝없는 대리자의 사슬","물귀신이 풀려나려면","수영장/워터파크 호러"],"ip":true},{"n":"Dalgyal Gwishin (달걀귀신)","t":"Faceless Ghost","f":7,"d":"Egg-faced ghost with no eyes, nose, or mouth — a smooth featureless oval. Appears to terrify night travelers on dark roads. Cannot speak but emits eerie presence","ln":"달걀귀신","id":"kr-dalgyal-gwishin","ab":["공포 유발","소리 없는 접근","밤길 출몰"],"wk":["불명"],"vk":["달걀형 민낯","눈코입 없음","매끄러운 타원형 얼굴","흰 옷"],"gf":["호러","다크 판타지"],"sh":["얼굴 없는 존재의 정체","표정을 잃어버린 이유","달걀귀신이 말을 한다면"],"ip":true},{"n":"Gangcheoli (강철이)","t":"Drought Demon","f":9,"d":"Failed imugi turned fire monster. Radiates such intense heat it withers all vegetation and evaporates clouds. Proverb: 'Where Gangcheoli passes, even autumn becomes spring'","ln":"강철이","id":"kr-gangcheoli","ab":["극한 열기 방출","식물 고사","구름 증발","가뭄 유발"],"wk":["물/비","이무기 퇴치법"],"vk":["불꽃 몸체","갈라진 대지","아지랑이","검은 연기"],"gf":["호러","다크 판타지"],"sh":["승천 실패한 이무기의 분노","가뭄 재해의 원인","강철이를 진정시킬 방법"],"ip":true},{"n":"Dokkaebibul (도깨비불)","t":"Ghost Fire","f":5,"d":"Mysterious blue-white phantom flames floating through forests and graveyards at night. Associated with dokkaebi activity and omens of death or fortune","ln":"도깨비불","id":"kr-dokkaebibul","ab":["화염"],"vk":["하얀","불꽃"],"gf":["다크 판타지"],"sh":["예언/징조"],"ip":true},{"n":"Gurendgi (두억시니)","t":"Shadow Demon","f":7,"d":"Ancient demon from Goryeo era, once a guardian deity turned malevolent in Joseon period. Causes sleep paralysis and oppresses with dark energy. Appears as a child then grows enormous","ln":"두억시니","id":"kr-gurendgi","ab":["거대화","성장/변형","마비"],"vk":["거대한 체구"],"gf":["호러","다크 판타지","영웅 서사"],"sh":["수호 임무"],"ip":true},{"n":"Changwi (창귀)","t":"Tiger Thrall","f":7,"d":"Ghost of person devoured by tiger, enslaved as spirit servant to lure new victims. Must find a replacement to earn freedom. Featured in Park Jiwon's novel Hojil","ln":"창귀","id":"kr-changwi","src":["Hojil","Park Jiwon"],"ab":["포식"],"gf":["호러","다크 판타지"],"sh":["대리자 찾기","자유를 향한 탈출"],"ip":true},{"n":"Geum Dwaeji (금돼지)","t":"Golden Boar","f":7,"d":"Golden-furred boar demon dwelling in caves of Wolyeongdo island. Kidnaps women, wields sorcery and shapeshifting. Weak only to deer hide. Connected to Choi Chiwon legend","ln":"금돼지","id":"kr-geum-dwaeji","ab":["변신"],"vk":["황금빛"],"gf":["호러","다크 판타지"],"sh":["예언/징조"],"ip":true},{"n":"Eoduksini (어둑시니)","t":"Darkness Entity","f":5,"d":"Shadow creature appearing in pitch darkness that grows larger the more you stare at it. Looking down forces it to shrink and vanish. Recorded since Goryeo dynasty","ln":"어둑시니","id":"kr-eoduksini","ab":["어둠 속 출현","주목할수록 거대화","시선 회피 시 소멸"],"wk":["시선을 아래로 돌림","밝은 빛"],"vk":["그림자 형상","무정형","크기 가변적","어둠 속 윤곽만"],"gf":["다크 판타지"],"sh":["두려움이 실체화된 존재","어둑시니를 이용한 심리 호러","보면 커지는 공포의 메타포"],"ip":true},{"n":"Jangsanbum (장산범)","t":"Predator","f":9,"d":"Pale long-haired humanoid of Jangsan mountain in Busan that mimics human crying to lure victims. Modern urban legend rooted in changwi tradition, 1.5-3m tall","ln":"장산범","id":"kr-jangsanbum","ab":["인간 울음소리 모방","빠른 이동","공포 유발","야간 사냥"],"wk":["불명(현대 도시전설)"],"vk":["창백한 피부","긴 흰 머리카락","1.5~3m 거대 체구","산중 출몰"],"gf":["호러","다크 판타지"],"sh":["부산 장산 등산객 실종 사건","도시전설의 실체","군대 초소에서의 목격담"],"ip":true},{"n":"Yaggwanggwi (야광귀)","t":"Shoe Thief Ghost","f":4,"d":"Ghost that descends on Lunar New Year's Eve to steal shoes left outside. If it finds a pair that fits, the owner suffers bad luck all year. Koreans hang sieves on doors to confuse it","ln":"야광귀","id":"kr-yaggwanggwi","ab":["불명"],"gf":["동화/판타지"],"ip":true},{"n":"Gwisun (귀수산)","t":"Sea Monster","f":7,"d":"Mountain-sized sea turtle monster with bamboo-like antennae on its back. When antennae fall into the ocean, they grow into offspring. Recorded in classical Korean texts","ln":"귀수산","id":"kr-gwisun","ab":["불명"],"gf":["호러","다크 판타지"],"ip":true},{"n":"Gogwandaemyeon (고관대면)","t":"Big-Face Monster","f":5,"d":"Creature with enormous face wearing a tall official's hat. Body too small to stand upright, so it leans against trees. Flees when stared down by dogs or brave people","ln":"고관대면","id":"kr-gogwandaemyeon","ab":["거대화"],"wk":["개","용기"],"vk":["거대한 체구","작은 체구"],"gf":["다크 판타지"],"ip":true},{"n":"Geogugwi (거구귀)","t":"Giant Mouth Ghost","f":5,"d":"Ghost with mouth so enormous its upper lip touches the sky and lower lip the ground. Transforms into a protective blue-robed boy when meeting someone of exceptional character","ln":"거구귀","id":"kr-geogugwi","ab":["변신","거대화"],"vk":["거대한 체구"],"gf":["다크 판타지","영웅 서사"],"sh":["수호 임무","인간이 되고 싶은 욕망"],"ip":true},{"n":"Geuseunse (그슨새)","t":"Jeju Daytime Demon","f":7,"d":"Jeju Island yokai wearing a reversed rain-cloak (jujengi). Unlike most spirits, it hunts during daylight, enchanting and killing solitary travelers on roads","ln":"그슨새","id":"kr-geuseunse","ab":["불명"],"gf":["호러","다크 판타지","액션"],"ip":true},{"n":"Geuseundae (그슨대)","t":"Child Demon","f":7,"d":"Former Goryeo-era guardian deity corrupted into evil during Joseon period. Appears as innocent child to lull victims, then rapidly grows to immense size to crush them","ln":"그슨대","id":"kr-geuseundae","ab":["성장/변형"],"gf":["호러","다크 판타지","영웅 서사"],"sh":["수호 임무"],"ip":true},{"n":"Noguwhwinam (노구화위남)","t":"Age-Shifter","f":5,"d":"Shape-shifting entity recorded in Samguk Sagi that transforms between elderly and young forms but cannot change gender. A rare creature of Korean metamorphosis mythology","ln":"노구화위남","id":"kr-noguwhwinam","src":["Samguk Sagi"],"ab":["변신"],"gf":["다크 판타지"],"sh":["인간이 되고 싶은 욕망"],"ip":true},{"n":"Duduri (두두리)","t":"Wood God","f":4,"d":"Tree spirit and folk deity from Silla and Goryeo periods. Originally a local earth god of the Gyeongju region. Faith disappeared following the Mongol invasions of Korea","ln":"두두리","id":"kr-duduri","ab":["불명"],"vk":["날개"],"gf":["동화/판타지","영웅 서사"],"ip":true},{"n":"Yeongnoh (영노)","t":"Mutant Serpent","f":7,"d":"Mutant offspring of the imugi species that makes a distinctive 'bibi' whistling sound. Also called 'Bibi'. Can detect and consume evil-hearted humans, sparing the virtuous","ln":"영노","id":"kr-yeongnoh","ab":["포식"],"gf":["호러","다크 판타지"],"ip":true},{"n":"Datbalgwimul (닷발괴물)","t":"Giant Bird Monster","f":7,"d":"Massive bird-like monster with beak and tail feathers each measuring 5 bal (7.5m). In Jomagu folktales, was boiled alive and its remains became fleas and mosquitoes","ln":"닷발괴물","id":"kr-datbalgwimul","ab":["불명"],"vk":["꼬리"],"gf":["호러","다크 판타지"],"ip":true},{"n":"Myodusa (묘두사)","t":"Cat-Head Serpent","f":5,"d":"Giant snake with a cat's head, worshipped by birds as their king. Its blue smoke was believed to sterilize germs and heal illness. Killed by archer Park Manho to end excessive worship","ln":"묘두사","id":"kr-myodusa","ab":["불명"],"vk":["뱀 형상","거대한 체구"],"gf":["다크 판타지"],"ip":true},{"n":"Gildar (길달)","t":"Trickster Dokkaebi","f":5,"d":"Famous dokkaebi from Samguk Yusa who served Bihyeong. Grew bored building a bridge, transformed into a fox to escape, but was hunted down and killed by Bihyeong's order","ln":"길달","id":"kr-gildar","src":["Samguk Yusa"],"ab":["변신"],"gf":["다크 판타지","액션"],"sh":["인간이 되고 싶은 욕망","자유를 향한 탈출"],"ip":true},{"n":"Dopisaui (도피사의)","t":"Heat Killer","f":7,"d":"Human-shaped monster wearing a reversed straw rain-cloak. Always travels in pairs, attaching to victims and raising their body temperature until death. Recorded in Joseon texts","ln":"도피사의","id":"kr-dopisaui","ab":["불명"],"gf":["호러","다크 판타지"],"ip":true},{"n":"Chwisengi (취생)","t":"Smoke Monster","f":7,"d":"Creature from Cheonyerok — a massive smoke mass emitting foul stench with glowing eyes where a face should be. No limbs, head, or body — only swirling toxic darkness","ln":"취생","id":"kr-chwisengi","src":["Cheonyerok"],"ab":["불명"],"vk":["빛나는 눈","날개"],"gf":["호러","다크 판타지"],"ip":true},{"n":"Samsinghalmi (삼신할미)","t":"Birth Goddess","f":2,"d":"Goddess who presides over childbirth and protects infants. Worshipped with offerings of rice and seaweed soup. Every household was believed to have its own Samsin spirit","ln":"삼신할미","id":"kr-samsinghalmi","ab":["출산 보호","아이 수호","가정 축복"],"wk":["없음(수호신)"],"vk":["노파 형상","미역국","쌀","따뜻한 빛","아기 안은 모습"],"gf":["동화/판타지","영웅 서사"],"sh":["삼신할미가 사라진 세계","아이를 지키는 수호신 이야기"],"ip":true},{"n":"Sansin Horangi (산신 호랑이)","t":"Mountain Tiger God","f":5,"d":"Sacred tiger serving as emissary of the Mountain God (Sansin). Protector of villages bordering forests. Depicted in countless shamanist paintings guarding mountain shrines","ln":"산신 호랑이","id":"kr-sansin-horangi","ab":["불명"],"gf":["다크 판타지","영웅 서사"],"sh":["수호 임무"],"ip":true},{"n":"Cheoyong (처용)","t":"Exorcist Guardian","f":4,"d":"Legendary figure from Silla who drove away the Plague God through dance and song. His face painted on doors wards off evil spirits and disease. Origin of Cheoyongmu dance","ln":"처용","id":"kr-cheoyong","ab":["역병"],"gf":["동화/판타지","영웅 서사"],"ip":true},{"n":"Yeomra Daewang (염라대왕)","t":"Underworld Judge","f":9,"d":"Supreme judge of the dead in Korean Buddhist underworld. Presides over ten courts of hell, weighing sins of the deceased. Inescapable and incorruptible, feared by all spirits","ln":"염라대왕","id":"kr-yeomra-daewang","ab":["사후 심판","지옥 통치","절대적 권위","진실 투시"],"wk":["없음(최상위 심판관)"],"vk":["왕관/관모","위엄 있는 도포","심판대","업경대(업보의 거울)","열 개의 지옥"],"gf":["호러","다크 판타지"],"sh":["지옥의 판관 앞에 선 주인공","염라대왕의 실수/고민","저승 법정 드라마"],"ip":true},{"n":"Mongdalgwi (몽달귀)","t":"Bachelor Ghost","f":5,"d":"Ghost of man who died unmarried, wandering in search of a bride. Counterpart to cheonyeo gwishin. Known to haunt wedding ceremonies and homes of single women out of loneliness","ln":"몽달귀","id":"kr-mongdalgwi","ab":["불명"],"gf":["다크 판타지","로맨스"],"sh":["예언/징조","잃어버린 것 찾기","금단의 사랑"],"ip":true},{"n":"Hongnansamnyo (홍난삼녀)","t":"Bamboo Forest Spirit","f":5,"d":"Female yokai in red garments with disheveled hair, lurking in bamboo groves. Appears mainly on rainy days. Extremely agile — can sprint and leap to extraordinary heights when approached","ln":"홍난삼녀","id":"kr-hongnansamnyo","ab":["불명"],"vk":["헝클어진 머리"],"gf":["다크 판타지"],"ip":true},{"n":"Palyeokgwi (팔척귀)","t":"Eight-Foot Ghost","f":8,"d":"Towering ghost standing 8 cheok (approx 2.4m) tall. Malevolent entity of immense power in Korean folklore, recently featured in dramas as a fearsome yokai of the royal court","ln":"팔척귀","id":"kr-palyeokgwi","ab":["불명"],"gf":["호러","다크 판타지"],"ip":true},{"n":"Yeoksin (역신)","t":"Plague God","f":9,"d":"Deity of epidemics and pestilence, often called 'Mama Sonnim' (Smallpox Guest). So powerful that rather than fighting it, Koreans worshipped and appeased it with elaborate rituals","ln":"역신","id":"kr-yeoksin","ab":["역병 전파","대규모 사망","신격 수준의 힘"],"wk":["달래기/의례적 대접","굿"],"vk":["마마 손님","곰보 자국","바람처럼 이동","집단 행렬"],"gf":["호러","다크 판타지","액션"],"sh":["전염병 시대와의 연결","역신을 대접하는 의례","현대 팬데믹에 역신이 돌아온다면"],"ip":true},{"n":"Jibakryeong (지박령)","t":"Bound Spirit","f":7,"d":"Spirit permanently bound to the location of its death, unable to move on. Haunts specific buildings, crossroads, or natural features. Common in Korean ghost lore and horror fiction","ln":"지박령","id":"kr-jibakryeong","ab":["불명"],"wk":["십자가"],"gf":["호러","다크 판타지"],"ip":true},{"n":"Songgaksi (손각시)","t":"Straw Bride Ghost","f":5,"d":"Ghost manifesting through a straw doll used in folk divination. Young women would make straw dolls to divine their future husbands, but the dolls could become possessed by wandering spirits","ln":"손각시","id":"kr-songgaksi","ab":["빙의"],"gf":["다크 판타지","영웅 서사"],"sh":["빙의/퇴마","예언/징조"],"ip":true},{"n":"Dokgak (독각)","t":"One-Legged Goblin","f":5,"d":"One-legged dokkaebi variant that hops on a single leg wielding supernatural strength. Recorded in Joseon texts as a fearsome yet dim-witted trickster often outwitted by clever humans","ln":"독각","id":"kr-dokgak","ab":["불명"],"gf":["다크 판타지","코미디"],"ip":true},{"n":"Magwi (마귀)","t":"Curse Demon","f":7,"d":"Malevolent spirit that hurls deadly curses and sal (살) energy at victims. Distinct from Western demons — Korean magwi are formless malice that causes sudden illness and misfortune","ln":"마귀","id":"kr-magwi","ab":["저주"],"gf":["호러","다크 판타지","미스터리"],"sh":["저주 해제"],"ip":true},{"n":"Mangryang (망량)","t":"Swamp Phantom","f":5,"d":"Shapeless entity haunting wetlands, marshes, and riverbanks. Feeds on confusion and fear, causing travelers to lose their way. One of the oldest recorded Korean supernatural categories","ln":"망량","id":"kr-mangryang","ab":["불명"],"gf":["다크 판타지"],"ip":true},{"n":"Yeommae (염매)","t":"Nightmare Parasite","f":7,"d":"Invisible curse-entity that attaches to sleeping victims, inducing horrific nightmares, wasting illness, and slow death. Deployed through sorcery rituals in Joseon-era witch trials","ln":"염매","id":"kr-yeommae","ab":["저주","투명화","악몽 유발"],"gf":["호러","다크 판타지","미스터리"],"sh":["저주 해제"],"ip":true},{"n":"Baekho (백호)","t":"White Tiger God","f":5,"d":"Divine White Tiger of the West among the Four Guardian Spirits (사신). Symbolizes war, autumn, and metal. Stone carvings guard Goguryeo royal tombs as protectors against evil","ln":"백호","id":"kr-baekho","ab":["불명"],"vk":["하얀"],"gf":["다크 판타지","영웅 서사"],"sh":["수호 임무"],"ip":true},{"n":"Gyeryong (계룡)","t":"Rooster Dragon","f":5,"d":"Mythical hybrid with rooster head and dragon body, origin of Gyeryongsan mountain's name. Appeared in Silla foundation myths as an auspicious omen heralding great kings","ln":"계룡","id":"kr-gyeryong","ab":["불명"],"wk":["이름 부르기"],"gf":["다크 판타지"],"sh":["예언/징조"],"ip":true},{"n":"Ineo (인어)","t":"Korean Merperson","f":4,"d":"Korean merfolk whose tears become pearls and whose flesh grants immortality. Wearing ineo-woven cloth prevents rain. Recorded in Samguk Yusa and various Joseon coastal legends","ln":"인어","id":"kr-ineo","src":["Samguk Yusa"],"ab":["불명"],"gf":["동화/판타지"],"ip":true},{"n":"Suryugyeon (수류견)","t":"Aquatic Hound","f":7,"d":"Dog-like water creature that drags victims beneath rivers and lakes. Appears as a normal dog near water but reveals its monstrous form when prey approaches the water's edge","ln":"수류견","id":"kr-suryugyeon","ab":["불명"],"wk":["개"],"gf":["호러","다크 판타지"],"ip":true},{"n":"Samdaebong (삼대봉)","t":"Three-Peak Bird","f":7,"d":"Colossal bird resembling three mountain peaks in flight, darkening the sky with its wingspan. Recorded in Yongjae Chonghwa as an omen of catastrophic storms and dynastic change","ln":"삼대봉","id":"kr-samdaebong","src":["Yongjae Chonghwa"],"ab":["폭풍 조종"],"vk":["날개"],"gf":["호러","다크 판타지"],"sh":["예언/징조"],"ip":true},{"n":"Gungjanggoesu (궁중괴수)","t":"Palace Monster","f":7,"d":"Mysterious beast that appeared within Silla royal palace grounds. Recorded in Samguk Sagi — its appearance signaled political upheaval and was taken as a grave warning from heaven","ln":"궁중괴수","id":"kr-gungjanggoesu","src":["Samguk Sagi"],"ab":["불명"],"gf":["호러","다크 판타지"],"ip":true},{"n":"Geoin (거인)","t":"Korean Giant","f":5,"d":"Enormous humanoid beings from Samguk Sagi measuring several jang tall. Some benevolent, others hostile. Connected to Magohalmi (마고할미) creation myths of landscape formation","ln":"거인","id":"kr-geoin","src":["Samguk Sagi"],"ab":["거대화"],"vk":["거대한 체구"],"gf":["다크 판타지"],"ip":true},{"n":"Balgasari (불가살이)","t":"Unkillable Beast","f":8,"d":"Truly immortal monster — distinct from Bulgasari. Cannot be killed by any weapon or element. Only grows stronger from attacks. Recorded in Joseon texts as embodiment of unstoppable calamity","ln":"불가살이","id":"kr-balgasari","ab":["성장/변형"],"gf":["호러","다크 판타지","액션"],"ip":true},{"n":"Mudugwi (무두귀)","t":"Headless Ghost","f":8,"d":"Ghost of a beheaded person wandering without its head, arms outstretched searching. Appears near execution grounds and battlefields. Recorded in Joseon literary collections","ln":"무두귀","id":"kr-mudugwi","ab":["불명"],"gf":["호러","다크 판타지","액션"],"sh":["잃어버린 것 찾기"],"ip":true},{"n":"Bungwi (분귀)","t":"Latrine Ghost","f":5,"d":"Ghost inhabiting outhouses and latrines, grabbing ankles of nighttime visitors. Koreans placed charms on bathroom doors and coughed loudly before entering to warn the bungwi away","ln":"분귀","id":"kr-bungwi","ab":["불명"],"gf":["다크 판타지"],"ip":true},{"n":"Saengsagwi (생사귀)","t":"Living Ghost","f":7,"d":"Terrifying anomaly — a living person whose spirit separates and haunts others while their body still breathes. Victims see the haunter's face but find them alive and unaware the next day","ln":"생사귀","id":"kr-saengsagwi","ab":["영혼 분리","무의식 중 타인 공격","본체는 무사"],"wk":["본인이 자각하면 멈춤"],"vk":["살아있는 사람의 얼굴","반투명 몸","잠든 본체"],"gf":["호러","다크 판타지"],"sh":["나의 영혼이 밤마다 누군가를 괴롭힌다","생사귀의 본체를 찾는 추리극"],"ip":true},{"n":"Yeokgwi (역귀)","t":"Plague Ghost Band","f":8,"d":"Group of ghosts spreading epidemic disease from village to village. Travel as invisible wind. Joseon communities held nuo (나례) exorcism rituals with masked dancers to drive them away","ln":"역귀","id":"kr-yeokgwi","ab":["투명화","역병"],"vk":["가면"],"gf":["호러","다크 판타지"],"ip":true},{"n":"Sugwoe (수괴)","t":"Water Phantom","f":7,"d":"Amorphous aquatic entity emerging from deep pools and wells. Takes no fixed form — sometimes luminous, sometimes dark. Grabs and drowns victims with tentacle-like water extensions","ln":"수괴","id":"kr-sugwoe","ab":["익사 유발"],"gf":["호러","다크 판타지"],"ip":true},{"n":"Bongdugwimul (봉두귀물)","t":"Wild-Hair Monster","f":7,"d":"Creature with massively disheveled hair covering its entire body and face. Lurches through mountain paths at night. Its appearance causes paralysis — victims freeze until dawn breaks","ln":"봉두귀물","id":"kr-bongdugwimul","ab":["마비"],"wk":["새벽"],"vk":["헝클어진 머리"],"gf":["호러","다크 판타지"],"sh":["자유를 향한 탈출"],"ip":true},{"n":"Daemyeon (대면)","t":"Giant Floating Face","f":7,"d":"Enormous disembodied face appearing in the sky or darkness with no body attached. Recorded in Yongjae Chonghwa. Stares silently at victims, inflicting terror and madness through eye contact","ln":"대면","id":"kr-daemyeon","src":["Yongjae Chonghwa"],"ab":["거대화","광기 유발"],"vk":["거대한 체구"],"gf":["호러","다크 판타지"],"ip":true},{"n":"Seonggwi (성귀)","t":"Fortress Wraith","f":7,"d":"Spirit bound to ancient fortresses and castle walls, formed from accumulated deaths during sieges. Protects the fortress from invaders but attacks trespassers who enter after dark","ln":"성귀","id":"kr-seonggwi","ab":["불명"],"gf":["호러","다크 판타지","영웅 서사"],"sh":["수호 임무"],"ip":true},{"n":"Eoryong (어룡)","t":"Fish Dragon","f":7,"d":"Transitional creature between fish and dragon, representing the moment of transformation. Leaps from waterfalls during thunderstorms attempting to ascend to dragonhood. Failure means death","ln":"어룡","id":"kr-eoryong","ab":["변신","폭풍 조종"],"gf":["호러","다크 판타지"],"sh":["예언/징조","인간이 되고 싶은 욕망"],"ip":true},{"n":"Samgakrok (삼각록)","t":"Three-Horn Deer","f":4,"d":"Mystical deer bearing three antlers instead of two, recorded in Samguk Sagi as an auspicious creature. Its appearance near a kingdom signaled heaven's blessing upon the ruler","ln":"삼각록","id":"kr-samgakrok","src":["Samguk Sagi"],"ab":["불명"],"vk":["뿔"],"gf":["동화/판타지"],"ip":true},{"n":"Ssangdusamok (쌍두사목)","t":"Twin-Head Beast","f":7,"d":"Monster with two heads and four eyes, each head capable of independent thought and action. Recorded in classical texts as born from unnatural unions. Extremely difficult to ambush or surprise","ln":"쌍두사목","id":"kr-ssangdusamok","ab":["불명"],"gf":["호러","다크 판타지"],"ip":true},{"n":"Sabihadeaeo (사비하대어)","t":"River Leviathan","f":7,"d":"Gargantuan river fish dozens of times human height in length. Its death was recorded in Samguk Sagi as an omen of Baekje's fall — the greater the fish, the greater the kingdom's doom","ln":"사비하대어","id":"kr-sabihadeaeo","src":["Samguk Sagi"],"ab":["불명"],"gf":["호러","다크 판타지"],"sh":["예언/징조"],"ip":true},{"n":"Noguwhwaho (노구화호)","t":"Old Dog Turned Tiger","f":7,"d":"Ancient dog that transforms into a tiger after living for centuries. Retains canine cunning with tiger's power. Recorded in Samguk Sagi as one of Korea's most dangerous shapeshifters","ln":"노구화호","id":"kr-noguwhwaho","src":["Samguk Sagi"],"ab":["변신"],"wk":["개"],"gf":["호러","다크 판타지"],"sh":["인간이 되고 싶은 욕망"],"ip":true},{"n":"Sikho (식호표)","t":"Tiger-Eating Leopard","f":8,"d":"Supernatural leopard powerful enough to hunt and devour tigers — the apex predator of Korean mountains. Extremely rare and feared even by mountain spirits and sansin","ln":"식호표","id":"kr-sikho","ab":["포식"],"gf":["호러","다크 판타지","액션"],"ip":true},{"n":"Geumgapjanggun (금갑장군)","t":"Golden Armor General","f":5,"d":"Giant warrior apparition clad in radiant golden armor. Appears as divine protector in times of national crisis. Recorded wielding a massive axe, standing guard over sacred mountain passes","ln":"금갑장군","id":"kr-geumgapjanggun","ab":["불명"],"vk":["황금빛","거대한 체구","갑옷"],"gf":["다크 판타지","액션","영웅 서사"],"sh":["수호 임무"],"ip":true},{"n":"Gamyeonsosu (가면소수)","t":"Masked Beast","f":7,"d":"Animal-like creature wearing what appears to be a carved mask fused to its face. Recorded in classical texts — its true face has never been seen. Removing the mask allegedly destroys it","ln":"가면소수","id":"kr-gamyeonsosu","ab":["불명"],"vk":["가면"],"gf":["호러","다크 판타지"],"ip":true},{"n":"Baekaksanyacha (백악산야차)","t":"Mountain Yaksha","f":8,"d":"White-haired giant yaksha dwelling on Baekaksan (Bugaksan) near Seoul. Recorded in EouyaDam — enormous body covered in fur, carries its young on its back, can catch fleeing deer in a single stride","ln":"백악산야차","id":"kr-baekaksanyacha","src":["EouyaDam"],"ab":["거대화"],"vk":["거대한 체구"],"gf":["호러","다크 판타지"],"ip":true},{"n":"Ganggil (강길)","t":"River Dokkaebi","f":5,"d":"Dokkaebi subspecies inhabiting rivers and streams. Unlike land dokkaebi, river dokkaebi control water currents and cause flash floods when angered. Appeased with buckwheat and red bean offerings","ln":"강길","id":"kr-ganggil","ab":["열기"],"gf":["다크 판타지"],"ip":true}]},{"c":"Japan","r":"East Asia","i":"JP","b":[{"n":"Kuchisake-onna","t":"Vengeful Spirit","f":9,"d":"Slit-mouthed woman wearing mask who asks 'Am I beautiful?' before attacking","id":"jp-kuchisake-onna","ab":["불명"],"vk":["아름다운 외모","가면"],"gf":["호러","다크 판타지","로맨스"],"ip":false},{"n":"Kappa","t":"Water Demon","f":5,"d":"River creature with dish-shaped head that drowns swimmers but honors promises","id":"jp-kappa","ab":["익사 유발"],"gf":["다크 판타지"],"sh":["거래/계약"],"ip":false},{"n":"Oni","t":"Demon","f":8,"d":"Horned ogre-demons of hell, often depicted with iron clubs","id":"jp-oni","ab":["불명"],"wk":["철/쇠"],"vk":["뿔"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Yurei","t":"Ghost","f":8,"d":"Spirits of the dead with unfinished business, white robes and black hair","id":"jp-yurei","ab":["불명"],"vk":["검은 긴 머리","하얀","흰 옷"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Tengu","t":"Mountain Demon","f":7,"d":"Long-nosed or crow-like mountain demons who are master martial artists. Can be either protectors of sacred mountains or kidnappers of the arrogant","id":"jp-tengu","gf":["다크 판타지","액션"],"ip":false},{"n":"Jorogumo","t":"Spider Woman","f":8,"d":"Spider that lived 400 years transforms into a seductive woman to trap men in her web. Plays a biwa lute to lure victims into her lair","id":"jp-jorogumo","ab":["변신","유혹"],"gf":["호러","다크 판타지","로맨스"],"ip":false}]},{"c":"China","r":"East Asia","i":"CN","b":[{"n":"Jiangshi","t":"Undead","f":8,"d":"Hopping vampire-corpse that drains life force, repelled by sticky rice","id":"cn-jiangshi","ab":["흡수"],"wk":["찹쌀"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Mogwai","t":"Demon","f":5,"d":"Malevolent spirits that harm humans, especially active during rainy seasons","id":"cn-mogwai","ab":["불명"],"gf":["다크 판타지"],"ip":false},{"n":"Nian","t":"Beast","f":7,"d":"Fearsome beast that emerges on New Year's Eve, repelled by red color and loud noise","id":"cn-nian","ab":["불명"],"wk":["붉은색","큰 소리"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Yaoguai","t":"Demon Beast","f":8,"d":"Animals that gained supernatural powers through centuries of cultivation. Foxes, snakes, and spiders are most common, often disguising as beautiful humans","id":"cn-yaoguai","ab":["변신"],"gf":["호러","다크 판타지","로맨스"],"ip":false},{"n":"Gui Po","t":"Ghost Hag","f":7,"d":"Ghost of elderly woman appearing kindly to lure children away from their families. Leads victims into wilderness where they vanish forever","id":"cn-gui-po","gf":["호러","다크 판타지"],"ip":false},{"id":"cn-hundun","n":"Hundun","t":"Primordial Beast","f":7,"d":"Faceless being of chaos resembling a dog or bear. Attacks the virtuous and obeys the wicked.","ln":"混沌","ab":["혼돈 조종","선악 감지"],"wk":["질서의 힘"],"vk":["faceless","chaos cloud"],"gf":["dark_fantasy"],"sh":["혼돈의 존재가 세계 질서를 뒤집으려 한다"],"ip":true},{"id":"cn-taotie","n":"Taotie","t":"Demon","f":8,"d":"Gluttonous beast with only a massive head. Seeks to devour everything.","ln":"饕餮","ab":["무한 식욕","만물 파괴"],"wk":["봉인 문양"],"vk":["giant face","bronze mask"],"gf":["dark_fantasy","action"],"sh":["봉인된 탐욕의 마수가 풀려나 세상을 삼킨다"],"ip":true}]},{"c":"Mongolia","r":"East Asia","i":"MN","b":[{"n":"Olgoi-Khorkhoi","t":"Cryptid","f":8,"d":"Mongolian Death Worm said to spit acid and discharge electricity in the Gobi Desert","id":"mn-olgoi-khorkhoi","ab":["불명"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Almas","t":"Wild Man","f":5,"d":"Bigfoot-like hominid reportedly seen in the Altai Mountains","id":"mn-almas","ab":["불명"],"gf":["다크 판타지"],"ip":false},{"n":"Chutgur","t":"Evil Spirit","f":7,"d":"Malevolent spirits dwelling in the vast Mongolian steppe. Enter through the nostrils of sleeping travelers and cause wasting illness and death","id":"mn-chutgur","gf":["호러","다크 판타지"],"ip":false}]},{"c":"Taiwan","r":"East Asia","i":"TW","b":[{"n":"Mo Sin-a","t":"Forest Spirit","f":8,"d":"Short dark-skinned forest dwellers of indigenous legend who kidnap children","id":"tw-mo-sin-a","ab":["불명"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Lin Tou Gui","t":"Ghost","f":5,"d":"Ghosts that haunt the spot where they died, often near roads and trees","id":"tw-lin-tou-gui","ab":["불명"],"gf":["다크 판타지"],"ip":false},{"n":"Mösin","t":"Water Ghost","f":7,"d":"Ghost of drowned person lurking in rivers waiting to pull swimmers under. Like Korean mul gwishin, needs a replacement drowning victim to be freed","id":"tw-mosin","gf":["호러","다크 판타지"],"ip":false}]},{"c":"Vietnam","r":"Southeast Asia","i":"VN","b":[{"n":"Ma Lai","t":"Vampire","f":9,"d":"Detached flying head with dangling entrails that hunts at night","id":"vn-ma-lai","ab":["비행","흡혈"],"vk":["내장 노출"],"gf":["호러","다크 판타지","액션"],"ip":false},{"n":"Con Tinh","t":"Fairy","f":4,"d":"Beautiful forest fairy who enchants travelers with mesmerizing songs","id":"vn-con-tinh","ab":["불명"],"vk":["아름다운 외모"],"gf":["로맨스","동화/판타지"],"ip":false},{"n":"Thần Trùng","t":"Possessing Ghost","f":7,"d":"Ghost of someone who died with unresolved grudges that possesses corpses, making them sit up and chase the living. Families must guard fresh corpses until burial","id":"vn-than-trung","gf":["호러","다크 판타지"],"ip":false}]},{"c":"Thailand","r":"Southeast Asia","i":"TH","b":[{"n":"Krasue","t":"Vampire","f":9,"d":"Floating female head with hanging viscera, hunts pregnant women at night","id":"th-krasue","ab":["흡혈"],"vk":["내장 노출"],"gf":["호러","다크 판타지","액션"],"sh":["예언/징조"],"ip":false},{"n":"Phi Tai Hong","t":"Vengeful Ghost","f":9,"d":"Extremely powerful ghost of someone who died suddenly and violently","id":"th-phi-tai-hong","ab":["불명"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Phi Am","t":"Nightmare Spirit","f":7,"d":"Male-targeting ghost that sits on sleepers' chests causing paralysis and suffocation. Thai men reportedly wear women's clothing to bed to confuse it","id":"th-phi-am","gf":["호러","다크 판타지"],"ip":false},{"id":"th-phi-krahang","n":"Phi Krahang","t":"Demon","f":7,"d":"Male counterpart to Krasue. Flies using rice baskets as wings.","ln":"ผีกระหัง","ab":["비행","원거리 공격"],"wk":["성스러운 실"],"vk":["flying man","rice baskets"],"gf":["action","horror"],"sh":["하늘을 나는 악령을 쫓는 퇴마사"]}]},{"c":"Philippines","r":"Southeast Asia","i":"PH","b":[{"n":"Aswang","t":"Shapeshifter","f":9,"d":"Shape-shifting vampire-witch that preys on pregnant women and children","id":"ph-aswang","ab":["변신"],"gf":["호러","다크 판타지"],"sh":["예언/징조"],"ip":false},{"n":"Manananggal","t":"Vampire","f":9,"d":"Self-segmenting creature whose upper body flies off to hunt at night","id":"ph-manananggal","ab":["비행","흡혈"],"gf":["호러","다크 판타지","액션"],"ip":false},{"n":"Tikbalang","t":"Trickster","f":5,"d":"Tall bony humanoid with horse head that leads travelers astray","id":"ph-tikbalang","ab":["불명"],"vk":["말 형상"],"gf":["다크 판타지"],"ip":false},{"n":"Diwata","t":"Nature Spirit","f":4,"d":"Dryad-like forest guardian spirits that bless respectful travelers with good health and fortune. Anger them by cutting their tree and illness follows","id":"ph-diwata","gf":["동화/판타지","영웅 서사"],"ip":false}]},{"c":"Indonesia","r":"Southeast Asia","i":"ID","b":[{"n":"Pocong","t":"Ghost","f":8,"d":"Wrapped corpse ghost that hops around because its burial shroud binds its legs","id":"id-pocong","ab":["불명"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Kuntilanak","t":"Vengeful Ghost","f":9,"d":"Ghost of woman who died in childbirth, appears beautiful before revealing horror","id":"id-kuntilanak","ab":["불명"],"vk":["아름다운 외모"],"gf":["호러","다크 판타지","로맨스"],"ip":false},{"n":"Leak","t":"Witch","f":8,"d":"Balinese witch whose head detaches and flies with entrails dangling","id":"id-leak","ab":["비행"],"vk":["내장 노출"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Wewe Gombel","t":"Ghost","f":7,"d":"Ghost of woman who committed suicide after husband's betrayal. Kidnaps neglected children to care for them, punishing bad parents","id":"id-wewe-gombel","gf":["호러","다크 판타지"],"ip":false},{"id":"id-rangda","n":"Rangda","t":"Demon Queen","f":9,"d":"Queen of demons in Balinese mythology with terrifying fanged face.","ln":"Rangda","ab":["흑마법","군단 통솔","화염"],"wk":["바롱의 힘"],"vk":["fanged mask","wild hair"],"gf":["dark_fantasy"],"sh":["발리 악의 여왕이 부활한다"],"ip":true}]},{"c":"Malaysia","r":"Southeast Asia","i":"MY","b":[{"n":"Penanggalan","t":"Vampire","f":9,"d":"Midwife whose head detaches at night to feed on blood of newborns","id":"my-penanggalan","ab":["흡혈"],"vk":["피"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Pontianak","t":"Vengeful Ghost","f":9,"d":"Ghost of woman who died during pregnancy, lures men with beauty","id":"my-pontianak","ab":["유혹"],"gf":["호러","다크 판타지","로맨스"],"ip":false},{"n":"Orang Minyak","t":"Entity","f":8,"d":"Oily Man — slippery dark figure that terrorizes women at night. Covered in black grease making him impossible to catch. Said to serve a dark shaman","id":"my-orang-minyak","gf":["호러","다크 판타지"],"ip":false},{"id":"my-toyol","n":"Toyol","t":"Familiar Spirit","f":6,"d":"Undead infant spirit kept by dark magic practitioners to steal valuables.","ln":"Toyol","ab":["투명화","절도"],"wk":["바늘","거울"],"vk":["baby ghost","green skin"],"gf":["horror","mystery"],"sh":["마을의 연쇄 도둑 사건 뒤 숨겨진 주술"]}]},{"c":"Cambodia","r":"Southeast Asia","i":"KH","b":[{"n":"Ap","t":"Vampire","f":8,"d":"Flying head spirit similar to Krasue that detaches at…","id":"kh-ap","ab":["비행","흡혈"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Bray","t":"Sorcery Spirit","f":7,"d":"Spirit servant created through dark magic to do a…","id":"kh-bray","ab":["불명"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Arb","t":"Witch","f":7,"d":"Female sorcerer whose head detaches at night trailing entrails to feed on filth and flesh. By day appears as normal woman in the village","id":"kh-arb","gf":["호러","다크 판타지"],"ip":false}]},{"c":"Myanmar","r":"Southeast Asia","i":"MM","b":[{"n":"Nat","t":"Spirit","f":5,"d":"Powerful nature spirits honored with shrines, can…","id":"mm-nat","ab":["불명"],"gf":["다크 판타지"],"ip":false},{"n":"Thaye","t":"Ghost","f":8,"d":"Giant evil ghosts of people who died violent deaths,…","id":"mm-thaye","ab":["불명"],"vk":["거대한 체구"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Belu","t":"Ogre","f":7,"d":"Fearsome ogres from Burmese mythology that devour humans. King of the Belu rules from the forest and demands human tribute from villages","id":"mm-belu","gf":["호러","다크 판타지"],"ip":false}]},{"c":"Laos","r":"Southeast Asia","i":"LA","b":[{"n":"Phi Pop","t":"Possessing Spirit","f":9,"d":"Malicious spirit that possesses people and devours…","id":"la-phi-pop","ab":["빙의","포식"],"gf":["호러","다크 판타지"],"sh":["빙의/퇴마"],"ip":false},{"n":"Phi Kong Koi","t":"Vampire","f":7,"d":"One-legged ghost that hops through forests and feeds…","id":"la-phi-kong-koi","ab":["흡혈"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Phi Phong","t":"Werewolf","f":7,"d":"Lao shapeshifter that transforms into a wolf-like beast at night to hunt humans. Ordinary villager by day, uncontrollable predator after dark","id":"la-phi-phong","gf":["호러","다크 판타지"],"ip":false}]},{"c":"Singapore","r":"Southeast Asia","i":"SG","b":[{"n":"Pontianak","t":"Vengeful Ghost","f":8,"d":"Same as Malaysian Pontianak, haunts banana trees and…","id":"sg-pontianak","ab":["불명"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Toyol","t":"Imp","f":5,"d":"Undead infant spirit kept by practitioners of dark…","id":"sg-toyol","ab":["불명"],"gf":["다크 판타지"],"ip":false},{"n":"Orang Bunian","t":"Hidden People","f":5,"d":"Invisible supernatural beings living in parallel dimension within forests and ancient trees. Beautiful and civilized, occasionally kidnapping humans","id":"sg-orang-bunian","gf":["다크 판타지"],"ip":false}]},{"c":"Brunei","r":"Southeast Asia","i":"BN","b":[{"n":"Penanggal","t":"Vampire","f":8,"d":"Similar to Malaysian Penanggalan, flying detached head…","id":"bn-penanggal","ab":["비행","흡혈"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Jinn","t":"Spirit","f":5,"d":"Invisible beings of Islamic tradition, can be…","id":"bn-jinn","ab":["투명화"],"gf":["다크 판타지"],"ip":false}]},{"c":"India","r":"South Asia","i":"IN","b":[{"n":"Vetala","t":"Vampire","f":8,"d":"Undead being that hangs from trees and possesses corpses, known for riddles","id":"in-vetala","ab":["빙의","수수께끼","흡혈"],"gf":["호러","다크 판타지","미스터리"],"sh":["빙의/퇴마"],"ip":false},{"n":"Churel","t":"Vengeful Ghost","f":9,"d":"Ghost of woman who died in childbirth, reversed feet, seduces men to drain life","id":"in-churel","ab":["유혹","흡수"],"gf":["호러","다크 판타지","로맨스"],"ip":false},{"n":"Rakshasa","t":"Demon","f":9,"d":"Shape-shifting demons that disrupt rituals and devour humans","id":"in-rakshasa","ab":["변신","포식"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Pishacha","t":"Flesh-Eating Demon","f":8,"d":"Demon that haunts cremation grounds feeding on human flesh. Can possess the living causing madness and speaking in unknown languages","id":"in-pishacha","ab":["빙의","포식"],"gf":["호러","다크 판타지"],"ip":false}]},{"c":"Nepal","r":"South Asia","i":"NP","b":[{"n":"Yeti","t":"Cryptid","f":5,"d":"Abominable Snowman of the Himalayas, ape-like creature of high altitudes","id":"np-yeti","ab":["불명"],"gf":["다크 판타지"],"ip":false},{"n":"Khyak","t":"Nature Spirit","f":4,"d":"Newari water spirits that guard wells and water sources","id":"np-khyak","ab":["불명"],"gf":["동화/판타지"],"sh":["수호 임무"],"ip":false},{"n":"Baak","t":"Ghost","f":7,"d":"Restless spirit of person who died violently, haunting crossroads and graveyards. Only visible to those about to die, serving as a death omen","id":"np-baak","gf":["호러","다크 판타지"],"ip":false}]},{"c":"Sri Lanka","r":"South Asia","i":"LK","b":[{"n":"Maha Sona","t":"Demon","f":8,"d":"Giant demon of graveyards with bear head who kills with terror","id":"lk-maha-sona","ab":["불명"],"vk":["거대한 체구"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Mohini","t":"Ghost","f":8,"d":"Beautiful female ghost that appears at crossroads to lure travelers","id":"lk-mohini","ab":["불명"],"wk":["십자가"],"vk":["아름다운 외모"],"gf":["호러","다크 판타지","로맨스"],"ip":false},{"n":"Riri Yaka","t":"Blood Demon","f":8,"d":"Blood Demon of Sinhalese folklore associated with disease and blood disorders. Requires elaborate exorcism ceremonies with masked dancers to banish","id":"lk-riri-yaka","gf":["호러","다크 판타지"],"ip":false}]},{"c":"Pakistan","r":"South Asia","i":"PK","b":[{"n":"Churel","t":"Vengeful Ghost","f":8,"d":"Woman who died wronged returns with backward feet to…","id":"pk-churel","ab":["불명"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Pichal Peri","t":"Ghost","f":8,"d":"Forest fairy with reversed feet who leads mountain…","id":"pk-pichal-peri","ab":["불명"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Jinn","t":"Spirit","f":7,"d":"Powerful beings of smokeless fire deeply embedded in Pakistani folk Islam. Haunt abandoned buildings, old trees, and crossroads at twilight","id":"pk-jinn","gf":["호러","다크 판타지"],"ip":false}]},{"c":"Bangladesh","r":"South Asia","i":"BD","b":[{"n":"Petni","t":"Ghost","f":8,"d":"Female ghost that haunts palm trees and possesses young women","id":"bd-petni","ab":["빙의"],"gf":["호러","다크 판타지"],"sh":["빙의/퇴마","예언/징조"],"ip":false},{"n":"Shakchunni","t":"Ghost","f":5,"d":"Ghost of married woman who died, identified by the sound of bangles","id":"bd-shakchunni","ab":["불명"],"gf":["다크 판타지"],"ip":false},{"n":"Mechho Bhoot","t":"Fish Ghost","f":5,"d":"Ghost of fisherman who drowned, obsessed with fish in death as in life. Appears near ponds smelling strongly of fish, relatively harmless but eerie","id":"bd-mechho-bhoot","gf":["다크 판타지"],"ip":false}]},{"c":"Afghanistan","r":"Central Asia","i":"AF","b":[{"n":"Al","t":"Demon","f":8,"d":"Hideous hag that attacks women during childbirth and…","id":"af-al","ab":["불명"],"vk":["흉측한 외모"],"gf":["호러","다크 판타지"],"sh":["예언/징조"],"ip":false},{"n":"Jinn","t":"Spirit","f":8,"d":"Powerful invisible beings created from smokeless fire…","id":"af-jinn","ab":["투명화","화염"],"vk":["불꽃"],"gf":["호러","다크 판타지"],"ip":false}]},{"c":"Iran","r":"West Asia","i":"IR","b":[{"n":"Div","t":"Demon","f":10,"d":"Giant monstrous demons from Zoroastrian tradition, enemies of heroes","id":"ir-div","ab":["불명"],"vk":["거대한 체구"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Al","t":"Hag","f":7,"d":"Ugly old woman spirit that attacks mothers and newborns","id":"ir-al","ab":["불명"],"vk":["흉측한 외모"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Jinn","t":"Spirit","f":5,"d":"Invisible beings of pre-Islamic and Islamic lore inhabiting ruins","id":"ir-jinn","ab":["투명화"],"gf":["다크 판타지"],"ip":false},{"n":"Manticore","t":"Beast","f":8,"d":"Lion-bodied creature with human face and scorpion tail that fires venomous spines. From Persian 'mardkhora' meaning man-eater. Devours prey whole leaving no bones","id":"ir-manticore","gf":["호러","다크 판타지"],"ip":false}]},{"c":"Turkey","r":"West Asia","i":"TR","b":[{"n":"Karakoncolos","t":"Winter Demon","f":7,"d":"Hairy demon that stands at corners in winter asking riddles to passersby","id":"tr-karakoncolos","ab":["수수께끼"],"gf":["호러","다크 판타지","미스터리"],"ip":false},{"n":"Al Karisi","t":"Hag","f":9,"d":"Red-clad demon that attacks new mothers and tries to steal their lungs","id":"tr-al-karisi","ab":["불명"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Gulyabani","t":"Ghoul","f":5,"d":"Desert ghoul that shapeshifts and lures travelers off their path","id":"tr-gulyabani","ab":["변신","유혹"],"gf":["다크 판타지"],"ip":false},{"n":"Hortlak","t":"Undead","f":7,"d":"Turkish revenant that rises from improperly buried graves to terrorize the living. Strangles victims in their sleep and drains life force","id":"tr-hortlak","gf":["호러","다크 판타지"],"ip":false},{"id":"tr-tepeg-z","n":"Tepegöz","t":"Cyclops","f":8,"d":"Turkish cyclops from Book of Dede Korkut. Giant one-eyed ogre terrorizing villages.","ln":"Tepegöz","ab":["괴력","불사신에 가까운 몸"],"wk":["눈 공격"],"vk":["one-eyed giant","cave"],"gf":["action","dark_fantasy"],"sh":["마을을 약탈하는 외눈박이 거인에 맞선 영웅"],"ip":true}]},{"c":"Saudi Arabia","r":"West Asia","i":"SA","b":[{"n":"Jinn","t":"Spirit","f":7,"d":"Beings of smokeless fire with free will, can be good or evil","id":"sa-jinn","ab":["화염"],"wk":["불"],"vk":["불꽃"],"gf":["호러","다크 판타지"],"sh":["자유를 향한 탈출"],"ip":false},{"n":"Ghoul","t":"Monster","f":8,"d":"Desert-dwelling shapeshifter that lures travelers and devours them","id":"sa-ghoul","ab":["유혹","포식"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Nasnas","t":"Half-Being","f":7,"d":"Creature with half a human body — one arm, one leg, half a face. Hops with terrifying speed through the Arabian desert killing with a single touch","id":"sa-nasnas","gf":["호러","다크 판타지"],"ip":false},{"id":"sa-si-lat","n":"Si'lat","t":"Shapeshifting Jinn","f":8,"d":"Most cunning type of jinn. Masters of deception who perfectly mimic any human.","ln":"سعلات","ab":["완벽한 변신","초지능"],"wk":["솔로몬의 인장"],"vk":["shifting form","desert"],"gf":["mystery","dark_fantasy"],"sh":["당신 옆의 사람은 인간인가"],"ip":true}]},{"c":"Iraq","r":"West Asia","i":"IQ","b":[{"n":"Pazuzu","t":"Demon","f":10,"d":"Ancient Mesopotamian demon king of wind, bearer of…","id":"iq-pazuzu","ab":["불명"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Utukku","t":"Evil Spirit","f":7,"d":"Ancient Sumerian spirits of the dead that escaped the…","id":"iq-utukku","ab":["불명"],"gf":["호러","다크 판타지"],"sh":["자유를 향한 탈출"],"ip":false},{"n":"Lamashtu","t":"Demon Goddess","f":9,"d":"Ancient Mesopotamian demoness who menaced pregnant women and slew infants. Daughter of the sky god Anu, so powerful that even other demons feared her","id":"iq-lamashtu","gf":["호러","다크 판타지"],"ip":false}]},{"c":"Israel","r":"West Asia","i":"IL","b":[{"n":"Dybbuk","t":"Possessing Spirit","f":9,"d":"Dislocated soul of a dead person that possesses the living","id":"il-dybbuk","ab":["빙의"],"gf":["호러","다크 판타지"],"sh":["빙의/퇴마"],"ip":false},{"n":"Golem","t":"Construct","f":5,"d":"Animated clay being created through ritual to protect communities","id":"il-golem","ab":["불명"],"gf":["다크 판타지","영웅 서사"],"sh":["수호 임무"],"ip":false},{"n":"Lilith","t":"Night Demon","f":9,"d":"Primordial night demon of Jewish folklore, Adam's rebellious first wife. Queen of demons who preys on newborns and seduces sleeping men","id":"il-lilith","ab":["유혹"],"gf":["호러","다크 판타지","로맨스"],"ip":false}]},{"c":"Egypt","r":"North Africa","i":"EG","b":[{"n":"Ammit","t":"Demon","f":8,"d":"Devourer of hearts, crocodile-lion-hippo hybrid that eats unworthy souls","id":"eg-ammit","ab":["포식"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Apep","t":"Chaos Serpent","f":10,"d":"Giant serpent of chaos that tries to devour the sun god Ra each night","id":"eg-apep","ab":["포식"],"wk":["햇빛"],"vk":["뱀 형상","거대한 체구"],"gf":["호러","다크 판타지","영웅 서사"],"ip":false},{"n":"Sphinx","t":"Guardian Beast","f":8,"d":"Lion-bodied human-headed guardian of tombs and sacred places. Devours all who cannot answer its riddle. The Great Sphinx of Giza is its most famous incarnation","id":"eg-sphinx","ab":["수수께끼"],"gf":["다크 판타지","미스터리"],"ip":false}]},{"c":"Kazakhstan","r":"Central Asia","i":"KZ","b":[{"n":"Albasty","t":"Demon","f":8,"d":"Female demon that attacks women in childbirth and causes nightmares","id":"kz-albasty","ab":["악몽 유발"],"gf":["호러","다크 판타지"],"sh":["예언/징조"],"ip":false},{"n":"Zhalmauyz Kempir","t":"Ogress","f":7,"d":"Cannibalistic old woman who kidnaps and devours children","id":"kz-zhalmauyz-kempir","ab":["포식"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Dzheztyrmak","t":"Copper Claws","f":8,"d":"Monstrous old woman with copper claws who devours children. The Kazakh equivalent of Baba Yaga, she rides a flying mortar through the steppe skies","id":"kz-dzheztyrmak","ab":["비행"],"gf":["호러","다크 판타지"],"ip":false}]},{"c":"Uzbekistan","r":"Central Asia","i":"UZ","b":[{"n":"Dev","t":"Giant","f":7,"d":"Monstrous giants of Turkic mythology, enemies of heroes","id":"uz-dev","ab":["불명"],"vk":["거대한 체구"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Albasty","t":"Demon","f":7,"d":"Shape-shifting female demon associated with childbirth…","id":"uz-albasty","ab":["변신"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Jinn","t":"Fire Spirit","f":7,"d":"Desert jinn of Uzbek tradition dwelling in ancient ruins along the Silk Road. Shape-shift into camels and travelers to lure merchants into sand traps","id":"uz-jinn","ab":["변신"],"gf":["호러","다크 판타지"],"ip":false}]},{"c":"Georgia","r":"West Asia","i":"GE","b":[{"n":"Devi","t":"Giant","f":7,"d":"Multi-headed giants who guard treasure and kidnap maidens","id":"ge-devi","ab":["불명"],"vk":["거대한 체구"],"gf":["호러","다크 판타지"],"sh":["보물 탐색","수호 임무"],"ip":false},{"n":"Ali","t":"Nature Spirit","f":5,"d":"Forest spirits that can be helpful or harmful depending on respect shown","id":"ge-ali","ab":["불명"],"gf":["다크 판타지"],"ip":false},{"n":"Kudiani","t":"Witch","f":7,"d":"Georgian witch who can fly and transforms into animals. Steals milk from cows and kidnaps children during the twelve days of Christmas","id":"ge-kudiani","ab":["변신","비행"],"gf":["호러","다크 판타지"],"ip":false}]},{"c":"United Kingdom","r":"Western Europe","i":"GB","b":[{"n":"Black Shuck","t":"Phantom Beast","f":8,"d":"Giant ghostly black dog with blazing eyes that roams East Anglia","id":"gb-black-shuck","ab":["불명"],"wk":["개"],"vk":["타오르는 눈","거대한 체구"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Banshee","t":"Death Omen","f":8,"d":"Wailing spirit whose cry foretells death in Irish-British tradition","id":"gb-banshee","ab":["불명"],"gf":["호러","다크 판타지"],"sh":["예언/징조"],"ip":false},{"n":"Spring-Heeled Jack","t":"Entity","f":8,"d":"Leaping devil-like figure with clawed hands and fire-breathing ability","id":"gb-spring-heeled-jack","ab":["화염"],"vk":["발톱","불꽃"],"gf":["호러","다크 판타지"],"ip":false}]},{"c":"Ireland","r":"Western Europe","i":"IE","b":[{"n":"Dullahan","t":"Headless Rider","f":8,"d":"Headless horseman carrying own head, harbinger of death","id":"ie-dullahan","ab":["불명"],"vk":["말 형상","머리 없음"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Changeling","t":"Fairy","f":5,"d":"Fairy child left in place of a stolen human baby","id":"ie-changeling","ab":["불명"],"gf":["다크 판타지"],"ip":false},{"n":"Dearg Due","t":"Vampire","f":7,"d":"Irish female vampire who rises from the grave to seduce and drain blood","id":"ie-dearg-due","ab":["유혹","흡수","흡혈"],"vk":["피"],"gf":["호러","다크 판타지","로맨스"],"ip":false}]},{"c":"France","r":"Western Europe","i":"FR","b":[{"n":"Loup-Garou","t":"Werewolf","f":9,"d":"French werewolf cursed to transform during full moon","id":"fr-loup-garou","ab":["변신","저주"],"vk":["늑대 형상"],"gf":["호러","다크 판타지","미스터리"],"sh":["저주 해제","인간이 되고 싶은 욕망"],"ip":false},{"n":"La Bête du Gévaudan","t":"Beast","f":9,"d":"Historical man-eating wolf-like creature that terrorized 18th century France","id":"fr-la-b-te-du-g-vaudan","ab":["불명"],"vk":["늑대 형상"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Melusine","t":"Water Fey","f":5,"d":"Woman cursed to transform into a serpent from the waist down every Saturday. Ancestress of noble houses who built castles overnight with fairy power","id":"fr-melusine","ab":["변신"],"gf":["로맨스","다크 판타지"],"ip":false},{"id":"fr-tarasque","n":"Tarasque","t":"Dragon","f":8,"d":"Fearsome six-legged dragon of Provence with turtle shell and scorpion tail.","ln":"Tarasque","ab":["화염","독꼬리","갑각 방어"],"wk":["성녀의 기도"],"vk":["six-legged dragon","river"],"gf":["action"],"sh":["프로방스의 전설적 괴수가 부활한다"],"ip":true}]},{"c":"Germany","r":"Western Europe","i":"DE","b":[{"n":"Krampus","t":"Demon","f":8,"d":"Horned Christmas demon who punishes naughty children with birch switches","id":"de-krampus","ab":["불명"],"vk":["뿔"],"gf":["호러","다크 판타지"],"sh":["선악 심판"],"ip":false},{"n":"Erlkönig","t":"Death Spirit","f":9,"d":"Elf King who lures children to their death in the forest","id":"de-erlk-nig","ab":["유혹"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Nachtkrapp","t":"Night Bird","f":8,"d":"Giant raven that snatches children who stay out after dark","id":"de-nachtkrapp","ab":["불명"],"vk":["거대한 체구"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Alp","t":"Nightmare Elf","f":7,"d":"Demonic elf that sits on sleepers' chests causing nightmares and sleep paralysis. Enters through keyholes and can be warded only by placing shoes pointing away from bed","id":"de-alp","ab":["악몽 유발"],"gf":["호러","다크 판타지"],"ip":false}]},{"c":"Netherlands","r":"Western Europe","i":"NL","b":[{"n":"Witte Wieven","t":"Ghost","f":5,"d":"White women spirits that haunt misty moors and burial mounds","id":"nl-witte-wieven","ab":["불명"],"vk":["하얀"],"gf":["다크 판타지"],"sh":["예언/징조"],"ip":false},{"n":"Zwarte Piet","t":"Trickster","f":4,"d":"Mischievous companion figure in Dutch winter folklore","id":"nl-zwarte-piet","ab":["불명"],"gf":["동화/판타지"],"ip":false},{"n":"Bokkenrijder","t":"Phantom Rider","f":7,"d":"Riders who sold their souls to the devil and ride flying goats through the night sky. Based on 18th century Limburg witch trials and mass panic","id":"nl-bokkenrijder","ab":["비행"],"gf":["호러","다크 판타지"],"ip":false}]},{"c":"Belgium","r":"Western Europe","i":"BE","b":[{"n":"Kludde","t":"Shapeshifter","f":7,"d":"Malevolent shapeshifter that takes form of a dog, cat,…","id":"be-kludde","ab":["변신"],"wk":["개"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Lange Wapper","t":"Giant","f":5,"d":"Shape-shifting giant of Antwerp that terrorizes drunks…","id":"be-lange-wapper","ab":["변신"],"vk":["거대한 체구"],"gf":["다크 판타지"],"ip":false},{"n":"Nekker","t":"Water Demon","f":7,"d":"Malicious water spirit that drowns travelers by disguising as a beautiful horse or a floating treasure. Haunts rivers and canals of Flanders","id":"be-nekker","ab":["변신","익사 유발"],"gf":["호러","다크 판타지"],"ip":false}]},{"c":"Austria","r":"Western Europe","i":"AT","b":[{"n":"Krampus","t":"Demon","f":8,"d":"Alpine Christmas devil with chains and birch bundle,…","id":"at-krampus","ab":["불명"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Perchta","t":"Winter Witch","f":8,"d":"Alpine goddess who slits bellies of the lazy during…","id":"at-perchta","ab":["불명"],"gf":["호러","다크 판타지","영웅 서사"],"ip":false},{"n":"Wolpertinger","t":"Chimera","f":4,"d":"Bavarian-Austrian hybrid creature with rabbit body, antlers, wings, and fangs. Shy forest dweller that can only be caught by a young woman during full moon","id":"at-wolpertinger","gf":["동화/판타지","코미디"],"ip":false}]},{"c":"Switzerland","r":"Western Europe","i":"CH","b":[{"n":"Barbegazi","t":"Ice Gnome","f":2,"d":"Shy mountain gnomes with huge frozen feet who surf…","id":"ch-barbegazi","ab":["불명"],"gf":["동화/판타지"],"ip":false},{"n":"Stollenwurm","t":"Dragon","f":7,"d":"Thick worm-like dragon of Alpine caves with cat-like…","id":"ch-stollenwurm","ab":["불명"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Tatzelwurm","t":"Alpine Dragon","f":7,"d":"Cat-faced serpentine creature dwelling in Alpine caves. Has only two front legs and a thick cylindrical body. Its breath is said to be lethal","id":"ch-tatzelwurm","gf":["호러","다크 판타지"],"ip":false}]},{"c":"Norway","r":"Northern Europe","i":"NO","b":[{"n":"Draugr","t":"Undead","f":8,"d":"Undead Norse warriors that guard their burial mounds with superhuman strength. Can grow in size, shift shape, and drive the living mad. Their treasure hoards are cursed","id":"no-draugr","ab":["저주","초인적 힘"],"gf":["호러","다크 판타지","액션","미스터리"],"sh":["저주 해제","보물 탐색","수호 임무"],"ip":false},{"n":"Nøkken","t":"Water Spirit","f":7,"d":"Shapeshifting water spirit that lures people to drown with beautiful fiddle music. Appears as white horse, handsome man, or golden treasure by the riverbank","id":"no-n-kken","ab":["변신","유혹"],"vk":["황금빛","하얀","말 형상","아름다운 외모","잘생긴 외모"],"gf":["호러","다크 판타지","로맨스"],"sh":["보물 탐색"],"ip":false},{"n":"Huldra","t":"Forest Spirit","f":4,"d":"Seductive forest woman with cow tail who lures men into the woods. If married in a church, loses her tail and gains a human soul. Her beauty hides a hollow bark-like back","id":"no-huldra","ab":["유혹"],"wk":["교회/사원"],"vk":["꼬리"],"gf":["로맨스","동화/판타지"],"ip":false},{"n":"Fossegrimmen","t":"Water Spirit","f":4,"d":"Waterfall spirit and master fiddler who teaches humans to play the Hardanger fiddle so beautifully that trees dance and rivers stop. Payment: a white goat thrown into a north-flowing waterfall","id":"no-fossegrimmen","ab":["불명"],"vk":["날개","하얀","아름다운 외모"],"gf":["로맨스","동화/판타지"],"ip":false},{"n":"Nidhogg","t":"Cosmic Dragon","f":10,"d":"Massive serpent-dragon gnawing at the roots of Yggdrasil, the World Tree. Feeds on corpses of oath-breakers in Nastrond. Will survive Ragnarök and feast on the dead","id":"no-nidhogg","ab":["불명"],"vk":["날개","뱀 형상"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Jörmungandr","t":"World Serpent","f":10,"d":"Midgard Serpent encircling the entire world, biting its own tail. Child of Loki. When it releases its tail, Ragnarök begins. Destined to kill and be killed by Thor","id":"no-j-rmungandr","ab":["불명"],"vk":["꼬리","뱀 형상"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Fenrir","t":"Giant Wolf","f":10,"d":"Monstrous wolf of Norse myth, son of Loki. Bound by the dwarven chain Gleipnir at the cost of Tyr's hand. Breaks free at Ragnarök to devour Odin himself","id":"no-fenrir","ab":["포식"],"vk":["늑대 형상"],"gf":["호러","다크 판타지"],"sh":["자유를 향한 탈출"],"ip":false},{"n":"Kraken","t":"Sea Monster","f":9,"d":"Colossal sea creature off Norway's coast, large enough to be mistaken for an island. Drags ships underwater with massive tentacles. First recorded by Erik Pontoppidan in 1752","id":"no-kraken","src":["Erik Pontoppidan"],"ab":["불명"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Troll","t":"Giant","f":7,"d":"Massive dim-witted beings dwelling in mountains and caves. Turn to stone in sunlight. Some have multiple heads. Norwegian landscape is full of troll-shaped rock formations","id":"no-troll","ab":["불명"],"wk":["햇빛"],"gf":["호러","다크 판타지","코미디"],"ip":false},{"n":"Mara","t":"Night Spirit","f":7,"d":"Malevolent female spirit that sits on sleepers' chests causing nightmares and suffocation. Origin of the English word 'nightmare'. Can enter through keyholes","id":"no-mara","ab":["악몽 유발"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Myling","t":"Ghost Child","f":8,"d":"Ghosts of unbaptized or murdered children. Chase travelers at night demanding proper burial. Grow impossibly heavy on their carrier's back, crushing them into the ground if the grave isn't reached","id":"no-myling","ab":["불명"],"gf":["호러","다크 판타지"],"sh":["비극적 탄생"],"ip":false},{"n":"Gjenganger","t":"Revenant","f":7,"d":"Corporeal ghost that returns from the dead, distinct from draugr. Spreads disease by pinching the living, leaving blue marks. Can only be stopped by reburial at a crossroads","id":"no-gjenganger","ab":["역병"],"wk":["십자가"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Tussero","t":"Underground Folk","f":5,"d":"Invisible subterranean beings living beneath farms and hills. Rewarded respectful farmers with prosperity. Disrespect brings livestock disease, crop failure, and house fires","id":"no-tussero","ab":["투명화","화염","역병"],"vk":["불꽃"],"gf":["다크 판타지"],"ip":false},{"n":"Lindworm","t":"Dragon","f":7,"d":"Wingless serpent-dragon with two clawed arms. Norwegian folklore tells of lindworms demanding marriage to princesses. Only shed their monstrous skin when shown true love","id":"no-lindworm","ab":["불명"],"vk":["날개","발톱","뱀 형상"],"gf":["호러","다크 판타지","로맨스"],"sh":["금단의 사랑"],"ip":false},{"n":"Sleipnir","t":"Divine Beast","f":5,"d":"Odin's eight-legged grey horse, offspring of Loki in mare form. Fastest creature in existence, can gallop between the nine worlds and ride across sea and sky","id":"no-sleipnir","ab":["불명"],"wk":["십자가"],"vk":["말 형상"],"gf":["다크 판타지"],"ip":false},{"n":"Hugin & Munin","t":"Divine Ravens","f":5,"d":"Odin's twin ravens — Thought and Memory — who fly across all nine worlds each day to bring news. Odin fears that one day Munin will not return","id":"no-hugin-munin","ab":["비행"],"wk":["십자가"],"gf":["다크 판타지"],"ip":false},{"n":"Helhest","t":"Death Horse","f":9,"d":"Three-legged pale horse associated with death and the goddess Hel. Its appearance near a village signals plague. Those who glimpse it through the mist are marked for death","id":"no-helhest","ab":["역병"],"vk":["창백한 피부","말 형상"],"gf":["호러","다크 판타지","영웅 서사"],"ip":false},{"n":"Pesta","t":"Plague Hag","f":9,"d":"Personification of the Black Death as an old woman in black. Carries a broom and a rake — the rake leaves survivors, the broom sweeps everyone to death","id":"no-pesta","ab":["불명"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Haugbui","t":"Mound Dweller","f":7,"d":"Peacefully dead who remain in their burial mounds, unlike aggressive draugr. Only attack if their mound is disturbed. Guard ancient treasures and ancestral wisdom","id":"no-haugbui","ab":["불명"],"gf":["호러","다크 판타지"],"sh":["보물 탐색","수호 임무"],"ip":false},{"n":"Nokke","t":"Shape-Shifting Monster","f":7,"d":"Terrifying aquatic predator taking the form of a beautiful white horse by lakeshores. Children who mount it become stuck fast as it gallops into deep water to drown them","id":"no-nokke","ab":["불명"],"vk":["하얀","말 형상","아름다운 외모"],"gf":["호러","다크 판타지","로맨스"],"ip":false}]},{"c":"Sweden","r":"Northern Europe","i":"SE","b":[{"n":"Näcken","t":"Water Spirit","f":8,"d":"Naked male water spirit who plays enchanting fiddle to drown listeners. Appears at twilight in streams and lakes. Can be freed from his curse if someone throws a black lamb into the water","id":"se-n-cken","ab":["저주"],"gf":["호러","다크 판타지","미스터리"],"sh":["저주 해제","자유를 향한 탈출"],"ip":false},{"n":"Skogsrå","t":"Forest Spirit","f":5,"d":"Beautiful forest woman hollow like a tree trunk or with a fox tail from behind. Seduces charcoal burners and hunters. If treated well, she ensures good hunting; if spurned, brings ruin","id":"se-skogsr","ab":["유혹"],"vk":["꼬리","아름다운 외모"],"gf":["다크 판타지","로맨스","액션"],"ip":false},{"n":"Bäckahästen","t":"Water Horse","f":9,"d":"Magnificent white horse appearing by streams and rivers. Anyone who mounts it cannot dismount as it charges into water to drown them. Children are especially lured by its beauty","id":"se-b-ckah-sten","ab":["불명"],"vk":["하얀","말 형상"],"gf":["호러","다크 판타지","로맨스"],"ip":false},{"n":"Tomte","t":"House Spirit","f":4,"d":"Small bearded farmstead guardian no taller than a child. Protects the household but demands respect and a bowl of porridge with butter on Christmas Eve. A slighted tomte wreaks havoc","id":"se-tomte","ab":["불명"],"vk":["작은 체구"],"gf":["동화/판타지","영웅 서사"],"sh":["수호 임무"],"ip":false},{"n":"Vittror","t":"Underground People","f":5,"d":"Subterranean folk of northern Sweden who kidnap humans and livestock. Their cattle can be heard lowing beneath the ground. Iron and prayer are the only protections","id":"se-vittror","ab":["불명"],"wk":["철/쇠","기도"],"vk":["날개"],"gf":["다크 판타지","영웅 서사"],"sh":["수호 임무"],"ip":false},{"n":"Gloson","t":"Phantom Boar","f":7,"d":"Spectral sow with razor-sharp bristles that runs between travelers' legs to split them in half. Haunts lonely roads at night. Only stopped by driving a steel knife into the ground","id":"se-gloson","ab":["불명"],"wk":["강철"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Myling","t":"Ghost Child","f":8,"d":"Restless spirits of abandoned infants left to die in Swedish forests. Leap onto travelers' backs screaming 'Carry me to the churchyard!' growing heavier with each step until the carrier collapses","id":"se-myling","ab":["불명"],"wk":["교회/사원"],"vk":["날개"],"gf":["호러","다크 판타지"],"sh":["비극적 탄생"],"ip":false},{"n":"Skogsmannen","t":"Forest Giant","f":5,"d":"Male counterpart of Skogsrå — enormous moss-covered forest man who controls wild game. Hunters must leave offerings or risk having game driven away. His laughter echoes through pine forests","id":"se-skogsmannen","ab":["거대화"],"vk":["거대한 체구"],"gf":["다크 판타지","액션"],"ip":false},{"n":"Kyrkogrimen","t":"Church Grim","f":7,"d":"Spirit of an animal buried alive beneath a church's foundation to guard the cemetery. Usually appears as a black lamb or horse. Protects the dead from witches and the devil","id":"se-kyrkogrimen","ab":["불명"],"wk":["교회/사원"],"vk":["말 형상"],"gf":["호러","다크 판타지","영웅 서사"],"sh":["수호 임무"],"ip":false},{"n":"Sjörå","t":"Lake Spirit","f":5,"d":"Female spirit ruling over lakes and their fish. Fishermen who show respect receive bountiful catches. She can be glimpsed combing her hair on rocks at dawn, disappearing if spotted","id":"se-sj-r","ab":["불명"],"wk":["새벽"],"gf":["다크 판타지"],"ip":false},{"n":"Trollkatt","t":"Witch Familiar","f":5,"d":"Milk-stealing magical creature created by witches from yarn and bodily fluids. Takes the shape of a ball or cat-like being that sneaks into barns to steal cream and milk for its master","id":"se-trollkatt","ab":["불명"],"gf":["다크 판타지"],"ip":false},{"n":"Ättebacka Spirit","t":"Ancestor Ghost","f":7,"d":"Spirits dwelling at ättebacka (clan mounds) where elderly were once pushed off cliffs. Their restless souls demand remembrance. Disturbing these ancient sites brings generations of bad luck","id":"se-ttebacka-spirit","ab":["불명"],"gf":["호러","다크 판타지"],"ip":false}]},{"c":"Denmark","r":"Northern Europe","i":"DK","b":[{"n":"Mare","t":"Night Spirit","f":8,"d":"Spirit that sits on sleeping people's chests causing nightmares and paralysis. Origin of 'nightmare'. Often the spirit of a living woman whose soul wanders while she sleeps","id":"dk-mare","ab":["마비","악몽 유발"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Nisse","t":"House Spirit","f":4,"d":"Small guardian spirit of the farmstead wearing a red pointed cap. Demands porridge with butter on Christmas Eve. If offended, plays cruel tricks or kills livestock in rage","id":"dk-nisse","ab":["불명"],"vk":["작은 체구"],"gf":["코미디","동화/판타지","영웅 서사"],"sh":["수호 임무"],"ip":false},{"n":"Ellefolk","t":"Fairy","f":5,"d":"Enchanting elven folk who dance in moonlit meadows. Their king lives beneath ancient burial mounds. Hollow-backed women called Ellepiger lure men into their dance, trapping them for decades","id":"dk-ellefolk","ab":["불명"],"gf":["다크 판타지"],"sh":["예언/징조"],"ip":false},{"n":"Valravn","t":"Supernatural Raven","f":9,"d":"Raven that consumed the heart of a king dead on the battlefield, gaining human intelligence and shapeshifting power. Can transform into a half-wolf, half-raven knight. Craves more human hearts","id":"dk-valravn","ab":["변신","포식"],"vk":["늑대 형상"],"gf":["호러","다크 판타지","액션"],"sh":["인간이 되고 싶은 욕망"],"ip":false},{"n":"Lindorm","t":"Dragon","f":8,"d":"Giant limbless serpent-dragon that devours livestock and demands royal brides. Danish legend tells of a king's firstborn cursed as a lindorm who can only be freed by a brave woman's love","id":"dk-lindorm","ab":["저주","포식"],"wk":["용기"],"vk":["뱀 형상","거대한 체구"],"gf":["호러","다크 판타지","로맨스","미스터리"],"sh":["저주 해제","금단의 사랑","자유를 향한 탈출"],"ip":false},{"n":"Helhest","t":"Death Horse","f":9,"d":"Three-legged horse that gallops through towns at night heralding plague and mass death. Associated with the goddess Hel. Hearing its hoofbeats means death is choosing its victims","id":"dk-helhest","ab":["역병","포식"],"vk":["말 형상"],"gf":["호러","다크 판타지","영웅 서사"],"ip":false},{"n":"Nøkke","t":"Water Demon","f":7,"d":"Danish variant of the water spirit, appearing as a horse or handsome youth. Lurks beneath lily pads in still water. Children are warned never to lean over dark ponds alone","id":"dk-n-kke","ab":["불명"],"vk":["말 형상","잘생긴 외모"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Kirke Nisse","t":"Church Brownie","f":4,"d":"Mischievous small spirit dwelling in old Danish churches. Rings bells at odd hours, moves hymn books, and trips rude churchgoers. Protects the building from fire and thieves at night","id":"dk-kirke-nisse","ab":["화염"],"wk":["불","교회/사원"],"vk":["작은 체구","불꽃"],"gf":["동화/판타지","영웅 서사"],"sh":["수호 임무"],"ip":false},{"n":"Hyldemor","t":"Elder Mother","f":5,"d":"Spirit inhabiting elder trees. Must ask her permission before cutting branches: 'Elder Mother, may I take your wood?' Cutting without permission brings terrible misfortune and illness","id":"dk-hyldemor","ab":["불명"],"gf":["다크 판타지"],"ip":false},{"n":"Bjergfolk","t":"Mountain People","f":5,"d":"Underground folk dwelling in Danish hills and mounds. Master brewers and metalworkers. Their doors open on moonlit nights revealing golden halls. Humans who enter may not return for a hundred years","id":"dk-bjergfolk","ab":["불명"],"vk":["황금빛"],"gf":["다크 판타지"],"ip":false},{"n":"Ildvætte","t":"Fire Wight","f":7,"d":"Elemental fire spirit of ancient Norse-Danish tradition, dwelling in hearth flames. If the hearth fire is disrespected or extinguished carelessly, the ildvætte burns the house in revenge","id":"dk-ildv-tte","ab":["화염"],"wk":["불"],"vk":["불꽃"],"gf":["호러","다크 판타지"],"sh":["복수"],"ip":false},{"n":"Havmand","t":"Merman","f":7,"d":"Danish merman with green beard and seaweed hair dwelling beneath the waves. Can control storms and tides. Fishermen who see him surface must immediately turn their boats to shore","id":"dk-havmand","ab":["폭풍 조종"],"gf":["호러","다크 판타지"],"ip":false}]},{"c":"Finland","r":"Northern Europe","i":"FI","b":[{"n":"Näkki","t":"Water Spirit","f":8,"d":"Water spirit dwelling in dark pools that pulls children underwater. Finnish parents warn: 'Don't go near the water or Näkki will get you.' Can appear as a horse, beautiful woman, or fish","id":"fi-n-kki","ab":["익사 유발"],"vk":["말 형상","아름다운 외모"],"gf":["호러","다크 판타지","로맨스"],"ip":false},{"n":"Hiisi","t":"Evil Spirit","f":8,"d":"Originally sacred grove spirits that became evil demons after Christianization. In Kalevala, Hiisi created the elk of monstrous proportions. Name survives in Finnish place names","id":"fi-hiisi","src":["Kalevala"],"ab":["불명"],"wk":["이름 부르기"],"gf":["호러","다크 판타지","영웅 서사"],"ip":false},{"n":"Ajatar","t":"Forest Dragon","f":9,"d":"Evil female forest spirit and dragon of Finnish mythology. Suckles serpents and spreads disease. Her very presence causes anyone who looks at her to fall violently ill. Mother of the Devil in some traditions","id":"fi-ajatar","ab":["역병"],"vk":["뱀 형상"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Iku-Turso","t":"Sea Monster","f":9,"d":"Colossal malevolent sea creature from the Kalevala. Thousand-horned monster of the deep whose surfacing brings storms and whose breath spreads plague across coastal lands","id":"fi-iku-turso","src":["Kalevala"],"ab":["역병","폭풍 조종"],"wk":["십자가"],"vk":["뿔"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Surma","t":"Death Beast","f":9,"d":"Monstrous beast guarding the gates of Tuonela, the Finnish underworld. Has characteristics of a giant dog and a serpent. No living being can pass it — those who try are devoured instantly","id":"fi-surma","ab":["포식"],"wk":["개"],"vk":["뱀 형상","거대한 체구"],"gf":["호러","다크 판타지"],"sh":["수호 임무"],"ip":false},{"n":"Liekkiö","t":"Ghost Light","f":5,"d":"Will-o'-the-wisp spirits of unbaptized children. Blue flames floating through Finnish forests and swamps. Following them leads to bogs where travelers sink and drown. Finding them marks hidden treasure","id":"fi-liekki","ab":["화염"],"vk":["날개","불꽃"],"gf":["다크 판타지","미스터리"],"sh":["비극적 탄생","보물 탐색"],"ip":false},{"n":"Vetehinen","t":"Water Demon","f":7,"d":"Slimy humanoid water creature with weeds for hair and fish scales for skin. Drags swimmers to lake bottoms. Some legends say capturing one grants three wishes before it escapes","id":"fi-vetehinen","ab":["불명"],"gf":["호러","다크 판타지"],"sh":["자유를 향한 탈출"],"ip":false},{"n":"Menninkäinen","t":"Earth Gnome","f":4,"d":"Tiny underground folk dwelling beneath tree roots and rock formations. Skilled blacksmiths and healers. Help those who leave milk and bread; curse those who damage their dwellings","id":"fi-mennink-inen","ab":["저주"],"vk":["작은 체구"],"gf":["미스터리","동화/판타지"],"sh":["저주 해제"],"ip":false},{"n":"Para","t":"Milk Thief","f":5,"d":"Magical creature crafted by witches from spindles and bodily fluids. Flies through the air to steal milk and butter from neighbors' cows. Returns to its maker as a ball of yarn dripping stolen cream","id":"fi-para","ab":["비행"],"gf":["다크 판타지"],"ip":false},{"n":"Painajainen","t":"Nightmare Spirit","f":8,"d":"Crushing nightmare entity that manifests as a horse, cat, or faceless shadow sitting on the sleeper's chest. Can be the wandering soul of a jealous neighbor or spiteful witch","id":"fi-painajainen","ab":["악몽 유발"],"vk":["말 형상","얼굴 없음"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Stallo","t":"Sámi Giant","f":8,"d":"Enormous stupid giant of Sámi tradition who terrorizes reindeer herders. Strong but dim-witted, frequently outsmarted by clever children. Carries a knife the size of a man","id":"fi-stallo","ab":["거대화"],"vk":["거대한 체구"],"gf":["호러","다크 판타지","코미디"],"ip":false},{"n":"Maahinen","t":"Earth Spirit","f":5,"d":"Underground beings of Finnish folk religion living mirror lives beneath the surface. Their cattle graze in subterranean meadows. Offending them causes sickness that only a tietäjä (shaman) can cure","id":"fi-maahinen","ab":["불명"],"gf":["다크 판타지"],"ip":false},{"n":"Lempo","t":"Chaos Demon","f":9,"d":"Powerful evil spirit of Finnish mythology — originally a love deity corrupted into a demon by Christian influence. Commands lesser demons Hiisi and Paha. Name used as a Finnish curse word","id":"fi-lempo","ab":["저주"],"wk":["이름 부르기"],"gf":["호러","다크 판타지","로맨스","미스터리"],"sh":["저주 해제","금단의 사랑"],"ip":false},{"n":"Saunatonttu","t":"Sauna Spirit","f":5,"d":"Guardian spirit of the Finnish sauna. Must be given the last turn to bathe. Those who violate sauna etiquette or bathe too late are scalded or suffocated by the angry tonttu","id":"fi-saunatonttu","ab":["불명"],"gf":["다크 판타지","영웅 서사"],"sh":["수호 임무"],"ip":false}]},{"c":"Iceland","r":"Northern Europe","i":"IS","b":[{"n":"Huldufólk","t":"Hidden People","f":4,"d":"Invisible elves living in rocks that punish those who disturb their homes. So deeply believed that Icelandic road construction has been rerouted to avoid elf dwellings. Descended from Eve's unwashed children","id":"is-hulduf-lk","ab":["투명화"],"gf":["동화/판타지"],"ip":false},{"n":"Grýla","t":"Ogress","f":9,"d":"Giant ogress mother of the 13 Yule Lads who descends from mountains each Christmas to boil naughty children in her cauldron. Has 15 tails and hooves. Her husband Leppalúði is useless","id":"is-gr-la","ab":["불명"],"vk":["꼬리","거대한 체구"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Jólakötturinn","t":"Yule Cat","f":7,"d":"Enormous black cat belonging to Grýla that devours anyone not wearing new clothes before Christmas Eve. Prowls snowy villages peering through windows to find poorly-dressed victims","id":"is-j-lak-tturinn","ab":["거대화","포식"],"vk":["거대한 체구"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Draugur","t":"Undead","f":9,"d":"Icelandic walking dead — bloated, blue-black corpses with superhuman strength who terrorize farms. Can grow to gigantic size, control weather, and drive victims insane. Must be wrestled back into their graves","id":"is-draugur","ab":["초인적 힘","광기 유발","기상 조종"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Nykur","t":"Water Horse","f":7,"d":"Grey horse found grazing alone by Icelandic lakes and rivers. If mounted, it charges into deep water. Can be identified by its hooves being reversed. Saying its name breaks the spell","id":"is-nykur","ab":["불명"],"wk":["이름 부르기"],"vk":["말 형상"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Marbendill","t":"Merman","f":5,"d":"Wise Icelandic merman caught in fishermen's nets who prophesies the future if released. Refusing to free him brings terrible storms. Some are helpful, teaching humans about tides and weather","id":"is-marbendill","ab":["예언","폭풍 조종","기상 조종"],"gf":["다크 판타지"],"sh":["자유를 향한 탈출"],"ip":false},{"n":"Skoffín","t":"Hybrid Monster","f":9,"d":"Offspring of an arctic fox and a domestic cat, born with a lethal gaze. Looking directly into a Skoffín's eyes causes instant death. Only another Skoffín can safely meet its gaze and destroy it","id":"is-skoff-n","ab":["불명"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Tilberi","t":"Milk Thief","f":5,"d":"Magical worm created from a dead man's rib bone, wrapped in wool and nursed on the witch's blood. Crawls into neighbors' farms to steal milk by sucking cows dry. Vomits the stolen milk into its maker's churn","id":"is-tilberi","ab":["불명"],"vk":["뼈","피"],"gf":["다크 판타지"],"ip":false},{"n":"Lagarfljótsormur","t":"Lake Serpent","f":7,"d":"Giant wyrm dwelling in Lagarfljót lake, Iceland's answer to the Loch Ness Monster. Originally a tiny worm placed on gold that grew monstrously large. Sightings recorded since 1345","id":"is-lagarflj-tsormur","ab":["불명"],"vk":["거대한 체구","작은 체구"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Fjallkona","t":"Mountain Woman","f":5,"d":"Personification of Iceland as an ancient giantess dressed in traditional Icelandic costume. National symbol representing the harsh beauty and indomitable spirit of the Icelandic landscape","id":"is-fjallkona","ab":["불명"],"vk":["거대한 체구"],"gf":["다크 판타지","로맨스"],"ip":false},{"n":"Útburður","t":"Exposed Child Ghost","f":8,"d":"Ghosts of infants left to die of exposure in Iceland's harsh winters — a once-accepted practice. Haunt the places of their death with heartbreaking cries. Among the most feared spirits in saga literature","id":"is-tbur-ur","src":["saga literature"],"ab":["불명"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Sendingur","t":"Sent Ghost","f":8,"d":"Ghost raised from its grave by a sorcerer and sent to torment an enemy. Drives the target mad, causes wasting disease, and eventual death. Only a more powerful sorcerer can dispel it","id":"is-sendingur","ab":["역병"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Bjarndýrakóngur","t":"Bear King","f":7,"d":"Enchanted prince cursed to live as a polar bear. Features in the Icelandic fairy tale tradition where a maiden must break the curse through faithful love. Connected to broader Scandinavian beast-groom tales","id":"is-bjarnd-rak-ngur","ab":["저주"],"gf":["호러","다크 판타지","로맨스","미스터리"],"sh":["저주 해제","금단의 사랑"],"ip":false}]},{"c":"Faroe Islands","r":"Northern Europe","i":"FO","b":[{"n":"Nykur","t":"Water Horse","f":7,"d":"Grey horse with reversed hooves lurking by Faroese lakes. Lures children onto its back before plunging into deep water. Can be tamed if a bridle is thrown over its head while it sleeps","id":"fo-nykur","ab":["유혹"],"wk":["굴레"],"vk":["말 형상"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Huldufólk","t":"Hidden People","f":4,"d":"Faroese hidden folk dwelling inside grassy hillocks and sea cliffs. Beautiful but dangerous — their parties can be heard through the ground. Humans lured inside emerge decades later","id":"fo-hulduf-lk","ab":["불명"],"vk":["아름다운 외모"],"gf":["로맨스","미스터리","동화/판타지"],"ip":false},{"n":"Grýla","t":"Ogress","f":8,"d":"Faroese version of the Christmas ogress who comes from the mountains with a sack to collect misbehaving children. Parents use her name as a threat during the dark December nights","id":"fo-gr-la","ab":["불명"],"wk":["이름 부르기"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Draugur","t":"Revenant","f":8,"d":"Walking dead of Faroese tradition, often drowned sailors returned from the sea. Bring storms and bad weather. Appear dripping with seawater, knocking on doors of their former homes","id":"fo-draugur","ab":["폭풍 조종","기상 조종"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Niðagrísur","t":"Underground Pig","f":5,"d":"Treasure-guarding pig spirit dwelling beneath ancient Faroese ruins and burial sites. Rooting sounds heard underground signal hidden treasure. Disturbing it causes landslides and cave-ins","id":"fo-ni-agr-sur","ab":["불명"],"gf":["다크 판타지","미스터리"],"sh":["보물 탐색","수호 임무"],"ip":false},{"n":"Marbendill","t":"Sea Spirit","f":5,"d":"Wise prophetic sea creature of Faroese waters. Fishermen who catch one must release it quickly or face terrible storms. In exchange for freedom, it reveals the location of abundant fish schools","id":"fo-marbendill","ab":["폭풍 조종"],"gf":["다크 판타지"],"sh":["자유를 향한 탈출"],"ip":false}]},{"c":"Scotland","r":"Western Europe","i":"SCT","b":[{"n":"Nuckelavee","t":"Sea Demon","f":9,"d":"Skinless horse-rider sea demon that spreads plague and…","id":"sct-nuckelavee","ab":["역병"],"vk":["말 형상"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Each-uisge","t":"Water Horse","f":8,"d":"Shapeshifting water horse far deadlier than Kelpie,…","id":"sct-each-uisge","ab":["변신"],"vk":["말 형상"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Kelpie","t":"Water Horse","f":8,"d":"Shape-shifting water spirit appearing as a beautiful horse by lochs and rivers. Children who mount it find their hands stuck as it drags them underwater","id":"sct-kelpie","ab":["변신"],"gf":["호러","다크 판타지"],"ip":false}]},{"c":"Wales","r":"Western Europe","i":"WLS","b":[{"n":"Cŵn Annwn","t":"Phantom Hounds","f":8,"d":"Spectral hounds of the Otherworld whose howling…","id":"wls-c-n-annwn","ab":["불명"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Gwyllion","t":"Mountain Hag","f":5,"d":"Malevolent mountain spirits that waylay travelers in…","id":"wls-gwyllion","ab":["불명"],"gf":["다크 판타지"],"ip":false},{"n":"Addanc","t":"Lake Monster","f":7,"d":"Monstrous lake creature variously described as crocodile, beaver, or dwarf. Floods valleys and devours anyone who enters its waters. Slain by King Arthur in some legends","id":"wls-addanc","gf":["호러","다크 판타지"],"ip":false}]},{"c":"Romania","r":"Eastern Europe","i":"RO","b":[{"n":"Strigoi","t":"Vampire","f":9,"d":"Undead that rises from grave to drain life from family members","id":"ro-strigoi","ab":["흡수","흡혈"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Moroi","t":"Vampire","f":8,"d":"Living vampires born with a caul, drain life energy from neighbors","id":"ro-moroi","ab":["흡수","흡혈"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Pricolici","t":"Werewolf","f":8,"d":"Undead werewolf, a soul so evil it rises as wolf to attack the living","id":"ro-pricolici","ab":["불명"],"vk":["늑대 형상"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Iele","t":"Fairy","f":7,"d":"Enchanting fairy women who dance in moonlit clearings. Men who spy on their dance are struck with madness, blindness, or are danced to death","id":"ro-iele","ab":["광기 유발"],"gf":["호러","다크 판타지","로맨스"],"ip":false},{"id":"ro-balaur","n":"Balaur","t":"Dragon","f":9,"d":"Multi-headed Romanian dragon of immense power that guards treasures.","ln":"Balaur","ab":["다두","재생","화염"],"wk":["Făt-Frumos 영웅"],"vk":["multi-headed dragon","treasure"],"gf":["dark_fantasy","action"],"sh":["용을 물리치러 떠나는 마지막 영웅"],"ip":true}]},{"c":"Greece","r":"Southern Europe","i":"GR","b":[{"n":"Vrykolakas","t":"Undead","f":8,"d":"Restless dead who return bloated to knock on doors, killing those who answer","id":"gr-vrykolakas","ab":["불명"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Lamia","t":"Monster","f":7,"d":"Woman turned child-devouring serpent monster by the gods","id":"gr-lamia","ab":["포식"],"vk":["뱀 형상"],"gf":["호러","다크 판타지","영웅 서사"],"ip":false},{"n":"Empusa","t":"Demon","f":7,"d":"Shape-shifting seductress with one bronze leg and one donkey leg","id":"gr-empusa","ab":["변신"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Strigla","t":"Night Witch","f":7,"d":"Screech-owl woman that attacks infants at night drinking their blood. Modern Greek grandmothers still hang garlic and blue beads to ward her off","id":"gr-strigla","ab":["흡혈"],"gf":["호러","다크 판타지"],"ip":false},{"id":"gr-kallikantzaros","n":"Kallikantzaros","t":"Goblin","f":5,"d":"Christmas goblins emerging during twelve days of Christmas to cause chaos.","ln":"Καλλικάντζαρος","ab":["혼란 유발"],"wk":["세례 축일"],"vk":["dark goblin","chimney"],"gf":["comedy","horror"],"sh":["크리스마스마다 찾아오는 지하의 도깨비들"]}]},{"c":"Russia","r":"Eastern Europe","i":"RU","b":[{"n":"Baba Yaga","t":"Witch","f":8,"d":"Powerful witch living in a hut on chicken legs, flies in a giant mortar","id":"ru-baba-yaga","ab":["비행"],"vk":["거대한 체구"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Domovoi","t":"House Spirit","f":4,"d":"Household protector spirit that can turn malicious if disrespected","id":"ru-domovoi","ab":["불명"],"gf":["동화/판타지","영웅 서사"],"sh":["수호 임무"],"ip":false},{"n":"Vodyanoy","t":"Water Spirit","f":7,"d":"Bloated green water spirit that drowns swimmers and breaks dams","id":"ru-vodyanoy","ab":["익사 유발"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Rusalka","t":"Water Spirit","f":7,"d":"Spirit of a drowned maiden who lures young men into rivers with haunting songs and ethereal beauty. During Rusalka Week they leave the water to dance in forests","id":"ru-rusalka","ab":["유혹","익사 유발"],"gf":["호러","다크 판타지","로맨스"],"ip":false}]},{"c":"Poland","r":"Eastern Europe","i":"PL","b":[{"n":"Strzyga","t":"Vampire","f":9,"d":"Person born with two souls and two sets of teeth, rises as vampire after death","id":"pl-strzyga","ab":["흡혈"],"vk":["이빨"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Południca","t":"Field Spirit","f":7,"d":"Noon Witch who attacks farmers working during midday heat with madness","id":"pl-po-udnica","ab":["열기","광기 유발"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Utopiec","t":"Water Demon","f":7,"d":"Spirit of a drowned person that lurks in ponds and rivers pulling swimmers down. Recognized by green skin, webbed fingers, and glowing eyes at night","id":"pl-utopiec","ab":["익사 유발"],"gf":["호러","다크 판타지"],"ip":false}]},{"c":"Czech Republic","r":"Eastern Europe","i":"CZ","b":[{"n":"Polednice","t":"Noon Spirit","f":7,"d":"White lady of the fields who causes heatstroke and madness at noon","id":"cz-polednice","ab":["열기","포식","광기 유발"],"vk":["하얀"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Vodník","t":"Water Spirit","f":7,"d":"Green-skinned water goblin who stores drowned souls in teacups","id":"cz-vodn-k","ab":["불명"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Hastrman","t":"Water Man","f":7,"d":"Czech water goblin who collects souls of drowned people in porcelain cups with lids. Appears as a well-dressed gentleman dripping water, recognizable by his green coat","id":"cz-hastrman","gf":["호러","다크 판타지"],"ip":false}]},{"c":"Serbia","r":"Eastern Europe","i":"RS","b":[{"n":"Vampir","t":"Vampire","f":9,"d":"Original source of the word vampire, bloated corpse…","id":"rs-vampir","ab":["흡혈"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Drekavac","t":"Undead Child","f":8,"d":"Horrifying creature born from unbaptized dead…","id":"rs-drekavac","ab":["불명"],"gf":["호러","다크 판타지"],"sh":["비극적 탄생"],"ip":false},{"n":"Vila","t":"Storm Fairy","f":7,"d":"Fierce warrior fairy riding deer with serpent-reins through clouds. Protects forests and nature. If a man breaks a promise to a Vila, she strikes him with deadly illness","id":"rs-vila","gf":["다크 판타지","액션"],"ip":false}]},{"c":"Croatia","r":"Southern Europe","i":"HR","b":[{"n":"Mora","t":"Night Spirit","f":7,"d":"Spirit that sits on chest during sleep causing…","id":"hr-mora","ab":["불명"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Vukodlak","t":"Werewolf","f":7,"d":"Werewolf-vampire hybrid that can eclipse the moon by…","id":"hr-vukodlak","ab":["불명"],"vk":["늑대 형상"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Strigon","t":"Vampire","f":8,"d":"Istrian vampire that rises from its grave to terrorize its home village. Can be stopped only by driving a hawthorn stake through its heart at a crossroads","id":"hr-strigon","ab":["흡혈"],"gf":["호러","다크 판타지"],"ip":false}]},{"c":"Bulgaria","r":"Eastern Europe","i":"BG","b":[{"n":"Samodiva","t":"Forest Nymph","f":5,"d":"Beautiful but deadly woodland nymphs who dance men to…","id":"bg-samodiva","ab":["불명"],"vk":["아름다운 외모"],"gf":["다크 판타지","로맨스"],"ip":false},{"n":"Karakondzhul","t":"Night Demon","f":7,"d":"Hairy demon that rides people's backs through the night","id":"bg-karakondzhul","ab":["불명"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Talasum","t":"House Haunter","f":7,"d":"Restless spirit bound to houses where it died violently. Throws objects, causes fires, and torments inhabitants until proper funerary rites are performed","id":"bg-talasum","ab":["화염"],"gf":["호러","다크 판타지"],"ip":false}]},{"c":"Hungary","r":"Eastern Europe","i":"HU","b":[{"n":"Lidérc","t":"Demon","f":9,"d":"Shapeshifting incubus hatched from egg kept warm under armpit, drains life","id":"hu-lid-rc","ab":["변신","흡수"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Boszorkány","t":"Witch","f":7,"d":"Hungarian witch who can transform into animals and cause storms","id":"hu-boszork-ny","ab":["변신","폭풍 조종"],"gf":["호러","다크 판타지"],"sh":["인간이 되고 싶은 욕망"],"ip":false},{"n":"Táltos","t":"Shaman Hero","f":5,"d":"Born with teeth or extra fingers, the Táltos can enter trances and battle evil spirits in animal form. Hungarian shamanic tradition of fighting supernatural threats","id":"hu-taltos","ab":["변신"],"gf":["다크 판타지","영웅 서사"],"ip":false},{"id":"hu-csodaszarvas","n":"Csodaszarvas","t":"Mythical Beast","f":4,"d":"Miraculous stag with antlers of golden light that guided Magyar people.","ln":"Csodaszarvas","ab":["인도","빛의 뿔"],"wk":["불명"],"vk":["golden stag","forest path"],"gf":["romance_fantasy"],"sh":["빛나는 사슴을 따라간 민족의 대서사시"],"ip":true}]},{"c":"Italy","r":"Southern Europe","i":"IT","b":[{"n":"Strega","t":"Witch","f":7,"d":"Italian witch who can fly and transforms into animals at night","id":"it-strega","ab":["변신","비행"],"gf":["호러","다크 판타지"],"sh":["인간이 되고 싶은 욕망"],"ip":false},{"n":"Befana","t":"Witch/Spirit","f":2,"d":"Benevolent old woman who delivers gifts to children on Epiphany Eve","id":"it-befana","ab":["불명"],"gf":["동화/판타지"],"ip":false},{"n":"Strix","t":"Vampire Owl","f":7,"d":"Nocturnal bird-like creature from ancient Roman folklore that feeds on human blood and flesh of infants. Origin of the word strega (witch)","id":"it-strix","ab":["흡혈"],"gf":["호러","다크 판타지"],"ip":false},{"id":"it-orco","n":"Orco","t":"Ogre","f":7,"d":"Italian man-eating ogre. Origin of the English word ogre.","ln":"Orco","ab":["괴력","후각 추적"],"wk":["지혜"],"vk":["massive ogre","dark castle"],"gf":["dark_fantasy","action"],"sh":["아이들을 잡아먹는 성의 주인의 정체"]}]},{"c":"Spain","r":"Southern Europe","i":"ES","b":[{"n":"Duende","t":"Goblin","f":5,"d":"Small supernatural beings that inhabit houses and forests, cause mischief","id":"es-duende","ab":["불명"],"vk":["작은 체구"],"gf":["다크 판타지","코미디"],"ip":false},{"n":"Sacamantecas","t":"Boogeyman","f":8,"d":"Fat-extractor monster based on real serial killers, terrorizes children","id":"es-sacamantecas","ab":["불명"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Santa Compaña","t":"Ghost Procession","f":8,"d":"Spectral procession of the dead that walks through Galician villages at night carrying candles. Those who see it are doomed to join the march or die within the year","id":"es-santa-compana","gf":["호러","다크 판타지"],"ip":false}]},{"c":"Portugal","r":"Southern Europe","i":"PT","b":[{"n":"Bicho Papão","t":"Boogeyman","f":5,"d":"Shapeless monster that hides under beds and eats children who misbehave","id":"pt-bicho-pap-o","ab":["포식"],"gf":["다크 판타지"],"ip":false},{"n":"Bruxsa","t":"Vampire-Witch","f":7,"d":"Vampire-witch that transforms into a bird to feed on children's blood","id":"pt-bruxsa","ab":["변신","흡혈"],"vk":["피"],"gf":["호러","다크 판타지"],"sh":["인간이 되고 싶은 욕망"],"ip":false},{"n":"Lobisomem","t":"Werewolf","f":7,"d":"Portuguese werewolf — the seventh son of a family is cursed to transform on full moon nights. Roams the crossroads and must be wounded to break the cycle","id":"pt-lobisomem","ab":["변신"],"gf":["호러","다크 판타지"],"ip":false}]},{"c":"Ukraine","r":"Eastern Europe","i":"UA","b":[{"n":"Mavka","t":"Forest Spirit","f":5,"d":"Beautiful forest nymph with no back, lures men into…","id":"ua-mavka","ab":["유혹"],"vk":["아름다운 외모"],"gf":["다크 판타지","로맨스"],"ip":false},{"n":"Viy","t":"Demon King","f":9,"d":"Iron-lidded demon whose gaze kills; must have its…","id":"ua-viy","ab":["불명"],"wk":["철/쇠"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Domovyk","t":"House Spirit","f":4,"d":"Ukrainian household protector resembling a small old man covered in fur. Braids the manes of horses he likes and tangles those of horses he dislikes","id":"ua-domovyk","gf":["동화/판타지"],"ip":false}]},{"c":"Albania","r":"Southern Europe","i":"AL","b":[{"n":"Shtriga","t":"Vampire-Witch","f":8,"d":"Witch that sucks blood of infants at night then…","id":"al-shtriga","ab":["흡혈"],"vk":["피"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Bolla","t":"Dragon","f":7,"d":"Serpent dragon that sleeps all year, opens eyes on…","id":"al-bolla","ab":["불명"],"vk":["뱀 형상"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Lugat","t":"Vampire","f":7,"d":"Albanian undead that rises nightly to spread plague and terror. Relatively weak vampire that can be defeated by a Dhampir — half-human child of a Lugat","id":"al-lugat","ab":["역병"],"gf":["호러","다크 판타지"],"ip":false}]},{"c":"Lithuania","r":"Eastern Europe","i":"LT","b":[{"n":"Aitvaras","t":"House Spirit","f":5,"d":"Rooster-dragon that brings stolen wealth but demands…","id":"lt-aitvaras","ab":["불명"],"gf":["다크 판타지"],"ip":false},{"n":"Ragana","t":"Witch","f":7,"d":"Lithuanian witch associated with death, poison, and…","id":"lt-ragana","ab":["독"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Laumė","t":"Fairy Witch","f":7,"d":"Beautiful but dangerous fairy of Lithuanian mythology associated with spinning and weaving fate. Bathes in sacred springs and curses those who spy on her","id":"lt-laume","ab":["저주"],"gf":["다크 판타지","로맨스"],"ip":false}]},{"c":"Morocco","r":"North Africa","i":"MA","b":[{"n":"Aisha Qandisha","t":"Demon","f":9,"d":"Seductive she-demon with goat legs who possesses men near waterways","id":"ma-aisha-qandisha","ab":["빙의"],"gf":["호러","다크 판타지"],"sh":["빙의/퇴마"],"ip":false},{"n":"Jinn","t":"Spirit","f":7,"d":"Invisible spirits of Islamic tradition inhabiting ruins and crossroads","id":"ma-jinn","ab":["투명화"],"wk":["십자가"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Bou Darma","t":"Night Creature","f":7,"d":"Fearsome creature of Moroccan folklore that hunts children who stay out after dark. Described as a hairy humanoid with glowing eyes prowling rooftops","id":"ma-bou-darma","gf":["호러","다크 판타지"],"ip":false}]},{"c":"Tunisia","r":"North Africa","i":"TN","b":[{"n":"Ghoul","t":"Monster","f":7,"d":"Shape-shifting desert creature that lurks in…","id":"tn-ghoul","ab":["변신"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Omm El Khanafiss","t":"Hag","f":5,"d":"Beetle-mother monster used to frighten children into…","id":"tn-omm-el-khanafiss","ab":["불명"],"gf":["다크 판타지"],"ip":false}]},{"c":"Algeria","r":"North Africa","i":"DZ","b":[{"n":"Jinn","t":"Spirit","f":7,"d":"Desert spirits dwelling in abandoned places, capable…","id":"dz-jinn","ab":["불명"],"gf":["호러","다크 판타지"],"sh":["비극적 탄생"],"ip":false},{"n":"Tseriel","t":"Ogress","f":7,"d":"Berber ogress who kidnaps and eats children in…","id":"dz-tseriel","ab":["포식"],"gf":["호러","다크 판타지"],"ip":false}]},{"c":"Libya","r":"North Africa","i":"LY","b":[{"n":"Ghoul","t":"Monster","f":7,"d":"Shapeshifting desert creature found near oases and…","id":"ly-ghoul","ab":["변신"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Jinn","t":"Spirit","f":7,"d":"Elemental spirits of Saharan tradition, guardians of…","id":"ly-jinn","ab":["불명"],"gf":["호러","다크 판타지","영웅 서사"],"sh":["수호 임무"],"ip":false}]},{"c":"Nigeria","r":"West Africa","i":"NG","b":[{"n":"Abiku","t":"Spirit Child","f":8,"d":"Spirit that repeatedly possesses babies, causing them to die young","id":"ng-abiku","ab":["빙의"],"gf":["호러","다크 판타지"],"sh":["빙의/퇴마"],"ip":false},{"n":"Egbere","t":"Forest Spirit","f":5,"d":"Small spirits carrying mats who weep in the forest; their mat brings fortune","id":"ng-egbere","ab":["불명"],"vk":["작은 체구"],"gf":["다크 판타지"],"ip":false},{"n":"Bush Baby","t":"Forest Entity","f":8,"d":"Crying baby-like creature in the bush that leads rescuers to their doom","id":"ng-bush-baby","ab":["불명"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Mami Wata","t":"Water Goddess","f":7,"d":"Powerful mermaid-serpent spirit of wealth, beauty and danger. Seduces followers with riches but demands absolute fidelity. Worshipped across West Africa","id":"ng-mami-wata","ab":["유혹"],"gf":["다크 판타지","로맨스"],"ip":false}]},{"c":"Ghana","r":"West Africa","i":"GH","b":[{"n":"Adze","t":"Vampire","f":9,"d":"Firefly-form vampire of the Ewe people that preys on children","id":"gh-adze","ab":["비행","화염","흡혈"],"vk":["불꽃"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Sasabonsam","t":"Forest Vampire","f":9,"d":"Iron-toothed bat-winged being that dangles from trees to snatch prey","id":"gh-sasabonsam","ab":["흡혈"],"wk":["철/쇠"],"vk":["날개","박쥐 날개"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Asanbosam","t":"Forest Vampire","f":8,"d":"Iron-toothed ogre that hangs from trees using hook-like feet to snatch passing prey. Cousin of Sasabonsam but larger and more territorial","id":"gh-asanbosam","gf":["호러","다크 판타지"],"ip":false},{"id":"gh-anansi","n":"Anansi","t":"Trickster","f":3,"d":"Clever spider trickster who outwits larger creatures through cunning. Master storyteller.","ln":"Anansi","ab":["거미줄 조종","지혜"],"wk":["자만심"],"vk":["spider","web"],"gf":["comedy","drama"],"sh":["거미 신이 모든 이야기를 훔친 날"],"ip":true}]},{"c":"Senegal","r":"West Africa","i":"SN","b":[{"n":"Dëmm","t":"Soul Eater","f":8,"d":"Witch-like person who devours the spiritual essence of victims","id":"sn-d-mm","ab":["포식"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Jinne","t":"Spirit","f":5,"d":"Islamic-Wolof spirits of the bush that can help or harm humans","id":"sn-jinne","ab":["불명"],"gf":["다크 판타지"],"ip":false},{"n":"Yumboes","t":"Fairies","f":4,"d":"Two-foot-tall pearly-white fairy folk of Wolof tradition who live beneath hills. Dance in moonlight and feast lavishly, sometimes inviting human guests","id":"sn-yumboes","gf":["동화/판타지"],"ip":false}]},{"c":"Mali","r":"West Africa","i":"ML","b":[{"n":"Ninkinanka","t":"Dragon","f":8,"d":"West African dragon whose mere sight causes death","id":"ml-ninkinanka","ab":["불명"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Wokolo","t":"Serpent","f":7,"d":"Sacred serpent spirit of Bambara tradition, guardian…","id":"ml-wokolo","ab":["불명"],"vk":["뱀 형상"],"gf":["호러","다크 판타지","영웅 서사"],"sh":["수호 임무"],"ip":false},{"n":"Nommo","t":"Water Spirits","f":5,"d":"Ancestral spirits of Dogon mythology that descended from the star Sirius. Amphibious beings that taught humans agriculture and civilization","id":"ml-nommo","gf":["다크 판타지","영웅 서사"],"ip":false}]},{"c":"Ivory Coast","r":"West Africa","i":"CI","b":[{"n":"Gnamien","t":"Forest Spirit","f":5,"d":"Forest spirits of the Dan people that manifest through…","id":"ci-gnamien","ab":["불명"],"gf":["다크 판타지"],"ip":false},{"n":"Guéré Monster","t":"Entity","f":7,"d":"Towering masquerade entity embodying forest terror…","id":"ci-gu-r-monster","ab":["불명"],"gf":["호러","다크 판타지"],"ip":false}]},{"c":"Cameroon","r":"West Africa","i":"CM","b":[{"n":"Jengu","t":"Water Spirit","f":4,"d":"Beautiful mermaid-like water spirits of the Sawa that…","id":"cm-jengu","ab":["불명"],"vk":["아름다운 외모"],"gf":["로맨스","동화/판타지"],"ip":false},{"n":"Nyongo","t":"Zombie","f":8,"d":"Person enslaved after death through sorcery, forced to…","id":"cm-nyongo","ab":["불명"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Mboma","t":"Giant Snake","f":7,"d":"Enormous rainbow-colored python of Cameroonian rivers. So vast it blocks entire waterways. Its iridescent scales reflect sunlight creating rainbow illusions","id":"cm-mboma","gf":["호러","다크 판타지"],"ip":false}]},{"c":"Benin","r":"West Africa","i":"BJ","b":[{"n":"Tohossou","t":"Water Spirit","f":7,"d":"Powerful vodun spirits born as deformed children who…","id":"bj-tohossou","ab":["불명"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Aziza","t":"Forest Fairy","f":2,"d":"Benevolent tiny people of the forest who teach magic…","id":"bj-aziza","ab":["불명"],"vk":["작은 체구"],"gf":["동화/판타지"],"ip":false}]},{"c":"Togo","r":"West Africa","i":"TG","b":[{"n":"Adze","t":"Vampire","f":8,"d":"Ewe vampire that takes firefly form to enter homes and…","id":"tg-adze","ab":["비행","화염","흡혈"],"vk":["불꽃"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Mami Wata","t":"Water Spirit","f":5,"d":"Powerful mermaid spirit associated with wealth,…","id":"tg-mami-wata","ab":["불명"],"gf":["다크 판타지"],"ip":false}]},{"c":"Guinea","r":"West Africa","i":"GN","b":[{"n":"Ninkinanka","t":"Dragon","f":8,"d":"Massive serpent-dragon whose gaze or presence brings…","id":"gn-ninkinanka","ab":["불명"],"vk":["뱀 형상"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Konkoma","t":"Spirit","f":5,"d":"Spirits of the dead that roam in groups, dangerous to…","id":"gn-konkoma","ab":["불명"],"gf":["다크 판타지"],"ip":false}]},{"c":"Sierra Leone","r":"West Africa","i":"SL","b":[{"n":"Tingoi","t":"Forest Demon","f":7,"d":"Short powerful forest demons that steal food and…","id":"sl-tingoi","ab":["불명"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Bondo Devil","t":"Spirit","f":5,"d":"Masked spirit of women's secret society initiations","id":"sl-bondo-devil","ab":["불명"],"vk":["가면"],"gf":["다크 판타지","미스터리"],"sh":["예언/징조"],"ip":false}]},{"c":"Burkina Faso","r":"West Africa","i":"BF","b":[{"n":"Kinkirsi","t":"Nature Spirit","f":4,"d":"Small benevolent bush spirits that protect travelers…","id":"bf-kinkirsi","ab":["불명"],"vk":["작은 체구"],"gf":["동화/판타지","영웅 서사"],"sh":["수호 임무"],"ip":false},{"n":"Kontomblé","t":"Spirit","f":4,"d":"Tiny beings of the wild that communicate through…","id":"bf-kontombl","ab":["불명"],"vk":["작은 체구"],"gf":["동화/판타지"],"ip":false}]},{"c":"Ethiopia","r":"East Africa","i":"ET","b":[{"n":"Buda","t":"Evil Eye","f":7,"d":"Blacksmith-sorcerer who can transform into hyena and curse with evil eye","id":"et-buda","ab":["변신","저주"],"gf":["호러","다크 판타지","미스터리"],"sh":["저주 해제","인간이 되고 싶은 욕망"],"ip":false},{"n":"Zar","t":"Possessing Spirit","f":7,"d":"Powerful spirits that possess people, especially women, demanding appeasement","id":"et-zar","ab":["빙의"],"gf":["호러","다크 판타지"],"sh":["빙의/퇴마","예언/징조"],"ip":false},{"n":"Werekal","t":"Hyena Man","f":7,"d":"Blacksmith-caste sorcerer who transforms into a hyena at night to rob graves and attack livestock. Deeply feared in rural Ethiopian communities","id":"et-werekal","ab":["변신"],"gf":["호러","다크 판타지"],"ip":false}]},{"c":"Kenya","r":"East Africa","i":"KE","b":[{"n":"Chemosit","t":"Beast","f":8,"d":"Half-man half-beast brain-eater of the Nandi people, lurks at night","id":"ke-chemosit","ab":["불명"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Mombasa Ghost","t":"Ghost","f":5,"d":"Coastal spirits connected to old Swahili trading routes and ruins","id":"ke-mombasa-ghost","ab":["불명"],"gf":["다크 판타지"],"ip":false},{"n":"Nandi Bear","t":"Cryptid","f":7,"d":"Fierce creature of Nandi folklore described as larger than a bear with a sloping back. Attacks at night targeting the skull. Possibly based on extinct giant hyena","id":"ke-nandi-bear","gf":["호러","다크 판타지"],"ip":false}]},{"c":"Tanzania","r":"East Africa","i":"TZ","b":[{"n":"Popobawa","t":"Shapeshifter","f":8,"d":"Bat-winged cyclops that attacks sleepers in Zanzibar, causes mass panic","id":"tz-popobawa","ab":["변신"],"vk":["날개","박쥐 날개"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Mzimu","t":"Ancestor Spirit","f":5,"d":"Spirits of ancestors that protect or punish based on family conduct","id":"tz-mzimu","ab":["불명"],"gf":["다크 판타지","영웅 서사"],"sh":["수호 임무"],"ip":false},{"n":"Shetani","t":"Evil Spirit","f":7,"d":"Malevolent spirits in Swahili folklore that cause disease, madness and misfortune. Can possess humans and must be exorcised by traditional healers","id":"tz-shetani","ab":["빙의"],"gf":["호러","다크 판타지"],"ip":false}]},{"c":"Uganda","r":"East Africa","i":"UG","b":[{"n":"Emandwa","t":"Ancestral Spirit","f":5,"d":"Family guardian spirits worshipped through shrines in…","id":"ug-emandwa","ab":["불명"],"gf":["다크 판타지","영웅 서사"],"sh":["수호 임무"],"ip":false},{"n":"Night Dancer","t":"Witch","f":7,"d":"Sorcerers who dance naked at night at crossroads…","id":"ug-night-dancer","ab":["불명"],"wk":["십자가"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Abazimu","t":"Ancestor Ghosts","f":7,"d":"Spirits of deceased ancestors that return to demand proper rituals. If neglected they cause illness in the family. Appeased through elaborate shrine ceremonies","id":"ug-abazimu","gf":["다크 판타지"],"ip":false}]},{"c":"Rwanda","r":"East Africa","i":"RW","b":[{"n":"Inyambo","t":"Sacred Spirit","f":4,"d":"Sacred long-horned cattle spirits associated with…","id":"rw-inyambo","ab":["불명"],"vk":["뿔"],"gf":["동화/판타지","영웅 서사"],"ip":false},{"n":"Nyirabiyoro","t":"Spirit","f":5,"d":"Lake spirit associated with fertility and protection…","id":"rw-nyirabiyoro","ab":["불명"],"gf":["다크 판타지","영웅 서사"],"sh":["수호 임무"],"ip":false},{"n":"Ikimanuka","t":"Forest Demon","f":7,"d":"Terrifying forest entity that disguises itself as a beautiful person to lure victims deep into the jungle. Reveals its monstrous true form only when escape is impossible","id":"rw-ikimanuka","ab":["변신","유혹"],"gf":["호러","다크 판타지"],"ip":false}]},{"c":"Madagascar","r":"East Africa","i":"MG","b":[{"n":"Kinoly","t":"Zombie","f":8,"d":"Reanimated corpse created through sorcery to do a…","id":"mg-kinoly","ab":["불명"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Kalanoro","t":"Forest Dwarf","f":5,"d":"Small wild people with long fingernails living in…","id":"mg-kalanoro","ab":["불명"],"vk":["작은 체구"],"gf":["다크 판타지"],"ip":false},{"n":"Fanany","t":"Lake Serpent","f":7,"d":"Colossal water serpent dwelling in deep lakes of central Madagascar. Rising waters are attributed to its stirring. Sacrifices are made to keep it dormant","id":"mg-fanany","gf":["호러","다크 판타지"],"ip":false}]},{"c":"Mozambique","r":"East Africa","i":"MZ","b":[{"n":"Ndimu","t":"Ancestor Spirit","f":5,"d":"Powerful ancestral spirits channeled through…","id":"mz-ndimu","ab":["불명"],"gf":["다크 판타지"],"ip":false},{"n":"Chipfalamfula","t":"Water Monster","f":7,"d":"River serpent that capsizes boats and drags people…","id":"mz-chipfalamfula","ab":["불명"],"vk":["뱀 형상"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Mulukulu","t":"River Spirit","f":5,"d":"Giant river spirit of Mozambican folklore inhabiting the Zambezi. Protects certain stretches of river and rewards fishermen who show proper respect","id":"mz-mulukulu","gf":["다크 판타지","영웅 서사"],"ip":false}]},{"c":"South Africa","r":"Southern Africa","i":"ZA","b":[{"n":"Tokoloshe","t":"Imp","f":8,"d":"Small malicious water sprite summoned by witches to cause harm, invisible","id":"za-tokoloshe","ab":["투명화"],"vk":["작은 체구"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Impundulu","t":"Vampire Bird","f":9,"d":"Lightning bird that takes human form to drain blood of its master's enemies","id":"za-impundulu","ab":["흡수","흡혈"],"vk":["피"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Mamlambo","t":"River Monster","f":9,"d":"Giant brain-eating river goddess of Zulu legend","id":"za-mamlambo","ab":["불명"],"vk":["거대한 체구"],"gf":["호러","다크 판타지","영웅 서사"],"ip":false},{"n":"Grootslang","t":"Primordial Beast","f":9,"d":"Elephant-snake hybrid of immense intelligence guarding diamond caves in Richtersveld. So powerful the gods had to split it into elephants and snakes","id":"za-grootslang","gf":["호러","다크 판타지","영웅 서사"],"ip":false}]},{"c":"Zimbabwe","r":"Southern Africa","i":"ZW","b":[{"n":"Nyami Nyami","t":"River God","f":8,"d":"Snake-like Zambezi river god that punishes those who disturb sacred waters","id":"zw-nyami-nyami","ab":["불명"],"vk":["뱀 형상"],"gf":["호러","다크 판타지","영웅 서사"],"ip":false},{"n":"Tokoloshe","t":"Imp","f":7,"d":"Invisible malicious sprite summoned through dark magic to torment enemies","id":"zw-tokoloshe","ab":["투명화"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Chipfalamfula","t":"River Monster","f":7,"d":"River serpent of Shona folklore that capsizes boats and creates deadly whirlpools. Must be appeased with offerings of grain and beer","id":"zw-chipfalamfula","gf":["호러","다크 판타지"],"ip":false}]},{"c":"Botswana","r":"Southern Africa","i":"BW","b":[{"n":"Kgwanyape","t":"Water Monster","f":7,"d":"Legendary water serpent of the Okavango that creates…","id":"bw-kgwanyape","ab":["불명"],"vk":["뱀 형상"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Tokoloshe","t":"Imp","f":7,"d":"Troublesome invisible being summoned by jealous people…","id":"bw-tokoloshe","ab":["투명화"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Lightning Bird","t":"Thunder Spirit","f":8,"d":"Supernatural bird that summons lightning wherever it lands. Strikes of lightning are believed to be the bird attacking from above. Feared across southern Africa","id":"bw-lightning-bird","ab":["번개 조종"],"gf":["호러","다크 판타지"],"ip":false}]},{"c":"Namibia","r":"Southern Africa","i":"NA","b":[{"n":"Hai-uri","t":"Monster","f":7,"d":"One-legged, one-armed being that leaps with incredible…","id":"na-hai-uri","ab":["불명"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Ga-gorib","t":"Demon","f":9,"d":"Monster sitting on cliff edges who dares passersby to…","id":"na-ga-gorib","ab":["불명"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Grootslang","t":"Serpent Beast","f":8,"d":"Namibian version of the elephant-snake hybrid lurking in deep cave systems of the Richtersveld region bordering South Africa. Hoards precious gems","id":"na-grootslang","gf":["호러","다크 판타지"],"ip":false}]},{"c":"Congo (DRC)","r":"Central Africa","i":"CD","b":[{"n":"Mokele-Mbembe","t":"Cryptid","f":7,"d":"Living dinosaur-like creature said to inhabit the…","id":"cd-mokele-mbembe","ab":["불명"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Eloko","t":"Forest Spirit","f":9,"d":"Dwarf-like beings covered in grass who use bells to…","id":"cd-eloko","ab":["불명"],"vk":["작은 체구"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Kongamato","t":"Flying Reptile","f":7,"d":"Pterosaur-like flying creature of the Congo swamps with leathery wings and sharp beak. Capsizes canoes and attacks fishermen. Name means 'breaker of boats'","id":"cd-kongamato","ab":["비행"],"gf":["호러","다크 판타지"],"ip":false}]},{"c":"Angola","r":"Southern Africa","i":"AO","b":[{"n":"Kishi","t":"Two-Faced Demon","f":9,"d":"Handsome man with hyena face on back of head who…","id":"ao-kishi","ab":["불명"],"vk":["잘생긴 외모"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Kianda","t":"Water Spirit","f":5,"d":"Mermaid spirit of the sea that grants wishes but…","id":"ao-kianda","ab":["불명"],"gf":["다크 판타지"],"ip":false},{"n":"Kianda","t":"Sea Spirit","f":5,"d":"Mermaid spirit of Angolan coastal waters who grants wishes to those who honor the sea. Angered by pollution and disrespect, sending storms in retribution","id":"ao-kianda-v2","gf":["다크 판타지","영웅 서사"],"ip":false}]},{"c":"Sudan","r":"East Africa","i":"SD","b":[{"n":"Zar","t":"Possessing Spirit","f":7,"d":"Spirits that possess humans demanding elaborate…","id":"sd-zar","ab":["빙의"],"gf":["호러","다크 판타지"],"sh":["빙의/퇴마"],"ip":false},{"n":"Banat al-Shaykh","t":"Jinn","f":5,"d":"Female jinn associated with water sources and sacred…","id":"sd-banat-al-shaykh","ab":["불명"],"gf":["다크 판타지","영웅 서사"],"ip":false},{"n":"Jinn","t":"Desert Spirit","f":7,"d":"Powerful desert jinn of Sudanese folk tradition dwelling in dust devils and abandoned places. Known to possess individuals during trance ceremonies","id":"sd-jinn-v2","ab":["빙의"],"gf":["호러","다크 판타지"],"ip":false}]},{"c":"Zambia","r":"Southern Africa","i":"ZM","b":[{"n":"Ichitunta","t":"Monster","f":7,"d":"Giant creature that blocks rivers and paths, demanding…","id":"zm-ichitunta","ab":["불명"],"vk":["거대한 체구"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Mulombe","t":"Nature Spirit","f":4,"d":"Bush spirits that guard sacred groves and natural…","id":"zm-mulombe","ab":["불명"],"gf":["동화/판타지","영웅 서사"],"sh":["수호 임무"],"ip":false},{"n":"Kongamato","t":"Flying Reptile","f":7,"d":"Zambian variant of the pterosaur-like swamp creature. Local fishermen carry charms against it. Described with four to seven foot wingspan and reddish skin","id":"zm-kongamato","ab":["비행"],"gf":["호러","다크 판타지"],"ip":false}]},{"c":"United States","r":"North America","i":"US","b":[{"n":"Wendigo","t":"Cannibal Spirit","f":9,"d":"Algonquian spirit of insatiable hunger and cannibalism, grows with each meal","id":"us-wendigo","ab":["성장/변형"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Skinwalker","t":"Shapeshifter","f":9,"d":"Navajo witch that transforms into animals, extreme taboo to discuss","id":"us-skinwalker","ab":["변신"],"gf":["호러","다크 판타지"],"sh":["인간이 되고 싶은 욕망"],"ip":false},{"n":"Mothman","t":"Cryptid","f":7,"d":"Winged humanoid with red eyes, sighted before disasters in Point Pleasant","id":"us-mothman","ab":["불명"],"vk":["붉은 눈","날개"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Jersey Devil","t":"Cryptid","f":5,"d":"Kangaroo-like winged creature of the Pine Barrens, born as 13th child","id":"us-jersey-devil","ab":["불명"],"vk":["날개"],"gf":["다크 판타지"],"ip":false},{"n":"Thunderbird","t":"Divine Beast","f":7,"d":"Enormous bird of Native American mythology whose wingbeats create thunder and whose eyes flash lightning. Sacred protector of the natural world","id":"us-thunderbird","gf":["다크 판타지","영웅 서사"],"ip":false}]},{"c":"Canada","r":"North America","i":"CA","b":[{"n":"Wendigo","t":"Cannibal Spirit","f":9,"d":"Gaunt cannibalistic ice spirit of Algonquian peoples","id":"ca-wendigo","ab":["불명"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Ogopogo","t":"Lake Monster","f":5,"d":"Serpentine lake creature of Okanagan Lake in British Columbia","id":"ca-ogopogo","ab":["불명"],"vk":["뱀 형상"],"gf":["다크 판타지"],"ip":false},{"n":"Tah-tah-kle-ah","t":"Owl Woman","f":7,"d":"Giant owl woman of Pacific Northwest who kidnaps bad children","id":"ca-tah-tah-kle-ah","ab":["불명"],"vk":["거대한 체구"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Waheela","t":"Giant Wolf","f":7,"d":"Bear-sized white wolf cryptid of Northwest Territories that hunts in packs of two or three. Indigenous legend of the Nahanni Valley warns travelers of headless corpses","id":"ca-waheela","gf":["호러","다크 판타지"],"ip":false}]},{"c":"Mexico","r":"North America","i":"MX","b":[{"n":"La Llorona","t":"Ghost","f":9,"d":"Weeping woman ghost who drowned her children and roams waterways searching","id":"mx-la-llorona","ab":["불명"],"gf":["호러","다크 판타지"],"sh":["잃어버린 것 찾기"],"ip":false},{"n":"Nahual","t":"Shapeshifter","f":7,"d":"Sorcerer who can transform into animal form, often a jaguar or coyote","id":"mx-nahual","ab":["변신"],"gf":["호러","다크 판타지"],"sh":["인간이 되고 싶은 욕망"],"ip":false},{"n":"Chupacabra","t":"Cryptid","f":5,"d":"Blood-sucking creature that attacks livestock, reptilian or canid form","id":"mx-chupacabra","ab":["불명"],"vk":["피"],"gf":["다크 판타지"],"ip":false},{"n":"Ahuizotl","t":"Water Beast","f":8,"d":"Spiky water dog with a hand at the end of its tail, from Aztec mythology. Drags victims to watery graves, takes their eyes, teeth and nails. Sacred to Tlaloc","id":"mx-ahuizotl","gf":["호러","다크 판타지"],"ip":false}]},{"c":"Guatemala","r":"Central America","i":"GT","b":[{"n":"La Llorona","t":"Ghost","f":8,"d":"Crying spirit near rivers who seeks to replace her…","id":"gt-la-llorona","ab":["불명"],"gf":["호러","다크 판타지"],"ip":false},{"n":"El Cadejo","t":"Phantom Dog","f":7,"d":"Twin spirit dogs—white protects drunks, black one…","id":"gt-el-cadejo","ab":["불명"],"wk":["개"],"vk":["하얀"],"gf":["호러","다크 판타지","영웅 서사"],"sh":["수호 임무"],"ip":false},{"n":"Sombrerón","t":"Trickster","f":5,"d":"Short man in big black hat and boots who serenades young women with his silver guitar. Braids the manes of horses and the hair of women he fancies","id":"gt-sombreron","gf":["다크 판타지","로맨스"],"ip":false}]},{"c":"Honduras","r":"Central America","i":"HN","b":[{"n":"La Sucia","t":"Ghost","f":7,"d":"Beautiful ghost woman who lures unfaithful men to…","id":"hn-la-sucia","ab":["유혹"],"vk":["아름다운 외모"],"gf":["호러","다크 판타지","로맨스"],"ip":false},{"n":"El Cadejo","t":"Phantom Dog","f":7,"d":"Protective white dog and demonic black dog that battle…","id":"hn-el-cadejo","ab":["불명"],"wk":["개"],"vk":["하얀"],"gf":["호러","다크 판타지","액션","영웅 서사"],"sh":["수호 임무"],"ip":false},{"n":"Sisimite","t":"Forest Giant","f":7,"d":"Enormous hairy ape-like creature of Honduran forests with backward feet. Kidnaps humans and is supernaturally strong. Can only be killed by wounding its navel","id":"hn-sisimite","gf":["호러","다크 판타지"],"ip":false}]},{"c":"El Salvador","r":"Central America","i":"SV","b":[{"n":"El Cipitío","t":"Trickster","f":4,"d":"Pot-bellied boy spirit with backward feet who flirts…","id":"sv-el-cipit-o","ab":["불명"],"gf":["동화/판타지"],"ip":false},{"n":"La Descarnada","t":"Ghost","f":8,"d":"Skeletal woman appearing beautiful from afar, reveals…","id":"sv-la-descarnada","ab":["불명"],"vk":["아름다운 외모"],"gf":["호러","다크 판타지","로맨스"],"ip":false},{"n":"Siguanaba","t":"Shape-shifting Spirit","f":8,"d":"Spirit cursed by god Tlaloc appearing as a beautiful long-haired woman by rivers. When men approach she turns to reveal a horse skull face or rotting corpse","id":"sv-siguanaba","ab":["변신"],"gf":["호러","다크 판타지"],"ip":false}]},{"c":"Costa Rica","r":"Central America","i":"CR","b":[{"n":"La Segua","t":"Shapeshifter","f":7,"d":"Beautiful woman who transforms into horse-faced horror…","id":"cr-la-segua","ab":["변신"],"vk":["말 형상","아름다운 외모"],"gf":["호러","다크 판타지","로맨스"],"sh":["인간이 되고 싶은 욕망"],"ip":false},{"n":"El Cadejos","t":"Phantom Dog","f":5,"d":"Black and white spirit dogs that appear on lonely…","id":"cr-el-cadejos","ab":["불명"],"wk":["개"],"vk":["하얀"],"gf":["다크 판타지"],"ip":false},{"n":"Cegua","t":"Horse-Face Witch","f":7,"d":"Appears as a beautiful woman to unfaithful men walking home late. When they get close, she reveals a horse skull face with burning eyes and a blood-curdling scream","id":"cr-cegua","ab":["변신"],"gf":["호러","다크 판타지"],"ip":false}]},{"c":"Panama","r":"Central America","i":"PA","b":[{"n":"Tulivieja","t":"Ghost","f":7,"d":"Cursed woman with holes in her face who searches…","id":"pa-tulivieja","ab":["저주"],"gf":["호러","다크 판타지","미스터리"],"sh":["저주 해제","잃어버린 것 찾기"],"ip":false},{"n":"Chivato","t":"Demon","f":5,"d":"Goat-like demon of Panamanian forests that stalks lone…","id":"pa-chivato","ab":["불명"],"gf":["다크 판타지"],"ip":false},{"n":"Tepesa","t":"Shape-shifting Witch","f":7,"d":"Witch that transforms into a large black bird at night to fly over villages. Her shadow causes nightmares. Can be stopped by scattering mustard seeds she must count","id":"pa-tepesa","ab":["변신","비행"],"gf":["호러","다크 판타지"],"ip":false}]},{"c":"Cuba","r":"Caribbean","i":"CU","b":[{"n":"Güije","t":"Water Imp","f":5,"d":"Small dark-skinned trickster of rivers and pools, drowns swimmers","id":"cu-g-ije","ab":["익사 유발"],"vk":["작은 체구"],"gf":["다크 판타지","코미디"],"ip":false},{"n":"La Madre de Aguas","t":"Water Dragon","f":7,"d":"Giant serpent mother of all waters dwelling in deep river pools","id":"cu-la-madre-de-aguas","ab":["불명"],"vk":["뱀 형상","거대한 체구"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Ciguapa","t":"Mountain Nymph","f":5,"d":"Beautiful dark-haired woman with backward-facing feet dwelling in Cuban mountains. Lures men with enchanting beauty and haunting song but cannot be tracked","id":"cu-ciguapa","gf":["다크 판타지","로맨스"],"ip":false}]},{"c":"Haiti","r":"Caribbean","i":"HT","b":[{"n":"Zombie","t":"Undead","f":9,"d":"Dead person revived through vodou sorcery to serve as mindless slave","id":"ht-zombie","ab":["불명"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Loup-Garou","t":"Werewolf","f":9,"d":"Vodou werewolf-witch that sheds skin at night to fly and drink blood","id":"ht-loup-garou","ab":["비행"],"vk":["피","늑대 형상"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Soucouyant","t":"Vampire","f":8,"d":"Old woman who sheds skin and becomes fireball to suck blood","id":"ht-soucouyant","ab":["화염","흡혈"],"vk":["피","불꽃"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Tonton Macoute","t":"Boogeyman","f":7,"d":"Haitian boogeyman who stuffs naughty children into his straw bag. Uncle Gunnysack walks the streets at night with his burlap sack over his shoulder","id":"ht-tonton-macoute","gf":["호러","다크 판타지"],"ip":false}]},{"c":"Jamaica","r":"Caribbean","i":"JM","b":[{"n":"Rolling Calf","t":"Demon","f":7,"d":"Chain-dragging bull demon with fiery eyes that blocks…","id":"jm-rolling-calf","ab":["불명"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Ol' Higue","t":"Vampire","f":7,"d":"Old woman who sheds skin at night and sucks breath of…","id":"jm-ol-higue","ab":["흡혈"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Duppy","t":"Spirit","f":7,"d":"Restless spirit of the dead that can be summoned by obeah practitioners to do harm. Three-legged horses, headless entities, and shadow figures are common duppy forms","id":"jm-duppy","gf":["호러","다크 판타지"],"ip":false}]},{"c":"Dominican Republic","r":"Caribbean","i":"DO","b":[{"n":"Ciguapa","t":"Forest Nymph","f":5,"d":"Beautiful blue-skinned woman with backward feet who…","id":"do-ciguapa","ab":["불명"],"vk":["아름다운 외모"],"gf":["다크 판타지","로맨스"],"ip":false},{"n":"Galipote","t":"Shapeshifter","f":7,"d":"Sorcerer who transforms into animals, especially dogs,…","id":"do-galipote","ab":["변신"],"wk":["개"],"gf":["호러","다크 판타지"],"sh":["인간이 되고 싶은 욕망"],"ip":false},{"n":"Bacá","t":"Demon Servant","f":7,"d":"Demonic entity summoned through dark pact to bring wealth to its master. Takes the form of a black dog, cat or bull. In return, it eventually claims the summoner's family","id":"do-baca","gf":["호러","다크 판타지"],"ip":false},{"id":"do-la-ciguapa","n":"La Ciguapa","t":"Enchantress","f":6,"d":"Beautiful woman with backwards feet living in mountains. Enchants men.","ln":"La Ciguapa","ab":["매혹","역방향 발자국"],"wk":["보름달 추적"],"vk":["backward feet","mountain"],"gf":["romance_fantasy","mystery"],"sh":["뒤로 걷는 발자국을 추적하면 만나는 존재"]}]},{"c":"Trinidad and Tobago","r":"Caribbean","i":"TT","b":[{"n":"Soucouyant","t":"Vampire","f":8,"d":"Skin-shedding old woman who becomes ball of fire to…","id":"tt-soucouyant","ab":["화염","흡혈"],"wk":["불"],"vk":["불꽃"],"gf":["호러","다크 판타지"],"ip":false},{"n":"La Diablesse","t":"Demon","f":7,"d":"Devil woman with one cloven hoof hidden under long…","id":"tt-la-diablesse","ab":["불명"],"gf":["호러","다크 판타지","로맨스","미스터리"],"sh":["금단의 사랑"],"ip":false},{"n":"Douen","t":"Child Ghost","f":7,"d":"Spirits of unbaptized children with featureless faces and backward-facing feet. They roam forests calling the names of living children, luring them into the wilderness","id":"tt-douen","gf":["호러","다크 판타지"],"ip":false}]},{"c":"Puerto Rico","r":"Caribbean","i":"PR","b":[{"n":"Chupacabra","t":"Cryptid","f":7,"d":"Spiny reptilian creature that drains goats and…","id":"pr-chupacabra","ab":["흡수"],"gf":["호러","다크 판타지"],"ip":false},{"n":"El Garitón","t":"Giant","f":5,"d":"Massive guardian entity seen at old Spanish forts…","id":"pr-el-garit-n","ab":["불명"],"gf":["다크 판타지","영웅 서사"],"sh":["수호 임무"],"ip":false},{"n":"Gargoyle","t":"Winged Beast","f":7,"d":"Winged humanoid creature sighted across Puerto Rico since 2000s. Distinguished from chupacabra by bat-like wings and bipedal stance. Attacks livestock and pets","id":"pr-gargoyle","ab":["비행"],"gf":["호러","다크 판타지"],"ip":false}]},{"c":"Nicaragua","r":"Central America","i":"NI","b":[{"n":"La Mocuana","t":"Ghost","f":7,"d":"Indigenous princess turned vengeful spirit who lures…","id":"ni-la-mocuana","ab":["유혹"],"gf":["호러","다크 판타지"],"sh":["복수"],"ip":false},{"n":"El Cadejo","t":"Phantom Dog","f":5,"d":"Protective spirit dog that guards night travelers from…","id":"ni-el-cadejo","ab":["불명"],"wk":["개"],"gf":["다크 판타지","영웅 서사"],"sh":["수호 임무"],"ip":false},{"n":"Chancha Bruja","t":"Pig Witch","f":7,"d":"Witch that transforms into a giant pig to run through streets at night. Her hoofbeats echo through the town. Crushing anyone in her path. Returns human by dawn","id":"ni-chancha-bruja","ab":["변신"],"gf":["호러","다크 판타지"],"ip":false}]},{"c":"Brazil","r":"South America","i":"BR","b":[{"n":"Corpo Seco","t":"Undead","f":7,"d":"Undead so evil even the earth and devil rejected it, wanders forever","id":"br-corpo-seco","ab":["불명"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Curupira","t":"Forest Guardian","f":5,"d":"Red-haired protector of forests with backward feet who confuses hunters","id":"br-curupira","ab":["불명"],"gf":["다크 판타지","액션","영웅 서사"],"sh":["수호 임무"],"ip":false},{"n":"Boto","t":"Shapeshifter","f":5,"d":"Pink river dolphin that transforms into handsome man to seduce women","id":"br-boto","ab":["변신","유혹"],"vk":["잘생긴 외모"],"gf":["다크 판타지","로맨스"],"sh":["예언/징조","인간이 되고 싶은 욕망"],"ip":false},{"n":"Mapinguari","t":"Giant Sloth","f":7,"d":"One-eyed giant ground sloth creature of the Amazon with a mouth in its belly. Its terrible stench incapacitates prey. Possibly based on Megatherium folk memory","id":"br-mapinguari","gf":["호러","다크 판타지"],"ip":false}]},{"c":"Argentina","r":"South America","i":"AR","b":[{"n":"Lobizón","t":"Werewolf","f":7,"d":"Seventh son transforms into werewolf on Friday nights under full moon","id":"ar-lobiz-n","ab":["변신"],"vk":["늑대 형상"],"gf":["호러","다크 판타지"],"sh":["인간이 되고 싶은 욕망"],"ip":false},{"n":"Luz Mala","t":"Ghost Light","f":5,"d":"Evil lights floating over pampas marking locations of cursed treasure","id":"ar-luz-mala","ab":["저주"],"gf":["다크 판타지","미스터리"],"sh":["저주 해제","보물 탐색"],"ip":false},{"n":"Pombero","t":"Forest Goblin","f":5,"d":"Hairy nocturnal goblin that steals children and impregnates women","id":"ar-pombero","ab":["불명"],"gf":["다크 판타지"],"sh":["예언/징조"],"ip":false},{"n":"Nahuelito","t":"Lake Monster","f":5,"d":"Plesiosaur-like creature dwelling in Nahuel Huapi Lake in Patagonia. Argentina's Loch Ness Monster, with sightings dating back to indigenous Mapuche legends","id":"ar-nahuelito","gf":["다크 판타지"],"ip":false}]},{"c":"Colombia","r":"South America","i":"CO","b":[{"n":"La Patasola","t":"Monster","f":9,"d":"One-legged vampire woman of the jungle who seduces men then devours them","id":"co-la-patasola","ab":["유혹","포식"],"gf":["호러","다크 판타지","로맨스"],"ip":false},{"n":"El Mohán","t":"Water Spirit","f":5,"d":"Hairy wild man of rivers who capsizes boats and steals fish and women","id":"co-el-moh-n","ab":["불명"],"gf":["다크 판타지"],"sh":["예언/징조"],"ip":false},{"n":"Madremonte","t":"Forest Goddess","f":7,"d":"Fearsome jungle protector who appears as a woman covered in moss and vines. Sends storms and floods to punish deforesters and those who disrespect nature","id":"co-madremonte","ab":["폭풍 조종"],"gf":["다크 판타지","영웅 서사"],"ip":false}]},{"c":"Peru","r":"South America","i":"PE","b":[{"n":"Pishtaco","t":"Vampire","f":9,"d":"Fat-extracting boogeyman, often depicted as pale outsider who harvests human fat","id":"pe-pishtaco","ab":["흡혈"],"vk":["창백한 피부"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Jarjacha","t":"Cursed Being","f":7,"d":"Two-headed llama creature born from incestuous relationships","id":"pe-jarjacha","ab":["불명"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Ñakaq","t":"Fat Stealer","f":7,"d":"Pale-skinned entity that extracts fat from sleeping victims using a special knife. Victims waste away and die. Connected to colonial trauma and fears of exploitation","id":"pe-nakaq","gf":["호러","다크 판타지"],"ip":false},{"id":"pe-yacumama","n":"Yacumama","t":"Water Serpent","f":8,"d":"Mother of all waters. 160-foot horned serpent ruling Amazon rivers.","ln":"Yacumama","ab":["거대 몸체","수중 지배"],"wk":["뿔피리 소리"],"vk":["horned serpent","Amazon"],"gf":["action","dark_fantasy"],"sh":["아마존의 어머니 뱀에게 뿔피리로 경고하라"],"ip":true}]},{"c":"Chile","r":"South America","i":"CL","b":[{"n":"Trauco","t":"Forest Goblin","f":7,"d":"Ugly forest dwarf with hypnotic power over women,…","id":"cl-trauco","ab":["불명"],"vk":["작은 체구","흉측한 외모"],"gf":["호러","다크 판타지"],"sh":["예언/징조"],"ip":false},{"n":"Invunche","t":"Guardian Monster","f":9,"d":"Deformed human guardian of witch caves, body twisted…","id":"cl-invunche","ab":["불명"],"gf":["호러","다크 판타지","영웅 서사"],"sh":["수호 임무"],"ip":false},{"n":"Caleuche","t":"Ghost Ship","f":7,"d":"Luminous ghost ship crewed by the drowned, sails…","id":"cl-caleuche","ab":["불명"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Pincoya","t":"Sea Spirit","f":4,"d":"Beautiful sea goddess of Chiloé who dances on beaches. If she faces the sea, fish will be abundant; if she faces land, the fishing will be poor","id":"cl-pincoya","gf":["동화/판타지","로맨스"],"ip":false}]},{"c":"Venezuela","r":"South America","i":"VE","b":[{"n":"Sayona","t":"Ghost","f":8,"d":"Vengeful female spirit who appears to unfaithful men…","id":"ve-sayona","ab":["불명"],"gf":["호러","다크 판타지"],"sh":["복수"],"ip":false},{"n":"El Silbón","t":"Ghost","f":9,"d":"Whistling ghost carrying bag of father's bones, his…","id":"ve-el-silb-n","ab":["불명"],"vk":["뼈"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Sayona","t":"Vengeful Ghost","f":8,"d":"Beautiful ghost of a woman who killed her mother out of jealous rage. Cursed to eternally hunt unfaithful men, appearing as a gorgeous woman before revealing her skeletal face","id":"ve-sayona-v2","ab":["유혹"],"gf":["호러","다크 판타지"],"ip":false}]},{"c":"Ecuador","r":"South America","i":"EC","b":[{"n":"Tin Tin","t":"Imp","f":5,"d":"Small mischievous spirit that seduces women by playing…","id":"ec-tin-tin","ab":["유혹"],"vk":["작은 체구"],"gf":["다크 판타지","로맨스"],"sh":["예언/징조"],"ip":false},{"n":"Guagua Auca","t":"Demon Child","f":7,"d":"Demon disguised as abandoned baby that attacks those…","id":"ec-guagua-auca","ab":["불명"],"gf":["호러","다크 판타지"],"sh":["비극적 탄생"],"ip":false},{"n":"Tunda","t":"Shapeshifter","f":7,"d":"Female entity that takes the form of a loved one to lure children and men into the jungle. Feeds them shrimp to keep them in a trance while slowly consuming their life force","id":"ec-tunda","ab":["변신"],"gf":["호러","다크 판타지"],"ip":false}]},{"c":"Bolivia","r":"South America","i":"BO","b":[{"n":"Kharisiri","t":"Fat Stealer","f":8,"d":"Entity—often a priest—that extracts fat from sleeping…","id":"bo-kharisiri","ab":["불명"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Anchancho","t":"Demon","f":7,"d":"Malevolent spirit of abandoned mines and desolate…","id":"bo-anchancho","ab":["불명"],"gf":["호러","다크 판타지"],"sh":["비극적 탄생"],"ip":false},{"n":"El Tío","t":"Mine Devil","f":7,"d":"Lord of the underworld dwelling in Bolivian tin mines. Miners make offerings of coca, alcohol and cigarettes to El Tío for protection and rich ore veins","id":"bo-el-tio","gf":["다크 판타지"],"ip":false}]},{"c":"Paraguay","r":"South America","i":"PY","b":[{"n":"Luison","t":"Werewolf","f":8,"d":"Seventh and most cursed son, transforms into horrific…","id":"py-luison","ab":["변신","저주"],"gf":["호러","다크 판타지","미스터리"],"sh":["저주 해제","인간이 되고 싶은 욕망"],"ip":false},{"n":"Pombero","t":"Forest Goblin","f":5,"d":"Hairy night creature that punishes those disrespectful…","id":"py-pombero","ab":["불명"],"gf":["다크 판타지"],"ip":false},{"n":"Jasy Jatere","t":"Forest Spirit","f":7,"d":"Golden-haired child spirit that lures children into the forest during siesta time. Stuns them with magic making them wander lost. One of seven cursed monster brothers","id":"py-jasy-jatere","ab":["유혹"],"gf":["호러","다크 판타지"],"ip":false}]},{"c":"Uruguay","r":"South America","i":"UY","b":[{"n":"Lobizón","t":"Werewolf","f":7,"d":"Seventh son werewolf of full moon nights, president…","id":"uy-lobiz-n","ab":["불명"],"vk":["늑대 형상"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Luz Mala","t":"Ghost Light","f":5,"d":"Wandering soul appearing as eerie light over empty…","id":"uy-luz-mala","ab":["불명"],"gf":["다크 판타지"],"ip":false},{"n":"Mbói Tu'i","t":"Serpent Parrot","f":7,"d":"One of seven legendary monsters of Guaraní mythology — a giant serpent with a parrot's head whose terrifying scream causes panic and protects swamps and wetlands","id":"uy-mboi-tui","gf":["호러","다크 판타지"],"ip":false}]},{"c":"Australia","r":"Oceania","i":"AU","b":[{"n":"Bunyip","t":"Water Monster","f":7,"d":"Terrifying creature of swamps and billabongs in Aboriginal tradition","id":"au-bunyip","ab":["불명"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Yara-ma-yha-who","t":"Vampire","f":7,"d":"Small red creature that drops from fig trees, swallows victims whole","id":"au-yara-ma-yha-who","ab":["흡혈"],"vk":["작은 체구"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Drop Bear","t":"Predator","f":5,"d":"Carnivorous koala-like creature that drops from trees onto prey","id":"au-drop-bear","ab":["불명"],"gf":["다크 판타지"],"ip":false},{"n":"Rainbow Serpent","t":"Creator Spirit","f":7,"d":"Immense serpent that shaped the landscape during the Dreaming. Controls water, rain, and life. Both creator and destroyer, punishing those who break sacred law","id":"au-rainbow-serpent","gf":["다크 판타지","영웅 서사"],"ip":false}]},{"c":"New Zealand","r":"Oceania","i":"NZ","b":[{"n":"Taniwha","t":"Water Guardian","f":7,"d":"Powerful water beings that can be guardians or destroyers, inhabit rivers and seas","id":"nz-taniwha","ab":["불명"],"gf":["호러","다크 판타지","영웅 서사"],"sh":["수호 임무"],"ip":false},{"n":"Patupaiarehe","t":"Fairy","f":5,"d":"Pale-skinned fairy folk who live in mist-covered mountains and fear sunlight","id":"nz-patupaiarehe","ab":["불명"],"wk":["햇빛"],"vk":["창백한 피부"],"gf":["다크 판타지"],"ip":false},{"n":"Maero","t":"Wild Man","f":7,"d":"Savage wild men of Māori mythology dwelling in dense forests. Covered in hair with long bony fingers used as weapons. Eat raw flesh and attack humans on sight","id":"nz-maero","gf":["호러","다크 판타지"],"ip":false},{"id":"nz-ponaturi","n":"Ponaturi","t":"Sea Goblin","f":6,"d":"Goblin-like sea creatures raiding coasts at night. Die in sunlight.","ln":"Ponaturi","ab":["수중 생존","야간 습격"],"wk":["햇빛"],"vk":["sea goblins","sunrise"],"gf":["action","horror"],"sh":["일출 전까지 활동하는 바다 도깨비의 습격"],"ip":false}]},{"c":"Papua New Guinea","r":"Oceania","i":"PG","b":[{"n":"Sanguma","t":"Sorcerer","f":9,"d":"Sorcerer who can fly and kill through magic, greatly feared in highlands","id":"pg-sanguma","ab":["비행"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Masalai","t":"Nature Spirit","f":7,"d":"Spirits bound to specific natural locations like pools, rocks, and trees","id":"pg-masalai","ab":["불명"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Ropen","t":"Living Pterosaur","f":7,"d":"Bioluminescent flying creature of Papua New Guinea described as a featherless reptile with a long tail and wingspan of 3-4 meters. Glows at night over jungles","id":"pg-ropen","ab":["비행"],"gf":["다크 판타지"],"ip":false}]},{"c":"Fiji","r":"Oceania","i":"FJ","b":[{"n":"Dakuwaqa","t":"Shark God","f":7,"d":"Shape-shifting shark god who protects fishermen and…","id":"fj-dakuwaqa","ab":["변신"],"gf":["호러","다크 판타지","영웅 서사"],"sh":["수호 임무"],"ip":false},{"n":"Tevoro","t":"Ghost","f":5,"d":"Recently dead spirits that can return to possess…","id":"fj-tevoro","ab":["빙의"],"gf":["다크 판타지"],"sh":["빙의/퇴마"],"ip":false},{"n":"Kalou-Vu","t":"Ancestor God","f":7,"d":"Primordial ancestor spirits dwelling in sacred groves and rocks. Each Fijian clan has its patron Kalou-Vu who guides warriors in battle and punishes oath-breakers","id":"fj-kalou-vu","gf":["다크 판타지","영웅 서사"],"ip":false}]},{"c":"Samoa","r":"Oceania","i":"WS","b":[{"n":"Aitu","t":"Ghost","f":7,"d":"Spirits of the dead that can help or harm, encountered…","id":"ws-aitu","ab":["불명"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Pili","t":"Lizard God","f":5,"d":"Giant sacred lizard of Samoan legend who divided the…","id":"ws-pili","ab":["불명"],"vk":["거대한 체구"],"gf":["다크 판타지","영웅 서사"],"ip":false},{"n":"Seauliālii","t":"Sacred Spirit","f":5,"d":"Spirit assembly of Samoan mythology that decides the fate of humans. Can appear as animals, storms, or beautiful strangers testing the hospitality of mortals","id":"ws-seaulialii","gf":["다크 판타지"],"ip":false}]},{"c":"Lebanon","r":"West Asia","i":"LB","b":[{"n":"Jinn","t":"Spirit","f":7,"d":"Invisible fire-born beings capable of possession and…","id":"lb-jinn","ab":["빙의","투명화","화염"],"vk":["불꽃"],"gf":["호러","다크 판타지"],"sh":["빙의/퇴마"],"ip":false},{"n":"Ghoul","t":"Monster","f":7,"d":"Graveyard-dwelling shapeshifter that devours the dead…","id":"lb-ghoul","ab":["포식"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Hinn","t":"Weak Jinn","f":5,"d":"Lesser jinn that take the form of dogs or other animals. Less powerful than regular jinn but numerous and mischievous, haunt lonely roads","id":"lb-hinn","gf":["다크 판타지"],"ip":false}]},{"c":"Jordan","r":"West Asia","i":"JO","b":[{"n":"Jinn","t":"Spirit","f":7,"d":"Desert spirits dwelling in ruins and caves, central to…","id":"jo-jinn","ab":["불명"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Ghoul","t":"Monster","f":7,"d":"Desert predator that mimics voices to lure travelers…","id":"jo-ghoul","ab":["불명"],"gf":["호러","다크 판타지"],"ip":false}]},{"c":"Yemen","r":"West Asia","i":"YE","b":[{"n":"Jinn","t":"Spirit","f":7,"d":"Powerful spirits said to dwell in Socotra and remote…","id":"ye-jinn","ab":["불명"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Nasnas","t":"Half-Being","f":7,"d":"Creature with half a body—one arm, one leg—that kills…","id":"ye-nasnas","ab":["불명"],"gf":["호러","다크 판타지"],"ip":false}]},{"c":"Oman","r":"West Asia","i":"OM","b":[{"n":"Jinn","t":"Spirit","f":7,"d":"Desert spirits associated with ancient frankincense…","id":"om-jinn","ab":["불명"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Umm al-Duwais","t":"Demon","f":7,"d":"Beautiful seductress who lures men before revealing…","id":"om-umm-al-duwais","ab":["유혹"],"vk":["아름다운 외모"],"gf":["호러","다크 판타지","로맨스"],"ip":false}]},{"c":"UAE","r":"West Asia","i":"AE","b":[{"n":"Umm al-Duwais","t":"Demon","f":7,"d":"Cat-eyed seductress spirit who preys on lone men in…","id":"ae-umm-al-duwais","ab":["불명"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Jinn","t":"Spirit","f":7,"d":"Shapeshifting beings of Islamic tradition dwelling in…","id":"ae-jinn","ab":["변신"],"gf":["호러","다크 판타지"],"ip":false}]},{"c":"Latvia","r":"Eastern Europe","i":"LV","b":[{"n":"Vilkatis","t":"Werewolf","f":7,"d":"Latvian werewolf, sometimes benevolent protector of…","id":"lv-vilkatis","ab":["불명"],"vk":["늑대 형상"],"gf":["호러","다크 판타지","영웅 서사"],"sh":["수호 임무"],"ip":false},{"n":"Pūķis","t":"Dragon","f":5,"d":"Household dragon that brings stolen grain and treasure…","id":"lv-p-is","ab":["불명"],"gf":["다크 판타지"],"sh":["보물 탐색"],"ip":false},{"n":"Vadātājs","t":"Forest Spirit","f":5,"d":"Latvian forest spirit that leads travelers astray through dense woods. Can be escaped by turning your coat inside out or walking backwards","id":"lv-vadatajs","gf":["다크 판타지"],"ip":false}]},{"c":"Estonia","r":"Eastern Europe","i":"EE","b":[{"n":"Kratt","t":"Golem","f":5,"d":"Servant made from household objects, animated by…","id":"ee-kratt","ab":["불명"],"gf":["다크 판타지"],"ip":false},{"n":"Näkk","t":"Water Spirit","f":7,"d":"Shapeshifting water being that drowns those who swim…","id":"ee-n-kk","ab":["변신","익사 유발"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Virvatuli","t":"Will-o-Wisp","f":5,"d":"Ghostly lights floating through Estonian bogs marking buried treasure. Those who follow them sink into marshes. Some say they are souls of unbaptized children","id":"ee-virvatuli","gf":["다크 판타지","미스터리"],"ip":false}]},{"c":"Slovakia","r":"Eastern Europe","i":"SK","b":[{"n":"Poludnica","t":"Field Spirit","f":7,"d":"Noon lady who appears in grain fields causing…","id":"sk-poludnica","ab":["불명"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Vodník","t":"Water Spirit","f":7,"d":"Green-skinned water goblin who traps drowned souls in…","id":"sk-vodn-k","ab":["불명"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Mora","t":"Night Hag","f":7,"d":"Slovakian sleep paralysis entity — a woman whose soul leaves her body at night to sit on sleepers' chests. Victim sees a dark figure but cannot move or scream","id":"sk-mora","ab":["마비","악몽 유발"],"gf":["호러","다크 판타지"],"ip":false}]},{"c":"Slovenia","r":"Southern Europe","i":"SI","b":[{"n":"Povodni Mož","t":"Water Spirit","f":7,"d":"Handsome water man of the Ljubljanica who pulls women…","id":"si-povodni-mo","ab":["불명"],"vk":["잘생긴 외모"],"gf":["호러","다크 판타지"],"sh":["예언/징조"],"ip":false},{"n":"Kurent","t":"Wild Man","f":4,"d":"Shaggy costumed figure that chases away winter evil…","id":"si-kurent","ab":["불명"],"gf":["동화/판타지"],"ip":false},{"n":"Zlatorog","t":"Golden Horn","f":5,"d":"Mythical white chamois with golden horns guarding a treasure garden atop Mount Triglav. Anyone who wounds it causes flowers to spring from its blood that heal all wounds","id":"si-zlatorog","gf":["동화/판타지","영웅 서사"],"ip":false}]},{"c":"North Macedonia","r":"Southern Europe","i":"MK","b":[{"n":"Karakondžula","t":"Night Demon","f":7,"d":"Goblin-like creature that jumps on backs of night…","id":"mk-karakond-ula","ab":["불명"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Samovila","t":"Forest Nymph","f":5,"d":"Fierce mountain fairy who can dance men to death or…","id":"mk-samovila","ab":["불명"],"gf":["다크 판타지"],"ip":false},{"n":"Chuma","t":"Plague Hag","f":7,"d":"Personification of plague as an old woman in white. Knocks on doors at night, and those who answer fall ill. Can be tricked by not responding when she calls","id":"mk-chuma","ab":["역병"],"gf":["호러","다크 판타지"],"ip":false}]},{"c":"Tonga","r":"Oceania","i":"TO","b":[{"n":"Tevolo","t":"Devil","f":7,"d":"Evil spirits that possess people and cause madness or…","id":"to-tevolo","ab":["빙의","광기 유발"],"gf":["호러","다크 판타지"],"sh":["빙의/퇴마"],"ip":false},{"n":"Hina","t":"Moon Goddess","f":4,"d":"Divine woman associated with the moon, tapa cloth, and…","id":"to-hina","ab":["불명"],"gf":["동화/판타지","영웅 서사"],"ip":false},{"n":"Maui","t":"Demigod Trickster","f":5,"d":"Polynesian demigod who fished up islands from the sea, snared the sun, and stole fire from the underworld. Cultural hero whose cleverness outshines the gods","id":"to-maui","gf":["영웅 서사","동화/판타지"],"ip":false}]},{"c":"Vanuatu","r":"Oceania","i":"VU","b":[{"n":"Tamate","t":"Ghost","f":7,"d":"Ancestor spirits embodied through elaborate masks in…","id":"vu-tamate","ab":["불명"],"vk":["가면"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Nevimbur","t":"Spirit","f":5,"d":"Bush spirits that haunt forests and disturb those who…","id":"vu-nevimbur","ab":["불명"],"gf":["다크 판타지"],"ip":false},{"n":"Nakaemas","t":"Sorcery","f":7,"d":"Dark sorcery believed to cause mysterious illness and death. Practitioners allegedly use personal items of the victim — hair, nails, clothing — in cursing rituals","id":"vu-nakaemas","ab":["저주"],"gf":["호러","다크 판타지"],"ip":false}]},{"c":"Solomon Islands","r":"Oceania","i":"SB","b":[{"n":"Adaro","t":"Sea Spirit","f":7,"d":"Malevolent merfolk with swordfish spear on head,…","id":"sb-adaro","ab":["불명"],"gf":["호러","다크 판타지","액션"],"ip":false},{"n":"Kakamora","t":"Forest Dwarf","f":5,"d":"Tiny fierce warriors with long nails who ambush…","id":"sb-kakamora","ab":["불명"],"vk":["작은 체구"],"gf":["다크 판타지","액션"],"ip":false},{"n":"Shark Caller","t":"Spirit Bond","f":5,"d":"Mystical tradition where certain men form spiritual bonds with sharks. The Shark Callers can summon sharks to provide food or to attack enemies at sea","id":"sb-shark-caller","gf":["다크 판타지","영웅 서사"],"ip":false}]},{"c":"Guyana","r":"South America","i":"GY","b":[{"n":"Ol' Higue","t":"Vampire","f":7,"d":"Old woman who sheds skin at night and flies as ball of…","id":"gy-ol-higue","ab":["비행","흡혈"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Massacuraman","t":"Giant","f":7,"d":"Giant hairy creature of rivers that overturns boats…","id":"gy-massacuraman","ab":["불명"],"vk":["거대한 체구"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Moongazer","t":"Giant","f":7,"d":"Towering figure that straddles roads at night, legs spread across the path, gazing up at the moon. Travelers who pass between its legs are never seen again","id":"gy-moongazer","gf":["호러","다크 판타지"],"ip":false}]},{"c":"Suriname","r":"South America","i":"SR","b":[{"n":"Bakru","t":"Imp","f":5,"d":"Half-flesh half-wood child spirit that brings wealth…","id":"sr-bakru","ab":["불명"],"gf":["다크 판타지"],"ip":false},{"n":"Asema","t":"Vampire","f":8,"d":"Skin-shedding vampire similar to soucouyant, repelled…","id":"sr-asema","ab":["흡혈"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Azeman","t":"Vampire Witch","f":7,"d":"Surinamese vampire that transforms into a bat by day. She must count every grain of rice scattered before her door, keeping her busy until dawn breaks","id":"sr-azeman","ab":["변신","흡혈"],"gf":["호러","다크 판타지"],"ip":false}]},{"c":"Bhutan","r":"South Asia","i":"BT","b":[{"n":"Meme Tsangla","t":"Wild Man","f":5,"d":"Yeti-like wildman of Bhutanese forests, protector of…","id":"bt-meme-tsangla","ab":["불명"],"gf":["다크 판타지","영웅 서사"],"sh":["수호 임무"],"ip":false},{"n":"Dud Pho","t":"Demon","f":7,"d":"Evil spirit that possesses people and spreads disease","id":"bt-dud-pho","ab":["빙의","역병"],"gf":["호러","다크 판타지"],"sh":["빙의/퇴마"],"ip":false},{"n":"Yeti","t":"Wild Man","f":5,"d":"Migoi — Bhutanese name for the yeti. Considered a protector of the mountains by some, a dangerous predator by others. Bhutan has a national park named for it","id":"bt-migoi","gf":["다크 판타지"],"ip":false}]},{"c":"Maldives","r":"South Asia","i":"MV","b":[{"n":"Rannamaari","t":"Sea Demon","f":8,"d":"Fearsome sea demon that demanded virgin sacrifices…","id":"mv-rannamaari","ab":["불명"],"gf":["호러","다크 판타지"],"sh":["제물/희생"],"ip":false},{"n":"Dhevi","t":"Spirit","f":5,"d":"Female nature spirits of the atolls connected to coral…","id":"mv-dhevi","ab":["불명"],"gf":["다크 판타지"],"ip":false},{"n":"Fanditha Spirit","t":"Sorcery Spirit","f":7,"d":"Spirits invoked through Maldivian black magic (fanditha). Practitioners carve coconut shells with spells and cast them into the sea to send spirits against enemies","id":"mv-fanditha","gf":["호러","다크 판타지"],"ip":false}]},{"c":"Armenia","r":"West Asia","i":"AM","b":[{"n":"Nhang","t":"Water Dragon","f":7,"d":"River serpent that can take human form to lure victims…","id":"am-nhang","ab":["불명"],"vk":["뱀 형상"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Al","t":"Hag","f":8,"d":"Iron-toothed hag that steals livers of newborns and…","id":"am-al","ab":["불명"],"wk":["철/쇠"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Shahapet","t":"House Spirit","f":4,"d":"Protective serpent spirit dwelling in house foundations. Brings prosperity to respectful families. If angered by disrespect, causes the house to crumble","id":"am-shahapet","gf":["동화/판타지"],"ip":false}]},{"c":"Azerbaijan","r":"West Asia","i":"AZ","b":[{"n":"Dev","t":"Giant","f":7,"d":"Enormous ogre-like beings from Turkic tradition…","id":"az-dev","ab":["거대화"],"vk":["거대한 체구"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Hal Anasi","t":"Hag","f":7,"d":"Woman spirit that attacks mothers in the 40 days after…","id":"az-hal-anasi","ab":["불명"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Jinn","t":"Fire Spirit","f":7,"d":"Azerbaijani jinn dwelling in fire temples and ancient ruins. The region's Zoroastrian heritage gives these fire-born spirits unique characteristics","id":"az-jinn","ab":["화염"],"gf":["호러","다크 판타지"],"ip":false}]},{"c":"Kyrgyzstan","r":"Central Asia","i":"KG","b":[{"n":"Jez Tyrmak","t":"Copper Claws","f":8,"d":"Witch with copper claws who kidnaps children and lives…","id":"kg-jez-tyrmak","ab":["불명"],"vk":["발톱"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Albasty","t":"Demon","f":7,"d":"Childbirth demon of Turkic tradition, appears as ugly…","id":"kg-albasty","ab":["불명"],"vk":["흉측한 외모"],"gf":["호러","다크 판타지"],"ip":false}]},{"c":"Tajikistan","r":"Central Asia","i":"TJ","b":[{"n":"Almasty","t":"Wild Man","f":5,"d":"Bigfoot-like creature reported in the Pamir mountains","id":"tj-almasty","ab":["불명"],"gf":["다크 판타지"],"ip":false},{"n":"Ajina","t":"Demon","f":7,"d":"Shapeshifting demons of Tajik lore that haunt…","id":"tj-ajina","ab":["변신"],"gf":["호러","다크 판타지"],"ip":false}]},{"c":"Turkmenistan","r":"Central Asia","i":"TM","b":[{"n":"Dev","t":"Giant","f":7,"d":"Multi-headed giants of Turkmen epic who guard ancient…","id":"tm-dev","ab":["불명"],"vk":["거대한 체구"],"gf":["호러","다크 판타지"],"sh":["수호 임무"],"ip":false},{"n":"Yal","t":"Dragon","f":7,"d":"Serpent dragon of the Karakum desert that protects…","id":"tm-yal","ab":["불명"],"vk":["뱀 형상"],"gf":["호러","다크 판타지","영웅 서사"],"sh":["수호 임무"],"ip":false}]},{"c":"Somalia","r":"East Africa","i":"SO","b":[{"n":"Jinn","t":"Spirit","f":7,"d":"Powerful spirits prominent in Somali folk Islam and…","id":"so-jinn","ab":["불명"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Dhegdheer","t":"Cannibal","f":9,"d":"One-eared cannibal giantess who could hear prey from…","id":"so-dhegdheer","ab":["불명"],"vk":["거대한 체구"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Qori Ismaris","t":"Spirit","f":5,"d":"Benevolent Somali spirit that grants a single wish per person for a lifetime. Appears as a dancing light in the desert at twilight","id":"so-qori-ismaris","gf":["동화/판타지"],"ip":false}]},{"c":"Eritrea","r":"East Africa","i":"ER","b":[{"n":"Zar","t":"Possessing Spirit","f":7,"d":"Spirits requiring elaborate ceremonies to appease once…","id":"er-zar","ab":["불명"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Jinn","t":"Spirit","f":5,"d":"Desert-dwelling invisible beings of Islamic and…","id":"er-jinn","ab":["투명화"],"gf":["다크 판타지"],"ip":false}]},{"c":"Mauritius","r":"East Africa","i":"MU","b":[{"n":"Loup-Garou","t":"Werewolf","f":7,"d":"Creole werewolf tradition inherited from French…","id":"mu-loup-garou","ab":["불명"],"vk":["늑대 형상"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Grand Diable","t":"Demon","f":7,"d":"Devil figure that wanders crossroads offering…","id":"mu-grand-diable","ab":["불명"],"wk":["십자가"],"gf":["호러","다크 판타지"],"ip":false}]},{"c":"Belize","r":"Central America","i":"BZ","b":[{"n":"Tata Duende","t":"Forest Spirit","f":5,"d":"Thumbless dwarf guardian of the jungle who punishes…","id":"bz-tata-duende","ab":["불명"],"vk":["작은 체구"],"gf":["다크 판타지","영웅 서사"],"sh":["수호 임무"],"ip":false},{"n":"Xtabai","t":"Forest Spirit","f":7,"d":"Beautiful ceiba tree spirit that lures men deep into…","id":"bz-xtabai","ab":["유혹"],"vk":["아름다운 외모"],"gf":["호러","다크 판타지","로맨스"],"ip":false},{"n":"Sisimito","t":"Forest Ape","f":7,"d":"Belizean counterpart of the Sasquatch — massive hairy hominid dwelling in deep jungle. Has backward feet to confuse trackers. Kidnaps women and crushes men","id":"bz-sisimito","gf":["호러","다크 판타지"],"ip":false}]},{"c":"Greenland","r":"North America","i":"GL","b":[{"n":"Qivittoq","t":"Outcast Spirit","f":7,"d":"Person who fled to the wilderness and gained…","id":"gl-qivittoq","ab":["불명"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Tupilaq","t":"Construct","f":9,"d":"Avenging monster crafted from bone and skin, sent to…","id":"gl-tupilaq","ab":["불명"],"vk":["뼈"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Amarok","t":"Giant Wolf","f":8,"d":"Enormous wolf that hunts alone unlike normal wolves. Devours anyone foolish enough to hunt alone at night. In Inuit legend it punishes hunters who are greedy","id":"gl-amarok","gf":["호러","다크 판타지"],"ip":false}]},{"c":"Malta","r":"Southern Europe","i":"MT","b":[{"n":"Il-Belliegħa","t":"Witch","f":7,"d":"Maltese witch who steals children and curses those who…","id":"mt-il-bellieg-a","ab":["저주"],"gf":["호러","다크 판타지","미스터리"],"sh":["저주 해제"],"ip":false},{"n":"Il-Gawgaw","t":"Boogeyman","f":5,"d":"Large fearsome creature used to frighten children into…","id":"mt-il-gawgaw","ab":["불명"],"gf":["다크 판타지"],"ip":false},{"n":"Il-Gawgaw","t":"Boogeyman","f":5,"d":"Maltese bogeyman — giant fearsome creature that terrorizes misbehaving children. Said to dwell in wells and abandoned buildings on the island","id":"mt-il-gawgaw-v2","gf":["다크 판타지"],"ip":false}]},{"c":"Cyprus","r":"Southern Europe","i":"CY","b":[{"n":"Vrykolakas","t":"Vampire","f":7,"d":"Undead revenant of Greek Cypriot tradition that…","id":"cy-vrykolakas","ab":["흡혈"],"gf":["호러","다크 판타지"],"ip":false},{"n":"Kalikantzaros","t":"Goblin","f":5,"d":"Underground goblins that emerge during the twelve days…","id":"cy-kalikantzaros","ab":["불명"],"gf":["다크 판타지"],"ip":false},{"n":"Vrykolakas","t":"Revenant","f":7,"d":"Cypriot walking dead that knocks on doors at night calling names. Those who answer fall ill and die within days, rising as vrykolakas themselves","id":"cy-vrykolakas-v2","gf":["호러","다크 판타지"],"ip":false}]},{"c":"Bosnia and Herzegovina","r":"Eastern Europe","i":"BA","b":[{"n":"Drekavac","t":"Undead","f":8,"d":"Shrieking creature spawned from unbaptized children,…","id":"ba-drekavac","ab":["불명"],"gf":["호러","다크 판타지"],"sh":["비극적 탄생"],"ip":false},{"n":"Vila","t":"Forest Nymph","f":5,"d":"Fierce warrior fairy of mountains and clouds who can…","id":"ba-vila","ab":["불명"],"gf":["다크 판타지","액션"],"ip":false},{"n":"Stuha","t":"Wind Demon","f":7,"d":"Bosnian wind demon that rides whirlwinds and sandstorms. Destroys crops, collapses roofs, and carries away animals. Only a powerful imam can banish it","id":"ba-stuha","ab":["폭풍 조종"],"gf":["호러","다크 판타지"],"ip":false}]}];



// ═══════════════════════════════════════════════════════════════
//  GLOBAL FOLKLORE BESTIARY — 151 Countries · 600 Beings
//  Interactive World Map + Card Explorer
// ═══════════════════════════════════════════════════════════════

const CONTINENT_MAP = {
  "East Asia": "Asia",
  "Southeast Asia": "Asia",
  "South Asia": "Asia",
  "Central Asia": "Asia",
  "West Asia": "Asia",
  "Northern Europe": "Europe",
  "Western Europe": "Europe",
  "Southern Europe": "Europe",
  "Eastern Europe": "Europe",
  "North Africa": "Africa",
  "West Africa": "Africa",
  "East Africa": "Africa",
  "Southern Africa": "Africa",
  "Central Africa": "Africa",
  "North America": "Americas",
  "Central America": "Americas",
  "South America": "Americas",
  "Caribbean": "Americas",
  "Oceania": "Oceania",
};

const CONTINENT_COLORS = {
  Asia: { bg: "#1a0a0a", accent: "#ff3b3b", glow: "#ff000044", card: "#2a0f0f", text: "#ffcccc", border: "#661111" },
  Europe: { bg: "#0a0a1a", accent: "#6b8aff", glow: "#0044ff44", card: "#0f0f2a", text: "#ccd0ff", border: "#112266" },
  Africa: { bg: "#1a140a", accent: "#ffaa2b", glow: "#ff880044", card: "#2a1f0f", text: "#ffeedd", border: "#664411" },
  Americas: { bg: "#0a1a0f", accent: "#3bff6b", glow: "#00ff4444", card: "#0f2a14", text: "#ccffdd", border: "#116622" },
  Oceania: { bg: "#0a161a", accent: "#3bdfff", glow: "#00ccff44", card: "#0f222a", text: "#ccf0ff", border: "#115566" },
};

const CONTINENT_EMOJI = { Asia: "🐉", Europe: "🧛", Africa: "🦁", Americas: "👹", Oceania: "🦈" };

const FEAR_LABELS = ["", "평화", "장난", "불안", "긴장", "위험", "공포", "경악", "악몽", "재앙", "종말"];

// ── Helper: Aggregate type stats across all data ──
const getTypeStats = (data) => {
  const map = {};
  data.forEach(c => c.b.forEach(b => {
    const t = b.t.replace(/Vengeful /,'').replace(/Evil /,'').replace(/Possessing /,'');
    map[t] = (map[t] || 0) + 1;
  }));
  return Object.entries(map).sort((a,b) => b[1]-a[1]).map(([name,value]) => ({ name, value }));
};

// ── Helper: Top 5 scariest per continent ──
const getTop5ByContinent = (data) => {
  const byContinent = {};
  data.forEach(c => {
    const cont = CONTINENT_MAP[c.r];
    if (!byContinent[cont]) byContinent[cont] = [];
    c.b.forEach(b => byContinent[cont].push({ ...b, country: c.c, continent: cont }));
  });
  const result = {};
  Object.entries(byContinent).forEach(([cont, beings]) => {
    result[cont] = beings.sort((a,b) => b.f - a.f || a.n.localeCompare(b.n)).slice(0, 5);
  });
  return result;
};

// ── Helper: Random encounter ──
const getRandomEncounter = (data) => {
  const country = data[Math.floor(Math.random() * data.length)];
  const being = country.b[Math.floor(Math.random() * country.b.length)];
  return { country, being };
};

// ── Illustrated card data for 5 featured countries ──
const FEATURED_CARDS = [
  { iso: "NO", title: "노르웨이 · Norge", tagline: "바이킹의 어둠이 깨어나는 곳",
    art: "⚔️", gradient: ["#0a0a1a","#1a1033"],
    lore: "피오르의 검은 물속에서 크라켄이 뒤틀리고, 고분에서 드라우그가 일어나 부패한 손으로 보물을 움켜쥔다. 요르문간드가 꼬리를 놓으면 라그나로크가 시작되고, 펜리르가 오딘을 삼킨다. 북유럽의 어둠은 세계 그 자체를 끝낸다." },
  { iso: "JP", title: "일본 · 日本", tagline: "천 개의 요괴가 사는 섬",
    art: "🏯", gradient: ["#1a0000","#330011"],
    lore: "산사 깊은 곳부터 안개 낀 강가까지, 일본의 요괴들은 모든 그림자에 도사린다. 쿠치사케온나는 치명적인 질문을 던지고, 갓파는 고대 수로를 지키며, 유레이는 버려진 복도를 떠돈다." },
  { iso: "PH", title: "필리핀 · Pilipinas", tagline: "밤이 사냥하는 곳",
    art: "🌴", gradient: ["#0a0a1a","#1a0033"],
    lore: "필리핀 군도에는 세계에서 가장 두려운 존재들이 서식한다. 아스왕은 어둠 속에서 변신하고, 마나낭갈은 스스로 몸을 분리해 날아다니며, 틱발랑은 여행자를 길을 잃게 만든다." },
  { iso: "RO", title: "루마니아 · România", tagline: "뱀파이어의 고향",
    art: "🏰", gradient: ["#0d0008","#1a0020"],
    lore: "트란실바니아의 안개 낀 골짜기에서 스트리고이가 무덤에서 일어난다. 모로이는 산 자의 생명력을 빨아들이고, 프리콜리치는—죽음으로도 벌할 수 없는 영혼—언데드 늑대로 배회한다." },
  { iso: "NG", title: "나이지리아 · Nàìjíríà", tagline: "고대 숲의 정령들",
    art: "🌿", gradient: ["#001a0a","#0a1a00"],
    lore: "나이지리아 민담은 영적 힘으로 맥동한다. 아비쿠 정령은 영아의 영혼을 괴롭히고, 에그베레는 그늘진 숲에서 울며, 부시 베이비의 울음소리는 황야의 죽음의 덫이다." },
  { iso: "MX", title: "멕시코 · México", tagline: "죽은 자가 쉬지 않는 곳",
    art: "💀", gradient: ["#1a0f00","#1a0500"],
    lore: "라 요로나의 울음이 수로를 따라 메아리친다. 나왈은 달빛 아래 인간과 재규어 사이를 변신한다. 추파카브라는 사막의 밤에 가축을 습격한다." },
];

// ═══════════════════════════════════════════════════════════════
//  CREATIVE STUDIO DATA — Scenario Generator, Character Builder, Webtoon IP
// ═══════════════════════════════════════════════════════════════

const SCENARIO_TEMPLATES = [
  { id: "horror", label: "🩸 공포", name: "어둠의 조우", desc: "공포와 생존의 시나리오",
    settings: ["폐허가 된 신사/사원", "안개 낀 산골 마을", "버려진 지하 묘지", "달 없는 밤의 숲길", "홍수로 고립된 섬", "폐교의 지하실"],
    hooks: ["주인공이 금기를 어기며 시작된다", "실종된 친구를 찾으러 간다", "의문의 편지/지도를 받는다", "귀향했더니 마을이 변해있다", "밤마다 같은 악몽을 꾼다"],
    twists: ["퇴치한 줄 알았던 존재가 주인공 안에 있었다", "마을 사람들이 이미 존재의 하수인이었다", "존재는 사실 수호자였고 진짜 위협은 인간이었다", "시간 루프에 갇혀 있었다", "존재를 없애면 더 큰 봉인이 풀린다"] },
  { id: "romance", label: "💜 로맨스", name: "금단의 연", desc: "인간과 초자연 존재의 사랑 이야기",
    settings: ["벚꽃이 지는 고대 궁궐", "비밀의 온천 마을", "달빛 비치는 해변 동굴", "천년 된 도서관", "신계와 인간계의 경계"],
    hooks: ["정체를 숨기고 인간 세계에 온 존재", "어릴 때 구해준 은인을 찾는다", "꿈에서만 만나던 상대를 현실에서 만난다", "금기된 의식 중 눈이 마주친다"],
    twists: ["서로의 존재가 상대를 소멸시킨다", "과거 생의 비극이 반복된다", "사랑이 봉인의 열쇠였다", "한쪽이 기억을 잃어야 상대가 산다"] },
  { id: "adventure", label: "⚔️ 모험", name: "전설의 탐색", desc: "초자연 존재와 함께하는 퀘스트",
    settings: ["다섯 대륙을 잇는 영적 통로", "하늘 위 떠다니는 고대 도시", "심해의 잊혀진 문명", "세계수의 뿌리 속 미궁", "화산 속 용의 무덤"],
    hooks: ["세계의 봉인이 하나씩 풀리고 있다", "각 대륙의 수호 존재가 실종된다", "금지된 소환서를 손에 넣었다", "자신이 고대 퇴마사의 후손임을 알게 된다"],
    twists: ["적이었던 존재가 진정한 동맹이 된다", "수호자들이 스스로 봉인을 해제한 것이었다", "주인공 자체가 봉인의 일부였다", "최종 보스가 미래의 자신이었다"] },
  { id: "mystery", label: "🔮 미스터리", name: "기이한 사건", desc: "초자연 탐정 이야기",
    settings: ["100년 전 시간이 멈춘 저택", "현대 도시의 뒷골목 요괴 거리", "국제 민속학 연구소", "사라진 마을의 폐허", "심야 운행 열차"],
    hooks: ["사건마다 특정 민담 존재의 패턴이 나타난다", "피해자들이 모두 같은 전설을 들었다", "고대 유물이 경매에 나타난 후 연쇄 사건", "민속학 교수가 자신의 연구 대상에 의해 사라진다"],
    twists: ["사건의 범인이 인간이고 존재는 증인이었다", "모든 사건이 하나의 소환 의식이었다", "탐정 자신이 존재에게 선택받은 후계자", "사건은 존재들 간의 영토 전쟁이었다"] },
  { id: "comedy", label: "😂 코미디", name: "소동극", desc: "초자연 존재와 일상의 충돌",
    settings: ["현대 서울의 원룸 아파트", "요괴도 다니는 편의점", "초자연 존재 전용 SNS", "민속 박물관 야간 근무", "국제 민담 서밋 회의장"],
    hooks: ["소환을 잘못해서 집에 눌러앉은 존재", "존재가 인간 사회에 취직을 원한다", "여러 나라 존재들이 한 집에 모인다", "SNS 인플루언서 요괴"],
    twists: ["존재가 인간보다 인간적이었다", "코미디였던 상황이 세계적 위기로 확대", "모든 소동의 원인이 문화적 오해", "존재들의 리얼리티 쇼로 끝난다"] },
];

const CHARACTER_CLASSES = [
  { id: "exorcist", name: "퇴마사", icon: "⚡", desc: "고대의 의식과 봉인술로 존재를 제압", stats: { str: 3, int: 4, cha: 2, spd: 3, spr: 5 } },
  { id: "medium", name: "영매", icon: "👁", desc: "존재와 소통하며 영적 세계를 중재", stats: { str: 1, int: 3, cha: 5, spd: 2, spr: 5 } },
  { id: "hunter", name: "사냥꾼", icon: "🏹", desc: "물리적 힘과 함정으로 존재를 추적", stats: { str: 5, int: 3, cha: 1, spd: 5, spr: 2 } },
  { id: "scholar", name: "민속학자", icon: "📚", desc: "지식과 기록으로 존재의 약점을 파악", stats: { str: 1, int: 5, cha: 4, spd: 2, spr: 4 } },
  { id: "shaman", name: "무당/샤먼", icon: "🔮", desc: "자연의 힘을 빌려 존재와 교감", stats: { str: 2, int: 3, cha: 3, spd: 2, spr: 5 } },
  { id: "trickster", name: "사기꾼", icon: "🃏", desc: "기지와 속임수로 존재를 출 넘김", stats: { str: 2, int: 4, cha: 5, spd: 4, spr: 1 } },
  { id: "guardian", name: "수호자", icon: "🛡", desc: "신성한 유물과 결계로 사람들을 보호", stats: { str: 4, int: 2, cha: 3, spd: 2, spr: 5 } },
  { id: "cursed", name: "저주받은 자", icon: "🌑", desc: "존재의 힘이 깃든 반인반요 전사", stats: { str: 4, int: 2, cha: 1, spd: 4, spr: 4 } },
];

const STAT_NAMES = { str: "근력", int: "지능", cha: "매력", spd: "속도", spr: "영력" };
const STAT_COLORS = { str: "#ff4444", int: "#44aaff", cha: "#ff44aa", spd: "#44ff88", spr: "#aa44ff" };

const CHARACTER_ORIGINS = [
  "고아로 자란 후 은사의 가르침으로 각성",
  "가문 대대로 내려오는 퇴마 혈통",
  "어린 시절 존재와의 조우로 능력 획득",
  "사고로 임사 체험 후 영안이 열림",
  "고대 유물을 우연히 발견하여 계약",
  "존재에게 저주받았지만 그 힘을 역이용",
  "꿈에서 고대 존재에게 선택받음",
  "학술 연구 중 금기의 텍스트를 해독",
];

const CHARACTER_MOTIVATIONS = [
  "가족의 복수", "세계의 균형 수호", "잃어버린 기억 회복",
  "존재와의 공존 방법 모색", "최강의 존재 사냥",
  "고대 봉인의 진실 규명", "저주 해제", "사라진 동료 수색",
];

const WEBTOON_GENRES = [
  { id: "dark_fantasy", name: "다크 판타지", icon: "⚔️", color: "#ff4444", desc: "어둠과 공포 속 영웅의 서사" },
  { id: "horror", name: "호러/스릴러", icon: "👻", color: "#aa44ff", desc: "독자의 등골을 서늘하게" },
  { id: "romance_fantasy", name: "로맨스 판타지", icon: "💜", color: "#ff44aa", desc: "인간과 요괴의 금단의 사랑" },
  { id: "action", name: "액션/배틀", icon: "💥", color: "#ff8844", desc: "존재와의 전투와 성장" },
  { id: "comedy", name: "일상 코미디", icon: "😂", color: "#44ff88", desc: "요괴와 인간의 좌충우돌" },
  { id: "mystery", name: "추리/미스터리", icon: "🔍", color: "#44aaff", desc: "초자연 사건의 진실을 추적" },
];

const WEBTOON_STRUCTURES = [
  { name: "에피소드형", desc: "매화 독립된 사건, 종적 메타 서사 연결", episodes: "50~100화" },
  { name: "시즌제", desc: "시즌별 주요 아크, 시즌 간 캐릭터 성장", episodes: "시즌당 20~30화" },
  { name: "원샷 옴니버스", desc: "매화 다른 나라/존재 중심, 세계관 공유", episodes: "30~50화" },
  { name: "장편 연재", desc: "하나의 큰 서사를 장기 연재", episodes: "100화+" },
];

const IP_EXPANSION = [
  { name: "웹소설", icon: "📖", desc: "웹툰의 프리퀄/사이드 스토리 소설화" },
  { name: "게임화", icon: "🎮", desc: "RPG/수집형 게임으로 IP 확장" },
  { name: "애니메이션", icon: "🎬", desc: "시즌제 애니메이션 제작" },
  { name: "굿즈/MD", icon: "🧸", desc: "캐릭터 굿즈 및 아트북" },
  { name: "오디오드라마", icon: "🎧", desc: "음성 콘텐츠로 2차 확장" },
  { name: "메타버스", icon: "🌐", desc: "가상 세계 내 민담 체험" },
];

const PIE_COLORS = ["#ff4444","#ff8844","#ffcc44","#44ff88","#44aaff","#aa44ff","#ff44aa","#88ff44","#ff6644","#44ffcc","#8888ff","#ff88cc"];

// ── Helper: Radar chart data (continent comparison) ──
const getRadarData = (data) => {
  const stats = {};
  Object.keys(CONTINENT_COLORS).forEach(cont => { stats[cont] = { beings: 0, countries: 0, fearSum: 0, types: new Set(), maxFear: 0 }; });
  data.forEach(c => {
    const cont = CONTINENT_MAP[c.r];
    if (!stats[cont]) return;
    stats[cont].countries++;
    c.b.forEach(b => {
      stats[cont].beings++;
      stats[cont].fearSum += b.f;
      stats[cont].types.add(b.t);
      if (b.f > stats[cont].maxFear) stats[cont].maxFear = b.f;
    });
  });
  const metrics = ["존재 수", "국가 수", "평균 공포도", "타입 다양성", "최대 공포 밀도"];
  // Normalize each metric 0-100
  const maxBeings = Math.max(...Object.values(stats).map(s => s.beings));
  const maxCountries = Math.max(...Object.values(stats).map(s => s.countries));
  const maxTypes = Math.max(...Object.values(stats).map(s => s.types.size));
  return metrics.map(m => {
    const row = { metric: m };
    Object.entries(stats).forEach(([cont, s]) => {
      if (m === "존재 수") row[cont] = Math.round(s.beings / maxBeings * 100);
      else if (m === "국가 수") row[cont] = Math.round(s.countries / maxCountries * 100);
      else if (m === "평균 공포도") row[cont] = s.beings ? Math.round((s.fearSum / s.beings) / 10 * 100) : 0;
      else if (m === "타입 다양성") row[cont] = Math.round(s.types.size / maxTypes * 100);
      else if (m === "최대 공포 밀도") {
        const f5count = 0;
        row[cont] = s.beings ? Math.round(s.beings > 0 ? (s.fearSum / s.beings / 10 * 100) * (s.maxFear / 10) : 0) : 0;
      }
    });
    return row;
  });
};

// ── Helper: Fear spectrum data ──
const getFearSpectrum = (data) => {
  const buckets = [
    { level: 2, label: "장난", color: "#88ccff", beings: [] },
    { level: 4, label: "불안", color: "#44aaff", beings: [] },
    { level: 5, label: "위험", color: "#44ddaa", beings: [] },
    { level: 7, label: "공포", color: "#ffcc44", beings: [] },
    { level: 8, label: "악몽", color: "#ff8844", beings: [] },
    { level: 9, label: "재앙", color: "#ff4444", beings: [] },
    { level: 10, label: "종말", color: "#cc00ff", beings: [] },
  ];
  data.forEach(c => c.b.forEach(b => {
    const bucket = buckets.find(bk => bk.level === b.f);
    if (bucket) bucket.beings.push({ ...b, country: c.c, continent: CONTINENT_MAP[c.r] });
  }));
  return buckets;
};

const TYPE_ICONS = {
  Ghost: "👻", "Vengeful Ghost": "👻", "Vengeful Spirit": "👻", Spirit: "👻", "Evil Spirit": "👻",
  Demon: "😈", "Water Demon": "🌊", Shapeshifter: "🦊", Vampire: "🧛", Undead: "💀",
  Witch: "🧙", Sorcerer: "🧙", Beast: "🐺", Cryptid: "👁", "Wild Man": "🦍",
  Dragon: "🐲", Trickster: "🃏", "Trickster Spirit": "🃏", Giant: "🗿",
  Fairy: "🧚", "Forest Spirit": "🌲", "Nature Spirit": "🌿", "Water Spirit": "💧",
  Predator: "🐾", Ogre: "👹", Serpent: "🐍", "Sea Monster": "🐙",
  default: "☠️",
};
const getTypeIcon = (type) => {
  for (const [key, icon] of Object.entries(TYPE_ICONS)) {
    if (type.toLowerCase().includes(key.toLowerCase())) return icon;
  }
  return TYPE_ICONS.default;
};

// ═══════════════════════════════════════════════════════════════
//  SVG CREATURE PORTRAIT SYSTEM
// ═══════════════════════════════════════════════════════════════
const CPORT = {
"Gumiho (구미호)":(c)=><g><path d="M50,28 C42,28 36,35 36,45 C36,55 40,62 44,68 L44,78 L56,78 L56,68 C60,62 64,55 64,45 C64,35 58,28 50,28Z" fill={c} opacity="0.85"/><path d="M40,30 L34,12 L44,26Z" fill={c} opacity="0.9"/><path d="M60,30 L66,12 L56,26Z" fill={c} opacity="0.9"/><path d="M40,30 L37,16 L43,27Z" fill="#fff" opacity="0.15"/><path d="M60,30 L63,16 L57,27Z" fill="#fff" opacity="0.15"/><ellipse cx="44" cy="40" rx="3" ry="2" fill="#000" opacity="0.7"/><ellipse cx="56" cy="40" rx="3" ry="2" fill="#000" opacity="0.7"/><path d="M48,47 Q50,49 52,47" stroke="#000" strokeWidth="1" fill="none" opacity="0.5"/><path d="M50,72 Q30,65 20,50" stroke={c} strokeWidth="3" fill="none" opacity="0.7" strokeLinecap="round"/><path d="M50,72 Q28,68 16,58" stroke={c} strokeWidth="2.5" fill="none" opacity="0.6" strokeLinecap="round"/><path d="M50,72 Q32,72 22,68" stroke={c} strokeWidth="3" fill="none" opacity="0.65" strokeLinecap="round"/><path d="M50,72 Q35,78 24,78" stroke={c} strokeWidth="2.5" fill="none" opacity="0.55" strokeLinecap="round"/><path d="M50,72 Q70,65 80,50" stroke={c} strokeWidth="3" fill="none" opacity="0.7" strokeLinecap="round"/><path d="M50,72 Q72,68 84,58" stroke={c} strokeWidth="2.5" fill="none" opacity="0.6" strokeLinecap="round"/><path d="M50,72 Q68,72 78,68" stroke={c} strokeWidth="3" fill="none" opacity="0.65" strokeLinecap="round"/><path d="M50,72 Q58,82 68,86" stroke={c} strokeWidth="2" fill="none" opacity="0.5" strokeLinecap="round"/></g>,
"Dokkaebi (도깨비)":(c)=><g><path d="M50,25 C40,25 33,34 33,46 C33,58 38,66 42,72 L42,82 L58,82 L58,72 C62,66 67,58 67,46 C67,34 60,25 50,25Z" fill={c} opacity="0.8"/><path d="M42,28 Q38,18 44,14 Q50,10 56,14 Q62,18 58,28" fill={c} opacity="0.9"/><circle cx="42" cy="42" r="4" fill="#000" opacity="0.6"/><circle cx="42" cy="41" r="2" fill="#fff" opacity="0.3"/><circle cx="58" cy="42" r="4" fill="#000" opacity="0.6"/><circle cx="58" cy="41" r="2" fill="#fff" opacity="0.3"/><path d="M42,52 Q50,60 58,52" stroke="#000" strokeWidth="2" fill="none" opacity="0.5"/><rect x="68" y="30" width="8" height="36" rx="4" fill={c} opacity="0.7" transform="rotate(15,72,48)"/><circle cx="72" cy="30" r="6" fill={c} opacity="0.8" transform="rotate(15,72,48)"/></g>,
"Cheonyeo Gwishin (처녀귀신)":(c)=><g><path d="M36,20 Q34,40 30,65 Q28,80 32,90" stroke="#333" strokeWidth="4" fill="none" opacity="0.6" strokeLinecap="round"/><path d="M64,20 Q66,40 70,65 Q72,80 68,90" stroke="#333" strokeWidth="4" fill="none" opacity="0.6" strokeLinecap="round"/><ellipse cx="50" cy="30" rx="14" ry="16" fill={c} opacity="0.7"/><path d="M38,44 L36,90 Q50,95 64,90 L62,44 Q50,48 38,44Z" fill={c} opacity="0.5"/><ellipse cx="46" cy="32" rx="2" ry="3" fill="#000" opacity="0.8"/><ellipse cx="54" cy="32" rx="2" ry="3" fill="#000" opacity="0.8"/><path d="M46,35 L45,42" stroke={c} strokeWidth="0.8" opacity="0.6"/><path d="M54,35 L55,42" stroke={c} strokeWidth="0.8" opacity="0.6"/><path d="M36,85 Q50,92 64,85 Q62,95 50,98 Q38,95 36,85Z" fill={c} opacity="0.2"/></g>,
"Haetae (해태)":(c)=><g><path d="M26,50 C26,38 36,28 50,28 C64,28 74,38 74,50 C74,62 64,72 50,72 C36,72 26,62 26,50Z" fill={c} opacity="0.75"/><path d="M34,32 Q28,22 36,18 Q44,14 50,18 Q56,14 64,18 Q72,22 66,32" fill={c} opacity="0.9"/><circle cx="42" cy="42" r="5" fill="#fff" opacity="0.3"/><circle cx="42" cy="42" r="3" fill="#000" opacity="0.7"/><circle cx="58" cy="42" r="5" fill="#fff" opacity="0.3"/><circle cx="58" cy="42" r="3" fill="#000" opacity="0.7"/><rect x="32" y="66" width="8" height="14" rx="4" fill={c} opacity="0.7"/><rect x="60" y="66" width="8" height="14" rx="4" fill={c} opacity="0.7"/></g>,
"Imugi (이무기)":(c)=><g><path d="M70,80 Q75,70 70,60 Q65,50 58,48 Q50,46 44,50 Q38,54 36,62 Q34,70 38,76 Q42,82 48,80 Q54,78 56,72 Q58,66 54,62" stroke={c} strokeWidth="8" fill="none" opacity="0.8" strokeLinecap="round"/><ellipse cx="44" cy="56" rx="10" ry="8" fill={c} opacity="0.9"/><circle cx="40" cy="54" r="2.5" fill="#fff" opacity="0.4"/><circle cx="40" cy="54" r="1.5" fill="#000" opacity="0.8"/><circle cx="48" cy="54" r="2.5" fill="#fff" opacity="0.4"/><circle cx="48" cy="54" r="1.5" fill="#000" opacity="0.8"/><circle cx="44" cy="36" r="5" fill={c} opacity="0.3"/><circle cx="44" cy="36" r="3" fill="#fff" opacity="0.15"/></g>,
"Jeoseung Saja (저승사자)":(c)=><g><rect x="38" y="10" width="24" height="20" rx="2" fill="#111" opacity="0.9"/><ellipse cx="50" cy="30" rx="20" ry="4" fill="#111" opacity="0.8"/><ellipse cx="50" cy="36" rx="10" ry="8" fill={c} opacity="0.4"/><ellipse cx="46" cy="35" rx="1.5" ry="2" fill="#fff" opacity="0.6"/><ellipse cx="54" cy="35" rx="1.5" ry="2" fill="#fff" opacity="0.6"/><path d="M38,42 L32,92 Q50,96 68,92 L62,42 Q50,46 38,42Z" fill="#111" opacity="0.85"/><path d="M38,52 Q50,56 62,52" stroke={c} strokeWidth="1.5" fill="none" opacity="0.4"/><path d="M66,55 L78,50 L80,54 L76,58 L80,62" stroke={c} strokeWidth="1.5" fill="none" opacity="0.5" strokeLinecap="round"/></g>,
"Bulgasari (불가사리)":(c)=><g><path d="M28,42 C28,30 38,22 50,22 C62,22 72,30 72,42 C72,56 64,66 58,74 L42,74 C36,66 28,56 28,42Z" fill={c} opacity="0.85"/><path d="M34,26 L28,14 L38,22Z" fill={c} opacity="0.7"/><path d="M66,26 L72,14 L62,22Z" fill={c} opacity="0.7"/><circle cx="42" cy="38" r="4" fill="#000" opacity="0.6"/><circle cx="58" cy="38" r="4" fill="#000" opacity="0.6"/><path d="M42,50 L46,46 L50,50 L54,46 L58,50" stroke="#444" strokeWidth="2" fill="none" opacity="0.6"/><rect x="36" y="70" width="10" height="10" rx="3" fill={c} opacity="0.6"/><rect x="54" y="70" width="10" height="10" rx="3" fill={c} opacity="0.6"/></g>,
"Jangsanbum (장산범)":(c)=><g><path d="M50,14 C42,14 36,22 36,34 C36,48 40,60 44,70 L44,88 L56,88 L56,70 C60,60 64,48 64,34 C64,22 58,14 50,14Z" fill={c} opacity="0.75"/><path d="M36,20 Q30,30 28,50 Q26,70 30,88" stroke={c} strokeWidth="3" fill="none" opacity="0.3"/><path d="M64,20 Q70,30 72,50 Q74,70 70,88" stroke={c} strokeWidth="3" fill="none" opacity="0.3"/><circle cx="44" cy="32" r="3" fill="#000" opacity="0.8"/><circle cx="56" cy="32" r="3" fill="#000" opacity="0.8"/><path d="M44,42 Q50,48 56,42" stroke="#000" strokeWidth="1.5" fill="none" opacity="0.6"/></g>,
"Kuchisake-onna":(c)=><g><path d="M34,20 Q30,45 28,75" stroke="#222" strokeWidth="5" fill="none" opacity="0.7"/><path d="M66,20 Q70,45 72,75" stroke="#222" strokeWidth="5" fill="none" opacity="0.7"/><ellipse cx="50" cy="36" rx="14" ry="16" fill={c} opacity="0.65"/><ellipse cx="44" cy="32" rx="3" ry="2" fill="#000" opacity="0.8"/><ellipse cx="56" cy="32" rx="3" ry="2" fill="#000" opacity="0.8"/><path d="M36,40 Q50,44 64,40" stroke="#ff0000" strokeWidth="1.5" fill="none" opacity="0.7"/><path d="M72,50 L78,42 M72,50 L78,58" stroke={c} strokeWidth="2" opacity="0.6" strokeLinecap="round"/></g>,
"Oni":(c)=><g><path d="M30,40 C30,28 38,20 50,20 C62,20 70,28 70,40 C70,55 65,68 60,76 L40,76 C35,68 30,55 30,40Z" fill={c} opacity="0.85"/><path d="M40,22 L36,6 L42,18Z" fill="#fff" opacity="0.4"/><path d="M60,22 L64,6 L58,18Z" fill="#fff" opacity="0.4"/><path d="M38,36 L46,38 L40,40Z" fill="#000" opacity="0.7"/><path d="M62,36 L54,38 L60,40Z" fill="#000" opacity="0.7"/><path d="M40,48 L48,44 L56,48 L60,44" stroke="#000" strokeWidth="1.5" fill="none" opacity="0.6"/><rect x="70" y="24" width="8" height="48" rx="3" fill={c} opacity="0.6" transform="rotate(10,74,48)"/></g>,
"Jiangshi":(c)=><g><rect x="36" y="18" width="28" height="34" rx="4" fill={c} opacity="0.8"/><rect x="32" y="14" width="36" height="8" rx="2" fill={c} opacity="0.6"/><rect x="40" y="6" width="20" height="10" rx="2" fill="#ddcc44" opacity="0.5"/><circle cx="44" cy="30" r="2.5" fill="#000" opacity="0.7"/><circle cx="56" cy="30" r="2.5" fill="#000" opacity="0.7"/><path d="M36,52 L36,82 L42,82 L42,58" fill={c} opacity="0.7"/><path d="M64,52 L64,82 L58,82 L58,58" fill={c} opacity="0.7"/></g>,
"Krasue":(c)=><g><ellipse cx="50" cy="28" rx="14" ry="16" fill={c} opacity="0.8"/><path d="M36,18 Q32,10 36,6 Q42,2 46,8" stroke="#222" strokeWidth="3" fill="none" opacity="0.5"/><path d="M64,18 Q68,10 64,6 Q58,2 54,8" stroke="#222" strokeWidth="3" fill="none" opacity="0.5"/><ellipse cx="44" cy="26" rx="3" ry="3.5" fill="#000" opacity="0.7"/><ellipse cx="56" cy="26" rx="3" ry="3.5" fill="#000" opacity="0.7"/><path d="M44,42 Q40,56 42,72 Q44,82 46,90" stroke="#aa0000" strokeWidth="2" fill="none" opacity="0.5" strokeLinecap="round"/><path d="M50,42 Q50,60 48,76" stroke="#aa0000" strokeWidth="2.5" fill="none" opacity="0.4" strokeLinecap="round"/><path d="M56,42 Q60,56 58,72" stroke="#aa0000" strokeWidth="2" fill="none" opacity="0.5" strokeLinecap="round"/></g>,
"Strigoi":(c)=><g><path d="M50,16 C40,16 32,24 32,36 C32,48 40,56 42,62 L42,80 L58,80 L58,62 C60,56 68,48 68,36 C68,24 60,16 50,16Z" fill={c} opacity="0.75"/><path d="M32,36 L22,70 Q50,80 78,70 L68,36" fill={c} opacity="0.25"/><path d="M46,46 L47,52 L48,46" fill="#fff" opacity="0.7"/><path d="M52,46 L53,52 L54,46" fill="#fff" opacity="0.7"/></g>,
"Draugr":(c)=><g><path d="M50,10 C38,10 28,20 28,34 C28,42 32,48 32,48 L28,50 L34,52 L34,64 L30,70 L36,68 L40,78 L50,82 L60,78 L64,68 L70,70 L66,64 L66,52 L72,50 L68,48 C68,48 72,42 72,34 C72,20 62,10 50,10Z" fill={c} opacity="0.8"/><rect x="38" y="28" width="8" height="12" rx="2" fill="#4488ff" opacity="0.5"/><rect x="54" y="28" width="8" height="12" rx="2" fill="#4488ff" opacity="0.5"/><path d="M40,48 L46,44 L52,48 L58,44" stroke="#000" strokeWidth="1.5" fill="none" opacity="0.6"/></g>,
"Wendigo":(c)=><g><path d="M50,10 C42,10 36,18 36,28 L36,60 C36,68 40,74 44,78 L44,90 L56,90 L56,78 C60,74 64,68 64,60 L64,28 C64,18 58,10 50,10Z" fill={c} opacity="0.8"/><path d="M40,14 L34,4 L28,2" stroke={c} strokeWidth="2" fill="none" opacity="0.6" strokeLinecap="round"/><path d="M60,14 L66,4 L72,2" stroke={c} strokeWidth="2" fill="none" opacity="0.6" strokeLinecap="round"/><circle cx="44" cy="28" r="4" fill="#000" opacity="0.7"/><circle cx="56" cy="28" r="4" fill="#000" opacity="0.7"/><path d="M36,44 L28,42 L24,50" stroke={c} strokeWidth="2" fill="none" opacity="0.5" strokeLinecap="round"/><path d="M64,44 L72,42 L76,50" stroke={c} strokeWidth="2" fill="none" opacity="0.5" strokeLinecap="round"/></g>,
"Dullahan":(c)=><g><path d="M50,40 C42,40 36,46 36,54 L36,82 L64,82 L64,54 C64,46 58,40 50,40Z" fill={c} opacity="0.7"/><path d="M36,48 L28,76 Q50,82 72,76 L64,48" fill={c} opacity="0.25"/><circle cx="32" cy="26" r="12" fill={c} opacity="0.8"/><circle cx="28" cy="24" r="2.5" fill="#000" opacity="0.7"/><circle cx="36" cy="24" r="2.5" fill="#000" opacity="0.7"/><path d="M36,38 L36,48" stroke={c} strokeWidth="1.5" opacity="0.4"/></g>,
"Baba Yaga":(c)=><g><path d="M50,4 L38,28 L62,28Z" fill={c} opacity="0.8"/><ellipse cx="50" cy="28" rx="14" ry="4" fill={c} opacity="0.6"/><ellipse cx="50" cy="40" rx="10" ry="12" fill={c} opacity="0.65"/><circle cx="46" cy="38" r="2" fill="#000" opacity="0.6"/><circle cx="54" cy="38" r="2" fill="#000" opacity="0.6"/><path d="M38,52 L32,88 Q50,92 68,88 L62,52Z" fill={c} opacity="0.4"/><path d="M42,88 L42,96 M50,90 L50,98 M58,88 L58,96" stroke={c} strokeWidth="2" opacity="0.5" strokeLinecap="round"/></g>,
"La Llorona":(c)=><g><path d="M36,16 Q32,36 30,60 Q28,78 32,92" stroke="#333" strokeWidth="3" fill="none" opacity="0.5"/><path d="M64,16 Q68,36 70,60 Q72,78 68,92" stroke="#333" strokeWidth="3" fill="none" opacity="0.5"/><ellipse cx="50" cy="28" rx="12" ry="14" fill={c} opacity="0.65"/><path d="M38,40 L34,92 Q50,96 66,92 L62,40Z" fill={c} opacity="0.45"/><ellipse cx="46" cy="28" rx="2" ry="3" fill="#000" opacity="0.7"/><ellipse cx="54" cy="28" rx="2" ry="3" fill="#000" opacity="0.7"/><path d="M46,32 L44,40" stroke="#6688cc" strokeWidth="0.8" opacity="0.5"/><path d="M54,32 L56,40" stroke="#6688cc" strokeWidth="0.8" opacity="0.5"/></g>,
"Ammit":(c)=><g><path d="M30,36 C30,24 38,18 50,18 C62,18 70,24 70,36 L70,58 C70,66 62,72 50,72 C38,72 30,66 30,58Z" fill={c} opacity="0.8"/><ellipse cx="42" cy="34" rx="4" ry="5" fill="#fff" opacity="0.3"/><circle cx="42" cy="34" r="2.5" fill="#000" opacity="0.7"/><ellipse cx="58" cy="34" rx="4" ry="5" fill="#fff" opacity="0.3"/><circle cx="58" cy="34" r="2.5" fill="#000" opacity="0.7"/><path d="M36,50 L44,44 L52,50 L60,44 L64,50" stroke="#fff" strokeWidth="1.5" fill="none" opacity="0.5"/><rect x="30" y="68" width="10" height="16" rx="4" fill={c} opacity="0.6"/><rect x="60" y="68" width="10" height="16" rx="4" fill={c} opacity="0.6"/></g>,
"Aswang":(c)=><g><path d="M50,18 C42,18 36,26 36,36 C36,46 40,54 44,60 L44,78 L56,78 L56,60 C60,54 64,46 64,36 C64,26 58,18 50,18Z" fill={c} opacity="0.8"/><circle cx="44" cy="34" r="3" fill="#000" opacity="0.7"/><circle cx="56" cy="34" r="3" fill="#000" opacity="0.7"/><path d="M46,44 L48,50 L50,44" fill="#fff" opacity="0.6"/><path d="M50,44 L52,50 L54,44" fill="#fff" opacity="0.6"/><path d="M36,36 L26,32 Q28,38 24,42" stroke={c} strokeWidth="2" fill="none" opacity="0.4" strokeLinecap="round"/><path d="M64,36 L74,32 Q72,38 76,42" stroke={c} strokeWidth="2" fill="none" opacity="0.4" strokeLinecap="round"/></g>,
"Manananggal":(c)=><g><ellipse cx="50" cy="28" rx="12" ry="14" fill={c} opacity="0.8"/><ellipse cx="44" cy="26" rx="2.5" ry="3" fill="#000" opacity="0.7"/><ellipse cx="56" cy="26" rx="2.5" ry="3" fill="#000" opacity="0.7"/><path d="M46,34 L47,38 L48,34" fill="#fff" opacity="0.6"/><path d="M52,34 L53,38 L54,34" fill="#fff" opacity="0.6"/><path d="M38,30 L24,18 L30,32 L18,24 L28,36" stroke={c} strokeWidth="2" fill="none" opacity="0.5" strokeLinecap="round"/><path d="M62,30 L76,18 L70,32 L82,24 L72,36" stroke={c} strokeWidth="2" fill="none" opacity="0.5" strokeLinecap="round"/><path d="M44,42 Q40,56 42,72 Q44,82 46,90" stroke="#880000" strokeWidth="2" fill="none" opacity="0.4" strokeLinecap="round"/><path d="M56,42 Q60,56 58,72 Q56,82 54,90" stroke="#880000" strokeWidth="2" fill="none" opacity="0.4" strokeLinecap="round"/></g>,
"Skinwalker":(c)=><g><path d="M50,14 C42,14 36,22 36,34 C36,48 42,58 46,66 L46,84 L54,84 L54,66 C58,58 64,48 64,34 C64,22 58,14 50,14Z" fill={c} opacity="0.6"/><path d="M36,28 C28,24 24,32 30,38" stroke={c} strokeWidth="2" fill="none" opacity="0.3"/><path d="M64,28 C72,24 76,32 70,38" stroke={c} strokeWidth="2" fill="none" opacity="0.3"/><circle cx="44" cy="30" r="3" fill="#ff4444" opacity="0.5"/><circle cx="56" cy="30" r="3" fill="#ff4444" opacity="0.5"/><path d="M44,42 Q50,46 56,42" stroke="#000" strokeWidth="1" fill="none" opacity="0.4"/><path d="M42,14 L38,8 L44,12Z" fill={c} opacity="0.4"/><path d="M58,14 L62,8 L56,12Z" fill={c} opacity="0.4"/><path d="M34,50 Q26,52 22,58" stroke={c} strokeWidth="1.5" fill="none" opacity="0.2" strokeDasharray="3,3"/><path d="M66,50 Q74,52 78,58" stroke={c} strokeWidth="1.5" fill="none" opacity="0.2" strokeDasharray="3,3"/></g>,
};
// Type-based fallbacks
const TPORT = {
ghost:(c)=><g><path d="M50,18 C38,18 30,28 30,42 L30,62 C30,64 32,66 34,64 L38,60 C40,58 42,60 44,62 L48,66 C50,68 52,66 56,62 C58,60 60,58 62,60 L66,64 C68,66 70,64 70,62 L70,42 C70,28 62,18 50,18Z" fill={c} opacity="0.7"/><ellipse cx="42" cy="36" rx="5" ry="6" fill="#000" opacity="0.6"/><ellipse cx="58" cy="36" rx="5" ry="6" fill="#000" opacity="0.6"/><ellipse cx="50" cy="48" rx="4" ry="5" fill="#000" opacity="0.4"/></g>,
vampire:(c)=><g><path d="M50,16 C40,16 32,24 32,36 C32,48 40,56 42,62 L42,80 L58,80 L58,62 C60,56 68,48 68,36 C68,24 60,16 50,16Z" fill={c} opacity="0.75"/><path d="M32,36 L22,70 Q50,80 78,70 L68,36" fill={c} opacity="0.25"/><path d="M46,46 L47,52 L48,46" fill="#fff" opacity="0.7"/><path d="M52,46 L53,52 L54,46" fill="#fff" opacity="0.7"/></g>,
demon:(c)=><g><path d="M50,8 C38,8 28,20 28,36 C28,52 36,66 42,74 L58,74 C64,66 72,52 72,36 C72,20 62,8 50,8Z" fill={c} opacity="0.8"/><path d="M38,14 L30,0 L40,10Z" fill={c} opacity="0.9"/><path d="M62,14 L70,0 L60,10Z" fill={c} opacity="0.9"/><path d="M42,46 L50,42 L58,46" stroke="#000" strokeWidth="1.5" fill="none" opacity="0.5"/></g>,
beast:(c)=><g><path d="M50,12 C36,12 24,24 24,40 C24,56 34,68 44,76 L56,76 C66,68 76,56 76,40 C76,24 64,12 50,12Z" fill={c} opacity="0.8"/><path d="M34,18 L28,6 L38,14Z" fill={c} opacity="0.7"/><path d="M66,18 L72,6 L62,14Z" fill={c} opacity="0.7"/><circle cx="40" cy="36" r="3" fill="#000" opacity="0.7"/><circle cx="60" cy="36" r="3" fill="#000" opacity="0.7"/><path d="M42,50 L50,46 L58,50" stroke="#fff" strokeWidth="2" fill="none" opacity="0.5"/></g>,
undead:(c)=><g><path d="M50,10 C38,10 28,20 28,34 C28,42 32,48 32,48 L28,50 L34,52 L34,64 L30,70 L36,68 L40,78 L50,82 L60,78 L64,68 L70,70 L66,64 L66,52 L72,50 L68,48 C68,48 72,42 72,34 C72,20 62,10 50,10Z" fill={c} opacity="0.8"/><rect x="38" y="28" width="8" height="10" rx="2" fill="#000" opacity="0.7"/><rect x="54" y="28" width="8" height="10" rx="2" fill="#000" opacity="0.7"/></g>,
witch:(c)=><g><path d="M50,2 L38,28 L62,28Z" fill={c} opacity="0.85"/><ellipse cx="50" cy="40" rx="10" ry="12" fill={c} opacity="0.65"/><circle cx="46" cy="38" r="2" fill="#000" opacity="0.6"/><circle cx="54" cy="38" r="2" fill="#000" opacity="0.6"/><path d="M38,52 L32,88 Q50,92 68,88 L62,52Z" fill={c} opacity="0.4"/></g>,
water:(c)=><g><path d="M20,50 Q30,30 50,30 Q70,30 80,50 Q70,70 50,75 Q30,70 20,50Z" fill={c} opacity="0.6"/><circle cx="40" cy="42" r="3" fill="#000" opacity="0.5"/><circle cx="60" cy="42" r="3" fill="#000" opacity="0.5"/><circle cx="24" cy="60" r="2" fill={c} opacity="0.2"/><circle cx="76" cy="58" r="3" fill={c} opacity="0.15"/></g>,
serpent:(c)=><g><path d="M25,80 Q20,68 28,56 Q36,44 48,40 Q60,36 68,42 Q76,48 74,60 Q72,72 62,72 Q52,72 52,62" stroke={c} strokeWidth="7" fill="none" opacity="0.75" strokeLinecap="round"/><ellipse cx="68" cy="40" rx="8" ry="6" fill={c} opacity="0.9"/><circle cx="65" cy="38" r="2" fill="#000" opacity="0.7"/><circle cx="71" cy="38" r="2" fill="#000" opacity="0.7"/></g>,
trickster:(c)=><g><path d="M50,12 C42,12 34,20 34,32 C34,44 38,54 42,62 L42,80 L58,80 L58,62 C62,54 66,44 66,32 C66,20 58,12 50,12Z" fill={c} opacity="0.75"/><path d="M40,16 L36,6 L42,14Z" fill={c} opacity="0.6"/><path d="M60,16 L64,6 L58,14Z" fill={c} opacity="0.6"/><path d="M42,44 Q50,52 58,44" stroke="#000" strokeWidth="1.5" fill="none" opacity="0.5"/></g>,
fairy:(c)=><g><ellipse cx="50" cy="42" rx="8" ry="12" fill={c} opacity="0.7"/><path d="M42,36 C34,26 30,32 38,42Z" fill={c} opacity="0.35"/><path d="M58,36 C66,26 70,32 62,42Z" fill={c} opacity="0.35"/><circle cx="47" cy="38" r="1.5" fill="#fff" opacity="0.6"/><circle cx="53" cy="38" r="1.5" fill="#fff" opacity="0.6"/></g>,
df:(c)=><g><circle cx="50" cy="42" r="18" fill={c} opacity="0.6"/><circle cx="44" cy="38" r="3" fill="#000" opacity="0.5"/><circle cx="56" cy="38" r="3" fill="#000" opacity="0.5"/></g>,
};

const getPortrait = (name, type, color) => {
  if (CPORT[name]) return CPORT[name](color);
  const t = type.toLowerCase();
  if (t.includes("ghost") || (t.includes("spirit") && !t.includes("water") && !t.includes("forest") && !t.includes("nature"))) return TPORT.ghost(color);
  if (t.includes("vampire")) return TPORT.vampire(color);
  if (t.includes("demon") || t.includes("devil")) return TPORT.demon(color);
  if (t.includes("beast") || t.includes("wolf") || t.includes("predator") || t.includes("werewolf")) return TPORT.beast(color);
  if (t.includes("undead") || t.includes("zombie")) return TPORT.undead(color);
  if (t.includes("witch") || t.includes("hag") || t.includes("sorcerer")) return TPORT.witch(color);
  if (t.includes("water") || t.includes("sea") || t.includes("river")) return TPORT.water(color);
  if (t.includes("serpent") || t.includes("dragon") || t.includes("snake")) return TPORT.serpent(color);
  if (t.includes("trickster") || t.includes("goblin") || t.includes("imp")) return TPORT.trickster(color);
  if (t.includes("fairy") || t.includes("nymph")) return TPORT.fairy(color);
  return TPORT.df(color);
};

const Portrait = ({ name, type, color, size = 60, glow = false, animate = false }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{
    filter: glow ? `drop-shadow(0 0 ${size/5}px ${color}88)` : "none",
    animation: animate ? "creatureFloat 3.5s ease-in-out infinite" : "none",
    flexShrink: 0,
  }}>
    {getPortrait(name, type, color)}
  </svg>
);

// ── Detailed World Map SVG paths (realistic continent outlines) ──────
const CONTINENT_PATHS = {
  NorthAmerica: "M130,28 L155,25 170,30 195,28 225,32 250,28 268,35 275,48 262,55 258,62 270,68 265,78 248,85 240,95 235,108 228,118 222,128 218,138 210,148 202,158 195,168 188,178 185,185 190,192 198,188 208,185 215,192 210,198 205,205 208,212 215,218 222,225 228,232 232,238 225,242 218,238 210,235 200,232 195,228 188,225 182,220 175,215 170,210 165,218 158,215 148,210 142,202 138,195 135,188 128,178 122,168 120,155 118,142 115,128 112,115 115,102 118,92 122,82 128,72 135,62 140,52 138,42 Z",
  SouthAmerica: "M225,245 L232,248 240,252 248,258 258,262 268,265 275,272 280,280 285,290 290,298 295,308 298,318 300,328 298,338 295,348 290,358 285,365 278,372 272,378 268,385 262,390 255,395 248,398 242,395 238,388 235,378 230,368 225,358 222,348 218,338 215,328 212,318 210,308 212,298 215,288 218,278 222,268 225,258 Z",
  Europe: "M430,28 L438,25 448,28 458,32 468,30 478,35 488,38 498,35 508,38 518,42 528,48 535,55 538,62 540,72 542,82 540,92 538,98 535,105 530,112 525,118 520,125 515,132 508,138 502,142 495,145 488,142 480,138 472,135 465,132 458,128 452,125 448,120 442,115 438,110 435,105 432,98 430,92 428,85 425,78 422,70 420,62 418,55 420,48 422,42 425,35 Z",
  Africa: "M428,162 L435,158 442,155 450,158 458,162 468,165 478,168 488,172 498,178 505,185 510,192 515,200 518,210 520,220 522,232 524,242 525,255 524,268 522,280 520,292 518,305 515,318 512,330 508,342 502,352 498,362 492,370 485,378 478,382 470,385 462,382 455,378 448,372 442,365 438,355 435,345 432,335 430,325 428,315 425,305 422,295 420,285 418,275 418,265 420,255 422,242 425,230 428,218 430,208 432,198 430,188 428,178 Z",
  Asia: "M540,25 L555,22 570,25 585,28 600,30 618,28 635,32 650,28 668,25 685,30 700,35 715,38 728,42 740,48 752,55 760,62 768,72 775,82 780,95 782,108 780,118 775,128 768,140 760,152 752,165 748,175 742,185 735,195 728,205 720,215 712,225 705,232 698,238 690,242 682,238 675,232 668,228 660,232 652,240 645,250 640,260 632,268 625,272 618,268 610,260 602,255 595,260 588,268 580,270 572,265 565,258 558,252 550,248 545,242 542,232 540,222 538,212 535,200 532,190 530,180 532,168 535,158 538,148 540,138 542,128 544,118 545,108 544,98 542,88 540,78 538,68 535,58 534,48 535,38 Z",
  Oceania: "M718,280 L728,278 742,282 755,285 768,288 778,292 788,298 798,305 808,312 815,320 820,330 822,340 818,348 812,355 805,360 798,365 790,368 780,370 770,368 760,365 752,360 745,355 738,348 732,340 728,332 725,322 722,312 720,302 718,292 Z",
  // Islands and additional landmasses
  Japan: "M718,120 L722,115 728,118 732,125 730,135 726,142 722,148 718,142 716,135 715,128 Z",
  UKIsland: "M448,68 L455,65 460,70 458,78 455,85 450,82 447,76 Z",
  Indonesia: "M665,255 L675,252 688,255 700,258 712,260 722,258 732,262 740,268 735,272 725,275 715,272 705,268 695,265 685,262 675,260 Z",
  NewZealand: "M798,372 L802,368 808,372 806,380 802,385 798,380 Z",
  Madagascar: "M548,320 L552,315 556,318 558,328 555,338 550,335 548,328 Z",
  SriLanka: "M628,240 L632,238 635,242 633,248 630,245 Z",
  Philippines: "M708,198 L712,195 716,200 714,208 710,205 Z",
  Taiwan: "M702,172 L706,170 708,175 705,180 702,177 Z",
};

// Country positions (Mercator-projected, viewBox 80 10 780 400)
const COUNTRY_POSITIONS = {
  // East Asia
  KR:[695,138],JP:[722,132],CN:[662,148],MN:[652,108],TW:[703,172],
  // Southeast Asia
  VN:[672,198],TH:[662,208],PH:[710,205],ID:[698,260],MY:[680,242],
  KH:[667,212],MM:[652,198],LA:[662,202],SG:[682,250],BN:[696,238],
  // South Asia
  IN:[618,208],NP:[622,182],LK:[630,242],PK:[598,180],BD:[636,198],AF:[590,162],BT:[636,188],MV:[615,258],
  // Central Asia
  KZ:[600,108],UZ:[592,128],KG:[612,130],TJ:[607,138],TM:[587,140],
  // West Asia
  IR:[577,168],TR:[535,148],SA:[558,208],IQ:[555,172],IL:[528,190],
  LB:[528,182],JO:[533,192],YE:[563,228],OM:[578,218],AE:[575,212],GE:[555,138],AM:[550,142],AZ:[558,138],
  // Northern Europe
  NO:[472,42],SE:[488,42],DK:[478,72],FI:[508,38],IS:[418,32],
  // Western Europe
  GB:[452,72],IE:[440,72],FR:[462,105],DE:[482,88],NL:[472,78],BE:[470,88],AT:[490,100],CH:[476,102],
  // Southern Europe  
  SCT:[450,62],WLS:[448,78],
  GR:[510,138],IT:[490,120],ES:[448,128],PT:[438,132],MT:[488,142],CY:[535,158],AL:[505,132],BA:[500,122],
  // Eastern Europe
  RO:[510,112],RU:[580,68],PL:[498,85],CZ:[492,90],HU:[502,105],
  UA:[528,95],RS:[505,115],HR:[496,112],BG:[515,118],LT:[503,68],LV:[507,65],EE:[510,58],SK:[498,96],SI:[492,108],MK:[508,125],
  // North Africa
  EG:[530,198],MA:[438,178],TN:[475,165],DZ:[460,172],LY:[492,182],SD:[538,222],
  // West Africa
  NG:[470,228],GH:[455,235],SN:[422,225],ML:[445,218],CI:[450,238],CM:[480,238],BJ:[468,232],TG:[462,234],GN:[435,232],SL:[432,238],BF:[455,222],
  // East Africa
  ET:[542,232],KE:[542,258],TZ:[538,270],UG:[532,252],RW:[530,262],SO:[558,242],ER:[542,218],
  // Southern Africa  
  ZA:[498,375],ZW:[518,338],BW:[508,340],NA:[488,345],MG:[553,328],MZ:[538,330],AO:[482,300],ZM:[518,312],MU:[568,315],
  // Central Africa
  CD:[510,278],
  // North America
  US:[205,128],CA:[195,72],GL:[345,28],
  // Central America
  MX:[185,188],GT:[200,210],HN:[210,212],SV:[205,215],CR:[212,225],PA:[222,230],NI:[208,218],BZ:[205,205],
  // Caribbean
  CU:[228,195],HT:[245,198],JM:[232,202],DO:[252,200],TT:[268,218],PR:[258,200],
  // South America
  BR:[278,310],AR:[262,378],CO:[248,252],PE:[245,288],CL:[252,368],VE:[262,242],EC:[238,268],BO:[265,318],PY:[275,340],UY:[278,365],GY:[270,248],SR:[275,245],
  // Oceania
  AU:[758,345],NZ:[800,378],PG:[758,282],FJ:[808,312],WS:[828,302],TO:[818,318],VU:[795,302],SB:[778,290],
};

// ── Styles ──────────────────────────────────────────────────
const createStyles = (theme) => ({
  app: {
    minHeight: "100vh",
    background: `linear-gradient(180deg, ${theme.bg} 0%, #000000 100%)`,
    color: theme.text,
    fontFamily: "'Crimson Text', 'Noto Serif KR', Georgia, serif",
    position: "relative",
    overflow: "hidden",
  },
  header: {
    textAlign: "center",
    padding: "32px 16px 16px",
    position: "relative",
    zIndex: 2,
  },
  title: {
    fontSize: "clamp(24px, 5vw, 42px)",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    background: `linear-gradient(135deg, ${theme.accent}, #ffffff, ${theme.accent})`,
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    textShadow: "none",
    margin: 0,
    lineHeight: 1.2,
  },
  subtitle: {
    fontSize: "clamp(11px, 2vw, 14px)",
    opacity: 0.5,
    letterSpacing: "0.3em",
    textTransform: "uppercase",
    marginTop: 8,
  },
  stats: {
    display: "flex",
    justifyContent: "center",
    gap: 24,
    marginTop: 12,
    fontSize: "clamp(11px, 1.8vw, 13px)",
    opacity: 0.6,
  },
  continentNav: {
    display: "flex",
    justifyContent: "center",
    gap: 8,
    padding: "12px 16px",
    flexWrap: "wrap",
    position: "relative",
    zIndex: 2,
  },
  continentBtn: (active, color) => ({
    padding: "8px 16px",
    borderRadius: 20,
    border: `1px solid ${active ? color : "#333"}`,
    background: active ? color + "22" : "transparent",
    color: active ? color : "#888",
    cursor: "pointer",
    fontSize: "clamp(11px, 1.8vw, 13px)",
    fontFamily: "'Crimson Text', serif",
    fontWeight: active ? 700 : 400,
    transition: "all 0.3s",
    letterSpacing: "0.05em",
  }),
  mapContainer: {
    position: "relative",
    width: "100%",
    maxWidth: 900,
    margin: "0 auto",
    padding: "0 16px",
    zIndex: 1,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: 16,
    padding: "16px",
    maxWidth: 1200,
    margin: "0 auto",
  },
  card: (theme, highlighted) => ({
    background: highlighted ? theme.card : "#111111",
    border: `1px solid ${highlighted ? theme.border : "#222"}`,
    borderRadius: 12,
    padding: 16,
    cursor: "pointer",
    transition: "all 0.3s ease",
    position: "relative",
    overflow: "hidden",
  }),
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  countryName: {
    fontSize: 16,
    fontWeight: 700,
    letterSpacing: "0.03em",
  },
  iso: {
    fontSize: 11,
    opacity: 0.4,
    fontFamily: "monospace",
  },
  regionTag: (color) => ({
    fontSize: 10,
    padding: "2px 8px",
    borderRadius: 10,
    background: color + "22",
    color: color,
    letterSpacing: "0.05em",
  }),
  beingItem: {
    padding: "8px 0",
    borderBottom: "1px solid #ffffff08",
  },
  beingName: {
    fontSize: 14,
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  beingType: {
    fontSize: 11,
    opacity: 0.5,
    marginTop: 2,
  },
  beingDesc: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 4,
    lineHeight: 1.4,
  },
  fearBar: (level, color) => ({
    display: "flex",
    gap: 2,
    marginTop: 4,
  }),
  fearDot: (filled, color) => ({
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: filled ? color : "#333",
    transition: "all 0.3s",
  }),
  searchBar: {
    display: "flex",
    justifyContent: "center",
    padding: "0 16px 8px",
    position: "relative",
    zIndex: 2,
  },
  searchInput: (color) => ({
    width: "100%",
    maxWidth: 500,
    padding: "10px 16px",
    borderRadius: 24,
    border: `1px solid ${color}44`,
    background: "#00000066",
    color: "#fff",
    fontSize: 14,
    fontFamily: "'Crimson Text', serif",
    outline: "none",
    backdropFilter: "blur(10px)",
  }),
  filterRow: {
    display: "flex",
    justifyContent: "center",
    gap: 6,
    padding: "4px 16px 12px",
    flexWrap: "wrap",
    zIndex: 2,
    position: "relative",
  },
  filterBtn: (active, color) => ({
    padding: "4px 10px",
    borderRadius: 12,
    border: `1px solid ${active ? color : "#333"}`,
    background: active ? color + "18" : "transparent",
    color: active ? color : "#666",
    cursor: "pointer",
    fontSize: 11,
    fontFamily: "'Crimson Text', serif",
    transition: "all 0.2s",
  }),
  modal: {
    position: "fixed",
    inset: 0,
    zIndex: 100,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#000000cc",
    backdropFilter: "blur(8px)",
    padding: 16,
  },
  modalContent: (theme) => ({
    background: `linear-gradient(145deg, ${theme.card}, #0a0a0a)`,
    border: `1px solid ${theme.border}`,
    borderRadius: 16,
    padding: 24,
    maxWidth: 520,
    width: "100%",
    maxHeight: "80vh",
    overflow: "auto",
    position: "relative",
  }),
  closeBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    background: "none",
    border: "none",
    color: "#888",
    fontSize: 20,
    cursor: "pointer",
  },
});

// ── Main Component ──────────────────────────────────────────
export default function FolkloreMap() {
  const [activeContinent, setActiveContinent] = useState("All");
  const [search, setSearch] = useState("");
  const [fearFilter, setFearFilter] = useState(0);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [hoveredCountry, setHoveredCountry] = useState(null);
  const [heatmapMode, setHeatmapMode] = useState("fear"); // "fear", "density", "type"
  const [viewMode, setViewMode] = useState("map"); // "map" or "grid"
  const [activeTab, setActiveTab] = useState("explore"); // "explore","stats","ranking","featured"
  const [encounter, setEncounter] = useState(null);
  const [encounterAnim, setEncounterAnim] = useState(false);
  // Creative Studio states
  const [scenarioResult, setScenarioResult] = useState(null);
  const [scenarioGenre, setScenarioGenre] = useState(null);
  const [scenarioBeings, setScenarioBeings] = useState([]);
  const [charClass, setCharClass] = useState(null);
  const [charCompanion, setCharCompanion] = useState(null);
  const [charOrigin, setCharOrigin] = useState(null);
  const [charMotivation, setCharMotivation] = useState(null);
  const [charName, setCharName] = useState("");
  const [charBuilt, setCharBuilt] = useState(null);
  const [webtoonGenre, setWebtoonGenre] = useState(null);
  const [webtoonBeings, setWebtoonBeings] = useState([]);
  const [webtoonStructure, setWebtoonStructure] = useState(null);
  const [webtoonResult, setWebtoonResult] = useState(null);
  const [loglineMode, setLoglineMode] = useState("auto"); // "auto" or "custom"
  const [customLogline, setCustomLogline] = useState("");
  const [showCredits, setShowCredits] = useState(false);
  // Creature Profile state
  const [profileBeing, setProfileBeing] = useState(null);
  const [profileCountry, setProfileCountry] = useState(null);
  const [profileAnim, setProfileAnim] = useState(false);
  // Compare mode states
  const [compareList, setCompareList] = useState([]);
  const [compareMode, setCompareMode] = useState(false);
  // Advanced filter states
  const [abilityFilter, setAbilityFilter] = useState(null);
  const [genreFilter, setGenreFilter] = useState(null);
  const [typeFilter, setTypeFilter] = useState(null);
  const [visualFilter, setVisualFilter] = useState(null);
  const [ipFilter, setIpFilter] = useState(false);
  const [showAdvFilters, setShowAdvFilters] = useState(false);
  const mapRef = useRef(null);

  const theme = activeContinent === "All"
    ? { bg: "#0a0a0a", accent: "#cc8844", glow: "#cc884422", card: "#1a1410", text: "#eed8c0", border: "#443322" }
    : CONTINENT_COLORS[activeContinent];

  const styles = useMemo(() => createStyles(theme), [activeContinent]);

  const DATA = useMemo(() => FOLKLORE_DATA, []);

  const continents = ["All", "Asia", "Europe", "Africa", "Americas", "Oceania"];

  // Compute unique filter options from data
  const filterOptions = useMemo(() => {
    const abilities = new Map();
    const genres = new Map();
    const types = new Map();
    const visuals = new Map();
    DATA.forEach(c => c.b.forEach(b => {
      if (b.ab) b.ab.forEach(a => { if (a !== "불명") abilities.set(a, (abilities.get(a)||0)+1); });
      if (b.gf) b.gf.forEach(g => genres.set(g, (genres.get(g)||0)+1));
      const t = b.t.replace(/Vengeful /,'').replace(/Evil /,'').replace(/Possessing /,'');
      types.set(t, (types.get(t)||0)+1);
      if (b.vk) b.vk.forEach(v => visuals.set(v, (visuals.get(v)||0)+1));
    }));
    const sortMap = (m) => [...m.entries()].sort((a,b) => b[1]-a[1]);
    return {
      abilities: sortMap(abilities).slice(0, 20),
      genres: sortMap(genres),
      types: sortMap(types).slice(0, 25),
      visuals: sortMap(visuals).slice(0, 20),
    };
  }, [DATA]);

  const activeFilterCount = useMemo(() => {
    let c = 0;
    if (abilityFilter) c++;
    if (genreFilter) c++;
    if (typeFilter) c++;
    if (visualFilter) c++;
    if (ipFilter) c++;
    return c;
  }, [abilityFilter, genreFilter, typeFilter, visualFilter, ipFilter]);

  const filtered = useMemo(() => {
    return DATA.filter((c) => {
      if (activeContinent !== "All" && CONTINENT_MAP[c.r] !== activeContinent) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !c.c.toLowerCase().includes(q) &&
          !c.i.toLowerCase().includes(q) &&
          !c.b.some((b) => b.n.toLowerCase().includes(q) || b.t.toLowerCase().includes(q) || (b.ln && b.ln.toLowerCase().includes(q)))
        )
          return false;
      }
      if (fearFilter > 0) {
        if (!c.b.some((b) => b.f >= fearFilter)) return false;
      }
      // Advanced filters — at least one being in this country must match ALL active filters
      if (abilityFilter || genreFilter || typeFilter || visualFilter || ipFilter) {
        const hasMatch = c.b.some(b => {
          if (abilityFilter && !(b.ab && b.ab.includes(abilityFilter))) return false;
          if (genreFilter && !(b.gf && b.gf.includes(genreFilter))) return false;
          if (typeFilter) {
            const bt = b.t.replace(/Vengeful /,'').replace(/Evil /,'').replace(/Possessing /,'');
            if (bt !== typeFilter) return false;
          }
          if (visualFilter && !(b.vk && b.vk.includes(visualFilter))) return false;
          if (ipFilter && !b.ip) return false;
          return true;
        });
        if (!hasMatch) return false;
      }
      return true;
    });
  }, [DATA, activeContinent, search, fearFilter, abilityFilter, genreFilter, typeFilter, visualFilter, ipFilter]);

  const totalBeings = useMemo(() => filtered.reduce((s, c) => s + c.b.length, 0), [filtered]);
  const typeStats = useMemo(() => getTypeStats(DATA), [DATA]);
  const top5Map = useMemo(() => getTop5ByContinent(DATA), [DATA]);
  const radarData = useMemo(() => getRadarData(DATA), [DATA]);
  const fearSpectrum = useMemo(() => getFearSpectrum(DATA), [DATA]);

  // Fear heatmap intensity per country
  const fearIntensity = useMemo(() => {
    const map = {};
    DATA.forEach(c => {
      const avg = c.b.reduce((s, b) => s + b.f, 0) / c.b.length;
      map[c.i] = avg;
    });
    return map;
  }, [DATA]);

  // Heatmap color helper: interpolate between colors based on value 0-1
  const heatColor = useCallback((value) => {
    // 5-stop gradient: deep blue → cyan → yellow → orange → crimson
    const stops = [
      { pos: 0.0, r: 20, g: 60, b: 180 },  // cool blue
      { pos: 0.25, r: 40, g: 180, b: 200 }, // cyan
      { pos: 0.5, r: 255, g: 210, b: 60 },  // gold
      { pos: 0.75, r: 255, g: 120, b: 30 }, // orange
      { pos: 1.0, r: 220, g: 30, b: 30 },   // crimson
    ];
    const t = Math.max(0, Math.min(1, value));
    let i = 0;
    for (; i < stops.length - 1; i++) {
      if (t <= stops[i + 1].pos) break;
    }
    const s0 = stops[i], s1 = stops[Math.min(i + 1, stops.length - 1)];
    const localT = s0.pos === s1.pos ? 0 : (t - s0.pos) / (s1.pos - s0.pos);
    const r = Math.round(s0.r + (s1.r - s0.r) * localT);
    const g = Math.round(s0.g + (s1.g - s0.g) * localT);
    const b = Math.round(s0.b + (s1.b - s0.b) * localT);
    return `rgb(${r},${g},${b})`;
  }, []);

  // Country heatmap data by mode
  const countryHeatData = useMemo(() => {
    const map = {};
    DATA.forEach(c => {
      const avgFear = c.b.reduce((s, b) => s + b.f, 0) / c.b.length;
      const density = c.b.length; // num beings
      const maxFear = Math.max(...c.b.map(b => b.f));
      map[c.i] = { avgFear, density, maxFear, count: c.b.length };
    });
    // Normalize density
    const maxDensity = Math.max(...Object.values(map).map(v => v.density));
    Object.values(map).forEach(v => { v.normDensity = v.density / maxDensity; });
    return map;
  }, [DATA]);

  // Get heatmap value (0-1) for a country based on current mode
  const getHeatValue = useCallback((iso) => {
    const d = countryHeatData[iso];
    if (!d) return 0;
    if (heatmapMode === "fear") return (d.avgFear - 1) / 9; // 1-10 → 0-1
    if (heatmapMode === "density") return d.normDensity;
    return (d.maxFear - 1) / 4;
  }, [countryHeatData, heatmapMode]);

  const triggerRandomEncounter = useCallback(() => {
    setEncounterAnim(true);
    setTimeout(() => {
      setEncounter(getRandomEncounter(DATA));
      setTimeout(() => setEncounterAnim(false), 50);
    }, 400);
  }, [DATA]);

  const handleCountryClick = useCallback((country) => {
    setSelectedCountry(country);
  }, []);

  // Compare mode helpers
  const toggleCompare = useCallback((being, country) => {
    setCompareList(prev => {
      const key = `${being.id || being.n}-${country}`;
      const exists = prev.find(x => `${x.being.id || x.being.n}-${x.country}` === key);
      if (exists) return prev.filter(x => `${x.being.id || x.being.n}-${x.country}` !== key);
      if (prev.length >= 4) return prev;
      return [...prev, { being, country, continent: CONTINENT_MAP[DATA.find(c => c.c === country)?.r] || "Asia" }];
    });
  }, [DATA]);

  const isInCompare = useCallback((being, country) => {
    return compareList.some(x => (x.being.id || x.being.n) === (being.id || being.n) && x.country === country);
  }, [compareList]);

  // Fear bar component
  const FearBar = ({ level, color }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 1 }}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
          <div
            key={i}
            style={{
              width: 4,
              height: i <= level ? 8 + (i <= level ? Math.min(i, level) * 0.5 : 0) : 6,
              borderRadius: 1,
              background: i <= level ? (level >= 9 ? "#ff2222" : level >= 7 ? "#ff6633" : color) : "#333",
              boxShadow: i <= level && level >= 9 ? "0 0 4px #ff3b3b" : "none",
              transition: "all 0.2s",
            }}
          />
        ))}
      </div>
      <span style={{ fontSize: 9, opacity: 0.5, marginLeft: 2, fontWeight: level >= 9 ? 700 : 400, color: level >= 9 ? "#ff4444" : "inherit" }}>{level}/10</span>
    </div>
  );

  // Being card in modal — enriched with GFS database fields
  const TagPill = ({ text, color, icon }) => (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10, padding: "2px 7px", borderRadius: 8, background: color + "18", color: color, border: `1px solid ${color}30`, marginRight: 4, marginBottom: 3 }}>
      {icon && <span style={{ fontSize: 11 }}>{icon}</span>}{text}
    </span>
  );

  const BeingDetail = ({ being, color, country }) => {
    const [expanded, setExpanded] = React.useState(false);
    const hasExtras = being.ab || being.wk || being.src || being.gf || being.sh || being.vk;
    const inCompare = country ? isInCompare(being, country) : false;
    return (
    <div style={{ padding: "14px 0", borderBottom: "1px solid #ffffff0a", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", right: -10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", opacity: 0.06 }}>
        <Portrait name={being.n} type={being.t} color={color} size={90} />
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start", position: "relative" }}>
        <div style={{ background: color + "15", borderRadius: 10, padding: 4, flexShrink: 0 }}>
          <Portrait name={being.n} type={being.t} color={color} size={36} glow={being.f >= 4} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{being.n}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {country && (
                <button onClick={(e) => { e.stopPropagation(); toggleCompare(being, country); }}
                  style={{
                    padding: "2px 8px", borderRadius: 8, fontSize: 10, cursor: "pointer",
                    border: `1px solid ${inCompare ? "#ff8844" : "#333"}`,
                    background: inCompare ? "#ff884422" : "transparent",
                    color: inCompare ? "#ff8844" : "#666",
                    transition: "all 0.2s", fontFamily: "'Crimson Text', serif",
                  }}>
                  {inCompare ? "⚔ 비교중" : "⚔ 비교"}
                </button>
              )}
              <FearBar level={being.f} color={color} />
            </div>
          </div>
          <div style={{ fontSize: 11, opacity: 0.5, marginTop: 2 }}>
            {being.t}{being.ln ? <span style={{ marginLeft: 6, opacity: 0.7 }}>({being.ln})</span> : null}
          </div>
          <div style={{ fontSize: 13, opacity: 0.7, marginTop: 6, lineHeight: 1.6 }}>{being.d}</div>
          
          {hasExtras && (
            <div style={{ marginTop: 8 }}>
              <div 
                onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                style={{ fontSize: 11, color: color, cursor: "pointer", userSelect: "none", display: "inline-flex", alignItems: "center", gap: 4 }}
              >
                {expanded ? "▾" : "▸"} {expanded ? "접기" : "상세 정보"}
                {being.ip && <span style={{ fontSize: 9, background: "#4caf5030", color: "#4caf50", padding: "1px 5px", borderRadius: 4, marginLeft: 4 }}>IP Ready</span>}
              </div>
              {expanded && (
                <div style={{ marginTop: 8, padding: "8px 10px", background: "#ffffff06", borderRadius: 8, borderLeft: `2px solid ${color}40` }}>
                  {being.ab && being.ab.length > 0 && (
                    <div style={{ marginBottom: 6 }}>
                      <div style={{ fontSize: 10, opacity: 0.4, marginBottom: 3 }}>⚔️ 능력</div>
                      <div style={{ display: "flex", flexWrap: "wrap" }}>{being.ab.map((a,i) => <TagPill key={i} text={a} color={color} />)}</div>
                    </div>
                  )}
                  {being.wk && being.wk.length > 0 && (
                    <div style={{ marginBottom: 6 }}>
                      <div style={{ fontSize: 10, opacity: 0.4, marginBottom: 3 }}>🛡️ 약점</div>
                      <div style={{ display: "flex", flexWrap: "wrap" }}>{being.wk.map((w,i) => <TagPill key={i} text={w} color="#ff9800" />)}</div>
                    </div>
                  )}
                  {being.vk && being.vk.length > 0 && (
                    <div style={{ marginBottom: 6 }}>
                      <div style={{ fontSize: 10, opacity: 0.4, marginBottom: 3 }}>👁️ 외형</div>
                      <div style={{ display: "flex", flexWrap: "wrap" }}>{being.vk.map((v,i) => <TagPill key={i} text={v} color="#9c27b0" />)}</div>
                    </div>
                  )}
                  {being.gf && being.gf.length > 0 && (
                    <div style={{ marginBottom: 6 }}>
                      <div style={{ fontSize: 10, opacity: 0.4, marginBottom: 3 }}>🎬 장르</div>
                      <div style={{ display: "flex", flexWrap: "wrap" }}>{being.gf.map((g,i) => <TagPill key={i} text={g} color="#2196f3" />)}</div>
                    </div>
                  )}
                  {being.sh && being.sh.length > 0 && (
                    <div style={{ marginBottom: 6 }}>
                      <div style={{ fontSize: 10, opacity: 0.4, marginBottom: 3 }}>📖 스토리 훅</div>
                      <div style={{ display: "flex", flexWrap: "wrap" }}>{being.sh.map((s,i) => <TagPill key={i} text={s} color="#00bcd4" />)}</div>
                    </div>
                  )}
                  {being.src && being.src.length > 0 && (
                    <div>
                      <div style={{ fontSize: 10, opacity: 0.4, marginBottom: 3 }}>📜 출처</div>
                      <div style={{ fontSize: 11, opacity: 0.6 }}>{being.src.join(", ")}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );};

  // World Map SVG — Detailed realistic version
  const WorldMap = () => {
    const filteredIsos = new Set(filtered.map((c) => c.i));
    
    // Continent path mapping for fill
    const continentPathMap = {
      NorthAmerica: "Americas", SouthAmerica: "Americas",
      Europe: "Europe", Africa: "Africa", Asia: "Asia", Oceania: "Oceania",
      Japan: "Asia", UKIsland: "Europe", Indonesia: "Asia",
      NewZealand: "Oceania", Madagascar: "Africa", SriLanka: "Asia",
      Philippines: "Asia", Taiwan: "Asia",
    };
    
    return (
      <div style={styles.mapContainer}>
        <svg viewBox="80 5 770 405" style={{ width: "100%", height: "auto", borderRadius: 16, overflow: "hidden" }}>
          <defs>
            <radialGradient id="mapGlow" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor={theme.accent} stopOpacity="0.06" />
              <stop offset="100%" stopColor="#000" stopOpacity="0" />
            </radialGradient>
            <filter id="dotGlow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="softBlur">
              <feGaussianBlur stdDeviation="2" />
            </filter>
            <filter id="heatBlur">
              <feGaussianBlur stdDeviation="8" />
            </filter>
            <filter id="heatBlurMed">
              <feGaussianBlur stdDeviation="5" />
            </filter>
            <linearGradient id="oceanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#060d18" />
              <stop offset="50%" stopColor="#0a1628" />
              <stop offset="100%" stopColor="#060d18" />
            </linearGradient>
            {/* Dynamic heatmap radial gradients for each country */}
            {DATA.map(country => {
              const hVal = getHeatValue(country.i);
              const col = heatColor(hVal);
              return (
                <radialGradient key={`hg-${country.i}`} id={`heatGrad-${country.i}`} cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={col} stopOpacity={0.45 + hVal * 0.25} />
                  <stop offset="40%" stopColor={col} stopOpacity={0.18 + hVal * 0.12} />
                  <stop offset="100%" stopColor={col} stopOpacity="0" />
                </radialGradient>
              );
            })}
          </defs>

          {/* Ocean background */}
          <rect x="80" y="5" width="770" height="405" fill="url(#oceanGrad)" rx="0" />
          
          {/* Atmospheric glow */}
          <rect x="80" y="5" width="770" height="405" fill="url(#mapGlow)" />

          {/* Latitude / Longitude grid */}
          {[60,100,140,180,220,260,300,340,380].map((y,i) => (
            <line key={`lat${i}`} x1="80" y1={y} x2="850" y2={y} stroke="#ffffff" strokeOpacity="0.03" strokeWidth="0.5" strokeDasharray="4 8" />
          ))}
          {[120,180,240,300,360,420,480,540,600,660,720,780,840].map((x,i) => (
            <line key={`lng${i}`} x1={x} y1="5" x2={x} y2="410" stroke="#ffffff" strokeOpacity="0.03" strokeWidth="0.5" strokeDasharray="4 8" />
          ))}
          
          {/* Equator line */}
          <line x1="80" y1="235" x2="850" y2="235" stroke="#ffffff" strokeOpacity="0.06" strokeWidth="0.8" strokeDasharray="6 4" />
          <text x="85" y="232" fill="#ffffff" fillOpacity="0.08" fontSize="6" fontFamily="monospace">EQUATOR</text>

          {/* Continent land masses */}
          {Object.entries(CONTINENT_PATHS).map(([name, path]) => {
            const contKey = continentPathMap[name] || name;
            const isActive = activeContinent === "All" || activeContinent === contKey;
            const cColor = CONTINENT_COLORS[contKey]?.accent || "#444";
            return (
              <g key={name}>
                {/* Shadow layer */}
                <path
                  d={path}
                  fill="none"
                  stroke={isActive ? cColor : "#333"}
                  strokeOpacity={isActive ? 0.08 : 0.03}
                  strokeWidth="8"
                  filter="url(#softBlur)"
                  style={{ transition: "all 0.8s ease" }}
                />
                {/* Main landmass */}
                <path
                  d={path}
                  fill={isActive ? cColor + "12" : "#ffffff05"}
                  stroke={isActive ? cColor + "50" : "#ffffff12"}
                  strokeWidth={isActive ? "1.2" : "0.6"}
                  strokeLinejoin="round"
                  style={{ transition: "all 0.8s ease" }}
                />
                {/* Inner glow for active */}
                {isActive && (
                  <path
                    d={path}
                    fill={cColor + "06"}
                    stroke="none"
                    style={{ transition: "all 0.8s ease" }}
                  />
                )}
              </g>
            );
          })}

          {/* Continent labels */}
          {activeContinent === "All" && [
            { label: "NORTH AMERICA", x: 175, y: 105, cont: "Americas" },
            { label: "SOUTH AMERICA", x: 262, y: 310, cont: "Americas" },
            { label: "EUROPE", x: 480, y: 68, cont: "Europe" },
            { label: "AFRICA", x: 478, y: 270, cont: "Africa" },
            { label: "ASIA", x: 650, y: 110, cont: "Asia" },
            { label: "OCEANIA", x: 768, y: 335, cont: "Oceania" },
          ].map(({ label, x, y, cont }) => (
            <text
              key={label}
              x={x}
              y={y}
              textAnchor="middle"
              fill={CONTINENT_COLORS[cont]?.accent || "#666"}
              fillOpacity={0.15}
              fontSize="9"
              fontFamily="'Crimson Text', serif"
              fontWeight="700"
              letterSpacing="3"
              style={{ pointerEvents: "none" }}
            >
              {label}
            </text>
          ))}

          {/* ── HEATMAP LAYER: Radial heat zones per country ── */}
          <g style={{ mixBlendMode: "screen" }}>
            {DATA.map((country) => {
              const pos = COUNTRY_POSITIONS[country.i];
              if (!pos) return null;
              const isFiltered = filteredIsos.has(country.i);
              if (!isFiltered) return null;
              const hVal = getHeatValue(country.i);
              const baseR = 18 + hVal * 22; // radius 18-40 based on intensity
              return (
                <circle
                  key={`heat-${country.i}`}
                  cx={pos[0]} cy={pos[1]}
                  r={baseR}
                  fill={`url(#heatGrad-${country.i})`}
                  style={{ transition: "all 0.6s ease", pointerEvents: "none" }}
                />
              );
            })}
          </g>

          {/* ── HEATMAP LAYER 2: Soft ambient underlay (blurred large circles) ── */}
          <g style={{ mixBlendMode: "screen" }} filter="url(#heatBlur)">
            {DATA.map((country) => {
              const pos = COUNTRY_POSITIONS[country.i];
              if (!pos) return null;
              const isFiltered = filteredIsos.has(country.i);
              if (!isFiltered) return null;
              const hVal = getHeatValue(country.i);
              const col = heatColor(hVal);
              return (
                <circle
                  key={`heatAmb-${country.i}`}
                  cx={pos[0]} cy={pos[1]}
                  r={14 + hVal * 12}
                  fill={col}
                  opacity={0.06 + hVal * 0.08}
                  style={{ transition: "all 0.6s ease", pointerEvents: "none" }}
                />
              );
            })}
          </g>

          {/* Country dots with heatmap */}
          {DATA.map((country) => {
            const pos = COUNTRY_POSITIONS[country.i];
            if (!pos) return null;
            const isFiltered = filteredIsos.has(country.i);
            const continent = CONTINENT_MAP[country.r];
            const color = CONTINENT_COLORS[continent]?.accent || "#888";
            const isHovered = hoveredCountry === country.i;
            const hVal = getHeatValue(country.i);
            const hCol = heatColor(hVal);
            const avgFear = fearIntensity[country.i] || 0;
            const dotRadius = isHovered ? 7 : (3 + hVal * 3);

            return (
              <g key={country.i} style={{ cursor: isFiltered ? "pointer" : "default" }}>
                {isFiltered ? (
                  <>
                    {/* Outer pulse ring for high intensity */}
                    {hVal >= 0.7 && (
                      <circle
                        cx={pos[0]} cy={pos[1]}
                        r={dotRadius + 6}
                        fill="none"
                        stroke={hCol}
                        strokeOpacity="0.15"
                        strokeWidth="1"
                        style={{ transition: "all 0.4s ease" }}
                      >
                        <animate attributeName="r" from={String(dotRadius + 3)} to={String(dotRadius + 10)} dur="2.5s" repeatCount="indefinite" />
                        <animate attributeName="stroke-opacity" from="0.2" to="0" dur="2.5s" repeatCount="indefinite" />
                      </circle>
                    )}
                    {/* Focused heatmap glow (mid-blur) */}
                    <circle
                      cx={pos[0]} cy={pos[1]}
                      r={isHovered ? dotRadius + 12 : dotRadius + 5}
                      fill={hCol}
                      opacity={isHovered ? 0.25 : 0.1 + hVal * 0.06}
                      filter="url(#heatBlurMed)"
                      style={{ transition: "all 0.3s ease", pointerEvents: "none" }}
                    />
                    {/* Main dot */}
                    <circle
                      cx={pos[0]} cy={pos[1]}
                      r={dotRadius}
                      fill={hCol}
                      opacity={0.92}
                      stroke={isHovered ? "#fff" : hCol}
                      strokeWidth={isHovered ? 1.5 : 0.5}
                      strokeOpacity={isHovered ? 0.9 : 0.3}
                      style={{ transition: "all 0.25s ease" }}
                      onMouseEnter={() => setHoveredCountry(country.i)}
                      onMouseLeave={() => setHoveredCountry(null)}
                      onClick={() => handleCountryClick(country)}
                    />
                    {/* Inner bright core */}
                    <circle
                      cx={pos[0]} cy={pos[1]}
                      r={dotRadius * 0.35}
                      fill="#fff"
                      opacity={isHovered ? 0.8 : 0.45}
                      style={{ pointerEvents: "none", transition: "all 0.25s ease" }}
                    />
                    {/* Hover tooltip */}
                    {isHovered && (
                      <g style={{ pointerEvents: "none" }}>
                        <rect
                          x={pos[0] - 52}
                          y={pos[1] - 34}
                          width={104}
                          height={26}
                          rx={6}
                          fill="#000000dd"
                          stroke={hCol}
                          strokeWidth="0.8"
                          strokeOpacity="0.6"
                        />
                        <text
                          x={pos[0]}
                          y={pos[1] - 20}
                          textAnchor="middle"
                          fill="#fff"
                          fontSize="8"
                          fontFamily="'Crimson Text', serif"
                          fontWeight="600"
                        >
                          {country.c}
                        </text>
                        <text
                          x={pos[0]}
                          y={pos[1] - 11}
                          textAnchor="middle"
                          fill={hCol}
                          fontSize="6.5"
                          fontFamily="'Crimson Text', serif"
                          fontWeight="400"
                          opacity="0.8"
                        >
                          {country.b.length}개 존재 · {heatmapMode === "fear" ? `공포 avg ${avgFear.toFixed(1)}` : heatmapMode === "density" ? `밀도 ${country.b.length}` : `최대 ${countryHeatData[country.i]?.maxFear || 0}`}
                        </text>
                      </g>
                    )}
                  </>
                ) : (
                  <circle cx={pos[0]} cy={pos[1]} r={1.8} fill="#ffffff" opacity={0.08} />
                )}
              </g>
            );
          })}

          {/* Map legend — dynamic heatmap scale */}
          <g transform="translate(90, 358)">
            <rect x="0" y="0" width="170" height="44" rx="8" fill="#000000cc" stroke="#ffffff15" strokeWidth="0.5" />
            <text x="8" y="12" fill="#888" fontSize="5.5" fontFamily="'Crimson Text', serif" fontWeight="600" letterSpacing="1">
              {heatmapMode === "fear" ? "공포도 히트맵" : heatmapMode === "density" ? "존재 밀도 히트맵" : "최대 공포 히트맵"}
            </text>
            {/* Gradient bar */}
            <defs>
              <linearGradient id="legendGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgb(20,60,180)" />
                <stop offset="25%" stopColor="rgb(40,180,200)" />
                <stop offset="50%" stopColor="rgb(255,210,60)" />
                <stop offset="75%" stopColor="rgb(255,120,30)" />
                <stop offset="100%" stopColor="rgb(220,30,30)" />
              </linearGradient>
            </defs>
            <rect x="8" y="17" width="100" height="6" rx="3" fill="url(#legendGrad)" />
            <text x="8" y="32" fill="#666" fontSize="5" fontFamily="monospace">낮음</text>
            <text x="48" y="32" fill="#666" fontSize="5" fontFamily="monospace" textAnchor="middle">중간</text>
            <text x="108" y="32" fill="#666" fontSize="5" fontFamily="monospace" textAnchor="end">높음</text>
            {/* Mode toggle buttons */}
            {[
              { mode: "fear", label: "공포", x: 116 },
              { mode: "density", label: "밀도", x: 136 },
              { mode: "type", label: "최대", x: 156 },
            ].map(({ mode, label, x }) => (
              <g key={mode} style={{ cursor: "pointer" }} onClick={() => setHeatmapMode(mode)}>
                <rect
                  x={x} y="16" width={16} height={12} rx={3}
                  fill={heatmapMode === mode ? theme.accent + "44" : "#ffffff08"}
                  stroke={heatmapMode === mode ? theme.accent : "#ffffff22"}
                  strokeWidth="0.5"
                />
                <text
                  x={x + 8} y={24.5}
                  textAnchor="middle"
                  fill={heatmapMode === mode ? theme.accent : "#666"}
                  fontSize="4.5"
                  fontFamily="'Crimson Text', serif"
                  fontWeight={heatmapMode === mode ? "700" : "400"}
                >
                  {label}
                </text>
              </g>
            ))}
            <text x="135" y="38" fill="#555" fontSize="4" fontFamily="monospace" textAnchor="middle">모드 전환</text>
          </g>
        </svg>
      </div>
    );
  };

  // Country Card
  const CountryCard = ({ country }) => {
    const continent = CONTINENT_MAP[country.r];
    const cTheme = CONTINENT_COLORS[continent] || CONTINENT_COLORS.Asia;
    const maxFear = Math.max(...country.b.map((b) => b.f));

    return (
      <div
        style={{
          ...styles.card(cTheme, true),
          ...(maxFear >= 5 ? { boxShadow: `0 0 20px ${cTheme.accent}15` } : {}),
        }}
        onClick={() => handleCountryClick(country)}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.borderColor = cTheme.accent;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.borderColor = cTheme.border;
        }}
      >
        {/* Accent line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background: `linear-gradient(90deg, transparent, ${cTheme.accent}, transparent)`,
            opacity: 0.6,
          }}
        />

        <div style={styles.cardHeader}>
          <div>
            <div style={styles.countryName}>
              {CONTINENT_EMOJI[continent]} {country.c}
            </div>
            <span style={styles.iso}>{country.i}</span>
          </div>
          <span style={styles.regionTag(cTheme.accent)}>{country.r}</span>
        </div>
        {/* Portrait watermark */}
        <div style={{ position: "absolute", right: -8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", opacity: 0.05 }}>
          <Portrait name={country.b[0]?.n || ""} type={country.b[0]?.t || "Ghost"} color={cTheme.accent} size={120} />
        </div>

        {country.b.slice(0, 2).map((being, i) => (
          <div key={i} style={styles.beingItem}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Portrait name={being.n} type={being.t} color={cTheme.accent} size={20} />
              <span style={{ fontSize: 14, fontWeight: 600 }}>{being.n}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={styles.beingType}>{being.t}</span>
              <FearBar level={being.f} color={cTheme.accent} />
            </div>
          </div>
        ))}
        {country.b.length > 2 && (
          <div style={{ fontSize: 11, opacity: 0.4, marginTop: 6, textAlign: "center" }}>
            +{country.b.length - 2} 더 보기 — 탭하세요
          </div>
        )}
      </div>
    );
  };

  // ── Stats Panel: Type Distribution + Radar + Spectrum ──
  const StatsPanel = () => {
    const [spectrumHover, setSpectrumHover] = useState(null);
    const totalAll = DATA.reduce((s,c)=>s+c.b.length,0);
    return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "16px" }}>
      {/* Section 1: Type Distribution */}
      <h2 style={{ fontSize: 22, fontWeight: 700, textAlign: "center", marginBottom: 4, color: theme.accent }}>
        📊 존재 유형별 분포
      </h2>
      <p style={{ textAlign: "center", fontSize: 12, opacity: 0.5, marginBottom: 20 }}>
        전체 {totalAll}개 존재의 유형별 분류
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 20, justifyContent: "center", alignItems: "flex-start" }}>
        <div style={{ width: 280, height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={typeStats.slice(0,12)} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={50} paddingAngle={2} stroke="none">
                {typeStats.slice(0,12).map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 8, fontSize: 12, fontFamily: "'Crimson Text', serif" }} itemStyle={{ color: "#fff" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div style={{ flex: 1, minWidth: 260 }}>
          <ResponsiveContainer width="100%" height={Math.min(typeStats.length * 28, 400)}>
            <BarChart data={typeStats.slice(0,15)} layout="vertical" margin={{ left: 90, right: 20 }}>
              <XAxis type="number" tick={{ fill: "#666", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: "#aaa", fontSize: 11, fontFamily: "'Crimson Text', serif" }} axisLine={false} tickLine={false} width={85} />
              <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 8, fontSize: 12, fontFamily: "'Crimson Text', serif" }} itemStyle={{ color: "#fff" }} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {typeStats.slice(0,15).map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "linear-gradient(90deg, transparent, #ffffff15, transparent)", margin: "32px 0" }} />

      {/* Section 2: Continent Radar */}
      <h2 style={{ fontSize: 22, fontWeight: 700, textAlign: "center", marginBottom: 4, color: theme.accent }}>
        🕸 대륙별 비교 레이더
      </h2>
      <p style={{ textAlign: "center", fontSize: 12, opacity: 0.5, marginBottom: 20 }}>
        대륙별 민담 풍부도 비교 — 존재 수, 국가 수, 평균 공포도, 타입 다양성
      </p>
      <div style={{ width: "100%", maxWidth: 520, margin: "0 auto", height: 380 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
            <PolarGrid stroke="#ffffff15" />
            <PolarAngleAxis dataKey="metric" tick={{ fill: "#aaa", fontSize: 11, fontFamily: "'Crimson Text', serif" }} />
            <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 100]} />
            {Object.entries(CONTINENT_COLORS).map(([cont, c], i) => (
              <Radar key={cont} name={cont} dataKey={cont} stroke={c.accent} fill={c.accent} fillOpacity={0.12} strokeWidth={2} />
            ))}
            <Legend wrapperStyle={{ fontSize: 11, fontFamily: "'Crimson Text', serif" }} />
            <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 8, fontSize: 12, fontFamily: "'Crimson Text', serif" }} itemStyle={{ color: "#fff" }} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "linear-gradient(90deg, transparent, #ffffff15, transparent)", margin: "32px 0" }} />

      {/* Section 3: Fear Spectrum */}
      <h2 style={{ fontSize: 22, fontWeight: 700, textAlign: "center", marginBottom: 4, color: theme.accent }}>
        🌡 공포도 스펙트럼
      </h2>
      <p style={{ textAlign: "center", fontSize: 12, opacity: 0.5, marginBottom: 20 }}>
        전체 {totalAll}개 존재의 공포도 분포 — 호버하여 탐색하세요
      </p>

      {/* Spectrum Bar */}
      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        {/* The bar */}
        <div style={{ display: "flex", height: 56, borderRadius: 12, overflow: "hidden", border: "1px solid #ffffff15", position: "relative" }}>
          {fearSpectrum.map((bucket) => {
            const pct = (bucket.beings.length / totalAll) * 100;
            const isHovered = spectrumHover === bucket.level;
            return (
              <div
                key={bucket.level}
                onMouseEnter={() => setSpectrumHover(bucket.level)}
                onMouseLeave={() => setSpectrumHover(null)}
                style={{
                  width: `${pct}%`,
                  minWidth: pct > 0 ? 24 : 0,
                  background: isHovered
                    ? `linear-gradient(180deg, ${bucket.color}dd, ${bucket.color}88)`
                    : `linear-gradient(180deg, ${bucket.color}88, ${bucket.color}44)`,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.3s",
                  position: "relative",
                  transform: isHovered ? "scaleY(1.08)" : "scaleY(1)",
                  zIndex: isHovered ? 2 : 1,
                }}
              >
                <span style={{ fontSize: 18 }}>{bucket.level <= 4 ? "😏" : bucket.level <= 5 ? "😨" : bucket.level <= 7 ? "☠️" : bucket.level <= 8 ? "💀" : bucket.level <= 9 ? "🔥" : "⚡"}</span>
                <span style={{ fontSize: 10, color: "#fff", fontWeight: 700 }}>{bucket.beings.length}</span>
              </div>
            );
          })}
        </div>

        {/* Labels */}
        <div style={{ display: "flex", marginTop: 6 }}>
          {fearSpectrum.map((bucket) => {
            const pct = (bucket.beings.length / totalAll) * 100;
            return (
              <div key={bucket.level} style={{ width: `${pct}%`, minWidth: pct > 0 ? 24 : 0, textAlign: "center" }}>
                <span style={{ fontSize: 10, color: bucket.color, fontWeight: spectrumHover === bucket.level ? 700 : 400 }}>
                  {bucket.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Hover detail: show sample beings */}
        {spectrumHover && (() => {
          const bucket = fearSpectrum.find(b => b.level === spectrumHover);
          if (!bucket) return null;
          const samples = bucket.beings.slice(0, 8);
          return (
            <div style={{
              marginTop: 16,
              padding: 16,
              background: `${bucket.color}0a`,
              border: `1px solid ${bucket.color}33`,
              borderRadius: 12,
              transition: "all 0.3s",
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: bucket.color, marginBottom: 8 }}>
                {bucket.label} — 공포 레벨 {bucket.level} ({bucket.beings.length}개 존재)
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {samples.map((b, i) => (
                  <span key={i} style={{
                    fontSize: 11, padding: "3px 10px", borderRadius: 10,
                    background: bucket.color + "15", color: bucket.color,
                    border: `1px solid ${bucket.color}22`,
                  }}>
                    {getTypeIcon(b.t)} {b.n} <span style={{ opacity: 0.5 }}>· {b.country}</span>
                  </span>
                ))}
                {bucket.beings.length > 8 && (
                  <span style={{ fontSize: 11, padding: "3px 10px", opacity: 0.4 }}>
                    +{bucket.beings.length - 8}개 더
                  </span>
                )}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
  };

  // ── Ranking Panel: Top 5 Scariest per Continent ──
  const RankingPanel = () => (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "16px" }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, textAlign: "center", marginBottom: 4, color: theme.accent }}>
        🏆 대륙별 가장 무서운 존재
      </h2>
      <p style={{ textAlign: "center", fontSize: 12, opacity: 0.5, marginBottom: 20 }}>
        각 대륙에서 공포도가 가장 높은 존재 TOP 5
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
        {Object.entries(top5Map).map(([cont, beings]) => {
          const cTheme = CONTINENT_COLORS[cont];
          return (
            <div key={cont} style={{ background: cTheme.card, border: `1px solid ${cTheme.border}`, borderRadius: 12, padding: 16, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${cTheme.accent}, transparent)` }} />
              <h3 style={{ fontSize: 16, fontWeight: 700, color: cTheme.accent, marginBottom: 12 }}>
                {CONTINENT_EMOJI[cont]} {cont}
              </h3>
              {beings.map((b, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < 4 ? "1px solid #ffffff08" : "none" }}>
                  <span style={{ fontSize: 20, fontWeight: 800, color: i === 0 ? "#ffd700" : i === 1 ? "#c0c0c0" : i === 2 ? "#cd7f32" : "#555", width: 26, textAlign: "center", fontFamily: "monospace" }}>
                    {i + 1}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>
                      {getTypeIcon(b.t)} {b.n}
                    </div>
                    <div style={{ fontSize: 11, opacity: 0.5 }}>{b.country} · {b.t}</div>
                  </div>
                  <div style={{ display: "flex", gap: 1, alignItems: "flex-end" }}>
                    {[1,2,3,4,5,6,7,8,9,10].map(j => (
                      <div key={j} style={{ width: 4, height: j <= b.f ? 6 + j * 0.4 : 5, borderRadius: 1, background: j <= b.f ? (b.f >= 9 ? "#ff2222" : b.f >= 7 ? "#ff6633" : cTheme.accent) : "#333", boxShadow: j <= b.f && b.f >= 9 ? "0 0 4px #ff3b3b" : "none" }} />
                    ))}
                    <span style={{ fontSize: 9, opacity: 0.5, marginLeft: 2 }}>{b.f}</span>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );

  // ── Featured Illustrated Cards ──
  const FeaturedCards = () => (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "16px" }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, textAlign: "center", marginBottom: 4, color: theme.accent }}>
        🎴 특집 민담 스포트라이트
      </h2>
      <p style={{ textAlign: "center", fontSize: 12, opacity: 0.5, marginBottom: 20 }}>
        전설적인 민담 전통을 깊이 들여다보는 일러스트 카드
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
        {FEATURED_CARDS.map((card) => {
          const countryData = DATA.find(c => c.i === card.iso);
          const cont = countryData ? CONTINENT_MAP[countryData.r] : "Asia";
          const cTheme = CONTINENT_COLORS[cont];
          return (
            <div
              key={card.iso}
              onClick={() => countryData && handleCountryClick(countryData)}
              style={{
                background: `linear-gradient(145deg, ${card.gradient[0]}, ${card.gradient[1]})`,
                border: `1px solid ${cTheme.border}`,
                borderRadius: 16,
                padding: 0,
                overflow: "hidden",
                cursor: "pointer",
                transition: "all 0.3s",
                position: "relative",
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = `0 8px 30px ${cTheme.accent}22`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
            >
              {/* Art header */}
              <div style={{ height: 120, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 56, background: `radial-gradient(circle at 50% 80%, ${cTheme.accent}15, transparent 60%)`, position: "relative" }}>
                <span style={{ filter: "drop-shadow(0 4px 12px #00000088)" }}>{card.art}</span>
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 40, background: `linear-gradient(transparent, ${card.gradient[1]})` }} />
              </div>
              {/* Content */}
              <div style={{ padding: "0 20px 20px" }}>
                <div style={{ fontSize: 11, color: cTheme.accent, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 4 }}>
                  {card.tagline}
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 8 }}>{card.title}</h3>
                <p style={{ fontSize: 13, lineHeight: 1.6, opacity: 0.7, marginBottom: 12 }}>{card.lore}</p>
                {countryData && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {countryData.b.map((b, i) => (
                      <span key={i} style={{ fontSize: 10, padding: "3px 8px", borderRadius: 10, background: cTheme.accent + "18", color: cTheme.accent, border: `1px solid ${cTheme.accent}33` }}>
                        {getTypeIcon(b.t)} {b.n} {"☠".repeat(b.f >= 7 ? b.f - 6 : 0)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════
  //  🎬 SCENARIO GENERATOR
  // ═══════════════════════════════════════════════════════════════
  const ScenarioGenerator = () => {
    const allBeings = useMemo(() => {
      const arr = [];
      DATA.forEach(c => c.b.forEach(b => arr.push({ ...b, country: c.c, region: c.r, iso: c.i })));
      return arr;
    }, [DATA]);

    const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

    const generateScenario = () => {
      const template = scenarioGenre || pickRandom(SCENARIO_TEMPLATES);
      // Pick 2-3 beings (user-selected or random)
      let beings = scenarioBeings.length >= 1 ? [...scenarioBeings] : [];
      while (beings.length < 2) {
        const b = pickRandom(allBeings);
        if (!beings.find(x => x.n === b.n)) beings.push(b);
      }
      const setting = pickRandom(template.settings);
      const hook = pickRandom(template.hooks);
      const twist = pickRandom(template.twists);
      // Generate chapters
      const chapters = [
        { num: 1, title: "서막 — 균열의 징조", desc: `${setting}에서 ${hook}. ${beings[0].n}의 그림자가 드리워지기 시작한다.` },
        { num: 2, title: "발단 — 첫 번째 조우", desc: `${beings[0].n}(${beings[0].t})과 마주하다. "${beings[0].d}" — 이 존재의 본질이 서서히 드러난다.` },
        { num: 3, title: "전개 — 얽히는 실타래", desc: `${beings.length > 1 ? beings[1].n : "미지의 존재"}(이)가 등장하며 상황이 복잡해진다. ${beings.length > 1 ? beings[1].country : "알 수 없는 땅"}의 전승이 단서가 된다.` },
        { num: 4, title: "위기 — 반전의 순간", desc: twist + ". 모든 것이 뒤집힌다." },
        { num: 5, title: "절정과 결말", desc: `${beings.map(b => b.n).join(", ")}와(과)의 최종 대결. 결말은 열려 있다...` },
      ];
      setScenarioResult({ template, beings, setting, hook, twist, chapters });
    };

    const toggleBeing = (b) => {
      setScenarioBeings(prev => {
        const exists = prev.find(x => x.n === b.n && x.country === b.country);
        if (exists) return prev.filter(x => !(x.n === b.n && x.country === b.country));
        if (prev.length >= 4) return prev;
        return [...prev, b];
      });
    };

    const [beingSearch, setBeingSearch] = useState("");
    const searchedBeings = useMemo(() => {
      if (!beingSearch) return allBeings.slice(0, 20);
      const q = beingSearch.toLowerCase();
      return allBeings.filter(b => b.n.toLowerCase().includes(q) || b.country.toLowerCase().includes(q) || b.t.toLowerCase().includes(q)).slice(0, 20);
    }, [allBeings, beingSearch]);

    return (
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "16px" }}>
        <h2 style={{ fontSize: 26, fontWeight: 700, textAlign: "center", color: theme.accent, marginBottom: 4 }}>
          🎬 시나리오 생성기
        </h2>
        <p style={{ textAlign: "center", fontSize: 13, opacity: 0.5, marginBottom: 24 }}>
          장르와 존재를 선택하면 자동으로 시나리오 플롯이 생성됩니다
        </p>

        {/* Genre Selection */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: theme.accent, letterSpacing: "0.1em" }}>① 장르 선택</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {SCENARIO_TEMPLATES.map(t => (
              <button key={t.id} onClick={() => setScenarioGenre(scenarioGenre?.id === t.id ? null : t)}
                style={{
                  padding: "10px 16px", borderRadius: 12, border: `1px solid ${scenarioGenre?.id === t.id ? theme.accent : "#333"}`,
                  background: scenarioGenre?.id === t.id ? theme.accent + "22" : "#111", color: scenarioGenre?.id === t.id ? theme.accent : "#888",
                  cursor: "pointer", fontSize: 13, fontFamily: "'Crimson Text', serif", transition: "all 0.3s",
                }}>
                <div style={{ fontSize: 18, marginBottom: 4 }}>{t.label}</div>
                <div style={{ fontSize: 11, opacity: 0.6 }}>{t.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Being Selection */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: theme.accent, letterSpacing: "0.1em" }}>
            ② 등장 존재 선택 ({scenarioBeings.length}/4)
          </div>
          {scenarioBeings.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
              {scenarioBeings.map((b, i) => (
                <span key={i} onClick={() => toggleBeing(b)} style={{
                  padding: "5px 12px", borderRadius: 16, background: "#ff444422", border: "1px solid #ff444466",
                  color: "#ff8888", fontSize: 12, cursor: "pointer", transition: "all 0.3s",
                }}>
                  {getTypeIcon(b.t)} {b.n} · {b.country} ✕
                </span>
              ))}
            </div>
          )}
          <input value={beingSearch} onChange={e => setBeingSearch(e.target.value)}
            placeholder="존재 이름, 국가, 유형 검색..."
            style={{ width: "100%", maxWidth: 400, padding: "8px 14px", borderRadius: 20, border: `1px solid ${theme.accent}33`,
              background: "#0a0a0a", color: "#fff", fontSize: 13, fontFamily: "'Crimson Text', serif", outline: "none", marginBottom: 8 }} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, maxHeight: 140, overflow: "auto" }}>
            {searchedBeings.map((b, i) => {
              const selected = scenarioBeings.find(x => x.n === b.n && x.country === b.country);
              return (
                <span key={i} onClick={() => toggleBeing(b)} style={{
                  padding: "4px 10px", borderRadius: 12, fontSize: 11, cursor: "pointer", transition: "all 0.2s",
                  background: selected ? theme.accent + "22" : "#161616",
                  border: `1px solid ${selected ? theme.accent : "#282828"}`,
                  color: selected ? theme.accent : "#888",
                }}>
                  {getTypeIcon(b.t)} {b.n} <span style={{ opacity: 0.5 }}>· {b.country}</span>
                </span>
              );
            })}
          </div>
        </div>

        {/* Generate Button */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <button onClick={generateScenario} style={{
            padding: "14px 36px", borderRadius: 28, border: `2px solid ${theme.accent}`,
            background: `linear-gradient(135deg, ${theme.accent}22, ${theme.accent}08)`,
            color: theme.accent, cursor: "pointer", fontSize: 16, fontWeight: 700,
            fontFamily: "'Crimson Text', serif", letterSpacing: "0.05em", transition: "all 0.3s",
          }}>
            ⚡ 시나리오 생성
          </button>
          <div style={{ fontSize: 11, opacity: 0.4, marginTop: 6 }}>장르 미선택 시 랜덤 · 존재 미선택 시 자동 배정</div>
        </div>

        {/* Result */}
        {scenarioResult && (
          <div style={{ background: "linear-gradient(145deg, #1a1008, #0a0a0a)", border: `1px solid ${theme.accent}44`,
            borderRadius: 20, padding: 28, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 20% 20%, ${theme.accent}08, transparent 60%)`, pointerEvents: "none" }} />
            <div style={{ position: "relative" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <span style={{ fontSize: 28 }}>{scenarioResult.template.label.split(" ")[0]}</span>
                <div>
                  <div style={{ fontSize: 11, color: theme.accent, letterSpacing: "0.2em", textTransform: "uppercase" }}>{scenarioResult.template.name}</div>
                  <h3 style={{ fontSize: 22, fontWeight: 700, color: "#fff" }}>
                    "{scenarioResult.setting}"
                  </h3>
                </div>
              </div>

              {/* Cast */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
                {scenarioResult.beings.map((b, i) => (
                  <div key={i} style={{ padding: "10px 14px", borderRadius: 12, background: "#ffffff06", border: "1px solid #ffffff12", flex: "1 1 200px", minWidth: 180 }}>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>{getTypeIcon(b.t)} {b.n}</div>
                    <div style={{ fontSize: 11, opacity: 0.5 }}>{b.country} · {b.t}</div>
                    <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>{b.d}</div>
                    <div style={{ display: "flex", gap: 2, marginTop: 4 }}>
                      {[1,2,3,4,5,6,7,8,9,10].map(j => <div key={j} style={{ width: 3, height: 3, borderRadius: "50%", background: j <= b.f ? (b.f >= 9 ? "#ff2222" : "#ff6633") : "#333" }} />)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Chapters */}
              <div style={{ borderLeft: `2px solid ${theme.accent}33`, paddingLeft: 20, marginBottom: 16 }}>
                {scenarioResult.chapters.map((ch, i) => (
                  <div key={i} style={{ marginBottom: 16, position: "relative" }}>
                    <div style={{ position: "absolute", left: -27, top: 2, width: 12, height: 12, borderRadius: "50%",
                      background: i === 3 ? "#ff3b3b" : theme.accent, border: "2px solid #0a0a0a" }} />
                    <div style={{ fontSize: 12, color: theme.accent, fontWeight: 600, letterSpacing: "0.1em" }}>
                      CHAPTER {ch.num}
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{ch.title}</div>
                    <div style={{ fontSize: 13, opacity: 0.7, lineHeight: 1.6 }}>{ch.desc}</div>
                  </div>
                ))}
              </div>

              {/* Twist highlight */}
              <div style={{ padding: 16, borderRadius: 12, background: "#ff3b3b0a", border: "1px solid #ff3b3b33", textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "#ff3b3b", letterSpacing: "0.2em", marginBottom: 4 }}>🔥 핵심 반전</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#ffaaaa" }}>{scenarioResult.twist}</div>
              </div>

              <div style={{ textAlign: "center", marginTop: 16 }}>
                <button onClick={generateScenario} style={{
                  padding: "8px 20px", borderRadius: 20, border: `1px solid ${theme.accent}66`,
                  background: "transparent", color: theme.accent, cursor: "pointer", fontSize: 12,
                  fontFamily: "'Crimson Text', serif",
                }}>
                  🎲 다시 생성
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════
  //  🧙 CHARACTER BUILDER
  // ═══════════════════════════════════════════════════════════════
  const CharacterBuilder = () => {
    const allBeings = useMemo(() => {
      const arr = [];
      DATA.forEach(c => c.b.forEach(b => arr.push({ ...b, country: c.c, region: c.r })));
      return arr;
    }, [DATA]);

    const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

    const buildCharacter = () => {
      const cls = charClass || pickRandom(CHARACTER_CLASSES);
      const comp = charCompanion || pickRandom(allBeings);
      const origin = charOrigin || pickRandom(CHARACTER_ORIGINS);
      const motivation = charMotivation || pickRandom(CHARACTER_MOTIVATIONS);
      const name = charName || `${cls.icon} 이름 없는 ${cls.name}`;
      // Companion synergy
      const synergy = (() => {
        if (cls.id === "medium" || cls.id === "shaman") return { label: "영적 공명", desc: `${comp.n}과(와) 깊은 교감을 나누며 그 힘을 빌릴 수 있다`, bonus: "spr" };
        if (cls.id === "hunter") return { label: "사냥 본능", desc: `${comp.n}의 습성을 완벽히 파악해 약점을 공략한다`, bonus: "str" };
        if (cls.id === "scholar") return { label: "지식의 열쇠", desc: `${comp.n}에 대한 고대 기록을 해독해 비밀을 밝힌다`, bonus: "int" };
        if (cls.id === "trickster") return { label: "속임수의 거래", desc: `${comp.n}과(와) 위험한 거래를 맺어 상호 이득을 취한다`, bonus: "cha" };
        if (cls.id === "cursed") return { label: "저주의 공명", desc: `${comp.n}의 어둠과 내면의 저주가 공명하여 강화된다`, bonus: "spr" };
        return { label: "운명적 유대", desc: `${comp.n}과(와) 예기치 못한 유대가 형성된다`, bonus: "cha" };
      })();
      // Boost stats
      const finalStats = { ...cls.stats };
      finalStats[synergy.bonus] = Math.min(5, finalStats[synergy.bonus] + 1);
      setCharBuilt({ name, cls, companion: comp, origin, motivation, synergy, stats: finalStats });
    };

    const [compSearch, setCompSearch] = useState("");
    const searchedComps = useMemo(() => {
      if (!compSearch) return allBeings.slice(0, 16);
      const q = compSearch.toLowerCase();
      return allBeings.filter(b => b.n.toLowerCase().includes(q) || b.country.toLowerCase().includes(q)).slice(0, 16);
    }, [allBeings, compSearch]);

    return (
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "16px" }}>
        <h2 style={{ fontSize: 26, fontWeight: 700, textAlign: "center", color: theme.accent, marginBottom: 4 }}>
          🧙 캐릭터 빌더
        </h2>
        <p style={{ textAlign: "center", fontSize: 13, opacity: 0.5, marginBottom: 24 }}>
          직업, 동료 존재, 배경을 조합하여 나만의 캐릭터를 생성하세요
        </p>

        {/* Name */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: theme.accent }}>이름 (선택)</div>
          <input value={charName} onChange={e => setCharName(e.target.value)} placeholder="캐릭터 이름을 입력하세요..."
            style={{ width: "100%", maxWidth: 300, padding: "8px 14px", borderRadius: 20, border: `1px solid ${theme.accent}33`,
              background: "#0a0a0a", color: "#fff", fontSize: 14, fontFamily: "'Crimson Text', serif", outline: "none" }} />
        </div>

        {/* Class */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: theme.accent }}>① 직업 선택</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 8 }}>
            {CHARACTER_CLASSES.map(c => (
              <div key={c.id} onClick={() => setCharClass(charClass?.id === c.id ? null : c)}
                style={{
                  padding: 12, borderRadius: 12, cursor: "pointer", transition: "all 0.3s",
                  background: charClass?.id === c.id ? theme.accent + "18" : "#111",
                  border: `1px solid ${charClass?.id === c.id ? theme.accent : "#222"}`,
                  textAlign: "center",
                }}>
                <div style={{ fontSize: 24, marginBottom: 4 }}>{c.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: charClass?.id === c.id ? theme.accent : "#ccc" }}>{c.name}</div>
                <div style={{ fontSize: 10, opacity: 0.5, marginTop: 2 }}>{c.desc}</div>
                <div style={{ display: "flex", justifyContent: "center", gap: 3, marginTop: 6 }}>
                  {Object.entries(c.stats).map(([k, v]) => (
                    <div key={k} style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 8, color: STAT_COLORS[k], opacity: 0.7 }}>{STAT_NAMES[k]}</div>
                      <div style={{ display: "flex", gap: 1 }}>
                        {[1,2,3,4,5].map(i => <div key={i} style={{ width: 3, height: 3, borderRadius: "50%", background: i <= v ? STAT_COLORS[k] : "#333" }} />)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Companion Being */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: theme.accent }}>② 동료/관계 존재</div>
          {charCompanion && (
            <div style={{ display: "inline-flex", gap: 6, alignItems: "center", padding: "6px 14px", borderRadius: 16,
              background: "#ff444418", border: "1px solid #ff444444", marginBottom: 8, cursor: "pointer" }}
              onClick={() => setCharCompanion(null)}>
              <span>{getTypeIcon(charCompanion.t)} {charCompanion.n} · {charCompanion.country}</span>
              <span style={{ opacity: 0.5, fontSize: 11 }}>✕</span>
            </div>
          )}
          <input value={compSearch} onChange={e => setCompSearch(e.target.value)} placeholder="존재 검색..."
            style={{ width: "100%", maxWidth: 300, padding: "6px 12px", borderRadius: 16, border: `1px solid #333`,
              background: "#0a0a0a", color: "#fff", fontSize: 12, fontFamily: "'Crimson Text', serif", outline: "none", marginBottom: 6, display: "block" }} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, maxHeight: 100, overflow: "auto" }}>
            {searchedComps.map((b, i) => (
              <span key={i} onClick={() => setCharCompanion(b)} style={{
                padding: "3px 8px", borderRadius: 10, fontSize: 10, cursor: "pointer",
                background: charCompanion?.n === b.n && charCompanion?.country === b.country ? theme.accent + "22" : "#161616",
                border: `1px solid ${charCompanion?.n === b.n && charCompanion?.country === b.country ? theme.accent : "#222"}`,
                color: "#999", transition: "all 0.2s",
              }}>
                {getTypeIcon(b.t)} {b.n} <span style={{ opacity: 0.4 }}>{b.country}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Origin & Motivation */}
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: theme.accent }}>③ 기원</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {CHARACTER_ORIGINS.map((o, i) => (
                <div key={i} onClick={() => setCharOrigin(charOrigin === o ? null : o)} style={{
                  padding: "6px 10px", borderRadius: 8, cursor: "pointer", fontSize: 11, transition: "all 0.2s",
                  background: charOrigin === o ? theme.accent + "18" : "#111", border: `1px solid ${charOrigin === o ? theme.accent + "66" : "#222"}`,
                  color: charOrigin === o ? theme.accent : "#888",
                }}>
                  {o}
                </div>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: theme.accent }}>④ 동기</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {CHARACTER_MOTIVATIONS.map((m, i) => (
                <div key={i} onClick={() => setCharMotivation(charMotivation === m ? null : m)} style={{
                  padding: "6px 10px", borderRadius: 8, cursor: "pointer", fontSize: 11, transition: "all 0.2s",
                  background: charMotivation === m ? theme.accent + "18" : "#111", border: `1px solid ${charMotivation === m ? theme.accent + "66" : "#222"}`,
                  color: charMotivation === m ? theme.accent : "#888",
                }}>
                  {m}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Generate */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <button onClick={buildCharacter} style={{
            padding: "14px 36px", borderRadius: 28, border: `2px solid ${theme.accent}`,
            background: `linear-gradient(135deg, ${theme.accent}22, ${theme.accent}08)`,
            color: theme.accent, cursor: "pointer", fontSize: 16, fontWeight: 700,
            fontFamily: "'Crimson Text', serif", transition: "all 0.3s",
          }}>
            ⚔️ 캐릭터 생성
          </button>
          <div style={{ fontSize: 11, opacity: 0.4, marginTop: 6 }}>미선택 항목은 랜덤 배정</div>
        </div>

        {/* Result Card */}
        {charBuilt && (
          <div style={{ background: "linear-gradient(145deg, #0f0f1a, #0a0a0a)", border: `1px solid ${theme.accent}44`,
            borderRadius: 20, overflow: "hidden" }}>
            {/* Character Header */}
            <div style={{ padding: "28px 28px 0", textAlign: "center", position: "relative" }}>
              <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 50% 0%, ${theme.accent}15, transparent 60%)`, pointerEvents: "none" }} />
              <div style={{ fontSize: 56, marginBottom: 8, position: "relative" }}>{charBuilt.cls.icon}</div>
              <h3 style={{ fontSize: 24, fontWeight: 700, color: "#fff", position: "relative" }}>{charBuilt.name}</h3>
              <div style={{ fontSize: 14, color: theme.accent, position: "relative" }}>{charBuilt.cls.name}</div>
              <div style={{ fontSize: 12, opacity: 0.5, marginTop: 4, position: "relative" }}>{charBuilt.cls.desc}</div>
            </div>

            {/* Stats Radar-like display */}
            <div style={{ padding: "20px 28px" }}>
              <div style={{ display: "flex", justifyContent: "center", gap: 16, marginBottom: 20 }}>
                {Object.entries(charBuilt.stats).map(([k, v]) => (
                  <div key={k} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: STAT_COLORS[k], fontWeight: 600, marginBottom: 4 }}>{STAT_NAMES[k]}</div>
                    <div style={{ display: "flex", flexDirection: "column-reverse", alignItems: "center", gap: 2, height: 50 }}>
                      {[1,2,3,4,5].map(i => (
                        <div key={i} style={{
                          width: 20, height: 8, borderRadius: 3,
                          background: i <= v ? STAT_COLORS[k] : "#222",
                          boxShadow: i <= v ? `0 0 6px ${STAT_COLORS[k]}44` : "none",
                          transition: "all 0.3s",
                        }} />
                      ))}
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: STAT_COLORS[k], marginTop: 4 }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bio sections */}
            <div style={{ padding: "0 28px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ padding: 14, borderRadius: 12, background: "#ffffff06", border: "1px solid #ffffff0a" }}>
                <div style={{ fontSize: 10, color: theme.accent, letterSpacing: "0.15em", marginBottom: 4 }}>기원</div>
                <div style={{ fontSize: 13, opacity: 0.8 }}>{charBuilt.origin}</div>
              </div>
              <div style={{ padding: 14, borderRadius: 12, background: "#ffffff06", border: "1px solid #ffffff0a" }}>
                <div style={{ fontSize: 10, color: theme.accent, letterSpacing: "0.15em", marginBottom: 4 }}>동기</div>
                <div style={{ fontSize: 13, opacity: 0.8 }}>{charBuilt.motivation}</div>
              </div>
              <div style={{ padding: 14, borderRadius: 12, background: "#ff444408", border: "1px solid #ff444422" }}>
                <div style={{ fontSize: 10, color: "#ff8888", letterSpacing: "0.15em", marginBottom: 4 }}>
                  동료 존재 — {charBuilt.companion.n}
                </div>
                <div style={{ fontSize: 13, opacity: 0.8 }}>
                  {getTypeIcon(charBuilt.companion.t)} {charBuilt.companion.n} ({charBuilt.companion.t}) · {charBuilt.companion.country}
                </div>
                <div style={{ fontSize: 11, opacity: 0.5, marginTop: 4 }}>{charBuilt.companion.d}</div>
              </div>
              <div style={{ padding: 14, borderRadius: 12, background: `${theme.accent}08`, border: `1px solid ${theme.accent}22` }}>
                <div style={{ fontSize: 10, color: theme.accent, letterSpacing: "0.15em", marginBottom: 4 }}>
                  🔗 시너지 — {charBuilt.synergy.label}
                </div>
                <div style={{ fontSize: 13, opacity: 0.8 }}>{charBuilt.synergy.desc}</div>
                <div style={{ fontSize: 11, color: STAT_COLORS[charBuilt.synergy.bonus], marginTop: 4 }}>
                  +1 {STAT_NAMES[charBuilt.synergy.bonus]} 보너스
                </div>
              </div>
            </div>

            <div style={{ textAlign: "center", paddingBottom: 20 }}>
              <button onClick={buildCharacter} style={{
                padding: "8px 20px", borderRadius: 20, border: `1px solid ${theme.accent}66`,
                background: "transparent", color: theme.accent, cursor: "pointer", fontSize: 12,
                fontFamily: "'Crimson Text', serif",
              }}>
                🎲 다시 생성
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════
  //  📱 WEBTOON IP DEVELOPMENT
  // ═══════════════════════════════════════════════════════════════
  const WebtoonIPDev = () => {
    const allBeings = useMemo(() => {
      const arr = [];
      DATA.forEach(c => c.b.forEach(b => arr.push({ ...b, country: c.c, region: c.r })));
      return arr;
    }, [DATA]);
    const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

    const [wBeingSearch, setWBeingSearch] = useState("");
    const wSearched = useMemo(() => {
      if (!wBeingSearch) return allBeings.slice(0, 16);
      const q = wBeingSearch.toLowerCase();
      return allBeings.filter(b => b.n.toLowerCase().includes(q) || b.country.toLowerCase().includes(q)).slice(0, 16);
    }, [allBeings, wBeingSearch]);

    const toggleWBeing = (b) => {
      setWebtoonBeings(prev => {
        const exists = prev.find(x => x.n === b.n && x.country === b.country);
        if (exists) return prev.filter(x => !(x.n === b.n && x.country === b.country));
        if (prev.length >= 5) return prev;
        return [...prev, b];
      });
    };

    const generateWebtoonIP = () => {
      const genre = webtoonGenre || pickRandom(WEBTOON_GENRES);
      const structure = webtoonStructure || pickRandom(WEBTOON_STRUCTURES);
      let beings = webtoonBeings.length >= 1 ? [...webtoonBeings] : [];
      while (beings.length < 3) {
        const b = pickRandom(allBeings);
        if (!beings.find(x => x.n === b.n)) beings.push(b);
      }
      // Generate title
      const titles = [
        `${beings[0].n}의 마지막 밤`, `봉인 해제: ${beings[0].country} 편`, `달빛 아래 ${beings[0].t}`,
        `${beings[0].n} — 천 번째 환생`, `어둠의 계약서`, `${beings[0].country}에서 온 그림자`,
        `퇴마록: ${beings.map(b => b.country).filter((v,i,a)=>a.indexOf(v)===i).join("×")}`, `붉은 달이 뜨는 밤`,
      ];
      const title = pickRandom(titles);

      // ── LOGLINE ──
      const loglineTemplates = {
        dark_fantasy: [
          `${beings[0].country}의 봉인이 풀린 밤, ${beings[0].n}의 저주를 받은 주인공이 세계의 균형을 되찾기 위해 대륙을 넘나드는 여정을 시작한다.`,
          `천 년간 잠들어있던 ${beings[0].n}이(가) 깨어나고, 그것을 막을 수 있는 건 ${beings[0].country}의 마지막 퇴마사 혈통뿐이다.`,
          `${beings[1].n}에게 반쪽 영혼을 빼앗긴 주인공이, ${beings[0].n}과 금지된 동맹을 맺고 세계의 어둠에 맞선다.`,
        ],
        horror: [
          `매일 밤 3시, ${beings[0].n}의 목소리가 들린다. 그 소리를 따라간 사람은 아무도 돌아오지 못했다 — 나를 제외하고.`,
          `${beings[0].country}의 폐마을에 도착한 다큐멘터리 팀. 카메라에 찍힌 것은 ${beings[0].n}이 아니라, 자신들의 과거였다.`,
          `실종된 언니를 찾아 ${beings[0].country}에 온 주인공. 마을 사람들은 모두 ${beings[0].n}을(를) 섬기고 있었다.`,
        ],
        romance_fantasy: [
          `인간이 되고 싶은 ${beings[0].n}과, 존재를 사냥하는 퇴마사 집안의 마지막 후손 — 금지된 만남이 시작된다.`,
          `${beings[0].n}은(는) 전생에 사랑했던 인간을 매 환생마다 찾아온다. 이번 생이 마지막 기회.`,
          `빗속에서 만난 ${beings[0].n}. 그의 정체를 알았을 때, 나는 이미 돌이킬 수 없었다.`,
        ],
        action: [
          `전 세계의 봉인이 동시에 풀렸다. ${beings.map(b=>b.country).join(", ")}에서 깨어난 존재들을 상대할 글로벌 퇴마 태스크포스 결성.`,
          `${beings[0].n}의 힘을 몸에 품은 주인공이, 더 강한 존재들을 하나씩 사냥하며 최강의 퇴마사로 성장한다.`,
          `${beings[0].country}의 지하 투기장, 포획된 초자연 존재들의 배틀 로얄. 주인공은 ${beings[0].n}과 팀을 이뤄야 살아남는다.`,
        ],
        comedy: [
          `${beings[0].n}이(가) 현대 서울에 소환됐다. 원룸 월세, 편의점 알바, 배달앱까지 — 공포의 존재의 좌충우돌 인간 적응기.`,
          `다국적 민담 존재 셰어하우스. ${beings.map(b => `${b.country}의 ${b.n}`).join(", ")}이 한 지붕 아래서 벌이는 문화충돌 코미디.`,
          `SNS 인플루언서가 된 ${beings[0].n}. 팔로워 100만 달성하면 인간이 될 수 있다는 전설을 믿고 콘텐츠 제작에 나선다.`,
        ],
        mystery: [
          `연쇄 실종 사건의 현장마다 ${beings[0].n}의 흔적이 남아있다. 민속학 교수 출신 형사의 초자연 수사극.`,
          `${beings[0].country}에서 온 의문의 고서에는 ${beings.map(b=>b.n).join(", ")}의 소환법이 적혀있었다. 고서를 읽은 자들이 하나씩 사라진다.`,
          `국제 민담 학술 회의에서 발표자가 무대 위에서 소멸. 유일한 증거는 ${beings[0].n}을 묘사한 손 그림 한 장.`,
        ],
      };
      const genreKey = genre.id === "romance_fantasy" ? "romance_fantasy" : genre.id;
      const templates = loglineTemplates[genreKey] || loglineTemplates.dark_fantasy;
      const autoLogline = pickRandom(templates);
      const logline = loglineMode === "custom" && customLogline.trim() ? customLogline.trim() : autoLogline;

      // ── TARGETING ──
      const targetingData = {
        dark_fantasy: { primary: "18-34세 남녀", secondary: "판타지/게임 유저", tone: "어둡고 몰입감 있는", platforms: ["네이버웹툰", "카카오페이지", "레진코믹스"], comparable: ["나 혼자만 레벨업", "전지적 독자 시점", "신의 탑"] },
        horror: { primary: "18-30세 남녀", secondary: "공포/스릴러 매니아", tone: "서늘하고 긴장감 있는", platforms: ["네이버웹툰", "봄툰", "투믹스"], comparable: ["스위트홈", "사신소년", "타인은 지옥이다"] },
        romance_fantasy: { primary: "18-35세 여성", secondary: "로맨스판타지 독자", tone: "신비롭고 감성적인", platforms: ["카카오페이지", "리디", "시리즈"], comparable: ["재혼 황후", "어느 날 공주가 되어버렸다", "여주인공의 오빠를 지키는 방법"] },
        action: { primary: "15-30세 남성", secondary: "액션/배틀만화 독자", tone: "열혈 성장 서사", platforms: ["네이버웹툰", "카카오페이지", "레진코믹스"], comparable: ["갓 오브 하이스쿨", "언오디너리", "더 복서"] },
        comedy: { primary: "15-35세 남녀", secondary: "일상/힐링 웹툰 독자", tone: "유쾌하고 따뜻한", platforms: ["네이버웹툰", "카카오웹툰"], comparable: ["유미의 세포들", "놓지마 정신줄", "외모지상주의"] },
        mystery: { primary: "20-40세 남녀", secondary: "추리/미스터리 독자", tone: "지적이고 서스펜스한", platforms: ["네이버웹툰", "카카오페이지", "리디"], comparable: ["살인자ㅇ난감", "모범택시", "D.P"] },
      };
      const targeting = targetingData[genreKey] || targetingData.dark_fantasy;

      // ── CHARACTERS ──
      const charRoles = {
        dark_fantasy: [
          { role: "주인공", archetype: "각성한 퇴마사", traits: ["고독한 과거", "강한 의지", "숨겨진 혈통"], arc: "평범한 인간에서 전설의 퇴마사로" },
          { role: "히로인/히어로", archetype: "존재의 중재자", traits: ["공감 능력", "양면적 충성", "비밀을 품은 자"], arc: "인간과 존재 사이의 다리가 되는 여정" },
          { role: "라이벌", archetype: "타락한 퇴마사", traits: ["뛰어난 재능", "어두운 동기", "비극적 과거"], arc: "적에서 아군으로, 또는 최종 보스로" },
          { role: "멘토", archetype: "은퇴한 전설", traits: ["압도적 지식", "숨겨진 트라우마", "자기희생"], arc: "제자에게 모든 것을 물려주는 최후" },
        ],
        horror: [
          { role: "주인공", archetype: "일반인 생존자", traits: ["평범함", "직관력", "끈질긴 생명력"], arc: "공포를 직면하고 진실을 밝히는 여정" },
          { role: "동료", archetype: "회의적 합리주의자", traits: ["논리적 사고", "감정 억제", "숨겨진 상처"], arc: "믿지 않던 것을 목격하고 무너지는 과정" },
          { role: "경고자", archetype: "미치광이 예언자", traits: ["진실을 아는 자", "아무도 믿지 않는 증인", "과거 피해자"], arc: "무시당하던 경고가 현실이 되는 비극" },
        ],
        romance_fantasy: [
          { role: "주인공", archetype: "운명에 엮인 인간", traits: ["순수한 마음", "강한 호기심", "전생의 기억 편린"], arc: "금지된 사랑을 선택하는 용기" },
          { role: "상대역 (존재)", archetype: "인간을 동경하는 존재", traits: ["아름다운 외모", "고독한 영혼", "치명적 약점"], arc: "사랑을 통해 인간성을 획득/상실" },
          { role: "조연", archetype: "현실의 닻", traits: ["유머 감각", "든든한 지원군", "숨겨진 능력"], arc: "친구에서 핵심 조력자로 성장" },
        ],
        action: [
          { role: "주인공", archetype: "성장형 전사", traits: ["무모한 용기", "숨겨진 잠재력", "정의감"], arc: "약한 신인에서 최강의 퇴마사로" },
          { role: "파트너", archetype: "전략가", traits: ["냉철한 판단", "광범위한 지식", "신체적 약점 보완"], arc: "두뇌로 전투를 뒤집는 참모" },
          { role: "라이벌", archetype: "천재 전사", traits: ["압도적 실력", "고만한 태도", "인정 욕구"], arc: "적에서 최고의 동맹으로" },
        ],
        comedy: [
          { role: "주인공", archetype: "평범한 현대인", traits: ["상식인 대표", "츳코미 담당", "숨은 리더십"], arc: "비일상을 일상으로 받아들이는 과정" },
          { role: "메인 존재", archetype: "순수한 괴물", traits: ["세상 물정 모르는", "엉뚱한 매력", "의외의 먹성"], arc: "인간 세계 적응기와 성장" },
          { role: "조연", archetype: "오타쿠 덕후", traits: ["민담 마니아", "정보통", "사교성 제로"], arc: "존재를 만나 인생이 바뀌는 성장기" },
        ],
        mystery: [
          { role: "주인공", archetype: "민속학 탐정", traits: ["집요한 탐구심", "직감과 논리의 공존", "과거의 트라우마"], arc: "사건을 풀수록 자신의 비밀에 다가감" },
          { role: "파트너", archetype: "영적 감응자", traits: ["존재를 감지하는 능력", "정서적 불안정", "핵심 증거 제공"], arc: "능력의 대가를 치르며 성장" },
          { role: "흑막", archetype: "가면의 조종자", traits: ["뛰어난 카리스마", "이중적 정체성", "거대한 목적"], arc: "반전의 중심에 서는 최종 적" },
        ],
      };
      const charTemplates = charRoles[genreKey] || charRoles.dark_fantasy;
      const characters = charTemplates.map((tmpl, idx) => {
        const relatedBeing = beings[idx] || beings[0];
        return {
          ...tmpl,
          name: idx === 0 ? `주인공 (플레이어 설정)` : tmpl.role,
          relatedBeing: relatedBeing.n,
          relatedCountry: relatedBeing.country,
        };
      });

      // ── EPISODES (enhanced with logline connection) ──
      const eps = [
        { num: "1~3화", title: "프롤로그 — 균열", desc: `평범한 일상에 ${beings[0].n}의 그림자가 침입한다. 주인공은 자신의 능력을 자각하기 시작한다.` },
        { num: "4~10화", title: "제1아크 — 각성", desc: `${beings[0].n}(${beings[0].country})과의 첫 조우와 대결. 주인공의 과거와 존재의 연결이 드러난다.` },
        { num: "11~20화", title: "제2아크 — 확장", desc: `${beings[1].n}(${beings[1].country})이 등장하며 세계관이 확장. 대륙 간 영적 네트워크의 존재를 알게 된다.` },
        { num: "21~30화", title: "제3아크 — 전환", desc: `${beings[2].n}(${beings[2].country})의 등장으로 모든 갈등이 절정. 반전과 함께 시즌 클라이막스.` },
        { num: "시즌2", title: "확장 — 글로벌 서사", desc: `${beings.map(b => b.country).filter((v,i,a)=>a.indexOf(v)===i).join(", ")}를 넘어 전 세계의 존재들이 연결되는 대서사시.` },
      ];
      // Monetization
      const monetization = [
        { item: "웹툰 연재 수익", desc: "플랫폼 유료화/광고 수익 분배", potential: "★★★★☆" },
        { item: "단행본 출간", desc: "시즌별 단행본 + 특별판", potential: "★★★☆☆" },
        { item: "캐릭터 굿즈", desc: `${beings[0].n}, ${beings[1].n} 피규어/아크릴 등`, potential: "★★★★☆" },
        { item: "게임화", desc: "수집형 RPG / 비주얼노벨", potential: "★★★★★" },
        { item: "드라마/애니", desc: "영상화 IP 라이센싱", potential: "★★★★★" },
      ];
      setWebtoonResult({ genre, structure, beings, title, logline, targeting, characters, episodes: eps, monetization });
    };

    return (
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "16px" }}>
        <h2 style={{ fontSize: 26, fontWeight: 700, textAlign: "center", color: theme.accent, marginBottom: 4 }}>
          📱 웹툰 IP 개발
        </h2>
        <p style={{ textAlign: "center", fontSize: 13, opacity: 0.5, marginBottom: 24 }}>
          민담 존재를 활용한 웹툰 기획서를 자동 생성합니다
        </p>

        {/* Logline Mode */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: theme.accent }}>⓪ 로그라인 모드</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <button onClick={() => setLoglineMode("auto")}
              style={{
                padding: "10px 20px", borderRadius: 12, cursor: "pointer", transition: "all 0.3s",
                border: `1px solid ${loglineMode === "auto" ? theme.accent : "#333"}`,
                background: loglineMode === "auto" ? theme.accent + "18" : "#111",
                color: loglineMode === "auto" ? theme.accent : "#888", fontSize: 13, fontFamily: "'Crimson Text', serif",
              }}>
              🎲 자동 생성
              <div style={{ fontSize: 10, opacity: 0.5, marginTop: 2 }}>존재 기반 로그라인 자동 생성</div>
            </button>
            <button onClick={() => setLoglineMode("custom")}
              style={{
                padding: "10px 20px", borderRadius: 12, cursor: "pointer", transition: "all 0.3s",
                border: `1px solid ${loglineMode === "custom" ? "#ff8844" : "#333"}`,
                background: loglineMode === "custom" ? "#ff884418" : "#111",
                color: loglineMode === "custom" ? "#ff8844" : "#888", fontSize: 13, fontFamily: "'Crimson Text', serif",
              }}>
              ✍️ 직접 입력
              <div style={{ fontSize: 10, opacity: 0.5, marginTop: 2 }}>나만의 로그라인으로 기획서 생성</div>
            </button>
          </div>
          {loglineMode === "custom" && (
            <textarea value={customLogline} onChange={e => setCustomLogline(e.target.value)}
              placeholder="로그라인을 입력하세요... (예: 현대 서울에 소환된 구미호가 퇴마사와 손잡고 도시의 어둠에 맞서는 다크 판타지)"
              style={{
                width: "100%", minHeight: 70, padding: "10px 14px", borderRadius: 12, border: `1px solid #ff884444`,
                background: "#0a0a0a", color: "#fff", fontSize: 13, fontFamily: "'Crimson Text', serif",
                outline: "none", resize: "vertical", lineHeight: 1.6,
              }} />
          )}
        </div>

        {/* Genre */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: theme.accent }}>① 장르</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {WEBTOON_GENRES.map(g => (
              <button key={g.id} onClick={() => setWebtoonGenre(webtoonGenre?.id === g.id ? null : g)}
                style={{
                  padding: "10px 16px", borderRadius: 12, cursor: "pointer", transition: "all 0.3s",
                  border: `1px solid ${webtoonGenre?.id === g.id ? g.color : "#333"}`,
                  background: webtoonGenre?.id === g.id ? g.color + "18" : "#111",
                  color: webtoonGenre?.id === g.id ? g.color : "#888", fontSize: 13, fontFamily: "'Crimson Text', serif",
                }}>
                <span style={{ fontSize: 18 }}>{g.icon}</span> {g.name}
                <div style={{ fontSize: 10, opacity: 0.5, marginTop: 2 }}>{g.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Structure */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: theme.accent }}>② 연재 구조</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {WEBTOON_STRUCTURES.map((s, i) => (
              <div key={i} onClick={() => setWebtoonStructure(webtoonStructure?.name === s.name ? null : s)}
                style={{
                  padding: "10px 14px", borderRadius: 12, cursor: "pointer", flex: "1 1 180px", minWidth: 160, transition: "all 0.3s",
                  border: `1px solid ${webtoonStructure?.name === s.name ? theme.accent : "#333"}`,
                  background: webtoonStructure?.name === s.name ? theme.accent + "18" : "#111",
                  color: webtoonStructure?.name === s.name ? theme.accent : "#888",
                }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{s.name}</div>
                <div style={{ fontSize: 10, opacity: 0.5 }}>{s.desc}</div>
                <div style={{ fontSize: 10, color: theme.accent, marginTop: 4, opacity: 0.7 }}>{s.episodes}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Beings */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: theme.accent }}>③ 핵심 존재 ({webtoonBeings.length}/5)</div>
          {webtoonBeings.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
              {webtoonBeings.map((b, i) => (
                <span key={i} onClick={() => toggleWBeing(b)} style={{
                  padding: "4px 10px", borderRadius: 14, background: "#ff444418", border: "1px solid #ff444444",
                  color: "#ff8888", fontSize: 11, cursor: "pointer",
                }}>
                  {getTypeIcon(b.t)} {b.n} · {b.country} ✕
                </span>
              ))}
            </div>
          )}
          <input value={wBeingSearch} onChange={e => setWBeingSearch(e.target.value)} placeholder="존재 검색..."
            style={{ width: "100%", maxWidth: 300, padding: "6px 12px", borderRadius: 16, border: "1px solid #333",
              background: "#0a0a0a", color: "#fff", fontSize: 12, fontFamily: "'Crimson Text', serif", outline: "none", marginBottom: 6 }} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, maxHeight: 100, overflow: "auto" }}>
            {wSearched.map((b, i) => {
              const sel = webtoonBeings.find(x => x.n === b.n && x.country === b.country);
              return (
                <span key={i} onClick={() => toggleWBeing(b)} style={{
                  padding: "3px 8px", borderRadius: 10, fontSize: 10, cursor: "pointer",
                  background: sel ? theme.accent + "22" : "#161616", border: `1px solid ${sel ? theme.accent : "#222"}`,
                  color: "#999", transition: "all 0.2s",
                }}>
                  {getTypeIcon(b.t)} {b.n} <span style={{ opacity: 0.4 }}>{b.country}</span>
                </span>
              );
            })}
          </div>
        </div>

        {/* Generate */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <button onClick={generateWebtoonIP} style={{
            padding: "14px 36px", borderRadius: 28, border: `2px solid ${theme.accent}`,
            background: `linear-gradient(135deg, ${theme.accent}22, ${theme.accent}08)`,
            color: theme.accent, cursor: "pointer", fontSize: 16, fontWeight: 700,
            fontFamily: "'Crimson Text', serif", transition: "all 0.3s",
          }}>
            📱 IP 기획서 생성
          </button>
        </div>

        {/* Result */}
        {webtoonResult && (
          <div style={{ background: "linear-gradient(145deg, #0a0f1a, #0a0a0a)", border: `1px solid ${webtoonResult.genre.color}44`,
            borderRadius: 20, overflow: "hidden" }}>
            {/* Header */}
            <div style={{ padding: 28, textAlign: "center", position: "relative",
              background: `linear-gradient(180deg, ${webtoonResult.genre.color}12, transparent)` }}>
              <div style={{ fontSize: 11, color: webtoonResult.genre.color, letterSpacing: "0.3em", textTransform: "uppercase" }}>
                WEBTOON IP PROPOSAL
              </div>
              <h3 style={{ fontSize: 28, fontWeight: 700, color: "#fff", marginTop: 8, marginBottom: 4 }}>
                {webtoonResult.title}
              </h3>
              <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 8 }}>
                <span style={{ padding: "4px 12px", borderRadius: 12, background: webtoonResult.genre.color + "22",
                  color: webtoonResult.genre.color, fontSize: 12, border: `1px solid ${webtoonResult.genre.color}44` }}>
                  {webtoonResult.genre.icon} {webtoonResult.genre.name}
                </span>
                <span style={{ padding: "4px 12px", borderRadius: 12, background: "#ffffff08", color: "#aaa", fontSize: 12, border: "1px solid #ffffff15" }}>
                  📐 {webtoonResult.structure.name} · {webtoonResult.structure.episodes}
                </span>
              </div>
            </div>

            {/* LOGLINE */}
            <div style={{ padding: "0 28px 24px" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: webtoonResult.genre.color, marginBottom: 10, letterSpacing: "0.1em" }}>
                📝 로그라인
              </div>
              <div style={{
                padding: 20, borderRadius: 14,
                background: `linear-gradient(135deg, ${webtoonResult.genre.color}08, #0a0a0a)`,
                border: `1px solid ${webtoonResult.genre.color}33`,
                position: "relative", overflow: "hidden",
              }}>
                <div style={{ position: "absolute", top: 10, left: 16, fontSize: 32, opacity: 0.08, lineHeight: 1 }}>"</div>
                <p style={{ fontSize: 15, lineHeight: 1.8, color: "#eee", fontStyle: "italic", margin: 0, position: "relative", paddingLeft: 4 }}>
                  {webtoonResult.logline}
                </p>
                <div style={{ position: "absolute", bottom: 6, right: 16, fontSize: 32, opacity: 0.08, lineHeight: 1 }}>"</div>
              </div>
            </div>

            {/* TARGETING */}
            <div style={{ padding: "0 28px 24px" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: webtoonResult.genre.color, marginBottom: 10, letterSpacing: "0.1em" }}>
                🎯 타겟팅
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
                <div style={{ padding: 14, borderRadius: 12, background: "#ffffff06", border: "1px solid #ffffff0a" }}>
                  <div style={{ fontSize: 10, color: webtoonResult.genre.color, fontWeight: 600, marginBottom: 6 }}>주요 타겟층</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>{webtoonResult.targeting.primary}</div>
                  <div style={{ fontSize: 11, opacity: 0.5, marginTop: 4 }}>부타겟: {webtoonResult.targeting.secondary}</div>
                </div>
                <div style={{ padding: 14, borderRadius: 12, background: "#ffffff06", border: "1px solid #ffffff0a" }}>
                  <div style={{ fontSize: 10, color: webtoonResult.genre.color, fontWeight: 600, marginBottom: 6 }}>작품 톤</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{webtoonResult.targeting.tone}</div>
                  <div style={{ fontSize: 11, opacity: 0.5, marginTop: 4 }}>추천 플랫폼: {webtoonResult.targeting.platforms.join(", ")}</div>
                </div>
                <div style={{ padding: 14, borderRadius: 12, background: "#ffffff06", border: "1px solid #ffffff0a" }}>
                  <div style={{ fontSize: 10, color: webtoonResult.genre.color, fontWeight: 600, marginBottom: 6 }}>비교 작품</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 2 }}>
                    {webtoonResult.targeting.comparable.map((c, i) => (
                      <span key={i} style={{ padding: "3px 8px", borderRadius: 8, background: webtoonResult.genre.color + "15", border: `1px solid ${webtoonResult.genre.color}30`, color: webtoonResult.genre.color, fontSize: 11 }}>
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* CHARACTERS */}
            <div style={{ padding: "0 28px 24px" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: webtoonResult.genre.color, marginBottom: 10, letterSpacing: "0.1em" }}>
                👥 주요 등장인물
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {webtoonResult.characters.map((ch, i) => (
                  <div key={i} style={{
                    padding: 16, borderRadius: 14,
                    background: i === 0 ? `linear-gradient(135deg, ${webtoonResult.genre.color}10, #0a0a0a)` : "#ffffff04",
                    border: `1px solid ${i === 0 ? webtoonResult.genre.color + "44" : "#ffffff0a"}`,
                    position: "relative", overflow: "hidden",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <div>
                        <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 8, background: i === 0 ? webtoonResult.genre.color + "22" : "#ffffff0a", color: i === 0 ? webtoonResult.genre.color : "#888", fontWeight: 600, marginRight: 8 }}>
                          {ch.role}
                        </span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{ch.archetype}</span>
                      </div>
                      <span style={{ fontSize: 10, opacity: 0.4 }}>연관: {ch.relatedBeing} ({ch.relatedCountry})</span>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
                      {ch.traits.map((trait, j) => (
                        <span key={j} style={{ padding: "2px 8px", borderRadius: 6, background: "#ffffff08", color: "#aaa", fontSize: 10, border: "1px solid #ffffff0a" }}>
                          {trait}
                        </span>
                      ))}
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.6, lineHeight: 1.5, fontStyle: "italic" }}>
                      캐릭터 아크: {ch.arc}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cast (beings) */}
            <div style={{ padding: "0 28px 20px" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: webtoonResult.genre.color, marginBottom: 10, letterSpacing: "0.1em" }}>
                🐉 등장 존재 (크리처 캐스팅)
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {webtoonResult.beings.map((b, i) => (
                  <div key={i} style={{ flex: "1 1 160px", padding: 12, borderRadius: 12, background: "#ffffff06", border: "1px solid #ffffff0a", minWidth: 150 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{getTypeIcon(b.t)} {b.n}</div>
                    <div style={{ fontSize: 10, opacity: 0.5 }}>{b.country} · {b.t} · 공포 {b.f}</div>
                    <div style={{ fontSize: 10, opacity: 0.5, marginTop: 3, lineHeight: 1.4 }}>{b.d?.slice(0, 60)}...</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Episode Arc */}
            <div style={{ padding: "0 28px 20px" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: webtoonResult.genre.color, marginBottom: 10, letterSpacing: "0.1em" }}>
                에피소드 구성
              </div>
              <div style={{ borderLeft: `2px solid ${webtoonResult.genre.color}33`, paddingLeft: 16 }}>
                {webtoonResult.episodes.map((ep, i) => (
                  <div key={i} style={{ marginBottom: 14, position: "relative" }}>
                    <div style={{ position: "absolute", left: -23, top: 2, width: 10, height: 10, borderRadius: "50%",
                      background: i <= 3 ? webtoonResult.genre.color : "#666", border: "2px solid #0a0a0a" }} />
                    <div style={{ fontSize: 11, color: webtoonResult.genre.color, fontWeight: 600 }}>{ep.num}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{ep.title}</div>
                    <div style={{ fontSize: 12, opacity: 0.6, lineHeight: 1.5 }}>{ep.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* IP Expansion */}
            <div style={{ padding: "0 28px 20px" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: webtoonResult.genre.color, marginBottom: 10, letterSpacing: "0.1em" }}>
                IP 확장 & 수익화
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8 }}>
                {webtoonResult.monetization.map((m, i) => (
                  <div key={i} style={{ padding: 12, borderRadius: 10, background: "#ffffff04", border: "1px solid #ffffff0a" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#ccc" }}>{m.item}</div>
                    <div style={{ fontSize: 10, opacity: 0.5 }}>{m.desc}</div>
                    <div style={{ fontSize: 12, color: "#ffcc44", marginTop: 4 }}>{m.potential}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Multi-media expansion */}
            <div style={{ padding: "0 28px 24px" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: webtoonResult.genre.color, marginBottom: 10, letterSpacing: "0.1em" }}>
                멀티미디어 확장 로드맵
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {IP_EXPANSION.map((ip, i) => (
                  <div key={i} style={{ padding: "10px 14px", borderRadius: 12, background: "#ffffff06", border: "1px solid #ffffff0a",
                    textAlign: "center", flex: "1 1 100px", minWidth: 90 }}>
                    <div style={{ fontSize: 22, marginBottom: 4 }}>{ip.icon}</div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#ccc" }}>{ip.name}</div>
                    <div style={{ fontSize: 9, opacity: 0.4, marginTop: 2 }}>{ip.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ textAlign: "center", paddingBottom: 20 }}>
              <button onClick={generateWebtoonIP} style={{
                padding: "8px 20px", borderRadius: 20, border: `1px solid ${webtoonResult.genre.color}66`,
                background: "transparent", color: webtoonResult.genre.color, cursor: "pointer", fontSize: 12,
                fontFamily: "'Crimson Text', serif",
              }}>
                🎲 다시 생성
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════
  //  ⚔ COMPARE PANEL — Side-by-side Creature Comparison
  // ═══════════════════════════════════════════════════════════════
  const ComparePanel = () => {
    const [compSearch, setCompSearch] = useState("");
    const allBeings = useMemo(() => {
      const arr = [];
      DATA.forEach(c => c.b.forEach(b => arr.push({ ...b, country: c.c, region: c.r, iso: c.i, continent: CONTINENT_MAP[c.r] })));
      return arr;
    }, [DATA]);

    const searchedBeings = useMemo(() => {
      if (!compSearch) return allBeings.slice(0, 24);
      const q = compSearch.toLowerCase();
      return allBeings.filter(b => b.n.toLowerCase().includes(q) || b.country.toLowerCase().includes(q) || b.t.toLowerCase().includes(q) || (b.ln && b.ln.toLowerCase().includes(q))).slice(0, 24);
    }, [allBeings, compSearch]);

    const addToCompare = (b) => {
      setCompareList(prev => {
        if (prev.length >= 4) return prev;
        if (prev.find(x => (x.being.id || x.being.n) === (b.id || b.n) && x.country === b.country)) return prev;
        return [...prev, { being: b, country: b.country, continent: b.continent }];
      });
    };

    const removeFromCompare = (idx) => {
      setCompareList(prev => prev.filter((_, i) => i !== idx));
    };

    // Build compare radar data
    const compareRadar = useMemo(() => {
      if (compareList.length < 2) return [];
      const metrics = ["공포도", "능력 수", "약점 수", "장르 수", "스토리훅 수"];
      return metrics.map(m => {
        const row = { metric: m };
        compareList.forEach((item, i) => {
          const b = item.being;
          if (m === "공포도") row[`c${i}`] = (b.f / 10) * 100;
          else if (m === "능력 수") row[`c${i}`] = b.ab ? Math.min((b.ab.filter(a=>a!=="불명").length / 5) * 100, 100) : 0;
          else if (m === "약점 수") row[`c${i}`] = b.wk ? Math.min((b.wk.filter(w=>w!=="없음(수호수 계열)"&&w!=="없음(절대적 존재)"&&w!=="불명"&&w!=="없음(현대 도시전설)"&&w!=="불명(통제 불능이 핵심)").length / 4) * 100, 100) : 0;
          else if (m === "장르 수") row[`c${i}`] = b.gf ? Math.min((b.gf.length / 4) * 100, 100) : 0;
          else if (m === "스토리훅 수") row[`c${i}`] = b.sh ? Math.min((b.sh.length / 4) * 100, 100) : 0;
        });
        return row;
      });
    }, [compareList]);

    const COMP_COLORS = ["#ff4466", "#44aaff", "#44ff88", "#ffaa44"];

    return (
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "16px" }}>
        <h2 style={{ fontSize: 26, fontWeight: 700, textAlign: "center", color: theme.accent, marginBottom: 4 }}>
          ⚔ 크리처 비교 · VS Mode
        </h2>
        <p style={{ textAlign: "center", fontSize: 13, opacity: 0.5, marginBottom: 24 }}>
          최대 4개 존재를 선택하여 능력·약점·장르를 비교하세요
        </p>

        {/* Search & Add */}
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <input value={compSearch} onChange={e => setCompSearch(e.target.value)}
            placeholder="존재 이름, 국가, 유형으로 검색..."
            style={{ width: "100%", maxWidth: 480, padding: "10px 16px", borderRadius: 24,
              border: `1px solid ${theme.accent}33`, background: "#0a0a0a", color: "#fff",
              fontSize: 13, fontFamily: "'Crimson Text', serif", outline: "none" }} />
        </div>

        {/* Being picker */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", marginBottom: 20, maxHeight: 160, overflow: "auto", padding: "4px 0" }}>
          {searchedBeings.map((b, i) => {
            const inList = compareList.find(x => (x.being.id || x.being.n) === (b.id || b.n) && x.country === b.country);
            return (
              <span key={`${b.id||b.n}-${b.country}-${i}`} onClick={() => inList ? removeFromCompare(compareList.indexOf(inList)) : addToCompare(b)}
                style={{
                  padding: "5px 11px", borderRadius: 14, fontSize: 11, cursor: "pointer", transition: "all 0.2s",
                  background: inList ? theme.accent + "22" : "#111",
                  border: `1px solid ${inList ? theme.accent : "#282828"}`,
                  color: inList ? theme.accent : "#888",
                }}>
                {getTypeIcon(b.t)} {b.n} <span style={{ opacity: 0.5 }}>· {b.country}</span>
                {b.f >= 8 && <span style={{ marginLeft: 3, fontSize: 9 }}>{"🔥".repeat(Math.min(b.f - 7, 3))}</span>}
              </span>
            );
          })}
        </div>

        {/* Selected slots */}
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 28, flexWrap: "wrap" }}>
          {[0,1,2,3].map(i => {
            const item = compareList[i];
            return (
              <div key={i} style={{
                width: 160, height: 48, borderRadius: 12,
                border: `2px dashed ${item ? COMP_COLORS[i] : "#333"}`,
                background: item ? COMP_COLORS[i] + "10" : "#0a0a0a",
                display: "flex", alignItems: "center", justifyContent: "center",
                gap: 6, fontSize: 12, color: item ? COMP_COLORS[i] : "#444",
                transition: "all 0.3s", cursor: item ? "pointer" : "default",
              }} onClick={() => item && removeFromCompare(i)}>
                {item ? (
                  <>
                    <Portrait name={item.being.n} type={item.being.t} color={COMP_COLORS[i]} size={28} />
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 100 }}>
                      <div style={{ fontSize: 12, fontWeight: 700 }}>{item.being.n.split("(")[0].trim()}</div>
                      <div style={{ fontSize: 9, opacity: 0.6 }}>{item.country} · ✕제거</div>
                    </div>
                  </>
                ) : (
                  <span style={{ fontSize: 18 }}>+</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Comparison content */}
        {compareList.length >= 2 && (
          <div>
            {/* VS Header */}
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: "0.1em",
                background: `linear-gradient(90deg, ${COMP_COLORS[0]}, ${COMP_COLORS[1]}${compareList.length > 2 ? `, ${COMP_COLORS[2]}` : ""}${compareList.length > 3 ? `, ${COMP_COLORS[3]}` : ""})`,
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                {compareList.map((x, i) => x.being.n.split("(")[0].trim()).join(" vs ")}
              </div>
            </div>

            {/* Radar Chart */}
            <div style={{ width: "100%", maxWidth: 480, margin: "0 auto 32px", height: 340 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={compareRadar} cx="50%" cy="50%" outerRadius="68%">
                  <PolarGrid stroke="#ffffff15" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: "#aaa", fontSize: 11, fontFamily: "'Crimson Text', serif" }} />
                  <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 100]} />
                  {compareList.map((_, i) => (
                    <Radar key={i} name={compareList[i].being.n.split("(")[0].trim()} dataKey={`c${i}`}
                      stroke={COMP_COLORS[i]} fill={COMP_COLORS[i]} fillOpacity={0.15} strokeWidth={2.5} />
                  ))}
                  <Legend wrapperStyle={{ fontSize: 11, fontFamily: "'Crimson Text', serif" }} />
                  <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 8, fontSize: 12 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Detail comparison cards */}
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(compareList.length, 4)}, 1fr)`, gap: 12 }}>
              {compareList.map((item, i) => {
                const b = item.being;
                const cTheme = CONTINENT_COLORS[item.continent] || CONTINENT_COLORS.Asia;
                return (
                  <div key={i} style={{
                    background: `linear-gradient(145deg, ${COMP_COLORS[i]}08, #0a0a0a)`,
                    border: `1px solid ${COMP_COLORS[i]}44`,
                    borderRadius: 16, padding: 16, position: "relative", overflow: "hidden",
                  }}>
                    {/* Accent top */}
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: COMP_COLORS[i] }} />

                    {/* Portrait */}
                    <div style={{ textAlign: "center", marginBottom: 10 }}>
                      <div style={{ display: "inline-block", background: COMP_COLORS[i] + "15", borderRadius: 16, padding: 8 }}>
                        <Portrait name={b.n} type={b.t} color={COMP_COLORS[i]} size={56} glow={b.f >= 7} />
                      </div>
                    </div>

                    <div style={{ textAlign: "center", marginBottom: 8 }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: COMP_COLORS[i] }}>{b.n}</div>
                      {b.ln && <div style={{ fontSize: 11, opacity: 0.5 }}>{b.ln}</div>}
                      <div style={{ fontSize: 11, opacity: 0.5, marginTop: 2 }}>{item.country} · {b.t}</div>
                      <div style={{ display: "flex", justifyContent: "center", gap: 2, marginTop: 6 }}>
                        {[1,2,3,4,5,6,7,8,9,10].map(j => <div key={j} style={{ width: 5, height: 5, borderRadius: "50%", background: j <= b.f ? (b.f >= 8 ? "#ff3b3b" : COMP_COLORS[i]) : "#333", boxShadow: j <= b.f && b.f >= 9 ? "0 0 6px #ff3b3b" : "none" }} />)}
                      </div>
                    </div>

                    <div style={{ fontSize: 12, opacity: 0.65, lineHeight: 1.5, marginBottom: 10, textAlign: "center" }}>{b.d}</div>

                    {/* Attributes */}
                    {b.ab && b.ab.length > 0 && b.ab[0] !== "불명" && (
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: 10, opacity: 0.4, marginBottom: 3 }}>⚔️ 능력</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                          {b.ab.filter(a=>a!=="불명").map((a,j) => <span key={j} style={{ fontSize: 9, padding: "2px 6px", borderRadius: 6, background: COMP_COLORS[i]+"15", color: COMP_COLORS[i], border: `1px solid ${COMP_COLORS[i]}25` }}>{a}</span>)}
                        </div>
                      </div>
                    )}
                    {b.wk && b.wk.length > 0 && (
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: 10, opacity: 0.4, marginBottom: 3 }}>🛡️ 약점</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                          {b.wk.map((w,j) => <span key={j} style={{ fontSize: 9, padding: "2px 6px", borderRadius: 6, background: "#ff980015", color: "#ff9800", border: "1px solid #ff980025" }}>{w}</span>)}
                        </div>
                      </div>
                    )}
                    {b.gf && b.gf.length > 0 && (
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: 10, opacity: 0.4, marginBottom: 3 }}>🎬 장르</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                          {b.gf.map((g,j) => <span key={j} style={{ fontSize: 9, padding: "2px 6px", borderRadius: 6, background: "#2196f315", color: "#2196f3", border: "1px solid #2196f325" }}>{g}</span>)}
                        </div>
                      </div>
                    )}
                    {b.sh && b.sh.length > 0 && (
                      <div>
                        <div style={{ fontSize: 10, opacity: 0.4, marginBottom: 3 }}>📖 스토리훅</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                          {b.sh.map((s,j) => <span key={j} style={{ fontSize: 9, padding: "2px 6px", borderRadius: 6, background: "#00bcd415", color: "#00bcd4", border: "1px solid #00bcd425" }}>{s}</span>)}
                        </div>
                      </div>
                    )}
                    {b.ip && <div style={{ textAlign: "center", marginTop: 8 }}><span style={{ fontSize: 9, background: "#4caf5025", color: "#4caf50", padding: "2px 8px", borderRadius: 6 }}>✅ IP Ready</span></div>}
                  </div>
                );
              })}
            </div>

            {/* Shared traits analysis */}
            {compareList.length >= 2 && (() => {
              const allAb = compareList.map(x => new Set(x.being.ab?.filter(a=>a!=="불명") || []));
              const allGf = compareList.map(x => new Set(x.being.gf || []));
              const allSh = compareList.map(x => new Set(x.being.sh || []));
              const sharedAb = [...allAb[0]].filter(a => allAb.every(s => s.has(a)));
              const sharedGf = [...allGf[0]].filter(g => allGf.every(s => s.has(g)));
              const sharedSh = [...allSh[0]].filter(s => allSh.every(set => set.has(s)));
              const hasShared = sharedAb.length > 0 || sharedGf.length > 0 || sharedSh.length > 0;
              if (!hasShared) return null;
              return (
                <div style={{ marginTop: 24, padding: 20, background: "#ffffff04", border: "1px solid #ffffff12", borderRadius: 16, textAlign: "center" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: theme.accent, marginBottom: 12 }}>
                    🔗 공통 특성
                  </div>
                  {sharedAb.length > 0 && (
                    <div style={{ marginBottom: 8 }}>
                      <span style={{ fontSize: 10, opacity: 0.5 }}>공유 능력: </span>
                      {sharedAb.map((a,i) => <span key={i} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 10, background: theme.accent + "18", color: theme.accent, margin: "0 3px" }}>{a}</span>)}
                    </div>
                  )}
                  {sharedGf.length > 0 && (
                    <div style={{ marginBottom: 8 }}>
                      <span style={{ fontSize: 10, opacity: 0.5 }}>공유 장르: </span>
                      {sharedGf.map((g,i) => <span key={i} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 10, background: "#2196f318", color: "#2196f3", margin: "0 3px" }}>{g}</span>)}
                    </div>
                  )}
                  {sharedSh.length > 0 && (
                    <div>
                      <span style={{ fontSize: 10, opacity: 0.5 }}>공유 스토리훅: </span>
                      {sharedSh.map((s,i) => <span key={i} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 10, background: "#00bcd418", color: "#00bcd4", margin: "0 3px" }}>{s}</span>)}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {compareList.length < 2 && (
          <div style={{ textAlign: "center", padding: 48, opacity: 0.3 }}>
            <div style={{ fontSize: 56 }}>⚔</div>
            <div style={{ marginTop: 12, fontSize: 14 }}>위에서 2개 이상의 존재를 선택하면 비교 분석이 표시됩니다</div>
          </div>
        )}
      </div>
    );
  };

  // ── Random Encounter Overlay ──
  const RandomEncounterOverlay = () => {
    if (!encounter) return null;
    const cont = CONTINENT_MAP[encounter.country.r];
    const cTheme = CONTINENT_COLORS[cont];
    return (
      <div style={{ ...styles.modal, zIndex: 120 }} onClick={() => setEncounter(null)}>
        <div onClick={e => e.stopPropagation()} style={{
          background: `linear-gradient(145deg, ${cTheme.card}, #000)`,
          border: `1px solid ${cTheme.accent}66`,
          borderRadius: 20,
          padding: 32,
          maxWidth: 440,
          width: "100%",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
          opacity: encounterAnim ? 0 : 1,
          transform: encounterAnim ? "scale(0.8) rotate(-5deg)" : "scale(1) rotate(0deg)",
          transition: "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}>
          {/* Dramatic background glow */}
          <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 50% 30%, ${cTheme.accent}20, transparent 60%)`, pointerEvents: "none" }} />
          <div style={{ fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: cTheme.accent, marginBottom: 16, position: "relative" }}>
            ⚡ 랜덤 조우 ⚡
          </div>
          <div style={{ position: "relative", marginBottom: 16, display: "flex", justifyContent: "center" }}>
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 160, height: 160, borderRadius: "50%", background: `radial-gradient(circle, ${cTheme.accent}15, transparent 65%)`, animation: "fearPulse 2.5s ease-in-out infinite" }} />
            <Portrait name={encounter.being.n} type={encounter.being.t} color={cTheme.accent} size={110} glow={true} animate={true} />
          </div>
          <h2 style={{ fontSize: 26, fontWeight: 700, color: "#fff", position: "relative", marginBottom: 4 }}>
            {encounter.being.n}
          </h2>
          <div style={{ fontSize: 13, color: cTheme.accent, marginBottom: 4 }}>{encounter.being.t}</div>
          <div style={{ fontSize: 12, opacity: 0.5, marginBottom: 12 }}>
            {CONTINENT_EMOJI[cont]} {encounter.country.c} · {encounter.country.r}
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 3, marginBottom: 16 }}>
            {[1,2,3,4,5,6,7,8,9,10].map(i => (
              <div key={i} style={{ width: 7, height: 7, borderRadius: 2, background: i <= encounter.being.f ? (encounter.being.f >= 9 ? "#ff2222" : "#ff6633") : "#333", boxShadow: i <= encounter.being.f && encounter.being.f >= 9 ? "0 0 6px #ff3b3b" : "none", transition: "all 0.3s" }} />
            ))}
            <span style={{ fontSize: 11, marginLeft: 6, color: "#ff3b3b" }}>{FEAR_LABELS[encounter.being.f]}</span>
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.6, opacity: 0.8, position: "relative", marginBottom: 12 }}>
            {encounter.being.d}
          </p>
          {/* Extra GFS fields in encounter */}
          {(encounter.being.ab || encounter.being.gf) && (
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 4, marginBottom: 16 }}>
              {encounter.being.ab && encounter.being.ab.map((a,i) => (
                <span key={`a${i}`} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 8, background: cTheme.accent + "18", color: cTheme.accent, border: `1px solid ${cTheme.accent}30` }}>⚔️ {a}</span>
              ))}
              {encounter.being.gf && encounter.being.gf.map((g,i) => (
                <span key={`g${i}`} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 8, background: "#2196f318", color: "#64b5f6", border: "1px solid #2196f330" }}>🎬 {g}</span>
              ))}
            </div>
          )}
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <button onClick={triggerRandomEncounter} style={{
              padding: "10px 20px", borderRadius: 24, border: `1px solid ${cTheme.accent}`, background: cTheme.accent + "22",
              color: cTheme.accent, cursor: "pointer", fontSize: 13, fontFamily: "'Crimson Text', serif", fontWeight: 600
            }}>
              🎲 다시 뽑기
            </button>
            <button onClick={() => { setEncounter(null); handleCountryClick(encounter.country); }} style={{
              padding: "10px 20px", borderRadius: 24, border: "1px solid #444", background: "transparent",
              color: "#aaa", cursor: "pointer", fontSize: 13, fontFamily: "'Crimson Text', serif"
            }}>
              📖 국가 보기
            </button>
            <button onClick={() => { setEncounter(null); openProfile(encounter.being, encounter.country); }} style={{
              padding: "10px 20px", borderRadius: 24, border: `1px solid ${cTheme.accent}88`, background: `${cTheme.accent}11`,
              color: cTheme.accent, cursor: "pointer", fontSize: 13, fontFamily: "'Crimson Text', serif", fontWeight: 600
            }}>
              🔍 프로필
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Open creature fullscreen profile
  const openProfile = useCallback((being, country) => {
    setProfileBeing(being);
    setProfileCountry(country);
    setProfileAnim(true);
    setTimeout(() => setProfileAnim(false), 50);
  }, []);

  // ── Cinematic Fullscreen Creature Profile ──
  const CreatureProfile = () => {
    if (!profileBeing) return null;
    const b = profileBeing;
    const country = profileCountry;
    const cont = CONTINENT_MAP[country?.r] || "Asia";
    const cTheme = CONTINENT_COLORS[cont];
    const c = cTheme.accent;
    const [section, setSection] = useState("lore");
    const [particleSeed] = useState(() => Array.from({length:24}, (_,i) => ({
      x: Math.random()*100, y: Math.random()*100, s: 0.5+Math.random()*2, d: 2+Math.random()*6, o: 0.1+Math.random()*0.4
    })));
    // Find related beings (same type or shared abilities)
    const related = useMemo(() => {
      const arr = [];
      DATA.forEach(co => co.b.forEach(be => {
        if (be.n === b.n && co.c === country?.c) return;
        const sameType = be.t === b.t;
        const sharedAb = b.ab && be.ab && b.ab.some(a => a !== "불명" && be.ab.includes(a));
        if (sameType || sharedAb) arr.push({ ...be, country: co.c, iso: co.i, region: co.r });
      }));
      return arr.slice(0, 8);
    }, [b, country, DATA]);
    
    const sections = [
      { id: "lore", label: "📜 전승", icon: "📜" },
      { id: "combat", label: "⚔ 전투", icon: "⚔" },
      { id: "visual", label: "👁 외형", icon: "👁" },
      { id: "story", label: "📖 IP", icon: "📖" },
      { id: "related", label: "🔗 유사", icon: "🔗" },
    ];

    return (
      <div style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "#000",
        overflow: "auto",
        opacity: profileAnim ? 0 : 1,
        transition: "opacity 0.4s ease",
      }}>
        {/* Particle field */}
        <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
          {particleSeed.map((p, i) => (
            <div key={i} style={{
              position: "absolute",
              left: `${p.x}%`, top: `${p.y}%`,
              width: p.s, height: p.s,
              borderRadius: "50%",
              background: c,
              opacity: p.o,
              animation: `profileFloat ${p.d}s ease-in-out infinite alternate`,
              animationDelay: `${i * 0.15}s`,
            }} />
          ))}
        </div>

        {/* Giant atmospheric gradient */}
        <div style={{
          position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
          background: `radial-gradient(ellipse at 50% 20%, ${c}18, transparent 55%), radial-gradient(ellipse at 80% 80%, ${c}08, transparent 40%)`,
        }} />

        {/* Close button */}
        <button onClick={() => setProfileBeing(null)} style={{
          position: "fixed", top: 20, right: 20, zIndex: 210,
          background: "#00000088", backdropFilter: "blur(12px)",
          border: `1px solid ${c}44`, borderRadius: 12,
          color: "#fff", fontSize: 14, padding: "8px 16px",
          cursor: "pointer", fontFamily: "'Crimson Text', serif",
          transition: "all 0.3s",
        }}>
          ✕ 닫기
        </button>

        {/* Hero Section */}
        <div style={{
          position: "relative", minHeight: "70vh",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: "80px 24px 40px",
          background: `linear-gradient(180deg, #000 0%, ${c}06 40%, ${c}03 70%, #000 100%)`,
        }}>
          {/* Concentric rings */}
          {[120, 180, 260].map((r, i) => (
            <div key={i} style={{
              position: "absolute", top: "50%", left: "50%",
              width: r * 2, height: r * 2,
              transform: "translate(-50%, -55%)",
              border: `1px solid ${c}${["15","0a","06"][i]}`,
              borderRadius: "50%",
              animation: `profileRing ${6 + i * 2}s linear infinite`,
            }} />
          ))}

          {/* Main portrait - LARGE */}
          <div style={{
            position: "relative", marginBottom: 32,
            animation: "profilePortraitEnter 0.8s cubic-bezier(0.22, 1, 0.36, 1) both",
          }}>
            <div style={{
              position: "absolute", inset: -30,
              background: `radial-gradient(circle, ${c}25, transparent 65%)`,
              borderRadius: "50%",
              animation: "fearPulse 3s ease-in-out infinite",
            }} />
            <Portrait name={b.n} type={b.t} color={c} size={160} glow={true} animate={true} />
          </div>

          {/* Fear level bar */}
          <div style={{ display: "flex", gap: 4, alignItems: "flex-end", marginBottom: 20, animation: "profileFadeUp 0.6s 0.3s both" }}>
            {[1,2,3,4,5,6,7,8,9,10].map(i => (
              <div key={i} style={{
                width: 8, height: i <= b.f ? 8 + i * 1.2 : 8, borderRadius: 2,
                background: i <= b.f ? (b.f >= 9 ? "#ff2222" : b.f >= 7 ? "#ff6633" : c) : "#222",
                boxShadow: i <= b.f ? `0 0 8px ${b.f >= 9 ? "#ff3b3b88" : b.f >= 7 ? "#ff663388" : c + "66"}` : "none",
                transition: "all 0.3s",
                animation: i <= b.f ? `fearDotPulse 2s ease-in-out infinite` : "none",
                animationDelay: `${i * 0.1}s`,
              }} />
            ))}
            <span style={{ fontSize: 14, color: b.f >= 9 ? "#ff3b3b" : b.f >= 7 ? "#ff6633" : c, fontWeight: 700, marginLeft: 6 }}>
              {b.f}/10 {FEAR_LABELS[b.f]}
            </span>
          </div>

          {/* Name */}
          <h1 style={{
            fontSize: "clamp(32px, 7vw, 56px)", fontWeight: 700,
            background: `linear-gradient(135deg, #fff, ${c}, #fff)`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            textAlign: "center", lineHeight: 1.1, marginBottom: 8,
            fontFamily: "'Crimson Text', serif", letterSpacing: "0.04em",
            animation: "profileFadeUp 0.6s 0.2s both",
          }}>
            {b.n}
          </h1>

          {b.ln && (
            <div style={{ fontSize: 18, opacity: 0.4, marginBottom: 8, fontFamily: "'Crimson Text', serif", animation: "profileFadeUp 0.6s 0.35s both" }}>
              {b.ln}
            </div>
          )}

          {/* Type + Country badge */}
          <div style={{
            display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", justifyContent: "center",
            animation: "profileFadeUp 0.6s 0.4s both",
          }}>
            <span style={{
              padding: "6px 16px", borderRadius: 20,
              background: `${c}18`, border: `1px solid ${c}44`,
              color: c, fontSize: 13, fontWeight: 600,
              fontFamily: "'Crimson Text', serif",
            }}>
              {getTypeIcon(b.t)} {b.t}
            </span>
            <span style={{
              padding: "6px 16px", borderRadius: 20,
              background: "#ffffff08", border: "1px solid #ffffff18",
              color: "#aaa", fontSize: 13,
              fontFamily: "'Crimson Text', serif",
            }}>
              {CONTINENT_EMOJI[cont]} {country?.c} · {country?.r}
            </span>
            {b.ip && (
              <span style={{
                padding: "6px 12px", borderRadius: 20,
                background: "#4caf5018", border: "1px solid #4caf5044",
                color: "#4caf50", fontSize: 11, fontWeight: 600,
              }}>
                ✅ IP Ready
              </span>
            )}
          </div>

          {/* Scroll indicator */}
          <div style={{
            position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)",
            animation: "profileBounce 2s ease-in-out infinite",
            opacity: 0.3, fontSize: 20,
          }}>
            ▾
          </div>
        </div>

        {/* Section Navigation */}
        <div style={{
          position: "sticky", top: 0, zIndex: 205,
          display: "flex", justifyContent: "center", gap: 6, padding: "12px 16px",
          background: "linear-gradient(180deg, #000000ee 60%, #00000000 100%)",
          backdropFilter: "blur(16px)",
        }}>
          {sections.map(s => (
            <button key={s.id} onClick={() => setSection(s.id)} style={{
              padding: "8px 16px", borderRadius: 20,
              border: `1px solid ${section === s.id ? c : "#333"}`,
              background: section === s.id ? `${c}22` : "transparent",
              color: section === s.id ? c : "#666",
              cursor: "pointer", fontSize: 12, fontWeight: section === s.id ? 700 : 400,
              fontFamily: "'Crimson Text', serif", transition: "all 0.3s",
            }}>
              {s.label}
            </button>
          ))}
        </div>

        {/* Content Sections */}
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 20px 80px", position: "relative", zIndex: 1 }}>

          {/* LORE SECTION */}
          {section === "lore" && (
            <div style={{ animation: "profileFadeUp 0.4s ease both" }}>
              <div style={{
                padding: 28, borderRadius: 20,
                background: `linear-gradient(145deg, ${c}08, #0a0a0a)`,
                border: `1px solid ${c}22`,
                marginBottom: 24,
              }}>
                <div style={{ fontSize: 11, color: c, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 12 }}>전승 기록</div>
                <p style={{ fontSize: 17, lineHeight: 1.8, color: "#ddd", fontFamily: "'Crimson Text', serif" }}>
                  {b.d}
                </p>
              </div>

              {b.src && b.src.length > 0 && (
                <div style={{ padding: 20, borderRadius: 16, background: "#ffffff04", border: "1px solid #ffffff0a", marginBottom: 16 }}>
                  <div style={{ fontSize: 11, color: "#888", letterSpacing: "0.15em", marginBottom: 8 }}>📚 출처</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {b.src.map((s, i) => (
                      <span key={i} style={{
                        padding: "6px 14px", borderRadius: 12, background: "#ffffff08",
                        border: "1px solid #ffffff15", color: "#ccc", fontSize: 13,
                        fontFamily: "'Crimson Text', serif", fontStyle: "italic",
                      }}>{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* COMBAT SECTION */}
          {section === "combat" && (
            <div style={{ animation: "profileFadeUp 0.4s ease both" }}>
              {b.ab && b.ab.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 13, color: c, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 18 }}>⚔️</span> 능력
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
                    {b.ab.map((a, i) => (
                      <div key={i} style={{
                        padding: "14px 16px", borderRadius: 14,
                        background: `linear-gradient(135deg, ${c}12, ${c}06)`,
                        border: `1px solid ${c}25`,
                        textAlign: "center",
                      }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: c }}>{a}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {b.wk && b.wk.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 13, color: "#ff9800", fontWeight: 700, letterSpacing: "0.1em", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 18 }}>🛡️</span> 약점
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
                    {b.wk.map((w, i) => (
                      <div key={i} style={{
                        padding: "14px 16px", borderRadius: 14,
                        background: "linear-gradient(135deg, #ff980012, #ff980006)",
                        border: "1px solid #ff980025",
                        textAlign: "center",
                      }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#ff9800" }}>{w}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Fear analysis */}
              <div style={{
                padding: 24, borderRadius: 16,
                background: b.f >= 7 ? "linear-gradient(135deg, #ff3b3b08, #0a0a0a)" : "#ffffff04",
                border: `1px solid ${b.f >= 7 ? "#ff3b3b22" : "#ffffff0a"}`,
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: b.f >= 7 ? "#ff3b3b" : "#888", marginBottom: 12 }}>
                  🌡 공포 등급 분석
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ display: "flex", gap: 3 }}>
                    {[1,2,3,4,5,6,7,8,9,10].map(i => (
                      <div key={i} style={{
                        width: 20, height: 20, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center",
                        background: i <= b.f ? (b.f >= 9 ? "#ff2222" : b.f >= 7 ? "#ff6633" : c) : "#1a1a1a",
                        color: i <= b.f ? "#fff" : "#444", fontSize: 9, fontWeight: 700,
                        boxShadow: i <= b.f && b.f >= 9 ? "0 0 8px #ff3b3b44" : "none",
                      }}>
                        {i}
                      </div>
                    ))}
                  </div>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: b.f >= 9 ? "#ff3b3b" : b.f >= 7 ? "#ff6633" : c }}>{FEAR_LABELS[b.f]}</div>
                    <div style={{ fontSize: 11, opacity: 0.5 }}>10단계 중 {b.f}단계</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VISUAL SECTION */}
          {section === "visual" && (
            <div style={{ animation: "profileFadeUp 0.4s ease both" }}>
              {/* Large portrait showcase */}
              <div style={{
                display: "flex", justifyContent: "center", marginBottom: 32,
                padding: 40, borderRadius: 20,
                background: `radial-gradient(circle at 50% 50%, ${c}12, transparent 60%)`,
                border: `1px solid ${c}15`,
              }}>
                <Portrait name={b.n} type={b.t} color={c} size={200} glow={true} animate={true} />
              </div>

              {b.vk && b.vk.length > 0 && (
                <div>
                  <div style={{ fontSize: 13, color: "#9c27b0", fontWeight: 700, letterSpacing: "0.1em", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 18 }}>👁</span> 외형 키워드
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                    {b.vk.map((v, i) => (
                      <div key={i} style={{
                        padding: "12px 20px", borderRadius: 16,
                        background: "linear-gradient(135deg, #9c27b010, #9c27b005)",
                        border: "1px solid #9c27b025",
                        fontSize: 14, color: "#ce93d8", fontWeight: 500,
                        fontFamily: "'Crimson Text', serif",
                      }}>
                        {v}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(!b.vk || b.vk.length === 0) && (
                <div style={{ textAlign: "center", padding: 40, opacity: 0.3 }}>
                  <div style={{ fontSize: 40, marginBottom: 8 }}>👁</div>
                  <div>외형 키워드가 기록되지 않았습니다</div>
                </div>
              )}
            </div>
          )}

          {/* STORY/IP SECTION */}
          {section === "story" && (
            <div style={{ animation: "profileFadeUp 0.4s ease both" }}>
              {b.gf && b.gf.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 13, color: "#2196f3", fontWeight: 700, letterSpacing: "0.1em", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 18 }}>🎬</span> 적합 장르
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                    {b.gf.map((g, i) => (
                      <div key={i} style={{
                        padding: "12px 20px", borderRadius: 16,
                        background: "linear-gradient(135deg, #2196f310, #2196f305)",
                        border: "1px solid #2196f325",
                        fontSize: 14, color: "#64b5f6", fontWeight: 500,
                      }}>
                        {g}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {b.sh && b.sh.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 13, color: "#00bcd4", fontWeight: 700, letterSpacing: "0.1em", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 18 }}>📖</span> 스토리 훅
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {b.sh.map((s, i) => (
                      <div key={i} style={{
                        padding: "16px 20px", borderRadius: 14,
                        background: "linear-gradient(135deg, #00bcd408, #0a0a0a)",
                        border: "1px solid #00bcd420",
                        borderLeft: `3px solid #00bcd4`,
                      }}>
                        <div style={{ fontSize: 14, color: "#80deea", fontFamily: "'Crimson Text', serif" }}>
                          「{s}」
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {b.ip && (
                <div style={{
                  padding: 24, borderRadius: 16,
                  background: "linear-gradient(135deg, #4caf5008, #0a0a0a)",
                  border: "1px solid #4caf5022",
                  textAlign: "center",
                }}>
                  <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#4caf50", marginBottom: 4 }}>IP 개발 적합</div>
                  <div style={{ fontSize: 12, opacity: 0.5 }}>이 존재는 게임, 웹툰, 영상 등 IP 개발에 적합한 요소를 갖추고 있습니다</div>
                </div>
              )}
            </div>
          )}

          {/* RELATED SECTION */}
          {section === "related" && (
            <div style={{ animation: "profileFadeUp 0.4s ease both" }}>
              <div style={{ fontSize: 13, color: c, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 16 }}>
                🔗 유사 존재 ({related.length}개)
              </div>
              {related.length > 0 ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
                  {related.map((r, i) => {
                    const rCont = CONTINENT_MAP[r.region];
                    const rC = CONTINENT_COLORS[rCont]?.accent || "#888";
                    return (
                      <div key={i} onClick={() => {
                        const cData = DATA.find(co => co.c === r.country);
                        if (cData) openProfile(r, cData);
                      }} style={{
                        padding: 16, borderRadius: 14,
                        background: "#ffffff04", border: "1px solid #ffffff0a",
                        cursor: "pointer", transition: "all 0.3s",
                        display: "flex", gap: 12, alignItems: "center",
                      }}>
                        <div style={{ background: rC + "12", borderRadius: 10, padding: 4, flexShrink: 0 }}>
                          <Portrait name={r.n} type={r.t} color={rC} size={40} glow={r.f >= 4} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: "#eee" }}>{r.n}</div>
                          <div style={{ fontSize: 11, color: rC }}>{r.t}</div>
                          <div style={{ fontSize: 11, opacity: 0.4 }}>{CONTINENT_EMOJI[rCont]} {r.country}</div>
                        </div>
                        <div style={{ display: "flex", gap: 2 }}>
                          {[1,2,3,4,5,6,7,8,9,10].map(j => (
                            <div key={j} style={{ width: 3, height: 3, borderRadius: 1, background: j <= r.f ? (r.f >= 9 ? "#ff2222" : "#ff6633") : "#333" }} />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: 40, opacity: 0.3 }}>
                  <div style={{ fontSize: 40, marginBottom: 8 }}>🔍</div>
                  <div>유사 존재를 찾을 수 없습니다</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Modal (country view)
  const Modal = () => {
    if (!selectedCountry) return null;
    const continent = CONTINENT_MAP[selectedCountry.r];
    const cTheme = CONTINENT_COLORS[continent] || CONTINENT_COLORS.Asia;

    return (
      <div style={styles.modal} onClick={() => setSelectedCountry(null)}>
        <div style={styles.modalContent(cTheme)} onClick={(e) => e.stopPropagation()}>
          <button style={styles.closeBtn} onClick={() => setSelectedCountry(null)}>✕</button>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: cTheme.accent, letterSpacing: "0.15em", textTransform: "uppercase" }}>
              {selectedCountry.r}
            </div>
            <h2 style={{ fontSize: 28, fontWeight: 700, margin: "4px 0", color: "#fff" }}>
              {CONTINENT_EMOJI[continent]} {selectedCountry.c}
            </h2>
            <div style={{ fontSize: 12, opacity: 0.4 }}>
              {selectedCountry.b.length}개 신화 속 존재 수록 · 클릭하여 상세 프로필 보기
            </div>
          </div>

          {selectedCountry.b.map((being, i) => (
            <div key={i} onClick={() => { setSelectedCountry(null); openProfile(being, selectedCountry); }}
              style={{ cursor: "pointer", transition: "all 0.2s", borderRadius: 12, margin: "0 -8px", padding: "0 8px" }}
              onMouseEnter={e => e.currentTarget.style.background = `${cTheme.accent}08`}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <BeingDetail being={being} color={cTheme.accent} country={selectedCountry.c} />
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div style={styles.app}>
      {/* Atmospheric background */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: `radial-gradient(ellipse at 50% 30%, ${theme.glow}, transparent 70%)`,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Header */}
      <header style={styles.header}>
        <h1 style={styles.title}>세계 민담 도감</h1>
        <div style={styles.subtitle}>전 세계 민담과 신화 속 존재들을 탐험하세요</div>
        <div style={styles.stats}>
          <span>{filtered.length}개국</span>
          <span>·</span>
          <span>{totalBeings}개 존재</span>
          <span>·</span>
          <span>{Object.keys(CONTINENT_MAP).length}개 지역</span>
        </div>
      </header>

      {/* Continent nav */}
      <nav style={styles.continentNav}>
        {continents.map((c) => {
          const color = c === "All" ? theme.accent : CONTINENT_COLORS[c]?.accent;
          return (
            <button
              key={c}
              style={styles.continentBtn(activeContinent === c, color)}
              onClick={() => setActiveContinent(c)}
            >
              {c !== "All" && CONTINENT_EMOJI[c]} {c}
            </button>
          );
        })}
      </nav>

      {/* Search */}
      <div style={styles.searchBar}>
        <input
          style={styles.searchInput(theme.accent)}
          placeholder="국가, 존재, 유형으로 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Tab Navigation */}
      <div style={{ display: "flex", justifyContent: "center", gap: 6, padding: "4px 16px 8px", flexWrap: "wrap", zIndex: 2, position: "relative" }}>
        {[
          { id: "explore", label: "🗺 탐험", },
          { id: "compare", label: `⚔ 비교${compareList.length > 0 ? ` (${compareList.length})` : ""}` },
          { id: "stats", label: "📊 통계" },
          { id: "ranking", label: "🏆 랭킹" },
          { id: "featured", label: "🎴 특집" },
          { id: "scenario", label: "🎬 시나리오" },
          { id: "character", label: "🧙 캐릭터" },
          { id: "webtoon", label: "📱 웹툰 IP" },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            padding: "6px 14px", borderRadius: 16,
            border: `1px solid ${activeTab === tab.id ? theme.accent : "#333"}`,
            background: activeTab === tab.id ? theme.accent + "22" : "transparent",
            color: activeTab === tab.id ? theme.accent : "#666",
            cursor: "pointer", fontSize: 12, fontFamily: "'Crimson Text', serif",
            fontWeight: activeTab === tab.id ? 700 : 400, transition: "all 0.3s",
          }}>
            {tab.label}
          </button>
        ))}
        <button onClick={triggerRandomEncounter} style={{
          padding: "6px 14px", borderRadius: 16,
          border: "1px solid #ff444488",
          background: "#ff444418",
          color: "#ff6666",
          cursor: "pointer", fontSize: 12, fontFamily: "'Crimson Text', serif",
          fontWeight: 700, transition: "all 0.3s",
          animation: "pulse 2s infinite",
        }}>
          🎲 랜덤 조우
        </button>
      </div>

      {/* Fear filter (only on explore tab) */}
      {activeTab === "explore" && (
      <div style={styles.filterRow}>
        {[0, 5, 7, 8, 9].map((f) => (
          <button
            key={f}
            style={styles.filterBtn(fearFilter === f, theme.accent)}
            onClick={() => setFearFilter(f === fearFilter ? 0 : f)}
          >
            {f === 0 ? "전체" : f === 5 ? "⚠ 5+" : f === 7 ? "☠ 7+" : f === 8 ? "💀 8+" : "🔥 9+"}
          </button>
        ))}
        <button
          style={styles.filterBtn(viewMode === "map", theme.accent)}
          onClick={() => setViewMode(viewMode === "map" ? "grid" : "map")}
        >
          {viewMode === "map" ? "⊞ 그리드" : "🗺 지도"}
        </button>
        {viewMode === "map" && (
          <>
            <span style={{ color: "#333", fontSize: 11, padding: "0 2px" }}>│</span>
            {[
              { mode: "fear", label: "🌡 공포도" },
              { mode: "density", label: "📊 밀도" },
              { mode: "type", label: "💀 최대" },
            ].map(({ mode, label }) => (
              <button
                key={mode}
                style={styles.filterBtn(heatmapMode === mode, heatmapMode === mode ? "#ff8844" : theme.accent)}
                onClick={() => setHeatmapMode(mode)}
              >
                {label}
              </button>
            ))}
          </>
        )}
        <span style={{ color: "#333", fontSize: 11, padding: "0 2px" }}>│</span>
        <button
          style={{
            ...styles.filterBtn(showAdvFilters || activeFilterCount > 0, activeFilterCount > 0 ? "#ff8844" : theme.accent),
            position: "relative",
          }}
          onClick={() => setShowAdvFilters(!showAdvFilters)}
        >
          🔬 고급 필터{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
        </button>
      </div>
      )}

      {/* Advanced Filters Panel */}
      {activeTab === "explore" && showAdvFilters && (
        <div style={{
          maxWidth: 900, margin: "0 auto 12px", padding: "16px 20px",
          background: "linear-gradient(145deg, #111108, #0a0a0a)",
          border: `1px solid ${theme.accent}22`, borderRadius: 16,
          position: "relative", zIndex: 2,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: theme.accent }}>🔬 고급 필터</div>
            {activeFilterCount > 0 && (
              <button onClick={() => { setAbilityFilter(null); setGenreFilter(null); setTypeFilter(null); setVisualFilter(null); setIpFilter(false); }}
                style={{ padding: "3px 10px", borderRadius: 10, border: "1px solid #ff444444", background: "#ff444412", color: "#ff6666", cursor: "pointer", fontSize: 11, fontFamily: "'Crimson Text', serif" }}>
                ✕ 초기화
              </button>
            )}
          </div>

          {/* Type filter */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, opacity: 0.5, marginBottom: 5 }}>🏷 유형 (Type)</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {filterOptions.types.map(([t, cnt]) => (
                <button key={t} onClick={() => setTypeFilter(typeFilter === t ? null : t)}
                  style={{
                    padding: "3px 9px", borderRadius: 10, fontSize: 10, cursor: "pointer",
                    border: `1px solid ${typeFilter === t ? "#ff8844" : "#222"}`,
                    background: typeFilter === t ? "#ff884418" : "#0e0e0e",
                    color: typeFilter === t ? "#ff8844" : "#777",
                    fontFamily: "'Crimson Text', serif", transition: "all 0.2s",
                  }}>
                  {getTypeIcon(t)} {t} <span style={{ opacity: 0.4 }}>({cnt})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Ability filter */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, opacity: 0.5, marginBottom: 5 }}>⚔️ 능력 (Ability)</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {filterOptions.abilities.map(([a, cnt]) => (
                <button key={a} onClick={() => setAbilityFilter(abilityFilter === a ? null : a)}
                  style={{
                    padding: "3px 9px", borderRadius: 10, fontSize: 10, cursor: "pointer",
                    border: `1px solid ${abilityFilter === a ? "#e91e63" : "#222"}`,
                    background: abilityFilter === a ? "#e91e6318" : "#0e0e0e",
                    color: abilityFilter === a ? "#e91e63" : "#777",
                    fontFamily: "'Crimson Text', serif", transition: "all 0.2s",
                  }}>
                  {a} <span style={{ opacity: 0.4 }}>({cnt})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Genre filter */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, opacity: 0.5, marginBottom: 5 }}>🎬 장르 (Genre)</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {filterOptions.genres.map(([g, cnt]) => (
                <button key={g} onClick={() => setGenreFilter(genreFilter === g ? null : g)}
                  style={{
                    padding: "3px 9px", borderRadius: 10, fontSize: 10, cursor: "pointer",
                    border: `1px solid ${genreFilter === g ? "#2196f3" : "#222"}`,
                    background: genreFilter === g ? "#2196f318" : "#0e0e0e",
                    color: genreFilter === g ? "#2196f3" : "#777",
                    fontFamily: "'Crimson Text', serif", transition: "all 0.2s",
                  }}>
                  {g} <span style={{ opacity: 0.4 }}>({cnt})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Visual tag filter */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, opacity: 0.5, marginBottom: 5 }}>👁 외형 태그 (Visual)</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {filterOptions.visuals.map(([v, cnt]) => (
                <button key={v} onClick={() => setVisualFilter(visualFilter === v ? null : v)}
                  style={{
                    padding: "3px 9px", borderRadius: 10, fontSize: 10, cursor: "pointer",
                    border: `1px solid ${visualFilter === v ? "#9c27b0" : "#222"}`,
                    background: visualFilter === v ? "#9c27b018" : "#0e0e0e",
                    color: visualFilter === v ? "#9c27b0" : "#777",
                    fontFamily: "'Crimson Text', serif", transition: "all 0.2s",
                  }}>
                  {v} <span style={{ opacity: 0.4 }}>({cnt})</span>
                </button>
              ))}
            </div>
          </div>

          {/* IP Ready filter */}
          <div>
            <button onClick={() => setIpFilter(!ipFilter)}
              style={{
                padding: "5px 14px", borderRadius: 12, fontSize: 11, cursor: "pointer",
                border: `1px solid ${ipFilter ? "#4caf50" : "#222"}`,
                background: ipFilter ? "#4caf5018" : "#0e0e0e",
                color: ipFilter ? "#4caf50" : "#777",
                fontFamily: "'Crimson Text', serif", transition: "all 0.2s",
              }}>
              ✅ IP Ready만 보기
            </button>
          </div>

          {/* Active filter summary */}
          {activeFilterCount > 0 && (
            <div style={{ marginTop: 12, padding: "8px 12px", background: "#ffffff06", borderRadius: 10, fontSize: 12, display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
              <span style={{ opacity: 0.5, fontSize: 11 }}>활성 필터:</span>
              {typeFilter && <span style={{ padding: "2px 8px", borderRadius: 8, background: "#ff884415", color: "#ff8844", fontSize: 10 }}>유형: {typeFilter} ✕</span>}
              {abilityFilter && <span style={{ padding: "2px 8px", borderRadius: 8, background: "#e91e6315", color: "#e91e63", fontSize: 10 }}>능력: {abilityFilter} ✕</span>}
              {genreFilter && <span style={{ padding: "2px 8px", borderRadius: 8, background: "#2196f315", color: "#2196f3", fontSize: 10 }}>장르: {genreFilter} ✕</span>}
              {visualFilter && <span style={{ padding: "2px 8px", borderRadius: 8, background: "#9c27b015", color: "#9c27b0", fontSize: 10 }}>외형: {visualFilter} ✕</span>}
              {ipFilter && <span style={{ padding: "2px 8px", borderRadius: 8, background: "#4caf5015", color: "#4caf50", fontSize: 10 }}>IP Ready ✕</span>}
              <span style={{ opacity: 0.4, fontSize: 11, marginLeft: 6 }}>→ {filtered.length}개국 / {totalBeings}개 존재</span>
            </div>
          )}
        </div>
      )}

      {/* Tab Content */}
      {activeTab === "explore" && (
        <>
      {/* Map or Grid */}
      {viewMode === "map" && <WorldMap />}

      <div style={styles.grid}>
        {filtered.map((country) => (
          <CountryCard key={country.i} country={country} />
        ))}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: 60, opacity: 0.4 }}>
          <div style={{ fontSize: 48 }}>🔍</div>
          <div style={{ marginTop: 12 }}>검색 결과가 없습니다</div>
        </div>
      )}
        </>
      )}

      {activeTab === "stats" && <StatsPanel />}
      {activeTab === "ranking" && <RankingPanel />}
      {activeTab === "featured" && <FeaturedCards />}
      {activeTab === "compare" && <ComparePanel />}
      {activeTab === "scenario" && <ScenarioGenerator />}
      {activeTab === "character" && <CharacterBuilder />}
      {activeTab === "webtoon" && <WebtoonIPDev />}

      {/* Modal */}
      <Modal />

      {/* Fullscreen Creature Profile */}
      <CreatureProfile />

      {/* Random Encounter Overlay */}
      <RandomEncounterOverlay />

      {/* Credits Modal */}
      {showCredits && (
        <div style={{
          position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:9999,
          display:"flex",alignItems:"center",justifyContent:"center",
          backdropFilter:"blur(8px)"
        }} onClick={()=>setShowCredits(false)}>
          <div style={{
            background:"linear-gradient(145deg,#1a1a2e,#16213e)",
            border:"1px solid #333",borderRadius:16,padding:"36px 32px",
            maxWidth:560,width:"90%",maxHeight:"80vh",overflowY:"auto",
            boxShadow:"0 24px 80px rgba(0,0,0,0.6)"
          }} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
              <h2 style={{color:"#e8d5b7",fontSize:22,fontFamily:"Crimson Text,serif",margin:0}}>
                📜 Sources & Credits
              </h2>
              <button onClick={()=>setShowCredits(false)} style={{
                background:"none",border:"none",color:"#888",fontSize:22,cursor:"pointer"
              }}>✕</button>
            </div>

            <div style={{color:"#ccc",fontSize:14,lineHeight:1.8}}>
              <div style={{
                background:"rgba(255,200,100,0.08)",border:"1px solid rgba(255,200,100,0.15)",
                borderRadius:10,padding:"16px 18px",marginBottom:20
              }}>
                <div style={{color:"#e8d5b7",fontWeight:600,marginBottom:8,fontSize:15}}>
                  🇰🇷 한국 괴물 자료 (Korean Monsters)
                </div>
                <div style={{marginBottom:8}}>
                  <strong style={{color:"#ffd700"}}>곽재식의 옛날 이야기 밭: 괴물백과</strong>
                </div>
                <div style={{fontSize:13,color:"#aaa",marginBottom:6}}>
                  Author: Jaesik Kwak (곽재식) — 280+ Korean monsters catalogued from pre-18th century historical records including 삼국유사, 삼국사기, 용재총화, 어우야담, and other classical texts.
                </div>
                <a href="https://oldstory.postype.com" target="_blank" rel="noopener noreferrer" style={{
                  color:"#6cb4ee",fontSize:13,textDecoration:"none",wordBreak:"break-all"
                }}>
                  🔗 https://oldstory.postype.com
                </a>
                <div style={{fontSize:12,color:"#777",marginTop:8,fontStyle:"italic"}}>
                  Licensed for free creative use (commercial & non-commercial) with attribution.
                  Book: 「한국 괴물 백과」 (Workroom Press, 2018)
                </div>
              </div>

              <div style={{
                background:"rgba(100,180,255,0.06)",border:"1px solid rgba(100,180,255,0.12)",
                borderRadius:10,padding:"16px 18px",marginBottom:20
              }}>
                <div style={{color:"#8bb8e8",fontWeight:600,marginBottom:8,fontSize:15}}>
                  🌍 Global Folklore Data
                </div>
                <div style={{fontSize:13,color:"#aaa",lineHeight:1.7}}>
                  Creature data compiled from public domain folklore, mythology encyclopedias, 
                  academic ethnographic records, and cultural heritage databases across 150+ countries. 
                  Individual creature entries reference traditional oral histories, classical literature, 
                  and anthropological field studies.
                </div>
              </div>

              <div style={{
                background:"rgba(100,255,150,0.06)",border:"1px solid rgba(100,255,150,0.1)",
                borderRadius:10,padding:"16px 18px",marginBottom:20
              }}>
                <div style={{color:"#8be8a8",fontWeight:600,marginBottom:8,fontSize:15}}>
                  🎨 Project Information
                </div>
                <div style={{fontSize:13,color:"#aaa",lineHeight:1.7}}>
                  <strong>Global Folklore Studio — Creature Codex</strong><br/>
                  An interactive encyclopedia bridging traditional folklore with modern creative applications.
                  Built for game developers, writers, illustrators, and cultural researchers.
                </div>
              </div>

              <div style={{textAlign:"center",marginTop:16,fontSize:12,color:"#555"}}>
                This project respects cultural heritage and strives for authentic representation.<br/>
                All folklore data is used for educational and creative purposes.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Compare Bar */}
      {compareList.length > 0 && activeTab !== "compare" && (
        <div style={{
          position: "fixed", bottom: 16, left: "50%", transform: "translateX(-50%)",
          background: "linear-gradient(135deg, #1a1208, #111)", border: "1px solid #ff884444",
          borderRadius: 20, padding: "8px 16px", zIndex: 90,
          display: "flex", alignItems: "center", gap: 10,
          boxShadow: "0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px #ff884422",
          backdropFilter: "blur(12px)",
        }}>
          <span style={{ fontSize: 12, color: "#ff8844", fontWeight: 700 }}>⚔ {compareList.length}개 선택</span>
          <div style={{ display: "flex", gap: 4 }}>
            {compareList.map((item, i) => (
              <div key={i} style={{ position: "relative" }}>
                <Portrait name={item.being.n} type={item.being.t} color={["#ff4466","#44aaff","#44ff88","#ffaa44"][i]} size={28} />
              </div>
            ))}
          </div>
          <button onClick={() => setActiveTab("compare")} style={{
            padding: "5px 14px", borderRadius: 12, border: "1px solid #ff8844",
            background: "#ff884422", color: "#ff8844", cursor: "pointer",
            fontSize: 11, fontWeight: 700, fontFamily: "'Crimson Text', serif",
          }}>
            비교하기 →
          </button>
          <button onClick={() => setCompareList([])} style={{
            padding: "5px 8px", borderRadius: 8, border: "1px solid #444",
            background: "transparent", color: "#666", cursor: "pointer", fontSize: 10,
          }}>
            ✕
          </button>
        </div>
      )}

      {/* Footer */}
      <div style={{
        textAlign:"center",padding:"20px 16px 28px",
        borderTop:"1px solid #1a1a2e",marginTop:32
      }}>
        <span style={{color:"#444",fontSize:12}}>
          Global Folklore Studio — Creature Codex · {DATA.length} Countries · {DATA.reduce((a,c)=>a+c.b.length,0)} Creatures
        </span>
        <span style={{color:"#333",margin:"0 10px"}}>|</span>
        <button onClick={()=>setShowCredits(true)} style={{
          background:"none",border:"none",color:"#6cb4ee",fontSize:12,
          cursor:"pointer",textDecoration:"underline",padding:0
        }}>
          📜 Sources & Credits
        </button>
      </div>

      {/* Font import */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400&family=Cormorant+Garamond:wght@300;400;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #111; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
        input::placeholder { color: #555; }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 #ff444444; }
          50% { box-shadow: 0 0 12px 4px #ff444422; }
        }
        @keyframes creatureFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes fearPulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.06); }
        }
        @keyframes profileFloat {
          0% { transform: translateY(0px) scale(1); opacity: 0.2; }
          100% { transform: translateY(-30px) scale(1.5); opacity: 0.5; }
        }
        @keyframes profileRing {
          0% { transform: translate(-50%, -55%) rotate(0deg); opacity: 0.3; }
          50% { opacity: 0.6; }
          100% { transform: translate(-50%, -55%) rotate(360deg); opacity: 0.3; }
        }
        @keyframes profilePortraitEnter {
          0% { transform: scale(0.3) translateY(40px); opacity: 0; filter: blur(20px); }
          100% { transform: scale(1) translateY(0); opacity: 1; filter: blur(0); }
        }
        @keyframes profileFadeUp {
          0% { transform: translateY(20px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes profileBounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(8px); }
        }
        @keyframes fearDotPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }
        @keyframes cardShimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}
