import { AuthPage } from './AuthPage.js';

export class LoginPage extends AuthPage {
  constructor(page) {
    super(page, '/login');
  }

  async login(username, password) {
    await this._fillAndSubmit(username, password);
  }
}
