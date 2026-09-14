import { prisma } from "@/lib/prisma";

import { UsersManager } from "./users-manager";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <UsersManager
      initialUsers={users.map((user) => ({
        ...user,
        createdAt: user.createdAt.toISOString(),
      }))}
    />
  );
}