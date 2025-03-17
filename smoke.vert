varying vec2 vST;
varying vec3 vN;
varying vec3 vL;
varying vec3 vE;
varying vec3 vMC;

uniform float uTime;

const vec3 LIGHTPOSITION = vec3(5., 5., 3.);

void main(){
    vST = gl_MultiTexCoord0.st;
    vMC = gl_Vertex.xyz;
    vec4 ECposition = gl_ModelViewMatrix * gl_Vertex;
    
    vN = normalize(gl_NormalMatrix * gl_Normal);
    vL = normalize(LIGHTPOSITION - ECposition.xyz);
    vE = normalize(-ECposition.xyz);
    
    gl_Position = gl_ModelViewProjectionMatrix * gl_Vertex;
}
