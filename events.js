let zoomIn          = false;
let zoomOut         = false;
let goW             = false;
let goS             = false;
let goA             = false;
let goD             = false;
let speedUp         = false;
let speedDown       = false;
let heightUp        = false;
let heightDown      = false;
let mouseState      = false;
let lastMouseX      = -100;
let lastMouseY      = -100;
let soundEffect     = new Audio('Assets/Sound/soundEffect.mp3');

document.onkeydown = function (e) {
    switch (e.key) {
        case 'E':
        case 'e':
            zoomIn      = true;
            break;
        case 'Q':
        case 'q':
            zoomOut     = true;
            break;
        case 'W':
        case 'w':
            goW         = true;
            break;
        case 'S':
        case 's':
            goS         = true;
            break;
        case 'A':
        case 'a':
            goA         = true;
            break;
        case 'D':
        case 'd':
            goD         = true;
            break;
        case 'Y':
        case 'y':
            speedUp     = true;
            break;
        case 'H':
        case 'h':
            speedDown   = true;
            break;
        case 'U':
        case 'u':
            heightUp    = true;
            break;
        case 'J':
        case 'j':
            heightDown  = true;
            break;
        case '1':
            loadTextureRuntime(1);
            break;
        case '2':
            loadTextureRuntime(2);
            break;
        case '3':
            loadTextureRuntime(3);
            break;
        case '4':
            loadTextureRuntime(4);
            break;
        case ' ':
            startStopAnimation();
            break;
    }
};

document.onkeyup = function (e) {
    switch (e.key){
        case 'E':
        case 'e':
            zoomIn      = false;
            break;
        case 'Q':
        case 'q':
            zoomOut     = false;
            break;
        case 'W':
        case 'w':
            goW         = false;
            break;
        case 'S':
        case 's':
            goS         = false;
            break;
        case 'A':
        case 'a':
            goA         = false;
            break;
        case 'D':
        case 'd':
            goD         = false;
        case 'Y':
        case 'y':
            speedUp     = false;
            break;
        case 'H':
        case 'h':
            speedDown   = false;
            break;
        case 'U':
        case 'u':
            heightUp    = false;
            break;
        case 'J':
        case 'j':
            heightDown  = false;
            break;
    }
}

function setLightAlpha(){
    alpha   = $("#alphaLight").val();
}

function setLightBeta(){
    beta    = $("#betaLight").val();
    console.log(beta);
}


function doMouseDown(event) {
    lastMouseX  = event.pageX;
    lastMouseY  = event.pageY;
    mouseState  = true;
}

function doMouseUp(event) {
    lastMouseX  = -100;
    lastMouseY  = -100;
    mouseState  = false;
}

function doMouseMove(event) {
    if (mouseState) {
        let dx      = event.pageX - lastMouseX;
        let dy      = lastMouseY - event.pageY;
        lastMouseX  = event.pageX;
        lastMouseY  = event.pageY;

        if ((dx != 0) || (dy != 0)) {
            angle       = angle + 0.5 * dx;
            elevation   = elevation + 0.5 * dy;
        }
    }
}

function doMouseWheel(event) {
    var newRadius   = radius + event.wheelDelta/150.0;
    if((newRadius > minRad) && (newRadius < maxRad))
       radius       = newRadius;
}

function doResize() {
    // set canvas dimensions
	var canvas = document.getElementById("my-canvas");
    if((window.innerWidth > 40) && (window.innerHeight > 240)) {
		canvas.width  = window.innerWidth-16;
		canvas.height = window.innerHeight-200;
		gl.viewport(0.0, 0.0, canvas.width, canvas.height);
    }
}

function startStopAnimation() {
    if (!startMoving) {
        if(counter + 1 === trajectory.length) {
            counter = 0;
            soundEffect.currentTime = 0;
        }
        startMoving = true;
    } else {
        startMoving = false;
    }
}
