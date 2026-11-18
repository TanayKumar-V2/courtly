import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import argon2 from 'argon2';
import { PrismaClient, Role, UserStatus } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const DEFAULT_AMENITIES = [
  { name: 'Parking', slug: 'parking', category: 'FACILITY', icon: 'car' },
  { name: 'Changing rooms', slug: 'changing-rooms', category: 'COMFORT', icon: 'door-open' },
  { name: 'Showers', slug: 'showers', category: 'COMFORT', icon: 'droplets' },
  { name: 'Washrooms', slug: 'washrooms', category: 'COMFORT', icon: 'bath' },
  { name: 'Drinking water', slug: 'drinking-water', category: 'FOOD_AND_DRINK', icon: 'glass-water' },
  { name: 'Equipment rental', slug: 'equipment-rental', category: 'FACILITY', icon: 'dumbbell' },
  { name: 'Floodlights', slug: 'floodlights', category: 'FACILITY', icon: 'sun' },
  { name: 'Seating area', slug: 'seating-area', category: 'COMFORT', icon: 'armchair' },
  { name: 'First aid', slug: 'first-aid', category: 'SAFETY', icon: 'heart-pulse' },
  { name: 'Cafeteria', slug: 'cafeteria', category: 'FOOD_AND_DRINK', icon: 'coffee' },
  { name: 'Wi-Fi', slug: 'wi-fi', category: 'CONNECTIVITY', icon: 'wifi' },
  { name: 'Air conditioning', slug: 'air-conditioning', category: 'COMFORT', icon: 'wind' },
];

async function main() {
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL or DIRECT_URL is required to run database seed');
  }

  neonConfig.webSocketConstructor = ws;
  const adapter = new PrismaNeon({ connectionString });
  const prisma = new PrismaClient({
    adapter,
    transactionOptions: { maxWait: 15000, timeout: 30000 },
  });

  try {
    console.log('Seeding predefined Courtly amenity catalogue...');
    for (const amenity of DEFAULT_AMENITIES) {
      await prisma.amenity.upsert({
        where: { slug: amenity.slug },
        create: {
          name: amenity.name,
          slug: amenity.slug,
          category: amenity.category,
          icon: amenity.icon,
          isActive: true,
        },
        update: {
          name: amenity.name,
          category: amenity.category,
          icon: amenity.icon,
          isActive: true,
        },
      });
    }
    console.log(`Seeded ${DEFAULT_AMENITIES.length} amenities successfully.`);

    // Protected Administrator Bootstrap via preconfigured environment variables only
    const adminEmail = process.env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase();
    const adminPassword = process.env.ADMIN_BOOTSTRAP_PASSWORD;
    const adminName = process.env.ADMIN_BOOTSTRAP_NAME?.trim() || 'Courtly Admin';

    if (adminEmail && adminPassword) {
      if (adminPassword.length < 12) {
        throw new Error('ADMIN_BOOTSTRAP_PASSWORD must be at least 12 characters long');
      }

      const existingAdmin = await prisma.user.findUnique({
        where: { email: adminEmail },
        include: { roles: true },
      });

      if (existingAdmin) {
        const hasAdminRole = existingAdmin.roles.some((r) => r.role === Role.ADMIN);
        if (!hasAdminRole) {
          await prisma.userRole.create({
            data: { userId: existingAdmin.id, role: Role.ADMIN },
          });
          console.log(`Granted ADMIN role to existing bootstrapped account: ${adminEmail}`);
        } else {
          console.log(`Bootstrapped ADMIN account already exists: ${adminEmail}`);
        }
      } else {
        const passwordHash = await argon2.hash(adminPassword, {
          type: argon2.argon2id,
          memoryCost: 19456,
          timeCost: 2,
          parallelism: 1,
        });

        await prisma.user.create({
          data: {
            email: adminEmail,
            fullName: adminName,
            passwordHash,
            status: UserStatus.ACTIVE,
            emailVerifiedAt: new Date(),
            roles: {
              create: [{ role: Role.PLAYER }, { role: Role.ADMIN }],
            },
            profile: {
              create: {
                preferredSports: [],
              },
            },
          },
        });
        console.log(`Created bootstrapped ADMIN account: ${adminEmail}`);
      }
    } else {
      console.log(
        'ADMIN_BOOTSTRAP_EMAIL / ADMIN_BOOTSTRAP_PASSWORD not set — skipping admin bootstrap.',
      );
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('Database seed failed:', err);
  process.exit(1);
});
