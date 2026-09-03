import Head from "next/head";
import { buildCanonicalUrl } from "../../lib/public-url";

const sectionStyle = {
  display: "grid",
  gap: "12px",
};

export default function TermsPage() {
  return (
    <>
      <Head>
        <title>Terms of Service · Smith-Heffa Paygate</title>
        <meta
          name="description"
          content="Read the terms governing Smith-Heffa Paygate services provided by Buttertech Inc."
        />
        <link rel="canonical" href={buildCanonicalUrl("/legal/terms")} />
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
              Terms of Service
            </h1>
            <p style={{ margin: "10px 0 0", color: "#a1a1aa", fontSize: "15px" }}>
              Smith-Heffa Paygate · Buttertech Inc.
            </p>
          </section>

          <section style={{ padding: "32px", display: "grid", gap: "24px", lineHeight: 1.7 }}>
            <div style={sectionStyle}>
              <h2 style={{ margin: 0, fontSize: "20px" }}>Service Scope</h2>
              <p style={{ margin: 0 }}>
                Smith-Heffa Paygate provides enterprise-grade authentication,
                payment orchestration, bank transfer initiation, identity
                verification handoff, and related operational controls.
              </p>
            </div>

            <div style={sectionStyle}>
              <h2 style={{ margin: 0, fontSize: "20px" }}>User Responsibilities</h2>
              <p style={{ margin: 0 }}>
                Users must provide accurate information, use the platform
                lawfully, and complete provider-hosted verification or payment
                steps according to the rules of the selected rail or identity
                partner.
              </p>
            </div>

            <div style={sectionStyle}>
              <h2 style={{ margin: 0, fontSize: "20px" }}>Third-Party Dependencies</h2>
              <p style={{ margin: 0 }}>
                Certain flows depend on third-party providers and regulated
                networks. Availability, acceptance, and final outcomes may be
                subject to provider-side controls outside Buttertech’s direct
                application layer.
              </p>
            </div>

            <div style={sectionStyle}>
              <h2 style={{ margin: 0, fontSize: "20px" }}>Compliance and Security</h2>
              <p style={{ margin: 0 }}>
                Use of the service is subject to enterprise security controls,
                fraud prevention checks, auditability requirements, and
                applicable law.
              </p>
            </div>

            <div style={sectionStyle}>
              <h2 style={{ margin: 0, fontSize: "20px" }}>Contact</h2>
              <p style={{ margin: 0 }}>
                For legal or commercial requests, contact Buttertech Inc. via{" "}
                <a href="https://www.buttertech.io">buttertech.io</a>.
              </p>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
