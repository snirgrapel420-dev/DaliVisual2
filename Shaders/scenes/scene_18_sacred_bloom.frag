// 18 SACRED BLOOM — a living mandala organism of translucent membrane petals.
//
//   palette   obsidian · deep teal · bone · saffron   (macro D: Nocturne, Ember variants)
//   kick      the organism CONTRACTS like a heartbeat, then re-opens
//   sub/bass  it breathes: slow swell of the whole body and of the membranes
//   mids      the petal count morphs (each layer splits its petals), layers counter-turn
//   highs     spores drift off the petal tips
//   BUILD     petals curl inward, colour drains toward bone
//   PEAK      fully open, saffron veins ignite
//   CHAOS     petal edges fragment, spore storm
//   RELEASE   slow rebuild, embers
// Macros: A Layers · B Vein Detail · C Curl · D Palette

vec3 P0, P1, P2, P3;

void setPalette()
{
    float v = uMacro.w * 2.0;
    vec3 a0 = hex(460299.0), a1 = hex(937308.0),  a2 = hex(15260868.0), a3 = hex(15902021.0);   // obsidian, teal, bone, saffron
    vec3 b0 = hex(328714.0), b1 = hex(2759501.0), b2 = hex(10466503.0), b3 = hex(15883100.0);   // night, violet, mist, coral
    vec3 c0 = hex(656901.0), c1 = hex(4856858.0), c2 = hex(14262374.0), c3 = hex(16771266.0);   // char, oxblood, sand, cream
    float wa = clamp(1.0 - v, 0.0, 1.0), wc = clamp(v - 1.0, 0.0, 1.0), wb = 1.0 - wa - wc;
    P0 = a0 * wa + b0 * wb + c0 * wc;  P1 = a1 * wa + b1 * wb + c1 * wc;
    P2 = a2 * wa + b2 * wb + c2 * wc;  P3 = a3 * wa + b3 * wb + c3 * wc;
}

float petalProfile(float a, float n, float sharp) { return pow(abs(cos(a * n * 0.5)), sharp); }

