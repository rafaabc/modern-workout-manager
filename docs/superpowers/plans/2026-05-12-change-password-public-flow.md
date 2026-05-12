# Change Password Public Flow — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow unauthenticated users to change their password from a new public `/change-password` page by supplying their username, current password, and new password.

**Architecture:** The backend `PATCH /api/users/password` endpoint loses its `authMiddleware` and gains a required `username` field in the body; the service already uses `username` internally so only the controller and route change. The frontend gains a `ChangePasswordPage.vue` (same card style as Login/Register), a `changePassword` action on `authStore`, new i18n strings, and a success banner + link on `LoginPage`.

**Tech Stack:** Node.js + Express (backend), Vue 3 + Pinia + Vite + Vitest + Vue Test Utils (frontend), node:test + assert (backend tests).

---

## File Map

**Created:**
- `frontend/src/pages/ChangePasswordPage.vue`
- `frontend/test/unit/pages/ChangePasswordPage.test.js`

**Modified:**
- `backend/src/services/userService.js` — add `validateUsername` check to `changePassword`
- `backend/src/controllers/userController.js` — read `username` from `req.body` instead of `req.user`
- `backend/src/routes/userRoutes.js` — remove `authMiddleware` from `PATCH /password`
- `backend/resources/swagger.json` — update `ChangePasswordRequest` schema, remove security
- `backend/test/unit/services/userService.test.js` — add missing-username test case
- `backend/test/api/auth/auth.test.js` — rewrite `PATCH /api/users/password` describe block
- `frontend/src/composables/useI18n.js` — add change-password strings to both locales
- `frontend/src/stores/authStore.js` — add `doChangePassword` + expose `changePassword`
- `frontend/src/router/index.js` — add `/change-password` public route
- `frontend/src/pages/LoginPage.vue` — add passwordChanged banner + link to /change-password
- `frontend/test/unit/stores/authStore.test.js` — add `changePassword` describe block
- `frontend/test/unit/router/router.test.js` — add `/change-password` guard tests
- `frontend/test/unit/pages/LoginPage.test.js` — add passwordChanged banner + link tests

---

## Task 1: Add `validateUsername` to `userService.changePassword` + unit test

**Files:**
- Modify: `backend/src/services/userService.js:85-108`
- Modify: `backend/test/unit/services/userService.test.js` (add one test inside existing `changePassword` describe)

- [ ] **Step 1: Add the failing test**

Open `backend/test/unit/services/userService.test.js`. Inside `describe('changePassword', ...)`, after the existing `'should throw 400 when newPassword is missing'` test, add:

```js
it('should throw 400 when username is missing', async () => {
  await assert.rejects(
    () =>
      userService.changePassword({
        username: undefined,
        currentPassword: validPassword,
        newPassword: anotherPassword,
      }),
    (err) => {
      assert.equal(err.status, 400);
      return true;
    },
  );
});
```

- [ ] **Step 2: Run the test and confirm it fails**

```bash
node --test backend/test/unit/services/userService.test.js
```

Expected: the new test fails because `changePassword` currently does not validate `username`.

- [ ] **Step 3: Add `validateUsername` at the top of `changePassword` in the service**

In `backend/src/services/userService.js`, replace the `changePassword` method (lines 85–108) with:

```js
async changePassword({ username, currentPassword, newPassword }) {
  const usernameValidation = validateUsername(username);
  if (!usernameValidation.valid) {
    const error = new Error(usernameValidation.error);
    error.status = 400;
    throw error;
  }

  const passwordValidation = validatePassword(newPassword);
  if (!passwordValidation.valid) {
    const error = new Error(passwordValidation.error);
    error.status = 400;
    throw error;
  }

  const user = await userRepository.findByUsername(username);
  if (!user) {
    const error = new Error('User not found');
    error.status = 404;
    throw error;
  }

  if (!verifyPassword(currentPassword, user.password)) {
    const error = new Error('Invalid credentials');
    error.status = 401;
    throw error;
  }

  const hashedPassword = hashPassword(newPassword);
  await userRepository.updatePassword(username, hashedPassword);
},
```

- [ ] **Step 4: Run all unit tests and confirm they pass**

```bash
npm --workspace=backend run test:unit
```

