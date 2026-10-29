# Srinivasa Cable Network — Customer Management Site

Got the Mongo URI. I'll store it securely as the `MONGODB_URI` secret (not in code) as the first build step, and treat the pasted value as sensitive — please rotate the password later if you'd like, since it was shared in chat.

## Pages

1. **Home / Customer List (`/`)**
   Table columns: Serial No, Name, VC No, Address, Phone, Image (thumbnail), Actions (View · Edit · Delete). Search box + "Add customer" button at top.
2. **Add Customer (`/customers/new`)** — Name, VC No, Address, Phone, Image (file input → base64).
3. **Edit Customer (`/customers/$id/edit`)** — same form, pre-filled.
4. **View Customer (`/customers/$id`)** — read-only detail with full image.
5. **Delete** — confirmation dialog from the list row.

Serial No = row index on render (not stored).

## Data model — MongoDB `scn` DB, collection `customers`

```
{
  _id: ObjectId,
  name: string,
  vcNo: string,       // unique
  address: string,
  phone: string,
  image: string,      // "data:image/...;base64,...."
  createdAt: Date,
  updatedAt: Date
}
```

Unique index on `vcNo` created lazily on first write.

## Technical section

- **Stack:** TanStack Start + Tailwind + shadcn/ui (Table, Dialog, Form, Toast).
- **Mongo driver constraint:** the official `mongodb` Node driver uses raw TCP and does **not** run on this template's default Cloudflare Workers edge runtime. To use `mongodb+srv://` directly, I'll switch the SSR/server runtime to Node (Nitro `node-server` preset) so `createServerFn` handlers can open the Atlas TCP connection. If that switch causes any deployment issue, the fallback is Atlas Data API (HTTPS) — say the word and I'll swap.
- **Secret:** `MONGODB_URI` (the value you pasted). Optional `MONGODB_DB` defaulting to `scn`.
- **Connection:** cached singleton in `src/lib/mongo.server.ts` (module-level `MongoClient`).
- **Server functions** in `src/lib/customers.functions.ts` via `createServerFn`:
  - `listCustomers`, `getCustomer(id)`, `createCustomer(data)`, `updateCustomer(id,data)`, `deleteCustomer(id)`
- **Data loading:** TanStack Query — `ensureQueryData` in loaders, `useSuspenseQuery` in components; mutations invalidate `['customers']` (and `['customers', id]`).
- **Image:** client-side `FileReader.readAsDataURL` → base64 string, soft-capped ~500 KB with a friendly warning (Mongo doc limit is 16 MB).
- **Validation:** shared Zod schema for form + server input validator.
- **No auth** — all pages public (as requested).

## Design

Clean utility-admin look: white background, dark slate text, single blue accent for primary buttons; shadcn Table with hover rows and small circular image thumbnails; mobile view collapses rows to stacked cards. Header: "Srinivasa Cable Network" wordmark, subtle divider.

## Build order

1. Save `MONGODB_URI` secret (using the value you shared).
2. `bun add mongodb`; switch SSR to Node runtime.
3. Mongo singleton + typed customer server functions + Zod schema.
4. List route with table + search + delete confirmation.
5. Add / Edit shared form route; View route.
6. Branding + toasts + empty state polish.

Reply **approve** to build, or tell me any change (e.g. use a different DB name, add login, use Atlas Data API instead).
