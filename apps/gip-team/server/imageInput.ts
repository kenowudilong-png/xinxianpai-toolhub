export function dataUrlToBuffer(dataUrl: string) {
  const match = /^data:([^;,]+)?(;base64)?,(.*)$/s.exec(dataUrl)
  if (!match) throw new Error('Invalid data URL')
  const isBase64 = Boolean(match[2])
  const payload = match[3] || ''
  const buffer = isBase64 ? Buffer.from(payload, 'base64') : Buffer.from(decodeURIComponent(payload), 'utf8')
  const format = detectImageFormat(buffer)
  if (!format) throw new Error('输入图片不是有效的 PNG、JPEG、WebP 或 GIF 文件')
  return { ...format, buffer }
}

export function appendImageFormFile(
  formData: FormData,
  fieldName: string,
  dataUrl: string,
  baseName: string,
  requiredExtension?: string,
) {
  const file = dataUrlToBuffer(dataUrl)
  if (requiredExtension && file.extension !== requiredExtension) {
    throw new Error(`遮罩图片必须是 ${requiredExtension.toUpperCase()} 文件`)
  }
  formData.append(fieldName, new Blob([file.buffer], { type: file.mime }), `${baseName}.${file.extension}`)
}

function detectImageFormat(buffer: Buffer) {
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return { mime: 'image/png', extension: 'png' }
  }
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mime: 'image/jpeg', extension: 'jpg' }
  }
  if (buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP') {
    return { mime: 'image/webp', extension: 'webp' }
  }
  const gifHeader = buffer.subarray(0, 6).toString('ascii')
  if (gifHeader === 'GIF87a' || gifHeader === 'GIF89a') {
    return { mime: 'image/gif', extension: 'gif' }
  }
  return null
}
