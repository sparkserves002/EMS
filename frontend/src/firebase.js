// Simple Firebase mock for development without Firebase configuration
// This file provides mock authentication that works without any Firebase setup

let mockCurrentUser = null;

// Mock auth object
const mockAuth = {
  currentUser: null,
  onAuthStateChanged: (callback) => {
    callback(mockCurrentUser);
    return () => {};
  },
};

// Mock signInWithEmailAndPassword function
const mockSignInWithEmailAndPassword = async (auth, email, password) => {
  console.log('Mock login attempt with:', email, password);
  if (email && password && email.length > 0 && password.length > 0) {
    mockCurrentUser = {
      uid: 'demo-user-123',
      email: email,
      displayName: email.split('@')[0],
      metadata: {},
      getIdToken: () => Promise.resolve('mock-token'),
    };
    mockAuth.currentUser = mockCurrentUser;
    console.log('Mock login successful:', mockCurrentUser);
    return { user: mockCurrentUser };
  }
  throw new Error('Invalid email or password');
};

// Mock signOut function
const mockSignOut = async () => {
  mockCurrentUser = null;
  mockAuth.currentUser = null;
};

// Mock onAuthStateChanged function
const mockOnAuthStateChanged = (auth, callback) => {
  callback(mockCurrentUser);
  return () => {};
};

// Always use mock auth for this development setup
const auth = mockAuth;
const signInWithEmailAndPassword = mockSignInWithEmailAndPassword;
const signOut = mockSignOut;
const onAuthStateChanged = mockOnAuthStateChanged;
const db = null;
const app = null;

console.log('Using mock authentication for development');

// Export all required Firebase auth functions
export { auth, db, signInWithEmailAndPassword, signOut, onAuthStateChanged };
export default app;
