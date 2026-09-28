# Чистка фона кадров: всё, кроме Ути, кресла и мягкой тени под основанием, заменяется ровным цветом.
# Видеомодель склеила кадр из вертикальных полос, пол и тень есть только в центральной —
# на её границе тень обрывается резким краем. После чистки у кадра нет ни полос, ни краёв.
import cv2
import numpy as np

# Эллипс, в котором сохраняется настоящая тень на полу (доли ширины/высоты кадра)
SHADOW = dict(cx=0.52, cy=0.93, sx=0.13, sy=0.07)
# Уровень пола (доли высоты): ниже — только крестовина и колёса, которые не двигаются
FLOOR = (0.76, 0.82)
# Колонка, за пределы которой Утя с креслом не выходят ни в одном кадре (доли ширины)
COLUMN = (0.29, 0.72)


def bg_color(frames):
    """Цвет фона — медиана боковых полос кадра (там только стена)."""
    px = np.concatenate([np.concatenate([f[:, :int(f.shape[1] * .15)], f[:, -int(f.shape[1] * .15):]], 1).reshape(-1, 3)
                         for f in frames[::10]])
    return np.median(px, 0).astype(np.float32)


def subject_mask(f, F):
    """Маска Ути и кресла: пиксели не того цвета, что фон (с учётом затенения), или с резкой фактурой."""
    x = f.astype(np.float32)
    # фон в тени = F * k — ищем расстояние пикселя до этой «линии» цветов
    k = (x @ F) / (F @ F)
    d_perp = np.linalg.norm(x - k[..., None] * F, axis=-1)
    a_color = np.clip((d_perp - 6) / 14, 0, 1)
    # фактура: хром, колёса, края — сильный локальный разброс яркости; пол и тень гладкие
    g = cv2.cvtColor(f, cv2.COLOR_BGR2GRAY).astype(np.float32)
    mu = cv2.blur(g, (5, 5)); std = np.sqrt(np.maximum(cv2.blur(g * g, (5, 5)) - mu * mu, 0))
    a_tex = np.clip((std - 5) / 8, 0, 1)
    a_dark = np.clip((90 - g) / 30, 0, 1)                       # колёса, газлифт, низ сиденья
    # на уровне пола тень по цвету теплее фона и «похожа» на объект — там доверяем только фактуре и темноте
    h = f.shape[0]
    floor = np.clip((np.arange(h, dtype=np.float32) / h - FLOOR[0]) / (FLOOR[1] - FLOOR[0]), 0, 1)[:, None]
    a = np.maximum.reduce([a_color * (1 - floor), a_tex, a_dark])
    # Утя с креслом всегда в центральной колонке кадра — снаружи только фон (и артефакты сжатия на швах полос)
    w = f.shape[1]
    xs = np.arange(w, dtype=np.float32) / w
    col = np.clip(np.minimum((xs - COLUMN[0]) / 0.02, (COLUMN[1] - xs) / 0.02), 0, 1)[None, :]
    a = a * col

    m = (a > 0.35).astype(np.uint8)
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9)))
    # заливаем «дыры» внутри силуэта (гладкие участки хрома, обивки)
    h, w = m.shape
    flood = m.copy(); cv2.floodFill(flood, np.zeros((h + 2, w + 2), np.uint8), (0, 0), 1)
    m = m | (1 - flood)
    # убираем мелкий мусор
    n, lab, st, _ = cv2.connectedComponentsWithStats(m, 8)
    keep = np.zeros(n, np.uint8); keep[1:] = st[1:, cv2.CC_STAT_AREA] > 400
    m = keep[lab]
    m = cv2.dilate(m, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))
    return cv2.GaussianBlur(m.astype(np.float32), (0, 0), 1.6)


def shadow_field(shape):
    h, w = shape[:2]
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    return np.exp(-((xx / w - SHADOW['cx']) / SHADOW['sx']) ** 2 - ((yy / h - SHADOW['cy']) / SHADOW['sy']) ** 2)


def clean(f, F, G):
    """f — кадр BGR uint8, F — цвет фона (BGR), G — поле сохранения тени."""
    x = f.astype(np.float32)
    a = subject_mask(f, F)[..., None]
    # затенение фона: k < 1 — тень, k > 1 — светлый пол (убираем)
    k = np.clip((x @ F) / (F @ F), 0, 1)
    s = 1 - G * (1 - k)
    bg = F[None, None, :] * s[..., None]
    return np.clip(a * x + (1 - a) * bg, 0, 255).astype(np.uint8)
