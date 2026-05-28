  import { type Express, type Request, type Response, type NextFunction } from "express";
  import session from "express-session";
  import bcrypt from "bcryptjs";
  import connectPgSimple from "connect-pg-simple";
  import pg from "pg";

  const { Pool } = pg;
  const PgSession = connectPgSimple(session);

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  async function ensureAdminTable() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        rol VARCHAR(50) DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const adminEmail = process.env.ADMIN_EMAIL || "admin@carupa.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "carupa2025";
    const hash = await bcrypt.hash(adminPassword, 10);

    await pool.query(
      `
      INSERT INTO admin_users (email, password_hash, rol)
      VALUES ($1, $2, 'admin')
      ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
    `,
      [adminEmail, hash]
    );

    console.log(`Admin user synced: ${adminEmail}`);
  }

  export function setupAuth(app: Express) {
    ensureAdminTable().catch(console.error);

    // IMPORTANTE: trust proxy para sesiones en producción / Replit
    app.set("trust proxy", 1);

    const sessionStore = new PgSession({
      pool,
      tableName: "user_sessions",
      createTableIfMissing: true,
    });

    app.use(
      session({
        store: sessionStore,
        secret: process.env.SESSION_SECRET || "ona-xperience-secret-2025",
        resave: false,
        saveUninitialized: false,
        cookie: {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 1000 * 60 * 60 * 24 * 7,
        },
      })
    );

    app.post("/api/login.php", async (req: Request, res: Response) => {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Datos incompletos" });
      }

      try {
        const result = await pool.query(
          "SELECT * FROM admin_users WHERE email = $1",
          [email]
        );

        const user = result.rows[0];

        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
          return res.status(401).json({ error: "Credenciales inválidas" });
        }

        (req.session as any).user_id = user.id;
        (req.session as any).email = user.email;
        (req.session as any).rol = user.rol;

        res.json({
          success: true,
          user: { id: user.id, email: user.email, rol: user.rol },
        });
      } catch (error: any) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Error del servidor" });
      }
    });

    app.post("/api/logout.php", (req: Request, res: Response) => {
      req.session.destroy((err) => {
        if (err) console.error("Session destroy error:", err);
        res.json({ success: true });
      });
    });

    app.get("/api/check-session.php", (req: Request, res: Response) => {
      const session = req.session as any;

      res.json({
        logged_in: !!session.user_id,
        user: session.user_id
          ? { id: session.user_id, email: session.email, rol: session.rol }
          : null,
      });
    });
  }

  export function requireAdmin(req: Request, res: Response, next: NextFunction) {
    const session = req.session as any;

    if (!session?.user_id) {
      return res.status(401).json({ error: "No autorizado" });
    }

    next();
  }