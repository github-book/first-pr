// CONSTANT
const accessToken = "c9ee7ed93bb640d519a8d8b159915c156a1f81ff";
const sheetname = 'accenture-premium-table';
//const n2sLabel = 'accenture'
// global variables
var room_id;
var agent;
var site_id;

//var n2sUrl = "https://svr134030283.n2search.net/json/?type=search";

const errorMessages =  [{
  "type": "select",
  "text": "エラーが発生しました。",
  "options": [
    {
      "type": "text",
      "label": "はじめに戻る"
    }
  ]
}];

function doPost(e) {
  var jsonString = e.postData.getDataAsString();
  var data = JSON.parse(jsonString);
  
  room_id = data.room_id;
  agent = data.agent;
  site_id = data.siteId;

  if (data.premium) {
    calcPremium(data);
  } else if (data.q) {
    searchQuery(data);
  } else if (data["加入区分"]) {
    checkupGuide(data);
  } else {
    sendMessage(errorMessages);
  }
}

function checkupGuide(data) {

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("checkup-guide");
  var table = sheet.getDataRange().getValues();

  var messages =  [{
    "type": "text",
    "text": data["加入区分"]
  }];

  if(true) {
    var checkup = [];
    var message = "";
    for (var i = 0; i < table.length; i++) {
      if (data["年齢区分"] != "75歳以上" &&  data["年齢区分"] != "22歳以下") {
        if(table[i][2] == data["加入区分"] && table[i][3] == data["年齢区分"] && table[i][4] == data["性別"] && table[i][5] == data["ABC検診"]) {
          checkup = table[i];
          message += "加入区分：" + data["加入区分"] + "\r\n年齢区分：" + data["年齢区分"] + "\r\n性別：" + data["性別"] + "\r\nABC健診：" + data["ABC検診"] + "\r\n\r\n";
        }
      } else {
        if (table[i][2] == data["加入区分"] && table[i][3] == data["年齢区分"]) {
          checkup = table[i];
          message += "加入区分：" + data["加入区分"] + "\r\n年齢区分：" + data["年齢区分"] + "\r\n\r\n";
        }
      }
    }
    if (checkup.length == false) {
      message += "加入区分：" + data["加入区分"] + "\r\n年齢区分：" + data["年齢区分"] + "\r\n性別：" + data["性別"] + "\r\nABC健診：" + data["ABC検診"] + "\r\n\r\n";
      message += "該当する健診が見つかりませんでした。"
    } else {
      message += checkup[9];
    }
  }

  var messages =  [{
    "type": "text",
    "text": message
  }];

  sendMessage(messages);
}

function searchQuery(data) {
  
  var q = data.q;
  if (data.start) {
    n2sUrl = n2sUrl + "&start=" + data.start;
  } else {
    n2sUrl = n2sUrl + "&start=0";
  }
  n2sUrl = n2sUrl + "&q=" + q + "&fields.label=" + n2sLabel + "&num=10";

  var response = UrlFetchApp.fetch(n2sUrl);
  var responseCode = response.getResponseCode()
  if (responseCode == 200) {
    var responseText = response.getContentText()
    var resultJSON = JSON.parse(responseText);
  } else {
    sendMessage(errorMessages);
    return;
  }

  var options = [];

  if (resultJSON.response.record_count > 0) {
    //console.log(resultJSON.response.result.length);
    for (item of resultJSON.response.result) {
      var title = item.title.split(" | ")[0];
      options.push({
        "type": "url",
        "value": item.url_link,
        "label": title
      })
    }
  }

  options.push({
    "type": "text",
    "label": "サイト内検索"
  });
  options.push({
    "type": "text",
    "label": "↩ はじめに戻る"
  });

  var messages =  [{
    "type": "select",
    "text": "キーワード「" + q + "」の検索結果",
    "options": options
  }];

  sendMessage(messages);
}


