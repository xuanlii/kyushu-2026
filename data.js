/**
 * 2026 九州跨世代自由行與行程評估系統 - 核心資料庫 (Kyushu Trip Data)
 * 深度整合《九州五日行程深度評估報告》：
 * - 方案 A（原 DM 5日福岡進出拉車版）
 * - 方案 B（極致推薦：福岡進/熊本出 雙點進出自駕版）
 * - 方案 C（中九州舒活精華 熊本進/熊本出版）
 * - 熟齡長輩 3 日悠閒慢遊版
 * - 年輕潮流美拍 4 日極速版
 * 
 * 包含 40~60 歲長輩（步數、坡度、輪椅/柺杖友善、休息座椅、溫泉、清淡熱湯）
 * 25~35 歲年輕人（IG 美拍、打卡美食、潮流商場、特色列車）
 * 10 個月大嬰兒（母嬰室、70°C 熱水、推車動線、背巾替換、車程耐受度）
 */

const KYUSHU_METADATA = {
  id: "kyushu-2026-trip",
  title: "2026 九州跨世代自由行規劃工作室 & 深度行車評估",
  subTitle: "KYUSHU ROAD TRIP PLANNER & MULTI-GEN EVALUATION SYSTEM",
  version: "2.0.0",
  targetPeriod: "2026/02/24 (二) - 2026/02/28 (六) 228連假黃金期",
  currencyRateJPYtoTWD: 0.215, // 預設 1 JPY = 0.215 TWD
  
  // 核心對照方案摘要
  schemes: [
    {
      id: "scheme-a",
      name: "方案 A：原 DM 團體行程 福岡進/福岡出",
      airline: "星宇航空 (JX840/JX841)",
      flightRoute: "TPE ⇄ FUK (單點往返)",
      costEst: "團費 NT$ 43,500 (全包)",
      maxDayDriveHours: "7.5 ~ 8.0 小時 (Day 2)",
      totalDriveKm: "約 920 ~ 1,000 km",
      infantScore: 1, // 1星
      elderScore: 1,  // 1星
      overallScore: 2, // 2星
      statusTag: "⚠️ 高風險折返",
      badgeClass: "badge-danger",
      summary: "Day 2 橫跨福岡、別府、湯布院至宮崎高千穗峽再折返別府，單日拉車近 8 小時（440km）。嬰兒無汽座手抱極度危險與暈車，長輩膝蓋受損下切陡坡危險。",
      downgradeAdvice: "若維持此行程：Day 2 高千穗峽長輩與嬰兒切勿下切真名井瀑布，留在上方商場；Day 3 柳川遊船放棄登船，於立花邸平坦庭園等候。"
    },
    {
      id: "scheme-b",
      name: "方案 B：自駕/包車 雙點進出 (極致推薦)",
      airline: "華航或星宇 (直飛)",
      flightRoute: "FUK進 / KMJ出 (Open-Jaw 不走回頭路)",
      costEst: "機票約 NT$ 21,000 + 自駕租車與住宿",
      maxDayDriveHours: "1.5 ~ 2.0 小時",
      totalDriveKm: "約 480 ~ 520 km (節省 50% 車程)",
      infantScore: 5, // 5星
      elderScore: 5,  // 5星
      overallScore: 5, // 5星
      statusTag: "🌟 極致黃金路線",
      badgeClass: "badge-success",
      summary: "福岡進、熊本出。一路順向南下：福岡 ➔ 門司港 ➔ 別府 ➔ 湯布院 ➔ 阿蘇/高千穗 ➔ 熊本城 ➔ 柳川 ➔ 熊本機場。每日車程平均僅 1.5~2 小時，嬰兒長輩零負擔！",
      downgradeAdvice: "順暢無阻，全景點皆有充裕時間享受無障礙與育嬰設施，無痛直飛返台。"
    },
    {
      id: "scheme-c",
      name: "方案 C：自駕/包車 熊本單點進出",
      airline: "華航或星宇 (直飛)",
      flightRoute: "KMJ ⇄ KMJ (中九州核心直達)",
      costEst: "機票約 NT$ 20,000 ~ 23,000 + 車宿",
      maxDayDriveHours: "2.0 ~ 2.5 小時",
      totalDriveKm: "約 550 ~ 600 km",
      infantScore: 4, // 4星
      elderScore: 4,  // 4星
      overallScore: 4, // 4星
      statusTag: "♨️ 中九州舒活精華",
      badgeClass: "badge-primary",
      summary: "直飛熊本機場，位處九州中心。至高千穗峽僅 60~65 km (1.5h)，輻射阿蘇火山、黑川溫泉、別府與熊本城，徹底免除北部福岡的大長征。",
      downgradeAdvice: "若長輩容易疲累，可將別府縮減，改為深度的「黑川秘境溫泉＋阿蘇大自然慢活」。"
    }
  ],

  // 必備防護清單（長輩 + 嬰兒特化）
  careChecklist: {
    safetyStrategy: [
      {
        spot: "宮崎高千穗峽",
        risk: "步道由上方停車場下切至真名井瀑布落差逾 50 米，石階潮濕陡峭無電梯與完整扶手，懷抱 10 個月嬰兒或拄杖極易滑跌。",
        solution: "【景點降級策略】長輩與嬰兒切勿下切峽谷。留在上方「高千穗大橋休息站」、高千穗水族館、景觀咖啡店享受溪谷全景，平路散步並備有座椅與洗手間。"
      },
      {
        spot: "福岡柳川遊船",
        risk: "柳川扁舟為無遮蔽、無護欄之低矮木造搖櫓船，需脫鞋席地深蹲入座，拄杖或膝關節退化長輩起坐極度艱難；好動嬰兒有落水風險。",
        solution: "【替代策略】長輩與幼兒可放棄乘船，由包車直接送往終點「立花邸 御花」參觀松濤園國名勝平坦庭園，於園內料亭享用熱蒸籠鰻魚飯（免受寒風與深蹲之苦）。"
      },
      {
        spot: "遊覽車長途拉車",
        risk: "原團體行程遊覽車多未配置嬰兒汽車安全座椅，需家長手抱 8 小時，高千穗與阿蘇山路連續彎道易引發嬰兒強烈哭鬧與長輩暈車。",
        solution: "【車位與包車】行前務必向旅行社或司機協調保留遊覽車前 2～3 排座位（視野寬闊、底盤震動最輕微）；自駕則務必租借合格 0~4 歲 ISOFIX 後向安全座椅。"
      }
    ],
    gearList: [
      { category: "👶 10個月嬰兒必備", item: "人體工學減壓背巾", desc: "高千穗峽、熊本城石板坡、階梯處強制使用，嚴禁在陡坡硬推嬰兒車。" },
      { category: "👶 10個月嬰兒必備", item: "登機型輕量折疊推車", desc: "LaLaport、門司港、太宰府平坦路段使用，須具備單手秒收功能。" },
      { category: "👶 10個月嬰兒必備", item: "500ml 雙層真空保溫瓶 (維持 70°C)", desc: "早晨於飯店裝滿 70°C 熱水，符合 WHO 泡奶滅菌安全指引。" },
      { category: "👶 10個月嬰兒必備", item: "常溫副食品即食粥包 (3~4天份)", desc: "拉車或山區無寶寶餐時，於超商或保溫杯隔水加熱 3 分鐘即可食用。" },
      { category: "👶 10個月嬰兒必備", item: "幼兒常備藥品與防風披風", desc: "止瀉、退燒、抗過敏滴劑，九州 2 月山區冷風強勁，必備抗風連帽披風。" },
      { category: "🧓 40~60歲長輩必備", item: "Ta-Da Chair 折疊拐杖椅", desc: "1 秒瞬間展開成三腳座椅，高千穗景觀台、排隊等候隨時坐下休息緩解腰膝。" },
      { category: "🧓 40~60歲長輩必備", item: "四腳防滑減震手杖", desc: "提供下坡與青苔石階穩定四點支撐，減少膝關節負擔 40%。" },
      { category: "🧓 40~60歲長輩必備", item: "長輩個人常備慢性病藥品 & 溫水保溫瓶", desc: "降血壓藥、關節止痛消炎、胃藥，隨身攜帶溫熱水隨時補充水份。" },
      { category: "🧓 40~60歲長輩必備", item: "防滑保暖抓地健走鞋", desc: "日本神社碎石子路、別府海地獄蒸汽地表防滑防濕。" },
      { category: "📸 25~35歲年輕人必備", item: "高容量行動電源 (20000mAh)", desc: "整日拍攝 IG Reels / 美拍導航、隨身拍照不中斷。" },
      { category: "📸 25~35歲年輕人必備", item: "免稅護照隨身包 & 日幣現金小夾", desc: "LaLaport、天神免稅店退稅，神社御守與老鋪僅收現金。" }
    ]
  }
};

