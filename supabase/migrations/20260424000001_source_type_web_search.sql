-- =============================================================================
-- Add 'web_search' to the source_type enum.
--
-- Used by the /api/hooks/discover flow, where Claude's web_search tool
-- surfaces candidate URLs for a topical query.
-- =============================================================================

alter type source_type add value if not exists 'web_search';
