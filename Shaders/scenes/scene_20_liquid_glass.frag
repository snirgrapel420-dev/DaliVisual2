// 20 LIQUID GLASS — sheets of molten glass folding over each other in the dark.
//
//   palette   black · magenta · ultraviolet · gold   (macro D: Ice, Mercury variants)
//   kick      an IMPACT: a ripple tears through the glass from the centre, light refracts apart
//   sub/bass  the great folds: slow, heavy deformation of the whole surface
//   mids      the folds morph into new shapes
//   flux      the reflected light slides to a new colour
//   highs     glints sharpen, fine ripples run over the surface
//   BUILD     the surface stills and tightens, light withdraws to the edges
//   PEAK      gold highlights, deep folds
//   CHAOS     the glass shatters into shards
// Macros: A Fold Scale · B Gloss · C Flow · D Palette

vec3 P0, P1, P2, P3;
void setPalette()
{
    float v = uMacro.w * 2.0;
    vec3 a0 = hex(328965.0),  a1 = hex(12720219.0), a2 = hex(6174129.0),  a3 = hex(16762967.0);  // black, magenta, ultraviolet, gold
    vec3 b0 = hex(198664.0),  b1 = hex(1531543.0),  b2 = hex(8441077.0),  b3 = hex(15726591.0);  // night, deep blue, ice, white-blue
    vec3 c0 = hex(394758.0),  c1 = hex(3355443.0),  c2 = hex(10066329.0), c3 = hex(16316664.0);  // mercury greys -> silver
    float wa = clamp(1.0 - v, 0.0, 1.0), wc = clamp(v - 1.0, 0.0, 1.0), wb = 1.0 - wa - wc;
    P0 = a0 * wa + b0 * wb + c0 * wc;  P1 = a1 * wa + b1 * wb + c1 * wc;
    P2 = a2 * wa + b2 * wb + c2 * wc;  P3 = a3 * wa + b3 * wb + c3 * wc;
}

float height(vec2 p)
{
    float build = uState.y;
    float t = uMidTime * (0.08 + 0.2 * uMacro.z);
    vec2 q = p * (0.6 + 0.8 * uMacro.x) * (1.0 + 0.35 * build);
    // folded sheets: ridged, domain-warped noise; bass deepens the warp
    vec2 w = vec2(fbm(q + vec2(t, 1.7), 3), fbm(q + vec2(4.1, -t), 3)) - 0.5;
    q += w * (0.9 + 1.2 * uBassSlow + 0.4 * uSub);
    q = rot(0.3 * sin(uMidTime * 0.05)) * q;
    float h = 1.0 - abs(fbm(q * 1.1, 4) * 2.0 - 1.0);
    h = pow(h, 2.2 - 0.8 * uMidMed);
    // fine ripples from the highs
    h += 0.006 * uHigh * sin(dot(p, vec2(40.0, 33.0)) - uHighTime * 6.0);
    // the kick's impact ring
    float r = length(p);
    float ringR = (1.0 - uKick) * 1.4;
    h += 0.12 * uKick * exp(-abs(r - ringR) * 9.0) * sin((r - ringR) * 30.0);
    return h * (1.0 - 0.35 * build);
}

void main()
{
    setPalette();
    vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
    float build = uState.y, peak = uState.z, chaos = uState.w, calm = uState.x;

    // CHAOS: shards — each voronoi cell is a piece of glass, slightly displaced and turned
    vec2 p = uv;
    float shardEdge = 1.0;
    if (chaos > 0.01)
    {
        vec2 g = floor(uv * 2.6 + 0.3 * fbm(uv * 3.0, 3)), f = fract(uv * 2.6 + 0.3 * fbm(uv * 3.0, 3));
        float d1 = 9.0, d2 = 9.0; vec2 id = vec2(0.0);
        for (int y = -1; y <= 1; y++)
            for (int x = -1; x <= 1; x++)
            {
                vec2 o = vec2(float(x), float(y));
                vec2 c = o + hash22(g + o);
                float d = length(c - f);
                if (d < d1) { d2 = d1; d1 = d; id = g + o; } else if (d < d2) d2 = d;
            }
        p += chaos * 0.06 * (hash22(id) - 0.5) * (0.5 + uKick);
        float crackMask = smoothstep(0.35, 0.65, vnoise(uv * 5.0 + uHighTime * 0.2));
        shardEdge = mix(1.0, mix(1.0, smoothstep(0.0, 0.018, d2 - d1), crackMask), chaos);
    }

    float e = 1.5 / uRes.y;
    float h = height(p), hx = height(p + vec2(e, 0.0)), hy = height(p + vec2(0.0, e));
    vec3 n = normalize(vec3((h - hx) / e * 0.30, (h - hy) / e * 0.30, 1.0));

    // studio reflections: glass and chrome are drawn by the lights they mirror, in the dark.
    // two soft-box bands + a rim light, coloured along the designed ramp; flux slides the studio
    vec3 v = vec3(0.0, 0.0, 1.0);
    vec3 rf = reflect(-v, n);
    float slide = uFluxSlow * 0.8 + 0.03 * uMidTime;
    float band1 = smoothstep(0.10, 0.0, abs(rf.y - 0.30 - 0.15 * sin(rf.x * 2.5 + slide)));
    float band2 = smoothstep(0.08, 0.0, abs(rf.x + 0.35 - 0.12 * sin(rf.y * 3.0 - slide)));
    float rim   = smoothstep(0.55, 0.95, length(rf.xy));
    vec3 c1 = ramp4(fract(0.15 + rf.x * 0.35 + slide * 0.2), P1, P2, P3, P1);
    vec3 c2 = ramp4(fract(0.55 + rf.y * 0.35 + slide * 0.2), P2, P3, P1, P2);
    vec3 env = c1 * band1 * 1.4 + c2 * band2 * 1.1 + P2 * rim * 0.35;
    float fres = 0.08 + 0.92 * pow(1.0 - clamp(n.z, 0.0, 1.0), 3.0);

    // body: near-black glass with a faint coloured depth (refraction, split by the kick)
    float ca = 0.004 + 0.025 * uKick;
    vec3 under = vec3(height(p + n.xy * (0.10 + ca)), height(p + n.xy * 0.10), height(p + n.xy * (0.10 - ca)));
    vec3 col = mix(P0, P1 * 0.45, under * under) * 0.8 + P2 * 0.06 * h;
    col += env * (0.35 + 1.4 * fres);

    // tight specular glints (sharpened by the highs; gold-white in PEAK)
    vec3 l1 = normalize(vec3(0.5, 0.6, 0.65));
    float sp1 = pow(max(dot(reflect(-l1, n), v), 0.0), 80.0 + 250.0 * uMacro.y + 300.0 * uHighMid);
    col += mix(P3, vec3(1.0), 0.4) * sp1 * (0.6 + 1.4 * peak);

    col *= mix(1.0, 0.55 + 0.45 * smoothstep(0.2, 1.0, length(uv)), build);  // BUILD: light withdraws to the edges
    col *= shardEdge;
    col += mix(P3, vec3(1.0), 0.5) * (1.0 - shardEdge) * 0.9 * chaos;      // lit crack edges
    col *= 1.0 - 0.2 * calm;
    col *= smoothstep(1.45, 0.45, length(uv * vec2(0.8, 1.0)));
    col *= uIntensity * 1.2 * mix(0.6, 1.0, uActivity);
    fragColor = vec4(col, 1.0);
}
