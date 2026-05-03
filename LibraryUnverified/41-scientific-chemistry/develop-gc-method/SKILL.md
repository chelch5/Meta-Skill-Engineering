---
name: develop-gc-method
description: |
  Create or refine a gas chromatography analytical method. Use when the user asks
  to "develop a GC method", "optimize GC separation", "set up GC analysis for
  [compounds]", or when they have target analytes and need column selection,
  temperature programming, carrier gas choice, detector configuration, or method
  validation for volatile/semi-volatile compounds.
license: MIT
allowed-tools: Read, Grep, Glob, WebFetch, WebSearch
metadata:
  author: Philipp Thoss
  version: "1.1"
  domain: chromatography
  complexity: advanced
  language: natural
  tags: chromatography, gc, gas-chromatography, method-development, separation
---

# Develop a GC Method

Systematic development of a gas chromatography method covering column selection, temperature program optimization, carrier gas and detector choice, and initial performance verification for volatile and semi-volatile analytes.

## When to use

Use this skill when:
- User asks to develop, create, or optimize a GC method
- User has target analytes (volatile or semi-volatile compounds) and needs separation conditions
- User needs to select column chemistry, temperature program, carrier gas, or detector for GC
- User is adapting a published GC method to a different instrument or matrix
- User needs to replace an existing GC method that no longer meets performance requirements
- User is transitioning from packed-column to capillary GC

## When NOT to use

Do not use this skill when:
- User needs HPLC or LC-MS method development (use develop-hplc-method instead)
- User is troubleshooting an existing method (use troubleshoot-separation instead)
- User needs formal ICH Q2 validation documentation (use validate-analytical-method instead)
- User is analyzing non-volatile, thermally labile, or high molecular weight compounds (>1000 Da)
- User only needs to run samples using an existing validated method (no development needed)
- User needs preparative-scale separation or purification (this is analytical method development)

## Procedure

### Step 1: Define Analytical Objectives

1. List all target analytes with their physical properties (boiling point, polarity, molecular weight).
2. Identify the sample matrix and any expected interferents or co-extractives.
3. Specify required detection limits, quantitation range, and acceptable resolution between critical pairs.
4. Determine whether the method must meet a regulatory standard (EPA 8260, USP, etc.).
5. Document throughput needs: maximum run time, injection volume, sample preparation constraints.

**Expected:** A written specification listing analytes, matrix, detection limits, resolution requirements, and any regulatory or throughput constraints.

**On failure:** If analyte volatility data is unavailable, estimate boiling points from structural analogs or use a scouting run on a mid-polarity column to establish elution order.

### Step 2: Select the Column

Choose column dimensions and stationary phase based on analyte polarity and separation difficulty.

| Column Type | Stationary Phase | Polarity | Typical Use Cases |
|---|---|---|---|
| DB-1 / HP-1 | 100% dimethylpolysiloxane | Non-polar | Hydrocarbons, solvents, general screening |
| DB-5 / HP-5 | 5% phenyl-methylpolysiloxane | Low polarity | Semi-volatiles, EPA 8270, drugs of abuse |
| DB-1701 | 14% cyanopropylphenyl | Mid polarity | Pesticides, herbicides |
| DB-WAX / HP-INNOWax | Polyethylene glycol | Polar | Alcohols, fatty acids, flavors, essential oils |
| DB-624 | 6% cyanopropylphenyl | Mid polarity | Volatile organics, EPA 624/8260 |
| DB-FFAP | Modified PEG (nitroterephthalic acid) | Highly polar | Organic acids, free fatty acids |
| DB-35 | 35% phenyl-methylpolysiloxane | Mid-low polarity | Polychlorinated biphenyls, confirmatory column |

1. Match analyte polarity to stationary phase: like dissolves like.
2. Select column length (15-60 m): longer columns give more plates but longer run times.
3. Select inner diameter (0.25-0.53 mm): narrower gives better efficiency, wider gives more capacity.
4. Select film thickness (0.25-5.0 um): thicker films retain volatile analytes longer.
5. For complex matrices, consider a guard column or retention gap.

**Expected:** A column specification (phase, length, ID, film thickness) justified by analyte properties and separation requirements.

**On failure:** If no single column resolves all critical pairs, plan a confirmation column with orthogonal selectivity (e.g., DB-1 primary, DB-WAX confirmatory).

### Step 3: Optimize the Temperature Program

