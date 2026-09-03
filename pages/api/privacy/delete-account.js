import {
  rejectNonPost,
  storePrivacyRequest,
  validateAccountDeletionRequest,
} from "../../../lib/privacy-requests";

export default async function handler(req, res) {
  if (rejectNonPost(req, res)) return;

  try {
    const result = validateAccountDeletionRequest(req);
    if (result.error) {
      return res.status(400).json({ ok: false, error: result.error });
    }

    await storePrivacyRequest(req, {
      action: "delete_account_request",
      accountEmail: result.data.accountEmail,
      payload: {
        requestType: "account_deletion",
        fullName: result.data.fullName,
        accountEmail: result.data.accountEmail,
        phoneNumber: result.data.phoneNumber || null,
        reason: result.data.reason || null,
        confirmationChecked: true,
      },
    });

    return res.status(201).json({
      ok: true,
      message:
        "Your deletion request has been received. Buttertech Inc. may contact you to verify your identity before processing the request.",
    });
  } catch {
    return res.status(500).json({ ok: false, error: "Internal server error." });
  }
}
