// ✅ REVIEW PROMPTS - ENHANCED với TT SUCCESS PATTERN
// File chuyên cho Review lessons - 100% Tiếng Việt
// COPY SUCCESS PATTERN từ supplementary-controller.js

// ===============================================
// HELPER FUNCTIONS (KEEP UNCHANGED)
// ===============================================

function tinhThoiGianThucHanh(selectedSkills) {
   const soLuongSkills = selectedSkills.length;
   
   if (soLuongSkills === 1) {
       return 35;
   } else if (soLuongSkills === 2) {
       return "18 phút và 17 phút";
   } else if (soLuongSkills === 3) {
       return "12 phút, 12 phút, và 11 phút";
   } else {
       return "chia đều cho từng kỹ năng";
   }
}

function xacDinhLoaiTemplate(selectedSkills) {
   const languageSkills = ['Vocabulary', 'Pronunciation', 'Grammar'];
   const communicativeSkills = ['Reading', 'Writing', 'Listening', 'Speaking'];
   
   const coLanguage = selectedSkills.some(skill => languageSkills.includes(skill));
   const coSkills = selectedSkills.some(skill => communicativeSkills.includes(skill));
   
   if (coLanguage && !coSkills) return 'LANGUAGE_REVIEW';
   if (!coLanguage && coSkills) return 'SKILLS_REVIEW';
   return 'MIXED_REVIEW';
}

// ===============================================
// ✅ NEW: PERSONALIZATION LOGIC - COPY TT PATTERN
// ===============================================

function addPersonalizationLogic(specialRequirements, reviewInfo) {
    let personalizationPrompt = '';
    
    if (specialRequirements) {
        const instruction = specialRequirements.toLowerCase();
        
        if (instruction.includes('giỏi') || instruction.includes('nâng cao') || instruction.includes('khó')) {
            personalizationPrompt = `

🎯 CÁ NHÂN HÓA CHO HỌC SINH GIỎI - REVIEW CHUYÊN SÂU:
- Tạo ít nhất 30 bài tập Review NÂNG CAO với độ khó cực cao
- Mỗi bài tập cần có hướng dẫn step-by-step chi tiết (12-15 câu mỗi bài)
- Thêm 15 câu hỏi trắc nghiệm PHÂN TÍCH SÂU từ các Units
- Bổ sung 15 hoạt động CRITICAL THINKING cho Review
- Tạo listening/speaking ADVANCED activities với complex scripts
- Phần Consolidation phải SYNTHESIS tất cả kiến thức từ ${reviewInfo.units?.length || 3} Units
- Language Analysis: Phân tích chi tiết 20+ từ/cấu trúc NÂNG CAO
- Assessment với RUBRIC đầy đủ cho từng activity`;
            
        } else if (instruction.includes('trung bình') || instruction.includes('cơ bản') || instruction.includes('yếu')) {
            personalizationPrompt = `

🎯 CÁ NHÂN HÓA CHO HỌC SINH TRUNG BÌNH - REVIEW HỖ TRỢ:
- Tạo ít nhất 15 bài tập Review CƠ BẢN với hướng dẫn từng bước CỰC KỲ chi tiết
- Mỗi bài tập có hướng dẫn step-by-step rất rõ ràng (15-18 câu mỗi bài)
- Thêm 15 câu hỏi trắc nghiệm ÔN TẬP CƠ BẢN từ các Units với answer keys
- Bổ sung 15 hoạt động GAMES/ACTIVITIES để tăng hứng thú
- Scaffolding activities với GUIDED PRACTICE đầy đủ
- Visual aids và examples minh họa cho mọi concept
- Confidence-building exercises với positive reinforcement`;
            
        } else {
            personalizationPrompt = `

🎯 CÁ NHÂN HÓA REVIEW CHUẨN:
- Tạo ít nhất 15 bài tập Review đa dạng kết hợp CƠ BẢN và NÂNG CAO
- Mỗi bài tập có hướng dẫn chi tiết 10-12 câu
- 15 câu hỏi trắc nghiệm ôn tập từ các Units với explanations
- 12 hoạt động group work và pair work activities
- Assessment criteria rõ ràng cho từng phần`;
        }
    }
    
    return personalizationPrompt;
}

