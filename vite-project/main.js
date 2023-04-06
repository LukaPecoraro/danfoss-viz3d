import * as THREE from 'three';
import { PLAN_DATA } from './grid_data2.js';


import { TrackballControls } from 'three/addons/controls/TrackballControls.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import Stats from 'three/addons/libs/stats.module.js';
import Interaction from 'three.interaction/src/interaction/Interaction.js'


let container, stats;
let camera, controls, scene, renderer;
let pickingTexture, pickingScene;
let highlightBox;



const pickingData = [];

const pointer = new THREE.Vector2();
const offset = new THREE.Vector3( 10, 10, 10 );

init();
animate();

function init() {

  container = document.getElementById( 'container' );


  scene = new THREE.Scene();
  scene.background = new THREE.Color( 0xEEEDE7 );

  pickingScene = new THREE.Scene();
  pickingTexture = new THREE.WebGLRenderTarget( 1, 1 );

  scene.add( new THREE.AmbientLight( 0xffffff, 1 ) );

  const light = new THREE.SpotLight( 0xffffff, 1.5 );
  light.position.set( 0, 500, 2000 );
  //scene.add( light );

				renderer = new THREE.WebGLRenderer( { antialias: true } );
				renderer.setPixelRatio( window.devicePixelRatio );
				renderer.setSize( window.innerWidth, window.innerHeight );
				document.body.appendChild( renderer.domElement );

  camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 4000 );
  camera.position.set(400,2000, 900)
  //camera.position.z = 2000;
  //camera.position.y = 900;
  controls = new OrbitControls( camera, renderer.domElement );
  controls.listenToKeyEvents( window ); // optional

  //controls.addEventListener( 'change', render ); // call this only in static scenes (i.e., if there is no animation loop)

  controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
  controls.dampingFactor = 0.05;

  controls.screenSpacePanning = false;

  controls.minDistance = 1000;
  controls.maxDistance = 5000;

  controls.maxPolarAngle = Math.PI / 2;

  const interaction = new Interaction(renderer, scene, camera);

  const pickingMaterial = new THREE.MeshBasicMaterial( { vertexColors: true } );
  const defaultMaterial = new THREE.MeshPhongMaterial( { color: 0xffffff, flatShading: true, vertexColors: true, shininess: 0, polygonOffsetFactor: 1,  polygonOffsetUnits: 1	} );


  function applyVertexColors( geometry, color ) {

    const position = geometry.attributes.position;
    const colors = [];

    for ( let i = 0; i < position.count; i ++ ) {
      colors.push( color.r, color.g, color.b );
    }

    geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) );

  }

  const geometriesDrawn = [];
  const geometriesPicking = [];

  const matrix = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  const color = new THREE.Color();


  // highlight box
  highlightBox = new THREE.Mesh(
    new THREE.BoxGeometry(),
    new THREE.MeshPhongMaterial( { color: 0xfff133, flatShading: true,  polygonOffsetFactor: 1,  polygonOffsetUnits: 1	})
    //new THREE.MeshLambertMaterial( { color: 0xffff00} )
  );
  var geo = new THREE.EdgesGeometry( highlightBox.geometry );
  var mat = new THREE.LineBasicMaterial( { color: 0x000000 } );
  var wireframe = new THREE.LineSegments( geo, mat );
  highlightBox.add(wireframe)
  scene.add( highlightBox );
  //highlightBox.on('click', function(ev) {console.log(highlightBox.name)});


  // add grid
  const grid_data = PLAN_DATA.grid
  let grid_geom = new THREE.BoxGeometry(grid_data.width, grid_data.height, grid_data.depth);
  grid_geom.translate(grid_data.width/ 2,grid_data.height / 2,grid_data.depth /2) // translate because anchor is at the center
  const material = new THREE.MeshBasicMaterial( {color: 0x3B3B3B} );
  let grid = new THREE.Mesh( grid_geom, material );
  scene.add(grid)
  grid.name = "PLANNING GRID"
  grid.on('click', function(ev) {console.log(grid.name)});


  console.log(PLAN_DATA)

  // draw boxes

  const planned_boxes = PLAN_DATA.boxes

  for ( let i = 0; i < planned_boxes.length; i ++ ) {
    let box = planned_boxes[i]

    let geometry = new THREE.BoxGeometry(1, 1, 1);
    
    const position = new THREE.Vector3();
    position.x = box.position_x +  box.width/ 2;
    position.y = box.position_y + box.height/ 2;
    position.z = box.position_z + box.depth / 2;

    const rotation = new THREE.Euler();
    rotation.x = 0; //Math.random() * 2 * Math.PI;
    rotation.y = 0; //Math.random() * 2 * Math.PI;
    rotation.z = 0; //Math.random() * 2 * Math.PI;

    const scale = new THREE.Vector3();
    scale.x = box.width; // Math.random() * 200 + 100;
    scale.y = box.height; // Math.random() * 200 + 100;
    scale.z = box.depth; // Math.random() * 200 + 100;

    quaternion.setFromEuler( rotation );
    matrix.compose( position, quaternion, scale );

    geometry.applyMatrix4( matrix );

    // give the geometry's vertices a random color, to be displayed

    applyVertexColors( geometry, color.setHex( Math.random() * 0xffffff ) );

    geometriesDrawn.push( geometry );


    let box_mesh = new THREE.Mesh( geometry, defaultMaterial );


    //box_mesh.on('click', function(ev) {console.log(box_mesh.name});

    
    // add borders to boxes
    var geo = new THREE.EdgesGeometry( box_mesh.geometry );
    var mat = new THREE.LineBasicMaterial( { color: 0x000000 } );
    var wireframe = new THREE.LineSegments( geo, mat );
    box_mesh.add(wireframe)

    scene.add( box_mesh );

    box_mesh.cursor = 'pointer';
    box_mesh.name = box.id
    box_mesh.on('click', function(ev) {
      console.log(box_mesh.name); 
      highlightBox.name = box_mesh.name;
      //box_mesh.material.color.set(0xffff00);
      //highlightBox.applyMatrix4( matrix )
      highlightBox.position.set(position.x, position.y, position.z);
      highlightBox.scale.set(box.height, box.width, box.depth).add( offset );
      highlightBox.rotation.set(0, 0, Math.PI / 2);
      highlightBox.visible = true;

    }); //  //  box_mesh.material.color = 0xffff00}

    geometry = geometry.clone();

    // give the geometry's vertices a color corresponding to the "id"

    applyVertexColors( geometry, color.setHex( i ) );

    geometriesPicking.push( geometry );

    pickingData[ i ] = {

      position: position,
      rotation: rotation,
      scale: scale

    };



  }

  //const objects = new THREE.Mesh( BufferGeometryUtils.mergeGeometries( geometriesDrawn ), defaultMaterial );
  //scene.add( objects );

  pickingScene.add( new THREE.Mesh( BufferGeometryUtils.mergeGeometries( geometriesPicking ), pickingMaterial ) );




  // controls = new TrackballControls( camera, renderer.domElement );
  // controls.rotateSpeed = 1.0;
  // controls.zoomSpeed = 1.2;
  // controls.panSpeed = 0.8;
  // controls.noZoom = false;
  // controls.noPan = false;
  // controls.staticMoving = true;
  //  controls.dynamicDampingFactor = 0.3;

  stats = new Stats();
  container.appendChild( stats.dom );

  renderer.domElement.addEventListener( 'pointermove', onPointerMove );

}

