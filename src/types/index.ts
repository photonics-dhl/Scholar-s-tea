// Scholar's Tea Type Definitions

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  success: true;
  data: T;
  error: null;
  meta?: {
    page: number;
    pageSize: number;
    total: number;
  };
}

export interface ApiError {
  success: false;
  data: null;
  error: {
    code: string;
    message: string;
  };
}

// ============================================
// Group List Query Params
// ============================================

export interface GroupListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  institutionId?: string;
  disciplineId?: string;
  sortBy?: 'score' | 'createdAt' | 'name';
  sortOrder?: 'asc' | 'desc';
}

// ============================================
// Institution Tree (for cascading select)
// ============================================

export interface InstitutionWithColleges {
  id: string;
  name: string;
  logo: string | null;
  website: string | null;
  colleges: {
    id: string;
    name: string;
    departments: {
      id: string;
      name: string;
    }[];
  }[];
}

// ============================================
// Group with Relations (for detail page)
// ============================================

export interface GroupWithRelations {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  banner: string | null;
  description: string | null;
  institutionId: string;
  collegeId: string | null;
  departmentId: string | null;
  score: number;
  rank: number | null;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  createdAt: Date;
  updatedAt: Date;
  institution: {
    id: string;
    name: string;
    logo: string | null;
  };
  college: {
    id: string;
    name: string;
  } | null;
  department: {
    id: string;
    name: string;
  } | null;
  _count: {
    members: number;
    publications: number;
    news: number;
    patents: number;
    posts: number;
  };
  members: GroupMemberWithUser[];
  disciplines: {
    discipline: {
      id: string;
      name: string;
      slug: string;
    };
  }[];
}

export interface GroupMemberWithUser {
  id: string;
  role: 'LEADER' | 'ADVISOR' | 'MEMBER';
  joinedAt: Date;
  user: {
    id: string;
    name: string | null;
    avatar: string | null;
    email: string;
  };
}

// ============================================
// Create/Update Group DTOs
// ============================================

export interface CreateGroupDTO {
  name: string;
  slug: string;
  description?: string;
  institutionId: string;
  collegeId?: string;
  departmentId?: string;
  logo?: string;
  banner?: string;
}

export interface UpdateGroupDTO {
  name?: string;
  slug?: string;
  description?: string;
  institutionId?: string;
  collegeId?: string;
  departmentId?: string;
  logo?: string;
  banner?: string;
}

// ============================================
// Add Member DTO
// ============================================

export interface AddMemberDTO {
  userId: string;
  role: 'LEADER' | 'ADVISOR' | 'MEMBER';
}

// ============================================
// Re-export Prisma enums
// ============================================

export type { UserRole, MemberRole, VerificationStatus, MessageType, QuestionStatus } from '@prisma/client';
