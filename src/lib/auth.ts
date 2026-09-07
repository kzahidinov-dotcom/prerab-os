import { UserProfile, UserRole } from '@/types';

const AUTH_STORAGE_KEYS = {
  CURRENT_USER: 'prerab_auth_current_user_v1',
  USERS_LIST: 'prerab_auth_users_list_v1',
};

export const DEFAULT_USERS: UserProfile[] = [
  {
    id: 'usr-kerim',
    username: 'kerim',
    name: 'Керим',
    role: 'admin',
    pin: '',
    password: 'prerabK2026',
    phone: '+421 905 000 111',
    active: true,
    avatar_color: 'bg-amber-500',
    created_at: '2026-08-01T10:00:00Z',
  },
  {
    id: 'usr-vanya',
    username: 'vanya',
    name: 'Ваня',
    role: 'admin',
    pin: '',
    password: 'prerabV2026',
    phone: '+421 905 000 222',
    active: true,
    avatar_color: 'bg-brand-500',
    created_at: '2026-08-01T10:00:00Z',
  },
  {
    id: 'usr-shofer',
    username: 'shofer',
    name: 'Шофер (Водитель Vito)',
    role: 'driver',
    pin: '5555',
    password: '',
    phone: '+421 908 555 777',
    active: true,
    avatar_color: 'bg-blue-600',
    created_at: '2026-08-05T10:00:00Z',
  },
  {
    id: 'usr-boris',
    username: 'boris',
    name: 'Борис (Бригадир)',
    role: 'foreman',
    pin: '3333',
    password: '',
    phone: '+421 915 333 444',
    assigned_projects: ['prj-hergovic', 'prj-jaslovska'],
    active: true,
    avatar_color: 'bg-emerald-600',
    created_at: '2026-08-05T10:00:00Z',
  },
  {
    id: 'usr-ezis',
    username: 'ezis',
    name: 'Эзис (Бригадир)',
    role: 'foreman',
    pin: '4444',
    password: '',
    phone: '+421 917 444 555',
    assigned_projects: ['prj-ruzchem', 'prj-kpt_rasu'],
    active: true,
    avatar_color: 'bg-purple-600',
    created_at: '2026-08-05T10:00:00Z',
  }
];

class AuthManager {
  private isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  public getUsers(): UserProfile[] {
    if (!this.isBrowser()) return DEFAULT_USERS;
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEYS.USERS_LIST);
      if (!stored) {
        this.saveUsers(DEFAULT_USERS);
        return DEFAULT_USERS;
      }
      return JSON.parse(stored);
    } catch {
      return DEFAULT_USERS;
    }
  }

  public saveUsers(users: UserProfile[]): void {
    if (!this.isBrowser()) return;
    try {
      localStorage.setItem(AUTH_STORAGE_KEYS.USERS_LIST, JSON.stringify(users));
    } catch (e) {
      console.error('Failed to save users:', e);
    }
  }

  public getCurrentUser(): UserProfile | null {
    if (!this.isBrowser()) return null;
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEYS.CURRENT_USER);
      if (stored) return JSON.parse(stored);
      return null;
    } catch {
      return null;
    }
  }

  public authenticate(user: UserProfile, secretInput: string): { success: boolean; message?: string } {
    if (!user || !user.active) {
      return { success: false, message: 'Пользователь не найден или заблокирован' };
    }

    if (user.role === 'admin') {
      // Must match exact password
      if (secretInput.trim() === user.password) {
        this.setCurrentUser(user);
        return { success: true };
      }
      return { success: false, message: 'Неверный пароль администратора' };
    } else {
      // Must match exact PIN
      if (secretInput.trim() === user.pin) {
        this.setCurrentUser(user);
        return { success: true };
      }
      return { success: false, message: 'Неверный 4-значный PIN-код' };
    }
  }

  public setCurrentUser(user: UserProfile): void {
    if (this.isBrowser()) {
      localStorage.setItem(AUTH_STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      window.dispatchEvent(new Event('prerab_auth_change'));
    }
  }

  public logout(): void {
    if (this.isBrowser()) {
      localStorage.removeItem(AUTH_STORAGE_KEYS.CURRENT_USER);
      window.dispatchEvent(new Event('prerab_auth_change'));
    }
  }
}

export const auth = new AuthManager();
