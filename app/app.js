// Leonida Trophy Guide — tracker, roadmap and missables for GTA VI's 55 PS5 trophies.
// Offline static app: the only fetches are the two JSON files under app/data/.
// Progress lives in localStorage; export/import move it as a JSON file.
const STORAGE_KEY = 'gta6-trophy-guide-v1';
const KINDS = ['all', 'story', 'missable', 'collectibles', 'activities', 'platinum', 'online'];
const KIND_LABELS = {
  all: 'All kinds', story: 'Story', missable: 'Missable',
  collectibles: 'Collectibles', activities: 'Activities',
  platinum: 'Platinum', online: 'Online',
};

const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);

const trophiesDoc = await (await fetch('data/trophies.json')).json();
const roadmapDoc = await (await fetch('data/roadmap.json')).json();
const TROPHIES = trophiesDoc.trophies;
const BY_ID = new Map(TROPHIES.map((t) => [t.id, t]));
const BY_NAME = new Map(TROPHIES.map((t) => [t.name, t]));

// ---- saved state -----------------------------------------------------------
function loadSavedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { earned: [], spoilers: true };
    const parsed = JSON.parse(raw);
    return {
      earned: Array.isArray(parsed.earned) ? parsed.earned.filter((n) => BY_NAME.has(n)) : [],
      spoilers: parsed.spoilers !== false,
    };
  } catch {
    return { earned: [], spoilers: true };
  }
}

const saved = loadSavedState();
const earned = new Set(saved.earned);
let hideSpoilers = saved.spoilers;
let selectedId = Number(params.get('guide')) || TROPHIES[0].id;
if (!BY_ID.has(selectedId)) selectedId = TROPHIES[0].id;
let currentView = ['tracker', 'roadmap', 'missables'].includes(params.get('view')) ? params.get('view') : 'tracker';
let gradeFilter = ['all', 'platinum', 'gold', 'silver', 'bronze'].includes(params.get('grade')) ? params.get('grade') : 'all';
let kindFilter = KINDS.includes(params.get('kind')) ? params.get('kind') : 'all';
let query = params.get('q') ?? '';

// Demo seeding for screenshots and shared links: ?seed=N marks the first N
// trophies earned, but only when no progress has been saved yet.
const seedCount = Number(params.get('seed'));
if (earned.size === 0 && Number.isInteger(seedCount) && seedCount > 0) {
  for (const t of TROPHIES.slice(0, Math.min(seedCount, TROPHIES.length))) earned.add(t.name);
}
if (params.get('spoilers') === 'off') hideSpoilers = false;
if (params.get('spoilers') === 'on') hideSpoilers = true;

function persistState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ earned: [...earned], spoilers: hideSpoilers }));
}

// ---- spoiler rule ----------------------------------------------------------
function isStoryTrophy(trophy) {
  return trophy.kind.includes('story');
}
function isHiddenBySpoilers(trophy) {
  return hideSpoilers && isStoryTrophy(trophy) && !earned.has(trophy.name);
}
function displayName(trophy) {
  return isHiddenBySpoilers(trophy) ? 'Hidden story trophy' : trophy.name;
}
function displayDescription(trophy) {
  return isHiddenBySpoilers(trophy)
    ? 'Hidden until earned — turn spoilers off, or earn this trophy, to reveal it.'
    : trophy.description;
}

// ---- filtering -------------------------------------------------------------
function trophyMatches(trophy) {
  if (gradeFilter !== 'all' && trophy.grade !== gradeFilter) return false;
  if (kindFilter === 'online') return false; // the list has no online trophies
  if (kindFilter !== 'all' && !trophy.kind.includes(kindFilter)) return false;
  if (query) {
    const hay = `${trophy.name} ${trophy.description} ${trophy.guide}`.toLowerCase();
    if (!hay.includes(query.toLowerCase())) return false;
  }
  return true;
}

