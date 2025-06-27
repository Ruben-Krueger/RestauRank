import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

let prisma: PrismaClient | null = null;

export function getDB(): PrismaClient {
  if (prisma) return prisma;
  prisma = new PrismaClient().$extends(withAccelerate());
  return prisma!;
}
