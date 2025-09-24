import React, { useState, useRef, useCallback, useEffect } from 'react';

export default function Home() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [dailyCalories, setDailyCalories] = useState(1247);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const savedKey = localStorage.getItem('claude_api_key');
    if (savedKey) setApiKey(savedKey);
  }, []);

  const analyzeWithClaude = useCallback(async (base64Image) => {
    const imageData = base64Image.split(',')[1];
    
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageData, apiKey })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }

    const content = data.content[0].text;
    const jsonMatch = content.match(/\{[\s\S]*?\}/);
    
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        detectedFood: parsed.detectedFood,
        confidence: parsed.confidence,
        nutrition: { 
          calories: parsed.calories, 
          protein: parsed.protein, 
          carbs: parsed.carbs, 
          fat: parsed.fat 
        },
        aiAdvice: parsed.advice
      };
    }
    
    throw new Error('Analiz sonucu okunamadı');
  }, [apiKey]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      setSelectedImage(e.target.result);
      setIsAnalyzing(true);
      setAnalysisProgress(0);

      const interval = setInterval(() => {
        setAnalysisProgress(p => p < 90 ? p + Math.random() * 15 + 5 : p);
      }, 200);

      try {
        const result = await analyzeWithClaude(e.target.result);
        setAnalysisResult(result);
        setAnalysisProgress(100);
        setDailyCalories(prev => prev + result.nutrition.calories);
      } catch (error) {
        console.error('Analiz hatası:', error);
        setAnalysisResult({
          detectedFood: 'Analiz Hatası',
          nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 },
          aiAdvice: `Hata: ${error.message}`,
          confidence: 0
        });
        setAnalysisProgress(100);
      }

      clearInterval(interval);
      setIsAnalyzing(false);
      setTimeout(() => setAnalysisProgress(0), 1000);
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      <style jsx global>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
        }
        .container {
          max-width: 420px;
          margin: 0 auto;
          padding: 20px;
          min-height: 100vh;
        }
        .header {
          background: rgba(255,255,255,0.95);
          backdrop-filter: blur(20px);
          padding: 25px;
          border-radius: 20px;
          text-align: center;
          margin-bottom: 20px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.1);
          border: 1px solid rgba(255,255,255,0.2);
        }
        .header h1 {
          font-size: 28px;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 5px;
        }
        .header p {
          color: #666;
          font-size: 14px;
        }
        .card {
          background: rgba(255,255,255,0.95);
          backdrop-filter: blur(20px);
          border-radius: 20px;
          padding: 25px;
          margin-bottom: 20px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.1);
          border: 1px solid rgba(255,255,255,0.2);
        }
        .status {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 15px;
        }
        .status-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        .status-dot.active { background: #10b981; }
        .status-dot.inactive { background: #f59e0b; }
        .button {
          background: linear-gradient(135deg, #8b5cf6, #a855f7);
          color: white;
          border: none;
          padding: 12px 20px;
          border-radius: 12px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
          font-size: 14px;
        }
        .button:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 20px rgba(139, 92, 246, 0.4);
        }
        .button:active { transform: translateY(0); }
        .input {
          width: 100%;
          padding: 15px;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          font-size: 14px;
          margin: 10px 0;
          transition: border-color 0.2s;
        }
        .input:focus {
          outline: none;
          border-color: #8b5cf6;
        }
        .upload-area {
          border: 2px dashed #d1d5db;
          border-radius: 16px;
          padding: 40px 20px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          background: rgba(248, 250, 252, 0.5);
        }
        .upload-area:hover {
          border-color: #8b5cf6;
          background: rgba(139, 92, 246, 0.05);
        }
        .progress-container {
          text-align: center;
          padding: 30px;
        }
        .spinner {
          width: 50px;
          height: 50px;
          border: 4px solid rgba(139, 92, 246, 0.1);
          border-top: 4px solid #8b5cf6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .progress {
          width: 100%;
          height: 8px;
          background: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
          margin: 15px 0;
        }
        .progress-bar {
          height: 100%;
          background: linear-gradient(90deg, #8b5cf6, #a855f7);
          border-radius: 4px;
          transition: width 0.3s ease;
        }
        .result {
          text-align: center;
        }
        .result-header {
          background: linear-gradient(135deg, #8b5cf6, #a855f7);
          color: white;
          padding: 20px;
          border-radius: 16px;
          margin-bottom: 20px;
        }
        .result-header h3 {
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 5px;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-bottom: 20px;
        }
        .stat-card {
          background: rgba(248, 250, 252, 0.8);
          padding: 20px;
          border-radius: 12px;
          text-align: center;
        }
        .stat-value {
          font-size: 24px;
          font-weight: 700;
          color: #1a1a1a;
        }
        .stat-label {
          font-size: 12px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .advice {
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.2);
          padding: 20px;
          border-radius: 12px;
          color: #065f46;
          font-size: 14px;
          line-height: 1.5;
        }
        .advice h4 {
          color: #047857;
          margin-bottom: 8px;
          font-weight: 600;
        }
        .image-preview {
          width: 100%;
          max-height: 300px;
          object-fit: cover;
          border-radius: 12px;
          margin-bottom: 20px;
        }
        .calories-header {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          padding: 20px;
          border-radius: 16px;
          text-align: center;
          margin-bottom: 20px;
        }
        .calories-big {
          font-size: 32px;
          font-weight: 700;
          margin-bottom: 5px;
        }
        .flex-buttons {
          display: flex;
          gap: 10px;
          margin-top: 15px;
        }
        .flex-buttons .button {
          flex: 1;
        }
        .button-secondary {
          background: #6b7280;
        }
        .button-secondary:hover {
          background: #4b5563;
          box-shadow: 0 4px 20px rgba(107, 114, 128, 0.4);
        }
      `}</style>
      
      <div className="container">
        <div className="header">
          <h1>🍽️ CaloriAI</h1>
          <p>Claude ile Akıllı Beslenme Asistanı</p>
        </div>

        <div className="card">
          <div className="calories-header">
            <div className="calories-big">{dailyCalories}</div>
            <div>Günlük Kalori</div>
          </div>
        </div>

        <div className="card">
          <div className="status">
            <div className="status-indicator">
              <div className={`status-dot ${apiKey ? 'active' : 'inactive'}`}></div>
              <span>{apiKey ? 'Claude API Aktif' : 'API Key Gerekli'}</span>
            </div>
            <button className="button" onClick={() => setShowApiKeyInput(!showApiKeyInput)}>
              {apiKey ? 'Değiştir' : 'API Key'}
            </button>
          </div>
          
          {showApiKeyInput && (
            <div>
              <input
                className="input"
                type="password"
                placeholder="Claude API Key (sk-ant-api...)"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <div className="flex-buttons">
                <button 
                  className="button"
                  onClick={() => {
                    localStorage.setItem('claude_api_key', apiKey);
                    setShowApiKeyInput(false);
                  }}
                >
                  Kaydet
                </button>
                <button 
                  className="button button-secondary"
                  onClick={() => {
                    setApiKey('');
                    localStorage.removeItem('claude_api_key');
                    setShowApiKeyInput(false);
                  }}
                >
                  Temizle
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="card">
          {selectedImage ? (
            <div>
              <img src={selectedImage} alt="Yiyecek" className="image-preview" />
              
              {isAnalyzing ? (
                <div className="progress-container">
                  <div className="spinner"></div>
                  <h3>Claude analiz ediyor...</h3>
                  <p>Görsel işleniyor ve yiyecek tanınıyor</p>
                  <div className="progress">
                    <div className="progress-bar" style={{ width: `${analysisProgress}%` }}></div>
                  </div>
                  <div>{Math.round(analysisProgress)}%</div>
                </div>
              ) : analysisResult && (
                <div className="result">
                  <div className="result-header">
                    <h3>{analysisResult.detectedFood}</h3>
                    <div>Güven: %{analysisResult.confidence || 0}</div>
                  </div>
                  
                  <div className="stats-grid">
                    <div className="stat-card">
                      <div className="stat-value">{analysisResult.nutrition.calories}</div>
                      <div className="stat-label">Kalori</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-value">{analysisResult.nutrition.protein}g</div>
                      <div className="stat-label">Protein</div>
                    </div>
                  </div>
                  
                  <div className="advice">
                    <h4>AI Önerisi</h4>
                    <div>{analysisResult.aiAdvice}</div>
                  </div>
                  
                  <button 
                    className="button" 
                    style={{width: '100%', marginTop: '20px'}}
                    onClick={() => {
                      setSelectedImage(null);
                      setAnalysisResult(null);
                    }}
                  >
                    Yeni Analiz
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="upload-area" onClick={() => fileInputRef.current.click()}>
              <div style={{fontSize: '48px', marginBottom: '15px'}}>📸</div>
              <h3>Yiyecek Fotoğrafı Yükle</h3>
              <p style={{color: '#666', marginBottom: '20px'}}>Claude ile akıllı kalori hesaplama</p>
              <div className="button">Fotoğraf Seç</div>
            </div>
          )}
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          style={{ display: 'none' }}
        />
      </div>
    </>
  );
}
