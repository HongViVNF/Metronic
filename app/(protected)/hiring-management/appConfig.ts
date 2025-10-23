import { Book, Users } from 'lucide-react';

const hiringManagementConfig = {
  name: "Hiring Management",
  appId: "hiring-management",
  appInstanceId: "",
  description: "Comprehensive hiring and recruitment management system",
  icon_url: "",
  subscriptions: [],
  permissions: {
    admin: [],
    hr: [],
    recruiter: [],
    interviewer: [],
  },
  userPermissions: {},
  team: null,
  
  // Menu configuration
  menu: {
    title: "Hiring Management",
    icon: Book,
    children: [
      { title: 'Candidates', path: '/hiring-management/candidate' },
      { title: 'Hiring Process', path: '/hiring-management/hiring' },
      { title: 'Job Management', path: '/hiring-management/job' },
      { title: 'Pipeline', path: '/hiring-management/pipeline' },
      { title: 'Interviews', path: '/hiring-management/interviews' },
      { title: 'Job Candidates', path: '/hiring-management/jobcandidates' },
      { title: 'Email Templates', path: '/hiring-management/templates' },
    ],
  },
  
  // API configuration
  api: {
    baseUrl: "/hiring-management/api",
    urls: {
      // Candidate endpoints
      candidatesList: "candidate",
      candidateById: "candidate",
      candidateBulkUpdate: "candidate/bulk-update",
      
      // Job endpoints
      jobsList: "job",
      jobById: "job",
      jobCandidates: "job/:id/candidate",
      jobPipeline: "job/:id/pipeline",
      jobStages: "job/:id/stages",
      
      // Pipeline endpoints
      hiringPipeline: "hiringpipeline",
      hiringPipelineFirstStage: "hiringpipeline/:id/first-stage",
      
      // Interview endpoints
      interviews: "interview",
      
      // Stage endpoints
      stages: "stages",
      stageCandidates: "stages/:id/candidates",
      
      // Email template endpoints
      emailTemplates: "emailtemplate",
      
      // Activity endpoints
      activities: "activities",
      activitiesCandidate: "activities-candidate",
      activitiesCandidateNote: "activities-candidate/note",
      activitiesCandidateResult: "activities-candidate/result",
      
      // Timeline endpoints
      timeline: "timeline",
      
      // Process endpoints
      process: "process",
      
      // Upload endpoints
      uploadCv: "upload-cv",
    },
  },
};

export const HiringManagementApp = hiringManagementConfig;
export default hiringManagementConfig;