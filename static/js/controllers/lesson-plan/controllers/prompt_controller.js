// /static/js/controllers/lesson-plan/controllers/prompt-controller.js
// EXTRACTED FROM lesson-plan-main.js - Lines ~2200-2550 (preparePrompt method)
// Handles all AI prompt generation logic

import { LESSON_PLAN_PROMPTS, SUPPLEMENTARY_PROMPTS } from '../lesson-plan-prompts.js';

/**
 * PromptController - Centralized AI prompt generation
 * EXTRACTED to reduce main.js complexity and improve AI prompt management
 */
export class PromptController {
  constructor() {
    // Ensure SUPPLEMENTARY_PROMPTS is available
    if (typeof SUPPLEMENTARY_PROMPTS === 'undefined') {
      console.warn('SUPPLEMENTARY_PROMPTS not defined, using fallback');
      this._supplementaryPrompts = {
        VOCABULARY_TT_PROMPT: `Create supplementary lesson (TT{ttNumber}) on vocabulary for Unit {unitNumber}: {unitTitle}.`,
        GRAMMAR_TT_PROMPT: `Create supplementary lesson (TT{ttNumber}) on grammar for Unit {unitNumber}: {unitTitle}.`,
        PRONUNCIATION_TT_PROMPT: `Create supplementary lesson (TT{ttNumber}) on pronunciation for Unit {unitNumber}: {unitTitle}.`,
        SKILLS_TT_PROMPT: `Create supplementary lesson (TT{ttNumber}) on {skillName} skills for Unit {unitNumber}: {unitTitle}.`
      };
    } else {
      this._supplementaryPrompts = SUPPLEMENTARY_PROMPTS;
    }
    
    console.log('🎯 PromptController initialized');
  }

  /**
   * Main prompt preparation method
   * EXTRACTED from lesson-plan-main.js:2200-2550
   */
  preparePrompt(lessonType, params) {
    try {
      console.log("Preparing prompt with params:", params);
      
      // Get actual lesson type from radio button
      let actualLessonType = lessonType; // Use passed lessonType first

      // Only check radio buttons for main tab (legacy compatibility)
      if (lessonType === 'main') {
        const lessonTypeRadio = document.querySelector('input[name="lesson-type"]:checked');
        actualLessonType = lessonTypeRadio ? lessonTypeRadio.value : 'main';
      }

      console.log("Actual lesson type:", actualLessonType);
      
      let promptTemplate = '';
      
      // REVIEW PROMPT GENERATION
      if (actualLessonType === 'review' || params.isReview || document.querySelector('input[type="radio"][value="review"]:checked')) {
        promptTemplate = this.generateReviewPrompt(params);
      }
      // MAIN LESSON PROMPT GENERATION
      else if (actualLessonType === 'main') {
        promptTemplate = this.generateMainLessonPrompt(params);
      } 
      // SUPPLEMENTARY LESSON PROMPT GENERATION
      else if (actualLessonType === 'supplementary') {
        promptTemplate = this.generateSupplementaryPrompt(params);
      } 
      // EXTRACURRICULAR PROMPT GENERATION
      else {
        promptTemplate = this.generateExtracurricularPrompt(params, actualLessonType);
      }

      // Process template with parameters
      return this.processPromptTemplate(promptTemplate, params);
      
    } catch (error) {
      console.error('Prompt preparation error:', error);
      return this.getFallbackPrompt(params);
    }
  }

