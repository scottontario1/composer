/* Three.js focal asset for the Orch workflow composer. Classic-script API. */
(function (root) {
  'use strict';

  function createPuzzleAssembly(THREE, options = {}) {
    if (!THREE || !THREE.Group || !THREE.Shape || !THREE.ExtrudeGeometry) {
      throw new Error('Orch puzzle assembly requires Three.js');
    }
    const group = new THREE.Group();
    group.name = 'orch-puzzle-assembly';
    const madeGeometry = [], madeMaterials = [];
    const material = (color, roughness = 0.48, metalness = 0.12) => {
      const m = new THREE.MeshStandardMaterial({ color, roughness, metalness });
      madeMaterials.push(m); return m;
    };
    const boardMat = material('#263946', 0.72, 0.22);
    const socketMat = material('#182a35', 0.8, 0.08);
    const edgeMat = material('#56717c', 0.42, 0.4);
    const palette = ['#427b88', '#557f96', '#717eaa', '#3d7180', '#7986ae', '#547b85'];
    const tileMats = palette.map((c, i) => material(c, 0.36 + (i % 2) * 0.08, 0.24));
    const detailMats = [material('#b0c7c5', 0.36, 0.34), material('#d29a61', 0.42, 0.22)];
    const box = (w, h, d, mat, x, y, z, bevel = 0) => {
      let geo;
      if (bevel) {
        const s = new THREE.Shape();
        const r = bevel;
        s.moveTo(-w/2+r, -h/2); s.lineTo(w/2-r, -h/2); s.quadraticCurveTo(w/2, -h/2, w/2, -h/2+r);
        s.lineTo(w/2, h/2-r); s.quadraticCurveTo(w/2, h/2, w/2-r, h/2); s.lineTo(-w/2+r, h/2);
        s.quadraticCurveTo(-w/2, h/2, -w/2, h/2-r); s.lineTo(-w/2, -h/2+r); s.quadraticCurveTo(-w/2, -h/2, -w/2+r, -h/2);
        geo = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: bevel * 0.32, bevelThickness: bevel * 0.3, curveSegments: 5 });
      } else geo = new THREE.BoxGeometry(w, h, d);
      madeGeometry.push(geo);
      const mesh = new THREE.Mesh(geo, mat); mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; group.add(mesh); return mesh;
    };

    // A quiet machined plinth and six recessed, fixed tile seats.
    box(6.25, 3.92, 0.3, boardMat, 0, 0, -0.24, 0.18);
    const cols = 3, rows = 2, tw = 1.76, th = 1.42, gap = 0;
    const x0 = -(cols * tw + (cols - 1) * gap) / 2;
    const y0 = -(rows * th + (rows - 1) * gap) / 2;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      box(tw + 0.08, th + 0.08, 0.018, socketMat, x0 + c * (tw + gap), y0 + r * (th + gap), -0.075, 0.06);
    }

    // The same signed seam profile is used on both sides of every joint.
    // Opposing edge normals then create true complementary tabs and notches.
    const seam = (a, b) => ((a * 7 + b * 11 + 3) % 2 ? 1 : -1);
    const edgeSigns = (r, c) => ({
      bottom: r === 0 ? 0 : seam(r - 1, c), top: r === rows - 1 ? 0 : seam(r, c),
      left: c === 0 ? 0 : seam(r, c - 1), right: c === cols - 1 ? 0 : seam(r, c)
    });
    const pieceShape = signs => {
      const w = tw, h = th, bump = 0.205, samples = 14;
      const shape = new THREE.Shape();
      const edges = [
        { a: [-w/2,-h/2], b: [w/2,-h/2], s: signs.bottom },
        { a: [w/2,-h/2], b: [w/2,h/2], s: signs.right },
        { a: [w/2,h/2], b: [-w/2,h/2], s: signs.top },
        { a: [-w/2,h/2], b: [-w/2,-h/2], s: signs.left }
      ];
      shape.moveTo(...edges[0].a);
      for (const e of edges) {
        const dx = e.b[0] - e.a[0], dy = e.b[1] - e.a[1], len = Math.hypot(dx,dy);
        const nx = dy/len, ny = -dx/len;
        for (let i=1; i<=samples; i++) {
          const t=i/samples, bulge = e.s ? e.s * bump * Math.sin(Math.PI*t) : 0;
          shape.lineTo(e.a[0]+dx*t+nx*bulge, e.a[1]+dy*t+ny*bulge);
        }
      }
      shape.closePath(); return shape;
    };

    const pieces = [];
    for (let r=0; r<rows; r++) for (let c=0; c<cols; c++) {
      const id = r*cols+c, px=x0+c*(tw+gap), py=y0+r*(th+gap);
      const geo = new THREE.ExtrudeGeometry(pieceShape(edgeSigns(r,c)), {
        depth: 0.2, bevelEnabled: true, bevelSegments: 2, steps: 1,
        bevelSize: 0.035, bevelThickness: 0.035, curveSegments: 6
      }); madeGeometry.push(geo);
      const piece = new THREE.Group(); piece.name = `skill-tile-${id+1}`;
      const mesh = new THREE.Mesh(geo, tileMats[id]); mesh.castShadow=true; mesh.receiveShadow=true; piece.add(mesh);
      // Two fine registration marks make each tile read as a precision insert.
      const barGeo = new THREE.BoxGeometry(0.48, 0.022, 0.012); madeGeometry.push(barGeo);
      const bar = new THREE.Mesh(barGeo, id===2 ? detailMats[1] : detailMats[0]);
      bar.position.set(-0.43, 0.43, 0.208); piece.add(bar);
      const pinGeo = new THREE.CylinderGeometry(0.035,0.035,0.014,12); madeGeometry.push(pinGeo);
      const pin = new THREE.Mesh(pinGeo, detailMats[0]); pin.rotation.x=Math.PI/2; pin.position.set(0.61,-0.46,0.21); piece.add(pin);
      piece.position.set(px,py,-0.09); group.add(piece);
      pieces.push({ piece, x:px, y:py, phase: id * 0.12, dx:(c-1)*0.42, dy:(r ? 0.44 : -0.44) });
    }
    // Tiny orange datum mark: the sole warm accent belongs to note taking.
    const datumGeo = new THREE.CylinderGeometry(0.075,0.075,0.025,18); madeGeometry.push(datumGeo);
    const datum = new THREE.Mesh(datumGeo, detailMats[1]); datum.rotation.x=Math.PI/2; datum.position.set(2.77,-1.57,-0.04); group.add(datum);

    const duration = Number.isFinite(options.assemblyDuration) ? Math.max(0, options.assemblyDuration) : 1.1;
    function update(elapsedSeconds, { reducedMotion = false } = {}) {
      const t = reducedMotion || duration === 0 ? 1 : Math.max(0, Math.min(1, (elapsedSeconds || 0) / duration));
      const ease = 1 - Math.pow(1-t, 3);
      for (const p of pieces) {
        p.piece.position.set(p.x + p.dx*(1-ease), p.y + p.dy*(1-ease), 0.05 + Math.sin((1-ease)*Math.PI)*0.34);
        p.piece.rotation.z = (1-ease) * p.phase;
      }
    }
    function dispose() {
      for (const g of madeGeometry) g.dispose();
      for (const m of madeMaterials) m.dispose();
      group.clear();
    }
    return { group, update, dispose, metadata: {
      title: 'Orch skill assembly',
      description: 'Six interlocking skill tiles seated in a machined board; the small amber datum marks note taking.'
    } };
  }

  root.OrchAssets = root.OrchAssets || {};
  root.OrchAssets.createPuzzleAssembly = createPuzzleAssembly;
})(window);
