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

  // ⏹ KILL SWITCH
  window.__stop = false;
  
  // Write stopBot() on console to stop the 
  window.stopBot = () => { window.__stop = true; console.warn("⏹ Stop requested"); };

  // Press ESC to stop the script (This might not work in the browser)
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') window.stopBot(); });

  function ensureNotStopped() {
    if (window.__stop) {
      const err = new Error("Aborted by user");
      err.name = "AbortError";
      throw err;
    }
  }

  // ──────────────────────────────────────────────────────────
  // HELPERS
  // ──────────────────────────────────────────────────────────
  function $xFirst(xpath, ctx = document) {
    return document.evaluate(xpath, ctx, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
  }

  function waitForXPath(xpath, timeout = stepTimeout) {
    return new Promise((resolve, reject) => {
      const deadline = Date.now() + timeout;
      (function poll() {
        try { ensureNotStopped(); } catch (e) { return reject(e); }
        const el = $xFirst(xpath);
        if (el) return resolve(el);
        if (Date.now() > deadline) {
          return reject(new Error(`Timeout waiting for ${xpath}`));
        }
        setTimeout(poll, 200);
      })();
    });
  }

  const pause = (ms) => new Promise((res, rej) => {
    const start = Date.now();
    (function tick() {
      if (window.__stop) return rej(new Error("Aborted by user"));
      const elapsed = Date.now() - start;
      if (elapsed >= ms) return res();
      setTimeout(tick, Math.min(200, ms - elapsed));
    })();
  });

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
      ensureNotStopped();
      await pause(10000); // ← Wait for manual page refresh if needed
      ensureNotStopped();

      // Step 1 (fixed)
      const s1 = await waitForXPath(s1Xpath);
      ensureNotStopped();
      console.log(`✅ [${i}] Step 1 found — clicking`);
      s1.scrollIntoView({ block: 'center' });
      s1.click();
      await pause(stepDelay);
      ensureNotStopped();

      // Build Step 2/3 XPaths for the chosen index
      const s2Xpath = buildS2Xpath(selectedRowIndex);
      const s3Xpath = buildS3Xpath(selectedRowIndex);

      // Step 2 (chevron)
      const s2 = await waitForXPath(s2Xpath);
      ensureNotStopped();
      console.log(`✅ [${i}] Step 2 found — clicking (row index ${selectedRowIndex})`);
      s2.scrollIntoView({ block: 'center' });
      s2.click();
      await pause(stepDelay);
      ensureNotStopped();

      // Step 3 ("Reset from here")
      const s3 = await waitForXPath(s3Xpath);
      ensureNotStopped();
      console.log(`✅ [${i}] Step 3 found — clicking (row index ${selectedRowIndex})`);
      s3.scrollIntoView({ block: 'center' });
      s3.click();
      await pause(stepDelay);
      ensureNotStopped();

      // Step 4 (dialogs auto-accepted)
      console.log(`✅ [${i}] Step 4: any alert/confirm auto-accepted`);

      // Wait for Step 1 to reappear before next iteration
      await waitForXPath(s1Xpath);
      console.log(`🔄 [${i}] Ready for next iteration (Step 1 reloaded)`);
    } catch (err) {
      if (err && err.name === "AbortError" || /Aborted by user/i.test(err?.message || "")) {
        console.warn(`🟥 [${i}] Stopped: ${err.message}`);
      } else {
        console.error(`❌ [${i}] Error:`, err);
      }
      break; // stop on abort OR failure
    }
  }

  console.log("\n🎉 All done!");
})();
