// ui-mode-manager.js - Quản lý chế độ giao diện

export class UIModeManager {
    constructor() {
      this.body = document.body;
      this.appContainer = document.getElementById('bibi-grammar-app');
      this.uiModeToggle = document.getElementById('ui-mode-toggle');
      this.currentMode = localStorage.getItem('bibi-ui-mode') || 'modern';
      
      this.initialize();
    }
    
    initialize() {
      // Thiết lập chế độ ban đầu
      this.applyUIMode(this.currentMode);
      
      // Thiết lập sự kiện cho nút chuyển đổi
      if (this.uiModeToggle) {
        this.uiModeToggle.addEventListener('click', () => {
          const newMode = this.currentMode === 'modern' ? 'classic' : 'modern';
          this.applyUIMode(newMode);
          localStorage.setItem('bibi-ui-mode', newMode);
        });
      }
      
      console.log(`🎨 UI Mode Manager initialized with mode: ${this.currentMode}`);
    }
    
    applyUIMode(mode) {
      // Lưu chế độ trước đó để kiểm tra nếu có thay đổi
      const previousMode = this.currentMode;
      this.currentMode = mode;
      
      if (mode === 'modern') {
        // Áp dụng chế độ hiện đại
        this.body.classList.add('modern-ui');
        this.appContainer?.classList.remove('classic-ui');
        this.updateToggleButtonText('Giao diện cổ điển');
      } else {
        // Áp dụng chế độ cổ điển
        this.body.classList.remove('modern-ui');
        this.appContainer?.classList.add('classic-ui');
        this.updateToggleButtonText('Giao diện hiện đại');
      }
      
      // Nếu chế độ thực sự thay đổi, gửi sự kiện thông báo
      if (previousMode !== mode) {
        // Lưu vào localStorage
        localStorage.setItem('bibi-ui-mode', mode);
        
        // Phát sự kiện để các module khác biết về sự thay đổi
        const event = new CustomEvent('uiModeChanged', { 
          detail: { 
            mode: mode,
            previousMode: previousMode 
          } 
        });
        document.dispatchEvent(event);
        
        console.log(`🎨 UI Mode changed from ${previousMode} to ${mode}`);
      }
    }
    
    updateToggleButtonText(text) {
      if (this.uiModeToggle) {
        const spanElement = this.uiModeToggle.querySelector('span');
        if (spanElement) {
          spanElement.textContent = text;
        }
      }
    }
    
    getCurrentMode() {
      return this.currentMode;
    }

    // Thêm vào cuối class, trước dấu ngoặc nhọn đóng cuối cùng
    listenToModeChanges(callback) {
      if (typeof callback === 'function') {
        document.addEventListener('uiModeChanged', (event) => {
          callback(event.detail.mode, event.detail.previousMode);
        });
      }
    }
  }