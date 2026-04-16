# GigShield

GigShield is an AI-enabled parametric income protection platform for India's platform-based delivery workers. It protects riders from verified income loss caused by external disruptions such as heavy rain, unsafe AQI, platform outages, and related city-level conditions.

This product is intentionally limited to income-loss protection only.
It does not cover health, life, accidents, or vehicle repair.

## What Is GigShield?

GigShield is a digital safety net for delivery workers.

If a delivery partner working on platforms like Zomato, Swiggy, Blinkit, Zepto, or similar networks loses earning time because of bad weather, pollution, or platform disruption, GigShield helps protect that lost income.

In simple terms:

- a worker buys a small weekly protection plan
- GigShield monitors external disruption signals
- if a valid disruption affects earning ability, the platform can trigger support automatically
- fraud checks and policy rules are applied before payout

GigShield is not general insurance.
It is a focused parametric income protection product for gig workers.

## GigShield In One Line

GigShield helps delivery workers avoid or recover income loss caused by external disruptions.

## Who It Is For

GigShield is built for:

- food delivery riders
- quick-commerce delivery partners
- last-mile gig workers
- riders who work on one or multiple delivery platforms

## What Problem It Solves

Delivery workers often lose income when:

- heavy rain makes routes unsafe
- AQI becomes hazardous
- heat or environmental conditions reduce workable hours
- platform outages stop orders

Today, most workers carry that loss themselves.

GigShield creates a safety layer around those income shocks using weekly coverage, automated triggers, and instant support logic.

## How It Works

1. the worker signs up and selects a weekly plan
2. GigShield creates a risk profile based on city, work pattern, and platform setup
3. the system watches for disruption events like rain, AQI spikes, or outages
4. if a covered trigger happens, GigShield checks policy rules and fraud controls
5. payout support is initiated through the claims flow

## Core Idea

India's delivery workers operate on weekly cash flow, high volatility, and low financial buffers. When rain, pollution, traffic shocks, or platform downtime reduce safe working hours, workers can lose a meaningful share of their weekly income.

GigShield solves this through:

- weekly-priced protection aligned to gig-worker earnings cycles
- AI-assisted risk profiling during onboarding
- parametric trigger detection using weather, environmental, and platform signals
- zero-touch claims automation
- fraud-aware payout validation
- worker and admin dashboards for protection, trust, and analytics

The platform is built as a web experience so workers, judges, and insurers can access the same product quickly across devices without app-install friction.

## Standout Feature

### Income Radar + Shift Advisor

GigShield's signature differentiator is **Income Radar**.

Instead of only paying after disruption, Income Radar helps riders avoid loss before it happens.

It:

- predicts the safest earning zones for the rider's next shift
- highlights the highest-risk micro-zone in the city
- recommends better earning windows
- shows a tomorrow forecast for disruption pressure
- supports a demo storyline where the rider reroutes first and still stays protected if disruption spreads

This shifts GigShield from simple insurance into an intelligent co-pilot for delivery workers.

Relevant implementation:

- [src/utils/incomeRadar.js](/Users/suraj/Desktop/GigShield/src/utils/incomeRadar.js)
- [src/components/IncomeRadarPanel.jsx](/Users/suraj/Desktop/GigShield/src/components/IncomeRadarPanel.jsx)
- [src/pages/DashboardPage.jsx](/Users/suraj/Desktop/GigShield/src/pages/DashboardPage.jsx)

## Problem Statement

Platform-based delivery workers are the backbone of the digital economy, but their earnings are highly exposed to external disruptions.

Examples:

- extreme rainfall reduces safe working hours and order completion
- dangerous AQI makes outdoor delivery unsafe
- heatwaves lower productivity and shift duration
- platform outages stop order flow even when the rider is available

Current workers usually absorb that loss alone.

Traditional insurance is a poor fit because it is:

- document-heavy
- slow to assess
- not aligned to weekly payout cycles
- focused on reimbursement after damage instead of automatic income relief

GigShield uses a parametric model:

1. detect a verified external disruption
2. validate whether the worker has active weekly coverage
3. apply fraud and policy checks
4. trigger payout support automatically

## Delivery Persona

### Primary Persona

- Name: Ramesh
- Age: 26
- City: Delhi NCR
- Platforms: Swiggy + Zomato
- Work style: full-time with peak-hour dependency
- Weekly earnings: `₹6,000-₹15,000`
- Pain point: can lose 1 to 2 days of income from weather, AQI, or platform downtime with no safety net

### Secondary Personas

- Mumbai rider affected by waterlogging and platform saturation
- Bengaluru rider affected by storm delays and high traffic friction
- Delhi rider with repeated AQI-related disruption risk

## Persona-Based Scenarios

### 1. Heavy Rain

- Ramesh begins a Gurugram shift.
- Rain crosses the configured city threshold.
- Demand drops and road safety worsens.
- GigShield validates trigger eligibility and initiates income support.

### 2. AQI Spike

- A rider is scheduled for evening delivery.
- AQI crosses the hazard threshold.
- Outdoor work becomes unsafe.
- GigShield treats this as an income-loss event and begins the payout path.

### 3. Platform Outage

