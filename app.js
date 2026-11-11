// ============================================================================
// MatheMeister 5. Sınıf - Schriftliche Division (4 & 5 Haneli -> 3 Haneli)
// German Gymnasium Kästchenheft Notation & Interactive Step-by-Step Engine
// ============================================================================

let currentLang = 'dual'; // 'dual' | 'tr' | 'de'
let learnState = {
  dividend: 28456,
  divisor: 127,
  steps: [],
  currentStepIndex: 0,
  autoPlayTimer: null
};

let practiceState = {
  difficulty: '4d-exact',
  dividend: 7824,
  divisor: 326,
  steps: [],
  activeStepIdx: 1, // starts at first interactive step
  stars: 0,
  streak: 0
};

// ============================================================================
// 1. DIVISION ENGINE & GERMAN KÄSTCHENHEFT LAYOUT GENERATOR
// ============================================================================

/**
 * Rounds a 3-digit divisor to the nearest hundred or ten for a kid-friendly
 * German "Überschlag" (estimation tip).
 */
function buildEstimationTip(partial, divisor, qDigit) {
  const roundedHundred = Math.round(divisor / 100) * 100;
  const roundedTen = Math.round(divisor / 10) * 10;
  const partialHundred = Math.round(partial / 100) * 100;

  const tr = `💡 <strong>Yuvarlama Taktikleri (Überschlag):</strong><br/>` +
    `• Bölen <code>${divisor}</code> sayısını <strong>${roundedTen}</strong> (veya yüzlük olarak <strong>${roundedHundred}</strong>) gibi düşünebilirsin.<br/>` +
    `• <code>${partial} : ${divisor}</code> için yaklaşık <code>${partialHundred} : ${roundedHundred} ≈ ${Math.max(1, Math.min(9, Math.round(partial / roundedHundred)))}</code> civarında deneme yap! ` +
    `Kenarda <code>${qDigit} × ${divisor} = ${qDigit * divisor}</code> çarpınca <code>${partial}</code> sayısına tam sığdığını görüyoruz.`;

  const de = `💡 <strong>Überschlag-Trick:</strong><br/>` +
    `• Runde den Divisor <code>${divisor}</code> im Kopf auf <strong>${roundedTen}</strong> (oder <strong>${roundedHundred}</strong>).<br/>` +
    `• Prüfe: <code>${qDigit} × ${divisor} = ${qDigit * divisor}</code> (passt in <code>${partial}</code>!).`;

  return { tr, de };
}

/**
 * Generates the complete sequence of pedagogical states for dividing
 * dividend by divisor in German horizontal grid notation:
 *   Row 0: [D][i][v][i][d][e][n][d] [:] [D][i][v] [=] [Q][u][o][t] (and R..)
 */
