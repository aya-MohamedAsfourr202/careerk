export type DirectJobNotificationTarget = {
  companyEmail: string;
  companyName: string;
  jobTitle: string;
};

export type ScrapedJobMatchPreview = {
  title: string;
  companyName: string;
  location: string | null;
  matchScore: number;
};

export type ScrapedJobNotificationTarget = {
  email: string;
  firstName: string;
  totalMatches: number;
  topMatches: ScrapedJobMatchPreview[];
};

export abstract class MatchingRepository {
  // Notification targets
  abstract findDirectJobNotificationTarget(
    jobId: string,
  ): Promise<DirectJobNotificationTarget | null>;

  abstract findScrapedJobNotificationTargets(
    startedAt: Date,
    finishedAt: Date,
  ): Promise<ScrapedJobNotificationTarget[]>;

  // Job matches for job seekers
  abstract findDirectJobMatchesForJobSeeker(jobSeekerId: string): Promise<any[]>;

  abstract findScrapedJobMatchesForJobSeeker(jobSeekerId: string): Promise<any[]>;

  // Job matches for companies
  abstract findDirectJobMatchesForCompany(companyId: string, jobId: string): Promise<any[]>;
}
