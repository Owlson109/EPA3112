/* Per-slide evidence prelude. Summaries remain editable in evidence_intros.json.
   Register before the presentation engine, whose navigation event covers keys,
   hash links, touch, overview clicks and the remote presenter window. */
(()=>{
 'use strict';
 if(new URLSearchParams(location.search).has('preview'))return;
 const deck=document.querySelector('.deck'), data=document.querySelector('#evidence-intro-data');
 if(!deck||!data)return;
 const rows=new Map(JSON.parse(data.textContent).map(r=>[r.slide,r]));
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'), print=matchMedia('print');
 const storeKey='epa3112-evidence-intros', holdKey='epa3112-evidence-auto-hold';
 let enabled=true, autoHold=false;
 try{enabled=localStorage.getItem(storeKey)!=='off';}catch{}
 try{autoHold=localStorage.getItem(holdKey)==='on';}catch{}
 const overlay=document.createElement('div');overlay.className='evidence-intro';overlay.hidden=true;
 overlay.setAttribute('role','region');overlay.setAttribute('aria-label','本頁文件重點');deck.append(overlay);
 const skip=document.createElement('button');skip.className='evidence-skip';skip.hidden=true;
 skip.innerHTML='略過文件動畫 <kbd>空白鍵 / Esc</kbd>';skip.setAttribute('aria-label','略過文件動畫，顯示本頁');
 const controls=document.createElement('div');controls.className='evidence-controls';controls.hidden=true;
 const pause=document.createElement('button');pause.className='evidence-pause';pause.type='button';pause.setAttribute('aria-keyshortcuts','P');
 controls.append(pause,skip);document.body.append(controls);
 const holdToggle=document.createElement('button');holdToggle.type='button';holdToggle.dataset.evidenceHoldToggle='';holdToggle.setAttribute('aria-keyshortcuts','P');
 document.querySelector('.viewer-tools')?.append(holdToggle);
 const toggle=document.querySelector('[data-evidence-toggle]');
 let current=null, outgoing=null, timer=0, holdFrame=0, active=false, paused=false, holdPassed=false, duration=5800, last=-1, focusBefore=null, endHandler=null;
 const el=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text)e.textContent=text;return e;};
 function setToggle(){if(toggle){toggle.textContent='文件動畫：'+(enabled?'開':'關');toggle.setAttribute('aria-pressed',String(enabled));}}
 function setPauseLabel(){
  const label='自動停留：'+(autoHold?'開':'關');
  pause.innerHTML=label+' <kbd>P</kbd>';holdToggle.textContent=label+' P';
  for(const button of [pause,holdToggle]){
   button.setAttribute('aria-pressed',String(autoHold));
   button.setAttribute('aria-label',label+'；按P切換，開啟後每頁在螢光筆完成時停留');
  }
  skip.innerHTML=paused?'標記完成 · 顯示正文 <kbd>→ / 空白鍵</kbd>':'略過文件動畫 <kbd>空白鍵 / Esc</kbd>';
 }
 function transitionAnimations(){
  return document.getAnimations().filter(a=>{const target=a.effect?.target;return target&&(target===current||target===outgoing||overlay.contains(target));});
 }
 function elapsed(){return transitionAnimations().find(a=>a.animationName==='epa-content-bridge')?.currentTime||0;}
 function scheduleFinish(ms){
  clearTimeout(timer);
  timer=setTimeout(()=>{if(autoHold&&!holdPassed)holdAtReading();else finish();},Math.max(0,ms));
 }
 function holdAtReading(){
  if(!active||!autoHold||holdPassed)return;
  clearTimeout(timer);timer=0;cancelAnimationFrame(holdFrame);holdFrame=0;
  // Marker stroke ends at 42%, its shine at 47%. At 50% all text is
  // highlighted, papers are settled, and neither papers nor heading departs.
  paused=true;document.body.setAttribute('data-evidence-paused','');
  transitionAnimations().forEach(a=>{a.currentTime=duration*.5;});
  setPauseLabel();
 }
 function watchHold(){
  cancelAnimationFrame(holdFrame);holdFrame=0;
  if(!active||!autoHold||holdPassed||paused)return;
  if(elapsed()>=duration*.5){holdAtReading();return;}
  holdFrame=requestAnimationFrame(watchHold);
 }
 function resumeHold(advance=false){
  if(!paused)return;
  // Advance starts the existing departure sequence without another reading
  // delay. Switching the mode off simply resumes at the held frame.
  if(advance)transitionAnimations().forEach(a=>{a.currentTime=duration*.62;});
  const time=elapsed();paused=false;holdPassed=true;
  document.body.removeAttribute('data-evidence-paused');setPauseLabel();
  scheduleFinish(duration+220-time);
 }
 function togglePause(){
  autoHold=!autoHold;try{localStorage.setItem(holdKey,autoHold?'on':'off');}catch{}
  setPauseLabel();
  if(!autoHold){cancelAnimationFrame(holdFrame);holdFrame=0;resumeHold();}
  else if(active){holdPassed=false;watchHold();}
 }
 function advance(){if(paused)resumeHold(true);else finish();}
 function finish(){
  clearTimeout(timer);timer=0;
  cancelAnimationFrame(holdFrame);holdFrame=0;
  if(current&&endHandler)current.removeEventListener('animationend',endHandler);
  endHandler=null;
  outgoing?.classList.remove('evidence-outgoing');outgoing=null;
  const restore=controls.contains(document.activeElement);
  active=false;paused=false;holdPassed=false;overlay.hidden=true;skip.hidden=true;controls.hidden=true;
  document.body.removeAttribute('data-evidence-intro');document.body.removeAttribute('data-evidence-paused');setPauseLabel();
  if(current){const visible=current.classList.contains('is-active');current.inert=!visible;current.setAttribute('aria-hidden',String(!visible));}
  overlay.replaceChildren();
  if(restore){
   if(focusBefore?.isConnected&&focusBefore.getClientRects().length&&!focusBefore.closest('.slide:not(.is-active)'))focusBefore.focus();
   else Array.from(document.querySelectorAll('[data-action="next"]')).find(b=>b.getClientRects().length)?.focus();
  }
 }
 function start(index,slide,previousSlide){
  if(index===last&&active)return;
  const continuing=active;
  finish();current?.classList.remove('evidence-prepared');last=index;current=slide;
  const row=rows.get(index+1);
  if(index===0||!row||row.enabled===false||!enabled||reduced.matches||print.matches||document.hidden)return;
  focusBefore=document.activeElement;
  const courseEdition=slide.dataset.layout==='course-edition';
  overlay.dataset.layout=courseEdition?'course-edition':'';
  overlay.dataset.slideTheme=slide.dataset.slideTheme||'';
  const top=el('div','evidence-intro-top');
  top.append(el('span','',courseEdition?'EPA3112　／　證據摘讀':'EPA3112 ／ 從文件看發展'),el('span','',String(index+1).padStart(2,'0')+' / 17'));
  const title=el('h2','',row.heading);
  const docs=el('div','evidence-documents');
  for(const card of row.cards){
   const paper=el('article','evidence-paper');paper.dataset.sourceId=card.source;
   if(card.source.startsWith('O'))paper.dataset.kind='oral';
   const head=el('div','evidence-paper-head');head.append(el('b','',card.source),el('span','',card.kind));
   const content=el('div','evidence-paper-content');
   if(card.image){const img=el('img','evidence-paper-image');img.src=card.image;img.alt='已匿名化的證書';content.append(img);}
   const excerpt=el('div','evidence-excerpt');
   const before=el('p','evidence-context context-before',card.context_before);
   before.setAttribute('aria-hidden','true');
   const lines=el('div','evidence-lines');
   for(const line of card.lines){const p=el('p','evidence-line');p.append(el('span','evidence-highlight',line));lines.append(p);}
   const after=el('p','evidence-context context-after',card.context_after);
   after.setAttribute('aria-hidden','true');
   excerpt.append(before,lines,after);content.append(excerpt);
   const cardTitle=el('h3','',card.title);
   let heading=cardTitle;
   if(courseEdition){
    heading=el('div','evidence-document-heading');heading.append(cardTitle);
    if(card.facsimile){
     const figure=el('figure','source-facsimile'),img=el('img');
     img.src=card.facsimile;img.alt='';
     figure.append(img,el('figcaption','','原頁 · PDF '+card.pdf_page));heading.append(figure);
    }
   }
   paper.append(head,heading,content,el('p','evidence-paper-locator',card.locator));docs.append(paper);
  }
  const foot=el('div','evidence-intro-foot');
  foot.append(el('span','',courseEdition?'重點摘述　／　頁碼見各卡下方':'文件重點 → 課程發展'),el('span','evidence-progress'));
  const backdrop=el('div','evidence-backdrop'),bridge=el('div','evidence-bridge');
  backdrop.setAttribute('aria-hidden','true');bridge.setAttribute('aria-hidden','true');
  overlay.replaceChildren(backdrop,top,title,docs,foot,bridge);
  // Retain the real outgoing page for the opening crossfade. A reverse turn
  // during a prelude keeps the document stage, without revealing an unseen page.
  overlay.classList.toggle('is-continuing',continuing);
  if(!continuing&&previousSlide&&previousSlide!==current){
   outgoing=previousSlide;outgoing.classList.add('evidence-outgoing');
   outgoing.inert=true;outgoing.setAttribute('aria-hidden','true');
  }
  active=true;document.body.setAttribute('data-evidence-intro',String(index+1));current.inert=true;current.setAttribute('aria-hidden','true');
  current.classList.add('evidence-prepared');
  overlay.hidden=false;skip.hidden=false;controls.hidden=false;
  // The shared timeline overlaps paper departure with the actual slide reveal.
  // Finish on the slide's last frame, so the completed view never flashes.
  endHandler=e=>{if(e.animationName==='epa-content-bridge'&&e.target===current)finish();};
  current.addEventListener('animationend',endHandler);
  duration=parseFloat(getComputedStyle(overlay).getPropertyValue('--evidence-duration'))||5800;
  scheduleFinish(duration+220);
  watchHold();
 }
 skip.addEventListener('click',advance);
 pause.addEventListener('click',togglePause);
 holdToggle.addEventListener('click',togglePause);
 toggle?.addEventListener('click',e=>{
  enabled=!enabled;try{localStorage.setItem(storeKey,enabled?'on':'off');}catch{}
  setToggle();if(!enabled)finish();
  // A mouse/touch click returns keyboard control to the deck. Otherwise the
  // next Space would activate this still-focused switch instead of advancing.
  // Keep focus for deliberate keyboard activation (Enter/Space has detail 0).
  if(e.detail>0)toggle.blur();
 });
 // Audience windows share navigation and stored preferences. Without this
 // listener, another open window can retain a prelude and reject every other
 // forward request even after the visible window turns document animation off.
 window.addEventListener('storage',e=>{
  if(e.key===storeKey){enabled=e.newValue!=='off';setToggle();if(!enabled)finish();}
 });
 setToggle();setPauseLabel();
 window.addEventListener('epa:slide-change',e=>start(e.detail.index,e.detail.slide,e.detail.previousSlide));
 window.addEventListener('epa:evidence-pause',togglePause);
 // This also covers touch swipes and presenter-window next buttons. Keep
 // the intended slide selected while its held documents depart.
 window.addEventListener('epa:before-slide-change',e=>{
  if(enabled&&active&&e.detail.index===last+1){e.preventDefault();advance();}
 });
 // The first forward key reveals the current page, never accidentally skips it.
 document.addEventListener('keydown',e=>{
  if(e.metaKey||e.ctrlKey||e.altKey||document.querySelector('dialog[open]'))return;
  if(e.key.toLowerCase()==='p'){
   if(e.target.isContentEditable||e.target.closest?.('input,textarea,select'))return;
   e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)togglePause();return;
  }
  if(!active)return;
  if(['ArrowDown','ArrowRight','PageDown',' ','Enter','Escape'].includes(e.key)){
   if(e.target.closest?.('button,a,input,textarea,select')&&[' ','Enter'].includes(e.key)&&e.target!==skip)return;
   e.preventDefault();e.stopImmediatePropagation();if(e.key==='Escape')finish();else advance();
  }else if(['o','O','n','N'].includes(e.key))finish();
 },true);
 document.addEventListener('click',e=>{
  if(!active)return;
  const control=e.target.closest('[data-action]');
  if(control?.dataset.action==='next'){e.preventDefault();e.stopImmediatePropagation();advance();}
  else if(control&&['toc','notes','print'].includes(control.dataset.action))finish();
 },true);
 const changed=()=>{if(reduced.matches||print.matches)finish();};
 reduced.addEventListener('change',changed);print.addEventListener('change',changed);
 window.addEventListener('beforeprint',finish);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)finish();});
})();
