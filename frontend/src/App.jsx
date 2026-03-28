import { useState } from 'react'

function App() {
  // 初期値を空の配列[]から、空のオブジェクト{}に変更
  const [colors, setColors] = useState({})
  const [imagePreview, setImagePreview] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleImageUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    setImagePreview(URL.createObjectURL(file))
    setIsLoading(true)
    setColors({}) // 読み込み開始時にリセット

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('http://localhost:8000/extract-colors', {
        method: 'POST',
        body: formData,
      })
      const data = await response.json()
      setColors(data.colors) // カテゴライズされたデータを受け取る
    } catch (error) {
      console.error('エラーが発生しました:', error)
      alert('色抽出に失敗しました。')
    } finally {
      setIsLoading(false)
    }
  }

  // カテゴリーの表示順を定義（これ以外の系統も後ろに追加されます）
  const categoryOrder = [
    "赤系統", "オレンジ・茶系統", "黄系統", "緑系統", 
    "水色系統", "青系統", "紫・ピンク系統", "無彩色（グレー・黒・白）", "その他"
  ]

  // 受け取ったデータを指定した順序で並び替える処理
  const sortedCategories = Object.keys(colors).sort((a, b) => {
    const indexA = categoryOrder.indexOf(a)
    const indexB = categoryOrder.indexOf(b)
    return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB)
  })

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto', color: '#333' }}>
      <h1>🎨 Palette Harmony Analyzer</h1>
      <p>イラストをアップロードして、色系統別に整理されたパレットを作成します。</p>
      
      <input type="file" accept="image/*" onChange={handleImageUpload} style={{ 
        marginBottom: '1rem', padding: '10px', border: '1px solid #ddd',
        borderRadius: '4px', backgroundColor: '#f9f9f9'
      }} />
      
      {imagePreview && (
        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <img src={imagePreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
        </div>
      )}

      {isLoading && (
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <div className="spinner" style={{
            border: '8px solid #f3f3f3', borderTop: '8px solid #3498db',
            borderRadius: '50%', width: '50px', height: '50px',
            animation: 'spin 1s linear infinite', margin: '0 auto'
          }}></div>
          <p style={{ marginTop: '10px', color: '#555' }}>色相を分析・分類中...</p>
        </div>
      )}

      {/* colorsオブジェクトにデータが入っている場合のみ表示 */}
      {!isLoading && Object.keys(colors).length > 0 && (
        <div style={{ marginTop: '2rem', border: '1px solid #ddd', borderRadius: '8px', padding: '1.5rem', backgroundColor: '#fff' }}>
          <h3 style={{ marginTop: 0, marginBottom: '1.5rem', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
            色系統別のパレット分析
          </h3>
          
          {/* カテゴリーごとにループして表示 */}
          {sortedCategories.map((category) => (
            <div key={category} style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '15px', color: '#444' }}>
                {category} <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#888' }}>({colors[category].length}色)</span>
              </h4>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {colors[category].map((color, index) => (
                  <div key={index} style={{ textAlign: 'center', flex: '0 0 auto' }}>
                    <div style={{ 
                      width: '45px', height: '45px', backgroundColor: color, 
                      borderRadius: '6px', border: '1px solid #ddd',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}></div>
                    <p style={{ fontSize: '10px', marginTop: '4px', fontFamily: 'monospace', color: '#666' }}>{color}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default App