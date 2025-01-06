export interface Collaborator {
  id: string;
  name?: string;
  email: string;
  imageUrl?: string;
  isOwner: boolean;
  role: 'owner' | 'viewer' | 'editor';
  lastActiveAt?: Date;
}

export interface CollaborationStatus {
  isEnabled: boolean;
  collaborators: Collaborator[];
} 