# Bot Sổ Thu Chi Telegram + Google Sheets

Dự án này là một bot Telegram viết bằng Google Apps Script để ghi chép thu nhập, chi tiêu, quản lý ngân sách tháng, xem báo cáo và tạo biểu đồ thống kê từ dữ liệu lưu trong Google Sheets.

## Tính năng chính

- Ghi chi tiêu nhanh qua Telegram.
- Ghi thu nhập nhanh qua Telegram.
- Tự lưu dữ liệu vào Google Sheets.
- Tự tạo 2 sheet dữ liệu:
  - `ChiTieu`: lưu các khoản chi.
  - `ThuNhap`: lưu các khoản thu.
- Hỗ trợ phân loại giao dịch bằng hashtag.
- Xem 5 giao dịch gần nhất.
- Sửa giao dịch cuối cùng.
- Xóa giao dịch cuối cùng hoặc xóa theo dòng.
- Đặt ngân sách tháng bằng `/budget`.
- Tự cảnh báo khi chi tiêu tháng vượt ngân sách.
- Xem báo cáo theo ngày, tháng, năm.
- Với báo cáo ngày, bot hiển thị chi tiết từng khoản thu/chi đã dùng.
- Tạo biểu đồ thu/chi và biểu đồ chi tiêu theo danh mục bằng QuickChart.

## Công nghệ sử dụng

- Google Apps Script.
- Google Sheets.
- Telegram Bot API.
- QuickChart API.

## Cấu trúc dữ liệu Google Sheets

Bot tự tạo sheet nếu chưa có.

### Sheet `ChiTieu`

| Cột | Nội dung |
| --- | --- |
| A | Thời gian |
| B | Tên Khoản Chi |
| C | Số tiền (VND) |
| D | Phân loại |

### Sheet `ThuNhap`

| Cột | Nội dung |
| --- | --- |
| A | Thời gian |
| B | Tên Khoản Thu |
| C | Số tiền (VND) |
| D | Phân loại |

## Cấu hình cần sửa

Trong file `sothuchi.js`, kiểm tra các hằng số đầu file:

```js
const TOKEN = `TELEGRAM_BOT_TOKEN`;
const CHAT_ID = 'TELEGRAM_CHAT_ID';
const DEPLOYED_URL = 'GOOGLE_APPS_SCRIPT_WEB_APP_URL';
```

Ý nghĩa:

- `TOKEN`: token bot lấy từ BotFather.
- `CHAT_ID`: ID Telegram nhận thông báo.
- `DEPLOYED_URL`: URL Web App sau khi deploy Google Apps Script.

> Khuyến nghị: không public file có chứa `TOKEN`, vì ai có token có thể điều khiển bot của bạn.

## Cách deploy Google Apps Script

1. Tạo một Google Sheet mới.
2. Vào `Extensions` → `Apps Script`.
3. Xóa nội dung mặc định trong file script.
4. Copy toàn bộ nội dung `sothuchi.js` vào Apps Script.
5. Sửa `TOKEN`, `CHAT_ID`, `DEPLOYED_URL`.
6. Bấm `Deploy` → `New deployment`.
7. Chọn loại deploy là `Web app`.
8. Thiết lập:
   - `Execute as`: `Me`.
   - `Who has access`: `Anyone`.
9. Bấm `Deploy` và cấp quyền.
10. Copy URL Web App vừa tạo và dán lại vào `DEPLOYED_URL`.
11. Chạy thủ công hàm `setWebhook()` một lần trong Apps Script.
12. Mở Telegram và nhắn `/help` cho bot để kiểm tra.

## Cú pháp ghi giao dịch

### Ghi chi tiêu

Mặc định, tin nhắn không có dấu `+` sẽ được hiểu là khoản chi.

```text
Cà phê 30k #anuong
Đổ xăng 50k #dilai
Ăn tối 5tr5 #anuong
Mua đồ 550k #muasam
```

Kết quả ví dụ:

```text
✅ Đã lưu:
🔴 Chi [Ăn uống] Cà phê: 30.000 ₫
```

### Ghi thu nhập

Tin nhắn bắt đầu bằng dấu `+` sẽ được hiểu là khoản thu.

