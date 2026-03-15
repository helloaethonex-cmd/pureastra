import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "../../lib/prisma";

export const auth = betterAuth({
    baseURL: process.env.BETTER_AUTH_URL,
    trustedOrigins: ["http://localhost:3000", "http://localhost:5000"],
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    advanced: {
        database: {
            generateId: "serial",
        },
    },

    account: {
        fields: {
            providerId: "provider",
            accountId: "providerAccountId",
        },
    },

    emailAndPassword: {
        enabled: true,
    },

    databaseHooks: {
        user: {
            create: {
                after: async (user) => {
                    const role = await prisma.role.findFirst({
                        where: { name: "customer" }
                    });

                    if (role) {
                        await prisma.user.update({
                            where: { id: BigInt(user.id) },
                            data: {
                                roleId: role.id
                            }
                        })
                    }
                }
            }
        }
    }
});
