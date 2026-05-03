---
name: datanalysis-credit-risk
description: Credit risk data cleaning and variable screening for pre-loan modeling. Use when you have raw credit data requiring quality assessment, missing value analysis, or feature selection before building predictive models. Triggers on credit risk data, loan approval datasets, or feature engineering workflows requiring IV/PSI analysis, missing rate filtering, or multi-organization data harmonization.
---

# Purpose

Transform raw credit data into modeling-ready datasets through systematic quality assessment and feature selection. This skill provides an 11-step pipeline that filters abnormal periods, removes high-missing features, screens by Information Value (IV) and Population Stability Index (PSI), applies null importance denoising, and eliminates high-correlation variables. Each step executes independently to preserve original data while producing detailed Excel reports for audit and comparison.

## When to use

- Working with credit loan application data containing applicant features, default labels, organization identifiers, and timestamps
- Need to assess data quality before training binary classification models (approval/default prediction)
- Must filter features by missing rate thresholds, IV thresholds, or PSI stability criteria
- Processing multi-organization datasets where OOS (out-of-sample) organizations need separation
- Generating variable screening reports for regulatory compliance or model documentation
- Performing feature selection with organization-level distribution analysis

## When NOT to use

- Data lacks the required columns (date, binary target, organization identifier, primary key)
- Target variable is not binary (not a 0/1 default/approval flag)
- Dataset has fewer than 1000 rows (insufficient for null importance calculation)
- Need real-time/streaming data processing (this is a batch pipeline)
- Working with non-credit-risk domains (healthcare, marketing, etc.) without domain adaptation
- Only need simple train/test splitting without quality filtering

# Procedure

## Step 1: Configure Data Loading

Identify and configure the required data columns:
- `DATA_PATH`: Path to data file (parquet, csv, xlsx, or pkl format)
- `DATE_COL`: Date column name (e.g., 'apply_date')
- `Y_COL`: Binary target column (0/1, e.g., 'target', 'default_flag')
- `ORG_COL`: Organization identifier column
- `KEY_COLS`: Primary key columns for deduplication
- `OOS_ORGS`: List of out-of-sample organization IDs to exclude from modeling

## Step 2: Execute Data Loading Pipeline

Run the data loading function:
```python
from references.func import get_dataset

data = get_dataset(
    data_pth=DATA_PATH,
    date_colName=DATE_COL,
    y_colName=Y_COL,
    org_colName=ORG_COL,
    data_encode='utf-8',
    key_colNames=KEY_COLS,
    drop_colNames=[],
    miss_vals=[-1, -999, -1111]
)
```

This will:
- Replace missing value indicators (-1, -999, -1111) with NaN
- Remove rows with invalid target values (not 0 or 1)
- Deduplicate using KEY_COLS
- Drop columns with single unique values
- Rename columns to standardized internal names (new_date, new_target, new_org, new_date_ym)

Verify output: `data.shape` should show (N, M) where N > 1000 and M includes the standardized columns.

## Step 3: Generate Organization Statistics

Calculate sample distribution across organizations:
```python
from references.func import org_analysis

org_stat = org_analysis(data, oos_orgs=OOS_ORGS)
```

Produces per-organization statistics: sample counts, bad sample counts, bad rates by month, and flags for OOS vs modeling organizations. Verify that OOS organizations are correctly identified and excluded from modeling data.

## Step 4: Separate OOS Data

Split data into modeling and out-of-sample sets:
```python
oos_data = data[data['new_org'].isin(OOS_ORGS)]
modeling_data = data[~data['new_org'].isin(OOS_ORGS)]
```

Verify both datasets are non-empty. If all organizations are OOS or none are OOS, re-check the OOS_ORGS configuration.

## Step 5: Filter Abnormal Time Periods

Remove months with insufficient samples:
```python
from references.analysis import drop_abnormal_ym

params = {
    'min_ym_bad_sample': 10,  # Minimum bad samples per month
    'min_ym_sample': 500        # Minimum total samples per month
}

filtered_data, abnormal_ym = drop_abnormal_ym(
    modeling_data.copy(),
    min_ym_bad_sample=params['min_ym_bad_sample'],
    min_ym_sample=params['min_ym_sample']
)
```

Review `abnormal_ym` DataFrame to identify removed months and their exclusion reasons. If critical months are dropped, adjust thresholds or investigate data quality issues.

## Step 6: Calculate Missing Rates

Compute overall and organization-level missing rates:
```python
from references.func import missing_check

orgs = modeling_data['new_org'].unique().tolist()
channel = {'整体': orgs}
miss_detail, miss_channel = missing_check(modeling_data, channel=channel)
```

