#!/usr/bin/env python3
"""Render Zone's ambience sounds as seamless loops (assets/ambience/*.wav).

Standard library only — run it with:
    python3 tools/make_ambience.py            (all sounds)
    python3 tools/make_ambience.py rain fire  (just some)

Each sound is built from layers (beds + many small events), given a little room,
then the tail is crossfaded into the head so the file loops without a seam.
Files are mono; Zone plays two copies half a loop apart, panned left/right,
which gives a wide, natural stereo image at half the file size.
"""
import math
import os
import random
import struct
import sys
import wave

SR = 22050
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'ambience')
TAU = 2 * math.pi
EXP = math.exp
SIN = math.sin


# ---------------------------------------------------------------- building blocks
def zeros(n):
    return [0.0] * n


def white(n, rnd):
    r = rnd.random
    return [r() * 2 - 1 for _ in range(n)]


def pink(n, rnd):
    r = rnd.random
    b0 = b1 = b2 = 0.0
    out = [0.0] * n
    for i in range(n):
        w = r() * 2 - 1
        b0 = 0.99765 * b0 + w * 0.0990460
        b1 = 0.96300 * b1 + w * 0.2965164
        b2 = 0.57000 * b2 + w * 1.0526913
        out[i] = (b0 + b1 + b2 + w * 0.1848) * 0.2
    return out


def brown(n, rnd):
    r = rnd.random
    last = 0.0
    out = [0.0] * n
    for i in range(n):
        last = (last + 0.02 * (r() * 2 - 1)) / 1.02
        out[i] = last * 3.5
    return out


def lp(x, fc):
    a = 1 - EXP(-TAU * fc / SR)
    y = 0.0
    out = [0.0] * len(x)
    for i, v in enumerate(x):
        y += a * (v - y)
        out[i] = y
    return out


def hp(x, fc):
    low = lp(x, fc)
    return [a - b for a, b in zip(x, low)]


def lp_var(x, cutoff):
    """one-pole low-pass whose cutoff (Hz) changes per sample"""
    y = 0.0
    out = [0.0] * len(x)
    k = TAU / SR
    for i, v in enumerate(x):
        a = 1 - EXP(-k * cutoff[i])
        y += a * (v - y)
        out[i] = y
    return out


def bandpass_var(x, freq_at, q, step=48):
    """RBJ band-pass with a centre frequency that moves (coefficients refreshed every `step` samples)"""
    out = [0.0] * len(x)
    x1 = x2 = y1 = y2 = 0.0
    b0 = b2 = a1 = a2 = 0.0
    for i, v in enumerate(x):
        if i % step == 0:
            f = max(40.0, min(SR * 0.45, freq_at(i)))
            w0 = TAU * f / SR
            alpha = SIN(w0) / (2 * q)
            a0 = 1 + alpha
            b0 = alpha / a0
            b2 = -alpha / a0
            a1 = -2 * math.cos(w0) / a0
            a2 = (1 - alpha) / a0
        y = b0 * v + b2 * x2 - a1 * y1 - a2 * y2
        x2, x1 = x1, v
        y2, y1 = y1, y
        out[i] = y
    return out


def smooth_random(n, rate, rnd, lo=0.0, hi=1.0):
    """slowly wandering control signal between lo and hi (sum of a few slow sines with random phases)"""
    comps = [(rate * (0.5 + rnd.random()), rnd.random() * TAU, rnd.random()) for _ in range(4)]
    tot = sum(c[2] for c in comps) or 1
    out = [0.0] * n
    for i in range(n):
        t = i / SR
        s = sum(w * SIN(TAU * f * t + p) for f, p, w in comps) / tot
        out[i] = lo + (hi - lo) * (s * 0.5 + 0.5)
    return out


def add(dst, src, at, gain=1.0):
    n = len(dst)
    for j, v in enumerate(src):
        k = at + j
        if k >= n:
            k -= n          # wrap around: events near the end continue at the start (keeps the loop seamless)
        dst[k] += v * gain


def tone(freq_fn, dur, amp_fn, harm=0.0):
    n = int(dur * SR)
    out = [0.0] * n
    ph = 0.0
    for i in range(n):
        t = i / SR
        f = freq_fn(t)
        ph += TAU * f / SR
        s = SIN(ph)
        if harm:
            s += harm * SIN(2 * ph)
        out[i] = s * amp_fn(t)
    return out