function generateDivisionSteps(dividend, divisor) {
  const divStr = String(dividend);
  const dvrStr = String(divisor);
  const quotientVal = Math.floor(dividend / divisor);
  const remainderVal = dividend % divisor;
  const quotStr = String(quotientVal);

  // Determine how many initial digits of dividend we must grab so partial >= divisor
  let idx = dvrStr.length; // start by checking first 3 digits
  let partial = parseInt(divStr.slice(0, idx), 10);
  if (partial < divisor && idx < divStr.length) {
    idx++;
    partial = parseInt(divStr.slice(0, idx), 10);
  }

  const initialCount = idx; // 3 or 4 digits
  const totalCycles = divStr.length - initialCount + 1;

  // Calculate total columns & rows needed on Kästchenheft
  // Row 0 layout:
  // col 1 .. divStr.length : dividend digits (col 0 reserved for minus sign if needed)
  // col divStr.length + 1  : ':'
  // col divStr.length + 2 .. + 2 + dvrStr.length - 1 : divisor digits
  // col after divisor      : '='
  // cols after '='         : quotient digits (+ optional ' R ' + remainder)
  const restStr = remainderVal > 0 ? `R${remainderVal}` : '';
  const totalCols = Math.max(
    18,
    1 + divStr.length + 1 + dvrStr.length + 1 + quotStr.length + (restStr ? restStr.length + 1 : 0) + 1
  );
  const totalRows = Math.max(10, 2 + totalCycles * 2 + 1);

  const colColon = 1 + divStr.length;
  const colDivisorStart = colColon + 1;
  const colEquals = colDivisorStart + dvrStr.length;
  const colQuotientStart = colEquals + 1;

  // Helper to clone a 2D grid of cell descriptors
  function createEmptyGrid() {
    const g = [];
    for (let r = 0; r < totalRows; r++) {
      const row = [];
      for (let c = 0; c < totalCols; c++) {
        row.push({ char: '', classes: [] });
      }
      g.push(row);
    }
    return g;
  }

  function cloneGrid(g) {
    return g.map(row => row.map(cell => ({
      char: cell.char,
      classes: [...cell.classes]
    })));
  }

  function clearHighlights(g) {
    for (let r = 0; r < totalRows; r++) {
      for (let c = 0; c < totalCols; c++) {
        g[r][c].classes = g[r][c].classes.filter(
          cls => cls !== 'hl-focus' && cls !== 'hl-new' && cls !== 'hl-target'
        );
      }
    }
  }

  const steps = [];
  let grid = createEmptyGrid();

  // Populate base Row 0: Dividend : Divisor =
  for (let i = 0; i < divStr.length; i++) {
    grid[0][1 + i] = { char: divStr[i], classes: ['cell-dividend'] };
  }
  grid[0][colColon] = { char: ':', classes: ['cell-op'] };
  for (let i = 0; i < dvrStr.length; i++) {
    grid[0][colDivisorStart + i] = { char: dvrStr[i], classes: ['cell-divisor'] };
  }
  grid[0][colEquals] = { char: '=', classes: ['cell-op'] };

  // STEP 0: Initial overview & selecting starting digits
  {
    const g0 = cloneGrid(grid);
    for (let i = 0; i < initialCount; i++) {
      g0[0][1 + i].classes.push('hl-focus');
    }
    const first3 = parseInt(divStr.slice(0, 3), 10);
    const whyMsgTr = initialCount === 3
      ? `Bölünenin ilk 3 basamağı olan <strong>${first3}</strong>, bölen <strong>${divisor}</strong> sayısından büyük veya eşit olduğu için işleme ilk <strong>3 basamakla (${partial})</strong> başlıyoruz.`
      : `Bölünenin ilk 3 basamağı olan <strong>${first3}</strong>, bölen <strong>${divisor}</strong> sayısından küçük olduğu için (${first3} &lt; ${divisor}), ilk <strong>4 basamağı (${partial})</strong> birlikte alıyoruz!`;

    const whyMsgDe = initialCount === 3
      ? `Die ersten 3 Ziffern (<strong>${first3}</strong>) sind größer/gleich <strong>${divisor}</strong>. Deshalb starten wir mit <strong>${partial}</strong>.`
      : `Die ersten 3 Ziffern (<strong>${first3}</strong>) sind kleiner als <strong>${divisor}</strong> (${first3} &lt; ${divisor}). Deshalb nehmen wir die ersten <strong>4 Ziffern (${partial})</strong> zusammen!`;

    steps.push({
      phase: 'start',
      badgeTr: 'Başlangıç • Hazırlık',
      badgeDe: 'Start • Stellenwert prüfen',
      titleTr: `Soldan Kaç Basamakla Başlıyoruz?`,
      titleDe: `Mit wie vielen Ziffern starten wir?`,
      tr: `Önce sayılarımızı kareli deftere (<em>Kästchenheft</em>) her rakam bir kareye gelecek şekilde yazdık.<br/>${whyMsgTr}`,
      de: `Zuerst schreiben wir die Aufgabe ordentlich in die Kästchen.<br/>${whyMsgDe}`,
      tip: {
        tr: `📌 <strong>Gymnasium İpucu:</strong> Sonucun (Bölümün) kaç basamaklı olacağını baştan bilebilirsin! İlk grup için 1 basamak + geriye kalan ${divStr.length - initialCount} rakam = <strong>${totalCycles} basamaklı sonuç</strong> çıkacak.`,
        de: `📌 <strong>Tipp:</strong> Das Ergebnis wird genau <strong>${totalCycles} Stellen</strong> haben!`
      },
      activeMult: null,
      grid: g0
    });
  }

  let currentPartial = partial;
  let currentEndCol = initialCount; // 1-based column in row 0 where currentPartial ends
  let currentRow = 0; // row where currentPartial lives

  for (let cycle = 0; cycle < totalCycles; cycle++) {
    const qDigit = Math.floor(currentPartial / divisor);
    const product = qDigit * divisor;
    const remainder = currentPartial - product;
    const qCol = colQuotientStart + cycle;

    // ------------------------------------------------------------------------
    // PHASE 1: DIVIDE (Böl / Dividieren)
    // ------------------------------------------------------------------------
    clearHighlights(grid);
    // Highlight currentPartial digits
    const partialStr = String(currentPartial);
    for (let k = 0; k < partialStr.length; k++) {
      const c = currentEndCol - partialStr.length + 1 + k;
      if (grid[currentRow][c]) {
        grid[currentRow][c].classes.push('hl-focus');
      }
    }
    grid[0][qCol] = { char: String(qDigit), classes: ['cell-quotient', 'hl-new'] };

    const isZeroTrap = qDigit === 0;
    const estTip = isZeroTrap
      ? {
          tr: `⚠️ <strong>DİKKAT - SIFIR TUZAĞI (Null-Falle)!</strong><br/>Yukarıdan rakam indirdiğimiz halde <code>${currentPartial}</code> sayısı <code>${divisor}</code> sayısından küçük kaldı! Bu yüzden bölüme <strong>mutlaka <code>0</code></strong> yazıyoruz!`,
          de: `⚠️ <strong>ACHTUNG - NULL-FALLE!</strong><br/><code>${currentPartial}</code> ist kleiner als <code>${divisor}</code>! Deshalb MUSS eine <strong><code>0</code></strong> in das Ergebnis geschrieben werden!`
        }
      : buildEstimationTip(currentPartial, divisor, qDigit);

    steps.push({
      phase: 'divide',
      badgeTr: `${cycle + 1}. Tur • 1. Adım: Böl (Dividieren)`,
      badgeDe: `Runde ${cycle + 1} • Schritt 1: Dividieren`,
      titleTr: `${currentPartial} içinde ${divisor} kaç kere var?`,
      titleDe: `Wie oft passt ${divisor} in ${currentPartial}?`,
      tr: isZeroTrap
        ? `<strong>${currentPartial}</strong> sayısının içinde <strong>${divisor}</strong> hiç yok (<strong>0 kere</strong> var). Sağdaki sonuca <strong>0</strong> yazıyoruz.`
        : `<strong>${currentPartial}</strong> sayısının içinde <strong>${divisor}</strong> tam <strong>${qDigit} kere</strong> var. Eşittirin sağındaki sonuca <strong>${qDigit}</strong> yazıyoruz.`,
      de: `Die <strong>${divisor}</strong> passt <strong>${qDigit}-mal</strong> in die <strong>${currentPartial}</strong>. Wir schreiben <strong>${qDigit}</strong> in das Ergebnis.`,
      tip: estTip,
      activeMult: qDigit,
      expectedAnswer: qDigit,
      targetCells: [{ r: 0, c: qCol }],
      promptTr: `<strong>${currentPartial}</strong> içinde <strong>${divisor}</strong> kaç kere var? (Bölüme yazılacak rakam kaç?)`,
      promptDe: `Wie oft passt <strong>${divisor}</strong> in <strong>${currentPartial}</strong>?`,
      grid: cloneGrid(grid)
    });

    // ------------------------------------------------------------------------
    // PHASE 2: MULTIPLY (Çarp / Multiplizieren)
    // ------------------------------------------------------------------------
    clearHighlights(grid);
    grid[0][qCol].classes.push('hl-focus');
    const multRow = currentRow + 1;
    const prodStr = String(product);
    const minusCol = currentEndCol - Math.max(prodStr.length, partialStr.length);

    grid[multRow][minusCol] = { char: '-', classes: ['cell-minus', 'hl-new'] };
    const prodTargetCells = [];

    // Underline spans across partial width
    const spanLen = Math.max(prodStr.length, partialStr.length);
    for (let k = 0; k < spanLen; k++) {
      const colPos = currentEndCol - spanLen + 1 + k;
      grid[multRow][colPos].classes.push('cell-underline');
    }

    for (let k = 0; k < prodStr.length; k++) {
      const colPos = currentEndCol - prodStr.length + 1 + k;
      grid[multRow][colPos].char = prodStr[k];
      grid[multRow][colPos].classes.push('cell-subtrahend', 'hl-new');
      prodTargetCells.push({ r: multRow, c: colPos });
    }

    steps.push({
      phase: 'multiply',
      badgeTr: `${cycle + 1}. Tur • 2. Adım: Çarp (Multiplizieren)`,
      badgeDe: `Runde ${cycle + 1} • Schritt 2: Multiplizieren`,
      titleTr: `Geri Çarpma: ${qDigit} × ${divisor} = ${product}`,
      titleDe: `Rückmultiplizieren: ${qDigit} × ${divisor} = ${product}`,
      tr: `Şimdi bulduğumuz <strong>${qDigit}</strong> rakamını bölenle çarpıyoruz: <code>${qDigit} × ${divisor} = ${product}</code>.<br/>Sonucu basamaklar tam alt alta gelecek şekilde <strong>${currentPartial}</strong> sayısının altına yazıp çizgimizi çekiyoruz.`,
      de: `Wir rechnen zurück: <code>${qDigit} × ${divisor} = ${product}</code> und schreiben <strong>${product}</strong> stellenwertgerecht unter die <strong>${currentPartial}</strong>.`,
      tip: {
        tr: `🧮 <strong>Parçalayarak Çarpma:</strong> <code>${qDigit} × ${divisor}</code> işlemini yaparken önce yüzlük, sonra onluk, sonra birlikleri çarpabilirsin: <code>${qDigit}×${Math.floor(divisor/100)*100} + ${qDigit}×${Math.floor((divisor%100)/10)*10} + ${qDigit}×${divisor%10} = ${product}</code>.`,
        de: `🧮 <strong>Kopfrechentrick:</strong> <code>${qDigit} × ${divisor} = ${product}</code>.`
      },
      activeMult: qDigit,
      expectedAnswer: product,
      targetCells: prodTargetCells,
      promptTr: `Şimdi geri çarpalım: <strong>${qDigit} × ${divisor}</strong> kaç eder?`,
      promptDe: `Rechne zurück: Was ergibt <strong>${qDigit} × ${divisor}</strong>?`,
      grid: cloneGrid(grid)
    });

    // ------------------------------------------------------------------------
    // PHASE 3: SUBTRACT (Çıkar / Subtrahieren)
    // ------------------------------------------------------------------------
    clearHighlights(grid);
    const subRow = multRow + 1;
    const remStr = String(remainder);
    const remTargetCells = [];

    for (let k = 0; k < remStr.length; k++) {
      const colPos = currentEndCol - remStr.length + 1 + k;
      grid[subRow][colPos] = {
        char: remStr[k],
        classes: ['hl-new']
      };
      remTargetCells.push({ r: subRow, c: colPos });
    }

    steps.push({
      phase: 'subtract',
      badgeTr: `${cycle + 1}. Tur • 3. Adım: Çıkar (Subtrahieren)`,
      badgeDe: `Runde ${cycle + 1} • Schritt 3: Subtrahieren`,
      titleTr: `Çıkarma İşlemi: ${currentPartial} - ${product} = ${remainder}`,
      titleDe: `Abziehen: ${currentPartial} - ${product} = ${remainder}`,
      tr: `<strong>${currentPartial}</strong> sayısından <strong>${product}</strong> sayısını çıkarıyoruz: <code>${currentPartial} - ${product} = ${remainder}</code>.<br/>✅ <strong>Kontrol:</strong> Kalanımız (<strong>${remainder}</strong>), bölenden (<strong>${divisor}</strong>) küçük! Demek ki doğru yoldayız.`,
      de: `Wir ziehen ab: <code>${currentPartial} - ${product} = ${remainder}</code>.<br/>✅ <strong>Kontrolle:</strong> Der Rest (<strong>${remainder}</strong>) ist kleiner als der Divisor (<strong>${divisor}</strong>)!`,
      tip: {
        tr: `🛡️ <strong>Altın Kural:</strong> Çıkarma işleminden sonra bulduğun sayı (${remainder}) her zaman bölenden (${divisor}) <strong>küçük olmalıdır</strong>! Eğer büyük çıkarsa bölümdeki rakamı 1 artırman gerekir.`,
        de: `🛡️ <strong>Goldene Regel:</strong> Nach dem Abziehen muss der Rest (${remainder}) immer kleiner als ${divisor} sein!`
      },
      activeMult: null,
      expectedAnswer: remainder,
      targetCells: remTargetCells,
      promptTr: `Çıkarma işlemini yapalım: <strong>${currentPartial} - ${product}</strong> kaç kalır?`,
      promptDe: `Subtrahiere: Was ergibt <strong>${currentPartial} - ${product}</strong>?`,
      grid: cloneGrid(grid)
    });

    // ------------------------------------------------------------------------
    // PHASE 4: BRING DOWN (Yukarıdan İndir / Herunterholen)
    // ------------------------------------------------------------------------
    const nextDividendIdx = initialCount + cycle; // 0-based index in divStr
    if (nextDividendIdx < divStr.length) {
      clearHighlights(grid);
      const nextDigit = divStr[nextDividendIdx];
      const nextCol = 1 + nextDividendIdx;

      // Highlight the digit at the top being brought down
      grid[0][nextCol].classes.push('hl-focus');

      // Show downward arrow in the row above subRow if empty
      if (grid[multRow][nextCol] && !grid[multRow][nextCol].char) {
        grid[multRow][nextCol] = { char: '↓', classes: ['cell-arrow'] };
      }

      // Write the brought-down digit in subRow at nextCol
      grid[subRow][nextCol] = {
        char: nextDigit,
        classes: ['cell-brought-down', 'hl-new']
      };

      const newPartial = remainder * 10 + parseInt(nextDigit, 10);

      // If remainder was 0, keep the 0 visible or clean it up while forming newPartial
      steps.push({
        phase: 'bringdown',
        badgeTr: `${cycle + 1}. Tur • 4. Adım: İndir (Herunterholen)`,
        badgeDe: `Runde ${cycle + 1} • Schritt 4: Herunterholen`,
        titleTr: `Yukarıdan ${nextDigit} Rakamını İndiriyoruz!`,
        titleDe: `Nächste Ziffer (${nextDigit}) herunterholen!`,
        tr: `Yukarıdaki bölünenden sıradaki <strong>${nextDigit}</strong> rakamını asansör gibi aşağıya, <strong>${remainder}</strong> sayısının yanına indiriyoruz.<br/>Yeni sayımız <strong>${newPartial}</strong> oldu!`,
        de: `Wir holen die nächste Ziffer <strong>${nextDigit}</strong> von oben herunter und schreiben sie neben die <strong>${remainder}</strong>.<br/>Unsere neue Zahl heißt <strong>${newPartial}</strong>!`,
        tip: {
          tr: `🔽 <strong>Kareli Defter Sırrı:</strong> İndirdiğin rakam, yukarıdaki kendi sütununun (karesinin) tam hizasında aşağıya inmelidir.`,
          de: `🔽 <strong>Kästchen-Tipp:</strong> Schreibe die heruntergeholte Ziffer immer genau in dieselbe Spalte unter die obere Ziffer!`
        },
        activeMult: null,
        expectedAnswer: newPartial,
        targetCells: [{ r: subRow, c: nextCol }],
        promptTr: `Yukarıdan sıradaki <strong>${nextDigit}</strong> rakamını <strong>${remainder}</strong>'in yanına indirince oluşan yeni sayı kaçtır?`,
        promptDe: `Welche neue Zahl entsteht, wenn wir die <strong>${nextDigit}</strong> neben die <strong>${remainder}</strong> herunterholen?`,
        grid: cloneGrid(grid)
      });

      // Clean up temporary arrow before next cycle
      if (grid[multRow][nextCol] && grid[multRow][nextCol].char === '↓') {
        grid[multRow][nextCol] = { char: '', classes: [] };
      }

      currentPartial = newPartial;
      currentEndCol = nextCol;
      currentRow = subRow;
    } else {
      // Final step! Division is complete
      clearHighlights(grid);
      // Double-underline the final remainder
      for (let k = 0; k < remStr.length; k++) {
        const colPos = currentEndCol - remStr.length + 1 + k;
        grid[subRow][colPos].classes.push('cell-double-underline', 'hl-focus');
      }

      // If remainder > 0, write "R<remainder>" next to Quotient on Row 0
      if (remainder > 0) {
        const rStart = colQuotientStart + quotStr.length + 1;
        grid[0][rStart - 1] = { char: 'R', classes: ['cell-rest', 'hl-new'] };
        for (let k = 0; k < remStr.length; k++) {
          if (rStart + k < totalCols) {
            grid[0][rStart + k] = { char: remStr[k], classes: ['cell-rest', 'hl-new'] };
          }
        }
      }

      // Highlight full quotient
      for (let k = 0; k < quotStr.length; k++) {
        grid[0][colQuotientStart + k].classes.push('hl-new');
      }

      const resultText = remainder === 0
        ? `${quotientVal}`
        : `${quotientVal} Rest ${remainder}`;

      const probeFormula = remainder === 0
        ? `${quotientVal} × ${divisor} = ${dividend}`
        : `${quotientVal} × ${divisor} + ${remainder} = ${quotientVal * divisor} + ${remainder} = ${dividend}`;

      steps.push({
        phase: 'finish',
        badgeTr: '🎉 Tamamlandı! (Fertig!)',
        badgeDe: '🎉 Geschafft! (Ergebnis & Probe)',
        titleTr: `Harika! Sonuç: ${resultText}`,
        titleDe: `Super! Das Ergebnis lautet: ${resultText}`,
        tr: remainder === 0
          ? `Yukarıda indirilecek başka rakam kalmadı ve kalanımız <strong>0</strong>! İşlem kalansız bitti: <strong>${dividend} : ${divisor} = ${quotientVal}</strong>.`
          : `Yukarıda indirilecek başka rakam kalmadı! Kalanımız <strong>${remainder}</strong> (${divisor}'den küçük). Sonuç: <strong>${quotientVal} (Kalan / Rest ${remainder})</strong>.`,
        de: remainder === 0
          ? `Keine Ziffern mehr übrig und der Rest ist <strong>0</strong>! Die Division geht glatt auf: <strong>${dividend} : ${divisor} = ${quotientVal}</strong>.`
          : `Keine Ziffern mehr übrig! Der Rest ist <strong>${remainder}</strong>. Ergebnis: <strong>${quotientVal} Rest ${remainder}</strong>.`,
        tip: {
          tr: `🛡️ <strong>Sağlama (Die Probe / Umkehraufgabe):</strong><br/><code>${probeFormula}</code> ✔ Tam doğru!`,
          de: `🛡️ <strong>Die Probe (Umkehraufgabe):</strong><br/><code>${probeFormula}</code> ✔ Stimmt genau!`
        },
        activeMult: null,
        grid: cloneGrid(grid)
      });
    }
  }

  return steps;
}

