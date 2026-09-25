/* ART PROMPT STUDIO — UI rendering & interaction layer */
(function(){
'use strict';

const A = window.APS;
const S = A.state;

const $main = document.getElementById('main');
const $modal = document.getElementById('styleModal');
const $lightbox = document.getElementById('artworkLightbox');
const $toast = document.getElementById('toast');
const $stepsBar = document.getElementById('stepsBar');
const $topNav = document.getElementById('topNav');

let currentView = 'home';
let galleryFilter = 'all';
let gallerySearchQ = '';
let compareSelection = [];
let compareSubject = '';
let compareResults = null;
let finderIdea = '';
let finderResults = null;
let finalLang = 'en';
let aiSetFields = {};
let lastRec = null;
let modalStyleId = null;

const SUBJECT_EXAMPLES = [
  '비 오는 서울 골목을 걷는 여성','바닷가에서 뛰어노는 골든리트리버','밤에 커피를 마시는 중년 남성',
  '우주에서 바라본 지구','제주도의 돌담과 귤나무','책을 읽는 소녀','미래의 서울','우리 회사의 신제품 음료'
];
const PREVIEW_STYLE_IDS = ['van-gogh','monet','hokusai','klimt','hopper','korean-minhwa'];
const FEATURED_HOME_IDS = ['van-gogh','monet','klimt','hokusai','vermeer','matisse','jeong-seon','hopper'];

/* ---------------- helpers ---------------- */
function esc(str){ return String(str==null?'':str).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function showToast(msg){
  $toast.textContent = msg; $toast.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(()=>$toast.classList.remove('show'), 2600);
}
function swVars(style){ return `--c1:${style.colors[0]};--c2:${style.colors[1]};--c3:${style.colors[2]};--c4:${style.colors[3]};`; }
function selectedStyle(){ return S.selectedStyleId ? A.byId(S.selectedStyleId) : null; }
function miniPromptText(style, subject){
  const subj = subject || '이 주제';
  return `${subj} — ${style.dna.brushwork}, ${style.dna.palette}, ${style.dna.lighting}.`;
}

function setActiveNav(view){
  $topNav.querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.view === view));
}
function setActiveStep(n){
  $stepsBar.querySelectorAll('.step').forEach(el => {
    const s = +el.dataset.step;
    el.classList.toggle('active', s === n);
    el.classList.toggle('done', s < n);
  });
}
function showStepsBar(show){ $stepsBar.classList.toggle('hidden', !show); }

const FLOW_STEP = { gallery:1, subject:2, customize:3, optimize:4, final:5 };

function go(view){
  currentView = view;
  setActiveNav(['home','gallery','compare','favorites','finder'].includes(view) ? view : '');
  if(FLOW_STEP[view]){ showStepsBar(true); setActiveStep(FLOW_STEP[view]); } else { showStepsBar(false); }
  window.scrollTo(0,0);
  render();
}

function render(){
  closeModal();
  closeLightbox();
  switch(currentView){
    case 'home': $main.innerHTML = viewHome(); break;
    case 'gallery': $main.innerHTML = viewGallery(); break;
    case 'subject': $main.innerHTML = viewSubject(); break;
    case 'customize': $main.innerHTML = viewCustomize(); break;
    case 'optimize': $main.innerHTML = viewOptimize(); break;
    case 'final': $main.innerHTML = viewFinal(); break;
    case 'compare': $main.innerHTML = viewCompare(); break;
    case 'favorites': $main.innerHTML = viewFavorites(); break;
    case 'finder': $main.innerHTML = viewFinder(); break;
    default: $main.innerHTML = viewHome();
  }
  setupArtworkObserver();
}

/* ============================================================
   REPRESENTATIVE ARTWORK IMAGES — lazy-load into any element that
   carries data-artwork-id, using an IntersectionObserver so the app
   never fires 55 network requests at once. Best-effort: on any failure
   the gradient swatch underneath stays exactly as it was.
   ============================================================ */
const ARTWORK_SELECTOR = '[data-artwork-id], [data-artwork-query]';
let artworkObserver = null;
function setupArtworkObserver(){
  if(artworkObserver) artworkObserver.disconnect();
  if(typeof IntersectionObserver === 'undefined'){
    document.querySelectorAll(ARTWORK_SELECTOR).forEach(loadArtworkInto);
    return;
  }
  artworkObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        artworkObserver.unobserve(entry.target);
        loadArtworkInto(entry.target);
      }
    });
  }, { rootMargin: '200px' });
  document.querySelectorAll(ARTWORK_SELECTOR).forEach(el => artworkObserver.observe(el));
}
async function loadArtworkInto(container){
  if(!container) return;
  const img = container.querySelector('.artwork-img');
  if(!img) return;
  try{
    let url;
    if(container.dataset.artworkQuery){
      url = await A.fetchArtworkByQuery(container.dataset.artworkKey, container.dataset.artworkQuery);
    } else {
      url = await A.fetchStyleArtwork(A.byId(container.dataset.artworkId));
    }
    if(!url) return;
    img.onload = () => img.classList.add('loaded');
    img.onerror = () => img.remove();
    img.src = url;
  }catch(e){ /* keep gradient swatch as-is */ }
}

/* ============================================================
   STYLE CARD (shared partial)
   ============================================================ */
function styleCard(style, opts){
  opts = opts || {};
  const isSelected = S.selectedStyleId === style.id;
  const isFav = S.favorites.includes(style.id);
  return `
  <div class="style-card ${isSelected ? 'selected':''}" data-action="open-style" data-id="${style.id}">
    <div class="swatch" style="${swVars(style)}" data-artwork-id="${style.id}">
      <img class="artwork-img" alt="" loading="lazy">
      <button class="fav-btn ${isFav?'active':''}" data-action="toggle-fav" data-id="${style.id}" title="즐겨찾기">${isFav?'♥':'♡'}</button>
      <span class="type-badge">${style.type==='artist' ? '화가' : '사조'}</span>
    </div>
    <div class="body">
      <h4>${esc(style.name)}</h4>
      <div class="native">${esc(style.nameNative)} · ${esc(style.period)}</div>
      <div class="desc">${esc(style.shortKo)}</div>
      <div class="meta"><span>${esc(style.country)}</span><span>${esc(style.movementKo)}</span></div>
      <button class="pick-btn" data-action="pick-style" data-id="${style.id}">${isSelected?'✓ 선택됨':'이 스타일 선택'}</button>
    </div>
  </div>`;
}

