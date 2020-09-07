// ROCKET LAUNCHER SIMULATOR
/*
    Possible improvements:
    HDR enviroment cubemap for the sky (already in Assets/CubeMap)
    Fire/smoke animation when rocket is moving
    Select start/end position at run-time
*/

var program;
var gl;
var shaderDir;
var baseDir;
var objPath             = [];
var texturePath         = [];
objPath     [0]         = 'Assets/Missile1/R27.obj';
texturePath [0]         = 'Assets/Missile1/Texture.png';
objPath     [1]         = 'Assets/Landscape/mount.obj'
texturePath [1]         = 'Assets/Landscape/m1.jpg' //1 2 3 4
var vaoArray            = [];
var textureArray        = [];
var rocketModel;
var landscapeModel;
var elapsedTime         = 0;
var lastTime            = 0;

// animation
let startMoving     = false;
let trajectory;
let height          = 12.0;
let minHeight       = 8.0;
let maxHeight       = 30.0;
let heightPerc      = ((height/maxHeight)*100).toFixed(0);
let speed           = 160;
let minSpeed        = 300;
let maxSpeed        = 40;
let speedPerc       = (113-(speed/minSpeed)*100).toFixed(0);
let counter         = 0;
let poiIndex        = 0;
let poi             = [];
poi[0]              = [-2.5, 0.29,   3.7];
poi[1]              = [1.2,  1.88,   -0.34];
poi[2]              = [-1.3, 0.86,   -2.7];
poi[3]              = [0.58, 1.92,   1.7];
poi[4]              = [2.2,  0.5,    -3.0];
poi[5]              = [1.6,  0.6,    3.4];

// rocket speed
let ax              = poi[0][0];  //max 3.2
let ay              = poi[0][1];
let az              = poi[0][2];  //max 4.1
// camera speed
let cx              = 0.0;
let cy              = 0.0;
let cz              = 4.4;
// camera rotation
let angle           = -35.0;
let elevation       = 10.0;
let radius          = Math.abs(cz - az);
let minRad          = 0.2;
let maxRad          = 20.0;

function createViewMatrix(objPosition, camPosition, uy) {
    let c       = camPosition;
    let a       = objPosition;
    let u       = [0, uy, 0];

    let vzn     = utils.subtractVector3(c, a);
    vzn         = utils.normalizeVector3(vzn);

    let vxn     = utils.crossVector(u, vzn);
    vxn         = utils.normalizeVector3(vxn);

    let vy      = utils.crossVector(vzn, vxn);

    let Mc      =  [vxn[0],  vy[0],  vzn[0],  c[0],
                    vxn[1],  vy[1],  vzn[1],  c[1],
                    vxn[2],  vy[2],  vzn[2],  c[2],
                    0,       0,      0,       1   ];

    return utils.invertMatrix(Mc);
}

/*
// load the environment map
function LoadEnvironment() {
	// Create a texture.
	var textureEnv = gl.createTexture();
	gl.activeTexture(gl.TEXTURE0 + 3);
	gl.bindTexture(gl.TEXTURE_CUBE_MAP, textureEnv);

	baseName = "Assets/CubeMap/"

	const faceInfos = [
	  {
	    target: gl.TEXTURE_CUBE_MAP_POSITIVE_X,
	    url: baseName+'px.jpg',
	  },
	  {
	    target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
	    url: baseName+'nx.jpg',
	  },
	  {
	    target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
	    url: baseName+'py.jpg',
	  },
	  {
	    target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
	    url: baseName+'ny.jpg',
	  },
	  {
	    target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
	    url: baseName+'pz.jpg',
	  },
	  {
	    target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
	    url: baseName+'nz.jpg',
	  },
	];
	faceInfos.forEach((faceInfo) => {
	  const {target, url} = faceInfo;

	  // Upload the canvas to the cubemap face.
	  const level = 0;
	  const internalFormat = gl.RGBA;
	  const width = 512;
	  const height = 512;
	  const format = gl.RGBA;
	  const type = gl.UNSIGNED_BYTE;

	  // setup each face so it's immediately renderable
	  gl.texImage2D(target, level, internalFormat, width, height, 0, format, type, null);

	  // Asynchronously load an image
	  const image = new Image();
	  image.src = url;
	  image.addEventListener('load', function() {
	    // Now that the image has loaded upload it to the texture.
		gl.activeTexture(gl.TEXTURE0 + 3);
	    gl.bindTexture(gl.TEXTURE_CUBE_MAP, textureEnv);
	    gl.texImage2D(target, level, internalFormat, format, type, image);
	    gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
	  });
	});
	gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
}
*/