`miss_detail` contains per-feature missing rates per organization plus overall rates. `miss_channel` provides the overall missing rate summary. Review top missing features to understand data collection gaps.

## Step 7: Remove High-Missing Features

Drop features exceeding missing rate threshold:
```python
from references.analysis import drop_highmiss_features

params['missing_ratio'] = 0.6  # 60% threshold

data_miss, dropped_miss = drop_highmiss_features(
    modeling_data.copy(),
    miss_channel,
    threshold=params['missing_ratio']
)
```

Verify in `dropped_miss` that only features with missing_rate > 0.6 were removed. If too many features are dropped, consider raising the threshold or investigating data quality issues upstream.

## Step 8: Screen by Information Value (IV)

Calculate IV for overall and per-organization, then filter low-IV features:
```python
from references.analysis import drop_lowiv_features

params.update({
    'overall_iv_threshold': 0.1,  # Minimum overall IV
    'org_iv_threshold': 0.1,      # Minimum per-organization IV
    'max_org_threshold': 2        # Max organizations with low IV before dropping
})

features = [c for c in modeling_data.columns if c.startswith('i_')]

data_iv, iv_detail, iv_process = drop_lowiv_features(
    modeling_data.copy(),
    features,
    overall_iv_threshold=params['overall_iv_threshold'],
    org_iv_threshold=params['org_iv_threshold'],
    max_org_threshold=params['max_org_threshold'],
    n_jobs=N_JOBS
)
```

Review `iv_detail` for IV distribution across organizations. `iv_process` lists features dropped due to low IV. If high-IV features are being dropped, verify the thresholds align with business requirements (IV < 0.02 is typically weak, IV > 0.3 is strong).

## Step 9: Screen by Population Stability Index (PSI)

Calculate month-by-month PSI per organization and filter unstable features:
```python
from references.analysis import drop_highpsi_features

params.update({
    'psi_threshold': 0.1,        # PSI threshold for instability
    'max_months_ratio': 1/3,     # Max unstable month ratio
    'max_orgs': 6                # Max unstable organizations before dropping
})

data_psi, psi_detail, psi_process = drop_highpsi_features(
    modeling_data.copy(),
    features,
    psi_threshold=params['psi_threshold'],
    max_months_ratio=params['max_months_ratio'],
    max_orgs=params['max_orgs'],
    min_sample_per_month=100,
    n_jobs=N_JOBS
)
```

PSI > 0.1 indicates distribution shift between consecutive months. Features unstable in too many organizations are removed. Review `psi_process` for dropped features and `psi_detail` for per-month PSI values.

## Step 10: Apply Null Importance Denoising

Identify and remove noise features using label permutation:
```python
from references.analysis import drop_highnoise_features

params.update({
    'n_estimators': 100,    # Number of LightGBM trees
    'max_depth': 5,         # Tree depth
    'gain_threshold': 50    # Gain difference threshold for noise detection
})

data_noise, dropped_noise = drop_highnoise_features(
    modeling_data.copy(),
    features,
    n_estimators=params['n_estimators'],
    max_depth=params['max_depth'],
    gain_threshold=params['gain_threshold']
)
```

Features where original LightGBM gain and permuted-label gain differ by less than `gain_threshold` are marked as noise. Preserve `dropped_noise` for the correlation step as it contains original gain values.

## Step 11: Remove High Correlation Features

Eliminate highly correlated features based on original gain ranking:
```python
from references.analysis import drop_highcorr_features

params.update({
    'max_corr': 0.9,      # Correlation threshold
    'top_n_keep': 20      # Preserve top N features by gain
})

# Build gain dict from null importance results
gain_dict = dict(zip(dropped_noise['变量'], dropped_noise['原始gain']))

data_corr, dropped_corr = drop_highcorr_features(
    modeling_data.copy(),
    features,
    threshold=params['max_corr'],
    gain_dict=gain_dict,
    top_n_keep=params['top_n_keep']
)
```

When correlation exceeds 0.9, the feature with lower original gain is dropped (unless in top_n_keep). The top 20 features by gain are preserved regardless of correlation.

## Step 12: Generate Distribution Statistics

Calculate feature distribution statistics for reporting:
```python
from references.analysis import (
    iv_distribution_by_org,
    psi_distribution_by_org,
    value_ratio_distribution_by_org
)

iv_distribution = iv_distribution_by_org(iv_detail, oos_orgs=OOS_ORGS)
psi_distribution = psi_distribution_by_org(psi_detail, oos_orgs=OOS_ORGS)
value_ratio_distribution = value_ratio_distribution_by_org(
    modeling_data,
    features,
    oos_orgs=OOS_ORGS
)
```