/* ============================================================
   HOME
   ============================================================ */
function viewHome(){
  const featured = FEATURED_HOME_IDS.map(A.byId).filter(Boolean);
  return `
  <div class="hero">
    <h1>ART PROMPT STUDIO</h1>
    <p class="sub-en">Turn an idea into an artistically precise AI image prompt.</p>
    <p class="sub-ko">당신의 아이디어를 작품을 만드는 AI 프롬프트로 바꿔보세요.</p>
    <div class="hero-cta">
      <button class="cta-btn primary" data-action="start-style">
        <span class="cta-icon">🎨</span>
        <span class="cta-title">스타일로 시작하기</span>
        <span class="cta-desc">Choose an Art Style — 화가와 사조를 먼저 골라보세요</span>
      </button>
      <button class="cta-btn" data-action="start-subject">
        <span class="cta-icon">✏️</span>
        <span class="cta-title">그리고 싶은 것부터 시작하기</span>
        <span class="cta-desc">Start with a Subject — 아이디어부터 입력해보세요</span>
      </button>
    </div>
  </div>
  <div class="home-featured">
    <h3>대표 화풍 살펴보기</h3>
    <div class="grid dense">
      ${featured.map(s=>styleCard(s)).join('')}
    </div>
    <div style="text-align:center;margin-top:26px;">
      <button class="btn ghost" data-action="goto-gallery">전체 55개 화풍 보러가기 →</button>
    </div>
  </div>`;
}

/* ============================================================
   GALLERY
   ============================================================ */
function viewGallery(){
  let list = A.searchStyles ? (gallerySearchQ ? A.searchStyles(gallerySearchQ) : A.STYLES) : A.STYLES;
  if(galleryFilter !== 'all') list = list.filter(s => s.type === galleryFilter);
  return `
  <div class="section-head">
    <div class="eyebrow">Step 1 · Style Gallery</div>
    <h2>화풍을 선택하세요</h2>
    <p>39명의 화가와 16개 미술 사조 — 원하는 카드를 눌러 자세히 살펴보세요.</p>
  </div>
  <div class="search-row">
    <div class="search-box">
      <span>🔍</span>
      <input type="text" id="gallerySearch" placeholder="화가 또는 화풍 검색 (예: Monet, 강렬한 붓터치, 몽환적인 그림)" value="${esc(gallerySearchQ)}">
    </div>
  </div>
  <div class="filter-chips">
    <button class="chip ${galleryFilter==='all'?'active':''}" data-action="gallery-filter" data-f="all">전체 (${A.STYLES.length})</button>
    <button class="chip ${galleryFilter==='artist'?'active':''}" data-action="gallery-filter" data-f="artist">화가</button>
    <button class="chip ${galleryFilter==='movement'?'active':''}" data-action="gallery-filter" data-f="movement">미술 사조</button>
  </div>
  ${list.length ? `<div class="grid dense">${list.map(s=>styleCard(s)).join('')}</div>` :
    `<div class="empty-state"><div class="icon">🔍</div>검색 결과가 없습니다.<br>다른 키워드로 시도해보세요.</div>`}
  `;
}

/* ============================================================
   STYLE DETAIL MODAL
   ============================================================ */
const DNA_DISPLAY_FIELDS = [
  ['brushwork','붓터치'],['line','선의 질감'],['palette','색채'],['lighting','빛'],
  ['composition','구도'],['perspective','원근'],['texture','질감'],['shape','형태 언어'],
  ['emotion','감정'],['atmosphere','분위기'],['humanFigure','인물 표현'],['rhythm','리듬']
];

function openStyle(id){
  modalStyleId = id;
  const style = A.byId(id);
  if(!style) return;
  const isFav = S.favorites.includes(id);
  $modal.innerHTML = `
  <div class="modal-card">
    <div class="modal-hero" style="${swVars(style)}" data-artwork-id="${style.id}">
      <img class="artwork-img" alt="" loading="lazy">
      <button class="close-btn" data-action="close-modal">✕</button>
    </div>
    <div class="modal-body">
      <h3 class="k-title">${esc(style.name)}</h3>
      <div class="k-native">${esc(style.nameNative)} · ${esc(style.period)} · ${esc(style.country)}</div>
      <div class="k-meta">
        <span>${esc(style.type==='artist' ? '화가' : '미술 사조')}</span>
        <span>${esc(style.movementKo)}</span>
      </div>
      <p class="k-desc">${esc(style.shortKo)}</p>
      ${style.bio ? `<p class="k-bio">${esc(style.bio)}</p>` : ''}

      <div class="link-row">
        ${style.officialUrl ? `<a class="btn ghost sm" href="${esc(style.officialUrl)}" target="_blank" rel="noopener">🔗 공식 웹사이트</a>` : ''}
        <a class="btn ghost sm" href="${esc(A.wikipediaUrl(style))}" target="_blank" rel="noopener">📖 Wikipedia에서 더 보기</a>
      </div>

      <div class="dna-note">
        <b>🧬 AI를 위한 시각적 스타일 설명</b><br>
        "${esc(buildStyleParagraph(style))}"<br><br>
        AI에게 화가 이름만 전달하는 것보다 이렇게 시각적 특징을 구체적으로 설명하면 보다 안정적인 결과를 얻을 수 있습니다.
      </div>

      <dl class="dna-grid">
        ${DNA_DISPLAY_FIELDS.map(([k,label]) => `
          <div class="dna-item"><dt>${label}</dt><dd>${esc(style.dna[k])}</dd></div>
        `).join('')}
      </dl>

      ${worksSectionHTML(style)}

      <div class="modal-actions">
        <button class="btn primary" data-action="pick-style" data-id="${style.id}">이 스타일 선택</button>
        <button class="btn ghost" data-action="toggle-fav" data-id="${style.id}">${isFav?'♥ 즐겨찾기 해제':'♡ 즐겨찾기 추가'}</button>
        <button class="btn ghost" data-action="close-modal">닫기</button>
      </div>
    </div>
  </div>`;
  $modal.classList.remove('hidden');
  setupArtworkObserver();
}

