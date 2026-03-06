import { Injectable, NotFoundException } from '@nestjs/common';
import { JobRepository } from './repository/job.repository';
import { JobQueryDto } from './dto/job-query.dto';
import { Job, JobFilters, DirectJob, ScrapedJob, PaginatedJobs } from './types/jobs.types';
import { BookmarkJobDto } from './dto/bookmark-job.dto';

@Injectable()
export class JobService {
  constructor(private readonly jobRepository: JobRepository) {}

  async findAll(query: JobQueryDto): Promise<PaginatedJobs> {
    const { source = 'all', page = 1, limit = 20 } = query;
    const filters: JobFilters = { ...query, page, limit };

    if (source === 'direct') {
      return this.jobRepository.findPublishedDirectJobs(filters);
    }
    if (source === 'scraped') {
      return this.jobRepository.findScrapedJobs(filters);
    }

    const fetchSize = page * limit;
    const start = (page - 1) * limit;
    const end = start + limit;

    const [directJobs, scrapedJobs] = await Promise.all([
      this.jobRepository.findPublishedDirectJobs({
        ...filters,
        page: 1,
        limit: fetchSize,
      }),
      this.jobRepository.findScrapedJobs({
        ...filters,
        page: 1,
        limit: fetchSize,
      }),
    ]);

    const total = directJobs.total + scrapedJobs.total;
    const mergedJobs: Job[] = [...directJobs.jobs, ...scrapedJobs.jobs]
      .sort((a, b) => {
        const dateA = a.postedAt?.getTime() ?? 0;
        const dateB = b.postedAt?.getTime() ?? 0;
        return dateB - dateA;
      })
      .slice(start, end);

    return {
      jobs: mergedJobs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findDirectJobById(jobId: string): Promise<DirectJob> {
    const job = await this.jobRepository.findDirectJobById(jobId);
    if (!job) {
      throw new NotFoundException('Job not found');
    }
    return job;
  }

  async findScrapedJobById(jobId: string): Promise<ScrapedJob> {
    const job = await this.jobRepository.findScrapedJobById(jobId);
    if (!job) {
      throw new NotFoundException('Scraped job not found');
    }
    return job;
  }

  async bookmarkJob(jobSeekerId: string, bookmarkJobDto: BookmarkJobDto) {
    const job =
      bookmarkJobDto.jobSource === 'DIRECT'
        ? await this.jobRepository.findDirectJobById(bookmarkJobDto.jobId)
        : await this.jobRepository.findScrapedJobById(bookmarkJobDto.jobId);

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    return this.jobRepository.createBookmark(jobSeekerId, bookmarkJobDto);
  }

  async removeBookmark(jobSeekerId: string, bookmarkId: string) {
    await this.jobRepository.deleteBookmark(jobSeekerId, bookmarkId);
  }

  async getMyBookmarks(jobSeekerId: string) {
    const bookmarks = await this.jobRepository.findBookmarksByJobSeeker(jobSeekerId);

    const scrappedJobsIds = bookmarks
      .filter((bookmark) => bookmark.jobSource === 'SCRAPED')
      .map((scrappedBookmark) => scrappedBookmark.jobId);

    const directJobsIds = bookmarks
      .filter((bookmark) => bookmark.jobSource === 'DIRECT')
      .map((directBookmark) => directBookmark.jobId);

    const [directJobs, scrappedJobs] = await Promise.all([
      this.jobRepository.findDirectJobByIds(directJobsIds),
      this.jobRepository.findScrapedJobByIds(scrappedJobsIds),
    ]);

    const directJobMap = new Map<string, DirectJob>(directJobs.map((job) => [job.id, job]));
    const scrapedJobMap = new Map<string, ScrapedJob>(scrappedJobs.map((job) => [job.id, job]));

    return bookmarks.flatMap((bookmark) => {
      const job =
        bookmark.jobSource === 'DIRECT'
          ? directJobMap.get(bookmark.jobId)
          : scrapedJobMap.get(bookmark.jobId);

      if (!job) return [];
      return [
        {
          bookmarkId: bookmark.id,
          bookmarkedAt: bookmark.createdAt,
          job,
        },
      ];
    });
  }
}
