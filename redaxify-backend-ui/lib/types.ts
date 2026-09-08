export type FolderWithVideos = Folder & {
  videos: Video[];
};

export type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

export interface UploadState {
  progress: number;
  status: UploadStatus;
  fileName?: string;
  error?: string;
}

export interface Video {
  id: number;
  azureVideoId: string;
  indexerVideoId?: string | null;
  videoName: string;
  videoSize: number;
  videoDuration: number;
  videoLocation: string;
  imageLocation: string | null;
  indexingStatus: "PENDING" | "SUCCESS" | "FAILED" | "PROCESSING";
  indexedAt: string | null;
  createdAt: string;
  updatedAt: string;
  customerNumber: number;
  folderId: number | null;
}

export interface Document {
  id: number;
  documentName: string;
  documentSize: number;
  blobName: string;
  createdAt: string;
  updatedAt: string;
  customerNumber: number;
  folderId: number;
}

export interface Folder {
  id: number;
  folderName: string;
  customerNumber: number;
  type: "document" | "video" | "audio" | "ocr" | "us-tax" | "bank-statement" | "driving-license" | "us-check";
  createdAt: string;
  updatedAt: string;
  documents: Document[];
  videos: Video[];
}

export interface FolderOld {
  id: number;
  folderName: string;
  videos: Video[];
  customerNumber: number;
  createdAt?: string;
  updatedAt?: string;
}



export interface SubscriptionPlan {
  id: number;
  name: string;
  description?: string;
  price: number;
  gpuLimit: number;
  storageLimit: number;
  durationDays: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Coupon {
  id: number;
  code: string;
  discountValue: number;
  discountType: 'percentage' | 'fixed';
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  usageLimit: number;
  userId?: number | null;
  user?: {
    name?: string;
    customerNumber?: number;
  } | null;
  usages?: CouponUsage[];
  totalUses?: number;
}

export interface CouponUsage {
  couponId: number;
  userId: number;
  timesUsed: number;
}

export interface User {
  id: number;
  customerNumber: number;
  name: string;
  email: string;
  stripeCustomerId?: string | null;
  currentSubscriptionId?: number | null;
}

export interface Subscription {
  id: number;
  userId: number;
  planId: number;
  status: 'ACTIVE' | 'CANCELED' | 'EXPIRED' | 'PAUSED' | 'TRIAL';
  startDate: Date;
  endDate: Date;
  isTrial: boolean;
  stripeSubId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Bill {
  id: number;
  customerNumber: number;
  subscriptionId: number;
  totalBill: number;
  gpuUsed: number;
  storageUsed: number;
  paymentStatus: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
  startDate: Date;
  endDate: Date;
  stripePaymentIntentId?: string | null;
  stripeCustomerId?: string | null;
  stripeInvoiceUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface CheckoutSessionRequest {
  planId: number;
  couponCode?: string;
  userId: number;
}

export interface CheckoutSessionResponse {
  url: string;
}