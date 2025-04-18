export interface Assistant {
  id: string;
  name: string;
  description: string;
}

export const assistants = [
  {
    id: process.env.NEXT_PUBLIC_OPENAI_ASSISTANT_ID_1 || '',
    name: 'Generalist Creator',
    description: 'A General writer and editor'
  },
  {
    id: process.env.NEXT_PUBLIC_OPENAI_ASSISTANT_ID_2 || '',
    name: 'Editor',
    description: 'Create and Edit Content'
  },
  {
    id: process.env.NEXT_PUBLIC_OPENAI_ASSISTANT_ID_3 || '',
    name: 'Project Profile Creator',
    description: 'Create a project Page for website'
  },
  {
    id: process.env.NEXT_PUBLIC_OPENAI_ASSISTANT_ID_4 || '',
    name: 'Interview writer',
    description: 'Write up the interview notes into a blog post'
  },
  {
    id: process.env.NEXT_PUBLIC_OPENAI_ASSISTANT_ID_5 || '',
    name: 'Quick Email',
    description: 'TBD'
  }
]; 