Expected: all tests pass, including the new one.

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/userService.js backend/test/unit/services/userService.test.js
git commit -m "feat: validate username in userService.changePassword"
```

---

## Task 2: Remove `authMiddleware` from route; read `username` from `req.body`

**Files:**
- Modify: `backend/src/controllers/userController.js:29-39`
- Modify: `backend/src/routes/userRoutes.js:10`

- [ ] **Step 1: Update the controller**

In `backend/src/controllers/userController.js`, replace the `changePassword` method:

```js
async changePassword(req, res) {
  try {
    const { username, currentPassword, newPassword } = req.body;
    await userService.changePassword({ username, currentPassword, newPassword });
    return res.status(200).json({ message: 'Password updated successfully' });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ error: err.message });
  }
},
```

- [ ] **Step 2: Update the route**

In `backend/src/routes/userRoutes.js`, replace line 10:

```js
router.patch('/password', userController.changePassword);
```

The full file becomes:

```js
import { Router } from 'express';

export function createUserRoutes(userController) {
  const router = Router();

  router.post('/register', userController.register);
  router.post('/login', userController.login);
  router.post('/logout', userController.logout);
  router.patch('/password', userController.changePassword);

  return router;
}
```

- [ ] **Step 3: Run API tests and observe failures**

```bash
npm --workspace=backend run test:api
```

Expected: the `PATCH /api/users/password` tests fail because they still send `Authorization` headers and omit `username` from the body. The "401 when no token" test also fails since auth is no longer required.

- [ ] **Step 4: Commit the backend code changes (tests still broken)**

```bash
git add backend/src/controllers/userController.js backend/src/routes/userRoutes.js
git commit -m "feat: make PATCH /api/users/password unauthenticated, accept username in body"
```

---

## Task 3: Rewrite API tests for `PATCH /api/users/password`

**Files:**
- Modify: `backend/test/api/auth/auth.test.js:126-234`

- [ ] **Step 1: Replace the entire `PATCH /api/users/password` describe block**

In `backend/test/api/auth/auth.test.js`, replace everything from `describe('PATCH /api/users/password', () => {` through its closing `});` with:

```js
describe('PATCH /api/users/password', () => {
  const originalPassword = randomPassword();
  const newValidPassword = randomPassword();
  const anotherPassword = randomPassword();

  before(async () => {
    await fetch(`${baseUrl}/api/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'changeuser', password: originalPassword }),
    });
  });

  it('should return 200 and update the password', async () => {
    const res = await fetch(`${baseUrl}/api/users/password`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'changeuser',
        currentPassword: originalPassword,
        newPassword: newValidPassword,
      }),
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.message, 'Password updated successfully');
  });

  it('should reject login with old password after change', async () => {
    const res = await fetch(`${baseUrl}/api/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'changeuser', password: originalPassword }),
    });
    assert.equal(res.status, 401);
  });

  it('should allow login with new password after change', async () => {
    const res = await fetch(`${baseUrl}/api/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'changeuser', password: newValidPassword }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(body.token);
  });

  it('should return 400 when username is missing', async () => {
    const res = await fetch(`${baseUrl}/api/users/password`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: newValidPassword, newPassword: anotherPassword }),
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.ok(body.error);
  });

  it('should return 401 for wrong current password', async () => {
    const res = await fetch(`${baseUrl}/api/users/password`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'changeuser',
        currentPassword: randomPassword(),
        newPassword: anotherPassword,
      }),
    });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.ok(body.error);
  });

  it('should return 404 for non-existent username', async () => {
    const res = await fetch(`${baseUrl}/api/users/password`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'nobody',
        currentPassword: randomPassword(),
        newPassword: anotherPassword,
      }),
    });
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.ok(body.error);
  });

  it('should return 400 for invalid new password', async () => {
    const res = await fetch(`${baseUrl}/api/users/password`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'changeuser',
        currentPassword: newValidPassword,
        newPassword: 'weak',
      }),
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.ok(body.error);
  });
});
```

- [ ] **Step 2: Run all backend tests**

```bash
npm run test:backend
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add backend/test/api/auth/auth.test.js
git commit -m "test: update PATCH /api/users/password API tests for unauthenticated flow"
```

---

## Task 4: Update `swagger.json`

**Files:**
- Modify: `backend/resources/swagger.json`

- [ ] **Step 1: Remove `security` from the PATCH endpoint**

In `backend/resources/swagger.json`, in the `"/api/users/password"."patch"` object, remove the line:

```json
"security": [{ "BearerAuth": [] }],
```

The patch object should start:

```json
"patch": {
  "tags": ["Authentication"],
  "summary": "Change password",
  "requestBody": {
```

- [ ] **Step 2: Update `ChangePasswordRequest` schema**

Find the `"ChangePasswordRequest"` schema (near the bottom of the file) and replace it with:

```json
"ChangePasswordRequest": {
  "type": "object",
  "required": ["username", "currentPassword", "newPassword"],
  "properties": {
    "username": { "type": "string", "minLength": 3, "example": "john_doe" },
    "currentPassword": { "type": "string", "example": "OldPass123" },
    "newPassword": { "type": "string", "minLength": 8, "example": "NewPass456" }
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add backend/resources/swagger.json
git commit -m "docs: update swagger for unauthenticated PATCH /api/users/password"
```

---

## Task 5: Add i18n strings

**Files:**
- Modify: `frontend/src/composables/useI18n.js`

- [ ] **Step 1: Add English strings**

In `useI18n.js`, inside `translations['en-GB']`, make the following additions:

In the `fields` object, add three keys:

```js
fields: {
  username: 'Username',
  secret: EN_PASS_LABEL,
  currentPassword: 'Current password',
  newPassword: 'New password',
  confirmNewPassword: 'Confirm new password',
},
```

In the `login` object, add three keys:

```js
login: {
  registerSuccess: 'Registration completed successfully. You can now sign in.',
  noAccount: "Don't have an account?",
  passwordChanged: 'Password changed successfully. You can now sign in.',
  forgotPassword: 'Forgot your password?',
  changeIt: 'Change it',
},
```

In the `validation` object, add one key:

```js
validation: {
  usernameMin: 'Username must be at least 3 characters',
  secretMin: `${EN_PASS_LABEL} must be at least 8 characters`,
  secretLettersNumbers: `${EN_PASS_LABEL} must contain letters and numbers`,
  passwordsDoNotMatch: 'Passwords do not match',
},
```

Add a new top-level `changePassword` object:

```js
changePassword: {
  title: 'Change Password',
  submit: 'Change password',
  changingPassword: 'Changing password...',
  successRedirect: 'Password changed. Redirecting to login...',
  backToLogin: 'Back to login',
},
```

- [ ] **Step 2: Add Portuguese strings**

In `translations['pt-BR']`, apply the same structure:

In `fields`:

```js
fields: {
  username: 'Usuário',
  secret: PT_PASS_LABEL,
  currentPassword: 'Senha atual',
  newPassword: 'Nova senha',
  confirmNewPassword: 'Confirmar nova senha',
},
```

In `login`:

```js
login: {
  registerSuccess: 'Cadastro realizado com sucesso. Você já pode entrar.',
  noAccount: 'Não tem uma conta?',
  passwordChanged: 'Senha alterada com sucesso. Você já pode entrar.',
  forgotPassword: 'Esqueceu sua senha?',
  changeIt: 'Altere aqui',
},
```

In `validation`:

```js
validation: {
  usernameMin: 'Usuário deve ter pelo menos 3 caracteres',
  secretMin: `${PT_PASS_LABEL} deve ter pelo menos 8 caracteres`,
  secretLettersNumbers: `${PT_PASS_LABEL} deve conter letras e números`,
  passwordsDoNotMatch: 'As senhas não coincidem',
},
```

New `changePassword` object:

```js
changePassword: {
  title: 'Alterar Senha',
  submit: 'Alterar senha',
  changingPassword: 'Alterando senha...',
  successRedirect: 'Senha alterada. Redirecionando...',
  backToLogin: 'Voltar para o login',
},
```

- [ ] **Step 3: Add localized error messages**

In the `localizedErrorMessages['pt-BR']` object, add:

```js
'User not found': 'Usuário não encontrado',
'Invalid credentials': 'Credenciais inválidas',
```

- [ ] **Step 4: Run frontend unit tests to confirm nothing broke**

```bash
npm --workspace=frontend run test:unit
```

Expected: all existing tests pass.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/composables/useI18n.js
git commit -m "feat: add change-password i18n strings for en-GB and pt-BR"
```

---

## Task 6: Add `changePassword` to `authStore` + unit tests

**Files:**
- Modify: `frontend/src/stores/authStore.js`
- Modify: `frontend/test/unit/stores/authStore.test.js`

- [ ] **Step 1: Write the failing tests**

In `frontend/test/unit/stores/authStore.test.js`, add a new `describe('changePassword', ...)` block after the `describe('logout', ...)` block:

```js
describe('changePassword', () => {
  it('calls PATCH /api/users/password with correct data', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ message: 'Password updated successfully' }),
    });

    const store = useAuthStore();
    await store.changePassword({
      username: 'testuser',
      currentPassword: pwd,
      newPassword: 'Newpass1x9',
    });

    expect(fetch).toHaveBeenCalledWith('/api/users/password', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'testuser',
        currentPassword: pwd,
        newPassword: 'Newpass1x9',
      }),
    });
  });

  it('throws error on API failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'User not found' }),
    });

    const store = useAuthStore();
    await expect(
      store.changePassword({
        username: 'nobody',
        currentPassword: pwd,
        newPassword: 'Newpass1x9',
      }),
    ).rejects.toThrow('User not found');
  });
});
```

- [ ] **Step 2: Run the tests and confirm they fail**

```bash
npx vitest run frontend/test/unit/stores/authStore.test.js
```

Expected: both new tests fail with "store.changePassword is not a function".

- [ ] **Step 3: Add `doChangePassword` and expose `changePassword`**

In `frontend/src/stores/authStore.js`:

After the `doLogout` function (around line 97), add:

```js
async function doChangePassword({ username, currentPassword, newPassword }) {
  const response = await fetch('/api/users/password', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, currentPassword, newPassword }),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Request failed');
  }

  return response.json();
}
```

Inside `defineStore('auth', () => { ... })`, add after `const logout = ...`:

```js
const changePassword = (credentials) => doChangePassword(credentials);
```

In the `return` object, add `changePassword`:

```js
return {
  token,
  user,
  isAuthenticated,
  login,
  register,
  logout,
  changePassword,
  touchActivity,
  getIdleMs,
  isInactiveSessionExpired,
  inactivityTimeoutMs: timeoutMs,
};
```

- [ ] **Step 4: Run the tests and confirm they pass**

```bash
npx vitest run frontend/test/unit/stores/authStore.test.js
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/stores/authStore.js frontend/test/unit/stores/authStore.test.js
git commit -m "feat: add changePassword action to authStore"
```

---

## Task 7: Add `/change-password` route + router tests

**Files:**
- Modify: `frontend/src/router/index.js`
- Modify: `frontend/test/unit/router/router.test.js`

- [ ] **Step 1: Write the failing router tests**

In `frontend/test/unit/router/router.test.js`, add two tests inside `describe('Router navigation guards', ...)`:

```js
it('allows access to /change-password when not authenticated', async () => {
  await router.push('/change-password');
  expect(router.currentRoute.value.path).toBe('/change-password');
});

