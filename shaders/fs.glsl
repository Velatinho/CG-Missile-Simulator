#version 300 es

precision mediump float;

in vec2 fsUv;
in vec3 fsNormal;

out vec4 outColor;

uniform sampler2D u_texture;
uniform vec3 mDiffColor;
uniform vec3 lightDirection;
uniform vec3 lightColor;
uniform vec3 eyePos;


void main() {
    vec3 nNormal = normalize(fsNormal);
    vec3 lDir = (lightDirection);
    vec3 lambertColor = mDiffColor * lightColor * dot(-lDir,nNormal);
    vec4 textureColor = texture(u_texture, fsUv);

    //outColor = vec4(clamp(textureColor, 0.0, 1.0), 1.0);
    outColor = textureColor;
}