function calcPremium(data) {

  var sheetname = 'accenture-premium-table';
  var firstLine = "[[cpb:＜計算結果（令和5年度）＞]]\r\n";
  var rest_of_month = [0, 2, 1, 0, 11, 10, 9, 8, 7, 6, 5, 4, 3];
  var rest_of_month_label = ['', '2024年3月分', '2024年2月分～3月分', '2024年1月分～3月分', '12月分～2024年3月分', '11月分～2024年3月分', '10月分～2024年3月分', '9月分～2024年3月分', '8月分～2024年3月分', '7月分～2024年3月分', '6月分～2024年3月分', '5月分～2024年3月分', '4月分～2024年3月分'];

  var r6startdate = new Date("2024-04-01"); // これで3月31日以降になる

  var last_premium = data.premium.split('円',2)[0].trim();
  var birthday = new Date(data.birthday);
  var retiredate = new Date(data.retiredate);
  var joindate = new Date(retiredate);

  joindate.setDate(joindate.getDate() + 1);
  var ages = getMonthlyAges(joindate, birthday);

  var premium_label = "";
  if (ages.joined_age > 39 && ages.joined_age < 65) {
    premium_label = "健康保険＋介護保険";
  } else {
    premium_label = "健康保険料";
  }

  if (joindate >= r6startdate) {
    sheetname = 'accenture-premium-table-2024';
    firstLine = "[[cpb:＜計算結果（令和6年度）＞]]\r\n";
    rest_of_month_label = ['', '2025年3月分', '2025年2月分～3月分', '2025年1月分～3月分', '12月分～2025年3月分', '11月分～2025年3月分', '10月分～2025年3月分', '9月分～2025年3月分', '8月分～2025年3月分', '7月分～2025年3月分', '6月分～2025年3月分', '5月分～2025年3月分', '4月分～2025年3月分'];
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetname);
  var table = sheet.getDataRange().getValues();


  var message;
  if (last_premium == "") {
    message = "退職時の健康保険料を選択してください。";
  } else {
    message = firstLine;
    message += "退職時年齢：" + ages.joined_age + "歳\r\n";
    var premium_without_kaigo = [];
    var premium_with_kaigo = []
    for (var i = 0; i < table.length; i++) {
      if (table[i][0] == last_premium && table[i][1] == "健康保険＋介護保険") {
        premium_with_kaigo = table[i];
      } else if (table[i][0] == last_premium && table[i][1] == "健康保険料のみ") {
        premium_without_kaigo = table[i];
      }
    }
    if (premium_with_kaigo.length == false || premium_without_kaigo.length == false) {
      message += "”" + last_premium + "”に該当する項目はありません。"
    } else {

      var first_month = joindate.getMonth() + 1;
      var months = rest_of_month[first_month];
      
      var first_month_premium = 0;
      var zennou_premium = 0;
      var zennou_premium2 = 0;
      var regular_premium = 0;
      var pad = 2;
      
      if (ages.joined_age > 39 && ages.joined_age < 65) {
        first_month_premium = premium_with_kaigo[pad];
      } else {
        first_month_premium = premium_without_kaigo[pad];
      }
      if (ages.over40under64 == 0) {
        zennou_premium = premium_without_kaigo[ages.total_months+pad] + first_month_premium;
        if(ages.total_months > 6) {
          zennou_premium2 = premium_without_kaigo[6 + pad] + premium_without_kaigo[ages.total_months - 6 + pad] + first_month_premium;
        } else {
          zennou_premium2 = premium_without_kaigo[ages.total_months+pad] + first_month_premium;
        }
      } else if(ages.total_months == ages.over40under64) {
        zennou_premium = premium_with_kaigo[ages.over40under64+pad] + first_month_premium;
        if(ages.over40under64 > 6) {
          zennou_premium2 = premium_with_kaigo[6 + pad] + premium_with_kaigo[ages.over40under64 - 6 + pad] + first_month_premium;
        } else {
          zennou_premium2 = premium_with_kaigo[ages.over40under64+pad] + first_month_premium;
        }
      } else if (ages.over65 == 0) {
        message += "※40歳に達した月から介護保険料も徴収されます。\r\n";
        zennou_premium = premium_without_kaigo[ages.total_months+pad] + (premium_with_kaigo[ages.total_months+pad] - premium_without_kaigo[ages.total_months+pad]) - (premium_with_kaigo[ages.under39+pad] - premium_without_kaigo[ages.under39+pad]) + first_month_premium;
        if(ages.total_months > 6) {
          var first = ages.total_months - 6;
          var u39_first = ages.under39 < (ages.total_months - 6) ? ages.under39 : ages.total_months - 6;
          var u39_last  = ages.under39 > (ages.total_months - 6) ? ages.under39 - (ages.total_months - 6) : 0;
          var zennou_premium2_first = 0;
          var zennou_premium2_last = 0;
          if(ages.over40under64 > 6) {
            zennou_premium2_first = premium_without_kaigo[first + pad] + (premium_with_kaigo[first+pad] - premium_without_kaigo[first+pad]) - (premium_with_kaigo[u39_first+pad] - premium_without_kaigo[u39_first+pad]);
            zennou_premium2_last  = premium_with_kaigo[6 + pad];
          } else if (ages.over40under64 == 6) {
            zennou_premium2_first = premium_without_kaigo[u39_first +pad];
            zennou_premium2_last  = premium_with_kaigo[6 + pad];
          } else {
            zennou_premium2_first = premium_without_kaigo[u39_first + pad];
            zennou_premium2_last  = premium_without_kaigo[6+pad] + (premium_with_kaigo[6+pad] - premium_without_kaigo[6+pad]) - (premium_with_kaigo[u39_last+pad] - premium_without_kaigo[u39_last+pad]);
          }
          zennou_premium2 = zennou_premium2_first + zennou_premium2_last + first_month_premium;
        }
      } else if (ages.under39 == 0) {
        message += "※65歳に達した月から健康保険料のみとなります。\r\n";
        zennou_premium = premium_without_kaigo[ages.total_months+pad] + (premium_with_kaigo[ages.over40under64+pad] - premium_without_kaigo[ages.over40under64+pad]) + first_month_premium;
        if(ages.total_months > 6) {
          var last = ages.total_months - 6;
          var u64_first = ages.over40under64 >= 6 ? 6 : ages.over40under64;
          var u64_last  = ages.over40under64 >= 6 ? ages.over40under64 - 6 : 0;
          var zennou_premium2_first = 0;
          var zennou_premium2_last = 0;
          if(ages.over40under64 > 6) {
            zennou_premium2_first  = premium_with_kaigo[6 + pad];
            zennou_premium2_last = premium_without_kaigo[last + pad] + (premium_with_kaigo[u64_last+pad] - premium_without_kaigo[u64_last+pad]);
          } else if (ages.over40under64 == 6) {
            zennou_premium2_first = premium_with_kaigo[6 +pad];
            zennou_premium2_last  = premium_without_kaigo[last + pad];
          } else {
            zennou_premium2_first = premium_without_kaigo[6+pad] + (premium_with_kaigo[u64_first+pad] - premium_without_kaigo[u64_first+pad]);
            zennou_premium2_last = premium_without_kaigo[last + pad];
          }
          zennou_premium2 = zennou_premium2_first + zennou_premium2_last + first_month_premium;
        }
      }
      regular_premium = (ages.under39 * premium_without_kaigo[pad]) + (ages.over40under64 * premium_with_kaigo[pad]) + (ages.over65 * premium_without_kaigo[pad]) + first_month_premium;

      message += "\r\n【初回の保険料】\r\n";
      message += first_month + "月分：" + first_month_premium.toLocaleString() + "円(" + premium_label +")\r\n\r\n";

      if ( joindate.getMonth() == 2) {
        // 3月退職の場合は翌年12ヶ月分を表示
        message += "【翌年度の保険料】\r\n（前納の場合）\r\n";
        message += "4月分～翌年3月分:" + zennou_premium.toLocaleString() + "円\r\n";
        message += "（毎月払いの場合）\r\n";
        message += "4月分～翌年3月分:" + regular_premium.toLocaleString() + "円\r\n";
        message += "※金額端数処理上、実際の前納金額に数円の差がある場合がございます。\r\n※初回以降の保険料を前納（年度内一括または半期分）すると保険料が割引となります（複利現価法による年4％割引）。";
      }else{
        message += "【一年分の保険料(" + rest_of_month_label[months+1] + ")】\r\n";
        message += "　一年前納の場合：" + zennou_premium.toLocaleString() + "円\r\n";
        if(zennou_premium2 > 0) {
          message += "　半期前納の場合：" + zennou_premium2.toLocaleString() + "円\r\n";
        }
        message += "　毎月払いの場合：" + regular_premium.toLocaleString() + "円\r\n\r\n";
        message += "※金額端数処理上、実際の前納金額に数円の差がある場合がございます。\r\n※初回以降の保険料を前納（年度内一括または半期分）すると保険料が割引となります（複利現価法による年4％割引）。";
      }
    }
  }
  
  var messages =  [{
    "type": "text",
    "text": message
  }];

  sendMessage(messages);
  logMessage(data, message);

}

