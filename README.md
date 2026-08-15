# EVENTS

Samodzielne archiwum wydarzeń THE BOYZ przeznaczone do publikacji jako GitHub Pages. Wygląd, układ, kolorystyka i fonty są zgodne z pozostałymi repozytoriami THE BOYZ FAN ARCHIVE.

## Funkcje

- każde wydarzenie z głównego folderu Google Drive jest osobną kartą,
- nowe foldery główne automatycznie tworzą nowe wydarzenia,
- puste foldery wydarzeń pozostają widoczne,
- sortowanie wydarzeń od najnowszych według daty `YYMMDD`,
- filtrowanie według roku, miesiąca i członka zespołu,
- wyszukiwanie po dacie `YYMMDD`, tytule wydarzenia lub nazwie pliku,
- miniaturka wydarzenia pobierana z jego galerii zdjęć albo filmu,
- galerie zdjęć i filmów z linkami `View` i `Download`,
- filmy otwierane w odtwarzaczu Google Drive,
- automatyczna synchronizacja dwa razy dziennie.

## Uruchomienie lokalne

Wymagany jest Node.js 22 oraz pnpm.

```bash
pnpm install
pnpm dev
```

Test i kompilacja:

```bash
pnpm test
```

## Publikacja na GitHub Pages

1. Utwórz puste repozytorium GitHub, np. `events`.
2. Rozpakuj ZIP i w jego folderze wykonaj:

   ```bash
   git init -b main
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/TWOJ_LOGIN/events.git
   git push -u origin main
   ```

3. Otwórz `Settings → Pages`.
4. W `Build and deployment` wybierz `Source → GitHub Actions`.
5. Workflow `Deploy GitHub Pages` opublikuje stronę.

## Automatyczna synchronizacja

1. Udostępnij główny folder jako `Każda osoba mająca link → Wyświetlający`.
2. W projekcie Google Cloud włącz `Google Drive API`.
3. Utwórz klucz API ograniczony do Google Drive API.
4. W GitHub przejdź do `Settings → Secrets and variables → Actions`.
5. Dodaj sekret `GOOGLE_DRIVE_API_KEY`.
6. Uruchom `Actions → Sync Events Archive → Run workflow`.

Synchronizacja jest uruchamiana codziennie o `05:17` i `17:17` UTC i skanuje całe drzewo folderów rekurencyjnie.

## Źródło

- [Folder Google Drive](https://drive.google.com/drive/folders/1aD839ETHAmuVLlvXyGKT-ogKZpW4aCBr)
