// /static/js/controllers/lesson-plan/modules/test-prompts.js
// DYNAMIC Test Prompts - ✅ UPDATED với Dynamic Listening Section
// Unit-aware content generation với phân bổ câu hỏi listening linh động theo thời gian test

/**
 * Database nội dung các Unit - Lớp 6
 */
const UNIT_CONTENT = {
  1: { 
    name: "MY NEW SCHOOL", 
    topics: ["school facilities", "subjects", "teachers", "new friends"], 
    vocab: ["subjects", "classrooms", "teachers", "students", "school facilities", "timetable"]
  },
  2: { 
    name: "MY HOUSE", 
    topics: ["house rooms", "furniture", "family members", "daily activities"], 
    vocab: ["rooms", "furniture", "family members", "daily activities", "house parts"]
  },
  3: { 
    name: "MY FRIENDS", 
    topics: ["personality", "appearance", "friendship activities", "character"], 
    vocab: ["personality traits", "appearance", "friendship", "describing people", "activities"]
  },
  4: { 
    name: "MY NEIGHBOURHOOD", 
    topics: ["places", "directions", "community facilities", "location"], 
    vocab: ["places", "directions", "facilities", "community", "prepositions of place"]
  },
  5: { 
    name: "NATURAL WONDERS OF VIET NAM", 
    topics: ["natural landmarks", "travel", "animals", "geography"], 
    vocab: ["nature", "animals", "travel", "geography", "natural features"]
  },
  6: { 
    name: "OUR TET HOLIDAY", 
    topics: ["traditions", "celebrations", "family gatherings", "food"], 
    vocab: ["celebrations", "traditions", "food", "family gatherings", "customs"]
  },
  7: { 
    name: "TELEVISION", 
    topics: ["TV programs", "entertainment", "media", "technology"], 
    vocab: ["TV programs", "entertainment", "technology", "media", "viewing habits"]
  },
  8: { 
    name: "SPORTS AND GAMES", 
    topics: ["sports activities", "games", "health", "competition"], 
    vocab: ["sports", "games", "health", "activities", "competition", "equipment"]
  },
  9: { 
    name: "CITIES OF THE WORLD", 
    topics: ["famous cities", "culture", "travel", "urban life"], 
    vocab: ["cities", "culture", "travel", "urban life", "landmarks"]
  },
  10: { 
    name: "OUR HOUSES IN THE FUTURE", 
    topics: ["future technology", "smart homes", "predictions", "modern life"], 
    vocab: ["future", "technology", "predictions", "smart homes", "modern appliances"]
  },
  11: { 
    name: "OUR GREENER WORLD", 
    topics: ["environment", "pollution", "recycling", "green living"], 
    vocab: ["environment", "pollution", "recycling", "green living", "conservation"]
  },
  12: { 
    name: "ROBOTS", 
    topics: ["robots", "automation", "artificial intelligence", "future technology"], 
    vocab: ["robots", "automation", "technology", "artificial intelligence", "future work"]
  }
};

/**
 * Lấy topics cho phạm vi Units
 */
function getTopicsForUnits(units) {
  return units.map(unit => UNIT_CONTENT[unit]?.topics || []).flat();
}

/**
 * Lấy vocabulary cho phạm vi Units  
 */
function getVocabularyForUnits(units) {
  return units.map(unit => UNIT_CONTENT[unit]?.vocab || []).flat();
}

/**
 * Tạo ví dụ scenarios cho Units
 */
function getExampleScenariosForUnits(units) {
  const unitNames = units.map(unit => UNIT_CONTENT[unit]?.name).join(', ');
  const topics = getTopicsForUnits(units);
  
  if (units.length <= 3) {
    // Giữa kỳ - ít Units
    return `
Example conversation scenarios for ${unitNames}:
- Asking for directions to classrooms, discussing favorite subjects
- Describing house rooms, talking about family members  
- Talking about best friends, describing personality and appearance
- Discussing study activities, helping with homework
- Sharing about new school experiences, first impressions
    `;
  } else {
    // Cuối kỳ - nhiều Units
    return `
Example conversation scenarios for ${unitNames}:
- Integrating multiple topics from ${topics.slice(0,5).join(', ')}
- Real-life scenarios combining learned vocabulary
- Conversations about student life, family, friends
- Discussing hobbies, activities, environment
- Sharing experiences, plans, future goals
    `;
  }
}

