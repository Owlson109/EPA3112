/* Local navigation and evidence panels; presentation engine is the skill runtime. */
document.addEventListener('DOMContentLoaded',()=>{
  const motionVisibility=()=>document.body.toggleAttribute('data-motion-paused',document.hidden);
  document.addEventListener('visibilitychange',motionVisibility);motionVisibility();
  if(new URLSearchParams(location.search).has('preview'))return;
  // On short landscape displays keep the source links clear of the toolbar.
  const dock=document.querySelector('.viewer-dock');
  const shortScreen=matchMedia('(orientation:landscape) and (max-height:600px)');
  const fitControls=()=>{dock.open=!shortScreen.matches;};
  fitControls();
  shortScreen.addEventListener('change',fitControls);
  const sources=JSON.parse(document.querySelector('#source-data').textContent);
  const byId=new Map(sources.map(s=>[s.id,s]));
  const analysisSources=JSON.parse(document.getElementById('analysis-sources').textContent);
  const sourceFor=(id,link)=>(link.closest('[data-analysis-open]') && analysisSources[id]) || byId.get(id);
  const sourceDialog=document.querySelector('#source-dialog');
  const toc=document.querySelector('#toc-dialog');
  // Printed links point to public originals, never to the author's local paths.
  const printLinks=new Map();
  addEventListener('beforeprint',()=>{
    document.querySelectorAll('.deck a[data-source]').forEach(a=>{
      printLinks.set(a,a.getAttribute('href'));
      const url=sourceFor(a.dataset.source,a)?.url;
      if(url&&/^https?:/.test(url))a.href=url;else a.removeAttribute('href');
    });
  });
  addEventListener('afterprint',()=>{for(const [a,href]of printLinks){if(href!==null)a.setAttribute('href',href);}printLinks.clear();});
  let returnFocus=null;
  const certificateDialog=document.querySelector('#certificate-dialog');
  const certificateStage=certificateDialog?.querySelector('.certificate-enlargement');
  function fitCertificate(){
    const paper=certificateStage.firstElementChild;
    if(!certificateDialog.open||!paper)return;
    const scale=Math.min(certificateStage.clientWidth/paper.offsetWidth,certificateStage.clientHeight/paper.offsetHeight);
    paper.style.transform='scale('+scale+')';
  }
  if(certificateStage)new ResizeObserver(fitCertificate).observe(certificateStage);
  function openCertificate(trigger){
    returnFocus=trigger;
    certificateDialog.querySelector('h2').textContent=trigger.dataset.certificate;
    const paper=trigger.closest('figure').querySelector('.certificate-paper');
    certificateStage.replaceChildren(paper.cloneNode(true));
    certificateDialog.showModal();
    fitCertificate();
  }
  window.addEventListener('epa:slide-change',()=>{if(certificateDialog?.open)certificateDialog.close();});
  const field=(label,value)=>{const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=value||'未另記錄';return [dt,dd];};
  function openSource(id,trigger){
    const s=sourceFor(id,trigger);if(!s)return;
    returnFocus=trigger;
    document.querySelector('#source-id').textContent=s.id+' · '+(s.document_date_or_version||'');
    document.querySelector('#source-title').textContent=s.title;
    const dl=document.querySelector('#source-fields');dl.replaceChildren();
    for(const [label,key] of [['頁碼／段落','locator'],['可支持的內容','supports'],['引用限制','limits'],['本次核讀狀態','verification_status']])dl.append(...field(label,s[key]));
    const links=document.querySelector('#source-links');links.replaceChildren();
    if(s.url&&/^https?:/.test(s.url)){
      const a=document.createElement('a');a.href=s.url;a.target='_blank';a.rel='noopener noreferrer';a.textContent='開啟公開原文（需要網絡）';links.append(a,document.createElement('br'));
    }
    if(byId.has(id)){
      const a=document.createElement('a');a.href='appendix.html#'+encodeURIComponent(s.id);a.target='_blank';a.rel='noopener';a.textContent='查看完整來源條目';links.append(a);
    }
    sourceDialog.showModal();
  }
  const key=k=>document.dispatchEvent(new KeyboardEvent('keydown',{key:k,bubbles:true,cancelable:true}));
  document.addEventListener('click',e=>{
    const excerpt=e.target.closest('[data-course-excerpt]');
    if(excerpt){e.preventDefault();returnFocus=excerpt;document.querySelector('#course-excerpt').showModal();return;}
    const certificate=e.target.closest('[data-certificate]');if(certificate){openCertificate(certificate);return;}
    const ref=e.target.closest('[data-source]');if(ref){e.preventDefault();openSource(ref.dataset.source,ref);return;}
    const jump=e.target.closest('[data-slide]');if(jump){toc.close();location.hash='/'+jump.dataset.slide;return;}
    const close=e.target.closest('[data-close]');if(close){close.closest('dialog').close();return;}
    const action=e.target.closest('[data-action]');if(!action)return;
    switch(action.dataset.action){
      case 'prev':key('ArrowLeft');break;case 'next':key('ArrowRight');break;
      case 'notes':key('n');break;case 'presenter':key('s');break;case 'fullscreen':key('f');break;
      case 'toc':returnFocus=action;toc.showModal();break;
      case 'print':window.print();break;
    }
  });
  document.querySelectorAll('dialog').forEach(d=>d.addEventListener('close',()=>returnFocus?.focus()));
  // Preserve normal keyboard activation on links/buttons, and modal focus handling.
  document.addEventListener('keydown',e=>{
    if(document.querySelector('dialog[open]')){e.stopImmediatePropagation();return;}
    if(e.target instanceof Element&&e.target.closest('a,button,input,textarea,select')&&['Enter',' '].includes(e.key))e.stopImmediatePropagation();
  },true);
  const deck=document.querySelector('.deck');
  function accessibility(){deck.querySelectorAll(':scope > .slide').forEach(s=>{const active=s.classList.contains('is-active')&&!document.body.hasAttribute('data-evidence-intro');s.inert=!active;s.setAttribute('aria-hidden',String(!active));});}
  new MutationObserver(accessibility).observe(deck,{subtree:true,attributes:true,attributeFilter:['class']});accessibility();
});
