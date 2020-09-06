let zoomIn          = false;
let zoomOut         = false;
let goW             = false;
let goS             = false;
let goA             = false;
let goD             = false;
let mouseState      = false;
let lastMouseX      = -100;
let lastMouseY      = -100;

document.onkeydown = function (e) {
    switch (e.key) {
        case 'E':
        case 'e':
            zoomIn = true;
            break;
        case 'Q':
        case 'q':
            zoomOut = true;
            break;
        case 'W':
        case 'w':
            goW = true;
            break;
        case 'S':
        case 's':
            goS = true;
            break;
        case 'A':
        case 'a':
            goA = true;
            break;
        case 'D':
        case 'd':
            goD = true;
            break;
        case ' ':
            toggleAnimationState();
            break;
    }
};

document.onkeyup = function (e) {
    switch (e.key){
        case 'E':
        case 'e':
            zoomIn = false;
            break;
        case 'Q':
        case 'q':
            zoomOut = false;
            break;
        case 'W':
        case 'w':
            goW = false;
            break;
        case 'S':
        case 's':
            goS = false;
            break;
        case 'A':
        case 'a':
            goA = false;
            break;
        case 'D':
        case 'd':
            goD = false;
    }
}


function doMouseDown(event) {
    lastMouseX = event.pageX;
    lastMouseY = event.pageY;
    mouseState = true;
}

function doMouseUp(event) {
    lastMouseX = -100;
    lastMouseY = -100;
    mouseState = false;
}

function doMouseMove(event) {
    if (mouseState) {
        let dx = event.pageX - lastMouseX;
        let dy = lastMouseY - event.pageY;
        lastMouseX = event.pageX;
        lastMouseY = event.pageY;

        if ((dx != 0) || (dy != 0)) {
            angle = angle + 0.5 * dx;
            elevation = elevation + 0.5 * dy;
        }
    }
}

function doMouseWheel(event) { //why not working?
    var nLookRadius = lookRadius + event.wheelDelta/200.0;
    if((nLookRadius > 2.0) && (nLookRadius < 100.0)) {
       lookRadius = nLookRadius;
   }
}

function toggleAnimationState() {
    if (!startMoving) {
        if(counter + 1 === frames.length) {
            counter = 0;
            //rocket_sound.currentTime = 0;
        }
        startMoving = true;
        playAnimationChange();
    } else {
        startMoving = false;
        pauseAnimationChange();
    }
}

function resetAnimationState() {
    if (startMoving) {
        pauseAnimationChange();
    }
    startMoving = false;
    counter = 0;
    //rocket_sound.currentTime = 0;
    //rocket_sound.pause();
}

function playAnimationChange() {
    $("#action-btn").removeClass("btn-success");
    $("#action-btn").addClass("btn-danger");
    $("#action-btn").html("Pause");
    //rocket_sound.play();
}

function pauseAnimationChange() {
    $("#action-btn").removeClass("btn-danger");
    $("#action-btn").addClass("btn-success");
    $("#action-btn").html("Play");
    //rocket_sound.pause();
}
