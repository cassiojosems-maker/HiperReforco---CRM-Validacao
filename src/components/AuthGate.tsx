import React, { useState, useEffect } from 'react';
import { auth, loginWithGoogle, logout, subscribeToAuth } from '../services/firebase';
import { User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

export const AuthGate: React.FC<{ children: (props: { currentUser: User, onLogout: () => void }) => React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    return subscribeToAuth(async (u) => {
      setUser(u);
      if (u && u.email) {
        if (u.email === 'cassiojosems@gmail.com') {
          setAllowed(true);
        } else {
          try {
            const snap = await getDoc(doc(db, 'allowlist', u.email));
            setAllowed(snap.exists() && snap.data().ativo === true);
          } catch {
            setAllowed(false);
          }
        }
      } else {
        setAllowed(false);
      }
      setLoading(false);
    });
  }, []);

  if (loading) return <div>Carregando...</div>;
  if (!user) return <button onClick={loginWithGoogle}>Entrar com Google</button>;
  if (!allowed) return <div>Acesso Não Liberado.</div>;

  return <>{children({ currentUser: user, onLogout: logout })}</>;
};
