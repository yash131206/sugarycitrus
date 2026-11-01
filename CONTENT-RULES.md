# Editorial rules

Rules for every article published on Sugary Citrus. Written after an article shipped with a citation whose source had already revised its own figures.

## Sources

1. Open every source before using it. A search snippet is not the source.
2. Confirm the exact number, the sample size and the date appear on the page you are citing.
3. Check whether the publisher has since corrected or superseded the figure — look for editor's notes, methodology updates, or a newer edition of the same index. If it was revised, use the corrected number or say plainly that the earlier reading was revised, and link the note.
4. Link only URLs you actually opened. If a source cannot be opened, list its name and date with no link. Never invent a URL.
5. If a number cannot be verified, write the point qualitatively instead. A weaker sentence beats a wrong number.

## Writing

- Answer in the first two paragraphs, before any framing.
- Question-shaped headings that match how someone would actually ask an assistant.
- Statistics, dates and named sources inline; no unsourced superlatives.
- A `## Sources` section at the end of every article.
- No invented client names, case studies, testimonials or quotes.

## Metadata

- `<title>` (seo_title) under 60 characters; the on-page H1 can be longer.
- Description 150-160 characters.
- One H1 per page, canonical, and a cover image.

## Before publishing

- Run `SITE_URL=https://yash131206.github.io/sugarycitrus node scripts/build-blog.js`.
- Check the built HTML: title length, description length, links rendering as anchors, Sources section present.
- Publish only after the draft has been approved.
