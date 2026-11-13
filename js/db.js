'use strict';
/* Zakładka — baza danych na urządzeniu (IndexedDB).
   Nazwa bazy "polka" zostaje z wersji 1, więc stare dane wczytają się same. */

const Baza = (() => {
  let db = null;

  function otworz() {
    return new Promise((ok, blad) => {
      if (!('indexedDB' in window)) return blad(new Error('Ta przeglądarka nie ma bazy IndexedDB.'));
      const req = indexedDB.open('polka', 2);
      req.onupgradeneeded = () => {
        const d = req.result;
        if (!d.objectStoreNames.contains('ksiazki')) d.createObjectStore('ksiazki', { keyPath: 'id' });
        if (!d.objectStoreNames.contains('ustawienia')) d.createObjectStore('ustawienia');
      };
      req.onsuccess = () => {
        db = req.result;
        db.onversionchange = () => db.close();
        ok();
      };
      req.onerror = () => blad(req.error);
      req.onblocked = () => blad(new Error('Baza jest zajęta przez inną kartę. Zamknij ją i odśwież.'));
    });
  }

  function tx(store, tryb, fn) {
    return new Promise((ok, blad) => {
      if (!db) return blad(new Error('Baza nie jest otwarta.'));
      const t = db.transaction(store, tryb);
      const req = fn(t.objectStore(store));
      t.oncomplete = () => ok(req ? req.result : undefined);
      t.onerror = () => blad(t.error);
      t.onabort = () => blad(t.error || new Error('Zapis przerwany.'));
    });
  }

  return {
    otworz,
    gotowa: () => !!db,
    wszystkie: () => tx('ksiazki', 'readonly', s => s.getAll()),
    zapisz: k => tx('ksiazki', 'readwrite', s => s.put(k)),
    usun: id => tx('ksiazki', 'readwrite', s => s.delete(id)),
    zastap: lista => tx('ksiazki', 'readwrite', s => {
      s.clear();
      lista.forEach(k => s.put(k));
      return null;
    }),
    ustawienia: () => tx('ustawienia', 'readonly', s => s.get('glowne')),
    zapiszUstawienia: u => tx('ustawienia', 'readwrite', s => s.put(u, 'glowne'))
  };
})();
