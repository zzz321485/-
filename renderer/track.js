(function () {
  'use strict';

  function makeCanvas(w, h, draw) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    draw(ctx, w, h);
    return c;
  }

  function makeSkyTexture() {
    return makeCanvas(1024, 512, function (ctx, w, h) {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#2b6fc1');
      g.addColorStop(0.35, '#5fa6df');
      g.addColorStop(0.62, '#a5d2ec');
      g.addColorStop(0.82, '#ddeef0');
      g.addColorStop(1, '#f5d9a0');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      // Sun glow
      const sx = w * 0.74;
      const sy = h * 0.3;
      const sun = ctx.createRadialGradient(sx, sy, 4, sx, sy, 150);
      sun.addColorStop(0, 'rgba(255,248,214,1)');
      sun.addColorStop(0.22, 'rgba(255,238,180,0.9)');
      sun.addColorStop(1, 'rgba(255,238,180,0)');
      ctx.fillStyle = sun;
      ctx.fillRect(0, 0, w, h);

      // Soft clouds
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      [[170, 130, 130, 42], [430, 95, 110, 34], [700, 190, 150, 44], [900, 120, 120, 36]].forEach(function (c) {
        ctx.beginPath();
        ctx.ellipse(c[0], c[1], c[2], c[3], 0, 0, Math.PI * 2);
        ctx.fill();
      });
    });
  }

  function makeRoadTexture() {
    return makeCanvas(512, 512, function (ctx, w, h) {
      ctx.fillStyle = '#3c424c';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 3200; i++) {
        const v = 52 + Math.floor(Math.random() * 50);
        ctx.fillStyle = 'rgba(' + v + ',' + (v + 2) + ',' + (v + 8) + ',0.16)';
        ctx.fillRect(Math.random() * w, Math.random() * h, 1.6, 1.6);
      }
      // Tire wear bands
      ctx.fillStyle = 'rgba(0,0,0,0.07)';
      ctx.fillRect(84, 0, 56, h);
      ctx.fillRect(372, 0, 56, h);
      // Crisp edge lines
      ctx.fillStyle = '#f6f7f9';
      ctx.fillRect(6, 0, 22, h);
      ctx.fillRect(w - 28, 0, 22, h);
      // Dashed center line
      ctx.fillStyle = '#f7d24a';
      ctx.fillRect(w / 2 - 5, 0, 10, h);
      ctx.fillStyle = '#3c424c';
      for (let y = 34; y < h; y += 64) {
        ctx.fillRect(w / 2 - 5, y, 10, 28);
      }
    });
  }

  function makeCurbTexture() {
    return makeCanvas(64, 256, function (ctx, w, h) {
      for (let i = 0; i < 8; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#e23c3c' : '#f7f7f7';
        ctx.fillRect(0, i * 32, w, 32);
      }
    });
  }

  function makeGrassTexture() {
    return makeCanvas(256, 256, function (ctx, w, h) {
      ctx.fillStyle = '#5b9d4f';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 16; i++) {
        ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.045)' : 'rgba(0,40,10,0.07)';
        ctx.fillRect(0, i * 16, w, 16);
      }
      for (let i = 0; i < 2800; i++) {
        const g = 70 + Math.floor(Math.random() * 62);
        ctx.fillStyle = 'rgba(' + g + ',' + (g + 58) + ',' + g + ',0.14)';
        ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
      }
    });
  }

  function makeFinishTexture() {
    return makeCanvas(64, 64, function (ctx, w, h) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#101418';
      const s = 16;
      for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 4; x++) {
          if ((x + y) % 2 === 0) ctx.fillRect(x * s, y * s, s, s);
        }
      }
    });
  }

  function makeSignTexture() {
    return makeCanvas(256, 64, function (ctx, w, h) {
      ctx.fillStyle = '#101820';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#f7d24a';
      ctx.lineWidth = 5;
      ctx.strokeRect(5, 5, w - 10, h - 10);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 34px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('START', w / 2, h / 2 + 2);
    });
  }

  function makeArrowTexture() {
    return makeCanvas(128, 256, function (ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(255,255,255,0.94)';
      ctx.beginPath();
      ctx.moveTo(w / 2, 14);
      ctx.lineTo(w / 2 + 34, 76);
      ctx.lineTo(w / 2 + 16, 76);
      ctx.lineTo(w / 2 + 16, h - 18);
      ctx.lineTo(w / 2 - 16, h - 18);
      ctx.lineTo(w / 2 - 16, 76);
      ctx.lineTo(w / 2 - 34, 76);
      ctx.closePath();
      ctx.fill();
    });
  }

  function makeSunTexture() {
    return makeCanvas(256, 256, function (ctx, w, h) {
      const g = ctx.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, w / 2);
      g.addColorStop(0, 'rgba(255,252,235,1)');
      g.addColorStop(0.25, 'rgba(255,244,200,0.85)');
      g.addColorStop(1, 'rgba(255,244,200,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    });
  }

  function makeCloudTexture() {
    return makeCanvas(256, 128, function (ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      const blobs = [[70, 66, 44, 22], [120, 58, 58, 26], [170, 68, 40, 20]];
      blobs.forEach(function (b) {
        const g = ctx.createRadialGradient(b[0], b[1], 2, b[0], b[1], b[2]);
        g.addColorStop(0, 'rgba(255,255,255,0.95)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(b[0], b[1], b[2], 0, Math.PI * 2);
        ctx.fill();
      });
    });
  }

  function buildRibbon(offsetA, offsetB, u0, u1, vRepeat, material, y) {
    const N = centerline.length;
    const positions = new Float32Array(N * 2 * 3);
    const uvs = new Float32Array(N * 2 * 2);
    const indices = [];

    for (let i = 0; i < N; i++) {
      const p = centerline[i];
      const l = lefts[i];
      positions[i * 6] = p.x + l.x * offsetA;
      positions[i * 6 + 1] = y;
      positions[i * 6 + 2] = p.z + l.z * offsetA;
      positions[i * 6 + 3] = p.x + l.x * offsetB;
      positions[i * 6 + 4] = y;
      positions[i * 6 + 5] = p.z + l.z * offsetB;
      const v = cums[i] / vRepeat;
      uvs[i * 4] = u0;
      uvs[i * 4 + 1] = v;
      uvs[i * 4 + 2] = u1;
      uvs[i * 4 + 3] = v;
    }

    for (let i = 0; i < N; i++) {
      const j = (i + 1) % N;
      const a = i * 2;
      const b = j * 2;
      indices.push(a, b, a + 1, a + 1, b, b + 1);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return new THREE.Mesh(geo, material);
  }

  function buildWall(offset, height, material) {
    const N = centerline.length;
    const positions = new Float32Array(N * 2 * 3);
    const uvs = new Float32Array(N * 2 * 2);
    const indices = [];

    for (let i = 0; i < N; i++) {
      const p = centerline[i];
      const l = lefts[i];
      const bx = p.x + l.x * offset;
      const bz = p.z + l.z * offset;
      positions[i * 6] = bx;
      positions[i * 6 + 1] = 0.03;
      positions[i * 6 + 2] = bz;
      positions[i * 6 + 3] = bx;
      positions[i * 6 + 4] = height;
      positions[i * 6 + 5] = bz;
      const v = cums[i] / 4.8;
      uvs[i * 4] = 0;
      uvs[i * 4 + 1] = v;
      uvs[i * 4 + 2] = 1;
      uvs[i * 4 + 3] = v;
    }

    for (let i = 0; i < N; i++) {
      const j = (i + 1) % N;
      const a = i * 2;
      const b = j * 2;
      indices.push(a, b, a + 1, a + 1, b, b + 1);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return new THREE.Mesh(geo, material);
  }

  // Track centerline state (filled during build).
  let centerline = [];
  let lefts = [];
  let cums = [];
  let tangents = [];
  let curv = [];
  let totalLength = 0;
  let N = 0;
  const roadHalf = 6;
  const curbHalf = 7.6;

  function nearest(pos) {
    let best = Infinity;
    let bi = 0;
    for (let i = 0; i < N; i++) {
      const dx = pos.x - centerline[i].x;
      const dz = pos.z - centerline[i].z;
      const d = dx * dx + dz * dz;
      if (d < best) {
        best = d;
        bi = i;
      }
    }
    const p = centerline[bi];
    const lateral = (pos.x - p.x) * lefts[bi].x + (pos.z - p.z) * lefts[bi].z;
    return {
      index: bi,
      point: p,
      lateral: lateral,
      cum: cums[bi],
      tangent: tangents[bi],
      left: lefts[bi]
    };
  }

  function sampleAt(dist) {
    let d = ((dist % totalLength) + totalLength) % totalLength;
    let f = (d / totalLength) * N;
    let i = Math.floor(f) % N;
    let j = (i + 1) % N;
    let t = f - Math.floor(f);
    const p = centerline[i].clone().lerp(centerline[j], t);
    const tan = tangents[i].clone().lerp(tangents[j], t).normalize();
    return { pos: p, tangent: tan };
  }

  function curvatureAt(dist) {
    let d = ((dist % totalLength) + totalLength) % totalLength;
    let i = Math.floor((d / totalLength) * N) % N;
    return curv[i];
  }

  function build(scene) {
    // Explicit rounded-rectangle loop: four clear corners plus a smooth
    // chicane on the top straight. Built point-by-point so the centerline
    // stays C1-continuous at the start/finish seam.
    function linePts(x0, z0, x1, z1, count) {
      const out = [];
      for (let i = 0; i <= count; i++) {
        const t = i / count;
        out.push(new THREE.Vector3(x0 + (x1 - x0) * t, 0, z0 + (z1 - z0) * t));
      }
      return out;
    }

    function arcPts(cx, cz, r, a0, a1, count) {
      const out = [];
      for (let i = 0; i <= count; i++) {
        const a = a0 + (a1 - a0) * (i / count);
        out.push(new THREE.Vector3(cx + r * Math.cos(a), 0, cz + r * Math.sin(a)));
      }
      return out;
    }

    function chicaneTop(count) {
      const out = [];
      for (let i = 0; i <= count; i++) {
        const x = 48 - 96 * (i / count);
        let bump = 0;
        if (x > -8 && x < 40) {
          const t = (x + 8) / 48;
          bump = 14 * Math.sin(Math.PI * t) * Math.sin(Math.PI * t);
        }
        out.push(new THREE.Vector3(x, 0, 55 - bump));
      }
      return out;
    }

    function appendSegment(all, seg) {
      const start = all.length === 0 ? 0 : 1;
      for (let i = start; i < seg.length; i++) all.push(seg[i]);
    }

    const pts = [];
    appendSegment(pts, linePts(0, -55, 48, -55, 160));
    appendSegment(pts, arcPts(48, -25, 30, -Math.PI / 2, 0, 80));
    appendSegment(pts, linePts(78, -25, 78, 25, 160));
    appendSegment(pts, arcPts(48, 25, 30, 0, Math.PI / 2, 80));
    appendSegment(pts, chicaneTop(220));
    appendSegment(pts, arcPts(-48, 25, 30, Math.PI / 2, Math.PI, 80));
    appendSegment(pts, linePts(-78, 25, -78, -25, 160));
    appendSegment(pts, arcPts(-48, -25, 30, Math.PI, Math.PI * 1.5, 80));
    appendSegment(pts, linePts(-48, -55, 0, -55, 160));

    N = pts.length;
    centerline = pts;
    lefts = [];
    tangents = [];
    cums = [];

    for (let i = 0; i < N; i++) {
      const prev = centerline[(i - 1 + N) % N];
      const next = centerline[(i + 1) % N];
      const tan = new THREE.Vector3().subVectors(next, prev).setY(0).normalize();
      tangents.push(tan);
      lefts.push(new THREE.Vector3(-tan.z, 0, tan.x));
    }

    cums[0] = 0;
    for (let i = 1; i < N; i++) {
      cums[i] = cums[i - 1] + centerline[i].distanceTo(centerline[i - 1]);
    }
    totalLength = cums[N - 1] + centerline[N - 1].distanceTo(centerline[0]);

    curv = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const j = (i + 1) % N;
      const a = tangents[i];
      const b = tangents[j];
      const cross = a.x * b.z - a.z * b.x;
      const dot = a.x * b.x + a.z * b.z;
      const angle = Math.atan2(cross, dot);
      const seg = centerline[i].distanceTo(centerline[j]);
      curv[i] = seg > 0.001 ? Math.abs(angle) / seg : 0;
    }
    let curvSum = 0;
    let curvMax = 0;
    for (let i = 0; i < N; i++) {
      curvSum += curv[i];
      if (curv[i] > curvMax) curvMax = curv[i];
    }

    scene.fog = new THREE.Fog(0xcfe8f2, 120, 860);
    scene.background = new THREE.CanvasTexture(makeSkyTexture());
    scene.background.encoding = THREE.sRGBEncoding;

    // Lighting: bright, sunny, Horizon-style
    scene.add(new THREE.HemisphereLight(0xd8ecff, 0x5d7d55, 0.95));
    scene.add(new THREE.AmbientLight(0xffffff, 0.32));
    const sun = new THREE.DirectionalLight(0xfff0cf, 1.55);
    sun.position.set(90, 150, 70);
    scene.add(sun);

    // Grass
    const grassTex = new THREE.CanvasTexture(makeGrassTexture());
    grassTex.wrapS = grassTex.wrapT = THREE.RepeatWrapping;
    grassTex.repeat.set(56, 56);
    grassTex.anisotropy = 8;
    grassTex.encoding = THREE.sRGBEncoding;
    const grass = new THREE.Mesh(
      new THREE.PlaneGeometry(1600, 1600),
      new THREE.MeshLambertMaterial({ map: grassTex })
    );
    grass.rotation.x = -Math.PI / 2;
    grass.position.y = -0.05;
    scene.add(grass);

    // Road
    const roadTex = new THREE.CanvasTexture(makeRoadTexture());
    roadTex.wrapS = roadTex.wrapT = THREE.RepeatWrapping;
    roadTex.repeat.set(1, Math.max(1, Math.round(totalLength / 12)));
    roadTex.anisotropy = 16;
    roadTex.encoding = THREE.sRGBEncoding;
    const road = buildRibbon(-roadHalf, roadHalf, 0, 1, 12, new THREE.MeshLambertMaterial({ map: roadTex }), 0);
    scene.add(road);

    // Curbs
    const curbTex = new THREE.CanvasTexture(makeCurbTexture());
    curbTex.wrapS = curbTex.wrapT = THREE.RepeatWrapping;
    curbTex.repeat.set(1, Math.max(1, Math.round(totalLength / 4.8)));
    curbTex.anisotropy = 8;
    curbTex.encoding = THREE.sRGBEncoding;
    const curbMat = new THREE.MeshLambertMaterial({ map: curbTex });
    const curbL = buildRibbon(-curbHalf, -roadHalf, 0, 1, 4.8, curbMat, 0.05);
    const curbR = buildRibbon(roadHalf, curbHalf, 0, 1, 4.8, curbMat, 0.05);
    scene.add(curbL);
    scene.add(curbR);

    // Continuous red/white boundary walls so the track edge is obvious.
    const wallMat = new THREE.MeshLambertMaterial({ map: curbTex, side: THREE.DoubleSide });
    const wallOffset = curbHalf + 0.5;
    scene.add(buildWall(-wallOffset, 1.05, wallMat));
    scene.add(buildWall(wallOffset, 1.05, wallMat));

    // Direction arrows painted on the road.
    const arrowTex = new THREE.CanvasTexture(makeArrowTexture());
    arrowTex.encoding = THREE.sRGBEncoding;
    const arrowMat = new THREE.MeshBasicMaterial({
      map: arrowTex,
      transparent: true,
      depthWrite: false
    });
    const arrowGeo = new THREE.PlaneGeometry(2.3, 3.2);
    const arrowUp = new THREE.Vector3(0, 1, 0);
    let arrowDist = 20;
    while (arrowDist < totalLength - 20) {
      const s = sampleAt(arrowDist);
      const left = new THREE.Vector3(-s.tangent.z, 0, s.tangent.x);
      const arrow = new THREE.Mesh(arrowGeo, arrowMat);
      arrow.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(left, s.tangent, arrowUp));
      arrow.position.set(s.pos.x, 0.025, s.pos.z);
      arrow.renderOrder = 1;
      scene.add(arrow);
      arrowDist += 36;
    }

    // Checkered start/finish line
    const finishTex = new THREE.CanvasTexture(makeFinishTexture());
    finishTex.encoding = THREE.sRGBEncoding;
    const line = new THREE.Mesh(
      new THREE.BoxGeometry(roadHalf * 2, 0.07, 1.8),
      new THREE.MeshBasicMaterial({ map: finishTex })
    );
    const up = new THREE.Vector3(0, 1, 0);
    const zAxis = new THREE.Vector3().crossVectors(lefts[0], up);
    line.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(lefts[0], up, zAxis));
    line.position.copy(centerline[0]);
    line.position.y = 0.04;
    scene.add(line);

    // Start gantry
    const poleGeo = new THREE.CylinderGeometry(0.4, 0.55, 10, 10);
    const poleMat = new THREE.MeshLambertMaterial({ color: 0xf4f6f8 });
    const beamMat = new THREE.MeshLambertMaterial({ color: 0x182430 });
    [[-1, roadHalf + 1.2], [1, roadHalf + 1.2]].forEach(function (side) {
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.copy(centerline[0]);
      pole.position.x += lefts[0].x * side[1] * side[0];
      pole.position.z += lefts[0].z * side[1] * side[0];
      pole.position.y = 5;
      scene.add(pole);
    });
    const beam = new THREE.Mesh(new THREE.BoxGeometry(roadHalf * 2 + 3.2, 1.1, 0.7), beamMat);
    beam.position.copy(centerline[0]);
    beam.position.y = 9.4;
    beam.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(lefts[0], up, zAxis));
    scene.add(beam);
    const signTex = new THREE.CanvasTexture(makeSignTexture());
    signTex.encoding = THREE.sRGBEncoding;
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(11.2, 1.9),
      new THREE.MeshBasicMaterial({ map: signTex, side: THREE.DoubleSide, transparent: true })
    );
    sign.position.copy(centerline[0]);
    sign.position.y = 8.6;
    sign.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangents[0]);
    scene.add(sign);

    // Distant mountains for a scenic horizon
    const nearMountainMat = new THREE.MeshLambertMaterial({ color: 0x86a7c8 });
    const farMountainMat = new THREE.MeshLambertMaterial({ color: 0xc9ddec });
    for (let ring = 0; ring < 2; ring++) {
      const count = ring === 0 ? 22 : 18;
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.22;
        const radius = ring === 0 ? 560 + Math.random() * 140 : 760 + Math.random() * 120;
        const height = ring === 0 ? 80 + Math.random() * 150 : 120 + Math.random() * 190;
        const cone = new THREE.Mesh(
          new THREE.ConeGeometry(45 + Math.random() * 90, height, 4 + Math.floor(Math.random() * 3)),
          ring === 0 ? nearMountainMat : farMountainMat
        );
        cone.position.set(Math.cos(angle) * radius, height / 2 - 6, Math.sin(angle) * radius);
        cone.rotation.y = Math.random() * Math.PI;
        scene.add(cone);
      }
    }

    // Sun and clouds
    const sunSprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(makeSunTexture()),
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false
    }));
    sunSprite.position.set(180, 300, -760);
    sunSprite.scale.set(260, 260, 1);
    scene.add(sunSprite);

    const cloudMat = new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(makeCloudTexture()),
      transparent: true,
      depthWrite: false,
      opacity: 0.8,
      fog: false
    });
    for (let i = 0; i < 9; i++) {
      const cloud = new THREE.Sprite(cloudMat);
      const a = Math.random() * Math.PI * 2;
      const r = 420 + Math.random() * 500;
      cloud.position.set(Math.cos(a) * r, 170 + Math.random() * 110, Math.sin(a) * r);
      cloud.scale.set(180 + Math.random() * 220, 90 + Math.random() * 90, 1);
      scene.add(cloud);
    }

    // Simple low-poly trees
    const trunkGeo = new THREE.CylinderGeometry(0.35, 0.48, 3, 6);
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x6b4a2b });
    const canopyGeo = new THREE.ConeGeometry(2.5, 5.8, 7);
    const canopyMat = new THREE.MeshLambertMaterial({ color: 0x2f7a3f });
    let placed = 0;
    let attempts = 0;
    while (placed < 60 && attempts < 4000) {
      attempts++;
      const x = (Math.random() - 0.5) * 1050;
      const z = (Math.random() - 0.5) * 1050;
      const n = nearest(new THREE.Vector3(x, 0, z));
      if (Math.abs(n.lateral) < curbHalf + 8) continue;
      const tree = new THREE.Group();
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 1.5;
      const canopy = new THREE.Mesh(canopyGeo, canopyMat);
      canopy.position.y = 5.3;
      tree.add(trunk);
      tree.add(canopy);
      tree.position.set(x, 0, z);
      scene.add(tree);
      placed++;
    }

    const startHeading = Math.atan2(tangents[0].x, tangents[0].z);

    return {
      roadHalf: roadHalf,
      curbHalf: curbHalf,
      totalLength: totalLength,
      N: N,
      startPos: centerline[0].clone(),
      startHeading: startHeading,
      startTangent: tangents[0].clone(),
      startGrid: [
        { offset: -2, isPlayer: true },
        { offset: 0.4 },
        { offset: 2.4 },
        { offset: 4.4 }
      ],
      checkpoints: [0, Math.floor(N / 3), Math.floor((2 * N) / 3)],
      nearest: nearest,
      sampleAt: sampleAt,
      curvatureAt: curvatureAt,
      curvatureStats: {
        mean: curvSum / N,
        max: curvMax
      },
      curvature: curv,
      centerline: centerline,
      lefts: lefts
    };
  }

  window.Track = { build: build };
})();
