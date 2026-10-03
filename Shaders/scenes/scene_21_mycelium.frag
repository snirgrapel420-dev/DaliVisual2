// 21 MYCELIUM — a living, luminous network growing through the dark.
//
//   palette   forest black · moss · bio-green · amber   (macro D: Deep Sea, Ember Root variants)
//   kick      a SIGNAL runs outward along the filaments, node to node (like a nerve impulse)
//   sub/bass  the whole network breathes and drifts in the soil
//   mids      growth: the network spreads further from its origin
//   highs     spores glitter at the nodes
//   BUILD     the network branches into finer filaments, colour turns toward amber
//   PEAK      bioluminescence: bright filaments, strong signals
//   CHAOS     filaments flicker and break into fragments
//   RELEASE   the network dims, slow signals still travel
// Macros: A Strands · B Branching · C Growth · D Palette

vec3 P0, P1, P2, P3;
void setPalette()
{
    float v = uMacro.w * 2.0;
    vec3 a0 = hex(330247.0),  a1 = hex(3104058.0),  a2 = hex(9306010.0),  a3 = hex(16758087.0); // forest black, moss, bio-green, amber
    vec3 b0 = hex(132886.0),  b1 = hex(1066609.0),  b2 = hex(4513791.0),  b3 = hex(14745599.0); // abyss, deep teal, electric cyan, pale
    vec3 c0 = hex(526340.0),  c1 = hex(5911571.0),  c2 = hex(16737843.0), c3 = hex(16774843.0); // soil, rust, flame, cream
    float wa = clamp(1.0 - v, 0.0, 1.0), wc = clamp(v - 1.0, 0.0, 1.0), wb = 1.0 - wa - wc;
    P0 = a0 * wa + b0 * wb + c0 * wc;  P1 = a1 * wa + b1 * wb + c1 * wc;
    P2 = a2 * wa + b2 * wb + c2 * wc;  P3 = a3 * wa + b3 * wb + c3 * wc;
}

// One colony: hyphae radiating from an origin and splitting in two again and again (a binary tree).
// Each level's strands move apart continuously from their parent (a V-split), so branches are born,
// not placed. Returns colour.
vec3 colony(vec2 p, vec2 origin, float seed, float grow, float build, float peak, float chaos)
{
    vec2 d = p - origin;
    float r = length(d);
    float th = atan(d.y, d.x) / TAU + seed;
    // organic wiggle: one warp shared by all levels so children stay attached to their parents
    th += 0.06 * (fbm(vec2(r * 3.0, seed * 13.0) + uBassTime * 0.015, 3) - 0.5) / max(r, 0.08)
        + 0.015 * sin(r * 22.0 + seed * 5.0);

    float n0 = floor(3.0 + 3.0 * uMacro.x);
    float cell = 1.0 / n0;
    float x = (fract(th * n0) - 0.5) * cell;                       // turns from the strand centre
    float levels = min(5.0, 2.0 + floor(2.0 * uMacro.y + 0.5) + floor(1.5 * build + 0.5));
    float ri = 0.05;
    float nodeGlow = 0.0;
    for (int i = 0; i < 7; i++)
    {
        if (float(i) >= levels) break;
        float t = smoothstep(ri, ri + 0.10, r);
        float c = cell * 0.25;
        nodeGlow += exp(-length(vec2((r - ri) * 18.0, abs(x) * TAU * r * 60.0))) * (1.0 - t * 0.0);
        x = abs(abs(x) - c * t);                                    // V-split: one strand becomes two
        cell *= mix(1.0, 0.5, t);
        ri *= 1.75;
    }
    float arc = abs(x) * TAU * r;                                   // distance to the nearest hypha (screen units)
    float px = 1.5 / uRes.y;
    float w = 0.0025 + 0.004 * smoothstep(0.6, 0.0, r);              // thicker near the origin
    float fil = smoothstep(w + px, w * 0.3, arc);
    float glow = exp(-arc * 380.0) * 0.35;

    float alive = smoothstep(grow, grow - 0.12, r);                 // growth front
    float tip = exp(-abs(r - grow + 0.05) * 30.0) * fil;             // growing tips glow

    float sigR = (1.0 - uKick) * 1.2;
    float signal = exp(-abs(r - sigR) * 16.0) * uKick;
    float slow = pow(0.5 + 0.5 * sin(r * 16.0 - uBassTime * 2.2 + seed * 9.0), 14.0);
    float flick = mix(1.0, step(0.3, hash12(vec2(floor(th * 160.0), floor(r * 14.0) + floor(uHighTime * 8.0)))), chaos);

    vec3 base = mix(P1, P2, 0.3 + 0.5 * peak);
    base = mix(base, P3, build * 0.55);
    vec3 col = base * (fil + glow) * (0.35 + 0.45 * uEnergyMed + 0.6 * peak) * flick;
    col += mix(P2, P3, 0.55) * (fil + glow) * (signal * 2.2 + slow * 0.3 * (0.4 + uBass));
    col += mix(P2, P3, 0.7) * nodeGlow * 0.25 * (0.3 + uHighMid + signal) * fil;
    col += P3 * tip * (0.6 + 0.8 * uMidMed);
    return col * alive;
}

void main()
{
    setPalette();
    vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
    float build = uState.y, peak = uState.z, chaos = uState.w, calm = uState.x, rel = uStateRelease;

    p *= 1.0 - 0.03 * uSub;                                         // breathing
    vec3 col = P0 * (0.6 + 0.4 * fbm(p * 2.0 + uBassTime * 0.01, 3));   // soil

    // three colonies spread through the soil; each grows with the mids, staggered
    float g = 0.22 + 0.3 * uMacro.z + 0.18 * uMidMed + 0.15 * peak + 0.1 * build;
    vec3 net = vec3(0.0);
    net += colony(p, vec2(-0.25, -0.05), 0.11, g * 1.25, build, peak, chaos);
    net += colony(p, vec2(0.55, 0.30), 0.53, g * 0.85, build, peak, chaos) * 0.8;
    net += colony(p, vec2(0.35, -0.42), 0.87, g * 0.65, build, peak, chaos) * 0.7;
    // a far, blurred colony gives depth
    col += net * 0.75;
    col += mix(P2, P3, 0.5) * exp(-length(p - vec2(-0.25, -0.05)) * 14.0) * (0.2 + 0.6 * uKick + 0.3 * peak);
    col *= 1.0 - 0.3 * calm - 0.15 * rel;
    col *= smoothstep(1.4, 0.35, length(p * vec2(0.8, 1.0)));
    col *= uIntensity * 1.35 * mix(0.6, 1.0, uActivity);
    fragColor = vec4(col, 1.0);
}
