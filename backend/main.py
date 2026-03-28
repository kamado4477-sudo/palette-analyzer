from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
import collections
import colorsys # HSV変換のために追加

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

def rgb_to_hex(rgb):
    return '#%02x%02x%02x' % (int(rgb[0]), int(rgb[1]), int(rgb[2]))

# 【新規追加】RGBからHSVに変換し、どの色系統かを判定する関数
def get_color_category(r, g, b):
    # RGBの値を0.0〜1.0に変換してHSVを取得
    h, s, v = colorsys.rgb_to_hsv(r/255.0, g/255.0, b/255.0)
    h_deg = h * 360 # 色相を0〜360度の角度に変換

    # 彩度(s)や明度(v)が極端に低い場合は無彩色（グレー等）に分類
    if s < 0.15 or v < 0.15:
        return "無彩色（グレー・黒・白）"

    # 色相(h_deg)の角度によって系統を分類
    if h_deg < 15 or h_deg >= 330:
        return "赤系統"
    elif h_deg < 45:
        return "オレンジ・茶系統"
    elif h_deg < 75:
        return "黄系統"
    elif h_deg < 150:
        return "緑系統"
    elif h_deg < 210:
        return "水色系統"
    elif h_deg < 270:
        return "青系統"
    elif h_deg < 330:
        return "紫・ピンク系統"
    
    return "その他"

@app.post("/extract-colors")
async def extract_colors(file: UploadFile = File(...)):
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    MAX_SIZE = 500
    h, w = img.shape[:2]
    if h > w:
        new_h, new_w = MAX_SIZE, int(w * MAX_SIZE / h)
    else:
        new_h, new_w = int(h * MAX_SIZE / w), MAX_SIZE
    resized_img = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_AREA)

    quantized_img = resized_img // 16 * 16 + 8
    pixels = quantized_img.reshape(-1, 3)
    pixel_tuples = [tuple(pixel) for pixel in pixels]
    color_counts = collections.Counter(pixel_tuples)

    sorted_colors = sorted(color_counts.items(), key=lambda x: x[1], reverse=True)
    threshold = int(len(pixels) * 0.001)
    filtered_colors = [color for color, count in sorted_colors if count > threshold]
    
    MAX_PALETTE_SIZE = 100
    top_colors = filtered_colors[:MAX_PALETTE_SIZE]

    # ========================================================
    # 【変更】色を系統ごとにグループ分けして辞書（Dict）にまとめる
    # ========================================================
    categorized_colors = collections.defaultdict(list)
    
    # 抽出した色を一つずつ判定して仕分ける
    for color in top_colors:
        category = get_color_category(*color) # *colorで (R, G, B) を展開して渡す
        hex_color = rgb_to_hex(color)
        categorized_colors[category].append(hex_color)

    # {"赤系統": ["#ff0000", ...], "青系統": ["#0000ff", ...]} の形で返す
    return {"colors": categorized_colors}