// ============================================================================
// 2. RENDERING ENGINE (KÄSTCHENHEFT & SIDEBAR)
// ============================================================================

function renderGridToDOM(containerEl, gridData, interactiveTargets = null) {
  containerEl.innerHTML = '';
  const rows = gridData.length;
  const cols = gridData[0].length;
  containerEl.style.gridTemplateColumns = `repeat(${cols}, var(--cell-size))`;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cellInfo = gridData[r][c];
      const div = document.createElement('div');
      div.className = 'k-cell ' + cellInfo.classes.join(' ');

      if (interactiveTargets && interactiveTargets.some(t => t.r === r && t.c === c)) {
        div.textContent = '?';
        div.className = 'k-cell hl-target';
      } else {
        div.textContent = cellInfo.char;
      }
      containerEl.appendChild(div);
    }
  }
}

function renderMultiplesTable(divisor, activeDigit) {
  const listEl = document.getElementById('multiples-list');
  listEl.innerHTML = '';
  for (let d = 1; d <= 9; d++) {
    const item = document.createElement('div');
    item.className = 'mult-item' + (activeDigit === d ? ' active-mult' : '');
    item.innerHTML = `<span>${d} × ${divisor}</span> <strong>${d * divisor}</strong>`;
    listEl.appendChild(item);
  }
}

