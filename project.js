var gl;
var points = [];
var colors = [];
var normals = [];
var texCoords = [];

var program, program2;

var trballMatrix = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
var vertCubeStart, numVertCubeTri, numVertGroundTri, vertGroundStart;
var diffuseProductLoc;
//var modelMatrix;
var modelMatrixLoc, modelMatrix;
var lightSrcLoc, diffuseProductLoc;
var eyePos = vec3(0.0, 7.0, 40.0);
var atPos = vec3(0.0, 3.0, 10.0);
var upPos = vec3(0.0, 1.0, 0.0);
var trX = 0.0;
var trZ = 35.0;
var turntheta = 0.0;

var carmodelMatrix;
var carPos = vec3(trX, 0.0, trZ);

var cameraVec = vec3(0.0, -0.7071, -0.7071);

var theta = 0;
var prevTime = new Date();

var redcubePos = [
    vec3(-22.0, 2.0, 8.0),
    vec3(22.0, 2.0, 20.0)
];

function detectCollision(){
    if( carPos[0] < -50 || carPos[0] > 50 || carPos[2] <- 50 || carPos[2] > 50){
        return true;
    }

    return false;
};

function findRedcube(){
    for(var index=0; index<redcubePos.length; index++){
        if(Math.abs(carPos[0]-redcubePos[index][0]) < 1.0 && Math.abs(carPos[2]-redcubePos[index][2]) < 1.0) {
            return true;
        }
    }

    return false;
}

window.onload = function init()
{
    alert("빨간 큐브를 찾아라!");
    var canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if( !gl ) {
        alert("WebGL isn't available!");
    }
    generateRoad();
    generateGround(50);
    generateCube();
    generateTexCube();


    // virtual trackball
    var trball = trackball(canvas.width, canvas.height);
    var mouseDown = false;

    canvas.addEventListener("mousedown", function (event) {
        trball.start(event.clientX, event.clientY);

        mouseDown = true;
    });

    canvas.addEventListener("mouseup", function (event) {
        mouseDown = false;
    });

    canvas.addEventListener("mousemove", function (event) {
        if (mouseDown) {
            trball.end(event.clientX, event.clientY);

            trballMatrix = mat4(trball.rotationMatrix);
        }
    });

    // Configure WebGL
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.9, 0.9, 0.9, 1.0);

    // Enable hidden-surface removal
    gl.enable(gl.DEPTH_TEST);

    // Load shaders and initialize attribute buffers
    program = initShaders(gl, "colorVS", "colorFS");
    gl.useProgram(program);

    // Load the data into the GPU
    var bufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

    // Associate our shader variables with our data buffer
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    /*var cBufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

    var vColor = gl.getAttribLocation(program, "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);*/


    var modelMatrix = mat4(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1);
    modelMatrixLoc = gl.getUniformLocation(program, "modelMatrix");
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

    var viewMatrix = lookAt(eyePos, atPos, upPos);
    viewMatrixLoc0 = gl.getUniformLocation(program, "viewMatrix");
    gl.uniformMatrix4fv(viewMatrixLoc0, false, flatten(viewMatrix));

    // 3D orthographic viewing
    /*var viewLength = 1.5;
    var projectionMatrix;
    if (canvas.width > canvas.height) {
        var aspect = viewLength * canvas.width / canvas.height;
        projectionMatrix = ortho(-aspect, aspect, -viewLength, viewLength, -viewLength, 1000);
    }
    else {
        var aspect = viewLength * canvas.height / canvas.width;
        projectionMatrix = ortho(-viewLength, viewLength, -aspect, aspect, -viewLength, 1000);
    }*/

    // 3D perspective viewing
    var aspect = canvas.width / canvas.height;
    var projectionMatrix = perspective(90, aspect, 0.1, 1000);

    var projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

    program2 = initShaders(gl, "texMapVS", "texMapFS");
    gl.useProgram(program2);

    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    vPosition = gl.getAttribLocation(program2, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    var nBufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);

    var vNormal = gl.getAttribLocation(program2, "vNormal");
    gl.vertexAttribPointer(vNormal, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);

    var tBufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,tBufferId);
    gl.bufferData(gl.ARRAY_BUFFER,flatten(texCoords), gl.STATIC_DRAW);

    var vTexCoord = gl.getAttribLocation(program2, "vTexCoord");
    gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0,0);
    gl.enableVertexAttribArray(vTexCoord);

    modelMatrixLoc2 = gl.getUniformLocation(program2, "modelMatrix");
    viewMatrixLoc2 = gl.getUniformLocation(program2, "viewMatrix");

    projectionMatrixLoc = gl.getUniformLocation(program2, "projectionMatrix");
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

    setLighting(program2);

    var image = new Image();
    image.src = "../image/roadTexture3.bmp";
    image.onload = function(){
        setTexture(image);
    }


    render();
};


