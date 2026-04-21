# Supabase tests

Placeholder. Add pgTAP tests here as the schema matures.

Plan:
- `00_schema.test.sql` — required tables and columns exist
- `01_rls.test.sql` — user A cannot see user B's rows
- `02_onboarding.test.sql` — new-user trigger seeds categories, pain points, persona, insights
- `03_constraints.test.sql` — `post_categories` one-primary constraint holds
