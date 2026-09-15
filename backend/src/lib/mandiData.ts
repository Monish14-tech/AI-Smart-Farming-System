export interface MandiRecord {
  commodity: string;
  market: string;
  state: string;
  district?: string;
  min_price: number;
  max_price: number;
  modal_price: number;
  variety?: string;
  arrival_date?: string;
}

export const FALLBACK_MANDI_PRICES: MandiRecord[] = [
  // Tomato
  { commodity: 'Tomato', market: 'Azadpur', district: 'North Delhi', state: 'Delhi', min_price: 1800, max_price: 2800, modal_price: 2400, variety: 'Hybrid' },
  { commodity: 'Tomato', market: 'Kolar', district: 'Kolar', state: 'Karnataka', min_price: 1600, max_price: 2500, modal_price: 2100, variety: 'Local' },
  { commodity: 'Tomato', market: 'Nashik (Pimpalgaon)', district: 'Nashik', state: 'Maharashtra', min_price: 1700, max_price: 2700, modal_price: 2300, variety: 'Anas' },
  { commodity: 'Tomato', market: 'Madanapalle', district: 'Chittoor', state: 'Andhra Pradesh', min_price: 1750, max_price: 2650, modal_price: 2250, variety: 'Hybrid' },

  // Onion
  { commodity: 'Onion', market: 'Lasalgaon', district: 'Nashik', state: 'Maharashtra', min_price: 2200, max_price: 3400, modal_price: 2850, variety: 'Red Onion' },
  { commodity: 'Onion', market: 'Pune', district: 'Pune', state: 'Maharashtra', min_price: 2300, max_price: 3500, modal_price: 2900, variety: 'Medium' },
  { commodity: 'Onion', market: 'Hubli (Amaragol)', district: 'Dharwad', state: 'Karnataka', min_price: 2100, max_price: 3300, modal_price: 2750, variety: 'Bellary' },
  { commodity: 'Onion', market: 'Alwar', district: 'Alwar', state: 'Rajasthan', min_price: 2000, max_price: 3100, modal_price: 2600, variety: 'Nasik Quality' },

  // Potato
  { commodity: 'Potato', market: 'Agra', district: 'Agra', state: 'Uttar Pradesh', min_price: 1500, max_price: 2300, modal_price: 1950, variety: 'Kufri Bahar' },
  { commodity: 'Potato', market: 'Farrukhabad', district: 'Farrukhabad', state: 'Uttar Pradesh', min_price: 1400, max_price: 2200, modal_price: 1850, variety: 'Chipsona' },
  { commodity: 'Potato', market: 'Jalandhar City', district: 'Jalandhar', state: 'Punjab', min_price: 1550, max_price: 2400, modal_price: 2000, variety: 'Jyoti' },
  { commodity: 'Potato', market: 'Burdwan', district: 'Purba Bardhaman', state: 'West Bengal', min_price: 1450, max_price: 2250, modal_price: 1900, variety: 'Jyoti' },

  // Wheat
  { commodity: 'Wheat', market: 'Khanna', district: 'Ludhiana', state: 'Punjab', min_price: 2800, max_price: 3250, modal_price: 3050, variety: 'Sharbati' },
  { commodity: 'Wheat', market: 'Karnal', district: 'Karnal', state: 'Haryana', min_price: 2750, max_price: 3200, modal_price: 3000, variety: 'Dara' },
  { commodity: 'Wheat', market: 'Ujjain', district: 'Ujjain', state: 'Madhya Pradesh', min_price: 2700, max_price: 3150, modal_price: 2950, variety: 'Lokwan' },
  { commodity: 'Wheat', market: 'Kota', district: 'Kota', state: 'Rajasthan', min_price: 2650, max_price: 3100, modal_price: 2900, variety: 'Mill Quality' },

  // Rice / Paddy
  { commodity: 'Rice', market: 'Karnal', district: 'Karnal', state: 'Haryana', min_price: 4200, max_price: 5400, modal_price: 4800, variety: 'Basmati 1121' },
  { commodity: 'Rice', market: 'Bardhaman', district: 'Purba Bardhaman', state: 'West Bengal', min_price: 4100, max_price: 5100, modal_price: 4600, variety: 'Swarna' },
  { commodity: 'Rice', market: 'Nizamabad', district: 'Nizamabad', state: 'Telangana', min_price: 4150, max_price: 5300, modal_price: 4750, variety: 'BPT 5204' },
  { commodity: 'Rice', market: 'Thanjavur', district: 'Thanjavur', state: 'Tamil Nadu', min_price: 3950, max_price: 5050, modal_price: 4500, variety: 'Ponni' },

  // Green Chilli
  { commodity: 'Green Chilli', market: 'Guntur (Mirchi Yard)', district: 'Guntur', state: 'Andhra Pradesh', min_price: 4800, max_price: 6400, modal_price: 5600, variety: 'Teja' },
  { commodity: 'Green Chilli', market: 'Surat', district: 'Surat', state: 'Gujarat', min_price: 4600, max_price: 6200, modal_price: 5400, variety: 'G-4' },
  { commodity: 'Green Chilli', market: 'Belgaum', district: 'Belagavi', state: 'Karnataka', min_price: 4500, max_price: 6000, modal_price: 5250, variety: 'Jwala' },

  // Cotton
  { commodity: 'Cotton', market: 'Rajkot', district: 'Rajkot', state: 'Gujarat', min_price: 6400, max_price: 7800, modal_price: 7100, variety: 'Shankar-6' },
  { commodity: 'Cotton', market: 'Warangal', district: 'Warangal', state: 'Telangana', min_price: 6300, max_price: 7600, modal_price: 6950, variety: 'Medium Staple' },
  { commodity: 'Cotton', market: 'Abohar', district: 'Fazilka', state: 'Punjab', min_price: 6500, max_price: 7900, modal_price: 7200, variety: 'American Cotton' },

  // Soybean
  { commodity: 'Soybean', market: 'Indore', district: 'Indore', state: 'Madhya Pradesh', min_price: 4100, max_price: 5100, modal_price: 4650, variety: 'Yellow' },
  { commodity: 'Soybean', market: 'Latur', district: 'Latur', state: 'Maharashtra', min_price: 4150, max_price: 5200, modal_price: 4700, variety: 'Yellow' },
  { commodity: 'Soybean', market: 'Kota', district: 'Kota', state: 'Rajasthan', min_price: 4000, max_price: 5000, modal_price: 4550, variety: 'Desi' },

  // Cauliflower & Cabbage
  { commodity: 'Cauliflower', market: 'Azadpur', district: 'North Delhi', state: 'Delhi', min_price: 2000, max_price: 3200, modal_price: 2650, variety: 'Snowball' },
  { commodity: 'Cauliflower', market: 'Ranchi', district: 'Ranchi', state: 'Jharkhand', min_price: 1800, max_price: 2900, modal_price: 2400, variety: 'Local' },
  { commodity: 'Cabbage', market: 'Vashi (Mumbai)', district: 'Thane', state: 'Maharashtra', min_price: 1400, max_price: 2200, modal_price: 1800, variety: 'Round' },
  { commodity: 'Cabbage', market: 'Ooty', district: 'Nilgiris', state: 'Tamil Nadu', min_price: 1500, max_price: 2350, modal_price: 1950, variety: 'Hybrid' },

  // Carrot & Brinjal
  { commodity: 'Carrot', market: 'Vashi (Mumbai)', district: 'Thane', state: 'Maharashtra', min_price: 2800, max_price: 4100, modal_price: 3450, variety: 'Red' },
  { commodity: 'Carrot', market: 'Bangalore (Yeshwanthpur)', district: 'Bangalore Urban', state: 'Karnataka', min_price: 2700, max_price: 3900, modal_price: 3300, variety: 'Local' },
  { commodity: 'Brinjal', market: 'Ahmedabad', district: 'Ahmedabad', state: 'Gujarat', min_price: 1600, max_price: 2600, modal_price: 2200, variety: 'Round Black' },
  { commodity: 'Brinjal', market: 'Kolkata (Koley Market)', district: 'Kolkata', state: 'West Bengal', min_price: 1700, max_price: 2750, modal_price: 2300, variety: 'Long Purple' },

  // Groundnut & Maize
  { commodity: 'Groundnut', market: 'Rajkot', district: 'Rajkot', state: 'Gujarat', min_price: 6600, max_price: 8100, modal_price: 7350, variety: 'Bold' },
  { commodity: 'Groundnut', market: 'Bikaner', district: 'Bikaner', state: 'Rajasthan', min_price: 6400, max_price: 7900, modal_price: 7150, variety: 'Local' },
  { commodity: 'Maize', market: 'Davangere', district: 'Davangere', state: 'Karnataka', min_price: 1950, max_price: 2550, modal_price: 2300, variety: 'Yellow' },
  { commodity: 'Maize', market: 'Chhindwara', district: 'Chhindwara', state: 'Madhya Pradesh', min_price: 1900, max_price: 2450, modal_price: 2250, variety: 'Hybrid' },
  { commodity: 'Sugarcane', market: 'Kolhapur', district: 'Kolhapur', state: 'Maharashtra', min_price: 350, max_price: 430, modal_price: 390, variety: 'Co 86032' },
  { commodity: 'Sugarcane', market: 'Muzaffarnagar', district: 'Muzaffarnagar', state: 'Uttar Pradesh', min_price: 340, max_price: 420, modal_price: 380, variety: 'Co 0238' },
];

/**
 * Normalizes an external Agmarknet or fallback record to standard format
 */
export function normalizeMandiRecord(item: any): MandiRecord {
  return {
    commodity: item.commodity || item.Commodity || 'Crop',
    market: item.market || item.Market || 'APMC Mandi',
    state: item.state || item.State || 'India',
    district: item.district || item.District,
    min_price: Number(item.min_price ?? item.Min_Price ?? 0),
    max_price: Number(item.max_price ?? item.Max_Price ?? 0),
    modal_price: Number(item.modal_price ?? item.Modal_Price ?? 0),
    variety: item.variety || item.Variety || 'Standard',
    arrival_date: item.arrival_date || item.Arrival_Date || new Date().toISOString().split('T')[0],
  };
}
