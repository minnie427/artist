/* Rose Field, emotion-led interaction within the existing bilingual site. */
window.MP_ROSE_HOME = {
  render(language, href, root) {
    const tr = (en, ko) => language === 'ko' ? ko : en;
    const nodes = Array.from({length: 7}, (_, i) => `<div class="emotion-node"><button class="word" data-slot="${i}" type="button"></button><div class="node-data" aria-hidden="true"><p class="position-data"></p><p class="motion-data"></p></div></div>`).join('\n');
    return `<div class="rose-home" id="top" data-experience="rose-field-10">
      <div class="heading"><div><h1 id="heroTitle"><a href="${href('')}" aria-label="${tr('Minnie Park, home', 'Minnie Park, 홈')}">Minnie Park</a></h1><p>${tr('INTERACTIVE AUDIO-VISUAL ARTIST<br>SEOUL / MELBOURNE', '인터랙티브 오디오비주얼 아티스트<br>서울 / 멜버른')}</p></div></div>
      <section class="experience" aria-label="${tr('Interactive rose', '인터랙티브 장미')}">
        <div class="scene" id="scene" data-selections="0">
          <canvas id="portrait" role="img" aria-label="${tr('An interactive image-derived rose relief, shaped by selected feelings.', '선택한 감정에 따라 변화하는 이미지 기반 장미 릴리프.')}"></canvas>
          <img id="roseFallback" class="rose-fallback" alt="${tr('The original halftone rose.', '원래의 하프톤 장미.')}" hidden>
          <canvas id="textLinks" aria-hidden="true"></canvas><div id="textField" class="text-field" aria-hidden="true"></div>
          <div id="words" class="words" role="group" aria-label="${tr('Hold and select a feeling', '감정 단어 멈추고 선택하기')}">${nodes}</div>
          <div id="handIndicator" class="hand-indicator" hidden aria-hidden="true"><svg viewBox="0 0 44 44"><circle cx="22" cy="22" r="19" class="ring"/><circle cx="22" cy="22" r="19" class="progress"/></svg><i></i></div>
          <p id="interactionCue" class="interaction-cue">${tr('An interactive rose space.<br>Explore feelings.', '장미와 감정을 탐색하는<br>인터랙티브 공간입니다.')}</p>
          <span class="scene-label" id="modeLabel" hidden aria-hidden="true"></span>
        </div>
        <div class="field-controls"><div class="controls">
          <button id="camera" class="pill" type="button" aria-pressed="false">${tr('Enable camera', '카메라 켜기')}</button>
          <button id="reset" class="text-button" type="button">${tr('Reset', '초기화')}</button>
          <details class="interaction-help" id="interactionHelp"><summary aria-label="${tr('How to interact', '인터랙션 안내')}"><span aria-hidden="true">?</span></summary><div class="interaction-help__body">
            <p id="instruction"></p><p id="status" role="status" aria-live="polite"></p>
            <p>${tr('Each feeling leaves a different trace. Your selections accumulate until you reset the rose.', '감정마다 서로 다른 흔적을 남깁니다. 초기화하기 전까지 선택한 감정들의 변화가 함께 쌓입니다.')}</p>
            <button id="handMode" type="button" class="text-button">${tr('Hand: pinch', '손 선택: 핀치')}</button>
            <p class="privacy">${tr('Camera is optional. Your face moves the rose; use your palm to hold a word, then pinch to select it. Face and room video stay hidden and are processed in your browser without recording or uploading. No microphone is requested. Tracking files load only when you enable the camera, which stops when you leave the tab. Feelings are selected by you, not inferred from your face.', '카메라는 선택사항입니다. 얼굴의 위치에 장미가 반응합니다. 손바닥으로 단어를 멈추고 엄지와 검지를 모아 선택하세요. 얼굴과 주변 영상은 표시하지 않으며, 브라우저에서 녹화나 업로드 없이 처리합니다. 마이크는 요청하지 않습니다. 인식 파일은 카메라를 켤 때만 불러오고 탭을 벗어나면 카메라가 멈춥니다. 감정은 직접 선택하며 얼굴에서 판독하지 않습니다.')}</p>
            <p class="privacy">${tr('The rose is an image-derived relief with limited rotation. Its responses are artistic compositions, not emotional assessments.', '장미는 제한된 회전이 가능한 이미지 기반 릴리프입니다. 시각적 반응은 감정에 대한 평가가 아닌 예술적 구성입니다.')}</p>
            <p id="renderStats" class="render-stats" aria-live="off"></p><div class="record"><span id="layerCount"></span><p id="layerHistory"></p></div>
          </div></details>
        </div></div>
        <p id="error" class="error" role="alert" hidden></p>
      </section>
      <footer><div class="home-copy"><p>${tr('Exploring the coexistence of conflicting feelings through pink, roses and interactive audio-visual installations.', '핑크와 장미, 인터랙티브 오디오비주얼 설치를 통해 모순되는 감정이 함께 존재하는 방식을 탐구합니다.')}</p><p class="hero-note">${tr('Touch, sound and moving image open a space to encounter emotional ambivalence.', '터치, 사운드와 무빙이미지로 감정의 양가성을 마주할 공간을 만듭니다.')}</p></div><a class="pill" href="${href('works/')}">${tr('Works ↗', '작품 ↗')}</a></footer>
      <img id="thornSource" src="${root}assets/thorn-link-v1.png" alt="" hidden><img id="roseSource" src="${root}assets/rose-halftone.png" alt="" hidden>
    </div>`;
  }
};
