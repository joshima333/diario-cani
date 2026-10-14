// ---------- Diario Cani: crisi epilettiche, terapie, analisi, vaccini ----------
const DOGS = [
  { id: 'kafka', name: 'Kafka', eta: '5 anni', epi: true },
  { id: 'zoe', name: 'Zoe', eta: '10 anni', epi: false },
];

const SINTOMI = ['Perdita di coscienza', 'Pedalamento', 'Rigidità', 'Salivazione', 'Perdita urine', 'Perdita feci', 'Vocalizzi', 'Masticazione a vuoto', 'Tremori', 'Disorientamento dopo', 'Cecità temporanea', 'Fame/sete dopo'];
const TRIGGER = ['Durante il sonno', 'Al risveglio', 'Eccitazione', 'Stress', 'Caldo', 'Dopo il pasto', 'Dose saltata', 'Nessuno noto'];

// Ogni tipo di voce: icona, nome, campi del modulo e riga di riepilogo
const KINDS = {
  crisi: {
    ic: '⚡', name: 'Crisi', only: 'epi',
    fields: [
      { k: 'date', l: 'Giorno', t: 'date' }, { k: 'time', l: 'Ora', t: 'time' },
      { k: 'quante', l: 'Quante crisi (nello stesso episodio)', t: 'num', def: 1 },
      { k: 'dur', l: 'Durata (min e sec)', t: 'dur' },
      { k: 'tipo', l: 'Tipo', t: 'select', o: ['Generalizzata (tonico-clonica)', 'Focale', 'Focale → generalizzata', 'Assenza / lieve', 'Non so'] },
      { k: 'intensita', l: 'Intensità', t: 'stars' },
      { k: 'post', l: 'Fase post-crisi (minuti)', t: 'num' },
      { k: 'sintomi', l: 'Com\'è stata', t: 'chips', o: SINTOMI },
      { k: 'trigger', l: 'Possibile causa', t: 'chips', o: TRIGGER },
      { k: 'emergenza', l: 'Farmaco d\'emergenza dato', t: 'text', ph: 'es. Ziepam 1 mg' },
      { k: 'video', l: 'Video', t: 'select', o: ['Sì, nella galleria', 'No'] },
      { k: 'note', l: 'Note', t: 'area' },
    ],
    sum: d => [d.quante > 1 ? d.quante + ' crisi' : '', fmtDur(d.durSec), d.tipo].filter(Boolean).join(' · '),
  },
  terapia: {
    ic: '💊', name: 'Terapia / dose',
    fields: [
      { k: 'date', l: 'Dal giorno', t: 'date' },
      { k: 'farmaco', l: 'Farmaco', t: 'text', ph: 'es. Fenobarbital', list: 'farmaci' },
      { k: 'dose', l: 'Dose', t: 'text', ph: 'es. 30' },
      { k: 'unita', l: 'Unità', t: 'select', o: ['mg', 'ml', 'compresse', 'gocce', 'mg/kg'] },
      { k: 'freq', l: 'Quante volte', t: 'select', o: ['1 volta al giorno', '2 volte al giorno', '3 volte al giorno', 'Al bisogno', 'Altro'] },
      { k: 'orari', l: 'Orari', t: 'text', ph: 'es. 08:00 e 20:00' },
      { k: 'fine', l: 'Fino al (compreso) — se è una cura a tempo', t: 'date' },
      { k: 'primaOra', l: 'Primo giorno: prima dose alle', t: 'time' },
      { k: 'ultimaOra', l: 'Ultimo giorno: ultima dose alle', t: 'time' },
      { k: 'sospeso', l: 'Stato', t: 'select', o: ['In corso', 'Sospeso'] },
      { k: 'motivo', l: 'Motivo del cambio', t: 'text' },
      { k: 'costo', l: 'Costo (€)', t: 'num', step: '0.01' },
      { k: 'note', l: 'Note', t: 'area' },
    ],
    title: d => d.farmaco || 'Terapia',
    sum: d => d.sospeso === 'Sospeso' ? 'Sospeso' : [d.dose && d.dose + ' ' + (d.unita || ''), d.freq].filter(Boolean).join(' · '),
  },
  analisi: {
    ic: '🩸', name: 'Analisi',
    fields: [
      { k: 'date', l: 'Giorno', t: 'date' },
      { k: 'tipo', l: 'Tipo', t: 'select', o: ['Emocromo + biochimico', 'Livello fenobarbital nel sangue', 'Livello bromuro', 'Funzionalità epatica', 'Urine', 'Tiroide', 'Ecografia', 'Altro'] },
      { k: 'costo', l: 'Costo (€)', t: 'num', step: '0.01' },
      { k: 'valore', l: 'Valore principale', t: 'text', ph: 'es. 28 µg/ml' },
      { k: 'esito', l: 'Esito', t: 'select', o: ['Nella norma', 'Da controllare', 'Alterato'] },
      { k: 'risultati', l: 'Risultati / valori fuori norma', t: 'area' },
      { k: 'prossime', l: 'Prossime analisi', t: 'date' },
      { k: 'docs', l: 'Foto del referto', t: 'docs' },
    ],
    title: d => d.tipo || 'Analisi',
    sum: d => [d.valore, d.esito].filter(Boolean).join(' · '),
  },
  vaccino: {
    ic: '💉', name: 'Vaccino / antiparassitario',
    fields: [
      { k: 'date', l: 'Giorno', t: 'date' },
      { k: 'nome', l: 'Cosa', t: 'text', ph: 'es. Polivalente, Rabbia, Leishmania', list: 'vaccini' },
      { k: 'costo', l: 'Costo (€)', t: 'num', step: '0.01' },
      { k: 'richiamo', l: 'Prossimo richiamo', t: 'date' },
      { k: 'note', l: 'Note', t: 'area' },
    ],
    title: d => d.nome || 'Vaccino',
    sum: d => d.richiamo ? 'Richiamo ' + fmtDate(d.richiamo) : '',
  },
  salute: {
    ic: '🤒', name: 'Problema / sintomo',
    fields: [
      { k: 'date', l: 'Giorno', t: 'date' }, { k: 'time', l: 'Ora', t: 'time' },
      { k: 'titolo', l: 'Cosa è successo', t: 'text', ph: 'es. vomito, zoppia, non mangia' },
      { k: 'gravita', l: 'Gravità', t: 'stars' },
      { k: 'farmaco', l: 'Farmaco dato', t: 'text' },
      { k: 'risolto', l: 'Stato', t: 'select', o: ['In corso', 'Risolto'] },
      { k: 'note', l: 'Note', t: 'area' },
      { k: 'docs', l: 'Foto (ricette, referti…)', t: 'docs' },
    ],
    title: d => d.titolo || 'Problema',
    sum: d => [d.farmaco, d.risolto].filter(Boolean).join(' · '),
  },
  profilo: {
    ic: '🐾', name: 'Profilo', hidden: true,
    fields: [
      { k: 'foto', l: 'Foto', t: 'photo' },
      { k: 'nascita', l: 'Data di nascita', t: 'date' },
      { k: 'razza', l: 'Razza', t: 'text' },
      { k: 'sesso', l: 'Sesso', t: 'select', o: ['Femmina', 'Maschio'] },
      { k: 'sterilizzata', l: 'Sterilizzazione', t: 'select', o: ['Sì', 'No'] },
      { k: 'microchip', l: 'Microchip', t: 'text' },
      { k: 'passaporto', l: 'Passaporto europeo', t: 'text' },
      { k: 'mantello', l: 'Mantello', t: 'text' },
      { k: 'peso', l: 'Peso (kg)', t: 'num', step: '0.1' },
      { k: 'vet', l: 'Veterinario di riferimento', t: 'text' },
      { k: 'note', l: 'Note (allergie, diagnosi…)', t: 'area' },
    ],
    sum: () => '',
  },
  programma: {
    ic: '⏰', name: 'Orari delle pastiglie', hidden: true,
    fields: [{ k: 'slots', l: 'Una riga per pastiglia: ora e cosa', t: 'area', ph: '08:00 Phenoleptil 3/4\n20:00 Libromide 1/2\n23:00 Phenoleptil 3/4' }],
    sum: () => '',
  },
  spesa: {
    ic: '💶', name: 'Spesa',
    fields: [
      { k: 'date', l: 'Giorno', t: 'date' },
      { k: 'cosa', l: 'Cosa', t: 'text', ph: 'es. Visita di controllo, Phenoleptil' },
      { k: 'categoria', l: 'Categoria', t: 'select', o: ['Visita', 'Farmaci', 'Analisi', 'Vaccini', 'Antiparassitari', 'Chirurgia', 'Cibo', 'Toelettatura', 'Altro'] },
      { k: 'costo', l: 'Importo (€)', t: 'num', step: '0.01' },
      { k: 'dove', l: 'Dove', t: 'text', list: 'dove' },
      { k: 'docs', l: 'Foto dello scontrino / fattura', t: 'docs' },
      { k: 'note', l: 'Note', t: 'area' },
    ],
    title: d => d.cosa || d.categoria || 'Spesa',
    sum: d => [d.costo != null && euro(d.costo), d.categoria].filter(Boolean).join(' · '),
  },
  ricorrenza: {
    ic: '🔁', name: 'Promemoria ricorrente', nodate: true,
    fields: [
      { k: 'nome', l: 'Cosa', t: 'text', ph: 'es. NexGard Spectra', list: 'ricorrenze' },
      { k: 'tipo', l: 'Tipo', t: 'select', o: ['Antiparassitario', 'Vaccino', 'Analisi', 'Visita', 'Altro'], def: 'Antiparassitario' },
      { k: 'ogni', l: 'Ogni quanto', t: 'num', def: 1 },
      { k: 'unita', l: 'Unità', t: 'select', o: ['giorni', 'settimane', 'mesi', 'anni'], def: 'mesi' },
      { k: 'ultima', l: 'Ultima volta (se la sai)', t: 'date' },
      { k: 'dose', l: 'Dose / note per la somministrazione', t: 'text', ph: 'es. 1 compressa da 15-30 kg' },
      { k: 'note', l: 'Note', t: 'area' },
    ],
    title: d => d.nome || 'Promemoria',
    sum: d => `ogni ${plural(+d.ogni || 1, ({ giorni: 'giorno', settimane: 'settimana', mesi: 'mese', anni: 'anno' })[d.unita || 'mesi'], d.unita || 'mesi')}`,
  },
  giorno: { ic: '📝', name: 'Diario del giorno', hidden: true, fields: [], sum: d => (d.fattori || []).join(', ') },
  dose: { ic: '✅', name: 'Pastiglia data', hidden: true, fields: [], sum: d => d.slot || '' },
  dosemod: { ic: '✎', name: 'Dose modificata', hidden: true, fields: [], sum: d => d.slot || '' },
  scorta: {
    ic: '📦', name: 'Confezione nuova',
    fields: [
      { k: 'date', l: 'Aperta il', t: 'date' },
      { k: 'farmaco', l: 'Farmaco', t: 'text', list: 'farmaci' },
      { k: 'quante', l: 'Compresse nella confezione', t: 'num' },
      { k: 'avviso', l: 'Avvisami quando ne restano per (giorni)', t: 'num', def: 7 },
      { k: 'costo', l: 'Costo (€)', t: 'num', step: '0.01' },
      { k: 'note', l: 'Note', t: 'area' },
    ],
    title: d => d.farmaco || 'Confezione',
    sum: d => d.quante ? plural(+d.quante, 'compressa', 'compresse') : '',
  },
  visita: {
    ic: '🩺', name: 'Visita veterinaria',
    fields: [
      { k: 'date', l: 'Giorno', t: 'date' },
      { k: 'motivo', l: 'Motivo', t: 'text', ph: 'es. controllo epilessia' },
      { k: 'costo', l: 'Costo (€)', t: 'num', step: '0.01' },
      { k: 'peso', l: 'Peso (kg)', t: 'num', step: '0.1' },
      { k: 'esito', l: 'Cosa ha detto il veterinario', t: 'area' },
      { k: 'prossima', l: 'Prossima visita', t: 'date' },
      { k: 'docs', l: 'Foto (ricette, libretto…)', t: 'docs' },
    ],
    title: d => d.motivo || 'Visita',
    sum: d => [d.peso && d.peso + ' kg', d.prossima && 'Prossima ' + fmtDate(d.prossima)].filter(Boolean).join(' · '),
  },
};

// ---------- utilità ----------
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const pad = n => String(n).padStart(2, '0');
const today = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const nowTime = () => { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const toDate = (d, t) => new Date(`${d}T${t || '12:00'}`);
const fmtDate = d => d ? toDate(d).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
const fmtDur = s => !s ? '' : s < 60 ? s + ' s' : Math.floor(s / 60) + ' min' + (s % 60 ? ' ' + (s % 60) + ' s' : '');
const DAY = 864e5;
const daysBetween = (a, b) => Math.round((b - a) / DAY);
const uuid = () => crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16); });
const titleOf = r => (KINDS[r.kind].title || (() => KINDS[r.kind].name))(r.data);
// avviso in basso, con un'azione opzionale (es. Annulla)
function toast(msg, action) {
  const t = $('#toast'); t.innerHTML = `<span>${esc(msg)}</span>${action ? `<button type="button">${esc(action.label)}</button>` : ''}`; t.hidden = false;
  if (action) t.querySelector('button').onclick = () => { t.hidden = true; action.fn(); };
  clearTimeout(toast.t); toast.t = setTimeout(() => t.hidden = true, action ? 4500 : 2200);
}

// ---------- dati: locale + Supabase ----------
const LS = { get: (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } }, set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} } };
let records = LS.get('cani.records', {});
let pending = new Set(LS.get('cani.pending', []));
const C = window.CONFIG || {};
const sb = C.supabaseUrl && window.supabase ? supabase.createClient(C.supabaseUrl, C.supabaseKey) : null;
let user = null, ownerId = null, readonly = false;

function persist() { if (readonly) return; LS.set('cani.records', records); LS.set('cani.pending', [...pending]); }
function setSync(state) { const s = $('#sync'); s.className = 'sync ' + state; s.title = { '': 'Sincronizzato', busy: 'Sincronizzo…', off: 'Non sincronizzato: riprovo appena c\'è rete' }[state]; }

async function pull() {
  if (!sb || !user || readonly) return;
  const { data, error } = await sb.from('pet_records').select('*');
  if (error) throw error;
  for (const r of data) if (!records[r.id] || r.updated > records[r.id].updated) records[r.id] = { id: r.id, dog: r.dog, kind: r.kind, data: r.data, deleted: r.deleted, updated: r.updated };
  persist();
}
async function push() {
  if (!sb || !user || readonly || !pending.size) return;
  const rows = [...pending].map(id => records[id]).filter(Boolean).map(r => ({ id: r.id, user_id: ownerId || user.id, dog: r.dog, kind: r.kind, data: r.data, deleted: !!r.deleted, updated: r.updated }));
  const { error } = await sb.from('pet_records').upsert(rows);
  if (error) throw error;
  rows.forEach(r => pending.delete(r.id)); persist();
}
async function sync() {
  setSync('busy');
  try { await push(); await pull(); setSync(''); render(); }
  catch (e) { console.warn(e); setSync('off'); }
}
function save(rec) {
  rec.updated = Date.now(); records[rec.id] = rec; pending.add(rec.id); persist(); render(); sync();
}
const list = (dog, kind) => Object.values(records)
  .filter(r => !r.deleted && r.dog === dog && (kind ? r.kind === kind : !KINDS[r.kind]?.hidden))
  .sort((a, b) => toDate(b.data.date, b.data.time) - toDate(a.data.date, a.data.time));


