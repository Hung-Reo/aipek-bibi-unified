// /static/js/controllers/lesson-plan/controllers/form-controller.js
// EXTRACTED FROM lesson-plan-main.js - Form data collection and validation logic
// Handles all form operations: data collection, validation, parameter building

/**
 * FormController - Centralized form management
 * EXTRACTED to reduce main.js complexity and improve form handling
 */
export class FormController {
  constructor() {
    console.log('📝 FormController initialized');
  }

  /**
   * Get form parameters based on lesson type
   * EXTRACTED from lesson-plan-main.js:getFormParams method (~300 lines)
   */
  getFormParams(lessonType) {
    try {
      // Create params object with default data
      let params = {
        grade: 6, // Default Grade 6
        lessonType: lessonType
      };
      
      // 1. Get grade information (if available)
      const gradeSelect = document.getElementById('grade-select');
      if (gradeSelect) {
        params.grade = gradeSelect.value || '6';
      }
      
      // 2. Process based on lesson type
      if (lessonType === 'main') {
        return this.getMainLessonParams(params);
      }
      else if (lessonType === 'review' || document.querySelector('input[type="radio"][value="review"]:checked')) {
        return this.getReviewParams(params);
      }
      else if (lessonType === 'extracurricular') {
        return this.getExtracurricularParams(params);  // ✅ NEW: Specific handler
      }
      else {
        return this.getOtherLessonParams(params, lessonType);
      }
      
    } catch (error) {
      console.error('Form parameter collection error:', error);
      alert('Please fill in all required information to generate lesson plan.');
      return null;
    }
  }

  /**
   * Get main lesson parameters
   * EXTRACTED from main lesson handling logic
   */
  getMainLessonParams(params) {
    // 2a. Get Unit information
    const unitSelect = document.getElementById('unit-select');
    if (!unitSelect || !unitSelect.value) {
      // Try wizard unit select if main not found
      const wizardUnitSelect = document.querySelector('.wizard-pane[data-step="2"] select[id^="unit"]');
      if (!wizardUnitSelect || !wizardUnitSelect.value) {
        console.warn('Unit not found or empty');
        
        // Try to calculate from week (backward compatibility)
        const weekInput = document.getElementById('week-input');
        if (!weekInput || !weekInput.value) {
          console.warn('Week not found or empty');
          return null;
        }
        
        params.unitNumber = this.calculateUnitFromWeek(weekInput.value);
      } else {
        params.unitNumber = parseInt(wizardUnitSelect.value);
      }
    } else {
      params.unitNumber = parseInt(unitSelect.value);
    }
    
    // Calculate week and semester from Unit
    const unitNumber = params.unitNumber;
    const semester = unitNumber <= 6 ? 1 : 2;
    const startWeek = (unitNumber - 1) * 2 + 1;
    const startWeekFormatted = startWeek.toString().padStart(2, '0');
    
    // Get Unit data from UNITS_DATA
    let unitData = window.UNITS_DATA ? window.UNITS_DATA[unitNumber] : null;
    if (!unitData) {
      unitData = this.getDefaultUnitData(unitNumber, semester);
    }
    
    // Get lesson information
    const lessonSelect = document.getElementById('lesson-select');
    if (!lessonSelect || !lessonSelect.value) {
      console.warn('Lesson not found or empty');
      return null;
    }
    
    // Map lesson types
    const lessonInfo = this.mapLessonType(lessonSelect.value);
    
    // Fill parameters for main lesson
    params.unitName = unitData.name || `Unit ${unitNumber}`;
    params.week = `Week ${startWeekFormatted}`;
    params.period = this.getWeekPeriod ? this.getWeekPeriod(startWeekFormatted) : '';
    params.unit = unitNumber;
    params.semester = semester;
    params.lessons = [lessonInfo.name];
    params.lessonName = lessonInfo.name;
    params.lessonNumber = lessonInfo.number;
    params.focusSkill = lessonInfo.focus;
    params.title = `Unit ${unitNumber}: ${params.lessonName}`;
    params.selectedLesson = lessonSelect.value;
    params.isMainLesson = true;
    
    return params;
  }

