# Security Specification — Receivables Ledger (ذِمم)

## 1. Data Invariants
1. **Strict Ownership Isolation**: Every `Debt` and `Payment` document is owned by a single verified user (`ownerId == request.auth.uid`). No user can read, list, create, update, or delete another user's records.
2. **No Blanket Queries**: `allow list` on `/debts` and `/debts/{debtId}/payments` explicitly evaluates `resource.data.ownerId == request.auth.uid` so un-scoped queries are rejected by Firestore itself. `allow list` on `/users` is strictly `false`.
3. **Immutable Identity & Timestamps**: `ownerId`, `uid`, `debtId`, and `createdAt` cannot be modified after creation. `createdAt` and `updatedAt` must equal `request.time`.
4. **Financial Consistency & Atomicity**:
   - `totalAmount` must be strictly positive (`> 0`).
   - `paidAmount` must satisfy `0 <= paidAmount <= totalAmount`.
   - `status` must strictly match the balance state: `'محصل'` iff `paidAmount == totalAmount`, `'جزئي'` iff `0 < paidAmount < totalAmount`, and `'نشط'` iff `paidAmount == 0`.
   - Logging a `Payment` MUST atomically update the parent `Debt`'s `paidAmount` in the same `writeBatch` (`getAfter` verification).
5. **Terminal State Locking**: Once a `Debt` reaches `status == 'محصل'`, no further mutations or payment additions are permitted on it (deletion remains permitted for owner cleanup of mistaken records).
6. **Verified Identity & Strict Schema**: All writes require `request.auth != null && request.auth.token.email_verified == true`, strict `hasAll`/`hasOnly` key checks, bounded string lengths, and regex ID validation (`^[a-zA-Z0-9_\-]+$`).

## 2. Adversarial "Dirty Dozen" Payloads (All Must Return PERMISSION_DENIED)
1. **Identity Spoofing**: Creating a `/debts/{id}` with `ownerId: "other-uid"`.
2. **Ghost / Shadow Field Injection**: Creating a `/debts/{id}` with an extra field `isAdmin: true`.
3. **Unverified Email**: Writing any document when `request.auth.token.email_verified == false`.
4. **Negative / Zero Debt**: Creating a `/debts/{id}` with `totalAmount: -500` or `totalAmount: 0`.
5. **Overpayment Corruption**: Creating or updating a `/debts/{id}` with `paidAmount > totalAmount`.
6. **Status State Desync**: Creating a `/debts/{id}` with `paidAmount: 0` and `status: "محصل"`.
7. **Terminal State Bypass**: Updating a `/debts/{id}` whose existing `status == "محصل"`.
8. **Timestamp Forgery**: Creating a `/debts/{id}` with a backdated client `createdAt` instead of `request.time`.
9. **Orphaned / Desynced Payment**: Creating a `/debts/{debtId}/payments/{paymentId}` without atomically incrementing the parent debt's `paidAmount` via `writeBatch`.
10. **Cross-Owner Payment Injection**: Creating a `/debts/{debtId}/payments/{paymentId}` under another user's `debtId`.
11. **Resource Exhaustion / ID Poisoning**: Creating a document with a 300-char ID or 10KB `notes` string (`> 500` chars).
12. **Blanket User Enumeration / Query Scraping**: Calling `list` on `/users` or querying `/debts` without `where("ownerId", "==", auth.uid)`.