it('redirects to / when accessing /change-password while authenticated', async () => {
  const authStore = useAuthStore();
  authStore.token = 'valid-token';

  await router.push('/change-password');
  expect(router.currentRoute.value.path).toBe('/');
});
```

- [ ] **Step 2: Run the tests and confirm they fail**

```bash
npx vitest run frontend/test/unit/router/router.test.js
```

Expected: both new tests fail because `/change-password` is not a registered route.

- [ ] **Step 3: Add the route**

In `frontend/src/router/index.js`, import `ChangePasswordPage` and add the route:

```js
import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/authStore.js';
import LoginPage from '../pages/LoginPage.vue';
import RegisterPage from '../pages/RegisterPage.vue';
import ChangePasswordPage from '../pages/ChangePasswordPage.vue';

const routes = [
  {
    path: '/login',
    name: 'login',
    component: LoginPage,
    meta: { public: true },
  },
  {
    path: '/register',
    name: 'register',
    component: RegisterPage,
    meta: { public: true },
  },
  {
    path: '/change-password',
    name: 'change-password',
    component: ChangePasswordPage,
    meta: { public: true },
  },
  {
    path: '/',
    name: 'dashboard',
    component: () => import('../pages/DashboardPage.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to) => {
  const authStore = useAuthStore();

  if (!to.meta.public && !authStore.isAuthenticated) {
    return { name: 'login' };
  }

  if (to.meta.public && authStore.isAuthenticated) {
    return { name: 'dashboard' };
  }
});

export default router;
```

Note: `ChangePasswordPage` is imported directly (not lazy-loaded) like `LoginPage` and `RegisterPage`. The file doesn't exist yet — the router test will still fail at import time. Proceed to Task 8 to create the file, then come back to verify.

- [ ] **Step 4: Create a placeholder to unblock the router test**

Create `frontend/src/pages/ChangePasswordPage.vue` with a minimal stub so the import resolves:

```vue
<template><div></div></template>
<script setup></script>
```

- [ ] **Step 5: Run the router tests**

```bash
npx vitest run frontend/test/unit/router/router.test.js
```

Expected: all tests pass, including the two new ones.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/router/index.js frontend/src/pages/ChangePasswordPage.vue frontend/test/unit/router/router.test.js
git commit -m "feat: add /change-password public route"
```

---

## Task 8: Implement `ChangePasswordPage.vue` with TDD

**Files:**
- Create: `frontend/test/unit/pages/ChangePasswordPage.test.js`
- Modify: `frontend/src/pages/ChangePasswordPage.vue` (replace the stub from Task 7)

- [ ] **Step 1: Create the test file**

Create `frontend/test/unit/pages/ChangePasswordPage.test.js`:

```js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createMemoryHistory } from 'vue-router';
import ChangePasswordPage from '../../../src/pages/ChangePasswordPage.vue';
import { useAuthStore } from '../../../src/stores/authStore.js';
import { testPassword } from '../../helpers/testCredentials.js';

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/change-password', component: ChangePasswordPage },
      { path: '/login', component: { template: '<div>Login</div>' } },
    ],
  });
}

describe('ChangePasswordPage', () => {
  let pinia;
  let router;
  let pwd;
  let newPwd;

  beforeEach(async () => {
    pwd = testPassword();
    newPwd = testPassword();
    pinia = createPinia();
    setActivePinia(pinia);
    router = createTestRouter();
    router.push('/change-password');
    await router.isReady();
    localStorage.clear();
    vi.restoreAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  function mountPage() {
    return mount(ChangePasswordPage, {
      global: { plugins: [pinia, router] },
    });
  }

  it('renders all four fields and submit button', () => {
    const wrapper = mountPage();
    expect(wrapper.find('#username').exists()).toBe(true);
    expect(wrapper.find('#current-password').exists()).toBe(true);
    expect(wrapper.find('#new-password').exists()).toBe(true);
    expect(wrapper.find('#confirm-new-password').exists()).toBe(true);
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true);
  });

  it('blocks submit when passwords do not match', async () => {
    const wrapper = mountPage();
    const authStore = useAuthStore();
    vi.spyOn(authStore, 'changePassword').mockResolvedValue();

    await wrapper.find('#username').setValue('testuser');
    await wrapper.find('#current-password').setValue(pwd);
    await wrapper.find('#new-password').setValue(newPwd);
    await wrapper.find('#confirm-new-password').setValue('Different1x9');
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(authStore.changePassword).not.toHaveBeenCalled();
    expect(wrapper.find('.error').text()).toBe('Passwords do not match');
  });

  it('blocks submit when new password is too short', async () => {
    const wrapper = mountPage();
    const authStore = useAuthStore();
    vi.spyOn(authStore, 'changePassword').mockResolvedValue();

    await wrapper.find('#username').setValue('testuser');
    await wrapper.find('#current-password').setValue(pwd);
    await wrapper.find('#new-password').setValue('Short1');
    await wrapper.find('#confirm-new-password').setValue('Short1');
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(authStore.changePassword).not.toHaveBeenCalled();
    expect(wrapper.find('.error').text()).toBe('Password must be at least 8 characters');
  });

  it('blocks submit when new password has no numbers', async () => {
    const wrapper = mountPage();
    const authStore = useAuthStore();
    vi.spyOn(authStore, 'changePassword').mockResolvedValue();

    await wrapper.find('#username').setValue('testuser');
    await wrapper.find('#current-password').setValue(pwd);
    await wrapper.find('#new-password').setValue('abcdefgh');
    await wrapper.find('#confirm-new-password').setValue('abcdefgh');
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(authStore.changePassword).not.toHaveBeenCalled();
    expect(wrapper.find('.error').text()).toBe('Password must contain letters and numbers');
  });

  it('calls authStore.changePassword with correct values on valid submit', async () => {
    const wrapper = mountPage();
    const authStore = useAuthStore();
    vi.spyOn(authStore, 'changePassword').mockResolvedValue();

    await wrapper.find('#username').setValue('testuser');
    await wrapper.find('#current-password').setValue(pwd);
    await wrapper.find('#new-password').setValue(newPwd);
    await wrapper.find('#confirm-new-password').setValue(newPwd);
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(authStore.changePassword).toHaveBeenCalledWith({
      username: 'testuser',
      currentPassword: pwd,
      newPassword: newPwd,
    });
  });

  it('shows success feedback then redirects to /login?passwordChanged=1', async () => {
    const wrapper = mountPage();
    const authStore = useAuthStore();
    vi.spyOn(authStore, 'changePassword').mockResolvedValue();

    await wrapper.find('#username').setValue('testuser');
    await wrapper.find('#current-password').setValue(pwd);
    await wrapper.find('#new-password').setValue(newPwd);
    await wrapper.find('#confirm-new-password').setValue(newPwd);
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(wrapper.find('.success').exists()).toBe(true);
    expect(router.currentRoute.value.path).toBe('/change-password');

    vi.advanceTimersByTime(1400);
    await flushPromises();

    expect(router.currentRoute.value.path).toBe('/login');
    expect(router.currentRoute.value.query.passwordChanged).toBe('1');
  });

  it('shows localized error on API failure', async () => {
    const wrapper = mountPage();
    const authStore = useAuthStore();
    vi.spyOn(authStore, 'changePassword').mockRejectedValue(new Error('User not found'));

    await wrapper.find('#username').setValue('testuser');
    await wrapper.find('#current-password').setValue(pwd);
    await wrapper.find('#new-password').setValue(newPwd);
    await wrapper.find('#confirm-new-password').setValue(newPwd);
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(wrapper.find('.error').text()).toBe('User not found');
  });

  it('disables submit button while submitting', async () => {
    const wrapper = mountPage();
    const authStore = useAuthStore();
    let resolveChange;
    vi.spyOn(authStore, 'changePassword').mockImplementation(
      () => new Promise((r) => { resolveChange = r; }),
    );

    await wrapper.find('#username').setValue('testuser');
    await wrapper.find('#current-password').setValue(pwd);
    await wrapper.find('#new-password').setValue(newPwd);
    await wrapper.find('#confirm-new-password').setValue(newPwd);
    wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeDefined();

    resolveChange();
    await flushPromises();
  });

  it('has a link to /login', () => {
    const wrapper = mountPage();
    expect(wrapper.find('a[href="/login"]').exists()).toBe(true);
  });

  it('clears the pending redirect timer when unmounted', async () => {
    const wrapper = mountPage();
    const authStore = useAuthStore();
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
    vi.spyOn(authStore, 'changePassword').mockResolvedValue();

    await wrapper.find('#username').setValue('testuser');
    await wrapper.find('#current-password').setValue(pwd);
    await wrapper.find('#new-password').setValue(newPwd);
    await wrapper.find('#confirm-new-password').setValue(newPwd);
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    wrapper.unmount();
    expect(clearTimeoutSpy).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the tests and confirm they fail**

```bash
npx vitest run frontend/test/unit/pages/ChangePasswordPage.test.js
```

Expected: most tests fail because the component is a stub.

- [ ] **Step 3: Implement `ChangePasswordPage.vue`**

Replace `frontend/src/pages/ChangePasswordPage.vue` with the full implementation:

```vue
<template>
  <div class="change-password-page min-h-screen bg-gray-950 flex items-center justify-center px-4">
    <div class="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl p-8 w-full max-w-md">
      <h1 class="text-2xl font-bold text-white mb-6 text-center">{{ t('changePassword.title') }}</h1>
      <Transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="opacity-0 -translate-y-2"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-2"
      >
        <div
          v-if="successMessage"
          class="success mb-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-center text-sm text-emerald-200"
        >
          <p>{{ successMessage }}</p>
        </div>
      </Transition>
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label for="username" class="block text-sm font-medium text-gray-300 mb-1">{{
            t('fields.username')
          }}</label>
          <input
            id="username"
            v-model="username"
            type="text"
            required
            class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          />
        </div>
        <div>
          <label for="current-password" class="block text-sm font-medium text-gray-300 mb-1">{{
            t('fields.currentPassword')
          }}</label>
          <input
            id="current-password"
            v-model="currentPassword"
            type="password"
            required
            class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          />
        </div>
        <div>
          <label for="new-password" class="block text-sm font-medium text-gray-300 mb-1">{{
            t('fields.newPassword')
          }}</label>
          <input
            id="new-password"
            v-model="newPassword"
            type="password"
            required
            class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          />
        </div>
        <div>
          <label for="confirm-new-password" class="block text-sm font-medium text-gray-300 mb-1">{{
            t('fields.confirmNewPassword')
          }}</label>
          <input
            id="confirm-new-password"
            v-model="confirmNewPassword"
            type="password"
            required
            class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          />
        </div>
        <p v-if="error" class="error text-red-400 text-sm mt-3 text-center">{{ error }}</p>
        <button
          type="submit"
          :disabled="isSubmitting || Boolean(successMessage)"
          class="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold py-2.5 rounded-lg transition shadow-lg"
          :class="{ 'cursor-not-allowed opacity-70': isSubmitting || successMessage }"
        >
          {{
            successMessage
              ? t('register.redirecting')
              : isSubmitting
                ? t('changePassword.changingPassword')
                : t('changePassword.submit')
          }}
        </button>
      </form>
      <p class="mt-4 text-center text-gray-400 text-sm">
        <router-link to="/login" class="text-indigo-400 hover:text-indigo-300 transition">{{
          t('changePassword.backToLogin')
        }}</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/authStore.js';
import { useI18n } from '../composables/useI18n.js';

const username = ref('');
const currentPassword = ref('');
const newPassword = ref('');
const confirmNewPassword = ref('');
const error = ref('');
const successMessage = ref('');
const isSubmitting = ref(false);
const router = useRouter();
const authStore = useAuthStore();
const { localizeError, t } = useI18n();
let redirectTimer;

onBeforeUnmount(() => {
  clearTimeout(redirectTimer);
});

function validate() {
  if (newPassword.value.length < 8) {
    error.value = t('validation.secretMin');
    return false;
  }
  if (!/[a-zA-Z]/.test(newPassword.value) || !/\d/.test(newPassword.value)) {
    error.value = t('validation.secretLettersNumbers');
    return false;
  }
  if (newPassword.value !== confirmNewPassword.value) {
    error.value = t('validation.passwordsDoNotMatch');
    return false;
  }
  return true;
}

async function handleSubmit() {
  error.value = '';
  successMessage.value = '';
  if (!validate()) return;

  isSubmitting.value = true;

  try {
    await authStore.changePassword({
      username: username.value,
      currentPassword: currentPassword.value,
      newPassword: newPassword.value,
    });
    successMessage.value = t('changePassword.successRedirect');
    redirectTimer = setTimeout(() => {
      router.push({ path: '/login', query: { passwordChanged: '1' } });
    }, 1400);
  } catch (err) {
    error.value = localizeError(err.message);
  } finally {
    isSubmitting.value = false;
  }
}
</script>
```

- [ ] **Step 4: Run the tests and confirm they pass**

```bash
npx vitest run frontend/test/unit/pages/ChangePasswordPage.test.js
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/ChangePasswordPage.vue frontend/test/unit/pages/ChangePasswordPage.test.js
git commit -m "feat: implement ChangePasswordPage with validation and redirect"
```

---

## Task 9: Update `LoginPage.vue` — add banner and link

**Files:**
- Modify: `frontend/src/pages/LoginPage.vue`
- Modify: `frontend/test/unit/pages/LoginPage.test.js`

- [ ] **Step 1: Add failing tests**

In `frontend/test/unit/pages/LoginPage.test.js`, add a `/change-password` route to `createTestRouter`:

```js
function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/login', component: LoginPage },
      { path: '/', component: { template: '<div>Dashboard</div>' } },
      { path: '/register', component: { template: '<div>Register</div>' } },
      { path: '/change-password', component: { template: '<div>ChangePassword</div>' } },
    ],
  });
}
```

Then add these tests at the end of `describe('LoginPage', ...)`:

```js
it('has a link to /change-password', () => {
  const wrapper = mountLoginPage();
  expect(wrapper.find('a[href="/change-password"]').exists()).toBe(true);
});

