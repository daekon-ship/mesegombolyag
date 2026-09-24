import { FormEvent, useState } from "react";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppState";

export function AdminLoginPage() {
  const navigate = useNavigate();
  const { isAdmin, loginAdmin } = useAppContext();
  const [username, setUsername] = useState("mesegombolyag");
  const [password, setPassword] = useState("mesegombolyag-demo");
  const [error, setError] = useState("");

  if (isAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const ok = loginAdmin(username, password);
    if (!ok) {
      setError("Hibás felhasználónév vagy jelszó.");
      return;
    }

    navigate("/admin/dashboard", { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-5 py-16 text-ink">
      <div className="w-full max-w-xl rounded-[32px] border border-forest/10 bg-white/60 p-8 shadow-[0_30px_80px_rgba(32,58,50,0.08)]">
        <div className="flex items-center justify-center rounded-full bg-forest p-3 text-paper w-14 h-14 mx-auto">
          <ShieldCheck className="h-7 w-7" />
        </div>
        <h1 className="mt-6 text-center font-serif text-4xl text-forest">Admin felület</h1>
        <p className="mt-3 text-center text-sm text-ink/70">
          A demó admin hozzáféréshez add meg a megadott felhasználónevet és jelszót.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="username" className="mb-2 block text-sm font-semibold text-ink/80">Felhasználónév</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="w-full rounded-2xl border border-forest/15 bg-paper px-4 py-3 text-base text-ink outline-none transition focus:border-forest/40 focus:ring-2 focus:ring-forest/10"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-semibold text-ink/80">Jelszó</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-forest/15 bg-paper px-4 py-3 text-base text-ink outline-none transition focus:border-forest/40 focus:ring-2 focus:ring-forest/10"
            />
          </div>

          {error ? (
            <p className="rounded-2xl border border-terracotta/20 bg-terracotta/5 px-4 py-3 text-sm text-terracotta">{error}</p>
          ) : null}

          <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-full bg-forest px-6 py-3.5 font-sans font-semibold text-paper transition hover:bg-forest/90">
            <LockKeyhole className="h-4 w-4" />
            Belépés az admin felületre
          </button>
        </form>

        <div className="mt-6 rounded-2xl border border-forest/10 bg-forest/5 px-4 py-3 text-sm text-ink/80">
          Demo hozzáférés: <span className="font-semibold">mesegombolyag</span> / <span className="font-semibold">mesegombolyag-demo</span>
        </div>
      </div>
    </div>
  );
}
