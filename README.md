# Image‑QA Rewards App — Full Project Draft

A production‑ready blueprint (with code scaffolds) for a small web app where users log in, submit an image + question + answer, and earn redeemable points when their submission is accepted by an external n8n workflow.

---

## 1) Goals & Non‑Goals

**Goals**
- Email/social login google sso.
- First‑run onboarding to capture **user expertise**.
- Single main page with:
  - a **guided form** (image + question + answer),
  - a **table** listing the user’s past submissions & statuses.
- On submit, call **n8n workflow** with a submission id; later n8n calls our **webhook** to update status and award points.
- **Wallet & redemption**: points accrue on accepted submissions; user can request payout to bank account or UPI ID.
- A page for **Bank Details & UPI**.
- Minimal **admin** view to review redemptions.

**Non‑Goals (for v1)**
- Real money movement (integrations mocked behind an admin approval step).
- Complex roles/permissions.
- Heavy moderation or ML; n8n is the async worker of truth.

---

## 2) Tech Stack (opinionated)
- **Next.js 14 (App Router) + TypeScript** — full‑stack React.
- **Auth.js (NextAuth)** — credentials/Google login.
- **Prisma + PostgreSQL** — relational DB.
- **UploadThing** or **Cloudinary** — image uploads (choose one; examples use UploadThing).
- **Zod** — safe input validation.
- **shadcn/ui + Tailwind** — polished UI primitives.
- **React Query (TanStack)** — client data fetching.
- **n8n** — external async processing.

> Alternative choices are easy to swap (Supabase, Firebase Auth/Storage, etc.).

---

## 3) User Flows

### 3.1 Authentication & Onboarding
1. User hits `/` → not logged in → redirected to `/login`.
2. After login, if `user.profile.expertise` is **null**, redirect to `/onboarding` with a short survey (chips/select + optional free‑text).
3. On submit, save expertise and route to `/dashboard`.

### 3.2 Dashboard (Form + Table)
- **Form**
  - Fields: *Artifact (image)*, *Question*, *Answer*.
  - Side panel (“How this form works”) explains expectations, allowed formats, and what n8n does.
  - Submit → create `Submission` row with status `PENDING`, optimistic add to table.
  - Backend calls **n8n** (HTTP) with `submissionId`.
- **Table**
  - Columns: Artifact (thumb), Question, Answer (truncated), Status (badge), Points, UpdatedAt, Actions (view/delete).
  - Status values: `PENDING`, `PROCESSING`, `ACCEPTED`, `REJECTED`.

### 3.3 n8n Round‑Trip
- n8n receives `submissionId`, fetches details (or they’re posted directly), runs tasks.
- When done, n8n POSTs to our webhook `/api/n8n/submission-status` with `{ submissionId, status, pointsAwarded, notes }`.
- We validate signature, update `Submission`, credit `Wallet.pointsBalance`, append `WebhookEvent` & `AuditLog`.

### 3.4 Wallet, Bank & UPI
- `/bank` page to collect Bank Account and UPI ID (validated, encrypted at rest).
- `/wallet` shows points balance and redemption history. Button → create `RedemptionRequest` (status `PENDING`).
- Minimal `/admin` allows marking a redemption `APPROVED`/`PAID` manually.

---

