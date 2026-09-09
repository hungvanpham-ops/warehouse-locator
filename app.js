 <div/* Warehouse Locator - dot-per-cell update
   - Markers now rendered as small dots (8px) per cell
   - Markers positioned relative to the image natural size (pixel-perfect mapping)
 id="   - Hover shows native title + lightweight custom tooltip positioning for readability
   - Zoom/pan preserved and markers remain in correct positions when transformed
   -scanStatus">Initializing Core features: add/edit, search, highlight/blink, QR scan/generate, import/export, localStorage
*/

(() => {
  const DB_KEY = 'warehouse_locator_db_v1';
  const PREF_KEY = ' camera...</warehouse_locator_prefs_v1';
  const SAMPLE_COUNT = 200;

  // DOM
  const searchInputdiv>
      </div>
    </div>
    <div class="modal-backdrop = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');
  const clearSearchBtn ="></div>
  </div>

  <!-- QR Generator Modal -->
  <div id="qrGenModal" class document.getElementById('clearSearchBtn');
  const addMode="modal" aria-hidden="true">
    <div class="Btn = document.getElementById('addModeBtn');
  const exportBtn = document.getElementById('exportBtn');
  const importInput = document.getElementById('importInput');
  constmodal-content">
      <header><h3>QR Generator</h3><button id="closeQrGen">Close</ qrScanBtn = document.getElementById('qrScanBtn');
  const qrGenBtn = document.getElementById('qrGenBtn');
button></header>
      <div class="modal-body">
        <label>Text or SKU<input  const resetBtn = document.getElementById('resetBtn');
  const matchesEl = document.getElementById id="qrText" placeholder='{"sku":"SKU-0001"} or SKU-0001'('matches');
  const detailEl = document.getElementById('detail');
  const markersEl = document.getElementById('markers');
 /></label>
  const viewport = document.getElementById('viewport');
  const mapInner = document.getElementById('mapInner');
  const floorplan = document.getElementById('floorplan');

  const editModal = document.getElementById('editModal');
        <div class="form-actions">
          <button id="generateQrBtn">Generate</button>
          <button  const closeEdit = document.getElementById('closeEdit');
  const editForm = document.getElementById('editForm');
  const field id="downloadQrBtn">Download</button>
        </div>
        <div id="qrcode" class="LocationId = document.getElementById('fieldLocationId');
  const fieldSKU = document.getElementByqrcode"></div>
      </div>
    </div>
    <div class="modal-backdrop"></divId('fieldSKU');
  const fieldName = document.getElementById('fieldName');
 >
  </div>

  <div id="toast" class="toast" aria-live="polite"></div>

  <script src="https://unpkg.com/jsqr/dist/jsQR.js"></script>
  <script const fieldQty = src="https://cdn.jsdelivr.net/npm/qrcode@1.5.1/build/qrcode.min.js"></script>
  <script src="app.js"></script>
</body>
</html>
