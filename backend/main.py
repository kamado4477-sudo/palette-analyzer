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

    # OpenCVのBGRをRGBに変換し、AIが処理しやすい形に変形
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    pixels = img.reshape(-1, 3)

    # k-means法で5色を抽出
    kmeans = KMeans(n_clusters=5, random_state=42)
    kmeans.fit(pixels)
    colors = kmeans.cluster_centers_

    # 抽出した色をカラーコード（HEX）に変換して返す
    hex_colors = [rgb_to_hex(color) for color in colors]
    return {"colors": hex_colors}