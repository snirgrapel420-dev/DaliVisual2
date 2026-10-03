// 22 HYPERDIMENSION — a tunnel of tesseracts turning through the fourth dimension.
//
//   palette   void · electric blue · white · signal red   (macro D: Acid, Monochrome variants)
//   kick      the tunnel EXPANDS in one punch, then settles
//   snare     the geometry FRACTURES: edges snap and leave gaps
//   sub/bass  slow rotation through the fourth dimension (shapes turn inside out)
//   mids      the tunnel twists
//   highs     vertices spark
//   BUILD     the tunnel stretches deep and accelerates, colour cools
//   PEAK      red signals on the vertices, full speed
//   CHAOS     permanent fracture, chromatic split
//   CALM      a few tesseracts float, turning slowly
// Macros: A Depth (copies) · B Line Weight · C Speed · D Palette

vec3 P0, P1, P2, P3;
void setPalette()
{
    float v = uMacro.w * 2.0;
    vec3 a0 = hex(65800.0),   a1 = hex(2976767.0),  a2 = hex(16119807.0), a3 = hex(16723285.0);  // void, electric blue, white, red
    vec3 b0 = hex(131330.0),  b1 = hex(5373696.0),  b2 = hex(15466475.0), b3 = hex(16711935.0);  // void, acid green, pale lime, magenta
    vec3 c0 = hex(65793.0),   c1 = hex(5263440.0),  c2 = hex(15790320.0), c3 = hex(16777215.0);  // black, grey, light, white
    float wa = clamp(1.0 - v, 0.0, 1.0), wc = clamp(v - 1.0, 0.0, 1.0), wb = 1.0 - wa - wc;
    P0 = a0 * wa + b0 * wb + c0 * wc;  P1 = a1 * wa + b1 * wb + c1 * wc;
    P2 = a2 * wa + b2 * wb + c2 * wc;  P3 = a3 * wa + b3 * wb + c3 * wc;
}

float segDist(vec2 p, vec2 a, vec2 b)
{
    vec2 pa = p - a, ba = b - a;
    float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
    return length(pa - ba * h);
}

vec4 rot4(vec4 v, float xw, float yw, float zw)
{
    v.xw *= rot(xw); v.yw *= rot(yw); v.zw *= rot(zw);
    return v;
}

void main()
{
    setPalette();
    vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
    float build = uState.y, peak = uState.z, chaos = uState.w, calm = uState.x;

    float expand = 1.0 + 0.22 * uKick;                              // kick: the tunnel expands
    float speed = (0.35 + 1.1 * uMacro.z) * (0.5 + 0.8 * build + 0.6 * peak + 0.3 * chaos);
    float travel = uBassTime * speed * 0.35 + uTime * 0.05;
    float copies = 3.0 + floor(4.0 * uMacro.x + 2.0 * build + 0.5) - floor(2.0 * calm + 0.5);
    float twist = 0.25 * sin(uMidTime * 0.15) + 0.4 * uMidMed;
    float fracture = clamp(0.6 * uSnare + 0.7 * chaos, 0.0, 1.0);
    float lw = (0.0008 + 0.0010 * uMacro.y) * (1.0 + 0.5 * peak);

    vec3 col = P0;
    // faint depth haze toward the vanishing point
    col += P1 * 0.08 * exp(-length(uv) * 3.0) * (0.5 + build);

    float ca = 0.004 * chaos;                                       // chromatic split in CHAOS
    for (int c = 0; c < 8; c++)
    {
        float fc = float(c);
        if (fc >= copies) break;
        float z = 1.2 + fc * 1.5 - fract(travel) * 1.5;            // copies stream toward the viewer
        float fade = smoothstep(copies * 1.5 + 1.0, 1.0, z) * smoothstep(0.5, 1.3, z);
        if (fade < 0.01) continue;
        float id = fc + floor(travel);
        float a1 = uBassTime * 0.12 + id * 0.7, a2 = uBassTime * 0.09 + id * 1.3, a3 = uMidTime * 0.05;

        vec2 pv[16];
        float wv[16];
        for (int i = 0; i < 16; i++)
        {
            vec4 v = vec4((i & 1) != 0 ? 1.0 : -1.0, (i & 2) != 0 ? 1.0 : -1.0, (i & 4) != 0 ? 1.0 : -1.0, (i & 8) != 0 ? 1.0 : -1.0);
            v = rot4(v, a1, a2, a3);
            float k = 1.0 / (2.8 - v.w);                            // 4D -> 3D perspective
            vec3 q = v.xyz * k * expand;
            q.xy *= rot(twist * fc + id * 0.3);
            float zz = z + q.z * 0.6;
            pv[i] = q.xy * 0.9 / max(zz, 0.2);                       // 3D -> 2D perspective
            wv[i] = v.w;
        }
        float dmin = 1e9, dmin2 = 1e9;
        for (int i = 0; i < 16; i++)
            for (int b = 0; b < 4; b++)
            {
                int j = i ^ (1 << b);
                if (j < i) continue;
                vec2 A = pv[i], B = pv[j];
                // fracture: each edge snaps, a random gap opens in its middle
                float h = hash12(vec2(float(i * 4 + b), id));
                if (fracture > 0.01 && h < 0.6)
                {
                    vec2 m = mix(A, B, 0.3 + 0.4 * h);
                    float gap = fracture * (0.15 + 0.25 * h);
                    float d1 = segDist(uv, A, mix(A, m, 1.0 - gap)), d2 = segDist(uv, mix(m, B, gap), B);
                    dmin = min(dmin, min(d1, d2));
                    dmin2 = min(dmin2, min(segDist(uv + vec2(ca, 0.0), A, mix(A, m, 1.0 - gap)), segDist(uv + vec2(ca, 0.0), mix(m, B, gap), B)));
                }
                else
                {
                    dmin = min(dmin, segDist(uv, A, B));
                    dmin2 = min(dmin2, segDist(uv + vec2(ca, 0.0), A, B));
                }
            }
        float sz = lw * (1.0 + 1.5 / max(z, 0.5));
        float line = smoothstep(sz * 1.6, sz * 0.4, dmin);
        float glow = exp(-dmin / (sz * 5.0)) * 0.16;
        vec3 lc = mix(P1, P2, 0.15 + 0.6 * smoothstep(2.2, 0.9, z));
        lc = mix(lc, P1 * 0.7 + P2 * 0.3, build * 0.4);
        col += lc * (line + glow) * fade;
        col.r += P3.r * smoothstep(sz * 1.6, sz * 0.4, dmin2) * fade * chaos * 0.5;
        // vertices: sparks on the highs, red signals in PEAK
        for (int i = 0; i < 16; i++)
        {
            float dv = length(uv - pv[i]);
            float spark = exp(-dv / (sz * (3.0 + 4.0 * uHigh))) * (0.15 + 1.2 * uHighMid + 0.8 * uHat);
            col += mix(P2, P3, peak * step(0.4, hash12(vec2(float(i), id)))) * spark * fade * 0.8;
        }
    }
    col *= 1.0 - 0.2 * calm;
    col *= smoothstep(1.5, 0.4, length(uv * vec2(0.8, 1.0)));
    col *= uIntensity * 1.3 * mix(0.6, 1.0, uActivity);
    fragColor = vec4(col, 1.0);
}
