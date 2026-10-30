(function (root) {
  'use strict';
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const words = [
    {id:'tenderness',ko:'다정함',channels:[1,.15,.6,.3]},
    {id:'longing',ko:'그리움',channels:[.8,.5,.3,1]},
    {id:'unease',ko:'불안',channels:[.35,1,1,.3]},
    {id:'attachment',ko:'애착',channels:[1,.3,.5,1]},
    {id:'distance',ko:'거리',channels:[.2,1,.5,.8]},
    {id:'desire',ko:'욕망',channels:[1,.6,.8,.4]},
    {id:'aversion',ko:'거부감',channels:[.4,1,1,.3]},
    {id:'intimacy',ko:'친밀함',channels:[.9,.4,.3,1]},
    {id:'alienation',ko:'소외감',channels:[.3,1,.7,.8]},
    {id:'vulnerability',ko:'취약함',channels:[.7,.8,1,.4]},
    {id:'comfort',ko:'안도감',channels:[1,.3,.7,.5]},
    {id:'grief',ko:'슬픔',channels:[.6,.7,.4,1]},
    {id:'trust',ko:'신뢰',channels:[.7,.3,1,.8]},
    {id:'doubt',ko:'의심',channels:[.4,1,.8,.6]},
    {id:'resistance',ko:'저항',channels:[.8,.9,1,.3]},
    {id:'care',ko:'돌봄',channels:[1,.2,.8,.5]},
    {id:'fear',ko:'두려움',channels:[.4,1,1,.5]},
    {id:'relief',ko:'안도',channels:[1,.4,.4,.8]},
    {id:'anger',ko:'분노',channels:[.7,1,1,.3]},
    {id:'joy',ko:'기쁨',channels:[1,.5,.3,.7]},
    {id:'sorrow',ko:'비애',channels:[.6,.8,.4,1]},
    {id:'hope',ko:'희망',channels:[1,.3,.6,.8]},
    {id:'hesitation',ko:'망설임',channels:[.3,1,.7,.8]},
    {id:'yearning',ko:'열망',channels:[.9,.6,.5,1]},
    {id:'loss',ko:'상실감',channels:[.4,.9,.6,1]},
    {id:'affection',ko:'애정',channels:[1,.3,.7,.7]},
    {id:'restlessness',ko:'초조함',channels:[.5,1,.8,.6]},
    {id:'ambivalence',ko:'양가감정',channels:[.9,.9,.9,.9]}
  ];
  // These are two compositional routes, not a diagnosis or a claim that an
  // ambivalent human feeling is inherently good/bad. Opening/expansion:
  // tenderness, longing, attachment, desire, intimacy, vulnerability, comfort,
  // trust, care, relief, joy, hope, yearning, affection. Fracture/interference:
  // unease, distance, aversion, alienation, grief, doubt, resistance, fear,
  // anger, sorrow, hesitation, loss, restlessness, ambivalence.
  const polarityMap = Object.freeze({
    tenderness:'positive',longing:'positive',unease:'negative',attachment:'positive',
    distance:'negative',desire:'positive',aversion:'negative',intimacy:'positive',
    alienation:'negative',vulnerability:'positive',comfort:'positive',grief:'negative',
    trust:'positive',doubt:'negative',resistance:'negative',care:'positive',
    fear:'negative',relief:'positive',anger:'negative',joy:'positive',sorrow:'negative',
    hope:'positive',hesitation:'negative',yearning:'positive',loss:'negative',
    affection:'positive',restlessness:'negative',ambivalence:'negative'
  });
  function polarityOf(id) { return polarityMap[id] || 'positive'; }
  // Word-to-response assignments are a compositional choice for this artwork.
  // They do not classify the viewer or infer an emotional state.
  const responseMap = Object.freeze({
    distance:'separation',alienation:'separation',hesitation:'separation',
    unease:'glitch',doubt:'glitch',restlessness:'glitch',ambivalence:'glitch',
    aversion:'thorn',resistance:'thorn',fear:'thorn',anger:'thorn',
    grief:'erosion',sorrow:'erosion',loss:'erosion'
  });
  function effectOf(id) { return polarityOf(id) === 'positive' ? 'offspring' : responseMap[id] || 'glitch'; }
  const banks=[[0,1,2,3,4],[5,6,7,8,9],[10,11,12,13,14]];
  function effects(layers){
    const result=[0,0,0,0];
    layers.forEach(id=>words.find(w=>w.id===id)?.channels.forEach((n,i)=>result[i]+=n/4));
    return result.map(n=>clamp(n,0,1.6));
  }
  function wordPositions(width,height,time,reduced) {
    const mobile = width < 600;
    const points = mobile ? [[.21,.10],[.79,.17],[.80,.65],[.20,.72],[.55,.88]]
      : width<1000 ? [[.19,.16],[.8,.14],[.86,.60],[.18,.70],[.64,.88]]
        : [[.27,.15],[.74,.18],[.79,.61],[.24,.72],[.62,.88]];
    return points.map(([x,y],i)=>({x:width*x+(reduced?0:Math.sin(time*.28+i*1.7)*9),y:height*y+(reduced?0:Math.cos(time*.32+i*2.3)*9)}));
  }
  function targetFace(face,width,height) {
    const size = Math.min(width*.47,height*.60,350);
    if (!face) return {x:width*.5,y:height*.40,size,angle:0};
    return {
      x:clamp(face.x,.25,.75)*width*.6+width*.2,
      y:height*(.40+clamp(face.y-.45,-.22,.22)*.32),
      size:size*clamp(face.width/.24,.8,1.15),
      angle:clamp(face.angle||0,-.23,.23)
    };
  }
  function nearestWord(pointer,points,boxes) {
    let best=-1,score=Infinity;
    points.forEach((p,i)=>{
      const rx=Math.max(34,boxes[i].width/2+12),ry=30;
      const d=Math.pow((p.x-pointer.x)/rx,2)+Math.pow((p.y-pointer.y)/ry,2);
      if(d<=1&&d<score){score=d;best=i;}
    });
    return best;
  }
  class PinchGate {
    constructor(){this.reset();}
    reset(){this.held=false;this.armed=false;this.last=-Infinity;this.closedSince=null;}
    update(ratio,time,target){
      if(!Number.isFinite(ratio)){this.held=false;this.armed=false;this.closedSince=null;return false;}
      if(ratio>.42){this.held=false;this.armed=true;this.closedSince=null;return false;}
      if(ratio<.25&&this.armed&&!this.held){
        if(this.closedSince===null)this.closedSince=time;
        if(time-this.closedSince<65)return false;
        this.held=true;this.armed=false;this.closedSince=null;
        if(target>=0&&time-this.last>500){this.last=time;return true;}
      }else if(ratio>=.25){this.closedSince=null;}
      return false;
    }
  }
  root.RoseMath={clamp,words,banks,effects,wordPositions,targetFace,nearestWord,PinchGate,polarityOf,polarityMap,effectOf,responseMap};
})(globalThis);

;
(function (root) {
  'use strict';

  // No timers: the preview's animation loop owns the clock. dt/time are in ms.
  function create(options) {
    options = options || {};
    const count = Math.max(0, Math.min(32, Math.floor(Number(options.count) || 7)));
    const wordCount = Math.max(1, Math.floor(Number(options.wordCount) || 28));
    const seedText = String(options.seed === undefined ? 'rose-emotion-slots-v5' : options.seed);
    let initialSeed = 2166136261;
    for (let i = 0; i < seedText.length; i++) initialSeed = Math.imul(initialSeed ^ seedText.charCodeAt(i), 16777619);
    let randomState;
    let clock;
    let lastTime;
    let lastReduced;
    let slots;

    function random() {
      randomState += 0x6D2B79F5;
      let n = randomState;
      n = Math.imul(n ^ n >>> 15, n | 1);
      n ^= n + Math.imul(n ^ n >>> 7, n | 61);
      return ((n ^ n >>> 14) >>> 0) / 4294967296;
    }
    function period(reduced) {
      return reduced ? 1500 + random() * 400 : 100 + random() * 80;
    }
    function indexOf(index) {
      if (typeof index === 'string' && index.indexOf('node-') === 0) index = Number(index.slice(5));
      return Number.isInteger(index) && index >= 0 && index < slots.length ? index : -1;
    }
    function snapshot() {
      return slots.map(slot => ({ id: slot.id, word: slot.word, held: slot.held, revision: slot.revision }));
    }
    function reset() {
      randomState = initialSeed;
      clock = 0;
      lastTime = null;
      lastReduced = null;
      slots = Array.from({ length: count }, (_, index) => ({
        id: 'node-' + index,
        word: index % wordCount,
        revision: 0,
        held: false,
        manualHold: false,
        until: 0,
        due: 70 + index * 17 + random() * 55
      }));
      return snapshot();
    }
    function nextWord(slot) {
      // Distinct visible words where the supplied vocabulary permits it.
      const occupied = new Set(slots.filter(other => other !== slot).map(other => other.word));
      const start = Math.floor(random() * wordCount);
      for (let offset = 0; offset < wordCount; offset++) {
        const candidate = (start + offset) % wordCount;
        if (candidate !== slot.word && !occupied.has(candidate)) return candidate;
      }
      // A smaller vocabulary must repeat, but need not repeat the same word.
      return wordCount > 1 ? (slot.word + 1 + Math.floor(random() * (wordCount - 1))) % wordCount : slot.word;
    }
    function update(frame) {
      frame = frame || {};
      const incomingTime = Number.isFinite(frame.time) ? frame.time : null;
      let step = Number.isFinite(frame.dt) ? Math.max(0, frame.dt) : 0;
      if (!Number.isFinite(frame.dt) && incomingTime !== null && lastTime !== null) step = Math.max(0, incomingTime - lastTime);
      if (incomingTime !== null) lastTime = lastTime === null ? incomingTime : Math.max(lastTime, incomingTime);
      clock += step;

      const reduced = !!frame.reduced;
      if (lastReduced !== reduced) {
        // Reduced-motion mode avoids the fast slot-machine turnover entirely.
        if (reduced || lastReduced !== null) slots.forEach(slot => { slot.due = clock + period(reduced); });
        lastReduced = reduced;
      }
      const frozen = frame.frozen && typeof frame.frozen.has === 'function' ? frame.frozen : new Set();
      slots.forEach((slot, index) => {
        slot.held = slot.manualHold || frozen.has(slot.id) || frozen.has(index) || clock < slot.until;
        if (slot.held || clock < slot.due) return;
        const word = nextWord(slot);
        if (word !== slot.word) {
          slot.word = word;
          slot.revision++;
        }
        // On tab resume advance once, not a hidden backlog of hundreds of spins.
        slot.due = clock + period(reduced);
      });
      return snapshot();
    }
    function hold(index, held) {
      index = indexOf(index);
      if (index < 0) return;
      slots[index].manualHold = held === undefined ? true : !!held;
      slots[index].held = slots[index].manualHold || clock < slots[index].until;
    }
    function freezeUntil(index, untilMs) {
      index = indexOf(index);
      if (index < 0 || !Number.isFinite(untilMs)) return;
      slots[index].until = Math.max(slots[index].until, untilMs);
      slots[index].held = slots[index].manualHold || clock < slots[index].until;
    }
    function freezeFor(index, durationMs) {
      if (Number.isFinite(durationMs)) freezeUntil(index, clock + Math.max(0, durationMs));
    }
    function wordAt(index) {
      index = indexOf(index);
      return index < 0 ? undefined : slots[index].word;
    }

    reset();
    return { update, snapshot, wordAt, hold, freezeUntil, freezeFor, reset };
  }

  root.RoseEmotionSlots = { create };
})(globalThis);

;
(function () {
  'use strict';

  // Complete sentences stay intact when the renderer distributes them spatially.
  // Code is display material only; none of the snippet text is evaluated.
  const snippets = [
    { language: 'en', text: 'Petals and thorns make tenderness and resistance part of the same encounter.' },
    { language: 'en', text: 'A pink rose holds attraction and the possibility of pain in a single form.' },
    { language: 'en', text: 'Ambivalence allows conflicting feelings to remain present together.' },
    { language: 'en', text: 'Opposing feelings can coexist without cancelling one another.' },
    { language: 'en', text: 'Pink carries intensity through atmosphere, texture and contrast.' },
    { language: 'en', text: 'Affective experience emerges between the participant, material and responsive image.' },
    { language: 'en', text: 'Touch changes the composition; the encounter remains open to interpretation.' },
    { language: 'en', text: 'Interaction gives each participant a part in how the work unfolds.' },
    { language: 'en', text: 'The rose moves between living material, tactile interface and digital image.' },
    { language: 'en', text: 'A gesture can draw the rose closer while increasing its distortion.' },
    { language: 'en', text: 'Accumulated gestures leave visible traces in the rose.' },
    { language: 'en', text: 'Tenderness and friction occupy the same responsive surface.' },
    { language: 'en', text: 'Attraction can persist within a form that has become unfamiliar.' },
    { language: 'en', text: 'The pink rose retains its delicacy as its image becomes unstable.' },
    { language: 'en', text: 'A body enters the composition through movement and sustained attention.' },
    { language: 'en', text: 'The image responds to a gesture without assigning it an emotion.' },
    { language: 'en', text: 'Emotion is embodied, relational and shaped by cultural experience.' },
    { language: 'en', text: 'A single emotional label cannot contain the whole encounter.' },
    { language: 'en', text: 'Shared presence changes the conditions of participation.' },
    { language: 'en', text: 'The rose continues to change while its digital image can repeat.' },
    { language: 'en', text: 'Bloom and decay overlap within the duration of the flower.' },
    { language: 'en', text: 'Petals lose moisture while their image retains the trace of colour.' },
    { language: 'en', text: 'Repeated contact becomes part of the flower’s material history.' },
    { language: 'en', text: 'A photograph preserves a condition that the living rose has already left.' },
    { language: 'en', text: 'The dried rose remains a material record of an unrepeatable encounter.' },
    { language: 'en', text: 'Memory gathers around the distance between a flower and its image.' },
    { language: 'en', text: 'Life and death are approached as overlapping conditions.' },
    { language: 'en', text: 'The work holds contradiction in view without asking it to resolve.' },
    { language: 'ko', text: '장미의 꽃잎과 가시는 하나의 대상 안에 부드러움과 저항을 함께 놓는다.' },
    { language: 'ko', text: '핑크는 감정을 지시하는 기호보다 분위기와 강도로 작동한다.' },
    { language: 'ko', text: '양가감정은 서로 다른 감정이 사라지지 않은 채 공존하는 상태다.' },
    { language: 'ko', text: '참여자의 움직임은 이미지에 개입하고, 그 흔적은 잠시 남는다.' },
    { language: 'ko', text: '한 번의 접촉으로 경험을 하나의 감정에 고정할 수는 없다.' },
    { language: 'ko', text: '장미는 전시의 시간과 수많은 접촉을 지나며 계속 변한다.' },
    { language: 'ko', text: '살아 있는 장미가 사라진 뒤에도 사진에는 그 시간의 흔적이 남는다.' },
    { language: 'ko', text: '피어남과 시듦, 삶과 죽음은 같은 장미 안에서 겹쳐진다.' },
    { language: 'code', text: 'const rose = { petals: true, thorns: true };' },
    { language: 'code', text: 'const feeling = new Set(["attraction", "unease"]);' },
    { language: 'code', text: 'const traces = []; const record = touch => traces.push(touch);' },
    { language: 'code', text: 'const simultaneous = ["bloom", "decay"];' }
  ].map(snippet => Object.freeze(snippet));

  globalThis.RoseTextField = Object.freeze({
    snippets: Object.freeze(snippets),
    counts: Object.freeze({ en: 28, ko: 8, code: 4 }),
    total: snippets.length
  });
}());