window.onkeydown = function(event) {
    var sinTheta = Math.sin(0.1);
    var cosTheta = Math.cos(0.1);
    switch (event.keyCode) {
        case 37:    // left arrow
        case 65:    // 'A'
        case 97:    // 'a'

            trX -= 0.2;
            turntheta += 5.0;
            var newVecX = cosTheta*cameraVec[0] + sinTheta*cameraVec[2];
            var newVecZ = -sinTheta*cameraVec[0] + cosTheta*cameraVec[2];
            cameraVec[0] = newVecX;
            cameraVec[2] = newVecZ;


            break;
        case 39:    // right arrow
        case 68:    // 'D'
        case 100:   // 'd'

            turntheta -= 5.0;
            var newVecX = cosTheta*cameraVec[0] - sinTheta*cameraVec[2];
            var newVecZ = sinTheta*cameraVec[0] + cosTheta*cameraVec[2];
            cameraVec[0] = newVecX;
            cameraVec[2] = newVecZ;


            break;
        case 38:    // up arrow
        case 87:    // 'W'
        case 119:   // 'w'
            if(turntheta > 0.0){
                turntheta -= 2.0;
            }else if(theta < 0.0){
                turntheta += 2.0;
            }

            var newPosX = eyePos[0] + 0.5 * cameraVec[0];
            var newPosZ = eyePos[2] + 0.5 * cameraVec[2];
            if(!detectCollision()){
                eyePos[0] = newPosX;
                eyePos[2] = newPosZ;
            }

            if(findRedcube()) alert("찾았다!");


            break;
        case 40:    // down arrow
        case 83:    // 'S'
        case 115:   // 's'

            trZ += 0.4;
            if(turntheta > 0.0){
                turntheta -= 2.0;
            }else if(turntheta < 0.0){
                turntheta += 2.0;
            }
            var newPosX = eyePos[0] - 0.5 * cameraVec[0];
            var newPosZ = eyePos[2] - 0.5 * cameraVec[2];
            if(!detectCollision()){
                eyePos[0] = newPosX;
                eyePos[2] = newPosZ;
            }

            if(findRedcube()) alert("찾았다!");
            break;
    }

        render();
};


function setLighting(program) {
    var lightSrc = [0.0, 1.0, 0.0, 0.0];
    var lightAmbient = [0.0, 0.0, 0.0, 1.0];
    var lightDiffuse = [1.0, 1.0, 1.0, 1.0];
    var lightSpecular = [1.0, 1.0, 1.0, 1.0];

    var matAmbient = [1.0, 1.0, 1.0, 1.0];
    var matDiffuse = [1.0, 1.0, 1.0, 1.0];
    var matSpecular = [1.0, 1.0, 1.0, 1.0];

    var ambientProduct = mult(lightAmbient, matAmbient);
    var diffuseProduct = mult(lightDiffuse, matDiffuse);
    var specularProduct = mult(lightSpecular, matSpecular);

    gl.uniform4fv(gl.getUniformLocation(program, "lightSrc"), lightSrc);
    gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"), ambientProduct);
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"), diffuseProduct);
    gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), specularProduct);

    gl.uniform1f(gl.getUniformLocation(program, "shininess"), 100.0);
    gl.uniform3fv(gl.getUniformLocation(program, "eyePos"), vec3(0.0, 3.0, 3.0));
};

function setTexture(image) {
    /*var image = new Image();
    image.src = "../image/brick.bmp";*/

    var texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    var texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);



};


