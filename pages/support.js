import Head from "next/head";
import { buildCanonicalUrl } from "../lib/public-url";

const sectionStyle = {
  display: "grid",
  gap: "12px",
};

const listStyle = {
  margin: 0,
  paddingLeft: "20px",
  display: "grid",
  gap: "10px",
};

export default function SupportPage() {
  return (
    <>
      <Head>
        <title>Smith-Heffa Paygate Support | Buttertech Inc.</title>
        <meta
          name="description"
          content="Get help with Smith-Heffa Paygate account access, payments, security, privacy and supported digital services."
        />
        <link rel="canonical" href={buildCanonicalUrl("/support")} />
      </Head>

      <main
        style={{
          minHeight: "100vh",
          backgroundColor: "#f4f4f5",
          color: "#111",
          fontFamily: "system-ui, sans-serif",
          padding: "40px 16px",
        }}
      >
        <div
          style={{
            maxWidth: "860px",
            margin: "0 auto",
            backgroundColor: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: "24px",
            overflow: "hidden",
            boxShadow: "0 20px 40px -15px rgba(0,0,0,0.1)",
          }}
        >
          <section
            style={{
              backgroundColor: "#09090b",
              color: "#fff",
              padding: "32px",
              borderBottom: "4px solid #d4b26a",
            }}
          >
            <h1 style={{ margin: 0, fontSize: "30px", fontWeight: 800 }}>
              Smith-Heffa Paygate Support
            </h1>
            <p style={{ margin: "10px 0 0", color: "#a1a1aa", fontSize: "15px" }}>
              Smith-Heffa Paygate · Buttertech Inc.
            </p>
          </section>

          <section style={{ padding: "32px", display: "grid", gap: "24px", lineHeight: 1.7 }}>
            <div style={sectionStyle}>
              <h2 style={{ margin: 0, fontSize: "20px" }}>Account and sign-in</h2>
              <ul style={listStyle}>
                <li>Use the sign-in page to access your account or continue with Google Sign-In.</li>
                <li>For account-access or verification problems, use the contact channel below with only the information needed to locate your request.</li>
                <li>Do not send passwords, authentication codes, payment-card details, or other credentials through an unsecured channel.</li>
              </ul>
            </div>

            <div style={sectionStyle}>
              <h2 style={{ margin: 0, fontSize: "20px" }}>Payments and transactions</h2>
              <ul style={listStyle}>
                <li>For a failed, declined, or pending transaction, keep the transaction reference and the date and time of the attempt.</li>
                <li>Some payment, bank-transfer, identity, and mobile-money flows are completed by third-party providers; their availability and final outcomes can depend on provider-side checks.</li>
              </ul>
            </div>

            <div style={sectionStyle}>
              <h2 style={{ margin: 0, fontSize: "20px" }}>Travel and digital services</h2>
              <p style={{ margin: 0 }}>
                If you used a travel-search or other supported digital-service flow, include the relevant reference in your request so Buttertech Inc. can investigate the correct service.
              </p>
            </div>

            <div style={sectionStyle}>
              <h2 style={{ margin: 0, fontSize: "20px" }}>Security</h2>
              <p style={{ margin: 0 }}>
                If you believe your account has been accessed without permission or you are experiencing an authentication issue, contact Buttertech Inc. promptly. Do not share passwords or one-time codes.
              </p>
            </div>

            <div style={sectionStyle}>
              <h2 style={{ margin: 0, fontSize: "20px" }}>Privacy and account deletion</h2>
              <ul style={listStyle}>
                <li><a href="/legal/privacy">Privacy Policy</a></li>
                <li><a href="/legal/terms">Terms of Service</a></li>
                <li><a href="/account/delete">Request account and personal-data deletion</a></li>
              </ul>
            </div>

            <div style={sectionStyle}>
              <h2 style={{ margin: 0, fontSize: "20px" }}>Contact support</h2>
              <p style={{ margin: 0 }}>
                Contact Buttertech Inc. through <a href="https://www.buttertech.io">buttertech.io</a> for support, privacy, legal, or commercial requests.
              </p>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