;
(function (root) {
  'use strict';
  const languages = Object.freeze(['en','en','ko','en','en','code','en','ko','en','en','en','en','ko','en','en','code','en','ko','en','en']);
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const smooth = n => { n = clamp(n, 0, 1); return n * n * (3 - 2 * n); };
  function create(options = {}) {
    const corpus = root.RoseTextField?.snippets;
    if (!Array.isArray(corpus)) throw new Error('RoseTextStream requires RoseTextField.snippets.');
    const pools = {en:[],ko:[],code:[]};
    corpus.forEach(e => { if (e && pools[e.language] && typeof e.text === 'string') pools[e.language].push(e.text); });
    for (const language of Object.keys(pools)) if (!pools[language].length) throw new Error('Missing ' + language + ' corpus.');
    let seed = 2166136261;
    for (const char of String(options.seed ?? 'rose-text-stream-v8')) seed = Math.imul(seed ^ char.charCodeAt(0), 16777619);
    let randomState, clock, lastTime, lastReduced, streams, cursors;
    function random() { randomState += 0x6D2B79F5; let n = randomState; n = Math.imul(n ^ n >>> 15, n | 1); n ^= n + Math.imul(n ^ n >>> 7, n | 61); return ((n ^ n >>> 14) >>> 0) / 4294967296; }
    function period(reduced) { return reduced ? 11000 + random() * 5000 : 4500 + random() * 3500; }
    function nextIndex(stream) {
      const pool = pools[stream.language], occupied = new Set(streams.filter(s => s !== stream && s.language === stream.language).map(s => s.index));
      for (let k = 0; k < pool.length; k++) {
        const candidate = (cursors[stream.language] + k) % pool.length;
        if (candidate !== stream.index && !occupied.has(candidate)) { cursors[stream.language] = (candidate + 1) % pool.length; return candidate; }
      }
      return pool.length > 1 ? (stream.index + 1) % pool.length : stream.index;
    }
    function snapshot() {
      return streams.map(s => {
        const ageMs = Math.max(0, clock - s.since), until = Math.max(0, s.due - clock);
        // The next full sentence and location are committed only at zero alpha.
        // Readable hold time is deliberately longer than the visual fades.
        const opacity = lastReduced ? 1 : Math.min(smooth(ageMs / 620), smooth(until / 520));
        return {id:s.id,language:s.language,text:pools[s.language][s.index],revision:s.revision,cycle:s.revision,layoutSeed:s.layoutSeed,changed:s.changed,age:ageMs / 1000,opacity,phase:opacity > .995 ? 'live' : until < 520 ? 'out' : 'in'};
      });
    }
    function reset() {
      randomState = seed; clock = 0; lastTime = null; lastReduced = null; cursors = {en:0,ko:0,code:0};
      streams = languages.map((language, i) => {
        const since = -900 - random() * 1800;
        return {id:'text-' + i,language,index:cursors[language]++ % pools[language].length,revision:0,changed:false,since,due:1800 + i * 210 + random() * 400,layoutSeed:Math.floor(random() * 2147483647)};
      });
      return snapshot();
    }
    function update(frame = {}) {
      const incoming = Number.isFinite(frame.time) ? frame.time : null;
      let step = Number.isFinite(frame.dt) ? Math.max(0, frame.dt) : 0;
      if (!Number.isFinite(frame.dt) && incoming !== null && lastTime !== null) step = Math.max(0, incoming - lastTime);
      if (incoming !== null) lastTime = lastTime === null ? incoming : Math.max(lastTime, incoming);
      const reduced = !!frame.reduced;
      if (lastReduced !== reduced) {
        if (reduced || lastReduced !== null) streams.forEach(s => { s.due = clock + period(reduced); });
        lastReduced = reduced;
      }
      clock += step;
      streams.forEach(s => {
        s.changed = false;
        if (clock < s.due) return;
        const next = nextIndex(s);
        if (next !== s.index) { s.index = next; s.revision++; s.changed = true; s.layoutSeed = Math.floor(random() * 2147483647); }
        s.since = clock; s.due = clock + period(reduced);
      });
      return snapshot();
    }
    reset();
    return {snapshot,update,reset};
  }
  root.RoseTextStream = Object.freeze({create,languages});
})(globalThis);