// ---------- stato interfaccia ----------
let dog = LS.get('cani.dog', 'kafka'), tab = 'home', filter = '', range = 6;
const curDog = () => DOGS.find(d => d.id === dog);
const kindsFor = d => Object.entries(KINDS).filter(([, k]) => !k.hidden && (!k.only || d[k.only]));
const COLORS = { crisi: '#ff5f7e', terapia: '#8b7bff', analisi: '#ff8a5c', vaccino: '#2fc28b', salute: '#ffb340', visita: '#3ea6ff', profilo: '#a78bfa', spesa: '#f5b400', scorta: '#22c3c3', ricorrenza: '#2fc28b', giorno: '#a78bfa', dose: '#22c27a', dosemod: '#8b7bff', programma: '#8b7bff' };
const profileId = d => '00000000-0000-4000-8000-' + (d === 'kafka' ? '00000000000a' : '00000000000b');
const profile = d => records[profileId(d)]?.data || {};
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const fmtNum = n => n.toLocaleString('it-IT', { maximumFractionDigits: 1 });
function ageOf(d) {
  const n = profile(d).nascita; if (!n) return DOGS.find(x => x.id === d).eta;
  const b = toDate(n), t = new Date(); let y = t.getFullYear() - b.getFullYear(), m = t.getMonth() - b.getMonth();
  if (t.getDate() < b.getDate()) m--; if (m < 0) { y--; m += 12; }
  return y ? plural(y, 'anno', 'anni') + (m ? ' e ' + plural(m, 'mese', 'mesi') : '') : plural(m, 'mese', 'mesi');
}
function avatar(d, size = 40) {
  const p = profile(d), name = DOGS.find(x => x.id === d).name;
  return `<span class="av av-${d}" style="--s:${size}px">${p.foto ? `<img src="${esc(p.foto)}" alt="">` : `<b>${esc(name[0])}</b>`}</span>`;
}
const since = date => { const n = daysBetween(toDate(date), new Date()); return n <= 0 ? 'oggi' : n === 1 ? 'ieri' : `${n} giorni fa`; };

// stesso farmaco anche se scritto in modo diverso ("Phenoleptil" = "Phenoleptil 100 mg")
const drugKey = f => (f || '').trim().toLowerCase().split(/\s+/)[0];
function currentTherapy(d) {
  const seen = {}, out = [];
  const t = today();
  for (const r of list(d, 'terapia')) { if (r.data.date > t) continue; const k = drugKey(r.data.farmaco); if (seen[k]) continue; seen[k] = 1; if (r.data.sospeso !== 'Sospeso' && !(r.data.fine && r.data.fine < t)) out.push(r); }
  return out;
}
function upcoming(d) {
  const t = today(), out = [], seen = {};
  for (const r of list(d)) { if (r.kind === 'ricorrenza') continue; const due = r.data.richiamo || r.data.prossime || r.data.prossima; if (due && due >= t) out.push({ r, due }); }
  for (const r of list(d, 'ricorrenza')) { const due = nextDue(d, r); if (due) out.push({ r, due }); }
  return out.sort((a, b) => a.due.localeCompare(b.due)).filter(x => { const k = x.r.kind + titleOf(x.r); return seen[k] ? false : (seen[k] = 1); });
}

// ---------- statistiche crisi ----------
const rangeStart = (months, rs) => months ? new Date(new Date().getFullYear(), new Date().getMonth() - months + 1, 1) : (rs.length ? toDate(rs[rs.length - 1].data.date) : new Date());
function seizureStats(d, months) {
  const all = list(d, 'crisi'), from = rangeStart(months, all);
  const rs = all.filter(r => toDate(r.data.date) >= from);
  const n = r => +r.data.quante || 1;
  const total = rs.reduce((s, r) => s + n(r), 0);
  const days = {}; rs.forEach(r => days[r.data.date] = (days[r.data.date] || 0) + n(r));
  const durs = rs.map(r => r.data.durSec).filter(Boolean);
  const dates = Object.keys(days).sort().map(x => toDate(x));
  const gaps = dates.slice(1).map((t, i) => (t - dates[i]) / DAY);
  const spanMonths = Math.max(1, (Date.now() - from) / (30.44 * DAY));
  return {
    all, rs, from, total, giorni: dates.length,
    cluster: Object.values(days).filter(v => v >= 2).length,
    durMedia: durs.length ? Math.round(durs.reduce((a, b) => a + b, 0) / durs.length) : 0,
    durMax: durs.length ? Math.max(...durs) : 0,
    gapMedio: gaps.length ? gaps.reduce((a, b) => a + b, 0) / gaps.length : 0,
    gapMax: gaps.length ? Math.max(...gaps) : 0,
    alMese: total / spanMonths,
    last: all[0] || null,
  };
}
function monthsFrom(from) {
  const out = [], d = new Date(from.getFullYear(), from.getMonth(), 1), end = new Date();
  while (d <= end) { out.push(`${d.getFullYear()}-${pad(d.getMonth() + 1)}`); d.setMonth(d.getMonth() + 1); }
  return out;
}
const monthLbl = (m, i) => { const d = new Date(m + '-01T12:00'), s = d.toLocaleDateString('it-IT', { month: 'short' }).replace('.', ''); return (i === 0 || d.getMonth() === 0) ? `${s} ${String(d.getFullYear()).slice(2)}` : s; };

// grafico a barre SVG; marks = indici dei mesi con un cambio di terapia
function barChart(items, { marks = [], color = '#8b7bff', h = 160 } = {}) {
  const W = 340, H = h, pl = 22, pb = 24, pt = 12, n = Math.max(items.length, 1);
  const max = Math.max(1, ...items.map(i => i.v)), bw = (W - pl) / n;
  const step = max <= 5 ? 1 : Math.ceil(max / 4);
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img"><defs><linearGradient id="g${color.slice(1)}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${color}"/><stop offset="1" stop-color="${color}" stop-opacity=".55"/></linearGradient></defs>`;
  for (let y = 0; y <= max; y += step) { const yy = H - pb - (H - pb - pt) * y / max; s += `<line x1="${pl}" x2="${W}" y1="${yy}" y2="${yy}" stroke="currentColor" stroke-opacity=".08"/><text x="${pl - 6}" y="${yy + 3}" text-anchor="end">${y}</text>`; }
  marks.forEach(i => { const x = pl + bw * i + bw / 2; s += `<line x1="${x}" x2="${x}" y1="${pt}" y2="${H - pb}" stroke="#ff7eb3" stroke-width="1.2" stroke-dasharray="2 3"/><circle cx="${x}" cy="${pt - 3}" r="3" fill="#ff7eb3"/>`; });
  const every = n <= 8 ? 1 : Math.ceil(n / 7);
  items.forEach((it, i) => {
    const bh = (H - pb - pt) * it.v / max, w = Math.max(2, bw * .62), x = pl + bw * i + (bw - w) / 2;
    if (it.v) s += `<rect x="${x}" y="${H - pb - bh}" width="${w}" height="${bh}" rx="${Math.min(4, w / 2)}" fill="url(#g${color.slice(1)})" style="animation-delay:${Math.min(i * 18, 500)}ms"><title>${esc(it.t || it.l)}: ${it.v}</title></rect>`;
    if (i % every === 0) s += `<text x="${pl + bw * i + bw / 2}" y="${H - 7}" text-anchor="middle">${esc(it.l)}</text>`;
  });
  return s + '</svg>';
}
// fasce della terapia sotto il grafico delle crisi: una riga per farmaco, un tratto per ogni dosaggio
const fracOf = s => { s = String(s || '').trim().replace(',', '.'); let m;
  if ((m = s.match(/^(\d+)\s+(\d+)\/(\d+)/))) return +m[1] + m[2] / m[3];
  if ((m = s.match(/^(\d+)\/(\d+)/))) return m[1] / m[2];
  if ((m = s.match(/^\d+(\.\d+)?/))) return +m[0];
  return null; };
function therapyBands(d, ms) {
  const W = 340, pl = 22, n = ms.length, bw = (W - pl) / n, x0 = toDate(ms[0] + '-01'), end = new Date();
  const X = date => { const t = toDate(date) < x0 ? x0 : toDate(date) > end ? end : toDate(date); const i = (t.getFullYear() - x0.getFullYear()) * 12 + t.getMonth() - x0.getMonth(); const dim = new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate(); return pl + bw * (i + (t.getDate() - 1) / dim); };
  const byDrug = {};
  for (const r of list(d, 'terapia').slice().reverse()) (byDrug[drugKey(r.data.farmaco)] ||= []).push(r);
  const rows = Object.entries(byDrug).map(([k, rs]) => ({ name: rs[rs.length - 1].data.farmaco.split(' (')[0], segs: rs.map((r, i) => ({ r, from: r.data.date, to: r.data.fine && (!rs[i + 1] || r.data.fine < rs[i + 1].data.date) ? r.data.fine : rs[i + 1]?.data.date || isoOf(end) })).filter(s => s.r.data.sospeso !== 'Sospeso' && s.to >= ms[0] + '-01') })).filter(r => r.segs.length);
  if (!rows.length) return '';
  const RH = 26; let svg = `<svg viewBox="0 0 ${W} ${rows.length * RH + 4}" role="img" class="bands">`;
  rows.forEach((row, ri) => {
    const y = ri * RH, col = PHASE[ri % PHASE.length];
    svg += `<text x="${pl}" y="${y + 9}" class="bn">${esc(row.name)}</text>`;
    row.segs.forEach((s, si) => {
      const a = X(s.from), b = Math.max(a + 2, X(s.to)), x = s.r.data, per = timesIn(x.orari).length || parseInt(x.freq) || 1;
      const lbl = x.dose ? `${x.dose}${per > 1 ? '×' + per : ''}` : '';
      svg += `<rect x="${a}" y="${y + 12}" width="${b - a - 1}" height="12" rx="3" fill="${col}" fill-opacity="${.35 + .65 * (si + 1) / row.segs.length}"><title>${esc(x.farmaco)} ${esc(lbl)} dal ${esc(fmtDate(x.date))}</title></rect>`;
      if (b - a > 26 && lbl) svg += `<text x="${a + 3}" y="${y + 21.5}" class="bl">${esc(lbl)}</text>`;
    });
  });
  return svg + '</svg>';
}
function seizureMonthChart(d, st) {
  const ms = monthsFrom(st.from), counts = Object.fromEntries(ms.map(m => [m, 0]));
  st.rs.forEach(r => { const m = r.data.date.slice(0, 7); if (m in counts) counts[m] += +r.data.quante || 1; });
  const marks = [...new Set(list(d, 'terapia').map(r => ms.indexOf(r.data.date.slice(0, 7))).filter(i => i >= 0))];
  return barChart(ms.map((m, i) => ({ l: monthLbl(m, i), t: new Date(m + '-01T12:00').toLocaleDateString('it-IT', { month: 'long', year: 'numeric' }), v: counts[m] })), { marks, color: COLORS.crisi }) + therapyBands(d, ms);
}
function hourChart(st) {
  const b = Array(8).fill(0);
  st.rs.forEach(r => { if (r.data.time) b[Math.floor(+r.data.time.slice(0, 2) / 3)] += +r.data.quante || 1; });
  return barChart(b.map((v, i) => ({ l: `${i * 3}-${i * 3 + 3}`, t: `dalle ${i * 3} alle ${i * 3 + 3}`, v })), { color: '#3ea6ff', h: 140 });
}
function hbars(counts, color = '#8b7bff') {
  const e = Object.entries(counts).sort((a, b) => b[1] - a[1]); if (!e.length) return '<p class="muted small">Nessun dato nel periodo</p>';
  const max = e[0][1];
  return e.map(([k, v]) => `<div class="hb"><div><span>${esc(k)}</span><b>${v}</b></div><i><i style="width:${v / max * 100}%;background:${color}"></i></i></div>`).join('');
}
const countBy = (rs, f) => rs.reduce((o, r) => { [].concat(f(r) || []).forEach(k => o[k] = (o[k] || 0) + 1); return o; }, {});

// ---------- pezzi di interfaccia ----------
const dots = n => n ? `<span class="dots" title="Intensità ${n}/5">${[1, 2, 3, 4, 5].map(i => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</span>` : '';
function itemHTML(r, { swipe = !readonly } = {}) {
  const k = KINDS[r.kind], d = r.data, q = +d.quante || 1;
  const extra = (d.docs?.length ? ' <span class="clip">📎</span>' : '') + (d.video?.startsWith('Sì') ? ' <span class="clip">📹</span>' : '');
  const title = (r.kind === 'crisi' ? `Crisi${q > 1 ? ` <span class="badge">×${q}</span>` : ''}` : esc(titleOf(r))) + extra;
  const sub = r.kind === 'crisi' ? [fmtDur(d.durSec), d.tipo && d.tipo.replace(' (tonico-clonica)', '')].filter(Boolean).join(' · ') : k.sum(d);
  const cost = +d.costo > 0 && r.kind !== 'spesa' ? ` · ${euro(d.costo)}` : '';
  const row = `<div class="sc"><div class="ic" style="--c:${COLORS[r.kind]}">${k.ic}</div>
    <div class="tx"><b>${title}</b><small>${esc(sub) + cost || (r.kind === 'crisi' && d.note ? esc(d.note) : '&nbsp;')}</small>${r.kind === 'crisi' ? dots(d.intensita) : ''}</div>
    <div class="dt">${esc(fmtDate(d.date))}${d.time ? `<br><span>${esc(d.time)}</span>` : ''}</div></div>`;
  return `<div class="item${swipe ? ' swipe' : ''}" data-id="${r.id}">${swipe ? '<div class="sdel">🗑 Elimina</div>' : ''}${row}</div>`;
}
const listHTML = (arr, empty = 'Ancora niente qui', opt) => `<div class="glass list">${arr.length ? arr.map(r => itemHTML(r, opt)).join('') : `<div class="empty">${empty}</div>`}</div>`;
// sezioni richiudibili: si apre/chiude toccando il titolo, la scelta resta salvata
const folds = new Set(LS.get('cani.fold', []));
const SEC_IC = [[/pastiglie/i, '💊'], [/calendario/i, '🗓️'], [/giornata/i, '📝'], [/ricorrenti/i, '🔁'], [/terapia in corso/i, '🩺'], [/storia della terapia/i, '📜'], [/scorte/i, '📦'], [/arrivo/i, '🔔'], [/ultime voci/i, '🕘'], [/^crisi$/i, '⚡'], [/analisi/i, '🩸'], [/visit/i, '🩺'], [/vaccin/i, '💉'], [/problem/i, '🤒'], [/spes/i, '💶']];
const section = (title, body, extra = '') => {
  const key = title.replace(/<[^>]+>/g, '').trim(), shut = folds.has(key), ic = (SEC_IC.find(([re]) => re.test(key)) || [, '📅'])[1];
  return `<div class="sec${shut ? ' shut' : ''}" data-fold="${esc(key)}" role="button" onclick="if(!event.target.closest('button'))toggleFold(this)"><h3><span class="sec-ic">${/^[A-Za-zÀ-ÿ]/.test(key) && /^\d{4}$/.test(key.slice(-4)) ? '📅' : ic}</span>${title}<i class="chev">›</i></h3>${extra}</div><div class="fold-body${shut ? ' folded' : ''}"><div>${body}</div></div>`;
};
function toggleFold(el) {
  const key = el.dataset.fold, body = el.nextElementSibling, shut = !folds.has(key);
  shut ? folds.add(key) : folds.delete(key); LS.set('cani.fold', [...folds]);
  el.classList.toggle('shut', shut); body.classList.toggle('folded', shut);
}

