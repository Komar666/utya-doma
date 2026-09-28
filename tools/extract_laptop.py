# Кадры для IT-блока: видео закрытия ноутбука → открытие (задом наперёд),
# фон «замораживается» (из видео берётся только область, где двигается крышка),
# находятся 4 угла экрана на открытом кадре — на них потом натягивается живой HTML.
# Запуск (из папки hero): python tools/extract_laptop.py
import json
import os
import cv2
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(HERE, "исходники", "lap-vid.mp4")
OUT = os.path.join(HERE, "frames")
WIDE = ("lap-wide", 1920, 72)                  # десктоп: весь кадр
MOBILE = ("lap-sm", 760, 72, (0.45, 1.0))      # телефон: правая часть кадра с ноутбуком (доли ширины)

cap = cv2.VideoCapture(SRC)
frames = []
while True:
    ok, f = cap.read()
    if not ok:
        break
    frames.append(f)
f0 = frames[0].astype(np.float32)            # открытый ноутбук — первый кадр исходного видео
h, w = f0.shape[:2]

# где что-то двигается хоть в одном кадре — там берём видео, остальное — неподвижный фон из f0
moving = np.zeros((h, w), np.uint8)
for f in frames:
    moving |= (np.abs(f.astype(np.float32) - f0).sum(-1) > 24).astype(np.uint8)
moving = cv2.morphologyEx(moving, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
n, lab, st, _ = cv2.connectedComponentsWithStats(moving, 8)
big = np.argmax(st[1:, cv2.CC_STAT_AREA]) + 1                  # главная область — ноутбук
moving = (lab == big).astype(np.uint8)
moving = cv2.dilate(moving, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (61, 61)))
M = cv2.GaussianBlur(moving.astype(np.float32), (0, 0), 18)[..., None]

out = [np.clip(M * f.astype(np.float32) + (1 - M) * f0, 0, 255).astype(np.uint8) for f in frames]
out.reverse()                                                   # закрытие → открытие

# экран на открытом кадре: однотонная синяя область (цвет берём в его центре), отделённая рамкой
seed = (int(w * .75), int(h * .33))
ref = frames[0][seed[1], seed[0]].astype(np.float32)
scr = (np.abs(frames[0].astype(np.float32) - ref).max(-1) < 9).astype(np.uint8)
scr = cv2.morphologyEx(scr, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
n, lab, _, _ = cv2.connectedComponentsWithStats(scr, 8)
scr = (lab == lab[seed[1], seed[0]]).astype(np.uint8)
scr = cv2.morphologyEx(scr, cv2.MORPH_CLOSE, np.ones((25, 25), np.uint8))
cnts, _ = cv2.findContours(scr, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
cnt = max(cnts, key=cv2.contourArea)
hull = cv2.convexHull(cnt)
quad = None
for eps in np.linspace(.005, .05, 40):
    approx = cv2.approxPolyDP(hull, eps * cv2.arcLength(hull, True), True)
    if len(approx) == 4:
        quad = approx.reshape(4, 2).astype(float)
        break
# порядок: левый-верх, правый-верх, правый-низ, левый-низ
s, d = quad.sum(1), np.diff(quad, axis=1).ravel()
quad = [quad[np.argmin(s)], quad[np.argmin(d)], quad[np.argmax(s)], quad[np.argmax(d)]]
screen = [[round(x / w, 5), round(y / h, 5)] for x, y in quad]
print("экран (доли кадра):", screen)
json.dump({"frames": len(out), "aspect": [w, h], "screen": screen, "mobileCrop": MOBILE[3]},
          open(os.path.join(HERE, "assets", "laptop.json"), "w"), indent=1)

dbg = frames[0].copy()
cv2.polylines(dbg, [np.array(quad, np.int32)], True, (0, 255, 255), 2)
# через PIL: cv2.imwrite не умеет пути с кириллицей
Image.fromarray(cv2.cvtColor(dbg, cv2.COLOR_BGR2RGB)).crop((int(w * .6), int(h * .2), w, int(h * .8))).save(os.path.join(HERE, "tools", "_screen_check.jpg"))


def export(name, width, q, crop=None):
    d = os.path.join(OUT, name)
    os.makedirs(d, exist_ok=True)
    total = 0
    for i, f in enumerate(out):
        if crop:
            f = f[:, int(w * crop[0]):int(w * crop[1])]
        im = Image.fromarray(cv2.cvtColor(f, cv2.COLOR_BGR2RGB))
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
        p = os.path.join(d, f"{i:03d}.webp")
        im.save(p, quality=q, method=6)
        total += os.path.getsize(p)
    print(f"{name}: {len(out)} кадров, {im.width}x{im.height}, {total / 1024 / 1024:.1f} МБ")


export(*WIDE)
export(MOBILE[0], MOBILE[1], MOBILE[2], MOBILE[3])
