// /static/js/controllers/lesson-plan/modules/wizard-manager.js
// Refactor from file chính lesson-plan-ui.js (14-May)
export class WizardManager {
    constructor(parentUI) {
        this.parentUI = parentUI;
    }
    
    // Phương thức đơn giản hóa chỉ để tương thích
    createFormWizard() {
        console.log('Simple form mode - wizard disabled');
        // Không làm gì cả, vì đã chuyển sang form đơn giản
    }
    
    // Giữ lại một số phương thức quan trọng nhưng đơn giản hóa
    toggleLessonTypePanels(lessonType) {
        const mainPanel = document.querySelector('.main-lessons-panel');
        const suppPanel = document.querySelector('.supplementary-lessons-panel');
        
        if (mainPanel && suppPanel) {
            mainPanel.style.display = lessonType === 'main' ? 'block' : 'none';
            suppPanel.style.display = lessonType === 'supplementary' ? 'block' : 'none';
        }
    }
}