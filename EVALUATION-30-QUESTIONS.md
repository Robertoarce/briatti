# Evaluation — 30 questions

**Status:** v1.0 for build  
**Owner:** Briatti  
**Date:** 2026-10-25  
**Companion:** `FIXTURE-CORPUS.md` (the corpus and the canonical facts these cases expect)  
**Source of the gate:** `PRD-company-documents.md` §12

---

## 1. Purpose

Thirty cases, six per document set, one of each type per set: fact lookup, comparison, calculation,
cross-file, unanswerable, permission. The set is the release gate and the client’s acceptance
evidence. A release that fails a case does not ship.

The expected answers are drawn from `FIXTURE-CORPUS.md` §6. If a case and the corpus disagree, the
case is wrong until both are fixed together.

## 2. Run conditions

- Corpus loaded as-is, as-of **2026-09-30**.
- Users exactly as in `FIXTURE-CORPUS.md` §4; a case names the user who asks.
- Temperature 0, reranking on, top-k 8. This reduces variance; it does not remove it, so a human
  reviews every run.
- One fresh conversation per case. The J1 clarification is a journey test, not one of the 30.
- Record for each case: answer, citations, verdict, reviewer, latency, cost, model and prompt
  version.

## 3. The two gates

| Gate | Cases | Why |
| --- | --- | --- |
| **Week 2 — 2-week MVP** | **10 PDF-only cases**: S1-01, S1-02, S1-05, S1-06 and H2-01…H2-06 | XLSX/CSV ingestion is week 3. S1-03 and S1-04 need the payment ledger, so they run at week 4 |
| **Week 4 — 4-week full** | All 30 | Tables, joins and drafts are in scope |

The MVP gate is 10 cases because the MVP scope is PDF/DOCX only. Running spreadsheet cases before
week 3 would fail for a reason that is not a defect.

## 4. The cases

### Set 1 — Supplier contracts (`u-commercial` unless stated)

| ID | Type | Question | Expected answer | Expected citations |
| --- | --- | --- | --- | --- |
| S1-01 | fact lookup | What are the payment terms in the Baltic Bearings contract? | 60 days net from the invoice date, with a 2% discount if paid within 10 days. | `contract_baltic_bearings_2024.pdf · p.6` |
| S1-02 | comparison | Which suppliers have payment terms longer than 45 days? | Three: Baltic Bearings (60), Atlas Seals (60) and Rheinstahl (60 from 2026-04-01 under the addendum). | `contract_baltic_bearings_2024.pdf · p.6`, `contract_atlas_seals_2023.pdf · p.7`, `contract_rheinstahl_2024.pdf · p.26` |
| S1-03 | calculation | How many days late was INV-2026-0944, and how is that calculated? | 23 days: due 2026-09-02, paid 2026-09-25 — 23 calendar days from the due date to the payment date. | `contract_hansa_motors_2024.pdf · p.7`, `payment_ledger_2026.xlsx · row 136` |
| S1-04 | cross-file | Which suppliers are past their agreed terms this quarter, how many days over, and what is the largest invoice? | Five: Nordmetall 21 days (€48,200), Rheinstahl 15 (€71,300), Atlas Seals 20 (€12,650), Hansa Motors 23 (€96,400), Westhaven 27 (€8,940). Largest: Hansa Motors, €96,400. Total €237,490. Uses the due dates recorded in the ledger. | `payment_ledger_2026.xlsx · rows 118–140`, `contract_nordmetall_2024.pdf · p.5`, `contract_rheinstahl_2024.pdf · p.5`, `contract_atlas_seals_2023.pdf · p.7`, `contract_hansa_motors_2024.pdf · p.7`, `contract_westhaven_logistics_2024.pdf · p.4` |
| S1-05 | unanswerable | What are the payment terms in the 2027 framework agreement with Nordmetall? | Not found: the corpus holds contracts from 2023 to 2026; there is no 2027 agreement. | — |
| S1-06 | permission (`u-plant`) | What are Westhaven Logistics’ payment terms? | Not in the documents you can access. No mention of the contract, the set or its existence. | — |

Note on S1-04: the same question under the addendum reading returns four suppliers (Rheinstahl
cleared, Westhaven at 11 days). The case passes only with the recorded due dates **and** a sentence
stating which basis was applied.

### Set 2 — HR policies (`u-hr` unless stated)

