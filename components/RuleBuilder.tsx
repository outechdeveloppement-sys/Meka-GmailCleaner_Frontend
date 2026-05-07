"use client";

import { useState } from "react";
import { Plus, Trash2, Save, X } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import toast from "react-hot-toast";

type FilterType = 'from' | 'older_than' | 'size' | 'category' | 'has';

interface Filter {
  field: FilterType;
  value: string;
}

export default function RuleBuilder({ onSave }: { onSave?: () => void }) {
  const [name, setName] = useState("");
  const [operator, setOperator] = useState<"AND" | "OR">("AND");
  const [filters, setFilters] = useState<Filter[]>([{ field: "from", value: "" }]);

  const addFilter = () => setFilters([...filters, { field: "from", value: "" }]);
  
  const updateFilter = (index: number, field: keyof Filter, value: string) => {
    const newFilters = [...filters];
    newFilters[index] = { ...newFilters[index], [field]: value };
    setFilters(newFilters);
  };

  const removeFilter = (index: number) => {
    if (filters.length > 1) {
      setFilters(filters.filter((_, i) => i !== index));
    }
  };

  const saveRule = async () => {
    if (!name) return toast.error("Donnez un nom à votre règle");
    if (filters.some(f => !f.value)) return toast.error("Remplissez toutes les valeurs");

    try {
      const user = auth.currentUser;
      if (!user) return;

      const ruleData = {
        name,
        enabled: true,
        createdAt: serverTimestamp(),
        conditions: {
          operator,
          filters
        },
        emailsDeleted: 0,
        lastRun: null
      };

      await addDoc(collection(db, "users", user.uid, "rules"), ruleData);
      toast.success("Règle sauvegardée !");
      setName("");
      setFilters([{ field: "from", value: "" }]);
      if (onSave) onSave();
    } catch (error) {
      toast.error("Erreur lors de la sauvegarde");
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl shadow-xl text-white">
      <h3 className="text-xl font-semibold mb-4">Nouvelle règle</h3>
      
      <div className="space-y-4">
        <input
          type="text"
          placeholder="Nom de la règle (ex: Vieux Promos)"
          className="w-full bg-black/20 border border-white/10 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 transition"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">Opérateur :</span>
          <button
            onClick={() => setOperator("AND")}
            className={`px-3 py-1 rounded-md text-xs font-bold transition ${operator === "AND" ? "bg-blue-600" : "bg-white/5"}`}
          >
            AND
          </button>
          <button
            onClick={() => setOperator("OR")}
            className={`px-3 py-1 rounded-md text-xs font-bold transition ${operator === "OR" ? "bg-blue-600" : "bg-white/5"}`}
          >
            OR
          </button>
        </div>

        {filters.map((filter, index) => (
          <div key={index} className="flex gap-2 items-center">
            <select
              className="bg-black/20 border border-white/10 rounded-lg p-2 outline-none"
              value={filter.field}
              onChange={(e) => updateFilter(index, "field", e.target.value as FilterType)}
            >
              <option value="from">Expéditeur</option>
              <option value="older_than">Ancienneté (ex: 6m)</option>
              <option value="size">Taille (ex: 5M)</option>
              <option value="category">Catégorie</option>
              <option value="has">Contient</option>
            </select>
            <input
              type="text"
              placeholder="Valeur"
              className="flex-1 bg-black/20 border border-white/10 rounded-lg p-2 outline-none"
              value={filter.value}
              onChange={(e) => updateFilter(index, "value", e.target.value)}
            />
            <button onClick={() => removeFilter(index)} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg">
              <Trash2 size={18} />
            </button>
          </div>
        ))}

        <button
          onClick={addFilter}
          className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition"
        >
          <Plus size={16} /> Ajouter une condition
        </button>

        <div className="pt-4 border-t border-white/10 mt-4">
          <p className="text-xs text-gray-400 mb-4">
            Aperçu : {filters.map((f, i) => `${f.field}:${f.value}`).join(` ${operator} `)}
          </p>
          <button
            onClick={saveRule}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-blue-600/20"
          >
            <Save size={20} /> Sauvegarder la règle
          </button>
        </div>
      </div>
    </div>
  );
}
