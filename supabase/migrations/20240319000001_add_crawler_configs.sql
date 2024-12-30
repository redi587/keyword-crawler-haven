-- Create crawler_configs table
create table public.crawler_configs (
    id bigint primary key generated always as identity,
    url text not null,
    start_time time,
    end_time time,
    check_interval integer,
    active boolean default true
);

-- Create index for better query performance
create index idx_crawler_configs_url on public.crawler_configs(url);

-- Enable Row Level Security (but allow all operations for now)
alter table public.crawler_configs enable row level security;

-- Create temporary policy that allows all operations
create policy "Allow all operations on crawler_configs" on public.crawler_configs for all using (true);