---
name: write-incident-runbook
description: >
  Write a structured incident response runbook with diagnostic procedures, resolution steps,
  escalation paths, and communication templates. Triggers on: "create runbook",
  "document incident response", "write incident procedure", "on-call playbook",
  "escalation documentation", "incident response guide". Use when the user needs to
  document how to respond to a specific type of incident or alert, NOT when configuring
  monitoring systems or building dashboards.
license: MIT
allowed-tools: Read Write Edit Bash Grep Glob
metadata:
  author: Philipp Thoss
  version: "1.0"
  domain: observability
  complexity: basic
  language: multi
  tags: runbook, incident-response, diagnostics, escalation, documentation
---

# Write Incident Runbook

Create actionable runbooks that guide responders through incident diagnosis and resolution.

## Purpose

Transform tribal knowledge about incident response into structured, testable documentation
that reduces mean time to resolution (MTTR) and standardizes response procedures across
on-call rotations.

## When to Use

- Documenting response procedures for recurring alerts or known incident types
- Standardizing incident response across on-call rotation members
- Reducing MTTR with clear diagnostic steps and verification criteria
- Creating training materials for new team members on incident handling
- Establishing escalation paths and communication protocols
- Migrating ad-hoc response knowledge to written documentation
- Linking alerts to resolution procedures (alert annotations)

## When NOT to Use

- Do NOT use when configuring alert rules in Prometheus/PagerDuty (use `configure-alerting-rules` instead)
- Do NOT use when building Grafana dashboards (use `build-grafana-dashboards` instead)
- Do NOT use when defining SLOs/SLIs (use `define-slo-sli-sla` instead)
- Do NOT use for real-time incident response (this skill creates documentation, not fixes live incidents)
- Do NOT use for post-mortem analysis (create the runbook before incidents happen)

## Procedure

### Step 1: Choose Runbook Template Structure

Select an appropriate template based on incident type and complexity.

**Basic runbook template** (for simple, well-understood incidents):
```markdown
# [Alert/Incident Name] Runbook

## Overview
- **Incident Type**: [Brief description]
- **Severity**: [Critical/High/Medium/Low]
- **Symptoms**: [Observable signs]

## Diagnostic Steps
1. [Step with specific query/command]
2. [Step with expected vs actual values]

## Resolution Steps
1. [Action with verification check]
2. [Rollback option for each action]

## Escalation
- **When**: [Specific criteria]
- **Who**: [Contact information]

## Communication
- **Internal**: [Slack channel/template]
- **External**: [Status page template]

## Prevention
- [Short-term action]
- [Long-term action]

## Related
- [Dashboard links]
- [Previous incidents]
```

**Advanced SRE runbook template** (for complex, multi-phase incidents):
```markdown
# [Service Name] - [Incident Type] Runbook

## Metadata
- **Service**: [service-name]
- **Owned By**: [team-name]
- **Severity**: [Critical/High/Medium/Low]
- **On-Call**: [PagerDuty/Opsgenie rotation link]
- **Last Updated**: [YYYY-MM-DD]

## Diagnostic Phase
### Quick Health Check (< 5 min)
- Dashboard: [link]
- Error rate: [Prometheus query with expected value]
- Recent deployments: [CI/CD link]

### Detailed Investigation (5-20 min)
- Metrics: [Queries with thresholds]
- Logs: [Loki queries with filters]
- Traces: [Trace IDs from errors]

## Resolution Phase
### Immediate Mitigation (< 15 min)
- Option A: [Rollback command with verification]
- Option B: [Scale command with expected outcome]

### Root Cause Fix
- [Detailed steps with rollback plan]

### Verification
- [ ] Error rate < [threshold]
- [ ] Latency P99 < [threshold]
- [ ] No active alerts
```

See [references/EXAMPLES.md](references/EXAMPLES.md) for complete template variants.

**Expected outcome:** Template selected matches incident complexity, all sections appropriate for service type.

**On failure:**
- Start with basic template, iterate after first incident use
- Review industry examples (Google SRE books, vendor runbooks)
- Add sections incrementally based on team feedback

### Step 2: Document Diagnostic Procedures

Create step-by-step investigation procedures with specific queries and expected values.

**Required diagnostic checklist** (adapt based on your stack):

