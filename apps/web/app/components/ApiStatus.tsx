"use client";

import { useEffect, useState } from "react";
import { apiBaseUrl } from "../lib/api";

type Health = {
  ok: boolean;
  service: string;
  version: string;
  db: "up" | "down" | "not_configured";
  aiConfigured: boolean;
  paypalConfigured: boolean;
};

type Models = {
  models: Array<{
    id: string;
    brand: string;
    family: string;
    model: string;
  }>;
};

type State =
  | { status: "loading" }
  | { status: "online"; health: Health; models: Models }
  | { status: "offline"; error: string };

export function ApiStatus() {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const [healthResponse, modelsResponse] = await Promise.all([
          fetch(`${apiBaseUrl}/health`, { cache: "no-store" }),
          fetch(`${apiBaseUrl}/api/models`, { cache: "no-store" })
        ]);

        if (!healthResponse.ok || !modelsResponse.ok) {
          throw new Error(
            `API returned ${healthResponse.status}/${modelsResponse.status}`
          );
        }

        const health = (await healthResponse.json()) as Health;
        const models = (await modelsResponse.json()) as Models;

        if (!cancelled) {
          setState({ status: "online", health, models });
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            status: "offline",
            error: error instanceof Error ? error.message : "API unavailable"
          });
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === "loading") {
    return (
      <div className="status-card">
        <span className="dot dot-wait" />
        Checking the live API…
      </div>
    );
  }

  if (state.status === "offline") {
    return (
      <div className="status-card">
        <span className="dot dot-off" />
        <div>
          <strong>API offline.</strong> {state.error}
          <p className="status-note">
            Start the API on <code>:3002</code> or set{" "}
            <code>NEXT_PUBLIC_API_BASE_URL</code>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="status-card status-online">
      <span className="dot dot-on" />
      <div>
        <strong>API online.</strong> Database:{" "}
        <code>{state.health.db}</code>. AI:{" "}
        <code>{state.health.aiConfigured ? "configured" : "not configured"}</code>
        . PayPal:{" "}
        <code>
          {state.health.paypalConfigured ? "configured" : "not configured"}
        </code>
        .
        <p className="status-note">
          {state.models.models.length} supported model
          {state.models.models.length === 1 ? "" : "s"} in the catalog.
        </p>
      </div>
    </div>
  );
}