function updateCyclePills(phase) {
  const map = {
    divide: ['pill-divide', 'active-divide'],
    multiply: ['pill-multiply', 'active-multiply'],
    subtract: ['pill-subtract', 'active-subtract'],
    bringdown: ['pill-bringdown', 'active-bringdown']
  };
  ['pill-divide', 'pill-multiply', 'pill-subtract', 'pill-bringdown'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.className = 'cycle-pill';
    }
  });
  if (map[phase]) {
    const [id, cls] = map[phase];
    const el = document.getElementById(id);
    if (el) el.classList.add(cls);
  }
}

function formatBilingualHTML(trHtml, deHtml) {
  if (currentLang === 'tr') return `<div>${trHtml}</div>`;
  if (currentLang === 'de') return `<div>${deHtml}</div>`;
  return `<div>🇹🇷 ${trHtml}</div><div class="de-line">🇩🇪 ${deHtml}</div>`;
}

function formatBilingualText(trText, deText) {
  if (currentLang === 'tr') return trText;
  if (currentLang === 'de') return deText;
  return `${trText} / ${deText}`;
}

// ============================================================================
// 3. LEARN MODE CONTROLLER
// ============================================================================

function initLearnProblem(dividend, divisor) {
  stopAutoPlay();
  dividend = Math.max(1000, Math.min(99999, parseInt(dividend, 10) || 28456));
  divisor = Math.max(100, Math.min(999, parseInt(divisor, 10) || 127));

  if (dividend < divisor) {
    dividend = divisor * 12;
  }

  document.getElementById('learn-dividend').value = dividend;
  document.getElementById('learn-divisor').value = divisor;

  learnState.dividend = dividend;
  learnState.divisor = divisor;
  learnState.steps = generateDivisionSteps(dividend, divisor);
  learnState.currentStepIndex = 0;

  renderLearnStep();
}