const KYUSHU_SPOTS = [
  {
    id: "fuk-airport",
    nameZh: "福岡機場 (FUK)",
    nameJa: "福岡空港",
    category: "transport",
    city: "福岡縣福岡市",
    lat: 33.5859,
    lng: 130.4507,
    defaultStayMins: 90,
    tags: ["機場", "交通樞紐", "免稅購物", "地鐵直達"],
    elderFit: {
      score: 9.2,
      steps: "🟢 低 (< 500步)",
      slope: "平坦無障礙",
      benches: "密集座椅",
      dining: "多樣日式定食熱湯",
      notes: "國際線設有完整無障礙電梯與輪椅借用，離市區僅 15~20 分鐘車程。"
    },
    youthFit: {
      score: 9.0,
      photoSpot: "展望台近距離看飛機起降、伴手禮街超好拍",
      food: "博多拉麵一蘭、三日月屋可頌麵包、福砂屋蜂蜜蛋糕",
      shopping: "免稅煙酒保養品、九州各地特產一站購足"
    },
    infantFit: {
      score: 9.5,
      stroller: "🟢 全程推車無阻",
      nursingRoom: "出境前後皆有五星級哺乳室、70°C熱水機、尿布台",
      notes: "通關快，出關至計程車/巴士站動線短，對嬰兒作息衝擊極小。"
    },
    desc: "九州最繁忙的國際門戶，緊鄰福岡市中心，具備無可比擬的地理便捷優勢。"
  },
  {
    id: "kmj-airport",
    nameZh: "熊本機場 (KMJ, 阿蘇熊本空港)",
    nameJa: "阿蘇くまもと空港",
    category: "transport",
    city: "熊本縣益城町",
    lat: 32.8372,
    lng: 130.8564,
    defaultStayMins: 90,
    tags: ["機場", "中九州核心", "全新航廈", "熊本熊周邊"],
    elderFit: {
      score: 9.5,
      steps: "🟢 低 (< 500步)",
      slope: "全新無障礙平坦木造航廈",
      benches: "熊本阿蘇檜木長椅與景觀休憩區",
      dining: "阿蘇赤牛丼、黑亭拉麵、太平燕清雅熱湯",
      notes: "全新落成航廈動線筆直寬敞，安檢與通關無長廊長征。"
    },
    youthFit: {
      score: 9.4,
      photoSpot: "航廈滿滿巨型萌熊 Kumamon 裝置藝術、木造幾何頂棚",
      food: "熊本限定赤牛漢堡、菅乃屋馬肉壽司、ASO MILK 頂級霜淇淋",
      shopping: "熊本熊限定商品、阿蘇限定純天然起司與點心"
    },
    infantFit: {
      score: 9.8,
      stroller: "🟢 完美無障礙推車環境",
      nursingRoom: "全新獨立育嬰哺乳室、熱水機、洗屁屁台",
      notes: "中九州核心，去高千穗僅需 1.3 小時，徹底消滅 Day 2 痛苦拉車的戰略關鍵！"
    },
    desc: "2023年全新完工的木造綠能航廈，位處中九州心臟地帶，是前往高千穗與阿蘇的最佳起點。"
  },
  {
    id: "fukuoka-hotel-hakata",
    nameZh: "福岡市區飯店 (博多/天神商圈)",
    nameJa: "博多・天神エリアホテル",
    category: "hotel",
    city: "福岡縣福岡市",
    lat: 33.5902,
    lng: 130.4206,
    defaultStayMins: 60,
    tags: ["飯店", "市中心", "交通便利", "美食夜市"],
    elderFit: {
      score: 9.0,
      steps: "🟢 極低",
      slope: "平坦大樓與無障礙通道",
      benches: "飯店大廳休閒沙發",
      dining: "博多水瀧雞肉鍋、白濁高湯溫熱滋補",
      notes: "方便長輩午後回房小憩充電，夜間安靜舒適。"
    },
    youthFit: {
      score: 9.5,
      photoSpot: "博多車站璀璨點燈、中洲那珂川河畔屋台倒影",
      food: "中洲屋台燒鳥、極味屋石燒和牛漢堡排、博多牛腸鍋",
      shopping: "阪急百貨、天神PARCO、Bic Camera 電器行"
    },
    infantFit: {
      score: 9.2,
      stroller: "🟢 電梯直達客房，推車進出方便",
      nursingRoom: "房內私人衛浴可悠閒泡奶與水洗副食品",
      notes: "周邊松本清與唐吉訶德補充尿布濕紙巾超方便。"
    },
    desc: "九州自由行的大本營，無論是博多站周邊或是天神商圈，均具備極高的生活機能。"
  },
  {
    id: "miyawaka-hotel",
    nameZh: "宮若市溫泉飯店 (ROUTE-INN / 脇田溫泉)",
    nameJa: "ホテルルートイン宮若・脇田温泉",
    category: "hotel",
    city: "福岡縣宮若市",
    lat: 33.7224,
    lng: 130.6095,
    defaultStayMins: 60,
    tags: ["溫泉飯店", "團體行程常配", "自然山林", "遠離塵囂"],
    elderFit: {
      score: 8.5,
      steps: "🟢 低 (< 600步)",
      slope: "平緩坡道與電梯",
      benches: "大浴場旁休息區與榻榻米",
      dining: "飯店日式溫泉御膳、熱豆腐鍋",
      notes: "具備人工天然溫泉大浴場，長輩可泡湯舒緩飛行疲勞。"
    },
    youthFit: {
      score: 6.8,
      photoSpot: "日式露天風呂與山林夜景",
      food: "傳統溫泉定食",
      shopping: "周邊無大型商城，僅有飯店土產小賣部"
    },
    infantFit: {
      score: 7.5,
      stroller: "🟡 飯店內可推車，但周邊無步道",
      nursingRoom: "房內可泡奶，大眾池嬰兒不可下水",
      notes: "從機場拉車需約 50 分鐘，比市區稍遠。"
    },
    desc: "位於福岡與北九州之間的山間清幽地帶，原團體行程常安排此處作為第一晚下榻點。"
  },
  {
    id: "beppu-sea-jigoku",
    nameZh: "別府海地獄 (海地獄 / 別府八湯)",
    nameJa: "別府地獄めぐり 海地獄",
    category: "attraction",
    city: "大分縣別府市",
    lat: 33.3155,
    lng: 131.4752,
    defaultStayMins: 75,
    tags: ["國指定名勝", "鈷藍色溫泉", "足湯", "溫泉蛋"],
    elderFit: {
      score: 9.3,
      steps: "🟢 低 (約 1,000步)",
      slope: "平緩木棧道與平整柏油路，輪椅手杖皆宜",
      benches: "免費地熱足湯區設有整排木質座席",
      dining: "極上地獄蒸布丁、地熱溫泉蛋、熱麥茶",
      notes: "足湯水質極佳，長輩泡腳 15 分鐘可瞬間消除膝關節僵硬與疲憊。"
    },
    youthFit: {
      score: 9.2,
      photoSpot: "98°C 鈷藍色泉水噴發壯麗白煙、熱帶大鬼蓮花池",
      food: "地獄蒸極上布丁、溫泉汽水、柚子胡椒仙貝",
      shopping: "別府名物「海地獄 Enman」入浴劑、大分香母酢糖"
    },
    infantFit: {
      score: 8.8,
      stroller: "🟢 90% 平坦無障礙坡道可推車",
      nursingRoom: "伴手禮館旁設有哺乳室與尿布台",
      notes: "蒸氣較大時請留意推車遠離出氣孔，避免高溫蒸氣迎面直吹。"
    },
    desc: "別府八大地獄中規模最大且最美麗的國指定名勝，如蔚藍大海般的鈷藍色泉水冒出滾滾地熱。"
  },
  {
    id: "beppu-onsen-hotel",
    nameZh: "別府溫泉旅宿街 / 竹瓦溫泉",
    nameJa: "別府温泉ホテル・竹瓦温泉",
    category: "hotel",
    city: "大分縣別府市",
    lat: 33.2778,
    lng: 131.5036,
    defaultStayMins: 90,
    tags: ["日本第一湧泉", "海景溫泉", "砂湯", "會席料理"],
    elderFit: {
      score: 9.8,
      steps: "🟢 低 (< 800步)",
      slope: "無障礙坡道，飯店均備電梯",
      benches: "露天風呂休息區、大堂海景沙發",
      dining: "大分豐後牛、關竹莢魚、關鯖魚刺身、溫泉熱御膳",
      notes: "長輩最愛的極致溫泉療癒，多樣泉質具備改善神經痛與關節痛功效。"
    },
    youthFit: {
      score: 8.9,
      photoSpot: "別府灣璀璨晨曦倒影、竹瓦溫泉百年唐破風古典木造外觀",
      food: "別府冷麵、在地名物「東洋軒」元祖炸雞天婦羅",
      shopping: "別府竹細工工藝品、明礬溫泉湯之花"
    },
    infantFit: {
      score: 8.5,
      stroller: "🟢 飯店室內皆可推車",
      nursingRoom: "客房私人浴池可調溫給寶寶泡溫水澡",
      notes: "嬰兒肌膚嬌嫩，大眾池泉質偏酸或高溫，建議於客房內以溫水盆浴洗沐。"
    },
    desc: "全日本湧泉量第一的溫泉之鄉，依山傍海，擁有濃厚的傳統湯治文化。"
  },
  {
    id: "yufuin-kinrin-lake",
    nameZh: "湯布院金鱗湖 & 湯之坪街道",
    nameJa: "由布院 金鱗湖・湯の坪街道",
    category: "attraction",
    city: "大分縣由布市",
    lat: 33.2662,
    lng: 131.3696,
    defaultStayMins: 105,
    tags: ["晨霧絕景", "溫泉小鎮", "文青甜點", "由布岳"],
    elderFit: {
      score: 8.8,
      steps: "🟡 中度 (約 1,800~2,500步)",
      slope: "沿湖步道平緩，湯之坪石板路平整",
      benches: "湖畔咖啡座與林間木椅充足",
      dining: "古式手打蕎麥麵、地雞陶板燒、清雅熱豆乳",
      notes: "建議慢步漫遊，湖畔有水上鳥居天祖神社，風景幽靜典雅。"
    },
    youthFit: {
      score: 9.8,
      photoSpot: "清水與溫泉交會產生的夢幻晨霧、湖中水中鳥居、由布岳山景",
      food: "B-Speak 頂級生乳捲、金賞可樂餅、Milch 半熟起司蛋糕",
      shopping: "童話村 Yufuin Floral Village、史努比茶屋、橡子共和國"
    },
    infantFit: {
      score: 8.2,
      stroller: "🟡 湯之坪街道可推車，但假日下午人潮擁擠需放慢速度",
      nursingRoom: "由布院車站資訊中心及大型咖啡館備有尿布台",
      notes: "山區午後氣溫偏低，記得為寶寶備齊防風保暖衣物。"
    },
    desc: "九州最受女性與文青喜愛的夢幻溫泉小鎮，湖底同時湧出溫泉與清水，秋冬晨霧繚繞宛如仙境。"
  },
  {
    id: "yufuin-no-mori-train",
    nameZh: "由布院之森觀光特急列車",
    nameJa: "特急 ゆふいんの森",
    category: "attraction",
    city: "大分縣由布市",
    lat: 33.2645,
    lng: 131.3601,
    defaultStayMins: 60,
    tags: ["觀光列車", "綠色經典", "鐵道迷", "列車便當"],
    elderFit: {
      score: 9.0,
      steps: "🟢 極低 (車上舒適就座)",
      slope: "高地台車廂需上下幾階踏步，長輩上下車稍加攙扶即可",
      benches: "高雅森林風木質天鵝絨沙發座椅",
      dining: "由布院之森特製熱茶與精緻四季御便當",
      notes: "全程舒適安穩，透過大面車窗欣賞慈恩瀑布與耳納連山美景。"
    },
    youthFit: {
      score: 9.6,
      photoSpot: "復古墨綠色圓弧車頭、沙龍車廂乘務員拍照紀念立牌",
      food: "車廂限定大分柚子冰淇淋、由布院在地手工啤酒",
      shopping: "JR 九州限量由布院之森鐵道模型、紀念鑰匙圈"
    },
    infantFit: {
      score: 8.0,
      stroller: "🟡 上車前需將推車折疊收納於行李架",
      nursingRoom: "列車第 2 車廂設有無障礙洗手間與尿布更換台",
      notes: "火車行駛平穩有節奏，是長途拉車時讓寶寶安穩午睡的最佳環境。"
    },
    desc: "JR 九州極富盛名的度假觀光列車，墨綠色復古車身穿梭於森林田野間，帶來難忘的鐵道浪漫體驗。"
  },
  {
    id: "takachiho-gorge",
    nameZh: "宮崎高千穗峽 & 真名井瀑布",
    nameJa: "高千穂峡・真名井の滝",
    category: "attraction",
    city: "宮崎縣高千穗町",
    lat: 32.7013,
    lng: 131.3005,
    defaultStayMins: 120,
    tags: ["日本百選名瀑", "玄武岩峽谷", "神話之鄉", "划船租賃"],
    elderFit: {
      score: 4.5,
      steps: "🔴 嚴苛 (> 3,000步陡坡階梯)",
      slope: "🔴 下切峽谷石階高低落差極大、濕滑無電梯，拄杖長輩極高風險！",
      benches: "峽谷步道中途無長椅，僅上方御鹽井停車場有休息座",
      dining: "流水素麵千穗之家、神樂烏龍麵、清淡烤香魚",
      notes: "⚠️【長輩降級策略】：長輩切勿走步道下切真名井瀑布！留在上方大橋觀景台或茶屋，舒適俯瞰峽谷即可。"
    },
    youthFit: {
      score: 9.9,
      photoSpot: "IG大熱門！租木舟划進真名井瀑布水幕光影、柱狀玄武岩絕壁",
      food: "高千穗牛排千花、日向夏柑橘霜淇淋、竹筒流水素麵",
      shopping: "神話神樂面具、宮崎日向夏果汁、高千穗燒酒"
    },
    infantFit: {
      score: 3.5,
      stroller: "🔴 步道階梯全面無法推車！強制使用人體工學背巾",
      nursingRoom: "上方停車場休息站設有簡單換尿布洗手間",
      notes: "⚠️【嬰兒高風險警示】：原行程拉車近 8 小時＋山路顛簸＋步道陡滑。若前往請務必用背巾緊貼家長胸前，木舟划船嬰兒不可乘坐。"
    },
    desc: "阿蘇火山熔岩冷卻形成的壯麗柱狀節理峽谷，名列日本國家名勝天然紀念物，美如仙境但地勢陡峭險峻。"
  },
  {
    id: "takachiho-shrine",
    nameZh: "高千穗神社 (夫婦杉・神話祈願)",
    nameJa: "高千穂神社",
    category: "attraction",
    city: "宮崎縣高千穗町",
    lat: 32.7056,
    lng: 131.3054,
    defaultStayMins: 45,
    tags: ["千年巨杉", "良緣祈願", "夜神樂", "能量景點"],
    elderFit: {
      score: 8.2,
      steps: "🟢 低 (約 800步)",
      slope: "參道為平整石板與微緩坡，神社側邊有平緩進出動線",
      benches: "神木周邊設有木造長凳可歇息",
      dining: "神社旁傳統甘酒、日式烤糰子",
      notes: "手牽手繞行「夫婦杉」三圈可保家庭圓滿子孫昌盛，長輩信徒讚不絕口。"
    },
    youthFit: {
      score: 8.8,
      photoSpot: "高聳入雲的八百年神木巨杉、古樸莊嚴木造神殿、夜間神樂殿",
      food: "神酒香氣烤餅、宮崎芒果冰棒",
      shopping: "夫婦圓滿御守、開運厄除神樂面具御守"
    },
    infantFit: {
      score: 7.8,
      stroller: "🟡 參道部分碎石路，建議推車換背巾或慢速推行",
      nursingRoom: "社務所旁設有無障礙洗手間",
      notes: "林蔭茂密避暑宜人，空氣極為清新，適合推車在林間深呼吸。"
    },
    desc: "擁有約 1900 年歷史的神話古社，境內聳立兩棵樹幹相連的夫婦巨杉，是九州最知名的結緣與開運聖地。"
  },
  {
    id: "kumamoto-castle",
    nameZh: "熊本城 & 櫻之馬場 城彩苑",
    nameJa: "熊本城・桜の馬場 城彩苑",
    category: "attraction",
    city: "熊本縣熊本市",
    lat: 32.8062,
    lng: 130.7058,
    defaultStayMins: 120,
    tags: ["日本三大名城", "加藤清正", "江戶城下町", "天守閣電梯"],
    elderFit: {
      score: 8.5,
      steps: "🟡 中度 (城彩苑低，登城段約 2,000步)",
      slope: "天守閣內有全套現代化無障礙電梯！但登城坡道較長",
      benches: "天守閣每層及城彩苑均設有大量休息椅與遮蔭亭",
      dining: "城彩苑櫻之小路：太平燕粉絲熱湯、清雅蒸熊本蓮藕、熱甘酒",
      notes: "天守閣修復後已全面無障礙化；長輩若體力有限，可搭乘城內接駁電動車直達天守閣前廣場！"
    },
    youthFit: {
      score: 9.4,
      photoSpot: "黑色天守閣雄偉石垣武者返、城彩苑江戶復古街道拍美照",
      food: "菅乃屋馬肉炸肉餅、海膽可樂餅、熊本熊人形燒",
      shopping: "熊本城限定加藤清正武將周邊、熊本熊原創聯名伴手禮"
    },
    infantFit: {
      score: 8.9,
      stroller: "🟢 城彩苑平路無阻，天守閣內推車電梯直達各樓層",
      nursingRoom: "天守閣與城彩苑觀光導覽所設有專屬五星育嬰室與尿布台",
      notes: "坡道處建議搭乘城內接駁專車，免去推車上長坡的耗力。"
    },
    desc: "加藤清正所建之日本三大名城，歷經震災後浴火重生，現代科技與江戶城郭完美結合。"
  },
  {
    id: "kumamon-square",
    nameZh: "熊本萌熊廣場 Kumamon Square (部長辦公室)",
    nameJa: "くまモンスクエア (テトリアくまもと)",
    category: "attraction",
    city: "熊本縣熊本市",
    lat: 32.8025,
    lng: 130.7128,
    defaultStayMins: 60,
    tags: ["熊本熊部長", "室內冷暖氣", "萌系互動", "市中心逛街"],
    elderFit: {
      score: 9.3,
      steps: "🟢 極低 (< 500步)",
      slope: "百貨室內平坦全電梯",
      benches: "表演場座席與百貨休息區充裕",
      dining: "鶴屋百貨美食街、鰻魚定食、日式抹茶甜品",
      notes: "室內冷暖空調極度舒適，部長熱情舞蹈逗趣，能讓長輩開懷大笑。"
    },
    youthFit: {
      score: 9.7,
      photoSpot: "坐在熊本熊部長辦公桌前假裝批公文、捕捉部長本尊近距離互動",
      food: "部長拉花熱拿鐵、熊本熊造型冰淇淋百匯",
      shopping: "全日本最齊全熊本熊官方限定紀念品、T-shirt、文具"
    },
    infantFit: {
      score: 9.6,
      stroller: "🟢 百貨全館無障礙平路推車直達",
      nursingRoom: "鶴屋百貨東館育嬰室超豪華，溫水洗屁屁、熱水沖奶設備一應俱全",
      notes: "寶寶看到大隻毛茸茸熊本熊跳舞反應極佳，合影溫馨可愛。"
    },
    desc: "熊本縣營業部長 Kumamon 的官方大本營，設有部長專屬辦公室、交流舞台與滿滿周邊限定品。"
  },
  {
    id: "suizenji-garden",
    nameZh: "水前寺成趣園 (桃山迴遊式庭園)",
    nameJa: "水前寺成趣園",
    category: "attraction",
    city: "熊本縣熊本市",
    lat: 32.7909,
    lng: 130.7350,
    defaultStayMins: 60,
    tags: ["迴遊式庭園", "迷你富士山", "湧水錦鯉", "抹茶體驗"],
    elderFit: {
      score: 9.6,
      steps: "🟢 低 (約 1,000步)",
      slope: "環池碎石小徑平緩，設有無障礙外圍環狀道",
      benches: "古今傳授之間茶屋與池畔長椅林立",
      dining: "池畔古今傳授之間：現泡抹茶配加勢以多和菓子",
      notes: "長輩最愛的典型日式名園，湧泉清澈見底，坐看錦鯉悠游極度放鬆心神。"
    },
    youthFit: {
      score: 8.9,
      photoSpot: "綠草如茵的縮小版人造富士山、倒映湖面的出水神社鳥居",
      food: "熊本陣太鼓甜品、水前寺湧水冰滴咖啡",
      shopping: "出水神社長壽御守、成趣園明信片"
    },
    infantFit: {
      score: 8.7,
      stroller: "🟢 環園平坦通道可推車（避開小段草坪與拱橋即可）",
      nursingRoom: "園區出入口洗手間設有尿布更換台",
      notes: "園區寧靜無噪音，適合推車散步讓嬰兒在芬多精中安穩入睡。"
    },
    desc: "江戶初期細川藩主打造的桃山式迴遊庭園，借景阿蘇湧泉，園內堆築的「富士山」綠意盎然。"
  },
  {
    id: "aso-kusasenri",
    nameZh: "阿蘇火山中岳火山口 & 草千里ヶ浜",
    nameJa: "阿蘇山中岳火口・草千里ヶ浜",
    category: "attraction",
    city: "熊本縣阿蘇市",
    lat: 32.8837,
    lng: 131.0506,
    defaultStayMins: 90,
    tags: ["活火山", "大草原", "騎馬體驗", "阿蘇展望台"],
    elderFit: {
      score: 8.0,
      steps: "🟡 中度 (草千里展望台平緩，約 1,500步)",
      slope: "草千里木棧道平坦，火山口觀景台有接駁巴士直達",
      benches: "草千里景觀餐廳與休息站座椅眾多",
      dining: "草千里景觀餐廳：阿蘇名物高菜飯、溫熱鄉土山菜鍋",
      notes: "⚠️ 注意：火山口若噴發火山瓦斯（二氧化硫），患有哮喘或心臟病長輩嚴禁上火山口，應留在草千里博物館休憩。"
    },
    youthFit: {
      score: 9.8,
      photoSpot: "草千里雙子池倒映烏帽子岳、巨大活火山口白煙滾滾壯闊奇景",
      food: "阿蘇小國頂級澤西牛乳冰淇淋、阿蘇巨無霸赤牛牛排漢堡",
      shopping: "火山灰熊本熊公仔、阿蘇限定高原乳酪餅乾"
    },
    infantFit: {
      score: 7.2,
      stroller: "🟡 草千里木棧道可推車，草地則需抱持",
      nursingRoom: "阿蘇火山博物館設有完善育嬰哺乳室與熱水",
      notes: "海拔約 1,100 米，氣溫比平地低 6~8 度且風大，嬰兒需戴防風毛帽與厚外套。"
    },
    desc: "世界罕見的巨大破火山口地形，連綿無際的草千里大草原與持續噴煙的活火山形成震撼人心的絕景。"
  },
  {
    id: "yanagawa-boat-ride",
    nameZh: "柳川水鄉遊船 (松月乘船碼頭)",
    nameJa: "柳川川下り (松月乗船場)",
    category: "attraction",
    city: "福岡縣柳川市",
    lat: 33.1678,
    lng: 130.4144,
    defaultStayMins: 75,
    tags: ["日本威尼斯", "扁舟搖櫓", "水鄉柳樹", "蒸籠鰻魚飯"],
    elderFit: {
      score: 5.0,
      steps: "🟢 步數極少，但...",
      slope: "🔴 登船落差大且船身晃動，需席地深蹲入座，拄杖膝退化長輩起坐極艱難！",
      benches: "船上無椅子（席地坐在塌塌米墊上），冬季有被爐但需盤腿",
      dining: "元祖本吉屋、若松屋蒸籠鰻魚飯（甘甜撲鼻、米飯軟糯）",
      notes: "⚠️【長輩替代策略】：膝關節受損長輩建議放棄登船！搭車直接前往終點「立花邸 御花」參觀松濤園並在庭園品茗等候。"
    },
    youthFit: {
      score: 9.3,
      photoSpot: "船夫撐篙穿過古城低矮紅磚橋孔、水面柳樹倒影、船歌伴奏",
      food: "百年老鋪蒸籠鰻魚飯（蒸籠吸收鰻魚醬汁與炭香超入味）",
      shopping: "柳川さげもん吊飾、鰻魚骨仙貝"
    },
    infantFit: {
      score: 4.0,
      stroller: "🔴 推車完全無法上船！需寄放於碼頭由接駁車載運至終點",
      nursingRoom: "乘船處碼頭有洗手間，船行 45~60 分鐘全程無洗手間與遮蔽",
      notes: "⚠️【嬰兒安全隱患】：小舟無圍欄且船緣極低，好動嬰兒有落水風險；冬風刺骨，建議媽媽帶嬰兒留在立花邸御花室內等候。"
    },
    desc: "縱橫交錯的古城護城河水鄉，乘扁舟由頭戴斗笠的船夫搖櫓引吭高歌，穿行於柳樹低垂的古意河道。"
  },
  {
    id: "yanagawa-tachibana-ohana",
    nameZh: "柳川藩主立花邸 御花 (松濤園與古風料亭)",
    nameJa: "柳川藩主立花邸 御花",
    category: "attraction",
    city: "福岡縣柳川市",
    lat: 33.1554,
    lng: 130.4072,
    defaultStayMins: 75,
    tags: ["國指定名勝", "大名庭園", "蒸籠鰻魚飯", "長輩避風首選"],
    elderFit: {
      score: 9.5,
      steps: "🟢 低 (約 1,000步)",
      slope: "平坦大宅廊道與無障礙坡道",
      benches: "眺望松濤園的西洋館與和室緣側設有舒適座椅",
      dining: "御花專屬料亭蒸籠鰻魚飯御膳、清雅蛤蜊熱湯",
      notes: "柳川遊船的最佳降級替代點！長輩在此安坐賞黑松石燈籠庭園，免除上船深蹲之苦。"
    },
    youthFit: {
      score: 9.1,
      photoSpot: "明治時期鹿鳴館洋館純白迴廊、大廣間眺望 280 株黑松倒映水池",
      food: "御花限定鰻魚飯御膳、日式抹茶甜點",
      shopping: "立花家家紋商品、柳川工藝刺繡球"
    },
    infantFit: {
      score: 9.0,
      stroller: "🟢 西洋館與外圍庭園推車順暢",
      nursingRoom: "館內設有無障礙洗手間與哺乳更換設施",
      notes: "室內避風遮雨，嬰兒不哭鬧，家長能安心換尿布與泡奶。"
    },
    desc: "柳川藩主立花家的別邸，松濤園模仿宮島風景建造，綠松奇石庭園堪稱九州名勝之冠。"
  },
  {
    id: "mojiko-retro",
    nameZh: "門司港懷舊區 & 舊門司三井俱樂部",
    nameJa: "門司港レトロ地区",
    category: "attraction",
    city: "福岡縣北九州市",
    lat: 33.9458,
    lng: 130.9615,
    defaultStayMins: 105,
    tags: ["大正浪漫", "愛因斯坦下榻", "燒咖哩", "海港步道"],
    elderFit: {
      score: 9.4,
      steps: "🟢 低~中度 (約 1,500步)",
      slope: "港灣步道寬闊極為平整，完全無階梯障礙",
      benches: "沿海木棧道與海關廣場長椅密集",
      dining: "三井俱樂部河豚清湯御膳、溫和起司燒咖哩、海鮮熱湯",
      notes: "悠閒海風吹拂，大正復古紅磚洋館散步令人賞心悅目，室內咖啡座林立隨時可坐下。"
    },
    youthFit: {
      score: 9.7,
      photoSpot: "JR門司港車站大正古典木造站體、藍翼門司吊橋開合秀、香蕉人銅像",
      food: "爆濃起司焗烤「門司港燒咖哩」（Bear Fruits、伽哩本舖）",
      shopping: "門司港香蕉甜點、海峽瓦片仙貝、昭和復古雜貨"
    },
    infantFit: {
      score: 9.3,
      stroller: "🟢 全區 100% 平坦無障礙推車天堂",
      nursingRoom: "舊門司三井俱樂部與海峽廣場均有乾淨育嬰室與哺乳沙發",
      notes: "步道開闊寬大，推車推行極其絲滑，海港空氣舒暢。"
    },
    desc: "明治至大正時期繁榮的國際貿易港口，洋溢著浪漫西洋風情，保存多棟登錄有形文化財紅磚洋館。"
  },
  {
    id: "mekari-park-kanmon-bridge",
    nameZh: "和布刈公園 / 展望台 (眺望關門大橋)",
    nameJa: "和布刈公園・展望台 (関門橋展望)",
    category: "attraction",
    city: "福岡縣北九州市",
    lat: 33.9632,
    lng: 130.9657,
    defaultStayMins: 45,
    tags: ["關門海峽", "跨海大橋", "展望絕景", "本州交界"],
    elderFit: {
      score: 8.8,
      steps: "🟢 低 (< 800步)",
      slope: "停車場緊鄰展望台，設有專屬無障礙觀景坡道",
      benches: "全景觀景台設有遮陽長椅",
      dining: "展望台小賣部熱咖啡與熱茶",
      notes: "車輛可直達山頂停車場，下車走幾步即可飽覽巨型關門跨海大橋與海峽急流。"
    },
    youthFit: {
      score: 9.2,
      photoSpot: "雄偉鋼索關門大橋與貨輪穿梭關門海峽的同框大景",
      food: "海峽汽水、明太子風味洋芋片",
      shopping: "關門海峽紀念周邊"
    },
    infantFit: {
      score: 8.5,
      stroller: "🟢 展望台有無障礙坡道可推車",
      nursingRoom: "停車場設有無障礙洗手間",
      notes: "海風較大，記得給寶寶套上抗風帽或防風披風。"
    },
    desc: "居高臨下俯瞰關門海峽最窄處「早鞆之瀨戶」的絕佳制高點，近距離感受巨型跨海大橋的氣勢。"
  },
  {
    id: "karato-market",
    nameZh: "唐戶市場 (下關海鮮市場・週末活氣馬鹿市)",
    nameJa: "唐戸市場 (下関・活きいき馬鹿市)",
    category: "food",
    city: "山口縣下關市 (關門跨海對岸)",
    lat: 33.9575,
    lng: 130.9453,
    defaultStayMins: 75,
    tags: ["河豚之鄉", "現點握壽司", "海膽大滿貫", "海景草坪野餐"],
    elderFit: {
      score: 8.2,
      steps: "🟡 中度 (約 1,500步)",
      slope: "市場內平坦但地面微濕，需穿防滑健走鞋",
      benches: "2 樓設有海景用餐座位區，可避開 1 樓人潮",
      dining: "下關天然河豚生魚片、河豚骨熱味噌湯、現蒸海膽飯",
      notes: "帶長輩請直上 2 樓海景座位區，舒適享用新鮮熱騰騰河豚湯與鮮美握壽司。"
    },
    youthFit: {
      score: 9.6,
      photoSpot: "1 樓整排海鮮攤現點大口吃巨無霸海膽、黑鮪魚大腹握壽司",
      food: "現切黑鮪魚大腹壽司、生海膽軍艦、巨型炸河豚肉排",
      shopping: "即食明太子條、下關乾燥河豚魚乾"
    },
    infantFit: {
      score: 7.0,
      stroller: "🟡 週末人潮摩肩擦踵，推車易受阻，建議家長輪流抱或推車放 2 樓",
      nursingRoom: "2 樓設有乾淨洗手間與尿布台",
      notes: "海鮮生食嬰兒不可食用，需自備常溫副食品粥在此加熱食用。"
    },
    desc: "日本最大的河豚集散地，每逢週末化身熱鬧非凡的海鮮屋台市集，握壽司與海鮮丼價格親民鮮度爆表。"
  },
  {
    id: "dazaifu-tenmangu",
    nameZh: "太宰府天滿宮 & 表參道星巴克",
    nameJa: "太宰府天満宮・表参道",
    category: "attraction",
    city: "福岡縣太宰府市",
    lat: 33.5215,
    lng: 130.5348,
    defaultStayMins: 90,
    tags: ["學問之神", "隈研吾星巴克", "梅枝餅", "飛梅"],
    elderFit: {
      score: 9.3,
      steps: "🟢 低~中度 (約 1,500步)",
      slope: "心字池拱橋為石階太鼓橋，但兩側有【平坦無障礙繞道】完全無階梯！",
      benches: "境內迴廊、菖蒲池畔及茶屋座椅極多",
      dining: "剛出爐現烤熱騰騰梅枝餅（皮酥餡香暖胃）、抹茶、烏龍麵",
      notes: "摸御神牛銅像頭部開運祈福，長輩必走心字池平坦繞道，動線非常輕鬆。"
    },
    youthFit: {
      score: 9.7,
      photoSpot: "建築大師隈研吾設計的無鉚釘木條交錯星巴克、本殿暫定假殿綠植屋頂",
      food: "人氣老鋪「笠乃家」梅枝餅、太宰府八女抹茶草莓百匯、太宰府漢堡",
      shopping: "考試合格御守、飛梅之露和菓子、星巴克限定太宰府馬克杯"
    },
    infantFit: {
      score: 9.4,
      stroller: "🟢 太鼓拱橋兩側設有完善無障礙輪椅/推車平緩斜坡",
      nursingRoom: "天滿宮導覽中心及表參道設有無障礙育嬰室與尿布台",
      notes: "推車好推，環境綠樹成蔭，是整個九州最適合推車散步的神社景點之一。"
    },
    desc: "供奉學問之神菅原道真之總本宮，擁有千年歷史，表參道滿溢熱梅枝餅香氣與隈研吾特色木構建築。"
  },
  {
    id: "lalaport-fukuoka",
    nameZh: "福岡 Mitsui Shopping Park LaLaport (實物大 v-Gundam 鋼彈)",
    nameJa: "ららぽーと福岡 (実物大νガンダム)",
    category: "shopping",
    city: "福岡縣福岡市",
    lat: 33.5539,
    lng: 130.4431,
    defaultStayMins: 120,
    tags: ["實物大鋼彈", "九州最大商城", "育嬰旗艦", "爆買免稅"],
    elderFit: {
      score: 9.6,
      steps: "🟢 自在調節 (室內極度舒適)",
      slope: "全館完全無障礙，坡道電梯密度極高",
      benches: "各樓層走道均設有頂級皮質沙發與按摩椅休憩站",
      dining: "1~3樓多樣日式美食街：黑毛和牛定食、名店「久留米拉麵」、京風豆腐烏龍麵",
      notes: "冷氣空調恆溫，長輩可悠閒在沙發喝熱茶或逛超市小農特產，完全不曬不累。"
    },
    youthFit: {
      score: 9.8,
      photoSpot: "24.8米高實物大 RX-93ff v-Gundam 鋼彈聲光變形秀、Gundam Park 展館",
      food: "極味屋漢堡排、洋食名店「三代目 たいめいけん」、BAKE 起司塔",
      shopping: "GUNDAM SIDE-F 限定模型、UNIQLO旗艦店、GU、ABC-MART Grand Stage"
    },
    infantFit: {
      score: 10.0,
      stroller: "🟢 全館提供免費 Combi 嬰兒推車借用，推車動線完美滿分",
      nursingRoom: "全日本最頂級育嬰哺乳室！獨立授乳室、70°C沖奶調乳機、微波爐、換尿布台",
      notes: "友善度封頂！副食品可免費微波加熱，母嬰衛生用品一應俱全，距機場僅 12 分鐘。"
    },
    desc: "九州最新最大型購物娛樂中心，入口佇立全球唯一的 24.8 公尺實物大 RX-93ff 鋼彈，是老中青三代共贏的天堂。"
  },
  {
    id: "maizuru-park",
    nameZh: "舞鶴公園 & 福岡城跡 (櫻花古城步道)",
    nameJa: "舞鶴公園・福岡城跡",
    category: "attraction",
    city: "福岡縣福岡市",
    lat: 33.5847,
    lng: 130.3812,
    defaultStayMins: 60,
    tags: ["福岡城", "黑田官兵衛", "古城石垣", "櫻花名所"],
    elderFit: {
      score: 8.6,
      steps: "🟡 中度 (約 1,500步)",
      slope: "公園主道平整，天守台段有緩坡與部分石階",
      benches: "護城河畔林蔭長椅林立",
      dining: "公園周邊輕食咖啡店、日式煎茶",
      notes: "黑田官兵衛之子黑田長政築城之地，護城河開闊，早晨散步空氣怡人。"
    },
    youthFit: {
      score: 8.7,
      photoSpot: "宏偉石垣倒映古濠、春季櫻花滿開、福岡市區俯瞰天際線",
      food: "大濠公園星巴克概念店、在地法式烘焙甜點",
      shopping: "黑田家武將紀念品"
    },
    infantFit: {
      score: 8.8,
      stroller: "🟢 護城河周邊與公園主要林蔭道平坦好推",
      nursingRoom: "大濠公園觀光案內所設有哺乳室與尿布更換台",
      notes: "林蔭多遮陽好，適合推車安靜散步。"
    },
    desc: "坐落於市中心的福岡城遺址，護城河與百年石垣見證博多歷史，緊鄰著名的大濠公園。"
  },
  {
    id: "itoshima-futamigaura",
    nameZh: "糸島櫻井二見之浦 (夫婦岩與天使之翼)",
    nameJa: "糸島 桜井二見ヶ浦・パームビーチ",
    category: "attraction",
    city: "福岡縣糸島市",
    lat: 33.6429,
    lng: 130.1989,
    defaultStayMins: 75,
    tags: ["海中鳥居", "IG美拍打卡", "天使之翼", "落日百選"],
    elderFit: {
      score: 8.4,
      steps: "🟢 低 (< 1,000步)",
      slope: "沿海公路與景觀露台平坦，沙灘部分長輩可於景觀座遠眺",
      benches: "海景咖啡館戶外陽傘躺椅",
      dining: "糸島在地產海鮮鯛魚茶泡飯、溫和有機時蔬湯",
      notes: "日本夕日百選，坐在海景咖啡館喝熱茶遠眺純白海中鳥居，心曠神怡。"
    },
    youthFit: {
      score: 9.9,
      photoSpot: "巨型天使之翼彩繪牆、椰子樹海灘鞦韆、純白海中鳥居與夫婦岩",
      food: "Sunset Cafe 蒜香奶油蝦、London BUS 冰淇淋、糸島布丁手工鹽",
      shopping: "糸島工房天然海鹽「またいちの塩」、手工陶器"
    },
    infantFit: {
      score: 7.8,
      stroller: "🟡 沿海人行步道好推，沙灘無法推車需抱持",
      nursingRoom: "Palm Beach 商場餐廳備有無障礙洗手間與更換台",
      notes: "海風微涼，請準備薄外套與遮陽帽。"
    },
    desc: "被譽為「福岡後花園」的度假海濱聖地，碧海藍天配上海中純白鳥居與夫婦岩，是年輕人 IG 狂拍熱點。"
  },
  {
    id: "canal-city-hakata",
    nameZh: "博多運河城 (Canal City Hakata)",
    nameJa: "キャナルシティ博多",
    category: "shopping",
    city: "福岡縣福岡市",
    lat: 33.5898,
    lng: 130.4109,
    defaultStayMins: 120,
    tags: ["水舞秀", "拉麵競技館", "立體商城", "免稅購物"],
    elderFit: {
      score: 9.0,
      steps: "🟡 中度 (約 1,800步)",
      slope: "全區無障礙電梯與平坦通道",
      benches: "半戶外運河水景沿線設有多處木質休閒長椅",
      dining: "B1 靜態日式定食區、利久牛舌熱定食、溫熱茶漬飯",
      notes: "每半小時一場精彩音樂水舞秀，坐在長椅上吹涼風欣賞極其愜意。"
    },
    youthFit: {
      score: 9.6,
      photoSpot: "紅紫流線型後現代巨型建築、3D 光影動漫水舞投影秀",
      food: "拉麵競技館（集結全日本8大名店）、築地銀章魚燒、可麗餅",
      shopping: "Alpen FUKUOKA (超巨大戶外運動用品館)、Jump Shop、松本清"
    },
    infantFit: {
      score: 9.2,
      stroller: "🟢 全館手推車無阻，服務台可借用嬰兒車",
      nursingRoom: "各樓層設有多間嬰兒休息室、泡奶熱水機與哺乳小間",
      notes: "商場寬敞，洗手間設備新穎，雨天備案第一名。"
    },
    desc: "結合運河水景、劇場、電影院與大型商場的複合式娛樂巨城，拉麵競技館網羅日本各地經典美味。"
  },
  {
    id: "tosu-outlets",
    nameZh: "鳥栖 PREMIUM OUTLETS (九州暢貨中心)",
    nameJa: "鳥栖プレミアム・アウトレット",
    category: "shopping",
    city: "佐賀縣鳥栖市",
    lat: 33.3985,
    lng: 130.5284,
    defaultStayMins: 120,
    tags: ["Outlet", "加州莊園風", "精品折扣", "高速交流道旁"],
    elderFit: {
      score: 9.1,
      steps: "🟡 中度 (平地漫步約 1,800步)",
      slope: "全區為單層美式平坦開放街道，完全無上下樓梯！",
      benches: "整條露天大道每隔 15 米即有遮陽休閒長凳",
      dining: "美食街提供一風堂拉麵、長崎強棒麵熱湯、讚岐烏龍麵",
      notes: "全平面動線對長輩膝蓋最友善，不用爬電扶梯上下奔波。"
    },
    youthFit: {
      score: 9.5,
      photoSpot: "陽光明媚的加州南部西班牙殖民風格棕櫚樹建築群",
      food: "GODIVA 濃郁霜淇淋、Crazy Crepes 現烤法式薄餅",
      shopping: "Nike、Adidas、Coach、Tommy Hilfiger、Le Creuset 狂折爆買"
    },
    infantFit: {
      score: 9.4,
      stroller: "🟢 平坦美式街區推車極度順暢，可免費租借推車",
      nursingRoom: "迎賓中心設有豪華母嬰哺乳室、熱水機與家庭專用洗手間",
      notes: "戶外街道寬廣空氣流通，嬰兒推車推行安全毫無壓迫感。"
    },
    desc: "擁有約 170 家國內外知名品牌的歐美莊園風 Outlet，交通緊鄰鳥栖交流道，自駕中繼購物首選。"
  },
  {
    id: "kurokawa-onsen",
    nameZh: "黑川溫泉街 (秘境入湯手形溫泉巡禮)",
    nameJa: "黒川温泉 (入湯手形・秘湯)",
    category: "attraction",
    city: "熊本縣南小國町",
    lat: 33.0805,
    lng: 131.1415,
    defaultStayMins: 105,
    tags: ["日本溫泉百選", "入湯手形", "深山秘湯", "日式旅館"],
    elderFit: {
      score: 8.5,
      steps: "🟡 中度 (約 1,800步)",
      slope: "河谷老街有部分石子小緩坡，建議長輩持防滑手杖漫步",
      benches: "各家旅館外緣側與足湯處設有休閒木椅",
      dining: "南小國町黑毛和牛壽喜燒、高野豆腐山菜御膳、熱地雞鍋",
      notes: "木造建築氛圍質樸溫暖，七種泉質被譽為療癒長輩筋骨痛的神級秘湯。"
    },
    youthFit: {
      score: 9.6,
      photoSpot: "川端通傍晚溫暖黃色竹燈籠倒影（湯明季限定）、復古木造旅館街景",
      food: "白玉甜點老鋪「甘味茶屋」彩色丸子、黑川溫泉烤泡芙、在地生啤酒",
      shopping: "木質「入湯手形」杉木吊牌、溫泉保濕面膜與天然檜木精油"
    },
    infantFit: {
      score: 7.5,
      stroller: "🟡 溫泉街部分石板階梯與坡道需換背巾",
      nursingRoom: "黑川溫泉觀光旅館協同組合旅客中心設有哺乳休息空間",
      notes: "山林氣溫涼爽，泉質豐富，適合一家人於專屬獨立個室（家族風呂）私密泡湯。"
    },
    desc: "米其林二星評價的深山秘湯，統一規劃的黑木建築街道與裊裊溫泉白煙，宛如重返江戶時代隱世溫泉鄉。"
  },
  {
    id: "kumamoto-hotel-city",
    nameZh: "熊本市區星級飯店 (下通商圈 / 熊本城前)",
    nameJa: "熊本市街ホテル (通町筋・下通)",
    category: "hotel",
    city: "熊本縣熊本市",
    lat: 32.8010,
    lng: 130.7100,
    defaultStayMins: 720,
    tags: ["市區住宿", "通町筋", "熊本城景", "下通拱廊商圈"],
    elderFit: {
      score: 9.3,
      steps: "🟢 極低 (< 300步)",
      slope: "平坦無障礙",
      benches: "大廳舒適沙發",
      dining: "熊本鄉土料理「太平燕」熱冬粉雞湯、水瀧鍋",
      notes: "無障礙電梯與輪椅無阻，緊鄰通町筋電車站，就醫與休憩極度便利。"
    },
    youthFit: {
      score: 9.2,
      photoSpot: "飯店高樓層眺望熊本城夜間點燈大景",
      food: "黑亭拉麵濃焦蒜麻油豚骨湯、熊本生馬肉刺身、蜂樂饅頭",
      shopping: "下通與上通商店街、PARCO、鶴屋百貨"
    },
    infantFit: {
      score: 9.5,
      stroller: "🟢 全程電梯與平地推車順暢",
      nursingRoom: "客房空間寬敞備有快煮壺（泡奶）、嬰兒床與澡盆可預約",
      notes: "離鶴屋百貨僅數百公尺，隨時可補充日製尿布與幼兒備品。"
    },
    desc: "座落熊本市區繁華核心，兼具熊本城壯麗景觀與下通商圈吃喝採買便利，是中九州極致推薦住宿據點。"
  },
  {
    id: "minamiaso-onsen-hotel",
    nameZh: "南阿蘇溫泉渡假村 (星空溫泉別墅)",
    nameJa: "南阿蘇温泉郷 リゾートホテル",
    category: "hotel",
    city: "熊本縣南阿蘇村",
    lat: 32.8250,
    lng: 131.0200,
    defaultStayMins: 720,
    tags: ["南阿蘇", "星空溫泉", "阿蘇五岳景觀", "家族風呂"],
    elderFit: {
      score: 9.5,
      steps: "🟢 極低 (< 400步)",
      slope: "渡假村平坦步道",
      benches: "觀景涼亭與露天浴池休息椅",
      dining: "阿蘇赤牛陶板燒、南阿蘇清甜山菜御膳、熱豆腐鍋",
      notes: "客房內附設私人半露天溫泉，長輩無需步行即可享受天然地熱名湯。"
    },
    youthFit: {
      score: 9.4,
      photoSpot: "無光害阿蘇五岳壯麗銀河星空夜景、山嵐晨霧",
      food: "阿蘇天然湧水現煮珈琲、南阿蘇手工布丁與地雞燒烤",
      shopping: "阿蘇火山泥手工皂、在地自釀紅酒與牧場乳酪"
    },
    infantFit: {
      score: 9.0,
      stroller: "🟢 渡假村主要動線皆設有無障礙坡道",
      nursingRoom: "家族獨立湯屋水溫可調，方便一家三代共浴",
      notes: "山林靜謐環境優美，寶寶睡眠品質極佳，免去拉車噪音干擾。"
    },
    desc: "位於阿蘇南麓的寧靜溫泉渡假聚落，坐擁雄偉阿蘇五岳環景與無光害璀璨星空，是串連阿蘇與高千穗的完美夜宿中繼站。"
  },
  {
    id: "kumamoto-dentetsu-kumamon-train",
    nameZh: "熊本電鐵萌熊電車 (北熊本站・萌熊車廂巡遊)",
    nameJa: "熊本電鉄 くまモントレイン (北熊本駅)",
    category: "attraction",
    city: "熊本縣熊本市",
    lat: 32.8335,
    lng: 130.7185,
    defaultStayMins: 45,
    tags: ["萌熊電車", "鐵道迷", "Kumamon", "親子必訪"],
    elderFit: {
      score: 8.8,
      steps: "🟢 低 (< 800步)",
      slope: "平坦月台",
      benches: "月台與候車室設有長椅",
      dining: "北熊本站周邊日式定食小吃",
      notes: "站體精巧動線簡短，上下車台階落差小，長輩輕鬆搭乘。"
    },
    youthFit: {
      score: 9.5,
      photoSpot: "全車身彩繪 Kumamon 萌熊電車進站大景、車廂內部超萌把手與座椅",
      food: "萌熊聯名限定銅鑼燒、鐵道造型糖果",
      shopping: "北熊本車站官方 Kumamon 鐵道周邊商品與站長帽子紀念品"
    },
    infantFit: {
      score: 9.0,
      stroller: "🟢 低底盤車廂推車方便推入",
      nursingRoom: "北熊本站設有基礎育嬰台與洗手間",
      notes: "行駛平穩緩慢，車窗外田園風光宜人，小寶寶觀看可愛熊本熊極度開心。"
    },
    desc: "評估報告 Day 3 指定核心行程：熊本電鐵限定版 Kumamon 彩繪列車，由舊東京地鐵銀座線改裝，滿滿萌熊元素讓老中青三代童心大發。"
  },
  {
    id: "tenjin-underground",
    nameZh: "福岡天神地下街 (19世紀歐風商街・精品名品)",
    nameJa: "天神地下街 (てんちか)",
    category: "shopping",
    city: "福岡縣福岡市",
    lat: 33.5898,
    lng: 130.4005,
    defaultStayMins: 90,
    tags: ["天神", "免稅購物", "地下街", "防雨防寒"],
    elderFit: {
      score: 9.0,
      steps: "🟡 中度 (約 1,500步)",
      slope: "全平坦防滑石板",
      benches: "街角廣設歐風鐵鑄休憩長椅",
      dining: "春水堂珍奶、日式茶泡飯、清淡烏龍麵定食",
      notes: "全空調室內環境不受九州早春寒風影響，各街區皆設有無障礙直達電梯。"
    },
    youthFit: {
      score: 9.3,
      photoSpot: "南歐南法風情彩繪玻璃圓頂、復古黃銅街燈長廊",
      food: "BAKE 現烤濃郁起司塔、Ringojuu 蘋果派老鋪、星巴克",
      shopping: "LUSH、Maison de FLEUR、日系流行服飾與彩妝專賣店"
    },
    infantFit: {
      score: 9.6,
      stroller: "🟢 全程推車無阻，平滑石板好推",
      nursingRoom: "東4番街與西6番街設有五星級嬰兒哺集乳室與常溫水槽",
      notes: "與天神各大型百貨（岩田屋、三越、大丸）地下無縫接軌，補給最強。"
    },
    desc: "全長約 600 公尺的九州最大地下商場，重現 19 世紀歐洲街道風貌，雨天寒冬出遊的絕佳購物遮蔽聖地。"
  },
  {
    id: "hakata-station",
    nameZh: "JR 博多城 / 伴手禮名店街 (AMU PLAZA・博多名店街)",
    nameJa: "JR博多シティ / アミュプラザ博多",
    category: "shopping",
    city: "福岡縣福岡市",
    lat: 33.5897,
    lng: 130.4207,
    defaultStayMins: 90,
    tags: ["JR博多站", "九州名產", "伴手禮", "頂樓庭園"],
    elderFit: {
      score: 9.2,
      steps: "🟢 低 (< 1,000步)",
      slope: "平坦無障礙",
      benches: "商場各樓層與頂樓燕子森林廣場設有座椅",
      dining: "博多名物大東園燒肉、椒房庵鯛魚茶泡飯、牛腸鍋定食",
      notes: "地下街「MING」匯集全九州名物，免奔波即可買齊各地老鋪特產。"
    },
    youthFit: {
      score: 9.5,
      photoSpot: "頂樓「燕子之杜廣場」眺望福岡市區全景與鐵道神社鳥居",
      food: "9~10樓「City Dining 空天」頂級美食街、努努雞冷炸雞、明太子起司仙貝",
      shopping: "TOKYU HANDS、Pokemon Center、各大日系潮牌旗艦店"
    },
    infantFit: {
      score: 9.7,
      stroller: "🟢 站體與商場無障礙電梯極為充足",
      nursingRoom: "每層樓皆設有標準哺乳室、尿布台與 70°C 泡奶熱水器",
      notes: "直通福岡地下鐵，交通樞紐地位無可撼動。"
    },
    desc: "九州最大鐵道樞紐複合商場，集結購物、餐飲、文化與屋頂觀景庭園，是旅程起迄採買伴手禮與品嚐美食的第一首選。"
  },
  {
    id: "aso-shrine",
    nameZh: "阿蘇神社 & 一之宮門前町水基巡禮 (神話古社)",
    nameJa: "阿蘇神社・門前町通り (水基巡り)",
    category: "attraction",
    city: "熊本縣阿蘇市",
    lat: 32.9482,
    lng: 131.1147,
    defaultStayMins: 75,
    tags: ["阿蘇神社", "神話", "湧泉水基", "門前町"],
    elderFit: {
      score: 8.9,
      steps: "🟢 平緩 (約 1,200步)",
      slope: "平緩參道",
      benches: "門前町店家門口皆備有休息板凳",
      dining: "阿蘇水基湧水現泡甘酒、熱高菜飯糰、紅牛可樂餅",
      notes: "樓門地震後已完全修復重現宏偉風貌，參道平坦，長輩參拜極為舒暢。"
    },
    youthFit: {
      score: 9.2,
      photoSpot: "重現光彩的國指定重要文化財阿蘇神社樓門、古樸門前町水基流水景致",
      food: "阿部牧場 ASOMILK 霜淇淋、水基泡芙「白玉屋新三郎」",
      shopping: "阿蘇健幸御守、神社神簽、手工湧水肥皂"
    },
    infantFit: {
      score: 8.5,
      stroller: "🟢 參道全鋪設防滑平整石磚，推車順暢",
      nursingRoom: "阿蘇神社社務所設有無障礙洗手間與更換尿布空間",
      notes: "空氣純淨湧泉清涼，全家悠閒漫步無壓力。"
    },
    desc: "擁有 2,500 年歷史的肥後國一之宮，參道罕見地與神社平行。漫步門前町品嚐清冽甘甜天然湧泉（水基），感受濃郁日本山林古風。"
  },
  {
    id: "beppu-ropeway",
    nameZh: "別府空中纜車 (鶴見岳絕景・10分鐘登頂眺望別府灣)",
    nameJa: "別府ロープウェイ (鶴見岳)",
    category: "attraction",
    city: "大分縣別府市",
    lat: 33.2845,
    lng: 131.4335,
    defaultStayMins: 90,
    tags: ["空中纜車", "全景展望", "別府灣", "四季美景"],
    elderFit: {
      score: 8.7,
      steps: "🟢 輕鬆乘坐 (< 800步)",
      slope: "纜車站設有坡道",
      benches: "山頂觀景台周邊備有長椅",
      dining: "高原之驛休息站烏龍麵與日式糰子",
      notes: "九州最大型 101 人座大型車廂，行駛平穩緩慢，長輩坐著就能 360 度鳥瞰大景。"
    },
    youthFit: {
      score: 9.4,
      photoSpot: "海拔 1,375 公尺鶴見岳頂眺望別府灣、湯布院由布岳與阿蘇山全景大片",
      food: "別府地熱汽水、大分香母醋霜淇淋",
      shopping: "鶴見岳限定御守、別府纜車紀念吊飾"
    },
    infantFit: {
      score: 8.0,
      stroller: "🟡 纜車車廂可推車進入，山頂碎石步道建議換人體工學背巾",
      nursingRoom: "山麓車站設有洗手間與母嬰室",
      notes: "10分鐘平穩爬升，居高臨下美景讓寶寶好奇張望。"
    },
    desc: "西日本最大級空中纜車，僅需 10 分鐘即可直達標高 1,375 米鶴見岳，將別府市街、別府灣及由布岳壯闊山海絕景盡收眼底。"
  },
  {
    id: "takachiho-gorge-boat",
    nameZh: "高千穗峽租船處 (真名井瀑布近距離木舟體驗)",
    nameJa: "高千穂峡 貸しボート (真名井の滝)",
    category: "attraction",
    city: "宮崎縣高千穗町",
    lat: 32.7115,
    lng: 131.3032,
    defaultStayMins: 60,
    tags: ["真名井瀑布", "峽谷划船", "IG爆紅", "神話絕景"],
    elderFit: {
      score: 5.5,
      steps: "🔴 高難度陡階 (落差大)",
      slope: "下切階梯陡峭濕滑",
      benches: "碼頭狹窄無多餘長椅",
      dining: "溪畔流水素麵老鋪「千穗之家」",
      notes: "⚠️ 評估報告強烈警示：長輩膝關節受損者切勿下切，留在上方大橋商場景觀台遠眺即可！"
    },
    youthFit: {
      score: 9.9,
      photoSpot: "IG 全球爆紅神級機位：在碧綠溪谷中划著木舟、真名井瀑布從頭頂傾瀉而下的震撼大片",
      food: "高千穗峽流水素麵、現烤香魚",
      shopping: "木雕神樂面具、宮崎日向夏柑橘果汁"
    },
    infantFit: {
      score: 4.0,
      stroller: "🔴 嚴禁推車，階梯極多且潮濕",
      nursingRoom: "碼頭無育嬰設施，須在上方休息區處理",
      notes: "⚠️ 船身搖晃，10個月嬰兒乘坐具高度落水風險，強烈建議留在上方安全區域。"
    },
    desc: "高千穗最著名的明信片體驗。在玄武岩柱狀節理峽谷間划行小舟，近距離仰望飛濺的真名井瀑布水花，仙氣滿點。"
  },
  {
    id: "kokonoe-suspension-bridge",
    nameZh: "九重「夢」大吊橋 (日本最高步行專用吊橋・震動瀑布絕景)",
    nameJa: "九重“夢”大吊橋",
    category: "attraction",
    city: "大分縣九重町",
    lat: 33.1785,
    lng: 131.2265,
    defaultStayMins: 75,
    tags: ["日本第一吊橋", "震動瀑布", "九重連山", "壯麗峽谷"],
    elderFit: {
      score: 8.3,
      steps: "🟡 中度平緩 (約 1,500步)",
      slope: "橋面完全平坦防滑鋼網",
      benches: "兩端引道售票處備有充裕座椅",
      dining: "九重漢堡店（巨型豐後牛漢堡）、溫熱藍莓派",
      notes: "橋面平坦寬敞，兩側欄杆高達 1.4 米極具安全感，長輩拄杖行走穩固。"
    },
    youthFit: {
      score: 9.5,
      photoSpot: "懸空 173 米俯瞰九醉溪峽谷與日本瀑布百選「震動之瀑」、中央格柵透空驚險自拍",
      food: "九重夢漢堡、九重高原優格",
      shopping: "大分香母醋點心、九重連山紀念 T-shirt"
    },
    infantFit: {
      score: 8.8,
      stroller: "🟢 橋面平整推車通行無阻",
      nursingRoom: "北方管理中心設有無障礙洗手間與哺乳室",
      notes: "橋上偶有強陣風，請為長輩與寶寶穿戴防風外套與保暖圍巾。"
    },
    desc: "全長 390 米、高達 173 米的日本最高步行專用吊橋。行走橋上如凌空漫步，360 度環顧九醉溪原生林與兩座百選瀑布。"
  },
  {
    id: "ureshino-onsen",
    nameZh: "嬉野溫泉街 (日本三大美肌之湯・熱騰騰溫泉湯豆腐)",
    nameJa: "嬉野温泉 (日本三大美肌の湯・湯どうふ)",
    category: "attraction",
    city: "佐賀縣嬉野市",
    lat: 33.0970,
    lng: 130.0355,
    defaultStayMins: 90,
    tags: ["日本三大美肌湯", "溫泉湯豆腐", "嬉野茶", "佐賀慢活"],
    elderFit: {
      score: 9.6,
      steps: "🟢 極平緩 (約 1,000步)",
      slope: "平緩沿河步道",
      benches: "溫泉公園設有免費無障礙足湯與手湯座椅",
      dining: "極致名物「嬉野溫泉湯豆腐」入口即化豆漿湯、嬉野玉綠茶",
      notes: "弱鹼性重曹泉質絲滑柔順，極度滋潤長輩肌膚與舒緩關節疼痛，湯豆腐溫潤養胃好入口。"
    },
    youthFit: {
      score: 9.1,
      photoSpot: "復古公眾浴場「西歐風席恩之湯（Siebold no Yu）」橘色哥德式洋館外觀、茶壺地標",
      food: "宗庵四海湯豆腐套餐、嬉野綠茶義式冰淇淋",
      shopping: "嬉野美肌溫泉化妝水、佐賀嬉野煎茶茶葉"
    },
    infantFit: {
      score: 9.0,
      stroller: "🟢 平坦溫泉街推車自在漫步",
      nursingRoom: "觀光案內所設有貼心育嬰台與熱水設備",
      notes: "水質滑潤溫和，小兒浸泡無刺激，全家享受悠然時光。"
    },
    desc: "佐賀縣代表性名湯，與島根斐乃上、栃木喜連川並稱「日本三大美肌之湯」。清晨品嚐用溫泉水燉煮成豆漿狀的「湯豆腐」，溫潤暖胃，是極致療癒享受。"
  }
];

