"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobexHandler = void 0;
const base_1 = require("./base");
const human_1 = require("../utils/human");
const form_1 = require("../utils/form");
const retry_1 = require("../utils/retry");
const logger_1 = require("../utils/logger");
const performance_1 = require("../utils/performance");
const screenshots_1 = require("../utils/screenshots");
class GlobexHandler extends base_1.BasePlatformHandler {
    constructor() {
        super('GLOBEX');
        this.logger = logger_1.Logger.getInstance();
        this.performance = performance_1.PerformanceTracker.getInstance();
        this.screenshots = screenshots_1.ScreenshotManager.getInstance();
    }
    canHandle(url) {
        const globexPatterns = [
            /globex.*corp/i,
            /globex.*ats/i,
            /jobs\.globex/i,
            /careers\.globex/i,
            /globex\.html/i,
            /localhost.*globex/i
        ];
        return globexPatterns.some(pattern => pattern.test(url));
    }
    async validatePage(page) {
        try {
            const title = await page.title();
            const url = page.url();
            const hasError = await page.locator('body').textContent().then(text => text?.toLowerCase().includes('error') ||
                text?.toLowerCase().includes('page not found') ||
                text?.toLowerCase().includes('404'));
            return !hasError && title.length > 0 && !url.includes('error');
        }
        catch {
            return false;
        }
    }
    async apply(page, profile) {
        this.logger.setPlatform('GLOBEX');
        this.performance.setPlatform('GLOBEX');
        this.screenshots.setPlatform('GLOBEX');
        await this.startTimer();
        this.performance.startFormTracking(page.url());
        try {
            this.logger.step('Starting GLOBEX application process');
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
            // Step 1: Personal Information
            await this.handlePersonalInfoSection(page, profile);
            // Step 2: Education
            await this.handleEducationSection(page, profile);
            // Step 3: Experience
            await this.handleExperienceSection(page, profile);
            // Step 4: Skills
            await this.handleSkillsSection(page, profile);
            // Step 5: Additional Questions
            await this.handleQuestionsSection(page, profile);
            // Step 6: Salary Expectations
            await this.handleSalarySection(page, profile);
            // Step 7: Resume Upload
            await this.handleResumeUploadSection(page, profile);
            // Step 8: Submit Application
            await this.handleSubmitSection(page);
            // Step 9: Extract Confirmation
            const confirmationId = await this.extractConfirmationNumber(page);
            await this.endTimer();
            const executionTime = this.performance.getTotalTime();
            return {
                success: true,
                confirmationId: confirmationId,
                executionTime
            };
        }
        catch (error) {
            await this.endTimer();
            throw error;
        }
    }
    async handlePersonalInfoSection(page, profile) {
        this.addStep('Personal Information');
        this.performance.startTimer('personal_info_section');
        try {
            this.logger.step('Filling personal information');
            await this.screenshots.beforeAction(page, 'personal_info');
            await this.scrollToSection(page, 'personal, .section-personal, [data-section="personal"]');
            // Fill personal information fields
            await form_1.FormHelpers.fillInput(page, 'input[name="firstName"]', profile.firstName);
            await form_1.FormHelpers.fillInput(page, 'input[name="lastName"]', profile.lastName);
            await form_1.FormHelpers.fillInput(page, 'input[name="email"]', profile.email);
            await form_1.FormHelpers.fillInput(page, 'input[name="phone"]', profile.phone);
            await form_1.FormHelpers.fillInput(page, 'input[name="address"]', profile.address);
            await form_1.FormHelpers.fillInput(page, 'input[name="city"]', profile.city);
            await form_1.FormHelpers.fillInput(page, 'input[name="state"]', profile.state);
            await form_1.FormHelpers.fillInput(page, 'input[name="zipCode"]', profile.zipCode);
            await this.waitForInlineValidation(page);
            await human_1.HumanBehavior.naturalPause();
            await this.screenshots.afterAction(page, 'personal_info');
            this.performance.endTimer('personal_info_section');
            this.logger.success('Personal information section completed', 'GLOBEX_HANDLER');
        }
        catch (error) {
            this.performance.endTimer('personal_info_section');
            throw error;
        }
    }
    async handleEducationSection(page, profile) {
        this.addStep('Education');
        this.performance.startTimer('education_section');
        try {
            this.logger.step('Filling education information');
            await this.screenshots.beforeAction(page, 'education');
            await this.scrollToSection(page, 'education, .section-education, [data-section="education"]');
            // Ensure education accordion is fully expanded and visible
            const educationSection = page.locator('[data-section="education"]');
            const educationHeader = educationSection.locator('.accordion-header');
            const educationContent = educationSection.locator('.accordion-content');
            // Click to expand if not already expanded
            const isExpanded = await educationSection.evaluate(el => el.classList.contains('expanded'));
            if (!isExpanded) {
                await educationHeader.click();
                await page.waitForTimeout(500); // Wait for animation
            }
            // Make content visible
            await educationContent.evaluate(el => {
                el.style.display = 'block';
                el.style.visibility = 'visible';
                el.style.opacity = '1';
            });
            // Fill school information
            await form_1.FormHelpers.fillInput(page, 'input[name="school"]', profile.education.school);
            // Handle degree selection
            const degreeSelect = page.locator('select[name="degree"]');
            await degreeSelect.evaluate(el => el.style.display = 'block');
            await degreeSelect.selectOption({ label: profile.education.degree });
            // Fill major
            await form_1.FormHelpers.fillInput(page, 'input[name="major"]', profile.education.major);
            // Fill graduation year
            await form_1.FormHelpers.fillInput(page, 'input[name="graduationYear"]', profile.education.graduationYear.toString());
            // Handle GPA if provided
            if (profile.education.gpa) {
                await form_1.FormHelpers.fillInput(page, 'input[name="gpa"]', profile.education.gpa.toString());
            }
            await this.waitForInlineValidation(page);
            await human_1.HumanBehavior.naturalPause();
            await this.screenshots.afterAction(page, 'education');
            // Force progression to experience section
            await page.evaluate(() => {
                const experienceSection = document.querySelector('[data-section="experience"]');
                const experienceHeader = experienceSection?.querySelector('.accordion-header');
                if (experienceHeader) {
                    console.log('Forcing progression to experience section');
                    experienceHeader.click();
                }
            });
            await page.waitForTimeout(500); // Wait for transition
            this.performance.endTimer('education_section');
            this.logger.success('Education section completed', 'GLOBEX_HANDLER');
        }
        catch (error) {
            this.performance.endTimer('education_section');
            throw error;
        }
    }
    async handleExperienceSection(page, profile) {
        this.addStep('Experience');
        this.performance.startTimer('experience_section');
        try {
            this.logger.step('Filling work experience');
            await this.screenshots.beforeAction(page, 'experience');
            await this.scrollToSection(page, 'experience, .section-experience, [data-section="experience"]');
            // Ensure experience accordion is fully expanded and visible
            const experienceSection = page.locator('[data-section="experience"]');
            const experienceHeader = experienceSection.locator('.accordion-header');
            const experienceContent = experienceSection.locator('.accordion-content');
            // Click to expand if not already expanded
            const isExpanded = await experienceSection.evaluate(el => el.classList.contains('expanded'));
            if (!isExpanded) {
                await experienceHeader.click();
                await page.waitForTimeout(500); // Wait for animation
            }
            // Make content visible
            await experienceContent.evaluate(el => {
                el.style.display = 'block';
                el.style.visibility = 'visible';
                el.style.opacity = '1';
            });
            // Fill work experience
            await form_1.FormHelpers.fillInput(page, 'input[name="company"]', profile.experience[0].company);
            await form_1.FormHelpers.fillInput(page, 'input[name="position"]', profile.experience[0].position);
            await form_1.FormHelpers.fillInput(page, 'input[name="startDate"]', profile.experience[0].startDate);
            await form_1.FormHelpers.fillInput(page, 'input[name="endDate"]', profile.experience[0].endDate);
            await form_1.FormHelpers.fillInput(page, 'textarea[name="description"]', profile.experience[0].description);
            await this.waitForInlineValidation(page);
            await human_1.HumanBehavior.naturalPause();
            await this.screenshots.afterAction(page, 'experience');
            // Force progression to skills section
            await page.evaluate(() => {
                const skillsSection = document.querySelector('[data-section="skills"]');
                const skillsHeader = skillsSection?.querySelector('.accordion-header');
                if (skillsHeader) {
                    console.log('Forcing progression to skills section');
                    skillsHeader.click();
                }
            });
            await page.waitForTimeout(500); // Wait for transition
            this.performance.endTimer('experience_section');
            this.logger.success('Experience section completed', 'GLOBEX_HANDLER');
        }
        catch (error) {
            this.performance.endTimer('experience_section');
            throw error;
        }
    }
    async handleSkillsSection(page, profile) {
        this.addStep('Skills');
        this.performance.startTimer('skills_section');
        try {
            this.logger.step('Selecting skills');
            await this.screenshots.beforeAction(page, 'skills');
            await this.scrollToSection(page, 'skills, .section-skills, [data-section="skills"]');
            // Ensure skills accordion is fully expanded and visible
            const skillsSection = page.locator('[data-section="skills"]');
            const skillsHeader = skillsSection.locator('.accordion-header');
            const skillsContent = skillsSection.locator('.accordion-content');
            // Click to expand if not already expanded
            const isExpanded = await skillsSection.evaluate(el => el.classList.contains('expanded'));
            if (!isExpanded) {
                await skillsHeader.click();
                await page.waitForTimeout(500); // Wait for animation
            }
            // Make content visible
            await skillsContent.evaluate(el => {
                el.style.display = 'block';
                el.style.visibility = 'visible';
                el.style.opacity = '1';
            });
            // Make skills chips visible and select them
            await page.evaluate(() => {
                const chipContainer = document.querySelector('.chip-container');
                if (chipContainer) {
                    chipContainer.style.display = 'block';
                    chipContainer.style.visibility = 'visible';
                    // Make all chips visible
                    const chips = chipContainer.querySelectorAll('.chip');
                    chips.forEach(chip => {
                        const chipElement = chip;
                        chipElement.style.display = 'block';
                        chipElement.style.visibility = 'visible';
                    });
                }
            });
            // Select specific skills by clicking on chips
            const availableSkills = ['javascript', 'python', 'react', 'nodejs', 'typescript'];
            for (const skill of availableSkills) {
                if (profile.skills.some(s => s.toLowerCase().includes(skill))) {
                    const skillChip = page.locator(`.chip[data-skill="${skill}"]`);
                    await skillChip.evaluate(el => el.style.display = 'block');
                    await human_1.HumanBehavior.hoverThenClick(page, `.chip[data-skill="${skill}"]`);
                    await page.waitForTimeout(200); // Small delay between clicks
                }
            }
            await this.waitForInlineValidation(page);
            await human_1.HumanBehavior.naturalPause();
            await this.screenshots.afterAction(page, 'skills');
            // Force progression to questions section if stuck
            await page.evaluate(() => {
                // Find and click the questions accordion header to force progression
                const questionsSection = document.querySelector('[data-section="questions"]');
                const questionsHeader = questionsSection?.querySelector('.accordion-header');
                if (questionsHeader) {
                    console.log('Forcing progression to questions section');
                    questionsHeader.click();
                }
            });
            await page.waitForTimeout(500); // Wait for transition
            this.performance.endTimer('skills_section');
            this.logger.success('Skills section completed', 'GLOBEX_HANDLER');
        }
        catch (error) {
            this.performance.endTimer('skills_section');
            throw error;
        }
    }
    async handleQuestionsSection(page, profile) {
        this.addStep('Questions');
        this.performance.startTimer('questions_section');
        try {
            this.logger.step('Answering questions with toggle switches');
            await this.screenshots.beforeAction(page, 'questions');
            await this.scrollToSection(page, 'questions, .section-questions, [data-section="questions"]');
            // Ensure questions accordion is fully expanded and visible
            const questionsSection = page.locator('[data-section="questions"]');
            const questionsHeader = questionsSection.locator('.accordion-header');
            const questionsContent = questionsSection.locator('.accordion-content');
            // Click to expand if not already expanded
            const isExpanded = await questionsSection.evaluate(el => el.classList.contains('expanded'));
            if (!isExpanded) {
                await questionsHeader.click();
                await page.waitForTimeout(500); // Wait for animation
            }
            // Make content visible
            await questionsContent.evaluate(el => {
                el.style.display = 'block';
                el.style.visibility = 'visible';
                el.style.opacity = '1';
            });
            // Make toggle switches visible and handle them
            await page.evaluate(() => {
                const toggleSwitches = document.querySelectorAll('.toggle-switch');
                toggleSwitches.forEach(toggle => {
                    toggle.style.display = 'block';
                    toggle.style.visibility = 'visible';
                });
            });
            // Handle work authorization toggle
            const workAuthToggle = page.locator('#authorizedToWork');
            await workAuthToggle.evaluate(el => el.style.display = 'block');
            // Check current state and toggle if needed
            const currentWorkAuthState = await workAuthToggle.evaluate(el => el.classList.contains('active'));
            if (profile.authorizedToWorkInUS !== currentWorkAuthState) {
                await human_1.HumanBehavior.hoverThenClick(page, '#authorizedToWork');
                await page.waitForTimeout(300);
            }
            // Handle visa sponsorship toggle
            const visaToggle = page.locator('#requiresVisa');
            await visaToggle.evaluate(el => el.style.display = 'block');
            // Check current state and toggle if needed
            const currentVisaState = await visaToggle.evaluate(el => el.classList.contains('active'));
            if (profile.requiresVisaSponsorship !== currentVisaState) {
                await human_1.HumanBehavior.hoverThenClick(page, '#requiresVisa');
                await page.waitForTimeout(300);
            }
            await this.waitForInlineValidation(page);
            await human_1.HumanBehavior.naturalPause();
            await this.screenshots.afterAction(page, 'questions');
            // Force progression to salary section if stuck
            await page.evaluate(() => {
                // Find and click the salary accordion header to force progression
                const salarySection = document.querySelector('[data-section="salary"]');
                const salaryHeader = salarySection?.querySelector('.accordion-header');
                if (salaryHeader) {
                    console.log('Forcing progression to salary section');
                    salaryHeader.click();
                }
            });
            await page.waitForTimeout(500); // Wait for transition
            this.performance.endTimer('questions_section');
            this.logger.success('Questions section completed', 'GLOBEX_HANDLER');
        }
        catch (error) {
            this.performance.endTimer('questions_section');
            throw error;
        }
    }
    async handleSalarySection(page, profile) {
        this.addStep('Salary');
        this.performance.startTimer('salary_section');
        try {
            this.logger.step('Setting salary expectations');
            await this.screenshots.beforeAction(page, 'salary');
            await this.scrollToSection(page, 'salary, .section-salary, [data-section="salary"]');
            // Completely disable accordion functionality and show all content
            await page.addStyleTag({
                content: `
          /* Disable all accordion functionality */
          .accordion-content {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            max-height: none !important;
            min-height: auto !important;
            overflow: visible !important;
            position: relative !important;
            z-index: 1 !important;
            background: white !important;
            border: 1px solid #e2e8f0 !important;
            padding: 20px !important;
            margin-bottom: 20px !important;
          }
          
          /* Hide accordion icons since they're not needed */
          .accordion-icon {
            display: none !important;
          }
          
          /* Make all accordion headers look like regular headers */
          .accordion-header {
            background: #f7fafc !important;
            border-bottom: 2px solid #4299e1 !important;
            cursor: default !important;
            margin-bottom: 10px !important;
          }
          
          /* Special styling for salary section */
          [data-section="salary"] .accordion-content {
            background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%) !important;
            border: 3px solid #48bb78 !important;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1) !important;
            padding: 30px !important;
            min-height: 250px !important;
          }
          
          [data-section="salary"] .slider-container {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            height: auto !important;
            min-height: 120px !important;
            background: white !important;
            padding: 25px !important;
            border-radius: 12px !important;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
            border: 2px solid #4299e1 !important;
          }
          
          [data-section="salary"] #salarySlider {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            height: 50px !important;
            width: 100% !important;
            background: linear-gradient(90deg, #4299e1 0%, #48bb78 100%) !important;
            border-radius: 25px !important;
            border: 3px solid #2b6cb0 !important;
            cursor: pointer !important;
          }
          
          [data-section="salary"] #salary-value {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            font-size: 24px !important;
            font-weight: bold !important;
            color: #2d3748 !important;
            margin-top: 20px !important;
            text-align: center !important;
            background: #edf2f7 !important;
            padding: 10px !important;
            border-radius: 8px !important;
          }
          
          [data-section="salary"] .slider-label {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            font-size: 18px !important;
            font-weight: bold !important;
            margin-bottom: 20px !important;
            color: #2d3748 !important;
          }
        `
            });
            // Force all accordion sections to be expanded
            await page.evaluate(() => {
                const allSections = document.querySelectorAll('.accordion-section');
                allSections.forEach(section => {
                    section.classList.add('expanded');
                });
            });
            // Wait for styles to apply
            await page.waitForTimeout(2000);
            // Scroll to the very bottom to ensure salary section is visible
            await page.evaluate(() => {
                // Scroll to bottom of page first
                window.scrollTo(0, document.body.scrollHeight);
                // Then scroll back up a bit to center the salary section
                setTimeout(() => {
                    const salarySection = document.querySelector('[data-section="salary"]');
                    if (salarySection) {
                        salarySection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }, 500);
                // Final adjustment to ensure we see the full content
                setTimeout(() => {
                    window.scrollBy(0, 100);
                }, 1500);
            });
            // Wait for scrolling to complete
            await page.waitForTimeout(2000);
            // Handle salary slider with visible movement
            if (profile.salaryExpectation) {
                // Make salary slider and value visible
                await page.evaluate(() => {
                    const sliderContainer = document.querySelector('.slider-container');
                    const salarySlider = document.getElementById('salarySlider');
                    const salaryValue = document.getElementById('salary-value');
                    if (sliderContainer) {
                        sliderContainer.style.display = 'block';
                        sliderContainer.style.visibility = 'visible';
                    }
                    if (salarySlider) {
                        salarySlider.style.display = 'block';
                        salarySlider.style.visibility = 'visible';
                    }
                    if (salaryValue) {
                        salaryValue.style.display = 'block';
                        salaryValue.style.visibility = 'visible';
                    }
                });
                // Calculate percentage based on salary range (assuming 50k-200k range)
                const salaryRange = 150000; // 200k - 50k
                const minSalary = 50000;
                const targetSalary = profile.salaryExpectation.min;
                const percentage = ((targetSalary - minSalary) / salaryRange) * 100;
                // Set slider value with visible movement
                const salarySlider = page.locator('#salarySlider');
                await salarySlider.evaluate((el, value) => {
                    const slider = el;
                    slider.value = value.toString();
                    slider.dispatchEvent(new Event('input', { bubbles: true }));
                    slider.dispatchEvent(new Event('change', { bubbles: true }));
                }, targetSalary);
                // Wait to see the slider value update
                await page.waitForTimeout(1000);
            }
            await this.waitForInlineValidation(page);
            await human_1.HumanBehavior.naturalPause();
            await this.screenshots.afterAction(page, 'salary');
            this.performance.endTimer('salary_section');
            this.logger.success('Salary section completed', 'GLOBEX_HANDLER');
        }
        catch (error) {
            this.performance.endTimer('salary_section');
            throw error;
        }
    }
    async handleResumeUploadSection(page, profile) {
        this.addStep('Resume Upload');
        this.performance.startTimer('resume_upload_section');
        try {
            this.logger.step('Uploading resume');
            await this.screenshots.beforeAction(page, 'resume_upload');
            await this.scrollToSection(page, 'resume, .section-resume, [data-section="resume"]');
            // Ensure resume accordion is fully expanded and visible
            const resumeSection = page.locator('[data-section="resume"]');
            const resumeHeader = resumeSection.locator('.accordion-header');
            const resumeContent = resumeSection.locator('.accordion-content');
            // Click to expand if not already expanded
            const isExpanded = await resumeSection.evaluate(el => el.classList.contains('expanded'));
            if (!isExpanded) {
                await resumeHeader.click();
                await page.waitForTimeout(500); // Wait for animation
            }
            // Make content visible
            await resumeContent.evaluate(el => {
                el.style.display = 'block';
                el.style.visibility = 'visible';
                el.style.opacity = '1';
            });
            // Make file input visible and upload
            const fileInput = page.locator('input[type="file"]');
            await fileInput.evaluate(el => el.style.display = 'block');
            await fileInput.evaluate(el => el.style.visibility = 'visible');
            await form_1.FormHelpers.uploadFile(page, 'input[type="file"]', profile.resumePath);
            await this.waitForInlineValidation(page);
            await human_1.HumanBehavior.naturalPause();
            await this.screenshots.afterAction(page, 'resume_upload');
            // Force progression to submit section and scroll down
            await page.evaluate(() => {
                // Scroll to bottom of page to find submit button
                window.scrollTo(0, document.body.scrollHeight);
                // Look for submit button using simple text content check
                const allButtons = document.querySelectorAll('button');
                allButtons.forEach(button => {
                    const text = button.textContent?.toLowerCase() || '';
                    if (text.includes('submit')) {
                        button.style.display = 'block';
                        button.style.visibility = 'visible';
                        button.style.opacity = '1';
                        button.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                });
                // Final scroll adjustment to ensure submit button is visible
                setTimeout(() => {
                    window.scrollBy(0, 100);
                }, 500);
            });
            await page.waitForTimeout(1000);
            this.performance.endTimer('resume_upload_section');
            this.logger.success('Resume upload section completed', 'GLOBEX_HANDLER');
        }
        catch (error) {
            this.performance.endTimer('resume_upload_section');
            throw error;
        }
    }
    async handleSubmitSection(page) {
        this.addStep('Submit');
        this.performance.startTimer('submit_section');
        try {
            this.logger.step('Submitting application');
            await this.screenshots.beforeSubmission(page);
            // Aggressive scrolling to find submit button
            await page.evaluate(() => {
                // Scroll to very bottom of page
                window.scrollTo(0, document.body.scrollHeight);
                // Make all buttons visible and find submit button
                const allButtons = document.querySelectorAll('button');
                allButtons.forEach(button => {
                    const text = button.textContent?.toLowerCase() || '';
                    if (text.includes('submit')) {
                        button.style.display = 'block';
                        button.style.visibility = 'visible';
                        button.style.opacity = '1';
                        button.style.position = 'relative';
                        button.style.zIndex = '1000';
                        button.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                });
                // Additional scroll to ensure submit button is visible
                setTimeout(() => {
                    window.scrollBy(0, 200);
                }, 500);
                // Final scroll adjustment
                setTimeout(() => {
                    window.scrollTo(0, document.body.scrollHeight);
                }, 1000);
            });
            // Wait for scrolling and button to be visible
            await page.waitForTimeout(2000);
            // Find and click submit button using multiple approaches
            try {
                await page.locator('button:has-text("Submit Application")').waitFor({ state: 'visible', timeout: 5000 });
                await retry_1.RetryOperation.submit(async () => {
                    await human_1.HumanBehavior.hoverThenClick(page, 'button:has-text("Submit Application")');
                }, 'GLOBEX Application');
            }
            catch (error) {
                // Try alternative approaches
                try {
                    await page.locator('button[type="submit"]').waitFor({ state: 'visible', timeout: 3000 });
                    await retry_1.RetryOperation.submit(async () => {
                        await human_1.HumanBehavior.hoverThenClick(page, 'button[type="submit"]');
                    }, 'GLOBEX Application');
                }
                catch (error2) {
                    // Final fallback - click any button with "submit" text
                    await page.evaluate(() => {
                        const buttons = document.querySelectorAll('button');
                        buttons.forEach(button => {
                            const text = button.textContent?.toLowerCase() || '';
                            if (text.includes('submit')) {
                                button.click();
                            }
                        });
                    });
                }
            }
            // Wait for submission to complete
            await page.waitForLoadState('networkidle', { timeout: 15000 });
            this.performance.endTimer('submit_section');
            this.logger.success('Application submitted', 'GLOBEX_HANDLER');
        }
        catch (error) {
            this.performance.endTimer('submit_section');
            throw error;
        }
    }
    async extractConfirmationNumber(page) {
        this.addStep('Confirmation Extraction');
        this.performance.startTimer('confirmation_extraction');
        try {
            await this.scrollToSection(page, '.confirmation, .success-message, .application-complete');
            // Try different selectors for confirmation reference
            const confirmationSelectors = [
                '.reference-number',
                '.confirmation-reference',
                '.ref-number',
                '[data-reference]',
                '.application-reference',
                '.success-message:has-text("Reference")',
                '.success-message:has-text("Confirmation")'
            ];
            let confirmationNumber = '';
            for (const selector of confirmationSelectors) {
                try {
                    const element = page.locator(selector);
                    if (await element.isVisible()) {
                        const text = await element.textContent();
                        if (text) {
                            confirmationNumber = text;
                            break;
                        }
                    }
                }
                catch {
                    continue;
                }
            }
            // Fallback: look for any reference-like pattern in the page
            if (!confirmationNumber) {
                const pageContent = await page.content();
                const match = pageContent.match(/(?:reference|confirmation)[\s:]*([A-Z0-9]{6,})/i);
                if (match) {
                    confirmationNumber = match[1];
                }
            }
            this.performance.endTimer('confirmation_extraction');
            if (confirmationNumber) {
                this.logger.success(`Reference number extracted: ${confirmationNumber}`, 'GLOBEX_HANDLER');
            }
            else {
                this.logger.warning('Could not extract reference number', 'GLOBEX_HANDLER');
                confirmationNumber = 'UNKNOWN';
            }
            return confirmationNumber;
        }
        catch (error) {
            this.performance.endTimer('confirmation_extraction');
            throw error;
        }
    }
    addStep(step) {
        this.performance.addStep(step);
    }
    async startTimer() {
        await this.performance.startTimer('application');
    }
    async endTimer() {
        await this.performance.endTimer('application');
    }
    async scrollToSection(page, sectionSelector) {
        const section = page.locator(sectionSelector);
        await section.scrollIntoViewIfNeeded();
        await human_1.HumanBehavior.randomDelay(500, 1000);
    }
    async waitForInlineValidation(page) {
        await page.waitForTimeout(1000);
        const validationErrors = page.locator('.error, .validation-error, [data-error]');
        const errorCount = await validationErrors.count();
        if (errorCount > 0) {
            this.logger.warning(`Found ${errorCount} validation errors`, 'GLOBEX_HANDLER');
        }
    }
}
exports.GlobexHandler = GlobexHandler;
//# sourceMappingURL=globex_backup.js.map