---
name: table-extraction
description: "Extract tables from PDFs, HTML pages, and images into structured formats. Triggers on: extracting tabular data from PDF reports or scanned documents, converting document tables to CSV/JSON/DataFrames, parsing tables from HTML without API access, handling merged cells or multi-row headers, OCR-based table extraction from images. Does NOT trigger on: creating new tables in documents, generating Excel files from scratch, extracting plain text from PDFs, or editing existing PDFs."
license: Apache-2.0
compatibility:
  clients: [openai-codex, gemini-cli, opencode]
metadata:
  owner: codex
  domain: table-extraction
  maturity: draft
  risk: low
  tags: [table-extraction, camelot, tabula, row-detection, header-inference]
---

# Purpose

Extract tables from PDFs, HTML pages, and images into structured data formats. Detect row/column boundaries, infer headers, handle merged cells and multi-line rows, and output clean CSV, JSON, or pandas DataFrames using camelot, tabula-py, pdfplumber, or custom parsers — building reliable table extraction pipelines for data processing workflows.

# When to use

- Extracting tabular data from PDF reports, financial statements, or government filings.
- Pulling tables from HTML pages where the data is not available via API.
- Building a pipeline that converts document tables into database-ready structured formats.
- Processing scanned documents with OCR to extract table content from images.
- Handling complex tables with merged cells, multi-row headers, or nested structures.
- Converting document tables to CSV, JSON, or pandas DataFrames for analysis.

# When NOT to use

- Creating tables in new documents — prefer `document-writing` or `docx-generation`.
- Generating Excel files from scratch — prefer `xlsx-generation`.
- Extracting non-tabular text from PDFs — prefer `pdf-extraction`.
- Editing or annotating existing PDFs — prefer `pdf-editor`.
- Querying data already available via a REST API — use API clients directly.

# Procedure

1. **Identify the source format.** Determine whether the input is a native PDF (text-based), a scanned PDF (image-based requiring OCR), an HTML page, or a standalone image. Test by attempting text extraction: if `pdfplumber` returns meaningful text, it is text-based; if only images are detected, it requires OCR.
2. **Select the extraction tool.** Choose based on source type and table structure:
   - Text-based PDFs with visible borders: use camelot `flavor='lattice'`.
   - Text-based PDFs without visible borders: use camelot `flavor='stream'` or pdfplumber.
   - Scanned PDFs or images: apply OCR first (Tesseract via pytesseract or `pdf2image` + OCR), then extract tables from the recognized text.
   - HTML pages: use `pandas.read_html()` as the first attempt; fall back to BeautifulSoup only if pandas fails on complex nested structures.
   - Java-available environments: consider tabula-py as an alternative to camelot for simple bordered tables.
3. **Configure extraction parameters.** Adjust based on document characteristics:
   - For camelot lattice with thin ruling lines: `line_scale=15`, `joint_tol=2`, `edge_tol=5`.
   - For camelot lattice with thick ruling lines: `line_scale=40`, `joint_tol=5`, `edge_tol=10`.
   - For camelot stream with tightly packed tables: `row_tol=5`, `column_tol=5`.
   - For camelot stream with loosely spaced tables: `row_tol=10`, `column_tol=10`.
   - For pdfplumber with partial-page tables: define explicit `page.crop(bounding_box)` to isolate the table region before extraction.
4. **Extract raw table data.** Run the extraction and capture the raw DataFrame output. For multi-page documents, iterate pages and extract tables from each: `camelot.read_pdf(path, pages='1-end', flavor='lattice')`.
5. **Detect and validate headers.** Check if the first row contains header values or data. Heuristics: headers are typically bold, contain no numeric-only values, and have unique values. If headers span multiple rows, merge them into a single header row with concatenated names.
6. **Handle merged cells.** Identify cells spanning multiple rows or columns. For vertically merged cells, forward-fill the value down. For horizontally merged cells, assign the value to the first column and mark others as derived. Log each merge operation for traceability.
7. **Clean extracted data.** Strip whitespace from all cells. Remove empty rows and columns. Normalize number formats (remove thousands separators, fix decimal points). Convert date strings to ISO 8601 format. Replace OCR artifacts (e.g., `l` misread as `1`) using domain-specific rules.
8. **Validate table structure.** Confirm consistent column counts across all rows. Check that numeric columns parse as numbers. Verify header names are unique. Flag rows where the column count mismatches the header count.
9. **Output in the target format.** Export as CSV (`df.to_csv()`), JSON (`df.to_json(orient='records')`), or return the DataFrame directly. Include metadata: source file, page number, table index on page, extraction confidence score, and row/column counts.
10. **Compare against ground truth.** If a reference dataset exists, compare extracted values cell-by-cell. Report accuracy metrics: exact match rate, numeric tolerance match rate, and rows with discrepancies.

