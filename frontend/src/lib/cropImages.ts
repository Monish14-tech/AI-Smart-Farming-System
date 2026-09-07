// Helper utility to get photorealistic crop images for any vegetable, fruit, or grain

const CROP_IMAGE_MAP: Record<string, string> = {
  // Local generated high-res assets
  rice: '/crops/rice.jpg',
  paddy: '/crops/rice.jpg',
  tomato: '/crops/tomato.jpg',
  tomatoes: '/crops/tomato.jpg',
  onion: '/crops/onion.jpg',
  onions: '/crops/onion.jpg',
  potato: '/crops/potato.jpg',
  potatoes: '/crops/potato.jpg',
  chilli: '/crops/chilli.jpg',
  chillies: '/crops/chilli.jpg',
  'green chilli': '/crops/chilli.jpg',
  'red chilli': '/crops/chilli.jpg',

  // Curated high-res Unsplash photo fallbacks for all other future vegetables & crops
  wheat: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=800&q=80',
  maize: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=800&q=80',
  corn: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=800&q=80',
  brinjal: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=800&q=80',
  eggplant: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=800&q=80',
  cauliflower: 'https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?auto=format&fit=crop&w=800&q=80',
  cabbage: 'https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?auto=format&fit=crop&w=800&q=80',
  carrot: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=800&q=80',
  carrots: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=800&q=80',
  soybean: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?auto=format&fit=crop&w=800&q=80',
  groundnut: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80',
  peanut: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80',
  sugarcane: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80',
  cotton: 'https://images.unsplash.com/photo-1606041008023-472dfb5e530f?auto=format&fit=crop&w=800&q=80',
  garlic: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=800&q=80',
  ginger: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=800&q=80',
  capsicum: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?auto=format&fit=crop&w=800&q=80',
  bellpepper: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?auto=format&fit=crop&w=800&q=80',
};

const DEFAULT_FARM_IMAGE = 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80';

export function getCropImageUrl(cropName?: string, customImages?: string[]): string {
  // If custom images uploaded by farmer exist and are valid URLs
  if (customImages && customImages.length > 0 && customImages[0]?.trim()) {
    return customImages[0];
  }

  if (!cropName) return DEFAULT_FARM_IMAGE;

  const normalized = cropName.toLowerCase().trim();

  // Exact or partial match
  for (const [key, url] of Object.entries(CROP_IMAGE_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return url;
    }
  }

  return DEFAULT_FARM_IMAGE;
}
