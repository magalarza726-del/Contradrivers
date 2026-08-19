(async function(){
  const tabs=document.querySelector('#control-tabs');
  const grid=document.querySelector('#control-grid');
  const tip=document.querySelector('#control-tip');
  if(!tabs||!grid||!tip)return;
  try{
    const response=await fetch('./data/button-guide.json');
    if(!response.ok)throw new Error('No se pudo cargar la guía');
    const guide=await response.json();
    const pages=guide.pages||[];
    const labels={race:'Carrera',nitro:'Nitro + Rhythm',maker:'Track Maker',developer:'Desarrollo',gamepad:'Mando'};
    function render(id){
      const page=pages.find(p=>p.id===id)||pages[0];
      if(!page)return;
      [...tabs.children].forEach(btn=>btn.classList.toggle('active',btn.dataset.id===page.id));
      grid.innerHTML='';
      (page.entries||[]).forEach(entry=>{
        const row=document.createElement('div'); row.className='control-row';
        const key=document.createElement('span'); key.className='key'; key.textContent=entry.key||'';
        const action=document.createElement('strong'); action.textContent=entry.action||'';
        const note=document.createElement('span'); note.textContent=entry.note||'';
        row.append(key,action,note); grid.append(row);
      });
      tip.textContent=page.tip||'';
    }
    pages.forEach((page,index)=>{
      const button=document.createElement('button');
      button.type='button'; button.dataset.id=page.id; button.textContent=labels[page.id]||page.title||page.id;
      button.addEventListener('click',()=>render(page.id));
      tabs.append(button);
      if(index===0)button.classList.add('active');
    });
    render('race');
  }catch(error){
    grid.innerHTML='<p>No fue posible cargar la guía de controles.</p>';
    console.error(error);
  }
})();
