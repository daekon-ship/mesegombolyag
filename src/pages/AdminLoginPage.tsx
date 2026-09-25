import { type FormEvent, useState } from "react";
import { LockKeyhole } from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppState";
import { Alert, SubmitButton, TextField } from "../components/ui/forms";

export function AdminLoginPage() {
  const navigate = useNavigate();
  const { isAdmin, loginAdmin, sessionExpired } = useAppContext();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  if (isAdmin) return <Navigate to="/admin/attekintes" replace />;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sending) return;
    if (!username.trim() || !password) {
      setError("Add meg a felhasználónevet és a jelszót.");
      return;
    }
    setSending(true);
    setError("");
    const res = await loginAdmin(username.trim(), password);
    setSending(false);
    if (!res.ok) {
      setError(res.message || "A bejelentkezés nem sikerült.");
      return;
    }
    navigate("/admin/attekintes", { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4 py-12 text-ink">
      <div className="w-full max-w-md rounded-[28px] border border-forest/10 bg-white/70 p-6 shadow-sm sm:p-8">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-forest text-paper">
          <LockKeyhole className="h-6 w-6" aria-hidden="true" />
        </div>
        <h1 className="mt-5 text-center font-serif text-3xl text-forest">Admin belépés</h1>
        <p className="mt-2 text-center text-sm text-ink/65">Mesegombolyag foglalások, programok és tartalom kezelése</p>
        <form onSubmit={handleSubmit} noValidate className="mt-7 space-y-4">
          {sessionExpired && <Alert tone="info">A munkamenet lejárt, kérlek, jelentkezz be újra.</Alert>}
          <TextField label="Felhasználónév vagy e-mail" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required />
          <TextField label="Jelszó" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
          {error && <Alert tone="error">{error}</Alert>}
          <SubmitButton sending={sending} sendingLabel="Belépés…">Belépés</SubmitButton>
        </form>
        <p className="mt-6 text-center text-sm">
          <Link to="/" className="focus-ring text-ink/60 underline hover:text-terracotta">Vissza a weboldalra</Link>
        </p>
      </div>
    </div>
  );
}