/**
 * ✅ MỚI: Build dynamic listening section dựa trên thời gian test
 * Tính toán số lượng conversations và passage questions theo duration
 */
function buildDynamicListeningSection(params) {
  const duration = params.duration;
  const totalListening = params.distribution.listening;
  
  console.log(`📊 Building dynamic listening section for ${duration} minutes, ${totalListening} total questions`);
  
  // ✅ Tính toán split giống với test-manager.js để đồng bộ
  let part1Count, part2Count;
  
  if (duration === 15) {
    // 15 phút: Dồn tất cả vào Part 1, không có Part 2
    part1Count = totalListening; // 3 conversations
    part2Count = 0;
  } else if (duration === 30) {
    // 30 phút: 3 conversations + 2 passage questions
    part1Count = 3;
    part2Count = 2;
  } else if (duration === 45) {
    // 45 phút: 4 conversations + 3 passage questions
    part1Count = 4;
    part2Count = 3;
  } else {
    // 60 phút: 5 conversations + 5 passage questions (original)
    part1Count = 5;
    part2Count = 5;
  }
  
  // Tính toán target audio time
  const totalAudioMinutes = duration === 15 ? 1.5 : 
                           duration === 30 ? 2.5 :
                           duration === 45 ? 3.5 : 5;
  
  console.log(`📊 Calculated split: Part 1=${part1Count}, Part 2=${part2Count}, Audio target=${totalAudioMinutes} minutes`);
  
  // Build Part 1 section
  const numberWord = getNumberWord(part1Count);
  const part1Duration = part2Count > 0 ? Math.round(totalAudioMinutes * 0.6 * 10) / 10 : totalAudioMinutes;
  
  let section = `LISTENING (${totalListening} questions) - 🎧 AUDIO TARGET: ${totalAudioMinutes} phút

Part 1. Listen to ${numberWord} detailed conversations twice and choose the correct answer A, B or C for each question (Target: ${part1Duration} phút audio):
⚠️ Each conversation MUST have 3-5 natural exchanges between speakers (25 giây each)
⚠️ Include realistic contexts and detailed responses suitable for grade 6
⚠️ Format: "Speaker A: [detailed question], Speaker B: [informative answer], Speaker A: [follow-up], Speaker B: [conclusion]"

Question 1. [Listening question about Unit content from Units ${params.scopeInfo.units.join(', ')}]
A. [Option A]  /  B. [Option B]  /  C. [Option C]

Question ${part1Count > 1 ? `2-${part1Count}` : '1'}. [Continue with scenarios relevant to tested Units]`;

  // ✅ CONDITIONAL: Chỉ thêm Part 2 khi part2Count > 0
  if (part2Count > 0) {
    console.log(`📝 Adding Part 2 section for ${part2Count} questions`);
    
    // Tính word count theo số questions
    const part2WordCount = part2Count === 1 ? '100-150' :
                          part2Count === 2 ? '150-200' :
                          part2Count === 3 ? '200-300' : '300-400';
    
    const part2Duration = Math.round(totalAudioMinutes * 0.4 * 10) / 10;
    
    section += `

Part 2: You will listen to [extended passage about topics from Units ${params.scopeInfo.units.join(', ')}] and choose the correct answer (Target: ${part2Duration} phút audio):
⚠️ Create detailed monologue or extended dialogue (${part2WordCount} words)
⚠️ Include rich context, specific details, natural flow suitable for grade 6
⚠️ Topics MUST relate to content from Units ${params.scopeInfo.units.join(', ')}

Question ${part1Count + 1}-${part1Count + part2Count}. [Extended listening questions]`;
  } else {
    console.log(`⏭️ Skipping Part 2 section (15-minute test)`);
  }
  
  return section;
}

/**
 * ✅ MỚI: Convert number to word for natural English prompts
 */
function getNumberWord(num) {
  const words = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
  return words[num] || num.toString();
}

/**
 * ✅ UPDATED: Tạo prompt kiểm tra DYNAMIC với listening section linh động
 * Main function được gọi từ test-manager.js
 */
