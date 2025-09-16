const sideEls = document.querySelectorAll('input[name="side"]');
const entitySel = document.getElementById('entity');
const alphaEl = document.getElementById('alpha');
const alphaValue = document.getElementById('alphaValue');
const topKEl = document.getElementById('topK');
const results = document.getElementById('results');
const refreshBtn = document.getElementById('refresh');
const runBtn = document.getElementById('run');
const filterInput = document.getElementById('filter');
const toast = document.getElementById('toast');

let lastMatches = [];

alphaEl.addEventListener('input', () => (alphaValue.textContent = Number(alphaEl.value).toFixed(2)));
sideEls.forEach(el => el.addEventListener('change', loadList));
refreshBtn.addEventListener('click', loadList);
runBtn.addEventListener('click', runMatch);
filterInput.addEventListener('input', renderFiltered);

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('on');
  setTimeout(() => toast.classList.remove('on'), 2200);
}

function skelCard() {
  const div = document.createElement('div');
  div.className = 'card';
  div.innerHTML = `
    <div class="head"><div class="t skel" style="height:20px;width:60%"></div><div class="badge skel" style="height:18px;width:70px"></div></div>
    <div class="meta skel" style="height:14px;width:80%"></div>
    <div class="kv">
      <div class="row"><span class="skel" style="height:14px;width:40%"></span><span class="skel" style="height:14px;width:50px"></span></div>
      <div class="row" style="margin-top:6px"><span class="skel" style="height:14px;width:40%"></span><span class="skel" style="height:14px;width:50px"></span></div>
    </div>`;
  return div;
}

async function loadList() {
  const side = document.querySelector('input[name="side"]:checked').value;
  const url = side === 'user' ? '/api/users' : '/api/landlords';
  entitySel.innerHTML = '<option>Loading…</option>';
  try {
    const res = await fetch(url);
    const { data } = await res.json();
    entitySel.innerHTML = '';
    (data || []).forEach(r => {
      const opt = document.createElement('option');
      opt.value = r.id;
      opt.textContent = `${r.name ?? '(no name)'} — ${r.id.slice(0, 8)}`;
      entitySel.appendChild(opt);
    });
    showToast('List refreshed');
  } catch (e) {
    entitySel.innerHTML = '';
    showToast('Failed to load list');
    console.error(e);
  }
}

async function runMatch() {
  const side = document.querySelector('input[name="side"]:checked').value;
  const id = entitySel.value;
  const alpha = Number(alphaEl.value);
  const topK = Number(topKEl.value);

  results.innerHTML = '';
  for (let i = 0; i < 6; i++) results.appendChild(skelCard());

  try {
    const res = await fetch(`/api/match?side=${encodeURIComponent(side)}&id=${encodeURIComponent(id)}&alpha=${alpha}&topK=${topK}`);
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    lastMatches = data.matches || [];
    renderFiltered();
    showToast(`Matched ${lastMatches.length} items`);
  } catch (e) {
    results.innerHTML = `<div class="meta">Error: ${e.message || e}</div>`;
  }
}

function renderFiltered() {
  const q = (filterInput.value || '').toLowerCase().trim();
  const list = q
    ? lastMatches.filter(m =>
        (m.name || '').toLowerCase().includes(q) ||
        (m.property_type || '').toLowerCase().includes(q) ||
        (m.id || '').toLowerCase().includes(q)
      )
    : lastMatches;

  results.innerHTML = list.map(m => cardHTML(m)).join('') || `<div class="meta">No matches.</div>`;

  // Add copy handlers
  document.querySelectorAll('[data-copy]').forEach(el => {
    el.addEventListener('click', () => {
      navigator.clipboard.writeText(el.dataset.copy);
      showToast('Copied ID');
    });
  });
}

function cardHTML(m) {
  const metaBits = [];
  if (m.property_type) metaBits.push(`Type: <strong>${m.property_type}</strong>`);
  if (m.rent_price != null) metaBits.push(`Rent: <strong>£${m.rent_price}</strong>`);
  if (m.availability_date) metaBits.push(`Avail: <strong>${m.availability_date}</strong>`);

  return `
  <div class="card">
    <div class="head">
      <div class="t">${escapeHTML(m.name ?? '—')}</div>
      <div class="badge" data-copy="${m.id}" title="Click to copy ID">${m.id.slice(0,8)}</div>
    </div>
    <div class="meta">${metaBits.join(' · ') || '&nbsp;'}</div>
    <div class="split">
      <div class="kv">
        <div class="row"><span>Score</span><strong>${fmt(m.score)}</strong></div>
        <div class="row"><span>Vector</span><strong>${fmt(m.vectorScore)}</strong></div>
        <div class="row"><span>Rules</span><strong>${fmt(m.ruleScore)}</strong></div>
      </div>
      <div class="kv">
        <div class="row"><span>Price</span><strong>${fmt(m.details?.priceScore)}</strong></div>
        <div class="row"><span>Date</span><strong>${fmt(m.details?.dateScore)}</strong></div>
        <div class="row"><span>Type</span><strong>${fmt(m.details?.typeScore)}</strong></div>
      </div>
    </div>
  </div>`;
}

function fmt(n) {
  if (n == null || Number.isNaN(n)) return '—';
  return Number(n).toFixed(3);
}

function escapeHTML(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

// Initial load
loadList();
