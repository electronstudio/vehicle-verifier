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

export async function extractPlate(imageBlob: Blob, apiKey: string): Promise<OCRResult> {
  try {
    if (!apiKey) {
      throw new Error('OCR.space API key not configured. Please check settings.');
    }

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
    
    if (!response.ok) {
      const errorMessage = result.ErrorMessage || 'OCR API request failed';
      throw new Error(errorMessage);
    }
    
    if (!result.ParsedResults || !result.ParsedResults[0] || !result.ParsedResults[0].ParsedText) {
      return {
        plate: null,
        confidence: 0
      };
    }
    
    let text = result.ParsedResults[0].ParsedText.toUpperCase().replace(/[^A-Z0-9\s]/g, '').trim();
    
    // Remove GB prefix or suffix and extra whitespace
    text = text.replace(/^GB\s?|\s?GB$/g, '').trim();
    
    console.log('OCR text:', text);
    
    // UK plate regex patterns
    const patterns = [
      /[A-Z]{2}[0-9]{2}\s?[A-Z]{3}/g,  // Current format: AB12 CDE
      /[A-Z][0-9]{1,3}\s?[A-Z]{3}/g,   // Prefix: A123 BCD  
      /[A-Z]{3}\s?[0-9]{1,3}[A-Z]/g,   // Suffix: ABC 123D
      /[A-Z]{1,2}\s?[0-9]{1,4}/g       // Dateless: AB 1234
    ];
    
    // Try each pattern
    for (const pattern of patterns) {
      const matches = Array.from(text.matchAll(pattern));
      if (matches.length > 0) {
        // Return the longest match (most likely to be complete plate)
        let bestMatch = matches[0];
        for (let i = 1; i < matches.length; i++) {
          if ((matches[i] as RegExpMatchArray)[0].length > (bestMatch as RegExpMatchArray)[0].length) {
            bestMatch = matches[i];
          }
        }
        let plate = (bestMatch as RegExpMatchArray)[0].replace(/\s/g, '');
        
        // Basic validation - UK plates are typically 2-8 characters
        if (plate.length >= 2 && plate.length <= 8) {
          return {
            plate,
            confidence: 1 // OCR.space doesn't provide confidence, so we use 1
          };
        }
      }
    }
    
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