## 4) Data Model (Prisma)
```prisma
// schema.prisma
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  name         String?
  image        String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  profile      UserProfile?
  submissions  Submission[]
  wallet       Wallet?
  bankDetails  BankDetails?
  accounts     Account[]
  sessions     Session[]
}

model UserProfile {
  id         String  @id @default(cuid())
  userId     String  @unique
  expertise  String?
  bio        String?
  user       User    @relation(fields: [userId], references: [id])
}

model Submission {
  id              String    @id @default(cuid())
  userId          String
  artifactUrl     String
  question        String
  answer          String
  status          SubmissionStatus @default(PENDING)
  pointsAwarded   Int       @default(0)
  n8nWorkflowId   String?
  n8nRunId        String?
  reviewerNotes   String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  user            User      @relation(fields: [userId], references: [id])
}

enum SubmissionStatus { PENDING PROCESSING ACCEPTED REJECTED }

model Wallet {
  id             String   @id @default(cuid())
  userId         String   @unique
  pointsBalance  Int      @default(0)
  user           User     @relation(fields: [userId], references: [id])
  transactions   WalletTxn[]
}

model WalletTxn {
  id            String   @id @default(cuid())
  walletId      String
  deltaPoints   Int
  reason        String
  createdAt     DateTime @default(now())
  wallet        Wallet   @relation(fields: [walletId], references: [id])
}

model BankDetails {
  id              String   @id @default(cuid())
  userId          String   @unique
  accountHolder   String?
  accountNumber   String?  // store encrypted
  ifsc            String?
  upiId           String?
  updatedAt       DateTime @updatedAt
  user            User     @relation(fields: [userId], references: [id])
}

model RedemptionRequest {
  id           String   @id @default(cuid())
  userId       String
  points       Int
  status       RedemptionStatus @default(PENDING)
  method       RedemptionMethod // BANK or UPI
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  payoutRef    String?
  user         User     @relation(fields: [userId], references: [id])
}

enum RedemptionStatus { PENDING APPROVED REJECTED PAID }

enum RedemptionMethod { BANK UPI }

model WebhookEvent {
  id            String   @id @default(cuid())
  submissionId  String
  payload       Json
  source        String
  signature     String?
  createdAt     DateTime @default(now())
}

// NextAuth models (if using Prisma adapter)
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime
  @@unique([identifier, token])
}
```

---

## 5) API Contract (Next.js Route Handlers)

### Auth
- `GET /api/auth/*` — handled by Auth.js.

### Submissions
- `POST /api/submissions`
  - Body: `{ artifactUrl, question, answer }`
  - Auth: user
  - Side‑effect: create `Submission(PENDING)`, create Wallet if missing, call n8n.
  - Returns: created submission.
- `GET /api/submissions?mine=1` → list current user’s submissions (paginated).
- `GET /api/submissions/:id` → detail (ownership enforced).

### n8n Webhook
- `POST /api/n8n/submission-status` (webhook endpoint)
  - Headers: `X-Signature` (HMAC), `X-Source: n8n`.
  - Body: `{ submissionId, status, pointsAwarded?, notes?, n8nRunId? }`
  - Validates signature; updates `Submission.status`, increments `Wallet.pointsBalance` if ACCEPTED, creates `WalletTxn`, writes `WebhookEvent`.

### Wallet & Redemptions
- `GET /api/wallet/me` → balance + txns.
- `POST /api/redemptions`
  - Body: `{ method: 'BANK'|'UPI', points }`
  - Checks: sufficient points; creates `RedemptionRequest(PENDING)`; deducts points; emits `WalletTxn`.
- `GET /api/redemptions?mine=1` → list mine.
- `PATCH /api/admin/redemptions/:id` → admin marks APPROVED/REJECTED/PAID.

### Bank Details
- `GET /api/bank` → my bank details.
- `PUT /api/bank`
  - Body: `{ accountHolder?, accountNumber?, ifsc?, upiId? }`
  - Encrypt `accountNumber` (see Security).

---

## 6) n8n Integration

### 6.1 From App → n8n on Submit
- Configure env `N8N_WORKFLOW_URL` and `N8N_API_KEY` (if needed).
- Payload example:
```json
{
  "submissionId": "sub_cuid123",
  "artifactUrl": "https://utfs.io/…/image.jpg",
  "question": "What is shown in the highlighted area?",
  "answer": "It’s a resistor network.",
  "userId": "user_cuid",
  "expertise": "Electronics"
}
```

### 6.2 From n8n → App Webhook
- n8n HTTP Request node to `POST https://yourapp.com/api/n8n/submission-status` with secret HMAC.
- Example body:
```json
{
  "submissionId": "sub_cuid123",
  "status": "ACCEPTED",
  "pointsAwarded": 5,
  "notes": "Validated by model and reviewer.",
  "n8nRunId": "run_abc123"
}
```
- Compute `X-Signature = hex(hmac_sha256(WEBHOOK_SECRET, rawBody))` and send header.

---