function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    atPos[0] = eyePos[0] + cameraVec[0];
    atPos[1] = eyePos[1] + cameraVec[1];
    atPos[2] = eyePos[2] + cameraVec[2];

    var viewMatrix = lookAt(eyePos, atPos, upPos);

    gl.useProgram(program);
    gl.uniformMatrix4fv(viewMatrixLoc0, false, flatten(viewMatrix));
    gl.useProgram(program2);
    gl.uniformMatrix4fv(viewMatrixLoc2, false, flatten(viewMatrix));

    let currTime = new Date();
    let elapsedTime = currTime.getTime() - prevTime.getTime();
    theta += (elapsedTime / 10);
    prevTime = currTime;

    var modelMatrix = trballMatrix;//mat4(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1);

    var uColorLoc = gl.getUniformLocation(program, "uColor");

    var textureLoc = gl.getUniformLocation(program2, "texture");


    /*gl.useProgram(program);
    gl.uniform4f(uColorLoc, 0.8, 0.8, 0.8, 1.0);
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(trballMatrix));
    gl.drawArrays(gl.TRIANGLES, vertGroundStart, numVertGroundTri);*/

    gl.useProgram(program2);
    gl.uniform1i(textureLoc, 0);
    gl.disable(gl.DEPTH_TEST);
    gl.uniformMatrix4fv(modelMatrixLoc2, false, flatten(trballMatrix));
    gl.drawArrays(gl.TRIANGLES, vertGroundStart, numVertGroundTri);


    gl.enable(gl.DEPTH_TEST);

    gl.useProgram(program);
    gl.uniform4f(uColorLoc, 0.4, 0.4, 1.0, 1.0);

    //carPos = vec3(trX, 0.0, trZ);

    carPos = vec3(atPos[0], 0.0, atPos[2]);
    carmodelMatrix = mult(modelMatrix, translate(carPos));
    carmodelMatrix = mult(carmodelMatrix, scalem(4.0, 2.0, 4.0));
    carmodelMatrix = mult(carmodelMatrix, rotate(turntheta, 0, 10, 1));
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(carmodelMatrix));
    gl.drawArrays(gl.TRIANGLES, vertCubeStart, numVertCubeTri);


    modelMatrix = mult(modelMatrix,translate(0.0, 0.0, 17.0));

    gl.uniform4f(uColorLoc, 0.8, 0.8, 0.0, 1.0);

    modelMatrix = mult(modelMatrix, translate(-10.0, 2.5, -35));
    modelMatrix = mult(modelMatrix, scalem(5.0, 5.0, 5.0));
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
    gl.drawArrays(gl.TRIANGLES, vertCubeStart, numVertCubeTri);

    for(var i=0;i<3;i++){

        modelMatrix = mult(modelMatrix, translate(0.0, 0.0, 2.0));
        //if(i == 1) continue;
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
        gl.drawArrays(gl.TRIANGLES, vertCubeStart, numVertCubeTri);
    }


    modelMatrix = mult(modelMatrix, translate(4.0, 0.0, 0.0));
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
    gl.drawArrays(gl.TRIANGLES, vertCubeStart, numVertCubeTri);
    var sidemodelMatrix = modelMatrix;
    for(var j=0;j<3;j++){
        sidemodelMatrix = mult(sidemodelMatrix, translate(2.0, 0.0, 0.0));
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(sidemodelMatrix));
        gl.drawArrays(gl.TRIANGLES, vertCubeStart, numVertCubeTri);
    }


    gl.uniform4f(uColorLoc, 0.3, 0.3, 0.3, 1.0);
    sidemodelMatrix = mult(sidemodelMatrix, translate(-1.0, 0.0, 0.0));
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(sidemodelMatrix));
    gl.drawArrays(gl.TRIANGLES, vertCubeStart, numVertCubeTri);

    for(var j=0;j<2;j++){
        sidemodelMatrix = mult(sidemodelMatrix, translate(-2.0, 0.0, 0.0));
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(sidemodelMatrix));
        gl.drawArrays(gl.TRIANGLES, vertCubeStart, numVertCubeTri);
    }
    gl.uniform4f(uColorLoc, 0.8, 0.8, 0.0, 1.0);

    for(var i=0;i<3;i++){
        modelMatrix = mult(modelMatrix, translate(0.0, 0.0, -2.0));
        if(i == 0) continue;
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
        gl.drawArrays(gl.TRIANGLES, vertCubeStart, numVertCubeTri);
    }

    gl.uniform4f(uColorLoc, 0.3, 0.3, 0.3, 1.0);
    modelMatrix = mult(modelMatrix, translate(0.0, 0.0, 1.0));
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
    gl.drawArrays(gl.TRIANGLES, vertCubeStart, numVertCubeTri);

    for(var i=0;i<3;i++){

        modelMatrix = mult(modelMatrix, translate(0.0, 0.0, 2.0));
        if(i == 1) continue;
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
        gl.drawArrays(gl.TRIANGLES, vertCubeStart, numVertCubeTri);
        sidemodelMatrix = modelMatrix;
        if(i == 0){
            for(var j=0;j<3;j++){
                sidemodelMatrix = mult(sidemodelMatrix, translate(2.0, 0.0, 0.0));
                gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(sidemodelMatrix));
                gl.drawArrays(gl.TRIANGLES, vertCubeStart, numVertCubeTri);
            }
            gl.uniform4f(uColorLoc, 0.8, 0.8, 0.0, 1.0);
            sidemodelMatrix = mult(sidemodelMatrix, translate(-1.0, 0.0, 0.0));
            gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(sidemodelMatrix));
            gl.drawArrays(gl.TRIANGLES, vertCubeStart, numVertCubeTri);
            for(var j=0;j<2;j++){
                sidemodelMatrix = mult(sidemodelMatrix, translate(-2.0, 0.0, 0.0));
                gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(sidemodelMatrix));
                gl.drawArrays(gl.TRIANGLES, vertCubeStart, numVertCubeTri);
            }
            gl.uniform4f(uColorLoc, 0.3, 0.3, 0.3, 1.0);
        }
    }

    modelMatrix = mult(modelMatrix, translate(-4.0, 0.0, 0.0));
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
    gl.drawArrays(gl.TRIANGLES, vertCubeStart, numVertCubeTri);

    for(var i=0;i<3;i++){
        modelMatrix = mult(modelMatrix, translate(0.0, 0.0, -2.0));
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
        gl.drawArrays(gl.TRIANGLES, vertCubeStart, numVertCubeTri);
    }


    modelMatrix = mult(modelMatrix, translate(-5.0, 0.0, -1.0));
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
    gl.drawArrays(gl.TRIANGLES, vertCubeStart, numVertCubeTri);

    gl.uniform4f(uColorLoc, 0.8, 0.8, 0.0, 1.0);
    modelMatrix = mult(modelMatrix, translate(0.0, 0.0, -1.0));
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
    gl.drawArrays(gl.TRIANGLES, vertCubeStart, numVertCubeTri);

    modelMatrix = mult(modelMatrix, translate(0.0, 0.0, -2.0));
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
    gl.drawArrays(gl.TRIANGLES, vertCubeStart, numVertCubeTri);

    for(var i=0;i<4;i++){
        modelMatrix = mult(modelMatrix, translate(2.0, 0.0, 0.0));
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
        gl.drawArrays(gl.TRIANGLES, vertCubeStart, numVertCubeTri);
    }

    gl.uniform4f(uColorLoc, 0.3, 0.3, 0.3, 1.0);
    modelMatrix = mult(modelMatrix, translate(1.0, 0.0, 0.0));
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
    gl.drawArrays(gl.TRIANGLES, vertCubeStart, numVertCubeTri);

    for(var i=0;i<4;i++){
        modelMatrix = mult(modelMatrix, translate(-2.0, 0.0, 0.0));
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
        gl.drawArrays(gl.TRIANGLES, vertCubeStart, numVertCubeTri);
    }

    modelMatrix = mult(modelMatrix, translate(8.0, 0.0, 2.0));
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
    gl.drawArrays(gl.TRIANGLES, vertCubeStart, numVertCubeTri);

    gl.uniform4f(uColorLoc, 0.8, 0.8, 0.0, 1.0);
    modelMatrix = mult(modelMatrix, translate(0.0, 0.0, -1.0));
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
    gl.drawArrays(gl.TRIANGLES, vertCubeStart, numVertCubeTri);

    gl.uniform4f(uColorLoc, 0.3, 0.3, 0.3, 1.0);
    modelMatrix = mult(modelMatrix, translate(-9.0, 0.0, 0.0));
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
    gl.drawArrays(gl.TRIANGLES, vertCubeStart, numVertCubeTri);

    modelMatrix = mult(modelMatrix, translate(0.0, 0.0, 4.0));
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
    gl.drawArrays(gl.TRIANGLES, vertCubeStart, numVertCubeTri);

    for(var i=0;i<2;i++){
        modelMatrix = mult(modelMatrix, translate(0.0, 0.0, 2.0));
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
        gl.drawArrays(gl.TRIANGLES, vertCubeStart, numVertCubeTri);
    }

    gl.uniform4f(uColorLoc, 0.8, 0.8, 0.0, 1.0);
    modelMatrix = mult(modelMatrix, translate(0.0, 0.0, 1.0));
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
    gl.drawArrays(gl.TRIANGLES, vertCubeStart, numVertCubeTri);

    for(var i=0;i<3;i++){
        modelMatrix = mult(modelMatrix, translate(0.0, 0.0, -2.0));
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
        gl.drawArrays(gl.TRIANGLES, vertCubeStart, numVertCubeTri);

    }

    gl.uniform4f(uColorLoc, 0.3, 0.3, 0.3, 1.0);
    modelMatrix = mult(modelMatrix, translate(0.0, 0.0, 7.0));
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
    gl.drawArrays(gl.TRIANGLES, vertCubeStart, numVertCubeTri);

    for(var i=0;i<5;i++){
        if(i % 2 == 0){
            gl.uniform4f(uColorLoc, 0.8, 0.8, 0.0, 1.0);
        }else{
            gl.uniform4f(uColorLoc, 0.3, 0.3, 0.3, 1.0);
        }
        modelMatrix = mult(modelMatrix, translate(1.0, 0.0, 0.0));
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
        gl.drawArrays(gl.TRIANGLES, vertCubeStart, numVertCubeTri);
    }
    for(var i=0;i<4;i++){
        if(i % 2 == 0){
            gl.uniform4f(uColorLoc, 0.3, 0.3, 0.3, 1.0);
        }else{
            gl.uniform4f(uColorLoc, 0.8, 0.8, 0.0, 1.0);
        }
        modelMatrix = mult(modelMatrix, translate(0.0, 0.0, 1.0));
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
        gl.drawArrays(gl.TRIANGLES, vertCubeStart, numVertCubeTri);
    }

    for(var i=0;i<11;i++){
        if(i % 2 == 0){
            gl.uniform4f(uColorLoc, 0.3, 0.3, 0.3, 1.0);
        }else{
            gl.uniform4f(uColorLoc, 0.8, 0.8, 0.0, 1.0);
        }
        modelMatrix = mult(modelMatrix, translate(1.0, 0.0, 0.0));
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
        gl.drawArrays(gl.TRIANGLES, vertCubeStart, numVertCubeTri);
    }

    for(var i=0;i<3;i++){
        if(i % 2 == 0){
            gl.uniform4f(uColorLoc, 0.3, 0.3, 0.3, 1.0);
        }else{
            gl.uniform4f(uColorLoc, 0.8, 0.8, 0.0, 1.0);
        }
        modelMatrix = mult(modelMatrix, translate(0.0, 0.0, -1.0));
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
        gl.drawArrays(gl.TRIANGLES, vertCubeStart, numVertCubeTri);
    }

    for(var i=0;i<7;i++){
        if(i % 2 == 0){
            gl.uniform4f(uColorLoc, 0.3, 0.3, 0.3, 1.0);
        }else{
            gl.uniform4f(uColorLoc, 0.8, 0.8, 0.0, 1.0);
        }
        modelMatrix = mult(modelMatrix, translate(-1.0, 0.0, 0.0));
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
        gl.drawArrays(gl.TRIANGLES, vertCubeStart, numVertCubeTri);
    }

    gl.uniform4f(uColorLoc, 0.8, 0.8, 0.0, 1.0);
    modelMatrix = mult(modelMatrix, translate(0.0, 0.0, -1.0));
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
    gl.drawArrays(gl.TRIANGLES, vertCubeStart, numVertCubeTri);



    gl.uniform4f(uColorLoc, 0.5, 0.0, 0.0, 1.0);
    var rMatrix = mult(rotateY(theta), rotateZ(45));
    modelMatrix = mult(translate(-22.0, 2.0, 8.0), rMatrix);
    modelMatrix = mult(trballMatrix, modelMatrix);
    //modelMatrix = mult(modelMatrix, translate(-22.0, 2.0, 8.0))
    modelMatrix = mult(modelMatrix, scalem(3.0, 3.0, 3.0));
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
    gl.drawArrays(gl.TRIANGLES, vertCubeStart, numVertCubeTri);

    gl.uniform4f(uColorLoc, 0.5, 0.0, 0.0, 1.0);
    var rMatrix = mult(rotateY(theta), rotateZ(45));
    modelMatrix = mult(translate(22.0, 2.0, 20.0), rMatrix);
    modelMatrix = mult(trballMatrix, modelMatrix);
    //modelMatrix = mult(modelMatrix, translate(-22.0, 2.0, 8.0))
    modelMatrix = mult(modelMatrix, scalem(3.0, 3.0, 3.0));
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
    gl.drawArrays(gl.TRIANGLES, vertCubeStart, numVertCubeTri);


    window.requestAnimationFrame(render);
}


