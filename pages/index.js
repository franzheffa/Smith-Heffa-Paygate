import React from 'react';
import { ShieldCheck, Coins, CreditCard, Landmark, ArrowRight } from 'lucide-react';

export default function GoldDashboard() {
  const gold = "#D4AF37";
  
  return (
    <div style={{ backgroundColor: '#FFFFFF', color: '#000000', minHeight: '100vh', fontFamily: "'Georgia', serif" }}>
      {/* Barre de Navigation Supérieure */}
      <nav style={{ borderBottom: "2px solid #F2F2F2", padding: "20px 50px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "900", letterSpacing: "1px", display: "flex", alignItems: "center", gap: "10px" }}>
          <ShieldCheck size={28} color={gold} /> BUTTERTECH <span style={{ color: gold }}>FINANCE</span>
        </h1>
        <div style={{ fontSize: "14px", fontWeight: "600", color: gold, border: "1px solid " + gold, padding: "5px 15px" }}>
          SOUVEREIGN ORCHESTRATOR
        </div>
      </nav>

      {/* Hero Section */}
      <main style={{ padding: "60px 50px" }}>
        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "48px", marginBottom: "10px" }}>L'Intemporalité de la Valeur.</h2>
          <p style={{ fontSize: "18px", color: "#666", maxWidth: "700px" }}>
            Connectez vos flux financiers mondiaux via notre passerelle hybride. 
            Digitalisation du travail et sécurisation des actifs numériques.
          </p>
        </section>

        {/* Grille des Services */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "30px" }}>
          
          {/* Mobile Money Afrique */}
          <div style={{ padding: "30px", border: "1px solid #EAEAEA", backgroundColor: "#FAFAFA" }}>
            <Coins size={32} color={gold} style={{ marginBottom: "20px" }} />
            <h3 style={{ fontSize: "20px", marginBottom: "15px" }}>AFRIQUE GATEWAY</h3>
            <p style={{ color: "#444", fontSize: "15px", lineHeight: "1.6" }}>Intégration Mobile Money (MTN, Orange, M-Pesa). Le futur de la monnaie numérique sur le continent.</p>
            <hr style={{ margin: "20px 0", border: "0", borderTop: "1px solid #EEE" }} />
            <span style={{ fontWeight: "bold", fontSize: "12px", color: gold, display: "flex", alignItems: "center", gap: "5px" }}>
              ACTIVER LE FLUX <ArrowRight size={14} />
            </span>
          </div>

          {/* Stripe / Interac */}
          <div style={{ padding: "30px", border: "1px solid #EAEAEA", backgroundColor: "#FAFAFA" }}>
            <CreditCard size={32} color={gold} style={{ marginBottom: "20px" }} />
            <h3 style={{ fontSize: "20px", marginBottom: "15px" }}>STRIPE & APPLE PAY</h3>
            <p style={{ color: "#444", fontSize: "15px", lineHeight: "1.6" }}>Interac, Apple Pay et Stripe Checkout. Une infrastructure robuste pour le travail intemporel.</p>
            <hr style={{ margin: "20px 0", border: "0", borderTop: "1px solid #EEE" }} />
            <span style={{ fontWeight: "bold", fontSize: "12px", color: gold, display: "flex", alignItems: "center", gap: "5px" }}>
              CONFIGURATION PRO <ArrowRight size={14} />
            </span>
          </div>

          {/* FIX Engine Legacy */}
          <div style={{ padding: "30px", border: "1px solid #000", backgroundColor: "#000", color: "#FFF" }}>
            <Landmark size={32} color={gold} style={{ marginBottom: "20px" }} />
            <h3 style={{ fontSize: "20px", marginBottom: "15px", color: gold }}>ENGINE FIX 4.4</h3>
            <p style={{ color: "#AAA", fontSize: "15px", lineHeight: "1.6" }}>Votre moteur financier de 2016 est maintenant synchronisé avec le cloud moderne.</p>
            <div style={{ marginTop: "20px", fontSize: "12px", color: gold }}>STATUS: SYNCHRONISÉ</div>
          </div>

        </div>
      </main>

      <footer style={{ position: "fixed", bottom: "0", width: "100%", padding: "20px 50px", fontSize: "12px", color: "#999", textAlign: "center", borderTop: "1px solid #F2F2F2" }}>
        © 2026 BUTTERTECH INC. - L'EXCELLENCE DANS LA MONNAIE NUMÉRIQUE.
      </footer>
    </div>
  );
}
