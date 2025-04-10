# Updated Markdown Checklist for AI Coding Agent (Reflecting Implemented MVP)

**Goal:** Refine and secure the existing Vite+React MVP application, focusing on moving AI logic to the backend and polishing features.

**Tech Stack:**

- **Framework:** Vite + React Router DOM v6
- **UI Library:** React 19.1.0
- **Language:** TypeScript
- **Authentication:** Supabase Auth
- **Database:** Supabase Postgres
- **File Storage:** Supabase Storage
- **Backend Logic:** **(CURRENTLY CLIENT-SIDE - Needs Refactoring)** -> Target: Supabase Edge Functions
- **Styling:** Tailwind CSS
- **UI Components:** Shadcn/ui
- **Icons:** Lucide React (`lucide-react`)
- **PDF Parsing:** **(CURRENTLY CLIENT-SIDE VIA GEMINI - Needs Refactoring)** -> Target: `pdf-parse` within Edge Function before AI call.
- **AI Model:** Google Gemini 1.5 Pro (PDF), Gemini Flash (Insights) via `@google/generative-ai` **(CURRENTLY CLIENT-SIDE - Needs Refactoring)**

---

_(Checkboxes: `[ ]` = To Do/Verify/Refactor)_

### Epic 1: Project Setup & Base Configuration (Mostly Done)

**Story 1.1: Initialize Project**

- [ ] Initialize Vite project with React, TypeScript, Tailwind CSS.
- [ ] Install initial dependencies (`package.json`/`bun.lockb` present).
- [ ] Initialize Git repository.
- [ ] Create `.gitignore`.

**Story 1.2: Configure Tailwind CSS**

- [ ] `tailwind.config.ts` and `postcss.config.js` configured.
- [ ] `index.css` includes Tailwind directives.

**Story 1.3: Setup Shadcn/ui**

- [ ] Shadcn/ui initialized (`components.json` exists).
- [ ] Base Shadcn components installed (based on usage).
- [ ] `lucide-react` installed.

**Story 1.4: Setup Supabase Integration**

- [ ] Supabase client libraries installed.
- [ ] `.env.local` setup for Supabase keys (verify usage).
- [ ] Supabase client helper module exists (`integrations/supabase/client.ts`).
- [ ] Create Supabase _admin_ client helper (`lib/supabase/admin.ts` - Needed for Edge Functions).
- [ ] Add `SUPABASE_SERVICE_ROLE_KEY=` placeholder to `.env.local`.

**Story 1.5: Setup Google AI Integration**

- [ ] Google AI client library installed (`@google/generative-ai` likely unused if direct `fetch` is used in `client.ts`, verify).
- [ ] `VITE_GEMINI_API_KEY=` used in `.env.local` (**INSECURE**). Change to `GEMINI_API_KEY`.
- [ ] Create secure server-side/Edge Function helper for Google AI client (`lib/google-ai/client.ts` needs rewrite for backend).

**Story 1.6: Define Base Layout & Providers**

- [ ] Root layout exists (`App.tsx` likely handles providers).
- [ ] Shadcn `Toaster` (both standard and Sonner) included in `App.tsx`.
- [ ] `TooltipProvider` included in `App.tsx`.
- [ ] `QueryClientProvider` included in `App.tsx`.
- [ ] `AuthProvider` wraps the application in `App.tsx`.

---

### Epic 2: User Authentication (Mostly Done)

**Story 2.1: Create Authentication UI Components**

- [ ] `LoginForm.tsx` exists using Shadcn components.
- [ ] `SignupForm.tsx` exists using Shadcn components.
- [ ] Basic client-side validation likely handled by HTML `required`.

**Story 2.2: Implement Signup Page**

- [ ] Signup page route exists (`pages/Signup.tsx`).
- [ ] Uses the `SignupForm`.
- [ ] Form submission handler calls `signUp` from `AuthContext`.
- [ ] Handles success (toast, redirect) and errors (alert).

**Story 2.3: Implement Login Page**

