import { neon } from "@netlify/neon";

// optional: simple "run once" migration
const migrateSQL = `
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'todo',
  created_at timestamptz NOT NULL DEFAULT now(),
  active_start timestamptz,
  elapsed_ms bigint NOT NULL DEFAULT 0,
  completed_at timestamptz,
  due_at timestamptz,
  tags text
);
`;

const sql = neon(process.env.NETLIFY_DATABASE_URL);

// keep a small in-memory flag to avoid running migrations every request
let didMigrate = false;
async function ensureMigrations() {
  if (didMigrate) return;
  await sql(migrateSQL);
  didMigrate = true;
}

export async function handler(event) {
  try {
    await ensureMigrations();

    // Simple router by method/path
    const { httpMethod, queryStringParameters, body, path } = event;

    // GET /.netlify/functions/db?route=projects
    if (httpMethod === "GET" && queryStringParameters?.route === "projects") {
      const rows = await sql/*sql*/`
        SELECT
          p.id,
          p.name,
          p.created_at,
          COUNT(t.id) AS task_count,
          COALESCE(SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END),0) AS done_count
        FROM projects p
        LEFT JOIN tasks t ON t.project_id = p.id
        GROUP BY p.id
        ORDER BY p.created_at DESC
      `;
      // add percent on the fly
      const data = rows.map(r => ({
        ...r,
        percent: r.task_count ? Math.round((Number(r.done_count) / Number(r.task_count)) * 100) : 0
      }));
      return ok(data);
    }

    // POST /.netlify/functions/db?route=create-project
    // body: { id, name }
    if (httpMethod === "POST" && queryStringParameters?.route === "create-project") {
      const { id, name } = JSON.parse(body || "{}");
      if (!id || !name) return bad("id and name required");
      await sql/*sql*/`INSERT INTO projects (id, name) VALUES (${id}, ${name})`;
      return ok({ ok: true });
    }

    // POST /.netlify/functions/db?route=add-task
    // body: { id, project_id, title, description, due_at, tags }
    if (httpMethod === "POST" && queryStringParameters?.route === "add-task") {
      const payload = JSON.parse(body || "{}");
      const { id, project_id, title, description = null, due_at = null, tags = null } = payload;
      if (!id || !project_id || !title) return bad("id, project_id, title required");
      await sql/*sql*/`
        INSERT INTO tasks (id, project_id, title, description, due_at, tags)
        VALUES (${id}, ${project_id}, ${title}, ${description}, ${due_at}, ${tags})
      `;
      return ok({ ok: true });
    }

    // PATCH /complete-task?id=...
    if (httpMethod === "PATCH" && queryStringParameters?.route === "complete-task") {
      const { id } = queryStringParameters;
      if (!id) return bad("id required");
      await sql/*sql*/`
        UPDATE tasks
        SET status='done', completed_at=now()
        WHERE id=${id}
      `;
      return ok({ ok: true });
    }

    // DELETE /delete-task?id=...
    if (httpMethod === "DELETE" && queryStringParameters?.route === "delete-task") {
      const { id } = queryStringParameters;
      if (!id) return bad("id required");
      await sql/*sql*/`DELETE FROM tasks WHERE id=${id}`;
      return ok({ ok: true });
    }

    return notFound();
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: String(err?.message || err) })
    };
  }
}

function ok(data) { return { statusCode: 200, body: JSON.stringify(data) }; }
function bad(msg) { return { statusCode: 400, body: JSON.stringify({ error: msg }) }; }
function notFound() { return { statusCode: 404, body: JSON.stringify({ error: "Not found" }) }; }
