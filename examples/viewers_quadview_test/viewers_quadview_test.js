/* globals Stats, dat*/

import CamerasOrthographic from 'base/cameras/cameras.orthographic';
import ControlsOrthographic from 'base/controls/controls.trackballortho';
import ControlsTrackball from 'base/controls/controls.trackball';
import CoreUtils from 'base/core/core.utils';
import HelpersBoundingBox from 'base/helpers/helpers.boundingbox';
import HelpersContour from 'base/helpers/helpers.contour';
import HelpersLocalizer from 'base/helpers/helpers.localizer';
import HelpersStack from 'base/helpers/helpers.stack';
import LoadersVolume from 'base/loaders/loaders.volume';
import {file, colors} from './utils';

// standard global variables
let stats;
let ready = false;
let isRender = true;

let redContourHelper = null;
let redTextureTarget = null;
let redContourScene = null;
let group = new THREE.Group();

// // 3d renderer
// const r0 = {
//   domId: 'r0',
//   domElement: null,
//   renderer: null,
//   color: 0x212121,
//   targetID: 0,
//   camera: null,
//   controls: null,
//   scene: null,
//   light: null,
// };

// 2d free plane renderer
const r0 = {
  domId: 'r0',
  domElement: null,
  renderer: null,
  color: 0x121212,
  sliceOrientation: 'axial',
  sliceColor: 0xff1744,
  targetID: 0,
  camera: null,
  controls: null,
  scene: null,
  light: null,
  stackHelper: null,
  localizerHelper: null,
  localizerScene: null,
};


// 2d axial renderer
const r1 = {
  domId: 'r1',
  domElement: null,
  renderer: null,
  color: 0x121212,
  sliceOrientation: 'axial',
  sliceColor: 0xff1744,
  targetID: 1,
  camera: null,
  controls: null,
  scene: null,
  light: null,
  stackHelper: null,
  localizerHelper: null,
  localizerScene: null,
};

// 2d sagittal renderer
const r2 = {
  domId: 'r2',
  domElement: null,
  renderer: null,
  color: 0x121212,
  sliceOrientation: 'sagittal',
  sliceColor: 0xffea00,
  targetID: 2,
  camera: null,
  controls: null,
  scene: null,
  light: null,
  stackHelper: null,
  localizerHelper: null,
  localizerScene: null,
};

// 2d coronal renderer
const r3 = {
  domId: 'r3',
  domElement: null,
  renderer: null,
  color: 0x121212,
  sliceOrientation: 'coronal',
  sliceColor: 0x76ff03,
  targetID: 3,
  camera: null,
  controls: null,
  scene: null,
  light: null,
  stackHelper: null,
  localizerHelper: null,
  localizerScene: null,
};

function initRendererOblique(rendererObj) {
  // renderer
  rendererObj.domElement = document.getElementById(rendererObj.domId);
  rendererObj.renderer = new THREE.WebGLRenderer({
    antialias: true,
  });
  rendererObj.renderer.powerPreference = 'high-performance';
  rendererObj.renderer.autoClear = false;
  rendererObj.renderer.localClippingEnabled = false;
  rendererObj.renderer.setSize(
    rendererObj.domElement.clientWidth,
    rendererObj.domElement.clientHeight
  );
  rendererObj.renderer.setClearColor(0x121212, 1);
  rendererObj.renderer.domElement.id = rendererObj.targetID;
  rendererObj.domElement.appendChild(rendererObj.renderer.domElement);

  // camera
  rendererObj.camera = new THREE.PerspectiveCamera(
    45,
    rendererObj.domElement.clientWidth / rendererObj.domElement.clientHeight,
    0.1,
    100000
  );
  rendererObj.camera.position.x = 250;
  rendererObj.camera.position.y = 250;
  rendererObj.camera.position.z = 250;

  // // controls
  // rendererObj.controls = new ControlsTrackball(rendererObj.camera, rendererObj.domElement);
  // rendererObj.controls.rotateSpeed = 5.5;
  // rendererObj.controls.zoomSpeed = 1.2;
  // rendererObj.controls.panSpeed = 0.8;
  // rendererObj.controls.staticMoving = true;
  // rendererObj.controls.dynamicDampingFactor = 0.3;

  // scene
  rendererObj.scene = new THREE.Scene();

  // stats
  stats = new Stats();
  rendererObj.domElement.appendChild(stats.domElement);
}

