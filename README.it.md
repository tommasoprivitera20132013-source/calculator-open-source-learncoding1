# Calcolatrice Open Source di Partenza

Una calcolatrice open source pensata per essere facile da studiare, modificare e pubblicare.

Il codice e scritto in inglese. L'interfaccia supporta inglese e italiano. Nel progetto trovi anche una guida semplice in italiano.

Guida inglese iniziale: [README.md](README.md)  
Spiegazione del codice in inglese: [docs/CODE_GUIDE.md](docs/CODE_GUIDE.md)  
Spiegazione del codice in italiano: [docs/GUIDA_CODICE.md](docs/GUIDA_CODICE.md)

## Come aprirla in locale

Questo progetto non ha bisogno di installazioni o build.

1. Scarica il repository come file ZIP oppure clonalo:

```bash
git clone https://github.com/tuo-nome/tuo-repo.git
```

2. Apri la cartella del progetto.
3. Fai doppio clic su `index.html`.

Se preferisci, puoi usare anche un piccolo server locale:

```bash
python -m http.server 8000
```

Poi apri `http://localhost:8000`.

## Come caricarla su GitHub la prima volta

Se parti da questa cartella sul tuo computer, i comandi base sono questi:

```bash
git init
git add .
git commit -m "Initial calculator starter"
git branch -M main
git remote add origin https://github.com/tuo-nome/tuo-repo.git
git push -u origin main
```

## Come pubblicarla da GitHub

Se vuoi che la calcolatrice si apra come sito web direttamente da GitHub, puoi usare GitHub Pages.

1. Carica questi file in un repository GitHub.
2. Apri il repository su GitHub.
3. Vai in `Settings` -> `Pages`.
4. In `Build and deployment`, scegli `Deploy from a branch`.
5. Seleziona il branch `main` e la cartella `/ (root)`.
6. Salva le impostazioni.
7. GitHub generera un link pubblico per la tua calcolatrice.

Documentazione ufficiale GitHub Pages:
- https://docs.github.com/en/pages/quickstart
- https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## Struttura del progetto

- `index.html`: struttura della pagina e testi principali
- `styles.css`: grafica e layout responsive
- `script.js`: logica della calcolatrice e cambio lingua
- `docs/CODE_GUIDE.md`: spiegazione semplice del codice in inglese
- `docs/GUIDA_CODICE.md`: spiegazione semplice del codice in italiano
- `README.md`: guida principale in inglese

## Prime modifiche consigliate

- Aggiungere un tasto per la radice quadrata
- Aggiungere i tasti memoria
- Cambiare i colori
- Aggiungere una terza lingua

## Licenza

Questo progetto usa la licenza MIT.
