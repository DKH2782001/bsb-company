-- =============================================================================
-- Employment contracts write policy
-- The base schema only created SELECT tenant policy for employment_contracts.
-- Contracts UI needs CEO / HR admin to insert and update these rows.
-- =============================================================================

drop policy if exists employment_contracts_write on public.employment_contracts;
create policy employment_contracts_write on public.employment_contracts
for all using (
  company_id = current_company_id()
  and has_any_role('ceo','hr_admin')
)
with check (
  company_id = current_company_id()
  and has_any_role('ceo','hr_admin')
);
