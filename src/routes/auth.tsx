import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — BriquePro | Gestão de brique e revenda" },
      {
        name: "description",
        content:
          "Acesse o BriquePro para controlar compras, trocas, vendas e o lucro real de cada item usado.",
      },
      { property: "og:title", content: "Entrar no BriquePro" },
      {
        property: "og:description",
        content: "Controle financeiro completo para quem compra, troca e revende itens usados.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: name },
          },
        });
        if (error) throw error;
        toast.success("Conta criada. Você já pode entrar.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/dashboard" });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível autenticar");
    } finally {
      setLoading(false);
    }
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Falha ao entrar com Google");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 font-sans">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5">
          <div className="grid size-7 place-items-center rounded-md border border-accent/30 bg-accent/15">
            <span className="num text-sm font-semibold text-accent">B</span>
          </div>
          <div className="leading-tight">
            <p className="text-[13px] font-semibold tracking-tight">BriquePro</p>
            <p className="label-mono">Gestão de brique</p>
          </div>
        </div>

        <div className="mt-5 rounded-lg border border-line bg-panel p-5">
          <h1 className="text-[15px] font-semibold">
            {mode === "signin" ? "Entrar na sua operação" : "Criar conta"}
          </h1>
          <p className="num mt-1 text-[11px] text-faint">
            controle de compra, troca, venda e lucro real
          </p>

          <form onSubmit={submit} className="mt-4 space-y-3">
            {mode === "signup" && (
              <div>
                <p className="label-mono">Nome</p>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 h-10 w-full rounded-md border border-line bg-panel2 px-3 text-[13px] outline-none focus:border-accent/50"
                />
              </div>
            )}
            <div>
              <p className="label-mono">E-mail</p>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 h-10 w-full rounded-md border border-line bg-panel2 px-3 text-[13px] outline-none focus:border-accent/50"
              />
            </div>
            <div>
              <p className="label-mono">Senha</p>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 h-10 w-full rounded-md border border-line bg-panel2 px-3 text-[13px] outline-none focus:border-accent/50"
              />
            </div>
            <button
              disabled={loading}
              className="h-10 w-full rounded-md bg-accent text-[13px] font-semibold text-accent-foreground disabled:opacity-60"
            >
              {mode === "signin" ? "Entrar" : "Criar conta"}
            </button>
          </form>

          <button
            onClick={google}
            className="mt-2 h-10 w-full rounded-md border border-line bg-panel2 text-[13px] font-medium"
          >
            Continuar com Google
          </button>

          <button
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="num mt-4 w-full text-[11px] text-faint hover:text-muted-foreground"
          >
            {mode === "signin" ? "não tenho conta →" : "já tenho conta →"}
          </button>
        </div>
      </div>
    </div>
  );
}
