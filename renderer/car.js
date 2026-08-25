(function () {
  'use strict';

  function makeNumberTexture(num) {
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 128;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.fillStyle = 'rgba(250,250,250,0.95)';
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(24, 24, 80, 80, 18) : ctx.rect(24, 24, 80, 80);
    ctx.fill();
    ctx.fillStyle = '#12161b';
    ctx.font = 'bold 58px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(num), 64, 70);
    return c;
  }

  function bodyShape(front, rear, half, noseIn) {
    const s = new THREE.Shape();
    s.moveTo(-half, -front);
    s.lineTo(-half, -rear + 0.42);
    s.quadraticCurveTo(-half, rear, -half + 0.52, rear);
    s.quadraticCurveTo(0, rear + 0.32, half - 0.52, rear);
    s.quadraticCurveTo(half, rear, half, rear - 0.42);
    s.lineTo(half, -front + 0.6);
    s.quadraticCurveTo(half, -front, half - noseIn, -front - 0.16);
    s.quadraticCurveTo(0, -front - 0.3, -half + noseIn, -front - 0.16);
    s.quadraticCurveTo(-half, -front, -half, -front + 0.6);
    s.closePath();
    return s;
  }

  function createCarMesh(color, number) {
    const group = new THREE.Group();

    const bodyMat = new THREE.MeshPhongMaterial({
      color: color,
      shininess: 110,
      specular: 0x303030,
      side: THREE.DoubleSide
    });
    const glassMat = new THREE.MeshPhongMaterial({
      color: 0x14222e,
      shininess: 150,
      specular: 0x93aabb,
      side: THREE.DoubleSide
    });
    const darkMat = new THREE.MeshPhongMaterial({ color: 0x14181e, shininess: 25 });
    const tireMat = new THREE.MeshPhongMaterial({ color: 0x0c0e11, shininess: 12 });
    const rimMat = new THREE.MeshPhongMaterial({
      color: 0xdfe3e7,
      shininess: 120,
      specular: 0xffffff
    });
    const metalMat = new THREE.MeshPhongMaterial({ color: 0x8f969d, shininess: 80 });

    // Wheels: outer group steers, inner tire/rim mesh spins around the axle.
    const tireGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.32, 18);
    tireGeo.rotateZ(Math.PI / 2);
    const rimGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.33, 10);
    rimGeo.rotateZ(Math.PI / 2);
    const frontWheels = [];
    const rearWheels = [];
    const tires = [];
    const wheelDefs = [
      [-0.98, 1.42], [0.98, 1.42], [-0.98, -1.42], [0.98, -1.42]
    ];
    wheelDefs.forEach(function (wd, idx) {
      const steer = new THREE.Group();
      const tire = new THREE.Mesh(tireGeo, tireMat);
      const rim = new THREE.Mesh(rimGeo, rimMat);
      steer.add(tire);
      steer.add(rim);
      steer.position.set(wd[0], 0.4, wd[1]);
      group.add(steer);
      tires.push(tire);
      if (idx < 2) frontWheels.push(steer);
      else rearWheels.push(steer);
    });

    // Streamlined body from a top-down silhouette
    const bodyGeo = new THREE.ExtrudeGeometry(bodyShape(2.02, 2.02, 0.94, 0.68), {
      depth: 0.5,
      bevelEnabled: true,
      bevelThickness: 0.06,
      bevelSize: 0.06,
      bevelSegments: 3,
      curveSegments: 14
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.rotation.x = -Math.PI / 2;
    body.position.y = 0.46;
    group.add(body);

    // Cabin glass
    const cabinGeo = new THREE.ExtrudeGeometry(bodyShape(1.18, 0.95, 0.64, 0.45), {
      depth: 0.34,
      bevelEnabled: true,
      bevelThickness: 0.04,
      bevelSize: 0.04,
      bevelSegments: 2,
      curveSegments: 12
    });
    const cabin = new THREE.Mesh(cabinGeo, glassMat);
    cabin.rotation.x = -Math.PI / 2;
    cabin.position.set(0, 0.9, -0.22);
    group.add(cabin);

    // Roof stripe and race number
    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.055, 1.4),
      darkMat
    );
    roof.position.set(0, 1.29, -0.22);
    group.add(roof);
    const numberTex = new THREE.CanvasTexture(makeNumberTexture(number || 7));
    numberTex.encoding = THREE.sRGBEncoding;
    const numberPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(0.9, 0.9),
      new THREE.MeshBasicMaterial({
        map: numberTex,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide
      })
    );
    numberPlane.rotation.x = -Math.PI / 2;
    numberPlane.position.set(0, 1.295, -0.22);
    numberPlane.renderOrder = 1;
    group.add(numberPlane);

    // Front grille and splitter
    const grille = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.18, 0.08), darkMat);
    grille.position.set(0, 0.58, 2.16);
    group.add(grille);
    const splitter = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.15, 0.6), darkMat);
    splitter.position.set(0, 0.18, 2.2);
    group.add(splitter);

    // Side skirts
    [[-0.93], [0.93]].forEach(function (side) {
      const skirt = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.2, 3.2), darkMat);
      skirt.position.set(side[0], 0.32, -0.1);
      group.add(skirt);
    });

    // Side mirrors
    [[-1.03, 0.95], [1.03, 0.95]].forEach(function (m) {
      const stem = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.12, 0.12), darkMat);
      stem.position.set(m[0] * 0.92, 0.9, m[1]);
      group.add(stem);
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.14), bodyMat);
      head.position.set(m[0], 0.94, m[1] + 0.06);
      group.add(head);
    });

    // Rear diffuser and exhausts
    const diffuser = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.16, 0.5), darkMat);
    diffuser.position.set(0, 0.24, -2.14);
    group.add(diffuser);
    const exhaustGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.22, 10);
    exhaustGeo.rotateX(Math.PI / 2);
    [[-0.42], [0.42]].forEach(function (ex) {
      const exhaust = new THREE.Mesh(exhaustGeo, metalMat);
      exhaust.position.set(ex[0], 0.28, -2.26);
      group.add(exhaust);
    });

    // Spoiler with endplates
    const wing = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.1, 0.62), bodyMat);
    wing.position.set(0, 1.08, -2.3);
    group.add(wing);
    [[-0.98], [0.98]].forEach(function (side) {
      const plate = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.3, 0.68), darkMat);
      plate.position.set(side[0], 1.08, -2.3);
      group.add(plate);
    });
    const strutL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.42, 0.3), darkMat);
    strutL.position.set(-0.6, 0.88, -2.32);
    group.add(strutL);
    const strutR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.42, 0.3), darkMat);
    strutR.position.set(0.6, 0.88, -2.32);
    group.add(strutR);

    // Lights
    const headMat = new THREE.MeshBasicMaterial({ color: 0xfff7d8 });
    const tailMat = new THREE.MeshBasicMaterial({ color: 0xff2a32 });
    [[-0.7, 2.14], [0.7, 2.14]].forEach(function (p) {
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.1, 0.06), headMat);
      head.position.set(p[0], 0.58, p[1]);
      group.add(head);
    });
    [[-0.65, -2.14], [0.65, -2.14]].forEach(function (p) {
      const tail = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.12, 0.06), tailMat);
      tail.position.set(p[0], 0.62, p[1]);
      group.add(tail);
    });

    group.userData.frontWheels = frontWheels;
    group.userData.rearWheels = rearWheels;
    group.userData.tires = tires;
    group.userData.color = color;
    return group;
  }

  window.createCarMesh = createCarMesh;
})();
