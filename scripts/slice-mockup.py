# Slices mockup-1.jpg into separate panel + phone PNGs by detecting the
# white gaps between the fanned elements. Outputs to public/images/panels/
# plus a debug overlay so the boxes can be eyeballed.
import os
import numpy as np
from PIL import Image, ImageDraw

SRC = "public/images/mockup-1.jpg"
OUT = "public/images/panels"
os.makedirs(OUT, exist_ok=True)

img = Image.open(SRC).convert("RGB")
W, H = img.size
arr = np.asarray(img).astype(np.int16)

# "content" = not near-white: either dark or saturated.
r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
brightness = (r + g + b) / 3.0
maxc = np.maximum(np.maximum(r, g), b)
minc = np.minimum(np.minimum(r, g), b)
sat = maxc - minc
content = ((255 - brightness) > 14) | (sat > 18)

# Column projection -> find vertical bands separated by white gutters.
col = content.sum(axis=0).astype(float)
col_thresh = max(col.max() * 0.04, 3)
active = col > col_thresh

# group consecutive active columns into bands, bridging tiny gaps
bands = []
i = 0
N = len(active)
GAP = 18  # allow small white gaps inside a panel
while i < N:
    if active[i]:
        j = i
        last = i
        while j < N:
            if active[j]:
                last = j
                j += 1
            elif j - last <= GAP:
                j += 1
            else:
                break
        if last - i > 30:  # ignore slivers
            bands.append((i, last))
        i = j
    else:
        i += 1

# For each column band, find vertical extent via row projection.
boxes = []
for (x0, x1) in bands:
    sub = content[:, x0:x1 + 1]
    row = sub.sum(axis=1).astype(float)
    rthr = max(row.max() * 0.04, 2)
    ys = np.where(row > rthr)[0]
    if len(ys) == 0:
        continue
    y0, y1 = int(ys.min()), int(ys.max())
    boxes.append([int(x0), y0, int(x1), y1])

# Sort left->right and label. The widest/tallest near center is the phone.
boxes.sort(key=lambda bx: bx[0])
print("W,H", W, H)
print("num bands:", len(boxes))
for k, bx in enumerate(boxes):
    print(k, "box(x0,y0,x1,y1)=", bx, "w=", bx[2]-bx[0], "h=", bx[3]-bx[1])

# Save crops with a few px of padding.
PAD = 6
for k, (x0, y0, x1, y1) in enumerate(boxes):
    cx0 = max(0, x0 - PAD); cy0 = max(0, y0 - PAD)
    cx1 = min(W, x1 + PAD); cy1 = min(H, y1 + PAD)
    crop = img.crop((cx0, cy0, cx1, cy1))
    crop.save(os.path.join(OUT, f"part-{k}.png"))

# Debug overlay
dbg = img.copy()
d = ImageDraw.Draw(dbg)
for k, (x0, y0, x1, y1) in enumerate(boxes):
    d.rectangle([x0, y0, x1, y1], outline=(255, 0, 128), width=4)
    d.text((x0 + 4, y0 + 4), str(k), fill=(255, 0, 128))
dbg.save(os.path.join(OUT, "_debug.png"))
print("wrote", len(boxes), "crops + _debug.png")
