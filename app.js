/* Warehouse Locator - app.js (fixed)
   - Dot-per-cell markers on top of warehouse-layout.png
   - LocalStorage DB, seed 200 items if empty
   - Add/Edit locations, Search SKU/ID, Highlight & Blink
   - Zoom & pan with mapInner transform, markers positioned in image pixels
   - QR scan (jsQR) and QR generator (qrcode)
   - Import/Export JSON
*/

(function(){
  const DB_KEY = 'warehouse_locator_db_v1';
  const PREF_KEY = 'warehouse_locator_prefs_v1';
  const SAMPLE_COUNT = 200;

  // DOM
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
  const viewport = document.getElementById('viewport');
  const mapInner = document.getElementById('mapInner');
  const floorplan = document.getElementById('floorplan');

  const editModal = document.getElementById('editModal');
  const closeEdit = document.getElementById('closeEdit');
  const editForm = document.getElementById('editForm');
  const fieldLocationId = document.getElementById('fieldLocationId');
  const fieldSKU = document.getElementById('fieldSKU');
  const fieldName = document.getElementById('fieldName');
  const fieldQty = document.getElementById('fieldQty');
  const deleteBtn = document.getElementById('deleteBtn');

  const qrScannerModal = document.getElementById('qrScannerModal');
  const video = document.getElementById('video');
  const scanCanvas = document.getElementById('scanCanvas');
  const scanStatus = document.getElementById('scanStatus');
  const closeScanner = document.getElementById('closeScanner');

  const qrGenModal = document.getElementById('qrGenModal');
  const closeQrGen = document.getElementById('closeQrGen');
  const qrText = document.getElementById('qrText');
  const generateQrBtn = document.getElementById('generateQrBtn');
  const downloadQrBtn = document.getElementById('downloadQrBtn');
  const qrcodeContainer = document.getElementById('qrcode');

  const zoomInBtn = document.getElementById('zoomInBtn');
  const zoomOutBtn = document.getElementById('zoomOutBtn');
  const fitBtn = document.getElementById('fitBtn');

  const toast = document.getElementById('toast');

  // State
  let db = [];
  let selected = null;
  let addMode = false;
  let markerEls = new Map();

  // Transform / pan state
  let scale = 1;
  let translateX = 0;
  let translateY = 0;
  let isPanning = false;
  let panStart = {x:0,y:0};
  let panOrigin = {x:0,y:0};

  // Scanner
  let stream = null;
  let scanning = false;
  let rafId = null;

  function showToast(msg, t=2000){
    if(!toast) return;
    toast.textContent = msg; toast.style.display='block';
    setTimeout(()=>{ toast.style.display='none'; }, t);
  }

  function saveDB(){ localStorage.setItem(DB_KEY, JSON.stringify({items: db, savedAt: Date.now()})); }
  function loadDB(){
    try{ const raw = localStorage.getItem(DB_KEY); if(!raw) return null; const p = JSON.parse(raw); if(p && Array.isArray(p.items)) return p.items; if(Array.isArray(p)) return p; }catch(e){console.error(e);} return null;
  }

  function createSampleData(){
    const items = [];
    const cols = 20, rows = 10; let i=0;
    for(let r=0;r<rows && i<SAMPLE_COUNT; r++){
      for(let c=0;c<cols && i<SAMPLE_COUNT; c++){
        i++;
        const id = `L-${String(i).padStart(3,'0')}`;
        const sku = `SKU-${String(i).padStart(4,'0')}`;
        const name = `Product ${i}`;
        const qty = Math.floor(Math.random()*200)+1;
        const left = 6 + (c + 0.5) * (88/cols);
        const top  = 6 + (r + 0.5) * (88/rows);
        items.push({id, sku, name, qty, coords:{left: Number(left.toFixed(2)), top: Number(top.toFixed(2))}});
      }
    }
    return items;
  }

  function seedIfEmpty(){ const loaded = loadDB(); if(!loaded || loaded.length===0){ db = createSampleData(); saveDB(); showToast('Seeded sample data (200 locations)'); } else db = loaded; }

  function updateMapInnerSize(){
    const iw = floorplan.naturalWidth || floorplan.width || 2000;
    const ih = floorplan.naturalHeight || floorplan.height || 1200;
    mapInner.style.width = iw + 'px'; mapInner.style.height = ih + 'px';
    markersEl.style.width = iw + 'px'; markersEl.style.height = ih + 'px';
  }

  function clearMarkers(){ markersEl.innerHTML=''; markerEls.clear(); }

  function renderMarkers(){
    clearMarkers(); updateMapInnerSize();
    const iw = parseFloat(mapInner.style.width); const ih = parseFloat(mapInner.style.height);
    db.forEach(item=>{
      if(!item.coords || typeof item.coords.left !== 'number' || typeof item.coords.top !== 'number') return;
      if(item.coords.left < 0 || item.coords.left > 100 || item.coords.top < 0 || item.coords.top > 100) return;
      const x = (item.coords.left/100)*iw; const y = (item.coords.top/100)*ih;
      const el = document.createElement('div');
      el.className = 'marker'; el.dataset.id = item.id;
      el.title = `${item.id} • ${item.sku} • ${item.name} • Qty:${item.qty}`;
      el.style.left = x + 'px'; el.style.top = y + 'px';
      el.addEventListener('click', ev=>{ ev.stopPropagation(); openEdit(item.id); highlightMatches([item.id]); });
      el.addEventListener('mouseenter', ()=>{ /* noop, CSS title used */ });
      markersEl.appendChild(el); markerEls.set(item.id, el);
    });
  }

  function renderMatches(list){ matchesEl.innerHTML = ''; if(!list || !list.length){ matchesEl.innerHTML = '<div class="match-item">No matches</div>'; return;} list.forEach(it=>{ const div = document.createElement('div'); div.className='match-item'; div.innerHTML = `<div><strong>${it.sku}</strong><div style="font-size:12px;color:var(--muted)">${it.id} • ${it.name}</div></div><div><button data-id="${it.id}" class="goto">Show</button></div>`; matchesEl.appendChild(div); div.querySelector('.goto').addEventListener('click', ()=>{ openEdit(it.id); centerOn(it); }); }); }

  function showDetail(item){ if(!item){ detailEl.innerHTML='Click a marker to view or edit a location.'; return; } detailEl.innerHTML = `<div><strong>${item.id}</strong></div><div style="font-size:13px;color:var(--muted)">${item.sku} • ${item.name}</div><div style="margin-top:8px">Quantity: <strong>${item.qty}</strong></div><div style="margin-top:8px">Coords: ${item.coords.left}% , ${item.coords.top}%</div><div style="margin-top:8px"><button id="detailEdit">Edit</button></div>`; const btn = detailEl.querySelector('#detailEdit'); if(btn) btn.addEventListener('click', ()=>openEdit(item.id)); }

  function openEdit(id){ const it = db.find(d=>d.id===id); selected = it || null; if(selected){ fieldLocationId.value = selected.id; fieldSKU.value = selected.sku || ''; fieldName.value = selected.name || ''; fieldQty.value = selected.qty || 0; deleteBtn.style.display = 'inline-block'; } else { fieldLocationId.value=''; fieldSKU.value=''; fieldName.value=''; fieldQty.value=0; deleteBtn.style.display='none'; } editModal.setAttribute('aria-hidden','false'); }
  function closeEditModal(){ editModal.setAttribute('aria-hidden','true'); selected = null; }
  closeEdit.addEventListener('click', closeEditModal);

  editForm.addEventListener('submit', e=>{ e.preventDefault(); const locId = fieldLocationId.value.trim(); const sku = fieldSKU.value.trim(); const name = fieldName.value.trim(); const qty = Number(fieldQty.value) || 0; if(!locId || !sku){ showToast('Location ID & SKU required'); return; } if(selected){ selected.id = locId; selected.sku = sku; selected.name = name; selected.qty = qty; } else { db.push({ id: locId, sku, name, qty, coords:{left:50, top:50} }); } saveDB(); renderMarkers(); closeEditModal(); showToast('Saved'); });

  deleteBtn.addEventListener('click', ()=>{ if(!selected) return; if(!confirm('Delete location?')) return; db = db.filter(d=>d.id !== selected.id); saveDB(); renderMarkers(); closeEditModal(); showToast('Deleted'); });

  addModeBtn.addEventListener('click', ()=>{ addMode = !addMode; addModeBtn.style.background = addMode ? 'var(--accent)' : ''; addModeBtn.style.color = addMode ? '#fff' : ''; showToast(addMode ? 'Add mode ON: click on the map image to add a location' : 'Add mode OFF'); });

  mapInner.addEventListener('click', ev=>{
    if(!addMode) return; ev.stopPropagation();
    const vpRect = viewport.getBoundingClientRect(); const clickX = ev.clientX - vpRect.left; const clickY = ev.clientY - vpRect.top;
    const imgX = (clickX - translateX)/scale; const imgY = (clickY - translateY)/scale; const iw = parseFloat(mapInner.style.width); const ih = parseFloat(mapInner.style.height);
    const leftPercent = Math.min(99.99, Math.max(0.01, (imgX/iw)*100));
    const topPercent  = Math.min(99.99, Math.max(0.01, (imgY/ih)*100));
    const newId = generateNextId(); const newItem = { id:newId, sku:`SKU-${String(Math.floor(Math.random()*9999)+1).padStart(4,'0')}`, name:'', qty:0, coords:{left: Number(leftPercent.toFixed(2)), top: Number(topPercent.toFixed(2))} };
    db.push(newItem); saveDB(); renderMarkers(); openEdit(newId); addMode = false; addModeBtn.style.background = '';
  });

  function generateNextId(){ const existing = db.map(d=>d.id).filter(Boolean); let n = existing.length + 1; while(existing.includes(`L-${String(n).padStart(3,'0')}`)) n++; return `L-${String(n).padStart(3,'0')}`; }

  function doSearch(q){ const ql = (q||'').trim().toLowerCase(); if(!ql){ renderMatches([]); clearHighlights(); showDetail(null); return; } const results = db.filter(it=> (it.sku && it.sku.toLowerCase().includes(ql)) || (it.id && it.id.toLowerCase().includes(ql)) ); renderMatches(results); highlightMatches(results.map(r=>r.id)); if(results.length){ showDetail(results[0]); centerOn(results[0]); } else showDetail(null); }
  searchBtn.addEventListener('click', ()=>doSearch(searchInput.value)); searchInput.addEventListener('keydown', e=>{ if(e.key==='Enter') doSearch(searchInput.value); }); clearSearchBtn.addEventListener('click', ()=>{ searchInput.value=''; doSearch(''); });

  function clearHighlights(){ markerEls.forEach(el=>{ el.classList.remove('highlight','blink'); }); }
  function highlightMatches(ids){ clearHighlights(); ids.forEach(id=>{ const el = markerEls.get(id); if(el) el.classList.add('highlight','blink'); }); }

  function centerOn(item){ if(!item) return; const iw = parseFloat(mapInner.style.width); const ih = parseFloat(mapInner.style.height); const targetX = (item.coords.left/100)*iw; const targetY = (item.coords.top/100)*ih; const vp = viewport.getBoundingClientRect(); const cx = vp.width/2; const cy = vp.height/2; translateX = cx - targetX*scale; translateY = cy - targetY*scale; applyTransform(); }

  function applyTransform(){ mapInner.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`; }

  // wheel zoom
  viewport.addEventListener('wheel', e=>{ e.preventDefault(); const delta = -e.deltaY; const zoomFactor = delta>0?1.08:0.92; const rect = viewport.getBoundingClientRect(); const cx = e.clientX - rect.left; const cy = e.clientY - rect.top; const wx = (cx - translateX)/scale; const wy = (cy - translateY)/scale; scale = Math.min(8, Math.max(0.35, scale * zoomFactor)); translateX = cx - wx*scale; translateY = cy - wy*scale; applyTransform(); }, {passive:false});

  // pan mouse
  viewport.addEventListener('mousedown', e=>{ isPanning=true; panStart={x:e.clientX,y:e.clientY}; panOrigin={x:translateX,y:translateY}; viewport.style.cursor='grabbing'; });
  window.addEventListener('mousemove', e=>{ if(!isPanning) return; const dx = e.clientX - panStart.x; const dy = e.clientY - panStart.y; translateX = panOrigin.x + dx; translateY = panOrigin.y + dy; applyTransform(); });
  window.addEventListener('mouseup', ()=>{ if(!isPanning) return; isPanning=false; viewport.style.cursor=''; });

  // touch pan/pinch
  let lastTouchDist = null;
  viewport.addEventListener('touchstart', e=>{ if(e.touches.length===1){ isPanning=true; panStart={x:e.touches[0].clientX,y:e.touches[0].clientY}; panOrigin={x:translateX,y:translateY}; } if(e.touches.length===2) lastTouchDist = getTouchDist(e.touches); }, {passive:false});
  viewport.addEventListener('touchmove', e=>{ if(e.touches.length===1 && isPanning){ const dx = e.touches[0].clientX - panStart.x; const dy = e.touches[0].clientY - panStart.y; translateX = panOrigin.x + dx; translateY = panOrigin.y + dy; applyTransform(); } else if(e.touches.length===2){ const dist = getTouchDist(e.touches); if(lastTouchDist){ const factor = dist/lastTouchDist; const rect = viewport.getBoundingClientRect(); const cx = (e.touches[0].clientX + e.touches[1].clientX)/2 - rect.left; const cy = (e.touches[0].clientY + e.touches[1].clientY)/2 - rect.top; const wx = (cx - translateX)/scale; const wy = (cy - translateY)/scale; scale = Math.min(8, Math.max(0.35, scale * factor)); translateX = cx - wx*scale; translateY = cy - wy*scale; applyTransform(); } lastTouchDist = dist; } e.preventDefault(); }, {passive:false});
  window.addEventListener('touchend', e=>{ if(e.touches.length<2) lastTouchDist = null; if(e.touches.length===0) isPanning=false; });
  function getTouchDist(t){ const dx = t[0].clientX - t[1].clientX; const dy = t[0].clientY - t[1].clientY; return Math.sqrt(dx*dx+dy*dy); }

  zoomInBtn && zoomInBtn.addEventListener('click', ()=>{ const vp = viewport.getBoundingClientRect(); const cx = vp.width/2; const cy = vp.height/2; const wx = (cx - translateX)/scale; const wy = (cy - translateY)/scale; scale = Math.min(8, scale*1.2); translateX = cx - wx*scale; translateY = cy - wy*scale; applyTransform(); });
  zoomOutBtn && zoomOutBtn.addEventListener('click', ()=>{ const vp = viewport.getBoundingClientRect(); const cx = vp.width/2; const cy = vp.height/2; const wx = (cx - translateX)/scale; const wy = (cy - translateY)/scale; scale = Math.max(0.35, scale/1.2); translateX = cx - wx*scale; translateY = cy - wy*scale; applyTransform(); });
  fitBtn && fitBtn.addEventListener('click', fitToViewport);

  function fitToViewport(){ updateMapInnerSize(); const vp = viewport.getBoundingClientRect(); const iw = parseFloat(mapInner.style.width); const ih = parseFloat(mapInner.style.height); if(!iw||!ih) return; const sx = vp.width/iw; const sy = vp.height/ih; const base = Math.min(sx,sy)*0.96; scale = Math.min(8, Math.max(0.35, base*1.35)); translateX = (vp.width - iw*scale)/2; translateY = (vp.height - ih*scale)/2; applyTransform(); }

  // import/export
  exportBtn.addEventListener('click', ()=>{ const payload = {exportedAt: new Date().toISOString(), items: db}; const blob = new Blob([JSON.stringify(payload, null, 2)], {type:'application/json'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `warehouse-export-${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.json`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); });

  importInput.addEventListener('change', e=>{ const file = e.target.files[0]; if(!file) return; const reader = new FileReader(); reader.onload = ev=>{ try{ const parsed = JSON.parse(ev.target.result); const items = parsed && Array.isArray(parsed.items) ? parsed.items : Array.isArray(parsed) ? parsed : null; if(!items){ showToast('Invalid import file'); return; } if(confirm('Replace current database? OK = replace, Cancel = merge')) db = items; else{ const byId = new Map(db.map(i=>[i.id,i])); items.forEach(it=>byId.set(it.id,it)); db = Array.from(byId.values()); } saveDB(); renderMarkers(); showToast('Import complete'); }catch(err){ console.error(err); showToast('Failed to parse JSON'); } }; reader.readAsText(file); importInput.value=''; });

  // QR scanner
  qrScanBtn.addEventListener('click', startScanner); closeScanner.addEventListener('click', stopScanner);
  async function startScanner(){ qrScannerModal.setAttribute('aria-hidden','false'); scanStatus.textContent='Initializing camera...'; try{ stream = await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}, audio:false}); video.srcObject = stream; await video.play(); scanning = true; scanStatus.textContent='Scanning...'; tickScan(); }catch(err){ console.error(err); scanStatus.textContent='Camera unavailable'; showToast('Camera permission denied or unavailable'); } }
  function stopScanner(){ qrScannerModal.setAttribute('aria-hidden','true'); scanning=false; if(rafId) cancelAnimationFrame(rafId); if(stream){ stream.getTracks().forEach(t=>t.stop()); stream=null; } video.srcObject = null; }
  function tickScan(){ if(!scanning) return; const canvas = scanCanvas; const ctx = canvas.getContext('2d'); const vw = video.videoWidth; const vh = video.videoHeight; if(vw && vh){ canvas.width = vw; canvas.height = vh; ctx.drawImage(video,0,0,vw,vh); const imageData = ctx.getImageData(0,0,vw,vh); const code = window.jsQR ? jsQR(imageData.data, imageData.width, imageData.height) : null; if(code){ handleScanned(code.data); stopScanner(); return; } } rafId = requestAnimationFrame(tickScan); }
  function handleScanned(data){ let parsed=null; try{ parsed = JSON.parse(data); }catch(e){} let sku = parsed && parsed.sku ? parsed.sku : String(parsed||data); const results = db.filter(it=> it.sku && it.sku.toLowerCase() === sku.toLowerCase()); if(results.length){ highlightMatches(results.map(r=>r.id)); openEdit(results[0].id); centerOn(results[0]); showToast('Found item: '+results[0].sku); } else { showToast('No matching SKU in DB'); if(confirm(`Scanned: ${data}\nCopy to clipboard?`)) navigator.clipboard.writeText(data); } }

  // QR generator
  qrGenBtn.addEventListener('click', ()=>{ qrGenModal.setAttribute('aria-hidden','false'); qrcodeContainer.innerHTML=''; qrText.value=''; }); closeQrGen.addEventListener('click', ()=>{ qrGenModal.setAttribute('aria-hidden','true'); qrcodeContainer.innerHTML=''; });
  generateQrBtn.addEventListener('click', ()=>{ const text = qrText.value.trim(); if(!text) return showToast('Enter text or SKU'); qrcodeContainer.innerHTML=''; QRCode.toCanvas(document.createElement('canvas'), text, {width:220}, (err, canvas)=>{ if(err){ console.error(err); showToast('Failed to generate QR'); return; } qrcodeContainer.appendChild(canvas); }); });
  downloadQrBtn.addEventListener('click', ()=>{ const canvas = qrcodeContainer.querySelector('canvas'); if(!canvas) return showToast('Generate first'); const url = canvas.toDataURL('image/png'); const a = document.createElement('a'); a.href = url; a.download = 'qr.png'; a.click(); });

  // Reset
  resetBtn.addEventListener('click', ()=>{ if(!confirm('Replace database with sample seed?')) return; db = createSampleData(); saveDB(); renderMarkers(); showToast('Reset to sample seed'); });

  // Close modals on backdrop
  document.querySelectorAll('.modal').forEach(m=>{ m.addEventListener('click', e=>{ if(e.target.classList.contains('modal-backdrop')) m.setAttribute('aria-hidden','true'); }); });

  function fitOnLoad(){ if(!floorplan.complete){ floorplan.addEventListener('load', ()=>{ updateMapInnerSize(); fitToViewport(); renderMarkers(); }); } else { updateMapInnerSize(); fitToViewport(); renderMarkers(); } }

  function init(){ seedIfEmpty(); fitOnLoad(); applyTransform(); document.body.addEventListener('click', ()=>{ clearHighlights(); showDetail(null); }); renderMarkers(); if(db.length) centerOn(db[Math.floor(db.length/2)]); window.addEventListener('resize', ()=>{ fitToViewport(); }); }

  init();

  // Expose for debug
  window.WarehouseLocator = { getDB: ()=>db, saveDB, renderMarkers, highlight: highlightMatches };

})();
