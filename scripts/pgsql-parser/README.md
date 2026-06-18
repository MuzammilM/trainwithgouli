# TrainWithGouli PostgreSQL Migration Parser

A small CLI utility that uses [`pgsql-parser`](https://www.npmjs.com/package/pgsql-parser) to parse Supabase migration files and report syntax errors.

## Installation

From the repo root:

```bash
cd scripts/pgsql-parser
npm install
```

## Usage

```bash
node scripts/pgsql-parser/index.js supabase/migrations/0001_trainwithgouli_init.sql
```

The script exits with code `0` when the migration parses cleanly and `1` when errors are found.

## Example

```bash
$ node scripts/pgsql-parser/index.js supabase/migrations/0001_trainwithgouli_init.sql
Parsing supabase/migrations/0001_trainwithgouli_init.sql...

Success: 42 statement(s) parsed without errors.
```
