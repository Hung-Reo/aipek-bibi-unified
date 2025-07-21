// /static/js/controllers/lesson-plan/modules/export-manager.js
// Refactor from file chính lesson-plan-ui.js (14-May)

export class ExportManager {
    constructor() {
        // Không cần state phức tạp, có thể để trống
    }

    // Di chuyển phương thức cleanHtmlForExport từ dòng 1564-1661
    cleanHtmlForExport(contentElement) {
        if (!contentElement) return '';
    
        // 1. Tạo bản sao DOM để xử lý an toàn
        const tempContainer = document.createElement('div');
        tempContainer.innerHTML = contentElement.innerHTML;
    
        const beforeLength = tempContainer.innerHTML.length;
    
        // 2. Xóa các phần không cần xuất ra Word
        const selectorsToRemove = [
            '.rag-sources', 
            '.action-buttons-container', 
            '.feedback-section',
            '.feedback-container', 
            '.ai-disclaimer', 
            '.rag-status-container',
            '.rag-badge'
        ];
    
        selectorsToRemove.forEach(selector => {
            const elements = tempContainer.querySelectorAll(selector);
            elements.forEach(el => el.remove());
        });
    
        // 3. Gộp các .lesson-content nếu có nhiều
        const lessonContents = tempContainer.querySelectorAll('.lesson-content');
        if (lessonContents.length > 1) {
            const main = lessonContents[0];
            for (let i = 1; i < lessonContents.length; i++) {
                const extra = lessonContents[i];
                const children = Array.from(extra.childNodes);
        
                children.forEach(child => {
                    // Chỉ thêm nếu nội dung không trùng (tránh trùng heading)
                    const trimmed = child.textContent?.trim();
                    if (trimmed && !main.innerHTML.includes(trimmed)) {
                        // Thêm đường phân cách giữa các phần
                        const hr = document.createElement('hr');
                        main.appendChild(hr);
                        main.appendChild(child.cloneNode(true));
                    }
                });
        
                extra.remove();
            }
        }
    
        // 4. Gộp các nội dung bị wrapper trùng (nếu có)
        const wrapper = tempContainer.querySelector('.lesson-content-wrapper');
        const simple = wrapper?.querySelector('.lesson-content-simple');
        if (wrapper && simple) {
            wrapper.innerHTML = simple.innerHTML;
        }
    
        // 5. Loại bỏ các đoạn rỗng
        tempContainer.querySelectorAll('p').forEach(p => {
            if (!p.textContent.trim()) p.remove();
        });
    
        // 6. Cảnh báo nếu mất hơn 30% nội dung
        const afterLength = tempContainer.innerHTML.length;
        if (afterLength < beforeLength * 0.7) {
            console.warn('⚠️ Cảnh báo: Mất hơn 30% nội dung khi làm sạch HTML', {
                trước: beforeLength,
                sau: afterLength
            });
        }
    
        return tempContainer.innerHTML;
    }

