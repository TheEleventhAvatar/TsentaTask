"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AcmeHandler = void 0;
const base_1 = require("./base");
const human_1 = require("../utils/human");
const form_1 = require("../utils/form");
const retry_1 = require("../utils/retry");
const logger_1 = require("../utils/logger");
const performance_1 = require("../utils/performance");
const screenshots_1 = require("../utils/screenshots");
class AcmeHandler extends base_1.BasePlatformHandler {
    constructor() {
        super('ACME');
        this.logger = logger_1.Logger.getInstance();
        this.performance = performance_1.PerformanceTracker.getInstance();
        this.screenshots = screenshots_1.ScreenshotManager.getInstance();
    }
    canHandle(url) {
        const acmePatterns = [
            /acme.*corp/i,
            /acme.*ats/i,
            /jobs\.acme/i,
            /careers\.acme/i,
            /acme\.html/i,
            /localhost.*acme/i
        ];
        return acmePatterns.some(pattern => pattern.test(url));
    }
    async apply(page, profile) {
        this.logger.setPlatform('ACME');
        this.performance.setPlatform('ACME');
        this.screenshots.setPlatform('ACME');
        await this.startTimer();
        this.performance.startFormTracking(page.url());
        try {
            this.logger.info('Starting ACME application process', 'ACME_HANDLER');
            await this.screenshots.takeScreenshot(page, 'start_of_application');
            // Fix right-alignment issue by centering the page
            await page.evaluate(() => {
                const body = document.body;
                body.style.margin = '0 auto';
                body.style.padding = '20px';
                body.style.maxWidth = '1200px';
                body.style.textAlign = 'left';
                body.style.justifyContent = 'flex-start';
                // Fix any container alignment issues
                const containers = document.querySelectorAll('.container, .main, .content');
                containers.forEach(container => {
                    container.style.margin = '0 auto';
                    container.style.textAlign = 'left';
                });
            });
            // Step 1: Navigate through multi-step wizard
            await this.handlePersonalInfoStep(page, profile);
            await this.handleEducationStep(page, profile);
            await this.handleExperienceAndSkillsStep(page, profile);
            await this.handleResumeUploadStep(page, profile);
            await this.handleReviewStep(page, profile);
            await this.handleSubmitStep(page);
            // Step 2: Extract confirmation ID
            const confirmationId = await this.extractConfirmationId(page);
            await this.screenshots.takeScreenshot(page, 'application_complete');
            const result = this.createResult(true, confirmationId);
            this.performance.endFormTracking(page.url(), true);
            this.logger.success(`ACME application completed successfully. Confirmation ID: ${confirmationId}`, 'ACME_HANDLER');
            return result;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`ACME application failed: ${errorMessage}`, 'ACME_HANDLER');
            await this.screenshots.onError(page, error, 'application_failure');
            const result = this.createResult(false, undefined, errorMessage);
            this.performance.endFormTracking(page.url(), false, errorMessage);
            return result;
        }
    }
    async handlePersonalInfoStep(page, profile) {
        this.addStep('Personal Information');
        this.performance.startTimer('personal_info_step');
        try {
            this.logger.step('Filling personal information');
            await this.screenshots.beforeAction(page, 'personal_info');
            // Wait for personal info form to be visible
            await page.waitForSelector('.personal-info, .step-1, [data-step="1"]', { timeout: 10000 });
            // Fill personal information fields
            await form_1.FormHelpers.fillInput(page, 'input[name="firstName"]', profile.firstName);
            await form_1.FormHelpers.fillInput(page, 'input[name="lastName"]', profile.lastName);
            await form_1.FormHelpers.fillInput(page, 'input[name="email"]', profile.email);
            await form_1.FormHelpers.fillInput(page, 'input[name="phone"]', profile.phone);
            await human_1.HumanBehavior.naturalPause();
            await this.screenshots.afterAction(page, 'personal_info');
            // Click next button
            await this.clickNextButton(page);
            this.performance.endTimer('personal_info_step');
            this.logger.success('Personal information completed', 'ACME_HANDLER');
        }
        catch (error) {
            this.performance.endTimer('personal_info_step');
            throw error;
        }
    }
    async handleEducationStep(page, profile) {
        this.addStep('Education');
        this.performance.startTimer('education_step');
        try {
            this.logger.step('Filling education information');
            await this.screenshots.beforeAction(page, 'education');
            // Wait for education step
            await page.waitForSelector('.education, .step-2, [data-step="2"]', { timeout: 10000 });
            // Handle typeahead school selector
            await form_1.FormHelpers.selectTypeahead(page, 'input[name="school"]', profile.education.school.substring(0, 10), // Search with partial name
            profile.education.school);
            // Fill other education fields
            // Map degree names to option values
            const degreeMap = {
                'Bachelor of Science': 'bachelors',
                'Bachelor of Arts': 'bachelors',
                'Bachelor\'s Degree': 'bachelors',
                'Master of Science': 'masters',
                'Master of Arts': 'masters',
                'Master\'s Degree': 'masters',
                'PhD': 'phd',
                'Doctorate': 'phd',
                'High School': 'high-school',
                'Associate\'s Degree': 'associates'
            };
            const degreeValue = degreeMap[profile.education.degree] || 'bachelors';
            // Use JavaScript to directly select the dropdown option
            const degreeSelect = page.locator('select[name="degree"]');
            await degreeSelect.evaluate((el, value) => {
                const select = el;
                select.style.display = 'block';
                select.style.visibility = 'visible';
                // Find and select the option
                for (let i = 0; i < select.options.length; i++) {
                    if (select.options[i].value === value) {
                        select.selectedIndex = i;
                        select.dispatchEvent(new Event('change'));
                        break;
                    }
                }
            }, degreeValue);
            await form_1.FormHelpers.fillInput(page, 'input[name="field"]', profile.education.major);
            await human_1.HumanBehavior.naturalPause();
            await this.screenshots.afterAction(page, 'education');
            await this.clickNextButton(page);
            this.performance.endTimer('education_step');
            this.logger.success('Education information completed', 'ACME_HANDLER');
        }
        catch (error) {
            this.performance.endTimer('education_step');
            throw error;
        }
    }
    async handleExperienceAndSkillsStep(page, profile) {
        this.addStep('Experience & Skills');
        this.performance.startTimer('experience_skills_step');
        try {
            this.logger.step('Filling work experience and skills');
            await this.screenshots.beforeAction(page, 'experience_skills');
            // Wait for experience & skills step
            await page.waitForSelector('.experience, .step-3, [data-step="3"]', { timeout: 10000 });
            // Fill experience information
            const firstExp = profile.experience[0];
            const experienceInput = page.locator('input[name="experience"]');
            // Use JavaScript to directly set the value since the field is hidden
            await experienceInput.evaluate((el, value) => {
                el.value = value;
                el.style.display = 'block';
                el.style.visibility = 'visible';
            }, firstExp.description);
            // Trigger change event
            await experienceInput.dispatchEvent('input');
            await experienceInput.dispatchEvent('change');
            // Handle work authorization questions in the same step
            await form_1.FormHelpers.selectRadio(page, 'input[name="workAuth"]', profile.authorizedToWorkInUS ? 'yes' : 'no');
            // Handle conditional visa sponsorship field
            if (profile.authorizedToWorkInUS) {
                // Visa field appears when work auth is yes
                await form_1.FormHelpers.selectRadio(page, 'input[name="visa"]', profile.requiresVisaSponsorship ? 'yes' : 'no');
            }
            // Select skills using checkboxes
            const availableSkills = ['javascript', 'python', 'react', 'nodejs', 'typescript'];
            for (const skill of availableSkills) {
                if (profile.skills.some(s => s.toLowerCase().includes(skill))) {
                    const skillSelector = `input[type="checkbox"][value="${skill}"]`;
                    await form_1.FormHelpers.selectCheckbox(page, skillSelector);
                }
            }
            await human_1.HumanBehavior.naturalPause();
            await this.screenshots.afterAction(page, 'experience_skills');
            await this.clickNextButton(page);
            this.performance.endTimer('experience_skills_step');
            this.logger.success('Experience and skills completed', 'ACME_HANDLER');
        }
        catch (error) {
            this.performance.endTimer('experience_skills_step');
            throw error;
        }
    }
    async handleResumeUploadStep(page, profile) {
        this.addStep('Resume Upload');
        this.performance.startTimer('resume_upload_step');
        try {
            this.logger.step('Uploading resume');
            await this.screenshots.beforeAction(page, 'resume_upload');
            // Wait for resume upload step
            await page.waitForSelector('.resume-upload, .step-4, [data-step="4"]', { timeout: 10000 });
            // Upload resume file
            const fileInput = page.locator('input[type="file"]');
            // Make the file input visible and upload
            await fileInput.evaluate(el => el.style.display = 'block');
            await form_1.FormHelpers.uploadFile(page, 'input[type="file"]', profile.resumePath);
            await human_1.HumanBehavior.naturalPause();
            await this.screenshots.afterAction(page, 'resume_upload');
            await this.clickNextButton(page);
            this.performance.endTimer('resume_upload_step');
            this.logger.success('Resume uploaded', 'ACME_HANDLER');
        }
        catch (error) {
            this.performance.endTimer('resume_upload_step');
            throw error;
        }
    }
    async handleReviewStep(page, profile) {
        this.addStep('Review');
        this.performance.startTimer('review_step');
        try {
            this.logger.step('Reviewing application');
            await this.screenshots.beforeAction(page, 'review');
            // Wait for review step
            await page.waitForSelector('.review-section, #step4, [data-step="4"]', { timeout: 10000 });
            // Simulate reviewing the information
            await human_1.HumanBehavior.simulateReadingTime(1000); // Simulate reading review
            await human_1.HumanBehavior.randomDelay(2000, 4000);
            await this.screenshots.afterAction(page, 'review');
            this.performance.endTimer('review_step');
            this.logger.success('Application reviewed', 'ACME_HANDLER');
        }
        catch (error) {
            this.performance.endTimer('review_step');
            throw error;
        }
    }
    async handleSubmitStep(page) {
        this.addStep('Submit');
        this.performance.startTimer('submit_step');
        try {
            this.logger.step('Submitting application');
            await this.screenshots.beforeSubmission(page);
            // Look for submit button (in ACME it's the same next-btn with text "Submit")
            const submitButton = page.locator('#next-btn:has-text("Submit"), button:has-text("Submit")');
            // Make the submit button visible if it's hidden
            await submitButton.evaluate(el => el.style.display = 'block');
            await submitButton.evaluate(el => el.style.visibility = 'visible');
            await submitButton.waitFor({ state: 'visible', timeout: 10000 });
            await retry_1.RetryOperation.submit(async () => {
                await human_1.HumanBehavior.hoverThenClick(page, '#next-btn:has-text("Submit"), button:has-text("Submit")');
            }, 'ACME Application');
            // Wait for submission to complete
            await page.waitForLoadState('networkidle', { timeout: 15000 });
            this.performance.endTimer('submit_step');
            this.logger.success('Application submitted', 'ACME_HANDLER');
        }
        catch (error) {
            this.performance.endTimer('submit_step');
            throw error;
        }
    }
    async extractConfirmationId(page) {
        this.addStep('Extract Confirmation');
        this.performance.startTimer('confirmation_extraction');
        try {
            this.logger.step('Extracting confirmation ID');
            await this.screenshots.confirmationPage(page);
            // Wait for confirmation page
            await page.waitForSelector('.confirmation, .success, .thank-you', { timeout: 15000 });
            // Try different selectors for confirmation ID
            const confirmationSelectors = [
                '.confirmation-id',
                '.confirmation-number',
                '.reference-id',
                '[data-confirmation-id]',
                '.application-id',
                '.success-message:has-text("Confirmation")'
            ];
            let confirmationId = '';
            for (const selector of confirmationSelectors) {
                try {
                    const element = page.locator(selector);
                    if (await element.isVisible()) {
                        const text = await element.textContent();
                        if (text) {
                            // Extract ID from text (look for alphanumeric patterns)
                            const match = text.match(/[A-Z0-9]{8,}/i);
                            if (match) {
                                confirmationId = match[0];
                                break;
                            }
                        }
                    }
                }
                catch (error) {
                    // Continue to next selector
                }
            }
            // Fallback: look for any ID-like pattern in the page
            if (!confirmationId) {
                const pageContent = await page.content();
                const match = pageContent.match(/(?:confirmation|reference|application)[\s:]*([A-Z0-9]{8,})/i);
                if (match) {
                    confirmationId = match[1];
                }
            }
            this.performance.endTimer('confirmation_extraction');
            if (confirmationId) {
                this.logger.success(`Confirmation ID extracted: ${confirmationId}`, 'ACME_HANDLER');
            }
            else {
                this.logger.warning('Could not extract confirmation ID', 'ACME_HANDLER');
                confirmationId = 'UNKNOWN';
            }
            return confirmationId;
        }
        catch (error) {
            this.performance.endTimer('confirmation_extraction');
            throw error;
        }
    }
    async clickNextButton(page) {
        await retry_1.RetryOperation.click(async () => {
            await human_1.HumanBehavior.hoverThenClick(page, '#next-btn');
        }, 'Next Button');
        // Wait for next step to load
        await page.waitForTimeout(2000);
    }
}
exports.AcmeHandler = AcmeHandler;
//# sourceMappingURL=acme.js.map