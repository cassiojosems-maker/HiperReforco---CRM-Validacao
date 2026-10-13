import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { auth, db, loginWithGoogle, logout, subscribeToAuth } from '../services/firebase';
import { Shield, Lock, AlertCircle, LogIn, LogOut, CheckCircle2, UserCheck } from 'lucide-react';

interface AuthGateProps {
  children: (props: { currentUser: User; onLogout: () => void }) => React.ReactNode;
}

export const AuthGate: React.FC<AuthGateProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [isCheckingAllowlist, setIsCheckingAllowlist] = useState<boolean>(false);
  const [isAllowed, setIsAllowed] = useState<boolean | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToAuth(async (user) => {
      setCurrentUser(user);
      if (!user) {
        setIsAllowed(null);
        setIsAuthLoading(false);
        return;
      }

      // Usuário autenticado: verifica permissão no Firestore
      setIsCheckingAllowlist(true);
      setAuthError(null);

      try {
        // Testa o acesso à coleção validacao_entrevistas protegida pela regra de allowlist
        const testQuery = query(collection(db, 'validacao_entrevistas'), limit(1));
        await getDocs(testQuery);
        // Se a leitura for permitida pelas regras de segurança, o e-mail está na allowlist ativo: true
        setIsAllowed(true);
      } catch (err: any) {
        console.warn('Verificação de acesso:', err);
        // Se o erro for de permissão insuficiente, o e-mail não consta na allowlist
        if (err?.code === 'permission-denied' || String(err).includes('permission-denied') || String(err).includes('Missing or insufficient permissions')) {
          setIsAllowed(false);
        } else {
          // Outro erro de rede ou config: se for offline/local, permite se tiver sessão
          console.warn('Aviso de conexão ao checar permissões:', err);
          setIsAllowed(false);
          setAuthError('Não foi possível verificar a autorização no servidor.');
        }
      } finally {
        setIsCheckingAllowlist(false);
        setIsAuthLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      setAuthError(null);
      setIsAuthLoading(true);
      await loginWithGoogle();
    } catch (err: any) {
      console.error('Erro ao efetuar login com Google:', err);
      if (err?.code !== 'auth/popup-closed-by-user') {
        setAuthError(err?.message || 'Falha na autenticação com a Conta Google.');
      }
      setIsAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setIsAllowed(null);
    } catch (err) {
      console.error('Erro ao sair:', err);
    }
  };

  // 1. Carregamento inicial de sessão
  if (isAuthLoading || isCheckingAllowlist) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl border border-slate-800 bg-slate-900/90 p-8 text-center space-y-4 shadow-2xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-950/70 border border-indigo-700/50 text-indigo-400 animate-pulse">
            <Shield className="h-7 w-7" />
          </div>
          <h2 className="text-base font-bold text-white">Verificando Credenciais do CRM</h2>
          <p className="text-xs text-slate-400">
            Consultando autorização na lista de permissões da equipe HiperReforço...
          </p>
        </div>
      </div>
    );
  }

  // 2. Não autenticado: Exige login com conta Google
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-['Plus_Jakarta_Sans',sans-serif]">
        <div className="max-w-md w-full rounded-2xl border border-slate-800 bg-slate-900/95 p-8 text-center space-y-6 shadow-2xl backdrop-blur-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-900 text-white shadow-lg shadow-indigo-600/30">
            <Lock className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <span className="rounded bg-indigo-950 border border-indigo-700/60 px-2.5 py-0.5 text-[10px] font-mono font-bold text-indigo-300 uppercase tracking-wider">
              Área Restrita aos Pesquisadores
            </span>
            <h1 className="text-xl font-extrabold text-white tracking-tight">
              HiperReforço · Caderno & CRM
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed">
              O acesso interno a este ambiente é restrito à equipe de validação de campo e exige login institucional com Conta Google.
            </p>
          </div>

          {authError && (
            <div className="rounded-xl border border-rose-500/40 bg-rose-950/40 p-3.5 text-xs text-rose-300 flex items-start gap-2.5 text-left">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={handleLogin}
              className="w-full flex items-center justify-center gap-3 rounded-xl bg-white hover:bg-slate-100 px-5 py-3.5 text-xs font-black text-slate-900 shadow-xl transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Entrar com Conta Google</span>
            </button>
          </div>

          <div className="border-t border-slate-800 pt-4 text-[11px] text-slate-500">
            Apenas e-mails cadastrados previamente na lista de permissões terão acesso aos dados de pesquisa.
          </div>
        </div>
      </div>
    );
  }

  // 3. Autenticado mas NÃO está na Allowlist (2.2)
  if (isAllowed === false) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-['Plus_Jakarta_Sans',sans-serif]">
        <div className="max-w-md w-full rounded-2xl border border-rose-500/40 bg-slate-900/95 p-8 text-center space-y-5 shadow-2xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-950/70 border border-rose-700/60 text-rose-400">
            <AlertCircle className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-lg font-extrabold text-white">
              Acesso Não Liberado
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed">
              Sua conta Google <strong className="text-rose-300 font-mono">{currentUser.email}</strong> não possui autorização ativa para acessar o CRM de validação.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 text-xs text-slate-400 text-left space-y-2">
            <p className="font-semibold text-slate-300">Como liberar o acesso?</p>
            <p>
              Solicite ao administrador do projeto a inclusão do seu e-mail na coleção <code className="text-indigo-300 font-mono">allowlist</code> com o campo <code className="text-indigo-300 font-mono">ativo: true</code> no Firebase Firestore.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-4 py-3 text-xs font-bold text-white transition-colors"
            >
              <LogOut className="h-4 w-4 text-slate-400" />
              <span>Entrar com Outra Conta Google</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Autenticado e Autorizado na Allowlist!
  return <>{children({ currentUser, onLogout: handleLogout })}</>;
};