// ---- rendering: progress ---------------------------------------------------
function renderProgress() {
  const total = TROPHIES.length;
  const done = TROPHIES.filter((t) => earned.has(t.name)).length;
  $('progressText').textContent = `${done} of ${total} earned`;
  $('progressPct').textContent = `${Math.round((done / total) * 100)}%`;
  $('progressFill').style.width = `${(done / total) * 100}%`;
  const parts = ['platinum', 'gold', 'silver', 'bronze'].map((grade) => {
    const inGrade = TROPHIES.filter((t) => t.grade === grade);
    const got = inGrade.filter((t) => earned.has(t.name)).length;
    return `<b>${got}/${inGrade.length}</b> ${grade}`;
  });
  $('gradeCounts').innerHTML = parts.join(' &middot; ');
}

// ---- rendering: trophy list ------------------------------------------------
function trophyCard(trophy) {
  const li = document.createElement('li');
  li.className = 'trophy-card' + (earned.has(trophy.name) ? ' earned' : '') + (trophy.id === selectedId ? ' selected' : '');
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = earned.has(trophy.name);
  box.setAttribute('aria-label', `Earned: ${displayName(trophy)}`);
  box.addEventListener('change', (event) => {
    event.stopPropagation();
    toggleEarned(trophy);
  });
  const body = document.createElement('div');
  const name = document.createElement('div');
  name.className = 'trophy-name' + (isHiddenBySpoilers(trophy) ? ' spoiler-hidden' : '');
  name.textContent = displayName(trophy);
  const desc = document.createElement('div');
  desc.className = 'trophy-desc';
  desc.textContent = displayDescription(trophy);
  const meta = document.createElement('div');
  meta.className = 'trophy-meta';
  const gradeTag = document.createElement('span');
  gradeTag.className = `tag ${trophy.grade}`;
  gradeTag.textContent = trophy.grade;
  meta.append(gradeTag);
  for (const kind of trophy.kind) {
    if (kind === trophy.grade) continue; // the platinum's kind tag would repeat its grade
    const tag = document.createElement('span');
    tag.className = 'tag kind';
    tag.textContent = kind;
    meta.append(tag);
  }
  if (trophy.missable) {
    const tag = document.createElement('span');
    tag.className = 'tag missable';
    tag.textContent = 'Potentially missable';
    meta.append(tag);
  }
  if (trophy.target) {
    const tag = document.createElement('span');
    tag.className = 'tag target';
    tag.textContent = trophy.target;
    meta.append(tag);
  }
  body.append(name, desc, meta);
  const hint = document.createElement('span');
  hint.className = 'tag';
  hint.textContent = earned.has(trophy.name) ? 'Earned ✓' : 'Guide →';
  li.append(box, body, hint);
  li.addEventListener('click', () => selectTrophy(trophy.id));
  return li;
}

function renderTrophyList() {
  const list = $('trophyList');
  const shown = TROPHIES.filter(trophyMatches);
  list.replaceChildren(...shown.map(trophyCard));
  $('emptyState').hidden = shown.length !== 0;
  if (kindFilter === 'online') {
    $('emptyState').hidden = false;
    $('emptyState').textContent = 'No online trophies — all 55 are single-player, so this filter is empty by design.';
  } else {
    $('emptyState').textContent = 'No trophies match these filters. Try clearing the search or a filter.';
  }
  $('resultCount').textContent = `Showing ${shown.length} of ${TROPHIES.length} trophies`;
}

