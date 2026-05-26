import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBookingSchema } from "../shared/schema";
import path from "path";
import fs from "fs";
import multer from "multer";
import pg from "pg";
import { spawn } from "child_process";
import sharp from "sharp";

async function transcodeToH264(inputPath: string, explicitOutputPath?: string): Promise<string> {
  const dir = path.dirname(inputPath);
  const base = path.basename(inputPath, path.extname(inputPath));
  const outputPath = explicitOutputPath || path.join(dir, `${base}.mp4`);

  return new Promise((resolve, reject) => {
    const args = [
      "-i", inputPath,
      "-c:v", "libx264",
      "-crf", "23",
      "-preset", "fast",
      "-c:a", "aac",
      "-movflags", "+faststart",
      "-y",
      outputPath
    ];
    const proc = spawn("ffmpeg", args);
    proc.on("close", (code) => {
      if (code === 0) {
        if (inputPath !== outputPath && fs.existsSync(inputPath)) {
          fs.unlinkSync(inputPath);
        }
        resolve(outputPath);
      } else {
        reject(new Error(`ffmpeg exited with code ${code}`));
      }
    });
    proc.on("error", reject);
  });
}

async function convertImageToJpeg(inputPath: string): Promise<string> {
  const ext = path.extname(inputPath).toLowerCase();
  const dir = path.dirname(inputPath);
  const base = path.basename(inputPath, ext);
  const outputPath = path.join(dir, `${base}.jpg`);

  await sharp(inputPath)
    .rotate()
    .jpeg({ quality: 85, progressive: true })
    .toFile(outputPath);

  if (inputPath !== outputPath && fs.existsSync(inputPath)) {
    fs.unlinkSync(inputPath);
  }

  return outputPath;
}

