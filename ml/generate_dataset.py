"""
AgriNova ML Dataset Generator
Generates realistic Indian agricultural market datasets:
1. market_transactions.csv: crop prices, grades, quantities, seasons, mandi baseline, buyer demand
2. freight_pricing.csv: transport jobs, distance, weight, perishability, terrain, transport fair rate
"""

import os
import random
import csv
import math

SEED = 42
random.seed(SEED)

DATA_DIR = os.path.dirname(os.path.abspath(__file__))
os.makedirs(DATA_DIR, exist_ok=True)

# 15 key Indian agricultural crops with base price (₹/kg) and perishability score (0 to 1)
CROPS = {
    'Tomato': {'base_price': 24.0, 'perishability': 0.85, 'peak_months': [11, 12, 1, 2], 'volatility': 0.28},
    'Onion': {'base_price': 28.0, 'perishability': 0.30, 'peak_months': [1, 2, 3, 10], 'volatility': 0.22},
    'Potato': {'base_price': 20.0, 'perishability': 0.20, 'peak_months': [1, 2, 3], 'volatility': 0.15},
    'Rice': {'base_price': 48.0, 'perishability': 0.05, 'peak_months': [10, 11, 12], 'volatility': 0.10},
    'Wheat': {'base_price': 30.0, 'perishability': 0.05, 'peak_months': [3, 4, 5], 'volatility': 0.10},
    'Green Chilli': {'base_price': 55.0, 'perishability': 0.70, 'peak_months': [6, 7, 8], 'volatility': 0.25},
    'Brinjal': {'base_price': 22.0, 'perishability': 0.75, 'peak_months': [9, 10, 11], 'volatility': 0.20},
    'Carrot': {'base_price': 34.0, 'perishability': 0.50, 'peak_months': [12, 1, 2], 'volatility': 0.18},
    'Cauliflower': {'base_price': 26.0, 'perishability': 0.80, 'peak_months': [11, 12, 1], 'volatility': 0.24},
    'Cabbage': {'base_price': 18.0, 'perishability': 0.60, 'peak_months': [12, 1, 2], 'volatility': 0.20},
    'Soybean': {'base_price': 46.0, 'perishability': 0.10, 'peak_months': [10, 11], 'volatility': 0.12},
    'Groundnut': {'base_price': 72.0, 'perishability': 0.10, 'peak_months': [10, 11, 12], 'volatility': 0.14},
    'Sugarcane': {'base_price': 4.5, 'perishability': 0.40, 'peak_months': [12, 1, 2, 3], 'volatility': 0.08},
    'Cotton': {'base_price': 70.0, 'perishability': 0.05, 'peak_months': [10, 11, 12, 1], 'volatility': 0.15},
    'Maize': {'base_price': 23.0, 'perishability': 0.10, 'peak_months': [9, 10], 'volatility': 0.12}
}

GRADES = {'A': 1.15, 'B': 1.0, 'C': 0.85}

REGIONS = [
    {'name': 'Nashik, Maharashtra', 'price_mult': 0.96, 'density': 1.1},
    {'name': 'Koyambedu, Chennai, Tamil Nadu', 'price_mult': 1.05, 'density': 1.2},
    {'name': 'Anand, Gujarat', 'price_mult': 0.98, 'density': 0.95},
    {'name': 'Bengaluru, Karnataka', 'price_mult': 1.08, 'density': 1.3},
    {'name': 'Pune, Maharashtra', 'price_mult': 1.02, 'density': 1.15},
    {'name': 'Ludhiana, Punjab', 'price_mult': 0.95, 'density': 0.9},
    {'name': 'Guntur, Andhra Pradesh', 'price_mult': 0.97, 'density': 1.0},
    {'name': 'Indore, Madhya Pradesh', 'price_mult': 0.94, 'density': 0.9}
]

