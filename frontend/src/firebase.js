// Non-Firebase auth client stub (drop-in replacement)
let currentUser = null;
const listeners = new Set();

const notifyAuthState = () => {
  listeners.forEach((callback) => {
    try {
      callback(currentUser);
    } catch (_) {
      // ignore listener errors
    }
  });
};

const auth = {
  get currentUser() {
    return currentUser;
  },
  onAuthStateChanged(callback) {
    listeners.add(callback);
    callback(currentUser);
    return () => listeners.delete(callback);
  }
};

const createMockToken = (email) => {
  const fallbackUid = email ? email.split('@')[0] : 'user';
  return `mock-token-${fallbackUid}-${Date.now()}`;
};

const signInWithEmailAndPassword = async (_auth, email, password) => {
  const normalizedEmail = (email || '').trim().toLowerCase();
  if (!normalizedEmail || !password) {
    throw new Error('Invalid email or password');
  }

  const apiBase = process.env.REACT_APP_API_URL || '';
  const response = await fetch(`${apiBase}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: normalizedEmail, password })
  });

  if (!response.ok) {
    throw new Error('Invalid email or password');
  }

  const payload = await response.json();
  const token = payload && payload.token ? payload.token : createMockToken(normalizedEmail);
  const role = payload && payload.user && payload.user.role ? payload.user.role : 'employee';
  const displayName = payload && payload.user && payload.user.displayName
    ? payload.user.displayName
    : (normalizedEmail.split('@')[0] || 'user');

  localStorage.setItem('authToken', token);
  localStorage.setItem('userEmail', normalizedEmail);
  localStorage.setItem('userRole', role);

  const uid = normalizedEmail.split('@')[0] || 'user';
  currentUser = {
    uid,
    email: normalizedEmail,
    displayName,
    async getIdToken() {
      return localStorage.getItem('authToken') || token;
    }
  };

  notifyAuthState();
  return { user: currentUser };
};

const signOut = async () => {
  currentUser = null;
  notifyAuthState();
};

const onAuthStateChanged = (_auth, callback) => auth.onAuthStateChanged(callback);

const db = null;
const app = null;

export { auth, db, app, signInWithEmailAndPassword, signOut, onAuthStateChanged };
export default app;
