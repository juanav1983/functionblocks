import React, { useState, useEffect, useCallback } from 'react';

const API = `http://${window.location.hostname}:3001`;

// ── Colores de estado ───────────────────────────────────────────────────────
const ESTADO_META = {
  pendiente:  { bg: '#F3E5F5', color: '#6A1B9A', label: '📌 On deck'   },
  activo:     { bg: '#E8F5E9', color: '#2E7D32', label: '● Activo'     },
  pausado:    { bg: '#FFF3E0', color: '#E65100', label: '⏸ Pausado'    },
  completado: { bg: '#E3F2FD', color: '#1565C0', label: '✓ Completado' },
  archivado:  { bg: '#EEEEEE', color: '#546E7A', label: '📦 Archivado' },
};

const Badge = ({ estado }) => {
  const m = ESTADO_META[estado] || ESTADO_META.activo;
  return (
    <span style={{
      fontSize: '10px', fontWeight: 700, padding: '3px 9px',
      borderRadius: '12px', background: m.bg, color: m.color,
      whiteSpace: 'nowrap',
    }}>
      {m.label}
    </span>
  );
};

const fmtFecha = (f) => {
  if (!f) return '—';
  try { return new Date(f).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return String(f); }
};

// ═══════════════════════════════════════════════════════════════════════════
// MODAL DE EDICIÓN
// ═══════════════════════════════════════════════════════════════════════════
function ModalEditar({ proyecto, hardwareTipos, onGuardar, onCerrar }) {
  const toDateInput = (f) => {
    if (!f) return '';
    try { return new Date(f).toISOString().split('T')[0]; }
    catch { return ''; }
  };

  const [form, setForm] = useState({
    nombre:           proyecto.nombre || '',
    descripcion:      proyecto.descripcion || '',
    hardware_tipo_id: proyecto.hardware_tipo_id || '',
    fecha_inicio:     toDateInput(proyecto.fecha_inicio),
    fecha_objetivo:   toDateInput(proyecto.fecha_objetivo),
    estado:           proyecto.estado || 'activo',
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError]         = useState(null);

  // Si el proyecto no trae hardware_tipo_id (API antigua), lo inicializamos
  // con el primer tipo disponible en cuanto cargan hardwareTipos.
  useEffect(() => {
    if (!form.hardware_tipo_id && hardwareTipos.length > 0) {
      setForm(f => ({ ...f, hardware_tipo_id: String(hardwareTipos[0].id) }));
    }
  }, [hardwareTipos]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onCerrar(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onCerrar]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const guardar = async () => {
    if (!form.nombre.trim()) return setError('El nombre es obligatorio.');
    setGuardando(true);
    setError(null);
    try {
      const r = await fetch(`${API}/api/proyectos/${proyecto.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!r.ok) { const d = await r.json(); throw new Error(d.error || 'Error al guardar'); }
      onGuardar();
    } catch (e) {
      setError(e.message);
      setGuardando(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '9px 12px', borderRadius: '7px',
    border: '1px solid #dde3ec', fontSize: '13px',
    fontFamily: 'inherit', background: '#f8fafd', boxSizing: 'border-box',
    outline: 'none', transition: 'border 0.15s',
  };
  const labelStyle = {
    fontSize: '11px', fontWeight: 600, color: '#546e7a',
    textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px',
    display: 'block',
  };
  const rowStyle = { marginBottom: '14px' };

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onCerrar(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9000,
        background: 'rgba(10,20,40,0.55)', backdropFilter: 'blur(3px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div style={{
        background: '#fff', borderRadius: '14px', padding: '32px 36px',
        width: '520px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        animation: 'popIn 0.18s ease',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', color: '#1F3864' }}>✏️ Editar Proyecto</h2>
          <button onClick={onCerrar} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#aaa', lineHeight: 1 }}>×</button>
        </div>

        {error && (
          <div style={{ background: '#FFCDD2', color: '#B71C1C', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
            ⚠ {error}
          </div>
        )}

        <div style={rowStyle}>
          <label style={labelStyle}>Nombre del proyecto</label>
          <input style={inputStyle} value={form.nombre} onChange={e => set('nombre', e.target.value)} />
        </div>

        <div style={rowStyle}>
          <label style={labelStyle}>Descripción</label>
          <textarea
            style={{ ...inputStyle, minHeight: '72px', resize: 'vertical' }}
            value={form.descripcion}
            onChange={e => set('descripcion', e.target.value)}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
          <div>
            <label style={labelStyle}>Tipo de Hardware</label>
            <select style={inputStyle} value={String(form.hardware_tipo_id)} onChange={e => set('hardware_tipo_id', e.target.value)}>
              {hardwareTipos.map(h => (
                <option key={h.id} value={String(h.id)}>{h.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Estado</label>
            <select style={inputStyle} value={form.estado} onChange={e => set('estado', e.target.value)}>
              {Object.entries(ESTADO_META).map(([k, m]) => (
                <option key={k} value={k}>{m.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
          <div>
            <label style={labelStyle}>Fecha de inicio</label>
            <input type="date" style={inputStyle} value={form.fecha_inicio} onChange={e => set('fecha_inicio', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Fecha objetivo</label>
            <input type="date" style={inputStyle} value={form.fecha_objetivo} onChange={e => set('fecha_objetivo', e.target.value)} />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button onClick={onCerrar} style={{
            padding: '10px 22px', borderRadius: '8px', border: '1px solid #dde3ec',
            background: '#f0f2f5', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
          }}>
            Cancelar
          </button>
          <button
            onClick={guardar}
            disabled={guardando}
            style={{
              padding: '10px 24px', borderRadius: '8px', border: 'none',
              background: guardando ? '#90CAF9' : 'linear-gradient(135deg,#1565C0,#0D47A1)',
              color: '#fff', cursor: guardando ? 'not-allowed' : 'pointer',
              fontSize: '13px', fontWeight: 700,
              boxShadow: '0 2px 8px rgba(21,101,192,0.35)',
            }}
          >
            {guardando ? 'Guardando...' : '💾 Guardar cambios'}
          </button>
        </div>
      </div>
      <style>{`@keyframes popIn { from { opacity:0; transform:scale(0.94); } to { opacity:1; transform:scale(1); } }`}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MODAL DE CONFIRMACIÓN DE ELIMINACIÓN
// ═══════════════════════════════════════════════════════════════════════════
function ModalConfirmarEliminar({ proyecto, onConfirmar, onCerrar }) {
  const [eliminando, setEliminando] = useState(false);
  const [error, setError]           = useState(null);

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onCerrar(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onCerrar]);

  const confirmar = async () => {
    setEliminando(true);
    setError(null);
    try {
      const r = await fetch(`${API}/api/proyectos/${proyecto.id}`, { method: 'DELETE' });
      if (!r.ok) { const d = await r.json(); throw new Error(d.error || 'Error al eliminar'); }
      onConfirmar();
    } catch (e) {
      setError(e.message);
      setEliminando(false);
    }
  };

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onCerrar(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9100,
        background: 'rgba(10,20,40,0.6)', backdropFilter: 'blur(3px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div style={{
        background: '#fff', borderRadius: '14px', padding: '32px 36px',
        width: '420px', maxWidth: '95vw',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        animation: 'popIn 0.18s ease', textAlign: 'center',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>🗑️</div>
        <h2 style={{ margin: '0 0 10px', fontSize: '18px', color: '#B71C1C' }}>Eliminar proyecto</h2>
        <p style={{ color: '#555', fontSize: '14px', margin: '0 0 6px' }}>
          ¿Estás seguro de que deseas eliminar el proyecto:
        </p>
        <p style={{ color: '#1F3864', fontSize: '15px', fontWeight: 700, margin: '0 0 20px' }}>
          "{proyecto.nombre}"
        </p>
        <p style={{ color: '#888', fontSize: '12px', margin: '0 0 24px' }}>
          Esta acción también eliminará todo el historial de avances del proyecto y <strong>no se puede deshacer</strong>.
        </p>

        {error && (
          <div style={{ background: '#FFCDD2', color: '#B71C1C', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
            ⚠ {error}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
          <button onClick={onCerrar} style={{
            padding: '10px 24px', borderRadius: '8px', border: '1px solid #dde3ec',
            background: '#f0f2f5', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
          }}>
            Cancelar
          </button>
          <button
            onClick={confirmar}
            disabled={eliminando}
            style={{
              padding: '10px 24px', borderRadius: '8px', border: 'none',
              background: eliminando ? '#EF9A9A' : 'linear-gradient(135deg,#C62828,#B71C1C)',
              color: '#fff', cursor: eliminando ? 'not-allowed' : 'pointer',
              fontSize: '13px', fontWeight: 700,
              boxShadow: '0 2px 8px rgba(183,28,28,0.35)',
            }}
          >
            {eliminando ? 'Eliminando...' : '🗑 Sí, eliminar'}
          </button>
        </div>
      </div>
      <style>{`@keyframes popIn { from { opacity:0; transform:scale(0.94); } to { opacity:1; transform:scale(1); } }`}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// DASHBOARD PRINCIPAL DE PROYECTOS
// ═══════════════════════════════════════════════════════════════════════════
export default function ProyectosDashboard({ onVolver }) {
  const [proyectos,    setProyectos]    = useState([]);
  const [hwTipos,      setHwTipos]      = useState([]);
  const [cargando,     setCargando]     = useState(true);
  const [error,        setError]        = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [busqueda,     setBusqueda]     = useState('');
  const [editando,     setEditando]     = useState(null);   // proyecto a editar
  const [eliminando,   setEliminando]   = useState(null);   // proyecto a eliminar
  const [toast,        setToast]        = useState(null);   // mensaje de éxito

  const cargar = useCallback(() => {
    setCargando(true);
    Promise.all([
      fetch(`${API}/api/proyectos`).then(r => r.json()),
      fetch(`${API}/api/hardware-tipos`).then(r => r.json()),
    ])
      .then(([ps, hw]) => {
        setProyectos(Array.isArray(ps) ? ps : []);
        setHwTipos(Array.isArray(hw) ? hw : []);
        setCargando(false);
      })
      .catch(e => { setError(e.message); setCargando(false); });
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const mostrarToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleGuardado = () => {
    setEditando(null);
    cargar();
    mostrarToast('✅ Proyecto actualizado correctamente');
  };

  const handleEliminado = () => {
    setEliminando(null);
    cargar();
    mostrarToast('🗑 Proyecto eliminado');
  };

  // ── Filtrado ────────────────────────────────────────────────────────────
  const proyectosFiltrados = proyectos.filter(p => {
    const cumpleEstado  = filtroEstado === 'todos' || p.estado === filtroEstado;
    const cumpleBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                           (p.hardware || '').toLowerCase().includes(busqueda.toLowerCase());
    return cumpleEstado && cumpleBusqueda;
  });

  // ── Estilos reutilizables ───────────────────────────────────────────────
  const thStyle = {
    padding: '11px 14px', textAlign: 'left',
    fontSize: '11px', fontWeight: 700, color: '#546e7a',
    textTransform: 'uppercase', letterSpacing: '0.6px',
    borderBottom: '2px solid #e8edf4', background: '#f4f7fb',
    whiteSpace: 'nowrap',
  };
  const tdStyle = {
    padding: '13px 14px', borderBottom: '1px solid #eef1f6',
    fontSize: '13px', color: '#2c3e50', verticalAlign: 'middle',
  };
  const btnIconStyle = (bg, shadow) => ({
    padding: '6px 12px', borderRadius: '6px', border: 'none',
    background: bg, color: '#fff', cursor: 'pointer',
    fontSize: '12px', fontWeight: 600,
    boxShadow: shadow, transition: 'opacity 0.15s',
  });

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f8', padding: '36px 40px', fontFamily: "'Inter','Segoe UI',system-ui,sans-serif" }}>

      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position: 'fixed', top: '20px', right: '24px', zIndex: 9999,
          background: '#1F3864', color: '#fff', padding: '12px 22px',
          borderRadius: '10px', fontSize: '13px', fontWeight: 600,
          boxShadow: '0 6px 24px rgba(0,0,0,0.25)',
          animation: 'slideIn 0.25s ease',
        }}>
          {toast}
        </div>
      )}

      {/* ── Cabecera ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            onClick={onVolver}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 16px', borderRadius: '8px',
              border: '1px solid #dde3ec', background: '#fff',
              cursor: 'pointer', fontSize: '13px', color: '#546e7a', fontWeight: 600,
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}
          >
            ← Volver
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', color: '#1F3864', fontWeight: 800 }}>
              Gestión de Proyectos
            </h1>
            <p style={{ margin: 0, fontSize: '12px', color: '#90a4ae', marginTop: '2px' }}>
              {proyectos.length} proyecto{proyectos.length !== 1 ? 's' : ''} en total
            </p>
          </div>
        </div>
      </div>

      {/* ── Filtros ── */}
      <div style={{
        background: '#fff', borderRadius: '12px', padding: '16px 20px',
        marginBottom: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center',
        boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
      }}>
        <input
          type="text"
          placeholder="🔍 Buscar por nombre o hardware..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          style={{
            flex: 1, minWidth: '200px', padding: '9px 13px', borderRadius: '8px',
            border: '1px solid #dde3ec', fontSize: '13px', outline: 'none',
            background: '#f8fafd',
          }}
        />
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {['todos', 'activo', 'pendiente', 'pausado', 'completado', 'archivado'].map(e => (
            <button
              key={e}
              onClick={() => setFiltroEstado(e)}
              style={{
                padding: '7px 14px', borderRadius: '20px', border: 'none',
                cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                background: filtroEstado === e ? '#1565C0' : '#f0f2f5',
                color:      filtroEstado === e ? '#fff'     : '#546e7a',
                transition: 'all 0.15s',
              }}
            >
              {e === 'todos' ? 'Todos' : ESTADO_META[e]?.label || e}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tabla ── */}
      <div style={{
        background: '#fff', borderRadius: '14px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.07)', overflow: 'hidden',
      }}>
        {cargando ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#90a4ae', fontSize: '14px' }}>
            Cargando proyectos...
          </div>
        ) : error ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#B71C1C', fontSize: '14px' }}>
            ⚠ {error}
          </div>
        ) : proyectosFiltrados.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#90a4ae', fontSize: '14px' }}>
            No se encontraron proyectos con ese filtro.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, width: '40px' }}>#</th>
                  <th style={thStyle}>Nombre</th>
                  <th style={thStyle}>Hardware</th>
                  <th style={thStyle}>Estado</th>
                  <th style={thStyle}>Nodo actual</th>
                  <th style={thStyle}>Fecha inicio</th>
                  <th style={thStyle}>Fecha objetivo</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {proyectosFiltrados.map((p, i) => (
                  <tr
                    key={p.id}
                    style={{ transition: 'background 0.12s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8faff'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ ...tdStyle, color: '#b0bec5', fontWeight: 600 }}>{i + 1}</td>
                    <td style={{ ...tdStyle, fontWeight: 700, color: '#1F3864', maxWidth: '240px' }}>
                      {p.nombre}
                    </td>
                    <td style={{ ...tdStyle, color: '#546e7a', fontSize: '12px' }}>
                      {p.hardware || '—'}
                    </td>
                    <td style={tdStyle}>
                      <Badge estado={p.estado} />
                    </td>
                    <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: '12px', color: '#1565C0', fontWeight: 700 }}>
                      {p.subfase_codigo || '—'}
                    </td>
                    <td style={{ ...tdStyle, color: '#546e7a', fontSize: '12px', whiteSpace: 'nowrap' }}>
                      {fmtFecha(p.fecha_inicio)}
                    </td>
                    <td style={{ ...tdStyle, fontSize: '12px', whiteSpace: 'nowrap' }}>
                      {p.fecha_objetivo ? (
                        <span style={{
                          color: '#ff4d4d', fontWeight: 700,
                          textShadow: '0 0 6px rgba(255,77,77,0.5)',
                        }}>
                          🎯 {fmtFecha(p.fecha_objetivo)}
                        </span>
                      ) : '—'}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button
                          onClick={() => setEditando(p)}
                          style={btnIconStyle(
                            'linear-gradient(135deg,#1565C0,#0D47A1)',
                            '0 2px 6px rgba(21,101,192,0.3)'
                          )}
                        >
                          ✏️ Editar
                        </button>
                        <button
                          onClick={() => setEliminando(p)}
                          style={btnIconStyle(
                            'linear-gradient(135deg,#C62828,#B71C1C)',
                            '0 2px 6px rgba(183,28,28,0.3)'
                          )}
                        >
                          🗑 Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modales ── */}
      {editando && (
        <ModalEditar
          proyecto={editando}
          hardwareTipos={hwTipos}
          onGuardar={handleGuardado}
          onCerrar={() => setEditando(null)}
        />
      )}
      {eliminando && (
        <ModalConfirmarEliminar
          proyecto={eliminando}
          onConfirmar={handleEliminado}
          onCerrar={() => setEliminando(null)}
        />
      )}

      <style>{`
        @keyframes slideIn {
          from { opacity:0; transform:translateX(20px); }
          to   { opacity:1; transform:translateX(0); }
        }
      `}</style>
    </div>
  );
}
