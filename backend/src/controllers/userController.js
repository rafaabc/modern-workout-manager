export function createUserController(userService) {
  return {
    async register(req, res) {
      try {
        const { username, password } = req.body;
        const user = await userService.register({ username, password });
        return res.status(201).json({ id: user.id, username: user.username });
      } catch (err) {
        const status = err.status || 500;
        return res.status(status).json({ error: err.message });
      }
    },

    async login(req, res) {
      try {
        const { username, password } = req.body;
        const result = await userService.login({ username, password });
        return res.status(200).json({ token: result.token });
      } catch (err) {
        const status = err.status || 500;
        return res.status(status).json({ error: err.message });
      }
    },

    logout(_req, res) {
      return res.status(200).json({ message: 'Logged out successfully' });
    },

    async changePassword(req, res) {
      try {
        const { currentPassword, newPassword } = req.body;
        const { username } = req.user;
        await userService.changePassword({ username, currentPassword, newPassword });
        return res.status(200).json({ message: 'Password updated successfully' });
      } catch (err) {
        const status = err.status || 500;
        return res.status(status).json({ error: err.message });
      }
    },
  };
}
