
export const translations = {
    en: {
        common: {
            loading: "Loading...",
            back: "Back",
            save: "Save",
            cancel: "Cancel",
            delete: "Delete",
            edit: "Edit",
            new: "New",
            confirmDelete: "Are you sure you want to delete this?",
            success: "Success",
            error: "Error",
            welcome: "Welcome",
            logout: "Sign Out",
            unknown: "Unknown"
        },
        home: {
            customerTitle: "I'm a Customer",
            customerDesc: "Dined with us? Find your restaurant, take a survey, and WIN prizes!",
            startSurvey: "Start Survey",
            merchantTitle: "I'm a Merchant",
            merchantDesc: "Log in to manage your restaurant's surveys, lotteries, and view customer insights.",
            merchantAccess: "Merchant Access"
        },
        auth: {
            loginTitle: "Merchant Login",
            registerTitle: "Register Restaurant",
            subTitle: "Manage surveys & lotteries",
            restaurantName: "Restaurant Name",
            username: "Username",
            password: "Password",
            roleOwner: "I am a Chain/Group Owner (Manage multiple stores)",
            loginBtn: "Sign In",
            registerBtn: "Create Account",
            toRegister: "New here? Register Restaurant",
            toLogin: "Already have an account? Login",
            backHome: "Back to Home",
            sessionExpired: "Session expired or invalid.",
            returnLogin: "Return to Login"
        },
        dashboard: {
            title: "MERCHANTHUB",
            sysAdmin: "System Admin",
            tabHome: "Home", // New
            tabSurveys: "Surveys",
            tabLotteries: "Lotteries",
            tabAnalytics: "Analytics",
            tabCustomerView: "Customer View",
            tabRestaurants: "Restaurants",
            tabSettings: "Settings",
            settingsTitle: "Account Settings",
            updateSuccess: "Account updated successfully",
            backendError: "Backend Error. Is Python running on port 8001?",
            allRestaurants: "(All Restaurants)",
            owner: "Owner",
            assignedTo: "Assigned To:",

            // Home Dashboard (New)
            sectionOverview: "My Restaurant",
            sectionToday: "Today's Pulse",
            sectionHistory: "Historical Statistics",
            totalRestaurants: "Total Restaurants",
            totalSurveys: "Total Surveys",
            totalResponses: "Total Responses",
            totalOwners: "Total Owners",
            viewModeMonth: "Daily View (Select Month)",
            viewModeYear: "Monthly View (Select Year)",
            responsesToday: "Daily / Last Day",
            responsesMonth: "Period Total",
            vsYesterday: "vs Day Before",
            vsLastMonth: "vs Prev Period",
            chartTitle: "Response Trend",

            // Restaurant Mgmt
            addNewRestaurant: "Add New Restaurant",
            editRestaurant: "Edit Restaurant Credentials",
            restaurantList: "Your Restaurants",
            credsTitle: "Manager Credentials",
            credsDesc: "Share these with your store manager to login.",

            // Survey Edit
            editSurvey: "Edit Survey",
            surveyName: "Survey Name",
            noLottery: "No Lottery Linked",
            question: "QUESTION",
            answerType: "ANSWER TYPE",
            typeChoice: "Single Choice",
            typeMulti: "Multi-Select",
            typeText: "Text Input",
            options: "OPTIONS",
            addOption: "Add Option",
            addOther: "Add \"Other\" Option",
            otherPlaceholder: "Other (User types answer...)",
            textHint: "Customer will see a text box to type their answer freely.",
            addQuestion: "Add Question",
            deleteQuestionConfirm: "Note: Deleting this question will remove its responses from the charts. Are you sure?",

            // QR Section
            customerAccess: "Customer Access",
            downloadQr: "Download QR",
            directLink: "Direct Survey Link",
            qrHelp: "Print the QR code or share the link. Customers scanning this will skip the restaurant selection screen and go directly to this specific survey.",

            // Lottery Edit
            editLottery: "Edit Lottery",
            lotteryName: "Lottery Name",
            prizes: "PRIZES",
            prob: "Prob %",
            addPrize: "Add Prize",
            sharedLottery: "All Stores (Shared)",

            // Analytics
            selectSurvey: "Select Survey",
            loadReport: "Load Report",
            otherResponses: "Other Responses",
            noTextResponses: "No text responses yet.",
            noData: "Select a survey to see data.",
            smartMergeActive: "Smart Merge Active",
            mergedTag: "merged",
            mergedTooltip: "responses recovered from old versions",
            unlinkedTitle: "Unlinked / Historical Data",
            dataDisclaimer: "Data Disclaimer",
            dataDisclaimerDesc: "The following data belongs to questions that were deleted or significantly modified and could not be automatically merged into the charts above.",
            orphanedResponses: "Orphaned Responses",

            // AI
            aiAnalyze: "Smart AI Analysis",
            aiAnalyzing: "Gemini is thinking...",
            aiTitle: "DinePulse AI Insight",
            aiDisclaimer: "Generated by Gemini AI. Check data for accuracy."
        },
        customer: {
            selectRestaurant: "Select Restaurant",
            whereDining: "Where are you dining today?",
            noRestaurants: "No restaurants found.",
            chooseDifferent: "Choose different restaurant",
            selectSurvey: "Select Survey",
            multipleSurveys: "has multiple surveys available.",
            questionsCount: "Questions",
            backStart: "Back to start",
            submitNext: "Submit & Next",
            pleaseAnswer: "Please answer all questions",
            otherSpecify: "Other (please specify)...",
            typeAnswer: "Type your answer here...",

            // Wheel
            goodLuck: "GOOD LUCK...",
            spinNow: "SPIN NOW",
            congrats: "Congratulations!",
            thankYou: "Thank You!",
            backHome: "Back to Home",

            // Messages
            wonMsg: "You won",
            noWinMsg: "Better luck next time.",
            showToStaff: "Please show this page to staff to claim your prize."
        }
    },
    zh: {
        common: {
            loading: "加载中...",
            back: "返回",
            save: "保存",
            cancel: "取消",
            delete: "删除",
            edit: "编辑",
            new: "新建",
            confirmDelete: "确定要删除吗？",
            success: "成功",
            error: "错误",
            welcome: "欢迎",
            logout: "退出登录",
            unknown: "未知"
        },
        home: {
            customerTitle: "我是顾客",
            customerDesc: "用餐愉快！找到您的餐厅，参与问卷调查，赢取大奖！",
            startSurvey: "开始问卷",
            merchantTitle: "我是商家",
            merchantDesc: "登录以管理您的餐厅问卷、抽奖活动并查看数据报表。",
            merchantAccess: "商家入口"
        },
        auth: {
            loginTitle: "商家登录",
            registerTitle: "注册餐厅",
            subTitle: "管理问卷与抽奖活动",
            restaurantName: "餐厅/品牌名称",
            username: "用户名",
            password: "密码",
            roleOwner: "我是连锁/多店老板 (管理多家门店)",
            loginBtn: "登录",
            registerBtn: "创建账号",
            toRegister: "新用户？注册餐厅账号",
            toLogin: "已有账号？立即登录",
            backHome: "返回首页",
            sessionExpired: "会话已过期或无效。",
            returnLogin: "返回登录"
        },
        dashboard: {
            title: "商家中心",
            sysAdmin: "系统管理员",
            tabHome: "主页", // New
            tabSurveys: "问卷管理",
            tabLotteries: "抽奖管理",
            tabAnalytics: "数据分析",
            tabCustomerView: "顾客预览",
            tabRestaurants: "门店管理",
            tabSettings: "系统设置",
            settingsTitle: "账号设置",
            updateSuccess: "账号信息更新成功",
            backendError: "后端连接错误。请确认 Python 服务是否运行在 8001 端口。",
            allRestaurants: "(所有餐厅)",
            owner: "拥有者",
            assignedTo: "所属门店:",

            // Home Dashboard (New)
            sectionOverview: "我的餐厅",
            sectionToday: "今日数据",
            sectionHistory: "历史数据统计",
            totalRestaurants: "餐厅数量",
            totalSurveys: "问卷数量",
            totalResponses: "回复总数",
            totalOwners: "老板账号",
            viewModeMonth: "按日查看 (选择月份)",
            viewModeYear: "按月查看 (选择年份)",
            responsesToday: "单日数据 / 当日",
            responsesMonth: "本期总数",
            vsYesterday: "较前一日",
            vsLastMonth: "较上期",
            chartTitle: "回复趋势",

            // Restaurant Mgmt
            addNewRestaurant: "添加新门店",
            editRestaurant: "修改门店账号信息",
            restaurantList: "您的门店列表",
            credsTitle: "店长登录凭证",
            credsDesc: "请将此用户名和密码分享给该店店长。",

            // Survey Edit
            editSurvey: "编辑问卷",
            surveyName: "问卷名称",
            noLottery: "未关联抽奖",
            question: "问题",
            answerType: "回答类型",
            typeChoice: "单选题",
            typeMulti: "多选题",
            typeText: "文本输入",
            options: "选项",
            addOption: "添加选项",
            addOther: "添加“其他”选项",
            otherPlaceholder: "其他 (用户自行输入...)",
            textHint: "顾客将看到一个文本框以自由输入回答。",
            addQuestion: "添加问题",
            deleteQuestionConfirm: "注意：删除问题后，相关回复将从现有图表中移除（移至历史数据）。确定要删除吗？",

            // QR Section
            customerAccess: "顾客入口",
            downloadQr: "下载二维码",
            directLink: "问卷直链",
            qrHelp: "打印二维码或分享链接。扫描此二维码的顾客将跳过餐厅选择页面，直接进入此问卷。",

            // Lottery Edit
            editLottery: "编辑抽奖",
            lotteryName: "活动名称",
            prizes: "奖品列表",
            prob: "概率 %",
            addPrize: "添加奖品",
            sharedLottery: "所有门店通用 (共享)",

            // Analytics
            selectSurvey: "选择问卷",
            loadReport: "加载报表",
            otherResponses: "其他回答",
            noTextResponses: "暂无文本回答。",
            noData: "请选择一个问卷以查看数据。",
            smartMergeActive: "智能合并已启用",
            mergedTag: "已合并",
            mergedTooltip: "条来自旧版本问题的回答已找回",
            unlinkedTitle: "未关联 / 历史数据",
            dataDisclaimer: "数据说明",
            dataDisclaimerDesc: "以下数据属于已被删除或被大幅修改的问题，系统无法将其自动合并到上方的图表中。",
            orphanedResponses: "残留回答",

            // AI
            aiAnalyze: "智能 AI 分析",
            aiAnalyzing: "Gemini 正在思考...",
            aiTitle: "DinePulse AI 洞察",
            aiDisclaimer: "由 Gemini AI 生成。请核实数据准确性。"
        },
        customer: {
            selectRestaurant: "选择餐厅",
            whereDining: "您今天在哪里用餐？",
            noRestaurants: "未找到餐厅。",
            chooseDifferent: "选择其他餐厅",
            selectSurvey: "选择问卷",
            multipleSurveys: "有多个可用的问卷。",
            questionsCount: "个问题",
            backStart: "返回开始",
            submitNext: "提交并继续",
            pleaseAnswer: "请回答所有问题",
            otherSpecify: "其他 (请注明)...",
            typeAnswer: "请输入您的回答...",

            // Wheel
            goodLuck: "祝你好运...",
            spinNow: "开始抽奖",
            congrats: "恭喜中奖！",
            thankYou: "谢谢参与！",
            backHome: "返回首页",

            // Messages
            wonMsg: "你赢得了",
            noWinMsg: "很遗憾，这次没有中奖。",
            showToStaff: "请将此页面向工作人员展示获取奖品"
        }
    }
};

export type Language = 'en' | 'zh';
