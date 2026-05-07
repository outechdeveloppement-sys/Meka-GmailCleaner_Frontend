"use client";

import { auth, googleProvider } from "@/lib/firebase";
import { signInWithPopup, onAuthStateChanged } from "firebase/auth";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Mail, Shield, Sparkles, Trash2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import Lottie from "lottie-react";
import acc1Data from "../lottia-acc1.json";
import acc2Data from "../lottia-acc2.json";
import { getGoogleAuthUrl } from "@/lib/api";

export default function LandingPage() {
  const router = useRouter();
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push("/dashboard");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogin = async () => {
    try {
      const { url } = await getGoogleAuthUrl();
      window.location.href = url;
    } catch (error) {
      console.error("Erreur de connexion:", error);
    }
  };

  return (
    <div className="h-screen overflow-hidden relative flex flex-col">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-blue-600/10 blur-[120px] rounded-full -z-10" />
      
      <main className="flex-1 max-w-7xl mx-auto px-6 flex flex-col justify-between py-8">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Mail className="text-white" size={20} />
            </div>
            <span className="text-xl font-bold tracking-tighter">Meka GmailCleaner</span>
          </div>
          <button 
            onClick={handleLogin}
            className="px-5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs font-medium transition"
          >
            Se connecter
          </button>
        </nav>

        <div className="grid lg:grid-cols-2 gap-8 items-center flex-1">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight mb-4 leading-[1.1]">
              ta boîte mail <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">
                est saturée ?
              </span>
            </h1>
            <p className="text-lg text-gray-400 mb-8 max-w-md leading-relaxed">
              Salut papa, J'ai crée ce système pour t'aider à régler definitivement tes problèmes avec ton compte Gmail.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={handleLogin}
                className="group px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-600/30"
              >
                Commencer maintenant
                <ArrowRight className="group-hover:translate-x-1 transition" />
              </button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="hidden lg:block relative"
          >
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-3xl">
              <div className="space-y-3">
                {[
                  { icon: Shield, text: "Sécurisé par Google OAuth", color: "text-green-400" },
                  { icon: Trash2, text: "Suppression automatique ciblée", color: "text-red-400" },
                  { icon: Sparkles, text: "Suggestions IA personnalisées", color: "text-blue-400" }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                    <item.icon className={item.color} size={20} />
                    <span className="font-medium text-sm">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-purple-600/30 blur-3xl -z-10" />
          </motion.div>
        </div>

        {/* Lottie Animations Section - More compact */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="grid grid-cols-2 gap-4 flex-1 min-h-0"
        >
          <div className="flex items-center justify-center group">
            <div className="w-full max-w-[500px] group-hover:scale-105 transition-transform duration-700">
              <Lottie animationData={acc1Data} loop={true} />
            </div>
          </div>
          <div className="flex items-center justify-center group">
            <div className="w-full max-w-[500px] group-hover:scale-105 transition-transform duration-700">
              <Lottie animationData={acc2Data} loop={true} />
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