def env_ad(a, d):
    return lambda t: (t / a if t < a else EXP(-(t - a) / d))


def reverb(x, wet=0.2, room=1.0):
    combs = [(0.0297 * room, 0.78), (0.0371 * room, 0.76), (0.0411 * room, 0.74), (0.0437 * room, 0.72)]
    n = len(x)
    acc = [0.0] * n
    for d, g in combs:
        L = max(2, int(d * SR))
        buf = [0.0] * L
        idx = 0
        lpv = 0.0
        for i in range(n):
            o = buf[idx]
            lpv = o * 0.6 + lpv * 0.4
            buf[idx] = x[i] + lpv * g
            idx += 1
            if idx == L:
                idx = 0
            acc[i] += o
    for d, g in [(0.005, 0.7), (0.0017, 0.7)]:
        L = max(2, int(d * SR))
        buf = [0.0] * L
        idx = 0
        for i in range(n):
            v = acc[i]
            b = buf[idx]
            o = -g * v + b
            buf[idx] = v + g * o
            idx += 1
            if idx == L:
                idx = 0
            acc[i] = o
    return [a + wet * 0.25 * b for a, b in zip(x, acc)]


def seamless(x, fade=1.2):
    """crossfade the last `fade` seconds into the start, then drop them"""
    f = int(fade * SR)
    body = x[:len(x) - f]
    tail = x[len(x) - f:]
    for i in range(f):
        k = i / f
        g_in = math.sin(k * math.pi / 2)
        g_out = math.cos(k * math.pi / 2)
        body[i] = body[i] * g_in + tail[i] * g_out
    return body


def finish(x, rms_target=0.13):
    rms = math.sqrt(sum(v * v for v in x) / len(x)) or 1
    g = rms_target / rms
    return [math.tanh(v * g * 1.1) / 1.1 for v in x]   # gentle soft-clip on rare peaks