function initHelpersStackOblique(rendererObj, stack){
  rendererObj.stackHelper = new HelpersStack(stack);
  const centerLPS = rendererObj.stackHelper.stack.worldCenter();
  rendererObj.stackHelper.bbox.visible = false;
  rendererObj.stackHelper.borderColor = rendererObj.sliceColor;
  rendererObj.stackHelper.slice.aabbSpace = 'LPS';
  rendererObj.stackHelper.slice.planePosition.x = centerLPS.x;
  rendererObj.stackHelper.slice.planePosition.y = centerLPS.y;
  rendererObj.stackHelper.slice.planePosition.z = centerLPS.z;
  rendererObj.stackHelper.slice.canvasWidth = rendererObj.domElement.clientWidth;
  rendererObj.stackHelper.slice.canvasHeight = rendererObj.domElement.clientHeight;
  rendererObj.stackHelper.slice.intensityAuto = false;
  rendererObj.stackHelper.slice.draw = true;
  
  rendererObj.camera.lookAt(centerLPS.x, centerLPS.y, centerLPS.z);



  // set camera
  let worldbb = stack.worldBoundingBox();
  let lpsDims = new THREE.Vector3(
    (worldbb[1] - worldbb[0]) / 2,
    (worldbb[3] - worldbb[2]) / 2,
    (worldbb[5] - worldbb[4]) / 2
  );


  rendererObj.stackHelper.orientation = rendererObj.camera.stackOrientation;
  rendererObj.stackHelper.index = Math.floor(rendererObj.stackHelper.orientationMaxIndex / 2);
  rendererObj.scene.add(rendererObj.stackHelper);
}

function initRenderer2D(rendererObj) {
  // renderer
  rendererObj.domElement = document.getElementById(rendererObj.domId);
  rendererObj.renderer = new THREE.WebGLRenderer({
    antialias: true,
  });
  rendererObj.renderer.autoClear = false;
  rendererObj.renderer.localClippingEnabled = true;
  rendererObj.renderer.setSize(
    rendererObj.domElement.clientWidth,
    rendererObj.domElement.clientHeight
  );
  rendererObj.renderer.setClearColor(0x121212, 1);
  rendererObj.renderer.domElement.id = rendererObj.targetID;
  rendererObj.domElement.appendChild(rendererObj.renderer.domElement);

  // camera
  rendererObj.camera = new CamerasOrthographic(
    rendererObj.domElement.clientWidth / -2,
    rendererObj.domElement.clientWidth / 2,
    rendererObj.domElement.clientHeight / 2,
    rendererObj.domElement.clientHeight / -2,
    1,
    1000
  );

  // controls
  rendererObj.controls = new ControlsOrthographic(rendererObj.camera, rendererObj.domElement);
  rendererObj.controls.staticMoving = true;
  rendererObj.controls.noRotate = false;
  rendererObj.controls.noPan = true;
  rendererObj.camera.controls = rendererObj.controls;

  // scene
  rendererObj.scene = new THREE.Scene();
}

function initHelpersStack(rendererObj, stack) {
  rendererObj.stackHelper = new HelpersStack(stack);
  rendererObj.stackHelper.bbox.visible = false;
  rendererObj.stackHelper.borderColor = rendererObj.sliceColor;
  rendererObj.stackHelper.slice.canvasWidth = rendererObj.domElement.clientWidth;
  rendererObj.stackHelper.slice.canvasHeight = rendererObj.domElement.clientHeight;
  rendererObj.stackHelper.slice.intensityAuto = false;
  rendererObj.stackHelper.slice.draw = true;


  // set camera
  let worldbb = stack.worldBoundingBox();
  let lpsDims = new THREE.Vector3(
    (worldbb[1] - worldbb[0]) / 2,
    (worldbb[3] - worldbb[2]) / 2,
    (worldbb[5] - worldbb[4]) / 2
  );

  // box: {halfDimensions, center}
  let box = {
    center: stack.worldCenter().clone(),
    halfDimensions: new THREE.Vector3(lpsDims.x + 10, lpsDims.y + 10, lpsDims.z + 10),
  };

  // init and zoom
  let canvas = {
    width: rendererObj.domElement.clientWidth,
    height: rendererObj.domElement.clientHeight,
  };
  rendererObj.camera.directions = [stack.xCosine, stack.yCosine, stack.zCosine];
  rendererObj.camera.box = box;
  rendererObj.camera.canvas = canvas;
  rendererObj.camera.orientation = rendererObj.sliceOrientation;
  rendererObj.camera.update();
  rendererObj.camera.fitBox(2, 1);

  rendererObj.stackHelper.orientation = rendererObj.camera.stackOrientation;
  rendererObj.stackHelper.index = Math.floor(rendererObj.stackHelper.orientationMaxIndex / 2);
  rendererObj.scene.add(rendererObj.stackHelper);


}