// ---- rendering: detail pane -----------------------------------------------
function renderDetailPane() {
  const trophy = BY_ID.get(selectedId);
  const pane = $('detailPane');
  pane.replaceChildren();
  const title = document.createElement('h2');
  title.textContent = displayName(trophy);
  const official = document.createElement('p');
  official.className = 'official';
  official.textContent = `Official: “${displayDescription(trophy)}”`;
  const meta = document.createElement('div');
  meta.className = 'trophy-meta';
  const gradeTag = document.createElement('span');
  gradeTag.className = `tag ${trophy.grade}`;
  gradeTag.textContent = trophy.grade;
  meta.append(gradeTag);
  for (const kind of trophy.kind) {
    if (kind === trophy.grade) continue; // the platinum's kind tag would repeat its grade
    const tag = document.createElement('span');
    tag.className = 'tag kind';
    tag.textContent = kind;
    meta.append(tag);
  }
  if (trophy.missable) {
    const tag = document.createElement('span');
    tag.className = 'tag missable';
    tag.textContent = 'Potentially missable — see Missables';
    meta.append(tag);
  }
  if (trophy.target) {
    const tag = document.createElement('span');
    tag.className = 'tag target';
    tag.textContent = trophy.target;
    meta.append(tag);
  }
  pane.append(title, official, meta);
  if (isHiddenBySpoilers(trophy)) {
    const note = document.createElement('p');
    note.className = 'guide-text';
    note.textContent = 'This is a story trophy and spoilers are on, so its guide is hidden until you earn it. Turn “Hide story spoilers until earned” off above to read it now.';
    pane.append(note);
  } else {
    const heading = document.createElement('h3');
    heading.textContent = 'How to get it';
    const guide = document.createElement('div');
    guide.className = 'guide-text';
    for (const paragraph of trophy.guide.split('\n')) {
      const p = document.createElement('p');
      p.textContent = paragraph;
      guide.append(p);
    }
    const sourcesHeading = document.createElement('h3');
    sourcesHeading.textContent = 'Sources';
    const sources = document.createElement('ol');
    sources.className = 'sources';
    for (const source of trophy.sources) {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = source.url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = source.name;
      li.append(a);
      sources.append(li);
    }
    pane.append(heading, guide, sourcesHeading, sources);
  }
  const earnedLine = document.createElement('p');
  earnedLine.className = 'earned-line';
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.textContent = earned.has(trophy.name) ? '✓ Earned — mark as not earned' : 'Mark as earned';
  if (earned.has(trophy.name)) toggle.classList.add('earned');
  toggle.addEventListener('click', () => toggleEarned(trophy));
  earnedLine.append(toggle);
  pane.append(earnedLine);
  const next = TROPHIES.find((t) => !earned.has(t.name) && t.id !== trophy.id);
  if (next) {
    const nextUp = document.createElement('p');
    nextUp.className = 'next-up';
    nextUp.textContent = 'Next up: ';
    const nextButton = document.createElement('button');
    nextButton.type = 'button';
    nextButton.textContent = displayName(next);
    nextButton.addEventListener('click', () => selectTrophy(next.id));
    nextUp.append(nextButton);
    pane.append(nextUp);
  }
}

// ---- rendering: roadmap ----------------------------------------------------
function renderRoadmap() {
  $('roadmapIntro').textContent = roadmapDoc.intro;
  const list = $('roadmapList');
  list.replaceChildren();
  for (const stage of roadmapDoc.stages) {
    const li = document.createElement('li');
    const hours = document.createElement('p');
    hours.className = 'hours';
    hours.textContent = stage.hours;
    const title = document.createElement('h2');
    title.textContent = stage.title;
    const text = document.createElement('p');
    text.textContent = stage.text;
    const chips = document.createElement('div');
    chips.className = 'stage-trophies';
    for (const id of stage.trophies) {
      const trophy = BY_ID.get(id);
      if (!trophy) continue;
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.textContent = (earned.has(trophy.name) ? '✓ ' : '') + displayName(trophy);
      if (earned.has(trophy.name)) chip.classList.add('done');
      chip.addEventListener('click', () => {
        selectTrophy(trophy.id);
        switchView('tracker');
      });
      chips.append(chip);
    }
    li.append(hours, title, text, chips);
    list.append(li);
  }
}