```text
+ Lương 10m #luong
+ Thưởng 2tr5 #khac
+ Bán đồ cũ 500k #khac
```

Kết quả ví dụ:

```text
✅ Đã lưu:
🟢 Thu [Tiền lương] Lương: 10.000.000 ₫
```

## Cách nhập số tiền

Bot hỗ trợ nhiều kiểu viết số tiền.

| Cách nhập | Giá trị hiểu được |
| --- | ---: |
| `30k` | 30.000đ |
| `500k` | 500.000đ |
| `5tr` | 5.000.000đ |
| `5m` | 5.000.000đ |
| `5tr5` | 5.500.000đ |
| `5M5` | 5.500.000đ |
| `5.5m` | 5.500.000đ |
| `5500k` | 5.500.000đ |
| `5tr500` | 5.500.000đ |
| `1000000` | 1.000.000đ |

Ghi chú:

- `k`, `nghìn`, `ngàn`: nhân 1.000.
- `tr`, `m`, `triệu`, `củ`: nhân 1.000.000.
- `l`, `lít`: nhân 100.000.

## Danh mục phân loại

Bạn có thể thêm hashtag ở cuối tin nhắn để phân loại giao dịch.

| Hashtag | Hiển thị |
| --- | --- |
| `#anuong` | Ăn uống |
| `#dilai` | Đi lại |
| `#nhacua` | Nhà cửa |
| `#diennuoc` | Điện nước |
| `#giaitri` | Giải trí |
| `#muasam` | Mua sắm |
| `#suckhoe` | Sức khỏe |
| `#hochanh` | Học hành |
| `#luong` | Tiền lương |
| `#khac` | Khác |

Nếu không nhập hashtag, bot mặc định phân loại là `Khác`.

## Lệnh hỗ trợ

### `/help`

Hiển thị hướng dẫn sử dụng bot.

```text
/help
/start
```

### `/recent`

Xem 5 giao dịch gần nhất.

```text
/recent
```

Ví dụ kết quả:

```text
🕒 5 GIAO DỊCH GẦN NHẤT:

19/05/2026 08:10:00 🔴 Chi [Ăn uống] Cà phê: 30.000 ₫
19/05/2026 12:30:00 🔴 Chi [Đi lại] Đổ xăng: 50.000 ₫
19/05/2026 18:00:00 🟢 Thu [Tiền lương] Lương: 10.000.000 ₫
```

## Ngân sách tháng

### Xem ngân sách hiện tại

```text
/budget
```

Ví dụ:

```text
💡 Ngân sách tháng hiện tại: 5.500.000 ₫
```

### Đặt ngân sách tháng

```text
/budget 5tr5
/budget 5M5
/budget 5.5m
/budget 5500k
```

Ví dụ kết quả:

```text
✅ Ngân sách tháng đã đặt: 5.500.000 ₫
```

Nếu tổng chi tháng hiện tại vượt ngân sách, bot sẽ cảnh báo:

```text
🚨 VƯỢT NGÂN SÁCH THÁNG: Đã tiêu quá 250.000 ₫!
```

Khi bạn thêm một khoản chi mới, bot cũng tự kiểm tra tổng chi trong tháng. Nếu vượt ngân sách, bot sẽ gửi cảnh báo ngay sau khi lưu giao dịch.

## Báo cáo thu chi

### Báo cáo hôm nay

```text
/report
/baocao
```

Bot mặc định báo cáo ngày hôm nay.

Ví dụ kết quả:

```text
📅 BÁO CÁO HÔM NAY - 19/05/2026
──────────────
🟢 Thu hôm nay: 10.000.000 ₫
🔴 Chi hôm nay: 580.000 ₫
🏦 Số dư ví: 9.420.000 ₫
──────────────
🔴 PHÂN LOẠI CHI:
🔴 Ăn uống: 530.000 ₫
🔴 Đi lại: 50.000 ₫
──────────────
🟢 CHI TIẾT KHOẢN THU:
18:00 🟢 [Tiền lương] Lương: 10.000.000 ₫
──────────────
🔴 CHI TIẾT KHOẢN CHI:
08:10 🔴 [Ăn uống] Cà phê: 30.000 ₫
12:30 🔴 [Đi lại] Đổ xăng: 50.000 ₫
19:20 🔴 [Ăn uống] Ăn tối: 500.000 ₫
```