function initHelpersLocalizer(rendererObj, stack, referencePlane, localizers) {
  rendererObj.localizerHelper = new HelpersLocalizer(
    stack,
    rendererObj.stackHelper.slice.geometry,
    referencePlane
  );

  for (let i = 0; i < localizers.length; i++) {
    rendererObj.localizerHelper['plane' + (i + 1)] = localizers[i].plane;
    rendererObj.localizerHelper['color' + (i + 1)] = localizers[i].color;
  }

  rendererObj.localizerHelper.canvasWidth = rendererObj.domElement.clientWidth;
  rendererObj.localizerHelper.canvasHeight = rendererObj.domElement.clientHeight;

  rendererObj.localizerScene = new THREE.Scene();
  rendererObj.localizerScene.add(rendererObj.localizerHelper);
}
// line constructor
function initLine (stackHelper, scene) {
  if (stackHelper) {
    const materialLine = new THREE.LineBasicMaterial({
      color: colors.green
    });
    const geometryLine = new THREE.Geometry();          
    // //test line
    // geometryLine.vertices.push(new THREE.Vector3(-120,-110,-53.75));
    // geometryLine.vertices.push(new THREE.Vector3(120,110,-53.75));
    stackHelper.slice.line = new THREE.Line(geometryLine, materialLine);
    stackHelper.slice.line.geometry.dispose();
    stackHelper.slice.line.material.dispose();    
    stackHelper.slice.line.material.depthTest = false; // always show line on top
    stackHelper.slice.line.geometry.verticesNeedUpdate = true;
    scene.add(stackHelper.slice.line);        
  }
} 

function changePlane(rendererObj, line, planeDirection, currentPlaneDirection){
  isRender = true;

  //update plane position and direction
  rendererObj.stackHelper.slice.planePosition = line.geometry.vertices[1];  
  rendererObj.stackHelper.slice.planeDirection = planeDirection;
  rendererObj.stackHelper.slice.geometry.computeBoundingBox();
  rendererObj.stackHelper.slice.geometry.boundingBox.getCenter(rendererObj.stackHelper.slice.planePosition);
  console.log('planeDir@changePlane ' + rendererObj.stackHelper.slice.planeDirection.toArray());
  //update plane border
  rendererObj.stackHelper.border.helpersSlice = rendererObj.stackHelper.slice;
  // let particleLight = new THREE.Mesh(
  //   new THREE.SphereGeometry(2, 8, 8),
  //   new THREE.MeshBasicMaterial({ color: 0xfff336 })
  // );
  // particleLight.position.copy(rendererObj.stackHelper.slice.planePosition);
  // rendererObj.scene.add(particleLight);
  //update camera
  updateObliqueCamera(rendererObj, line, currentPlaneDirection);
}

function calculateLineVector(line){
  let lineVector = new THREE.Vector3();
  lineVector.subVectors(line.geometry.vertices[1], line.geometry.vertices[0]).normalize();
  return lineVector;
}

