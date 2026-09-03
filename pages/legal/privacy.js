import Head from "next/head";
import { buildCanonicalUrl } from "../../lib/public-url";

const sectionStyle = {
  display: "grid",
  gap: "12px",
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <Head>
        <title>Privacy Policy · Smith-Heffa Paygate</title>
        <meta
          name="description"
          content="Learn how Smith-Heffa Paygate and Buttertech Inc. collect, use, protect, and handle personal information."
        />
        <link rel="canonical" href={buildCanonicalUrl("/legal/privacy")} />
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
              Privacy Policy
            </h1>
            <p style={{ margin: "10px 0 0", color: "#a1a1aa", fontSize: "15px" }}>
              Smith-Heffa Paygate · Buttertech Inc.
            </p>
          </section>

          <section style={{ padding: "32px", display: "grid", gap: "24px", lineHeight: 1.7 }}>
            <div style={sectionStyle}>
              <h2 style={{ margin: 0, fontSize: "20px" }}>Last Updated</h2>
              <p style={{ margin: 0 }}>July 4, 2026.</p>
            </div>

            <div style={sectionStyle}>
              <h2 style={{ margin: 0, fontSize: "20px" }}>Information We Collect</h2>
              <p style={{ margin: 0 }}>
                We collect only the information required to provide payment
                orchestration, authentication, fraud prevention, audit logging,
                and regulated verification services for users and enterprise
                customers.
              </p>
            </div>

            <div style={sectionStyle}>
              <h2 style={{ margin: 0, fontSize: "20px" }}>Google Sign-In Data Accessed</h2>
              <p style={{ margin: 0 }}>
                When a user selects Google Sign-In, Smith-Heffa Paygate requests
                only the standard Google OAuth scopes <strong>openid</strong>,
                <strong> email</strong>, and <strong>profile</strong>. Through
                those scopes, Google may provide the user&apos;s Google account
                email address, display name, unique Google account identifier,
                and basic profile metadata such as a profile image.
              </p>
              <p style={{ margin: 0 }}>
                Smith-Heffa Paygate uses Google account data only to identify
                the user, create or match a local account, complete a secure
                login session, and record a security audit event for the sign-in
                action. Our application does not request access to Gmail,
                Google Drive, Google Calendar, Google Contacts, or any other
                restricted or sensitive Google API scope.
              </p>
            </div>

            <div style={sectionStyle}>
              <h2 style={{ margin: 0, fontSize: "20px" }}>How We Use Data</h2>
              <p style={{ margin: 0 }}>
                Data is used to authenticate users, route payment intents,
                protect sessions, comply with security and regulatory
                obligations, and improve service reliability.
              </p>
            </div>

            <div style={sectionStyle}>
              <h2 style={{ margin: 0, fontSize: "20px" }}>How Google User Data Is Stored</h2>
              <p style={{ margin: 0 }}>
                For Google-authenticated users, we store only the minimum data
                required for account operations inside Smith-Heffa Paygate, which
                can include the user&apos;s email address, display name, the fact
                that Google was used as the authentication provider, an internal
                session record, and a security audit log entry related to the
                sign-in event.
              </p>
              <p style={{ margin: 0 }}>
                We do not intentionally store Google passwords. We do not
                intentionally retain Google refresh tokens for long-term offline
                access in this sign-in flow. We do not sell Google user data.
              </p>
            </div>

            <div style={sectionStyle}>
              <h2 style={{ margin: 0, fontSize: "20px" }}>How Google User Data Is Shared</h2>
              <p style={{ margin: 0 }}>
                Google user data is shared only when necessary to operate the
                service, maintain security, or comply with applicable law. This
                may include trusted infrastructure, authentication, hosting,
                logging, and compliance subprocessors acting on our behalf under
                confidentiality and security obligations. We do not use Google
                user data for advertising or data brokerage.
              </p>
            </div>

            <div style={sectionStyle}>
              <h2 style={{ margin: 0, fontSize: "20px" }}>AI / Model Training Disclosure</h2>
              <p style={{ margin: 0 }}>
                Google user data obtained through Google Sign-In is not used to
                train generalized artificial intelligence or machine learning
                models.
              </p>
            </div>

            <div style={sectionStyle}>
              <h2 style={{ margin: 0, fontSize: "20px" }}>Third-Party Services</h2>
              <p style={{ margin: 0 }}>
                Depending on the selected flow, Smith-Heffa Paygate may
                interact with providers such as Google, Interac, Stripe,
                PayPal, Apple, telecom operators, and banking or identity
                verification partners.
              </p>
            </div>

            <div style={sectionStyle}>
              <h2 style={{ margin: 0, fontSize: "20px" }}>Security</h2>
              <p style={{ margin: 0 }}>
                We apply session hardening, transport encryption, access
                controls, signed audit trails, and least-privilege operational
                practices to protect data.
              </p>
            </div>

            <div style={sectionStyle}>
              <h2 style={{ margin: 0, fontSize: "20px" }}>User Controls</h2>
              <p style={{ margin: 0 }}>
                Users may choose not to use Google Sign-In and instead use other
                supported authentication methods where available. Users may also
                contact Buttertech Inc. to request account review, correction,
                or deletion, subject to legal, security, and financial record
                retention requirements.
              </p>
              <p style={{ margin: 0 }}>
                Account and eligible personal-data deletion requests can be
                submitted at <a href="/account/delete">/account/delete</a>.
              </p>
            </div>

            <div style={sectionStyle}>
              <h2 style={{ margin: 0, fontSize: "20px" }}>Contact</h2>
              <p style={{ margin: 0 }}>
                For privacy requests or compliance questions, contact Buttertech
                Inc. via <a href="https://www.buttertech.io">buttertech.io</a>.
              </p>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