These provide feature counts per IV range, PSI range, and value ratio range for each organization.

## Step 13: Export Comprehensive Report

Compile all steps into an Excel report:
```python
from references.analysis import export_cleaning_report

steps = [
    ('机构样本统计', org_stat),
    ('分离OOS数据', oos_info),
    ('Step4-异常月份处理', abnormal_ym),
    ('缺失率明细', miss_detail),
    ('Step5-有值率分布统计', value_ratio_distribution),
    ('Step6-高缺失率处理', dropped_miss),
    ('Step7-IV处理', iv_process),
    ('Step7-IV明细', iv_detail),
    ('Step7-IV分布统计', iv_distribution),
    ('Step8-PSI处理', psi_process),
    ('Step8-PSI明细', psi_detail),
    ('Step8-PSI分布统计', psi_distribution),
    ('Step9-null importance处理', dropped_noise),
    ('Step10-高相关性剔除', dropped_corr)
]

export_cleaning_report(
    REPORT_PATH,
    steps,
    iv_detail=iv_detail,
    iv_process=iv_process,
    psi_detail=psi_detail,
    psi_process=psi_process,
    params=params,
    iv_distribution=iv_distribution,
    psi_distribution=psi_distribution,
    value_ratio_distribution=value_ratio_distribution
)
```

Verify the Excel file contains sheets: Summary, Organization Stats, OOS Separation, Abnormal Months, Missing Rate Details, IV Details/Processing/Distribution, PSI Details/Processing/Distribution, Null Importance Processing, and High Correlation Removal.

# Output Contract

## Primary Outputs

1. **Excel Cleaning Report** (`数据清洗报告.xlsx`) with sheets:
   - **汇总**: Summary of all filtering steps, operation results, and conditions used
   - **机构样本统计**: Per-organization sample counts and bad rates
   - **分离OOS数据**: OOS vs modeling sample counts
   - **Step4-异常月份处理**: Months removed with exclusion reasons
   - **缺失率明细**: Overall and per-organization missing rates per feature
   - **Step5-有值率分布统计**: Feature distribution across value ratio ranges
   - **Step6-高缺失率处理**: Features removed due to high missing rate
   - **Step7-IV明细**: IV values per feature per organization and overall
   - **Step7-IV处理**: Features dropped due to low IV with reasons
   - **Step7-IV分布统计**: Feature counts per IV range
   - **Step8-PSI明细**: PSI values per feature per organization per month
   - **Step8-PSI处理**: Features dropped due to unstable PSI
   - **Step8-PSI分布统计**: Feature counts per PSI range
   - **Step9-null importance处理**: Noise features removed with gain values
   - **Step10-高相关性剔除**: High correlation features removed with correlation values

2. **Filtered DataFrame**: Data after applying selected filters (each step returns modified copy)

3. **Processing DataFrames**: Detailed tables showing exactly which features/periods were removed and why

## Success Indicators

- Report generates without errors and contains all expected sheets
- Summary sheet shows non-zero counts for removed features in relevant steps
- IV and PSI distributions show reasonable feature spread (not all features in single bucket)
- No critical features are unexpectedly dropped (review `iv_process` and `psi_process`)

## Quality Thresholds

| Metric | Acceptable | Warning | Critical |
|--------|-----------|---------|----------|
| Missing Rate | < 30% | 30-60% | > 60% |
| IV (Overall) | > 0.1 | 0.02-0.1 | < 0.02 |
| PSI | < 0.1 | 0.1-0.25 | > 0.25 |
| Correlation | < 0.9 | 0.9-0.95 | > 0.95 |

# Failure Handling

## Data Loading Failures

**Symptom**: `get_dataset` raises exception or returns empty DataFrame
**Causes**: Invalid file path, unsupported format, missing required columns, encoding issues
**Resolution**:
1. Verify DATA_PATH exists and is readable
2. Confirm file is parquet, csv, xlsx, or pkl format
3. Check that DATE_COL, Y_COL, ORG_COL exist in the data
4. Verify target column contains only 0 and 1 values

## IV Calculation Failures

**Symptom**: `drop_lowiv_features` returns empty iv_detail or all IV values are NaN
**Causes**: All features constant or perfectly correlated with target, insufficient samples
**Resolution**:
1. Check that features have variation (not all same value)
2. Verify target has both 0 and 1 values in the dataset
3. Reduce `n_jobs` if memory issues occur
4. Check for features with extreme imbalance (99%+ same value)