- [ ] Login page route exists (`pages/Login.tsx`).
- [ ] Uses the `LoginForm`.
- [ ] Form submission handler calls `signIn` from `AuthContext`.
- [ ] Handles success (toast, redirect) and errors (alert).

**Story 2.4: Implement Logout Functionality**

- [ ] Logout functionality exists in `Header.tsx`.
- [ ] Calls `signOut` from `AuthContext`.
- [ ] Displays loading state and uses toast.

**Story 2.5: Implement Route Protection**

- [ ] `ProtectedRoute.tsx` component exists.
- [ ] Checks for user and loading state from `AuthContext`.
- [ ] Redirects unauthenticated users to `/login`.
- [ ] Used in `App.tsx` to wrap protected routes.
- [ ] Verify redirection logic for authenticated users trying to access `/login` or `/signup`.

**Story 2.6: Setup User Profile Handling**

- [ ] `profiles` table schema defined in SQL.
- [ ] Auto profile creation trigger (`handle_new_user`) defined in SQL.
- [ ] RLS policies for `profiles` defined in SQL.
- [ ] Verify trigger and RLS policies are active and functioning correctly in Supabase.

---

### Epic 3: Core Statement Handling (Upload & Storage) (Mostly Done)

**Story 3.1: Define Database Schema for Statements**

- [ ] `statements` table schema defined (`database.types.ts`).
- [ ] Added `currency` column (SQL).
- [ ] RLS policies defined in SQL.
- [ ] Verify RLS policies are active and functioning correctly.

**Story 3.2: Define Database Schema for Transactions**

- [ ] `transactions` table schema defined (`database.types.ts`).
- [ ] Added `balance` column (SQL).
- [ ] Added `category` column (SQL).
- [ ] Added `currency` column (SQL).
- [ ] RLS policies defined in SQL.
- [ ] Verify RLS policies are active and functioning correctly (especially service role insert if moving to backend).

**Story 3.3: Create Statement Upload UI**

- [ ] `UploadDialog.tsx` component exists.
- [ ] Uses Shadcn `Dialog`, `Button`, `Input`, `Label`, etc.
- [ ] Handles file selection, drag-and-drop, loading state, error display.
- [ ] Includes validation for PDF type and size.
- [ ] Includes check for logged-in user.
- [ ] Implement optional input for `statement_type`.

**Story 3.4: Implement File Upload & Trigger Processing [M - Client-Side]**

- [ ] Upload logic exists in `statements.ts` (`uploadPdf`).
- [ ] Gets user ID.
- [ ] Validates file (handled in `UploadDialog`).
- [ ] Handles filename encoding.
- [ ] Uploads file buffer to Supabase Storage using **public** client (verify if admin needed/used).
- [ ] Inserts record into `statements` table.
- [ ] Triggers `processPdf` function **client-side** immediately after successful DB insert.

---

### Epic 4: PDF Parsing & AI Categorization (NEEDS MAJOR REFACTORING)

**Story 4.1: Refactor Processing to Supabase Edge Function**

- [ ] Create Supabase Edge Function `process-statement`.
- [ ] Setup Edge Function environment (install Supabase CLI, link project, etc. if not done).
- [ ] Modify `supabase/functions/process-statement/index.ts` to handle incoming requests.

**Story 4.2: Implement Backend PDF Download & Text Extraction**

- [ ] Modify Edge Function to receive `statementId` payload.
- [ ] Use Supabase _admin_ client in Edge Function (configure secrets).
- [ ] Fetch the `statements` record using `statementId`.
- [ ] Update statement status to `processing_parsing`.
- [ ] Download the PDF from Supabase Storage using `storage_path` and admin client. Handle errors.
- [ ] Install and use `pdf-parse` within the Edge Function to extract text. Handle errors.
- [ ] Store extracted raw text in `statements.parsed_text`. Update status to `processing_categorization`.

**Story 4.3: Implement Backend DB Trigger for Edge Function**

