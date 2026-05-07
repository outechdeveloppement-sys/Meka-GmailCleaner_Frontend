import { auth } from "./firebase";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

async function getHeaders() {
  const user = auth.currentUser;
  if (!user) throw new Error("Non authentifié");
  const token = await user.getIdToken();
  return {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  };
}

export async function getGoogleAuthUrl() {
  const response = await fetch(`${BACKEND_URL}/auth/google-login`);
  return await response.json();
}

export async function sendAuthCallback(code: string) {
  const response = await fetch(`${BACKEND_URL}/auth/callback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code })
  });
  return await response.json();
}

export async function initRules(idToken: string) {
  const response = await fetch(`${BACKEND_URL}/auth/init-rules`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id_token: idToken })
  });
  return await response.json();
}

export async function analyzeMailbox() {
  const headers = await getHeaders();
  const response = await fetch(`${BACKEND_URL}/analyze`, {
    method: "POST",
    headers
  });
  return await response.json();
}

export async function runClean() {
  const headers = await getHeaders();
  const response = await fetch(`${BACKEND_URL}/clean`, {
    method: "POST",
    headers
  });
  return await response.json();
}
