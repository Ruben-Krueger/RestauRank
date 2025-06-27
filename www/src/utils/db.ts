import { PrismaClient } from "../generated/prisma";
import { withAccelerate } from "@prisma/extension-accelerate";

let prisma: PrismaClient | null = null;

export function getDB(): PrismaClient {
  if (prisma) return prisma;
  // @ts-expect-error - Prisma extension types are not fully compatible
  prisma = new PrismaClient().$extends(withAccelerate());
  return prisma!;
}