void main()
{
    setPalette();
    vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
    float px = 1.6 / uRes.y;
    float r = length(p), a = atan(p.y, p.x);

    float build = uState.y, peak = uState.z, chaos = uState.w, calm = uState.x, rel = uStateRelease;

    // body: breathes with sub/bass (slow), contracts on the kick (fast)
    float breathe = 1.0 + 0.06 * uBassSlow + 0.05 * uSub - 0.03 * calm;
    float contract = 1.0 - 0.10 * uKick * (0.6 + 0.4 * peak);
    float open = 0.86 + 0.14 * peak + 0.06 * chaos - 0.10 * build;
    float body = breathe * contract * open;

    // background: obsidian depth with a slow teal haze turning behind the organism
    vec2 hq = rot(uMidTime * 0.02) * p * 1.6;
    float haze = fbm(hq + vec2(uBassTime * 0.03, 0.0), 4);
    vec3 col = mix(P0, P1 * 0.55, smoothstep(0.35, 0.9, haze) * 0.55 * smoothstep(1.1, 0.1, r));
    col *= 0.75 + 0.25 * smoothstep(1.0, 0.0, r);

    // petal layers, outer (back) to inner (front)
    float layers = 4.0 + floor(uMacro.x * 3.0 + 0.5);
    float curl = (0.25 + 1.2 * uMacro.z) * (0.3 + 1.4 * build) - 0.2 * peak;
    for (int i = 0; i < 7; i++)
    {
        float k = float(i);
        if (k >= layers) break;
        float t = k / max(layers - 1.0, 1.0);                       // 0 outer .. 1 inner
        float R = mix(0.62, 0.13, t) * body;
        float dir = mod(k, 2.0) < 0.5 ? 1.0 : -1.0;
        float n = 5.0 + 1.0 * mod(k, 3.0);                          // 5, 6, 7 petals per layer
        float split = smoothstep(0.35, 0.75, uMidMed);               // mids split each petal in two
        float aa = a + dir * (uMidTime * (0.035 + 0.02 * k)) + k * 0.4 + curl * dir * pow(clamp(r / R, 0.0, 1.5), 2.0);
        float prof = mix(petalProfile(aa, n, 2.2), petalProfile(aa, n * 2.0, 3.0), split * 0.6);
        // chaos frays the edges
        float fray = chaos * 0.06 * (vnoise(vec2(aa * 6.0, r * 18.0 - uHighTime * 2.0)) - 0.5);
        float edgeR = R * (0.30 + 0.70 * prof) + fray;
        float d = r - edgeR;
        float inside = smoothstep(px, -px, d);
        if (inside < 0.001 && d > 0.05) continue;

        // membrane: darker in the body, translucent toward the rim
        float rr = clamp(r / max(edgeR, 1e-3), 0.0, 1.0);
        vec3 memb = ramp4(0.15 + 0.55 * rr * (0.4 + 0.6 * t) + 0.15 * t, P0, P1, P2, P3) * (0.35 + 0.65 * rr);
        memb = mix(memb, P2 * 0.8, build * 0.35 * rr);               // build drains colour toward bone
        // veins: radial strands + growth rings, they ignite with peak and the mid band
        // a central vein down each petal + fine side veins branching toward the rim (like a real leaf)
        float pc = abs(cos(aa * n * 0.5));                                   // 1 on the petal's centre line
        float mainVein = smoothstep(0.996 - 0.006 * uMacro.y, 1.0, pc) * smoothstep(0.05, 0.4, rr);
        float side = smoothstep(0.93, 1.0, abs(sin((r / R) * (14.0 + 14.0 * uMacro.y) + pc * 6.0 - uMidTime * 0.5)))
                   * smoothstep(0.75, 0.97, pc) * 0.35;
        float vein = (mainVein + side) * rr;
        vec3 veinCol = mix(P2, P3, 0.4 + 0.6 * peak);
        memb += veinCol * vein * (0.08 + 0.55 * peak * uMid + 0.25 * uLowMid + 0.4 * uKick);
        // rim light
        float rim = smoothstep(0.012 + 0.01 * uSub, 0.0, abs(d));
        memb += mix(P2, P3, peak) * rim * (0.35 + 0.8 * uHighMid);
        // translucent layering: back layers show through
        float alpha = inside * mix(0.72, 0.9, t);
        col = mix(col, memb, alpha);
        // soft shadow cast by this layer onto the ones behind
        col *= 1.0 - 0.18 * smoothstep(0.06, 0.0, d) * (1.0 - inside);
    }

    // seed core: saffron heart that beats with the kick
    float core = exp(-r * (26.0 - 10.0 * uKick) / body);
    col += mix(P3, P2, 0.3) * core * (0.25 + 0.9 * uKick + 0.4 * peak);

    // spores: drift outward from the tips on the high band; a storm in CHAOS
    for (int s = 0; s < 3; s++)
    {
        float fs = float(s);
        float lr = log(max(r, 1e-3)) * (3.0 + fs) - uHighTime * (0.6 + 0.3 * fs) - fs * 3.1;
        vec2 cell = vec2(floor(a / TAU * (24.0 + 12.0 * fs)), floor(lr));
        float h = hash12(cell + fs * 17.0);
        float present = step(1.0 - (0.10 + 0.25 * chaos + 0.12 * uHigh), h);
        vec2 f = vec2(fract(a / TAU * (24.0 + 12.0 * fs)), fract(lr)) - 0.5;
        float dot_ = smoothstep(0.09, 0.0, length(f * vec2(1.0, 0.6))) + 0.25 * smoothstep(0.25, 0.0, length(f));
        col += mix(P2, P3, h) * dot_ * present * smoothstep(0.25, 0.5, r) * (0.18 + 0.9 * uHigh + 0.6 * uHat + 0.8 * chaos);
    }

    // release: embers linger; calm: everything quieter
    col *= 1.0 - 0.25 * calm + 0.05 * rel;
    col *= smoothstep(1.35, 0.35, length(p * vec2(0.85, 1.0)));       // vignette
    col *= uIntensity * 1.25 * mix(0.6, 1.0, uActivity);
    fragColor = vec4(col, 1.0);
}
