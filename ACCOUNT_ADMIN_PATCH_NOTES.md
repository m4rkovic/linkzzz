# Linkzzz Account + Admin frontend completion

## Account
- Added responsive subscription, usage and account information modules.
- Added Change Password modal with frontend validation and password rules.
- Mock success state is explicitly labelled as frontend-only.

## Admin user details
- Added reset-password modal using Web Crypto for temporary password generation.
- Added account suspend/reactivate workflow.
- Added slug editing with reserved-slug validation.
- Added public-profile and analytics navigation actions.
- Added public-profile enable/disable controls.
- Added plan changes, renewal, cancel-at-period-end, resume and immediate-stop controls.
- Added Premium Plus -> Premium warning when the user has more than 40 links. Existing links are preserved.
- Added administrative history presentation for mock audit events.
- Added reusable confirmation dialog for destructive/sensitive actions.
- Kept all actions frontend-only. Real authz, credential mutation, DB writes and audit logging must be server-side later.

## Structure
New reusable modules live under:
- `src/components/account/`
- `src/components/admin/user/`
- `src/components/admin/ui/`
- `src/features/account/`
- `src/features/admin/`