function trajectoryMaker(start, end) {
    let top     = [(start[0] + end[0]) / 2.0, height, (start[2] + end[2]) / 2.0];
    let path    = [];
    let q1;
    let q2;
    let q3;
    let pitch;

    if (start[2]    >= end[2]) {
        if (start[0] === end[0]) {
            pitch   = 180.0;
        } else {
            pitch   = 180 + utils.radToDeg(Math.atan((start[0] - end[0]) / (start[2] - end[2])));
        }
    } else {
        pitch       = utils.radToDeg(Math.atan((start[0] - end[0]) / (start[2] - end[2])));

    }
    q1  = toQuaternion(90.0, pitch, 0.0);
    q2  = toQuaternion(0.0, pitch, 0.0);
    q3  = toQuaternion(-90.0, pitch, 0.0);

    for (let i = 0; i <= speed; i++) {
        let alp     = i * 1.0 / speed;
        let q12     = q1.slerp(q2)(alp);
        let q23     = q2.slerp(q3)(alp);
        let q123    = q12.slerp(q23)(alp);

        let MR      = q123.toMatrix4();

        let uma     = 1.0 - alp;
        let c0      = uma * uma;
        let c1      = uma * alp;
        let c2      = alp * alp;

        let translate = [
            start[0] * c0 + top[0] * c1 + end[0] * c2,
            start[1] * c0 + top[1] * c1 + end[1] * c2,
            start[2] * c0 + top[2] * c1 + end[2] * c2,
        ]

        let MT = utils.MakeTranslateMatrix(
            start[0] * c0 + top[0] * c1 + end[0] * c2,
            start[1] * c0 + top[1] * c1 + end[1] * c2,
            start[2] * c0 + top[2] * c1 + end[2] * c2,
        );

        path.push([utils.multiplyMatrices(
                    utils.multiplyMatrices(MT, MR), utils.MakeScaleMatrix(0.05))
                        , translate])
    }
    return path;
}

function toQuaternion(yaw, pitch, roll) {  // yaw (Z), pitch (Y), roll (X)
    let yc = Math.cos(utils.degToRad(yaw * 0.5));
    let ys = Math.sin(utils.degToRad(yaw * 0.5));
    let pc = Math.cos(utils.degToRad(pitch * 0.5));
    let ps = Math.sin(utils.degToRad(pitch * 0.5));
    let rc = Math.cos(utils.degToRad(roll * 0.5));
    let rs = Math.sin(utils.degToRad(roll * 0.5));

    let qw = rc * pc * yc + rs * ps * ys;
    let qx = rs * pc * yc - rc * ps * ys;
    let qy = rc * ps * yc + rs * pc * ys;
    let qz = rc * pc * ys - rs * ps * yc;

    return new Quaternion(qx, qy, qz, qw);
}



