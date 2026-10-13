// ---------- Dettatura: parli, l'app trascrive e smista nelle sezioni giuste ----------
// Tutto sul telefono: trascrizione del browser (dettatura Apple) e riconoscimento a regole, nessuna AI.
const Voice = (() => {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const MONTHS = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
  const DAYS = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];
  const NUM = { un: 1, una: 1, uno: 1, due: 2, tre: 3, quattro: 4, cinque: 5, sei: 6, sette: 7, otto: 8, nove: 9, dieci: 10, undici: 11, dodici: 12, tredici: 13, quattordici: 14, quindici: 15, sedici: 16, diciassette: 17, diciotto: 18, diciannove: 19, venti: 20, ventuno: 21, ventidue: 22, ventitré: 23, ventitre: 23, trenta: 30, quaranta: 40, cinquanta: 50, mezzogiorno: 12, mezzanotte: 0 };
  const W = `(\\d{1,2}|${Object.keys(NUM).join('|')})`;
  const num = w => w == null ? null : /^\d+([.,]\d+)?$/.test(w) ? +w.replace(',', '.') : NUM[w] ?? null;
  const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  const norm = s => ' ' + s.toLowerCase().replace(/[’`]/g, "'").replace(/\s+/g, ' ') + ' ';

  // ---- data dell'evento (passato) ----
  function pastDate(t, now = new Date()) {
    let m;
    if (/l'altro ieri|altroieri/.test(t)) return iso(addDays(now, -2));
    if (/\bieri\b|ieri sera|ieri notte/.test(t)) return iso(addDays(now, -1));
    if ((m = t.match(new RegExp(`\\b${W}\\s+(${MONTHS.join('|')})(?:\\s+(\\d{4}))?`)))) {
      const d = new Date(m[3] ? +m[3] : now.getFullYear(), MONTHS.indexOf(m[2]), num(m[1]));
      if (!m[3] && d > now) d.setFullYear(d.getFullYear() - 1);
      return iso(d);
    }
    if ((m = t.match(/\b(\d{1,2})[\/.-](\d{1,2})(?:[\/.-](\d{2,4}))?\b/))) {
      const y = m[3] ? (+m[3] < 100 ? 2000 + +m[3] : +m[3]) : now.getFullYear(), d = new Date(y, +m[2] - 1, +m[1]);
      if (!m[3] && d > now) d.setFullYear(y - 1);
      return iso(d);
    }
    if ((m = t.match(new RegExp(`(${DAYS.join('|')}) scors[oa]`)))) { const diff = (now.getDay() - DAYS.indexOf(m[1]) + 7) % 7 || 7; return iso(addDays(now, -diff)); }
    return today();
  }
  // ---- data futura (prossima visita, richiamo…) dopo una parola chiave ----
  function futureDate(t, now = new Date()) {
    let m;
    if ((m = t.match(new RegExp(`(?:tra|fra) ${W}? ?(giorn[oi]|settiman[ae]|mes[ei]|ann[oi])`)))) {
      const n = m[1] ? num(m[1]) : 1, u = m[2][0];
      const d = u === 'g' ? addDays(now, n) : u === 's' ? addDays(now, 7 * n) : u === 'm' ? new Date(now.getFullYear(), now.getMonth() + n, now.getDate()) : new Date(now.getFullYear() + n, now.getMonth(), now.getDate());
      return iso(d);
    }
    if ((m = t.match(new RegExp(`\\b${W}\\s+(${MONTHS.join('|')})(?:\\s+(\\d{4}))?`)))) {
      const d = new Date(m[3] ? +m[3] : now.getFullYear(), MONTHS.indexOf(m[2]), num(m[1]));
      if (!m[3] && d < now) d.setFullYear(d.getFullYear() + 1);
      return iso(d);
    }
    if ((m = t.match(/\b(\d{1,2})[\/.-](\d{1,2})(?:[\/.-](\d{2,4}))?\b/))) {
      const y = m[3] ? (+m[3] < 100 ? 2000 + +m[3] : +m[3]) : now.getFullYear(), d = new Date(y, +m[2] - 1, +m[1]);
      if (!m[3] && d < now) d.setFullYear(y + 1);
      return iso(d);
    }
    if ((m = t.match(new RegExp(`(?:il |la |questo |questa |prossimo |prossima )?(${DAYS.join('|')})`)))) { const diff = (DAYS.indexOf(m[1]) - now.getDay() + 7) % 7 || 7; return iso(addDays(now, diff)); }
    if (/dopodomani/.test(t)) return iso(addDays(now, 2));
    if (/\bdomani\b/.test(t)) return iso(addDays(now, 1));
    return null;
  }
  // ---- ora: "alle 3 e 20", "alle 23:10", "alle tre e mezza di notte" ----
  function timeOf(t) {
    const m = t.match(new RegExp(`(?:alle|verso le|intorno alle|ore|all')\\s*${W}(?:[:.,]|\\s+e\\s+)?(\\d{1,2}|mezza|un quarto|tre quarti|${Object.keys(NUM).join('|')})?(?:\\s+(di notte|di mattina|del mattino|di pomeriggio|del pomeriggio|di sera|della sera|stasera))?`));
    if (!m) { if (/mezzanotte/.test(t)) return '00:00'; return null; }
    let h = num(m[1]); if (h == null) return null;
    const mm = m[2] === 'mezza' ? 30 : m[2] === 'un quarto' ? 15 : m[2] === 'tre quarti' ? 45 : num(m[2]) ?? 0;
    if (/pomeriggio|sera/.test(m[3] || '') && h < 12) h += 12;
    return h < 24 && mm < 60 ? `${pad(h)}:${pad(mm)}` : null;
  }
  // ---- durata: "2 minuti e mezzo", "30 secondi", "un minuto e 20" ----
  function duration(t) {
    let m = t.match(new RegExp(`${W}\\s+minut[oi](?:\\s+e\\s+(mezzo|${W}(?:\\s+second[oi])?))?`));
    if (m) { const min = num(m[1]); const extra = m[2] === 'mezzo' ? 30 : num(m[3]) ?? 0; if (min != null) return min * 60 + extra; }
    if ((m = t.match(/mezzo minuto/))) return 30;
    if ((m = t.match(new RegExp(`${W}\\s+second[oi]`)))) return num(m[1]);
    return null;
  }
  // ---- dosi: "mezza compressa", "tre quarti", "30 mg" ----
  function doseOf(t) {
    const m = t.match(/(\d+[.,]?\d*)\s*(mg|milligrammi|ml)\b/);
    if (m) return { dose: m[1].replace(',', '.'), unita: /ml/.test(m[2]) ? 'ml' : 'mg' };
    const fr = [[/una e mezza|1 e mezza|1 e 1\/2/, '1 1/2'], [/tre quarti|3\/4/, '3/4'], [/un quarto|1\/4/, '1/4'], [/un terzo|1\/3/, '1/3'], [/mezza|metà|1\/2/, '1/2'], [/due compresse|2 compresse/, '2'], [/una compressa|1 compressa|una pastiglia/, '1']];
    for (const [re, v] of fr) if (re.test(t)) return { dose: v, unita: 'compresse' };
    return {};
  }
  function freqOf(t) {
    if (/tre volte|3 volte|ogni 8 ore/.test(t)) return '3 volte al giorno';
    if (/due volte|2 volte|mattina e sera|ogni 12 ore/.test(t)) return '2 volte al giorno';
    if (/una volta|1 volta|al giorno/.test(t)) return '1 volta al giorno';
    if (/al bisogno/.test(t)) return 'Al bisogno';
    return undefined;
  }
  const cap = s => s.trim().replace(/^./, c => c.toUpperCase());
  const sentences = text => text.split(/(?<=[.!?;])\s+|\s+(?:e poi|poi|inoltre|invece)\s+/i).map(s => s.trim()).filter(Boolean);

  function knownDrugs() {
    const base = ['phenoleptil', 'fenobarbital', 'libromide', 'bromuro', 'soliphen', 'antirobe', 'ziepam', 'diazepam', 'valium'];
    const mine = Object.values(records).filter(r => r.kind === 'terapia' && !r.deleted).map(r => drugKey(r.data.farmaco));
    return [...new Set([...mine, ...base])].filter(Boolean);
  }
  const drugName = key => { const r = Object.values(records).find(r => r.kind === 'terapia' && !r.deleted && drugKey(r.data.farmaco) === key); return r ? r.data.farmaco : cap(key); };

  // ---- dal testo alle voci da proporre ----
  function parse(text, curDogId) {
    const t = norm(text), out = [];
    const dogId = /\bzo[eè]\b/.test(t) && !/\bkafka\b/.test(t) ? 'zoe' : /\bkafka\b/.test(t) ? 'kafka' : curDogId;
    const date = pastDate(t), time = timeOf(t);
    const add = (kind, data) => out.push({ id: uuid(), dog: dogId, kind, data: Object.fromEntries(Object.entries({ date, ...data }).filter(([, v]) => v != null && v !== '' && !(Array.isArray(v) && !v.length))) });

    const isCrisi = /\bcrisi\b|attacc|convuls|epilett/.test(t) && !/analisi|esami/.test(t.match(/[^.]*(crisi|attacc)[^.]*/)?.[0] || '');
    const isVisita = /visita|veterinari|dottor|controllo/.test(t);
    const drugs = knownDrugs();

    if (isCrisi) {
      const q = /tre (crisi|attacchi)|3 (crisi|attacchi)|terzo attacco/.test(t) ? 3 : /due (crisi|attacchi)|2 (crisi|attacchi)|doppi|secondo attacco/.test(t) ? 2 : 1;
      const sint = [[/bava|saliv/, 'Salivazione'], [/pip[iì]|urin/, 'Perdita urine'], [/cacca|feci/, 'Perdita feci'], [/rigid|bloccat/, 'Rigidità'], [/trem/, 'Tremori'], [/non vedeva|cieca|non ci vedeva|vista/, 'Cecità temporanea'], [/disorient|spaesat|confus/, 'Disorientamento dopo'], [/pedal|zampett/, 'Pedalamento'], [/guaiv|ululat|vocal/, 'Vocalizzi'], [/mastic/, 'Masticazione a vuoto'], [/cosc|non rispondeva/, 'Perdita di coscienza'], [/fame|sete|mangia/, 'Fame/sete dopo']].filter(([re]) => re.test(t)).map(x => x[1]);
      const trig = [[/dormiva|nel sonno|dormendo/, 'Durante il sonno'], [/svegli/, 'Al risveglio'], [/eccitat|giocava/, 'Eccitazione'], [/stress|spaventat/, 'Stress'], [/caldo/, 'Caldo'], [/dopo (aver )?mangiato|dopo il pasto|mentre mangiava/, 'Dopo il pasto'], [/saltat[oa] (la )?(dose|pastiglia)|dimenticat/, 'Dose saltata']].filter(([re]) => re.test(t)).map(x => x[1]);
      const intens = /molto forte|fortissim|violent/.test(t) ? 5 : /\bfort[ei]\b/.test(t) ? 4 : /lieve|leggera|piccola|breve/.test(t) ? 2 : undefined;
      const em = t.match(/(ziepam|diazepam|valium|calmante|microclisma)[^.,;]*/);
      const post = t.match(new RegExp(`ripres[ao][^.]*?(?:dopo|in|di)\\s+${W}\\s+minut`));
      add('crisi', { time, quante: q, durSec: duration(t.replace(/ripres[ao][^.]*/g, '')), tipo: /focale|solo (la )?(zampa|testa|muso)/.test(t) ? 'Focale' : 'Generalizzata (tonico-clonica)', intensita: intens, post: post ? num(post[1]) : undefined, sintomi: sint, trigger: trig, emergenza: em ? cap(em[0]) : undefined, video: /video|filmat/.test(t) ? 'Sì, nella galleria' : undefined, note: cap(text) });
    }

    for (const s of sentences(text)) {
      const st = norm(s);
      // cambi di terapia: una frase con un farmaco conosciuto e una dose o un verbo di cambio
      const drug = drugs.find(k => st.includes(k));
      if (drug && !/ziepam|diazepam|valium/.test(drug) && (/dose|terapia|aument|diminu|riduc|abbass|passa|cambi|inizi|sospend|smett|interromp|compress|mezza|quart|\bmg\b|volte/.test(st))) {
        const stop = /sospend|smett|interromp|togli/.test(st);
        add('terapia', { farmaco: drugName(drug), ...(stop ? {} : doseOf(st)), freq: stop ? undefined : freqOf(st), orari: (st.match(/(?:alle|ore) \d{1,2}(?:[:.]\d{2})?(?:\s*(?:e|,)\s*(?:alle )?\d{1,2}(?:[:.]\d{2})?)*/) || [])[0], sospeso: stop ? 'Sospeso' : 'In corso', motivo: cap(s), time: undefined });
      }
      // analisi e valori
      if (/analisi|esami|emocromo|sangue|fenobarbital|bromur|valor|livell|epatic|fegato|urine/.test(st) && !/\bcrisi\b|attacc/.test(st)) {
        const tipo = /fenobarbital|fenobarbitalemia|phenol/.test(st) ? 'Livello fenobarbital nel sangue' : /bromur/.test(st) ? 'Livello bromuro' : /fegato|epatic/.test(st) ? 'Funzionalità epatica' : /urine/.test(st) ? 'Urine' : /tiroid/.test(st) ? 'Tiroide' : /ecograf/.test(st) ? 'Ecografia' : 'Emocromo + biochimico';
        const v = st.match(/(\d+[.,]?\d*)\s*(µg\/ml|microgrammi|mcg|mg\/dl|mg\/ml|mg\/l|mmol)?/);
        const esito = /nella norma|tutto (ok|bene|a posto)|normal|buon/.test(st) ? 'Nella norma' : /alt[oi]|bass[oi]|alterat|fuori|sballat/.test(st) ? 'Alterato' : /ricontroll|da controllare|ripetere/.test(st) ? 'Da controllare' : undefined;
        const prossime = /ripet|rifare|ricontroll|prossim/.test(st) ? futureDate(st.replace(/.*(ripet|rifare|ricontroll|prossim)/, '')) : null;
        if (!out.some(o => o.kind === 'analisi' && o.data.tipo === tipo)) add('analisi', { tipo, valore: v && !/^\d{1,2}$/.test(v[1]) || (v && v[2]) ? `${v[1].replace(',', '.')}${v[2] ? ' ' + v[2].replace('microgrammi', 'µg').replace('mcg', 'µg') : ''}` : undefined, esito, risultati: cap(s), prossime });
      }
      // vaccini e antiparassitari
      if (/vaccin|antiparassit|leishmania|rabbia|antipulci|zecche|vermifug|filaria/.test(st)) {
        const nome = (st.match(/vaccin\w* (?:per |contro |della |del )?(?:la |il )?(\w+)/) || [])[1];
        const ric = /richiam|ripet|prossim|tra |fra /.test(st) ? futureDate(st.replace(/.*?(richiam|ripet|prossim|tra |fra )/, '$1')) : null;
        const n = /leishmania/.test(st) ? 'Leishmania' : /rabbia/.test(st) ? 'Rabbia' : /antiparassit|antipulci|zecche/.test(st) ? 'Antiparassitario' : /vermifug/.test(st) ? 'Vermifugo' : /filaria/.test(st) ? 'Filaria' : nome && !/fatto|fatta|il|la/.test(nome) ? 'Vaccino ' + nome : 'Vaccino';
        add('vaccino', { nome: n, richiamo: ric, note: cap(s) });
      }
      // problemi di salute (non crisi)
      const prob = st.match(/vomit\w*|diarrea|zoppi\w*|non mangia\w*|tosse|prurit\w*|ferit\w*|febbre|dolore|gonfi\w*|otite|congiuntivit\w*|stitic\w*|sangue nelle feci|si gratta/);
      if (prob && !isCrisi && !isVisita) add('salute', { time, titolo: cap(prob[0]), gravita: /molto|grave|forte/.test(st) ? 4 : undefined, farmaco: (st.match(/(?:dato|data|preso|presa) (?:il |la |lo |un |una )?([a-zà-ù]+)/) || [])[1], risolto: /passat|risolt|guarit|meglio/.test(st) ? 'Risolto' : 'In corso', note: cap(s) });
    }

    if (isVisita) {
      const peso = t.match(/(?:pesa|peso|pesava)[^\d]*(\d+[.,]?\d*)/);
      const prox = t.match(/(?:prossima visita|ricontroll\w*|rivederla|rivederlo|ritorn\w*|appuntamento|controllo)[^.]*/);
      const motivo = /controllo/.test(t) ? 'Controllo' + (/epiless|crisi/.test(t) ? ' epilessia' : '') : /vaccin/.test(t) ? 'Vaccino' : /analisi|esami/.test(t) ? 'Analisi' : 'Visita';
      add('visita', { motivo, peso: peso ? +peso[1].replace(',', '.') : undefined, esito: cap(text), prossima: prox ? futureDate(prox[0]) : null });
    }
    if (!out.length) add(curDog().epi && /\bcrisi\b|attacc/.test(t) ? 'crisi' : 'salute', { time, titolo: cap(text.split(/[.,]/)[0]).slice(0, 60), note: cap(text) });
    return out;
  }

  // ---- interfaccia ----
  let rec = null, finalText = '', recording = false, proposals = [];
  const $v = s => document.querySelector('#voice ' + s);
  function open() {
    finalText = ''; proposals = [];
    $v('#vText').value = ''; $v('#vList').innerHTML = ''; $v('#vSave').hidden = true; $v('#vGo').hidden = false;
    $v('#vTitle').innerHTML = `${avatar(dog, 28)} Detta per ${esc(curDog().name)}`;
    $('#voice').showModal();
    if (SR) start(); else $v('#vHint').textContent = 'Questo browser non trascrive: usa il microfono della tastiera 🎙️ e scrivi qui.';
  }
  function start() {
    if (!SR || recording) return;
    rec = new SR(); rec.lang = 'it-IT'; rec.continuous = true; rec.interimResults = true;
    const base = $v('#vText').value ? $v('#vText').value.trim() + ' ' : '';
    finalText = base;
    rec.onresult = e => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) { const r = e.results[i]; if (r.isFinal) finalText += r[0].transcript.trim() + ' '; else interim += r[0].transcript; }
      $v('#vText').value = finalText + interim;
    };
    rec.onend = () => { if (recording) try { rec.start(); } catch { setRec(false); } };
    rec.onerror = e => { if (e.error === 'not-allowed' || e.error === 'service-not-allowed') { toast('Consenti microfono e riconoscimento vocale'); setRec(false); } };
    try { rec.start(); setRec(true); } catch { setRec(false); }
  }
  function setRec(on) {
    recording = on; $v('#vMic').classList.toggle('on', on);
    $v('#vHint').textContent = on ? 'Ti ascolto… Di\' cosa è successo, il giorno e l\'ora. Tocca il microfono per fermare.' : 'Puoi correggere il testo qui sotto, poi tocca Analizza.';
  }
  function stop() { recording = false; try { rec?.stop(); } catch {} setRec(false); }
  function renderList() {
    $v('#vList').innerHTML = proposals.length ? `<p class="small muted">Ecco cosa ho capito. Tocca una voce per controllarla o correggerla.</p>` + proposals.map((p, i) => {
      const k = KINDS[p.kind], dn = DOGS.find(d => d.id === p.dog).name;
      const sub = [p.kind === 'crisi' ? [p.data.quante > 1 ? p.data.quante + ' crisi' : '', fmtDur(p.data.durSec), p.data.emergenza].filter(Boolean).join(' · ') : k.sum(p.data), fmtDate(p.data.date) + (p.data.time ? ' ' + p.data.time : '')].filter(Boolean).join(' · ');
      return `<div class="vprop${p.off ? ' off' : ''}" data-i="${i}"><button class="vchk" data-toggle="${i}">${p.off ? '' : '✓'}</button>
        <div class="sc" data-edit="${i}"><div class="ic" style="--c:${COLORS[p.kind]}">${k.ic}</div><div class="tx"><b>${esc(p.kind === 'crisi' ? 'Crisi' : titleOf(p))} <span class="muted small">· ${esc(dn)}</span></b><small>${esc(sub)}</small></div><span class="muted">›</span></div></div>`;
    }).join('') : '';
    const n = proposals.filter(p => !p.off).length;
    $v('#vSave').hidden = !proposals.length; $v('#vSave').textContent = `Salva ${plural(n, 'voce', 'voci')}`; $v('#vSave').disabled = !n;
  }
  function analyze() {
    stop();
    const text = $v('#vText').value.trim(); if (!text) return toast('Prima detta o scrivi qualcosa');
    proposals = parse(text, dog); renderList();
  }
  function saveAll() {
    const ok = proposals.filter(p => !p.off);
    ok.forEach(p => save({ id: p.id, dog: p.dog, kind: p.kind, data: p.data }));
    $('#voice').close(); toast(`Salvate ${plural(ok.length, 'voce', 'voci')} ✓`);
  }
  document.addEventListener('DOMContentLoaded', () => {});
  $('#voice').addEventListener('click', e => {
    if (e.target.closest('#vMic')) return recording ? stop() : start();
    if (e.target.closest('#vGo')) return analyze();
    if (e.target.closest('#vSave')) return saveAll();
    const tg = e.target.closest('[data-toggle]'); if (tg) { const p = proposals[+tg.dataset.toggle]; p.off = !p.off; return renderList(); }
    const ed = e.target.closest('[data-edit]'); if (ed) {
      const i = +ed.dataset.edit, p = proposals[i];
      const prev = dog; dog = p.dog;
      openForm(p.kind, { id: p.id, dog: p.dog, kind: p.kind, data: structuredClone(p.data) });
      $('#fDel').hidden = true;
      // quando la voce viene salvata dal modulo, la tolgo dalle proposte
      const done = () => { if (records[p.id]) { proposals.splice(i, 1); renderList(); if (!proposals.length) $('#voice').close(); } dog = prev; render(); };
      $('#form').addEventListener('close', done, { once: true });
    }
  });
  $('#voice').addEventListener('close', stop);
  return { open, parse };
})();
