# Warehouse Locator

Files:
- index.html
- style.css
- app.js
- vercel.json
- Place the warehouse layout image file as `warehouse-layout.png` in the same folder.

Features:
- Warehouse floorplan image as background.
- 200 seeded sample locations (L-001 ... L-200) with SKU, Product Name, Quantity and percent coordinates.
- Click markers to view/edit location details.
- Add location mode: click "Add Location" then tap the map to add a new location.
- Search by SKU or Location ID (search box).
- Matching locations are highlighted and blink.
- Zoom and pan: mouse wheel zoom, drag to pan; touch pinch/drag support.
- QR scanner (camera + jsQR) and QR generator (qrcode).
- Import/Export JSON.
- LocalStorage persistence.

Notes:
- For QR scanner to work, serve over HTTPS or use `localhost`.
- Ensure `warehouse-layout.png` is placed in the project root.

Quick local server:
- Python 3:
  python -m http.server 8000
  Open http://localhost:8000

Deploy:
- Static site: push files to GitHub Pages or Vercel.
