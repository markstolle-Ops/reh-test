# Deferred Items — Phase 02 Listing Creation AI Core

## Pre-existing Build Errors (Out of Scope)

### MarketTrends.tsx TypeScript Error (from plan 02-05)

**File:** `src/components/neighborhood/MarketTrends.tsx:182`

**Error:**
```
Type error: Type '(value: number, name: string) => [string, string] | [number, string]' is not assignable to type 'Formatter<ValueType, NameType>...
  Type 'undefined' is not assignable to type 'number'.
```

**Context:** This build error existed before plan 02-04 was executed (confirmed by git stash test). The Recharts `<Tooltip formatter>` prop expects `value: ValueType | undefined` but the handler types `value: number`. This was introduced in plan 02-05 and should be fixed in that plan's follow-up or in a dedicated fix commit.

**Fix required:** Change `(value: number, name: string)` to `(value: number | undefined | string, name: string)` and add a null guard before calling `formatTooltipPrice(value)`.

**Discovered:** 2026-03-16 during 02-04 build verification.
