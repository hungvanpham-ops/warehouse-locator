// app.js - updated with grid define feature
(() => {
  const DB_KEY = 'warehouse_locator_db_v1';
  const REGION_KEY = 'warehouse_locator_regions_v1';
  const SAMPLE_COUNT = 200;

  // DOM
  const defineGridBtn = document.getElementById('defineGridBtn');
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const addModeBtn = document.getElementById('addModeBtn');
  const exportBtn = document.getElementById('exportBtn');
  const importInput = document.getElementById('importInput');
  const qrScanBtn = document.getElementById('qrScanBtn');
  const qrGenBtn = document.getElementById('qrGenBtn');
  const resetBtn = document.getElementById('resetBtn');
  const matchesEl = document.getElementById('matches');
  const detailEl = document.getElementById('detail');
  const markersEl = document.getElementById('markers');
  const mapInner = document.getElementById('mapInner');
  const floorplan = document.getElementById('floorplan');
  const regionsEl = document.getElementById('regions');
  const gridOverlay = document.getElementById('gridOverlay');

  const gridModal = document.getElementById('gridModal');
  const closeGrid = document.getElementById('closeGrid');
  const gridForm = document.getElementById('gridForm');
  const regionNameIn = document.getElementById('regionName');
  const gridRowsIn = document.getElementById('gridRows');
  const gridColsIn = document.getElementById('gridCols');
  const gridPaddingIn = document.getElementById('gridPadding');
  const cancelGrid = document.getElementById('cancelGrid');

  const editModal = document.getElementById('editModal');
  const closeEdit = document.getElementById('closeEdit');
  const editForm = document.getElementById('editForm');
  const fieldLocationId = document.getElementById('fieldLocationId');
  const fieldSKU = document.getElementById('fieldSKU');
  const fieldName = document.getElementById('fieldName');
  const fieldQty = document.getElementById('fieldQty');
  const deleteBtn = document.getElementById('deleteBtn');

  // state
  let db = [];
  let regions = [];
  let selected = null;
  let addMode = false;
  let drawing = false;
  let drawStart = null;
  let currentRect = null;
  let markerEls = new Map();

  function showToast(msg, t=2000){ const toast = document.getElementById('toast'); if(!toast) return; toast.textContent = msg; toast.style.display='block'; setTimeout(()=>toast.style.display='none', t); }

  function saveDB(){ localStorage.setItem(DB_KEY, JSON.stringify({items: db, savedAt: Date.now()})); }
  function loadDB(){ try{ const raw = localStorage.getItem(DB_KEY); if(!raw) return null; const p = JSON.parse(raw); if(p && Array.isArray(p.items)) return p.items; if(Array.isArray(p)) return p;}catch(e){console.error(e);} return null; }
  function saveRegions(){ localStorage.setItem(REGION_KEY, JSON.stringify({regions, savedAt: Date.now()})); }
  function loadRegions(){ try{ const raw = localStorage.getItem(REGION_KEY); if(!raw) return []; const p = JSON.parse(raw); return p && Array.isArray(p.regions) ? p.regions : Array.isArray(p) ? p : []; }catch(e){console.error(e);} return []; }

  function createSampleData(){ const items=[]; const cols=20, rows=10; let i=0; for(let r=0;r<rows && i<SAMPLE_COUNT;r++){ for(let c=0;c<cols && i<SAMPLE_COUNT;c++){ i++; const id=`L-${String(i).padStart(3,'0')}`; const sku=`SKU-${String(i).padStart(4,'0')}`; const name=`Product ${i}`; const qty = Math.floor(Math.random()*200)+1; const left = 6 + (c+0.5)*(88/cols); const top = 6 + (r+0.5)*(88/rows); items.push({id,sku,name,qty,coords:{left: Number(left.toFixed(2)), top: Number(top.toFixed(2))}}); } } return items; }

  function seedIfEmpty(){ const loaded=loadDB(); if(!loaded || loaded.length===0){ db=createSampleData(); saveDB(); showToast('Seeded sample data'); } else db=loaded; regions = loadRegions(); }

  function updateMapInnerSize(){ const iw = floorplan.naturalWidth || floorplan.width || 2000; const ih = floorplan.naturalHeight || floorplan.height || 1200; mapInner.style.width = iw+'px'; mapInner.style.height = ih+'px'; markersEl.style.width = iw+'px'; markersEl.style.height = ih+'px'; }

  function clearMarkers(){ markersEl.innerHTML=''; markerEls.clear(); }

  function renderMarkers(){ clearMarkers(); updateMapInnerSize(); const iw=parseFloat(mapInner.style.width); const ih=parseFloat(mapInner.style.height); db.forEach(item=>{ if(!item.coords) return; if(item.coords.left<0||item.coords.left>100||item.coords.top<0||item.coords.top>100) return; const x=(item.coords.left/100)*iw; const y=(item.coords.top/100)*ih; const el=document.createElement('div'); el.className='marker'; el.dataset.id=item.id; el.title=`${item.id} • ${item.sku} • ${item.name}`; el.style.left=x+'px'; el.style.top=y+'px'; el.addEventListener('click', e=>{ e.stopPropagation(); openEdit(item.id); revealHighlight(item.id); }); markersEl.appendChild(el); markerEls.set(item.id, el); }); }

  function renderRegions(){ regionsEl.innerHTML=''; regions.forEach((r, idx)=>{ const div=document.createElement('div'); div.className='region-item'; div.innerHTML=`<div><strong>${r.name||'Region '+(idx+1)}</strong><div style="font-size:12px;color:var(--muted)">rows:${r.rows} cols:${r.cols}</div></div><div><button data-idx="${idx}" class="reg-generate">Generate</button> <button data-idx="${idx}" class="reg-delete">Delete</button></div>`; regionsEl.appendChild(div); div.querySelector('.reg-generate').addEventListener('click', ()=>{ generateFromRegion(r); }); div.querySelector('.reg-delete').addEventListener('click', ()=>{ if(confirm('Delete region and its markers?')){ // remove markers associated
      db = db.filter(it=> !(it.regionId && it.regionId===r.id)); regions.splice(idx,1); saveRegions(); saveDB(); renderRegions(); renderMarkers(); showToast('Region deleted'); } }); }); }

  function generateFromRegion(r){ // r in image pixel space {x,y,w,h,rows,cols,padding,name,id}
    const iw=parseFloat(mapInner.style.width); const ih=parseFloat(mapInner.style.height);
    const pad = (r.padding||0)/100; const left = r.x + r.w*pad; const top = r.y + r.h*pad; const width = r.w*(1-pad*2); const height = r.h*(1-pad*2);
    for(let rr=0; rr<r.rows; rr++){ for(let cc=0; cc<r.cols; cc++){ const cx = left + (cc+0.5)*(width/r.cols); const cy = top + (rr+0.5)*(height/r.rows); const leftPct = Number(((cx/iw)*100).toFixed(2)); const topPct = Number(((cy/ih)*100).toFixed(2)); const id = generateNextId(); const sku = `${r.name||'REG'}-${String(rr+1).padStart(2,'0')}${String(cc+1).padStart(2,'0')}`; db.push({id, sku, name:'', qty:0, coords:{left:leftPct, top:topPct}, regionId: r.id}); } }
    saveDB(); renderMarkers(); showToast('Generated markers from region ' + (r.name||r.id)); }

  function generateNextId(){ const existing = db.map(d=>d.id).filter(Boolean); let n = existing.length + 1; while(existing.includes(`L-${String(n).padStart(3,'0')}`)) n++; return `L-${String(n).padStart(3,'0')}`; }

  function openEdit(id){ const it = db.find(d=>d.id===id); selected = it||null; if(selected){ fieldLocationId.value=selected.id; fieldSKU.value=selected.sku||''; fieldName.value=selected.name||''; fieldQty.value=selected.qty||0; deleteBtn.style.display='inline-block'; } else { fieldLocationId.value=''; fieldSKU.value=''; fieldName.value=''; fieldQty.value=0; deleteBtn.style.display='none'; } editModal.setAttribute('aria-hidden','false'); }
  function closeEditModal(){ editModal.setAttribute('aria-hidden','true'); selected=null; }
  closeEdit.addEventListener('click', closeEditModal);

  editForm.addEventListener('submit', e=>{ e.preventDefault(); const locId = fieldLocationId.value.trim(); const sku = fieldSKU.value.trim(); const name = fieldName.value.trim(); const qty = Number(fieldQty.value)||0; if(!locId){ showToast('Location ID required'); return; } if(selected){ selected.id=locId; selected.sku=sku; selected.name=name; selected.qty=qty; } else { db.push({id:locId, sku, name, qty, coords:{left:50,top:50}}); } saveDB(); renderMarkers(); closeEditModal(); showToast('Saved'); });
  deleteBtn.addEventListener('click', ()=>{ if(!selected) return; if(!confirm('Delete location?')) return; db = db.filter(d=>d.id!==selected.id); saveDB(); renderMarkers(); closeEditModal(); showToast('Deleted'); });

  // Draw region
  function startDrawing(e){ drawing=true; const rect = mapInner.getBoundingClientRect(); drawStart = {x: e.clientX - rect.left, y: e.clientY - rect.top}; if(!currentRect){ currentRect = document.createElement('div'); currentRect.className='drawing-rect'; gridOverlay.appendChild(currentRect); } }
  function updateDrawing(e){ if(!drawing) return; const rect = mapInner.getBoundingClientRect(); const x = e.clientX - rect.left; const y = e.clientY - rect.top; const left = Math.min(drawStart.x, x); const top = Math.min(drawStart.y, y); const w = Math.abs(x - drawStart.x); const h = Math.abs(y - drawStart.y); currentRect.style.left = left + 'px'; currentRect.style.top = top + 'px'; currentRect.style.width = w + 'px'; currentRect.style.height = h + 'px'; }
  function finishDrawing(e){ if(!drawing) return; drawing=false; const rect = mapInner.getBoundingClientRect(); const x = parseFloat(currentRect.style.left); const y = parseFloat(currentRect.style.top); const w = parseFloat(currentRect.style.width); const h = parseFloat(currentRect.style.height); // open modal to input rows/cols
    gridModal.setAttribute('aria-hidden','false'); regionNameIn.value=''; gridRowsIn.value=4; gridColsIn.value=10; gridPaddingIn.value=2; // store rect in temp
    gridModal._tempRect = {x,y,w,h}; }

  defineGridBtn && defineGridBtn.addEventListener('click', ()=>{ showToast('Draw rectangle on map to define grid'); // enable drawing handlers temporarily
    mapInner.style.cursor='crosshair'; mapInner.addEventListener('mousedown', startDrawing); window.addEventListener('mousemove', updateDrawing); window.addEventListener('mouseup', finishDrawing, {once:true}); });
  closeGrid.addEventListener('click', ()=>{ gridModal.setAttribute('aria-hidden','true'); if(currentRect){ currentRect.remove(); currentRect=null; } mapInner.style.cursor=''; mapInner.removeEventListener('mousedown', startDrawing); window.removeEventListener('mousemove', updateDrawing); });
  cancelGrid.addEventListener('click', ()=>{ gridModal.setAttribute('aria-hidden','true'); if(currentRect){ currentRect.remove(); currentRect=null; } mapInner.style.cursor=''; mapInner.removeEventListener('mousedown', startDrawing); window.removeEventListener('mousemove', updateDrawing); });

  gridForm.addEventListener('submit', e=>{ e.preventDefault(); const rows = Number(gridRowsIn.value)||1; const cols = Number(gridColsIn.value)||1; const padding = Number(gridPaddingIn.value)||0; const name = regionNameIn.value || ('Region '+(regions.length+1)); const rect = gridModal._tempRect; if(!rect){ showToast('No rectangle defined'); return; } const id = 'reg_'+Date.now(); const region = {id, name, x:rect.x, y:rect.y, w:rect.w, h:rect.h, rows, cols, padding}; regions.push(region); saveRegions(); renderRegions(); // cleanup
    gridModal.setAttribute('aria-hidden','true'); if(currentRect){ currentRect.remove(); currentRect=null; } mapInner.style.cursor=''; mapInner.removeEventListener('mousedown', startDrawing); window.removeEventListener('mousemove', updateDrawing); // generate markers
    generateFromRegion(region);
  });

  // helper highlight
  function revealHighlight(id){ clearHighlights(); const el = markerEls.get(id); if(el) el.classList.add('highlight'); }
  function clearHighlights(){ markerEls.forEach(el=>el.classList.remove('highlight','blink')); }

  // search
  function doSearch(q){ const ql = (q||'').trim().toLowerCase(); if(!ql){ matchesEl.innerHTML=''; clearHighlights(); showDetail(null); return; } const results = db.filter(it=> (it.sku && it.sku.toLowerCase().includes(ql)) || (it.id && it.id.toLowerCase().includes(ql))); matchesEl.innerHTML=''; if(results.length===0){ matchesEl.innerHTML='<div class="match-item">No matches</div>'; } else results.forEach(it=>{ const div=document.createElement('div'); div.className='match-item'; div.innerHTML = `<div><strong>${it.sku}</strong><div style="font-size:12px;color:var(--muted)">${it.id} • ${it.name}</div></div><div><button data-id="${it.id}" class="goto">Show</button></div>`; matchesEl.appendChild(div); div.querySelector('.goto').addEventListener('click', ()=>{ openEdit(it.id); centerOn(it); }); }); highlightMatches(results.map(r=>r.id)); if(results[0]){ openEdit(results[0].id); centerOn(results[0]); } }
  searchBtn.addEventListener('click', ()=>doSearch(searchInput.value)); searchInput.addEventListener('keydown', e=>{ if(e.key==='Enter') doSearch(searchInput.value); }); clearSearchBtn.addEventListener('click', ()=>{ searchInput.value=''; doSearch(''); });

  function highlightMatches(ids){ clearHighlights(); ids.forEach(id=>{ const el = markerEls.get(id); if(el) el.classList.add('highlight','blink'); }); }

  // pan/zoom basic
  let scale=1, tx=0, ty=0, panning=false, startPan=null, originPan=null;
  const viewport = document.getElementById('viewport');
  function applyTransform(){ mapInner.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`; }
  viewport.addEventListener('wheel', e=>{ e.preventDefault(); const delta=-e.deltaY; const factor = delta>0?1.08:0.92; const rect = viewport.getBoundingClientRect(); const cx=e.clientX-rect.left; const cy=e.clientY-rect.top; const wx=(cx - tx)/scale; const wy=(cy - ty)/scale; scale = Math.min(8, Math.max(0.35, scale*factor)); tx = cx - wx*scale; ty = cy - wy*scale; applyTransform(); }, {passive:false});
  viewport.addEventListener('mousedown', e=>{ panning=true; startPan={x:e.clientX,y:e.clientY}; originPan={x:tx,y:ty}; viewport.style.cursor='grabbing'; });
  window.addEventListener('mousemove', e=>{ if(!panning) return; tx = originPan.x + (e.clientX - startPan.x); ty = originPan.y + (e.clientY - startPan.y); applyTransform(); });
  window.addEventListener('mouseup', ()=>{ panning=false; viewport.style.cursor=''; });

  document.getElementById('zoomInBtn').addEventListener('click', ()=>{ const vp=viewport.getBoundingClientRect(); const cx=vp.width/2, cy=vp.height/2; const wx=(cx - tx)/scale, wy=(cy - ty)/scale; scale=Math.min(8, scale*1.2); tx = cx - wx*scale; ty = cy - wy*scale; applyTransform(); });
  document.getElementById('zoomOutBtn').addEventListener('click', ()=>{ const vp=viewport.getBoundingClientRect(); const cx=vp.width/2, cy=vp.height/2; const wx=(cx - tx)/scale, wy=(cy - ty)/scale; scale=Math.max(0.35, scale/1.2); tx=cx - wx*scale; ty=cy - wy*scale; applyTransform(); });
  document.getElementById('fitBtn').addEventListener('click', ()=>{ const iw = floorplan.naturalWidth || floorplan.width || 2000; const ih = floorplan.naturalHeight || floorplan.height || 1200; mapInner.style.width = iw+'px'; mapInner.style.height = ih+'px'; const vp=viewport.getBoundingClientRect(); const sx=vp.width/iw, sy=vp.height/ih; const base = Math.min(sx,sy)*0.96; scale=Math.min(8, Math.max(0.35, base*1.35)); tx=(vp.width - iw*scale)/2; ty=(vp.height - ih*scale)/2; applyTransform(); });

  // import/export
  exportBtn.addEventListener('click', ()=>{ const payload={exportedAt:new Date().toISOString(), items: db, regions}; const blob=new Blob([JSON.stringify(payload,null,2)], {type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`warehouse-export-${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.json`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); });
  importInput.addEventListener('change', e=>{ const f=e.target.files[0]; if(!f) return; const reader = new FileReader(); reader.onload = ev=>{ try{ const parsed = JSON.parse(ev.target.result); const items = parsed && Array.isArray(parsed.items) ? parsed.items : (Array.isArray(parsed) ? parsed : null); const regs = parsed && Array.isArray(parsed.regions) ? parsed.regions : (parsed.regions ? parsed.regions : []); if(!items) { showToast('Invalid import file'); return; } if(confirm('Replace current DB? OK=replace, Cancel=merge')) db = items; else { const byId=new Map(db.map(i=>[i.id,i])); items.forEach(it=>byId.set(it.id,it)); db = Array.from(byId.values()); } if(Array.isArray(regs)) { regions = regs; saveRegions(); } saveDB(); renderRegions(); renderMarkers(); showToast('Import complete'); }catch(err){ console.error(err); showToast('Failed parse JSON'); } }; reader.readAsText(f); importInput.value=''; });

  // reset
  resetBtn.addEventListener('click', ()=>{ if(!confirm('Replace DB with sample?')) return; db = createSampleData(); regions=[]; saveDB(); saveRegions(); renderMarkers(); renderRegions(); showToast('Reset'); });

  // initial
  function init(){ seedIfEmpty(); renderRegions(); renderMarkers(); document.body.addEventListener('click', ()=>{ clearHighlights(); }); if(db.length) document.getElementById('fitBtn').click(); }

  init();

  // expose
  window.WarehouseLocator = { getDB: ()=>db, renderMarkers, renderRegions };

})();
