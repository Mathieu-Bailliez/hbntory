#!/bin/sh
set -e
psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" <<EOSQL
CREATE ROLE mcp_readonly LOGIN PASSWORD '$MCP_DB_PASSWORD';
GRANT SELECT ON branches, stock TO mcp_readonly;
EOSQL
