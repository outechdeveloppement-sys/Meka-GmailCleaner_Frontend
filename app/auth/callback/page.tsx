"use client";

import { useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { auth } from "@/lib/firebase";
import { signInWithCustomToken } from "firebase/auth";
import { sendAuthCallback } from "@/lib/api";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");

  const hasCalled = useRef(false);

  useEffect(() => {
    async function handleAuth() {
      if (!code || hasCalled.current) return;
      hasCalled.current = true;
      
      try {
        console.log("DEBUG: Envoi du code au backend...");
        const response = await sendAuthCallback(code);
        
        if (response.firebase_token) {
          await signInWithCustomToken(auth, response.firebase_token);
          toast.success("Connecté avec succès !");
          router.push("/dashboard");
        } else {
          console.error("DEBUG: Réponse backend sans token:", response);
          throw new Error(response.detail || "Pas de token reçu");
        }
      } catch (error: any) {
        console.error("DEBUG: Erreur callback:", error);
        toast.error(error.message || "Erreur lors de la connexion");
        router.push("/");
      }
    }

    handleAuth();
  }, [code, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] text-white">
      <Loader2 className="animate-spin text-blue-500 mb-4" size={48} />
      <h1 className="text-xl font-bold">Liaison de votre compte Gmail...</h1>
      <p className="text-gray-400 mt-2">Vous allez être redirigé vers le tableau de bord.</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] text-white">
        <Loader2 className="animate-spin text-blue-500 mb-4" size={48} />
        <h1 className="text-xl font-bold">Chargement de l'authentification...</h1>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
