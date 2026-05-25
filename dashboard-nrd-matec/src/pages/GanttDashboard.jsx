import React, { useState, useEffect, useRef } from 'react';

const API = `http://${window.location.hostname}:3001`;

// ── Estilos por estado ────────────────────────────────────────────────────────
const ESTADO = {
  pendiente:  { color: '#6A1B9A', light: '#E1BEE7', label: '📌 On deck'   },
  activo:     { color: '#1565C0', light: '#BBDEFB', label: '● Activo'     },
  pausado:    { color: '#E65100', light: '#FFE0B2', label: '⏸ Pausado'    },
  completado: { color: '#2E7D32', light: '#C8E6C9', label: '✓ Completado' },
};

// ── Utilidades de fecha ───────────────────────────────────────────────────────
function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}
function daysBetween(a, b) {
  return Math.round((new Date(b) - new Date(a)) / 86_400_000);
}
function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}
function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

// ── Niveles de zoom: px por día ───────────────────────────────────────────────
const ZOOMS = [
  { label: 'Año',  px: 3  },
  { label: '6M',   px: 5  },
  { label: 'Trim', px: 8  },
  { label: 'Mes',  px: 14 },
  { label: 'Sem',  px: 24 },
];

const LEFT_COL = 340;
const ROW_H    = 72;
const BAR_H    = 30;
const HDR_H    = 44;

