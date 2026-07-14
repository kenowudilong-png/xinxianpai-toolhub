import { afterEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_PARAMS } from '../types'
import { DEFAULT_SETTINGS } from './apiProfiles'

const callTeamImageApi = vi.hoisted(() => vi.fn(async () => ({
  images: ['data:image/png;base64,cGxhdGZvcm0='],
})))

vi.mock('../team/imageApi', () => ({ callTeamImageApi }))

import { callImageApi } from './api'

describe('platform image API routing', () => {
  afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllEnvs()
  })

  it('delegates production generation requests to the platform API', async () => {
    vi.stubEnv('MODE', 'production')
    const options = {
      settings: DEFAULT_SETTINGS,
      prompt: 'prompt',
      params: DEFAULT_PARAMS,
      inputImageDataUrls: [],
      taskId: 'client-task-id',
    }

    const result = await callImageApi(options)

    expect(callTeamImageApi).toHaveBeenCalledWith(options)
    expect(result.images).toEqual(['data:image/png;base64,cGxhdGZvcm0='])
  })
})
