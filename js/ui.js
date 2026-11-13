'use strict';
/* Zakładka — interfejs */

/* ================= narzędzia ================= */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = t => String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function lsGet(k) { try { return localStorage.getItem(k); } catch { return null; } }
function lsSet(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch { /* tryb prywatny */ } }

const MIES_KR = ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru'];
const dataDluga = (iso, rok = true) => doDaty(iso).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', ...(rok ? { year: 'numeric' } : {}), timeZone: 'UTC' });
const dataKrotka = iso => `${+iso.slice(8)} ${MIES_KR[+iso.slice(5, 7) - 1]}`;
const dataDzis = () => new Date().toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' });

const U = {
  widok: ['dzis', 'biblioteka', 'statystyki', 'cytaty', 'ustawienia'].includes(lsGet('zakladka-widok')) ? lsGet('zakladka-widok') : 'dzis',
  polka: 'czytam', szukaj: '', sort: 'domyslnie', tag: null, szukajCytat: '',
  pierwszyRender: true, instalacja: null, skaner: false, dzien: dzisISO()
};

/* ================= ikony ================= */
const svg = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const I = {
  dzis: svg('<path d="M7 3h10a1 1 0 0 1 1 1v17l-6-4-6 4V4a1 1 0 0 1 1-1z"/>'),
  biblioteka: svg('<rect x="3" y="4" width="4" height="16" rx="1"/><rect x="9" y="4" width="4" height="16" rx="1"/><path d="M15.2 5.4l3.6-1.1 3.9 14.9-3.6 1.1z"/>'),
  statystyki: svg('<path d="M3 21h18M6 17v-5M11 17V6M16 17v-8M21 17v-3"/>'),
  cytaty: svg('<path d="M10 7H6a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h3v1a3 3 0 0 1-3 3M20 7h-4a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h3v1a3 3 0 0 1-3 3"/>'),
  ustawienia: svg('<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>'),
  plus: svg('<path d="M12 5v14M5 12h14"/>'),
  szukaj: svg('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>'),
  aparat: svg('<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.5" r="3.5"/>'),
  skaner: svg('<path d="M3 7V4h3M18 4h3v3M21 17v3h-3M6 20H3v-3M7 8v8M10 8v8M13 8v8M17 8v8"/>'),
  zegar: svg('<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9 2h6"/>'),
  check: svg('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
  kopiuj: svg('<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>'),
  udostepnij: svg('<path d="M12 3v12M8 7l4-4 4 4M5 13v6a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-6"/>'),
  kosz: svg('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'),
  edytuj: svg('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M14 6l4 4"/>'),
  gora: svg('<path d="M12 19V5M6 11l6-6 6 6"/>'),
  dol: svg('<path d="M12 5v14M6 13l6 6 6-6"/>'),
  zamknij: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
  plomien: svg('<path d="M12 21c-4 0-7-2.8-7-6.5 0-3 2-5 3.5-6.5.3 2 1.3 3 2.5 3.5C11 8 12 5 14.5 3c.5 3 4.5 5.5 4.5 11 0 4-3 7-7 7z"/>'),
  gwiazda: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z" fill="currentColor"/></svg>',
  pobierz: svg('<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>'),
  wgraj: svg('<path d="M12 16V5M7 10l5-5 5 5M5 20h14"/>')
};
const LOGO = '<svg class="logo" viewBox="100 120 312 340" aria-hidden="true"><path d="M118 380c56-7 104 0 138 24 34-24 82-31 138-24v16c-56-7-104 0-138 24-34-24-82-31-138-24z" fill="var(--zloto)"/><path d="M256 170c-34-23-82-31-138-25v235c56-7 104 0 138 24z" fill="var(--strona-l)"/><path d="M256 170c34-23 82-31 138-25v235c-56-7-104 0-138 24z" fill="var(--strona-p)"/><path d="M318 132h34v318l-17-21-17 21z" fill="var(--wstazka)"/></svg>';

/* ================= elementy wspólne ================= */
const PLOTNA = ['#1f4a3d', '#6b1e2c', '#22385c', '#7a5218', '#4a2f52', '#38474f', '#5c3b23', '#24555a'];
function hash(s) { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h); }

function okladka(k, rozmiar = 'm') {
  const kolor = PLOTNA[hash(k.tytul + k.autor) % PLOTNA.length];
  const inicjal = esc((k.tytul.match(/[\p{L}\p{N}]/u) || ['?'])[0].toUpperCase());
  const gen = `<span class="okl-gen" style="--kolor:${kolor}"><span class="okl-inicjal">${inicjal}</span><span class="okl-tytul">${esc(k.tytul)}</span><span class="okl-autor">${esc(k.autor)}</span></span>`;
  const img = k.okladka ? `<img src="${esc(k.okladka)}" alt="" loading="lazy" decoding="async" onerror="this.remove()">` : '';
  return `<span class="okl okl-${rozmiar}">${gen}${img}</span>`;
}

function pasek(proc, { plan = null, duzy = false } = {}) {
  const p = ogranicz(proc || 0, 0, 100);
  return `<span class="pasek${duzy ? ' pasek-duzy' : ''}" role="progressbar" aria-valuenow="${Math.round(p)}" aria-valuemin="0" aria-valuemax="100" aria-label="Postęp ${Math.round(p)}%">
    <span class="pasek-wyp" style="width:${p}%"></span>
    ${plan != null ? `<span class="pasek-plan" style="left:${ogranicz(plan, 0, 100)}%" title="Tu powinieneś być na koniec dnia"></span>` : ''}
    ${duzy ? `<span class="pasek-wstazka" style="left:${p}%"></span>` : ''}
  </span>`;
}

function pierscien(wart, cel) {
  const r = 50, obw = 2 * Math.PI * r, p = cel ? Math.min(1, wart / cel) : 0;
  return `<svg class="pierscien" viewBox="0 0 120 120" aria-hidden="true">
    <circle cx="60" cy="60" r="${r}" class="pr-tlo"/>
    <circle cx="60" cy="60" r="${r}" class="pr-wyp${p >= 1 ? ' pr-pelny' : ''}" stroke-dasharray="${obw.toFixed(1)}" stroke-dashoffset="${(obw * (1 - p)).toFixed(1)}" transform="rotate(-90 60 60)"/>
  </svg>`;
}

function gwiazdki(k) {
  return `<div class="gwiazdki" role="group" aria-label="Ocena">${[1, 2, 3, 4, 5].map(n =>
    `<button type="button" class="gwiazdka${k.ocena >= n ? ' wl' : ''}" data-akcja="ocena" data-id="${k.id}" data-n="${n}" aria-label="${n} na 5" aria-pressed="${k.ocena >= n}">${I.gwiazda}</button>`).join('')}</div>`;
}

function radio(nazwa, wartosc, etykieta, zaznaczony = false) {
  return `<label class="seg"><input type="radio" name="${nazwa}" value="${esc(wartosc)}"${zaznaczony ? ' checked' : ''}><span>${etykieta}</span></label>`;
}

function statusKsiazki(k) {
  if (k.status === 'czytam') return k.bazowa ? 'Książka bazowa' : 'Czytam';
  if (k.status === 'doPrzeczytania') return `Do przeczytania, nr ${kolejka().indexOf(k) + 1} w kolejce`;
  if (k.status === 'przeczytana') return k.koniec ? `Przeczytana ${dataDluga(k.koniec)}` : 'Przeczytana';
  return k.porzucono ? `Porzucona ${dataDluga(k.porzucono)}` : 'Porzucona';
}

/* ================= toasty ================= */
function toast(tekst, { akcja, onAkcja, typ, czas = 3500 } = {}) {
  const el = document.createElement('div');
  el.className = 'toast' + (typ ? ' toast-' + typ : '');
  el.setAttribute('role', typ === 'blad' ? 'alert' : 'status');
  const s = document.createElement('span');
  s.textContent = tekst;
  el.append(s);
  const zamknij = () => { el.classList.remove('widoczny'); setTimeout(() => el.remove(), 220); };
  if (akcja) {
    const b = document.createElement('button');
    b.className = 'toast-akcja';
    b.textContent = akcja;
    b.addEventListener('click', () => { onAkcja(); zamknij(); });
    el.append(b);
    czas = Math.max(czas, 6000);
  }
  $('#toasty').append(el);
  requestAnimationFrame(() => el.classList.add('widoczny'));
  setTimeout(zamknij, czas);
}

/* ================= arkusze (okna od dołu) ================= */
const otwarte = [];

function arkusz({ tytul = '', render, klasa = '', ukryjTytul = false, onZamknij, odswiezalny = false, ksiazkaId = null }) {
  const tlo = document.createElement('div');
  tlo.className = 'arkusz-tlo';
  tlo.innerHTML = `<div class="arkusz ${klasa}" role="dialog" aria-modal="true" aria-label="${esc(tytul)}" tabindex="-1">
    <div class="arkusz-gora"><h2 class="${ukryjTytul ? 'sr' : ''}">${esc(tytul)}</h2><button type="button" class="btn-ikona" data-zamknij aria-label="Zamknij">${I.zamknij}</button></div>
    <div class="arkusz-tresc"></div>
  </div>`;
  const a = { tlo, el: $('.arkusz', tlo), tresc: $('.arkusz-tresc', tlo), odswiezalny, ksiazkaId, zamkniety: false, poprzedniFokus: document.activeElement };
  a.rysuj = () => {
    const pozycja = a.el.scrollTop;
    a.tresc.innerHTML = render(a);
    a.el.scrollTop = pozycja;
  };
  a.zamknij = wynik => {
    if (a.zamkniety) return;
    a.zamkniety = true;
    otwarte.splice(otwarte.indexOf(a), 1);
    tlo.classList.remove('widoczny');
    setTimeout(() => tlo.remove(), 220);
    document.body.classList.toggle('arkusz-otwarty', otwarte.length > 0);
    if (a.poprzedniFokus && document.contains(a.poprzedniFokus)) a.poprzedniFokus.focus({ preventScroll: true });
    if (onZamknij) onZamknij(wynik);
    renderPigulka();
  };
  tlo.addEventListener('click', e => {
    if (e.target === tlo || e.target.closest('[data-zamknij]')) a.zamknij();
  });
  document.body.append(tlo);
  otwarte.push(a);
  document.body.classList.add('arkusz-otwarty');
  a.rysuj();
  requestAnimationFrame(() => {
    tlo.classList.add('widoczny');
    const pierwsze = $('[autofocus]', a.el);
    (pierwsze || a.el).focus({ preventScroll: true });
  });
  return a;
}

function potwierdz(tresc, { tytul = 'Na pewno?', tak = 'Tak', nie = 'Anuluj', niebezpieczne = false } = {}) {
  return new Promise(ok => {
    let wynik = false;
    const a = arkusz({
      tytul, klasa: 'arkusz-maly', onZamknij: () => ok(wynik),
      render: () => `<p class="potwierdz-tresc">${tresc}</p>
        <div class="przyciski przyciski-koniec"><button type="button" class="btn" data-zamknij>${esc(nie)}</button>
        <button type="button" class="btn ${niebezpieczne ? 'btn-niebezpieczny' : 'btn-glowny'}" data-tak autofocus>${esc(tak)}</button></div>`
    });
    $('[data-tak]', a.tresc).addEventListener('click', () => { wynik = true; a.zamknij(); });
  });
}

/* ================= zapis ================= */
function bladZapisu(e) {
  console.error(e);
  toast('Nie udało się zapisać na urządzeniu. Sprawdź wolne miejsce i zrób kopię zapasową.', { typ: 'blad', czas: 7000 });
}
async function utrwal(...lista) {
  try { for (const k of lista.flat()) if (k) await Baza.zapisz(k); } catch (e) { bladZapisu(e); }
}
async function utrwalUstawienia() {
  lsSet('zakladka-motyw', Z.ustawienia.motyw);
  try { await Baza.zapiszUstawienia(Z.ustawienia); } catch (e) { bladZapisu(e); }
}

function odswiez() {
  renderWidok();
  for (const a of [...otwarte]) {
    if (a.ksiazkaId && !znajdz(a.ksiazkaId)) a.zamknij();
    else if (a.odswiezalny) a.rysuj();
  }
  renderPigulka();
}

