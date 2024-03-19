// import { describe, expect, test } from '@jest/globals';
const { describe, expect, test } = require("@jest/globals");

const SpreadsheetApp = require("./mocks/SpreadsheetApp");
const { calcPremium, getMonthlyAges, getAge, get_nextmonth_date } = require("../Code");

describe("calcPremium function", () => {
  beforeAll(() => {
    // UrlFetchApp.fetchをモックに置き換える
    global.UrlFetchApp = {
      fetch: jest.fn().mockImplementation((url, options) => {
        return {
          getContentText: () => JSON.stringify(options), // 送信内容をJSON文字列で返す
        };
      }),
    };
  });
  beforeEach(() => {
    // テストの前にモックをクリアする
    global.UrlFetchApp.fetch.mockClear();
  });

  test("should calculate premium correctly for a given data set", () => {
    // テストデータを用意
    const data = {
      premium: "2030",
      birthday: "1970-12-18",
      retiredate: "2024-3-31",
    };

    // 期待される出力を定義
    const expectedMessage =
      "特定の保険料は特定の誕生日から特定の退職日までの期間に対して計算されます。";

    // 関数を実行
    calcPremium(data);

    // 結果を検証
    expect(global.UrlFetchApp.fetch).toHaveBeenCalled(); // UrlFetchAppが呼び出されたことを確認
    expect(global.UrlFetchApp.fetch).toHaveBeenCalledWith(expectedMessage); // 期待されるメッセージが送信されたことを確認
  });

  // 他のシナリオやエッジケースについてもテストを追加できます。
});

describe("getMonthlyAges function", () => {
  test("should correctly count months in each age category", () => {
    const currentDate = new Date(2023, 3, 31); // 2023年3月31日
    const birthDate = "1983-01-15"; // 1983年1月15日

    const ages = getMonthlyAges(currentDate, birthDate);
    expect(ages).toEqual({
      total_months: 10, // 13ヶ月のうち1ヶ月はjoined_ageにカウントされるため
      joined_age: 40, // 最初の月の年齢
      under39: 0, // 39歳未満の月はない
      over40under64: 10, // 40歳から64歳までの月数
      over65: 0, // 65歳以上の月はない
    });
  });

  // 他の誕生日や現在の日付で異なるシナリオをテストすることも可能です。
  test("should correctly count months in each age category", () => {
    const currentDate = new Date(2023, 3, 15); // 2023年1月15日
    const birthDate = "1983-01-15"; // 1983年1月15日

    const ages = getMonthlyAges(currentDate, birthDate);
    expect(ages).toEqual({
      total_months: 11, // 13ヶ月のうち1ヶ月はjoined_ageにカウントされるため
      joined_age: 40, // 最初の月の年齢
      under39: 0, // 39歳未満の月はない
      over40under64: 11, // 40歳から64歳までの月数
      over65: 0, // 65歳以上の月はない
    });
  });
});

describe("getAge function", () => {
  test("should return correct age if birthday has not occurred this year", () => {
    const currentDate = new Date(2023, 5, 15); // 2023年6月15日
    const birthDate = "2000-10-01"; // 2000年10月1日
    const age = getAge(currentDate, birthDate);
    expect(age).toBe(22); // 22歳（まだ23歳の誕生日には至っていない）
  });

  test("should return correct age if birthday is today", () => {
    const currentDate = new Date(2023, 5, 15); // 2023年6月15日
    const birthDate = "2000-06-15"; // 2000年6月15日
    const age = getAge(currentDate, birthDate);
    expect(age).toBe(23); // 今日が23歳の誕生日
  });

  test("should return correct age if birthday has already occurred this year", () => {
    const currentDate = new Date(2023, 5, 15); // 2023年6月15日
    const birthDate = "2000-01-10"; // 2000年1月10日
    const age = getAge(currentDate, birthDate);
    expect(age).toBe(23); // 23歳（今年の誕生日は過ぎている）
  });

  // 他のエッジケースや異なるシナリオのテストを追加することができます。
});

describe("get_nextmonth_date function", () => {
  test("should return the last day of next month", () => {
    const date = new Date(2023, 0, 15); // 2023年1月15日
    const months = 1;
    const result = get_nextmonth_date(date, months);
    expect(result).toEqual(new Date(2023, 1, 28)); // 2023年2月の最終日
  });

  test("should return the last day of a month 6 months later", () => {
    const date = new Date(2023, 0, 15); // 2023年1月15日
    const months = 6;
    const result = get_nextmonth_date(date, months);
    expect(result).toEqual(new Date(2023, 6, 31)); // 2023年7月の最終日
  });

  test("should return the last day of the year when given 11 months from January", () => {
    const date = new Date(2023, 0, 15); // 2023年1月15日
    const months = 11;
    const result = get_nextmonth_date(date, months);
    expect(result).toEqual(new Date(2023, 11, 31)); // 2023年12月の最終日
  });

  // 他にも異なる日付や月数でテストを追加することができます。
});
