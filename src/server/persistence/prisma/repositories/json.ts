import { Prisma } from "@/generated/prisma/client";

export const toJson = (value: unknown) => value as Prisma.InputJsonValue;

