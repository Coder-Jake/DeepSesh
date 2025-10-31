import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

interface LocalUser {
  id: string;
  email: string;
  user_metadata: {
    first_name?: string;
    last_name?: string;
  };
}

interface AuthContextType {
  user: LocalUser | null;
  session: null; // No session concept with local auth
  loading: boolean;
  // Removed login and logout functions as they will no longer be explicitly called
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_USER_KEY = 'deepsesh_local_user';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse stored user from local storage", e);
        localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
        // If parsing fails, create a new user
        createDefaultLocalUser();
      }
    } else {
      // If no user is stored, create a default one
      createDefaultLocalUser();
    }
    setLoading(false);
  }, []);

  const createDefaultLocalUser = () => {
    const defaultUser: LocalUser = {
      id: `local-user-${Date.now()}`, // Simple unique ID
      email: `localuser-${Date.now()}@example.com`, // Default email
      user_metadata: {
        first_name: "You", // Default first name
      },
    };
    setUser(defaultUser);
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(defaultUser));
  };

  // Removed login and logout functions
  // const login = useCallback((email: string, firstName?: string, lastName?: string) => {
  //   const newUser: LocalUser = {
  //     id: `local-user-${Date.now()}`, // Simple unique ID
  //     email,
  //     user_metadata: {
  //       first_name: firstName,
  //       last_name: lastName,
  //     },
  //   };
  //   setUser(newUser);
  //   localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(newUser));
  // }, []);

  // const logout = useCallback(() => {
  //   setUser(null);
  //   localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
  // }, []);

  return (
    <AuthContext.Provider value={{ user, session: null, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};