# Open Calculator Starter

An open-source calculator made to be easy to study, modify, and publish.

The code is written in English. The interface supports English and Italian. The project also includes a simple Italian guide.

Italian setup guide: [README.it.md](README.it.md)  
English code guide: [docs/CODE_GUIDE.md](docs/CODE_GUIDE.md)  
Italian code guide: [docs/GUIDA_CODICE.md](docs/GUIDA_CODICE.md)

## Open it locally

This project does not need build tools.

1. Download the repository as a ZIP file or clone it:

```bash
git clone https://github.com/your-name/your-repo.git
```

2. Open the project folder.
3. Double-click `index.html`.

You can also run a tiny local server if you prefer:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Upload it to GitHub for the first time

If you are starting from this folder on your computer, these are the basic commands:

```bash
git init
git add .
git commit -m "Initial calculator starter"
git branch -M main
git remote add origin https://github.com/your-name/your-repo.git
git push -u origin main
```

## Publish it from GitHub

If you want this calculator to open as a website directly from GitHub, use GitHub Pages.

1. Push these files to a GitHub repository.
2. Open the repository on GitHub.
3. Go to `Settings` -> `Pages`.
4. In `Build and deployment`, choose `Deploy from a branch`.
5. Select branch `main` and folder `/ (root)`.
6. Save the settings.
7. GitHub will generate a public website link for your calculator.

Official GitHub Pages docs:
- https://docs.github.com/en/pages/quickstart
- https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## Project structure

- `index.html`: page structure and text placeholders
- `styles.css`: visual design and responsive layout
- `script.js`: calculator logic and language switcher
- `docs/CODE_GUIDE.md`: simple explanation of the code in English
- `README.it.md`: Italian setup guide
- `docs/GUIDA_CODICE.md`: simple explanation of the code in Italian

## Good first changes

- Add a square root button
- Add memory buttons
- Change the color palette
- Add a third language

## License

This project uses the MIT License.
