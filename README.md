# 💰 Telegram Bot - Quản Lý Thu Chi Cá Nhân (Google Sheets)

Bot Telegram giúp bạn ghi chép, quản lý thu chi cá nhân cực kỳ nhanh chóng và tiện lợi. Toàn bộ dữ liệu được lưu trữ trực tiếp trên Google Sheets của bạn, đảm bảo riêng tư và an toàn tuyệt đối.

## ✨ Tính năng nổi bật
*   **Ghi chép siêu tốc:** Nhắn tin là lưu, tự động nhận diện số tiền (VD: `Cà phê 30k`, `+ Lương 10m`, `Đi chợ 2.5 củ`).
*   **Tự động phân luồng:** Tự động tạo và lưu riêng rẽ vào 2 Tabs trong Google Sheets: `ThuNhap` và `ChiTieu`.
*   **Cảnh báo ngân sách (Budget Alert):** Tự động tính % chi tiêu trong tháng. Cảnh báo khi tiêu quá 80% hoặc vượt hạn mức.
*   **Hoàn tác linh hoạt:** Lệnh `/delete` và `/edit` giúp sửa/xoá lỗi sai ngay lập tức mà không cần mở Google Sheet.
*   **Báo cáo thông minh:** 
    *   Xem nhanh số dư ví hiện tại.
    *   `/report`: Tóm tắt Thu/Chi của tháng hiện tại.
    *   `/report dd/MM/yyyy`: Xem chi tiết các khoản tiêu trong 1 ngày cụ thể.
    *   `/report MM/yyyy`: Xem chi tiết Thu/Chi của 1 tháng cụ thể.
*   **Gọn nhẹ - Miễn phí:** Chạy hoàn toàn trên nền tảng Google Apps Script (Serverless), lưu bằng Google PropertiesService, không tạo thêm Tab rác.

---

## 🛠 Hướng dẫn Cài đặt

### Bước 1: Tạo Bot Telegram
1. Mở Telegram, tìm kiếm **@BotFather**.
2. Gõ lệnh `/newbot` và làm theo hướng dẫn để tạo bot mới.
3. Copy đoạn **HTTP API Token** (Ví dụ: `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`).

### Bước 2: Lấy Chat ID của bạn
1. Tìm kiếm **@userinfobot** trên Telegram và ấn Start.
2. Bot sẽ trả về thông tin của bạn, copy dãy số ở phần **Id** (Ví dụ: `6800804130`).

### Bước 3: Thiết lập Google Sheets & Apps Script
1. Truy cập [Google Sheets](https://docs.google.com/spreadsheets/) và tạo một bảng tính mới (Blank).
2. Nhấn vào **Tiện ích mở rộng (Extensions)** > **Apps Script**.
3. Xoá toàn bộ code mẫu, copy toàn bộ nội dung trong file `Mã.gs` (của dự án này) dán vào.
4. Sửa 2 hằng số ở đầu file code:
   * `TOKEN`: Thay bằng API Token lấy ở Bước 1.
   * `CHAT_ID`: Thay bằng Chat ID lấy ở Bước 2.
5. Nhấn biểu tượng 💾 **Lưu (Save)**.

### Bước 4: Triển khai Webhook (Deploy)
1. Góc trên bên phải, nhấn **Deploy (Triển khai)** > **New deployment (Tùy chọn triển khai mới)**.
2. Nhấn biểu tượng bánh răng ⚙️, chọn **Web app**.
3. Cài đặt quyền truy cập:
   * **Execute as:** Me (Email của bạn).
   * **Who has access:** Anyone (Bất kỳ ai).
4. Nhấn **Deploy (Triển khai)**. (Google sẽ yêu cầu cấp quyền truy cập, bạn chọn *Advanced (Nâng cao)* > *Go to... (Đi tới...)* và Allow).
5. Copy đường link URL Web app (Bắt đầu bằng `https://script.google.com/macros/...`).
6. Quay lại code, dán link vừa copy vào hằng số `DEPLOYED_URL`.
7. **QUAN TRỌNG:** Phía trên thanh công cụ của Apps Script, chọn hàm `setWebhook` ở ô thả xuống, rồi bấm ▶️ **Chạy (Run)**.
8. Góc phải trên cùng, nhấn **Deploy** > **Manage deployments** > Chọn Bút chì (Edit) > Chọn **New version** > Nhấn **Deploy** lần cuối.

*Hoàn tất! Bây giờ bạn hãy vào Telegram chat `/start` với bot của mình.*

---

## 📖 Hướng dẫn Sử dụng (Các câu lệnh)

### 1. Ghi chép Thu / Chi
Bot ngầm hiểu các khoản có dấu `+` ở đầu là **Thu Nhập**, còn lại mặc định là **Chi Tiêu**.
*   `Cơm trưa 40k` -> Lưu vào Tab ChiTieu: 40.000 đ
*   `Đổ xăng 150 nghìn` -> Lưu vào Tab ChiTieu: 150.000 đ
*   `+ Lương 10m` -> Lưu vào Tab ThuNhap: 10.000.000 đ
*   `+ Mẹ cho 2 củ` -> Lưu vào Tab ThuNhap: 2.000.000 đ

### 2. Cài đặt Ngân sách
*   `/budget`: Xem ngân sách tháng hiện tại đang cài.
*   `/budget 15m`: Đặt lại ngân sách tháng là 15 triệu (Bot sẽ lưu ngầm, không hiện trên Google Sheet).

### 3. Sửa / Xoá dữ liệu
*   `/delete`: Xoá khoản **Chi tiêu** vừa nhập cuối cùng.
*   `/delete 10`: Xoá dòng số 10 bên Tab ChiTieu.
*   `/delete thu`: Xoá khoản **Thu nhập** vừa nhập cuối cùng.
*   `/edit Trà sữa 50k`: Sửa nội dung dòng chi tiêu cuối cùng thành "Trà sữa 50k".
*   `/edit + Lương 12m`: Sửa nội dung dòng thu nhập cuối cùng.

### 4. Báo cáo & Thống kê
*   `/report`: Xem báo cáo Tổng Thu, Tổng Chi của tháng hiện tại và Số dư ví. Liệt kê các giao dịch trong tháng.
*   `/report 15/05/2026`: Xem liệt kê chi tiết các khoản tiêu trong một ngày cụ thể và số dư ví tại thời điểm đó.
*   `/report 05/2026`: Xem liệt kê chi tiết các khoản thu/chi trong một tháng cụ thể.
*   `/recent`: Hiển thị nhanh 5 giao dịch vừa nhập gần nhất.
*   `/help` (hoặc `/start`): Mở lại bảng hướng dẫn các câu lệnh.

---

## ⚠️ Lưu ý khi sửa Code
Mỗi khi bạn chỉnh sửa bất kỳ dòng code nào trong Apps Script, bạn **BẮT BUỘC** phải Deploy lại phiên bản mới để Telegram nhận diện:
`Deploy` -> `Manage deployments` -> `Biểu tượng Bút chì (Edit)` -> Mục Version chọn `New version` -> `Deploy`.
