/* Context Cloud — small, offline Three.js illustration for Orch Overview.
 * Load after Three.js r170.0.0; this classic script creates no renderer or loop.
 */
(function (root) {
  'use strict';

  const PALETTE = {
    ink: '#26323B', graphite: '#35434D', cloud: '#F3F7F7',
    teal: '#55B6B0', tealDeep: '#287F83', lavender: '#B9B2DD',
    orange: '#E59A62', muted: '#73858B', paper: '#FBFCFA'
  };
  const NOTES = [
    { title: 'Working brief', detail: 'why context matters', tag: 'NOTE', color: PALETTE.orange },
    { title: 'Evidence', detail: 'three sources aligned', tag: 'SOURCE', color: PALETTE.teal },
    { title: 'Open question', detail: 'where does it break?', tag: 'QUESTION', color: PALETTE.lavender },
    { title: 'Hypothesis', detail: 'signal before volume', tag: 'IDEA', color: PALETTE.tealDeep }
  ];
  const NODES = [
    [-2.05, .78, -.15], [-1.22, 1.32, .13], [-.12, 1.53, -.05],
    [1.08, 1.31, .08], [2.02, .72, -.13],
    [-2.15, -.28, .1], [-1.3, -.78, -.08], [0, -.92, .14],
    [1.24, -.73, -.12], [2.16, -.2, .08]
  ];

  function makeLabel(THREE, note, ratio) {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = PALETTE.paper; ctx.fillRect(0, 0, 512, 256);
    ctx.fillStyle = note.color; ctx.fillRect(0, 0, 12, 256);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = '600 23px system-ui, sans-serif'; ctx.fillText(note.tag, 34, 56);
    ctx.fillStyle = PALETTE.ink;
    ctx.font = '600 39px system-ui, sans-serif'; ctx.fillText(note.title, 34, 119);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = '400 25px system-ui, sans-serif'; ctx.fillText(note.detail, 34, 171);
    ctx.fillStyle = '#E5EBEA'; ctx.fillRect(34, 207, 438, 2);
    ctx.fillStyle = note.color; ctx.beginPath(); ctx.arc(42, 230, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#849397'; ctx.font = '400 18px system-ui, sans-serif';
    ctx.fillText('attached context', 58, 236);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    return texture;
  }

  function createContextCloud(THREE, options = {}) {
    const group = new THREE.Group();
    group.name = 'Orch Context Cloud';
    const materials = [];
    const geometries = [];
    const remember = (geometry, material) => {
      geometries.push(geometry); materials.push(material); return material;
    };
    const mat = (color, roughness = .72, metalness = .04) =>
      remember(null, new THREE.MeshStandardMaterial({ color, roughness, metalness }));
    const sphere = new THREE.SphereGeometry(1, 24, 16);
    geometries.push(sphere);
    const beadMat = mat(PALETTE.teal, .48, .08);
    const mutedBeadMat = mat(PALETTE.lavender, .56, .03);
    const filamentMat = remember(null, new THREE.LineBasicMaterial({
      color: PALETTE.tealDeep, transparent: true, opacity: .43
    }));

    // Fine, short connections suggest a field of related evidence without a web.
    const links = [[0,1],[1,2],[2,3],[3,4],[0,5],[1,6],[2,7],[3,8],[4,9],
      [5,6],[6,7],[7,8],[8,9],[1,7],[3,7]];
    links.forEach(([a, b]) => {
      const points = [new THREE.Vector3(...NODES[a]), new THREE.Vector3(...NODES[b])];
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      geometries.push(geometry);
      group.add(new THREE.Line(geometry, filamentMat));
    });

    // Soft node beads sit behind the paper-like notes and around the core.
    NODES.forEach((point, index) => {
      const mesh = new THREE.Mesh(sphere, index % 3 === 0 ? mutedBeadMat : beadMat);
      mesh.position.set(...point);
      const scale = index % 3 === 0 ? .105 : .075;
      mesh.scale.setScalar(scale); group.add(mesh);
    });

    // Central context core: quiet graphite body, teal orbit and pale inset.
    const core = new THREE.Mesh(sphere, mat(PALETTE.graphite, .4, .12));
    core.position.set(0, .12, .36); core.scale.set(.63, .63, .37); group.add(core);
    const inset = new THREE.Mesh(sphere, mat(PALETTE.cloud, .48, .02));
    inset.position.set(0, .12, .71); inset.scale.set(.35, .35, .12); group.add(inset);
    const orbitGeometry = new THREE.TorusGeometry(.53, .018, 6, 64);
    geometries.push(orbitGeometry);
    const orbit = new THREE.Mesh(orbitGeometry, mat(PALETTE.teal, .42, .1));
    orbit.position.set(0, .12, .39); orbit.rotation.x = .18; group.add(orbit);
    const coreDot = new THREE.Mesh(sphere, mat(PALETTE.orange, .5, .03));
    coreDot.position.set(.06, .19, .84); coreDot.scale.setScalar(.07); group.add(coreDot);

    // Four legible notes, each a single textured card with a restrained shadow plate.
    const cardPositions = [ [-2.65,.63,.3], [-1.65,-1.52,.32], [1.68,-1.5,.3], [2.63,.62,.31] ];
    const cardRotations = [-.1, .075, -.065, .09];
    NOTES.forEach((note, index) => {
      const card = new THREE.Group();
      const backing = new THREE.Mesh(new THREE.BoxGeometry(1.74, .88, .055), mat('#DFE8E7', .85));
      geometries.push(backing.geometry);
      backing.position.set(.035, -.045, -.045); card.add(backing);
      const texture = makeLabel(THREE, note);
      const labelMat = remember(null, new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide }));
      const faceGeometry = new THREE.PlaneGeometry(1.72, .86); geometries.push(faceGeometry);
      const face = new THREE.Mesh(faceGeometry, labelMat);
      face.position.z = .005; card.add(face);
      card.position.set(...cardPositions[index]); card.rotation.z = cardRotations[index];
      group.add(card);
    });

    // A few restrained puffs give the cluster a cloud silhouette, not particles.
    [[-2.45,1.33,.0,.43],[-1.53,1.72,-.1,.48],[-.42,1.82,.02,.41],
      [.78,1.7,-.05,.47],[1.83,1.33,.03,.4],[-2.55,-.88,-.06,.34],
      [2.57,-.82,.02,.36]].forEach(([x,y,z,r]) => {
      const puff = new THREE.Mesh(sphere, mat(PALETTE.cloud, .82, 0));
      puff.position.set(x,y,z); puff.scale.set(r*1.28,r,r*.46); group.add(puff);
    });

    group.traverse((object) => {
      if (object.isMesh || object.isLine) object.frustumCulled = false;
    });
    const base = { rotationY: 0, rotationZ: 0, y: 0 };
    function update(elapsedSeconds, { reducedMotion = false } = {}) {
      const active = options.motion === true && !reducedMotion;
      const t = Number.isFinite(elapsedSeconds) ? elapsedSeconds : 0;
      group.rotation.y = active ? Math.sin(t * .34) * .045 : base.rotationY;
      group.rotation.z = active ? Math.sin(t * .22) * .012 : base.rotationZ;
      group.position.y = active ? base.y + Math.sin(t * .6) * .035 : base.y;
    }
    function dispose() {
      group.traverse((object) => {
        if (object.material && object.material.map) object.material.map.dispose();
      });
      geometries.forEach((geometry) => geometry && geometry.dispose());
      materials.forEach((material) => material.dispose());
      group.clear();
    }
    return {
      group, update, dispose,
      metadata: {
        title: 'Context cloud',
        description: 'A small field of notes, evidence and ideas gathered around one working context.'
      }
    };
  }

  root.OrchAssets = root.OrchAssets || {};
  root.OrchAssets.createContextCloud = createContextCloud;
})(window);
