import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { isCloudinaryConfigured, uploadToCloudinary } from '@/lib/utils/cloudinary'

describe('Cloudinary Storage Helper', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('should return false when Cloudinary env vars are missing', () => {
    delete process.env.CLOUDINARY_URL
    delete process.env.CLOUDINARY_CLOUD_NAME
    expect(isCloudinaryConfigured()).toBe(false)
  })

  it('should return true when CLOUDINARY_CLOUD_NAME, API_KEY, and API_SECRET are set', () => {
    process.env.CLOUDINARY_CLOUD_NAME = 'test_cloud'
    process.env.CLOUDINARY_API_KEY = 'test_key'
    process.env.CLOUDINARY_API_SECRET = 'test_secret'
    expect(isCloudinaryConfigured()).toBe(true)
  })

  it('should return null gracefully during upload if cloud name is not set', async () => {
    delete process.env.CLOUDINARY_CLOUD_NAME
    const buffer = Buffer.from('test image data')
    const result = await uploadToCloudinary(buffer)
    expect(result).toBeNull()
  })
})
