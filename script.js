const API_KEY = "AIzaSyAg0spd_M5QPdsRCAHMvYSPnzMC71OLBQA"; 
const submitBtn = document.getElementById('submitBtn');
const imageInput = document.getElementById('imageInput');
const answerContent = document.getElementById('answerContent');

submitBtn.onclick = async () => {
    const files = Array.from(imageInput.files);
    if (files.length === 0) return alert("Vui lòng chọn ảnh!");

    document.getElementById('loading').classList.remove('hidden');
    submitBtn.disabled = true;

    // 1. Chuyển tất cả ảnh sang Base64
    const imageParts = await Promise.all(files.map(async (file) => {
        const base64Data = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result.split(',')[1]);
            reader.readAsDataURL(file);
        });
        return { inline_data: { mime_type: file.type, data: base64Data } };
    }));

    // 2. Lời nhắc yêu cầu AI đọc theo thứ tự câu
    const promptText = { 
        text: "Bạn là chuyên gia lịch sử. Hãy thực hiện các bước sau:\n" +
              "1. Quét qua tất cả các ảnh tôi gửi.\n" +
              "2. Xác định các câu hỏi dựa trên số thứ tự (ví dụ: Câu 1, Câu 2 hoặc 1, 2...).\n" +
              "3. Giải từng câu một theo đúng thứ tự từ nhỏ đến lớn.\n" +
              "4. Với mỗi câu, hãy ghi rõ: 'Câu X: [Nội dung câu hỏi]' sau đó mới đến 'Lời giải:'.\n" +
              "Nếu câu hỏi nằm ở nhiều ảnh khác nhau, hãy kết nối chúng lại để giải cho hoàn chỉnh."
    };

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [promptText, ...imageParts] }]
            })
        });

        const data = await response.json();
        const resultText = data.candidates[0].content.parts[0].text;

        document.getElementById('result').style.display = 'block';
        // Chuyển đổi ký tự xuống dòng để hiển thị đẹp trên web
        answerContent.innerHTML = resultText.replace(/\n/g, "<br>"); 
        
    } catch (error) {
        alert("Lỗi kết nối AI!");
        console.error(error);
    } finally {
        document.getElementById('loading').classList.add('hidden');
        submitBtn.disabled = false;
    }
};