function renderLearnStep() {
  const step = learnState.steps[learnState.currentStepIndex];
  const total = learnState.steps.length - 1;

  document.getElementById('learn-step-counter').textContent =
    `Adım ${learnState.currentStepIndex} / ${total}`;

  renderGridToDOM(document.getElementById('learn-grid'), step.grid);
  renderMultiplesTable(learnState.divisor, step.activeMult);
  updateCyclePills(step.phase);

  document.getElementById('coach-step-badge').textContent =
    formatBilingualText(step.badgeTr, step.badgeDe);
  document.getElementById('coach-step-title').textContent =
    formatBilingualText(step.titleTr, step.titleDe);
  document.getElementById('coach-explanation').innerHTML =
    formatBilingualHTML(step.tr, step.de);
  document.getElementById('coach-estimation').innerHTML =
    formatBilingualHTML(step.tip.tr, step.tip.de);

  document.getElementById('btn-first').disabled = learnState.currentStepIndex === 0;
  document.getElementById('btn-prev').disabled = learnState.currentStepIndex === 0;
  document.getElementById('btn-next').disabled = learnState.currentStepIndex === total;
  document.getElementById('btn-last').disabled = learnState.currentStepIndex === total;

  if (step.phase === 'finish') {
    stopAutoPlay();
  }
}

