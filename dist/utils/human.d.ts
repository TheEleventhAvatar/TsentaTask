import { Page } from 'playwright';
export declare class HumanBehavior {
    /**
     * Generate random delay between min and max milliseconds
     */
    static randomDelay(min?: number, max?: number): Promise<void>;
    /**
     * Simulate human typing with variable speed
     * Letters: faster (50-150ms)
     * Numbers/symbols: slower (100-300ms)
     */
    static humanTyping(page: Page, selector: string, text: string): Promise<void>;
    /**
     * Hover over element then click with realistic delay
     */
    static hoverThenClick(page: Page, selector: string): Promise<void>;
    /**
     * Smooth scroll element into view before interaction
     */
    static smoothScrollIntoView(page: Page, selector: string): Promise<void>;
    /**
     * Realistic mouse movement to element
     */
    static moveToElement(page: Page, selector: string): Promise<void>;
    /**
     * Simulate reading time based on content length
     */
    static simulateReadingTime(characterCount: number): Promise<void>;
    /**
     * Natural pause between actions
     */
    static naturalPause(): Promise<void>;
    /**
     * Select dropdown with human-like behavior
     */
    static humanSelectDropdown(page: Page, selector: string, value: string): Promise<void>;
    /**
     * Check checkbox with realistic behavior
     */
    static humanCheckCheckbox(page: Page, selector: string): Promise<void>;
    /**
     * Fill form field with human-like behavior
     */
    static humanFillField(page: Page, selector: string, value: string): Promise<void>;
}
//# sourceMappingURL=human.d.ts.map