/* ================= motyw ================= */
function zastosujMotyw() {
  const m = Z.ustawienia.motyw, html = document.documentElement;
  if (m === 'jasny') html.dataset.theme = 'light';
  else if (m === 'ciemny') html.dataset.theme = 'dark';
  else delete html.dataset.theme;
  const ciemny = m === 'ciemny' || (m === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  $('meta[name="theme-color"]').setAttribute('content', ciemny ? '#0f1b17' : '#e7ebe3');
}

/* ================= widok: Dziś ================= */
function powitanie() {
  const h = new Date().getHours();
  const t = h < 5 ? 'Dobranoc' : h < 12 ? 'Dzień dobry' : h < 18 ? 'Cześć' : 'Dobry wieczór';
  return Z.ustawienia.imie ? `${t}, ${esc(Z.ustawienia.imie)}` : t;
}

function banery() {
  const out = [];
  const ost = lsGet('zakladka-kopia');
  const odlozone = lsGet('zakladka-kopia-odloz');
  const dni = ost ? dniMiedzy(ost, dzisISO()) : null;
  if (Z.ksiazki.length >= 3 && (dni === null || dni >= 7) && !(odlozone && odlozone > dzisISO())) {
    out.push(`<div class="baner"><p>${dni === null ? 'Nie masz jeszcze kopii zapasowej.' : `Ostatnia kopia zapasowa była ${dni} dni temu.`} Zapisz ją na Dysku albo w plikach telefonu.</p>
      <div class="przyciski"><button type="button" class="btn btn-glowny" data-akcja="kopia">Zrób kopię</button><button type="button" class="btn-tekst" data-akcja="kopia-pozniej">Później</button></div></div>`);
  }
  return out.join('');
}

function widokPowitalny() {
  return `<section class="powitalny">
    <div class="powitalny-logo">${LOGO}</div>
    <h1>Zakładka</h1>
    <p class="powitalny-lead">Dziennik czytania, który pamięta, gdzie skończyłeś.</p>
    <ul class="powitalny-lista">
      <li><strong>Książka bazowa.</strong> Jedna długa książka na kilka miesięcy i dzienna norma stron, żeby zdążyć.</li>
      <li><strong>Kilka książek naraz.</strong> Krótsze czytasz obok i każdą śledzisz osobno.</li>
      <li><strong>Cel roczny.</strong> Widzisz, ile stron dziennie potrzebujesz i czy idziesz zgodnie z planem.</li>
      <li><strong>Cytaty i notatki.</strong> Zapisujesz zdania z numerem strony.</li>
    </ul>
    <div class="przyciski"><button type="button" class="btn btn-glowny" data-akcja="dodaj">Dodaj pierwszą książkę</button>
      <button type="button" class="btn" data-akcja="import-goodreads">Importuj z Goodreads</button></div>
    <p class="cichy">Masz kopię z innego telefonu? <button type="button" class="btn-tekst" data-akcja="import-json">Wczytaj kopię</button></p>
  </section>`;
}

function blokBazowej(k) {
  const p = planBazowej(k);
  const proc = k.strona / k.strony * 100;
  const tempo = tempoKsiazki(k) || tempoOgolne();
  const plan = p.stan === 'przed' ? `${ile(p.roznica, FORMY_STRON)} przed planem`
    : p.stan === 'za' ? `${ile(p.roznica, FORMY_STRON)} za planem` : 'Idziesz zgodnie z planem';
  const termin = p.poTerminie ? `minął ${dataDluga(k.celData, false)}`
    : p.dni === 1 ? 'dziś' : `${dataDluga(k.celData, false)}, za ${ile(p.dni, FORMY_DNI)}`;
  const brakuje = p.norma - p.dzisiaj;
  return `<section class="bazowa${U.pierwszyRender ? ' animuj' : ''}" aria-label="Książka bazowa">
    <p class="bazowa-etykieta">Książka bazowa</p>
    <button type="button" class="bazowa-ksiazka" data-akcja="ksiazka" data-id="${k.id}">${okladka(k, 's')}
      <span class="bazowa-tekst"><span class="bazowa-tytul">${esc(k.tytul)}</span><span class="bazowa-autor">${esc(k.autor)}</span></span></button>
    <p class="bazowa-strona"><span>Strona <strong>${k.strona}</strong> z ${k.strony}</span><span>${Math.floor(proc)}%</span></p>
    ${pasek(proc, { plan: p.planDzis / k.strony * 100, duzy: true })}
    <dl class="bazowa-fakty">
      <div><dt>Dziś</dt><dd>${p.dzisiaj} z ${p.norma} ${odmiana(p.norma, FORMY_STRON_D)} ${p.zrobione ? `<span class="znacznik znacznik-ok">${I.check}norma zrobiona</span>` : `<span class="znacznik">brakuje ${brakuje}</span>`}</dd></div>
      <div><dt>Plan</dt><dd class="${p.stan === 'za' ? 'zle' : ''}">${plan}</dd></div>
      <div><dt>Termin</dt><dd>${termin}</dd></div>
      ${tempo ? `<div><dt>Do końca</dt><dd>ok. ${czasCzytania(p.zostalo / tempo)} czytania</dd></div>` : ''}
    </dl>
    <div class="przyciski">
      <button type="button" class="btn btn-zloty" data-akcja="postep" data-id="${k.id}">Zapisz postęp</button>
      <button type="button" class="btn btn-na-plotnie" data-akcja="sesja" data-id="${k.id}">${I.zegar}Sesja</button>
      ${p.poTerminie ? `<button type="button" class="btn btn-na-plotnie" data-akcja="bazowa" data-id="${k.id}">Przesuń termin</button>` : ''}
    </div>
  </section>`;
}

function blokBezBazowej() {
  return `<section class="bazowa bazowa-pusta" aria-label="Książka bazowa">
    <p class="bazowa-etykieta">Książka bazowa</p>
    <h2>Wybierz jedną długą książkę na kilka miesięcy</h2>
    <p>Czytasz ją codziennie, a Zakładka liczy dzienną normę stron, żeby zdążyć przed terminem.</p>
    <div class="przyciski"><button type="button" class="btn btn-zloty" data-akcja="wybierz-bazowa">Wybierz z biblioteki</button>
      <button type="button" class="btn btn-na-plotnie" data-akcja="dodaj" data-jako="bazowa">Dodaj nową</button></div>
  </section>`;
}

function wierszCzytanej(k) {
  const proc = k.strona / k.strony * 100;
  const dzis = stronyKsiazkiDnia(k, dzisISO());
  const prog = prognozaKsiazki(k);
  return `<li class="wiersz">
    <button type="button" class="wiersz-glowny" data-akcja="ksiazka" data-id="${k.id}">${okladka(k, 's')}
      <span class="wiersz-tekst"><span class="wiersz-tytul">${esc(k.tytul)}</span><span class="wiersz-autor">${esc(k.autor || FORMATY[k.format])}</span>
      ${pasek(proc)}<span class="wiersz-info">Strona ${k.strona} z ${k.strony}${dzis ? `, dziś +${dzis}` : ''}${prog ? `. Skończysz ok. ${dataKrotka(prog)}` : ''}</span></span>
    </button>
    <span class="wiersz-akcje">
      <button type="button" class="btn-ikona" data-akcja="postep" data-id="${k.id}" aria-label="Zapisz postęp: ${esc(k.tytul)}">${I.plus}</button>
      <button type="button" class="btn-ikona" data-akcja="sesja" data-id="${k.id}" aria-label="Sesja czytania: ${esc(k.tytul)}">${I.zegar}</button>
    </span>
  </li>`;
}

function blokCelu(m) {
  const u = Z.ustawienia, g = postepCelu(m);
  let tresc;
  if (g.przedStartem) tresc = `<p>Odliczanie startuje ${dataDluga(u.start)}.</p>`;
  else if (g.poKoncu) tresc = `<p>Okres celu skończył się ${dataDluga(u.koniec)}. Ustaw nowy w ustawieniach.</p>`;
  else if (!g.zostalo) tresc = '<p class="ok">Cel osiągnięty. Każda kolejna książka to nadwyżka.</p>';
  else {
    tresc = `<p>Potrzebujesz ${ulamek(g.tygodniowo)} książki tygodniowo, czyli ok. ${ile(g.stronDziennie, FORMY_STRON)} dziennie.</p>
      <p class="${g.roznica >= 0 ? 'ok' : 'zle'}">${g.roznica > 0 ? `Masz ${ile(g.roznica, FORMY_KSIAZEK_B)} zapasu względem planu.`
        : g.roznica === 0 ? 'Idziesz dokładnie zgodnie z planem.'
        : `Do planu brakuje ci ${ile(-g.roznica, FORMY_KSIAZEK_D)}.`}</p>
      ${g.tempo > 0 ? `<p class="cichy">Przy tempie z ostatnich tygodni (${Math.round(g.tempo)} str. dziennie) wyjdzie ok. ${ile(g.prognoza, FORMY_KSIAZEK)} do ${dataDluga(u.koniec)}.</p>` : ''}`;
  }
  return `<section class="sekcja cel">
    <div class="sekcja-gora"><h2>Cel roczny</h2><button type="button" class="btn-tekst" data-akcja="idz" data-widok="ustawienia">Zmień</button></div>
    <p class="cel-liczby"><strong>${g.przeczytane}</strong><span>z ${ile(u.cel, FORMY_KSIAZEK_D)}</span></p>
    ${pasek(g.przeczytane / u.cel * 100, { plan: g.przedStartem || g.poKoncu ? null : g.oczekiwanyProc })}
    ${tresc}
  </section>`;
}

function cytatDnia() {
  const wszystkie = Z.ksiazki.flatMap(k => k.cytaty.filter(c => !c.notatka).map(c => ({ c, k })));
  if (!wszystkie.length) return '';
  const { c, k } = wszystkie[hash(dzisISO()) % wszystkie.length];
  return `<section class="sekcja cytat-dnia">
    <h2>Z twoich cytatów</h2>
    <blockquote>${esc(c.tekst)}</blockquote>
    <p class="cichy"><button type="button" class="btn-tekst" data-akcja="ksiazka" data-id="${k.id}">${esc(k.tytul)}</button>${c.strona ? `, s. ${c.strona}` : ''}</p>
  </section>`;
}

function widokDzis() {
  if (!Z.ksiazki.length) return widokPowitalny();
  const m = mapaDni(), dzis = dzisISO();
  const dzisStron = m.get(dzis) || 0;
  const cel = dziennyCel(m);
  const seria = seriaAktualna(m);
  let tydzien = 0;
  for (let d = dodajDni(dzis, -dzienTygodnia(dzis)); d <= dzis; d = dodajDni(d, 1)) tydzien += m.get(d) || 0;
  const baz = bazowa();
  const pob = czytane().filter(k => !k.bazowa);
  const nast = kolejka()[0];
  const brak = cel - dzisStron;
  return `${banery()}
  <section class="powitanie">
    <p class="powitanie-data">${dataDzis()}</p>
    <h1>${powitanie()}</h1>
  </section>
  <section class="dzien" aria-label="Dzisiejsze czytanie">
    <div class="dzien-pierscien">${pierscien(dzisStron, cel)}
      <div class="dzien-liczba"><strong>${dzisStron}</strong><span>z ${ile(cel, FORMY_STRON_D)}</span></div></div>
    <div class="dzien-boki">
      <p class="dzien-seria${seria ? ' aktywna' : ''}">${I.plomien}<span>${seria ? `<strong>${ile(seria, FORMY_DNI)}</strong> z rzędu` : 'Przeczytaj dziś choć stronę, żeby zacząć serię'}</span></p>
      <p>W tym tygodniu <strong>${ile(tydzien, FORMY_STRON)}</strong></p>
      <p class="cichy">${brak <= 0 ? 'Dzienny cel zrobiony.' : `Do dziennego celu brakuje ${ile(brak, FORMY_STRON_D)}.`}</p>
    </div>
  </section>
  ${baz ? blokBazowej(baz) : blokBezBazowej()}
  <section class="sekcja">
    <div class="sekcja-gora"><h2>Czytam też</h2>${pob.length ? `<span class="licznik">${pob.length}</span>` : ''}</div>
    ${pob.length ? `<ul class="lista">${pob.map(wierszCzytanej).join('')}</ul>`
      : `<p class="pusto">Nic obok bazowej. <button type="button" class="btn-tekst" data-akcja="idz" data-widok="biblioteka" data-polka="doPrzeczytania">Wybierz coś z listy do przeczytania</button></p>`}
  </section>
  ${blokCelu(m)}
  ${nast ? `<section class="sekcja">
    <div class="sekcja-gora"><h2>Następna w kolejce</h2><button type="button" class="btn-tekst" data-akcja="idz" data-widok="biblioteka" data-polka="doPrzeczytania">Cała lista</button></div>
    <div class="nastepna"><button type="button" class="wiersz-glowny" data-akcja="ksiazka" data-id="${nast.id}">${okladka(nast, 's')}
      <span class="wiersz-tekst"><span class="wiersz-tytul">${esc(nast.tytul)}</span><span class="wiersz-autor">${esc(nast.autor)}${nast.autor ? ', ' : ''}${ile(nast.strony, FORMY_STRON)}</span></span></button>
      <button type="button" class="btn" data-akcja="zacznij" data-id="${nast.id}">Zacznij</button></div>
  </section>` : ''}
  ${cytatDnia()}`;
}

/* ================= widok: Biblioteka ================= */
const POLKI = [['czytam', 'Czytam'], ['doPrzeczytania', 'Do przeczytania'], ['przeczytana', 'Przeczytane'], ['porzucona', 'Porzucone']];
const SORTY = { domyslnie: 'Domyślnie', tytul: 'Tytuł', autor: 'Autor', strony: 'Liczba stron', ocena: 'Ocena', dodano: 'Ostatnio dodane' };

function sortuj(lista) {
  const pl = (a, b) => a.localeCompare(b, 'pl');
  switch (U.sort) {
    case 'tytul': return lista.sort((a, b) => pl(a.tytul, b.tytul));
    case 'autor': return lista.sort((a, b) => pl(a.autor.split(' ').pop(), b.autor.split(' ').pop()) || pl(a.tytul, b.tytul));
    case 'strony': return lista.sort((a, b) => b.strony - a.strony);
    case 'ocena': return lista.sort((a, b) => b.ocena - a.ocena || pl(a.tytul, b.tytul));
    case 'dodano': return lista.sort((a, b) => b.dodano.localeCompare(a.dodano));
    default:
      if (U.polka === 'doPrzeczytania') return lista.sort((a, b) => a.kolejnosc - b.kolejnosc);
      if (U.polka === 'przeczytana') return lista.sort((a, b) => (b.koniec || '').localeCompare(a.koniec || ''));
      if (U.polka === 'czytam') return lista.sort((a, b) => (b.bazowa - a.bazowa) || ostatniaAktywnosc(b).localeCompare(ostatniaAktywnosc(a)));
      return lista.sort((a, b) => (b.porzucono || '').localeCompare(a.porzucono || ''));
  }
}

function htmlSiatki() {
  const q = U.szukaj.trim().toLowerCase();
  let lista = Z.ksiazki.filter(k => k.status === U.polka);
  if (q) lista = lista.filter(k => `${k.tytul} ${k.autor} ${k.tagi.join(' ')} ${k.isbn}`.toLowerCase().includes(q));
  if (U.tag) lista = lista.filter(k => k.tagi.includes(U.tag));
  lista = sortuj(lista);
  if (!lista.length) {
    if (q || U.tag) return '<p class="pusto">Nic nie pasuje do wyszukiwania.</p>';
    const puste = {
      czytam: 'Nie czytasz teraz nic. Zacznij książkę z listy do przeczytania albo dodaj nową.',
      doPrzeczytania: 'Lista do przeczytania jest pusta. Dodaj książki, po które chcesz sięgnąć.',
      przeczytana: 'Tu trafią książki, które skończysz.',
      porzucona: 'Porzucone książki trafiają tutaj. Rzucenie nudnej książki to oszczędność czasu na lepszą.'
    };
    return `<div class="pusto-duze"><p>${puste[U.polka]}</p>${U.polka !== 'porzucona' && U.polka !== 'przeczytana' ? '<button type="button" class="btn btn-glowny" data-akcja="dodaj">Dodaj książkę</button>' : ''}</div>`;
  }
  const kolejkowa = U.polka === 'doPrzeczytania' && U.sort === 'domyslnie' && !q && !U.tag;
  return `<ul class="siatka">${lista.map((k, i) => `<li><button type="button" class="kafel" data-akcja="ksiazka" data-id="${k.id}">
      ${okladka(k, 'm')}${kolejkowa ? `<span class="kafel-nr" aria-label="Pozycja w kolejce">${i + 1}</span>` : ''}${k.bazowa ? '<span class="kafel-wstazka" aria-label="Książka bazowa"></span>' : ''}
      <span class="kafel-tytul">${esc(k.tytul)}</span><span class="kafel-autor">${esc(k.autor)}</span>
      ${k.status === 'czytam' ? pasek(k.strona / k.strony * 100) : ''}
      ${k.status === 'przeczytana' && k.ocena ? `<span class="kafel-ocena" aria-label="Ocena ${k.ocena} na 5">${'★'.repeat(k.ocena)}<span class="kafel-ocena-reszta">${'★'.repeat(5 - k.ocena)}</span></span>` : ''}
    </button></li>`).join('')}</ul>`;
}

function widokBiblioteka() {
  const liczby = Object.fromEntries(STATUSY.map(s => [s, Z.ksiazki.filter(k => k.status === s).length]));
  const tagi = [...new Set(Z.ksiazki.filter(k => k.status === U.polka).flatMap(k => k.tagi))].sort((a, b) => a.localeCompare(b, 'pl'));
  if (U.tag && !tagi.includes(U.tag)) U.tag = null;
  return `<section class="naglowek-widoku"><h1>Biblioteka</h1>
    <button type="button" class="btn btn-glowny" data-akcja="dodaj">${I.plus}Dodaj</button></section>
  <div class="polki" role="tablist" aria-label="Półki">${POLKI.map(([s, n]) =>
    `<button type="button" role="tab" aria-selected="${U.polka === s}" data-akcja="polka" data-polka="${s}">${n}<span class="polki-liczba">${liczby[s]}</span></button>`).join('')}</div>
  <div class="filtry">
    <label class="pole-szukaj">${I.szukaj}<input type="search" id="szukaj-bib" placeholder="Szukaj: tytuł, autor, tag" value="${esc(U.szukaj)}" aria-label="Szukaj w bibliotece"></label>
    <select id="sort-bib" aria-label="Sortowanie">${Object.entries(SORTY).map(([v, n]) => `<option value="${v}"${U.sort === v ? ' selected' : ''}>${n}</option>`).join('')}</select>
  </div>
  ${tagi.length ? `<div class="tagi-filtr">${tagi.map(t => `<button type="button" class="tag${U.tag === t ? ' wybrany' : ''}" data-akcja="tag" data-tag="${esc(t)}" aria-pressed="${U.tag === t}">${esc(t)}</button>`).join('')}</div>` : ''}
  <div id="siatka-bib">${htmlSiatki()}</div>`;
}

/* ================= widok: Statystyki ================= */
function wykresDni(m, cel) {
  const N = 30, W = 340, H = 150, D = 18, G = 12, dzis = dzisISO();
  const dane = Array.from({ length: N }, (_, i) => { const d = dodajDni(dzis, i - N + 1); return { d, v: m.get(d) || 0 }; });
  const max = Math.max(cel * 1.2, ...dane.map(x => x.v), 10);
  const wys = H - D - G, sz = W / N, y = v => G + wys - v / max * wys;
  const slupki = dane.map((x, i) => {
    const h = x.v / max * wys;
    return `<rect x="${(i * sz + 1.5).toFixed(1)}" y="${(G + wys - h).toFixed(1)}" width="${(sz - 3).toFixed(1)}" height="${(x.v ? Math.max(h, 2) : 0).toFixed(1)}" rx="1.5" class="sl${x.v >= cel ? ' sl-pelny' : ''}"><title>${dataKrotka(x.d)}: ${ile(x.v, FORMY_STRON)}</title></rect>`;
  }).join('');
  const podpisy = dane.map((x, i) => (N - 1 - i) % 7 === 0 ? `<text x="${(i * sz + sz / 2).toFixed(1)}" y="${H - 4}" text-anchor="middle" class="etykieta">${i === N - 1 ? 'dziś' : dataKrotka(x.d)}</text>` : '').join('');
  return `<svg class="wykres" viewBox="0 0 ${W} ${H}" role="img" aria-label="Strony dziennie przez ostatnie 30 dni">
    <line x1="0" x2="${W}" y1="${G + wys}" y2="${G + wys}" class="os"/>${slupki}
    <line x1="0" x2="${W}" y1="${y(cel).toFixed(1)}" y2="${y(cel).toFixed(1)}" class="linia-celu"/>
    <text x="2" y="${(y(cel) - 4).toFixed(1)}" class="etykieta">cel ${cel}</text>${podpisy}</svg>`;
}

function heatmapa(m, cel) {
  const T = 26, K = 11, O = 3, L = 18, G = 15, dzis = dzisISO();
  const start = dodajDni(dodajDni(dzis, -dzienTygodnia(dzis)), -(T - 1) * 7);
  let komorki = '', miesiace = '', ostM = '', ostX = -99;
  for (let t = 0; t < T; t++) {
    const tStart = dodajDni(start, t * 7), x = L + t * (K + O);
    const mies = tStart.slice(5, 7);
    if (mies !== ostM) {
      if (x - ostX > 28 && t < T - 1) { miesiace += `<text x="${x}" y="10" class="etykieta">${MIES_KR[+mies - 1]}</text>`; ostX = x; }
      ostM = mies;
    }
    for (let d = 0; d < 7; d++) {
      const iso = dodajDni(tStart, d);
      if (iso > dzis) continue;
      const v = m.get(iso) || 0;
      const p = v === 0 ? 0 : v < cel / 3 ? 1 : v < cel * 2 / 3 ? 2 : v < cel ? 3 : 4;
      komorki += `<rect x="${x}" y="${G + d * (K + O)}" width="${K}" height="${K}" rx="2" class="hm hm${p}${iso === dzis ? ' hm-dzis' : ''}"><title>${dataKrotka(iso)}: ${ile(v, FORMY_STRON)}</title></rect>`;
    }
  }
  const dni = [[0, 'pn'], [2, 'śr'], [4, 'pt'], [6, 'nd']].map(([d, t]) => `<text x="0" y="${G + d * (K + O) + K - 2}" class="etykieta">${t}</text>`).join('');
  const W = L + T * (K + O), H = G + 7 * (K + O);
  return `<svg class="wykres" viewBox="0 0 ${W} ${H}" role="img" aria-label="Dni czytania przez ostatnie 26 tygodni">${miesiace}${dni}${komorki}</svg>
    <p class="legenda" aria-hidden="true">mniej <span class="hm-p hm0"></span><span class="hm-p hm1"></span><span class="hm-p hm2"></span><span class="hm-p hm3"></span><span class="hm-p hm4"></span> cel zrobiony</p>`;
}

function wykresMiesiecy() {
  const u = Z.ustawienia, dzisM = dzisISO().slice(0, 7);
  const mies = [];
  for (let d = u.start.slice(0, 7) + '-01'; d.slice(0, 7) <= u.koniec.slice(0, 7) && mies.length < 24;) {
    mies.push(d.slice(0, 7));
    const [r, mm] = d.split('-').map(Number);
    d = mm === 12 ? `${r + 1}-01-01` : `${r}-${pad(mm + 1)}-01`;
  }
  const licz = Object.fromEntries(mies.map(x => [x, 0]));
  for (const { koniec } of ukonczenia(u.start, u.koniec)) if (koniec.slice(0, 7) in licz) licz[koniec.slice(0, 7)]++;
  const naMiesiac = u.cel / mies.length;
  const W = 340, H = 160, D = 18, G = 16, wys = H - D - G, sz = W / mies.length;
  const max = Math.max(naMiesiac * 1.3, ...Object.values(licz), 2);
  const y = v => G + wys - v / max * wys;
  const slupki = mies.map((x, i) => {
    const v = licz[x], h = v / max * wys, cx = i * sz + sz / 2;
    const kl = x > dzisM ? 'sl sl-przyszly' : x === dzisM ? 'sl sl-teraz' : 'sl';
    return `<rect x="${(i * sz + sz * 0.18).toFixed(1)}" y="${(G + wys - h).toFixed(1)}" width="${(sz * 0.64).toFixed(1)}" height="${(v ? Math.max(h, 2) : 0).toFixed(1)}" rx="2" class="${kl}"><title>${MIES_KR[+x.slice(5) - 1]} ${x.slice(0, 4)}: ${ile(v, FORMY_KSIAZEK)}</title></rect>
      ${v ? `<text x="${cx.toFixed(1)}" y="${(G + wys - h - 4).toFixed(1)}" text-anchor="middle" class="etykieta etykieta-mocna">${v}</text>` : ''}
      <text x="${cx.toFixed(1)}" y="${H - 4}" text-anchor="middle" class="etykieta${x === dzisM ? ' etykieta-mocna' : ''}">${MIES_KR[+x.slice(5) - 1]}</text>`;
  }).join('');
  return `<svg class="wykres" viewBox="0 0 ${W} ${H}" role="img" aria-label="Przeczytane książki w kolejnych miesiącach okresu celu">
    <line x1="0" x2="${W}" y1="${G + wys}" y2="${G + wys}" class="os"/>${slupki}
    <line x1="0" x2="${W}" y1="${y(naMiesiac).toFixed(1)}" y2="${y(naMiesiac).toFixed(1)}" class="linia-celu"/>
    <text x="${W - 2}" y="${(y(naMiesiac) - 4).toFixed(1)}" text-anchor="end" class="etykieta">plan ${ulamek(naMiesiac)} / mies.</text></svg>`;
}

function ranking(pary, pusty) {
  if (!pary.length) return `<p class="cichy">${pusty}</p>`;
  const max = pary[0][1];
  return `<ol class="ranking">${pary.map(([n, v]) => `<li><span class="ranking-nazwa">${esc(n)}</span><span class="ranking-liczba">${v}</span><span class="ranking-pasek" style="--w:${v / max * 100}%"></span></li>`).join('')}</ol>`;
}

function widokStatystyki() {
  const m = mapaDni(), u = Z.ustawienia;
  const przeczytane = Z.ksiazki.filter(k => k.status === 'przeczytana');
  if (!m.size && !przeczytane.length) {
    return `<section class="naglowek-widoku"><h1>Statystyki</h1></section>
      <div class="pusto-duze"><p>Statystyki pojawią się, gdy zapiszesz pierwsze przeczytane strony.</p>
      <p class="cichy">Na ekranie Dziś kliknij „Zapisz postęp” albo włącz sesję czytania.</p></div>`;
  }
  const cel = dziennyCel(m);
  const ukon = ukonczenia(u.start, u.koniec);
  let stronOkres = 0;
  for (const [d, v] of m) if (d >= u.start && d <= u.koniec) stronOkres += v;
  const tempo = tempoOgolne();
  const minutySesji = Z.ksiazki.reduce((s, k) => s + k.sesje.reduce((a, x) => a + x.minuty, 0), 0);
  const oceny = przeczytane.filter(k => k.ocena);
  const najDzien = [...m].sort((a, b) => b[1] - a[1])[0];
  const najdluzsza = [...przeczytane].sort((a, b) => b.strony - a.strony)[0];
  const szybkie = przeczytane.filter(k => k.start && k.koniec && k.strony >= 100).map(k => ({ k, dni: dniMiedzy(k.start, k.koniec) + 1 })).sort((a, b) => a.dni - b.dni)[0];
  const autorzy = {}, tagi = {};
  for (const k of przeczytane) {
    if (k.autor) autorzy[k.autor] = (autorzy[k.autor] || 0) + 1;
    for (const t of k.tagi) tagi[t] = (tagi[t] || 0) + 1;
  }
  const top = o => Object.entries(o).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'pl')).slice(0, 5);
  return `<section class="naglowek-widoku"><h1>Statystyki</h1></section>
  <dl class="liczby">
    <div><dt>Przeczytane w okresie celu</dt><dd>${ukon.length}<small> z ${u.cel}</small></dd></div>
    <div><dt>Strony w okresie celu</dt><dd>${liczba(stronOkres)}</dd></div>
    <div><dt>Średnio dziennie, 30 dni</dt><dd>${Math.round(sredniaDzienna(m, 30))}<small> str.</small></dd></div>
    <div><dt>Tempo z sesji</dt><dd>${tempo ? `${Math.round(tempo)}<small> str./h</small>` : '<small>brak sesji</small>'}</dd></div>
    <div><dt>Obecna seria</dt><dd>${seriaAktualna(m)}<small> ${odmiana(seriaAktualna(m), FORMY_DNI)}</small></dd></div>
    <div><dt>Najdłuższa seria</dt><dd>${najdluzszaSeria(m)}<small> ${odmiana(najdluzszaSeria(m), FORMY_DNI)}</small></dd></div>
  </dl>
  <section class="sekcja"><h2>Strony dziennie</h2><p class="cichy">Ostatnie 30 dni. Przerywana linia to dzienny cel, pełne słupki to dni z celem.</p>${wykresDni(m, cel)}</section>
  <section class="sekcja"><h2>Dni czytania</h2><p class="cichy">Ostatnie pół roku.</p>${heatmapa(m, cel)}</section>
  <section class="sekcja"><h2>Książki w miesiącach</h2><p class="cichy">Od ${dataDluga(u.start)} do ${dataDluga(u.koniec)}.</p>${wykresMiesiecy()}</section>
  <section class="sekcja"><h2>Rekordy</h2><dl class="rekordy">
    ${najDzien ? `<div><dt>Najlepszy dzień</dt><dd>${ile(najDzien[1], FORMY_STRON)}, ${dataDluga(najDzien[0])}</dd></div>` : ''}
    ${najdluzsza ? `<div><dt>Najdłuższa przeczytana</dt><dd>${esc(najdluzsza.tytul)}, ${ile(najdluzsza.strony, FORMY_STRON)}</dd></div>` : ''}
    ${szybkie ? `<div><dt>Najszybciej przeczytana</dt><dd>${esc(szybkie.k.tytul)}, ${ile(szybkie.dni, FORMY_DNI)}</dd></div>` : ''}
    ${minutySesji ? `<div><dt>Czas w sesjach</dt><dd>${czasCzytania(minutySesji / 60)}</dd></div>` : ''}
    ${oceny.length ? `<div><dt>Średnia ocena</dt><dd>${ulamek(oceny.reduce((s, k) => s + k.ocena, 0) / oceny.length)} na 5</dd></div>` : ''}
    <div><dt>Przeczytane ogółem</dt><dd>${ile(przeczytane.length, FORMY_KSIAZEK)}, ${ile(przeczytane.reduce((s, k) => s + k.strony, 0), FORMY_STRON)}</dd></div>
  </dl></section>
  <section class="sekcja dwie"><div><h2>Autorzy</h2>${ranking(top(autorzy), 'Pojawią się po przeczytaniu kilku książek.')}</div>
    <div><h2>Tagi</h2>${ranking(top(tagi), 'Dodawaj tagi do książek, np. historia albo reportaż.')}</div></section>`;
}