it('shows password changed message when arriving with ?passwordChanged=1', async () => {
  await router.push({ path: '/login', query: { passwordChanged: '1' } });
  await router.isReady();

  const wrapper = mountLoginPage();
  expect(wrapper.text()).toContain('Password changed successfully. You can now sign in.');
});

it('password changed message can be dismissed with close button', async () => {
  await router.push({ path: '/login', query: { passwordChanged: '1' } });
  await router.isReady();

  const wrapper = mountLoginPage();
  const closeBtn = wrapper.find('button[aria-label="Fechar mensagem de senha alterada"]');
  expect(closeBtn.exists()).toBe(true);

  await closeBtn.trigger('click');
  await flushPromises();

  expect(wrapper.text()).not.toContain('Password changed successfully. You can now sign in.');
});

it('password changed message is removed after timeout and query param cleared', async () => {
  vi.useFakeTimers();
  await router.push({ path: '/login', query: { passwordChanged: '1' } });
  await router.isReady();

  const wrapper = mountLoginPage();
  expect(wrapper.text()).toContain('Password changed successfully. You can now sign in.');

  vi.advanceTimersByTime(3000);
  await flushPromises();

  expect(wrapper.text()).not.toContain('Password changed successfully. You can now sign in.');
  expect(router.currentRoute.value.query.passwordChanged).toBeUndefined();
  vi.useRealTimers();
});
```

- [ ] **Step 2: Run the tests and confirm they fail**

```bash
npx vitest run frontend/test/unit/pages/LoginPage.test.js
```

Expected: the four new tests fail.

- [ ] **Step 3: Update `LoginPage.vue`**

**In `<script setup>`, add:**

After `const showLoggedOutMessage = ref(...)` and `let loggedOutTimer`:

```js
const showPasswordChangedMessage = ref(false);
showPasswordChangedMessage.value = route.query.passwordChanged === '1';
let passwordChangedTimer;
```

In `onMounted`, add after the `loggedOutTimer` block:

```js
if (showPasswordChangedMessage.value) {
  passwordChangedTimer = setTimeout(() => {
    showPasswordChangedMessage.value = false;
    const q = { ...route.query };
    delete q.passwordChanged;
    router.replace({ query: q }).catch(() => {});
  }, 3000);
}
```

In `onBeforeUnmount`, add:

```js
clearTimeout(passwordChangedTimer);
```

Add a `closePasswordChanged` function:

```js
function closePasswordChanged() {
  clearTimeout(passwordChangedTimer);
  showPasswordChangedMessage.value = false;
  const q = { ...route.query };
  delete q.passwordChanged;
  router.replace({ query: q }).catch(() => {});
}
```

**In the template:**

In the outer `v-if` condition of the `<Transition>` wrapper div, add `|| showPasswordChangedMessage`:

```html
<div v-if="showRegisteredMessage || showLoggedOutMessage || showPasswordChangedMessage">
```

Inside that div, after the `loggedOut` banner, add:

```html
<div
  v-if="showPasswordChangedMessage"
  class="mb-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200 relative"
