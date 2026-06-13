import Replicate from 'replicate'

export const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
})

export const IMAGE_MODELS = {
  free: 'stability-ai/sdxl:39ed52f2319f9bc3da5c8a97e0cd5e2b1b3b1a3e',
  pro: 'black-forest-labs/flux-1.1-pro',
  ultra: 'black-forest-labs/flux-1.1-pro',
}

export const MUSIC_MODEL = 'meta/musicgen:671ac645ce5e552cc63a54a2bbff63fcf798043399421d6d8962a3b1ab4b4e7'
export const VIDEO_MODEL = 'anotherjesse/zeroscope-v2-xl:9f747673945c62801b13b84701c783929c0ee784e4748ec062204894dda1a351'

export const STYLE_PROMPTS: Record<string, string> = {
  Realistic: 'photorealistic, highly detailed, 8k, professional photography',
  Cinematic: 'cinematic, dramatic lighting, film grain, widescreen, movie still',
  Anime: 'anime style, manga, vibrant colors, cel shading, Studio Ghibli inspired',
  'Oil Painting': 'oil painting, impasto technique, rich textures, classical art, museum quality',
  Minimal: 'minimalist, clean lines, simple composition, negative space, modern design',
  Cyberpunk: 'cyberpunk, neon lights, futuristic city, rain, dark atmosphere, blade runner',
  Watercolor: 'watercolor painting, soft edges, flowing colors, artistic, delicate',
}
