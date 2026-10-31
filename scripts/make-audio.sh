#!/usr/bin/env bash
# Build the audio version of a blog post with one command.
#
#   ./scripts/make-audio.sh                                  # the live article
#   ./scripts/make-audio.sh content/blog/posts/my-post.md    # any other post
#   VOICE=en-IN-PrabhatNeural ./scripts/make-audio.sh        # male voice
#
# Needs: python3 and `pip install edge-tts`. Output lands in ./audio-out/.

set -euo pipefail

SOURCE="${1:-content/blog/posts/aeo-geo-indian-d2c-brands-2026.md}"
VOICE="${VOICE:-en-IN-NeerjaExpressiveNeural}"
OUT_DIR="${OUT_DIR:-audio-out}"

if [ ! -f "$SOURCE" ]; then
  echo "Post not found: $SOURCE" >&2
  exit 1
fi

if ! python3 -c "import edge_tts" 2>/dev/null; then
  echo "Installing edge-tts…"
  pip install --quiet edge-tts
fi

NAME="$(basename "$SOURCE" .md)"
mkdir -p "$OUT_DIR"

echo "Voice: $VOICE"
python3 scripts/tts.py "$SOURCE" "$OUT_DIR/$NAME.mp3" --voice "$VOICE"

echo
echo "Done. Now: admin panel → open the article → Audio version → Upload → $OUT_DIR/$NAME.mp3 → Save."
