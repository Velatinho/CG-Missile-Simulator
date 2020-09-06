var program;
var gl;
var shaderDir;
var baseDir;
var objPath             = [];
objPath[0]              = 'Assets/Missile2/R73.obj';
objPath[1]              = 'Assets/Landscape/mount.obj'
var texturePath         = [];
texturePath[0]          = 'Assets/Missile2/Texture.png';
texturePath[1]          = 'Assets/Landscape/grass.jpg'
var vaoArray            = [];
var textureArray        = [];
var missileModel;
var landscapeModel;

// missile positions
let ax              = -2.5;
let ay              = 0.22;
let az              = 3.7;
// camera positions
let cx              = 0.0;
let cy              = 0.0;
let cz              = 4.3;
// camera rotation
let angle           = -40.0;
let elevation       = 4.0;
let radius          = Math.abs(cz - az);
let minRad          = 0.2;
let maxRad          = 10.0;
// animation
let startMoving     = false;
let trajectory;
let counter         = 0;
let initialPos      = [ax, ay, az];
let finalPos        = [0.0, 0.0, 0.0];

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



function main() {

    var objWorldMatrix      = new Array();
    objWorldMatrix[1]       = utils.MakeWorld(0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0);       //landscape
    /*
    //define directional light
    var dirLightAlpha = -utils.degToRad(60);
    var dirLightBeta  = -utils.degToRad(120);

    var directionalLight = [Math.cos(dirLightAlpha) * Math.cos(dirLightBeta),
          Math.sin(dirLightAlpha),
          Math.cos(dirLightAlpha) * Math.sin(dirLightBeta)
          ];
    var directionalLightColor = [0.1, 1.0, 1.0];
    */

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

    //###################################################################################
    //Here we extract the position of the vertices, the normals, the indices, and the uv coordinates
    var missileVertices         = missileModel.vertices;
    var missileNormals          = missileModel.vertexNormals;
    var missileIndices          = missileModel.indices;
    var missileTexCoords        = missileModel.textures;

    var landscapeVertices       = landscapeModel.vertices;
    var landscapeNormals        = landscapeModel.normals;
    var landscapeIndices        = landscapeModel.indices;
    var landscapeTexCoords      = landscapeModel.textures;
    //###################################################################################


    var positionAttributeLocation   = gl.getAttribLocation(program, "inPosition");
    var uvAttributeLocation         = gl.getAttribLocation(program, "inUv");
    var matrixLocation              = gl.getUniformLocation(program, "matrix");
    var textLocation                = gl.getUniformLocation(program, "u_texture");
    var perspectiveMatrix           = utils.MakePerspective(65, gl.canvas.width/gl.canvas.height, 0.1, 100.0);
    var viewMatrix                  = utils.MakeView(0, 0.0, 3.0, 0.0, 0.0);


    // missile
    vaoArray[0]                 = gl.createVertexArray();
    gl.bindVertexArray          (vaoArray[0]);

    var positionBuffer          = gl.createBuffer();
    gl.bindBuffer               (gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData               (gl.ARRAY_BUFFER, new Float32Array(missileVertices), gl.STATIC_DRAW);
    gl.enableVertexAttribArray  (positionAttributeLocation);
    gl.vertexAttribPointer      (positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);

    var uvBuffer                = gl.createBuffer();
    gl.bindBuffer               (gl.ARRAY_BUFFER, uvBuffer);
    gl.bufferData               (gl.ARRAY_BUFFER, new Float32Array(missileTexCoords), gl.STATIC_DRAW);
    gl.enableVertexAttribArray  (uvAttributeLocation);
    gl.vertexAttribPointer      (uvAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    var indexBuffer             = gl.createBuffer();
    gl.bindBuffer               (gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData               (gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(missileIndices), gl.STATIC_DRAW);

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

        if(lastUpdateTime){
            var deltaC  = (30 * (currentTime - lastUpdateTime)) / 1000.0;
            if(startMoving) {
                if (trajectory.length > 0 && deltaC > .5 && counter + 1 !== trajectory.length) {
                    if(counter === 0) {
                        if(isFromAToB) {
                            trajectory = trajectoryMaker(pA, pB, 200);
                        } else {
                            trajectory = trajectoryMaker(pB, pA, 200);
                        }
                    }
                    counter = (counter + 1);
                } else if (counter + 1 === trajectory.length) {
                    startMoving = false;
                    pauseAnimationChange();
                }
            }
            lastUpdateTime      = currentTime;
        }
    }

    function drawScene() {

        animate();
        var worldMatrix;

        utils.resizeCanvasToDisplaySize(gl.canvas);
        gl.clearColor(0.15, 0.25, 0.95, 0.56);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        for (let i = 0; i < 2; i++){
            if (i === 0){       // missile
                worldMatrix = utils.MakeWorld(ax, ay, az, 0.0, -90.0, 0.0, 0.03);
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

/*
            //in this case, each light need to be transform with a different matrix for each object
            //here we have only one light but 5 objects
            //inverse-transpose of the inverse of the world matrix is  actually the traspose of the world matrix
            var lightDirMatrix = utils.sub3x3from4x4(utils.transposeMatrix(objWorldMatrix[i]));
            //remember to normalize the normals in fragment shaders when using varyings
            var directionalLightTransformed  =
                  utils.normalizeVec3(utils.multiplyMatrix3Vector3(lightDirMatrix, directionalLight));

            gl.uniformMatrix4fv(matrixLocation, gl.FALSE, utils.transposeMatrix(projectionMatrix));

            gl.uniform3fv(materialDiffColorHandle, cubeMaterialColor);
            gl.uniform3fv(lightColorHandle,  directionalLightColor);
            gl.uniform3fv(lightDirectionHandle,  directionalLightTransformed);
*/

            gl.activeTexture        (gl.TEXTURE0);
            gl.bindTexture          (gl.TEXTURE_2D, textureArray[i]);
            gl.uniform1i            (textLocation, 0);

            gl.bindVertexArray      (vaoArray[i]);
            if (i === 0){
                gl.drawElements     (gl.TRIANGLES, missileIndices.length, gl.UNSIGNED_SHORT, 0 );
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
    var missileObjStr       = await utils.get_objstr(baseDir + objPath[0]);
    missileModel            = new OBJ.Mesh(missileObjStr);
    var landscapeObjStr     = await utils.get_objstr(baseDir + objPath[1]);
    landscapeModel          = new OBJ.Mesh(landscapeObjStr);
    //###################################################################################

    main();
}

window.onload = init;


function trajectoryMaker(start, end, steps) {
    let mid     = [(start[0] + end[0]) / 2.0, 10, (start[2] + end[2]) / 2.0];
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

    for (let i = 0; i <= steps; i++) {
        let alp     = i * 1.0 / steps;
        let q12     = q1.slerp(q2)(alp);
        let q23     = q2.slerp(q3)(alp);
        let q123    = q12.slerp(q23)(alp);

        let MR      = q123.toMatrix4();

        let uma     = 1.0 - alp;
        let c0      = uma * uma;
        let c1      = uma * alp;
        let c2      = alp * alp;

        let translate = [
            start[0] * c0 + mid[0] * c1 + end[0] * c2,
            start[1] * c0 + mid[1] * c1 + end[1] * c2,
            start[2] * c0 + mid[2] * c1 + end[2] * c2,
        ]

        let MT = utils.MakeTranslateMatrix(
            start[0] * c0 + mid[0] * c1 + end[0] * c2,
            start[1] * c0 + mid[1] * c1 + end[1] * c2,
            start[2] * c0 + mid[2] * c1 + end[2] * c2,
        );

        path.push([utils.multiplyMatrices(utils.multiplyMatrices(MT, MR), utils.MakeScaleMatrix(missile.scale))
                        , translate])
    }
    return path
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
