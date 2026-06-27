# Chord Alignment Converter

A lightweight browser-based tool that converts chord sheets written with a
proportional font into aligned monospace text.

## Features

- Live conversion while typing or pasting
- Configurable source font and font size
- Three chord-to-lyric mapping modes
- Copy output to the clipboard
- Download output as a `.txt` file
- No framework or build step required
- Works entirely in the browser

## Project structure

```text
chord-alignment-converter/
├── index.html
├── styles.css
├── app.js
└── README.md
```

## Run locally

Open `index.html` directly in a browser, or use a local web server:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## GitHub Pages

1. Push the project to a GitHub repository.
2. Open **Settings → Pages**.
3. Select **Deploy from a branch**.
4. Choose the `main` branch and `/root`.
5. Save the settings.

## Source-code visibility

This is a client-side application. HTML, CSS, and JavaScript delivered to a
browser are accessible to the visitor. Minification or obfuscation may make the
code harder to read, but they cannot reliably prevent copying.

Use a clear open-source license, keep secrets out of client-side code, and move
private or security-sensitive logic to a backend service.

## License

Add the open-source license that matches your intended usage rules before
publishing the repository.