export function getTestPrompt(params) {
  console.log(`🎯 Generating test prompt for ${params.duration} minutes, difficulty: ${params.difficulty}`);
  
  // Build units text đơn giản
  const unitsText = params.scopeInfo.units.map(unit => `Unit ${unit}`).join(', ');
  
  // Main prompt - DYNAMIC CONTENT với listening section linh động
  const prompt = `Bạn là chuyên gia tạo đề kiểm tra tiếng Anh THCS.

THÔNG TIN ĐỀ:
- Phạm vi: ${params.scopeInfo.name}
- Units: ${unitsText}  
- Thời gian: ${params.duration} phút
- Tổng câu hỏi: ${params.distribution.total} câu
- Độ khó: ${params.difficulty}

PHÂN BỔ CÂU HỎI:
- LISTENING: ${params.distribution.listening} câu (2.0 điểm)
- LANGUAGE: ${params.distribution.language} câu (2.0 điểm)  
- READING: ${params.distribution.reading} câu (2.0 điểm)
- WRITING: ${params.distribution.writing} câu (4.0 điểm)
TỔNG: ${params.distribution.total} câu = 10.0 điểm

FORMAT YÊU CẦU (ĐỀ PHẢI BẰNG TIẾNG ANH):

📋 1. HEADER (Tiếng Việt):
SỞ GIÁO DỤC VÀ ĐÀO TẠO ....................     ĐỀ KIỂM TRA ${params.scopeInfo.name.toUpperCase()} NĂM HỌC 2025-2026
TRƯỜNG TRUNG TIỂU HỌC PÉTRUS KÝ        MÔN: TIẾNG ANH 6
                                       Thời gian làm bài ${params.duration} phút, không kể thời gian phát đề.

Họ và tên: ............................................................... Số báo danh: ....... Mã đề: ......

📋 2. NỘI DUNG ĐỀ (HOÀN TOÀN BẰNG TIẾNG ANH):

${buildDynamicListeningSection(params)}

LANGUAGE (${params.distribution.language} questions)  
Mark the letter A, B, C, or D on your answer sheet to indicate the correct answer to each of the following questions.
Question ${params.distribution.listening + 1}. [Grammar/Vocabulary question from ${unitsText}]
A. [Option A]  /  B. [Option B]  /  C. [Option C]  /  D. [Option D]

READING (${params.distribution.reading} questions)
Read the following passage and mark the letter A, B, C or D...
[Cloze passage about topics from ${unitsText}]
Question ${params.distribution.listening + params.distribution.language + 1}. A. [option]  /  B. [option]  /  C. [option]  /  D. [option]

Read the passage carefully and choose the correct answers among A, B, C or D.
[Comprehension passage about content from ${unitsText}]
Question ${params.distribution.listening + params.distribution.language + Math.ceil(params.distribution.reading/2) + 1}. [Reading comprehension question]

WRITING (${params.distribution.writing} questions)
Fill in the blank with the correct form of verb in the bracket.
Question ${params.distribution.listening + params.distribution.language + params.distribution.reading + 1}. [Verb form exercise using vocabulary from ${unitsText}]

Reorder the words to make the correct sentence.
Question ${params.distribution.listening + params.distribution.language + params.distribution.reading + 2}. [Word ordering exercise with content from tested Units]

Rewrite the sentence so that it has the same meaning as the first one.
Question ${params.distribution.listening + params.distribution.language + params.distribution.reading + 3}. [Sentence transformation using grammar from ${unitsText}]

Write the questions for the underlined words.
Question ${params.distribution.listening + params.distribution.language + params.distribution.reading + 4}. [Question formation about topics from tested Units]

Complete the sentences with suitable words.
Question ${params.distribution.listening + params.distribution.language + params.distribution.reading + 5}. [Completion exercise using vocabulary from ${unitsText}]

📋 3. TEACHER MATERIALS (Tiếng Việt):

✅ AUDIO SCRIPTS (TTS-Ready Format cho ${params.duration} phút test):

${buildDynamicAudioScriptsSection(params)}

✅ ĐÁP ÁN HOÀN CHỈNH:
1. A  2. B  3. C... [Full answer key for all ${params.distribution.total} questions]

✅ SCORING RUBRICS:
- Listening: ${params.distribution.listening} câu × 0.2 điểm = 2.0 điểm
- Language: ${params.distribution.language} câu × 0.2 điểm = 2.0 điểm
- Reading: ${params.distribution.reading} câu × 0.2 điểm = 2.0 điểm  
- Writing: ${params.distribution.writing} câu × 0.8 điểm = 4.0 điểm
TỔNG ĐIỂM: 10.0

CONTENT REQUIREMENTS:
✅ Tất cả vocabulary/grammar từ ${unitsText}
✅ Topics phù hợp với lớp 6 curriculum
✅ Difficulty level: ${params.difficulty}
✅ Cultural content appropriate for Vietnamese students
✅ Clear instructions cho từng section

CHẤT LƯỢNG YÊU CẦU:
- ĐỀ HOÀN CHỈNH với tất cả ${params.distribution.total} câu hỏi
- AUDIO SCRIPTS chi tiết cho giáo viên bằng tiếng Anh 
- ĐÁP ÁN với explanations bằng tiếng Việt
- TEACHER NOTES bằng tiếng Việt
- LENGTH: Tối thiểu 10,000 ký tự

${getPersonalizationLogic(params.difficulty, params.specialRequirements, params)}`;

  console.log(`✅ Generated test prompt with dynamic listening section for ${params.duration} minutes`);
  return prompt;
}