;
(function (root) {
  'use strict';
  const clamp = (n,a,b) => Math.max(a,Math.min(b,n));
  const finite = (n,f) => Number.isFinite(n) ? n : f;
  const hash = n => { const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
  const mix = (seed,a,b) => a + hash(seed) * (b-a);
  const overlaps = (a,b,gap=0) => Math.abs(a.x-b.x) < (a.width+b.width)/2 + gap && Math.abs(a.y-b.y) < (a.height+b.height)/2 + gap;

  // This is the original homepage TextBlock grammar: ordered words, changing
  // line limits, uneven indents/lifts, and tiny independent word offsets. It
  // does not scramble Korean syllables or fabricate unfinished code fragments.
  function linePlan(text, options={}) {
    const mobile = !!options.mobile, seed = finite(options.seed,1), language = options.language || 'en';
    const fontSize = finite(options.fontSize,mobile?8.5:language==='ko'?9.5:10), width = Math.max(48,finite(options.width,mobile?118:190));
    const measure = typeof options.measure === 'function' ? options.measure : word => Array.from(word).reduce((sum,c) => sum + fontSize * (c.charCodeAt(0)>255?.98:.59),0);
    const space = measure(' '), words = String(text).replace(/\s+/g,' ').trim().split(' ').filter(Boolean), lines=[];
    let pending=[], lineIndex=0, total=0;
    function createLine() {
      if (!pending.length) return;
      const rowSeed=seed+lineIndex*31.7;
      let cursor=0;
      const runs=pending.map((word,j)=>{
        const q=rowSeed+j*17.3, wordWidth=measure(word), gap=space*mix(q+8.8,mobile?.82:.52,mobile?1.26:1.72);
        const result={text:word,offsetX:mix(q+2.2,mobile?-.03:-.1,mobile?.07:.18)*fontSize,offsetY:mix(q+4.4,mobile?-.16:-.36,mobile?.16:.36)*fontSize,opacity:mix(q+6.6,.88,1),spaceAfter:j===pending.length-1?0:gap,width:wordWidth};
        cursor+=wordWidth+result.spaceAfter;return result;
      });
      // Positive normalisation of the original negative/positive indent keeps
      // the complete irregular block inside the measured mobile box.
      const indent=Math.max(0,Math.min(Math.max(0,width-cursor-fontSize*.3),mix(rowSeed+7.31,mobile?-.03:-.14,mobile?.09:.3)*width+width*(mobile?.03:.14)));
      lines.push({indent,lift:mix(rowSeed+1.7,mobile?-.10:-.22,mobile?.10:.22)*fontSize,rotation:0,opacity:mix(rowSeed+5.1,.9,1),words:runs,width:cursor});
      pending=[];total=0;lineIndex++;
    }
    for(const word of words){
      const limit=width*mix(seed+(lineIndex+1)*19.1,mobile?.64:.48,mobile?.91:.90), next=measure(word)+(pending.length?space:0);
      if(pending.length && total+next>limit)createLine();
      pending.push(word);total+=measure(word)+(pending.length>1?space:0);
    }
    createLine();
    const lineHeight=fontSize*(mobile?1.2:1.24), actualWidth=Math.max(48,...lines.map(l=>l.indent+l.width+fontSize*.2));
    return {width:Math.min(width,actualWidth),height:lines.length*lineHeight+fontSize*.8,fontSize,lineHeight,lines};
  }

  function edges(points=[]) {
    // Keep the field connected, but avoid 190 distracting all-to-all lines.
    const active=points.map((p,i)=>({p,i})).filter(({p})=>p.opacity>.06);
    if(active.length<2)return [];
    const result=[],used=new Set([0]),keys=new Set(),distance=(a,b)=>Math.hypot(active[a].p.x-active[b].p.x,active[a].p.y-active[b].p.y);
    function add(a,b,kind){const from=active[a].i,to=active[b].i,key=[Math.min(from,to),Math.max(from,to)].join(':');if(keys.has(key))return;keys.add(key);result.push({a:points[from].id,b:points[to].id,from,to,distance:distance(a,b),kind});}
    while(used.size<active.length){let best=null;for(const a of used)for(let b=0;b<active.length;b++)if(!used.has(b)){const d=distance(a,b);if(!best||d<best.d)best={a,b,d};}add(best.a,best.b,'tree');used.add(best.b);}
    const near=[];for(let a=0;a<active.length;a++)for(let b=a+1;b<active.length;b++)if(!keys.has([Math.min(active[a].i,active[b].i),Math.max(active[a].i,active[b].i)].join(':')))near.push({a,b,d:distance(a,b)});
    near.sort((a,b)=>a.d-b.d).slice(0,Math.min(5,Math.floor(active.length/4))).forEach(e=>add(e.a,e.b,'mesh'));
    return result;
  }

  function create(options={}) {
    const count=clamp(Math.floor(finite(options.count,20)),1,40);
    let width=1280,height=660,time=0,initialised=false,reducedSnapshot=null;
    const nodes=Array.from({length:count},(_,i)=>({id:'text-'+i,parent:(i*3+Math.floor(i/7))%7,x:0,y:0,vx:0,vy:0,baseX:0,baseY:0,revision:-1,seed:i*71.13+19}));
    function resize(w,h){const ow=width,oh=height;width=Math.max(1,finite(w,width));height=Math.max(1,finite(h,height));if(ow===width&&oh===height)return;nodes.forEach(n=>{n.x*=width/ow;n.y*=height/oh;n.baseX*=width/ow;n.baseY*=height/oh;});reducedSnapshot=null;}
    function update(input={}) {
      const dt=clamp(finite(input.dt,33.333),0,80)/1000;time+=dt;
      const t=input.reduced?0:finite(input.time,time),small=width<650,margin=small?8:14;
      const obstacles=(input.obstacles||[]).filter(o=>Number.isFinite(o.x)&&Number.isFinite(o.y));
      const sizes=nodes.map((_,i)=>({width:Math.min(width-margin*2,Math.max(42,finite(input.sizes?.[i]?.width,small?110:165))),height:Math.min(height-margin*2,Math.max(16,finite(input.sizes?.[i]?.height,small?45:45)))}));
      const signature=JSON.stringify(sizes);
      if(input.reduced&&reducedSnapshot&&reducedSnapshot.signature===signature)return reducedSnapshot.points.map(p=>({...p}));
      if(!input.reduced)reducedSnapshot=null;
      const placed=[];
      function bounds(i){return{x0:margin+sizes[i].width/2,x1:width-margin-sizes[i].width/2,y0:margin+sizes[i].height/2,y1:height-margin-sizes[i].height/2};}
      function relocate(node,i,seed){
        const b=bounds(i),parent=input.parents?.[node.parent];let best=null;
        // Stratification avoids a random initial pile-up. Later revisions use
        // a new seed and can reappear anywhere, not in an identical paragraph.
        for(let k=0;k<64;k++){
          const gx=(i*7+Math.floor(seed)%17+k*11)%count, gy=(i*11+Math.floor(seed)%13+k*7)%count;
          const x=mix(seed+k*8.13,b.x0,b.x1),y=mix(seed+k*17.71,b.y0,b.y1),candidate={x,y,...sizes[i]};
          let score=obstacles.reduce((s,o)=>s+(overlaps(candidate,o,5)?100000:0),0)+placed.reduce((s,o)=>s+(overlaps(candidate,o,3)?10000:0),0);
          if(parent)score+=Math.hypot(x-parent.x,y-parent.y)*.025;
          score+=Math.abs(x/width-(gx+.5)/count)*12+Math.abs(y/height-(gy+.5)/count)*12;
          // Reappearance should read as a fresh location, not a crossfade in place.
          if(initialised&&node.revision>=0)score+=Math.max(0,Math.min(width,height)*.22-Math.hypot(x-node.x,y-node.y))*3;
          if(!best||score<best.score)best={x,y,score};
        }
        node.baseX=best.x;node.baseY=best.y;node.x=best.x;node.y=best.y;node.vx=node.vy=0;
      }
      const output=nodes.map((node,i)=>{
        const entry=input.entries?.[i],revision=entry?.revision??0,seed=entry?.layoutSeed??node.seed+revision*107.1;
        if(node.revision!==revision||!initialised){relocate(node,i,seed);node.seed=seed;node.revision=revision;}
        const b=bounds(i),phase=node.seed*.001,z=input.reduced?0:Math.sin(t*(.23+i*.0031)+phase)*28+Math.sin(t*.083+phase*1.31)*13;
        const tx=clamp(node.baseX+(input.reduced?0:Math.sin(t*(.21+i*.0029)+phase)*(small?11:30)+Math.cos(t*.071+phase*1.7)*(small?5:12)),b.x0,b.x1);
        const ty=clamp(node.baseY+(input.reduced?0:Math.cos(t*(.17+i*.0047)+phase*1.4)*(small?14:26)+Math.sin(t*.113+phase*.7)*(small?7:13)),b.y0,b.y1);
        const ox=node.x,oy=node.y;
        if(input.reduced){node.x=tx;node.y=ty;}else if(dt>0){const blend=1-Math.exp(-2.6*dt);node.x+=(tx-node.x)*blend;node.y+=(ty-node.y)*blend;}
        // Move away from interactive labels only, not other text: occasional
        // translucent word overlaps are part of the original data field.
        for(let pass=0;pass<3;pass++)for(const obstacle of obstacles){const p={x:node.x,y:node.y,...sizes[i]};if(!overlaps(p,obstacle,2))continue;const dx=node.x-obstacle.x,dy=node.y-obstacle.y,px=(p.width+obstacle.width)/2+3-Math.abs(dx),py=(p.height+obstacle.height)/2+3-Math.abs(dy);if(px<py)node.x+=Math.sign(dx||1)*px;else node.y+=Math.sign(dy||1)*py;node.x=clamp(node.x,b.x0,b.x1);node.y=clamp(node.y,b.y0,b.y1);}
        node.x=clamp(node.x,b.x0,b.x1);node.y=clamp(node.y,b.y0,b.y1);node.vx=dt?(node.x-ox)/dt:0;node.vy=dt?(node.y-oy)/dt:0;
        const opacity=(input.reduced?1:finite(entry?.opacity,1))*mix(node.seed+5.1,.61,.81);
        const p={id:node.id,parent:node.parent,x:node.x,y:node.y,z,scale:1,rotateX:0,rotateY:0,rotateZ:0,opacity,width:sizes[i].width,height:sizes[i].height,cssWidth:sizes[i].width,cssHeight:sizes[i].height,revision,vx:node.vx,vy:node.vy};
        placed.push(p);return p;
      });
      initialised=true;
      if(input.reduced)reducedSnapshot={signature,points:output.map(p=>({...p}))};
      return output;
    }
    return {resize,update,edges};
  }
  root.RoseTextSpace=Object.freeze({create,edges,linePlan});
})(globalThis);

;
/* Local presentation filtering only. Never use a predicted hand to commit a selection. */
(function (root) {
  'use strict';
  const finite = (n, fallback = 0) => Number.isFinite(n) ? n : fallback;
  const clamp = (n, low, high) => Math.max(low, Math.min(high, n));
  const FIELDS = ['x', 'y', 'width', 'height', 'angle'];
  const alpha = (dt, hz) => 1 - Math.exp(-Math.PI * 2 * hz * dt / 1000);

  function create(options = {}) {
    const holdMs = options.holdMs ?? 145;
    const minStaleMs = options.minStaleMs ?? 240;
    const maxStaleMs = options.maxStaleMs ?? 400;
    const maxPredictionMs = options.maxPredictionMs ?? 45;
    const maxDisplacement = options.maxDisplacement ?? .035;
    let face = null, hand = null, measuredAt = -Infinity, receivedAt = -Infinity;
    let lastInput = null, faceVelocity = {};
    let displayFace = null, displayHand = null, lastRead = null;
    let samples = 0, faceMissingAt = null, cadenceMs = 0, faceStaleMs = minStaleMs;

    function reset() {
      face = hand = lastInput = displayFace = displayHand = null;
      measuredAt = receivedAt = -Infinity;
      faceVelocity = {};
      samples = 0; lastRead = null; faceMissingAt = null; cadenceMs = 0; faceStaleMs = minStaleMs;
    }

    function push(frame = {}, now = performance.now()) {
      const stamp = finite(frame.capturedAt, now);
      // A delayed/out-of-order response may not move the visual back in time.
      if (stamp < measuredAt) return false;
      const receivedGap = now - receivedAt;
      if (Number.isFinite(receivedGap) && receivedGap > 0) {
        cadenceMs = cadenceMs ? cadenceMs * .7 + receivedGap * .3 : receivedGap;
      }
      // A slow inference result is not evidence of a missing face. Keep the latest
      // face through ordinary result gaps, but never beyond this bounded timeout.
      const measuredCost = Math.max(finite(frame.inferenceMs), finite(frame.captureToResultMs));
      faceStaleMs = clamp(Math.max(cadenceMs, measuredCost) * 1.8 + 40, minStaleMs, maxStaleMs);
      const dt = clamp(stamp - measuredAt, 8, 180);
      const fresh = !face || stamp - measuredAt > 250 || (faceMissingAt != null && now - faceMissingAt > 200);
      if (frame.face && Number.isFinite(frame.face.x) && Number.isFinite(frame.face.y)) {
        const next = {};
        for (const key of FIELDS) {
          const raw = finite(frame.face[key], key === 'angle' ? 0 : key === 'x' || key === 'y' ? .5 : .25);
          const previous = lastInput ? finite(lastInput[key], raw) : raw;
          const derivative = fresh ? 0 : (raw - previous) / (dt / 1000);
          const oldVelocity = finite(faceVelocity[key]);
          faceVelocity[key] = oldVelocity + (derivative - oldVelocity) * alpha(dt, 1.6);
          // Stationary noise is filtered; deliberate head movement raises cutoff.
          const base = key === 'width' || key === 'height' ? 2.0 : 2.5;
          const beta = key === 'width' || key === 'height' ? 3.0 : 7.0;
          const amount = alpha(dt, base + beta * Math.abs(faceVelocity[key]));
          next[key] = fresh ? raw : finite(face[key], raw) + (raw - finite(face[key], raw)) * amount;
        }
        face = next; lastInput = { ...frame.face }; faceMissingAt = null;
        if (fresh) displayFace = { ...next };
      } else if (faceMissingAt == null) faceMissingAt = now;
      // Hand measurement remains unfiltered for the existing pinch/dwell state machine.
      // The read() hand is only a gently interpolated visual cursor and must not select.
      if (frame.hand && Number.isFinite(frame.hand.x) && Number.isFinite(frame.hand.y)) {
        hand = { ...frame.hand };
        if (!displayHand) displayHand = { x: hand.x, y: hand.y };
      } else {
        hand = displayHand = null;
      }
      measuredAt = stamp; receivedAt = now; samples++;
      return true;
    }

    function read(now = performance.now()) {
      const dt = clamp(lastRead == null ? 16.67 : now - lastRead, 0, 80);
      lastRead = now;
      const age = Math.max(0, now - measuredAt);
      const stale = now - receivedAt > faceStaleMs;
      const handStale = now - receivedAt > holdMs;
      const faceLost = faceMissingAt != null && now - faceMissingAt > holdMs;
      const prediction = Math.min(maxPredictionMs, age) / 1000;
      if (face && !stale && !faceLost) {
        const presentation = {};
        for (const key of FIELDS) {
          // Size is stabilized, not predicted: detector box changes are noisy.
          const offset = ['x', 'y', 'angle'].includes(key)
            ? clamp(finite(faceVelocity[key]) * prediction, -maxDisplacement, maxDisplacement) : 0;
          const wanted = face[key] + offset;
          const previous = displayFace ? displayFace[key] : wanted;
          const amount = 1 - Math.exp(-dt / 22);
          presentation[key] = previous + (wanted - previous) * amount;
          if (key !== 'angle') presentation[key] = clamp(presentation[key], 0, 1);
        }
        displayFace = presentation;
      } else displayFace = null;
      if (hand && !handStale) {
        const amount = 1 - Math.exp(-dt / 26);
        displayHand = displayHand || { x: hand.x, y: hand.y };
        // No hand extrapolation: visual interpolation cannot overshoot a new target.
        for (const key of ['x', 'y']) displayHand[key] += (hand[key] - displayHand[key]) * amount;
      } else displayHand = null;
      return {
        face: displayFace ? { ...displayFace } : null,
        hand: displayHand ? { ...hand, ...displayHand, presentationOnly: true } : null,
        capturedAt: measuredAt, receivedAt, sampleAgeMs: age, samples,
        resultCadenceMs: cadenceMs, staleTimeoutMs: faceStaleMs,
        predictionMs: displayFace ? Math.min(maxPredictionMs, age) : 0
      };
    }
    return Object.freeze({ push, read, reset });
  }

  root.RoseTrackingMotion = Object.freeze({ create });
})(typeof window !== 'undefined' ? window : globalThis);

;
/* Opt-in local worker tracking. Fresh video frames, one in flight, no inference queue. */
(function () {
  'use strict';
  const ASSETS = Object.freeze({
    module: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/vision_bundle.mjs',
    wasm: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm',
    face: 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite',
    hand: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'
  });
  const MODEL_TIMEOUT = 45000, FRAME_TIMEOUT = 8000, MIN_INTERVAL = 32;
  let current = null, phase = 'idle';
  const clamp = (n, low, high) => Math.max(low, Math.min(high, n));

  function workerMain() {
    let faceDetector, handLandmarker, previousFace = null;
    const clamp = (n, low = 0, high = 1) => Math.max(low, Math.min(high, n));
    self.onmessage = async function (event) {
      const data = event.data;
      if (data.type === 'init') {
        try {
          const config = data.assets;
          const vision = await import(config.module);
          const files = await vision.FilesetResolver.forVisionTasks(config.wasm);
          faceDetector = await vision.FaceDetector.createFromOptions(files, {
            baseOptions: { modelAssetPath: config.face, delegate: 'CPU' },
            runningMode: 'VIDEO', minDetectionConfidence: .55
          });
          handLandmarker = await vision.HandLandmarker.createFromOptions(files, {
            baseOptions: { modelAssetPath: config.hand, delegate: 'CPU' },
            runningMode: 'VIDEO', numHands: 1, minHandDetectionConfidence: .55,
            minHandPresenceConfidence: .55, minTrackingConfidence: .55
          });
          self.postMessage({ type: 'ready' });
        } catch (error) {
          self.postMessage({ type: 'error', code: 'model-load', message: String(error.message || error) });
        }
        return;
      }
      if (data.type !== 'frame') return;
      const bitmap = data.bitmap, started = performance.now();
      try {
        const width = bitmap.width, height = bitmap.height;
        const detections = faceDetector.detectForVideo(bitmap, data.time).detections || [];
        // Prefer continuity when another face briefly enters the view. Scores alone
        // used to make the rose jump between detections of almost equal confidence.
        const ranked = detections.filter(d => d.boundingBox).map(detection => {
          const b = detection.boundingBox;
          const x = 1 - (b.originX + b.width / 2) / width;
          const y = (b.originY + b.height / 2) / height;
          const distance = previousFace ? Math.hypot(x - previousFace.x, y - previousFace.y) : 0;
          return { detection, score: (detection.categories?.[0]?.score || 0) - Math.min(.25, distance * .65) };
        }).sort((a, b) => b.score - a.score);
        const detection = ranked[0]?.detection;
        let face = null;
        if (detection) {
          const box = detection.boundingBox;
          const eyes = (detection.keypoints || []).slice(0, 2).sort((a, b) => a.x - b.x);
          const angle = eyes.length === 2 ? -Math.atan2((eyes[1].y - eyes[0].y) * height, (eyes[1].x - eyes[0].x) * width) : 0;
          face = { x: clamp(1 - (box.originX + box.width / 2) / width),
            y: clamp((box.originY + box.height / 2) / height), width: clamp(box.width / width),
            height: clamp(box.height / height), angle: clamp(angle, -1.2, 1.2) };
          previousFace = face;
        }
        const points = handLandmarker.detectForVideo(bitmap, data.time).landmarks?.[0];
        let hand = null;
        if (points?.length >= 21) {
          const distance = (a, b) => Math.hypot((a.x - b.x) * width, (a.y - b.y) * height);
          const palmWidth = distance(points[5], points[17]);
          if (palmWidth > 2) {
            const palm = [0, 5, 9, 17].reduce((sum, index) => ({ x: sum.x + points[index].x / 4, y: sum.y + points[index].y / 4 }), { x: 0, y: 0 });
            hand = { x: clamp(1 - palm.x), y: clamp(palm.y), pinchRatio: distance(points[4], points[8]) / palmWidth,
              indexTip: { x: clamp(1 - points[8].x), y: clamp(points[8].y) },
              pinchMidpoint: { x: clamp(1 - (points[4].x + points[8].x) / 2), y: clamp((points[4].y + points[8].y) / 2) }, pointerSource: 'palm' };
          }
        }
        self.postMessage({ type: 'frame', face, hand, capturedAt: data.capturedAt,
          inferenceMs: performance.now() - started, sequence: data.sequence });
      } catch (error) {
        self.postMessage({ type: 'error', code: 'inference', message: String(error.message || error) });
      } finally { bitmap.close(); }
    };
  }

  function call(callback, payload) {
    if (typeof callback !== 'function') return;
    try { callback(payload); } catch (error) { console.warn('Rose Head callback failed.', error); }
  }
  function status(session, next, reason) { phase = next; call(session.callbacks.onStatus, { phase: next, reason }); }
  function later(session, callback, delay) {
    const timer = setTimeout(() => { session.timers.delete(timer); if (current === session) callback(); }, delay);
    session.timers.add(timer); return timer;
  }
  function clearTimer(session, timer) { clearTimeout(timer); session.timers.delete(timer); }
  function stop(reason = 'user') {
    const session = current;
    if (!session) return;
    current = null; session.cancel();
    for (const timer of session.timers) clearTimeout(timer);
    session.timers.clear();
    if (session.videoFrame != null && session.video?.cancelVideoFrameCallback) session.video.cancelVideoFrameCallback(session.videoFrame);
    session.motion?.reset();
    session.worker?.terminate();
    if (session.workerURL) URL.revokeObjectURL(session.workerURL);
    session.stream?.getTracks().forEach(track => track.stop());
    if (session.video) { session.video.pause(); session.video.srcObject = null; session.video.removeAttribute('src'); }
    call(session.callbacks.onFrame, { face: null, hand: null, capturedAt: performance.now() });
    status(session, 'stopped', reason);
  }
  function fail(session, code, message) {
    if (current !== session) return;
    stop(code); status(session, 'error', code); call(session.callbacks.onError, { code, message });
  }
  function capabilities() {
    return { secureContext: !!window.isSecureContext, camera: typeof navigator.mediaDevices?.getUserMedia === 'function',
      worker: typeof window.Worker === 'function', bitmap: typeof window.createImageBitmap === 'function',
      offscreenCanvas: typeof window.OffscreenCanvas === 'function', protocol: typeof location !== 'undefined' ? location.protocol : '' };
  }
  async function start(callbacks = {}) {
    if (current) stop('restart');
    const session = { callbacks, timers: new Set(), inFlight: false, lastVideoTime: -1, lastCapture: -Infinity,
      frameId: 0, inferenceMs: 0, interval: MIN_INTERVAL, stats: { captured: 0, skippedBusy: 0, skippedDuplicate: 0 },
      motion: window.RoseTrackingMotion?.create(), latest: { face: null, hand: null } };
    session.cancelled = new Promise(resolve => { session.cancel = () => resolve(null); });
    current = session;
    const race = promise => Promise.race([promise, session.cancelled]);
    const support = capabilities();
    if (!support.secureContext || !support.camera) { fail(session, 'unavailable', 'Camera access requires HTTPS or localhost in a compatible browser.'); return false; }
    if (!support.worker || !support.bitmap || !support.offscreenCanvas) { fail(session, 'unsupported', 'This browser cannot run private camera tracking off the main thread. Use pointer mode instead.'); return false; }
    if (document.hidden) { stop('hidden'); return false; }
    status(session, 'requesting');
    try {
      // No camera starts before the explicit button action. Audio is never requested.
      const permission = navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: 'user',
        width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 30, max: 30 } } });
      permission.then(stream => { if (current !== session) stream.getTracks().forEach(track => track.stop()); }, () => {});
      const stream = await race(permission);
      if (!stream || current !== session) return false;
      session.stream = stream;
      stream.getVideoTracks().forEach(track => track.addEventListener('ended', () => fail(session, 'camera-ended', 'The camera was disconnected or its permission was withdrawn.'), { once: true }));
      const video = document.createElement('video'); session.video = video;
      video.muted = true; video.playsInline = true; video.hidden = true; video.setAttribute('playsinline', ''); video.srcObject = stream;
      const videoTimer = later(session, () => fail(session, 'video-timeout', 'The camera did not provide a playable stream. Use pointer mode or try again.'), 15000);
      await race(video.play()); clearTimer(session, videoTimer);
      if (current !== session) return false;
      status(session, 'loading');
      session.workerURL = URL.createObjectURL(new Blob([`(${workerMain.toString()})();`], { type: 'text/javascript' }));
      const worker = new Worker(session.workerURL, { name: 'rose-head-private-tracking-v8' }); session.worker = worker;
      const ready = new Promise(resolve => {
        const loadingTimer = later(session, () => fail(session, 'model-timeout', 'Camera models took too long to load. Try again or use pointer mode.'), MODEL_TIMEOUT);
        worker.onerror = () => fail(session, 'worker-error', 'The tracking worker could not start. Use pointer mode or try another browser.');
        worker.onmessageerror = () => fail(session, 'worker-message', 'The tracking worker could not read a frame.');
        worker.onmessage = event => {
          if (current !== session) return;
          const data = event.data;
          if (data.type === 'ready') { clearTimer(session, loadingTimer); resolve(true); }
          else if (data.type === 'error') {
            const help = support.protocol === 'file:' ? ' Open this preview through localhost; file URLs can block model or worker loading.' : '';
            fail(session, data.code || 'tracking-error', (data.message || 'Camera tracking could not continue.') + help);
          } else if (data.type === 'frame') {
            clearTimer(session, session.frameTimer); session.inFlight = false;
            const now = performance.now();
            const inference = Number.isFinite(data.inferenceMs) ? data.inferenceMs : now - session.lastCapture;
            session.inferenceMs = session.inferenceMs ? session.inferenceMs * .8 + inference * .2 : inference;
            // Backpressure is bounded: a slow device skips old frames, never queues them.
            session.interval = clamp(session.inferenceMs * 1.05, MIN_INTERVAL, 100);
            session.latest = { face: data.face, hand: data.hand, capturedAt: data.capturedAt ?? session.lastCapture,
              receivedAt: now, inferenceMs: inference, captureToResultMs: now - (data.capturedAt ?? session.lastCapture),
              sequence: data.sequence ?? session.frameId };
            session.motion?.push(session.latest, now);
            // This callback carries a measured hand; smoothing is opt-in for visuals only.
            call(session.callbacks.onFrame, session.latest);
          }
        };
        worker.postMessage({ type: 'init', assets: ASSETS });
      });
      if (!await race(ready) || current !== session) return false;
      status(session, 'running');

      async function capture(now, mediaTime) {
        if (current !== session) return;
        if (session.inFlight) { session.stats.skippedBusy++; return; }
        if (video.readyState < 2 || mediaTime === session.lastVideoTime) { session.stats.skippedDuplicate++; return; }
        if (now - session.lastCapture < session.interval) return;
        session.lastVideoTime = mediaTime; session.lastCapture = now; session.inFlight = true;
        session.frameTimer = later(session, () => fail(session, 'frame-timeout', 'Camera tracking stopped responding. Use pointer mode or restart it.'), FRAME_TIMEOUT);
        let bitmap;
        try {
          const width = Math.min(480, video.videoWidth || 640);
          const height = Math.round(width * (video.videoHeight || 480) / (video.videoWidth || 640));
          try { bitmap = await createImageBitmap(video, { resizeWidth: width, resizeHeight: height, resizeQuality: 'low' }); }
          catch (videoBitmapError) {
            if (current !== session) return;
            const canvas = session.captureCanvas || (session.captureCanvas = document.createElement('canvas'));
            canvas.width = width; canvas.height = height;
            const context = canvas.getContext('2d', { alpha: false });
            if (!context) throw videoBitmapError;
            context.drawImage(video, 0, 0, width, height); bitmap = await createImageBitmap(canvas);
          }
          if (current !== session) { bitmap.close(); return; }
          session.stats.captured++;
          worker.postMessage({ type: 'frame', bitmap, time: now, capturedAt: now, sequence: ++session.frameId }, [bitmap]);
        } catch (error) {
          bitmap?.close(); fail(session, 'frame-read', 'The camera frame could not be processed. Use pointer mode instead.');
        }
      }
      function nextFrame(now, metadata) {
        if (current !== session) return;
        session.videoFrame = video.requestVideoFrameCallback(nextFrame);
        capture(now, metadata.mediaTime);
      }
      function fallbackCapture() {
        if (current !== session) return;
        later(session, fallbackCapture, Math.max(MIN_INTERVAL, session.interval));
        capture(performance.now(), video.currentTime);
      }
      if (typeof video.requestVideoFrameCallback === 'function') {
        session.scheduler = 'video-frame'; session.videoFrame = video.requestVideoFrameCallback(nextFrame);
      } else { session.scheduler = 'timer-fallback'; fallbackCapture(); }
      return true;
    } catch (error) {
      const code = error.name === 'NotAllowedError' ? 'permission-denied' : error.name === 'NotFoundError' ? 'camera-missing' : error.name === 'NotReadableError' ? 'camera-busy' : 'camera-error';
      fail(session, code, code === 'permission-denied' ? 'Camera permission was not granted. Pointer mode remains available.' : 'The camera could not start. Check the camera or continue in pointer mode.'); return false;
    }
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop('hidden'); });
  window.addEventListener('pagehide', () => stop('pagehide'));
  window.RoseTracker = Object.freeze({ start, stop, capabilities,
    sample(now = performance.now()) { return current?.motion?.read(now) || current?.latest || { face: null, hand: null }; },
    get telemetry() { return current ? { ...current.stats, inferenceMs: current.inferenceMs, intervalMs: current.interval,
      scheduler: current.scheduler, inFlight: current.inFlight, lastSequence: current.frameId } : null; },
    get active() { return !!current && phase === 'running'; }, get state() { return phase; } });
})();

