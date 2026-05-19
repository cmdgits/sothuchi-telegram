// Constants
const TOKEN = `<Bot TOKEN>`; 
const BASE_URL = `https://api.telegram.org/bot${TOKEN}`;
const CHAT_ID = '<CHAT_ID>';
const DEPLOYED_URL = '<Link URL>';

const METHODS = { SEND_MESSAGE: 'sendMessage', SET_WEBHOOK: 'setWebhook' }

// --- TỪ ĐIỂN DỊCH HASHTAG SANG TIẾNG VIỆT CÓ DẤU ---
// Bạn có thể tự thêm các danh mục của bạn vào đây
const CATEGORY_MAP = {
  "anuong": "Ăn uống",
  "dilai": "Đi lại",
  "nhacua": "Nhà cửa",
  "diennuoc": "Điện nước",
  "giaitri": "Giải trí",
  "muasam": "Mua sắm",
  "suckhoe": "Sức khoẻ",
  "hochanh": "Học hành",
  "luong": "Tiền lương",
  "khac": "Khác",
  "Khác": "Khác"
};

// Hàm phụ trợ để dịch hashtag
const getDisplayCategory = (rawCat) => {
  const cleanCat = rawCat.toLowerCase();
  // Nếu có trong từ điển thì lấy ra, nếu không có thì viết hoa chữ cái đầu
  return CATEGORY_MAP[cleanCat] || (rawCat.charAt(0).toUpperCase() + rawCat.slice(1));
}

// Utils
const toQueryParamsString = (obj) => Object.keys(obj).map(key => `${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`).join('&');
const formatVND = (amount) => amount.toLocaleString('vi-VN', {style : 'currency', currency : 'VND'});

// Telegram APIs
const makeRequest = async (method, queryParams = {}) => {
  const url = `${BASE_URL}/${method}?${toQueryParamsString(queryParams)}`
  const response = await UrlFetchApp.fetch(url);
  return response.getContentText();
}
const sendMessage = (text) => makeRequest(METHODS.SEND_MESSAGE, { chat_id: CHAT_ID, text })
const setWebhook = () => makeRequest(METHODS.SET_WEBHOOK,{ url: DEPLOYED_URL })

// --- BỘ NHỚ NGẦM ---
const getMonthlyBudget = () => {
  const scriptProperties = PropertiesService.getScriptProperties();
  const savedBudget = scriptProperties.getProperty('MONTHLY_BUDGET');
  return savedBudget ? Number(savedBudget) : 10000000; 
}

const setMonthlyBudget = (amount) => {
  const scriptProperties = PropertiesService.getScriptProperties();
  scriptProperties.setProperty('MONTHLY_BUDGET', amount.toString());
}

// --- QUẢN LÝ GOOGLE SHEET ---
const getSheet = (type) => {
  const sheetName = type === 'Thu' ? 'ThuNhap' : 'ChiTieu';
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) sheet = ss.insertSheet(sheetName);
  
  if (sheet.getLastRow() === 0) {
    const tenKhoan = type === 'Thu' ? "Tên Khoản Thu" : "Tên Khoản Chi";
    sheet.appendRow(["Thời gian", tenKhoan, "Số tiền (VND)", "Phân loại"]);
    sheet.getRange("A1:D1").setFontWeight("bold").setBackground("#e0e0e0");
  } else {
    if (sheet.getRange("D1").getValue() === "") {
        sheet.getRange("D1").setValue("Phân loại").setFontWeight("bold").setBackground("#e0e0e0");
    }
  }
  return sheet;
}

const getActualLastRow = (sheet) => {
  const data = sheet.getRange("A:A").getValues();
  for (let i = data.length - 1; i >= 0; i--) {
    if (data[i][0] !== "" && data[i][0] !== null) return i + 1;
  }
  return 1; 
}

const addNewRow = (data) => {
  const sheet = getSheet(data[3]); 
  const lastRow = getActualLastRow(sheet); 
  sheet.getRange(lastRow + 1, 1, 1, 4).setValues([[data[0], data[1], data[2], data[4]]]); 
}

