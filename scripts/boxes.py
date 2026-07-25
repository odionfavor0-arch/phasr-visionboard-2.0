import sys, json
from PIL import Image, ImageDraw

# Candidate panel boxes in mockup-1 (1080x864) coords: x0,y0,x1,y1
BOXES = {
    "vision":   [52, 188, 232, 668],
    "journal":  [232, 222, 400, 668],
    "phone":    [360, 36, 702, 804],
    "streak":   [684, 200, 814, 545],
    "showroom": [812, 182, 1032, 692],
}

img = Image.open("public/images/mockup-1.jpg").convert("RGB")
d = ImageDraw.Draw(img)
colors = [(255,0,128),(0,140,255),(20,180,90),(255,140,0),(150,0,200)]
for i,(k,(x0,y0,x1,y1)) in enumerate(BOXES.items()):
    d.rectangle([x0,y0,x1,y1], outline=colors[i%len(colors)], width=5)
    d.text((x0+5,y0+5), k, fill=colors[i%len(colors)])
img.save("public/images/panels/_boxes.png")
print(json.dumps(BOXES))
