/**
 * i9-status-transitions.test.ts
 *
 * Unit tests for validateI9StatusTransition (server/i9Storage.ts) — the
 * single choke point every new-hire request status change goes through.
 * Pure function (a request object + target status + actor role in, an
 * ok/reason verdict out — no DB access), so it's tested directly here rather
 * than only indirectly through the e2e suite. The e2e suite
 * (tests/e2e/i9-workflow.spec.ts) proves the HTTP layer wires this up
 * correctly; these tests pin down the decision logic itself, including edge
 * cases that would be slow/awkward to set up end-to-end.
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";

process.env.PROTECTED_DATA_ENCRYPTION_KEY ||= Buffer.alloc(32, 7).toString("base64");

const { validateI9StatusTransition } = await import("../../server/i9Storage.ts");

/** Builds a minimal I9NewHireRequest-shaped object with sane defaults,
 *  overridable per test. Only the fields validateI9StatusTransition actually
 *  reads need to be realistic. */
function makeRequest(overrides: Record<string, unknown> = {}) {
  return {
    id: "req-1",
    internalRequestNumber: "NHR-000001",
    clientCompanyId: "company-1",
    hiringSiteId: "site-1",
    clientSubmitterUserId: "user-1",
    assignedLbsProcessorUserId: null,
    serviceRequested: "E-Verify case creation and processing",
    firstDayOfEmploymentForPay: "2026-08-10",
    formI9Section1CompletedDate: null,
    formI9Section2CompletedDate: null,
    section2LateReason: null,
    attestJobOfferAccepted: true,
    attestNotPreScreening: true,
    attestEmployeeChoseDocuments: true,
    attestListBHasPhoto: null,
    attestInformationAccurate: true,
    attestParticipatingHiringSite: true,
    clientNotes: null,
    status: "draft",
    everifyCaseNumber: null,
    everifyCaseCreatedAt: null,
    everifyInitialResult: null,
    caseNumberRecordedOnI9: null,
    caseDetailsPageDelivered: null,
    linkedPriorRequestId: null,
    createdAt: null,
    updatedAt: null,
    ...overrides,
  } as any;
}

describe("draft -> submitted (attestation gate)", () => {
  test("succeeds when every required attestation is true", () => {
    const result = validateI9StatusTransition(makeRequest(), "submitted", "client_authorized_signer");
    assert.equal(result.ok, true);
  });

  for (const field of ["attestJobOfferAccepted", "attestNotPreScreening", "attestEmployeeChoseDocuments", "attestInformationAccurate", "attestParticipatingHiringSite"]) {
    test(`fails when ${field} is false`, () => {
      const result = validateI9StatusTransition(makeRequest({ [field]: false }), "submitted", "client_authorized_signer");
      assert.equal(result.ok, false);
      assert.ok((result as any).reason.length > 0);
    });
  }

  test("attestListBHasPhoto is not required (null/N-A is a valid state)", () => {
    const result = validateI9StatusTransition(makeRequest({ attestListBHasPhoto: null }), "submitted", "client_authorized_signer");
    assert.equal(result.ok, true);
  });

  test("client_limited_user may submit their own company's request", () => {
    const result = validateI9StatusTransition(makeRequest(), "submitted", "client_limited_user");
    assert.equal(result.ok, true);
  });

  test("LBS staff may also submit on a client's behalf", () => {
    const result = validateI9StatusTransition(makeRequest(), "submitted", "lbs_case_processor");
    assert.equal(result.ok, true);
  });
});

describe("-> ready_for_case_creation (second-review gate)", () => {
  test("fails without secondReviewConfirmed", () => {
    const result = validateI9StatusTransition(makeRequest({ status: "submitted" }), "ready_for_case_creation", "lbs_case_processor", {});
    assert.equal(result.ok, false);
    assert.match((result as any).reason, /second review/i);
  });

  test("succeeds with secondReviewConfirmed from submitted", () => {
    const result = validateI9StatusTransition(makeRequest({ status: "submitted" }), "ready_for_case_creation", "lbs_case_processor", { secondReviewConfirmed: true });
    assert.equal(result.ok, true);
  });

  test("succeeds with secondReviewConfirmed from deficient_client_action_required", () => {
    const result = validateI9StatusTransition(makeRequest({ status: "deficient_client_action_required" }), "ready_for_case_creation", "lbs_program_admin", { secondReviewConfirmed: true });
    assert.equal(result.ok, true);
  });

  test("fails from an unrelated prior status even with confirmation", () => {
    const result = validateI9StatusTransition(makeRequest({ status: "draft" }), "ready_for_case_creation", "lbs_program_admin", { secondReviewConfirmed: true });
    assert.equal(result.ok, false);
  });

  test("client roles cannot perform this transition regardless of the confirmation flag", () => {
    const result = validateI9StatusTransition(makeRequest({ status: "submitted" }), "ready_for_case_creation", "client_authorized_signer", { secondReviewConfirmed: true });
    assert.equal(result.ok, false);
    assert.match((result as any).reason, /LBS staff/i);
  });
});

describe("government-result states require LBS staff", () => {
  const govStates = [
    "case_created", "employment_authorized", "needs_more_time",
    "mismatch_employee_decision_pending", "mismatch_employee_taking_action", "mismatch_employee_not_taking_action",
    "referred_to_dhs", "referred_to_ssa", "referred_to_dhs_and_ssa",
    "case_in_continuance", "final_nonconfirmation",
  ];

  for (const status of govStates) {
    test(`client_authorized_signer cannot set status to ${status}`, () => {
      const result = validateI9StatusTransition(makeRequest({ status: "ready_for_case_creation" }), status, "client_authorized_signer");
      assert.equal(result.ok, false);
    });

    test(`lbs_program_admin can set status to ${status}`, () => {
      const result = validateI9StatusTransition(makeRequest({ status: "ready_for_case_creation" }), status, "lbs_program_admin");
      assert.equal(result.ok, true);
    });
  }
});

describe("deficient_client_action_required requires LBS staff", () => {
  test("client cannot flag their own request as deficient", () => {
    const result = validateI9StatusTransition(makeRequest({ status: "submitted" }), "deficient_client_action_required", "client_authorized_signer");
    assert.equal(result.ok, false);
  });

  test("LBS case processor can flag a request as deficient", () => {
    const result = validateI9StatusTransition(makeRequest({ status: "submitted" }), "deficient_client_action_required", "lbs_case_processor");
    assert.equal(result.ok, true);
  });
});

describe("unknown status is always rejected", () => {
  test("rejects a status string that isn't in I9_REQUEST_STATUSES", () => {
    const result = validateI9StatusTransition(makeRequest(), "made_up_status", "lbs_program_admin");
    assert.equal(result.ok, false);
    assert.match((result as any).reason, /Unknown status/);
  });
});

describe("clients are otherwise confined to the submit transition", () => {
  test("a client cannot directly set status to closed", () => {
    const result = validateI9StatusTransition(makeRequest({ status: "case_created" }), "closed", "client_authorized_signer");
    assert.equal(result.ok, false);
    assert.match((result as any).reason, /LBS staff/i);
  });

  test("LBS staff can close a request", () => {
    const result = validateI9StatusTransition(makeRequest({ status: "final_nonconfirmation" }), "closed", "lbs_program_admin");
    assert.equal(result.ok, true);
  });
});