def generate_market_data(num_samples=2500):
    rows = []
    for _ in range(num_samples):
        crop_name = random.choice(list(CROPS.keys()))
        crop_info = CROPS[crop_name]
        grade = random.choice(['A', 'B', 'C'])
        grade_mult = GRADES[grade]
        region = random.choice(REGIONS)
        month = random.randint(1, 12)
        quantity_kg = round(random.uniform(50, 4000), 1)

        # Seasonality effect: during peak harvest, price dips by 10-20% due to surplus
        is_peak = month in crop_info['peak_months']
        season_mult = 0.88 if is_peak else 1.08

        # Bulk quantity discount: large volume orders get 3-8% discount
        bulk_discount = 1.0 - (0.07 * min(1.0, quantity_kg / 3000.0))

        # Buyer demand index (1.0 to 1.5)
        demand_index = round(random.uniform(0.9, 1.4), 2)
        demand_mult = 1.0 + (demand_index - 1.0) * 0.25

        # Calculate fair market price
        base = crop_info['base_price']
        noise = random.gauss(1.0, crop_info['volatility'] * 0.5)
        fair_price_kg = base * grade_mult * season_mult * bulk_discount * region['price_mult'] * demand_mult * noise
        fair_price_kg = round(max(2.0, fair_price_kg), 2)

        # Historical buyer clearing price vs listed price
        # Listings might be priced slightly higher or lower
        listing_price_kg = round(fair_price_kg * random.uniform(0.85, 1.25), 2)
        is_sold = 1 if listing_price_kg <= fair_price_kg * 1.05 else 0
        days_to_sell = max(1, int(round((listing_price_kg / fair_price_kg) ** 2 * random.uniform(2, 8)))) if is_sold else 25

        rows.append({
            'crop_name': crop_name,
            'grade': grade,
            'quantity_kg': quantity_kg,
            'month': month,
            'region': region['name'],
            'base_price': base,
            'perishability': crop_info['perishability'],
            'demand_index': demand_index,
            'fair_price_kg': fair_price_kg,
            'listing_price_kg': listing_price_kg,
            'is_sold': is_sold,
            'days_to_sell': days_to_sell
        })

    filepath = os.path.join(DATA_DIR, 'market_transactions.csv')
    with open(filepath, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=rows[0].keys())
        writer.writeheader()
        writer.writerows(rows)
    print(f"Generated {num_samples} market transaction records -> {filepath}")

def generate_freight_data(num_samples=1800):
    rows = []
    for _ in range(num_samples):
        distance_km = round(random.uniform(10, 650), 1)
        cargo_weight_kg = round(random.uniform(100, 7000), 0)
        crop_name = random.choice(list(CROPS.keys()))
        perishability = CROPS[crop_name]['perishability']
        vehicle_type = 'Pickup' if cargo_weight_kg <= 1200 else ('Mini Truck' if cargo_weight_kg <= 3500 else 'Heavy Truck')

        # Base pricing formula:
        # Base charge: ₹300
        # Distance charge: ₹14/km for Pickup, ₹17/km for Mini Truck, ₹22/km for Heavy Truck
        km_rate = 14.0 if vehicle_type == 'Pickup' else (17.0 if vehicle_type == 'Mini Truck' else 22.0)
        
        # Perishability handling surcharge (up to 20%)
        perishability_fee = perishability * (distance_km * 1.8)
        
        # Weight factor: ₹0.80 per 100kg per 100km
        weight_fee = (cargo_weight_kg / 100.0) * (distance_km / 100.0) * 8.0

        base_fare = 300.0
        fuel_surge = random.uniform(0.96, 1.05)
        
        fair_freight = (base_fare + (distance_km * km_rate) + perishability_fee + weight_fee) * fuel_surge
        fair_freight = round(fair_freight, 0)

        # Breakdown components for transparent UI
        base_component = round(base_fare, 0)
        distance_component = round(distance_km * km_rate, 0)
        weight_component = round(weight_fee, 0)
        perishability_component = round(perishability_fee, 0)

        rows.append({
            'distance_km': distance_km,
            'cargo_weight_kg': cargo_weight_kg,
            'crop_name': crop_name,
            'perishability': perishability,
            'vehicle_type': vehicle_type,
            'base_component': base_component,
            'distance_component': distance_component,
            'weight_component': weight_component,
            'perishability_component': perishability_component,
            'fair_freight': fair_freight
        })

    filepath = os.path.join(DATA_DIR, 'freight_pricing.csv')
    with open(filepath, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=rows[0].keys())
        writer.writeheader()
        writer.writerows(rows)
    print(f"Generated {num_samples} freight pricing records -> {filepath}")

if __name__ == '__main__':
    generate_market_data()
    generate_freight_data()
