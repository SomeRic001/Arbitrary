# Prompt for Nemotron 3 Ultra: Generate Testing & Analysis Chapter (Markdown)

---

## Role and Mode

You are acting as a technical writer producing a chapter of a company product's technical/QA report. This is a **document generation task, not a code analysis or reasoning task** — do not show your reasoning, do not think out loud, and do not explain your approach. Output ONLY the final Markdown document described below, with no preamble, no "<think>" blocks, no commentary before or after.

You have full context of the codebase. Use that knowledge to populate the tables and descriptions below with content specific to this project — not generic placeholders.

---

## Hard Constraints (read before writing anything)

1. Output format is **Markdown only**. No LaTeX commands of any kind (the document may be converted to `.tex` later by a separate tool).
2. Every detailed test table MUST have its **Actual** and **Result** fields left as **completely empty cells**. Do not write "Pass", "Fail", "TBD", "N/A", "Not yet tested", or anything else in those two fields — just an empty cell.
3. Do **not** assess, predict, or imply any test outcome anywhere in the document. No pass/fail language, no "this is expected to fail", no analysis of results.
4. Do **not** include a Critical Analysis, summary, or conclusions section. Stop after the last detailed API test.
5. Do not include screenshots, figure references, or images.
6. Do not invent a project name placeholder like "[Project Name]" — derive all content (module names, endpoints, features, user roles) from the actual codebase.
7. Follow the heading levels exactly: `##` for Section 4, `###` for 4.1–4.5, `####` for individual test entries.

---

## Document Structure to Produce

### 4.1 Test Plan

#### 4.1.1 Unit Testing — Test Plan
- One short paragraph defining unit testing and its role in this project.
- A two-column Markdown table: **Test ID** | **Objective**.
- IDs: `UT-01`, `UT-02`, ... sequential.
- Cover every meaningful module: authentication, role-based access control, each core feature, input validation, error handling, edge cases, and any AI/ML or third-party integrations present in the codebase.
- Produce 30–40 rows. Some objectives should target known edge cases or validations that may not be fully implemented — phrase these as neutral test objectives (what is being checked), not as predictions of failure.

#### 4.1.2 Integration Testing — Test Plan
- One short paragraph defining integration testing and why it matters here: verifying that individual modules/services/components work correctly together (without necessarily covering a full user journey through the UI).
- Two-column table: **Test ID** | **Objective**.
- IDs: `INT-01`, `INT-02`, ...
- Each row covers interaction between two or more components, services, or layers (e.g., service-to-service calls, database + business logic, backend + third-party integration), not necessarily a full UI flow.
- Produce 8–12 rows.

#### 4.1.3 End-to-End (E2E) Testing — Test Plan
- One short paragraph defining E2E testing and why it matters here: verifying complete user-facing flows from start to finish, through the full stack (UI/API → backend → database → response), often spanning multiple user roles.
- Two-column table: **Test ID** | **Objective**.
- IDs: `E2E-01`, `E2E-02`, ...
- Each row describes a complete real-world user journey (e.g., registration through to completing a core task, or a multi-role workflow such as one user creating something and another approving/consuming it).
- Produce 8–12 rows.

#### 4.1.4 API Testing — Test Plan
- One short paragraph defining API testing and its importance.
- Two-column table: **Test ID** | **Objective**.
- IDs: `APIT-01`, `APIT-02`, ...
- Cover authentication routes, CRUD operations, authorization checks (valid token / no token / wrong role), error responses (400/401/403/404), and any ML/prediction endpoints.
- Produce 15–25 rows.

---

### 4.2 Unit Testing (Detailed Test Specifications)

For **every** row in 4.1.1, output one block in exactly this shape:

```
#### 4.2.X Test UT-XX: [Title]

| Field        | Detail |
|--------------|--------|
| **Test ID**  | UT-XX |
| **Module**   | [Module name] |
| **Objective**| [What this test verifies] |
| **Action**   | [Step-by-step actions to perform] |
| **Expected** | [What should happen if the system behaves correctly] |
| **Actual**   |  |
| **Result**   |  |
```

Write **Action** as concise step-by-step prose or short clauses. Leave **Actual** and **Result** as empty table cells (a single space after the pipe is fine, nothing more).

---

### 4.3 Integration Testing (Detailed Test Specifications)

For **every** row in 4.1.2, output:

```
#### 4.3.X Test INT-XX: [Title]

| Field        | Detail |
|--------------|--------|
| **Test ID**  | INT-XX |
| **Objective**| [Which components/services are being verified together] |
| **Action**   | [Steps to trigger the interaction between components] |
| **Expected** | [Expected correct interaction/result] |
| **Actual**   |  |
| **Result**   |  |
```

Leave **Actual** and **Result** empty.

