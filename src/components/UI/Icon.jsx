import React from 'react';
import PropTypes from 'prop-types';

/**
 * Componente Icon
 * Renderiza iconos SVG basados en un nombre
 */
const Icon = ({ name, size = 24, className = '', color = 'currentColor', ...props }) => {
  const iconSize = typeof size === 'number' ? `${size}px` : size;

  // Mapa de iconos SVG - usando Lucide icons como base
  const icons = {
    // Navegación y UI
    'chevron-down': (
      <path d="m6 9 6 6 6-6" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    ),
    'chevron-right': (
      <path d="m9 18 6-6-6-6" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    ),
    'chevron-left': (
      <path d="m15 18-6-6 6-6" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    ),
    'chevron-up': (
      <path d="m18 15-6-6-6 6" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    ),
    'arrow-left': (
      <path d="m12 19-7-7 7-7" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    ),
    'arrow-right': (
      <path d="m5 12 7-7 7 7" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    ),
    'arrow-up': (
      <path d="m18 9-6-6-6 6" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    ),
    'arrow-down': (
      <path d="m6 9 6 6 6-6" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    ),

    // Usuarios y personas
    'user': (
      <g stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </g>
    ),
    'users': (
      <g stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="m22 21-3.5-3.5a2 2 0 0 0-3 0L12 21" />
        <circle cx="17" cy="7" r="3" />
      </g>
    ),
    'user-check': (
      <g stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="m16 11 2 2 4-4" />
      </g>
    ),
    'user-plus': (
      <g stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <line x1="19" y1="8" x2="19" y2="14" />
        <line x1="22" y1="11" x2="16" y2="11" />
      </g>
    ),
    'user-x': (
      <g stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="m17 8 5 5" />
        <path d="m22 8-5 5" />
      </g>
    ),

    // Iconos de acciones
    'search': (
      <g stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </g>
    ),
    'search-x': (
      <g stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
        <path d="m8 8 6 6" />
        <path d="m14 8-6 6" />
      </g>
    ),
    'plus': (
      <g stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </g>
    ),
    'plus-circle': (
      <g stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v8" />
        <path d="M8 12h8" />
      </g>
    ),
    'minus-circle': (
      <g stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M8 12h8" />
      </g>
    ),
    'x': (
      <g stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
      </g>
    ),
    'x-circle': (
      <g stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="m15 9-6 6" />
        <path d="m9 9 6 6" />
      </g>
    ),
    'check': (
      <path d="M20 6 9 17l-5-5" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    ),
    'check-circle': (
      <g stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="m9 12 2 2 4-4" />
      </g>
    ),
    'check-square': (
      <g stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <path d="m9 12 2 2 4-4" />
      </g>
    ),

    // Iconos de contenido
    'layers': (
      <g stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12,2 2,7 12,12 22,7 12,2" />
        <polyline points="2,17 12,22 22,17" />
        <polyline points="2,12 12,17 22,12" />
      </g>
    ),
    'help-circle': (
      <g stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <path d="M12 17h.01" />
      </g>
    ),
    'bookmark': (
      <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    ),

    // Iconos de juego
    'gamepad': (
      <g stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <line x1="6" y1="12" x2="14" y2="12" />
        <line x1="10" y1="8" x2="10" y2="16" />
        <line x1="17" y1="11" x2="17" y2="13" />
        <line x1="20" y1="12" x2="20" y2="12" />
        <rect x="2" y="6" width="20" height="12" rx="2" />
      </g>
    ),
    'gamepad2': (
      <g stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <line x1="6" y1="11" x2="10" y2="11" />
        <line x1="8" y1="9" x2="8" y2="13" />
        <line x1="15" y1="12" x2="15.01" y2="12" />
        <line x1="18" y1="10" x2="18.01" y2="10" />
        <path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z" />
      </g>
    ),
    'trophy': (
      <g stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
        <path d="M4 22h16" />
        <path d="M10 14.66V17c0 .55.47.98.97 1.21C11.56 18.75 12 19.24 12 20s-.44 1.25-1.03 1.79C10.47 21.02 10 21.45 10 22" />
        <path d="M14 14.66V17c0 .55-.47.98-.97 1.21-.59.54-1.03 1.03-1.03 1.79s.44 1.25 1.03 1.79c.5.23.97.66.97 1.21" />
        <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
      </g>
    ),
    'award': (
      <g stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="7" />
        <polyline points="8.21,13.89 7,23 12,20 17,23 15.79,13.88" />
      </g>
    ),
    'target': (
      <g stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </g>
    ),

    // Iconos financieros
    'coins': (
      <g stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="8" cy="8" r="6" />
        <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
        <path d="M7 6h1v4" />
        <path d="m16.71 13.88.7.71-2.82 2.82" />
      </g>
    ),
    'dollar-sign': (
      <g stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </g>
    ),
    'credit-card': (
      <g stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </g>
    ),

    // Iconos de tiempo y actividad
    'clock': (
      <g stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12,6 12,12 16,14" />
      </g>
    ),
    'calendar': (
      <g stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </g>
    ),
    'activity': (
      <path d="m22 12-4-4-6 6-4-4-4 4" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    ),
    'trending-up': (
      <g stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23,6 13.5,15.5 8.5,10.5 1,18" />
        <polyline points="17,6 23,6 23,12" />
      </g>
    ),

    // Iconos de sistema
    'settings': (
      <g stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1m11-7a4 4 0 0 1 0 8 4 4 0 0 1 0-8zM7 12a4 4 0 0 1 0-8 4 4 0 0 1 0 8z" />
      </g>
    ),
    'wrench': (
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    ),
    'tool': (
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    ),

    // Iconos de comunicación
    'mail': (
      <g stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m22 7-10 5L2 7" />
      </g>
    ),
    'send': (
      <g stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <line x1="22" y1="2" x2="11" y2="13" />
        <polygon points="22,2 15,22 11,13 2,9 22,2" />
      </g>
    ),
    'phone': (
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    ),

    // Alertas e información
    'alert-triangle': (
      <g stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
      </g>
    ),
    'alert-circle': (
      <g stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </g>
    ),
    'info': (
      <g stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </g>
    ),

    // Otros iconos útiles
    'eye': (
      <g stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </g>
    ),
    'edit': (
      <g stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </g>
    ),
    'trash': (
      <g stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3,6 5,6 21,6" />
        <path d="m19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      </g>
    ),
    'download': (
      <g stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7,10 12,15 17,10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </g>
    ),
    'upload': (
      <g stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17,8 12,3 7,8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </g>
    ),
    'refresh-cw': (
      <g stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23,4 23,10 17,10" />
        <polyline points="1,20 1,14 7,14" />
        <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4a9 9 0 0 1-14.85 4.36L23 14" />
      </g>
    ),

    // Iconos adicionales que pueden ser útiles
    'crown': (
      <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm6 16h8v2H8v-2z" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    ),
    'shield': (
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    ),
    'shield-check': (
      <g stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </g>
    ),
    'globe': (
      <g stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </g>
    ),
    'lock': (
      <g stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <circle cx="12" cy="16" r="1" />
        <path d="m7 11V7a5 5 0 0 1 10 0v4" />
      </g>
    ),
    'star': (
      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26 12,2" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    ),
    'gift': (
      <g stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20,12 20,22 4,22 4,12" />
        <rect x="2" y="7" width="20" height="5" />
        <line x1="12" y1="22" x2="12" y2="7" />
        <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
        <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
      </g>
    ),
    'shopping-cart': (
      <g stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </g>
    ),
    'shopping-bag': (
      <g stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </g>
    ),
    'database': (
      <g stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
      </g>
    ),
    'server': (
      <g stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
        <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
        <line x1="6" y1="6" x2="6.01" y2="6" />
        <line x1="6" y1="18" x2="6.01" y2="18" />
      </g>
    ),
    'monitor': (
      <g stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </g>
    ),
    'terminal': (
      <g stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="4,17 10,11 4,5" />
        <line x1="12" y1="19" x2="20" y2="19" />
      </g>
    ),
    'file-text': (
      <g stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14,2 L14,8 L20,8 M14,2 L14,8 L20,8 M4,2 L4,22 L20,22 L20,8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10,9 9,9 8,9" />
      </g>
    ),
    'chart-bar': (
      <g stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="20" x2="12" y2="10" />
        <line x1="18" y1="20" x2="18" y2="4" />
        <line x1="6" y1="20" x2="6" y2="16" />
      </g>
    ),
    'percent': (
      <g stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <line x1="19" y1="5" x2="5" y2="19" />
        <circle cx="6.5" cy="6.5" r="2.5" />
        <circle cx="17.5" cy="17.5" r="2.5" />
      </g>
    ),
    'zap': (
      <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    ),
    'bell': (
      <g stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </g>
    ),
    'clipboard': (
      <g stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      </g>
    ),
    'graduation-cap': (
      <g stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c3 3 9 3 12 0v-5" />
      </g>
    ),
    'play': (
      <polygon points="5,3 19,12 5,21 5,3" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    ),
    'pause': (
      <g stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <rect x="6" y="4" width="4" height="16" />
        <rect x="14" y="4" width="4" height="16" />
      </g>
    ),
    'stop': (
      <rect x="6" y="6" width="12" height="12" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    ),
    'volume-2': (
      <g stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="11,5 6,9 2,9 2,15 6,15 11,19 11,5" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
      </g>
    ),
    'life-buoy': (
      <g stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="4" />
        <line x1="4.93" y1="4.93" x2="9.17" y2="9.17" />
        <line x1="14.83" y1="14.83" x2="19.07" y2="19.07" />
        <line x1="14.83" y1="9.17" x2="19.07" y2="4.93" />
        <line x1="14.83" y1="9.17" x2="18.36" y2="5.64" />
        <line x1="4.93" y1="19.07" x2="9.17" y2="14.83" />
      </g>
    ),
    'history': (
      <g stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v5h5" />
        <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" />
        <path d="M12 7v5l4 2" />
      </g>
    ),
    'list': (
      <g stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" />
        <line x1="3" y1="12" x2="3.01" y2="12" />
        <line x1="3" y1="18" x2="3.01" y2="18" />
      </g>
    ),
    'message-circle': (
      <g stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </g>
    )
  };

  const iconPath = icons[name];

  if (!iconPath) {
    console.warn(`Icon "${name}" not found`);
    return null;
  }

  return (
    <svg
      width={iconSize}
      height={iconSize}
      viewBox="0 0 24 24"
      className={`icon icon-${name} ${className}`}
      {...props}
    >
      {iconPath}
    </svg>
  );
};

Icon.propTypes = {
  name: PropTypes.string.isRequired,
  size: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  className: PropTypes.string,
  color: PropTypes.string
};

export default Icon;