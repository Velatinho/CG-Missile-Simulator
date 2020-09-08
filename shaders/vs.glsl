#version 300 es

in vec3 inPosition;
in vec3 inNormal;
in vec2 inUv;

out vec2 fsUv;
out vec3 fsNormal;

uniform mat4 matrix;

void main() {
    fsUv        = inUv;
    fsNormal    = inNormal;
    gl_Position = matrix * vec4(inPosition, 1.0);
}