const ITINERARY_PRESETS = [
  {
    id: "preset-plan-a",
    name: "方案 A：原 DM 5日團體福岡進出 (⚠️ 高風險拉車版)",
    badge: "原行程警示版",
    badgeClass: "badge-danger",
    description: "長榮旅行社精彩九州五日原貌。Day 2 單日拉車近 8 小時（440km），高千穗下切陡坡與柳川深蹲對長輩嬰兒極不友善，附降級避險指南。",
    totalDays: 5,
    flightInfo: "星宇航空 JX840 (TPE 14:45 - FUK 18:00) / JX841 (FUK 19:10 - TPE 20:50)",
    days: [
      {
        day: 1,
        date: "2026/02/24",
        dayOfWeek: "星期二",
        title: "首日抵達・福岡機場接駁・宮若/福岡住宿",
        departureTime: "18:00",
        warningNotes: "落地後專車接駁至飯店，時間短暫輕鬆。",
        items: [
          { spotId: "fuk-airport", nameZh: "福岡機場 (FUK)", durationMinutes: 60, customNotes: "搭乘星宇 JX840 抵達，出關領行李、辦理專車或租車。" },
          { spotId: "miyawaka-hotel", nameZh: "宮若市溫泉飯店 (ROUTE-INN / 脇田溫泉)", durationMinutes: 720, customNotes: "車程約 50 分鐘 (48km)。抵達後泡天然溫泉大浴場、享用溫暖晚餐並早點休息。" }
        ]
      },
      {
        day: 2,
        date: "2026/02/25",
        dayOfWeek: "星期三",
        title: "⚠️ 最高風險日！福岡 ➔ 別府海地獄 ➔ 湯布院 ➔ 宮崎高千穗峽 ➔ 別府大折返",
        departureTime: "08:00",
        warningNotes: "⚠️【全行程最高風險日】：今日行車 7.5~8 小時！里程逾 420km。長輩與嬰兒切勿下切高千穗峽真名井瀑布，留在上方大橋觀景台商場休憩！",
        items: [
          { spotId: "miyawaka-hotel", nameZh: "出發：宮若/福岡飯店", durationMinutes: 15, customNotes: "08:00 準時發車。上大分自動車道直奔別府，長途行車準備。" },
          { spotId: "beppu-sea-jigoku", nameZh: "別府海地獄 (國指定名勝・地熱足湯)", durationMinutes: 75, customNotes: "車程約 2 小時 (140km)。漫步鈷藍溫泉、長輩享受舒活地熱足湯、品嚐溫泉蛋。" },
          { spotId: "yufuin-kinrin-lake", nameZh: "湯布院金鱗湖 & 湯之坪街道", durationMinutes: 90, customNotes: "車程約 40 分鐘 (25km)。漫步金鱗湖畔、午餐品嚐古式手打蕎麥麵與 B-Speak 生乳捲。" },
          { spotId: "takachiho-gorge", nameZh: "宮崎高千穗峽 & 真名井瀑布 (⚠️ 階梯陡峭)", durationMinutes: 105, customNotes: "車程長達 2.5 小時 (125km)！山路顛簸。長輩與嬰兒切勿下切石階步道，留在上方商場看全景。" },
          { spotId: "beppu-onsen-hotel", nameZh: "夜宿：別府溫泉旅宿街 (大折返夜宿)", durationMinutes: 720, customNotes: "高千穗折返別府車程再飆 2.5 小時 (135km)！今日累計近 8 小時拉車。抵達飯店泡湯舒緩腰背痠痛。" }
        ]
      },
      {
        day: 3,
        date: "2026/02/26",
        dayOfWeek: "星期四",
        title: "⚠️ 高考驗日！別府 ➔ 熊本城/萌熊電車 ➔ 柳川遊船 ➔ 福岡",
        departureTime: "08:30",
        warningNotes: "⚠️【高考驗日】：今日行車 5~5.5 小時 (310km)。柳川扁舟深蹲困難且無欄杆，長輩與幼兒建議放棄登船改立花邸等候。",
        items: [
          { spotId: "beppu-onsen-hotel", nameZh: "出發：別府溫泉飯店", durationMinutes: 15, customNotes: "08:30 出發。橫貫九州前往熊本，行車約 2 小時 15 分 (155km)。" },
          { spotId: "kumamon-square", nameZh: "熊本萌熊廣場 (部長辦公室) / 萌熊電車", durationMinutes: 60, customNotes: "抵達熊本市區，與熊本熊部長熱情互動，選購限定紀念品。" },
          { spotId: "kumamoto-castle", nameZh: "熊本城 & 櫻之馬場 城彩苑", durationMinutes: 90, customNotes: "行車 15 分鐘。參觀日本三大名城天守閣（搭無障礙電梯），城彩苑享用太平燕清雅熱湯。" },
          { spotId: "yanagawa-boat-ride", nameZh: "柳川水鄉遊船 (⚠️ 深蹲席地搖櫓船)", durationMinutes: 75, customNotes: "行車 1 小時 15 分 (72km)。乘船需席地深蹲；長輩若膝關節退化可直接送至立花邸松濤園等候。" },
          { spotId: "fukuoka-hotel-hakata", nameZh: "夜宿：福岡市區博多飯店", durationMinutes: 720, customNotes: "行車 1.5 小時 (70km) 返回福岡。享用博多熱騰騰水瀧雞肉鍋，洗沐安歇。" }
        ]
      },
      {
        day: 4,
        date: "2026/02/27",
        dayOfWeek: "星期五",
        title: "福岡 ➔ 舞鶴公園 ➔ 門司港懷舊區 ➔ 和布刈公園/關門大橋 ➔ 福岡市區",
        departureTime: "09:00",
        warningNotes: "行程適中平緩，海港漫步極適合長輩手杖散步與推車。",
        items: [
          { spotId: "fukuoka-hotel-hakata", nameZh: "出發：福岡市區飯店", durationMinutes: 15, customNotes: "09:00 出發，開始北九州港灣一日遊。" },
          { spotId: "maizuru-park", nameZh: "舞鶴公園 & 福岡城跡", durationMinutes: 60, customNotes: "行車 15 分鐘 (4km)。早晨散步，黑田官兵衛古城石垣與護城河巡禮。" },
          { spotId: "mojiko-retro", nameZh: "門司港懷舊區 & 舊門司三井俱樂部", durationMinutes: 120, customNotes: "行車 1 小時 20 分 (78km)。漫步大正復古港灣、享用特製起司燒咖哩與三井俱樂部午餐。" },
          { spotId: "mekari-park-kanmon-bridge", nameZh: "和布刈公園 / 展望台 (眺望關門大橋)", durationMinutes: 45, customNotes: "行車 10 分鐘 (3km)。居高臨下俯瞰關門海峽急流與巨型跨海鋼索大橋，全平路觀景。" },
          { spotId: "fukuoka-hotel-hakata", nameZh: "返回：福岡市區免稅購物 & 飯店", durationMinutes: 720, customNotes: "行車 1 小時 20 分 (78km) 返福岡市區，天神地下街與博多免稅商場採購伴手禮。" }
        ]
      },
      {
        day: 5,
        date: "2026/02/28",
        dayOfWeek: "星期六",
        title: "福岡 ➔ 太宰府天滿宮 ➔ 福岡 LaLaport (實物大鋼彈) ➔ 福岡機場 ➔ 桃園",
        departureTime: "09:30",
        warningNotes: "友善度封頂之日！太宰府走平坦無障礙繞道，LaLaport 五星育嬰設施與舒適沙發。",
        items: [
          { spotId: "fukuoka-hotel-hakata", nameZh: "出發：福岡市區飯店", durationMinutes: 15, customNotes: "09:30 辦理退房，行李隨車，出發前往太宰府。" },
          { spotId: "dazaifu-tenmangu", nameZh: "太宰府天滿宮 & 表參道星巴克", durationMinutes: 90, customNotes: "行車 35 分鐘 (18km)。摸神牛祈福、品嚐熱梅枝餅、隈研吾星巴克美拍，長輩走平坦繞道。" },
          { spotId: "lalaport-fukuoka", nameZh: "福岡 LaLaport (實物大鋼彈 & 育嬰旗艦)", durationMinutes: 135, customNotes: "行車 25 分鐘 (14km)。看 24.8 米實物大鋼彈聲光秀，享用美食街、租借免費 Combi 推車與補副食品。" },
          { spotId: "fuk-airport", nameZh: "福岡機場 (FUK) ➔ 桃園 (JX841 19:10-20:50)", durationMinutes: 120, customNotes: "行車 15 分鐘 (5km) 抵達機場，免稅店大採購，順利登機平安返台。" }
        ]
      }
    ]
  },
  {
    id: "preset-plan-b",
    name: "方案 B：自駕/包車 雙點進出 (🌟 極致推薦・順暢自駕版)",
    badge: "極致推薦 5星首選",
    badgeClass: "badge-success",
    description: "福岡進、熊本出 (Open-Jaw)。一路順向南下不走回頭路！徹底消滅 Day 2 的 8 小時地獄拉車，每日車程平均僅 1.5~2 小時，長輩嬰兒極樂首選。",
    totalDays: 5,
    flightInfo: "華航/星宇：台北 ➔ 福岡 (FUK) // 熊本 (KMJ) ➔ 台北 (雙點進出)",
    days: [
      {
        day: 1,
        date: "2026/02/24",
        dayOfWeek: "星期二",
        title: "首航抵達福岡 ➔ 博多天神巡禮 ➔ 夜宿福岡精華商圈",
        departureTime: "11:00",
        warningNotes: "單點不折返首日，下午輕鬆漫步福岡城與運河城。",
        items: [
          { spotId: "fuk-airport", nameZh: "福岡機場 (FUK) 抵達取車", durationMinutes: 75, customNotes: "抵達辦理手續，租借配置 ISOFIX 嬰兒安全座椅之休旅車。" },
          { spotId: "dazaifu-tenmangu", nameZh: "太宰府天滿宮 & 隈研吾星巴克", durationMinutes: 90, customNotes: "行車 25 分鐘 (16km)。下午悠閒參拜摸神牛、品嚐熱梅枝餅、無障礙動線好走。" },
          { spotId: "canal-city-hakata", nameZh: "博多運河城 (水舞秀 & 拉麵競技館)", durationMinutes: 105, customNotes: "行車 30 分鐘 (15km)。欣賞繽紛音樂水舞秀，全家各選喜愛拉麵或熱烏龍麵。" },
          { spotId: "fukuoka-hotel-hakata", nameZh: "夜宿：福岡市區博多飯店", durationMinutes: 720, customNotes: "入住市中心，長輩可小憩，年輕人可就近逛天神地下街。" }
        ]
      },
      {
        day: 2,
        date: "2026/02/25",
        dayOfWeek: "星期三",
        title: "福岡 ➔ 門司港懷舊海港 ➔ 別府海地獄 ➔ 夜宿別府灣溫泉 (順路東進)",
        departureTime: "08:45",
        warningNotes: "一路東向順行，車程控制在 1.5~2 小時內，無回頭折返路！",
        items: [
          { spotId: "fukuoka-hotel-hakata", nameZh: "出發：福岡市區飯店", durationMinutes: 15, customNotes: "08:45 出發，九州自動車道北上門司港。" },
          { spotId: "mojiko-retro", nameZh: "門司港懷舊區 & 關門海峽漫步", durationMinutes: 105, customNotes: "行車 1 小時 20 分 (78km)。漫步平坦海港，午餐品嚐特製濃郁起司燒咖哩與熱湯。" },
          { spotId: "beppu-sea-jigoku", nameZh: "別府海地獄 (地熱足湯巡禮)", durationMinutes: 75, customNotes: "經東九州道行車 1 小時 15 分 (85km)。漫步鈷藍溫泉，長輩泡熱足湯消解疲憊。" },
          { spotId: "beppu-onsen-hotel", nameZh: "夜宿：別府海景溫泉旅宿", durationMinutes: 720, customNotes: "行車 15 分鐘 (8km)。入住傳統溫泉飯店，享用大分豐後牛刺身會席料理與露天溫泉。" }
        ]
      },
      {
        day: 3,
        date: "2026/02/26",
        dayOfWeek: "星期四",
        title: "別府 ➔ 湯布院金鱗湖 ➔ 阿蘇草千里 ➔ 宿南阿蘇/高千穗 (山林舒活)",
        departureTime: "09:00",
        warningNotes: "從湯布院南下阿蘇，穿越由布岳與阿蘇山脈，行車僅約 1.5~2 小時。",
        items: [
          { spotId: "beppu-onsen-hotel", nameZh: "出發：別府溫泉飯店", durationMinutes: 15, customNotes: "09:00 出發，走別府由布線景觀公路。" },
          { spotId: "yufuin-kinrin-lake", nameZh: "湯布院金鱗湖 & 湯之坪街道", durationMinutes: 90, customNotes: "行車 35 分鐘 (25km)。欣賞由布岳倒影，享用 B-Speak 生乳捲與可樂餅。" },
          { spotId: "aso-kusasenri", nameZh: "阿蘇火山草千里ヶ浜 & 觀景台", durationMinutes: 90, customNotes: "行車 1 小時 15 分 (55km)。大草原漫步、眺望活火山白煙，品嚐濃純澤西牛奶冰淇淋。" },
          { spotId: "takachiho-shrine", nameZh: "高千穗神社 (巨杉結緣祈福)", durationMinutes: 60, customNotes: "行車 50 分鐘 (42km)。走訪千年巨杉，夜宿南阿蘇或高千穗特色溫泉旅館，徹底免除來回奔波。" }
        ]
      },
      {
        day: 4,
        date: "2026/02/27",
        dayOfWeek: "星期五",
        title: "高千穗峽仙境 ➔ 熊本城櫻之馬場 ➔ 萌熊廣場 ➔ 夜宿熊本市區",
        departureTime: "09:00",
        warningNotes: "熊本至高千穗僅 60km！行車僅 1.3 小時，相較別府出發省下 2 小時拉車！",
        items: [
          { spotId: "takachiho-gorge", nameZh: "宮崎高千穗峽 (上方大橋全景與水族館)", durationMinutes: 90, customNotes: "清晨人少！長輩在上方商場與水族館看仙境峽谷，年輕人可提前預約木舟划船。" },
          { spotId: "kumamoto-castle", nameZh: "熊本城 & 櫻之馬場 城彩苑", durationMinutes: 105, customNotes: "行車僅 1 小時 20 分 (65km) 直達熊本！搭乘天守閣電梯，城彩苑品嚐熱太平燕。" },
          { spotId: "kumamon-square", nameZh: "熊本萌熊廣場 (部長見面會)", durationMinutes: 60, customNotes: "行車 10 分鐘。在鶴屋百貨享受頂級冷氣、看熊本熊跳舞、補嬰兒尿布用品。" },
          { spotId: "kumamoto-hotel-city", nameZh: "夜宿：熊本市區星級飯店 (下通商圈)", durationMinutes: 720, customNotes: "入住熊本市區，步行可達下通拱廊商店街，品嚐熊本馬肉刺身與黑亭拉麵。" }
        ]
      },
      {
        day: 5,
        date: "2026/02/28",
        dayOfWeek: "星期六",
        title: "水前寺成趣園 ➔ 柳川蒸籠鰻魚 ➔ 熊本機場 (KMJ) 返台",
        departureTime: "09:30",
        warningNotes: "從柳川返回熊本機場車程僅 1 小時，通關快速，優雅從容登機返台。",
        items: [
          { spotId: "suizenji-garden", nameZh: "水前寺成趣園 (湧水庭園 & 抹茶)", durationMinutes: 75, customNotes: "行車 15 分鐘。清晨漫步細川藩主桃山庭園，池畔茶室品嚐日式抹茶和菓子。" },
          { spotId: "yanagawa-tachibana-ohana", nameZh: "柳川立花邸御花 (享用極品蒸籠鰻魚飯)", durationMinutes: 90, customNotes: "行車 1 小時 (68km)。長輩免深蹲乘船，直達松濤園名勝庭園享用極品蒸籠鰻魚飯。" },
          { spotId: "kmj-airport", nameZh: "熊本機場 (KMJ) ➔ 桃園 (搭乘華航/星宇)", durationMinutes: 120, customNotes: "行車 1 小時 (65km) 抵達全新木造熊本機場，航廈買齊特產，滿載幸福回憶返台。" }
        ]
      }
    ]
  },
  {
    id: "preset-plan-c",
    name: "方案 C：自駕/包車 熊本單點進出 (♨️ 中九州舒活版)",
    badge: "中九州秘境版",
    badgeClass: "badge-primary",
    description: "KMJ 往返。以熊本機場為圓心，專注中九州核心：阿蘇火山、黑川秘境溫泉、高千穗峽與熊本城，完全省去福岡塞車與拉車。",
    totalDays: 5,
    flightInfo: "華航/星宇：台北 ⇄ 熊本 (KMJ) 直飛往返",
    days: [
      {
        day: 1,
        date: "2026/02/24",
        dayOfWeek: "星期二",
        title: "抵達熊本機場 ➔ 熊本城與櫻之馬場 ➔ 夜宿熊本市區",
        departureTime: "12:00",
        warningNotes: "機場至熊本市區僅 30 分鐘，抵達即玩不浪費時間。",
        items: [
          { spotId: "kmj-airport", nameZh: "熊本機場 (KMJ) 抵達取車", durationMinutes: 60, customNotes: "辦理租車與安裝幼兒安全座椅。" },
          { spotId: "kumamoto-castle", nameZh: "熊本城 & 櫻之馬場 城彩苑", durationMinutes: 120, customNotes: "行車 30 分鐘 (18km)。悠閒參觀天守閣無障礙設施，城彩苑吃甜點。" },
          { spotId: "kumamon-square", nameZh: "熊本萌熊廣場 (部長辦公室)", durationMinutes: 60, customNotes: "行車 10 分鐘。朝聖部長辦公室合影留念。" },
          { spotId: "kumamoto-hotel-city", nameZh: "夜宿：熊本市區優質飯店", durationMinutes: 720, customNotes: "下榻市中心，享受熊本在地美食。" }
        ]
      },
      {
        day: 2,
        date: "2026/02/25",
        dayOfWeek: "星期三",
        title: "熊本市區 ➔ 水前寺成趣園 ➔ 柳川立花邸鰻魚飯 ➔ 宿熊本",
        departureTime: "09:00",
        warningNotes: "輕鬆平原路線，長輩極為喜愛。",
        items: [
          { spotId: "suizenji-garden", nameZh: "水前寺成趣園 (富士山庭園散步)", durationMinutes: 75, customNotes: "漫步餵錦鯉，茶室品抹茶。" },
          { spotId: "yanagawa-tachibana-ohana", nameZh: "柳川立花邸 御花 & 蒸籠鰻魚飯", durationMinutes: 105, customNotes: "行車 1 小時 15 分 (72km)。名勝庭園巡禮與百年老鋪鰻魚飯大餐。" },
          { spotId: "kumamoto-hotel-city", nameZh: "返回：熊本市區放鬆", durationMinutes: 720, customNotes: "午後返熊本，媽媽可逛百貨，長輩在飯店充分午睡。" }
        ]
      },
      {
        day: 3,
        date: "2026/02/26",
        dayOfWeek: "星期四",
        title: "熊本 ➔ 阿蘇草千里 ➔ 火山口觀景 ➔ 宿黑川溫泉秘境",
        departureTime: "09:00",
        warningNotes: "山區路段風大，為長輩與寶寶備齊保暖衣物。",
        items: [
          { spotId: "aso-kusasenri", nameZh: "阿蘇草千里ヶ浜 & 火山博物館", durationMinutes: 105, customNotes: "行車 1 小時 15 分 (50km)。大自然壯闊美景，享用溫熱高菜飯。" },
          { spotId: "kurokawa-onsen", nameZh: "黑川溫泉街 (入湯手形溫泉巡禮)", durationMinutes: 720, customNotes: "行車 45 分鐘 (35km)。入住日本頂級秘湯溫泉旅館，徹底放鬆全身筋骨。" }
        ]
      },
      {
        day: 4,
        date: "2026/02/27",
        dayOfWeek: "星期五",
        title: "黑川溫泉 ➔ 宮崎高千穗峽 ➔ 高千穗神社 ➔ 宿南阿蘇",
        departureTime: "09:30",
        warningNotes: "高千穗峽落差大，長輩在上方商場欣賞絕壁。",
        items: [
          { spotId: "takachiho-gorge", nameZh: "宮崎高千穗峽 (真名井瀑布仙境)", durationMinutes: 105, customNotes: "行車 1 小時 20 分 (60km)。仙氣峽谷，長輩享用流水素麵，年輕人拍照打卡。" },
          { spotId: "takachiho-shrine", nameZh: "高千穗神社 (夫婦杉林蔭散步)", durationMinutes: 60, customNotes: "行車 10 分鐘。參拜千年古社祈求全家安康。" },
          { spotId: "minamiaso-onsen-hotel", nameZh: "夜宿：南阿蘇星空溫泉別墅", durationMinutes: 720, customNotes: "行車 45 分鐘 (38km)。欣賞阿蘇五岳夜空繁星。" }
        ]
      },
      {
        day: 5,
        date: "2026/02/28",
        dayOfWeek: "星期六",
        title: "南阿蘇 ➔ 熊本機場 (KMJ) ➔ 桃園國際機場",
        departureTime: "10:30",
        warningNotes: "南阿蘇到熊本機場僅 35 分鐘，行車極短無壓力。",
        items: [
          { spotId: "kmj-airport", nameZh: "熊本機場 (KMJ) 買伴手禮返台", durationMinutes: 120, customNotes: "行車 35 分鐘 (25km) 直達機場。輕鬆辦理還車、退稅與登機。" }
        ]
      }
    ]
  },
  {
    id: "preset-elder-3days",
    name: "熟齡長輩 3 日悠閒慢遊版 (🧓 低步數・名湯・平緩動線)",
    badge: "長輩舒活版",
    badgeClass: "badge-success",
    description: "專為 40~60 歲長輩與拄杖家人量身規劃：太宰府平坦繞道、別府海地獄足湯、名湯會席料理、門司港海風漫步，每日行車不超過 1.5 小時。",
    totalDays: 3,
    flightInfo: "台北 ⇄ 福岡 (FUK) 往返",
    days: [
      {
        day: 1,
        date: "2026/02/24",
        dayOfWeek: "星期二",
        title: "福岡抵達 ➔ 太宰府天滿宮 (平坦繞道) ➔ 宿福岡市區",
        departureTime: "12:00",
        warningNotes: "全程平坦無障礙，太宰府避開太鼓拱橋階梯走兩側平道。",
        items: [
          { spotId: "fuk-airport", nameZh: "福岡機場 (FUK) 抵達接駁", durationMinutes: 60, customNotes: "通關迅速，搭乘專車直達市區飯店放置大行李。" },
          { spotId: "dazaifu-tenmangu", nameZh: "太宰府天滿宮 (祈求長壽安康・現烤熱梅枝餅)", durationMinutes: 105, customNotes: "行車 30 分鐘 (18km)。走平坦無障礙步道摸神牛、品嚐剛出爐熱梅枝餅配熱煎茶。" },
          { spotId: "fukuoka-hotel-hakata", nameZh: "夜宿：福岡市區飯店 (享用博多水瀧雞肉鍋)", durationMinutes: 720, customNotes: "晚餐品嚐慢火熬煮膠原蛋白白濁雞湯，溫熱暖胃容易消化。" }
        ]
      },
      {
        day: 2,
        date: "2026/02/25",
        dayOfWeek: "星期三",
        title: "福岡 ➔ 別府海地獄足湯 ➔ 別府溫泉海景會席料理",
        departureTime: "09:30",
        warningNotes: "車程適中，中途停靠休息站上洗手間。",
        items: [
          { spotId: "beppu-sea-jigoku", nameZh: "別府海地獄 (地熱足湯深層放鬆)", durationMinutes: 90, customNotes: "行車 1 小時 50 分 (135km)。走無障礙步道賞鈷藍溫泉，脫鞋享受溫暖足湯。" },
          { spotId: "beppu-onsen-hotel", nameZh: "夜宿：別府海景溫泉飯店", durationMinutes: 720, customNotes: "早早入住，長輩下午享受飯店露天溫泉與按摩座椅，享用頂級豐後牛御膳。" }
        ]
      },
      {
        day: 3,
        date: "2026/02/26",
        dayOfWeek: "星期四",
        title: "別府 ➔ 門司港大正懷舊海港漫步 ➔ 福岡機場返台",
        departureTime: "09:30",
        warningNotes: "門司港港灣全平坦，咖啡座眾多可隨時歇息。",
        items: [
          { spotId: "mojiko-retro", nameZh: "門司港懷舊區 (平坦港灣步道與舊三井俱樂部)", durationMinutes: 120, customNotes: "行車 1 小時 15 分 (85km)。漫步大正復古港口、品嚐溫和起司焗烤與海鮮熱湯。" },
          { spotId: "fuk-airport", nameZh: "福岡機場 (FUK) 順利返台", durationMinutes: 120, customNotes: "行車 1 小時 15 分 (78km)。直達機場免稅店採買九州名產，快樂返國。" }
        ]
      }
    ]
  },
  {
    id: "preset-youth-4days",
    name: "年輕潮流美拍 4 日極速版 (📸 IG打卡・鋼彈・糸島・拉麵購物)",
    badge: "潮流極速版",
    badgeClass: "badge-primary",
    description: "專為 25~35 歲年輕探索族群設計：糸島天使之翼打卡、LaLaport 實物大鋼彈聲光秀、由布院甜點狂吃、門司港燒咖哩與博多拉麵大戰！",
    totalDays: 4,
    flightInfo: "台北 ⇄ 福岡 (FUK) 往返",
    days: [
      {
        day: 1,
        date: "2026/02/24",
        dayOfWeek: "星期二",
        title: "福岡落地 ➔ 糸島海中鳥居與天使之翼 ➔ 博多運河城拉麵競技館",
        departureTime: "10:30",
        warningNotes: "IG 照片拍爆的一天，相機與行動電源備妥！",
        items: [
          { spotId: "fuk-airport", nameZh: "福岡機場取車出發", durationMinutes: 60, customNotes: "取車後直奔西海岸絕美糸島。" },
          { spotId: "itoshima-futamigaura", nameZh: "糸島櫻井二見之浦 (天使之翼 & 海中鳥居)", durationMinutes: 105, customNotes: "行車 40 分鐘 (32km)。拍爆天使之翼彩繪牆與海邊鞦韆，吃手工海鹽布丁。" },
          { spotId: "canal-city-hakata", nameZh: "博多運河城 (水舞秀 & 拉麵競技館)", durationMinutes: 120, customNotes: "行車 45 分鐘 (35km)。看 3D 動漫投影水舞，狂嗑黑豚骨拉麵。" },
          { spotId: "fukuoka-hotel-hakata", nameZh: "夜宿：福岡天神商圈 (逛天神地下街與屋台)", durationMinutes: 720, customNotes: "夜晚直衝中洲屋台吃烤串喝 Highball。" }
        ]
      },
      {
        day: 2,
        date: "2026/02/25",
        dayOfWeek: "星期三",
        title: "福岡 ➔ 湯布院金鱗湖文青甜點 ➔ 由布院之森列車打卡 ➔ 宿由布院",
        departureTime: "08:45",
        warningNotes: "B-Speak 生乳捲需提早購買以免售罄！",
        items: [
          { spotId: "yufuin-kinrin-lake", nameZh: "湯布院金鱗湖 & 湯之坪文青小店", durationMinutes: 135, customNotes: "行車 1 小時 45 分 (120km)。拍水中鳥居倒影、狂吃 Milch 起司蛋糕與金賞可樂餅。" },
          { spotId: "yufuin-no-mori-train", nameZh: "由布院之森觀光特急列車打卡", durationMinutes: 60, customNotes: "由布院車站月台捕捉復古墨綠列車絕美身影。" },
          { spotId: "beppu-onsen-hotel", nameZh: "夜宿：別府海景旅宿 (日落打卡)", durationMinutes: 720, customNotes: "行車 35 分鐘 (25km)。泡露天溫泉拍海景網美照。" }
        ]
      },
      {
        day: 3,
        date: "2026/02/26",
        dayOfWeek: "星期四",
        title: "別府海地獄 ➔ 門司港大正燒咖哩 ➔ 和布刈公園關門大橋",
        departureTime: "09:00",
        warningNotes: "門司港藍翼吊橋開合時間注意捕捉。",
        items: [
          { spotId: "beppu-sea-jigoku", nameZh: "別府海地獄 (熱氣蒸騰藍色魔湯)", durationMinutes: 75, customNotes: "拍 98°C 鈷藍夢幻泉水白煙大景，吃地熱蒸布丁。" },
          { spotId: "mojiko-retro", nameZh: "門司港懷舊區 (起司燒咖哩 & 香蕉人拍搞笑照)", durationMinutes: 120, customNotes: "行車 1 小時 15 分 (85km)。吃牽絲起司燒咖哩、拍藍翼門司吊橋開合。" },
          { spotId: "mekari-park-kanmon-bridge", nameZh: "和布刈公園 (關門大橋震撼超廣角)", durationMinutes: 45, customNotes: "行車 10 分鐘 (3km)。超近距離與跨海大橋鋼索同框合影。" },
          { spotId: "fukuoka-hotel-hakata", nameZh: "夜宿：福岡博多 (天神買爆藥妝與電器)", durationMinutes: 720, customNotes: "行車 1 小時 20 分 (78km) 返福岡天神。" }
        ]
      },
      {
        day: 4,
        date: "2026/02/27",
        dayOfWeek: "星期五",
        title: "太宰府隈研吾星巴克 ➔ 福岡 LaLaport 實物大鋼彈 ➔ 機場返台",
        departureTime: "09:30",
        warningNotes: "LaLaport 記得預留足夠時間退稅。",
        items: [
          { spotId: "dazaifu-tenmangu", nameZh: "太宰府天滿宮 (隈研吾星巴克美拍)", durationMinutes: 90, customNotes: "行車 30 分鐘 (18km)。木構幾何建築 IG 超火機位、吃現烤梅枝餅。" },
          { spotId: "lalaport-fukuoka", nameZh: "福岡 LaLaport (24.8米實物大鋼彈聲光秀)", durationMinutes: 150, customNotes: "行車 25 分鐘 (14km)。看鋼彈變形秀、逛 Gundam Park、狂買免稅潮牌。" },
          { spotId: "fuk-airport", nameZh: "福岡機場 (FUK) 採買伴手禮回國", durationMinutes: 120, customNotes: "行車 15 分鐘 (5km) 抵達機場，免稅店爆買伴手禮返台。" }
        ]
      }
    ]
  }
];

