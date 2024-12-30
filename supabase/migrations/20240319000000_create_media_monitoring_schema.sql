-- Create keywords table
create table public.keywords (
    id bigint primary key generated always as identity,
    term text not null,
    active boolean default true,
    created_at timestamp with time zone default now()
);

-- Create articles table
create table public.articles (
    id bigint primary key generated always as identity,
    url text unique not null,
    title text,
    content text,
    crawled_at timestamp with time zone default now(),
    source text
);

-- Create matches table
create table public.matches (
    id bigint primary key generated always as identity,
    article_id bigint references articles(id),
    keyword_id bigint references keywords(id),
    matched_at timestamp with time zone default now()
);

-- Create indexes for better query performance
create index idx_keywords_term on public.keywords(term);
create index idx_articles_url on public.articles(url);
create index idx_matches_article_id on public.matches(article_id);
create index idx_matches_keyword_id on public.matches(keyword_id);

-- Enable Row Level Security (but allow all operations for now)
alter table public.keywords enable row level security;
alter table public.articles enable row level security;
alter table public.matches enable row level security;

-- Create temporary policies that allow all operations (will be replaced later with proper auth)
create policy "Allow all operations on keywords" on public.keywords for all using (true);
create policy "Allow all operations on articles" on public.articles for all using (true);
create policy "Allow all operations on matches" on public.matches for all using (true);