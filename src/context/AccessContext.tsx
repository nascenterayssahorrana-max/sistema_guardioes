import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type UserRole = 'admin' | 'manager' | 'operator';
export type DemoUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  passwordHash?: string;
  passwordSalt?: string;
};
export type Permission = 'cockpit.view'|'products.view'|'products.edit'|'inventory.view'|'inventory.operate'|'sales.view'|'sales.create'|'commercialGoals.manage'|'costs.view'|'costs.edit'|'losses.view'|'losses.create'|'dre.view'|'cvl.view'|'simulator.use'|'fixedCosts.view'|'fixedCosts.edit'|'users.manage';

const INITIAL_PASSWORD = 'guardioes2026';
const USERS_STORAGE_KEY = 'guardioes_lasanha_users_v2';
const LEGACY_USERS_STORAGE_KEY = 'guardioes_lasanha_demo_users_v1';
const SESSION_STORAGE_KEY = 'guardioes_lasanha_auth_session_v1';

const INITIAL_USERS: DemoUser[] = [
  { id: 'demo-admin', name: 'Administrador', email: 'admin@guardioes.local', role: 'admin', active: true },
  { id: 'demo-manager', name: 'Gestor', email: 'gestor@guardioes.local', role: 'manager', active: true },
  { id: 'demo-operator', name: 'Operacional', email: 'operacional@guardioes.local', role: 'operator', active: true },
];

const permissions: Record<UserRole, Permission[]> = {
  admin: ['cockpit.view','products.view','products.edit','inventory.view','inventory.operate','sales.view','sales.create','commercialGoals.manage','costs.view','costs.edit','losses.view','losses.create','dre.view','cvl.view','simulator.use','fixedCosts.view','fixedCosts.edit','users.manage'],
  manager: ['cockpit.view','products.view','products.edit','inventory.view','inventory.operate','sales.view','sales.create','commercialGoals.manage','costs.view','costs.edit','losses.view','losses.create','dre.view','cvl.view','simulator.use','fixedCosts.view','fixedCosts.edit'],
  operator: ['products.view','inventory.view','inventory.operate','sales.view','sales.create','losses.view','losses.create'],
};

const encodeBase64 = (buffer: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(buffer)));
const decodeBase64 = (value: string) => Uint8Array.from(atob(value), (char) => char.charCodeAt(0));

const createSalt = () => {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return encodeBase64(bytes.buffer);
};

const hashPassword = async (password: string, salt: string) => {
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const hash = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: decodeBase64(salt), iterations: 120000, hash: 'SHA-256' }, material, 256);
  return encodeBase64(hash);
};

const createPasswordCredentials = async (password: string) => {
  const passwordSalt = createSalt();
  return { passwordSalt, passwordHash: await hashPassword(password, passwordSalt) };
};