/* ================= widok: Cytaty ================= */
function htmlCytatow() {
  const q = U.szukajCytat.trim().toLowerCase();
  const lista = Z.ksiazki.flatMap(k => k.cytaty.map(c => ({ c, k })))
    .filter(({ c, k }) => !q || `${c.tekst} ${k.tytul} ${k.autor}`.toLowerCase().includes(q))
    .sort((a, b) => b.c.data.localeCompare(a.c.data) || (b.c.strona || 0) - (a.c.strona || 0));
  if (!lista.length) return '<p class="pusto">Nic nie pasuje do wyszukiwania.</p>';
  return lista.map(({ c, k }) => `<article class="cytat${c.notatka ? ' cytat-notatka' : ''}">
    ${c.notatka ? '<p class="cytat-rodzaj">Moja notatka</p>' : ''}
    <blockquote>${esc(c.tekst)}</blockquote>
    <footer><span class="cytat-zrodlo"><button type="button" class="btn-tekst" data-akcja="ksiazka" data-id="${k.id}">${esc(k.tytul)}</button>${c.strona ? `, s. ${c.strona}` : ''}</span>
      <span class="cytat-akcje">
        <button type="button" class="btn-ikona maly" data-akcja="cytat-kopiuj" data-id="${k.id}" data-cid="${c.id}" aria-label="Kopiuj">${I.kopiuj}</button>
        ${navigator.share ? `<button type="button" class="btn-ikona maly" data-akcja="cytat-udostepnij" data-id="${k.id}" data-cid="${c.id}" aria-label="Udostępnij">${I.udostepnij}</button>` : ''}
        <button type="button" class="btn-ikona maly" data-akcja="cytat-edytuj" data-id="${k.id}" data-cid="${c.id}" aria-label="Edytuj">${I.edytuj}</button>
      </span></footer>
  </article>`).join('');
}

