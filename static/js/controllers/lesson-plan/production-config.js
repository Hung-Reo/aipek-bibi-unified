// /static/js/controllers/lesson-plan/production-config.js
// PRODUCTION CONFIGURATION - Settings for production deployment
// This file controls production vs development behavior

/**
 * Production configuration settings
 */
export const PRODUCTION_CONFIG = {
  // Environment detection
  isProduction: window.location.hostname !== 'localhost' && 
                window.location.hostname !== '127.0.0.1' &&
                !window.location.hostname.includes('dev'),
  
  // Logging configuration
  logging: {
    enableDebugLogs: false, // Set to false for production
    enableVerboseLogs: false,
    enablePerformanceLogs: true,
    enableErrorLogs: true
  },
  
  // Feature flags
  features: {
    useNewArchitecture: true,
    useNewValidation: true,
    useNewAPIService: true,
    useNewStateManagement: true,
    enableArchitectureToggle: false // Hide toggle in production
  },
  
  // Performance settings
  performance: {
    enableCaching: true,
    cacheTimeout: 30 * 60 * 1000, // 30 minutes
    enablePreloading: true,
    enableLazyLoading: true
  },
  
  // UI settings
  ui: {
    showNotifications: true,
    notificationTimeout: 5000,
    enableAnimations: true,
    enableLoadingIndicators: true
  },
  
  // API settings
  api: {
    timeout: 60000, // 60 seconds
    retryAttempts: 3,
    enableRAG: true
  }
};

/**
 * Logger factory that respects production settings
 */
export const createLogger = (component) => {
  const config = PRODUCTION_CONFIG.logging;
  
  return {
    debug: (...args) => {
      if (config.enableDebugLogs) {
        console.log(`🐛 [${component}]`, ...args);
      }
    },
    
    info: (...args) => {
      if (config.enableVerboseLogs || !PRODUCTION_CONFIG.isProduction) {
        console.log(`ℹ️ [${component}]`, ...args);
      }
    },
    
    warn: (...args) => {
      console.warn(`⚠️ [${component}]`, ...args);
    },
    
    error: (...args) => {
      if (config.enableErrorLogs) {
        console.error(`❌ [${component}]`, ...args);
      }
    },
    
    performance: (label, duration) => {
      if (config.enablePerformanceLogs) {
        console.log(`⚡ [${component}] ${label}: ${duration}ms`);
      }
    }
  };
};

/**
 * Production-safe console override
 */
export function setupProductionLogging() {
  if (PRODUCTION_CONFIG.isProduction && !PRODUCTION_CONFIG.logging.enableDebugLogs) {
    // Override console methods for production
    const originalConsole = {
      log: console.log,
      debug: console.debug,
      info: console.info
    };
    
    // Only keep warnings and errors in production
    console.log = () => {};
    console.debug = () => {};
    console.info = () => {};
    
    // Keep a reference for development tools
    window.devConsole = originalConsole;
    
    console.warn('🔇 Debug logging disabled for production. Use window.devConsole for debugging.');
  }
}

/**
 * Check if feature is enabled
 */
export function isFeatureEnabled(featureName) {
  return PRODUCTION_CONFIG.features[featureName] || false;
}

/**
 * Get configuration value
 */
export function getConfig(path) {
  const keys = path.split('.');
  let value = PRODUCTION_CONFIG;
  
  for (const key of keys) {
    if (value && typeof value === 'object') {
      value = value[key];
    } else {
      return undefined;
    }
  }
  
  return value;
}

/**
 * Production initialization
 */
export function initializeProductionConfig() {
  console.log('🔧 Initializing production configuration...');
  
  // Setup logging
  setupProductionLogging();
  
  // Log environment
  console.log(`🌍 Environment: ${PRODUCTION_CONFIG.isProduction ? 'Production' : 'Development'}`);
  console.log(`🎛️ Features enabled:`, Object.entries(PRODUCTION_CONFIG.features)
    .filter(([_, enabled]) => enabled)
    .map(([name, _]) => name)
  );
  
  // Setup global config access
  window.PRODUCTION_CONFIG = PRODUCTION_CONFIG;
  window.getConfig = getConfig;
  window.isFeatureEnabled = isFeatureEnabled;
  
  console.log('✅ Production configuration initialized');
}

// Auto-initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeProductionConfig);
} else {
  initializeProductionConfig();
}