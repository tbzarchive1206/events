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
