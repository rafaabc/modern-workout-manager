export function createUserController(userService) {
  return {
    register(req, res) {
      try {
        const { username, password } = req.body;
        const user = userService.register({ username, password });
        return res.status(201).json({ id: user.id, username: user.username });
      } catch (err) {
        const status = err.status || 500;
        return res.status(status).json({ error: err.message });
      }
    },

    login(req, res) {
      try {
        const { username, password } = req.body;
        const result = userService.login({ username, password });
        return res.status(200).json({ token: result.token });
      } catch (err) {
        const status = err.status || 500;
        return res.status(status).json({ error: err.message });
      }
    },

    logout(_req, res) {
      return res.status(200).json({ message: 'Logged out successfully' });
    },
  };
}