function main() {

    var objWorldMatrix      = new Array();
    objWorldMatrix[1]       = utils.MakeWorld(0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0);

    var lastUpdateTime = (new Date).getTime();

    var cubeRx      = 0.0;
    var cubeRy      = 0.0;
    var cubeRz      = 0.0;
    var cubeS       = 0.5;
    var flag        = 0;

    utils.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0.85, 0.85, 0.85, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    //extraction of the position of the vertices, the normals, the indices, and the uv coordinates
    var rocketVertices         = rocketModel.vertices;
    var rocketNormals          = rocketModel.vertexNormals;
    var rocketIndices          = rocketModel.indices;
    var rocketTexCoords        = rocketModel.textures;

    var landscapeVertices       = landscapeModel.vertices;
    var landscapeNormals        = landscapeModel.normals;
    var landscapeIndices        = landscapeModel.indices;
    var landscapeTexCoords      = landscapeModel.textures;

    //linking fs attributes to js variables
    var positionAttributeLocation   = gl.getAttribLocation(program, "inPosition");
    var uvAttributeLocation         = gl.getAttribLocation(program, "inUv");
    var matrixLocation              = gl.getUniformLocation(program, "matrix");
    var textLocation                = gl.getUniformLocation(program, "u_texture");
    var perspectiveMatrix           = utils.MakePerspective(60, gl.canvas.width/gl.canvas.height, 0.1, 100.0);
    var viewMatrix                  = utils.MakeView(0, 0.0, 3.0, 0.0, 0.0);
    var textureEnvironment          = gl.getUniformLocation(program, "u_tex_Env");
    var repMetRoughVar              = gl.getUniformLocation(program, "repMetRough");

    const fpsElem = document.querySelector("#fps");

    let then = 0;
    function render(now) {
      now *= 0.001;                          // convert to seconds
      const deltaTime = now - then;          // compute time since last frame
      then = now;                            // remember time for next frame
      const fps = 1 / deltaTime;             // compute frames per second
      fpsElem.textContent = fps.toFixed(1);  // update fps display

      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);


    // rocket
    vaoArray[0]                 = gl.createVertexArray();
    gl.bindVertexArray          (vaoArray[0]);

    var positionBuffer          = gl.createBuffer();
    gl.bindBuffer               (gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData               (gl.ARRAY_BUFFER, new Float32Array(rocketVertices), gl.STATIC_DRAW);
    gl.enableVertexAttribArray  (positionAttributeLocation);
    gl.vertexAttribPointer      (positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);

    var uvBuffer                = gl.createBuffer();
    gl.bindBuffer               (gl.ARRAY_BUFFER, uvBuffer);
    gl.bufferData               (gl.ARRAY_BUFFER, new Float32Array(rocketTexCoords), gl.STATIC_DRAW);
    gl.enableVertexAttribArray  (uvAttributeLocation);
    gl.vertexAttribPointer      (uvAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    var indexBuffer             = gl.createBuffer();
    gl.bindBuffer               (gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData               (gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(rocketIndices), gl.STATIC_DRAW);

    textureArray[0]             = gl.createTexture();
    gl.bindTexture              (gl.TEXTURE_2D, textureArray[0]);

    var image1                  = new Image();
    image1.src                  = baseDir + texturePath[0];
    image1.onload               = function() {
                                    gl.bindTexture      (gl.TEXTURE_2D, textureArray[0]);
                                    gl.pixelStorei      (gl.UNPACK_FLIP_Y_WEBGL, true);
                                    gl.texImage2D       (gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image1);
                                    gl.texParameteri    (gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                                    gl.texParameteri    (gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                                    gl.generateMipmap   (gl.TEXTURE_2D);
                                };

    //landscape
    vaoArray[1]                 = gl.createVertexArray();
    gl.bindVertexArray          (vaoArray[1]);

    positionBuffer              = gl.createBuffer();
    gl.bindBuffer               (gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData               (gl.ARRAY_BUFFER, new Float32Array(landscapeVertices), gl.STATIC_DRAW);
    gl.enableVertexAttribArray  (positionAttributeLocation);
    gl.vertexAttribPointer      (positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);

    uvBuffer                    = gl.createBuffer();
    gl.bindBuffer               (gl.ARRAY_BUFFER, uvBuffer);
    gl.bufferData               (gl.ARRAY_BUFFER, new Float32Array(landscapeTexCoords), gl.STATIC_DRAW);
    gl.enableVertexAttribArray  (uvAttributeLocation);
    gl.vertexAttribPointer      (uvAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    indexBuffer                 = gl.createBuffer();
    gl.bindBuffer               (gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData               (gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(landscapeIndices), gl.STATIC_DRAW);

    textureArray[1]             = gl.createTexture();
    gl.bindTexture              (gl.TEXTURE_2D, textureArray[1]);

    var image2                  = new Image();
    image2.src                  = baseDir + texturePath[1];
    image2.onload               = function() {
                                    gl.bindTexture      (gl.TEXTURE_2D, textureArray[1]);
                                    gl.pixelStorei      (gl.UNPACK_FLIP_Y_WEBGL, true);
                                    gl.texImage2D       (gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image2);
                                    gl.texParameteri    (gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                                    gl.texParameteri    (gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                                    gl.generateMipmap   (gl.TEXTURE_2D);
                                };

    trajectory = trajectoryMaker(poi[poiIndex], poi[poiIndex+1]);
    drawScene();

    function animate(){
        var currentTime     = (new Date).getTime();

        // manage keyboards inputs
        if (zoomIn && radius >= minRad)
            radius      -= 0.06;
        if (zoomOut && radius <= maxRad)
            radius      += 0.06;
        if (goW)
            elevation   += 1.0;
        if (goS)
            elevation   -= 1.0;
        if (goA)
            angle       -= 1.0;
        if (goD)
            angle       += 1.0;
        if (speedUp     && speed >= maxSpeed)
            speed       -= 1.0;
            speedPerc   = (113-(speed/minSpeed)*100).toFixed(0);
        if (speedDown   && speed <= minSpeed)
            speed       += 1.0;
            speedPerc   = (113-(speed/minSpeed)*100).toFixed(0);
        if (heightUp    && height <= maxHeight)
            height      += 0.1;
            heightPerc  = ((height/maxHeight)*100).toFixed(0);
        if (heightDown  && height >= minHeight)
            height      -= 0.1;
            heightPerc  = ((height/maxHeight)*100).toFixed(0);
        document.getElementById("setSpeed").innerHTML   = (speedPerc+"%");
        document.getElementById("setHeight").innerHTML  = (heightPerc+"%");
        if (startMoving)
            document.getElementById("startStop").innerHTML  = "STOP";
        else
            document.getElementById("startStop").innerHTML  = "START";


        if(lastUpdateTime){
            var deltaC  = (30 * (currentTime - lastUpdateTime)) / 1000.0;
            if(startMoving) {
                if (trajectory.length > 0 && deltaC > 0.5 && counter + 1 !== trajectory.length) {
                    if(counter === 0) {
                        if (poiIndex === 5){
                            poiIndex = 0;
                            trajectory = trajectoryMaker(poi[poi.length-1], poi[poiIndex]);
                        }
                        else {
                            trajectory = trajectoryMaker(poi[poiIndex], poi[poiIndex+1]);
                            poiIndex += 1;
                        }
                    }
                    counter = (counter + 1);
                } else if (counter + 1 === trajectory.length) {
                    startMoving = false;
                }
            }
            lastUpdateTime      = currentTime;
        }
    }

    function drawScene() {

        animate();
        var worldMatrix;

        // FPS displayer
        var now = new Date().getTime();
        now *= 0.001;
        elapsedTime = (now - lastTime);
        if (elapsedTime > 1000){
            lastTime = now
            fps = 1 / elapsedTime;
            document.getElementById("fps").innerHTML = fps.toFixed(2);
        }

        utils.resizeCanvasToDisplaySize(gl.canvas);
        gl.clearColor(0.15, 0.25, 0.95, 0.56);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        window.onresize         = doResize;

        for (let i = 0; i < 2; i++){
            if (i === 0){       // rocket
                if (trajectory && trajectory.length > 0 && counter + 1 > 1) {
                    worldMatrix = trajectory[counter][0];
                    ax = trajectory[counter][1][0];
                    ay = trajectory[counter][1][1];
                    az = trajectory[counter][1][2];
                }
                else {
                    worldMatrix = utils.MakeWorld(ax, ay, az, 0.0, -90.0, 0.0, 0.05);
                }
            }

            else {              // landscape
                worldMatrix = objWorldMatrix[1];
            }
            // camera view
            cx  = ax + radius * Math.sin(utils.degToRad(angle)) * Math.cos(utils.degToRad(elevation));
            cz  = az + radius * Math.cos(utils.degToRad(angle)) * Math.cos(utils.degToRad(elevation));
            cy  = ay + radius * Math.sin(utils.degToRad(elevation));
            var uy = 1;
            if (Math.cos(utils.degToRad(elevation)) < 0) { // now the mount can show on the top
                uy = -1;
            }
            viewMatrix              = createViewMatrix([ax, ay, az], [cx, cy, cz], uy);
            var viewWorldMatrix     = utils.multiplyMatrices(viewMatrix, worldMatrix);
            var projectionMatrix    = utils.multiplyMatrices(perspectiveMatrix, viewWorldMatrix);

            // we need to set the projection matrix in a uniform
            gl.uniformMatrix4fv     (matrixLocation, gl.FALSE, utils.transposeMatrix(projectionMatrix));

            gl.activeTexture        (gl.TEXTURE0);
            gl.bindTexture          (gl.TEXTURE_2D, textureArray[i]);
            gl.uniform1i            (textLocation, 0);

            gl.bindVertexArray      (vaoArray[i]);
            if (i === 0){
                gl.drawElements     (gl.TRIANGLES, rocketIndices.length, gl.UNSIGNED_SHORT, 0 );
            }
            else {
                gl.drawElements     (gl.TRIANGLES, landscapeIndices.length, gl.UNSIGNED_SHORT, 0 );
            }

        }
        window.requestAnimationFrame(drawScene);
    }

}


async function init(){

    var path                = window.location.pathname;
    var page                = path.split("/").pop();
    baseDir                 = window.location.href.replace(page, '');
    shaderDir               = baseDir+"shaders/";

    var canvas              = document.getElementById("my-canvas");
    canvas.addEventListener ("mousedown", doMouseDown, false);
    canvas.addEventListener ("mouseup", doMouseUp, false);
    canvas.addEventListener ("mousemove", doMouseMove, false);
    canvas.addEventListener ("mousewheel", doMouseWheel, false);
    window.onresize         = doResize;
    canvas.width            = window.innerWidth-16;
    canvas.height           = window.innerHeight-180;
    gl                      = canvas.getContext("webgl2");
    if (!gl) {
        document.write("GL context not opened");
        return;
    }

    await utils.loadFiles([shaderDir + 'vs.glsl', shaderDir + 'fs.glsl'], function (shaderText) {
      var vertexShader      = utils.createShader(gl, gl.VERTEX_SHADER, shaderText[0]);
      var fragmentShader    = utils.createShader(gl, gl.FRAGMENT_SHADER, shaderText[1]);
      program               = utils.createProgram(gl, vertexShader, fragmentShader);

    });
    gl.useProgram(program);


    //###################################################################################
    //This loads the obj model
    var rocketObjStr       = await utils.get_objstr(baseDir + objPath[0]);
    rocketModel            = new OBJ.Mesh(rocketObjStr);
    var landscapeObjStr     = await utils.get_objstr(baseDir + objPath[1]);
    landscapeModel          = new OBJ.Mesh(landscapeObjStr);
    //###################################################################################

    main();
}

window.onload = init;