  /**
   * Get review lesson parameters  
   * EXTRACTED from review handling logic
   */
  getReviewParams(params) {
    // Try to get review select from main sidebar first, then fallback to old sidebar
    let reviewSelect = document.getElementById('review-select-main');
    if (!reviewSelect || !reviewSelect.value) {
      reviewSelect = document.getElementById('review-select');
    }
    
    if (!reviewSelect || !reviewSelect.value) {
      console.warn('Review select not found or empty');
      alert('Please select a Review before generating');
      return null;
    }
    
    // Convert review value to number
    const reviewNumber = parseInt(reviewSelect.value);
    if (isNaN(reviewNumber) || reviewNumber < 1 || reviewNumber > 4) {
      console.warn(`Invalid review value: ${reviewSelect.value}`);
      return null;
    }
    
    // Determine related units and semester
    const reviewData = this.getReviewData(reviewNumber);
    const weekNumber = reviewNumber * 6 + 1;
    const weekFormatted = weekNumber.toString().padStart(2, '0');
    
    // Get selected skills from main sidebar first, then fallback
    let selectedSkills = Array.from(document.querySelectorAll('input[name="review-skill-main"]:checked'))
      .map(checkbox => checkbox.value);

    if (selectedSkills.length === 0) {
      selectedSkills = Array.from(document.querySelectorAll('input[name="review-skill"]:checked'))
        .map(checkbox => checkbox.value);
    }
    
    // Default skills if none selected
    if (selectedSkills.length === 0) {
      console.warn('No skills selected, using defaults');
      selectedSkills.push('vocabulary', 'grammar', 'pronunciation');
    }
    
    // Create skills text description
    const skillsText = this.formatSkillsText(selectedSkills);
    
    // Fill parameters for review
    params.reviewNumber = reviewNumber;
    params.reviewName = `Review ${reviewNumber}`;
    params.relatedUnits = reviewData.relatedUnits;
    params.relatedUnitsText = reviewData.relatedUnits.join(', ');
    params.week = `Week ${weekFormatted}`;
    params.period = this.getWeekPeriod ? this.getWeekPeriod(weekFormatted) : '';
    params.semester = reviewData.semester;
    params.isReview = true;
    params.selectedSkills = selectedSkills;
    params.skillsText = skillsText;
    params.title = `Review ${reviewNumber}: ${skillsText}`;
    
    return params;
  }

  /**
   * Get parameters for other lesson types (supplementary, extracurricular, test)
   * EXTRACTED from other lesson handling logic
   */
  getOtherLessonParams(params, lessonType) {
    const weekInput = document.getElementById('week-input');
    if (!weekInput || !weekInput.value) {
      console.warn('Week not found or empty');
      return null;
    }
    
    const weekNumber = weekInput.value.padStart(2, '0');
    const unitNumber = this.calculateUnitFromWeek(weekNumber);
    
    // Get week details or create sample data
    let weekDetails = this.getWeekDetails ? this.getWeekDetails(weekNumber) : null;
    if (!weekDetails) {
      weekDetails = this.generateWeekDetails(weekNumber, unitNumber);
    }
    
    // Fill basic information from weekDetails
    params.week = `Week ${weekNumber}`;
    params.period = weekDetails.period || '';
    params.unit = unitNumber;
    params.unitNumber = unitNumber;
    params.unitName = `UNIT ${unitNumber}`;
    
    // Process based on lesson type
    if (lessonType === 'supplementary') {
      return this.getSupplementaryParams(params, weekNumber, unitNumber, weekDetails);
    }
    else if (lessonType === 'extracurricular') {
      return this.getExtracurricularParams(params);
    }
    else if (lessonType === 'test') {
      return this.getTestParams(params);
    }
    
    return params;
  }

  /**
   * Get supplementary lesson parameters
   */
  getSupplementaryParams(params, weekNumber, unitNumber, weekDetails) {
    const weekNum = parseInt(weekNumber);
    const isFirstWeek = weekNum % 2 === 1;
    const suppLessons = isFirstWeek 
      ? [`Vocabulary in Unit ${unitNumber}`, `Pronunciation exercises`]
      : [`Grammar exercises`, `Review exercises`];
    
    params.lessons = suppLessons;
    params.lessonName = suppLessons.join(", ");
    params.title = `Supplementary Unit ${unitNumber}: ${params.lessonName}`;
    params.isMainLesson = false;
    params.lessonType = "supplementary";
    
    // Determine supplementary type
    if (suppLessons[0].includes("Vocabulary")) {
      params.supplementary_type = "vocabulary";
      params.topic = "vocabulary";
      params.focusSkill = "vocabulary";
    } else if (suppLessons[0].includes("Pronunciation")) {
      params.supplementary_type = "pronunciation";
      params.topic = "pronunciation";
      params.focusSkill = "pronunciation";
    } else if (suppLessons[0].includes("Grammar")) {
      params.supplementary_type = "grammar";
      params.topic = "grammar";
      params.focusSkill = "grammar";
    } else {
      params.supplementary_type = "mixed";
      params.topic = "comprehensive review";
      params.focusSkill = "mixed";
    }
    
    return params;
  }

