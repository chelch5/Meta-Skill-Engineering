---
name: image-editor
description: Resize, crop, rotate, convert, watermark, and optimize images using Pillow (Python), Sharp (Node.js), or ImageMagick. Triggers on requests like "resize these images to 800px wide", "convert PNG to JPEG", "add watermark", "strip EXIF data", or "create thumbnails".
license: Apache-2.0
compatibility:
  clients: [openai-codex, gemini-cli, opencode]
metadata:
  owner: codex
  domain: image-editor
  maturity: draft
  risk: low
  tags: [image, pillow, sharp, imagemagick, resize, format-conversion]
---

# Purpose

Manipulate images programmatically using Pillow (Python), Sharp (Node.js), or ImageMagick (CLI) — resize, crop, rotate, convert between formats, add watermarks, manage EXIF metadata, optimize file size, and batch-process image collections. This skill covers the full lifecycle of image transformation in automated pipelines.

# When to use

- Resize, crop, or rotate images for web display, thumbnails, or print
- Convert between image formats (PNG→JPEG, WEBP→PNG, SVG rasterization, HEIC→JPEG)
- Add watermarks, overlays, or text annotations to images
- Strip EXIF data for privacy, preserve it for archival, or extract metadata
- Optimize image file size for web delivery or storage constraints
- Batch process multiple images with consistent transformations
- Generate thumbnails for galleries, catalogs, or document previews

# When NOT to use

- AI-powered image generation or editing (Stable Diffusion, DALL-E, Midjourney) — use creative generation skills instead
- Design mockup creation (Figma, Sketch, UI/UX design tools) — this skill manipulates pixels, not creates designs
- Image classification, object detection, or computer vision analysis — use ML/AI vision skills
- OCR on images embedded in PDFs — use `image-heavy-pdfs` instead
- Creating PDF documents containing images — use `pdf-generation` instead
- Video processing or frame extraction — use video-specific tools
- 3D image manipulation or depth map generation — use specialized 3D tools

# Procedure

1. **Identify the input images**
   - Determine source: file path(s), URL(s), or byte stream(s)
   - Check format: JPEG, PNG, GIF, WEBP, TIFF, BMP, SVG, HEIC, AVIF
   - Record original dimensions, color space, and file size
   - For URLs: download to temporary location first

2. **Select the processing library based on runtime**
   - **Python**: Use Pillow (`pip install Pillow`). Best for most operations.
   - **Node.js**: Use Sharp (`npm install sharp`). Fastest for web-optimized outputs.
   - **CLI/shell**: Use ImageMagick (`convert`, `mogrify`). Best for batch scripts.

3. **Load the image with validation**
   - Pillow: `from PIL import Image; img = Image.open(path); img.verify()` then reload
   - Sharp: `const img = sharp(path); const metadata = await img.metadata();`
   - ImageMagick: `identify -verbose input.jpg` to validate before processing
   - Check: dimensions must be > 0, no truncated files, supported codec

4. **Apply resize operations**
   - Calculate target dimensions maintaining aspect ratio: `new_height = int(target_width * original_height / original_width)`
   - Pillow: `img.resize((width, height), Image.LANCZOS)`
   - Sharp: `img.resize(width, height, { fit: 'inside', withoutEnlargement: true })`
   - If target > original: warn about upscaling quality loss, prefer original
   - Never distort aspect ratio unless explicitly requested

5. **Apply crop operations**
   - Define crop box as `(left, top, right, bottom)` in pixels
   - Validate: `right <= img.width` and `bottom <= img.height`
   - Center crop formula: `left = (width - crop_width) // 2`, `top = (height - crop_height) // 2`
   - Pillow: `img.crop((left, top, right, bottom))`
   - Sharp: `img.extract({ left, top, width: right-left, height: bottom-top })`

