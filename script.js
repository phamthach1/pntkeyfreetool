document.addEventListener('DOMContentLoaded', () => {
    const displayKeyElement = document.getElementById('displayKey');
    const getKeyButton = document.getElementById('getKeyButton'); // Nút Lấy Key Free mới
    const copyKeyButton = document.getElementById('copyKeyButton');
    const playMusicButton = document.getElementById('playMusicButton');
    const backgroundMusic = document.getElementById('backgroundMusic');
    const statusMessageElement = document.getElementById('statusMessage');

    // --- LOGIC TẠO KEY FREE TRONG JAVASCRIPT (Đã cung cấp ở hướng dẫn trước) ---

    // Một hàm tạo số giả ngẫu nhiên có thể lặp lại (deterministic PRNG)
    // Để đảm bảo Key được tạo ra giống nhau mỗi ngày và khớp với tool PHP
    // KHÔNG PHẢI LÀ MÃ HÓA AN TOÀN - chỉ dùng cho mục đích "giả ngẫu nhiên"
    class LCG {
        constructor(seed) {
            this.m = 0x80000000; // 2^31
            this.a = 1103515245;
            this.c = 12345;
            this.state = seed ? seed % this.m : Math.floor(Math.random() * (this.m - 1));
            if (this.state < 0) { // Đảm bảo trạng thái ban đầu là số dương
                this.state += this.m;
            }
        }
        next() {
            this.state = (this.a * this.state + this.c) % this.m;
            return this.state / (this.m - 1); // Trả về số thập phân từ 0 đến 1
        }
    }

    // Hàm tạo Key Free PNT + 5 số ngẫu nhiên dựa trên ngày
    function generateDailyFreeKeyJS() {
        const today = new Date();
        // Lấy ngày theo giờ UTC để đảm bảo tính nhất quán trên mọi múi giờ
        // (Key sẽ thay đổi vào 00:00 UTC)
        const yyyymmdd = today.getUTCFullYear() * 10000 + (today.getUTCMonth() + 1) * 100 + today.getUTCDate();

        // CẢNH BÁO: Chuỗi 'secret_salt' này sẽ HIỂN THỊ CÔNG KHAI trong mã nguồn JavaScript.
        // ĐẢM BẢO CHUỖI NÀY GIỐNG HỆT NHƯ TRONG FILE cac.php CỦA BẠN!
        const secret_salt = 'DAY_LA_CHUOI_BI_MAT_CUA_BAN_HAY_THAY_DOI_NO_NGAY_LAP_TUC_VA_GIU_KIN'; 

        // Tạo một seed số từ ngày và chuỗi salt
        let combinedString = yyyymmdd.toString() + secret_salt;
        let numericSeed = 0;
        for (let i = 0; i < combinedString.length; i++) {
            numericSeed += combinedString.charCodeAt(i);
        }
        numericSeed = Math.abs(numericSeed) % 2147483647; // Giới hạn seed trong phạm vi số nguyên dương 32-bit

        let rng = new LCG(numericSeed);
        let randomNumber = Math.floor(rng.next() * 100000); // Tạo 5 chữ số (0-99999)
        
        return "PNT" + String(randomNumber).padStart(5, '0');
    }

    // --- KẾT THÚC LOGIC TẠO KEY FREE TRONG JAVASCRIPT ---


    // Hàm hiển thị trạng thái Key (cho tham số ?ma=)
    function displayStatusMessage(message, type) {
        statusMessageElement.textContent = message;
        statusMessageElement.className = 'status-message show'; // Reset class
        statusMessageElement.classList.add(type); // Thêm class 'success' hoặc 'error'
    }

    // Hàm đọc tham số từ URL
    function getUrlParameter(name) {
        name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
        var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
        var results = regex.exec(location.search);
        return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
    }

    // Khi trang tải xong
    // 1. Kiểm tra tham số ?ma=
    // 2. Nếu có, kiểm tra Key và hiển thị trạng thái
    // 3. Nếu không, chỉ hiển thị nút "Lấy Key Free"
    const urlKeyParam = getUrlParameter('ma');
    const todayKey = generateDailyFreeKeyJS(); // Key của ngày hôm nay

    if (urlKeyParam) {
        // Nếu có tham số 'ma' trên URL
        if (urlKeyParam.toUpperCase() === todayKey.toUpperCase()) {
            displayStatusMessage('Key đã được kích hoạt! Chúc bạn trải nghiệm vui vẻ.', 'success');
            displayKeyElement.value = todayKey; // Hiển thị Key hợp lệ
            copyKeyButton.disabled = false;
        } else {
            displayStatusMessage('Key không hợp lệ hoặc đã hết hạn. Vui lòng lấy Key mới.', 'error');
            displayKeyElement.value = "KEY KHÔNG HỢP LỆ";
            copyKeyButton.disabled = true;
        }
        // Sau khi kiểm tra key từ URL, có thể ẩn nút "Lấy Key Free" nếu bạn muốn
        // getKeyButton.style.display = 'none'; 
    } else {
        // Nếu không có tham số 'ma', chỉ hiển thị "Đang tải..." và đợi người dùng nhấn "Lấy Key"
        displayKeyElement.value = "Nhấn 'Lấy Key Free'";
        copyKeyButton.disabled = true;
    }

    // Xử lý sự kiện khi nhấn nút "Lấy Key Free"
    getKeyButton.addEventListener('click', () => {
        const key = generateDailyFreeKeyJS();
        displayKeyElement.value = key;
        copyKeyButton.disabled = false;
        statusMessageElement.classList.remove('show', 'success', 'error'); // Ẩn thông báo trạng thái
    });

    // Xử lý sự kiện khi nhấn nút "Play Music"
    playMusicButton.addEventListener('click', () => {
        if (backgroundMusic.paused) {
            backgroundMusic.play()
                .then(() => {
                    console.log('Music started playing');
                    playMusicButton.innerHTML = '<i class="fas fa-pause"></i> Pause Music'; // Đổi icon và text
                })
                .catch(error => {
                    console.error('Error playing music:', error);
                    alert('Không thể phát nhạc. Vui lòng kiểm tra file nhạc hoặc cài đặt trình duyệt.');
                });
        } else {
            backgroundMusic.pause();
            console.log('Music paused');
            playMusicButton.innerHTML = '<i class="fas fa-play"></i> Play Music'; // Đổi icon và text
        }
    });

    // Sự kiện khi nhạc kết thúc
    backgroundMusic.addEventListener('ended', () => {
        playMusicButton.innerHTML = '<i class="fas fa-play"></i> Play Music';
    });

    // Xử lý sự kiện khi nhấn nút "Copy Key"
    copyKeyButton.addEventListener('click', () => {
        const keyToCopy = displayKeyElement.value;
        if (keyToCopy && keyToCopy !== "Nhấn 'Lấy Key Free'" && keyToCopy !== "KEY KHÔNG HỢP LỆ") {
            navigator.clipboard.writeText(keyToCopy)
                .then(() => {
                    alert('Key đã được sao chép: ' + keyToCopy);
                    console.log('Key đã được sao chép vào clipboard:', keyToCopy);
                })
                .catch(err => {
                    console.error('Không thể sao chép key:', err);
                    alert('Không thể sao chép key tự động. Vui lòng sao chép thủ công.');
                });
        } else {
            alert('Không có Key hợp lệ để sao chép!');
        }
    });
});
