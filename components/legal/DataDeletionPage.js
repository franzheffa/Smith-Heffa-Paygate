import Head from "next/head";
import { useMemo, useState } from "react";
import { buildCanonicalUrl } from "../../lib/public-url";

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

const inputStyle = {
  width: "100%",
  minHeight: "52px",
  padding: "14px 16px",
  borderRadius: "14px",
  border: "1px solid #d4d4d8",
  backgroundColor: "#fff",
  color: "#111",
  fontSize: "15px",
  boxSizing: "border-box",
};

const checkboxRowStyle = {
  display: "flex",
  alignItems: "flex-start",
  gap: "12px",
  padding: "14px 16px",
  borderRadius: "14px",
  border: "1px solid #e5e7eb",
  backgroundColor: "#fafafa",
};

function initialDataCategories() {
  return {
    profileData: false,
    contactData: false,
    authData: false,
    activityData: false,
    otherPersonalData: false,
  };
}

export default function DataDeletionPage({ mode = "account", canonicalPath }) {
  const isAccountPage = mode === "account";
  const pathname = canonicalPath || (isAccountPage ? "/delete-account" : "/delete-data");
  const title = isAccountPage
    ? "Delete Your Account | Smith-Heffa Paygate"
    : "Delete Data | Smith-Heffa Paygate";
  const description = isAccountPage
    ? "Request deletion of your Smith-Heffa Paygate account and associated personal data."
    : "Request deletion of eligible personal data associated with Smith-Heffa Paygate.";

  const [fullName, setFullName] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [confirmationChecked, setConfirmationChecked] = useState(false);
  const [website, setWebsite] = useState("");
  const [dataCategories, setDataCategories] = useState(initialDataCategories);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const startedAt = useMemo(() => Date.now(), []);

  const successMessage = isAccountPage
    ? "Your deletion request has been received. Buttertech Inc. may contact you to verify your identity before processing the request."
    : "Your data deletion request has been received. Buttertech Inc. may contact you to verify your identity before processing the request.";

  const apiPath = isAccountPage
    ? "/api/privacy/delete-account"
    : "/api/privacy/delete-data";

  function updateDataCategory(key) {
    setDataCategories((current) => ({ ...current, [key]: !current[key] }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setStatus({ type: "", message: "" });

    const payload = {
      fullName,
      accountEmail,
      phoneNumber,
      confirmationChecked,
      website,
      startedAt,
      ...(isAccountPage
        ? { reason }
        : {
            dataCategories: Object.entries(dataCategories)
              .filter(([, enabled]) => enabled)
              .map(([key]) => key),
            notes,
          }),
    };

    try {
      const response = await fetch(apiPath, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "xmlhttprequest",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => ({
        ok: false,
        error: "Unexpected server response.",
      }));

      if (!response.ok || !result.ok) {
        setStatus({
          type: "error",
          message: result.error || "Unable to submit your request right now.",
        });
        return;
      }

      setStatus({ type: "success", message: successMessage });
      setFullName("");
      setAccountEmail("");
      setPhoneNumber("");
      setReason("");
      setNotes("");
      setConfirmationChecked(false);
      setWebsite("");
      setDataCategories(initialDataCategories());
    } catch {
      setStatus({
        type: "error",
        message: "Unable to submit your request right now.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content={description} />
        <link rel="canonical" href={buildCanonicalUrl(pathname)} />
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
            maxWidth: "920px",
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
              {isAccountPage
                ? "Delete your Smith-Heffa Paygate account"
                : "Delete your Smith-Heffa Paygate data"}
            </h1>
            <p style={{ margin: "10px 0 0", color: "#a1a1aa", fontSize: "15px" }}>
              Smith-Heffa Paygate · Buttertech Inc.
            </p>
          </section>

          <section
            style={{
              padding: "32px",
              display: "grid",
              gap: "24px",
              lineHeight: 1.7,
            }}
          >
            <div style={sectionStyle}>
              <p style={{ margin: 0 }}>
                {isAccountPage
                  ? "Users may request deletion of their Smith-Heffa Paygate account and associated personal data."
                  : "Users may request deletion of eligible personal data associated with their Smith-Heffa Paygate account without necessarily deleting the account itself."}
              </p>
            </div>

            {isAccountPage ? (
              <div style={sectionStyle}>
                <h2 style={{ margin: 0, fontSize: "20px" }}>Instructions</h2>
                <ol style={listStyle}>
                  <li>Sign in to your Smith-Heffa Paygate account if access is available.</li>
                  <li>Submit an account deletion request using the form on this page.</li>
                  <li>Buttertech Inc. may verify the identity of the requester before processing the request.</li>
                  <li>After verification, Buttertech Inc. will process the request and delete eligible account and personal-data records.</li>
                  <li>Certain records may be retained where required for legal, regulatory, fraud-prevention, security, accounting, AML/CFT, dispute-resolution, or transaction-record obligations.</li>
                </ol>
              </div>
            ) : (
              <div style={sectionStyle}>
                <h2 style={{ margin: 0, fontSize: "20px" }}>Data retention notice</h2>
                <p style={{ margin: 0 }}>
                  Certain transaction, compliance, fraud-prevention, accounting,
                  security, AML/CFT, or legally required records may be retained
                  for the applicable retention period even after a deletion request.
                </p>
              </div>
            )}

            <section
              aria-labelledby={isAccountPage ? "delete-account-form" : "delete-data-form"}
              style={{
                display: "grid",
                gap: "18px",
                padding: "24px",
                borderRadius: "20px",
                border: "1px solid #e5e7eb",
                backgroundColor: "#fafafa",
              }}
            >
              <div style={sectionStyle}>
                <h2
                  id={isAccountPage ? "delete-account-form" : "delete-data-form"}
                  style={{ margin: 0, fontSize: "20px" }}
                >
                  {isAccountPage ? "Request account deletion" : "Request data deletion"}
                </h2>
                <p style={{ margin: 0, color: "#52525b" }}>
                  Submit only the minimum information needed for Buttertech Inc. to verify and process your request.
                </p>
              </div>

              <form onSubmit={handleSubmit} style={{ display: "grid", gap: "16px" }}>
                <label style={sectionStyle}>
                  <span style={{ fontWeight: 700 }}>Full name</span>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    maxLength={120}
                    required
                    style={inputStyle}
                  />
                </label>

                <label style={sectionStyle}>
                  <span style={{ fontWeight: 700 }}>Account email</span>
                  <input
                    type="email"
                    value={accountEmail}
                    onChange={(event) => setAccountEmail(event.target.value)}
                    maxLength={160}
                    required
                    style={inputStyle}
                  />
                </label>

                <label style={sectionStyle}>
                  <span style={{ fontWeight: 700 }}>Optional phone number</span>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(event) => setPhoneNumber(event.target.value)}
                    maxLength={40}
                    style={inputStyle}
                  />
                </label>

                {isAccountPage ? (
                  <label style={sectionStyle}>
                    <span style={{ fontWeight: 700 }}>Reason (optional)</span>
                    <textarea
                      value={reason}
                      onChange={(event) => setReason(event.target.value)}
                      maxLength={1200}
                      rows={5}
                      style={{ ...inputStyle, minHeight: "140px", resize: "vertical" }}
                    />
                  </label>
                ) : (
                  <>
                    <div style={sectionStyle}>
                      <span style={{ fontWeight: 700 }}>
                        Data categories requested for deletion
                      </span>
                      <div style={{ display: "grid", gap: "12px" }}>
                        <label style={checkboxRowStyle}>
                          <input
                            type="checkbox"
                            checked={dataCategories.profileData}
                            onChange={() => updateDataCategory("profileData")}
                          />
                          <span>Profile data</span>
                        </label>
                        <label style={checkboxRowStyle}>
                          <input
                            type="checkbox"
                            checked={dataCategories.contactData}
                            onChange={() => updateDataCategory("contactData")}
                          />
                          <span>Contact data</span>
                        </label>
                        <label style={checkboxRowStyle}>
                          <input
                            type="checkbox"
                            checked={dataCategories.authData}
                            onChange={() => updateDataCategory("authData")}
                          />
                          <span>Authentication-related account data where eligible</span>
                        </label>
                        <label style={checkboxRowStyle}>
                          <input
                            type="checkbox"
                            checked={dataCategories.activityData}
                            onChange={() => updateDataCategory("activityData")}
                          />
                          <span>Application activity data where eligible</span>
                        </label>
                        <label style={checkboxRowStyle}>
                          <input
                            type="checkbox"
                            checked={dataCategories.otherPersonalData}
                            onChange={() => updateDataCategory("otherPersonalData")}
                          />
                          <span>Other personal data</span>
                        </label>
                      </div>
                    </div>

                    <label style={sectionStyle}>
                      <span style={{ fontWeight: 700 }}>Free-text notes</span>
                      <textarea
                        value={notes}
                        onChange={(event) => setNotes(event.target.value)}
                        maxLength={1500}
                        rows={6}
                        style={{ ...inputStyle, minHeight: "160px", resize: "vertical" }}
                      />
                    </label>
                  </>
                )}

                <label style={{ ...checkboxRowStyle, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={confirmationChecked}
                    onChange={(event) => setConfirmationChecked(event.target.checked)}
                    required
                  />
                  <span>
                    {isAccountPage
                      ? "I understand that this request may permanently delete my Smith-Heffa Paygate account."
                      : "I confirm that I am requesting deletion of eligible personal data associated with this account."}
                  </span>
                </label>

                <input
                  type="text"
                  value={website}
                  onChange={(event) => setWebsite(event.target.value)}
                  autoComplete="off"
                  tabIndex={-1}
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    left: "-9999px",
                    width: "1px",
                    height: "1px",
                    opacity: 0,
                    pointerEvents: "none",
                  }}
                />

                {status.message ? (
                  <div
                    style={{
                      padding: "14px 16px",
                      borderRadius: "14px",
                      border: `1px solid ${status.type === "success" ? "#bbf7d0" : "#fecaca"}`,
                      backgroundColor: status.type === "success" ? "#f0fdf4" : "#fef2f2",
                      color: status.type === "success" ? "#166534" : "#991b1b",
                      fontWeight: 600,
                    }}
                  >
                    {status.message}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    minHeight: "54px",
                    borderRadius: "14px",
                    border: "none",
                    backgroundColor: "#09090b",
                    color: "#fff",
                    fontSize: "15px",
                    fontWeight: 800,
                    cursor: submitting ? "not-allowed" : "pointer",
                  }}
                >
                  {submitting
                    ? "Submitting..."
                    : isAccountPage
                      ? "Request account deletion"
                      : "Request data deletion"}
                </button>
              </form>
            </section>

            <div style={sectionStyle}>
              <h2 style={{ margin: 0, fontSize: "20px" }}>Links</h2>
              <ul style={listStyle}>
                <li>
                  <a href="https://smith-heffa-paygate.ca/legal/privacy">
                    https://smith-heffa-paygate.ca/legal/privacy
                  </a>
                </li>
                <li>
                  <a href="https://smith-heffa-paygate.ca/legal/terms">
                    https://smith-heffa-paygate.ca/legal/terms
                  </a>
                </li>
                <li>
                  <a href="https://smith-heffa-paygate.ca/support">
                    https://smith-heffa-paygate.ca/support
                  </a>
                </li>
                <li>
                  <a href="https://buttertech.io">https://buttertech.io</a>
                </li>
              </ul>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
