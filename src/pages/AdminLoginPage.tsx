import { useEffect } from "react";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppState";

export function AdminLoginPage() {
  const navigate = useNavigate();
  const { isAdmin, loginAdmin } = useAppContext();

  useEffect(() => {
    loginAdmin("mesegombolyag", "mesegombolyag-demo");
    navigate("/admin/dashboard", { replace: true });
  }, [loginAdmin, navigate]);

  if (isAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-5 py-16 text-ink">
      <div className="w-full max-w-xl rounded-[32px] border border-forest/10 bg-white/60 p-8 shadow-[0_30px_80px_rgba(32,58,50,0.08)]">
        <div className="flex items-center justify-center rounded-full bg-forest p-3 text-paper w-14 h-14 mx-auto">
          <ShieldCheck className="h-7 w-7" />
        </div>
        <h1 className="mt-6 text-center font-serif text-4xl text-forest">Admin megnyitva</h1>
        <p className="mt-3 text-center text-sm text-ink/70">
          A kezelőfelület automatikusan elérhető, nincs szükség külön engedélyezésre.
        </p>

        <div className="mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-forest px-6 py-3.5 font-sans font-semibold text-paper">
          <LockKeyhole className="h-4 w-4" />
          Belépés folyamatban...
        </div>
      </div>
    </div>
  );
}
