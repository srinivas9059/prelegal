"use client";

import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  buildNda,
  defaultValues,
  missingFields,
  todayIso,
  type NdaValues,
  type Party,
} from "@/lib/nda";
import styles from "./NdaCreator.module.css";

interface Props {
  coverTemplate: string;
  termsTemplate: string;
}

function PartyFields({
  legend,
  party,
  onChange,
}: {
  legend: string;
  party: Party;
  onChange: (party: Party) => void;
}) {
  const field = (key: keyof Party, label: string) => (
    <label className={styles.field}>
      <span>{label}</span>
      <input
        value={party[key]}
        onChange={(e) => onChange({ ...party, [key]: e.target.value })}
      />
    </label>
  );
  return (
    <fieldset className={styles.group}>
      <legend>{legend}</legend>
      {field("company", "Company")}
      {field("name", "Print name")}
      {field("title", "Title")}
      <label className={styles.field}>
        <span>Notice address (email or postal)</span>
        <textarea
          rows={2}
          value={party.address}
          onChange={(e) => onChange({ ...party, address: e.target.value })}
        />
      </label>
    </fieldset>
  );
}

export default function NdaCreator({ coverTemplate, termsTemplate }: Props) {
  const [values, setValues] = useState<NdaValues>(defaultValues);

  // Default the effective date to today in the user's timezone. Done after
  // mount because the page is prerendered and must not read the clock.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time client-only default
    setValues((prev) =>
      prev.effectiveDate ? prev : { ...prev, effectiveDate: todayIso() },
    );
  }, []);

  const set = <K extends keyof NdaValues>(key: K, value: NdaValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const markdown = useMemo(
    () => buildNda(values, coverTemplate, termsTemplate),
    [values, coverTemplate, termsTemplate],
  );
  const missing = missingFields(values);

  const download = () => {
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Mutual-NDA.md";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.layout}>
      <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
        <h1>Mutual NDA Creator</h1>
        <p className={styles.hint}>
          Fill in the key terms. The agreement on the right updates as you
          type.
        </p>

        <label className={styles.field}>
          <span>Purpose — how Confidential Information may be used</span>
          <textarea
            rows={3}
            value={values.purpose}
            onChange={(e) => set("purpose", e.target.value)}
          />
        </label>

        <label className={styles.field}>
          <span>Effective date</span>
          <input
            type="date"
            value={values.effectiveDate}
            onChange={(e) => set("effectiveDate", e.target.value)}
          />
        </label>

        <fieldset className={styles.group}>
          <legend>MNDA term</legend>
          <label className={styles.inline}>
            <input
              type="radio"
              name="mndaTerm"
              checked={values.mndaTermType === "expires"}
              onChange={() => set("mndaTermType", "expires")}
            />
            Expires after
            <input
              className={styles.number}
              type="number"
              min={1}
              value={values.mndaTermYears}
              onChange={(e) => set("mndaTermYears", e.target.value)}
              disabled={values.mndaTermType !== "expires"}
              aria-label="MNDA term in years"
            />
            year(s)
          </label>
          <label className={styles.inline}>
            <input
              type="radio"
              name="mndaTerm"
              checked={values.mndaTermType === "continues"}
              onChange={() => set("mndaTermType", "continues")}
            />
            Continues until terminated
          </label>
        </fieldset>

        <fieldset className={styles.group}>
          <legend>Term of confidentiality</legend>
          <label className={styles.inline}>
            <input
              type="radio"
              name="confidentiality"
              checked={values.confidentialityType === "years"}
              onChange={() => set("confidentialityType", "years")}
            />
            Protected for
            <input
              className={styles.number}
              type="number"
              min={1}
              value={values.confidentialityYears}
              onChange={(e) => set("confidentialityYears", e.target.value)}
              disabled={values.confidentialityType !== "years"}
              aria-label="Term of confidentiality in years"
            />
            year(s)
          </label>
          <label className={styles.inline}>
            <input
              type="radio"
              name="confidentiality"
              checked={values.confidentialityType === "perpetuity"}
              onChange={() => set("confidentialityType", "perpetuity")}
            />
            In perpetuity
          </label>
        </fieldset>

        <label className={styles.field}>
          <span>Governing law (state)</span>
          <input
            placeholder="e.g. Delaware"
            value={values.governingLaw}
            onChange={(e) => set("governingLaw", e.target.value)}
          />
        </label>
        <label className={styles.field}>
          <span>Jurisdiction (city or county and state)</span>
          <input
            placeholder="e.g. New Castle, DE"
            value={values.jurisdiction}
            onChange={(e) => set("jurisdiction", e.target.value)}
          />
        </label>
        <label className={styles.field}>
          <span>MNDA modifications (optional)</span>
          <textarea
            rows={3}
            value={values.modifications}
            onChange={(e) => set("modifications", e.target.value)}
          />
        </label>

        <PartyFields
          legend="Party 1"
          party={values.party1}
          onChange={(p) => set("party1", p)}
        />
        <PartyFields
          legend="Party 2"
          party={values.party2}
          onChange={(p) => set("party2", p)}
        />
      </form>

      <section className={styles.previewPane}>
        <div className={styles.toolbar}>
          <button type="button" onClick={download}>
            Download (.md)
          </button>
          <button type="button" onClick={() => window.print()}>
            Print / Save as PDF
          </button>
          {missing.length > 0 && (
            <span className={styles.warning}>
              Still needed: {missing.join(", ")}
            </span>
          )}
        </div>
        <article className={styles.document}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
        </article>
      </section>
    </div>
  );
}
