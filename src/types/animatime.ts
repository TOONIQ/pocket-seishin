export interface AnimaTimeConfig {
  apiUrl: string;
  apiKey: string;
}

export interface AnimaTimeCut {
  id: string;
  projectName: string;
  episodeNumber: number;
  cutNumber: string;
  currentPhase: string;
  currentStatus: string;
  deadline?: string;
  assigneeId: string;
  updatedAt: string;
}

export interface AnimaTimeProcess {
  id: string;
  cutId: string;
  phase: string;
  status: string;
  deadline?: string;
  startedAt?: string;
  completedAt?: string;
}
