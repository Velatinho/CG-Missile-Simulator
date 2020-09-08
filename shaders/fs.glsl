#version 300 es

precision mediump float;

in vec3 fsNormal;
in vec2 fsUv;

out vec4 outColor;

uniform sampler2D u_texture;

uniform vec3 lightDirection;
uniform vec4 lightColor;

uniform vec4 ambientLightColor;
uniform vec4 diffuseColor;
uniform vec4 ambientMatColor;
uniform vec4 specularColor;

uniform float specShine;

vec4 compDiffuse(vec3 lightDir, vec4 lightCol, vec3 nNormal, vec4 diffColor, vec3 eyedirVec) {

  float LdotN           = max(0.0, dot(nNormal, lightDir));
  vec4 LDcol            = lightCol * diffColor;
  vec4 diffuseLambert   = LDcol * LdotN;

  return diffuseLambert;
}

vec4 compSpecular(vec3 lightDir, vec4 lightCol, vec3 nNormal, vec3 eyedirVec) {

  float LdotN           = max(0.0, dot(nNormal, lightDir));
  vec3 reflection       = -reflect(lightDir, nNormal);
  float LdotR           = max(dot(reflection, eyedirVec), 0.0);
  vec4 LScol            = lightCol * specularColor * max(sign(LdotN),0.0);
  vec4 specularPhong    = LScol * pow(LdotR, specShine);

  return specularPhong;
}

void main() {
    // normalizing varyings
    vec3 nNormal        = normalize(fsNormal);
    vec3 eyedirVec      = nNormal;

    // Texture component
    vec4 textureColor   = texture(u_texture, fsUv);
    vec4 diffColor      = diffuseColor    * 0.2 + textureColor * 0.8;
    vec4 ambColor       = ambientMatColor * 0.2 + textureColor * 0.8;


    // Lambert diffuse component
    vec4 diffuse        = compDiffuse(lightDirection, lightColor, nNormal, diffColor, eyedirVec);

    // Phong specular component
    vec4 specular       = compSpecular(lightDirection, lightColor, nNormal, nNormal);

    // Ambient component
    vec4 ambient        = ambientLightColor * ambColor;

    // clamping final result
    vec4 out_color      = clamp(ambient + diffuse + specular, 0.0, 1.0);
    outColor            = vec4(out_color.rgb, 1.0);

}
