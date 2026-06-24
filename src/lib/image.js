// Downscale + re-encode an image File to a compact JPEG base64 string.
// Phone camera photos are multi-MB (and often HEIC, which Claude can't read);
// this shrinks them to a few hundred KB of JPEG so the upload succeeds.
export function fileToCompressedBase64(file, maxDim = 1280, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        let { width, height } = img
        const scale = Math.min(1, maxDim / Math.max(width, height))
        width = Math.max(1, Math.round(width * scale))
        height = Math.max(1, Math.round(height * scale))
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        try {
          const dataUrl = canvas.toDataURL('image/jpeg', quality)
          resolve({ base64: dataUrl.split(',')[1], media_type: 'image/jpeg' })
        } catch (e) {
          reject(e)
        }
      }
      img.onerror = () => reject(new Error('Could not read that image. Try another photo.'))
      img.src = reader.result
    }
    reader.onerror = () => reject(new Error('Could not load the file.'))
    reader.readAsDataURL(file)
  })
}
