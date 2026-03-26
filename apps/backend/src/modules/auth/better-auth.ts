import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { openAPI } from "better-auth/plugins";
import { prisma } from "../../lib/prisma";
import { env, trustedOrigins } from "../../config/env";
import { enqueueEmail } from "../../jobs/email/email.queue";

type EmailCallbackPayload = {
  user: { email?: string | null };
  url: string;
};

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins,

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

  emailVerification: {
    sendOnSignUp: true,
    async sendVerificationEmail({ user, url }: EmailCallbackPayload) {
      if (!user.email) {
        return;
      }

      const verificationUrl = new URL(url);
      verificationUrl.searchParams.set(
        "callbackURL",
        env.AUTH_VERIFY_EMAIL_CALLBACK_URL,
      );
      const verificationLink = verificationUrl.toString();

      await enqueueEmail({
        to: user.email,
        subject: "Verify your email",
        text: `Verify your email: ${verificationLink}`,
        html: `<p>Verify your email by clicking this link:</p><p><a href="${verificationLink}">${verificationLink}</a></p>`,
        meta: {
          template: "verify-email",
          source: "better-auth",
        },
      });
    },
  },

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    revokeSessionsOnPasswordReset: true,

    async sendResetPassword({ user, url }: EmailCallbackPayload) {
      if (!user.email) {
        return;
      }

      const resetUrl = new URL(url);
      resetUrl.searchParams.set(
        "callbackURL",
        env.AUTH_RESET_PASSWORD_CALLBACK_URL,
      );
      const resetLink = resetUrl.toString();

      await enqueueEmail({
        to: user.email,
        subject: "Reset your password",
        text: `Reset your password: ${resetLink}`,
        html: `<p>Reset your password using this link:</p><p><a href="${resetLink}">${resetLink}</a></p>`,
        meta: {
          template: "reset-password",
          source: "better-auth",
        },
      });
    },
  },

  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },

  plugins: [openAPI()],

  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          const role = await prisma.role.findFirst({
            where: { name: "customer" },
          });

          if (role) {
            await prisma.user.update({
              where: { id: BigInt(user.id) },
              data: {
                roleId: role.id,
              },
            });
          }
        },
      },
    },
  },
});
