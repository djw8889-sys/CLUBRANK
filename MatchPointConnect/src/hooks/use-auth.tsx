import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { User } from "firebase/auth";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

// 앱 내부에서 사용하는 최소 사용자 타입
interface AppUser {
  id: string;
  username: string | null;
  email: string | null;
  photoURL: string | null;
}

interface AuthContextType {
  user: User | null;
  appUser: AppUser | null;
  token: string | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  // 🔥 Google 로그인
  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      if (!result.user) throw new Error("로그인 실패");

      const firebaseUser = result.user;

      setUser(firebaseUser);
      setAppUser({
        id: firebaseUser.uid,
        username: firebaseUser.displayName,
        email: firebaseUser.email,
        photoURL: firebaseUser.photoURL,
      });

      const idToken = await firebaseUser.getIdToken(true);
      setToken(idToken);
    } catch (err) {
      console.error("❌ Google login failed:", err);
      throw err;
    }
  };

  // 🔥 로그아웃
  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setAppUser(null);
    setToken(null);
  };

  // 🔥 로그인 상태 감시
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);

        setAppUser({
          id: firebaseUser.uid,
          username: firebaseUser.displayName,
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL,
        });

        const idToken = await firebaseUser.getIdToken(true);
        setToken(idToken);
      } else {
        setUser(null);
        setAppUser(null);
        setToken(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    user,
    appUser,
    token,
    loading,
    signInWithGoogle,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}

// 🔥 개발 모드용 토큰 출력
import { getAuth } from "firebase/auth";
getAuth().onAuthStateChanged(async (user) => {
  if (user) {
    const token = await user.getIdToken(true);
    console.log("🔥 [DEBUG] Firebase ID Token:", token);
  } else {
    console.log("🚫 [DEBUG] No user logged in.");
  }
});
