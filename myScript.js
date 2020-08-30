var gl;
var baseDir;
var shaderDir;
var program;

// camera positions
let cx = 0.02, cy = 0.13, cz = 4.3, elev = 0.0, ang = 0.0;
let lookRadius = 10.0;
let viewMatrix = null;
let viewWorldMatrix = null
let isLookAtCamera = true;

// missile position
let rx = 0.0, ry = -90.0, rz = 0.0;
let ax = 0.0, ay = 0.102, az = 4.1;

let missile = {
    objPath: 'Assets/Missile2/R73.obj',
    texturePath: 'Assets/Missile2/Texture.png',
    scale: 0.02,
    worldMatrix: utils.MakeWorld(ax, ay, az, rx, ry, rz, self.scale),
    obj: null,
    texture: 0,
};

let landscape = {
    objPath: 'Assets/Landscape/mount.obj',
    texturePath: 'Assets/Landscape/grass.jpg',
    worldMatrix: utils.MakeWorld(0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0),
    obj: null,
    texture: 1,
};

function createViewMatrix(objPosition, camPosition, uy) {
    let _camPos = camPosition;
    let _objPos = objPosition;
    let _u = [0, uy, 0];

    let vzn = utils.subtractVector3(_camPos, _objPos);
    vzn = utils.normalizeVector3(vzn);

    let vxn = utils.crossVector(_u, vzn);
    vxn = utils.normalizeVector3(vxn);

    let vy = utils.crossVector(vzn, vxn);

    let Mc =   [vxn[0], vy[0], vzn[0], c[0],
                vxn[1], vy[1], vzn[1], c[1],
                vxn[2], vy[2], vzn[2], c[2],
                0,      0,     0,      1];

    return utils.invertMatrix(Mc);
}


function main() {

}

async function init(){
    var path = window.location.pathname;
    var page = path.split("/").pop();
    baseDir = window.location.href.replace(page, '');
    shaderDir = baseDir+"shaders/";
    var canvas = document.getElementById("c");
    //canvas.addEventListener();

    gl = canvas.getContext("webgl2");
    if (!gl) {
    document.write("GL context not opened");
    return;
  }
  utils.resizeCanvasToDisplaySize(gl.canvas);

  await utils.loadFiles([shaderDir + 'vs.glsl', shaderDir + 'fs.glsl'], function (shaderText) {
      var vertexShader = utils.createShader(gl, gl.VERTEX_SHADER, shaderText[0]);
      var fragmentShader = utils.createShader(gl, gl.FRAGMENT_SHADER, shaderText[1]);

      program = utils.createProgram(gl, vertexShader, fragmentShader);
    });

  gl.useProgram(program);
  main();
}

window.onload = init();
