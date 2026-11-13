'use strict';
/* Zakładka — model danych, operacje na książkach i obliczenia */

const WERSJA = '2.0.0';
const DOMYSLNE = { imie: '', cel: 200, start: '2026-09-01', koniec: '2027-08-31', srednia: 300, dziennyCel: 0, motyw: 'auto' };
const STATUSY = ['czytam', 'doPrzeczytania', 'przeczytana', 'porzucona'];
const FORMATY = { papier: 'Papier', ebook: 'E-book', audio: 'Audiobook' };

const FORMY_STRON = ['strona', 'strony', 'stron'];
const FORMY_STRON_D = ['strony', 'stron', 'stron']; // dopełniacz: „z 150 stron”, „brakuje 1 strony”
const FORMY_DNI = ['dzień', 'dni', 'dni'];
const FORMY_KSIAZEK = ['książka', 'książki', 'książek'];
const FORMY_KSIAZEK_D = ['książki', 'książek', 'książek'];
const FORMY_KSIAZEK_B = ['książkę', 'książki', 'książek'];

const Z = { ksiazki: [], ustawienia: { ...DOMYSLNE } };

/* ---------- daty (wszystko jako tekst RRRR-MM-DD) ---------- */
const pad = n => String(n).padStart(2, '0');
const isoZDaty = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const dzisISO = () => isoZDaty(new Date());
const doDaty = iso => new Date(iso + 'T00:00:00Z');
const dniMiedzy = (a, b) => Math.round((doDaty(b) - doDaty(a)) / 864e5);
function dodajDni(iso, n) {
  const d = doDaty(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
const dzienTygodnia = iso => (doDaty(iso).getUTCDay() + 6) % 7; // 0 = poniedziałek
const poprawnaData = s => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(doDaty(s));

/* ---------- drobiazgi ---------- */
const noweId = () => (window.crypto && crypto.randomUUID)
  ? crypto.randomUUID()
  : Date.now().toString(36) + Math.random().toString(36).slice(2, 10);

function odmiana(n, [jeden, kilka, wiele]) {
  if (!Number.isInteger(n)) return kilka;
  const a = Math.abs(n);
  if (a === 1) return jeden;
  const j = a % 10, d = a % 100;
  return j >= 2 && j <= 4 && !(d >= 12 && d <= 14) ? kilka : wiele;
}
const ile = (n, formy) => `${n} ${odmiana(n, formy)}`;
const ulamek = (n, miejsca = 1) => n.toFixed(miejsca).replace('.', ',');
const liczba = n => Math.round(n).toLocaleString('pl-PL');
const znajdz = id => Z.ksiazki.find(k => k.id === id);
const ogranicz = (v, min, max) => Math.max(min, Math.min(max, v));

/* ---------- normalizacja (stare kopie, import, błędne dane) ---------- */
function normalizujKsiazke(k = {}) {
  const strony = Math.max(1, Math.round(+k.strony) || 300);
  const status = STATUSY.includes(k.status) ? k.status : 'doPrzeczytania';
  const n = {
    id: k.id ? String(k.id) : noweId(),
    tytul: String(k.tytul || '').trim() || 'Bez tytułu',
    autor: String(k.autor || '').trim(),
    strony,
    format: FORMATY[k.format] ? k.format : 'papier',
    tagi: Array.isArray(k.tagi) ? [...new Set(k.tagi.map(t => String(t).trim().toLowerCase()).filter(Boolean))] : [],
    okladka: typeof k.okladka === 'string' && k.okladka ? k.okladka : null,
    isbn: String(k.isbn || '').replace(/[^\dXx]/g, ''),
    status,
    bazowa: !!k.bazowa && status === 'czytam',
    celData: poprawnaData(k.celData) ? k.celData : (poprawnaData(k.cel) ? k.cel : null),
    planOd: k.planOd && poprawnaData(k.planOd.data) ? { data: k.planOd.data, strona: Math.max(0, +k.planOd.strona || 0) } : null,
    strona: ogranicz(Math.round(+k.strona) || 0, 0, strony),
    start: poprawnaData(k.start) ? k.start : null,
    koniec: poprawnaData(k.koniec) ? k.koniec : null,
    ocena: ogranicz(Math.round(+k.ocena) || 0, 0, 5),
    recenzja: String(k.recenzja || ''),
    log: (Array.isArray(k.log) ? k.log : [])
      .filter(w => w && poprawnaData(w.data) && +w.strony > 0)
      .map(w => ({ data: w.data, strony: Math.round(+w.strony) })),
    sesje: (Array.isArray(k.sesje) ? k.sesje : [])
      .filter(s => s && poprawnaData(s.data))
      .map(s => ({ data: s.data, minuty: Math.max(0, Math.round(+s.minuty) || 0), strony: Math.max(0, Math.round(+s.strony) || 0) })),
    cytaty: (Array.isArray(k.cytaty) ? k.cytaty : [])
      .filter(c => c && String(c.tekst || '').trim())
      .map(c => ({ id: c.id || noweId(), tekst: String(c.tekst).trim(), strona: +c.strona > 0 ? Math.round(+c.strona) : null, data: poprawnaData(c.data) ? c.data : dzisISO(), notatka: !!c.notatka })),
    czytania: (Array.isArray(k.czytania) ? k.czytania : []).filter(c => c && poprawnaData(c.koniec)),
    kolejnosc: Number.isFinite(+k.kolejnosc) ? +k.kolejnosc : 0,
    dodano: poprawnaData(k.dodano) ? k.dodano : dzisISO(),
    porzucono: poprawnaData(k.porzucono) ? k.porzucono : null
  };
  if (n.status === 'przeczytana') n.strona = n.strony;
  if (n.bazowa && !n.celData) n.celData = dodajDni(dzisISO(), 61);
  if (n.bazowa && !n.planOd) n.planOd = { data: n.start || dzisISO(), strona: 0 };
  return n;
}

function normalizujUstawienia(u = {}) {
  const w = { ...DOMYSLNE };
  if (!u || typeof u !== 'object') return w;
  if (typeof u.imie === 'string') w.imie = u.imie.trim().slice(0, 40);
  if (+u.cel >= 1) w.cel = Math.round(+u.cel);
  if (poprawnaData(u.start)) w.start = u.start;
  if (poprawnaData(u.koniec)) w.koniec = u.koniec;
  if (w.koniec <= w.start) w.koniec = dodajDni(w.start, 364);
  if (+u.srednia >= 20) w.srednia = Math.round(+u.srednia);
  if (+u.dziennyCel >= 0) w.dziennyCel = Math.round(+u.dziennyCel);
  if (['auto', 'jasny', 'ciemny'].includes(u.motyw)) w.motyw = u.motyw;
  return w;
}

/* ---------- operacje (każda zwraca listę zmienionych książek) ---------- */
function nowaKsiazka(dane) {
  const max = Z.ksiazki.reduce((a, k) => Math.max(a, k.kolejnosc || 0), 0);
  const k = normalizujKsiazke({ ...dane, id: noweId(), dodano: dzisISO(), kolejnosc: max + 1, status: 'doPrzeczytania', strona: 0 });
  Z.ksiazki.push(k);
  return k;
}

function zacznijCzytac(k, data = dzisISO()) {
  if (k.status === 'doPrzeczytania' || k.status === 'porzucona') k.status = 'czytam';
  k.start = k.start || data;
  k.porzucono = null;
  return [k];
}

function dopiszLog(k, data, roznica) {
  if (!roznica) return;
  if (roznica > 0) {
    const w = k.log.find(x => x.data === data);
    if (w) w.strony += roznica; else k.log.push({ data, strony: roznica });
    return;
  }
  // poprawka w dół: odejmij najpierw z podanego dnia, potem od najnowszych
  let reszta = -roznica;
  const kolej = [...k.log].sort((a, b) => (a.data === data ? -1 : b.data === data ? 1 : b.data.localeCompare(a.data)));
  for (const w of kolej) {
    const o = Math.min(w.strony, reszta);
    w.strony -= o;
    reszta -= o;
    if (!reszta) break;
  }
  k.log = k.log.filter(w => w.strony > 0);
}

function oznaczPrzeczytana(k, data = dzisISO(), wliczStrony = true) {
  if (wliczStrony) dopiszLog(k, data, k.strony - k.strona);
  k.strona = k.strony;
  k.status = 'przeczytana';
  k.koniec = data;
  k.start = k.start || data;
  k.bazowa = false;
  return [k];
}

function ustawStrone(k, wartosc, data = dzisISO()) {
  const v = Math.round(+wartosc);
  if (!Number.isFinite(v)) return { roznica: 0, skonczona: false };
  const nowa = ogranicz(v, 0, k.strony);
  const roznica = nowa - k.strona;
  if (k.status !== 'czytam') zacznijCzytac(k, data);
  dopiszLog(k, data, roznica);
  k.strona = nowa;
  const skonczona = nowa >= k.strony;
  if (skonczona) oznaczPrzeczytana(k, data);
  return { roznica, skonczona };
}

function ustawBazowa(k, celData) {
  const zmienione = [k];
  for (const b of Z.ksiazki) if (b.bazowa && b !== k) { b.bazowa = false; zmienione.push(b); }
  zacznijCzytac(k);
  k.bazowa = true;
  k.celData = celData;
  k.planOd = { data: dzisISO(), strona: k.strona };
  return zmienione;
}

function zdejmijBazowa(k) { k.bazowa = false; return [k]; }

function porzuc(k) {
  k.status = 'porzucona';
  k.bazowa = false;
  k.porzucono = dzisISO();
  return [k];
}

function czytajPonownie(k) {
  k.czytania.push({ start: k.start, koniec: k.koniec, ocena: k.ocena });
  k.status = 'czytam';
  k.strona = 0;
  k.start = dzisISO();
  k.koniec = null;
  return [k];
}

function kolejka() {
  return Z.ksiazki.filter(k => k.status === 'doPrzeczytania').sort((a, b) => a.kolejnosc - b.kolejnosc);
}

function naPoczatekKolejki(k) {
  const min = kolejka().reduce((a, x) => Math.min(a, x.kolejnosc), Infinity);
  k.kolejnosc = (Number.isFinite(min) ? min : 0) - 1;
  return [k];
}

function przesunWKolejce(k, kierunek) {
  const lista = kolejka();
  const i = lista.indexOf(k), j = i + kierunek;
  if (i < 0 || j < 0 || j >= lista.length) return [];
  const inny = lista[j];
  [k.kolejnosc, inny.kolejnosc] = [inny.kolejnosc, k.kolejnosc];
  if (k.kolejnosc === inny.kolejnosc) k.kolejnosc += kierunek * 0.5;
  return [k, inny];
}

/* ---------- obliczenia ---------- */
const bazowa = () => Z.ksiazki.find(k => k.bazowa && k.status === 'czytam') || null;

function ostatniaAktywnosc(k) {
  return k.log.reduce((a, w) => (w.data > a ? w.data : a), k.start || k.dodano);
}

const czytane = () => Z.ksiazki.filter(k => k.status === 'czytam')
  .sort((a, b) => ostatniaAktywnosc(b).localeCompare(ostatniaAktywnosc(a)));

function mapaDni() {
  const m = new Map();
  for (const k of Z.ksiazki) for (const w of k.log) m.set(w.data, (m.get(w.data) || 0) + w.strony);
  return m;
}

const stronyKsiazkiDnia = (k, iso) => k.log.reduce((s, w) => s + (w.data === iso ? w.strony : 0), 0);

function seriaAktualna(m) {
  let d = dzisISO();
  if (!m.get(d)) d = dodajDni(d, -1);
  let n = 0;
  while (m.get(d) > 0 && n < 10000) { n++; d = dodajDni(d, -1); }
  return n;
}

function najdluzszaSeria(m) {
  const dni = [...m.keys()].filter(d => m.get(d) > 0).sort();
  let naj = 0, teraz = 0, poprz = null;
  for (const d of dni) {
    teraz = poprz && dniMiedzy(poprz, d) === 1 ? teraz + 1 : 1;
    naj = Math.max(naj, teraz);
    poprz = d;
  }
  return naj;
}

/** Średnia stron dziennie z ostatnich `okno` dni (krócej, jeśli historia jest krótsza). */
function sredniaDzienna(m, okno = 30) {
  if (!m.size) return 0;
  const dzis = dzisISO();
  const pierwszy = [...m.keys()].sort()[0];
  const dni = ogranicz(dniMiedzy(pierwszy, dzis) + 1, 1, okno);
  let s = 0;
  for (let i = 0; i < dni; i++) s += m.get(dodajDni(dzis, -i)) || 0;
  return s / dni;
}

function tempoZSesji(sesje) {
  let min = 0, str = 0;
  for (const s of sesje) if (s.minuty > 0 && s.strony > 0) { min += s.minuty; str += s.strony; }
  return min >= 10 ? str / (min / 60) : null;
}
const tempoOgolne = () => tempoZSesji(Z.ksiazki.flatMap(k => k.sesje));
const tempoKsiazki = k => tempoZSesji(k.sesje);

/** Wszystkie ukończenia (także ponowne czytania) w przedziale dat. */
function ukonczenia(od, doDnia) {
  const w = [];
  for (const k of Z.ksiazki) {
    if (k.status === 'przeczytana' && k.koniec && k.koniec >= od && k.koniec <= doDnia) w.push({ k, koniec: k.koniec });
    for (const c of k.czytania) if (c.koniec >= od && c.koniec <= doDnia) w.push({ k, koniec: c.koniec });
  }
  return w.sort((a, b) => a.koniec.localeCompare(b.koniec));
}

function postepCelu(m = mapaDni()) {
  const u = Z.ustawienia, dzis = dzisISO();
  const przeczytane = ukonczenia(u.start, u.koniec).length;
  const zostalo = Math.max(0, u.cel - przeczytane);
  const dniCalosc = Math.max(1, dniMiedzy(u.start, u.koniec) + 1);
  const dniZostalo = ogranicz(dniMiedzy(dzis, u.koniec) + 1, 1, dniCalosc);
  const dniMinelo = ogranicz(dniMiedzy(u.start, dzis), 0, dniCalosc); // pełne dni przed dzisiejszym
  const oczekiwane = Math.floor(u.cel * dniMinelo / dniCalosc);
  const tempo = sredniaDzienna(m, 30);
  return {
    cel: u.cel, przeczytane, zostalo, dniZostalo,
    przedStartem: dzis < u.start, poKoncu: dzis > u.koniec,
    tygodniowo: zostalo / dniZostalo * 7,
    stronDziennie: Math.ceil(zostalo * u.srednia / dniZostalo),
    oczekiwane, roznica: przeczytane - oczekiwane, oczekiwanyProc: dniMinelo / dniCalosc * 100,
    tempo, prognoza: przeczytane + Math.floor(tempo * dniZostalo / u.srednia)
  };
}

function dziennyCel(m = mapaDni()) {
  if (Z.ustawienia.dziennyCel > 0) return Z.ustawienia.dziennyCel;
  const g = postepCelu(m);
  if (g.przedStartem || g.poKoncu || !g.zostalo) return 30;
  return Math.max(1, g.stronDziennie);
}

function planBazowej(k) {
  const dzis = dzisISO();
  const dzisiaj = stronyKsiazkiDnia(k, dzis);
  const zostalo = k.strony - k.strona;
  const dniDoTerminu = dniMiedzy(dzis, k.celData) + 1; // razem z dzisiaj
  const poTerminie = dniDoTerminu < 1;
  const dni = Math.max(1, dniDoTerminu);
  const norma = Math.max(1, Math.ceil((zostalo + dzisiaj) / dni));
  const od = k.planOd || { data: k.start || dzis, strona: 0 };
  const calosc = Math.max(1, dniMiedzy(od.data, k.celData) + 1);
  const naStrone = d => Math.round(od.strona + (k.strony - od.strona) * ogranicz(d, 0, calosc) / calosc);
  const minelo = dniMiedzy(od.data, dzis);
  const planWczoraj = naStrone(minelo);
  const planDzis = naStrone(minelo + 1);
  let roznica, stan;
  if (k.strona >= planDzis) { roznica = k.strona - planDzis; stan = roznica > 0 ? 'przed' : 'wPlanie'; }
  else if (k.strona >= planWczoraj) { roznica = 0; stan = 'wPlanie'; }
  else { roznica = planWczoraj - k.strona; stan = 'za'; }
  return { dzisiaj, zostalo, dni, poTerminie, norma, planDzis, roznica, stan, zrobione: dzisiaj >= norma };
}

/** Szacunkowa data skończenia książki z tempa z ostatnich 14 dni. */
function prognozaKsiazki(k) {
  const dzis = dzisISO();
  let s = 0;
  for (let i = 0; i < 14; i++) s += stronyKsiazkiDnia(k, dodajDni(dzis, -i));
  if (!s) return null;
  const dni = Math.ceil((k.strony - k.strona) / (s / 14));
  return dodajDni(dzis, Math.max(0, dni - 1));
}

function czasCzytania(godziny) {
  const min = Math.round(godziny * 60);
  if (min < 60) return `${Math.max(1, min)} min`;
  const h = Math.floor(min / 60), r = min % 60;
  return r ? `${h} h ${r} min` : `${h} h`;
}

/* ---------- kopia zapasowa ---------- */
function daneDoKopii() {
  return { aplikacja: 'Zakładka', wersja: WERSJA, eksport: new Date().toISOString(), ustawienia: Z.ustawienia, ksiazki: Z.ksiazki };
}