function therapyCards(d) {
  const th = currentTherapy(d);
  if (!th.length) return `<div class="glass list"><div class="empty">Nessuna terapia in corso<br><small>Aggiungila con il tasto +</small></div></div>`;
  return `<div class="drugs">${th.map(r => { const x = r.data; return `<div class="glass drug" data-id="${r.id}" style="--c:${COLORS.terapia}">
    <div class="drug-h"><span class="ic" style="--c:${COLORS.terapia}">💊</span><div><b>${esc(x.farmaco || 'Farmaco')}</b><small>dal ${esc(fmtDate(x.date))}</small></div></div>
    <div class="chips2">${x.dose ? `<span>${esc(x.dose)} ${esc(x.unita || '')}</span>` : ''}${x.freq ? `<span>${esc(x.freq)}</span>` : ''}${x.orari ? `<span>🕒 ${esc(x.orari)}</span>` : ''}${x.fine ? `<span>fino al ${esc(fmtDate(x.fine))}</span>` : ''}</div>
    ${nextChange(d, r) ? `<p class="next">↪ ${nextChange(d, r)}</p>` : ''}</div>`; }).join('')}</div>`;
}
function nextChange(d, cur) {
  const k = drugKey(cur.data.farmaco), n = list(d, 'terapia').filter(r => drugKey(r.data.farmaco) === k && r.data.date > today()).pop();
  return n ? `dal ${esc(fmtDate(n.data.date))}: ${esc(n.data.sospeso === 'Sospeso' ? 'sospeso' : [n.data.dose, n.data.unita].filter(Boolean).join(' '))}` : '';
}
function heroCard() {
  const d = curDog(), p = profile(dog);
  const bits = [p.razza, p.sesso, p.peso && fmtNum(+p.peso) + ' kg'].filter(Boolean).join(' · ');
  let right = '';
  if (d.epi) {
    const st = seizureStats(dog, 1);
    const n = st.last ? Math.max(0, daysBetween(toDate(st.last.data.date), new Date())) : null;
    right = `<div class="streak"><b>${n ?? '—'}</b><small>${n === 1 ? 'giorno' : 'giorni'} senza crisi</small></div>`;
  }
  return `<div class="glass hero" data-profile${p.foto ? ` style="--photo:url('${esc(p.foto)}')"` : ''}>
    ${avatar(dog, 72)}
    <div class="hero-tx"><h2>${esc(d.name)}</h2><p>${esc(ageOf(dog))}</p><small>${esc(bits) || 'Tocca per completare il profilo ›'}</small></div>${right}</div>`;
}

// ---------- viste ----------
// riquadri "a colpo d'occhio": solo ciò che conta adesso, in ordine di importanza
const TILE_IC = [[/da dare/i, '⏰'], [/pastiglia/i, '💊'], [/crisi questo/i, '⚡'], [/ultima crisi/i, '📅'], [/media/i, '📈'], [/cura/i, '🩹'], [/finendo/i, '📦'], [/scadenza|scaduto/i, '🔔'], [/visita/i, '🩺']];
const tile = (label, big, sub = '', em = '', attrs = '', cls = '') => `<div class="glass tile${attrs ? ' tap' : ''} ${cls}" ${attrs}><i class="t-ic">${(TILE_IC.find(([re]) => re.test(label)) || [, ''])[1]}</i><small>${label}</small><b class="${String(big).length > 6 ? 'sm' : ''}">${big}</b>${sub ? `<span>${sub}</span>` : ''}${em ? `<em>${em}</em>` : ''}</div>`;
const inTime = mins => mins < 60 ? `tra ${mins} min` : `tra ${Math.floor(mins / 60)} h${mins % 60 ? ' ' + (mins % 60) + ' min' : ''}`;
function nextDose(d) {
  const t = today(), now = nowTime(), mins = hm => +hm.slice(0, 2) * 60 + +hm.slice(3);
  for (const [day, add] of [[t, 0], [dayAdd(t, 1), 1440]]) {
    const taken = new Set(dosesOn(d, day).map(r => r.data.slot));
    const s = slotsFor(d, day).find(s => !taken.has(slotKey(s)) && (day > t || s.t >= now));
    if (s) return { ...s, day, mins: mins(s.t) + add - mins(now), tomorrow: !!add };
  }
  return null;
}
function homeTiles() {
  const d = curDog(), out = [], t = today();
  const late = (() => { const taken = new Set(dosesOn(dog, t).map(r => r.data.slot)); return slotsFor(dog, t).filter(s => !taken.has(slotKey(s)) && s.t < nowTime()); })();
  const giveBtn = (s, day) => readonly ? '' : `<button class="give" data-pill="${esc(slotKey(s))}" data-day="${day}">✓ Data</button>`;
  const withBtn = (html, s, day) => html.replace(/<\/div>$/, giveBtn(s, day) + '</div>');
  if (late.length) out.push(withBtn(tile('Da dare', `${late[0].t}`, esc(late[0].what), late.length > 1 ? `e altre ${late.length - 1}` : 'in ritardo', '', 'warn'), late[0], t));
  const nd = nextDose(dog);
  if (nd) out.push(withBtn(tile('Prossima pastiglia', `${nd.tomorrow ? 'domani ' : ''}${nd.t}`, esc(nd.what), inTime(nd.mins)), nd, nd.day));
  if (d.epi) {
    const m = seizureStats(dog, 1), m2 = seizureStats(dog, 2), q = seizureStats(dog, 3), diff = m.total - (m2.total - m.total);
    out.push(tile('Crisi questo mese', m.total, '', diff > 0 ? `<i class="up">▲ ${diff} sul mese scorso</i>` : diff < 0 ? `<i class="down">▼ ${-diff} sul mese scorso</i>` : 'come il mese scorso'));
    if (q.last || m.last) { const l = m.last || q.last; out.push(tile('Ultima crisi', esc(fmtDate(l.data.date).replace(/ \d{4}$/, '')), since(l.data.date), '', `data-id="${l.id}"`)); }
    out.push(tile('Media 3 mesi', fmtNum(q.alMese), 'crisi al mese'));
  }
  const rg = courseRange(dog);
  if (rg && rg.to >= t) { const tot = daysBetween(toDate(rg.from), toDate(rg.to)) + 1, n = Math.min(tot, daysBetween(toDate(rg.from), toDate(t)) + 1); out.push(tile('Cura in corso', `giorno ${n}/${tot}`, `fino al ${esc(fmtDate(rg.to).replace(/ \d{4}$/, ''))}`, `<i class="bar"><i style="width:${n / tot * 100}%"></i></i>`)); }
  for (const b of stockStatus(dog).filter(b => b.daysLeft != null && b.daysLeft <= b.warn)) out.push(tile('Sta finendo', esc(b.farmaco), b.daysLeft <= 0 ? 'finita' : `per ${plural(b.daysLeft, 'giorno', 'giorni')}`, `circa ${fmtNum(Math.max(0, b.left))} compresse`, `data-id="${b.id}"`, 'warn'));
  const up = upcoming(dog)[0];
  if (up) out.push(tile(up.due < t ? 'Scaduto' : 'Prossima scadenza', esc(titleOf(up.r)), esc(fmtDate(up.due)), whenTxt(up.due), `data-id="${up.r.id}"`, up.due <= t ? 'warn' : ''));
  if (!d.epi) { const v = list(dog, 'visita').filter(r => r.data.date <= t)[0]; if (v) out.push(tile('Ultima visita', esc(fmtDate(v.data.date).replace(/ \d{4}$/, '')), since(v.data.date), esc(v.data.motivo || ''), `data-id="${v.id}"`)); }
  if (out.length) out[0] = out[0].replace('class="glass tile', 'class="glass tile prime');
  return out.length ? `<div class="tiles">${out.slice(0, 6).join('')}</div>` : '';
}
function viewHome() {
  const d = curDog(); let h = heroCard();
  if (d.epi && !readonly && !liveRec()) h += `<button class="sos" data-live="start"><span>⚡</span><b>Crisi adesso</b><small>avvia il cronometro</small></button>`;
  h += homeTiles();
  if (!readonly) h += pillsCard();
  if (!readonly) h += dayLogCard();
  h += recurringCard();
  h += section('Terapia in corso', therapyCards(dog));
  h += stockCard();
  const up = upcoming(dog).slice(0, 4);
  if (up.length) h += section('In arrivo', `<div class="glass list">${up.map(({ r, due }) => `<div class="item" data-id="${r.id}"><div class="sc"><div class="ic" style="--c:${COLORS[r.kind]}">${KINDS[r.kind].ic}</div><div class="tx"><b>${esc(titleOf(r))}</b><small class="${due < today() ? 'late' : ''}">${whenTxt(due)}</small></div><div class="dt">${esc(fmtDate(due))}</div></div></div>`).join('')}</div>`, `<button class="link" data-ics="up">📅</button>`);
  h += section('Ultime voci', listHTML(list(dog).filter(r => r.data.date <= today()).slice(0, 5), 'Tocca + per aggiungere la prima voce'), `<button class="link" data-goto="diario">Vedi tutto</button>`);
  return h;
}

