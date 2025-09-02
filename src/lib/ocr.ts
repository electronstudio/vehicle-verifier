import type { OCRResult } from './types';

export async function ocrSpaceRecognize(imageBlob: Blob, apiKey: string): Promise<string | null> {
  const formData = new FormData();
  formData.append('file', imageBlob);
  formData.append('apikey', apiKey);
  formData.append('OCREngine', '2'); // Engine 2 is better for plates
  formData.append('scale', 'true');
  formData.append('isTable', 'true');
  
  const response = await fetch('https://api.ocr.space/parse/image', {
    method: 'POST',
    body: formData
  });
  
  const result = await response.json();
  return result.ParsedResults?.[0]?.ParsedText || null;
}

async function resizeImage(imageBlob: Blob, maxSizeKB: number = 800): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    img.onload = () => {
      // Calculate new dimensions (max 1920px width for better OCR)
      let { width, height } = img;
      const maxWidth = 1920;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      
      // Try different quality levels until under size limit
      const tryQuality = (quality: number) => {
        canvas.toBlob((blob) => {
          if (blob && (blob.size <= maxSizeKB * 1024 || quality <= 0.1)) {
            console.log(`✅ Resized image: ${width}x${height}, ${Math.round(blob.size / 1024)}KB at ${Math.round(quality * 100)}% quality`);
            // Ensure the blob has the correct MIME type
            const jpegBlob = new Blob([blob], { type: 'image/jpeg' });
            resolve(jpegBlob);
          } else {
            tryQuality(Math.max(0.1, quality - 0.1));
          }
        }, 'image/jpeg', quality);
      };
      
      tryQuality(0.8); // Start with 80% quality
    };
    
    img.src = URL.createObjectURL(imageBlob);
  });
}

