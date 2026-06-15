# 13 — Reference Report Specifications

> Source: Product owner reference PDF documents (provided 2026-06-15)
> Status: Phase 2 planning only — not yet implemented
> Purpose: Define the target output format for branded PDF generation in Phase 2

---

## Overview

Two reference PDF reports were provided by the product owner as target output examples. These documents define the required fields, structure, and layout for Phase 2 PDF generation.

**These are output specifications, not current features.** Nothing in this document requires any change to the existing MVP.

---

## A. Daily Work Log PDF (יומן עבודה)

**Hebrew name:** יומן עבודה
**Purpose:** Formal daily or periodic site activity record. Submitted to the client, project owner, and/or supervision authority. Captures who was on site, what work was done, any observations made.

---

### Section 1 — General Information

| Field | Hebrew | Notes |
|---|---|---|
| Project name | שם הפרויקט | |
| File / report number | מספר תיק / דוח | Sequential per project |
| Serial number | מספר סידורי | Log number |
| Date range (from–to) | תאריכים (מ–עד) | May cover multiple days |
| Work hours on site | שעות עבודה באתר | e.g. "07:00–16:00" |
| Site address | כתובת האתר | |
| Weather | מזג אוויר | |

---

### Section 2 — Role Holders

| Role | Hebrew |
|---|---|
| Project manager | מנהל פרויקט |
| Work manager | מנהל עבודה |
| Safety assistant | מסייע בטיחות |
| Additional role holders | בעלי תפקידים נוספים |

Each role: name + company affiliation.

---

### Section 3 — Contractors Table

One row per contractor company present on site.

| Column | Hebrew | Notes |
|---|---|---|
| Contractor / trade | קבלן / מקצוע | Company name and trade |
| Worker count | מספר פועלים | Integer |
| Work location | מיקום עבודה | Area of site |
| Work description | תיאור עבודה | Free text |

---

### Section 4 — Equipment and Materials

One row per equipment type or major material delivery.

| Column | Hebrew | Notes |
|---|---|---|
| Equipment / material name | שם הציוד / חומר | |
| Quantity | כמות | |
| Notes | הערות | |

---

### Section 5 — Notes and Observations

Each note has a category and free text. Photos can be attached per note.

| Field | Hebrew | Notes |
|---|---|---|
| Note type / category | סוג הערה | `supervision` (פיקוח) / `safety` (בטיחות) / `quality` (איכות) / `general` (כללי) |
| Note body | תוכן ההערה | Free text |
| Photos | תמונות | One or more photos attached to this note |

---

### Section 6 — Signature

| Field | Hebrew | Notes |
|---|---|---|
| Report writer | עורך הדוח | Name |
| Report writer signature | חתימת עורך הדוח | Image or typed name field |

---

### PDF Layout Requirements

- A4 format, Hebrew RTL
- Company logo in header (top right in RTL layout)
- Company name, address, phone, email in header
- Page number in footer: "עמוד X מתוך Y"
- Footer includes report date and project name
- Tables with visible borders
- Section headers in bold
- Photo grid: 2 photos per row with caption below each

---

## B. Engineering Response PDF (דוח תגובה הנדסי)

**Hebrew name:** דוח תגובה / התייחסות הנדסי — דוח תגובה לממצאי בדיקה
**Purpose:** Professional engineering response to an inspection report or list of findings/claims. Prepared by a licensed engineer. Includes professional position per finding, standard references, and cost estimates.

---

### Section 1 — Client and Property Details

| Field | Hebrew | Notes |
|---|---|---|
| Client name | שם הלקוח | |
| Property / site address | כתובת הנכס / האתר | |

---

### Section 2 — Report Metadata

| Field | Hebrew | Notes |
|---|---|---|
| Report editor | עורך הדוח | Engineer name + license number |
| Visit date | תאריך ביקור | Date of site inspection |
| Report number | מספר דוח | Sequential |
| Report purpose | מטרת הדוח | Brief statement |

---

### Section 3 — Documents Reviewed

List of documents reviewed prior to or during the inspection visit. Free text or bulleted list.

Examples:
- Approved construction drawings
- Prior inspection report (number, date)
- Standards referenced (Israeli Standard IS number)

---