function widokCytaty() {
  const ileC = Z.ksiazki.reduce((s, k) => s + k.cytaty.length, 0);
  if (!ileC) {
    return `<section class="naglowek-widoku"><h1>Cytaty i notatki</h1></section>
      <div class="pusto-duze"><p>Tu zbierają się zdania, które chcesz zapamiętać.</p>
      <p class="cichy">Otwórz książkę i kliknij „Dodaj cytat”. Możesz też zapisać własną myśl z numerem strony.</p></div>`;
  }
  return `<section class="naglowek-widoku"><h1>Cytaty i notatki</h1><span class="licznik">${ileC}</span></section>
    <label class="pole-szukaj">${I.szukaj}<input type="search" id="szukaj-cyt" placeholder="Szukaj w cytatach" value="${esc(U.szukajCytat)}" aria-label="Szukaj w cytatach"></label>
    <div id="lista-cyt" class="lista-cytatow">${htmlCytatow()}</div>`;
}

/* ================= widok: Ustawienia ================= */
function widokUstawienia() {
  const u = Z.ustawienia;
  const ios = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  const ost = lsGet('zakladka-kopia');
  const auto = (() => { const g = postepCelu(); return g.zostalo && !g.przedStartem && !g.poKoncu ? g.stronDziennie : 30; })();
  return `<section class="naglowek-widoku"><h1>Ustawienia</h1></section>
  <form id="f-ustawienia" class="formularz grupa" novalidate>
    <h2>Cel roczny</h2>
    <div class="f-rzad"><label>Ile książek<input name="cel" type="number" inputmode="numeric" min="1" value="${u.cel}" required></label>
      <label>Średnio stron w książce<input name="srednia" type="number" inputmode="numeric" min="20" value="${u.srednia}" required></label></div>
    <div class="f-rzad"><label>Od<input name="start" type="date" value="${u.start}" required></label>
      <label>Do<input name="koniec" type="date" value="${u.koniec}" required></label></div>
    <label>Dzienny cel stron<input name="dziennyCel" type="number" inputmode="numeric" min="0" value="${u.dziennyCel || ''}" placeholder="Automatycznie: ${auto}"></label>
    <p class="podpowiedz">Zostaw puste, a dzienny cel wyliczy się z celu rocznego.</p>
    <label>Imię do powitania<input name="imie" value="${esc(u.imie)}" autocomplete="given-name" maxlength="40"></label>
    <div class="przyciski"><button type="submit" class="btn btn-glowny">Zapisz ustawienia</button></div>
  </form>
  <section class="grupa"><h2>Wygląd</h2>
    <fieldset class="segment"><legend class="sr">Motyw</legend>${radio('motyw', 'auto', 'Jak w systemie', u.motyw === 'auto')}${radio('motyw', 'jasny', 'Jasny', u.motyw === 'jasny')}${radio('motyw', 'ciemny', 'Ciemny', u.motyw === 'ciemny')}</fieldset>
  </section>
  <section class="grupa"><h2>Telefon</h2>
    <p>${standalone ? 'Zakładka działa jako zainstalowana aplikacja.'
      : U.instalacja ? 'Zainstaluj Zakładkę, żeby otwierała się jak zwykła aplikacja i działała bez internetu.'
      : ios ? 'Na iPhonie: w Safari kliknij Udostępnij, a potem „Do ekranu początkowego”.'
      : 'W Chrome otwórz menu i wybierz „Zainstaluj aplikację” albo „Dodaj do ekranu głównego”.'}</p>
    ${U.instalacja && !standalone ? '<div class="przyciski"><button type="button" class="btn btn-glowny" data-akcja="instaluj">Zainstaluj aplikację</button></div>' : ''}
    <p id="stan-pamieci" class="cichy">Sprawdzam pamięć urządzenia…</p>
    <div class="przyciski" id="pamiec-przycisk" hidden><button type="button" class="btn" data-akcja="pamiec">Poproś o trwałą pamięć</button></div>
  </section>
  <section class="grupa"><h2>Kopia zapasowa</h2>
    <p class="cichy">Książki są zapisane tylko na tym urządzeniu. Kopia chroni je przy zmianie telefonu albo czyszczeniu przeglądarki. ${ost ? `Ostatnia kopia: ${dataDluga(ost)}.` : 'Nie zrobiłeś jeszcze kopii.'}</p>
    <div class="przyciski"><button type="button" class="btn btn-glowny" data-akcja="kopia">${I.pobierz}Zrób kopię</button>
      <button type="button" class="btn" data-akcja="import-json">${I.wgraj}Wczytaj kopię</button></div>
  </section>
  <section class="grupa"><h2>Goodreads</h2>
    <p class="cichy">Na Goodreads wejdź w My Books, potem Import and export i Export Library. Pobrany plik CSV wczytasz tutaj. Książki, które już masz, zostaną pominięte.</p>
    <div class="przyciski"><button type="button" class="btn" data-akcja="import-goodreads">${I.wgraj}Importuj CSV</button>
      <button type="button" class="btn" data-akcja="eksport-csv">${I.pobierz}Eksportuj CSV</button></div>
  </section>
  <section class="grupa grupa-ryzyko"><h2>Usuwanie danych</h2>
    <p class="cichy">Usuwa wszystkie książki, cytaty i ustawienia z tego urządzenia. Zrób wcześniej kopię.</p>
    <div class="przyciski"><button type="button" class="btn btn-ryzyko" data-akcja="usun-wszystko">Usuń wszystkie dane</button></div>
  </section>
  <p class="stopka">${LOGO}Zakładka ${WERSJA}. Twoje książki zostają na tym urządzeniu.</p>`;
}

async function pokazStanPamieci() {
  const el = $('#stan-pamieci');
  if (!el) return;
  if (!navigator.storage || !navigator.storage.persisted) {
    el.textContent = 'Ta przeglądarka nie pokazuje stanu pamięci. Rób regularnie kopie zapasowe.';
    return;
  }
  try {
    const trwala = await navigator.storage.persisted();
    let t = trwala
      ? 'Trwała pamięć jest włączona: system nie usunie danych, gdy zabraknie miejsca.'
      : 'Pamięć nie jest trwała: przy braku miejsca system może usunąć dane.';
    if (navigator.storage.estimate) {
      const { usage } = await navigator.storage.estimate();
      t += ` Zajęte: ${usage > 1048576 ? ulamek(usage / 1048576) + ' MB' : Math.max(1, Math.round(usage / 1024)) + ' KB'}.`;
    }
    el.textContent = t;
    const p = $('#pamiec-przycisk');
    if (p) p.hidden = trwala;
  } catch {
    el.textContent = 'Nie udało się sprawdzić pamięci.';
  }
}

/* ================= render główny ================= */
const WIDOKI = { dzis: widokDzis, biblioteka: widokBiblioteka, statystyki: widokStatystyki, cytaty: widokCytaty, ustawienia: widokUstawienia };
const NAWIGACJA = [['dzis', 'Dziś'], ['biblioteka', 'Biblioteka'], ['statystyki', 'Statystyki'], ['cytaty', 'Cytaty'], ['ustawienia', 'Ustawienia']];

