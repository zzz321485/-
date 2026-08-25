(function () {
  'use strict';

  function createAI(color, trackPos, laneOffset, baseSpeed, number) {
    return {
      mesh: createCarMesh(color, number),
      trackPos: trackPos,
      laneOffset: laneOffset,
      baseSpeed: baseSpeed,
      speed: 0,
      lap: 0,
      finished: false,
      finishTime: 0
    };
  }

  function updateAI(ai, dt, track, cars, raceTime) {
    const curvature = Math.abs(track.curvatureAt(ai.trackPos));
    let target = ai.baseSpeed - curvature * 26;
    target = Math.max(8, Math.min(ai.baseSpeed, target));

    // Basic following: ease off if another car is directly ahead.
    const forward = new THREE.Vector3(Math.sin(ai.mesh.rotation.y), 0, Math.cos(ai.mesh.rotation.y));
    for (let i = 0; i < cars.length; i++) {
      const o = cars[i];
      if (o === ai || !o.mesh) continue;
      const dx = o.mesh.position.x - ai.mesh.position.x;
      const dz = o.mesh.position.z - ai.mesh.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 5.5) {
        const ahead = (dx * forward.x + dz * forward.z) / Math.max(0.001, dist);
        if (ahead > 0.55) {
          target = Math.min(target, Math.max(5, o.speed * 0.8));
        }
      }
    }

    if (ai.speed < target) {
      ai.speed = Math.min(target, ai.speed + 14 * dt);
    } else {
      ai.speed = Math.max(target, ai.speed - 26 * dt);
    }

    ai.trackPos += ai.speed * dt;
    const L = track.totalLength;
    ai.lap = Math.floor(ai.trackPos / L);

    const s = track.sampleAt(ai.trackPos);
    const left = new THREE.Vector3(-s.tangent.z, 0, s.tangent.x);
    ai.mesh.position.set(
      s.pos.x + left.x * ai.laneOffset,
      0,
      s.pos.z + left.z * ai.laneOffset
    );
    ai.mesh.rotation.y = Math.atan2(s.tangent.x, s.tangent.z);

    // Wheel visuals
    const spin = (ai.speed * dt) / 0.38;
    ai.mesh.userData.tires.forEach(function (w) { w.rotation.x += spin; });

    if (!ai.finished && ai.lap >= 3) {
      ai.finished = true;
      ai.finishTime = raceTime;
    }
  }

  window.AI = { create: createAI, update: updateAI };
})();