function sendMessage(messages) {

  var sendToChat = {
    "to": room_id,
    "agent": agent,
    "messages": messages,
    "accessToken": accessToken,
    "siteId": site_id
  }

  var options = {
    'method': 'POST',
    'contentType': 'application/json',
    'payload': JSON.stringify(sendToChat)
  }

  UrlFetchApp.fetch('https://app.chatplus.jp/api/v1/send', options);

} 


function logMessage(data, message) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('log');

  var now = new Date();
  var rowData = [
    now,
    data.premium,
    data.birthday,
    data.retiredate,
    message
  ];

  sheet.appendRow(rowData);
}


function test_getAget() {
  var birthday = new Date('1983-9-19');
  var retiredate = new Date('2023-3-31');
  var joindate = new Date(retiredate);
  joindate.setDate(joindate.getDate() + 1);
  var ages = getMonthlyAges(joindate, birthday);
  Logger.log(ages);
}

function getMonthlyAges(currentDate, birthDate) {
  var ages = {
    total_months: 0,
    joined_age: 0,
    under39: 0,
    over40under64: 0,
    over65: 0
  };
  for ( var i=0;i<13;i++) {
    _tmpDate = get_nextmonth_date(currentDate, i);
    var age = getAge(_tmpDate, birthDate);
    if (i == 0) {
      ages.joined_age = age;
    } else {
      ages.total_months += 1;
      if (age < 40) {
        ages.under39 += 1;
      } else if(age > 64) {
        ages.over65 += 1;
      } else {
        ages.over40under64 += 1;
      }
    }
    //Logger.log(`${_tmpDate.getFullYear()}-${_tmpDate.getMonth()+1}-${_tmpDate.getDate()}: ${getAge(_tmpDate, birthDate)}`);
    if (_tmpDate.getMonth() == 2 && ages.total_months > 1) {break}
  }
  return ages;
}

