import * as THREE from 'three';
//import { PLAN_DATA } from './grid_data2.js';

//let PLAN_DATA = {}


import { TrackballControls } from 'three/addons/controls/TrackballControls.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import Stats from 'three/addons/libs/stats.module.js';
import Interaction from 'three.interaction/src/interaction/Interaction.js'

export { init, animate }


let container, stats;
let camera, controls, scene, renderer;
let pickingTexture, pickingScene;
let highlightBox;

const pickingData = [];
const pointer = new THREE.Vector2();
const offset = new THREE.Vector3( 10, 10, 10 );

const negOffset = new THREE.Vector3( -10, 10, -10 );



// // SEND A REQUEST TO THE FRONTEND
var boxes = []; // Array to store boxes
// function addBox() {
document.getElementById ("btnAdd").addEventListener ("click", function(event) {
  var width = document.getElementById("width").value;
  var height = document.getElementById("height").value;
  var depth = document.getElementById("depth").value;

  var box = {
      width: parseInt(width),
      height: parseInt(height),
      depth: parseInt(depth),
      position_x : 0,
      position_y : 0,
      position_z : 0
  };

  boxes.push(box);

  document.getElementById("width").value = "";
  document.getElementById("height").value = "";
  document.getElementById("depth").value = "";

  // Update box list
  var boxList = document.getElementById("boxList");
  var listItem = document.createElement("li");
  listItem.textContent = "Width: " + box.width + ", Height: " + box.height + ", Depth: " + box.depth;
  boxList.appendChild(listItem);
});


let grid = {
    id : "grid_1",
    width : 8,
    height : 8,
    depth : 8
}
document.getElementById("gridShape").textContent = "W:" + grid.width + " H:"+  grid.height + " D:" + grid.depth;


document.getElementById("myForm").addEventListener("submit", function(event) {
    event.preventDefault(); // Prevent form from submitting
    // Create data object to send in POST request
    var data = {
        boxes: boxes,
        grid: grid
    };
    console.log(data)
    fetch("http://localhost:8080/solveConf", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    })
    .then(function(response) {
        if (response.ok) {
            return response.json();
        } else {
            throw new Error("Error: " + response.status);
        }
    })
    .then(function(resp) {
        console.log("Response:", resp);
        PLAN_DATA = resp;
        init();
        animate();
        // Handle successful response
    })
    .catch(function(error) {
        console.error(error);
        // Handle error
    });
});

import { PLAN_DATA } from './grid_data DEMO.js';
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
    new THREE.MeshPhongMaterial( { color: 0xe2000f, flatShading: true,  polygonOffsetFactor: 1,  polygonOffsetUnits: 1	})
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
  let grid_geom = new THREE.BoxGeometry(grid_data.width, 20, grid_data.depth);
  grid_geom.translate(grid_data.width/ 2, -10 ,grid_data.depth /2) // translate because anchor is at the center
  const material = new THREE.MeshBasicMaterial( {color: 0x303030} );
  let grid = new THREE.Mesh( grid_geom, material );
  scene.add(grid)
  grid.name = "PLANNING GRID"
  grid.on('click', function(ev) {console.log(grid.name)});


  console.log(PLAN_DATA)


  controls.target.set(grid_data.width / 2, grid_data.height / 2, grid_data.depth / 2); // SET PIVOT POINT of camera


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
    scale.x = box.width - 20; // space between two boxes
    scale.y = box.height; 
    scale.z = box.depth - 20; // space between two boxes

    quaternion.setFromEuler( rotation );
    matrix.compose( position, quaternion, scale );

    geometry.applyMatrix4( matrix );

    // give the geometry's vertices a random color, to be displayed

    // DEFAULT; VERY NICE AND COOL
    //applyVertexColors( geometry, color.setHex( Math.random() * 0xffffff ) );

    // VANESSA COLORS
    applyVertexColors( geometry, color.setHex(0xBDBDBD) );

    // GRID COLOR // TODO FIX TO JE HARDCODAN
    if (i >= planned_boxes.length - 4){
      applyVertexColors( geometry, color.setHex(0x7D7D7D));
    }


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
