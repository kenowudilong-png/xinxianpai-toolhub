import { afterEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_SETTINGS } from '../lib/apiProfiles'
import type { CallApiOptions } from '../lib/imageApiShared'
import { DEFAULT_PARAMS } from '../types'
import { callTeamImageApi } from './imageApi'

describe('callTeamImageApi', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('sends the client task id to the platform generation endpoint', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      ok: true,
      data: { images: ['data:image/png;base64,aW1hZ2U='] },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }))
    const options = {
      settings: DEFAULT_SETTINGS,
      prompt: 'prompt',
      params: DEFAULT_PARAMS,
      inputImageDataUrls: [],
      taskId: 'client-task-id',
    } as CallApiOptions & { taskId: string }

    await callTeamImageApi(options)

    expect(fetchMock).toHaveBeenCalledWith('/tools/gip/api/me/generate', expect.objectContaining({
      method: 'POST',
      credentials: 'include',
    }))
    const [, init] = fetchMock.mock.calls[0]
    expect(JSON.parse(String((init as RequestInit).body))).toMatchObject({
      prompt: 'prompt',
      taskId: 'client-task-id',
    })
  })
})
