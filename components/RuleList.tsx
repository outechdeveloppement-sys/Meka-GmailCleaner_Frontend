import RuleCard from "./RuleCard";

export default function RuleList({ rules }: { rules: any[] }) {
  // Trier les règles par ID pour garder l'ordre de l'image (r1, r2, ...)
  const sortedRules = [...rules].sort((a, b) => {
    const idA = parseInt(a.id.replace('r', ''));
    const idB = parseInt(b.id.replace('r', ''));
    return idA - idB;
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {sortedRules.length === 0 ? (
        <div className="col-span-full text-gray-500 text-center py-20 bg-white/5 rounded-3xl border border-white/5">
          <div className="animate-pulse">Initialisation des règles...</div>
        </div>
      ) : (
        sortedRules.map((rule) => (
          <RuleCard key={rule.id} rule={rule} />
        ))
      )}
    </div>
  );
}
