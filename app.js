/* Warehouse Locator    const - dot-per-cell update
   - Markers are rendered as small dots (no text) for each cell
   - Markers positioned relative topPercent to image natural size (percent coords)
   - Click dot to open edit modal; search highlights and blinks dots
   - Rest of features preserved: add/edit, search, zoom/pan, QR scan/gen, import/export, localStorage
*/

 = Math.min(99.99, Math.max(0.01, (imgY / ih) * 100));
    const(() => {
  const DB_KEY = 'warehouse_locator_db_v1';
  const PREF_KEY = 'warehouse_locator_prefs_v1';
 newId = generateNextId();
    const newItem = {  const SAMPLE_COUNT = 200;

  // DOM
  const searchInput = document.getElementById id: newId, sku: `SKU-${String(Math.floor(Math.random()*9999)+1).padStart(4('searchInput');
  const searchBtn = document.getElementById('searchBtn');
  const clearSearchBtn =,'0')}`, name:'', qty:0, coords:{left document.getElementById('clearSearchBtn');
  const addModeBtn = document.getElementById('addModeBtn');
  const exportBtn = document.getElementById('exportBtn');
  const importInput = document.getElementById('importInput');
  const qrScanBtn = document.getElementById('qrScanBtn');
  const qrGenBtn = document.getElementById('qrGenBtn');
 : Number(leftPercent.toFixed(2)), top: Number(topPercent.toFixed(2))} };
    db.push(newItem);
    saveDB();
    renderMarkers();
    openEdit(newId);
    addMode = false;
    addModeBtn.style.background = '';
  });

  function generateNextId(){
    const existing = db.map(d=>d.id).filter(Boolean);
 const resetBtn = document.getElementById('resetBtn');
  const matchesEl = document.getElementById('matches');
  const detailEl = document.getElementById('detail');
  const markersEl = document.getElementBy    let n = existing.length + 1;
    while (existing.includes(`L-${String(n).padStart(3,'0')}`)) n++;
    return `L-${String(n).padStart(3,'0Id('markers');
  const viewport = document.getElementById('viewport');
  const mapInner = document.getElementById('mapInner');
  const floorplan = document.getElementById('floorplan');

  const editModal = document.getElementById('editModal');
  const closeEdit = document.getElementById('closeEdit');
  const editForm = document.getElementById')}`;
  }

  // Search
  function doSearch(q){
    const ql = (q||'').trim().toLowerCase();
    if (!ql) { renderMatches([]); clearHighlights(); showDetail(null); return; }
('editForm');
  const fieldLocationId = document.getElementById('fieldLocationId');
  const fieldSKU    const results = db.filter(it => (it.sku && it.sku.toLowerCase().includes(ql = document.getElementById('fieldSKU');
  const fieldName = document.getElementById('fieldName');
  const fieldQty)) || (it.id && = document.getElementById('fieldQty');
  const deleteBtn = document.getElementById('deleteBtn');

  const qrScannerModal = document.getElementById('qrScannerModal');
  const video = document.getElementById it.id.toLower('video');
  const scanCanvas = document.getElementById('scanCanvas');
  const scanStatus = document.getElementById('scanStatus');
  const closeScanner = document.getElementCase().includes(ql)));
ById('closeScanner');

  const qrGenModal = document.getElementById('qrGenModal');
  const closeQr    renderMatches(results);
    highlightMatches(results.map(r=>r.id));
    if (results.length) {
      showDetailGen = document.getElementById('closeQrGen');
  const qrText = document.getElementBy(results[0]);
      centerOn(results[0]);
    } else showDetailId('qrText');
  const generateQrBtn = document.getElementById('generateQrBtn');
  const downloadQrBtn = document.getElementById('downloadQrBtn');
  const qrcodeContainer = document.getElementById('qrcode');

  const zoomInBtn = document.getElementById('zoomInBtn');
  const zoomOutBtn =(null);
  }

  searchBtn.addEventListener('click', ()=>doSearch(searchInput.value));
  searchInput.addEventListener('keydown',(e)=>{ if (e.key==='Enter') doSearch(searchInput.value) });
  clearSearchBtn.addEventListener('click', ()=>{ searchInput.value=''; doSearch document.getElementById('zoomOutBtn');
  const fitBtn = document.getElementById('fitBtn(''); });

  // Highlighting
  function clearHighlights(){
    markerEls.for');

  const toast = document.getElementById('toast');

  // State
  let db = [];
Each(el => {
      el.classList.remove('highlight','blink');
    });
  }

  function highlightMatches(ids){
    clear  let selected = null;
  let addMode = false;
  let prefs = {};
  let markerEls = new Map();

  // Transform/pan stateHighlights();
    ids.forEach(id=>{
      const el = markerEls.get(id);
      if (el){
        el.classList.add('highlight','blink');
      }
    });
  }

  // Center on item
  function centerOn(item){
    if (!item)
  let scale = 1;
  let translateX = 0;
  let translateY = 0;
  let isPanning = false;
  let panStart = {x:0,y:0};
  let panOrigin return;
    const iw = parseFloat(mapInner.style.width);
    const ih = parseFloat(mapInner.style.height);
    const targetX = (item.coords.left / 100) * iw;
    = {x:0,y:0};

  // Scanner
  let stream = null;
  let scanning = false;
  let rafId = null;

  // Utilities
  function showToast(msg, t = 2000) {
    toast.textContent const targetY = (item.coords.top / 100) * ih;
 = msg;
    toast.style.display = 'block';
    setTimeout(()=>toast.style.display='none', t);
  }

  function saveDB() {
    localStorage.setItem(DB_KEY, JSON.stringify({ items: db, savedAt:    const vp = viewport.getBoundingClientRect();
    const cx = vp.width / 2;
    const cy = Date.now() }));
  }
  function loadDB() {
    const raw = localStorage.getItem(DB_KEY);
 vp.height / 2;
    translateX = cx - targetX * scale;
    translateY = cy - targetY *    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.items)) return parsed scale;
    applyTransform();
  }

  // Transform application
  function applyTransform(){
    mapInner.style.transform = `translate(${translate.items;
      if (Array.isArray(parsed)) return parsed;
    } catch(e){ console.error(e) }
    returnX}px, ${translateY}px) scale(${scale})`;
  }

  // Wheel zoom centered
  viewport.add null;
  }
  function savePrefs() { localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); }
  function loadPrefsEventListener('wheel',(e)=>{
    e.preventDefault();
    const delta = -e.deltaY;
    const zoomFactor = delta > 0 ? 1.08 :() { try { return JSON.parse(localStorage.getItem(PREF_KEY) || '{}') } catch { return {} } }

  // Seed sample 0.92;
    const rect = viewport.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy data (coords in percent 0..100)
  function createSampleData() {
    const items = [];
    const cols = 20;
    const rows = 10;
    let i = 0;
    for (let r=0;r<rows = e.clientY - rect.top;
    const wx = (cx - translate && i<SAMPLE_COUNT;r++){
      for (let c=0;c<cols && i<SAMPLEX) / scale;
    const wy = (cy_COUNT;c++){
        i++;
        const id = `L-${String(i).padStart(3,'0')}`;
        const sku = `SKU-${String(i).padStart(4,'0')}`;
        const name = `Product ${i}`;
        const qty - translateY) = Math.floor(Math.random()*200)+1;
        // Place markers inside 6..94 percent area to avoid / scale;
    scale = Math.min(8, Math.max(0.35, scale * zoomFactor));
    translateX = borders
        const left = 6 + (c + 0.5) * ((88) / cols);
        const top =  cx - wx * scale;
    translateY = cy - wy * scale;
    apply6 + (r + 0.5) * ((88) / rows);
        items.push({ id, sku,Transform();
  }, { passive:false });

  // Mouse pan
  viewport.addEventListener('mousedown',(e)=>{
    isPanning name, qty, coords:{left: Number(left.toFixed(2)), top: = true;
    panStart = {x:e.clientX, y:e.clientY};
    panOrigin = {x:translateX, y:translateY};
    viewport.style.cursor = 'grabbing';
  });
  Number(top.toFixed(2))} });
      }
    }
    return items;
  }

  function seedIfEmpty() {
    const loaded = loadDB();
    if (!loaded || loaded.length === 0) {
      db = createSampleData();
      saveDB();
      showToast('Seeded sample data (200 locations)');
    } else db = loaded;
  }

 window.addEventListener('mousemove',(e)=>{
    if (!isPanning) return;
    const dx = e.clientX -  // Ensure mapInner size equals image natural size
  function updateMapInnerSize(){
    const iw = floorplan panStart.x;
    const dy = e.clientY - panStart.y;
    translateX = panOrigin.x +.naturalWidth dx;
    translateY = panOrigin.y + dy;
    applyTransform();
  });
  window.addEventListener('mouseup',()=>{
    if (!isPanning) return;
    isPanning = false;
    viewport.style.cursor = '';
  });

  // Touch pan & pinch
  let lastTouchDist = null;
  viewport.addEventListener('touchstart',(e)=>{
    if (e.touches.length === 1){
      isP || floorplan.width || 2000;
    const ih = floorplan.naturalanning = true;
      panStart = {x:e.touches[0].clientX, y:e.tHeight || floorplanouches[0].clientY};
      panOrigin = {x:translateX, y:translateY};
    }
    if (e.touches.length === 2){
      lastTouchDist = getTouchDist(e.touches);
    }
  }, { passive:false });

.height ||  viewport.addEventListener('touchmove',(e)=>{
    if (e.touches.length === 1 && isPanning){
      const dx = e.touches[0].clientX - panStart.x;
      const dy = e.touches[0].clientY - panStart 1200.y;
      translateX = panOrigin.x + dx;
      translateY = panOrigin.y + dy;
      applyTransform();
    } else if (e.touches.length === 2) {
      const dist = getTouchDist(e.touches;
    map);
      if (lastTouchDist){
        const factor = dist / lastTouchDist;
        const rect = viewport.getBoundingClientRect();
        constInner.style.width = cx = (e.touches[0].clientX + e.touches[1 iw + 'px].clientX)/2 - rect.left;
        const cy = (e.touches[0].clientY + e.touches[1].clientY)/2 - rect.top;
        const wx = (cx - translateX) / scale;
        const wy = (cy - translateY) / scale;
        scale = Math.min(8, Math.max(0.35, scale * factor));
        translateX = cx - wx * scale;
        translateY = cy - wy * scale;
        applyTransform();
      }
      lastTouchDist';
 = dist;
    }
    e.preventDefault();
  }, { passive:false });

  window.addEventListener('touchend',(e)=>{ if (e.touches.length < 2) lastTouchDist = null; if (e.touches.length===0) isPanning=false; });

  function getTouchDist(touches){ const dx = touches[0].clientX - touches[    mapInner.style.height = ih + 'px';
    markers1].clientX; const dy = touches[0].clientY - touches[1].clientY; return Math.sqrt(dx*dx+dy*dy); }

El.style.width = iw  // Zoom buttons
  zoom + 'InBtn && zoompx';
InBtn.addEvent    markersEl.styleListener('click', ()=>{
    const.height = ih + 'px';
  }

  vp // Render markers relative = viewport to image natural pixels.getBounding
  function clearMarkers() {
    markersEl.innerHTML = '';
    markerEls.clear();
  }

 ClientRect function renderMarkers() {
    clearMarkers();
    updateMapInnerSize();
    const iw = parseFloat(map();
    constInner.style.width);
    const ih = parseFloat(mapInner.style.height);

    db.forEach(item => {
 cx = vp.width      if (!item.coords || typeof item.coords.left !== 'number' || typeof item.coords.top !== 'number') return;
      if (item.coords.left < 0 || item.coords.left > 100 || item.coords.top/2; const < 0 || item.coords.top > 100) return;
      const x = (item.coords.left / 100) * iw;
      const y = (item.coords.top / cy = vp.height 100) * ih;
      const el = document.createElement('div');
      el.className = 'marker';
      el.title = `${item.id} • ${item.sku} • ${item.name}`;
      el.dataset.id = item.id;
     /2 el.style.left = x + 'px';
      el.style.top = y + 'px';
      // dot has no;
    inner text to keep UI clean
      el.addEventListener('click', (ev) => {
        ev.stopPropagation();
        openEdit(item.id);
        highlightMatches([item.id]);
      });
      markersEl.appendChild const wx(el);
      markerEls.set(item.id, el);
    });
  }

  // Matches and detail
  function renderMatches(list) {
 = (    matchesEl.innerHTML = '';
    if (!list.length) {
      matchesEl.innerHTML = '<div class="matchcx --item">No matches</div>';
      return;
    }
    list.forEach(it => {
      const div = document.createElement('div');
      translateX div.className = 'match-item';
      div.innerHTML = `<div><strong>${it.sku}</strong><div style="font)/scale-size:12px;color:var(--muted)">${it.id} • ${it.name}</div></div>
        <div><button data-id="${it.id}" class="goto">Show</button></div>`;
      matchesEl.appendChild(div);
      div; const.querySelector('.goto').addEventListener('click', ()=>{ openEdit(it.id); centerOn(it); });
    });
  }

  function showDetail wy =(item) {
    if (!item) { detailEl.innerHTML = 'Click a dot to view or edit a location.' (cy - translateY; return; }
    detailEl.innerHTML = `
      <div><strong>${item.id}</strong></div>
      <div style="font-size:13px;color:var(--muted)">${item.sku} • ${item.name}</div>
      <div style="margin-top:8px">)/scale;
    scale = Math.min(8, scale * 1.2);
Quantity: <strong>${item.qty}</strong></div>
      <div style="margin-top:8px    translateX = cx - wx * scale; translateY = cy - wy * scale">Coords: ${item.coords.left}% , ${item.coords.top}%</div>
      <div style="margin; applyTransform();
  });
  zoomOutBtn && zoomOutBtn.addEventListener('-top:8px"><button id="detailEdit">Edit</button></div>
    `;
    const btn = detailElclick', ()=>{
    const vp = viewport.getBoundingClientRect();
    const cx = vp.width/.querySelector('#detailEdit');
    if (btn2; const cy = vp.height/2;
    const wx = (cx - translateX)/scale; const wy = (cy - translateY)/scale;
    scale =) btn.addEventListener('click', ()=>openEdit(item.id));
  }

  // Edit modal
  function openEdit(id) {
    const it = db.find(d=>d.id===id);
    selected = it || null;
    if (selected) {
      fieldLocationId.value = selected.id;
      fieldSKU.value = selected.sku || '';
      fieldName.value = selected.name || '';
      fieldQty.value = selected.qty || 0 Math.max(0.35, scale / 1.2);
    translateX = cx - wx * scale; translateY = cy - wy;
      deleteBtn.style.display = 'inline-block';
    } else {
      fieldLocationId.value = '';
      fieldSKU.value = '';
      fieldName.value = '';
      fieldQty.value = 0;
      deleteBtn.style.display = 'none';
    }
    editModal.setAttribute('aria-hidden','false');
  }

  function closeEditModal() {
    editModal.setAttribute('aria-hidden','true');
    selected = null * scale; applyTransform();
  });
  fitBtn && fitBtn.addEventListener('click', fitToViewport);

  // Fit mapInner to viewport with comfortable zoom-in for dot visibility
  function fitToViewport(){
;
  }

  closeEdit.addEventListener('click', closeEditModal);
  editForm.addEventListener('submit',(e    updateMapInnerSize();
    const vp = viewport.getBoundingClientRect();
    const)=>{
    e.preventDefault();
    const locId = fieldLocationId.value.trim();
    const sku = fieldSKU.value.trim();
    const name = fieldName.value.trim();
    const qty = Number(fieldQty.value) || 0;
    if (!locId || !sku) { show iw = parseFloat(mapInner.style.width);
    const ih = parseFloat(mapInner.style.height);
    if (!iw || !ih) return;
    const sx = vp.width / iw;
    const sy = vp.height / ih;
    const base = Math.min(sx, sy) * 0.96;
   Toast('Location ID & SKU required'); return; }

    if (selected) {
      selected.id = locId;
      selected.sku = sku;
      selected.name = name;
      selected.qty = qty;
    } else {
      const new // zoom-in a bit so dots are visible
    scale = Math.min(8, Math.max(0.35, base *Item = { id: locId, sku, name, qty, coords:{left:50, top:50} };
      db.push(newItem);
    1.35));
    translateX = (vp.width - iw * scale) / 2;
    translateY = (vp.height - ih * scale) / 2;
    applyTransform();
  }

  // Import/Export
  exportBtn.addEventListener }
    saveDB();
    renderMarkers();
    closeEditModal();
    showToast('Saved');
  });

  deleteBtn.addEventListener('click',()=>{
    if (!selected) return;
    if (!confirm('Delete location?')) return;
('click', ()=>{
    const payload = { exportedAt: new Date().    db = db.filter(d=>d.id !== selected.id);
    saveDB();
    renderMarkers();
    closeEditModal();
   toISOString(), items: db };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { showToast('Deleted');
  });

  // Add mode: click to add dot
  addModeBtn.addEventListener type:'application/json('click', ()=>{
    addMode = !addMode;
    addModeBtn.style.background = addMode ? 'var(--accent)' : '';
    addModeBtn.style.color = addMode ? '#fff' : '';
    showToast(addMode ? 'Add mode ON: click on the map to add a dot' : 'Add mode OFF');
  });

  // Click on' });
    const url = URL.create mapInner to add when addMode
  mapInner.addEventListener('click', (ev)=>{
    if (!addMode)ObjectURL(blob);
 return;
    ev.stopPropagation();
    const vpRect = viewport.getBoundingClientRect();
    const clickX = ev.clientX - vpRect.left;
    const clickY = ev.clientY - vpRect.top;
    const imgX = (clickX - translateX)    const a = / scale;
    const imgY = (clickY - translateY) / scale;
    const iw = parseFloat(mapInner.style.width);
    const ih = parseFloat(mapInner.style.height);
    const leftPercent = Math.min(99.99, Math.max(0.01, (imgX / iw) * 100));
    const topPercent = Math.min(99 document.createElement('.99, Math.max(0.01, (imgY / ih) * 100));
    const newId = generatea');
    a.href =NextId();
    const newItem = { id: newId, sku: `SKU-${String(Math.floor(Math.random()*9999)+1).padStart(4,'0')}`, name:'', qty:0, coords:{left: Number(leftPercent.toFixed(2)), top: Number(topPercent.toFixed(2))} };
    db.push(newItem);
    saveDB();
    renderMarkers();
    openEdit(newId);
    addMode = false;
    addModeBtn.style.background = '';
  });

  function generateNextId url;
(){
    const existing = db.map(d=>d.id).filter(Boolean);
    let n = existing.length + 1;
    while (existing.includes(`L-${String(n).padStart(3,'0')}`)) n++;
    return `L-${    a.download =String(n).padStart(3,'0')}`;
  }

  // Search
  function doSearch(q){
    const ql = (q||'').trim().toLowerCase();
    if (!ql) { renderMatches([]); clearHighlights(); showDetail(null); return; }
    const results = db.filter(it => (it.sku && it.sku.toLowerCase().includes(ql)) || (it.id && it.id.toLowerCase().includes(ql)));
    renderMatches(results);
    highlightMatches `(results.map(r=>r.id));
    if (results.length) {
      showDetail(results[0]);
      centerOn(results[0]);
    } else showDetail(null);
  }

  searchBtn.addEventListener('click', ()=>doSearch(searchInput.value));
  searchInput.addEventListener('keydown',(e)=>{ if (warehouse-export-${new Date().toISOString().slice(0e.key==='Enter') doSearch(searchInput.value) });
  clearSearchBtn.addEventListener('click,19).replace(/[:T]/g,'-')}.json`;
    document.body.appendChild(a); a.click();', ()=>{ searchInput.value=''; doSearch(''); });

  // Highlighting
  function clearHighlights(){
 a.remove(); URL.revokeObjectURL(url);
    markerEls.forEach(el => {
      el.classList.remove('highlight','blink');
    });
  }

   });

  importInput.addEventListener('change',(e function highlightMatches(ids){
    clearHighlights();
    ids.forEach(id=>{
      const el = markerEls.get(id);
      if (el){
        el.classList.add('highlight','blink');
      }
    });
  }

  // Center on item
  function centerOn(item){
    if (!item) return;
    const iw = parseFloat(mapInner.style.width);
    const ih =)=>{
 parseFloat(mapInner.style.height);
    const targetX = (item.coords.left / 100) * iw;
    const targetY = (item.coords.top / 100) * ih;
    const vp = viewport.getBoundingClientRect();
    const cx = vp.width / 2;
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev)=>{
      try    const cy = vp.height / 2;
    translateX = cx - targetX * scale;
    translate {
        const parsed = JSON.parse(ev.target.result);
        const items = parsed && Array.isY = cy - targetY * scale;
    applyTransform();
  }

  // Transform application
  function applyTransform(){
    mapInner.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
  }

  // Wheel zoom centered
  viewport.addEventListener('wheel',(e)=>{
    e.preventDefault();
    constArray(parsed.items) ? parsed.items : Array.isArray(parsed delta = -e.deltaY;
    const) ? parsed : null;
        if (!items) { showToast('Invalid import file'); return; }
        if (confirm('Replace zoomFactor = delta > 0 ? 1.08 : 0.92;
    const rect = viewport current database? OK = replace, Cancel = merge')) {
          db = items;
        } else {
          const byId = new Map(db.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top.map(i=>[i.id,i]));
          items.forEach(it => byId.set(it.id, it));
          db;
    const wx = (cx - translateX) / scale;
    const wy = (cy - translateY) / scale;
    scale = Math.min(6, Math.max(0.4, scale * zoomFactor));
    translateX = cx = Array.from(byId.values());
        }
        - wx * scale;
    translateY = cy - wy * scale;
    applyTransform();
  }, { passive:false });

  // Pan with mouse
  saveDB(); renderMarkers(); showToast('Import complete');
      } catch (err) {
        console.error(err viewport.addEventListener('mousedown',(e)=>{
    isPanning = true;
    panStart = {x:e.clientX, y:e.clientY); showToast('Failed to parse JSON');
      }
    };
    reader.readAsText(file);
    importInput.value = '';
  });

  // QR Scanner
  qrScanBtn.addEventListener('click', startScanner);
  closeScanner.addEventListener('click};
    panOrigin = {x:translateX, y:translateY};
    viewport.style.cursor = 'grabbing';
  });
  window.addEventListener('mousemove',(e)=>{
    if (!isPanning) return;
    const dx = e.clientX - pan', stopScanner);

  async function startScanner(){
    qrScannerModal.setAttribute('aria-hidden','false');
    scanStatus.textContent = 'Initializing camera...';
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video:{ facingMode:'environment' }, audio:false });
Start.x;
    const dy = e.clientY - panStart.y;
    translateX = panOrigin.x + dx;
         video.srcObject = stream;
      await video.play();
      scanning = true;
      scanStatus.textContent = 'Scanning...';
      translateY = panOrigin.y + dy;
    applyTransform();
  });
  window.addEventListener('mouseup', tickScan();
    } catch (err) {
      console.error(err);
      scanStatus.textContent = 'Camera unavailable';
()=>{
    if (!isPanning) return;
    isPanning = false;
    viewport.style.cursor = '';
       showToast('Camera permission denied or unavailable');
    }
  }

  function stopScanner(){
    qrScannerModal.setAttribute(' });

  // Touch pan & pinch
  let lastTouchDist = null;
  viewport.addEventListener('touchstart',(e)=>{
aria-hidden','true');
    scanning = false;
    if (rafId) cancelAnimationFrame(rafId);
    if (stream)    if (e.touches.length === 1 {
      stream.getTracks().forEach(t=>t.stop());
      stream = null;
    }
    video.srcObject =){
      isPanning = true;
      panStart = {x:e.touches[0].clientX null;
  }

  function tickScan(){
    if (!scanning) return;
    const canvas = scanCanvas;
   , y:e.touches[0].clientY};
      panOrigin = {x:translateX, y:translateY};
 const ctx = canvas.getContext('2d');
    const vw = video.videoWidth; const vh = video.videoHeight;
    if (vw && vh){
      canvas.width = vw; canvas.height = vh;
    }
    if (e.touches.length ===       ctx.drawImage(video,0,0,vw,vh);
      const imageData = ctx.getImageData(0,02){
      lastTouchDist = getTouchDist(e.t,vw,vh);
      const code = window.jsQR ? jsQR(imageData.data, imageData.width, imageData.height) : null;
     ouches);
    }
  }, { passive:false });

  viewport.addEventListener('touchmove',(e)=>{
 if (code){
        handleScanned(code.data);
        stopScanner();
        return;
      }
    }
    rafId = requestAnimationFrame(tickScan);
  }

  function handleScanned(data){
    let parsed = null;
       if (e.touches.length === 1 && isPanning){
      const dx = try { parsed = JSON.parse(data); } catch {}
    let sku = null;
    if (parsed && parsed.sku) sku = parsed.sku;
    else sku = String(parsed || data);
    const results = db.filter(it => it.sku && it.sku.toLowerCase() === sku.toLowerCase());
 e.touches[0].client    if (results.length){
      highlightMatches(results.map(r=>r.id));
      openEdit(results[0].id);
      centerX - panStart.x;
      const dy = e.touches[0].clientY - panOn(results[0]);
      showToast('Found item: ' + results[0].sku);
    } else {
      showToast('Start.y;
      translateX = panOrigin.x + dx;
      translateY = panOrigin.y + dy;
      applyTransform();
    } else if (e.touches.length === 2) {
      constNo matching SKU in DB');
      if (confirm(`Scanned: ${data}\nCopy to clipboard?`)) navigator.clipboard.writeText(data);
    }
  }

  // QR Generator
  qrGenBtn.addEventListener('click', ()=>{ qrGen dist = getTouchDist(e.touches);
      if (lastTouchDist){
        const factor = dist / lastTouchDist;
        constModal.setAttribute('aria-hidden','false'); qrcodeContainer.innerHTML=''; qrText.value=''; });
  closeQrGen.addEvent rect = viewport.getBoundingClientRect();
        const cx = (e.touches[0].clientListener('click', ()=>{ qrGenModal.setAttribute('aria-hidden','true'); qrcodeContainer.innerHTML='';X + e.touches[1].clientX });
  generateQrBtn.addEventListener('click', ()=>{
    const text = qrText.value)/2 - rect.left;
        const cy = (e.touches[0]..trim();
    if (!text) return showToast('Enter text or SKU');
    qrcodeContainer.innerHTML = '';
    QRCode.toCanvas(document.createclientY + e.touches[1].clientY)/2 - rect.top;
        const wx = (cx - translateX) / scale;
        const wy = (cy - translateY) / scale;
        scale = Math.min(6, Math.max(0.4, scale * factor));
       Element('canvas'), text, { width:220 }, (err,canvas)=>{
      if (err) { console.error(err); showToast('Failed to generate QR'); return; }
      qrcodeContainer.appendChild(canvas);
    });
  });
  downloadQrBtn.add translateX = cx - wx * scale;
        translateY = cy - wy * scale;
        applyTransform();
      }
      lastTouchDist = dist;
    }
   EventListener('click', ()=>{
    const canvas = qrcodeContainer.querySelector('canvas');
    if (! e.preventDefault();
  }, { passive:false });

  window.addEventListener('touchend',(e)=>{ if (e.touchescanvas) return showToast('Generate first');
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a'); a.href = url; a.download = 'qr.png'; a.click();
  });

  // Reset seed
  resetBtn.addEventListener('click', ()=>{
    if (!confirm('Replace database with sample seed?')) return.length < 2) lastTouchDist = null; if (e.touches.length===0) isPanning=false; });

  function getTouchDist(touches){ const dx = touches[0].clientX - touches[1].clientX; const dy = touches[0].clientY - touches[1].clientY; return Math.sqrt(dx*dx+dy*dy); }

  // Zoom buttons
  zoomInBtn && zoomInBtn.addEventListener('click', ()=>{
    const vp = viewport.getBoundingClientRect();
    const cx = vp.width/2; const cy = vp.height/;
    db = createSampleData();
    saveDB(); renderMarkers(); showToast('Reset to sample seed');
  });

  // Close modals clicking backdrop
  document.querySelectorAll('.modal').forEach(m=>{
    m.addEventListener('click2;
    const wx = (cx - translateX)/scale; const wy = (cy - translateY)/scale;
    scale = Math.min(6, scale * 1.2);
    translateX = cx - wx * scale; translateY = cy - wy * scale; applyTransform',(e)=>{ if (e.target.classList.contains('modal-backdrop')) m.setAttribute('aria-hidden','true'); });
  });

  // Fit on image load
  function fitOnLoad(){
    if (!floorplan.complete) {
      floorplan.addEventListener('();
  });
  zoomOutBtn && zoomOutBtn.addEventListener('click', ()=>{
    const vp = viewport.getBoundingClientRect();
    const cx = vp.width/2; const cy = vp.height/2;
    const wx =load', () => { updateMapInnerSize(); fitToViewport(); renderMarkers(); });
    } else {
      updateMapInnerSize();
      fitToViewport();
      renderMarkers();
    }
  }

  // Initial load
  function init(){
    prefs = load (cx - translateX)/scale; const wy = (cy - translatePrefs();
    seedIfEmpty();
    fitOnLoad();
    applyY)/scale;
    scale = Math.max(0.4, scale / 1.2);
Transform();

    document.body.addEventListener('click', ()=>{ clearHighlights(); showDetail(null); });

    renderMarkers();

    if (db.length) centerOn(db[Math.floor(db.length/2)]);
    window.addEventListener('resize', ()=>{ fitTo    translateX = cx - wx * scale; translateY = cy - wy * scale; applyTransform();
  });
  fitBtn && fitBtn.addEventListener('click',Viewport(); });
  }

  init();

  // Expose debug
  window.WarehouseLocator = {
    getDB: ()=>db,
    saveDB,
    renderMarkers,
    highlight: highlightMatches
  };
})();
