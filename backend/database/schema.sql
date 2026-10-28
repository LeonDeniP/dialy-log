CREATE TABLE IF NOT EXISTS reports (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  report_date DATE NOT NULL,
  shift TEXT NOT NULL,
  toa_on_duty JSONB NOT NULL DEFAULT '[]'::jsonb,
  mcr_on_duty TEXT NOT NULL,
  live_feed_name TEXT NOT NULL,
  status_report TEXT NOT NULL CHECK (status_report IN ('OK', 'Trouble', 'Maintenance', 'Trouble (Ext)')),
  car_device TEXT,
  mcr_device TEXT,
  qc_device TEXT,
  event_title TEXT,
  description TEXT,
  solution TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS reports_report_date_idx ON reports (report_date DESC);
CREATE INDEX IF NOT EXISTS reports_created_at_idx ON reports (created_at DESC);

CREATE OR REPLACE FUNCTION notify_reports_changed()
RETURNS TRIGGER AS $$
DECLARE
  changed_id BIGINT;
BEGIN
  changed_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END;
  PERFORM pg_notify(
    'reports_changed',
    json_build_object('operation', TG_OP, 'id', changed_id)::text
  );
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS reports_changed_trigger ON reports;
CREATE TRIGGER reports_changed_trigger
AFTER INSERT OR UPDATE OR DELETE ON reports
FOR EACH ROW EXECUTE FUNCTION notify_reports_changed();