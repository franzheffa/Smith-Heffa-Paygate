import {
  rejectNonPost,
  storePrivacyRequest,
  validateDataDeletionRequest,
} from "../../../lib/privacy-requests";

export default async function handler(req, res) {
  if (rejectNonPost(req, res)) return;

  try {
    const result = validateDataDeletionRequest(req);
    if (result.error) {
      return res.status(400).json({ ok: false, error: result.error });
    }

    await storePrivacyRequest(req, {
      action: "delete_data_request",
      accountEmail: result.data.accountEmail,
      payload: {
        requestType: "data_deletion",
        fullName: result.data.fullName,
        accountEmail: result.data.accountEmail,
        phoneNumber: result.data.phoneNumber || null,
        dataCategories: result.data.dataCategories,
        notes: result.data.notes || null,
        confirmationChecked: true,
      },
    });

    return res.status(201).json({
      ok: true,
      message:
        "Your data deletion request has been received. Buttertech Inc. may contact you to verify your identity before processing the request.",
    });
  } catch {
    return res.status(500).json({ ok: false, error: "Internal server error." });
  }
}
