"use client";

// Renders the ORIGINAL partner Insights overview table (./original, copied verbatim) on top of the
// original toolkit TableWrapper. Data comes from a stand-in insightsAgent with fake affiliate rows.
import { useState } from "react";
import "@fontsource/lexend/300.css";
import "@fontsource/lexend/400.css";
import "@fontsource/lexend/500.css";
import "@fontsource/lexend/600.css";
import "../adtraction/adtraction-global.scss";
import { ToasterContainer } from "@adtraction/ui-components";
import { DemoButton, DemoStage } from "../DemoStage";
import InsightsOverviewTable from "./original/components/partnerPlatform/insights/table/InsightsOverviewTable";

const PERIOD = [new Date(2026, 8, 1), new Date(2026, 8, 30)];
const PREVIOUS = [new Date(2026, 7, 1), new Date(2026, 7, 31)];
const COUNTRIES = [{ countryCode: "DK", countryName: "Denmark" }];
const DEFAULT_FILTERS = { country: "DK", compensation: "cps" };

export function TableDemo() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [showCompare, setShowCompare] = useState(false);

  const removeFilter = (filter) => setFilters((prev) => ({ ...prev, [filter?.type]: null }));

  return (
    <DemoStage
      wide
      caption="The partner Insights overview table. Toggle Show comparison, open the column chooser (edit table), remove a filter chip, sort, hover and right-click cells."
      controls={
        <>
          <DemoButton onClick={() => setShowCompare((v) => !v)}>
            {showCompare ? "Hide comparison" : "Compare with August"}
          </DemoButton>
          <DemoButton onClick={() => setFilters(DEFAULT_FILTERS)}>Reset filters</DemoButton>
        </>
      }>
      <div className="adtraction-demo" style={{ maxWidth: "100%", overflowX: "auto" }}>
        <InsightsOverviewTable
          isInitialized
          groupBy="channel"
          tableId="portfolio-insights-overview"
          title="Channels"
          currencyCode="DKK"
          startDate={PERIOD[0]}
          endDate={PERIOD[1]}
          compareStartDate={PREVIOUS[0]}
          compareEndDate={PREVIOUS[1]}
          primaryColumnLabel="Sep 2026"
          compareColumnLabel="Aug 2026"
          showCompare={showCompare}
          canShowCompare
          onShowCompareChange={() => setShowCompare((v) => !v)}
          countryId={filters.country}
          availableCountries={COUNTRIES}
          compensationId={filters.compensation}
          compensationName={filters.compensation ? "CPS 8%" : null}
          onRemoveActiveFilter={removeFilter}
        />
        <ToasterContainer />
      </div>
    </DemoStage>
  );
}
