import { Page } from 'playwright';
import { BasePlatformHandler, ApplicationResult } from './base';
import { UserProfile } from '../profile';
export declare class AcmeHandler extends BasePlatformHandler {
    private logger;
    private performance;
    private screenshots;
    constructor();
    canHandle(url: string): boolean;
    apply(page: Page, profile: UserProfile): Promise<ApplicationResult>;
    private handlePersonalInfoStep;
    private handleEducationStep;
    private handleExperienceAndSkillsStep;
    private handleResumeUploadStep;
    private handleReviewStep;
    private handleSubmitStep;
    private extractConfirmationId;
    private clickNextButton;
}
//# sourceMappingURL=acme.d.ts.map