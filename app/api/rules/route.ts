import { NextRequest, NextResponse } from "next/server";
// Dans un véritable SaaS, on pourrait ici ajouter des validations serveur supplémentaires
// ou synchroniser avec d'autres services.

export async function GET() {
  return NextResponse.json({ message: "Utilisez le Firestore Client SDK pour le CRUD des règles" });
}

export async function POST(request: NextRequest) {
  const data = await request.json();
  // Logique optionnelle de validation serveur
  return NextResponse.json({ status: "success", data });
}
