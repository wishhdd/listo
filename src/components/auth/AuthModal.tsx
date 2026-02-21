import { Loader2, LogIn, UserPlus, X } from "lucide-react";
import React, { useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { ApiError } from "../../api/client";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [loginVal, setLoginVal] = useState("");
  const [pass, setPass] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLoginMode) {
        await login(loginVal, pass);
      } else {
        await register(name, loginVal, pass);
      }
      onClose();
    } catch (err: unknown) {
      let msg = "Ошибка авторизации";

      if (err instanceof ApiError) {
        msg = err.errors?.message || err.message;
      } else if (err instanceof Error) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
          aria-label="Закрыть"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold text-slate-800 mb-2">
          {isLoginMode ? "Вход" : "Регистрация"}
        </h2>
        <p className="text-slate-500 mb-6 text-sm">
          {isLoginMode
            ? "Войдите, чтобы синхронизировать списки."
            : "Создайте аккаунт для сохранения данных."}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLoginMode && (
            <input
              type="text"
              placeholder="Ваше имя"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              required
            />
          )}

          <input
            type="text"
            placeholder="Логин"
            value={loginVal}
            onChange={(e) => setLoginVal(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            required
          />

          <input
            type="password"
            placeholder="Пароль"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            required
            minLength={6}
          />

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : isLoginMode ? (
              <>
                <LogIn size={20} /> Войти
              </>
            ) : (
              <>
                <UserPlus size={20} /> Создать
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLoginMode(!isLoginMode);
              setError("");
            }}
            className="text-blue-600 font-medium text-sm hover:underline"
          >
            {isLoginMode
              ? "Нет аккаунта? Зарегистрируйтесь"
              : "Уже есть аккаунт? Войти"}
          </button>
        </div>
      </div>
    </div>
  );
}
