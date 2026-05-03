# Expected Outcomes

A good PDF Editor run should:

- Trigger only when the task involves modifying an existing PDF (merge, split, rotate, watermark, fill forms, edit metadata, redact)
- Install the correct PDF library dependency before attempting operations
- Never overwrite the source PDF file — always write to a new output path
- Verify PDF opens successfully and check for encryption before modification
- Validate that page indices are within range before extraction or rotation
- Use pikepdf for encrypted or malformed PDFs, PyPDF2 for simple operations
- Produce a modified PDF that opens without errors in standard viewers
- Confirm output page count matches expectation after merge/split/rearrange operations
- Verify watermarks are visible and correctly positioned
- Confirm form fields contain the provided values
- Ensure redacted content is removed from the content stream, not just visually obscured
- Report the operations performed and any fields/pages that could not be processed
- Output file size should be reasonable relative to input (flag significant bloat as potential corruption)
