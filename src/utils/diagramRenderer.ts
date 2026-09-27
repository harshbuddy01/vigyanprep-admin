/**
 * High-Resolution Scientific Diagram Generator & Rasterizer
 * Provides instant vector SVG rendering for science templates and converts to 300 DPI PNG
 */

export const PRESET_SVGS: Record<string, string> = {
  incline: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 320" width="520" height="320" style="background:#ffffff; font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;">
  <defs>
    <pattern id="groundHatch" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
      <line x1="0" y1="0" x2="0" y2="10" stroke="#94a3b8" stroke-width="1.5" />
    </pattern>
    <marker id="redArrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
      <path d="M0,0 L0,6 L8,3 z" fill="#dc2626" />
    </marker>
  </defs>

  <!-- Ground -->
  <rect x="30" y="250" width="460" height="20" fill="url(#groundHatch)" />
  <line x1="20" y1="250" x2="500" y2="250" stroke="#334155" stroke-width="3" stroke-linecap="round" />

  <!-- Incline Wedge -->
  <polygon points="60,250 420,250 420,72" fill="#fef3c7" stroke="#b45309" stroke-width="3" stroke-linejoin="round" />
  <text x="240" y="225" font-size="14" font-weight="bold" fill="#78350f">Wedge (M)</text>

  <!-- Angle arc at 30 deg -->
  <path d="M 120 250 A 60 60 0 0 0 112 220" fill="none" stroke="#b45309" stroke-width="2" />
  <text x="135" y="240" font-size="14" font-weight="bold" fill="#b45309">30°</text>

  <!-- Block on Incline -->
  <g transform="translate(240, 161) rotate(-26.3)">
    <rect x="-35" y="-40" width="70" height="40" rx="3" fill="#dbeafe" stroke="#1d4ed8" stroke-width="2.5" />
    <text x="0" y="-15" text-anchor="middle" font-size="14" font-weight="bold" fill="#1e3a8a">m</text>
    <line x1="35" y1="-20" x2="95" y2="-20" stroke="#dc2626" stroke-width="3" marker-end="url(#redArrow)" />
    <text x="110" y="-15" font-size="15" font-weight="bold" fill="#dc2626">F&#8407;</text>
  </g>
</svg>`,

  spring_pulley: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 380" width="480" height="380" style="background:#ffffff; font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;">
  <defs>
    <pattern id="ceilHatch" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
      <line x1="0" y1="0" x2="0" y2="10" stroke="#94a3b8" stroke-width="1.5" />
    </pattern>
  </defs>

  <!-- Ceiling -->
  <rect x="80" y="20" width="320" height="18" fill="url(#ceilHatch)" />
  <line x1="80" y1="38" x2="400" y2="38" stroke="#334155" stroke-width="3" />

  <!-- Pulley Mount -->
  <line x1="240" y1="38" x2="240" y2="90" stroke="#475569" stroke-width="3.5" />

  <!-- Pulley Wheel -->
  <circle cx="240" cy="115" r="28" fill="#e2e8f0" stroke="#334155" stroke-width="3" />
  <circle cx="240" cy="115" r="5" fill="#334155" />

  <!-- Left Spring Side -->
  <line x1="212" y1="115" x2="212" y2="145" stroke="#334155" stroke-width="2.5" />
  <path d="M 212 145 L 225 155 L 199 170 L 225 185 L 199 200 L 225 215 L 199 230 L 225 245 L 212 255 L 212 275" fill="none" stroke="#059669" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
  <rect x="182" y="275" width="60" height="45" rx="3" fill="#d1fae5" stroke="#059669" stroke-width="2.5" />
  <text x="212" y="303" text-anchor="middle" font-size="15" font-weight="bold" fill="#065f46">m₁</text>

  <!-- Right String Side -->
  <line x1="268" y1="115" x2="268" y2="240" stroke="#334155" stroke-width="2.5" />
  <rect x="238" y="240" width="60" height="45" rx="3" fill="#f3e8ff" stroke="#9333ea" stroke-width="2.5" />
  <text x="268" y="268" text-anchor="middle" font-size="15" font-weight="bold" fill="#6b21a8">m₂</text>
</svg>`,

  circuit: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 300" width="520" height="300" style="background:#ffffff; font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;">
  <!-- AC Source -->
  <circle cx="100" cy="150" r="32" fill="#f8fafc" stroke="#334155" stroke-width="3" />
  <path d="M 86 150 Q 93 138 100 150 T 114 150" fill="none" stroke="#334155" stroke-width="3" stroke-linecap="round" />
  <text x="50" y="155" text-anchor="end" font-size="14" font-weight="bold" fill="#1e293b">V(t) = V₀ sin(ωt)</text>

  <!-- Wire to Resistor -->
  <path d="M 100 118 L 100 60 L 220 60" fill="none" stroke="#334155" stroke-width="3" />
  <rect x="220" y="44" width="110" height="32" rx="3" fill="#fef3c7" stroke="#d97706" stroke-width="2.5" />
  <text x="275" y="65" text-anchor="middle" font-size="14" font-weight="bold" fill="#92400e">R = 10 Ω</text>
  
  <!-- Wire to Capacitor -->
  <path d="M 330 60 L 420 60 L 420 240 L 290 240" fill="none" stroke="#334155" stroke-width="3" />
  <line x1="290" y1="215" x2="290" y2="265" stroke="#2563eb" stroke-width="4.5" stroke-linecap="round" />
  <line x1="270" y1="215" x2="270" y2="265" stroke="#2563eb" stroke-width="4.5" stroke-linecap="round" />
  <text x="280" y="200" text-anchor="middle" font-size="14" font-weight="bold" fill="#1d4ed8">C = 5 μF</text>

  <!-- Wire back to Source -->
  <path d="M 270 240 L 100 240 L 100 182" fill="none" stroke="#334155" stroke-width="3" />
</svg>`,

  benzene: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 620 220" width="620" height="220" style="background:#ffffff; font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;">
  <defs>
    <marker id="rxnArrow" markerWidth="10" markerHeight="8" refX="8" refY="4" orient="auto">
      <path d="M0,1 L0,7 L9,4 z" fill="#1e293b" />
    </marker>
  </defs>

  <!-- Reactant: Nitrobenzene -->
  <g transform="translate(110, 110)">
    <polygon points="39,22.5 0,45 -39,22.5 -39,-22.5 0,-45 39,-22.5" fill="#f8fafc" stroke="#1e293b" stroke-width="2.5" />
    <circle cx="0" cy="0" r="26" fill="none" stroke="#1e293b" stroke-width="2" />
    <line x1="0" y1="-45" x2="0" y2="-72" stroke="#1e293b" stroke-width="2.5" />
    <text x="0" y="-80" text-anchor="middle" font-size="15" font-weight="bold" fill="#b91c1c">NO₂</text>
    <line x1="0" y1="45" x2="0" y2="72" stroke="#1e293b" stroke-width="2.5" />
    <text x="0" y="90" text-anchor="middle" font-size="15" font-weight="bold" fill="#1e293b">CH₃</text>
  </g>

  <!-- Reaction Arrow -->
  <g transform="translate(260, 110)">
    <line x1="0" y1="0" x2="100" y2="0" stroke="#1e293b" stroke-width="2.5" marker-end="url(#rxnArrow)" />
    <text x="50" y="-12" text-anchor="middle" font-size="14" font-weight="bold" fill="#0f172a">Sn / HCl</text>
    <text x="50" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="#b45309">Δ (Heat)</text>
  </g>

  <!-- Product -->
  <g transform="translate(470, 110)">
    <polygon points="39,22.5 0,45 -39,22.5 -39,-22.5 0,-45 39,-22.5" fill="#f8fafc" stroke="#1e293b" stroke-width="2.5" />
    <circle cx="0" cy="0" r="26" fill="none" stroke="#1e293b" stroke-width="2" />
    <line x1="0" y1="-45" x2="0" y2="-72" stroke="#1e293b" stroke-width="2.5" />
    <text x="0" y="-80" text-anchor="middle" font-size="15" font-weight="bold" fill="#047857">NH₂</text>
    <line x1="0" y1="45" x2="0" y2="72" stroke="#1e293b" stroke-width="2.5" />
    <text x="0" y="90" text-anchor="middle" font-size="15" font-weight="bold" fill="#1e293b">CH₃</text>
  </g>
</svg>`,

  coordinate_graph: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 340" width="520" height="340" style="background:#ffffff; font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;">
  <defs>
    <marker id="axisArrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
      <path d="M0,0 L0,6 L8,3 z" fill="#334155" />
    </marker>
  </defs>

  <!-- Axes -->
  <line x1="60" y1="240" x2="480" y2="240" stroke="#334155" stroke-width="2.5" marker-end="url(#axisArrow)" />
  <text x="490" y="245" font-size="15" font-weight="bold" fill="#334155">x</text>
  <line x1="220" y1="300" x2="220" y2="40" stroke="#334155" stroke-width="2.5" marker-end="url(#axisArrow)" />
  <text x="215" y="30" font-size="15" font-weight="bold" fill="#334155">y</text>
  <text x="205" y="258" font-size="14" font-weight="bold" fill="#64748b">O</text>

  <!-- Parabola -->
  <path d="M 94 85 Q 220 380 346 85" fill="none" stroke="#2563eb" stroke-width="3.5" stroke-linecap="round" />
  <text x="355" y="90" font-size="15" font-weight="bold" fill="#2563eb">y = f(x)</text>

  <!-- Tangent line at P -->
  <line x1="180" y1="315" x2="400" y2="95" stroke="#dc2626" stroke-width="2.5" stroke-dasharray="6,4" />
  <circle cx="290" cy="205" r="5" fill="#dc2626" />
  <text x="302" y="215" font-size="14" font-weight="bold" fill="#dc2626">P(1, 0.5)</text>
  <text x="408" y="100" font-size="13" font-weight="bold" fill="#dc2626">Tangent at P</text>
</svg>`
};

/**
 * Detects which science preset matches the provided TikZ or text code
 */
export function detectPresetKey(code: string): string | null {
  if (!code) return null;
  const lower = code.toLowerCase();
  if (lower.includes('wedge') || lower.includes('incline') || lower.includes('rotate=30')) return 'incline';
  if (lower.includes('pulley') || lower.includes('spring') || lower.includes('m_1') || lower.includes('m_2')) return 'spring_pulley';
  if (lower.includes('circuit') || lower.includes('capacitor') || lower.includes('resistor') || lower.includes('v_0') || lower.includes('rlc')) return 'circuit';
  if (lower.includes('benzene') || lower.includes('nitro') || lower.includes('sn / hcl') || lower.includes('sn/hcl') || lower.includes('no_2') || lower.includes('nh_2')) return 'benzene';
  if (lower.includes('parabola') || lower.includes('tangent') || lower.includes('coordinate') || lower.includes('plot')) return 'coordinate_graph';
  return null;
}

/**
 * Converts an SVG string into a high-DPI base64 PNG data URL in the browser
 */
export async function rasterizeSvgToPng(svgString: string, scale = 2): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const img = new Image();

      img.onload = () => {
        try {
          const width = (img.naturalWidth || img.width || 500) * scale;
          const height = (img.naturalHeight || img.height || 300) * scale;

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            URL.revokeObjectURL(url);
            return reject(new Error('Canvas 2D context not supported'));
          }

          // Fill clean crisp white background
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);

          // Draw image
          ctx.drawImage(img, 0, 0, width, height);
          URL.revokeObjectURL(url);

          const pngDataUrl = canvas.toDataURL('image/png', 0.95);
          resolve(pngDataUrl);
        } catch (canvasErr) {
          URL.revokeObjectURL(url);
          reject(canvasErr);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load SVG for rasterization'));
      };

      img.src = url;
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Uploads a base64 PNG to the backend diagrams directory and returns the public relative URL
 */
export async function uploadBase64Png(base64Png: string, apiBase: string, token: string | null, filename = 'diagram.png'): Promise<string> {
  const res = await fetch(`${apiBase}/api/admin/diagrams/upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : ''
    },
    body: JSON.stringify({ base64Data: base64Png, filename })
  });

  const data = await res.json();
  if (!res.ok || !data.success || !data.imageUrl) {
    throw new Error(data.error || 'Failed to save diagram image to server');
  }

  return data.imageUrl;
}