- A rider is online and available.
- Platform downtime blocks order flow.
- GigShield verifies the disruption signal and releases support automatically.

### 4. Fraud Attempt

- A suspicious user tries to claim repeatedly from inconsistent locations.
- GigShield checks geolocation, session behavior, duplicate patterns, and verification signals.
- The payout is blocked or routed for moderation.

### 5. Income Radar Save

- A rider starts in a high-risk zone with rising AQI and congestion pressure.
- Income Radar recommends shifting to a safer corridor before the earnings window collapses.
- If disruption still spreads, GigShield already knows the payout-ready protection window and can respond automatically.

## End-to-End Workflow

### 1. Optimized Onboarding

The worker enters:

- city
- work pattern
- linked delivery platforms
- weekly earnings band
- rider identity details
- proof inputs
- preferred coverage and trigger preferences

GigShield then:

- creates a rider persona profile
- estimates disruption and fraud posture
- recommends a plan
- previews weekly pricing
- activates protection

Relevant implementation:

- [src/components/verification/StepProfile.jsx](/Users/suraj/Desktop/GigShield/src/components/verification/StepProfile.jsx)
- [src/components/verification/StepPlatform.jsx](/Users/suraj/Desktop/GigShield/src/components/verification/StepPlatform.jsx)
- [src/components/verification/StepRiderProof.jsx](/Users/suraj/Desktop/GigShield/src/components/verification/StepRiderProof.jsx)
- [src/components/verification/StepCoverage.jsx](/Users/suraj/Desktop/GigShield/src/components/verification/StepCoverage.jsx)
- [src/utils/onboardingProfile.js](/Users/suraj/Desktop/GigShield/src/utils/onboardingProfile.js)

### 2. Weekly Policy Creation

The worker selects a weekly plan:

- Basic
- Standard
- Pro

Each plan defines:

- weekly premium
- covered disruption hours
- payout logic by trigger
- daily payout cap

Relevant implementation:

- [src/data/planDetails.json](/Users/suraj/Desktop/GigShield/src/data/planDetails.json)
- [src/utils/pricing.js](/Users/suraj/Desktop/GigShield/src/utils/pricing.js)
- [src/pages/PricingPage.jsx](/Users/suraj/Desktop/GigShield/src/pages/PricingPage.jsx)

### 3. AI-Powered Risk Profiling

GigShield uses rider inputs and operating context to build an AI-style risk profile.

Signals include:

- city risk
- work style
- weekly earnings dependency
- number of linked platforms
- disruption exposure
- fraud posture

This affects:

- premium recommendation
- coverage positioning
- predictive support logic
- verification intensity

Relevant implementation:

- [src/utils/onboardingProfile.js](/Users/suraj/Desktop/GigShield/src/utils/onboardingProfile.js)
- [src/utils/pricing.js](/Users/suraj/Desktop/GigShield/src/utils/pricing.js)
- [src/utils/predictiveSafetyNet.js](/Users/suraj/Desktop/GigShield/src/utils/predictiveSafetyNet.js)
- [src/utils/fraud.js](/Users/suraj/Desktop/GigShield/src/utils/fraud.js)

### 4. Parametric Trigger Automation

GigShield monitors disruption inputs through live, mock, or simulated integrations:

- weather signals
- AQI and environmental conditions
- traffic and mobility inputs
- platform outage status
- city disruption signals

When a trigger fires, the system checks:

- policy eligibility
- coverage hours
- daily cap room
- payout rules
- trigger confidence

Relevant implementation:

- [src/utils/triggerEngine.js](/Users/suraj/Desktop/GigShield/src/utils/triggerEngine.js)
- [src/utils/integrations.js](/Users/suraj/Desktop/GigShield/src/utils/integrations.js)
- [src/utils/policy.js](/Users/suraj/Desktop/GigShield/src/utils/policy.js)
- [src/utils/payout.js](/Users/suraj/Desktop/GigShield/src/utils/payout.js)
- [src/pages/TriggerPage.jsx](/Users/suraj/Desktop/GigShield/src/pages/TriggerPage.jsx)

### 5. Zero-Touch Claims and Payouts

GigShield follows a zero-touch claims model:

- disruption is detected automatically
- a claim is initiated automatically
- validation and fraud checks run
- payout status advances through lifecycle states
- receipt and payout history are recorded

Lifecycle states demonstrated:

- `pending-verification`
- `verified`
- `processing`
- `settled`
- `failed`

Relevant implementation:

- [src/utils/payoutReceipt.js](/Users/suraj/Desktop/GigShield/src/utils/payoutReceipt.js)
- [src/pages/PayoutPage.jsx](/Users/suraj/Desktop/GigShield/src/pages/PayoutPage.jsx)
- [src/pages/PayoutReceivedPage.jsx](/Users/suraj/Desktop/GigShield/src/pages/PayoutReceivedPage.jsx)
- [src/pages/PayoutHistoryPage.jsx](/Users/suraj/Desktop/GigShield/src/pages/PayoutHistoryPage.jsx)

### 6. Intelligent Fraud Detection

GigShield includes delivery-specific fraud protection:

