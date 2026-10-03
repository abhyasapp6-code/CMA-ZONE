# CMA Zone — Final Home Page V1

REFERENCE: CMA-ZONE-HOME-FINAL-V1

## What changed from the design prototype

The previous dashboard prototype contained fixed demonstration values such as
62% syllabus, 38% revision, 51% tests and 57% readiness.

This final version does NOT use those values as student data.

### New student

A new student sees:

1. Welcome / setup screen
2. CMA level
3. Group
4. Attempt
5. Start Preparation

After setup:
- Syllabus = 0%
- Revision = 0%
- Tests / MCQs = 0%
- Readiness = 0% until real data exists
- Study streak = 0 days
- Today's Plan = empty
- Recent Activity = empty
- Study graph = 0
- Revision Due = empty

### Existing student

The dashboard reads the student's own state and calculates the metrics from
that data. In production, localStorage must be replaced by the authenticated
CMA Zone backend/data service.

## Important academic-data rule

`js/academic-structure.js` contains only the four Final Group 3 paper names
visible in the user's supplied dashboard reference image.

Other levels/groups are intentionally unconfigured until the approved CMA
academic master is connected. Do not invent subject names.

## Files

index.html
css/theme.css
css/home.css
js/academic-structure.js
js/home.js

## Architecture

Academic Master
      ↓
Student Profile / Attempt
      ↓
Student Progress Data
      ↓
Home Dashboard

The Home Page should not contain Firebase, payment or question-upload logic.

## Manual editing

Every code file includes:
FILE
REFERENCE
PURPOSE
EDITABLE AREAS
DEPENDENCIES
IMPORTANT NOTES
LAST UPDATED
