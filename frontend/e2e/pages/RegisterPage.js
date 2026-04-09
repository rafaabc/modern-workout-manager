import { AuthPage } from './AuthPage.js';

export class RegisterPage extends AuthPage {
  constructor(page) {
    super(page, '/register');
  }

  async register(username, password) {
    await this._fillAndSubmit(username, password);
  }
}
