// /static/js/controllers/lesson-plan/core/validation.js
// VALIDATION LAYER - Centralized validation logic
// This module handles all form validation without side effects

/**
 * Validation rules and error messages
 */
const VALIDATION_RULES = {
  required: (value, fieldName) => {
    if (!value || value.toString().trim() === '') {
      return `${fieldName} is required`;
    }
    return null;
  },
  
  minLength: (value, min, fieldName) => {
    if (value && value.toString().length < min) {
      return `${fieldName} must be at least ${min} characters`;
    }
    return null;
  },
  
  maxLength: (value, max, fieldName) => {
    if (value && value.toString().length > max) {
      return `${fieldName} must not exceed ${max} characters`;
    }
    return null;
  },
  
  arrayNotEmpty: (value, fieldName) => {
    if (!Array.isArray(value) || value.length === 0) {
      return `At least one ${fieldName} must be selected`;
    }
    return null;
  }
};

/**
 * Validate main lesson form data
 * @param {object} formData - Main lesson form data
 * @returns {object} Validation result with isValid and errors
 */
export function validateMainLessonForm(formData) {
  const errors = [];
  
  // Grade validation
  const gradeError = VALIDATION_RULES.required(formData.grade, 'Grade');
  if (gradeError) errors.push(gradeError);
  
  // Unit validation
  const unitError = VALIDATION_RULES.required(formData.unit, 'Unit');
  if (unitError) errors.push(unitError);
  
  // Lesson validation
  const lessonError = VALIDATION_RULES.required(formData.lesson, 'Lesson');
  if (lessonError) errors.push(lessonError);
  
  // Special requirements validation (optional but if provided, should have min length)
  if (formData.specialRequirements) {
    const specialReqError = VALIDATION_RULES.minLength(
      formData.specialRequirements, 
      10, 
      'Special requirements'
    );
    if (specialReqError) errors.push(specialReqError);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate supplementary lesson form data
 * @param {object} formData - Supplementary lesson form data
 * @returns {object} Validation result with isValid and errors
 */
export function validateSupplementaryForm(formData) {
  const errors = [];
  
  // Grade validation
  const gradeError = VALIDATION_RULES.required(formData.grade, 'Grade');
  if (gradeError) errors.push(gradeError);
  
  // Unit validation
  const unitError = VALIDATION_RULES.required(formData.unit, 'Unit');
  if (unitError) errors.push(unitError);
  
  // Skills validation (at least one skill must be selected)
  const skillsError = VALIDATION_RULES.arrayNotEmpty(formData.selectedSkills, 'skill');
  if (skillsError) errors.push(skillsError);
  
  // Additional instructions validation (optional)
  if (formData.additionalInstructions) {
    const instructionsError = VALIDATION_RULES.maxLength(
      formData.additionalInstructions,
      500,
      'Additional instructions'
    );
    if (instructionsError) errors.push(instructionsError);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate review form data
 * @param {object} formData - Review form data
 * @returns {object} Validation result with isValid and errors
 */
export function validateReviewForm(formData) {
  const errors = [];
  
  // Grade validation
  const gradeError = VALIDATION_RULES.required(formData.grade, 'Grade');
  if (gradeError) errors.push(gradeError);
  
  // Semester validation
  const semesterError = VALIDATION_RULES.required(formData.semester, 'Semester');
  if (semesterError) errors.push(semesterError);
  
  // Review type validation
  const reviewTypeError = VALIDATION_RULES.required(formData.reviewType, 'Review type');
  if (reviewTypeError) errors.push(reviewTypeError);
  
  // Skills validation (at least one skill must be selected)
  const skillsError = VALIDATION_RULES.arrayNotEmpty(formData.selectedSkills, 'skill');
  if (skillsError) errors.push(skillsError);
  
  // Additional instructions validation (optional)
  if (formData.additionalInstructions) {
    const instructionsError = VALIDATION_RULES.maxLength(
      formData.additionalInstructions,
      300,
      'Additional instructions'
    );
    if (instructionsError) errors.push(instructionsError);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate unit-centric form data
 * @param {object} formData - Unit-centric form data
 * @returns {object} Validation result with isValid and errors
 */
export function validateUnitCentricForm(formData) {
  const errors = [];
  
  // Grade validation
  const gradeError = VALIDATION_RULES.required(formData.grade, 'Grade');
  if (gradeError) errors.push(gradeError);
  
  // Unit validation
  const unitError = VALIDATION_RULES.required(formData.unit, 'Unit');
  if (unitError) errors.push(unitError);
  
  // Lesson type validation (should be either 'main' or 'supplementary')
  if (formData.lessonType && !['main', 'supplementary'].includes(formData.lessonType)) {
    errors.push('Invalid lesson type');
  }
  
  // For main lessons, validate lesson selection
  if (formData.lessonType === 'main' && !formData.selectedLesson) {
    errors.push('Lesson selection is required for main lessons');
  }
  
  // For supplementary lessons, validate skills
  if (formData.lessonType === 'supplementary') {
    const skillsError = VALIDATION_RULES.arrayNotEmpty(formData.selectedSkills, 'skill');
    if (skillsError) errors.push(skillsError);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Generic form field validator
 * @param {any} value - Value to validate
 * @param {Array} rules - Array of validation rules
 * @param {string} fieldName - Field name for error messages
 * @returns {Array} Array of error messages
 */
export function validateField(value, rules, fieldName) {
  const errors = [];
  
  for (const rule of rules) {
    let error = null;
    
    if (typeof rule === 'string') {
      // Simple rule name
      error = VALIDATION_RULES[rule]?.(value, fieldName);
    } else if (typeof rule === 'object') {
      // Rule with parameters
      const { name, params } = rule;
      error = VALIDATION_RULES[name]?.(value, ...params, fieldName);
    } else if (typeof rule === 'function') {
      // Custom rule function
      error = rule(value, fieldName);
    }
    
    if (error) {
      errors.push(error);
    }
  }
  
  return errors;
}

/**
 * Validate entire form based on field definitions
 * @param {object} formData - Form data to validate
 * @param {object} fieldDefinitions - Field definitions with validation rules
 * @returns {object} Validation result with isValid, errors, and fieldErrors
 */
export function validateForm(formData, fieldDefinitions) {
  const fieldErrors = {};
  const allErrors = [];
  
  for (const [fieldName, definition] of Object.entries(fieldDefinitions)) {
    const value = formData[fieldName];
    const rules = definition.rules || [];
    const displayName = definition.displayName || fieldName;
    
    const errors = validateField(value, rules, displayName);
    
    if (errors.length > 0) {
      fieldErrors[fieldName] = errors;
      allErrors.push(...errors);
    }
  }
  
  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    fieldErrors
  };
}

/**
 * Common field definitions for reuse
 */
export const FIELD_DEFINITIONS = {
  grade: {
    displayName: 'Grade',
    rules: ['required']
  },
  unit: {
    displayName: 'Unit',
    rules: ['required']
  },
  lesson: {
    displayName: 'Lesson',
    rules: ['required']
  },
  skills: {
    displayName: 'Skills',
    rules: ['arrayNotEmpty']
  },
  additionalInstructions: {
    displayName: 'Additional Instructions',
    rules: [
      { name: 'maxLength', params: [500] }
    ]
  }
};