import { useState, type FormEvent } from "react";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppState";

export function AdminLoginPage() {
  const navigate = useNavigate();
  const { isAdmin, loginAdmin } = useAppContext();
  const [email, setEmail] = useState("admin@mesegombolyag.hu");
  const [password, setPassword] = useState("mesegombolyag-demo");
  const [error, setError] = useState("");

  if (isAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const ok = loginAdmin(email, password);

    if (ok) {
      navigate("/admin/dashboard");
      return;
    }

    setError("A bejelentkezés nem sikerült. Ellenőrizd az e-mail címet és a jelszót.");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-5 py-16 text-ink">
      <div className="w-full max-w-xl rounded-[32px] border border-forest/10 bg-white/60 p-8 shadow-[0_30px_80px_rgba(32,58,50,0.08)]">
        <div className="flex items-center justify-center rounded-full bg-forest p-3 text-paper w-14 h-14 mx-auto">
          <ShieldCheck className="h-7 w-7" />
        </div>
        <h1 className="mt-6 text-center font-serif text-4xl text-forest">Admin bejelentkezés</h1>
        <p className="mt-3 text-center text-sm text-ink/70">
          A kezelőfelületet védett, hozzáféréssel rendelkező felhasználók tekinthetik meg.
        </p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <label className="block space-y-2">
            <span className="font-medium text-forest">E-mail</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl border border-forest/15 bg-paper px-4 py-3 text-base"
              required
            />
          </label>

          <label className="block space-y-2">
            <span className="font-medium text-forest">Jelszó</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-forest/15 bg-paper px-4 py-3 text-base"
              required
            />
          </label>

          {error && (
            <div className="rounded-2xl border border-rose-700/20 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {error}
            </div>
          )}

          <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-full bg-forest px-6 py-3.5 font-sans font-semibold text-paper hover:bg-terracotta">
            <LockKeyhole className="h-4 w-4" />
            Belépés
          </button>
        </form>

        <div className="mt-6 rounded-2xl border border-forest/10 bg-paper-dim p-4 text-sm text-ink/75">
          Demo hozzáférés: <span className="font-semibold">admin@mesegombolyag.hu</span> / <span className="font-semibold">mesegombolyag-demo</span>
        </div>
      </div>
    </div>
  );
}
