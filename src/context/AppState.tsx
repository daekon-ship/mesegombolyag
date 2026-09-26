import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, setUnauthenticatedHandler, type SiteFlags } from "../lib/api";
import { defaultSiteContent } from "../lib/siteData";
import type { Program, SiteContent, Slot } from "../lib/types";

type LoadState = "loading" | "ready" | "error";

type AppStateValue = {
  siteContent: SiteContent;
  slots: Slot[];
  programs: Program[];
  /** Tesztelőnézet és levélküldés állapota (a szervertől). */
  site: SiteFlags;
  publicState: LoadState;
  refreshPublic: () => Promise<void>;
  /** null = még ellenőrizzük */
  isAdmin: boolean | null;
  sessionExpired: boolean;
  loginAdmin: (username: string, password: string) => Promise<{ ok: boolean; message?: string }>;
  logoutAdmin: () => Promise<void>;
  setSiteContent: (content: SiteContent) => void;
};

const AppStateContext = createContext<AppStateValue | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [siteContent, setSiteContent] = useState<SiteContent>(defaultSiteContent);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [publicState, setPublicState] = useState<LoadState>("loading");
  const [site, setSite] = useState<SiteFlags>({ previewMode: false, emailNotifications: false });
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  const refreshPublic = useCallback(async () => {
    const res = await api.publicData();
    if (res.ok && res.data) {
      setSiteContent({ ...defaultSiteContent, ...res.data.siteContent });
      setSlots(res.data.slots);
      setPrograms(res.data.programs);
      if (res.data.site) setSite(res.data.site);
      setPublicState("ready");
    } else {
      setPublicState("error");
    }
  }, []);

  useEffect(() => {
    refreshPublic();
    api.session().then((res) => setIsAdmin(Boolean(res.ok && res.data?.loggedIn)));
    setUnauthenticatedHandler(() => {
      setIsAdmin((was) => {
        if (was) setSessionExpired(true);
        return false;
      });
    });
    return () => setUnauthenticatedHandler(null);
  }, [refreshPublic]);

  const loginAdmin = useCallback(async (username: string, password: string) => {
    const res = await api.login(username, password);
    if (res.ok) {
      setIsAdmin(true);
      setSessionExpired(false);
    }
    return { ok: res.ok, message: res.message };
  }, []);

  const logoutAdmin = useCallback(async () => {
    await api.logout();
    setIsAdmin(false);
  }, []);

  const value = useMemo<AppStateValue>(
    () => ({ siteContent, slots, programs, site, publicState, refreshPublic, isAdmin, sessionExpired, loginAdmin, logoutAdmin, setSiteContent }),
    [siteContent, slots, programs, site, publicState, refreshPublic, isAdmin, sessionExpired, loginAdmin, logoutAdmin],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppStateContext);
  if (!context) throw new Error("useAppContext must be used within AppProvider");
  return context;
}
