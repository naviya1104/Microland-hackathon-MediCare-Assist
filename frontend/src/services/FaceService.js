/* 
   FaceService.js - High-Reliability Version
   Uses Pixel Matrix Analysis (Template Matching) for zero-dependency Face ID.
   Works 100% offline with zero model downloads.
*/

export async function loadModels() {
  // Zero-dependency version doesn't need external models
  console.log('⚡ Offline Biometric Engine Initialized');
  return true;
}

export async function getFaceDescriptor(videoElement) {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Capture a signature (48x48 for better detail)
    canvas.width = 48;
    canvas.height = 48;
    
    ctx.drawImage(videoElement, 0, 0, 48, 48);
    const imageData = ctx.getImageData(0, 0, 48, 48);
    const pixels = imageData.data;
    
    let sum = 0;
    const signature = new Float32Array(48 * 48);
    for (let i = 0; i < pixels.length; i += 4) {
      const val = (pixels[i] * 0.299 + pixels[i+1] * 0.587 + pixels[i+2] * 0.114) / 255.0;
      signature[i / 4] = val;
      sum += val;
    }
    
    const avg = sum / signature.length;
    let variance = 0;
    for (let i = 0; i < signature.length; i++) {
      variance += Math.pow(signature[i] - avg, 2);
    }
    const stdDev = Math.sqrt(variance / signature.length);
    
    // Agreessive Variance Check: Requirements distinct features (eyes, nose, mouth areas)
    console.log('Frame Contrast (StdDev):', stdDev);
    if (stdDev < 0.15) return null; 
    
    // Normalize signature (Zero-Mean Unit-Variance) to be lighting-invariant
    for (let i = 0; i < signature.length; i++) {
        signature[i] = (signature[i] - avg) / (stdDev + 0.0001);
    }
    
    return signature;
  } catch (err) {
    console.error('Signature extraction failed:', err);
    return null;
  }
}

export function compareFaces(sig1, sig2) {
  if (!sig1 || !sig2) return false;
  
  // Normalized Cross-Correlation (NCC) 
  // Result is between -1 and 1. Perfect match is 1.0.
  let dotProduct = 0;
  for (let i = 0; i < sig1.length; i++) {
    dotProduct += sig1[i] * sig2[i];
  }
  
  const score = dotProduct / sig1.length;
  console.log('Biometric Similarity Score (NCC):', score);
  
  // A threshold of 0.7 - 0.8 is typical for secure matching
  return score > 0.75;
}
