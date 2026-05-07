"use client";

import { useEffect, useState } from "react";
import Lottie from "lottie-react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, onSnapshot, collection, query } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { 
  LogOut, 
  Trash2, 
  Sparkles, 
  Settings, 
  Mail, 
  Database,
  RefreshCw,
  Plus,
  Check,
  Cpu,
  AlertCircle
} from "lucide-react";
import StatsCard from "@/components/StatsCard";
import RuleBuilder from "@/components/RuleBuilder";
import RuleList from "@/components/RuleList";
import KimiSuggestions from "@/components/KimiSuggestions";
import { analyzeMailbox, runClean, getGoogleAuthUrl, initRules } from "@/lib/api";
import toast from "react-hot-toast";
import deleteNowData from "../../delete_now.json";

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStatus, setAnalysisStatus] = useState("");
  const [cleaning, setCleaning] = useState(false);
  const [cleaningProgress, setCleaningProgress] = useState(0);
  const [cleaningStatus, setCleaningStatus] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [stats, setStats] = useState({ deleted: 0, space: 0 });
  const [showRuleBuilder, setShowRuleBuilder] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (!u) {
        router.push("/");
      } else {
        setUser(u);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (user) {
      // Écouter les données utilisateur
      const unsubUser = onSnapshot(doc(db, "users", user.uid), (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setUserData(data);
          setStats({
            deleted: data.totalEmailsDeleted || 0,
            space: data.totalSpaceSavedMB || 0
          });
        }
      });

      // Écouter les règles
      const q = query(collection(db, "users", user.uid, "rules"));
      const unsubRules = onSnapshot(q, (snapshot) => {
        const rulesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setRules(rulesData);
      });

      return () => {
        unsubUser();
        unsubRules();
      };
    }
  }, [user]);

  // Initialisation/Mise à jour automatique des règles par défaut (Inclut les onglets Image)
  useEffect(() => {
    if (userData?.gmailConnected && !loading) {
      // On déclenche si la liste est vide OU si les nouvelles règles spécifiques (r13, r14) manquent
      const needsInit = rules.length === 0 || !rules.some(r => r.id === 'r13') || !rules.some(r => r.id === 'r14');
      
      if (needsInit) {
        const triggerInit = async () => {
          try {
            const token = await auth.currentUser?.getIdToken();
            if (token) await initRules(token);
          } catch (e) {
            console.error("Erreur init auto rules", e);
          }
        };
        triggerInit();
      }
    }
  }, [userData?.gmailConnected, rules.length, loading]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  const connectGmail = async () => {
    try {
      const { url } = await getGoogleAuthUrl();
      window.location.href = url;
    } catch (e) {
      toast.error("Erreur de connexion Gmail");
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setAnalysisProgress(10);
    setAnalysisStatus("Connexion sécurisée à Gmail...");
    
    try {
      // Simulation d'étapes visuelles
      const statusInterval = setInterval(() => {
        setAnalysisProgress(prev => {
          if (prev < 90) return prev + 5;
          return prev;
        });
      }, 1000);

      const res = await analyzeMailbox();
      clearInterval(statusInterval);
      
      if (res.detail) {
        throw new Error(res.detail);
      }

      setAnalysisProgress(100);
      setAnalysisStatus("Analyse terminée !");
      
      setTimeout(() => {
        setSuggestions(res.suggestions || []);
        setAnalyzing(false);
        toast.success("Analyse terminée ! Découvrez vos suggestions.");
      }, 500);
    } catch (e: any) {
      console.error("Erreur d'analyse:", e);
      toast.error(`Erreur d'analyse : ${e.message || "Le service est temporairement indisponible"}`);
      setAnalyzing(false);
    }
  };

  const handleClean = async () => {
    setShowConfirmModal(false);
    setCleaning(true);
    setCleaningProgress(5);
    setCleaningStatus("Initialisation du moteur Meka...");
    
    try {
      // Simulation d'étapes
      setTimeout(() => { setCleaningProgress(20); setCleaningStatus("Récupération des règles actives..."); }, 1000);
      setTimeout(() => { setCleaningProgress(40); setCleaningStatus("Recherche des emails correspondants..."); }, 2500);
      setTimeout(() => { setCleaningProgress(60); setCleaningStatus("Suppression sécurisée en cours..."); }, 4500);
      setTimeout(() => { setCleaningProgress(85); setCleaningStatus("Nettoyage des archives obsolètes..."); }, 7000);

      const res = await runClean();
      setCleaningProgress(100);
      setCleaningStatus("Nettoyage terminé avec succès !");
      
      setTimeout(() => {
        setCleaning(false);
        setStats({ 
          deleted: (stats.deleted || 0) + (res.emails_deleted || 0), 
          space: (stats.space || 0) + (res.space_saved_mb || 0) 
        });
        toast.success(`${res.emails_deleted} emails supprimés !`);
      }, 1500);
    } catch (e) {
      setCleaning(false);
      toast.error("Erreur lors du nettoyage");
    }
  };

  const handleAcceptSuggestion = async (suggestion: any) => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const rulesRef = collection(db, "users", user.uid, "rules");
      // On génère un ID basé sur le nom pour éviter les doublons
      const ruleId = `suggested_${Date.now()}`;
      
      const newRule = {
        name: suggestion.name,
        description: suggestion.description,
        behavior: suggestion.behavior || "confirmation",
        enabled: true,
        conditions: suggestion.conditions,
        createdAt: new Date(),
        emailsDeleted: 0,
        lastRun: null,
        category: "IA"
      };

      // Utiliser le Firestore SDK pour ajouter la règle
      const { addDoc } = await import("firebase/firestore");
      await addDoc(rulesRef, newRule);
      
      setSuggestions(prev => prev.filter(s => s !== suggestion));
      toast.success("Règle ajoutée !");
    } catch (e) {
      toast.error("Erreur lors de l'ajout de la règle");
    }
  };

  if (loading) return null;

  return (
    <div className="min-h-screen bg-[#050505]">
      {/* Header */}
      <header className="border-b border-white/5 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="text-blue-500" size={20} />
            <span className="font-bold tracking-tight">Meka GmailCleaner</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 px-3 py-1.5 bg-white/5 rounded-full border border-white/10">
              <img 
                src={user?.photoURL || ""} 
                className="w-6 h-6 rounded-full" 
                alt="Avatar" 
              />
              <span className="text-xs font-medium">{user?.displayName}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-white transition"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Actions bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
          <div>
            <h2 className="text-3xl font-bold text-white mb-1">Tableau de bord</h2>
            <p className="text-gray-400">Gérez vos règles et optimisez votre espace.</p>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={handleAnalyze}
              disabled={analyzing}
              className="flex items-center gap-2 bg-blue-600/10 text-blue-400 border border-blue-500/20 hover:bg-blue-600/20 disabled:opacity-50 px-6 py-3 rounded-2xl font-bold transition-all duration-300"
            >
              {analyzing ? <RefreshCw className="animate-spin" size={18} /> : <Cpu size={18} />}
              Analyser avec Meka
            </button>
            <button 
              onClick={() => setShowConfirmModal(true)}
              disabled={analyzing || cleaning}
              className="flex items-center gap-2 bg-white text-black hover:bg-gray-200 disabled:opacity-50 px-6 py-3 rounded-2xl font-bold transition-all duration-300 shadow-lg shadow-white/10"
            >
              <Trash2 size={18} />
              Nettoyer maintenant
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <StatsCard 
            title="Emails supprimés" 
            value={stats.deleted} 
            icon={Trash2} 
            color="bg-red-500/20 text-red-400"
            description="Total historique"
          />
          <StatsCard 
            title="Espace libéré" 
            value={`${stats.space} MB`} 
            icon={Database} 
            color="bg-blue-500/20 text-blue-400"
            description="Estimation de l'IA"
          />
          <StatsCard 
            title="Règles actives" 
            value={rules.filter(r => r.enabled).length} 
            icon={Settings} 
            color="bg-purple-500/20 text-purple-400"
            description="Filtrage en temps réel"
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-10">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">

            <div className="">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-white">Vos règles de nettoyage</h3>
                  <p className="text-gray-500 text-sm mt-1">Configurez le comportement de l'IA pour chaque type d'email.</p>
                </div>
              </div>
              
              {rules.length === 0 ? (
                <div className="bg-white/5 border border-white/5 rounded-3xl p-12 text-center">
                  <div className="w-16 h-16 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <RefreshCw className="animate-spin" size={32} />
                  </div>
                  <h4 className="text-xl font-bold mb-2">Initialisation de votre espace...</h4>
                  <p className="text-gray-500 mb-8 max-w-sm mx-auto">
                    Nous préparons vos 12 règles de nettoyage intelligentes. Cela ne prend que quelques secondes.
                  </p>
                </div>
              ) : (
                <RuleList rules={rules} />
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {userData?.gmailConnected ? (
              <div className="bg-white/5 border border-white/10 p-6 rounded-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3">
                  <div className="bg-green-500/20 text-green-400 p-1.5 rounded-full">
                    <Check size={14} />
                  </div>
                </div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative">
                    <img 
                      src={user?.photoURL || ""} 
                      className="w-12 h-12 rounded-2xl object-cover border border-white/10" 
                      alt="Avatar" 
                    />
                    <div className="absolute -bottom-1 -right-1 bg-blue-600 p-1 rounded-md border-2 border-[#050505]">
                      <Mail size={10} />
                    </div>
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-bold text-white truncate">{user?.displayName}</p>
                    <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                  </div>
                </div>
                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Statut</span>
                  <span className="text-xs font-medium text-green-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    Synchronisé
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-yellow-600/10 to-orange-600/10 border border-yellow-500/20 p-6 rounded-2xl">
                <h4 className="font-bold text-yellow-500 mb-2">Connecter Gmail</h4>
                <p className="text-sm text-gray-400 mb-4">
                  Vous devez autoriser l'accès à Gmail pour que le nettoyage fonctionne.
                </p>
                <button 
                  onClick={connectGmail}
                  className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-2 rounded-xl transition"
                >
                  Lier mon compte Google
                </button>
              </div>
            )}

            {analyzing && (
              <div className="animate-in fade-in duration-700">
                <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 shadow-sm relative overflow-hidden">
                  <div className="flex flex-col gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-white/80">
                        <Cpu size={18} className="animate-pulse" />
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="text-white font-semibold text-[15px]">Meka Engine</h4>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Analyse active</p>
                      </div>
                    </div>
                    
                    <div className="bg-white/[0.02] rounded-xl p-4 border border-white/5">
                      <p className="text-gray-400 text-[13px] leading-relaxed font-medium">
                        {analysisStatus}
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        <span>Status</span>
                        <span className="text-white">{analysisProgress}%</span>
                      </div>
                      <div className="relative h-1.5 w-full bg-white/5 rounded-sm overflow-hidden">
                        <div 
                          className="absolute top-0 left-0 h-full bg-gradient-to-r from-gray-400 to-white transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(255,255,255,0.4)]"
                          style={{ width: `${analysisProgress}%` }}
                        />
                        <div className="absolute inset-0 flex gap-1.5">
                          {[...Array(9)].map((_, i) => (
                            <div key={i} className="h-full w-full border-r-[3px] border-[#0A0A0A]" />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <KimiSuggestions 
              suggestions={suggestions} 
              loading={analyzing}
              onIgnore={(i) => setSuggestions(prev => prev.filter((_, idx) => idx !== i))}
            />

            {showRuleBuilder && <RuleBuilder onSave={() => setShowRuleBuilder(false)} />}
          </div>
        </div>
      </main>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowConfirmModal(false)} />
          <div className="relative bg-[#0F0F0F] border border-white/10 rounded-3xl w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400 mb-6">
              <AlertCircle size={32} />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Prêt pour le nettoyage ?</h3>
            <p className="text-gray-400 mb-8 leading-relaxed">
              Salut papa, confirme que tu as bien vérifié tes règles. Meka va maintenant supprimer définitivement les emails correspondants de ton compte Gmail.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-6 py-3 rounded-xl font-bold text-gray-500 hover:text-white hover:bg-white/5 transition"
              >
                Vérifier encore
              </button>
              <button 
                onClick={handleClean}
                className="flex-1 px-6 py-3 bg-white text-black rounded-xl font-bold hover:bg-gray-200 transition"
              >
                C'est parti !
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cleaning Progress Overlay */}
      {cleaning && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
          <div className="w-full max-w-lg text-center space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="w-64 h-64 mx-auto">
              <Lottie animationData={deleteNowData} loop={true} />
            </div>
            
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-white">Nettoyage en cours</h2>
              <p className="text-blue-400 font-mono text-sm tracking-widest uppercase animate-pulse">
                {cleaningStatus}
              </p>
            </div>

            <div className="max-w-md mx-auto space-y-3">
              <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                <span>Progression</span>
                <span className="text-white">{cleaningProgress}%</span>
              </div>
              <div className="relative h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-400 to-white transition-all duration-500 ease-out shadow-[0_0_15px_rgba(255,255,255,0.4)]"
                  style={{ width: `${cleaningProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
