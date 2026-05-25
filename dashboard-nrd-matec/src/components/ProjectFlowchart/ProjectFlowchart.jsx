import React, { useEffect, useState, useRef } from 'react';
import mermaid from 'mermaid';
import './DiagramStyles.css';

// ─── Utilidades ──────────────────────────────────────────────────────────────

// Parte el texto en líneas de máx. N caracteres para que los nodos
// no sean demasiado anchos en el diagrama
function wrapText(text, maxLen = 20) {
  const words = text.split(' ');
  const lines = [''];
  words.forEach(word => {
    const current = lines[lines.length - 1];
    if (!current || current.length + word.length + 1 <= maxLen) {
      lines[lines.length - 1] = current ? `${current} ${word}` : word;
    } else {
      lines.push(word);
    }
  });
  return lines.join('<br/>');
}

// Mapas estáticos de estilos por número de fase
const FASE_CSS = { 1: 'fase1', 2: 'fase2', 3: 'fase3', 4: 'fase4', 5: 'fase5' };
const FASE_GLOW_COLOR = {
  1: '#1565C0', 2: '#2E7D32', 3: '#E65100', 4: '#B71C1C', 5: '#6A1B9A',
};

// ─── Generador de código Mermaid ─────────────────────────────────────────────

function buildMermaidCode({ fases, subfases, transiciones, projectName, hardwareType, numFase, activeSubphase }) {
  let c = 'flowchart TD\n\n';

  // Nodo de inicio
  c += `    START(["🚀 INICIO<br/>Proyecto: ${projectName}"])\n\n`;

  // Un subgraph por cada fase (en el orden que devuelva la BD)
  fases.forEach(fase => {
    const nodos = subfases
      .filter(s => s.fase_numero === fase.numero)
      .sort((a, b) => a.orden - b.orden);

    const emoji = fase.emoji || '📌';
    c += `    subgraph F${fase.numero} ["${emoji}  FASE ${fase.numero} — ${fase.nombre}"]\n`;

    nodos.forEach(s => {
      const label = wrapText(s.nombre);
      if (s.es_decision) {
        c += `        ${s.codigo}{"${label}"}\n`;
      } else {
        c += `        ${s.codigo}["${label}"]\n`;
      }
    });

    c += `    end\n\n`;
  });

  // Nodo de fin
  c += `    END(["🏁 FB ESTÁNDAR PUBLICADO<br/>Biblioteca MATEC actualizada ✓"])\n\n`;

  // Aristas / transiciones (vienen TODAS de la BD — cero hardcodeo)
  transiciones.forEach(t => {
    if (t.etiqueta) {
      c += `    ${t.codigo_origen} -->|"${t.etiqueta}"| ${t.codigo_destino}\n`;
    } else {
      c += `    ${t.codigo_origen} --> ${t.codigo_destino}\n`;
    }
  });

  // ── Definición de clases CSS ──────────────────────────────────────────────
  c += `
    classDef startEnd   fill:#1F3864,stroke:#0d2146,color:#fff,font-weight:bold,font-size:13px
    classDef fase1      fill:#BBDEFB,stroke:#1565C0,color:#0d47a1,font-size:13px
    classDef fase2      fill:#C8E6C9,stroke:#2E7D32,color:#1b5e20,font-size:13px
    classDef fase3      fill:#FFE0B2,stroke:#E65100,color:#bf360c,font-size:13px
    classDef fase4      fill:#FFCDD2,stroke:#B71C1C,color:#7f0000,font-size:13px
    classDef fase5      fill:#E1BEE7,stroke:#6A1B9A,color:#38006b,font-size:13px
    classDef decision   fill:#FFF9C4,stroke:#F9A825,color:#333,font-weight:bold,font-size:13px
    classDef corrective fill:#FFCDD2,stroke:#C62828,color:#7f0000,font-style:italic,font-size:13px

    class START,END startEnd
`;

  // Asignar clase a cada nodo según su tipo (derivado de los flags de la BD)
  subfases.forEach(s => {
    let cls;
    if (s.es_decision)    cls = 'decision';
    else if (s.es_correctivo) cls = 'corrective';
    else                  cls = FASE_CSS[s.fase_numero] || 'fase1';
    c += `    class ${s.codigo} ${cls}\n`;
  });

  // ── Resaltado de la fase activa del proyecto (borde del subgraph) ─────────
  if (numFase && FASE_GLOW_COLOR[numFase]) {
    const col = FASE_GLOW_COLOR[numFase];
    const bg  = numFase === 1 ? '#E3F2FD'
              : numFase === 2 ? '#E8F5E9'
              : numFase === 3 ? '#FFF3E0'
              : numFase === 4 ? '#FFEBEE'
              :                 '#F3E5F5';
    c += `\n    style F${numFase} fill:${bg},stroke:${col},stroke-width:4px,stroke-dasharray:5 5;`;
  }

  // ── Resaltado del nodo activo (subfase actual del proyecto) ───────────────
  if (activeSubphase) {
    const sf = subfases.find(s => s.codigo === activeSubphase);
    if (sf) {
      const strokeColor = FASE_GLOW_COLOR[sf.fase_numero] || '#1565C0';
      c += `\n    classDef activeNode cssClass:nodo-glow,stroke:${strokeColor},stroke-width:4px,color:#000,font-weight:bold;`;
      c += `\n    class ${activeSubphase} activeNode;`;
    }
  }

  return c;
}