>
  <div class="text-center">{{ t('login.passwordChanged') }}</div>
  <button
    @click="closePasswordChanged"
    aria-label="Fechar mensagem de senha alterada"
    class="absolute right-3 top-1.5 text-emerald-200 hover:text-white font-bold text-lg leading-none"
  >
    &times;
  </button>
</div>
```

After the existing `<p class="mt-4 ...">` paragraph (the "Don't have an account?" link), add:

```html
<p class="mt-2 text-center text-gray-400 text-sm">
  {{ t('login.forgotPassword') }}
  <router-link to="/change-password" class="text-indigo-400 hover:text-indigo-300 transition">{{
    t('login.changeIt')
  }}</router-link>
</p>
```

- [ ] **Step 4: Run the tests and confirm they pass**

```bash
npx vitest run frontend/test/unit/pages/LoginPage.test.js
```

Expected: all tests pass, including the new ones.

- [ ] **Step 5: Run the full frontend test suite**

```bash
npm --workspace=frontend run test:unit
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/LoginPage.vue frontend/test/unit/pages/LoginPage.test.js
git commit -m "feat: add change-password link and success banner to LoginPage"
```

---

## Task 10: Final verification

- [ ] **Step 1: Run all tests**

```bash
npm test
```

Expected: all backend and frontend tests pass.

- [ ] **Step 2: Smoke test manually**

Start the app in two terminals:

```bash
npm run start:backend
npm run start:frontend
```

1. Open http://localhost:5173/login — confirm "Forgot your password? Change it" link is visible.
2. Click the link — confirm it navigates to `/change-password` with the form.
3. Submit with wrong current password — confirm 401 error message appears.
4. Submit with mismatched new passwords — confirm client-side validation error appears.
5. Submit with valid data — confirm success message appears, then redirect to `/login?passwordChanged=1`.
6. Confirm the "Password changed successfully" banner appears on the login page and auto-dismisses.
7. Log in with the new password — confirm it works.

- [ ] **Step 3: Final commit (if any loose files)**

```bash
git status
```

If all changes were committed per-task, no further commit is needed.
