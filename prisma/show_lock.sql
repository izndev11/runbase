SELECT pid, usename, state, query
FROM pg_stat_activity
WHERE pid IN (
  SELECT pid FROM pg_locks WHERE locktype = 'advisory' AND classid = 72707369
);
