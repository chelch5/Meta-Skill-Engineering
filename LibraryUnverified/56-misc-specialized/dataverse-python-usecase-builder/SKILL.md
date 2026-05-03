---
name: dataverse-python-usecase-builder
description: 'Build production-ready Dataverse SDK solutions for complete business use cases. Use when users describe business scenarios requiring end-to-end Dataverse implementations (CRM workflows, document management, data migration, integrations) rather than isolated API operations. Generates architecture recommendations, table designs, and complete Python code with error handling.'
---

# Purpose

Build complete, production-ready solutions for specific PowerPlatform-Dataverse-Client SDK use cases. This skill transforms business requirements into fully-architected implementations including data models, relationship designs, pattern selection, and complete working code.

Unlike isolated API operation skills, this skill generates end-to-end solutions with architecture documentation, implementation guidance, and operational considerations.

# When to use

- User describes a business scenario requiring a complete Dataverse solution (e.g., "build a document management system", "create a customer onboarding workflow")
- User needs architecture recommendations plus working code
- Use case spans multiple tables, relationships, and operations
- Solution requires pattern selection (batch vs. transactional vs. real-time)
- Performance, scalability, or audit requirements are specified
- Code needs to handle production concerns (retries, logging, monitoring)

# When NOT to use

- User asks for a single isolated API operation (use specific Dataverse API skills instead)
- User wants generic SDK documentation or tutorials
- Use case is purely theoretical without specific business requirements
- User already has architecture and only needs bug fixes
- Question is about PowerApps, Power Automate, or non-Python Dataverse access
- Request is for infrastructure setup (authentication, environment provisioning) without business logic

# Procedure

## Step 1: Analyze Requirements
Extract from user input or ask for clarification:
- **Operations needed**: Create, Read, Update, Delete, Bulk, Query (which operations, how complex)
- **Data volume**: Record count, file sizes, throughput requirements
- **Frequency**: One-time migration, batch scheduled job, real-time processing, on-demand
- **Performance**: Response time SLA, records per second, concurrent users
- **Error tolerance**: Can partial failures be accepted? Retry requirements
- **Audit/compliance**: Logging level, history tracking, retention needs
- **Integration points**: External systems, webhook triggers, data sources

Document findings in 2-3 sentences under "Requirements Summary".

## Step 2: Design Data Model
Based on requirements, design:
- **Primary entities**: Table names, logical purposes
- **Columns per entity**: Names, data types, constraints
- **Relationships**: Lookups, 1:N, N:N as needed
- **Customizations**: New tables vs. extending existing (account, contact)

Present as structured text showing table schemas with column types. Include relationship diagrams using text notation.

## Step 3: Select Pattern
Choose ONE pattern based on use case characteristics:

| Pattern | Use When | Key Implementation |
|---------|----------|-------------------|
| **Transactional** | Single-record CRUD, immediate consistency, relationships involved | Per-operation with transaction scope, full error handling |
| **Batch Processing** | Bulk operations, 100+ records, partial failure acceptable | Chunked processing, progress tracking, resume capability |
| **Query & Analytics** | Complex filtering, aggregation, reporting | Optimized OData queries, pagination, selective field retrieval |
| **File Management** | Document storage, large files, audit trails | Chunked upload/download, checksum validation, metadata linking |
| **Scheduled Jobs** | Recurring tasks, synchronization, maintenance | Cron-compatible scheduling, idempotency, failure alerting |
| **Real-time Integration** | Event-driven, low latency, external triggers | Webhook handlers, queue-based processing, status polling |

Document pattern choice with justification (1-2 sentences).

## Step 4: Generate Complete Implementation
Produce production-ready Python code with ALL of the following components:

1. **Setup & Imports**: All required imports, logging configuration, constants
2. **Configuration**: Environment-based config loading with sensible defaults
3. **Service Class**: Singleton pattern for Dataverse client management
4. **Core Operations**: Methods for each required operation (create, read, update, delete, query)
5. **Error Handling**: Try/except blocks with specific exception types, retry logic with exponential backoff
6. **Logging**: Structured logging at INFO/DEBUG/ERROR levels
7. **Type Hints**: Complete type annotations for all functions
8. **Docstrings**: Google-style docstrings explaining parameters, returns, and raises
9. **Usage Example**: Complete if __name__ == "__main__" block showing realistic usage

Code must be syntactically valid Python 3.10+ following PEP 8.

## Step 5: Add Operational Guidance
Provide concrete operational information:

1. **Performance Notes**: Expected throughput (records/second), latency under load, scaling recommendations
2. **Error Recovery**: What failures to expect, how to detect, how to recover
3. **Monitoring Metrics**: What to track (success rate, latency, throughput), how to alert
4. **Testing Strategy**: Unit test patterns for Dataverse operations, mocking approach

## Step 6: Validate Against Requirements
Check implementation against Step 1 requirements:
- [ ] All required operations are implemented
- [ ] Volume/performance requirements are addressed
- [ ] Error handling matches tolerance requirements
- [ ] Audit/logging meets compliance needs
- [ ] Pattern selected is appropriate for frequency

If gaps exist, revise implementation before presenting.

# Output Contract

Every response MUST include:

1. **Architecture Overview** (2-3 sentences): High-level design and pattern rationale
2. **Data Model**: Table definitions with columns, types, and relationships
3. **Implementation Code**: Complete, runnable Python module with ALL components from Step 4
4. **Usage Instructions**: How to run, required environment variables, configuration
5. **Performance Expectations**: Throughput numbers, resource requirements, scaling guidance
6. **Error Handling**: Specific failure modes and recovery procedures
7. **Monitoring Guidance**: Key metrics and observability setup