## PSI Calculation Failures

**Symptom**: `drop_highpsi_features` returns empty psi_detail
**Causes**: Less than 2 months of data, insufficient samples per month, all values NaN
**Resolution**:
1. Verify data spans multiple months in `new_date_ym`
2. Ensure each month has at least `min_sample_per_month` rows
3. Check for date formatting issues in original data
4. Verify features have non-NaN values in multiple months

## Null Importance Failures

**Symptom**: `drop_highnoise_features` skips processing or returns empty results
**Causes**: Dataset < 1000 rows, feature matrix empty, all features constant
**Resolution**:
1. Verify dataset has > 1000 rows after filtering
2. Check that features list is not empty
3. Verify features contain non-NaN values
4. Reduce `n_estimators` or `max_depth` if memory constrained

## Memory/Performance Issues

**Symptom**: Steps hang or consume excessive memory
**Causes**: Large dataset (millions of rows), too many features, excessive n_jobs
**Resolution**:
1. Reduce `n_jobs` to 2-4 instead of CPU_COUNT - 1
2. Process data in chunks for initial filtering steps
3. Limit features to those starting with known prefix (e.g., 'i_')
4. Increase available system memory or use cloud instance

## Report Generation Failures

**Symptom**: `export_cleaning_report` raises exception
**Causes**: Permission denied on output path, invalid DataFrame contents, missing openpyxl
**Resolution**:
1. Verify OUTPUT_DIR exists and is writable
2. Check all DataFrames in steps list are valid (not None, correct columns)
3. Ensure openpyxl is installed: `pip install openpyxl`
4. Use absolute path for REPORT_PATH

# Next Steps

- **Model Training**: After cleaning, use the filtered features to train logistic regression, LightGBM, or XGBoost models for credit risk prediction
- **Model Validation**: Use the OOS data separated in Step 4 for out-of-time validation
- **Feature Engineering**: Create derived features from the cleaned dataset, then re-run IV/PSI screening
- **Monitoring**: Use the PSI calculation from Step 9 as the foundation for production model monitoring (detect feature drift)
- **Documentation**: The generated Excel report serves as model development documentation for regulatory review
- **Alternative Pipelines**: If IV/PSI screening is too aggressive, adjust thresholds and re-run; if null importance is unstable, increase `n_estimators` or skip the step

# References

## Core Functions

| Function | Module | Purpose |
|----------|--------|---------|
| `get_dataset()` | references.func | Load, deduplicate, and format raw data |
| `org_analysis()` | references.func | Organization-level sample statistics |
| `missing_check()` | references.func | Calculate missing rates |
| `drop_abnormal_ym()` | references.analysis | Filter low-sample months |
| `drop_highmiss_features()` | references.analysis | Remove high-missing features |
| `drop_lowiv_features()` | references.analysis | Screen by Information Value |
| `drop_highpsi_features()` | references.analysis | Screen by Population Stability Index |
| `drop_highnoise_features()` | references.analysis | Null importance denoising |
| `drop_highcorr_features()` | references.analysis | Remove correlated features |
| `export_cleaning_report()` | references.analysis | Generate Excel documentation |

## Key Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `min_ym_bad_sample` | 10 | Minimum bad samples per month |
| `min_ym_sample` | 500 | Minimum total samples per month |
| `missing_ratio` | 0.6 | Maximum acceptable missing rate |
| `overall_iv_threshold` | 0.1 | Minimum overall IV for feature retention |
| `org_iv_threshold` | 0.1 | Minimum per-organization IV |
| `max_org_threshold` | 2 | Max organizations with low IV |
| `psi_threshold` | 0.1 | PSI threshold for instability |
| `max_months_ratio` | 1/3 | Max ratio of unstable months |
| `max_orgs` | 6 | Max unstable organizations before dropping |
| `max_corr` | 0.9 | Maximum correlation between features |
| `top_n_keep` | 20 | Top features preserved by gain ranking |

## Dependencies

- pandas >= 1.3.0
- numpy >= 1.20.0
- toad >= 0.1.0 (for IV calculation)
- lightgbm >= 3.3.0 (for null importance)
- openpyxl >= 3.0.0 (for Excel reports)
- joblib >= 1.0.0 (for parallel processing)
- scikit-learn >= 1.0.0 (for train/test split)

## Example Execution

See `scripts/example.py` for a complete working example with interactive parameter input and full pipeline execution.
