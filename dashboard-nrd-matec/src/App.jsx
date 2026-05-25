import React, { useState, useEffect, useCallback, useRef } from 'react';
import ProjectFlowchart from './components/ProjectFlowchart/ProjectFlowchart';
import PanelAvance from './components/PanelAvance/PanelAvance';
import Configuracion from './pages/Configuracion';
import GanttDashboard from './pages/GanttDashboard';
import ProyectosDashboard from './pages/ProyectosDashboard';

// Usa el mismo hostname desde el que se cargó la app
// → funciona desde localhost Y desde cualquier dispositivo en la misma red
const API = `http://${window.location.hostname}:3001`;

// ── Badge visual para el estado del proyecto ─────────────────────────────────
const EstadoBadge = ({ estado }) => {
  const estilos = {
    pendiente:  { bg: '#F3E5F5', color: '#6A1B9A', label: '📌 On deck'    },
    activo:     { bg: '#E8F5E9', color: '#2E7D32', label: '● Activo'      },
    pausado:    { bg: '#FFF3E0', color: '#E65100', label: '⏸ Pausado'     },
    completado: { bg: '#E3F2FD', color: '#1565C0', label: '✓ Completado'  },
    archivado:  { bg: '#F3E5F5', color: '#6A1B9A', label: '📦 Archivado'  },
  };
  const e = estilos[estado] || estilos.activo;
  return (
    <span style={{
      fontSize: '10px', fontWeight: 'bold', padding: '2px 8px',
      borderRadius: '10px', backgroundColor: e.bg, color: e.color,
    }}>
      {e.label}
    </span>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MODAL: CREAR NUEVO PROYECTO
// ═══════════════════════════════════════════════════════════════════════════════
function ModalNuevoProyecto({ onCerrar, onCreado }) {
  const [hardwareTipos, setHardwareTipos] = useState([]);
  const [form, setForm]   = useState({ nombre: '', hardware_tipo_id: '', fecha_inicio: '', fecha_objetivo: '' });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API}/api/hardware-tipos`)
      .then(r => r.json())
      .then(d => {
        const lista = Array.isArray(d) ? d : [];
        setHardwareTipos(lista);
        if (lista.length > 0)
          setForm(f => ({ ...f, hardware_tipo_id: lista[0].id }));
      })
      .catch(() => setHardwareTipos([]));
  }, []);

  // Cerrar con Escape
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onCerrar(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onCerrar]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const crear = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim())       { setError('El nombre es obligatorio'); return; }
    if (!form.hardware_tipo_id)    { setError('Selecciona el tipo de hardware'); return; }
    setEnviando(true);
    setError(null);
    try {
      const r = await fetch(`${API}/api/proyectos`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre:           form.nombre.trim(),
          hardware_tipo_id: parseInt(form.hardware_tipo_id),
          fecha_inicio:     form.fecha_inicio  || null,
          fecha_objetivo:   form.fecha_objetivo || null,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Error al crear el proyecto');
      onCreado(data.id);
    } catch (err) {
      setError(err.message);
      setEnviando(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '9px 12px', border: '1px solid #ddd',
    borderRadius: '7px', fontSize: '14px', boxSizing: 'border-box',
    fontFamily: 'sans-serif', outline: 'none',
  };
  const labelStyle = {
    display: 'block', fontSize: '11px', fontWeight: 'bold',
    color: '#555', marginBottom: '5px',
    textTransform: 'uppercase', letterSpacing: '0.4px',
  };

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onCerrar(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div style={{
        background: '#fff', borderRadius: '14px',
        width: '100%', maxWidth: '460px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
        animation: 'fadeInDown 0.2s ease',
        overflow: 'hidden',
      }}>

        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #1F3864 0%, #1565C0 100%)',
          padding: '18px 22px', color: '#fff',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '16px' }}>＋ Nuevo Proyecto</div>
            <div style={{ fontSize: '11px', color: '#90CAF9', marginTop: '2px' }}>
              Puedes programar la fecha de inicio para dejarlo "on deck"
            </div>
          </div>
          <button
            onClick={onCerrar}
            style={{
              background: 'rgba(255,255,255,0.15)', border: 'none',
              borderRadius: '7px', color: '#fff', cursor: 'pointer',
              padding: '6px 11px', fontSize: '15px', fontWeight: 'bold',
            }}
          >✕</button>
        </div>

        {/* Formulario */}
        <form onSubmit={crear} style={{ padding: '22px 24px' }}>

          {/* Nombre */}
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Nombre del proyecto *</label>
            <input
              type="text"
              placeholder="Ej: FB_MotorControl_v2"
              value={form.nombre}
              onChange={e => set('nombre', e.target.value)}
              style={inputStyle}
              autoFocus
            />
          </div>

          {/* Hardware */}
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Tipo de Hardware *</label>
            {hardwareTipos.length > 0 ? (
              <select
                value={form.hardware_tipo_id}
                onChange={e => set('hardware_tipo_id', e.target.value)}
                style={inputStyle}
              >
                {hardwareTipos.map(h => (
                  <option key={h.id} value={h.id}>{h.nombre}</option>
                ))}
              </select>
            ) : (
              <div style={{
                padding: '9px 12px', background: '#FFF3E0',
                border: '1px solid #FFB74D', borderRadius: '7px',
                fontSize: '12px', color: '#E65100',
              }}>
                ⚠ No hay tipos de hardware configurados. Agrégalos en ⚙ Configuración.
              </div>
            )}
          </div>

          {/* Fechas en fila */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '22px' }}>

            {/* Fecha de inicio */}
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>
                Fecha de inicio{' '}
                <span style={{ fontWeight: 'normal', color: '#aaa', textTransform: 'none' }}>
                  (opcional)
                </span>
              </label>
              <input
                type="date"
                value={form.fecha_inicio}
                onChange={e => set('fecha_inicio', e.target.value)}
                style={inputStyle}
              />
              {form.fecha_inicio && new Date(form.fecha_inicio) > new Date() && (
                <div style={{
                  marginTop: '5px', fontSize: '10px', color: '#6A1B9A',
                  background: '#F3E5F5', padding: '3px 8px', borderRadius: '5px',
                  display: 'inline-block',
                }}>
                  📌 On deck — quedará en estado pendiente
                </div>
              )}
            </div>

            {/* Fecha objetivo */}
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>
                Fecha objetivo{' '}
                <span style={{ fontWeight: 'normal', color: '#aaa', textTransform: 'none' }}>
                  (opcional)
                </span>
              </label>
              <input
                type="date"
                value={form.fecha_objetivo}
                onChange={e => set('fecha_objetivo', e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              marginBottom: '14px', padding: '10px 14px',
              background: '#FFEBEE', border: '1px solid #EF9A9A',
              borderRadius: '7px', fontSize: '13px', color: '#B71C1C',
            }}>
              ⚠ {error}
            </div>
          )}

          {/* Acciones */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onCerrar}
              style={{
                padding: '9px 18px', background: '#f5f5f5',
                border: '1px solid #ddd', borderRadius: '7px',
                cursor: 'pointer', fontSize: '13px', color: '#555',
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando || hardwareTipos.length === 0}
              style={{
                padding: '9px 22px',
                background: enviando ? '#90CAF9' : '#1565C0',
                color: '#fff', border: 'none', borderRadius: '7px',
                cursor: (enviando || hardwareTipos.length === 0) ? 'not-allowed' : 'pointer',
                fontSize: '13px', fontWeight: 'bold',
                transition: 'background 0.2s',
              }}
            >
              {enviando ? 'Creando...' : '✓ Crear proyecto'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// APP PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════
function App() {
  const [pagina, setPagina]                             = useState('dashboard');
  const [proyectos, setProyectos]                       = useState([]);
  const [cargando, setCargando]                         = useState(true);
  const [error, setError]                               = useState(null);
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState(null);
  const [mostrarModalNuevo, setMostrarModalNuevo]       = useState(false);
  const panelRef = useRef(null);

  // Función de carga reutilizable para poder refrescar tras un avance o creación
  const cargarProyectos = useCallback((proyIdActual = null) => {
    fetch(`${API}/api/proyectos`)
      .then(r => {
        if (!r.ok) throw new Error(`Error del servidor: ${r.status}`);
        return r.json();
      })
      .then(datos => {
        if (!Array.isArray(datos)) throw new Error('Formato de datos no válido');
        setProyectos(datos);
        if (datos.length > 0) {
          const actualizado = proyIdActual
            ? datos.find(p => p.id === proyIdActual) || datos[0]
            : datos[0];
          setProyectoSeleccionado(actualizado);
        }
        setCargando(false);
      })
      .catch(err => {
        console.error('Error de conexión:', err);
        setError(err.message);
        setCargando(false);
      });
  }, []);

  useEffect(() => { cargarProyectos(); }, [cargarProyectos]);

  // Scroll al top del panel principal cada vez que cambia el proyecto seleccionado
  useEffect(() => {
    if (panelRef.current) panelRef.current.scrollTo({ top: 0, behavior: 'smooth' });
  }, [proyectoSeleccionado]);

  // Construye el string "Fase 2 — Desarrollo en IDE" que necesita ProjectFlowchart.
  const getFaseLabel = (p) => {
    if (!p) return '';
    if (p.fase)                       return p.fase;
    if (p.num_fase && p.fase_nombre)  return `Fase ${p.num_fase} — ${p.fase_nombre}`;
    return '';
  };

  // Callback cuando se crea un proyecto: cierra modal y selecciona el nuevo
  const handleProyectoCreado = useCallback((nuevoId) => {
    setMostrarModalNuevo(false);
    cargarProyectos(nuevoId);
  }, [cargarProyectos]);

  // ── Exportar informe profesional a PDF ───────────────────────────────────────
  const exportarPDF = async () => {
    const p = proyectoSeleccionado;
    if (!p) return;

    const FASE_COLORS = { 1:'#1565C0', 2:'#2E7D32', 3:'#E65100', 4:'#B71C1C', 5:'#6A1B9A' };
    const ESTADO_LABELS = { pendiente:'On Deck', activo:'Activo', pausado:'Pausado', completado:'Completado', archivado:'Archivado' };
    const ESTADO_COLORS = { pendiente:'#6A1B9A', activo:'#2E7D32', pausado:'#E65100', completado:'#1565C0', archivado:'#546e7a' };
    const ESTADO_BGS    = { pendiente:'#F3E5F5', activo:'#E8F5E9', pausado:'#FFF3E0', completado:'#E3F2FD', archivado:'#F5F5F5' };

    const estadoColor = ESTADO_COLORS[p.estado] || '#546e7a';
    const estadoBg    = ESTADO_BGS[p.estado]    || '#f5f5f5';
    const estadoLabel = ESTADO_LABELS[p.estado] || p.estado;

    const fmtFecha = (f) => {
      if (!f) return '—';
      try { return new Date(f).toLocaleDateString('es-CO', { day:'2-digit', month:'long', year:'numeric' }); }
      catch { return String(f); }
    };

    // Obtener historial y fases en paralelo
    let historial = [], todasFases = [];
    try {
      const [hRes, dRes] = await Promise.all([
        fetch(`${API}/api/proyectos/${p.id}/historial`),
        fetch(`${API}/api/diagrama`),
      ]);
      historial   = await hRes.json();
      const dData = await dRes.json();
      todasFases  = dData.fases || [];
    } catch (e) { console.error('exportarPDF:', e); }

    // ── Construir HTML de barra de fases ────────────────────────────────────
    let fasesHtml = '';
    todasFases.forEach((fase, i) => {
      const esActual   = fase.numero === p.num_fase;
      const esCompleta = fase.numero < (p.num_fase || 0);
      const col        = FASE_COLORS[fase.numero] || '#546e7a';
      const numBg      = (esActual || esCompleta) ? col : '#e0e0e0';
      const numCol     = (esActual || esCompleta) ? '#fff' : '#999';
      const nomCol     = esActual ? col : esCompleta ? col : '#bbb';
      if (i > 0) fasesHtml += '<div class="fase-arrow">›</div>';
      fasesHtml += `<div class="fase-block">
        <div class="fase-num" style="background:${numBg};color:${numCol}">${esCompleta ? '✓' : fase.numero}</div>
        <div class="fase-info">
          <div class="fase-nombre" style="color:${nomCol}">${fase.emoji || ''} F${fase.numero}</div>
          <div class="fase-sub" style="color:${esActual ? col : '#bbb'}">${(esActual || esCompleta) ? fase.nombre : '...'}</div>
        </div></div>`;
    });

    // ── Construir filas del historial ────────────────────────────────────────
    let historialRows = '';
    if (!Array.isArray(historial) || historial.length === 0) {
      historialRows = '<tr><td colspan="5" style="text-align:center;color:#aaa;padding:20px;font-style:italic">Sin registros de avance todavía</td></tr>';
    } else {
      historial.forEach(h => {
        const fecha = h.fecha ? new Date(h.fecha).toLocaleDateString('es-CO') : '—';
        historialRows += `<tr>
          <td style="white-space:nowrap">${fecha}</td>
          <td><span style="font-family:monospace;font-size:9px">${h.desde_codigo || '—'} → ${h.hasta_codigo || '—'}</span></td>
          <td>${h.desde_nombre || '—'} → ${h.hasta_nombre || '—'}</td>
          <td>${h.comentario || '—'}</td>
          <td>${h.usuario || 'Sistema'}</td>
        </tr>`;
      });
    }

    // Partir el título en dos líneas balanceadas cerca del punto medio
    const splitTitulo = (txt) => {
      const mid = Math.ceil(txt.length / 2);
      let idx = txt.lastIndexOf(' ', mid);
      if (idx <= 0) idx = txt.indexOf(' ', mid);
      if (idx <= 0) return txt;
      return txt.slice(0, idx) + '<br>' + txt.slice(idx + 1);
    };

    const logoSvg = `<svg viewBox="0 0 150 50" height="36" xmlns="http://www.w3.org/2000/svg"><style>.s0{fill:#003B71}.s1{fill:#72B5DF}</style><g><polygon class="s0" points="38.74,36.95 45.18,19.5 53.29,30.41 61.46,19.48 67.89,36.95 63.82,36.95 60.23,28.38 53.29,36.94 46.41,28.34 43,36.95"/><polygon class="s0" points="110.01,36.94 110.01,19.98 126.27,19.98 126.27,23.56 114.07,23.56 114.07,26.42 124.06,26.42 124.06,30.1 114.08,30.1 114.08,33.31 126.26,33.31 126.26,36.94"/><polygon class="s0" points="96.08,23.61 89.41,23.61 89.41,19.98 106.8,19.98 106.8,23.59 100.1,23.59 100.1,36.93 96.08,36.93"/><path class="s0" d="M140.44,33.31c-0.73,0.01-1.47-0.03-2.22-0.12c-1.35-0.16-2.63-0.57-3.77-1.44c-1.65-1.26-2.24-3.48-1.39-5.41c0.63-1.44,1.75-2.23,3.05-2.7c1.35-0.48,2.59-0.67,3.93-0.66v0l6.93,0l0-3.61l-6.97,0v0.01c-0.72,0-1.45,0.03-2.18,0.11c-2.18,0.23-4.25,0.86-6.08,2.27c-1.73,1.34-2.85,3.15-3.07,5.53c-0.29,3.14,0.85,5.57,3.15,7.32c1.6,1.22,3.4,1.81,5.29,2.1c0.96,0.15,1.92,0.21,2.88,0.21v0.01H147v-3.63H140.44z"/><path class="s0" d="M80.48,19.62L69.8,36.94h4.5l1.51-2.66h9.29l1.53,2.66h4.53L80.48,19.62z M78,30.62c0.84-1.42,1.65-2.78,2.49-4.2c0.83,1.42,1.63,2.78,2.46,4.2H78z"/><polygon class="s1" points="27.82,42.55 38.47,15.43 15.13,5.42 26.8,20.56"/><polygon class="s1" points="25.55,21.03 21.61,15.99 3,10.41 19.51,24.36 26.66,41.91"/></g></svg>`;
    const hoy = new Date().toLocaleDateString('es-CO', { day:'2-digit', month:'long', year:'numeric' });

    const html = `<!DOCTYPE html>
<html lang="es"><head>
<meta charset="UTF-8">
<title>Informe — ${p.nombre}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter','Segoe UI',sans-serif;color:#1a1a1a;background:#fff;font-size:12px;line-height:1.5}

/* Una sola regla @page — sin @page:not(:first) que Chrome no soporta */
@page{size:A4;margin:0}

/* ── PORTADA: altura A4 exacta (297mm) para evitar cortes ── */
.cover{
  width:210mm; height:297mm; overflow:hidden;
  background:linear-gradient(160deg,#1a2e58 0%,#1565C0 100%);
  color:#fff; padding:44px 52px;
  display:flex; flex-direction:column;
  page-break-after:always; position:relative;
}
.cover::before{content:'';position:absolute;top:-80px;right:-80px;width:440px;height:440px;background:radial-gradient(circle,rgba(255,255,255,0.07) 0%,transparent 70%)}
.cv-logo{background:#fff;border-radius:10px;padding:11px 20px;display:inline-block;margin-bottom:36px}
.cv-label{font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#90CAF9;margin-bottom:12px}
.cv-title{font-size:22px;font-weight:700;line-height:1.35;margin-bottom:10px;word-break:break-word}
.cv-hw{font-size:12px;color:#BBDEFB;margin-bottom:28px}
.cv-chips{display:flex;gap:8px;flex-wrap:wrap;flex:1}
.cv-chip{padding:4px 12px;border-radius:20px;font-size:10px;font-weight:600;border:1.5px solid rgba(255,255,255,0.35);align-self:flex-start}
.cv-foot{padding-top:14px;border-top:1px solid rgba(255,255,255,0.15);display:flex;justify-content:space-between;font-size:9px;color:rgba(255,255,255,0.45)}

/* ── PÁGINAS DE CONTENIDO: padding propio en lugar de @page margin ── */
.body-content{padding:14mm 18mm;width:210mm}

/* HEADER DE PÁGINA */
.pg-hdr{display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid #003B71;padding-bottom:10px;margin-bottom:22px}
.pg-hdr-right{text-align:right}
.pg-hdr-proyecto{font-size:11px;font-weight:700;color:#1565C0}
.pg-hdr-sub{font-size:9px;color:#888;letter-spacing:0.4px;text-transform:uppercase;margin-top:2px}

/* SECCIONES */
.sec{margin-bottom:24px}
.sec-title{font-size:10px;font-weight:700;color:#1F3864;text-transform:uppercase;letter-spacing:0.8px;border-left:3px solid #1565C0;padding-left:10px;margin-bottom:12px}

/* INFO CARDS */
.info-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.info-card{background:#f8f9fc;border-radius:8px;padding:12px 14px;border:1px solid #e8ecf4}
.ic-label{font-size:8px;color:#999;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px}
.ic-value{font-size:15px;font-weight:700;color:#1F3864;word-break:break-word}
.ic-sub{font-size:9px;color:#546e7a;margin-top:2px}
.estado-chip{display:inline-block;padding:3px 10px;border-radius:12px;font-size:10px;font-weight:700}

/* BARRA DE FASES */
.fases-track{display:flex;align-items:center;background:#f8f9fc;border-radius:10px;padding:14px 18px;border:1px solid #e8ecf4}
.fase-block{display:flex;align-items:center;gap:7px;flex:1;min-width:0}
.fase-num{width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex-shrink:0}
.fase-info{min-width:0}
.fase-nombre{font-size:9px;font-weight:700}
.fase-sub{font-size:7px;line-height:1.3;margin-top:1px}
.fase-arrow{color:#ccc;font-size:16px;padding:0 4px;flex-shrink:0}

/* TABLA */
table{width:100%;border-collapse:collapse;font-size:10px}
thead{background:#1F3864;color:#fff}
thead th{padding:8px 10px;text-align:left;font-size:9px;letter-spacing:0.3px;text-transform:uppercase;font-weight:600}
tbody tr:nth-child(even){background:#f8f9fc}
tbody td{padding:7px 10px;border-bottom:1px solid #eee;vertical-align:top;word-break:break-word}

/* PIE DE PÁGINA */
.pg-foot{margin-top:20px;padding-top:10px;border-top:1px solid #ddd;display:flex;justify-content:space-between;font-size:8px;color:#bbb}
</style></head><body>

<!-- ══ PORTADA — altura fija 297mm = exactamente una hoja A4 ══ -->
<div class="cover">
  <div class="cv-logo">${logoSvg}</div>
  <div class="cv-label">Informe de Proyecto · Estandarización NRD · MATEC</div>
  <div class="cv-title">${splitTitulo(p.nombre)}</div>
  <div class="cv-hw">${p.hardware || '—'} &nbsp;·&nbsp; MATEC Ingeniería AYC</div>
  <div class="cv-chips">
    <div class="cv-chip">Fase ${p.num_fase || '?'} / 5 — ${p.fase_nombre || p.fase || ''}</div>
    <div class="cv-chip">Estado: ${estadoLabel}</div>
    ${p.subfase_codigo ? `<div class="cv-chip">Nodo: ${p.subfase_codigo}</div>` : ''}
    <div class="cv-chip">${Array.isArray(historial) ? historial.length : 0} registro${historial.length !== 1 ? 's' : ''} de avance</div>
  </div>
  <div class="cv-foot">
    <span>Generado el ${hoy}</span>
    <span>IEC 61131-3 &nbsp;·&nbsp; Siemens TIA Portal &nbsp;·&nbsp; ISO 9001:2015</span>
  </div>
</div>

<!-- ══ CONTENIDO — padding propio como margen de página ══ -->
<div class="body-content">

  <div class="pg-hdr">
    <div>${logoSvg}</div>
    <div class="pg-hdr-right">
      <div class="pg-hdr-proyecto">${p.nombre}</div>
      <div class="pg-hdr-sub">Informe de Estandarización · MATEC Ingeniería AYC</div>
    </div>
  </div>

  <div class="sec">
    <div class="sec-title">Información General</div>
    <div class="info-grid">
      <div class="info-card">
        <div class="ic-label">Estado</div>
        <div class="ic-value"><span class="estado-chip" style="background:${estadoBg};color:${estadoColor}">${estadoLabel}</span></div>
      </div>
      <div class="info-card">
        <div class="ic-label">Hardware</div>
        <div class="ic-value" style="font-size:11px">${p.hardware || '—'}</div>
      </div>
      <div class="info-card">
        <div class="ic-label">Nodo Actual</div>
        <div class="ic-value">${p.subfase_codigo || '—'}</div>
        <div class="ic-sub">${p.subfase_nombre || ''}</div>
      </div>
      <div class="info-card">
        <div class="ic-label">Fecha de Inicio</div>
        <div class="ic-value" style="font-size:11px">${fmtFecha(p.fecha_inicio)}</div>
      </div>
      <div class="info-card">
        <div class="ic-label">Fecha Objetivo</div>
        <div class="ic-value" style="font-size:11px">${fmtFecha(p.fecha_objetivo)}</div>
      </div>
      <div class="info-card">
        <div class="ic-label">Avances Registrados</div>
        <div class="ic-value">${Array.isArray(historial) ? historial.length : 0}</div>
        <div class="ic-sub">entradas en historial</div>
      </div>
    </div>
  </div>

  <div class="sec">
    <div class="sec-title">Progreso de Fases</div>
    <div class="fases-track">${fasesHtml}</div>
  </div>

  <div class="sec">
    <div class="sec-title">Historial de Avances</div>
    <table>
      <thead>
        <tr>
          <th>Fecha</th><th>Código</th><th>Descripción del avance</th><th>Comentario</th><th>Registrado por</th>
        </tr>
      </thead>
      <tbody>${historialRows}</tbody>
    </table>
  </div>

  <div class="pg-foot">
    <span>MATEC · Dashboard NRD · Ingeniería AYC &nbsp;·&nbsp; ${hoy}</span>
    <span>IEC 61131-3 · Siemens TIA Portal · ISO 9001:2015 &nbsp;·&nbsp; Confidencial</span>
  </div>

</div><!-- fin .body-content -->

<script>window.onload=function(){setTimeout(function(){window.print();},500);};<\/script>
</body></html>`;

    const ventana = window.open('', '_blank', 'width=960,height=720');
    if (ventana) { ventana.document.write(html); ventana.document.close(); }
  };

  // Páginas secundarias (full-screen)
  if (pagina === 'configuracion')
    return <Configuracion onVolver={() => setPagina('dashboard')} />;
  if (pagina === 'gantt')
    return <GanttDashboard onVolver={() => setPagina('dashboard')} />;
  if (pagina === 'proyectos')
    return <ProyectosDashboard onVolver={() => setPagina('dashboard')} />;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'sans-serif', backgroundColor: '#f4f5f7' }}>

      {/* ===== SIDEBAR ===== */}
      <div style={{
        width: '280px', backgroundColor: '#1F3864', color: '#ffffff',
        display: 'flex', flexDirection: 'column',
        boxShadow: '4px 0 10px rgba(0,0,0,0.1)', zIndex: 10,
      }}>

        {/* Logo corporativo */}
        <div style={{
          padding: '16px 18px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '10px',
            padding: '10px 18px',
            width: '100%',
            boxSizing: 'border-box',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 10px rgba(0,0,0,0.25)',
          }}>
            <img
              src="/MATEC-LOGO-HEADER.svg"
              alt="MATEC"
              style={{ height: '38px', display: 'block', objectFit: 'contain' }}
            />
          </div>
          <p style={{
            margin: 0, fontSize: '10px', color: '#90CAF9',
            textAlign: 'center', letterSpacing: '0.5px', textTransform: 'uppercase',
          }}>
            Dashboard de Estandarización
          </p>
        </div>

        {/* Botones de acción rápida */}
        <div style={{ padding: '12px 10px 4px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {/* Nuevo Proyecto */}
          <button
            onClick={() => setMostrarModalNuevo(true)}
            style={{
              width: '100%', padding: '10px 15px',
              background: 'linear-gradient(135deg, #1565C0, #0D47A1)',
              color: '#fff', border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px', cursor: 'pointer',
              fontSize: '13px', fontWeight: 'bold',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              transition: 'all 0.2s',
            }}
            onMouseOver={e => e.currentTarget.style.background = 'linear-gradient(135deg, #1976D2, #1565C0)'}
            onMouseOut={e => e.currentTarget.style.background  = 'linear-gradient(135deg, #1565C0, #0D47A1)'}
          >
            ＋ Nuevo Proyecto
          </button>

          {/* Cronograma Gantt */}
          <button
            onClick={() => setPagina('gantt')}
            style={{
              width: '100%', padding: '10px 15px',
              background: 'rgba(255,255,255,0.08)',
              color: '#90CAF9', border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '8px', cursor: 'pointer',
              fontSize: '13px', fontWeight: 'bold',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
              transition: 'all 0.2s',
            }}
            onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = '#fff'; }}
            onMouseOut={e  => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#90CAF9'; }}
          >
            📊 Cronograma Gantt
          </button>

          {/* Gestión de Proyectos */}
          <button
            onClick={() => setPagina('proyectos')}
            style={{
              width: '100%', padding: '10px 15px',
              background: 'rgba(255,255,255,0.08)',
              color: '#90CAF9', border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '8px', cursor: 'pointer',
              fontSize: '13px', fontWeight: 'bold',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
              transition: 'all 0.2s',
            }}
            onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = '#fff'; }}
            onMouseOut={e  => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#90CAF9'; }}
          >
            📋 Proyectos
          </button>
        </div>

        {/* Lista de proyectos */}
        <div style={{ padding: '12px 10px', flex: 1, overflowY: 'auto' }}>
          <h3 style={{
            fontSize: '11px', textTransform: 'uppercase', color: '#90CAF9',
            paddingLeft: '10px', marginBottom: '10px',
          }}>
            Proyectos Activos
          </h3>

          {cargando ? (
            <div style={{ fontSize: '12px', color: '#546e7a', padding: '8px 10px' }}>
              Cargando...
            </div>
          ) : proyectos.length === 0 ? (
            <div style={{
              fontSize: '12px', color: '#546e7a', padding: '12px 10px',
              textAlign: 'center', lineHeight: 1.5,
            }}>
              No hay proyectos.<br/>Crea uno con el botón de arriba.
            </div>
          ) : (
            proyectos.map((proyecto) => {
              const estaActivo = proyectoSeleccionado?.id === proyecto.id;
              const faseColor  = proyecto.fase_color || '#90CAF9';
              return (
                <button
                  key={proyecto.id}
                  onClick={() => setProyectoSeleccionado(proyecto)}
                  style={{
                    width: '100%', textAlign: 'left',
                    padding: '12px 15px', marginBottom: '6px',
                    backgroundColor: estaActivo ? '#1565C0' : 'transparent',
                    color: estaActivo ? '#ffffff' : '#cdd5e0',
                    border: 'none',
                    borderLeft: `3px solid ${estaActivo ? '#fff' : faseColor}`,
                    borderRadius: '0 8px 8px 0',
                    cursor: 'pointer', fontSize: '13px',
                    fontWeight: estaActivo ? 'bold' : 'normal',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div>{proyecto.nombre}</div>
                  {proyecto.subfase_codigo && (
                    <div style={{ fontSize: '10px', marginTop: '3px', opacity: 0.7 }}>
                      Nodo {proyecto.subfase_codigo} · {proyecto.hardware?.split(' ')[0]}
                    </div>
                  )}
                  {proyecto.fecha_objetivo && (
                    <div style={{ fontSize: '10px', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '3px', color: '#ff4d4d', textShadow: '0 0 6px rgba(255,77,77,0.7), 0 0 12px rgba(255,77,77,0.4)', fontWeight: 600 }}>
                      🎯 {new Date(proyecto.fecha_objetivo).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Footer del sidebar */}
        <div style={{ padding: '12px 10px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <button
            onClick={() => setPagina('configuracion')}
            style={{
              width: '100%', textAlign: 'left', padding: '10px 15px',
              background: 'rgba(255,255,255,0.07)', color: '#90CAF9',
              border: 'none', borderRadius: '8px', cursor: 'pointer',
              fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px',
              transition: 'background 0.2s',
            }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.14)'}
            onMouseOut={e => e.currentTarget.style.background  = 'rgba(255,255,255,0.07)'}
          >
            ⚙ Configuración
          </button>
          <div style={{ padding: '8px 15px 0', fontSize: '10px', color: '#546e7a' }}>
            {proyectos.length} proyecto{proyectos.length !== 1 ? 's' : ''} cargado{proyectos.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* ===== PANEL PRINCIPAL ===== */}
      <div ref={panelRef} style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>

        {cargando ? (
          <p style={{ color: '#666' }}>Conectando con el servidor local...</p>

        ) : error ? (
          <div style={{
            color: '#7f0000', backgroundColor: '#FFCDD2',
            padding: '20px', borderRadius: '8px', border: '1px solid #B71C1C',
          }}>
            <h3>⚠ Problema de comunicación con el Backend</h3>
            <p><strong>Detalle:</strong> {error}</p>
            <p>
              Revisa que Node.js esté corriendo y que SQL Server esté disponible.
              Ejecuta <code>node server.js</code> en la carpeta del backend.
            </p>
          </div>

        ) : proyectos.length === 0 ? (
          /* ── Estado vacío: primer proyecto ── */
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', minHeight: '60vh', textAlign: 'center',
          }}>
            <div style={{ fontSize: '56px', marginBottom: '16px' }}>📋</div>
            <h2 style={{ color: '#1F3864', margin: '0 0 8px' }}>
              No hay proyectos todavía
            </h2>
            <p style={{ color: '#888', marginBottom: '24px', fontSize: '14px' }}>
              Crea tu primer proyecto para comenzar el flujo de estandarización.
            </p>
            <button
              onClick={() => setMostrarModalNuevo(true)}
              style={{
                padding: '12px 28px',
                background: 'linear-gradient(135deg, #1565C0, #0D47A1)',
                color: '#fff', border: 'none', borderRadius: '9px',
                cursor: 'pointer', fontSize: '15px', fontWeight: 'bold',
                boxShadow: '0 4px 14px rgba(21,101,192,0.4)',
              }}
            >
              ＋ Crear primer proyecto
            </button>
          </div>

        ) : proyectoSeleccionado ? (
          <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

            {/* Encabezado */}
            <div style={{
              marginBottom: '24px', display: 'flex',
              alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px',
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '6px' }}>
                  <h1 style={{ color: '#1F3864', margin: 0, fontSize: '22px' }}>
                    Detalle del Desarrollo
                  </h1>
                  <EstadoBadge estado={proyectoSeleccionado.estado} />
                </div>
                <p style={{ color: '#666', margin: 0, fontSize: '13px' }}>
                  Flujo de trabajo para: <strong>{proyectoSeleccionado.nombre}</strong>
                </p>
              </div>

              {/* Botón exportar PDF */}
              <button
                onClick={exportarPDF}
                title="Exportar informe profesional en PDF"
                style={{
                  display: 'flex', alignItems: 'center', gap: '7px',
                  padding: '9px 18px', flexShrink: 0,
                  background: 'linear-gradient(135deg, #B71C1C, #C62828)',
                  color: '#fff', border: 'none', borderRadius: '8px',
                  cursor: 'pointer', fontSize: '13px', fontWeight: 'bold',
                  boxShadow: '0 2px 10px rgba(183,28,28,0.35)',
                  transition: 'all 0.2s',
                }}
                onMouseOver={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(183,28,28,0.55)'}
                onMouseOut={e  => e.currentTarget.style.boxShadow = '0 2px 10px rgba(183,28,28,0.35)'}
              >
                📄 Exportar PDF
              </button>
            </div>

            {/* Tarjetas de métricas rápidas */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '12px', marginBottom: '24px',
            }}>
              {[
                {
                  label: 'Nodo actual',
                  value: proyectoSeleccionado.subfase_codigo || '—',
                  sub:   proyectoSeleccionado.subfase_nombre || '',
                  color: proyectoSeleccionado.fase_color || '#1565C0',
                },
                {
                  label: 'Fase',
                  value: `F${proyectoSeleccionado.num_fase || '?'}`,
                  sub:   proyectoSeleccionado.fase_nombre || proyectoSeleccionado.fase || '',
                  color: proyectoSeleccionado.fase_color || '#546e7a',
                },
                {
                  label: 'Hardware',
                  value: proyectoSeleccionado.hardware?.split(' ')[0] || '—',
                  sub:   proyectoSeleccionado.hardware || '',
                  color: '#546e7a',
                },
                {
                  label: 'Fecha objetivo',
                  value: proyectoSeleccionado.fecha_objetivo
                    ? new Date(proyectoSeleccionado.fecha_objetivo)
                        .toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
                    : 'Sin definir',
                  sub:   '',
                  color: '#37474f',
                },
              ].map((m) => (
                <div key={m.label} style={{
                  background: '#fff', borderRadius: '8px',
                  padding: '14px 16px',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                  borderLeft: `4px solid ${m.color}`,
                }}>
                  <div style={{ fontSize: '10px', color: '#999', textTransform: 'uppercase', marginBottom: '4px' }}>
                    {m.label}
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: m.color }}>
                    {m.value}
                  </div>
                  {m.sub && (
                    <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>
                      {m.sub}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Panel de avance */}
            <PanelAvance
              proyecto={proyectoSeleccionado}
              onAvance={() => cargarProyectos(proyectoSeleccionado.id)}
            />

            {/* Diagrama Mermaid */}
            <div key={`${proyectoSeleccionado.id}-${proyectoSeleccionado.subfase_codigo}`} className="animacion-fade">
              <ProjectFlowchart
                key={`${proyectoSeleccionado.id}-${proyectoSeleccionado.subfase_codigo}`}
                projectName={proyectoSeleccionado.nombre}
                hardwareType={proyectoSeleccionado.hardware}
                currentPhase={getFaseLabel(proyectoSeleccionado)}
                numFase={proyectoSeleccionado.num_fase || null}
                activeSubphase={proyectoSeleccionado.subfase_codigo || null}
              />
            </div>

          </div>
        ) : null}
      </div>

      {/* ===== MODAL NUEVO PROYECTO ===== */}
      {mostrarModalNuevo && (
        <ModalNuevoProyecto
          onCerrar={() => setMostrarModalNuevo(false)}
          onCreado={handleProyectoCreado}
        />
      )}
    </div>
  );
}

export default App;
