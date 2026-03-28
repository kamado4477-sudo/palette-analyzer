import { useState } from 'react'

function App() {
  const [colors, setColors] = useState([])
  const [imagePreview, setImagePreview] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleImageUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    setImagePreview(URL.createObjectURL(file))
    setIsLoading(true)
    setColors([])

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('http://localhost:8000/extract-colors', {
        method: 'POST',
        body: formData,
      })
      const data = await response.json()
      setColors(data.colors)
    } catch (error) {
      console.error('エラーが発生しました:', error)
      alert('色抽出に失敗しました。')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto', color: '#333' }}>
      <h1>🎨 Palette Harmony Analyzer</h1>
      <p>イラストをアップロードして、使われている色を網羅したパレット（最大100色）を作成します。</p>
      
      <input type="file" accept="image/*" onChange={handleImageUpload} style={{ 
        marginBottom: '1rem',
        padding: '10px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        backgroundColor: '#f9f9f9'
      }} />
      
      {imagePreview && (
        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <img src={imagePreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
        </div>
      )}

      {isLoading && (
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <div className="spinner" style={{
            border: '8px solid #f3f3f3',
            borderTop: '8px solid #3498db',
            borderRadius: '50%',
            width: '50px',
            height: '50px',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }}></div>
          <p style={{ marginTop: '10px', color: '#555' }}>色を抽出しています（AIが頻度分析中...）</p>
        </div>
      )}

      {!isLoading && colors.length > 0 && (
        <div style={{ marginTop: '2rem', border: '1px solid #ddd', borderRadius: '8px', padding: '1rem', backgroundColor: '#fff' }}>
          {/* 【修正】見出しを変更 */}
          <h3 style={{ marginTop: 0 }}>抽出されたパレット（網羅的・最大100色）</h3>
          {/* 【修正】パレット部分に最大高さを設けてスクロールできるようにする */}
          <div style={{ 
            display: 'flex', 
            gap: '8px', 
            flexWrap: 'wrap', 
            maxHeight: '300px', // 最大高さを設定
            overflowY: 'auto',   // 縦スクロールを許可
            padding: '10px',
            border: '1px solid #f0f0f0',
            borderRadius: '4px',
            backgroundColor: '#fafafa'
          }}>
            {colors.map((color, index) => (
              <div key={index} style={{ textAlign: 'center', flex: '0 0 auto' }}>
                <div style={{ 
                  width: '50px', // 少し小さくする
                  height: '50px', 
                  backgroundColor: color, 
                  borderRadius: '6px', 
                  border: '1px solid #ddd',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}></div>
                <p style={{ fontSize: '10px', marginTop: '4px', fontFamily: 'monospace', color: '#666' }}>{color}</p>
              </div>
            ))}
          </div>
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