export interface Assistant {
  id: string;
  name: string;
  description: string;
}

export const assistants: Assistant[] = [
  {
    id: process.env.NEXT_PUBLIC_OPENAI_ASSISTANT_ID || '',
    name: 'Content Strategist',
    description: 'TBD'
  },
  {
    id: process.env.NEXT_PUBLIC_OPENAI_ASSISTANT_ID_2 || '',
    name: 'Website Project Page Creator',
    description: 'Create a project Page for my website'
  },
  {
    id: process.env.NEXT_PUBLIC_OPENAI_ASSISTANT_ID_3 || '',
    name: 'Interview writer',
description: 'Write up the interview notes into a blog post'
  },
  {
    id: process.env.NEXT_PUBLIC_OPENAI_ASSISTANT_ID_4 || '',
    name: 'Linkedin1',
description: 'TBD'
  },
  {
    id: process.env.NEXT_PUBLIC_OPENAI_ASSISTANT_ID_5 || '',
    name: 'Linkedin2',
   description: 'TBD'
  }
]; 