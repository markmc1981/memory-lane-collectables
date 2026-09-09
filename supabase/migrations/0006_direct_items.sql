-- Memory Lane Collectables — let an item be listed on its own, without a
-- clearance. The clearance/room-scan flow still works; this just makes the
-- link optional so "photograph one thing -> list it" needs no batch.
-- Run after 0005.

alter table stock_items alter column job_id drop not null;
alter table candidate_items alter column clearance_id drop not null;

-- Photos can be deleted from a clearance now (the app does this); the
-- candidate that referenced one should not block the delete.
alter table candidate_items
  drop constraint if exists candidate_items_source_media_id_fkey;
alter table candidate_items
  add constraint candidate_items_source_media_id_fkey
  foreign key (source_media_id) references clearance_media (id) on delete set null;