function stopAutoPlay() {
  if (learnState.autoPlayTimer) {
    clearInterval(learnState.autoPlayTimer);
    learnState.autoPlayTimer = null;
  }
  const btn = document.getElementById('btn-play');
  if (btn) btn.textContent = '▶ Otomatik Oynat';
}

function toggleAutoPlay() {
  if (learnState.autoPlayTimer) {
    stopAutoPlay();
    return;
  }
  if (learnState.currentStepIndex >= learnState.steps.length - 1) {
    learnState.currentStepIndex = 0;
    renderLearnStep();
  }
  const btn = document.getElementById('btn-play');
  btn.textContent = '⏸ Duraklat';
  learnState.autoPlayTimer = setInterval(() => {
    if (learnState.currentStepIndex < learnState.steps.length - 1) {
      learnState.currentStepIndex++;
      renderLearnStep();
    } else {
      stopAutoPlay();
    }
  }, 2400);
}

// ============================================================================
// 4. PRACTICE MODE CONTROLLER (SEN ÇÖZ / ÜBUNGSMODUS)
// ============================================================================

function generateRandomProblem(type) {
  let divisor = Math.floor(Math.random() * 650) + 115; // 115 .. 764
  let quotient, remainder = 0;

  if (type === '4d-exact') {
    // Ensure 4-digit dividend (1000 .. 9999)
    divisor = Math.floor(Math.random() * 350) + 112; // 112 .. 461
    const minQ = Math.max(11, Math.ceil(1050 / divisor));
    const maxQ = Math.min(89, Math.floor(9800 / divisor));
    quotient = Math.floor(Math.random() * (maxQ - minQ + 1)) + minQ;
  } else if (type === '5d-exact') {
    divisor = Math.floor(Math.random() * 450) + 115;
    const minQ = Math.max(25, Math.ceil(11000 / divisor));
    const maxQ = Math.min(399, Math.floor(95000 / divisor));
    quotient = Math.floor(Math.random() * (maxQ - minQ + 1)) + minQ;
  } else if (type === '5d-zero') {
    // Guaranteed 0 in the middle of quotient, e.g., 104, 203, 305
    divisor = Math.floor(Math.random() * 280) + 115; // 115 .. 394
    const hundreds = Math.floor(Math.random() * 3) + 1; // 1..3
    const ones = Math.floor(Math.random() * 7) + 2; // 2..8
    quotient = hundreds * 100 + ones; // e.g. 204
  } else {
    // 5d-rest (with remainder)
    divisor = Math.floor(Math.random() * 420) + 120;
    const minQ = Math.max(25, Math.ceil(11000 / divisor));
    const maxQ = Math.min(350, Math.floor(92000 / divisor));
    quotient = Math.floor(Math.random() * (maxQ - minQ + 1)) + minQ;
    remainder = Math.floor(Math.random() * (divisor - 1)) + 1;
  }

  const dividend = divisor * quotient + remainder;
  return { dividend, divisor };
}

