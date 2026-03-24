import { auth } from "./better-auth";

type RequestPasswordResetInput = {
  email: string;
  redirectTo: string;
};

export const requestPasswordReset = async (
  input: RequestPasswordResetInput,
) => {
  await auth.api.requestPasswordReset({
    body: {
      email: input.email,
      redirectTo: input.redirectTo,
    },
  });
};
