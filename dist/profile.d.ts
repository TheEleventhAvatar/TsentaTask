export interface UserProfile {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    education: {
        school: string;
        degree: string;
        major: string;
        graduationYear: number;
        gpa?: number;
    };
    experience: {
        company: string;
        position: string;
        startDate: string;
        endDate: string;
        description: string;
    }[];
    skills: string[];
    linkedinUrl?: string;
    githubUrl?: string;
    portfolioUrl?: string;
    requiresVisaSponsorship: boolean;
    authorizedToWorkInUS: boolean;
    salaryExpectation?: {
        min: number;
        max: number;
    };
    resumePath: string;
}
export declare const candidateProfile: UserProfile;
//# sourceMappingURL=profile.d.ts.map