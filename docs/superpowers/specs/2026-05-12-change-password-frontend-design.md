# Change Password — Public Flow Design

**Date:** 2026-05-12
**Scope:** Backend endpoint change + new frontend page + test adjustments

## Overview

Add a "Change Password" flow accessible from the login page, without requiring the user to be authenticated first. A new public page `/change-password` collects username, current password, and new password. The backend endpoint is modified to accept unauthenticated requests by including `username` in the body.

## Backend

### Endpoint change: `PATCH /api/users/password`

- **Remove** `BearerAuth` security requirement.
- **New request body:** `{ username, currentPassword, newPassword }`
  - `username`: required, string, minLength 3
  - `currentPassword`: required, string
  - `newPassword`: required, string, minLength 8, must contain letters and numbers
- **Responses** (unchanged codes, updated logic):
  - `200` — password updated successfully
  - `400` — validation error (missing/invalid fields)
  - `401` — wrong current password
  - `404` — username not found

### Layers affected

| Layer | Change |
|---|---|
| `userValidator.js` | Add `username` validation to change-password rules |
| `userService.changePassword` | Accept `{ username, currentPassword, newPassword }`; look up user by username instead of from `req.user` |
| `userController.changePassword` | Read `username` from `req.body` instead of `req.user` |
| `userRouter.js` | Remove `authMiddleware` from `PATCH /api/users/password` |
| `swagger.json` | Remove `security` from endpoint; add `username` to `ChangePasswordRequest` schema |

### Backend tests — adjust existing

- **Unit** (`userService.test.js`): update `changePassword` test cases to pass `username` in payload instead of relying on authenticated user context.
- **API** (`users.api.test.js`): remove `Authorization` header from change-password requests; add `username` to request body.
- **Integration**: verify `findByUsername` is exercised; adjust any fixture that assumed auth context.

### Backend tests — new cases

- Unit: `username` not found → 404
- Unit: wrong `currentPassword` → 401
- Unit: `newPassword` too short or no letters/numbers → 400
- API: request missing `username` → 400

## Frontend

### New route

```
/change-password   →   ChangePasswordPage.vue   (meta: { public: true })
```

Added to `router/index.js`. Lazy-loaded.

### `ChangePasswordPage.vue`

Same visual card style as `LoginPage` and `RegisterPage` (`bg-gray-800 border border-gray-700 rounded-2xl`).

**Form fields:**
1. `username` (text)
2. `currentPassword` (password)
3. `newPassword` (password)
4. `confirmNewPassword` (password)

**Client-side validation (in order):**
1. All fields required
2. `newPassword` minLength 8
3. `newPassword` must contain letters and numbers
4. `newPassword === confirmNewPassword`

**Submit flow:**
1. Clear errors, set `isSubmitting = true`
2. Call `authStore.changePassword({ username, currentPassword, newPassword })`
3. On success → `router.push({ path: '/login', query: { passwordChanged: '1' } })`
4. On error → show localized error banner (red, same pattern as other pages)
5. `finally` → `isSubmitting = false`

**Footer link:** "Remembered your password? Login" → `/login`

### `authStore.js`

New private function `doChangePassword({ username, currentPassword, newPassword })`:
- Plain `fetch('PATCH', '/api/users/password', { username, currentPassword, newPassword })` — no `useApi`, no auth header
- Throws `Error(data.error)` on non-ok response
- Exposed as `changePassword` in the store's return object

### `LoginPage.vue`

Two changes:
1. **Link** below "Don't have an account?" — "Forgot password? Change it" → `/change-password`
2. **Success banner** for `?passwordChanged=1` — same `<Transition>` animation and auto-dismiss (3s) pattern as `registered` and `loggedOut` banners

### i18n (`useI18n.js`)

New keys in both `en-GB` and `pt-BR`:

| Key | en-GB | pt-BR |
|---|---|---|
| `changePassword.title` | Change Password | Alterar Senha |
| `changePassword.submit` | Change password | Alterar senha |
| `changePassword.changingPassword` | Changing password... | Alterando senha... |
| `changePassword.successRedirect` | Password changed. Redirecting to login... | Senha alterada. Redirecionando... |
| `changePassword.backToLogin` | Back to login | Voltar para o login |
| `fields.currentPassword` | Current password | Senha atual |
| `fields.newPassword` | New password | Nova senha |
| `fields.confirmNewPassword` | Confirm new password | Confirmar nova senha |
| `login.passwordChanged` | Password changed successfully. You can now sign in. | Senha alterada com sucesso. Você já pode entrar. |
| `login.forgotPassword` | Forgot your password? | Esqueceu sua senha? |
| `login.changeIt` | Change it | Altere aqui |
| `validation.passwordsDoNotMatch` | Passwords do not match | As senhas não coincidem |

**Localized errors** (added to `localizedErrorMessages['pt-BR']`):
- `'User not found'` → `'Usuário não encontrado'`
- `'Current password is incorrect'` → `'Senha atual incorreta'`

### Frontend tests — new (Vitest)

**`ChangePasswordPage.test.js`:**
- Renders all 4 fields and submit button
- Validation: shows error if passwords don't match
- Validation: shows error if newPassword < 8 chars
- Validation: shows error if newPassword has no numbers
- Submit: calls `authStore.changePassword` with correct args
- Submit: redirects to `/login?passwordChanged=1` on success
- Submit: shows localized error on failure
- Submit button disabled while submitting

**`LoginPage.test.js` (additions):**
- Link to `/change-password` is rendered
- Banner with `passwordChanged` message appears when `?passwordChanged=1` query param is present
- Banner auto-dismisses after 3s

## Out of scope

- Email-based password reset (no email infrastructure)
- Password strength meter
- Account lockout after failed attempts
