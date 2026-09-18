/**
 * 2026 九州跨世代自由行與行程評估系統 - 主應用程式邏輯 (app.js)
 * 深度整合《九州五日行程深度評估報告》：
 * - 方案 A（原 DM 5日福岡進出拉車版・Day 2 7.5~8h 警示與降級策略）
 * - 方案 B（極致推薦：福岡進/熊本出 雙點進出 5日順暢自駕版）
 * - 方案 C（中九州舒活精華 熊本進/熊本出 5日版）
 * - 40~60歲 熟齡舒活・名湯祈福 5 天 4 夜慢遊全覽
 * - 25~35歲 潮流美拍・巨城名物 5 天 4 夜極速全覽
 * 
 * 核心引擎：
 * 1. 九州真實路網速域模型（高速/大分道/山路繞行係數）與行車時間精算
 * 2. 時間漣漪連鎖推算引擎 (Timeline Ripple Propagation)
 * 3. 跨世代視角切換器 (長輩 40~60歲、年輕 25~35歲、嬰兒 10個月)
 * 4. 自訂行程工作室 (拖曳/上下調序、停留時長調節、私房地點自訂器、多日編輯、JSON匯入匯出)
 * 5. 全日多天數紙本手冊列印排版引擎 (Multi-Day Print Handbook Engine)
 * 6. Leaflet 互動地圖路線視覺化 (具備免聯網優雅降級)
 * 7. 深度評估對照表與特殊成員防護降級錦囊
 */