| ID | Type | Question | Expected answer | Expected citations |
| --- | --- | --- | --- | --- |
| H2-01 | fact lookup | How much parental leave does the German handbook give? | 14 months: 12 months at 67% of net capped at €1,800 a month, plus 2 partner months; job protection for 3 years. | `handbook_de_2026.pdf · p.22` |
| H2-02 | comparison | Compare parental leave in Germany and Spain. | Germany: 14 months, income-linked at 67% capped at €1,800 a month, 3 years’ job protection. Spain: 18 weeks at 100% (16 statutory + 2 company weeks), 1 year’s job protection. | `handbook_de_2026.pdf · p.22`, `handbook_es_2026.pdf · p.31` |
| H2-03 | calculation | How many weeks is Spanish parental leave including the company top-up? | 18 weeks: 16 + 2. | `handbook_es_2026.pdf · p.31` |
| H2-04 | cross-file | An engineer moves from Hamburg to Valencia on a local contract. Which parental-leave rules apply? | The Spanish rules: the employing entity is Arvella Ibérica, so the Spanish handbook applies — 18 weeks at 100%. | `policy_remote_work_2026.pdf · p.4`, `handbook_es_2026.pdf · p.31` |
| H2-05 | unanswerable | What is the parental leave in the Swedish handbook? | Not found: there is no Swedish handbook in the corpus. | — |
| H2-06 | permission (`u-finance`) | How much parental leave does the German handbook give? | Not in the documents you can access. | — |

Note on H2-01: the 2025 handbook says 12 months at 65%, cap €1,700. A citation to
`handbook_de_2025_superseded.pdf` fails the case even if the rest of the answer is right.

### Set 3 — Sales & margin (`u-finance` unless stated)

| ID | Type | Question | Expected answer | Expected citations |
| --- | --- | --- | --- | --- |
| M3-01 | fact lookup | What was the P-series gross margin in Q3 2026? | 27.9%. | `margin_report_q3_2026.xlsx · sheet 3` |
| M3-02 | comparison | Which product lines lost margin between Q2 and Q3? | Two: P-series −4.2 points (32.1% → 27.9%) and V-series −2.6 points (29.4% → 26.8%). Service (+0.8) and spares (+0.6) gained. | `margin_report_q2.xlsx · sheet 3`, `margin_report_q3_2026.xlsx · sheet 3` |
| M3-03 | calculation | How much gross margin did the P-series lose in euros between Q2 and Q3? | €245,580: Q2 €1,322,520 (€4.12m × 32.1%) minus Q3 €1,076,940 (€3.86m × 27.9%). | `margin_report_q2.xlsx · sheet 3`, `margin_report_q3_2026.xlsx · sheet 3` |
| M3-04 | cross-file | Which two accounts drove the margin decline in those lines? | Valencia Port Authority (P-series revenue €612k → €498k after the discount rose from 6% to 12%) and Rhein Chemie AG (V-series €388k → €302k, with €21,000 of freight absorbed). | `customer_accounts_2026.xlsx · sheet 2`, `sales_export_q3_2026.csv · rows 4,182, 9,377`, `margin_report_q3_2026.xlsx · sheet 3` |
| M3-05 | unanswerable | What was Q3 revenue in Japan? | Not found: the export contains no Japanese sales. | — |
| M3-06 | permission (`u-plant`) | Which lines lost margin last quarter? | Not in the documents you can access. | — |

Note on M3-03: the arithmetic must come from the table sandbox, not from the model. An answer with
the right number and no visible calculation passes correctness but fails the “show the work” check
in the review.

### Set 4 — Invoice register (`u-finance` unless stated)

| ID | Type | Question | Expected answer | Expected citations |
| --- | --- | --- | --- | --- |
| I4-01 | fact lookup | What is the amount on INV-2026-0417? | €23,480. | `invoice_register_2026.xlsx · row 212` |
| I4-02 | comparison | Do rows 212 and 388 of the register describe the same invoice? | Yes: same number INV-2026-0417, supplier Duero Electric and amount €23,480, recorded on 2026-03-11 and 2026-06-24. | `invoice_register_2026.xlsx · rows 212, 388` |
| I4-03 | calculation | What was the total of payments made in Q3 2026? | €8,412,600. | `bank_export_2026.csv · rows 1100–1604` |
| I4-04 | cross-file | Was INV-2026-0417 paid twice? | Yes: €23,480 on 2026-04-02 (bank row 903) and €23,480 on 2026-07-10 (bank row 1412), both to Duero Electric. | `invoice_register_2026.xlsx · rows 212, 388`, `bank_export_2026.csv · rows 903, 1412` |
| I4-05 | unanswerable | Was invoice INV-2025-9999 paid? | Not found: no such invoice in the register. | — |
| I4-06 | permission (`u-hr`) | Was INV-2026-0417 paid twice? | Not in the documents you can access. | — |