function updateObliqueCamera(rendererObj, line, currentPlaneDirection){
  // update camera to face the new plane
  let bboxMax = rendererObj.stackHelper.slice.geometry.boundingBox.max.toArray();
  let distanceToPlane = Math.max(...bboxMax)*1.1 / Math.tan(Math.PI * rendererObj.camera.fov / 360);
  let cameraPos = new THREE.Vector3();
  cameraPos.addVectors(rendererObj.stackHelper.slice.planePosition, rendererObj.stackHelper.slice.planeDirection.multiplyScalar(distanceToPlane));
  rendererObj.camera.position.copy(cameraPos);
  let planeDirectionArr = currentPlaneDirection.toArray();
  let planeDirectionMaxElement = planeDirectionArr.indexOf(Math.max(...planeDirectionArr));
  //console.log('plane pos ' + CoreUtils.worldToData(rendererObj.stackHelper.stack.lps2IJK, rendererObj.stackHelper.slice.planePosition).toArray());
  //console.log('border pos ' + Math.max(...bboxMax));
  switch (planeDirectionMaxElement) {
    case 0:
      console.log('sagittal');
      //rendererObj.camera.up = new THREE.Vector3().crossVectors(calculateLineVector(line), currentPlaneDirection);
      rendererObj.camera.up = calculateLineVector(line).negate();
      break;
    case 1:
      console.log('coronal');
      //rendererObj.camera.up = new THREE.Vector3().crossVectors(calculateLineVector(line), planeDirection);
      let corVector = new THREE.Vector3().crossVectors(calculateLineVector(line), rendererObj.stackHelper.slice.planeDirection);
      rendererObj.camera.up = corVector.setX(-corVector.getComponent(0));
      break;
    case 2:
      console.log('axial');
      //rendererObj.camera.up = calculateLineVector(line);
      rendererObj.camera.up = currentPlaneDirection;
    break;
  }
  rendererObj.camera.lookAt(rendererObj.stackHelper.slice.planePosition); // use in case renderer has no controls method
  //rendererObj.controls.target = rendererObj.stackHelper.slice.planePosition; // use in case renderer has controls method

}

function calculateObliquePlane(line, currentPlaneDir){
  // the goal is to determine the oblique plane's direction
  // receive reference line then compute the dot product of that line's vector with the current plane direction

  //calculate oblique plane direction
  let planeDir = new THREE.Vector3();
  planeDir.crossVectors(calculateLineVector(line), currentPlaneDir.normalize());
  console.log('curPlaneDir ' + currentPlaneDir.toArray());
  console.log('planeDir ' + planeDir.toArray());
  return planeDir;
}

function calculateOffset(line, currentPlaneCenterPos){
  let lineMath = new THREE.Line3(line.geometry.vertices[0], line.geometry.vertices[1]);
  let C = new THREE.Vector3(); //closest point in line

  // calculate C
  lineMath.closestPointToPoint(currentPlaneCenterPos, false, C);

  let distance = currentPlaneCenterPos.distanceTo(C);
  console.log('distance ' + distance);
}
function render() {
  // we are ready when both meshes have been loaded
  if (ready) {
    // render
    //r0.controls.update();
    r1.controls.update();
    r2.controls.update();
    r3.controls.update();

    //r0.light.position.copy(r0.camera.position);
    if (isRender) {

      // r0
      r0.renderer.clear();
      r0.renderer.render(r0.scene, r0.camera);

      // r1
      r1.renderer.clear();
      r1.renderer.render(r1.scene, r1.camera);
  
      // localizer
      r1.renderer.clearDepth();
      r1.renderer.render(r1.localizerScene, r1.camera);
  
      // r2
      r2.renderer.clear();
      r2.renderer.render(r2.scene, r2.camera);

      // localizer
      r2.renderer.clearDepth();
      r2.renderer.render(r2.localizerScene, r2.camera);
  
      // r3
      r3.renderer.clear();
      r3.renderer.render(r3.scene, r3.camera);

      // localizer
      r3.renderer.clearDepth();
      r3.renderer.render(r3.localizerScene, r3.camera);
    }
  }
  //stats.update();
}

/**
 * Init the quadview
 */
function init() {
  /**
   * Called on each animation frame
   */
  function animate() {
    render();

    // request new frame
    requestAnimationFrame(function() {
      // if (isRender){
      //   console.log('isRender '+isRender);
      // }
      animate();
      if (ready){
        isRender = false;
      }
    });
  }

  // renderers
  initRendererOblique(r0);
  initRenderer2D(r1);
  initRenderer2D(r2);
  initRenderer2D(r3);

  // start rendering loop
  animate();
}