// ═══════════════════════════════════════════════════════════════════════════════
export default function GanttDashboard({ onVolver }) {
  const [proyectos, setProyectos] = useState([]);
  const [cargando,  setCargando]  = useState(true);
  const [error,     setError]     = useState(null);
  const [zoomIdx,   setZoomIdx]   = useState(1);          // default: 6M
  const [tooltip,   setTooltip]   = useState(null);       // { p, x, y }
  const [filtro,    setFiltro]    = useState('todos');    // todos | activo | completado | pausado
  const timelineRef = useRef(null);

  const pxPerDay = ZOOMS[zoomIdx].px;

  useEffect(() => {
    fetch(`${API}/api/proyectos/gantt`)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(d  => { setProyectos(Array.isArray(d) ? d : []); setCargando(false); })
      .catch(e => { setError(e.message); setCargando(false); });
  }, []);

  // ── Filtrado ────────────────────────────────────────────────────────────────
  const lista = filtro === 'todos'
    ? proyectos
    : proyectos.filter(p => p.estado === filtro);

  // ── Rango global de fechas ──────────────────────────────────────────────────
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let rangeStart, rangeEnd;

  if (lista.length > 0) {
    const starts = lista.map(p => p.fecha_inicio ? new Date(p.fecha_inicio) : today);
    const ends   = lista.map(p => {
      if (p.estado === 'completado' && p.completado_en) return new Date(p.completado_en);
      if (p.fecha_objetivo) return new Date(p.fecha_objetivo);
      return addDays(today, 60);
    });
    rangeStart = startOfMonth(addDays(new Date(Math.min(...starts)), -15));
    rangeEnd   = addDays(new Date(Math.max(...ends)), 45);
  } else {
    rangeStart = addDays(today, -30);
    rangeEnd   = addDays(today, 90);
  }

  const totalDays  = daysBetween(rangeStart, rangeEnd);
  const totalWidth = totalDays * pxPerDay;
  const todayPx    = daysBetween(rangeStart, today) * pxPerDay;

  // ── Cabeceras de meses ──────────────────────────────────────────────────────
  const months = [];
  let cur = new Date(rangeStart);
  cur.setDate(1);
  while (cur <= rangeEnd) {
    months.push({
      label:    cur.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' }),
      offsetPx: Math.max(0, daysBetween(rangeStart, cur) * pxPerDay),
      widthPx:  new Date(cur.getFullYear(), cur.getMonth() + 1, 0).getDate() * pxPerDay,
    });
    cur.setMonth(cur.getMonth() + 1);
  }

  // ── Scroll a "hoy" al montar ────────────────────────────────────────────────
  useEffect(() => {
    if (timelineRef.current && todayPx > 0) {
      timelineRef.current.scrollLeft = Math.max(0, todayPx - 200);
    }
  }, [cargando, zoomIdx]);

  // ── Estados de carga / error / vacío ───────────────────────────────────────
  if (cargando) return (
    <div style={styles.centered}>
      <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
      Cargando cronograma...
    </div>
  );
  if (error) return (
    <div style={styles.centered}>
      <div style={{ color: '#B71C1C', fontSize: '14px' }}>⚠ {error}</div>
      <button style={styles.btnBack} onClick={onVolver}>← Volver</button>
    </div>
  );

  const conteos = {
    pendiente:  proyectos.filter(p => p.estado === 'pendiente').length,
    activo:     proyectos.filter(p => p.estado === 'activo').length,
    pausado:    proyectos.filter(p => p.estado === 'pausado').length,
    completado: proyectos.filter(p => p.estado === 'completado').length,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'sans-serif', background: '#f4f5f7' }}>

      {/* ══ TOP BAR ══════════════════════════════════════════════════════════ */}
      <div style={{
        background: 'linear-gradient(135deg, #1F3864 0%, #0d47a1 100%)',
        color: '#fff', padding: '0 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: '60px', flexShrink: 0,
        boxShadow: '0 2px 10px rgba(0,0,0,0.25)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={onVolver} style={styles.topBtn}>← Volver</button>
          <div>
            <span style={{ fontWeight: 'bold', fontSize: '16px' }}>📊 Cronograma Gantt</span>
            <span style={{ fontSize: '11px', color: '#90CAF9', marginLeft: '12px' }}>
              {proyectos.length} proyecto{proyectos.length !== 1 ? 's' : ''} ·{' '}
              Hoy: {today.toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {/* Filtro por estado */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {[
              { key: 'todos',     label: `Todos (${proyectos.length})` },
              { key: 'pendiente', label: `On deck (${conteos.pendiente})`     },
              { key: 'activo',    label: `Activos (${conteos.activo})`        },
              { key: 'pausado',   label: `Pausados (${conteos.pausado})`      },
              { key: 'completado',label: `Completados (${conteos.completado})` },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFiltro(f.key)}
                style={{
                  ...styles.topBtn,
                  background: filtro === f.key ? '#fff' : 'rgba(255,255,255,0.12)',
                  color:      filtro === f.key ? '#1F3864' : '#fff',
                  fontWeight: filtro === f.key ? 'bold' : 'normal',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Zoom */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '11px', color: '#90CAF9', marginRight: '4px' }}>Zoom:</span>
            {ZOOMS.map((z, i) => (
              <button
                key={i}
                onClick={() => setZoomIdx(i)}
                style={{
                  ...styles.topBtn,
                  background: zoomIdx === i ? '#fff' : 'rgba(255,255,255,0.12)',
                  color:      zoomIdx === i ? '#1F3864' : '#fff',
                  fontWeight: zoomIdx === i ? 'bold' : 'normal',
                  padding: '4px 9px',
                }}
              >
                {z.label}
              </button>
            ))}
          </div>

          {/* Leyenda */}
          <div style={{ display: 'flex', gap: '10px' }}>
            {Object.entries(ESTADO).map(([k, v]) => (
              <span key={k} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#cdd5e0' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: v.light, border: `1.5px solid ${v.color}`, display: 'inline-block' }}/>
                {v.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ══ CUERPO GANTT ═════════════════════════════════════════════════════ */}
      {lista.length === 0 ? (
        <div style={styles.centered}>
          <div style={{ fontSize: '36px', marginBottom: '10px' }}>📭</div>
          <div style={{ color: '#888', fontSize: '14px' }}>Sin proyectos con ese filtro.</div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* Columna izquierda fija */}
          <div style={{
            width: LEFT_COL, minWidth: LEFT_COL,
            background: '#fff', borderRight: '1px solid #dde1e7',
            display: 'flex', flexDirection: 'column',
            boxShadow: '3px 0 8px rgba(0,0,0,0.06)', zIndex: 5,
          }}>
            {/* Cabecera */}
            <div style={{
              height: HDR_H, display: 'flex', alignItems: 'center',
              padding: '0 16px', background: '#f0f2f5',
              borderBottom: '1px solid #dde1e7', flexShrink: 0,
              fontSize: '11px', fontWeight: 'bold', color: '#666',
              textTransform: 'uppercase', letterSpacing: '0.5px',
            }}>
              Proyecto
            </div>
            {/* Filas */}
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {lista.map((p, i) => {
                const est = ESTADO[p.estado] || ESTADO.activo;
                return (
                  <div key={p.id} style={{
                    height: ROW_H, padding: '0 14px',
                    display: 'flex', alignItems: 'center',
                    borderBottom: `1px solid ${i % 2 === 0 ? '#f0f2f5' : '#e8ebf0'}`,
                    background: i % 2 === 0 ? '#fff' : '#fafbfc',
                  }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{
                        fontSize: '11px', fontWeight: 'bold', color: '#1F3864',
                        display: '-webkit-box', WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        lineHeight: '1.35', marginBottom: '4px',
                      }}>
                        {p.nombre}
                      </div>
                      <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                        <span style={{
                          fontSize: '9px', padding: '1px 6px', borderRadius: '8px',
                          background: est.light, color: est.color, fontWeight: 'bold',
                        }}>
                          {est.label}
                        </span>
                        {p.hardware && (
                          <span style={{ fontSize: '9px', color: '#aaa' }}>
                            {p.hardware.split(' ')[0]}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Timeline scrollable */}
          <div
            ref={timelineRef}
            style={{ flex: 1, overflowX: 'auto', overflowY: 'auto', position: 'relative' }}
          >
            <div style={{ width: totalWidth, position: 'relative', minHeight: '100%' }}>

              {/* ── Cabecera de meses (sticky) ── */}
              <div style={{
                height: HDR_H, position: 'sticky', top: 0,
                background: '#f0f2f5', borderBottom: '2px solid #c8cdd6',
                zIndex: 4,
              }}>
                {months.map((m, mi) => (
                  <div key={mi} style={{
                    position: 'absolute', left: m.offsetPx,
                    width: m.widthPx, height: '100%',
                    borderLeft: '1px solid #c8cdd6',
                    display: 'flex', alignItems: 'center',
                    padding: '0 8px', boxSizing: 'border-box',
                    fontSize: '11px', fontWeight: 'bold', color: '#555',
                    whiteSpace: 'nowrap', overflow: 'hidden',
                  }}>
                    {m.label}
                  </div>
                ))}
                {/* Indicador HOY en el header */}
                {todayPx >= 0 && todayPx <= totalWidth && (
                  <div style={{
                    position: 'absolute', left: todayPx - 14,
                    top: 6, zIndex: 5,
                    background: '#F44336', color: '#fff',
                    fontSize: '9px', fontWeight: 'bold',
                    padding: '2px 5px', borderRadius: '4px',
                    whiteSpace: 'nowrap',
                  }}>
                    HOY
                  </div>
                )}
              </div>

              {/* ── Filas con barras ── */}
              {lista.map((p, i) => {
                const est    = ESTADO[p.estado] || ESTADO.activo;
                const inicio = p.fecha_inicio ? new Date(p.fecha_inicio) : today;

                // fecha de fin real (barra)
                const finReal = p.estado === 'completado' && p.completado_en
                  ? new Date(p.completado_en)
                  : p.fecha_objetivo
                    ? new Date(p.fecha_objetivo)
                    : addDays(today, 60);

                // fecha objetivo (rombo marcador)
                const objetivo = p.fecha_objetivo ? new Date(p.fecha_objetivo) : null;

                const startPx   = daysBetween(rangeStart, inicio) * pxPerDay;
                const endPx     = daysBetween(rangeStart, finReal) * pxPerDay;
                const barWidth  = Math.max(endPx - startPx, 8);
                const targetPx  = objetivo ? daysBetween(rangeStart, objetivo) * pxPerDay : null;

                // progreso (F1-F5) solo para activos
                const pctFase = (p.num_fase && p.estado === 'activo')
                  ? Math.min((p.num_fase / 5) * 100, 100)
                  : null;

                return (
                  <div key={p.id} style={{
                    height: ROW_H, position: 'relative',
                    background: i % 2 === 0 ? '#fff' : '#fafbfc',
                    borderBottom: `1px solid ${i % 2 === 0 ? '#f0f2f5' : '#e8ebf0'}`,
                  }}>

                    {/* Grid de meses */}
                    {months.map((m, mi) => (
                      <div key={mi} style={{
                        position: 'absolute', left: m.offsetPx, top: 0, bottom: 0,
                        borderLeft: `1px solid ${mi % 2 === 0 ? '#eaecf0' : '#f0f2f5'}`,
                        width: m.widthPx, boxSizing: 'border-box',
                      }}/>
                    ))}

                    {/* Línea de hoy (columna) */}
                    {todayPx >= 0 && (
                      <div style={{
                        position: 'absolute', left: todayPx, top: 0, bottom: 0,
                        width: 2, background: 'rgba(244,67,54,0.35)', zIndex: 2,
                      }}/>
                    )}

                    {/* Rombo: fecha objetivo (proyectos no completados) */}
                    {targetPx !== null && p.estado !== 'completado' && (
                      <div style={{
                        position: 'absolute',
                        left: targetPx - 5,
                        top: (ROW_H - 10) / 2,
                        width: 10, height: 10,
                        background: est.color,
                        transform: 'rotate(45deg)',
                        borderRadius: '1px',
                        zIndex: 3, opacity: 0.75,
                      }}/>
                    )}

                    {/* Barra principal */}
                    <div
                      onMouseEnter={e => setTooltip({ p, x: e.clientX, y: e.clientY })}
                      onMouseMove={e => setTooltip(t => t ? { ...t, x: e.clientX, y: e.clientY } : null)}
                      onMouseLeave={() => setTooltip(null)}
                      style={{
                        position: 'absolute',
                        left: startPx,
                        top: (ROW_H - BAR_H) / 2,
                        width: barWidth, height: BAR_H,
                        background: est.color,
                        borderRadius: 6,
                        display: 'flex', alignItems: 'center',
                        overflow: 'hidden', cursor: 'pointer',
                        zIndex: 3,
                        boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
                        transition: 'filter 0.15s',
                      }}
                      onMouseOver={e  => e.currentTarget.style.filter = 'brightness(1.15)'}
                      onMouseOut={e   => e.currentTarget.style.filter = 'brightness(1)'}
                    >
                      {/* Progreso de fase (franja interior) */}
                      {pctFase !== null && (
                        <div style={{
                          position: 'absolute', left: 0, top: 0, bottom: 0,
                          width: `${pctFase}%`,
                          background: 'rgba(255,255,255,0.22)',
                          borderRight: '2px solid rgba(255,255,255,0.55)',
                        }}/>
                      )}

                      {/* Etiqueta dentro de la barra */}
                      {barWidth > 48 && (
                        <span style={{
                          color: '#fff', fontSize: '10px', fontWeight: 'bold',
                          padding: '0 9px', whiteSpace: 'nowrap',
                          overflow: 'hidden', textOverflow: 'ellipsis',
                          zIndex: 1, position: 'relative',
                        }}>
                          {p.estado === 'completado'
                            ? `✓ ${p.fase_nombre || 'Completado'}`
                            : p.fase_nombre
                              ? `F${p.num_fase} — ${p.fase_nombre}`
                              : p.subfase_codigo || ''}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Línea vertical de hoy (sobre todo) */}
              {todayPx >= 0 && todayPx <= totalWidth && (
                <div style={{
                  position: 'absolute', left: todayPx,
                  top: 0, bottom: 0, width: 2,
                  background: '#F44336',
                  zIndex: 10, pointerEvents: 'none',
                }}/>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══ TOOLTIP ══════════════════════════════════════════════════════════ */}
      {tooltip && (
        <div style={{
          position: 'fixed',
          left: tooltip.x + 16, top: tooltip.y - 8,
          zIndex: 9999, pointerEvents: 'none',
          background: '#1F3864', color: '#fff',
          padding: '11px 14px', borderRadius: '9px',
          fontSize: '12px', maxWidth: '260px',
          boxShadow: '0 6px 20px rgba(0,0,0,0.35)',
          lineHeight: 1.7,
        }}>
          <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '5px', borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: '5px' }}>
            {tooltip.p.nombre}
          </div>
          <div>🏭 {tooltip.p.hardware || '—'}</div>
          {tooltip.p.num_fase && (
            <div>📍 Fase {tooltip.p.num_fase}: {tooltip.p.fase_nombre}</div>
          )}
          {tooltip.p.subfase_codigo && (
            <div>🔵 Nodo actual: <strong>{tooltip.p.subfase_codigo}</strong></div>
          )}
          <div>🚀 Inicio: {fmtDate(tooltip.p.fecha_inicio)}</div>
          {tooltip.p.fecha_objetivo && (
            <div>🎯 Objetivo: {fmtDate(tooltip.p.fecha_objetivo)}</div>
          )}
          {tooltip.p.completado_en && (
            <div>✅ Completado: {fmtDate(tooltip.p.completado_en)}</div>
          )}
          <div style={{ marginTop: '5px', paddingTop: '5px', borderTop: '1px solid rgba(255,255,255,0.15)' }}>
            <span style={{
              fontSize: '10px', padding: '2px 7px', borderRadius: '8px',
              background: (ESTADO[tooltip.p.estado] || ESTADO.activo).light,
              color: (ESTADO[tooltip.p.estado] || ESTADO.activo).color,
              fontWeight: 'bold',
            }}>
              {(ESTADO[tooltip.p.estado] || ESTADO.activo).label}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Estilos reutilizables ─────────────────────────────────────────────────────
const styles = {
  centered: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    color: '#666', fontSize: '14px', gap: '12px',
  },
  topBtn: {
    background: 'rgba(255,255,255,0.15)', border: 'none',
    borderRadius: '6px', color: '#fff', cursor: 'pointer',
    padding: '5px 12px', fontSize: '12px',
    transition: 'background 0.15s',
  },
  btnBack: {
    padding: '8px 20px', borderRadius: '7px', marginTop: '8px',
    background: '#1565C0', color: '#fff', border: 'none', cursor: 'pointer',
  },
};