6. **Apply rotation**
   - Standard rotation: Pillow `img.rotate(degrees, expand=True, resample=Image.BICUBIC)`
   - Lossless JPEG rotation (90° multiples): use `img.transpose(Image.ROTATE_90)` etc.
   - Sharp: `img.rotate(degrees)`
   - Always use `expand=True` or equivalent to prevent clipping

7. **Convert between formats**
   - PNG→JPEG: composite onto white first: `img.convert('RGB').save(output, 'JPEG', quality=85)`
   - Preserve alpha for PNG→PNG, WEBP→WEBP with transparency
   - Format quality defaults:
     - JPEG: quality 85, progressive=True, optimize=True
     - PNG: compression level 6, optimize=True
     - WEBP: quality 80, method 6
     - GIF: preserve palette, use `optimize=True`

8. **Add watermarks**
   - Load watermark image, scale to 10-20% of target image size
   - Position: bottom-right (default), or user-specified
   - Apply transparency: Pillow `watermark.putalpha(int(255 * 0.4))` for 40% opacity
   - Composite: `img.paste(watermark, position, watermark)`
   - For text watermarks: render text to temporary image then composite

9. **Handle EXIF metadata**
   - Strip (privacy): Pillow `img.save(output, exif=None)` or `img.info.pop('exif', None)` before save
   - Preserve: extract before processing `exif = img.info.get('exif')`, then `img.save(output, exif=exif)`
   - Read: Pillow `img._getexif()` or use `exifread` library
   - Sharp: `img.withMetadata()` to preserve, `img.withMetadata({})` to strip

10. **Optimize file size**
    - JPEG: reduce quality in 5-point decrements (85→80→75) until size acceptable
    - PNG: try `optimize=True`, then `img.quantize(colors=256)` for simple graphics
    - WEBP: use lossy at quality 75-85 for photos
    - Compare before/after: log percentage reduction

11. **Process batches efficiently**
    - For ≤100 images: sequential processing with progress logging
    - For >100 images: use `multiprocessing.Pool` (Python) or worker threads (Node.js)
    - Process one image at a time, do not load entire batch into memory
    - Log every 10th image or every 10%: `print(f"[{i}/{total}] Processed: {filename}")`

12. **Save outputs and verify**
    - Save with explicit format: `img.save(output_path, format='PNG')`
    - Verify output exists: `os.path.exists(output_path)` and size > 0
    - Re-open output and check dimensions match target
    - Log: input dimensions → output dimensions, input size → output size

13. **Validate results**
    - Re-open saved image: `Image.open(output_path)`
    - Confirm dimensions match expectations
    - For format conversions: check file header bytes match target format
    - Spot-check visual quality on ≥1 sample before declaring batch complete

# Output contract

The following outputs must be produced:

1. **Processed image file(s)**
   - Correct format as specified (JPEG, PNG, WEBP, etc.)
   - Exact target dimensions (within 1 pixel tolerance)
   - Quality level as specified or using defaults from procedure

2. **Processing log** (text or JSON)
   - For each image: input path, output path
   - Input dimensions (width × height) and output dimensions
   - Input file size and output file size (bytes)
   - Operations applied (resize, crop, rotate, format conversion, watermark, EXIF strip)

3. **Error report**
   - List of failed images with specific error reason:
     - "Corrupt/truncated file"
     - "Unsupported format: {format}"
     - "Missing input file: {path}"
     - "Permission denied: {path}"
     - "Out of memory: image too large ({dimensions})"
   - Suggested recovery action for each error type

4. **Metadata summary**
   - EXIF status for each output: `stripped`, `preserved`, or `modified`
   - If preserved: note which fields were retained (dimensions, timestamp, camera)
    - GPS data status: explicitly note if removed for privacy

# References

- Pillow (PIL Fork) documentation: https://pillow.readthedocs.io/en/stable/
- Sharp documentation: https://sharp.pixelplumbing.com/
- ImageMagick command-line usage: https://imagemagick.org/script/command-line-processing.php
- EXIF specification: https://www.exif.org/Exif2-2.PDF
- Quality checklist: `references/quality-checklist.md`
- Audience adjustments: `references/audience-adjustments.md`
- Artifact structure: `references/artifact-structure.md`