function getAge(currentDate, birthDate) {
  var _birthday = new Date(birthDate);
  _birthday.setDate(_birthday.getDate() - 1);
  var age = currentDate.getFullYear() - _birthday.getFullYear();
  var m = currentDate.getMonth() - _birthday.getMonth();
  if (m < 0 || (m === 0 && currentDate.getDate() < _birthday.getDate())) 
  {
      age--;
  }
  return age;
}

/**
 * 指定した日付からXヶ月後のDateオブジェクトを取得する
 * @param {object} date   - 基準のDateオブジェクト
 * @param {number} months - 何ヶ月先の日付を取得するか
 */
function get_nextmonth_date(date, months) { 
    // 基準の年月日を取得
    var year = date.getFullYear();
    var month = date.getMonth();
    var day = date.getDate();
 
    // 基準の年月からDateオブジェクトを生成
    var nextDate = new Date(year, month);
    // 月の設定を変更
    nextDate.setMonth(nextDate.getMonth() + months);
    // 末日を取得
    var lastDay =  new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0);
    return lastDay;
    //var lastDay = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate();
    // 元の日にちが該当月に無い場合はその月の末日を設定する
    //if(lastDay < day) {
    //    nextDate.setDate(lastDay);
    //} else {
    //    nextDate.setDate(day);
    //}
    //return nextDate;
}

module.exports = {
  calcPremium,
  getMonthlyAges,
  getAge,
  get_nextmonth_date,
};