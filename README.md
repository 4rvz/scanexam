# Exam Checker

A static, browser-only workspace for creating and checking multiple-choice exam sheets.

## Development

Install dependencies with `npm install`, then start the app with `npm run dev`.

## Checks

Run unit tests with `npm run test`, browser tests with `npm run test:e2e`, and the production build with `npm run build`.

## Printable forms

Printable answer sheets are produced entirely in the browser with `jspdf`. The QR code on each page is generated with `qrcode` and encodes the worksheet template ID, layout version, and zero-based page index.
