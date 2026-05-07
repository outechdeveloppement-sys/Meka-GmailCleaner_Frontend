"use client";

import { useState } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { 
  Clock, 
  Tag, 
  Mail, 
  Trash2, 
  AlertCircle, 
  ShieldCheck, 
  Layers, 
  ShoppingCart, 
  MessageSquare, 
  Inbox,
  FileSearch,
  FileBox,
  ChevronRight,
  Settings2,
  X,
  Save,
  Info,
  Cpu
} from "lucide-react";
import toast from "react-hot-toast";

const icons: Record<string, any> = {
  r1: Clock,
  r2: Tag,
  r3: Mail,
  r4: Trash2,
  r5: FileBox,
  r6: AlertCircle,
  r7: Layers,
  r8: ShoppingCart,
  r9: MessageSquare,
  r10: Inbox,
  r11: FileSearch,
  r12: ShieldCheck
};

export default function RuleCard({ rule }: { rule: any }) {
  const Icon = icons[rule.id] || Mail;
  const [showModal, setShowModal] = useState(false);
  const [val, setVal] = useState(rule.config?.value || "");

  const toggleRule = async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      await updateDoc(doc(db, "users", user.uid, "rules", rule.id), {
        enabled: !rule.enabled
      });
    } catch (e) {
      toast.error("Erreur");
    }
  };

  const deleteRule = async () => {
    const user = auth.currentUser;
    if (!user) return;
    if (!window.confirm("Supprimer cette règle suggérée ?")) return;
    
    try {
      await deleteDoc(doc(db, "users", user.uid, "rules", rule.id));
      toast.success("Règle supprimée");
    } catch (e) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      // Si c'est une liste (adresses bloquées/whitelist), on split par virgule
      let finalVal = val;
      if (rule.id === 'r4' || rule.id === 'r12') {
        finalVal = typeof val === 'string' ? val.split(',').map((s: string) => s.trim()).filter((s: string) => s !== '') : val;
      }

      await updateDoc(doc(db, "users", user.uid, "rules", rule.id), {
        "config.value": finalVal
      });
      setShowModal(false);
      toast.success("Réglages enregistrés");
    } catch (e) {
      toast.error("Erreur lors de la sauvegarde");
    }
  };

  const behaviorStyles = {
    automatic: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    confirmation: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    intelligent: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
  };

  return (
    <>
      {/* CARD */}
      <div className={`bg-[#0A0A0A] border border-white/5 rounded-2xl p-6 transition-all duration-500 hover:border-blue-500/30 group flex flex-col h-full relative overflow-hidden ${!rule.enabled && 'opacity-50'}`}>
        <div className="flex items-start justify-between mb-5 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-400 border border-blue-500/10 group-hover:scale-110 transition-transform duration-300">
              <Icon size={20} />
            </div>
            <h4 className="font-bold text-[15px] text-white leading-tight">{rule.name}</h4>
          </div>
          <div className="flex items-center gap-2">
            {rule.isSuggestion && (
              <button 
                onClick={deleteRule}
                className="p-1.5 hover:bg-red-500/10 text-gray-500 hover:text-red-400 rounded-lg transition-colors"
                title="Supprimer la règle"
              >
                <Trash2 size={16} />
              </button>
            )}
            <button 
              onClick={toggleRule}
              className={`w-11 h-6 rounded-full relative transition-all duration-300 ${rule.enabled ? 'bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'bg-white/10'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-sm ${rule.enabled ? 'left-6' : 'left-1'}`} />
            </button>
          </div>
        </div>

        <div className="mb-6 flex-grow relative z-10">
          <div className="flex flex-wrap gap-2 mb-3">
            <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border ${behaviorStyles[rule.behavior as keyof typeof behaviorStyles] || behaviorStyles.intelligent}`}>
              {rule.behavior || 'Intelligent'}
            </span>
            {rule.isSuggestion && (
              <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border border-blue-500/30 bg-blue-500/10 text-blue-400 flex items-center gap-1">
                <Cpu size={10} />
                Meka
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 leading-relaxed font-medium">
            {rule.description}
          </p>
        </div>

        {rule.isSuggestion ? (
          <div className="mt-auto bg-blue-500/5 border border-blue-500/10 rounded-xl p-3 flex items-center gap-2">
            <ShieldCheck size={14} className="text-blue-400" />
            <span className="text-[10px] text-blue-400 font-bold uppercase tracking-tight">Règle optimisée par Meka</span>
          </div>
        ) : (
          <button 
            onClick={() => setShowModal(true)}
            className="mt-auto bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 rounded-xl p-3 flex items-center justify-between transition-all duration-200 group/btn"
          >
            <div className="flex items-center gap-2 text-[11px] text-gray-500 font-medium">
               <Settings2 size={14} className="group-hover/btn:text-blue-400 transition-colors" />
               <span className="opacity-60">{rule.config?.label || "Réglage"} :</span>
               <span className="text-white font-bold">
                 {rule.config ? (Array.isArray(rule.config.value) ? rule.config.value.length : rule.config.value) : "Auto"}
                 {rule.id === 'r1' && ' mois'}
                 {rule.id === 'r3' && ' jours'}
                 {rule.id === 'r5' && ' Mo'}
                 {rule.id === 'r8' && ' mois'}
               </span>
            </div>
            <ChevronRight size={14} className="text-gray-700 group-hover/btn:text-white transition-colors" />
          </button>
        )}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => setShowModal(false)}
          />
          
          {/* Content */}
          <div className="relative bg-[#0F0F0F] border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-blue-600/10 to-transparent">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/20 rounded-2xl text-blue-400">
                  <Icon size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{rule.name}</h3>
                  <div className="flex gap-2 mt-1">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${behaviorStyles[rule.behavior as keyof typeof behaviorStyles]}`}>
                      Mode {rule.behavior}
                    </span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-white/5 rounded-full text-gray-500 hover:text-white transition"
              >
                <X size={24} />
              </button>
            </div>

            {/* Body */}
            <div className="p-8 space-y-6">
              <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-4 flex gap-3">
                <Info className="text-blue-400 shrink-0" size={18} />
                <p className="text-sm text-gray-400 leading-relaxed italic">
                  {rule.description}
                </p>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold text-gray-300 ml-1">
                  {rule.config?.label || "Configuration de la règle"}
                </label>
                
                {rule.id === 'r4' || rule.id === 'r12' ? (
                  <textarea 
                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-blue-500 transition h-32 text-sm placeholder:text-gray-700"
                    placeholder="Séparez les adresses par des virgules..."
                    value={Array.isArray(val) ? val.join(', ') : val}
                    onChange={(e) => setVal(e.target.value)}
                  />
                ) : (
                  <div className="flex items-center gap-4">
                    <input 
                      type="text" 
                      className="flex-grow bg-black/40 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-blue-500 transition text-lg font-bold"
                      value={val}
                      onChange={(e) => setVal(e.target.value)}
                    />
                    <span className="text-gray-500 font-bold text-lg">
                      {rule.id === 'r1' && 'MOIS'}
                      {rule.id === 'r3' && 'JOURS'}
                      {rule.id === 'r5' && 'MO'}
                      {rule.id === 'r8' && 'MOIS'}
                      {rule.id === 'r9' && 'JOURS'}
                      {rule.id === 'r11' && 'MOIS'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-white/[0.02] border-t border-white/5 flex justify-end gap-3">
              <button 
                onClick={() => setShowModal(false)}
                className="px-6 py-2.5 rounded-xl font-bold text-gray-500 hover:text-white hover:bg-white/5 transition text-sm"
              >
                Annuler
              </button>
              <button 
                onClick={handleSave}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 text-sm"
              >
                <Save size={16} />
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