function renderNawigacja() {
  $('#nawigacja').innerHTML = NAWIGACJA.map(([w, n]) =>
    `<button type="button" data-akcja="idz" data-widok="${w}"${U.widok === w ? ' aria-current="page"' : ''}>${I[w]}<span>${n}</span></button>`).join('');
}

function renderWidok() {
  const el = $('#widok');
  el.innerHTML = WIDOKI[U.widok]();
  el.dataset.widok = U.widok;
  renderNawigacja();
  if (U.widok === 'ustawienia') pokazStanPamieci();
  U.pierwszyRender = false;
}

function idz(widok, polka) {
  U.widok = widok;
  if (polka) { U.polka = polka; U.tag = null; U.sort = 'domyslnie'; }
  lsSet('zakladka-widok', widok);
  renderWidok();
  window.scrollTo({ top: 0 });
  $('#widok').focus({ preventScroll: true });
}

/* ================= arkusz: szczegóły książki ================= */
function htmlKsiazki(k) {
  const proc = k.strona / k.strony * 100;
  const tempo = tempoKsiazki(k);
  const tempoDoKonca = tempo || tempoOgolne();
  const prog = k.status === 'czytam' ? prognozaKsiazki(k) : null;
  const dniCzytania = new Set(k.log.map(w => w.data)).size;
  const minuty = k.sesje.reduce((s, x) => s + x.minuty, 0);
  const lista = kolejka();
  const nr = lista.indexOf(k);
  const p = k.bazowa ? planBazowej(k) : null;

  let akcje = '';
  if (k.status === 'czytam') {
    akcje = `<button type="button" class="btn btn-glowny" data-akcja="postep" data-id="${k.id}">Zapisz postęp</button>
      <button type="button" class="btn" data-akcja="sesja" data-id="${k.id}">${I.zegar}Sesja</button>
      <button type="button" class="btn" data-akcja="skonczona" data-id="${k.id}">${I.check}Skończona</button>
      ${k.bazowa ? `<button type="button" class="btn" data-akcja="bazowa" data-id="${k.id}">Zmień termin</button>
        <button type="button" class="btn-tekst" data-akcja="zdejmij-bazowa" data-id="${k.id}">Przestań traktować jako bazową</button>`
        : `<button type="button" class="btn" data-akcja="bazowa" data-id="${k.id}">Ustaw jako bazową</button>`}
      <button type="button" class="btn-tekst" data-akcja="porzuc" data-id="${k.id}">Porzuć</button>`;
  } else if (k.status === 'doPrzeczytania') {
    akcje = `<button type="button" class="btn btn-glowny" data-akcja="zacznij" data-id="${k.id}">Zacznij czytać</button>
      <button type="button" class="btn" data-akcja="bazowa" data-id="${k.id}">Zacznij jako bazową</button>
      <span class="kolejka-ster" role="group" aria-label="Pozycja w kolejce">
        <button type="button" class="btn-ikona" data-akcja="kolejka" data-id="${k.id}" data-kierunek="-1" aria-label="Wyżej w kolejce"${nr <= 0 ? ' disabled' : ''}>${I.gora}</button>
        <button type="button" class="btn-ikona" data-akcja="kolejka" data-id="${k.id}" data-kierunek="1" aria-label="Niżej w kolejce"${nr >= lista.length - 1 ? ' disabled' : ''}>${I.dol}</button>
        ${nr > 0 ? `<button type="button" class="btn-tekst" data-akcja="na-poczatek" data-id="${k.id}">Na początek</button>` : ''}
      </span>`;
  } else if (k.status === 'przeczytana') {
    akcje = `<button type="button" class="btn" data-akcja="ponownie" data-id="${k.id}">Przeczytaj ponownie</button>`;
  } else {
    akcje = `<button type="button" class="btn btn-glowny" data-akcja="wznow" data-id="${k.id}">Wróć do czytania</button>`;
  }

  const cytaty = [...k.cytaty].sort((a, b) => (a.strona || 0) - (b.strona || 0));
  return `<div class="kd-gora">${okladka(k, 'l')}
    <div class="kd-meta">
      <p class="kd-status">${esc(statusKsiazki(k))}</p>
      <h2 class="kd-tytul">${esc(k.tytul)}</h2>
      ${k.autor ? `<p class="kd-autor">${esc(k.autor)}</p>` : ''}
      <p class="kd-szczegoly">${ile(k.strony, FORMY_STRON)}, ${FORMATY[k.format].toLowerCase()}${k.isbn ? `, ISBN ${esc(k.isbn)}` : ''}</p>
      ${k.tagi.length ? `<p class="kd-tagi">${k.tagi.map(t => `<span class="tag">${esc(t)}</span>`).join('')}</p>` : ''}
    </div></div>
  ${k.status === 'czytam' ? `<div class="kd-postep">
    <p class="kd-strona"><span>Strona <strong>${k.strona}</strong> z ${k.strony}</span><span>${Math.floor(proc)}%</span></p>
    ${pasek(proc, { plan: p ? p.planDzis / k.strony * 100 : null })}
    <p class="cichy">${[
      p ? `Termin ${dataDluga(k.celData)}, dziś norma ${ile(p.norma, FORMY_STRON)}` : '',
      prog ? `przy obecnym tempie skończysz ok. ${dataDluga(prog, false)}` : '',
      tempoDoKonca ? `zostało ok. ${czasCzytania((k.strony - k.strona) / tempoDoKonca)} czytania` : ''
    ].filter(Boolean).join(', ').replace(/^./, c => c.toUpperCase()) || 'Zapisuj postęp, a pokażę, kiedy skończysz.'}</p></div>` : ''}
  ${k.status === 'przeczytana' ? `<div class="kd-ocena"><p>Twoja ocena</p>${gwiazdki(k)}</div>` : ''}
  <div class="przyciski kd-akcje">${akcje}</div>
  ${k.status === 'przeczytana' || k.recenzja ? `<label class="kd-recenzja">Twoje wrażenia<textarea name="recenzja" rows="3" placeholder="Co zostanie ci z tej książki?">${esc(k.recenzja)}</textarea></label>` : ''}
  <section class="kd-sekcja">
    <div class="sekcja-gora"><h3>Cytaty i notatki</h3><button type="button" class="btn btn-maly" data-akcja="cytat-dodaj" data-id="${k.id}">${I.plus}Dodaj cytat</button></div>
    ${cytaty.length ? cytaty.map(c => `<article class="cytat${c.notatka ? ' cytat-notatka' : ''}">
      ${c.notatka ? '<p class="cytat-rodzaj">Moja notatka</p>' : ''}<blockquote>${esc(c.tekst)}</blockquote>
      <footer><span class="cichy">${c.strona ? `s. ${c.strona}, ` : ''}${dataKrotka(c.data)}</span>
      <span class="cytat-akcje"><button type="button" class="btn-ikona maly" data-akcja="cytat-kopiuj" data-id="${k.id}" data-cid="${c.id}" aria-label="Kopiuj">${I.kopiuj}</button>
      <button type="button" class="btn-ikona maly" data-akcja="cytat-edytuj" data-id="${k.id}" data-cid="${c.id}" aria-label="Edytuj">${I.edytuj}</button></span></footer></article>`).join('')
      : '<p class="cichy">Zapisz zdanie, które chcesz zapamiętać, albo własną myśl z numerem strony.</p>'}
  </section>
  <section class="kd-sekcja"><h3>Historia</h3><dl class="rekordy">
    <div><dt>Dodana</dt><dd>${dataDluga(k.dodano)}</dd></div>
    ${k.start ? `<div><dt>Zaczęta</dt><dd>${dataDluga(k.start)}</dd></div>` : ''}
    ${k.koniec && k.status === 'przeczytana' ? `<div><dt>Skończona</dt><dd>${dataDluga(k.koniec)}${k.start ? `, po ${ile(dniMiedzy(k.start, k.koniec) + 1, FORMY_DNI)}` : ''}</dd></div>` : ''}
    ${dniCzytania ? `<div><dt>Dni z czytaniem</dt><dd>${dniCzytania}</dd></div>` : ''}
    ${k.sesje.length ? `<div><dt>Sesje</dt><dd>${k.sesje.length}, razem ${czasCzytania(minuty / 60)}</dd></div>` : ''}
    ${tempo ? `<div><dt>Tempo</dt><dd>${Math.round(tempo)} str./h</dd></div>` : ''}
    ${k.czytania.length ? `<div><dt>Wcześniej przeczytana</dt><dd>${k.czytania.map(c => dataDluga(c.koniec)).join(', ')}</dd></div>` : ''}
  </dl></section>
  <div class="kd-dol"><button type="button" class="btn" data-akcja="edytuj" data-id="${k.id}">${I.edytuj}Edytuj</button>
    <button type="button" class="btn btn-ryzyko" data-akcja="usun" data-id="${k.id}">${I.kosz}Usuń</button></div>`;
}

function arkuszKsiazki(id) {
  const k = znajdz(id);
  if (!k) return;
  const a = arkusz({ tytul: k.tytul, ukryjTytul: true, klasa: 'arkusz-ksiazka', odswiezalny: true, ksiazkaId: id, render: () => htmlKsiazki(znajdz(id)) });
  a.tresc.addEventListener('change', e => {
    if (e.target.name !== 'recenzja') return;
    const kk = znajdz(id);
    kk.recenzja = e.target.value.trim();
    utrwal(kk);
    toast('Zapisano wrażenia.');
  });
}

