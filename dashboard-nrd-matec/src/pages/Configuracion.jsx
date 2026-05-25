import React, { useState, useEffect, useCallback } from 'react';

const API = `${import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3001`}/api/admin`;

// ── Helpers de fetch ──────────────────────────────────────────────────────────
const apiFetch = (url, opts = {}) =>
  fetch(url, { headers: { 'Content-Type': 'application/json' }, ...opts })
    .then(async r => {
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
      return data;
    });

// ── Estilos ───────────────────────────────────────────────────────────────────
const S = {
  page:      { padding: '32px', fontFamily: 'Arial, sans-serif', background: '#f4f5f7', minHeight: '100vh' },
  header:    { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' },
  title:     { color: '#1F3864', fontSize: '22px', margin: 0, fontWeight: 'bold' },
  tabs:      { display: 'flex', gap: 0, marginBottom: '20px', borderBottom: '2px solid #dee2e6' },
  tab:  (on) => ({
    padding: '10px 22px', border: 'none', background: 'none', cursor: 'pointer',
    fontSize: '13px', fontWeight: on ? 'bold' : 'normal',
    color: on ? '#1565C0' : '#666',
    borderBottom: on ? '3px solid #1565C0' : '3px solid transparent',
    marginBottom: '-2px', transition: 'all 0.15s',
  }),
  card:      { background: '#fff', borderRadius: '10px', boxShadow: '0 1px 6px rgba(0,0,0,0.09)', overflow: 'hidden', marginBottom: '16px' },
  toolbar:   { padding: '12px 16px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  wrap:      { overflowX: 'auto' },
  table:     { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
  th:        { background: '#f8f9fa', padding: '9px 14px', textAlign: 'left', fontWeight: '600', color: '#444', fontSize: '11px', textTransform: 'uppercase', borderBottom: '1px solid #dee2e6', whiteSpace: 'nowrap' },
  td:        { padding: '8px 14px', borderBottom: '1px solid #f4f4f4', verticalAlign: 'middle' },
  tdAcc:     { padding: '6px 14px', borderBottom: '1px solid #f4f4f4', verticalAlign: 'middle', whiteSpace: 'nowrap', width: '1%' },
  input:     { width: '100%', padding: '4px 7px', border: '1px solid #1565C0', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box' },
  select:    { padding: '4px 7px', border: '1px solid #1565C0', borderRadius: '4px', fontSize: '12px', width: '100%' },
  btnAdd:    { padding: '7px 14px', background: '#1565C0', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' },
  btnSave:   { padding: '4px 10px', background: '#2E7D32', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', marginRight: '4px' },
  btnCancel: { padding: '4px 10px', background: '#78909C', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', marginRight: '4px' },
  btnEdit:   { padding: '4px 10px', background: '#1565C0', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', marginRight: '4px' },
  btnDel:    { padding: '4px 10px', background: '#B71C1C', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' },
  error:     { color: '#B71C1C', background: '#FFEBEE', padding: '8px 14px', borderRadius: '6px', fontSize: '12px', margin: '8px 0' },
  success:   { color: '#2E7D32', background: '#E8F5E9', padding: '8px 14px', borderRadius: '6px', fontSize: '12px', margin: '8px 0' },
  badge: (color, bg) => ({ display:'inline-block', padding:'2px 8px', borderRadius:'10px', fontSize:'10px', fontWeight:'bold', color, background: bg }),
};

// ── Componente genérico de aviso ──────────────────────────────────────────────
const Aviso = ({ msg, tipo }) => msg
  ? <div style={tipo === 'error' ? S.error : S.success}>{tipo === 'error' ? '⚠ ' : '✓ '}{msg}</div>
  : null;

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: FASES
// ═══════════════════════════════════════════════════════════════════════════════
function TabFases() {
  const [filas, setFilas]           = useState([]);
  const [editId, setEditId]         = useState(null);
  const [editData, setEditData]     = useState({});
  const [nuevo, setNuevo]           = useState(false);
  const [nuevoData, setNuevoData]   = useState({ numero:'', nombre:'', descripcion:'', color_hex:'#1565C0', emoji:'' });
  const [aviso, setAviso]           = useState({ msg:'', tipo:'' });

  const cargar = useCallback(() =>
    apiFetch(`${API}/fases`).then(setFilas).catch(e => setAviso({ msg: e.message, tipo: 'error' })), []);
  useEffect(() => { cargar(); }, [cargar]);

  const iniciarEdit = (f) => { setEditId(f.id); setEditData({ ...f }); };
  const cancelarEdit = () => { setEditId(null); setEditData({}); };

  const guardar = async () => {
    try {
      await apiFetch(`${API}/fases/${editId}`, { method: 'PUT', body: JSON.stringify(editData) });
      setAviso({ msg: 'Fase actualizada.', tipo: 'ok' });
      setEditId(null); cargar();
    } catch (e) { setAviso({ msg: e.message, tipo: 'error' }); }
  };

  const crear = async () => {
    try {
      await apiFetch(`${API}/fases`, { method: 'POST', body: JSON.stringify(nuevoData) });
      setAviso({ msg: 'Fase creada.', tipo: 'ok' });
      setNuevo(false); setNuevoData({ numero:'', nombre:'', descripcion:'', color_hex:'#1565C0', emoji:'' }); cargar();
    } catch (e) { setAviso({ msg: e.message, tipo: 'error' }); }
  };

  const eliminar = async (id, n) => {
    if (!window.confirm(`¿Eliminar la fase "${n}"? Esta acción no se puede deshacer.`)) return;
    try {
      await apiFetch(`${API}/fases/${id}`, { method: 'DELETE' });
      setAviso({ msg: 'Fase eliminada.', tipo: 'ok' }); cargar();
    } catch (e) { setAviso({ msg: e.message, tipo: 'error' }); }
  };

  const campo = (key, obj, setter, type='text', extra={}) => (
    type === 'color'
      ? <input type="color" value={obj[key] || '#cccccc'} onChange={e => setter(p => ({ ...p, [key]: e.target.value }))} style={{ width:'48px', height:'28px', padding:0, border:'1px solid #ccc', borderRadius:'4px', cursor:'pointer' }} />
      : <input type={type} value={obj[key] ?? ''} onChange={e => setter(p => ({ ...p, [key]: e.target.value }))} style={{ ...S.input, ...extra }} />
  );

  return (
    <div>
      <Aviso msg={aviso.msg} tipo={aviso.tipo} />
      <div style={S.card}>
        <div style={S.toolbar}>
          <span style={{ fontSize:'13px', color:'#666' }}>{filas.length} fase(s) registrada(s)</span>
          <button style={S.btnAdd} onClick={() => setNuevo(v => !v)}>+ Agregar fase</button>
        </div>

        {nuevo && (
          <div style={{ padding:'12px 16px', background:'#EEF4FF', borderBottom:'1px solid #dee2e6', display:'flex', gap:'10px', flexWrap:'wrap', alignItems:'flex-end' }}>
            <div style={{ flex:'0 0 60px' }}><label style={{ fontSize:'11px', color:'#555' }}>Número</label>{campo('numero', nuevoData, setNuevoData, 'number')}</div>
            <div style={{ flex:'1 1 140px' }}><label style={{ fontSize:'11px', color:'#555' }}>Nombre *</label>{campo('nombre', nuevoData, setNuevoData)}</div>
            <div style={{ flex:'2 1 200px' }}><label style={{ fontSize:'11px', color:'#555' }}>Descripción</label>{campo('descripcion', nuevoData, setNuevoData)}</div>
            <div><label style={{ fontSize:'11px', color:'#555' }}>Color</label><br/>{campo('color_hex', nuevoData, setNuevoData, 'color')}</div>
            <div style={{ flex:'0 0 60px' }}><label style={{ fontSize:'11px', color:'#555' }}>Emoji</label>{campo('emoji', nuevoData, setNuevoData, 'text', { width:'60px' })}</div>
            <div style={{ display:'flex', gap:'6px' }}>
              <button style={S.btnSave} onClick={crear}>✓ Guardar</button>
              <button style={S.btnCancel} onClick={() => setNuevo(false)}>✕ Cancelar</button>
            </div>
          </div>
        )}

        <div style={S.wrap}>
          <table style={S.table}>
            <thead>
              <tr>
                {['#', 'Nombre', 'Descripción', 'Color', 'Emoji', 'Subfases', 'Acciones'].map(h =>
                  <th key={h} style={S.th}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {filas.map(f => editId === f.id ? (
                <tr key={f.id} style={{ background:'#EEF4FF' }}>
                  <td style={S.td}><input type="number" value={editData.numero} onChange={e => setEditData(p=>({...p,numero:e.target.value}))} style={{...S.input,width:'60px'}}/></td>
                  <td style={S.td}>{campo('nombre', editData, setEditData)}</td>
                  <td style={S.td}>{campo('descripcion', editData, setEditData)}</td>
                  <td style={S.td}>{campo('color_hex', editData, setEditData, 'color')}</td>
                  <td style={S.td}>{campo('emoji', editData, setEditData, 'text', { width:'60px' })}</td>
                  <td style={S.td}>{f.num_subfases}</td>
                  <td style={S.tdAcc}><button style={S.btnSave} onClick={guardar}>✓</button><button style={S.btnCancel} onClick={cancelarEdit}>✕</button></td>
                </tr>
              ) : (
                <tr key={f.id} style={{ transition:'background 0.1s' }}>
                  <td style={S.td}><strong>{f.numero}</strong></td>
                  <td style={S.td}>{f.nombre}</td>
                  <td style={S.td}><span style={{ color:'#666' }}>{f.descripcion || '—'}</span></td>
                  <td style={S.td}><div style={{ display:'flex', alignItems:'center', gap:'8px' }}><div style={{ width:'20px', height:'20px', borderRadius:'4px', background: f.color_hex, border:'1px solid #ccc' }}/><code style={{ fontSize:'11px' }}>{f.color_hex}</code></div></td>
                  <td style={S.td}><span style={{ fontSize:'18px' }}>{f.emoji || '—'}</span></td>
                  <td style={S.td}><span style={S.badge('#1565C0','#E3F2FD')}>{f.num_subfases}</span></td>
                  <td style={S.tdAcc}><button style={S.btnEdit} onClick={() => iniciarEdit(f)}>✏ Editar</button><button style={S.btnDel} onClick={() => eliminar(f.id, f.nombre)}>🗑</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: SUBFASES
// ═══════════════════════════════════════════════════════════════════════════════
function TabSubfases() {
  const [filas, setFilas]         = useState([]);
  const [fases, setFases]         = useState([]);
  const [editId, setEditId]       = useState(null);
  const [editData, setEditData]   = useState({});
  const [nuevo, setNuevo]         = useState(false);
  const [nuevoData, setNuevoData] = useState({ fase_id:'', codigo:'', nombre:'', es_decision:false, es_correctivo:false, orden:'' });
  const [aviso, setAviso]         = useState({ msg:'', tipo:'' });
  const [filtroFase, setFiltroFase] = useState('');

  const cargar = useCallback(() => Promise.all([
    apiFetch(`${API}/subfases`),
    apiFetch(`${API}/fases`),
  ]).then(([sf, fs]) => { setFilas(sf); setFases(fs); })
    .catch(e => setAviso({ msg: e.message, tipo: 'error' })), []);
  useEffect(() => { cargar(); }, [cargar]);

  const guardar = async () => {
    try {
      await apiFetch(`${API}/subfases/${editId}`, { method: 'PUT', body: JSON.stringify(editData) });
      setAviso({ msg: 'Subfase actualizada.', tipo: 'ok' }); setEditId(null); cargar();
    } catch (e) { setAviso({ msg: e.message, tipo: 'error' }); }
  };

  const crear = async () => {
    try {
      await apiFetch(`${API}/subfases`, { method: 'POST', body: JSON.stringify(nuevoData) });
      setAviso({ msg: 'Subfase creada.', tipo: 'ok' });
      setNuevo(false); setNuevoData({ fase_id:'', codigo:'', nombre:'', es_decision:false, es_correctivo:false, orden:'' }); cargar();
    } catch (e) { setAviso({ msg: e.message, tipo: 'error' }); }
  };

  const eliminar = async (id, cod) => {
    if (!window.confirm(`¿Eliminar subfase "${cod}"?`)) return;
    try {
      await apiFetch(`${API}/subfases/${id}`, { method: 'DELETE' });
      setAviso({ msg: 'Subfase eliminada.', tipo: 'ok' }); cargar();
    } catch (e) { setAviso({ msg: e.message, tipo: 'error' }); }
  };

  const filasFiltradas = filtroFase ? filas.filter(f => f.fase_id === parseInt(filtroFase)) : filas;

  const SelectFase = ({ value, onChange }) => (
    <select value={value} onChange={e => onChange(e.target.value)} style={S.select}>
      <option value="">-- Selecciona --</option>
      {fases.map(f => <option key={f.id} value={f.id}>F{f.numero} — {f.nombre}</option>)}
    </select>
  );

  return (
    <div>
      <Aviso msg={aviso.msg} tipo={aviso.tipo} />
      <div style={S.card}>
        <div style={S.toolbar}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <span style={{ fontSize:'13px', color:'#666' }}>{filasFiltradas.length} subfase(s)</span>
            <select value={filtroFase} onChange={e => setFiltroFase(e.target.value)} style={{ padding:'5px 8px', border:'1px solid #ccc', borderRadius:'5px', fontSize:'12px' }}>
              <option value="">Todas las fases</option>
              {fases.map(f => <option key={f.id} value={f.id}>F{f.numero} — {f.nombre}</option>)}
            </select>
          </div>
          <button style={S.btnAdd} onClick={() => setNuevo(v => !v)}>+ Agregar subfase</button>
        </div>

        {nuevo && (
          <div style={{ padding:'12px 16px', background:'#EEF4FF', borderBottom:'1px solid #dee2e6', display:'flex', gap:'10px', flexWrap:'wrap', alignItems:'flex-end' }}>
            <div style={{ flex:'1 1 180px' }}><label style={{ fontSize:'11px', color:'#555' }}>Fase *</label><SelectFase value={nuevoData.fase_id} onChange={v => setNuevoData(p=>({...p,fase_id:v}))}/></div>
            <div style={{ flex:'0 0 70px' }}><label style={{ fontSize:'11px', color:'#555' }}>Código *</label><input value={nuevoData.codigo} onChange={e=>setNuevoData(p=>({...p,codigo:e.target.value.toUpperCase()}))} maxLength={3} style={{...S.input,textTransform:'uppercase'}}/></div>
            <div style={{ flex:'2 1 200px' }}><label style={{ fontSize:'11px', color:'#555' }}>Nombre *</label><input value={nuevoData.nombre} onChange={e=>setNuevoData(p=>({...p,nombre:e.target.value}))} style={S.input}/></div>
            <div style={{ flex:'0 0 55px' }}><label style={{ fontSize:'11px', color:'#555' }}>Orden</label><input type="number" value={nuevoData.orden} onChange={e=>setNuevoData(p=>({...p,orden:e.target.value}))} style={{...S.input,width:'55px'}}/></div>
            <div style={{ display:'flex', flexDirection:'column', gap:'4px', fontSize:'12px' }}>
              <label><input type="checkbox" checked={!!nuevoData.es_decision} onChange={e=>setNuevoData(p=>({...p,es_decision:e.target.checked}))}/> ◇ Decisión</label>
              <label><input type="checkbox" checked={!!nuevoData.es_correctivo} onChange={e=>setNuevoData(p=>({...p,es_correctivo:e.target.checked}))}/> ⚠ Correctivo</label>
            </div>
            <div style={{ display:'flex', gap:'6px' }}>
              <button style={S.btnSave} onClick={crear}>✓ Guardar</button>
              <button style={S.btnCancel} onClick={() => setNuevo(false)}>✕</button>
            </div>
          </div>
        )}

        <div style={S.wrap}>
          <table style={S.table}>
            <thead>
              <tr>{['Código','Fase','Nombre','Orden','Tipo','Acciones'].map(h=><th key={h} style={S.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {filasFiltradas.map(f => {
                const faseColor = fases.find(x=>x.id===f.fase_id)?.color_hex || '#ccc';
                return editId === f.id ? (
                  <tr key={f.id} style={{ background:'#EEF4FF' }}>
                    <td style={S.td}><input value={editData.codigo} onChange={e=>setEditData(p=>({...p,codigo:e.target.value.toUpperCase()}))} maxLength={3} style={{...S.input,width:'60px',textTransform:'uppercase'}}/></td>
                    <td style={S.td}><SelectFase value={editData.fase_id} onChange={v=>setEditData(p=>({...p,fase_id:parseInt(v)}))}/></td>
                    <td style={S.td}><input value={editData.nombre} onChange={e=>setEditData(p=>({...p,nombre:e.target.value}))} style={S.input}/></td>
                    <td style={S.td}><input type="number" value={editData.orden} onChange={e=>setEditData(p=>({...p,orden:e.target.value}))} style={{...S.input,width:'55px'}}/></td>
                    <td style={S.td}>
                      <label style={{ fontSize:'12px', marginRight:'8px' }}><input type="checkbox" checked={!!editData.es_decision} onChange={e=>setEditData(p=>({...p,es_decision:e.target.checked}))}/> ◇</label>
                      <label style={{ fontSize:'12px' }}><input type="checkbox" checked={!!editData.es_correctivo} onChange={e=>setEditData(p=>({...p,es_correctivo:e.target.checked}))}/> ⚠</label>
                    </td>
                    <td style={S.tdAcc}><button style={S.btnSave} onClick={guardar}>✓</button><button style={S.btnCancel} onClick={() => setEditId(null)}>✕</button></td>
                  </tr>
                ) : (
                  <tr key={f.id}>
                    <td style={S.td}><code style={{ background:'#f0f0f0', padding:'2px 6px', borderRadius:'4px', fontWeight:'bold', borderLeft:`3px solid ${faseColor}` }}>{f.codigo}</code></td>
                    <td style={S.td}><span style={S.badge(faseColor, faseColor+'22')}>F{f.fase_numero}</span></td>
                    <td style={S.td}>{f.nombre}</td>
                    <td style={S.td}><span style={{ color:'#888' }}>{f.orden}</span></td>
                    <td style={S.td}>
                      {f.es_decision   ? <span style={{ marginRight:'6px', ...S.badge('#F9A825','#FFF9C4') }}>◇ Decisión</span>  : null}
                      {f.es_correctivo ? <span style={S.badge('#C62828','#FFCDD2')}>⚠ Correctivo</span> : null}
                      {!f.es_decision && !f.es_correctivo ? <span style={{ color:'#aaa', fontSize:'11px' }}>Normal</span> : null}
                    </td>
                    <td style={S.tdAcc}><button style={S.btnEdit} onClick={() => { setEditId(f.id); setEditData({...f}); }}>✏ Editar</button><button style={S.btnDel} onClick={() => eliminar(f.id, f.codigo)}>🗑</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: TRANSICIONES
// ═══════════════════════════════════════════════════════════════════════════════
function TabTransiciones() {
  const [filas, setFilas]         = useState([]);
  const [editId, setEditId]       = useState(null);
  const [editData, setEditData]   = useState({});
  const [nuevo, setNuevo]         = useState(false);
  const [nuevoData, setNuevoData] = useState({ codigo_origen:'', codigo_destino:'', etiqueta:'', tipo:'normal' });
  const [aviso, setAviso]         = useState({ msg:'', tipo:'' });
  const TIPOS = ['normal','si','no','correctivo'];
  const TIPO_BADGE = { normal:{c:'#546e7a',b:'#ECEFF1'}, si:{c:'#2E7D32',b:'#E8F5E9'}, no:{c:'#B71C1C',b:'#FFEBEE'}, correctivo:{c:'#E65100',b:'#FFF3E0'} };

  const cargar = useCallback(() =>
    apiFetch(`${API}/transiciones`).then(setFilas).catch(e => setAviso({ msg: e.message, tipo: 'error' })), []);
  useEffect(() => { cargar(); }, [cargar]);

  const guardar = async () => {
    try {
      await apiFetch(`${API}/transiciones/${editId}`, { method: 'PUT', body: JSON.stringify(editData) });
      setAviso({ msg: 'Transición actualizada.', tipo: 'ok' }); setEditId(null); cargar();
    } catch (e) { setAviso({ msg: e.message, tipo: 'error' }); }
  };

  const crear = async () => {
    try {
      await apiFetch(`${API}/transiciones`, { method: 'POST', body: JSON.stringify(nuevoData) });
      setAviso({ msg: 'Transición creada.', tipo: 'ok' });
      setNuevo(false); setNuevoData({ codigo_origen:'', codigo_destino:'', etiqueta:'', tipo:'normal' }); cargar();
    } catch (e) { setAviso({ msg: e.message, tipo: 'error' }); }
  };

  const eliminar = async (id) => {
    if (!window.confirm('¿Eliminar esta transición?')) return;
    try {
      await apiFetch(`${API}/transiciones/${id}`, { method: 'DELETE' });
      setAviso({ msg: 'Transición eliminada.', tipo: 'ok' }); cargar();
    } catch (e) { setAviso({ msg: e.message, tipo: 'error' }); }
  };

  const inp = (key, obj, setter, extra={}) => (
    <input value={obj[key]??''} onChange={e=>setter(p=>({...p,[key]:e.target.value}))} style={{...S.input,...extra}}/>
  );
  const sel = (key, obj, setter) => (
    <select value={obj[key]??'normal'} onChange={e=>setter(p=>({...p,[key]:e.target.value}))} style={S.select}>
      {TIPOS.map(t=><option key={t} value={t}>{t}</option>)}
    </select>
  );

  return (
    <div>
      <Aviso msg={aviso.msg} tipo={aviso.tipo} />
      <div style={{ color:'#546e7a', fontSize:'12px', marginBottom:'10px', background:'#f8f9fa', padding:'8px 12px', borderRadius:'6px', borderLeft:'3px solid #1565C0' }}>
        💡 Los códigos <code>START</code> y <code>END</code> son nodos especiales de inicio y fin del diagrama. Los demás códigos deben coincidir exactamente con los códigos de la tabla Subfases (ej. <code>A1</code>, <code>B3</code>).
      </div>
      <div style={S.card}>
        <div style={S.toolbar}>
          <span style={{ fontSize:'13px', color:'#666' }}>{filas.length} transición(es) — {filas.filter(f=>f.activo).length} activa(s)</span>
          <button style={S.btnAdd} onClick={() => setNuevo(v=>!v)}>+ Agregar transición</button>
        </div>

        {nuevo && (
          <div style={{ padding:'12px 16px', background:'#EEF4FF', borderBottom:'1px solid #dee2e6', display:'flex', gap:'10px', flexWrap:'wrap', alignItems:'flex-end' }}>
            <div style={{ flex:'0 0 90px' }}><label style={{ fontSize:'11px', color:'#555' }}>Desde *</label>{inp('codigo_origen', nuevoData, setNuevoData, { width:'90px', textTransform:'uppercase' })}</div>
            <div style={{ flex:'1 1 180px' }}><label style={{ fontSize:'11px', color:'#555' }}>Etiqueta (en la flecha)</label>{inp('etiqueta', nuevoData, setNuevoData)}</div>
            <div style={{ flex:'0 0 90px' }}><label style={{ fontSize:'11px', color:'#555' }}>Hacia *</label>{inp('codigo_destino', nuevoData, setNuevoData, { width:'90px', textTransform:'uppercase' })}</div>
            <div style={{ flex:'0 0 110px' }}><label style={{ fontSize:'11px', color:'#555' }}>Tipo</label>{sel('tipo', nuevoData, setNuevoData)}</div>
            <div style={{ display:'flex', gap:'6px' }}>
              <button style={S.btnSave} onClick={crear}>✓ Guardar</button>
              <button style={S.btnCancel} onClick={() => setNuevo(false)}>✕</button>
            </div>
          </div>
        )}

        <div style={S.wrap}>
          <table style={S.table}>
            <thead>
              <tr>{['Desde','Etiqueta en flecha','Hacia','Tipo','Activo','Acciones'].map(h=><th key={h} style={S.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {filas.map(f => {
                const tb = TIPO_BADGE[f.tipo] || TIPO_BADGE.normal;
                return editId === f.id ? (
                  <tr key={f.id} style={{ background:'#EEF4FF' }}>
                    <td style={S.td}>{inp('codigo_origen', editData, setEditData, { width:'80px', textTransform:'uppercase' })}</td>
                    <td style={S.td}>{inp('etiqueta', editData, setEditData)}</td>
                    <td style={S.td}>{inp('codigo_destino', editData, setEditData, { width:'80px', textTransform:'uppercase' })}</td>
                    <td style={S.td}>{sel('tipo', editData, setEditData)}</td>
                    <td style={S.td}><input type="checkbox" checked={!!editData.activo} onChange={e=>setEditData(p=>({...p,activo:e.target.checked}))}/></td>
                    <td style={S.tdAcc}><button style={S.btnSave} onClick={guardar}>✓</button><button style={S.btnCancel} onClick={() => setEditId(null)}>✕</button></td>
                  </tr>
                ) : (
                  <tr key={f.id} style={{ opacity: f.activo ? 1 : 0.45 }}>
                    <td style={S.td}><code style={{ background:'#E3F2FD', padding:'2px 7px', borderRadius:'4px', fontWeight:'bold', color:'#1565C0' }}>{f.codigo_origen}</code></td>
                    <td style={S.td}><span style={{ color:'#666', fontStyle: f.etiqueta ? 'normal' : 'italic' }}>{f.etiqueta || '(sin etiqueta)'}</span></td>
                    <td style={S.td}><code style={{ background:'#E8F5E9', padding:'2px 7px', borderRadius:'4px', fontWeight:'bold', color:'#2E7D32' }}>{f.codigo_destino}</code></td>
                    <td style={S.td}><span style={S.badge(tb.c, tb.b)}>{f.tipo}</span></td>
                    <td style={S.td}>{f.activo ? <span style={S.badge('#2E7D32','#E8F5E9')}>✓ Activa</span> : <span style={S.badge('#888','#eee')}>Inactiva</span>}</td>
                    <td style={S.tdAcc}><button style={S.btnEdit} onClick={() => { setEditId(f.id); setEditData({...f}); }}>✏ Editar</button><button style={S.btnDel} onClick={() => eliminar(f.id)}>🗑</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: USUARIOS
// ═══════════════════════════════════════════════════════════════════════════════
function TabUsuarios() {
  const [filas, setFilas]         = useState([]);
  const [editId, setEditId]       = useState(null);
  const [editData, setEditData]   = useState({});
  const [nuevo, setNuevo]         = useState(false);
  const [nuevoData, setNuevoData] = useState({ nombre:'', apellido:'', email:'', rol:'ingeniero', area:'AYC' });
  const [aviso, setAviso]         = useState({ msg:'', tipo:'' });
  const ROLES = ['ingeniero','supervisor','calidad','admin'];
  const AREAS = ['AYC','Mecanica','Estandarizacion','Calidad'];
  const ROL_BADGE = { ingeniero:{c:'#1565C0',b:'#E3F2FD'}, supervisor:{c:'#6A1B9A',b:'#F3E5F5'}, calidad:{c:'#2E7D32',b:'#E8F5E9'}, admin:{c:'#B71C1C',b:'#FFEBEE'} };

  const cargar = useCallback(() =>
    apiFetch(`${API}/usuarios`).then(setFilas).catch(e => setAviso({ msg: e.message, tipo: 'error' })), []);
  useEffect(() => { cargar(); }, [cargar]);

  const guardar = async () => {
    try {
      await apiFetch(`${API}/usuarios/${editId}`, { method: 'PUT', body: JSON.stringify(editData) });
      setAviso({ msg: 'Usuario actualizado.', tipo: 'ok' }); setEditId(null); cargar();
    } catch (e) { setAviso({ msg: e.message, tipo: 'error' }); }
  };

  const crear = async () => {
    try {
      await apiFetch(`${API}/usuarios`, { method: 'POST', body: JSON.stringify(nuevoData) });
      setAviso({ msg: 'Usuario creado.', tipo: 'ok' });
      setNuevo(false); setNuevoData({ nombre:'', apellido:'', email:'', rol:'ingeniero', area:'AYC' }); cargar();
    } catch (e) { setAviso({ msg: e.message, tipo: 'error' }); }
  };

  const desactivar = async (id, nombre) => {
    if (!window.confirm(`¿Desactivar al usuario "${nombre}"? Podrá reactivarse editando el registro.`)) return;
    try {
      await apiFetch(`${API}/usuarios/${id}`, { method: 'DELETE' });
      setAviso({ msg: 'Usuario desactivado.', tipo: 'ok' }); cargar();
    } catch (e) { setAviso({ msg: e.message, tipo: 'error' }); }
  };

  const inp = (key, obj, setter, extra={}) => (
    <input value={obj[key]??''} onChange={e=>setter(p=>({...p,[key]:e.target.value}))} style={{...S.input,...extra}}/>
  );
  const selOpts = (key, opts, obj, setter) => (
    <select value={obj[key]??''} onChange={e=>setter(p=>({...p,[key]:e.target.value}))} style={S.select}>
      {opts.map(o=><option key={o} value={o}>{o}</option>)}
    </select>
  );

  return (
    <div>
      <Aviso msg={aviso.msg} tipo={aviso.tipo} />
      <div style={S.card}>
        <div style={S.toolbar}>
          <span style={{ fontSize:'13px', color:'#666' }}>{filas.length} usuario(s) — {filas.filter(f=>f.activo).length} activo(s)</span>
          <button style={S.btnAdd} onClick={() => setNuevo(v=>!v)}>+ Agregar usuario</button>
        </div>

        {nuevo && (
          <div style={{ padding:'12px 16px', background:'#EEF4FF', borderBottom:'1px solid #dee2e6', display:'flex', gap:'10px', flexWrap:'wrap', alignItems:'flex-end' }}>
            <div style={{ flex:'1 1 120px' }}><label style={{ fontSize:'11px', color:'#555' }}>Nombre *</label>{inp('nombre', nuevoData, setNuevoData)}</div>
            <div style={{ flex:'1 1 120px' }}><label style={{ fontSize:'11px', color:'#555' }}>Apellido *</label>{inp('apellido', nuevoData, setNuevoData)}</div>
            <div style={{ flex:'2 1 180px' }}><label style={{ fontSize:'11px', color:'#555' }}>Email *</label>{inp('email', nuevoData, setNuevoData, { type:'email' })}</div>
            <div style={{ flex:'0 0 110px' }}><label style={{ fontSize:'11px', color:'#555' }}>Rol</label>{selOpts('rol', ROLES, nuevoData, setNuevoData)}</div>
            <div style={{ flex:'0 0 120px' }}><label style={{ fontSize:'11px', color:'#555' }}>Área</label>{selOpts('area', AREAS, nuevoData, setNuevoData)}</div>
            <div style={{ display:'flex', gap:'6px' }}>
              <button style={S.btnSave} onClick={crear}>✓ Guardar</button>
              <button style={S.btnCancel} onClick={() => setNuevo(false)}>✕</button>
            </div>
          </div>
        )}

        <div style={S.wrap}>
          <table style={S.table}>
            <thead>
              <tr>{['Nombre','Email','Rol','Área','Estado','Acciones'].map(h=><th key={h} style={S.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {filas.map(f => {
                const rb = ROL_BADGE[f.rol] || ROL_BADGE.ingeniero;
                return editId === f.id ? (
                  <tr key={f.id} style={{ background:'#EEF4FF' }}>
                    <td style={S.td}><div style={{ display:'flex', gap:'6px' }}>{inp('nombre',f===editData?editData:editData, setEditData, { width:'90px' })}{inp('apellido', editData, setEditData, { width:'100px' })}</div></td>
                    <td style={S.td}>{inp('email', editData, setEditData)}</td>
                    <td style={S.td}>{selOpts('rol', ROLES, editData, setEditData)}</td>
                    <td style={S.td}>{selOpts('area', AREAS, editData, setEditData)}</td>
                    <td style={S.td}><label style={{ fontSize:'12px' }}><input type="checkbox" checked={!!editData.activo} onChange={e=>setEditData(p=>({...p,activo:e.target.checked}))}/> Activo</label></td>
                    <td style={S.tdAcc}><button style={S.btnSave} onClick={guardar}>✓</button><button style={S.btnCancel} onClick={() => setEditId(null)}>✕</button></td>
                  </tr>
                ) : (
                  <tr key={f.id} style={{ opacity: f.activo ? 1 : 0.45 }}>
                    <td style={S.td}><strong>{f.nombre} {f.apellido}</strong></td>
                    <td style={S.td}><a href={`mailto:${f.email}`} style={{ color:'#1565C0', fontSize:'12px' }}>{f.email}</a></td>
                    <td style={S.td}><span style={S.badge(rb.c, rb.b)}>{f.rol}</span></td>
                    <td style={S.td}><span style={{ color:'#555', fontSize:'12px' }}>{f.area}</span></td>
                    <td style={S.td}>{f.activo ? <span style={S.badge('#2E7D32','#E8F5E9')}>● Activo</span> : <span style={S.badge('#888','#eee')}>Inactivo</span>}</td>
                    <td style={S.tdAcc}><button style={S.btnEdit} onClick={() => { setEditId(f.id); setEditData({...f}); }}>✏ Editar</button>{f.activo && <button style={S.btnDel} onClick={() => desactivar(f.id, f.nombre)}>⏸ Desactivar</button>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL: CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════════════════════════
const TABS = [
  { id: 'fases',        label: '📋 Fases',        comp: TabFases        },
  { id: 'subfases',     label: '🔢 Subfases',      comp: TabSubfases     },
  { id: 'transiciones', label: '🔀 Transiciones',  comp: TabTransiciones },
  { id: 'usuarios',     label: '👤 Usuarios',      comp: TabUsuarios     },
];

export default function Configuracion({ onVolver }) {
  const [tabActiva, setTabActiva] = useState('fases');
  const TabComp = TABS.find(t => t.id === tabActiva)?.comp || TabFases;

  return (
    <div style={S.page}>
      <div style={S.header}>
        <button
          onClick={onVolver}
          style={{ padding:'7px 14px', background:'#fff', border:'1px solid #ccc', borderRadius:'6px', cursor:'pointer', fontSize:'12px', color:'#444' }}
        >
          ← Volver al Dashboard
        </button>
        <div>
          <h1 style={S.title}>⚙ Configuración</h1>
          <p style={{ margin:0, color:'#888', fontSize:'12px' }}>Administra las tablas maestras del sistema de estandarización MATEC</p>
        </div>
      </div>

      <div style={S.tabs}>
        {TABS.map(t => (
          <button key={t.id} style={S.tab(tabActiva === t.id)} onClick={() => setTabActiva(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      <TabComp />
    </div>
  );
}
