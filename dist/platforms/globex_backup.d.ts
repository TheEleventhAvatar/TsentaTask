import { Page } from 'playwright';
import { BasePlatformHandler, ApplicationResult } from './base';
import { UserProfile } from '../profile';
export declare class GlobexHandler extends BasePlatformHandler {
    private logger;
    private performance;
    private screenshots;
    constructor();
    canHandle(url: string): boolean;
    validatePage(page: Page): Promise<boolean>;
    apply(page: Page, profile: UserProfile): Promise<ApplicationResult>;
    private handlePersonalInfoSection;
    private handleEducationSection;
    private handleExperienceSection;
    private handleSkillsSection;
    private handleQuestionsSection;
    private handleSalarySection;
    private handleResumeUploadSection;
    private handleSubmitSection;
    private extractConfirmationNumber;
    private addStep;
    private startTimer;
    private endTimer;
    private scrollToSection;
    private waitForInlineValidation;
}
//# sourceMappingURL=globex_backup.d.ts.map