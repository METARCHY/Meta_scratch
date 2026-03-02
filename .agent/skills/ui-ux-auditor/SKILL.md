---
name: ui-ux-auditor
description: If your app has a frontend, this skill allows the agent to use the built-in Antigravity browser, take screenshots, and compare the rendered result against the original design requirements. Use when auditing UI/UX correctness, checking visual regressions, or comparing component rendering with designs.
---

# UI/UX Auditor

## Overview

This skill equips the agent to perform visual and functional reviews of frontend interfaces. You will use the Antigravity browser subagent to render the application, take screenshots, and compare the actual rendered output against the stated design requirements or existing UI standards.

## Core Capabilities

1. **Visual Regression & Design Comparison**
   - Ability to launch the application in the browser subagent.
   - Take screenshots of specific routes, components, or user flows.
   - Critically compare the screenshot against expected design requirements (colors, typography, spacing, alignment, responsiveness).

2. **Functional UX Auditing**
   - Verify that interactive elements (buttons, forms, dropdowns) have appropriate hover, focus, and active states.
   - Ensure transitions and animations execute smoothly and appropriately.
   - Check that the UI responds reasonably to different viewport sizes if requested.

## Workflow: Auditing an Interface

When requested to audit the UI or check how a page looks:

1. **Environment Verification**
   - Ensure the development server is running. If not, start it (e.g., `npm run dev`).
   - Identify the local URL to access the application (e.g., `http://localhost:5173`).

2. **Browser Subagent Navigation**
   - Call the browser subagent to navigate to the target URL.
   - Provide clear instructions to the subagent to wait for the page to fully load, dismiss any popups, and navigate to the specific logical state required.

3. **Capture and Analyze**
   - Instruct the browser subagent to take a screenshot of the target UI.
   - Analyze the screenshot (returned in the artifacts or via DOM inspection) against the user's design constraints or general UI/UX best practices.
   - Look for padding/margin inconsistencies, poor contrast, misaligned elements, or missing responsive behaviors.

4. **Reporting**
   - Summarize your findings to the user.
   - Point out specific discrepancies.
   - If empowered to do so, proactively suggest or apply the CSS/Tailwind changes necessary to fix the UI issues, then re-verify.
