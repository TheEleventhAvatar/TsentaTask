import { Page } from 'playwright';
export declare class FormHelpers {
    /**
     * Fill input field with validation
     */
    static fillInput(page: Page, selector: string, value: string, options?: {
        clear?: boolean;
        validate?: boolean;
    }): Promise<boolean>;
    /**
     * Select checkbox with retry logic
     */
    static selectCheckbox(page: Page, selector: string, checked?: boolean): Promise<boolean>;
    /**
     * Select radio button
     */
    static selectRadio(page: Page, selector: string, value: string): Promise<boolean>;
    /**
     * Select dropdown option
     */
    static selectDropdown(page: Page, selector: string, value: string): Promise<boolean>;
    /**
     * Upload file with verification
     */
    static uploadFile(page: Page, selector: string, filePath: string): Promise<boolean>;
    /**
     * Set slider value
     */
    static setSliderValue(page: Page, selector: string, value: number): Promise<boolean>;
    /**
     * Handle typeahead/autocomplete selection
     */
    static selectTypeahead(page: Page, inputSelector: string, searchValue: string, exactMatch: string): Promise<boolean>;
    /**
     * Handle chip/tag selection
     */
    static selectChips(page: Page, containerSelector: string, values: string[]): Promise<boolean>;
    /**
     * Handle toggle switches
     */
    static setToggle(page: Page, selector: string, enabled: boolean): Promise<boolean>;
}
//# sourceMappingURL=form.d.ts.map