const { Pool } = pg;

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const uploadStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `comprobante-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({ 
  storage: uploadStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes'));
    }
  }
});

async function ensurePostgresSchema() {
  try {
    // Ensure the reservas table exists with all required columns
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reservas (
        id SERIAL PRIMARY KEY,
        plan VARCHAR(255),
        camping VARCHAR(100),
        unidad VARCHAR(100),
        fecha_inicio VARCHAR(50),
        fecha_fin VARCHAR(50),
        adicionales TEXT,
        total INTEGER DEFAULT 0,
        abono INTEGER DEFAULT 0,
        saldo INTEGER DEFAULT 0,
        nombre VARCHAR(255),
        telefono VARCHAR(50),
        email VARCHAR(255),
        estado INTEGER DEFAULT 1,
        referencia VARCHAR(50) UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        comprobante TEXT
      )
    `);
    console.log("PostgreSQL schema verified");
  } catch (error) {
    console.error("Error ensuring PostgreSQL schema:", error);
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await ensurePostgresSchema();

  app.get("/api/listar-reservas.php", async (req, res) => {
    try {
      const result = await pool.query("SELECT * FROM reservas ORDER BY created_at DESC");
      res.json(result.rows);
    } catch (error: any) {
      console.error("Database Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/get-ocupacion.php", async (req, res) => {
    try {
      const unidades = req.query.unidades as string | undefined;
      let query = "SELECT fecha_inicio, fecha_fin, unidad FROM reservas WHERE estado != 3";
      let params: any[] = [];
      if (unidades) {
        const names = unidades.split(',').map((n: string) => n.trim()).filter(Boolean);
        if (names.length > 0) {
          query += ` AND unidad = ANY($1)`;
          params = [names];
        }
      }
      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (error: any) {
      console.error("Database Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/cancelar-reserva.php", async (req, res) => {
    const { referencia } = req.body;
    if (!referencia) return res.status(400).json({ success: false, error: "Referencia no proporcionada" });

    try {
      // Si es un bloqueo admin (referencia empieza por BLOCK-), lo eliminamos físicamente de la DB
      if (referencia.startsWith('BLOCK-')) {
        const trimmedReferencia = referencia.trim();
        console.log("Intentando eliminar bloqueo físico:", `'${trimmedReferencia}'`);
        
        // Primero verificamos si existe
        const existingResult = await pool.query("SELECT * FROM reservas WHERE TRIM(referencia) ILIKE $1", [trimmedReferencia]);
        
        if (existingResult.rows.length === 0) {
          // Intentar buscar por coincidencia parcial
          console.warn("No se encontró por referencia, buscando coincidencias parciales...");
          const possibleResult = await pool.query("SELECT * FROM reservas WHERE referencia ILIKE $1", [`%${trimmedReferencia}%`]);
          if (possibleResult.rows.length > 0) {
            console.log("Encontrada coincidencia parcial:", possibleResult.rows[0].referencia);
            await pool.query("DELETE FROM reservas WHERE id = $1", [possibleResult.rows[0].id]);
            return res.json({ success: true, note: "Eliminado por coincidencia parcial" });
          }
          
          console.warn("Bloqueo no encontrado en DB:", `'${trimmedReferencia}'`);
          return res.status(404).json({ success: false, error: "Bloqueo no encontrado" });
        }

        const result = await pool.query("DELETE FROM reservas WHERE id = $1", [existingResult.rows[0].id]);
        
        if (result.rowCount === 0) {
          return res.status(404).json({ success: false, error: "Error al eliminar" });
        }
        return res.json({ success: true });
      } else {
        // Si es reserva normal, la cancelamos (estado 3)
        const result = await pool.query("UPDATE reservas SET estado = 3 WHERE referencia = $1", [referencia]);
        if (result.rowCount === 0) {
          return res.status(404).json({ success: false, error: "Reserva no encontrada" });
        }
        return res.json({ success: true });
      }
    } catch (error: any) {
      console.error("Delete Error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/marcar-saldo-pagado.php", async (req, res) => {
    const { referencia } = req.body;
    try {
      await pool.query("UPDATE reservas SET estado = 2, saldo = 0 WHERE referencia = $1", [referencia]);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/marcar-completada.php", async (req, res) => {
    const { referencia } = req.body;
    try {
      await pool.query("UPDATE reservas SET estado = 4 WHERE referencia = $1", [referencia]);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/actualizar-reserva.php", async (req, res) => {
    const { referencia, fecha_inicio, fecha_fin, unidad, nombre, email, telefono, plan, total, abono, estado } = req.body;
    if (!referencia) return res.status(400).json({ success: false, error: "Faltan datos" });

    try {
      const camping = unidad ? unidad.split(' ')[0] : null;
      const saldo = (total !== undefined && abono !== undefined) ? Math.max(0, total - abono) : undefined;
      
      const updates: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (fecha_inicio) { updates.push(`fecha_inicio = $${paramIndex++}`); params.push(fecha_inicio.length === 10 ? fecha_inicio + "T12:00:00" : fecha_inicio); }
      if (fecha_fin) { updates.push(`fecha_fin = $${paramIndex++}`); params.push(fecha_fin.length === 10 ? fecha_fin + "T12:00:00" : fecha_fin); }
      if (unidad) { updates.push(`unidad = $${paramIndex++}`); params.push(unidad); }
      if (camping) { updates.push(`camping = $${paramIndex++}`); params.push(camping); }
      if (nombre) { updates.push(`nombre = $${paramIndex++}`); params.push(nombre); }
      if (email) { updates.push(`email = $${paramIndex++}`); params.push(email); }
      if (telefono) { updates.push(`telefono = $${paramIndex++}`); params.push(telefono); }
      if (plan) { updates.push(`plan = $${paramIndex++}`); params.push(plan); }
      if (total !== undefined) { updates.push(`total = $${paramIndex++}`); params.push(total); }
      if (abono !== undefined) { updates.push(`abono = $${paramIndex++}`); params.push(abono); }
      if (saldo !== undefined) { updates.push(`saldo = $${paramIndex++}`); params.push(saldo); }
      if (estado !== undefined) { updates.push(`estado = $${paramIndex++}`); params.push(estado); }

      const query = `UPDATE reservas SET ${updates.join(", ")} WHERE referencia = $${paramIndex}`;
      params.push(referencia);

      await pool.query(query, params);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/bulk-actions.php", async (req, res) => {
    const { action, referencias } = req.body;
    if (!referencias || !Array.isArray(referencias)) return res.status(400).json({ success: false, error: "Datos invalidos" });

    try {
      const placeholders = referencias.map((_, i) => `$${i + 1}`).join(',');
      
      if (action === 'delete') {
        await pool.query(`DELETE FROM reservas WHERE referencia IN (${placeholders})`, referencias);
      } else if (action === 'hide') {
        await pool.query(`UPDATE reservas SET estado = 5 WHERE referencia IN (${placeholders})`, referencias);
      }

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/crear-reserva-manual.php", async (req, res) => {
    const { nombre, email, telefono, unidad, fecha_inicio, fecha_fin, plan, total, abono, estado } = req.body;
    
    try {
      // Check if the specific unit is already taken for these dates
      // Normalize dates to YYYY-MM-DD for stable comparison
      const startOnly = fecha_inicio.substring(0, 10);
      const endOnly = fecha_fin.substring(0, 10);

      const existingBooking = await pool.query(
        `SELECT id FROM reservas 
         WHERE unidad = $1 AND estado != 3 
         AND SUBSTRING(fecha_inicio, 1, 10) < $2 
         AND SUBSTRING(fecha_fin, 1, 10) > $3`,
        [unidad, endOnly, startOnly]
      );

      if (existingBooking.rows.length > 0) {
        return res.status(400).json({ 
          success: false, 
          error: "Esta unidad ya se encuentra reservada para las fechas seleccionadas." 
        });
      }

      const camping = unidad.split(' ')[0];
      const referencia = `MAN-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      const saldo = Math.max(0, total - abono);
      
      // Ajustar a zona horaria de Bogotá (UTC-5)
      const bogotaTime = new Date(new Date().getTime() - (5 * 60 * 60 * 1000));
      const createdAt = bogotaTime.toISOString().replace('T', ' ').substr(0, 19);
      
      const fechaInicioNorm = fecha_inicio.length === 10 ? fecha_inicio + "T12:00:00" : fecha_inicio;
      const fechaFinNorm = fecha_fin.length === 10 ? fecha_fin + "T12:00:00" : fecha_fin;

      await pool.query(
        `INSERT INTO reservas (
          plan, camping, unidad, fecha_inicio, fecha_fin, total, abono, saldo, nombre, telefono, email, estado, referencia, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [
          plan,
          camping,
          unidad,
          fechaInicioNorm,
          fechaFinNorm,
          total,
          abono,
          saldo,
          nombre,
          telefono,
          email,
          estado || 2, 
          referencia,
          createdAt
        ]
      );

      res.json({ success: true, referencia });
    } catch (error: any) {
      console.error("Manual Reservation Error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Customer reservation endpoint with plan block and unit availability validation
  app.post("/api/crear-reserva.php", async (req, res) => {
    const { plan, camping, unidad, fecha_inicio, fecha_fin, adicionales, total, nombre, telefono, email } = req.body;
    
    if (!plan || !camping || !unidad || !fecha_inicio || !fecha_fin || !nombre || !telefono || !email) {
      return res.status(400).json({ success: false, error: "Datos incompletos" });
    }

    try {
      // Check if the specific unit is already taken for these dates
      const startOnly = fecha_inicio.substring(0, 10);
      const endOnly = fecha_fin.substring(0, 10);

      const existingBooking = await pool.query(
        `SELECT id FROM reservas 
         WHERE unidad = $1 AND estado != 3 
         AND SUBSTRING(fecha_inicio, 1, 10) < $2 
         AND SUBSTRING(fecha_fin, 1, 10) > $3`,
        [unidad, endOnly, startOnly]
      );

      if (existingBooking.rows.length > 0) {
        return res.status(400).json({ 
          success: false, 
          error: "Esta unidad ya se encuentra reservada o bloqueada para las fechas seleccionadas." 
        });
      }

      // Check for unit blocks (compare against reservation dates, not current time)
      const ubFile = path.join(process.cwd(), "server", "api", "unit-blocks.json");
      if (fs.existsSync(ubFile)) {
        try {
          const ub = JSON.parse(fs.readFileSync(ubFile, "utf-8"));
          const bookingStart = new Date(fecha_inicio.includes('T') ? fecha_inicio : fecha_inicio + 'T12:00:00');
          const bookingEnd = new Date(fecha_fin.includes('T') ? fecha_fin : fecha_fin + 'T12:00:00');
          const isUnitDisabled = ub.some((block: any) => {
            if (block.unitName !== unidad) return false;
            if (!block.fechaInicio && !block.fechaFin) return true;
            const blockStart = block.fechaInicio ? new Date(block.fechaInicio) : new Date(0);
            const blockEnd = block.fechaFin ? new Date(block.fechaFin) : new Date(9999, 11, 31);
            return bookingStart <= blockEnd && bookingEnd >= blockStart;
          });
          if (isUnitDisabled) {
            return res.status(400).json({ success: false, error: "Esta unidad se encuentra inhabilitada para las fechas seleccionadas." });
          }
        } catch {}
      }

      // Check for plan blocks
      const planBlocksFile = path.join(process.cwd(), "server", "api", "plan-blocks.json");
      let planBlocks: any[] = [];
      if (fs.existsSync(planBlocksFile)) {
        try {
          planBlocks = JSON.parse(fs.readFileSync(planBlocksFile, "utf-8"));
        } catch {
          planBlocks = [];
        }
      }

      // Map camping name to typeId
      const campingTypeMap: Record<string, number> = {
        "Aura VIP": 1, "Aura": 1,
        "Árbol": 2,
        "Nido": 3
      };
      const typeId = campingTypeMap[camping] || 0;

      // Get planId from dynamic plans
      const plansFile = path.join(process.cwd(), "server", "api", "plans.json");
      let dynamicPlans: any[] = [];
      try {
        dynamicPlans = JSON.parse(fs.readFileSync(plansFile, "utf-8"));
      } catch {
        dynamicPlans = [];
      }
      const matchedPlan = dynamicPlans.find((p: any) => p.nombre === plan);
      const planId = matchedPlan?.id || "";

      // Check if this plan+camping+date is blocked
      if (planId && typeId) {
        const bookingStart = new Date(fecha_inicio + 'T12:00:00');
        const bookingEnd = new Date(fecha_fin + 'T12:00:00');
        
        const isBlocked = planBlocks.some((block: any) => {
          if (block.planId !== planId) return false;
          if (!block.campingIds.includes(typeId)) return false;
          
          const blockStart = new Date(block.fechaInicio + 'T12:00:00');
          const blockEnd = new Date(block.fechaFin + 'T12:00:00');
          
          return bookingStart <= blockEnd && bookingEnd >= blockStart;
        });

        if (isBlocked) {
          return res.status(400).json({ 
            success: false, 
            error: "Este plan no está disponible para el camping y fechas seleccionadas" 
          });
        }
      }

      const referencia = `CAR-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      const abono = Math.round(total * 0.5);
      const saldo = total - abono;
      
      // Ajustar a zona horaria de Bogotá (UTC-5)
      const bogotaTime = new Date(new Date().getTime() - (5 * 60 * 60 * 1000));
      const createdAt = bogotaTime.toISOString().replace('T', ' ').substr(0, 19);
      
      const fechaInicioNorm = fecha_inicio.length === 10 ? fecha_inicio + "T12:00:00" : fecha_inicio;
      const fechaFinNorm = fecha_fin.length === 10 ? fecha_fin + "T12:00:00" : fecha_fin;

      await pool.query(
        `INSERT INTO reservas (
          plan, camping, unidad, fecha_inicio, fecha_fin, total, abono, saldo, nombre, telefono, email, estado, referencia, adicionales, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        [
          plan,
          camping,
          unidad,
          fechaInicioNorm,
          fechaFinNorm,
          total,
          abono,
          saldo,
          nombre,
          telefono,
          email,
          1, // PENDIENTE
          referencia,
          adicionales ? JSON.stringify(adicionales) : null,
          createdAt
        ]
      );

      res.json({ success: true, referencia });
    } catch (error: any) {
      console.error("Reservation Error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });


  app.post("/api/bloquear-fecha", async (req, res) => {
    const { unidad, fecha_inicio, fecha_fin } = req.body;

    if (!unidad || !fecha_inicio || !fecha_fin) {
      return res.json({ success: false, error: "Datos incompletos" });
    }

    try {
      const unidades = [];
      if (unidad === 'all' || unidad === 'Todas las unidades') {
        unidades.push("Aura 1", "Aura 2", "Aura 3", "Aura 4", "Árbol 1", "Nido 1");
      } else {
        // Normalizar nombre de unidad si viene solo el nombre del camping
        let normalizedUnidad = unidad;
        if (unidad === "Aura") normalizedUnidad = "Aura 1";
        if (unidad === "Árbol") normalizedUnidad = "Árbol 1";
        if (unidad === "Nido") normalizedUnidad = "Nido 1";
        unidades.push(normalizedUnidad);
      }

      for (const u of unidades) {
        const camping = u.split(' ')[0];
        const referencia = `BLOCK-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        
        // Asegurar que las fechas se guarden con el sufijo T12:00:00 si no lo tienen
        const start = fecha_inicio.includes('T') ? fecha_inicio : `${fecha_inicio}T12:00:00`;
        const end = fecha_fin.includes('T') ? fecha_fin : `${fecha_fin}T12:00:00`;

        // Ajustar a zona horaria de Bogotá (UTC-5)
        const bogotaTime = new Date(new Date().getTime() - (5 * 60 * 60 * 1000));
        const createdAt = bogotaTime.toISOString().replace('T', ' ').substr(0, 19);

        await pool.query(
          `INSERT INTO reservas (
            plan, camping, unidad, fecha_inicio, fecha_fin, total, abono, saldo, nombre, telefono, email, estado, referencia, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
          [
            'BLOQUEO ADMIN',
            camping,
            u,
            start,
            end,
            0, 0, 0,
            'ADMINISTRADOR',
            '0000000000',
            'admin@onaxperience.com',
            2, // CONFIRMADO
            referencia,
            createdAt
          ]
        );
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error("Database Error:", error);
      res.json({ success: false, error: error.message });
    }
  });

  app.post("/api/bookings", async (req, res) => {
    try {
      const parsed = insertBookingSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid booking data" });
      }
      const booking = await storage.createBooking(parsed.data);
      res.json(booking);
    } catch (error) {
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  app.post("/api/confirmar-pago", upload.single("receipt"), async (req, res) => {
    try {
      const { referencia, total } = req.body;
      const file = req.file;

      if (!referencia) {
        return res.status(400).json({ success: false, error: "Referencia no proporcionada" });
      }

      if (!file) {
        return res.status(400).json({ success: false, error: "Comprobante no subido" });
      }

      const totalAmount = parseFloat(total) || 0;
      if (totalAmount < 0) {
        return res.status(400).json({ success: false, error: "Monto inválido" });
      }

      const existingReserva = await pool.query("SELECT id, estado FROM reservas WHERE referencia = $1", [referencia]);
      if (existingReserva.rows.length === 0) {
        if (file) {
          fs.unlinkSync(path.join(process.cwd(), "public", "uploads", file.filename));
        }
        return res.status(404).json({ success: false, error: "Reserva no encontrada" });
      }

      if (existingReserva.rows[0].estado === 3 || existingReserva.rows[0].estado === 4) {
        if (file) {
          fs.unlinkSync(path.join(process.cwd(), "public", "uploads", file.filename));
        }
        return res.status(400).json({ success: false, error: "Esta reserva ya está cancelada o completada" });
      }

      const receiptPath = `/uploads/${file.filename}`;
      const result = await pool.query(
        `UPDATE reservas SET estado = 2, abono = $1, saldo = total - $2, comprobante = $3 WHERE referencia = $4`,
        [totalAmount, totalAmount, receiptPath, referencia]
      );
      
      if (result.rowCount === 0) {
        return res.status(404).json({ success: false, error: "No se pudo actualizar la reserva" });
      }

      res.json({ success: true, message: "Pago confirmado correctamente", receiptPath });
    } catch (error: any) {
      console.error("Error confirming payment:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.use("/uploads", (req, res, next) => {
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    require("express").static(uploadsDir)(req, res, next);
  });

  // ============ Plan Blocks API ============
  const planBlocksFile = path.join(process.cwd(), "server", "api", "plan-blocks.json");

  const ensurePlanBlocksFile = () => {
    if (!fs.existsSync(planBlocksFile)) {
      fs.writeFileSync(planBlocksFile, JSON.stringify([], null, 2));
    }
  };

  const readPlanBlocks = (): any[] => {
    ensurePlanBlocksFile();
    try {
      return JSON.parse(fs.readFileSync(planBlocksFile, "utf-8"));
    } catch {
      return [];
    }
  };

  const writePlanBlocks = (blocks: any[]) => {
    fs.writeFileSync(planBlocksFile, JSON.stringify(blocks, null, 2));
  };

  app.get("/api/plan-blocks", (req, res) => {
    try {
      const blocks = readPlanBlocks();
      res.json(blocks);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/plan-blocks", (req, res) => {
    try {
      const { planId, campingIds, fechaInicio, fechaFin } = req.body;

      if (!planId || !campingIds || !fechaInicio || !fechaFin) {
        return res.status(400).json({ success: false, error: "Datos incompletos" });
      }

      // Normalizar fechas para consistencia
      const normalizedStart = fechaInicio.includes('T') ? fechaInicio : `${fechaInicio}T12:00:00`;
      const normalizedEnd = fechaFin.includes('T') ? fechaFin : `${fechaFin}T12:00:00`;

      if (!Array.isArray(campingIds) || campingIds.length === 0) {
        return res.status(400).json({ success: false, error: "Debe seleccionar al menos un camping" });
      }

      const startDate = new Date(normalizedStart);
      const endDate = new Date(normalizedEnd);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (startDate < today) {
        return res.status(400).json({ success: false, error: "No se permiten fechas pasadas" });
      }

      if (endDate < startDate) {
        return res.status(400).json({ success: false, error: "La fecha fin no puede ser menor que la fecha inicio" });
      }

      const blocks = readPlanBlocks();

      // Check for duplicate
      const isDuplicate = blocks.some((block: any) => 
        block.planId === planId &&
        JSON.stringify(block.campingIds.sort()) === JSON.stringify(campingIds.sort()) &&
        block.fechaInicio === normalizedStart &&
        block.fechaFin === normalizedEnd
      );

      if (isDuplicate) {
        return res.status(400).json({ success: false, error: "Ya existe un bloqueo idéntico" });
      }

      const newBlock = {
        id: Date.now().toString(),
        planId,
        campingIds,
        fechaInicio: normalizedStart,
        fechaFin: normalizedEnd,
        createdAt: new Date().toISOString()
      };

      blocks.push(newBlock);
      writePlanBlocks(blocks);

      res.json({ success: true, block: newBlock });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.delete("/api/plan-blocks/:id", (req, res) => {
    try {
      const { id } = req.params;
      let blocks = readPlanBlocks();
      const initialLength = blocks.length;
      
      blocks = blocks.filter((block: any) => block.id !== id);

      if (blocks.length === initialLength) {
        return res.status(404).json({ success: false, error: "Bloqueo no encontrado" });
      }

      writePlanBlocks(blocks);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ============ Unit Blocks API ============
  const unitBlocksFile = path.join(process.cwd(), "server", "api", "unit-blocks.json");

  const readUnitBlocks = (): any[] => {
    try {
      if (!fs.existsSync(unitBlocksFile)) {
        fs.writeFileSync(unitBlocksFile, JSON.stringify([], null, 2));
      }
      return JSON.parse(fs.readFileSync(unitBlocksFile, "utf-8"));
    } catch {
      return [];
    }
  };

  const writeUnitBlocks = (blocks: any[]) => {
    fs.writeFileSync(unitBlocksFile, JSON.stringify(blocks, null, 2));
  };

  app.get("/api/unit-blocks", (req, res) => {
    try {
      const blocks = readUnitBlocks();
      res.json(blocks);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/unit-blocks", (req, res) => {
    try {
      const { unitName, motivo, fechaInicio, fechaFin } = req.body;

      if (!unitName) {
        return res.status(400).json({ success: false, error: "Falta la unidad" });
      }

      const normalizedStart = fechaInicio ? (fechaInicio.length === 10 ? fechaInicio + "T12:00:00" : fechaInicio) : null;
      const normalizedEnd = fechaFin ? (fechaFin.length === 10 ? fechaFin + "T12:00:00" : fechaFin) : null;

      if (normalizedStart && normalizedEnd && new Date(normalizedStart) > new Date(normalizedEnd)) {
        return res.status(400).json({ success: false, error: "La fecha de inicio debe ser anterior a la fecha de fin" });
      }

      const blocks = readUnitBlocks();

      const isDuplicate = blocks.some((b: any) =>
        b.unitName === unitName &&
        b.fechaInicio === normalizedStart &&
        b.fechaFin === normalizedEnd
      );

      if (isDuplicate) {
        return res.status(400).json({ success: false, error: "Ya existe un bloqueo igual" });
      }

      const bogotaTime = new Date(new Date().getTime() - (5 * 60 * 60 * 1000));
      const newBlock = {
        id: `ub-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        unitName,
        motivo: motivo || "Inhabilitada",
        fechaInicio: normalizedStart,
        fechaFin: normalizedEnd,
        createdAt: bogotaTime.toISOString()
      };

      blocks.push(newBlock);
      writeUnitBlocks(blocks);

      res.json({ success: true, block: newBlock });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.delete("/api/unit-blocks/:id", (req, res) => {
    try {
      const { id } = req.params;
      let blocks = readUnitBlocks();
      const initialLength = blocks.length;
      blocks = blocks.filter((b: any) => b.id !== id);

      if (blocks.length === initialLength) {
        return res.status(404).json({ success: false, error: "Bloqueo no encontrado" });
      }

      writeUnitBlocks(blocks);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ============ Banners API ============
  const bannersFile = path.join(process.cwd(), "server", "api", "banners.json");

  const readBanners = (): any[] => {
    try {
      if (!fs.existsSync(bannersFile)) fs.writeFileSync(bannersFile, JSON.stringify([], null, 2));
      return JSON.parse(fs.readFileSync(bannersFile, "utf-8"));
    } catch { return []; }
  };

  const writeBanners = (banners: any[]) => {
    fs.writeFileSync(bannersFile, JSON.stringify(banners, null, 2));
  };

  const bannerUploadStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(process.cwd(), "public", "images", "banners");
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `banner-${Date.now()}${ext}`);
    }
  });

  const uploadBannerImage = multer({
    storage: bannerUploadStorage,
    limits: { fileSize: 100 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) cb(null, true);
      else cb(new Error("Solo se permiten imágenes o videos"));
    }
  });

  app.get("/api/banners", (req, res) => {
    try { res.json(readBanners()); } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/banners/active", (req, res) => {
    try { res.json(readBanners().filter((b: any) => b.activo)); } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/banners/upload-image", uploadBannerImage.single("image"), async (req: any, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: "No se recibió archivo" });
      if (req.file.mimetype.startsWith("video/")) {
        const inputPath = req.file.path;
        const outputFilename = req.file.filename.replace(/\.[^.]+$/, "") + "_h264.mp4";
        const outputPath = path.join(path.dirname(inputPath), outputFilename);
        await transcodeToH264(inputPath, outputPath);
        fs.unlinkSync(inputPath);
        res.json({ url: `/images/banners/${outputFilename}`, type: "video" });
      } else {
        const ext = path.extname(req.file.filename).toLowerCase();
        let filename = req.file.filename;
        if (ext !== ".jpg" && ext !== ".jpeg") {
          const outputPath = await convertImageToJpeg(req.file.path);
          filename = path.basename(outputPath);
        }
        res.json({ url: `/images/banners/${filename}`, type: "image" });
      }
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/banners", (req, res) => {
    try {
      const { titulo, texto, imagen, pasos, bgColor, textColor, activo } = req.body;
      if (!titulo && !texto) {
        return res.status(400).json({ error: "El banner necesita al menos un título o mensaje" });
      }
      const banners = readBanners();
      const newBanner = {
        id: `banner-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        titulo: titulo || "",
        texto: texto || "",
        imagen: imagen || "",
        pasos: Array.isArray(pasos) ? pasos : (pasos ? [pasos] : ["plan"]),
        bgColor: bgColor || "#FEF3C7",
        textColor: textColor || "#92400E",
        activo: activo !== false,
        createdAt: new Date().toISOString()
      };
      banners.push(newBanner);
      writeBanners(banners);
      res.json({ success: true, banner: newBanner });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.put("/api/banners/:id", (req, res) => {
    try {
      const { id } = req.params;
      const banners = readBanners();
      const idx = banners.findIndex((b: any) => b.id === id);
      if (idx === -1) return res.status(404).json({ error: "Banner no encontrado" });
      banners[idx] = { ...banners[idx], ...req.body, id };
      writeBanners(banners);
      res.json({ success: true, banner: banners[idx] });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.patch("/api/banners/:id/toggle", (req, res) => {
    try {
      const { id } = req.params;
      const banners = readBanners();
      const idx = banners.findIndex((b: any) => b.id === id);
      if (idx === -1) return res.status(404).json({ error: "Banner no encontrado" });
      banners[idx].activo = !banners[idx].activo;
      writeBanners(banners);
      res.json({ success: true, banner: banners[idx] });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.delete("/api/banners/:id", (req, res) => {
    try {
      const { id } = req.params;
      let banners = readBanners();
      const initial = banners.length;
      banners = banners.filter((b: any) => b.id !== id);
      if (banners.length === initial) return res.status(404).json({ error: "Banner no encontrado" });
      writeBanners(banners);
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ============ Dynamic Plans API ============
  const plansFile = path.join(process.cwd(), "server", "api", "plans.json");

  const readPlans = (): any[] => {
    try {
      if (!fs.existsSync(plansFile)) {
        return [];
      }
      return JSON.parse(fs.readFileSync(plansFile, "utf-8"));
    } catch {
      return [];
    }
  };

  const writePlans = (plans: any[]) => {
    fs.writeFileSync(plansFile, JSON.stringify(plans, null, 2));
  };

  app.get("/api/plans", (req, res) => {
    try {
      const plans = readPlans();
      res.json(plans);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/plans/active", (req, res) => {
    try {
      const plans = readPlans();
      const today = new Date();
      today.setHours(12, 0, 0, 0); // Establecer a mediodía para evitar problemas de zona horaria
      
      const activePlans = plans.filter((plan: any) => {
        if (!plan.estado) return false;
        
        if (plan.tipo === "temporada" && plan.fechaInicio && plan.fechaFin) {
          const start = new Date(plan.fechaInicio + 'T12:00:00');
          const end = new Date(plan.fechaFin + 'T12:00:00');
          if (today < start || today > end) return false;
        }
        
        return true;
      });
      
      res.json(activePlans);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/plans", (req, res) => {
    try {
      const { nombre, eslogan, descripcion, tipo, icono, color, precios, precio, campingIds, incluye, fechaInicio, fechaFin, preventa, desactivarOtros } = req.body;

      if (!nombre || !eslogan || !tipo) {
        return res.status(400).json({ success: false, error: "Datos incompletos" });
      }

      if (tipo === "temporada") {
        if (!fechaInicio || !fechaFin) {
          return res.status(400).json({ success: false, error: "Los planes de temporada requieren fechas de inicio y fin" });
        }
        
        // Asegurar formato T12:00:00 para consistencia
        const normalizedStart = fechaInicio.includes('T') ? fechaInicio : `${fechaInicio}T12:00:00`;
        const normalizedEnd = fechaFin.includes('T') ? fechaFin : `${fechaFin}T12:00:00`;

        const start = new Date(normalizedStart);
        const end = new Date(normalizedEnd);
        const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays > 62) {
          return res.status(400).json({ success: false, error: "Los planes de temporada no pueden durar más de 2 meses" });
        }
        
        if (end < start) {
          return res.status(400).json({ success: false, error: "La fecha fin no puede ser anterior a la fecha inicio" });
        }
      }

      const plans = readPlans();
      
      const newId = nombre.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_|_$/g, "");

      const existingById = plans.find((p: any) => p.id === newId);
      if (existingById) {
        return res.status(400).json({ success: false, error: "Ya existe un plan con ese nombre" });
      }

      if (desactivarOtros) {
        plans.forEach((p: any) => { p.estado = false; });
      }

      const newPlan = {
        id: newId,
        nombre,
        eslogan,
        descripcion: descripcion || "",
        tipo,
        icono: icono || "Sparkles",
        color: color || "#8B5A2B",
        estado: true,
        preventa: preventa || false,
        fechaInicio: tipo === "temporada" ? fechaInicio : null,
        fechaFin: tipo === "temporada" ? fechaFin : null,
        precios: precios || {},
        precio: precio || 0,
        campingIds: Array.isArray(campingIds) && campingIds.length > 0 ? campingIds : null,
        incluye: incluye || [],
        createdAt: new Date().toISOString()
      };

      plans.push(newPlan);
      writePlans(plans);

      res.json({ success: true, plan: newPlan });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.put("/api/plans/:id", (req, res) => {
    try {
      const { id } = req.params;
      const { nombre, eslogan, descripcion, tipo, icono, color, precios, precio, campingIds, incluye, fechaInicio, fechaFin, preventa, estado, desactivarOtros } = req.body;

      const plans = readPlans();
      const planIndex = plans.findIndex((p: any) => p.id === id);

      if (planIndex === -1) {
        return res.status(404).json({ success: false, error: "Plan no encontrado" });
      }

      const planTipo = tipo || plans[planIndex].tipo;
      
      if (planTipo === "temporada") {
        const startDate = fechaInicio || plans[planIndex].fechaInicio;
        const endDate = fechaFin || plans[planIndex].fechaFin;
        
        if (!startDate || !endDate) {
          return res.status(400).json({ success: false, error: "Los planes de temporada requieren fechas" });
        }
        
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays > 62) {
          return res.status(400).json({ success: false, error: "Los planes de temporada no pueden durar más de 2 meses" });
        }
      }

      if (desactivarOtros && estado !== false) {
        plans.forEach((p: any, idx: number) => {
          if (idx !== planIndex) p.estado = false;
        });
      }

      const updatedPlan = {
        ...plans[planIndex],
        nombre: nombre ?? plans[planIndex].nombre,
        eslogan: eslogan ?? plans[planIndex].eslogan,
        descripcion: descripcion ?? plans[planIndex].descripcion,
        tipo: tipo ?? plans[planIndex].tipo,
        icono: icono ?? plans[planIndex].icono,
        color: color ?? plans[planIndex].color,
        estado: estado ?? plans[planIndex].estado,
        preventa: preventa ?? plans[planIndex].preventa,
        fechaInicio: tipo === "temporada" ? (fechaInicio ?? plans[planIndex].fechaInicio) : null,
        fechaFin: tipo === "temporada" ? (fechaFin ?? plans[planIndex].fechaFin) : null,
        precios: precios ?? plans[planIndex].precios,
        precio: precio !== undefined ? precio : (plans[planIndex].precio ?? 0),
        campingIds: campingIds !== undefined
          ? (Array.isArray(campingIds) && campingIds.length > 0 ? campingIds : null)
          : plans[planIndex].campingIds,
        incluye: incluye ?? plans[planIndex].incluye,
        updatedAt: new Date().toISOString()
      };

      plans[planIndex] = updatedPlan;
      writePlans(plans);

      res.json({ success: true, plan: updatedPlan });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.patch("/api/plans/:id/toggle", (req, res) => {
    try {
      const { id } = req.params;
      const { desactivarOtros } = req.body;

      const plans = readPlans();
      const planIndex = plans.findIndex((p: any) => p.id === id);

      if (planIndex === -1) {
        return res.status(404).json({ success: false, error: "Plan no encontrado" });
      }

      const newState = !plans[planIndex].estado;

      if (newState && desactivarOtros) {
        plans.forEach((p: any, idx: number) => {
          if (idx !== planIndex) p.estado = false;
        });
      }

      plans[planIndex].estado = newState;
      writePlans(plans);

      res.json({ success: true, plan: plans[planIndex] });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.patch("/api/plans/reorder", (req, res) => {
    try {
      const { order } = req.body;
      if (!Array.isArray(order)) {
        return res.status(400).json({ success: false, error: "Se requiere un array de IDs" });
      }
      const plans = readPlans();
      const reordered = order
        .map((id: string) => plans.find((p: any) => p.id === id))
        .filter(Boolean);
      const missing = plans.filter((p: any) => !order.includes(p.id));
      writePlans([...reordered, ...missing]);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.delete("/api/plans/:id", (req, res) => {
    try {
      const { id } = req.params;
      let plans = readPlans();
      const initialLength = plans.length;
      
      plans = plans.filter((plan: any) => plan.id !== id);

      if (plans.length === initialLength) {
        return res.status(404).json({ success: false, error: "Plan no encontrado" });
      }

      writePlans(plans);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ============ Admin Users CRUD ============
  app.get("/api/admin-users", async (req, res) => {
    try {
      const result = await pool.query("SELECT id, email, rol, created_at FROM admin_users ORDER BY id");
      res.json(result.rows);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin-users", async (req, res) => {
    try {
      const { email, password, rol } = req.body;
      if (!email || !password) return res.status(400).json({ error: "Email y contraseña requeridos" });
      const bcrypt = await import("bcryptjs");
      const hash = await bcrypt.default.hash(password, 10);
      const result = await pool.query(
        "INSERT INTO admin_users (email, password_hash, rol) VALUES ($1, $2, $3) RETURNING id, email, rol",
        [email, hash, rol || "admin"]
      );
      res.json({ success: true, user: result.rows[0] });
    } catch (error: any) {
      if (error.code === "23505") return res.status(400).json({ error: "Ese email ya existe" });
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/admin-users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { email, password, rol } = req.body;
      const bcrypt = await import("bcryptjs");
      if (password) {
        const hash = await bcrypt.default.hash(password, 10);
        await pool.query("UPDATE admin_users SET email = $1, password_hash = $2, rol = $3 WHERE id = $4", [email, hash, rol || "admin", id]);
      } else {
        await pool.query("UPDATE admin_users SET email = $1, rol = $2 WHERE id = $3", [email, rol || "admin", id]);
      }
      res.json({ success: true });
    } catch (error: any) {
      if (error.code === "23505") return res.status(400).json({ error: "Ese email ya existe" });
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/admin-users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const count = await pool.query("SELECT COUNT(*) FROM admin_users");
      if (parseInt(count.rows[0].count) <= 1) {
        return res.status(400).json({ error: "No puedes eliminar el único administrador" });
      }
      await pool.query("DELETE FROM admin_users WHERE id = $1", [id]);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============ Addons CRUD ============
  const addonsFilePath = path.join(process.cwd(), "server", "api", "addons.json");

  const readAddons = (): any[] => {
    try {
      return JSON.parse(fs.readFileSync(addonsFilePath, "utf-8"));
    } catch { return []; }
  };
  const writeAddons = (data: any[]) => fs.writeFileSync(addonsFilePath, JSON.stringify(data, null, 2));

  const addonMediaStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(process.cwd(), "public", "images", "addons");
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `addon-${Date.now()}${ext}`);
    }
  });
  const uploadAddonMedia = multer({
    storage: addonMediaStorage,
    limits: { fileSize: 100 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) cb(null, true);
      else cb(new Error("Solo se permiten imágenes y videos"));
    }
  });

  app.get("/api/addons", (req, res) => res.json(readAddons()));

  app.post("/api/addons", (req, res) => {
    try {
      const { title, price, description, details, allowMultiple, maxQuantity } = req.body;
      if (!title || price === undefined) return res.status(400).json({ error: "Título y precio requeridos" });
      const addons = readAddons();
      const newAddon = {
        id: title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") + "_" + Date.now(),
        title,
        price: Number(price),
        description: description || "",
        details: details || [],
        allowMultiple: allowMultiple === true,
        maxQuantity: allowMultiple ? (Number(maxQuantity) || 10) : 1,
        media: []
      };
      addons.push(newAddon);
      writeAddons(addons);
      res.json({ success: true, addon: newAddon });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/addons/:id", (req, res) => {
    try {
      const { id } = req.params;
      const { title, price, description, details, media, allowMultiple, maxQuantity } = req.body;
      const addons = readAddons();
      const idx = addons.findIndex((a: any) => a.id === id);
      if (idx === -1) return res.status(404).json({ error: "Adicional no encontrado" });
      addons[idx] = {
        ...addons[idx],
        title: title ?? addons[idx].title,
        price: price !== undefined ? Number(price) : addons[idx].price,
        description: description ?? addons[idx].description,
        details: details ?? addons[idx].details,
        allowMultiple: allowMultiple !== undefined ? allowMultiple === true : (addons[idx].allowMultiple ?? false),
        maxQuantity: allowMultiple !== undefined ? (allowMultiple ? (Number(maxQuantity) || 10) : 1) : (addons[idx].maxQuantity ?? 1),
        media: media ?? addons[idx].media ?? []
      };
      writeAddons(addons);
      res.json({ success: true, addon: addons[idx] });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/addons/:id/media", uploadAddonMedia.array("files", 20), async (req: any, res) => {
    try {
      const { id } = req.params;
      const files: Express.Multer.File[] = req.files || [];
      if (!files.length) return res.status(400).json({ error: "No se recibió ningún archivo" });
      const addons = readAddons();
      const idx = addons.findIndex((a: any) => a.id === id);
      if (idx === -1) return res.status(404).json({ error: "Adicional no encontrado" });
      if (!addons[idx].media) addons[idx].media = [];
      for (const file of files) {
        const isVideo = file.mimetype.startsWith("video/");
        let filename = file.filename;
        if (isVideo) {
          const inputPath = path.join(process.cwd(), "public", "images", "addons", file.filename);
          const outputPath = await transcodeToH264(inputPath);
          filename = path.basename(outputPath);
        } else {
          const ext = path.extname(file.filename).toLowerCase();
          if (ext !== ".jpg" && ext !== ".jpeg") {
            const inputPath = path.join(process.cwd(), "public", "images", "addons", file.filename);
            const outputPath = await convertImageToJpeg(inputPath);
            filename = path.basename(outputPath);
          }
        }
        const url = `/images/addons/${filename}`;
        addons[idx].media.push({ type: isVideo ? "video" : "image", url });
      }
      writeAddons(addons);
      res.json({ success: true, media: addons[idx].media });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.delete("/api/addons/:id/media", (req, res) => {
    try {
      const { id } = req.params;
      const { url } = req.body;
      const addons = readAddons();
      const idx = addons.findIndex((a: any) => a.id === id);
      if (idx === -1) return res.status(404).json({ error: "Adicional no encontrado" });
      addons[idx].media = (addons[idx].media || []).filter((m: any) => m.url !== url);
      writeAddons(addons);
      const filePath = path.join(process.cwd(), "public", url);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      res.json({ success: true, media: addons[idx].media });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.delete("/api/addons/:id", (req, res) => {
    try {
      const { id } = req.params;
      const addons = readAddons();
      const filtered = addons.filter((a: any) => a.id !== id);
      if (filtered.length === addons.length) return res.status(404).json({ error: "Adicional no encontrado" });
      writeAddons(filtered);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============ Campings CRUD ============
  const campingsFilePath = path.join(process.cwd(), "server", "api", "campings.json");

  const readCampings = (): any[] => {
    try {
      return JSON.parse(fs.readFileSync(campingsFilePath, "utf-8"));
    } catch { return []; }
  };
  const writeCampings = (data: any[]) => fs.writeFileSync(campingsFilePath, JSON.stringify(data, null, 2));

  app.get("/api/campings", (req, res) => res.json(readCampings()));

  app.put("/api/campings/:id", (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, features, includes, images, image } = req.body;
      const campings = readCampings();
      const idx = campings.findIndex((c: any) => c.id === parseInt(id));
      if (idx === -1) return res.status(404).json({ error: "Glamping no encontrado" });
      campings[idx] = {
        ...campings[idx],
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(features !== undefined && { features }),
        ...(includes !== undefined && { includes }),
        ...(images !== undefined && { images }),
        ...(image !== undefined && { image })
      };
      writeCampings(campings);
      res.json({ success: true, camping: campings[idx] });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  const campingImageStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(process.cwd(), "public", "images", "campings");
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `camping-${Date.now()}${ext}`);
    }
  });
  const campingUpload = multer({
    storage: campingImageStorage,
    limits: { fileSize: 100 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) cb(null, true);
      else cb(new Error("Solo se permiten imágenes y videos"));
    }
  });

  app.post("/api/campings/:id/image", campingUpload.single("image"), async (req, res) => {
    try {
      const { id } = req.params;
      if (!req.file) return res.status(400).json({ error: "No se recibió archivo" });
      let filename = req.file.filename;
      if (req.file.mimetype.startsWith("video/")) {
        const inputPath = path.join(process.cwd(), "public", "images", "campings", req.file.filename);
        const outputPath = await transcodeToH264(inputPath);
        filename = path.basename(outputPath);
      } else {
        const ext = path.extname(req.file.filename).toLowerCase();
        if (ext !== ".jpg" && ext !== ".jpeg") {
          const inputPath = path.join(process.cwd(), "public", "images", "campings", req.file.filename);
          const outputPath = await convertImageToJpeg(inputPath);
          filename = path.basename(outputPath);
        }
      }
      const imageUrl = `/images/campings/${filename}`;
      const campings = readCampings();
      const idx = campings.findIndex((c: any) => c.id === parseInt(id));
      if (idx === -1) return res.status(404).json({ error: "Glamping no encontrado" });
      const images = [...(campings[idx].images || []).filter((img: string) => !img.includes("placeholder")), imageUrl];
      campings[idx].images = images;
      campings[idx].image = images[0];
      writeCampings(campings);
      res.json({ success: true, imageUrl, camping: campings[idx] });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/campings/:id/image", (req, res) => {
    try {
      const { id } = req.params;
      const { imageUrl } = req.body;
      const campings = readCampings();
      const idx = campings.findIndex((c: any) => c.id === parseInt(id));
      if (idx === -1) return res.status(404).json({ error: "Glamping no encontrado" });
      campings[idx].images = (campings[idx].images || []).filter((img: string) => img !== imageUrl);
      if (campings[idx].images.length === 0) campings[idx].images = ["/images/glamping-placeholder.svg"];
      if (campings[idx].image === imageUrl) campings[idx].image = campings[idx].images[0];
      writeCampings(campings);
      res.json({ success: true, camping: campings[idx] });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/campings/:id/cover", (req, res) => {
    try {
      const { id } = req.params;
      const { imageUrl } = req.body;
      if (!imageUrl) return res.status(400).json({ error: "imageUrl requerido" });
      const campings = readCampings();
      const idx = campings.findIndex((c: any) => c.id === parseInt(id));
      if (idx === -1) return res.status(404).json({ error: "Glamping no encontrado" });
      campings[idx].image = imageUrl;
      writeCampings(campings);
      res.json({ success: true, camping: campings[idx] });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  const PRICING_PATH = path.join(process.cwd(), "server/api/pricing.json");

  app.get("/api/pricing", (req, res) => {
    try {
      const data = fs.readFileSync(PRICING_PATH, "utf-8");
      res.json(JSON.parse(data));
    } catch (error: any) {
      res.status(500).json({ error: "Error leyendo configuración de precios" });
    }
  });

  app.put("/api/pricing", (req, res) => {
    try {
      fs.writeFileSync(PRICING_PATH, JSON.stringify(req.body, null, 2));
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  return httpServer;
}
