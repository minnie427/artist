// Exact approved bilingual narrative and the user's original painting.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const context = {window:{}};
vm.createContext(context);
vm.runInContext(read('site-content.js'), context);
const story = context.window.MP_SITE.artistNarrative;
const approved = {
  en: 'b7127bee3f7b7f80d0a248ef64f665f0fc86e4b663fe4c830e261ab983f2da3e',
  ko: '5e663cbeea5508a8a345c4bf4487bf02842beda851eb10f8e0db3ac9d559a3d8'
};
for (const locale of ['en', 'ko']) {
  assert.equal(crypto.createHash('sha256').update(story[locale].replace(/\s+/g, ' ')).digest('hex'), approved[locale], 'Approved wording preserved across paragraph breaks');
  assert(!/[\u2013\u2014]/u.test(story[locale]), 'Long dashes replaced with commas');
  const page = read((locale === 'ko' ? 'ko/' : '') + 'artist/index.html');
  const statement = page.match(/<section class="artist-statement[^>]*>([\s\S]*?)<\/section>/)[1];
  const paragraphs = story[locale].split('\n\n');
  assert.equal(paragraphs.length, 3);
  for (const paragraph of paragraphs) assert.equal(statement.split(paragraph).length - 1, 1);
  assert.equal((statement.match(/<p>/g) || []).length, 3, 'Three readable narrative paragraphs');
  assert.equal((statement.match(/<figure\b/g) || []).length, 1, 'Only the selected painting, no guessed rose image');
  assert(statement.includes(story.image.src));
  assert(statement.includes('width="1200" height="1441"'));
  assert(statement.includes('<cite>The Pink Bird</cite>, 2021'));
  assert(statement.includes(locale === 'ko' ? '캔버스에 유채' : 'Oil on canvas'));
  assert(statement.includes('research/'));
  assert(!/placeholder|UPDATE_AFTER_BUILD/.test(statement));
}
assert(story.en.includes('because I believe participation can deepen affective experience'));
assert(story.en.includes('a pink of their own'));
assert(story.ko.includes('각자가 자기만의 핑크'));
assert(story.ko.includes('평생의 목표'));
for (const route of ['', 'works/', 'research/', 'visual-index/', 'contact/']) {
  assert(!read(route + 'index.html').includes(story.image.src), 'Painting is Artist-only');
}
const image = fs.readFileSync(path.join(root, story.image.src));
assert.equal(image.subarray(0,4).toString(), 'RIFF');
assert.equal(image.subarray(8,12).toString(), 'WEBP');
assert(image.length < 1024*1024, 'Optimised web asset under 1 MB');
for (let offset=12; offset+8<=image.length;) {
  const type=image.subarray(offset,offset+4).toString();
  assert(!['EXIF','XMP ','ICCP'].includes(type), 'No source device or location metadata');
  const size=image.readUInt32LE(offset+4);
  offset+=8+size+(size%2);
}
const css=read('editorial.css');
assert(css.includes('.artist-statement__image img { display: block; width: 100%; height: auto; object-fit: contain; filter: none; }'));
const layout=read('page-layouts.css');
const portraitRule=layout.match(/\.artist-overview__portrait img\s*\{([^}]+)\}/)[1];
for (const required of ['width:auto','max-width:100%','height:auto','max-height:70svh','filter:none','object-fit:contain','object-position:left top']) assert(portraitRule.includes(required), 'Portrait keeps its full ratio, reading-column alignment and viewport height: '+required);
assert(layout.includes('grid-template-rows: min-content 1fr auto;'), 'Approved B title and descriptor remain compact beside the portrait');
assert(layout.includes('grid-template-areas: "heading image" ". copy";'), 'Approved B narrative uses a stable left heading and right artwork/reading rail');
assert(layout.includes('min(calc(100% - var(--page-pad) * 2), var(--editorial-width))'), 'Artist and Contact keep the shared outer gutter');
assert(layout.includes('@media (max-width: 800px)'), 'Approved single-column transition is retained');
console.log('PASS: exact EN/KO narrative, comma punctuation, first-person voice, selected 2021 painting with intrinsic ratio and original colour, no embedded source metadata, approved colour portrait and no rose placeholder.');