1. **Verify Service Health**
   ```bash
   curl -I https://api.example.com/health
   # Expected: HTTP 200 OK
   # On failure: Check if all pods/instances are down
   ```
   ```promql
   up{job="api-service"}
   # Expected: 1 for all instances
   # If 0: Service instance is down, proceed to logs
   ```

2. **Check Error Rate**
   ```promql
   sum(rate(http_requests_total{status=~"5.."}[5m]))
   / sum(rate(http_requests_total[5m])) * 100
   # Expected: < 1%
   # If > 5%: Critical issue, proceed to log analysis
   ```

3. **Analyze Logs**
   ```logql
   {job="api-service"} |= "error" | json | level="error"
   # Look for: error messages, trace IDs, common patterns
   ```

4. **Check Resource Utilization**
   ```promql
   avg(rate(container_cpu_usage_seconds_total{pod=~"api-service.*"}[5m])) * 100
   # Expected: < 70%
   # If > 90%: CPU saturation, consider scaling
   ```

5. **Review Recent Changes**
   - Check deployments: `kubectl rollout history deployment/api-service`
   - Review git commits: `git log --oneline --since="2 hours ago"`
   - Verify infrastructure changes (Terraform/CloudFormation)

6. **Examine Dependencies**
   ```promql
   up{job=~"(database|cache|message-queue)"}
   # Verify all downstream services are healthy
   ```

**Failure pattern decision tree** (document in runbook):
- Service down? → Check all pods/instances, health endpoints
- Error rate elevated? → Check error types (5xx, gateway, database, timeouts)
- When did it start? → After deployment (rollback), gradual (resource leak), sudden (traffic/dependency)
- Affecting all or specific endpoints? → All = infrastructure, Specific = application bug

**Expected outcome:** Diagnostic procedures are specific, include expected vs actual values, guide responder through systematic investigation.

**On failure:**
- Test queries in actual monitoring system before documenting
- Include screenshots of dashboards for visual reference
- Add "Common mistakes" section for frequently missed steps
- Iterate based on feedback from incident responders

### Step 3: Define Resolution Procedures

Document step-by-step remediation with rollback options for each action.

**Five resolution options** (document all that apply to your incident type):

1. **Rollback Deployment** (fastest for post-deployment errors)
   ```bash
   kubectl rollout undo deployment/api-service
   ```
   Verification: Monitor error rate for 2-3 minutes, should drop below 1%
   Rollback: Roll forward to previous stable version if rollback causes issues

2. **Scale Up Resources** (for high CPU/memory, connection pool exhaustion)
   ```bash
   kubectl scale deployment/api-service --replicas=$((current * 3/2))
   ```
   Verification: CPU usage drops below 70% within 5 minutes
   Rollback: Scale back to original replica count after resolution

3. **Restart Service** (for memory leaks, stuck connections, cache corruption)
   ```bash
   kubectl rollout restart deployment/api-service
   ```
   Verification: All pods reach Running state, health check returns 200
   Rollback: Cannot undo restart; monitor for CrashLoopBackOff

4. **Feature Flag / Circuit Breaker** (for specific feature errors or dependency failures)
   ```bash
   kubectl set env deployment/api-service FEATURE_NAME=false
   ```
   Verification: Errors stop immediately if feature is the cause
   Rollback: Re-enable feature with `FEATURE_NAME=true`

5. **Database Remediation** (for connection errors, slow queries, pool exhaustion)
   ```sql
   -- PostgreSQL: Kill long-running queries
   SELECT pg_terminate_backend(pid) FROM pg_stat_activity
   WHERE state = 'active' AND query_start < now() - interval '5 minutes';
   ```
   Verification: Connection pool usage drops below 80%
   Rollback: Cannot undo query termination; monitor for application errors

**Universal verification checklist** (required after any resolution):
- [ ] Error rate < 1% (or service-specific threshold)
- [ ] Latency P99 < defined threshold
- [ ] Throughput at baseline levels
- [ ] Resource usage healthy (CPU < 70%, Memory < 80%)
- [ ] Dependencies healthy
- [ ] User-facing tests pass
- [ ] No active alerts

