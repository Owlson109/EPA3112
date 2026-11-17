(()=>{
 const search=document.querySelector('#source-search'),group=document.querySelector('#source-group'),state=document.querySelector('#source-state');
 const records=[...document.querySelectorAll('.source-record')];
 const index=records.map(el=>({el,text:el.textContent.toLocaleLowerCase()}));
 function filter(){const q=search.value.trim().toLocaleLowerCase(),isId=/^d\d{2}e?$/.test(q);let n=0;for(const {el,text} of index){const match=!q||(isId?el.id.toLocaleLowerCase()==='research-'+q:text.includes(q));const visible=match&&(!group.value||el.dataset.group===group.value)&&(!state.value||el.dataset.state===state.value);el.hidden=!visible;if(visible)n++;}document.querySelector('#source-count').textContent=`顯示 ${n} / ${records.length} 項文件`;}
 [search,group,state].forEach(el=>el.addEventListener('input',filter));
 document.querySelector('#source-reset').addEventListener('click',()=>{search.value=group.value=state.value='';filter();search.focus();});filter();
})();