## 7) Security, Validation & Privacy
- **AuthN/AuthZ** with Auth.js; protect API routes via server session.
- **Zod** schemas for every input.
- **HMAC** signature verification for webhook.
- **Row Ownership**: users can only read/write their own submissions/bank details/redemptions.
- **PII encryption**: encrypt `accountNumber` at rest using libsodium or AES‑GCM (key from `PII_ENC_KEY`).
- **Uploads**: restrict to images, size limit (e.g., 5–10MB), AV scan hook if needed.
- **Rate limiting**: simple IP+user token bucket on submission and webhook.

---

## 8) UI/UX Details

### 8.1 Dashboard Anatomy
- **Header**: points balance, "Redeem" button.
- **Left column**: **SubmissionForm** with helper text and validation.
- **Right column**: **SubmissionsTable** (infinite scroll/paginated).
- **Help drawer**: “How the form works” includes:
  - You’ll upload a clear image (JPG/PNG/WebP).
  - Ask **one** specific question related to the image.
  - Provide your best answer.
  - After submission, our system (n8n) evaluates it; you’ll see status updates.
  - If **ACCEPTED**, you earn points.

### 8.2 Bank/UPI Page
- Inputs: Account Holder, Account Number, IFSC, UPI ID.
- Validation: IFSC pattern, UPI `name@bank` pattern.
- Show last 4 digits of stored account number (masked).

---

## 9) Code Scaffolds (key files)

> **Note:** This is representative code to get you 80% of the way. You can paste into a Next.js repo and adjust imports.

### 9.1 Zod Schemas — `lib/validation.ts`
```ts
import { z } from "zod";

export const submissionSchema = z.object({
  artifactUrl: z.string().url(),
  question: z.string().min(8).max(280),
  answer: z.string().min(1).max(1000),
});

export const webhookSchema = z.object({
  submissionId: z.string(),
  status: z.enum(["PENDING","PROCESSING","ACCEPTED","REJECTED"]),
  pointsAwarded: z.number().int().min(0).optional(),
  notes: z.string().optional(),
  n8nRunId: z.string().optional(),
});

export const bankSchema = z.object({
  accountHolder: z.string().min(2).optional(),
  accountNumber: z.string().min(6).max(20).optional(),
  ifsc: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/).optional(),
  upiId: z.string().regex(/^\w+@[\w.]+$/).optional(),
});

export const redemptionSchema = z.object({
  method: z.enum(["BANK","UPI"]),
  points: z.number().int().positive(),
});
```

### 9.2 Auth — `app/api/auth/[...nextauth]/route.ts`
```ts
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { db } from "@/server/db";

const handler = NextAuth({
  adapter: PrismaAdapter(db),
  providers: [
    Google({
      clientId: process.env.GOOGLE_ID!,
      clientSecret: process.env.GOOGLE_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) (session.user as any).id = user.id;
      return session;
    },
  },
});

export { handler as GET, handler as POST };
```

### 9.3 Submit API — `app/api/submissions/route.ts`
```ts
import { getServerSession } from "next-auth";
import { submissionSchema } from "@/lib/validation";
import { db } from "@/server/db";

export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const body = await req.json();
  const parsed = submissionSchema.safeParse(body);
  if (!parsed.success) return new Response("Bad Request", { status: 400 });

  const { artifactUrl, question, answer } = parsed.data;

  const submission = await db.submission.create({
    data: {
      userId: (session.user as any).id,
      artifactUrl,
      question,
      answer,
      status: "PENDING",
    },
  });

  // Ensure wallet exists
  await db.wallet.upsert({
    where: { userId: (session.user as any).id },
    create: { userId: (session.user as any).id },
    update: {},
  });

  // Fire and forget n8n call (no await)
  fetch(process.env.N8N_WORKFLOW_URL!, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.N8N_API_KEY || "",
    },
    body: JSON.stringify({
      submissionId: submission.id,
      artifactUrl,
      question,
      answer,
      userId: (session.user as any).id,
    }),
  }).catch(() => {});

  return Response.json(submission);
}

export async function GET(req: Request) {
  const session = await getServerSession();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const url = new URL(req.url);
  const mine = url.searchParams.get("mine") === "1";
  const where = mine ? { userId: (session.user as any).id } : {};

  const list = await db.submission.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return Response.json(list);
}
```