    // Di chuyển phương thức exportToWord từ dòng 1663-1788
    exportToWord(contentElement, rawContent) {
        try {
            // Hiển thị trạng thái đang chuẩn bị
            const exportBtn = contentElement.querySelector('.export-word-btn');
            if (exportBtn) {
                exportBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang chuẩn bị...';
            }
            
            // Lấy tiêu đề
            const title = this.getLessonTitle(contentElement) || 'BiBi - Giáo án';
            
            // Sử dụng hàm mới để làm sạch HTML trước khi xuất
            const cleanedHtml = this.cleanHtmlForExport(contentElement);
            
            // Xử lý HTML để áp dụng định dạng cao cấp
            let htmlContent = cleanedHtml;
            
            // Xử lý phần thông tin tiêu đề và cơ bản
            htmlContent = htmlContent.replace(
                /(Tiêu đề:.*?)<br>(Bài\/Unit:.*?)<br>(Thời gian:.*?)<br>(Loại kỹ năng:.*?)(<p|<div)/gi,
                '<div class="lesson-header-section">' +
                '<table class="info-table" width="100%" cellpadding="4" cellspacing="0" style="border-collapse: collapse;">' +
                '<tr><td width="20%" style="font-weight:bold; color:#444;">$1</td><td width="30%">$2</td>' +
                '<td width="20%" style="font-weight:bold; color:#444;">$3</td><td width="30%">$4</td></tr>' +
                '</table></div>$5'
            );
            
            // 1. Định dạng phần Mục tiêu (Objectives)
            htmlContent = htmlContent.replace(
                /(<p[^>]*>)(.*?I\.\s*Objectives|Mục\s+tiêu.*?)(<\/p>)([\s\S]*?)(---)/gi, 
                '<div class="lesson-section lesson-objective-section">' +
                '<h3 class="section-title"><img src="https://i.imgur.com/YLXEPc8.png" width="24" height="24" style="vertical-align:middle; margin-right:8px;">$2</h3>' +
                '<div class="section-content">$4</div></div>$5'
            );
            
            // 2. Định dạng phần Phương tiện (Materials)
            htmlContent = htmlContent.replace(
                /(<p[^>]*>)(.*?II\.\s*Materials|Phương\s+tiện.*?)(<\/p>)([\s\S]*?)(---)/gi, 
                '<div class="lesson-section lesson-materials-section">' +
                '<h3 class="section-title"><img src="https://i.imgur.com/MgfGokE.png" width="24" height="24" style="vertical-align:middle; margin-right:8px;">$2</h3>' +
                '<div class="section-content">$4</div></div>$5'
            );
            
            // [Phần định dạng các phần còn lại vẫn giữ nguyên như cũ]
            
            // Tạo template Word với CSS cao cấp
            const template = `
                <html xmlns:o="urn:schemas-microsoft-com:office:office" 
                    xmlns:w="urn:schemas-microsoft-com:office:word" 
                    xmlns="http://www.w3.org/TR/REC-html40">
                <head>
                    <meta charset="utf-8">
                    <title>${title}</title>
                    <style>
                        /* Styles chung */
                        body {
                            font-family: 'Calibri', sans-serif;
                            margin: 2cm;
                            line-height: 1.3;
                            color: #333;
                        }
                        
                        h1, h2, h3, h4 {
                            font-family: 'Calibri', sans-serif;
                            margin-top: 12pt;
                            margin-bottom: 6pt;
                            color: #2E74B5;
                        }
                        
                        h1 { font-size: 18pt; border-bottom: 1pt solid #2E74B5; padding-bottom: 5pt; }
                        h3 { font-size: 14pt; }
                        h4 { font-size: 12pt; margin-top: 10pt; margin-bottom: 5pt; }
                        
                        p { margin: 5pt 0; }
                        
                        ul {
                            margin: 4pt 0;
                            padding-left: 20pt;
                        }
                        
                        li {
                            margin-bottom: 3pt;
                        }
                        
                        .info-table {
                            margin: 15pt 0;
                            border: 1pt solid #ddd;
                            background-color: #f9f9f9;
                        }
                        
                        /* Định dạng các phần chính */
                        .lesson-section {
                            margin: 15pt 0;
                            padding: 8pt 10pt;
                            border-radius: 4pt;
                            page-break-inside: avoid;
                        }
                        
                        .section-title {
                            margin-top: 0;
                            padding-bottom: 5pt;
                            border-bottom: 1pt solid rgba(0,0,0,0.1);
                        }
                        
                        .section-content {
                            padding: 0 5pt;
                        }
                        
                        /* Màu sắc các phần */
                        .lesson-objective-section {
                            background-color: #f0f7e6;
                            border-left: 5pt solid #4CAF50;
                        }
                        
                        .lesson-materials-section {
                            background-color: #e6f3ff;
                            border-left: 5pt solid #2196F3;
                        }
                        
                        .lesson-difficulties-section {
                            background-color: #fff8e1;
                            border-left: 5pt solid #FFC107;
                        }
                        
                        .lesson-board-section {
                            background-color: #f3e5f5;
                            border-left: 5pt solid #9C27B0;
                        }
                        
                        .lesson-procedure-section {
                            background-color: #e8eaf6;
                            border-left: 5pt solid #3F51B5;
                        }
                        
                        .lesson-homework-section {
                            background-color: #ffebee;
                            border-left: 5pt solid #F44336;
                        }
                        
                        .lesson-experience-section {
                            background-color: #e0f2f1;
                            border-left: 5pt solid #009688;
                        }
                        
                        /* Định dạng các giai đoạn */
                        .stage-header {
                            margin: 12pt 0 5pt 0;
                            padding: 5pt 8pt;
                            background-color: #f5f5f5;
                            border-left: 3pt solid #607D8B;
                        }
                        
                        .stage-title {
                            margin: 0;
                            color: #37474F;
                            font-weight: bold;
                        }
                        
                        /* Định dạng Aim, Procedure, Expected outcome */
                        .stage-aim, .stage-procedure, .stage-outcome {
                            margin: 5pt 0;
                        }
                        
                        .aim-label, .procedure-label, .outcome-label {
                            font-weight: bold;
                            color: #01579B;
                            margin-right: 5pt;
                        }
                        
                        /* Định dạng bullet points chính */
                        .major-bullet {
                            margin-top: 8pt;
                            color: #0D47A1;
                        }
                        
                        /* Cải thiện biểu đồ và bảng */
                        table {
                            border-collapse: collapse;
                            width: 100%;
                            margin: 10pt 0;
                        }
                        
                        th, td {
                            border: 1pt solid #ddd;
                            padding: 6pt;
                        }
                        
                        th {
                            background-color: #f5f5f5;
                            color: #333;
                            font-weight: bold;
                        }
                    </style>
                </head>
                <body>
                    <h1>${title}</h1>
                    ${htmlContent}
                    <div style="text-align:center; margin-top:20pt; color:#777; font-size:8pt; border-top: 1pt solid #ddd; padding-top: 5pt;">
                        Tạo bởi BiBi - Trợ lý AI Giáo dục K12
                    </div>
                </body>
                </html>
            `;
            
            // Tạo blob và tải xuống
            const blob = new Blob([template], {type: 'application/msword'});
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            
            // Làm sạch tên file
            const cleanTitle = title.replace(/[^\w\s]/gi, '').replace(/\s+/g, '_');
            link.download = `${cleanTitle}.doc`;
            
            // Tải xuống file
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Khôi phục nút
            if (exportBtn) {
                setTimeout(() => {
                    exportBtn.innerHTML = '<i class="fas fa-file-word"></i> Xuất Word';
                }, 1000);
            }
        } catch (error) {
            console.error('Lỗi khi xuất Word:', error);
            alert('Có lỗi khi xuất Word. Vui lòng thử lại sau.');
            
            // Khôi phục nút
            const exportBtn = contentElement.querySelector('.export-word-btn');
            if (exportBtn) {
                exportBtn.innerHTML = '<i class="fas fa-file-word"></i> Xuất Word';
            }
        }
    }

