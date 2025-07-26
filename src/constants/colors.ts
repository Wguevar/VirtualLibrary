export const colors = {
  primary: '#002357',    // Azul oscuro
  secondary: '#f76a0b',  // Naranja
  white: '#ffffff',      // Blanco
  lightGray: '#f8f9fa',
  gray: '#6c757d',
  darkGray: '#343a40',
} as const;

export const theme = {
  colors,
  gradients: {
    primary: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
    secondary: `linear-gradient(135deg, ${colors.secondary} 0%, ${colors.primary} 100%)`,
  },
} as const; 