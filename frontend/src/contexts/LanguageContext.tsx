'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

// ─── Language Definitions ────────────────────────────────────────────────────
export interface Language {
  code: string;
  name: string;          // English name
  native: string;        // Native script name
  flag: string;          // emoji flag
  dir: 'ltr' | 'rtl';
}

export const LANGUAGES: Language[] = [
  { code: 'en',  name: 'English',    native: 'English',      flag: '🇬🇧', dir: 'ltr' },
  { code: 'hi',  name: 'Hindi',      native: 'हिंदी',          flag: '🇮🇳', dir: 'ltr' },
  { code: 'ta',  name: 'Tamil',      native: 'தமிழ்',          flag: '🇮🇳', dir: 'ltr' },
  { code: 'te',  name: 'Telugu',     native: 'తెలుగు',         flag: '🇮🇳', dir: 'ltr' },
  { code: 'kn',  name: 'Kannada',    native: 'ಕನ್ನಡ',          flag: '🇮🇳', dir: 'ltr' },
  { code: 'ml',  name: 'Malayalam',  native: 'മലയാളം',         flag: '🇮🇳', dir: 'ltr' },
  { code: 'bn',  name: 'Bengali',    native: 'বাংলা',          flag: '🇮🇳', dir: 'ltr' },
  { code: 'mr',  name: 'Marathi',    native: 'मराठी',          flag: '🇮🇳', dir: 'ltr' },
  { code: 'gu',  name: 'Gujarati',   native: 'ગુજરાતી',        flag: '🇮🇳', dir: 'ltr' },
  { code: 'pa',  name: 'Punjabi',    native: 'ਪੰਜਾਬੀ',         flag: '🇮🇳', dir: 'ltr' },
  { code: 'or',  name: 'Odia',       native: 'ଓଡ଼ିଆ',          flag: '🇮🇳', dir: 'ltr' },
  { code: 'ur',  name: 'Urdu',       native: 'اردو',           flag: '🇵🇰', dir: 'rtl' },
];

// ─── Translation Strings ─────────────────────────────────────────────────────
type TranslationKey =
  // Sidebar – Farmer
  | 'nav.dashboard'
  | 'nav.myListings'
  | 'nav.orders'
  | 'nav.earnings'
  | 'nav.aiAdvisory'
  | 'nav.mandiPrices'
  // Sidebar – Buyer
  | 'nav.marketplace'
  | 'nav.myOrders'
  | 'nav.aiAssistant'
  // Sidebar – Transporter
  | 'nav.availableJobs'
  | 'nav.activeTrip'
  // Sidebar – Admin
  | 'nav.analytics'
  | 'nav.usersKyc'
  | 'nav.listings'
  // Sidebar – Portal labels
  | 'portal.farmer'
  | 'portal.buyer'
  | 'portal.transporter'
  | 'portal.admin'
  // Sidebar – Bottom
  | 'sidebar.pendingVerification'
  | 'sidebar.signOut'
  | 'sidebar.language'
  // Common
  | 'common.loading'
  | 'common.save'
  | 'common.cancel'
  | 'common.submit'
  | 'common.search'
  | 'common.filter'
  | 'common.status'
  | 'common.price'
  | 'common.quantity'
  | 'common.date'
  | 'common.name'
  | 'common.phone'
  | 'common.address'
  | 'common.view'
  | 'common.edit'
  | 'common.delete'
  | 'common.confirm'
  | 'common.back'
  | 'common.next';

type Translations = Record<TranslationKey, string>;

