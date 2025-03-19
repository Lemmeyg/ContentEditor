# Content Editor

## Environment Setup

1. Copy the environment template:
```bash
cp .env.example .env.local
```

2. Update `.env.local` with your actual values:
- `NEXT_PUBLIC_OPENAI_API_KEY`: Your OpenAI API key from https://platform.openai.com/account/api-keys
- `NEXT_PUBLIC_OPENAI_ASSISTANT_ID`: Your OpenAI Assistant ID

⚠️ IMPORTANT: Never commit `.env.local` or any other files containing actual API keys to version control!

## Development

```bash
npm install
npm run dev
```

# ContentEditor2