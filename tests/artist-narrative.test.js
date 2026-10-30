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
  en: 'a8136774c6948a70f59fb453641297a5d3c7289ecaed6428e018f6192392f86b',
  ko: '94537e3d4bb0733b26623ec2de43fc8de8682a573fb8968ae2b5264dc805f15d'
};
for (const locale of ['en', 'ko']) {
  assert.equal(crypto.createHash('sha256').update(story[locale]).digest('hex'), approved[locale], 'Only the approved public copy is included');
  assert(!/[\u2013\u2014]/u.test(story[locale]), 'Long dashes replaced with commas');
  const page = read((locale === 'ko' ? 'ko/' : '') + 'artist/index.html');
  const statement = page.match(/<section class="artist-statement[^>]*>([\s\S]*?)<\/section>/)[1];
  assert.equal(statement.split(story[locale]).length - 1, 1);
  assert.equal((statement.match(/<p>/g) || []).length, 1, 'One complete narrative paragraph');
  assert.equal((statement.match(/<figure\b/g) || []).length, 1, 'Only the selected painting, no guessed rose image');
  assert(statement.includes(story.image.src));
  assert(statement.includes('width="1200" height="1441"'));
  assert(statement.includes('<cite>The Pinkbird</cite>, 2021'));
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
assert(css.includes('.artist-hero img { display: block; width: 100%; height: auto; object-fit: contain; filter: grayscale(1) contrast(1.05); }'));
console.log('PASS: exact EN/KO narrative, comma punctuation, first-person voice, selected 2021 painting with intrinsic ratio and original colour, no embedded source metadata, unchanged grayscale portrait and no rose placeholder.');
