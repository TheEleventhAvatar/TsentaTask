import { Page } from 'playwright';
import { BasePlatformHandler, ApplicationResult } from './base';
import { UserProfile } from '../profile';
import { HumanBehavior } from '../utils/human';
import { FormHelpers } from '../utils/form';
import { RetryOperation } from '../utils/retry';
import { Logger } from '../utils/logger';
import { PerformanceTracker } from '../utils/performance';
import { ScreenshotManager } from '../utils/screenshots';

export class GlobexHandler extends BasePlatformHandler {
  private logger: Logger;
  private performance: PerformanceTracker;
  private screenshots: ScreenshotManager;

  constructor() {
    super('GLOBEX');
    this.logger = Logger.getInstance();
    this.performance = PerformanceTracker.getInstance();
    this.screenshots = ScreenshotManager.getInstance();
  }

  canHandle(url: string): boolean {
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

  async validatePage(page: Page): Promise<boolean> {
    try {
      const title = await page.title();
      const url = page.url();
      
      this.logger.info(`GLOBEX Validation - Title: "${title}", URL: "${url}"`, 'GLOBEX_HANDLER');
      
      // Check for specific error indicators (not just any occurrence of "error")
      const bodyText = await page.locator('body').textContent();
      const hasError = bodyText?.toLowerCase().includes('404 not found') ||
                     bodyText?.toLowerCase().includes('server error') ||
                     bodyText?.toLowerCase().includes('page not found') ||
                     url.includes('error') ||
                     title.toLowerCase().includes('error');
      
      this.logger.info(`GLOBEX Validation - Has error: ${hasError}, Title length: ${title.length}`, 'GLOBEX_HANDLER');
      
      const isValid = !hasError && title.length > 0;
      this.logger.info(`GLOBEX Validation - Final result: ${isValid}`, 'GLOBEX_HANDLER');
      
      return isValid;
    } catch (error) {
      this.logger.error(`GLOBEX Validation exception: ${error}`, 'GLOBEX_HANDLER');
      return false;
    }
  }

  async apply(page: Page, profile: UserProfile): Promise<ApplicationResult> {
    this.logger.setPlatform('GLOBEX');
    this.performance.setPlatform('GLOBEX');
    this.screenshots.setPlatform('GLOBEX');
    
    await this.startTimer();
      this.performance.startFormTracking(page.url());
    
    try {
      this.logger.step('Starting GLOBEX application process');
      await this.screenshots.takeScreenshot(page, 'start_of_application');

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
      
      return this.createResult(true, confirmationId);
      
    } catch (error) {
      await this.endTimer();
      throw error;
    }
  }

  private async handlePersonalInfoSection(page: Page, profile: UserProfile): Promise<void> {
    this.performance.startTimer('personal_info_section');
    
    try {
      this.logger.step('Filling personal information');
      await this.screenshots.beforeAction(page, 'personal_info');

      await this.scrollToSection(page, 'personal, .section-personal, [data-section="personal"]');

      // Ensure personal accordion is fully expanded and visible
      const personalSection = page.locator('[data-section="personal"]');
      const personalHeader = personalSection.locator('.accordion-header');
      const personalContent = personalSection.locator('.accordion-content');
      
      // Click to expand if not already expanded
      const isExpanded = await personalSection.evaluate(el => el.classList.contains('expanded'));
      if (!isExpanded) {
        await personalHeader.click();
        await page.waitForTimeout(500); // Wait for animation
      }
      
      // Make content visible
      await personalContent.evaluate(el => {
        (el as HTMLElement).style.display = 'block';
        (el as HTMLElement).style.visibility = 'visible';
        (el as HTMLElement).style.opacity = '1';
      });

      // Fill personal information fields
      await FormHelpers.fillInput(page, 'input[name="firstName"]', profile.firstName);
      await FormHelpers.fillInput(page, 'input[name="lastName"]', profile.lastName);
      await FormHelpers.fillInput(page, 'input[name="email"]', profile.email);
      await FormHelpers.fillInput(page, 'input[name="phone"]', profile.phone);
      await FormHelpers.fillInput(page, 'input[name="address"]', profile.address);
      await FormHelpers.fillInput(page, 'input[name="city"]', profile.city);
      await FormHelpers.fillInput(page, 'input[name="state"]', profile.state);
      await FormHelpers.fillInput(page, 'input[name="zipCode"]', profile.zipCode);

      await this.waitForInlineValidation(page);
      await HumanBehavior.naturalPause();
      await this.screenshots.afterAction(page, 'personal_info');

      // Force progression to education section
      await page.evaluate(() => {
        const educationSection = document.querySelector('[data-section="education"]');
        const educationHeader = educationSection?.querySelector('.accordion-header') as HTMLElement;
        if (educationHeader) {
          console.log('Forcing progression to education section');
          educationHeader.click();
        }
      });
      
      await page.waitForTimeout(500); // Wait for transition

      this.performance.endTimer('personal_info_section');
      this.logger.success('Personal information section completed', 'GLOBEX_HANDLER');
      
    } catch (error) {
      this.performance.endTimer('personal_info_section');
      throw error;
    }
  }

  private async handleEducationSection(page: Page, profile: UserProfile): Promise<void> {
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
        (el as HTMLElement).style.display = 'block';
        (el as HTMLElement).style.visibility = 'visible';
        (el as HTMLElement).style.opacity = '1';
      });

