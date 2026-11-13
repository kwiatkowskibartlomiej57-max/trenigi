'use strict';
/* Zakładka — wyszukiwanie książek w internecie, skaner ISBN, zdjęcia okładek, import i eksport plików */

/* ---------- wyszukiwanie: Google Books, a gdy mało wyników — Open Library ---------- */
const Wyszukiwarka = (() => {
  const czyIsbn = q => {
    const s = q.replace(/[-\s]/g, '');
    return /^(\d{9}[\dXx]|\d{13})$/.test(s) ? s : null;
  };

  function zTimeoutem(url, ms = 8000) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    return fetch(url, { signal: ctrl.signal }).finally(() => clearTimeout(t));
  }

  async function google(q) {
    const isbn = czyIsbn(q);
    const zap = isbn ? `isbn:${isbn}` : q;
    const r = await zTimeoutem(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(zap)}&maxResults=15&printType=books`);
    if (!r.ok) throw new Error(`Google Books odpowiada błędem ${r.status}`);
    const j = await r.json();
    return (j.items || []).map(it => {
      const v = it.volumeInfo || {};
      const ids = v.industryIdentifiers || [];
      const nr = ids.find(x => x.type === 'ISBN_13') || ids.find(x => x.type === 'ISBN_10');
      let okl = v.imageLinks && (v.imageLinks.thumbnail || v.imageLinks.smallThumbnail);
      if (okl) okl = okl.replace(/^http:/, 'https:').replace('&edge=curl', '');
      return {
        tytul: v.title || '',
        autor: (v.authors || []).join(', '),
        strony: v.pageCount || null,
        okladka: okl || null,
        isbn: nr ? nr.identifier : '',
        rok: (v.publishedDate || '').slice(0, 4),
        tagi: []
      };
    }).filter(x => x.tytul);
  }

  async function openLibrary(q) {
    const isbn = czyIsbn(q);
    const pola = 'title,author_name,number_of_pages_median,cover_i,isbn,first_publish_year,subject';
    const url = isbn
      ? `https://openlibrary.org/search.json?isbn=${isbn}&limit=10&fields=${pola}`
      : `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=15&fields=${pola}`;
    const r = await zTimeoutem(url);
    if (!r.ok) throw new Error(`Open Library odpowiada błędem ${r.status}`);
    const j = await r.json();
    return (j.docs || []).map(d => ({
      tytul: d.title || '',
      autor: (d.author_name || []).slice(0, 3).join(', '),
      strony: d.number_of_pages_median || null,
      okladka: d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg` : null,
      isbn: (d.isbn || []).find(x => x.length === 13) || isbn || '',
      rok: d.first_publish_year ? String(d.first_publish_year) : '',
      tagi: []
    })).filter(x => x.tytul);
  }

  async function szukaj(q) {
    let wyniki = [], blad = null;
    try { wyniki = await google(q); } catch (e) { blad = e; }
    if (wyniki.length < 4) {
      try {
        const ol = await openLibrary(q);
        const znane = new Set(wyniki.map(w => (w.tytul + w.autor).toLowerCase()));
        wyniki = wyniki.concat(ol.filter(w => !znane.has((w.tytul + w.autor).toLowerCase())));
      } catch (e) { blad = blad || e; }
    }
    if (!wyniki.length && blad) throw blad;
    return wyniki;
  }

  return { szukaj, czyIsbn };
})();

/* ---------- skaner kodów kreskowych (Android / Chrome: BarcodeDetector) ---------- */
const Skaner = {
  async dostepny() {
    if (!('BarcodeDetector' in window) || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return false;
    try { return (await BarcodeDetector.getSupportedFormats()).includes('ean_13'); } catch { return false; }
  },

  async start(video, poOdczycie) {
    const detektor = new BarcodeDetector({ formats: ['ean_13'] });
    const strumien = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
    let aktywny = true;
    const stop = () => {
      if (!aktywny) return;
      aktywny = false;
      strumien.getTracks().forEach(t => t.stop());
      video.srcObject = null;
    };
    video.srcObject = strumien;
    await video.play();
    const petla = async () => {
      if (!aktywny) return;
      try {
        const kody = await detektor.detect(video);
        const kod = kody.map(k => k.rawValue).find(v => /^97[89]\d{10}$/.test(v));
        if (kod) { stop(); poOdczycie(kod); return; }
      } catch { /* klatka jeszcze niegotowa */ }
      setTimeout(petla, 180);
    };
    petla();
    return stop;
  }
};

/* ---------- okładki: zdjęcie z aparatu lub obraz z internetu → mały JPEG w bazie ---------- */
function wczytajObraz(src, cors = false) {
  return new Promise((ok, blad) => {
    const img = new Image();
    if (cors) img.crossOrigin = 'anonymous';
    img.onload = () => ok(img);
    img.onerror = () => blad(new Error('Nie udało się wczytać obrazu.'));
    img.src = src;
  });
}

function obrazNaDataURL(img, maxW = 360, maxH = 540) {
  const s = Math.min(1, maxW / img.naturalWidth, maxH / img.naturalHeight);
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(img.naturalWidth * s));
  c.height = Math.max(1, Math.round(img.naturalHeight * s));
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', 0.82);
}

async function plikNaOkladke(plik) {
  const url = URL.createObjectURL(plik);
  try { return obrazNaDataURL(await wczytajObraz(url)); }
  finally { URL.revokeObjectURL(url); }
}

/** Próbuje zapisać okładkę z internetu w bazie (działa offline). Gdy serwer nie pozwala, zostaje adres. */
async function urlNaOkladke(url) {
  try {
    const img = await wczytajObraz(url, true);
    if (img.naturalWidth < 20) return url;
    return obrazNaDataURL(img);
  } catch {
    return url;
  }
}

/* ---------- pliki ---------- */
function wybierzPlik(accept) {
  return new Promise(ok => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.hidden = true;
    input.addEventListener('change', () => { ok(input.files[0] || null); input.remove(); }, { once: true });
    document.body.append(input);
    input.click();
  });
}

async function zapiszPlik(nazwa, tresc, typ) {
  const plik = new File([tresc], nazwa, { type: typ });
  const mobilny = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (mobilny && navigator.canShare && navigator.canShare({ files: [plik] })) {
    try {
      await navigator.share({ files: [plik], title: nazwa });
      return true;
    } catch (e) {
      if (e.name === 'AbortError') return false;
    }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(plik);
  a.download = nazwa;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  return true;
}

/* ---------- CSV i Goodreads ---------- */
function parsujCSV(tekst) {
  const wiersze = [];
  let w = [], pole = '', cudzyslow = false;
  for (let i = 0; i < tekst.length; i++) {
    const c = tekst[i];
    if (cudzyslow) {
      if (c === '"') {
        if (tekst[i + 1] === '"') { pole += '"'; i++; } else cudzyslow = false;
      } else pole += c;
    } else if (c === '"') cudzyslow = true;
    else if (c === ',') { w.push(pole); pole = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && tekst[i + 1] === '\n') i++;
      w.push(pole); wiersze.push(w); w = []; pole = '';
    } else pole += c;
  }
  if (pole !== '' || w.length) { w.push(pole); wiersze.push(w); }
  return wiersze.filter(r => r.some(x => x.trim() !== ''));
}

const csvPole = v => {
  const s = String(v ?? '');
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

function czytajGoodreads(tekst) {
  const [naglowek, ...wiersze] = parsujCSV(tekst.replace(/^﻿/, ''));
  if (!naglowek) throw new Error('Plik jest pusty.');
  const idx = nazwa => naglowek.findIndex(h => h.trim().toLowerCase() === nazwa.toLowerCase());
  const k = {
    tytul: idx('Title'), autor: idx('Author'), strony: idx('Number of Pages'), isbn13: idx('ISBN13'), isbn: idx('ISBN'),
    ocena: idx('My Rating'), przeczytana: idx('Date Read'), dodana: idx('Date Added'), polka: idx('Exclusive Shelf'),
    polki: idx('Bookshelves'), recenzja: idx('My Review')
  };
  if (k.tytul < 0) throw new Error('To nie wygląda na eksport z Goodreads: brak kolumny „Title”.');
  const pole = (r, i) => (i >= 0 ? (r[i] || '').trim() : '');
  const isbn = s => s.replace(/^=/, '').replace(/[^\dXx]/g, '');
  const data = s => {
    const m = s.match(/(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
    return m ? `${m[1]}-${pad(m[2])}-${pad(m[3])}` : null;
  };
  const systemowe = ['read', 'to-read', 'currently-reading', 'did-not-finish'];
  return wiersze.map(r => {
    const polka = pole(r, k.polka);
    const status = polka === 'read' ? 'przeczytana'
      : polka === 'currently-reading' ? 'czytam'
      : polka === 'did-not-finish' ? 'porzucona' : 'doPrzeczytania';
    const strony = +pole(r, k.strony) || Z.ustawienia.srednia;
    const dodano = data(pole(r, k.dodana)) || dzisISO();
    return {
      tytul: pole(r, k.tytul),
      autor: pole(r, k.autor),
      strony,
      isbn: isbn(pole(r, k.isbn13)) || isbn(pole(r, k.isbn)),
      ocena: +pole(r, k.ocena) || 0,
      status,
      strona: status === 'przeczytana' ? strony : 0,
      koniec: status === 'przeczytana' ? (data(pole(r, k.przeczytana)) || dodano) : null,
      start: status === 'czytam' ? dzisISO() : null,
      dodano,
      tagi: pole(r, k.polki).split(',').map(t => t.trim()).filter(t => t && !systemowe.includes(t)),
      recenzja: pole(r, k.recenzja).replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '')
    };
  }).filter(x => x.tytul);
}

function csvGoodreads(ksiazki) {
  const nag = ['Title', 'Author', 'ISBN13', 'My Rating', 'Number of Pages', 'Date Read', 'Date Added', 'Bookshelves', 'Exclusive Shelf', 'My Review'];
  const polka = { przeczytana: 'read', czytam: 'currently-reading', doPrzeczytania: 'to-read', porzucona: 'did-not-finish' };
  const d = s => (s ? s.replace(/-/g, '/') : '');
  const wiersze = ksiazki.map(k => [
    k.tytul, k.autor, k.isbn, k.ocena || '', k.strony, d(k.koniec), d(k.dodano), k.tagi.join(', '), polka[k.status], k.recenzja
  ].map(csvPole).join(','));
  return [nag.join(','), ...wiersze].join('\r\n');
}