;
/* Stable palm targeting: normalized coordinates, no camera access or emotion inference. */
(function () {
  'use strict';
  const clamp = (value, low = 0, high = 1) => Math.max(low, Math.min(high, value));
  const DEFAULTS = Object.freeze({
    mode: 'pinch', dwellMs: 700, stableMs: 120, closeHoldMs: 80,
    closeRatio: .27, closingRatio: .38, openRatio: .46,
    cooldownMs: 500, latchGraceMs: 240, pinchTimeoutMs: 1800,
    smoothingMs: 65, dwellMotion: .045,
    // A comfortable central range of hand motion reaches the whole composition.
    xRange: [.16, .84], yRange: [.20, .82], inset: .045
  });

  function mapPalm(hand, options = DEFAULTS) {
    const xRange = options.xRange || DEFAULTS.xRange;
    const yRange = options.yRange || DEFAULTS.yRange;
    const inset = options.inset ?? DEFAULTS.inset;
    const scale = (value, range) => inset + clamp((value - range[0]) / (range[1] - range[0])) * (1 - inset * 2);
    return { x: scale(hand.x, xRange), y: scale(hand.y, yRange) };
  }

  function nearest(pointer, nodes) {
    let best = null;
    let score = Infinity;
    for (const node of nodes) {
      if (node.disabled || node.id == null) continue;
      const rx = node.rx ?? node.radius ?? .095;
      const ry = node.ry ?? node.radius ?? .095;
      const distance = Math.hypot((pointer.x - node.x) / rx, (pointer.y - node.y) / ry);
      if (distance <= 1 && distance < score) { best = node.id; score = distance; }
    }
    return best;
  }

  function create(options = {}) {
    const config = { ...DEFAULTS, ...options };
    let mode = config.mode === 'dwell' ? 'dwell' : 'pinch';
    let pointer = null, lastTime = null, hoverId = null, candidateId = null;
    let candidateSince = 0, lastEligibleId = null, lastEligibleTime = -Infinity;
    let lockedId = null, lockPointer = null, lockSince = 0, closedSince = null;
    let armed = false, consumed = false, lastCommit = -Infinity;
    let dwellAnchor = null, dwellBlockedId = null;

    function reset() {
      pointer = null; lastTime = null; hoverId = null; candidateId = null;
      candidateSince = 0; lastEligibleId = null; lastEligibleTime = -Infinity;
      lockedId = null; lockPointer = null; lockSince = 0; closedSince = null;
      armed = false; consumed = false; lastCommit = -Infinity;
      dwellAnchor = null; dwellBlockedId = null;
    }

    function setMode(next) { mode = next === 'dwell' ? 'dwell' : 'pinch'; reset(); }

    function output(phase, progress = 0, commitId = null) {
      return {
        pointer: lockPointer ? { ...lockPointer } : pointer ? { ...pointer } : null,
        hoverId, lockedId, phase, progress: clamp(progress), commitId, mode
      };
    }

    function update({ hand, nodes = [], now = performance.now() } = {}) {
      if (!hand || !Number.isFinite(hand.x) || !Number.isFinite(hand.y)) {
        // Missing tracking must never finish a partly closed pinch or a dwell.
        const previousCommit = lastCommit;
        reset();
        lastCommit = previousCommit;
        return output('absent');
      }
      const mapped = mapPalm(hand, config);
      const dt = lastTime == null ? 80 : clamp(now - lastTime, 0, 250);
      lastTime = now;
      const alpha = config.smoothingMs <= 0 ? 1 : 1 - Math.exp(-dt / config.smoothingMs);
      if (!pointer) pointer = mapped;
      else { pointer.x += (mapped.x - pointer.x) * alpha; pointer.y += (mapped.y - pointer.y) * alpha; }
      hoverId = nearest(pointer, nodes);
      const availableIds = new Set(nodes.filter(node => !node.disabled).map(node => node.id));
      if (lockedId != null && !availableIds.has(lockedId)) {
        lockedId = null; lockPointer = null; closedSince = null; armed = false; consumed = true;
      }
      if (hoverId !== candidateId) {
        candidateId = hoverId; candidateSince = now; dwellAnchor = { ...pointer };
      }
      const cooldown = now - lastCommit < config.cooldownMs;

      if (mode === 'dwell') {
        lockedId = null; lockPointer = null;
        if (hoverId !== dwellBlockedId) dwellBlockedId = null;
        if (hoverId == null) return output('seeking');
        if (cooldown || hoverId === dwellBlockedId) return output('cooldown');
        if (!dwellAnchor || Math.hypot(pointer.x - dwellAnchor.x, pointer.y - dwellAnchor.y) > config.dwellMotion) {
          candidateSince = now; dwellAnchor = { ...pointer };
        }
        const progress = (now - candidateSince) / config.dwellMs;
        if (progress >= 1) {
          lastCommit = now; dwellBlockedId = hoverId;
          return output('selected', 1, hoverId);
        }
        return output('dwelling', progress);
      }

      const ratio = hand.pinchRatio;
      if (!Number.isFinite(ratio)) return output('seeking');
      if (ratio >= config.openRatio) {
        lockedId = null; lockPointer = null; closedSince = null; consumed = false;
        armed = !cooldown;
        if (hoverId != null && now - candidateSince >= config.stableMs) {
          lastEligibleId = hoverId; lastEligibleTime = now;
        }
        return output(cooldown ? 'cooldown' : hoverId == null ? 'seeking' : 'ready',
          hoverId == null ? 0 : (now - candidateSince) / config.stableMs);
      }
      if (consumed || !armed || cooldown) return output(cooldown ? 'cooldown' : 'open-hand');

      if (lockedId == null && ratio < config.closingRatio) {
        // The last OPEN-hand target is latched before fingertips move together.
        // A short grace period tolerates one missed frame at the closing boundary.
        if (lastEligibleId != null && availableIds.has(lastEligibleId) && now - lastEligibleTime <= config.latchGraceMs) {
          lockedId = lastEligibleId; lockPointer = { ...pointer }; lockSince = now;
        } else {
          consumed = true; armed = false;
          return output('open-hand');
        }
      }
      if (lockedId == null) return output(hoverId == null ? 'seeking' : 'ready');
      if (now - lockSince > config.pinchTimeoutMs) {
        lockedId = null; lockPointer = null; closedSince = null; consumed = true; armed = false;
        return output('open-hand');
      }
      if (ratio <= config.closeRatio) {
        if (closedSince == null) closedSince = now;
        const progress = (now - closedSince) / config.closeHoldMs;
        if (progress >= 1) {
          const commitId = lockedId;
          lastCommit = now; consumed = true; armed = false;
          return output('selected', 1, commitId);
        }
        return output('pinching', progress);
      }
      closedSince = null;
      return output('locked');
    }

    return Object.freeze({ update, reset, setMode, get mode() { return mode; } });
  }

  window.RoseHandTarget = Object.freeze({ create, mapPalm, DEFAULTS });
})();

;
(function(root){
  'use strict';
  const COUNT=7,clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),finite=(n,f)=>Number.isFinite(n)?n:f;
  const initial=[[.12,.15],[.49,.11],[.88,.21],[.13,.49],[.87,.53],[.20,.87],[.80,.87]];
  const hash=n=>{const value=Math.sin(n*127.1+311.7)*43758.5453123;return value-Math.floor(value);};
  function noise(t,seed){const k=Math.floor(t),u=t-k,f=u*u*(3-2*u);return hash(k+seed)*(1-f)+hash(k+1+seed)*f;}
  function create(){
    let width=1280,height=700,elapsed=0,lastTime=null,initialised=false,geometry=null;
    const nodes=Array.from({length:COUNT},(_,i)=>({id:'node-'+i,x:0,y:0,vx:0,vy:0}));
    function resize(w,h){
      const nextW=Math.max(1,finite(w,width)),nextH=Math.max(1,finite(h,height));
      if(nextW!==width||nextH!==height){width=nextW;height=nextH;initialised=false;geometry=null;lastTime=null;}
    }
    function buildGeometry(input){
      const small=width<650,margin=small?10:22,gap=small?12:14;
      const widths=nodes.map((_,i)=>Math.min(width-margin*2,Math.max(44,finite(typeof input.widths?.[i]==='number'?input.widths[i]:input.widths?.[i]?.width,small?118:154))));
      const heights=nodes.map((_,i)=>Math.min(height-margin*2,Math.max(24,finite(typeof input.heights?.[i]==='number'?input.heights[i]:input.heights?.[i]?.height,68))));
      const radius=Math.min(width*(small?.345:.255),height*.385)*1.13;
      const e=input.reservedEllipse||input.exclusion||{};
      // Deliberately fixed until resize. Neither an effect's growing bounds,
      // camera movement, held-card membership nor a click can re-pack cards.
      const ellipse={x:finite(e.x,width/2),y:finite(e.y,height/2),rx:Math.max(0,finite(e.rx,radius)),ry:Math.max(0,finite(e.ry,radius)),gap:Math.max(0,finite(e.gap,12))};
      const bounds=nodes.map((_,i)=>({x0:margin+widths[i]/2,x1:width-margin-widths[i]/2,y0:margin+heights[i]/2,y1:height-margin-heights[i]/2}));
      return{small,margin,gap,widths,heights,bounds,ellipse,maxSpeed:small?48:60};
    }
    function meetsRose(x,y,i){
      const g=geometry,e=g.ellipse,dx=clamp(e.x,x-g.widths[i]/2,x+g.widths[i]/2)-e.x,dy=clamp(e.y,y-g.heights[i]/2,y+g.heights[i]/2)-e.y;
      return e.rx>0&&e.ry>0&&dx*dx/((e.rx+e.gap)**2)+dy*dy/((e.ry+e.gap)**2)<1-1e-9;
    }
    function collides(x,y,i,j){const g=geometry;return Math.abs(x-nodes[j].x)<(g.widths[i]+g.widths[j])/2+g.gap-1e-7&&Math.abs(y-nodes[j].y)<(g.heights[i]+g.heights[j])/2+g.gap-1e-7;}
    function safe(x,y,i,active){
      const b=geometry.bounds[i];
      if(x<b.x0-1e-7||x>b.x1+1e-7||y<b.y0-1e-7||y>b.y1+1e-7||meetsRose(x,y,i))return false;
      for(const j of active)if(j!==i&&collides(x,y,i,j))return false;
      return true;
    }
    function initialise(){
      const g=geometry,step=g.small?14:22,all=[];
      // Dense candidates are an INITIAL/RESIZE operation only. During motion
      // there is no nearest-safe search, projection, reordering or fallback
      // re-pack, so a new selection can never make a card jump across the page.
      for(let i=0;i<COUNT;i++){
        const b=g.bounds[i],xs=[b.x0,b.x1,clamp(width*initial[i][0],b.x0,b.x1)],ys=[b.y0,b.y1,clamp(height*initial[i][1],b.y0,b.y1)];
        for(let x=b.x0+step;x<b.x1;x+=step)xs.push(x);
        for(let y=b.y0+step;y<b.y1;y+=step)ys.push(y);
        const candidates=[];for(const x of xs)for(const y of ys)if(!meetsRose(x,y,i))candidates.push({x,y});all.push(candidates);
      }
      for(let attempt=0;attempt<16;attempt++){
        const placed=[];
        for(let i=0;i<COUNT;i++){
          const b=g.bounds[i],shift=attempt===0?0:.22;
          const targetX=clamp(width*(initial[i][0]+(hash(attempt*17+i)-.5)*shift),b.x0,b.x1),targetY=clamp(height*(initial[i][1]+(hash(attempt*29+i+76)-.5)*shift),b.y0,b.y1);
          let best=null,bestScore=Infinity;
          for(const p of all[i]){const score=((p.x-targetX)/width)**2+((p.y-targetY)/height)**2;if(score<bestScore&&safe(p.x,p.y,i,placed)){best=p;bestScore=score;}}
          if(!best)break;nodes[i].x=best.x;nodes[i].y=best.y;nodes[i].vx=nodes[i].vy=0;placed.push(i);
        }
        if(placed.length===COUNT){initialised=true;return true;}
      }
      return false;
    }
    function update(input={}){
      const supplied=clamp(finite(input.dt,33.333),0,50)/1000;
      const hasTime=Number.isFinite(input.time),time=hasTime?input.time:elapsed+supplied;
      // Repeated update calls at one timestamp are geometry reads, including
      // when hover/focus/pinch changes membership. Do not integrate twice.
      const dt=hasTime&&lastTime!==null?Math.min(supplied,Math.max(0,time-lastTime)):supplied;
      elapsed=time;lastTime=time;
      if(!geometry)geometry=buildGeometry(input);
      if(!initialised&&!initialise()){
        const result=nodes.map(n=>({...n}));result.safetyMoves=0;result.unplaced=COUNT;return result;
      }
      const g=geometry,frozen=input.frozen||new Set(),active=Array.from({length:COUNT},(_,i)=>i);
      if(dt>0)for(let i=0;i<COUNT;i++){
        const node=nodes[i];
        if(input.reduced||frozen.has(i)||frozen.has(node.id)){node.vx=node.vy=0;continue;}
        const b=g.bounds[i],phase=3.7+i*19.127;
        const nx=clamp(.02+.70*noise(time/(8.2+i*.71),phase)+.28*noise(time/(3.1+i*.21),phase+271),0,1),ny=clamp(.02+.70*noise(time/(10.4-i*.39),phase+97)+.28*noise(time/(4.3+i*.31),phase+643),0,1);
        const tx=b.x0+nx*(b.x1-b.x0),ty=b.y0+ny*(b.y1-b.y0),dx=tx-node.x,dy=ty-node.y,length=Math.hypot(dx,dy),desiredSpeed=Math.min(g.maxSpeed,length*1.2);
        const lag=1-Math.exp(-2.5*dt),targetVX=length?dx/length*desiredSpeed:0,targetVY=length?dy/length*desiredSpeed:0;
        let vx=node.vx+(targetVX-node.vx)*lag,vy=node.vy+(targetVY-node.vy)*lag;
        const velocity=Math.hypot(vx,vy),distance=Math.min(g.maxSpeed*dt,velocity*dt);
        if(distance<1e-9)continue;
        const heading=Math.atan2(vy,vx),oldX=node.x,oldY=node.y;
        let candidate=null,bestScore=Infinity;
        // All candidates are LOCAL bounded steps from the previous position.
        // Try tangents and sliding, or stop when none is safe. Testing every
        // other card's current full rectangle keeps the invariant true after
        // each move; held/focused cards have no special ordering privilege.
        for(const scale of[1,.5,.2]){
          for(let k=0;k<32;k++){
            const offset=k===0?0:(k%2?1:-1)*Math.ceil(k/2)*Math.PI/16,angle=heading+offset;
            const x=oldX+Math.cos(angle)*distance*scale,y=oldY+Math.sin(angle)*distance*scale;
            if(!safe(x,y,i,active))continue;
            const score=((x-tx)**2+(y-ty)**2)+Math.abs(offset)*distance*3+(1-scale)*distance*2;
            if(score<bestScore){candidate={x,y};bestScore=score;}
          }
          if(candidate)break;
        }
        if(candidate){node.x=candidate.x;node.y=candidate.y;node.vx=(node.x-oldX)/dt;node.vy=(node.y-oldY)/dt;}
        else node.vx=node.vy=0;
      }
      const result=nodes.map(n=>({id:n.id,x:n.x,y:n.y,vx:n.vx,vy:n.vy}));
      result.safetyMoves=0;result.unplaced=0;return result;
    }
    return{resize,update};
  }
  root.RoseFieldLayout=Object.freeze({create});
})(globalThis);

