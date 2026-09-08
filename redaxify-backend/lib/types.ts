export interface Video {
    id: number;
    azureVideoId: string;
    indexerVideoId: string | null;
    videoName: string;
    videoSize: number;
    videoDuration: number;
    videoLocation: string;
    imageLocation: string | null;
    indexingStatus: "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED";
    indexedAt: string | null;
    createdAt: string;
    updatedAt: string;
    customerNumber: number;
    folderId: number | null;
    publicViewLink?: string;
  }

  export interface EnvVariables {
    TENANT_ID: string;
    CLIENT_ID: string;
    CLIENT_SECRET: string;
    API_ENDPOINT: string;
    LOCATION: string;
    VI_ACCOUNT_ID: string;
    SUBSCRIPTION_ID: string;
    RESOURCE_GROUP: string;
    VI_ACCOUNT_NAME: string;
}