# Decision rules

- Use camelot lattice mode as the default for PDFs with visible table borders — it is the most reliable.
- Switch to camelot stream mode only when lattice produces zero tables (no ruling lines detected).
- Use pdfplumber when tables have complex layouts that camelot mishandles (nested tables, tables with footnotes embedded in cells).
- Use pandas `read_html()` for HTML sources — it handles most standard HTML table markup correctly.
- Apply OCR (Tesseract) only for scanned/image-based documents — it is slow and error-prone on text-based PDFs.
- When extraction confidence is below 80%, flag the output for manual review rather than silently delivering bad data.

# Output contract

1. Structured data in the requested format (CSV, JSON, or DataFrame) with consistent column types.
2. Extraction metadata: source file path, page number, table index, row count, column count, and confidence score.
3. A cleaning log listing transformations applied (merged cells filled, whitespace stripped, formats normalized).
4. Flagged rows where extraction confidence is low or column counts are inconsistent.

# References

- Camelot documentation: https://camelot-py.readthedocs.io/
- pdfplumber documentation: https://github.com/jsvine/pdfplumber
- tabula-py documentation: https://tabula-py.readthedocs.io/
- Tesseract OCR: https://github.com/tesseract-ocr/tesseract
- pandas read_html: https://pandas.pydata.org/docs/reference/api/pandas.read_html.html

# Next steps

- `pdf-extraction` — for extracting non-tabular content (text, images, metadata) from PDFs.
- `document-to-structured-data` — for broader document-to-data conversion beyond tables.
- `xlsx-generation` — for producing Excel files from extracted table data.

# Anti-patterns

- Running extraction without inspecting the PDF first — always check if it is text-based or scanned before choosing a tool.
- Using OCR on text-based PDFs — wastes time and introduces errors that do not exist in the source.
- Ignoring merged cells — produces misaligned data where values shift to wrong columns.
- Hardcoding column indices instead of matching by header name — breaks when the source table format changes.
- Treating all extracted numbers as strings — prevents downstream numeric operations and aggregations.

# Failure handling

- **Zero tables detected by camelot lattice:** Automatically retry with `flavor='stream'` and tolerance adjustments (`row_tol=10`, `column_tol=10`). If still zero tables, inspect the PDF visually to confirm tables exist, then try pdfplumber with explicit bounding boxes.
- **OCR produces garbled or low-confidence text:** Check source resolution. If below 300 DPI, report: "Re-scan at 300+ DPI and reprocess." If at 300 DPI already, report: "OCR quality insufficient; consider manual review or specialized OCR tuning."
- **Column count mismatch across rows:** Output the raw extraction with a warning header listing the specific row indices where column counts differ. Include both expected and actual column counts for each mismatched row.
- **Missing required library:** Output the exact install command and halt immediately:
  - `pip install camelot-py[cv]` for camelot with computer vision support
  - `pip install pdfplumber` for pdfplumber
  - `pip install pytesseract pdf2image` for OCR workflows
  - `pip install tabula-py` for tabula-py (requires Java runtime)
- **Password-protected PDF:** Report the specific error (`PdfReadError: File has not been decrypted`) and request the password or an unlocked version before proceeding.
- **Merged cells causing data misalignment:** Log each fill operation with source cell coordinates and destination cells. Report: "Merged cell at [row, col] filled to [start_row:end_row, col]."
- **Header detection uncertainty:** When header confidence is below 80%, output a warning: "Header detection uncertain. Review rows 1-{N} and confirm header boundaries."
- **Multi-page extraction partial failure:** If some pages fail extraction while others succeed, output successful tables with a failure log listing page numbers and specific error messages for failed pages.
