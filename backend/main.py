from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
from sklearn.cluster import KMeans

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
    # 【パフォーマンス向上】画像を大幅にリサイズして、ピクセル数を減らす
    # ========================================================
    # AI処理用の最大サイズを設定（これより大きい画像は縮小する）
    MAX_SIZE = 500  # 最大幅、または高さを500pxにする

    # 元の画像のサイズを取得
    h, w = img.shape[:2]

    # アスペクト比を保ちつつ、MAX_SIZEに収まるように新しいサイズを計算
    if h > w:
        new_h, new_w = MAX_SIZE, int(w * MAX_SIZE / h)
    else:
        new_h, new_w = int(h * MAX_SIZE / w), MAX_SIZE

    # 画像をリサイズ
    resized_img = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_AREA)
    # ========================================================

    # リサイズした画像からAIが処理しやすい形に変形
    pixels = resized_img.reshape(-1, 3)

    # k-means法で5色を抽出（計算設定も少し早くする）
    # n_init=1 にすることで、計算のやり直し回数を減らして高速化
    kmeans = KMeans(n_clusters=5, n_init=1, random_state=42)
    kmeans.fit(pixels)
    colors = kmeans.cluster_centers_

    # 抽出した色をカラーコード（HEX）に変換して返す
    hex_colors = [rgb_to_hex(color) for color in colors]
    return {"colors": hex_colors}