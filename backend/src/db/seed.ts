import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding AgriNova database...');

  // Clean existing data
  await prisma.chatLog.deleteMany();
  await prisma.review.deleteMany();
  await prisma.transportJob.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cropListing.deleteMany();
  await prisma.farmerProfile.deleteMany();
  await prisma.transporterProfile.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  const hash = (p: string) => bcrypt.hash(p, 10);

  // ── Farmers ──────────────────────────────────────────────────────
  const farmer1 = await prisma.user.create({
    data: {
      name: 'Rajesh Kumar',
      email: 'rajesh@agrinova.test',
      phone: '9876543210',
      passwordHash: await hash('password123'),
      role: 'farmer',
      address: 'Nashik, Maharashtra',
      latitude: 20.0059,
      longitude: 73.7897,
      isVerified: true,
      farmerProfile: { create: { farmSizeAcres: 5.5, upiId: 'rajesh@upi' } },
    },
  });

  const farmer2 = await prisma.user.create({
    data: {
      name: 'Priya Devi',
      email: 'priya@agrinova.test',
      phone: '9876543211',
      passwordHash: await hash('password123'),
      role: 'farmer',
      address: 'Koyambedu, Chennai, Tamil Nadu',
      latitude: 13.0750,
      longitude: 80.1766,
      isVerified: true,
      farmerProfile: { create: { farmSizeAcres: 3.2, upiId: 'priya@upi' } },
    },
  });

  const farmer3 = await prisma.user.create({
    data: {
      name: 'Suresh Patel',
      email: 'suresh@agrinova.test',
      phone: '9876543212',
      passwordHash: await hash('password123'),
      role: 'farmer',
      address: 'Anand, Gujarat',
      latitude: 22.5645,
      longitude: 72.9289,
      isVerified: true,
      farmerProfile: { create: { farmSizeAcres: 8.0 } },
    },
  });

  // ── Buyers ───────────────────────────────────────────────────────
  const buyer1 = await prisma.user.create({
    data: {
      name: 'FreshMart Retail Pvt Ltd',
      email: 'procurement@freshmart.test',
      phone: '9123456780',
      passwordHash: await hash('password123'),
      role: 'buyer',
      address: 'Bengaluru, Karnataka',
      latitude: 12.9716,
      longitude: 77.5946,
      isVerified: true,
    },
  });

  const buyer2 = await prisma.user.create({
    data: {
      name: 'Ananya Sharma',
      email: 'ananya@agrinova.test',
      phone: '9123456781',
      passwordHash: await hash('password123'),
      role: 'buyer',
      address: 'Pune, Maharashtra',
      latitude: 18.5204,
      longitude: 73.8567,
      isVerified: true,
    },
  });

  // ── Transporters ──────────────────────────────────────────────────
  const transporter1 = await prisma.user.create({
    data: {
      name: 'Mohammed Asif',
      email: 'asif@agrinova.test',
      phone: '9345678901',
      passwordHash: await hash('password123'),
      role: 'transporter',
      address: 'Pune, Maharashtra',
      latitude: 18.5204,
      longitude: 73.8567,
      isVerified: true,
      transporterProfile: {
        create: {
          vehicleType: 'Mini Truck',
          vehicleCapacityKg: 3000,
          licenseNumber: 'MH12AB1234',
          vehicleNumber: 'MH12-AB-1234',
          isAvailable: true,
          currentLatitude: 18.5204,
          currentLongitude: 73.8567,
        },
      },
    },
  });

  // ── Admin ─────────────────────────────────────────────────────────
  await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@agrinova.test',
      phone: '9000000001',
      passwordHash: await hash('admin123'),
      role: 'admin',
      isVerified: true,
    },
  });

  // ── Crop Listings ─────────────────────────────────────────────────
  const listing1 = await prisma.cropListing.create({
    data: {
      farmerId: farmer1.id,
      cropName: 'Onion',
      qualityGrade: 'A',
      quantityKg: 2000,
      pricePerKg: 18.5,
      harvestDate: new Date('2026-08-15'),
      description: 'Fresh red onions, medium size, excellent shelf life. Ready for immediate dispatch.',
      images: ['/crops/onion.jpg'],
      latitude: 20.0059,
      longitude: 73.7897,
    },
  });

  const listing2 = await prisma.cropListing.create({
    data: {
      farmerId: farmer2.id,
      cropName: 'Tomato',
      qualityGrade: 'A',
      quantityKg: 500,
      pricePerKg: 22.0,
      harvestDate: new Date('2026-08-18'),
      description: 'Vine-ripened tomatoes, bright red, high lycopene content. Perfect for retail.',
      images: ['/crops/tomato.jpg'],
      latitude: 13.0750,
      longitude: 80.1766,
    },
  });

  const listing3 = await prisma.cropListing.create({
    data: {
      farmerId: farmer3.id,
      cropName: 'Potato',
      qualityGrade: 'B',
      quantityKg: 5000,
      pricePerKg: 12.0,
      harvestDate: new Date('2026-08-10'),
      description: 'Gujarat potatoes, medium-large size. Ideal for processing and retail.',
      images: ['/crops/potato.jpg'],
      latitude: 22.5645,
      longitude: 72.9289,
    },
  });

  await prisma.cropListing.create({
    data: {
      farmerId: farmer1.id,
      cropName: 'Green Chilli',
      qualityGrade: 'A',
      quantityKg: 300,
      pricePerKg: 45.0,
      harvestDate: new Date('2026-08-20'),
      description: 'Hot green chillies, freshly harvested. High Scoville rating.',
      images: ['/crops/chilli.jpg'],
      latitude: 20.0059,
      longitude: 73.7897,
    },
  });

  await prisma.cropListing.create({
    data: {
      farmerId: farmer2.id,
      cropName: 'Rice',
      qualityGrade: 'A',
      quantityKg: 10000,
      pricePerKg: 42.0,
      harvestDate: new Date('2026-07-30'),
      description: 'Ponni raw rice from Tamil Nadu. Premium quality, low broken percentage.',
      images: ['/crops/rice.jpg'],
      latitude: 13.0750,
      longitude: 80.1766,
    },
  });

  // ── Orders ────────────────────────────────────────────────────────
  const order1 = await prisma.order.create({
    data: {
      buyerId: buyer1.id,
      listingId: listing1.id,
      quantityKg: 500,
      totalPrice: 500 * 18.5,
      status: 'confirmed',
      paymentStatus: 'escrowed',
      deliveryAddress: '45 MG Road, Bengaluru, Karnataka',
      deliveryLat: 12.9716,
      deliveryLng: 77.5946,
    },
  });

  const order2 = await prisma.order.create({
    data: {
      buyerId: buyer2.id,
      listingId: listing2.id,
      quantityKg: 100,
      totalPrice: 100 * 22.0,
      status: 'delivered',
      paymentStatus: 'paid',
      deliveryAddress: 'FC Road, Pune, Maharashtra',
      deliveryLat: 18.5204,
      deliveryLng: 73.8567,
    },
  });

  // ── Transport Jobs ────────────────────────────────────────────────
  await prisma.transportJob.create({
    data: {
      orderId: order1.id,
      transporterId: transporter1.id,
      status: 'assigned',
      pickupLat: farmer1.latitude,
      pickupLng: farmer1.longitude,
      pickupAddress: farmer1.address,
      dropLat: buyer1.latitude,
      dropLng: buyer1.longitude,
      dropAddress: order1.deliveryAddress,
      earningAmount: order1.totalPrice * 0.05,
      otpCode: '847291',
    },
  });

  await prisma.transportJob.create({
    data: {
      orderId: order2.id,
      transporterId: transporter1.id,
      status: 'delivered',
      pickupLat: farmer2.latitude,
      pickupLng: farmer2.longitude,
      pickupAddress: farmer2.address,
      dropLat: buyer2.latitude,
      dropLng: buyer2.longitude,
      dropAddress: order2.deliveryAddress,
      earningAmount: order2.totalPrice * 0.05,
      deliveredAt: new Date(),
    },
  });

  // ── Reviews ───────────────────────────────────────────────────────
  await prisma.review.create({
    data: {
      orderId: order2.id,
      reviewerId: buyer2.id,
      revieweeId: farmer2.id,
      rating: 5,
      comment: 'Excellent quality tomatoes! Very fresh and packed well. Will order again.',
    },
  });

  console.log('✅ Seed complete!');
  console.log('\n📋 Test Accounts (password: password123):');
  console.log('  🌾 Farmer: rajesh@agrinova.test');
  console.log('  🌾 Farmer: priya@agrinova.test');
  console.log('  🛒 Buyer: procurement@freshmart.test');
  console.log('  🚛 Transporter: asif@agrinova.test');
  console.log('  👨‍💼 Admin: admin@agrinova.test (password: admin123)');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