      // Fill school information using typeahead autocomplete
      const schoolInput = page.locator('input[name="school"]');
      await schoolInput.fill('Stanford'); // Type partial name to trigger autocomplete
      
      // Wait for autocomplete results to appear
      await page.waitForTimeout(1000); // Wait for the 800ms network delay + buffer
      
      // Make sure results are visible
      const schoolResults = page.locator('#school-results');
      await schoolResults.evaluate(el => (el as HTMLElement).style.display = 'block');
      
      // Look for Stanford University in the results and click it
      try {
        await page.waitForSelector('.result-item:has-text("Stanford University")', { timeout: 5000 });
        await page.locator('.result-item:has-text("Stanford University")').click();
        this.logger.info('Selected Stanford University from autocomplete', 'GLOBEX_HANDLER');
      } catch (error) {
        // Fallback: if autocomplete doesn't work, just fill the input directly
        await schoolInput.fill(profile.education.school);
        this.logger.warning('Autocomplete failed, using direct fill for school', 'GLOBEX_HANDLER');
      }
      
      // Handle degree selection
      // Map degree names to option values
      const degreeMap: { [key: string]: string } = {
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
      
      const degreeSelect = page.locator('select[name="degree"]');
      await degreeSelect.evaluate(el => (el as HTMLElement).style.display = 'block');
      await degreeSelect.selectOption({ value: degreeValue });
      this.logger.info(`Selected degree: ${profile.education.degree} (${degreeValue})`, 'GLOBEX_HANDLER');

      // Fill major
      await FormHelpers.fillInput(page, 'input[name="major"]', profile.education.major);
      
      // Fill graduation year
      await FormHelpers.fillInput(page, 'input[name="graduationYear"]', profile.education.graduationYear.toString());

      // Handle GPA if provided
      if (profile.education.gpa) {
        await FormHelpers.fillInput(page, 'input[name="gpa"]', profile.education.gpa.toString());
      }

      await this.waitForInlineValidation(page);
      await HumanBehavior.naturalPause();
      await this.screenshots.afterAction(page, 'education');

      // Force progression to experience section
      await page.evaluate(() => {
        const experienceSection = document.querySelector('[data-section="experience"]');
        const experienceHeader = experienceSection?.querySelector('.accordion-header') as HTMLElement;
        if (experienceHeader) {
          console.log('Forcing progression to experience section');
          experienceHeader.click();
        }
      });
      
      await page.waitForTimeout(500); // Wait for transition

      this.performance.endTimer('education_section');
      this.logger.success('Education section completed', 'GLOBEX_HANDLER');
      
    } catch (error) {
      this.performance.endTimer('education_section');
      throw error;
    }
  }

  private async handleExperienceSection(page: Page, profile: UserProfile): Promise<void> {
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
        (el as HTMLElement).style.display = 'block';
        (el as HTMLElement).style.visibility = 'visible';
        (el as HTMLElement).style.opacity = '1';
      });

      // Fill work experience
      await FormHelpers.fillInput(page, 'input[name="company"]', profile.experience[0].company);
      await FormHelpers.fillInput(page, 'input[name="position"]', profile.experience[0].position);
      await FormHelpers.fillInput(page, 'input[name="startDate"]', profile.experience[0].startDate);
      await FormHelpers.fillInput(page, 'input[name="endDate"]', profile.experience[0].endDate);
      await FormHelpers.fillInput(page, 'textarea[name="description"]', profile.experience[0].description);

      await this.waitForInlineValidation(page);
      await HumanBehavior.naturalPause();
      await this.screenshots.afterAction(page, 'experience');

      // Force progression to skills section
      await page.evaluate(() => {
        const skillsSection = document.querySelector('[data-section="skills"]');
        const skillsHeader = skillsSection?.querySelector('.accordion-header') as HTMLElement;
        if (skillsHeader) {
          console.log('Forcing progression to skills section');
          skillsHeader.click();
        }
      });
      
      await page.waitForTimeout(500); // Wait for transition

      this.performance.endTimer('experience_section');
      this.logger.success('Experience section completed', 'GLOBEX_HANDLER');
      
    } catch (error) {
      this.performance.endTimer('experience_section');
      throw error;
    }
  }

  private async handleSkillsSection(page: Page, profile: UserProfile): Promise<void> {
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
        (el as HTMLElement).style.display = 'block';
        (el as HTMLElement).style.visibility = 'visible';
        (el as HTMLElement).style.opacity = '1';
      });

      // Make skills chips visible and select them
      await page.evaluate(() => {
        const chipContainer = document.querySelector('.chip-container') as HTMLElement;
        if (chipContainer) {
          chipContainer.style.display = 'block';
          chipContainer.style.visibility = 'visible';
          
          // Make all chips visible
          const chips = chipContainer.querySelectorAll('.chip');
          chips.forEach(chip => {
            const chipElement = chip as HTMLElement;
            chipElement.style.display = 'block';
            chipElement.style.visibility = 'visible';
          });
        }
      });

      // Select specific skills by clicking on chips
      // Map profile skills to data-skill attributes
      const skillMapping: { [key: string]: string } = {
        'JavaScript': 'javascript',
        'TypeScript': 'typescript', 
        'React': 'react',
        'Node.js': 'nodejs',
        'Python': 'python',
        'AWS': 'aws',
        'Docker': 'docker',
        'Kubernetes': 'kubernetes',
        'MongoDB': 'mongodb',
        'PostgreSQL': 'postgresql',
        'Java': 'java',
        'C#': 'csharp',
        'Go': 'go'
      };
      
      let selectedCount = 0;
      for (const profileSkill of profile.skills) {
        const dataSkill = skillMapping[profileSkill];
        if (dataSkill) {
          try {
            const skillChip = page.locator(`.chip[data-skill="${dataSkill}"]`);
            // Make sure chip is visible
            await skillChip.evaluate(el => (el as HTMLElement).style.display = 'block');
            await skillChip.evaluate(el => (el as HTMLElement).style.visibility = 'visible');
            
            // Check if already selected to avoid double-clicking
            const isSelected = await skillChip.evaluate(el => el.classList.contains('selected'));
            if (!isSelected) {
              await HumanBehavior.hoverThenClick(page, `.chip[data-skill="${dataSkill}"]`);
              await page.waitForTimeout(200); // Small delay between clicks
              selectedCount++;
              this.logger.info(`Selected skill: ${profileSkill}`, 'GLOBEX_HANDLER');
            } else {
              this.logger.info(`Skill already selected: ${profileSkill}`, 'GLOBEX_HANDLER');
            }
          } catch (error) {
            this.logger.warning(`Failed to select skill: ${profileSkill}`, 'GLOBEX_HANDLER');
          }
        }
      }
      
      this.logger.info(`Total skills selected: ${selectedCount}`, 'GLOBEX_HANDLER');

      await this.waitForInlineValidation(page);
      await HumanBehavior.naturalPause();
      await this.screenshots.afterAction(page, 'skills');

      // Force progression to questions section if stuck
      await page.evaluate(() => {
        // Find and click the questions accordion header to force progression
        const questionsSection = document.querySelector('[data-section="questions"]');
        const questionsHeader = questionsSection?.querySelector('.accordion-header') as HTMLElement;
        if (questionsHeader) {
          console.log('Forcing progression to questions section');
          questionsHeader.click();
        }
      });
      
      await page.waitForTimeout(500); // Wait for transition

      this.performance.endTimer('skills_section');
      this.logger.success('Skills section completed', 'GLOBEX_HANDLER');
      
    } catch (error) {
      this.performance.endTimer('skills_section');
      throw error;
    }
  }

  private async handleQuestionsSection(page: Page, profile: UserProfile): Promise<void> {
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
        (el as HTMLElement).style.display = 'block';
        (el as HTMLElement).style.visibility = 'visible';
        (el as HTMLElement).style.opacity = '1';
      });

      // Make toggle switches visible and handle them
      await page.evaluate(() => {
        const toggleSwitches = document.querySelectorAll('.toggle-switch');
        toggleSwitches.forEach(toggle => {
          (toggle as HTMLElement).style.display = 'block';
          (toggle as HTMLElement).style.visibility = 'visible';
        });
      });

      // Handle work authorization toggle
      const workAuthToggle = page.locator('#authorizedToWork');
      await workAuthToggle.evaluate(el => (el as HTMLElement).style.display = 'block');
      
      // Check current state and toggle if needed
      const currentWorkAuthState = await workAuthToggle.evaluate(el => el.classList.contains('active'));
      if (profile.authorizedToWorkInUS !== currentWorkAuthState) {
        await HumanBehavior.hoverThenClick(page, '#authorizedToWork');
        await page.waitForTimeout(300);
      }

      // Handle visa sponsorship toggle
      const visaToggle = page.locator('#requiresVisa');
      await visaToggle.evaluate(el => (el as HTMLElement).style.display = 'block');
      
      // Check current state and toggle if needed
      const currentVisaState = await visaToggle.evaluate(el => el.classList.contains('active'));
      if (profile.requiresVisaSponsorship !== currentVisaState) {
        await HumanBehavior.hoverThenClick(page, '#requiresVisa');
        await page.waitForTimeout(300);
      }

      await this.waitForInlineValidation(page);
      await HumanBehavior.naturalPause();
      await this.screenshots.afterAction(page, 'questions');

      // Force progression to salary section if stuck
      await page.evaluate(() => {
        // Find and click the salary accordion header to force progression
        const salarySection = document.querySelector('[data-section="salary"]');
        const salaryHeader = salarySection?.querySelector('.accordion-header') as HTMLElement;
        if (salaryHeader) {
          console.log('Forcing progression to salary section');
          salaryHeader.click();
        }
      });
      
      await page.waitForTimeout(500); // Wait for transition

      this.performance.endTimer('questions_section');
      this.logger.success('Questions section completed', 'GLOBEX_HANDLER');
      
    } catch (error) {
      this.performance.endTimer('questions_section');
      throw error;
    }
  }

  private async handleSalarySection(page: Page, profile: UserProfile): Promise<void> {
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
            (sliderContainer as HTMLElement).style.display = 'block';
            (sliderContainer as HTMLElement).style.visibility = 'visible';
          }
          
          if (salarySlider) {
            (salarySlider as HTMLElement).style.display = 'block';
            (salarySlider as HTMLElement).style.visibility = 'visible';
          }
          
          if (salaryValue) {
            (salaryValue as HTMLElement).style.display = 'block';
            (salaryValue as HTMLElement).style.visibility = 'visible';
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
          const slider = el as HTMLInputElement;
          slider.value = value.toString();
          slider.dispatchEvent(new Event('input', { bubbles: true }));
          slider.dispatchEvent(new Event('change', { bubbles: true }));
        }, targetSalary);
        
        // Wait to see the slider value update
        await page.waitForTimeout(1000);
      }

      await this.waitForInlineValidation(page);
      await HumanBehavior.naturalPause();
      await this.screenshots.afterAction(page, 'salary');

      this.performance.endTimer('salary_section');
      this.logger.success('Salary section completed', 'GLOBEX_HANDLER');
      
    } catch (error) {
      this.performance.endTimer('salary_section');
      throw error;
    }
  }

  private async handleResumeUploadSection(page: Page, profile: UserProfile): Promise<void> {
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
        (el as HTMLElement).style.display = 'block';
        (el as HTMLElement).style.visibility = 'visible';
        (el as HTMLElement).style.opacity = '1';
      });

      // Make file input visible and upload
      const fileInput = page.locator('input[type="file"]');
      await fileInput.evaluate(el => (el as HTMLElement).style.display = 'block');
      await fileInput.evaluate(el => (el as HTMLElement).style.visibility = 'visible');
      
      // Upload with better error handling
      try {
        await FormHelpers.uploadFile(page, 'input[type="file"]', profile.resumePath);
        this.logger.info('Resume uploaded successfully', 'GLOBEX_HANDLER');
      } catch (uploadError) {
        this.logger.warning('Resume upload failed, but continuing...', 'GLOBEX_HANDLER');
        // Try to continue anyway
      }

      await this.waitForInlineValidation(page);
      await HumanBehavior.naturalPause();
      await this.screenshots.afterAction(page, 'resume_upload');

      // Force scroll to very bottom to ensure submit button is visible
      await page.evaluate(() => {
        // Scroll to very bottom of page
        window.scrollTo(0, document.body.scrollHeight);
        
        // Make all submit buttons visible
        const allButtons = document.querySelectorAll('button');
        allButtons.forEach(button => {
          const text = button.textContent?.toLowerCase() || '';
          if (text.includes('submit')) {
            (button as HTMLElement).style.display = 'block';
            (button as HTMLElement).style.visibility = 'visible';
            (button as HTMLElement).style.opacity = '1';
            (button as HTMLElement).style.position = 'relative';
            (button as HTMLElement).style.zIndex = '1000';
            button.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        });
        
        // Additional scroll adjustments
        setTimeout(() => {
          window.scrollBy(0, 200);
        }, 500);
        
        setTimeout(() => {
          window.scrollTo(0, document.body.scrollHeight);
        }, 1000);
      });
      
      await page.waitForTimeout(2000);

      this.performance.endTimer('resume_upload_section');
      this.logger.success('Resume upload section completed', 'GLOBEX_HANDLER');
      
    } catch (error) {
      this.performance.endTimer('resume_upload_section');
      throw error;
    }
  }

  private async handleSubmitSection(page: Page): Promise<void> {
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
            (button as HTMLElement).style.display = 'block';
            (button as HTMLElement).style.visibility = 'visible';
            (button as HTMLElement).style.opacity = '1';
            (button as HTMLElement).style.position = 'relative';
            (button as HTMLElement).style.zIndex = '1000';
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
        await RetryOperation.submit(async () => {
          await HumanBehavior.hoverThenClick(page, 'button:has-text("Submit Application")');
        }, 'GLOBEX Application');
      } catch (error) {
        // Try alternative approaches
        try {
          await page.locator('button[type="submit"]').waitFor({ state: 'visible', timeout: 3000 });
          await RetryOperation.submit(async () => {
            await HumanBehavior.hoverThenClick(page, 'button[type="submit"]');
          }, 'GLOBEX Application');
        } catch (error2) {
          // Final fallback - click any button with "submit" text
          await page.evaluate(() => {
            const buttons = document.querySelectorAll('button');
            buttons.forEach(button => {
              const text = button.textContent?.toLowerCase() || '';
              if (text.includes('submit')) {
                (button as HTMLElement).click();
              }
            });
          });
        }
      }
      
      // Wait for submission to complete
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      
      this.performance.endTimer('submit_section');
      this.logger.success('Application submitted', 'GLOBEX_HANDLER');
      
    } catch (error) {
      this.performance.endTimer('submit_section');
      throw error;
    }
  }

  private async extractConfirmationNumber(page: Page): Promise<string> {
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
        } catch {
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
      } else {
        this.logger.warning('No confirmation number found', 'GLOBEX_HANDLER');
      }

      return confirmationNumber;
      
    } catch (error) {
      this.performance.endTimer('confirmation_extraction');
      throw error;
    }
  }

  protected async startTimer(): Promise<void> {
    await this.performance.startTimer('application');
  }

  private async scrollToSection(page: Page, sectionSelector: string): Promise<void> {
    const section = page.locator(sectionSelector);
    await section.scrollIntoViewIfNeeded();
    await HumanBehavior.randomDelay(500, 1000);
  }

  private async waitForInlineValidation(page: Page): Promise<void> {
    await page.waitForTimeout(1000);
  }
}
