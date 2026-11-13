# Zakładka: dziennik czytania

Aplikacja na telefon (PWA) do śledzenia czytania. Działa w przeglądarce, instaluje się na ekranie głównym jak zwykła aplikacja, działa bez internetu, a wszystkie dane trzyma w bazie na urządzeniu.

## Co umie

**Ekran Dziś**
- Pierścień z dzisiejszymi stronami i dziennym celem. Cel wylicza się z celu rocznego albo ustawiasz go ręcznie.
- Seria dni z czytaniem i suma stron z bieżącego tygodnia.
- **Książka bazowa**: jedna długa książka z terminem, np. „Europa” na 2 miesiące. Pasek wygląda jak brzeg kartek: czerwona wstążka pokazuje, gdzie jesteś, a złota kreska, gdzie powinieneś być na koniec dnia. Widzisz też normę na dziś, wynik względem planu („33 strony przed planem”), termin i ile godzin czytania zostało.
- **Czytam też**: poboczne książki z szybkim zapisem postępu i prognozą, kiedy je skończysz.
- **Cel roczny** (domyślnie 200 książek od 1.09.2026): ile książek tygodniowo i stron dziennie potrzebujesz, czy masz zapas, czy brakuje ci do planu, oraz prognoza przy obecnym tempie.
- Następna książka w kolejce i codziennie inny cytat z twoich notatek.

**Zapis postępu**
- Wpisujesz „Jestem na stronie…” albo klikasz +5, +10, +25, +50.
- Możesz zapisać stronę na wczoraj albo na dowolny dzień, jeśli zapomniałeś.
- Pomyłkę poprawiasz, wpisując niższą stronę. Statystyki same się skorygują.

**Sesje czytania**
- Stoper na cały ekran z opcją „Nie wygaszaj ekranu”.
- Po zakończeniu sesji wpisujesz stronę, a aplikacja liczy tempo w stronach na godzinę.
- Gdy sesja trwa w tle, na dole widać pigułkę z czasem.

**Biblioteka**
- Półki: Czytam, Do przeczytania (kolejka, którą układasz strzałkami), Przeczytane (z oceną i wrażeniami), Porzucone.
- Wyszukiwanie, sortowanie i filtrowanie po tagach.
- **Dodawanie z internetu**: szukasz po tytule, autorze albo ISBN (Google Books i Open Library). Tytuł, autor, liczba stron i okładka uzupełnią się same.
- **Skaner kodu kreskowego** (Android, Chrome): aparat odczyta ISBN z tyłu książki.
- **Zdjęcie okładki** z aparatu albo galerii. Jeśli książka nie ma okładki, aplikacja tworzy płócienną okładkę z tytułem.
- Ponowne czytanie książki z zachowaną historią.

**Cytaty i notatki**: zapisujesz zdanie albo własną myśl z numerem strony. Możesz je wyszukiwać, kopiować i udostępniać.

**Statystyki**: strony z ostatnich 30 dni, mapa dni czytania z pół roku, książki w kolejnych miesiącach na tle planu, rekordy oraz ranking autorów i tagów.

**Dane**
- Wszystko jest w bazie IndexedDB na telefonie. Przy starcie aplikacja prosi o trwałą pamięć, żeby system nie skasował danych przy braku miejsca.
- Kopię zapasową JSON zapiszesz przez „Udostępnij”, np. na Dysku Google. Co 7 dni pojawi się przypomnienie.
- Import i eksport CSV w formacie Goodreads.
- Jasny i ciemny motyw (albo taki jak w systemie).
- Usunięcie książki czy cytatu możesz cofnąć.

## Wrzucenie na GitHub Pages

1. Załóż repozytorium, np. `zakladka`, i wrzuć do niego **zawartość** tego folderu: `index.html` ma leżeć w głównym katalogu repo.
2. Wejdź w **Settings → Pages → Build and deployment**, wybierz **Deploy from a branch**, potem gałąź `main` i folder `/ (root)`, i kliknij **Save**.
3. Po minucie aplikacja będzie dostępna pod adresem `https://<twój-login>.github.io/zakladka/`.

Możesz też skopiować folder na swój serwer Apache, np. do `/var/www/html/zakladka`. Tryb offline i instalacja na telefonie wymagają **HTTPS** albo `localhost`.

## Instalacja na telefonie

- **Android (Chrome):** otwórz adres, potem menu ⋮ i **Zainstaluj aplikację**. Możesz też użyć przycisku w Ustawieniach aplikacji.
- **iPhone (Safari):** otwórz adres, potem **Udostępnij** i **Do ekranu początkowego**.

Po instalacji przytrzymaj ikonę, żeby dostać skróty „Zapisz postęp” i „Dodaj książkę” (Android).

## Przeniesienie danych z wersji 1 („Półka”)

Jeśli wersja 1 działała pod tym samym adresem, dane wczytają się same, bo baza ma tę samą nazwę. Jeśli adres był inny, w starej wersji zrób kopię JSON, a w Zakładce wybierz **Ustawienia → Wczytaj kopię**. Format jest zgodny.

## Aktualizacja

Po zmianie plików podbij numer w `sw.js` (`const WERSJA = 'zakladka-2.0.1'`). Telefon pobierze wtedy nową wersję przy następnym uruchomieniu z internetem.

## Pliki

| Plik | Co robi |
| --- | --- |
| `index.html` | Szkielet strony |
| `css/app.css` | Wygląd, jasny i ciemny motyw |
| `js/db.js` | Baza IndexedDB na urządzeniu |
| `js/core.js` | Model danych, plan książki bazowej, cel roczny, statystyki |
| `js/extras.js` | Wyszukiwarka książek, skaner ISBN, okładki, CSV Goodreads |
| `js/ui.js` | Ekrany, okna i obsługa kliknięć |
| `sw.js` | Service worker, czyli tryb offline |
| `manifest.webmanifest` | Dane do instalacji: nazwa, ikony, skróty |
| `icons/` | Logo i ikony aplikacji |

## Co poprawiono względem wersji 1

- Kliknięcie „Skończona” nie doliczało pozostałych stron do statystyk. Teraz pyta, czy wliczyć je do dzisiejszego dnia.
- Systemowe okienka (`alert`, `prompt`, `confirm`) blokowały aplikację zainstalowaną na telefonie. Zastąpiły je własne okna.
- Nie dało się poprawić tytułu ani liczby stron. Jest teraz edycja.
- Nie dało się zapisać stron za wczoraj. Teraz można wybrać dowolny dzień.
- Uszkodzona albo stara kopia JSON mogła wysypać aplikację. Dane są teraz sprawdzane i naprawiane przy wczytaniu.
- Service worker nie miał numeru wersji, więc telefon trzymał stare pliki. Teraz każda wersja ma swój numer.
- Sesja czytania zostawała aktywna po skończeniu albo usunięciu książki. Teraz się zamyka.
