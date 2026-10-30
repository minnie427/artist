# Homepage versions

The homepage immediately before Rose Field was preserved on 30 October 2026.

- GitHub restore point: branch `archive/home-before-rose-field-2026-10-30`.
- A local annotated Git tag of the same name and a private full archive are also retained.
- This includes the previous floating-rose/text homepage and the approved editorial, acquisition-enquiry and exhibition-history updates.
- The Rose Field integration is a separate later commit. Review that commit before selectively reverting it; do not reset a working branch or overwrite later work.
- A separate private full working-tree archive and verified Git history bundle are retained by the owner. No private backup is included in this website.

Rose Field source: `rose-home-template.js`, `rose-home.js`, `rose-home.css`. `site-render.js` and `scripts/build-search-pages.js` integrate it into the existing bilingual routes and shared navigation. Rebuild static pages with `node scripts/build-search-pages.js`. The prior `hero-visual.js` and `rose-sprites.js` files remain available for historical restoration and are not loaded on the new homepage.
