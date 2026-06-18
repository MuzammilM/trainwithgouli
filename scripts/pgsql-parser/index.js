#!/usr/bin/env node
/**
 * TrainWithGouli PostgreSQL Migration Parser
 *
 * Usage:
 *   node scripts/pgsql-parser/index.js supabase/migrations/0001_trainwithgouli_init.sql
 *
 * Exits with code 0 if the SQL parses cleanly, or 1 if parse errors are found.
 */

const fs = require('fs');
const path = require('path');
const { parse } = require('pgsql-parser');

function main() {
    const filePath = process.argv[2];

    if (!filePath) {
        console.error('Error: No migration file path provided.');
        console.error('Usage: node scripts/pgsql-parser/index.js <path-to-migration.sql>');
        process.exit(1);
    }

    const resolvedPath = path.resolve(filePath);

    if (!fs.existsSync(resolvedPath)) {
        console.error(`Error: File not found: ${resolvedPath}`);
        process.exit(1);
    }

    const sql = fs.readFileSync(resolvedPath, 'utf8');

    console.log(`Parsing ${path.relative(process.cwd(), resolvedPath)}...`);

    try {
        const result = parse(sql);
        const errors = result.filter(
            (stmt) => stmt.RawStmt && stmt.RawStmt.stmt && stmt.RawStmt.stmt.ErrorResponse
        );

        if (errors.length > 0) {
            console.error(`\nFound ${errors.length} parse error(s):`);
            errors.forEach((err, index) => {
                console.error(`  ${index + 1}.`, JSON.stringify(err, null, 2));
            });
            process.exit(1);
        }

        console.log(`\nSuccess: ${result.length} statement(s) parsed without errors.`);
        process.exit(0);
    } catch (error) {
        console.error('\nParse failed:');
        console.error(error.message);
        process.exit(1);
    }
}

main();
