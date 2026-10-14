/**
 * Cloudinary Storage Helper for Scribbl
 * Offloads heavy images (PFPs, avatar heads, group memory photos)
 * to Cloudinary to preserve free database & storage limits.
 */

export interface CloudinaryUploadOptions {
  folder?: string
  publicId?: string
  tags?: string[]
}

export interface CloudinaryUploadResult {
  url: string
  publicId: string
  format: string
  bytes: number
}

/**
 * Checks whether Cloudinary credentials are fully configured in environment variables.
 */
export function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_URL ||
    (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)
  )
}

/**
 * Uploads a image buffer to Cloudinary using HTTP REST API.
 * Server-side execution only.
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  options: CloudinaryUploadOptions = {}
): Promise<CloudinaryUploadResult | null> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || 'scribbl_uploads'

  if (!cloudName) {
    console.warn('[Cloudinary] CLOUDINARY_CLOUD_NAME not set. Falling back to primary storage.')
    return null
  }

  try {
    const formData = new FormData()
    const blob = new Blob([new Uint8Array(buffer)], { type: 'image/webp' })
    formData.append('file', blob, 'upload.webp')
    formData.append('upload_preset', uploadPreset)

    if (options.folder) formData.append('folder', options.folder)
    if (options.publicId) formData.append('public_id', options.publicId)
    if (options.tags) formData.append('tags', options.tags.join(','))

    const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`
    const res = await fetch(endpoint, {
      method: 'POST',
      body: formData,
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('[Cloudinary] Upload failed:', errText)
      return null
    }

    const data = await res.json()
    return {
      url: data.secure_url,
      publicId: data.public_id,
      format: data.format,
      bytes: data.bytes,
    }
  } catch (err) {
    console.error('[Cloudinary] Exception during upload:', err)
    return null
  }
}