document.addEventListener('DOMContentLoaded', () => {
  /* ==========================================================================
     1. 安全儲存與通用工具 (Safe Storage & Universal Helpers)
     ========================================================================== */
  const memoryStore = {};

  function safeStorageGet(key, fallback = null) {
    try {
      const item = localStorage.getItem(key);
      return item !== null ? item : fallback;
    } catch (e) {
      return memoryStore[key] !== undefined ? memoryStore[key] : fallback;
    }
  }

  function safeStorageSet(key, val) {
    try {
      localStorage.setItem(key, val);
    } catch (e) {
      memoryStore[key] = String(val);
    }
  }

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function showToast(message, icon = '💡') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'toast-msg';
    toast.innerHTML = `<span>${icon}</span> <span>${escapeHtml(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  function copyTextToClipboard(text, successMsg = '📋 已成功複製行程！') {
    if (navigator.clipboard && window.isSecureContext && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showToast(successMsg);
      }).catch(() => {
        fallbackCopy(text, successMsg);
      });
    } else {
      fallbackCopy(text, successMsg);
    }
  }

  function fallbackCopy(text, successMsg) {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      textArea.style.top = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      if (successful) {
        showToast(successMsg);
      } else {
        window.prompt('請手動複製以下內容：', text);
      }
    } catch (err) {
      window.prompt('請手動複製以下內容：', text);
    }
  }

  function formatDayDate(dateStr) {
    if (!dateStr) return '';
    const clean = String(dateStr).trim().replace(/-/g, '/');
    const parts = clean.split('/');
    if (parts.length >= 3) {
      return `${parts[1]}/${parts[2]}`;
    }
    return clean;
  }

  function formatDateForInput(dateStr) {
    if (!dateStr) return '2026-02-24';
    const clean = String(dateStr).trim().replace(/\//g, '-');
    const parts = clean.split('-');
    if (parts.length >= 3) {
      return `${parts[0]}-${String(parts[1]).padStart(2, '0')}-${String(parts[2]).padStart(2, '0')}`;
    }
    return dateStr;
  }

  function getDayOfWeek(dateStr) {
    try {
      const clean = String(dateStr).trim().replace(/\//g, '-');
      const d = new Date(clean);
      if (!isNaN(d.getTime())) {
        const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
        return weekdays[d.getDay()];
      }
    } catch (e) {}
    return '星期二';
  }

  /* ==========================================================================
     2. 九州地理與交通計算引擎 (Kyushu Geodesic & Transit Engine)
     ========================================================================== */
  function calcDistanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // 地球半徑 (km)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * 根據 ID 查找景點資料（先查內建景點庫，再查自訂私房景點）
   */
  function getSpotById(spotId) {
    if (!spotId) return null;
    const builtIn = (window.KYUSHU_SPOTS || []).find(s => s.id === spotId);
    if (builtIn) return builtIn;
    const custom = (STATE.customSpots || []).find(s => s.id === spotId);
    if (custom) return custom;
    return null;
  }

  /**
   * 計算九州任兩點之間的交通時間與里程
   * 優先查閱 KYUSHU_CORRIDORS 實測路網校準矩陣；
   * 若無對應規則，則依據九州地形分區（山路/高速/市區）動態推估。
   */
  function calculateTransit(fromSpot, toSpot) {
    if (!fromSpot || !toSpot) {
      return {
        distanceKm: 0,
        durationMins: 0,
        isWalk: false,
        roadType: 'unknown',
        highway: '平面道路',
        text: '無座標數據'
      };
    }

    const fromId = fromSpot.spotId || fromSpot.id || '';
    const toId = toSpot.spotId || toSpot.id || '';

    const fromLat = typeof fromSpot.lat === 'number' ? fromSpot.lat : (fromSpot.spotData && fromSpot.spotData.lat);
    const fromLng = typeof fromSpot.lng === 'number' ? fromSpot.lng : (fromSpot.spotData && fromSpot.spotData.lng);
    const toLat = typeof toSpot.lat === 'number' ? toSpot.lat : (toSpot.spotData && toSpot.spotData.lat);
    const toLng = typeof toSpot.lng === 'number' ? toSpot.lng : (toSpot.spotData && toSpot.spotData.lng);

    if (typeof fromLat !== 'number' || typeof toLat !== 'number' || typeof fromLng !== 'number' || typeof toLng !== 'number') {
      return {
        distanceKm: 0,
        durationMins: 0,
        isWalk: false,
        roadType: 'unknown',
        highway: '平面道路',
        text: '無座標數據'
      };
    }

    const straightDist = calcDistanceKm(fromLat, fromLng, toLat, toLng);

    // 同一地點判定：ID 相同（且非空），或名稱相同，或直線距離極短 (< 50米)
    if ((fromId && toId && fromId === toId) ||
        (fromSpot.nameZh && toSpot.nameZh && fromSpot.nameZh === toSpot.nameZh) ||
        straightDist < 0.05) {
      return {
        distanceKm: 0,
        durationMins: 0,
        isWalk: true,
        roadType: 'walk',
        highway: '同景點或步行即達',
        text: '🚶 同地點 / 步行即達 (0~2 分鐘)'
      };
    }

    // 1. 優先查閱校準矩陣
    const key1 = `${fromId}:${toId}`;
    const key2 = `${toId}:${fromId}`;
    if (fromId && toId && window.KYUSHU_CORRIDORS && (window.KYUSHU_CORRIDORS[key1] || window.KYUSHU_CORRIDORS[key2])) {
      const matched = window.KYUSHU_CORRIDORS[key1] || window.KYUSHU_CORRIDORS[key2];
      return {
        distanceKm: matched.distKm,
        durationMins: matched.mins,
        isWalk: matched.roadType === 'walk',
        roadType: matched.roadType,
        highway: matched.highway,
        text: matched.roadType === 'walk'
          ? `🚶 步行約 ${matched.distKm} 公里・約 ${matched.mins} 分鐘 (${matched.highway})`
          : `🚗 約 ${matched.distKm} 公里・車程 ${formatDuration(matched.mins)} (${matched.highway})`
      };
    }

    // 2. 短途 (< 0.8 km) 判定為步行
    if (straightDist < 0.8) {
      const walkMeters = Math.max(50, Math.round(straightDist * 1000));
      const walkMins = Math.max(2, Math.round(walkMeters / 75)); // 4.5 km/h
      return {
        distanceKm: Number((walkMeters / 1000).toFixed(2)),
        durationMins: walkMins,
        isWalk: true,
        roadType: 'walk',
        highway: '周邊人行步道',
        text: `🚶 步行約 ${walkMeters} 公尺・約 ${walkMins} 分鐘`
      };
    }

    // 3. 地形與路網動態推估模型
    // 檢查是否涉及山區 (高千穗/阿蘇/別府山區/由布院: 32.5 <= lat <= 33.35, 130.95 <= lng <= 131.6)
    const isMountain = (fromLat >= 32.5 && fromLat <= 33.35 && fromLng >= 130.95 && fromLng <= 131.6) ||
                       (toLat >= 32.5 && toLat <= 33.35 && toLng >= 130.95 && toLng <= 131.6);

    // 檢查是否為市區核心 (福岡市區或熊本市區)
    const isFukuokaUrban = (fromLat >= 33.55 && fromLat <= 33.65 && fromLng >= 130.35 && fromLng <= 130.48) &&
                           (toLat >= 33.55 && toLat <= 33.65 && toLng >= 130.35 && toLng <= 130.48);
    const isKumamotoUrban = (fromLat >= 32.75 && fromLat <= 32.85 && fromLng >= 130.65 && fromLng <= 130.75) &&
                            (toLat >= 32.75 && toLat <= 32.85 && toLng >= 130.65 && toLng <= 130.75);
    const isUrban = isFukuokaUrban || isKumamotoUrban;

    let detourFactor = 1.35; // 預設九州公路繞行係數
    let avgSpeedKmH = 65;    // 預設綜合行車均速
    let roadTypeName = '九州高速/幹線國道';
    let roadTypeKey = 'highway';

    if (isMountain) {
      detourFactor = 1.52;   // 山路多彎與地形阻隔
      avgSpeedKmH = 42;      // 山路均速慢
      roadTypeName = '中九州山區公路 (國道/縣道多彎)';
      roadTypeKey = 'mountain';
    } else if (isUrban) {
      detourFactor = 1.25;
      avgSpeedKmH = 26;      // 市區紅綠燈與塞車
      roadTypeName = '市區平面道路';
      roadTypeKey = 'urban';
    }

    const roadDist = Math.round(straightDist * detourFactor);
    // 行車時間 + 4 分鐘出入停車場與紅綠燈緩衝
    const driveMins = Math.max(5, Math.round((roadDist / avgSpeedKmH) * 60) + 4);

    return {
      distanceKm: roadDist,
      durationMins: driveMins,
      isWalk: false,
      roadType: roadTypeKey,
      highway: roadTypeName,
      text: `🚗 約 ${roadDist} 公里・車程約 ${formatDuration(driveMins)} (${roadTypeName})`
    };
  }

  function formatDuration(mins) {
    if (mins === undefined || mins === null || isNaN(mins)) return '0 分鐘';
    if (mins < 60) return `${mins} 分鐘`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h} 小時 ${m} 分` : `${h} 小時`;
  }

  function parseTimeToMinutes(timeStr) {
    if (!timeStr) return 9 * 60; // 預設 09:00
    const str = String(timeStr).trim();
    const match = str.match(/(\d{1,2}):(\d{2})/);
    if (!match) return 9 * 60;
    const h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    const mins = h * 60 + m;
    return str.includes('+1') ? mins + 1440 : mins;
  }

  function formatMinutesToTime(totalMins) {
    if (isNaN(totalMins)) return '--:--';
    const isNextDay = totalMins >= 24 * 60;
    let normalized = totalMins % (24 * 60);
    if (normalized < 0) normalized += 24 * 60;
    const h = Math.floor(normalized / 60);
    const m = normalized % 60;
    const timeFormatted = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    return isNextDay ? `(+1日) ${timeFormatted}` : timeFormatted;
  }

  /* ==========================================================================
     3. 時間漣漪連鎖推算引擎 (Timeline Ripple Propagation)
     ========================================================================== */
  function recalculateItineraryTimeline(days) {
    if (!days || !Array.isArray(days)) return [];

    days.forEach((day, dIdx) => {
      let currentMinute = parseTimeToMinutes(day.departureTime || '09:00');
      let totalDriveMins = 0;
      let totalDriveKm = 0;
      let totalActivityMins = 0;
      let hasLongLegWarning = false;
      let hasMountainWarning = false;

      day.items = day.items || [];

      day.items.forEach((item, itemIdx) => {
        item.id = item.id || item.spotId;
        // 查找景點完整元數據（優先內建，次之自訂）
        const spotMeta = getSpotById(item.spotId || item.id) || item.spotData || {};
        item.spotData = spotMeta;
        if (spotMeta && typeof spotMeta.lat === 'number') {
          item.lat = spotMeta.lat;
          item.lng = spotMeta.lng;
        } else {
          item.lat = typeof item.lat === 'number' ? item.lat : spotMeta.lat;
          item.lng = typeof item.lng === 'number' ? item.lng : spotMeta.lng;
        }
        item.nameZh = item.nameZh || spotMeta.nameZh || '自訂地點';
        item.durationMinutes = item.durationMinutes !== undefined ? item.durationMinutes : (spotMeta.defaultStayMins || 60);

        if (itemIdx === 0) {
          // 第一站
          item.transitFromPrev = null;
          item.arriveTime = formatMinutesToTime(currentMinute);
          currentMinute += item.durationMinutes;
          item.departTime = formatMinutesToTime(currentMinute);
          totalActivityMins += item.durationMinutes;
        } else {
          // 後續各站，計算自上一站的交通
          const prevItem = day.items[itemIdx - 1];
          const transit = calculateTransit(prevItem, item);
          item.transitFromPrev = transit;

          totalDriveMins += transit.durationMins;
          totalDriveKm += transit.distanceKm;

          if (transit.durationMins >= 60) {
            hasLongLegWarning = true;
          }
          if (transit.roadType === 'mountain') {
            hasMountainWarning = true;
          }

          // 抵達時間 = 上一站出發時間 + 車程
          currentMinute += transit.durationMins;
          item.arriveTime = formatMinutesToTime(currentMinute);

          // 出發時間 = 抵達時間 + 停留時長
          currentMinute += item.durationMinutes;
          item.departTime = formatMinutesToTime(currentMinute);
          totalActivityMins += item.durationMinutes;
        }
      });

      // 彙整當日指標
      day.stats = {
        totalDriveMins,
        totalDriveKm,
        totalActivityMins,
        dayEndTime: day.items.length > 0 ? day.items[day.items.length - 1].departTime : day.departureTime,
        isExtremeDrive: totalDriveMins >= 270, // 4.5 小時以上為地獄拉車
        hasLongLegWarning,
        hasMountainWarning
      };
    });

    // 連動更新多天數紙本手冊列印容器
    renderPrintHandbook();

    return days;
  }

  /* ==========================================================================
     4. 全域應用程式狀態 (Application State)
     ========================================================================== */
  const STATE = {
    currentPresetId: safeStorageGet('kyushu_preset_id', 'preset-plan-b'),
    activeDayIndex: 0,
    activePerspective: safeStorageGet('kyushu_perspective', 'all'),
    itineraryDays: [],
    selectedFlightId: safeStorageGet('kyushu_selected_flight', 'starlux-fuk-roundtrip'),
    customFlightData: JSON.parse(safeStorageGet('kyushu_custom_flight_data', 'null')),
    flightFilter: 'all',
    customSpots: JSON.parse(safeStorageGet('kyushu_custom_spots', '[]')),
    checklist: JSON.parse(safeStorageGet('kyushu_checklist', '[]')),
    expenses: JSON.parse(safeStorageGet('kyushu_expenses', '[]')),
    jpyRate: Number(safeStorageGet('kyushu_jpy_rate', '0.215')),
    leafletMap: null,
    mapMarkers: [],
    mapPolyline: null
  };

  /* ==========================================================================
     5. 預設範本載入與快取持久化 (Preset Loading & State Persistence)
     ========================================================================== */
  function loadPreset(presetId, forceReset = false) {
    const preset = (window.ITINERARY_PRESETS || []).find(p => p.id === presetId || (p.aliasIds && p.aliasIds.includes(presetId))) || window.ITINERARY_PRESETS[1]; // 預設方案 B
    STATE.currentPresetId = preset.id;
    safeStorageSet('kyushu_preset_id', preset.id);

    // 檢查是否有儲存的使用者自訂行程 (兼顧新舊 alias ID)
    let savedCustom = safeStorageGet(`kyushu_custom_plan_${preset.id}`);
    if (!savedCustom && preset.aliasIds) {
      for (const aid of preset.aliasIds) {
        const legacy = safeStorageGet(`kyushu_custom_plan_${aid}`);
        if (legacy) {
          savedCustom = legacy;
          break;
        }
      }
    }

    if (savedCustom && !forceReset) {
      try {
        const parsed = JSON.parse(savedCustom);
        // 嚴格確保至少具備完整 5 天，避免載入舊版 2天/3天 快取
        if (Array.isArray(parsed) && parsed.length >= 5) {
          STATE.itineraryDays = parsed;
        } else {
          STATE.itineraryDays = JSON.parse(JSON.stringify(preset.days));
        }
      } catch (e) {
        STATE.itineraryDays = JSON.parse(JSON.stringify(preset.days));
      }
    } else {
      STATE.itineraryDays = JSON.parse(JSON.stringify(preset.days));
    }

    // 重建時間漣漪與車程精算
    recalculateItineraryTimeline(STATE.itineraryDays);
    syncFlightToItinerary(getSelectedFlight(), false);
    STATE.activeDayIndex = 0;

    renderPresetCards();
    renderDayTabs();
    renderDayTimeline();
    renderReportComparison();
    updateMap();
    saveCurrentItinerary();
  }

  function saveCurrentItinerary() {
    safeStorageSet(`kyushu_custom_plan_${STATE.currentPresetId}`, JSON.stringify(STATE.itineraryDays));
  }

  /* ==========================================================================
     5.5. 航班選擇器與時間動態同步模組 (Flight Selector & Dynamic Time Sync)
     ========================================================================== */
  function getSelectedFlight() {
    if (STATE.selectedFlightId === 'custom' && STATE.customFlightData) {
      return STATE.customFlightData;
    }
    const flights = (typeof KYUSHU_FLIGHTS !== 'undefined') ? KYUSHU_FLIGHTS : (window.KYUSHU_FLIGHTS || []);
    const found = flights.find(f => f.id === STATE.selectedFlightId);
    return found || flights[0] || null;
  }

  function updateFlightUI(flight) {
    if (!flight) flight = getSelectedFlight();
    if (!flight) return;

    // 更新頂部 Header 晶片
    const headerFlightText = document.getElementById('header-selected-flight-text');
    if (headerFlightText) {
      headerFlightText.textContent = `${flight.airline} (${flight.outbound ? flight.outbound.flightNo : ''} / ${flight.inbound ? flight.inbound.flightNo : ''})`;
    }

    // 更新規劃區工具列晶片
    const plannerFlightText = document.getElementById('planner-flight-text');
    if (plannerFlightText) {
      plannerFlightText.textContent = `${flight.airline} ${flight.outbound ? flight.outbound.flightNo : ''}/${flight.inbound ? flight.inbound.flightNo : ''}`;
    }
  }

  function syncFlightToItinerary(flight, showToastMsg = true) {
    if (!flight || !STATE.itineraryDays || STATE.itineraryDays.length === 0) return;

    STATE.selectedFlightId = flight.id;
    safeStorageSet('kyushu_selected_flight', flight.id);

    const days = STATE.itineraryDays;
    const day1 = days[0];
    const day5 = days[days.length - 1];

    // 1. 同步 Day 1 (入境取車，保留約 60 分鐘通關取車)
    if (day1 && day1.items && day1.items.length > 0 && flight.outbound) {
      const arrTime = flight.outbound.arrTime || '18:00';
      day1.departureTime = arrTime;

      const firstItem = day1.items[0];
      const isAirportItem = (firstItem.spotId === 'fuk-airport' || firstItem.spotId === 'kmj-airport' ||
                             firstItem.id === 'fuk-airport' || firstItem.id === 'kmj-airport' ||
                             (firstItem.nameZh && firstItem.nameZh.includes('機場')));

      if (isAirportItem) {
        firstItem.durationMinutes = 60; // 落地後保留約 60 分鐘通關取車
        const isKmj = flight.outbound.airportCode === 'KMJ' || (flight.routeType && flight.routeType.includes('kmj-roundtrip')) || flight.routeType === 'openjaw-kmj-fuk';
        const newSpotId = isKmj ? 'kmj-airport' : 'fuk-airport';
        firstItem.spotId = newSpotId;
        firstItem.id = newSpotId;
        firstItem.nameZh = isKmj ? '熊本機場 (KMJ) 抵達取車' : '福岡機場 (FUK) 抵達取車';

        const airportSpot = getSpotById(newSpotId);
        if (airportSpot) {
          firstItem.lat = airportSpot.lat;
          firstItem.lng = airportSpot.lng;
          firstItem.spotData = airportSpot;
        }

        firstItem.customNotes = `搭乘 ${flight.airline} ${flight.outbound.flightNo} (${flight.outbound.depTime} ➔ ${flight.outbound.arrTime}) 抵達。落地後預留 60 分鐘辦理入境通關、提領行李與租車取車手續。`;
      }
    }

    // 2. 同步 Day 5 (機場報到還車，起飛前約 120 分鐘抵達機場還車安檢)
    let isEarlyDay5Departure = false;
    if (day5 && day5.items && day5.items.length > 0 && flight.inbound) {
      const depTime = flight.inbound.depTime || '19:10';
      const flightDepMins = parseTimeToMinutes(depTime);
      const targetAirportArriveMins = flightDepMins - 120; // 起飛前 120 分鐘抵達機場還車安檢

      const lastIdx = day5.items.length - 1;
      const lastItem = day5.items[lastIdx];
      const isAirportItem = (lastItem.spotId === 'fuk-airport' || lastItem.spotId === 'kmj-airport' ||
                             lastItem.id === 'fuk-airport' || lastItem.id === 'kmj-airport' ||
                             (lastItem.nameZh && lastItem.nameZh.includes('機場')));

      if (isAirportItem) {
        lastItem.durationMinutes = 120; // 機場停留 120 分鐘直至起飛
        const isKmj = flight.inbound.airportCode === 'KMJ' || (flight.routeType && flight.routeType.includes('kmj-roundtrip')) || flight.routeType === 'openjaw-fuk-kmj';
        const newSpotId = isKmj ? 'kmj-airport' : 'fuk-airport';
        lastItem.spotId = newSpotId;
        lastItem.id = newSpotId;
        lastItem.nameZh = isKmj ? `熊本機場 (KMJ) ➔ 桃園 (${flight.inbound.flightNo} ${flight.inbound.depTime}-${flight.inbound.arrTime})`
                                : `福岡機場 (FUK) ➔ 桃園 (${flight.inbound.flightNo} ${flight.inbound.depTime}-${flight.inbound.arrTime})`;

        const airportSpot = getSpotById(newSpotId);
        if (airportSpot) {
          lastItem.lat = airportSpot.lat;
          lastItem.lng = airportSpot.lng;
          lastItem.spotData = airportSpot;
        }

        lastItem.customNotes = `搭乘 ${flight.airline} ${flight.inbound.flightNo} (${flight.inbound.depTime} ➔ ${flight.inbound.arrTime}) 返台。起飛前 120 分鐘抵達機場辦理還車、退稅提領與安檢託運。`;

        // 倒推計算 Day 5 出發時間：使最後一站正好在 targetAirportArriveMins 抵達
        let elapsedBeforeAirport = 0;
        for (let i = 0; i < lastIdx; i++) {
          const it = day5.items[i];
          const itMeta = getSpotById(it.spotId || it.id) || it.spotData || {};
          const dur = it.durationMinutes !== undefined ? it.durationMinutes : (itMeta.defaultStayMins || 60);
          elapsedBeforeAirport += dur;
          const transit = calculateTransit(it, day5.items[i + 1]);
          elapsedBeforeAirport += (transit ? transit.durationMins : 20);
        }

        let computedDay5Start = targetAirportArriveMins - elapsedBeforeAirport;
        while (computedDay5Start < 0) computedDay5Start += 24 * 60;
        computedDay5Start = computedDay5Start % (24 * 60);
        if (computedDay5Start < 390) isEarlyDay5Departure = true; // 06:30 前出發

        const h = Math.floor(computedDay5Start / 60);
        const m = computedDay5Start % 60;
        day5.departureTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      }
    }

    // 3. 連鎖觸發時間漣漪更新
    recalculateItineraryTimeline(STATE.itineraryDays);
    saveCurrentItinerary();

    // 4. 更新 UI 指標與文字
    updateFlightUI(flight);
    if (typeof renderDayTabs === 'function') renderDayTabs();
    if (typeof renderDayTimeline === 'function') renderDayTimeline();
    if (typeof updateMap === 'function') updateMap();

    if (showToastMsg) {
      if (isEarlyDay5Departure) {
        showToast(`✈️ 已切換為【${flight.name}】！⚠️ 回程為早班機，Day 5 出發較早，建議適度精簡當日景點停留。`, '⚠️');
      } else {
        showToast(`✈️ 已成功切換為【${flight.name}】！Day 1 抵達與 Day 5 機場還車時間已智慧同步連鎖推算。`, '✈️');
      }
    }
  }

  function renderFlightCards(filter = 'all') {
    const container = document.getElementById('flight-cards-container');
    const customForm = document.getElementById('custom-flight-form-card');
    const evaAlert = document.getElementById('flight-eva-alert');
    if (!container) return;

    if (filter === 'custom') {
      container.style.display = 'none';
      if (customForm) customForm.style.display = 'block';
      if (evaAlert) evaAlert.style.display = 'none';
      return;
    }

    container.style.display = 'flex';
    if (customForm) customForm.style.display = 'none';

    // 檢查是否顯示長榮熊本警示
    if (evaAlert) {
      evaAlert.style.display = (filter === 'BR' || filter === 'openjaw' || (STATE.currentPresetId === 'preset-plan-b' || STATE.currentPresetId === 'preset-plan-c')) ? 'flex' : 'none';
    }

    const flights = (typeof KYUSHU_FLIGHTS !== 'undefined') ? KYUSHU_FLIGHTS : (window.KYUSHU_FLIGHTS || []);
    let filtered = flights;
    if (filter === 'JX') filtered = flights.filter(f => f.airlineCode === 'JX');
    else if (filter === 'CI') filtered = flights.filter(f => f.airlineCode === 'CI');
    else if (filter === 'BR') filtered = flights.filter(f => f.airlineCode === 'BR');
    else if (filter === 'openjaw') filtered = flights.filter(f => f.routeType && f.routeType.startsWith('openjaw'));

    const currentFlight = getSelectedFlight();

    container.innerHTML = filtered.map(flight => {
      const isCurrent = currentFlight && (currentFlight.id === flight.id);
      const isEva = flight.airlineCode === 'BR';
      return `
        <div class="flight-card ${isCurrent ? 'active-flight' : ''}" style="border-left-color: ${flight.airlineColor || '#0284c7'};" data-flight-id="${flight.id}">
          <div class="flight-card-header">
            <div class="flight-card-airline-title">
              <span style="font-size:1.3rem;">${flight.airlineLogo || '✈️'}</span>
              <span class="flight-airline-badge" style="color:${flight.airlineColor || '#0f172a'};">${escapeHtml(flight.name)}</span>
            </div>
            <div class="flight-card-tags">
              <span class="badge ${flight.badgeClass || 'badge-primary'}">${escapeHtml(flight.badge || flight.tag)}</span>
              <span class="badge badge-outline" style="font-size:0.75rem;">${escapeHtml(flight.routeTypeName || '')}</span>
              ${isCurrent ? '<span class="badge badge-success" style="font-weight:700;">✓ 當前套用中</span>' : ''}
            </div>
          </div>

          <div class="flight-legs-grid">
            <div class="flight-leg-box">
              <span class="flight-leg-label">🛫 去程班機 (${flight.outbound.flightNo})</span>
              <div class="flight-leg-route">
                <span>${escapeHtml(flight.outbound.from)}</span>
                <span class="flight-route-arrow">➔</span>
                <span>${escapeHtml(flight.outbound.to)}</span>
              </div>
              <div class="flight-leg-timing">
                <span>起降：<strong>${flight.outbound.depTime}</strong> 起飛 ➔ <strong>${flight.outbound.arrTime}</strong> 抵達</span>
                <span style="color:var(--color-slate-400);">(${flight.outbound.duration})</span>
              </div>
            </div>

            <div class="flight-leg-box">
              <span class="flight-leg-label">🛬 回程班機 (${flight.inbound.flightNo})</span>
              <div class="flight-leg-route">
                <span>${escapeHtml(flight.inbound.from)}</span>
                <span class="flight-route-arrow">➔</span>
                <span>${escapeHtml(flight.inbound.to)}</span>
              </div>
              <div class="flight-leg-timing">
                <span>起降：<strong>${flight.inbound.depTime}</strong> 起飛 ➔ <strong>${flight.inbound.arrTime}</strong> 抵達</span>
                <span style="color:var(--color-slate-400);">(${flight.inbound.duration})</span>
              </div>
            </div>
          </div>

          <div class="flight-card-footer">
            <div class="flight-notes-text">
              💡 ${escapeHtml(flight.notes || '')}
              ${isEva ? '<br><span style="color:#d97706; font-size:0.78rem;">⚠️ 註：長榮航空無熊本航線，若走熊本建議改選星宇或華航。</span>' : ''}
            </div>
            <div>
              <button type="button" class="btn-apply-flight ${isCurrent ? 'is-current' : 'btn-primary'}" data-flight-id="${flight.id}">
                ${isCurrent ? '✓ 當前航班' : '✈️ 選擇此航班'}
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // 綁定卡片整張點擊與按鈕選擇 (支援行動端單手直接輕觸切換)
    container.querySelectorAll('.flight-card').forEach(card => {
      card.addEventListener('click', () => {
        const fId = card.dataset.flightId;
        const targetFlight = (STATE.customFlightData && STATE.customFlightData.id === fId) ? STATE.customFlightData : flights.find(f => f.id === fId);
        if (targetFlight) {
          syncFlightToItinerary(targetFlight, true);
          renderFlightCards(STATE.flightFilter);
          closeFlightModal();
        }
      });
    });

    container.querySelectorAll('.btn-apply-flight').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const fId = btn.dataset.flightId;
        const targetFlight = (STATE.customFlightData && STATE.customFlightData.id === fId) ? STATE.customFlightData : flights.find(f => f.id === fId);
        if (targetFlight) {
          syncFlightToItinerary(targetFlight, true);
          renderFlightCards(STATE.flightFilter);
          closeFlightModal();
        }
      });
    });
  }

  function openFlightModal() {
    const modal = document.getElementById('flight-modal-overlay');
    if (!modal) return;
    modal.style.display = 'flex';
    setTimeout(() => {
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
    }, 10);
    renderFlightCards(STATE.flightFilter);
  }

  function closeFlightModal() {
    const modal = document.getElementById('flight-modal-overlay');
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    setTimeout(() => {
      modal.style.display = 'none';
    }, 250);
  }

  function initFlightSelector() {
    // 綁定開啟按鈕
    const triggerBtn = document.getElementById('btn-flight-selector');
    if (triggerBtn) triggerBtn.addEventListener('click', openFlightModal);

    const headerChip = document.getElementById('header-selected-flight-chip');
    if (headerChip) headerChip.addEventListener('click', openFlightModal);

    const plannerChangeBtn = document.getElementById('btn-planner-change-flight');
    if (plannerChangeBtn) plannerChangeBtn.addEventListener('click', openFlightModal);

    const plannerPill = document.getElementById('planner-flight-pill');
    if (plannerPill) plannerPill.addEventListener('click', openFlightModal);

    // 綁定關閉按鈕
    const closeBtn = document.getElementById('btn-close-flight-modal');
    if (closeBtn) closeBtn.addEventListener('click', closeFlightModal);

    const modalOverlay = document.getElementById('flight-modal-overlay');
    if (modalOverlay) {
      modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeFlightModal();
      });
    }

    // 綁定篩選按鈕
    const filterTabs = document.getElementById('flight-filter-tabs');
    if (filterTabs) {
      filterTabs.querySelectorAll('.flight-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          filterTabs.querySelectorAll('.flight-filter-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          STATE.flightFilter = btn.dataset.filter || 'all';
          renderFlightCards(STATE.flightFilter);
        });
      });
    }

    // 綁定自訂航班按鈕
    const btnCancelCustom = document.getElementById('btn-custom-flight-cancel');
    if (btnCancelCustom) {
      btnCancelCustom.addEventListener('click', () => {
        STATE.flightFilter = 'all';
        if (filterTabs) {
          filterTabs.querySelectorAll('.flight-filter-btn').forEach(b => b.classList.remove('active'));
          const allBtn = filterTabs.querySelector('.flight-filter-btn[data-filter="all"]');
          if (allBtn) allBtn.classList.add('active');
        }
        renderFlightCards('all');
      });
    }

    const btnSaveCustom = document.getElementById('btn-custom-flight-save');
    if (btnSaveCustom) {
      btnSaveCustom.addEventListener('click', () => {
        const airline = (document.getElementById('custom-flight-airline') && document.getElementById('custom-flight-airline').value.trim()) || '自訂航班';
        const routeType = (document.getElementById('custom-flight-route-type') && document.getElementById('custom-flight-route-type').value) || 'fuk-roundtrip';
        const outNo = (document.getElementById('custom-flight-outbound-no') && document.getElementById('custom-flight-outbound-no').value.trim()) || '自訂去程';
        const outFrom = (document.getElementById('custom-flight-outbound-from') && document.getElementById('custom-flight-outbound-from').value.trim()) || 'TPE 桃園';
        const outTo = (document.getElementById('custom-flight-outbound-to') && document.getElementById('custom-flight-outbound-to').value.trim()) || 'FUK 福岡';
        const outDep = (document.getElementById('custom-flight-outbound-deptime') && document.getElementById('custom-flight-outbound-deptime').value) || '14:45';
        const outArr = (document.getElementById('custom-flight-outbound-arrtime') && document.getElementById('custom-flight-outbound-arrtime').value) || '18:00';

        const inNo = (document.getElementById('custom-flight-inbound-no') && document.getElementById('custom-flight-inbound-no').value.trim()) || '自訂回程';
        const inFrom = (document.getElementById('custom-flight-inbound-from') && document.getElementById('custom-flight-inbound-from').value.trim()) || 'FUK 福岡';
        const inTo = (document.getElementById('custom-flight-inbound-to') && document.getElementById('custom-flight-inbound-to').value.trim()) || 'TPE 桃園';
        const inDep = (document.getElementById('custom-flight-inbound-deptime') && document.getElementById('custom-flight-inbound-deptime').value) || '19:10';
        const inArr = (document.getElementById('custom-flight-inbound-arrtime') && document.getElementById('custom-flight-inbound-arrtime').value) || '20:50';

        const customObj = {
          id: 'custom',
          airline: airline,
          airlineEn: 'Custom Flight',
          airlineCode: 'CUSTOM',
          airlineColor: '#6366f1',
          airlineLogo: '✈️',
          name: `${airline} · 自訂班機 (${outNo}/${inNo})`,
          routeType: routeType,
          routeTypeName: '使用者自訂',
          badge: '自訂航班',
          badgeClass: 'badge-secondary',
          tag: '自訂時段',
          outbound: {
            flightNo: outNo,
            airline: airline,
            from: outFrom,
            to: outTo,
            airportCode: (outTo.includes('熊本') || outTo.includes('KMJ')) ? 'KMJ' : 'FUK',
            depTime: outDep,
            arrTime: outArr,
            duration: '自訂'
          },
          inbound: {
            flightNo: inNo,
            airline: airline,
            from: inFrom,
            to: inTo,
            airportCode: (inFrom.includes('熊本') || inFrom.includes('KMJ')) ? 'KMJ' : 'FUK',
            depTime: inDep,
            arrTime: inArr,
            duration: '自訂'
          },
          notes: '使用者手動自訂航班。'
        };

        STATE.selectedFlightId = 'custom';
        STATE.customFlightData = customObj;
        safeStorageSet('kyushu_selected_flight', 'custom');
        safeStorageSet('kyushu_custom_flight_data', JSON.stringify(customObj));

        syncFlightToItinerary(customObj, true);
        closeFlightModal();
      });
    }

    // 暴露全域引擎供自動化測試
    window.KYUSHU_FLIGHT_ENGINE = {
      STATE,
      getSelectedFlight,
      syncFlightToItinerary,
      recalculateItineraryTimeline,
      getSpotById,
      calculateTransit,
      parseTimeToMinutes,
      formatMinutesToTime,
      KYUSHU_FLIGHTS: (typeof KYUSHU_FLIGHTS !== 'undefined') ? KYUSHU_FLIGHTS : window.KYUSHU_FLIGHTS
    };

    // 初始同步當前航班
    const initialFlight = getSelectedFlight();
    updateFlightUI(initialFlight);
  }

  /* ==========================================================================
     6. UI 渲染模組：範本切換列與天數分頁
     ========================================================================== */
  function renderPresetCards() {
    const container = document.getElementById('preset-cards-container');
    if (!container || !window.ITINERARY_PRESETS) return;

    container.innerHTML = window.ITINERARY_PRESETS.map(preset => {
      const isActive = preset.id === STATE.currentPresetId;
      return `
        <div class="preset-card ${isActive ? 'active' : ''}" data-preset-id="${preset.id}">
          <div class="preset-card-header">
            <span class="preset-badge ${preset.badgeClass || 'badge-primary'}">${preset.badge}</span>
            <span style="font-size:0.8rem; color:var(--color-slate-500); font-weight:600;">共 ${preset.totalDays} 天</span>
          </div>
          <div class="preset-card-title">${escapeHtml(preset.name)}</div>
          <div class="preset-card-desc">${escapeHtml(preset.description)}</div>
          <div style="margin-top:auto; padding-top:0.5rem; font-size:0.75rem; color:var(--color-slate-500); border-top:1px dashed var(--color-slate-200);">
            ✈️ ${escapeHtml(preset.flightInfo || '')}
          </div>
        </div>
      `;
    }).join('');

    container.querySelectorAll('.preset-card').forEach(card => {
      card.addEventListener('click', () => {
        const pId = card.dataset.presetId;
        if (pId !== STATE.currentPresetId) {
          loadPreset(pId);
          showToast(`已成功切換至：${card.querySelector('.preset-card-title').textContent}`);
        }
      });
    });
  }

  function renderDayTabs() {
    const container = document.getElementById('day-tabs-container');
    if (!container) return;

    const days = STATE.itineraryDays;
    let html = days.map((day, idx) => {
      const isActive = idx === STATE.activeDayIndex;
      const formattedDate = formatDayDate(day.date);
      const weekday = day.dayOfWeek || getDayOfWeek(day.date);
      return `
        <button class="day-tab-btn ${isActive ? 'active' : ''}" data-day-index="${idx}">
          <span class="day-tab-num">Day ${day.day}</span>
          <span class="day-tab-sub">${escapeHtml(formattedDate)} ${escapeHtml(weekday)}</span>
        </button>
      `;
    }).join('');

    html += `
      <button class="day-add-btn" id="btn-add-day">
        <span>+ 新增一天 (Day ${days.length + 1})</span>
      </button>
    `;

    container.innerHTML = html;

    // 行動端流暢置中高亮選中天數 (Horizontal Scroll Centering)
    const activeTab = container.querySelector('.day-tab-btn.active');
    if (activeTab) {
      setTimeout(() => {
        activeTab.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }, 50);
    }

    container.querySelectorAll('.day-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        STATE.activeDayIndex = Number(btn.dataset.dayIndex);
        renderDayTabs();
        renderDayTimeline();
        updateMap();
      });
    });

    const addBtn = document.getElementById('btn-add-day');
    if (addBtn) {
      addBtn.addEventListener('click', handleAddNewDay);
    }
  }

  function handleAddNewDay() {
    const days = STATE.itineraryDays;
    const newDayNum = days.length + 1;
    const prevDay = days[days.length - 1];

    let newDate = '2026/03/01';
    let newDayOfWeek = '星期日';

    if (prevDay && prevDay.date) {
      try {
        const cleanPrev = prevDay.date.replace(/\//g, '-');
        const d = new Date(cleanPrev);
        if (!isNaN(d.getTime())) {
          d.setDate(d.getDate() + 1);
          newDate = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
          const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
          newDayOfWeek = weekdays[d.getDay()];
        }
      } catch (e) {}
    }

    days.push({
      day: newDayNum,
      date: newDate,
      dayOfWeek: newDayOfWeek,
      title: `自訂 Day ${newDayNum} 行程`,
      departureTime: '09:00',
      warningNotes: '自由安排九州各縣探索亮點。',
      items: [
        { spotId: 'fukuoka-hotel-hakata', nameZh: '福岡市區飯店', durationMinutes: 15, customNotes: '早晨出發。' }
      ]
    });

    recalculateItineraryTimeline(days);
    STATE.activeDayIndex = days.length - 1;
    renderDayTabs();
    renderDayTimeline();
    updateMap();
    saveCurrentItinerary();
    showToast(`已新增 Day ${newDayNum}`);
  }

  /* ==========================================================================
     7. UI 渲染模組：單日行程時間軸與景點卡片
     ========================================================================== */
  function renderDayTimeline() {
    const container = document.getElementById('timeline-render-container');
    const headerContainer = document.getElementById('day-header-container');
    if (!container || !headerContainer) return;

    const currentDay = STATE.itineraryDays[STATE.activeDayIndex];
    if (!currentDay) {
      container.innerHTML = '<div class="empty-spots-card">目前無行程天數，請點擊上方新增。</div>';
      headerContainer.innerHTML = '';
      return;
    }

    const stats = currentDay.stats || {};

    // 1. 渲染單日標頭卡（包含日期修改、出發時間、車程指標與警報）
    headerContainer.innerHTML = `
      <div class="day-header-card">
        <div class="day-header-main">
          <div style="display:flex; align-items:center; gap:0.5rem; flex:1; flex-wrap:wrap;">
            <span class="badge badge-primary" style="font-size:0.9rem; padding:0.4rem 0.8rem;">Day ${currentDay.day}</span>
            <input type="text" class="day-title-input" id="input-day-title" value="${escapeHtml(currentDay.title)}" placeholder="點擊修改當日行程標題...">
          </div>
          <div class="day-timing-control">
            <span>📅 日期：</span>
            <input type="date" id="input-day-date" value="${formatDateForInput(currentDay.date)}" style="padding:0.35rem 0.5rem; border:1px solid var(--color-slate-300); border-radius:6px; font-weight:600; font-size:0.85rem;">
          </div>
          <div class="day-timing-control">
            <span>🚗 出發：</span>
            <input type="time" id="input-day-departure-time" value="${currentDay.departureTime || '09:00'}">
          </div>
          <div style="display:flex; gap:0.4rem;">
            <button class="btn btn-outline btn-sm" id="btn-delete-current-day" title="刪除當日">🗑️ 刪除此日</button>
            <button class="btn btn-primary btn-sm" id="btn-open-spot-picker">+ 加入景點</button>
          </div>
        </div>

        ${currentDay.warningNotes ? `
          <div class="danger-alert-banner ${stats.isExtremeDrive ? '' : 'warning'}">
            <span class="alert-icon">${stats.isExtremeDrive ? '🚨' : '💡'}</span>
            <div>${escapeHtml(currentDay.warningNotes)}</div>
          </div>
        ` : ''}

        ${stats.isExtremeDrive ? `
          <div class="danger-alert-banner">
            <span class="alert-icon">⚠️</span>
            <div><strong>【嚴重拉車地獄警示】：</strong> 本日行車時間已達 <strong>${formatDuration(stats.totalDriveMins)}</strong> (${stats.totalDriveKm} 公里)！嬰兒無安全座椅手抱極度危險且易哭鬧暈車，長輩腰椎膝蓋負擔過大。極度建議改採「雙點進出」或依報告進行景點降級避險！</div>
          </div>
        ` : ''}

        <div class="day-stat-bar">
          <div class="stat-item">
            <span class="stat-label">預估總車程</span>
            <span class="stat-val ${stats.isExtremeDrive ? 'highlight-danger' : ''}">${formatDuration(stats.totalDriveMins || 0)}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">總行駛里程</span>
            <span class="stat-val">${stats.totalDriveKm || 0} km</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">景點活動時長</span>
            <span class="stat-val">${formatDuration(stats.totalActivityMins || 0)}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">預估結束時間</span>
            <span class="stat-val">${stats.dayEndTime || '--:--'}</span>
          </div>
        </div>
      </div>
    `;

    // 綁定標頭事件
    const titleInput = document.getElementById('input-day-title');
    if (titleInput) {
      titleInput.addEventListener('change', (e) => {
        currentDay.title = e.target.value.trim() || `Day ${currentDay.day}`;
        saveCurrentItinerary();
        renderPrintHandbook();
      });
    }

    const dateInput = document.getElementById('input-day-date');
    if (dateInput) {
      dateInput.addEventListener('change', (e) => {
        const val = e.target.value; // e.g. "2026-02-25"
        if (val) {
          const parts = val.split('-');
          currentDay.date = `${parts[0]}/${parts[1]}/${parts[2]}`;
          currentDay.dayOfWeek = getDayOfWeek(val);
          renderDayTabs();
          saveCurrentItinerary();
          renderPrintHandbook();
        }
      });
    }

    const depTimeInput = document.getElementById('input-day-departure-time');
    if (depTimeInput) {
      depTimeInput.addEventListener('change', (e) => {
        currentDay.departureTime = e.target.value;
        recalculateItineraryTimeline(STATE.itineraryDays);
        renderDayTimeline();
        saveCurrentItinerary();
      });
    }

    const delDayBtn = document.getElementById('btn-delete-current-day');
    if (delDayBtn) {
      delDayBtn.addEventListener('click', () => {
        if (STATE.itineraryDays.length <= 1) {
          alert('行程至少需保留 1 天！');
          return;
        }
        if (confirm(`確定要刪除 Day ${currentDay.day} 嗎？`)) {
          STATE.itineraryDays.splice(STATE.activeDayIndex, 1);
          STATE.itineraryDays.forEach((d, i) => d.day = i + 1);
          STATE.activeDayIndex = Math.max(0, STATE.activeDayIndex - 1);
          recalculateItineraryTimeline(STATE.itineraryDays);
          renderDayTabs();
          renderDayTimeline();
          updateMap();
          saveCurrentItinerary();
          showToast('已刪除該日行程');
        }
      });
    }

    const addSpotBtn = document.getElementById('btn-open-spot-picker');
    if (addSpotBtn) {
      addSpotBtn.addEventListener('click', openSpotPickerModal);
    }

    // 2. 渲染景點清單與交通連結條
    const items = currentDay.items || [];
    if (items.length === 0) {
      container.innerHTML = `
        <div class="empty-spots-card">
          <p style="font-size:1.1rem; font-weight:700;">本日尚未安排任何景點</p>
          <p>點擊上方「+ 加入景點」或挑選九州精選景點加入。</p>
          <button class="btn btn-primary" id="btn-empty-add-spot">+ 立即挑選景點</button>
        </div>
      `;
      const emptyAddBtn = document.getElementById('btn-empty-add-spot');
      if (emptyAddBtn) emptyAddBtn.addEventListener('click', openSpotPickerModal);
      return;
    }

    let timelineHtml = '<div class="timeline-container">';

    items.forEach((item, idx) => {
      const spot = item.spotData || {};

      // 交通連線 (第 2 站開始)
      if (idx > 0 && item.transitFromPrev) {
        const transit = item.transitFromPrev;
        const isLong = transit.durationMins >= 60;
        const isWalk = transit.isWalk;
        timelineHtml += `
          <div class="transit-connector">
            <div class="transit-bubble ${isLong ? 'long-drive' : ''} ${isWalk ? 'walk-drive' : ''}">
              <span>${transit.text}</span>
              ${isLong ? '<span class="badge badge-danger">⚠️ 單程長途・長輩/寶寶請靠站休息</span>' : ''}
            </div>
          </div>
        `;
      }

      // 景點卡片
      timelineHtml += `
        <div class="spot-card" draggable="true" data-spot-index="${idx}">
          <div class="spot-card-top">
            <div class="spot-main-info">
              <div class="spot-index-badge">${idx + 1}</div>
              <div class="spot-name-group">
                <div class="spot-name-zh">${escapeHtml(item.nameZh || spot.nameZh || '自訂地點')}</div>
                <div class="spot-name-ja">${escapeHtml(spot.nameJa || spot.city || '')}</div>
              </div>
            </div>
            <div class="spot-actions">
              <button type="button" class="btn btn-outline btn-icon btn-sm btn-move-up" data-idx="${idx}" title="上移此地點" aria-label="上移此地點">⬆️</button>
              <button type="button" class="btn btn-outline btn-icon btn-sm btn-move-down" data-idx="${idx}" title="下移此地點" aria-label="下移此地點">⬇️</button>
              <button type="button" class="btn btn-outline btn-icon btn-sm btn-remove-spot" data-idx="${idx}" title="移除此地點" aria-label="移除此地點" style="color:var(--color-danger);">✕</button>
            </div>
          </div>

          <div class="spot-timing-row">
            <div class="timing-badge">
              🕒 預計：<strong>${item.arriveTime || '--:--'}</strong> 抵達 ➔ <strong>${item.departTime || '--:--'}</strong> 出發
            </div>
            <div class="duration-control-wrap">
              <label style="font-size:0.8rem; color:var(--color-slate-600); white-space:nowrap;">停留時長：</label>
              <div class="duration-stepper-box">
                <button type="button" class="btn-stepper btn-stepper-minus" data-idx="${idx}" title="減少15分鐘" aria-label="減少15分鐘">－</button>
                <select class="duration-select" data-idx="${idx}" aria-label="停留時長選單">
                  ${[15, 30, 45, 60, 75, 90, 105, 120, 150, 180, 240, 720].map(m => `
                    <option value="${m}" ${item.durationMinutes === m ? 'selected' : ''}>${formatDuration(m)}</option>
                  `).join('')}
                </select>
                <button type="button" class="btn-stepper btn-stepper-plus" data-idx="${idx}" title="增加15分鐘" aria-label="增加15分鐘">＋</button>
              </div>
            </div>
          </div>

          ${renderSpotGenBox(spot, item)}

          ${item.customNotes ? `
            <div class="spot-custom-notes">
              <strong>📝 備註提醒：</strong> ${escapeHtml(item.customNotes)}
            </div>
          ` : ''}
        </div>
      `;
    });

    timelineHtml += '</div>';
    container.innerHTML = timelineHtml;

    bindTimelineEvents();
  }

  function renderSpotGenBox(spot, item) {
    const pers = STATE.activePerspective;
    const elder = spot.elderFit || {};
    const youth = spot.youthFit || {};
    const infant = spot.infantFit || {};

    const showElder = pers === 'all' || pers === 'elder';
    const showYouth = pers === 'all' || pers === 'youth';
    const showInfant = pers === 'all' || pers === 'infant';

    return `
      <div class="spot-gen-eval-box">
        ${showElder ? `
          <div class="gen-pill-col col-elder">
            <div class="gen-pill-title">
              <span>🧓 熟齡長輩評估</span>
              <span>⭐ ${elder.score || 8.5}/10</span>
            </div>
            <div><strong>步數：</strong> ${escapeHtml(elder.steps || '平緩')}</div>
            <div><strong>坡度：</strong> ${escapeHtml(elder.slope || '無特殊陡坡')}</div>
            <div><strong>飲食：</strong> ${escapeHtml(elder.dining || '日式清淡定食')}</div>
            ${elder.notes ? `<div style="color:#047857; font-weight:600; margin-top:0.2rem;">${escapeHtml(elder.notes)}</div>` : ''}
          </div>
        ` : ''}

        ${showYouth ? `
          <div class="gen-pill-col col-youth">
            <div class="gen-pill-title">
              <span>📸 年輕潮流探索</span>
              <span>⭐ ${youth.score || 9.0}/10</span>
            </div>
            <div><strong>美拍：</strong> ${escapeHtml(youth.photoSpot || '打卡拍照絕佳')}</div>
            <div><strong>話題美食：</strong> ${escapeHtml(youth.food || '人氣排隊名店')}</div>
            <div><strong>商場選品：</strong> ${escapeHtml(youth.shopping || '潮流特色商品')}</div>
          </div>
        ` : ''}

        ${showInfant ? `
          <div class="gen-pill-col col-infant">
            <div class="gen-pill-title">
              <span>👶 10月嬰兒照護</span>
              <span>⭐ ${infant.score || 8.0}/10</span>
            </div>
            <div><strong>推車：</strong> ${escapeHtml(infant.stroller || '可使用推車')}</div>
            <div><strong>育嬰室：</strong> ${escapeHtml(infant.nursingRoom || '備有無障礙洗手間與尿布台')}</div>
            ${infant.notes ? `<div style="color:#b45309; font-weight:700; margin-top:0.2rem;">${escapeHtml(infant.notes)}</div>` : ''}
          </div>
        ` : ''}
      </div>
    `;
  }

  function bindTimelineEvents() {
    const container = document.getElementById('timeline-render-container');
    if (!container) return;

    const currentDay = STATE.itineraryDays[STATE.activeDayIndex];
    if (!currentDay) return;

    // 停留時間調節（下拉選單）
    container.querySelectorAll('.duration-select').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const idx = Number(sel.dataset.idx);
        currentDay.items[idx].durationMinutes = Number(e.target.value);
        recalculateItineraryTimeline(STATE.itineraryDays);
        renderDayTimeline();
        saveCurrentItinerary();
      });
    });

    // 停留時長微調器（- / + 快速步進）
    const durationSteps = [15, 30, 45, 60, 75, 90, 105, 120, 150, 180, 240, 720];

    container.querySelectorAll('.btn-stepper-minus').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = Number(btn.dataset.idx);
        const cur = Number(currentDay.items[idx].durationMinutes) || 60;
        let next = cur - 15;
        for (let i = durationSteps.length - 1; i >= 0; i--) {
          if (durationSteps[i] < cur) {
            next = durationSteps[i];
            break;
          }
        }
        currentDay.items[idx].durationMinutes = Math.max(15, next);
        recalculateItineraryTimeline(STATE.itineraryDays);
        renderDayTimeline();
        saveCurrentItinerary();
      });
    });

    container.querySelectorAll('.btn-stepper-plus').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = Number(btn.dataset.idx);
        const cur = Number(currentDay.items[idx].durationMinutes) || 60;
        let next = cur + 15;
        for (let i = 0; i < durationSteps.length; i++) {
          if (durationSteps[i] > cur) {
            next = durationSteps[i];
            break;
          }
        }
        currentDay.items[idx].durationMinutes = Math.min(720, next);
        recalculateItineraryTimeline(STATE.itineraryDays);
        renderDayTimeline();
        saveCurrentItinerary();
      });
    });

    // 上移 / 下移
    container.querySelectorAll('.btn-move-up').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.idx);
        if (idx > 0) {
          const temp = currentDay.items[idx];
          currentDay.items[idx] = currentDay.items[idx - 1];
          currentDay.items[idx - 1] = temp;
          recalculateItineraryTimeline(STATE.itineraryDays);
          renderDayTimeline();
          updateMap();
          saveCurrentItinerary();
        }
      });
    });

    container.querySelectorAll('.btn-move-down').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.idx);
        if (idx < currentDay.items.length - 1) {
          const temp = currentDay.items[idx];
          currentDay.items[idx] = currentDay.items[idx + 1];
          currentDay.items[idx + 1] = temp;
          recalculateItineraryTimeline(STATE.itineraryDays);
          renderDayTimeline();
          updateMap();
          saveCurrentItinerary();
        }
      });
    });

    // 刪除景點
    container.querySelectorAll('.btn-remove-spot').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.idx);
        const itemName = currentDay.items[idx].nameZh;
        currentDay.items.splice(idx, 1);
        recalculateItineraryTimeline(STATE.itineraryDays);
        renderDayTimeline();
        updateMap();
        saveCurrentItinerary();
        showToast(`已移除：${itemName}`);
      });
    });

    // 原生 HTML5 拖曳調序 (Drag and Drop)
    let draggedItemIdx = null;

    container.querySelectorAll('.spot-card').forEach(card => {
      card.addEventListener('dragstart', (e) => {
        draggedItemIdx = Number(card.dataset.spotIndex);
        card.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(draggedItemIdx));
      });

      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        draggedItemIdx = null;
      });

      card.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      });

      card.addEventListener('drop', (e) => {
        e.preventDefault();
        const targetIdx = Number(card.dataset.spotIndex);
        if (draggedItemIdx !== null && draggedItemIdx !== targetIdx) {
          const itemToMove = currentDay.items.splice(draggedItemIdx, 1)[0];
          currentDay.items.splice(targetIdx, 0, itemToMove);
          recalculateItineraryTimeline(STATE.itineraryDays);
          renderDayTimeline();
          updateMap();
          saveCurrentItinerary();
          showToast('已調整景點順序');
        }
      });
    });
  }

  /* ==========================================================================
     8. 景點庫抽屜與私房地點自訂器 (Spot Picker & Custom Location Creator)
     ========================================================================== */
  function attachBottomSheetGestures(overlay, closeFn) {
    const content = overlay.querySelector('.modal-content');
    const handleBar = overlay.querySelector('.bottom-sheet-handle-bar');
    const header = overlay.querySelector('.modal-header');
    if (!content) return;

    let startY = 0;
    let currentY = 0;
    let isSwiping = false;

    const onStart = (e) => {
      if (window.innerWidth > 768) return;
      startY = e.touches[0].clientY;
      currentY = startY;
      isSwiping = true;
      content.style.transition = 'none';
    };

    const onMove = (e) => {
      if (!isSwiping) return;
      currentY = e.touches[0].clientY;
      const diffY = currentY - startY;
      if (diffY > 0) {
        content.style.transform = `translateY(${diffY}px)`;
      }
    };

    const onEnd = () => {
      if (!isSwiping) return;
      isSwiping = false;
      content.style.transition = 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)';
      const diffY = currentY - startY;
      if (diffY > 70) {
        content.style.transform = 'translateY(100%)';
        setTimeout(() => {
          closeFn();
          content.style.transform = '';
        }, 220);
      } else {
        content.style.transform = '';
      }
    };

    [handleBar, header].forEach(el => {
      if (el) {
        el.addEventListener('touchstart', onStart, { passive: true });
        el.addEventListener('touchmove', onMove, { passive: true });
        el.addEventListener('touchend', onEnd, { passive: true });
        el.addEventListener('touchcancel', onEnd, { passive: true });
      }
    });
  }

  function openSpotPickerModal() {
    let modal = document.getElementById('spot-picker-modal');
    if (!modal) {
      createSpotPickerModal();
      modal = document.getElementById('spot-picker-modal');
    }
    renderSpotPickerList();
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeSpotPickerModal() {
    const modal = document.getElementById('spot-picker-modal');
    if (modal) modal.classList.remove('open');
    const customModal = document.getElementById('custom-spot-modal');
    if (!customModal || !customModal.classList.contains('open')) {
      document.body.style.overflow = '';
    }
  }

  function createSpotPickerModal() {
    const overlay = document.createElement('div');
    overlay.id = 'spot-picker-modal';
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-content">
        <div class="bottom-sheet-handle-bar"><div class="bottom-sheet-handle"></div></div>
        <div class="modal-header">
          <div class="modal-title">⛩️ 九州景點庫 & 私房地點加入</div>
          <button class="modal-close-btn" id="btn-close-spot-modal" aria-label="關閉景點庫">&times;</button>
        </div>
        <div class="modal-body">
          <div class="modal-search-box">
            <input type="text" class="modal-search-input" id="input-spot-search" placeholder="搜尋景點名稱、縣市或標籤 (例如：高千穗、拉麵、鋼彈...)">
            <button class="btn btn-volcano" id="btn-open-custom-creator">+ 自訂新景點</button>
          </div>
          <div class="modal-filter-chips" id="picker-filter-chips">
            <button class="filter-chip-btn active" data-cat="all">全部景點</button>
            <button class="filter-chip-btn" data-cat="attraction">⛩️ 觀光名勝</button>
            <button class="filter-chip-btn" data-cat="food">🍜 美食料理</button>
            <button class="filter-chip-btn" data-cat="shopping">🛍️ 購物商場</button>
            <button class="filter-chip-btn" data-cat="hotel">♨️ 溫泉旅宿</button>
            <button class="filter-chip-btn" data-cat="transport">✈️ 交通機場</button>
          </div>
          <div class="spot-picker-grid" id="picker-spots-list"></div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeSpotPickerModal();
    });

    document.getElementById('btn-close-spot-modal').addEventListener('click', closeSpotPickerModal);
    attachBottomSheetGestures(overlay, closeSpotPickerModal);

    const searchInput = document.getElementById('input-spot-search');
    if (searchInput) {
      searchInput.addEventListener('input', renderSpotPickerList);
    }

    const filterChips = document.getElementById('picker-filter-chips');
    if (filterChips) {
      filterChips.querySelectorAll('.filter-chip-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          filterChips.querySelectorAll('.filter-chip-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          renderSpotPickerList();
        });
      });
    }

    const customBtn = document.getElementById('btn-open-custom-creator');
    if (customBtn) {
      customBtn.addEventListener('click', () => openCustomSpotCreatorModal());
    }
  }

  function renderSpotPickerList() {
    const listContainer = document.getElementById('picker-spots-list');
    const searchInput = document.getElementById('input-spot-search');
    const activeChip = document.querySelector('#picker-filter-chips .filter-chip-btn.active');
    if (!listContainer) return;

    const query = (searchInput ? searchInput.value.trim().toLowerCase() : '');
    const cat = activeChip ? activeChip.dataset.cat : 'all';

    // 合併內建景點庫與使用者自訂私房景點
    const allSpots = [...(window.KYUSHU_SPOTS || []), ...STATE.customSpots];

    const filtered = allSpots.filter(spot => {
      if (cat !== 'all' && spot.category !== cat) return false;
      if (!query) return true;

      const nameZh = (spot.nameZh || '').toLowerCase();
      const nameJa = (spot.nameJa || '').toLowerCase();
      const city = (spot.city || '').toLowerCase();
      const desc = (spot.desc || '').toLowerCase();
      const tags = (spot.tags || []).join(' ').toLowerCase();

      return nameZh.includes(query) || nameJa.includes(query) || city.includes(query) || desc.includes(query) || tags.includes(query);
    });

    if (filtered.length === 0) {
      listContainer.innerHTML = `
        <div style="text-align:center; padding:2rem; color:var(--color-slate-500);">
          找不到符合「${escapeHtml(query)}」的景點。
          <br><br>
          <button class="btn btn-volcano btn-sm" id="btn-quick-create-spot">立即自訂「${escapeHtml(query)}」為新地點</button>
        </div>
      `;
      const quickBtn = document.getElementById('btn-quick-create-spot');
      if (quickBtn) quickBtn.addEventListener('click', () => openCustomSpotCreatorModal(query));
      return;
    }

    listContainer.innerHTML = filtered.map(spot => `
      <div class="picker-item-card">
        <div class="picker-item-info">
          <div class="picker-item-title">${escapeHtml(spot.nameZh)}</div>
          <div class="picker-item-desc">${escapeHtml(spot.city || '')}・建議停留 ${formatDuration(spot.defaultStayMins || 60)}</div>
          <div style="font-size:0.75rem; color:var(--color-slate-500); margin-top:0.2rem;">${escapeHtml(spot.desc || '')}</div>
        </div>
        <button class="btn btn-primary btn-sm btn-add-spot-to-day" data-spot-id="${spot.id}">+ 加入</button>
      </div>
    `).join('');

    listContainer.querySelectorAll('.btn-add-spot-to-day').forEach(btn => {
      btn.addEventListener('click', () => {
        const spotId = btn.dataset.spotId;
        const targetSpot = allSpots.find(s => s.id === spotId);
        if (!targetSpot) return;

        const currentDay = STATE.itineraryDays[STATE.activeDayIndex];
        currentDay.items.push({
          spotId: targetSpot.id,
          id: targetSpot.id,
          nameZh: targetSpot.nameZh,
          lat: targetSpot.lat,
          lng: targetSpot.lng,
          durationMinutes: targetSpot.defaultStayMins || 60,
          customNotes: targetSpot.desc || ''
        });

        recalculateItineraryTimeline(STATE.itineraryDays);
        renderDayTimeline();
        updateMap();
        saveCurrentItinerary();
        closeSpotPickerModal();
        showToast(`已成功加入：${targetSpot.nameZh}`);
      });
    });
  }

  /* ==========================================================================
     8.1 完整自訂景點彈窗與地理座標精確配置
     ========================================================================== */
  const KYUSHU_REGIONS = [
    { name: "福岡市區 (博多/天神/機場)", lat: 33.5902, lng: 130.4206 },
    { name: "北九州 (門司港/小倉/關門)", lat: 33.9458, lng: 130.9615 },
    { name: "太宰府市 (天滿宮周邊)", lat: 33.5215, lng: 130.5348 },
    { name: "別府市 (溫泉街/海地獄/鐵輪)", lat: 33.2778, lng: 131.5036 },
    { name: "由布市 (湯布院/金鱗湖)", lat: 33.2662, lng: 131.3696 },
    { name: "阿蘇山區 (草千里/火山口/黑川)", lat: 32.8842, lng: 131.0850 },
    { name: "熊本市區 (熊本城/通町筋/下通)", lat: 32.8062, lng: 130.7058 },
    { name: "南阿蘇村 (星空溫泉別墅/俵山)", lat: 32.8250, lng: 131.0200 },
    { name: "宮崎縣 (高千穗峽/真名井瀑布)", lat: 32.7013, lng: 131.3005 },
    { name: "柳川市 (水鄉乘船處/立花邸)", lat: 33.1678, lng: 130.4144 },
    { name: "佐賀縣 (嬉野溫泉/鳥栖OUTLETS)", lat: 33.0970, lng: 130.0355 },
    { name: "鹿兒島市 (櫻島/市區)", lat: 31.5966, lng: 130.5571 }
  ];

  function openCustomSpotCreatorModal(prefilledName = '') {
    let modal = document.getElementById('custom-spot-modal');
    if (!modal) {
      createCustomSpotCreatorModal();
      modal = document.getElementById('custom-spot-modal');
    }

    const nameInput = document.getElementById('custom-input-name');
    if (nameInput) {
      nameInput.value = prefilledName || '';
    }

    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    if (nameInput) nameInput.focus();
  }

  function closeCustomSpotCreatorModal() {
    const modal = document.getElementById('custom-spot-modal');
    if (modal) modal.classList.remove('open');
    const pickerModal = document.getElementById('spot-picker-modal');
    if (!pickerModal || !pickerModal.classList.contains('open')) {
      document.body.style.overflow = '';
    }
  }

  function createCustomSpotCreatorModal() {
    const overlay = document.createElement('div');
    overlay.id = 'custom-spot-modal';
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-content" style="max-width: 640px;">
        <div class="bottom-sheet-handle-bar"><div class="bottom-sheet-handle"></div></div>
        <div class="modal-header">
          <div class="modal-title">➕ 自訂私房景點 / 餐廳 / 溫泉住宿</div>
          <button class="modal-close-btn" id="btn-close-custom-modal" aria-label="關閉自訂地點視窗">&times;</button>
        </div>
        <div class="modal-body" style="gap: 1.2rem;">
          <div>
            <label style="font-size:0.85rem; font-weight:700; color:var(--color-slate-800); display:block; margin-bottom:0.35rem;">
              🏷️ 地點或飯店名稱 <span style="color:var(--color-danger);">*</span>
            </label>
            <input type="text" id="custom-input-name" placeholder="例如：杉乃井飯店、別府地獄蒸工房、黑亭拉麵..." style="width:100%; padding:0.6rem 0.8rem; border:1px solid var(--color-slate-300); border-radius:6px; font-size:1rem; font-weight:600;">
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem;">
            <div>
              <label style="font-size:0.85rem; font-weight:700; color:var(--color-slate-800); display:block; margin-bottom:0.35rem;">
                📍 所在地理區域 (自動錨定經緯度)
              </label>
              <select id="custom-select-region" style="width:100%; padding:0.6rem; border:1px solid var(--color-slate-300); border-radius:6px; font-weight:600; font-size:0.9rem;">
                ${KYUSHU_REGIONS.map((r, i) => `<option value="${i}">${escapeHtml(r.name)}</option>`).join('')}
              </select>
            </div>
            <div>
              <label style="font-size:0.85rem; font-weight:700; color:var(--color-slate-800); display:block; margin-bottom:0.35rem;">
                📂 分類屬性
              </label>
              <select id="custom-select-cat" style="width:100%; padding:0.6rem; border:1px solid var(--color-slate-300); border-radius:6px; font-weight:600; font-size:0.9rem;">
                <option value="attraction">⛩️ 觀光名勝</option>
                <option value="food">🍜 美食餐廳</option>
                <option value="shopping">🛍️ 購物商場</option>
                <option value="hotel">♨️ 溫泉旅館 / 飯店</option>
                <option value="transport">✈️ 交通接駁 / 機場</option>
              </select>
            </div>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:0.75rem;">
            <div>
              <label style="font-size:0.85rem; font-weight:700; color:var(--color-slate-800); display:block; margin-bottom:0.35rem;">
                ⏱️ 建議停留時長
              </label>
              <select id="custom-select-duration" style="width:100%; padding:0.6rem; border:1px solid var(--color-slate-300); border-radius:6px; font-weight:600; font-size:0.9rem;">
                <option value="15">15 分鐘 (打卡拍照)</option>
                <option value="30">30 分鐘 (短暫小歇)</option>
                <option value="60" selected>60 分鐘 (1小時散步)</option>
                <option value="90">90 分鐘 (深度漫遊)</option>
                <option value="120">120 分鐘 (用餐/參觀)</option>
                <option value="180">180 分鐘 (大型購物)</option>
                <option value="720">720 分鐘 (夜宿過夜)</option>
              </select>
            </div>
            <div>
              <label style="font-size:0.85rem; font-weight:700; color:var(--color-slate-800); display:block; margin-bottom:0.35rem;">
                🌐 緯度 (Latitude)
              </label>
              <input type="number" step="0.0001" id="custom-input-lat" value="${KYUSHU_REGIONS[0].lat}" style="width:100%; padding:0.6rem; border:1px solid var(--color-slate-300); border-radius:6px; font-size:0.85rem; font-weight:600;">
            </div>
            <div>
              <label style="font-size:0.85rem; font-weight:700; color:var(--color-slate-800); display:block; margin-bottom:0.35rem;">
                🌐 經度 (Longitude)
              </label>
              <input type="number" step="0.0001" id="custom-input-lng" value="${KYUSHU_REGIONS[0].lng}" style="width:100%; padding:0.6rem; border:1px solid var(--color-slate-300); border-radius:6px; font-size:0.85rem; font-weight:600;">
            </div>
          </div>

          <div>
            <label style="font-size:0.85rem; font-weight:700; color:var(--color-slate-800); display:block; margin-bottom:0.35rem;">
              📝 行程備註與世代貼士 (長輩/年輕人/嬰兒)
            </label>
            <textarea id="custom-input-notes" rows="2" placeholder="例如：長輩備有無障礙電梯、年輕人IG網美咖啡座、有熱水機泡奶..." style="width:100%; padding:0.6rem; border:1px solid var(--color-slate-300); border-radius:6px; font-size:0.85rem;"></textarea>
          </div>

          <div style="display:flex; justify-content:flex-end; gap:0.5rem; margin-top:0.5rem;">
            <button class="btn btn-outline" id="btn-cancel-custom-spot">取消</button>
            <button class="btn btn-volcano" id="btn-save-custom-spot">💾 儲存並加入今日行程</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeCustomSpotCreatorModal();
    });

    document.getElementById('btn-close-custom-modal').addEventListener('click', closeCustomSpotCreatorModal);
    document.getElementById('btn-cancel-custom-spot').addEventListener('click', closeCustomSpotCreatorModal);
    attachBottomSheetGestures(overlay, closeCustomSpotCreatorModal);

    const regionSelect = document.getElementById('custom-select-region');
    const latInput = document.getElementById('custom-input-lat');
    const lngInput = document.getElementById('custom-input-lng');

    if (regionSelect && latInput && lngInput) {
      regionSelect.addEventListener('change', () => {
        const region = KYUSHU_REGIONS[Number(regionSelect.value)] || KYUSHU_REGIONS[0];
        latInput.value = region.lat;
        lngInput.value = region.lng;
      });
    }

    document.getElementById('btn-save-custom-spot').addEventListener('click', handleSaveCustomSpot);
  }

  function handleSaveCustomSpot() {
    const nameInput = document.getElementById('custom-input-name');
    const regionSelect = document.getElementById('custom-select-region');
    const catSelect = document.getElementById('custom-select-cat');
    const durationSelect = document.getElementById('custom-select-duration');
    const latInput = document.getElementById('custom-input-lat');
    const lngInput = document.getElementById('custom-input-lng');
    const notesInput = document.getElementById('custom-input-notes');

    const spotName = (nameInput ? nameInput.value.trim() : '');
    if (!spotName) {
      alert('請填寫地點或飯店名稱！');
      if (nameInput) nameInput.focus();
      return;
    }

    const region = KYUSHU_REGIONS[Number(regionSelect ? regionSelect.value : 0)] || KYUSHU_REGIONS[0];
    const cat = catSelect ? catSelect.value : 'attraction';
    const duration = Number(durationSelect ? durationSelect.value : 60);
    const lat = Number(latInput ? latInput.value : region.lat);
    const lng = Number(lngInput ? lngInput.value : region.lng);
    const notes = notesInput ? notesInput.value.trim() : '';

    const newSpot = {
      id: `custom-spot-${Date.now()}`,
      nameZh: spotName,
      nameJa: spotName,
      category: cat,
      city: region.name.split(' ')[0],
      lat: isNaN(lat) ? region.lat : lat,
      lng: isNaN(lng) ? region.lng : lng,
      defaultStayMins: duration,
      tags: ['私房地點', region.name.split(' ')[0]],
      desc: notes || '自訂私房探索地點',
      elderFit: {
        score: 9.0,
        steps: '🟢 平緩舒適',
        slope: '平坦',
        dining: '在地推薦美食',
        notes: notes || '自訂私房放鬆點'
      },
      youthFit: {
        score: 9.2,
        photoSpot: '私房私藏機位',
        food: '排隊在地推薦',
        shopping: '特色紀念選品'
      },
      infantFit: {
        score: 8.8,
        stroller: '推車與背巾皆宜',
        nursingRoom: '請洽店家/設施',
        notes: '留意早春保暖與作息'
      }
    };

    STATE.customSpots.push(newSpot);
    safeStorageSet('kyushu_custom_spots', JSON.stringify(STATE.customSpots));

    const currentDay = STATE.itineraryDays[STATE.activeDayIndex];
    currentDay.items.push({
      spotId: newSpot.id,
      id: newSpot.id,
      nameZh: newSpot.nameZh,
      lat: newSpot.lat,
      lng: newSpot.lng,
      durationMinutes: newSpot.defaultStayMins,
      customNotes: notes || '自訂私房探索地點'
    });

    recalculateItineraryTimeline(STATE.itineraryDays);
    renderDayTimeline();
    updateMap();
    saveCurrentItinerary();
    closeCustomSpotCreatorModal();
    closeSpotPickerModal();
    showToast(`已成功新增並加入行程：${newSpot.nameZh}`);
  }

  /* ==========================================================================
     9. Leaflet 互動地圖視覺化 (Interactive Route Map)
     ========================================================================== */
  let mapGestureLocked = (typeof window !== 'undefined' && window.innerWidth <= 768);

  function syncMapGestureState() {
    const btn = document.getElementById('btn-map-gesture-toggle');
    if (!STATE.leafletMap) return;

    if (window.innerWidth > 768) {
      STATE.leafletMap.dragging.enable();
      if (STATE.leafletMap.touchZoom) STATE.leafletMap.touchZoom.enable();
      if (btn) btn.style.display = 'none';
      return;
    }

    if (btn) btn.style.display = 'flex';

    if (mapGestureLocked) {
      STATE.leafletMap.dragging.disable();
      if (STATE.leafletMap.touchZoom) STATE.leafletMap.touchZoom.disable();
      if (btn) {
        btn.classList.remove('unlocked');
        btn.innerHTML = `<span class="gesture-icon">🔒</span><span class="gesture-text">地圖已鎖定（滑動不卡手）· 點擊啟用互動</span>`;
      }
    } else {
      STATE.leafletMap.dragging.enable();
      if (STATE.leafletMap.touchZoom) STATE.leafletMap.touchZoom.enable();
      if (btn) {
        btn.classList.add('unlocked');
        btn.innerHTML = `<span class="gesture-icon">🔓</span><span class="gesture-text">地圖互動中 · 點擊鎖定（恢復順暢滑動）</span>`;
      }
    }
  }

  function initLeafletMap() {
    const mapEl = document.getElementById('kyushu-map');
    if (!mapEl || typeof L === 'undefined') return;

    try {
      STATE.leafletMap = L.map('kyushu-map', {
        center: [33.2, 130.8],
        zoom: 8,
        zoomControl: true,
        scrollWheelZoom: false
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18
      }).addTo(STATE.leafletMap);

      const gestureBtn = document.getElementById('btn-map-gesture-toggle');
      if (gestureBtn) {
        gestureBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          mapGestureLocked = !mapGestureLocked;
          syncMapGestureState();
        });
      }

      const expandBtn = document.getElementById('btn-toggle-map-expand');
      if (expandBtn) {
        expandBtn.addEventListener('click', () => {
          mapEl.classList.toggle('expanded');
          const isExp = mapEl.classList.contains('expanded');
          expandBtn.textContent = isExp ? '↕️ 縮小地圖' : '↕️ 放大/全景地圖';
          setTimeout(() => {
            if (STATE.leafletMap) STATE.leafletMap.invalidateSize();
          }, 250);
        });
      }

      syncMapGestureState();
      window.addEventListener('resize', syncMapGestureState);

      updateMap();
    } catch (err) {
      console.warn('Leaflet map init fallback:', err);
    }
  }

  function updateMap() {
    if (!STATE.leafletMap || typeof L === 'undefined') return;

    try {
      STATE.mapMarkers.forEach(m => STATE.leafletMap.removeLayer(m));
      STATE.mapMarkers = [];
      if (STATE.mapPolyline) {
        STATE.leafletMap.removeLayer(STATE.mapPolyline);
        STATE.mapPolyline = null;
      }

      const currentDay = STATE.itineraryDays[STATE.activeDayIndex];
      if (!currentDay || !currentDay.items || currentDay.items.length === 0) return;

      const latLngs = [];

      currentDay.items.forEach((item, idx) => {
        const spotMeta = getSpotById(item.spotId || item.id) || item.spotData || {};
        const lat = typeof item.lat === 'number' ? item.lat : spotMeta.lat;
        const lng = typeof item.lng === 'number' ? item.lng : spotMeta.lng;

        if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
          const point = [lat, lng];
          latLngs.push(point);

          const iconHtml = `<div style="
            background:#1e293b; color:#fff; border-radius:50%; width:28px; height:28px;
            display:flex; align-items:center; justify-content:center; font-weight:800; font-size:12px;
            border:2px solid #fff; box-shadow:0 2px 6px rgba(0,0,0,0.3);
          ">${idx + 1}</div>`;

          const customIcon = L.divIcon({
            html: iconHtml,
            className: 'kyushu-marker-icon',
            iconSize: [28, 28],
            iconAnchor: [14, 14]
          });

          const marker = L.marker(point, { icon: customIcon }).addTo(STATE.leafletMap);

          const popupContent = `
            <div style="min-width:180px; font-family:sans-serif;">
              <div style="font-weight:800; font-size:14px; margin-bottom:4px;">${escapeHtml(item.nameZh || spotMeta.nameZh)}</div>
              <div style="font-size:12px; color:#64748b;">抵達：${item.arriveTime || '--:--'} | 停留：${formatDuration(item.durationMinutes)}</div>
              <div style="margin-top:6px;">
                <a href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}" target="_blank" style="color:#0284c7; text-decoration:none; font-size:12px; font-weight:600;">Google Maps 導航 ↗</a>
              </div>
            </div>
          `;
          marker.bindPopup(popupContent);
          STATE.mapMarkers.push(marker);
        }
      });

      if (latLngs.length > 1) {
        STATE.mapPolyline = L.polyline(latLngs, {
          color: '#0284c7',
          weight: 4,
          opacity: 0.85,
          dashArray: '6, 6'
        }).addTo(STATE.leafletMap);

        STATE.leafletMap.fitBounds(L.latLngBounds(latLngs), { padding: [40, 40] });
      } else if (latLngs.length === 1) {
        STATE.leafletMap.setView(latLngs[0], 11);
      }
    } catch (err) {
      console.warn('Leaflet map update failed gracefully:', err);
    }
  }

  /* ==========================================================================
     10. 深度評估對照表與特殊成員防護錦囊 (Report Comparison & Care Arsenal)
     ========================================================================== */
  function renderReportComparison() {
    const tableContainer = document.getElementById('report-comparison-container');
    const careContainer = document.getElementById('care-checklist-container');
    if (!tableContainer || !window.KYUSHU_METADATA) return;

    const meta = window.KYUSHU_METADATA;

    tableContainer.innerHTML = `
      <div class="comparison-table-wrap">
        <table class="comp-table">
          <thead>
            <tr>
              <th>評估核心維度</th>
              <th>方案 A：原 DM 5日團體 (福岡往返)</th>
              <th style="background:#f0fdf4; color:#166534;">方案 B：雙點進出 (福岡進/熊本出) 🌟</th>
              <th>方案 C：熊本單點 (熊本往返)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>執飛航線與航司</strong></td>
              <td>星宇航空 TPE ⇄ FUK (單點往返)</td>
              <td style="font-weight:700; color:#15803d;">華航/星宇 FUK進 / KMJ出 (Open-Jaw)</td>
              <td>華航/星宇 TPE ⇄ KMJ (單點往返)</td>
            </tr>
            <tr>
              <td><strong>單日最長車程</strong></td>
              <td style="color:var(--color-danger); font-weight:800;">7.5 ~ 8.0 小時 (Day 2 橫跨折返) ⚠️</td>
              <td style="color:#15803d; font-weight:800;">1.5 ~ 2.0 小時 (順向南下)</td>
              <td>2.0 ~ 2.5 小時</td>
            </tr>
            <tr>
              <td><strong>五日總行駛里程</strong></td>
              <td>約 920 ~ 1,000 km</td>
              <td style="color:#15803d; font-weight:700;">約 480 ~ 520 km (省 50% 車程！)</td>
              <td>約 550 ~ 600 km</td>
            </tr>
            <tr>
              <td><strong>10 個月嬰兒友善度</strong></td>
              <td style="color:var(--color-danger);">★☆☆☆☆ (手抱8小時/副食品壓縮)</td>
              <td style="color:#15803d; font-weight:700;">★★★★★ (作息無衝擊/備品完備)</td>
              <td>★★★★☆</td>
            </tr>
            <tr>
              <td><strong>拄拐杖長輩友善度</strong></td>
              <td style="color:var(--color-danger);">★☆☆☆☆ (石階下切與深蹲高危險)</td>
              <td style="color:#15803d; font-weight:700;">★★★★★ (全平緩動線/無障礙)</td>
              <td>★★★★☆</td>
            </tr>
            <tr>
              <td><strong>預估交通/機票費用</strong></td>
              <td>團費 NT$ 43,500 (228連假全包)</td>
              <td>機票約 NT$ 2.1 萬 + 車宿自駕</td>
              <td>機票約 NT$ 2.0 ~ 2.3 萬 + 車宿</td>
            </tr>
            <tr>
              <td><strong>綜合評估推薦指數</strong></td>
              <td>★★☆☆☆ (大折返極度疲憊)</td>
              <td style="color:#15803d; font-size:1.1rem; font-weight:800;">★★★★★ (壓倒性性價比勝出)</td>
              <td>★★★★☆ (中九州慢活推薦)</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;

    if (careContainer && meta.careChecklist) {
      careContainer.innerHTML = `
        <div class="care-grid">
          <div class="care-card">
            <div class="care-card-header">
              <span>🚨</span>
              <span>景點降級與放棄策略 (高千穗 & 柳川)</span>
            </div>
            ${meta.careChecklist.safetyStrategy.map(s => `
              <div style="font-size:0.85rem; border-bottom:1px solid var(--color-slate-100); padding-bottom:0.6rem;">
                <div style="font-weight:700; color:var(--color-slate-900);">${escapeHtml(s.spot)}</div>
                <div style="color:var(--color-danger); margin:0.2rem 0;">⚠️ 風險：${escapeHtml(s.risk)}</div>
                <div style="color:#047857; font-weight:600;">💡 ${escapeHtml(s.solution)}</div>
              </div>
            `).join('')}
          </div>

          <div class="care-card">
            <div class="care-card-header">
              <span>🎒</span>
              <span>特殊成員必備裝備清單 (長輩 + 嬰兒)</span>
            </div>
            <div style="display:flex; flex-direction:column; gap:0.6rem; font-size:0.85rem;">
              ${meta.careChecklist.gearList.map(g => `
                <div style="background:var(--color-slate-50); padding:0.5rem 0.75rem; border-radius:6px;">
                  <div style="font-weight:700; color:var(--color-slate-900);">${escapeHtml(g.item)} <span style="font-size:0.75rem; color:#64748b;">(${escapeHtml(g.category)})</span></div>
                  <div style="color:var(--color-slate-600); font-size:0.8rem; margin-top:0.15rem;">${escapeHtml(g.desc)}</div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `;
    }
  }

  /* ==========================================================================
     11. 旅行隨身工具箱 (Travel Toolkit: Packing, Budget, Currency)
     ========================================================================== */
  function initToolkit() {
    renderPackingList();
    renderBudgetTracker();

    document.querySelectorAll('.toolkit-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.toolkit-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const target = btn.dataset.toolkitTab;
        document.querySelectorAll('.toolkit-panel').forEach(p => p.style.display = 'none');
        const activePanel = document.getElementById(`toolkit-panel-${target}`);
        if (activePanel) activePanel.style.display = 'block';
      });
    });
  }

  function renderPackingList() {
    const container = document.getElementById('packing-list-container');
    if (!container || !window.KYUSHU_METADATA) return;

    const gearList = window.KYUSHU_METADATA.careChecklist.gearList || [];
    const savedChecked = STATE.checklist;

    container.innerHTML = gearList.map((g, idx) => {
      const isChecked = savedChecked.includes(idx);
      return `
        <div class="checklist-item-row">
          <div class="checklist-item-left">
            <input type="checkbox" id="check-item-${idx}" data-idx="${idx}" ${isChecked ? 'checked' : ''}>
            <label for="check-item-${idx}" style="cursor:pointer; font-size:0.9rem; font-weight:600; ${isChecked ? 'text-decoration:line-through; color:#94a3b8;' : ''}">
              ${escapeHtml(g.item)} <span style="font-size:0.8rem; color:#64748b; font-weight:normal;">(${escapeHtml(g.desc)})</span>
            </label>
          </div>
          <span class="badge badge-primary" style="font-size:0.75rem;">${escapeHtml(g.category.split(' ')[0])}</span>
        </div>
      `;
    }).join('');

    container.querySelectorAll('input[type="checkbox"]').forEach(chk => {
      chk.addEventListener('change', () => {
        const idx = Number(chk.dataset.idx);
        if (chk.checked) {
          if (!STATE.checklist.includes(idx)) STATE.checklist.push(idx);
        } else {
          STATE.checklist = STATE.checklist.filter(i => i !== idx);
        }
        safeStorageSet('kyushu_checklist', JSON.stringify(STATE.checklist));
        renderPackingList();
      });
    });
  }

  function renderBudgetTracker() {
    const rateInput = document.getElementById('input-jpy-rate');
    const calcJpyInput = document.getElementById('calc-jpy-input');
    const calcTwdOutput = document.getElementById('calc-twd-output');

    if (rateInput) {
      rateInput.value = STATE.jpyRate;
      rateInput.addEventListener('change', (e) => {
        const val = Number(e.target.value);
        if (val > 0) {
          STATE.jpyRate = val;
          safeStorageSet('kyushu_jpy_rate', String(val));
          updateCalculator();
        }
      });
    }

    if (calcJpyInput && calcTwdOutput) {
      calcJpyInput.addEventListener('input', updateCalculator);
    }

    function updateCalculator() {
      if (!calcJpyInput || !calcTwdOutput) return;
      const jpy = Number(calcJpyInput.value) || 0;
      const twd = Math.round(jpy * STATE.jpyRate);
      calcTwdOutput.textContent = `約 NT$ ${twd.toLocaleString()}`;
    }
  }

  /* ==========================================================================
     12. 全日多天數紙本手冊列印排版引擎 (Multi-Day Print Handbook Engine)
     ========================================================================== */
  function renderPrintHandbook() {
    let printContainer = document.getElementById('print-full-itinerary');
    if (!printContainer) {
      printContainer = document.createElement('div');
      printContainer.id = 'print-full-itinerary';
      printContainer.className = 'print-handbook-container';
      document.body.appendChild(printContainer);
    }

    const days = STATE.itineraryDays || [];
    const preset = (window.ITINERARY_PRESETS || []).find(p => p.id === STATE.currentPresetId) || {};
    const meta = window.KYUSHU_METADATA || {};

    let html = `
      <div class="print-doc-cover">
        <h1 style="font-size:18pt; margin:0 0 6pt 0; text-align:center;">🗾 2026 九州跨世代自由行旅遊隨身手冊</h1>
        <p style="text-align:center; font-size:10pt; color:#475569; margin:0 0 12pt 0;">
          旅行日期：2026/02/24～02/28 | 跨世代舒活・嬰兒照護・車程精算完整指南
        </p>
        <div style="background:#f8fafc; border:1px solid #cbd5e1; border-radius:6px; padding:8pt 12pt; margin-bottom:14pt; font-size:9.5pt; display:flex; justify-content:space-between; flex-wrap:wrap; gap:6pt;">
          <span><strong>目前行程：</strong> ${escapeHtml(preset.name || '客製自由行')}</span>
          <span><strong>總規劃天數：</strong> 共 ${days.length} 天</span>
          <span><strong>匯率基準：</strong> 1 JPY = ${STATE.jpyRate} TWD</span>
        </div>
      </div>

      <!-- 全日行程速覽總表 -->
      <div class="print-summary-card" style="margin-bottom:16pt;">
        <h2 style="font-size:12pt; margin:0 0 8pt 0; border-bottom:2px solid #0f172a; padding-bottom:4pt;">📋 全日行車與行程速覽總表</h2>
        <table class="print-summary-table" style="width:100%; border-collapse:collapse; font-size:9pt; text-align:left;">
          <thead>
            <tr style="background:#f1f5f9; border-bottom:1.5px solid #94a3b8;">
              <th style="padding:6pt 8pt;">天數</th>
              <th style="padding:6pt 8pt;">日期 / 星期</th>
              <th style="padding:6pt 8pt;">行程主題</th>
              <th style="padding:6pt 8pt;">出發</th>
              <th style="padding:6pt 8pt;">預估總車程</th>
              <th style="padding:6pt 8pt;">里程</th>
              <th style="padding:6pt 8pt;">結束</th>
              <th style="padding:6pt 8pt;">路況指標</th>
            </tr>
          </thead>
          <tbody>
            ${days.map(d => {
              const stats = d.stats || {};
              const isExtreme = stats.isExtremeDrive;
              return `
                <tr style="border-bottom:1px solid #e2e8f0; ${isExtreme ? 'background:#fff1f2;' : ''}">
                  <td style="padding:6pt 8pt; font-weight:bold;">Day ${d.day}</td>
                  <td style="padding:6pt 8pt;">${escapeHtml(formatDayDate(d.date))} (${escapeHtml(d.dayOfWeek || getDayOfWeek(d.date))})</td>
                  <td style="padding:6pt 8pt; font-weight:600;">${escapeHtml(d.title)}</td>
                  <td style="padding:6pt 8pt;">${escapeHtml(d.departureTime)}</td>
                  <td style="padding:6pt 8pt; ${isExtreme ? 'color:#b91c1c; font-weight:800;' : ''}">${formatDuration(stats.totalDriveMins || 0)}</td>
                  <td style="padding:6pt 8pt;">${stats.totalDriveKm || 0} km</td>
                  <td style="padding:6pt 8pt;">${stats.dayEndTime || '--:--'}</td>
                  <td style="padding:6pt 8pt; font-weight:bold; ${isExtreme ? 'color:#b91c1c;' : 'color:#15803d;'}">
                    ${isExtreme ? '⚠️ 嚴重拉車地獄' : (stats.hasLongLegWarning ? '⚠️ 單程偏長' : '🟢 舒適順路')}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;

    // 每日詳細時間軸卡片 (包含 page-break 分頁機制)
    days.forEach((day, dIdx) => {
      const stats = day.stats || {};
      html += `
        <div class="print-day-block">
          <div class="print-day-header" style="background:#f8fafc; border:1px solid #cbd5e1; border-left:4px solid #0284c7; padding:8pt 10pt; margin-bottom:8pt; border-radius:4px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4pt;">
              <span style="font-size:12pt; font-weight:800; color:#0f172a;">Day ${day.day}：${escapeHtml(day.date)} (${escapeHtml(day.dayOfWeek || getDayOfWeek(day.date))})</span>
              <span style="font-size:9pt; color:#475569;">出發：<strong>${day.departureTime}</strong> | 預估車程：<strong>${formatDuration(stats.totalDriveMins || 0)} (${stats.totalDriveKm || 0} km)</strong> | 結束：<strong>${stats.dayEndTime}</strong></span>
            </div>
            <div style="font-size:10.5pt; font-weight:700; color:#1e293b; margin-bottom:4pt;">${escapeHtml(day.title)}</div>
            ${day.warningNotes ? `<div style="font-size:8.5pt; color:#854d0e; background:#fef9c3; padding:4pt 6pt; border-radius:4px; margin-top:4pt;">⚠️ 提醒：${escapeHtml(day.warningNotes)}</div>` : ''}
            ${stats.isExtremeDrive ? `<div style="font-size:8.5pt; color:#991b1b; background:#fee2e2; padding:4pt 6pt; border-radius:4px; margin-top:4pt; font-weight:bold;">🚨 【嚴重拉車警示】：本日行車達 ${formatDuration(stats.totalDriveMins)}，高千穗/阿蘇山路多彎道，長輩膝蓋與幼兒暈車請依報告降級避險！</div>` : ''}
          </div>

          <div class="print-day-timeline">
            ${(day.items || []).map((item, idx) => {
              const spot = item.spotData || getSpotById(item.spotId || item.id) || {};
              const elder = spot.elderFit || {};
              const youth = spot.youthFit || {};
              const infant = spot.infantFit || {};

              let transHtml = '';
              if (idx > 0 && item.transitFromPrev) {
                transHtml = `
                  <div style="padding:4pt 10pt 4pt 30pt; font-size:8.5pt; color:#0284c7; font-weight:600;">
                    ${escapeHtml(item.transitFromPrev.text)}
                  </div>
                `;
              }

              return `
                ${transHtml}
                <div style="border:1px solid #e2e8f0; border-radius:6px; padding:6pt 8pt; margin-bottom:6pt; background:#fff; page-break-inside:avoid;">
                  <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:4pt;">
                    <div>
                      <span style="background:#0f172a; color:#fff; padding:1pt 6pt; border-radius:10px; font-size:8pt; font-weight:bold; margin-right:4pt;">${idx + 1}</span>
                      <strong style="font-size:10pt;">${escapeHtml(item.nameZh || spot.nameZh)}</strong>
                      <span style="font-size:8.5pt; color:#64748b; margin-left:4pt;">${escapeHtml(spot.nameJa || spot.city || '')}</span>
                    </div>
                    <div style="font-size:8.5pt; font-weight:bold; color:#0284c7;">
                      🕒 ${item.arriveTime || '--:--'} ~ ${item.departTime || '--:--'} (${formatDuration(item.durationMinutes)})
                    </div>
                  </div>

                  ${item.customNotes ? `<div style="font-size:8.5pt; color:#475569; margin-bottom:4pt;">📝 備註：${escapeHtml(item.customNotes)}</div>` : ''}

                  <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:6pt; background:#f8fafc; padding:4pt 6pt; border-radius:4px; font-size:8pt; line-height:1.4;">
                    <div style="color:#065f46;">
                      <strong>🧓 長輩：</strong> 步數 ${escapeHtml(elder.steps || '平緩')}・坡度 ${escapeHtml(elder.slope || '無陡坡')}・餐飲 ${escapeHtml(elder.dining || '日式定食')} ${elder.notes ? `(${escapeHtml(elder.notes)})` : ''}
                    </div>
                    <div style="color:#1e40af;">
                      <strong>📸 年輕：</strong> ${escapeHtml(youth.photoSpot || '拍照打卡')}・美食 ${escapeHtml(youth.food || '在地美食')}
                    </div>
                    <div style="color:#9a3412;">
                      <strong>👶 寶寶：</strong> 推車 ${escapeHtml(infant.stroller || '可推車')}・育嬰室 ${escapeHtml(infant.nursingRoom || '備洗手間')} ${infant.notes ? `(${escapeHtml(infant.notes)})` : ''}
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    });

    // 附錄：特殊成員防護指南與裝備
    if (meta.careChecklist) {
      html += `
        <div class="print-day-block" style="page-break-before: always; margin-top:20pt;">
          <h2 style="font-size:13pt; margin:0 0 8pt 0; border-bottom:2px solid #0f172a; padding-bottom:4pt;">🛡️ 特殊成員必備防護守則與降級清單</h2>
          
          <h3 style="font-size:10.5pt; margin:10pt 0 4pt 0; color:#b91c1c;">🚨 關鍵景點降級與替代策略：</h3>
          <ul style="font-size:9pt; line-height:1.5; padding-left:16pt; margin:0 0 12pt 0;">
            ${meta.careChecklist.safetyStrategy.map(s => `
              <li style="margin-bottom:4pt;">
                <strong>${escapeHtml(s.spot)}：</strong> ${escapeHtml(s.solution)}
              </li>
            `).join('')}
          </ul>

          <h3 style="font-size:10.5pt; margin:10pt 0 4pt 0; color:#0f172a;">🎒 隨身核心必備裝備清單：</h3>
          <table class="print-summary-table" style="width:100%; border-collapse:collapse; font-size:8.5pt; text-align:left;">
            <thead>
              <tr style="background:#f1f5f9; border-bottom:1.5px solid #94a3b8;">
                <th style="padding:4pt 6pt; width:22%;">適用對象</th>
                <th style="padding:4pt 6pt; width:28%;">核心裝備</th>
                <th style="padding:4pt 6pt;">指引與安全功能</th>
              </tr>
            </thead>
            <tbody>
              ${meta.careChecklist.gearList.map(g => `
                <tr style="border-bottom:1px solid #e2e8f0;">
                  <td style="padding:4pt 6pt; font-weight:bold;">${escapeHtml(g.category)}</td>
                  <td style="padding:4pt 6pt; font-weight:600;">${escapeHtml(g.item)}</td>
                  <td style="padding:4pt 6pt;">${escapeHtml(g.desc)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    printContainer.innerHTML = html;
  }

  /* ==========================================================================
     13. 行程匯出、文字複製與備份復原 (Export, Copy, Print)
     ========================================================================== */
  function exportItineraryText() {
    const days = STATE.itineraryDays;
    const preset = (window.ITINERARY_PRESETS || []).find(p => p.id === STATE.currentPresetId) || {};

    let text = `【2026 九州跨世代自由行自訂行程表】\n`;
    text += `行程名稱：${preset.name || '客製自由行'}\n`;
    text += `規劃期間：${window.KYUSHU_METADATA.targetPeriod}\n`;
    text += `總天數：共 ${days.length} 天\n`;
    text += `====================================\n\n`;

    days.forEach(day => {
      text += `📅 Day ${day.day} (${day.date} ${day.dayOfWeek}) - ${day.title}\n`;
      text += `🚗 當日出發：${day.departureTime} | 預計車程：${formatDuration(day.stats ? day.stats.totalDriveMins : 0)} (${day.stats ? day.stats.totalDriveKm : 0}km)\n`;
      if (day.warningNotes) text += `⚠️ 注意：${day.warningNotes}\n`;
      text += `------------------------------------\n`;

      (day.items || []).forEach((item, idx) => {
        if (idx > 0 && item.transitFromPrev) {
          text += `   ⬇️ ${item.transitFromPrev.text}\n`;
        }
        text += `${idx + 1}. [${item.arriveTime || '--:--'} ~ ${item.departTime || '--:--'}] ${item.nameZh} (${formatDuration(item.durationMinutes)})\n`;
        if (item.customNotes) text += `   📝 備註：${item.customNotes}\n`;
      });
      text += `\n`;
    });

    text += `====================================\n`;
    text += `💡 特殊成員必備貼士：\n`;
    text += `1. 10個月嬰兒：隨身攜帶 70°C 保溫瓶泡奶，高千穗/熊本城石階強制使用人體工學背巾。\n`;
    text += `2. 拄拐杖長輩：太宰府走心字池兩側平坦繞道，柳川長輩直接前往立花邸御花享用蒸籠鰻魚飯免除深蹲乘船。\n`;

    copyTextToClipboard(text, '📋 已成功複製完整行程純文字！可直接貼至 LINE 或 Notion。');
  }

  function exportJsonBackup() {
    const backupData = {
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      presetId: STATE.currentPresetId,
      days: STATE.itineraryDays,
      customSpots: STATE.customSpots
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `kyushu-itinerary-backup-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('已匯出 JSON 備份檔！');
  }

  function importJsonBackup() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json,application/json';
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target.result);
          // 支援對象格式 { days: [...] } 或直接陣列 [...]
          const targetDays = Array.isArray(parsed) ? parsed : (parsed && Array.isArray(parsed.days) ? parsed.days : null);

          if (targetDays) {
            STATE.itineraryDays = targetDays;
            if (parsed && Array.isArray(parsed.customSpots)) {
              STATE.customSpots = parsed.customSpots;
              safeStorageSet('kyushu_custom_spots', JSON.stringify(STATE.customSpots));
            }
            if (parsed && parsed.presetId) {
              STATE.currentPresetId = parsed.presetId;
              safeStorageSet('kyushu_preset_id', parsed.presetId);
            }

            recalculateItineraryTimeline(STATE.itineraryDays);
            STATE.activeDayIndex = 0;
            renderPresetCards();
            renderDayTabs();
            renderDayTimeline();
            updateMap();
            saveCurrentItinerary();
            showToast('✅ 已成功匯入自訂行程備份！');
          } else {
            alert('匯入的 JSON 格式不正確，缺少行程天數陣列。');
          }
        } catch (err) {
          alert('解析 JSON 檔案失敗：' + err.message);
        }
      };
      reader.readAsText(file);
    });
    fileInput.click();
  }

  /* ==========================================================================
     14. 視角切換器事件與全域控制鈕綁定 (Perspective & Global Toolbar Binds)
     ========================================================================== */
  function bindGlobalEvents() {
    document.querySelectorAll('.perspective-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.perspective-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        STATE.activePerspective = btn.dataset.pers;
        safeStorageSet('kyushu_perspective', STATE.activePerspective);
        renderDayTimeline();
        showToast(`已切換為：${btn.textContent.trim()}`);
      });
    });

    const copyBtn = document.getElementById('btn-copy-itinerary');
    if (copyBtn) copyBtn.addEventListener('click', exportItineraryText);

    const printBtn = document.getElementById('btn-print-itinerary');
    if (printBtn) {
      printBtn.addEventListener('click', () => {
        renderPrintHandbook();
        window.print();
      });
    }

    const exportBtn = document.getElementById('btn-export-json');
    if (exportBtn) exportBtn.addEventListener('click', exportJsonBackup);

    const importBtn = document.getElementById('btn-import-json');
    if (importBtn) importBtn.addEventListener('click', importJsonBackup);

    const resetBtn = document.getElementById('btn-reset-preset');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm('確定要將當前行程重置為官方推薦初始狀態嗎？已做的自訂調整將會被重置。')) {
          loadPreset(STATE.currentPresetId, true);
          showToast('已重置為官方預設行程！');
        }
      });
    }

    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        btn.scrollIntoView({ inline: 'center', behavior: 'smooth', block: 'nearest' });
        const targetSectionId = btn.dataset.target;
        if (targetSectionId) {
          const el = document.getElementById(targetSectionId);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });

    // 行動端專屬底部常駐快速導航列事件 (Mobile Bottom Navigation)
    const bottomNavBtns = document.querySelectorAll('.mobile-bottom-nav-btn');
    bottomNavBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        bottomNavBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const navTarget = btn.dataset.nav;

        if (navTarget === 'planner') {
          const el = document.getElementById('section-planner');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
          document.querySelectorAll('.nav-tab-btn').forEach(b => {
            const isMatch = (b.dataset.target === 'section-planner');
            b.classList.toggle('active', isMatch);
            if (isMatch) b.scrollIntoView({ inline: 'center', behavior: 'smooth', block: 'nearest' });
          });
        } else if (navTarget === 'spots') {
          openSpotPickerModal();
        } else if (navTarget === 'map') {
          const mapCard = document.getElementById('kyushu-map-card') || document.getElementById('kyushu-map');
          if (mapCard) {
            mapCard.scrollIntoView({ behavior: 'smooth' });
            setTimeout(() => {
              if (STATE.leafletMap) STATE.leafletMap.invalidateSize();
            }, 350);
          }
        } else if (navTarget === 'care') {
          const el = document.getElementById('section-comparison') || document.getElementById('section-care');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
          document.querySelectorAll('.nav-tab-btn').forEach(b => {
            const isMatch = (b.dataset.target === 'section-comparison' || b.dataset.target === 'section-care');
            b.classList.toggle('active', isMatch);
            if (isMatch) b.scrollIntoView({ inline: 'center', behavior: 'smooth', block: 'nearest' });
          });
        }
      });
    });

    // 視窗滾動時同步更新行動端底部導航狀態
    let scrollDebounce;
    window.addEventListener('scroll', () => {
      if (scrollDebounce) return;
      scrollDebounce = setTimeout(() => {
        scrollDebounce = null;
        if (window.innerWidth > 768) return;

        const careEl = document.getElementById('section-care');
        const compEl = document.getElementById('section-comparison');
        const mapEl = document.getElementById('kyushu-map-card');

        const careTop = careEl ? careEl.getBoundingClientRect().top : 9999;
        const compTop = compEl ? compEl.getBoundingClientRect().top : 9999;
        const mapTop = mapEl ? mapEl.getBoundingClientRect().top : 9999;

        let activeTarget = 'planner';
        if (careTop < window.innerHeight * 0.4 || compTop < window.innerHeight * 0.4) {
          activeTarget = 'care';
        } else if (mapTop < window.innerHeight * 0.45 && mapTop > -300) {
          activeTarget = 'map';
        }

        bottomNavBtns.forEach(b => {
          if (b.dataset.nav === activeTarget) {
            b.classList.add('active');
          } else if (b.dataset.nav !== 'spots') {
            b.classList.remove('active');
          }
        });
      }, 100);
    }, { passive: true });

    // 監聽原生列印事件
    window.addEventListener('beforeprint', () => {
      renderPrintHandbook();
    });
  }

  /* ==========================================================================
     15. 初始啟動程序 (Initialization Boot)
     ========================================================================== */
  function init() {
    const activePersBtn = document.querySelector(`.perspective-btn[data-pers="${STATE.activePerspective}"]`);
    if (activePersBtn) {
      document.querySelectorAll('.perspective-btn').forEach(b => b.classList.remove('active'));
      activePersBtn.classList.add('active');
    }

    loadPreset(STATE.currentPresetId);
    initFlightSelector();
    initLeafletMap();
    initToolkit();
    bindGlobalEvents();
  }

  init();
});
