import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function cleanDatabase() {
  console.log('🧹 Cleaning all mock and demo data from AgriNova database...');

  try {
    // 1. Delete all transactional, relational, and demo records
    await prisma.chatLog.deleteMany();
    await prisma.review.deleteMany();
    await prisma.transportJob.deleteMany();
    await prisma.order.deleteMany();
    await prisma.cropListing.deleteMany();
    await prisma.farmerProfile.deleteMany();
    await prisma.transporterProfile.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();

    console.log('✨ All mock users, listings, orders, and jobs deleted.');

    // 2. Create the default master Administrator account
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.create({
      data: {
        name: 'AgriNova Master Admin',
        email: 'admin@agrinova.com',
        phone: '9876500000',
        passwordHash: adminPasswordHash,
        role: 'admin',
        isVerified: true,
        address: 'AgriNova Operations HQ, India',
      },
    });

    console.log('✅ Clean database setup complete!');
    console.log(`\n🛡️ Admin Account Ready:`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Password: admin123`);
    console.log(`\n🌾 Marketplace is now fresh and ready for real registrations!`);
  } catch (error) {
    console.error('❌ Failed to clean database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

cleanDatabase();
