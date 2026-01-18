#!/usr/bin/env node
/**
 * Execute SQL queries against Supabase PostgreSQL
 * Usage: node scripts/sql.mjs "SELECT * FROM entities"
 *        node scripts/sql.mjs --file supabase/schema.sql
 */

import 'dotenv/config';
import pg from 'pg';
import { readFileSync } from 'fs';

const { Client } = pg;

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('Error: DATABASE_URL not set in .env');
  console.error('Find it in: Supabase Dashboard → Settings → Database → Connection string');
  process.exit(1);
}

async function executeSQL(sql) {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    const result = await client.query(sql);
    return result;
  } finally {
    await client.end();
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage:');
    console.log('  node scripts/sql.mjs "SELECT * FROM entities"');
    console.log('  node scripts/sql.mjs --file supabase/schema.sql');
    process.exit(0);
  }

  let sql;
  if (args[0] === '--file' && args[1]) {
    sql = readFileSync(args[1], 'utf-8');
  } else {
    sql = args.join(' ');
  }

  console.log('Executing SQL...\n');

  try {
    const result = await executeSQL(sql);

    if (Array.isArray(result)) {
      // Multiple statements
      result.forEach((r, i) => {
        console.log(`Statement ${i + 1}: ${r.command} (${r.rowCount} rows)`);
        if (r.rows?.length > 0) {
          console.table(r.rows);
        }
      });
    } else {
      console.log(`${result.command} (${result.rowCount} rows)`);
      if (result.rows?.length > 0) {
        console.table(result.rows);
      }
    }

    console.log('\nSuccess!');
  } catch (error) {
    console.error('SQL Error:', error.message);
    process.exit(1);
  }
}

main();
