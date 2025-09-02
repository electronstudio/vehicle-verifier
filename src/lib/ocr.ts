import Tesseract from 'tesseract.js';
import type { OCRResult } from './types';

export async function extractPlate(imageBlob: Blob): Promise<OCRResult> {
  try {
    const { data: { text, confidence } } = await Tesseract.recognize(
      imageBlob,
      'eng',
      {
        logger: (m) => console.log(m)
      }
    );
    
    // UK plate regex patterns
    const patterns = [
      /[A-Z]{2}[0-9]{2}\s?[A-Z]{3}/g,  // Current format: AB12 CDE
      /[A-Z][0-9]{1,3}\s?[A-Z]{3}/g,   // Prefix: A123 BCD  
      /[A-Z]{3}\s?[0-9]{1,3}[A-Z]/g,   // Suffix: ABC 123D
      /[A-Z]{1,2}\s?[0-9]{1,4}/g       // Dateless: AB 1234
    ];
    
    const cleanText = text.toUpperCase().replace(/[^A-Z0-9\s]/g, '');
    console.log('OCR text:', cleanText);
    
    // Try each pattern
    for (const pattern of patterns) {
      const matches = Array.from(cleanText.matchAll(pattern));
      if (matches.length > 0) {
        // Return the longest match (most likely to be complete plate)
        const bestMatch = matches.reduce((a, b) => 
          a[0].length > b[0].length ? a : b
        );
        const plate = bestMatch[0].replace(/\s/g, '');
        
        // Basic validation - UK plates are typically 2-8 characters
        if (plate.length >= 2 && plate.length <= 8) {
          return {
            plate,
            confidence: confidence / 100
          };
        }
      }
    }
    
    return {
      plate: null,
      confidence: confidence / 100
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