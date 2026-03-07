"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HumanBehavior = void 0;
class HumanBehavior {
    /**
     * Generate random delay between min and max milliseconds
     */
    static randomDelay(min = 100, max = 800) {
        const delay = Math.floor(Math.random() * (max - min + 1)) + min;
        return new Promise(resolve => setTimeout(resolve, delay));
    }
    /**
     * Simulate human typing with variable speed
     * Letters: faster (50-150ms)
     * Numbers/symbols: slower (100-300ms)
     */
    static async humanTyping(page, selector, text) {
        const element = page.locator(selector);
        await element.clear();
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            let delay;
            // Faster for letters, slower for numbers and symbols
            if (/[a-zA-Z]/.test(char)) {
                delay = Math.random() * 100 + 50; // 50-150ms
            }
            else if (/[0-9]/.test(char)) {
                delay = Math.random() * 150 + 100; // 100-250ms
            }
            else {
                delay = Math.random() * 200 + 100; // 100-300ms for symbols
            }
            await element.type(char, { delay });
            // Occasional longer pause (thinking)
            if (Math.random() < 0.05) {
                await this.randomDelay(200, 600);
            }
        }
    }
    /**
     * Hover over element then click with realistic delay
     */
    static async hoverThenClick(page, selector) {
        const element = page.locator(selector);
        // Hover first
        await element.hover();
        await this.randomDelay(50, 200);
        // Then click
        await element.click();
    }
    /**
     * Smooth scroll element into view before interaction
     */
    static async smoothScrollIntoView(page, selector) {
        const element = page.locator(selector);
        // Scroll element into view
        await element.scrollIntoViewIfNeeded();
        await this.randomDelay(200, 500); // Wait for scroll to complete
        // Additional small delay to simulate reading
        await this.randomDelay(300, 800);
    }
    /**
     * Realistic mouse movement to element
     */
    static async moveToElement(page, selector) {
        const element = page.locator(selector);
        const box = await element.boundingBox();
        if (box) {
            // Move mouse with slight random offset to simulate imperfect movement
            const offsetX = (Math.random() - 0.5) * 10;
            const offsetY = (Math.random() - 0.5) * 10;
            await page.mouse.move(box.x + box.width / 2 + offsetX, box.y + box.height / 2 + offsetY);
        }
    }
    /**
     * Simulate reading time based on content length
     */
    static simulateReadingTime(characterCount) {
        // Average reading speed: 200-250 words per minute
        // Average word length: 5 characters
        const wordsPerMinute = 225;
        const avgWordLength = 5;
        const words = characterCount / avgWordLength;
        const readingTimeMs = (words / wordsPerMinute) * 60 * 1000;
        // Add some variance and cap at reasonable limits
        const variance = readingTimeMs * 0.3;
        const finalTime = Math.max(500, Math.min(readingTimeMs + (Math.random() - 0.5) * variance, 5000));
        return new Promise(resolve => setTimeout(resolve, finalTime));
    }
    /**
     * Natural pause between actions
     */
    static async naturalPause() {
        // Simulate thinking or processing time between actions
        await this.randomDelay(300, 1200);
    }
    /**
     * Select dropdown with human-like behavior
     */
    static async humanSelectDropdown(page, selector, value) {
        await this.smoothScrollIntoView(page, selector);
        await this.moveToElement(page, selector);
        await this.randomDelay(100, 300);
        const element = page.locator(selector);
        await element.click();
        await this.randomDelay(200, 400);
        // Wait for dropdown options to appear
        const optionSelector = `${selector} option[value="${value}"], ${selector} [data-value="${value}"]`;
        await page.waitForSelector(optionSelector, { timeout: 5000 });
        await this.hoverThenClick(page, optionSelector);
    }
    /**
     * Check checkbox with realistic behavior
     */
    static async humanCheckCheckbox(page, selector) {
        await this.smoothScrollIntoView(page, selector);
        await this.moveToElement(page, selector);
        await this.randomDelay(100, 200);
        const element = page.locator(selector);
        const isChecked = await element.isChecked();
        if (!isChecked) {
            await element.check();
            await this.randomDelay(100, 300);
        }
    }
    /**
     * Fill form field with human-like behavior
     */
    static async humanFillField(page, selector, value) {
        await this.smoothScrollIntoView(page, selector);
        await this.moveToElement(page, selector);
        await this.randomDelay(100, 300);
        await this.humanTyping(page, selector, value);
        await this.randomDelay(200, 500);
    }
}
exports.HumanBehavior = HumanBehavior;
//# sourceMappingURL=human.js.map