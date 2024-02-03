import { useEffect, useRef } from 'react';
import {cam_vp, normalize} from './math.js'
import { GetContext } from './context.js';
import './App.css';
import { createNoise2D } from 'simplex-noise';
import alea from 'alea';
// create a new random function based on the seed
// ok heres the plan.
// width(z) amount
// generate mesh with 
// height is like noise times width thing
// also varying lods yea


function GetFDMNormalOld(heightfn, x, z, epsilon = 0.001) {
  // Compute the height at the central point
  const centerHeight = heightfn(x, z);

  // Compute heights at neighboring points
  const heightXPlus = heightfn(x + epsilon, z);
  const heightXMinus = heightfn(x - epsilon, z);
  const heightZPlus = heightfn(x, z + epsilon);
  const heightZMinus = heightfn(x, z - epsilon);

  // Compute partial derivatives using central differencing
  const dHeight_dx = (heightXPlus - heightXMinus) / (2 * epsilon);
  const dHeight_dz = (heightZPlus - heightZMinus) / (2 * epsilon);

  // The normal vector is the negative gradient of the height function
  const normal = [-dHeight_dx, 1, -dHeight_dz];
  
  // Normalize the normal vector
  const length = Math.sqrt(normal[0] ** 2 + normal[1] ** 2 + normal[2] ** 2);
  normal[0] /= length;
  normal[1] /= length;
  normal[2] /= length;

  return normal;
}

function GetFDMNormal(heightfn, x, z, epsilon = 0.001) {
  // Compute the height at the central point
  const centerHeight = heightfn(x, z);

  // Compute heights at neighboring points
  const heightXPlus = heightfn(x + epsilon, z);
  const heightZPlus = heightfn(x, z + epsilon);

  // Compute partial derivatives using central differencing
  const dHeight_dx = (heightXPlus - centerHeight) / epsilon;
  const dHeight_dz = (heightZPlus - centerHeight) / epsilon;

  // The normal vector is the negative gradient of the height function
  const normal = [-dHeight_dx, 1, -dHeight_dz];
  
  // Normalize the normal vector
  const length = Math.sqrt(normal[0] ** 2 + normal[1] ** 2 + normal[2] ** 2);
  normal[0] /= length;
  normal[1] /= length;
  normal[2] /= length;

  return normal;
}

function CreateHeightmapMesh(heightfn, xmin, xmax, numx, zmin, zmax, numz) {
  const vertices = [];
  const indices = [];

  for (let i = 0; i <= numx; i++) {
      for (let j = 0; j <= numz; j++) {
          const x = xmin + (xmax - xmin) * (i / numx);
          const z = zmin + (zmax - zmin) * (j / numz);
          const y = heightfn(x, z);
          const normal = GetFDMNormal(heightfn, x, z);
          vertices.push(x, y, z, normal[0], normal[1], normal[2]);

          if (i < numx && j < numz) {
              const index = i * (numz + 1) + j;

              indices.push(index, index + numz + 1, index + 1);
              indices.push(index + 1, index + numz + 1, index + numz + 2);
          }
      }
  }

  return { vertices, indices };
}

// Example height function
function heightFunction(x, z) {
  return Math.cos(z)*Math.cos(x*z);
}

const hft = (t, x, z) => heightFunction(x+t*2, z+t*4);

function CalculateGeometry(seed, t) {
  const d = 8;
  const result = CreateHeightmapMesh((x,z) => hft(0, x, z), -d, d, 200, -d, d, 200);
  //const result = CreateRotatedTriangleMesh(t);
  return result;
}

// look the camera actually works thats all im sayin
// but im not really sure why it clips off when the vertex is too close

function GetCamera(t) {
  // lets zoom in -z
  return cam_vp(
    [-10*Math.cos(t), -8, -10*Math.sin(t)],
    normalize([Math.cos(t), 2, Math.sin(t)]),
    2,
    1,
    0.01,
    1000.0,
  );
}

function WebGLCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    let context = GetContext(canvasRef.current);
    const geometry = CalculateGeometry(69, context.t);
    context.setMesh(geometry);
    draw(context);
  }, []);

  const draw = (context) => {
    const cameraMatrix = GetCamera(context.t);
    context.draw(cameraMatrix);
    requestAnimationFrame(() => draw(context));
  };

  return <canvas ref={canvasRef} width={800} height={800} />;
}

function App() {
  return (
    <>
      <WebGLCanvas />
    </>
  );
}

export default App;