function worksSectionHTML(style){
  if(!style.works || !style.works.length) return '';
  if(style.works.length < 4){
    // movement cards: a single generic line, no per-work images
    return `<div class="works-list"><b>대표작 · </b>${style.works.map(esc).join(' / ')}</div>`;
  }
  return `
    <div class="works-section">
      <h4>대표작 (${style.works.length})</h4>
      <div class="works-grid">
        ${style.works.map((w, i) => `
          <div class="work-card" data-action="open-work" data-artwork-key="work::${style.id}::${i}"
               data-artwork-query="${esc(A.workSearchQuery(style, w))}" data-label="${esc(w)}"
               data-style-name="${esc(style.name)}" data-style-id="${style.id}" data-index="${i}">
            <div class="work-thumb"><img class="artwork-img" alt="" loading="lazy"></div>
            <div class="work-label">${esc(w)}</div>
          </div>
        `).join('')}
      </div>
    </div>`;
}
function closeModal(){ $modal.classList.add('hidden'); $modal.innerHTML=''; modalStyleId=null; }

/* ============================================================
   ARTWORK LIGHTBOX — large, web-album style view of one style's
   representative works: prev/next steps through style.works, wrapping
   around at the ends. Each work links to the exact Wikipedia page its
   thumbnail was resolved from (a real API-returned URL, never guessed).
   ============================================================ */
let lightboxToken = 0;
let lightboxStyleId = null;
let lightboxIndex = 0;

function openArtworkLightbox(el){
  const styleId = el.dataset.styleId;
  const index = +el.dataset.index;
  if(!styleId || Number.isNaN(index)) return;
  showLightbox(styleId, index);
}