let query = '';
const norm_ = s => String(s ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const textOf = r => norm_([KINDS[r.kind].name, titleOf(r), ...Object.values(r.data).flat()].join(' '));
function viewDiario() {
  const kinds = kindsFor(curDog());
  let h = `<div class="search glass"><span>🔍</span><input id="q" type="search" placeholder="Cerca (es. Ziepam, vomito, bava…)" value="${esc(query)}" autocomplete="off">${query ? '<button class="link" data-clearq>✕</button>' : ''}</div><div class="filters"><button class="pill ${!filter ? 'on' : ''}" data-filter="">Tutto</button>${kinds.map(([id, k]) => `<button class="pill ${filter === id ? 'on' : ''}" data-filter="${id}">${k.ic} ${k.name}</button>`).join('')}</div>`;
  h = `<div class="seg3 dmode"><button class="${diaryMode === 'list' ? 'on' : ''}" data-dmode="list">☰ Elenco</button><button class="${diaryMode === 'month' ? 'on' : ''}" data-dmode="month">🗓️ Mese</button></div>` + h;
  const words = norm_(query).split(/\s+/).filter(Boolean);
  const rs = list(dog, filter || undefined).filter(r => !words.length || words.every(w => textOf(r).includes(w)));
  if (diaryMode === 'month') return h + monthHTML(list(dog, filter || undefined).filter(r => !words.length || words.every(w => textOf(r).includes(w))));
  if (words.length) h += `<p class="period">${plural(rs.length, 'risultato', 'risultati')}</p>`;
  if (!rs.length) return h + listHTML([], words.length ? 'Nessun risultato' : undefined);
  const groups = {};
  rs.forEach(r => (groups[r.data.date.slice(0, 7)] ||= []).push(r));
  for (const [m, arr] of Object.entries(groups)) {
    const n = arr.filter(r => r.kind === 'crisi').reduce((s, r) => s + (+r.data.quante || 1), 0);
    h += section(new Date(m + '-01T12:00').toLocaleDateString('it-IT', { month: 'long', year: 'numeric' }), listHTML(arr), n ? `<span class="count">⚡ ${n}</span>` : '');
  }
  return h + `<p class="hint">Scorri una voce verso sinistra per eliminarla</p>`;
}

const RANGES = [[3, '3 mesi'], [6, '6 mesi'], [12, '1 anno'], [0, 'Tutto']];
const rangePills = () => `<div class="filters seg2">${RANGES.map(([v, l]) => `<button class="pill ${range === v ? 'on' : ''}" data-range="${v}">${l}</button>`).join('')}</div>`;
const periodText = from => `dal ${from.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })} a oggi`;

function statTiles(st) {
  const t = (v, l, s = '') => `<div class="glass tile"><small>${l}</small><b class="${String(v).length > 5 ? 'sm' : ''}">${v}</b>${s ? `<span>${s}</span>` : ''}</div>`;
  return `<div class="tiles">
    ${t(st.total, 'Crisi totali', `in ${plural(st.giorni, 'giorno', 'giorni')} diversi`)}
    ${t(fmtNum(st.alMese), 'Media mensile', 'crisi al mese')}
    ${t(st.gapMedio ? Math.round(st.gapMedio) : '—', 'Pausa media', st.gapMax ? `giorni tra due crisi (max ${Math.round(st.gapMax)})` : 'giorni tra due crisi')}
    ${t(st.cluster, 'Giorni a grappolo', 'con 2 o più crisi')}
    ${t(fmtDur(st.durMedia) || '—', 'Durata media', st.durMax ? `la più lunga ${fmtDur(st.durMax)}` : 'non annotata')}
    ${t(st.last ? since(st.last.data.date) : '—', 'Ultima crisi', st.last ? fmtDate(st.last.data.date) : '')}
  </div>`;
}
const chartCard = (title, sub, svg, legend = '') => `<div class="glass card chart"><div class="card-h"><h2>${title}</h2>${sub ? `<small>${sub}</small>` : ''}</div>${svg}${legend}</div>`;
const monthLegend = `<div class="legend"><span><i style="background:${COLORS.crisi}"></i>Numero di crisi</span><span><i class="dash"></i>Cambio di terapia</span></div>`;

function viewStats() {
  const d = curDog(); let h = rangePills();
  if (d.epi) {
    const st = seizureStats(dog, range);
    h += `<p class="period">${periodText(st.from)}</p>` + statTiles(st);
    h += chartCard('Crisi per mese', 'Ogni barra è un mese', seizureMonthChart(dog, st), monthLegend);
    h += chartCard('A che ora succedono', 'Numero di crisi per fascia oraria', hourChart(st));
    h += `<div class="glass card"><h2>Com'erano</h2>${hbars(countBy(st.rs, r => r.data.sintomi), COLORS.crisi)}</div>`;
    h += `<div class="glass card"><h2>Possibili cause</h2>${hbars(countBy(st.rs, r => r.data.trigger), COLORS.salute)}</div>`;
  }
  const all = list(dog), from = rangeStart(range, all), rs = all.filter(r => toDate(r.data.date) >= from);
  if (!d.epi) h += `<p class="period">${periodText(from)}</p>`;
  const ms = monthsFrom(from), c = Object.fromEntries(ms.map(m => [m, 0]));
  rs.filter(r => r.kind === 'salute').forEach(r => { const m = r.data.date.slice(0, 7); if (m in c) c[m]++; });
  if (!d.epi || rs.some(r => r.kind === 'salute')) h += chartCard('Problemi di salute', 'Per mese', barChart(ms.map((m, i) => ({ l: monthLbl(m, i), v: c[m] })), { color: COLORS.salute, h: 140 }));
  if (d.epi) h += therapyPeriodsCard();
  h += levelsCards();
  const pesi = list(dog, 'visita').filter(r => r.data.peso).slice(0, 6);
  if (pesi.length > 1) h += chartCard('Peso', 'Dalle visite', lineChart(pesi.slice().reverse().map(r => ({ x: toDate(r.data.date), y: +r.data.peso, l: fmtDate(r.data.date) })), COLORS.visita, ' kg'));
  else if (pesi.length) h += `<div class="glass card"><h2>Peso</h2>${pesi.map(r => `<div class="kv"><span>${esc(fmtDate(r.data.date))}</span><b>${esc(fmtNum(+r.data.peso))} kg</b></div>`).join('')}</div>`;
  h += factorsCard();
  h += expensesCard();
  h += `<div class="glass card"><h2>Voci registrate</h2>${hbars(countBy(rs, r => KINDS[r.kind].name))}</div>`;
  return h;
}

// ---------- veterinario: in app (leggibile) e PDF (tabelle) ----------
function vetSummary(st) {
  if (!st.total) return '<p>Nessuna crisi nel periodo. 🎉</p>';
  const L = [
    `<b>${plural(st.total, 'crisi', 'crisi')}</b> in ${plural(st.giorni, 'giorno', 'giorni')} diversi, in media <b>${fmtNum(st.alMese)} al mese</b>.`,
    st.cluster ? `In <b>${plural(st.cluster, 'giorno', 'giorni')}</b> ci sono state 2 o più crisi (a grappolo).` : 'Nessun giorno con crisi a grappolo.',
    st.gapMedio ? `Tra una crisi e l'altra passano in media <b>${plural(Math.round(st.gapMedio), 'giorno', 'giorni')}</b> (pausa più lunga: ${Math.round(st.gapMax)}).` : '',
    st.durMedia ? `Durata media <b>${fmtDur(st.durMedia)}</b>, la più lunga ${fmtDur(st.durMax)}.` : '',
    adherenceText(dog),
    st.last ? `Ultima crisi: <b>${esc(fmtDate(st.last.data.date))}${st.last.data.time ? ' alle ' + esc(st.last.data.time) : ''}</b>.` : '',
  ];
  return `<ul class="summary">${L.filter(Boolean).map(l => `<li>${l}</li>`).join('')}</ul>`;
}
function timeline(rs) {
  if (!rs.length) return `<div class="glass list"><div class="empty">Nessuna voce</div></div>`;
  return `<div class="glass tl">${rs.map(r => { const x = r.data, stop = x.sospeso === 'Sospeso'; return `<div class="tl-i${stop ? ' stop' : ''}" data-id="${r.id}">
    <div class="tl-d">${esc(fmtDate(x.date))}</div><div class="tl-b"><b>${esc(x.farmaco || '')}</b>
    <small>${stop ? 'Sospeso' : esc([x.dose && `${x.dose} ${x.unita || ''}`, x.freq, x.orari].filter(Boolean).join(' · '))}</small>
    ${x.motivo || x.note ? `<p>${esc([x.motivo, x.note].filter(Boolean).join(' — '))}</p>` : ''}</div></div>`; }).join('')}</div>`;
}
function viewVet() {
  const d = curDog(), all = list(dog), from = rangeStart(range, d.epi ? list(dog, 'crisi') : all);
  const inR = rs => rs.filter(r => toDate(r.data.date) >= from);
  let h = `<div class="glass card actions"><p>Mostra questa pagina al veterinario, oppure invia:</p>
    <div class="row"><button class="btn primary" id="pdf">📄 PDF</button><button class="btn" id="csv">📊 Excel (CSV)</button></div></div>`;
  h += rangePills() + `<p class="period">${periodText(from)}</p>`;
  if (d.epi) {
    const st = seizureStats(dog, range);
    h += `<div class="glass card"><h2>In sintesi</h2>${vetSummary(st)}</div>`;
    h += chartCard('Crisi per mese', '', seizureMonthChart(dog, st), monthLegend);
  }
  h += section('Terapia in corso', therapyCards(dog));
  if (d.epi) h += therapyPeriodsCard();
  h += section('Storia della terapia', timeline(list(dog, 'terapia')));
  if (d.epi) h += section('Crisi', listHTML(inR(list(dog, 'crisi')), 'Nessuna crisi nel periodo', { swipe: false }));
  for (const k of ['analisi', 'visita', 'salute', 'vaccino']) {
    const rs = k === 'vaccino' ? list(dog, k) : inR(list(dog, k));
    if (rs.length) h += section(KINDS[k].name, listHTML(rs, '', { swipe: false }));
  }
  return h;
}

// report stampabile (PDF)
function table(rs, cols) {
  if (!rs.length) return '<p>Nessuna voce</p>';
  return `<table><tr>${cols.map(c => `<th>${c[0]}</th>`).join('')}</tr>${rs.map(r => `<tr>${cols.map(c => `<td>${esc(c[1](r.data))}</td>`).join('')}</tr>`).join('')}</table>`;
}
const arr = v => [].concat(v || []).join(', ');
function reportHTML() {
  const d = curDog(), p = profile(dog), from = rangeStart(range, d.epi ? list(dog, 'crisi') : list(dog));
  const inR = rs => rs.filter(r => toDate(r.data.date) >= from);
  const info = [p.razza, p.sesso, p.sterilizzata === 'Sì' && 'sterilizzata', p.nascita && 'nata il ' + fmtDate(p.nascita), p.peso && p.peso + ' kg', p.microchip && 'microchip ' + p.microchip].filter(Boolean).join(' · ');
  let h = `<section class="rep-h">${p.foto ? `<img src="${esc(p.foto)}" alt="">` : ''}<div><h1>${esc(d.name)} — ${esc(ageOf(dog))}</h1>${info ? `<p>${esc(info)}</p>` : ''}${p.note ? `<p>${esc(p.note)}</p>` : ''}<p class="muted">Report ${periodText(from)}</p></div></section>`;
  if (d.epi) {
    const st = seizureStats(dog, range);
    h += `<section><h2>Sintesi crisi</h2>${vetSummary(st)}</section>`;
    h += `<section class="chart"><h2>Crisi per mese</h2>${seizureMonthChart(dog, st)}<p class="muted">Pallino rosa = cambio di terapia</p></section>`;
  }
  h += `<section><h2>Terapia in corso</h2>${table(currentTherapy(dog), [['Farmaco', x => x.farmaco], ['Dose', x => `${x.dose || ''} ${x.unita || ''}`], ['Frequenza', x => x.freq], ['Orari', x => x.orari], ['Dal', x => fmtDate(x.date)]])}</section>`;
  if (d.epi) h += `<section><h2>Crisi con ogni terapia</h2>${table(therapyPeriods(dog).map(x => ({ data: x })), [['Periodo', x => `${fmtDate(x.from)} → ${x.to ? fmtDate(x.to) : 'oggi'}`], ['Terapia', x => x.label], ['Crisi', x => x.n], ['Al mese', x => fmtNum(x.rate)]])}</section>`;
  h += `<section><h2>Storia della terapia</h2>${table(list(dog, 'terapia'), [['Dal', x => fmtDate(x.date)], ['Farmaco', x => x.farmaco], ['Dose', x => `${x.dose || ''} ${x.unita || ''}`], ['Frequenza', x => x.freq], ['Stato', x => x.sospeso], ['Note', x => [x.motivo, x.note].filter(Boolean).join(' — ')]])}</section>`;
  if (d.epi) h += `<section><h2>Elenco crisi</h2>${table(inR(list(dog, 'crisi')), [['Giorno', x => fmtDate(x.date)], ['Ora', x => x.time], ['N.', x => x.quante || 1], ['Durata', x => fmtDur(x.durSec)], ['Intensità', x => x.intensita ? x.intensita + '/5' : ''], ['Ripresa', x => x.post ? x.post + ' min' : ''], ['Sintomi', x => arr(x.sintomi)], ['Farmaco emergenza', x => x.emergenza], ['Note', x => x.note]])}</section>`;
  h += `<section><h2>Analisi</h2>${table(inR(list(dog, 'analisi')), [['Giorno', x => fmtDate(x.date)], ['Tipo', x => x.tipo], ['Valore', x => x.valore], ['Esito', x => x.esito], ['Risultati', x => x.risultati]])}</section>`;
  h += `<section><h2>Problemi di salute</h2>${table(inR(list(dog, 'salute')), [['Giorno', x => fmtDate(x.date)], ['Cosa', x => x.titolo], ['Farmaco', x => x.farmaco], ['Stato', x => x.risolto], ['Note', x => x.note]])}</section>`;
  h += `<section><h2>Visite</h2>${table(inR(list(dog, 'visita')), [['Giorno', x => fmtDate(x.date)], ['Motivo', x => x.motivo], ['Peso', x => x.peso ? x.peso + ' kg' : ''], ['Esito', x => x.esito]])}</section>`;
  h += `<section><h2>Vaccini e antiparassitari</h2>${table(list(dog, 'vaccino'), [['Giorno', x => fmtDate(x.date)], ['Cosa', x => x.nome], ['Richiamo', x => fmtDate(x.richiamo)], ['Note', x => x.note]])}</section>`;
  return h;
}

function exportPDF() { $('#print').innerHTML = reportHTML(); setTimeout(() => window.print(), 50); }
function shareFile(blob, name) {
  const file = new File([blob], name, { type: blob.type });
  if (navigator.canShare?.({ files: [file] })) return navigator.share({ files: [file], title: name }).catch(() => {});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
function exportCSV() {
  const rs = list(dog), cols = [['tipo', 'Tipo'], ['date', 'Giorno'], ['time', 'Ora']];
  for (const k of Object.values(KINDS)) if (!k.hidden) for (const f of k.fields) if (!cols.some(c => c[0] === (f.t === 'dur' ? 'durSec' : f.k))) cols.push(f.t === 'dur' ? ['durSec', 'Durata (sec)'] : [f.k, f.l]);
  const cell = v => { const s = Array.isArray(v) ? v.join(', ') : String(v ?? ''); return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const lines = [cols.map(c => cell(c[1])).join(';'), ...rs.map(r => cols.map(c => cell(c[0] === 'tipo' ? KINDS[r.kind].name : r.data[c[0]])).join(';'))];
  shareFile(new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' }), `${curDog().name}-${today()}.csv`);
}
// backup di tutti e due i cani; lo stesso formato si reimporta con "Importa"
function exportBackup() {
  const rs = Object.values(records).filter(r => !r.deleted).map(({ id, dog, kind, data }) => ({ id, dog, kind, data }));
  shareFile(new Blob([JSON.stringify({ app: 'diario-cani', records: rs }, null, 1)], { type: 'application/json' }), `diario-cani-${today()}.json`);
}
async function importFile(file) {
  let rs;
  try { const j = JSON.parse(await file.text()); rs = Array.isArray(j) ? j : j.records; } catch { return toast('File non valido'); }
  rs = (rs || []).filter(r => r && KINDS[r.kind] && DOGS.some(d => d.id === r.dog) && r.data && (r.data.date || KINDS[r.kind].hidden));
  if (!rs.length) return toast('Nessuna voce da importare');
  const nuove = rs.filter(r => !r.id || !records[r.id] || records[r.id].deleted).length;
  if (!confirm(`Importare ${rs.length} voci (${nuove} nuove, ${rs.length - nuove} aggiornate)?`)) return;
  const now = Date.now();
  for (const r of rs) {
    const id = r.id || uuid(), old = records[id];
    // il profilo si completa senza cancellare quello che c'è già (foto, microchip…)
    const data = r.kind === 'profilo' && old ? { ...r.data, ...Object.fromEntries(Object.entries(old.data).filter(([, v]) => v !== '' && v != null)) } : r.data;
    records[id] = { id, dog: r.dog, kind: r.kind, data, deleted: !!r.deleted, updated: now }; pending.add(id);
  }
  persist(); render(); sync(); toast(`Importate ${rs.length} voci`);
}
$('#importFile').onchange = e => { const f = e.target.files[0]; e.target.value = ''; if (f) importFile(f); };

// ---------- render ----------
const TITLES = { home: () => 'Riepilogo', diario: () => 'Diario', stats: () => 'Statistiche', vet: () => 'Veterinario' };
function render() {
  if ($('#app').hidden) return;
  closeSwipe(true);
  $('#dogSeg').innerHTML = DOGS.map(d => `<button data-dog="${d.id}" class="${d.id === dog ? 'on' : ''}">${avatar(d.id, 26)}<span>${d.name}</span></button>`).join('');
  document.body.classList.toggle('zoe', dog === 'zoe');
  $('#title').textContent = tab === 'home' && !readonly ? greeting() : TITLES[tab]();
  $('#subtitle').textContent = tab === 'home' && !readonly ? subtitleText() : '';
  const live = liveRec();
  setTimeout(popTicked, 0);
  $('#view').innerHTML = (live ? liveHTML(live) : '') + { home: viewHome, diario: viewDiario, stats: viewStats, vet: viewVet }[tab]();
  $('#gear').hidden = readonly; $('#fab').hidden = readonly;
  loadDocThumbs($('#view'));
  document.querySelectorAll('#tabbar button').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
}

// ---------- scorri a sinistra per eliminare (come nell'app Note) ----------
const BTN_W = 96, FULL = .5;
let sw = null, openSw = null, justSwiped = 0;
function setX(el, x, anim) {
  const sc = el.querySelector('.sc'), del = el.querySelector('.sdel');
  sc.style.transition = del.style.transition = anim ? 'transform .25s ease, width .25s ease' : 'none';
  x = Math.min(0, x); sc.style.transform = `translateX(${x}px)`; del.style.width = `${-x}px`;
  el.classList.toggle('full', -x > el.offsetWidth * FULL);
}
function closeSwipe(noAnim) { if (openSw) setX(openSw, 0, !noAnim); openSw = null; }
const view = $('#view');
view.addEventListener('touchstart', e => {
  const el = e.target.closest('.item.swipe'); if (!el) return;
  if (openSw && openSw !== el) closeSwipe();
  const t = e.touches[0]; sw = { el, x0: t.clientX, y0: t.clientY, base: openSw === el ? -BTN_W : 0, dir: null, dx: 0 };
}, { passive: true });
view.addEventListener('touchmove', e => {
  if (!sw) return;
  const t = e.touches[0], dx = t.clientX - sw.x0, dy = t.clientY - sw.y0;
  if (!sw.dir && Math.abs(dx) + Math.abs(dy) > 8) sw.dir = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v';
  if (sw.dir !== 'h') return;
  e.preventDefault(); sw.dx = sw.base + dx; setX(sw.el, sw.dx);
}, { passive: false });
function endSwipe() {
  if (!sw || sw.dir !== 'h') { sw = null; return; }
  const { el, dx } = sw; sw = null; justSwiped = Date.now();
  if (-dx > el.offsetWidth * FULL) return removeWithUndo(el);
  if (-dx > BTN_W / 2) { setX(el, -BTN_W, true); openSw = el; } else { setX(el, 0, true); openSw = null; }
}
view.addEventListener('touchend', endSwipe); view.addEventListener('touchcancel', endSwipe);
function removeWithUndo(el) {
  const r = records[el.dataset.id]; if (!r) return;
  openSw = null;
  el.style.transition = 'height .25s ease, opacity .25s ease'; el.style.height = el.offsetHeight + 'px';
  requestAnimationFrame(() => { el.style.height = '0px'; el.style.opacity = '0'; });
  setTimeout(() => { r.deleted = true; save(r); }, 260);
  toast('Voce eliminata', { label: 'Annulla', fn: () => { r.deleted = false; save(r); } });
}

// ---------- modulo ----------
let editing = null;
function fieldHTML(f, d) {
  const v = d[f.k] ?? f.def ?? '';
  const lab = `<label>${esc(f.l)}</label>`;
  switch (f.t) {
    case 'date': case 'time': return lab + `<input type="${f.t}" name="${f.k}" value="${esc(v)}">`;
    case 'num': return lab + `<input type="number" inputmode="decimal" min="0" step="${f.step || 1}" name="${f.k}" value="${esc(v)}">`;
    case 'text': return lab + `<input type="text" name="${f.k}" value="${esc(v)}" placeholder="${esc(f.ph || '')}"${f.list ? ` list="dl-${f.list}"` : ''}>` + (f.list ? `<datalist id="dl-${f.list}">${suggestions(f.k).map(s => `<option value="${esc(s)}">`).join('')}</datalist>` : '');
    case 'area': return lab + `<textarea name="${f.k}">${esc(v)}</textarea>`;
    case 'select': return lab + `<select name="${f.k}"><option value=""></option>${f.o.map(o => `<option${o === v ? ' selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
    case 'chips': return lab + `<div class="chips">${f.o.map(o => `<label><input type="checkbox" name="${f.k}" value="${esc(o)}"${[].concat(v).includes(o) ? ' checked' : ''}><span>${esc(o)}</span></label>`).join('')}</div>`;
    case 'stars': return lab + `<div class="stars" data-k="${f.k}">${[1, 2, 3, 4, 5].map(i => `<button type="button" class="${+v === i ? 'on' : ''}" data-v="${i}">${i}</button>`).join('')}</div><div class="stars-l"><span>lieve</span><span>molto forte</span></div><input type="hidden" name="${f.k}" value="${esc(v)}">`;
    case 'dur': { const s = +d.durSec || 0; return lab + `<div class="two"><input type="number" inputmode="numeric" min="0" name="durMin" placeholder="minuti" value="${s ? Math.floor(s / 60) : ''}"><input type="number" inputmode="numeric" min="0" max="59" name="durS" placeholder="secondi" value="${s ? s % 60 : ''}"></div>`; }
    case 'docs': return lab + `<div class="docs" data-docs>${[].concat(v || []).map(docThumb).join('')}<label class="doc-add">＋<input type="file" accept="image/*" multiple data-docfile hidden></label></div><input type="hidden" name="${f.k}" value="${esc(JSON.stringify([].concat(v || [])))}">`;
    case 'photo': return `<div class="photo-pick"><label class="ph">${v ? `<img src="${esc(v)}" alt="">` : '<b>📷</b>'}<input type="file" accept="image/*" data-photo hidden></label><span class="muted small">Tocca per scegliere una foto</span><input type="hidden" name="${f.k}" value="${esc(v)}"></div>`;
  }
}
function suggestions(k) { return [...new Set(Object.values(records).filter(r => !r.deleted).map(r => r.data[k]).filter(Boolean))].slice(0, 30); }
// rimpicciolisce la foto (quadrata, 320px) per salvarla leggera
function shrinkPhoto(file) {
  return new Promise((ok, ko) => {
    const img = new Image(); img.onerror = ko;
    img.onload = () => {
      const s = Math.min(img.width, img.height), c = document.createElement('canvas'); c.width = c.height = 320;
      c.getContext('2d').drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, 320, 320);
      URL.revokeObjectURL(img.src); ok(c.toDataURL('image/jpeg', .82));
    };
    img.src = URL.createObjectURL(file);
  });
}
function openForm(kind, rec) {
  editing = rec ? structuredClone(rec) : { id: uuid(), dog, kind, data: { date: today(), time: KINDS[kind].fields.some(f => f.k === 'time') ? nowTime() : undefined } };
  const k = KINDS[kind];
  $('#fTitle').innerHTML = `<span class="ic" style="--c:${COLORS[kind]}">${k.ic}</span> ${esc(kind === 'profilo' ? 'Profilo di ' + curDog().name : k.name)}`;
  $('#fBody').innerHTML = k.fields.map(f => fieldHTML(f, editing.data)).join('');
  $('#fDel').hidden = !rec || kind === 'profilo' || !records[rec.id];
  $('#form').showModal();
  loadDocThumbs($('#fBody'));
}
$('#fBody').addEventListener('click', e => {
  const b = e.target.closest('.stars button'); if (!b) return;
  const wrap = b.parentElement, inp = wrap.parentElement.querySelector(`input[name="${wrap.dataset.k}"]`), v = b.dataset.v === inp.value ? '' : b.dataset.v;
  inp.value = v; wrap.querySelectorAll('button').forEach(x => x.classList.toggle('on', x.dataset.v === v));
});
$('#fBody').addEventListener('change', async e => {
  if (!e.target.matches('[data-photo]') || !e.target.files[0]) return;
  try {
    const url = await shrinkPhoto(e.target.files[0]), box = e.target.closest('.photo-pick');
    box.querySelector('input[type=hidden]').value = url; box.querySelector('.ph').firstElementChild.outerHTML = `<img src="${url}" alt="">`;
  } catch { toast('Foto non leggibile'); }
});
$('#frm').addEventListener('submit', e => {
  e.preventDefault();
  const fd = new FormData(e.target), data = {};
  for (const f of KINDS[editing.kind].fields) {
    if (f.t === 'dur') { const s = (+fd.get('durMin') || 0) * 60 + (+fd.get('durS') || 0); if (s) data.durSec = s; continue; }
    if (f.t === 'chips') { const a = fd.getAll(f.k); if (a.length) data[f.k] = a; continue; }
    if (f.t === 'docs') { const a = JSON.parse(fd.get(f.k) || '[]'); if (a.length) data[f.k] = a; continue; }
    const v = (fd.get(f.k) || '').trim();
    if (v) data[f.k] = f.t === 'num' || f.t === 'stars' ? +v : v;
  }
  for (const k of ['live', 'startTs', 'fine']) if (editing.data[k] != null && editing.kind === 'crisi') data[k] = editing.data[k];
  if (KINDS[editing.kind].hidden || KINDS[editing.kind].nodate) data.date ||= editing.data.date || today();
  if (!data.date) return toast('Inserisci il giorno');
  editing.data = data; save(editing); $('#form').close(); toast('Salvato ✓');
});
$('#fDel').onclick = () => {
  const r = editing; $('#form').close(); r.deleted = true; save(r);
  toast('Voce eliminata', { label: 'Annulla', fn: () => { r.deleted = false; save(r); } });
};
document.querySelectorAll('[data-close]').forEach(b => b.onclick = () => b.closest('dialog').close());
document.querySelectorAll('dialog').forEach(d => d.addEventListener('click', e => { if (e.target === d) d.close(); }));

// ---------- eventi ----------
$('#fab').onclick = () => {
  $('#pickList').innerHTML = `<button class="voice-btn" data-voice><span class="ic" style="--c:#7b61ff">🎙️</span><div><b>Detta a voce</b><small>Parla e l'app smista tutto da sola</small></div></button>` + kindsFor(curDog()).map(([id, k]) => `<button data-kind="${id}" style="--c:${COLORS[id]}"><span class="ic">${k.ic}</span>${k.name}</button>`).join('');
  $('#pickTitle').innerHTML = `${avatar(dog, 28)} Cosa segni per ${esc(curDog().name)}?`;
  $('#pick').showModal();
};
$('#pickList').addEventListener('click', e => { if (e.target.closest('[data-voice]')) { $('#pick').close(); return Voice.open(); } const b = e.target.closest('[data-kind]'); if (!b) return; $('#pick').close(); openForm(b.dataset.kind); });
$('#dogSeg').addEventListener('click', e => { const b = e.target.closest('[data-dog]'); if (!b || b.dataset.dog === dog) return; dog = b.dataset.dog; LS.set('cani.dog', dog); filter = ''; render(); });
$('#tabbar').addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (!b) return; tab = b.dataset.tab; render(); scrollTo(0, 0); });
view.addEventListener('click', e => {
  if (Date.now() - justSwiped < 400) return;
  if (e.target.closest('[data-fold]') && !e.target.closest('button')) return;
  if (e.target.closest('[data-clearq]')) { query = ''; return render(); }
  const lv = e.target.closest('[data-live]'); if (lv) return liveAction(lv.dataset.live);
  const pl = e.target.closest('[data-pill]'); if (pl) return e.target.closest('[data-skip]') ? skipPill(pl.dataset.pill, pl.dataset.day) : togglePill(pl.dataset.pill, pl.dataset.day);
  if (e.target.closest('[data-prog]')) return openForm('programma', records[progId(dog)] || { id: progId(dog), dog, kind: 'programma', data: {} });
  if (e.target.closest('[data-ics]')) return e.target.closest('[data-ics]').dataset.ics === 'pills' ? icsPills() : icsUpcoming();
  if (readonly && !e.target.closest('[data-filter],[data-range],[data-goto],#pdf,#csv')) return;
  if (e.target.closest('.sdel')) return removeWithUndo(e.target.closest('.item'));
  if (openSw) return closeSwipe();
  if (e.target.closest('[data-profile]')) return openForm('profilo', records[profileId(dog)] || { id: profileId(dog), dog, kind: 'profilo', data: {} });
  const it = e.target.closest('[data-id]'); if (it) { const r = records[it.dataset.id]; return r && openForm(r.kind, r); }
  const g = e.target.closest('[data-goto]'); if (g) { tab = g.dataset.goto; render(); return scrollTo(0, 0); }
  const f = e.target.closest('[data-filter]'); if (f) { filter = f.dataset.filter; return render(); }
  const rg = e.target.closest('[data-range]'); if (rg) { range = +rg.dataset.range; return render(); }
  const id = e.target.closest('button')?.id;
  if (id === 'pdf') return exportPDF();
  if (id === 'csv') return exportCSV();
});
addEventListener('scroll', () => document.body.classList.toggle('scrolled', scrollY > 8), { passive: true });
const APP_V = (document.querySelector('script[src^="app.js"]')?.src.match(/v=(\d+)/) || [])[1];
async function checkUpdate() {
  try {
    const html = await (await fetch('./?u=' + Date.now(), { cache: 'no-store' })).text(), v = (html.match(/app\.js\?v=(\d+)/) || [])[1];
    if (APP_V && v && v !== APP_V && !liveRec() && !document.querySelector('dialog[open]')) location.reload();
  } catch {}
}
checkUpdate();
document.addEventListener('visibilitychange', () => { if (!document.hidden) checkUpdate(); });
addEventListener('online', sync);
document.addEventListener('visibilitychange', () => { if (!document.hidden) sync(); });

// ---------- crisi in corso: cronometro ----------
const LIVE_MAX = 3 * 3600e3;
const liveRec = () => Object.values(records).find(r => !r.deleted && r.kind === 'crisi' && r.data.live && Date.now() - r.data.startTs < LIVE_MAX);
const clock = ms => { const s = Math.max(0, Math.floor(ms / 1000)); return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`; };
function liveHTML(r) {
  const d = r.data, q = +d.quante || 1, name = DOGS.find(x => x.id === r.dog).name;
  return `<div class="glass live" data-start="${d.startTs}">
    <div class="live-h"><span class="pulse"></span>Crisi in corso · ${esc(name)}</div>
    <div class="timer" id="liveTimer">${clock(Date.now() - d.startTs)}</div>
    <small>iniziata alle ${esc(d.time)}${q > 1 ? ` · ${q} crisi` : ''}${d.emergenza ? ` · ${esc(d.emergenza)}` : ''}</small>
    <button class="btn stop" data-live="stop">■ Fine crisi</button>
    <div class="live-row"><button data-live="plus">＋1 crisi</button><button data-live="ziepam">💊 Ziepam dato</button><button data-live="video" class="${d.video ? 'on' : ''}">📹 Video</button></div>
    <button class="link" data-live="cancel">Avviata per sbaglio? Annulla</button>
  </div>`;
}
let wake = null;
async function keepAwake(on) {
  try { if (on && !wake && navigator.wakeLock) { wake = await navigator.wakeLock.request('screen'); wake.addEventListener('release', () => wake = null); } else if (!on && wake) { await wake.release(); wake = null; } } catch {}
}
setInterval(() => {
  const el = $('#liveTimer'); if (!el) return;
  el.textContent = clock(Date.now() - +el.closest('.live').dataset.start);
}, 500);
function liveAction(a) {
  let r = liveRec();
  if (a === 'start') {
    if (r) return;
    r = { id: uuid(), dog, kind: 'crisi', data: { date: today(), time: nowTime(), quante: 1, live: true, startTs: Date.now() } };
    save(r); keepAwake(true); scrollTo(0, 0); navigator.vibrate?.(60);
    return;
  }
  if (!r) return;
  if (a === 'plus') { r.data.quante = (+r.data.quante || 1) + 1; r.data.note = [r.data.note, `${r.data.quante}ª crisi alle ${nowTime()}`].filter(Boolean).join('. '); save(r); return toast(`${r.data.quante} crisi in questo episodio`); }
  if (a === 'ziepam') { r.data.emergenza = [r.data.emergenza, `Ziepam alle ${nowTime()}`].filter(Boolean).join(', '); save(r); return toast('Segnato: Ziepam alle ' + nowTime()); }
  if (a === 'video') { r.data.video = r.data.video ? undefined : 'Sì, nella galleria'; save(r); return toast(r.data.video ? 'Segnato: c\'è un video' : 'Video tolto'); }
  if (a === 'cancel') { if (!confirm('Annullare questa crisi?')) return; r.deleted = true; save(r); keepAwake(false); return; }
  if (a === 'stop') {
    r.data.durSec = r.data.durSec || Math.max(1, Math.round((Date.now() - r.data.startTs) / 1000));
    delete r.data.live; save(r); keepAwake(false);
    openForm('crisi', r); toast(`Durata ${fmtDur(r.data.durSec)}: completa i dettagli`);
  }
}

// ---------- pastiglie ----------
const progId = d => '00000000-0000-4000-8000-' + (d === 'kafka' ? '00000000001a' : '00000000001b');
const isoOf = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const dayAdd = (iso, n) => { const d = toDate(iso); d.setDate(d.getDate() + n); return isoOf(d); };
// orari scritti liberamente: "08:00 e 20:00", "alle 8 e alle 20"
const timesIn = s => [...new Set([...String(s || '').matchAll(/(\d{1,2})(?:[:.](\d{2}))?/g)].map(m => +m[1] < 24 ? `${pad(+m[1])}:${m[2] || '00'}` : null).filter(Boolean))].sort();
const doseLabel = x => [x.farmaco, x.dose && `${x.dose}${x.unita && x.unita !== 'compresse' ? ' ' + x.unita : x.dose === '1' ? ' compressa' : x.unita === 'compresse' ? ' cpr' : ''}`].filter(Boolean).join(' ');
function programSlots(d) {
  return (records[progId(d)]?.deleted ? '' : records[progId(d)]?.data.slots || '').split('\n').map(l => l.trim().match(/^(\d{1,2})[:.](\d{2})\s+(.+)$/)).filter(Boolean)
    .map(m => ({ t: `${pad(+m[1])}:${m[2]}`, what: m[3] }));
}
// dosi di un giorno: orari fissi + terapie con orari precisi (es. antibiotico per una settimana, cortisone a scalare)
function slotsFor(d, day) {
  const latest = {};
  for (const r of list(d, 'terapia').slice().reverse()) if (r.data.date <= day) latest[drugKey(r.data.farmaco)] = r;
  const out = programSlots(d);
  for (const r of Object.values(latest)) {
    const x = r.data;
    if (x.sospeso === 'Sospeso' || (x.fine && day > x.fine)) continue;
    for (const t of timesIn(x.orari)) {
      if (day === x.date && x.primaOra && t < x.primaOra) continue;
      if (day === x.fine && x.ultimaOra && t > x.ultimaOra) continue;
      out.push({ t, what: doseLabel(x), ther: r.id, c: courseColor(d, r.id) });
    }
  }
  // modifiche valide solo per quel giorno (orario o quantità diversi)
  const mods = list(d, 'dosemod').filter(r => r.data.date === day);
  const res = out.map(s => { const m = mods.find(r => r.data.slot === `${s.t} ${s.what}`); return m ? { ...s, t: m.data.t || s.t, what: m.data.what || s.what, orig: `${s.t} ${s.what}`, mod: m.id } : s; });
  return res.sort((a, b) => a.t.localeCompare(b.t));
}
const slotKey = s => `${s.t} ${s.what}`;
const PHASE = ['#3b82f6', '#f59e0b', '#22c55e', '#ef4444', '#a855f7', '#06b6d4', '#ec4899', '#84cc16', '#f97316'];
function courses(d) {
  return list(d, 'terapia').filter(r => r.data.fine && timesIn(r.data.orari).length)
    .sort((a, b) => (a.data.farmaco || '').localeCompare(b.data.farmaco || '') || a.data.date.localeCompare(b.data.date));
}
const courseColor = (d, id) => { const i = courses(d).findIndex(r => r.id === id); return i < 0 ? '' : PHASE[i % PHASE.length]; };
const dc = s => s.c ? ` style="--dc:${s.c}"` : '';
const dosesOn = (d, date) => list(d, 'dose').filter(r => r.data.date === date);
function pillsCard() {
  const t = today(), sl = slotsFor(dog, t);
  if (!sl.length) return curDog().epi && !records[progId(dog)] ? `<button class="glass card setup" data-prog><span class="ic" style="--c:${COLORS.terapia}">⏰</span><div><b>Imposta gli orari delle pastiglie</b><small>Per spuntarle ogni giorno e non saltarne nessuna</small></div></button>` : '';
  const taken = dosesOn(dog, t), now = nowTime();
  const done = sl.filter(s => taken.some(r => r.data.slot === slotKey(s))).length;
  return section('Pastiglie di oggi', `<div class="glass list pills">${sl.map(s => {
    const r = taken.find(x => x.data.slot === slotKey(s)), sk = r?.data.skip, late = !r && s.t < now;
    return `<div class="pill-row${sk ? ' skip' : r ? ' ok' : late ? ' late' : ''}${s.c ? ' col' : ''}${s.mod ? ' mod' : ''}"${dc(s)} data-pill="${esc(slotKey(s))}" data-orig="${esc(s.orig || slotKey(s))}" data-day="${t}"><span class="chk">${sk ? '–' : r ? '✓' : ''}</span>
      <span class="pt">${s.t}</span><span class="pw">${esc(s.what)}</span><small>${sk ? 'non data' : r ? 'data alle ' + esc(r.data.time) : late ? 'da dare' : ''}</small>${r ? '' : `<button class="skipb" data-skip title="Non va data / saltata">✕</button>`}</div>`;
  }).join('')}</div><div class="pills-f"><button class="link" data-prog>Orari fissi</button><button class="link" data-ics="pills">📅 Promemoria nel Calendario</button></div>`, `<span class="count ok">${done}/${sl.length}</span>`) + agendaCard();
}
// calendario delle terapie a tempo: un giorno per riga, con le dosi da spuntare
function courseRange(d) {
  const cs = list(d, 'terapia').filter(r => r.data.fine && timesIn(r.data.orari).length && r.data.fine >= dayAdd(today(), -3) && r.data.sospeso !== 'Sospeso');
  if (!cs.length) return null;
  return { from: cs.reduce((m, r) => r.data.date < m ? r.data.date : m, '9999'), to: cs.reduce((m, r) => r.data.fine > m ? r.data.fine : m, '0000') };
}
function agendaCard() {
  const rg = courseRange(dog); if (!rg) return '';
  const t = today(), days = [];
  for (let d = rg.from < dayAdd(t, -3) ? dayAdd(t, -3) : rg.from; d <= rg.to && days.length < 31; d = dayAdd(d, 1)) days.push(d);
  const leg = courses(dog).filter(r => r.data.fine >= rg.from && r.data.date <= rg.to).map(r => `<span><i style="background:${courseColor(dog, r.id)}"></i>${esc(doseLabel(r.data))} · ${esc(fmtDate(r.data.date).replace(/ \d{4}$/, ''))}–${esc(fmtDate(r.data.fine).replace(/ \d{4}$/, ''))}</span>`).join('');
  return section('Calendario terapie', `<div class="glass agenda">${days.map(day => {
    const sl = slotsFor(dog, day), taken = dosesOn(dog, day), dt = toDate(day);
    return `<div class="ag-day${day === t ? ' today' : ''}${day < t ? ' past' : ''}"><div class="ag-d"><b>${dt.getDate()}</b><small>${dt.toLocaleDateString('it-IT', { weekday: 'short' }).replace('.', '')}</small></div>
      <div class="ag-l">${sl.map(s => { const r = taken.find(x => x.data.slot === slotKey(s)), sk = r?.data.skip, ok = r && !sk, miss = !r && (day < t || (day === t && s.t < nowTime()));
        return `<div class="ag-dose${sk ? ' skip' : ok ? ' ok' : miss ? ' miss' : ''}${s.c ? ' col' : ''}${s.mod ? ' mod' : ''}"${dc(s)} data-pill="${esc(slotKey(s))}" data-orig="${esc(s.orig || slotKey(s))}" data-day="${day}"><span>${sk ? '–' : ok ? '✓' : miss ? '!' : '○'}</span><em>${s.t} ${esc(s.what)}</em>${r ? '' : `<button class="skipb" data-skip title="Non va data / saltata">✕</button>`}</div>`; }).join('') || '<small class="muted">—</small>'}</div></div>`;
  }).join('')}</div><div class="legend phase">${leg}</div><p class="hint small">Tieni premuta una dose per cambiarne orario o quantità solo per quel giorno</p>`, `<span class="count">fino al ${esc(fmtDate(rg.to).replace(/ \d{4}$/, ""))}</span>`);
}
function skipPill(key, day = today()) {
  const r = { id: uuid(), dog, kind: 'dose', data: { date: day, time: nowTime(), slot: key, skip: true } };
  save(r); toast('Segnata come non data', { label: 'Annulla', fn: () => { r.deleted = true; save(r); } });
}
function togglePill(key, day = today()) {
  const r = dosesOn(dog, day).find(x => x.data.slot === key);
  if (r) { r.deleted = true; save(r); return toast('Tolta la spunta', { label: 'Annulla', fn: () => { r.deleted = false; save(r); } }); }
  justTicked = { key, day };
  save({ id: uuid(), dog, kind: 'dose', data: { date: day, time: day === today() ? nowTime() : key.slice(0, 5), slot: key } }); navigator.vibrate?.([20, 40, 30]);
}
function adherence(d, days = 30) {
  const t = today(); let expected = 0, got = 0, first = null;
  for (let i = days - 1; i >= 0; i--) {
    const day = dayAdd(t, -i), sl = slotsFor(d, day).filter(s => day < t || s.t <= nowTime());
    if (!sl.length) continue; first ||= day;
    const recs = dosesOn(d, day), skipped = new Set(recs.filter(r => r.data.skip).map(r => r.data.slot)), taken = new Set(recs.filter(r => !r.data.skip).map(r => r.data.slot));
    const due = sl.filter(s => !skipped.has(slotKey(s)));
    expected += due.length; got += due.filter(s => taken.has(slotKey(s))).length;
  }
  if (!expected) return null;
  return { pct: Math.round(got / expected * 100), missed: expected - got, days: daysBetween(toDate(first), toDate(t)) + 1 };
}
function adherenceText(d) {
  const a = adherence(d); if (!a) return '';
  return `Pastiglie segnate negli ultimi ${plural(a.days, 'giorno', 'giorni')}: <b>${a.pct}%</b>${a.missed ? ` (${plural(a.missed, 'dose non segnata', 'dosi non segnate')})` : ''}.`;
}

// ---------- promemoria nel Calendario (.ics) ----------
function icsFile(events, name) {
  const st = d => d.replace(/[-:]/g, ''), now = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Diario Cani//IT', 'CALSCALE:GREGORIAN'];
  for (const e of events) lines.push('BEGIN:VEVENT', `UID:${uuid()}@diario-cani`, `DTSTAMP:${now}`, `DTSTART:${st(e.start)}`, `DTEND:${st(e.end || e.start)}`,
    ...(e.daily ? ['RRULE:FREQ=DAILY'] : e.rrule ? [e.rrule] : []), `SUMMARY:${e.title.replace(/[,;]/g, ' ')}`, 'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${e.title.replace(/[,;]/g, ' ')}`, `TRIGGER:${e.alarm || 'PT0M'}`, 'END:VALARM', 'END:VEVENT');
  lines.push('END:VCALENDAR');
  const a = document.createElement('a'); a.href = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(lines.join('\r\n')); a.download = name; a.click();
}
function icsPills() {
  const t = today(), name = curDog().name, ev = programSlots(dog).map(s => ({ start: `${t}T${s.t}:00`, daily: true, title: `💊 ${name}: ${s.what}` }));
  const rg = courseRange(dog), now = nowTime();
  if (rg) for (let d = t; d <= rg.to; d = dayAdd(d, 1)) for (const s of slotsFor(dog, d)) if (s.ther && (d > t || s.t >= now)) ev.push({ start: `${d}T${s.t}:00`, title: `💊 ${name}: ${s.what}` });
  if (!ev.length) return toast('Nessuna pastiglia da ricordare');
  icsFile(ev, `pastiglie-${dog}.ics`);
}
function icsUpcoming() {
  const name = curDog().name, FREQ = { giorni: 'DAILY', settimane: 'WEEKLY', mesi: 'MONTHLY', anni: 'YEARLY' };
  icsFile(upcoming(dog).map(({ r, due }) => ({ start: `${due < today() ? today() : due}T09:00:00`, end: `${due < today() ? today() : due}T09:30:00`, title: `${KINDS[r.kind].ic} ${name}: ${titleOf(r)}`, alarm: r.kind === 'ricorrenza' ? 'PT0M' : '-P1D',
    rrule: r.kind === 'ricorrenza' ? `RRULE:FREQ=${FREQ[r.data.unita || 'mesi']};INTERVAL=${+r.data.ogni || 1}` : '' })), `scadenze-${dog}.ics`);
}

// ---------- grafici: linee, livelli nel sangue, crisi con ogni terapia ----------
function lineChart(pts, color, unit = '') {
  if (pts.length < 2) return '';
  const W = 340, H = 150, pl = 34, pr = 10, pt = 14, pb = 24;
  const ys = pts.map(p => p.y), min = Math.min(...ys), max = Math.max(...ys), pad_ = (max - min) * .15 || 1, lo = min - pad_, hi = max + pad_;
  const x0 = +pts[0].x, x1 = +pts[pts.length - 1].x || x0 + 1;
  const X = p => pl + (W - pl - pr) * ((+p.x - x0) / ((x1 - x0) || 1)), Y = p => pt + (H - pt - pb) * (1 - (p.y - lo) / (hi - lo));
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img">`;
  [lo + pad_, (lo + hi) / 2, hi - pad_].forEach(v => { const y = pt + (H - pt - pb) * (1 - (v - lo) / (hi - lo)); s += `<line x1="${pl}" x2="${W - pr}" y1="${y}" y2="${y}" stroke="currentColor" stroke-opacity=".08"/><text x="${pl - 6}" y="${y + 3}" text-anchor="end">${fmtNum(v)}</text>`; });
  s += `<polyline fill="none" stroke="${color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" points="${pts.map(p => `${X(p)},${Y(p)}`).join(' ')}"/>`;
  pts.forEach((p, i) => { s += `<circle cx="${X(p)}" cy="${Y(p)}" r="4" fill="${color}" stroke="var(--bg)" stroke-width="2"><title>${esc(p.l)}: ${fmtNum(p.y)}${unit}</title></circle>`; if (i === 0 || i === pts.length - 1) s += `<text x="${X(p)}" y="${H - 7}" text-anchor="${i ? 'end' : 'start'}">${esc(p.l)}</text>`; });
  return s + '</svg>';
}
function levelsCards() {
  const groups = {};
  for (const r of list(dog, 'analisi').slice().reverse()) {
    const v = parseFloat(String(r.data.valore || '').replace(',', '.'));
    if (/fenobarb|bromuro/i.test(r.data.tipo || '') && !isNaN(v)) (groups[r.data.tipo] ||= []).push({ x: toDate(r.data.date), y: v, l: fmtDate(r.data.date) });
  }
  return Object.entries(groups).filter(([, p]) => p.length > 1).map(([t, p]) => chartCard(esc(t), 'Valori delle analisi nel tempo', lineChart(p, COLORS.analisi))).join('');
}
// periodi tra un cambio di terapia e l'altro, con quante crisi al mese in ciascuno
function therapyPeriods(d) {
  const ther = list(d, 'terapia').slice().reverse(), crisi = list(d, 'crisi');
  const dates = [...new Set(ther.map(r => r.data.date))].sort();
  return dates.map((from, i) => {
    const to = dates[i + 1], active = {};
    for (const r of ther) if (r.data.date <= from) active[drugKey(r.data.farmaco)] = r;
    const label = Object.values(active).filter(r => r.data.sospeso !== 'Sospeso').map(r => `${r.data.farmaco.split(' (')[0]}${r.data.dose ? ' ' + r.data.dose : ''}${r.data.freq && r.data.freq !== 'Altro' ? ' ×' + (parseInt(r.data.freq) || '') : ''}`).join(' + ') || 'Nessuna terapia';
    const n = crisi.filter(r => r.data.date >= from && (!to || r.data.date < to)).reduce((s, r) => s + (+r.data.quante || 1), 0);
    const days = Math.max(1, daysBetween(toDate(from), to ? toDate(to) : new Date()));
    return { from, to, label, n, days, rate: n / (days / 30.44) };
  }).reverse();
}
function therapyPeriodsCard() {
  const ps = therapyPeriods(dog); if (!ps.length) return '';
  const max = Math.max(...ps.map(p => p.rate), .1);
  return `<div class="glass card"><div class="card-h"><h2>Crisi con ogni terapia</h2><small>Crisi al mese in ogni periodo tra due cambi di terapia</small></div>${ps.map(p => `<div class="tp${p.days < 14 ? ' short' : ''}">
    <div class="tp-h"><span>${esc(fmtDate(p.from))} → ${p.to ? esc(fmtDate(p.to)) : 'oggi'}</span><b>${fmtNum(p.rate)}<small>/mese</small></b></div>
    <div class="tp-l">${esc(p.label)}</div>
    <i><i style="width:${p.rate / max * 100}%"></i></i><small>${plural(p.n, 'crisi', 'crisi')} in ${plural(p.days, 'giorno', 'giorni')}${p.days < 14 ? ' · periodo breve, poco indicativo' : ''}</small></div>`).join('')}</div>`;
}

// ---------- foto di referti e documenti ----------
const docThumb = path => `<button type="button" class="doc" data-doc="${esc(path)}"><img alt=""><span data-rmdoc title="Togli">✕</span></button>`;
const docUrls = {};
async function loadDocThumbs(root) {
  if (!sb || !user) return;
  for (const b of root.querySelectorAll('[data-doc]')) {
    const p = b.dataset.doc;
    if (!docUrls[p]) { const { data } = await sb.storage.from('documenti').createSignedUrl(p, 3600).catch(() => ({})); if (data) docUrls[p] = data.signedUrl; }
    if (docUrls[p]) b.querySelector('img').src = docUrls[p];
  }
}
function shrinkImage(file, max = 1600) {
  return new Promise((ok, ko) => {
    const img = new Image(); img.onerror = ko;
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement('canvas');
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(img.src); c.toBlob(b => b ? ok(b) : ko(), 'image/jpeg', .82);
    };
    img.src = URL.createObjectURL(file);
  });
}
$('#fBody').addEventListener('change', async e => {
  if (!e.target.matches('[data-docfile]')) return;
  if (!sb || !user) return toast('Serve l\'accesso con account');
  const box = e.target.closest('[data-docs]'), inp = box.nextElementSibling, list_ = JSON.parse(inp.value || '[]');
  toast('Carico le foto…');
  for (const f of e.target.files) {
    try {
      const path = `${ownerId || user.id}/${uuid()}.jpg`, blob = await shrinkImage(f);
      const { error } = await sb.storage.from('documenti').upload(path, blob, { contentType: 'image/jpeg' });
      if (error) throw error;
      list_.push(path); box.querySelector('.doc-add').insertAdjacentHTML('beforebegin', docThumb(path));
    } catch (err) { console.warn(err); toast('Foto non caricata: controlla la connessione'); }
  }
  inp.value = JSON.stringify(list_); e.target.value = ''; loadDocThumbs(box); toast('Foto aggiunte ✓');
});
$('#fBody').addEventListener('click', e => {
  const d = e.target.closest('[data-doc]'); if (!d) return;
  e.preventDefault();
  if (e.target.closest('[data-rmdoc]')) {
    const inp = d.closest('[data-docs]').nextElementSibling;
    inp.value = JSON.stringify(JSON.parse(inp.value).filter(p => p !== d.dataset.doc)); d.remove(); return;
  }
  if (docUrls[d.dataset.doc]) window.open(docUrls[d.dataset.doc], '_blank');
});