**Rollback procedure** (if resolution worsens situation):
1. Pause ongoing changes: `kubectl rollout pause deployment/api-service`
2. Revert configuration changes to previous state
3. Resume operations: `kubectl rollout resume deployment/api-service`
4. Return to diagnostic phase with new information

**Expected outcome:** Resolution steps are clear, include verification checks, provide rollback options for each action.

**On failure:**
- Add more granular steps for complex procedures
- Include expected command outputs ("should see: deployment.apps/api-service rolled back")
- Document rollback procedures explicitly for each action
- Create separate runbook if resolution has more than 10 steps

### Step 4: Establish Escalation Paths

Define when and how to escalate incidents with specific criteria and contact information.

**When to escalate immediately**:
- Customer-facing outage exceeds 15 minutes
- SLO error budget depleted by more than 10% in single incident
- Data loss, corruption, or security breach suspected
- Unable to identify root cause within 20 minutes
- Mitigation attempts fail or worsen situation

**Escalation levels** (adapt to your org structure):

| Level | Role | Response Time | Authority | When to Escalate |
|-------|------|---------------|-----------|------------------|
| 1 | Primary On-Call | 5 min | Deploy fixes, rollback, scale | Up to 30 min solo |
| 2 | Secondary On-Call | Auto after 15 min | Same as L1, additional support | After 20 min without progress |
| 3 | Team Lead | 15 min | Architecture decisions, vendor escalation | Incident > 1 hour, needs DB changes |
| 4 | Incident Commander | 15 min | Cross-team coordination, customer comms | Multiple teams, incident > 2 hours |
| 5 | Executive/C-Level | 30 min | Major decisions, PR/media | >50% users affected, outage > 4 hours |

**Escalation process**:
1. Notify target with: current status, impact, actions taken, help needed, dashboard link
2. Handoff if needed: share timeline, actions, access, remain available
3. Continue updates every 15 minutes even after escalation

**Contact directory** (maintain current information):
| Role | Slack | Phone | PagerDuty |
|------|-------|-------|-----------|
| Platform Team | @platform-oncall | +1-XXX-XXXX | [link] |
| Database Team | @dba-oncall | +1-XXX-XXXX | [link] |
| Security Team | @security-oncall | +1-XXX-XXXX | [link] |

**Expected outcome:** Clear criteria for escalation, contact information readily accessible, escalation paths aligned with organizational structure.

**On failure:**
- Validate contact information quarterly
- Add decision tree for escalation timing
- Include example escalation messages
- Document response time expectations for each level

### Step 5: Create Communication Templates

Provide pre-written messages for incident updates to reduce cognitive load during response.

