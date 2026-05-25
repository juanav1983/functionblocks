// ============================================================
//  server.js — Backend MATEC NRD
//  Express + PostgreSQL (Supabase via pg)
// ============================================================
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const { pool } = require('./db/db');

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ------------------------------------------------------------
// GET /api/proyectos
// Lista todos los proyectos activos con su fase y subfase actual
// ------------------------------------------------------------
app.get('/api/proyectos', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        p.id,
        p.nombre,
        p.estado,
        p.fecha_inicio,
        p.fecha_objetivo,
        p.hardware_tipo_id,
        ht.nombre        AS hardware,
        f.numero         AS num_fase,
        f.nombre         AS fase_nombre,
        f.color_hex      AS fase_color,
        s.codigo         AS subfase_codigo,
        s.nombre         AS subfase_nombre,
        s.es_decision    AS subfase_es_decision
      FROM proyectos p
      JOIN hardware_tipos ht ON ht.id = p.hardware_tipo_id
      LEFT JOIN subfases   s  ON  s.id = p.subfase_actual_id
      LEFT JOIN fases      f  ON  f.id = s.fase_id
      WHERE p.estado IN ('activo','pausado','pendiente')
      ORDER BY p.fecha_inicio ASC, p.id
    `);
    res.json(rows);
  } catch (err) {
    console.error('Error /api/proyectos:', err.message);
    res.status(500).json({ error: 'Error al consultar proyectos', detalle: err.message });
  }
});

// ------------------------------------------------------------
// GET /api/proyectos/gantt
// Todos los proyectos (activos + pausados + completados) con fechas
// para renderizar el diagrama Gantt.
// IMPORTANTE: debe ir ANTES de /api/proyectos/:id
// ------------------------------------------------------------
app.get('/api/proyectos/gantt', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        p.id,
        p.nombre,
        p.estado,
        TO_CHAR(p.fecha_inicio,   'YYYY-MM-DD') AS fecha_inicio,
        TO_CHAR(p.fecha_objetivo, 'YYYY-MM-DD') AS fecha_objetivo,
        TO_CHAR(p.completado_en,  'YYYY-MM-DD') AS completado_en,
        ht.nombre    AS hardware,
        f.numero     AS num_fase,
        f.nombre     AS fase_nombre,
        f.color_hex  AS fase_color,
        s.codigo     AS subfase_codigo
      FROM proyectos p
      JOIN hardware_tipos ht ON ht.id = p.hardware_tipo_id
      LEFT JOIN subfases s   ON  s.id = p.subfase_actual_id
      LEFT JOIN fases    f   ON  f.id = s.fase_id
      WHERE p.estado IN ('activo','pausado','completado','pendiente')
      ORDER BY p.fecha_inicio ASC
    `);
    res.json(rows);
  } catch (err) {
    console.error('Error GET /api/proyectos/gantt:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ------------------------------------------------------------
// GET /api/proyectos/:id
// Detalle de un proyecto con su historial de fases
// ------------------------------------------------------------
app.get('/api/proyectos/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const proyRes = await pool.query(`
      SELECT
        p.id, p.nombre, p.descripcion, p.estado,
        p.fecha_inicio, p.fecha_objetivo,
        ht.nombre     AS hardware,
        f.numero      AS num_fase,
        f.nombre      AS fase_nombre,
        f.color_hex   AS fase_color,
        s.codigo      AS subfase_codigo,
        s.nombre      AS subfase_nombre
      FROM proyectos p
      JOIN hardware_tipos ht ON ht.id = p.hardware_tipo_id
      LEFT JOIN subfases   s ON  s.id = p.subfase_actual_id
      LEFT JOIN fases      f ON  f.id = s.fase_id
      WHERE p.id = $1
    `, [id]);

    if (proyRes.rows.length === 0)
      return res.status(404).json({ error: 'Proyecto no encontrado' });

    const histRes = await pool.query(`
      SELECT
        h.fecha,
        h.accion,
        h.comentario,
        sd.codigo AS desde_codigo,
        sd.nombre AS desde_nombre,
        sh.codigo AS hasta_codigo,
        sh.nombre AS hasta_nombre,
        COALESCE(u.nombre || ' ' || u.apellido, 'Sistema') AS usuario
      FROM historial_fases h
      LEFT JOIN subfases sd ON sd.id = h.subfase_desde_id
      LEFT JOIN subfases sh ON sh.id = h.subfase_hasta_id
      LEFT JOIN usuarios u  ON  u.id = h.usuario_id
      WHERE h.proyecto_id = $1
      ORDER BY h.fecha DESC
    `, [id]);

    res.json({ ...proyRes.rows[0], historial: histRes.rows });
  } catch (err) {
    console.error('Error /api/proyectos/:id:', err.message);
    res.status(500).json({ error: 'Error al consultar proyecto', detalle: err.message });
  }
});

// ------------------------------------------------------------
// GET /api/subfases
// Lista todas las subfases
// ------------------------------------------------------------
app.get('/api/subfases', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        s.id, s.codigo, s.nombre, s.es_decision, s.es_correctivo, s.orden,
        f.id     AS fase_id,
        f.numero AS fase_numero,
        f.nombre AS fase_nombre,
        f.color_hex
      FROM subfases s
      JOIN fases    f ON f.id = s.fase_id
      ORDER BY f.numero, s.orden
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------------------------------------------
// GET /api/diagrama
// Estructura completa del diagrama (fases + subfases + transiciones)
// ------------------------------------------------------------
app.get('/api/diagrama', async (req, res) => {
  try {
    const [fasesRes, subfasesRes, transRes] = await Promise.all([
      pool.query(`
        SELECT id, numero, nombre, descripcion, color_hex, COALESCE(emoji, '') AS emoji
        FROM   fases
        ORDER  BY numero
      `),
      pool.query(`
        SELECT s.id, s.codigo, s.nombre,
               s.es_decision, s.es_correctivo, s.orden,
               f.id     AS fase_id,
               f.numero AS fase_numero,
               f.color_hex
        FROM   subfases s
        JOIN   fases    f ON f.id = s.fase_id
        ORDER  BY f.numero, s.orden
      `),
      pool.query(`
        SELECT codigo_origen, codigo_destino, etiqueta, tipo
        FROM   subfase_transiciones
        WHERE  activo = TRUE
        ORDER  BY id
      `),
    ]);

    res.json({
      fases:        fasesRes.rows,
      subfases:     subfasesRes.rows,
      transiciones: transRes.rows,
    });
  } catch (err) {
    console.error('Error /api/diagrama:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ------------------------------------------------------------
// GET /api/proyectos/:id/historial
// Historial de cambios de fase de un proyecto
// ------------------------------------------------------------
app.get('/api/proyectos/:id/historial', async (req, res) => {
  try {
    const proyId = parseInt(req.params.id);

    const { rows } = await pool.query(`
      SELECT
        h.id,
        h.fecha,
        h.accion,
        COALESCE(h.comentario, '')                          AS comentario,
        sd.codigo                                           AS desde_codigo,
        sd.nombre                                           AS desde_nombre,
        sh.codigo                                           AS hasta_codigo,
        sh.nombre                                           AS hasta_nombre,
        fd.numero                                           AS desde_fase_num,
        fh.numero                                           AS hasta_fase_num,
        COALESCE(u.nombre || ' ' || u.apellido, 'Sistema') AS usuario,
        COALESCE(u.rol, '')                                 AS usuario_rol
      FROM historial_fases h
      LEFT JOIN subfases sd ON sd.id = h.subfase_desde_id
      LEFT JOIN subfases sh ON sh.id = h.subfase_hasta_id
      LEFT JOIN fases    fd ON fd.id = sd.fase_id
      LEFT JOIN fases    fh ON fh.id = sh.fase_id
      LEFT JOIN usuarios u  ON  u.id = h.usuario_id
      WHERE h.proyecto_id = $1
      ORDER BY h.fecha DESC
    `, [proyId]);

    res.json(rows);
  } catch (err) {
    console.error('Error GET /historial:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ------------------------------------------------------------
// GET /api/proyectos/:id/pasos-siguientes
// Subfase actual + posibles transiciones
// ------------------------------------------------------------
app.get('/api/proyectos/:id/pasos-siguientes', async (req, res) => {
  try {
    const proyId = parseInt(req.params.id);

    const proyRes = await pool.query(`
      SELECT p.id, p.nombre, p.estado,
             s.id     AS subfase_id,
             s.codigo AS subfase_codigo,
             s.nombre AS subfase_nombre,
             s.es_decision,
             s.es_correctivo,
             f.numero AS fase_numero,
             f.nombre AS fase_nombre
      FROM   proyectos p
      LEFT JOIN subfases s ON s.id = p.subfase_actual_id
      LEFT JOIN fases    f ON f.id = s.fase_id
      WHERE  p.id = $1
    `, [proyId]);

    if (!proyRes.rows.length)
      return res.status(404).json({ error: 'Proyecto no encontrado' });

    const proy = proyRes.rows[0];

    if (proy.estado === 'completado' || !proy.subfase_codigo)
      return res.json({ subfase_actual: null, pasos: [], estado: proy.estado });

    const transRes = await pool.query(`
      SELECT t.id AS transicion_id,
             t.codigo_destino,
             COALESCE(t.etiqueta, '') AS etiqueta,
             t.tipo,
             s.id     AS subfase_id,
             s.nombre AS nombre,
             s.es_decision
      FROM   subfase_transiciones t
      LEFT JOIN subfases s ON s.codigo = t.codigo_destino
      WHERE  t.codigo_origen = $1 AND t.activo = TRUE
      ORDER  BY t.id
    `, [proy.subfase_codigo]);

    const pasos = transRes.rows.map(t => ({
      transicion_id:  t.transicion_id,
      codigo_destino: t.codigo_destino,
      subfase_id:     t.subfase_id || null,
      nombre:         t.codigo_destino === 'END' ? '🏁 Completar proyecto' : (t.nombre || t.codigo_destino),
      etiqueta:       t.etiqueta || null,
      tipo:           t.tipo,
      es_fin:         t.codigo_destino === 'END',
      es_decision:    !!t.es_decision,
    }));

    res.json({
      proyecto_id: proyId,
      subfase_actual: {
        id:          proy.subfase_id,
        codigo:      proy.subfase_codigo,
        nombre:      proy.subfase_nombre,
        es_decision: !!proy.es_decision,
        fase_numero: proy.fase_numero,
        fase_nombre: proy.fase_nombre,
      },
      pasos,
      estado: proy.estado,
    });
  } catch (err) {
    console.error('Error GET /pasos-siguientes:', err.message);
    res.status(500).json({ error: err.message, pasos: [] });
  }
});

// ------------------------------------------------------------
// PATCH /api/proyectos/:id/avanzar
// Mueve el proyecto a la siguiente subfase y registra historial.
// ------------------------------------------------------------
app.patch('/api/proyectos/:id/avanzar', async (req, res) => {
  try {
    const proyId = parseInt(req.params.id);
    const { usuario_id, subfase_hasta_id, accion, comentario, completar } = req.body;

    const accionVal = accion || 'avanzó';
    const acciones  = ['avanzó','retrocedió','bloqueó','inició','completó'];
    if (!acciones.includes(accionVal))
      return res.status(400).json({ error: `accion debe ser: ${acciones.join(', ')}` });

    // Subfase actual
    const actualRes = await pool.query(
      'SELECT id, subfase_actual_id FROM proyectos WHERE id = $1', [proyId]
    );
    if (!actualRes.rows.length)
      return res.status(404).json({ error: 'Proyecto no encontrado' });

    const subfase_desde_id = actualRes.rows[0].subfase_actual_id;

    if (completar) {
      await pool.query(`
        UPDATE proyectos
        SET estado = 'completado', subfase_actual_id = NULL, completado_en = NOW()
        WHERE id = $1
      `, [proyId]);

      try {
        await pool.query(`
          INSERT INTO historial_fases (proyecto_id, subfase_desde_id, subfase_hasta_id, usuario_id, accion, comentario)
          VALUES ($1, $2, NULL, $3, 'completó', $4)
        `, [proyId, subfase_desde_id, usuario_id ? parseInt(usuario_id) : null, comentario || 'Proyecto completado']);
      } catch (_) { /* historial es secundario */ }

      return res.json({ ok: true, mensaje: 'Proyecto marcado como completado.' });
    }

    if (!subfase_hasta_id)
      return res.status(400).json({ error: 'Se requiere subfase_hasta_id o completar=true' });

    await pool.query(
      'UPDATE proyectos SET subfase_actual_id = $1 WHERE id = $2',
      [parseInt(subfase_hasta_id), proyId]
    );

    try {
      await pool.query(`
        INSERT INTO historial_fases (proyecto_id, subfase_desde_id, subfase_hasta_id, usuario_id, accion, comentario)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        proyId,
        subfase_desde_id,
        parseInt(subfase_hasta_id),
        usuario_id ? parseInt(usuario_id) : null,
        accionVal,
        comentario || null,
      ]);
    } catch (_) { /* historial es secundario */ }

    res.json({ ok: true, mensaje: `Avanzado a subfase ${subfase_hasta_id}` });
  } catch (err) {
    console.error('Error PATCH /avanzar:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ------------------------------------------------------------
// GET /api/hardware-tipos
// ------------------------------------------------------------
app.get('/api/hardware-tipos', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, nombre FROM hardware_tipos ORDER BY nombre');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------------------------------------------
// POST /api/proyectos
// Crea un proyecto nuevo
// ------------------------------------------------------------
app.post('/api/proyectos', async (req, res) => {
  const { nombre, hardware_tipo_id, fecha_objetivo, fecha_inicio } = req.body;
  if (!nombre || !hardware_tipo_id)
    return res.status(400).json({ error: 'nombre y hardware_tipo_id son requeridos' });

  try {
    const primeraRes = await pool.query(`
      SELECT s.id FROM subfases s
      JOIN fases f ON f.id = s.fase_id
      ORDER BY f.numero ASC, s.orden ASC
      LIMIT 1
    `);
    const subfaseInicialId = primeraRes.rows[0]?.id || null;

    const fechaInicioVal = fecha_inicio ? new Date(fecha_inicio) : new Date();
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const estadoInicial = fechaInicioVal > hoy ? 'pendiente' : 'activo';

    const r = await pool.query(`
      INSERT INTO proyectos (nombre, hardware_tipo_id, subfase_actual_id, fecha_inicio, fecha_objetivo, estado)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `, [
      nombre.trim(),
      parseInt(hardware_tipo_id),
      subfaseInicialId,
      fecha_inicio || null,
      fecha_objetivo || null,
      estadoInicial,
    ]);

    const nuevoId = r.rows[0].id;

    try {
      await pool.query(`
        INSERT INTO historial_fases (proyecto_id, subfase_desde_id, subfase_hasta_id, usuario_id, accion, comentario)
        VALUES ($1, NULL, $2, NULL, 'inició', 'Proyecto creado')
      `, [nuevoId, subfaseInicialId]);
    } catch (_) { /* historial es secundario */ }

    res.status(201).json({ id: nuevoId, mensaje: 'Proyecto creado exitosamente' });
  } catch (err) {
    console.error('Error POST /api/proyectos:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// ADMIN: CRUD para la página de Configuración
// ============================================================

// ── FASES ────────────────────────────────────────────────────
app.get('/api/admin/fases', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT f.id, f.numero, f.nombre,
             COALESCE(f.descripcion, '') AS descripcion,
             f.color_hex,
             COALESCE(f.emoji, '') AS emoji,
             (SELECT COUNT(*) FROM subfases s WHERE s.fase_id = f.id) AS num_subfases
      FROM fases f ORDER BY f.numero
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/admin/fases', async (req, res) => {
  const { numero, nombre, descripcion, color_hex, emoji } = req.body;
  if (!numero || !nombre) return res.status(400).json({ error: 'numero y nombre son requeridos' });
  try {
    const r = await pool.query(`
      INSERT INTO fases (numero, nombre, descripcion, color_hex, emoji)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `, [parseInt(numero), nombre, descripcion || null, color_hex || '#CCCCCC', emoji || null]);
    res.json({ id: r.rows[0].id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/admin/fases/:id', async (req, res) => {
  const { nombre, descripcion, color_hex, emoji } = req.body;
  try {
    await pool.query(`
      UPDATE fases SET nombre=$1, descripcion=$2, color_hex=$3, emoji=$4 WHERE id=$5
    `, [nombre, descripcion || null, color_hex || '#CCCCCC', emoji || null, parseInt(req.params.id)]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/admin/fases/:id', async (req, res) => {
  try {
    const chk = await pool.query(
      'SELECT COUNT(*) AS n FROM subfases WHERE fase_id = $1', [parseInt(req.params.id)]
    );
    if (parseInt(chk.rows[0].n) > 0)
      return res.status(409).json({ error: `No se puede eliminar: tiene ${chk.rows[0].n} subfase(s) asociada(s).` });
    await pool.query('DELETE FROM fases WHERE id = $1', [parseInt(req.params.id)]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── SUBFASES ─────────────────────────────────────────────────
app.get('/api/admin/subfases', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT s.id, s.fase_id, s.codigo, s.nombre, s.es_decision, s.es_correctivo,
             s.orden, f.numero AS fase_numero, f.nombre AS fase_nombre, f.color_hex
      FROM subfases s JOIN fases f ON f.id = s.fase_id
      ORDER BY f.numero, s.orden
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/admin/subfases', async (req, res) => {
  const { fase_id, codigo, nombre, es_decision, es_correctivo, orden } = req.body;
  if (!fase_id || !codigo || !nombre)
    return res.status(400).json({ error: 'fase_id, codigo y nombre son requeridos' });
  try {
    const r = await pool.query(`
      INSERT INTO subfases (fase_id, codigo, nombre, es_decision, es_correctivo, orden)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `, [
      parseInt(fase_id),
      codigo.toUpperCase(),
      nombre,
      es_decision  ? true : false,
      es_correctivo ? true : false,
      parseInt(orden) || 99,
    ]);
    res.json({ id: r.rows[0].id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/admin/subfases/:id', async (req, res) => {
  const { fase_id, nombre, es_decision, es_correctivo, orden } = req.body;
  try {
    await pool.query(`
      UPDATE subfases SET fase_id=$1, nombre=$2, es_decision=$3, es_correctivo=$4, orden=$5
      WHERE id=$6
    `, [
      parseInt(fase_id),
      nombre,
      es_decision   ? true : false,
      es_correctivo ? true : false,
      parseInt(orden) || 99,
      parseInt(req.params.id),
    ]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/admin/subfases/:id', async (req, res) => {
  try {
    const sfRes = await pool.query('SELECT codigo FROM subfases WHERE id = $1', [parseInt(req.params.id)]);
    if (!sfRes.rows.length) return res.status(404).json({ error: 'Subfase no encontrada' });
    const codigo = sfRes.rows[0].codigo;

    const proys = await pool.query(
      'SELECT COUNT(*) AS n FROM proyectos WHERE subfase_actual_id = $1', [parseInt(req.params.id)]
    );
    if (parseInt(proys.rows[0].n) > 0)
      return res.status(409).json({ error: `${proys.rows[0].n} proyecto(s) están en esta subfase.` });

    // Eliminar transiciones relacionadas
    await pool.query(
      'DELETE FROM subfase_transiciones WHERE codigo_origen = $1 OR codigo_destino = $1', [codigo]
    );
    await pool.query('DELETE FROM subfases WHERE id = $1', [parseInt(req.params.id)]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── TRANSICIONES ─────────────────────────────────────────────
app.get('/api/admin/transiciones', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT id, codigo_origen, codigo_destino,
             COALESCE(etiqueta,'') AS etiqueta, tipo, activo
      FROM subfase_transiciones ORDER BY id
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/admin/transiciones', async (req, res) => {
  const { codigo_origen, codigo_destino, etiqueta, tipo } = req.body;
  if (!codigo_origen || !codigo_destino)
    return res.status(400).json({ error: 'codigo_origen y codigo_destino son requeridos' });
  try {
    const r = await pool.query(`
      INSERT INTO subfase_transiciones (codigo_origen, codigo_destino, etiqueta, tipo)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `, [
      codigo_origen.toUpperCase(),
      codigo_destino.toUpperCase(),
      etiqueta || null,
      tipo || 'normal',
    ]);
    res.json({ id: r.rows[0].id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/admin/transiciones/:id', async (req, res) => {
  const { codigo_origen, codigo_destino, etiqueta, tipo, activo } = req.body;
  try {
    await pool.query(`
      UPDATE subfase_transiciones
      SET codigo_origen=$1, codigo_destino=$2, etiqueta=$3, tipo=$4, activo=$5
      WHERE id=$6
    `, [
      codigo_origen.toUpperCase(),
      codigo_destino.toUpperCase(),
      etiqueta || null,
      tipo || 'normal',
      activo ? true : false,
      parseInt(req.params.id),
    ]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/admin/transiciones/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM subfase_transiciones WHERE id = $1', [parseInt(req.params.id)]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── USUARIOS ─────────────────────────────────────────────────
app.get('/api/admin/usuarios', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT id, nombre, apellido, email, rol, area, activo,
             TO_CHAR(creado_en, 'YYYY-MM-DD') AS creado_en
      FROM usuarios ORDER BY id
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/admin/usuarios', async (req, res) => {
  const { nombre, apellido, email, rol, area } = req.body;
  if (!nombre || !apellido || !email || !rol || !area)
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  try {
    const r = await pool.query(`
      INSERT INTO usuarios (nombre, apellido, email, rol, area)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `, [nombre, apellido, email, rol, area]);
    res.json({ id: r.rows[0].id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/admin/usuarios/:id', async (req, res) => {
  const { nombre, apellido, email, rol, area, activo } = req.body;
  try {
    await pool.query(`
      UPDATE usuarios SET nombre=$1, apellido=$2, email=$3, rol=$4, area=$5, activo=$6
      WHERE id=$7
    `, [nombre, apellido, email, rol, area, activo ? true : false, parseInt(req.params.id)]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/admin/usuarios/:id', async (req, res) => {
  try {
    // Soft delete
    await pool.query('UPDATE usuarios SET activo = FALSE WHERE id = $1', [parseInt(req.params.id)]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── PUT /api/proyectos/:id ────────────────────────────────────
app.put('/api/proyectos/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { nombre, hardware_tipo_id, fecha_inicio, fecha_objetivo, estado, descripcion } = req.body;
  if (!nombre || !hardware_tipo_id)
    return res.status(400).json({ error: 'nombre y hardware_tipo_id son requeridos' });

  try {
    await pool.query(`
      UPDATE proyectos
      SET nombre           = $1,
          descripcion      = $2,
          hardware_tipo_id = $3,
          fecha_inicio     = $4,
          fecha_objetivo   = $5,
          estado           = $6,
          actualizado_en   = NOW()
      WHERE id = $7
    `, [
      nombre,
      descripcion || null,
      parseInt(hardware_tipo_id),
      fecha_inicio  || null,
      fecha_objetivo || null,
      estado || 'activo',
      id,
    ]);
    res.json({ ok: true });
  } catch (err) {
    console.error('Error PUT /api/proyectos/:id:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/proyectos/:id ─────────────────────────────────
app.delete('/api/proyectos/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    // Borrar historial primero (FK)
    await pool.query('DELETE FROM historial_fases WHERE proyecto_id = $1', [id]);
    await pool.query('DELETE FROM proyectos WHERE id = $1', [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error('Error DELETE /api/proyectos/:id:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ------------------------------------------------------------
// Arranque del servidor
// ------------------------------------------------------------
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Backend MATEC NRD escuchando en http://localhost:${PORT}`);
  console.log(`   Red local → http://<tu-IP-local>:${PORT}`);
});
