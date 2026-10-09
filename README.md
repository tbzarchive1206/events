## Źródło

- [Folder Google Drive](https://drive.google.com/drive/folders/1aD839ETHAmuVLlvXyGKT-ogKZpW4aCBr)

## Synchronizacja i publikacja

Akcja `Sync Events Archive` pobiera pełny indeks Drive (wszystkie strony wyników
i podfoldery), uruchamia testy, zapisuje indeks w repozytorium i bezpośrednio
publikuje zbudowaną stronę w GitHub Pages. Nie polega na uruchomieniu drugiej
akcji przez commit bota. W ustawieniach GitHub Pages źródłem musi być GitHub Actions.
Sekret repozytorium `GOOGLE_DRIVE_API_KEY` musi umożliwiać odczyt źródłowego folderu.

Synchronizacja działa dwa razy dziennie, o 05:17 i 17:17 UTC. Można ją też
uruchomić ręcznie: Actions → Sync Events Archive → Run workflow.
Zmiany na Drive pojawiają się na stronie po udanej synchronizacji i publikacji.

Nazwy folderów są dowolne. Prefiks YYMMDD służy wyłącznie do datowania i filtrów;
bez niego wydarzenie otrzymuje `DATE UNKNOWN`. Puste foldery są widoczne, a nowe
zdjęcia i filmy, również w podfolderach, trafiają do galerii wydarzenia.
Nowe indeksy zawierają identyfikatory folderów, dzięki czemu powtarzające się
nazwy nie mieszają plików. Starszy indeks jest obsługiwany do następnej synchronizacji.

Testy sprawdzają strukturę danych i zachowanie na kontrolowanych przykładach,
zamiast wymagać konkretnych nazw, pustych folderów lub typów plików na Drive.
Test skryptu synchronizacji symuluje API i nie wymaga klucza ani dostępu do Drive.

## Galerie, podfoldery i filmy

Strona wydarzenia odwzorowuje kolejne poziomy folderów Drive. Kafelki podfolderów
prowadzą do ich zawartości; ścieżka nad galerią umożliwia powrót do folderów
nadrzędnych. W każdym widoku widać pliki bezpośrednio w danym folderze.
Okładka wydarzenia pochodzi wyłącznie ze zdjęcia, także z głębszych podfolderów.
Gdy brak zdjęć lub miniatura nie jest dostępna, wyświetlana jest plansza z nazwą;
film nigdy nie zastępuje zdjęcia okładki. Podfoldery mają proste białe kafelki
z niebieską ramką, nazwą i liczbą plików, bez zdjęć i okładek.

Filmy mają miniatury z Google Drive. Kliknięcie miniatury lub WATCH otwiera
odtwarzanie na Google Drive w nowej karcie. Miniatura automatycznie zachowuje
proporcje oryginalnego filmu z metadanych szerokości i wysokości; bez metadanych
wysokość dostosowuje się do naturalnych proporcji załadowanej miniatury.
Nie ma wymuszonego 16:9 ani kadrowania. Synchronizacja nadal pobiera wymiary
zdjęć i filmów. Okładki wydarzeń nadal korzystają wyłącznie ze zdjęć.
Kliknięcie zdjęcia otwiera duży podgląd na stronie, bez kadrowania i rozciągania.
Okno zdjęcia można zamknąć przyciskiem CLOSE lub klawiszem Escape.
Dostęp do odtwarzania zależy od uprawnień pliku na Drive; link VIEW pozostaje
dostępny. Nowo przesłany film może wymagać przetworzenia przez Google.

Galeria ma kolejność od najstarszych do najnowszych, czytaną w rzędach od lewej
do prawej. Data pochodzi kolejno z metadanych wykonania zdjęcia na Drive,
znacznika Unix w nazwie eksportowanego pliku, daty YYYYMMDD (opcjonalnie z czasem)
w nazwie, daty utworzenia pliku na Drive lub daty modyfikacji. Brak dat oznacza
umieszczenie na końcu, w naturalnej kolejności nazw i identyfikatorów.
Data przesłania na Drive nie musi być datą wykonania — archiwum nie zgaduje
daty wykonania, jeśli jej nie udostępniają metadane lub nazwa.

Nazwy członków w tytule wydarzenia mają pierwszeństwo przed nazwami plików.
Nazwa marki `New Era` jest pomijana przy rozpoznawaniu NEW/Chanhee; rzeczywiste
wzmianki NEW, Chanhee, 찬희 i 뉴 nadal są rozpoznawane.
