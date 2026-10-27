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
  | {
      status: "online";
      health: Health | null;
      healthError: string | null;
      models: Models;
    }
  | { status: "offline"; error: string };

export function ApiStatus() {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const [healthResult, modelsResult] = await Promise.allSettled([
        fetch(`${apiBaseUrl}/api/status`, { cache: "no-store" }),
        fetch(`${apiBaseUrl}/api/models`, { cache: "no-store" })
      ]);

      if (
        modelsResult.status !== "fulfilled" ||
        !modelsResult.value.ok
      ) {
        if (!cancelled) {
          setState({
            status: "offline",
            error:
              modelsResult.status === "rejected"
                ? modelsResult.reason instanceof Error
                  ? modelsResult.reason.message
                  : "Failed to fetch"
                : `API returned ${modelsResult.value.status}`
          });
        }
        return;
      }

      const models = (await modelsResult.value.json()) as Models;
      let health: Health | null = null;
      let healthError: string | null = null;

      if (healthResult.status === "fulfilled" && healthResult.value.ok) {
        health = (await healthResult.value.json()) as Health;
      } else {
        healthError =
          healthResult.status === "rejected"
            ? "The browser blocked the status request."
            : `Status endpoint returned ${healthResult.value.status}.`;
      }

      if (!cancelled) {
        setState({ status: "online", health, healthError, models });
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
            Requested API: <code>{apiBaseUrl}</code>. Check the deployed API
            and CORS, or set <code>NEXT_PUBLIC_API_BASE_URL</code>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="status-card status-online">
      <span className="dot dot-on" />
      <div>
        <strong>API online.</strong>{" "}
        {state.health ? (
          <>
            Database: <code>{state.health.db}</code>. AI:{" "}
            <code>
              {state.health.aiConfigured ? "configured" : "not configured"}
            </code>
            . PayPal:{" "}
            <code>
              {state.health.paypalConfigured ? "configured" : "not configured"}
            </code>
            .
          </>
        ) : (
          <>Health details unavailable; catalog is responding.</>
        )}
        <p className="status-note">
          {state.models.models.length} supported model
          {state.models.models.length === 1 ? "" : "s"} in the catalog.
          {state.healthError ? ` ${state.healthError}` : ""}
        </p>
      </div>
    </div>
  );
}
