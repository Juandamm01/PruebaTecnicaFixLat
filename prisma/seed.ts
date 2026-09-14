import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

const users = [
  {
    name: "Demo Admin",
    email: "admin@demo.com",
    password: "Demo1234",
    role: Role.ADMIN,
  },
  {
    name: "Demo User",
    email: "user@demo.com",
    password: "Demo1234",
    role: Role.USER,
  },
];

async function main() {
  for (const user of users) {
    const password = await bcrypt.hash(user.password, 10);

    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        password,
        role: user.role,
        active: true,
      },
      create: {
        name: user.name,
        email: user.email,
        password,
        role: user.role,
        active: true,
      },
    });
  }

  console.log("Usuarios sembrados: admin@demo.com, user@demo.com");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
