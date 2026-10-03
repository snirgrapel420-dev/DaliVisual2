// 23 SOLAR TEMPLE — a gate of engraved sacred geometry before a vast sun, in shimmering heat.
//
//   palette   maroon · burnt orange · sand gold · turquoise   (macro D: Dusk, Moon Temple variants)
//   kick      a PULSE travels outward through the rings of the gate, ring after ring
//   sub/bass  the sun breathes, the heat shimmer thickens
//   mids      the rings counter-rotate, the central yantra turns
//   highs     gold glints run along the engravings
//   BUILD     an eclipse: a dark disc slides over the sun, rays tighten into a corona
//   PEAK      solar flare: the corona blazes, turquoise inlays glow
//   CHAOS     the rings slip out of alignment and shudder
//   RELEASE   dusk: the sun sinks into warm haze
// Macros: A Rings · B Engraving Detail · C Rotation · D Palette

vec3 P0, P1, P2, P3;
void setPalette()
{
    float v = uMacro.w * 2.0;
    vec3 a0 = hex(2755090.0),  a1 = hex(14964526.0), a2 = hex(15984034.0), a3 = hex(1556155.0);   // maroon, burnt orange, sand, turquoise
    vec3 b0 = hex(1641251.0),  b1 = hex(12008286.0), b2 = hex(16762531.0), b3 = hex(5785550.0);   // dusk violet, rose, peach, lilac
    vec3 c0 = hex(330001.0),   c1 = hex(3824269.0),  c2 = hex(13751016.0), c3 = hex(9759976.0);   // night, slate, moonlight, ice
    float wa = clamp(1.0 - v, 0.0, 1.0), wc = clamp(v - 1.0, 0.0, 1.0), wb = 1.0 - wa - wc;
    P0 = a0 * wa + b0 * wb + c0 * wc;  P1 = a1 * wa + b1 * wb + c1 * wc;
    P2 = a2 * wa + b2 * wb + c2 * wc;  P3 = a3 * wa + b3 * wb + c3 * wc;
}

// one engraved ring: a band of repeating sacred motifs, metallic
vec3 ring(vec2 p, float R, float w, float n, float kind, float spin, float pulse, out float mask)
{
    float r = length(p);
    float a = atan(p.y, p.x) + spin;
    float band = 1.0 - smoothstep(w * 0.5 - 0.002, w * 0.5 + 0.002, abs(r - R));
    mask = band;
    if (band < 0.001) return vec3(0.0);
    float u = fract(a / TAU * n);                       // position within one motif
    float v = (r - (R - w * 0.5)) / w;                  // 0 inner edge .. 1 outer edge
    float px = 2.0 / uRes.y / w;
    float m;
    if (kind < 0.5)        // triangles (teeth)
        m = abs(abs(u - 0.5) * 2.0 - v);
    else if (kind < 1.5)   // lotus petals
        m = abs(length(vec2((u - 0.5) * 1.6, v - 0.15)) - 0.55);
    else                   // beads between two lines
        m = min(abs(length(vec2(u - 0.5, (v - 0.5) * 0.6)) - 0.22), min(abs(v - 0.1), abs(v - 0.9)));
    float detail = 0.045 - 0.02 * uMacro.y;
    float engr = smoothstep(detail + px, detail - px, m);
    // metallic shading: the gold catches light from the sun's side
    float sheen = 0.55 + 0.45 * cos(a - spin - 0.6);
    vec3 metal = mix(P1 * 0.55, P2, sheen);
    vec3 c = mix(P0 * 0.9, metal * 0.18, 0.5) * band;   // the band itself, dark bronze
    c += metal * engr * (0.85 + 0.9 * pulse);
    // turquoise inlay in the hollows
    c += P3 * (1.0 - engr) * smoothstep(0.25, 0.08, m) * 0.55 * band;
    // glints along the engraving on the highs
    float glint = pow(max(0.0, sin(a * 3.0 - uHighTime * 3.0 + R * 20.0)), 40.0);
    c += mix(P2, vec3(1.0), 0.4) * engr * glint * (0.3 + 1.6 * uHighMid);
    return c;
}