1. Set the initial oven temperature at or below the boiling point of the most volatile analyte (hold 1-2 min for solvent focusing).
2. Apply a linear ramp. General starting points:
   - Simple mixtures: 10-20 C/min
   - Complex mixtures: 3-8 C/min for better resolution
   - Ultra-fast screening: 25-40 C/min on short thin-film columns
3. Set the final temperature 10-20 C above the boiling point of the least volatile analyte.
4. Add a final hold (2-5 min) to ensure complete elution and column bake-out.
5. For critical pairs that co-elute, insert an isothermal hold at the temperature just before their elution, or reduce the ramp rate in that region.
6. Verify that the total run time meets throughput requirements.

**Expected:** A temperature program (initial temp, hold, ramp rate(s), final temp, final hold) that separates all target analytes within the acceptable run time.

**On failure:** If critical pairs remain unresolved after ramp optimization, revisit column selection (Step 2) or consider a multi-ramp program with slower rates in the problem region.

### Step 4: Select the Carrier Gas

| Property | Helium (He) | Hydrogen (H2) | Nitrogen (N2) |
|---|---|---|---|
| Optimal linear velocity | 20-40 cm/s | 30-60 cm/s | 10-20 cm/s |
| Efficiency at high flow | Good | Best (flat van Deemter) | Poor |
| Speed advantage | Baseline | 1.5-2x faster than He | Slowest |
| Safety | Inert | Flammable (needs leak detection) | Inert |
| Cost / availability | Expensive, supply concerns | Low cost, generator option | Very low cost |
| Detector compatibility | All detectors | Not with ECD; caution with some MS | All detectors |

1. Default to helium for general-purpose work and regulatory methods specifying He.
2. Consider hydrogen for faster analysis or when helium supply is constrained; install hydrogen-specific leak detection and safety interlocks.
3. Use nitrogen only for simple separations or when cost is the primary driver.
4. Set the carrier gas flow to the optimal linear velocity for the chosen gas and column ID.
5. Measure actual linear velocity using an unretained compound (e.g., methane on FID).

**Expected:** Carrier gas selected with flow rate set to optimal linear velocity, verified by unretained peak measurement.

**On failure:** If efficiency is lower than expected at the set flow, generate a van Deemter curve (plate height vs. linear velocity) using 5-7 flow rates to find the true optimum.

### Step 5: Choose the Detector

| Detector | Selectivity | Sensitivity (approx.) | Linear Range | Best For |
|---|---|---|---|---|
| FID | C-H bonds (universal organic) | Low pg C/s | 10^7 | Hydrocarbons, general organics, quantitation |
| TCD | Universal (all compounds) | Low ng | 10^5 | Permanent gases, bulk analysis |
| ECD | Electronegative groups (halogens, nitro) | Low fg (Cl compounds) | 10^4 | Pesticides, PCBs, halogenated solvents |
| NPD/FPD | N, P (NPD); S, P (FPD) | Low pg | 10^4-10^5 | Organophosphorus pesticides, sulfur compounds |
| MS (EI) | Structural identification | Low pg (scan), fg (SIM) | 10^5-10^6 | Unknowns, confirmation, trace analysis |
| MS/MS | Highest selectivity | fg range | 10^5 | Complex matrices, ultra-trace, forensic |

1. Match detector to analyte chemistry and required sensitivity.
2. For quantitative work with simple matrices, FID is the default (robust, linear, low maintenance).
3. For trace analysis in complex matrices, prefer MS in SIM mode or MS/MS in MRM mode.
4. For halogenated compounds at trace levels, ECD provides the best sensitivity.
5. Set detector temperature 20-50 C above the maximum oven temperature to prevent condensation.
6. Optimize detector gas flows per manufacturer recommendations.

**Expected:** Detector selected and configured with appropriate temperatures and gas flows for the target analytes.

**On failure:** If detector sensitivity is insufficient at the required detection limits, consider concentrating the sample (larger injection volume, solvent evaporation) or switching to a more sensitive/selective detector.

### Step 6: Validate Initial Performance

1. Prepare a system suitability standard containing all target analytes at mid-range concentration.
2. Inject the standard 6 times consecutively.
3. Evaluate:
   - Retention time RSD: must be < 1.0%
   - Peak area RSD: must be < 2.0% (< 5.0% for trace-level)
   - Resolution between critical pairs: Rs >= 1.5 (baseline) or >= 2.0 for regulated methods
   - Peak tailing factor: 0.8-1.5 (USP criteria T <= 2.0)
   - Theoretical plates (N): verify against column manufacturer specification
4. Inject a blank to confirm absence of carryover or ghost peaks.
5. Inject a matrix blank to identify potential interferents at target retention times.
6. Document all parameters in a method summary sheet.

