import { useMutation } from "@tanstack/react-query";
import { signIn, signOut } from "@/lib/auth";
import { useAuthContext } from "@/lib/auth-context";

export function useSession() {
  return useAuthContext();
}

export function useSignIn() {
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      signIn(email, password),
  });
}

export function useSignOut() {
  return useMutation({ mutationFn: signOut });
}
