import { DefaultTheme } from 'react-native-paper';

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#2E7D32',      // Green
    accent: '#FF6F00',       // Orange
    background: '#F5F5F5',   // Light gray
    surface: '#FFFFFF',      // White
    text: '#212121',         // Dark gray
    placeholder: '#757575',  // Medium gray
    backdrop: 'rgba(0,0,0,0.5)',
    onSurface: '#212121',
    notification: '#FF5722', // Red orange
    
    // Custom colors
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    info: '#2196F3',
    
    // Afghanistan flag colors
    afghanGreen: '#00A651',
    afghanRed: '#FF0000',
    afghanBlack: '#000000',
    
    // Neutral colors
    neutral: {
      50: '#FAFAFA',
      100: '#F5F5F5',
      200: '#EEEEEE',
      300: '#E0E0E0',
      400: '#BDBDBD',
      500: '#9E9E9E',
      600: '#757575',
      700: '#616161',
      800: '#424242',
      900: '#212121',
    },
    
    // Semantic colors
    border: '#E0E0E0',
    divider: '#BDBDBD',
    disabled: '#F5F5F5',
    disabledText: '#9E9E9E',
  },
  
  // Typography
  fonts: {
    ...DefaultTheme.fonts,
    regular: {
      fontFamily: 'System',
      fontWeight: 'normal',
    },
    medium: {
      fontFamily: 'System',
      fontWeight: '500',
    },
    light: {
      fontFamily: 'System',
      fontWeight: '300',
    },
    thin: {
      fontFamily: 'System',
      fontWeight: '100',
    },
  },
  
  // Spacing
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  // Border radius
  roundness: 8,
  
  // Shadows
  shadows: {
    small: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 4,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 8,
      },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8,
    },
  },
  
  // Component specific styles
  components: {
    card: {
      backgroundColor: '#FFFFFF',
      borderRadius: 8,
      padding: 16,
      marginVertical: 8,
      marginHorizontal: 16,
    },
    
    button: {
      primary: {
        backgroundColor: '#2E7D32',
        color: '#FFFFFF',
      },
      secondary: {
        backgroundColor: '#FFFFFF',
        color: '#2E7D32',
        borderColor: '#2E7D32',
        borderWidth: 1,
      },
    },
    
    input: {
      backgroundColor: '#FFFFFF',
      borderColor: '#E0E0E0',
      borderWidth: 1,
      borderRadius: 8,
      padding: 12,
    },
  },
};