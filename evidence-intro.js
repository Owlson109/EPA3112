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
 const storeKey='epa3112-evidence-intros';
 let enabled=true;
 try{enabled=localStorage.getItem(storeKey)!=='off';}catch{}
 const overlay=document.createElement('div');overlay.className='evidence-intro';overlay.hidden=true;
 overlay.setAttribute('role','region');overlay.setAttribute('aria-label','本頁文件重點');deck.append(overlay);
 const skip=document.createElement('button');skip.className='evidence-skip';skip.hidden=true;
 skip.innerHTML='略過文件動畫 <kbd>空白鍵 / Esc</kbd>';skip.setAttribute('aria-label','略過文件動畫，顯示本頁');document.body.append(skip);
 const toggle=document.querySelector('[data-evidence-toggle]');
 let current=null, outgoing=null, timer=0, active=false, last=-1, focusBefore=null, endHandler=null;
 const el=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text)e.textContent=text;return e;};
 function setToggle(){if(toggle){toggle.textContent='文件動畫：'+(enabled?'開':'關');toggle.setAttribute('aria-pressed',String(enabled));}}
 function finish(){
  clearTimeout(timer);timer=0;
  if(current&&endHandler)current.removeEventListener('animationend',endHandler);
  endHandler=null;
  outgoing?.classList.remove('evidence-outgoing');outgoing=null;
  const restore=skip===document.activeElement;
  active=false;overlay.hidden=true;skip.hidden=true;document.body.removeAttribute('data-evidence-intro');
  if(current){const visible=current.classList.contains('is-active');current.inert=!visible;current.setAttribute('aria-hidden',String(!visible));}
  overlay.replaceChildren();
  if(restore){if(focusBefore?.isConnected&&!focusBefore.closest('.slide:not(.is-active)'))focusBefore.focus();else document.querySelector('[data-action="next"]')?.focus();}
 }
 function start(index,slide,previousSlide){
  if(index===last&&active)return;
  const continuing=active;
  finish();current?.classList.remove('evidence-prepared');last=index;current=slide;
  const row=rows.get(index+1);
  if(index===0||!row||row.enabled===false||!enabled||reduced.matches||print.matches||document.hidden)return;
  focusBefore=document.activeElement;
  const top=el('div','evidence-intro-top');top.append(el('span','','EPA3112 ／ 從文件看發展'),el('span','',String(index+1).padStart(2,'0')+' / 17'));
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
   excerpt.append(before,lines,after);content.append(excerpt);paper.append(head,el('h3','',card.title),content,el('p','evidence-paper-locator',card.locator));docs.append(paper);
  }
  const foot=el('div','evidence-intro-foot');foot.append(el('span','','文件重點 → 課程發展'),el('span','evidence-progress'));
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
  overlay.hidden=false;skip.hidden=false;
  // The shared timeline overlaps paper departure with the actual slide reveal.
  // Finish on the slide's last frame, so the completed view never flashes.
  endHandler=e=>{if(e.animationName==='epa-content-bridge'&&e.target===current)finish();};
  current.addEventListener('animationend',endHandler);
  const duration=parseFloat(getComputedStyle(overlay).getPropertyValue('--evidence-duration'))||5800;
  timer=setTimeout(finish,duration+220);
 }
 skip.addEventListener('click',finish);
 toggle?.addEventListener('click',()=>{enabled=!enabled;try{localStorage.setItem(storeKey,enabled?'on':'off');}catch{}setToggle();if(!enabled)finish();});
 setToggle();
 window.addEventListener('epa:slide-change',e=>start(e.detail.index,e.detail.slide,e.detail.previousSlide));
 // The first forward key reveals the current page, never accidentally skips it.
 document.addEventListener('keydown',e=>{
  if(!active||e.metaKey||e.ctrlKey||e.altKey||document.querySelector('dialog[open]'))return;
  if(['ArrowRight','PageDown',' ','Enter','Escape'].includes(e.key)){
   if(e.target.closest?.('button,a,input,textarea,select')&&[' ','Enter'].includes(e.key)&&e.target!==skip)return;
   e.preventDefault();e.stopImmediatePropagation();finish();
  }else if(['o','O','n','N'].includes(e.key))finish();
 },true);
 document.addEventListener('click',e=>{
  if(!active)return;
  const control=e.target.closest('[data-action]');
  if(control?.dataset.action==='next'){e.preventDefault();e.stopImmediatePropagation();finish();}
  else if(control&&['toc','notes','print'].includes(control.dataset.action))finish();
 },true);
 const changed=()=>{if(reduced.matches||print.matches)finish();};
 reduced.addEventListener('change',changed);print.addEventListener('change',changed);
 window.addEventListener('beforeprint',finish);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)finish();});
})();
