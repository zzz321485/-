(function () {
  'use strict';

  const TOTAL_LAPS = 3;
  const MAX_SPEED = 42;
  const REVERSE_MAX = -9;
  const ACCEL = 17;
  const BRAKE = 30;
  const REVERSE_ACCEL = 8;
  const DRAG = 0.5;
  const STEER_RATE = 1.7;
  const NITRO_MAX = 100;
  const NITRO_DRAIN = 32;
  const NITRO_REGEN = 10;
  const BOOST_MULT = 1.45;
  const BOOST_ACCEL = 1.7;

  const canvas = document.getElementById('game');
  const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputEncoding = THREE.sRGBEncoding;

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(60, 1, 0.5, 1400);
  let cameraFov = 60;
  camera.position.set(0, 60, -120);

  const track = Track.build(scene);

  // Cars
  const player = {
    isPlayer: true,
    mesh: createCarMesh(0xe23b3b, 7),
    x: 0,
    z: 0,
    heading: track.startHeading,
    speed: 0,
    steer: 0,
    lap: 0,
    prevIdx: 0,
    cp1: false,
    cp2: false,
    cum: 0,
    nitro: NITRO_MAX,
    finished: false,
    finishTime: 0
  };
  scene.add(player.mesh);

  const aiColors = [0x2f7de1, 0x2bb673, 0xf59e0b];
  const ais = [
    AI.create(aiColors[0], 0, 0.4, 30, 17),
    AI.create(aiColors[1], 0, 2.4, 33, 23),
    AI.create(aiColors[2], 0, 4.4, 36, 45)
  ];
  ais.forEach(function (ai) { scene.add(ai.mesh); });

  const allCars = [player].concat(ais);

  function resetToStart() {
    player.speed = 0;
    player.steer = 0;
    player.lap = 0;
    player.prevIdx = 0;
    player.cp1 = false;
    player.cp2 = false;
    player.cum = 0;
    player.nitro = NITRO_MAX;
    player.finished = false;
    player.finishTime = 0;
    placeCarAtGrid(player, track.startGrid[0]);

    ais.forEach(function (ai, i) {
      ai.trackPos = 0;
      ai.speed = 0;
      ai.lap = 0;
      ai.finished = false;
      ai.finishTime = 0;
      placeCarAtGrid(ai, track.startGrid[i + 1]);
    });
  }

  function placeCarAtGrid(car, slot) {
    const left = new THREE.Vector3(-track.startTangent.z, 0, track.startTangent.x);
    const px = track.startPos.x + left.x * slot.offset;
    const pz = track.startPos.z + left.z * slot.offset;
    if (car.isPlayer) {
      car.x = px;
      car.z = pz;
      car.heading = track.startHeading;
      car.mesh.position.set(px, 0, pz);
      car.mesh.rotation.y = car.heading;
    } else {
      car.mesh.position.set(px, 0, pz);
      car.mesh.rotation.y = Math.atan2(track.startTangent.x, track.startTangent.z);
    }
  }

  // Input
  const keys = {};
  window.addEventListener('keydown', function (e) {
    keys[e.code] = true;
    if (e.code === 'Escape') togglePause();
    if (e.code === 'KeyR' && state === 'racing') resetCar();
  });
  window.addEventListener('keyup', function (e) {
    keys[e.code] = false;
  });

  function readInput() {
    let throttle = 0;
    let brake = 0;
    let steer = 0;
    let boost = 0;
    if (keys['KeyW'] || keys['ArrowUp']) throttle = 1;
    if (keys['KeyS'] || keys['ArrowDown']) brake = 1;
    if (keys['KeyA'] || keys['ArrowLeft']) steer += 1;
    if (keys['KeyD'] || keys['ArrowRight']) steer -= 1;
    if (keys['ShiftLeft'] || keys['ShiftRight'] || keys['Space']) boost = 1;

    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (let i = 0; pads && i < pads.length; i++) {
      const g = pads[i];
      if (!g) continue;
      const ax0 = g.axes[0] || 0;
      const ax1 = g.axes[1] || 0;
      const rt = g.buttons[7] ? g.buttons[7].value : 0;
      const aBtn = g.buttons[0] ? g.buttons[0].value : 0;
      if (Math.abs(ax0) > 0.12) steer += ax0;
      if (ax1 < -0.12) throttle = Math.max(throttle, -ax1);
      if (ax1 > 0.12) brake = Math.max(brake, ax1);
      if (rt > 0.15) throttle = Math.max(throttle, rt);
      if (aBtn > 0.2) boost = 1;
    }

    steer = Math.max(-1, Math.min(1, steer));
    return { throttle: throttle, brake: brake, steer: steer, boost: boost };
  }

  function resetCar() {
    const n = track.nearest(new THREE.Vector3(player.x, 0, player.z));
    player.x = n.point.x;
    player.z = n.point.z;
    player.heading = Math.atan2(n.tangent.x, n.tangent.z);
    player.speed = 0;
    player.steer = 0;
    player.mesh.rotation.y = player.heading;
  }

  // Race state
  let state = 'menu'; // menu | countdown | racing | finished | paused
  let raceTime = 0;
  let countdownLeft = 3;
  let lastCountdown = 0;
  let finalPosition = 0;
  let hitTimer = 0;

  const hudEl = document.getElementById('hud');
  const menuEl = document.getElementById('menu');
  const resultEl = document.getElementById('result');
  const pauseEl = document.getElementById('pause');
  const countdownEl = document.getElementById('countdown');
  const wrongwayEl = document.getElementById('wrongway');
  const hitflashEl = document.getElementById('hitflash');
  const barrierhitEl = document.getElementById('barrierhit');

  document.getElementById('startBtn').addEventListener('click', startRace);
  document.getElementById('restartBtn').addEventListener('click', startRace);
  document.getElementById('resumeBtn').addEventListener('click', resumeRace);
  document.getElementById('quitBtn').addEventListener('click', backToMenu);

  function startRace() {
    resetToStart();
    hitTimer = 0;
    hitflashEl.classList.add('hidden');
    barrierhitEl.classList.add('hidden');
    state = 'countdown';
    countdownLeft = 3;
    lastCountdown = performance.now();
    raceTime = 0;
    finalPosition = 0;
    menuEl.classList.add('hidden');
    resultEl.classList.add('hidden');
    pauseEl.classList.add('hidden');
    hudEl.classList.remove('hidden');
    countdownEl.classList.remove('hidden');
    countdownEl.textContent = '3';
    positionCameraImmediate();
  }

  function positionCameraImmediate() {
    const fx = Math.sin(player.heading);
    const fz = Math.cos(player.heading);
    camera.position.set(player.x - fx * 9.5, 3.8, player.z - fz * 9.5);
    camera.lookAt(player.x + fx * 5.5, 1.3, player.z + fz * 5.5);
    cameraFov = 60;
    camera.fov = 60;
    camera.updateProjectionMatrix();
  }

  function resumeRace() {
    state = 'racing';
    pauseEl.classList.add('hidden');
  }

  function togglePause() {
    if (state === 'racing') {
      state = 'paused';
      pauseEl.classList.remove('hidden');
    } else if (state === 'paused') {
      resumeRace();
    }
  }

  function backToMenu() {
    state = 'menu';
    hitTimer = 0;
    hitflashEl.classList.add('hidden');
    barrierhitEl.classList.add('hidden');
    pauseEl.classList.add('hidden');
    resultEl.classList.add('hidden');
    hudEl.classList.add('hidden');
    menuEl.classList.remove('hidden');
  }

  function finishPlayer() {
    if (player.finished) return;
    player.finished = true;
    player.finishTime = raceTime;
    const myProgress = player.lap * track.totalLength;
    let behind = 0;
    ais.forEach(function (ai) {
      if (ai.trackPos > myProgress) behind++;
    });
    finalPosition = behind + 1;
    state = 'finished';
    hudEl.classList.add('hidden');
    resultEl.classList.remove('hidden');
    document.getElementById('resultTitle').textContent =
      finalPosition === 1 ? '冠军!' : '第 ' + finalPosition + ' 名';
    document.getElementById('resultStats').textContent =
      '总用时 ' + formatTime(raceTime) + ' · 完成 3 圈';
  }

  function formatTime(t) {
    const m = Math.floor(t / 60);
    const s = t - m * 60;
    return String(m).padStart(2, '0') + ':' + s.toFixed(1).padStart(4, '0');
  }

  // Update
  function update(dt) {
    if (state === 'countdown') {
      const now = performance.now();
      const elapsed = (now - lastCountdown) / 1000;
      const val = 3 - Math.floor(elapsed);
      if (val > 0) {
        countdownEl.textContent = String(val);
      } else if (val <= 0 && countdownLeft > 0) {
        countdownEl.textContent = 'GO!';
        state = 'racing';
        setTimeout(function () { countdownEl.classList.add('hidden'); }, 700);
      }
      return;
    }

    if (state !== 'racing' && state !== 'finished') return;

    if (state === 'racing') raceTime += dt;
    else if (state === 'finished') {
      // Let AI keep rolling for a moment behind the results screen.
      raceTime += dt;
    }

    const input = readInput();

    // --- Player physics ---
    const n = track.nearest(new THREE.Vector3(player.x, 0, player.z));
    const onRoad = Math.abs(n.lateral) <= track.roadHalf;

    let dragFactor = 1 - DRAG * dt;
    if (!onRoad) dragFactor -= 1.7 * dt;
    player.speed *= Math.max(0, dragFactor);

    const boosting = input.boost > 0 && player.nitro > 0 && player.speed >= 0;
    if (boosting) {
      player.nitro = Math.max(0, player.nitro - NITRO_DRAIN * dt);
    } else {
      player.nitro = Math.min(NITRO_MAX, player.nitro + NITRO_REGEN * dt);
    }

    if (input.throttle > 0) {
      player.speed += ACCEL * (boosting ? BOOST_ACCEL : 1) * input.throttle * dt;
    }
    if (input.brake > 0) {
      if (player.speed > 0.4) player.speed -= BRAKE * input.brake * dt;
      else if (player.speed > 0) player.speed = 0;
      else player.speed -= REVERSE_ACCEL * input.brake * dt;
    }

    const speedLimit = onRoad ? MAX_SPEED * (boosting ? BOOST_MULT : 1) : MAX_SPEED * 0.55;
    player.speed = Math.max(REVERSE_MAX, Math.min(speedLimit, player.speed));

    const speedFactor = Math.min(1, Math.abs(player.speed) / 12);
    const dir = player.speed >= 0 ? 1 : -1;
    player.steer += (input.steer - player.steer) * Math.min(1, dt * 12);
    player.heading += player.steer * STEER_RATE * speedFactor * dir * dt;

    player.x += Math.sin(player.heading) * player.speed * dt;
    player.z += Math.cos(player.heading) * player.speed * dt;

    // Barrier clamp
    // Keep the car from visibly clipping through the boundary walls.
    const limit = track.curbHalf - 0.6;
    if (n.lateral > limit) {
      player.x -= n.left.x * (n.lateral - limit);
      player.z -= n.left.z * (n.lateral - limit);
      player.speed *= 0.86;
      hitTimer = 0.35;
    } else if (n.lateral < -limit) {
      const over = n.lateral + limit;
      player.x -= n.left.x * over;
      player.z -= n.left.z * over;
      player.speed *= 0.86;
      hitTimer = 0.35;
    }

    player.mesh.position.set(player.x, 0, player.z);
    player.mesh.rotation.y = player.heading;

    // --- Lap tracking ---
    const c1 = track.checkpoints[1];
    const c2 = track.checkpoints[2];
    const idx = n.index;
    if (Math.abs(idx - c1) <= 6) player.cp1 = true;
    if (Math.abs(idx - c2) <= 6) player.cp2 = true;
    if (player.prevIdx - idx > track.N * 0.5) {
      if (player.cp1 && player.cp2) {
        player.lap++;
        player.cp1 = false;
        player.cp2 = false;
      }
    } else if (idx - player.prevIdx > track.N * 0.5) {
      player.lap = Math.max(0, player.lap - 1);
    }
    player.prevIdx = idx;
    player.cum = n.cum;

    if (player.lap >= TOTAL_LAPS) finishPlayer();

    // --- AI update ---
    ais.forEach(function (ai) {
      AI.update(ai, dt, track, allCars, raceTime);
    });

    // --- Collisions ---
    ais.forEach(function (ai) {
      const dx = player.x - ai.mesh.position.x;
      const dz = player.z - ai.mesh.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      const minDist = 2.2;
      if (dist < minDist && dist > 0.0001) {
        const nx = dx / dist;
        const nz = dz / dist;
        const push = (minDist - dist) * 0.5;
        player.x += nx * push;
        player.z += nz * push;
        player.speed *= 0.92;
        ai.speed = Math.min(ai.speed, player.speed + 1);
      }
    });

    // --- Wheel visuals for player ---
    const wheelSpin = (player.speed * dt) / 0.42;
    player.mesh.userData.tires.forEach(function (w) { w.rotation.x += wheelSpin; });
    player.mesh.userData.frontWheels.forEach(function (w) {
      w.rotation.y = player.steer * 0.45;
    });

    // --- Wrong way indicator ---
    const velx = Math.sin(player.heading) * player.speed;
    const velz = Math.cos(player.heading) * player.speed;
    const along = velx * n.tangent.x + velz * n.tangent.z;
    if (along < -2 && Math.abs(player.speed) > 2) {
      wrongwayEl.classList.remove('hidden');
    } else {
      wrongwayEl.classList.add('hidden');
    }

    // Wall hit feedback
    hitTimer = Math.max(0, hitTimer - dt);
    const hitting = hitTimer > 0;
    hitflashEl.classList.toggle('hidden', !hitting);
    barrierhitEl.classList.toggle('hidden', !hitting);

    // --- Camera ---
    const fx = Math.sin(player.heading);
    const fz = Math.cos(player.heading);
    const shake = hitTimer > 0 ? hitTimer * 0.9 : 0;
    const desired = new THREE.Vector3(
      player.x - fx * 9.5 + (Math.random() - 0.5) * shake,
      3.8 + (Math.random() - 0.5) * shake * 0.6,
      player.z - fz * 9.5 + (Math.random() - 0.5) * shake
    );
    camera.position.lerp(desired, 1 - Math.exp(-5.5 * dt));
    const look = new THREE.Vector3(player.x + fx * 5.5, 1.3, player.z + fz * 5.5);
    camera.lookAt(look);
    const targetFov = boosting ? 67 : 60;
    cameraFov += (targetFov - cameraFov) * Math.min(1, dt * 6);
    camera.fov = cameraFov;
    camera.updateProjectionMatrix();

    updateHUD();
    updateMinimap();
  }

  function updateHUD() {
    const speedKmh = Math.round(Math.abs(player.speed) * 3.6);
    document.getElementById('hud-speed').textContent = String(speedKmh);
    document.getElementById('hud-lap').textContent = String(Math.min(player.lap + 1, TOTAL_LAPS));

    const myProgress = player.lap * track.totalLength + player.cum;
    let pos = 1;
    ais.forEach(function (ai) {
      if (ai.trackPos > myProgress) pos++;
    });
    document.getElementById('hud-pos').textContent = String(pos);
    document.getElementById('hud-time').textContent = formatTime(raceTime);
    const nitroPct = Math.round(player.nitro);
    document.getElementById('nitro-fill').style.width = nitroPct + '%';
    document.getElementById('nitro-val').textContent = String(nitroPct);
  }

  // Minimap
  const minimap = document.getElementById('minimap');
  const mmCtx = minimap.getContext('2d');
  let mmScale = 1;
  let mmOffX = 0;
  let mmOffY = 0;

  function prepareMinimap() {
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    track.centerline.forEach(function (p) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.z < minZ) minZ = p.z;
      if (p.z > maxZ) maxZ = p.z;
    });
    const w = minimap.width;
    const h = minimap.height;
    const pad = 30;
    mmScale = Math.min((w - pad * 2) / (maxX - minX), (h - pad * 2) / (maxZ - minZ));
    mmOffX = (w - (maxX - minX) * mmScale) / 2 - minX * mmScale;
    mmOffY = (h - (maxZ - minZ) * mmScale) / 2 - minZ * mmScale;
  }

  function updateMinimap() {
    mmCtx.clearRect(0, 0, minimap.width, minimap.height);
    mmCtx.beginPath();
    track.centerline.forEach(function (p, i) {
      const x = p.x * mmScale + mmOffX;
      const y = p.z * mmScale + mmOffY;
      if (i === 0) mmCtx.moveTo(x, y);
      else mmCtx.lineTo(x, y);
    });
    mmCtx.closePath();
    mmCtx.strokeStyle = 'rgba(255,255,255,0.85)';
    mmCtx.lineWidth = 4;
    mmCtx.stroke();

    // start line
    const sp = track.centerline[0];
    mmCtx.fillStyle = '#ffffff';
    mmCtx.fillRect(sp.x * mmScale + mmOffX - 2, sp.z * mmScale + mmOffY - 2, 5, 5);

    ais.forEach(function (ai) {
      const x = ai.mesh.position.x * mmScale + mmOffX;
      const y = ai.mesh.position.z * mmScale + mmOffY;
      mmCtx.fillStyle = '#' + ai.mesh.userData.color.toString(16).padStart(6, '0');
      mmCtx.beginPath();
      mmCtx.arc(x, y, 4, 0, Math.PI * 2);
      mmCtx.fill();
    });

    const mx = player.x * mmScale + mmOffX;
    const my = player.z * mmScale + mmOffY;
    mmCtx.save();
    mmCtx.translate(mx, my);
    mmCtx.rotate(Math.PI - player.heading);
    mmCtx.fillStyle = '#ffffff';
    mmCtx.beginPath();
    mmCtx.moveTo(0, -9);
    mmCtx.lineTo(7, 7);
    mmCtx.lineTo(-7, 7);
    mmCtx.closePath();
    mmCtx.fill();
    mmCtx.restore();
  }

  // Resize
  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  // Main loop
  const clock = new THREE.Clock();
  function loop() {
    requestAnimationFrame(loop);
    const dt = Math.min(0.05, clock.getDelta());
    update(dt);
    renderer.render(scene, camera);
  }

  resetToStart();
  prepareMinimap();
  updateHUD();
  updateMinimap();

  // Verification / auto-start mode: `?auto` skips the menu and begins racing.
  if (/[?&]auto/.test(location.search)) {
    menuEl.classList.add('hidden');
    hudEl.classList.remove('hidden');
    state = 'racing';
    positionCameraImmediate();
  }

  if (/[?&]debug/.test(location.search)) {
    setTimeout(function () {
      renderer.render(scene, camera);
      const gl = renderer.getContext();
      const w = gl.drawingBufferWidth;
      const h = gl.drawingBufferHeight;
      let sky = 0, grass = 0, road = 0, red = 0, other = 0;
      const buf = new Uint8Array(w * h * 4);
      gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, buf);
      const step = 8;
      for (let y = 0; y < h; y += step) {
        for (let x = 0; x < w; x += step) {
          const i = (y * w + x);
          const r = buf[i * 4], g = buf[i * 4 + 1], b = buf[i * 4 + 2], a = buf[i * 4 + 3];
        if (a === 0) sky++;
        else if (g > r + 20 && g > b + 20) grass++;
        else if (r > 110 && r > g * 1.5 && r > b * 1.5) red++;
        else if (Math.abs(r - g) < 22 && Math.abs(g - b) < 22 && r > 40) road++;
        else other++;
        }
      }
      console.log('DBG sky=' + sky + ' grass=' + grass + ' road=' + road + ' red=' + red + ' other=' + other);
      console.log('DBG track len=' + track.totalLength.toFixed(0) +
        ' curvMean=' + track.curvatureStats.mean.toFixed(4) +
        ' curvMax=' + track.curvatureStats.max.toFixed(4));
      let mi = 0;
      for (let i = 0; i < track.curvature.length; i++) {
        if (track.curvature[i] > track.curvature[mi]) mi = i;
      }
      const cp = track.centerline;
      const cpi = cp[mi];
      const cprev = cp[(mi - 3 + track.N) % track.N];
      const cnext = cp[(mi + 3) % track.N];
      console.log('DBG maxCurv idx=' + mi +
        ' p=' + cpi.x.toFixed(1) + ',' + cpi.z.toFixed(1) +
        ' prev=' + cprev.x.toFixed(1) + ',' + cprev.z.toFixed(1) +
        ' next=' + cnext.x.toFixed(1) + ',' + cnext.z.toFixed(1));
    }, 1200);

    setTimeout(function () {
      const before = player.x.toFixed(1) + ',' + player.z.toFixed(1);
      const ai0 = ais.map(function (a) { return a.trackPos.toFixed(1); }).join(',');
      keys['KeyW'] = true;
      setTimeout(function () {
        const after = player.x.toFixed(1) + ',' + player.z.toFixed(1);
        const ai1 = ais.map(function (a) { return a.trackPos.toFixed(1); }).join(',');
        const speedW = player.speed;
        keys['ShiftLeft'] = true;
        setTimeout(function () {
          keys['ShiftLeft'] = false;
          keys['KeyW'] = false;
          console.log('DBG move player ' + before + ' -> ' + after + ' speedW=' + speedW.toFixed(1));
          console.log('DBG move ai ' + ai0 + ' -> ' + ai1);
          console.log('DBG boost speedB=' + player.speed.toFixed(1) + ' nitro=' + player.nitro.toFixed(1));
        }, 800);
      }, 800);
    }, 1000);
  }

  loop();
})();