---

### 4.4 End-to-End Testing (Detailed Test Specifications)

For **every** row in 4.1.3, output:

```
#### 4.4.X Test E2E-XX: [Title]

| Field        | Detail |
|--------------|--------|
| **Test ID**  | E2E-XX |
| **Objective**| [Full user journey/flow being verified] |
| **Action**   | [Steps a user (or multiple users/roles) take, in order, through the system] |
| **Expected** | [Expected end state after completing the flow] |
| **Actual**   |  |
| **Result**   |  |
```

Leave **Actual** and **Result** empty.

---

### 4.5 API Testing (Detailed Test Specifications)

For **every** row in 4.1.4, output:

```
#### 4.5.X Test APIT-XX: [Title]

| Field            | Detail |
|------------------|--------|
| **Test ID**      | APIT-XX |
| **Objective**    | [What endpoint/behavior is being tested] |
| **Method**       | GET / POST / PUT / DELETE / PATCH |
| **Endpoint**     | `/path/to/endpoint` |
| **Authorization**| Bearer token / No token / Admin token |
| **Request Body** | `{ ... }` or N/A |
| **Expected**     | HTTP status + description of expected response |
| **Actual**       |  |
| **Result**       |  |
```

- For any endpoint with authorization, include separate rows in 4.1.4/4.5 for: valid token, missing token, wrong role.
- For any CRUD endpoint, include separate rows for: valid input, missing required field, invalid/non-existent ID.
- Leave **Actual** and **Result** empty.

---

## Worked Examples (match this style exactly)

**Test plan row:**

| Test ID | Objective |
|---------|-----------|
| UT-01 | Verify that an unregistered user cannot log in to the system |
| UT-02 | Verify that a new user can be registered with valid credentials |
| UT-03 | Verify that login fails with an incorrect password |

**Detailed unit test:**

#### 4.2.1 Test UT-01: Unregistered user cannot log in

| Field | Detail |
|-------|--------|
| **Test ID** | UT-01 |
| **Module** | Authentication |
| **Objective** | Verify that an unregistered user cannot log in to the system |
| **Action** | Navigate to the login page. Enter an email not present in the database. Enter any password. Submit the form. |
| **Expected** | Login fails with an appropriate error message such as "User not found" |
| **Actual** |  |
| **Result** |  |

**Detailed integration test:**

#### 4.3.1 Test INT-01: Order service correctly calls payment service

| Field | Detail |
|-------|--------|
| **Test ID** | INT-01 |
| **Objective** | Verify that placing an order triggers a correctly formed request to the payment service and handles its response |
| **Action** | Create an order via the order module with a valid cart. Observe the request sent to the payment service. Simulate a successful payment response. |
| **Expected** | Order status updates to "paid" and order record reflects the payment confirmation from the payment service |
| **Actual** |  |
| **Result** |  |

**Detailed E2E test:**

#### 4.4.1 Test E2E-01: New user completes registration and creates first project

| Field | Detail |
|-------|--------|
| **Test ID** | E2E-01 |
| **Objective** | Verify a new user can register, log in, and complete a core first-use action |
| **Action** | Register a new account with valid details. Verify email/confirm account if required. Log in. Navigate to the dashboard. Create a new project/item using the primary feature. |
| **Expected** | User account is created, login succeeds, and the new project/item appears in the user's dashboard |
| **Actual** |  |
| **Result** |  |

**Detailed API test:**

#### 4.5.1 Test APIT-01: Login with valid credentials

| Field | Detail |
|-------|--------|
| **Test ID** | APIT-01 |
| **Objective** | Verify a registered user can log in and receive a token |
| **Method** | POST |
| **Endpoint** | `/auth/login` |
| **Authorization** | None |
| **Request Body** | `{"email": "user@example.com", "password": "password123"}` |
| **Expected** | HTTP 200 with `access_token` and `refresh_token` in the response |
| **Actual** |  |
| **Result** |  |

---

## Final Checklist (verify before producing output)

- [ ] Output starts with `## 4. Testing & Analysis` and ends after the last APIT detailed test — no analysis/conclusion section.
- [ ] No LaTeX syntax anywhere.
- [ ] Every detailed table has empty **Actual** and **Result** cells — zero exceptions.
- [ ] No word "Pass" or "Fail" appears anywhere in the document.
- [ ] Integration tests (INT-XX) focus on component/service interactions, not full user journeys.
- [ ] E2E tests (E2E-XX) focus on complete, realistic user-facing flows, potentially spanning multiple roles.
- [ ] All module names, endpoints, user roles, and feature descriptions are specific to this codebase, not generic.
- [ ] Tone is formal/professional throughout.
- [ ] No commentary, reasoning, or notes outside the Markdown document itself.

---

*End of prompt*