### Báo cáo theo ngày

```text
/report 19/05/2026
/baocao 19/05/2026
```

Báo cáo theo ngày cũng hiển thị chi tiết từng khoản thu/chi giống `/report`.

### Báo cáo theo tháng

```text
/report 05/2026
/baocao 05/2026
```

Ví dụ:

```text
📊 BÁO CÁO THÁNG 05/2026
──────────────
🟢 Thu tháng 05/2026: 15.000.000 ₫
🔴 Chi tháng 05/2026: 6.200.000 ₫
🏦 Số dư tháng 05/2026: 8.800.000 ₫
──────────────
🟢 PHÂN LOẠI THU:
🟢 Tiền lương: 15.000.000 ₫
──────────────
🔴 PHÂN LOẠI CHI:
🔴 Ăn uống: 2.500.000 ₫
🔴 Đi lại: 800.000 ₫
🔴 Mua sắm: 2.900.000 ₫
```

Lưu ý: báo cáo tháng chỉ hiển thị tổng và phân loại, không liệt kê chi tiết từng giao dịch để tránh tin nhắn quá dài.

### Báo cáo theo năm

```text
/report 2026
/baocao 2026
```

Báo cáo năm hiển thị tổng thu, tổng chi, số dư và phân loại thu/chi trong năm.

## Biểu đồ

Bot dùng QuickChart để tạo ảnh biểu đồ và gửi lại Telegram.

### Biểu đồ hôm nay

```text
/chart
/bieudo
```

Bot sẽ gửi 2 ảnh nếu có đủ dữ liệu:

1. Biểu đồ cột so sánh tổng thu và tổng chi.
2. Biểu đồ tròn phân bổ chi tiêu theo danh mục.

Ví dụ caption biểu đồ cột:

```text
📊 THU / CHI HÔM NAY - 19/05/2026
🟢 Thu hôm nay: 10.000.000 ₫
🔴 Chi hôm nay: 580.000 ₫
🏦 Số dư ví: 9.420.000 ₫
```

Ví dụ caption biểu đồ tròn:

```text
🥧 CHI TIÊU THEO DANH MỤC HÔM NAY - 19/05/2026
🔴 Chi hôm nay: 580.000 ₫
🏦 Số dư ví: 9.420.000 ₫
Nhập /report 19/05/2026 để xem chi tiết.
🔎 ĐÃ CHI THEO DANH MỤC:
🔴 Ăn uống: 530.000 ₫ (91.4%)
🔴 Đi lại: 50.000 ₫ (8.6%)
```

### Biểu đồ theo ngày

```text
/chart 19/05/2026
/bieudo 19/05/2026
```

Dùng để xem biểu đồ thu/chi và biểu đồ danh mục chi trong một ngày cụ thể.

### Biểu đồ theo tháng

```text
/chart 05/2026
/bieudo 05/2026
```

Ví dụ caption:

```text
📊 THU / CHI THÁNG 05/2026
🟢 Thu tháng 05/2026: 15.000.000 ₫
🔴 Chi tháng 05/2026: 6.200.000 ₫
🏦 Số dư tháng 05/2026: 8.800.000 ₫
```

Ví dụ biểu đồ tròn theo tháng:

```text
🥧 CHI TIÊU THEO DANH MỤC THÁNG 05/2026
🔴 Chi tháng 05/2026: 6.200.000 ₫
🏦 Số dư tháng 05/2026: 8.800.000 ₫
Nhập /report 05/2026 để xem chi tiết.
🔎 ĐÃ CHI THEO DANH MỤC:
🔴 Mua sắm: 2.900.000 ₫ (46.8%)
🔴 Ăn uống: 2.500.000 ₫ (40.3%)
🔴 Đi lại: 800.000 ₫ (12.9%)
```

### Biểu đồ theo năm

```text
/chart 2026
/bieudo 2026
```

Hiển thị biểu đồ thu/chi và biểu đồ phân bổ chi tiêu theo danh mục trong năm.

## Sửa giao dịch

### Sửa giao dịch cuối cùng

```text
/edit Nội dung mới
```

Ví dụ:

```text
/edit Cà phê 35k #anuong
/edit + Lương 12m #luong
```

