# 🎯 FPS SensFinder Pro

Ứng dụng chuyên nghiệp giúp game thủ FPS tìm ra độ nhạy chuột (Sensitivity) lý tưởng nhất cho cơ tay và lót chuột của mình, lấy cảm hứng từ các phần mềm huấn luyện nổi tiếng như **Oblivity** và **Aim Lab**.

---

## 🚀 Các Tính Năng Nổi Bật

1. **Phòng Luyện Phản Xạ Chuẩn Aim Lab 3D (Three.js WebGL + Pointer Lock API)**:
   - Đọc trực tiếp tín hiệu chuột thô (Raw Mouse Input) 1:1 không qua gia tốc chuột Windows.
   - Cơ chế lọc xung đột con trỏ (Hardware recentering clamp), triệt tiêu hoàn toàn giật rung hoặc văng/teleport góc nhìn.
   - **4 Cấp độ khó**: Dễ, Vừa (chuẩn thi đấu), Khó (micro-adjust), Chuyên Nghiệp (headshot pixel).
   - **Phóng to ngắm (ADS Zoom)**: Thu hẹp FOV từ 103° xuống 74° (mục tiêu phóng to ~1.4x) kèm tỉ lệ nhạy 0.72x mô phỏng chính xác cơ chế ngắm của CS2 và Valorant.
   - Thao tác nhanh: Chuột trái để bắn, Chuột phải để bật/tắt ngắm ADS, phím F để bật toàn màn hình, phím ESC để nhả chuột.

2. **Thuật Toán Dò Sens PSA Từng Bước (Perfect Sensitivity Approximation)**:
   - Đo lường và so sánh 2 mức Sens (Thấp vs Cao) qua các bài tập *Tracking* (bám tâm) và *Flicking* (bắn lướt phản xạ).
   - Tự động nhận diện thiên hướng Overshoot (quá đà do sens cao) hay Undershoot (hụt tầm do sens thấp).
   - Thu hẹp dải Sens qua 5 vòng để tìm ra "Golden Sens" tối ưu nhất cho cơ tay người chơi.

3. **Thuật Toán Quét Sens Benchmark (Oblivity Style)**:
   - Quét liên tục qua 5 mốc Sens từ thấp đến cao.
   - Phân tích và dựng đường cong hiệu năng parabol (Performance Curve).
   - Xác định đỉnh phong độ (Peak Optimal Sweet Spot) với độ mượt cổ tay cao nhất.

4. **Bộ Quy Đổi Sens Đa Game (Cross-Game Converter)**:
   - Giữ nguyên 100% khoảng cách `cm/360°`: CS2, Valorant, Apex Legends, Overwatch 2, Rainbow Six Siege, Call of Duty, PUBG, Fortnite.
   - Bảng tham chiếu thông số chuẩn của các Pro Player hàng đầu thế giới (TenZ, s1mple, donk, NiKo, ZywOo...).

5. **Tùy Biến Tâm Ngắm & Màu Mục Tiêu Địch**:
   - Tùy chỉnh tâm ngắm thi đấu: Màu sắc, độ dày, độ rộng, khoảng cách (gap), chấm giữa (center dot), viền đen (outline).
   - Tùy chọn 6 bảng màu phản quang mục tiêu (Vàng Neon, Đỏ, Volt Green, Cyan, Tím, Trắng).

6. **Kho Hồ Sơ Chuột & Tự Động Lưu Trữ (LocalStorage Database)**:
   - Lưu trữ không giới hạn các cấu hình Sens đã tìm được theo từng tựa game.
   - Tự động ghi nhớ cấu hình tâm ngắm, màu sắc và độ nhạy của phiên chơi gần nhất.

---

## 🛠️ Cài Đặt & Khởi Chạy

### Yêu cầu:
- Node.js >= 18.x

### Cài đặt dependencies:
```bash
npm install
```

### Chạy môi trường phát triển:
```bash
npm run dev
```
Trình duyệt sẽ mở tại `http://localhost:5173`.

### Đóng gói sản phẩm (Build):
```bash
npm run build
```

---

## 🎮 Hướng Dẫn Điều Khiển Trong 3D Range

- **Click chuột trái / Nút Bắt đầu**: Khóa chuột (Pointer Lock) để điều khiển góc nhìn FPS 1:1.
- **Di chuyển chuột**: Lia góc nhìn thứ nhất.
- **Chuột trái**: Bắn mục tiêu.
- **Chuột phải**: Bật / Tắt phóng to ngắm (ADS Zoom).
- **Phím F**: Bật / Tắt toàn màn hình.
- **Phím ESC**: Tạm dừng và nhả con trỏ chuột.