// ---------- impostazioni: famiglia, veterinario, schermata di blocco ----------
const token = (n, abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789') => [...crypto.getRandomValues(new Uint8Array(n))].map(b => abc[b % abc.length]).join('');
const appUrl = () => location.origin + location.pathname;
let links = [], members = [];
async function loadSettings() {
  if (!sb || !user) return;
  const [l, m] = await Promise.all([sb.from('pet_links').select('*'), sb.from('pet_members').select('*').eq('owner', user.id)]);
  links = l.data || []; members = m.data || [];
}
const linkOf = scope => links.find(l => l.scope === scope);
const copyBtn = (v, label = 'Copia') => `<button class="copy" data-copy="${esc(v)}">${label}</button>`;
function settingsHTML() {
  if (!sb || !user) return `<div class="set-sec"><h3>🎨 Aspetto</h3><div class="seg3">${[['auto', 'Automatico'], ['light', 'Chiaro'], ['dark', 'Scuro']].map(([v, l]) => `<button class="${LS.get('cani.theme', 'auto') === v ? 'on' : ''}" data-set="theme:${v}">${l}</button>`).join('')}</div></div><p class="muted">Le altre impostazioni richiedono l'accesso con account.</p>`;
  const isMember = ownerId && ownerId !== user.id, inv = linkOf('invito'), vet = linkOf('vet'), rap = linkOf('rapida');
  const vetUrl = vet && `${appUrl()}?vet=${vet.token}`;
  let h = `<div class="set-sec"><h3>👤 Account</h3><p>${esc(user.email)}</p>${isMember ? '<p class="muted small">Stai vedendo i cani della famiglia che ti ha invitato.</p>' : ''}</div>`;
  if (!isMember) {
    h += `<div class="set-sec"><h3>⚡ Crisi dalla schermata di blocco</h3>
      ${rap ? `<p class="small">Crea un <b>Comando rapido</b> sull'iPhone. Premuto la 1ª volta avvia la crisi di Kafka, la 2ª volta la chiude e salva la durata, anche a telefono bloccato.</p>
      <ol class="steps">
        <li>Apri l'app <b>Comandi</b> → <b>＋</b> → chiamalo <b>Crisi Kafka</b>.</li>
        <li>Aggiungi l'azione <b>Ottieni contenuto dell'URL</b> e incolla l'indirizzo:<code>${esc(C.supabaseUrl)}/rest/v1/rpc/crisi_rapida</code>${copyBtn(C.supabaseUrl + '/rest/v1/rpc/crisi_rapida')}</li>
        <li>Tocca <b>›</b> per aprire le opzioni: <b>Metodo</b> = POST.</li>
        <li><b>Intestazioni</b>: aggiungi <b>apikey</b> con questo valore:<code>${esc(C.supabaseKey)}</code>${copyBtn(C.supabaseKey)}</li>
        <li><b>Corpo richiesta</b> = JSON → aggiungi un campo <b>Testo</b> chiamato <b>t</b> con il valore:<code>${esc(rap.token)}</code>${copyBtn(rap.token)}</li>
        <li>Aggiungi l'azione <b>Mostra notifica</b> e scegli <b>Contenuto dell'URL</b>.</li>
        <li>Schermata di blocco: tienila premuta → <b>Personalizza</b> → <b>Schermata di blocco</b> → tocca <b>–</b> sulla torcia → <b>＋</b> → <b>Comandi rapidi</b> → <b>Crisi Kafka</b>. Lascia la fotocamera dall'altro lato per filmare.</li>
      </ol>
      <p class="muted small">Prova: premi, aspetta qualche secondo, premi di nuovo. In Diario troverai la crisi con la durata (poi eliminala).</p>
      <button class="link danger" data-set="del:rapida">Disattiva il comando (crea un nuovo codice)</button>`
      : `<p class="small">Un pulsante sulla schermata di blocco per far partire il cronometro senza sbloccare il telefono.</p><button class="btn primary" data-set="new:rapida">Configura</button>`}</div>`;
    h += `<div class="set-sec"><h3>🩺 Link per il veterinario</h3>
      ${vet ? `<p class="small">Chi ha questo link vede il report aggiornato in sola lettura, senza account.</p><code>${esc(vetUrl)}</code>
      <div class="row"><button class="btn" data-share="${esc(vetUrl)}">Condividi</button>${copyBtn(vetUrl, 'Copia')}</div><button class="link danger" data-set="del:vet">Disattiva il link</button>`
      : `<p class="small">Un link privato al report sempre aggiornato, da mandare al veterinario.</p><button class="btn primary" data-set="new:vet">Crea il link</button>`}</div>`;
    const msg = inv && `Ciao! Per vedere e segnare i dati di Kafka e Zoe: apri ${appUrl()} , crea un account, poi tocca ⚙️ → "Unisciti alla famiglia" e inserisci il codice ${inv.token}`;
    h += `<div class="set-sec"><h3>👨‍👩‍👧 Famiglia</h3>
      <p class="small">Chi inviti può vedere e segnare tutto, anche da Android o dal computer.</p>
      ${members.map(m => `<div class="kv"><span>${esc(m.member_email || 'Familiare')}</span><button class="link danger" data-set="rm:${m.member}">Togli</button></div>`).join('')}
      ${inv ? `<div class="code">${esc(inv.token)}</div><div class="row"><button class="btn" data-share="${esc(msg)}">Invia l'invito</button><button class="btn" data-set="del:invito">Nuovo codice</button></div>`
      : `<button class="btn primary" data-set="new:invito">Crea un codice invito</button>`}</div>`;
  }
  h += `<div class="set-sec"><h3>🔑 Unisciti alla famiglia</h3><p class="small">Hai ricevuto un codice? Inseriscilo per vedere i cani di chi ti ha invitato.</p>
    <div class="row"><input id="joinCode" placeholder="Codice" autocapitalize="characters"><button class="btn" data-set="join">Entra</button></div></div>`;
  const th = LS.get('cani.theme', 'auto');
  h += `<div class="set-sec"><h3>🎨 Aspetto</h3><div class="seg3">${[['auto', 'Automatico'], ['light', 'Chiaro'], ['dark', 'Scuro']].map(([v, l]) => `<button class="${th === v ? 'on' : ''}" data-set="theme:${v}">${l}</button>`).join('')}</div></div>`;
  h += `<div class="set-sec"><h3>💾 Dati</h3><p class="small muted">Il backup salva tutto in un file. Con Importa puoi ricaricarlo o aggiungere voci.</p>
    <div class="row"><button class="btn" data-set="backup">Backup</button><button class="btn" data-set="import">Importa</button></div></div>
    <button class="btn danger" data-set="logout">Esci</button>`;
  return h;
}
async function openSettings() { $('#setBody').innerHTML = '<p class="muted">Carico…</p>'; $('#settings').showModal(); await loadSettings().catch(() => {}); $('#setBody').innerHTML = settingsHTML(); }
$('#gear').onclick = openSettings;
$('#setBody').addEventListener('click', async e => {
  const c = e.target.closest('[data-copy]'); if (c) { await navigator.clipboard?.writeText(c.dataset.copy).catch(() => {}); return toast('Copiato ✓'); }
  const sh = e.target.closest('[data-share]'); if (sh) { const t = sh.dataset.share; return navigator.share ? navigator.share({ text: t }).catch(() => {}) : (navigator.clipboard?.writeText(t), toast('Copiato ✓')); }
  const b = e.target.closest('[data-set]'); if (!b) return;
  const [act, arg] = b.dataset.set.split(':');
  try {
    if (act === 'new') { const { error } = await sb.from('pet_links').insert({ token: arg === 'invito' ? token(6) : token(24), scope: arg }); if (error) throw error; }
    if (act === 'del') { if (!confirm('Confermi? Il vecchio codice smetterà di funzionare.')) return; await sb.from('pet_links').delete().eq('scope', arg).eq('owner', user.id); if (arg === 'invito') await sb.from('pet_links').insert({ token: token(6), scope: 'invito' }); }
    if (act === 'rm') { if (!confirm('Togliere questa persona dalla famiglia?')) return; await sb.from('pet_members').delete().eq('owner', user.id).eq('member', arg); }
    if (act === 'join') { const { error } = await sb.rpc('join_family', { code: $('#joinCode').value }); if (error) throw error; records = {}; pending.clear(); persist(); await findOwner(); await sync(); toast('Ora fai parte della famiglia 🐾'); }
    if (act === 'theme') { LS.set('cani.theme', arg); applyTheme(); return ($('#setBody').innerHTML = settingsHTML()); }
    if (act === 'backup') return exportBackup();
    if (act === 'import') return $('#importFile').click();
    if (act === 'logout') { if (!confirm('Uscire dall\'account?')) return; await sb.auth.signOut(); localStorage.removeItem('cani.records'); localStorage.removeItem('cani.pending'); return location.reload(); }
    await loadSettings(); $('#setBody').innerHTML = settingsHTML();
  } catch (err) { toast(/schema cache|does not exist|relation/.test(err.message) ? 'Prima esegui schema-2.sql su Supabase' : err.message); }
});

// ---------- link del veterinario: sola lettura, senza account ----------
async function openVetLink(t) {
  readonly = true; tab = 'vet'; document.body.classList.add('readonly');
  const { data, error } = await sb.rpc('vet_report', { t });
  if (error || !data?.length) { document.body.innerHTML = '<div class="glass card login"><h1>Link non valido</h1><p class="muted">Chiedi un nuovo link al proprietario.</p></div>'; return; }
  records = Object.fromEntries(data.map(r => [r.id, { ...r, deleted: false }]));
  if (!list(dog, 'crisi').length && !list(dog).length) dog = DOGS.find(d => list(d.id).length)?.id || dog;
  showApp();
}

// ---------- scorte: quanto dura una confezione ----------
// consumo al giorno dagli orari delle pastiglie (o dalla terapia in corso), da quando la confezione è stata aperta
function dailyUse(d, key) {
  const qty = s => fracOf((s.what.toLowerCase().split(key)[1] || '').trim().replace(/^[^\d]*/, '')) ?? 1;
  const sl = slotsFor(d, today()).filter(s => drugKey(s.what) === key);
  if (sl.length) return sl.reduce((a, s) => a + qty(s), 0);
  const r = currentTherapy(d).find(r => drugKey(r.data.farmaco) === key); if (!r) return 0;
  return (fracOf(r.data.dose) || 0) * (timesIn(r.data.orari).length || parseInt(r.data.freq) || 1);
}
function stockStatus(d) {
  const seen = {}, out = [];
  for (const r of list(d, 'scorta')) {
    const k = drugKey(r.data.farmaco); if (seen[k]) continue; seen[k] = 1;
    const use = dailyUse(d, k), days = Math.max(0, daysBetween(toDate(r.data.date), toDate(today())));
    const left = (+r.data.quante || 0) - use * days;
    out.push({ id: r.id, farmaco: r.data.farmaco, use, left, warn: r.data.avviso ?? 7, daysLeft: use ? Math.floor(left / use) : null, end: use ? dayAdd(today(), Math.floor(left / use)) : null });
  }
  return out;
}
function stockCard() {
  const st = stockStatus(dog); if (!st.length) return '';
  return section('Scorte', `<div class="glass list">${st.map(b => `<div class="item" data-id="${b.id}"><div class="sc"><div class="ic" style="--c:${b.daysLeft != null && b.daysLeft <= b.warn ? '#f5a623' : COLORS.terapia}">📦</div>
    <div class="tx"><b>${esc(b.farmaco)}</b><small>${b.use ? `circa ${fmtNum(Math.max(0, b.left))} compresse · ${fmtNum(b.use)} al giorno` : 'consumo non calcolabile: manca la terapia con dose e orari'}</small></div>
    <div class="dt">${b.daysLeft == null ? '' : b.daysLeft <= 0 ? '<b class="warn">finita</b>' : `finisce<br><span>${esc(fmtDate(b.end).replace(/ \d{4}$/, ''))}</span>`}</div></div></div>`).join('')}</div>`);
}

// ---------- tieni premuta una dose: cambiala solo per quel giorno ----------
let pressT = null, editDose = null;
view.addEventListener('touchstart', e => {
  const el = e.target.closest('[data-pill]'); if (!el || readonly) return;
  clearTimeout(pressT); pressT = setTimeout(() => { justSwiped = Date.now(); navigator.vibrate?.(20); openDoseEdit(el); }, 550);
}, { passive: true });
['touchmove', 'touchend', 'touchcancel'].forEach(ev => view.addEventListener(ev, () => clearTimeout(pressT), { passive: true }));
view.addEventListener('contextmenu', e => { const el = e.target.closest('[data-pill]'); if (el && !readonly) { e.preventDefault(); openDoseEdit(el); } });
function openDoseEdit(el) {
  const day = el.dataset.day, orig = el.dataset.orig, cur = el.dataset.pill;
  const mod = list(dog, 'dosemod').find(r => r.data.date === day && r.data.slot === orig);
  editDose = { day, orig, mod };
  $('#deTitle').textContent = `Cambia per il ${fmtDate(day)}`;
  $('#deTime').value = cur.slice(0, 5); $('#deWhat').value = cur.slice(6);
  $('#deOrig').textContent = mod ? `Previsto: ${orig}` : '';
  $('#deReset').hidden = !mod;
  $('#doseEdit').showModal();
}
$('#deSave').onclick = () => {
  const { day, orig, mod } = editDose, t = $('#deTime').value, what = $('#deWhat').value.trim();
  if (!t || !what) return toast('Inserisci orario e dose');
  if (`${t} ${what}` === orig && mod) { mod.deleted = true; save(mod); }
  else if (`${t} ${what}` !== orig) save(mod ? { ...mod, data: { ...mod.data, t, what } } : { id: uuid(), dog, kind: 'dosemod', data: { date: day, slot: orig, t, what } });
  $('#doseEdit').close(); toast('Dose cambiata solo per quel giorno');
};
$('#deReset').onclick = () => { const { mod } = editDose; mod.deleted = true; save(mod); $('#doseEdit').close(); toast('Ripristinata come previsto'); };

// ricerca nel diario: il campo resta attivo mentre scrivi
view.addEventListener('input', e => {
  if (e.target.id !== 'q') return;
  query = e.target.value; const pos = e.target.selectionStart; render();
  const q = $('#q'); if (q) { q.focus(); q.setSelectionRange(pos, pos); }
});

// ---------- tema ----------
function applyTheme() {
  const v = LS.get('cani.theme', 'auto'), el = document.documentElement;
  if (v === 'auto') delete el.dataset.theme; else el.dataset.theme = v;
}
applyTheme();

// ---------- scadenze leggibili ----------
const euro = v => (+v).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' });
const whenTxt = due => { const n = daysBetween(toDate(today()), toDate(due)); return n < 0 ? `scaduto da ${plural(-n, 'giorno', 'giorni')}` : n === 0 ? 'oggi' : n === 1 ? 'domani' : `tra ${n} giorni`; };

// ---------- promemoria ricorrenti (es. antiparassitario ogni mese) ----------
const RTARGET = { Antiparassitario: 'vaccino', Vaccino: 'vaccino', Analisi: 'analisi', Visita: 'visita' };
function lastDone(d, r) {
  const k = drugKey(r.data.nome), kind = RTARGET[r.data.tipo];
  const hit = kind && list(d, kind).find(x => x.data.date <= today() && drugKey(x.data.nome || x.data.tipo || x.data.motivo) === k);
  const a = r.data.ultima || '', b = hit?.data.date || '';
  return a > b ? a : b || null;
}
function nextDue(d, r) {
  const last = lastDone(d, r); if (!last) return null;
  const n = +r.data.ogni || 1, dt = toDate(last), u = r.data.unita || 'mesi';
  if (u === 'giorni') dt.setDate(dt.getDate() + n); else if (u === 'settimane') dt.setDate(dt.getDate() + 7 * n);
  else if (u === 'mesi') dt.setMonth(dt.getMonth() + n); else dt.setFullYear(dt.getFullYear() + n);
  return isoOf(dt);
}
function recurringCard() {
  const rs = list(dog, 'ricorrenza'); if (!rs.length) return '';
  return section('Promemoria ricorrenti', `<div class="glass list">${rs.map(r => {
    const due = nextDue(dog, r), last = lastDone(dog, r), late = due && due <= today();
    return `<div class="item" data-id="${r.id}"><div class="sc"><div class="ic" style="--c:${late ? '#f5a623' : COLORS.vaccino}">🔁</div>
      <div class="tx"><b>${esc(titleOf(r))}</b><small>${esc(KINDS.ricorrenza.sum(r.data))} · ${last ? 'ultima ' + esc(fmtDate(last).replace(/ \d{4}$/, '')) : 'ultima volta non segnata'}</small>
      <small class="${late ? 'late' : ''}">${due ? (late ? '⚠️ ' : '') + whenTxt(due) + ' · ' + esc(fmtDate(due)) : 'tocca "Fatto" quando la dai'}</small></div>
      ${readonly ? '' : `<button class="done-btn" data-done="${r.id}">✓ Fatto</button>`}</div></div>`;
  }).join('')}</div>`, `<button class="link" data-ics="up">📅</button>`);
}
function markDone(id) {
  const r = records[id], x = r.data, kind = RTARGET[x.tipo], t = today();
  let made;
  if (kind) {
    const data = kind === 'vaccino' ? { date: t, nome: x.nome, note: [x.tipo, x.dose].filter(Boolean).join(' · ') } : kind === 'analisi' ? { date: t, tipo: x.nome } : { date: t, motivo: x.nome };
    made = { id: uuid(), dog: r.dog, kind, data }; save(made);
  } else { r.data = { ...x, ultima: t }; save(r); }
  toast(`Segnato: ${x.nome} oggi`, { label: 'Annulla', fn: () => { if (made) { made.deleted = true; save(made); } else { r.data.ultima = x.ultima; save(r); } } });
}

// ---------- diario del giorno: possibili fattori scatenanti ----------
const FATTORI = ['⛈️ Temporale o botti', '👥 Ospiti o visite', '🚗 Viaggio in auto', '🍖 Cibo diverso', '😴 Sonno agitato', '🎾 Molto gioco/eccitazione', '🔥 Caldo', '😰 Stress o spavento', '💊 Pastiglia in ritardo', '🩸 Calore', '🤢 Malessere', '✅ Giornata tranquilla'];
let logDay = null;
const dayLog = (d, day) => list(d, 'giorno').find(r => r.data.date === day);
function dayLogCard() {
  const day = logDay || today(), r = dayLog(dog, day), on = new Set(r?.data.fattori || []);
  const label = day === today() ? 'Oggi' : day === dayAdd(today(), -1) ? 'Ieri' : fmtDate(day);
  return section('Com\'è andata la giornata?', `<div class="glass card daylog">
    <div class="dl-nav"><button class="link" data-logday="-1">‹</button><b>${esc(label)}</b><button class="link" data-logday="1" ${day >= today() ? 'disabled' : ''}>›</button></div>
    <div class="chips">${FATTORI.map(f => `<label><input type="checkbox" data-factor="${esc(f)}"${on.has(f) ? ' checked' : ''}><span>${esc(f)}</span></label>`).join('')}</div>
    <p class="small muted">Bastano pochi secondi al giorno: col tempo in Statistiche vedrai se ${curDog().epi ? 'le crisi arrivano' : 'i problemi di salute arrivano'} più spesso dopo certe situazioni.</p></div>`);
}
function toggleFactor(f) {
  const day = logDay || today(), r = dayLog(dog, day) || { id: uuid(), dog, kind: 'giorno', data: { date: day, fattori: [] } };
  const set = new Set(r.data.fattori || []); set.has(f) ? set.delete(f) : set.add(f);
  if (f === '✅ Giornata tranquilla' && set.has(f)) [...set].forEach(x => x !== f && set.delete(x)); else set.delete('✅ Giornata tranquilla');
  r.data = { ...r.data, fattori: [...set] }; save(r);
}
// confronto: dopo un certo fattore, quante volte arriva una crisi entro il giorno dopo, rispetto al solito
function factorsCard() {
  const logs = list(dog, 'giorno').filter(r => r.data.fattori?.length); if (logs.length < 7) return `<div class="glass card"><h2>Possibili fattori scatenanti</h2><p class="muted small">Segna nel Riepilogo com'è andata ogni giornata. Dopo almeno una settimana di dati (ora: ${plural(logs.length, 'giorno', 'giorni')}) qui vedrai se qualche situazione porta più ${curDog().epi ? 'crisi' : 'problemi di salute'}.</p></div>`;
  const ev = curDog().epi ? 'crisi' : 'salute', evName = curDog().epi ? 'crisi' : 'problema di salute';
  const crisisDays = new Set(list(dog, ev).map(r => r.data.date));
  const hit = day => crisisDays.has(day) || crisisDays.has(dayAdd(day, 1));
  const base = logs.filter(r => hit(r.data.date)).length / logs.length;
  const rows = FATTORI.filter(f => !f.startsWith('✅')).map(f => { const ds = logs.filter(r => r.data.fattori.includes(f)); return { f, n: ds.length, p: ds.length ? ds.filter(r => hit(r.data.date)).length / ds.length : 0 }; }).filter(x => x.n >= 3).sort((a, b) => b.p - a.p);
  return `<div class="glass card"><div class="card-h"><h2>Possibili fattori scatenanti</h2><small>${curDog().epi ? 'Crisi' : 'Problemi di salute'} entro il giorno dopo · di solito nel ${Math.round(base * 100)}% dei giorni</small></div>
    ${rows.length ? rows.map(x => `<div class="hb"><div><span>${esc(x.f)} <small class="muted">(${plural(x.n, 'giorno', 'giorni')})</small></span><b class="${x.p >= base * 2 && x.p > 0 ? 'hot' : ''}">${Math.round(x.p * 100)}%</b></div><i><i style="width:${x.p * 100}%;background:${x.p >= base * 2 && x.p > 0 ? COLORS.crisi : COLORS.terapia}"></i></i></div>`).join('') : '<p class="muted small">Servono almeno 3 giorni per ogni situazione.</p>'}
    <p class="muted small">In rosso le situazioni con almeno il doppio ${curDog().epi ? 'delle crisi' : 'dei problemi'} rispetto al solito. È solo un indizio da mostrare al veterinario, non una diagnosi.</p></div>`;
}

// ---------- spese veterinarie ----------
let spYear = null;
const catOf = r => r.kind === 'spesa' ? r.data.categoria || 'Altro' : r.kind === 'visita' ? 'Visita' : r.kind === 'analisi' ? 'Analisi' : r.kind === 'vaccino' ? (/nexgard|frontline|advantix|effitix|stronghold|advocate|drontal|endogard|antiparass|collare|pipetta|milbemax|bravecto|simparica/i.test(r.data.nome || '') ? 'Antiparassitari' : 'Vaccini') : 'Farmaci';
const expenses = dogs => Object.values(records).filter(r => !r.deleted && dogs.includes(r.dog) && +r.data.costo > 0);
function expensesCard() {
  const mine = expenses([dog]), all = expenses(DOGS.map(d => d.id));
  const years = [...new Set(all.map(r => r.data.date.slice(0, 4)))].sort().reverse();
  if (!years.length) return `<div class="glass card"><h2>💶 Spese</h2><p class="muted small">Aggiungi il costo quando segni una visita, un'analisi, un vaccino, un farmaco o una confezione (campo "Costo"), oppure con ＋ → Spesa. Qui vedrai i totali dell'anno.</p></div>`;
  const y = spYear && years.includes(spYear) ? spYear : years[0], inY = rs => rs.filter(r => r.data.date.startsWith(y));
  const tot = rs => inY(rs).reduce((a, r) => a + +r.data.costo, 0);
  const byCat = inY(mine).reduce((o, r) => (o[catOf(r)] = (o[catOf(r)] || 0) + +r.data.costo, o), {});
  const months = Array.from({ length: 12 }, (_, i) => `${y}-${pad(i + 1)}`), mv = Object.fromEntries(months.map(m => [m, 0]));
  inY(mine).forEach(r => mv[r.data.date.slice(0, 7)] += +r.data.costo);
  const max = Math.max(...Object.values(byCat), 1);
  return `<div class="glass card chart"><div class="card-h"><h2>💶 Spese</h2><small>${years.length > 1 ? years.map(v => `<button class="link${v === y ? ' on' : ''}" data-spyear="${v}">${v}</button>`).join(' ') : y}</small></div>
    <div class="kv"><span>${esc(curDog().name)} nel ${y}</span><b>${euro(tot(mine))}</b></div>
    <div class="kv"><span>Tutti e due i cani</span><b>${euro(tot(all))}</b></div>
    ${Object.entries(byCat).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<div class="hb"><div><span>${esc(k)}</span><b>${euro(v)}</b></div><i><i style="width:${v / max * 100}%;background:${COLORS.analisi}"></i></i></div>`).join('')}
    ${barChart(months.map((m, i) => ({ l: new Date(m + '-01T12:00').toLocaleDateString('it-IT', { month: 'narrow' }), t: euro(mv[m]), v: Math.round(mv[m]) })), { color: COLORS.analisi, h: 120 })}
    <h3 class="sub">Elenco ${y} · ${esc(curDog().name)}</h3>${listHTML(inY(mine).sort((a, b) => b.data.date.localeCompare(a.data.date)), 'Nessuna spesa')}
    <p class="hint small">Tocca una spesa per modificarla, scorri a sinistra per eliminarla</p>
    <button class="btn" data-spcsv="${y}">📊 Esporta le spese del ${y}</button>
    <p class="muted small">Le spese veterinarie si possono detrarre in parte nella dichiarazione dei redditi: conserva le fatture e verifica con il CAF o il commercialista.</p></div>`;
}
function exportExpenses(y) {
  const rs = expenses(DOGS.map(d => d.id)).filter(r => r.data.date.startsWith(y)).sort((a, b) => a.data.date.localeCompare(b.data.date));
  const cell = v => { const s = String(v ?? ''); return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const lines = [['Giorno', 'Cane', 'Categoria', 'Cosa', 'Dove', 'Importo (€)'].join(';'), ...rs.map(r => [fmtDate(r.data.date), DOGS.find(d => d.id === r.dog).name, catOf(r), titleOf(r), r.data.dove || '', String(r.data.costo).replace('.', ',')].map(cell).join(';')),
    ['', '', '', '', 'Totale', rs.reduce((a, r) => a + +r.data.costo, 0).toFixed(2).replace('.', ',')].join(';')];
  shareFile(new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' }), `spese-cani-${y}.csv`);
}
view.addEventListener('click', e => {
  const dn = e.target.closest('[data-done]'); if (dn) { e.stopImmediatePropagation(); return markDone(dn.dataset.done); }
  const ld = e.target.closest('[data-logday]'); if (ld) { e.stopImmediatePropagation(); const n = dayAdd(logDay || today(), +ld.dataset.logday); logDay = n > today() ? today() : n; return render(); }
  const fc = e.target.closest('[data-factor]'); if (fc) { e.stopImmediatePropagation(); e.preventDefault(); return toggleFactor(fc.dataset.factor); }
  const sy = e.target.closest('[data-spyear]'); if (sy) { e.stopImmediatePropagation(); spYear = sy.dataset.spyear; return render(); }
  const sc = e.target.closest('[data-spcsv]'); if (sc) { e.stopImmediatePropagation(); return exportExpenses(sc.dataset.spcsv); }
}, true);

// ---------- saluto in alto ----------
function greeting() {
  const h = new Date().getHours();
  return h < 5 ? '🌙 Buonanotte' : h < 13 ? '☀️ Buongiorno' : h < 18 ? '🌤️ Buon pomeriggio' : '🌙 Buonasera';
}
function subtitleText() {
  const d = curDog(), t = today(), bits = [];
  const sl = slotsFor(dog, t), taken = new Set(dosesOn(dog, t).map(r => r.data.slot)), left = sl.filter(s => !taken.has(slotKey(s)));
  const late = left.filter(s => s.t < nowTime());
  if (late.length) bits.push(`⚠️ ${d.name} ha ${plural(late.length, 'pastiglia', 'pastiglie')} da dare`);
  else if (left.length) bits.push(`${d.name}: prossima pastiglia alle ${left[0].t}`);
  else if (sl.length) bits.push(`${d.name}: pastiglie di oggi tutte date ✓`);
  if (d.epi) { const st = seizureStats(dog, 1); if (st.last) bits.push(`${plural(Math.max(0, daysBetween(toDate(st.last.data.date), new Date())), 'giorno', 'giorni')} senza crisi`); }
  if (!bits.length) bits.push(`Tutto tranquillo per ${d.name} 🐾`);
  return bits.join(' · ');
}

// ---------- spunta animata ----------
let justTicked = null;
function popTicked() {
  if (!justTicked) return;
  document.querySelectorAll(`[data-pill="${CSS.escape(justTicked.key)}"][data-day="${justTicked.day}"]`).forEach(el => el.classList.add('pop'));
  justTicked = null;
}

// ---------- calendario a mese nel Diario ----------
let diaryMode = LS.get('cani.diaryMode', 'list'), calMonth = today().slice(0, 7), calDay = today();
function monthHTML(rs) {
  const [y, m] = calMonth.split('-').map(Number), first = new Date(y, m - 1, 1), days = new Date(y, m, 0).getDate();
  const lead = (first.getDay() + 6) % 7, byDay = {};
  rs.forEach(r => (byDay[r.data.date] ||= []).push(r));
  let cells = '';
  for (let i = 0; i < lead; i++) cells += '<span></span>';
  for (let n = 1; n <= days; n++) {
    const day = `${calMonth}-${pad(n)}`, es = byDay[day] || [], kinds = [...new Set(es.map(r => r.kind))].slice(0, 4);
    const cr = es.filter(r => r.kind === 'crisi').reduce((a, r) => a + (+r.data.quante || 1), 0);
    cells += `<button class="cal-d${day === today() ? ' today' : ''}${day === calDay ? ' sel' : ''}${cr ? ' has-cr' : ''}" data-calday="${day}"><b>${n}</b>${cr ? `<em>${cr}</em>` : ''}<i>${kinds.map(k => `<u style="background:${COLORS[k]}"></u>`).join('')}</i></button>`;
  }
  const sel = (byDay[calDay] || []);
  const leg = [...new Set(rs.filter(r => r.data.date.startsWith(calMonth)).map(r => r.kind))].map(k => `<span><i style="background:${COLORS[k]}"></i>${KINDS[k].name}</span>`).join('');
  return `<div class="glass card cal">
    <div class="cal-h"><button class="link" data-calnav="-1">‹</button><b>${new Date(y, m - 1, 1).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}</b><button class="link" data-calnav="1">›</button></div>
    <div class="cal-w">${['L', 'M', 'M', 'G', 'V', 'S', 'D'].map(w => `<span>${w}</span>`).join('')}</div>
    <div class="cal-g">${cells}</div>${leg ? `<div class="legend">${leg}</div>` : ''}</div>
    <h3 class="sub">${esc(fmtDate(calDay))}</h3>${listHTML(sel, 'Niente in questo giorno')}`;
}

// ---------- icona dell'app con le foto dei cani ----------
function makeAppIcon() {
  const ps = DOGS.map(d => profile(d.id).foto).filter(Boolean); if (!ps.length) return;
  const c = document.createElement('canvas'); c.width = c.height = 180; const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 180, 180); grad.addColorStop(0, '#8b7bff'); grad.addColorStop(1, '#ff8a5c'); g.fillStyle = grad; g.fillRect(0, 0, 180, 180);
  let done = 0; const pos = ps.length > 1 ? [[52, 78, 46], [128, 102, 46]] : [[90, 90, 64]];
  ps.slice(0, 2).forEach((src, i) => { const im = new Image(); im.onload = () => {
    const [x, y, r] = pos[i]; g.save(); g.beginPath(); g.arc(x, y, r + 4, 0, 7); g.fillStyle = '#fff'; g.fill(); g.beginPath(); g.arc(x, y, r, 0, 7); g.clip(); g.drawImage(im, x - r, y - r, r * 2, r * 2); g.restore();
    if (++done === Math.min(2, ps.length)) { const l = document.querySelector('link[rel="apple-touch-icon"]'); if (l) l.href = c.toDataURL('image/png'); }
  }; im.src = src; });
}

// ---------- schermata d'apertura ----------
(function splash() {
  const el = $('#splash'); if (!el) return;
  el.querySelector('.sp-avs').innerHTML = DOGS.map(d => avatar(d.id, 76)).join('');
  setTimeout(() => el.classList.add('gone'), 450);
  setTimeout(() => el.remove(), 750);
})();

view.addEventListener('click', e => {
  const cd = e.target.closest('[data-calday]'); if (cd) { e.stopImmediatePropagation(); calDay = cd.dataset.calday; return render(); }
  const cn = e.target.closest('[data-calnav]'); if (cn) { e.stopImmediatePropagation(); const [y, m] = calMonth.split('-').map(Number), d = new Date(y, m - 1 + +cn.dataset.calnav, 1); calMonth = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`; return render(); }
  const dm = e.target.closest('[data-dmode]'); if (dm) { e.stopImmediatePropagation(); diaryMode = dm.dataset.dmode; LS.set('cani.diaryMode', diaryMode); return render(); }
  const bar = e.target.closest('svg rect'); if (bar && bar.querySelector('title')) { e.stopImmediatePropagation(); bar.classList.remove('hit'); void bar.getBBox(); bar.classList.add('hit'); return toast(bar.querySelector('title').textContent); }
}, true);

