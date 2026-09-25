/* ART PROMPT STUDIO — application logic (vanilla JS, no build step) */
(function(){
'use strict';

const STYLES = APS_STYLES;
const byId = id => STYLES.find(s => s.id === id);

/* ============================================================
   OPTION CATALOGS
   ============================================================ */

const COMPOSITION = [
  {id:'portrait',     ko:'인물화',        en:'a tightly framed portrait composition'},
  {id:'closeup',      ko:'클로즈업',      en:'an intimate close-up framing'},
  {id:'halfbody',     ko:'반신',          en:'a half-body framing'},
  {id:'fullbody',     ko:'전신',          en:'a full-body framing'},
  {id:'wide',         ko:'와이드샷',      en:'a wide establishing shot'},
  {id:'birdseye',     ko:'항공뷰',        en:"a bird's-eye view looking down on the scene"},
  {id:'lowangle',     ko:'로우앵글',      en:'a dramatic low-angle viewpoint looking upward'},
  {id:'symmetrical',  ko:'대칭구도',      en:'a perfectly symmetrical composition'},
  {id:'thirds',       ko:'3분할 구도',    en:'a composition balanced along the rule of thirds'},
  {id:'central',      ko:'중앙구도',      en:'a centered, focal composition'},
  {id:'panoramic',    ko:'파노라마',      en:'a sweeping panoramic composition'},
  {id:'minimal',      ko:'미니멀 구도',   en:'a minimal composition with generous negative space'}
];

const COLOR = [
  {id:'vivid',         ko:'비비드',        en:'vivid, highly saturated color'},
  {id:'pastel',        ko:'파스텔',        en:'soft pastel color'},
  {id:'muted',         ko:'차분한 톤',     en:'muted, understated color'},
  {id:'monochrome',    ko:'모노크롬',      en:'a near-monochrome palette'},
  {id:'warm',          ko:'따뜻한 색감',   en:'a warm color palette'},
  {id:'cool',          ko:'차가운 색감',   en:'a cool color palette'},
  {id:'earth',         ko:'어스톤',        en:'an earthy, natural color palette'},
  {id:'highcontrast',  ko:'고대비',        en:'high-contrast color'},
  {id:'softcontrast',  ko:'저대비',        en:'gentle, low-contrast color'},
  {id:'complementary', ko:'보색 대비',     en:'complementary color contrast'},
  {id:'artistoriginal',ko:'화가 고유 팔레트', en:"the artist's own signature color palette"}
];

const LIGHTING = [
  {id:'daylight',     ko:'자연광',        en:'natural daylight'},
  {id:'goldenhour',   ko:'골든아워',      en:'warm golden-hour light'},
  {id:'morning',      ko:'아침빛',        en:'soft morning light'},
  {id:'sunset',       ko:'노을빛',        en:'glowing sunset light'},
  {id:'moonlight',    ko:'달빛',          en:'cool, quiet moonlight'},
  {id:'candlelight',  ko:'촛불빛',        en:'flickering candlelight'},
  {id:'windowlight',  ko:'창가 조명',     en:'soft light filtering through a window'},
  {id:'studio',       ko:'스튜디오 조명', en:'controlled studio lighting'},
  {id:'dramatic',     ko:'드라마틱 조명', en:'dramatic, high-contrast lighting'},
  {id:'softdiffused', ko:'부드러운 확산광', en:'soft, diffused lighting'},
  {id:'backlighting', ko:'역광',          en:'gentle backlighting with a subtle glow'},
  {id:'neon',         ko:'네온 조명',     en:'vivid neon lighting'}
];

const MOOD = [
  {id:'peaceful',    ko:'평화로운',   en:'peaceful'},
  {id:'dreamlike',   ko:'몽환적인',   en:'dreamlike'},
  {id:'joyful',      ko:'즐거운',     en:'joyful'},
  {id:'romantic',    ko:'로맨틱한',   en:'romantic'},
  {id:'melancholic', ko:'애수 어린',  en:'melancholic'},
  {id:'mysterious',  ko:'신비로운',   en:'mysterious'},
  {id:'dramatic',    ko:'드라마틱한', en:'dramatic'},
  {id:'energetic',   ko:'역동적인',   en:'energetic'},
  {id:'nostalgic',   ko:'향수 어린',  en:'nostalgic'},
  {id:'whimsical',   ko:'기발한',     en:'whimsical'},
  {id:'elegant',     ko:'우아한',     en:'elegant'},
  {id:'surreal',     ko:'초현실적인', en:'surreal'}
];

const MEDIUM = [
  {id:'oil',          ko:'유화',        en:'oil painting'},
  {id:'watercolor',   ko:'수채화',      en:'watercolor painting'},
  {id:'gouache',      ko:'구아슈',      en:'gouache painting'},
  {id:'acrylic',      ko:'아크릴화',    en:'acrylic painting'},
  {id:'ink',          ko:'수묵화/잉크', en:'ink drawing'},
  {id:'pastel',       ko:'파스텔화',    en:'pastel drawing'},
  {id:'charcoal',     ko:'목탄화',      en:'charcoal drawing'},
  {id:'coloredpencil',ko:'색연필화',    en:'colored pencil illustration'},
  {id:'woodblock',    ko:'목판화',      en:'woodblock print'},
  {id:'lithograph',   ko:'석판화',      en:'lithograph print'},
  {id:'fresco',       ko:'프레스코화',  en:'fresco painting'},
  {id:'mixedmedia',   ko:'혼합매체',    en:'mixed-media artwork'}
];

const DETAIL = [
  {id:'simple',     ko:'심플',        en:'a simple, economical level of detail'},
  {id:'balanced',   ko:'균형있는',    en:'a balanced level of detail'},
  {id:'highdetail', ko:'매우 정교한', en:'a highly detailed, intricate level of detail'}
];

const ASPECT = ['1:1','4:5','3:4','16:9','9:16','21:9'];

const PURPOSE = [
  {id:'personal',   ko:'개인 감상',       en:'personal enjoyment'},
  {id:'sns',        ko:'SNS',             en:'social media sharing'},
  {id:'instagram',  ko:'Instagram',       en:'an Instagram post'},
  {id:'blog',       ko:'블로그',          en:'a blog header image'},
  {id:'poster',     ko:'포스터',          en:'a printed poster'},
  {id:'ad',         ko:'광고',            en:'an advertisement'},
  {id:'book',       ko:'도서 삽화',       en:'a book illustration'},
  {id:'presentation',ko:'프레젠테이션',   en:'a presentation slide'},
  {id:'thumbnail',  ko:'유튜브 썸네일',   en:'a YouTube thumbnail'},
  {id:'package',    ko:'제품 패키지',     en:'product packaging'},
  {id:'hero',       ko:'웹사이트 히어로', en:'a website hero image'},
  {id:'wallpaper',  ko:'모바일 배경화면', en:'a mobile wallpaper'},
  {id:'print',      ko:'인쇄용 아트',     en:'fine-art print'}
];

const PLATFORMS = [
  {id:'chatgpt',   ko:'ChatGPT',        en:'ChatGPT image generation'},
  {id:'gemini',    ko:'Gemini',         en:'Gemini'},
  {id:'imagen',    ko:'Google Imagen',  en:'Google Imagen'},
  {id:'midjourney',ko:'Midjourney',     en:'Midjourney'},
  {id:'firefly',   ko:'Adobe Firefly',  en:'Adobe Firefly'},
  {id:'sd',        ko:'Stable Diffusion',en:'Stable Diffusion'},
  {id:'general',   ko:'기타 / 범용',     en:'general use'}
];

const CATEGORIES = [
  {id:'person',   ko:'사람', en:'Portrait', ex:['비 오는 거리를 걷는 여성','창가에서 커피를 마시는 노인','책을 읽는 소녀','거울을 보는 청년']},
  {id:'animal',   ko:'동물', en:'Animals', ex:['바닷가에서 뛰노는 골든리트리버','창턱에서 낮잠 자는 고양이','눈밭을 걷는 여우','날아오르는 두루미']},
  {id:'landscape',ko:'풍경', en:'Landscape', ex:['안개 낀 새벽 호수','노을 지는 갈대밭','폭포가 흐르는 협곡','눈 덮인 산맥']},
  {id:'city',     ko:'도시', en:'City', ex:['비 오는 서울 골목','네온사인 가득한 도쿄 뒷골목','뉴욕의 택시 행렬','한밤의 홍콩 스카이라인']},
  {id:'travel',   ko:'여행', en:'Travel', ex:['제주도의 돌담과 귤나무','파리의 노천카페','산토리니의 하얀 골목','교토의 대나무숲']},
  {id:'family',   ko:'가족', en:'Family', ex:['해변에서 노는 가족','저녁 식탁에 둘러앉은 가족','할머니와 손녀의 산책','아이와 함께 자전거 타는 아빠']},
  {id:'food',     ko:'음식', en:'Food', ex:['김이 모락모락 나는 만둣국','정성스레 차려진 한정식 상','갓 구운 크루아상과 커피','제철 과일이 담긴 바구니']},
  {id:'product',  ko:'제품', en:'Product', ex:['우리 회사의 신제품 음료','미니멀한 향수병','스튜디오에 놓인 운동화','고급스러운 화장품 세트']},
  {id:'architecture',ko:'건축', en:'Architecture', ex:['한옥 마을의 기와지붕','유리로 뒤덮인 현대적 마천루','오래된 유럽 성당','사막 위의 모던 주택']},
  {id:'fantasy',  ko:'판타지', en:'Fantasy', ex:['구름 위에 떠 있는 성','용과 마주선 기사','숲속 요정 마을','마법사의 서재']},
  {id:'scifi',    ko:'SF', en:'Science Fiction', ex:['우주에서 바라본 지구','미래의 서울','사이버펑크 도시의 밤','화성의 개척 기지']},
  {id:'history',  ko:'역사', en:'History', ex:['조선시대 저잣거리 풍경','고려청자를 빚는 도공','실크로드를 걷는 상인','임진왜란 시대의 수군']},
  {id:'abstract', ko:'추상', en:'Abstract', ex:['감정의 흐름을 표현한 형태','시간의 흐름','기억의 파편','소리의 파동']}
];

/* medium best suited to each style (id -> MEDIUM id) */
const STYLE_MEDIUM = {
  'van-gogh':'oil','monet':'oil','renoir':'oil','degas':'pastel','cezanne':'oil','gauguin':'oil',
  'toulouse-lautrec':'lithograph','seurat':'oil','klimt':'mixedmedia','munch':'oil','matisse':'oil',
  'kandinsky':'oil','mondrian':'acrylic','klee':'mixedmedia','chagall':'oil','modigliani':'oil',
  'mucha':'lithograph','sargent':'oil','turner':'watercolor','friedrich':'oil','blake':'watercolor',
  'rembrandt':'oil','vermeer':'oil','caravaggio':'oil','botticelli':'gouache','davinci':'oil',
  'michelangelo':'fresco','raphael':'fresco','goya':'oil','velazquez':'oil','hokusai':'woodblock',
  'hiroshige':'woodblock','kim-hongdo':'ink','shin-yunbok':'ink','jeong-seon':'ink','repin':'oil',
  'hopper':'oil','okeeffe':'oil','rockwell':'oil',
  'impressionism':'oil','post-impressionism':'oil','expressionism':'oil','art-nouveau':'lithograph',
  'ukiyo-e':'woodblock','renaissance':'fresco','baroque':'oil','romanticism':'oil','symbolism':'oil',
  'fauvism':'oil','cubism':'oil','surrealism':'oil','abstract-art':'acrylic','minimalism':'acrylic',
  'korean-minhwa':'gouache','korean-ink':'ink'
};

/* extra search boosts for semantic / fuzzy queries the spec calls out explicitly */
const SEARCH_SYNONYMS = [
  {q:'몽환적', ids:['chagall','symbolism','surrealism','munch']},
  {q:'강렬한 붓터치', ids:['van-gogh','expressionism','fauvism','munch']},
  {q:'일본 판화', ids:['hokusai','hiroshige','ukiyo-e']},
  {q:'한국화', ids:['kim-hongdo','shin-yunbok','jeong-seon','korean-minhwa','korean-ink']},
  {q:'수채화', ids:['turner','blake']},
  {q:'고요한', ids:['vermeer','friedrich','korean-ink','minimalism']},
  {q:'화려한', ids:['klimt','mucha','jeong-seon']},
  {q:'기하학', ids:['mondrian','cubism','seurat']}
];

/* ============================================================
   STATE
   ============================================================ */

function loadJSON(key, fallback){
  try{ const v = JSON.parse(localStorage.getItem(key)); return v == null ? fallback : v; }
  catch(e){ return fallback; }
}
function saveJSON(key, val){
  try{ localStorage.setItem(key, JSON.stringify(val)); }catch(e){ /* storage unavailable — session-only */ }
}

const state = {
  step: 1,
  entryMode: 'style', // 'style' | 'subject'
  selectedStyleId: null,
  subject: '',
  scene: null,
  compositionId: null,
  colorId: null,
  lightingId: null,
  moodIds: [],
  mediumId: null,
  detailId: 'balanced',
  aspect: '3:4',
  purposeId: null,
  platformId: 'general',
  finalPrompt: null, // {en, ko}
  compareIds: [],
  favorites: loadJSON('aps_favorites', []),
  recentSubjects: loadJSON('aps_recent_subjects', []),
  recentPrompts: loadJSON('aps_recent_prompts', [])
};

function rememberSubject(text){
  state.recentSubjects = [text, ...state.recentSubjects.filter(s=>s!==text)].slice(0,8);
  saveJSON('aps_recent_subjects', state.recentSubjects);
}
function rememberPrompt(p){
  state.recentPrompts = [p, ...state.recentPrompts].slice(0,8);
  saveJSON('aps_recent_prompts', state.recentPrompts);
}
function toggleFavorite(id){
  const i = state.favorites.indexOf(id);
  if(i>=0) state.favorites.splice(i,1); else state.favorites.push(id);
  saveJSON('aps_favorites', state.favorites);
}

/* ============================================================
   LANGUAGE DETECTION + SUBJECT EXPANSION
   ============================================================ */

function detectLang(text){
  if(/[가-힣]/.test(text)) return 'ko';
  if(/[぀-ヿ]/.test(text)) return 'ja';
  return 'en';
}

const SCENE_RULES = [
  { test:/(비|장마|우천|rain|rainy)/i, env:'wet pavement with rippling puddles and soft reflections', envKo:'비에 젖어 잔잔히 빛이 반사되는 거리', light:'diffused, overcast light softened by falling rain', lightKo:'빗줄기에 부드러워진 흐린 빛', mood:['melancholic','nostalgic'], atmo:'quiet and softly melancholic, with the hush that follows rainfall' },
  { test:/(밤|야경|한밤|night|저녁|evening)/i, env:'a scene washed in deep blue night tones', envKo:'짙은 밤빛에 물든 장면', light:'artificial light sources glowing against the darkness', lightKo:'어둠 속에서 은은히 빛나는 인공조명', mood:['mysterious','nostalgic'], atmo:'hushed and quietly atmospheric, alive with scattered points of light' },
  { test:/(눈|겨울|snow|winter)/i, env:'a landscape blanketed in soft snow', envKo:'하얀 눈으로 덮인 풍경', light:'cool, even light reflected off snow', lightKo:'눈에 반사되는 차갑고 고른 빛', mood:['peaceful','melancholic'], atmo:'crisp, still and softly muffled by snowfall' },
  { test:/(바다|해변|파도|ocean|beach|sea)/i, env:'an open coastline with rolling waves and salty air', envKo:'파도가 밀려오는 탁 트인 해안', light:'bright, open daylight bouncing off the water', lightKo:'물결에 반짝이는 밝은 햇빛', mood:['peaceful','joyful'], atmo:'open, breezy and refreshingly expansive' },
  { test:/(우주|은하|별|space|galaxy|cosmos)/i, env:'the vast darkness of space dotted with distant stars', envKo:'별이 흩뿌려진 광활한 우주', light:'cold starlight and the glow of distant celestial bodies', lightKo:'차가운 별빛과 먼 천체의 은은한 빛', mood:['mysterious','surreal'], atmo:'vast, silent and awe-inspiring' },
  { test:/(도시|거리|골목|street|city|alley|urban)/i, env:'an urban street lined with buildings, signs and passersby', envKo:'건물과 간판, 행인들이 어우러진 도심 거리', light:'a mixture of daylight and artificial storefront light', lightKo:'낮빛과 상점 조명이 뒤섞인 빛', mood:['nostalgic','energetic'], atmo:'lively yet intimate, full of everyday city texture' },
  { test:/(카페|커피|coffee|cafe)/i, env:'a cozy interior with warm furnishings and the quiet bustle of a café', envKo:'아늑한 가구와 잔잔한 활기가 있는 카페 실내', light:'warm interior light spilling across tables', lightKo:'테이블 위로 번지는 따뜻한 실내조명', mood:['peaceful','nostalgic'], atmo:'intimate, warm and quietly comforting' },
  { test:/(숲|나무|forest|jungle|woods)/i, env:'a dense forest filtered with dappled natural light', envKo:'빛이 얼룩덜룩 스며드는 울창한 숲', light:'sunlight filtering softly through a canopy of leaves', lightKo:'나뭇잎 사이로 부드럽게 스며드는 햇빛', mood:['peaceful','mysterious'], atmo:'tranquil, green and gently enveloping' },
  { test:/(산|산맥|mountain)/i, env:'a dramatic mountain landscape stretching into the distance', envKo:'멀리까지 펼쳐진 웅장한 산악 풍경', light:'clear, expansive daylight over distant peaks', lightKo:'먼 봉우리까지 맑게 비추는 햇빛', mood:['dramatic','peaceful'], atmo:'majestic, vast and quietly humbling' },
  { test:/(시장|market)/i, env:'a bustling market filled with vendors, goods and passersby', envKo:'상인과 물건, 행인으로 북적이는 시장', light:'natural daylight mixed with the warm glow of stalls', lightKo:'자연광과 노점의 따뜻한 조명이 섞인 빛', mood:['energetic','joyful'], atmo:'lively, colorful and full of everyday energy' },
  { test:/(가을|단풍|autumn|fall)/i, env:'a landscape colored by autumn foliage', envKo:'단풍으로 물든 풍경', light:'warm, low autumn sunlight', lightKo:'낮게 비추는 따뜻한 가을 햇살', mood:['nostalgic','peaceful'], atmo:'golden, quiet and gently wistful' },
  { test:/(봄|벚꽃|spring|cherry blossom)/i, env:'a scene framed by spring blossoms drifting in a gentle breeze', envKo:'봄바람에 흩날리는 꽃잎이 어우러진 장면', light:'soft, fresh spring daylight', lightKo:'싱그럽고 부드러운 봄 햇살', mood:['joyful','romantic'], atmo:'fresh, tender and quietly hopeful' },
  { test:/(제주|jeju)/i, env:'a landscape of black volcanic stone walls and citrus orchards', envKo:'현무암 돌담과 귤나무가 있는 풍경', light:'clear island daylight with an ocean breeze', lightKo:'바닷바람과 함께하는 맑은 섬의 햇빛', mood:['peaceful','nostalgic'], atmo:'open, sunlit and gently rustic' },
  { test:/(미래|future|sci-?fi|사이버펑크|cyberpunk)/i, env:'a futuristic environment layered with technology and structure', envKo:'기술과 구조물이 겹겹이 쌓인 미래적 공간', light:'glowing neon and artificial light against the dark', lightKo:'어둠 속에서 빛나는 네온과 인공조명', mood:['mysterious','dramatic'], atmo:'charged, futuristic and visually dense' }
];

function expandSubject(text){
  const lang = detectLang(text);
  const matches = SCENE_RULES.filter(r => r.test.test(text));
  const primary = matches[0];
  const secondary = matches[1];
  const environment = primary ? primary.env : 'a carefully composed scene built around the subject';
  const environmentKo = primary ? primary.envKo : '섬세하게 구성된 배경';
  const lighting = primary ? primary.light : 'natural, well-balanced light';
  const lightingKo = primary ? primary.lightKo : '자연스럽고 균형 잡힌 빛';
  const moodSet = [];
  matches.forEach(m => m.mood.forEach(md => { if(!moodSet.includes(md)) moodSet.push(md); }));
  const atmosphere = primary
    ? (secondary ? `${primary.atmo}, touched with a hint of the way ${secondary.atmo.split(',')[0]} scenes feel` : primary.atmo)
    : 'quietly evocative, true to the feeling of the original idea';
  const categoryGuess = guessCategory(text);
  return { lang, environment, environmentKo, lighting, lightingKo, atmosphere, moodIds: moodSet.slice(0,2), categoryGuess };
}

function guessCategory(text){
  const t = text.toLowerCase();
  const map = {
    person:/(남자|여자|소년|소녀|사람|인물|노인|아이|청년|여성|남성|man|woman|girl|boy|person|people)/,
    animal:/(강아지|고양이|동물|리트리버|여우|새|dog|cat|animal|fox|bird)/,
    landscape:/(풍경|산|호수|들판|협곡|폭포|landscape|mountain|lake|field)/,
    city:/(도시|거리|골목|빌딩|스카이라인|city|street|alley|skyline)/,
    travel:/(여행|제주|파리|교토|산토리니|travel|jeju|paris|kyoto)/,
    family:/(가족|아빠|엄마|할머니|할아버지|family)/,
    food:/(음식|요리|만둣국|커피|빵|food|dish|coffee|bread)/,
    product:/(제품|음료|향수|화장품|운동화|product|bottle|package)/,
    architecture:/(건축|한옥|성당|마천루|주택|architecture|building|house)/,
    fantasy:/(용|마법|요정|성|기사|dragon|magic|fairy|castle|knight)/,
    scifi:/(우주|미래|로봇|사이버|화성|space|future|robot|cyber|mars)/,
    history:/(조선|고려|역사|전통|왕조|history|dynasty)/,
    abstract:/(추상|감정|흐름|파동|기억|abstract|emotion|flow)/
  };
  for(const [cat, re] of Object.entries(map)){ if(re.test(text)) return cat; }
  return null;
}

/* ============================================================
   AI RECOMMENDATION (rule-based)
   ============================================================ */

function scoreMatch(text, keywordToId){
  const t = text.toLowerCase();
  for(const [kw, id] of keywordToId){ if(t.includes(kw)) return id; }
  return null;
}

function recommendOptions(style, subjectText, scene, purposeId){
  const dnaText = Object.values(style.dna).join(' ').toLowerCase();
  const sceneText = (scene ? (scene.environment+' '+scene.lighting+' '+scene.atmosphere) : '').toLowerCase();

  // composition — from detected subject category, fallback to thirds.
  // a person embedded in a described environment (rain, street, alley…) reads as a
  // scene, not a studio portrait, so it favors a wider framing than a bare portrait cue.
  const cat = scene && scene.categoryGuess;
  const hasEnvironmentCue = !!(scene && scene.moodIds && scene.moodIds.length);
  const compMap = {
    person: hasEnvironmentCue ? 'wide' : 'portrait',
    animal:'fullbody', landscape:'wide', city:'wide', travel:'wide',
    family:'halfbody', food:'closeup', product:'central', architecture:'symmetrical',
    fantasy:'wide', scifi:'panoramic', history:'wide', abstract:'minimal'
  };
  const composition = compMap[cat] || 'thirds';

  // color — from style DNA palette description
  const color = scoreMatch(dnaText, [
    ['monochrome','monochrome'],['complementary','complementary'],['pastel','pastel'],
    ['vivid','vivid'],['saturated','vivid'],['muted','muted'],['earthy','earth'],['earth','earth'],
    ['warm','warm'],['cool','cool'],['high-contrast','highcontrast']
  ]) || 'artistoriginal';

  // lighting — style DNA first, then scene overrides
  let lighting = scoreMatch(dnaText, [
    ['golden','goldenhour'],['sunset','sunset'],['moonlight','moonlight'],['candle','candlelight'],
    ['window','windowlight'],['chiaroscuro','dramatic'],['dramatic','dramatic'],['neon','neon'],
    ['diffused','softdiffused'],['studio','studio'],['glow','backlighting']
  ]) || 'daylight';
  const sceneLighting = scoreMatch(sceneText, [
    ['night','moonlight'],['rain','softdiffused'],['snow','softdiffused'],['neon','neon'],['sunset','sunset'],
    ['dawn','morning'],['starlight','moonlight']
  ]);
  if(sceneLighting) lighting = sceneLighting;

  // mood — combine style emotion + scene mood, cap at 2
  const styleMood = scoreMatch(style.dna.emotion.toLowerCase(), [
    ['restless','energetic'],['passionate','dramatic'],['calm','peaceful'],['tranquil','peaceful'],
    ['joyful','joyful'],['melancholic','melancholic'],['mysterious','mysterious'],['nostalgic','nostalgic'],
    ['whimsical','whimsical'],['serene','elegant'],['dignified','elegant'],['awe','dramatic'],
    ['anguished','dramatic'],['romantic','romantic'],['sensuous','romantic']
  ]) || 'elegant';
  const moodIds = [];
  (scene && scene.moodIds || []).forEach(m => { if(!moodIds.includes(m)) moodIds.push(m); });
  if(!moodIds.includes(styleMood)) moodIds.push(styleMood);
  const mood = moodIds.slice(0,2);

  // medium — from lookup table
  const medium = STYLE_MEDIUM[style.id] || 'oil';

  // detail — richer styles / print-like purposes get more detail
  const richStyles = ['klimt','mucha','jeong-seon','davinci','michelangelo','hokusai','hiroshige','rembrandt'];
  const simpleStyles = ['mondrian','minimalism','matisse','korean-minhwa'];
  let detail = 'balanced';
  if(richStyles.includes(style.id) || ['print','poster','book'].includes(purposeId)) detail = 'highdetail';
  if(simpleStyles.includes(style.id) && !['print','poster'].includes(purposeId)) detail = 'simple';

  // aspect ratio — from purpose first, then category
  const purposeAspect = { thumbnail:'16:9', wallpaper:'9:16', instagram:'1:1', sns:'4:5',
    hero:'21:9', poster:'3:4', print:'3:4', package:'1:1', book:'3:4' };
  let aspect = purposeAspect[purposeId];
  if(!aspect){
    if(composition === 'wide' || composition === 'panoramic') aspect = composition === 'panoramic' ? '21:9' : '16:9';
    else {
      const catAspect = { landscape:'16:9', city:'16:9', travel:'16:9', scifi:'21:9', person:'4:5', product:'1:1' };
      aspect = catAspect[cat] || '3:4';
    }
  }

  const purposeLabel = (PURPOSE.find(p=>p.id===purposeId)||{ko:'전반적인 용도'}).ko;
  const L = id => (COMPOSITION.concat(COLOR,LIGHTING,MOOD,MEDIUM,DETAIL).find(o=>o.id===id)||{}).ko || id;

  return {
    composition, color, lighting, mood, medium, detail, aspect,
    reasons: {
      composition: `입력하신 장면의 성격에 맞춰 '${L(composition)}' 구도를 추천했어요.`,
      color: `${style.name}${style.name.endsWith('h')?'':''} 특유의 색채 경향을 반영해 '${L(color)}' 팔레트를 추천했어요.`,
      lighting: `장면의 시간대·분위기와 화풍의 빛 표현을 함께 고려해 '${L(lighting)}'을 추천했어요.`,
      mood: `주제와 화풍의 정서를 종합해 '${mood.map(L).join(', ')}' 무드를 추천했어요.`,
      medium: `${style.name}가 실제로 즐겨 사용한 기법인 '${L(medium)}'을 반영했어요.`,
      detail: `사용 목적(${purposeLabel})에 맞춰 '${L(detail)}' 디테일을 추천했어요.`,
      aspect: `사용 목적과 장면 구도를 고려해 '${aspect}' 비율을 추천했어요.`
    }
  };
}

/* ============================================================
   PROMPT BUILDER
   ============================================================ */

function label(list, id){ const o = list.find(x=>x.id===id); return o ? o.en : ''; }
function labelKo(list, id){ const o = list.find(x=>x.id===id); return o ? o.ko : ''; }

function buildPromptEN(ctx){
  const { style, subject, scene, compositionId, colorId, lightingId, moodIds, mediumId, detailId, aspect, purposeId, platformId } = ctx;
  const dna = style.dna;
  const compPhrase = label(COMPOSITION, compositionId) || 'a balanced, well-considered composition';
  const colorPhrase = colorId === 'artistoriginal' ? dna.palette : (label(COLOR, colorId) || dna.palette);
  const lightingPhrase = label(LIGHTING, lightingId) || dna.lighting;
  const moodPhrase = moodIds.map(m=>label(MOOD,m)).filter(Boolean).join(' and ') || dna.emotion;
  const mediumPhrase = label(MEDIUM, mediumId) || 'painting';
  const detailPhrase = label(DETAIL, detailId) || 'a balanced level of detail';
  const purpose = PURPOSE.find(p=>p.id===purposeId);

  let sceneSentence = '';
  if(scene){
    sceneSentence = ` The setting is ${scene.environment}, under ${scene.lighting}.`;
  }

  let out = `Create a ${mediumPhrase} interpretation of ${subject}, rendered in the visual language of ${style.name} (${style.movement}).${sceneSentence} `
    + `Compose the image with ${compPhrase}. `
    + `Apply the artist's defining characteristics: ${dna.brushwork}, ${dna.line}, and ${dna.shape}. `
    + `Use ${colorPhrase}, illuminated by ${lightingPhrase}, with ${dna.texture}. `
    + `Perspective and depth follow ${dna.perspective}, and the overall composition carries ${dna.rhythm}. `
    + `The atmosphere should feel ${moodPhrase}${scene ? `, ${scene.atmosphere}` : `, evoking ${dna.atmosphere}`}. `
    + `Render the surface with ${detailPhrase}, using ${dna.surface}. `;

  if(purpose) out += `The final image should work well as ${purpose.en}, presented in a ${aspect} aspect ratio.`;
  else out += `Present the final image in a ${aspect} aspect ratio.`;

  out += ' ' + platformNote(platformId, 'en');
  return out.replace(/\s+/g,' ').trim();
}

function buildPromptKO(ctx){
  const { style, subject, scene, compositionId, colorId, lightingId, moodIds, mediumId, detailId, aspect, purposeId, platformId } = ctx;
  const compPhrase = labelKo(COMPOSITION, compositionId) || '균형 잡힌 구도';
  const colorPhrase = labelKo(COLOR, colorId) || '화가 고유의 색감';
  const lightingPhrase = labelKo(LIGHTING, lightingId) || '자연스러운 빛';
  const moodPhrase = moodIds.map(m=>labelKo(MOOD,m)).filter(Boolean).join(', ') || '감성적인';
  const mediumPhrase = labelKo(MEDIUM, mediumId) || '회화';
  const detailPhrase = labelKo(DETAIL, detailId) || '균형 잡힌';
  const purpose = PURPOSE.find(p=>p.id===purposeId);

  let sceneSentence = '';
  if(scene){
    sceneSentence = ` 장면은 ${scene.environmentKo || '섬세하게 구성된 배경'} 속에서, ${scene.lightingKo || '알맞은 빛'}이 감도는 모습으로 표현합니다.`;
  }

  let out = `${subject}을(를) ${style.name}(${style.nameNative !== style.name ? style.nameNative+', ' : ''}${style.movementKo}) 화풍의 ${mediumPhrase}로 표현합니다.`
    + sceneSentence + ' '
    + `${compPhrase} 구도를 사용하고, ${style.shortKo} `
    + `색감은 ${colorPhrase}을 기본으로 하며, ${lightingPhrase} 아래 장면을 비춥니다. `
    + `전체적인 분위기는 ${moodPhrase} 느낌으로, 디테일은 ${detailPhrase} 수준으로 마무리합니다.`;

  if(purpose) out += ` ${purpose.ko} 용도에 맞게 구성하며, 최종 비율은 ${aspect}로 출력합니다.`;
  else out += ` 최종 비율은 ${aspect}로 출력합니다.`;

  return out.replace(/\s+/g,' ').trim();
}

function platformNote(platformId, lang){
  const notes = {
    chatgpt:   { en:'Describe the scene in clear, natural sentences rather than a keyword list.', ko:'키워드 나열보다 자연스러운 문장으로 설명하면 더 안정적인 결과를 얻습니다.' },
    gemini:    { en:'Favor descriptive, conversational phrasing with concrete visual nouns.', ko:'구체적인 시각 명사와 자연스러운 문장을 사용하면 좋습니다.' },
    imagen:    { en:'State the medium and style explicitly near the beginning of the prompt.', ko:'프롬프트 앞부분에 매체와 화풍을 명확히 명시하세요.' },
    midjourney:{ en:'Consider appending style and quality parameters such as --ar and --style after this description.', ko:'이 설명 뒤에 --ar, --style 같은 파라미터를 추가하면 좋습니다.' },
    firefly:   { en:'Keep the description content-safe and focused on visual style, avoiding copyrighted character names.', ko:'저작권이 있는 캐릭터명은 피하고 시각적 스타일 위주로 표현하세요.' },
    sd:        { en:'This description also works well converted into a comma-separated tag list if your workflow needs it.', ko:'필요 시 쉼표로 구분된 태그 목록 형태로도 변환해 사용할 수 있습니다.' },
    general:   { en:'This prompt is written to be broadly compatible across most AI image generators.', ko:'대부분의 AI 이미지 생성기에서 범용적으로 사용할 수 있도록 작성되었습니다.' }
  };
  const n = notes[platformId] || notes.general;
  return lang === 'ko' ? n.ko : n.en;
}

/* ============================================================
   SEARCH
   ============================================================ */

function searchStyles(query){
  const q = query.trim().toLowerCase();
  if(!q) return STYLES;
  const boost = {};
  SEARCH_SYNONYMS.forEach(s => { if(q.includes(s.q.toLowerCase()) || s.q.includes(q)) s.ids.forEach(id => boost[id] = (boost[id]||0) + 10); });

  const tokens = q.split(/\s+/).filter(Boolean);
  const scored = STYLES.map(s => {
    const hay = [s.name, s.nameNative, s.movement, s.movementKo, s.shortKo, s.country, ...(s.tags||[])].join(' ').toLowerCase();
    let score = boost[s.id] || 0;
    tokens.forEach(t => {
      if(hay.includes(t)) score += 3;
      (s.tags||[]).forEach(tag => { const tl = tag.toLowerCase(); if(tl.includes(t) || t.includes(tl)) score += 2; });
    });
    return { s, score };
  }).filter(x => x.score > 0);
  scored.sort((a,b)=>b.score-a.score);
  return scored.map(x=>x.s);
}

/* ============================================================
   AI STYLE FINDER
   ============================================================ */

function findStyles(ideaText){
  const scene = expandSubject(ideaText);
  const t = ideaText.toLowerCase();
  const scored = STYLES.filter(s=>s.type==='artist').map(style => {
    const dnaText = Object.values(style.dna).join(' ').toLowerCase();
    let score = 0;
    (style.tags||[]).forEach(tag => { if(t.includes(tag.toLowerCase()) || tag.toLowerCase().includes(t)) score += 4; });
    (scene.moodIds||[]).forEach(m => { const mo = MOOD.find(x=>x.id===m); if(mo && dnaText.includes(mo.en)) score += 3; if(dnaText.includes(m)) score += 2; });
    if(scene.categoryGuess){
      const catHints = {
        person:['portrait','figure'], animal:['animal'], landscape:['landscape'], city:['urban','architectural'],
        fantasy:['mythic','symbolic','dream'], scifi:['abstract','futur'], abstract:['abstract','non-representational']
      };
      (catHints[scene.categoryGuess]||[]).forEach(h => { if(dnaText.includes(h)) score += 2; });
    }
    // generic emotional-keyword overlap
    ['외로운','고독','solitary','alone'].forEach(k=>{ if(t.includes(k) && dnaText.includes('solitary')) score += 3; });
    ['밤','night','야간'].forEach(k=>{ if(t.includes(k) && (dnaText.includes('night')||dnaText.includes('dark')||dnaText.includes('moon'))) score += 2; });
    return { style, score };
  }).filter(x=>x.score>0);
  scored.sort((a,b)=>b.score-a.score);
  let top = scored.slice(0,5).map(x=>x.style);
  if(top.length < 3){
    // fallback: mood-based defaults so the feature always returns something useful
    const fallbackIds = scene.moodIds.includes('melancholic') || scene.moodIds.includes('mysterious')
      ? ['hopper','munch','van-gogh','rembrandt','friedrich']
      : ['monet','renoir','klimt','matisse','chagall'];
    fallbackIds.forEach(id => { if(!top.find(s=>s.id===id)) top.push(byId(id)); });
    top = top.slice(0,5);
  }
  return top.map(style => ({ style, reason: compatibilityReason(style, scene, ideaText) }));
}

function compatibilityReason(style, scene, ideaText){
  const parts = [];
  if(scene.moodIds.length) parts.push(`${scene.moodIds.map(m=>labelKo(MOOD,m)).join(', ')} 감정`);
  parts.push(style.dna.emotion);
  return `${style.shortKo} 입력하신 장면의 ${parts.join(' · ')} 결과 톤과 시각적으로 잘 맞습니다.`;
}

/* ============================================================
   REPRESENTATIVE ARTWORK IMAGES (client-side, best-effort)
   Looks up a public-domain/openly-licensed thumbnail of one representative
   work per style via the Wikipedia API (CORS-enabled, no key required).
   Every failure mode (offline, no match, blocked, rate-limited) resolves to
   null so the caller can keep showing the gradient swatch — an image here
   is a progressive enhancement, never a requirement.
   ============================================================ */

const ARTWORK_CACHE_KEY = 'aps_artwork_cache_v2';
let artworkCache = loadJSON(ARTWORK_CACHE_KEY, {});
const artworkInFlight = {};

/* Generic keyed lookup: cacheKey identifies where the result is stored/reused
   (a style id, or "work::<styleId>::<index>" for one specific painting).
   query is the free-text search string sent to Wikipedia's search API.
   Resolves to a {thumb, full, pageUrl, title} detail object, or null on any
   failure — search miss, offline, blocked network, rate limit. pageUrl always
   points at the API-returned Wikipedia article for that exact match (never a
   guessed URL), which is the safest "learn more" / official-source link we
   can offer without verifying hundreds of individual museum pages by hand. */
async function fetchArtworkDetail(cacheKey, query){
  if(!cacheKey || !query) return null;
  if(Object.prototype.hasOwnProperty.call(artworkCache, cacheKey)) return artworkCache[cacheKey];
  if(artworkInFlight[cacheKey]) return artworkInFlight[cacheKey];

  const p = (async () => {
    try{
      const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*&srlimit=1`;
      const sRes = await fetch(searchUrl, { mode:'cors' });
      if(!sRes.ok) throw new Error('search failed');
      const sData = await sRes.json();
      const title = sData && sData.query && sData.query.search && sData.query.search[0] && sData.query.search[0].title;
      if(!title) throw new Error('no search result');

      const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g,'_'))}`;
      const rRes = await fetch(summaryUrl, { mode:'cors' });
      if(!rRes.ok) throw new Error('summary failed');
      const rData = await rRes.json();
      const thumb = (rData.thumbnail && rData.thumbnail.source) || null;
      const full = (rData.originalimage && rData.originalimage.source) || thumb;
      if(!thumb && !full) throw new Error('no image');
      const detail = {
        thumb: thumb || full,
        full: full || thumb,
        pageUrl: (rData.content_urls && rData.content_urls.desktop && rData.content_urls.desktop.page)
          || `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g,'_'))}`,
        title: rData.title || title
      };
      artworkCache[cacheKey] = detail;
      saveJSON(ARTWORK_CACHE_KEY, artworkCache);
      return detail;
    }catch(e){
      artworkCache[cacheKey] = null;
      saveJSON(ARTWORK_CACHE_KEY, artworkCache);
      return null;
    }finally{
      delete artworkInFlight[cacheKey];
    }
  })();
  artworkInFlight[cacheKey] = p;
  return p;
}

async function fetchArtworkByQuery(cacheKey, query){
  const detail = await fetchArtworkDetail(cacheKey, query);
  return detail ? detail.thumb : null;
}

function fetchStyleArtwork(style){
  if(!style) return Promise.resolve(null);
  return fetchArtworkByQuery(style.id, style.wikiQuery || `${style.name} painting`);
}

/* extracts "English Title" out of a "한국어 제목 (English Title)" work string,
   falling back to the whole string when there's no trailing parenthetical.
   Appending "painting" steers the search away from unrelated same-named
   pages (letters, biography sections, etc.) toward the artwork itself. */
function workSearchQuery(style, workLabel){
  const m = /\(([^)]+)\)\s*$/.exec(workLabel);
  const title = m ? m[1] : workLabel;
  return `${title} ${style.name} painting`;
}

function wikipediaUrl(style){
  return `https://en.wikipedia.org/wiki/${encodeURIComponent(style.name.replace(/ /g,'_'))}`;
}

/* expose for the UI layer */
window.APS = {
  STYLES, byId, COMPOSITION, COLOR, LIGHTING, MOOD, MEDIUM, DETAIL, ASPECT, PURPOSE, PLATFORMS, CATEGORIES,
  state, rememberSubject, rememberPrompt, toggleFavorite,
  detectLang, expandSubject, recommendOptions, buildPromptEN, buildPromptKO, platformNote,
  searchStyles, findStyles, label, labelKo,
  fetchStyleArtwork, fetchArtworkByQuery, fetchArtworkDetail, workSearchQuery, wikipediaUrl
};

})();
