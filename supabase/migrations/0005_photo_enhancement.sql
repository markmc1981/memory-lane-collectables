-- Memory Lane Collectables — image tools: link an AI-enhanced listing photo
-- back to the untouched original it was made from. Run after 0004.
--
-- The photo_type enum already has 'ai_edited'; enhanced photos use that type.
-- We always keep the original (type 'original' or 'listing').

alter table item_photos
  add column original_photo_id uuid references item_photos (id) on delete set null;