  /**
   * Generate Review lesson prompt
   * EXTRACTED from main.js Review prompt logic
   */
  generateReviewPrompt(params) {
    console.log("Preparing Review prompt...");
    
    // Ensure review parameters
    if (!params.reviewNumber) {
      const reviewSelect = document.getElementById('review-select');
      params.reviewNumber = reviewSelect ? parseInt(reviewSelect.value) : 1;
    }
    
    if (!params.selectedSkills) {
      params.selectedSkills = Array.from(document.querySelectorAll('input[name="review-skill"]:checked'))
        .map(checkbox => checkbox.value);
    }
    
    // Determine related units
    let relatedUnits = [];
    switch(params.reviewNumber) {
      case 1: relatedUnits = [1, 2, 3]; break;
      case 2: relatedUnits = [4, 5, 6]; break;
      case 3: relatedUnits = [7, 8, 9]; break;
      case 4: relatedUnits = [10, 11, 12]; break;
      default: relatedUnits = [1, 2, 3];
    }
    params.relatedUnits = relatedUnits;
    params.relatedUnitsText = relatedUnits.join(', ');
    
    // Create skills text
    const skillsText = (params.selectedSkills || []).map(skill => {
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
    params.skillsText = skillsText;
    
    // Determine lesson type (Language or Skills)
    let lessonType = "Language";
    if ((params.selectedSkills || []).some(skill => ['reading', 'writing', 'listening', 'speaking'].includes(skill))) {
      lessonType = "Skills";
    }
    params.reviewLessonType = lessonType;
    
    // Enhanced Review template
    const promptTemplate = `
    You are a professional English teacher assistant helping create detailed lesson plans for secondary school students.

    Create a comprehensive and detailed Review lesson plan for Review ${params.reviewNumber} - Lesson: ${lessonType} for Grade ${params.grade || 6}, 
    focusing on skills: ${skillsText || 'Vocabulary, Grammar, Pronunciation'}.
    
    Main Title: REVIEW ${params.reviewNumber} (UNITS ${params.relatedUnitsText})
    Subtitle: Lesson ${lessonType === "Language" ? "1: Language" : "2: Skills"}
    
    IMPORTANT: This Review lesson must comprehensively cover knowledge from ${relatedUnits.length} Units (${params.relatedUnitsText}), 
    so it needs to be very detailed and complete - at least 15,000 characters.
    
    Create a lesson plan with complete structure:
    
    I. OBJECTIVES (detailed description):
      By the end of the lesson students will be able to:
      - Review all ${skillsText || 'pronunciation, vocabulary and grammar points'} from Units ${params.relatedUnitsText}
      - Apply knowledge through comprehensive practice activities
      - Demonstrate mastery of key concepts through assessment tasks
      
      1. Knowledge (detailed for each Unit)
      - Language focus: Comprehensive revision covering ALL vocabulary, grammar, pronunciation from Units ${params.relatedUnitsText}
      - Specific items from each unit [DETAILED DESCRIPTION FOR EACH UNIT]
      
      2. Core competence (expanded)
      - Advanced communication skills through complex activities
      - Collaborative learning through group projects
      - Critical thinking through problem-solving tasks
      - Creative expression through production activities
      
      3. Personal qualities (detailed)
      - Independent learning strategies
      - Time management skills
      - Peer support and leadership

    II. MATERIALS (complete list)
    - Textbooks Units ${params.relatedUnitsText}, teacher's guide
    - Computer, Internet, projector, speakers
    - Worksheets, flashcards, visual aids
    - Assessment rubrics and checklists
    - Interactive games and digital resources

    III. LANGUAGE ANALYSIS (detailed language analysis)
    [DETAILED ANALYSIS OF ALL VOCABULARY, GRAMMAR, PRONUNCIATION FROM UNITS]

    IV. Anticipated difficulties & Solutions (detailed table with at least 8-10 difficulties)
    [DETAILED TABLE WITH SPECIFIC SOLUTIONS]

    V. Board Plan (detailed complete diagram)
    [COMPLETE BOARD PLAN WITH ALL CONTENT]

    VI. DETAILED PROCEDURE (very detailed table with full descriptions):
    
    WARM-UP (8-10 minutes) - DESCRIBE EACH STEP IN DETAIL
    [CREATIVE AND ENGAGING WARM-UP ACTIVITY]
    
    PRACTICE (35-40 minutes) - DIVIDED INTO MULTIPLE ACTIVITIES:
    Activity 1: Vocabulary Review (10 minutes)
    [DETAILED STEP-BY-STEP DESCRIPTION, INSTRUCTIONS, EXPECTED ANSWERS]
    
    Activity 2: Grammar Practice (10 minutes) 
    [DETAILED GRAMMAR EXERCISES WITH SOLUTIONS]
    
    Activity 3: ${lessonType === "Skills" ? "Skills Integration" : "Pronunciation Practice"} (15 minutes)
    [SKILLS INTEGRATION OR PRONUNCIATION PRACTICE ACTIVITY]
    
    PRODUCTION (10-15 minutes)
    [DETAILED LANGUAGE PRODUCTION ACTIVITY]
    
    CONSOLIDATION (5 minutes)
    [COMPREHENSIVE SUMMARY]
    
    HOMEWORK & ASSESSMENT (2 minutes)
    [DETAILED HOMEWORK ASSIGNMENTS]

    VII. SUPPLEMENTARY ACTIVITIES (additional)
    [10-15 SUPPLEMENTARY EXERCISES FOR ADVANCED AND STRUGGLING STUDENTS]

    VIII. ASSESSMENT CRITERIA (assessment criteria)
    [DETAILED RUBRIC FOR STUDENT ASSESSMENT]

    Week: {week}
    Preparing day: {preparingDate}
    Teaching day: {teachingDate}
    
    IMPORTANT REQUIREMENTS: 
    - Each section must be described in extreme detail with at least 15-20 sentences
    - Include all instructions, expected answers, solutions
    - Total length must reach at least 15,000 characters
    - Review must cover all knowledge from ${relatedUnits.length} Units
    
    {additionalInstructions}
    `;
    
    // Update params title
    params.title = `REVIEW ${params.reviewNumber} (UNITS ${params.relatedUnitsText}) - ${lessonType}`;
    
    console.log("Review template prepared");
    return promptTemplate;
  }

  /**
   * Generate Main lesson prompt
   * EXTRACTED from main.js Main lesson logic
   */
  generateMainLessonPrompt(params) {
    const lessonTemplateMap = {
      'getting-started': LESSON_PLAN_PROMPTS.unit_lesson1_getting_started,
      'closer-look-1': LESSON_PLAN_PROMPTS.unit_lesson2_closer_look1,
      'closer-look-2': LESSON_PLAN_PROMPTS.unit_lesson3_closer_look2,
      'communication': LESSON_PLAN_PROMPTS.unit_lesson4_communication || LESSON_PLAN_PROMPTS.main,
      'skills-1': LESSON_PLAN_PROMPTS.unit_lesson5_skills1 || LESSON_PLAN_PROMPTS.main,
      'skills-2': LESSON_PLAN_PROMPTS.unit_lesson6_skills2 || LESSON_PLAN_PROMPTS.main,
      'looking-back': LESSON_PLAN_PROMPTS.unit_lesson7_looking_back || LESSON_PLAN_PROMPTS.main
    };
    
    // Get template corresponding to selected lesson or use main if not found
    let promptTemplate = lessonTemplateMap[params.selectedLesson] || LESSON_PLAN_PROMPTS.main;
    
    if (!promptTemplate) {
      console.log(`Template for ${params.selectedLesson} not found, using main template`);
      promptTemplate = LESSON_PLAN_PROMPTS.main;
    }
    
    return promptTemplate;
  }

  /**
   * Generate Supplementary lesson prompt
   * EXTRACTED from main.js Supplementary logic
   */
  generateSupplementaryPrompt(params) {
    let promptTemplate;
    
    // Select appropriate template based on supplementary type
    switch(params.supplementary_type) {
      case 'vocabulary':
        promptTemplate = this._supplementaryPrompts.VOCABULARY_TT_PROMPT;
        break;
      case 'grammar':
        promptTemplate = this._supplementaryPrompts.GRAMMAR_TT_PROMPT;
        break;
      case 'pronunciation':
        promptTemplate = this._supplementaryPrompts.PRONUNCIATION_TT_PROMPT;
        break;
      case 'reading':
      case 'listening':
      case 'speaking':
      case 'writing':
        promptTemplate = this._supplementaryPrompts.SKILLS_TT_PROMPT;
        break;
      default:
        // Fallback template
        promptTemplate = LESSON_PLAN_PROMPTS.supplementary || this.getSupplementaryFallbackTemplate();
    }
    
    return promptTemplate;
  }

  /* Generate Extracurricular lesson prompt */
  generateExtracurricularPrompt(params, actualLessonType) {
    if (actualLessonType === 'test') {
      return this.getTestPromptTemplate();
    } else {
      // ✅ FORCE USE FALLBACK: Original template có Unit-based content sai
      console.log("🎭 Using extracurricular fallback template (activity-based)");
      return this.getExtracurricularFallbackTemplate();
    }
  }

  /**
   * Process prompt template with parameter replacement
   * EXTRACTED from main.js template processing logic
   */
  processPromptTemplate(promptTemplate, params) {
    // Set up additional instructions
    let additionalInstructions = '';
    if (params.additional_instructions) {
      additionalInstructions = params.additional_instructions;
    }
    
    // Add default objectives if not present
    if (!params.objectives) {
      params.objectives = "Help students master knowledge and skills in the lesson.";
    }
    
    // Add important note
    additionalInstructions += `\n\nImportant note: Please create a complete, detailed lesson plan based on the provided information. Do not request additional information. Use your professional expertise to fill in any missing parts.`;
    
    // Replace parameters in template
    for (const [key, value] of Object.entries(params)) {
      if (value !== null && value !== undefined) {
        const safeValue = String(value);
        const regex = new RegExp(`{${key}}`, 'g');
        promptTemplate = promptTemplate.replace(regex, safeValue);
      }
    }
    
    // Replace default placeholders
    promptTemplate = this.replaceDefaultPlaceholders(promptTemplate, params);
    
    // Handle special supplementary replacements
    if (params.lessonType === 'supplementary' || params.supplementary_type) {
      promptTemplate = this.processSupplementaryReplacements(promptTemplate, params);
    }

    // Replace final additional instructions
    promptTemplate = promptTemplate.replace(/{additionalInstructions}/g, additionalInstructions);
    
    console.log("Final prompt template prepared");
    return promptTemplate;
  }

  /**
   * Replace default placeholders in template
   */
  replaceDefaultPlaceholders(template, params) {
    const replacements = {
      '{unitNumber}': params.unit || "1",
      '{unitName}': params.unitName || `Unit ${params.unit}`,
      '{grade}': params.grade || "6",
      '{week}': params.week || "Week 1",
      '{preparingDate}': params.preparingDate || new Date().toLocaleDateString('vi-VN'),
      '{teachingDate}': params.teachingDate || params.period || "",
      '{lessonNumber}': params.lessonNumber || "1",
      '{lessonName}': params.lessonName || "Getting started",
      '{topic}': params.topic || params.lessonName || "English Activities",
      '{pronunciationFocus}': "/ɑː/, /ʌ/",
      '{grammarFocus}': "Present Simple"
    };
    
    for (const [placeholder, value] of Object.entries(replacements)) {
      const regex = new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g');
      template = template.replace(regex, value);
    }
    
    return template;
  }

  /**
   * Process supplementary-specific replacements
   */
  processSupplementaryReplacements(template, params) {
    // Generate TT number
    const ttNumber = params.ttNumber || `TT${(parseInt(params.week?.replace('Week ', '') || '1') * 5) || '01'}`;
    template = template.replace(/{ttNumber}/g, ttNumber);
    
    // Handle exercise types
    let exerciseTypes = [];
    if (params.exerciseTypes && Array.isArray(params.exerciseTypes)) {
      exerciseTypes = params.exerciseTypes;
    } else {
      // Default exercise types based on supplementary type
      const exerciseTypeMap = {
        vocabulary: ['matching', 'fill-blanks', 'multiple-choice'],
        grammar: ['fill-blanks', 'transformation', 'multiple-choice'],
        pronunciation: ['minimal-pairs', 'identification', 'word-stress']
      };
      exerciseTypes = exerciseTypeMap[params.supplementary_type] || ['comprehension', 'true-false', 'fill-blanks'];
    }
    
    template = template.replace(/{exerciseTypes}/g, exerciseTypes.join(', '));
    
    // Handle specific topic
    const specificTopic = params.specificTopic || params.topic || 'vocabulary and grammar';
    template = template.replace(/{specificTopic}/g, specificTopic);
    
    // Handle lesson link text
    const lessonLinkText = params.lessonLink || 'lessons in Unit';
    template = template.replace(/{lessonLinkText}/g, lessonLinkText);
    
    // Handle skill names for skills-based supplementary lessons
    if (['reading', 'listening', 'speaking', 'writing'].includes(params.supplementary_type)) {
      const skillName = params.supplementary_type.charAt(0).toUpperCase() + params.supplementary_type.slice(1);
      template = template.replace(/{skillName}/g, skillName);
      template = template.replace(/{SKILL_NAME}/g, skillName.toUpperCase());
    }
    
    return template;
  }

  /**
   * Get fallback prompt for error cases
   */
  getFallbackPrompt(params) {
    return `You are an English teacher assistant. Create a complete ${params.isMainLesson ? 'main' : 'supplementary'} lesson plan for Grade 6, ${params?.title || 'Unit 1'}.`;
  }

  /**
   * Get supplementary fallback template
   */
  getSupplementaryFallbackTemplate() {
    return `
    You are a professional English teacher assistant helping create detailed lesson plans for secondary school students.

    Create a detailed English SUPPLEMENTARY lesson plan following standard structure:

    Week: {week}
    Preparing day: {preparingDate}
    Teaching day: {teachingDate}

    UNIT {unitNumber}: {unitName}
    Supplementary lesson: {lessonName}

    I. Objectives:
    1. Knowledge
      - Review and reinforce vocabulary/grammar related to {unitName}
      - Strengthen {lessonName} usage skills
    
    II. Materials
      - English textbook Grade {grade}, Unit {unitNumber}
      - Supplementary worksheets
      - Projector, speakers (if needed)
    
    III. Teaching procedure:
    A. Warm-up (3-5 minutes)
      - Aim: Activate previous knowledge
      - Procedure: [Detailed description]
    
    B. Review (5-7 minutes)
      - Aim: Review related knowledge
      - Procedure: [Detailed description]
    
    C. Practice (15-20 minutes)
      - Aim: Extended practice
      - Procedure: [Detailed description]
    
    D. Production/Application (10-12 minutes)
      - Aim: Apply knowledge in practice
      - Procedure: [Detailed description]
    
    E. Wrap-up (2-3 minutes)
      - Aim: Summarize and reinforce
      - Procedure: [Detailed description]
    
    IV. Homework
      - [Detailed homework description]

    {additionalInstructions}
    `;
  }

  /* Get extracurricular fallback template */
  getExtracurricularFallbackTemplate() {
    return `
🎯 HOẠT ĐỘNG NGOẠI KHÓA CHUYÊN BIỆT

CHỦ ĐỀ CHÍNH: "{topic}"
ĐỊA ĐIỂM: {additionalInstructions}
ĐỐI TƯỢNG: Học sinh lớp {grade}  
THỜI GIAN: {duration} phút

⚠️ Tạo hoạt động CỤ THỂ về "{topic}", không phải hoạt động tiếng Anh chung!

Tạo kế hoạch gồm các mục sau (chỉ tối đa 6 hoạt động, không chia nhỏ thành nhiều hoạt động phụ):

I. THÔNG TIN HOẠT ĐỘNG
- Tên: [Tên cụ thể liên quan "{topic}"]
- Mục tiêu: [Specific cho "{topic}"]

II. CHUẨN BỊ  
- Địa điểm: {additionalInstructions}
- Dụng cụ cho hoạt động "{topic}" của Giáo viên và học sinh

III. TIẾN TRÌNH HOẠT ĐỘNG (Tối đa 6 hoạt động, mỗi hoạt động không quá 5 dòng. Không chia nhỏ!)
[Hoạt động phải đúng chủ đề "{topic}", không phải tiếng Anh chung]

IV. ĐÁNH GIÁ (1-2 câu)
- Tiêu chí phù hợp với "{topic}"

⚠️ Tổng độ dài tối đa 700 từ (3000 ký tự) – NGẮN GỌN, THÂN THIỆN, VUI VẺ, chỉ lấy ý chính!
Chỉ trình bày tối đa 6 hoạt động, không chia nhỏ thành nhiều hoạt động phụ.
`;

  }

  /* Get test prompt template */
  getTestPromptTemplate() {
    return `
    You are a professional English teacher assistant helping create detailed test materials for secondary school students.

    Create a comprehensive English test:

    Grade: {grade}
    Test Type: {testType}
    Duration: {testDuration} minutes
    Topic: {topic}

    I. Test Structure:
    - Vocabulary section (25%)
    - Grammar section (25%) 
    - Reading comprehension (25%)
    - Writing section (25%)

    II. Instructions:
    - Clear, age-appropriate instructions
    - Progressive difficulty levels
    - Comprehensive coverage of topics

    III. Answer Key:
    - Complete answer key with explanations
    - Scoring rubric
    - Common mistakes to watch for

    {additionalInstructions}
    `;
  }
}

// Create singleton instance
export const promptController = new PromptController();

// Make available globally for compatibility
window.promptController = promptController;