function base(modelMatrix){
    var sMatrix = scalem(4.0, 2.0, 4.0);
    var tMatrix = mult(translate(0.0, 1.0, 0.0), sMatrix);
    var instanceMatrix = mult(modelMatrix, tMatrix);
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(instanceMatrix));
    gl.drawArrays(gl.TRIANGLES, vertCubeStart, numVertCubeTri);
}


function generateGround(scale) {
    vertGroundStart = points.length;
    numVertGroundTri = 0;
    //var color = vec4(0.8, 0.8, 0.8, 1.0);
    for(var x=-scale; x<scale; x++) {
        for(var z=-scale; z<scale; z++) {
            // two triangles
            points.push(vec4(x, 0.0, z, 1.0));
            normals.push(vec4(0.0, 1.0, 0.0, 0.0));
            texCoords.push(vec2(0,0));
            numVertGroundTri++;

            points.push(vec4(x, 0.0, z+1, 1.0));
            normals.push(vec4(0.0, 1.0, 0.0, 0.0));
            texCoords.push(vec2(0,1));
            numVertGroundTri++;

            points.push(vec4(x+1, 0.0, z+1, 1.0));
            normals.push(vec4(0.0, 1.0, 0.0, 0.0));
            texCoords.push(vec2(1,1));
            numVertGroundTri++;

            points.push(vec4(x, 0.0, z, 1.0));
            normals.push(vec4(0.0, 1.0, 0.0, 0.0));
            texCoords.push(vec2(0,0));
            numVertGroundTri++;

            points.push(vec4(x+1, 0.0, z+1, 1.0));
            normals.push(vec4(0.0, 1.0, 0.0, 0.0));
            texCoords.push(vec2(1,1));
            numVertGroundTri++;

            points.push(vec4(x+1, 0.0, z, 1.0));
            normals.push(vec4(0.0, 1.0, 0.0, 0.0));
            texCoords.push(vec2(1,0));
            numVertGroundTri++;
        }
    }
};

