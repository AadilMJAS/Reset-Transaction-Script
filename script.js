(async () => {
  // ──────────────────────────────────────────────────────────
  // CONFIGURATION
  // ──────────────────────────────────────────────────────────
  const iterations   = 2;       // ← how many loops
  const stepDelay    = 500;     // ← ms pause between actions
  const stepTimeout  = 10000;   // ← ms max wait for each XPath

  // ──────────────────────────────────────────────────────────
  // ROW SELECTION
  // ──────────────────────────────────────────────────────────
  // If invalid/missing, default to 1.
  let selectedRowIndex = 1; // ← set this to 2, 3, ... when needed

  // Normalize selection to a safe positive integer
  selectedRowIndex = Number.isInteger(selectedRowIndex) && selectedRowIndex > 0
    ? selectedRowIndex
    : 1;

  // ──────────────────────────────────────────────────────────
  // XPATH
  // ──────────────────────────────────────────────────────────
  const s1Xpath = '//table[@id="tTransactions"]/tbody/tr[1]/td[1]';
  
  // Builders for Step 2 & Step 3 XPaths (index-based)
  // Chevron button
  const buildS2Xpath = (n) =>
    `//*[@class="table m-0 table-striped table-sm text-muted dataTable no-footer"]/tbody/tr[${n}]/td[1]/div/button[2]`;
  // Reset button
  const buildS3Xpath = (n) =>
    `//*[@class="table m-0 table-striped table-sm text-muted dataTable no-footer"]/tbody/tr[${n}]/td[1]/div/div/a[2]`;

  // ──────────────────────────────────────────────────────────
  // DIALOG OVERRIDES
  // ──────────────────────────────────────────────────────────
  window.alert   = msg => console.log(`(auto-alert) "${msg}"`);
  window.confirm = msg => { console.log(`(auto-confirm) "${msg}"`); return true; };

  // ──────────────────────────────────────────────────────────
  // HELPERS
  // ──────────────────────────────────────────────────────────
  function $xFirst(xpath, ctx = document) {
    return document.evaluate(
      xpath, ctx, null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    ).singleNodeValue;
  }

  function waitForXPath(xpath, timeout = stepTimeout) {
    return new Promise((resolve, reject) => {
      const deadline = Date.now() + timeout;
      (function poll() {
        const el = $xFirst(xpath);
        if (el) return resolve(el);
        if (Date.now() > deadline) {
          return reject(new Error(`Timeout waiting for ${xpath}`));
        }
        setTimeout(poll, 200);
      })();
    });
  }

  const pause = ms => new Promise(res => setTimeout(res, ms));

  // ──────────────────────────────────────────────────────────
  // LOGGING
  // ──────────────────────────────────────────────────────────
  const s2XpathPreview = buildS2Xpath(selectedRowIndex);
  const s3XpathPreview = buildS3Xpath(selectedRowIndex);
  console.log("🧭 Selection:");
  console.log(`   • Row Selected: ${selectedRowIndex}`);
  console.log("   • Step 1 XPath:", s1Xpath);
  console.log("   • Step 2 XPath:", s2XpathPreview);
  console.log("   • Step 3 XPath:", s3XpathPreview);

  // ──────────────────────────────────────────────────────────
  // MAIN LOOP
  // ──────────────────────────────────────────────────────────
  console.log(`🚀 Starting ${iterations} iteration(s)`);

  for (let i = 1; i <= iterations; i++) {
    console.log(`\n🔄 Iteration ${i}/${iterations}`);
    try {
      await pause(10000); // ← Wait for manual page refresh if needed

      // Step 1 (fixed)
      const s1 = await waitForXPath(s1Xpath);
      console.log(`✅ [${i}] Step 1 found — clicking`);
      s1.click();
      await pause(stepDelay);

      // Build Step 2/3 XPaths for the chosen index
      const s2Xpath = buildS2Xpath(selectedRowIndex);
      const s3Xpath = buildS3Xpath(selectedRowIndex);

      // Step 2 (chevron)
      const s2 = await waitForXPath(s2Xpath);
      console.log(`✅ [${i}] Step 2 found — clicking row ${selectedRowIndex}`);
      s2.click();
      await pause(stepDelay);

      // Step 3 ("Reset from here")
      const s3 = await waitForXPath(s3Xpath);
      console.log(`✅ [${i}] Step 3 found — clicking row ${selectedRowIndex}`);
      s3.click();
      await pause(stepDelay);

      // Step 4 (dialogs auto-accepted)
      console.log(`✅ [${i}] Step 4: any alert/confirm auto-accepted`);

      // Wait for Step 1 to reappear before next iteration
      await waitForXPath(s1Xpath);
      console.log(`🔄 [${i}] Ready for next iteration (Step 1 reloaded)`);
    } catch (err) {
      console.error(`❌ [${i}] `, err);
      break; // abort
    }
  }

  console.log("\n🎉 All done!");
})();
