import { Client } from "@neondatabase/serverless";

function sanitizeDbUrl(raw) {
  if (!raw) return { present: false };
  try {
    const u = new URL(raw);
    const maskedUser = u.username ? `${u.username[0]}***` : "(none)";
    return {
      protocol: u.protocol.replace(/:$/, ""),
      host: u.hostname || "(none)",
      port: u.port || "(default)",
      database: u.pathname.replace(/^\/+/, "") || "(none)",
      username: maskedUser,
      hasQueryParams: [...u.searchParams.keys()].length > 0,
    };
  } catch (error) {
    return { present: true, parseError: error?.message ?? String(error) };
  }
}

function printJson(value) {
  console.log(JSON.stringify(value, null, 2));
}

function summarizeSqlError(label, queryText, error) {
  printJson({
    label,
    error: true,
    message: error?.message ?? String(error),
    code: error?.code ?? null,
    severity: error?.severity ?? null,
    detail: error?.detail ?? null,
    hint: error?.hint ?? null,
    position: error?.position ?? null,
    where: error?.where ?? null,
    schema: error?.schema ?? null,
    table: error?.table ?? null,
    column: error?.column ?? null,
    routine: error?.routine ?? null,
    failed_query: error?.query ?? queryText,
  });
}

const dbUrl = process.env.DATABASE_URL;
printJson({ DATABASE_URL: sanitizeDbUrl(dbUrl) });

if (!dbUrl) {
  printJson({ stage: "env", error: true, message: "DATABASE_URL is not set" });
  process.exit(1);
}

const client = new Client({ connectionString: dbUrl });

async function execQuery(label, queryText) {
  console.log(`\n## ${label}`);
  try {
    const result = await client.query(queryText);
    printJson({ rowCount: result.rowCount, rows: result.rows });
    return result.rows;
  } catch (error) {
    summarizeSqlError(label, queryText, error);
    return null;
  }
}

try {
  await client.connect();

  await execQuery(
    "public.projects columns",
    `select column_name as name, data_type as type, is_nullable as nullable, column_default as default
     from information_schema.columns
     where table_schema = 'public' and table_name = 'projects'
     order by ordinal_position`
  );

  const migrationTables = await execQuery(
    "drizzle migration tables",
    `select table_schema, table_name
     from information_schema.tables
     where (table_schema = 'drizzle' and table_name = '__drizzle_migrations')
        or (table_schema = 'public' and table_name = '__drizzle_migrations')
     order by table_schema, table_name`
  );

  if (Array.isArray(migrationTables) && migrationTables.length > 0) {
    for (const table of migrationTables) {
      const schemaName = String(table.table_schema).replace(/'/g, "''");
      const tableName = String(table.table_name).replace(/'/g, "''");
      const columns = await execQuery(
        `columns for ${table.table_schema}.${table.table_name}`,
        `select column_name
         from information_schema.columns
         where table_schema = '${schemaName}' and table_name = '${tableName}'
         order by ordinal_position`
      );
      const columnNames = Array.isArray(columns) ? columns.map((x) => x.column_name) : [];
      const orderBy = [];
      if (columnNames.includes("created_at")) orderBy.push(`"created_at" desc nulls last`);
      if (columnNames.includes("id")) orderBy.push(`"id" desc nulls last`);
      const migrationQuery = `select * from "${table.table_schema}"."${table.table_name}"${orderBy.length ? ` order by ${orderBy.join(", ")}` : ""}`;
      await execQuery(`applied migrations from ${table.table_schema}.${table.table_name}`, migrationQuery);
    }
  } else {
    printJson({ migration_tables_found: 0 });
  }

  await execQuery(
    "listProjects/home equivalent",
    `select id, name, slug, description, translation_memory, quality_checks, context_detection, length_control, inclusive_language, formality, tone_of_voice, brand_name, brand_voice, emotive_intent, idioms, terminology, domain_expertise, created_at, updated_at
     from public.projects
     order by created_at desc
     limit 5`
  );
} catch (error) {
  printJson({
    stage: "connection_or_setup",
    error: true,
    message: error?.message ?? String(error),
    code: error?.code ?? null,
  });
  process.exitCode = 1;
} finally {
  try {
    await client.end();
  } catch {}
}