function generateRoad(){
    vertRoadStart = points.length;
    numVertRoadTri = 0;

    for(var x=-7.5; x<7.5; x++) {
        for(var z=-20; z<20; z++) {
            points.push(vec4(x, 0.2, z, 1.0));
            normals.push(vec4(0.0, 1.0, 0.0, 0.0));
            texCoords.push(vec2(0,0));
            numVertRoadTri++;

            points.push(vec4(x, 0.2, z+1, 1.0));
            normals.push(vec4(0.0, 1.0, 0.0, 0.0));
            texCoords.push(vec2(0,1));
            numVertRoadTri++;

            points.push(vec4(x+1, 0.2, z+1, 1.0));
            normals.push(vec4(0.0, 1.0, 0.0, 0.0));
            texCoords.push(vec2(1,1));
            numVertRoadTri++;

            points.push(vec4(x, 0.2, z, 1.0));
            normals.push(vec4(0.0, 1.0, 0.0, 0.0));
            texCoords.push(vec2(0,0));
            numVertRoadTri++;

            points.push(vec4(x+1, 0.2, z+1, 1.0));
            normals.push(vec4(0.0, 1.0, 0.0, 0.0));
            texCoords.push(vec2(1,1));
            numVertRoadTri++;

            points.push(vec4(x+1, 0.2, z, 1.0));
            normals.push(vec4(0.0, 1.0, 0.0, 0.0));
            texCoords.push(vec2(1,0));
            numVertRoadTri++;
        }
    }
};

