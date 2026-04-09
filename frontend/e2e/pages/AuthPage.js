export class AuthPage {
  constructor(page, path) {
    this.page = page;
    this.path = path;
    this.usernameInput = page.locator('#username');
    this.passwordInput = page.locator('#password');
    this.submitButton = page.locator('button[type="submit"]');
    this.errorMessage = page.locator('p.error');
  }

  async goto() {
    await this.page.goto(this.path);
  }

  async _fillAndSubmit(username, password) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
