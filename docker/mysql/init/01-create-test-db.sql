-- DevOps (D1/D3): creates a second, isolated schema for automated integration tests
-- (jest --selectProjects integration) so `RUN_DB_TESTS=1 npx jest ...` never wipes/reseeds
-- the same data an operator is browsing at http://localhost:5173 during manual testing.
-- Only runs once, the first time the mysql_data volume is initialized (MySQL entrypoint
-- convention: scripts in /docker-entrypoint-initdb.d run only on an empty data directory).
CREATE DATABASE IF NOT EXISTS erp_core_prototype_test;
GRANT ALL PRIVILEGES ON erp_core_prototype_test.* TO 'erp'@'%';
FLUSH PRIVILEGES;
