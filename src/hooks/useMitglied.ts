import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

// MONVERSE-Mitgliedschaft auf DDD: ein MON-Konto (Supabase-Anmeldung der zentralen Datenbank),
// Mitglied bis = app_werkstatt.mitglied_bis(), gewählte Themenbereiche in app_ddd.mitglied_bereiche.
export function useMitglied() {
  const [session, setSession] = useState<Session | null>(null);
  const [mitgliedBis, setMitgliedBis] = useState<string | null>(null);
  const [bereiche, setBereiche] = useState<string[]>([]);
  const [laedt, setLaedt] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    let aktiv = true;
    (async () => {
      if (!session) { setMitgliedBis(null); setBereiche([]); setLaedt(false); return; }
      setLaedt(true);
      const { data: bis } = await (supabase as any).schema("app_werkstatt").rpc("mitglied_bis");
      const { data: wahl } = await (supabase as any).from("mitglied_bereiche").select("bereiche").maybeSingle();
      if (!aktiv) return;
      setMitgliedBis((bis as string | null) ?? null);
      setBereiche((wahl?.bereiche as string[] | undefined) ?? []);
      setLaedt(false);
    })();
    return () => { aktiv = false; };
  }, [session]);

  const bereicheSpeichern = useCallback(async (neu: string[]) => {
    setBereiche(neu);
    const { error } = await (supabase as any).from("mitglied_bereiche")
      .upsert({ user_id: session?.user.id, bereiche: neu, aktualisiert: new Date().toISOString() });
    return !error;
  }, [session]);

  const anmelden = useCallback((provider: "twitch" | "google") => {
    supabase.auth.signInWithOAuth({ provider, options: { redirectTo: window.location.origin + "/app" } });
  }, []);

  return { session, mitgliedBis, bereiche, laedt, bereicheSpeichern, anmelden, abmelden: () => supabase.auth.signOut() };
}