const translations: Record<string, Translations> = {
  en: {
    'nav.dashboard': 'Dashboard',
    'nav.myListings': 'My Listings',
    'nav.orders': 'Orders',
    'nav.earnings': 'Earnings',
    'nav.aiAdvisory': 'AI Advisory',
    'nav.mandiPrices': 'Mandi Prices',
    'nav.marketplace': 'Marketplace',
    'nav.myOrders': 'My Orders',
    'nav.aiAssistant': 'AI Assistant',
    'nav.availableJobs': 'Available Jobs',
    'nav.activeTrip': 'Active Trip',
    'nav.analytics': 'Analytics',
    'nav.usersKyc': 'Users / KYC',
    'nav.listings': 'Listings',
    'portal.farmer': 'Farmer Portal',
    'portal.buyer': 'Buyer Portal',
    'portal.transporter': 'Transporter Portal',
    'portal.admin': 'Admin Panel',
    'sidebar.pendingVerification': 'Pending Verification',
    'sidebar.signOut': 'Sign Out',
    'sidebar.language': 'Language',
    'common.loading': 'Loading…',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.submit': 'Submit',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.status': 'Status',
    'common.price': 'Price',
    'common.quantity': 'Quantity',
    'common.date': 'Date',
    'common.name': 'Name',
    'common.phone': 'Phone',
    'common.address': 'Address',
    'common.view': 'View',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.confirm': 'Confirm',
    'common.back': 'Back',
    'common.next': 'Next',
  },
  hi: {
    'nav.dashboard': 'डैशबोर्ड',
    'nav.myListings': 'मेरी सूचियाँ',
    'nav.orders': 'ऑर्डर',
    'nav.earnings': 'कमाई',
    'nav.aiAdvisory': 'AI सलाह',
    'nav.mandiPrices': 'मंडी भाव',
    'nav.marketplace': 'बाज़ार',
    'nav.myOrders': 'मेरे ऑर्डर',
    'nav.aiAssistant': 'AI सहायक',
    'nav.availableJobs': 'उपलब्ध कार्य',
    'nav.activeTrip': 'सक्रिय यात्रा',
    'nav.analytics': 'विश्लेषण',
    'nav.usersKyc': 'उपयोगकर्ता / KYC',
    'nav.listings': 'सूचियाँ',
    'portal.farmer': 'किसान पोर्टल',
    'portal.buyer': 'खरीदार पोर्टल',
    'portal.transporter': 'ट्रांसपोर्टर पोर्टल',
    'portal.admin': 'एडमिन पैनल',
    'sidebar.pendingVerification': 'सत्यापन लंबित',
    'sidebar.signOut': 'साइन आउट',
    'sidebar.language': 'भाषा',
    'common.loading': 'लोड हो रहा है…',
    'common.save': 'सहेजें',
    'common.cancel': 'रद्द करें',
    'common.submit': 'जमा करें',
    'common.search': 'खोजें',
    'common.filter': 'फ़िल्टर',
    'common.status': 'स्थिति',
    'common.price': 'मूल्य',
    'common.quantity': 'मात्रा',
    'common.date': 'दिनांक',
    'common.name': 'नाम',
    'common.phone': 'फोन',
    'common.address': 'पता',
    'common.view': 'देखें',
    'common.edit': 'संपादित करें',
    'common.delete': 'हटाएं',
    'common.confirm': 'पुष्टि करें',
    'common.back': 'वापस',
    'common.next': 'अगला',
  },
  ta: {
    'nav.dashboard': 'டாஷ்போர்டு',
    'nav.myListings': 'என் பட்டியல்கள்',
    'nav.orders': 'ஆர்டர்கள்',
    'nav.earnings': 'வருமானம்',
    'nav.aiAdvisory': 'AI ஆலோசனை',
    'nav.mandiPrices': 'மண்டி விலைகள்',
    'nav.marketplace': 'சந்தை',
    'nav.myOrders': 'என் ஆர்டர்கள்',
    'nav.aiAssistant': 'AI உதவியாளர்',
    'nav.availableJobs': 'கிடைக்கும் வேலைகள்',
    'nav.activeTrip': 'செயலில் உள்ள பயணம்',
    'nav.analytics': 'பகுப்பாய்வு',
    'nav.usersKyc': 'பயனர்கள் / KYC',
    'nav.listings': 'பட்டியல்கள்',
    'portal.farmer': 'விவசாயி போர்டல்',
    'portal.buyer': 'வாங்குபவர் போர்டல்',
    'portal.transporter': 'போக்குவரத்து போர்டல்',
    'portal.admin': 'நிர்வாக குழு',
    'sidebar.pendingVerification': 'சரிபார்ப்பு நிலுவையில்',
    'sidebar.signOut': 'வெளியேறு',
    'sidebar.language': 'மொழி',
    'common.loading': 'ஏற்றுகிறது…',
    'common.save': 'சேமி',
    'common.cancel': 'ரத்து செய்',
    'common.submit': 'சமர்ப்பி',
    'common.search': 'தேடு',
    'common.filter': 'வடிகட்டி',
    'common.status': 'நிலை',
    'common.price': 'விலை',
    'common.quantity': 'அளவு',
    'common.date': 'தேதி',
    'common.name': 'பெயர்',
    'common.phone': 'தொலைபேசி',
    'common.address': 'முகவரி',
    'common.view': 'பார்',
    'common.edit': 'திருத்து',
    'common.delete': 'நீக்கு',
    'common.confirm': 'உறுதிப்படுத்து',
    'common.back': 'திரும்பு',
    'common.next': 'அடுத்தது',
  },
  te: {
    'nav.dashboard': 'డాష్‌బోర్డ్',
    'nav.myListings': 'నా జాబితాలు',
    'nav.orders': 'ఆర్డర్లు',
    'nav.earnings': 'ఆదాయం',
    'nav.aiAdvisory': 'AI సలహా',
    'nav.mandiPrices': 'మండి ధరలు',
    'nav.marketplace': 'మార్కెట్‌ప్లేస్',
    'nav.myOrders': 'నా ఆర్డర్లు',
    'nav.aiAssistant': 'AI సహాయకుడు',
    'nav.availableJobs': 'అందుబాటులో ఉన్న ఉద్యోగాలు',
    'nav.activeTrip': 'క్రియాశీల ప్రయాణం',
    'nav.analytics': 'విశ్లేషణలు',
    'nav.usersKyc': 'వినియోగదారులు / KYC',
    'nav.listings': 'జాబితాలు',
    'portal.farmer': 'రైతు పోర్టల్',
    'portal.buyer': 'కొనుగోలుదారు పోర్టల్',
    'portal.transporter': 'రవాణాదారు పోర్టల్',
    'portal.admin': 'అడ్మిన్ ప్యానెల్',
    'sidebar.pendingVerification': 'ధృవీకరణ పెండింగ్',
    'sidebar.signOut': 'సైన్ అవుట్',
    'sidebar.language': 'భాష',
    'common.loading': 'లోడ్ అవుతోంది…',
    'common.save': 'సేవ్ చేయి',
    'common.cancel': 'రద్దు చేయి',
    'common.submit': 'సమర్పించు',
    'common.search': 'వెతుకు',
    'common.filter': 'ఫిల్టర్',
    'common.status': 'స్థితి',
    'common.price': 'ధర',
    'common.quantity': 'పరిమాణం',
    'common.date': 'తేదీ',
    'common.name': 'పేరు',
    'common.phone': 'ఫోన్',
    'common.address': 'చిరునామా',
    'common.view': 'చూడు',
    'common.edit': 'సవరించు',
    'common.delete': 'తొలగించు',
    'common.confirm': 'నిర్ధారించు',
    'common.back': 'వెనుకకు',
    'common.next': 'తదుపరి',
  },
  kn: {
    'nav.dashboard': 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    'nav.myListings': 'ನನ್ನ ಪಟ್ಟಿಗಳು',
    'nav.orders': 'ಆರ್ಡರ್‌ಗಳು',
    'nav.earnings': 'ಆದಾಯ',
    'nav.aiAdvisory': 'AI ಸಲಹೆ',
    'nav.mandiPrices': 'ಮಂಡಿ ಬೆಲೆಗಳು',
    'nav.marketplace': 'ಮಾರುಕಟ್ಟೆ',
    'nav.myOrders': 'ನನ್ನ ಆರ್ಡರ್‌ಗಳು',
    'nav.aiAssistant': 'AI ಸಹಾಯಕ',
    'nav.availableJobs': 'ಲಭ್ಯ ಕೆಲಸಗಳು',
    'nav.activeTrip': 'ಸಕ್ರಿಯ ಪ್ರಯಾಣ',
    'nav.analytics': 'ವಿಶ್ಲೇಷಣೆ',
    'nav.usersKyc': 'ಬಳಕೆದಾರರು / KYC',
    'nav.listings': 'ಪಟ್ಟಿಗಳು',
    'portal.farmer': 'ರೈತ ಪೋರ್ಟಲ್',
    'portal.buyer': 'ಖರೀದಿದಾರ ಪೋರ್ಟಲ್',
    'portal.transporter': 'ಸಾರಿಗೆದಾರ ಪೋರ್ಟಲ್',
    'portal.admin': 'ಆಡಳಿತ ಫಲಕ',
    'sidebar.pendingVerification': 'ಪರಿಶೀಲನೆ ಬಾಕಿ',
    'sidebar.signOut': 'ಸೈನ್ ಔಟ್',
    'sidebar.language': 'ಭಾಷೆ',
    'common.loading': 'ಲೋಡ್ ಆಗುತ್ತಿದೆ…',
    'common.save': 'ಉಳಿಸಿ',
    'common.cancel': 'ರದ್ದುಮಾಡಿ',
    'common.submit': 'ಸಲ್ಲಿಸಿ',
    'common.search': 'ಹುಡುಕಿ',
    'common.filter': 'ಫಿಲ್ಟರ್',
    'common.status': 'ಸ್ಥಿತಿ',
    'common.price': 'ಬೆಲೆ',
    'common.quantity': 'ಪ್ರಮಾಣ',
    'common.date': 'ದಿನಾಂಕ',
    'common.name': 'ಹೆಸರು',
    'common.phone': 'ಫೋನ್',
    'common.address': 'ವಿಳಾಸ',
    'common.view': 'ವೀಕ್ಷಿಸಿ',
    'common.edit': 'ಸಂಪಾದಿಸಿ',
    'common.delete': 'ಅಳಿಸಿ',
    'common.confirm': 'ದೃಢಪಡಿಸಿ',
    'common.back': 'ಹಿಂದೆ',
    'common.next': 'ಮುಂದೆ',
  },
  ml: {
    'nav.dashboard': 'ഡാഷ്‌ബോർഡ്',
    'nav.myListings': 'എന്റെ ലിസ്റ്റിംഗുകൾ',
    'nav.orders': 'ഓർഡറുകൾ',
    'nav.earnings': 'വരുമാനം',
    'nav.aiAdvisory': 'AI ഉപദേശം',
    'nav.mandiPrices': 'മണ്ടി വിലകൾ',
    'nav.marketplace': 'മാർക്കറ്റ്‌പ്ലേസ്',
    'nav.myOrders': 'എന്റെ ഓർഡറുകൾ',
    'nav.aiAssistant': 'AI അസിസ്റ്റന്റ്',
    'nav.availableJobs': 'ലഭ്യമായ ജോലികൾ',
    'nav.activeTrip': 'സജീവ യാത്ര',
    'nav.analytics': 'അനലിറ്റിക്സ്',
    'nav.usersKyc': 'ഉപയോക്താക്കൾ / KYC',
    'nav.listings': 'ലിസ്റ്റിംഗുകൾ',
    'portal.farmer': 'കർഷക പോർട്ടൽ',
    'portal.buyer': 'വാങ്ങുന്നവർ പോർട്ടൽ',
    'portal.transporter': 'ഗതാഗത പോർട്ടൽ',
    'portal.admin': 'അഡ്മിൻ പാനൽ',
    'sidebar.pendingVerification': 'പരിശോധന തീർന്നിട്ടില്ല',
    'sidebar.signOut': 'സൈൻ ഔട്ട്',
    'sidebar.language': 'ഭാഷ',
    'common.loading': 'ലോഡ് ആകുന്നു…',
    'common.save': 'സേവ് ചെയ്യുക',
    'common.cancel': 'റദ്ദാക്കുക',
    'common.submit': 'സമർപ്പിക്കുക',
    'common.search': 'തിരയുക',
    'common.filter': 'ഫിൽട്ടർ',
    'common.status': 'സ്റ്റാറ്റസ്',
    'common.price': 'വില',
    'common.quantity': 'അളവ്',
    'common.date': 'തീയതി',
    'common.name': 'പേര്',
    'common.phone': 'ഫോൺ',
    'common.address': 'വിലാസം',
    'common.view': 'കാണുക',
    'common.edit': 'എഡിറ്റ് ചെയ്യുക',
    'common.delete': 'ഇല്ലാതാക്കുക',
    'common.confirm': 'സ്ഥിരീകരിക്കുക',
    'common.back': 'തിരിച്ചു',
    'common.next': 'അടുത്തത്',
  },
  bn: {
    'nav.dashboard': 'ড্যাশবোর্ড',
    'nav.myListings': 'আমার তালিকা',
    'nav.orders': 'অর্ডার',
    'nav.earnings': 'উপার্জন',
    'nav.aiAdvisory': 'AI পরামর্শ',
    'nav.mandiPrices': 'মান্ডি দাম',
    'nav.marketplace': 'বাজার',
    'nav.myOrders': 'আমার অর্ডার',
    'nav.aiAssistant': 'AI সহায়ক',
    'nav.availableJobs': 'উপলব্ধ কাজ',
    'nav.activeTrip': 'সক্রিয় ট্রিপ',
    'nav.analytics': 'বিশ্লেষণ',
    'nav.usersKyc': 'ব্যবহারকারী / KYC',
    'nav.listings': 'তালিকা',
    'portal.farmer': 'কৃষক পোর্টাল',
    'portal.buyer': 'ক্রেতা পোর্টাল',
    'portal.transporter': 'পরিবহনকারী পোর্টাল',
    'portal.admin': 'অ্যাডমিন প্যানেল',
    'sidebar.pendingVerification': 'যাচাই বাকি',
    'sidebar.signOut': 'সাইন আউট',
    'sidebar.language': 'ভাষা',
    'common.loading': 'লোড হচ্ছে…',
    'common.save': 'সংরক্ষণ',
    'common.cancel': 'বাতিল',
    'common.submit': 'জমা দিন',
    'common.search': 'অনুসন্ধান',
    'common.filter': 'ফিল্টার',
    'common.status': 'স্ট্যাটাস',
    'common.price': 'মূল্য',
    'common.quantity': 'পরিমাণ',
    'common.date': 'তারিখ',
    'common.name': 'নাম',
    'common.phone': 'ফোন',
    'common.address': 'ঠিকানা',
    'common.view': 'দেখুন',
    'common.edit': 'সম্পাদনা',
    'common.delete': 'মুছুন',
    'common.confirm': 'নিশ্চিত',
    'common.back': 'পিছনে',
    'common.next': 'পরবর্তী',
  },
  mr: {
    'nav.dashboard': 'डॅशबोर्ड',
    'nav.myListings': 'माझ्या याद्या',
    'nav.orders': 'ऑर्डर',
    'nav.earnings': 'कमाई',
    'nav.aiAdvisory': 'AI सल्ला',
    'nav.mandiPrices': 'मंडी भाव',
    'nav.marketplace': 'बाजारपेठ',
    'nav.myOrders': 'माझे ऑर्डर',
    'nav.aiAssistant': 'AI सहाय्यक',
    'nav.availableJobs': 'उपलब्ध नोकऱ्या',
    'nav.activeTrip': 'सक्रिय सफर',
    'nav.analytics': 'विश्लेषण',
    'nav.usersKyc': 'वापरकर्ते / KYC',
    'nav.listings': 'याद्या',
    'portal.farmer': 'शेतकरी पोर्टल',
    'portal.buyer': 'खरेदीदार पोर्टल',
    'portal.transporter': 'वाहतूकदार पोर्टल',
    'portal.admin': 'प्रशासन पॅनेल',
    'sidebar.pendingVerification': 'पडताळणी प्रलंबित',
    'sidebar.signOut': 'साइन आउट',
    'sidebar.language': 'भाषा',
    'common.loading': 'लोड होत आहे…',
    'common.save': 'जतन करा',
    'common.cancel': 'रद्द करा',
    'common.submit': 'सबमिट करा',
    'common.search': 'शोधा',
    'common.filter': 'फिल्टर',
    'common.status': 'स्थिती',
    'common.price': 'किंमत',
    'common.quantity': 'प्रमाण',
    'common.date': 'तारीख',
    'common.name': 'नाव',
    'common.phone': 'फोन',
    'common.address': 'पत्ता',
    'common.view': 'पहा',
    'common.edit': 'संपादित करा',
    'common.delete': 'हटवा',
    'common.confirm': 'पुष्टी करा',
    'common.back': 'मागे',
    'common.next': 'पुढे',
  },
  gu: {
    'nav.dashboard': 'ડેશબોર્ડ',
    'nav.myListings': 'મારી યાદી',
    'nav.orders': 'ઓર્ડર',
    'nav.earnings': 'કમાણી',
    'nav.aiAdvisory': 'AI સલાહ',
    'nav.mandiPrices': 'મંડી ભાવ',
    'nav.marketplace': 'બજાર',
    'nav.myOrders': 'મારા ઓર્ડર',
    'nav.aiAssistant': 'AI સહાયક',
    'nav.availableJobs': 'ઉપલબ્ધ કામ',
    'nav.activeTrip': 'સક્રિય સફર',
    'nav.analytics': 'વિશ્લેષણ',
    'nav.usersKyc': 'વપરાશકર્તા / KYC',
    'nav.listings': 'યાદી',
    'portal.farmer': 'ખેડૂત પોર્ટલ',
    'portal.buyer': 'ખરીદદાર પોર્ટલ',
    'portal.transporter': 'પરિવહનકર્તા પોર્ટલ',
    'portal.admin': 'એડમિન પેનલ',
    'sidebar.pendingVerification': 'ચકાસણી બાકી',
    'sidebar.signOut': 'સાઇન આઉટ',
    'sidebar.language': 'ભાષા',
    'common.loading': 'લોડ થઈ રહ્યું છે…',
    'common.save': 'સાચવો',
    'common.cancel': 'રદ કરો',
    'common.submit': 'સબમિટ કરો',
    'common.search': 'શોધો',
    'common.filter': 'ફિલ્ટર',
    'common.status': 'સ્થિતિ',
    'common.price': 'ભાવ',
    'common.quantity': 'જથ્થો',
    'common.date': 'તારીખ',
    'common.name': 'નામ',
    'common.phone': 'ફોન',
    'common.address': 'સરનામું',
    'common.view': 'જુઓ',
    'common.edit': 'સંપાદિત કરો',
    'common.delete': 'કાઢો',
    'common.confirm': 'પુષ્ટિ કરો',
    'common.back': 'પાછળ',
    'common.next': 'આગળ',
  },
  pa: {
    'nav.dashboard': 'ਡੈਸ਼ਬੋਰਡ',
    'nav.myListings': 'ਮੇਰੀਆਂ ਸੂਚੀਆਂ',
    'nav.orders': 'ਆਰਡਰ',
    'nav.earnings': 'ਕਮਾਈ',
    'nav.aiAdvisory': 'AI ਸਲਾਹ',
    'nav.mandiPrices': 'ਮੰਡੀ ਭਾਅ',
    'nav.marketplace': 'ਬਾਜ਼ਾਰ',
    'nav.myOrders': 'ਮੇਰੇ ਆਰਡਰ',
    'nav.aiAssistant': 'AI ਸਹਾਇਕ',
    'nav.availableJobs': 'ਉਪਲਬਧ ਕੰਮ',
    'nav.activeTrip': 'ਸਰਗਰਮ ਸਫ਼ਰ',
    'nav.analytics': 'ਵਿਸ਼ਲੇਸ਼ਣ',
    'nav.usersKyc': 'ਵਰਤੋਂਕਾਰ / KYC',
    'nav.listings': 'ਸੂਚੀਆਂ',
    'portal.farmer': 'ਕਿਸਾਨ ਪੋਰਟਲ',
    'portal.buyer': 'ਖਰੀਦਦਾਰ ਪੋਰਟਲ',
    'portal.transporter': 'ਟਰਾਂਸਪੋਰਟਰ ਪੋਰਟਲ',
    'portal.admin': 'ਐਡਮਿਨ ਪੈਨਲ',
    'sidebar.pendingVerification': 'ਤਸਦੀਕ ਬਾਕੀ',
    'sidebar.signOut': 'ਸਾਈਨ ਆਉਟ',
    'sidebar.language': 'ਭਾਸ਼ਾ',
    'common.loading': 'ਲੋਡ ਹੋ ਰਿਹਾ ਹੈ…',
    'common.save': 'ਸੁਰੱਖਿਅਤ ਕਰੋ',
    'common.cancel': 'ਰੱਦ ਕਰੋ',
    'common.submit': 'ਜਮ੍ਹਾਂ ਕਰੋ',
    'common.search': 'ਖੋਜੋ',
    'common.filter': 'ਫਿਲਟਰ',
    'common.status': 'ਸਥਿਤੀ',
    'common.price': 'ਕੀਮਤ',
    'common.quantity': 'ਮਾਤਰਾ',
    'common.date': 'ਤਾਰੀਖ',
    'common.name': 'ਨਾਮ',
    'common.phone': 'ਫ਼ੋਨ',
    'common.address': 'ਪਤਾ',
    'common.view': 'ਦੇਖੋ',
    'common.edit': 'ਸੰਪਾਦਿਤ ਕਰੋ',
    'common.delete': 'ਮਿਟਾਓ',
    'common.confirm': 'ਪੁਸ਼ਟੀ ਕਰੋ',
    'common.back': 'ਵਾਪਸ',
    'common.next': 'ਅਗਲਾ',
  },
  or: {
    'nav.dashboard': 'ଡ୍ୟାସ୍‌ବୋର୍ଡ',
    'nav.myListings': 'ମୋ ତାଲିକା',
    'nav.orders': 'ଅର୍ଡର',
    'nav.earnings': 'ଆୟ',
    'nav.aiAdvisory': 'AI ପରାମର୍ଶ',
    'nav.mandiPrices': 'ମଣ୍ଡି ମୂଲ୍ୟ',
    'nav.marketplace': 'ବଜାର',
    'nav.myOrders': 'ମୋ ଅର୍ଡର',
    'nav.aiAssistant': 'AI ସହାୟକ',
    'nav.availableJobs': 'ଉପଲବ୍ଧ କାର୍ଯ୍ୟ',
    'nav.activeTrip': 'ସକ୍ରିୟ ଯାତ୍ରା',
    'nav.analytics': 'ବିଶ୍ଳେଷଣ',
    'nav.usersKyc': 'ବ୍ୟବହାରକାରୀ / KYC',
    'nav.listings': 'ତାଲିକା',
    'portal.farmer': 'କୃଷକ ପୋର୍ଟାଲ',
    'portal.buyer': 'କ୍ରେତା ପୋର୍ଟାଲ',
    'portal.transporter': 'ପରିବହନ ପୋର୍ଟାଲ',
    'portal.admin': 'ଆଡ୍‌ମିନ ପ୍ୟାନେଲ',
    'sidebar.pendingVerification': 'ଯାଞ୍ଚ ବାକି',
    'sidebar.signOut': 'ସାଇନ ଆଉଟ',
    'sidebar.language': 'ଭାଷା',
    'common.loading': 'ଲୋଡ ହେଉଛି…',
    'common.save': 'ସଞ୍ଚୟ କରନ୍ତୁ',
    'common.cancel': 'ବାତିଲ',
    'common.submit': 'ଦାଖଲ',
    'common.search': 'ଖୋଜ',
    'common.filter': 'ଫିଲ୍ଟର',
    'common.status': 'ସ୍ଥିତି',
    'common.price': 'ମୂଲ୍ୟ',
    'common.quantity': 'ପରିମାଣ',
    'common.date': 'ତାରିଖ',
    'common.name': 'ନାମ',
    'common.phone': 'ଫୋନ',
    'common.address': 'ଠିକଣା',
    'common.view': 'ଦେଖନ୍ତୁ',
    'common.edit': 'ସମ୍ପାଦନ',
    'common.delete': 'ଡିଲିଟ',
    'common.confirm': 'ନିଶ୍ଚିତ',
    'common.back': 'ପଛକୁ',
    'common.next': 'ପରବର୍ତ୍ତୀ',
  },
  ur: {
    'nav.dashboard': 'ڈیش بورڈ',
    'nav.myListings': 'میری فہرستیں',
    'nav.orders': 'آرڈرز',
    'nav.earnings': 'آمدنی',
    'nav.aiAdvisory': 'AI مشاورت',
    'nav.mandiPrices': 'منڈی قیمتیں',
    'nav.marketplace': 'بازار',
    'nav.myOrders': 'میرے آرڈرز',
    'nav.aiAssistant': 'AI معاون',
    'nav.availableJobs': 'دستیاب کام',
    'nav.activeTrip': 'فعال سفر',
    'nav.analytics': 'تجزیات',
    'nav.usersKyc': 'صارفین / KYC',
    'nav.listings': 'فہرستیں',
    'portal.farmer': 'کسان پورٹل',
    'portal.buyer': 'خریدار پورٹل',
    'portal.transporter': 'ٹرانسپورٹر پورٹل',
    'portal.admin': 'ایڈمن پینل',
    'sidebar.pendingVerification': 'تصدیق زیر التواء',
    'sidebar.signOut': 'سائن آؤٹ',
    'sidebar.language': 'زبان',
    'common.loading': 'لوڈ ہو رہا ہے…',
    'common.save': 'محفوظ کریں',
    'common.cancel': 'منسوخ',
    'common.submit': 'جمع کریں',
    'common.search': 'تلاش کریں',
    'common.filter': 'فلٹر',
    'common.status': 'حیثیت',
    'common.price': 'قیمت',
    'common.quantity': 'مقدار',
    'common.date': 'تاریخ',
    'common.name': 'نام',
    'common.phone': 'فون',
    'common.address': 'پتہ',
    'common.view': 'دیکھیں',
    'common.edit': 'ترمیم',
    'common.delete': 'حذف',
    'common.confirm': 'تصدیق',
    'common.back': 'واپس',
    'common.next': 'اگلا',
  },
};

// Fallback for missing keys — use English
function getTranslation(lang: string, key: TranslationKey): string {
  return translations[lang]?.[key] ?? translations['en'][key] ?? key;
}

// ─── Context ─────────────────────────────────────────────────────────────────
interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const DEFAULT_LANG = LANGUAGES[0]; // English

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('agrinova_lang');
      if (stored) {
        const found = LANGUAGES.find(l => l.code === stored);
        if (found) return found;
      }
    }
    return DEFAULT_LANG;
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('agrinova_lang', lang.code);
      // Update HTML dir attribute for RTL support (Urdu)
      document.documentElement.setAttribute('dir', lang.dir);
      document.documentElement.setAttribute('lang', lang.code);
    }
  };

  useEffect(() => {
    // Apply direction/lang on mount
    if (typeof window !== 'undefined') {
      document.documentElement.setAttribute('dir', language.dir);
      document.documentElement.setAttribute('lang', language.code);
    }
  }, [language]);

  const t = (key: TranslationKey) => getTranslation(language.code, key);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
};
