import React, { useState, useRef, useCallback, useEffect } from 'react';

export default function Home() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const savedKey = localStorage.getItem('claude_api_key');
    if (savedKey) setApiKey(savedKey);
  }, []);

  const analyzeWithClaude = useCallback(async (base64Image) => {
    const imageData = base64Image.split(',')[1];
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: "claude-3-sonnet-20240229",
        max_tokens: 300,
        messages: [{
          role: "user",
          content: [
            {
              type: "text",
              text: 'Bu yiyeceği tanımla: {"detectedFood":"ad","calories":200,"confidence":85}'
            },
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/jpeg",
                data: imageData
              }
            }
          ]
        }]
      })
    });

    const data = await response.json();
    const content = data.content[0].text;
    const parsed = JSON.parse(content.match(/\{[^}]+\}/)[0]);
    
    return {
      detectedFood: parsed.detectedFood,
      confidence: parsed.confidence,
      nutrition: { calories: parsed.calories, protein: 15, carbs: 30, fat: 10 },
      aiAdvice: 'Claude Vision analizi tamamlandı.'
    };
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
        setAnalysisProgress(p => p < 90 ? p + 10 : p);
      }, 200);

      try {
        const result = await analyzeWithClaude(e.target.result);
        setAnalysisResult(result);
        setAnalysisProgress(100);
      } catch (error) {
        setAnalysisResult({
          detectedFood: 'Analiz Hatası',
          nutrition: { calories: 0 },
          aiAdvice: error.message
        });
      }

      clearInterval(interval);
      setIsAnalyzing(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '20px' }}>
      <style jsx global>{`
        body { font-family: system-ui; background: #f5f5f5; margin: 0; }
        .card { background: white; padding: 20px; border-radius: 12px; margin: 10px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .button { background: #8b5cf6; color: white; padding: 12px 20px; border: none; border-radius: 8px; cursor: pointer; }
        .button:hover { background: #7c3aed; }
        .input { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px; margin: 5px 0; }
        .progress { width: 100%; height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden; }
        .progress-bar { height: 100%; background: linear-gradient(to right, #8b5cf6, #a855f7); transition: width 0.3s; }
      `}</style>

      <div className="card">
        <h1>🍽️ CaloriAI</h1>
        <p>Claude ile Yiyecek Analizi</p>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span>{apiKey ? '✅ API Aktif' : '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'}</span>
          <button className="button" onClick={() => setShowApiKeyInput(!showApiKeyInput)}>
            {apiKey ? 'Değiştir' : 'API Key'}
          </button>
        </div>
        
        {showApiKeyInput && (
          <div>
            <input
              className="input"
              type="password"
              placeholder="Claude API Key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <button 
              className="button" 
              onClick={() => {
                localStorage.setItem('claude_api_key', apiKey);
                setShowApiKeyInput(false);
              }}
            >
              Kaydet
            </button>
          </div>
        )}
      </div>

      <div className="card">
        {selectedImage ? (
          <div>
            <img src={selectedImage} alt="Yiyecek" style={{ width: '100%', borderRadius: '8px', marginBottom: '15px' }} />
            
            {isAnalyzing ? (
              <div style={{ textAlign: 'center' }}>
                <p>Claude analiz ediyor...</p>
                <div className="progress">
                  <div className="progress-bar" style={{ width: `${analysisProgress}%` }}></div>
                </div>
                <p>{analysisProgress}%</p>
              </div>
            ) : analysisResult && (
              <div>
                <h3>{analysisResult.detectedFood}</h3>
                <p><strong>{analysisResult.nutrition.calories} kalori</strong></p>
                <p>{analysisResult.aiAdvice}</p>
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p>Yiyecek fotoğrafı yükle</p>
            <button className="button" onClick={() => fileInputRef.current.click()}>
              📸 Fotoğraf Seç
            </button>
          </div>
        )}
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          style={{ display: 'none' }}
        />
      </div>
    </div>
  );
}
