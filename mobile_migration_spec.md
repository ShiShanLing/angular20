# Mobile Migration Specification (Angular to React Native)

This document provides a detailed functional overview of the "Angular 19 Tools & Games" application. It is intended to serve as a comprehensive reference for re-implementing these features in React Native for Android and iOS.

---

## 1. Global Features & Architecture

- **Navigation**: Sidebar-based navigation with categories. (Mobile should use Drawer or Tab navigation).
- **Data Persistence**: Use `AsyncStorage` (React Native) equivalent to `localStorage`. Most tools save their state automatically on change.
- **Styling**: Modern, clean UI (Ant Design mobile equivalent or consistent theme).
- **Icons**: Use a consistent icon set (e.g., Material Icons or Lucide).

---

## 2. Feature Categories

### A. 财务工具 (Finance Tools)

1.  **房贷计算 (Mortgage Calculator)**:
    - **Inputs**: Loan type (Commercial/Provident Fund), total amount, term (years), interest rate.
    - **Logic**: Support both Equal Installment (等额本息) and Equal Principal (等额本金).
    - **Enhanced Feature**: "Provident Fund Offset Case" (公积金冲还贷压力测试).
    - **Outputs**: Monthly payment, total interest, amortization schedule.
2.  **个税计算 (Salary/Tax Calculator)**:
    - **Inputs**: Gross salary, social security/insurance bases, special deductions (专项附加扣除).
    - **Logic**: 2024+ China individual income tax rules (tiered rates).
    - **Outputs**: Net salary, total tax, insurance breakdown.
3.  **记账分期 (Accounting & Installments)**:
    - **Inputs**: Total amount, number of periods, fee rate per period or total fee.
    - **Logic**: Calculate actual APR (Annual Percentage Rate) based on installment fees.
    - **Outputs**: Monthly payment, total cost, effective annual rate.
4.  **订阅管理 (Subscription Manager)**:
    - **Features**: List of subscriptions (Netflix, Spotify, etc.) with price, billing cycle (monthly/yearly).
    - **Outputs**: Total monthly/annual expenditure projection.
5.  **攒钱计划 (Saving Plan)**:
    - **Inputs**: Target amount, current savings, expected monthly contribution, interest rate.
    - **Logic**: Compound interest calculation to project time to reach target.

### B. 身体健康 (Health & Body)

1.  **BMI/体脂 (BMI & Body Fat)**:
    - **Inputs**: Height, weight, age, gender, waist circumference (optional for body fat).
    - **Outputs**: BMI value, health category (Underweight/Normal/Overweight), Body Fat % estimation.
2.  **饮水提醒 (Water Reminder)**:
    - **Inputs**: Daily goal (ml), amount per cup, reminder time slots.
    - **Feature**: **Export to Calendar (.ics)**. Generate a calendar file with multiple reminder events based on user input.
3.  **体重追踪 (Weight Tracker)**:
    - **Features**: Log weights with dates.
    - **Visualization**: Simple trend line (use `react-native-echarts` or similar).
4.  **睡眠分析 (Sleep Analysis)**:
    - **Inputs**: Sleep time, wake time.
    - **Outputs**: Sleep duration, "Sleep Cycles" analysis (90min per cycle), suggested sleep/wake times for optimal recovery.

### C. 效率工具 (Efficiency Tools)

1.  **时间效率 (Time Efficiency)**:
    - **Pomodoro**: Timer (25/5/15min), Work/Break modes, round counter.
    - **Todo List**: Daily task list with completion status. Persistence is per-day.
    - **Deadline Countdown**: Input target date, total required hours, and hours available per day.
    - **Logic**: Calculate if the goal is "Feasible" (来得及) based on remaining time vs. required effort.
2.  **天气预报 (Weather Forecast)**:
    - **API**: [Open-Meteo](https://open-meteo.com/).
    - **Features**: 24-hour hourly trend (Temperature), 7-day daily forecast.
    - **Caching**: **3-hour Cache**. Request results (Geocoding + Forecast) are cached per city for 3 hours to reduce API calls.
3.  **万年历 (Lunar Calendar)**:
    - **Features**: Traditional Lunar calendar dates, Month/Year navigation.
    - **Special Data**: 2026 China Holiday/Workday markers (Holiday schedule).
4.  **文本处理 (Text Tools)**:
    - **Features**: Case conversion, whitespace removal, character count, base64 encode/decode.
5.  **开发助手 (Dev Tools)**:
    - **Features**: JSON formatter/validator, URL encode/decode, Timestamp converter.

### D. 休闲游戏 (Casual Games)

_Note: These should have a "Arcade" layout on mobile (Play in Portrait/Landscape)._

1.  **贪吃蛇 (Snake)**:
    - **Logic**: Discrete grid-based movement, speed increases, score tracking.
    - **Input**: Virtual D-pad or swipe gestures.
2.  **俄罗斯方块 (Tetris)**:
    - **Logic**: Rotation, line clearing, scoring, "Next Piece" preview.
    - **Input**: Virtual buttons for Rotate, Left, Right, Soft Drop, Hard Drop.

---

## 3. Key Implementation Notes for the "Other Me"

- **State Management**: Use `localStorage` equivalents everywhere. The user hates losing input data when switching between tools.
- **Centering UI**: On mobile, use `Card` components for tools. For games, use full-screen containers with centered elements.
- **Weather API**: The Geocoding API (`geocoding-api.open-meteo.com`) is used first to get Lat/Lon from city name, then the Forecast API is called.
- **Lunar Date**: Requires a library or utility function to convert Solar to Lunar dates (refer to `lunar.utils.ts` logic).
