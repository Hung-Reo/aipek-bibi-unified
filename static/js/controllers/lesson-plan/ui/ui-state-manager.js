// /static/js/controllers/lesson-plan/ui/ui-state-manager.js
// UI STATE MANAGER - Centralized UI state management
// This module manages all UI state without mixing with business logic

/**
 * UI State Manager for lesson plan interface
 * Handles tab states, form states, loading states, etc.
 */
export class UIStateManager {
  constructor() {
    this.state = {
      currentTab: 'main',
      formStates: {
        main: { isValid: false, isDirty: false },
        supplementary: { isValid: false, isDirty: false },
        review: { isValid: false, isDirty: false }
      },
      loadingStates: {
        main: false,
        supplementary: false,
        review: false,
        rag: false
      },
      uiMode: 'modern', // 'modern' or 'classic'
      language: 'vi', // 'vi', 'en', 'both'
      ragStatus: { connected: false, message: '' },
      errors: {},
      notifications: []
    };

    this.listeners = new Map();
    this.initializeFromStorage();
  }

  /**
   * Initialize state from localStorage
   */
  initializeFromStorage() {
    try {
      const savedUIMode = localStorage.getItem('bibi-ui-mode');
      if (savedUIMode) {
        this.state.uiMode = savedUIMode;
      }

      const savedLanguage = localStorage.getItem('bibi-language');
      if (savedLanguage) {
        this.state.language = savedLanguage;
      }
    } catch (error) {
      console.warn('Failed to load UI state from storage:', error);
    }
  }

  /**
   * Get current state
   * @returns {object} Current state
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Subscribe to state changes
   * @param {string} key - State key to watch
   * @param {function} callback - Callback function
   * @returns {function} Unsubscribe function
   */
  subscribe(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    
    const listeners = this.listeners.get(key);
    listeners.add(callback);

    // Return unsubscribe function
    return () => {
      listeners.delete(callback);
    };
  }

