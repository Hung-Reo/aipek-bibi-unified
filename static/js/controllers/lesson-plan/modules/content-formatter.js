// /static/js/controllers/lesson-plan/modules/content-formatter.js
// Refactor from file chính lesson-plan-ui.js (14-May)

export class ContentFormatter {
    constructor(uiMode = 'modern') {
        this.uiMode = uiMode;
    }

    // Di chuyển phương thức formatContent từ dòng 817-847
    formatContent(content, options = {}) {
        if (!content) return '';
    
        // Tránh xử lý lặp lại nếu đã định dạng
        if (content.includes('<div class="lesson-content">')) {
            return content;
        }
    
        let formatted = content
            .trim()

            // Headings theo markdown (dạng liền nhau hoặc có cách)
            .replace(/^###\s*(.*?)$/gm, '<h3 class="section-heading">$1</h3>')
            .replace(/^##\s*(.*?)$/gm, '<h2 class="section-heading">$1</h2>')
            .replace(/^#\s*(.*?)$/gm, '<h1 class="section-heading">$1</h1>')

            // ✅ Xóa dòng chỉ chứa dấu # / ## / ###
            .replace(/^\s*#{1,3}\s*$/gm, '')

            // List thường - giảm khoảng cách
            .replace(/^\s*[-*]\s+(.*?)$/gm, '<li class="item" style="margin-bottom:2px;line-height:1.4">$1</li>')
            .replace(/^\s*(\d+)\.\s+(.*?)$/gm, '<li class="numbered-item" style="margin-bottom:2px;line-height:1.4">$2</li>')
            .replace(/(<li.*?<\/li>(\n|$))+/g, '<ul class="item-list" style="margin:4px 0;padding-left:1.2em">$&</ul>')
    
            // Inline bold, italic
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
    
            // Chuyển line trống thành đoạn - giảm margin
            .replace(/\n{2,}/g, '</p><p class="paragraph" style="margin-bottom:4px;line-height:1.4">')
            // Chỉ chèn <br> khi không nằm trong <li> hay tiêu đề
            .replace(/([^\n>])\n(?!\n)/g, '$1<br>')

        // 🌟 Thêm – tự động chèn div sinh động
        formatted = formatted

        // 🎯 Chèn vocab-block: khi gặp "Vocabulary Item: ..." và <ul>
        .replace(/(Vocabulary Item:.*?)<ul>/gi, '<div class="vocab-block"><strong>$1</strong><ul>')
        .replace(/<\/ul>(?!<\/div>)/g, '</ul></div>') // đảm bảo có </div> sau ul nếu thiếu

        // 🧠 Grammar hoặc Analysis
        .replace(/(Grammar|Analysis|Language Analysis):/gi, '<div class="analysis-block"><strong>$1:</strong>')
        .replace(/(Explanation|Structure|Usage):/gi, '<br><strong>$1:</strong>')
        .replace(/(Example:.*?)<br>/gi, '<div class="example-block">$1<br>')
        .replace(/(Game|Activity):/gi, '<div class="activity-block"><strong>$1:</strong>')

        // Tự đóng div nếu không có
        .replace(/<\/div>\s*<\/div>/g, '</div>') // gộp div thừa
        .replace(/(<\/(ul|p)>)(\s*<br>)*\s*(?=<h[1-3]|<div|$)/g, '$1</div>'); // đóng block trước khi sang phần mới

        // Bọc trong content chính và thêm inline style để giảm khoảng cách
        formatted = `<div class="lesson-content"><p class="paragraph" style="margin-bottom:4px;line-height:1.4">${formatted}</p></div>`;
    
        return formatted;
    }

    // Di chuyển phương thức enhanceLessonPlanFormat từ dòng 848-929
    enhanceLessonPlanFormat(htmlContent) {
        // Nếu không có nội dung, trả về nguyên bản
        if (!htmlContent) return htmlContent;
        
        // Nếu đã có định dạng nâng cao, không xử lý lại
        if (htmlContent.includes('lesson-objective-section')) {
            return htmlContent;
        }
        
        try {
            // Tạo container tạm thời để xử lý DOM
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = htmlContent;
            
            // 1. Nhận diện và định dạng phần mục tiêu (Objectives)
            this.formatSection(tempDiv, /objectives|mục\s+tiêu/i, 'lesson-objective-section', 'target');
            
            // 2. Nhận diện và định dạng phần tài liệu (Materials)
            this.formatSection(tempDiv, /materials|tài\s+liệu/i, 'lesson-materials-section', 'book');
            
            // 3. Nhận diện và định dạng phần Board Plan
            this.formatSection(tempDiv, /board\s+plan|bảng|bản\s+phác\s+thảo/i, 'lesson-board-section', 'chalkboard');
            
            // 4. Nhận diện và định dạng phần Anticipated difficulties
            this.formatSection(tempDiv, /anticipated\s+difficulties|khó\s+khăn/i, 'lesson-difficulties-section', 'exclamation-triangle');
            
            // 5. Nhận diện và định dạng phần Procedure/Stage
            this.formatProcedureSection(tempDiv);
            
            // 6. Nhận diện và định dạng phần đánh giá (Assessment)
            this.formatSection(tempDiv, /assessment|evaluation|đánh\s+giá/i, 'lesson-assessment-section', 'clipboard-check');
            
            // 7. Nhận diện và định dạng phần làm thêm/bài tập về nhà (Homework)
            this.formatSection(tempDiv, /homework|bài\s+tập\s+về\s+nhà/i, 'lesson-homework-section', 'home');
            
            // Xử lý bỏ các thẻ trùng lặp
            const lessonContents = tempDiv.querySelectorAll('.lesson-content');
            if (lessonContents.length > 1) {
                for (let i = 1; i < lessonContents.length; i++) {
                    // Di chuyển tất cả nội dung bên trong lên thẻ đầu tiên
                    if (lessonContents[i].innerHTML.trim()) {
                        lessonContents[0].innerHTML += lessonContents[i].innerHTML;
                    }
                    // Xóa thẻ trùng lặp
                    lessonContents[i].remove();
                }
            }
            
            // Trả về HTML đã được cải thiện
            return tempDiv.innerHTML;
        } catch (error) {
            console.warn('Lỗi khi định dạng nâng cao giáo án:', error);
            // Trả về nội dung gốc nếu có lỗi
            return htmlContent;
        }
    }

    // Di chuyển phương thức formatSection từ dòng 930-963
    formatSection(container, regex, className, iconName) {
        // Tìm tất cả headings
        const headings = container.querySelectorAll('.section-heading');
        
        // Duyệt qua từng heading
        headings.forEach(heading => {
            // Kiểm tra nếu heading khớp với regex
            if (regex.test(heading.textContent)) {
                // Tìm phần tử cha nếu là h2 hoặc h3, nếu là h1 thì lấy toàn bộ container
                const section = heading.tagName === 'H1' 
                    ? container 
                    : this.getFollowingSection(heading);
                
                if (!section) return;
                
                // Đánh dấu phần này bằng class
                section.classList.add(className);
                
                // Tạo box đặc biệt
                const boxWrapper = document.createElement('div');
                boxWrapper.className = 'lesson-section-box';
                
                // Thêm icon nếu được chỉ định
                if (iconName) {
                    heading.innerHTML = `<i class="fas fa-${iconName}"></i> ${heading.innerHTML}`;
                }
                
                // Di chuyển heading và nội dung vào box
                section.parentNode.insertBefore(boxWrapper, section);
                boxWrapper.appendChild(section);
            }
        });
    }

    // Di chuyển phương thức formatProcedureSection từ dòng 964-988
    formatProcedureSection(container) {
        const headings = container.querySelectorAll('.section-heading');
        
        // Duyệt qua từng heading
        headings.forEach(heading => {
            // Kiểm tra nếu heading khớp với "Procedure" hoặc "Stage"
            if (/procedure|stage|quy\s+trình|các\s+bước/i.test(heading.textContent)) {
                // Lấy phần tử tiếp theo
                const section = this.getFollowingSection(heading);
                if (!section) return;
                
                // Đánh dấu phần này
                section.classList.add('lesson-procedure-section');
                
                // Thêm icon
                heading.innerHTML = `<i class="fas fa-tasks"></i> ${heading.innerHTML}`;
                
                // Phát hiện và định dạng bảng 2 cột
                this.formatTwoColumnTable(section);
            }
        });
    }

    // Di chuyển phương thức formatTwoColumnTable từ dòng 989-1041
    formatTwoColumnTable(section) {
        // Tìm bảng 2 cột tiềm năng
        const items = section.querySelectorAll('.item, .numbered-item');
        const itemsArray = Array.from(items);
        
        // Kiểm tra xem có pattern cột 1: Stage, cột 2: Activity
        for (let i = 0; i < itemsArray.length - 1; i++) {
            if (/warm-up|lead-in|practice|presentation|production|consolidation/i.test(itemsArray[i].textContent) &&
                !(/warm-up|lead-in|practice|presentation|production|consolidation/i.test(itemsArray[i+1].textContent))) {
                
                // Tạo bảng mới
                const table = document.createElement('table');
                table.className = 'lesson-procedure-table';
                table.style.borderCollapse = 'collapse';
                table.style.marginTop = '8px';
                table.style.marginBottom = '8px';
                
                // Tạo header
                const thead = document.createElement('thead');
                thead.innerHTML = `
                    <tr>
                        <th style="padding:6px 10px;">Stage</th>
                        <th style="padding:6px 10px;">Procedure</th>
                    </tr>
                `;
                table.appendChild(thead);
                
                // Tạo body
                const tbody = document.createElement('tbody');
                
                // Tạo hàng cho bảng từ các items
                for (let j = i; j < itemsArray.length; j += 2) {
                    if (j + 1 < itemsArray.length) {
                        const tr = document.createElement('tr');
                        tr.innerHTML = `
                            <td class="stage-column" style="padding:6px 10px;">${itemsArray[j].innerHTML}</td>
                            <td class="procedure-column" style="padding:6px 10px;">${itemsArray[j+1].innerHTML}</td>
                        `;
                        tbody.appendChild(tr);
                    }
                }
                
                table.appendChild(tbody);
                
                // Thay thế các items bằng bảng
                const parent = itemsArray[i].parentNode;
                parent.parentNode.insertBefore(table, parent);
                
                // Xóa các items đã được thay thế
                for (let j = i; j < itemsArray.length; j++) {
                    if (itemsArray[j].parentNode === parent) {
                        parent.removeChild(itemsArray[j]);
                    }
                }
                
                // Xóa container rỗng nếu cần
                if (parent.children.length === 0) {
                    parent.parentNode.removeChild(parent);
                }
                
                break;
            }
        }
    }

    // Di chuyển phương thức getFollowingSection từ dòng 1042-1063
    getFollowingSection(heading) {
        // Khởi tạo với phần tử tiếp theo
        let current = heading.nextElementSibling;
        const section = document.createElement('div');
        section.className = 'lesson-section-content';
        
        // Đưa heading vào phần mới
        section.appendChild(heading.cloneNode(true));
        heading.parentNode.replaceChild(section, heading);
        
        // Thêm tất cả phần tử tiếp theo cho đến khi gặp heading khác
        while (current && !current.matches('.section-heading, h1, h2, h3')) {
            const next = current.nextElementSibling;
            section.appendChild(current);
            current = next;
        }
        
        return section;
    }

    // Di chuyển phương thức createCollapsibleSections từ dòng 1357-1441
    createCollapsibleSections(content) {
        if (!content) return '<div class="lesson-content-empty">Không có nội dung</div>';
        
        // Nếu nội dung đã có cấu trúc section, không xử lý lại
        if (content.includes('<div class="section">')) {
            return content;
        }
        
        // Kiểm tra xem nội dung đã có cấu trúc HTML chưa
        const hasHtmlStructure = /<\/?[a-z][\s\S]*>/i.test(content);
        if (!hasHtmlStructure) {
            // Nếu chỉ là văn bản thuần túy, bọc trong thẻ p
            content = `<p>${content}</p>`;
        }
        
        // Tìm tất cả các heading
        const headingRegex = /<h([123])[^>]*>(.*?)<\/h\1>/g;
        const matches = [...content.matchAll(headingRegex)];
        
        // NẾU KHÔNG CÓ HEADING: Trả về nội dung trong một container đơn giản
        if (matches.length === 0) {
            return `
                <div class="lesson-content-simple">
                    ${content}
                </div>
            `;
        }
        
        // CÓ HEADING: Xử lý các phần theo heading
        let sections = [];
        let lastIndex = 0;
        
        // Xử lý nội dung trước heading đầu tiên (nếu có)
        if (matches[0].index > 0) {
            const introContent = content.substring(0, matches[0].index);
            if (introContent.trim()) {
                sections.push({
                    headingText: "Giới thiệu",
                    level: 2,
                    content: introContent,
                    isIntro: true
                });
            }
        }
        
        // Xử lý các phần heading
        for (let i = 0; i < matches.length; i++) {
            const current = matches[i];
            const nextIndex = i < matches.length - 1 ? matches[i + 1].index : content.length;
            
            const headingText = current[2];
            const level = parseInt(current[1]);
            const headingEndIndex = current.index + current[0].length;
            const sectionContent = content.substring(headingEndIndex, nextIndex);
            
            sections.push({
                headingText,
                level,
                content: sectionContent,
                isIntro: false
            });
            
            lastIndex = nextIndex;
        }
        
        // Xử lý nội dung sau heading cuối cùng (nếu có)
        if (lastIndex < content.length) {
            const outroContent = content.substring(lastIndex);
            if (outroContent.trim()) {
                sections.push({
                    headingText: "Nội dung bổ sung",
                    level: 2,
                    content: outroContent,
                    isOutro: true
                });
            }
        }
        
        // Tạo HTML kết quả - Không sử dụng các lớp lồng nhau không cần thiết
        let result = '<div class="lesson-content">';
        
        sections.forEach((section, index) => {
            const isFirst = index === 0;
            // QUAN TRỌNG: Luôn mở rộng section đầu tiên
            const expandedClass = isFirst ? 'expanded' : '';
            const iconClass = isFirst ? 'fa-chevron-up' : 'fa-chevron-down';
            const displayStyle = isFirst ? 'display: block;' : 'display: none;';
            const levelClass = `section-level-${section.level}`;
            
            result += `
                <div class="section ${levelClass}">
                    <div class="section-header" data-index="${index}">
                        <h${section.level} class="section-title">${section.headingText}</h${section.level}>
                        <i class="fas ${iconClass} toggle-icon"></i>
                    </div>
                    <div class="section-body ${expandedClass}" style="${displayStyle}">
                        ${section.content}
                    </div>
                </div>
            `;
        });
        
        result += '</div>';
        
        return result;
    }

    // Thêm phương thức mới vào class ContentFormatter
    formatSupplementaryContent(content, formData) {
        if (!content) return '';
        
        // Nếu đã định dạng, không xử lý lại
        if (content.includes('<div class="supp-content">')) {
            return content;
        }
        
        // Định dạng cơ bản giống như formatContent
        let formatted = this.formatContent(content);
        
        // Thêm xử lý đặc biệt cho nội dung TT
        try {
            // Tạo container tạm thời để xử lý DOM
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = formatted;
            
            // Xử lý các phần bài tập dựa vào loại TT
            const skillType = formData?.suppType || 'vocabulary';
            
            // Thêm class để áp dụng CSS đặc biệt cho từng loại
            tempDiv.querySelector('.lesson-content')?.classList.add(`supp-${skillType}`);
            
            // Định dạng các loại bài tập phổ biến
            this.formatExercises(tempDiv, skillType);
            
            // Thêm header thông tin TT
            const header = document.createElement('div');
            header.className = 'supp-header';
            header.innerHTML = `
                <h1 class="supp-title">Tiết Tăng cường ${formData.ttNumber || ''}</h1>
                <div class="supp-info">
                    <p><strong>Unit ${formData.unitNumber || ''}</strong>: ${formData.unitTitle || ''}</p>
                    <p><strong>Loại kỹ năng:</strong> ${this.getSkillTypeDisplay(skillType)}</p>
                    <p><strong>Chủ đề:</strong> ${formData.topicText || ''}</p>
                </div>
            `;
            
            // Thêm header vào đầu nội dung
            if (tempDiv.firstChild) {
                tempDiv.insertBefore(header, tempDiv.firstChild);
            } else {
                tempDiv.appendChild(header);
            }
            
            return `<div class="supp-content">${tempDiv.innerHTML}</div>`;
        } catch (error) {
            console.warn('Lỗi khi định dạng tiết tăng cường:', error);
            return formatted;
        }
    }

    // Hàm bổ trợ để định dạng các bài tập
    formatExercises(container, skillType) {
        // Tìm tất cả headings chứa từ khóa bài tập
        const exerciseHeadings = Array.from(container.querySelectorAll('.section-heading'))
            .filter(heading => /exercise|bài tập|activity/i.test(heading.textContent));
        
        exerciseHeadings.forEach((heading, index) => {
            const section = this.getFollowingSection(heading);
            if (!section) return;
            
            // Thêm class cho section bài tập
            section.classList.add('exercise-section');
            section.classList.add(`exercise-${index + 1}`);
            
            // Thêm icon tương ứng
            heading.innerHTML = `<i class="fas fa-tasks"></i> ${heading.innerHTML}`;
            
            // Đánh số bài tập
            heading.dataset.exerciseNumber = index + 1;
            
            // Xử lý đặc biệt theo loại bài tập
            if (/matching|nối/i.test(heading.textContent)) {
                this.formatMatchingExercise(section);
            } else if (/fill|điền/i.test(heading.textContent)) {
                this.formatFillInBlanksExercise(section);
            } else if (/choice|trắc nghiệm/i.test(heading.textContent)) {
                this.formatMultipleChoiceExercise(section);
            }
            // Các định dạng khác tùy theo loại bài tập
        });
    }

    // Hàm định dạng bài tập nối
    formatMatchingExercise(section) {
        // Tìm các item trong danh sách
        const items = section.querySelectorAll('.item, .numbered-item');
        if (items.length < 4) return; // Cần ít nhất 2 cặp để nối
        
        // Tạo bảng 2 cột cho bài tập nối
        const table = document.createElement('table');
        table.className = 'matching-exercise';
        
        // Chia items thành 2 cột
        const leftCol = document.createElement('tbody');
        const rightCol = document.createElement('tbody');
        
        // Chia các items vào 2 cột
        const midpoint = Math.ceil(items.length / 2);
        
        for (let i = 0; i < midpoint; i++) {
            if (items[i]) {
                const tr = document.createElement('tr');
                tr.innerHTML = `<td class="match-item match-left">${items[i].innerHTML}</td>`;
                leftCol.appendChild(tr);
            }
        }
        
        for (let i = midpoint; i < items.length; i++) {
            if (items[i]) {
                const tr = document.createElement('tr');
                tr.innerHTML = `<td class="match-item match-right">${items[i].innerHTML}</td>`;
                rightCol.appendChild(tr);
            }
        }
        
        // Thêm cột vào bảng
        const row = document.createElement('tr');
        const leftCell = document.createElement('td');
        const rightCell = document.createElement('td');
        
        leftCell.appendChild(leftCol);
        rightCell.appendChild(rightCol);
        
        row.appendChild(leftCell);
        row.appendChild(rightCell);
        
        table.appendChild(row);
        
        // Thay thế danh sách gốc bằng bảng nối
        const parent = items[0].parentNode;
        parent.parentNode.insertBefore(table, parent);
        parent.remove();
    }

    // Helper function để xử lý bài tập điền vào chỗ trống
    formatFillInBlanksExercise(section) {
        // Xử lý tương tự với bài tập điền vào chỗ trống
        // ...
    }

    // Helper function để hiển thị tên loại kỹ năng
    getSkillTypeDisplay(skillType) {
        const skillTypeMap = {
            'vocabulary': 'Từ vựng (Vocabulary)',
            'grammar': 'Ngữ pháp (Grammar)',
            'pronunciation': 'Phát âm (Pronunciation)',
            'reading': 'Đọc hiểu (Reading)',
            'listening': 'Nghe (Listening)',
            'speaking': 'Nói (Speaking)',
            'writing': 'Viết (Writing)'
        };
        
        return skillTypeMap[skillType] || skillType;
    }
}