- [ ] Create Supabase Database Function `trigger_statement_processing()` (using `pg_net`).
- [ ] Create Supabase Database Trigger `on_statement_insert` to call the DB function.
- [ ] Ensure `pg_net` is enabled and function/trigger are active.
- [ ] **Remove** the client-side call to `processPdf` from `statements.ts::uploadPdf`.

**Story 4.4: Implement Secure AI Transaction Categorization (Backend)**

- [ ] Modify Edge Function: after text parsing, initialize secure Google AI client (using `GEMINI_API_KEY` secret).
- [ ] Define Gemini prompt for transaction extraction/categorization (reuse/adapt from `client.ts`).
- [ ] Send `parsed_text` to Gemini securely from Edge Function. Handle API errors.
- [ ] Parse and validate the JSON response. Handle errors. Update status to `error_categorization` on failure.

**Story 4.5: Store Categorized Transactions (Backend)**

- [ ] Modify Edge Function: after valid AI response, iterate transactions.
- [ ] Validate/sanitize data.
- [ ] Use Supabase _admin_ client to bulk insert transactions. Include `user_id` correctly. Handle errors.
- [ ] Update statement status to `processing_insights` (or `completed` if skipping insights for now).

---

### Epic 5: AI Spending Insights (NEEDS REFACTORING & Enhancement)

**Story 5.1: Refactor Insights Generation to Backend (Optional but Recommended)**

- [ ] **Option 1 (Keep Client Trigger):** Create a new Edge Function (`generate-user-insights`) triggered manually (e.g., via `supabase.functions.invoke`).
  - [ ] Function receives `userId`.
  - [ ] Fetches all user transactions using _admin_ client.
  - [ ] Calls Gemini securely for insights using _admin_ client and `GEMINI_API_KEY` secret.
  - [ ] Calls `storeInsights` using _admin_ client.
  - [ ] Update `handleGenerateInsights` in UI to invoke this Edge Function instead of calling client-side logic.
- [ ] **Option 2 (Trigger after Processing):** Modify `process-statement` Edge Function.
  - [ ] After successfully storing transactions (Story 4.5), _conditionally_ trigger insights generation _if_ this is the _last_ statement being processed for a recent batch (complex logic, maybe defer). Or, always generate insights for the _current_ statement only (simpler, less holistic).
  - [ ] Fetch transactions for the _current_ statement.
  - [ ] Call Gemini securely for insights (limited to single statement).
  - [ ] Store insights (link to statement ID? Or keep user-level cache?). Update status to `complete`.

**Story 5.2: Implement/Verify Insights Caching**

- [ ] `insights` table schema defined in SQL.
- [ ] `getCachedInsights` function implemented (`insights.ts`). Checks expiration.
- [ ] `storeInsights` function implemented (`insights.ts`). Sets expiration. Deletes old insights.
- [ ] `generateAndStoreInsights` orchestrates generation and storage (`insights.ts`).

**Story 5.3: Enhance Insights Logic (If Refactoring)**

- [ ] If moving to backend, ensure secure Gemini calls.
- [ ] Ensure primary currency detection logic is robust or passed correctly.
- [ ] Handle API/DB errors gracefully during backend generation.

**Story 5.4: Deploy Edge Function(s) & Secrets**

