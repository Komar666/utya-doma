# Готовит Утей-менеджеров для блока «Как мы работаем»:
# выравнивает по глазам на общем холсте, чистит края от отсвета старого фона, сохраняет WebP.
# Запуск (из папки hero): python tools/export_ducks.py
import os
import sys
import cv2
import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from add_blush import find_eyes

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = {1: '1.png', 2: '2-румянец.png', 3: '3.png', 4: '4-румянец.png', 5: '5.png'}   # в «исходники/»
W = H = 520
EYE_MID = (0.5 * W, 0.40 * H)      # куда встаёт середина между глазами
EYE_D = 0.22 * W                   # расстояние между глазами на холсте


def decontaminate(a):
    """Полупрозрачным пикселям края даём цвет соседнего «сплошного» меха — убирает отсвет старого фона."""
    rgb, al = a[..., :3], a[..., 3]
    solid = cv2.erode((al >= 250).astype(np.uint8), np.ones((3, 3), np.uint8)).astype(np.float32)
    num = cv2.GaussianBlur(rgb * solid[..., None], (0, 0), 3)
    den = cv2.GaussianBlur(solid, (0, 0), 3)[..., None]
    near = num / np.maximum(den, 1e-4)
    edge = ((al < 250) & (den[..., 0] > 1e-3))[..., None]
    a[..., :3] = np.where(edge, near, rgb)
    return a


for i, name in SRC.items():
    a = np.asarray(Image.open(os.path.join(HERE, 'исходники', name)).convert('RGBA')).astype(np.float32)
    left, right = find_eyes(a)
    a = decontaminate(a)
    im = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), 'RGBA')
    s = EYE_D / (right[0] - left[0])
    mid = ((left[0] + right[0]) / 2, (left[1] + right[1]) / 2)
    im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    canvas = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    # alpha_composite, а не paste с маской: paste смешивает края с чёрным цветом пустого холста
    canvas.alpha_composite(im, (round(EYE_MID[0] - mid[0] * s), round(EYE_MID[1] - mid[1] * s)))
    out = os.path.join(HERE, 'assets', f'proc-{i}.webp')
    canvas.save(out, quality=88, method=6, exact=True)
    print(f'proc-{i}.webp  {os.path.getsize(out) // 1024} КБ')
