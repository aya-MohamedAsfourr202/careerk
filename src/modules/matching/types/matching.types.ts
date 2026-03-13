import { Prisma } from 'generated/prisma/client';

// ---------------- Notification Selects ----------------

export const directJobNotificationSelect = {
  select: {
    title: true,
    company: {
      select: {
        email: true,
        isActive: true,
        name: true,
      },
    },
  },
} satisfies Prisma.DirectJobDefaultArgs;

export type DirectJobNotification = Prisma.DirectJobGetPayload<typeof directJobNotificationSelect>;

export const scrapedJobNotificationSelect = {
  select: {
    jobSeekerId: true,
    matchScore: true,
    jobSeeker: {
      select: {
        email: true,
        firstName: true,
      },
    },
    scrapedJob: {
      select: {
        title: true,
        companyName: true,
        location: true,
      },
    },
  },
} satisfies Prisma.ScrapedJobMatchDefaultArgs;

export type ScrapedJobNotification = Prisma.ScrapedJobMatchGetPayload<
  typeof scrapedJobNotificationSelect
>;

// ---------------- Raw Prisma Result Types ----------------

export interface RawScrapedJobMatch {
  id: string;
  scrapedJobId: string;
  matchScore: unknown;
  createdAt: Date;
  scrapedJob: {
    id: string;
    title: string;
    companyName: string;
    location: string | null;
  };
}

export interface RawDirectJobMatchForJobSeeker {
  id: string;
  directJobId: string;
  matchScore: unknown;
  createdAt: Date;
  directJob: {
    id: string;
    title: string;
    location: string | null;
    company: { name: string };
  };
}

export interface RawDirectJobMatchForCompany {
  id: string;
  matchScore: unknown;
  createdAt: Date;
  jobSeeker: {
    id: string;
    firstName: string;
    lastName: string;
    profile: {
      title: string;
      availabilityStatus: string;
      location: string | null;
    } | null;
  };
}

// ---------------- Response Types ----------------

export interface MatchItem {
  id: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  location: string;
  matchScore: number;
  jobSource: 'DIRECT' | 'SCRAPED';
  createdAt: Date;
}

export interface CompanyMatchItem {
  id: string;
  jobSeekerId: string;
  jobSeekerName: string;
  jobSeekerTitle: string;
  availabilityStatus: string;
  location: string;
  matchScore: number;
  createdAt: Date;
}

// ---------------- Pagination ----------------

export interface PaginatedResult<T> {
  matches: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