/**
 * ✅ MỚI: Build dynamic audio scripts section cho teacher materials
 * Tạo instructions cho audio scripts theo phân bổ câu hỏi thực tế
 */
function buildDynamicAudioScriptsSection(params) {
  const duration = params.duration;
  const totalListening = params.distribution.listening;
  
  // Tính toán split giống logic trong buildDynamicListeningSection
  let part1Count, part2Count;
  
  if (duration === 15) {
    part1Count = totalListening;
    part2Count = 0;
  } else if (duration === 30) {
    part1Count = 3;
    part2Count = 2;
  } else if (duration === 45) {
    part1Count = 4;
    part2Count = 3;
  } else {
    part1Count = 5;
    part2Count = 5;
  }
  
  const totalAudioTime = duration === 15 ? 1.5 : 
                        duration === 30 ? 2.5 :
                        duration === 45 ? 3.5 : 5;
  
  const part1Time = part2Count > 0 ? Math.round(totalAudioTime * 0.6 * 10) / 10 : totalAudioTime;
  
  // ✅ FIX: Declare part2WordCount outside if block để tránh scope error
  let part2WordCount = '';
  let part2Time = 0;
  
  let audioSection = `Part 1 - ${part1Count} Conversations Chi Tiết (Mục tiêu: ${part1Time} phút):

⚠️ YÊU CẦU NỘI DUNG cho ${params.scopeInfo.name}:
🎯 PHẢI phản ánh nội dung Units ${params.scopeInfo.units.join(', ')}
🎯 Chủ đề: ${getTopicsForUnits(params.scopeInfo.units).slice(0,6).join(', ')}
🎯 Từ vựng trọng tâm: ${getVocabularyForUnits(params.scopeInfo.units).slice(0,8).join(', ')}
🎯 Mỗi conversation: 25 giây với 3-5 lượt trao đổi tự nhiên
🎯 Scenarios thực tế phù hợp với học sinh lớp 6

${getExampleScenariosForUnits(params.scopeInfo.units)}

⚠️ FORMAT YÊU CẦU (Bằng tiếng Anh):
- Speaker A: [Detailed question/situation]
- Speaker B: [Informative response with specifics]
- Speaker A: [Follow-up question or comment]
- Speaker B: [Additional information or conclusion]

⚠️ CHẤT LƯỢNG YÊU CẦU:
✅ Tạo CHÍNH XÁC ${part1Count} conversations
✅ Mỗi lần tạo PHẢI khác nhau (không lặp lại)
✅ Từ vựng và ngữ pháp phù hợp Units đang test
✅ Tình huống thực tế, gần gũi với học sinh
✅ Conversations có giá trị giáo dục cao`;

  // ✅ CONDITIONAL: Chỉ thêm Part 2 section khi cần
  if (part2Count > 0) {
    // ✅ FIX: Assign values thay vì declare mới để tránh scope error
    part2Time = Math.round(totalAudioTime * 0.4 * 10) / 10;
    part2WordCount = part2Count === 1 ? '100-150' :
                     part2Count === 2 ? '150-200' :
                     part2Count === 3 ? '200-300' : '300-400';
    
    audioSection += `

---

Part 2 - Đoạn Nghe Mở Rộng cho ${part2Count} câu hỏi (Mục tiêu: ${part2Time} phút):

⚠️ YÊU CẦU CONTENT cho ${params.scopeInfo.name}:
🎯 Tạo monologue hoặc dialogue chi tiết về chủ đề từ Units ${params.scopeInfo.units.join(', ')}
🎯 Bao gồm từ vựng chính từ tất cả Units đang kiểm tra
🎯 Độ dài: ${part2WordCount} từ với nội dung có giá trị giáo dục
🎯 Phù hợp tâm lý và trình độ học sinh lớp 6

⚠️ FORMAT YÊU CẦU (Bằng tiếng Anh):
Narrator: [Detailed content about topics from tested Units]

⚠️ CHẤT LƯỢNG YÊU CẦU:
✅ Format: Natural flow với punctuation phù hợp TTS
✅ Vocabulary và topics MUST reflect Units đang test
✅ Đa dạng content mỗi lần generation
✅ Educational value cao, inspiring cho học sinh`;
  } else {
    audioSection += `

⚠️ QUAN TRỌNG: ${params.duration} phút test - KHÔNG TẠO Part 2
🎯 Dồn tất cả listening vào ${part1Count} conversations chất lượng cao
🎯 Mỗi conversation phải có độ dài và chất lượng tương đương 60 phút test`;
  }
  
  // Thêm technical requirements
  audioSection += `

📊 Tiêu Chuẩn Audio Chất Lượng cho ${params.duration} phút test:
- Tổng thời lượng: ${totalAudioTime} phút thời gian nói ước tính
- Part 1: ${part1Time} phút (${part1Count} conversations × 25 giây mỗi cái)`;

  if (part2Count > 0) {
    const part2Time = Math.round(totalAudioTime * 0.4 * 10) / 10;
    audioSection += `
- Part 2: ${part2Time} phút (${part2WordCount} từ nội dung mở rộng)`;
  }

  audioSection += `
- Format: Tối ưu cho TTS với speaker labels rõ ràng
- Nội dung: Giá trị giáo dục cao, từ vựng phù hợp lớp 6
- Sẵn sàng cho OpenAI TTS generation ngay lập tức`;

  return audioSection;
}