  /**
   * Emit state change to listeners
   * @param {string} key - State key that changed
   * @param {any} newValue - New value
   * @param {any} oldValue - Old value
   */
  emit(key, newValue, oldValue) {
    const listeners = this.listeners.get(key);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(newValue, oldValue, key);
        } catch (error) {
          console.error('Error in state listener:', error);
        }
      });
    }
  }

  /**
   * Update state
   * @param {object} updates - State updates
   */
  updateState(updates) {
    const oldState = { ...this.state };
    
    for (const [key, value] of Object.entries(updates)) {
      const oldValue = this.state[key];
      this.state[key] = value;
      
      if (oldValue !== value) {
        this.emit(key, value, oldValue);
      }
    }

    this.emit('stateChange', this.state, oldState);
  }

  /**
   * Set current active tab
   * @param {string} tabName - Tab name
   */
  setCurrentTab(tabName) {
    const oldTab = this.state.currentTab;
    if (oldTab !== tabName) {
      this.updateState({ currentTab: tabName });
      console.log(`🔄 Tab changed: ${oldTab} → ${tabName}`);
    }
  }

  /**
   * Get current active tab
   * @returns {string} Current tab name
   */
  getCurrentTab() {
    return this.state.currentTab;
  }

  /**
   * Set form state
   * @param {string} formType - Form type (main, supplementary, review)
   * @param {object} formState - Form state updates
   */
  setFormState(formType, formState) {
    const currentFormState = this.state.formStates[formType] || {};
    const newFormState = { ...currentFormState, ...formState };
    
    this.updateState({
      formStates: {
        ...this.state.formStates,
        [formType]: newFormState
      }
    });
  }

  /**
   * Get form state
   * @param {string} formType - Form type
   * @returns {object} Form state
   */
  getFormState(formType) {
    return this.state.formStates[formType] || { isValid: false, isDirty: false };
  }

  /**
   * Set loading state
   * @param {string} loadingType - Loading type
   * @param {boolean} isLoading - Loading state
   */
  setLoadingState(loadingType, isLoading) {
    this.updateState({
      loadingStates: {
        ...this.state.loadingStates,
        [loadingType]: isLoading
      }
    });

    // Auto-emit loading change for specific components
    this.emit(`loading:${loadingType}`, isLoading, !isLoading);
  }

  /**
   * Get loading state
   * @param {string} loadingType - Loading type
   * @returns {boolean} Loading state
   */
  getLoadingState(loadingType) {
    return this.state.loadingStates[loadingType] || false;
  }

  /**
   * Set UI mode
   * @param {string} mode - UI mode ('modern' or 'classic')
   */
  setUIMode(mode) {
    if (['modern', 'classic'].includes(mode)) {
      this.updateState({ uiMode: mode });
      localStorage.setItem('bibi-ui-mode', mode);
      
      // Update DOM classes
      document.documentElement.classList.toggle('modern-ui', mode === 'modern');
      console.log(`🎨 UI Mode changed to: ${mode}`);
    }
  }

  /**
   * Get UI mode
   * @returns {string} Current UI mode
   */
  getUIMode() {
    return this.state.uiMode;
  }

  /**
   * Set language
   * @param {string} language - Language code
   */
  setLanguage(language) {
    if (['vi', 'en', 'both'].includes(language)) {
      this.updateState({ language });
      localStorage.setItem('bibi-language', language);
      console.log(`🌐 Language changed to: ${language}`);
    }
  }

  /**
   * Get language
   * @returns {string} Current language
   */
  getLanguage() {
    return this.state.language;
  }

  /**
   * Set RAG status
   * @param {object} status - RAG status
   */
  setRAGStatus(status) {
    this.updateState({ ragStatus: status });
    this.emit('rag:status', status, this.state.ragStatus);
  }

  /**
   * Get RAG status
   * @returns {object} RAG status
   */
  getRAGStatus() {
    return this.state.ragStatus;
  }

  /**
   * Set error for a specific component
   * @param {string} componentKey - Component key
   * @param {string|null} error - Error message or null to clear
   */
  setError(componentKey, error) {
    const newErrors = { ...this.state.errors };
    
    if (error) {
      newErrors[componentKey] = error;
    } else {
      delete newErrors[componentKey];
    }
    
    this.updateState({ errors: newErrors });
    this.emit(`error:${componentKey}`, error, this.state.errors[componentKey]);
  }

  /**
   * Get error for a component
   * @param {string} componentKey - Component key
   * @returns {string|null} Error message
   */
  getError(componentKey) {
    return this.state.errors[componentKey] || null;
  }

  /**
   * Clear all errors
   */
  clearErrors() {
    this.updateState({ errors: {} });
  }

  /**
   * Add notification
   * @param {object} notification - Notification object
   */
  addNotification(notification) {
    const newNotification = {
      id: Date.now() + Math.random(),
      timestamp: new Date(),
      type: 'info', // 'info', 'success', 'warning', 'error'
      ...notification
    };

    this.updateState({
      notifications: [...this.state.notifications, newNotification]
    });

    this.emit('notification:added', newNotification);

    // Auto-remove after timeout if specified
    if (notification.autoRemove !== false) {
      const timeout = notification.timeout || 5000;
      setTimeout(() => {
        this.removeNotification(newNotification.id);
      }, timeout);
    }

    return newNotification.id;
  }

  /**
   * Remove notification
   * @param {string|number} notificationId - Notification ID
   */
  removeNotification(notificationId) {
    const newNotifications = this.state.notifications.filter(
      n => n.id !== notificationId
    );
    
    this.updateState({ notifications: newNotifications });
    this.emit('notification:removed', notificationId);
  }

  /**
   * Clear all notifications
   */
  clearNotifications() {
    this.updateState({ notifications: [] });
  }

  /**
   * Get all notifications
   * @returns {Array} Array of notifications
   */
  getNotifications() {
    return this.state.notifications;
  }

  /**
   * Reset state to defaults
   */
  resetState() {
    this.state = {
      currentTab: 'main',
      formStates: {
        main: { isValid: false, isDirty: false },
        supplementary: { isValid: false, isDirty: false },
        review: { isValid: false, isDirty: false }
      },
      loadingStates: {
        main: false,
        supplementary: false,
        review: false,
        rag: false
      },
      uiMode: 'modern',
      language: 'vi',
      ragStatus: { connected: false, message: '' },
      errors: {},
      notifications: []
    };
    
    this.emit('stateReset', this.state);
    console.log('🔄 UI State reset to defaults');
  }

  /**
   * Get debug info
   * @returns {object} Debug information
   */
  getDebugInfo() {
    return {
      state: this.state,
      listeners: Array.from(this.listeners.keys()),
      listenerCounts: Array.from(this.listeners.entries()).map(([key, listeners]) => ({
        key,
        count: listeners.size
      }))
    };
  }
}

// Create singleton instance
export const uiStateManager = new UIStateManager();

// Make available globally for compatibility
window.uiStateManager = uiStateManager;