void main()
{
    setPalette();
    vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
    float build = uState.y, peak = uState.z, chaos = uState.w, calm = uState.x, rel = uStateRelease;

    // heat shimmer: thickens with the bass
    vec2 haze = vec2(vnoise(uv * 9.0 + vec2(0.0, uBassTime * 0.6)), vnoise(uv * 9.0 + vec2(5.0, uBassTime * 0.5))) - 0.5;
    vec2 p = uv + haze * (0.002 + 0.006 * uBassSlow + 0.004 * uSub);
    float r = length(p);

    // sky: maroon dusk, warmer toward the sun
    vec3 col = mix(P0 * 0.55, P1 * 0.28, smoothstep(0.9, 0.0, r));
    col = mix(col, P0 * 0.8, rel * smoothstep(0.0, 1.0, -uv.y + 0.2));   // release: dusk settles

    // the sun: breathes with the bass; an eclipse disc covers it during BUILD
    float sunR = 0.22 * (1.0 + 0.04 * uBassSlow + 0.03 * uSub);
    float limb = smoothstep(sunR, sunR - 0.01, r);
    vec3 sun = mix(P1, P2, smoothstep(sunR, 0.0, r) * 0.9) * (0.9 + 0.3 * uEnergyMed);
    vec2 ecl = vec2(mix(0.45, 0.02, smoothstep(0.0, 1.0, build)), 0.0);
    float moon = smoothstep(sunR * 0.98, sunR * 0.96, length(p - ecl)) * smoothstep(0.0, 0.3, build);
    col = mix(col, sun, limb * (1.0 - moon));
    // corona and rays: tighter in the eclipse, blazing in PEAK
    float ang = atan(p.y, p.x);
    float rays = pow(0.5 + 0.5 * sin(ang * 18.0 + fbm(vec2(ang * 3.0, uMidTime * 0.2), 3) * 4.0), 6.0);
    float corona = exp(-(r - sunR) * (5.0 - 2.0 * peak + 6.0 * build)) * step(sunR * 0.98, r);
    col += mix(P1, P2, 0.5) * corona * (0.35 + 0.4 * rays) * (0.6 + 1.3 * peak + 0.8 * uDrop);
    col += P2 * exp(-abs(r - sunR) * 80.0) * moon * 1.2;           // the diamond ring of the eclipse

    // the gate: rings of engraved geometry, counter-rotating; the kick's pulse runs outward
    float nr = 2.0 + floor(2.0 * uMacro.x + 0.5);
    float front = (1.0 - uKick) * 1.2;
    for (int i = 0; i < 6; i++)
    {
        float k = float(i);
        if (k >= nr) break;
        float R = 0.30 + 0.13 * k;
        float pulse = exp(-abs(front - R) * 10.0) * uKick;
        float dir = mod(k, 2.0) < 0.5 ? 1.0 : -1.0;
        float spin = dir * uMidTime * (0.02 + 0.03 * uMacro.z) * (1.0 + 0.3 * k);
        spin += chaos * 0.15 * sin(uHighTime * 3.0 + k * 2.0);            // chaos: rings shudder out of line
        vec2 off = chaos * 0.012 * vec2(sin(uHighTime * 5.0 + k), cos(uHighTime * 4.0 + k * 1.7));
        float mask;
        vec3 rc = ring(p - off, R * (1.0 + 0.03 * pulse), 0.05, 12.0 + 6.0 * k, mod(k, 3.0), spin, pulse, mask);
        col = mix(col, rc, mask * 0.92);
    }

    // central yantra over the sun: interlocking triangles, turning with the mids
    vec2 q = rot(uMidTime * 0.03) * p;
    float tri = 1e9;
    for (int t = 0; t < 4; t++)
    {
        float s = 0.07 + 0.035 * float(t);
        float flip = mod(float(t), 2.0) < 0.5 ? 1.0 : -1.0;
        vec2 qq = rot(flip > 0.0 ? 0.0 : PI) * q;
        float d = max(abs(qq.x) * 0.866 + qq.y * 0.5, -qq.y) - s * 0.5;  // equilateral triangle outline
        tri = min(tri, abs(d));
    }
    float yl = smoothstep(0.004, 0.0015, tri) * smoothstep(sunR * 0.95, sunR * 0.7, r);
    col = mix(col, P0 * 0.6, yl * 0.8);                                  // dark engraved lines on the sun
    col += P2 * yl * 0.3 * (uKick + peak * 0.3);

    // dust in the light
    vec2 dg = uv * 60.0 + vec2(uHighTime * 0.5, -uMidTime * 0.3);
    col += P2 * step(0.994, hash12(floor(dg))) * smoothstep(0.3, 0.0, length(fract(dg) - 0.5)) * (0.3 + uHigh);

    col *= 1.0 - 0.2 * calm;
    col *= smoothstep(1.45, 0.4, length(uv * vec2(0.8, 1.0)));
    col *= uIntensity * 1.05 * mix(0.6, 1.0, uActivity);
    fragColor = vec4(col, 1.0);
}