- anomaly detection in payout attempts
- location validation
- activity validation
- duplicate-claim prevention
- velocity and cooldown checks
- selfie or liveness-style verification for risky sessions
- admin moderation support

Relevant implementation:

- [src/utils/payoutSecurity.js](/Users/suraj/Desktop/GigShield/src/utils/payoutSecurity.js)
- [src/components/SelfieVerificationPanel.jsx](/Users/suraj/Desktop/GigShield/src/components/SelfieVerificationPanel.jsx)
- [src/pages/FraudGuardPage.jsx](/Users/suraj/Desktop/GigShield/src/pages/FraudGuardPage.jsx)
- [src/pages/AdminOperationsPage.jsx](/Users/suraj/Desktop/GigShield/src/pages/AdminOperationsPage.jsx)

### 7. Worker and Admin Analytics

Worker-side views include:

- weekly earnings protected
- support remaining
- trigger status
- payout history
- predictive and radar insights

Admin-side views include:

- payout outcomes
- anomaly alerts
- risk and trust metrics
- moderation visibility
- insurer-facing operations

Relevant implementation:

- [src/pages/DashboardPage.jsx](/Users/suraj/Desktop/GigShield/src/pages/DashboardPage.jsx)
- [src/pages/TrustCenterPage.jsx](/Users/suraj/Desktop/GigShield/src/pages/TrustCenterPage.jsx)
- [src/pages/AdminOperationsPage.jsx](/Users/suraj/Desktop/GigShield/src/pages/AdminOperationsPage.jsx)
- [src/utils/phase3Analytics.js](/Users/suraj/Desktop/GigShield/src/utils/phase3Analytics.js)

## Weekly Premium Model

Weekly pricing is central to GigShield because delivery workers usually think in weekly earnings and weekly withdrawals.

### Base Weekly Plans

- Basic: `₹79/week`
- Standard: `₹129/week`
- Pro: `₹179/week`

Defined in:

- [src/data/planDetails.json](/Users/suraj/Desktop/GigShield/src/data/planDetails.json)

### Dynamic Premium Inputs

The live weekly premium is adjusted using:

- selected plan base price
- linked platform count
- risk level
- persona risk signals

Relevant implementation:

- [src/utils/pricing.js](/Users/suraj/Desktop/GigShield/src/utils/pricing.js)

## Parametric Triggers

The current product direction focuses on disruption triggers such as:

- heavy rainfall
- unsafe AQI
- heat stress conditions
- traffic-driven severe slowdown
- platform outage or degraded availability

Only income-loss triggers are covered.

GigShield explicitly excludes:

- health claims
- life cover
- personal accidents
- vehicle repair expenses

## Why Web Instead of Mobile

We chose a web-first approach because it:

- reduces friction for judges and demo reviewers
- works immediately across laptop and mobile browsers
- supports fast iteration during hackathon timelines
- makes onboarding, dashboards, and insurer/admin views easier to present

The UI is still designed responsively for mobile-style worker flows.

## Frontend Experience

The product now has a unified, static global navbar so every major surface is accessible throughout the site.

Key routes available from navigation:

- home
- product
- pricing
- triggers
- fraud guard
- get protected
- sign in / sign up / auth hub
- dashboard
- payout / receipt / payout history
- predictive history
- community heatmap
- team protection
- trust center
- support
- admin hub / admin operations

Relevant implementation:

- [src/components/Navbar.jsx](/Users/suraj/Desktop/GigShield/src/components/Navbar.jsx)
- [src/App.jsx](/Users/suraj/Desktop/GigShield/src/App.jsx)

## Tech Stack

- React
- Vite
- Tailwind CSS
- Framer Motion
- React Router
- Supabase authentication hooks
- mock and simulated integration utilities for triggers, payouts, and fraud workflows

## Development Plan

### Phase 1: Ideate & Know Your Delivery Worker

- define worker personas
- document scenarios and workflow
- design weekly premium model
- define parametric triggers
- map AI and fraud strategy
- create the idea document and prototype direction

### Phase 2: Automation & Protection

- onboarding and registration
- policy management
- dynamic premium calculation
- trigger automation
- claims and payout lifecycle

### Phase 3: Scale & Optimise

- advanced fraud detection
- intelligent dashboards
- payout simulation polish
- predictive support logic
- Income Radar differentiation

## Deliverables Coverage

This repo now demonstrates the expected deliverables:

- optimized onboarding for a delivery-worker persona
- AI-style risk profiling
- weekly policy creation
- parametric trigger-based claim initiation
- payout processing flow
- fraud detection and verification logic
- worker analytics dashboard
- insurer/admin analytics views

## Local Setup

### Install

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

### Build

```bash
npm run build
```

## Demo Assets

Add public links here before submission:

- Phase 1 strategy video: `TBD`
- Phase 2 demo video: `TBD`
- Final demo video: `TBD`

## Submission Notes

GigShield is designed to show that parametric insurance for gig workers can be:

- simple
- weekly-priced
- automated
- fraud-aware
- predictive
- worker-centric

The platform is not trying to insure everything.
It focuses narrowly on one urgent gap: protecting delivery workers from external disruption-driven income loss.
