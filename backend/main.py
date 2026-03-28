from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
import collections

app = FastAPI()

# Reactからの通信を許可する設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

def rgb_to_hex(rgb):
    return '#%02x%02x%02x' % (int(rgb[0]), int(rgb[1]), int(rgb[2]))

@app.post("/extract-colors")
async def extract_colors(file: UploadFile = File(...)):
    # 画像を読み込む
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    # OpenCVのBGRをRGBに変換
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    # ========================================================
    # 【パフォーマンス向上】画像を大幅にリサイズして、ピクセル数を減らす（維持）
    # ========================================================
    MAX_SIZE = 500  # 最大幅、または高さを500pxにする
    h, w = img.shape[:2]
    if h > w:
        new_h, new_w = MAX_SIZE, int(w * MAX_SIZE / h)
    else:
        new_h, new_w = int(h * MAX_SIZE / w), MAX_SIZE
    resized_img = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_AREA)
    # ========================================================

    # ========================================================
    # 【アルゴリズム刷新】ヒストグラム（頻度分析）＋量子化による色抽出
    # ========================================================
    
    # 1. 近似色を統合（量子化）
    # 各チャンネル（R, G, B）の8bit(0-255)を4bit(0-15)に落とす（2^4 = 16段階）
    # これにより、微妙な違いの色が統合される
    quantized_img = resized_img // 16 * 16 + 8 # 8を足すことで中央値にする

    # 2. 量子化した画像からヒストグラム（頻度）を作成
    # 画像をピクセルの配列（N, 3）に変形
    pixels = quantized_img.reshape(-1, 3)
    # ピクセルをタプルのリストに変換（Counterでカウントできるようにするため）
    pixel_tuples = [tuple(pixel) for pixel in pixels]
    # 出現回数をカウント
    color_counts = collections.Counter(pixel_tuples)

    # 3. 頻度順にソートし、ノイズを弾き、上位N色を抽出
    # 頻度順にソート
    sorted_colors = sorted(color_counts.items(), key=lambda x: x[1], reverse=True)

    # ノイズ除去：出現頻度が全体の0.1%未満の色を弾く
    threshold = int(len(pixels) * 0.001)
    filtered_colors = [color for color, count in sorted_colors if count > threshold]

    # 上位100色（または抽出できた全色）を取得
    MAX_PALETTE_SIZE = 100
    top_colors = filtered_colors[:MAX_PALETTE_SIZE]

    # ========================================================

    # 抽出した色をカラーコード（HEX）に変換して返す
    hex_colors = [rgb_to_hex(color) for color in top_colors]
    return {"colors": hex_colors}