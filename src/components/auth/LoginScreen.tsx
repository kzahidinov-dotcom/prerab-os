'use client';

import React, { useState } from 'react';
import { UserProfile } from '@/types';
import { auth } from '@/lib/auth';
import { 
  Lock, 
  ShieldCheck, 
  KeyRound, 
  ChevronRight,
  Eye,
  EyeOff,
  AlertCircle
} from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const users = auth.getUsers();
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleUserSelect = (user: UserProfile) => {
    setSelectedUser(user);
    setInputValue('');
    setError('');
    setShowPassword(false);
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    const result = auth.authenticate(selectedUser, inputValue);
    if (result.success) {
      onLoginSuccess(selectedUser);
    } else {
      setError(result.message || 'Ошибка авторизации');
      setInputValue('');
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return { label: '👑 Администратор (Пароль)', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
      case 'foreman':
        return { label: '👷 Бригадир (PIN-код)', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
      case 'driver':
        return { label: '🚛 Водитель Vito (PIN-код)', bg: 'bg-blue-500/20 text-blue-300 border-blue-500/30' };
      default:
        return { label: 'Сотрудник', bg: 'bg-slate-700 text-slate-300 border-slate-600' };
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle Luxury Gold Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-grain mix-blend-overlay opacity-[0.035] pointer-events-none" />

      <div className="max-w-md w-full relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-brand-500/40 p-2 mx-auto flex items-center justify-center shadow-2xl">
            <img src="/prerab-logo.png" alt="PRERAB" className="max-h-full max-w-full object-contain" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold tracking-tight text-white flex items-center justify-center gap-2">
              <span>PRERAB OS</span>
            </h1>
            <p className="text-xs text-brand-400 font-semibold tracking-wider uppercase mt-1">
              Защищенный корпоративный вход
            </p>
          </div>
        </div>

        {/* STEP 1: USER LIST SELECTION */}
        {!selectedUser ? (
          <div className="bg-slate-900/90 backdrop-blur-md rounded-3xl border border-white/5 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Выберите свой профиль:
              </span>
              <span className="text-[10px] text-slate-500">Авторизация обязательна</span>
            </div>

            <div className="space-y-2.5">
              {users.map((u) => {
                const badge = getRoleBadge(u.role);
                return (
                  <button
                    key={u.id}
                    onClick={() => handleUserSelect(u)}
                    className="w-full p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-brand-500/50 transition-all flex items-center justify-between group text-left"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className={`w-10 h-10 rounded-xl ${u.avatar_color || 'bg-brand-500'} text-white font-black text-sm flex items-center justify-center shadow-md`}>
                        {u.name.substring(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-extrabold text-white group-hover:text-brand-400 transition-colors">
                          {u.name}
                        </div>
                        <div className="mt-0.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${badge.bg}`}>
                            {badge.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-white transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* STEP 2: CREDENTIALS INPUT (PASSWORD OR PIN) */
          <div className="bg-slate-900/90 backdrop-blur-md rounded-3xl border border-white/5 p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSelectedUser(null)}
                className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1"
              >
                &larr; Назад к выбору
              </button>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getRoleBadge(selectedUser.role).bg}`}>
                {selectedUser.role.toUpperCase()}
              </span>
            </div>

            <div className="text-center space-y-2">
              <div className={`w-14 h-14 rounded-2xl ${selectedUser.avatar_color || 'bg-brand-500'} text-white font-black text-xl flex items-center justify-center mx-auto shadow-xl`}>
                {selectedUser.name.substring(0, 1).toUpperCase()}
              </div>
              <h2 className="text-lg font-display font-bold text-white">{selectedUser.name}</h2>
              <p className="text-xs text-slate-400">
                {selectedUser.role === 'admin' 
                  ? 'Введите пароль администратора:' 
                  : 'Введите 4-значный PIN-код:'}
              </p>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {selectedUser.role === 'admin' ? (
                /* ADMIN TEXT PASSWORD FIELD */
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoFocus
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Введите пароль..."
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono text-sm text-white pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              ) : (
                /* NON-ADMIN 4-DIGIT PIN FIELD */
                <div>
                  <input
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    required
                    autoFocus
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="• • • •"
                    className="w-full text-center tracking-[0.5em] text-2xl py-3 bg-slate-950 border border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono font-bold text-brand-400"
                  />
                </div>
              )}

              {error && (
                <div className="p-2.5 bg-rose-950/60 border border-rose-800/60 rounded-xl text-xs text-rose-300 flex items-center justify-center gap-1.5 font-semibold">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 bg-brand-500 hover:bg-brand-400 text-slate-950 font-extrabold rounded-2xl text-xs shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>Войти в систему</span>
              </button>
            </form>
          </div>
        )}

        {/* Security footer */}
        <div className="text-center text-[10px] text-slate-600 font-mono">
          PRERAB OS &middot; ENCRYPTED ACCESS &middot; BRATISLAVA
        </div>
      </div>
    </div>
  );
};
