#!/usr/bin/env python3
"""
Turn a blog post into a spoken MP3 using Microsoft Edge's free neural voices.

Usage:
    pip install edge-tts
    python scripts/tts.py content/blog/posts/my-post.md out.mp3
    python scripts/tts.py content/blog/posts/my-post.md out.mp3 --voice en-IN-PrabhatNeural

Voices that sound right for this site:
    en-IN-NeerjaExpressiveNeural   (female, warm — default)
    en-IN-NeerjaNeural             (female, calmer)
    en-IN-PrabhatNeural            (male)

The script strips markdown, turns headings into spoken section breaks, expands
numbers and abbreviations so the reader does not stumble, and writes a single
MP3 you can upload straight into the CMS audio field.
"""
import argparse
import asyncio
import re
import sys
from pathlib import Path

DEFAULT_VOICE = "en-IN-NeerjaExpressiveNeural"


def strip_frontmatter(text: str) -> str:
    if text.startswith("---"):
        end = text.find("\n---", 3)
        if end != -1:
            return text[end + 4 :]
    return text


def expand_numbers(text: str) -> str:
    text = re.sub(r"(\d)\s?%", r"\1 percent", text)
    text = re.sub(r"\bRs\.?\s?", "rupees ", text)
    text = text.replace("₹", "rupees ")
    text = re.sub(r"\bvs\.?\b", "versus", text)
    text = re.sub(r"\be\.g\.", "for example", text)
    text = re.sub(r"\bi\.e\.", "that is", text)
    text = re.sub(r"\betc\.", "and so on", text)
    return text


def to_speech(markdown: str) -> str:
    text = strip_frontmatter(markdown)

    # tables and code blocks read badly out loud
    text = re.sub(r"```.*?```", "", text, flags=re.S)
    text = re.sub(r"^\|.*$", "", text, flags=re.M)

    # headings become short spoken breaks
    text = re.sub(r"^######\s*(.+)$", r"\n\1.\n", text, flags=re.M)
    text = re.sub(r"^#####\s*(.+)$", r"\n\1.\n", text, flags=re.M)
    text = re.sub(r"^####\s*(.+)$", r"\n\1.\n", text, flags=re.M)
    text = re.sub(r"^###\s*(.+)$", r"\n\1?\n", text, flags=re.M)
    text = re.sub(r"^##\s*(.+)$", r"\n\1.\n", text, flags=re.M)
    text = re.sub(r"^#\s*(.+)$", r"\n\1.\n", text, flags=re.M)

    # links keep their label, images go away
    text = re.sub(r"!\[[^\]]*\]\([^)]*\)", "", text)
    text = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", text)

    # emphasis and inline code markers
    text = re.sub(r"[*_`>#]", "", text)

    # list bullets become sentence pauses
    text = re.sub(r"^\s*[-*+]\s+", "", text, flags=re.M)
    text = re.sub(r"^\s*\d+\.\s+", "", text, flags=re.M)

    text = expand_numbers(text)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


async def render(text: str, out_path: Path, voice: str) -> None:
    import edge_tts

    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(str(out_path))


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate a blog audio version as MP3.")
    parser.add_argument("source", help="markdown file of the post")
    parser.add_argument("output", help="mp3 file to write")
    parser.add_argument("--voice", default=DEFAULT_VOICE, help=f"edge-tts voice (default {DEFAULT_VOICE})")
    args = parser.parse_args()

    source = Path(args.source)
    if not source.exists():
        print(f"Not found: {source}", file=sys.stderr)
        return 1

    text = to_speech(source.read_text(encoding="utf-8"))
    if len(text) < 200:
        print("Text looks too short to narrate.", file=sys.stderr)
        return 1

    out_path = Path(args.output)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    asyncio.run(render(text, out_path, args.voice))

    size_mb = out_path.stat().st_size / (1024 * 1024)
    words = len(text.split())
    print(f"Wrote {out_path} · {size_mb:.1f} MB · about {words / 150:.0f} min of audio · voice {args.voice}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
