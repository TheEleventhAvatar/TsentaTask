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
  
  // Education
  education: {
    school: string;
    degree: string;
    major: string;
    graduationYear: number;
    gpa?: number;
  };
  
  // Experience
  experience: {
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    description: string;
  }[];
  
  // Skills
  skills: string[];
  
  // Additional info
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  
  // Questions
  requiresVisaSponsorship: boolean;
  authorizedToWorkInUS: boolean;
  salaryExpectation?: {
    min: number;
    max: number;
  };
  
  // Resume file path
  resumePath: string;
}

export const candidateProfile: UserProfile = {
  firstName: "John",
  lastName: "Doe",
  email: "john.doe@example.com",
  phone: "+1-555-0123-4567",
  address: "123 Main Street",
  city: "San Francisco",
  state: "CA",
  zipCode: "94105",
  country: "United States",
  
  education: {
    school: "Stanford University",
    degree: "Bachelor of Science",
    major: "Computer Science",
    graduationYear: 2020,
    gpa: 3.8
  },
  
  experience: [
    {
      company: "Tech Corp",
      position: "Senior Software Engineer",
      startDate: "2022-01-01",
      endDate: "2024-01-01",
      description: "Led development of cloud-native microservices architecture"
    },
    {
      company: "StartupXYZ",
      position: "Software Engineer",
      startDate: "2020-06-01",
      endDate: "2021-12-31",
      description: "Built full-stack web applications using React and Node.js"
    }
  ],
  
  skills: [
    "JavaScript",
    "TypeScript",
    "React",
    "Node.js",
    "Python",
    "AWS",
    "Docker",
    "Kubernetes",
    "MongoDB",
    "PostgreSQL"
  ],
  
  linkedinUrl: "https://linkedin.com/in/johndoe",
  githubUrl: "https://github.com/johndoe",
  portfolioUrl: "https://johndoe.dev",
  
  requiresVisaSponsorship: false,
  authorizedToWorkInUS: true,
  salaryExpectation: {
    min: 120000,
    max: 180000
  },
  
  resumePath: "./fixtures/sample-resume.pdf"
};