Code quality requirements:
- Valid Python 3.10+ syntax (no placeholders, no incomplete methods)
- All imports resolvable (PowerPlatform.Dataverse.*, azure.identity)
- Type hints complete (Optional, List, Dict, Any where needed)
- Error handling catches specific exceptions (DataverseError, ValidationError, HttpError)
- Logging statements present at appropriate levels

# Failure Handling

## If requirements are unclear
- Ask specific clarifying questions before proceeding to design
- Do NOT proceed with assumptions about business logic

## If pattern selection is ambiguous
- Document the ambiguity in the Architecture Overview
- Explain why the chosen pattern is the best fit among alternatives
- Note trade-offs explicitly

## If implementation exceeds complexity scope
- Implement core operations fully, document extension points
- Suggest additional skills or services needed for complete solution

## Common errors in generated code
| Error | Detection | Resolution |
|-------|-----------|------------|
| Import failures | Code review | Ensure all packages in imports section |
| Type mismatches | Static analysis | Verify type hints match actual usage |
| Missing error handling | Check try/except coverage | Add specific handlers for DataverseError, HttpError, ValidationError |
| Incomplete methods | Review all method bodies | Fill in pass statements with actual implementation |
| No usage example | Check __main__ block | Add complete working example |

## If validation fails
1. Identify which requirement is not met
2. Revise relevant section (model, pattern, or code)
3. Re-run validation checklist
4. Document any intentional deviations with justification

# Next Steps

After completing this skill:

- If user needs code adapted to a different stack (FastAPI, Django, async patterns) → use **skill-adaptation**
- If solution needs evaluation against baseline → use **skill-evaluation**
- If user wants similar solution for different use case → invoke this skill again with new requirements
- If implementation needs safety review before production → use **skill-safety-review**

# Pattern Reference

## Pattern 1: Transactional (CRUD Operations)
- Single record creation/update
- Immediate consistency required
- Involves relationships/lookups
- Example: Order management, invoice creation

## Pattern 2: Batch Processing
- Bulk create/update/delete
- Performance is priority
- Can handle partial failures
- Example: Data migration, daily sync

## Pattern 3: Query & Analytics
- Complex filtering and aggregation
- Result set pagination
- Performance-optimized queries
- Example: Reporting, dashboards

## Pattern 4: File Management
- Upload/store documents
- Chunked transfers for large files
- Audit trail required
- Example: Contract management, media library

## Pattern 5: Scheduled Jobs
- Recurring operations (daily, weekly, monthly)
- External data synchronization
- Error recovery and resumption
- Example: Nightly syncs, cleanup tasks

## Pattern 6: Real-time Integration
- Event-driven processing
- Low latency requirements
- Status tracking
- Example: Order processing, approval workflows

# Implementation Template

```python
# 1. SETUP & CONFIGURATION
import logging
import os
from enum import IntEnum
from typing import Optional, List, Dict, Any
from datetime import datetime
from pathlib import Path
from PowerPlatform.Dataverse.client import DataverseClient
from PowerPlatform.Dataverse.core.config import DataverseConfig
from PowerPlatform.Dataverse.core.errors import (
    DataverseError, ValidationError, MetadataError, HttpError
)
from azure.identity import ClientSecretCredential

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 2. ENUMS & CONSTANTS
class Status(IntEnum):
    DRAFT = 1
    ACTIVE = 2
    ARCHIVED = 3

# 3. SERVICE CLASS (SINGLETON PATTERN)
class DataverseService:
    """Singleton service for Dataverse operations."""
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self):
        """Initialize Dataverse client with environment credentials."""
        credential = ClientSecretCredential(
            tenant_id=os.getenv("DATAVERSE_TENANT_ID"),
            client_id=os.getenv("DATAVERSE_CLIENT_ID"),
            client_secret=os.getenv("DATAVERSE_CLIENT_SECRET")
        )
        self.client = DataverseClient(
            environment_url=os.getenv("DATAVERSE_URL"),
            credential=credential
        )
        logger.info("DataverseService initialized")

# 4. SPECIFIC OPERATIONS
# Create, Read, Update, Delete, Bulk, Query methods here

# 5. ERROR HANDLING & RECOVERY
# Retry logic, logging, audit trail

# 6. USAGE EXAMPLE
if __name__ == "__main__":
    service = DataverseService()
    # Example operations
```

# Use Case Categories

## Category 1: Customer Relationship Management
- Lead management
- Account hierarchy
- Contact tracking
- Opportunity pipeline
- Activity history

## Category 2: Document Management
- Document storage and retrieval
- Version control
- Access control
- Audit trails
- Compliance tracking

## Category 3: Data Integration
- ETL (Extract, Transform, Load)
- Data synchronization
- External system integration
- Data migration
- Backup/restore

## Category 4: Business Process
- Order management
- Approval workflows
- Project tracking
- Inventory management
- Resource allocation

## Category 5: Reporting & Analytics
- Data aggregation
- Historical analysis
- KPI tracking
- Dashboard data
- Export functionality

## Category 6: Compliance & Audit
- Change tracking
- User activity logging
- Data governance
- Retention policies
- Privacy management

# Quality Checklist

Before presenting solution, verify:
- ✅ Code is syntactically correct Python 3.10+
- ✅ All imports are included and resolvable
- ✅ Error handling is comprehensive (DataverseError, HttpError, ValidationError)
- ✅ Logging statements are present at appropriate levels
- ✅ Performance is optimized for expected volume
- ✅ Code follows PEP 8 style
- ✅ Type hints are complete (Optional, List, Dict, Any)
- ✅ Docstrings explain parameters, returns, and exceptions
- ✅ Usage examples are clear and runnable
- ✅ Architecture decisions are explained with rationale
- ✅ Pattern selection is justified
- ✅ Data model includes column types and relationships