// ─── Componente ──────────────────────────────────────────────────────────────

const ProjectFlowchart = ({ projectName, hardwareType, currentPhase, numFase, activeSubphase }) => {
  const [svgContent,  setSvgContent]  = useState('');
  const [diagramData, setDiagramData] = useState(null);
  const [cargandoDB,  setCargandoDB]  = useState(true);
  const [errorDB,     setErrorDB]     = useState(null);

  // Inicializar Mermaid una sola vez
  useEffect(() => {
    mermaid.initialize({
      startOnLoad:   false,
      theme:         'base',
      securityLevel: 'loose',
      flowchart: {
        curve:       'cardinal',
        padding:     60,
        nodeSpacing: 40,
        rankSpacing: 52,
        htmlLabels:  false,   // SVG text nativo — sin foreignObject, sin desbordamientos
      },
      themeVariables: {
        primaryColor:        '#BBDEFB',
        primaryTextColor:    '#1a1a1a',
        primaryBorderColor:  '#1565C0',
        lineColor:           '#607d8b',
        secondaryColor:      '#C8E6C9',
        tertiaryColor:       '#FFF9C4',
        fontSize:            '13px',
        fontFamily:          "'Inter', 'Segoe UI', system-ui, sans-serif",
        edgeLabelBackground: '#ffffffdd',
        clusterBkg:          '#f5f7ff',
        clusterBorder:       '#c0c8e0',
        nodeBorder:          '1.5px',
        mainBkg:             '#BBDEFB',
        nodePadding:         '8',
      },
    });
  }, []);

  // Cargar estructura del diagrama desde la BD (UNA SOLA VEZ al montar)
  // Si agregas fases/subfases/transiciones en la BD y recargas la página,
  // el diagrama se actualiza automáticamente sin cambiar ningún archivo.
  useEffect(() => {
    fetch(`http://${window.location.hostname}:3001/api/diagrama`)
      .then(r => {
        if (r.status === 404) throw new Error(
          'Ruta /api/diagrama no encontrada. ' +
          'Reinicia el servidor Node.js: detén el proceso y vuelve a ejecutar "node server.js".'
        );
        if (!r.ok) throw new Error(`Error del servidor: HTTP ${r.status}`);
        return r.json();
      })
      .then(data => {
        setDiagramData(data);
        setCargandoDB(false);
      })
      .catch(err => {
        console.error('Error cargando estructura del diagrama:', err);
        setErrorDB(err.message);
        setCargandoDB(false);
      });
  }, []);

  // Regenerar el SVG cada vez que cambian los datos o el proyecto seleccionado
  useEffect(() => {
    if (!diagramData) return;

    const chartCode = buildMermaidCode({
      fases:        diagramData.fases,
      subfases:     diagramData.subfases,
      transiciones: diagramData.transiciones,
      projectName,
      hardwareType,
      numFase,
      activeSubphase,
    });

    const render = async () => {
      try {
        const uid = 'mermaid-' + Math.random().toString(36).substr(2, 9);
        const { svg } = await mermaid.render(uid, chartCode);

        // ── Inyectar estilos dinámicos en el SVG ────────────────────────────
        // El color del glow cambia según la fase activa del proyecto
        const glowColor = activeSubphase && numFase
          ? (FASE_GLOW_COLOR[numFase] || '#1565C0')
          : '#1565C0';

        const r = parseInt(glowColor.slice(1,3), 16);
        const g = parseInt(glowColor.slice(3,5), 16);
        const b = parseInt(glowColor.slice(5,7), 16);

        const dynStyle = `
<style>
  /* ── Glow del nodo activo — color dinámico por fase ── */
  .activeNode rect, .activeNode polygon,
  .activeNode ellipse, .activeNode path {
    animation: dynGlow 2s ease-in-out infinite alternate !important;
    stroke-width: 3px !important;
  }
  @keyframes dynGlow {
    from { filter: drop-shadow(0 0 6px rgba(${r},${g},${b},0.75)); }
    to   { filter: drop-shadow(0 0 20px rgba(${r},${g},${b},1.0))
                   drop-shadow(0 0 36px rgba(${r},${g},${b},0.5)); }
  }

  /* ── Bordes redondeados ── */
  .node rect    { rx: 8;  ry: 8;  }
  .cluster rect { rx: 10; ry: 10; }

  /* ── Hover (solo filter — polygon usa puntos absolutos) ── */
  .node:hover rect    { filter: brightness(1.08) drop-shadow(0 5px 14px rgba(0,0,0,0.22)) !important; }
  .node:hover polygon { filter: brightness(1.10) drop-shadow(0 5px 14px rgba(0,0,0,0.22)) !important; }
  .node:hover ellipse { filter: brightness(1.08) drop-shadow(0 5px 14px rgba(0,0,0,0.22)) !important; }

  /* ── Texto SVG nativo: fuente Inter, centrado, suavizado ── */
  .node text, .node tspan {
    font-family: 'Inter', 'Segoe UI', system-ui, sans-serif !important;
    font-size: 13px !important;
    dominant-baseline: middle;
    text-anchor: middle;
    -webkit-font-smoothing: antialiased;
  }
  .edgeLabel text, .edgeLabel tspan {
    font-family: 'Inter', 'Segoe UI', system-ui, sans-serif !important;
    font-size: 11px !important;
  }

  /* ── Título de cada fase: destacado y centrado ── */
  .cluster-label text, .cluster-label tspan {
    font-size: 14px !important;
    font-weight: 700 !important;
    font-family: 'Inter', 'Segoe UI', sans-serif !important;
    letter-spacing: 0.5px !important;
  }
  .cluster-label, g.cluster { overflow: visible !important; }
</style>`;

        // Hacer el SVG responsivo: reemplazar width fijo por 100%
        // y quitar height fijo para que el viewBox controle la proporción
        const responsiveSvg = svg
          .replace(/(<svg[^>]*)\s+width="[\d.]+(?:px)?"/, '$1 width="100%"')
          .replace(/(<svg[^>]*)\s+height="[\d.]+(?:px)?"/, '$1');

        const processedSvg = responsiveSvg.replace('</svg>', dynStyle + '\n</svg>');
        setSvgContent(processedSvg);
      } catch (err) {
        console.error('Error generando diagrama Mermaid:', err);
      }
    };

    render();
  }, [diagramData, projectName, hardwareType, numFase, activeSubphase]);

  // ── Construir etiquetas de fase para el header ────────────────────────────
  const fases = diagramData?.fases || [];

  return (
    <div id="fb-root">

      {/* Encabezado */}
      <div className="fb-header">
        <div>
          <div className="fb-title">Estandarización y Flujo — {projectName}</div>
          <div className="fb-sub">Diagrama de Flujo · {hardwareType} · MATEC</div>
        </div>
        <div className="fb-badge">
          {currentPhase || 'Sin fase asignada'}
        </div>
      </div>

      {/* Etiquetas de fases — generadas dinámicamente desde la BD */}
      <div className="fb-phases">
        {fases.map(fase => {
          const esActiva  = numFase === fase.numero;
          const glowColor = FASE_GLOW_COLOR[fase.numero] || '#546e7a';
          // Color de fondo según fase
          const bgColor   = fase.numero === 1 ? '#E3F2FD'
                          : fase.numero === 2 ? '#E8F5E9'
                          : fase.numero === 3 ? '#FFF3E0'
                          : fase.numero === 4 ? '#FFEBEE'
                          :                     '#F3E5F5';
          return (
            <div
              key={fase.id}
              className="ph-tag"
              style={{
                color:      glowColor,
                background: bgColor,
                opacity:    esActiva ? 1 : 0.4,
                boxShadow:  esActiva
                  ? `0 0 12px ${glowColor}88, 0 0 16px ${glowColor}66`
                  : 'none',
                transform:  esActiva ? 'scale(1.08)' : 'scale(1)',
                fontWeight: esActiva ? '700' : '400',
                border:     esActiva ? `1px solid ${glowColor}` : '1px solid transparent',
              }}
            >
              {fase.emoji} F{fase.numero}. {fase.nombre.split(' ').slice(0, 2).join(' ')}
            </div>
          );
        })}
        <div className="ph-tag" style={{ color:'#C62828', background:'#FFCDD2', opacity:0.7 }}>⚠ Acción correctiva</div>
        <div className="ph-tag" style={{ color:'#F9A825', background:'#FFF9C4', opacity:0.7 }}>◇ Decisión / Gate</div>
      </div>

      {/* Diagrama */}
      <div className="fb-diagram" id="diagram-box">
        {cargandoDB ? (
          <p style={{ padding:'20px', color:'#666' }}>Cargando estructura del diagrama desde la base de datos...</p>
        ) : errorDB ? (
          <p style={{ padding:'20px', color:'#B71C1C' }}>
            ⚠ Error cargando el diagrama: {errorDB}
          </p>
        ) : svgContent ? (
          <div
            dangerouslySetInnerHTML={{ __html: svgContent }}
            style={{ width: '100%' }}
          />
        ) : (
          <p style={{ padding:'20px', color:'#666' }}>Generando diagrama visual...</p>
        )}
      </div>

      <div className="fb-footer">
        <span>📌 Diagrama generado dinámicamente desde MSSQL · React · Mermaid.js — MATEC · Ingeniería AYC</span>
        <span>IEC 61131-3 · Siemens TIA Portal · ISO 9001:2015</span>
      </div>
    </div>
  );
};

export default ProjectFlowchart;
