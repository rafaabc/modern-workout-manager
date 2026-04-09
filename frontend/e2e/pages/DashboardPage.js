export class DashboardPage {
  constructor(page) {
    this.page = page;
    this.logoutButton = page.locator('.logout-button');
    this.yearTotal = page.locator('.total-year strong');
  }

  getDayCell(day) {
    // Filter by exact text to avoid matching e.g. day 1 in "10", "11", "21"
    return this.page
      .locator('.calendar-day')
      .filter({ hasText: new RegExp(`^${day}$`) })
      .first();
  }

  async clickDay(day) {
    await this.getDayCell(day).click();
  }

  async isDayMarked(day) {
    const classes = await this.getDayCell(day).getAttribute('class');
    return classes?.includes('workout-day') ?? false;
  }

  async getYearTotal() {
    return parseInt(await this.yearTotal.textContent(), 10);
  }

  async goto() {
    await this.page.goto('/');
  }

  async logout() {
    await this.logoutButton.click();
  }
}
