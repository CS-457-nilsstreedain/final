uniform float uKa, uKd, uKs;
uniform float uShininess;
uniform float uTime;
uniform float uSmokeDensity;
uniform float uSmokeSpeed;
uniform vec4 uSmokeColor;

varying vec2 vST;
varying vec3 vN;
varying vec3 vL;
varying vec3 vE;
varying vec3 vMC;

// 3D noise functions
float hash(vec3 p) {
    return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
}

float noise3D(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    vec3 u = f * f * (3.0 - 2.0 * f);
    
    float n000 = hash(i);
    float n100 = hash(i + vec3(1.0, 0.0, 0.0));
    float n010 = hash(i + vec3(0.0, 1.0, 0.0));
    float n110 = hash(i + vec3(1.0, 1.0, 0.0));
    float n001 = hash(i + vec3(0.0, 0.0, 1.0));
    float n101 = hash(i + vec3(1.0, 0.0, 1.0));
    float n011 = hash(i + vec3(0.0, 1.0, 1.0));
    float n111 = hash(i + vec3(1.0, 1.0, 1.0));
    
    float n00 = mix(n000, n100, u.x);
    float n01 = mix(n001, n101, u.x);
    float n10 = mix(n010, n110, u.x);
    float n11 = mix(n011, n111, u.x);
    float n0 = mix(n00, n10, u.y);
    float n1 = mix(n01, n11, u.y);
    return mix(n0, n1, u.z);
}

float fbm3D(vec3 p) {
    float total = 0.0;
    float amplitude = 1.0;
    for (int i = 0; i < 4; i++) {
        total += amplitude * noise3D(p);
        p *= 2.0;
        amplitude *= 0.5;
    }
    return total;
}

// Main fragment shader
void main() {
    vec2 base = vST;
    
    // Move noise upward over time
    vec2 advected = base - vec2(0.0, uTime * uSmokeSpeed * 0.2);
    
    // Create a 3D point for noise sampling
    float detailScale = 3.0;
    vec3 p = vec3(advected * detailScale, uTime * 0.05);
    
    // Get fractal noise value
    float n = fbm3D(p);
    
    // Subtract bias stronger at the bottom
    float bias = 0.35;
    float effectiveBias = bias * mix(2.0, 1.0, vST.y);
    float biasedNoise = n - (1.0 - vST.y) * effectiveBias;
    
    // Map noise to alpha value, inverted so higher noise is opaque
    float noiseAlpha = smoothstep(uSmokeDensity - 0.15, uSmokeDensity + 0.15, biasedNoise);
    noiseAlpha = 1.0 - noiseAlpha;
    
    // Combine noise alpha with overall opacity and add slight variation
    float alpha = noiseAlpha * uSmokeColor.a;
    float dither = (fbm3D(vec3(vST * 10.0, uTime * 0.1)) - 0.5) * 0.1;
    alpha = clamp(alpha + dither, 0.0, 1.0);
    
    // Per-Fragment Lighting
    vec3 Normal = normalize(vN);
    vec3 Light  = normalize(vL);
    vec3 Eye    = normalize(vE);
    
    vec3 ambient = uKa * uSmokeColor.rgb;
    float diffuseFactor = max(dot(Normal, Light), 0.0);
    vec3 diffuse = uKd * diffuseFactor * uSmokeColor.rgb;
    
    float specularFactor = 0.0;
    if(diffuseFactor > 0.0) {
        vec3 reflectDir = normalize(reflect(-Light, Normal));
        float cosTheta = max(dot(Eye, reflectDir), 0.0);
        specularFactor = pow(cosTheta, uShininess);
    }
    vec3 specular = uKs * specularFactor * vec3(1.0);
    vec3 color = ambient + diffuse + specular;
    
    gl_FragColor = vec4(color, alpha);
}
