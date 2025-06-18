-- drizzle/migrations/0001_seed_events.sql

INSERT INTO public.events (
  uuid, name, subtitle, description,
  date, start_time, end_time,
  location_name, price, metadata
) VALUES
  ( '11111111-1111-1111-1111-111111111111', 'Summer Music Concert', '…', '…', '2025-07-15', '09:00:00', '17:30:00', 'Central Park', 75.00, '{"artists":["Artist A","Artist B"],"genre":"pop"}' ),
  ( '22222222-2222-2222-2222-222222222222', 'Tech Conference 2025', '…', '…', '2025-08-20', '10:00:00', '16:00:00', 'Convention Center', 150.00, '{"speakers":10,"tracks":3}' );