def write(name, x):
    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(OUT, name + '.wav')
    with wave.open(path, 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(b''.join(struct.pack('<h', int(max(-1, min(1, v)) * 32767)) for v in x))
    print(f'  {name}.wav  {len(x) / SR:.1f}s  {os.path.getsize(path) // 1024} KB')


# ---------------------------------------------------------------- the sounds
def rain(rnd, D=16):
    n = int((D + 1.2) * SR)
    bed = lp(hp(pink(n, rnd), 380), 6500)
    swell = smooth_random(n, 0.08, rnd, 0.8, 1.1)
    x = [b * s * 0.55 for b, s in zip(bed, swell)]
    far = lp(brown(n, rnd), 220)
    for i in range(n):
        x[i] += far[i] * 0.18
    # patter: hundreds of tiny drops, each a short falling ping
    for _ in range(int(D * 70)):
        f0 = rnd.uniform(1700, 5600)
        dur = rnd.uniform(0.006, 0.022)
        amp = min(0.14, rnd.expovariate(30))
        drop = tone(lambda t, f0=f0, d=dur: f0 * (1 - 0.35 * t / d), dur, env_ad(0.0004, dur / 4))
        add(x, drop, rnd.randrange(n), amp)
    # heavier drips on the sill
    for _ in range(int(D * 1.6)):
        f0 = rnd.uniform(380, 900)
        drip = tone(lambda t, f0=f0: f0 * (1 + 0.6 * EXP(-t / 0.01)), 0.12, env_ad(0.001, 0.035), 0.2)
        add(x, drip, rnd.randrange(n), rnd.uniform(0.05, 0.12))
    return finish(seamless(reverb(x, 0.18)), 0.12)


def fire(rnd, D=18):
    n = int((D + 1.2) * SR)
    flick = smooth_random(n, 0.6, rnd, 0.55, 1.0)
    rumble = lp(brown(n, rnd), 520)
    hiss = lp(hp(white(n, rnd), 2800), 7000)
    x = [rumble[i] * flick[i] * 0.55 + hiss[i] * 0.035 * flick[i] for i in range(n)]
    # crackles come in little clusters, with the odd loud pop
    t = 0.0
    while t < D + 1.2:
        t += rnd.uniform(0.08, 0.55)
        for _ in range(rnd.choice([1, 1, 2, 3, 4, 6])):
            at = int((t + rnd.uniform(0, 0.06)) * SR) % n
            f = rnd.uniform(1100, 4200)
            big = rnd.random() < 0.06
            dur = 0.004 if not big else 0.02
            amp = min(0.55, rnd.expovariate(7)) if not big else rnd.uniform(0.5, 0.8)
            click = tone(lambda tt, f=f if not big else f * 0.35: f, dur, env_ad(0.0002, dur / 3))
            burst = [v * (rnd.random() * 2 - 1) * 0.6 + v * 0.4 for v in click]
            add(x, burst, at, amp)
    return finish(seamless(reverb(x, 0.12, 0.7)), 0.13)


def wind(rnd, D=20):
    n = int((D + 1.2) * SR)
    gust = smooth_random(n, 0.07, rnd, 0.15, 1.0)
    gust = [g ** 1.6 for g in gust]
    src = pink(n, rnd)
    centre = smooth_random(n, 0.05, rnd, 260, 820)
    body = bandpass_var(src, lambda i: centre[i] * (0.85 + 0.3 * gust[i]), 1.1)
    whistle_c = smooth_random(n, 0.09, rnd, 1150, 1750)
    whistle = bandpass_var(white(n, rnd), lambda i: whistle_c[i], 7.0)
    low = lp(brown(n, rnd), 160)
    x = [body[i] * (0.35 + 0.9 * gust[i]) + whistle[i] * 0.18 * gust[i] ** 2 + low[i] * 0.2 for i in range(n)]
    return finish(seamless(x), 0.12)


def bird_call(rnd):
    kind = rnd.choice(['warble', 'warble', 'feebee', 'chip', 'dove'])
    parts = []
    if kind == 'warble':
        t = 0.0
        for _ in range(rnd.randint(4, 8)):
            f = rnd.uniform(2600, 4600); d = rnd.uniform(0.05, 0.12); sweep = rnd.uniform(-0.25, 0.3)
            parts.append((t, tone(lambda tt, f=f, d=d, s=sweep: f * (1 + s * tt / d) * (1 + 0.02 * SIN(TAU * 38 * tt)), d,
                                  lambda tt, d=d: SIN(math.pi * tt / d) ** 2, 0.12)))
            t += d + rnd.uniform(0.02, 0.06)
    elif kind == 'feebee':
        f1 = rnd.uniform(3600, 4000)
        parts.append((0.0, tone(lambda tt: f1 - 150 * tt, 0.32, lambda tt: SIN(math.pi * tt / 0.32) ** 1.5)))
        parts.append((0.42, tone(lambda tt: f1 * 0.84 + 60 * tt, 0.36, lambda tt: SIN(math.pi * tt / 0.36) ** 1.5)))
    elif kind == 'chip':
        for k in range(rnd.randint(2, 4)):
            parts.append((k * 0.11, tone(lambda tt: 5200 - 18000 * tt, 0.03, lambda tt: SIN(math.pi * tt / 0.03))))
    else:  # distant dove
        for k, (f, d) in enumerate([(620, 0.35), (700, 0.5), (640, 0.45)]):
            parts.append((k * 0.62, tone(lambda tt, f=f: f, d, lambda tt, d=d: SIN(math.pi * tt / d) ** 2, 0.25)))
    total = max(p[0] for p in parts) + 0.6
    out = zeros(int(total * SR))
    for at, p in parts:
        add(out, p, int(at * SR))
    return out, (0.05 if kind == 'dove' else rnd.uniform(0.06, 0.12))


def forest(rnd, D=24):
    n = int((D + 1.2) * SR)
    babble = lp([abs(v) for v in white(n, rnd)], 7)
    s1 = bandpass_var(white(n, rnd), lambda i: 1700, 0.8)
    s2 = bandpass_var(white(n, rnd), lambda i: 3300, 1.0)
    x = [(s1[i] * 0.6 + s2[i] * 0.4) * (0.35 + babble[i] * 1.6) * 0.5 for i in range(n)]
    # leaves rustling now and then
    for _ in range(int(D / 3)):
        d = rnd.uniform(0.4, 1.1)
        m = int(d * SR)
        rustle = hp(white(m, rnd), 2200)
        rustle = [v * SIN(math.pi * j / m) ** 2 for j, v in enumerate(rustle)]
        add(x, rustle, rnd.randrange(n), rnd.uniform(0.04, 0.08))
    for _ in range(int(D * 0.55)):
        call, amp = bird_call(rnd)
        add(x, call, rnd.randrange(n), amp)
    return finish(seamless(reverb(x, 0.3, 1.3)), 0.11)


def waves(rnd, D=24):
    n = int((D + 1.2) * SR)
    roar = lp(brown(n, rnd), 260)
    noise_a = pink(n, rnd)
    noise_b = white(n, rnd)
    cutoff = [300.0] * n
    amp = [0.18] * n
    hissamp = [0.0] * n
    t = 0.0
    while t < D + 1.2:
        period = rnd.uniform(7.4, 8.6)
        for i in range(int(t * SR), min(n, int((t + period) * SR))):
            u = (i / SR - t) / period            # 0..1 through one wave
            if u < 0.38:                          # swell building
                k = (u / 0.38) ** 2
                cutoff[i] = 300 + 1900 * k; amp[i] = 0.18 + 0.75 * k; hissamp[i] = 0.05 * k
            elif u < 0.48:                        # crash
                k = 1 - (u - 0.38) / 0.10
                cutoff[i] = 2200 + 2200 * k; amp[i] = 0.93; hissamp[i] = 0.05 + 0.25 * k
            else:                                 # wash back
                k = EXP(-(u - 0.48) / 0.18)
                cutoff[i] = 300 + 1700 * k; amp[i] = 0.18 + 0.7 * k; hissamp[i] = 0.3 * EXP(-(u - 0.48) / 0.3)
        t += period
    surf = lp_var(noise_a, cutoff)
    fizz = hp(noise_b, 2600)
    x = [roar[i] * 0.4 + surf[i] * amp[i] + fizz[i] * hissamp[i] * 0.5 for i in range(n)]
    return finish(seamless(reverb(x, 0.15)), 0.13)


def cafe(rnd, D=20):
    n = int((D + 1.2) * SR)
    x = zeros(n)
    # murmur: several "voices" of formant-shaped noise with syllable-like rhythm
    for v in range(7):
        f1, f2 = rnd.uniform(380, 750), rnd.uniform(1100, 2100)
        src = pink(n, rnd)
        voice = [a * 0.6 + b * 0.4 for a, b in zip(bandpass_var(src, lambda i, f=f1: f, 2.5), bandpass_var(src, lambda i, f=f2: f, 3.5))]
        envl = zeros(n)
        t = rnd.uniform(0, 2)
        while t < D + 1.2:
            phrase = rnd.uniform(1.0, 3.2)
            end = t + phrase
            while t < end:
                syl = rnd.uniform(0.11, 0.24)
                a = int(t * SR); m = int(syl * SR)
                peak = rnd.uniform(0.5, 1.0)
                for j in range(m):
                    k = a + j
                    if k < n:
                        envl[k] = max(envl[k], peak * SIN(math.pi * j / m))
                t += syl + rnd.uniform(0.0, 0.05)
            t += rnd.uniform(0.6, 2.5)
        envl = lp(envl, 18)
        dist = rnd.uniform(0.35, 1.0)
        for i in range(n):
            x[i] += voice[i] * envl[i] * dist * 0.5
    x = lp(x, 2600)
    # cups and spoons
    for _ in range(int(D / 1.6)):
        f = rnd.uniform(1800, 3300)
        clink = zeros(int(0.6 * SR))
        for ratio, a, d in [(1, 1, 0.35), (2.76, 0.5, 0.18), (5.4, 0.25, 0.08), (8.9, 0.12, 0.04)]:
            add(clink, tone(lambda tt, ff=f * ratio: ff, 0.6, env_ad(0.0005, d)), 0, a)
        at = rnd.randrange(n)
        add(x, clink, at, rnd.uniform(0.025, 0.06))
        if rnd.random() < 0.4:   # spoon double-tap
            add(x, clink, at + int(rnd.uniform(0.09, 0.16) * SR), rnd.uniform(0.015, 0.035))
    # a distant steam wand, once
    m = int(2.2 * SR)
    steam = lp(hp(white(m, rnd), 3000), 7500)
    steam = [v * min(1, j / (0.3 * SR), (m - j) / (0.5 * SR)) for j, v in enumerate(steam)]
    add(x, steam, rnd.randrange(n), 0.04)
    return finish(seamless(reverb(x, 0.35, 1.1)), 0.11)


SOUNDS = {'rain': rain, 'fire': fire, 'wind': wind, 'forest': forest, 'waves': waves, 'cafe': cafe}

if __name__ == '__main__':
    names = sys.argv[1:] or list(SOUNDS)
    for name in names:
        print('rendering', name, '…', flush=True)
        write(name, SOUNDS[name](random.Random(sum(map(ord, name)) * 7919)))