### 9.4 Webhook — `app/api/n8n/submission-status/route.ts`
```ts
import { webhookSchema } from "@/lib/validation";
import { db } from "@/server/db";
import crypto from "crypto";

function verify(raw: string, signature?: string) {
  if (!process.env.WEBHOOK_SECRET) return false;
  if (!signature) return false;
  const h = crypto.createHmac("sha256", process.env.WEBHOOK_SECRET);
  h.update(raw);
  return h.digest("hex") === signature;
}

export async function POST(req: Request) {
  const raw = await req.text();
  const sig = req.headers.get("x-signature") ?? undefined;
  const ok = verify(raw, sig);
  if (!ok) return new Response("Invalid signature", { status: 401 });

  const data = JSON.parse(raw);
  const parsed = webhookSchema.safeParse(data);
  if (!parsed.success) return new Response("Bad Request", { status: 400 });

  const { submissionId, status, pointsAwarded = 0, notes, n8nRunId } = parsed.data;

  const submission = await db.submission.update({
    where: { id: submissionId },
    data: { status, pointsAwarded, reviewerNotes: notes ?? null, n8nRunId: n8nRunId ?? null },
  });

  await db.webhookEvent.create({
    data: { submissionId, payload: data, source: "n8n", signature: sig },
  });

  if (status === "ACCEPTED" && pointsAwarded > 0) {
    const wallet = await db.wallet.upsert({
      where: { userId: submission.userId },
      update: { pointsBalance: { increment: pointsAwarded } },
      create: { userId: submission.userId, pointsBalance: pointsAwarded },
    });
    await db.walletTxn.create({
      data: { walletId: wallet.id, deltaPoints: pointsAwarded, reason: `Submission ${submissionId} accepted` },
    });
  }

  return Response.json({ ok: true });
}
```

### 9.5 Bank Details — `app/api/bank/route.ts`
```ts
import { getServerSession } from "next-auth";
import { bankSchema } from "@/lib/validation";
import { db } from "@/server/db";
import { encryptPII, maskAccount } from "@/server/pii";

export async function GET() {
  const session = await getServerSession();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });
  const bd = await db.bankDetails.findUnique({ where: { userId: (session.user as any).id } });
  return Response.json({
    accountHolder: bd?.accountHolder ?? null,
    accountNumberMasked: bd?.accountNumber ? maskAccount(bd.accountNumber) : null,
    ifsc: bd?.ifsc ?? null,
    upiId: bd?.upiId ?? null,
  });
}

export async function PUT(req: Request) {
  const session = await getServerSession();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });
  const parsed = bankSchema.safeParse(await req.json());
  if (!parsed.success) return new Response("Bad Request", { status: 400 });
  const { accountHolder, accountNumber, ifsc, upiId } = parsed.data;

  const enc = accountNumber ? encryptPII(accountNumber) : undefined;

  const bd = await db.bankDetails.upsert({
    where: { userId: (session.user as any).id },
    update: { accountHolder, accountNumber: enc, ifsc, upiId },
    create: { userId: (session.user as any).id, accountHolder, accountNumber: enc, ifsc, upiId },
  });
  return Response.json({ ok: true });
}
```

### 9.6 Wallet & Redemption — `app/api/redemptions/route.ts`
```ts
import { getServerSession } from "next-auth";
import { redemptionSchema } from "@/lib/validation";
import { db } from "@/server/db";

export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });
  const parsed = redemptionSchema.safeParse(await req.json());
  if (!parsed.success) return new Response("Bad Request", { status: 400 });

  const { method, points } = parsed.data;
  const wallet = await db.wallet.findUnique({ where: { userId: (session.user as any).id } });
  if (!wallet || wallet.pointsBalance < points) return new Response("Insufficient points", { status: 400 });

  await db.$transaction([
    db.wallet.update({ where: { id: wallet.id }, data: { pointsBalance: { decrement: points } } }),
    db.walletTxn.create({ data: { walletId: wallet.id, deltaPoints: -points, reason: `Redemption request` } }),
    db.redemptionRequest.create({ data: { userId: (session.user as any).id, points, method } }),
  ]);

  return Response.json({ ok: true });
}

export async function GET() {
  const session = await getServerSession();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });
  const list = await db.redemptionRequest.findMany({ where: { userId: (session.user as any).id }, orderBy: { createdAt: "desc" } });
  return Response.json(list);
}
```