export async function extractPlate(imageBlob: Blob, apiKey: string): Promise<OCRResult> {
  try {
    if (!apiKey) {
      throw new Error('OCR.space API key not configured. Please check settings.');
    }

    console.log('📸 Original image details:');
    console.log('  Size:', Math.round(imageBlob.size / 1024) + 'KB');
    console.log('  Type:', imageBlob.type);
    console.log('  API Key length:', apiKey.length);
    
    // Resize image if too large
    let processedImage = imageBlob;
    if (imageBlob.size > 800 * 1024) { // 800KB threshold
      console.log('🔄 Image too large, resizing...');
      processedImage = await resizeImage(imageBlob);
    }
    
    console.log('📤 Final image for OCR:');
    console.log('  Size:', Math.round(processedImage.size / 1024) + 'KB');
    console.log('  Type:', processedImage.type);
    
    const formData = new FormData();
    // Ensure the file has the correct filename and extension
    const fileName = `image_${Date.now()}.jpg`;
    formData.append('file', processedImage, fileName);
    formData.append('apikey', apiKey);
    formData.append('OCREngine', '2'); // Engine 2 is better for plates
    formData.append('scale', 'true');
    formData.append('isTable', 'true');
    
    console.log('🌐 Sending to OCR.space API...');
    
    const response = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    console.log('Full OCR API response:', JSON.stringify(result, null, 2));
    
    if (!response.ok) {
      const errorMessage = result.ErrorMessage || 'OCR API request failed';
      console.error('OCR API error:', errorMessage);
      throw new Error(errorMessage);
    }
    
    if (!result.ParsedResults || !result.ParsedResults[0]) {
      console.log('❌ No ParsedResults in response');
      console.log('OCR Status:', result.OCRExitCode);
      console.log('Is Error:', result.IsErroredOnProcessing);
      console.log('Error Message:', result.ErrorMessage);
      console.log('Processing Time:', result.ProcessingTimeInMilliseconds + 'ms');
      
      // Common reasons for no results
      if (result.IsErroredOnProcessing) {
        console.log('🔍 OCR processing failed - image might be unclear, too small, or API key issue');
      } else {
        console.log('🔍 OCR completed but found no text in image');
      }
      
      return {
        plate: null,
        confidence: 0
      };
    }
    
    if (!result.ParsedResults[0].ParsedText) {
      console.log('No ParsedText in first result');
      return {
        plate: null,
        confidence: 0
      };
    }
    
    const rawText = result.ParsedResults[0].ParsedText;
    console.log('Raw OCR text from API:', rawText);
    
    let text = rawText.toUpperCase().replace(/[^A-Z0-9\s]/g, '').trim();
    console.log('After cleaning (remove non-alphanumeric):', text);
    
    // Remove GB prefix or suffix and extra whitespace
    const beforeGBRemoval = text;
    text = text.replace(/^GB\s?|\s?GB$/g, '').trim();
    if (text !== beforeGBRemoval) {
      console.log('After removing GB prefix/suffix:', text);
    }
    
    console.log('Final cleaned text for pattern matching:', text);
    console.log('Text length:', text.length);
    
    // UK plate regex patterns
    const patterns = [
      { pattern: /[A-Z]{2}[0-9]{2}\s?[A-Z]{3}/g, name: 'Current format: AB12 CDE' },
      { pattern: /[A-Z][0-9]{1,3}\s?[A-Z]{3}/g, name: 'Prefix: A123 BCD' },
      { pattern: /[A-Z]{3}\s?[0-9]{1,3}[A-Z]/g, name: 'Suffix: ABC 123D' },
      { pattern: /[A-Z]{1,2}\s?[0-9]{1,4}/g, name: 'Dateless: AB 1234' }
    ];
    
    console.log('Trying', patterns.length, 'plate patterns...');
    
    // Try each pattern
    for (let i = 0; i < patterns.length; i++) {
      const { pattern, name } = patterns[i];
      console.log(`Pattern ${i + 1} (${name}):`, pattern);
      
      const matches = Array.from(text.matchAll(pattern));
      console.log(`  Found ${matches.length} matches:`, matches.map(m => (m as RegExpMatchArray)[0]));
      
      if (matches.length > 0) {
        // Return the longest match (most likely to be complete plate)
        let bestMatch = matches[0];
        for (let j = 1; j < matches.length; j++) {
          if ((matches[j] as RegExpMatchArray)[0].length > (bestMatch as RegExpMatchArray)[0].length) {
            bestMatch = matches[j];
          }
        }
        let plate = (bestMatch as RegExpMatchArray)[0].replace(/\s/g, '');
        console.log(`  Best match: "${plate}" (length: ${plate.length})`);
        
        // Basic validation - UK plates are typically 2-8 characters
        if (plate.length >= 2 && plate.length <= 8) {
          console.log(`  ✅ Plate accepted: ${plate}`);
          return {
            plate,
            confidence: 1 // OCR.space doesn't provide confidence, so we use 1
          };
        } else {
          console.log(`  ❌ Plate rejected: length ${plate.length} not in range 2-8`);
        }
      }
    }
    
    console.log('❌ No valid license plate found in text');
    return {
      plate: null,
      confidence: 0
    };
  } catch (error) {
    console.error('OCR failed:', error);
    return {
      plate: null,
      confidence: 0
    };
  }
}

export function validateUKPlate(plate: string): boolean {
  const cleanPlate = plate.toUpperCase().replace(/\s/g, '');
  
  const patterns = [
    /^[A-Z]{2}[0-9]{2}[A-Z]{3}$/,  // Current format: AB12CDE
    /^[A-Z][0-9]{1,3}[A-Z]{3}$/,   // Prefix: A123BCD
    /^[A-Z]{3}[0-9]{1,3}[A-Z]$/,   // Suffix: ABC123D
    /^[A-Z]{1,2}[0-9]{1,4}$/       // Dateless: AB1234
  ];
  
  return patterns.some(pattern => pattern.test(cleanPlate));
}