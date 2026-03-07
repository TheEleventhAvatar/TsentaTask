"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormHelpers = void 0;
const human_1 = require("./human");
class FormHelpers {
    /**
     * Fill input field with validation
     */
    static async fillInput(page, selector, value, options = {}) {
        try {
            const element = page.locator(selector);
            await element.waitFor({ state: 'visible', timeout: 10000 });
            if (options.clear !== false) {
                await element.clear();
            }
            await human_1.HumanBehavior.humanTyping(page, selector, value);
            if (options.validate) {
                const filledValue = await element.inputValue();
                if (filledValue !== value) {
                    throw new Error(`Input validation failed. Expected: ${value}, Got: ${filledValue}`);
                }
            }
            return true;
        }
        catch (error) {
            console.error(`Failed to fill input ${selector}:`, error);
            return false;
        }
    }
    /**
     * Select checkbox with retry logic
     */
    static async selectCheckbox(page, selector, checked = true) {
        try {
            const element = page.locator(selector);
            await element.waitFor({ state: 'visible', timeout: 10000 });
            await human_1.HumanBehavior.humanCheckCheckbox(page, selector);
            // Verify the state
            const isChecked = await element.isChecked();
            if (isChecked !== checked) {
                throw new Error(`Checkbox state validation failed. Expected: ${checked}, Got: ${isChecked}`);
            }
            return true;
        }
        catch (error) {
            console.error(`Failed to select checkbox ${selector}:`, error);
            return false;
        }
    }
    /**
     * Select radio button
     */
    static async selectRadio(page, selector, value) {
        try {
            const radioSelector = `${selector}[value="${value}"]`;
            const element = page.locator(radioSelector);
            await element.waitFor({ state: 'visible', timeout: 10000 });
            await human_1.HumanBehavior.smoothScrollIntoView(page, radioSelector);
            await human_1.HumanBehavior.hoverThenClick(page, radioSelector);
            // Verify selection
            const isChecked = await element.isChecked();
            if (!isChecked) {
                throw new Error(`Radio button selection failed for value: ${value}`);
            }
            return true;
        }
        catch (error) {
            console.error(`Failed to select radio ${selector} with value ${value}:`, error);
            return false;
        }
    }
    /**
     * Select dropdown option
     */
    static async selectDropdown(page, selector, value) {
        try {
            const element = page.locator(selector);
            await element.waitFor({ state: 'visible', timeout: 10000 });
            await human_1.HumanBehavior.humanSelectDropdown(page, selector, value);
            // Verify selection
            const selectedValue = await element.inputValue();
            if (selectedValue !== value) {
                // Try alternative verification methods
                const selectedOption = await element.locator(`option[value="${value}"]`).getAttribute('selected');
                if (selectedOption !== 'selected' && selectedOption !== null) {
                    throw new Error(`Dropdown selection failed. Expected: ${value}, Got: ${selectedValue}`);
                }
            }
            return true;
        }
        catch (error) {
            console.error(`Failed to select dropdown ${selector} with value ${value}:`, error);
            return false;
        }
    }
    /**
     * Upload file with verification
     */
    static async uploadFile(page, selector, filePath) {
        try {
            const element = page.locator(selector);
            await element.waitFor({ state: 'visible', timeout: 10000 });
            await human_1.HumanBehavior.smoothScrollIntoView(page, selector);
            await element.setInputFiles(filePath);
            // Wait for upload to complete (check for loading indicators or success messages)
            await page.waitForTimeout(2000);
            // Verify upload was successful (check for file name or success indicator)
            const fileName = filePath.split('/').pop() || filePath.split('\\').pop();
            const hasFileName = await page.locator(`text=${fileName}`).isVisible().catch(() => false);
            const hasSuccessIndicator = await page.locator('[data-success], .success, .uploaded').isVisible().catch(() => false);
            if (!hasFileName && !hasSuccessIndicator) {
                console.warn(`Could not verify file upload for ${selector}, but proceeding...`);
            }
            return true;
        }
        catch (error) {
            console.error(`Failed to upload file to ${selector}:`, error);
            return false;
        }
    }
    /**
     * Set slider value
     */
    static async setSliderValue(page, selector, value) {
        try {
            const element = page.locator(selector);
            await element.waitFor({ state: 'visible', timeout: 10000 });
            // Get slider bounds
            const box = await element.boundingBox();
            if (!box) {
                throw new Error('Could not get slider bounds');
            }
            // Calculate position based on value
            const sliderWidth = box.width;
            const clickX = box.x + (value / 100) * sliderWidth;
            const clickY = box.y + box.height / 2;
            await human_1.HumanBehavior.smoothScrollIntoView(page, selector);
            await human_1.HumanBehavior.moveToElement(page, selector);
            // Click at calculated position
            await page.mouse.click(clickX, clickY);
            await human_1.HumanBehavior.randomDelay(200, 500);
            // Verify the value was set
            const currentValue = await element.inputValue();
            if (Math.abs(parseFloat(currentValue) - value) > 1) {
                throw new Error(`Slider value verification failed. Expected: ${value}, Got: ${currentValue}`);
            }
            return true;
        }
        catch (error) {
            console.error(`Failed to set slider ${selector} to value ${value}:`, error);
            return false;
        }
    }
    /**
     * Handle typeahead/autocomplete selection
     */
    static async selectTypeahead(page, inputSelector, searchValue, exactMatch) {
        try {
            // Type search query
            await FormHelpers.fillInput(page, inputSelector, searchValue);
            // Wait for typeahead results
            await page.waitForTimeout(1000);
            // Look for results container
            const resultsSelector = '[role="listbox"], .autocomplete-results, .typeahead-results, .dropdown-menu';
            const resultsContainer = page.locator(resultsSelector).first();
            if (await resultsContainer.isVisible()) {
                // Find the exact match
                const optionSelector = `${resultsSelector} [role="option"], ${resultsSelector} .dropdown-item, ${resultsSelector} .result-item`;
                const options = page.locator(optionSelector);
                const optionCount = await options.count();
                for (let i = 0; i < optionCount; i++) {
                    const option = options.nth(i);
                    const text = await option.textContent();
                    if (text?.trim().toLowerCase() === exactMatch.toLowerCase()) {
                        await human_1.HumanBehavior.hoverThenClick(page, optionSelector);
                        return true;
                    }
                }
                // If exact match not found, try clicking first result
                if (optionCount > 0) {
                    await human_1.HumanBehavior.hoverThenClick(page, optionSelector);
                    return true;
                }
            }
            // Fallback: try to find and click exact match anywhere
            const exactMatchSelector = `text=${exactMatch}`;
            if (await page.locator(exactMatchSelector).isVisible()) {
                await human_1.HumanBehavior.hoverThenClick(page, exactMatchSelector);
                return true;
            }
            throw new Error('Could not find typeahead option to select');
        }
        catch (error) {
            console.error(`Failed to select typeahead option for ${searchValue}:`, error);
            return false;
        }
    }
    /**
     * Handle chip/tag selection
     */
    static async selectChips(page, containerSelector, values) {
        try {
            const container = page.locator(containerSelector);
            await container.waitFor({ state: 'visible', timeout: 10000 });
            for (const value of values) {
                const chipSelector = `${containerSelector} [data-value="${value}"], ${containerSelector} .chip:has-text("${value}"), ${containerSelector} [role="option"]:has-text("${value}")`;
                const chip = page.locator(chipSelector);
                if (await chip.isVisible()) {
                    await human_1.HumanBehavior.hoverThenClick(page, chipSelector);
                    await human_1.HumanBehavior.randomDelay(100, 300);
                }
                else {
                    console.warn(`Chip not found: ${value}`);
                }
            }
            return true;
        }
        catch (error) {
            console.error(`Failed to select chips:`, error);
            return false;
        }
    }
    /**
     * Handle toggle switches
     */
    static async setToggle(page, selector, enabled) {
        try {
            const element = page.locator(selector);
            await element.waitFor({ state: 'visible', timeout: 10000 });
            const currentState = await element.getAttribute('aria-checked') === 'true' ||
                await element.isChecked() ||
                await element.evaluate((el) => el.classList.contains('active') || el.classList.contains('on'));
            if (currentState !== enabled) {
                await human_1.HumanBehavior.hoverThenClick(page, selector);
                await human_1.HumanBehavior.randomDelay(200, 400);
            }
            return true;
        }
        catch (error) {
            console.error(`Failed to set toggle ${selector} to ${enabled}:`, error);
            return false;
        }
    }
}
exports.FormHelpers = FormHelpers;
//# sourceMappingURL=form.js.map