function startNewPracticeProblem() {
  const { dividend, divisor } = generateRandomProblem(practiceState.difficulty);
  practiceState.dividend = dividend;
  practiceState.divisor = divisor;
  practiceState.steps = generateDivisionSteps(dividend, divisor);
  practiceState.activeStepIdx = 1; // Step 1 is the first interactive action

  document.getElementById('scratch-divisor').textContent = divisor;
  document.getElementById('scratch-result').textContent =
    `${divisor} × ? = (Yukarıdan bir rakama tıkla!)`;
  document.querySelectorAll('.scratch-btn').forEach(b => b.classList.remove('active'));

  renderPracticeState();
}

function renderPracticeState() {
  const idx = practiceState.activeStepIdx;
  const totalInteractive = practiceState.steps.length - 2; // excluding start and finish
  const currentStep = practiceState.steps[idx];
  const prevStep = practiceState.steps[idx - 1];

  const feedbackEl = document.getElementById('practice-feedback');
  const hintBoxEl = document.getElementById('practice-hint-box');
  const inputContainer = document.getElementById('practice-input-container');
  const inputEl = document.getElementById('practice-user-input');

  feedbackEl.classList.add('hidden');
  hintBoxEl.classList.add('hidden');

  if (currentStep.phase === 'finish') {
    // Completed!
    renderGridToDOM(document.getElementById('practice-grid'), currentStep.grid);
    document.getElementById('practice-progress-label').textContent = `Tamamlandı! 🎉`;
    document.getElementById('practice-phase-badge').textContent =
      formatBilingualText(currentStep.badgeTr, currentStep.badgeDe);
    document.getElementById('practice-prompt-title').textContent =
      formatBilingualText(currentStep.titleTr, currentStep.titleDe);
    document.getElementById('practice-question-text').innerHTML =
      formatBilingualHTML(currentStep.tr, currentStep.de) +
      `<div class="estimation-box">${formatBilingualHTML(currentStep.tip.tr, currentStep.tip.de)}</div>`;
    inputContainer.classList.add('hidden');
    launchConfetti();
    return;
  }

  inputContainer.classList.remove('hidden');
  document.getElementById('practice-progress-label').textContent =
    `Adım ${idx} / ${totalInteractive}`;

  // Show the previous step's grid, with target cells marked with '?'
  renderGridToDOM(
    document.getElementById('practice-grid'),
    prevStep.grid,
    currentStep.targetCells
  );

  document.getElementById('practice-phase-badge').textContent =
    formatBilingualText(currentStep.badgeTr, currentStep.badgeDe);
  document.getElementById('practice-prompt-title').textContent =
    formatBilingualText(currentStep.titleTr, currentStep.titleDe);
  document.getElementById('practice-question-text').innerHTML =
    formatBilingualHTML(currentStep.promptTr, currentStep.promptDe);

  inputEl.value = '';
  inputEl.focus();
}

function checkPracticeAnswer() {
  const currentStep = practiceState.steps[practiceState.activeStepIdx];
  if (!currentStep || currentStep.phase === 'finish') return;

  const inputEl = document.getElementById('practice-user-input');
  const userVal = parseInt(inputEl.value, 10);
  const feedbackEl = document.getElementById('practice-feedback');

  if (isNaN(userVal)) {
    feedbackEl.textContent = 'Lütfen bir sayı yaz! / Bitte gib eine Zahl ein!';
    feedbackEl.className = 'feedback-banner error';
    return;
  }

  if (userVal === currentStep.expectedAnswer) {
    // Correct!
    practiceState.stars += 1;
    practiceState.streak += 1;
    updateScoreUI();

    feedbackEl.innerHTML = `🌟 <strong>Harika! Doğru Cevap (${userVal})!</strong> / <em>Super! Richtig!</em>`;
    feedbackEl.className = 'feedback-banner success';

    setTimeout(() => {
      practiceState.activeStepIdx++;
      renderPracticeState();
    }, 650);
  } else {
    // Helpful hint on wrong answer
    practiceState.streak = 0;
    updateScoreUI();

    let extraHint = '';
    if (currentStep.phase === 'divide') {
      if (userVal > currentStep.expectedAnswer) {
        extraHint = ` (${userVal} × ${practiceState.divisor} = ${userVal * practiceState.divisor} çok büyük geldi! Daha küçük bir rakam dene.)`;
      } else {
        extraHint = ` (${userVal} biraz küçük kaldı, daha büyük bir rakam sığabilir!)`;
      }
    }

    feedbackEl.innerHTML = `🤔 <strong>${userVal}</strong> tam olmadı${extraHint} Tekrar dene veya "İpucu Ver" butonuna bas!`;
    feedbackEl.className = 'feedback-banner error';
    inputEl.select();
  }
}