function generateCube() {
    vertCubeStart = points.length;
    numVertCubeTri = 0;
    quad(1, 0, 3, 2);
    quad(2, 3, 7, 6);
    quad(3, 0, 4, 7);
    quad(4, 5, 6, 7);
    quad(5, 4, 0, 1);
    quad(6, 5, 1, 2);
}

function quad(a, b, c, d) {
    vertexPos = [
        vec4(-0.5, -0.5, -0.5, 1.0),
        vec4( 0.5, -0.5, -0.5, 1.0),
        vec4( 0.5,  0.5, -0.5, 1.0),
        vec4(-0.5,  0.5, -0.5, 1.0),
        vec4(-0.5, -0.5,  0.5, 1.0),
        vec4( 0.5, -0.5,  0.5, 1.0),
        vec4( 0.5,  0.5,  0.5, 1.0),
        vec4(-0.5,  0.5,  0.5, 1.0)
    ];



    //vertexColor = vec4(0.0, 1.0, 0.0, 1.0);
    /* [
        vec4(0.0, 0.0, 0.0, 1.0),   // black
        vec4(1.0, 0.0, 0.0, 1.0),   // red
        vec4(1.0, 1.0, 0.0, 1.0),   // yellow
        vec4(0.0, 1.0, 0.0, 1.0),   // green
        vec4(0.0, 0.0, 1.0, 1.0),   // blue
        vec4(1.0, 0.0, 1.0, 1.0),   // magenta
        vec4(1.0, 1.0, 1.0, 1.0),   // white
        vec4(0.0, 1.0, 1.0, 1.0)    // cyan
    ];*/

    // We need to partition the quad into two triangles in order for WebGL
    // to be able to render it. In this case, we create two triangles from
    // the quad indices.
    var index = [ a, b, c, a, c, d ];
    for(var i=0; i<index.length; i++) {
        points.push(vertexPos[index[i]]);
        //colors.push(vertexColor);
        //colors.push(vertexColor[index[i]]);
        numVertCubeTri++;
    }
}

