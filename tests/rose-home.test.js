const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..'),read=file=>fs.readFileSync(path.join(root,file),'utf8');
for(const route of ['','ko/']){
 const html=read(route+'index.html');
 assert(html.includes('data-experience="rose-field-10"'));
 assert.equal((html.match(/<h1\b/g)||[]).length,1);
 assert(!/heroVisual|textCanvas|blobCanvas|interaction-hint|hero-visual\.js|rose-sprites\.js|Private interaction study|noindex/.test(html));
 assert.equal((html.match(/src="[^\"]*rose-home-template\.js/g)||[]).length,1);
 assert.equal((html.match(/src="[^\"]*rose-home\.js/g)||[]).length,1);
 assert(html.indexOf('rose-home-template.js')<html.indexOf('src="'+(route?'../':'./')+'site-render.js'));
 assert(html.includes('name="robots" content="index, follow, max-image-preview:large"'));
 assert(html.includes('href="https://minniepark.art/'+route+'"'));
 assert(html.includes('aria-controls="primaryLinks"'));
 assert(html.includes('<noscript>')&&html.includes('id="roseFallback"')&&html.includes('src="'+(route?'../':'./')+'assets/rose-halftone.png"'));
 assert(html.includes('id="interactionCue"') && html.includes('id="interactionHelp"'));
 assert(html.includes('class="interaction-cue__icon"') && html.includes('class="interaction-cue__rays"'), 'The centred cue uses a local click icon');
 const cueText=html.match(/<p id="interactionCue"[\s\S]*?<\/p>/)[0].replace(/<[^>]+>/g,'').trim();
 assert.equal(cueText,route?'감정의 양가성을 탐색하는 인터랙티브 공간.':'An interactive space for emotional ambivalence.','Keep the exact fixed cue wording');
 assert(!html.includes('data-effect=') && !html.includes('effectCaption'), 'Emotion words choose responses without a comparison menu');
 assert(html.includes('id="heroTitle"><a href='), 'The only homepage title is its home link');
 const ids=[...html.matchAll(/\bid="([^\"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length);
 for(const [,src]of html.matchAll(/(?:src|href)="((?:\.\/|\.\.\/)[^\"]+\.(?:js|css|png)(?:\?[^\"]*)?)"/g))assert(fs.existsSync(path.resolve(root,route,src.split('?')[0])),src);
}
assert(!read('rose-home.js').includes("$('language').addEventListener"));
assert(!read('rose-home.js').includes('Start Preview.command'));
assert(read('rose-home.js').includes("lang:document.documentElement.lang==='ko'?'ko':'en'"));
assert(read('rose-home.js').includes('audio: false'));
assert(read('rose-home.js').includes('if(!event.persisted)S.renderer?.dispose()'));
assert(read('rose-home.js').includes("window.addEventListener('pageshow',event=>"));
assert(read('rose-home.js').includes("$('camera').addEventListener('click',async()=>"));
assert(read('rose-home.css').includes('body[data-page="home"]{height:auto'));
for(const route of ['artist/','works/','research/','editions/','contact/','ko/artist/'])assert(!/rose-home\.(?:js|css)/.test(read(route+'index.html')),'Homepage assets must remain home-only');
// Evaluate the non-DOM modules only: verify accumulation across all five
// automatic routes, rather than merely checking that button labels changed.
const modules=read('rose-home.js').split(";\n(() => {\n  'use strict';\n  const $=id=>")[0];
const context={console,Float32Array,Uint16Array,document:{addEventListener(){}},addEventListener(){}};
context.window=context;context.globalThis=context;vm.createContext(context);vm.runInContext(modules,context);
const {RoseMath,RoseEffectSession,RoseEffectLabRenderer,RoseInteractionCue,RoseViewportSizing,RoseFieldLayout}=context;
// Exercise the actual scene listener and once-per-visit state without a camera.
function cueFixture(){const listeners={},scene={dataset:{},addEventListener(type,listener){listeners[type]=listener;}},cue={hidden:false};return{scene,cue,listeners,controller:RoseInteractionCue.mount(scene,cue)};}
let cueCase=cueFixture();cueCase.controller.refresh(false);assert.equal(cueCase.cue.hidden,false);
cueCase.listeners.click({button:2});assert.equal(cueCase.cue.hidden,false,'A context click is not the entry interaction');
cueCase.listeners.click({button:0});assert.equal(cueCase.cue.hidden,true,'A primary scene click dismisses the cue');
assert.equal(cueCase.scene.dataset.cueDismissed,'true');
cueCase.controller.refresh(false);assert.equal(cueCase.cue.hidden,true,'Reset or a tracking status refresh does not reopen the invitation');
cueCase=cueFixture();cueCase.controller.dismiss();cueCase.controller.refresh(true);cueCase.controller.refresh(false);assert.equal(cueCase.cue.hidden,true,'Keyboard/hand feeling selection uses the same persistent dismissal');
cueCase=cueFixture();assert.equal(cueCase.cue.hidden,false,'Navigation, camera and help have no listener in the scene controller');
assert.deepEqual(Object.keys(cueCase.listeners),['click']);
assert(/\.scene > \.interaction-cue\s*\{[\s\S]*?left:50%;[\s\S]*?top:50%;/.test(read('rose-home.css')));
assert(read('rose-home.css').includes('@keyframes rose-cue-float') && read('rose-home.css').includes('@media(prefers-reduced-motion:reduce)'));
// The viewport budget may reduce the fixed rose footprint on resize, while
// keeping all seven cards and preserving their positions for new selections.
for(const [width,height,cardWidth,cardHeight] of [[320,314,96,55],[390,557,104,63],[768,320,154,68],[1100,480,154,68],[1440,577,154,68]]){
 const widths=Array(7).fill(cardWidth),heights=Array(7).fill(cardHeight),sizing=RoseViewportSizing.configure(width,height,widths,heights);
 assert(sizing.fit,`${width}×${height}: seven cards fit the compact scene`);
 const layout=RoseFieldLayout.create();layout.resize(width,height);
 const input={dt:0,time:0,widths,heights,reservedEllipse:{x:width/2,y:height/2,rx:sizing.radius*1.13,ry:sizing.radius*1.13,gap:sizing.gap}};
 const before=layout.update(input),after=layout.update({...input,frozen:new Set(['node-3'])});
 assert.equal(before.unplaced,0);assert.equal(after.unplaced,0);
 assert.deepEqual(before.map(p=>[p.x,p.y]),after.map(p=>[p.x,p.y]),'Selection membership cannot repack the cards');
 assert.equal(RoseEffectLabRenderer.fixedBaseRadius(width,height),sizing.radius,'Renderer and card reservation share one fixed viewport radius');
}
assert(!read('rose-home.js').includes('RosePreviewSizing'));
assert.equal((read('rose-home.js').match(/RoseViewportSizing\.configure\(/g)||[]).length,1,'Only the resize path configures the source footprint');
assert(read('rose-home.css').includes('@supports(height:100dvh)'));
const responseWords={joy:'offspring',distance:'separation',unease:'glitch',fear:'thorn',grief:'erosion'};
for(const [word,effect] of Object.entries(responseWords)) assert.equal(RoseMath.effectOf(word),effect);
const session=RoseEffectSession.create();
assert.equal(session.snapshot().total,0);
for(const word of Object.keys(responseWords)) session.select(word,RoseMath.polarityOf(word));
let state=session.snapshot(), plan=RoseEffectLabRenderer.planEffects(state.events,state.mode);
assert.equal(state.mode,'emotion');assert.equal(state.total,5);
assert.equal(plan.children.length,1);assert(plan.separation>0);assert(plan.glitch);assert(plan.thornCount>0);assert(plan.erosion>0);
session.select('hope','positive');state=session.snapshot();plan=RoseEffectLabRenderer.planEffects(state.events,state.mode);
assert.equal(state.total,6);assert.equal(plan.children.length,2);assert(plan.thornCount>0 && plan.glitch && plan.erosion>0 && plan.separation>0, 'Earlier responses stay when a different feeling is added');
session.reset();state=session.snapshot();plan=RoseEffectLabRenderer.planEffects(state.events,state.mode);
assert.equal(state.total,0);assert.equal(plan.children.length,0);assert.equal(plan.thornCount,0);assert.equal(plan.erosion,0);assert.equal(plan.separation,0);assert.equal(plan.glitch,null);
const hash=()=>crypto.createHash('sha256').update(['index.html','ko/index.html'].map(read).join('\n')).digest('hex');
const before=hash();cp.execFileSync(process.execPath,['scripts/build-search-pages.js'],{cwd:root});assert.equal(hash(),before,'Generated homes must be idempotent');
console.log('PASS: bilingual integrated home, shared navigation, SEO, media paths, camera consent boundary, scoped styles, emotion-led cumulative responses, accessible help, no comparison menu/legacy canvases, idempotent generation.');