**Internal templates** (for Slack #incident-response or similar):

1. **Initial Declaration**:
   ```
   🚨 INCIDENT: [Title] | Severity: [Critical/High/Medium]
   Impact: [users/services] | Owner: @username | Dashboard: [link]
   Quick Summary: [1-2 sentences] | Next update: 15 min
   ```

2. **Progress Update** (every 15-30 min):
   ```
   📊 UPDATE #N | Status: [Investigating/Mitigating/Monitoring]
   Actions: [what we tried and outcomes]
   Theory: [what we think is happening]
   Next: [planned actions]
   ```

3. **Mitigation Complete**:
   ```
   ✅ MITIGATION | Metrics: Error [before→after], Latency [before→after]
   Root Cause: [brief or "investigating"] | Monitoring 30min before resolved
   ```

4. **Resolution**:
   ```
   🎉 RESOLVED | Duration: [time] | Root Cause + Impact + Follow-up actions
   ```

5. **False Alarm**:
   ```
   ℹ️ FALSE ALARM | No impact, no follow-up needed
   ```

**External templates** (for status page):
- **Initial**: "Investigating reports of [issue]. Next update in 15 min."
- **Progress**: "Identified cause as [brief explanation]. Implementing fix."
- **Resolution**: "Resolved as of [time]. Root cause: [simple explanation]."

**Expected outcome:** Templates save time during incidents, ensure consistent communication, reduce cognitive load on responders.

**On failure:**
- Customize templates to match company communication style
- Pre-fill templates with common incident types
- Create Slack workflow to populate templates automatically
- Review templates during incident retrospectives

### Step 6: Link Runbook to Monitoring

Integrate runbook with alerts and dashboards for one-click access during incidents.

**Add runbook links to Prometheus alerts**:
```yaml
- alert: HighErrorRate
  annotations:
    runbook_url: "https://wiki.example.com/runbooks/high-error-rate"
    dashboard_url: "https://grafana.example.com/d/service-overview"
    incident_channel: "#incident-platform"
```

**Embed diagnostic links in runbook**:
- Service Overview Dashboard: [direct link]
- Error Rate Last 1h: [Prometheus direct link]
- Recent Error Logs: [Loki/Grafana Explore link]
- Recent Deployments: [CI/CD link]
- PagerDuty Incidents: [link]

**Create Grafana dashboard panel** with runbook links:
- Markdown panel listing all incident runbooks
- Include on-call rotation and escalation information

**Expected outcome:** Responders can access runbooks directly from alerts or dashboards, diagnostic queries pre-filled, one-click access to relevant tools.

**On failure:**
- Verify runbook URLs are accessible without complex authentication
- Use URL shorteners for complex Grafana/Prometheus links
- Test links quarterly to ensure they don't break
- Create browser bookmarks for frequently used runbooks

## Output Contract

When this skill completes successfully, the following artifacts must exist:

1. **Runbook document** written to specified location (Markdown format)
   - Contains all applicable sections from chosen template
   - Includes specific diagnostic queries with expected values
   - Documents resolution steps with verification and rollback procedures
   - Lists escalation criteria and current contact information
   - Provides communication templates for incident updates

2. **Monitoring integration** (if applicable)
   - Alert annotations updated with runbook URLs
   - Dashboard links embedded in runbook for quick access

3. **Validation evidence**
   - Runbook reviewed by at least one team member
   - Links tested and verified accessible
   - Diagnostic queries validated in monitoring system

## Failure Handling

### If template selection is unclear
- Default to basic template, add sections as needed after first use
- Review existing runbooks in your organization for consistency

### If diagnostic queries are not available
- Work with monitoring team to create required dashboards/queries first
- Document manual steps (UI navigation) as temporary workaround
- Add a tracked follow-up item in the runbook to replace manual steps with queries

### If resolution procedures are unknown
- Document what you do know, flag uncertain sections for review
- Consult with senior engineers who have handled similar incidents
- Create "draft" runbook, validate during next incident

### If escalation contacts are unclear
- Document what you know, escalate to team lead to fill gaps
- Use generic escalation path (team lead → manager → director)

### If runbook URLs are not accessible
- Verify permissions and authentication requirements
- Use alternative documentation platform if needed
- Cache offline copy if authentication is problematic during incidents

## Common Pitfalls

1. **Too generic**: Runbooks with vague steps like "check the logs" without specific queries are not actionable. Include exact PromQL/LogQL queries.

2. **Outdated information**: Runbooks referencing old systems become useless. Schedule quarterly reviews.

3. **No verification steps**: Resolution without verification leads to false positives. Always include "how to confirm it's fixed" with specific thresholds.

4. **Missing rollback procedures**: Every action should have a rollback plan. Don't trap responders in worse state.

5. **Assuming knowledge**: Runbooks for experts only exclude junior engineers. Write for the least experienced person on rotation.

6. **No ownership**: Runbooks without owners become stale. Assign specific team/person responsible for updates.

7. **Hidden behind auth**: Runbooks inaccessible during VPN/SSO issues are useless. Cache copies or use accessible wiki.

8. **Missing failure handling**: Steps without "on failure" guidance leave responders stuck. Document what to do when expected outcomes don't occur.

## Next Steps

After completing this skill:

1. **Link to monitoring**: Use `configure-alerting-rules` to add runbook URLs to alert annotations
2. **Build dashboards**: Use `build-grafana-dashboards` to create diagnostic dashboards referenced in runbook
3. **Set up monitoring**: Use `setup-prometheus-monitoring` to ensure diagnostic queries are available
4. **Define SLOs**: Use `define-slo-sli-sla` to reference SLO impact in incident severity classification

## References

- [references/EXAMPLES.md](references/EXAMPLES.md) - Complete template variants, diagnostic queries, resolution procedures, escalation guidelines, communication templates, and alert integration examples
- Google SRE Book: [Incident Response Chapter](https://sre.google/sre-book/incident-response/)
- PagerDuty Incident Response Guide