;
(function (root) {
  'use strict';
  const TAU = Math.PI * 2;
  const MODES = ['offspring', 'separation', 'glitch', 'thorn', 'erosion'];
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const finite = (n, fallback = 0) => Number.isFinite(n) ? n : fallback;
  const fract = n => n - Math.floor(n);
  const noise = n => fract(Math.sin(n * 12.9898 + 78.233) * 43758.5453);

  // The source rose is the fixed anchor. Only the selected effect accumulates.
  // Legacy growth helpers remain explicit no-ops for older preview callers.
  function growthForCount() { return 1; }
  function growthForView() { return 1; }
  function fixedBaseRadius(width,height) { return Math.min(width*(width<650?.345:.255),height*.385); }
  function normalizeArtBounds(rect, width, height) {
    const x = clamp(finite(rect?.x), 0, width), y = clamp(finite(rect?.y), 0, height);
    return {x,y,width:clamp(finite(rect?.width,width-x),0,width-x),height:clamp(finite(rect?.height,height-y),0,height-y)};
  }
  function insideArt(point, rect) {
    return point.x >= rect.x && point.x <= rect.x + rect.width && point.y >= rect.y && point.y <= rect.y + rect.height;
  }
  function normalizeProtectedRects(rects,width,height) {
    return (Array.isArray(rects)?rects:[]).slice(0,7).map(rect=>normalizeArtBounds(rect,width,height)).filter(rect=>rect.width>0&&rect.height>0);
  }
  function protectedUniforms(rects,width,height) {
    const values=new Float32Array(28);
    normalizeProtectedRects(rects,width,height).forEach((r,i)=>values.set([r.x/width,r.y/height,r.width/width,r.height/height],i*4));
    return values;
  }
  function insideProtected(point,rects) { return rects.some(r=>insideArt(point,r)); }

  // This is an image-derived relief, not a reconstructed rose or an invented
  // back surface. Alpha is retained from the artist's original halftone PNG.
  function buildGeometry(rgba, size, divisions) {
    divisions = clamp(Math.round(divisions || 64), 12, 80);
    const stride = size + 1, integral = new Float32Array(stride * stride);
    for (let y = 0; y < size; y++) {
      let row = 0;
      for (let x = 0; x < size; x++) {
        row += rgba[(y * size + x) * 4 + 3] / 255;
        integral[(y + 1) * stride + x + 1] = integral[y * stride + x + 1] + row;
      }
    }
    function density(u, v) {
      const x = clamp(Math.floor(u * (size - 1)), 0, size - 1), y = clamp(Math.floor(v * (size - 1)), 0, size - 1);
      const r = Math.max(2, Math.round(size * .035)), x0 = Math.max(0, x - r), x1 = Math.min(size, x + r + 1);
      const y0 = Math.max(0, y - r), y1 = Math.min(size, y + r + 1);
      return (integral[y1 * stride + x1] - integral[y0 * stride + x1] - integral[y1 * stride + x0] + integral[y0 * stride + x0]) / ((x1 - x0) * (y1 - y0));
    }
    const vertices = [], indices = [], regions = Array.from({length:7}, (_, i) => ({id:'R' + String(i + 1).padStart(2, '0'), points:[], weight:0, x:0, y:0, z:0}));
    const mapping = new Map(); let inkSamples = 0;
    function add(gx, gy, sector) {
      const key = gx + ':' + gy + ':' + sector;
      if (mapping.has(key)) return mapping.get(key);
      const u = gx / divisions, v = gy / divisions, x = u * 2 - 1, y = v * 2 - 1;
      const d = density(u, v), radius = Math.hypot(x, y);
      // Broad convex relief plus local ink folds; shallow enough to preserve
      // the source silhouette but deep enough for visible pointer parallax.
      const z = .37 * Math.pow(Math.max(0, 1 - radius * .83), 1.25) + (d - .34) * .19;
      const idx = vertices.length / 7;
      vertices.push(x, y, z, u, v, sector, noise(gx * 11.7 + gy * 29.3));
      if (d > .035) {
        const reg = regions[sector]; reg.points.push({x,y,z,weight:d}); reg.weight += d; reg.x += x*d; reg.y += y*d; reg.z += z*d; inkSamples++;
      }
      mapping.set(key, idx); return idx;
    }
    for (let y = 0; y < divisions; y++) for (let x = 0; x < divisions; x++) {
      const xx = (x + .5) / divisions * 2 - 1, yy = (y + .5) / divisions * 2 - 1;
      const sector = Math.hypot(xx, yy) < .24 ? 6 : Math.floor((Math.atan2(yy, xx) + Math.PI) / TAU * 6) % 6;
      const a = add(x,y,sector), b = add(x+1,y,sector), c = add(x,y+1,sector), d = add(x+1,y+1,sector);
      indices.push(a,b,c,b,d,c);
    }
    regions.forEach(r => {
      const w = r.weight || 1; r.x /= w; r.y /= w; r.z /= w;
      // Weighted local groups retain the image-derived centroids without
      // re-projecting thousands of newly allocated objects on every frame.
      r.trackingSamples=[];const group=Math.max(1,Math.ceil(r.points.length/96));
      for(let i=0;i<r.points.length;i+=group){let x=0,y=0,z=0,weight=0;for(let j=i;j<Math.min(i+group,r.points.length);j++){const q=r.points[j];x+=q.x*q.weight;y+=q.y*q.weight;z+=q.z*q.weight;weight+=q.weight;}r.trackingSamples.push({x:x/weight,y:y/weight,z:z/weight,weight});}
    });
    return {vertices:new Float32Array(vertices), indices:new Uint16Array(indices), regions, samples:inkSamples, divisions};
  }

  function planEffects(events, mode) {
    if (mode === 'emotion') {
      events = Array.isArray(events) ? events : [];
      const grouped = MODES.map(key => planEffects(events.filter(event => (event.effect || root.RoseMath.effectOf(event.word)) === key), key));
      const combined = planEffects(events, 'offspring');
      const [offspring,separation,glitch,thorn,erosion] = grouped;
      return {...combined,mode:'emotion',children:offspring.children,echoes:[],
        regionOffsets:separation.regionOffsets,regionUniforms:separation.regionUniforms,
        separation:separation.separation,erosion:erosion.erosion,thornLinks:thorn.thornLinks,thornCount:thorn.thornCount,
        glitch:glitch.glitch,glitchShards:glitch.glitchShards,
        effectExtent:Math.max(...grouped.map(plan => plan.effectExtent)),sceneCount:1+offspring.children.length,
        effectCounts:Object.fromEntries(MODES.map((key,i) => [key,grouped[i].count]))};
    }
    mode = MODES.includes(mode) ? mode : 'offspring';
    events = Array.isArray(events) ? events : [];
    let positive = 0, negative = 0, hash = 2166136261;
    const eventSeeds=[];
    events.forEach((event, i) => {
      if (event && event.polarity === 'negative') negative++; else positive++;
      const text = String(event?.id ?? event?.word ?? i) + ':' + String(event?.polarity || 'positive');
      let eventHash=2166136261;
      for (let j = 0; j < text.length; j++) {hash = Math.imul(hash ^ text.charCodeAt(j), 16777619);eventHash=Math.imul(eventHash^text.charCodeAt(j),16777619);}
      eventSeeds.push((eventHash>>>0)/4294967296*43.9);
    });
    const count = events.length, seed = (hash >>> 0) / 4294967296 * 43.9 + count * .731;
    const progress=count?1-Math.exp(-count/35):0;
    const intensity = count ? Math.min(1.8, .12 + (count - 1) * .058) : 0;
    const children = [], echoes = [], regionOffsets=Array.from({length:7},()=>({x:0,y:0,z:0,turn:0}));
    if (mode === 'offspring') for (let i = 0; i < Math.min(18, count); i++) {
      const index=count-Math.min(18,count)+i,e=events[index]||{},sign=e.polarity==='negative'?-1:1,eventSeed=eventSeeds[index];
      // A first positive offspring belongs just outside the source silhouette,
      // not behind its opaque centre. Later children retain stable locations.
      const a=index===0&&sign>0?Math.sin(eventSeed)*.24:index*2.399963+eventSeed*.17;
      const r=sign>0?Math.min(5,1.12+index*.070):Math.min(4,.62+index*.045);
      const z=sign<0?.45+noise(index+eventSeed)*.08:Math.abs(Math.sin(a))>.65?.38+noise(index+eventSeed)*.12:-.12+noise(index+eventSeed)*.47;
      children.push({x:Math.cos(a)*r,y:Math.sin(a)*r*.65,z,scale:.12+Math.min(.88,index*.0125+index*index*.00018),turn:a*.3,negative:sign<0,seed:index+eventSeed});
    }
    if(mode==='separation')events.forEach((event,index)=>{
      const s=eventSeeds[index],negative=event?.polarity==='negative';
      for(let region=0;region<7;region++){
        if(noise(s+region*7.13)<.28)continue;
        const q=regionOffsets[region],angle=noise(s*1.71+region*3.93)*TAU;
        const force=(negative?.082:.052)*(.45+noise(s*2.3+region)*.9)*(region===6?.55:1);
        q.x+=Math.cos(angle)*force;q.y+=Math.sin(angle)*force;
        q.z+=(noise(s+region*13.7)-.4)*(negative?.105:.065);
        q.turn+=(noise(s*2.17+region*5.9)-.5)*(negative?.24:.13);
      }
    });
    regionOffsets.forEach(q=>{q.x=Math.tanh(q.x/.8)*.8;q.y=Math.tanh(q.y/.8)*.8;q.z=Math.tanh(q.z/.6)*.6;q.turn=Math.tanh(q.turn/.85)*.85;});
    const thornLinks=[];
    if(mode==='thorn'&&count){
      // Short repeats of the same straight thorn-link mask used by the site's
      // cursor form connected, curved ribbons. Existing links stay put as the
      // branch grows, instead of replacing a whole curled stock image.
      const branchOwners=events.slice(0,4),counts=[0,0,0,0],overflow=Math.max(0,count-32),spread=1+2.5*(1-Math.exp(-overflow*.025));
      for(let i=0;i<Math.min(count,32);i++)counts[i%4]+=8;
      counts.forEach((links,branch)=>{
        const s=eventSeeds[branch]||branch*1.7,negative=branchOwners[branch]?.polarity==='negative';
        const base=[-.15,Math.PI+.2,-Math.PI/2+.25,Math.PI/2-.15][branch]+(noise(s)-.5)*.25,direction=branch%2?-1:1;
        function point(t){const angle=base+direction*(t*.33+Math.sin(t*.72)*.14)+overflow*.009,r=(.83+t*(negative?.105:.075)+Math.sin(t*1.4+s)*.035)*spread;return{x:Math.cos(angle)*r,y:Math.sin(angle)*r*.86,z:.18+Math.sin(angle*1.6+s)*.17};}
        for(let link=0;link<links;link++){
          const t=link*.26,p=point(t),q=point(t+.08),angle=Math.atan2(q.y-p.y,q.x-p.x);
          thornLinks.push({...p,angle,length:.16+(noise(link+branch*59)-.5)*.018,height:.040,flip:noise(link*3.9+branch)>.5?-1:1,branch,index:link});
        }
      });
    }
    const glitch=mode==='glitch'&&count?{strength:Math.min(.44,.018+(count-1)*.0085),density:Math.min(.88,.10+count*.022),rows:128,columns:112,seed,sign:events[count-1]?.polarity==='negative'?-1:1}:null;
    const glitchShards=[];
    if(glitch)for(let i=0;i<Math.min(64,count*2);i++){
      const vertical=i%2===1,s=eventSeeds[Math.min(count-1,Math.floor(i/2))]+i*.73;
      const across=(noise(s*2.31)-.5)*1.70,along=(noise(s*3.91)-.5)*.32;
      const length=.5+noise(s+3)*1.15,thin=.005+noise(s+7)*.012;
      const sourceX=vertical?across:along,sourceY=vertical?along:across;
      const push=(.018+Math.max(0,count-1)*.030)*(noise(s+11)>.5?1:-1);
      glitchShards.push({x:sourceX+(vertical?push*.26:push),y:sourceY+(vertical?push:push*.26),z:.12+noise(s+17)*.08,
        sourceX,sourceY,width:vertical?thin:length,height:vertical?length:thin,seed:s});
    }
    const effectExtent=mode==='offspring'?children.reduce((extent,q)=>Math.max(extent,Math.hypot(q.x,q.y)+q.scale),1):mode==='thorn'?thornLinks.reduce((extent,q)=>Math.max(extent,Math.hypot(q.x,q.y)+q.length*.5),1):mode==='glitch'?glitchShards.reduce((extent,q)=>Math.max(extent,Math.hypot(q.x,q.y)+Math.max(q.width,q.height)*.5),1):mode==='separation'?1+regionOffsets.reduce((extent,q)=>Math.max(extent,Math.hypot(q.x,q.y)+Math.abs(q.z)),0):1;
    return {mode, count, positive, negative, seed, hash:(hash>>>0).toString(16), intensity, children, echoes,
      regionOffsets,regionUniforms:new Float32Array(regionOffsets.flatMap(q=>[q.x,q.y,q.z,q.turn])),thornLinks,glitch,glitchShards,effectExtent,progress,
      separation:mode==='separation' && count ? .02+.82*(1-Math.exp(-count*.045)) : 0,
      erosion:mode==='erosion' && count ? Math.min(.72,.035+count*.025) : 0,
      thornCount:thornLinks.length,
      sceneCount:1+children.length+echoes.length};
  }

  function rotate(point, yaw, pitch, turn = 0) {
    const cz=Math.cos(turn), sz=Math.sin(turn), cx=Math.cos(pitch), sx=Math.sin(pitch), cy=Math.cos(yaw), sy=Math.sin(yaw);
    const x=point.x*cz-point.y*sz, y=point.x*sz+point.y*cz;
    const yy=y*cx-point.z*sx, zz=y*sx+point.z*cx;
    return {x:x*cy+zz*sy, y:yy, z:-x*sy+zz*cy};
  }
  function displaced(point, sector, effect) {
    const q=effect.regionOffsets[sector],a=(sector+.5)/6*TAU-Math.PI,cx=sector===6?0:Math.cos(a)*.55,cy=sector===6?0:Math.sin(a)*.55,c=Math.cos(q.turn),s=Math.sin(q.turn);
    return {x:(point.x-cx)*c-(point.y-cy)*s+cx+q.x,y:(point.x-cx)*s+(point.y-cy)*c+cy+q.y,z:point.z+q.z};
  }
  function project(point, yaw, pitch, view, turn = 0) {
    const p=rotate(point,yaw,pitch,turn), perspective=3.8/(3.8-p.z);
    return {x:view.x+p.x*view.radius*perspective, y:view.y+p.y*view.radius*perspective, z:p.z};
  }

  const VERTEX = `
    attribute vec3 aPosition; attribute vec2 aUV; attribute float aSector; attribute float aSeed;
    uniform vec2 uView; uniform vec2 uViewport; uniform vec2 uCenter; uniform float uRadius;
    uniform vec3 uOffset; uniform float uScale; uniform float uTurn; uniform float uSplit;
    uniform float uRough; uniform mediump float uSeed; uniform vec4 uRegions[7];
    varying mediump vec2 vUV; varying mediump float vSeed;
    void main(){
      float regionAngle=(aSector+.5)/6.0*6.28318530718-3.14159265359;
      vec4 region=uRegions[int(aSector+.5)]; vec2 origin=aSector>5.5?vec2(0.0):vec2(cos(regionAngle),sin(regionAngle))*.55;
      vec3 source=aPosition;float rc=cos(region.w),rs=sin(region.w);source.xy=mat2(rc,rs,-rs,rc)*(source.xy-origin)+origin;source+=region.xyz;
      float a=regionAngle+uSeed*.025;
      float s=uSplit*(aSector>5.5?.17:1.0);
      vec3 p=source+vec3(cos(a)*s,sin(a)*s,(mod(aSector,2.0)>.5?1.0:-1.0)*s*.26);
      p.z+=sin(aPosition.x*19.0+aPosition.y*11.0+uSeed)*uRough;
      float ct=cos(uTurn),st=sin(uTurn); p.xy=mat2(ct,st,-st,ct)*p.xy;
      p=p*uScale+uOffset;
      float cp=cos(uView.y),sp=sin(uView.y);p.yz=mat2(cp,sp,-sp,cp)*p.yz;
      float cy=cos(uView.x),sy=sin(uView.x);p.xz=mat2(cy,-sy,sy,cy)*p.xz;
      float perspective=3.8/(3.8-p.z); vec2 px=uCenter+p.xy*uRadius*perspective;
      gl_Position=vec4(px.x/uViewport.x*2.0-1.0,1.0-px.y/uViewport.y*2.0,-p.z*.15,1.0);
      vUV=aUV;vSeed=aSeed;
    }`;
  const FRAGMENT = `
    precision mediump float; uniform sampler2D uTexture;uniform float uAlpha;uniform float uErosion;uniform mediump float uSeed;uniform vec4 uGlitch;
    uniform vec2 uBufferSize;uniform vec4 uProtected[7];
    varying mediump vec2 vUV;varying mediump float vSeed;
    void main(){
      // Normalized screen-space card holes protect reading without cropping
      // the artwork into the broad horizontal bands used by the last preview.
      vec2 screen=vec2(gl_FragCoord.x/uBufferSize.x,1.0-gl_FragCoord.y/uBufferSize.y);
      for(int i=0;i<7;i++){vec4 r=uProtected[i];if(r.z>0.0&&r.w>0.0&&screen.x>=r.x&&screen.x<=r.x+r.z&&screen.y>=r.y&&screen.y<=r.y+r.w)discard;}
      vec2 uv=vUV;
      if(uGlitch.x>0.0){
        float row=floor(vUV.y*128.0),column=floor(vUV.x*112.0);
        float rowPick=fract(sin(row*.73+uSeed*.31)*29.173),columnPick=fract(sin(column*1.17+uSeed*.53)*31.913);
        if(rowPick<uGlitch.y)uv.x+=(fract(sin(row*1.39+uSeed)*23.713)-.5)*uGlitch.x*2.0*uGlitch.z;
        if(columnPick<uGlitch.y*.83)uv.y+=(fract(sin(column*.91+uSeed*1.3)*27.117)-.5)*uGlitch.x*1.5;
      }
      if(uv.x<0.0||uv.x>1.0||uv.y<0.0||uv.y>1.0)discard;
      float alpha=texture2D(uTexture,uv).a;
      float cellX=floor(vUV.x*46.0),cellY=floor(vUV.y*46.0);
      float pick=fract(sin(cellX*.73+cellY*1.91+uSeed*.731)*29.173);
      if(alpha<.016||pick<uErosion)discard;gl_FragColor=vec4(0.0,0.0,0.0,alpha*uAlpha);}`;
  const EMPTY_REGIONS=new Float32Array(28);
  function create({canvas,image,thornImage}) {
    let gl=null, ctx=null, backend='canvas2d-fallback', failure='', lost=false, mesh=null, texture=null, program=null, thornTexture=null;
    let vertexBuffer=null,indexBuffer=null,thornVertexBuffer=null,thornIndexBuffer=null,glitchVertexBuffer=null,glitchIndexBuffer=null, prepared=false, source=null,thornSource=null;
    let width=1,height=1,ratio=1,yaw=0,pitch=0,targetYaw=0,targetPitch=0,extraYaw=0,extraPitch=0,previous=[];
    let lastEffect=planEffects([],'offspring'), lastThornsKey='', thornIndexCount=0,lastGlitchKey='',glitchIndexCount=0, cachedPlanKey='',cachedPlan=null,cachedEvents=null;
    const locations={}; let maxTextureSize=512;
    try { gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:false,preserveDrawingBuffer:false,powerPreference:'low-power'}); }
    catch(e){failure=String(e.message||e);}
    if(gl) {
      try {
        const shader=(kind,text)=>{const s=gl.createShader(kind);gl.shaderSource(s,text);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;};
        const link=(vs,fs)=>{const p=gl.createProgram(),a=shader(gl.VERTEX_SHADER,vs),b=shader(gl.FRAGMENT_SHADER,fs);gl.attachShader(p,a);gl.attachShader(p,b);gl.linkProgram(p);gl.deleteShader(a);gl.deleteShader(b);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));return p;};
        program=link(VERTEX,FRAGMENT);
        for(const [key,p] of [['mesh',program]]){
          locations[key]={};for(const name of ['aPosition','aUV','aSector','aSeed'])locations[key][name]=gl.getAttribLocation(p,name);
          for(const name of ['uView','uViewport','uCenter','uRadius','uOffset','uScale','uTurn','uSplit','uRough','uSeed','uAlpha','uErosion','uTexture','uGlitch','uBufferSize'])locations[key][name]=gl.getUniformLocation(p,name);
          locations[key].uRegions=gl.getUniformLocation(p,'uRegions[0]');
          locations[key].uProtected=gl.getUniformLocation(p,'uProtected[0]');
        }
        vertexBuffer=gl.createBuffer();indexBuffer=gl.createBuffer();thornVertexBuffer=gl.createBuffer();thornIndexBuffer=gl.createBuffer();glitchVertexBuffer=gl.createBuffer();glitchIndexBuffer=gl.createBuffer();texture=gl.createTexture();thornTexture=gl.createTexture();
        maxTextureSize=Math.min(512,gl.getParameter(gl.MAX_TEXTURE_SIZE)||512);backend='webgl-relief';
        gl.clearColor(0,0,0,0);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.disable(gl.CULL_FACE);
      } catch(e){failure=String(e.message||e);backend='webgl-unavailable';gl=null;}
    }
    if(!gl){try{ctx=canvas.getContext('2d');}catch(e){failure=failure||String(e.message||e);}if(ctx)backend='canvas2d-fallback';}
    canvas.addEventListener?.('webglcontextlost',event=>{event.preventDefault();lost=true;backend='webgl-context-lost';});
    canvas.addEventListener?.('webglcontextrestored',()=>{lost=false;failure='Context restored. Reload the preview to rebuild the relief.';backend='reload-required';});

    function prepare(){
      if(prepared)return true;
      const iw=image&&(image.naturalWidth||image.width),ih=image&&(image.naturalHeight||image.height);if(!iw||!ih)return false;
      try{
        source=document.createElement('canvas');source.width=source.height=maxTextureSize;const c=source.getContext('2d',{willReadFrequently:true});
        const scale=Math.min(maxTextureSize/iw,maxTextureSize/ih),dw=iw*scale,dh=ih*scale;c.drawImage(image,(maxTextureSize-dw)/2,(maxTextureSize-dh)/2,dw,dh);
        c.globalCompositeOperation='source-in';c.fillStyle='#000';c.fillRect(0,0,maxTextureSize,maxTextureSize);c.globalCompositeOperation='source-over';
        mesh=buildGeometry(c.getImageData(0,0,maxTextureSize,maxTextureSize).data,maxTextureSize,width<650?48:64);
        if(gl){
          gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffer);gl.bufferData(gl.ARRAY_BUFFER,mesh.vertices,gl.STATIC_DRAW);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indexBuffer);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,mesh.indices,gl.STATIC_DRAW);
          gl.bindTexture(gl.TEXTURE_2D,texture);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,source);
          gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
        }
        prepared=true;return true;
      }catch(e){failure=String(e.message||e);return false;}
    }
    function resize(w,h,dpr){width=Math.max(1,finite(w,1));height=Math.max(1,finite(h,1));ratio=clamp(finite(dpr,1),1,width<650?1:1.5);canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);if(gl)gl.viewport(0,0,canvas.width,canvas.height);previous=[];}
    function setPointer(x,y){if(typeof x==='object'){y=x.y;x=x.x;}targetYaw=clamp(finite(x),-1,1)*.65;targetPitch=clamp(finite(y),-1,1)*.4;}
    function rotateBy(dx,dy){extraYaw=clamp(extraYaw+finite(dx),-1.1,1.1);extraPitch=clamp(extraPitch+finite(dy),-.7,.7);}
    function reset(options={}){if(!options.preservePose)yaw=pitch=targetYaw=targetPitch=extraYaw=extraPitch=0;previous=[];lastEffect=planEffects([],'offspring');lastThornsKey='';lastGlitchKey='';cachedPlanKey='';cachedPlan=null;cachedEvents=null;}
    function bindMesh(){
      const l=locations.mesh;gl.useProgram(program);gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffer);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indexBuffer);
      for(const [name,length,offset] of [['aPosition',3,0],['aUV',2,12],['aSector',1,20],['aSeed',1,24]])if(l[name]>=0){gl.enableVertexAttribArray(l[name]);gl.vertexAttribPointer(l[name],length,gl.FLOAT,false,28,offset);}
      gl.uniform2f(l.uView,yaw,pitch);gl.uniform2f(l.uViewport,width,height);gl.uniform2f(l.uCenter,view.x,view.y);gl.uniform1f(l.uRadius,view.radius);gl.uniform2f(l.uBufferSize,canvas.width,canvas.height);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);gl.uniform1i(l.uTexture,0);
    }
    let view={x:.5,y:.5,radius:.4};
    function instanceUniforms(options){const l=locations.mesh;gl.uniform3f(l.uOffset,options.x||0,options.y||0,options.z||0);gl.uniform1f(l.uScale,options.scale??1);gl.uniform1f(l.uTurn,options.turn||0);gl.uniform1f(l.uSplit,options.split||0);gl.uniform1f(l.uRough,options.rough||0);gl.uniform1f(l.uSeed,options.seed||0);gl.uniform1f(l.uAlpha,options.alpha??.94);gl.uniform1f(l.uErosion,options.erosion||0);gl.uniform4fv(l.uRegions,options.regions||EMPTY_REGIONS);const g=options.glitch;gl.uniform4f(l.uGlitch,g?.strength||0,g?.density||0,g?.sign||1,0);}
    function drawMesh(options){instanceUniforms(options);gl.drawElements(gl.TRIANGLES,mesh.indices.length,gl.UNSIGNED_SHORT,0);}
    function prepareThorns(){
      if(thornSource)return true;const iw=thornImage&&(thornImage.naturalWidth||thornImage.width),ih=thornImage&&(thornImage.naturalHeight||thornImage.height);if(!iw||!ih)return false;
      try{thornSource=document.createElement('canvas');thornSource.width=512;thornSource.height=Math.max(1,Math.round(512*ih/iw));const c=thornSource.getContext('2d');c.drawImage(thornImage,0,0,thornSource.width,thornSource.height);c.globalCompositeOperation='source-in';c.fillStyle='#000';c.fillRect(0,0,thornSource.width,thornSource.height);
        if(gl){gl.bindTexture(gl.TEXTURE_2D,thornTexture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,thornSource);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);}return true;
      }catch(e){failure=String(e.message||e);thornSource=null;return false;}
    }
    function drawThorns(effect){
      if(!effect.thornCount||!prepareThorns())return;
      const key=effect.count+':'+effect.hash;
      if(key!==lastThornsKey){
        const vertices=[],indices=[];
        effect.thornLinks.forEach((q,i)=>{const c=Math.cos(q.angle),s=Math.sin(q.angle);for(const [dx,dy,u,v]of[[-.5,-.5,0,0],[.5,-.5,1,0],[-.5,.5,0,1],[.5,.5,1,1]]){const x=dx*q.length,y=dy*q.height*q.flip;vertices.push(q.x+x*c-y*s,q.y+x*s+y*c,q.z,u,v,6,0);}const n=i*4;indices.push(n,n+1,n+2,n+1,n+3,n+2);});
        gl.bindBuffer(gl.ARRAY_BUFFER,thornVertexBuffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.DYNAMIC_DRAW);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,thornIndexBuffer);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indices),gl.DYNAMIC_DRAW);thornIndexCount=indices.length;lastThornsKey=key;
      }
      const l=locations.mesh;gl.bindBuffer(gl.ARRAY_BUFFER,thornVertexBuffer);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,thornIndexBuffer);
      for(const [name,length,offset]of[['aPosition',3,0],['aUV',2,12],['aSector',1,20],['aSeed',1,24]])if(l[name]>=0){gl.enableVertexAttribArray(l[name]);gl.vertexAttribPointer(l[name],length,gl.FLOAT,false,28,offset);}
      gl.bindTexture(gl.TEXTURE_2D,thornTexture);instanceUniforms({alpha:.90});gl.drawElements(gl.TRIANGLES,thornIndexCount,gl.UNSIGNED_SHORT,0);
    }
    function drawGlitchShards(effect){
      if(!effect.glitchShards.length)return;
      const key=effect.count+':'+effect.hash;
      if(key!==lastGlitchKey){
        const vertices=[],indices=[];
        effect.glitchShards.forEach((q,i)=>{for(const [dx,dy]of[[-.5,-.5],[.5,-.5],[-.5,.5],[.5,.5]])vertices.push(q.x+dx*q.width,q.y+dy*q.height,q.z,(q.sourceX+dx*q.width+1)/2,(q.sourceY+dy*q.height+1)/2,6,0);const n=i*4;indices.push(n,n+1,n+2,n+1,n+3,n+2);});
        gl.bindBuffer(gl.ARRAY_BUFFER,glitchVertexBuffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.DYNAMIC_DRAW);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,glitchIndexBuffer);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indices),gl.DYNAMIC_DRAW);glitchIndexCount=indices.length;lastGlitchKey=key;
      }
      const l=locations.mesh;gl.bindBuffer(gl.ARRAY_BUFFER,glitchVertexBuffer);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,glitchIndexBuffer);
      for(const [name,length,offset]of[['aPosition',3,0],['aUV',2,12],['aSector',1,20],['aSeed',1,24]])if(l[name]>=0){gl.enableVertexAttribArray(l[name]);gl.vertexAttribPointer(l[name],length,gl.FLOAT,false,28,offset);}
      gl.bindTexture(gl.TEXTURE_2D,texture);instanceUniforms({alpha:.82});gl.drawElements(gl.TRIANGLES,glitchIndexCount,gl.UNSIGNED_SHORT,0);
    }
    function fallback(effect, protectedRects){
      if(!ctx)return;ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,width,height);
      ctx.save();
      const stamp=o=>{ctx.save();const p=project({x:o.x||0,y:o.y||0,z:o.z||0},yaw,pitch,view);ctx.translate(p.x,p.y);ctx.rotate(o.turn||0);ctx.scale(Math.max(.35,Math.cos(yaw)),Math.max(.5,Math.cos(pitch)));const s=view.radius*2*(o.scale||1);ctx.globalAlpha=o.alpha??.94;ctx.drawImage(source,-s/2,-s/2,s,s);ctx.restore();};
      effect.echoes.slice().reverse().forEach(stamp);stamp({});effect.children.forEach(o=>stamp({...o,alpha:.86}));
      if(effect.thornCount&&prepareThorns())effect.thornLinks.forEach(q=>{const p=project(q,yaw,pitch,view),perspective=3.8/(3.8-p.z);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(q.angle);ctx.scale(1,q.flip);ctx.globalAlpha=.90;ctx.drawImage(thornSource,-q.length*view.radius*perspective/2,-q.height*view.radius*perspective/2,q.length*view.radius*perspective,q.height*view.radius*perspective);ctx.restore();});
      effect.glitchShards.forEach(q=>{const p=project(q,yaw,pitch,view),sx=clamp((q.sourceX-q.width/2+1)/2,0,1)*source.width,sy=clamp((q.sourceY-q.height/2+1)/2,0,1)*source.height,sw=Math.min(source.width-sx,q.width/2*source.width),sh=Math.min(source.height-sy,q.height/2*source.height);if(sw>0&&sh>0){ctx.globalAlpha=.82;ctx.drawImage(source,sx,sy,sw,sh,p.x-q.width*view.radius/2,p.y-q.height*view.radius/2,q.width*view.radius,q.height*view.radius);}});
      ctx.restore();
      // Clear only each current card hole after drawing. The transparent
      // canvas exposes the unchanged page, rather than painting opaque cards.
      protectedRects.forEach(r=>ctx.clearRect(r.x,r.y,r.width,r.height));
      // Fallback is intentionally labelled: it retains source imagery and
      // interaction but does not claim WebGL depth or three-dimensional effects.
    }
    function draw(input={}){
      if((!gl&&!ctx)||!prepare()||lost||backend==='reload-required')return {ready:false,backend,failure,samples:0,anchors:[],regions:[],tracks:[],mode:input.mode||'offspring'};
      if(input.hasPointer&&input.pointer)setPointer((input.pointer.x-.5)*2,(input.pointer.y-.5)*2);
      const dt=clamp(finite(input.dt,16.7),0,100), follow=1-Math.exp(-dt/(input.smoothFace?45:140)), wantedYaw=input.reduced?0:targetYaw+extraYaw,wantedPitch=input.reduced?0:targetPitch+extraPitch;
      yaw=input.reduced?0:yaw+(wantedYaw-yaw)*follow;pitch=input.reduced?0:pitch+(wantedPitch-pitch)*follow;
      const events=Array.isArray(input.events)?input.events:(input.layers||[]).map((id,i)=>({id:id+':'+i,polarity:/fear|grief|aversion|anger|sorrow|loss|unease|doubt|resistance|distance|alienation|restlessness|hesitation/.test(id)?'negative':'positive'}));
      const last=events[events.length-1],planKey=(input.mode||'offspring')+':'+events.length+':'+String(last?.id)+':'+String(last?.word)+':'+String(last?.polarity);
      if(cachedEvents!==events||cachedPlanKey!==planKey){cachedPlan=planEffects(events,input.mode);cachedPlanKey=planKey;cachedEvents=events;}
      const effect=lastEffect=cachedPlan;
      const face=input.face;
      const baseRadius=fixedBaseRadius(width,height),growth=1,targetGrowth=1;
      const artBounds={x:0,y:0,width,height};
      const protectedRects=normalizeProtectedRects(input.protectedRects,width,height);
      view={x:width*(.5+(face?clamp(finite(face.x,.5)-.5,-.35,.35)*.40:0)),y:height*(.5+(face?clamp(finite(face.y,.45)-.45,-.3,.3)*.25:0)),radius:baseRadius};
      if(gl){
        // No global crop or count-driven zoom. Card-sized fragment holes are
        // the only exclusions, and every mesh/chain/shard shares the same mask.
        gl.disable(gl.SCISSOR_TEST);
        gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);gl.depthMask(true);bindMesh();
        gl.uniform4fv(locations.mesh.uProtected,protectedUniforms(protectedRects,width,height));
        const rough=effect.separation&&effect.negative&&effect.count ? Math.min(.045,effect.negative*.004):0;
        const instances=[...effect.echoes.map(o=>({...o,split:o.negative?.035:0,seed:effect.seed})),
          {regions:effect.regionUniforms,glitch:effect.glitch,erosion:effect.erosion,seed:effect.seed,rough},
          ...effect.children.map(o=>({...o,alpha:.86,split:o.negative?.15:0,rough:o.negative?.045:0,seed:o.seed}))];
        // Approximate alpha ordering complements real depth testing. The
        // original halftone's transparent dots remain transparent, not cards.
        const depth=o=>rotate({x:o.x||0,y:o.y||0,z:(o.z||0)+.18*(o.scale??1)},yaw,pitch).z;
        instances.sort((a,b)=>depth(a)-depth(b)).forEach(drawMesh);
        drawThorns(effect);
        drawGlitchShards(effect);
      }else fallback(effect,protectedRects);
      const rough=effect.separation&&effect.negative&&effect.count ? Math.min(.045,effect.negative*.004):0;
      let headMinX=Infinity,headMinY=Infinity,headMaxX=-Infinity,headMaxY=-Infinity;
      const anchors=mesh.regions.map((reg,i)=>{
        let px=0,py=0,pz=0,weight=0,minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
        for(const q of reg.trackingSamples){const changed=displaced(q,i,effect);changed.z+=Math.sin(q.x*19+q.y*11+effect.seed)*rough;const sample=project(changed,yaw,pitch,view);headMinX=Math.min(headMinX,sample.x);headMinY=Math.min(headMinY,sample.y);headMaxX=Math.max(headMaxX,sample.x);headMaxY=Math.max(headMaxY,sample.y);if(!insideArt(sample,artBounds)||insideProtected(sample,protectedRects))continue;px+=sample.x*q.weight;py+=sample.y*q.weight;pz+=sample.z*q.weight;weight+=q.weight;minX=Math.min(minX,sample.x);minY=Math.min(minY,sample.y);maxX=Math.max(maxX,sample.x);maxY=Math.max(maxY,sample.y);}
        const p=weight?{x:px/weight,y:py/weight,z:pz/weight}:project(displaced(reg,i,effect),yaw,pitch,view);
        if(!weight){minX=maxX=p.x;minY=maxY=p.y;}
        const old=previous[i],seconds=Math.max(.001,dt/1000);
        return {id:reg.id,x:p.x,y:p.y,z:p.z,visible:weight>0,vx:old&&!input.reduced?(p.x-old.x)/seconds:0,vy:old&&!input.reduced?(p.y-old.y)/seconds:0,area:reg.weight,
          bounds:{minX,minY,maxX,maxY},corners:[{x:minX,y:minY},{x:maxX,y:minY},{x:maxX,y:maxY},{x:minX,y:maxY}],source:'sampled-relief-region',trackingSamples:reg.trackingSamples.length};
      });previous=anchors.map(a=>({x:a.x,y:a.y}));
      const headBounds=Number.isFinite(headMinX)?{minX:headMinX,minY:headMinY,maxX:headMaxX,maxY:headMaxY}:{minX:view.x-view.radius,minY:view.y-view.radius,maxX:view.x+view.radius,maxY:view.y+view.radius};
      const head={x:view.x,y:view.y,size:view.radius*2,angle:0,rx:Math.max(view.x-headBounds.minX,headBounds.maxX-view.x)+6,ry:Math.max(view.y-headBounds.minY,headBounds.maxY-view.y)+6,bounds:headBounds,growth,targetGrowth,mainScale:1,fixedSize:true,baseSize:baseRadius*2};
      const occluders=[{kind:'main',x:head.x,y:head.y,rx:head.rx,ry:head.ry}];
      effect.children.forEach(child=>{const p=project({x:child.x,y:child.y,z:child.z},yaw,pitch,view),radius=view.radius*child.scale*1.35*3.8/(3.8-p.z)+6;occluders.push({kind:'offspring',x:p.x,y:p.y,rx:radius,ry:radius});});
      if(effect.thornLinks.length){let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;effect.thornLinks.forEach(link=>{const p=project(link,yaw,pitch,view),margin=(link.length+link.height)*view.radius*.65*3.8/(3.8-p.z)+4;minX=Math.min(minX,p.x-margin);minY=Math.min(minY,p.y-margin);maxX=Math.max(maxX,p.x+margin);maxY=Math.max(maxY,p.y+margin);});occluders.push({kind:'thorn-envelope',x:(minX+maxX)/2,y:(minY+maxY)/2,rx:(maxX-minX)*.707107+6,ry:(maxY-minY)*.707107+6});}
      return {ready:true,backend,failure,samples:mesh.samples,vertices:mesh.vertices.length/7,triangles:mesh.indices.length/3,quality:mesh.divisions,
        rotation:{yaw,pitch},head,occluders,artBounds,protectedRects,growth,targetGrowth,mainScale:1,effectExtent:effect.effectExtent,effectProgress:effect.progress,anchors,regions:anchors,tracks:[],events:effect.count,mode:effect.mode,
        sceneCount:effect.sceneCount,visibleInstanceLimit:19,drawCalls:1+effect.children.length+effect.echoes.length+(effect.thornCount&&thornSource?1:0)+(effect.glitchShards.length?1:0),babyRoses:effect.children.length,echoes:0,thornSegments:effect.thornCount,thornLinks:effect.thornCount,thornAssetReady:!!thornSource,glitchRows:effect.glitch?.rows||0,glitchColumns:effect.glitch?.columns||0,glitchStrength:effect.glitch?.strength||0,glitchFragments:effect.glitchShards.length,trackingSamples:mesh.regions.reduce((sum,r)=>sum+r.trackingSamples.length,0),impressions:effect.count,
        inkSignature:effect.hash+':'+yaw.toFixed(3)+':'+pitch.toFixed(3),geometryKind:'image-derived-relief',effects:{positive:effect.positive,negative:effect.negative,intensity:effect.intensity}};
    }
    function dispose(){if(!gl)return;for(const b of [vertexBuffer,indexBuffer,thornVertexBuffer,thornIndexBuffer,glitchVertexBuffer,glitchIndexBuffer])if(b)gl.deleteBuffer(b);for(const t of[texture,thornTexture])if(t)gl.deleteTexture(t);if(program)gl.deleteProgram(program);}
    return {resize,setPointer,rotateBy,draw,reset,dispose,get backend(){return backend;}};
  }
  const api={create,modes:MODES.slice(),buildGeometry,planEffects,rotate,project,displaced,growthForCount,growthForView,fixedBaseRadius,normalizeArtBounds,insideArt,normalizeProtectedRects,protectedUniforms,insideProtected};
  root.RoseEffectLabRenderer=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);


