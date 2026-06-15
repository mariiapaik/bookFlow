import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Service } from './catalog/service.entity';
import { WorkingHours } from './availability/working-hours.entity';
import { Booking } from './bookings/booking.entity';
import { User, UserRole } from './auth/user.entity';

/**
 * Idempotent seed: owner + staff accounts, a service catalog, and Mon–Sat
 * working hours. Safe to run repeatedly.
 */
async function seed() {
  const ds = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    username: process.env.DB_USER ?? 'bookflow',
    password: process.env.DB_PASSWORD ?? 'bookflow',
    database: process.env.DB_NAME ?? 'bookflow',
    entities: [Service, WorkingHours, Booking, User],
    synchronize: true,
  });
  await ds.initialize();

  const users = ds.getRepository(User);
  const services = ds.getRepository(Service);
  const hours = ds.getRepository(WorkingHours);

  // --- Users ---
  const accounts = [
    { email: 'owner@bookflow.app', name: 'Salon Owner', role: UserRole.OWNER, password: 'owner123' },
    { email: 'staff@bookflow.app', name: 'Front Desk', role: UserRole.STAFF, password: 'staff123' },
  ];
  for (const a of accounts) {
    const exists = await users.findOne({ where: { email: a.email } });
    if (!exists) {
      await users.save(
        users.create({
          email: a.email,
          name: a.name,
          role: a.role,
          passwordHash: await bcrypt.hash(a.password, 10),
        }),
      );
      console.log(`Created user ${a.email} / ${a.password}`);
    }
  }

  // --- Service catalog ---
  const catalog = [
    { name: "Women's Haircut", description: 'Wash, cut & style', durationMinutes: 60, priceCents: 5500 },
    { name: "Men's Haircut", description: 'Classic cut & finish', durationMinutes: 30, priceCents: 3000 },
    { name: 'Hair Coloring', description: 'Full color, single process', durationMinutes: 120, priceCents: 12000 },
    { name: 'Manicure', description: 'Classic manicure', durationMinutes: 45, priceCents: 3500 },
    { name: 'Pedicure', description: 'Spa pedicure', durationMinutes: 60, priceCents: 4500 },
  ];
  for (const c of catalog) {
    const exists = await services.findOne({ where: { name: c.name } });
    if (!exists) {
      await services.save(services.create(c));
      console.log(`Created service ${c.name}`);
    }
  }

  // --- Working hours: Mon (1) .. Sat (6), 09:00–18:00, 30-min slots ---
  for (let dow = 1; dow <= 6; dow++) {
    const exists = await hours.findOne({ where: { dayOfWeek: dow } });
    if (!exists) {
      await hours.save(
        hours.create({
          dayOfWeek: dow,
          startTime: '09:00',
          endTime: dow === 6 ? '15:00' : '18:00',
          slotIntervalMinutes: 30,
          active: true,
        }),
      );
    }
  }
  console.log('Working hours seeded (Mon–Sat).');

  await ds.destroy();
  console.log('Seed complete.');
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
