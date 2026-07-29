import { SignUp } from "@clerk/nextjs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Crear cuenta",
};

export default function PaginaRegistrarse() {
  return (
    <SignUp
      signInUrl="/entrar"
      fallbackRedirectUrl="/hoy"
      appearance={{ elements: { headerTitle: "font-serif!" } }}
    />
  );
}
