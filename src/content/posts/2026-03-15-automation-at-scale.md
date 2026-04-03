---
title: "What Breaks When You Automate Everything"
date: 2026-03-15
description: "We run thousands of workflows at Lyra. Here's what I learned about the ones that fail."
tags: ["automation", "engineering", "n8n"]
---

Six months ago, one of our onboarding workflows failed at step 17 of 30. The whole thing retried from the top. A client got three welcome emails, two Slack invites, and a CRM record that listed their company name as "undefined".

We had 200+ workflows running at that point. The onboarding one was the longest. It handled validation, account creation, email, CRM sync, Slack, and follow-up scheduling in a single chain. It worked for months. Then it didn't.

That failure cost us four hours of cleanup and a mildly confused client. It also changed how we build automation at Lyra.

## Small workflows beat smart workflows

The instinct is to build one workflow that handles every edge case. You add branching logic, conditional steps, retry wrappers. The workflow gets longer. You feel productive.

Then something breaks in the middle and the whole thing reruns.

We decomposed everything into small, independent steps:

```python
# Before: one chain, one failure point
def process_client_onboarding(client):
    validate_details(client)
    create_accounts(client)
    send_welcome_email(client)
    schedule_followup(client)
    sync_to_crm(client)

# After: each step fails and retries on its own
def handle_onboarding_step(step_name, client_id):
    steps = {
        "validate": validate_details,
        "accounts": create_accounts,
        "welcome": send_welcome_email,
        "followup": schedule_followup,
        "crm_sync": sync_to_crm,
    }
    return steps[step_name](client_id)
```

Each step has its own error handling, its own timeout, its own retry logic. When CRM sync fails, it doesn't resend the welcome email. Obvious in retrospect.

## You need to see what's happening

When hundreds of workflows run concurrently, you lose the ability to debug by reading logs. We built structured logging into every execution. Each run gets a trace ID. Every step emits events we query later.

The pattern that saved us the most time: dead letter queues. When a step fails after exhausting retries, it lands in a DLQ with full context. We review these daily. They've caught integration failures before clients noticed.

One week the DLQ surfaced 40 silent failures in our Xero sync. The API had changed a field name. No errors in the main logs. Without the DLQ, we'd have found out during month-end reconciliation. That's a bad time to find out.

## Know when to stop automating

The hardest part of automation is knowing when not to automate.

Some processes have edge cases that change weekly. Some require judgment calls that don't fit a decision tree. For those, we build human-in-the-loop checkpoints. The automation does 90% of the work and surfaces the remaining 10% for a person to review.

Full automation is the goal. Partial automation that works reliably beats full automation that breaks at 2am.

We learned this the expensive way. Now it's the first question we ask before building any new workflow: what happens when this fails? If the answer takes more than one sentence, it's not ready for full automation yet.
