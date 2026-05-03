# Quality Checklist for image-editor

Verify these items before declaring image processing work complete.

## Input validation
- [ ] All input images exist and are readable
- [ ] Image formats are supported (JPEG, PNG, GIF, WEBP, TIFF, BMP, SVG, HEIC, AVIF)
- [ ] No truncated or corrupt files in batch
- [ ] Original dimensions and file sizes recorded

## Processing accuracy
- [ ] Aspect ratio maintained in all resize operations (unless distortion explicitly requested)
- [ ] Target dimensions match output exactly (within 1 pixel)
- [ ] Crop coordinates within image bounds
- [ ] Rotation degrees applied correctly with expand=True
- [ ] Format conversion produces valid output format
- [ ] PNG→JPEG conversion composites transparency onto background

## Quality settings
- [ ] JPEG quality between 60-85 (not 100)
- [ ] PNG uses optimize=True, compression level 6
- [ ] WEBP quality 75-85 for photos
- [ ] No unnecessary upscaling (warned if source smaller than target)

## Watermarks and metadata
- [ ] Watermark opacity 30-50% (visible but not obstructive)
- [ ] Watermark positioned correctly (bottom-right unless specified)
- [ ] EXIF status correct: stripped/preserved as requested
- [ ] GPS data explicitly removed when stripping for privacy

## Output verification
- [ ] All output files exist and have non-zero size
- [ ] Output dimensions match expectations
- [ ] Output file sizes recorded and compared to input
- [ ] Format headers correct for converted files
- [ ] Spot-check visual quality on at least one sample

## Batch processing
- [ ] Progress logged every 10% or every 10th image
- [ ] Failed files tracked with specific error reasons
- [ ] Success/failure counts reported at completion
- [ ] Memory usage bounded (not loading entire batch)

## Error handling
- [ ] Corrupt files skipped with logged errors
- [ ] Missing dependencies reported with install commands
- [ ] Permission issues handled (temp directory fallback)
- [ ] Large images (>100MP) processed in tiles or stages
