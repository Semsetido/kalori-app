export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Dosya boyutu limitini artır
    },
  },
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageData, apiKey } = req.body;

    // Görsel boyutunu küçült (base64'te)
    const compressedImageData = imageData.length > 500000 
      ? imageData.substring(0, 500000) // İlk 500KB'ı al
      : imageData;

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
              text: `Bu yiyeceği tanımla: {"detectedFood":"yemek_adi","calories":250,"confidence":85,"protein":15,"carbs":30,"fat":10,"advice":"öneri"}`
            },
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/jpeg",
                data: compressedImageData
              }
            }
          ]
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Claude API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message });
  }
}
