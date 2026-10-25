#!/usr/bin/env python3
"""Synthesise Mochi 2048's sound effects as WAV files in assets/sfx/.

Uses only Python's standard library (math, random, struct, wave), so it runs anywhere:
    python3 tools/make_sfx.py

Every sound is built from scratch: soft marimba-like partials, a squishy "bloop",
a tiny noise transient for the pop, and a small Schroeder reverb so it sits in a room.
Merge notes climb a major-pentatonic scale, so bigger merges sound brighter and every
combination of notes stays consonant.
"""
import math
import os
import random
import struct
import wave

SR = 32000
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'sfx')
random.seed(7)


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12.0)


def silence(dur):
    return [0.0] * int(dur * SR)


def mix(dst, src, at=0.0, gain=1.0):
    o = int(at * SR)
    need = o + len(src)
    if need > len(dst):
        dst.extend([0.0] * (need - len(dst)))
    for i, v in enumerate(src):
        dst[o + i] += v * gain
    return dst


def attack(t, a=0.0015):
    return 1.0 - math.exp(-t / a)


def partials(freq, dur, parts, a=0.0015):
    """Additive tone: parts = [(ratio, amp, decay_seconds), ...]."""
    out = []
    for i in range(int(dur * SR)):
        t = i / SR
        v = 0.0
        for r, amp, tau in parts:
            f = freq * r
            if f < SR * 0.45:
                v += amp * math.exp(-t / tau) * math.sin(2 * math.pi * f * t)
        out.append(v * attack(t, a))
    return out


def sweep(f0, f1, dur, glide, tau, wave_shape='sine'):
    """A tone whose pitch glides exponentially from f0 to f1."""
    out, ph = [], 0.0
    for i in range(int(dur * SR)):
        t = i / SR
        f = f1 + (f0 - f1) * math.exp(-t / glide)
        ph += 2 * math.pi * f / SR
        s = math.sin(ph) if wave_shape == 'sine' else (2 / math.pi) * math.asin(math.sin(ph))
        out.append(s * math.exp(-t / tau) * attack(t, 0.001))
    return out


def noise_burst(dur, tau, cutoff):
    out, y = [], 0.0
    k = 1 - math.exp(-2 * math.pi * cutoff / SR)
    for i in range(int(dur * SR)):
        t = i / SR
        y += k * ((random.random() * 2 - 1) - y)
        out.append(y * math.exp(-t / tau))
    return out


def reverb(x, wet=0.2, tail=0.6):
    """Small Schroeder reverb: 4 damped combs into 2 allpasses."""
    x = x + [0.0] * int(tail * SR)
    combs = [(0.0297, 0.80), (0.0371, 0.78), (0.0411, 0.76), (0.0437, 0.74)]
    acc = [0.0] * len(x)
    for d, g in combs:
        n = int(d * SR)
        buf = [0.0] * n
        lp = 0.0
        idx = 0
        for i, v in enumerate(x):
            out = buf[idx]
            lp = out * 0.7 + lp * 0.3
            buf[idx] = v + lp * g
            idx = (idx + 1) % n
            acc[i] += out
    for d, g in [(0.005, 0.7), (0.0017, 0.7)]:
        n = int(d * SR)
        buf = [0.0] * n
        idx = 0
        y = []
        for v in acc:
            b = buf[idx]
            o = -g * v + b
            buf[idx] = v + g * o
            idx = (idx + 1) % n
            y.append(o)
        acc = y
    return [dry + wet * 0.25 * w for dry, w in zip(x, acc)]


def fade_tail(x, ms=40):
    n = int(ms / 1000 * SR)
    for i in range(min(n, len(x))):
        x[len(x) - 1 - i] *= i / n
    return x


def normalize(x, peak=0.8):
    m = max(1e-9, max(abs(v) for v in x))
    return [v * peak / m for v in x]