function generateTexCube() {
    vertCubeStart = points.length;
    numVertCubeTri = 0;
    texQuad(1, 0, 3, 2);
    texQuad(2, 3, 7, 6);
    texQuad(3, 0, 4, 7);
    texQuad(4, 5, 6, 7);
    texQuad(5, 4, 0, 1);
    texQuad(6, 5, 1, 2);
}

function texQuad(a, b, c, d) {
    vertexPos = [
        vec4(-0.5, -0.5, -0.5, 1.0),
        vec4( 0.5, -0.5, -0.5, 1.0),
        vec4( 0.5,  0.5, -0.5, 1.0),
        vec4(-0.5,  0.5, -0.5, 1.0),
        vec4(-0.5, -0.5,  0.5, 1.0),
        vec4( 0.5, -0.5,  0.5, 1.0),
        vec4( 0.5,  0.5,  0.5, 1.0),
        vec4(-0.5,  0.5,  0.5, 1.0)
    ];

    vertexNormals = [
        vec4(-0.57735, -0.57735, -0.57735, 0.0),
        vec4( 0.57735, -0.57735, -0.57735, 0.0),
        vec4( 0.57735,  0.57735, -0.57735, 0.0),
        vec4(-0.57735,  0.57735, -0.57735, 0.0),
        vec4(-0.57735, -0.57735,  0.57735, 0.0),
        vec4( 0.57735, -0.57735,  0.57735, 0.0),
        vec4( 0.57735,  0.57735,  0.57735, 0.0),
        vec4(-0.57735,  0.57735,  0.57735, 0.0)
    ];
    var texCoord = [
        vec2(0,0),
        vec2(0,1),
        vec2(1,1),
        vec2(1,0)
    ];

    // two triangles: (a, b, c) and (a, c, d)
    points.push(vertexPos[a]);
    normals.push(vertexNormals[a]);
    texCoords.push(texCoord[0]);
    numVertCubeTri++;

    points.push(vertexPos[b]);
    normals.push(vertexNormals[b]);
    texCoords.push(texCoord[1]);
    numVertCubeTri++;

    points.push(vertexPos[c]);
    normals.push(vertexNormals[c]);
    texCoords.push(texCoord[2]);
    numVertCubeTri++;

    points.push(vertexPos[a]);
    normals.push(vertexNormals[a]);
    texCoords.push(texCoord[0]);
    numVertCubeTri++;

    points.push(vertexPos[c]);
    normals.push(vertexNormals[c]);
    texCoords.push(texCoord[2]);
    numVertCubeTri++;

    points.push(vertexPos[d]);
    normals.push(vertexNormals[d]);
    texCoords.push(texCoord[3]);
    numVertCubeTri++;
}