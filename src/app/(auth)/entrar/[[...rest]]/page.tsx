import { SignIn } from "@clerk/nextjs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Entrar",
};

export default function PaginaEntrar() {
  return (
    <SignIn
      signUpUrl="/registrarse"
      fallbackRedirectUrl="/hoy"
      appearance={{ elements: { headerTitle: "font-serif!" } }}
    />
  );
}
