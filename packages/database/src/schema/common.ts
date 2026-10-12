import { boolean, customType, date, integer, text, timestamp } from 'drizzle-orm/pg-core';

/** PostGIS geometry in WGS84 (SRID 4326). Values are EWKT/WKB strings; use ST_* functions in queries. */
export const geometry = customType<{ data: string; driverData: string }>({
  dataType() {
    return 'geometry(Geometry, 4326)';
  },
});

/** Columns shared by every research entity (rules/00-global.md §0.6). */
export const recordColumns = () => ({
  isFixture: boolean('is_fixture').notNull().default(false),
  revision: integer('revision').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});


export const researchDate = () => date('research_date');
export const id = () => text('id').primaryKey();
export const slug = () => text('slug').notNull().unique();