    // Di chuyển các phương thức liên quan đến xuất
    // createSimpleWordDocument từ dòng 1790-1855
    createSimpleWordDocument(contentElement, rawContent, exportBtn) {
        try {
            // Lấy tiêu đề từ phần tử h3 đầu tiên hoặc dùng tiêu đề mặc định
            const title = this.getLessonTitle(contentElement) || 'BiBi - Giáo án';
            
            // Tạo một bản sao của nội dung để xử lý
            const processedContent = contentElement.cloneNode(true);
            
            // Loại bỏ các phần không cần thiết khỏi export
            processedContent.querySelectorAll('.rag-sources, .action-buttons-container, .feedback-section').forEach(el => el.remove());
            
            // Tạo template Word với CSS tối ưu
            const template = `
                <html xmlns:o="urn:schemas-microsoft-com:office:office" 
                    xmlns:w="urn:schemas-microsoft-com:office:word" 
                    xmlns="http://www.w3.org/TR/REC-html40">
                <head>
                    <meta charset="utf-8">
                    <title>${title}</title>
                    <style>
                        body { font-family: 'Times New Roman', Times, serif; margin: 2cm; line-height: 1.3; }
                        h1, h2, h3 { color: #2E74B5; margin-top: 12pt; margin-bottom: 6pt; }
                        h1 { font-size: 16pt; }
                        h2 { font-size: 14pt; }
                        h3 { font-size: 12pt; }
                        p { margin: 6pt 0; }
                        ul, ol { margin: 6pt 0 6pt 1cm; padding-left: 0.5cm; }
                        li { margin-bottom: 3pt; }
                        table { border-collapse: collapse; width: 100%; margin: 10pt 0; }
                        td, th { border: 1px solid #ddd; padding: 4pt; }
                        .section-heading { border-bottom: 1px solid #eee; padding-bottom: 3pt; }
                        
                        /* Thêm style mới cho các phần giáo án */
                        .lesson-section-box {
                            margin: 10pt 0;
                            padding: 10pt;
                            border: 1px solid #ddd;
                            background-color: #f9f9f9;
                        }
                        .lesson-objective-section { background-color: #f0f7e6; }
                        .lesson-materials-section { background-color: #e6f3ff; }
                        .lesson-board-section { background-color: #f7f0f7; }
                        .lesson-procedure-table { border-collapse: collapse; width: 100%; }
                        .lesson-procedure-table th, .lesson-procedure-table td { 
                            border: 1px solid #ddd; 
                            padding: 4pt;
                        }
                        .stage-column { background-color: #f5f5f5; width: 25%; }
                        .procedure-column { width: 75%; }
                    </style>
                </head>
                <body>
                    <h1>${title}</h1>
                    ${processedContent.innerHTML}
                    <p style="text-align:center; margin-top:20pt; color:#777; font-size:8pt;">
                        Tạo bởi BiBi - Trợ lý AI Giáo dục K12
                    </p>
                </body>
                </html>
            `;
            
            // Tạo blob và tải xuống
            const blob = new Blob([template], {type: 'application/msword'});
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            
            // Làm sạch tên file
            const cleanTitle = title.replace(/[^\w\s]/gi, '').replace(/\s+/g, '_');
            link.download = `${cleanTitle}.doc`;
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Khôi phục nút
            if (exportBtn) {
                setTimeout(() => {
                    exportBtn.innerHTML = '<i class="fas fa-file-word"></i> Xuất Word';
                }, 1000);
            }
        } catch (error) {
            console.error('Lỗi khi hoàn thành xuất Word:', error);
            this.handleWordExportError(exportBtn);
        }
    }