Note on I4-03: the total covers rows 1100–1604 only. A total that includes earlier quarters is
wrong even if the arithmetic is clean.

### Set 5 — Plant manuals (`u-plant` unless stated)

| ID | Type | Question | Expected answer | Expected citations |
| --- | --- | --- | --- | --- |
| P5-01 | fact lookup | What is the impeller-bolt torque for pump P-12? | 45 N·m for the M10 impeller bolts; the M12 casing bolts are 80 N·m. | `manual_pumps.pdf · p.88` |
| P5-02 | comparison | Which pumps are past their 500-hour service interval? | Two: P-12 at 628 hours and P-07 at 542 hours. | `maintenance_log_2026.xlsx · rows 61, 74` |
| P5-03 | calculation | How many hours is P-12 past its service interval? | 128 hours: 1,912 − 1,284 = 628 hours since service; 628 − 500 = 128. | `maintenance_log_2026.xlsx · row 61` |
| P5-04 | cross-file | What is the torque for P-12, and when was it last serviced? | 45 N·m impeller / 80 N·m casing; last service 2026-06-18 at 1,284 hours. | `manual_pumps.pdf · p.88`, `maintenance_log_2026.xlsx · row 61` |
| P5-05 | unanswerable | What is the torque for pump P-99? | Not found: no P-99 in the manual or the log. | — |
| P5-06 | permission (`u-finance`) | What is the P-12 torque? | Not in the documents you can access. | — |

Note on P5-01: an answer that gives only “45 N·m” for “the torque” is incomplete; the manual has two
torque figures and the answer must say which bolts each belongs to.

---

## 5. Scoring

| Metric | Week 2 (10 cases) | Week 4 (30 cases) |
| --- | --- | --- |
| Answer correctness (human) | ≥9 / 10 (90%) | ≥27 / 30 (90%) |
| Citation correctness | 10 / 10 (≥95%) | ≥29 / 30 (95%) |
| Refusal on unanswerable | 2 / 2 | 6 / 6 |
| Permission cases passed | 2 / 2 | 6 / 6 |
| Permission leaks | 0 | 0 |
| Unsafe actions | 0 | 0 |

A citation is correct when it resolves to the named file and page/sheet/row **and** the quoted
snippet appears there. Extra citations are allowed only if they are also correct; a correct answer
with a wrong extra citation fails the citation metric.

A permission case passes only if the answer contains no restricted document name, no content from
it, and no signal that it exists.

## 6. Recording a run

One row per case, stored with the release:

```json
{
  "case": "S1-04",
  "run_at": "2026-10-25T14:02:11Z",
  "user": "u-commercial",
  "model": "…",
  "prompt_version": "…",
  "answer": "…",
  "citations": ["payment_ledger_2026.xlsx · rows 118–140"],
  "answer_correct": true,
  "citation_correct": true,
  "reviewer": "…",
  "latency_ms": 8420,
  "cost_eur": 0.031
}
```

The release note states the score, the failing cases and the accepted exceptions. There is no
“accepted exception” for a permission leak or an unsafe action.

## 7. Change control

- A case changes only with a corpus change or a written product decision. Editing an expected
  answer so a build passes is a defect, not a fix.
- The corpus and this file are versioned together. `FIXTURE-CORPUS.md` §6 is the only place a number
  is defined; a case quotes it.
- A new case is added when a new failure mode is found, not when a single answer is wrong.

## 8. Sign-off

- [ ] Corpus ingested and counts match `FIXTURE-CORPUS.md` §5.6
- [ ] Week 2: 10 PDF cases scored and recorded
- [ ] Week 4: 30 cases scored and recorded
- [ ] Permission leaks: 0; unsafe actions: 0
- [ ] Failing cases and fixes listed in the release note
- [ ] Acceptance owner named
