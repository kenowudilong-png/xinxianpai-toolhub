import { describe, expect, it } from 'vitest'
import { appendImageFormFile, dataUrlToBuffer } from './imageInput.js'

function asDataUrl(mime: string, bytes: number[]) {
  return `data:${mime};base64,${Buffer.from(bytes).toString('base64')}`
}

describe('dataUrlToBuffer', () => {
  it('uses the image signature to normalize MIME and filename extension', () => {
    const result = dataUrlToBuffer(asDataUrl('image/png', [0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0xff, 0xd9]))

    expect(result.mime).toBe('image/jpeg')
    expect((result as typeof result & { extension: string }).extension).toBe('jpg')
  })

  it('recognizes a PNG image signature', () => {
    const result = dataUrlToBuffer(asDataUrl('application/octet-stream', [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))

    expect(result.mime).toBe('image/png')
    expect((result as typeof result & { extension: string }).extension).toBe('png')
  })

  it('rejects data that is not a supported image', () => {
    expect(() => dataUrlToBuffer(asDataUrl('image/png', [0x3c, 0x68, 0x74, 0x6d, 0x6c, 0x3e])))
      .toThrow('输入图片不是有效的 PNG、JPEG、WebP 或 GIF 文件')
  })
})

describe('appendImageFormFile', () => {
  it('sends JPEG bytes with matching multipart MIME and filename', () => {
    const formData = new FormData()
    appendImageFormFile(formData, 'image[]', asDataUrl('image/png', [0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0xff, 0xd9]), 'input-1')

    const file = formData.get('image[]') as File
    expect(file.type).toBe('image/jpeg')
    expect(file.name).toBe('input-1.jpg')
  })

  it('rejects a non-PNG mask before adding it to multipart data', () => {
    const formData = new FormData()

    expect(() => appendImageFormFile(formData, 'mask', asDataUrl('image/jpeg', [0xff, 0xd8, 0xff, 0xe0, 0xff, 0xd9]), 'mask', 'png'))
      .toThrow('遮罩图片必须是 PNG 文件')
    expect(formData.get('mask')).toBeNull()
  })
})