  /* Get extracurricular activity parameters */
  getExtracurricularParams(params) {
    // ✅ CORRECTED: Use actual HTML field IDs
    const gradeSelect = document.getElementById('grade-select-extra');
    const topicInput = document.getElementById('topic-input-extra');
    const durationInput = document.getElementById('duration-input-extra');
    const additionalInput = document.getElementById('additional-instructions-extra');
    
    // Validate required fields
    if (!topicInput || !topicInput.value.trim()) {
      console.warn('Topic is required for extracurricular');
      alert('Vui lòng nhập chủ đề hoạt động!');
      return null;
    }
    
    // Build params with correct field values
    params.grade = gradeSelect?.value || '6';
    params.topic = topicInput.value.trim();  // ✅ FIX: Now gets actual user input!
    params.duration = parseInt(durationInput?.value) || 45;
    params.additionalInstructions = additionalInput?.value || '';
    params.lessonType = 'extracurricular';
    params.isExtracurricular = true;
    params.activityName = params.topic; // Use topic as activity name
    params.title = `Hoạt động ngoại khóa: ${params.topic}`;
    
    // Add date fields
    params.preparingDate = new Date().toLocaleDateString('vi-VN');
    params.teachingDate = '';
    
    console.log('✅ Extracurricular params collected with CORRECT field IDs:', params);
    return params;
  }

  /* Get test parameters */
  getTestParams(params) {
    const testTypeSelect = document.getElementById('test-type');
    const testType = testTypeSelect && testTypeSelect.value 
      ? testTypeSelect.value 
      : "15-minute";
    
    // Map test types
    const testTypeMap = {
      '15-minute': {name: '15-minute Test', duration: 15},
      '45-minute': {name: '45-minute Test', duration: 45},
      'midterm': {name: 'Midterm Test', duration: 45},
      'final': {name: 'Final Test', duration: 60}
    };
    
    const testInfo = testTypeMap[testType] || {name: 'Test', duration: 15};
    
    params.testType = testType;
    params.testName = testInfo.name;
    params.testDuration = testInfo.duration;
    params.title = testInfo.name;
    params.isTest = true;
    
    return params;
  }

  /**
   * Helper method: Calculate unit from week
   */
  calculateUnitFromWeek(weekNumber) {
    const weekNum = parseInt(weekNumber);
    let unitNumber;
    
    if (weekNum > 20) {
      const adjustedWeek = weekNum - 20;
      unitNumber = Math.floor((adjustedWeek - 1) / 2) + 7;
    } else {
      unitNumber = Math.floor((weekNum - 1) / 2) + 1;
    }
    
    return Math.min(Math.max(unitNumber, 1), 12);
  }

  /**
   * Helper method: Get default unit data
   */
  getDefaultUnitData(unitNumber, semester) {
    return {
      name: `UNIT ${unitNumber}`,
      semester: semester,
      lessons: {
        1: {name: "Getting started", focus: "Vocabulary"},
        2: {name: "A closer look 1", focus: "Vocabulary & Pronunciation"},
        3: {name: "A closer look 2", focus: "Grammar"},
        4: {name: "Communication", focus: "Speaking"},
        5: {name: "Skills 1", focus: "Reading"},
        6: {name: "Skills 2", focus: "Listening & Writing"},
        7: {name: "Looking back & Project", focus: "Review"}
      }
    };
  }

  /**
   * Helper method: Map lesson types
   */
  mapLessonType(selectedLesson) {
    const lessonMap = {
      'getting-started': {name: 'Getting started', number: '1', focus: 'vocabulary'},
      'closer-look-1': {name: 'A closer look 1', number: '2', focus: 'vocabulary'},
      'closer-look-2': {name: 'A closer look 2', number: '3', focus: 'grammar'},
      'communication': {name: 'Communication', number: '4', focus: 'speaking'},
      'skills-1': {name: 'Skills 1', number: '5', focus: 'reading'},
      'skills-2': {name: 'Skills 2', number: '6', focus: 'listening'},
      'looking-back': {name: 'Looking back & Project', number: '7', focus: 'integrated'}
    };
    
    return lessonMap[selectedLesson] || {name: 'Getting started', number: '1', focus: 'mixed'};
  }

  /**
   * Helper method: Get review data by number
   */
  getReviewData(reviewNumber) {
    const reviewMap = {
      1: { relatedUnits: [1, 2, 3], semester: 1 },
      2: { relatedUnits: [4, 5, 6], semester: 1 },
      3: { relatedUnits: [7, 8, 9], semester: 2 },
      4: { relatedUnits: [10, 11, 12], semester: 2 }
    };
    
    return reviewMap[reviewNumber] || reviewMap[1];
  }