// ---------- accesso ----------
async function findOwner() {
  if (!sb || !user) return;
  const { data } = await sb.from('pet_members').select('owner').eq('member', user.id).limit(1);
  ownerId = data?.[0]?.owner || user.id;
}
async function showApp() {
  $('#login').hidden = true;['#app', '#tabbar', '#fab'].forEach(s => $(s).hidden = false);
  render();
  if (!readonly) { await findOwner().catch(() => {}); sync(); }
}
async function doLogin(signup) {
  const email = $('#lEmail').value.trim(), password = $('#lPass').value, msg = $('#lMsg');
  if (!email || !password) return msg.textContent = 'Inserisci email e password';
  msg.textContent = '…';
  const r = signup ? await sb.auth.signUp({ email, password, options: { emailRedirectTo: location.href } }) : await sb.auth.signInWithPassword({ email, password });
  if (r.error) return msg.textContent = r.error.message === 'Invalid login credentials' ? 'Email o password errati' : r.error.message;
  if (!r.data.session) return msg.textContent = 'Controlla la posta per confermare l\'email, poi accedi.';
  user = r.data.user; showApp();
}
$('#lGo').onclick = () => doLogin(false);
$('#lNew').onclick = () => doLogin(true);

(async () => {
  if (!sb) return showApp(); // senza Supabase: solo sul telefono
  const vetToken = new URLSearchParams(location.search).get('vet');
  if (vetToken) return openVetLink(vetToken);
  const { data } = await sb.auth.getSession();
  user = data.session?.user || null;
  if (user) showApp(); else $('#login').hidden = false;
})();