/* ================= arkusz: dodawanie i edycja ================= */
function arkuszFormularza(id = null, { jako = 'doPrzeczytania' } = {}) {
  const edytowana = id ? znajdz(id) : null;
  const k = edytowana || { tytul: '', autor: '', strony: '', isbn: '', format: 'papier', tagi: [], okladka: null };
  let okl = k.okladka;
  let wyniki = [];
  const a = arkusz({
    tytul: edytowana ? 'Edytuj książkę' : 'Dodaj książkę',
    render: () => `<form class="formularz" novalidate>
      ${edytowana ? '' : `<div class="szukajka">
        <label for="f-q">Znajdź w internecie</label>
        <div class="szukajka-rzad"><input id="f-q" type="search" placeholder="Tytuł, autor albo ISBN" enterkeyhint="search" autocomplete="off">
          <button type="button" class="btn" data-szukaj>${I.szukaj}<span class="sr">Szukaj</span></button>
          ${U.skaner ? `<button type="button" class="btn" data-skanuj aria-label="Skanuj kod kreskowy">${I.skaner}</button>` : ''}</div>
        <div class="wyniki" aria-live="polite"></div>
        <p class="podpowiedz">Albo wpisz dane ręcznie poniżej.</p>
      </div>`}
      <div class="f-okladka"><div class="f-okl-podglad"></div>
        <div class="f-okl-akcje"><label class="btn">${I.aparat}Zdjęcie okładki<input type="file" accept="image/*" data-plik class="sr"></label>
          <button type="button" class="btn-tekst" data-bez-okladki>Bez okładki</button></div></div>
      <label>Tytuł<input name="tytul" value="${esc(k.tytul)}" required autocomplete="off"${edytowana ? ' autofocus' : ''}></label>
      <label>Autor<input name="autor" value="${esc(k.autor)}" autocomplete="off"></label>
      <div class="f-rzad"><label>Liczba stron<input name="strony" type="number" inputmode="numeric" min="1" value="${esc(k.strony)}" required></label>
        <label>ISBN<input name="isbn" inputmode="numeric" value="${esc(k.isbn)}" autocomplete="off"></label></div>
      <fieldset class="segment"><legend>Format</legend>${Object.entries(FORMATY).map(([v, n]) => radio('format', v, n, k.format === v)).join('')}</fieldset>
      <p class="podpowiedz f-audio"${k.format === 'audio' ? '' : ' hidden'}>Przy audiobooku wpisz liczbę stron wydania papierowego, a postęp zapisuj w stronach albo procentach tej liczby.</p>
      <label>Tagi<input name="tagi" value="${esc(k.tagi.join(', '))}" placeholder="np. historia, reportaż" autocomplete="off"></label>
      <p class="podpowiedz">Oddziel przecinkami.</p>
      ${edytowana ? '' : `<fieldset class="segment"><legend>Gdzie odłożyć</legend>
        ${radio('gdzie', 'doPrzeczytania', 'Do przeczytania', jako === 'doPrzeczytania')}${radio('gdzie', 'czytam', 'Czytam teraz', jako === 'czytam')}${radio('gdzie', 'bazowa', 'Jako bazową', jako === 'bazowa')}</fieldset>
        <label class="f-miesiace"${jako === 'bazowa' ? '' : ' hidden'}>Na ile miesięcy?<input name="miesiace" type="number" inputmode="decimal" min="0.5" step="0.5" value="2"></label>`}
      <p class="blad" hidden></p>
      <div class="przyciski przyciski-koniec"><button type="button" class="btn" data-zamknij>Anuluj</button>
        <button type="submit" class="btn btn-glowny">${edytowana ? 'Zapisz zmiany' : 'Dodaj książkę'}</button></div>
    </form>`
  });
  const f = $('form', a.tresc);
  const el = n => f.elements.namedItem(n);
  const podglad = () => {
    $('.f-okl-podglad', f).innerHTML = okladka({ tytul: el('tytul').value || 'Tytuł', autor: el('autor').value, okladka: okl }, 'l');
    $('[data-bez-okladki]', f).hidden = !okl;
  };
  podglad();
  ['tytul', 'autor'].forEach(n => el(n).addEventListener('input', () => { if (!okl) podglad(); }));

  const pokazBlad = t => { const b = $('.blad', f); b.textContent = t; b.hidden = !t; };

  async function szukaj() {
    const q = $('#f-q', f).value.trim();
    const box = $('.wyniki', f);
    if (!q) { $('#f-q', f).focus(); return; }
    if (!navigator.onLine) { box.innerHTML = '<p class="cichy">Jesteś offline. Wpisz dane ręcznie albo spróbuj, gdy wróci internet.</p>'; return; }
    box.innerHTML = '<p class="cichy ladowanie">Szukam…</p>';
    try {
      wyniki = await Wyszukiwarka.szukaj(q);
      box.innerHTML = wyniki.length
        ? `<ul class="wyniki-lista">${wyniki.slice(0, 12).map((w, i) => `<li><button type="button" class="wynik" data-wynik="${i}">
            ${okladka({ tytul: w.tytul, autor: w.autor, okladka: w.okladka }, 's')}
            <span class="wiersz-tekst"><span class="wiersz-tytul">${esc(w.tytul)}</span>
            <span class="wiersz-autor">${esc([w.autor, w.rok, w.strony ? ile(w.strony, FORMY_STRON) : ''].filter(Boolean).join(', '))}</span></span></button></li>`).join('')}</ul>`
        : '<p class="cichy">Nic nie znalazłem. Sprawdź pisownię albo wpisz dane ręcznie.</p>';
    } catch (e) {
      console.warn(e);
      box.innerHTML = '<p class="cichy">Wyszukiwarka nie odpowiada. Wpisz dane ręcznie.</p>';
    }
  }

  f.addEventListener('click', async e => {
    if (e.target.closest('[data-szukaj]')) szukaj();
    if (e.target.closest('[data-skanuj]')) arkuszSkanera(kod => { $('#f-q', f).value = kod; el('isbn').value = kod; szukaj(); });
    if (e.target.closest('[data-bez-okladki]')) { okl = null; podglad(); }
    const w = e.target.closest('[data-wynik]');
    if (w) {
      const r = wyniki[+w.dataset.wynik];
      el('tytul').value = r.tytul;
      el('autor').value = r.autor;
      if (r.strony) el('strony').value = r.strony;
      if (r.isbn) el('isbn').value = r.isbn;
      okl = r.okladka;
      podglad();
      $('.wyniki', f).innerHTML = `<p class="ok">Wybrano: ${esc(r.tytul)}.${r.strony ? '' : ' Uzupełnij liczbę stron.'}</p>`;
      if (!r.strony) el('strony').focus();
      if (r.okladka) {
        const zapisana = await urlNaOkladke(r.okladka);
        if (okl === r.okladka) { okl = zapisana; }
      }
    }
  });
  $('#f-q', f)?.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); szukaj(); } });
  $('[data-plik]', f).addEventListener('change', async e => {
    const plik = e.target.files[0];
    if (!plik) return;
    try { okl = await plikNaOkladke(plik); podglad(); } catch { toast('Nie udało się wczytać zdjęcia.', { typ: 'blad' }); }
  });
  f.addEventListener('change', e => {
    if (e.target.name === 'gdzie') $('.f-miesiace', f).hidden = e.target.value !== 'bazowa';
    if (e.target.name === 'format') $('.f-audio', f).hidden = e.target.value !== 'audio';
  });

  f.addEventListener('submit', async e => {
    e.preventDefault();
    const tytul = el('tytul').value.trim();
    const strony = Math.round(+el('strony').value);
    if (!tytul) { pokazBlad('Wpisz tytuł.'); el('tytul').focus(); return; }
    if (!(strony >= 1)) { pokazBlad('Wpisz liczbę stron.'); el('strony').focus(); return; }
    const dane = {
      tytul, autor: el('autor').value.trim(), strony, isbn: el('isbn').value.replace(/[^\dXx]/g, ''),
      format: f.elements.format.value, tagi: el('tagi').value.split(',').map(t => t.trim().toLowerCase()).filter(Boolean), okladka: okl
    };
    if (edytowana) {
      Object.assign(edytowana, dane, { tagi: [...new Set(dane.tagi)] });
      edytowana.strona = Math.min(edytowana.strona, strony);
      if (edytowana.status === 'przeczytana') edytowana.strona = strony;
      utrwal(edytowana);
      a.zamknij();
      odswiez();
      toast('Zapisano zmiany.');
      return;
    }
    const klucz = (tytul + dane.autor).toLowerCase();
    if (Z.ksiazki.some(x => (x.tytul + x.autor).toLowerCase() === klucz)
      && !(await potwierdz(`„${esc(tytul)}” jest już w bibliotece. Dodać drugi egzemplarz?`, { tytul: 'Ta książka już jest', tak: 'Dodaj mimo to' }))) return;
    const nowa = nowaKsiazka(dane);
    let zmienione = [nowa];
    const gdzie = f.elements.gdzie.value;
    if (gdzie === 'czytam') zacznijCzytac(nowa);
    if (gdzie === 'bazowa') {
      const mies = Math.max(0.5, parseFloat(String(el('miesiace').value).replace(',', '.')) || 2);
      zmienione = ustawBazowa(nowa, dodajDni(dzisISO(), Math.round(mies * 30.44) - 1));
    }
    await utrwal(zmienione);
    a.zamknij();
    if (U.widok === 'biblioteka') U.polka = nowa.status;
    odswiez();
    toast(`Dodano „${nowa.tytul}”.`);
  });
  if (!edytowana) setTimeout(() => $('#f-q', f).focus(), 80);
}

/* ================= arkusz: postęp ================= */
function arkuszPostepu(id) {
  const k = znajdz(id);
  if (!k) return;
  const a = arkusz({
    tytul: 'Zapisz postęp', klasa: 'arkusz-maly',
    render: () => `<form class="formularz" novalidate>
      <div class="postep-ksiazka">${okladka(k, 's')}<span class="wiersz-tekst"><span class="wiersz-tytul">${esc(k.tytul)}</span><span class="wiersz-autor">Teraz strona ${k.strona} z ${k.strony}</span></span></div>
      <label class="pole-duze"><span>Jestem na stronie</span><input name="strona" type="number" inputmode="numeric" min="0" max="${k.strony}" value="${k.strona || ''}" placeholder="${k.strona}" autofocus></label>
      <div class="szybkie" role="group" aria-label="Dodaj strony">${[5, 10, 25, 50].map(n => `<button type="button" class="chip" data-plus="${n}">+${n}</button>`).join('')}
        <button type="button" class="chip" data-koniec>Ostatnia strona</button></div>
      <fieldset class="segment"><legend>Kiedy czytałeś</legend>${radio('kiedy', 'dzis', 'Dziś', true)}${radio('kiedy', 'wczoraj', 'Wczoraj')}${radio('kiedy', 'inny', 'Inny dzień')}</fieldset>
      <label class="f-data" hidden>Data<input type="date" name="data" max="${dzisISO()}" value="${dodajDni(dzisISO(), -2)}"></label>
      <p class="podsumowanie" aria-live="polite">&nbsp;</p>
      <div class="przyciski przyciski-koniec"><button type="button" class="btn" data-zamknij>Anuluj</button><button type="submit" class="btn btn-glowny">Zapisz</button></div>
    </form>`
  });
  const f = $('form', a.tresc), pole = f.elements.namedItem('strona');
  const podsum = () => {
    const v = Math.round(+pole.value), r = v - k.strona;
    $('.podsumowanie', f).textContent = pole.value === '' || !Number.isFinite(v) ? ' '
      : v >= k.strony ? 'To koniec książki.'
      : r > 0 ? `+${ile(r, FORMY_STRON)}`
      : r < 0 ? `Poprawka: ${ile(r, FORMY_STRON)}` : 'Bez zmian.';
  };
  pole.addEventListener('input', podsum);
  f.addEventListener('click', e => {
    const b = e.target.closest('[data-plus]');
    if (b) { pole.value = Math.min(k.strony, (+pole.value || k.strona) + +b.dataset.plus); podsum(); }
    if (e.target.closest('[data-koniec]')) { pole.value = k.strony; podsum(); }
  });
  f.addEventListener('change', e => { if (e.target.name === 'kiedy') $('.f-data', f).hidden = e.target.value !== 'inny'; });
  f.addEventListener('submit', e => {
    e.preventDefault();
    if (pole.value === '') { pole.focus(); return; }
    const kiedy = f.elements.kiedy.value;
    let data = kiedy === 'dzis' ? dzisISO() : kiedy === 'wczoraj' ? dodajDni(dzisISO(), -1) : f.elements.namedItem('data').value;
    if (!poprawnaData(data) || data > dzisISO()) data = dzisISO();
    const { roznica, skonczona } = ustawStrone(k, pole.value, data);
    utrwal(k);
    a.zamknij();
    odswiez();
    if (skonczona) celebracja(k.id);
    else if (roznica > 0) toast(`Zapisano: +${ile(roznica, FORMY_STRON)}${data !== dzisISO() ? ` (${dataKrotka(data)})` : ''}.`);
    else if (roznica < 0) toast('Poprawiono stronę.');
  });
  setTimeout(() => { pole.focus(); pole.select(); }, 80);
}