const safelyLoadUsers = (): DemoUser[] => {
  try {
    const saved = localStorage.getItem(USERS_STORAGE_KEY) ?? localStorage.getItem(LEGACY_USERS_STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : INITIAL_USERS;
    if (!Array.isArray(parsed) || parsed.length === 0) return INITIAL_USERS;
    const admin = parsed.find((item: DemoUser) => item.id === 'demo-admin');
    return admin ? [...parsed.filter((item: DemoUser) => item.id !== 'demo-admin'), { ...admin, role: 'admin', active: true }] : INITIAL_USERS;
  } catch {
    return INITIAL_USERS;
  }
};

type AuthResult = { ok: boolean; message?: string };
type AccessContextValue = {
  role: UserRole;
  user: DemoUser | null;
  users: DemoUser[];
  authReady: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  logout: () => void;
  addUser: (user: Omit<DemoUser, 'id' | 'passwordHash' | 'passwordSalt'> & { password: string }) => Promise<AuthResult>;
  updateUser: (id: string, patch: Partial<Omit<DemoUser, 'id' | 'passwordHash' | 'passwordSalt'>> & { password?: string }) => Promise<AuthResult>;
  can: (permission: Permission) => boolean;
};

const AccessContext = createContext<AccessContextValue | undefined>(undefined);

export const AccessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<DemoUser[]>(safelyLoadUsers);
  const [currentUserId, setCurrentUserId] = useState<string | null>(() => localStorage.getItem(SESSION_STORAGE_KEY));
  const [authReady, setAuthReady] = useState(false);

  const persistUsers = (next: DemoUser[]) => {
    setUsers(next);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(next));
  };

  useEffect(() => {
    let mounted = true;
    const initializeCredentials = async () => {
      const next = await Promise.all(users.map(async (item) => {
        if (item.passwordHash && item.passwordSalt) return item;
        return { ...item, ...await createPasswordCredentials(INITIAL_PASSWORD) };
      }));
      if (!mounted) return;
      setUsers(next);
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(next));
      setAuthReady(true);
    };
    void initializeCredentials();
    return () => { mounted = false; };
  }, []);

  const currentUser = users.find((item) => item.id === currentUserId && item.active) ?? null;
  const role = currentUser?.role ?? 'operator';

  const logout = () => {
    setCurrentUserId(null);
    localStorage.removeItem(SESSION_STORAGE_KEY);
  };

  const login = async (email: string, password: string): Promise<AuthResult> => {
    const user = users.find((item) => item.email.toLowerCase() === email.trim().toLowerCase());
    if (!user || !user.active || !user.passwordHash || !user.passwordSalt) return { ok: false, message: 'E-mail ou senha inválidos.' };
    const enteredHash = await hashPassword(password, user.passwordSalt);
    if (enteredHash !== user.passwordHash) return { ok: false, message: 'E-mail ou senha inválidos.' };
    setCurrentUserId(user.id);
    localStorage.setItem(SESSION_STORAGE_KEY, user.id);
    return { ok: true };
  };

  const addUser: AccessContextValue['addUser'] = async ({ password, ...user }) => {
    if (!currentUser || !permissions[currentUser.role].includes('users.manage')) return { ok: false, message: 'Você não possui permissão para cadastrar usuários.' };
    if (users.some((item) => item.email.toLowerCase() === user.email.trim().toLowerCase())) return { ok: false, message: 'Já existe um usuário com este e-mail.' };
    if (password.length < 8) return { ok: false, message: 'A senha deve ter ao menos 8 caracteres.' };
    const credentials = await createPasswordCredentials(password);
    persistUsers([...users, { ...user, id: `usr-${Date.now()}`, email: user.email.trim().toLowerCase(), ...credentials }]);
    return { ok: true };
  };

  const updateUser: AccessContextValue['updateUser'] = async (id, patch) => {
    if (!currentUser || !permissions[currentUser.role].includes('users.manage')) return { ok: false, message: 'Você não possui permissão para alterar usuários.' };
    const target = users.find((item) => item.id === id);
    if (!target) return { ok: false, message: 'Usuário não encontrado.' };
    if (patch.password !== undefined && patch.password.length < 8) return { ok: false, message: 'A senha deve ter ao menos 8 caracteres.' };
    const { password, ...data } = patch;
    const credentials = password === undefined ? {} : await createPasswordCredentials(password);
    const sanitized = id === 'demo-admin' ? { ...data, role: 'admin' as UserRole, active: true } : data;
    persistUsers(users.map((item) => item.id === id ? { ...item, ...sanitized, ...credentials } : item));
    if (id === currentUserId && sanitized.active === false) logout();
    return { ok: true };
  };

  const value = useMemo<AccessContextValue>(() => ({
    role,
    user: currentUser,
    users,
    authReady,
    isAuthenticated: currentUser !== null,
    login,
    logout,
    addUser,
    updateUser,
    can: (permission) => currentUser !== null && permissions[role].includes(permission),
  }), [users, currentUser, role, authReady]);

  return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>;
};

export const useAccess = () => {
  const context = useContext(AccessContext);
  if (!context) throw new Error('useAccess must be used inside AccessProvider');
  return context;
};