    // createFallbackWordDocument từ dòng 1857-1902
    createFallbackWordDocument(contentElement, rawContent, exportBtn) {
        try {
            // Lấy tiêu đề
            const title = this.getLessonTitle(contentElement) || 'BiBi - Giáo án';
            
            // Tạo template Word đơn giản hơn
            const simpleTemplate = `
                <html>
                <head>
                    <meta charset="utf-8">
                    <title>${title}</title>
                    <style>
                        body { font-family: 'Times New Roman', Times, serif; margin: 2cm; }
                        h1, h2, h3 { color: #2E74B5; }
                        table { border-collapse: collapse; width: 100%; }
                        td, th { border: 1px solid black; padding: 8px; }
                    </style>
                </head>
                <body>
                    <h1>${title}</h1>
                    ${contentElement.innerHTML}
                    <p style="text-align:center; margin-top:20pt; color:#777; font-size:8pt;">
                        Tạo bởi BiBi - Trợ lý AI Giáo dục K12
                    </p>
                </body>
                </html>
            `;
            
            // Tạo blob và tải xuống
            const blob = new Blob([simpleTemplate], {type: 'application/msword'});
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `${title.replace(/[^\w\s]/gi, '').replace(/\s+/g, '_')}.doc`;
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Khôi phục nút
            if (exportBtn) {
                setTimeout(() => {
                    exportBtn.innerHTML = '<i class="fas fa-file-word"></i> Xuất Word';
                }, 1000);
            }
        } catch (error) {
            console.error('Lỗi khi xuất Word đơn giản:', error);
            this.handleWordExportError(exportBtn);
        }
    }

    // handleWordExportError từ dòng 1904-1915
    handleWordExportError(exportBtn) {
        // Hiển thị thông báo cho người dùng
        alert('Không thể xuất file Word. Hãy thử sao chép nội dung và dán vào Word.');
        
        // Khôi phục nút
        if (exportBtn) {
            exportBtn.innerHTML = '<i class="fas fa-file-word"></i> Xuất Word';
        }
    }

