"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AgGridReact
} from "ag-grid-react";
import {
  AllCommunityModule,
  ModuleRegistry,
  themeQuartz,
  type ColDef,
  type RowClickedEvent
} from "ag-grid-community";
import {
  availabilityLabel,
  dateLabel,
  type MatrixRow
} from "../../lib/catalog";

ModuleRegistry.registerModules([AllCommunityModule]);

const columns: ColDef<MatrixRow>[] = [
  {
    field: "modelLabel",
    headerName: "Model",
    pinned: "left",
    minWidth: 210,
    filter: "agTextColumnFilter"
  },
  {
    field: "partNumber",
    headerName: "Part",
    pinned: "left",
    minWidth: 110,
    filter: "agTextColumnFilter"
  },
  {
    field: "capacityWh",
    headerName: "Wh",
    width: 80,
    filter: "agNumberColumnFilter",
    valueFormatter: (params) => `${params.value}Wh`
  },
  {
    field: "voltageLabel",
    headerName: "Voltage",
    width: 95
  },
  {
    field: "cells",
    headerName: "Cells",
    width: 80,
    filter: "agNumberColumnFilter"
  },
  {
    field: "fitmentLabel",
    headerName: "Fitment",
    minWidth: 130,
    cellClassRules: {
      "matrix-status-verified": (params) =>
        params.data?.fitmentStatus === "verified",
      "matrix-status-unverified": (params) =>
        params.data?.fitmentStatus !== "verified"
    }
  },
  {
    field: "availabilityLabel",
    headerName: "Availability",
    minWidth: 195,
    cellClassRules: {
      "matrix-stock-in": (params) =>
        params.data?.availability === "reported_in_stock",
      "matrix-stock-out": (params) =>
        params.data?.availability === "reported_out_of_stock",
      "matrix-stock-unknown": (params) =>
        params.data?.availability === "unknown"
    }
  },
  {
    field: "seller",
    headerName: "Seller",
    minWidth: 120
  },
  {
    field: "priceLabel",
    headerName: "Demo price",
    width: 120,
    cellClass: "matrix-mono"
  },
];