/**
 * Logic cá nhân hóa DYNAMIC
 */
function getPersonalizationLogic(difficulty, specialRequirements, params) {
  let personalization = '\n\n🎯 PERSONALIZATION:\n';
  
  // Difficulty-based adjustments
  switch(difficulty) {
    case 'hard':
      personalization += `- ADVANCED LEVEL: Complex grammar, inference questions, creative writing tasks
- Higher-order thinking questions với detailed analysis
- Challenging vocabulary và cultural references`;
      break;
      
    case 'easy':  
      personalization += `- BASIC LEVEL: Simple grammar, direct questions, guided writing
- Recognition và comprehension focus
- Visual support và clear contextual clues`;
      break;
      
    default: // medium
      personalization += `- STANDARD LEVEL: Mixed difficulty, balanced question types
- Combination của recall, comprehension và basic application
- Appropriate challenge với adequate support`;
  }
  
  // Unit-specific requirements
  const unitTopics = getTopicsForUnits(params.scopeInfo.units);
  const unitVocab = getVocabularyForUnits(params.scopeInfo.units);

  personalization += `\n\n🎯 UNIT-SPECIFIC REQUIREMENTS cho ${params.scopeInfo.name}:`;
  personalization += `\n- Topics chính: ${unitTopics.slice(0,5).join(', ')}`;
  personalization += `\n- Vocabulary focus: ${unitVocab.slice(0,8).join(', ')}`;
  personalization += `\n- Scenarios phù hợp với nội dung Units ${params.scopeInfo.units.join(', ')}`;
  
  // Special requirements
  if (specialRequirements) {
    const instruction = specialRequirements.toLowerCase();
    
    if (instruction.includes('ngữ pháp') || instruction.includes('grammar')) {
      personalization += '\n- GRAMMAR FOCUS: Increase grammar questions, error correction, transformations';
    }
    else if (instruction.includes('từ vựng') || instruction.includes('vocabulary')) {
      personalization += '\n- VOCABULARY FOCUS: Word formation, synonyms, context-based usage';
    }
    else if (instruction.includes('nghe') || instruction.includes('listening')) {
      personalization += '\n- LISTENING FOCUS: Extended audio materials, note-taking exercises';
    }
    else if (instruction.includes('đọc') || instruction.includes('reading')) {
      personalization += '\n- READING FOCUS: Multiple passages, critical reading questions';
    }
    else if (instruction.includes('viết') || instruction.includes('writing')) {
      personalization += '\n- WRITING FOCUS: Creative tasks, editing exercises, genre-specific writing';
    }
    else {
      personalization += `\n- CUSTOM FOCUS: ${specialRequirements}`;
    }
  }

  // ✅ MỚI: Audio-specific personalization theo duration và difficulty
  const duration = params.duration;
  
  personalization += `\n\n🎧 YÊU CẦU AUDIO SCRIPTS CHO ${duration} PHÚT TEST:`;
  
  if (duration === 15) {
    personalization += '\n- CHÍNH XÁC 3 conversations, KHÔNG CÓ Part 2 passage';
    personalization += '\n- Target audio: 1.5 phút total';
    personalization += '\n- Focus: Quality over quantity, mỗi conversation meaningful';
  } else if (duration === 30) {
    personalization += '\n- CHÍNH XÁC 3 conversations + 2 passage questions';  
    personalization += '\n- Target audio: 2.5 phút total';
    personalization += '\n- Balance: Short but complete content';
  } else if (duration === 45) {
    personalization += '\n- CHÍNH XÁC 4 conversations + 3 passage questions';
    personalization += '\n- Target audio: 3.5 phút total';
    personalization += '\n- Standard: Good balance between parts';
  } else {
    personalization += '\n- CHÍNH XÁC 5 conversations + 5 passage questions';
    personalization += '\n- Target audio: 5 phút total';
    personalization += '\n- Full: Complete listening experience';
  }

  if (difficulty === 'hard') {
    personalization += '\n- AUDIO COMPLEXITY: Complex conversations, multiple speakers, advanced vocabulary';
  } else if (difficulty === 'easy') {
    personalization += '\n- AUDIO SIMPLICITY: Clear pronunciation, simple vocabulary, slow natural pace';
  } else {
    personalization += '\n- AUDIO STANDARD: Natural conversations, grade-appropriate vocabulary, normal pace';
  }

  personalization += '\n\n🎧 YÊU CẦU AUDIO SCRIPTS BẮT BUỘC:';
  personalization += '\n- Mỗi conversation Part 1: 25 giây (3-5 exchanges)';
  
  if (params.distribution.listening > 3 && duration > 15) {
    const part2WordCount = duration === 30 ? '150-200' :
                          duration === 45 ? '200-300' : '300-400';
    personalization += `\n- Part 2 passage: ${part2WordCount} từ`;
  }
  
  personalization += '\n- Format: Speaker A:, Speaker B:, Narrator: labels';
  personalization += '\n- Content: 100% phù hợp với curriculum Units đang test';
  personalization += '\n- Quality: Professional, educational, engaging';
  personalization += '\n- Diversity: Mỗi lần generate PHẢI khác nhau để đảm bảo fairness';
  personalization += '\n- Language: Đề bằng tiếng Anh, chỉ teacher materials tiếng Việt';
  
  return personalization;
}

/**
 * Helper function - Unit name lookup
 */
function getUnitName(unitNumber) {
  try {
    const unitsData = window.UNITS_DATA;
    if (unitsData && unitsData[unitNumber]) {
      return unitsData[unitNumber].name;
    }
  } catch (error) {
    console.warn(`⚠️ Warning: Could not get unit name for Unit ${unitNumber}`);
  }
  
  return UNIT_CONTENT[unitNumber]?.name || `Unit ${unitNumber}`;
}