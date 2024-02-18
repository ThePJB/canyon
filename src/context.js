export function GetContext(canvas) {
    console.log("initializing context");
    let gl = canvas.getContext('webgl2');

    if (!gl) {
        console.error('Unable to initialize WebGL. Your browser may not support it.');
        return;
    }

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    const vertexShaderSource = `
        attribute vec4 a_position;
        attribute vec3 a_normal; // New normal attribute
        uniform mat4 u_cameraMatrix;
        varying vec3 v_normal; // Pass the normal to the fragment shader

        void main() {
            gl_Position = u_cameraMatrix * a_position;
            v_normal = a_normal;
        }
    `;
    const fragmentShaderSource = `
        precision mediump float;
        varying vec3 v_normal; // Receive the normal from the vertex shader

        void main() {
            // Use the normal for shading or other calculations
            gl_FragColor = vec4(v_normal, 1.0);
        }
    `;

    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    let cameraMatrixLocation = gl.getUniformLocation(program, 'u_cameraMatrix');

    // Create and bind the VBO
    let vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);

    // Create and bind the IBO (Index Buffer Object)
    let ibo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);

    let positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
    let normalAttributeLocation = gl.getAttribLocation(program, 'a_normal'); // New normal attribute location
    gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 6 * Float32Array.BYTES_PER_ELEMENT, 0);
    gl.enableVertexAttribArray(positionAttributeLocation);

    // Specify the offset for the normal attribute
    gl.vertexAttribPointer(normalAttributeLocation, 3, gl.FLOAT, false, 6 * Float32Array.BYTES_PER_ELEMENT, 3 * Float32Array.BYTES_PER_ELEMENT);
    gl.enableVertexAttribArray(normalAttributeLocation);

    return {
        gl,
        t: 0,
        vbo,
        ibo,
        cameraMatrixLocation,
        positionAttributeLocation,
        normalAttributeLocation,
        program,
        indicesLength: 0,
        setMesh: function(indexedMesh) {
            // Update the VBO with new data
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(indexedMesh.vertices), gl.STATIC_DRAW);
            // Update the IBO with new data
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(indexedMesh.indices), gl.STATIC_DRAW);
            this.indicesLength = indexedMesh.indices.length;
        },
        draw: function(camMat) {
            const gl = this.gl;
            gl.viewport(0, 0, canvas.width, canvas.height);
            gl.useProgram(this.program);
            gl.uniformMatrix4fv(this.cameraMatrixLocation, false, camMat);

            this.t += 0.005; // Increment t on each frame

            // Your drawing logic using indexed drawing
            gl.clearColor(0.8, 0.8, 0.8, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            // Draw using indexed drawing
            gl.drawElements(gl.TRIANGLES, this.indicesLength, gl.UNSIGNED_INT, 0);
        }
    };
}
