# Дорисовывает Уте розовый румянец, как на остальных картинках серии.
# Место и размер берутся относительно глаз (замерено по Уте с конвертом и с телефоном),
# цвет накладывается «умножением» — фактура меха сохраняется.
# Запуск: python tools/add_blush.py исходники/2.png исходники/2-румянец.png
import sys
import cv2
import numpy as np
from PIL import Image

BLUSH_RGB = np.array([240, 158, 142], np.float32)   # цвет в центре румянца (чуть насыщеннее среднего по пятну)
OFFSET = (0.31, 0.25)       # от центра глаза: наружу и вниз, в долях расстояния между глазами
SIGMA = (0.15, 0.085)       # размер пятна (гауссиана), в тех же долях
STRENGTH = 1.0


def find_eyes(a):
    r, g, b, al = (a[..., k] for k in range(4))
    L = (r + g + b) / 3
    h = al.shape[0]
    ys, xs = np.nonzero(al > 200)
    head_cx = (xs.min() + xs.max()) / 2
    # глаза тёмно-коричневые: тёмные и заметно «тёплые» (не серый пластик, не синий галстук)
    m = ((L < 80) & (r > g * 1.3) & (r >= b) & (al > 200)).astype(np.uint8)
    m[int(h * .62):] = 0
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    n, _, st, cen = cv2.connectedComponentsWithStats(m, 8)
    blobs = [(st[k, 4], cen[k]) for k in range(1, n)
             if st[k, 4] > 1500 and min(st[k, 2], st[k, 3]) / max(st[k, 2], st[k, 3]) > .55]
    best, score = None, 1e9
    for i in range(len(blobs)):
        for j in range(i + 1, len(blobs)):
            (a1, c1), (a2, c2) = blobs[i], blobs[j]
            d = abs(c1[0] - c2[0])
            if 250 < d < 700 and abs(c1[1] - c2[1]) < 90 and .35 < a1 / a2 < 2.8:
                sc = abs((c1[0] + c2[0]) / 2 - head_cx)
                if sc < score:
                    score, best = sc, sorted([c1, c2], key=lambda c: c[0])
    if best is None:
        raise SystemExit('глаза не найдены')
    return best


def add_blush(src, dst):
    a = np.asarray(Image.open(src).convert('RGBA')).astype(np.float32)
    left, right = find_eyes(a)
    d = right[0] - left[0]
    h, w = a.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    mask = np.zeros((h, w), np.float32)
    for eye, sign in ((left, -1), (right, 1)):
        cx, cy = eye[0] + sign * OFFSET[0] * d, eye[1] + OFFSET[1] * d
        mask = np.maximum(mask, np.exp(-(((xx - cx) / (SIGMA[0] * d)) ** 2 + ((yy - cy) / (SIGMA[1] * d)) ** 2) / 2))
    # средний цвет меха в зоне щёк — от него считаем, во сколько раз «подкрасить» каждый канал
    zone = (mask > .3) & (a[..., 3] > 200)
    fur = a[zone][:, :3].mean(0)
    ratio = np.clip(BLUSH_RGB / fur, 0, 1.15)
    k = (mask * STRENGTH * (a[..., 3] / 255))[..., None]
    a[..., :3] = a[..., :3] * (1 + k * (ratio - 1))
    Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), 'RGBA').save(dst)
    print(f'{src}: глаза {np.round(left).astype(int).tolist()} {np.round(right).astype(int).tolist()} → {dst}')


if __name__ == '__main__':
    add_blush(sys.argv[1], sys.argv[2])