def write(name, x, peak=0.8):
    x = fade_tail(normalize(x, peak))
    path = os.path.join(OUT, name)
    with wave.open(path, 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(b''.join(struct.pack('<h', int(max(-1, min(1, v)) * 32767)) for v in x))
    print('wrote', name, f'{os.path.getsize(path) // 1024} KB')


MARIMBA = [(1.0, 1.0, 0.42), (3.99, 0.30, 0.10), (10.6, 0.07, 0.035)]


def merge_sound(k):
    """k = log2 of the merged value (1 → made a 2, 11 → made 2048)."""
    scale = [67, 69, 72, 74, 76, 79, 81, 84, 86, 88, 91, 93, 96]
    f = mtof(scale[min(k - 1, len(scale) - 1)])
    out = silence(0.9)
    mix(out, sweep(f * 0.55, f, 0.18, 0.025, 0.06), 0, 0.55)           # squishy bloop
    mix(out, partials(f, 0.9, MARIMBA), 0.012, 0.9)                     # the note
    mix(out, noise_burst(0.02, 0.004, 3200), 0, 0.22)                   # pop transient
    if k >= 5:                                                         # bigger merges get a sparkle
        mix(out, partials(f * 2, 0.8, [(1, 0.5, 0.30), (1.5, 0.3, 0.22)], 0.004), 0.05, 0.22)
    if k >= 8:                                                         # and a soft low thump
        mix(out, sweep(150, 70, 0.3, 0.05, 0.09), 0, 0.5)
        mix(out, partials(f * 1.5, 0.9, [(1, 0.6, 0.5)], 0.01), 0.1, 0.16)
    return reverb(out, wet=0.22 + min(k, 11) * 0.015, tail=0.5)


def main():
    os.makedirs(OUT, exist_ok=True)
    for k in range(1, 14):
        write(f'merge-{k:02d}.wav', merge_sound(k))

    drop = silence(0.25)
    mix(drop, sweep(980, 520, 0.22, 0.03, 0.05), 0, 0.6)
    mix(drop, sweep(300, 240, 0.2, 0.03, 0.04, 'tri'), 0, 0.25)
    write('drop.wav', reverb(drop, 0.12, 0.25), 0.6)

    land = silence(0.25)
    mix(land, sweep(160, 62, 0.25, 0.04, 0.07), 0, 0.8)
    mix(land, noise_burst(0.05, 0.015, 500), 0, 0.3)
    write('land.wav', land, 0.7)

    combo = silence(0.6)
    mix(combo, partials(mtof(91), 0.6, [(1, 1, 0.22), (2.0, 0.25, 0.08)], 0.002), 0, 0.6)
    mix(combo, partials(mtof(98), 0.6, [(1, 1, 0.18)], 0.002), 0.06, 0.4)
    write('combo.wav', reverb(combo, 0.3, 0.4), 0.6)

    over = silence(2.0)
    for i, m in enumerate([76, 72, 69, 64]):
        mix(over, partials(mtof(m), 1.4, MARIMBA), i * 0.24, 0.8 - i * 0.1)
    mix(over, partials(mtof(45), 1.6, [(1, 1, 0.8), (2, 0.3, 0.5)], 0.05), 0.72, 0.35)
    write('gameover.wav', reverb(over, 0.35, 0.8), 0.7)

    best = silence(1.6)
    for i, m in enumerate([72, 76, 79, 84, 88]):
        mix(best, partials(mtof(m), 1.0, [(1, 1, 0.45), (2.0, 0.2, 0.2), (3.0, 0.08, 0.1)], 0.002), i * 0.085, 0.6)
    mix(best, partials(mtof(96), 1.2, [(1, 1, 0.6)], 0.01), 0.45, 0.25)
    write('newbest.wav', reverb(best, 0.35, 0.8), 0.7)

    click = silence(0.06)
    mix(click, partials(1800, 0.06, [(1, 1, 0.006)], 0.0005), 0, 0.6)
    mix(click, noise_burst(0.02, 0.003, 6000), 0, 0.3)
    write('click.wav', click, 0.5)

    start = silence(0.6)
    mix(start, sweep(330, 660, 0.4, 0.12, 0.2), 0, 0.4)
    mix(start, partials(mtof(84), 0.5, [(1, 1, 0.25)], 0.003), 0.12, 0.35)
    write('start.wav', reverb(start, 0.25, 0.4), 0.6)


if __name__ == '__main__':
    main()