const deleteRow = (type, rowNumber = null) => {
  const sheet = getSheet(type);
  const lastRow = getActualLastRow(sheet); 
  
  if (rowNumber !== null) {
    if (rowNumber > 1 && rowNumber <= lastRow) {
      sheet.deleteRow(rowNumber);
      return true;
    }
  } else {
    if (lastRow > 1) { 
      sheet.deleteRow(lastRow);
      return true;
    }
  }
  return false;
}

const editLastRow = (data) => {
  const sheet = getSheet(data[3]);
  const lastRow = getActualLastRow(sheet); 
  
  if (lastRow > 1) {
    sheet.getRange(lastRow, 1, 1, 4).setValues([[data[0], data[1], data[2], data[4]]]);
    return true;
  }
  return false;
}

// Bóc tách dữ liệu
const getMultiplyBase = (unitLabel) => {
  switch (unitLabel.toLowerCase()) {
    case 'k': case 'nghìn': case 'ng': case 'ngàn': return 1000;
    case 'lít': case 'lit': case 'l': return 100000;
    case 'củ': case 'tr': case 'm': return 1000000;
    default: return 1;
  }
};

const parseTransactionData = (text) => {
  let type = "Chi";
  if (text.startsWith('+')) {
    type = "Thu";
    text = text.substring(1).trim(); 
  }
  
  let category = "Khác"; 
  const hashtagMatch = text.match(/#([\wÀ-ỹ]+)/); 
  
  if (hashtagMatch) {
    category = hashtagMatch[1]; 
    text = text.replace(/#([\wÀ-ỹ]+)/, '').trim(); 
  }
  
  const match = text.match(/^(.*?)\s*(\d+)\s*([a-zA-ZÀ-ỹ]*)$/);
  if (!match) throw new Error("⚠️ Sai cú pháp! Vui lòng nhập câu có chứa số tiền ở cuối (VD: Cà phê 30k #anuong)");

  const label = match[1].trim();       
  const priceText = match[2];          
  const unitLabel = match[3].trim();   
  
  let multiplyBase = getMultiplyBase(unitLabel);
  const unitLower = unitLabel.toLowerCase();
  
  if (priceText.length >= 6 && (unitLower === 'k' || unitLower === 'nghìn' || unitLower === 'ngàn' || unitLower === 'ng')) {
    multiplyBase = 1; 
  }
  
  const time = Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss");
  const price = Number(priceText) * multiplyBase;
  
  return [time, label, price, type, category]; 
}

const parseDateString = (input) => {
  if (!input) return new Date(0);
  if (input instanceof Date) return input;
  if (typeof input === 'string') {
    const parts = input.split(' ');
    if (parts.length !== 2) return new Date(0);
    const d = parts[0].split('/');
    const t = parts[1].split(':');
    return new Date(d[2], d[1]-1, d[0], t[0], t[1], t[2]);
  }
  return new Date(0);
}

const getFormattedDateString = (sheetDateValue) => {
  if (sheetDateValue instanceof Date) {
      return Utilities.formatDate(sheetDateValue, "GMT+7", "dd/MM/yyyy HH:mm:ss");
  }
  return sheetDateValue.toString();
}

// Lấy Báo Cáo
const getReports = (searchQuery = null) => {
  let totalChi = 0, totalThu = 0;
  let searchTotalChi = 0, searchTotalThu = 0;
  let currentMonthChi = 0; 
  const currentMonthStr = Utilities.formatDate(new Date(), "GMT+7", "MM/yyyy");
  
  let combinedData = [];
  let searchResults = []; 
  let categoryBreakdown = {}; 

  const sheetChi = getSheet('Chi');
  const dataChi = sheetChi.getDataRange().getValues();
  for (let i = 1; i < dataChi.length; i++) { 
    if (!dataChi[i][0]) continue;
    const price = Number(dataChi[i][2]) || 0;
    const dateStr = getFormattedDateString(dataChi[i][0]);
    const cat = dataChi[i][3] || "Khác"; 
    
    totalChi += price;
    if (dateStr.includes(currentMonthStr)) currentMonthChi += price;
    
    if (searchQuery && dateStr.includes(searchQuery)) {
        searchTotalChi += price;
        searchResults.push([...dataChi[i], 'Chi']);
        categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + price;
    }
    combinedData.push([...dataChi[i], 'Chi']);
  }

  const sheetThu = getSheet('Thu');
  const dataThu = sheetThu.getDataRange().getValues();
  for (let i = 1; i < dataThu.length; i++) {
    if (!dataThu[i][0]) continue;
    const price = Number(dataThu[i][2]) || 0;
    const dateStr = getFormattedDateString(dataThu[i][0]);
    totalThu += price;
    if (searchQuery && dateStr.includes(searchQuery)) {
        searchTotalThu += price;
        searchResults.push([...dataThu[i], 'Thu']); 
    }
    combinedData.push([...dataThu[i], 'Thu']);
  }
  
  combinedData.sort((a,b) => parseDateString(a[0]) - parseDateString(b[0]));
  searchResults.sort((a,b) => parseDateString(a[0]) - parseDateString(b[0]));
  const balance = totalThu - totalChi; 
  
  return { balance, totalThu, totalChi, combinedData, currentMonthChi, searchTotalChi, searchTotalThu, searchResults, categoryBreakdown };
}

// Webhooks
const doPost = (request) => {
  try {
    const contents = JSON.parse(request.postData.contents);
    if (!contents.message || !contents.message.text) return;
    
    const text = contents.message.text.trim();
    const textLower = text.toLowerCase();
    
    if (textLower === '/help' || textLower === '/start') {
      let msg = `🤖 HƯỚNG DẪN BOT THU CHI:\n\n`;
      msg += `📝 GHI CHÉP (Có Hashtag):\n➖ Chi tiêu: Cà phê 30k #anuong\n➖ Đổ xăng 50k #dilai\n➕ Thu nhập: + Lương 10m\n\n`;
      msg += `⚙️ NGÂN SÁCH:\n➖ /budget: Xem ngân sách\n➖ /budget [số]: Đặt ngân sách\n\n`;
      msg += `🛠 SỬA / XOÁ:\n➖ /delete: Xoá chi tiêu\n➖ /delete thu: Xoá thu nhập\n➖ /edit [nội dung]: Sửa dòng cuối\n\n`;
      msg += `📊 BÁO CÁO:\n➖ /report: Xem tháng này\n➖ /report [Ngày/Tháng]: (VD: /report 05/2026)\n➖ /recent: 5 GD gần nhất`;
      return sendMessage(msg);
    }

    if (textLower.startsWith('/budget')) {
      const parts = textLower.split(' ');
      if (parts.length > 1) {
        const input = textLower.replace('/budget', '').trim();
        const regex = /(\d+)\s*(.*)/g;
        const newBudget = Number(input.replace(regex, '$1')) * getMultiplyBase(input.replace(regex, '$2').trim());
        if (newBudget > 0) {
          setMonthlyBudget(newBudget); 
          sendMessage(`✅ Ngân sách tháng: ${formatVND(newBudget)}`);
        } else { sendMessage(`⚠ Số tiền không hợp lệ!`); }
      } else { sendMessage(`💡 Ngân sách tháng hiện tại: ${formatVND(getMonthlyBudget())}`); }
      return;
    }

    if (textLower.startsWith('/report') || textLower.startsWith('/baocao')) {
      const parts = text.split(' ');
      const searchQuery = parts.length === 1 ? Utilities.formatDate(new Date(), "GMT+7", "MM/yyyy") : parts[1].trim(); 
      const r = getReports(searchQuery);
      let msg = ``;
      
      if (searchQuery.split('/').length === 3) {
          msg += `📅 NGÀY: ${searchQuery}\n🏦 Số dư ví: ${formatVND(r.balance)}\n💸 TỔNG CHI: ${formatVND(r.searchTotalChi)}\n──────────────\n`;
          const chiList = r.searchResults.filter(row => row[3] === 'Chi');
          if (chiList.length === 0) { msg += `Không có khoản chi nào trong ngày này.`; } 
          else {
             chiList.forEach(row => {
                const timeOnly = getFormattedDateString(row[0]).split(' ')[1].substring(0, 5); 
                // Sử dụng hàm getDisplayCategory để hiển thị tên đẹp
                const displayCat = getDisplayCategory(row[4]);
                msg += `${timeOnly} 🔴 [${displayCat}] ${row[1]}: ${formatVND(Number(row[2]))}\n`;
            });
          }
      } else {
          if (r.searchResults.length === 0) return sendMessage(`🔎 Không có giao dịch nào trong tháng: ${searchQuery}`);
          msg += `📊 TỔNG KẾT THÁNG: ${searchQuery}\n💰 Tổng Thu: ${formatVND(r.searchTotalThu)}\n💳 Tổng Chi: ${formatVND(r.searchTotalChi)}\n🏦 Số dư ví: ${formatVND(r.balance)}\n──────────────\n`;
          
          if (Object.keys(r.categoryBreakdown).length > 0) {
             msg += `🏷 PHÂN LOẠI CHI TIÊU:\n`;
             for (const [cat, amount] of Object.entries(r.categoryBreakdown)) {
                 // Dịch chữ hashtag sang Tiếng Việt có dấu, không còn dấu #
                 const displayCat = getDisplayCategory(cat);
                 msg += `▫️ ${displayCat}: ${formatVND(amount)}\n`;
             }
             msg += `──────────────\n`;
          }

          msg += `📋 CHI TIẾT GIAO DỊCH:\n`;
          r.searchResults.forEach(row => {
              const typeIcon = row[3] === "Thu" ? "🟢" : "🔴";
              const dateParts = getFormattedDateString(row[0]).split(' ');
              const displayCat = getDisplayCategory(row[4]); // Dịch hashtag
              const catTag = row[3] === "Chi" ? `[${displayCat}] ` : "";
              msg += `${dateParts[0].substring(0, 5)} ${dateParts[1].substring(0, 5)} ${typeIcon} ${catTag}${row[1]}: ${formatVND(Number(row[2]))}\n`;
          });
      }
      return sendMessage(msg);
    }
    
    if (textLower === '/recent') {
      const data = getReports().combinedData.slice(-5); 
      let msg = `🕒 5 GIAO DỊCH GẦN NHẤT:\n\n`;
      if(data.length === 0) return sendMessage("Chưa có giao dịch nào!");
      data.forEach(row => {
        const displayCat = getDisplayCategory(row[4]); // Dịch hashtag
        const catTag = row[3] === "Chi" ? `[${displayCat}] ` : "";
        msg += `${row[3] === "Thu" ? "🟢" : "🔴"} ${catTag}${row[1]}: ${formatVND(Number(row[2]))}\n`
      });
      return sendMessage(msg);
    }

    if (textLower.startsWith('/delete')) {
      const parts = textLower.split(' ');
      let typeToDel = 'Chi', rowToDel = null;
      if (parts.length > 1) {
        if (parts[1] === 'thu') { typeToDel = 'Thu'; if (parts[2]) rowToDel = parseInt(parts[2]); } 
        else rowToDel = parseInt(parts[1]); 
      }
      const success = deleteRow(typeToDel, rowToDel);
      SpreadsheetApp.flush(); 
      return sendMessage(success ? `🗑 Đã xoá thành công.` : `⚠ Không có dữ liệu để xoá!`);
    } 
    
    if (textLower.startsWith('/edit ')) {
      const data = parseTransactionData(text.substring(6).trim()); 
      const success = editLastRow(data);
      SpreadsheetApp.flush();
      const displayCat = getDisplayCategory(data[4]);
      return sendMessage(success ? `✏️ Đã sửa thành:\n[${displayCat}] ${data[1]} (${formatVND(data[2])})` : `⚠ Không có dữ liệu để sửa!`);
    } 
    
    const data = parseTransactionData(text);
    addNewRow(data); 
    SpreadsheetApp.flush();
    
    const reports = getReports();
    const displayCat = getDisplayCategory(data[4]); // Dịch hashtag
    let msg = `✅ Đã lưu: [${displayCat}] ${data[1]} (${formatVND(data[2])})`;
    if (data[3] === "Chi") {
      const currentBudget = getMonthlyBudget(); 
      const percent = Math.round((reports.currentMonthChi / currentBudget) * 100);
      if (reports.currentMonthChi > currentBudget) msg += `\n🚨 VƯỢT HẠN MỨC: Tiêu lố ${formatVND(reports.currentMonthChi - currentBudget)}!`;
      else if (percent >= 80) msg += `\n⚠️ CHÚ Ý: Đã dùng ${percent}% ngân sách!`;
    }
    sendMessage(msg);
  } catch (error) { sendMessage(`❌ Bot gặp lỗi: ${error.message}`); }
}
