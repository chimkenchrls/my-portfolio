# Kenneth Charles Valdez — Portfolio

[![Check & Deploy](https://github.com/chimkenchrls/my-portfolio/actions/workflows/deploy.yml/badge.svg)](https://github.com/chimkenchrls/my-portfolio/actions/workflows/deploy.yml)

Static portfolio in plain HTML, CSS, and vanilla JavaScript: no framework, no build step.
Live at **https://chimkenchrls.github.io/my-portfolio/**.

## Updating content

All content lives in [`assets/data.js`](./assets/data.js). Use `null` for anything not ready yet;
the page shows a "coming soon" state. Then validate:

```bash
node --test tests/*.test.js
```

## Running locally

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

## Pipeline

Every push and pull request runs [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml):

1. Unit tests for the helpers and the content file (`node:test`, zero dependencies)
2. JavaScript syntax check
3. HTML validation (`html-validate`)
4. Offline link and asset-path check (`lychee`)

Pushes to `main` that pass all checks are deployed to GitHub Pages. Only runtime files
(`index.html`, `style.css`, `script.js`, `assets/`) are published.
