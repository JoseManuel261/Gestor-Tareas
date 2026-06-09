export type Profile = {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
}

export type Group = {
  id: string
  name: string
  description: string | null
  owner_id: string
  created_at: string
  members?: GroupMember[]
}

export type GroupMember = {
  id: string
  group_id: string
  user_id: string
  role: 'owner' | 'admin' | 'member'
  joined_at: string
  profile?: Profile
}

export type Project = {
  id: string
  name: string
  description: string | null
  group_id: string | null
  owner_id: string
  created_at: string
  tasks?: Task[]
}

export type Comment = {
  id: string
  task_id: string
  author_id: string
  body: string
  created_at: string
  author?: Profile
}

export type Notification = {
  id: string
  user_id: string
  type: 'task_assigned' | 'task_status' | 'comment'
  title: string
  body: string | null
  link: string | null
  read: boolean
  created_at: string
}

export type Task = {
  id: string
  title: string
  description: string | null
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
  project_id: string
  assigned_to: string | null
  due_date: string | null
  created_at: string
  updated_at: string
  assignee?: Profile
}