function updateScoreUI() {
  document.getElementById('star-count').textContent = practiceState.stars;
  document.getElementById('streak-count').textContent = practiceState.streak;
}

// ============================================================================
// 5. CONFETTI CELEBRATION EFFECT
// ============================================================================

function launchConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const pieces = [];
  const colors = ['#4f46e5', '#f59e0b', '#10b981', '#ec4899', '#8b5cf6', '#06b6d4'];
  for (let i = 0; i < 90; i++) {
    pieces.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      w: Math.random() * 10 + 6,
      h: Math.random() * 6 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      vy: Math.random() * 3 + 2.5,
      vx: (Math.random() - 0.5) * 2,
      angle: Math.random() * Math.PI * 2,
      va: (Math.random() - 0.5) * 0.15
    });
  }

  let frames = 0;
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.angle += p.va;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });
    frames++;
    if (frames < 135) {
      requestAnimationFrame(animate);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }
  requestAnimationFrame(animate);
}

// ============================================================================
// 6. EVENT LISTENERS & INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  // Mode Tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      stopAutoPlay();
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const tabId = 'tab-' + btn.dataset.tab;
      document.getElementById(tabId).classList.add('active');
    });
  });

  // Language Switcher
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentLang = btn.dataset.lang;
      renderLearnStep();
      renderPracticeState();
    });
  });

  // Learn Mode Controls
  document.getElementById('btn-solve-custom').addEventListener('click', () => {
    const dvd = document.getElementById('learn-dividend').value;
    const dvr = document.getElementById('learn-divisor').value;
    initLearnProblem(dvd, dvr);
  });

  document.querySelectorAll('.chip-btn[data-dividend]').forEach(chip => {
    chip.addEventListener('click', () => {
      initLearnProblem(chip.dataset.dividend, chip.dataset.divisor);
    });
  });

  document.getElementById('btn-random-learn').addEventListener('click', () => {
    const types = ['4d-exact', '5d-exact', '5d-zero', '5d-rest'];
    const pick = types[Math.floor(Math.random() * types.length)];
    const { dividend, divisor } = generateRandomProblem(pick);
    initLearnProblem(dividend, divisor);
  });

  document.getElementById('btn-first').addEventListener('click', () => {
    stopAutoPlay();
    learnState.currentStepIndex = 0;
    renderLearnStep();
  });

  document.getElementById('btn-prev').addEventListener('click', () => {
    stopAutoPlay();
    if (learnState.currentStepIndex > 0) {
      learnState.currentStepIndex--;
      renderLearnStep();
    }
  });

  document.getElementById('btn-next').addEventListener('click', () => {
    stopAutoPlay();
    if (learnState.currentStepIndex < learnState.steps.length - 1) {
      learnState.currentStepIndex++;
      renderLearnStep();
    }
  });

  document.getElementById('btn-last').addEventListener('click', () => {
    stopAutoPlay();
    learnState.currentStepIndex = learnState.steps.length - 1;
    renderLearnStep();
  });

  document.getElementById('btn-play').addEventListener('click', toggleAutoPlay);

  document.getElementById('btn-toggle-multiples').addEventListener('click', () => {
    const el = document.getElementById('multiples-list');
    el.classList.toggle('hidden');
  });

  // Practice Mode Controls
  document.querySelectorAll('.diff-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      practiceState.difficulty = btn.dataset.diff;
      startNewPracticeProblem();
    });
  });

  document.getElementById('btn-new-practice').addEventListener('click', startNewPracticeProblem);
  document.getElementById('btn-check-answer').addEventListener('click', checkPracticeAnswer);

  document.getElementById('practice-user-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      checkPracticeAnswer();
    }
  });

  document.getElementById('btn-show-hint').addEventListener('click', () => {
    const currentStep = practiceState.steps[practiceState.activeStepIdx];
    if (!currentStep) return;
    const hintBox = document.getElementById('practice-hint-box');
    hintBox.innerHTML = formatBilingualHTML(currentStep.tip.tr, currentStep.tip.de);
    hintBox.classList.remove('hidden');
  });

  document.getElementById('btn-skip-step').addEventListener('click', () => {
    const currentStep = practiceState.steps[practiceState.activeStepIdx];
    if (!currentStep || currentStep.phase === 'finish') return;
    document.getElementById('practice-user-input').value = currentStep.expectedAnswer;
    checkPracticeAnswer();
  });

  // Scratchpad buttons in Practice Mode
  document.querySelectorAll('.scratch-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.scratch-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const d = parseInt(btn.dataset.d, 10);
      const dvr = practiceState.divisor;
      document.getElementById('scratch-result').innerHTML =
        `<strong>${d} × ${dvr} = ${d * dvr}</strong>`;
    });
  });

  // Trick Tab "Try Zero Trap" shortcut button
  document.getElementById('btn-try-zero-trap').addEventListener('click', () => {
    document.querySelector('.tab-btn[data-tab="learn"]').click();
    initLearnProblem(43218, 214);
  });

  // Initialize both Learn & Practice modes
  initLearnProblem(28456, 127);
  startNewPracticeProblem();
});