Bot sẽ sửa dòng cuối cùng trong sheet tương ứng với loại giao dịch.

Ví dụ kết quả:

```text
✏️ Đã sửa thành:
🔴 Chi [Ăn uống] Cà phê: 35.000 ₫
```

## Xóa giao dịch

### Xóa khoản chi cuối cùng

```text
/delete
```

### Xóa khoản thu cuối cùng

```text
/delete thu
```

### Xóa dòng cụ thể trong sheet chi tiêu

```text
/delete 5
```

Lệnh này xóa dòng số 5 trong sheet `ChiTieu`.

### Xóa dòng cụ thể trong sheet thu nhập

```text
/delete thu 5
```

Lệnh này xóa dòng số 5 trong sheet `ThuNhap`.

## Định dạng ngày tháng

Bot hỗ trợ các định dạng sau:

| Mục đích | Định dạng | Ví dụ |
| --- | --- | --- |
| Theo ngày | `dd/MM/yyyy` | `19/05/2026` |
| Theo tháng | `MM/yyyy` | `05/2026` |
| Theo năm | `yyyy` | `2026` |

Ví dụ:

```text
/report 19/05/2026
/report 05/2026
/report 2026
/chart 19/05/2026
/chart 05/2026
/chart 2026
```

## Ví dụ sử dụng nhanh

Một luồng sử dụng thường ngày:

```text
/budget 5tr5
Cà phê 30k #anuong
Đổ xăng 50k #dilai
Ăn tối 5tr5 #anuong
+ Lương 10m #luong
/report
/chart
/recent
```

Kết quả mong đợi:

- Bot lưu từng giao dịch vào Google Sheets.
- Bot cảnh báo nếu tổng chi tháng vượt 5.500.000đ.
- `/report` hiển thị tổng thu, tổng chi, số dư, phân loại và chi tiết giao dịch hôm nay.
- `/chart` gửi biểu đồ cột thu/chi và biểu đồ tròn chi theo danh mục.
- `/recent` hiển thị 5 giao dịch gần nhất.

## Xử lý lỗi thường gặp

### Bot không phản hồi

Kiểm tra các mục sau:

1. Đã deploy Web App chưa.
2. `DEPLOYED_URL` có đúng URL Web App mới nhất không.
3. Đã chạy `setWebhook()` sau khi cập nhật `DEPLOYED_URL` chưa.
4. `TOKEN` có đúng token BotFather không.
5. `CHAT_ID` có đúng chat ID không.
6. Web App có quyền `Anyone` không.
7. Vào Apps Script → `Executions` để xem lỗi chi tiết.

### Lỗi `Limit Exceeded: URLFetch URL length`

Lỗi này xảy ra khi gửi tin nhắn Telegram bằng GET và nội dung quá dài. Code hiện đã dùng POST cho `sendMessage`, nên nếu gặp lỗi này hãy chắc chắn bạn đã deploy bản code mới nhất.

### `/report` không hiển thị chi tiết giao dịch

Kiểm tra:

- Giao dịch có đúng ngày hôm nay không.
- Thời gian trong sheet có định dạng `dd/MM/yyyy HH:mm:ss` không.
- Bạn đang dùng `/report` hoặc `/report dd/MM/yyyy`; báo cáo tháng/năm không liệt kê chi tiết từng giao dịch.

### Lỗi font tiếng Việt

Nếu Apps Script hiển thị lỗi font:

1. Mở file `sothuchi.js` bằng editor hỗ trợ UTF-8.
2. Copy toàn bộ nội dung.
3. Tạo file mới trong Apps Script.
4. Paste lại code vào file mới.
5. Lưu và deploy lại.

## Ghi chú bảo mật

- Không chia sẻ công khai `TOKEN` Telegram bot.
- Không public Google Sheet nếu có dữ liệu cá nhân.
- Nếu token bị lộ, vào BotFather tạo token mới.
- Nên cân nhắc chuyển `TOKEN`, `CHAT_ID`, `DEPLOYED_URL` sang `PropertiesService` thay vì hard-code trong file.

## File chính

- `sothuchi.js`: toàn bộ mã nguồn bot.
- `README.md`: hướng dẫn sử dụng và deploy.
