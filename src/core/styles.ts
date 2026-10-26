// Inlined in every map so it works with SSR and without a CSS import.
// Every rule is scoped to .rim and themable through the --rim-* variables.
export const CSS = `
.rim{position:relative;display:inline-block;max-width:100%;vertical-align:top;-webkit-tap-highlight-color:transparent}
.rim>svg{position:absolute;inset:0;width:100%;height:100%;display:block;overflow:hidden;user-select:none;-webkit-user-select:none}
.rim-area,.rim-deco{fill:var(--a-fill,var(--rim-fill));stroke:var(--rim-stroke);stroke-width:var(--rim-sw);stroke-linejoin:round;vector-effect:non-scaling-stroke;fill-rule:evenodd;outline:none}
.rim-area{transition:fill .2s ease,opacity .3s ease}
.rim-deco{fill:var(--rim-foreign);pointer-events:none}
.rim-area.rim-foreign{fill:var(--a-fill,var(--rim-foreign))}
.rim-area:not(.rim-disabled):hover,.rim-area.rim-hover{fill:var(--a-hover,var(--rim-hover))}
.rim-area.rim-selected,.rim-area.rim-selected:hover{fill:var(--rim-selected)}
.rim-area.rim-disabled{fill:var(--a-fill,var(--rim-disabled))}
.rim-area.rim-dim{opacity:var(--rim-dim)}
.rim-clickable .rim-area:not(.rim-disabled){cursor:pointer}
.rim-panning,.rim-panning .rim-area{cursor:grabbing!important}
.rim-outline{fill:none;stroke:var(--rim-focus);stroke-width:2.5;vector-effect:non-scaling-stroke;pointer-events:none}
.rim-borders{fill:none;stroke:var(--rim-region-border);stroke-width:1.4;stroke-linejoin:round;vector-effect:non-scaling-stroke;pointer-events:none}
.rim-label{fill:var(--rim-label);stroke:var(--rim-halo);stroke-width:3px;paint-order:stroke;stroke-linejoin:round;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;font-weight:600;pointer-events:none}
.rim-child{pointer-events:none;overflow:visible}
.rim-child>div{width:100%;height:100%;display:flex;align-items:center;justify-content:center;text-align:center;line-height:normal}
.rim-reveal{animation:rim-reveal .45s ease both}
@keyframes rim-reveal{from{opacity:0}to{opacity:1}}
.rim-back{position:absolute;left:12px;top:12px;padding:6px 12px;border:1px solid rgba(0,0,0,.15);border-radius:999px;background:#fff;color:#0f172a;box-shadow:0 1px 4px rgba(0,0,0,.12);font:600 13px/1.2 system-ui,-apple-system,"Segoe UI",sans-serif;cursor:pointer}
.rim-back:focus-visible{outline:2px solid var(--rim-focus);outline-offset:1px}
.rim-controls{position:absolute;right:12px;bottom:12px;display:flex;flex-direction:column;gap:4px}
.rim-controls button{width:28px;height:28px;padding:0;border:1px solid rgba(0,0,0,.15);border-radius:6px;background:#fff;color:#0f172a;box-shadow:0 1px 4px rgba(0,0,0,.12);font:16px/1 system-ui,sans-serif;cursor:pointer;display:flex;align-items:center;justify-content:center}
.rim-controls button:disabled{opacity:.35;cursor:default}
.rim-controls button:focus-visible{outline:2px solid var(--rim-focus);outline-offset:1px}
.rim-tooltip{position:fixed;left:0;top:0;z-index:9999;pointer-events:none;will-change:transform}
.rim-tooltip-default{background:rgba(15,23,42,.92);color:#fff;padding:6px 10px;border-radius:6px;font:600 13px/1.35 system-ui,-apple-system,"Segoe UI",sans-serif;box-shadow:0 4px 12px rgba(0,0,0,.25);white-space:nowrap}
.rim-tooltip-default span{display:block;font-weight:400;opacity:.8}
@media (prefers-reduced-motion:reduce){.rim-area{transition:none}.rim-reveal{animation:none}}
`;
