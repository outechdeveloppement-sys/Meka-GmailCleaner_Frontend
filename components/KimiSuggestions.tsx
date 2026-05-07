"use client";

import { Cpu, Check, X, Loader2, Sparkles } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import toast from "react-hot-toast";

interface Suggestion {
  name: string;
  description: string;
  conditions: any;
}

import { motion, AnimatePresence } from "framer-motion";

export default function KimiSuggestions({ 
  suggestions, 
  loading, 
  onIgnore 
}: { 
  suggestions: Suggestion[], 
  loading: boolean,
  onIgnore: (index: number) => void
}) {
  const acceptSuggestion = async (suggestion: Suggestion, index: number) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      await addDoc(collection(db, "users", user.uid, "rules"), {
        ...suggestion,
        isSuggestion: true,
        enabled: true,
        createdAt: serverTimestamp(),
        emailsDeleted: 0,
        lastRun: null
      });

      toast.success(`${suggestion.name} ajoutée !`);
      onIgnore(index); // Supprimer de la liste locale
    } catch (e) {
      toast.error("Erreur");
    }
  };

  const acceptAll = async () => {
    const user = auth.currentUser;
    if (!user) return;
    
    const promise = Promise.all(suggestions.map(s => 
      addDoc(collection(db, "users", user.uid, "rules"), {
        ...s,
        isSuggestion: true,
        enabled: true,
        createdAt: serverTimestamp(),
        emailsDeleted: 0,
        lastRun: null
      })
    ));

    toast.promise(promise, {
      loading: 'Ajout de toutes les règles...',
      success: 'Toutes les suggestions ont été acceptées !',
      error: 'Erreur lors de l\'ajout',
    });

    await promise;
    // On vide tout d'un coup en appelant onIgnore pour chaque index ou simplement en vidant la liste via le parent si possible
    // Mais ici on suit la logique existante : on va appeler onIgnore de manière répétée ou rafraîchir.
    // Pour simplifier, on suggère au parent de vider la liste.
    suggestions.forEach((_, i) => onIgnore(0)); // On retire le premier N fois
  };

  if (loading || suggestions.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <Cpu className="text-white/50" size={20} />
          <h3 className="text-lg font-bold text-white">Suggestions de Meka ({suggestions.length})</h3>
        </div>
        {suggestions.length > 2 && (
          <button 
            onClick={acceptAll}
            className="text-xs font-bold text-blue-400 hover:text-blue-300 transition flex items-center gap-1 bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-500/20"
          >
            <Check size={14} /> Tout accepter
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {suggestions.map((s, i) => (
            <motion.div 
              key={s.name + i} 
              layout
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ 
                opacity: 0, 
                x: 100, 
                scale: 0.9, 
                filter: "blur(10px)",
                transition: { duration: 0.3, ease: "easeIn" }
              }}
              className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/30 p-5 rounded-2xl relative overflow-hidden group shadow-lg flex flex-col justify-between"
            >
              <div>
                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition">
                  <Sparkles size={40} />
                </div>
                <div className="inline-block px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-[10px] font-bold uppercase tracking-wider mb-2">
                  IA recommande
                </div>
                <h4 className="font-bold text-white mb-1 leading-tight">{s.name}</h4>
                <p className="text-xs text-gray-300 mb-4 line-clamp-2 hover:line-clamp-none transition-all">{s.description}</p>
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => acceptSuggestion(s, i)}
                  className="flex-1 bg-white text-blue-900 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-2 hover:bg-blue-50 transition active:scale-95"
                >
                  <Check size={14} /> Accepter
                </button>
                <button 
                  onClick={() => onIgnore(i)}
                  className="p-2 border border-white/20 text-white hover:bg-white/10 rounded-xl transition active:scale-90"
                >
                  <X size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
