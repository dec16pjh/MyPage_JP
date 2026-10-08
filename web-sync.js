/* Web On/Off — toggles which MyPage_JP blocks appear on john-park-web.
   State lives in web-sync.json (this repo); john-park-web reads it at runtime. */
(function (root) {
  var REPO = 'dec16pjh/MyPage_JP';
  var PATH = 'web-sync.json';
  var API = 'https://api.github.com/repos/' + REPO + '/contents/' + PATH;

  function enc(s) {
    var bytes = new TextEncoder().encode(s), bin = '';
    bytes.forEach(function (c) { bin += String.fromCharCode(c); });
    return btoa(bin);
  }
  function dec(b64) {
    var bin = atob(b64.replace(/\n/g, ''));
    return new TextDecoder().decode(Uint8Array.from(bin, function (c) { return c.charCodeAt(0); }));
  }
  function headers(token) {
    return { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json' };
  }

  async function readRemote(token) {
    var r = await fetch(API + '?ref=main&t=' + Date.now(), { headers: headers(token), cache: 'no-store' });
    if (!r.ok) { var e = new Error('GitHub ' + r.status); e.status = r.status; throw e; }
    var j = await r.json();
    return { data: JSON.parse(dec(j.content)), sha: j.sha };
  }

  async function readPublic() {
    var r = await fetch(PATH + '?v=' + Math.floor(Date.now() / 60000), { cache: 'no-store' });
    if (!r.ok) throw new Error('fetch ' + r.status);
    return r.json();
  }

  async function setWeb(token, card, on) {
    for (var attempt = 0; attempt < 3; attempt++) {
      var cur = await readRemote(token);
      var items = cur.data.items;
      var it = items.find(function (x) { return x.href === card.href; });
      if (it) {
        if (it.web === on) return it;
        it.web = on;
      } else {
        it = Object.assign({}, card, { web: on });
        items.push(it);
      }
      var body = JSON.stringify({
        message: 'Web ' + (on ? 'ON' : 'OFF') + ': ' + card.title,
        content: enc(JSON.stringify(cur.data, null, 1) + '\n'),
        sha: cur.sha,
        branch: 'main'
      });
      var r = await fetch(API, { method: 'PUT', headers: Object.assign({ 'Content-Type': 'application/json' }, headers(token)), body: body });
      if (r.ok) return it;
      if (r.status !== 409 && r.status !== 422) { var e = new Error('GitHub ' + r.status); e.status = r.status; throw e; }
    }
    throw new Error('conflict');
  }

  root.WebSync = { readRemote: readRemote, readPublic: readPublic, setWeb: setWeb };

  if (typeof document === 'undefined') return;

  var CATS = { travel: 'Travel', project: 'Project', creative: 'Creative', education: 'Education', publishing: 'Publishing' };
  var KEY = 'webSyncToken';

  var css = document.createElement('style');
  css.textContent =
    '.webtoggle{position:absolute;top:12px;right:12px;z-index:5;display:inline-flex;align-items:center;gap:6px;border:0;border-radius:999px;padding:7px 13px;' +
    'font-family:inherit;font-weight:900;font-size:11px;line-height:1;letter-spacing:.04em;cursor:pointer;color:#fff;background:rgba(20,10,30,.62);backdrop-filter:blur(6px);box-shadow:0 4px 12px rgba(0,0,0,.25);transition:transform .15s}' +
    '.webtoggle:hover{transform:scale(1.06)}' +
    '.webtoggle i{width:8px;height:8px;border-radius:50%;background:#9a93a8;display:inline-block}' +
    '.webtoggle.on{background:#18c964;color:#04210f}.webtoggle.on i{background:#04210f}' +
    '.webtoggle.busy{opacity:.6;pointer-events:none}' +
    '.webtoast{position:fixed;left:50%;bottom:26px;transform:translateX(-50%);z-index:9999;background:#1d0f2b;color:#fff;padding:12px 20px;border-radius:999px;font-family:inherit;font-weight:700;font-size:13px;line-height:1.3;box-shadow:0 10px 30px rgba(0,0,0,.3)}';
  document.head.appendChild(css);

  function toast(msg) {
    var t = document.createElement('div');
    t.className = 'webtoast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 4500);
  }

  function cardData(a) {
    var sec = a.closest('section.group');
    var img = a.querySelector('img.thumb');
    var brand = a.querySelector('.thumb.brand');
    var h3 = a.querySelector('h3'), p = a.querySelector('p');
    var d = {
      category: CATS[sec && sec.id] || (sec ? sec.id : 'Creative'),
      title: h3 ? h3.textContent.trim() : '',
      description: p ? p.textContent.trim() : '',
      href: a.href
    };
    if (img) d.image = img.src;
    if (brand) d.label = brand.innerHTML.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').trim();
    return d;
  }

  function paint(btn, on) {
    btn.classList.toggle('on', !!on);
    btn.dataset.on = on ? '1' : '0';
    btn.innerHTML = '<i></i>WEB ' + (on ? 'ON' : 'OFF');
    btn.title = on ? 'john-park-web에 표시 중 — 클릭하면 내립니다' : 'john-park-web에 표시 안 함 — 클릭하면 올립니다';
  }

  function init() {
    var cards = Array.prototype.slice.call(document.querySelectorAll('section.group a.card'));
    var buttons = cards.map(function (a) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'webtoggle';
      paint(b, false);
      a.appendChild(b);
      b.addEventListener('click', async function (ev) {
        ev.preventDefault(); ev.stopPropagation();
        var token = sessionStorage.getItem(KEY);
        if (!token) {
          token = (window.prompt('Web On/Off를 저장하려면 GitHub 토큰이 필요합니다.\n(Fine-grained 토큰 · 저장소 ' + REPO + ' · Contents: Read and write)\n이 브라우저 탭에만 저장되고 탭을 닫으면 사라집니다.') || '').trim();
          if (!token) return;
        }
        var want = b.dataset.on !== '1';
        b.classList.add('busy');
        try {
          await setWeb(token, cardData(a), want);
          sessionStorage.setItem(KEY, token);
          paint(b, want);
          toast('Web ' + (want ? 'ON' : 'OFF') + ' 저장됨 — 1~2분 안에 john-park-web에 반영됩니다');
        } catch (e) {
          if (e.status === 401 || e.status === 403 || e.status === 404) sessionStorage.removeItem(KEY);
          toast('저장 실패 (' + (e.message || e) + ') — 토큰 권한을 확인하세요');
        } finally {
          b.classList.remove('busy');
        }
      });
      return b;
    });

    var token = sessionStorage.getItem(KEY);
    var load = token ? readRemote(token).then(function (r) { return r.data; }).catch(readPublic) : readPublic();
    load.then(function (data) {
      var map = {};
      (data.items || []).forEach(function (x) { map[x.href] = !!x.web; });
      cards.forEach(function (a, i) { paint(buttons[i], !!map[a.href]); });
    }).catch(function () {});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})(typeof window !== 'undefined' ? window : globalThis);