  /**
   * Helper method: Format skills text
   */
  formatSkillsText(selectedSkills) {
    return selectedSkills.map(skill => {
      const skillMap = {
        vocabulary: 'Vocabulary',
        grammar: 'Grammar',
        pronunciation: 'Pronunciation', 
        reading: 'Reading',
        writing: 'Writing',
        listening: 'Listening',
        speaking: 'Speaking'
      };
      return skillMap[skill] || skill;
    }).join(', ');
  }

  /**
   * Helper method: Generate week details
   */
  generateWeekDetails(weekNumber, unitNumber) {
    const weekNum = parseInt(weekNumber);
    const isFirstWeek = weekNum % 2 === 1;
    
    return {
      period: `Week ${weekNumber}`,
      unit: unitNumber,
      mainLessons: isFirstWeek 
        ? ["Getting started", "A closer look 1", "A closer look 2"] 
        : ["Communication", "Skills 1", "Skills 2", "Looking back & Project"],
      suppLessons: isFirstWeek
        ? [`Vocabulary in Unit ${unitNumber}`, `Pronunciation exercises`]
        : [`Grammar exercises`, `Review exercises`]
    };
  }

  /**
   * Get week period helper
   * EXTRACTED from main.js helper method
   */
  getWeekPeriod(weekNumber) {
    // Try to get from getWeekDetails first
    const weekDetails = this.getWeekDetails ? this.getWeekDetails(weekNumber) : null;
    if (weekDetails && weekDetails.period) {
      return weekDetails.period;
    }
    
    // Generate sample time information if not available
    const weekNum = parseInt(weekNumber);
    const semester = weekNum > 20 ? 2 : 1;
    const startMonth = semester === 1 ? 7 : 12;
    const startYear = 2025;
    const weekOffset = semester === 1 ? weekNum : (weekNum - 20);
    
    const startDate = new Date(startYear, startMonth - 1, 21 + (weekOffset - 1) * 7);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 5);
    
    const formatDate = (date) => {
      return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    };
    
    return `${formatDate(startDate)}-${formatDate(endDate)}`;
  }

  /**
   * Add common form parameters
   * EXTRACTED from main.js parameter completion logic
   */
  addCommonParameters(params) {
    // 3. Add preparation and teaching information
    params.preparingDate = document.getElementById('preparing-date')?.value || new Date().toLocaleDateString('vi-VN');
    params.teachingDate = document.getElementById('teaching-date')?.value || params.period || '';
    
    // 4. Add special requirements (if any)
    const additionalInstructions = document.getElementById('additional-instructions')?.value;
    if (additionalInstructions) {
      params.additional_instructions = additionalInstructions;
    }
    
    return params;
  }

  /**
   * Validate form parameters
   * Basic validation for required fields
   */
  validateFormParams(params) {
    const errors = [];
    
    if (!params.grade) {
      errors.push('Grade is required');
    }
    
    if (params.lessonType === 'main') {
      if (!params.unitNumber || !params.selectedLesson) {
        errors.push('Unit and lesson selection are required for main lessons');
      }
    } else if (params.lessonType === 'review') {
      if (!params.reviewNumber || !params.selectedSkills || params.selectedSkills.length === 0) {
        errors.push('Review number and skills are required for review lessons');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Get form data for supplementary lessons
   * Used by SupplementaryController
   */
  getSupplementaryFormData() {
    // Try multiple possible field IDs
    const grade = document.getElementById('supplementary-grade-select')?.value ||
                  document.getElementById('grade-select')?.value ||
                  document.querySelector('select[id*="grade"]')?.value;
                  
    const unit = document.getElementById('supplementary-unit-select')?.value ||
                 document.getElementById('unit-select')?.value ||
                 document.querySelector('select[id*="unit"]')?.value;

    // Try multiple possible skill checkbox names
    let selectedSkills = [];
    const skillSelectors = [
        'input[name="supplementary-skill"]:checked',
        'input[name="skill"]:checked', 
        'input[type="checkbox"]:checked'
    ];
    
    for (const selector of skillSelectors) {
        const checkboxes = document.querySelectorAll(selector);
        if (checkboxes.length > 0) {
            selectedSkills = Array.from(checkboxes).map(cb => cb.value);
            break;
        }
    }

    const additionalInstructions = document.getElementById('supplementary-additional-instructions')?.value ||
                                  document.getElementById('additional-instructions')?.value ||
                                  document.querySelector('textarea')?.value;

    return { grade, unit, selectedSkills, additionalInstructions };
  }
}

// Create singleton instance
export const formController = new FormController();

// Make available globally for compatibility
window.formController = formController;