window.onload = function() {
  // init threeJS
  init();

  // load sequence for each file
  // instantiate the loader
  // it loads and parses the dicom image
  let loader = new LoadersVolume();
  loader
    .load(file)
    .then(function() {
      let series = loader.data[0].mergeSeries(loader.data)[0];
      loader.free();
      loader = null;
      // get first stack from series
      let stack = series.stack[0];
      stack.prepare();

      initHelpersStackOblique(r0, stack);

      // red slice
      initHelpersStack(r1, stack);
      // yellow slice
      initHelpersStack(r2, stack);
      // green slice
      initHelpersStack(r3, stack);

      // create new mesh with Localizer shaders
      let plane1 = r1.stackHelper.slice.cartesianEquation();
      let plane2 = r2.stackHelper.slice.cartesianEquation();
      let plane3 = r3.stackHelper.slice.cartesianEquation();

      // localizer red slice
      initHelpersLocalizer(r1, stack, plane1, [
        { plane: plane2, color: new THREE.Color(r2.stackHelper.borderColor) },
        { plane: plane3, color: new THREE.Color(r3.stackHelper.borderColor) },
      ]);

      // localizer yellow slice
      initHelpersLocalizer(r2, stack, plane2, [
        { plane: plane1, color: new THREE.Color(r1.stackHelper.borderColor) },
        { plane: plane3, color: new THREE.Color(r3.stackHelper.borderColor) },
      ]);

      // localizer green slice
      initHelpersLocalizer(r3, stack, plane3, [
        { plane: plane1, color: new THREE.Color(r1.stackHelper.borderColor) },
        { plane: plane2, color: new THREE.Color(r2.stackHelper.borderColor) },
      ]);

      let gui = new dat.GUI({
        autoPlace: false,
      });

      let customContainer = document.getElementById('my-gui-container');
      customContainer.appendChild(gui.domElement);

      // Red
      let stackFolder1 = gui.addFolder('Axial (Red)');
      let redChanged = stackFolder1
        .add(r1.stackHelper, 'index', 0, r1.stackHelper.orientationMaxIndex)
        .step(1)
        .listen();
      stackFolder1
        .add(r1.stackHelper.slice, 'interpolation', 0, 1)
        .step(1)
        .listen();
      let redThickChanged = stackFolder1
        .add(r1.stackHelper.slice, 'thickness', 0, 200)
        .step(1)
        .listen();
      let redWWChanged = stackFolder1
        .add(r1.stackHelper.slice, 'windowWidth', 1, stack.minMax[1] - stack.minMax[0])
        .step(1)
        .listen();
      let redWCChanged = stackFolder1
        .add(r1.stackHelper.slice, 'windowCenter', stack.minMax[0], stack.minMax[1])
        .step(1)
        .listen();
      stackFolder1
        .add(r1.stackHelper.slice, 'draw')
        .listen();

      // Yellow
      let stackFolder2 = gui.addFolder('Sagittal (yellow)');
      let yellowChanged = stackFolder2
        .add(r2.stackHelper, 'index', 0, r2.stackHelper.orientationMaxIndex)
        .step(1)
        .listen();
      stackFolder2
        .add(r2.stackHelper.slice, 'interpolation', 0, 1)
        .step(1)
        .listen();
      stackFolder2
        .add(r2.stackHelper.slice, 'draw')
        .listen();

      // Green
      let stackFolder3 = gui.addFolder('Coronal (green)');
      let greenChanged = stackFolder3
        .add(r3.stackHelper, 'index', 0, r3.stackHelper.orientationMaxIndex)
        .step(1)
        .listen();
      stackFolder3
        .add(r3.stackHelper.slice, 'interpolation', 0, 1)
        .step(1)
        .listen();
      stackFolder3
        .add(r3.stackHelper.slice, 'draw')
        .listen();

      /**
       * Update Layer Mix
       */
      function updateLocalizer(refObj, targetLocalizersHelpers) {
        let refHelper = refObj.stackHelper;
        let localizerHelper = refObj.localizerHelper;
        let plane = refHelper.slice.cartesianEquation();
        localizerHelper.referencePlane = plane;

        // bit of a hack... works fine for this application
        for (let i = 0; i < targetLocalizersHelpers.length; i++) {
          for (let j = 0; j < 3; j++) {
            let targetPlane = targetLocalizersHelpers[i]['plane' + (j + 1)];
            if (
              targetPlane &&
              plane.x.toFixed(6) === targetPlane.x.toFixed(6) &&
              plane.y.toFixed(6) === targetPlane.y.toFixed(6) &&
              plane.z.toFixed(6) === targetPlane.z.toFixed(6)
            ) {
              targetLocalizersHelpers[i]['plane' + (j + 1)] = plane;
            }
          }
        }

         //update the geometry will create a new mesh
        localizerHelper.geometry = refHelper.slice.geometry;
      }

      function updateWindow(refObj, value){
        isRender = true;
        const stackHelper = refObj.stackHelper;
        stackHelper.slice.windowWidth = value[0];
        stackHelper.slice.windowCenter = value[1];
      }
      function updateThickness(refObj, value){
        isRender = true;
        const stackHelper = refObj.stackHelper;
        stackHelper.slice.thickness = value;
      }

      function onYellowChanged() {
        isRender = true;
        updateLocalizer(r2, [r1.localizerHelper, r3.localizerHelper]);
      }

      yellowChanged.onChange(onYellowChanged);

      function onRedChanged() {
        isRender = true;
        updateLocalizer(r1, [r2.localizerHelper, r3.localizerHelper]);
        if (redContourHelper) {
          redContourHelper.geometry = r1.stackHelper.slice.geometry;
        }

      }

      redChanged.onChange(onRedChanged);
      redWWChanged.onChange(updateWindow);
      redWCChanged.onChange(updateWindow);
      redThickChanged.onChange(updateThickness);      


      function onGreenChanged() {
        isRender = true;
        updateLocalizer(r3, [r1.localizerHelper, r2.localizerHelper]);
      }

      greenChanged.onChange(onGreenChanged);
    

      function onDoubleClick(event) {
        isRender = true;
        const canvas = event.target.parentElement;
        const id = event.target.id;
        const mouse = {
          x: ((event.clientX - canvas.offsetLeft) / canvas.clientWidth) * 2 - 1,
          y: -((event.clientY - canvas.offsetTop) / canvas.clientHeight) * 2 + 1,
        };
        //
        let camera = null;
        let stackHelper = null;
        let scene = null;
        switch (id) {
          case '0':
            camera = r0.camera;
            stackHelper = r1.stackHelper;
            scene = r0.scene;
            break;
          case '1':
            camera = r1.camera;
            stackHelper = r1.stackHelper;
            scene = r1.scene;
            break;
          case '2':
            camera = r2.camera;
            stackHelper = r2.stackHelper;
            scene = r2.scene;
            break;
          case '3':
            camera = r3.camera;
            stackHelper = r3.stackHelper;
            scene = r3.scene;
            break;
        }

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);

        const intersects = raycaster.intersectObjects(scene.children, true);
        if (intersects.length > 0) {
          let ijk = CoreUtils.worldToData(stackHelper.stack.lps2IJK, intersects[0].point);

          r1.stackHelper.index = ijk.getComponent((r1.stackHelper.orientation + 2) % 3);
          r2.stackHelper.index = ijk.getComponent((r2.stackHelper.orientation + 2) % 3);
          r3.stackHelper.index = ijk.getComponent((r3.stackHelper.orientation + 2) % 3);

          onGreenChanged();
          onRedChanged();
          onYellowChanged();
        }
      }

      // event listeners
      r0.domElement.addEventListener('dblclick', onDoubleClick);
      r1.domElement.addEventListener('dblclick', onDoubleClick);
      r2.domElement.addEventListener('dblclick', onDoubleClick);
      r3.domElement.addEventListener('dblclick', onDoubleClick);
      
      function onClick(event) {
        isRender = true;
        console.log(event.target.id + ' click');
        const canvas = event.target.parentElement;
        const id = event.target.id;
        const mouse = {
          x: ((event.clientX - canvas.offsetLeft) / canvas.clientWidth) * 2 - 1,
          y: -((event.clientY - canvas.offsetTop) / canvas.clientHeight) * 2 + 1,
        };
        //
        let camera = null;
        let stackHelper = null;
        let scene = null;
        switch (id) {
          case '0':
            camera = r0.camera;
            stackHelper = r0.stackHelper;
            scene = r0.scene;
            break;
          case '1':
            camera = r1.camera;
            stackHelper = r1.stackHelper;
            scene = r1.scene;
            break;
          case '2':
            camera = r2.camera;
            stackHelper = r2.stackHelper;
            scene = r2.scene;
            break;
          case '3':
            camera = r3.camera;
            stackHelper = r3.stackHelper;
            scene = r3.scene;
            break;
        }

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);

        const intersects = raycaster.intersectObjects(scene.children, true);
        if (intersects.length > 0) {
          //console.log('hit');
          let ijk = CoreUtils.worldToData(stackHelper.stack.lps2IJK, intersects[0].point);
          //console.log('lps2IJK ' + stackHelper.stack.lps2IJK.toArray());
          //console.log('intersect point ' + intersects[0].point.toArray());
          // console.log('ijk point ' + ijk.toArray());
          //console.log('dimensionIJK ' + stackHelper.stack.dimensionsIJK.toArray());
        }
      }
      r0.domElement.addEventListener('click', onClick);
      r1.domElement.addEventListener('click', onClick);
      r2.domElement.addEventListener('click', onClick);
      r3.domElement.addEventListener('click', onClick);

      // add drag event
      let dragActive = false;
  
      function dragStart(event){
        dragActive = true;
        let stackHelper = null;
        let scene = null;
        let camera = null;
        const id = event.target.id;
        const canvas = event.target.parentElement;
        const mouse = {
          x: ((event.clientX - canvas.offsetLeft) / canvas.clientWidth) * 2 - 1,
          y: -((event.clientY - canvas.offsetTop) / canvas.clientHeight) * 2 + 1,
        };
        switch (id) {
          case '0':
            camera = r0.camera;
            stackHelper = r0.stackHelper;
            scene = r0.scene;
            break;
          case '1':
            camera = r1.camera;
            stackHelper = r1.stackHelper;
            scene = r1.scene;
            break;
          case '2':
            camera = r2.camera;
            stackHelper = r2.stackHelper;
            scene = r2.scene;
            break;
          case '3':
            camera = r3.camera;
            stackHelper = r3.stackHelper;
            scene = r3.scene;
            break;
        }   
        scene.remove(stackHelper.slice.line);
        if (stackHelper.slice.draw){
          initLine(stackHelper, scene);  
          const raycaster = new THREE.Raycaster();
          raycaster.setFromCamera(mouse, camera);
          const intersects = raycaster.intersectObjects(scene.children, true);
          if (intersects.length > 0) {            
            stackHelper.slice.line.geometry.verticesNeedUpdate = true;
            stackHelper.slice.line.geometry.vertices[0] = intersects[0].point;

          }
        }
      }
      
      function dragStop(event){
        let camera = null;
        let stackHelper = null;
        let scene = null;
        const id = event.target.id;
        dragActive = false;
        switch (id) {
          case '0':
            camera = r0.camera;
            stackHelper = r0.stackHelper;
            scene = r0.scene;
            break;
          case '1':
            camera = r1.camera;
            stackHelper = r1.stackHelper;
            scene = r1.scene;
            break;
          case '2':
            camera = r2.camera;
            stackHelper = r2.stackHelper;
            scene = r2.scene;
            break;
          case '3':
            camera = r3.camera;
            stackHelper = r3.stackHelper;
            scene = r3.scene;
            break;
        }
        if (stackHelper.slice.draw){
        console.log('line start '+ stackHelper.slice.line.geometry.vertices[0].toArray()); 
        console.log('line end '+ stackHelper.slice.line.geometry.vertices[1].toArray());
        let currentPlaneDir = stackHelper.slice.planeDirection;
        let planeDir = calculateObliquePlane(stackHelper.slice.line, stackHelper.slice.planeDirection);
        //calculateOffset(stackHelper.slice.line, posLPS);
        
        changePlane(r0, stackHelper.slice.line, planeDir, currentPlaneDir);
        }
      }
      function onDrag(event){
        if (dragActive) {
          isRender = true;
          event.preventDefault();
          const canvas = event.target.parentElement;
          const id = event.target.id;
          const mouse = {
            x: ((event.clientX - canvas.offsetLeft) / canvas.clientWidth) * 2 - 1,
            y: -((event.clientY - canvas.offsetTop) / canvas.clientHeight) * 2 + 1,
          };
          //
          let camera = null;
          let stackHelper = null;
          let scene = null;

          switch (id) {
            case '0':
              camera = r0.camera;
              stackHelper = r0.stackHelper;
              scene = r0.scene;
              break;
            case '1':
              camera = r1.camera;
              stackHelper = r1.stackHelper;
              scene = r1.scene;
              break;
            case '2':
              camera = r2.camera;
              stackHelper = r2.stackHelper;
              scene = r2.scene;
              break;
            case '3':
              camera = r3.camera;
              stackHelper = r3.stackHelper;
              scene = r3.scene;
              break;
          }         

          const raycaster = new THREE.Raycaster();
 
          raycaster.setFromCamera(mouse, camera);
          const intersects = raycaster.intersectObjects(scene.children, true);
          if (intersects.length > 0) {            
            let ijk = CoreUtils.worldToData(stackHelper.stack.lps2IJK, intersects[0].point);
            if (stackHelper.slice.draw) {
              stackHelper.slice.line.geometry.vertices[1] = intersects[0].point;
              stackHelper.slice.line.geometry.verticesNeedUpdate = true;
            } else {
              r1.stackHelper.index = ijk.getComponent((r1.stackHelper.orientation + 2) % 3);
              r2.stackHelper.index = ijk.getComponent((r2.stackHelper.orientation + 2) % 3);
              r3.stackHelper.index = ijk.getComponent((r3.stackHelper.orientation + 2) % 3);
            }
            onGreenChanged();
            onRedChanged();
            onYellowChanged();
          }

        // const intersects = raycaster.intersectObjects(scene.children, true);
        // if (intersects.length > 0) {
        //   if (intersects[0].object && intersects[0].object.objRef) {
        //     const refObject = intersects[0].object.objRef;
        //     refObject.selected = !refObject.selected;

        //     let color = refObject.color;
        //     if (refObject.selected) {
        //       color = 0xccff00;
        //     }

        //     // update materials colors
        //     refObject.material.color.setHex(color);
        //     refObject.materialFront.color.setHex(color);
        //     refObject.materialBack.color.setHex(color);
        //   }
        //}
        }
      }
      r0.domElement.addEventListener('mousedown', dragStart, false);
      r1.domElement.addEventListener('mousedown', dragStart, false);
      r2.domElement.addEventListener('mousedown', dragStart, false);
      r3.domElement.addEventListener('mousedown', dragStart, false);

      r0.domElement.addEventListener('mouseup', dragStop, false);
      r1.domElement.addEventListener('mouseup', dragStop, false);
      r2.domElement.addEventListener('mouseup', dragStop, false);
      r3.domElement.addEventListener('mouseup', dragStop, false);

      r0.domElement.addEventListener('mousemove', onDrag, false);
      r1.domElement.addEventListener('mousemove', onDrag, false);
      r2.domElement.addEventListener('mousemove', onDrag, false);
      r3.domElement.addEventListener('mousemove', onDrag, false);

      function onScroll(event) {
        isRender = true;
        const id = event.target.domElement.id;
        let stackHelper = null;
        switch (id) {
          case 'r1':
            stackHelper = r1.stackHelper;
            break;
          case 'r2':
            stackHelper = r2.stackHelper;
            break;
          case 'r3':
            stackHelper = r3.stackHelper;
            break;
        }

        if (event.delta > 0) {
          if (stackHelper.index >= stackHelper.orientationMaxIndex - 1) {
            return false;
          }
          stackHelper.index += 1;
        } else {
          if (stackHelper.index <= 0) {
            return false;
          }
          stackHelper.index -= 1;
        }

        onGreenChanged();
        onRedChanged();
        onYellowChanged();
      }

      // event listeners
      r1.controls.addEventListener('OnScroll', onScroll);
      r2.controls.addEventListener('OnScroll', onScroll);
      r3.controls.addEventListener('OnScroll', onScroll);

      function windowResize2D(rendererObj) {
        rendererObj.camera.canvas = {
          width: rendererObj.domElement.clientWidth,
          height: rendererObj.domElement.clientHeight,
        };
        rendererObj.camera.fitBox(2, 1);
        rendererObj.renderer.setSize(
          rendererObj.domElement.clientWidth,
          rendererObj.domElement.clientHeight
        );

        // update info to draw borders properly
        rendererObj.stackHelper.slice.canvasWidth = rendererObj.domElement.clientWidth;
        rendererObj.stackHelper.slice.canvasHeight = rendererObj.domElement.clientHeight;
        rendererObj.localizerHelper.canvasWidth = rendererObj.domElement.clientWidth;
        rendererObj.localizerHelper.canvasHeight = rendererObj.domElement.clientHeight;
      }

      function onWindowResize() {
        isRender = true;
        // update 3D
        r0.camera.aspect = r0.domElement.clientWidth / r0.domElement.clientHeight;
        r0.camera.updateProjectionMatrix();
        r0.renderer.setSize(r0.domElement.clientWidth, r0.domElement.clientHeight);

        // update 2d
        //windowResize2D(r0);
        windowResize2D(r1);
        windowResize2D(r2);
        windowResize2D(r3);
      }

      window.addEventListener('resize', onWindowResize, false);

      ready = true;
 
    })
    .catch(function(error) {
      window.console.log('oops... something went wrong...');
      window.console.log(error);
    });
};