/* ================= sesja czytania ================= */
const sesjaAktywna = () => { try { return JSON.parse(lsGet('zakladka-sesja') || 'null'); } catch { return null; } };
function stoper(ms) {
  const s = Math.max(0, Math.floor(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60);
  return h ? `${h}:${pad(m)}:${pad(s % 60)}` : `${pad(m)}:${pad(s % 60)}`;
}

function otworzSesje(id) {
  let s = sesjaAktywna();
  if (s && !znajdz(s.id)) { lsSet('zakladka-sesja', null); s = null; }
  if (s && s.id !== id) {
    potwierdz(`Trwa sesja z „${esc(znajdz(s.id).tytul)}”. Zakończ ją, zanim zaczniesz kolejną.`, { tytul: 'Sesja w toku', tak: 'Pokaż sesję' })
      .then(ok => ok && arkuszSesji(s.id));
    return;
  }
  if (!s) {
    const k = znajdz(id);
    if (k.status !== 'czytam') { zacznijCzytac(k); utrwal(k); odswiez(); }
    lsSet('zakladka-sesja', JSON.stringify({ id, start: Date.now(), strona: k.strona }));
  }
  arkuszSesji(id);
}

function arkuszSesji(id) {
  const k = znajdz(id), s = sesjaAktywna();
  if (!k || !s) return;
  let blokada = null;
  const zwolnij = () => { if (blokada) { blokada.release().catch(() => {}); blokada = null; } };
  const godzina = new Date(s.start).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
  const a = arkusz({
    tytul: 'Sesja czytania', klasa: 'arkusz-sesja', onZamknij: () => { clearInterval(t); zwolnij(); },
    render: () => `<div class="sesja">
      ${okladka(k, 'l')}
      <p class="sesja-tytul">${esc(k.tytul)}</p>
      <p class="sesja-czas" data-czas role="timer" aria-live="off">${stoper(Date.now() - s.start)}</p>
      <p class="sesja-start">Od ${godzina}, start na stronie ${s.strona}</p>
      ${'wakeLock' in navigator ? '<label class="przelacznik"><input type="checkbox" data-blokada> Nie wygaszaj ekranu</label>' : ''}
      <form class="formularz sesja-koniec" novalidate>
        <label class="pole-duze"><span>Skończyłem na stronie</span><input name="strona" type="number" inputmode="numeric" min="0" max="${k.strony}" value="${k.strona}"></label>
        <div class="przyciski"><button type="submit" class="btn btn-zloty">Zakończ sesję</button>
          <button type="button" class="btn btn-na-plotnie" data-zamknij>Zwiń</button>
          <button type="button" class="btn-tekst" data-odrzuc>Odrzuć sesję</button></div>
      </form></div>`
  });
  const czas = $('[data-czas]', a.tresc);
  const t = setInterval(() => { czas.textContent = stoper(Date.now() - s.start); }, 1000);
  $('[data-blokada]', a.tresc)?.addEventListener('change', async e => {
    if (e.target.checked) {
      try {
        blokada = await navigator.wakeLock.request('screen');
        blokada.addEventListener('release', () => { if (!a.zamkniety) e.target.checked = false; });
      } catch { e.target.checked = false; toast('Telefon nie pozwolił zablokować wygaszania.'); }
    } else zwolnij();
  });
  $('[data-odrzuc]', a.tresc).addEventListener('click', async () => {
    if (!(await potwierdz('Sesja nie zostanie zapisana.', { tytul: 'Odrzucić sesję?', tak: 'Odrzuć', niebezpieczne: true }))) return;
    lsSet('zakladka-sesja', null);
    a.zamknij();
    toast('Odrzucono sesję.');
  });
  $('form', a.tresc).addEventListener('submit', e => {
    e.preventDefault();
    const wartosc = e.target.elements.namedItem('strona').value;
    lsSet('zakladka-sesja', null);
    a.zamknij();
    zakonczSesje(k, s, wartosc === '' ? k.strona : wartosc);
  });
  renderPigulka();
}

function zakonczSesje(k, s, wartosc) {
  const minuty = Math.max(1, Math.round((Date.now() - s.start) / 60000));
  const { skonczona } = ustawStrone(k, wartosc, dzisISO());
  const strony = Math.max(0, k.strona - s.strona);
  k.sesje.push({ data: dzisISO(), minuty, strony });
  utrwal(k);
  odswiez();
  toast(`Sesja: ${minuty} min, ${ile(strony, FORMY_STRON)}${strony && minuty >= 5 ? `, ${Math.round(strony / minuty * 60)} str./h` : ''}.`);
  if (skonczona) celebracja(k.id);
}

function renderPigulka() {
  const el = $('#pigulka');
  const s = sesjaAktywna();
  const k = s && znajdz(s.id);
  const widoczna = !!k && !otwarte.some(a => a.el.classList.contains('arkusz-sesja'));
  el.hidden = !widoczna;
  document.body.classList.toggle('z-pigulka', widoczna);
  if (!widoczna) return;
  el.dataset.id = k.id;
  el.innerHTML = `<span class="pigulka-kropka" aria-hidden="true"></span><span data-czas>${stoper(Date.now() - s.start)}</span><span class="pigulka-tytul">${esc(k.tytul)}</span>`;
  el.setAttribute('aria-label', `Trwa sesja czytania: ${k.tytul}. Pokaż`);
}

/* ================= arkusz: bazowa ================= */
function arkuszBazowej(id) {
  const k = znajdz(id);
  if (!k) return;
  const dzis = dzisISO();
  const domyslna = k.bazowa && k.celData >= dzis ? k.celData : dodajDni(dzis, 60);
  const a = arkusz({
    tytul: k.bazowa ? 'Termin książki bazowej' : 'Ustaw jako bazową', klasa: 'arkusz-maly',
    render: () => `<form class="formularz" novalidate>
      <div class="postep-ksiazka">${okladka(k, 's')}<span class="wiersz-tekst"><span class="wiersz-tytul">${esc(k.tytul)}</span><span class="wiersz-autor">Zostało ${ile(k.strony - k.strona, FORMY_STRON)}</span></span></div>
      <fieldset class="segment"><legend>Na ile czasu</legend>${[1, 2, 3, 4, 6].map(m => radio('okres', m, `${m} mies.`, !k.bazowa && m === 2)).join('')}${radio('okres', 'data', 'Data', k.bazowa)}</fieldset>
      <label class="f-data"${k.bazowa ? '' : ' hidden'}>Skończyć do<input type="date" name="data" min="${dzis}" value="${domyslna}"></label>
      <p class="podsumowanie" aria-live="polite"></p>
      ${k.bazowa ? '' : (bazowa() ? `<p class="podpowiedz">Obecna bazowa, „${esc(bazowa().tytul)}”, zostanie zwykłą czytaną książką.</p>` : '')}
      <div class="przyciski przyciski-koniec"><button type="button" class="btn" data-zamknij>Anuluj</button><button type="submit" class="btn btn-glowny">${k.bazowa ? 'Zapisz termin' : 'Ustaw jako bazową'}</button></div>
    </form>`
  });
  const f = $('form', a.tresc);
  const celData = () => {
    const o = f.elements.okres.value;
    if (o === 'data') return poprawnaData(f.elements.namedItem('data').value) ? f.elements.namedItem('data').value : null;
    return dodajDni(dzis, Math.round(+o * 30.44) - 1);
  };
  const podsum = () => {
    const d = celData();
    if (!d || d < dzis) { $('.podsumowanie', f).textContent = 'Wybierz datę od dziś wzwyż.'; return; }
    const dni = dniMiedzy(dzis, d) + 1;
    const norma = Math.ceil((k.strony - k.strona) / dni);
    $('.podsumowanie', f).textContent = `Do ${dataDluga(d)}: ok. ${ile(norma, FORMY_STRON)} dziennie przez ${ile(dni, FORMY_DNI)}.`;
  };
  f.addEventListener('change', e => {
    if (e.target.name === 'okres') $('.f-data', f).hidden = e.target.value !== 'data';
    podsum();
  });
  f.addEventListener('input', podsum);
  podsum();
  f.addEventListener('submit', e => {
    e.preventDefault();
    const d = celData();
    if (!d || d < dzis) return;
    if (k.bazowa) { k.celData = d; k.planOd = { data: dzis, strona: k.strona }; utrwal(k); }
    else utrwal(ustawBazowa(k, d));
    a.zamknij();
    odswiez();
    toast(`„${k.tytul}” to teraz książka bazowa, termin ${dataDluga(d, false)}.`);
  });
}

function arkuszWyboruBazowej() {
  const lista = Z.ksiazki.filter(k => (k.status === 'czytam' && !k.bazowa) || k.status === 'doPrzeczytania').sort((a, b) => b.strony - a.strony);
  const a = arkusz({
    tytul: 'Wybierz książkę bazową', klasa: 'arkusz-maly',
    render: () => lista.length ? `<p class="cichy">Najlepiej sprawdza się długa książka, którą chcesz czytać po trochu każdego dnia.</p>
      <ul class="lista">${lista.map(k => `<li class="wiersz"><button type="button" class="wiersz-glowny" data-wybierz="${k.id}">${okladka(k, 's')}
        <span class="wiersz-tekst"><span class="wiersz-tytul">${esc(k.tytul)}</span><span class="wiersz-autor">${esc(k.autor)}${k.autor ? ', ' : ''}${ile(k.strony, FORMY_STRON)}${k.status === 'czytam' ? ', czytasz' : ''}</span></span></button></li>`).join('')}</ul>`
      : `<p>Nie masz jeszcze książek do wyboru.</p><div class="przyciski"><button type="button" class="btn btn-glowny" data-akcja="dodaj" data-jako="bazowa">Dodaj książkę</button></div>`
  });
  a.tresc.addEventListener('click', e => {
    const b = e.target.closest('[data-wybierz]');
    if (b) { a.zamknij(); arkuszBazowej(b.dataset.wybierz); }
    if (e.target.closest('[data-akcja="dodaj"]')) a.zamknij();
  });
}

/* ================= arkusz: cytat ================= */
function arkuszCytatu(id, cid = null) {
  const k = znajdz(id);
  if (!k) return;
  const c = cid ? k.cytaty.find(x => x.id === cid) : null;
  const a = arkusz({
    tytul: c ? 'Edytuj cytat' : 'Dodaj cytat', klasa: 'arkusz-maly',
    render: () => `<form class="formularz" novalidate>
      <p class="cichy">${esc(k.tytul)}</p>
      <fieldset class="segment"><legend class="sr">Rodzaj</legend>${radio('rodzaj', 'cytat', 'Cytat', !c || !c.notatka)}${radio('rodzaj', 'notatka', 'Moja notatka', !!(c && c.notatka))}</fieldset>
      <label>Treść<textarea name="tekst" rows="5" required autofocus placeholder="Przepisz zdanie albo zapisz swoją myśl">${esc(c ? c.tekst : '')}</textarea></label>
      <label class="pole-waskie">Strona<input name="strona" type="number" inputmode="numeric" min="1" max="${k.strony}" value="${c ? (c.strona || '') : (k.strona || '')}"></label>
      <div class="przyciski przyciski-koniec">${c ? '<button type="button" class="btn btn-ryzyko" data-usun-cytat>Usuń</button>' : ''}
        <button type="button" class="btn" data-zamknij>Anuluj</button><button type="submit" class="btn btn-glowny">Zapisz</button></div>
    </form>`
  });
  const f = $('form', a.tresc);
  f.addEventListener('submit', e => {
    e.preventDefault();
    const tekst = f.elements.namedItem('tekst').value.trim();
    if (!tekst) { f.elements.namedItem('tekst').focus(); return; }
    const dane = { tekst, strona: +f.elements.namedItem('strona').value > 0 ? Math.round(+f.elements.namedItem('strona').value) : null, notatka: f.elements.rodzaj.value === 'notatka' };
    if (c) Object.assign(c, dane);
    else k.cytaty.push({ id: noweId(), data: dzisISO(), ...dane });
    utrwal(k);
    a.zamknij();
    odswiez();
    toast(dane.notatka ? 'Zapisano notatkę.' : 'Zapisano cytat.');
  });
  $('[data-usun-cytat]', f)?.addEventListener('click', () => {
    const idx = k.cytaty.indexOf(c);
    k.cytaty.splice(idx, 1);
    utrwal(k);
    a.zamknij();
    odswiez();
    toast('Usunięto cytat.', { akcja: 'Cofnij', onAkcja: () => { k.cytaty.splice(idx, 0, c); utrwal(k); odswiez(); } });
  });
}

/* ================= skaner ================= */
function arkuszSkanera(poOdczycie) {
  let stop = null;
  const a = arkusz({
    tytul: 'Skanuj kod kreskowy', klasa: 'arkusz-maly', onZamknij: () => stop && stop(),
    render: () => `<div class="skaner"><video playsinline muted></video><span class="skaner-linia" aria-hidden="true"></span></div>
      <p class="cichy">Nakieruj aparat na kod kreskowy z tyłu książki. Numer ISBN zaczyna się od 978 albo 979.</p>
      <div class="przyciski przyciski-koniec"><button type="button" class="btn" data-zamknij>Anuluj</button></div>`
  });
  Skaner.start($('video', a.tresc), kod => {
    if (navigator.vibrate) navigator.vibrate(40);
    a.zamknij();
    poOdczycie(kod);
  }).then(s => { stop = s; if (a.zamkniety) s(); })
    .catch(e => {
      $('.skaner', a.tresc).outerHTML = `<p class="blad">${e && e.name === 'NotAllowedError'
        ? 'Brak dostępu do aparatu. Zezwól na niego w ustawieniach przeglądarki dla tej strony.'
        : 'Nie udało się uruchomić aparatu.'}</p>`;
    });
}

/* ================= ukończenie ================= */
function arkuszZakonczenia(id) {
  const k = znajdz(id);
  if (!k) return;
  const reszta = k.strony - k.strona;
  const zakoncz = wlicz => { utrwal(oznaczPrzeczytana(k, dzisISO(), wlicz)); odswiez(); celebracja(k.id); };
  if (!reszta) { zakoncz(false); return; }
  const a = arkusz({
    tytul: 'Skończona?', klasa: 'arkusz-maly',
    render: () => `<form class="formularz" novalidate>
      <p>Do końca „${esc(k.tytul)}” zostało ${ile(reszta, FORMY_STRON)}. Kiedy je przeczytałeś?</p>
      <fieldset class="segment"><legend class="sr">Kiedy</legend>${radio('kiedy', 'dzis', 'Dziś', reszta <= 150)}${radio('kiedy', 'wczesniej', 'Wcześniej, bez zapisu', reszta > 150)}</fieldset>
      <p class="podpowiedz">Strony z „Wcześniej” nie wejdą do dzisiejszego licznika ani serii.</p>
      <div class="przyciski przyciski-koniec"><button type="button" class="btn" data-zamknij>Anuluj</button><button type="submit" class="btn btn-glowny">Przeczytana</button></div>
    </form>`
  });
  $('form', a.tresc).addEventListener('submit', e => {
    e.preventDefault();
    const wlicz = e.target.elements.kiedy.value === 'dzis';
    a.zamknij();
    zakoncz(wlicz);
  });
}

function celebracja(id) {
  const k = znajdz(id);
  if (!k) return;
  const s = sesjaAktywna();
  if (s && s.id === id) { lsSet('zakladka-sesja', null); renderPigulka(); }
  const u = Z.ustawienia;
  const wCelu = k.koniec >= u.start && k.koniec <= u.koniec;
  const n = ukonczenia(u.start, u.koniec).length;
  if (navigator.vibrate) navigator.vibrate([20, 60, 30]);
  arkusz({
    tytul: 'Przeczytane', ukryjTytul: true, klasa: 'arkusz-maly arkusz-brawo', odswiezalny: true, ksiazkaId: id,
    render: () => {
      const kk = znajdz(id);
      return `<div class="brawo">
        <div class="brawo-okl">${okladka(kk, 'l')}<span class="brawo-wstazka" aria-hidden="true"></span></div>
        <h2>Przeczytane</h2>
        <p>„${esc(kk.tytul)}”${wCelu ? ` to twoja ${n}. książka w tym celu. Zostało ${Math.max(0, u.cel - n)}.` : ' trafia na półkę przeczytanych.'}</p>
        <p class="cichy">Jak ją oceniasz?</p>
        ${gwiazdki(kk)}
        <div class="przyciski"><button type="button" class="btn" data-akcja="cytat-dodaj" data-id="${kk.id}">Dodaj cytat</button>
          <button type="button" class="btn btn-glowny" data-zamknij>Gotowe</button></div>
      </div>`;
    }
  });
}

/* ================= kopia, import, eksport ================= */
async function eksportujKopie() {
  const ok = await zapiszPlik(`zakladka-kopia-${dzisISO()}.json`, JSON.stringify(daneDoKopii()), 'application/json');
  if (!ok) return;
  lsSet('zakladka-kopia', dzisISO());
  toast('Kopia zapasowa gotowa.');
  odswiez();
}

async function importujKopie() {
  const plik = await wybierzPlik('.json,application/json');
  if (!plik) return;
  let dane;
  try { dane = JSON.parse(await plik.text()); } catch { toast('Ten plik nie jest kopią Zakładki.', { typ: 'blad' }); return; }
  if (!dane || !Array.isArray(dane.ksiazki)) { toast('W pliku nie ma listy książek.', { typ: 'blad' }); return; }
  const ok = !Z.ksiazki.length || await potwierdz(
    `Kopia ma ${ile(dane.ksiazki.length, FORMY_KSIAZEK_B)}. Obecne dane na tym urządzeniu (${ile(Z.ksiazki.length, FORMY_KSIAZEK)}) zostaną zastąpione.`,
    { tytul: 'Wczytać kopię?', tak: 'Wczytaj kopię', niebezpieczne: true });
  if (!ok) return;
  const lista = dane.ksiazki.map(normalizujKsiazke);
  try {
    await Baza.zastap(lista);
    Z.ksiazki = lista;
    Z.ustawienia = normalizujUstawienia(dane.ustawienia);
    await utrwalUstawienia();
    zastosujMotyw();
    odswiez();
    toast(`Wczytano ${ile(lista.length, FORMY_KSIAZEK_B)}.`);
  } catch (e) { bladZapisu(e); }
}

async function importujGoodreads() {
  const plik = await wybierzPlik('.csv,text/csv');
  if (!plik) return;
  let lista;
  try { lista = czytajGoodreads(await plik.text()); } catch (e) { toast(e.message, { typ: 'blad' }); return; }
  const znane = new Set(Z.ksiazki.map(k => (k.tytul + k.autor).toLowerCase()));
  const nowe = lista.filter(k => !znane.has((k.tytul + k.autor).toLowerCase()));
  if (!nowe.length) { toast('Wszystkie książki z pliku już są w bibliotece.'); return; }
  const licz = s => nowe.filter(k => k.status === s).length;
  const ok = await potwierdz(`Znalazłem ${ile(nowe.length, FORMY_KSIAZEK_B)}: przeczytane ${licz('przeczytana')}, w trakcie ${licz('czytam')}, do przeczytania ${licz('doPrzeczytania')}.${lista.length > nowe.length ? ` Pominę ${lista.length - nowe.length}, które już masz.` : ''}`,
    { tytul: 'Import z Goodreads', tak: 'Importuj' });
  if (!ok) return;
  let nr = Z.ksiazki.reduce((m, k) => Math.max(m, k.kolejnosc), 0);
  const gotowe = nowe.map(k => normalizujKsiazke({ ...k, id: noweId(), kolejnosc: ++nr }));
  Z.ksiazki.push(...gotowe);
  await utrwal(gotowe);
  odswiez();
  toast(`Zaimportowano ${ile(gotowe.length, FORMY_KSIAZEK_B)}.`);
}

/* ================= akcje ================= */
async function usunKsiazke(id) {
  const k = znajdz(id);
  if (!k) return;
  const s = sesjaAktywna();
  Z.ksiazki = Z.ksiazki.filter(x => x !== k);
  if (s && s.id === id) lsSet('zakladka-sesja', null);
  try { await Baza.usun(id); } catch (e) { bladZapisu(e); }
  odswiez();
  toast(`Usunięto „${k.tytul}”.`, { akcja: 'Cofnij', onAkcja: () => { Z.ksiazki.push(k); utrwal(k); odswiez(); } });
}

function znajdzCytat(d) {
  const k = znajdz(d.id);
  return k && k.cytaty.find(c => c.id === d.cid) ? { k, c: k.cytaty.find(c => c.id === d.cid) } : null;
}
const tekstCytatu = ({ k, c }) => `„${c.tekst}”\n— ${k.autor ? k.autor + ', ' : ''}${k.tytul}${c.strona ? `, s. ${c.strona}` : ''}`;

const AKCJE = {
  idz: d => idz(d.widok, d.polka),
  ksiazka: d => arkuszKsiazki(d.id),
  dodaj: d => arkuszFormularza(null, { jako: d.jako || (U.widok === 'biblioteka' && U.polka === 'czytam' ? 'czytam' : 'doPrzeczytania') }),
  edytuj: d => arkuszFormularza(d.id),
  postep: d => arkuszPostepu(d.id),
  sesja: d => otworzSesje(d.id),
  bazowa: d => arkuszBazowej(d.id),
  'wybierz-bazowa': () => arkuszWyboruBazowej(),
  'zdejmij-bazowa': d => { const k = znajdz(d.id); utrwal(zdejmijBazowa(k)); odswiez(); toast('To już zwykła czytana książka.'); },
  zacznij: d => { const k = znajdz(d.id); utrwal(zacznijCzytac(k)); odswiez(); toast(`Zaczynasz „${k.tytul}”.`); },
  wznow: d => { const k = znajdz(d.id); utrwal(zacznijCzytac(k)); odswiez(); toast(`Wracasz do „${k.tytul}”.`); },
  ponownie: d => { const k = znajdz(d.id); utrwal(czytajPonownie(k)); odswiez(); toast(`Czytasz „${k.tytul}” jeszcze raz.`); },
  skonczona: d => arkuszZakonczenia(d.id),
  porzuc: d => {
    const k = znajdz(d.id), kopia = JSON.parse(JSON.stringify(k));
    utrwal(porzuc(k));
    odswiez();
    toast(`Porzucono „${k.tytul}”.`, { akcja: 'Cofnij', onAkcja: () => { Object.assign(k, kopia); utrwal(k); odswiez(); } });
  },
  kolejka: d => { utrwal(przesunWKolejce(znajdz(d.id), +d.kierunek)); odswiez(); },
  'na-poczatek': d => { utrwal(naPoczatekKolejki(znajdz(d.id))); odswiez(); toast('Przeniesiono na początek kolejki.'); },
  usun: d => usunKsiazke(d.id),
  ocena: d => { const k = znajdz(d.id); k.ocena = k.ocena === +d.n ? 0 : +d.n; utrwal(k); odswiez(); },
  'cytat-dodaj': d => arkuszCytatu(d.id),
  'cytat-edytuj': d => arkuszCytatu(d.id, d.cid),
  'cytat-kopiuj': async d => {
    const x = znajdzCytat(d);
    if (!x) return;
    try { await navigator.clipboard.writeText(tekstCytatu(x)); toast('Skopiowano cytat.'); } catch { toast('Nie udało się skopiować.', { typ: 'blad' }); }
  },
  'cytat-udostepnij': async d => {
    const x = znajdzCytat(d);
    if (x) try { await navigator.share({ text: tekstCytatu(x) }); } catch { /* anulowano */ }
  },
  polka: d => { U.polka = d.polka; U.tag = null; U.sort = 'domyslnie'; renderWidok(); },
  tag: d => { U.tag = U.tag === d.tag ? null : d.tag; renderWidok(); },
  kopia: () => eksportujKopie(),
  'kopia-pozniej': () => { lsSet('zakladka-kopia-odloz', dodajDni(dzisISO(), 3)); renderWidok(); },
  'import-json': () => importujKopie(),
  'import-goodreads': () => importujGoodreads(),
  'eksport-csv': async () => {
    if (!Z.ksiazki.length) { toast('Biblioteka jest pusta.'); return; }
    if (await zapiszPlik(`zakladka-goodreads-${dzisISO()}.csv`, '﻿' + csvGoodreads(Z.ksiazki), 'text/csv')) toast('Plik CSV gotowy.');
  },
  'usun-wszystko': async () => {
    if (!(await potwierdz('Usunę wszystkie książki, cytaty i ustawienia z tego urządzenia. Tego nie da się cofnąć.', { tytul: 'Usunąć wszystko?', tak: 'Usuń wszystko', niebezpieczne: true }))) return;
    try {
      await Baza.zastap([]);
      Z.ksiazki = [];
      Z.ustawienia = { ...DOMYSLNE };
      await utrwalUstawienia();
      ['zakladka-sesja', 'zakladka-kopia', 'zakladka-kopia-odloz'].forEach(k => lsSet(k, null));
      zastosujMotyw();
      idz('dzis');
      toast('Usunięto wszystkie dane.');
    } catch (e) { bladZapisu(e); }
  },
  pamiec: async () => {
    try {
      const ok = await navigator.storage.persist();
      toast(ok ? 'Trwała pamięć włączona.' : 'Przeglądarka odmówiła. Zainstaluj aplikację i spróbuj ponownie.');
    } catch { toast('Nie udało się poprosić o pamięć.'); }
    pokazStanPamieci();
  },
  instaluj: async () => {
    if (!U.instalacja) return;
    U.instalacja.prompt();
    await U.instalacja.userChoice.catch(() => {});
    U.instalacja = null;
    renderWidok();
  }
};

/* ================= zdarzenia ================= */
document.addEventListener('click', e => {
  const t = e.target.closest('[data-akcja]');
  if (!t || t.disabled) return;
  const f = AKCJE[t.dataset.akcja];
  if (!f) return;
  e.preventDefault();
  f(t.dataset, t);
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && otwarte.length) { e.preventDefault(); otwarte[otwarte.length - 1].zamknij(); }
});