**Expected:** System suitability criteria met for all analytes across replicate injections, with no carryover or matrix interferences at target retention windows.

**On failure:** If tailing is observed, check for active sites (re-condition column, trim 0.5 m from inlet end, replace liner). If RSD exceeds limits, investigate autosampler precision and injection technique. If resolution is insufficient, return to Step 3 to refine the temperature program.

## Output contract

After completing this skill, deliver:

1. **Method specification document** containing:
   - List of all target analytes with CAS numbers, molecular weights, and boiling points
   - Sample matrix description and expected interferents
   - Required detection limits and quantitation ranges
   - Resolution requirements for critical pairs
   - Regulatory and throughput constraints

2. **Column configuration** with justification:
   - Stationary phase (e.g., DB-5, DB-WAX)
   - Column dimensions (length, ID, film thickness)
   - Guard column or retention gap if used

3. **Temperature program** specifying:
   - Initial temperature and hold time
   - Ramp rate(s) and any isothermal holds
   - Final temperature and hold time
   - Total run time

4. **Carrier gas configuration**:
   - Gas type (He, H2, or N2) with justification
   - Flow rate and calculated/measured linear velocity

5. **Detector configuration**:
   - Detector type (FID, TCD, ECD, NPD, MS, etc.)
   - Temperature and gas flow settings
   - Sensitivity/selectivity rationale

6. **System suitability validation results**:
   - Retention time RSD < 1.0% (6 replicates)
   - Peak area RSD < 2.0% (< 5.0% for trace-level)
   - Resolution Rs >= 1.5 for all critical pairs
   - Peak tailing factor 0.8-1.5 for all analytes
   - Blank and matrix blank results

## Failure handling

If the method development fails at any stage:

1. **Missing analyte data**: If boiling points or physical properties are unavailable, use WebFetch or WebSearch to retrieve chemical data from PubChem, ChemSpider, or manufacturer SDS documents. If online sources fail, estimate from structural analogs or run a scouting analysis on a mid-polarity column.

2. **Co-elution/critical pairs unresolved**:
   - Revisit column selection and choose a more selective stationary phase
   - Implement a multi-ramp temperature program with slower ramp rates in problem regions
   - Plan a confirmation column with orthogonal selectivity (e.g., non-polar primary, polar confirmatory)

3. **Poor peak shape (tailing)**:
   - Check for active sites: re-condition column, trim 0.5 m from inlet end, replace liner
   - Verify liner type matches injection mode (split vs. splitless)
   - Replace contaminated septum (every 50-100 injections)

4. **Poor precision (high RSD)**:
   - Investigate autosampler precision and injection technique
   - Check for sample degradation or evaporation during analysis
   - Verify consistent injection volumes

5. **Insufficient detector sensitivity**:
   - Consider sample concentration (larger injection volume, solvent evaporation)
   - Switch to more sensitive/selective detector (MS-SIM, ECD for halogenated compounds)
   - Optimize detector gas flows per manufacturer specifications

6. **Efficiency below expectations**:
   - Generate van Deemter curve (plate height vs. linear velocity) using 5-7 flow rates
   - Measure actual linear velocity with unretained compound (e.g., methane on FID)
   - Verify column is conditioned and not degraded

7. **Column bleed or ghost peaks**:
   - Check operating temperature against column maximum isothermal limit
   - Condition new columns before analytical use (ramp to max temp under carrier flow)
   - Replace worn septum and contaminated liners

## Next steps

After completing GC method development:

- `validate-analytical-method` -- Perform formal ICH Q2 validation (linearity, accuracy, precision, LOD/LOQ, robustness)
- `troubleshoot-separation` -- Diagnose and fix issues if method performance degrades or unexpected peaks appear
- `interpret-chromatogram` -- Analyze chromatograms and identify unknown peaks
- `develop-hplc-method` -- Switch to liquid chromatography if analytes are non-volatile or thermally labile

## References

- Grob, R.L. and Barry, E.F. (eds.) *Modern Practice of Gas Chromatography*, 4th ed., Wiley (2004)
- Jennings, W. and Mittlefehldt, E. *Analytical Gas Chromatography*, 2nd ed., Academic Press (1997)
- US EPA Method 8260: Volatile Organic Compounds by Gas Chromatography/Mass Spectrometry
- US EPA Method 8270: Semivolatile Organic Compounds by Gas Chromatography/Mass Spectrometry
- ICH Q2(R1): Validation of Analytical Procedures
