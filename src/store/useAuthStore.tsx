import { create } from "zustand";

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: "مدیر کل و حسابداری" | "سرپرست انبار" | string;
}

interface StoredCredentials {
  id: string;
  username: string;
  password: string;
  fullName: string;
  role: "مدیر کل و حسابداری" | "سرپرست انبار" | string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (
    username: string,
    password: string,
    rememberMe?: boolean,
  ) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  fetchProfileFromServer: () => Promise<void>;
  updateCredentials: (data: {
    currentPassword: string;
    newUsername: string;
    newFullName: string;
    newPassword?: string;
  }) => Promise<{ success: boolean; message: string }>;
}

const STORAGE_KEY = "peyman_pn_auth_user";
const CREDENTIALS_KEY = "peyman_pn_admin_credentials";
const API_BASE = "http://localhost:4000/api/auth";

const defaultCredentials: StoredCredentials = {
  id: "PN-01",
  username: "admin",
  password: "123456",
  fullName: "مدیریت گروه صنعتی پیمان",
  role: "مدیر کل و حسابداری",
};

const getStoredCredentials = (): StoredCredentials => {
  try {
    if (typeof window === "undefined") return defaultCredentials;
    const saved = localStorage.getItem(CREDENTIALS_KEY);
    return saved ? JSON.parse(saved) : defaultCredentials;
  } catch {
    return defaultCredentials;
  }
};

const getSavedUser = (): User | null => {
  try {
    if (typeof window === "undefined") return null;
    const saved =
      localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

export const useAuthStore = create<AuthState>((set) => {
  const initialUser = getSavedUser();

  return {
    user: initialUser,
    isAuthenticated: Boolean(initialUser),

    // دریافت آخرین مشخصات مدیر از سرور Node.js
    fetchProfileFromServer: async () => {
      try {
        const res = await fetch(`${API_BASE}/profile`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.success && data.user) {
          if (localStorage.getItem(STORAGE_KEY)) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user));
          } else if (sessionStorage.getItem(STORAGE_KEY)) {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data.user));
          }
          set({ user: data.user });
        }
      } catch {
        // در صورت خاموش بودن سرور، از اطلاعات محلی استفاده می‌شود
      }
    },

    // ورود به سامانه (همراه با rememberMe و خروجی { success, message })
    login: async (username, password, rememberMe = true) => {
      await new Promise((resolve) => setTimeout(resolve, 500));

      const cleanUser = username.trim().toLowerCase();

      // ۱. تلاش برای ورود از طریق سرور Node.js
      try {
        const res = await fetch(`${API_BASE}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: cleanUser, password }),
        });

        const data = await res.json();

        if (res.ok && data.success && data.user) {
          if (rememberMe) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user));
          } else {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data.user));
          }
          set({ user: data.user, isAuthenticated: true });
          return { success: true };
        }

        return {
          success: false,
          message: data.message || "نام کاربری یا رمز عبور اشتباه است.",
        };
      } catch {
        // ۲. اگر سرور Node.js خاموش بود، بررسی از روی حافظه محلی
        const creds = getStoredCredentials();

        if (
          cleanUser === creds.username.toLowerCase() &&
          password === creds.password
        ) {
          const loggedInUser: User = {
            id: creds.id || "PN-01",
            username: creds.username,
            fullName: creds.fullName,
            role: creds.role,
          };

          if (rememberMe) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(loggedInUser));
          } else {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(loggedInUser));
          }

          set({ user: loggedInUser, isAuthenticated: true });
          return { success: true };
        }

        return {
          success: false,
          message: "نام کاربری یا رمز عبور اشتباه است.",
        };
      }
    },

    logout: () => {
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(STORAGE_KEY);
      set({ user: null, isAuthenticated: false });
    },

    // تغییر نام کاربری و رمز عبور از صفحه تنظیمات
    updateCredentials: async ({
      currentPassword,
      newUsername,
      newFullName,
      newPassword,
    }) => {
      try {
        const res = await fetch(`${API_BASE}/credentials`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            currentPassword,
            newUsername,
            newFullName,
            newPassword,
          }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          return {
            success: false,
            message: data.message || "خطا در بروزرسانی مشخصات کاربری",
          };
        }

        const creds = getStoredCredentials();
        const updatedCreds: StoredCredentials = {
          id: "PN-01",
          username: data.user.username,
          fullName: data.user.fullName,
          role: data.user.role,
          password:
            newPassword && newPassword.trim() !== ""
              ? newPassword.trim()
              : creds.password,
        };

        localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(updatedCreds));
        if (localStorage.getItem(STORAGE_KEY)) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user));
        } else {
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data.user));
        }

        set({ user: data.user });
        return { success: true, message: data.message };
      } catch {
        // ذخیره محلی در صورت خاموش بودن سرور
        const creds = getStoredCredentials();
        if (currentPassword !== creds.password) {
          return {
            success: false,
            message: "رمز عبور فعلی وارد شده اشتباه است.",
          };
        }

        const updatedCreds: StoredCredentials = {
          id: "PN-01",
          username: newUsername.trim(),
          fullName: newFullName.trim() || creds.fullName,
          role: creds.role,
          password:
            newPassword && newPassword.trim() !== ""
              ? newPassword.trim()
              : creds.password,
        };

        const updatedUser: User = {
          id: "PN-01",
          username: updatedCreds.username,
          fullName: updatedCreds.fullName,
          role: updatedCreds.role,
        };

        localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(updatedCreds));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
        set({ user: updatedUser });

        return {
          success: true,
          message: "مشخصات حساب کاربری با موفقیت بروزرسانی شد.",
        };
      }
    },
  };
});