// ===============================================
// ✅ ENHANCED TEMPLATES với BUILT-IN EXPANSION
// ===============================================

   const LANGUAGE_REVIEW_TEMPLATE = `Bạn là trợ lý giáo viên tiếng Anh chuyên nghiệp, giúp soạn giáo án Review chi tiết cho học sinh THCS lớp {grade}.

   Hãy soạn một giáo án Review tiếng Anh theo cấu trúc tiêu chuẩn cho:

   **{review_name}**
   **Tiết 1: Ôn tập Ngôn ngữ (Language)**
   **Kỹ năng ôn tập:** {selected_skills}
   **Yêu cầu đặc biệt:** {specialRequirements}

   I. Mục tiêu bài học (Objectives):
   Cuối giờ học học sinh có thể:
   - Ôn tập phát âm, từ vựng và các điểm ngữ pháp đã học trong các Unit {reviewUnits}

   1. Kiến thức (Knowledge)
   - Trọng tâm ngôn ngữ: Ôn tập và thực hành các mục từ vựng và điểm ngữ pháp học sinh đã học trong các Unit {reviewUnits}
   - Tập trung vào: {selected_skills}

   2. Năng lực cốt lõi (Core competence)
   - Phát triển kỹ năng giao tiếp và sáng tạo
   - Hợp tác và hỗ trợ trong làm việc theo cặp và nhóm
   - Tham gia tích cực vào các hoạt động lớp học

   3. Phẩm chất cá nhân (Personal qualities)
   - Có trách nhiệm và chăm chỉ trong học tập

   II. Phương tiện dạy học (Materials)
   - Sách giáo khoa, kế hoạch bài giảng
   - Máy tính kết nối Internet, máy chiếu, loa
   - Thẻ từ vựng, bài tập ôn tập trên giấy

   III. Khó khăn dự đoán và Giải pháp (Anticipated difficulties and Solutions)

   1. Học sinh có thể thấy buồn chán do nhiều bài tập ngôn ngữ.
   - Khuyến khích học sinh làm việc theo cặp, theo nhóm để có thể giúp đỡ lẫn nhau.
   - Thiết kế càng nhiều bài tập dưới dạng trò chơi càng tốt.
   - Cung cấp phản hồi và giúp đỡ nếu cần thiết.

   2. Một số học sinh sẽ nói chuyện riêng quá nhiều trong lớp.
   - Định nghĩa rõ ràng các kỳ vọng một cách chi tiết.
   - Cho các học sinh nói chuyện riêng thực hành.
   - Tiếp tục định nghĩa kỳ vọng theo từng phần nhỏ (trước mỗi hoạt động).

   3. Học sinh quên phần lớn kiến thức đã học từ các Unit {reviewUnits}
   - Sử dụng sơ đồ tư duy và động não để kích hoạt trí nhớ
   - Tạo kết nối giữa các Unit
   - Ôn tập từ dễ đến khó theo trình tự

   IV. Kế hoạch bảng (Board Plan)

   Ngày giảng: {teachingDate}
   {review_name}
   Tiết 1: Ôn tập Ngôn ngữ

   *Khởi động: Động não
   1. Phát âm: Khoanh âm khác nhau  
   2. Từ vựng: Điền từ vào chỗ trống, hoàn thành từ
   3. Ngữ pháp: Chọn đáp án đúng, sửa lỗi
   *Bài tập về nhà: Chuẩn bị cho bài học tiếp theo

   V. Tiến trình dạy học (Teaching procedure):

   A. Khởi động (5 phút)
   - Mục tiêu: Nhắc nhở học sinh về kiến thức đã học trong các Unit {reviewUnits}
   - Tiến trình: Động não
      + Giáo viên chia lớp thành 4 nhóm lớn
      + Giáo viên đưa cho mỗi nhóm một bảng chưa hoàn thành tóm tắt ngôn ngữ mà học sinh đã học trong các Unit {reviewUnits} và yêu cầu các em hoàn thành bảng
      + Nhóm nào hoàn thành đúng và nhanh hơn sẽ thắng
      + Danh mục ôn tập: Âm phát âm từ các Unit {reviewUnits}, Từ vựng chính theo chủ đề, Cấu trúc ngữ pháp chính, Cụm từ và cách diễn đạt thường dùng
   - Kết quả mong đợi: Học sinh nhớ lại kiến thức đã học

   B. Thực hành (35 phút) - ÔN TẬP NGÔN NGỮ
   - Mục tiêu: Giúp học sinh ôn tập {selected_skills} từ các Unit {reviewUnits}
   - Tiến trình:
   
   **1. PHÁT ÂM ({pronunciationTime}):**
   Bài tập 1: Khoanh tròn từ có âm gạch dưới khác. Nghe và kiểm tra.
   - Học sinh làm bài tập này riêng lẻ sau đó chia sẻ đáp án với bạn cùng bàn
   - Giáo viên đưa ra phản hồi và xác nhận đáp án
   - Kết quả mong đợi: Học sinh nắm được các mẫu phát âm
   
   **2. TỪ VỰNG ({vocabularyTime}):**
   Bài tập 2: Chọn A, B, hoặc C để điền vào chỗ trống trong đoạn văn.
   - Cho phép học sinh làm bài tập này riêng biệt
   - Yêu cầu học sinh đọc đoạn văn cẩn thận và dừng lại ở mỗi chỗ trống để quyết định từ nào là đáp án tốt nhất
   - Hướng dẫn học sinh tìm kiếm manh mối cho câu trả lời của mình
   - Đổi đáp án với bạn cùng bàn
   - Kiểm tra đáp án của học sinh với cả lớp
   
   Bài tập 3: Hoàn thành câu với từ/cụm từ trong hộp.
   - Yêu cầu học sinh đọc kỹ từng câu và chọn từ/cụm từ đúng
   - Kiểm tra đáp án của học sinh với cả lớp
   - Kết quả mong đợi: Học sinh củng cố từ vựng đã học
   
   **3. NGỮ PHÁP ({grammarTime}):**
   Bài tập 4: Chọn đáp án đúng A, B, hoặc C.
   - Giáo viên cho học sinh làm bài tập này riêng lẻ
   - Giáo viên cho phép học sinh trao đổi đáp án và thảo luận nếu có sự khác biệt trong đáp án của họ sau đó kiểm tra đáp án của học sinh với cả lớp
   
   Bài tập 5: Sửa từ để hỏi được gạch dưới nếu cần.
   - Học sinh bây giờ phải quen thuộc và khá thành thạo trong việc sử dụng từ để hỏi
   - Giáo viên có thể ôn tập bằng cách viết một câu dài trên bảng
   - Yêu cầu học sinh mở sách và làm bài tập riêng lẻ
   - Kiểm tra đáp án của học sinh với cả lớp. Đối với những câu sai, giải thích tại sao chúng không đúng
   - Kết quả mong đợi: Học sinh vận dụng được ngữ pháp
   
   - Tương tác: Cá nhân, Giáo viên-Học sinh, Học sinh-Học sinh
   - Kết quả mong đợi: Học sinh ôn tập được các thành phần ngôn ngữ từ các Unit {reviewUnits}

   C. Củng cố (4 phút)
   - Mục tiêu: Củng cố những gì học sinh đã học trong bài
   - Tiến trình: Giáo viên yêu cầu học sinh nói về những gì đã học trong bài
      + Điểm tóm tắt: Từ vựng chính đã ôn tập, Cấu trúc ngữ pháp đã thực hành, Âm phát âm đã thành thạo, Các lĩnh vực cần tiếp tục thực hành
   - Kết quả mong đợi: Học sinh tự đánh giá được tiến bộ

   D. Bài tập về nhà (1 phút)
   - Chuẩn bị cho bài học tiếp theo
   - Bài tập: Hoàn thành bài tập Review trong sách bài tập, Chuẩn bị danh sách từ vựng từ các Unit {reviewUnits}
   - {customHomework}

   VI. Rút kinh nghiệm (Experience):
   [Để trống cho giáo viên điền sau khi dạy]

   **YÊU CẦU ĐẶC BIỆT - CÁ NHÂN HÓA GIÁO ÁN:**

   ⭐ **TÍNH CÁ NHÂN HÓA AI - KHÁC BIỆT VỚI GIÁO ÁN TRUYỀN THỐNG:**

   1. **Thích ứng với trình độ học sinh:**
   - Phân tích điểm mạnh/yếu của từng lớp cụ thể
   - Điều chỉnh độ khó bài tập phù hợp với năng lực thực tế
   - Đề xuất hoạt động bổ sung cho học sinh giỏi và hỗ trợ cho học sinh yếu

   2. **Cá nhân hóa theo phong cách dạy:**
   - Tích hợp phương pháp giảng dạy ưa thích của giáo viên
   - Đề xuất nhiều phương án hoạt động để giáo viên lựa chọn
   - Linh hoạt thời gian và cách tổ chức hoạt động

   3. **Kết nối thực tế địa phương:**
   - Sử dụng ví dụ, tình huống gần gũi với học sinh
   - Tích hợp văn hóa, phong tục địa phương vào bài học
   - Kết nối với môi trường sống xung quanh học sinh

   4. **Tương tác và phản hồi thông minh:**
   - Dự đoán câu hỏi và phản ứng của học sinh
   - Cung cấp nhiều cách giải thích khác nhau cho cùng một khái niệm
   - Gợi ý cách xử lý tình huống bất ngờ trong lớp học

   **LƯU Ý ĐẶC BIỆT:**
   - Giáo án tập trung vào ÔN TẬP NGÔN NGỮ với nhiều bài tập từ vựng, phát âm, và ngữ pháp
   - Thiết kế theo format chuẩn Việt Nam với khung thời gian 45 phút
   - Các hoạt động phải thú vị và tương tác để tránh nhàm chán
   - Chuẩn bị cho bài kiểm tra 60 phút sắp tới

   **YÊU CẦU CỤ THỂ - COPY TT SUCCESS PATTERN:**

   ⚠️⚠️⚠️ REVIEW PHẢI ĐẠT TỐI THIỂU 15,000 KÝ TỰ ⚠️⚠️⚠️

   GIÁO ÁN REVIEW PHẢI BAO GỒM TOÀN BỘ:

   VII. BÀI TẬP REVIEW CHI TIẾT (MANDATORY SECTION):

   **Bài tập 1: Vocabulary Synthesis từ Units {reviewUnits}**
   - Mục tiêu: Tổng hợp từ vựng từ {reviewUnitsLength} Units
   - Cách thực hiện: Tạo Word Association Web với 50+ từ vựng chính
   - Hướng dẫn từng bước:
     + Bước 1: Chia lớp thành {reviewUnitsLength} nhóm tương ứng với số Units
     + Bước 2: Mỗi nhóm nhận 20 thẻ từ vựng từ Unit được phân công
     + Bước 3: Nhóm tạo mind map kết nối từ vựng giữa các Units
     + Bước 4: Present và explain connections cho cả lớp
     + Bước 5: Voting cho mind map hay nhất
   - Assessment: Grammar accuracy (25%), Vocabulary usage (25%), Creativity (25%), Presentation (25%)
   - Time: 15 phút
   - Expected outcome: Students synthesize vocabulary across Units

   **Bài tập 2: Grammar Integration Challenge**
   - Mục tiêu: Ôn tập và tích hợp grammar structures từ Units {reviewUnits}
   - Cách thực hiện: Grammar Auction Game với error correction
   - Hướng dẫn từng bước:
     + Bước 1: Teacher chuẩn bị 30 câu - một nửa đúng, một nửa sai
     + Bước 2: Mỗi team nhận 100 "dollars" virtual money
     + Bước 3: Teams bid cho câu họ tin là correct
     + Bước 4: Explain tại sao câu đúng/sai với grammar rules từ Units
     + Bước 5: Team with most correct sentences wins
   - Grammar focus: Tenses từ Unit X, Question forms từ Unit Y, Modals từ Unit Z
   - Time: 18 phút
   - Expected outcome: Students apply integrated grammar knowledge

   **Bài tập 3: Skills Integration Task**
   [Continue với pattern này cho 15+ bài tập total]

   {PERSONALIZATION_PLACEHOLDER}

   ⚡ CRITICAL: Mỗi bài tập phải có:
   - Detailed step-by-step instructions (10-15 câu)
   - Clear assessment criteria 
   - Expected learning outcomes
   - Time allocation
   - Materials needed
   - Teacher scripts cho key moments

   TIẾP TỤC với pattern này until 15,000+ characters!`;

   const SKILLS_REVIEW_TEMPLATE = `Bạn là trợ lý giáo viên tiếng Anh chuyên nghiệp, giúp soạn giáo án Review chi tiết cho học sinh THCS lớp {grade}.

   Hãy soạn một giáo án Review tiếng Anh theo cấu trúc tiêu chuẩn cho:

   **{review_name}**  
   **Tiết 2: Ôn tập Kỹ năng (Skills)**
   **Kỹ năng ôn tập:** {selected_skills}
   **Yêu cầu đặc biệt:** {specialRequirements}

   I. Mục tiêu bài học (Objectives):
   Cuối giờ học học sinh có thể:
   - Ôn tập và thực hành các kỹ năng đã học trong các Unit {reviewUnits}

   1. Kiến thức (Knowledge)
   - Trọng tâm ngôn ngữ: Ôn tập và thực hành các mục từ vựng và điểm ngữ pháp học sinh đã học và các kỹ năng đã thực hành trong các Unit {reviewUnits}
   - Trọng tâm kỹ năng: {selected_skills}

   2. Năng lực cốt lõi (Core competence)
   - Phát triển kỹ năng giao tiếp và sáng tạo
   - Hợp tác và hỗ trợ trong làm việc theo cặp và nhóm
   - Tham gia tích cực vào các hoạt động lớp học

   3. Phẩm chất cá nhân (Personal qualities)
   - Có trách nhiệm và chăm chỉ trong học tập

   II. Phương tiện dạy học (Materials)
   - Sách giáo khoa, kế hoạch bài giảng
   - Máy tính kết nối Internet, máy chiếu, loa
   - File âm thanh cho bài tập nghe
   - Tài liệu bài đọc trên giấy
   - Mẫu viết và gợi ý hướng dẫn

   III. Khó khăn dự đoán và Giải pháp (Anticipated difficulties and Solutions)

   1. Học sinh có thể thấy buồn chán do nhiều bài tập kỹ năng.
   - Khuyến khích học sinh làm việc theo cặp, theo nhóm để có thể giúp đỡ lẫn nhau.
   - Thiết kế càng nhiều bài tập dưới dạng trò chơi càng tốt.
   - Cung cấp phản hồi và giúp đỡ nếu cần thiết.

   2. Một số học sinh sẽ nói chuyện riêng quá nhiều trong lớp.
   - Định nghĩa rõ ràng các kỳ vọng một cách chi tiết.
   - Cho các học sinh nói chuyện riêng thực hành.
   - Tiếp tục định nghĩa kỳ vọng theo từng phần nhỏ (trước mỗi hoạt động).

   3. Học sinh gặp khó khăn với các bài tập kỹ năng tích hợp
   - Xây dựng các hoạt động từ có kiểm soát đến thực hành tự do
   - Cung cấp mẫu và ví dụ rõ ràng
   - Theo dõi và hỗ trợ trong suốt các hoạt động

   IV. Kế hoạch bảng (Board Plan)

   Ngày giảng: {teachingDate}
   {review_name}
   Tiết 2: Ôn tập Kỹ năng

   *Khởi động: Trò chuyện về các chủ đề Units
   Thực hành:
   1. Đọc hiểu: Bài đọc về các chủ đề Units
   2. Nói: Phỏng vấn bạn cùng lớp về sở thích  
   3. Nghe: Nghe và điền thông tin còn thiếu
   4. Viết: Viết đoạn văn về trải nghiệm
   *Bài tập về nhà: Hoàn thành bài tập kỹ năng

   V. Tiến trình dạy học (Teaching procedure):

   A. Khởi động (3 phút)
   - Mục tiêu: Tăng hứng thú của học sinh và dẫn dắt vào bài học
   - Tiến trình: Trò chuyện
      + Giáo viên hỏi học sinh một số câu hỏi để dẫn dắt vào bài học về các chủ đề từ các Unit {reviewUnits}
      + Câu hỏi mẫu: Các em còn nhớ gì về chủ đề 1? Các em có thể kể cho cô về chủ đề 2? Hoạt động nào từ chủ đề 3 mà các em thích nhất?
      + Giáo viên dẫn dắt vào việc thực hành các kỹ năng của bài học
   - Kết quả mong đợi: Học sinh có hứng thú với bài học

   B. Thực hành (38 phút) - ÔN TẬP KỸ NĂNG
   - Mục tiêu: Giúp học sinh thực hành {selected_skills} đã học trong các Unit {reviewUnits}
   - Tiến trình:

   **1. ĐỌC HIỂU ({readingTime}):**
   Bài tập 1: Đọc hai đoạn mô tả về các chủ đề từ các Unit và chọn tiêu đề cho chúng.
   - Yêu cầu học sinh nhìn vào hình ảnh và hỏi liệu các em có biết gì về các chủ đề này không
   - Cho học sinh đọc các đoạn văn riêng lẻ và làm bài ghép nối
   - Yêu cầu các em gạch dưới 2-3 từ khóa để có câu trả lời nhanh
   - Kiểm tra đáp án của học sinh với cả lớp
   
   Bài tập 2: Sử dụng thông tin từ các đoạn văn trên để đánh dấu vào ô đúng.
   - Yêu cầu học sinh đọc câu hỏi và các đoạn văn một lần nữa cẩn thận để tìm chi tiết cho câu trả lời
   - Yêu cầu học sinh đổi đáp án với bạn cùng bàn và chỉ ra chỗ tìm thấy thông tin
   - Kiểm tra đáp án của học sinh với cả lớp
   - Kết quả mong đợi: Học sinh thực hành các chiến lược đọc hiểu

   **2. NÓI ({speakingTime}):**
   Bài tập 3: Phỏng vấn bạn cùng lớp về sở thích liên quan đến các chủ đề Units.
   - Yêu cầu học sinh lần lượt hỏi các câu hỏi và ghi chú câu trả lời của bạn cùng bàn
   - Khuyến khích các em thêm câu hỏi với Tại sao, Ở đâu, Với ai, v.v.
   - Đi quanh lớp và trợ giúp nếu cần
   - Gọi một số nhóm báo cáo kết quả cho cả lớp
   - Kết quả mong đợi: Học sinh thực hành kỹ năng nói

   **3. NGHE ({listeningTime}):**
   Bài tập 4: Nghe bài nói về các chủ đề Units và điền thông tin còn thiếu.
   - Yêu cầu học sinh nhìn vào hình ảnh và đọc các cụm từ bên dưới
   - Đảm bảo các em phát âm đúng các cụm từ (điều này giúp việc nghe dễ dàng hơn)
   - Bây giờ yêu cầu học sinh đọc câu hỏi và xác định thông tin cần thiết cho câu trả lời
   - Phát băng nhiều lần nếu cần. Cho học sinh thời gian để viết câu trả lời
   - Kiểm tra đáp án của học sinh với cả lớp
   - Kết quả mong đợi: Học sinh cải thiện khả năng nghe hiểu

   **4. VIẾT ({writingTime}):**
   Bài tập 5: Viết đoạn văn về trải nghiệm liên quan đến các chủ đề Units.
   - Yêu cầu học sinh đọc thông tin trong bảng cẩn thận
   - Hỏi các em nên sử dụng thì gì cho bài viết
   - Cho học sinh viết. Đi quanh lớp và trợ giúp nếu cần
   - Học sinh có thể muốn thay đổi một số chi tiết từ bảng hoặc thứ tự xuất hiện thông tin
   - Khuyến khích các em làm như vậy
   - Gọi một hoặc hai tình nguyện viên đọc to câu trả lời của mình
   - Kết quả mong đợi: Học sinh phát triển kỹ năng viết

   - Tương tác: Cá nhân, Giáo viên-Học sinh, Làm việc nhóm, Học sinh-Học sinh
   - Kết quả mong đợi: Học sinh tích hợp các kỹ năng một cách hiệu quả

   C. Củng cố (3 phút)
   - Mục tiêu: Củng cố những gì học sinh đã thực hành trong bài
   - Tiến trình: Giáo viên yêu cầu học sinh nói về những gì đã thực hành trong bài
      + Tóm tắt kỹ năng: Đọc hiểu - Các chiến lược chính đã sử dụng, Viết - Các thể loại văn bản đã thực hành, Nghe - Thông tin đã thu thập, Nói - Các chủ đề đã thảo luận
   - Kết quả mong đợi: Học sinh phản ánh về việc học

   D. Bài tập về nhà (1 phút)
   - Chuẩn bị cho bài học tiếp theo
   - Bài tập: Hoàn thành bài tập kỹ năng trong sách bài tập, Chuẩn bị cho bài kiểm tra sắp tới (60 phút)
   - {customHomework}

   VI. Rút kinh nghiệm (Experience):
   [Để trống cho giáo viên điền sau khi dạy]

   **YÊU CẦU CỤ THỂ - COPY TT SUCCESS PATTERN:**

   ⚠️⚠️⚠️ REVIEW PHẢI ĐẠT TỐI THIỂU 15,000 KÝ TỰ ⚠️⚠️⚠️

   GIÁO ÁN REVIEW PHẢI BAO GỒM TOÀN BỘ:

   VII. BÀI TẬP REVIEW CHI TIẾT (MANDATORY SECTION):

   **Bài tập 1: Reading Synthesis từ Units {reviewUnits}**
   - Mục tiêu: Tổng hợp reading skills từ {reviewUnitsLength} Units
   - Cách thực hiện: Multi-text analysis activity
   - Hướng dẫn từng bước:
     + Bước 1: Provide reading passages từ mỗi Unit {reviewUnits}
     + Bước 2: Students identify common themes across texts
     + Bước 3: Create comparative chart of main ideas
     + Bước 4: Group discussion về connections between Units
     + Bước 5: Present synthesis findings to class
   - Assessment: Comprehension (30%), Analysis (30%), Presentation (40%)
   - Time: 20 phút
   - Expected outcome: Students integrate reading strategies across Units

   **Bài tập 2: Speaking Integration Challenge**
   - Mục tiêu: Ôn tập speaking skills từ Units {reviewUnits}
   - Cách thực hiện: Topic carousel discussion
   - Hướng dẫn từng bước:
     + Bước 1: Set up stations cho mỗi Unit topic
     + Bước 2: Groups rotate and discuss each topic for 3 minutes
     + Bước 3: Must connect current topic với previous ones
     + Bước 4: Final group presents connections found
     + Bước 5: Class votes cho most creative connections
   - Speaking focus: Fluency, accuracy, topic integration
   - Time: 18 phút
   - Expected outcome: Students demonstrate integrated speaking abilities

   {PERSONALIZATION_PLACEHOLDER}

   ⚡ CRITICAL: Mỗi bài tập skills phải có:
   - Detailed step-by-step instructions (12-15 câu)
   - Skills integration focus
   - Clear assessment criteria 
   - Time allocation và materials
   - Real-world application context

   TIẾP TỤC với pattern này until 15,000+ characters!`;

   const MIXED_REVIEW_TEMPLATE = `Bạn là trợ lý giáo viên tiếng Anh chuyên nghiệp, giúp soạn giáo án Review chi tiết cho học sinh THCS lớp {grade}.

   Hãy soạn một giáo án Review tiếng Anh theo cấu trúc tiêu chuẩn cho:

   **{review_name}**
   **Tiết: Ôn tập Ngôn ngữ & Kỹ năng**  
   **Kỹ năng ôn tập:** {selected_skills}
   **Yêu cầu đặc biệt:** {specialRequirements}

   I. Mục tiêu bài học (Objectives):
   Cuối giờ học học sinh có thể:
   - Ôn tập và tích hợp cả ngôn ngữ và kỹ năng từ các Unit {reviewUnits}

   1. Kiến thức (Knowledge)
   - Trọng tâm ngôn ngữ: Từ vựng, phát âm, ngữ pháp từ các Unit {reviewUnits}
   - Trọng tâm kỹ năng: {selected_skills}
   - Tích hợp: Kết hợp ngôn ngữ và kỹ năng trong các ngữ cảnh có ý nghĩa

   2. Năng lực cốt lõi (Core competence)
   - Phát triển kỹ năng giao tiếp tích hợp
   - Hợp tác và hỗ trợ trong làm việc theo cặp và nhóm
   - Áp dụng kiến thức ngôn ngữ trong các hoạt động dựa trên kỹ năng

   3. Phẩm chất cá nhân (Personal qualities)
   - Tự tin trong việc sử dụng tiếng Anh
   - Phát triển kỹ năng tự đánh giá

   II. Phương tiện dạy học (Materials)
   - Sách giáo khoa, kế hoạch bài giảng
   - Máy tính kết nối Internet, máy chiếu, loa
   - Tài liệu hỗn hợp: thẻ từ vựng, file âm thanh, bài đọc, gợi ý viết
   - Đồng hồ bấm giờ và thang đánh giá

   III. Khó khăn dự đoán và Giải pháp (Anticipated difficulties and Solutions)

   1. Học sinh gặp khó khăn với việc tích hợp ngôn ngữ và kỹ năng.
   - Xây dựng các hoạt động từ trọng tâm ngôn ngữ đến áp dụng kỹ năng
   - Cung cấp kết nối rõ ràng giữa ngôn ngữ và kỹ năng
   - Sử dụng các chủ đề quen thuộc từ các Unit đã học

   2. Quản lý thời gian với nhiều kỹ năng trong 45 phút.
   - Phân bổ thời gian rõ ràng cho từng phần
   - Sử dụng đồng hồ bấm giờ và nhắc nhở học sinh
   - Có các hoạt động dự phòng nếu cần điều chỉnh

   3. Các trình độ khác nhau trong các hoạt động hỗn hợp.
   - Ghép học sinh giỏi với học sinh yếu hơn
   - Cung cấp các nhiệm vụ khác biệt
   - Đưa ra hỗ trợ bổ sung cho học sinh gặp khó khăn

   IV. Kế hoạch bảng (Board Plan)

   Ngày giảng: {teachingDate}
   {review_name}
   Tiết: Ôn tập Ngôn ngữ & Kỹ năng

   *Khởi động: Ôn tập các Unit {reviewUnits}
   Thực hành hỗn hợp:
   {practiceBreakdown}
   *Bài tập về nhà: Thực hành tích hợp

   V. Tiến trình dạy học (Teaching procedure):

   A. Khởi động (4 phút)
   - Mục tiêu: Kích hoạt kiến thức trước đó từ các Unit {reviewUnits} và giới thiệu phương pháp hỗn hợp
   - Tiến trình: Ôn tập các Unit
      + Sơ đồ tư duy nhanh các điểm chính từ các Unit {reviewUnits}
      + Học sinh làm việc theo cặp để động não: Chủ đề từ vựng, Cấu trúc ngữ pháp, Chủ đề và ngữ cảnh
      + Dẫn dắt: "Hôm nay chúng ta sẽ kết hợp ngôn ngữ và kỹ năng với nhau"
   - Kết quả mong đợi: Học sinh kích hoạt kiến thức nền tảng

   B. Thực hành hỗn hợp (36 phút)
   - Mục tiêu: Giúp học sinh thực hành {selected_skills} theo cách tích hợp
   - Tiến trình:
   
   {practiceContent}
   
   - Tương tác: Cá nhân, Giáo viên-Học sinh, Làm việc nhóm, Học sinh-Học sinh
   - Kết quả mong đợi: Học sinh tích hợp ngôn ngữ và kỹ năng một cách hiệu quả

   C. Củng cố (4 phút)
   - Mục tiêu: Củng cố việc học tích hợp và chuẩn bị cho đánh giá
   - Tiến trình: Tóm tắt tích hợp
      + Học sinh phản ánh về cách ngôn ngữ giúp ích cho kỹ năng
      + Đánh giá nhanh: Điều gì dễ/khó?
      + Xem trước định dạng bài kiểm tra sắp tới (60 phút)
      + Khuyến khích tiếp tục thực hành
   - Kết quả mong đợi: Học sinh tự đánh giá tiến bộ

   D. Bài tập về nhà (1 phút)
   - Củng cố thực hành tích hợp
   - Bài tập: Hoàn thành bài tập hỗn hợp trong sách bài tập, Thực hành kết hợp ngôn ngữ với các kỹ năng đã chọn
   - {customHomework}
   - Chuẩn bị cho bài kiểm tra toàn diện

   VI. Rút kinh nghiệm (Experience):
   [Để trống cho giáo viên điền sau khi dạy]

   **YÊU CẦU CỤ THỂ - COPY TT SUCCESS PATTERN:**

   ⚠️⚠️⚠️ REVIEW PHẢI ĐẠT TỐI THIỂU 15,000 KÝ TỰ ⚠️⚠️⚠️

   GIÁO ÁN REVIEW PHẢI BAO GỒM TOÀN BỘ:

   VII. BÀI TẬP REVIEW CHI TIẾT (MANDATORY SECTION):

   **Bài tập 1: Integrated Language-Skills Challenge từ Units {reviewUnits}**
   - Mục tiêu: Tích hợp language và skills từ {reviewUnitsLength} Units
   - Cách thực hiện: Multi-modal learning stations
   - Hướng dẫn từng bước:
     + Bước 1: Set up {reviewUnitsLength} stations combining vocabulary + skills
     + Bước 2: Each station focuses on one Unit with integrated tasks
     + Bước 3: Students rotate every 8 minutes through all stations
     + Bước 4: Final reflection connects learning across all Units
     + Bước 5: Group presentation of integrated knowledge
   - Assessment: Language accuracy (40%), Skills demonstration (40%), Integration (20%)
   - Time: 25 phút
   - Expected outcome: Students demonstrate language-skills integration

   {PERSONALIZATION_PLACEHOLDER}

   ⚡ CRITICAL: Mỗi integrated activity phải có:
   - Language focus explicitly connected to skills practice
   - Cross-Unit connections clearly demonstrated
   - Step-by-step instructions (10-15 câu)
   - Assessment rubric cho both language và skills
   - Real-world application context

   TIẾP TỤC với pattern này until 15,000+ characters!`;

   // ===============================================
   // ENGLISH TEMPLATES - KEEP UNCHANGED
   // ===============================================

   const LANGUAGE_REVIEW_TEMPLATE_EN = `You are a professional English teaching assistant, helping create detailed Review lesson plans for secondary school students in grade {grade}.

   Please create an English Review lesson plan following standard structure for:

   **{review_name}**
   **Period 1: Language Review**
   **Review Skills:** {selected_skills}
   **Special Requirements:** {specialRequirements}

   I. Objectives:
   By the end of the lesson, students will be able to:
   - Review pronunciation, vocabulary and grammar points learned in Units {reviewUnits}

   1. Knowledge
   - Language focus: Review and practice vocabulary items and grammar points students have learned in Units {reviewUnits}
   - Focus on: {selected_skills}

   2. Core competence
   - Develop communication and creativity skills
   - Cooperate and support in pair and group work
   - Participate actively in class activities

   3. Personal qualities
   - Be responsible and hard-working in studying

   II. Materials
   - Textbooks, lesson plans
   - Computer connected to Internet, projector, speakers
   - Vocabulary cards, review exercises on paper

   III. Anticipated difficulties and Solutions

   1. Students may feel bored with many language exercises.
   - Encourage students to work in pairs and groups to help each other.
   - Design as many exercises in game format as possible.
   - Provide feedback and help if necessary.

   2. Some students will talk privately too much in class.
   - Define expectations clearly and in detail.
   - Have private talking students practice.
   - Continue to define expectations in small parts (before each activity).

   3. Students forget most knowledge learned from Units {reviewUnits}
   - Use mind maps and brainstorming to activate memory
   - Create connections between Units
   - Review from easy to difficult in sequence

   IV. Board Plan

   Teaching date: {teachingDate}
   {review_name}
   Period 1: Language Review

   *Warm-up: Brainstorming
   1. Pronunciation: Circle different sounds
   2. Vocabulary: Fill in blanks, complete words
   3. Grammar: Choose correct answers, correct mistakes
   *Homework: Prepare for next lesson

   V. Teaching procedure:

   A. Warm-up (5 minutes)
   - Aim: Remind students of knowledge learned in Units {reviewUnits}
   - Procedure: Brainstorming
      + Teacher divides class into 4 big groups
      + Teacher gives each group an incomplete summary table of language learned in Units {reviewUnits} and asks them to complete the table
      + The group that completes correctly and faster will win
      + Review categories: Pronunciation sounds from Units {reviewUnits}, Main vocabulary by topics, Main grammar structures, Common phrases and expressions
   - Expected outcome: Students recall learned knowledge

   B. Practice (35 minutes) - LANGUAGE REVIEW
   - Aim: Help students review {selected_skills} from Units {reviewUnits}
   - Procedure:
   
   **1. PRONUNCIATION ({pronunciationTime}):**
   Exercise 1: Circle the word with different underlined sound. Listen and check.
   - Students do this exercise individually then share answers with partners
   - Teacher gives feedback and confirms answers
   - Expected outcome: Students master pronunciation patterns
   
   **2. VOCABULARY ({vocabularyTime}):**
   Exercise 2: Choose A, B, or C to fill in the blanks in the passage.
   - Allow students to do this exercise individually
   - Ask students to read the passage carefully and pause at each blank to decide which word is the best answer
   - Guide students to look for clues for their answers
   - Exchange answers with partners
   - Check students' answers with whole class
   
   Exercise 3: Complete sentences with words/phrases in the box.
   - Ask students to read each sentence carefully and choose correct words/phrases
   - Check students' answers with whole class
   - Expected outcome: Students consolidate learned vocabulary
   
   **3. GRAMMAR ({grammarTime}):**
   Exercise 4: Choose correct answer A, B, or C.
   - Teacher lets students do this exercise individually
   - Teacher allows students to exchange answers and discuss if there are differences in their answers then check students' answers with whole class
   
   Exercise 5: Correct the underlined question word if necessary.
   - Students should now be familiar and quite proficient in using question words
   - Teacher can review by writing a long sentence on the board
   - Ask students to open books and do the exercise individually
   - Check students' answers with whole class. For wrong sentences, explain why they are incorrect
   - Expected outcome: Students apply grammar correctly
   
   - Interaction: Individual, Teacher-Students, Student-Student
   - Expected outcome: Students review language components from Units {reviewUnits}

   C. Consolidation (4 minutes)
   - Aim: Consolidate what students learned in the lesson
   - Procedure: Teacher asks students to talk about what they learned in the lesson
      + Summary points: Main vocabulary reviewed, Grammar structures practiced, Pronunciation mastered, Areas needing continued practice
   - Expected outcome: Students self-assess progress

   D. Homework (1 minute)
   - Prepare for next lesson
   - Exercises: Complete Review exercises in workbook, Prepare vocabulary list from Units {reviewUnits}
   - {customHomework}

   VI. Experience:
   [Left blank for teacher to fill after teaching]

   ⚠️⚠️⚠️ MANDATORY LENGTH REQUIREMENT ⚠️⚠️⚠️

   REVIEW LESSON PLAN MUST BE AT LEAST 15,000 CHARACTERS!

   EXPAND ALL SECTIONS:
   1. Add at least 15 detailed Review exercises for chosen skills
   2. Each exercise needs step-by-step detailed instructions (10-15 sentences each)
   3. Add 20 multiple choice questions to review knowledge from Units
   4. Add 10 games/activities to Review vocabulary and grammar
   5. Create additional listening/speaking practice activities with full scripts
   6. Consolidation section needs detailed summary of all knowledge from Units
   7. Language Analysis: Detailed analysis of at least 15 words/structures from Units
   8. Anticipated Difficulties: List at least 8 difficulties and detailed solutions

   {PERSONALIZATION_PLACEHOLDER}

   CONTINUE WRITING UNTIL REACHING 15,000 CHARACTERS!`;

   const SKILLS_REVIEW_TEMPLATE_EN = `You are a professional English teaching assistant, helping create detailed Review lesson plans for secondary school students in grade {grade}.

   Please create an English Review lesson plan following standard structure for:

   **{review_name}**
   **Period 2: Skills Review**
   **Review Skills:** {selected_skills}
   **Special Requirements:** {specialRequirements}

   I. Objectives:
   By the end of the lesson, students will be able to:
   - Review and practice skills learned in Units {reviewUnits}

   1. Knowledge
   - Language focus: Review and practice vocabulary items and grammar points students have learned and skills practiced in Units {reviewUnits}
   - Skills focus: {selected_skills}

   2. Core competence
   - Develop communication and creativity skills
   - Cooperate and support in pair and group work  
   - Participate actively in class activities

   3. Personal qualities
   - Be responsible and hard-working in studying

   II. Materials
   - Textbooks, lesson plans
   - Computer connected to Internet, projector, speakers
   - Audio files for listening exercises
   - Reading materials on paper
   - Writing samples and guidance prompts

   III. Anticipated difficulties and Solutions

   1. Students may feel bored with many skill exercises.
   - Encourage students to work in pairs and groups to help each other.
   - Design as many exercises in game format as possible.
   - Provide feedback and help if necessary.

   2. Some students will talk privately too much in class.
   - Define expectations clearly and in detail.
   - Have private talking students practice.
   - Continue to define expectations in small parts (before each activity).

   3. Students have difficulty with integrated skill exercises
   - Build activities from controlled to free practice
   - Provide clear models and examples
   - Monitor and support throughout activities

   IV. Board Plan

   Teaching date: {teachingDate}
   {review_name}
   Period 2: Skills Review

   *Warm-up: Chat about Unit topics
   Practice:
   1. Reading: Reading about Unit topics
   2. Speaking: Interview classmates about preferences
   3. Listening: Listen and fill missing information
   4. Writing: Write paragraph about experience
   *Homework: Complete skill exercises

   V. Teaching procedure:

   A. Warm-up (3 minutes)
   - Aim: Increase students' interest and lead into lesson
   - Procedure: Chat
      + Teacher asks students some questions to lead into lesson about topics from Units {reviewUnits}
      + Sample questions: What do you remember about topic 1? Can you tell me about topic 2? Which activity from topic 3 did you like most?
      + Teacher leads into practicing skills of the lesson
   - Expected outcome: Students are interested in the lesson

   B. Practice (38 minutes) - SKILLS REVIEW
   - Aim: Help students practice {selected_skills} learned in Units {reviewUnits}
   - Procedure:

   **1. READING ({readingTime}):**
   Exercise 1: Read two descriptions about topics from Units and choose titles for them.
   - Ask students to look at pictures and ask if they know anything about these topics
   - Have students read passages individually and do matching exercise
   - Ask them to underline 2-3 keywords to get quick answers
   - Check students' answers with whole class
   
   Exercise 2: Use information from passages above to tick correct boxes.
   - Ask students to read questions and passages again carefully to find details for answers
   - Ask students to exchange answers with partners and point out where they found information
   - Check students' answers with whole class
   - Expected outcome: Students practice reading comprehension strategies

   **2. SPEAKING ({speakingTime}):**
   Exercise 3: Interview classmates about preferences related to Unit topics.
   - Ask students to take turns asking questions and note down partners' answers
   - Encourage them to add questions with Why, Where, With whom, etc.
   - Walk around class and help if needed
   - Call some pairs to report results to whole class
   - Expected outcome: Students practice speaking skills

   **3. LISTENING ({listeningTime}):**
   Exercise 4: Listen to talk about Unit topics and fill missing information.
   - Ask students to look at pictures and read phrases below
   - Make sure they pronounce phrases correctly (this makes listening easier)
   - Now ask students to read questions and identify information needed for answers
   - Play recording multiple times if needed. Give students time to write answers
   - Check students' answers with whole class
   - Expected outcome: Students improve listening comprehension

   **4. WRITING ({writingTime}):**
   Exercise 5: Write paragraph about experience related to Unit topics.
   - Ask students to read information in table carefully
   - Ask them what tense they should use for writing
   - Let students write. Walk around class and help if needed
   - Students may want to change some details from table or order of information appearance
   - Encourage them to do so
   - Call one or two volunteers to read their answers aloud
   - Expected outcome: Students develop writing skills

   - Interaction: Individual, Teacher-Students, Group work, Student-Student
   - Expected outcome: Students integrate skills effectively

   C. Consolidation (3 minutes)
   - Aim: Consolidate what students practiced in lesson
   - Procedure: Teacher asks students to talk about what they practiced in lesson
      + Skills summary: Reading comprehension - Main strategies used, Writing - Text types practiced, Listening - Information gathered, Speaking - Topics discussed
   - Expected outcome: Students reflect on learning

   D. Homework (1 minute)
   - Prepare for next lesson
   - Exercises: Complete skill exercises in workbook, Prepare for upcoming test (60 minutes)
   - {customHomework}

   VI. Experience:
   [Left blank for teacher to fill after teaching]

   ⚠️⚠️⚠️ MANDATORY LENGTH REQUIREMENT ⚠️⚠️⚠️

   REVIEW LESSON PLAN MUST BE AT LEAST 15,000 CHARACTERS!

   {PERSONALIZATION_PLACEHOLDER}

   CONTINUE WRITING UNTIL REACHING 15,000 CHARACTERS!`;

   const MIXED_REVIEW_TEMPLATE_EN = `You are a professional English teaching assistant, helping create detailed Review lesson plans for secondary school students in grade {grade}.

   Please create an English Review lesson plan following standard structure for:

   **{review_name}**
   **Period: Language & Skills Review**
   **Review Skills:** {selected_skills}  
   **Special Requirements:** {specialRequirements}

   I. Objectives:
   By the end of the lesson, students will be able to:
   - Review and integrate both language and skills from Units {reviewUnits}

   1. Knowledge
   - Language focus: Vocabulary, pronunciation, grammar from Units {reviewUnits}
   - Skills focus: {selected_skills}
   - Integration: Combine language and skills in meaningful contexts

   2. Core competence
   - Develop integrated communication skills
   - Cooperate and support in pair and group work
   - Apply language knowledge in skill-based activities

   3. Personal qualities
   - Be confident in using English
   - Develop self-assessment skills

   II. Materials
   - Textbooks, lesson plans
   - Computer connected to Internet, projector, speakers
   - Mixed materials: vocabulary cards, audio files, reading texts, writing prompts
   - Timer and assessment rubrics

   III. Anticipated difficulties and Solutions

   1. Students have difficulty integrating language and skills.
   - Build activities from language focus to skill application
   - Provide clear connections between language and skills
   - Use familiar topics from learned Units

   2. Time management with multiple skills in 45 minutes.
   - Allocate time clearly for each section
   - Use timer and remind students
   - Have backup activities if adjustment needed

   3. Different levels in mixed activities.
   - Pair stronger students with weaker ones
   - Provide differentiated tasks
   - Give additional support for struggling students

   IV. Board Plan

   Teaching date: {teachingDate}
   {review_name}
   Period: Language & Skills Review

   *Warm-up: Review Units {reviewUnits}
   Mixed practice:
   {practiceBreakdown}
   *Homework: Integrated practice

   V. Teaching procedure:

   A. Warm-up (4 minutes)
   - Aim: Activate prior knowledge from Units {reviewUnits} and introduce mixed approach
   - Procedure: Review Units
      + Quick mind map of main points from Units {reviewUnits}
      + Students work in pairs to brainstorm: Vocabulary topics, Grammar structures, Topics and contexts
      + Lead-in: "Today we will combine language and skills together"
   - Expected outcome: Students activate background knowledge

   B. Mixed practice (36 minutes)
   - Aim: Help students practice {selected_skills} in integrated way
   - Procedure:
   
   {practiceContent}
   
   - Interaction: Individual, Teacher-Students, Group work, Student-Student
   - Expected outcome: Students integrate language and skills effectively

   C. Consolidation (4 minutes)
   - Aim: Consolidate integrated learning and prepare for assessment
   - Procedure: Integration summary
      + Students reflect on how language helped with skills
      + Quick assessment: What was easy/difficult?
      + Preview upcoming test format (60 minutes)
      + Encourage continued practice
   - Expected outcome: Students self-assess progress

   D. Homework (1 minute)
   - Consolidate integrated practice
   - Exercises: Complete mixed exercises in workbook, Practice combining language with chosen skills
   - {customHomework}
   - Prepare for comprehensive test

   VI. Experience:
   [Left blank for teacher to fill after teaching]

   ⚠️⚠️⚠️ MANDATORY LENGTH REQUIREMENT ⚠️⚠️⚠️

   REVIEW LESSON PLAN MUST BE AT LEAST 15,000 CHARACTERS!

   {PERSONALIZATION_PLACEHOLDER}

   CONTINUE WRITING UNTIL REACHING 15,000 CHARACTERS!`;