//

function onPointerMove( e ) {

  pointer.x = e.clientX;
  pointer.y = e.clientY;

}

function animate() {

  requestAnimationFrame( animate );

  render();
  stats.update();

}

function pick() {

  //render the picking scene off-screen

  // set the view offset to represent just a single pixel under the mouse

  camera.setViewOffset( renderer.domElement.width, renderer.domElement.height, pointer.x * window.devicePixelRatio | 0, pointer.y * window.devicePixelRatio | 0, 1, 1 );

  // render the scene

  renderer.setRenderTarget( pickingTexture );
  renderer.render( pickingScene, camera );

  // clear the view offset so rendering returns to normal

  camera.clearViewOffset();

  //create buffer for reading single pixel

  const pixelBuffer = new Uint8Array( 4 );

  //read the pixel

  renderer.readRenderTargetPixels( pickingTexture, 0, 0, 1, 1, pixelBuffer );

  //interpret the pixel as an ID

  const id = ( pixelBuffer[ 0 ] << 16 ) | ( pixelBuffer[ 1 ] << 8 ) | ( pixelBuffer[ 2 ] );
  const data = pickingData[ id ];

  if ( data ) {

    //move our highlightBox so that it surrounds the picked object

    if ( data.position && data.rotation && data.scale ) {

      highlightBox.position.copy( data.position );
      highlightBox.rotation.copy( data.rotation );
      highlightBox.scale.copy( data.scale ).add( offset );
      highlightBox.visible = true;

    }

  } else {

    highlightBox.visible = false;

  }

}

function render() {

  //controls.update();

  //pick();

  renderer.setRenderTarget( null );
  renderer.render( scene, camera );

}