# Next steps

- For OCR on images in PDFs: use `image-heavy-pdfs`
- To assemble images into a PDF document: use `pdf-generation`
- To capture screenshots for later processing: use `screenshot`
- For AI-powered image generation: use appropriate creative generation skills
- For image analysis and computer vision: use ML/AI vision skills

# Failure handling

**Corrupt or unreadable input**
- Detection: `Image.open(path)` raises `OSError`, `SyntaxError`, or `UnidentifiedImageError`
- Action: Log error with specific type ("truncated file at byte {offset}", "unsupported codec: {codec}")
- Recovery: Skip to next image in batch; for single image, request alternative source file
- Prevention: Use `img.verify()` before processing

**Processing library not installed**
- Detection: `ModuleNotFoundError` for Pillow, command not found for ImageMagick
- Action: Output exact install command and halt immediately:
  - Pillow: `pip install Pillow`
  - Sharp: `npm install sharp`
  - ImageMagick: `sudo apt-get install imagemagick` (Ubuntu) or `brew install imagemagick` (macOS)
- Recovery: Install dependency and retry

**Output path not writable**
- Detection: `PermissionError` or `OSError: [Errno 13]` on save
- Action:
  1. Attempt writing to system temp directory: `/tmp/{filename}` (Unix) or `%TEMP%\{filename}` (Windows)
  2. Report the original path and permission issue to user
  3. Do not proceed with batch until permission issue resolved or alternative path provided

**Insufficient memory for large images**
- Detection: `MemoryError` or system swap exhaustion; images > 100 megapixels (e.g., 10000 × 10000)
- Action:
  1. For Pillow: use `ImageFile.LOAD_TRUNCATED_IMAGES = True` and process in tiles
  2. Reduce in stages: resize to 50% first, then to target
  3. Use Sharp's streaming mode which processes in chunks
  4. For ImageMagick: use `-limit memory 256MiB` to constrain memory
- Recovery: Log intermediate stage files, clean up on completion

**Unexpectedly large output file**
- Detection: Output size > 2× input size for same format, or > 500KB for thumbnail
- Action:
  1. Retry with lower quality settings (JPEG: 85→75→65)
  2. For PNG: quantize to 256 colors `img.quantize(colors=256)`
  3. Enable additional compression flags
  4. Log size comparison: "Retry reduced size from {size1} to {size2} bytes"

**Aspect ratio distortion**
- Detection: Output dimensions don't match calculated proportional values
- Action:
  1. Reject the operation before save
  2. Log: "Aspect ratio mismatch: calculated {calc_width}×{calc_height}, got {actual_width}×{actual_height}"
  3. Recompute with correct ratio: `target_height = int(target_width * orig_height / orig_width)`

**Alpha channel lost in PNG→JPEG conversion**
- Detection: Output has black areas where transparency existed
- Action:
  1. Before conversion, composite onto white (or user-specified background):
     ```python
     background = Image.new('RGB', img.size, (255, 255, 255))
     background.paste(img, mask=img.split()[3])  # Use alpha channel as mask
     ```
  2. Save the composited RGB image

**EXIF data preservation failure**
- Detection: Output EXIF differs from input despite preservation request
- Action:
  1. Extract EXIF before any transforms: `exif = img.info.get('exif')`
  2. Re-apply to final image before save: `img.save(output, exif=exif)`
  3. Verify with: `Image.open(output)._getexif()`

**Batch processing partial failure**
- Detection: Some images in batch fail while others succeed
- Action:
  1. Continue processing remaining images (do not halt entire batch)
  2. Maintain list of failed files with error reasons
  3. At completion: report success count, failure count, and specific errors
  4. Allow user to retry only failed files