// ===============================================
// ✅ ENHANCED MAIN FUNCTION với PERSONALIZATION
// ===============================================

function getReviewPrompt(reviewInfo, selectedSkills, specialRequirements, additionalInstructions, language = 'vi') {
   const templateType = xacDinhLoaiTemplate(selectedSkills);
   let template = '';
   
   // Select template based on type and language
   if (templateType === 'LANGUAGE_REVIEW') {
       template = language === 'en' ? LANGUAGE_REVIEW_TEMPLATE_EN : LANGUAGE_REVIEW_TEMPLATE;
   } else if (templateType === 'SKILLS_REVIEW') {
       template = language === 'en' ? SKILLS_REVIEW_TEMPLATE_EN : SKILLS_REVIEW_TEMPLATE;
   } else {
       template = language === 'en' ? MIXED_REVIEW_TEMPLATE_EN : MIXED_REVIEW_TEMPLATE;
   }
   
   // ✅ NEW: Add personalization logic
   const personalizationPrompt = addPersonalizationLogic(specialRequirements, reviewInfo);
   
   // Tính thời gian
   const timeBreakdown = tinhThoiGianThucHanh(selectedSkills);
   
   // Build practice content dựa trên skills
   let practiceContent = '';
   let practiceBreakdown = '';
   
   selectedSkills.forEach((skill, index) => {
       practiceBreakdown += `${index + 1}. ${skill}: Các nhiệm vụ cụ thể\n`;
       
       if (skill === 'Vocabulary') {
           practiceContent += `**ÔN TẬP TỪ VỰNG:**\n- Bài tập ghép đôi\n- Điền vào chỗ trống\n- Phân loại từ\n\n`;
       } else if (skill === 'Grammar') {
           practiceContent += `**ÔN TẬP NGỮ PHÁP:**\n- Chọn đáp án đúng\n- Sửa lỗi\n- Hoàn thành câu\n\n`;
       } else if (skill === 'Reading') {
           practiceContent += `**THỰC HÀNH ĐỌC HIỂU:**\n- Đọc đoạn văn\n- Chọn tiêu đề\n- Trả lời câu hỏi hiểu\n\n`;
       } else if (skill === 'Writing') {
           practiceContent += `**THỰC HÀNH VIẾT:**\n- Viết đoạn văn\n- Hoàn thành bài viết có hướng dẫn\n- Bài tập viết sáng tạo\n\n`;
       } else if (skill === 'Listening') {
           practiceContent += `**THỰC HÀNH NGHE:**\n- Điền thông tin còn thiếu\n- Chọn đáp án đúng\n- Nghe để tìm chi tiết\n\n`;
       } else if (skill === 'Speaking') {
           practiceContent += `**THỰC HÀNH NÓI:**\n- Phỏng vấn bạn cùng lớp\n- Đóng vai đối thoại\n- Thuyết trình chủ đề\n\n`;
       }
   });
   
   // Tính thời gian cho từng skill
   let pronunciationTime = '10 phút';
   let vocabularyTime = '12 phút'; 
   let grammarTime = '13 phút';
   let readingTime = '15 phút';
   let writingTime = '10 phút';
   let listeningTime = '8 phút';
   let speakingTime = '5 phút';
   
   // Custom homework
   let customHomework = 'Ôn tập tất cả tài liệu từ các Unit đã học';
   if (specialRequirements && specialRequirements.includes('tập trung')) {
       customHomework = `Thực hành bổ sung tập trung vào các kỹ năng đã chọn`;
   }
   
   // Replace placeholders
   template = template
       .replace(/{grade}/g, reviewInfo.grade || '6')
       .replace(/{review_name}/g, reviewInfo.name || 'Review')
       .replace(/{reviewUnits}/g, reviewInfo.units ? reviewInfo.units.join(', ') : '1, 2, 3')
       .replace(/{reviewUnitsLength}/g, reviewInfo.units?.length || 3)
       .replace(/{selected_skills}/g, selectedSkills.join(', '))
       .replace(/{specialRequirements}/g, specialRequirements || 'Không có yêu cầu đặc biệt')
       .replace(/{practiceContent}/g, practiceContent)
       .replace(/{practiceBreakdown}/g, practiceBreakdown)
       .replace(/{customHomework}/g, customHomework)
       .replace(/{teachingDate}/g, new Date().toLocaleDateString('vi-VN'))
       .replace(/{pronunciationTime}/g, pronunciationTime)
       .replace(/{vocabularyTime}/g, vocabularyTime)
       .replace(/{grammarTime}/g, grammarTime)
       .replace(/{readingTime}/g, readingTime)
       .replace(/{writingTime}/g, writingTime)
       .replace(/{listeningTime}/g, listeningTime)
       .replace(/{speakingTime}/g, speakingTime);
   
   // ✅ INJECT PERSONALIZATION VÀO TEMPLATE
   if (personalizationPrompt) {
       template = template.replace(
           /{PERSONALIZATION_PLACEHOLDER}/g, 
           personalizationPrompt
       );
   } else {
       // Remove placeholder if no personalization
       template = template.replace(/{PERSONALIZATION_PLACEHOLDER}/g, '');
   }
       
   return template;
}

// ===============================================
// EXPORTS
// ===============================================

export { getReviewPrompt, xacDinhLoaiTemplate, tinhThoiGianThucHanh };