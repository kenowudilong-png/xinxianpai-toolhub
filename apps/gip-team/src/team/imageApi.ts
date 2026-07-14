import type { CallApiOptions, CallApiResult } from '../lib/imageApiShared'
import { gipApiPath } from './api'
import { getServerImage } from './serverState'

type GenerateResponse = {
  images: string[]
  actualParams?: CallApiResult['actualParams']
  actualParamsList?: CallApiResult['actualParamsList']
  revisedPrompts?: CallApiResult['revisedPrompts']
  rawImageUrls?: string[]
  taskId?: string
  imageIds?: string[]
}


export async function callTeamImageApi(opts: CallApiOptions): Promise<CallApiResult> {
  const response = await fetch(gipApiPath('/me/generate'), {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
    body: JSON.stringify({
      prompt: opts.prompt,
      params: opts.params,
      inputImageDataUrls: opts.inputImageDataUrls,
      maskDataUrl: opts.maskDataUrl,
      mode: opts.settings.apiMode,
      taskId: opts.taskId,
    }),
  })

  const payload = await response.json().catch(() => null) as { ok?: boolean; data?: GenerateResponse; error?: { message?: string } } | null
  if (!response.ok || !payload?.ok || !payload.data) {
    throw new Error(payload?.error?.message || `HTTP ${response.status}`)
  }

  if ((!payload.data.images || payload.data.images.length === 0) && payload.data.imageIds?.length) {
    const images = await Promise.all(payload.data.imageIds.map(async (id) => {
      const image = await getServerImage(id)
      if (!image) throw new Error(`生成图片读取失败：${id}`)
      return image
    }))
    return { ...payload.data, images }
  }

  return payload.data
}
