# Режет видео (разворот кресла + помахивание лапкой) на кадры WebP для скролл-анимации.
# Фон каждого кадра чистится до ровного цвета (см. clean_bg.py) — у кадров нет краёв и полос.
# Запуск (из папки hero):  python tools/extract_frames.py
import os
import sys
import cv2
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import clean_bg

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(HERE, "исходники")
OUT = os.path.join(HERE, "frames")

# (файл, с какого кадра брать): у разворота первые кадры с дрожанием крестовины,
# первый кадр помахивания совпадает с последним кадром разворота
CLIPS = [("duck.mp4", 6), ("duck-2.mp4", 1)]

CROP_CX = 1000       # центр квадрата для телефонов по X
PAD = 0.12           # поле вокруг квадрата (доля стороны)
SQUARE = {"sm": (760, 70)}      # телефоны: квадрат с полями — папка: (размер, качество WebP)
WIDE = {"wide": (1920, 74)}     # десктоп: целый кадр 16:9 — папка: (ширина, качество WebP)


def read(name, first):
    cap = cv2.VideoCapture(os.path.join(SRC, name))
    frames = []
    while True:
        ok, f = cap.read()
        if not ok:
            break
        frames.append(f)
    return frames[first:]


clips = [read(n, first) for n, first in CLIPS]
F = clean_bg.bg_color([f for c in clips for f in c])
G = clean_bg.shadow_field(clips[0][0].shape)
frames = [clean_bg.clean(f, F, G) for c in clips for f in c]
print(f"кадров: {' + '.join(str(len(c)) for c in clips)} = {len(frames)}; "
      f"цвет фона: #{int(F[2]):02x}{int(F[1]):02x}{int(F[0]):02x}")

h, w = frames[0].shape[:2]
side = min(h, w)
x0 = max(0, min(w - side, CROP_CX - side // 2))
pad = round(side * PAD)


def export(name, size, q, make):
    d = os.path.join(OUT, name)
    os.makedirs(d, exist_ok=True)
    total = 0
    for i, f in enumerate(frames):
        im = Image.fromarray(cv2.cvtColor(make(f), cv2.COLOR_BGR2RGB))
        if size != im.width:
            im = im.resize((size, round(im.height * size / im.width)), Image.LANCZOS)
        p = os.path.join(d, f"{i:03d}.webp")
        im.save(p, quality=q, method=6)
        total += os.path.getsize(p)
    print(f"{name}: {len(frames)} кадров, {im.width}x{im.height}, всего {total / 1024 / 1024:.1f} МБ")


for name, (size, q) in SQUARE.items():
    # фон уже ровный — поля просто продолжают его
    export(name, size, q, lambda f: cv2.copyMakeBorder(f[:side, x0:x0 + side], pad, pad, pad, pad, cv2.BORDER_REPLICATE))
for name, (size, q) in WIDE.items():
    export(name, size, q, lambda f: f)
