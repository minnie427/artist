# Search pages

The artist site retains the existing design and browser renderer. Every canonical page now also contains the same visible content and navigation in static HTML. English remains the default; `/ko/` has separately addressable Korean pages and reciprocal language alternates.

After changing `site-content.js`, `site-media.js`, `site-render.js`, or importing media, run from this repository:

```sh
node scripts/build-search-pages.js
node tests/search-schema.test.js
node tests/content-review.test.js
node tests/visual-index.test.js
node tests/visual-index-layout.test.js
node tests/contact-layout.test.js
```

Review and include regenerated HTML (including `ko/`) and `sitemap.xml` with the source changes. Run the build before deployment so the initial HTML and the interactive browser content agree. The sitemap contains canonical routes only; legacy aliases remain outside it. Do not add dates unless they reflect actual meaningful page changes.

Canonical artist host remains `https://minniepark.art/`, matching the existing CNAME. Verify HTTPS and the `www` → apex redirect in the production host settings; adding a canonical tag is not itself a redirect. The commercial host remains separate.

Search Console, Naver Search Advisor and Bing Webmaster verification require owner access. No verification tokens or analytics identifiers have been invented. Neither a sitemap nor crawler access guarantees indexing or ranking. `llms.txt` is an optional reading guide, not a supported Google ranking feature.

Existing crawler permissions are preserved. OAI-SearchBot concerns ChatGPT search, whereas GPTBot concerns training; these are different decisions. Google-Extended also covers grounding in Gemini Apps, so do not change that policy without reviewing its scope with the owner.

ProfilePage data must identify a Person or Organization with a name on the same page. An ID pointing to a different page is not enough. `scripts/search-schema.js` maintains complete identity data, a single localized page entity, and stable artwork identity. Optional profile creation/modification dates are omitted because no authoritative edit timestamp is recorded; do not substitute the build time or an invented midnight value. If real timestamps are added later, use full ISO 8601 DateTime with timezone. Run Google's Rich Results Test on public Artist and CV URLs in both languages after deployment, then request validation in Search Console. The local schema test checks this site's known schema types; it is not Google's validator and does not promise rankings or complete Search Console validation.
