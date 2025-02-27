import { capitalize } from "inflection";
import { SAMPLE_DB_ID } from "__support__/e2e/cypress_data";
export function enableActionsForDB(dbId = SAMPLE_DB_ID) {
  return cy.request("PUT", `/api/database/${dbId}`, {
    settings: {
      "database-enable-actions": true,
    },
  });
}

export function fillActionQuery(query) {
  cy.get(".ace_content").type(query, { parseSpecialCharSequences: false });
}
/**
 *
 * @param {import("metabase/entities/actions/actions").CreateQueryActionParams} actionDetails
 */
export function createAction(actionDetails) {
  return cy.request("POST", "/api/action", actionDetails);
}

/**
 * create a single implicit action of the given kind for the given model
 *
 * @param {Object} actionParams
 * @param {"create" | "update" | "delete "} actionParams.kind
 * @param {number} actionParams.model_id
 */
export function createImplicitAction({ model_id, kind }) {
  return createAction({
    kind: `row/${kind}`,
    name: capitalize(kind),
    type: "implicit",
    model_id,
  });
}

/**
 * create all implicit actions for the given model
 *
 * @param {object} actionParams
 * @param {number} actionParams.model_id
 */
export function createImplicitActions({ modelId }) {
  createImplicitAction({ modelId, kind: "create" });
  createImplicitAction({ modelId, kind: "update" });
  createImplicitAction({ modelId, kind: "delete" });
}
