// Constants
const TOKEN = ``;
const BASE_URL = `https://api.telegram.org/bot${TOKEN}`;
const CHAT_ID = '';
const DEPLOYED_URL = '';

const METHODS = {
  SEND_MESSAGE: 'sendMessage',
  SET_WEBHOOK: 'setWebhook',
  SEND_PHOTO: 'sendPhoto'
};

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

const getDisplayCategory = (rawCat) => {
  if (!rawCat) return "Khác";
  const cleanCat = rawCat.toString().toLowerCase();
  return CATEGORY_MAP[cleanCat] || (rawCat.charAt(0).toUpperCase() + rawCat.slice(1));
};

// Utils
const toQueryParamsString = (obj) =>
  Object.keys(obj)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`)
    .join('&');

const formatVND = (amount) =>
  Number(amount || 0).toLocaleString('vi-VN', {
    style: 'currency',
    currency: 'VND'
  });

const getTodayStr = () => Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy");
const getCurrentMonthStr = () => Utilities.formatDate(new Date(), "GMT+7", "MM/yyyy");
const getCurrentYearStr = () => Utilities.formatDate(new Date(), "GMT+7", "yyyy");

const getPeriodType = (query) => {
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(query)) return "day";
  if (/^\d{2}\/\d{4}$/.test(query)) return "month";
  if (/^\d{4}$/.test(query)) return "year";
  return "invalid";
};

const getPeriodLabel = (query) => {
  const type = getPeriodType(query);

  if (type === "day") {
    if (query === getTodayStr()) return `HÔM NAY - ${query}`;
    return `NGÀY ${query}`;
  }

  if (type === "month") {
    if (query === getCurrentMonthStr()) return `THÁNG NÀY - ${query}`;
    return `THÁNG ${query}`;
  }

  if (type === "year") {
    if (query === getCurrentYearStr()) return `NĂM NAY - ${query}`;
    return `NĂM ${query}`;
  }

  return query;
};

const getThuLabel = (query) => {
  const type = getPeriodType(query);

  if (type === "day") {
    return query === getTodayStr() ? "Thu hôm nay" : `Thu ngày ${query}`;
  }

  if (type === "month") {
    return query === getCurrentMonthStr() ? "Thu tháng này" : `Thu tháng ${query}`;
  }

  if (type === "year") {
    return query === getCurrentYearStr() ? "Thu năm nay" : `Thu năm ${query}`;
  }

  return "Tổng thu";
};

const getChiLabel = (query) => {
  const type = getPeriodType(query);

  if (type === "day") {
    return query === getTodayStr() ? "Chi hôm nay" : `Chi ngày ${query}`;
  }

  if (type === "month") {
    return query === getCurrentMonthStr() ? "Chi tháng này" : `Chi tháng ${query}`;
  }

  if (type === "year") {
    return query === getCurrentYearStr() ? "Chi năm nay" : `Chi năm ${query}`;
  }

  return "Tổng chi";
};

const getBalanceLabel = (query) => {
  const type = getPeriodType(query);

  if (type === "day") {
    return "Số dư ví";
  }

  if (type === "month") {
    return query === getCurrentMonthStr() ? "Số dư tháng này" : `Số dư tháng ${query}`;
  }

  if (type === "year") {
    return query === getCurrentYearStr() ? "Số dư năm nay" : `Số dư năm ${query}`;
  }

  return "Số dư";
};

const getMonthQueryFromDay = (dayQuery) => {
  const parts = dayQuery.split('/');

  if (parts.length !== 3) {
    return "";
  }

  return `${parts[1]}/${parts[2]}`;
};

const getDayQueryEndDate = (dayQuery) => {
  const parts = dayQuery.split('/');

  if (parts.length !== 3) {
    return new Date(0);
  }

  return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]), 23, 59, 59, 999);
};

// Telegram APIs
const makeRequest = (method, queryParams = {}) => {
  const url = `${BASE_URL}/${method}?${toQueryParamsString(queryParams)}`;
  const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  return response.getContentText();
};

const sendMessage = (text) => {
  const response = UrlFetchApp.fetch(`${BASE_URL}/${METHODS.SEND_MESSAGE}`, {
    method: 'post',
    payload: {
      chat_id: CHAT_ID,
      text
    },
    muteHttpExceptions: true
  });

  return response.getContentText();
};

const sendLongMessage = (text) => {
  const maxLength = 3800;

  if (text.length <= maxLength) {
    return sendMessage(text);
  }

  const lines = text.split('\n');
  let chunk = '';

  lines.forEach(line => {
    const nextChunk = chunk ? `${chunk}\n${line}` : line;

    if (nextChunk.length > maxLength) {
      sendMessage(chunk);
      chunk = line;
    } else {
      chunk = nextChunk;
    }
  });

  if (chunk) {
    return sendMessage(chunk);
  }
};

const setWebhook = () =>
  makeRequest(METHODS.SET_WEBHOOK, {
    url: DEPLOYED_URL
  });

const sendPhoto = (photoUrl, caption) => {
  const response = UrlFetchApp.fetch(`${BASE_URL}/${METHODS.SEND_PHOTO}`, {
    method: 'post',
    payload: {
      chat_id: CHAT_ID,
      photo: photoUrl,
      caption: caption
    },
    muteHttpExceptions: true
  });

  return response.getContentText();
};

// --- BỘ NHỚ NGẦM ---
const getMonthlyBudget = () => {
  const scriptProperties = PropertiesService.getScriptProperties();
  const savedBudget = scriptProperties.getProperty('MONTHLY_BUDGET');
  return savedBudget ? Number(savedBudget) : 10000000;
};

const setMonthlyBudget = (amount) => {
  const scriptProperties = PropertiesService.getScriptProperties();
  scriptProperties.setProperty('MONTHLY_BUDGET', amount.toString());
};

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
};

const getActualLastRow = (sheet) => {
  const data = sheet.getRange("A:A").getValues();

  for (let i = data.length - 1; i >= 0; i--) {
    if (data[i][0] !== "" && data[i][0] !== null) return i + 1;
  }

  return 1;
};

const addNewRow = (data) => {
  const sheet = getSheet(data[3]);
  const lastRow = getActualLastRow(sheet);
  sheet.getRange(lastRow + 1, 1, 1, 4).setValues([[data[0], data[1], data[2], data[4]]]);
};

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
};

const editLastRow = (data) => {
  const sheet = getSheet(data[3]);
  const lastRow = getActualLastRow(sheet);

  if (lastRow > 1) {
    sheet.getRange(lastRow, 1, 1, 4).setValues([[data[0], data[1], data[2], data[4]]]);
    return true;
  }

  return false;
};

// Bóc tách dữ liệu
const getMultiplyBase = (unitLabel) => {
  switch (unitLabel.toLowerCase()) {
    case 'k':
    case 'nghìn':
    case 'ng':
    case 'ngàn':
      return 1000;

    case 'lít':
    case 'lit':
    case 'l':
      return 100000;

    case 'củ':
    case 'tr':
    case 'm':
      return 1000000;

    default:
      return 1;
  }
};

const normalizeAmountText = (value) => value
  .toString()
  .toLowerCase()
  .replace(/,/g, '.')
  .replace(/\s+/g, '')
  .replace(/tri\u1ec7u|trieu/g, 'tr')
  .replace(/ngh\u00ecn|ng\u00e0n|nghin|ngan/g, 'k')
  .replace(/c\u1ee7|cu/g, 'tr');

const getMixedAmountTail = (tailText, base) => {
  if (tailText.includes('.')) {
    return Number(`0.${tailText.replace('.', '')}`) * base;
  }

  return Number(tailText) * (base / Math.pow(10, tailText.length));
};

const parseAmount = (value) => {
  const amountText = normalizeAmountText(value);

  if (!amountText) return 0;

  const mixedMillionMatch = amountText.match(/^(\d+(?:\.\d+)?)(tr|m)(\d+(?:\.\d+)?)$/);
  if (mixedMillionMatch) {
    return Math.round(
      Number(mixedMillionMatch[1]) * 1000000 + getMixedAmountTail(mixedMillionMatch[3], 1000000)
    );
  }

  const mixedThousandMatch = amountText.match(/^(\d+(?:\.\d+)?)(k)(\d+(?:\.\d+)?)$/);
  if (mixedThousandMatch) {
    return Math.round(
      Number(mixedThousandMatch[1]) * 1000 + getMixedAmountTail(mixedThousandMatch[3], 1000)
    );
  }

  const amountMatch = amountText.match(/^(\d+(?:\.\d+)?)([^\d.]*)$/);
  if (!amountMatch) return 0;

  const amount = Number(amountMatch[1]);
  const unit = amountMatch[2];

  if (unit === 'k') return Math.round(amount * 1000);
  if (unit === 'l' || unit === 'lit') return Math.round(amount * 100000);
  if (unit === 'tr' || unit === 'm') return Math.round(amount * 1000000);
  if (amountMatch[1].replace('.', '').length >= 6) return Math.round(amount);

  return Math.round(amount * getMultiplyBase(unit));
};


const parseTransactionData = (text) => {
  let type = "Chi";

  if (text.startsWith('+')) {
    type = "Thu";
    text = text.substring(1).trim();
  }

  let category = "Khác";
  const hashtagMatch = text.match(/#([^\s#]+)/);

  if (hashtagMatch) {
    category = hashtagMatch[1];
    text = text.replace(/#([^\s#]+)/, '').trim();
  }

  const match = text.match(/^(.*?)\s+(\S+)$/);

  if (!match) {
    throw new Error("\u26a0\ufe0f Sai c\u00fa ph\u00e1p! VD: C\u00e0 ph\u00ea 30k #anuong, \u0102n t\u1ed1i 5tr5 ho\u1eb7c + L\u01b0\u01a1ng 10m #luong");
  }

  const label = match[1].trim();
  const amountText = match[2].trim();
  const price = parseAmount(amountText);

  if (!label || price <= 0) {
    throw new Error("\u26a0\ufe0f S\u1ed1 ti\u1ec1n kh\u00f4ng h\u1ee3p l\u1ec7! VD: 30k, 5tr5, 5m5, 5.5m");
  }

  const time = Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss");

  return [time, label, price, type, category];
};

const parseDateString = (input) => {
  if (!input) return new Date(0);
  if (input instanceof Date) return input;

  if (typeof input === 'string') {
    const parts = input.split(' ');
    if (parts.length !== 2) return new Date(0);

    const d = parts[0].split('/');
    const t = parts[1].split(':');

    return new Date(d[2], d[1] - 1, d[0], t[0], t[1], t[2]);
  }

  return new Date(0);
};

const getFormattedDateString = (sheetDateValue) => {
  if (sheetDateValue instanceof Date) {
    return Utilities.formatDate(sheetDateValue, "GMT+7", "dd/MM/yyyy HH:mm:ss");
  }

  return sheetDateValue.toString();
};

const CHART_COLORS = [
  '#dc2626',
  '#f97316',
  '#f59e0b',
  '#84cc16',
  '#16a34a',
  '#06b6d4',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#64748b'
];

const getSortedCategoryEntries = (categoryBreakdown) =>
  Object.entries(categoryBreakdown).sort((a, b) => b[1] - a[1]);

const formatPercent = (amount, total) => {
  if (!total) return '0%';

  const rounded = Math.round((amount / total) * 1000) / 10;
  return Number.isInteger(rounded) ? `${rounded.toFixed(0)}%` : `${rounded.toFixed(1)}%`;
};

const appendChartCategoryBreakdown = (caption, categoryBreakdown, totalChi) => {
  const entries = getSortedCategoryEntries(categoryBreakdown);

  if (entries.length === 0) {
    return caption;
  }

  const maxCaptionLength = 900;
  let result = `${caption}\n🔎 ĐÃ CHI THEO DANH MỤC:\n`;
  let shownCount = 0;

  for (const [cat, amount] of entries) {
    const line = `🔴 ${getDisplayCategory(cat)}: ${formatVND(amount)} (${formatPercent(amount, totalChi)})\n`;

    if ((result + line).length > maxCaptionLength) {
      break;
    }

    result += line;
    shownCount++;
  }

  if (shownCount < entries.length) {
    const remainLine = `... và ${entries.length - shownCount} danh mục chi khác.`;

    if ((result + remainLine).length <= maxCaptionLength) {
      result += remainLine;
    }
  }

  return result.trimEnd();
};

const fetchQuickChartBlob = (chartDefinition, width, height, fileName) => {
  const response = UrlFetchApp.fetch('https://quickchart.io/chart', {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({
      chart: chartDefinition,
      width: width,
      height: height,
      format: 'png',
      backgroundColor: 'white',
      devicePixelRatio: 2
    }),
    muteHttpExceptions: true
  });

  if (response.getResponseCode() >= 400) {
    throw new Error(`Không tạo được biểu đồ: ${response.getContentText()}`);
  }

  return response.getBlob().setName(fileName);
};

const buildBarChartConfig = (periodLabel, thuLabel, chiLabel, reportData) => `{
  type: 'bar',
  data: {
    labels: ${JSON.stringify([thuLabel, chiLabel])},
    datasets: [
      {
        data: ${JSON.stringify([reportData.searchTotalThu, reportData.searchTotalChi])},
        backgroundColor: ['#16a34a', '#dc2626'],
        borderColor: ['#15803d', '#b91c1c'],
        borderWidth: 1
      }
    ]
  },
  options: {
    legend: {
      display: false
    },
    title: {
      display: true,
      text: ${JSON.stringify(`THU / CHI - ${periodLabel}`)},
      fontSize: 18
    },
    scales: {
      xAxes: [
        {
          gridLines: {
            display: false
          }
        }
      ],
      yAxes: [
        {
          ticks: {
            beginAtZero: true,
            callback: function(value) {
              return value.toLocaleString('vi-VN') + 'đ';
            }
          }
        }
      ]
    },
    layout: {
      padding: {
        top: 18,
        right: 10,
        bottom: 10,
        left: 10
      }
    },
    plugins: {
      datalabels: {
        anchor: 'end',
        align: 'end',
        color: '#111827',
        font: {
          size: 12,
          weight: 'bold'
        },
        formatter: function(value) {
          return value.toLocaleString('vi-VN') + 'đ';
        }
      }
    }
  }
}`;

const buildPieChartConfig = (periodLabel, chartEntries) => {
  const labels = chartEntries.map(([cat]) => getDisplayCategory(cat));
  const data = chartEntries.map(([, amount]) => amount);
  const colors = chartEntries.map((_, index) => CHART_COLORS[index % CHART_COLORS.length]);

  return `{
    type: 'pie',
    data: {
      labels: ${JSON.stringify(labels)},
      datasets: [
        {
          data: ${JSON.stringify(data)},
          backgroundColor: ${JSON.stringify(colors)},
          borderColor: '#ffffff',
          borderWidth: 2
        }
      ]
    },
    options: {
      title: {
        display: true,
        text: ${JSON.stringify(`CHI TIÊU THEO DANH MỤC - ${periodLabel}`)},
        fontSize: 18
      },
      legend: {
        display: true,
        position: 'right',
        labels: {
          fontSize: 12,
          boxWidth: 14
        }
      },
      layout: {
        padding: {
          top: 18,
          right: 18,
          bottom: 18,
          left: 18
        }
      },
      plugins: {
        datalabels: {
          color: '#111827',
          font: {
            size: 12,
            weight: 'bold'
          },
          formatter: function(value, ctx) {
            var total = ctx.dataset.data.reduce(function(sum, item) {
              return sum + item;
            }, 0);

            var percent = total ? Math.round(value * 1000 / total) / 10 : 0;
            return percent % 1 === 0 ? percent.toFixed(0) + '%' : percent.toFixed(1) + '%';
          }
        }
      }
    }
  }`;
};

// Lấy Báo Cáo
const getReports = (searchQuery = null) => {
  const periodType = searchQuery ? getPeriodType(searchQuery) : null;
  const dayQueryMonth = periodType === 'day' ? getMonthQueryFromDay(searchQuery) : null;
  const dayQueryEndDate = periodType === 'day' ? getDayQueryEndDate(searchQuery) : null;

  let totalChi = 0;
  let totalThu = 0;

  let searchTotalChi = 0;
  let searchTotalThu = 0;
  let dayWalletChi = 0;
  let dayWalletThu = 0;
  let dayWalletTransactionCount = 0;

  let currentMonthThu = 0;
  let currentMonthChi = 0;
  const currentMonthStr = getCurrentMonthStr();

  let combinedData = [];
  let searchResults = [];
  let categoryBreakdownChi = {};
  let categoryBreakdownThu = {};

  const sheetChi = getSheet('Chi');
  const dataChi = sheetChi.getDataRange().getValues();

  for (let i = 1; i < dataChi.length; i++) {
    if (!dataChi[i][0]) continue;

    const price = Number(dataChi[i][2]) || 0;
    const dateStr = getFormattedDateString(dataChi[i][0]);
    const cat = dataChi[i][3] || "Khác";
    const rowDate = periodType === 'day' ? parseDateString(dataChi[i][0]) : null;

    totalChi += price;

    if (dateStr.includes(currentMonthStr)) {
      currentMonthChi += price;
    }

    if (periodType === 'day' && dateStr.includes(dayQueryMonth) && rowDate <= dayQueryEndDate) {
      dayWalletChi += price;
      dayWalletTransactionCount++;
    }

    if (searchQuery && dateStr.includes(searchQuery)) {
      searchTotalChi += price;
      searchResults.push([...dataChi[i], 'Chi']);
      categoryBreakdownChi[cat] = (categoryBreakdownChi[cat] || 0) + price;
    }

    combinedData.push([...dataChi[i], 'Chi']);
  }

  const sheetThu = getSheet('Thu');
  const dataThu = sheetThu.getDataRange().getValues();

  for (let i = 1; i < dataThu.length; i++) {
    if (!dataThu[i][0]) continue;

    const price = Number(dataThu[i][2]) || 0;
    const dateStr = getFormattedDateString(dataThu[i][0]);
    const cat = dataThu[i][3] || "Khác";
    const rowDate = periodType === 'day' ? parseDateString(dataThu[i][0]) : null;

    totalThu += price;

    if (dateStr.includes(currentMonthStr)) {
      currentMonthThu += price;
    }

    if (periodType === 'day' && dateStr.includes(dayQueryMonth) && rowDate <= dayQueryEndDate) {
      dayWalletThu += price;
      dayWalletTransactionCount++;
    }

    if (searchQuery && dateStr.includes(searchQuery)) {
      searchTotalThu += price;
      searchResults.push([...dataThu[i], 'Thu']);
      categoryBreakdownThu[cat] = (categoryBreakdownThu[cat] || 0) + price;
    }

    combinedData.push([...dataThu[i], 'Thu']);
  }

  combinedData.sort((a, b) => parseDateString(a[0]) - parseDateString(b[0]));
  searchResults.sort((a, b) => parseDateString(a[0]) - parseDateString(b[0]));

  const balance = totalThu - totalChi;
  const searchBalance = searchTotalThu - searchTotalChi;
  const currentMonthBalance = currentMonthThu - currentMonthChi;

  const reportBalance = periodType === 'day'
    ? dayWalletThu - dayWalletChi
    : searchQuery
      ? searchBalance
      : balance;

  return {
    balance,
    searchBalance,
    reportBalance,
    dayWalletTransactionCount,
    totalThu,
    totalChi,
    combinedData,
    currentMonthThu,
    currentMonthChi,
    currentMonthBalance,
    searchTotalChi,
    searchTotalThu,
    searchResults,
    categoryBreakdownChi,
    categoryBreakdownThu
  };
};

// Webhooks
const doPost = (request) => {
  try {
    const contents = JSON.parse(request.postData.contents);

    if (!contents.message || !contents.message.text) return;

    const text = contents.message.text.trim();
    const textLower = text.toLowerCase();

    // HELP
    if (textLower === '/help' || textLower === '/start') {
      const todayStr = getTodayStr();
      const currentMonthStr = getCurrentMonthStr();
      const currentYearStr = getCurrentYearStr();

      let msg = `🤖 HƯỚNG DẪN BOT THU CHI:\n\n`;

      msg += `📝 GHI CHÉP:\n`;
      msg += `🔴 Chi tiêu: Cà phê 30k #anuong\n`;
      msg += `🔴 Đổ xăng 50k #dilai\n`;
      msg += `🟢 Thu nhập: + Lương 10m #luong\n\n`;

      msg += `⚙️ NGÂN SÁCH:\n`;
      msg += `➖ /budget: Xem ngân sách\n`;
      msg += `➖ /budget 10m: Đặt ngân sách tháng\n\n`;

      msg += `🛠 SỬA / XOÁ:\n`;
      msg += `➖ /delete: Xoá chi tiêu cuối cùng\n`;
      msg += `➖ /delete thu: Xoá thu nhập cuối cùng\n`;
      msg += `➖ /edit [nội dung]: Sửa dòng cuối\n\n`;

      msg += `📊 BÁO CÁO:\n`;
      msg += `➖ /report: Báo cáo hôm nay\n`;
      msg += `➖ /report ${todayStr}: Báo cáo theo ngày\n`;
      msg += `➖ /report ${currentMonthStr}: Báo cáo theo tháng\n`;
      msg += `➖ /report ${currentYearStr}: Báo cáo theo năm\n\n`;

      msg += `📈 BIỂU ĐỒ:\n`;
      msg += `➖ /chart: Biểu đồ hôm nay\n`;
      msg += `➖ /chart ${todayStr}: Biểu đồ theo ngày\n`;
      msg += `➖ /chart ${currentMonthStr}: Biểu đồ theo tháng\n`;
      msg += `➖ /chart ${currentYearStr}: Biểu đồ theo năm\n\n`;

      msg += `🕒 KHÁC:\n`;
      msg += `➖ /recent: 5 giao dịch gần nhất`;

      return sendMessage(msg);
    }
    // BUDGET
    if (textLower.startsWith('/budget')) {
      const parts = textLower.split(' ');

      if (parts.length > 1) {
        const input = textLower.replace('/budget', '').trim();
        const newBudget = parseAmount(input);

        if (newBudget > 0) {
          setMonthlyBudget(newBudget);
          const reports = getReports();
          let msg = `✅ Ngân sách tháng đã đặt: ${formatVND(newBudget)}`;

          if (reports.currentMonthChi > newBudget) {
            msg += `\n🚨 VƯỢT NGÂN SÁCH THÁNG: Đã tiêu quá ${formatVND(reports.currentMonthChi - newBudget)}!`;
          }

          return sendMessage(msg);
        } else {
          return sendMessage(`⚠ Số tiền không hợp lệ!`);
        }
      } else {
        return sendMessage(`💡 Ngân sách tháng hiện tại: ${formatVND(getMonthlyBudget())}`);
      }
    }

    // CHART NGÀY / THÁNG / NĂM
    if (textLower.startsWith('/chart') || textLower.startsWith('/bieudo')) {
      const parts = text.split(' ');

      // Không nhập gì thì mặc định là hôm nay
      const searchQuery = parts.length === 1 ? getTodayStr() : parts[1].trim();
      const periodType = getPeriodType(searchQuery);
      const periodLabel = getPeriodLabel(searchQuery);
      const thuLabel = getThuLabel(searchQuery);
      const chiLabel = getChiLabel(searchQuery);
      const balanceLabel = getBalanceLabel(searchQuery);
      if (periodType === "invalid") {
        let msg = `⚠️ Sai định dạng biểu đồ.\n\n`;
        msg += `Ví dụ:\n`;
        msg += `➖ /chart : biểu đồ hôm nay\n`;
        msg += `➖ /chart ${getTodayStr()} : biểu đồ theo ngày\n`;
        msg += `➖ /chart ${getCurrentMonthStr()} : biểu đồ theo tháng\n`;
        msg += `➖ /chart ${getCurrentYearStr()} : biểu đồ theo năm`;
        return sendMessage(msg);
      }

      const r = getReports(searchQuery);

      if (r.searchResults.length === 0) {
        return sendMessage(`🔎 Không có dữ liệu để vẽ biểu đồ cho ${periodLabel}.`);
      }

      const chartEntries = getSortedCategoryEntries(r.categoryBreakdownChi);
      const barChartBlob = fetchQuickChartBlob(
        buildBarChartConfig(periodLabel, thuLabel, chiLabel, r),
        620,
        520,
        'thu-chi.png'
      );

      let barCaption = `📊 THU / CHI ${periodLabel}\n`;
      barCaption += `🟢 ${thuLabel}: ${formatVND(r.searchTotalThu)}\n`;
      barCaption += `🔴 ${chiLabel}: ${formatVND(r.searchTotalChi)}\n`;
      barCaption += `🏦 ${balanceLabel}: ${formatVND(r.reportBalance)}`;
      sendPhoto(barChartBlob, barCaption);

      if (chartEntries.length === 0) {
        return sendMessage(`🔎 Chưa có khoản chi nào cho ${periodLabel} để vẽ biểu đồ tròn theo danh mục.`);
      }

      const pieChartBlob = fetchQuickChartBlob(
        buildPieChartConfig(periodLabel, chartEntries),
        980,
        520,
        'chi-theo-danh-muc.png'
      );

      let pieCaption = `🥧 CHI TIÊU THEO DANH MỤC ${periodLabel}\n`;
      pieCaption += `🔴 ${chiLabel}: ${formatVND(r.searchTotalChi)}\n`;
      pieCaption += `🏦 ${balanceLabel}: ${formatVND(r.reportBalance)}\n`;
      pieCaption += `Nhập /report ${searchQuery} để xem chi tiết.`;
      pieCaption = appendChartCategoryBreakdown(pieCaption, r.categoryBreakdownChi, r.searchTotalChi);

      return sendPhoto(pieChartBlob, pieCaption);
    }

    // REPORT NGÀY / THÁNG / NĂM
    if (textLower.startsWith('/report') || textLower.startsWith('/baocao')) {
      const parts = text.split(' ');

      // Không nhập gì thì mặc định là hôm nay
      const searchQuery = parts.length === 1 ? getTodayStr() : parts[1].trim();
      const periodType = getPeriodType(searchQuery);
      const periodLabel = getPeriodLabel(searchQuery);
      const thuLabel = getThuLabel(searchQuery);
      const chiLabel = getChiLabel(searchQuery);
      const balanceLabel = getBalanceLabel(searchQuery);
      let msg = ``;

      if (periodType === "invalid") {
        msg += `⚠️ Sai định dạng báo cáo.\n\n`;
        msg += `Ví dụ:\n`;
        msg += `➖ /report : báo cáo hôm nay\n`;
        msg += `➖ /report ${getTodayStr()} : báo cáo theo ngày\n`;
        msg += `➖ /report ${getCurrentMonthStr()} : báo cáo theo tháng\n`;
        msg += `➖ /report ${getCurrentYearStr()} : báo cáo theo năm`;

        return sendMessage(msg);
      }

      const r = getReports(searchQuery);
      const hasReportData = r.searchResults.length > 0;

      if (!hasReportData) {
        return sendMessage(`🔎 Không có giao dịch nào cho ${periodLabel}.`);
      }

      if (periodType === "day") {
        msg += `📅 BÁO CÁO ${periodLabel}\n`;
      }

      if (periodType === "month") {
        msg += `📊 BÁO CÁO ${periodLabel}\n`;
      }

      if (periodType === "year") {
        msg += `📆 BÁO CÁO ${periodLabel}\n`;
      }

      msg += `──────────────\n`;
      msg += `🟢 ${thuLabel}: ${formatVND(r.searchTotalThu)}\n`;
      msg += `🔴 ${chiLabel}: ${formatVND(r.searchTotalChi)}\n`;
      msg += `🏦 ${balanceLabel}: ${formatVND(r.reportBalance)}\n`;
      msg += `──────────────\n`;

      if (Object.keys(r.categoryBreakdownThu).length > 0) {
        msg += `🟢 PHÂN LOẠI THU:\n`;

        for (const [cat, amount] of Object.entries(r.categoryBreakdownThu)) {
          const displayCat = getDisplayCategory(cat);
          msg += `🟢 ${displayCat}: ${formatVND(amount)}\n`;
        }

        msg += `──────────────\n`;
      }

      if (Object.keys(r.categoryBreakdownChi).length > 0) {
        msg += `🔴 PHÂN LOẠI CHI:\n`;

        for (const [cat, amount] of Object.entries(r.categoryBreakdownChi)) {
          const displayCat = getDisplayCategory(cat);
          msg += `🔴 ${displayCat}: ${formatVND(amount)}\n`;
        }

        msg += `──────────────\n`;
      }

      if (periodType === "day") {
        const thuList = r.searchResults.filter(row => row[row.length - 1] === 'Thu');
        const chiList = r.searchResults.filter(row => row[row.length - 1] === 'Chi');

        if (thuList.length > 0) {
          msg += `🟢 CHI TIẾT KHOẢN THU:\n`;

          thuList.forEach(row => {
            const dateParts = getFormattedDateString(row[0]).split(' ');
            const dateShow = dateParts[1] ? dateParts[1].substring(0, 5) : dateParts[0];

            const displayCat = getDisplayCategory(row[3]);

            msg += `${dateShow} 🟢 [${displayCat}] ${row[1]}: ${formatVND(Number(row[2]))}\n`;
          });

          msg += `──────────────\n`;
        }

        if (chiList.length > 0) {
          msg += `🔴 CHI TIẾT KHOẢN CHI:\n`;

          chiList.forEach(row => {
            const dateParts = getFormattedDateString(row[0]).split(' ');
            const dateShow = dateParts[1] ? dateParts[1].substring(0, 5) : dateParts[0];

            const displayCat = getDisplayCategory(row[3]);

            msg += `${dateShow} 🔴 [${displayCat}] ${row[1]}: ${formatVND(Number(row[2]))}\n`;
          });
        }

      }
      return sendLongMessage(msg);
    }

    // RECENT
    if (textLower === '/recent') {
      const data = getReports().combinedData.slice(-5);

      let msg = `🕒 5 GIAO DỊCH GẦN NHẤT:\n\n`;

      if (data.length === 0) {
        return sendMessage("Chưa có giao dịch nào!");
      }

      data.forEach(row => {
        const displayCat = getDisplayCategory(row[4]);
        const catTag = `[${displayCat}] `;
        const dateTime = getFormattedDateString(row[0]);
        const icon = row[3] === "Thu" ? "🟢" : "🔴";
        const typeText = row[3] === "Thu" ? "Thu" : "Chi";

        msg += `${dateTime} ${icon} ${typeText} ${catTag}${row[1]}: ${formatVND(Number(row[2]))}\n`;
      });

      return sendMessage(msg);
    }

    // DELETE
    if (textLower.startsWith('/delete')) {
      const parts = textLower.split(' ');

      let typeToDel = 'Chi';
      let rowToDel = null;

      if (parts.length > 1) {
        if (parts[1] === 'thu') {
          typeToDel = 'Thu';

          if (parts[2]) {
            rowToDel = parseInt(parts[2]);
          }
        } else {
          rowToDel = parseInt(parts[1]);
        }
      }

      const success = deleteRow(typeToDel, rowToDel);
      SpreadsheetApp.flush();

      return sendMessage(success ? `🗑 Đã xoá thành công.` : `⚠ Không có dữ liệu để xoá!`);
    }

    // EDIT
    if (textLower.startsWith('/edit ')) {
      const data = parseTransactionData(text.substring(6).trim());
      const success = editLastRow(data);

      SpreadsheetApp.flush();

      const displayCat = getDisplayCategory(data[4]);
      const icon = data[3] === "Thu" ? "🟢" : "🔴";
      const typeText = data[3] === "Thu" ? "Thu" : "Chi";

      return sendMessage(
        success
          ? `✏️ Đã sửa thành:\n${icon} ${typeText} [${displayCat}] ${data[1]}: ${formatVND(data[2])}`
          : `⚠ Không có dữ liệu để sửa!`
      );
    }

    // THÊM GIAO DỊCH MỚI
    const data = parseTransactionData(text);

    addNewRow(data);
    SpreadsheetApp.flush();

    const reports = getReports();
    const displayCat = getDisplayCategory(data[4]);

    const icon = data[3] === "Thu" ? "🟢" : "🔴";
    const typeText = data[3] === "Thu" ? "Thu" : "Chi";

    let msg = `✅ Đã lưu:\n${icon} ${typeText} [${displayCat}] ${data[1]}: ${formatVND(data[2])}`;

    if (data[3] === "Chi") {
      const currentBudget = getMonthlyBudget();

      if (reports.currentMonthChi > currentBudget) {
        msg += `\n🚨 VƯỢT NGÂN SÁCH THÁNG: Đã tiêu quá ${formatVND(reports.currentMonthChi - currentBudget)}!`;
      }
    }

    return sendMessage(msg);

  } catch (error) {
    return sendMessage(`❌ Bot gặp lỗi: ${error.message}`);
  }
};