### 9.7 Server Utilities — encryption `server/pii.ts`
```ts
import crypto from "crypto";
const key = Buffer.from(process.env.PII_ENC_KEY!, "hex"); // 32 bytes

export function encryptPII(plain: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

export function maskAccount(encOrPlain?: string | null) {
  if (!encOrPlain) return null;
  const s = encOrPlain.replace(/\D/g, "");
  if (s.length < 4) return "••••";
  return `•••• ${s.slice(-4)}`;
}
```

### 9.8 UI Components (shadcn + Tailwind)

#### SubmissionForm — `components/submission-form.tsx`
```tsx
"use client";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { submissionSchema } from "@/lib/validation";

export default function SubmissionForm() {
  const qc = useQueryClient();
  const [artifactUrl, setArtifactUrl] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const body = { artifactUrl, question, answer };
      const parsed = submissionSchema.safeParse(body);
      if (!parsed.success) throw new Error("Invalid input");
      const res = await fetch("/api/submissions", { method: "POST", body: JSON.stringify(body) });
      if (!res.ok) throw new Error("Submit failed");
      return res.json();
    },
    onSuccess: () => {
      setQuestion(""); setAnswer("");
      qc.invalidateQueries({ queryKey: ["submissions"] });
    },
    onError: (e: any) => setError(e.message),
  });

  return (
    <div className="space-y-4 p-4 border rounded-2xl shadow-sm">
      <div className="text-lg font-semibold">Submit Image Q&A</div>
      <p className="text-sm text-muted-foreground">Upload a clear image, ask one specific question about it, and provide your best answer. Our system will review it; if accepted, you earn points.</p>

      {/* Replace with your upload widget; setArtifactUrl to the uploaded URL */}
      <input className="w-full" placeholder="Paste image URL" value={artifactUrl} onChange={e=>setArtifactUrl(e.target.value)} />

      <input className="w-full" placeholder="Question about the image" value={question} onChange={e=>setQuestion(e.target.value)} />
      <textarea className="w-full" placeholder="Your answer" value={answer} onChange={e=>setAnswer(e.target.value)} />

      {error && <div className="text-red-600 text-sm">{error}</div>}

      <button className="px-4 py-2 rounded-xl border" disabled={isPending} onClick={()=>mutate()}>
        {isPending ? "Submitting…" : "Submit"}
      </button>
    </div>
  );
}
```

#### SubmissionsTable — `components/submissions-table.tsx`
```tsx
"use client";
import { useQuery } from "@tanstack/react-query";

export default function SubmissionsTable() {
  const { data } = useQuery({
    queryKey: ["submissions"],
    queryFn: async () => (await fetch("/api/submissions?mine=1")).json(),
  });

  return (
    <table className="w-full text-sm border rounded-2xl overflow-hidden">
      <thead className="bg-gray-50">
        <tr>
          <th className="p-2 text-left">Image</th>
          <th className="p-2 text-left">Question</th>
          <th className="p-2 text-left">Answer</th>
          <th className="p-2 text-left">Status</th>
          <th className="p-2 text-left">Points</th>
        </tr>
      </thead>
      <tbody>
        {data?.map((s: any) => (
          <tr key={s.id} className="border-t">
            <td className="p-2"><img src={s.artifactUrl} className="h-10 w-10 object-cover rounded" alt="artifact"/></td>
            <td className="p-2 max-w-[240px] truncate" title={s.question}>{s.question}</td>
            <td className="p-2 max-w-[240px] truncate" title={s.answer}>{s.answer}</td>
            <td className="p-2"><span className={`px-2 py-1 rounded text-xs border`}>{s.status}</span></td>
            <td className="p-2">{s.pointsAwarded}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

#### BankDetailsForm — `components/bank-details-form.tsx`
```tsx
"use client";
import { useEffect, useState } from "react";