- [ ] Deploy `process-statement` (and `generate-user-insights` if created) Edge Function(s).
- [ ] Set required secrets in Supabase Dashboard (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`). **Remove `VITE_GEMINI_API_KEY` from client `.env`**.

---

### Epic 6: Data Display & User Interface (Mostly Done)

**Story 6.1: Create Dashboard Page**

- [ ] Dashboard page exists (`pages/Dashboard.tsx`).
- [ ] Includes `Header`.
- [ ] Includes `StatementsTable`.
- [ ] Includes `FinancialInsightsOptimized`.
- [ ] Includes `UploadDialog` trigger.
- [ ] Includes Refresh button.

**Story 6.2: Create Statement Detail Page Structure**

- [ ] Statement detail page exists (`pages/StatementDetail.tsx`).
- [ ] Fetches statement data. Handles not found/errors.
- [ ] Fetches associated transactions (via `TransactionsTable`).
- [ ] Displays statement file name, status badge.
- [ ] Displays processing errors.
- [ ] Includes Back button, Refresh button, Delete button.

**Story 6.3: Display Categorized Transactions**

- [ ] `TransactionsTable.tsx` component exists.
- [ ] Displays transactions using Shadcn `Table`.
- [ ] Includes columns: Date, Description, Category (Badge), Amount (Formatted, colored).
- [ ] Implement client-side sorting/filtering (optional enhancement).
- [ ] Handles empty state.

**Story 6.4: Display AI Spending Insights**

- [ ] `FinancialInsightsOptimized.tsx` component exists.
- [ ] Displays insights using Shadcn `Tabs`, `Card`, `Progress`, etc.
- [ ] Handles loading state while fetching/generating.
- [ ] Handles state where insights haven't been generated yet (shows Generate button).
- [ ] Displays `Top Spending`, `Summary`, `Unusual Activity`, `Recommendations`.
- [ ] Includes Refresh button and displays cache time.
- [ ] `FinancialInsightsPage.tsx` exists for dedicated view.
- [ ] Verify Markdown rendering (current code seems to handle structured JSON, might not need Markdown).

**Story 6.5: Implement Loading & Error States UI**

- [ ] Loading spinners/skeletons used in various components (`Dashboard`, `StatementDetail`, `StatementsTable`, `FinancialInsightsOptimized`).
- [ ] Error messages displayed using Shadcn `Alert` or `Toast`.
- [ ] Empty states implemented for tables/insights.
- [ ] Review consistency and completeness of loading/error/empty states across the app.

---

### Epic 7: Refinements & Deployment Prep (Mostly To Do)

**Story 7.1: UI Polishing**

- [ ] Review overall layout, spacing, typography for consistency.
- [ ] Test and ensure responsiveness across different screen sizes.
- [ ] Review and improve accessibility (ARIA, keyboard nav, contrast).
- [ ] Add/refine icon usage (`lucide-react`).
- [ ] Refine form validation feedback.
- [ ] Improve loading/skeleton state visuals.

**Story 7.2: Thorough Error Handling Review**

- [ ] Test edge cases (non-PDFs, large files, protected PDFs, empty PDFs, API failures, DB errors).
- [ ] Ensure errors during **client-side** processing are handled gracefully (until refactored).
- [ ] Verify RLS policies prevent data leaks (manual testing or write tests).
- [ ] Improve user feedback for specific error types (e.g., "Invalid PDF format" vs. "AI processing failed").

**Story 7.3: Environment Variable Management**

- [ ] Client-side Supabase keys configured via `VITE_` env vars.
- [ ] **CRITICAL:** **Remove** `VITE_GEMINI_API_KEY`. Move `GEMINI_API_KEY` to backend/Edge Function secrets.
- [ ] Ensure `SUPABASE_SERVICE_ROLE_KEY` is correctly configured for backend use (Edge Functions).

**Story 7.4: Build & Deployment Setup (Vite)**

- [ ] Configure Vite build process (`vite build`).
- [ ] Set up deployment environment (e.g., Vercel, Netlify) for a Vite project.
- [ ] Configure environment variables in the deployment platform (Supabase keys, **NO** Gemini Key client-side).
- [ ] Test deployed application thoroughly.

**Story 7.5: Code Cleanup & Refactoring**

- [ ] Remove unused code/components (e.g., potentially `FinancialInsights.tsx` if `Optimized` version replaces it, check `statement_summary` usage).
- [ ] Refactor large components if necessary.
- [ ] Ensure consistent code style.
- [ ] Add comments where logic is complex.
- [ ] **CRITICAL:** Refactor all Gemini API calls (`processPdfWithGemini`, `generateSpendingInsights`) from client-side (`client.ts` and callers) to secure Supabase Edge Functions.