### Section 4 — Professional Declaration

Free text section containing the engineer's formal professional testimony / declaration. Typically: "I, the undersigned, [name], licensed engineer [license #], hereby declare that..."

---

### Section 5 — Building Description

Free text description of the building or structure being inspected.

---

### Section 6 — Findings and Responses (Per Finding)

Each finding is a numbered item. The document iterates through all findings.

#### Per Finding — Claim / Finding

| Field | Hebrew | Notes |
|---|---|---|
| Finding number | מספר ממצא | Sequential |
| Claim / finding text | טענה / ממצא | Exact text of the claim as stated in the inspection report |
| Location | מיקום | Building location (floor, unit, area) |
| Photos | תמונות מצורפות | Photos documenting the finding |

#### Per Finding — Engineer's Response

| Field | Hebrew | Notes |
|---|---|---|
| Response text | התייחסות הנדסית | Engineer's professional position |
| Standard reference | הפניה לתקן | Standard or regulation cited (e.g. "ת"י 1234") |
| Quoted standard text | ציטוט מהתקן | Exact quoted text from the standard |
| Response photos | תמונות לביסוס התגובה | Photos supporting the engineering response |

#### Per Finding — Cost Estimate

One or more line items per finding.

| Column | Hebrew | Notes |
|---|---|---|
| Description | תיאור עבודה | Work item description |
| Quantity | כמות | Numeric |
| Unit | יחידה | e.g. מ"ר, מ"ל, יח', קג |
| Unit price | מחיר יחידה | ILS |
| Total | סה"כ | quantity × unit_price |
| Supervision % | % פיקוח | Additional overhead percentage |
| VAT % | מע"מ | Typically 18% |
| Total with VAT | סה"כ כולל מע"מ | Final total |

---

### Section 7 — Summary

| Field | Hebrew | Notes |
|---|---|---|
| Total number of claims | מספר כולל של טענות | Integer |
| Claims with response | טענות עם התייחסות | Integer |
| Claims pending response | טענות ממתינות לתגובה | Integer |
| Grand total cost | סה"כ עלות כוללת | Sum of all finding cost estimates + VAT |

---

### Section 8 — Signature

| Field | Hebrew | Notes |
|---|---|---|
| Engineer name | שם המהנדס | |
| License number | מספר רישיון | |
| Engineer signature | חתימה | Image or typed name |
| Date | תאריך | Report completion date |

---

### PDF Layout Requirements

- A4 format, Hebrew RTL
- Company logo in header (top right)
- Company name, address, phone, email in header
- "דוח תגובה הנדסי" as document title
- Page number in footer: "עמוד X מתוך Y"
- Each finding starts on a consistent layout block (not necessarily a new page)
- Cost estimate table with visible column borders and total row highlighted
- Professional declaration section in italics or bordered box
- Signature section at the end with horizontal line for handwritten signature

---

## Acceptance Criteria (Phase 2)

### Daily Work Log PDF

- [ ] User can create a daily log entry and generate a branded PDF
- [ ] PDF includes all sections: general info, role holders, contractors, equipment, notes, photos, signature
- [ ] Photos attached to notes appear inline in the notes section
- [ ] PDF is A4, RTL, Hebrew throughout
- [ ] PDF opens correctly in standard PDF readers (Acrobat, browser PDF viewer)
- [ ] PDF is stored in Supabase Storage and retrievable by authorized users
- [ ] Generated PDF visually resembles the reference daily work log document

### Engineering Response PDF

- [ ] User can create findings with response text, standard references, and cost estimates
- [ ] Cost estimate totals are computed automatically (quantity × unit price, + supervision %, + VAT)
- [ ] Summary section shows correct counts of responded vs. pending findings
- [ ] Photos attach to individual findings and appear in the correct section of the PDF
- [ ] PDF includes professional declaration section
- [ ] PDF includes signature section
- [ ] Generated PDF visually resembles the reference engineering response document

---

## What Is NOT Required in Phase 2

- Cryptographic digital signatures (not required — typed name / image field is sufficient)
- Integration with external standard databases (standard text entered manually)
- Automated cost approval workflows
- Client portal for external report viewing
- Email delivery of PDFs (can be added in Phase 3 if approved)