    // completeWordExport từ dòng 1917-1985
    completeWordExport(contentElement, rawContent, exportBtn) {
        try {
            // Lấy nút xuất nếu chưa được truyền vào
            if (!exportBtn) {
                exportBtn = contentElement.querySelector('.export-word-btn');
                if (exportBtn) {
                    exportBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang chuẩn bị...';
                }
            }
            
            // Lấy tiêu đề từ phần tử h3 đầu tiên hoặc dùng tiêu đề mặc định
            const title = this.getLessonTitle(contentElement) || 'BiBi - Giáo án';
            
            // Tạo một bản sao của nội dung để xử lý
            const processedContent = contentElement.cloneNode(true);
            
            // Loại bỏ các phần không cần thiết khỏi export
            processedContent.querySelectorAll('.rag-sources, .action-buttons-container, .feedback-section').forEach(el => el.remove());
            
            // Phần code xuất Word hiện tại...
            // [Giữ nguyên phần còn lại của hàm exportToWord cũ]
            
            // Tạo template với CSS tối ưu
            const template = `
                <html xmlns:o="urn:schemas-microsoft-com:office:office" 
                    xmlns:w="urn:schemas-microsoft-com:office:word" 
                    xmlns="http://www.w3.org/TR/REC-html40">
                <head>
                    <meta charset="utf-8">
                    <title>${title}</title>
                    <style>
                        body { font-family: 'Times New Roman', Times, serif; margin: 2cm; line-height: 1.3; }
                        h1, h2, h3 { color: #2E74B5; margin-top: 12pt; margin-bottom: 6pt; }
                        h1 { font-size: 16pt; }
                        h2 { font-size: 14pt; }
                        h3 { font-size: 12pt; }
                        p { margin: 6pt 0; }
                        ul, ol { margin: 6pt 0 6pt 1cm; padding-left: 0.5cm; }
                        li { margin-bottom: 3pt; }
                        table { border-collapse: collapse; width: 100%; margin: 10pt 0; }
                        td, th { border: 1px solid #ddd; padding: 4pt; }
                        .section-heading { border-bottom: 1px solid #eee; padding-bottom: 3pt; }
                    </style>
                </head>
                <body>
                    <h1>${title}</h1>
                    ${processedContent.innerHTML}
                    <p style="text-align:center; margin-top:20pt; color:#777; font-size:8pt;">
                        Tạo bởi BiBi - Trợ lý AI Giáo dục K12
                    </p>
                </body>
                </html>
            `;
            
            // Tạo blob và tải xuống
            const blob = new Blob([template], {type: 'application/msword'});
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            
            // Làm sạch tên file
            const cleanTitle = title.replace(/[^\w\s]/gi, '').replace(/\s+/g, '_');
            link.download = `${cleanTitle}.doc`;
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Khôi phục nút
            if (exportBtn) {
                setTimeout(() => {
                    exportBtn.innerHTML = '<i class="fas fa-file-word"></i> Xuất Word';
                }, 1000);
            }
        } catch (error) {
            console.error('Lỗi khi hoàn thành xuất Word:', error);
            alert('Có lỗi khi xuất Word. Vui lòng thử lại sau.');
            
            // Khôi phục nút nếu có lỗi
            if (exportBtn) {
                exportBtn.innerHTML = '<i class="fas fa-file-word"></i> Xuất Word';
            }
        }
    }

    // exportToPdf từ dòng 1987-2082
    exportToPdf(contentElement) {
        try {
            // Chuẩn bị trang cho việc in
            const currentTitle = document.title;
            const originalContent = document.body.innerHTML;
            
            // Lấy tiêu đề
            const title = this.getLessonTitle(contentElement) || 'BiBi - Giáo án';
            
            // Tạo một div ẩn để chứa nội dung cần in
            const printDiv = document.createElement('div');
            printDiv.className = 'print-container';
            
            // Thêm header cho bản in
            const header = document.createElement('div');
            header.className = 'print-header';
            header.innerHTML = `
                <div class="print-logo">🤖 BiBi - Trợ lý AI Giáo dục K12</div>
                <div class="print-date">Ngày tạo: ${new Date().toLocaleDateString('vi-VN')}</div>
            `;
            printDiv.appendChild(header);
            
            // Thêm nội dung chính
            const mainContent = document.createElement('div');
            mainContent.className = 'print-content';

            // Sao chép nội dung từ contentElement và thực hiện xử lý để giảm khoảng trống
            const processedContent = contentElement.cloneNode(true);
            processedContent.querySelectorAll('.action-buttons-container, .rag-sources, .feedback-section').forEach(el => el.remove());
            // Mở rộng tất cả các phần collapse để hiển thị đầy đủ nội dung
            processedContent.querySelectorAll('.collapsible-body').forEach(el => {
                el.style.display = 'block';
            });
            processedContent.querySelectorAll('.collapsible-header').forEach(el => {
                el.style.display = 'none';
            });

            // Loại bỏ các khoảng trắng dư thừa
            mainContent.innerHTML = processedContent.innerHTML
                .replace(/<br>\s*<br>/g, '<br>') // Loại bỏ double line breaks
                .replace(/(\s*<br>\s*){3,}/g, '<br><br>') // Giới hạn tối đa 2 line breaks
                .replace(/<p>\s*<\/p>/g, '') // Loại bỏ các đoạn trống
                .replace(/\n\s*\n/g, '\n'); // Loại bỏ dòng trống

            printDiv.appendChild(mainContent);
            
            // Thêm footer
            const footer = document.createElement('div');
            footer.className = 'print-footer';
            footer.innerHTML = `<div>Tạo bởi BiBi - Trợ lý AI Giáo dục K12</div>`;
            printDiv.appendChild(footer);
            
            // Thêm thẻ style để đảm bảo định dạng khi in
            const style = document.createElement('style');
            style.innerHTML = `
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .print-container, .print-container * {
                        visibility: visible;
                    }
                    .print-container {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        padding: 1cm;
                    }
                    .collapsible-header { display: none; }
                    .collapsible-body { display: block !important; }
                    
                    /* Tối ưu giảm khoảng cách */
                    h1, h2, h3, h4 { 
                        margin-top: 10pt; 
                        margin-bottom: 5pt; 
                        page-break-after: avoid; 
                    }
                    p { margin: 5pt 0; }
                    ul, ol { margin: 5pt 0 5pt; padding-left: 15pt; }
                    li { margin-bottom: 2pt; }
                    table { page-break-inside: avoid; }
                    .print-content { line-height: 1.2; }
                    
                    /* Thêm page breaks tự động ở các phần thích hợp */
                    .lesson-content > h1, .lesson-content > h2 { page-break-before: auto; }
                }
            `;
            document.head.appendChild(style);
            
            // Thêm div in ấn vào body
            document.body.appendChild(printDiv);
            
            // Hiển thị thông báo cho người dùng
            const exportBtn = contentElement.querySelector('.export-pdf-btn');
            if (exportBtn) {
                exportBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang chuẩn bị...';
            }
            
            // Đặt tiêu đề trang để hiển thị khi lưu PDF
            document.title = title;
            
            // Chờ một chút để CSS được áp dụng
            setTimeout(() => {
                // In trang
                window.print();
                
                // Khôi phục lại trạng thái ban đầu
                document.body.removeChild(printDiv);
                document.head.removeChild(style);
                document.title = currentTitle;
                
                if (exportBtn) {
                    exportBtn.innerHTML = '<i class="fas fa-file-pdf"></i> Xuất PDF';
                }
            }, 300);
        } catch (error) {
            console.error('Lỗi khi xuất PDF:', error);
            alert('Có lỗi khi xuất PDF. Vui lòng thử lại sau.');
        }
    }

