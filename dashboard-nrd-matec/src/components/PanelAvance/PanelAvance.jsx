import React, { useState, useEffect, useCallback } from 'react';

const API = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3001`;

// ── Colores por tipo de transición ────────────────────────────────────────────
const TIPO_ESTILO = {
  si:         { bg: '#2E7D32', hover: '#1B5E20', texto: '#fff', icono: '✓' },
  no:         { bg: '#B71C1C', hover: '#7F0000', texto: '#fff', icono: '✗' },
  correctivo: { bg: '#E65100', hover: '#BF360C', texto: '#fff', icono: '⚠' },
  normal:     { bg: '#1565C0', hover: '#0D47A1', texto: '#fff', icono: '▶' },
  fin:        { bg: '#1F3864', hover: '#0d2146', texto: '#fff', icono: '🏁' },
};

// ── Colores por acción en el historial ───────────────────────────────────────
const ACCION_ESTILO = {
  'avanzó':     { color: '#2E7D32', bg: '#E8F5E9', icono: '▶', label: 'Avanzó' },
  'retrocedió': { color: '#B71C1C', bg: '#FFEBEE', icono: '◀', label: 'Retrocedió' },
  'completó':   { color: '#1F3864', bg: '#E3F2FD', icono: '🏁', label: 'Completó' },
  'inició':     { color: '#6A1B9A', bg: '#F3E5F5', icono: '🚀', label: 'Inició' },
  'bloqueó':    { color: '#E65100', bg: '#FFF3E0', icono: '⛔', label: 'Bloqueó' },
};

const FASE_COLORES = ['#1565C0','#2E7D32','E65100','#B71C1C','#6A1B9A'];

// ── Formatea fecha legible ───────────────────────────────────────────────────
function fmtFecha(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  return d.toLocaleString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ── Mini barra de progreso dentro de una fase ─────────────────────────────────
function BarraProgreso({ subfaseActual }) {
  if (!subfaseActual) return null;
  const orden = parseInt(subfaseActual.codigo?.slice(1)) || 0;
  const pct   = Math.min((orden / 5) * 100, 100);
  const color = FASE_COLORES[(subfaseActual.fase_numero || 1) - 1] || '#1565C0';
  return (
    <div style={{ margin: '8px 0 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ flex: 1, background: '#e0e0e0', borderRadius: '4px', height: '5px', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, background: color, height: '100%', borderRadius: '4px', transition: 'width 0.4s ease' }}/>
      </div>
      <span style={{ fontSize: '10px', color: '#888', whiteSpace: 'nowrap' }}>Paso {orden}/5</span>
    </div>
  );
}

// ── Botón de acción con hover ─────────────────────────────────────────────────
function BtnAccion({ paso, onClick, disabled }) {
  const [hover, setHover] = useState(false);
  const tipo    = paso.es_fin ? 'fin' : (paso.tipo || 'normal');
  const estilo  = TIPO_ESTILO[tipo] || TIPO_ESTILO.normal;
  const etiquetaVisible = paso.etiqueta || paso.nombre;

  return (
    <button
      onClick={() => onClick(paso)}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '10px 18px', border: 'none', borderRadius: '8px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        background: disabled ? '#bdbdbd' : hover ? estilo.hover : estilo.bg,
        color: estilo.texto, fontSize: '13px', fontWeight: 'bold',
        transition: 'all 0.15s',
        boxShadow: hover && !disabled ? '0 2px 8px rgba(0,0,0,0.25)' : 'none',
        transform: hover && !disabled ? 'translateY(-1px)' : 'none',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <span style={{ fontSize: '15px' }}>{estilo.icono}</span>
      <div style={{ textAlign: 'left' }}>
        <div>{etiquetaVisible}</div>
        {paso.etiqueta && paso.nombre && paso.etiqueta !== paso.nombre && (
          <div style={{ fontSize: '10px', opacity: 0.8, fontWeight: 'normal' }}>→ {paso.nombre}</div>
        )}
      </div>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODAL: HISTORIAL DE FASES
// ═══════════════════════════════════════════════════════════════════════════════
function ModalHistorial({ proyectoId, proyectoNombre, onCerrar }) {
  const [entradas, setEntradas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error,    setError]    = useState(null);

  const cargar = useCallback(() => {
    setCargando(true);
    fetch(`${API}/api/proyectos/${proyectoId}/historial`)
      .then(r => r.json())
      .then(data => {
        setEntradas(Array.isArray(data) ? data : []);
        setCargando(false);
      })
      .catch(e => { setError(e.message); setCargando(false); });
  }, [proyectoId]);

  useEffect(() => { cargar(); }, [cargar]);

  // Cerrar con Escape
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onCerrar(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onCerrar]);

  return (
    // Overlay
    <div
      onClick={e => { if (e.target === e.currentTarget) onCerrar(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '40px 16px',
      }}
    >
      {/* Panel */}
      <div style={{
        background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '640px',
        maxHeight: '80vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        animation: 'fadeInDown 0.2s ease',
      }}>

        {/* Header */}
        <div style={{
          background: '#1F3864', color: '#fff', padding: '16px 20px',
          borderRadius: '12px 12px 0 0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        }}>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '15px' }}>📋 Historial de Fases</div>
            <div style={{ fontSize: '11px', color: '#90CAF9', marginTop: '2px' }}>
              {proyectoNombre}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={cargar}
              title="Recargar historial"
              style={{
                background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '6px',
                color: '#fff', cursor: 'pointer', padding: '5px 10px', fontSize: '12px',
              }}
            >
              ↻ Actualizar
            </button>
            <button
              onClick={onCerrar}
              style={{
                background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '6px',
                color: '#fff', cursor: 'pointer', padding: '5px 10px', fontSize: '14px',
                fontWeight: 'bold',
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Cuerpo scrolleable */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '16px 20px' }}>

          {cargando && (
            <div style={{ textAlign: 'center', padding: '30px', color: '#888', fontSize: '13px' }}>
              Cargando historial...
            </div>
          )}

          {error && (
            <div style={{
              background: '#FFEBEE', color: '#B71C1C', padding: '12px 14px',
              borderRadius: '8px', fontSize: '13px',
            }}>
              ⚠ {error}
            </div>
          )}

          {!cargando && !error && entradas.length === 0 && (
            <div style={{
              textAlign: 'center', padding: '40px 20px', color: '#888',
            }}>
              <div style={{ fontSize: '36px', marginBottom: '10px' }}>📭</div>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#555' }}>Sin registros todavía</div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>
                Cada vez que avances una subfase quedará registrado aquí.
              </div>
            </div>
          )}

          {/* Timeline */}
          {!cargando && entradas.length > 0 && (
            <div style={{ position: 'relative' }}>
              {/* Línea vertical de la timeline */}
              <div style={{
                position: 'absolute', left: '19px', top: '8px', bottom: '8px',
                width: '2px', background: '#e0e0e0',
              }}/>

              {entradas.map((e, idx) => {
                const est = ACCION_ESTILO[e.accion] || ACCION_ESTILO['avanzó'];
                const esPrimero = idx === 0;
                const faseDesde = e.desde_fase_num;
                const fasaHasta = e.hasta_fase_num;
                const cambioFase = faseDesde !== fasaHasta && fasaHasta !== null;

                return (
                  <div key={e.id} style={{
                    display: 'flex', gap: '14px', marginBottom: '16px',
                    position: 'relative',
                  }}>
                    {/* Círculo de la timeline */}
                    <div style={{
                      width: '38px', minWidth: '38px', height: '38px',
                      borderRadius: '50%', background: est.bg,
                      border: `2px solid ${est.color}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '15px', zIndex: 1,
                      boxShadow: esPrimero ? `0 0 0 3px ${est.color}33` : 'none',
                    }}>
                      {est.icono}
                    </div>

                    {/* Contenido de la entrada */}
                    <div style={{
                      flex: 1, background: esPrimero ? est.bg : '#fafafa',
                      border: `1px solid ${esPrimero ? est.color + '55' : '#eee'}`,
                      borderRadius: '8px', padding: '10px 14px',
                      transition: 'all 0.2s',
                    }}>
                      {/* Fila superior: acción + fecha */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px', marginBottom: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{
                            fontSize: '11px', fontWeight: 'bold', padding: '2px 8px',
                            borderRadius: '10px', color: est.color, background: est.bg,
                            border: `1px solid ${est.color}44`,
                          }}>
                            {est.label}
                          </span>
                          {cambioFase && (
                            <span style={{
                              fontSize: '10px', padding: '2px 7px', borderRadius: '10px',
                              background: '#E3F2FD', color: '#1565C0', fontWeight: 'bold',
                            }}>
                              Cambio de Fase {faseDesde}→{fasaHasta}
                            </span>
                          )}
                          {esPrimero && (
                            <span style={{
                              fontSize: '10px', padding: '2px 7px', borderRadius: '10px',
                              background: '#F3E5F5', color: '#6A1B9A', fontWeight: 'bold',
                            }}>
                              Último
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '11px', color: '#999', whiteSpace: 'nowrap' }}>
                          🕐 {fmtFecha(e.fecha)}
                        </span>
                      </div>

                      {/* Transición de nodos */}
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        flexWrap: 'wrap', marginBottom: e.comentario || e.usuario ? '8px' : 0,
                      }}>
                        {e.desde_codigo ? (
                          <span style={{
                            fontFamily: 'monospace', fontWeight: 'bold', fontSize: '12px',
                            background: '#f0f0f0', padding: '3px 8px', borderRadius: '5px',
                            color: '#444',
                          }}>
                            [{e.desde_codigo}] {e.desde_nombre}
                          </span>
                        ) : (
                          <span style={{
                            fontFamily: 'monospace', fontSize: '12px',
                            background: '#E8F5E9', padding: '3px 8px', borderRadius: '5px',
                            color: '#2E7D32', fontWeight: 'bold',
                          }}>
                            🚀 INICIO
                          </span>
                        )}

                        <span style={{ color: est.color, fontSize: '16px', fontWeight: 'bold' }}>→</span>

                        {e.hasta_codigo ? (
                          <span style={{
                            fontFamily: 'monospace', fontWeight: 'bold', fontSize: '12px',
                            background: est.bg, padding: '3px 8px', borderRadius: '5px',
                            color: est.color, border: `1px solid ${est.color}44`,
                          }}>
                            [{e.hasta_codigo}] {e.hasta_nombre}
                          </span>
                        ) : (
                          <span style={{
                            fontFamily: 'monospace', fontSize: '12px',
                            background: '#E3F2FD', padding: '3px 8px', borderRadius: '5px',
                            color: '#1F3864', fontWeight: 'bold',
                          }}>
                            🏁 FIN
                          </span>
                        )}
                      </div>

                      {/* Responsable y comentario */}
                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        {e.usuario && (
                          <div style={{ fontSize: '11px', color: '#666', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span>👤</span>
                            <span>
                              <strong>{e.usuario}</strong>
                              {e.usuario_rol && <span style={{ color: '#aaa' }}> · {e.usuario_rol}</span>}
                            </span>
                          </div>
                        )}
                        {e.comentario && (
                          <div style={{
                            fontSize: '11px', color: '#555',
                            fontStyle: 'italic', display: 'flex', alignItems: 'flex-start', gap: '4px',
                          }}>
                            <span>💬</span>
                            <span>"{e.comentario}"</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Punto de inicio al final */}
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                <div style={{
                  width: '38px', minWidth: '38px', height: '38px', borderRadius: '50%',
                  background: '#E8F5E9', border: '2px solid #2E7D32',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1,
                }}>
                  🚀
                </div>
                <span style={{ fontSize: '12px', color: '#999', fontStyle: 'italic' }}>
                  Inicio del proyecto
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px', borderTop: '1px solid #f0f0f0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: '#fafafa', borderRadius: '0 0 12px 12px',
        }}>
          <span style={{ fontSize: '11px', color: '#aaa' }}>
            {entradas.length} registro{entradas.length !== 1 ? 's' : ''} · Esc para cerrar
          </span>
          <button
            onClick={onCerrar}
            style={{
              padding: '7px 18px', background: '#1F3864', color: '#fff',
              border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px',
            }}
          >
            Cerrar
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL: PANEL DE AVANCE
// ═══════════════════════════════════════════════════════════════════════════════
export default function PanelAvance({ proyecto, onAvance }) {
  const [pasos,          setPasos]          = useState([]);
  const [subActual,      setSubActual]      = useState(null);
  const [usuarios,       setUsuarios]       = useState([]);
  const [usuarioId,      setUsuarioId]      = useState('');
  const [comentario,     setComentario]     = useState('');
  const [enviando,       setEnviando]       = useState(false);
  const [mensaje,        setMensaje]        = useState(null);
  const [mostrarForm,    setMostrarForm]    = useState(false);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);

  // Cargar usuarios activos una sola vez
  useEffect(() => {
    fetch(`${API}/api/admin/usuarios`)
      .then(r => r.json())
      .then(d => setUsuarios(Array.isArray(d) ? d.filter(u => u.activo) : []))
      .catch(() => setUsuarios([]));
  }, []);

  // Cargar posibles pasos cuando cambia el proyecto
  useEffect(() => {
    if (!proyecto?.id) return;
    setMensaje(null);
    setMostrarForm(false);

    fetch(`${API}/api/proyectos/${proyecto.id}/pasos-siguientes`)
      .then(r => r.json())
      .then(data => {
        setPasos(data.pasos       || []);
        setSubActual(data.subfase_actual || null);
      })
      .catch(() => { setPasos([]); setSubActual(null); });
  }, [proyecto?.id, proyecto?.subfase_codigo]);

  const avanzar = async (paso) => {
    if (!comentario.trim()) {
      setMensaje({ texto: 'Debes ingresar un comentario antes de registrar el avance.', tipo: 'error' });
      return;
    }
    setEnviando(true);
    setMensaje(null);
    try {
      const r = await fetch(`${API}/api/proyectos/${proyecto.id}/avanzar`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subfase_hasta_id: paso.es_fin ? null : paso.subfase_id,
          completar:        paso.es_fin || undefined,
          accion: paso.tipo === 'si'          ? 'avanzó'
                : paso.tipo === 'no'          ? 'retrocedió'
                : paso.tipo === 'correctivo'  ? 'retrocedió'
                : paso.es_fin                ? 'completó'
                :                              'avanzó',
          usuario_id: usuarioId ? parseInt(usuarioId) : null,
          comentario: comentario.trim() || null,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);

      setMensaje({
        texto: paso.es_fin
          ? '🏁 ¡Proyecto completado exitosamente!'
          : `✓ Avanzado a: ${paso.nombre}`,
        tipo: 'ok',
      });
      setComentario('');
      setMostrarForm(false);
      onAvance();
    } catch (e) {
      setMensaje({ texto: e.message, tipo: 'error' });
    }
    setEnviando(false);
  };

  // ── Proyecto completado ───────────────────────────────────────────────────
  if (proyecto?.estado === 'completado') {
    return (
      <>
        <div style={{
          background: 'linear-gradient(135deg, #1F3864 0%, #1565C0 100%)',
          borderRadius: '10px', padding: '18px 24px', marginBottom: '20px',
          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ fontSize: '32px' }}>🏁</span>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '15px' }}>Proyecto completado</div>
              <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '2px' }}>
                Este bloque de función ha sido publicado en la Biblioteca MATEC.
              </div>
            </div>
          </div>
          <button
            onClick={() => setMostrarHistorial(true)}
            style={{
              padding: '7px 14px', background: 'rgba(255,255,255,0.18)',
              border: '1px solid rgba(255,255,255,0.3)', borderRadius: '7px',
              color: '#fff', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold',
            }}
          >
            📋 Ver historial
          </button>
        </div>

        {mostrarHistorial && (
          <ModalHistorial
            proyectoId={proyecto.id}
            proyectoNombre={proyecto.nombre}
            onCerrar={() => setMostrarHistorial(false)}
          />
        )}
      </>
    );
  }

  if (!pasos.length && !subActual) return null;

  const esDecision = subActual?.es_decision;

  return (
    <>
      <div style={{
        background: '#fff', borderRadius: '10px', marginBottom: '20px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        border: '1px solid #e8ecf4', overflow: 'hidden',
      }}>

        {/* ── Header ── */}
        <div style={{
          background: '#f8f9fa', padding: '11px 18px',
          borderBottom: '1px solid #e8ecf4',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: '8px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{
              background: esDecision ? '#FFF9C4' : '#E3F2FD',
              border: `1px solid ${esDecision ? '#F9A825' : '#1565C0'}`,
              borderRadius: '6px', padding: '3px 9px',
              fontSize: '11px', fontWeight: 'bold',
              color: esDecision ? '#F57F17' : '#1565C0',
            }}>
              {esDecision ? '◇ Gate de decisión' : '▶ Siguiente acción'}
            </div>
            <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#1F3864' }}>
              [{subActual?.codigo}] {subActual?.nombre}
            </span>
          </div>

          {/* Botones del header */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => setMostrarHistorial(true)}
              style={{
                padding: '6px 12px',
                background: '#fff', border: '1px solid #ccc',
                borderRadius: '6px', cursor: 'pointer',
                fontSize: '12px', color: '#444', fontWeight: 'bold',
                display: 'flex', alignItems: 'center', gap: '5px',
              }}
              title="Ver historial de fases"
            >
              📋 Historial
            </button>
            <button
              onClick={() => setMostrarForm(v => !v)}
              style={{
                padding: '6px 12px',
                background: mostrarForm ? '#e8ecf4' : '#1565C0',
                color: mostrarForm ? '#555' : '#fff',
                border: mostrarForm ? '1px solid #ccc' : 'none',
                borderRadius: '6px', cursor: 'pointer',
                fontSize: '12px', fontWeight: 'bold',
              }}
            >
              {mostrarForm ? '▲ Ocultar formulario' : '⚡ Registrar avance'}
            </button>
          </div>
        </div>

        {/* Barra de progreso */}
        <div style={{ padding: '0 18px' }}>
          <BarraProgreso subfaseActual={subActual} />
        </div>

        {/* Mensaje de resultado */}
        {mensaje && (
          <div style={{
            margin: '10px 18px 0', padding: '10px 14px',
            borderRadius: '6px', fontSize: '13px',
            background: mensaje.tipo === 'ok' ? '#E8F5E9' : '#FFEBEE',
            color:      mensaje.tipo === 'ok' ? '#1B5E20' : '#B71C1C',
            border: `1px solid ${mensaje.tipo === 'ok' ? '#A5D6A7' : '#EF9A9A'}`,
          }}>
            {mensaje.texto}
          </div>
        )}

        {/* Sin transiciones configuradas */}
        {!pasos.length && subActual && (
          <div style={{ padding: '14px 18px', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span style={{ fontSize: '20px' }}>⚠</span>
            <div style={{ fontSize: '12px', color: '#888' }}>
              Nodo <code style={{ background:'#f5f5f5', padding:'1px 5px', borderRadius:'3px' }}>{subActual.codigo}</code> sin transiciones.
              Ve a <strong>Configuración → Transiciones</strong> para agregar el siguiente paso.
            </div>
          </div>
        )}

        {/* ── Formulario de avance expandible ── */}
        {mostrarForm && pasos.length > 0 && (
          <div style={{ padding: '16px 18px' }}>
            {esDecision && (
              <div style={{
                background: '#FFF9C4', border: '1px solid #F9A825',
                borderRadius: '6px', padding: '8px 12px', marginBottom: '14px',
                fontSize: '12px', color: '#555',
              }}>
                💡 <strong>Gate de decisión:</strong> Selecciona el resultado de la revisión.
                Quedará registrado en el historial del proyecto.
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', marginBottom: '14px', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 180px' }}>
                <label style={{ display:'block', fontSize:'11px', color:'#666', marginBottom:'4px', fontWeight:'bold' }}>
                  👤 Responsable
                </label>
                {usuarios.length > 0 ? (
                  <select
                    value={usuarioId}
                    onChange={e => setUsuarioId(e.target.value)}
                    style={{ width:'100%', padding:'7px 10px', border:'1px solid #ccc', borderRadius:'6px', fontSize:'13px' }}
                  >
                    <option value="">— Sin especificar —</option>
                    {usuarios.map(u => (
                      <option key={u.id} value={u.id}>{u.nombre} {u.apellido} ({u.rol})</option>
                    ))}
                  </select>
                ) : (
                  <div style={{ fontSize:'12px', color:'#888', padding:'7px', background:'#f5f5f5', borderRadius:'6px' }}>
                    Sin usuarios — agrégalos en <strong>Configuración</strong>
                  </div>
                )}
              </div>
              <div style={{ flex: '2 1 240px' }}>
                <label style={{ display:'block', fontSize:'11px', color:'#666', marginBottom:'4px', fontWeight:'bold' }}>
                  💬 Comentario <span style={{ color:'#B71C1C' }}>*</span>
                </label>
                <input
                  type="text"
                  value={comentario}
                  onChange={e => { setComentario(e.target.value); if (mensaje?.tipo === 'error') setMensaje(null); }}
                  placeholder="Ej: Aprobado sin observaciones"
                  style={{
                    width:'100%', padding:'7px 10px', borderRadius:'6px', fontSize:'13px', boxSizing:'border-box',
                    border: `1px solid ${!comentario.trim() && mensaje?.tipo === 'error' ? '#B71C1C' : '#ccc'}`,
                    outline: 'none',
                  }}
                  onKeyDown={e => { if (e.key === 'Enter' && pasos.length === 1) avanzar(pasos[0]); }}
                />
              </div>
            </div>

            <div>
              <div style={{ fontSize:'11px', color:'#666', marginBottom:'8px', fontWeight:'bold', textTransform:'uppercase', letterSpacing:'0.5px' }}>
                {esDecision ? 'Resultado:' : 'Confirmar avance:'}
              </div>
              <div style={{ display:'flex', gap:'10px', flexWrap:'wrap' }}>
                {pasos.map(paso => (
                  <BtnAccion key={paso.transicion_id} paso={paso} onClick={avanzar} disabled={enviando} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Sin transiciones y sin form: recordatorio */}
        {!mostrarForm && pasos.length > 0 && (
          <div style={{ padding: '12px 18px', fontSize: '12px', color: '#888' }}>
            Abre <strong>⚡ Registrar avance</strong> para continuar.
          </div>
        )}

      </div>

      {/* Modal historial */}
      {mostrarHistorial && (
        <ModalHistorial
          proyectoId={proyecto.id}
          proyectoNombre={proyecto.nombre}
          onCerrar={() => setMostrarHistorial(false)}
        />
      )}
    </>
  );
}
