(async () => {
  // ──────────────────────────────────────────────────────────
  // CONFIGURATION
  // ──────────────────────────────────────────────────────────
  const iterations   = 10;      // ← how many loops
  const stepDelay    = 500;     // ← ms pause between actions
  const stepTimeout  = 10000;   // ← ms max wait for each XPath
  const s1Xpath      = '//table[@id="tTransactions"]/tbody/tr[1]/td[1]';

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
  // MAIN LOOP
  // ──────────────────────────────────────────────────────────
  console.log(`🚀 Starting ${iterations} iteration(s)…`);

  for (let i = 1; i <= iterations; i++) {
    console.log(`\n🔄 Iteration ${i}/${iterations}`);
    try { 
      await pause(10000);	
      // Step 1
      const s1 = await waitForXPath(s1Xpath);
      console.log(`✅ [${i}] Step 1 found (“${s1.textContent.trim()}”) — clicking`);
      s1.click();
      await pause(stepDelay);

      // Step 2
      const s2Xpath = '//*[@class="table m-0 table-striped table-sm text-muted dataTable no-footer"]/tbody/tr/td[1]/div/button[2]';
      const s2 = await waitForXPath(s2Xpath);
      console.log(`✅ [${i}] Step 2 found — clicking`);
      s2.click();
      await pause(stepDelay);

      // Step 3
      const s3Xpath = '//*[@class="table m-0 table-striped table-sm text-muted dataTable no-footer"]/tbody/tr/td[1]/div/div/a[2]';
      const s3 = await waitForXPath(s3Xpath);
      console.log(`✅ [${i}] Step 3 found — clicking`);
      s3.click();
      await pause(stepDelay);

      // Step 4
      console.log(`✅ [${i}] Step 4: any alert/confirm auto-accepted`);

      // —— NEW: wait for Step 1 to reappear before next iteration
      await waitForXPath(s1Xpath);
      console.log(`🔄 [${i}] Ready for next iteration (Step 1 reloaded)`);
    } catch (err) {
      console.error(`❌ [${i}] Error:`, err);
      break;  // stop on first failure; remove to continue past errors
    }
  }

  console.log("\n🎉 All done!");
})();