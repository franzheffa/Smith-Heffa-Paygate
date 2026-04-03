import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // 1. Parsing sécurisé du payload
    const body = await req.json().catch(() => null);
    
    if (!body) {
      console.warn("[PayGate - Orange OTP] Payload invalide ou vide reçu.");
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    const { phoneNumber, amount } = body;

    // 2. Validation des variables d'environnement
    const orangeApiUrl = process.env.ORANGE_API_URL;
    const orangeAuthHeader = process.env.ORANGE_AUTH_HEADER;

    if (!orangeApiUrl || !orangeAuthHeader) {
      console.error("[PayGate - Orange OTP] Erreur Critique: Variables d'environnement manquantes.");
      return NextResponse.json({ error: "Configuration Server Error" }, { status: 500 });
    }

    // 3. Mock Enterprise - A remplacer par ton fetch fetch(`${orangeApiUrl}/...`)
    // On valide la structure avant de l'appeler pour éviter le 'undefined'
    
    return NextResponse.json({ 
      success: true, 
      message: "OTP process initiated" 
    }, { status: 200 });

  } catch (error: any) {
    // 4. Langsmith log friendly + Fallback
    console.error("[PayGate - Orange OTP] System Exception:", error?.message || "Unknown error");
    
    return NextResponse.json(
      { error: "Internal Server Error processing Orange OTP." },
      { status: 500 }
    );
  }
}