const KYUSHU_CORRIDORS = {
  "fukuoka-hotel-hakata:beppu-sea-jigoku": { distKm: 140, mins: 120, highway: "大分自動車道", roadType: "highway" },
  "miyawaka-hotel:beppu-sea-jigoku": { distKm: 135, mins: 110, highway: "九州道+大分道", roadType: "highway" },
  "beppu-sea-jigoku:yufuin-kinrin-lake": { distKm: 25, mins: 40, highway: "縣道11號山路", roadType: "mountain" },
  "yufuin-kinrin-lake:takachiho-gorge": { distKm: 125, mins: 150, highway: "國道326號+國道218號山路", roadType: "mountain" },
  "takachiho-gorge:beppu-onsen-hotel": { distKm: 135, mins: 150, highway: "國道326號折返大分道", roadType: "mountain" },
  "kmj-airport:takachiho-gorge": { distKm: 63, mins: 85, highway: "國道325號 (阿蘇南鄉谷)", roadType: "regional" },
  "beppu-onsen-hotel:kumamon-square": { distKm: 155, mins: 135, highway: "大分道接九州自動車道", roadType: "highway" },
  "beppu-onsen-hotel:kumamoto-castle": { distKm: 155, mins: 135, highway: "大分道接九州自動車道", roadType: "highway" },
  "kumamon-square:kumamoto-castle": { distKm: 2.5, mins: 10, highway: "熊本市區電車道路", roadType: "urban" },
  "kumamoto-castle:yanagawa-boat-ride": { distKm: 72, mins: 75, highway: "九州自動車道接國道443", roadType: "regional" },
  "kumamoto-castle:yanagawa-tachibana-ohana": { distKm: 72, mins: 75, highway: "九州自動車道接國道443", roadType: "regional" },
  "yanagawa-boat-ride:fukuoka-hotel-hakata": { distKm: 70, mins: 90, highway: "九州自動車道北上福岡", roadType: "highway" },
  "yanagawa-tachibana-ohana:fukuoka-hotel-hakata": { distKm: 70, mins: 90, highway: "九州自動車道北上福岡", roadType: "highway" },
  "fukuoka-hotel-hakata:mojiko-retro": { distKm: 78, mins: 80, highway: "九州自動車道", roadType: "highway" },
  "fukuoka-hotel-hakata:maizuru-park": { distKm: 4, mins: 15, highway: "福岡市區平面幹道", roadType: "urban" },
  "maizuru-park:mojiko-retro": { distKm: 82, mins: 80, highway: "福岡高速接九州道", roadType: "highway" },
  "mojiko-retro:mekari-park-kanmon-bridge": { distKm: 3, mins: 10, highway: "門司港沿海景觀道", roadType: "coastal" },
  "mekari-park-kanmon-bridge:mojiko-retro": { distKm: 3, mins: 10, highway: "門司港沿海景觀道", roadType: "coastal" },
  "mojiko-retro:fukuoka-hotel-hakata": { distKm: 78, mins: 80, highway: "九州自動車道南下", roadType: "highway" },
  "fukuoka-hotel-hakata:dazaifu-tenmangu": { distKm: 18, mins: 35, highway: "福岡市區接太宰府平面", roadType: "urban" },
  "dazaifu-tenmangu:lalaport-fukuoka": { distKm: 14, mins: 25, highway: "縣道31號/百年橋通", roadType: "regional" },
  "lalaport-fukuoka:fuk-airport": { distKm: 5, mins: 15, highway: "筑紫通/空港通", roadType: "urban" },
  "fuk-airport:miyawaka-hotel": { distKm: 48, mins: 50, highway: "九州自動車道", roadType: "highway" },
  "fuk-airport:fukuoka-hotel-hakata": { distKm: 6, mins: 20, highway: "福岡都市高速/空港通", roadType: "urban" },
  "fuk-airport:dazaifu-tenmangu": { distKm: 16, mins: 28, highway: "國道3號線", roadType: "regional" },
  "mojiko-retro:karato-market": { distKm: 4.5, mins: 15, highway: "關門隧道/渡輪", roadType: "urban" },
  "yufuin-kinrin-lake:aso-kusasenri": { distKm: 55, mins: 75, highway: "山波公路 (やまなみハイウェイ)", roadType: "mountain" },
  "aso-kusasenri:takachiho-gorge": { distKm: 52, mins: 70, highway: "國道325號阿蘇外輪山", roadType: "mountain" },
  "takachiho-gorge:kumamoto-castle": { distKm: 65, mins: 80, highway: "國道325號接九州道", roadType: "regional" },
  "kumamoto-castle:kmj-airport": { distKm: 18, mins: 35, highway: "熊本東方連絡幹道", roadType: "urban" },
  "yanagawa-tachibana-ohana:kmj-airport": { distKm: 65, mins: 60, highway: "有明沿岸道路接九州道", roadType: "highway" },
  "fukuoka-hotel-hakata:itoshima-futamigaura": { distKm: 32, mins: 45, highway: "西九州自動車道", roadType: "coastal" },
  "itoshima-futamigaura:canal-city-hakata": { distKm: 35, mins: 48, highway: "福岡前原道路", roadType: "highway" },
  "mekari-park-kanmon-bridge:fukuoka-hotel-hakata": { distKm: 78, mins: 80, highway: "九州自動車道南下", roadType: "highway" },
  "mojiko-retro:beppu-sea-jigoku": { distKm: 95, mins: 75, highway: "東九州自動車道", roadType: "highway" },
  "beppu-sea-jigoku:mojiko-retro": { distKm: 95, mins: 75, highway: "東九州自動車道北上", roadType: "highway" },
  "beppu-sea-jigoku:beppu-onsen-hotel": { distKm: 6, mins: 15, highway: "別府市區觀海大道", roadType: "urban" },
  "beppu-onsen-hotel:yufuin-kinrin-lake": { distKm: 25, mins: 35, highway: "縣道11號由布岳景觀道", roadType: "mountain" },
  "beppu-onsen-hotel:mojiko-retro": { distKm: 95, mins: 75, highway: "東九州自動車道北上", roadType: "highway" },
  "dazaifu-tenmangu:canal-city-hakata": { distKm: 16, mins: 30, highway: "國道3號線接都市高", roadType: "regional" },
  "canal-city-hakata:fukuoka-hotel-hakata": { distKm: 1.5, mins: 8, highway: "博多市區平面 (步行亦可)", roadType: "urban" },
  "aso-kusasenri:takachiho-shrine": { distKm: 52, mins: 70, highway: "國道325號阿蘇南鄉谷", roadType: "mountain" },
  "takachiho-gorge:takachiho-shrine": { distKm: 2, mins: 6, highway: "高千穗町內道路", roadType: "urban" },
  "takachiho-shrine:kumamoto-hotel-city": { distKm: 65, mins: 80, highway: "國道325號接九州道", roadType: "regional" },
  "takachiho-gorge:kumamoto-hotel-city": { distKm: 65, mins: 80, highway: "國道325號接九州道", roadType: "regional" },
  "kumamoto-castle:kumamoto-hotel-city": { distKm: 1.5, mins: 8, highway: "熊本市區通町筋大道", roadType: "urban" },
  "kumamon-square:kumamoto-hotel-city": { distKm: 1.2, mins: 6, highway: "熊本下通步行街旁", roadType: "urban" },
  "kumamoto-hotel-city:suizenji-garden": { distKm: 4, mins: 15, highway: "熊本電車沿線幹道", roadType: "urban" },
  "kumamoto-hotel-city:yanagawa-tachibana-ohana": { distKm: 68, mins: 65, highway: "九州自動車道北上", roadType: "highway" },
  "suizenji-garden:yanagawa-tachibana-ohana": { distKm: 55, mins: 55, highway: "九州自動車道接國道443", roadType: "highway" },
  "suizenji-garden:yanagawa-boat-ride": { distKm: 55, mins: 55, highway: "九州自動車道接國道443", roadType: "highway" },
  "aso-kusasenri:kurokawa-onsen": { distKm: 38, mins: 50, highway: "山波公路 (やまなみハイウェイ)", roadType: "mountain" },
  "kurokawa-onsen:takachiho-gorge": { distKm: 60, mins: 80, highway: "國道212轉325號", roadType: "mountain" },
  "takachiho-shrine:minamiaso-onsen-hotel": { distKm: 38, mins: 45, highway: "國道325號阿蘇外輪山", roadType: "mountain" },
  "minamiaso-onsen-hotel:kmj-airport": { distKm: 25, mins: 35, highway: "熊本縣道28號俵山隧道", roadType: "regional" },
  "kmj-airport:kumamoto-hotel-city": { distKm: 18, mins: 35, highway: "熊本東方連絡幹道", roadType: "urban" },
  "fuk-airport:itoshima-futamigaura": { distKm: 38, mins: 50, highway: "福岡都市高速接西九州道", roadType: "highway" },
  "mojiko-retro:fuk-airport": { distKm: 78, mins: 75, highway: "九州自動車道直達空港", roadType: "highway" },
  "yufuin-kinrin-lake:yufuin-no-mori-train": { distKm: 1.2, mins: 5, highway: "湯之坪街道 (步行或接駁)", roadType: "urban" },
  "yufuin-no-mori-train:beppu-onsen-hotel": { distKm: 25, mins: 35, highway: "JR久大本線/縣道11號", roadType: "mountain" },
  "kumamoto-castle:kumamoto-dentetsu-kumamon-train": { distKm: 4.5, mins: 15, highway: "熊本市北幹線道路", roadType: "urban" },
  "kumamoto-dentetsu-kumamon-train:suizenji-garden": { distKm: 6, mins: 20, highway: "熊本東部環狀線", roadType: "urban" },
  "kumamoto-dentetsu-kumamon-train:kumamon-square": { distKm: 4, mins: 12, highway: "熊本中央市街道路", roadType: "urban" },
  "fukuoka-hotel-hakata:tenjin-underground": { distKm: 1.8, mins: 10, highway: "明治通/渡邊通 (市區接駁)", roadType: "urban" },
  "tenjin-underground:hakata-station": { distKm: 2.2, mins: 10, highway: "住吉通/大博通", roadType: "urban" },
  "fukuoka-hotel-hakata:hakata-station": { distKm: 1.2, mins: 6, highway: "博多車站前通", roadType: "urban" },
  "yufuin-kinrin-lake:kokonoe-suspension-bridge": { distKm: 28, mins: 35, highway: "縣道11號 (やまなみハイウェイ)", roadType: "mountain" },
  "kokonoe-suspension-bridge:aso-kusasenri": { distKm: 42, mins: 55, highway: "國道387轉阿蘇景觀道", roadType: "mountain" },
  "beppu-sea-jigoku:beppu-ropeway": { distKm: 7, mins: 12, highway: "縣道11號高原線", roadType: "mountain" },
  "beppu-ropeway:beppu-onsen-hotel": { distKm: 9, mins: 16, highway: "別府觀海線", roadType: "mountain" },
  "takachiho-shrine:takachiho-gorge-boat": { distKm: 2, mins: 5, highway: "高千穗峽川下步道", roadType: "urban" },
  "takachiho-gorge:takachiho-gorge-boat": { distKm: 0.5, mins: 2, highway: "高千穗峽步道直達 (步行2分)", roadType: "walk" },
  "fukuoka-hotel-hakata:ureshino-onsen": { distKm: 82, mins: 75, highway: "長崎自動車道", roadType: "highway" },
  "ureshino-onsen:tosu-outlets": { distKm: 58, mins: 50, highway: "長崎自動車道接鳥栖JCT", roadType: "highway" },
  "aso-kusasenri:aso-shrine": { distKm: 16, mins: 25, highway: "阿蘇登山道路坊中線", roadType: "mountain" },
  "aso-shrine:takachiho-gorge": { distKm: 48, mins: 65, highway: "國道265轉325號", roadType: "mountain" },
};

if (typeof window !== 'undefined') {
  window.KYUSHU_METADATA = KYUSHU_METADATA;
  window.KYUSHU_SPOTS = KYUSHU_SPOTS;
  window.ITINERARY_PRESETS = ITINERARY_PRESETS;
  window.KYUSHU_CORRIDORS = KYUSHU_CORRIDORS;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    KYUSHU_METADATA,
    KYUSHU_SPOTS,
    ITINERARY_PRESETS,
    KYUSHU_CORRIDORS
  };
}