;
/* Only explicit selections add responses; emotion-led selections accumulate together. */
(function(root){
  'use strict';
  const modes=Object.freeze(['offspring','separation','glitch','thorn','erosion']);
  function create(options={}){
    let mode=modes.includes(options.mode)?options.mode:'emotion',events=[];
    function snapshot(){const positive=events.filter(e=>e.polarity==='positive').length;return{mode,events:events.slice(),layers:events.map(e=>e.word),total:events.length,positive,negative:events.length-positive};}
    function reset(){events=[];return snapshot();}
    function setMode(next){if(!modes.includes(next))return snapshot();mode=next;return reset();}
    function select(word,polarity){if(typeof word!=='string'||!word.trim())return snapshot();events.push({id:events.length+1,word,polarity:polarity==='negative'?'negative':'positive',effect:mode==='emotion'?root.RoseMath.effectOf(word):mode});return snapshot();}
    return Object.freeze({snapshot,reset,setMode,select});
  }
  root.RoseEffectSession=Object.freeze({create,modes});
  if(typeof module!=='undefined'&&module.exports)module.exports=root.RoseEffectSession;
})(typeof globalThis!=='undefined'?globalThis:this);

;
(() => {
  'use strict';
  const $=id=>document.getElementById(id), {words,clamp,polarityOf}=RoseMath;
  const scene=$('scene'),canvas=$('portrait'),rose=$('roseSource'),thorn=$('thornSource'),status=$('status'),error=$('error');
  const buttons=[...document.querySelectorAll('[data-slot]')],containers=buttons.map(b=>b.closest('.emotion-node'));
  const reduced=matchMedia('(prefers-reduced-motion:reduce)'),target=RoseHandTarget.create({mode:'pinch'}),layout=RoseFieldLayout.create();
  const effectSession=RoseEffectSession.create();
  const slots=RoseEmotionSlots.create({count:7,wordCount:words.length}),textSpace=RoseTextSpace.create({count:20}),textStream=RoseTextStream.create();
  const linkCanvas=$('textLinks'),linkContext=linkCanvas.getContext('2d');
  const S={w:0,h:0,lang:document.documentElement.lang==='ko'?'ko':'en',phase:'off',face:null,hand:null,handState:null,pointer:{x:.5,y:.5},hasPointer:false,layers:[],events:[],mode:'emotion',total:0,positive:0,negative:0,lastEvent:null,lastSelect:-Infinity,clock:0,visualTime:0,hoverSlot:-1,freezeUntil:Array(7).fill(0),feedbackUntil:Array(7).fill(0),points:[],labelPoints:[],meta:null,renderer:null,raf:0,lastRender:0,lastTime:0,textAge:0,textRound:0,dataAge:0,textTelemetryAge:0,textPoints:[],textNodes:[],textSizes:[],initialised:false,slotWords:Array.from({length:7},(_,i)=>i),slotRevision:0,textSnapshot:[],textPlanKey:'',textFrameAge:0,handDisplay:null,frameRate:60,protectedRects:[]};
  const tr=(en,ko)=>S.lang==='ko'?ko:en,label=w=>S.lang==='ko'?w.ko:w.id,wordAt=i=>words[S.slotWords[i]];

  function syncEffects(next){S.mode=next.mode;S.events=next.events;S.layers=next.layers;S.total=next.total;S.positive=next.positive;S.negative=next.negative;}
  function clearEffects(nextMode,resetWords=false){
    syncEffects(nextMode?effectSession.setMode(nextMode):effectSession.reset());
    S.renderer?.reset({preservePose:true});S.lastEvent=null;S.lastSelect=-Infinity;S.freezeUntil.fill(0);S.feedbackUntil.fill(0);S.handState=null;target.reset();
    if(resetWords){slots.reset();S.slotWords=slots.snapshot().map(n=>n.word);}
    containers.forEach(c=>c.classList.remove('is-committed','hand-hover','hand-locked'));
    delete scene.dataset.lastWord;delete scene.dataset.lastPolarity;refresh();announce(S.phase==='running'?(target.mode==='dwell'?'running':'pinch'):'off');wake();
  }

  const copies={off:['Words cycle continuously. Hover to hold; click to leave a trace.','단어가 계속 바뀝니다. 가리키면 멈추고 클릭하면 흔적이 쌓입니다.'],requesting:['Allow the camera, or cancel to keep clicking.','카메라를 허용하거나 취소하고 클릭으로 체험하세요.'],loading:['Preparing position tracking… The blocks still work by click.','위치 인식을 준비 중입니다. 감정 블록은 클릭으로도 선택할 수 있어요.'],running:['Move your palm over a word. Hold it still to select.','손바닥으로 단어를 가리키면 멈춥니다. 잠시 머무르면 선택됩니다.'],pinch:['Hold a word with your palm, then pinch to select.','손바닥으로 단어를 멈추고 엄지와 검지를 모아 선택하세요.'],stopped:['Camera stopped. Your traces remain.','카메라를 껐습니다. 흔적은 그대로 남습니다.']};
  function announce(key){const text=(copies[key]||copies.off)[S.lang==='ko'?1:0];if(status.textContent!==text)status.textContent=text;}
  function measure(){S.widths=containers.map(b=>b.offsetWidth);S.heights=containers.map(b=>b.offsetHeight);S.buttonHeights=buttons.map(b=>b.offsetHeight);}
  function refreshWords(){buttons.forEach((b,i)=>{const w=wordAt(i);b.dataset.word=w.id;b.dataset.polarity=polarityOf(w.id);b.querySelector('.word-label').textContent=label(w);b.setAttribute('aria-label',`${label(w)}, ${tr('select feeling','감정 선택')}`);});}
  function refresh(){
    scene.dataset.mode=S.mode;$('interactionCue').hidden=S.total>0;$('reset').hidden=S.total===0;
    const running=S.phase==='running',pending=['requesting','loading'].includes(S.phase);
    $('camera').textContent=pending?tr('Cancel camera','카메라 취소'):running?tr('Turn camera off','카메라 끄기'):tr('Enable camera','카메라 켜기');$('camera').setAttribute('aria-pressed',String(running));
    $('handMode').textContent=target.mode==='dwell'?tr('Hand: hold','손 선택: 머무르기'):tr('Hand: pinch','손 선택: 핀치');$('reset').textContent=tr('Reset','초기화');
    $('instruction').textContent=tr('Hold a word. Leave a trace.','단어를 멈추고, 흔적을 남기세요.');
    $('layerCount').textContent=`${String(S.total).padStart(2,'0')} ${tr('TRACES','개의 흔적')} / ${S.positive}+ · ${S.negative}−`;
    $('layerHistory').textContent=S.layers.length?S.layers.slice(-8).map(id=>label(words.find(w=>w.id===id))).join(' · '):'';
    scene.dataset.selections=String(S.total);scene.dataset.positive=String(S.positive);scene.dataset.negative=String(S.negative);scene.dataset.retained=String(S.layers.length);scene.dataset.handMode=target.mode;refreshWords();
  }
  function frozenSlots(){const f=new Set();if(S.hoverSlot>=0)f.add(`node-${S.hoverSlot}`);buttons.forEach((b,i)=>{const p=S.points[i],near=S.hasPointer&&p&&Math.abs(S.pointer.x*S.w-p.x)<(S.widths[i]||154)/2+40&&Math.abs(S.pointer.y*S.h-p.y)<(S.heights[i]||68)/2+30;if(near||b.matches(':focus-visible')||S.clock<S.freezeUntil[i])f.add(`node-${i}`);});if(S.handState?.hoverId)f.add(S.handState.hoverId);if(S.handState?.lockedId)f.add(S.handState.lockedId);return f;}
  function select(i){
    const w=wordAt(i);if(!w)return;const polarity=polarityOf(w.id);syncEffects(effectSession.select(w.id,polarity));S.lastSelect=performance.now();S.freezeUntil[i]=S.clock+1.8;S.feedbackUntil[i]=S.clock+1.25;
    S.lastEvent={slot:i,word:w.id,polarity,version:S.total};scene.dataset.lastWord=w.id;scene.dataset.lastPolarity=polarity;
    containers[i].classList.add('is-committed');
    scene.dataset.lastClickNode=String(i);scene.dataset.lastClickX=String(S.points[i]?.x??0);scene.dataset.lastClickY=String(S.points[i]?.y??0);
    containers[i].querySelector('.selection-feedback').textContent=`+${String(S.total).padStart(2,'0')} ${tr('SELECTED','선택됨')}`;
    refresh();status.textContent=tr(`${w.id}, trace ${S.total}`,`${w.ko}, ${S.total}번째 흔적`);wake();
  }
  buttons.forEach((b,i)=>{
    b.innerHTML=`<span class="node-id" aria-hidden="true">${String(i+1).padStart(2,'0')} <span class="slot-state">SCAN</span></span><span class="word-label"></span><span class="node-cross" aria-hidden="true">+</span><span class="selection-feedback" aria-hidden="true"></span>`;
    // Keep a deliberate pointer selection attached to its original word.
    b.addEventListener('pointerdown',e=>{try{b.setPointerCapture(e.pointerId);}catch(_){}S.freezeUntil[i]=Math.max(S.freezeUntil[i],S.clock+.35);});
    b.addEventListener('click',()=>select(i));containers[i].addEventListener('pointerenter',()=>{S.hoverSlot=i;wake();});containers[i].addEventListener('pointerleave',()=>{if(S.hoverSlot===i)S.hoverSlot=-1;wake();});
  });
  $('reset').addEventListener('click',()=>clearEffects(null,true));
  $('handMode').addEventListener('click',()=>{target.setMode(target.mode==='dwell'?'pinch':'dwell');S.handState=null;refresh();announce(S.phase==='running'?(target.mode==='dwell'?'running':'pinch'):'off');wake();});
  document.addEventListener('keydown',e=>{if(e.key!=='Escape')return;if(['running','loading','requesting'].includes(S.phase))RoseTracker.stop();$('interactionHelp').open=false;});
  function handNodes(){return S.labelPoints.map((p,i)=>({id:p.id,x:p.x/S.w,y:p.y/S.h,rx:Math.max(38,(S.widths[i]||130)/2+10)/S.w,ry:Math.max(30,(S.buttonHeights[i]||40)/2+8)/S.h}));}
  function frame(f){S.face=f.face;S.hand=f.hand;S.handState=target.update({hand:f.hand,now:performance.now(),nodes:handNodes()});const h=S.handState;
    // Pinch keeps its last eligible target for 240ms. Preserve that word for
    // slightly longer, so leaving the hit region cannot spin a new word into it.
    if(h.hoverId){const i=Number(h.hoverId.split('-')[1]);if(Number.isInteger(i)&&i>=0&&i<7)S.freezeUntil[i]=Math.max(S.freezeUntil[i],S.clock+.30);}
    containers.forEach((b,i)=>{b.classList.toggle('hand-hover',h.hoverId===`node-${i}`);b.classList.toggle('hand-locked',h.lockedId===`node-${i}`);});if(h.commitId)select(Number(h.commitId.split('-')[1]));scene.dataset.faceTracked=String(Boolean(f.face));scene.dataset.handTracked=String(Boolean(f.hand));wake();}
  function trackingStatus(info){S.phase=info.phase;if(['stopped','error'].includes(info.phase)){S.face=S.hand=S.handState=null;target.reset();containers.forEach(b=>b.classList.remove('hand-hover','hand-locked'));}refresh();announce(info.phase==='running'?(target.mode==='dwell'?'running':'pinch'):info.phase);wake();}
  function trackingError(err){error.hidden=false;const code=err.code||'';error.textContent=/permission|denied/.test(code)?tr('Camera permission was not granted. You can still use the words by click.','카메라 권한이 허용되지 않았습니다. 클릭으로 사용할 수 있습니다.'):/camera-busy/.test(code)?tr('Another app is using the camera. Close its camera view and try again.','다른 앱이 카메라를 사용 중입니다. 해당 카메라 화면을 닫고 다시 시도해 주세요.'):tr('Camera tracking could not start. Click interaction remains available.','카메라 인식을 시작하지 못했습니다. 클릭으로도 사용할 수 있습니다.');scene.dataset.cameraError=code;}
  $('camera').addEventListener('click',async()=>{if(['running','loading','requesting'].includes(S.phase)){RoseTracker.stop();return;}error.hidden=true;target.reset();try{await RoseTracker.start({onFrame:frame,onStatus:trackingStatus,onError:trackingError});}catch(e){trackingError({code:e.name});}});
  scene.addEventListener('pointermove',e=>{if(e.pointerType==='touch'||S.phase==='running')return;const r=scene.getBoundingClientRect();S.pointer={x:(e.clientX-r.left)/r.width,y:(e.clientY-r.top)/r.height};S.hasPointer=true;wake();});scene.addEventListener('pointerleave',()=>{S.hasPointer=false;S.hoverSlot=-1;wake();});
  const textMeasure=document.createElement('canvas').getContext('2d');
  function makeText(){
    const host=$('textField');host.replaceChildren();
    S.textNodes=Array.from({length:20},(_,i)=>{
      const el=document.createElement('div');el.className='text-satellite';el.dataset.index=String(i);el.setAttribute('aria-hidden','true');
      el.innerHTML='<span class="text-readout"></span><p class="text-blob"></p>';host.append(el);return el;
    });
    applyText(textStream.snapshot(),true);scene.dataset.textMix='70en-20ko-10code';scene.dataset.textCount='20';
  }
  function measureText(){S.textSizes=S.textNodes.map(el=>({width:el.offsetWidth,height:el.offsetHeight}));}
  function applyText(snapshot,force=false){
    S.textSnapshot=snapshot;
    const small=S.w<650,viewportKey=Math.round(S.w)+':'+small;
    const resized=viewportKey!==S.textPlanKey;S.textPlanKey=viewportKey;
    let changed=false;
    snapshot.forEach((entry,i)=>{
      const el=S.textNodes[i];if(!el)return;const body=el.querySelector('.text-blob');
      if(!force&&!resized&&body.dataset.revision===String(entry.revision)&&body.dataset.language===entry.language)return;
      body.dataset.language=entry.language;body.dataset.revision=String(entry.revision);body.dataset.text=entry.text;
      const fontSize=small?8.5:entry.language==='ko'?9.5:10;
      textMeasure.font=fontSize+'px '+(entry.language==='ko'?'Arial,Helvetica,sans-serif':'"Courier New",Courier,monospace');
      const width=entry.language==='code'?(small?135:195):small?92+(i*19%51):126+(i*31%100);
      const plan=RoseTextSpace.linePlan(entry.text,{seed:entry.layoutSeed??i*37+entry.revision*131,language:entry.language,mobile:small,fontSize,width,measure:t=>textMeasure.measureText(t).width});
      el.style.width=plan.width+'px';body.style.fontSize=fontSize+'px';body.style.lineHeight=plan.lineHeight+'px';
      body.style.minHeight=plan.height+'px';body.replaceChildren();
      for(const line of plan.lines){
        const row=document.createElement('span');row.className='blob-line';row.style.height=plan.lineHeight+'px';
        row.style.transform='translate('+line.indent+'px,'+line.lift+'px) rotate('+line.rotation+'deg)';row.style.opacity=String(line.opacity);
        for(const word of line.words){
          const run=document.createElement('span');run.className='blob-word';run.textContent=word.text;
          run.style.transform='translate('+word.offsetX+'px,'+word.offsetY+'px)';run.style.opacity=String(word.opacity);run.style.marginRight=word.spaceAfter+'px';row.append(run);
        }
        body.append(row);
      }
      el.dataset.cycle=String(entry.cycle??entry.revision);el.dataset.revision=String(entry.revision);changed=true;
    });
    if(changed)measureText();
  }
  function lineEnd(a,b){const dx=b.x-a.x,dy=b.y-a.y;const halfW=(a.width||140)/2+5,halfH=(a.height||50)/2+5;const t=Math.min(Math.abs(dx)>0.001?halfW/Math.abs(dx):Infinity,Math.abs(dy)>0.001?halfH/Math.abs(dy):Infinity,.47);return {x:a.x+dx*t,y:a.y+dy*t};}
  function drawNetwork(){
    const c=linkContext,dpr=Math.min(devicePixelRatio||1,1.5);c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,S.w,S.h);c.strokeStyle='#170f15';c.fillStyle='#170f15';c.lineWidth=.6;
    const points=S.textPoints,edges=textSpace.edges(points);scene.dataset.textEdges=String(edges.length);
    (S.meta?.anchors||[]).forEach((anchor,i)=>{const label=S.labelPoints[i];if(!label||anchor.visible===false)return;const start=lineEnd({...label,width:S.widths[i],height:S.buttonHeights[i]},anchor);c.globalAlpha=.24;c.beginPath();c.moveTo(start.x,start.y);c.lineTo(anchor.x,anchor.y);c.stroke();c.fillRect(anchor.x-1,anchor.y-1,2,2);});
    for(const edge of edges){const a=points[edge.from],b=points[edge.to];if(!a||!b||a.opacity<.12||b.opacity<.12)continue;const p=lineEnd(a,b),q=lineEnd(b,a);c.globalAlpha=.24*Math.min(a.opacity,b.opacity);c.beginPath();c.moveTo(p.x,p.y);c.lineTo(q.x,q.y);c.stroke();}
    c.setLineDash([2,5]);points.forEach((p,i)=>{const parentIndex=p.parent??i%7,parent=S.labelPoints[parentIndex];if(!parent||p.opacity<.1)return;const end=lineEnd(p,parent),join=lineEnd({...parent,width:S.widths[parentIndex],height:S.buttonHeights[parentIndex]},p);c.globalAlpha=.20*p.opacity;c.beginPath();c.moveTo(end.x,end.y);c.lineTo(join.x,join.y);c.stroke();});c.setLineDash([]);
    points.forEach(p=>{c.globalAlpha=p.opacity*.5;c.fillRect(p.x-1,p.y-1,2,2);});c.globalAlpha=1;
  }
  function updateTextField(dt){
    applyText(textStream.update({dt,time:S.clock*1000,reduced:reduced.matches}));
    S.textPoints=textSpace.update({dt,time:reduced.matches?0:S.visualTime,entries:S.textSnapshot,parents:S.points,sizes:S.textSizes,obstacles:S.points.map((p,i)=>({...p,width:S.widths[i]||154,height:S.heights[i]||68})),pointer:S.hasPointer?{x:(S.pointer.x-.5)*2,y:(S.pointer.y-.5)*2}:{x:0,y:0},reduced:reduced.matches});
    S.textTelemetryAge+=dt;const dataTick=S.textTelemetryAge>=180;if(dataTick)S.textTelemetryAge=0;
    S.textPoints.forEach((p,i)=>{
      const el=S.textNodes[i];
      el.style.transform='translate3d('+p.x+'px,'+p.y+'px,0) translate(-50%,-50%) perspective(900px) rotateX('+p.rotateX+'deg) rotateY('+p.rotateY+'deg) scale('+p.scale+')';
      el.style.opacity=String(p.opacity);el.style.zIndex=p.z<-25?'1':'4';el.dataset.depth=p.z.toFixed(2);el.dataset.x=p.x.toFixed(2);el.dataset.y=p.y.toFixed(2);el.dataset.opacity=p.opacity.toFixed(3);
      if(dataTick)el.querySelector('.text-readout').textContent='TXT.'+String(i+1).padStart(2,'0')+' / z '+Math.round(p.z)+' / vx '+(p.vx||0).toFixed(1)+' / '+S.clock.toFixed(1)+'s';
    });
    drawNetwork();
  }
  function updateData(){
    const anchors=S.meta?.anchors||[];containers.forEach((c,i)=>{const a=anchors[i];if(!a)return;if(a.visible===false){c.querySelector('.position-data').textContent=a.id+' / '+tr('outside art frame','프레임 바깥');c.querySelector('.motion-data').textContent='-';return;}const x=Number.isFinite(a.x)?a.x:0,y=Number.isFinite(a.y)?a.y:0,vx=Number.isFinite(a.vx)?a.vx:0,vy=Number.isFinite(a.vy)?a.vy:0;
      c.querySelector('.position-data').textContent=`${a.id} / x ${x.toFixed(1)} · y ${y.toFixed(1)}`;
      c.querySelector('.motion-data').textContent=`vx ${vx.toFixed(1)} · vy ${vy.toFixed(1)} px/s`;
      c.dataset.region=a.id;c.dataset.x=x.toFixed(1);c.dataset.y=y.toFixed(1);c.dataset.vx=vx.toFixed(1);c.dataset.vy=vy.toFixed(1);
    });
  }
  function render(now){
    S.raf=0;if(document.hidden)return;if(now-S.lastRender>=1000/60-1){
      const dt=Math.min(70,now-(S.lastTime||now));S.lastTime=now;S.lastRender=now;S.clock+=dt/1000;S.frameRate+=(1000/Math.max(1,dt)-S.frameRate)*.05;if(!reduced.matches)S.visualTime+=dt/1000;
      const frozen=frozenSlots(),snapshot=slots.update({dt,time:S.clock*1000,frozen,reduced:reduced.matches});let changed=false;
      snapshot.forEach((n,i)=>{if(n.word!==S.slotWords[i]){S.slotWords[i]=n.word;changed=true;}containers[i].classList.toggle('is-held',n.held);const state=buttons[i].querySelector('.slot-state'),stateText=n.held?'HOLD':'SCAN';if(state.textContent!==stateText)state.textContent=stateText;if(S.clock>=S.feedbackUntil[i])containers[i].classList.remove('is-committed');});
      if(changed){refreshWords();scene.dataset.wordRevision=String(++S.slotRevision);}
      const pulse=reduced.matches?0:Math.exp(-(now-S.lastSelect)/900);
      const motion=S.phase==='running'?RoseTracker.sample(now):null,visualFace=motion?motion.face:null;
      // This reservation is viewport-derived only. Clicks/effects never resize it.
      const baseRadius=Math.min(S.w*(S.w<650?.345:.255),S.h*.385);
      const reservedEllipse={x:S.w/2,y:S.h/2,rx:baseRadius*1.13,ry:baseRadius*1.13,gap:16};
      const previousPoints=S.points;
      S.points=layout.update({dt,time:reduced.matches?0:S.visualTime,reservedEllipse,widths:S.widths,heights:S.heights,frozen,reduced:reduced.matches});
      scene.dataset.unplaced=String(S.points.unplaced||0);
      scene.dataset.maxNodeStep=String(previousPoints.length===S.points.length?Math.max(0,...S.points.map((p,i)=>Math.hypot(p.x-previousPoints[i].x,p.y-previousPoints[i].y))):0);
      S.labelPoints=S.points.map((p,i)=>({...p,y:p.y-(S.heights[i]||100)/2+(S.buttonHeights[i]||40)/2}));
      S.points.forEach((p,i)=>{containers[i].style.transform='translate3d('+p.x+'px,'+p.y+'px,0) translate(-50%,-50%)';});
      S.protectedRects=S.points.map((p,i)=>({x:p.x-(S.widths[i]||154)/2-12,y:p.y-(S.heights[i]||68)/2-12,width:(S.widths[i]||154)+24,height:(S.heights[i]||68)+24}));
      const turnPointer=visualFace?{x:(visualFace.x-.5)*2,y:(visualFace.y-.45)*2}:S.hasPointer?{x:(S.pointer.x-.5)*2,y:(S.pointer.y-.5)*2}:{x:0,y:0};S.renderer?.setPointer(turnPointer.x,turnPointer.y);
      S.meta=S.renderer?.draw({now:S.visualTime*1000,elapsedMs:now,dt,protectedRects:S.protectedRects,face:visualFace,smoothFace:Boolean(visualFace),pointer:S.pointer,hasPointer:S.phase!=='running'&&S.hasPointer,events:S.events,mode:S.mode,layers:S.layers,points:S.labelPoints,activeIds:S.slotWords.map(i=>words[i].id),reduced:reduced.matches,pulse,selectionVersion:S.total,positiveCount:S.positive,negativeCount:S.negative,lastPolarity:S.lastEvent?.polarity,lastEvent:S.lastEvent});
      scene.dataset.growth=String(S.meta?.growth??1);scene.dataset.mainScale=String(S.meta?.mainScale??1);scene.dataset.mainSize=String(S.meta?.head?.baseSize??S.meta?.head?.size??baseRadius*2);
      scene.dataset.artTop='0';scene.dataset.artBottom=String(S.h);
      scene.dataset.roseX=String(S.meta?.head?.x??S.w/2);scene.dataset.roseY=String(S.meta?.head?.y??S.h/2);scene.dataset.roseRx=String(S.meta?.head?.rx??baseRadius);scene.dataset.roseRy=String(S.meta?.head?.ry??baseRadius);
      scene.dataset.reservation=JSON.stringify(reservedEllipse);
      scene.dataset.occluders=JSON.stringify(S.meta?.occluders||[]);scene.dataset.protectedRects=JSON.stringify(S.protectedRects);
      scene.dataset.effectExtent=JSON.stringify(S.meta?.effectExtent??null);scene.dataset.effectProgress=JSON.stringify(S.meta?.effectProgress??null);
      scene.dataset.tracks=String(S.meta?.tracks?.length||0);scene.dataset.regions=String(S.meta?.anchors?.length||0);scene.dataset.inkSignature=S.meta?.inkSignature||'';scene.dataset.effectVersion=String(S.total);scene.dataset.regionSignature=(S.meta?.anchors||[]).map(a=>`${a.x.toFixed(1)},${a.y.toFixed(1)}`).join(';');scene.dataset.impressions=String(S.meta?.impressions??S.total);
      const modeText=`RELIEF / ${String(S.meta?.anchors?.length||0).padStart(2,'0')} REGIONS / ${S.positive}+ ${S.negative}−`;if($('modeLabel').textContent!==modeText)$('modeLabel').textContent=modeText;
      S.dataAge+=dt;if(S.dataAge>=140){S.dataAge=0;updateData();const m=S.meta||{},rotation=m.rotation||{yaw:0,pitch:0};scene.dataset.backend=m.backend||'';scene.dataset.renderFailure=m.failure||'';scene.dataset.yaw=rotation.yaw.toFixed(3);scene.dataset.pitch=rotation.pitch.toFixed(3);scene.dataset.babies=String(m.babyRoses||0);scene.dataset.sceneCount=String(m.sceneCount||1);scene.dataset.glitchRows=String(m.glitchRows||0);scene.dataset.glitchColumns=String(m.glitchColumns||0);scene.dataset.thornLinks=String(m.thornLinks||0);scene.dataset.renderFps=S.frameRate.toFixed(1);scene.dataset.trackingAge=String(motion?.sampleAgeMs??'');scene.dataset.thornAsset=String(Boolean(m.thornAssetReady));scene.dataset.trackingSamples=String(m.trackingSamples||0);const telemetry=RoseTracker.telemetry;scene.dataset.inferenceMs=telemetry?telemetry.inferenceMs.toFixed(1):'';scene.dataset.inferenceInterval=telemetry?telemetry.intervalMs.toFixed(1):'';$('renderStats').textContent=m.ready?`${m.backend==='webgl-relief'?'IMAGE RELIEF / GPU':'2D FALLBACK'} · ${m.vertices||0} vertices · ${m.sceneCount||1} form${(m.sceneCount||1)===1?'':'s'} · yaw ${(rotation.yaw*180/Math.PI).toFixed(1)}°`:tr('Relief is unavailable; showing the original rose.','입체 렌더링을 사용할 수 없어 원래 장미를 표시합니다.');if(!m.ready){const fallback=$('roseFallback');if(!fallback.src)fallback.src=rose.src;fallback.hidden=false;}else $('roseFallback').hidden=true;}S.textFrameAge+=dt;if(S.textFrameAge>=1000/30-1){updateTextField(S.textFrameAge);S.textFrameAge=0;}
      const h=S.handState,indicator=$('handIndicator');if(S.phase==='running'&&S.hand&&h?.pointer){indicator.hidden=false;if(!S.handDisplay||h.lockedId)S.handDisplay={...h.pointer};else{const follow=1-Math.exp(-dt/28);S.handDisplay.x+=(h.pointer.x-S.handDisplay.x)*follow;S.handDisplay.y+=(h.pointer.y-S.handDisplay.y)*follow;}indicator.style.transform='translate3d('+(S.handDisplay.x*S.w)+'px,'+(S.handDisplay.y*S.h)+'px,0)';indicator.classList.toggle('is-locked',Boolean(h.lockedId));indicator.querySelector('.progress').style.strokeDashoffset=String(120*(1-h.progress));}else{indicator.hidden=true;S.handDisplay=null;}
    }S.raf=requestAnimationFrame(render);
  }
  function wake(){if(!S.raf&&!document.hidden)S.raf=requestAnimationFrame(render);}
  function resize(){const r=scene.getBoundingClientRect();S.w=r.width;S.h=r.height;measure();if(S.initialised&&S.textNodes.length)applyText(S.textSnapshot,true);measureText();textSpace.resize(r.width,r.height);linkCanvas.width=Math.round(r.width*Math.min(devicePixelRatio||1,1.5));linkCanvas.height=Math.round(r.height*Math.min(devicePixelRatio||1,1.5));layout.resize(r.width,r.height);S.renderer?.resize(r.width,r.height,Math.min(devicePixelRatio||1,1.5));wake();}
  function ready(){if(S.initialised)return;S.initialised=true;S.renderer=RoseEffectLabRenderer.create({canvas,image:rose,thornImage:thorn});scene.dataset.ready='true';makeText();refresh();announce('off');resize();}
  new ResizeObserver(resize).observe(scene);const assetsReady=()=>{if(rose.complete&&rose.naturalWidth&&thorn.complete&&thorn.naturalWidth)ready();};rose.addEventListener('load',assetsReady,{once:true});thorn.addEventListener('load',assetsReady,{once:true});rose.addEventListener('error',()=>{error.hidden=false;error.textContent=tr('The rose image could not load. Reopen the preview.','장미 이미지를 불러오지 못했습니다. 미리보기를 다시 열어 주세요.');});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){RoseTracker.stop();cancelAnimationFrame(S.raf);S.raf=0;}else{S.lastTime=0;wake();}});
  window.addEventListener('pagehide',event=>{RoseTracker.stop();cancelAnimationFrame(S.raf);S.raf=0;S.lastTime=0;if(!event.persisted)S.renderer?.dispose();});
  window.addEventListener('pageshow',event=>{if(event.persisted){S.lastTime=0;S.lastRender=0;scene.dataset.restores=String(Number(scene.dataset.restores||0)+1);resize();wake();}});
  reduced.addEventListener('change',()=>wake());
  refresh();assetsReady();
})();