// ---- rendering: missables --------------------------------------------------
function renderMissables() {
  const trophy = TROPHIES.find((t) => t.missable);
  $('missableCallout').innerHTML = '';
  const heading = document.createElement('h2');
  heading.textContent = 'One trophy can be missed — do this first';
  const body = document.createElement('p');
  body.textContent = 'Positive Mental Attitude is the only trophy any guide flags as potentially missable. The first meditation, at Jason\u2019s house in Chapter 1, disappears after Chapter 1 — after the mission Down to Earth, talk to Lucia in the kitchen in the morning, follow her to the balcony and accept. Do it even though it is still being confirmed whether that one is required: better safe than a second playthrough.';
  const note = document.createElement('p');
  note.innerHTML = '';
  note.textContent = 'Source: PowerPyx, GTA 6 Trophy Guide & Roadmap (18 Nov 2026). GTABase flags the same trophy.';
  $('missableCallout').append(heading, body, note);
  $('missableList').replaceChildren(trophyCard(trophy));
}

// ---- state changes ---------------------------------------------------------
function toggleEarned(trophy) {
  if (earned.has(trophy.name)) earned.delete(trophy.name);
  else earned.add(trophy.name);
  persistState();
  renderAll();
}

function selectTrophy(id) {
  selectedId = id;
  renderTrophyList();
  renderDetailPane();
}

function switchView(view) {
  currentView = view;
  for (const name of ['tracker', 'roadmap', 'missables']) {
    $(`view${name[0].toUpperCase()}${name.slice(1)}`).hidden = name !== view;
    $(`tab${name[0].toUpperCase()}${name.slice(1)}`).classList.toggle('active', name === view);
  }
  if (view === 'roadmap') renderRoadmap();
  if (view === 'missables') renderMissables();
}

function renderAll() {
  renderProgress();
  renderTrophyList();
  renderDetailPane();
  if (currentView === 'roadmap') renderRoadmap();
  if (currentView === 'missables') renderMissables();
}

// ---- export / import / reset ----------------------------------------------
function exportProgress() {
  const payload = {
    app: 'Leonida Trophy Guide',
    game: 'Grand Theft Auto VI',
    exported_at: new Date().toISOString(),
    earned: [...earned].sort(),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'gta6-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

async function importProgress(file) {
  if (!file) return;
  try {
    const parsed = JSON.parse(await file.text());
    const names = Array.isArray(parsed) ? parsed : parsed.earned;
    if (!Array.isArray(names)) throw new Error('not a progress file');
    const valid = names.filter((n) => BY_NAME.has(n));
    earned.clear();
    for (const n of valid) earned.add(n);
    persistState();
    renderAll();
    alert(`Imported ${valid.length} earned trophies.`);
  } catch {
    alert('That file is not a trophy progress export from this guide.');
  }
}

// ---- controls --------------------------------------------------------------
function buildKindChips() {
  const box = $('kindChips');
  for (const kind of KINDS) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip' + (kind === kindFilter ? ' active' : '');
    chip.textContent = KIND_LABELS[kind];
    chip.addEventListener('click', () => {
      kindFilter = kind;
      for (const c of box.children) c.classList.toggle('active', c.textContent === KIND_LABELS[kind]);
      renderTrophyList();
    });
    box.append(chip);
  }
}

$('searchInput').value = query;
$('searchInput').addEventListener('input', (event) => {
  query = event.target.value;
  renderTrophyList();
});
$('gradeSelect').value = gradeFilter;
$('gradeSelect').addEventListener('change', (event) => {
  gradeFilter = event.target.value;
  renderTrophyList();
});
$('spoilerToggle').checked = hideSpoilers;
$('spoilerToggle').addEventListener('change', (event) => {
  hideSpoilers = event.target.checked;
  persistState();
  renderAll();
});
$('exportBtn').addEventListener('click', exportProgress);
$('importInput').addEventListener('change', (event) => {
  importProgress(event.target.files[0]);
  event.target.value = '';
});
$('resetBtn').addEventListener('click', () => {
  if (!confirm('Clear all earned trophies and reset this guide?')) return;
  earned.clear();
  persistState();
  renderAll();
});
for (const tab of document.querySelectorAll('.tab')) {
  tab.addEventListener('click', () => switchView(tab.dataset.view));
}

buildKindChips();
switchView(currentView);
renderAll();