export default function BankDetailsForm(){
  const [form, setForm] = useState({accountHolder:"", accountNumber:"", ifsc:"", upiId:""});
  const [saved, setSaved] = useState(false);

  useEffect(()=>{
    fetch("/api/bank").then(r=>r.json()).then(d=>{
      setForm({
        accountHolder: d.accountHolder ?? "",
        accountNumber: "", // never prefill sensitive data
        ifsc: d.ifsc ?? "",
        upiId: d.upiId ?? "",
      });
    });
  },[]);

  async function save(){
    setSaved(false);
    await fetch("/api/bank", { method:"PUT", headers:{"Content-Type":"application/json"}, body: JSON.stringify(form)});
    setSaved(true);
  }

  return (
    <div className="space-y-3 p-4 border rounded-2xl shadow-sm">
      <div className="text-lg font-semibold">Bank & UPI</div>
      <input placeholder="Account holder name" value={form.accountHolder} onChange={e=>setForm({...form, accountHolder:e.target.value})} />
      <input placeholder="Account number" value={form.accountNumber} onChange={e=>setForm({...form, accountNumber:e.target.value})} />
      <input placeholder="IFSC" value={form.ifsc} onChange={e=>setForm({...form, ifsc:e.target.value.toUpperCase()})} />
      <input placeholder="UPI ID (name@bank)" value={form.upiId} onChange={e=>setForm({...form, upiId:e.target.value})} />
      <button className="px-4 py-2 rounded-xl border" onClick={save}>Save</button>
      {saved && <div className="text-green-600 text-sm">Saved!</div>}
    </div>
  );
}
```

### 9.9 Pages (App Router)
- `/login` — Auth.js sign in.
- `/onboarding` — expertise capture (textarea + tags).
- `/dashboard` — show `SubmissionForm` + `SubmissionsTable` + wallet badge.
- `/bank` — show `BankDetailsForm`.
- `/wallet` — balance, redemption button (call `/api/redemptions`).
- `/admin` — (basic) list redemptions and mark paid.

---

## 10) “How the Form Works” copy (drop‑in)
> **What to submit**  
> 1) **Artifact**: an image in JPG/PNG/WebP (≤10MB).  
> 2) **Question**: ask one specific, image‑related question. Avoid multiple questions or unrelated text.  
> 3) **Answer**: your best answer based on the image. Be concise.  
>
> **What happens next**  
> • We run automatic & manual checks via our workflow.  
> • You’ll see the status move from **PENDING → PROCESSING → ACCEPTED/REJECTED**.  
> • **Accepted** entries earn points immediately.  
>
> **Tips**  
> • Clear, relevant images get better results.  
> • Keep questions short (≤280 chars).  
> • Answers should be factual and refer to visible details.

---

## 11) Environment Variables
```
DATABASE_URL=postgresql://user:pass@host:5432/db
NEXTAUTH_URL=https://yourapp.com
NEXTAUTH_SECRET=...  
GOOGLE_ID=...
GOOGLE_SECRET=...
N8N_WORKFLOW_URL=https://n8n.example.com/webhook/...
N8N_API_KEY=...
WEBHOOK_SECRET=hex_shared_secret
PII_ENC_KEY=<64 hex chars for 32 bytes>
UPLOADTHING_SECRET=... (if used)
UPLOADTHING_APP_ID=...
```

---

## 12) Local Dev Quickstart
1. `pnpm dlx create-next-app@latest` → TypeScript, App Router, ESLint, Tailwind.
2. Add **Prisma**: `pnpm add prisma @prisma/client` → init, paste schema, `prisma migrate dev`.
3. Add **Auth.js**, **shadcn/ui**, **react-query**.
4. Add API routes & components from above.
5. Configure **UploadThing** or Cloudinary for image upload.
6. Set env, run `pnpm dev`.

---

## 13) Admin Cheat‑Sheet
- Approve/mark paid a redemption → (for v1) manual: change status via `/api/admin/redemptions/:id`.
- Export submissions: simple `/api/admin/submissions.csv` endpoint (optional).

---

## 14) Future Enhancements
- Real payout integration (Razorpay/Stripe, UPI collect).
- Image moderation (NSFW, malware) and EXIF scrubbing.
- Bulk submissions; drag‑drop multi‑upload.
- Notifications (email on acceptance/payout).
- More granular expertise taxonomy and matching.

---

**This draft includes everything to stand up the MVP: schema, API, pages, and n8n handshake. Paste the code blocks into a Next.js repo and iterate.**

