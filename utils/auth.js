import { randomUUID } from 'node:crypto';

export const sessions = new Map();

export const getToken = (req) => {
  const auth = req.headers.authorization || '';
  return auth.startsWith('Bearer ') ? auth.slice(7) : null;
};

export const getCurrentUser = (req) => {
  const token = getToken(req);
  if (!token || !sessions.has(token)) return null;
  return sessions.get(token);
};

export const requireRole = (req, role) => {
  const user = getCurrentUser(req);
  if (!user || user.role !== role) {
    return null;
  }

  return user;
};

export const createSession = (user) => {
  const token = randomUUID();
  sessions.set(token, {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name
  });

  return token;
};
