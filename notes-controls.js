/* Accessible font controls shared by the reader, notes drawer and presenter. */
(()=>{
 const KEY='epa3112.notes.font-size',BASE=22,MIN=16,MAX=42;
 let size=BASE;
 try{const n=Number(localStorage.getItem(KEY));if(n>=MIN&&n<=MAX)size=n;}catch{}
 const mounts=new Set();
 const styles=`.note-font-toolbar{display:flex;align-items:center;gap:7px;flex-wrap:wrap;font:14px/1.4 -apple-system,'PingFang TC',sans-serif;padding:9px 12px;background:var(--surface,#fff);color:var(--text-1,#182f30);border:1px solid var(--border,#d3ddd6);border-radius:7px;flex-shrink:0}.note-font-toolbar button{font:600 14px/1.3 -apple-system,'PingFang TC',sans-serif;min-width:38px;min-height:32px;padding:5px 9px;border:1px solid var(--border,#b9ccc2);border-radius:5px;background:var(--bg,#faf9f4);color:var(--accent,#126661);cursor:pointer}.note-font-toolbar button:disabled{opacity:.4;cursor:default}.note-font-toolbar output{min-width:45px;text-align:center;font-variant-numeric:tabular-nums}.note-font-toolbar button:focus-visible{outline:3px solid var(--accent-2,#a4492d);outline-offset:2px}.note-font-toolbar[data-dark]{--surface:#161d24;--text-1:#d0d7de;--border:#394b58;--bg:#202b35;--accent:#8dd6c7;--accent-2:#f0883e;border-radius:0;border-width:0 0 1px;padding:6px 12px}.note-font-toolbar .font-label{margin-right:3px}.note-font-toolbar[data-dark] .font-label{font-size:12px}@media print{.note-font-toolbar{display:none!important}}`;
 function apply(){
   for(const m of [...mounts]){
     if(m.doc.defaultView?.closed||!m.output.isConnected){mounts.delete(m);continue;}
     m.target.style.setProperty('--notes-font-size',size+'px');
     if(m.direct)m.target.style.fontSize=size+'px';
     m.output.textContent=size+'px';m.minus.disabled=size<=MIN;m.plus.disabled=size>=MAX;
   }
 }
 function change(next){size=Math.max(MIN,Math.min(MAX,next));try{localStorage.setItem(KEY,String(size));}catch{}apply();}
 function mount({doc=document,host,target,direct=true,dark=false,prepend=false}){
   if(!host||!target)return;
   const existing=host.querySelector(':scope > .note-font-toolbar');if(existing)return existing;
   if(!doc.querySelector('#epa-notes-controls-style')){const style=doc.createElement('style');style.id='epa-notes-controls-style';style.textContent=styles;doc.head.append(style);}
   const bar=doc.createElement('div');bar.className='note-font-toolbar';bar.setAttribute('role','group');bar.setAttribute('aria-label','逐字稿文字大小');if(dark)bar.dataset.dark='';
   const label=doc.createElement('span');label.className='font-label';label.textContent='逐字稿字級';bar.append(label);
   function button(text,label,action){const b=doc.createElement('button');b.type='button';b.textContent=text;b.setAttribute('aria-label',label);b.title=label;b.addEventListener('click',e=>{e.stopPropagation();action();});return b;}
   const minus=button('A−','縮小逐字稿文字',()=>change(size-2));
   const output=doc.createElement('output');output.setAttribute('aria-live','polite');
   const plus=button('A+','放大逐字稿文字',()=>change(size+2));
   const reset=button('重設','重設逐字稿文字大小',()=>change(BASE));
   bar.append(minus,output,plus,reset);
   for(const type of ['pointerdown','mousedown','touchstart'])bar.addEventListener(type,e=>e.stopPropagation());
   // The presentation runtime uses Space for navigation; focused controls retain
   // their native activation and do not advance the audience slide.
   doc.addEventListener('keydown',e=>{if(bar.contains(e.target)&&['Enter',' '].includes(e.key))e.stopImmediatePropagation();},true);
   prepend?host.prepend(bar):host.append(bar);
   mounts.add({doc,host,target,direct,output,minus,plus});apply();return bar;
 }
 window.EPANotesControls={mount};
 addEventListener('epa:presenter-open',e=>{
   const doc=e.detail.window.document,card=doc.querySelector('#card-notes'),body=doc.querySelector('#notes-body');
   if(!card||!body)return;
   const host=doc.createElement('div');card.insertBefore(host,body);mount({doc,host,target:body,dark:true});
 });
 document.addEventListener('DOMContentLoaded',()=>{
   const reader=document.querySelector('[data-notes-controls]');
   if(reader)mount({host:reader,target:document.documentElement,direct:false});
   const drawer=document.querySelector('.notes-overlay');
   if(drawer){
     const refresh=()=>{if(!drawer.querySelector(':scope > .note-font-toolbar'))mount({host:drawer,target:drawer,prepend:true});};
     new MutationObserver(refresh).observe(drawer,{childList:true});refresh();
   }
 });
})();
