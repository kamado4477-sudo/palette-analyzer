import { useState } from 'react'

function App() {
  const [colors, setColors] = useState([])
  const [imagePreview, setImagePreview] = useState(null)
  // 【追加】ローディング状態を管理するstate
  const [isLoading, setIsLoading] = useState(false)

  const handleImageUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    setImagePreview(URL.createObjectURL(file))
    // 【追加】アップロード開始時にローディングをtrueにする
    setIsLoading(true)
    // パレットを一度クリアする
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
      // 【追加】成功しても失敗しても、処理が終わったらローディングをfalseにする
      setIsLoading(false)
    }
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🎨 Palette Harmony Analyzer</h1>
      <p>イラストをアップロードして、使われている色を抽出します。</p>
      
      <input type="file" accept="image/*" onChange={handleImageUpload} style={{ marginBottom: '1rem' }} />
      
      {imagePreview && (
        <div style={{ marginTop: '1rem' }}>
          <img src={imagePreview} alt="Preview" style={{ maxWidth: '100%', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
        </div>
      )}

      {/* 【追加】ローディング中の表示（スピナー） */}
      {isLoading && (
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          {/* シンプルなCSSスピナー */}
          <div className="spinner" style={{
            border: '8px solid #f3f3f3',
            borderTop: '8px solid #3498db',
            borderRadius: '50%',
            width: '50px',
            height: '50px',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }}></div>
          <p style={{ marginTop: '10px', color: '#555' }}>色を抽出しています（AIが計算中...）</p>
        </div>
      )}

      {/* パレットの表示（ローディング中は非表示にする） */}
      {!isLoading && colors.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h3>抽出されたパレット（主要5色）</h3>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {colors.map((color, index) => (
              <div key={index} style={{ textAlign: 'center' }}>
                <div style={{ 
                  width: '60px', 
                  height: '60px', 
                  backgroundColor: color, 
                  borderRadius: '8px', 
                  border: '1px solid #ddd',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}></div>
                <p style={{ fontSize: '12px', marginTop: '4px', fontFamily: 'monospace' }}>{color}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 【追加】スピナーのアニメーション用のCSS（本来はCSSファイルに書くべきですが、今回はここに記述します） */}
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