async function showLightbox(styleId, index){
  const style = A.byId(styleId);
  if(!style || !style.works || !style.works.length) return;
  const len = style.works.length;
  const i = ((index % len) + len) % len; // wrap both directions
  lightboxStyleId = styleId;
  lightboxIndex = i;

  const label = style.works[i];
  const key = `work::${styleId}::${i}`;
  const query = A.workSearchQuery(style, label);
  const showNav = len > 1;

  const myToken = ++lightboxToken;
  $lightbox.innerHTML = `
    <div class="lightbox-card">
      <button class="lightbox-close" data-action="close-lightbox">✕</button>
      ${showNav ? `<button class="lightbox-nav prev" data-action="lightbox-prev">&#10094;</button>` : ''}
      ${showNav ? `<button class="lightbox-nav next" data-action="lightbox-next">&#10095;</button>` : ''}
      <div class="lightbox-img-wrap"><div class="spinner"></div></div>
      <div class="lightbox-caption">
        <div class="lightbox-title">${esc(label)}</div>
        <div class="lightbox-sub">${esc(style.name)}${showNav ? ` · ${i+1} / ${len}` : ''}</div>
      </div>
    </div>`;
  $lightbox.classList.remove('hidden');

  const detail = await A.fetchArtworkDetail(key, query);
  if(lightboxToken !== myToken) return; // closed or replaced while fetching

  const wrap = $lightbox.querySelector('.lightbox-img-wrap');
  const caption = $lightbox.querySelector('.lightbox-caption');
  if(detail && detail.full){
    wrap.innerHTML = `<img src="${esc(detail.full)}" alt="${esc(label)}">`;
  } else {
    wrap.innerHTML = `<div class="lightbox-empty">이미지를 불러오지 못했습니다.<br>아래 링크에서 작품을 확인해보세요.</div>`;
  }
  const linkUrl = (detail && detail.pageUrl) || `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(query)}`;
  caption.insertAdjacentHTML('beforeend', `<a class="btn sm" href="${esc(linkUrl)}" target="_blank" rel="noopener">더 알아보기 →</a>`);
}

function lightboxStep(delta){
  if(lightboxStyleId == null) return;
  showLightbox(lightboxStyleId, lightboxIndex + delta);
}
function closeLightbox(){
  lightboxToken++; lightboxStyleId = null;
  $lightbox.classList.add('hidden'); $lightbox.innerHTML='';
}

function buildStyleParagraph(style){
  const d = style.dna;
  return `Expressive ${style.movement.toLowerCase()} treatment with ${d.brushwork}, ${d.texture}, and ${d.shape}. `
    + `A palette built from ${d.palette}, shaped by ${d.lighting}. Composition follows ${d.composition}, with ${d.perspective} and ${d.rhythm}. `
    + `The overall feeling is ${d.emotion}, set within ${d.atmosphere}.`;
}

/* ============================================================
   SUBJECT STEP
   ============================================================ */
function viewSubject(){
  const catChips = A.CATEGORIES.map(c => `<button class="cat-chip" data-action="subject-cat" data-c="${c.id}">${c.ko} <span style="opacity:.6">${c.en}</span></button>`).join('');
  return `
  <div class="section-head">
    <div class="eyebrow">Step 2 · Subject</div>
    <h2>무엇을 그리고 싶으세요?</h2>
    <p>짧게 입력해도 AI가 장면을 구체화해 드립니다.</p>
  </div>
  <div class="subject-box">
    <textarea class="subject-input" id="subjectInput" rows="2" placeholder="예: 비 오는 서울 골목을 걷는 여성">${esc(S.subject)}</textarea>
  </div>
  <div class="suggest-row">
    ${SUBJECT_EXAMPLES.map(e=>`<button class="suggest-chip" data-action="fill-subject" data-s="${esc(e)}">${esc(e)}</button>`).join('')}
  </div>
  <div class="cat-row">${catChips}</div>
  <div id="catSuggestBox"></div>
  <div style="text-align:center;margin-bottom:10px;">
    <button class="btn primary" data-action="expand-subject">✨ AI로 장면 분석하기</button>
  </div>
  <div id="sceneBox"></div>
  <div id="previewBox"></div>
  <div class="btn-row" style="max-width:900px;margin:20px auto 0;justify-content:center;">
    <button class="btn ghost" data-action="go-home">← 처음으로</button>
    <button class="btn dark" data-action="to-customize">다음: 커스터마이즈 →</button>
  </div>`;
}

function renderSceneAndPreview(){
  const sceneBox = document.getElementById('sceneBox');
  const previewBox = document.getElementById('previewBox');
  if(!sceneBox || !previewBox) return;
  if(!S.subject.trim()){
    sceneBox.innerHTML = '';
    previewBox.innerHTML = '';
    return;
  }
  if(!S.scene) S.scene = A.expandSubject(S.subject);
  const sc = S.scene;
  sceneBox.innerHTML = `
    <div class="scene-card">
      <div class="scene-label">🧠 AI 장면 확장</div>
      <div class="scene-row"><b>Subject</b><span>${esc(S.subject)}</span></div>
      <div class="scene-row"><b>Environment</b><span>${esc(sc.environmentKo)}</span></div>
      <div class="scene-row"><b>Lighting</b><span>${esc(sc.lightingKo)}</span></div>
      <div class="scene-row"><b>Atmosphere</b><span>${esc(sc.atmosphere)}</span></div>
    </div>`;

  const ids = PREVIEW_STYLE_IDS;
  previewBox.innerHTML = `
    <div class="section-head" style="margin-bottom:18px;">
      <div class="eyebrow">Style × Subject Preview</div>
      <h2 style="font-size:22px;">이 주제, 다른 화풍으로는?</h2>
    </div>
    <div class="grid dense">
      ${ids.map(id => { const st = A.byId(id); return `
        <div class="preview-card ${S.selectedStyleId===id?'selected':''}" data-action="pick-style" data-id="${id}">
          <div class="swatch" style="${swVars(st)}" data-artwork-id="${st.id}"><img class="artwork-img" alt="" loading="lazy"></div>
          <div class="pbody">
            <h5>${esc(st.name)}</h5>
            <p>${esc(st.shortKo)}</p>
            <div class="mini-prompt">${esc(miniPromptText(st, S.subject))}</div>
          </div>
        </div>`; }).join('')}
    </div>
    <div style="text-align:center;margin-top:18px;">
      <button class="btn ghost" data-action="goto-gallery">더 많은 화풍으로 보기</button>
    </div>`;
  setupArtworkObserver();
}

function renderCatSuggest(catId){
  const box = document.getElementById('catSuggestBox');
  if(!box) return;
  const cat = A.CATEGORIES.find(c=>c.id===catId);
  if(!cat){ box.innerHTML=''; return; }
  box.innerHTML = `<div class="suggest-row">${cat.ex.map(e=>`<button class="suggest-chip" data-action="fill-subject" data-s="${esc(e)}">${esc(e)}</button>`).join('')}</div>`;
}

/* ============================================================
   CUSTOMIZE STEP
   ============================================================ */
function chipGroup(list, selectedVal, action, opts){
  opts = opts || {};
  return `<div class="opt-chips">${list.map(o=>{
    const id = o.id !== undefined ? o.id : o;
    const lbl = o.ko !== undefined ? o.ko : o;
    const isSel = Array.isArray(selectedVal) ? selectedVal.includes(id) : selectedVal===id;
    const isReco = aiSetFields[opts.field] && ( Array.isArray(selectedVal) ? selectedVal.includes(id) && isSel : id===selectedVal ) && isSel;
    return `<button class="opt-chip ${isSel?'selected':''}" data-action="${action}" data-id="${id}">${esc(lbl)}${isReco?'<span class="reco-dot">✦</span>':''}</button>`;
  }).join('')}</div>`;
}

function viewCustomize(){
  const style = selectedStyle();
  if(!style){
    return emptyGuard('스타일을 먼저 선택해주세요', '커스터마이즈를 진행하려면 화풍을 먼저 골라야 해요.', 'gallery', '스타일 갤러리로');
  }
  return `
  <div class="section-head">
    <div class="eyebrow">Step 3 · Customize</div>
    <h2>세부 옵션을 골라보세요</h2>
    <p>직접 고르거나, AI에게 가장 잘 어울리는 조합을 추천받으세요.</p>
  </div>
  <div style="text-align:center;margin-bottom:26px;">
    <button class="btn primary" data-action="ai-recommend-all">✨ AI가 가장 잘 어울리는 옵션 추천</button>
  </div>
  ${lastRec ? recoPanel() : ''}

  <div class="opt-group">
    <div class="opt-group-head"><h3>구도 Composition</h3></div>
    ${chipGroup(A.COMPOSITION, S.compositionId, 'set-composition', {field:'composition'})}
  </div>
  <div class="opt-group">
    <div class="opt-group-head"><h3>색채 Color</h3></div>
    ${chipGroup(A.COLOR, S.colorId, 'set-color', {field:'color'})}
  </div>
  <div class="opt-group">
    <div class="opt-group-head"><h3>빛 Lighting</h3></div>
    ${chipGroup(A.LIGHTING, S.lightingId, 'set-lighting', {field:'lighting'})}
  </div>
  <div class="opt-group">
    <div class="opt-group-head"><h3>무드 Mood <span style="font-weight:400;color:var(--ink-faint);font-size:12px;">(최대 2개)</span></h3></div>
    ${chipGroup(A.MOOD, S.moodIds, 'toggle-mood', {field:'mood'})}
  </div>
  <div class="opt-group">
    <div class="opt-group-head"><h3>재료 Medium</h3></div>
    ${chipGroup(A.MEDIUM, S.mediumId, 'set-medium', {field:'medium'})}
  </div>
  <div class="opt-group">
    <div class="opt-group-head"><h3>디테일 Detail</h3></div>
    ${chipGroup(A.DETAIL, S.detailId, 'set-detail', {field:'detail'})}
  </div>
  <div class="opt-group">
    <div class="opt-group-head"><h3>비율 Aspect Ratio</h3></div>
    <div class="aspect-row">
      ${A.ASPECT.map(r=>{
        const [w,h] = r.split(':').map(Number);
        const scale = 46/Math.max(w,h);
        return `<button class="aspect-chip ${S.aspect===r?'selected':''}" data-action="set-aspect" data-id="${r}">
          <span class="ratio-box" style="width:${w*scale}px;height:${h*scale}px;"></span>${r}
        </button>`;
      }).join('')}
    </div>
  </div>

  <div class="btn-row" style="max-width:1000px;margin:30px auto 0;justify-content:center;">
    <button class="btn ghost" data-action="to-subject">← 이전</button>
    <button class="btn dark" data-action="to-optimize">다음: AI 최적화 →</button>
  </div>`;
}

function recoPanel(){
  if(!lastRec) return '';
  const r = lastRec.reasons;
  return `<div class="reco-panel">
    ✦ <b>AI 추천 이유</b><br>
    ${Object.values(r).map(t=>`· ${esc(t)}`).join('<br>')}
  </div>`;
}

/* ============================================================
   OPTIMIZE STEP
   ============================================================ */
function viewOptimize(){
  const style = selectedStyle();
  if(!style) return emptyGuard('스타일을 먼저 선택해주세요','','gallery','스타일 갤러리로');
  if(!S.subject.trim()) return emptyGuard('주제를 먼저 입력해주세요','','subject','주제 입력하러 가기');

  return `
  <div class="section-head">
    <div class="eyebrow">Step 4 · AI Optimize</div>
    <h2>이 이미지를 어디에 사용하시나요?</h2>
    <p>용도와 사용할 AI 플랫폼에 맞춰 프롬프트를 미세 조정합니다.</p>
  </div>
  <div class="pill-grid">
    ${A.PURPOSE.map(p=>`<button class="pill ${S.purposeId===p.id?'selected':''}" data-action="set-purpose" data-id="${p.id}">${esc(p.ko)}</button>`).join('')}
  </div>

  <div class="section-head" style="margin-top:10px;">
    <h2 style="font-size:20px;">어느 AI에서 사용하시나요?</h2>
  </div>
  <div class="pill-grid">
    ${A.PLATFORMS.map(p=>`<button class="pill ${S.platformId===p.id?'selected':''}" data-action="set-platform" data-id="${p.id}">${esc(p.ko)}</button>`).join('')}
  </div>

  <div style="text-align:center;margin:8px 0 26px;">
    <button class="btn ghost sm" data-action="ai-recommend-with-purpose">🎯 사용 목적에 맞춰 옵션 다시 추천</button>
  </div>

  <div class="final-summary">
    <span class="summary-chip"><b>스타일</b> ${esc(style.name)}</span>
    <span class="summary-chip"><b>구도</b> ${esc(A.labelKo(A.COMPOSITION, S.compositionId) || '미설정')}</span>
    <span class="summary-chip"><b>색채</b> ${esc(A.labelKo(A.COLOR, S.colorId) || '미설정')}</span>
    <span class="summary-chip"><b>빛</b> ${esc(A.labelKo(A.LIGHTING, S.lightingId) || '미설정')}</span>
    <span class="summary-chip"><b>재료</b> ${esc(A.labelKo(A.MEDIUM, S.mediumId) || '미설정')}</span>
    <span class="summary-chip"><b>비율</b> ${esc(S.aspect)}</span>
  </div>

  <div id="optimizeAction" class="optimize-cta">
    <button class="btn primary" data-action="run-optimize">🪄 AI 프롬프트 최적화 시작</button>
  </div>
  <div class="btn-row" style="max-width:520px;margin:16px auto 0;justify-content:center;">
    <button class="btn ghost sm" data-action="to-customize">← 옵션 다시 보기</button>
  </div>`;
}

/* ============================================================
   FINAL PROMPT
   ============================================================ */
function viewFinal(){
  const style = selectedStyle();
  if(!style || !S.finalPrompt) return emptyGuard('아직 생성된 프롬프트가 없어요', '', 'optimize', 'AI 최적화로 가기');

  const p = S.finalPrompt;
  const text = finalLang === 'ko' ? p.ko : p.en;
  return `
  <div class="section-head">
    <div class="eyebrow">Step 5 · Final Prompt</div>
    <h2>당신의 AI Art Prompt가 완성되었습니다.</h2>
  </div>
  <div class="final-summary">
    <span class="summary-chip"><b>STYLE</b> ${esc(style.name)}</span>
    <span class="summary-chip"><b>SUBJECT</b> ${esc(S.subject)}</span>
    <span class="summary-chip"><b>MOOD</b> ${esc(S.moodIds.map(m=>A.labelKo(A.MOOD,m)).join(', ') || '-')}</span>
    <span class="summary-chip"><b>COMPOSITION</b> ${esc(A.labelKo(A.COMPOSITION,S.compositionId) || '-')}</span>
    <span class="summary-chip"><b>MEDIUM</b> ${esc(A.labelKo(A.MEDIUM,S.mediumId) || '-')}</span>
  </div>

  <div class="lang-toggle">
    <button class="${finalLang==='en'?'active':''}" data-action="set-lang" data-l="en">🌐 English</button>
    <button class="${finalLang==='ko'?'active':''}" data-action="set-lang" data-l="ko">🇰🇷 한국어</button>
  </div>

  <div class="prompt-box" id="promptBox">${esc(text)}</div>
  <div class="disclaimer">AI-generated interpretation inspired by visual characteristics — not an original work by the referenced artist.</div>

  <div class="final-actions">
    <button class="btn primary" data-action="copy-prompt">📋 프롬프트 복사</button>
    <button class="btn ghost" data-action="refine-prompt">✨ AI로 다시 다듬기</button>
    <button class="btn ghost" data-action="goto-gallery">🎨 다른 화풍 적용</button>
    <button class="btn ghost" data-action="to-customize">🔄 옵션 변경</button>
  </div>

  <button class="explain-toggle" data-action="toggle-explain">
    <span>왜 이런 프롬프트가 만들어졌나요?</span><span id="explainCaret">▾</span>
  </button>
  <div class="explain-panel hidden" id="explainPanel">${explainBlock(style)}</div>
  `;
}

function explainBlock(style){
  const items = [
    ['피사체', `입력하신 주제 "${S.subject}"의 핵심 내용은 그대로 유지한 채, AI가 배경·조명·분위기를 보강했습니다.`],
    ['화풍', `${style.name}의 STYLE DNA(붓터치, 선, 형태 언어 등)를 프롬프트에 구체적으로 풀어써서, 화가 이름만 전달할 때보다 안정적인 결과를 유도합니다.`],
    ['색채', `${A.labelKo(A.COLOR,S.colorId) || '화가 고유 팔레트'} 색채 지시는 생성 모델이 톤과 색조를 일관되게 맞추도록 돕습니다.`],
    ['붓터치', `${style.dna.brushwork} — 이 표현이 화면의 질감과 붓의 움직임을 결정합니다.`],
    ['빛', `${A.labelKo(A.LIGHTING,S.lightingId) || '자연광'} 조명 지시는 명암과 시간대, 분위기의 기준이 됩니다.`],
    ['구도', `${A.labelKo(A.COMPOSITION,S.compositionId) || '균형 잡힌 구도'}는 카메라 거리와 프레이밍을 결정해 결과물의 첫인상을 좌우합니다.`],
    ['감정', `${S.moodIds.map(m=>A.labelKo(A.MOOD,m)).join(', ') || style.dna.emotion} 무드 키워드는 표정, 색온도, 전체 톤에 은은히 반영됩니다.`],
    ['재료', `${A.labelKo(A.MEDIUM,S.mediumId) || '유화'} 지시는 AI가 붓자국, 표면 질감 등 매체 특유의 특징을 재현하도록 합니다.`]
  ];
  return items.map(([label,text]) => `
    <div class="explain-item"><div class="ei-label">${esc(label)}</div><div class="ei-text">${esc(text)}</div></div>
  `).join('');
}

/* ============================================================
   COMPARE
   ============================================================ */
function viewCompare(){
  if(!compareSubject) compareSubject = S.subject || '';
  return `
  <div class="section-head">
    <div class="eyebrow">Style Comparison</div>
    <h2>화풍 비교</h2>
    <p>하나의 주제, 최대 6개의 화풍으로 동시에 비교해보세요.</p>
  </div>
  <div class="subject-box">
    <input type="text" class="subject-input" id="compareSubjectInput" placeholder="비교할 주제를 입력하세요" value="${esc(compareSubject)}" style="min-height:auto;">
  </div>
  <div class="compare-toolbar">
    <span style="font-size:12.5px;color:var(--ink-soft);">최대 6개 선택 (${compareSelection.length}/6)</span>
    <button class="btn primary sm" data-action="run-compare">화풍 비교하기</button>
    <button class="btn ghost sm" data-action="clear-compare">초기화</button>
  </div>
  <div class="filter-chips">
    ${A.STYLES.filter(s=>s.type==='artist').map(s=>`
      <button class="chip ${compareSelection.includes(s.id)?'active':''}" data-action="toggle-compare" data-id="${s.id}">${esc(s.name)}</button>
    `).join('')}
  </div>
  <div style="text-align:center;margin-bottom:26px;">
    <button class="btn ghost sm" data-action="goto-gallery">전체 목록에서 더 고르기</button>
  </div>
  ${compareResults ? `<div class="compare-grid">${compareResults.map(st => compareCard(st)).join('')}</div>` : ''}
  `;
}
function compareCard(style){
  return `<div class="compare-card">
    <div class="swatch" style="${swVars(style)}" data-artwork-id="${style.id}"><img class="artwork-img" alt="" loading="lazy"></div>
    <div class="cbody">
      <h5>${esc(style.name)}</h5>
      <p>${esc(style.shortKo)}</p>
      <div class="mini-prompt">${esc(miniPromptText(style, compareSubject))}</div>
      <button class="btn primary sm" data-action="pick-style-from-compare" data-id="${style.id}">이 스타일 선택</button>
    </div>
  </div>`;
}

/* ============================================================
   FAVORITES
   ============================================================ */
function viewFavorites(){
  const favStyles = S.favorites.map(A.byId).filter(Boolean);
  return `
  <div class="section-head">
    <div class="eyebrow">My Collection</div>
    <h2>즐겨찾기 & 최근 기록</h2>
  </div>
  <h3 style="max-width:1240px;margin:0 auto 16px;padding:0 24px;font-size:16px;">♥ MY FAVORITE STYLES</h3>
  ${favStyles.length ? `<div class="grid dense">${favStyles.map(s=>styleCard(s)).join('')}</div>` :
    `<div class="empty-state"><div class="icon">♡</div>아직 즐겨찾기한 화풍이 없어요.<br>갤러리에서 하트를 눌러 저장해보세요.</div>`}

  <h3 style="max-width:1240px;margin:40px auto 16px;padding:0 24px;font-size:16px;">🕓 최근 입력한 주제</h3>
  ${S.recentSubjects.length ? `<div class="suggest-row">${S.recentSubjects.map(s=>`<button class="suggest-chip" data-action="fill-subject-goto" data-s="${esc(s)}">${esc(s)}</button>`).join('')}</div>` :
    `<div class="empty-state" style="margin:20px auto;"><div class="icon">🕓</div>최근 입력한 주제가 없습니다.</div>`}

  <h3 style="max-width:1240px;margin:40px auto 16px;padding:0 24px;font-size:16px;">📋 최근 생성한 프롬프트</h3>
  ${S.recentPrompts.length ? `<div style="max-width:820px;margin:0 auto;display:flex;flex-direction:column;gap:12px;padding:0 24px;">
      ${S.recentPrompts.map(p=>`<div class="prompt-box" style="padding:16px 18px;font-size:12.5px;">${esc(p.en.slice(0,220))}${p.en.length>220?'…':''}</div>`).join('')}
    </div>` :
    `<div class="empty-state" style="margin:20px auto;"><div class="icon">📋</div>최근 생성한 프롬프트가 없습니다.</div>`}
  `;
}

/* ============================================================
   AI STYLE FINDER
   ============================================================ */
function viewFinder(){
  return `
  <div class="section-head">
    <div class="eyebrow">AI Style Finder</div>
    <h2>내 아이디어에 어울리는 화풍 찾기</h2>
    <p>장면을 설명해주시면 AI가 시각적으로 잘 맞는 화풍 3~5개를 추천해드립니다.</p>
  </div>
  <div class="finder-box">
    <textarea class="subject-input" id="finderInput" rows="2" placeholder="예: 밤늦게 혼자 카페에 앉아 있는 남자">${esc(finderIdea)}</textarea>
    <div style="text-align:center;margin-top:14px;">
      <button class="btn primary" data-action="run-finder">🔎 화풍 찾기</button>
    </div>
  </div>
  <div id="finderResultBox">${finderResults ? finderResultHTML() : ''}</div>
  `;
}
function finderResultHTML(){
  if(!finderResults || !finderResults.length) return `<div class="empty-state"><div class="icon">🤔</div>어울리는 화풍을 찾지 못했어요. 조금 더 구체적으로 적어보세요.</div>`;
  return `<div class="finder-result">
    ${finderResults.map(f => `
      <div class="finder-item" data-action="pick-from-finder" data-id="${f.style.id}">
        <div class="swatch" style="${swVars(f.style)}" data-artwork-id="${f.style.id}"><img class="artwork-img" alt="" loading="lazy"></div>
        <div>
          <h5>${esc(f.style.name)}</h5>
          <p>${esc(f.reason)}</p>
        </div>
      </div>
    `).join('')}
  </div>`;
}

/* ============================================================
   SHARED: empty guard
   ============================================================ */
function emptyGuard(title, desc, gotoView, gotoLabel){
  return `<div class="empty-state" style="margin-top:80px;">
    <div class="icon">🖼️</div>
    <div style="font-size:15px;font-weight:800;color:var(--ink);margin-bottom:8px;">${esc(title)}</div>
    <div style="margin-bottom:18px;">${esc(desc)}</div>
    <button class="btn primary" data-action="jump" data-view="${gotoView}">${esc(gotoLabel)}</button>
  </div>`;
}

/* ============================================================
   ACTIONS
   ============================================================ */
function pickStyle(id){
  S.selectedStyleId = id;
  aiSetFields = {};
  showToast(`'${A.byId(id).name}' 스타일을 선택했습니다.`);
}

function runOptimize(){
  const box = document.getElementById('optimizeAction');
  if(!box) return;
  box.innerHTML = `<div class="loading-box"><div class="spinner"></div>AI가 프롬프트를 최적화하는 중입니다…</div>`;
  setTimeout(() => {
    try{
      const style = selectedStyle();
      if(!style || !S.subject.trim()) throw new Error('스타일과 주제를 모두 입력해주세요.');
      if(!S.scene) S.scene = A.expandSubject(S.subject);
      const ctx = {
        style, subject: S.subject, scene: S.scene,
        compositionId: S.compositionId || 'thirds', colorId: S.colorId || 'artistoriginal',
        lightingId: S.lightingId || 'daylight', moodIds: S.moodIds.length ? S.moodIds : ['elegant'],
        mediumId: S.mediumId || 'oil', detailId: S.detailId || 'balanced',
        aspect: S.aspect || '3:4', purposeId: S.purposeId, platformId: S.platformId
      };
      const en = A.buildPromptEN(ctx);
      const ko = A.buildPromptKO(ctx);
      S.finalPrompt = { en, ko };
      A.rememberPrompt(S.finalPrompt);
      A.rememberSubject(S.subject);
      finalLang = 'en';
      go('final');
    }catch(err){
      box.innerHTML = `<div class="error-box">⚠️ ${esc(err.message)}<br><br>
        <button class="btn dark sm" data-action="run-optimize">다시 시도</button>
      </div>`;
    }
  }, 700);
}

function copyPromptToClipboard(){
  const text = finalLang === 'ko' ? S.finalPrompt.ko : S.finalPrompt.en;
  const done = () => showToast('프롬프트가 복사되었습니다. ✔');
  const fail = () => showToast('복사에 실패했습니다. 직접 선택해 복사해주세요.');
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(done).catch(()=>{
      try{ legacyCopy(text); done(); }catch(e){ fail(); }
    });
  } else {
    try{ legacyCopy(text); done(); }catch(e){ fail(); }
  }
}
function legacyCopy(text){
  const ta = document.createElement('textarea');
  ta.value = text; ta.style.position='fixed'; ta.style.opacity='0';
  document.body.appendChild(ta); ta.focus(); ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
}

function runRandom(){
  const artistIds = A.STYLES.filter(s=>s.type==='artist').map(s=>s.id);
  const allSubjects = A.CATEGORIES.flatMap(c=>c.ex);
  const subj = allSubjects[Math.floor(Math.random()*allSubjects.length)];
  const styleId = artistIds[Math.floor(Math.random()*artistIds.length)];
  S.subject = subj;
  S.selectedStyleId = styleId;
  S.scene = A.expandSubject(subj);
  A.rememberSubject(subj);
  showToast(`🎲 "${subj}" + ${A.byId(styleId).name}`);
  go('subject');
  setTimeout(renderSceneAndPreview, 30);
}

/* ============================================================
   EVENT DELEGATION
   ============================================================ */
document.addEventListener('click', function(e){
  const t = e.target.closest('[data-action]');
  if(!t) return;
  const action = t.dataset.action;
  const id = t.dataset.id;

  switch(action){
    case 'start-style': S.entryMode='style'; go('gallery'); break;
    case 'start-subject': S.entryMode='subject'; go('subject'); break;
    case 'goto-gallery': go('gallery'); break;
    case 'go-home': go('home'); break;
    case 'jump': go(t.dataset.view); break;

    case 'open-style': openStyle(id); break;
    case 'close-modal': closeModal(); break;
    case 'open-work': openArtworkLightbox(t); break;
    case 'close-lightbox': closeLightbox(); break;
    case 'lightbox-prev': lightboxStep(-1); break;
    case 'lightbox-next': lightboxStep(1); break;
    case 'pick-style': pickStyle(id); if(currentView==='gallery' || currentView==='home'){ closeModal(); go('subject'); } else { render(); } break;
    case 'pick-style-from-compare': pickStyle(id); go(S.subject ? 'customize' : 'subject'); break;
    case 'pick-from-finder': pickStyle(id); S.subject = S.subject || finderIdea; A.rememberSubject(S.subject); go('subject'); setTimeout(renderSceneAndPreview,30); break;
    case 'toggle-fav': A.toggleFavorite(id); render(); if(modalStyleId) openStyle(modalStyleId); break;

    case 'gallery-filter': galleryFilter = t.dataset.f; render(); break;

    case 'fill-subject': S.subject = t.dataset.s; S.scene=null; render(); setTimeout(renderSceneAndPreview,30); break;
    case 'fill-subject-goto': S.subject = t.dataset.s; S.scene=null; go('subject'); setTimeout(renderSceneAndPreview,30); break;
    case 'subject-cat': renderCatSuggest(t.dataset.c); break;
    case 'expand-subject': {
      const val = document.getElementById('subjectInput');
      if(val) S.subject = val.value.trim();
      if(!S.subject){ showToast('먼저 그리고 싶은 것을 입력해주세요.'); break; }
      S.scene = null;
      const sceneBox = document.getElementById('sceneBox');
      if(sceneBox) sceneBox.innerHTML = `<div class="loading-box"><div class="spinner"></div>AI가 장면을 분석하는 중입니다…</div>`;
      setTimeout(renderSceneAndPreview, 500);
      break;
    }
    case 'to-subject': go('subject'); setTimeout(renderSceneAndPreview,30); break;
    case 'to-customize': {
      const val = document.getElementById('subjectInput');
      if(val) S.subject = val.value.trim();
      if(!S.subject.trim()){ showToast('그리고 싶은 것을 먼저 입력해주세요.'); break; }
      if(!S.scene) S.scene = A.expandSubject(S.subject);
      A.rememberSubject(S.subject);
      if(!S.selectedStyleId){ S.selectedStyleId = PREVIEW_STYLE_IDS[0]; showToast(`화풍을 고르지 않아 '${A.byId(S.selectedStyleId).name}'을 기본 선택했습니다.`); }
      go('customize');
      break;
    }

    case 'set-composition': S.compositionId = id; delete aiSetFields.composition; render(); break;
    case 'set-color': S.colorId = id; delete aiSetFields.color; render(); break;
    case 'set-lighting': S.lightingId = id; delete aiSetFields.lighting; render(); break;
    case 'toggle-mood': {
      const i = S.moodIds.indexOf(id);
      if(i>=0) S.moodIds.splice(i,1);
      else { S.moodIds.push(id); if(S.moodIds.length>2) S.moodIds.shift(); }
      delete aiSetFields.mood; render(); break;
    }
    case 'set-medium': S.mediumId = id; delete aiSetFields.medium; render(); break;
    case 'set-detail': S.detailId = id; delete aiSetFields.detail; render(); break;
    case 'set-aspect': S.aspect = id; render(); break;

    case 'ai-recommend-all': {
      const style = selectedStyle(); if(!style) break;
      const rec = A.recommendOptions(style, S.subject, S.scene, S.purposeId);
      S.compositionId = rec.composition; S.colorId = rec.color; S.lightingId = rec.lighting;
      S.moodIds = rec.mood.slice(); S.mediumId = rec.medium; S.detailId = rec.detail; S.aspect = rec.aspect;
      aiSetFields = {composition:1,color:1,lighting:1,mood:1,medium:1,detail:1};
      lastRec = rec;
      showToast('AI가 옵션을 추천했습니다. 필요하면 자유롭게 수정하세요.');
      render();
      break;
    }
    case 'ai-recommend-with-purpose': {
      const style = selectedStyle(); if(!style) break;
      const rec = A.recommendOptions(style, S.subject, S.scene, S.purposeId);
      S.aspect = rec.aspect; S.detailId = rec.detail;
      lastRec = rec;
      showToast('사용 목적을 반영해 비율·디테일을 다시 추천했습니다.');
      render();
      break;
    }

    case 'set-purpose': S.purposeId = (S.purposeId===id ? null : id); render(); break;
    case 'set-platform': S.platformId = id; render(); break;
    case 'to-optimize': go('optimize'); break;
    case 'run-optimize': runOptimize(); break;

    case 'set-lang': finalLang = t.dataset.l; render(); break;
    case 'copy-prompt': copyPromptToClipboard(); break;
    case 'refine-prompt': {
      const style = selectedStyle();
      const rec = A.recommendOptions(style, S.subject, S.scene, S.purposeId);
      const ctx = { style, subject:S.subject, scene:S.scene, compositionId:S.compositionId, colorId:S.colorId,
        lightingId:S.lightingId, moodIds:S.moodIds, mediumId:S.mediumId, detailId: 'highdetail',
        aspect:S.aspect, purposeId:S.purposeId, platformId:S.platformId };
      S.finalPrompt = { en: A.buildPromptEN(ctx), ko: A.buildPromptKO(ctx) };
      A.rememberPrompt(S.finalPrompt);
      showToast('프롬프트를 한 번 더 다듬었습니다.');
      render();
      break;
    }
    case 'toggle-explain': {
      const p = document.getElementById('explainPanel');
      const c = document.getElementById('explainCaret');
      if(p){ p.classList.toggle('hidden'); if(c) c.textContent = p.classList.contains('hidden') ? '▾' : '▴'; }
      break;
    }

    case 'toggle-compare': {
      const i = compareSelection.indexOf(id);
      if(i>=0) compareSelection.splice(i,1);
      else { if(compareSelection.length>=6){ showToast('최대 6개까지 비교할 수 있어요.'); break; } compareSelection.push(id); }
      render();
      break;
    }
    case 'run-compare': {
      const input = document.getElementById('compareSubjectInput');
      if(input) compareSubject = input.value.trim();
      if(!compareSubject){ showToast('비교할 주제를 입력해주세요.'); break; }
      if(!compareSelection.length){ showToast('비교할 화풍을 1개 이상 선택해주세요.'); break; }
      compareResults = compareSelection.map(A.byId).filter(Boolean);
      render();
      break;
    }
    case 'clear-compare': compareSelection = []; compareResults = null; render(); break;

    case 'run-finder': {
      const val = document.getElementById('finderInput');
      finderIdea = val ? val.value.trim() : finderIdea;
      if(!finderIdea){ showToast('아이디어를 입력해주세요.'); break; }
      const box = document.getElementById('finderResultBox');
      if(box) box.innerHTML = `<div class="loading-box"><div class="spinner"></div>AI가 어울리는 화풍을 분석하는 중입니다…</div>`;
      setTimeout(() => {
        finderResults = A.findStyles(finderIdea);
        const b = document.getElementById('finderResultBox');
        if(b) b.innerHTML = finderResultHTML();
        setupArtworkObserver();
      }, 550);
      break;
    }
  }
});

document.addEventListener('input', function(e){
  if(e.target.id === 'gallerySearch'){ gallerySearchQ = e.target.value; renderGalleryGridOnly(); }
  if(e.target.id === 'subjectInput'){ S.subject = e.target.value; }
  if(e.target.id === 'compareSubjectInput'){ compareSubject = e.target.value; }
});

function renderGalleryGridOnly(){
  // lightweight re-render for live search without losing input focus
  const scrollY = window.scrollY;
  $main.innerHTML = viewGallery();
  const inp = document.getElementById('gallerySearch');
  if(inp){ inp.focus(); const v = inp.value; inp.value=''; inp.value=v; }
  window.scrollTo(0, scrollY);
}

document.getElementById('logoLink').addEventListener('click', function(e){ e.preventDefault(); go('home'); });
document.getElementById('randomFab').addEventListener('click', runRandom);
$topNav.addEventListener('click', function(e){
  const b = e.target.closest('button[data-view]');
  if(b) go(b.dataset.view);
});
$modal.addEventListener('click', function(e){ if(e.target === $modal) closeModal(); });
$lightbox.addEventListener('click', function(e){ if(e.target === $lightbox) closeLightbox(); });
document.addEventListener('keydown', function(e){
  if($lightbox.classList.contains('hidden')){
    if(e.key === 'Escape') closeModal();
    return;
  }
  if(e.key === 'Escape') closeLightbox();
  else if(e.key === 'ArrowLeft') lightboxStep(-1);
  else if(e.key === 'ArrowRight') lightboxStep(1);
});

/* ---------------- init ---------------- */
go('home');

})();
