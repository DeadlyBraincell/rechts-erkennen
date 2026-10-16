"""Baut die fertigen Seiten.

Nimmt den Inhalt jeder Seite aus quelltext/seiteninhalte/, setzt Kopf, Navigation
und Fußzeile drumherum und schreibt die fertigen .html-Dateien in den
Hauptordner (eine Ebene über quelltext/), wo auch style.css, app.js und data.js liegen.

Aufruf:  python quelltext/build.py
"""
import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parent      # .../quelltext
ROOT = HERE.parent                                   # Hauptordner = Website
SRC = HERE / "seiteninhalte"
# --artifact: nur für die Claude-Veröffentlichung (Startseite ohne eigenes Grundgerüst)
ARTIFACT = "--artifact" in sys.argv
OUT = HERE / "_artifact" if ARTIFACT else ROOT
OUT.mkdir(exist_ok=True)

PAGES = [
    # (fertige Datei, Inhaltsdatei, Navigationstext, Seitentitel)
    ("index.html", "start.inhalt.html", "Start", "Rechts erkennen"),
    ("symbole.html", "symbole.inhalt.html", "Symbole & Codes", "Symbole & Codes"),
    ("agenda.html", "agenda.inhalt.html", "Agenda", "Die Agenda"),
    ("propaganda.html", "propaganda.inhalt.html", "Propaganda", "Propaganda erkennen"),
    ("quellen.html", "quellen.inhalt.html", "Quellen", "Quellen"),
]

FONTS = ('<link rel="preconnect" href="https://fonts.googleapis.com">'
         '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
         '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..900'
         '&family=IBM+Plex+Mono:wght@400;500;600&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600&display=swap">')


def nav(current):
    links = "".join(
        f'<a href="{f}"{" aria-current=\"page\"" if f == current else ""}>{label}</a>'
        for f, _, label, _ in PAGES)
    return f'''<header class="site-head"><div class="wrap">
<a class="brand" href="index.html"><span class="dot" aria-hidden="true"></span>Rechts erkennen</a>
<nav class="nav" aria-label="Hauptnavigation">{links}</nav>
</div></header>'''


FOOT = '''<footer class="site-foot"><div class="wrap">
<div><h3>Hilfe &amp; Ausstieg</h3>
<p>Du willst raus aus der Szene oder machst dir Sorgen um jemanden? Beratung ist vertraulich.</p>
<p><strong>NinA NRW</strong> (Ausstiegs- und Distanzierungsberatung): <span class="phone">0176 931 197 65</span> (auch Signal/SMS), <span class="phone">nina.nrw@reinit.de</span></p>
<p><a href="https://aussteigerprogramm-niedersachsen.de/" target="_blank" rel="noopener">Aussteigerprogramm Niedersachsen</a></p></div>
<div><h3>Über diese Seite</h3>
<p>Eine allgemeine Übersicht, entstanden aus Recherchen zu Lukreta und zu rechtsextremen Frauengruppen (Oktober 2026) sowie der Symbol-Übersicht von NinA NRW. Stand: 15.10.2026.</p>
<p>Keine Rechtsberatung. Die Ampel zur Strafbarkeit ist eine vereinfachte Orientierung.</p></div>
<div><h3>Nachprüfen</h3>
<p>Jede Aussage hat eine Quelle. Alle Quellen findest du gesammelt auf der <a href="quellen.html">Quellenseite</a>.</p></div>
</div></footer>'''


def build():
    for fname, content, _, title in PAGES:
        body = (SRC / content).read_text(encoding="utf-8").split("\n", 1)[1]  # Hinweis-Kommentar weglassen
        head = (f'<title>{title}</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n'
                f'{FONTS}\n<link rel="stylesheet" href="style.css">\n')
        inner = f'{nav(fname)}\n<main>\n{body}\n</main>\n{FOOT}\n<script src="data.js"></script>\n<script src="app.js"></script>\n'
        if fname == "index.html" and ARTIFACT:
            html = head + inner  # wird beim Veröffentlichen in ein Grundgerüst gehüllt
        else:
            html = ('<!doctype html>\n<html lang="de">\n<head>\n<meta charset="utf-8">\n'
                    '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
                    f'{head}</head>\n<body>\n{inner}</body>\n</html>\n')
        (OUT / fname).write_text(html, encoding="utf-8")
    if ARTIFACT:
        for f in ("style.css", "app.js", "data.js"):
            (OUT / f).write_text((ROOT / f).read_text(encoding="utf-8"), encoding="utf-8")
    print("ok:", [p.name for p in OUT.iterdir()])


if __name__ == "__main__":
    build()
