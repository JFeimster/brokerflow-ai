// Test-only adapter: real PostgreSQL, through the same services and MCP handlers.
// Supabase GoTrue, PostgREST and deployed OAuth are tested separately on Preview.
const identifier = (value) => {
  if (!/^[a-z_]+$/.test(value)) throw new Error("Unsafe test SQL identifier");
  return value;
};
export function postgresAdapter(pool) {
  async function query(sql, values = []) {
    const client = await pool.connect();
    try {
      await client.query("set role service_role");
      return await client.query(sql, values);
    } finally {
      await client.query("reset role");
      client.release();
    }
  }
  return {
    async rpc(name, args) {
      const entries = Object.entries(args);
      try {
        const result = await query(
          `select public.${identifier(name)}(${entries.map(([k], i) => `${identifier(k)} => $${i + 1}`).join(",")}) as value`,
          entries.map(([, v]) =>
            typeof v === "object" && v !== null ? JSON.stringify(v) : v,
          ),
        );
        return { data: result.rows[0].value, error: null };
      } catch (error) {
        return { data: null, error };
      }
    },
    from(table) {
      let columns = "id";
      const filters = [];
      const builder = {
        select(value) {
          columns = value.split(",").map(identifier).join(",");
          return this;
        },
        eq(column, value) {
          filters.push([identifier(column), value]);
          return this;
        },
        async maybeSingle() {
          try {
            const result = await query(
              `select ${columns} from public.${identifier(table)} where ${filters.map(([c], i) => `${c}=$${i + 1}`).join(" and ")}`,
              filters.map(([, v]) => v),
            );
            if (result.rowCount > 1) throw new Error("Multiple rows");
            return { data: result.rows[0] || null, error: null };
          } catch (error) {
            return { data: null, error };
          }
        },
      };
      return builder;
    },
  };
}