export function CompatibilityGrid({ rows }: { rows: MatrixRow[] }) {
  const [quickFilter, setQuickFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [selected, setSelected] = useState<MatrixRow | null>(null);
  const [copied, setCopied] = useState(false);

  const filteredRows = useMemo(() => {
    const search = quickFilter.trim().toLowerCase();
    return rows.filter((row) => {
      if (statusFilter !== "all" && row.fitmentStatus !== statusFilter) {
        return false;
      }
      if (
        availabilityFilter !== "all" &&
        row.availability !== availabilityFilter
      ) {
        return false;
      }
      if (!search) return true;
      return [
        row.modelLabel,
        row.partNumber,
        row.capacityWh,
        row.voltageLabel,
        row.fitmentLabel,
        row.availabilityLabel,
        row.seller,
        row.sourcePublisher ?? ""
      ].some((value) => String(value).toLowerCase().includes(search));
    });
  }, [rows, quickFilter, statusFilter, availabilityFilter]);

  const copyQuote = async () => {
    if (!selected) return;
    try {
      await navigator.clipboard.writeText(selected.quoteNote);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="matrix-layout">
      <div className="matrix-main">
        <div className="matrix-toolbar">
          <label className="matrix-search">
            <span className="sr-only">Search compatibility</span>
            <input
              aria-label="Search compatibility"
              value={quickFilter}
              onChange={(event) => setQuickFilter(event.target.value)}
              placeholder="Search model, part, seller, source…"
              autoComplete="off"
            />
          </label>
          <label className="matrix-filter">
            <span>Fitment</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="all">All</option>
              <option value="verified">Verified</option>
              <option value="unverified">Unverified</option>
            </select>
          </label>
          <label className="matrix-filter">
            <span>Availability</span>
            <select
              value={availabilityFilter}
              onChange={(event) => setAvailabilityFilter(event.target.value)}
            >
              <option value="all">All</option>
              <option value="reported_in_stock">Reported in stock</option>
              <option value="reported_out_of_stock">
                Reported out of stock
              </option>
              <option value="unknown">Not verified</option>
            </select>
          </label>
          <span className="matrix-count" aria-live="polite">
            {filteredRows.length} of {rows.length} rows
          </span>
        </div>

        <div className="matrix-grid">
          <AgGridReact<MatrixRow>
            theme={themeQuartz}
            rowData={filteredRows}
            columnDefs={columns}
            defaultColDef={{
              sortable: true,
              filter: true,
              resizable: true,
              flex: 1,
              minWidth: 95
            }}
            pagination
            paginationPageSize={20}
            paginationPageSizeSelector={[10, 20, 50]}
            getRowId={(params) => params.data.id}
            rowClassRules={{
              "matrix-row-selected": (params) =>
                params.data?.id === selected?.id
            }}
            onRowClicked={(event: RowClickedEvent<MatrixRow>) =>
              setSelected(event.data ?? null)
            }
            suppressCellFocus
            overlayNoRowsTemplate="<span>No compatibility rows match these filters.</span>"
          />
        </div>
        <p className="hint">
          Rows come from the source-linked catalog. Availability is a
          point-in-time seller report, not a live inventory feed. Select a row
          for fitment evidence and the external seller link.
        </p>
      </div>

      <aside className="matrix-detail" aria-live="polite">
        {selected ? (
          <>
            <div className="matrix-detail-head">
              <div>
                <span className="meta-label">Selected fitment</span>
                <h2>
                  {selected.partNumber} · {selected.modelLabel}
                </h2>
              </div>
              <span
                className={
                  selected.availability === "reported_out_of_stock"
                    ? "badge-excluded"
                    : "badge-verified"
                }
              >
                {availabilityLabel(selected.availability)}
              </span>
            </div>
            <p className="option-spec">
              {selected.capacityWh}Wh · {selected.voltageLabel} ·{" "}
              {selected.cells}-cell · {selected.seller}
            </p>
            <p className="option-price">{selected.priceLabel} demo</p>

            <div className="matrix-detail-block">
              <span className="meta-label">Fitment note</span>
              <p>{selected.fitmentNote}</p>
            </div>

            {selected.evidenceQuote ? (
              <div className="matrix-detail-block">
                <span className="meta-label">Evidence quote</span>
                <p>“{selected.evidenceQuote}”</p>
              </div>
            ) : null}

            <div className="matrix-detail-grid">
              <div>
                <span className="meta-label">Source</span>
                {selected.sourceUrl ? (
                  <a
                    className="source-link"
                    href={selected.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {selected.sourcePublisher ?? "Open source"} ↗
                  </a>
                ) : (
                  <strong>Source unavailable</strong>
                )}
              </div>
              <div>
                <span className="meta-label">Verified</span>
                <strong>{dateLabel(selected.verifiedAt)}</strong>
              </div>
              <div>
                <span className="meta-label">Availability checked</span>
                <strong>{dateLabel(selected.availabilityCheckedAt)}</strong>
              </div>
              <div>
                <span className="meta-label">Model source</span>
                {selected.modelSourceUrl ? (
                  <a
                    className="source-link"
                    href={selected.modelSourceUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {selected.modelSourcePublisher ?? "Open source"} ↗
                  </a>
                ) : (
                  <strong>Unavailable</strong>
                )}
              </div>
            </div>

            <p className="hint">{selected.availabilityNote}</p>

            <div className="matrix-actions">
              <button
                className="button ghost"
                type="button"
                onClick={() => void copyQuote()}
              >
                {copied ? "Copied" : "Copy quote note"}
              </button>
              {selected.sellerUrl ? (
                <a
                  className="button ghost"
                  href={selected.sellerUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open seller ↗
                </a>
              ) : null}
              <Link
                className="button primary"
                href={`/shop?intake=${encodeURIComponent(selected.intakeText)}`}
              >
                Use in shop quote
              </Link>
            </div>
            <p className="hint">
              The shop quote still requires AI consent and human review; this
              matrix never creates a case or order.
            </p>
          </>
        ) : (
          <p>Select a row to inspect its source evidence and availability.</p>
        )}
      </aside>
    </div>
  );
}
