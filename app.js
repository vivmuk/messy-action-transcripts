const $ = s => document.querySelector(s);
let DB = null, MAN = null;
let eps = []; // sorted newest first
let curHeroIdx = 0; // 0 = newest episode

async function loadAll() {
  try {
    const V = Date.now();
    const [db, man] = await Promise.all([
      fetch('database.json?v=' + V).then(r => r.json()),
      fetch('infographics/manifest.json?v=' + V).then(r => r.json()).catch(() => null)
    ]);
    DB = db; MAN = man;
    eps = [...DB.episodes].sort((a, b) => b.ep - a.ep); // newest first
    init();
  } catch (e) {
    console.error('Failed to load:', e);
  }
}

function esc(s) { return (s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function fmtDate(d) { if (!d) return ''; const [y, m, dd] = d.split('-'); return new Date(y, m - 1, dd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }

function imgFor(ep) {
  if (!MAN || !MAN.dailies) return null;
  const pref = 'ep' + String(ep.ep).padStart(2, '0');
  const hit = MAN.dailies.find(f => f.startsWith(pref));
  if (!hit) return null;
  const v = (MAN && MAN.generated) ? '?v=' + encodeURIComponent(MAN.generated) : '';
  return 'infographics/' + hit + v;
}

function renderStats() {
  const total = eps.length;
  const words = eps.reduce((a, e) => a + (e.transcript || '').split(/\s+/).filter(Boolean).length, 0);
  if ($('#pillCount')) $('#pillCount').textContent = total + ' episodes';
  if ($('#statEps')) $('#statEps').textContent = total;
  if ($('#statWords')) $('#statWords').textContent = words.toLocaleString();
  if ($('#statDay')) $('#statDay').textContent = total;
}

/* HERO CARD RENDER & NAVIGATION */
function renderHeroCard() {
  const stage = $('#heroStage');
  if (!stage || !eps.length) return;
  const e = eps[curHeroIdx];
  const img = imgFor(e);

  stage.innerHTML = `
    <article class="hero-card" onclick="openLightbox(${curHeroIdx})">
      <div class="cover">
        ${img ? `<img src="${img}" alt="Episode ${e.ep} Infographic">` : `<div style="padding:40px;text-align:center;">No infographic image</div>`}
        <div class="click-hint"><span>🔍 Click for Full Picture</span></div>
        <span class="ep-badge">EP ${e.ep}</span>
        <span class="date-badge">${fmtDate(e.date)}</span>
      </div>
      <div class="body">
        <h3>${esc(e.title)}</h3>
        <div class="msg">${esc(e.key_message)}</div>
        ${e.quote ? `<div class="quote">“${esc(e.quote)}”</div>` : ''}
        <div class="meta-bar">
          <span class="tag">${esc(e.tag || 'messy action')}</span>
          <span class="action-link">View Full Picture & Transcript →</span>
        </div>
      </div>
    </article>
  `;

  if ($('#heroIndicator')) $('#heroIndicator').textContent = `Day ${e.ep} / ${eps.length}`;
  if ($('#prevHeroBtn')) $('#prevHeroBtn').disabled = curHeroIdx === 0;
  if ($('#nextHeroBtn')) $('#nextHeroBtn').disabled = curHeroIdx === eps.length - 1;
}

function stepHero(dir) {
  const target = curHeroIdx + dir;
  if (target >= 0 && target < eps.length) {
    curHeroIdx = target;
    renderHeroCard();
  }
}

/* ALL DAYS GALLERY */
function renderGallery() {
  const grid = $('#galleryGrid');
  if (!grid) return;
  grid.innerHTML = eps.map((e, idx) => {
    const img = imgFor(e);
    return `
      <article class="gallery-item" onclick="openLightbox(${idx})">
        <div class="g-cover">
          ${img ? `<img src="${img}" alt="EP ${e.ep}" loading="lazy">` : ''}
          <span class="g-badge">EP ${e.ep}</span>
          <span class="g-date">${fmtDate(e.date)}</span>
        </div>
        <div class="g-body">
          <h4>${esc(e.title)}</h4>
          <div class="g-msg">${esc(e.key_message)}</div>
        </div>
      </article>
    `;
  }).join('');
}

/* LIGHTBOX (FULL PICTURE VIEW) */
let activeLbIdx = 0;
function openLightbox(idx) {
  activeLbIdx = idx;
  const e = eps[idx];
  const img = imgFor(e);

  if ($('#lbImg')) $('#lbImg').src = img || '';
  if ($('#lbWatchReel')) $('#lbWatchReel').href = `https://www.instagram.com/reel/${esc(e.shortcode)}/`;

  $('#lightbox').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  $('#lightbox').classList.remove('open');
  document.body.style.overflow = '';
}

/* DETAIL / TRANSCRIPT MODAL */
function openModal(idx) {
  const e = eps[idx];
  if (!e) return;

  const transcript = e.transcript
    ? e.transcript.split(/(?<=[.!?])\s+/).map(s => `<p style="margin-bottom:12px;">${esc(s)}</p>`).join('')
    : '<p>No transcript available.</p>';

  $('#modal').innerHTML = `
    <div class="mv-head">
      <button class="close" onclick="closeModal()">✕</button>
      <div class="mv-title">Episode ${e.ep} · ${fmtDate(e.date)}</div>
      <a href="https://www.instagram.com/reel/${esc(e.shortcode)}/" target="_blank" rel="noopener">Watch Reel ↗</a>
    </div>
    <div class="mv-body">
      <h2>${esc(e.title)}</h2>
      <div class="mv-meta"><span>EP ${e.ep}</span><span>${fmtDate(e.date)}</span><span>${e.duration_s ? Math.round(e.duration_s) + 's' : ''}</span></div>
      <div class="keycard">
        <div class="lab">Key Message</div>
        <p>${esc(e.key_message)}</p>
      </div>
      ${e.quote ? `<div class="quotecard">“${esc(e.quote)}”</div>` : ''}
      <h3 style="font-family:var(--serif); margin:24px 0 12px; font-size:1.3rem;">Full Transcript</h3>
      <div class="transcript">${transcript}</div>
    </div>
  `;
  $('#modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  $('#modal').classList.remove('open');
  $('#modal').innerHTML = '';
  document.body.style.overflow = '';
}

/* SEARCH */
let searchTimer;
function doSearch(q) {
  const res = $('#results');
  if (!res) return;
  if (!q) { res.style.display = 'none'; res.innerHTML = ''; return; }

  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  const hits = eps.map((e, idx) => {
    const hay = (e.transcript + ' ' + e.key_message + ' ' + e.title).toLowerCase();
    let score = 0;
    terms.forEach(t => { if (hay.includes(t)) score++; });
    return { e, idx, score };
  }).filter(x => x.score > 0).sort((a, b) => b.score - a.score);

  res.style.display = 'block';
  res.innerHTML = hits.length
    ? hits.map(({ e, idx }) => `
        <div class="result-item" onclick="openLightbox(${idx})">
          <div class="rt"><span class="ep-tag">EP ${e.ep} · ${fmtDate(e.date)}</span>${esc(e.title)}</div>
          <p>${esc(e.key_message)}</p>
        </div>
      `).join('')
    : `<div style="text-align:center; padding:20px; opacity:.6;">No results found for “${esc(q)}”</div>`;
}

function init() {
  renderStats();
  if ($('#heroStage')) renderHeroCard();
  if ($('#galleryGrid')) renderGallery();
}

function wire() {
  const prev = $('#prevHeroBtn'), next = $('#nextHeroBtn');
  if (prev) prev.addEventListener('click', () => stepHero(-1)); // Newer
  if (next) next.addEventListener('click', () => stepHero(1));  // Older

  const stage = $('#heroStage');
  if (stage) {
    let touchStartX = 0;
    stage.addEventListener('touchstart', ev => { touchStartX = ev.touches[0].clientX; }, { passive: true });
    stage.addEventListener('touchend', ev => {
      const diffX = ev.changedTouches[0].clientX - touchStartX;
      if (Math.abs(diffX) > 40) {
        if (diffX < 0) stepHero(1);  // Swipe left -> older day
        else stepHero(-1);           // Swipe right -> newer day
      }
    }, { passive: true });
  }

  const lbClose = $('#lbClose');
  if (lbClose) lbClose.addEventListener('click', closeLightbox);
  const lb = $('#lightbox');
  if (lb) lb.addEventListener('click', ev => { if (ev.target.id === 'lightbox') closeLightbox(); });
  const lbView = $('#lbViewTranscript');
  if (lbView) lbView.addEventListener('click', () => { closeLightbox(); openModal(activeLbIdx); });

  const search = $('#search');
  if (search) {
    search.addEventListener('input', ev => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => doSearch(ev.target.value.trim()), 150);
    });
  }

  document.addEventListener('keydown', ev => {
    if (ev.key === 'Escape') {
      closeLightbox();
      closeModal();
    }
  });
}

wire();
loadAll();
