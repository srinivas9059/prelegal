export interface NdaValues {
  purpose: string;
  effectiveDate: string; // YYYY-MM-DD
  mndaTermType: "expires" | "continues";
  mndaTermYears: string;
  confidentialityType: "years" | "perpetuity";
  confidentialityYears: string;
  governingLaw: string;
  jurisdiction: string;
  modifications: string;
  party1: Party;
  party2: Party;
}

export interface Party {
  name: string;
  title: string;
  company: string;
  address: string;
}

export const DEFAULT_PURPOSE =
  "Evaluating whether to enter into a business relationship with the other party.";

/** Today's date in the user's local timezone, as YYYY-MM-DD. */
export const todayIso = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const emptyParty = (): Party => ({
  name: "",
  title: "",
  company: "",
  address: "",
});

export const defaultValues = (): NdaValues => ({
  purpose: DEFAULT_PURPOSE,
  effectiveDate: "", // set to today on the client after mount
  mndaTermType: "expires",
  mndaTermYears: "1",
  confidentialityType: "years",
  confidentialityYears: "1",
  governingLaw: "",
  jurisdiction: "",
  modifications: "",
  party1: emptyParty(),
  party2: emptyParty(),
});

/** Escape characters that would be interpreted as Markdown/HTML in user input. */
export function escapeMarkdown(text: string): string {
  return text
    .replace(/([\\`*_{}\[\]<>#|~])/g, "\\$1")
    .replace(/\r?\n/g, " ");
}

/** Escape multi-line user text, keeping line breaks as separate paragraphs. */
function escapeBlock(text: string): string {
  return text
    .split(/\r?\n/)
    .map((line) => escapeMarkdown(line))
    .join("\n\n");
}

export function formatDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return iso;
  const date = new Date(Date.UTC(+match[1], +match[2] - 1, +match[3]));
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

const years = (n: string) => {
  const count = n.trim() || "___";
  return `${count} year${count === "1" ? "" : "s"}`;
};

const blank = (value: string, placeholder: string) =>
  value.trim() ? escapeMarkdown(value.trim()) : `[${placeholder}]`;

const checkbox = (checked: boolean) => (checked ? "[x]" : "[ ]");

/** The introductory paragraph under "USING THIS MUTUAL NON-DISCLOSURE AGREEMENT". */
function coverIntro(coverTemplate: string): string {
  const match =
    /## USING THIS MUTUAL NON-DISCLOSURE AGREEMENT\s+([\s\S]*?)\s+### Purpose/.exec(
      coverTemplate,
    );
  return match ? match[1].trim() : "";
}

/** Footer attribution line from the cover page template. */
function coverFooter(coverTemplate: string): string {
  const lines = coverTemplate.trim().split(/\r?\n/);
  return lines[lines.length - 1].trim();
}

export function buildCoverPage(values: NdaValues, coverTemplate: string): string {
  const v = values;
  const row = (label: string, a: string, b: string) =>
    `| ${label} | ${a} | ${b} |`;
  const party = (p: Party, key: keyof Party) => escapeMarkdown(p[key].trim());

  return [
    "# Mutual Non-Disclosure Agreement",
    "## USING THIS MUTUAL NON-DISCLOSURE AGREEMENT",
    coverIntro(coverTemplate),
    "### Purpose",
    "*How Confidential Information may be used*",
    blank(v.purpose, "Purpose"),
    "### Effective Date",
    escapeMarkdown(formatDate(v.effectiveDate)),
    "### MNDA Term",
    "*The length of this MNDA*",
    [
      `- ${checkbox(v.mndaTermType === "expires")} Expires ${years(v.mndaTermYears)} from Effective Date.`,
      `- ${checkbox(v.mndaTermType === "continues")} Continues until terminated in accordance with the terms of the MNDA.`,
    ].join("\n"),
    "### Term of Confidentiality",
    "*How long Confidential Information is protected*",
    [
      `- ${checkbox(v.confidentialityType === "years")} ${years(v.confidentialityYears)} from Effective Date, but in the case of trade secrets until Confidential Information is no longer considered a trade secret under applicable laws.`,
      `- ${checkbox(v.confidentialityType === "perpetuity")} In perpetuity.`,
    ].join("\n"),
    "### Governing Law & Jurisdiction",
    `Governing Law: ${blank(v.governingLaw, "State")}\n\nJurisdiction: ${blank(v.jurisdiction, "City or county and state")}`,
    "### MNDA Modifications",
    v.modifications.trim() ? escapeBlock(v.modifications.trim()) : "None.",
    "By signing this Cover Page, each party agrees to enter into this MNDA as of the Effective Date.",
    [
      "|  | PARTY 1 | PARTY 2 |",
      "| :--- | :---: | :---: |",
      row("Signature", "&nbsp;", "&nbsp;"),
      row("Print Name", party(v.party1, "name"), party(v.party2, "name")),
      row("Title", party(v.party1, "title"), party(v.party2, "title")),
      row("Company", party(v.party1, "company"), party(v.party2, "company")),
      row(
        "Notice Address",
        party(v.party1, "address"),
        party(v.party2, "address"),
      ),
      row("Date", "&nbsp;", "&nbsp;"),
    ].join("\n"),
    coverFooter(coverTemplate),
  ].join("\n\n");
}

/**
 * Fill the Standard Terms. Cross-references to cover page items stay as bold
 * defined terms, except Governing Law and Jurisdiction, which are replaced
 * with the values the user entered (the terms read "the laws of the State of
 * <Governing Law>").
 */
export function buildStandardTerms(
  values: NdaValues,
  termsTemplate: string,
): string {
  const substitutions: Record<string, string> = {
    "Governing Law": blank(values.governingLaw, "Governing Law"),
    Jurisdiction: blank(values.jurisdiction, "Jurisdiction"),
  };
  return termsTemplate.replace(
    /<span class="coverpage_link">([^<]+)<\/span>/g,
    (_, term: string) => substitutions[term] ?? `**${term}**`,
  );
}

export function buildNda(
  values: NdaValues,
  coverTemplate: string,
  termsTemplate: string,
): string {
  return `${buildCoverPage(values, coverTemplate)}\n\n---\n\n${buildStandardTerms(values, termsTemplate)}`;
}

/** Fields required before the document is considered complete. */
export function missingFields(values: NdaValues): string[] {
  const missing: string[] = [];
  if (!values.purpose.trim()) missing.push("Purpose");
  if (!values.effectiveDate) missing.push("Effective date");
  if (!values.governingLaw.trim()) missing.push("Governing law");
  if (!values.jurisdiction.trim()) missing.push("Jurisdiction");
  if (!values.party1.company.trim()) missing.push("Party 1 company");
  if (!values.party2.company.trim()) missing.push("Party 2 company");
  return missing;
}