document.addEventListener('input', e => {
  if (e.target.id === 'szukaj-bib') { U.szukaj = e.target.value; $('#siatka-bib').innerHTML = htmlSiatki(); }
  if (e.target.id === 'szukaj-cyt') { U.szukajCytat = e.target.value; $('#lista-cyt').innerHTML = htmlCytatow(); }
});

document.addEventListener('change', e => {
  if (e.target.id === 'sort-bib') { U.sort = e.target.value; $('#siatka-bib').innerHTML = htmlSiatki(); }
  if (e.target.name === 'motyw' && e.target.closest('#widok')) {
    Z.ustawienia.motyw = e.target.value;
    utrwalUstawienia();
    zastosujMotyw();
  }
});

document.addEventListener('submit', e => {
  if (e.target.id !== 'f-ustawienia') return;
  e.preventDefault();
  const f = e.target, v = n => f.elements.namedItem(n).value;
  const nowe = normalizujUstawienia({ ...Z.ustawienia, cel: v('cel'), srednia: v('srednia'), start: v('start'), koniec: v('koniec'), dziennyCel: v('dziennyCel') || 0, imie: v('imie') });
  if (!(v('koniec') > v('start'))) { toast('Data końca musi być po dacie startu.', { typ: 'blad' }); return; }
  Z.ustawienia = nowe;
  utrwalUstawienia();
  renderWidok();
  toast('Zapisano ustawienia.');
});

matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', zastosujMotyw);

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  U.instalacja = e;
  if (U.widok === 'ustawienia') renderWidok();
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) return;
  if (U.dzien !== dzisISO()) { U.dzien = dzisISO(); odswiez(); }
  else renderPigulka();
});

/* ================= start ================= */
async function start() {
  try {
    await Baza.otworz();
    const [ks, us] = await Promise.all([Baza.wszystkie(), Baza.ustawienia()]);
    const surowe = ks || [];
    Z.ksiazki = surowe.map(normalizujKsiazke);
    Z.ustawienia = normalizujUstawienia(us);
    // dopasuj dane z wersji 1 do nowego formatu
    const doPoprawy = Z.ksiazki.filter((k, i) => JSON.stringify(k) !== JSON.stringify(surowe[i]));
    if (doPoprawy.length) utrwal(doPoprawy);
    lsSet('zakladka-motyw', Z.ustawienia.motyw);
  } catch (e) {
    console.error(e);
    toast(`Nie mogę otworzyć bazy na urządzeniu (${e.message}). Zmiany nie będą zapisywane.`, { typ: 'blad', czas: 10000 });
  }
  zastosujMotyw();
  renderWidok();
  renderPigulka();
  setInterval(() => {
    const el = $('#pigulka [data-czas]'), s = sesjaAktywna();
    if (el && s) el.textContent = stoper(Date.now() - s.start);
  }, 1000);

  const akcja = new URLSearchParams(location.search).get('akcja');
  if (akcja) {
    history.replaceState(null, '', location.pathname);
    if (akcja === 'dodaj') arkuszFormularza();
    if (akcja === 'postep') { const b = bazowa() || czytane()[0]; if (b) arkuszPostepu(b.id); }
  }

  Skaner.dostepny().then(v => { U.skaner = v; });
  try {
    if (navigator.storage && navigator.storage.persist && !(await navigator.storage.persisted())) await navigator.storage.persist();
  } catch { /* nieobsługiwane */ }
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(e => console.warn('Service worker:', e));
  }
}

start();