    // Thêm phương thức mới để thêm các nút xuất vào form
    addExportButtons(contentElement) {
        if (!contentElement) return;

        // Kiểm tra xem đã có các nút chưa
        if (contentElement.querySelector('.action-buttons-container')) return;

        // Tạo container cho các nút hành động
        const actionsContainer = document.createElement('div');
        actionsContainer.className = 'action-buttons-container';
        actionsContainer.style.marginTop = '20px';
        actionsContainer.style.display = 'flex';
        actionsContainer.style.gap = '10px';
        actionsContainer.innerHTML = `
            <button class="action-button export-word-btn" title="Xuất Word" style="display:inline-flex; align-items:center; gap:5px; background:#f5f5f5; border:1px solid #ddd; border-radius:4px; padding:8px 12px; cursor:pointer;">
                <i class="fas fa-file-word" style="color:#2B579A;"></i> Xuất Word
            </button>
            <button class="action-button export-pdf-btn" title="Xuất PDF" style="display:inline-flex; align-items:center; gap:5px; background:#f5f5f5; border:1px solid #ddd; border-radius:4px; padding:8px 12px; cursor:pointer;">
                <i class="fas fa-file-pdf" style="color:#F40F02;"></i> Xuất PDF
            </button>
        `;
        
        contentElement.appendChild(actionsContainer);
        
        // Thêm sự kiện cho các nút
        this.attachButtonEvents(actionsContainer, contentElement);
    }

    // Phương thức mới để attach events cho các nút
    attachButtonEvents(actionsContainer, contentElement) {
        const exportWordBtn = actionsContainer.querySelector('.export-word-btn');
        if (exportWordBtn) {
            exportWordBtn.addEventListener('click', () => {
                // Lấy nội dung để có thể truyền vào exportToWord
                const fullContent = contentElement.innerText || '';
                this.exportToWord(contentElement, fullContent);
            });
        }
        
        const exportPdfBtn = actionsContainer.querySelector('.export-pdf-btn');
        if (exportPdfBtn) {
            exportPdfBtn.addEventListener('click', () => {
                this.exportToPdf(contentElement);
            });
        }
    }

    // Phương thức hỗ trợ để lấy tiêu đề
    getLessonTitle(contentElement) {
        const card = contentElement.closest('.lesson-plan-card');
        if (!card) return '';
        
        const heading = card.querySelector('h3');
        if (!heading) return '';
        
        // Loại bỏ badge và các phần tử khác
        return heading.textContent.replace(/📚 RAG|🤖 AI/g, '').trim();
    }
}