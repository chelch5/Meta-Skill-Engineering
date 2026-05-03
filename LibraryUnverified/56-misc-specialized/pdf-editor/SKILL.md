---
name: pdf-editor
description: "Modify existing PDFs — merge multiple files, split by page ranges, rotate pages, add watermarks, fill form fields, edit metadata, and redact content using PyPDF2, pikepdf, or pdftk. Use when manipulating existing PDF files rather than creating new ones or extracting content. Do not use for PDF creation from scratch (prefer pdf-generation) or text extraction (prefer pdf-extraction)."
---

# Purpose

Modify existing PDF files — merge multiple PDFs into one, split by page ranges, rotate pages, add watermarks and overlays, fill form fields, edit document metadata, redact sensitive content, and manipulate page order using PyPDF2, pikepdf, or pdftk. This skill covers structural PDF manipulation rather than content creation or text extraction.

# When to use

- Multiple PDF files need to be merged into a single document
- A PDF needs to be split into separate files by page ranges or chapters
- Pages need rotation (scanned pages in wrong orientation)
- A watermark, stamp, or overlay must be added to existing PDF pages
- PDF form fields need to be filled programmatically (applications, contracts, government forms)
- Document metadata (title, author, keywords, creation date) needs editing
- Sensitive content must be redacted (blackout text, remove pages)
- Page order needs rearranging, or specific pages need extraction

# When NOT to use

- Creating a new PDF from scratch (HTML, Markdown, or data) — prefer `pdf-generation`
- Extracting text, tables, or metadata from a PDF for analysis — prefer `pdf-extraction`
- The PDF is image-based and needs OCR text extraction — prefer `image-heavy-pdfs`
- The task involves Word document manipulation — prefer `docx-generation`

# Procedure

1. **Install dependencies** — Run the appropriate install command before importing:
   - pikepdf: `pip install pikepdf`
   - PyPDF2: `pip install PyPDF2`
   - pdftk: system package manager (`apt install pdftk` or `brew install pdftk-java`)
   - Prefer pikepdf for encrypted PDFs, broken PDFs, or PDF/A compliance needs.

2. **Open and verify the source PDF** — Load the PDF and immediately verify it opens:
   ```python
   import pikepdf
   pdf = pikepdf.open('input.pdf')
   print(f"Opened: {len(pdf.pages)} pages")
   ```
   Check for encryption: `if pdf.is_encrypted:` — if encrypted and no password is available, halt and report.

3. **Perform the requested operation**:

   **Merge PDFs**: Open each source file and append pages to a new PDF. Preserve bookmarks from `/Root/Outlines` if present. Write pages in explicit order. Check page sizes for consistency across merged documents.

   **Split by page range**: Extract pages using zero-based indexing. Validate each page number is < `len(pdf.pages)`. Create separate PDFs for each range with descriptive names like `document_pages_1-10.pdf`.

   **Rotate pages**: Use `page.rotate(90|180|270)` on specific pages or all pages. Apply rotation before any other operations to avoid coordinate issues.

   **Add watermark**: Create watermark PDF or use existing. Overlay on each page with `page.merge_page(watermark_page)` (PyPDF2) or pikepdf stamping. Set watermark position (center/top-left) and opacity. Place on top layer if PDF has both text and image layers.

   **Fill form fields**: Get fields with `reader.get_fields()` or iterate `/Annots`. Map data keys to field names exactly. Write values, then optionally flatten: `pdf.save('output.pdf', linearize=True)`. Verify field values before flattening.

   **Edit metadata**: Update `/Title`, `/Author`, `/Subject`, `/Keywords`, `/Creator`, `/CreationDate`, `/ModDate` in the document info dictionary.

   **Redact content**: Remove content from the page stream (pikepdf), not just overlay. For page removal, exclude the page when saving. Verify redacted content cannot be extracted as text.

   **Rearrange pages**: Build new page list in desired order: `new_pdf.pages.extend([pdf.pages[i] for i in new_order])`.

4. **Save output to new file** — Never overwrite the source. Write to explicit new path:
   ```python
   pdf.save('output.pdf')  # pikepdf
   # or
   writer.write('output.pdf')  # PyPDF2
   ```
   Verify output file size > 0 and reasonable compared to input.

5. **Validate the result** — Open output PDF and verify:
   - Correct page count matches expectation
   - Rotation applied (visual check)
   - Watermarks visible and positioned correctly
   - Form fields contain expected values
   - Metadata updated in document properties
   - Redacted content not extractable as text
   - No visual corruption, artifacts, or missing content

# Output contract

1. **Modified PDF file** — Valid PDF that opens without errors in Adobe Reader, Preview, and browser PDF viewers
2. **Operation log** — List of operations performed: pages merged/split/rotated, fields filled, metadata changed
3. **Page count verification** — Expected vs actual page count in the output
4. **File size comparison** — Input and output file sizes to detect bloat or corruption
5. **Validation confirmation** — Statement that the output was opened and visually verified

# Failure handling

- **Encrypted PDF without password**: Report the encryption type (user password vs owner password) and the specific PDF file. Halt and ask user for password before proceeding.

- **Page index out of range**: Report the valid range `0 to {total_pages-1}`, the invalid index requested, and skip that page/operation. Continue with valid pages.

- **Missing dependencies**: Output the exact install command needed (`pip install pikepdf` or `pip install PyPDF2`). Halt with clear dependency error message.

- **Corrupted output (zero bytes or unreadable)**: Retry with alternative library. If PyPDF2 fails, retry with pikepdf. Report the fallback attempt and result.

- **Form field name mismatch**: List all available field names from the PDF. Report which provided data keys have no matching field. Halt for user to reconcile mappings.

- **Library-specific errors**: pikepdf errors often indicate malformed PDF structures. Try PyPDF2 as fallback for recovery operations on damaged PDFs.

# Next steps

- If the task involves extracting text or data from PDFs for analysis, use `pdf-extraction`
- If the task requires creating a new PDF from HTML, Markdown, or data, use `pdf-generation`
- If working with scanned/image-based PDFs that need OCR, use `image-heavy-pdfs` before or after editing
- After redaction operations, consider running `pdf-extraction` to verify sensitive content is not recoverable

# References

- pikepdf documentation — https://pikepdf.readthedocs.io/en/latest/
- PyPDF2 documentation — https://pypdf2.readthedocs.io/en/latest/
- pdftk manual — https://www.pdflabs.com/docs/pdftk-man-page/
- PDF specification (ISO 32000) — https://www.adobe.com/devnet-docs/acroforms/FormsAPIReference.pdf
