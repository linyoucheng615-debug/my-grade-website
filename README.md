# Grade Website

這是一個以學生學習管理為核心的 Next.js 專案，涵蓋學生端與老師後台兩大模組，整合成績、上課紀錄、獎勵點數、學費、行事曆與進度表等功能。

## 專案簡介

本專案主要提供以下兩種角色的使用場景：

- 學生端：登入後可檢視個人學習進度、成績走勢、上課紀錄、學費明細、點數兌換與背包。
- 老師端：可管理學生資料、新增/編輯成績、處理課程紀錄、調整課程安排、管理獎勵商品與行事曆。

這個網站的核心特色是將教學管理與學生互動集中在一個平台中，並透過 Supabase 作為資料庫與後端資料存取層。

## 技術棧

- Next.js 16
- React 19
- TypeScript
- Supabase
- Recharts
- Framer Motion
- Lucide React
- Tailwind CSS

## 主要功能

### 學生端

- 登入與個人化儀表板
- 上課紀錄查詢與詳細內容檢視
- 各科成績趨勢圖表
- 學費明細與月份統計
- 獎勵點數累積與兌換
- 背包/使用兌換商品
- 個人行事曆與固定課程安排

### 老師端

- 學生列表與登入管理
- 成績新增、查詢、統計
- 課程/作業/進度紀錄管理
- 教學行事曆與調課功能
- 獎勵商品上架與點數核銷
- 進度表規劃與學生缺課檢測
- 成績低於門檻、缺席提醒等儀表板資訊

## 專案結構

```text
grade-website/
├── app/
│   ├── admin/
│   │   └── page.tsx            # 老師後台主協調頁面 (Orchestrator)
│   ├── globals.css             # 全域樣式
│   ├── layout.tsx              # 頂層 Layout（含 ToastProvider）
│   └── page.tsx                # 學生登入/儀表板頁面
├── components/
│   ├── admin/                  # 後台模組化功能元件群
│   │   ├── adminTheme.ts       # 後台主題與樣式生成函式
│   │   ├── HistoryList.tsx     # 共用歷史紀錄列表（含確認刪除）
│   │   ├── TodayDashboard.tsx  # 今日總覽與警示通知
│   │   ├── ClassLogSection.tsx # 上課紀錄與進度帶入
│   │   ├── GradeSection.tsx    # 成績管理與驗證
│   │   ├── PointSection.tsx    # 點數增扣與明細
│   │   ├── RewardShopAdmin.tsx # 福利社商品管理
│   │   ├── CalendarSection.tsx # 教學行事曆與調課
│   │   ├── TuitionSection.tsx  # 學費結算與一鍵複製
│   │   ├── ReportSection.tsx   # 成績趨勢折線圖與科目均分
│   │   ├── CoursePlannerSection.tsx # 段考規劃（Batch Upsert）
│   │   └── StudentSettingsSection.tsx # 學生資料與個別鐘點費設定
│   └── ui/                     # 通用互動 UI
│       ├── Toast.tsx           # 現代化提示 Toast 系統
│       └── ConfirmModal.tsx    # 現代化確認對話框
├── lib/
│   ├── constants.ts            # 全域常數與科目定義
│   ├── dateUtils.ts            # Asia/Taipei (UTC+8) 時區工具函式
│   └── supabaseClient.ts       # 安全統一的 Supabase 客戶端
├── types/
│   └── database.ts             # 10 張 Supabase 資料表的 TypeScript 型別
├── public/
├── README.md
├── OPTIMIZATION_PROPOSAL.md    # 完整優化與重構提案紀錄
├── eslint.config.mjs
├── next-env.d.ts
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── tsconfig.json
└── .gitignore
```

## 啟動方式

1. 安裝依賴

```bash
npm install
```

2. 設定環境變數

於專案根目錄建立 `.env.local`：

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. 啟動開發伺服器

```bash
npm run dev
```

4. 開啟瀏覽器

```text
http://localhost:3000
```

## 進入系統

- 學生入口：`/`
- 老師後台：`/admin`

## 資料庫與架構

本專案使用 Supabase 託管資料，包含以下主要資料表：
- `students`：學生基本資料與登入認證
- `teachers`：教師帳號與權限
- `class_logs`：課堂進度與作業紀錄
- `grades`：考試分數與單元成績
- `point_logs`：點數增扣明細
- `subject_rates`：學生個別科目鐘點費設定
- `rewards`：福利社兌換商品
- `student_inventory`：學生已兌換背包物品
- `calendar_events`：行事曆課程安排與請假排除紀錄
- `course_plans`：段考進度每週規劃矩陣

---

若你要我繼續，我也可以再幫你把這個網站進一步整理成：

- 更完整的多語言 README
- 專案架構圖
- Supabase 資料表說明文件
- 部署流程文件