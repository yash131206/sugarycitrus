#!/usr/bin/env python3
"""Attach an AudioObject to an article's Article schema.

Usage:
    python scripts/add-audio-schema.py <slug> <audio-file-or-url> <publish-date> ["Title"]

Reads the duration from the MP3 itself, so the number in the schema is always
the real one. Run this every time an article gets an audio version.
"""
import json, re, sys, pathlib

try:
    from mutagen.mp3 import MP3
except ImportError:
    sys.exit("pip install mutagen")

ROOT = pathlib.Path(__file__).resolve().parent.parent


def iso_duration(seconds):
    return f"PT{int(seconds // 60):02d}M{int(seconds % 60):02d}S"


def main():
    if len(sys.argv) < 4:
        sys.exit(__doc__)
    slug, audio, published = sys.argv[1], sys.argv[2], sys.argv[3]
    title = sys.argv[4] if len(sys.argv) > 4 else slug.replace("-", " ").title()

    page = ROOT / "articles" / f"{slug}.html"
    if not page.exists():
        sys.exit(f"no page at {page}")

    local = ROOT / audio.lstrip("/")
    if not local.exists():
        sys.exit(f"cannot read {local} to measure duration — pass a file that exists")
    duration = iso_duration(MP3(str(local)).info.length)

    content_url = audio if audio.startswith("http") else f"https://sugarycitrus.in/{audio.lstrip('/')}"

    block = {
        "@type": "AudioObject",
        "name": title,
        "contentUrl": content_url,
        "encodingFormat": "audio/mpeg",
        "duration": duration,
        "uploadDate": published,
        "inLanguage": "en-IN",
    }

    s = page.read_text(encoding="utf-8")
    m = re.search(r'(<script type="application/ld\+json">\s*)(\{"@context":"https://schema.org","@type":"(?:Article|BlogPosting)".*?)(\s*</script>)', s, re.S)
    if m:
        data = json.loads(m.group(2))
        data["audio"] = block
        s = s[: m.start()] + m.group(1) + json.dumps(data, ensure_ascii=False) + m.group(3) + s[m.end():]
    else:
        data = {"@context": "https://schema.org", "@type": "Article", "headline": title, "audio": block}
        s = s.replace("</head>", '<script type="application/ld+json">' + json.dumps(data, ensure_ascii=False) + "</script></head>", 1)

    page.write_text(s, encoding="utf-8")
    print(f"{slug}: audio {duration} -> {content_url}")


if __name__ == "__main__":
    main()
