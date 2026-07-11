# Guest Feedback — Phase 1 Prototype

A simple, staff-friendly guest feedback tool: a no-login guest survey (five
star-rated categories + a comment) and a front-desk view summarizing recent
feedback at a glance.

Built deliberately lean — no router, no chart library, minimal dependencies —
so it's easy to read, run, and extend.

## Running locally

```bash
npm install
npm run dev
```

## Structure

```
src/
  components/
    StarRating.jsx   Reusable tap-to-rate star input
    GuestSurvey.jsx   Guest-facing feedback form
    FrontDesk.jsx     Staff-facing summary view
  data/
    sampleFeedback.js Seed data + category list
  App.jsx             Simple two-view toggle (no router needed)
```
